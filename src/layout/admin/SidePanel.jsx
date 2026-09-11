import { X } from "lucide-react";

export function SidePanel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="side-panel">
      <div className="side-panel-head">
        <h3>{title}</h3>
        <button onClick={onClose} className="icon-btn" aria-label="Close">
          <X size={15} />
        </button>
      </div>
      <div className="side-panel-body">{children}</div>
    </div>
  );
}

export function PanelSection({ label, children }) {
  return (
    <div className="panel-section">
      <div className="panel-section-label">{label}</div>
      {children}
    </div>
  );
}