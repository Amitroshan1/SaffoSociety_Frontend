import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import {
  activateTestSos,
  getActiveTestSosAlerts,
  readTestSos,
  resolveTestSos,
  subscribeTestSos,
} from '@/constants/guardSosDemo.js';
import {
  ensureSosSoundBridge,
  getSosSoundState,
  stopSosAlertSound,
  subscribeSosSound,
  syncSosAlertSound,
} from '@/utils/sosAlertSound.js';

/**
 * Temporary SOS test page — one dummy alert, Activate / Resolve (frontend only).
 * Alarm keeps looping until Resolve or Stop Sound.
 */
export default function GuardSosPage() {
  const navigate = useNavigate();
  const [sos, setSos] = useState(() => readTestSos());
  const [sound, setSound] = useState(() => getSosSoundState());

  useEffect(() => {
    document.title = 'SOS Alerts | Guard';
    ensureSosSoundBridge();
    setSos(readTestSos());
    syncSosAlertSound(getActiveTestSosAlerts());
    const unsubSos = subscribeTestSos(setSos);
    const unsubSound = subscribeSosSound(setSound);
    return () => {
      unsubSos();
      unsubSound();
    };
  }, []);

  const refresh = useCallback(() => {
    setSos(readTestSos());
    syncSosAlertSound(getActiveTestSosAlerts());
  }, []);

  const isActive = String(sos.status || '').toLowerCase() === 'active';

  function onActivate() {
    const next = activateTestSos();
    setSos(next);
    // Bridge also syncs; explicit sync keeps sound starting on this page
    syncSosAlertSound(getActiveTestSosAlerts());
  }

  function onResolve() {
    setSos(resolveTestSos());
    syncSosAlertSound([]);
  }

  function onStopSound() {
    stopSosAlertSound();
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

          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(217, 119, 6, 0.35)',
              background: 'rgba(217, 119, 6, 0.08)',
              fontSize: 13,
              color: 'var(--gm-text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--gm-warning, #d97706)' }}>Temporary test mode</strong>
            {' — '}
            One dummy SOS only. Activate to see the dashboard banner; Resolve to clear it. No backend
            calls.
          </div>

          <div className="gm-panel">
            <div className="gm-panel-header">
              <span className="gm-panel-title">Test SOS control</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="gm-badge gm-badge-warning">Demo</span>
                <button type="button" className="gm-view-all" onClick={refresh}>
                  Refresh
                </button>
              </div>
            </div>

            <div
              className="gm-table-header"
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.6fr 0.7fr 1.1fr',
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
              <div
                className="gm-table-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.9fr 1.6fr 0.7fr 1.1fr',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 16px',
                }}
              >
                <strong>Flat {sos.flat || '—'}</strong>
                <span style={{ color: 'var(--gm-text-secondary)', fontSize: 13 }}>
                  {sos.note || 'Emergency'}
                  {sos.time && sos.time !== '—' ? (
                    <span style={{ display: 'block', fontSize: 11, marginTop: 2, opacity: 0.8 }}>
                      {sos.time}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`gm-badge ${isActive ? 'gm-badge-warning' : 'gm-badge-success'}`}
                  style={{ justifySelf: 'center' }}
                >
                  {isActive ? 'active' : 'resolved'}
                </span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {isActive ? (
                    <>
                      {sound.playing ? (
                        <button
                          type="button"
                          className="gm-view-all"
                          onClick={onStopSound}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'rgba(15, 23, 42, 0.45)',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Stop Sound
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gm-text-tertiary)', alignSelf: 'center' }}>
                          Sound stopped
                        </span>
                      )}
                      <button type="button" className="gm-exit-btn" onClick={onResolve}>
                        Resolve
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="gm-view-all"
                      onClick={onActivate}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--gm-danger, #ef4444)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Activate SOS
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--gm-text-tertiary)' }}>
            Alarm keeps playing until you Resolve the SOS or press Stop Sound. Navigating away does
            not stop the alarm.
          </p>
        </main>
      </div>
    </div>
  );
}
