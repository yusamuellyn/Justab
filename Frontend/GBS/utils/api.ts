import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiUrl() {
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  return productionUrl?.replace(/\/$/, '');
}