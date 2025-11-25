import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2025 — <a href="https://github.com/LordCarvel" target="_blank" rel="noopener noreferrer">LordCarvel</a> — Todos os direitos reservados.</p>
    </footer>
  );
}

export default Footer;