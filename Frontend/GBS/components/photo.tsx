import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function Photo() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
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

    // Save to user's gallery (recommended "permanent" save location)
    const formData = new FormData();

    formData.append('file', {
      uri: photo.uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch('http://149.125.69.75:8000/upload', {
      method: 'POST',
      body: formData,
    });

    const text = await res.text();
    console.log('upload status:', res.status, text);
    
    setShowCamera(false);
  };

  
  if(!showCamera){
    return (
      <Button title = "Open Camera" onPress = {()=> setShowCamera(true)}/>
    )
  }
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

        <Button
          title="Close Camera"
          onPress={() => setShowCamera(false)}
        />
        <Button title = "Take Photo" onPress = {takePhoto}/>
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
