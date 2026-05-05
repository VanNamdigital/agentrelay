import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bot,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareTerminal
} from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './Layout.module.css';

const navItems = [
  { path: '/', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { path: '/bot', labelKey: 'nav.bot', Icon: Bot },
  { path: '/cli-providers', labelKey: 'nav.cli', Icon: SquareTerminal },
  { path: '/projects', labelKey: 'nav.projects', Icon: FolderKanban },
  { path: '/access-control', labelKey: 'nav.access', Icon: ShieldCheck },
  { path: '/logs', labelKey: 'nav.logs', Icon: ScrollText },
  { path: '/settings', labelKey: 'nav.settings', Icon: Settings }
];

function Layout({ session, onLogout }) {
  const { language, languages, setLanguage, refreshLanguage, t } = useI18n();

  useEffect(() => {
    refreshLanguage();
  }, [refreshLanguage]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}>AR</div>
          <div>
            <div className={styles.product}>AgentRelay</div>
            <div className={styles.subtitle}>{t('layout.subtitle')}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ Icon, ...item }) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>
                <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.account}>
            <div className={styles.avatar}>{session?.user?.username?.slice(0, 2).toUpperCase() || 'AD'}</div>
            <div>
              <div className={styles.accountName}>{session?.user?.username || 'admin'}</div>
              <div className={styles.accountRole}>{t('layout.role')}</div>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={onLogout}>{t('layout.logout')}</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.envLabel}>{t('layout.workspace')}</div>
            <div className={styles.envValue}>Local machine</div>
          </div>
          <div className={styles.topbarRight}>
            <label className={styles.languagePicker}>
              <span>{t('common.language')}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value).catch(() => {})}>
                {languages.map((option) => (
                  <option key={option.value} value={option.value}>{option.nativeLabel}</option>
                ))}
              </select>
            </label>
            <span className={styles.statusPill}><span /> {t('layout.apiOnline')}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
