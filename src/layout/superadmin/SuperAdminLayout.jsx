import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../../components/common/ThemeToggle';
import { SUPER_ADMIN_ROUTES } from '../../constants/superAdminRoutes';
import '../../styles/superadmin/superadmin.css';

const groups = [...new Set(SUPER_ADMIN_ROUTES.map((r) => r.group))];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const impersonation = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('impersonation') || 'null');
    } catch {
      return null;
    }
  })();

  return (
    <div className="sa-shell">
      {impersonation?.banner && (
        <div className="sa-impersonation-banner">
          <span>{impersonation.banner}</span>
          <button
            type="button"
            className="sa-btn sa-btn-ghost"
            onClick={() => {
              sessionStorage.removeItem('impersonation');
              localStorage.setItem('accessToken', impersonation.platformToken || '');
              navigate('/superadmin/tenants', { replace: true });
              window.location.reload();
            }}
          >
            End impersonation view
          </button>
        </div>
      )}
      <aside className="sa-sidebar">
        <div className="sa-brand">
          <img src="/logo.png" alt="Saffo Society" className="sa-brand-mark" style={{ objectFit: 'cover', padding: 0 }} />
          <div>
            <div className="sa-brand-title">Saffo Society</div>
            <div className="sa-brand-sub">Control Plane</div>
          </div>
        </div>
        <nav className="sa-nav">
          {groups.map((group) => (
            <div key={group} className="sa-nav-group">
              <div className="sa-nav-group-label">{group}</div>
              {SUPER_ADMIN_ROUTES.filter((r) => r.group === group).map((r) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  className={({ isActive }) =>
                    `sa-nav-link${isActive ? ' is-active' : ''}`
                  }
                >
                  {r.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sa-sidebar-footer">
          <div className="sa-user">
            <strong>{user?.name || 'Operator'}</strong>
            <span>{user?.role}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <button type="button" className="sa-btn sa-btn-ghost" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="sa-main">
        <Outlet />
      </main>
    </div>
  );
}
