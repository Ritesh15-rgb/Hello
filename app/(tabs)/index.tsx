import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TextInput,
  ImageBackground,
  Linking,
  Share,
  Easing,
  FlatList,
  ToastAndroid,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { fetchTopHeadlines, searchNews, Article } from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export default function HomeScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [offlineArticles, setOfflineArticles] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // New state for followed sources
  const [followedSources, setFollowedSources] = useState<string[]>([]);
  
  // Related content states
  const [sameSourceArticles, setSameSourceArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  
  // Existing animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;
  const offlineAnim = useRef(new Animated.Value(1)).current;

  // New animation values for title animation
  const titlePositionX = useRef(new Animated.Value(0)).current;
  const titlePositionY = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(1.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;

  // Get screen dimensions for center positioning
  const { width, height } = Dimensions.get('window');
  
  // Animation sequence for app opening
  const animateTitleOnLoad = () => {
    // Starting point - center of screen
    titlePositionX.setValue((width / 2) - 100); // Center X (adjust this based on your app name width)
    titlePositionY.setValue(height / 2 - 100);  // Center Y
    titleScale.setValue(1.5);  // Larger scale
    titleOpacity.setValue(1);  // Fully visible
    dateOpacity.setValue(0);   // Date hidden
    searchOpacity.setValue(0); // Search button hidden
    
    // Animation sequence
    Animated.sequence([
      // Hold for a moment
      Animated.delay(500),
      
      // Move to final position with spring physics
      Animated.parallel([
        Animated.spring(titlePositionX, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(titlePositionY, {
          toValue: 20,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dateOpacity, {
          toValue: 1,
          duration: 600,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(searchOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  };
  
  
  // New animation for follow button
  const followAnim = useRef(new Animated.Value(1)).current;
  
  // New animations for refresh control
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const refreshOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for related news sections
  const relatedSourceAnim = useRef(new Animated.Value(0)).current;
  const trendingAnim = useRef(new Animated.Value(0)).current;
  const recommendedAnim = useRef(new Animated.Value(0)).current;
  
  // Convert rotation value to interpolated string for transform
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Animation controllers
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    checkConnectivity();
    loadNews();
    loadSavedArticles();
    loadOfflineArticles();
    loadFollowedSources();
    animateTitleOnLoad();
    
    // Connectivity listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOfflineMode(!state.isConnected);
      if (!state.isConnected) {
        showToast('You are offline. Showing available offline content.');
      }
    });
    
    // Cleanup animations when component unmounts
    return () => {
      if (spinAnimation.current) {
        spinAnimation.current.stop();
      }
      unsubscribe();
    };
  }, []);

  // Check internet connectivity
  const checkConnectivity = async () => {
    const networkState = await NetInfo.fetch();
    setIsOfflineMode(!networkState.isConnected);
    if (!networkState.isConnected) {
      loadOfflineContent();
    }
  };

  // Load offline content when no connection
  const loadOfflineContent = async () => {
    try {
      const offlineArticlesData = await AsyncStorage.getItem('offlineArticlesData');
      if (offlineArticlesData) {
        const parsedData = JSON.parse(offlineArticlesData);
        setArticles(parsedData);
        fadeIn();
      }
    } catch (error) {
      console.error('Error loading offline content:', error);
    }
  };

  // Effect to find related articles when an article is selected
  useEffect(() => {
    if (selectedArticle) {
      findRelatedContent(selectedArticle);
    }
  }, [selectedArticle]);

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

  const loadOfflineArticles = async () => {
    try {
      const offline = await AsyncStorage.getItem('offlineArticles');
      if (offline) {
        setOfflineArticles(JSON.parse(offline));
      }
    } catch (error) {
      console.error('Error loading offline articles:', error);
    }
  };

  // New function to load followed sources
  const loadFollowedSources = async () => {
    try {
      const followed = await AsyncStorage.getItem('followedSources');
      if (followed) {
        setFollowedSources(JSON.parse(followed));
      }
    } catch (error) {
      console.error('Error loading followed sources:', error);
    }
  };

  const loadNews = async () => {
    try {
      if (isOfflineMode) {
        loadOfflineContent();
        return;
      }
      
      const headlines = await fetchTopHeadlines();
      
      // Sort articles to show followed sources first
      const sortedHeadlines = sortArticlesByFollowedSources(headlines);
      setArticles(sortedHeadlines);
      
      // Save the headlines for offline access
      await AsyncStorage.setItem('offlineArticlesData', JSON.stringify(headlines));
      
      fadeIn();
    } catch (error) {
      console.error('Error loading news:', error);
      loadOfflineContent();
    }
  };

  // New function to sort articles with followed sources first
  const sortArticlesByFollowedSources = (articles: Article[]) => {
    return [...articles].sort((a, b) => {
      const aFollowed = followedSources.includes(a.source.name);
      const bFollowed = followedSources.includes(b.source.name);
      
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      return 0;
    });
  };

  // Show toast message
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  // Enhanced function to find various related content
  const findRelatedContent = (article: Article) => {
    // Reset animations
    relatedSourceAnim.setValue(0);
    trendingAnim.setValue(0);
    recommendedAnim.setValue(0);
    
    // 1. Articles from same source
    const sameSource = articles.filter(
      a => a.source.name === article.source.name && a.url !== article.url
    );
    setSameSourceArticles(sameSource);
    
    // 2. "Trending now" articles (random selection for demo, would be based on real metrics)
    const trending = [...articles]
      .filter(a => a.url !== article.url)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    setTrendingArticles(trending);
    
    // 3. "Recommended for you" (simulated personalized recommendations)
    // In a real app, this would use user preferences or reading history
    const keywords = article.title.toLowerCase().split(' ');
    const recommended = articles
      .filter(a => a.url !== article.url)
      .filter(a => {
        const title = a.title.toLowerCase();
        return keywords.some(word => 
          word.length > 4 && title.includes(word)
        );
      })
      .slice(0, 3);
      
    // Add more recommendations if needed to have at least 3
    if (recommended.length < 3) {
      const additional = articles
        .filter(a => a.url !== article.url && !recommended.includes(a))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 - recommended.length);
      
      setRecommendedArticles([...recommended, ...additional]);
    } else {
      setRecommendedArticles(recommended);
    }
    
    // Animate sections with slight delays for better UX
    Animated.sequence([
      Animated.timing(relatedSourceAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(trendingAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(recommendedAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Enhanced refresh animation
  const startRefreshAnimation = () => {
    // Reset animation values
    rotateAnim.setValue(0);
    scaleAnim.setValue(0);
    refreshOpacityAnim.setValue(0);
    
    // Create spinning animation
    spinAnimation.current = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    // Start animations
    spinAnimation.current.start();
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(refreshOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const stopRefreshAnimation = () => {
    // Stop all animations
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
    
    // Fade out animation elements
    Animated.timing(refreshOpacityAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Modified onRefresh function
  const onRefresh = async () => {
    setRefreshing(true);
    startRefreshAnimation();
    
    // Small delay to show animation
    setTimeout(async () => {
      await loadNews();
      stopRefreshAnimation();
      setRefreshing(false);
    }, 1500);
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
      friction: 3,
      tension: 40,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const animateShare = () => {
    shareAnim.setValue(1.5);
    Animated.spring(shareAnim, {
      friction: 3,
      tension: 40,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const animateOffline = () => {
    offlineAnim.setValue(1.5);
    Animated.spring(offlineAnim, {
      friction: 3,
      tension: 40,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  // New animation for follow button
  const animateFollow = () => {
    followAnim.setValue(1.5);
    Animated.spring(followAnim, {
      friction: 3,
      tension: 40,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        if (isOfflineMode) {
          showToast('Search is unavailable in offline mode');
          return;
        }
        
        const results = await searchNews(searchQuery);
        // Sort search results with followed sources first
        const sortedResults = sortArticlesByFollowedSources(results);
        setArticles(sortedResults);
        fadeIn();
      } catch (error) {
        console.error('Error searching news:', error);
      }
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) setSearchQuery('');
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    slideIn();
  };

  const isArticleSaved = (article: Article): boolean => {
    return savedArticles.includes(article.url);
  };

  const isArticleOffline = (article: Article): boolean => {
    return offlineArticles.includes(article.url);
  };
  
  // New function to check if source is followed
  const isSourceFollowed = (sourceName: string): boolean => {
    return followedSources.includes(sourceName);
  };
  
  // New function to toggle follow status for a source
  const toggleFollowSource = async (sourceName: string) => {
    let updatedFollowedSources = [...followedSources];
    
    if (isSourceFollowed(sourceName)) {
      updatedFollowedSources = updatedFollowedSources.filter(name => name !== sourceName);
      showToast(`Unfollowed ${sourceName}`);
    } else {
      updatedFollowedSources.push(sourceName);
      animateFollow();
      showToast(`Following ${sourceName}`);
    }
    
    setFollowedSources(updatedFollowedSources);
    
    try {
      await AsyncStorage.setItem('followedSources', JSON.stringify(updatedFollowedSources));
      
      // Re-sort articles to put followed sources at the top
      setArticles(sortArticlesByFollowedSources(articles));
    } catch (error) {
      console.error('Error saving followed sources:', error);
    }
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
        
        articlesData.push({
          id: article.url,
          title: article.title,
          image: article.urlToImage,
          category: article.source.name,
          date: new Date(),
          readTime: `${Math.ceil(article.content?.length / 1000)} min read`,
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

  // New function to save article for offline reading
  const toggleOfflineArticle = async (article: Article) => {
    let updatedOfflineArticles = [...offlineArticles];
    
    if (isArticleOffline(article)) {
      updatedOfflineArticles = updatedOfflineArticles.filter(url => url !== article.url);
      showToast('Article removed from offline reading');
    } else {
      updatedOfflineArticles.push(article.url);
      animateOffline();
      
      // Save full article data for offline reading
      try {
        const offlineArticlesData = await AsyncStorage.getItem('offlineArticlesData');
        let articlesData = offlineArticlesData ? JSON.parse(offlineArticlesData) : [];
        
        // Check if article already exists in offline storage
        const exists = articlesData.some((a: Article) => a.url === article.url);
        
        if (!exists) {
          articlesData.push({
            ...article,
            savedForOffline: true,
            offlineSavedDate: new Date()
          });
          
          await AsyncStorage.setItem('offlineArticlesData', JSON.stringify(articlesData));
        }
        
        showToast('Article saved for offline reading');
      } catch (error) {
        console.error('Error saving offline article data:', error);
      }
    }
    
    setOfflineArticles(updatedOfflineArticles);
    try {
      await AsyncStorage.setItem('offlineArticles', JSON.stringify(updatedOfflineArticles));
    } catch (error) {
      console.error('Error saving offline articles:', error);
    }
  };

  const openSourceUrl = (article: Article) => {
    if (isOfflineMode) {
      showToast('Cannot open source URL in offline mode');
      return;
    }
    
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
          console.log(`Shared with ${result.activityType}`);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const styles = createStyles(isDark);

  // Simple RefreshControl with custom render
  const renderCustomRefresh = () => {
    // Only render custom refresh UI when refreshing
    if (!refreshing) return null;
    
    return (
      <View style={styles.refreshContainer}>
        <Animated.View 
          style={[
            styles.refreshCircle,
            {
              opacity: refreshOpacityAnim,
              transform: [
                { rotate: spin },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Ionicons 
            name="refresh-outline" 
            size={24} 
            color="#EAC8A4" 
          />
        </Animated.View>
        
        <Animated.Text 
          style={[
            styles.refreshText,
            { opacity: refreshOpacityAnim }
          ]}
        >
          Finding the latest news...
        </Animated.Text>
      </View>
    );
  };

  // Render a related article item
  const renderArticleCard = (article: Article, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.relatedArticleCard}
      onPress={() => handleArticleSelect(article)}
    >
      <ImageBackground 
        source={{ uri: article.urlToImage }} 
        style={styles.relatedArticleImage}
        imageStyle={{ borderRadius: 8 }}
      >
        <View style={styles.relatedArticleOverlay}>
          <View style={styles.sourceRow}>
            <Text style={styles.relatedArticleSource}>{article.source.name}</Text>
            <TouchableOpacity 
              onPress={() => toggleFollowSource(article.source.name)}
              style={styles.followButton}
            >
              <Ionicons 
                name={isSourceFollowed(article.source.name) ? "heart" : "heart-outline"} 
                size={16} 
                color="#FFD700" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.relatedArticleTitle} numberOfLines={2}>
            {article.title}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  // Render horizontal scrollable article list with follow buttons
  const renderHorizontalArticleList = (articles: Article[]) => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={articles}
      keyExtractor={(item, index) => `${item.url}-${index}`}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.horizontalArticleCard}
          onPress={() => handleArticleSelect(item)}
        >
          <ImageBackground 
            source={{ uri: item.urlToImage }} 
            style={styles.horizontalArticleImage}
            imageStyle={{ borderRadius: 8 }}
          >
            <View style={styles.horizontalArticleOverlay}>
              <View style={styles.sourceRow}>
                <Text style={styles.horizontalArticleSource}>{item.source.name}</Text>
                <TouchableOpacity 
                  onPress={() => toggleFollowSource(item.source.name)}
                  style={styles.followButton}
                >
                  <Ionicons 
                    name={isSourceFollowed(item.source.name) ? "heart" : "heart-outline"} 
                    size={16} 
                    color="#FFD700" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.horizontalArticleTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.horizontalListContent}
    />
  );

  // Section header component
  const SectionHeader = ({ title, icon, animValue }: { title: string, icon: string, animValue: Animated.Value }) => (
    <Animated.View 
      style={[
        styles.sectionHeader,
        { opacity: animValue }
      ]}
    >
      <Ionicons name={icon} size={20} color={isDark ? '#EAC8A4' : '#EAC8A4'} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </Animated.View>
  );

  // Offline indicator component
  const OfflineIndicator = () => {
    if (!isOfflineMode) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
        <Text style={styles.offlineText}>Offline Mode</Text>
      </View>
    );
  };
  
  // New component for followed sources section
  const FollowedSourcesSection = () => {
    // Only show if we have followed sources
    if (followedSources.length === 0) return null;
    
    // Get articles from followed sources
    const followedArticles = articles.filter(article => 
      followedSources.includes(article.source.name)
    );
    
    if (followedArticles.length === 0) return null;
    
    return (
      <View style={styles.followedSourcesSection}>
        <View style={styles.followedSourcesHeader}>
          <Ionicons name="heart" size={24} color="#EAC8A4" />
          <Text style={styles.followedSourcesTitle}>Following</Text>
        </View>
        
        {followedArticles.slice(0, 3).map((article, index) => (
          <Animated.View key={index} style={[styles.articleCard, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => handleArticleSelect(article)}>
              <ImageBackground source={{ uri: article.urlToImage }} style={styles.articleBackground}>
                <View style={styles.overlay}>
                  <View style={styles.sourceRow}>
                    <Text style={styles.articleSource}>{article.source.name}</Text>
                    <Animated.View style={{ transform: [{ scale: followAnim }] }}>
                      <TouchableOpacity 
                        onPress={() => toggleFollowSource(article.source.name)}
                        style={styles.followButton}
                      >
                        <Ionicons 
                          name="heart" 
                          size={18} 
                          color="#FFD700" 
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  
                  {/* Offline indicator for list view */}
                  {isArticleOffline(article) && (
                    <View style={styles.miniOfflineBadge}>
                      <Ionicons name="download" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Render custom refresh animation */}
      {renderCustomRefresh()}
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          !selectedArticle ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={50}
              // Make the default indicator transparent or very light
              tintColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
              colors={[isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"]}
            />
          ) : undefined
        }
      >
        {/* Full News View */}
        {selectedArticle ? (
          <Animated.View style={[styles.fullNewsContainer, { transform: [{ translateY: slideAnim }] }]}>
            <ImageBackground source={{ uri: selectedArticle.urlToImage }} style={styles.fullNewsImage}>
              <View style={styles.fullNewsControls}>
                <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.backButton}>
                  <Ionicons name="arrow-back-outline" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.actionButtonsContainer}>
                  
                  <Animated.View style={{ transform: [{ scale: offlineAnim }], marginRight: 10 }}>
                    <TouchableOpacity onPress={() => toggleOfflineArticle(selectedArticle)} style={styles.actionButton}>
                      <Ionicons 
                        name={isArticleOffline(selectedArticle) ? "download" : "download-outline"} 
                        size={24} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  </Animated.View>
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
            <View style={styles.sourceContainer}>
              <Text style={styles.fullNewsSource} onPress={() => openSourceUrl(selectedArticle)}>
                {selectedArticle.source.name}
              </Text>
              <TouchableOpacity 
                onPress={() => toggleFollowSource(selectedArticle.source.name)}
                style={styles.fullNewsFollowButton}
              >
                <Ionicons 
                  name={isSourceFollowed(selectedArticle.source.name) ? "heart" : "heart-outline"} 
                  size={18} 
                  color={isDark ? "#EAC8A4" : "#EAC8A4"} 
                />
                <Text style={styles.followText}>
                  {isSourceFollowed(selectedArticle.source.name) ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fullNewsTitle}>{selectedArticle.title}</Text>
            <Text style={styles.fullNewsAuthor}>{selectedArticle.content}</Text>
            <TouchableOpacity onPress={() => openSourceUrl(selectedArticle)}>
              <Text style={styles.fullNewsSource}>Source: {selectedArticle.source.name}</Text>
            </TouchableOpacity>
            
            {/* Offline Badge */}
            {isArticleOffline(selectedArticle) && (
              <View style={styles.offlineBadge}>
                <Ionicons name="download" size={14} color="#FFF" />
                <Text style={styles.offlineBadgeText}>Available Offline</Text>
              </View>
            )}
            
            {/* Related News Sections */}
            <View style={styles.relatedContentContainer}>
              {/* 1. More from the same source */}
              {sameSourceArticles.length > 0 && (
                <>
                  <SectionHeader 
                    title={`More from ${selectedArticle.source.name}`}
                    icon="newspaper-outline"
                    animValue={relatedSourceAnim}
                  />
                  <Animated.View style={{ opacity: relatedSourceAnim }}>
                    {renderHorizontalArticleList(sameSourceArticles)}
                  </Animated.View>
                </>
              )}
              
              {/* 2. Trending now section */}
              {trendingArticles.length > 0 && (
                <>
                  <SectionHeader 
                    title="Trending Now"
                    icon="trending-up-outline"
                    animValue={trendingAnim}
                  />
                  <Animated.View style={{ opacity: trendingAnim }}>
                    {renderHorizontalArticleList(trendingArticles)}
                  </Animated.View>
                </>
              )}
              
              {/* 3. Recommended for you */}
              {recommendedArticles.length > 0 && (
                <>
                  <SectionHeader 
                    title="Recommended For You"
                    icon="star-outline"
                    animValue={recommendedAnim}
                  />
                  <Animated.View style={[styles.recommendedContainer, { opacity: recommendedAnim }]}>
                    {recommendedArticles.map(renderArticleCard)}
                  </Animated.View>
                </>
              )}
              
              {/* Footer CTA */}
              <Animated.View 
                style={[
                  styles.relatedNewsCTA,
                  { opacity: recommendedAnim }
                ]}
              >
                <TouchableOpacity 
                  style={styles.exploreMoreButton}
                  onPress={() => setSelectedArticle(null)}
                >
                  <Text style={styles.exploreMoreText}>Explore More News</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Animated Header */}
            <View style={styles.header}>
              <Animated.View style={{
                transform: [
                  { translateX: titlePositionX },
                  { translateY: titlePositionY },
                  { scale: titleScale }
                ],
                opacity: titleOpacity,
              }}>
                <Text style={styles.appName}>Expo X</Text>
                <Animated.Text style={[styles.date, { opacity: dateOpacity }]}>
                  {format(new Date(), 'EEEE, MMMM d')}
                </Animated.Text>
              </Animated.View>
              <Animated.View style={{ opacity: searchOpacity }}>
                <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
                  <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={24} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Search Bar */}
            {showSearch && (
              <TextInput
                style={styles.searchInput}
                placeholder="Search news..."
                placeholderTextColor={isDark ? '#BBB' : '#8E8E93'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
            )}

            {/* News Section */}
            <Text style={styles.sectionTitle}>
              {isOfflineMode ? 'Available Offline' : 'Today\'s Headlines'}
            </Text>

            {articles.map((article, index) => (
              <Animated.View key={index} style={[styles.articleCard, { opacity: fadeAnim }]}>
                <TouchableOpacity onPress={() => handleArticleSelect(article)}>
                  <ImageBackground source={{ uri: article.urlToImage }} style={styles.articleBackground}>
                    <View style={styles.overlay}>
                      <Text style={styles.articleSource}>{article.source.name}</Text>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      
                      {/* Offline indicator for list view */}
                      {isArticleOffline(article) && (
                        <View style={styles.miniOfflineBadge}>
                          <Ionicons name="download" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#F8F8F8',
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingTop: 40,
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      position: 'relative', // Add this to ensure proper positioning
      zIndex: 10,
      paddingTop: 10, // Add padding to move the header down
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
    searchButton: {
      paddingTop: 40,
    },
    searchInput: {
      backgroundColor: isDark ? '#333' : '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
      color: isDark ? '#FFF' : '#000',
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
    fullNewsControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
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

    sourceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    fullNewsSource: {
      fontStyle: 'italic',
      color: isDark ? '#BBB' : '#555',
      textDecorationLine: 'underline',
    },
    fullNewsFollowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(234, 200, 164, 0.2)' : 'rgba(234, 200, 164, 0.3)',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    followText: {
      marginLeft: 5,
      fontSize: 14,
      color: isDark ? '#EAC8A4' : '#EAC8A4',
      fontWeight: '500',
    },
    backButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 20,
    },
    saveButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 20,
    },
    actionButtonsContainer: {
      position: 'absolute',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      top: 2,
      right: -10,
      gap: 28,
    },
    actionButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 8,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    // New refresh animation styles
    refreshContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },
    refreshCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? '#333' : '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    refreshText: {
      marginTop: 8,
      fontSize: 14,
      color: isDark ? '#EAC8A4' : '#EAC8A4',
      backgroundColor: isDark ? '#333' : '#FFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    // Enhanced related news styles
    relatedContentContainer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#E5E5E5',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#FFF' : '#000',
      marginLeft: 8,
    },
    // Horizontal list styles
    horizontalListContent: {
      paddingRight: 16,
    },
    horizontalArticleCard: {
      width: 220,
      height: 150,
      marginRight: 12,
      borderRadius: 8,
      overflow: 'hidden',
    },
    horizontalArticleImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end',
    },
    horizontalArticleOverlay: {
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    horizontalArticleSource: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    horizontalArticleTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    // Vertical article card styles
    recommendedContainer: {
      marginBottom: 16,
    },
    relatedArticleCard: {
      marginBottom: 12,
      borderRadius: 8,
      overflow: 'hidden',
      height: 130,
    },
    relatedArticleImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end',
    },
    relatedArticleOverlay: {
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    relatedArticleSource: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    relatedArticleTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    // CTA Section
    relatedNewsCTA: {
      marginTop: 10,
      marginBottom: 30,
      alignItems: 'center',
    },
    exploreMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EAC8A4',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      justifyContent: 'center',
    },
    exploreMoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#121212' : '#121212',
      marginRight: 5,
    },
  });