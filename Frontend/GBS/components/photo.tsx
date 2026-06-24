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
  ActivityIndicator,
  Alert,
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
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(false);
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

    try {
      //take photo
      setLoading(true);
      setLoadingMessage('Uploading');
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

      if (data.warning) {
        Alert.alert(
          "Couldn't Find Items",
          "We couldn't detect any items on the receipt. You can still manually the add items.",
          [
            { text: 'Try Again' },
            { text: 'Continue', onPress: () => router.push(`/tip/${data.id}` as any) },
          ]
        );
        return;
      }
  
      router.push(`/tip/${data.id}` as any);
    } catch (error) {
      
      setError(true);
      setTimeout(()=> setError(false), 3000);
      

    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    try {
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
  
      if (result.canceled || !result.assets[0]?.uri) return;
      setLoading(true);
      setLoadingMessage('Uploading');
  
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
      if (!data.id) {
        throw new Error(data.error || 'Invalid receipt');
      }
  
      router.push(`/tip/${data.id}` as any);
    } catch (error) {
      setError(true);
      setTimeout(()=> setError(false), 3000);
    }finally{
      setLoading(false);
      setLoadingMessage('');
    }
    
  };

  const flashIcon =
    flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off';

  return (
    <View style={styles.fill}>
      <View style={styles.cameraSection}>
      {loading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={WHITE} />
          <Text style={styles.loadingBannerText}>Loading...</Text>
        </View>
      )}
      {error && (
      <View style={styles.errorBanner}>
        <Ionicons name="alert-circle-outline" size={16} color={WHITE} />
        <Text style={styles.errorBannerText}>Upload failed. Try again.</Text>
      </View>
      )}

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
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C0392B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    zIndex: 30,
  },
  loadingBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DEEP_OCEAN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    zIndex: 30,
  },
  loadingBannerText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBannerText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});