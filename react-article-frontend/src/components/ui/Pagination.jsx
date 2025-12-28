import Button from './Button';
import styles from './Pagination.module.css';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  disabled = false,
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange?.(page);
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <div className={styles.container}>
        {/* First page */}
        {showFirstLast && currentPage > 1 && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handlePageChange(1)}
            disabled={disabled}
            aria-label="Go to first page"
          >
            ««
          </Button>
        )}

        {/* Previous page */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            aria-label="Go to previous page"
          >
            ‹ Prev
          </Button>
        )}

        {/* First page if not in visible range */}
        {showStartEllipsis && (
          <>
            <Button
              variant="outline"
              size="small"
              onClick={() => handlePageChange(1)}
              disabled={disabled}
              aria-label="Go to page 1"
            >
              1
            </Button>
            <span className={styles.ellipsis} aria-hidden="true">
              ...
            </span>
          </>
        )}

        {/* Visible page numbers */}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'outline'}
            size="small"
            onClick={() => handlePageChange(page)}
            disabled={disabled}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {/* Last page if not in visible range */}
        {showEndEllipsis && (
          <>
            <span className={styles.ellipsis} aria-hidden="true">
              ...
            </span>
            <Button
              variant="outline"
              size="small"
              onClick={() => handlePageChange(totalPages)}
              disabled={disabled}
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next page */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next ›
          </Button>
        )}

        {/* Last page */}
        {showFirstLast && currentPage < totalPages && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled}
            aria-label="Go to last page"
          >
            »»
          </Button>
        )}
      </div>

      {/* Page info */}
      <div className={styles.info}>
        <span className={styles.infoText}>
          Page {currentPage} of {totalPages}
        </span>
      </div>
    </nav>
  );
};

export default Pagination;