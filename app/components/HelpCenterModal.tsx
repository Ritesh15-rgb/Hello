import React, { useState, useRef } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface HelpItem {
  title: string;
  icon: string;
  content: string;
}

interface HelpSection {
  title: string;
  items: HelpItem[];
}

// Enhanced help sections with detailed content
const helpSections: HelpSection[] = [
  {
    title: 'Getting Started',
    items: [
      { 
        title: 'How to use the app', 
        icon: 'book-outline',
        content: `
# How to Use the News App

Our news app is designed to be intuitive and easy to use. Follow these steps to get the most out of your experience:

## Main Features
- **Home Feed**: Browse the latest news stories tailored to your interests
- **Search**: Find articles on specific topics
- **Bookmarks**: Save articles to read later
- **Profile**: Customize your news preferences

## Navigation
- Swipe between tabs to access different sections
- Pull down to refresh content
- Long press on articles to see quick actions

## Reading Experience
- Tap on any article to read the full story
- Adjust text size in the settings
- Toggle between light and dark mode for comfortable reading

Need more help? Contact our support team at support@newsapp.com.
        `
      },
      { 
        title: 'Account setup', 
        icon: 'person-add-outline',
        content: `
# Setting Up Your Account

Creating and setting up your account takes just a few simple steps:

## Creating an Account
1. Tap the "Sign Up" button on the welcome screen
2. Enter your email address and create a password
3. Verify your email address using the link we'll send you
4. Complete your profile by selecting news categories that interest you

## Managing Your Profile
- Add a profile picture by tapping on the avatar icon
- Update your news preferences in the Settings menu
- Connect social accounts for seamless sharing
- Set notification preferences to stay updated

## Privacy Controls
- Choose what data you share with us
- Manage your subscription settings
- Control who can see your activity

If you need assistance during setup, our support team is available 24/7.
        `
      },
      { 
        title: 'Navigation guide', 
        icon: 'navigate-outline',
        content: `
# Navigation Guide

Our app is organized to help you find news quickly and efficiently:

## Main Tabs
- **Home**: Your personalized news feed
- **Discover**: Explore trending topics and new sources
- **Bookmarks**: Access saved articles
- **Profile**: Manage your account settings

## Gestures and Controls
- Swipe left/right to move between tabs
- Swipe down to refresh content
- Swipe up to load more articles
- Double tap to quickly save an article
- Long press for sharing options

## Quick Navigation
- Use the search icon to find specific topics
- Tap the filter icon to refine your feed
- Use the back button to return to previous screens
- Shake your device to report an issue

We've designed the navigation to be intuitive and efficient for daily news consumption.
        `
      },
    ],
  },
  {
    title: 'Features',
    items: [
      { 
        title: 'Reading articles', 
        icon: 'newspaper-outline',
        content: `
# Reading Articles

Our app offers a premium reading experience with multiple features to enhance your news consumption:

## Article View Features
- Clean, distraction-free reading environment
- Adjustable text size and font
- Dark mode for comfortable nighttime reading
- Estimated reading time displayed for each article
- Progress tracking for longer pieces

## Reading Tools
- Text-to-speech functionality
- Translation capabilities for international news
- Highlight important text
- Add notes to articles
- Offline reading for saved articles

## Navigation Within Articles
- Swipe left/right to move between articles
- Tap the top of the screen to quickly scroll back to the beginning
- Use the share button to send articles to friends or other apps
- Related stories appear at the bottom of each article

Enjoy a seamless reading experience optimized for all device sizes.
        `
      },
      { 
        title: 'Saving content', 
        icon: 'bookmark-outline',
        content: `
# Saving Content

Never lose track of interesting articles with our robust saving features:

## Bookmarking
- Tap the bookmark icon on any article to save it
- Create custom collections to organize saved content
- Filter your bookmarks by date, source, or topic
- Search within your saved articles

## Reading List
- Add articles to your "Read Later" queue
- Set reminders to read saved content
- Automatically archive old saved articles
- Download articles for offline reading

## Exporting Options
- Share your reading lists with friends
- Export articles to note-taking apps
- Send to e-readers in compatible formats
- Create custom PDF compilations of saved articles

Your saved content synchronizes across all your devices automatically.
        `
      },
      { 
        title: 'Customization', 
        icon: 'color-palette-outline',
        content: `
# Customization Options

Make the app your own with these customization features:

## Visual Customization
- Choose between light, dark, and system theme
- Select color accents for the interface
- Adjust font size and type
- Customize the layout of your home feed

## Content Personalization
- Follow specific topics, authors, or publications
- Hide sources or categories you're not interested in
- Set priority levels for different news categories
- Create custom news digests

## Notification Settings
- Choose which types of news trigger alerts
- Set quiet hours for notifications
- Customize notification sounds
- Create scheduled news summaries

## Reading Experience
- Adjust text density and line spacing
- Set preferred reading mode (paginated or scrolling)
- Customize swipe actions
- Set default sharing options

Your customization settings sync across all your devices.
        `
      },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { 
        title: 'Privacy settings', 
        icon: 'shield-checkmark-outline',
        content: `
# Privacy Settings

We take your privacy seriously. Here's how to manage your privacy settings:

## Personal Data Controls
- Review what data is collected
- Opt out of personalized ads
- Manage cookies and tracking preferences
- Request data export or deletion

## Account Privacy
- Control who can see your reading history
- Manage your public profile visibility
- Set comment privacy preferences
- Hide your online status

## Security Features
- Enable two-factor authentication
- View active sessions and sign out remotely
- Get alerts for suspicious login attempts
- Encrypt your saved articles

## Permissions Management
- Review and modify app permissions
- Control location tracking settings
- Manage camera and microphone access
- Adjust notification permissions

Visit our Privacy Policy for more details on how we protect your data.
        `
      },
      { 
        title: 'Password reset', 
        icon: 'key-outline',
        content: `
# Password Reset

If you need to reset your password, follow these simple steps:

## Reset Process
1. Tap "Forgot Password" on the login screen
2. Enter the email address associated with your account
3. Check your email for a password reset link
4. Follow the link to create a new secure password
5. Log in with your new credentials

## Password Security Tips
- Use a combination of letters, numbers, and special characters
- Avoid reusing passwords from other sites
- Consider using a password manager
- Change your password regularly for enhanced security

## Account Recovery Options
- Set up backup email addresses
- Add a phone number for SMS verification
- Create security questions
- Enable biometric authentication where available

If you encounter any issues during the reset process, contact our support team.
        `
      },
      { 
        title: 'Data management', 
        icon: 'server-outline',
        content: `
# Data Management

Take control of your data with these management tools:

## Data Usage
- Monitor how much data the app consumes
- Set data usage limits for cellular connections
- Enable data-saving mode for images and videos
- Pre-download content on WiFi for offline reading

## Storage Management
- See how much space saved articles occupy
- Clear cache to free up space
- Set auto-deletion periods for old content
- Manage download quality for media

## Sync Controls
- Choose which data syncs across devices
- Manage cloud backup settings
- Control sync frequency
- Pause syncing when on cellular data

## Data Export and Backup
- Export your reading history
- Back up your preferences and bookmarks
- Transfer your profile to a new device
- Download your comments and interactions

We're committed to transparency in how we store and use your data.
        `
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      { 
        title: 'Common issues', 
        icon: 'warning-outline',
        content: `
# Common Issues and Solutions

Here are solutions to frequently encountered problems:

## Connection Problems
- Check your internet connection
- Try switching between WiFi and cellular data
- Clear the app cache in settings
- Restart the app or your device

## Content Not Loading
- Pull down to refresh the feed
- Check if content filters are too restrictive
- Verify your subscription status
- Make sure you're running the latest version

## Account Issues
- Try resetting your password
- Verify your email address
- Check for service outages on our status page
- Make sure your account hasn't been suspended

## App Performance
- Close background apps to free up memory
- Update to the latest app version
- Reinstall the app if problems persist
- Check if your device meets minimum requirements

For persistent issues, contact our support team at support@newsapp.com.
        `
      },
      { 
        title: 'App performance', 
        icon: 'speedometer-outline',
        content: `
# Optimizing App Performance

Follow these tips to ensure the best possible app performance:

## Device Optimization
- Keep your device's operating system updated
- Ensure you have sufficient free storage space
- Close background apps when using the news app
- Restart your device regularly

## App Settings
- Reduce image quality to improve loading speeds
- Disable auto-play videos on cellular connections
- Limit the number of sources in your feed
- Set reasonable refresh intervals

## Cache Management
- Clear the app cache periodically
- Set automatic cache clearing intervals
- Limit offline article storage
- Reinstall the app if performance significantly degrades

## Network Optimization
- Use WiFi when possible for better performance
- Enable data-saving mode on slow connections
- Pre-download content when on fast connections
- Limit background refreshes

These optimizations will help ensure a smooth and responsive experience.
        `
      },
      { 
        title: 'Error messages', 
        icon: 'alert-circle-outline',
        content: `
# Understanding Error Messages

Here's a guide to common error messages and how to resolve them:

## Connection Errors
- "No internet connection": Check your WiFi or cellular data
- "Server not responding": Our servers may be temporarily down, try again later
- "Timeout error": The connection took too long, try on a stronger network

## Account Errors
- "Invalid credentials": Double-check your username and password
- "Account locked": Too many failed login attempts, reset your password
- "Email not verified": Check your email for the verification link

## Content Errors
- "Content unavailable": The article may have been removed or restricted
- "Subscription required": This content requires a premium subscription
- "Region restricted": This content is not available in your location

## App Errors
- "App needs to update": Install the latest version from the app store
- "Insufficient storage": Free up space on your device
- "Incompatible device": Your device may not meet minimum requirements

Include the error code when contacting support for faster resolution.
        `
      },
    ],
  },
];

export default function HelpCenterModal({
  visible,
  onClose,
  isDark,
}: HelpCenterModalProps) {
  const [activeSection, setActiveSection] = useState<HelpSection | null>(null);
  const [activeItem, setActiveItem] = useState<HelpItem | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const modalHeight = useSharedValue('90%');

  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      maxHeight: modalHeight.value,
    };
  });

  const handleHelpItem = async (section: HelpSection, item: HelpItem) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    setActiveSection(section);
    setActiveItem(item);
  };

  const goBack = async () => {
    if (activeItem) {
      setActiveItem(null);
      return;
    }
    
    setActiveSection(null);
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
          animatedModalStyle,
          { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        ]}>
        <View style={styles.header}>
          {activeSection || activeItem ? (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          )}
          <Text
            style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {activeItem 
              ? activeItem.title 
              : activeSection 
                ? activeSection.title 
                : 'Help Center'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {activeItem ? (
          <ScrollView 
            style={styles.content}
            ref={scrollViewRef}
          >
            <View style={styles.detailContainer}>
              <View style={styles.itemIconContainer}>
                <Ionicons
                  name={activeItem.icon as any}
                  size={32}
                  color="#007AFF"
                />
              </View>
              <View style={styles.markdownContainer}>
                <Text style={[
                  styles.markdownTitle,
                  { color: isDark ? '#FFFFFF' : '#000000' }
                ]}>
                  {activeItem.title}
                </Text>
                <Text style={[
                  styles.markdownContent,
                  { color: isDark ? '#DDDDDD' : '#333333' }
                ]}>
                  {activeItem.content}
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : activeSection ? (
          <ScrollView style={styles.content}>
            {activeSection.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.helpItem,
                  itemIndex === activeSection.items.length - 1 && styles.helpItemLast,
                ]}
                onPress={() => handleHelpItem(activeSection, item)}>
                <View style={styles.helpItemLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color="#007AFF"
                  />
                  <Text
                    style={[
                      styles.helpItemTitle,
                      { color: isDark ? '#FFFFFF' : '#000000' },
                    ]}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.content}>
            {helpSections.map((section) => (
              <TouchableOpacity
                key={section.title}
                style={styles.section}
                onPress={() => setActiveSection(section)}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? '#FFFFFF' : '#000000' },
                    ]}>
                    {section.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#8E8E93' : '#8E8E93'}
                  />
                </View>
                <Text
                  style={[
                    styles.sectionDescription,
                    { color: isDark ? '#8E8E93' : '#8E8E93' },
                  ]}>
                  {section.items.map(item => item.title).join(' • ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  helpItemLast: {
    borderBottomWidth: 0,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpItemTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  detailContainer: {
    padding: 16,
  },
  itemIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  markdownContainer: {
    marginTop: 8,
  },
  markdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  markdownContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});