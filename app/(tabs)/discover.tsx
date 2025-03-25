import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Animated,
  ImageBackground,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { fetchNewsByCategory, searchNews, Article } from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const categories = [
  'All',
  'Technology',
  'Business',
  'Science',
  'Health',
  'Sports',
  'Entertainment',
];

export default function DiscoverScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadArticles();
    loadSavedArticles();
  }, [selectedCategory]);

  const loadSavedArticles = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      if (saved) {
        setSavedArticles(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      console.log(`Fetching articles for category: ${selectedCategory}`);
      const fetchedArticles = await fetchNewsByCategory(
        selectedCategory === 'All' ? 'all' : selectedCategory
      );

      console.log('Fetched Articles:', fetchedArticles);
      setArticles(fetchedArticles || []);
      fadeIn();
    } catch (error) {
      console.error('Error fetching news:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      console.log(`Searching news for query: ${searchQuery}`);
      const results = await searchNews(searchQuery);
      console.log('Search Results:', results);
      setArticles(results || []);
      fadeIn();
    } catch (error) {
      console.error('Error searching news:', error);
    }
    setLoading(false);
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

  const animateSave = () => {
    saveAnim.setValue(1.5);
    Animated.spring(saveAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateShare = () => {
    shareAnim.setValue(1.5);
    Animated.spring(shareAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isArticleSaved = (article: Article): boolean => {
    return savedArticles.includes(article.url);
  };

  const toggleSaveArticle = async (article: Article) => {
    let updatedSavedArticles = [...savedArticles];
    
    if (isArticleSaved(article)) {
      updatedSavedArticles = updatedSavedArticles.filter(url => url !== article.url);
    } else {
      updatedSavedArticles.push(article.url);
      animateSave();
      
      // Save full article data for the saved screen
      try {
        const savedArticlesData = await AsyncStorage.getItem('savedArticlesData');
        let articlesData = savedArticlesData ? JSON.parse(savedArticlesData) : [];
        
        // Add formatted data for display in saved screen
        articlesData.push({
          id: article.url,
          title: article.title,
          image: article.urlToImage,
          category: article.source.name,
          date: new Date(),
          readTime: `${Math.ceil((article.content?.length || 0) / 1000) || 5} min read`,
          content: article.content,
          author: article.author,
          source: {
            name: article.source.name
          },
          url: article.url
        });
        
        await AsyncStorage.setItem('savedArticlesData', JSON.stringify(articlesData));
      } catch (error) {
        console.error('Error saving article data:', error);
      }
    }
    
    setSavedArticles(updatedSavedArticles);
    try {
      await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedSavedArticles));
    } catch (error) {
      console.error('Error saving articles:', error);
    }
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    slideIn(); // Animate full news appearance
  };

  const openSourceUrl = (article: Article) => {
    if (article.url) {
      Linking.openURL(article.url).catch(err => 
        console.error('Error opening URL:', err)
      );
    }
  };

  const shareArticle = async (article: Article) => {
    animateShare();
    try {
      const result = await Share.share({
        message: `Check out this article: ${article.title}\n\n${article.url}`,
        url: article.url,
        title: article.title,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared with ${result.activityType}`);
        } else {
          // shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const styles = createStyles(isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Full News View */}
      {selectedArticle ? (
        <Animated.View style={[styles.fullNewsContainer, { transform: [{ translateY: slideAnim }] }]}>
          <ImageBackground source={{ uri: selectedArticle.urlToImage }} style={styles.fullNewsImage}>
            <View style={styles.fullNewsControls}>
              <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <Animated.View style={{ transform: [{ scale: shareAnim }], marginRight: 10 }}>
                  <TouchableOpacity onPress={() => shareArticle(selectedArticle)} style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={24} color="white" />
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                  <TouchableOpacity onPress={() => toggleSaveArticle(selectedArticle)} style={styles.actionButton}>
                    <Ionicons 
                      name={isArticleSaved(selectedArticle) ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </ImageBackground>
          <Text style={styles.fullNewsTitle}>{selectedArticle.title}</Text>
          <Text style={styles.fullNewsAuthor}>{selectedArticle.author || 'Unknown author'}</Text>
          <Text style={styles.fullNewsContent}>{selectedArticle.content || selectedArticle.description}</Text>
          <TouchableOpacity onPress={() => openSourceUrl(selectedArticle)}>
            <Text style={styles.fullNewsSource}>Source: {selectedArticle.source.name}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>Discover</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search news..."
                placeholderTextColor={isDark ? '#BBB' : '#8E8E93'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Ionicons name="search-outline" size={24} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Section Title */}
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All News' : `${selectedCategory} News`}
            </Text>

          {/* Articles */}
          {loading ? (
            <ActivityIndicator size="large" color="#EAC8A4" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.articlesContainer}>
              {articles.length > 0 ? (
                articles.map((article, index) => (
                  <Animated.View key={index} style={[styles.articleCard, { opacity: fadeAnim }]}>
                    <TouchableOpacity onPress={() => handleArticleSelect(article)}>
                      <ImageBackground source={{ uri: article.urlToImage }} style={styles.articleBackground}>
                        <View style={styles.overlay}>
                          <View style={styles.articleHeader}>
                            <Text style={styles.articleSource}>{article.source.name}</Text>
                            <View style={styles.articleActions}>
                              <TouchableOpacity 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  shareArticle(article);
                                }}
                                style={styles.articleAction}
                              >
                                <Ionicons name="share-social-outline" size={20} color="#FFD700" />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  toggleSaveArticle(article);
                                }}
                                style={styles.articleAction}
                              >
                                <Animated.View style={{ transform: [{ scale: isArticleSaved(article) ? 1 : 1 }] }}>
                                  <Ionicons 
                                    name={isArticleSaved(article) ? "bookmark" : "bookmark-outline"} 
                                    size={20} 
                                    color="#FFD700" 
                                  />
                                </Animated.View>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.articleTitle}>{article.title}</Text>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  </Animated.View>
                ))
              ) : (
                <Text style={styles.noArticlesText}>No articles available.</Text>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// StyleSheet
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
      marginBottom: 24,
    },
    appName: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#EAC8A4',
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#333' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#FFF' : '#000',
      padding: 12,
    },
    searchButton: {
      padding: 8,
    },
    categoriesContainer: {
      marginBottom: 24,
    },
    categoriesContent: {
      paddingRight: 16,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#333' : '#FFFFFF',
      marginRight: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    categoryButtonActive: {
      backgroundColor: '#EAC8A4',
    },
    categoryText: {
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
    },
    categoryTextActive: {
      color: isDark ? '#000' : '#000',
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#FFF' : '#000',
      marginBottom: 16,
    },
    articlesContainer: {
      gap: 16,
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
    articleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    articleSource: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    articleActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    articleAction: {
      padding: 5,
      marginLeft: 10,
    },
    articleTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    noArticlesText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#8E8E93',
      marginTop: 20,
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
    fullNewsControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
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
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 20,
    },
    actionButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 20,
    },
  });