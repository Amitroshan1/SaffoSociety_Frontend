import { FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function NocRequestsPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      active="noc"
      onChange={(id) => {
        if (id === 'noc') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'NOC Requests' }]}
    >
      <PageHeader
        icon={FileCheck}
        iconColor="#93c5fd"
        title="NOC Requests"
        subtitle="Approve and manage no-objection certificates for residents."
      />

      <section className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--t2)' }}>
          No NOC workflow yet
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--t3)', maxWidth: 520 }}>
          This module is reserved for transfer, renovation, and move-out NOC approvals.
          Related resident and document tools are available meanwhile.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate('/admin/residents')}
          >
            Residents
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/documents')}
          >
            Documents
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/complaints')}
          >
            Complaints
          </button>
        </div>
      </section>
    </AppShell>
  );
}
