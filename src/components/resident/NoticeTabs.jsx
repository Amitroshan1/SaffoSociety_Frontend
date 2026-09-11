import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/resident/notices', label: 'All', end: true },
  { to: '/resident/notices/unread', label: 'Unread', countKey: 'unread' },
  { to: '/resident/notices/pinned', label: 'Pinned', countKey: 'pinned' },
  { to: '/resident/notices/archive', label: 'Archive' },
];

export default function NoticeTabs({ counts = {} }) {
  return (
    <nav className="notice-tabs" aria-label="Notice views">
      {TABS.map((tab) => {
        const count = tab.countKey ? counts[tab.countKey] : undefined;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `notice-tab${isActive ? ' active' : ''}`}
          >
            {tab.label}
            {count > 0 && <span className="notice-tab-count">{count}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
