// client/src/components/guard/AlertsBanner.jsx

import { useSosAlertSound } from '../../hooks/useSosAlertSound';
import '../../styles/guard/guard-main.css';

/**
 * Top SOS strip. Alarm loops until SOS is resolved or guard presses Stop Sound.
 * Pass only truly active alerts (not inactive fallback UI data).
 */
export default function AlertsBanner({ alerts = [], onViewDetails, demo = false }) {
  const { muted, stop, hasActive } = useSosAlertSound(alerts);

  if (!alerts?.length) return null;
  const active = alerts[0];
  const extra = alerts.length - 1;

  return (
    <div className="gm-sos-banner" role="alert" aria-live="assertive">
      <span className="gm-sos-sweep" aria-hidden="true" />
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
        <div className="gm-sos-copy">
          <div className="gm-sos-title">SOS ALERT</div>
          <div className="gm-sos-flat">
            Flat {active.flat}
            {extra > 0 ? ` · +${extra} more` : ''}
            {demo ? ' · DEMO' : ''}
          </div>
          <div className="gm-sos-sub">{active.note || active.message || 'Emergency reported'}</div>
        </div>
      </div>

      <div className="gm-sos-actions">
        {hasActive && !muted ? (
          <button
            type="button"
            className="gm-sos-mute-btn"
            onClick={stop}
            title="Stop alarm sound — SOS stays active until Resolve"
          >
            Stop Sound
          </button>
        ) : null}
        {hasActive && muted ? (
          <span className="gm-sos-muted-label">Sound stopped</span>
        ) : null}
        <button type="button" className="gm-sos-btn" onClick={onViewDetails}>
          View Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
