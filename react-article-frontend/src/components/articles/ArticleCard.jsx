import { Link } from 'react-router-dom';
import ArticleTypeLabel from './ArticleTypeLabel';
import { formatDate, formatRelativeTime, generateExcerpt, formatReadingTime } from '../../utils/formatters';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article, onClick }) => {
  const handleClick = () => {
    onClick?.(article.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  if (!article) return null;

  const excerpt = article.excerpt || generateExcerpt(article.content, 150);
  const hasReferences = article.references && article.references.length > 0;
  const publishedDate = article.published_at || article.created_at;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <ArticleTypeLabel type={article.type} size="small" />
        {hasReferences && (
          <span className={styles.referenceBadge} title="Has reference citations">
            🔗 {article.references.length}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          <Link 
            to={`/articles/${article.id}`}
            className={styles.titleLink}
            onClick={handleClick}
          >
            {article.title}
          </Link>
        </h3>

        {excerpt && (
          <p className={styles.excerpt}>{excerpt}</p>
        )}

        <div className={styles.metadata}>
          <div className={styles.metadataRow}>
            {publishedDate && (
              <time 
                className={styles.date}
                dateTime={publishedDate}
                title={formatDate(publishedDate)}
              >
                {formatRelativeTime(publishedDate)}
              </time>
            )}
            
            {article.content && (
              <span className={styles.readingTime}>
                {formatReadingTime(article.content)}
              </span>
            )}
          </div>

          {article.type === 'enhanced' && article.enhancement_date && (
            <div className={styles.enhancementInfo}>
              <span className={styles.enhancementLabel}>Enhanced:</span>
              <time 
                className={styles.enhancementDate}
                dateTime={article.enhancement_date}
                title={formatDate(article.enhancement_date)}
              >
                {formatRelativeTime(article.enhancement_date)}
              </time>
            </div>
          )}

          {article.source_url && (
            <div className={styles.source}>
              <span className={styles.sourceLabel}>Source:</span>
              <a 
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
                onClick={(e) => e.stopPropagation()}
              >
                BeyondChats
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Link 
          to={`/articles/${article.id}`}
          className={styles.readMoreLink}
          onClick={handleClick}
        >
          Read More →
        </Link>
      </div>
    </article>
  );
};

export default ArticleCard;