import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bot,
  Check,
  ChevronLeft,
  Copy,
  Download,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareTerminal,
  Sun,
  X
} from 'lucide-react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import styles from './Layout.module.css';

const navSections = [
  {
    items: [
      { path: '/', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
      { path: '/bot', labelKey: 'nav.bot', Icon: Bot },
      { path: '/cli-providers', labelKey: 'nav.cli', Icon: SquareTerminal },
    ]
  },
  {
    labelKey: 'nav.workspace',
    items: [
      { path: '/projects', labelKey: 'nav.projects', Icon: FolderKanban },
      { path: '/access-control', labelKey: 'nav.access', Icon: ShieldCheck },
      { path: '/logs', labelKey: 'nav.logs', Icon: ScrollText },
      { path: '/settings', labelKey: 'nav.settings', Icon: Settings },
    ]
  }
];

function UpdateBanner({ info }) {
  const [copied, setCopied] = useState(false);
  const dismissKey = info?.latestVersion ? `agentrelay_update_dismissed_${info.latestVersion}` : '';
  const [dismissed, setDismissed] = useState(() => (
    dismissKey ? localStorage.getItem(dismissKey) === 'true' : false
  ));

  useEffect(() => {
    setDismissed(dismissKey ? localStorage.getItem(dismissKey) === 'true' : false);
  }, [dismissKey]);

  if (!info?.updateAvailable || dismissed) return null;

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(info.command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.updateBanner}>
      <div className={styles.updateIcon}>
        <Download size={18} strokeWidth={2.35} aria-hidden="true" />
      </div>
      <div className={styles.updateBody}>
        <div className={styles.updateTitle}>
          AgentRelay {info.latestVersion} is available
          <span>Current {info.currentVersion}</span>
        </div>
        <div className={styles.updateCommand}>{info.command}</div>
      </div>
      <button className={styles.copyButton} type="button" onClick={copyCommand} title="Copy update command">
        {copied ? (
          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Copy size={16} strokeWidth={2.4} aria-hidden="true" />
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <button
        className={styles.dismissButton}
        type="button"
        onClick={() => {
          if (dismissKey) localStorage.setItem(dismissKey, 'true');
          setDismissed(true);
        }}
        title="Dismiss this update notice"
      >
        <X size={16} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}

function Layout({ session, onLogout }) {
  const { language, languages, setLanguage, refreshLanguage, t } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('agentrelay_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('agentrelay_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    refreshLanguage();
  }, [refreshLanguage]);

  useEffect(() => {
    let mounted = true;
    api.getUpdateInfo()
      .then((info) => {
        if (mounted) setUpdateInfo(info);
      })
      .catch(() => {
        if (mounted) setUpdateInfo(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const shellClasses = [
    styles.shell,
    sidebarCollapsed ? styles.collapsed : ''
  ].filter(Boolean).join(' ');

  const sidebarClasses = [
    styles.sidebar,
    mobileMenuOpen ? styles.open : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClasses}>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${mobileMenuOpen ? styles.visible : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>AR</div>
          <div className={styles.productInfo}>
            <div className={styles.product}>AgentRelay</div>
            <div className={styles.subtitle}>{t('layout.subtitle')}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section, si) => (
            <div key={si} className={styles.navSection}>
              {section.labelKey && (
                <div className={styles.navSectionLabel}>{t(section.labelKey)}</div>
              )}
              {section.items.map(({ Icon, ...item }) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIcon}>
                    <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.account}>
            <div className={styles.avatar}>{session?.user?.username?.slice(0, 2).toUpperCase() || 'AD'}</div>
            <div className={styles.accountDetails}>
              <div className={styles.accountName}>{session?.user?.username || 'admin'}</div>
              <div className={styles.accountRole}>{t('layout.role')}</div>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={onLogout}>{t('layout.logout')}</button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          className={styles.collapseToggle}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.mobileMenuToggle}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
            </button>
            <div>
              <div className={styles.envLabel}>{t('layout.workspace')}</div>
              <div className={styles.envValue}>
                Local machine{updateInfo?.currentVersion ? ` v${updateInfo.currentVersion}` : ''}
              </div>
            </div>
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
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun size={16} strokeWidth={2.25} />
              ) : (
                <Moon size={16} strokeWidth={2.25} />
              )}
            </button>
            <div className={styles.statusPill}>
              <span className={styles.statusPillDot} />
              {t('layout.apiOnline')}
            </div>
          </div>
        </div>
        <UpdateBanner info={updateInfo} />
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
