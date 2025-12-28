import { Link } from 'react-router-dom';
import ArticleTypeLabel from './ArticleTypeLabel';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../ui/Button';
import { formatDate, formatRelativeTime, formatReadingTime } from '../../utils/formatters';
import { sanitizeHtml } from '../../utils/validators';
import styles from './ArticleDetail.module.css';

const ArticleDetail = ({ article, isLoading, isError, error, onRetry }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner 
          size="large" 
          text="Loading article..." 
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
          <h2 className={styles.errorTitle}>
            {error?.status === 404 ? 'Article Not Found' : 'Failed to Load Article'}
          </h2>
          <p className={styles.errorMessage}>
            {error?.status === 404 
              ? 'The article you are looking for does not exist or has been removed.'
              : error?.message || 'Something went wrong while loading the article. Please try again.'
            }
          </p>
          <div className={styles.errorActions}>
            {error?.status !== 404 && (
              <Button onClick={onRetry} variant="primary">
                Try Again
              </Button>
            )}
            <Link to="/articles">
              <Button variant="outline">
                Browse Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No article data
  if (!article) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <h2 className={styles.emptyTitle}>No Article Data</h2>
          <p className={styles.emptyMessage}>
            Unable to load article information.
          </p>
          <Link to="/articles">
            <Button variant="outline">
              Browse Articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = article.published_at || article.created_at;
  const hasReferences = article.references && article.references.length > 0;

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        {/* Article Header */}
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <ArticleTypeLabel type={article.type} size="medium" />
            
            {publishedDate && (
              <time 
                className={styles.publishDate}
                dateTime={publishedDate}
                title={formatDate(publishedDate)}
              >
                Published {formatRelativeTime(publishedDate)}
              </time>
            )}
          </div>

          <h1 className={styles.title}>{article.title}</h1>

          <div className={styles.metadata}>
            <div className={styles.metadataRow}>
              {article.content && (
                <span className={styles.readingTime}>
                  {formatReadingTime(article.content)} read
                </span>
              )}

              {article.source_url && (
                <a 
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  View Original Source
                </a>
              )}
            </div>

            {article.type === 'enhanced' && article.enhancement_date && (
              <div className={styles.enhancementInfo}>
                <span className={styles.enhancementIcon}>✨</span>
                <span className={styles.enhancementText}>
                  Enhanced on {formatDate(article.enhancement_date)}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div className={styles.content}>
          {article.content ? (
            <div 
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHtml(article.content) 
              }}
            />
          ) : (
            <div className={styles.noContent}>
              <p>No content available for this article.</p>
            </div>
          )}
        </div>

        {/* Enhancement Information */}
        {article.type === 'enhanced' && (
          <div className={styles.enhancementSection}>
            <div className={styles.enhancementHeader}>
              <h3 className={styles.enhancementTitle}>
                <span className={styles.enhancementIcon}>🤖</span>
                AI Enhancement Information
              </h3>
            </div>
            
            <div className={styles.enhancementDetails}>
              <p className={styles.enhancementDescription}>
                This article has been enhanced using AI to improve its formatting, 
                content structure, and readability while maintaining the original meaning.
              </p>
              
              {article.original_article_id && (
                <div className={styles.originalLink}>
                  <Link 
                    to={`/articles/${article.original_article_id}`}
                    className={styles.originalLinkButton}
                  >
                    View Original Article
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* References Section */}
        {hasReferences && (
          <div className={styles.referencesSection}>
            <h3 className={styles.referencesTitle}>
              <span className={styles.referencesIcon}>🔗</span>
              References & Citations
            </h3>
            
            <div className={styles.referencesDescription}>
              <p>
                This enhanced article was created with insights from the following sources:
              </p>
            </div>

            <ol className={styles.referencesList}>
              {article.references.map((reference, index) => (
                <li key={reference.id || index} className={styles.referenceItem}>
                  <div className={styles.referenceContent}>
                    <h4 className={styles.referenceTitle}>
                      <a 
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.referenceLink}
                      >
                        {reference.title}
                      </a>
                    </h4>
                    
                    {reference.source && (
                      <p className={styles.referenceSource}>
                        Source: {reference.source}
                      </p>
                    )}
                    
                    <p className={styles.referenceUrl}>
                      <a 
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.referenceUrlLink}
                      >
                        {reference.url}
                      </a>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Article Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerMeta}>
              <p className={styles.footerDate}>
                Last updated: {formatDate(article.updated_at)}
              </p>
            </div>
            
            <div className={styles.footerActions}>
              <Link to="/articles">
                <Button variant="outline">
                  ← Back to Articles
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default ArticleDetail;