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

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ProfileData) => void;
  initialData: ProfileData;
  isDark: boolean;
}

export interface ProfileData {
  name: string;
  email: string;
  bio: string;
  phone: string;
  location: string;
}

export default function EditProfileModal({
  visible,
  onClose,
  onSave,
  initialData,
  isDark,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onSave(formData);
    onClose();
  };

  const handleFieldChange = async (field: keyof ProfileData, value: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.overlay, StyleSheet.absoluteFill]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 60 : 100}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[
            styles.modal,
            { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            animatedStyle,
          ]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <Text
              style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, formData.name.trim() === '' && styles.saveButtonDisabled]}>
              <Text style={[
                styles.saveButtonText,
                formData.name.trim() === '' && styles.saveButtonTextDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={formData.name}
                onChangeText={(text) => handleFieldChange('name', text)}
                placeholder="Your name"
                placeholderTextColor="#8E8E93"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={formData.email}
                onChangeText={(text) => handleFieldChange('email', text)}
                placeholder="Your email"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Bio
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={formData.bio}
                onChangeText={(text) => handleFieldChange('bio', text)}
                placeholder="Tell us about yourself"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Phone
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={formData.phone}
                onChangeText={(text) => handleFieldChange('phone', text)}
                placeholder="Your phone number"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputGroupLast]}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Location
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={formData.location}
                onChangeText={(text) => handleFieldChange('location', text)}
                placeholder="Your location"
                placeholderTextColor="#8E8E93"
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
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupLast: {
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
});