// newsService.ts

import { useNotifications } from '../context/NotificationContext';

// Keep track of the last fetched news ID to detect new items
let lastNewsId = null;

export const fetchNews = async (category = 'all') => {
  const { notificationsEnabled, sendNewsNotification } = useNotifications();
  
  try {
    // Replace with your actual API call
    const response = await fetch('https://newsapi.org/v2' + category);
    const data = await response.json();
    
    // Check if there are new articles
    if (data.articles && data.articles.length > 0) {
      const latestArticle = data.articles[0];
      
      // If this is our first fetch, just store the ID
      if (lastNewsId === null) {
        lastNewsId = latestArticle.id;
      } 
      // If we have new news (the latest ID is different from our stored one)
      else if (latestArticle.id !== lastNewsId) {
        // Update our stored ID
        lastNewsId = latestArticle.id;
        
        // If notifications are enabled, send a notification
        if (notificationsEnabled) {
          await sendNewsNotification(
            "New Article Available", 
            latestArticle.title || "Check out the latest news!"
          );
        }
      }
    }
    
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

// Create a background fetch function that can be called periodically
export const setupNewsBackgroundFetch = () => {
  // This is a simplified version - you'd typically use a background fetch API
  // like BackgroundFetch from expo-background-fetch
  
  // For testing, we can use a simple interval
  const interval = setInterval(() => {
    fetchNews();
  }, 15 * 60 * 1000); // Check every 15 minutes
  
  return () => clearInterval(interval); // Return cleanup function
};