import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/common/ThemeToggle";

export function TopBar({
  title = "Admin Portal",
  subtitle = "Manage society operations and settings",
  onOpenPalette,
  onProfileOpen,
  profileOpen = false,
  roleLabel = "Admin",
}) {
  const { user } = useAuth();
  const [isMacDevice, setIsMacDevice] = useState(true);
  const dropRef = useRef(null);

  const displayName = user?.name || roleLabel;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    setIsMacDevice(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <header className="resident-header">
      <div>
        <h1 className="resident-header-title">{title}</h1>
        <p className="resident-header-subtitle">{subtitle}</p>
      </div>
      <div className="resident-header-user" ref={dropRef}>
        {onOpenPalette && (
          <button type="button" className="admin-header-search" onClick={onOpenPalette}>
            <Search size={14} />
            <span className="admin-header-search-label">Search</span>
            <kbd className="kbd">{isMacDevice ? "⌘K" : "Ctrl K"}</kbd>
          </button>
        )}
        <ThemeToggle />
        <button
          type="button"
          className="admin-header-avatar-btn"
          onClick={() => onProfileOpen?.()}
          aria-label={profileOpen ? "Close profile" : "Open profile"}
          aria-pressed={profileOpen}
        >
          <div className="resident-header-avatar">{initials}</div>
          <div>
            <div className="resident-header-name">{displayName}</div>
            <div className="resident-header-role">{roleLabel}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
