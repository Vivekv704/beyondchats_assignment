import { ARTICLE_TYPES } from '../../utils/constants';
import styles from './ArticleFilter.module.css';

const ArticleFilter = ({ 
  currentFilter = 'all', 
  onFilterChange, 
  disabled = false,
  showCounts = false,
  counts = {}
}) => {
  const filters = [
    {
      value: ARTICLE_TYPES.ALL,
      label: 'All Articles',
      icon: '📚',
      description: 'Show all articles'
    },
    {
      value: ARTICLE_TYPES.ORIGINAL,
      label: 'Original',
      icon: '📄',
      description: 'Show original articles only'
    },
    {
      value: ARTICLE_TYPES.ENHANCED,
      label: 'AI Enhanced',
      icon: '✨',
      description: 'Show AI-enhanced articles only'
    }
  ];

  const handleFilterChange = (filterValue) => {
    if (disabled || filterValue === currentFilter) return;
    onFilterChange?.(filterValue);
  };

  const handleKeyDown = (e, filterValue) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFilterChange(filterValue);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filter Articles</h3>
        <p className={styles.description}>
          Choose which type of articles to display
        </p>
      </div>

      <div className={styles.filters} role="radiogroup" aria-label="Article type filter">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.value;
          const count = counts[filter.value];

          return (
            <button
              key={filter.value}
              className={`${styles.filter} ${isActive ? styles.active : ''}`}
              onClick={() => handleFilterChange(filter.value)}
              onKeyDown={(e) => handleKeyDown(e, filter.value)}
              disabled={disabled}
              role="radio"
              aria-checked={isActive}
              aria-describedby={`filter-${filter.value}-desc`}
              title={filter.description}
            >
              <span className={styles.filterIcon} aria-hidden="true">
                {filter.icon}
              </span>
              
              <div className={styles.filterContent}>
                <span className={styles.filterLabel}>
                  {filter.label}
                </span>
                
                {showCounts && count !== undefined && (
                  <span className={styles.filterCount}>
                    ({count})
                  </span>
                )}
              </div>

              {isActive && (
                <span className={styles.activeIndicator} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden descriptions for screen readers */}
      {filters.map((filter) => (
        <div
          key={`desc-${filter.value}`}
          id={`filter-${filter.value}-desc`}
          className="sr-only"
        >
          {filter.description}
        </div>
      ))}
    </div>
  );
};

export default ArticleFilter;