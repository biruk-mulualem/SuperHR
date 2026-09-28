import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Local fallback ONLY for `npx expo start` (no build env vars available)
const LOCAL_DEFAULT =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3001/api'
    : 'http://localhost:3001/api';

const getDevUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost') {
      return `http://${host}:3001/api`;
    }
  }
  return LOCAL_DEFAULT;
};

// __DEV__ is true for `expo start` and `development` builds.
// For any other build (preview/production), EXPO_PUBLIC_API_URL is
// injected from eas.json's "env" block.
export const API_BASE = __DEV__
  ? getDevUrl()
  : process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE) {
  console.warn(
    '⚠️ EXPO_PUBLIC_API_URL is not set. Check eas.json for this build profile.'
  );
}