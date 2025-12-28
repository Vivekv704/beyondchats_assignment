import styles from './ArticleTypeLabel.module.css';

const ArticleTypeLabel = ({ type, size = 'small', showIcon = true }) => {
  const getTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'original':
        return {
          label: 'Original',
          icon: '📄',
          className: styles.original,
        };
      case 'enhanced':
        return {
          label: 'AI Enhanced',
          icon: '✨',
          className: styles.enhanced,
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          className: styles.unknown,
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <span 
      className={`${styles.label} ${config.className} ${styles[size]}`}
      title={`${config.label} article`}
    >
      {showIcon && (
        <span className={styles.icon} aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span className={styles.text}>{config.label}</span>
    </span>
  );
};

export default ArticleTypeLabel;