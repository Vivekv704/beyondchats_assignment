import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <h1>Article Hub</h1>
          </Link>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>
              Home
            </Link>
            <Link to="/articles" className={styles.navLink}>
              Articles
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;