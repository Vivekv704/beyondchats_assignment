import { useQuery, useQueryClient } from '@tanstack/react-query';
import { articleService } from '../services/articleService';
import { QUERY_KEYS } from '../utils/constants';

/**
 * Custom hook for fetching articles with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Items per page
 * @param {string} options.filter - Article type filter
 * @param {string} options.search - Search query
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Query result with articles data, loading state, and error
 */
export const useArticles = ({
  page = 1,
  pageSize = 12,
  filter = 'all',
  search = '',
  enabled = true,
} = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ARTICLES, { page, pageSize, filter, search }],
    queryFn: () => articleService.getArticles({
      page,
      per_page: pageSize,
      type: filter,
      search,
    }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    onError: (error) => {
      console.error('Error in useArticles:', error);
    },
  });
};

/**
 * Custom hook for prefetching articles (for performance optimization)
 * @param {Object} options - Prefetch options
 */
export const usePrefetchArticles = () => {
  const queryClient = useQueryClient();

  return (options = {}) => {
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.ARTICLES, options],
      queryFn: () => articleService.getArticles(options),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export default useArticles;