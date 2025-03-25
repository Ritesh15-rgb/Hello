import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ContactSupportModal({
  visible,
  onClose,
  isDark,
}: ContactSupportModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Here you would typically send the support request
    alert('Support request sent successfully!');
    onClose();
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
              Contact Support
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.sendButton,
                (!email || !subject || !message) && styles.sendButtonDisabled,
              ]}>
              <Text
                style={[
                  styles.sendButtonText,
                  (!email || !subject || !message) && styles.sendButtonTextDisabled,
                ]}>
                Send
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
                value={email}
                onChangeText={setEmail}
                placeholder="Your email address"
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
                Subject <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={subject}
                onChangeText={setSubject}
                placeholder="What's your issue about?"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputGroupLast]}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}>
                Message <Text style={styles.required}>*</Text>
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
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue in detail"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
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
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
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
    height: 120,
    paddingTop: 12,
  },
});