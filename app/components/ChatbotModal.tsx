import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Animated as RNAnimated,
  Easing,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { fetchTopHeadlines, fetchNewsByCategory, searchNews, Article } from '../api/newsApi';

// Gemini API interface
interface GeminiResponse {
  answer: string;
  relatedContent?: {
    title: string;
    url: string;
    snippet: string;
  }[];
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  category?: string; // For categorizing messages (help, recommendation, etc.)
  actions?: ActionButton[]; // Quick action buttons
  geminiAnswer?: string; // For displaying Gemini API results
  relatedContent?: {
    title: string;
    url: string;
    snippet: string;
  }[]; // Related content from Gemini
  newsArticles?: Article[]; // News articles from NewsAPI
  sourceAttribution?: string; // Source attribution for the information
}

interface ActionButton {
  id: string;
  label: string;
  action: string;
}

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

// Configure your Gemini API key here
const GEMINI_API_KEY = 'AIzaSyASzuABco8dmjyiOJYHoUodlW7z8WuAzlk'; // Replace with your actual API key

const ChatbotModal: React.FC<ChatbotModalProps> = ({ visible, onClose, isDark }) => {
  const initialMessage = {
    id: '1',
    text: "Hello! I'm your personal AI assistant. How can I help you with the app today?",
    isBot: true,
    timestamp: new Date(),
    actions: [
      { id: '1', label: 'Read Recommendations', action: 'recommendations' },
      { id: '2', label: 'App Features', action: 'features' },
      { id: '3', label: 'Customize Settings', action: 'settings' },
      { id: '4', label: 'Latest News', action: 'latest_news' },
    ]
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingDotsOpacity = useRef(new RNAnimated.Value(0)).current;
  const typingDotsAnimation = useRef<RNAnimated.CompositeAnimation | null>(null);
  const { height: screenHeight } = Dimensions.get('window');

  // Reset messages when modal opens
  useEffect(() => {
    if (visible) {
      // If modal becomes visible, we want to reset the state
      setMessages([initialMessage]);
      setInputText('');
    }
  }, [visible]);

  // Handle keyboard show/hide events to fix misalignment
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      typingDotsAnimation.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(typingDotsOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          }),
          RNAnimated.timing(typingDotsOpacity, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          })
        ])
      );
      typingDotsAnimation.current.start();
    } else {
      if (typingDotsAnimation.current) {
        typingDotsAnimation.current.stop();
      }
      typingDotsOpacity.setValue(0);
    }

    return () => {
      if (typingDotsAnimation.current) {
        typingDotsAnimation.current.stop();
      }
    };
  }, [isTyping, typingDotsOpacity]);

  const startTypingAnimation = () => {
    setIsTyping(true);
  };

  const stopTypingAnimation = () => {
    setIsTyping(false);
  };

  // Function to fetch data from Gemini API
  const fetchFromGemini = async (query: string): Promise<GeminiResponse> => {
    try {
      setIsSearching(true);
      
      // Correct Gemini API endpoint for the generative text model
      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      
      // Validate API key
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'AIzaSyASzuABco8dmjyiOJYHoUodlW7z8WuAzlk') {
        throw new Error('Invalid or missing API key');
      }
      
      const response = await fetch(
        `${endpoint}?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: query }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API error with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Gemini API Response:', JSON.stringify(data)); // Debug log
      
      // Extract the response text from the Gemini API response structure
      let answerText = "I couldn't find specific information about that. Would you like to try a different question?";
      let citations = [];
      
      if (data && data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        if (parts.length > 0 && parts[0].text) {
          answerText = parts[0].text;
        }
      }
      
      // Check for citations if they exist in the response
      if (data && data.candidates && data.candidates[0] && 
          data.candidates[0].citationMetadata && 
          data.candidates[0].citationMetadata.citations) {
        citations = data.candidates[0].citationMetadata.citations.map((citation: any) => ({
          title: citation.title || "Related content",
          url: citation.uri || "#",
          snippet: citation.snippet || "Additional information related to your query."
        }));
      }
      
      return {
        answer: answerText,
        relatedContent: citations
      };
    } catch (error) {
      console.error('Error fetching from Gemini API:', error);
      // More detailed error handling based on error type
      if (error instanceof TypeError) {
        // Network error
        return {
          answer: "I'm having trouble connecting to my knowledge base. Please check your internet connection and try again.",
          relatedContent: []
        };
      } else if (error instanceof Error && error.message.includes('API key')) {
        return {
          answer: "I can't connect to my knowledge source right now. The API key needs to be set up correctly.",
          relatedContent: []
        };
      } else {
        return {
          answer: "I'm having trouble processing your question right now. Please try again later or ask about app features instead.",
          relatedContent: []
        };
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Function to fetch news articles from NewsAPI
  const fetchNewsArticles = async (category: string = 'general', query?: string): Promise<Article[]> => {
    try {
      setIsSearching(true);
      let articles: Article[] = [];
      
      if (query) {
        // Search for specific news
        articles = await searchNews(query);
      } else if (category === 'all' || category === 'general') {
        // Get top headlines
        articles = await fetchTopHeadlines();
      } else {
        // Get news by category
        articles = await fetchNewsByCategory(category);
      }
      
      return articles;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    // Provide haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Clear input and close keyboard
    const textToProcess = inputText;
    setInputText('');
    Keyboard.dismiss();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToProcess,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Start typing animation
    startTypingAnimation();

    // Process the message
    processUserInput(textToProcess);
  };

  const speakMessage = (text: string) => {
    if (voiceEnabled) {
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }
  };

  const processUserInput = async (userInput: string) => {
    // Check for news-related queries
    const isNewsRelated = userInput.toLowerCase().includes('news') || 
                          userInput.toLowerCase().includes('headlines') || 
                          userInput.toLowerCase().includes('latest') ||
                          userInput.toLowerCase().includes('articles') ||
                          userInput.toLowerCase().includes('stories');
    
    // Check if this is a non-app related query (but not news)
    const isAppRelated = userInput.toLowerCase().includes('app') || 
                          userInput.toLowerCase().includes('feature') || 
                          userInput.toLowerCase().includes('setting') ||
                          userInput.toLowerCase().includes('read') ||
                          userInput.toLowerCase().includes('article') ||
                          userInput.toLowerCase().includes('dark mode') ||
                          userInput.toLowerCase().includes('profile');
    
    // Simulate AI processing time (realistic delay)
    const processingTime = 1000 + Math.random() * 1500;
    
    setTimeout(async () => {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const userInputLower = userInput.toLowerCase();
      let botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        isBot: true,
        timestamp: new Date(),
      };

      // Handle news-related queries
      if (isNewsRelated) {
        botResponse.text = "Let me fetch the latest news for you...";
        botResponse.category = 'news_query';
        
        // Stop typing animation temporarily to show search message
        stopTypingAnimation();
        setMessages(prevMessages => [...prevMessages, botResponse]);
        
        // Start search animation again for news search
        startTypingAnimation();
        
        try {
          // Determine category from query if possible
          let category = 'general';
          if (userInputLower.includes('tech')) category = 'technology';
          else if (userInputLower.includes('business')) category = 'business';
          else if (userInputLower.includes('entertain')) category = 'entertainment';
          else if (userInputLower.includes('health')) category = 'health';
          else if (userInputLower.includes('science')) category = 'science';
          else if (userInputLower.includes('sports')) category = 'sports';
          
          // Fetch news articles
          const newsArticles = await fetchNewsArticles(category);
          
          // Limit to 5 articles for better readability
          const limitedArticles = newsArticles.slice(0, 5);
          
          // Create news response with source attribution
          const newsResponseMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: limitedArticles.length > 0 
              ? `Here are the latest ${category !== 'general' ? category : ''} news headlines I found:`
              : "I couldn't find any news articles at the moment. Please try again later.",
            isBot: true,
            timestamp: new Date(),
            category: 'news_results',
            newsArticles: limitedArticles,
            sourceAttribution: "Data sourced from NewsAPI.org",
            actions: [
              { id: '1', label: 'More Headlines', action: 'more_news' },
              { id: '2', label: 'Business News', action: 'business_news' },
              { id: '3', label: 'Tech News', action: 'tech_news' },
              { id: '4', label: 'Entertainment', action: 'entertainment_news' },
            ]
          };
          
          stopTypingAnimation();
          setMessages(prevMessages => [...prevMessages, newsResponseMessage]);
          speakMessage(newsResponseMessage.text);
        } catch (error) {
          console.error('Error processing news:', error);
          stopTypingAnimation();
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "I'm having trouble retrieving news right now. Please try again later.",
            isBot: true,
            timestamp: new Date(),
            category: 'error',
            actions: [
              { id: '1', label: 'Try Again', action: 'latest_news' },
              { id: '2', label: 'App Features', action: 'features' }
            ]
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
        return;
      }
      
      // If it's not an app-related query, use Gemini API
      if (!isAppRelated) {
        botResponse.text = "Let me find an answer to that question...";
        botResponse.category = 'gemini_query';
        
        // Stop typing animation temporarily to show search message
        stopTypingAnimation();
        setMessages(prevMessages => [...prevMessages, botResponse]);
        
        // Start search animation again for Gemini search
        startTypingAnimation();
        
        // Check if API key is configured properly
        if (GEMINI_API_KEY === 'AIzaSyASzuABco8dmjyiOJYHoUodlW7z8WuAzlk' || !GEMINI_API_KEY) {
          stopTypingAnimation();
          const apiKeyErrorMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "I can't answer general questions right now.",
            isBot: true,
            timestamp: new Date(),
            category: 'error',
            actions: [
              { id: '1', label: 'Ask About App Instead', action: 'features' }
            ]
          };
          setMessages(prevMessages => [...prevMessages, apiKeyErrorMessage]);
          return;
        }
        
        try {
          // Fetch answer from Gemini
          const geminiResult = await fetchFromGemini(userInput);
          
          // Update with Gemini response
          const geminiResponseMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: geminiResult.answer,
            isBot: true,
            timestamp: new Date(),
            category: 'gemini_answer',
            relatedContent: geminiResult.relatedContent,
            sourceAttribution: "Data from Google Gemini API",
            actions: [
              { id: '1', label: 'Ask Another Question', action: 'ask_anything' },
              { id: '2', label: 'App Help Instead', action: 'features' }
            ]
          };
          
          stopTypingAnimation();
          setMessages(prevMessages => [...prevMessages, geminiResponseMessage]);
          speakMessage(geminiResponseMessage.text);
        } catch (error) {
          console.error('Error processing Gemini response:', error);
          stopTypingAnimation();
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "I'm having trouble processing your question. Let me know if you'd like to try again or ask about app features instead.",
            isBot: true,
            timestamp: new Date(),
            category: 'error',
            actions: [
              { id: '1', label: 'Try Again', action: 'ask_anything' },
              { id: '2', label: 'App Features', action: 'features' }
            ]
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
        return;
      }
      
      // Pattern matching for app-related queries
      if (userInputLower.match(/hello|hi|hey|greetings/i)) {
        botResponse.text = 'Hello there! How can I assist you with the app today?';
        botResponse.category = 'greeting';
      } 
      else if (userInputLower.match(/recommend|suggestion|what.*(read|article)/i)) {
        botResponse.text = 'Based on your reading history, I recommend checking out "The Future of Mobile UX" and "Design Trends 2025". Would you like me to find more articles on specific topics?';
        botResponse.category = 'recommendation';
        botResponse.actions = [
          { id: '1', label: 'Tech Articles', action: 'tech_articles' },
          { id: '2', label: 'Design Trends', action: 'design_trends' },
          { id: '3', label: 'Latest News', action: 'latest_news' },
          { id: '4', label: 'Ask Anything', action: 'ask_anything' },
        ];
      } 
      else if (userInputLower.match(/feature|can.*do|how.*use/i)) {
        botResponse.text = 'This app offers personalized article recommendations, offline reading, customizable text size, and dark mode. You can save articles for later and track your reading stats. What feature would you like to learn more about?';
        botResponse.category = 'features';
        botResponse.actions = [
          { id: '1', label: 'Offline Reading', action: 'offline_reading' },
          { id: '2', label: 'Saving Articles', action: 'saving' },
          { id: '3', label: 'Customization', action: 'customization' },
        ];
      } 
      else if (userInputLower.match(/setting|preference|customize|personalize/i)) {
        botResponse.text = 'You can adjust your text size, toggle dark mode, manage notifications, select preferred news categories, and change language settings. Would you like me to guide you to a specific settings section?';
        botResponse.category = 'settings';
        botResponse.actions = [
          { id: '1', label: 'Text Size', action: 'text_size' },
          { id: '2', label: 'Dark Mode', action: 'dark_mode' },
          { id: '3', label: 'News Categories', action: 'categories' },
        ];
      } 
      else if (userInputLower.match(/dark mode|light mode|theme/i)) {
        botResponse.text = 'You can toggle dark mode in the App Settings section of your profile. Would you like me to guide you there?';
        botResponse.category = 'settings';
        botResponse.actions = [
          { id: '1', label: 'Go to Settings', action: 'goto_settings' },
          { id: '2', label: 'Stay in Chat', action: 'stay' },
        ];
      } 
      else if (userInputLower.match(/profile|account|user/i)) {
        botResponse.text = 'Your profile shows your reading stats and allows you to customize your experience. You can edit your details, change your password, and adjust notification preferences. Would you like to know more about any specific profile feature?';
        botResponse.category = 'account';
      } 
      else if (userInputLower.match(/offline|download/i)) {
        botResponse.text = 'Offline reading allows you to access articles without an internet connection. To enable it, go to App Settings in your profile and toggle "Offline Reading". Articles will be automatically downloaded when you save them.';
        botResponse.category = 'feature_explanation';
      } 
      else if (userInputLower.match(/thank|thanks/i)) {
        botResponse.text = 'You\'re welcome! I\'m here anytime you need assistance with the app. Is there anything else I can help you with?';
        botResponse.category = 'gratitude';
      } 
      else if (userInputLower.match(/bye|goodbye|exit|close/i)) {
        botResponse.text = 'Goodbye! Feel free to chat with me anytime you need assistance. Have a great day!';
        botResponse.category = 'farewell';
      } 
      else {
        // Handle general queries or unknown inputs
        botResponse.text = 'I understand you\'re looking for assistance. Would you like to know about article recommendations, app features, customizing your settings, or check the latest news?';
        botResponse.category = 'general';
        botResponse.actions = [
          { id: '1', label: 'Recommendations', action: 'recommendations' },
          { id: '2', label: 'App Features', action: 'features' },
          { id: '3', label: 'Settings', action: 'settings' },
          { id: '4', label: 'Latest News', action: 'latest_news' },
        ];
      }

      // Stop typing animation
      stopTypingAnimation();
      
      // Add the AI response to messages
      setMessages(prevMessages => [...prevMessages, botResponse]);
      
      // Speak the message if voice is enabled
      speakMessage(botResponse.text);
      
    }, processingTime);
  };

  const handleActionButtonPress = async (action: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    let responseText = '';
    let category = '';
    let actions: ActionButton[] | undefined;
    let newsArticles: Article[] | undefined;
    let sourceAttribution: string | undefined;

    // Handle news-related actions
    if (action === 'latest_news' || action === 'more_news' || 
        action === 'tech_news' || action === 'business_news' || 
        action === 'entertainment_news' || action === 'sports_news' || 
        action === 'science_news' || action === 'health_news') {
      
      startTypingAnimation();
      
      // Initial response while fetching
      const initialResponse: Message = {
        id: Date.now().toString(),
        text: `Fetching the latest ${action.replace('_news', '')} news...`,
        isBot: true,
        timestamp: new Date(),
        category: 'news_fetching',
      };
      
      setMessages(prevMessages => [...prevMessages, initialResponse]);
      
      // Determine the category based on the action
      let newsCategory = 'general';
      if (action === 'tech_news') newsCategory = 'technology';
      else if (action === 'business_news') newsCategory = 'business';
      else if (action === 'entertainment_news') newsCategory = 'entertainment';
      else if (action === 'sports_news') newsCategory = 'sports';
      else if (action === 'science_news') newsCategory = 'science';
      else if (action === 'health_news') newsCategory = 'health';
      
      try {
        // Fetch news articles
        const articles = await fetchNewsArticles(newsCategory);
        
        // Create news response
        const newsResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: articles.length > 0 
            ? `Here are the latest ${newsCategory !== 'general' ? newsCategory : ''} headlines:`
            : "I couldn't find any news articles at the moment. Please try again later.",
          isBot: true,
          timestamp: new Date(),
          category: 'news_results',
          newsArticles: articles.slice(0, 5), // Limit to 5 articles
          sourceAttribution: "Data sourced from NewsAPI.org",
          actions: [
            { id: '1', label: 'Business', action: 'business_news' },
            { id: '2', label: 'Technology', action: 'tech_news' },
            { id: '3', label: 'Entertainment', action: 'entertainment_news' },
            { id: '4', label: 'Back to App', action: 'features' },
          ]
        };
        
        stopTypingAnimation();
        setMessages(prevMessages => [...prevMessages, newsResponse]);
        speakMessage(newsResponse.text);
      } catch (error) {
        stopTypingAnimation();
        console.error('Error fetching news:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm having trouble retrieving news right now. Please try again later.",
          isBot: true,
          timestamp: new Date(),
          category: 'error',
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
      
      return;
    }

    // Handle ask anything action
    if (action === 'ask_anything') {
      responseText = 'I can answer questions about a wide range of topics. What would you like to know?';
      category = 'ask_prompt';
      
      const botResponse: Message = {
        id: Date.now().toString(),
        text: responseText,
        isBot: true,
        timestamp: new Date(),
        category: category,
        actions: actions
      };
  
      setMessages(prevMessages => [...prevMessages, botResponse]);
      speakMessage(responseText);
      
      // Focus the input field for the user to type their question
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      return;
    }

    switch (action) {
      case 'recommendations':
        responseText = 'I can recommend articles based on your reading history and preferences. What type of content are you interested in?';
        category = 'recommendation';
        actions = [
          { id: '1', label: 'Technology', action: 'tech_articles' },
          { id: '2', label: 'Design', action: 'design_articles' },
          { id: '3', label: 'News', action: 'latest_news' },
          { id: '4', label: 'Ask Anything', action: 'ask_anything' },
        ];
        break;
      case 'features':
        responseText = 'This app has several features including personalized recommendations, offline reading, customizable text size, and more. Which feature would you like to explore?';
        category = 'features';
        actions = [
          { id: '1', label: 'Reading Stats', action: 'stats' },
          { id: '2', label: 'Offline Mode', action: 'offline_reading' },
          { id: '3', label: 'Dark Mode', action: 'dark_mode' },
        ];
        break;
      case 'settings':
        responseText = 'You can customize your experience by adjusting text size, enabling dark mode, setting notification preferences, and more. What would you like to customize?';
        category = 'settings';
        actions = [
          { id: '1', label: 'Reading Preferences', action: 'reading_prefs' },
          { id: '2', label: 'Notifications', action: 'notifications' },
          { id: '3', label: 'Theme Settings', action: 'theme' },
        ];
        break;
      case 'tech_articles':
        responseText = 'Based on your interests, I recommend these technology articles: "AI in 2025: Breakthrough Applications", "The Evolution of Mobile Development", and "Quantum Computing Explained".';
        category = 'article_recommendation';
        break;
      case 'design_articles':
      case 'design_trends':
        responseText = 'For design content, check out: "UI Trends to Watch in 2025", "Accessible Design Principles", and "The Psychology of Color in Mobile Apps".';
        category = 'article_recommendation';
        break;
      case 'news_articles':
        // This is now handled by the news-related actions
        return handleActionButtonPress('latest_news');
      case 'offline_reading':
        responseText = 'Offline reading lets you access articles without an internet connection. To use it: 1) Enable the feature in App Settings, 2) Save articles you want to read offline, 3) Access them anytime from your Saved list.';
        category = 'feature_explanation';
        break;
      case 'goto_settings':
        responseText = 'To access settings, close this chat and go to the App Settings section in your profile. There you can toggle dark mode, adjust text size, and manage other preferences.';
        category = 'navigation';
        break;
      case 'text_size':
        responseText = 'You can change text size in Content Preferences. Options include Small, Medium, and Large. This affects readability throughout the app.';
        category = 'settings_help';
        break;
      case 'dark_mode':
        responseText = 'Dark mode reduces eye strain in low-light environments and can save battery life on OLED screens. Toggle it in App Settings or use the sun/moon icon in the profile header.';
        category = 'settings_help';
        break;
      case 'categories':
        responseText = 'In Content Preferences, you can select which news categories appear in your feed. Options include Technology, Design, Business, Science, Health, and more.';
        category = 'settings_help';
        break;
      default:
        responseText = 'I understand you want to know more. Could you provide additional details about what you\'re looking for?';
        category = 'clarification';
    }

    const botResponse: Message = {
      id: Date.now().toString(),
      text: responseText,
      isBot: true,
      timestamp: new Date(),
      category: category,
      actions: actions
    };

    setMessages(prevMessages => [...prevMessages, botResponse]);
    speakMessage(responseText);
  };

  const toggleVoice = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderActionButtons = (actions: ActionButton[] | undefined) => {
    if (!actions || actions.length === 0) return null;
    
    return (
      <View style={styles.actionButtonsContainer}>
        {actions.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[styles.actionButton, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
            onPress={() => handleActionButtonPress(button.action)}
          >
            <Text style={[styles.actionButtonText, { color: isDark ? '#007AFF' : '#007AFF' }]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRelatedContent = (content: any[] | undefined) => {
    if (!content || content.length === 0) return null;
    
    return (
      <View style={styles.relatedContentContainer}>
        <Text style={[styles.relatedContentHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Related Information:
        </Text>
        {content.map((item, index) => (
          <View key={index} style={styles.relatedContentItem}>
            <Text style={[styles.relatedContentTitle, { color: isDark ? '#007AFF' : '#007AFF' }]}>
              {item.title}
            </Text>
            <Text style={[styles.relatedContentSnippet, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {item.snippet}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[
        styles.messageBubble,
        styles.botBubble, 
        { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }
      ]}>
        <RNAnimated.View style={[styles.typingContainer, { opacity: typingDotsOpacity }]}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </RNAnimated.View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(142, 142, 147, 0.2)',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    voiceButton: {
      marginRight: 12,
    },
    closeButton: {
      padding: 4,
    },
    inputSectionContainer: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(142, 142, 147, 0.2)',
      backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: 'rgba(142, 142, 147, 0.3)',
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      maxHeight: 100,
    },
    sendButton: {
      padding: 8,
      borderRadius: 20,
    },
    messagesList: {
      padding: 16,
      paddingBottom: 20,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 20,
      marginBottom: 12,
    },
    botBubble: {
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    messageTime: {
      fontSize: 12,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    actionButtonText: {
      fontSize: 14,
    },
    relatedContentContainer: {
      marginTop: 8,
      marginBottom: 16,
    },
    relatedContentHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    relatedContentItem: {
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(44, 44, 46, 0.7)' : 'rgba(229, 229, 234, 0.7)',
    },
    relatedContentTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    relatedContentSnippet: {
      fontSize: 14,
    },
    typingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 6,
      height: 30,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#8E8E93' : '#8E8E93',
      margin: 2,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: 16,
    },
    dateSeparatorText: {
      fontSize: 12,
      color: '#8E8E93',
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            AI Assistant
          </Text>
          <View style={styles.headerControls}>
            <TouchableOpacity onPress={toggleVoice} style={styles.voiceButton}>
              <Ionicons 
                name={voiceEnabled ? "volume-high" : "volume-mute"} 
                size={24} 
                color={voiceEnabled ? '#007AFF' : isDark ? '#8E8E93' : '#8E8E93'} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons 
                name="close-circle" 
                size={28} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: 120 + keyboardHeight } // Adjust padding based on keyboard height
          ]}
          ListFooterComponent={renderTypingIndicator}
          renderItem={({ item }) => (
            <View>
              <View style={[
                styles.messageBubble,
                item.isBot
                  ? [styles.botBubble, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }] 
                  : [styles.userBubble, { backgroundColor: '#007AFF' }]
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: item.isBot ? (isDark ? '#FFFFFF' : '#000000') : '#FFFFFF' }
                ]}>
                  {item.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  { color: item.isBot ? (isDark ? '#8E8E93' : '#8E8E93') : 'rgba(255,255,255,0.7)' }
                ]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
              {item.isBot && item.relatedContent && renderRelatedContent(item.relatedContent)}
              {item.isBot && item.actions && renderActionButtons(item.actions)}
            </View>
          )}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          style={[
            styles.inputContainer,
            { bottom: Platform.OS === 'android' ? keyboardHeight : 0 }
          ]}
        >
          <View style={[
            styles.inputWrapper,
            { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
          ]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              onPress={handleSend}
              style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default ChatbotModal;