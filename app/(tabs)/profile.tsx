import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import Animated, {
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import EditProfileModal, { ProfileData } from '../components/EditProfileModal';
import ContactSupportModal from '../components/ContactSupportModal';
import PrivacySettingsModal from '../components/PrivacySettingsModal';
import EmailPreferencesModal from '../components/EmailPreferencesModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import HelpCenterModal from '../components/HelpCenterModal';
import DataUsageModal from '../components/DataUsageModal';
import ChatbotModal from '../components/ChatbotModal';
import * as Haptics from 'expo-haptics';

const stats = [
  { value: '47', label: 'Articles Read' },
  { value: '12', label: 'Saved' },
  { value: '5', label: 'Following' },
];

// Define the sections array with the new AI Assistant section included
const sections = [
  {
    title: 'App Settings',
    items: [
      { icon: 'notifications-outline', label: 'Push Notifications', type: 'toggle' },
      { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle' },
      { icon: 'wifi-outline', label: 'Offline Reading', type: 'toggle' },
    ],
  },
  {
    title: 'Content Preferences',
    items: [
      { icon: 'text-outline', label: 'Text Size', options: ['Small', 'Medium', 'Large'] },
      { icon: 'globe-outline', label: 'Language', options: ['English', 'Spanish', 'French'] },
      { icon: 'newspaper-outline', label: 'News Categories', value: '6 selected' },
      { icon: 'time-outline', label: 'Reading Time Format', options: ['Minutes', 'Time to Read'] },
    ],
  },
  {
    title: 'Privacy & Data',
    items: [
      { icon: 'shield-checkmark-outline', label: 'Privacy Settings' },
      { icon: 'cloud-download-outline', label: 'Data Usage', value: '1.2 GB' },
      { icon: 'trash-outline', label: 'Clear Cache', action: 'clear' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile' },
      { icon: 'key-outline', label: 'Change Password' },
      { icon: 'mail-outline', label: 'Email Preferences' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center' },
      { icon: 'chatbubble-outline', label: 'Contact Support' },
      { icon: 'information-circle-outline', label: 'About Expo X ', version: '1.0.0' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { 
        icon: 'chatbubbles-outline', 
        label: 'Chat with AI', 
        description: 'Get help and recommendations'
      },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme, isDark, textSize, setTextSize, getFontSize } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();
  const [selectedOptions, setSelectedOptions] = useState({
    textSize: 'Medium',
    language: 'English',
    readingTimeFormat: 'Minutes',
    notifications: true,
    offlineReading: false,
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showEmailPreferences, setShowEmailPreferences] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showDataUsage, setShowDataUsage] = useState(false);
  // Add new state for chatbot modal
  const [showChatbot, setShowChatbot] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'USER',
    email: 'USER@example.com',
    bio: '',
    phone: '',
    location: '',
  });

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  const handleOptionChange = async (setting: string, value: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    if (setting === 'Text Size') {
      setTextSize(value.toLowerCase() as 'small' | 'medium' | 'large');
    }
    
    setSelectedOptions(prev => ({
      ...prev,
      [setting.toLowerCase().replace(/ /g, '')]: value,
    }));
  };

  const handleToggle = async (setting: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    if (setting === 'Dark Mode') {
      toggleTheme();
      return;
    }

    if (setting === 'Push Notifications') {
      await toggleNotifications();
      return;
    }
    
    const settingKey = setting.toLowerCase().replace(/ /g, '');
    setSelectedOptions(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey],
    }));
  };

  const handleAction = async (action: string, label: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    switch (action) {
      case 'clear':
        Alert.alert(
          'Clear Cache',
          'Are you sure you want to clear the cache?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: async () => {
                if (Platform.OS !== 'web') {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert('Success', 'Cache has been cleared');
              },
            },
          ]
        );
        break;
      default:
        if (label === 'Contact Support') {
          setShowContactSupport(true);
        } else {
          Alert.alert('Action', `${label} action triggered`);
        }
    }
  };

  // Fixed handleAvatarEdit function to better handle mobile image selection
  const handleAvatarEdit = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  
    try {
      // First check permissions
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant permission to access your photos to change your profile picture.'
          );
          return;
        }
      }
  
      // Launch image picker with proper options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
  
      console.log("Image picker result:", JSON.stringify(result));
  
      // Handle the result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        if (selectedAsset.uri) {
          // On Android, ensure we have a file:// URI
          let imageUri = selectedAsset.uri;
          if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
            // Only add file:// prefix if it's not already there and is a local path
            if (!imageUri.startsWith('content://') && !imageUri.startsWith('http')) {
              imageUri = 'file://' + imageUri;
            }
          }
          
          console.log("Selected image URI:", imageUri);
          
          // Update the profile image
          setProfileImage(imageUri);
          
          // Apply animation
          scale.value = withSequence(
            withSpring(1.2),
            withSpring(1)
          );
          
          rotation.value = withSequence(
            withTiming(-10),
            withTiming(10),
            withTiming(0)
          );
          
          // Provide haptic feedback on success
          if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          console.error("Image URI is undefined");
          Alert.alert('Error', 'Could not get the image URI. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert(
        'Error',
        'There was an error selecting your profile picture. Please try again.'
      );
    }
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/auth/login'),
        },
      ]
    );
  };

  const handleMenuItemPress = async (item: any) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    if (item.action) {
      handleAction(item.action, item.label);
    } else if (item.options) {
      Alert.alert(
        item.label,
        'Select an option:',
        item.options.map(option => ({
          text: option,
          onPress: () => handleOptionChange(item.label, option),
        }))
      );
    } else if (item.label === 'Edit Profile') {
      setShowEditProfile(true);
    } else if (item.label === 'Privacy Settings') {
      setShowPrivacySettings(true);
    } else if (item.label === 'Email Preferences') {
      setShowEmailPreferences(true);
    } else if (item.label === 'Change Password') {
      setShowChangePassword(true);
    } else if (item.label === 'Help Center') {
      setShowHelpCenter(true);
    } else if (item.label === 'Data Usage') {
      setShowDataUsage(true);
    } else if (item.label === 'Contact Support') {
      setShowContactSupport(true);
    } else if (item.label === 'Chat with AI') {
      // Handle AI chat
      setShowChatbot(true);
    } else if (item.type !== 'toggle') {
      Alert.alert(item.label, `${item.label} settings will be implemented here`);
    }
  };

  const handleSaveProfile = (data: ProfileData) => {
    setProfileData(data);
    setShowEditProfile(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const styles = createStyles(isDark, getFontSize);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.userInfo}>
          <Animated.View style={[styles.avatarContainer, animatedStyle]}>
            {profileImage ? (
              // Fixed Image component to properly display profile image on mobile
              <Image
                source={{ uri: profileImage }}
                style={styles.avatar}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profileData.name[0]}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleAvatarEdit}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.name}>{profileData.name}</Text>
          <Text style={styles.email}>{profileData.email}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setShowEditProfile(true)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Animated.View
              key={index}
              entering={SlideInRight.delay(400 + index * 100)}
              style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {sections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(500 + sectionIndex * 100)}
            style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menu}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={() => handleMenuItemPress(item)}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={isDark ? '#007AFF' : '#007AFF'}
                    />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.type === 'toggle' ? (
                      <Switch
                        value={
                          item.label === 'Dark Mode'
                            ? isDark
                            : item.label === 'Push Notifications'
                            ? notificationsEnabled
                            : selectedOptions[
                                item.label.toLowerCase().replace(/ /g, '')
                              ]
                        }
                        onValueChange={() => handleToggle(item.label)}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isDark ? '#007AFF' : '#f4f3f4'}
                      />
                    ) : item.options ? (
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => handleMenuItemPress(item)}>
                        <Text style={styles.optionText}>
                          {item.label === 'Text Size'
                            ? textSize.charAt(0).toUpperCase() + textSize.slice(1)
                            : selectedOptions[
                                item.label.toLowerCase().replace(/ /g, '')
                              ] || item.options[0]}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={isDark ? '#8E8E93' : '#8E8E93'}
                        />
                      </TouchableOpacity>
                    ) : item.version ? (
                      <Text style={styles.versionText}>{item.version}</Text>
                    ) : item.value ? (
                      <Text style={styles.menuItemValue}>{item.value}</Text>
                    ) : item.description ? (
                      <View style={styles.optionButton}>
                        <Text style={styles.optionText}>{item.description}</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={isDark ? '#8E8E93' : '#8E8E93'}
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? '#8E8E93' : '#8E8E93'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>


      <Image
        source={{ uri: profileImage }}
        style={styles.avatar}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
        initialData={profileData}
        isDark={isDark}
      />

      <ContactSupportModal
        visible={showContactSupport}
        onClose={() => setShowContactSupport(false)}
        isDark={isDark}
      />

      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        isDark={isDark}
      />

      <EmailPreferencesModal
        visible={showEmailPreferences}
        onClose={() => setShowEmailPreferences(false)}
        isDark={isDark}
        initialEmail={profileData.email}
      />

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        isDark={isDark}
      />

      <HelpCenterModal
        visible={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
        isDark={isDark}
      />

      <DataUsageModal
        visible={showDataUsage}
        onClose={() => setShowDataUsage(false)}
        isDark={isDark}
      />

      {/* Add the ChatbotModal component */}
      <ChatbotModal
        visible={showChatbot}
        onClose={() => setShowChatbot(false)}
        isDark={isDark}
      />
    </>
  );
}

