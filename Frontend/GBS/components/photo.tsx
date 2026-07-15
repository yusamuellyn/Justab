import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  type CameraType,
  type FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
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
import { getApiUrl, apiHeaders } from '../utils/api';
import { C } from '@/constants/theme';

export default function Photo() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Wake the backend early so the first upload lands on a warm server
    // (avoids free-tier cold-start timeout). Fire-and-forget.
    fetch(`${getApiUrl()}/`).catch(() => {});
  }, []);

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
        headers: apiHeaders(),
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
            { text: 'Continue', onPress: () => router.push(`/tip/${data.partyID}` as any) },
          ]
        );
        return;
      }
  
      router.push(`/tip/${data.partyID}` as any);
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
        headers: apiHeaders(),
        body: formData,
      });
  
      const data = await uploadPhoto.json();
      console.log('upload response:', data);
  
      if (!uploadPhoto.ok) {
        throw new Error(`Upload Failed ${uploadPhoto.status}`);
      }
      if (!data.partyID) {
        throw new Error(data.error || 'Invalid receipt');
      }
  
      router.push(`/tip/${data.partyID}` as any);
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
          <ActivityIndicator size="small" color={C.white} />
          <Text style={styles.loadingBannerText}>Loading...</Text>
        </View>
      )}
      {error && (
      <View style={styles.errorBanner}>
        <Ionicons name="alert-circle-outline" size={16} color={C.white} />
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
                <Ionicons name={flashIcon} size={22} color={C.white} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                <Ionicons name="camera-reverse-outline" size={22} color={C.white} />
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
              <Ionicons name="cloud-upload-outline" size={24} color={C.deepOcean} />
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
    backgroundColor: C.coolGrayBg,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: C.coolGrayBg,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: C.deepOcean,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: C.deepOcean,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.deepOcean,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  permissionButtonText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 16,
  },
  cameraSection: {
    flex: 1,
    backgroundColor: C.deepOcean,
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: 'rgba(30, 58, 95, 0.78)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconButtonActive: {
    backgroundColor: C.deepOcean,
    borderColor: C.white,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: C.white,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  hintText: {
    marginTop: 18,
    color: C.white,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    opacity: 0.92,
  },
  bottomBar: {
    backgroundColor: C.coolGrayBg,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: C.deepOcean,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  sideAction: {
    alignItems: 'center',
    width: 90,
  },
  sideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.deepOcean,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  partyIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  sideActionLabel: {
    marginTop: 7,
    fontSize: 11,
    textAlign: 'center',
    color: C.deepOcean,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  shutterWrap: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.deepOcean,
    shadowColor: C.deepOcean,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.deepOcean,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: C.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 8,
    zIndex: 30,
  },
  loadingBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: C.deepOcean,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 8,
    zIndex: 30,
  },
  loadingBannerText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBannerText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },
});