import 'dotenv/config';
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Thrivel ID',
  slug: 'thrivel-id',
  version: '3.1.0',
  orientation: 'portrait',
  scheme: 'thrivelid',
  platforms: ['ios', 'android'],
  icon: './assets/icon.png',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F4946E',
  },
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    buildNumber: '1',
    bundleIdentifier: 'com.brandandbrains.thrivelid',
  },
  android: {
    package: 'com.brandandbrains.thrivelid',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F4946E',
    },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-image-picker', 'expo-font'],
  extra: {
  apiBaseUrl:
    process.env.VITE_API_BASE_URL ||
    'https://thrivel-iq.brandandbrains.com',

  eas: {
    projectId: '246a5853-d5b6-4fa5-874a-7e3015a19999'
  }
}
});