const createStyles = (isDark: boolean, getFontSize: (size: number) => number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
    },
    content: {
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: getFontSize(34),
      fontWeight: Platform.select({ ios: '800', default: 'bold' }),
      color: isDark ? '#EAC8A4' : '#EAC8A4',
    },
    themeToggle: {
      padding: 8,
    },
    userInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#4C7FA8',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden', // Ensure image stays within rounded borders
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: getFontSize(32),
      fontWeight: 'bold',
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#6A94B6',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#000000' : '#FFFFFF',
      zIndex: 10, // Ensure button stays on top
    },
    name: {
      fontSize: getFontSize(20),
      fontWeight: 'bold',
      color: isDark ? '#FFFFFf' : '#000000',
      marginBottom: 4,
    },
    email: {
      fontSize: getFontSize(16),
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 12,
    },
    editProfileButton: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    editProfileText: {
      color: '#007AFF',
      fontSize: getFontSize(14),
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: getFontSize(24),
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: getFontSize(12),
      color: '#8E8E93',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: getFontSize(20),
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    menu: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemLabel: {
      fontSize: getFontSize(16),
      color: isDark ? '#FFFFFF' : '#000000',
      marginLeft: 12,
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemValue: {
      fontSize: getFontSize(14),
      color: '#8E8E93',
      marginRight: 8,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      fontSize: getFontSize(14),
      color: '#8E8E93',
      marginRight: 8,
    },
    versionText: {
      fontSize: getFontSize(14),
      color: '#8E8E93',
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: getFontSize(16),
      fontWeight: '600',
    },
  });