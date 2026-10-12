import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { cropCover, frameRect } from '../onboarding/documentFrame';
import { useCopy } from '../i18n';
import { colors } from '../theme';

export interface DocumentCameraProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onCaptured: (uri: string) => void;
}

export function DocumentCamera({ visible, title, onCancel, onCaptured }: DocumentCameraProps) {
  const uz = useCopy();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { width: winW, height: winH } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewSize, setViewSize] = useState({ width: winW, height: winH });

  const frame = frameRect(viewSize.width, viewSize.height);

  const capture = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const photo: CameraCapturedPicture | undefined = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
      });
      if (!photo?.uri || !photo.width || !photo.height) {
        setError(uz.documentCamera.captureError);
        return;
      }
      const crop = cropCover(
        { width: photo.width, height: photo.height },
        viewSize,
        frame,
      );
      const cropped = await manipulateAsync(photo.uri, [{ crop }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      onCaptured(cropped.uri);
    } catch (err) {
      console.error('Document camera capture', err);
      setError(uz.documentCamera.captureError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        {!permission?.granted ? (
          <View style={styles.permission}>
            <Text style={styles.permissionTitle}>{uz.documentCamera.permissionTitle}</Text>
            <Text style={styles.permissionBody}>{uz.documentCamera.permissionBody}</Text>
            <Pressable
              onPress={() => void requestPermission()}
              style={({ pressed }) => [styles.shotButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={uz.documentCamera.permissionButton}
            >
              <Text style={styles.shotLabel}>{uz.documentCamera.permissionButton}</Text>
            </Pressable>
            <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button">
              <Text style={styles.cancelText}>{uz.common.cancel}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              mode="picture"
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width > 0 && height > 0) setViewSize({ width, height });
              }}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={[styles.mask, { height: frame.y }]} />
              <View style={{ flexDirection: 'row', height: frame.height }}>
                <View style={[styles.mask, { width: frame.x }]} />
                <View style={[styles.hole, { width: frame.width, height: frame.height }]}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <View style={[styles.mask, { flex: 1 }]} />
              </View>
              <View style={[styles.mask, { flex: 1 }]} />
            </View>

            <View style={styles.topBar}>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.common.cancel}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.bottom}>
              <Text style={styles.hint}>{uz.documentCamera.hint}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={() => void capture()}
                disabled={busy}
                style={({ pressed }) => [styles.shutter, pressed && styles.pressed, busy && styles.shutterBusy]}
                accessibilityRole="button"
                accessibilityLabel={uz.documentCamera.capture}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
              <Text style={styles.captureLabel}>
                {busy ? uz.documentCamera.capturing : uz.documentCamera.capture}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const CORNER = 22;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  overlay: { ...StyleSheet.absoluteFillObject },
  mask: { backgroundColor: 'rgba(0,0,0,0.58)' },
  hole: { position: 'relative' },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 36, alignItems: 'center' },
  hint: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  error: { color: '#FCA5A5', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterBusy: { opacity: 0.7 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
  captureLabel: { marginTop: 10, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  permissionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  permissionBody: { color: '#CBD5E1', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  shotButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  shotLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#94A3B8', fontSize: 15, fontWeight: '600', marginTop: 8 },
  pressed: { opacity: 0.85 },
});
