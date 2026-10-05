import { useLayoutEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SECTIONS, sectionFor, tabMatches, titleForPath } from '@/modules/resident/components/residentSections';
import { PageTitleContext, useResidentPageTitle } from '@/modules/resident/components/residentPageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import ResidentHeader from '@/modules/resident/components/ResidentHeader';
import ResidentSidebar from '@/modules/resident/components/ResidentSidebar';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/dashboard/dashboard.css';
import '@/modules/resident/styles/core/resident-main.css';

function SectionTabs() {
  const { pathname } = useLocation();
  const section = sectionFor(pathname);
  if (!section) return null;
  return (
    <nav className="res-section-tabs" aria-label="Section">
      {SECTIONS[section].map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={() => `res-section-tab${tabMatches(pathname, tab.to) ? ' is-on' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function ResidentShell({ children }) {
  const { user } = useAuth();
  const { societyName } = useTenant();
  const [menu, setMenu] = useState(false);
  const [title, setTitle] = useState('');
  const name = user?.name || 'Resident';

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      <div className="gm-root resident-app" data-theme="light">
        <ResidentSidebar open={menu} onClose={() => setMenu(false)} name={name} societyName={societyName} />
        <div className="gm-content">
          <ResidentHeader name={name} onMenu={() => setMenu(true)} />
          <main className="gm-main">
            <div className="res-canvas">{children}</div>
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}

const TYPE_LABELS = { vendor: 'staff' };

export function typeLabel(type) {
  return TYPE_LABELS[type] || type || '';
}

export function statusLabel(status) {
  return String(status || '').replaceAll('_', ' ');
}

export function PageHeader({ title, sub, action }) {
  const { pathname } = useLocation();
  const { setTitle } = useResidentPageTitle();
  const section = sectionFor(pathname);

  useLayoutEffect(() => {
    setTitle(title || titleForPath(pathname));
    return () => setTitle('');
  }, [pathname, setTitle, title]);

  if (!sub && !action && !section) return null;

  return (
    <div className="res-page-top">
      {sub || action ? (
        <header className="res-page-head">
          <div>{sub ? <p>{sub}</p> : null}</div>
          {action ? <div className="res-page-head-action">{action}</div> : null}
        </header>
      ) : null}
      <SectionTabs />
    </div>
  );
}

export function Panel({ title, sub, action, children }) {
  return (
    <section className="res-card">
      {title || sub || action ? (
        <div className="res-card-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {sub ? <p>{sub}</p> : null}
          </div>
          {action || null}
        </div>
      ) : null}
      <div className="res-card-body">{children}</div>
    </section>
  );
}

export function StatusLine({ loading, error, onRetry, empty, children }) {
  if (loading) {
    return (
      <div className="res-state" role="status">
        <span className="res-spinner" aria-hidden="true" />
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="res-state res-state--error">
        <p>{error}</p>
        <button type="button" className="res-btn res-btn--secondary" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (empty) return <div className="res-empty"><p>{empty}</p></div>;
  return children;
}
