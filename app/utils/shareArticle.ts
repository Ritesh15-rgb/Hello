// First, let's create a utility function to handle sharing in a separate file

// shareUtils.ts
import { Share, Platform, Linking } from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the article interface to match your existing structure
export interface Article {
  url: string;
  title: string;
  content?: string;
  description?: string;
  urlToImage?: string;
  author?: string;
  source: {
    name: string;
  };
}

// Create a function to generate a share URL
const generateShareUrl = (articleUrl: string) => {
  // You would replace this with your actual app/play store links and deep linking scheme
  const appScheme = 'expox://news';
  const appStoreLink = 'https://apps.apple.com/us/app/your-app-id';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=your.package.name';
  
  // Create a URL that includes the article URL as a parameter
  return `${appScheme}?article=${encodeURIComponent(articleUrl)}&storelink=${
    Platform.OS === 'ios' ? appStoreLink : playStoreLink
  }`;
};

// Create the main share function
export const shareArticle = async (article: Article) => {
  const shareUrl = generateShareUrl(article.url);
  
  try {
    // Save shared article to AsyncStorage for later retrieval
    const sharedArticlesData = await AsyncStorage.getItem('sharedArticlesData');
    let articlesData = sharedArticlesData ? JSON.parse(sharedArticlesData) : [];
    
    // Check if article already exists
    if (!articlesData.find((a: any) => a.url === article.url)) {
      articlesData.push({
        id: article.url,
        title: article.title,
        image: article.urlToImage,
        category: article.source.name,
        date: new Date(),
        content: article.content || article.description,
        author: article.author,
        source: {
          name: article.source.name
        },
        url: article.url,
        shared: true
      });
      
      await AsyncStorage.setItem('sharedArticlesData', JSON.stringify(articlesData));
    }
    
    // Create share message
    const shareMessage = `Check out this article: ${article.title}\n\nDownload our app to read more: ${shareUrl}`;
    
    // Use native share functionality
    await Share.share({
      message: shareMessage,
      title: article.title,
      url: shareUrl, // iOS only
    });
    
    return true;
  } catch (error) {
    console.error('Error sharing article:', error);
    return false;
  }
};

// Function to handle deep links
export const handleDeepLink = async (url: string | null) => {
  if (!url) return null;
  
  try {
    // Extract article URL from deep link
    const match = url.match(/article=([^&]+)/);
    if (!match) return null;
    
    const articleUrl = decodeURIComponent(match[1]);
    
    // Try to find the article in shared articles first
    const sharedArticlesData = await AsyncStorage.getItem('sharedArticlesData');
    if (sharedArticlesData) {
      const articles = JSON.parse(sharedArticlesData);
      const article = articles.find((a: any) => a.url === articleUrl);
      if (article) return article;
    }
    
    // If not found, check saved articles
    const savedArticlesData = await AsyncStorage.getItem('savedArticlesData');
    if (savedArticlesData) {
      const articles = JSON.parse(savedArticlesData);
      const article = articles.find((a: any) => a.url === articleUrl);
      if (article) return article;
    }
    
    return null;
  } catch (error) {
    console.error('Error handling deep link:', error);
    return null;
  }
};

// Animation reference helper
export const getShareAnimation = () => {
  return {
    from: { transform: [{ scale: 1 }] },
    to: { transform: [{ scale: 1.3 }] },
    duration: 300,
    easing: 'ease-in-out',
  };
};