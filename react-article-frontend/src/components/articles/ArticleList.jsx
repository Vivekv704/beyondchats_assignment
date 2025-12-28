import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../../hooks/useArticles';
import ArticleCard from './ArticleCard';
import ArticleFilter from './ArticleFilter';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../ui/Pagination';
import Button from '../ui/Button';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import styles from './ArticleList.module.css';

const ArticleList = ({ 
  initialFilter = 'all',
  pageSize = DEFAULT_PAGE_SIZE,
  showFilter = true,
  showPagination = true 
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState(initialFilter);

  // Fetch articles using our custom hook
  const {
    data: articlesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useArticles({
    page: currentPage,
    pageSize,
    filter,
    enabled: true,
  });

  const articles = articlesResponse?.data || [];
  const meta = articlesResponse?.meta || {};
  const totalPages = meta.last_page || 1;
  const totalArticles = meta.total || 0;

  // Handle filter changes
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle article card clicks
  const handleArticleClick = useCallback((articleId) => {
    navigate(`/articles/${articleId}`);
  }, [navigate]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner 
          size="large" 
          text="Loading articles..." 
        />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3 className={styles.errorTitle}>Failed to Load Articles</h3>
          <p className={styles.errorMessage}>
            {error?.message || 'Something went wrong while loading articles. Please try again.'}
          </p>
          <div className={styles.errorActions}>
            <Button onClick={handleRetry} variant="primary">
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!articles.length) {
    return (
      <div className={styles.container}>
        {showFilter && (
          <ArticleFilter
            currentFilter={filter}
            onFilterChange={handleFilterChange}
            disabled={isFetching}
          />
        )}
        
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3 className={styles.emptyTitle}>No Articles Found</h3>
          <p className={styles.emptyMessage}>
            {filter === 'all' 
              ? "There are no articles available at the moment."
              : `No ${filter} articles found. Try changing the filter or check back later.`
            }
          </p>
          {filter !== 'all' && (
            <Button 
              onClick={() => handleFilterChange('all')} 
              variant="outline"
            >
              Show All Articles
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filter Section */}
      {showFilter && (
        <div className={styles.filterSection}>
          <ArticleFilter
            currentFilter={filter}
            onFilterChange={handleFilterChange}
            disabled={isFetching}
            showCounts={false}
          />
        </div>
      )}

      {/* Results Summary */}
      <div className={styles.summary}>
        <p className={styles.summaryText}>
          {isFetching ? (
            <span className={styles.loadingText}>Loading...</span>
          ) : (
            <>
              Showing {articles.length} of {totalArticles} articles
              {filter !== 'all' && (
                <span className={styles.filterInfo}> ({filter})</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Articles Grid */}
      <div className={styles.grid}>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={handleArticleClick}
          />
        ))}
      </div>

      {/* Loading overlay for pagination */}
      {isFetching && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="small" text="Loading..." />
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className={styles.paginationSection}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={isFetching}
            maxVisiblePages={5}
          />
        </div>
      )}
    </div>
  );
};

export default ArticleList;