import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { FormField, FormSelect, SearchInput, StatusBadge } from '../../../components/common/index.js';
import SearchableParkingCode from '../../../components/guard/parking/SearchableParkingCode.jsx';
import {
  SLOT_STATUS_COLORS,
  VEHICLE_TYPES,
  VISITOR_STATUS_COLORS,
  createGuardVisitorParking,
  formatLabel,
  listTodayGuardParking,
  recordParkingEntry,
  recordParkingExit,
} from '../../../services/parking.service.js';

const PANEL = {
  entry: {
    key: 'entry',
    title: 'Record entry',
    cardClass: 'gm-park-card--entry',
    btnLabel: 'Entry',
  },
  exit: {
    key: 'exit',
    title: 'Record exit',
    cardClass: 'gm-park-card--exit',
    btnLabel: 'Exit',
  },
  visitor: {
    key: 'visitor',
    title: 'Visitor parking',
    cardClass: 'gm-park-card--visitor',
    btnLabel: 'Create visitor parking',
  },
};

export default function GuardParkingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [entryForm, setEntryForm] = useState({ slotId: '', vehicleNumber: '' });
  const [exitForm, setExitForm] = useState({ slotId: '', vehicleNumber: '' });
  const [visitorForm, setVisitorForm] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    slotId: '',
    purpose: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTodayGuardParking();
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load today's parking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Parking | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  useEffect(() => {
    if (!activePanel) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setActivePanel(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePanel]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  function closePanel() {
    setActivePanel(null);
  }

  const parkedVehicles = useMemo(() => {
    const rows =
      data?.parkedVehicles ||
      data?.vehicles ||
      [
        ...(data?.activeVisitorParking || []),
        ...(data?.occupiedSlots || []).map((s) => ({
          id: s.id,
          kind: 'slot',
          vehicleNumber: null,
          vehicleType: null,
          residentName: null,
          parkingCode: null,
          slotCode: s.slotCode,
          slotStatus: s.status,
          status: s.status,
        })),
      ];
    return rows;
  }, [data]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return parkedVehicles;
    return parkedVehicles.filter(
      (v) =>
        (v.vehicleNumber || '').toLowerCase().includes(term) ||
        (v.parkingCode || '').toLowerCase().includes(term) ||
        (v.residentName || '').toLowerCase().includes(term) ||
        (v.slotCode || '').toLowerCase().includes(term),
    );
  }, [parkedVehicles, search]);

  const slotOptions = useMemo(() => {
    const fromApi = data?.slots || [];
    if (fromApi.length) return fromApi;
    return (data?.occupiedSlots || []).map((s) => ({
      id: s.id,
      code: s.slotCode,
      slotCode: s.slotCode,
      status: s.status,
      label: `${s.slotCode} · ${s.status}`,
    }));
  }, [data]);

  const entrySlotOptions = useMemo(
    () =>
      slotOptions.filter((s) =>
        ['available', 'allocated', 'reserved', 'occupied', 'visitor'].includes(s.status),
      ),
    [slotOptions],
  );

  const exitSlotOptions = useMemo(() => {
    const occupied = slotOptions.filter((s) => ['occupied', 'visitor'].includes(s.status));
    if (occupied.length) return occupied;
    // fallback from parked list
    return parkedVehicles
      .filter((v) => v.slotCode)
      .map((v) => ({
        id: v.id,
        code: v.slotCode,
        slotCode: v.slotCode,
        status: v.slotStatus || v.status,
        vehicleNumber: v.vehicleNumber,
        kind: v.kind,
        label: `${v.slotCode} · ${v.vehicleNumber || '—'}`,
      }));
  }, [slotOptions, parkedVehicles]);

  function onPickEntrySlot(opt) {
    setEntryForm((s) => ({
      ...s,
      slotId: opt?.id || '',
      vehicleNumber: opt?.vehicleNumber || s.vehicleNumber,
    }));
  }

  function onPickExitSlot(opt) {
    setExitForm((s) => ({
      ...s,
      slotId: opt?.id || '',
      vehicleNumber: opt?.vehicleNumber || s.vehicleNumber,
    }));
  }

  const onEntry = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await recordParkingEntry({
        slotId: entryForm.slotId || null,
        vehicleNumber: entryForm.vehicleNumber.trim() || null,
      });
      setSuccess('Entry recorded');
      setEntryForm({ slotId: '', vehicleNumber: '' });
      setActivePanel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Entry failed');
    } finally {
      setBusy(false);
    }
  };

  const onExit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await recordParkingExit({
        slotId: exitForm.slotId || null,
        vehicleNumber: exitForm.vehicleNumber.trim() || null,
      });
      setSuccess('Exit recorded');
      setExitForm({ slotId: '', vehicleNumber: '' });
      setActivePanel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Exit failed');
    } finally {
      setBusy(false);
    }
  };

  const onVisitor = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await createGuardVisitorParking({
        vehicleNumber: visitorForm.vehicleNumber.trim(),
        vehicleType: visitorForm.vehicleType,
        slotId: visitorForm.slotId || null,
        purpose: visitorForm.purpose.trim() || null,
      });
      setSuccess('Visitor parking created');
      setVisitorForm({ vehicleNumber: '', vehicleType: 'car', slotId: '', purpose: '' });
      setActivePanel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Visitor parking failed');
    } finally {
      setBusy(false);
    }
  };

  const panel = activePanel ? PANEL[activePanel] : null;

  return (
    <div className="gm-root">
      <Sidebar activePage="Parking" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 className="gm-park-page-title">Parking</h2>
          {error && <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div>}
          {success && <div style={{ color: '#86efac', marginBottom: 10 }}>{success}</div>}

          <div className="gm-park-toolbar">
            <div className="gm-park-search">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vehicle number / Parking No"
                debounceMs={0}
              />
            </div>
            <div className="gm-park-toolbar-btns">
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--entry"
                onClick={() => setActivePanel('entry')}
              >
                Record entry
              </button>
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--exit"
                onClick={() => setActivePanel('exit')}
              >
                Record exit
              </button>
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--visitor"
                onClick={() => setActivePanel('visitor')}
              >
                Visitor parking
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="glass-card gm-park-table-card">
              <h3 className="gm-park-table-title">Parked vehicles</h3>
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Vehicle number</th>
                    <th>Type</th>
                    <th>Resident</th>
                    <th>Parking No</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={5}>No parked vehicles.</td>
                    </tr>
                  )}
                  {filteredVehicles.map((v) => (
                    <tr key={v.id || `${v.slotCode}-${v.vehicleNumber}`}>
                      <td style={{ fontWeight: 700 }}>{v.vehicleNumber || '—'}</td>
                      <td>{formatLabel(v.vehicleType)}</td>
                      <td>{v.residentName || (v.kind === 'visitor' ? 'Visitor' : '—')}</td>
                      <td>{v.slotCode || '—'}</td>
                      <td>
                        <StatusBadge
                          status={v.slotStatus || v.status}
                          colors={{ ...SLOT_STATUS_COLORS, ...VISITOR_STATUS_COLORS }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {panel && (
            <div
              className="gm-park-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label={panel.title}
              onClick={closePanel}
            >
              <form
                className={`gm-park-card gm-park-modal ${panel.cardClass}`}
                onClick={(e) => e.stopPropagation()}
                onSubmit={
                  activePanel === 'entry'
                    ? onEntry
                    : activePanel === 'exit'
                      ? onExit
                      : onVisitor
                }
              >
                <div className="gm-park-card-head">
                  <span className="gm-park-card-badge" aria-hidden />
                  <h3 className="gm-park-card-title">{panel.title}</h3>
                  <button
                    type="button"
                    className="gm-park-modal-close"
                    onClick={closePanel}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="gm-park-card-body">
                  {activePanel === 'entry' && (
                    <div className="gm-park-card-body-grid">
                      <SearchableParkingCode
                        label="Parking No"
                        placeholder="Search Parking No…"
                        emptyText="No matching Parking No"
                        value={entryForm.slotId}
                        options={entrySlotOptions}
                        onChange={onPickEntrySlot}
                      />
                      <FormField
                        label="Vehicle number"
                        value={entryForm.vehicleNumber}
                        onChange={(v) => setEntryForm((s) => ({ ...s, vehicleNumber: v }))}
                      />
                    </div>
                  )}

                  {activePanel === 'exit' && (
                    <div className="gm-park-card-body-grid">
                      <SearchableParkingCode
                        label="Parking No"
                        placeholder="Search Parking No…"
                        emptyText="No matching Parking No"
                        value={exitForm.slotId}
                        options={exitSlotOptions}
                        onChange={onPickExitSlot}
                      />
                      <FormField
                        label="Vehicle number"
                        value={exitForm.vehicleNumber}
                        onChange={(v) => setExitForm((s) => ({ ...s, vehicleNumber: v }))}
                      />
                    </div>
                  )}

                  {activePanel === 'visitor' && (
                    <div className="gm-park-card-body-grid">
                      <FormField
                        label="Vehicle number *"
                        value={visitorForm.vehicleNumber}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, vehicleNumber: v }))}
                        required
                      />
                      <FormSelect
                        label="Type"
                        value={visitorForm.vehicleType}
                        options={VEHICLE_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, vehicleType: v }))}
                      />
                      <FormField
                        label="Parking No"
                        value={visitorForm.slotId}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, slotId: v }))}
                      />
                      <FormField
                        label="Purpose"
                        value={visitorForm.purpose}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, purpose: v }))}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary gm-park-card-btn" disabled={busy}>
                  {panel.btnLabel}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
