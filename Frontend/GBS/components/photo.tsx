import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  type CameraType,
  type FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getApiUrl } from '../utils/api';

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';

export default function Photo() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });

    const formData = new FormData();
    formData.append('file', {
      uri: photo.uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);

    const uploadPhoto = await fetch(`${getApiUrl()}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await uploadPhoto.json();
    console.log('upload response:', data);

    if (!uploadPhoto.ok) {
      throw new Error(`Upload Failed ${uploadPhoto.status}`);
    }

    router.push(`/tip/${data.id}` as any);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    const formData = new FormData();
    formData.append('file', {
      uri: result.assets[0].uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);

    const uploadPhoto = await fetch(`${getApiUrl()}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await uploadPhoto.json();
    console.log('upload response:', data);

    if (!uploadPhoto.ok) {
      throw new Error(`Upload Failed ${uploadPhoto.status}`);
    }

    router.push(`/tip/${data.id}` as any);
  };

  const flashIcon =
    flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off';

  return (
    <View style={styles.fill}>
      <View style={styles.cameraSection}>
        <CameraView
          ref={(ref) => {
            cameraRef.current = ref;
          }}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash}
        />

        <View style={styles.cameraOverlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <View style={styles.topIcons}>
              <Pressable
                style={[styles.iconButton, flash !== 'off' && styles.iconButtonActive]}
                onPress={() => setFlash(flash === 'off' ? 'on' : flash === 'on' ? 'auto' : 'off')}
              >
                <Ionicons name={flashIcon} size={22} color={WHITE} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                <Ionicons name="camera-reverse-outline" size={22} color={WHITE} />
              </Pressable>
            </View>
          </View>

          <View style={styles.frameArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.hintText}>Align receipt inside the frame</Text>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.sideAction} onPress={pickFromGallery}>
            <View style={styles.sideIconWrap}>
              <Ionicons name="cloud-upload-outline" size={24} color={DEEP_OCEAN} />
            </View>
            <Text style={styles.sideActionLabel}>Upload from{'\n'}Gallery</Text>
          </TouchableOpacity>

          <View style={styles.shutterWrap}>
            <Pressable style={styles.shutterButton} onPress={takePhoto}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>

          <TouchableOpacity style={styles.sideAction} onPress={() => router.push('../party')}>
            <View style={styles.sideIconWrap}>
              <Image
                source={require('../assets/images/partyicon.png')}
                style={styles.partyIcon}
              />
            </View>
            <Text style={styles.sideActionLabel}>Join{'\n'}Party</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: COOL_GRAY_BG,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COOL_GRAY_BG,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: DEEP_OCEAN,
  },
  permissionButton: {
    backgroundColor: DEEP_OCEAN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 16,
  },
  cameraSection: {
    flex: 1,
    backgroundColor: DEEP_OCEAN,
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.72)',
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconButtonActive: {
    backgroundColor: DEEP_OCEAN,
    borderColor: WHITE,
  },
  frameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  scanFrame: {
    width: '78%',
    aspectRatio: 0.72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(30, 58, 95, 0.18)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: WHITE,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  hintText: {
    marginTop: 16,
    color: WHITE,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  bottomBar: {
    backgroundColor: COOL_GRAY_BG,
    paddingTop: 18,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COOL_GRAY,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  sideAction: {
    alignItems: 'center',
    width: 90,
  },
  sideIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COOL_GRAY,
  },
  partyIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  sideActionLabel: {
    marginTop: 6,
    fontSize: 11,
    textAlign: 'center',
    color: DEEP_OCEAN,
    lineHeight: 14,
    fontWeight: '500',
  },
  shutterWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: DEEP_OCEAN,
  },
  shutterInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: DEEP_OCEAN,
  },
});
