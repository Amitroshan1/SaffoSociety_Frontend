import { useEffect, useMemo, useState } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  Bell,
  FileCheck,
  Car,
  IndianRupee,
  BarChart3,
  Hospital,
  Building,
  Layers,
  DoorOpen,
  UserCheck,
  ClipboardList,
} from "lucide-react";

const ADMIN_PALETTE_ITEMS = [
  { id: "dashboard",  label: "Dashboard",          module: "Overview",       icon: LayoutDashboard },
  { id: "society",    label: "Society profile",    module: "Setup",          icon: Hospital },
  { id: "buildings",  label: "Buildings",          module: "Setup",          icon: Building },
  { id: "wings",      label: "Wings",              module: "Setup",          icon: Layers },
  { id: "flats",      label: "Flats",              module: "Setup",          icon: DoorOpen },
  { id: "occupancy",  label: "Occupancy",          module: "People",         icon: UserCheck },
  { id: "residents",  label: "Residents directory", module: "People",         icon: Users },
  { id: "visitors",   label: "Visitors directory", module: "People",         icon: Users },
  { id: "visits",     label: "Visit management",   module: "Operations",     icon: FileCheck },
  { id: "staff",      label: "Staff directory",    module: "Operations",     icon: UserCheck },
  { id: "gates",      label: "Gates",              module: "Operations",     icon: DoorOpen },
  { id: "shifts",     label: "Shift schedule",     module: "Operations",     icon: UserCheck },
  { id: "gate-ops",   label: "Gate operations",    module: "Operations",     icon: FileCheck },
  { id: "attendance", label: "Attendance log",     module: "Operations",     icon: ClipboardList },
  { id: "complaints", label: "Open complaints",     module: "Service",        icon: MessageSquare },
  { id: "noc",        label: "NOC requests",        module: "Approvals",      icon: FileCheck },
  { id: "security",   label: "Security hub",        module: "Operations",     icon: FileCheck },
  { id: "payments",   label: "Payments & dues",     module: "Finance",        icon: CreditCard },
  { id: "billing",    label: "Billing run",         module: "Finance",        icon: IndianRupee },
  { id: "notices",    label: "Send notice",         module: "Communication",  icon: Bell },
  { id: "vehicles",   label: "Vehicle registry",    module: "Operations",     icon: Car },
  { id: "reports",    label: "Reports & analytics", module: "Insights",       icon: BarChart3 },
];

export function CommandPalette({ open, onClose, onNavigate, items = ADMIN_PALETTE_ITEMS }) {
  const [q, setQ] = useState("");
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setHover(0);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(s) ||
        i.module.toLowerCase().includes(s)
    );
  }, [q, items]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <Search size={18} className="palette-search-icon" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setHover(0);
            }}
            placeholder="Search modules, users, complaints..."
            className="palette-input"
          />
        </div>
        <div className="palette-divider" />

        <div className="palette-list">
          {filtered.length === 0 && (
            <div className="palette-empty">No results for "{q}"</div>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            const active = i === hover;
            return (
              <button
                key={item.id}
                onMouseEnter={() => setHover(i)}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={"palette-item" + (active ? " active" : "")}
              >
                <span className="palette-item-icon">
                  <Icon size={15} />
                </span>
                <span className="palette-item-label">{item.label}</span>
                <span className="palette-item-tag">{item.module}</span>
              </button>
            );
          })}
        </div>

        <div className="palette-foot">
          <span>↵ to navigate · Esc to close</span>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}