import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  ScrollView,
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

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function PrivacySettingsModal({
  visible,
  onClose,
  isDark,
}: PrivacySettingsModalProps) {
  const [settings, setSettings] = useState({
    dataCollection: true,
    locationTracking: false,
    personalization: true,
    thirdPartySharing: false,
    analytics: true,
  });

  const handleToggle = async (setting: keyof typeof settings) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
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
      <Animated.View
  entering={SlideInDown}
  exiting={SlideOutDown}
  style={[
    styles.modal,
    { 
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      paddingBottom: Platform.OS === 'ios' ? 90 : 85, // Add padding to account for tab bar
    },
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
            Privacy Settings
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.description, { color: isDark ? '#8E8E93' : '#3A3A3C' }]}>
            Manage how your data is collected and used in the app.
          </Text>

          {Object.entries(settings).map(([key, value], index) => (
            <View
              key={key}
              style={[
                styles.settingItem,
                index === Object.entries(settings).length - 1 && styles.settingItemLast,
              ]}>
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text 
                  style={[
                    styles.settingDescription,
                    { color: isDark ? '#8E8E93' : '#3A3A3C' },
                  ]}>
                  {getSettingDescription(key)}
                </Text>
              </View>
              <Switch
                value={value}
                onValueChange={() => handleToggle(key as keyof typeof settings)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? (isDark ? '#007AFF' : '#007AFF') : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

function getSettingDescription(setting: string): string {
  const descriptions: Record<string, string> = {
    dataCollection: 'Allow us to collect data about your app usage to improve our services',
    locationTracking: 'Enable location-based features and recommendations',
    personalization: 'Personalize your experience based on your preferences',
    thirdPartySharing: 'Share your data with trusted third-party partners',
    analytics: 'Help us improve by sending anonymous usage statistics',
  };
  return descriptions[setting] || '';
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});