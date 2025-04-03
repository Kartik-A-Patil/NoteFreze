import React, { useEffect, useState, memo, useCallback } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { authenticateForLockedNote } from '@/utils/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Collapsible } from '@/components/Collapsible';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface LockModalProps {
  visible: boolean;
  onAuthSuccess: () => void;
  onAuthFail: () => void;
  onDismiss: () => void;
  noteTitle?: string;
  isSavingOperation?: boolean; // New prop to identify if this is during a save operation
}

// Use memo to prevent unnecessary re-renders of the entire component
const LockModal = memo(({ visible, onAuthSuccess, onAuthFail, onDismiss, noteTitle, isSavingOperation = false }: LockModalProps) => {
  const [authenticating, setAuthenticating] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setAuthAttempts(0);
    }
  }, [visible]);

  // Memoize the authentication function to prevent recreation on each render
  const authenticate = useCallback(async () => {
    // Avoid multiple authentication attempts running simultaneously
    if (authenticating) return;
    
    try {
      setAuthenticating(true);
      
      // Apply haptic feedback if on a real device
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      
      const success = await authenticateForLockedNote(noteTitle);
      
      if (success) {
        onAuthSuccess();
      } else {
        setAuthAttempts(prev => prev + 1);
        // Only call onAuthFail after multiple failures to avoid accidental dismissals
        if (authAttempts >= 2) {
          onAuthFail();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, noteTitle, onAuthSuccess, onAuthFail, authAttempts]);

  // Start authentication automatically when modal becomes visible
  useEffect(() => {
    if (visible && !authenticating) {
      // Short delay to ensure modal is fully visible before authentication starts
      const timer = setTimeout(() => {
        authenticate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, authenticate, authenticating]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={36} color="#FFC107" />
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={styles.title}>
              {isSavingOperation ? "Confirm Lock Note" : "Authentication Required"}
            </ThemedText>
            
            {noteTitle && (
              <ThemedText style={styles.subtitle}>
                {isSavingOperation 
                  ? "Authenticate to lock this note securely"
                  : `To access "${noteTitle.length > 30 ? noteTitle.substring(0, 30) + '...' : noteTitle}"`
                }
              </ThemedText>
            )}
          </View>
          
          <View style={styles.statusContainer}>
            {authenticating ? (
              <ActivityIndicator size="small" color="#FFC107" />
            ) : (
              <ThemedText style={styles.statusText}>
                {authAttempts > 0 
                  ? 'Authentication failed. Try again.' 
                  : isSavingOperation 
                    ? 'Use biometrics to confirm' 
                    : 'Use biometrics to unlock'
                }
              </ThemedText>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.authButton} 
            onPress={authenticate}
            disabled={authenticating}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print" size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onDismiss}
            disabled={authenticating}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Darker semi-transparent background instead of blur
  },
  contentContainer: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: 'rgba(20, 20, 20, 0.7)', // Subtle background for the modal content
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFC107',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statusContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  authButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cancelButton: {
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
});

export { LockModal };