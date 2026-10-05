import { useEffect, useMemo, useState } from 'react';
import { PageHeader, StatusLine, statusLabel } from '@/modules/resident/components/ResidentShell';
import ResidentConfirm, { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import { closeMySos, listMySos, raiseSos } from '@/modules/resident/services/complaint.service';
import '@/modules/resident/styles/sos/sos.css';

const REASONS = ['Medical help', 'Fire / smoke', 'Break-in', 'Fight / disturbance', 'Suspicious person'];

function when(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export default function SosPage() {
  const { loading, error, data, reload } = useLoad(() => listMySos(), []);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState('');

  const [closing, setClosing] = useState(null);
  const [listNote, setListNote] = useState({ tone: 'ok', text: '' });

  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    if (!photo) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function submit() {
    setBusy(true);
    setFormError('');
    setSaved('');
    try {
      await raiseSos({ title, note, photo });
      setTitle('');
      setNote('');
      setPhoto(null);
      setAsk(false);
      setSaved('SOS sent to the guard.');
      window.dispatchEvent(new Event('resident-notes-changed'));
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmClose() {
    if (!closing) return;
    setBusy(true);
    setListNote({ tone: 'ok', text: '' });
    try {
      await closeMySos(closing.item.id, closing.action);
      setListNote({
        tone: 'ok',
        text: closing.action === 'cancel' ? `"${closing.item.title}" cancelled.` : `"${closing.item.title}" marked as resolved.`,
      });
      setClosing(null);
      window.dispatchEvent(new Event('resident-notes-changed'));
      await reload();
    } catch (err) {
      setListNote({ tone: 'err', text: err.message });
      setClosing(null);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setAsk(true);
  }

  return (
    <>
      <PageHeader title="SOS" />

      <div className="res-sos-layout">
        <form className="res-card res-sos-form" onSubmit={onSubmit}>
          <div className="res-sos-form-head">
            <span className="res-sos-icon"><AlertIcon /></span>
            <div>
              <h2>Raise an emergency</h2>
              <div className="res-sos-tags">
                <span>Security</span>
                <span>Critical</span>
              </div>
            </div>
          </div>

          <div className="res-card-body res-sos-body">
            <div>
              <span className="res-field-label">What is happening?</span>
              <div className="res-chip-row">
                {REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={`res-chip${title === reason ? ' is-on' : ''}`}
                    onClick={() => setTitle(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <label>Title *
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Medical help" />
            </label>

            <label>Details
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Where exactly, who is involved, anything the guard should know" />
            </label>

            <div>
              <span className="res-field-label">Photo (optional)</span>
              {preview ? (
                <div className="res-sos-preview">
                  <img src={preview} alt="Selected" />
                  <div>
                    <strong>{photo?.name}</strong>
                    <span className="res-meta">{photo ? `${Math.max(1, Math.round(photo.size / 1024))} KB` : ''}</span>
                  </div>
                  <button type="button" className="res-btn res-btn--secondary" onClick={() => setPhoto(null)}>Remove</button>
                </div>
              ) : (
                <label className="res-dropzone">
                  <CameraIcon />
                  <span><strong>Add a photo</strong> or take one</span>
                  <input type="file" accept="image/*" className="res-file" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <ResidentNote tone="err">{formError}</ResidentNote>
            <ResidentNote>{saved}</ResidentNote>
          </div>

          <div className="res-form-foot">
            <button type="submit" className="res-btn res-btn--sos" disabled={busy || !title.trim()}>
              <AlertIcon />
              {busy ? 'Sending…' : 'Send SOS'}
            </button>
          </div>
        </form>

        <section className="res-card res-sos-history">
          <div className="res-card-head">
            <div>
              <h2>My alerts</h2>
            </div>
            {items.length ? <span className="res-tab-count">{items.length}</span> : null}
          </div>
          <div className="res-card-body">
            <ResidentNote tone={listNote.tone}>{listNote.text}</ResidentNote>
            <StatusLine loading={loading} error={error} onRetry={reload}>
              {items.length ? (
                <ul className="res-sos-list">
                  {items.map((item) => {
                    const responded = item.status === 'responded' || item.guardResponded;
                    const open = item.status === 'active' || item.status === 'responded';
                    return (
                      <li key={item.id} className={`res-sos-item is-${item.status}`}>
                        <div className="res-sos-item-top">
                          <strong>{item.title}</strong>
                          <span className={`res-badge res-badge--${item.status}`}>{statusLabel(item.status)}</span>
                        </div>
                        {item.note ? <p>{item.note}</p> : null}
                        <div className="res-sos-item-meta">
                          <span>{when(item.createdAt)}</span>
                          {item.flatNo ? <span>{item.flatNo}</span> : null}
                          {responded ? <span className="res-sos-ok">Guard responded</span> : null}
                        </div>
                        {open ? (
                          <div className="res-sos-item-actions">
                            <button type="button" className="res-btn res-btn--secondary" disabled={busy} onClick={() => setClosing({ item, action: 'resolve' })}>
                              Mark resolved
                            </button>
                            <button type="button" className="res-btn res-btn--danger" disabled={busy} onClick={() => setClosing({ item, action: 'cancel' })}>
                              Cancel alert
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="res-empty">
                  <strong>No alerts raised</strong>
                  <p>Alerts you send will appear here.</p>
                </div>
              )}
            </StatusLine>
          </div>
        </section>
      </div>

      <ResidentConfirm
        open={ask}
        danger
        busy={busy}
        title="Raise SOS"
        message="Send this emergency to the guard now?"
        confirmLabel="Raise SOS"
        onCancel={() => setAsk(false)}
        onConfirm={submit}
      />
      <ResidentConfirm
        open={Boolean(closing)}
        danger={closing?.action === 'cancel'}
        busy={busy}
        title={closing?.action === 'cancel' ? 'Cancel alert' : 'Mark as resolved'}
        message={closing?.action === 'cancel'
          ? `Cancel "${closing?.item.title}"? Use this if the SOS was raised by mistake.`
          : `Mark "${closing?.item.title}" as resolved? The guard will see the emergency is over.`}
        confirmLabel={closing?.action === 'cancel' ? 'Cancel alert' : 'Mark resolved'}
        cancelLabel="Keep alert"
        onCancel={() => setClosing(null)}
        onConfirm={confirmClose}
      />
    </>
  );
}
