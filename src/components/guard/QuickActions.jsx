// client/src/components/guard/QuickActions.jsx

import '@/styles/guard/guard-main.css';

const ACTIONS = [
  {
    label: 'Add Visitor',
    shortcut: 'F1',
    cls: 'gm-qa-visitor',
    // User Plus icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
  },
  {
    label: 'Add Delivery',
    shortcut: 'F2',
    cls: 'gm-qa-delivery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    label: 'Staff',
    shortcut: 'F3',
    cls: 'gm-qa-staff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/>
        <path d="M10 10V5a1 1 0 011-1h2a1 1 0 011 1v5"/>
        <path d="M4 15v-3a8 8 0 0116 0v3"/>
      </svg>
    ),
  },
  {
    label: 'Cab Entry',
    shortcut: 'F4',
    cls: 'gm-qa-cab',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
        <rect x="9" y="11" width="14" height="10" rx="2"/>
        <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      </svg>
    ),
  },
];

export default function QuickActions({ onAction }) {
  return (
    <div className="gm-quick-actions">
      {ACTIONS.map((action, i) => (
        <button
          key={action.label}
          className={`gm-qa-btn ${action.cls}`}
          style={{ animationDelay: `${i * 0.05}s` }}
          onClick={() => onAction && onAction(action.label)}
        >
          {action.icon}
          <span>{action.label}</span>
          <span className="gm-qa-shortcut">{action.shortcut}</span>
        </button>
      ))}
    </div>
  );
}