import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage = () => {
  return (
    <div className="container">
      <div className={styles.homeHero}>
        <h1 className={styles.heroTitle}>Welcome to Article Hub</h1>
        <p className={styles.heroDescription}>
          Discover original articles from BeyondChats and their AI-enhanced versions. 
          Explore curated content with improved formatting, additional insights, and comprehensive references.
        </p>
        <div className={styles.heroActions}>
          <Link to="/articles" className={`${styles.ctaButton} ${styles.primary}`}>
            Browse Articles
          </Link>
          <a 
            href="https://beyondchats.com/blogs" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${styles.ctaButton} ${styles.secondary}`}
          >
            Visit BeyondChats
          </a>
        </div>
      </div>
      
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📚</div>
            <h3 className={styles.featureTitle}>Original Content</h3>
            <p className={styles.featureDescription}>
              Access original articles scraped from BeyondChats blogs with preserved formatting and structure.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className={styles.featureTitle}>AI Enhanced</h3>
            <p className={styles.featureDescription}>
              Read AI-improved versions with better formatting, additional insights, and comprehensive references.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3 className={styles.featureTitle}>Responsive Design</h3>
            <p className={styles.featureDescription}>
              Enjoy a seamless reading experience across all devices with our mobile-first design approach.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3 className={styles.featureTitle}>Easy Navigation</h3>
            <p className={styles.featureDescription}>
              Filter between original and enhanced articles, with clear visual distinctions and intuitive navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;