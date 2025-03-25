import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ImageBackground,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

// Define the SavedArticle type to match the structure we save
interface SavedArticle {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  content?: string;
  author?: string;
  source?: {
    name: string;
  };
  url?: string;
}

export default function SavedScreen() {
  const { isDark } = useTheme();
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Load saved articles when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedArticles();
    }, [])
  );

  const loadSavedArticles = async () => {
    try {
      const savedArticlesData = await AsyncStorage.getItem('savedArticlesData');
      if (savedArticlesData) {
        const parsedArticles = JSON.parse(savedArticlesData);
        setArticles(parsedArticles);
        fadeIn();
      }
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedArticles();
    setRefreshing(false);
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const slideIn = () => {
    slideAnim.setValue(100);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const removeArticle = async (id: string) => {
    // If we're viewing this article, go back to the list
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle(null);
    }
    
    // Filter out the article from the UI
    const updatedArticles = articles.filter(article => article.id !== id);
    setArticles(updatedArticles);
    
    try {
      // Update the full articles data
      await AsyncStorage.setItem('savedArticlesData', JSON.stringify(updatedArticles));
      
      // Update the savedArticles URLs list
      const savedArticleUrls = await AsyncStorage.getItem('savedArticles');
      if (savedArticleUrls) {
        const urls = JSON.parse(savedArticleUrls);
        const updatedUrls = urls.filter((url: string) => url !== id);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedUrls));
      }
    } catch (error) {
      console.error('Error removing article:', error);
    }
  };

  const handleArticleSelect = (article: SavedArticle) => {
    setSelectedArticle(article);
    slideIn(); // Animate full news appearance
  };

  const openSourceUrl = (article: SavedArticle) => {
    if (article.url) {
      Linking.openURL(article.url).catch(err => 
        console.error('Error opening URL:', err)
      );
    }
  };

  const styles = createStyles(isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={!selectedArticle && <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Full Article View */}
      {selectedArticle ? (
        <Animated.View style={[styles.fullNewsContainer, { transform: [{ translateY: slideAnim }] }]}>
          <ImageBackground source={{ uri: selectedArticle.image }} style={styles.fullNewsImage}>
            <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
          </ImageBackground>
          <Text style={styles.fullNewsTitle}>{selectedArticle.title}</Text>
          <Text style={styles.fullNewsAuthor}>{selectedArticle.author || 'Unknown Author'}</Text>
          <Text style={styles.fullNewsContent}>{selectedArticle.content || 'No content available'}</Text>
          {selectedArticle.url && (
            <TouchableOpacity onPress={() => openSourceUrl(selectedArticle)}>
              <Text style={styles.fullNewsSource}>Source: {selectedArticle.source?.name || selectedArticle.category}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>Saved Articles</Text>
              <Text style={styles.date}>{articles.length} articles</Text>
            </View>
          </View>

          {/* Articles Section */}
          {articles.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Your Bookmarks</Text>

              {articles.map((article, index) => (
                <Animated.View key={index} style={[styles.articleCard, { opacity: fadeAnim }]}>
                  <TouchableOpacity onPress={() => handleArticleSelect(article)}>
                    <ImageBackground source={{ uri: article.image }} style={styles.articleBackground}>
                      <View style={styles.overlay}>
                        <View style={styles.articleSourceContainer}>
                          <Text style={styles.articleSource}>{article.source?.name || article.category}</Text>
                          <TouchableOpacity onPress={() => removeArticle(article.id)} style={styles.removeButton}>
                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.articleTitle}>{article.title}</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={64} color={isDark ? '#8E8E93' : '#8E8E93'} />
              <Text style={styles.emptyStateTitle}>No saved articles</Text>
              <Text style={styles.emptyStateText}>
                Articles you save will appear here
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#F8F8F8',
    },
    content: {
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    appName: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#EAC8A4',
    },
    date: {
      fontSize: 14,
      color: isDark ? '#BBB' : '#8E8E93',
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#FFF' : '#000',
      marginBottom: 16,
    },
    articleCard: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
      height: 200,
    },
    articleBackground: {
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end',
    },
    overlay: {
      padding: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    articleSourceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    articleSource: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    articleTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    fullNewsContainer: {
      padding: 16,
    },
    fullNewsImage: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    fullNewsTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 12,
      color: isDark ? '#FFF' : '#000',
    },
    fullNewsAuthor: {
      fontSize: 16,
      color: isDark ? '#BBB' : '#555',
      marginTop: 4,
    },
    fullNewsContent: {
      fontSize: 16,
      marginTop: 8,
      color: isDark ? '#DDD' : '#333',
    },
    fullNewsSource: {
      marginTop: 20,
      fontStyle: 'italic',
      color: isDark ? '#BBB' : '#555',
      textDecorationLine: 'underline',
    },
    backButton: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 20,
    },
    removeButton: {
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      marginTop: 80,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
    },
  });