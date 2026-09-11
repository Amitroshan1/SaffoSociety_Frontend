import { Pin } from 'lucide-react';

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  critical: 'Critical',
};

export function formatNoticeDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function titleCase(value) {
  if (!value) return '-';
  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PriorityBadge({ priority }) {
  const key = (priority || 'normal').toLowerCase();
  return (
    <span className={`notice-priority notice-priority--${key}`}>
      {PRIORITY_LABELS[key] || titleCase(key)}
    </span>
  );
}

export function CategoryChip({ category }) {
  return <span className="notice-chip">{titleCase(category)}</span>;
}

function NoticeTitleCell({ row }) {
  const unread = row.isRead === false;
  return (
    <div className="notice-title-cell">
      <span
        className={`notice-dot${unread ? ' is-unread' : ''}`}
        title={unread ? 'Unread' : 'Read'}
        aria-hidden="true"
      />
      <div className="notice-title-text">
        <span className={`notice-title${unread ? ' is-unread' : ''}`}>
          {row.title}
          {row.isPinned && <Pin size={12} className="notice-pin" aria-label="Pinned" />}
        </span>
        {row.summary && <span className="notice-summary-line">{row.summary}</span>}
      </div>
    </div>
  );
}

/**
 * Shared column set for every resident notice list (inbox, unread, pinned, archive).
 */
export function buildNoticeColumns({ dateKey = 'publishedAt', dateLabel = 'Published' } = {}) {
  return [
    {
      key: 'title',
      label: 'Notice',
      render: (row) => <NoticeTitleCell row={row} />,
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <CategoryChip category={row.category} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: dateKey,
      label: dateLabel,
      render: (row) => (
        <span className="notice-date">{formatNoticeDate(row[dateKey] || row.publishAt)}</span>
      ),
    },
  ];
}
