import { PageHeader, Panel, StatusLine, statusLabel, typeLabel } from '@/modules/resident/components/ResidentShell';
import { useLoad } from '@/modules/resident/components/useLoad';
import VisitorPhoto from '@/modules/resident/components/VisitorPhoto';
import { listMyVisits } from '@/modules/resident/services/residentPortal.service';
import '@/modules/resident/styles/visitor/visitor.css';

function when(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const { loading, error, data, reload } = useLoad(() => listMyVisits(), []);
  return (
    <>
      <PageHeader title="Visitor history" />
      <Panel title="Records">
        <StatusLine loading={loading} error={error} onRetry={reload} empty={!loading && !error && !(data || []).length ? 'No visits yet.' : ''}>
          {(data || []).map((visit) => (
            <div key={visit.id} className="res-person">
              <VisitorPhoto visit={visit} />
              <div className="res-person-main">
                <strong>{visit.name}</strong>
                <div className="res-meta">
                  {typeLabel(visit.type)} · {visit.purpose} · {visit.persons} {Number(visit.persons) === 1 ? 'person' : 'persons'} · {visit.vehicle || 'No vehicle'} · {when(visit.createdAt)}
                </div>
              </div>
              <span className={`res-badge res-badge--${visit.status}`}>{statusLabel(visit.status)}</span>
            </div>
          ))}
        </StatusLine>
      </Panel>
    </>
  );
}
