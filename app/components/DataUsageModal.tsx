import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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

interface DataUsageModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

const dataUsage = {
  total: '1.2 GB',
  breakdown: [
    {
      title: 'Articles',
      size: '450 MB',
      icon: 'newspaper-outline',
      percentage: 37.5,
    },
    {
      title: 'Images',
      size: '600 MB',
      icon: 'image-outline',
      percentage: 50,
    },
    {
      title: 'Cached Data',
      size: '150 MB',
      icon: 'save-outline',
      percentage: 12.5,
    },
  ],
};

export default function DataUsageModal({
  visible,
  onClose,
  isDark,
}: DataUsageModalProps) {
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
          paddingBottom: Platform.OS === 'ios' ? 90 : 85,
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
            Data Usage
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.totalSection}>
            <Text
              style={[
                styles.totalTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}>
              Total Storage Used
            </Text>
            <Text
              style={[
                styles.totalValue,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}>
              {dataUsage.total}
            </Text>
          </View>

          <View style={styles.breakdownSection}>
            <Text
              style={[
                styles.breakdownTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}>
              Storage Breakdown
            </Text>
            {dataUsage.breakdown.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.usageItem,
                  index === dataUsage.breakdown.length - 1 && styles.usageItemLast,
                ]}>
                <View style={styles.usageItemLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                    ]}>
                    <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                  </View>
                  <View style={styles.usageItemInfo}>
                    <Text
                      style={[
                        styles.usageItemTitle,
                        { color: isDark ? '#FFFFFF' : '#000000' },
                      ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.usageItemSize}>{item.size}</Text>
                  </View>
                </View>
                <View style={styles.percentageContainer}>
                  <View
                    style={[
                      styles.percentageBar,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                    ]}>
                    <View
                      style={[
                        styles.percentageFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.percentageText}>{item.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.clearButton,
              { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
            ]}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Clear All Data</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  totalTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  breakdownSection: {
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageItemLast: {
    marginBottom: 0,
  },
  usageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  usageItemInfo: {
    flex: 1,
  },
  usageItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  usageItemSize: {
    fontSize: 14,
    color: '#8E8E93',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 14,
    color: '#8E8E93',
    width: 40,
    textAlign: 'right',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});