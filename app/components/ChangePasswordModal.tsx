import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  isDark,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scale = useSharedValue(1);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onClose();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.overlay, StyleSheet.absoluteFill]}>
      <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[styles.modal, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            paddingBottom: Platform.OS === 'ios' ? 90 : 85,
          }, animatedStyle]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Change Password</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={[styles.saveButtonText, { color: isDark ? '#FFFFFF' : '#007AFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', color: isDark ? '#FFFFFF' : '#000000' }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={isDark ? '#A1A1A1' : '#8E8E93'}
                secureTextEntry={!showCurrentPassword}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', color: isDark ? '#FFFFFF' : '#000000' }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={isDark ? '#A1A1A1' : '#8E8E93'}
                secureTextEntry={!showNewPassword}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', color: isDark ? '#FFFFFF' : '#000000' }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={isDark ? '#A1A1A1' : '#8E8E93'}
                secureTextEntry={!showConfirmPassword}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    zIndex: 1001,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
});