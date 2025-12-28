import { useParams, Link } from 'react-router-dom';
import { useArticleDetail } from '../hooks/useArticleDetail';
import ArticleDetail from '../components/articles/ArticleDetail';
import styles from './ArticleDetailPage.module.css';

const ArticleDetailPage = () => {
  const { id } = useParams();

  const {
    data: articleResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useArticleDetail(id);

  const article = articleResponse?.data;

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="container">
      <div className={styles.articleNav}>
        <Link to="/articles" className={styles.backLink}>
          ← Back to Articles
        </Link>
      </div>

      <ArticleDetail
        article={article}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default ArticleDetailPage;