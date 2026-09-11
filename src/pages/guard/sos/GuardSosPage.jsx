import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { DEMO_SOS_ALERTS } from '../../../constants/guardSosDemo.js';
import { apiError, getSosAlerts, respondToSOS } from '../../../services/guard.service';

export default function GuardSosPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const alerts = await getSosAlerts();
      if (alerts?.length) {
        setRows(alerts);
        setUsingDemo(false);
      } else {
        setRows(DEMO_SOS_ALERTS);
        setUsingDemo(true);
      }
    } catch (err) {
      setError(apiError(err, 'Failed to load SOS — showing demo data'));
      setRows(DEMO_SOS_ALERTS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'SOS Alerts | Guard';
    load();
  }, [load]);

  async function onRespond(id) {
    setBusyId(id);
    setError('');
    try {
      const row = rows.find((r) => r.id === id);
      if (row?._demo || String(id).startsWith('demo-')) {
        setRows((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: 'responded', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
              : a,
          ),
        );
        return;
      }
      await respondToSOS(id);
      await load();
    } catch (err) {
      setError(apiError(err, 'Respond failed'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="SOS Alerts" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <button
            type="button"
            className="vp-back-btn"
            style={{ marginBottom: 12 }}
            onClick={() => navigate('/guard/dashboard')}
          >
            ← Dashboard
          </button>
          <h2 className="gm-park-page-title">SOS Alerts</h2>
          {usingDemo ? (
            <div
              style={{
                marginBottom: 10,
                fontSize: 13,
                color: 'var(--gm-warning, #d97706)',
              }}
            >
              Showing demo alerts (no live SOS from API). Respond works locally for preview.
            </div>
          ) : null}
          {error ? <div style={{ color: 'var(--gm-danger)', marginBottom: 10 }}>{error}</div> : null}

          <div className="gm-panel">
            <div className="gm-panel-header">
              <span className="gm-panel-title">Active & recent</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {usingDemo ? <span className="gm-badge gm-badge-warning">Demo</span> : null}
                <button type="button" className="gm-view-all" onClick={load}>
                  Refresh
                </button>
              </div>
            </div>

            <div
              className="gm-table-header"
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.6fr 0.7fr 0.9fr',
                gap: 12,
                padding: '10px 16px',
              }}
            >
              <span>Flat</span>
              <span>Details</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Action</span>
            </div>

            <div className="gm-table-body">
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--gm-text-tertiary)' }}>
                  Loading…
                </div>
              ) : null}
              {!loading && rows.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--gm-text-tertiary)' }}>
                  No SOS alerts
                </div>
              ) : null}
              {!loading &&
                rows.map((a) => (
                  <div
                    key={a.id}
                    className="gm-table-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.9fr 1.6fr 0.7fr 0.9fr',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 16px',
                    }}
                  >
                    <strong>Flat {a.flat || '—'}</strong>
                    <span style={{ color: 'var(--gm-text-secondary)', fontSize: 13 }}>
                      {a.note || a.message || 'Emergency'}
                      {a.time ? (
                        <span style={{ display: 'block', fontSize: 11, marginTop: 2, opacity: 0.8 }}>
                          {a.time}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`gm-badge ${
                        a.status === 'active' ? 'gm-badge-warning' : 'gm-badge-success'
                      }`}
                      style={{ justifySelf: 'center' }}
                    >
                      {a.status || '—'}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {a.status === 'active' ? (
                        <button
                          type="button"
                          className="gm-exit-btn"
                          disabled={busyId === a.id}
                          onClick={() => onRespond(a.id)}
                        >
                          {busyId === a.id ? '…' : 'Respond'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gm-text-tertiary)' }}>Done</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
