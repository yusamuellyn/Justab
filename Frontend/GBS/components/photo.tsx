import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

function getApiUrl() {
  const host =
    Constants.expoGoConfig?.debuggerHost?.split(':')[0] ??
    Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:8000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}

export default function Photo() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
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

    if(!uploadPhoto.ok){
      throw new Error(`Upload Failed ${uploadPhoto.status}`);
    }

  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={(ref) => {
            cameraRef.current = ref;
          }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Take Photo" onPress={takePhoto} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    justifyContent: 'center',
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
