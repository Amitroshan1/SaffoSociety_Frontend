import { useState } from 'react';
import { PageHeader, Panel, StatusLine } from '@/modules/resident/components/ResidentShell';
import { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import { listGateNotifications, markGateNotificationRead } from '@/modules/resident/services/notification.service';
import '@/modules/resident/styles/notification/notification.css';

const FILTERS = ['all', 'visitor', 'emergency', 'parking', 'amenity'];

export default function NotificationsPage() {
  const [category, setCategory] = useState('all');
  const { loading, error, data, reload } = useLoad(() => listGateNotifications(category), [category]);
  const [note, setNote] = useState('');

  async function read(id) {
    setNote('');
    try {
      await markGateNotificationRead(id);
      window.dispatchEvent(new Event('resident-notes-changed'));
      await reload();
    } catch (err) {
      setNote(err.message);
    }
  }

  function when(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        sub="Gate updates for visitors, emergencies, parking and amenities."
        action={(
          <div className="res-tabs">
            {FILTERS.map((item) => (
              <button key={item} type="button" className={`res-tab${category === item ? ' is-on' : ''}`} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        )}
      />
      <Panel title="Inbox">
        <ResidentNote tone="err">{note}</ResidentNote>
        <StatusLine loading={loading} error={error} onRetry={reload} empty={!loading && !error && !(data || []).length ? "You're all caught up." : ''}>
          {(data || []).map((item) => (
            <div key={item.id} className={`res-note-item${item.read ? '' : ' is-unread'}${item.category === 'emergency' ? ' is-emergency' : ''}`}>
              <div className="res-avatar">{item.category.slice(0, 1).toUpperCase()}</div>
              <div className="res-person-main">
                <strong>{item.title}</strong>
                <div className="res-meta">{item.body}</div>
                <div className="res-meta">{item.category}{when(item.createdAt) ? ` · ${when(item.createdAt)}` : ''}</div>
              </div>
              {item.read ? <span className="res-meta">Read</span> : (
                <button type="button" className="res-btn res-btn--secondary" onClick={() => read(item.id)}>Mark read</button>
              )}
            </div>
          ))}
        </StatusLine>
      </Panel>
    </>
  );
}
