import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiUrl() {
  const host =
    Constants.expoGoConfig?.debuggerHost?.split(':')[0] ??
    Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:8000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}