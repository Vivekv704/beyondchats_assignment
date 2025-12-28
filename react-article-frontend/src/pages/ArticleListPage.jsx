import ArticleList from '../components/articles/ArticleList';
import styles from './ArticleListPage.module.css';

const ArticleListPage = () => {
  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Articles</h1>
        <p className={styles.pageDescription}>
          Browse through our collection of original and AI-enhanced articles
        </p>
      </div>

      <ArticleList 
        showFilter={true}
        showPagination={true}
        pageSize={12}
      />
    </div>
  );
};

export default ArticleListPage;