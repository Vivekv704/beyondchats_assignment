import { useQuery, useQueryClient } from '@tanstack/react-query';
import { articleService } from '../services/articleService';
import { QUERY_KEYS } from '../utils/constants';

/**
 * Custom hook for fetching a single article by ID
 * @param {string|number} articleId - Article ID
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Query result with article data, loading state, and error
 */
export const useArticleDetail = (articleId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ARTICLE_DETAIL, articleId],
    queryFn: () => articleService.getArticleById(articleId),
    enabled: enabled && !!articleId, // Only run if enabled and articleId exists
    staleTime: 10 * 60 * 1000, // 10 minutes (articles don't change often)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (article not found)
      if (error?.status === 404) {
        return false;
      }
      // Don't retry on other 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    onError: (error) => {
      console.error(`Error fetching article ${articleId}:`, error);
    },
  });
};

/**
 * Custom hook for prefetching article details (for performance optimization)
 */
export const usePrefetchArticleDetail = () => {
  const queryClient = useQueryClient();

  return (articleId) => {
    if (!articleId) return;

    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.ARTICLE_DETAIL, articleId],
      queryFn: () => articleService.getArticleById(articleId),
      staleTime: 10 * 60 * 1000,
    });
  };
};

/**
 * Custom hook for invalidating article cache (useful after mutations)
 */
export const useInvalidateArticles = () => {
  const queryClient = useQueryClient();

  return {
    invalidateArticles: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ARTICLES] });
    },
    invalidateArticleDetail: (articleId) => {
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.ARTICLE_DETAIL, articleId] 
      });
    },
    invalidateAllArticles: () => {
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.ARTICLES] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.ARTICLE_DETAIL] 
      });
    },
  };
};

export default useArticleDetail;