import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleDailyNewsDigest } from '../utils/notifications';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationsEnabled: false,
  toggleNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkNotificationStatus();
    }
  }, []);

  const checkNotificationStatus = async () => {
    if (Platform.OS === 'web') return;
    
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const toggleNotifications = async () => {
    if (Platform.OS === 'web') return;

    if (notificationsEnabled) {
      // Disable notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
    } else {
      // Enable notifications
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await scheduleDailyNewsDigest();
        setNotificationsEnabled(true);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        toggleNotifications,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);