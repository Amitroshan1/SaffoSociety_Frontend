import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import {
  downloadResidentDocument,
  favoriteResidentDocument,
  formatFileSize,
  getResidentDocument,
  openDownloadedFile,
} from '../../services/document.service';

export default function ResidentDocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResidentDocument(id);
      setDoc(res.data?.data?.document || res.data?.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onDownload = async () => {
    setBusy(true);
    try {
      const { data } = await downloadResidentDocument(id);
      openDownloadedFile(data, doc?.fileUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  const onToggleFavorite = async () => {
    setBusy(true);
    try {
      await favoriteResidentDocument(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update favorite');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SkeletonLoader rows={5} />;
  if (error && !doc) return <EmptyState title="Document unavailable" description={error} />;
  if (!doc) return <EmptyState title="Document not found" />;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: 12 }}
      >
        ← Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{doc.title}</h1>
          <p style={{ color: '#6b7280', margin: '0 0 12px' }}>
            {doc.documentNumber} · {doc.categoryName || 'Uncategorized'} · {doc.scope}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={busy}
          style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}
        >
          {doc.isFavorite ? '★ Favorited' : '☆ Add to favorites'}
        </button>
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      {doc.description && (
        <p style={{ fontWeight: 600, color: '#374151' }}>{doc.description}</p>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          <div>
            <strong>File name</strong>
            <p style={{ margin: '4px 0 0' }}>{doc.fileName || '-'}</p>
          </div>
          <div>
            <strong>File size</strong>
            <p style={{ margin: '4px 0 0' }}>{formatFileSize(doc.fileSizeBytes)}</p>
          </div>
          <div>
            <strong>Published</strong>
            <p style={{ margin: '4px 0 0' }}>{doc.publishedAt || doc.createdAt || '-'}</p>
          </div>
          {doc.expiresAt && (
            <div>
              <strong>Expires</strong>
              <p style={{ margin: '4px 0 0' }}>{doc.expiresAt}</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {busy ? 'Working…' : 'Download'}
      </button>

      <p style={{ marginTop: 20 }}>
        <Link to="/resident/documents">Back to all documents</Link>
      </p>
    </div>
  );
}
