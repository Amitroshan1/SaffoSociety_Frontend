import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dock, ADMIN_DOCK_GROUPS, COLLAPSE_KEY } from "./Dock.jsx";
import { TopBar } from "./TopBarPanel.jsx";
import { CommandPalette } from "./CommandPalette.jsx";
import AdminProfile from "../../pages/admin/AdmineProfile/AdmineProfile.jsx";
import { ADMIN_ROUTES } from "../../constants/adminRoutes.js";
import {
  FINANCE_DOCK_BOTTOM,
  FINANCE_DOCK_GROUPS,
  FINANCE_PALETTE_ITEMS,
} from "./financeDockConfig.js";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/resident/resident.css";
import "../../styles/admin/AdminDashboard.css";
import "../../styles/common/crud.css";

function isFinanceRoutes(routes) {
  return routes?.dashboard?.startsWith("/finance");
}

function pageTitleFromBreadcrumb(breadcrumb, active, profileOpen) {
  if (profileOpen) return "Profile";
  if (breadcrumb?.length) return breadcrumb[breadcrumb.length - 1]?.label || "Dashboard";
  return active ? active.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Dashboard";
}

export function AppShell({ active, onChange, routes = ADMIN_ROUTES, breadcrumb, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  );

  const financePanel = isFinanceRoutes(routes);
  const dockGroups = financePanel ? FINANCE_DOCK_GROUPS : undefined;
  const dockBottom = financePanel ? FINANCE_DOCK_BOTTOM : undefined;
  const paletteItems = financePanel ? FINANCE_PALETTE_ITEMS : undefined;

  const brandTitle = financePanel ? "Finance Portal" : "Admin Portal";
  const brandSub = user?.name || (financePanel ? "Finance Console" : "Society Console");
  const brandMark = (user?.name || (financePanel ? "FI" : "AD"))
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = financePanel ? "Finance" : "Admin";
  const headerTitle = pageTitleFromBreadcrumb(breadcrumb, active, profileOpen);
  const headerSubtitle = financePanel
    ? "Track collections, billing, and financial reports"
    : "Manage society operations and settings";

  let impersonation = null;
  try {
    impersonation = JSON.parse(sessionStorage.getItem("impersonation") || "null");
  } catch {
    impersonation = null;
  }

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleNavigate = (id) => {
    if (id === "logout") {
      logout();
      return;
    }
    setProfileOpen(false);
    if (id !== active) {
      const path = routes[id];
      if (path) {
        navigate(path);
        return;
      }
    }
    onChange?.(id);
  };

  const shellClass = useMemo(
    () => `resident-shell admin-shell${collapsed ? " resident-shell--collapsed" : ""}`,
    [collapsed],
  );

  return (
    <div className={shellClass}>
      {impersonation?.banner && (
        <div className="admin-impersonation-banner">
          <span>{impersonation.banner}</span>
          <button
            type="button"
            onClick={() => {
              const platformToken = impersonation.platformToken;
              sessionStorage.removeItem("impersonation");
              if (platformToken) localStorage.setItem("accessToken", platformToken);
              window.location.href = "/superadmin/tenants";
            }}
          >
            End impersonation
          </button>
        </div>
      )}

      <Dock
        active={active}
        onChange={handleNavigate}
        groups={dockGroups}
        bottomItems={dockBottom}
        brandTitle={brandTitle}
        brandSub={brandSub}
        brandMark={brandMark}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <main className="resident-main">
        <TopBar
          title={headerTitle}
          subtitle={headerSubtitle}
          onOpenPalette={() => setPaletteOpen(true)}
          onProfileOpen={() => setProfileOpen(true)}
          profileOpen={profileOpen}
          roleLabel={roleLabel}
        />
        <section className="resident-content app-main-content page-fade" key={profileOpen ? "profile" : active}>
          {profileOpen ? (
            <AdminProfile onNavigate={() => setProfileOpen(false)} />
          ) : (
            children
          )}
        </section>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleNavigate}
        items={paletteItems}
      />
    </div>
  );
}

export { ADMIN_DOCK_GROUPS };
