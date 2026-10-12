import React, { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { filesApi } from '../api/client';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { AuthImage } from './AuthImage';

export type PhotoPickerMode = 'any' | 'camera' | 'framed';

interface PhotoPickerProps {
  label: string;
  hint?: string;
  value?: string | null; // existing fileKey
  onUploaded: (fileKey: string) => void;
  required?: boolean;
  style?: ViewStyle;
  /** framed = faqat kamera + hujjat ramkasi; camera = faqat kamera; any = kamera yoki galereya */
  mode?: PhotoPickerMode;
  showLabel?: boolean;
}

export function PhotoPicker({
  label,
  hint,
  value,
  onUploaded,
  required = false,
  style,
  mode = 'any',
  showLabel = true,
}: PhotoPickerProps) {
  const uz = useCopy();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileKey, setCurrentFileKey] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [framedOpen, setFramedOpen] = useState(false);

  const processAndUpload = async (localUri: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Resize to max 1600px width and compress with JPEG 0.7
      const manipulated = await manipulateAsync(
        localUri,
        [{ resize: { width: 1600 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      // 2. Upload multipart file to server
      const uploadRes = await filesApi.uploadFile(
        manipulated.uri,
        'image/jpeg',
        `photo_${Date.now()}.jpg`
      );

      setCurrentFileKey(uploadRes.fileKey);
      onUploaded(uploadRes.fileKey);
    } catch (err: unknown) {
      console.error('Failed to process/upload image', err);
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Rasm yuklashda xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Ruxsat kerak',
          'Rasmga olish uchun kamera ruxsatini yoqing.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndUpload(asset.uri);
      }
    } catch (err) {
      console.error('Camera error', err);
      setError('Kamerani ochishda xatolik yuz berdi.');
    }
  };

  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Ruxsat kerak',
          'Rasmni tanlash uchun galereya ruxsatini yoqing.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndUpload(asset.uri);
      }
    } catch (err) {
      console.error('Gallery error', err);
      setError('Galereyani ochishda xatolik yuz berdi.');
    }
  };

  const showPickOptions = () => {
    if (mode === 'framed') {
      setFramedOpen(true);
      return;
    }
    if (mode === 'camera') {
      void handlePickCamera();
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Bekor qilish', 'Kamera orqali rasmga olish', 'Galereyadan tanlash'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handlePickCamera();
          else if (buttonIndex === 2) handlePickGallery();
        }
      );
    } else {
      Alert.alert(label, 'Rasmni qayerdan yuklamoqchisiz?', [
        { text: uz.common.cancel, style: 'cancel' },
        { text: uz.common.camera, onPress: handlePickCamera },
        { text: uz.common.gallery, onPress: handlePickGallery },
      ]);
    }
  };

  const handleFramedCaptured = async (uri: string) => {
    setFramedOpen(false);
    await processAndUpload(uri);
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && label ? (
        <View style={styles.headerRow}>
          <Text style={styles.label}>
            {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
          </Text>
        </View>
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {currentFileKey ? (
        <View style={styles.previewContainer}>
          <AuthImage
            fileKey={currentFileKey}
            style={styles.previewImage}
            containerStyle={styles.imageBox}
            accessibilityLabel={label}
          />

          <View style={styles.previewControls}>
            <Pressable
              onPress={showPickOptions}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.changeButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Rasmni almashtirish"
            >
              <Ionicons name="refresh" size={16} color="#1f2937" style={{ marginRight: 6 }} />
              <Text style={styles.changeButtonText}>{uz.common.changePhoto}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={showPickOptions}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.uploadCard,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${label} yuklash`}
        >
          {isProcessing ? (
            <View style={styles.processingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.processingText}>Rasm yuklanmoqda…</Text>
            </View>
          ) : (
            <View style={styles.uploadPrompt}>
              <Ionicons name="camera-outline" size={34} color={colors.primary} style={styles.cameraIcon} />
              <Text style={styles.uploadTitle}>
                {mode === 'framed' || mode === 'camera' ? uz.documentCamera.capture : uz.common.uploadPhoto}
              </Text>
              <Text style={styles.uploadSub}>
                {mode === 'framed'
                  ? uz.documentCamera.hint
                  : mode === 'camera'
                    ? uz.common.camera
                    : uz.common.cameraOrGallery}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {framedOpen ? <LazyDocumentCamera
        visible
        title={label || uz.documentCamera.capture}
        onCancel={() => setFramedOpen(false)}
        onCaptured={(uri) => void handleFramedCaptured(uri)}
      /> : null}
    </View>
  );
}

/** expo-camera login/trip barrelida yuklanmasin — faqat ramkali rejim ochilganda. */
function LazyDocumentCamera(props: {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onCaptured: (uri: string) => void;
}) {
  const { DocumentCamera } = require('./DocumentCamera') as typeof import('./DocumentCamera');
  return <DocumentCamera {...props} />;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  requiredStar: {
    color: '#dc2626',
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  uploadCard: {
    minHeight: 140,
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  cameraIcon: {
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  uploadSub: {
    fontSize: 13,
    color: '#4b5563',
  },
  processingBox: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  imageBox: {
    width: '100%',
    height: 180,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
    marginTop: 6,
  },
  pressed: {
    opacity: 0.85,
  },
});
