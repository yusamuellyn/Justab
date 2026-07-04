import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiUrl() {
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  return productionUrl?.replace(/\/$/, '');
}

export function getApiKey() {
  return process.env.EXPO_PUBLIC_API_KEY ?? '';
}

export function apiHeaders(extra?: Record<string, string>) {
  return { 'x-api-key': getApiKey(), ...(extra ?? {}) };
}