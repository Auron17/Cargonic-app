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
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { filesApi } from '../api/client';
import { AuthImage } from './AuthImage';

interface PhotoPickerProps {
  label: string;
  hint?: string;
  value?: string | null; // existing fileKey
  onUploaded: (fileKey: string) => void;
  required?: boolean;
  style?: ViewStyle;
}

export function PhotoPicker({
  label,
  hint,
  value,
  onUploaded,
  required = false,
  style,
}: PhotoPickerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileKey, setCurrentFileKey] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

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
        { text: 'Bekor qilish', style: 'cancel' },
        { text: '📷 Kamera', onPress: handlePickCamera },
        { text: '🖼️ Galereya', onPress: handlePickGallery },
      ]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
        </Text>
      </View>

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
              <Text style={styles.changeButtonText}>🔄 Almashtirish</Text>
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
              <ActivityIndicator color="#1a56db" size="large" />
              <Text style={styles.processingText}>Rasm yuklanmoqda…</Text>
            </View>
          ) : (
            <View style={styles.uploadPrompt}>
              <Text style={styles.cameraIcon}>📸</Text>
              <Text style={styles.uploadTitle}>Rasm yuklash</Text>
              <Text style={styles.uploadSub}>Kameradan yoki galereyadan</Text>
            </View>
          )}
        </Pressable>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
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
    fontSize: 34,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a56db',
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
    color: '#1a56db',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
