import Link from 'next/link';
import { Zap } from 'lucide-react';
import styles from './marketing.module.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.navWrap}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>
              <Zap size={14} fill="white" />
            </span>
            ApplyIQ
          </Link>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.navLogin}>Login</Link>
            <Link href="/login" className={styles.btnPrimarySm}>Start Free</Link>
          </div>
        </nav>
      </header>

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.logoMark}>
              <Zap size={12} fill="white" />
            </span>
            ApplyIQ
          </div>
          <span className={styles.footerCopy}>© 2026 ApplyIQ. All rights reserved.</span>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}