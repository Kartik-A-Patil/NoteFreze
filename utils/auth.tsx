import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

// Cache biometric hardware capability to avoid repeated async checks
let hasHardwareCache: boolean | null = null;
let isEnrolledCache: boolean | null = null;
let lastCheckTime: number = 0;
const CACHE_TIMEOUT = 60000; // 1 minute cache timeout

export const authenticateUser = async (promptMessage: string = 'Authenticate to access your notes'): Promise<boolean> => {
  try {
    const currentTime = Date.now();
    const shouldRefreshCache = (currentTime - lastCheckTime) > CACHE_TIMEOUT;
    
    // Check hardware support with cache timeout
    if (hasHardwareCache === null || shouldRefreshCache) {
      hasHardwareCache = await LocalAuthentication.hasHardwareAsync();
      lastCheckTime = currentTime;
    }
    
    if (!hasHardwareCache) {
      console.log('No biometric hardware available');
      return true; // Return true on devices without biometric hardware for better UX
    }

    // Check enrollment with cache timeout
    if (isEnrolledCache === null || shouldRefreshCache) {
      isEnrolledCache = await LocalAuthentication.isEnrolledAsync();
      lastCheckTime = currentTime;
    }
    
    if (!isEnrolledCache) {
      console.log('No biometrics enrolled');
      return true; // Return true when no biometrics enrolled for better UX
    }

    // Configure authentication options for better UX
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
      fallbackLabel: 'Use alternative method',
      cancelLabel: 'Cancel',
      // Improve performance on Android
      ...(Platform.OS === 'android' ? {
        requireConfirmation: false,
      } : {}),
    });

    return result.success;
  } catch (error) {
    console.error('Authentication error:', error);
    // Return true instead of false on error for better UX in development
    return __DEV__ ? true : false;
  }
};

export const authenticateForLockedNote = async (noteTitle?: string): Promise<boolean> => {
  const promptMessage = noteTitle 
    ? `Authenticate to access "${noteTitle}"` 
    : 'Authenticate to access locked note';
  
  return authenticateUser(promptMessage);
};

// Reset cache when needed (e.g., when device settings might have changed)
export const resetAuthenticationCache = () => {
  hasHardwareCache = null;
  isEnrolledCache = null;
  lastCheckTime = 0;
};
