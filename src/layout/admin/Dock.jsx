import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileCheck,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  UserCheck,
  Bell,
  Megaphone,
  Car,
  FolderOpen,
  IndianRupee,
  BarChart3,
  LogOut,
  Hospital,
  Building,
  Layers,
  DoorOpen,
  CalendarCheck,
  ChevronDown,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export const ADMIN_DOCK_GROUPS = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Society",
    items: [
      { id: "society", label: "Society", icon: Hospital },
      { id: "buildings", label: "Buildings", icon: Building },
      { id: "wings", label: "Wings", icon: Layers },
      { id: "flats", label: "Flats", icon: DoorOpen },
      { id: "occupancy", label: "Occupancy", icon: UserCheck },
      { id: "residents", label: "Residents", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "visitors", label: "Visitors", icon: Users },
      { id: "visits", label: "Visit Ops", icon: ShieldCheck },
      { id: "staff", label: "Staff", icon: UserCheck },
      { id: "gates", label: "Gates", icon: DoorOpen },
      { id: "shifts", label: "Shifts", icon: ClipboardList },
      { id: "gate-ops", label: "Gate Ops", icon: ShieldCheck },
      { id: "attendance", label: "Attendance", icon: ClipboardList },
      { id: "complaints", label: "Complaints", icon: MessageSquare },
      { id: "noc", label: "NOC Requests", icon: FileCheck },
      { id: "security", label: "Security", icon: ShieldCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "billing", label: "Billing", icon: IndianRupee },
      { id: "charge-heads", label: "Charge Heads", icon: ClipboardList },
      { id: "billing-cycles", label: "Billing Cycles", icon: ClipboardList },
      { id: "financial-years", label: "Financial Years", icon: FolderOpen },
      { id: "bills", label: "Bills", icon: FileCheck },
      { id: "bill-generate", label: "Generate Bills", icon: FileCheck },
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "receipts", label: "Receipts", icon: FileCheck },
      { id: "late-fee-rules", label: "Late Fee Rules", icon: ClipboardList },
      { id: "discount-rules", label: "Discount Rules", icon: ClipboardList },
      { id: "billing-reports", label: "Reports", icon: BarChart3 },
      { id: "facilities", label: "Facilities", icon: CalendarCheck },
      { id: "bookings", label: "Bookings", icon: ClipboardList },
    ],
  },
  {
    label: "More",
    items: [
      { id: "notices", label: "Notices", icon: Bell },
      { id: "notifications", label: "Notifications", icon: Megaphone },
      { id: "parking", label: "Parking", icon: Car },
      { id: "documents", label: "Documents", icon: FolderOpen },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export const ADMIN_DOCK_BOTTOM = [
  { id: "logout", label: "Logout", icon: LogOut },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";

function normalizeGroups(groups) {
  if (!groups?.length) return ADMIN_DOCK_GROUPS;
  if (Array.isArray(groups[0])) {
    return groups.map((items, index) => ({
      label: index === 0 ? "Overview" : null,
      items,
    }));
  }
  return groups;
}

function findGroupKeyForActive(groups, activeId) {
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].items.some((item) => item.id === activeId)) {
      return groups[i].label || `group-${i}`;
    }
  }
  return groups[0]?.label || "group-0";
}

function scrollActiveIntoDock(scrollEl, buttonEl) {
  if (!scrollEl || !buttonEl) return;
  const scrollRect = scrollEl.getBoundingClientRect();
  const btnRect = buttonEl.getBoundingClientRect();
  const padding = 12;
  const above = btnRect.top < scrollRect.top + padding;
  const below = btnRect.bottom > scrollRect.bottom - padding;
  if (!above && !below) return;

  const targetTop =
    scrollEl.scrollTop +
    (btnRect.top - scrollRect.top) -
    scrollEl.clientHeight / 2 +
    btnRect.height / 2;
  scrollEl.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}

export function Dock({
  active,
  onChange,
  groups = ADMIN_DOCK_GROUPS,
  bottomItems = ADMIN_DOCK_BOTTOM,
  brandTitle = "Admin Portal",
  brandSub = "Society Console",
  brandMark = "AD",
  collapsed,
  onToggleCollapse,
}) {
  const normalized = useMemo(() => normalizeGroups(groups), [groups]);
  const scrollRef = useRef(null);
  const activeBtnRef = useRef(null);
  const activeGroupKey = findGroupKeyForActive(normalized, active);
  const [query, setQuery] = useState("");

  const allItems = useMemo(
    () =>
      normalized.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          group: group.label || "Menu",
        })),
      ),
    [normalized],
  );

  const [openGroups, setOpenGroups] = useState(() => ({ [activeGroupKey]: true }));

  useEffect(() => {
    setOpenGroups((prev) => (prev[activeGroupKey] ? prev : { ...prev, [activeGroupKey]: true }));
  }, [activeGroupKey]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollActiveIntoDock(scrollRef.current, activeBtnRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, openGroups, query, collapsed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q),
    );
  }, [query, allItems]);

  const handleItemClick = (itemId) => {
    onChange(itemId);
  };

  const renderButton = (item) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        ref={isActive ? activeBtnRef : undefined}
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => handleItemClick(item.id)}
        className={`resident-nav-link${isActive ? " active" : ""}`}
      >
        <Icon size={16} strokeWidth={2} className="resident-nav-icon" />
        <span className="resident-nav-text">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="resident-sidebar">
      <div className="resident-sidebar-header">
        <div className="resident-brand">
          <img
            src="/logo.png"
            alt="Saffo Society"
            className="resident-brand-mark"
            style={{ objectFit: 'cover', padding: 0 }}
          />
          <div className="resident-brand-text">
            <h2>{brandTitle}</h2>
            <p>{brandSub}</p>
          </div>
        </div>
        <button
          type="button"
          className="resident-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="resident-nav-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a pageâ€¦"
            aria-label="Filter navigation"
          />
        </div>
      )}

      <nav className="resident-sidebar-nav" ref={scrollRef}>
        {filtered ? (
          <div className="resident-nav-group">
            <span className="resident-nav-label">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>
            {filtered.map(renderButton)}
          </div>
        ) : (
          normalized.map((group, groupIndex) => {
            const key = group.label || `group-${groupIndex}`;
            const isOpen = collapsed || !group.label || openGroups[key];
            return (
              <div key={key} className="resident-nav-group">
                {collapsed ? (
                  <span className="resident-nav-divider" aria-hidden="true" />
                ) : group.label ? (
                  <button
                    type="button"
                    className={`resident-nav-label resident-nav-toggle${isOpen ? " is-open" : ""}`}
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    aria-expanded={isOpen}
                  >
                    {group.label}
                    <ChevronDown size={13} className="resident-nav-chevron" />
                  </button>
                ) : null}
                {isOpen && group.items.map(renderButton)}
              </div>
            );
          })
        )}
      </nav>

      <div className="resident-sidebar-footer">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="resident-logout-btn"
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={15} />
              <span className="resident-nav-text">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export { COLLAPSE_KEY };
