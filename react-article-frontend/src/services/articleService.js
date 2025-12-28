import api from './api';
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from '../utils/constants';

/**
 * Article Service
 * Handles all article-related API calls
 */
export const articleService = {
  /**
   * Fetch articles with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: DEFAULT_PAGE_SIZE)
   * @param {string} params.type - Article type filter ('all', 'original', 'enhanced')
   * @param {string} params.search - Search query
   * @returns {Promise<Object>} Articles list response
   */
  async getArticles(params = {}) {
    const {
      page = 1,
      per_page = DEFAULT_PAGE_SIZE,
      type = 'all',
      search = '',
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });

    // Add type filter if not 'all'
    if (type && type !== 'all') {
      queryParams.append('type', type);
    }

    // Add search query if provided
    if (search.trim()) {
      queryParams.append('search', search.trim());
    }

    try {
      // Use direct API endpoint temporarily to bypass Laravel ORM issues
      const response = await api.get(`/articles-direct?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  /**
   * Fetch a single article by ID
   * @param {string|number} id - Article ID
   * @returns {Promise<Object>} Article detail response
   */
  async getArticleById(id) {
    if (!id) {
      throw new Error('Article ID is required');
    }

    try {
      // Use direct API endpoint temporarily to bypass Laravel ORM issues
      const response = await api.get(`/articles-direct/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new article (for future use)
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Created article response
   */
  async createArticle(articleData) {
    try {
      const response = await api.post('/articles', articleData);
      return response.data;
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  },

  /**
   * Update an existing article (for future use)
   * @param {string|number} id - Article ID
   * @param {Object} articleData - Updated article data
   * @returns {Promise<Object>} Updated article response
   */
  async updateArticle(id, articleData) {
    if (!id) {
      throw new Error('Article ID is required');
    }

    try {
      const response = await api.put(`/articles/${id}`, articleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an article (for future use)
   * @param {string|number} id - Article ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteArticle(id) {
    if (!id) {
      throw new Error('Article ID is required');
    }

    try {
      const response = await api.delete(`/articles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting article ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get article statistics (for future use)
   * @returns {Promise<Object>} Statistics response
   */
  async getArticleStats() {
    try {
      const response = await api.get('/articles/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching article stats:', error);
      throw error;
    }
  },
};

export default articleService;