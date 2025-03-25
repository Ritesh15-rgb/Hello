import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

// Define the props interface
interface AboutExpoModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  version?: string;
}

const AboutExpoModal = ({ visible, onClose, isDark, version = '1.0.0' }: AboutExpoModalProps) => {
  const { width } = useWindowDimensions();
  const appVersion = version;
  
  // Team members data
  const teamMembers = [
    { name: 'Jane Smith', role: 'Lead Developer' },
    { name: 'John Doe', role: 'UI/UX Designer' },
    { name: 'Alex Johnson', role: 'Product Manager' },
    { name: 'Sam Taylor', role: 'Content Strategist' },
  ];

  // List of app features
  const features = [
    'Personalized news recommendations',
    'Dark mode support',
    'Offline reading',
    'Content bookmarking',
    'AI-powered assistance',
    'Cross-platform synchronization',
    'Privacy-focused design',
  ];
  
  const handleClose = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };
  
  const handleLinkPress = async (url: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    Linking.openURL(url);
  };
  
  const styles = createStyles(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: width > 500 ? 500 : width * 0.9 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>About Expo X</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Ionicons name="book" size={64} color="#6A94B6" />
              </View>
              <Text style={styles.appName}>Expo X</Text>
              <Text style={styles.versionText}>Version {appVersion}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the App</Text>
              <Text style={styles.sectionText}>
                Expo X is a modern news and content discovery platform designed to provide personalized 
                reading experiences. Our mission is to connect readers with the content they love while 
                maintaining privacy and offering innovative features.
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Features</Text>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#6A94B6" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meet the Team</Text>
              <View style={styles.teamContainer}>
                {teamMembers.map((member, index) => (
                  <View key={index} style={styles.teamMember}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{member.name[0]}</Text>
                    </View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => handleLinkPress('https://example.com/terms')}
              >
                <Text style={styles.linkText}>Terms of Service</Text>
                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => handleLinkPress('https://example.com/privacy')}
              >
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => handleLinkPress('https://example.com/licenses')}
              >
                <Text style={styles.linkText}>Open Source Licenses</Text>
                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>© {new Date().getFullYear()} Expo X. All rights reserved.</Text>
              <TouchableOpacity 
                onPress={() => handleLinkPress('https://example.com')}
                style={styles.websiteLink}
              >
                <Text style={styles.websiteLinkText}>Visit our website</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 16,
    },
    logoContainer: {
      alignItems: 'center',
      marginVertical: 24,
    },
    logoWrapper: {
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    appName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4,
    },
    versionText: {
      fontSize: 14,
      color: '#8E8E93',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12,
    },
    sectionText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#CCCCCC' : '#333333',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    featureText: {
      fontSize: 16,
      color: isDark ? '#CCCCCC' : '#333333',
      marginLeft: 10,
    },
    teamContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    teamMember: {
      width: '48%',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#6A94B6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarInitial: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4,
      textAlign: 'center',
    },
    memberRole: {
      fontSize: 14,
      color: '#8E8E93',
      textAlign: 'center',
    },
    linkButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 10,
      marginBottom: 12,
    },
    linkText: {
      fontSize: 16,
      color: '#007AFF',
    },
    footer: {
      marginTop: 12,
      alignItems: 'center',
      paddingBottom: 20,
    },
    footerText: {
      fontSize: 14,
      color: '#8E8E93',
      marginBottom: 8,
    },
    websiteLink: {
      paddingVertical: 8,
    },
    websiteLinkText: {
      fontSize: 16,
      color: '#007AFF',
    },
  });

export default AboutExpoModal;