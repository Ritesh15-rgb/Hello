import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
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

interface EmailPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  initialEmail: string;
}

interface EmailPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function EmailPreferencesModal({
  visible,
  onClose,
  isDark,
  initialEmail,
}: EmailPreferencesModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [preferences, setPreferences] = useState<EmailPreference[]>([
    {
      id: 'newsDigest',
      title: 'Daily News Digest',
      description: 'Receive a daily summary of top stories',
      enabled: true,
    },
    {
      id: 'breakingNews',
      title: 'Breaking News',
      description: 'Get notified about important breaking news',
      enabled: true,
    },
    {
      id: 'weeklyNewsletter',
      title: 'Weekly Newsletter',
      description: 'Weekly curated content and analysis',
      enabled: false,
    },
    {
      id: 'recommendations',
      title: 'Personalized Recommendations',
      description: 'Receive content recommendations based on your interests',
      enabled: true,
    },
  ]);

  const scale = useSharedValue(1);

  const handleToggle = async (id: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    // Save logic here
    onClose();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
      <Animated.View
        entering={SlideInDown}
        exiting={SlideOutDown}
        style={[
          styles.modal,
          { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            paddingBottom: Platform.OS === 'ios' ? 50 : 80,
          },
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
            Email Preferences
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.emailSection}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.emailInput,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  color: isDark ? '#FFFFFF' : '#000000',
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.preferencesSection}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}>
              Email Notifications
            </Text>
            {preferences.map((preference, index) => (
              <View
                key={preference.id}
                style={[
                  styles.preferenceItem,
                  index === preferences.length - 1 && styles.preferenceItemLast,
                ]}>
                <View style={styles.preferenceInfo}>
                  <Text
                    style={[
                      styles.preferenceTitle,
                      { color: isDark ? '#FFFFFF' : '#000000' },
                    ]}>
                    {preference.title}
                  </Text>
                  <Text style={styles.preferenceDescription}>
                    {preference.description}
                  </Text>
                </View>
                <Switch
                  value={preference.enabled}
                  onValueChange={() => handleToggle(preference.id)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isDark ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1000,
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
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  emailSection: {
    marginBottom: 24,
  },
  preferencesSection: {
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emailInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  preferenceItemLast: {
    borderBottomWidth: 0,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
});