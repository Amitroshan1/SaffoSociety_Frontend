import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function SecurityPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      active="security"
      onChange={(id) => {
        if (id === 'security') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Security' }]}
    >
      <PageHeader
        icon={ShieldCheck}
        iconColor="#86efac"
        title="Security"
        subtitle="Society security overview — gates, staff, visits, and attendance."
      />

      <section className="glass-card" style={{ padding: 24, borderRadius: 16, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--t2)' }}>
          Security hub
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--t3)', maxWidth: 560 }}>
          A dedicated security console is not built yet. Use these operational modules for
          day-to-day gate and visitor security work.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate('/admin/gate-ops')}
          >
            Gate Ops
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/visits')}
          >
            Visit Ops
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/staff')}
          >
            Staff
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/gates')}
          >
            Gates
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate('/admin/attendance')}
          >
            Attendance
          </button>
        </div>
      </section>
    </AppShell>
  );
}
