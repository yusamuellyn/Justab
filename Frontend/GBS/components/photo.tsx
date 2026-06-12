import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getApiUrl } from '../utils/api';
import { Image } from 'react-native';

const GREEN = '#22C55E';

export default function Photo() {
  const [permission, requestPermission] = useCameraPermissions();
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

    router.push(`/tip/${data.id}` as any)
  };

  return (
    <View style={styles.fill}>
      <View style={styles.cameraSection}>
        <CameraView
          ref={(ref) => {
            cameraRef.current = ref;
          }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.cameraOverlay}>
          <View style={styles.topIcons}>
            {/* Adjust This later */}
            <Ionicons name="flash-off" size={26} color="#fff" />
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </View>

         
        </View>
      </View>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.bottomActions}>
          <View style={styles.sideAction}>
            <Ionicons name="cloud-upload-outline" size={28} color="#000" />
            {/* Adjust This later */}
            <Text style={styles.sideActionLabel}>Upload from{'\n'}Gallery</Text> 
          </View>

          <View style={styles.shutterWrap}>
            <View style={styles.shutterRing3} />
            <View style={styles.shutterRing2} />
            <View style={styles.shutterRing1} />
            <Pressable style={styles.shutterButton} onPress={takePhoto} />
          </View>

          <View style={styles.sideAction}>
            {/* Adjust This later */}
            <TouchableOpacity onPress={() => router.push('../party')}> 
             <Image source={require('../assets/images/partyicon.png')} style={{ width: 90, height: 90 }} />
             <Text style={styles.sideActionLabel}>Join{'\n'}Party</Text> 
            </TouchableOpacity>


          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#fff',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cameraSection: {
    flex: 1,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topIcons: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 8,
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
  sideActionLabel: {
    marginTop: 6,
    fontSize: 11,
    textAlign: 'center',
    color: '#000',
    lineHeight: 14,
  },
  shutterWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing3: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  shutterRing2: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  shutterRing1: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  shutterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
  },
});