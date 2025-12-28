import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            © {currentYear} Article Hub. Built with React and powered by Laravel API.
          </p>
          <div className={styles.footerLinks}>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              GitHub
            </a>
            <a 
              href="https://beyondchats.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              BeyondChats
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;