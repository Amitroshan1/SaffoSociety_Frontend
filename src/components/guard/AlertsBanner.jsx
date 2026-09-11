// client/src/components/guard/AlertsBanner.jsx

import '../../styles/guard/guard-main.css';

/** Shows the top SOS strip when alerts exist. */
export default function AlertsBanner({ alerts = [], onViewDetails }) {
  if (!alerts?.length) return null;
  const active = alerts[0];

  return (
    <div className="gm-sos-banner">
      <div className="gm-sos-left">
        <div className="gm-sos-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 17H2a3 3 0 010-6h20a3 3 0 010 6z"/>
            <path d="M12 2v4"/>
            <path d="M12 17v5"/>
            <path d="M4.93 4.93l2.83 2.83"/>
            <path d="M16.24 16.24l2.83 2.83"/>
            <path d="M2 11h2"/>
            <path d="M20 11h2"/>
          </svg>
        </div>
        <div>
          <div className="gm-sos-title">SOS ALERT — FLAT {active.flat}</div>
          <div className="gm-sos-sub">{active.note || active.message || 'Emergency reported'}</div>
        </div>
      </div>

      <button type="button" className="gm-sos-btn" onClick={onViewDetails}>
        View Details
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  );
}
