import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Pin,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import {
  CategoryChip,
  PriorityBadge,
  formatNoticeDate,
} from '../../components/resident/noticeUi';
import { acknowledgeResidentNotice, getResidentNotice } from '../../services/notice.service';

export default function ResidentNoticeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acking, setAcking] = useState(false);
  const [ackMessage, setAckMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResidentNotice(id);
      setNotice(res.data?.data?.notice || res.data?.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onAcknowledge = async () => {
    setAcking(true);
    setAckMessage('');
    try {
      await acknowledgeResidentNotice(id);
      setAckMessage('Acknowledged. Thank you!');
      await load();
    } catch (err) {
      setAckMessage(err.response?.data?.message || 'Failed to acknowledge');
    } finally {
      setAcking(false);
    }
  };

  if (loading) return <SkeletonLoader rows={5} />;
  if (error || !notice) return <EmptyState title="Notice unavailable" description={error} />;

  const priority = (notice.priority || 'normal').toLowerCase();

  return (
    <div className="notice-detail">
      <button type="button" className="notice-back" onClick={() => navigate('/resident/notices')}>
        <ArrowLeft size={15} />
        Back to notices
      </button>

      <article className={`notice-hero notice-hero--${priority}`}>
        <div className="notice-hero-top">
          <CategoryChip category={notice.category} />
          <PriorityBadge priority={notice.priority} />
          {notice.isPinned && (
            <span className="notice-chip notice-chip--pin">
              <Pin size={12} />
              Pinned
            </span>
          )}
          {notice.status && notice.status !== 'published' && (
            <span className="notice-chip notice-chip--muted">{notice.status}</span>
          )}
        </div>

        <h1 className="notice-hero-title">{notice.title}</h1>

        {notice.summary && <p className="notice-hero-summary">{notice.summary}</p>}

        <div className="notice-hero-meta">
          <span>
            <FileText size={13} />
            {notice.noticeNumber || '-'}
          </span>
          <span>
            <CalendarClock size={13} />
            Published {formatNoticeDate(notice.publishedAt || notice.publishAt)}
          </span>
          {notice.expiresAt && (
            <span>
              <CalendarClock size={13} />
              Expires {formatNoticeDate(notice.expiresAt)}
            </span>
          )}
        </div>
      </article>

      <div className="notice-body">{notice.bodyText}</div>

      {notice.attachments?.length > 0 && (
        <section className="resident-section">
          <h3>Attachments</h3>
          <div className="notice-attachments">
            {notice.attachments.map((a) => (
              <a
                key={a.id}
                className="notice-attachment"
                href={a.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={15} />
                <span className="notice-attachment-name">{a.fileName}</span>
                <Download size={14} className="notice-attachment-icon" />
              </a>
            ))}
          </div>
        </section>
      )}

      {notice.requiresAcknowledgement && (
        <section
          className={`notice-ack${notice.isAcknowledged ? ' notice-ack--done' : ''}`}
        >
          {notice.isAcknowledged ? (
            <p className="notice-ack-done">
              <CheckCircle2 size={16} />
              You have acknowledged this notice.
            </p>
          ) : (
            <>
              <div>
                <h3>Acknowledgement required</h3>
                <p>
                  Please confirm you have read this notice
                  {notice.acknowledgementDueAt
                    ? ` by ${formatNoticeDate(notice.acknowledgementDueAt)}`
                    : ''}
                  .
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={onAcknowledge}
                disabled={acking}
              >
                {acking ? 'Submitting…' : 'Acknowledge'}
              </button>
              {ackMessage && <p className="notice-ack-message">{ackMessage}</p>}
            </>
          )}
        </section>
      )}
    </div>
  );
}
