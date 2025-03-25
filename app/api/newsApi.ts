import axios from 'axios';

const API_KEY = 'b3ab9dd1c97a41468861911e192b01ba';
const BASE_URL = 'https://newsapi.org/v2';

export interface Article {
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  author?: string;
  source: {
    name: string;
  };
  category?: string;
}

// List of valid categories for the News API
const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

export const fetchTopHeadlines = async (category?: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/top-headlines`, {
      params: {
        country: 'us',
        category,
        apiKey: API_KEY,
        pageSize: 20,
      },
    });

    // Filter out articles without images
    const articles = response.data.articles.filter(
      (article: Article) => article.urlToImage
    );

    return articles.map((article: Article) => ({
      ...article,
      category: category || article.source.name,
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

export const fetchNewsByCategory = async (category: string) => {
  try {
    if (category === 'all') {
      // For 'all' category, we'll just use top headlines without a specific category
      return await fetchTopHeadlines();
    } else {
      // Convert category to lowercase for the API
      const lowerCaseCategory = category.toLowerCase();
      
      console.log(`Fetching news for category: ${lowerCaseCategory}`);
      const response = await axios.get(`${BASE_URL}/top-headlines`, {
        params: {
          country: 'us',
          category: lowerCaseCategory,
          apiKey: API_KEY,
          pageSize: 20,
        },
      });

      if (response.data.status !== 'ok') {
        console.error('API Error:', response.data);
        return [];
      }

      // Filter out articles without images
      const articles = response.data.articles.filter(
        (article: Article) => article.urlToImage
      );

      console.log(`Fetched ${articles.length} articles for category: ${category}`);
      
      // Add category to each article
      return articles.map((article: Article) => ({
        ...article,
        category: category,
      }));
    }
  } catch (error) {
    console.error('Error fetching news by category:', error);
    return [];
  }
};

export const searchNews = async (query: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: query,
        apiKey: API_KEY,
        language: 'en',
        pageSize: 20,
        sortBy: 'relevancy',
      },
    });

    // Filter out articles without images
    return response.data.articles.filter(
      (article: Article) => article.urlToImage
    );
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
};