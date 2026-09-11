import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { SearchInput } from '../../../components/common/index.js';
import {
  downloadGuardDocument,
  formatFileSize,
  listGuardDocuments,
  openDownloadedFile,
} from '../../../services/document.service.js';

function formatPublished(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GuardDocumentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listGuardDocuments({
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
      });
      setRows(res.data?.data?.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    document.title = 'Documents | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const categories = useMemo(() => {
    const set = new Set();
    for (const row of rows) {
      if (row.categoryName) set.add(row.categoryName);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (category === 'all') return rows;
    return rows.filter((r) => (r.categoryName || '') === category);
  }, [rows, category]);

  async function onDownload(row) {
    setDownloadingId(row.id);
    setError('');
    try {
      const { data } = await downloadGuardDocument(row.id);
      openDownloadedFile(data, row.fileUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Documents" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 className="gm-park-page-title">Documents</h2>
          {error && <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div>}

          <div className="gm-park-toolbar">
            <div className="gm-park-search">
              <SearchInput value={search} onChange={setSearch} placeholder="Search documents" />
            </div>
            {categories.length > 0 && (
              <div className="gm-doc-filters">
                <button
                  type="button"
                  className={`gm-doc-chip ${category === 'all' ? 'is-active' : ''}`}
                  onClick={() => setCategory('all')}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`gm-doc-chip ${category === c ? 'is-active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="glass-card gm-park-table-card">
              <div className="gm-doc-table-head">
                <h3 className="gm-park-table-title">Gate documents</h3>
                <span className="gm-doc-count">{filteredRows.length} file{filteredRows.length === 1 ? '' : 's'}</span>
              </div>
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Published</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={5}>No documents available.</td>
                    </tr>
                  )}
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600 }}>{row.title || '—'}</td>
                      <td>{row.categoryName || '—'}</td>
                      <td>{formatFileSize(row.fileSizeBytes)}</td>
                      <td>{formatPublished(row.publishedAt || row.createdAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={downloadingId === row.id}
                          onClick={() => onDownload(row)}
                        >
                          {downloadingId === row.id ? 'Downloading…' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
