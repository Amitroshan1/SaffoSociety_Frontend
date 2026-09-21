
// client/src/components/guard/visitor/Visitors.jsx
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inner content component â€” tabs, data state, and panel logic.
// Rendered inside VisitorsPage.jsx which provides the Sidebar + DashboardHeader.
//
// â”€â”€ DB SCHEMA (reference) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
//  TABLE visitors (
//    id              SERIAL PRIMARY KEY,
//    society_id      INT REFERENCES societies(id),
//    flat_id         INT REFERENCES flats(id),
//    guard_id        INT REFERENCES users(id),          -- guard who added the entry
//    name            VARCHAR(120) NOT NULL,
//    phone           VARCHAR(15)  NOT NULL,
//    purpose         VARCHAR(50)  NOT NULL,             -- 'Guest'|'Work / Service'|'Delivery'|'Cab'|'Medical'|'Other'
//    persons_count   INT DEFAULT 1,
//    vehicle_number  VARCHAR(20),
//    vehicle_type    VARCHAR(30),
//    photo_url       TEXT,                              -- Supabase Storage / S3 signed URL
//    status          VARCHAR(20) DEFAULT 'pending',     -- 'pending'|'approved'|'rejected'|'exited'
//    notify_resident BOOLEAN DEFAULT TRUE,
//    pre_approved    BOOLEAN DEFAULT FALSE,
//    remarks         TEXT,
//    created_at      TIMESTAMPTZ DEFAULT NOW(),         -- used as "requested time"
//    entry_time      TIMESTAMPTZ,                       -- set when status â†’ approved
//    exit_time       TIMESTAMPTZ,                       -- set when Mark Exit is clicked
//    rejected_at     TIMESTAMPTZ,
//    rejected_by     VARCHAR(20)                        -- 'Guard' | 'Resident'
//  );
//
// â”€â”€ API ENDPOINTS (to be implemented in visitor.service.js / visitor.routes.js) â”€
//
//  GET    /api/visitors?status=pending&societyId=X     â†’ array of visitor rows
//  GET    /api/visitors?status=approved&societyId=X    â†’ array
//  GET    /api/visitors?status=rejected&societyId=X    â†’ array
//  POST   /api/visitors                                â†’ create new visitor (returns created row)
//  PATCH  /api/visitors/:id/approve                   â†’ status=approved, entry_time=NOW()
//  PATCH  /api/visitors/:id/deny                      â†’ status=rejected, rejected_at, rejected_by
//  PATCH  /api/visitors/:id/exit                      â†’ status=exited, exit_time=NOW()
//  PATCH  /api/visitors/:id/readd                     â†’ status=pending, clear rejected fields
//  GET    /api/visitors/recent?guardId=X&limit=5      â†’ last 5 entries by this guard (for quick-fill)
//
// â”€â”€ REAL-TIME (optional, recommended for pending tab) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Use Supabase Realtime OR Socket.IO room per societyId:
//    supabase.channel('visitors').on('postgres_changes', ...).subscribe()
//  On INSERT â†’ add to pending list
//  On UPDATE â†’ move row between tabs based on new status
//
// â”€â”€ AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Guard ID comes from useAuth() hook â†’ decoded JWT â†’ user.id
//  Society ID comes from guard's profile â†’ user.society_id
//  Attach to every API call as header: Authorization: Bearer <token>
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddVisitorForm from "@/components/guard/visitor/AddVisitorForm";
import VisitorTable   from "@/components/guard/visitor/VisitorTable";
import {
  apiError,
  checkInVisitor,
  listGuardVisitsByTab,
  logGuardCall,
  logVisitor,
  markVisitorExit,
  readdRejectedVisit,
  tryGuardApprove,
  tryGuardDeny,
  verifyVisitorOTP,
} from "@/services/guard.service";

const TABS = [
  { key: "add",      label: "Add Visitor", icon: "plus"  },
  { key: "pending",  label: "Pending",     icon: "clock" },
  { key: "approved", label: "Approved",    icon: "check" },
  { key: "rejected", label: "Rejected",    icon: "x"     },
];

const VALID_TABS = new Set(TABS.map((t) => t.key));

export default function Visitors({ onNavigateBack }) {
  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.has(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "add";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pending,  setPending]  = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const refreshLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listGuardVisitsByTab();
      setPending(data.pending);
      setApproved(data.approved);
      setRejected(data.rejected);
    } catch (err) {
      showToast("error", "Failed to load visits", apiError(err, "Please try again."));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const handleAddVisitor = useCallback(
    async (form) => {
      const row = await logVisitor(form);
      if (row.visitStatus === "approved" || row.visitStatus === "checked_in") {
        setApproved((prev) => [row, ...prev]);
        setActiveTab("approved");
        showToast("success", "Visitor logged", `Pre-approved visit for flat ${row.flat}.`);
      } else {
        setPending((prev) => [row, ...prev]);
        setActiveTab("pending");
        showToast("success", "Visitor added", `Waiting approval for flat ${row.flat}.`);
      }
    },
    [showToast],
  );

  const handleApprove = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await tryGuardApprove(v);
        await refreshLists();
        setActiveTab("approved");
        showToast("success", "Visitor approved", `${v.name} approved for Flat ${v.flat}.`);
      } catch (err) {
        showToast("error", "Approve failed", apiError(err, "Please try again."));
      }
    },
    [pending, refreshLists, showToast],
  );

  const handleDeny = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await tryGuardDeny(v);
        await refreshLists();
        setActiveTab("rejected");
        showToast("error", "Visitor denied", `${v.name} has been turned away.`);
      } catch (err) {
        showToast("error", "Deny failed", apiError(err, "Please try again."));
      }
    },
    [pending, refreshLists, showToast],
  );

  const handleCall = useCallback(
    async (id) => {
      const visitor = pending.find((v) => v.id === id) || approved.find((v) => v.id === id);
      const phone = visitor?.phone || visitor?.raw?.phone;
      if (!phone) {
        showToast("error", "No phone", "Resident/visitor phone is not available.");
        return;
      }
      try {
        await logGuardCall(id, `Called ${visitor?.name || "visitor"}`);
      } catch {
        // Dial anyway
      }
      window.location.href = `tel:${phone}`;
    },
    [pending, approved, showToast],
  );

  const handleVerifyOtp = useCallback(
    async (id) => {
      const otp = window.prompt("Enter visitor OTP");
      if (!otp) return;
      try {
        const row = await verifyVisitorOTP(id, otp.trim());
        setPending((prev) => prev.filter((x) => x.id !== id));
        setApproved((prev) => [row, ...prev]);
        setActiveTab("approved");
        showToast("success", "OTP verified", `${row.name} checked in`);
      } catch (err) {
        showToast("error", "OTP failed", apiError(err, "Invalid OTP"));
      }
    },
    [showToast],
  );

  const handleMarkExit = useCallback(
    async (id) => {
      const v = approved.find((x) => x.id === id);
      if (!v) return;
      try {
        if (v.visitStatus === "approved") {
          const updated = await checkInVisitor(id);
          setApproved((prev) => prev.map((x) => (x.id === id ? updated : x)));
          showToast("success", "Checked in", `${v.name} is now inside.`);
          return;
        }
        await markVisitorExit(id);
        setApproved((prev) => prev.filter((x) => x.id !== id));
        showToast("success", "Exit marked", "Visitor has exited the premises.");
      } catch (err) {
        showToast("error", "Action failed", apiError(err, "Please try again."));
      }
    },
    [approved, showToast],
  );

  const handleReadd = useCallback(
    async (id) => {
      const v = rejected.find((x) => x.id === id);
      if (!v) return;
      try {
        const row = await readdRejectedVisit(v);
        setRejected((prev) => prev.filter((x) => x.id !== id));
        setPending((prev) => [row, ...prev]);
        setActiveTab("pending");
        showToast("success", "Moved to pending", `${v.name} added back to pending queue.`);
      } catch (err) {
        showToast("error", "Re-add failed", apiError(err, "Please try again."));
      }
    },
    [rejected, showToast],
  );

  return (
    <div className="vp-root">
      {/* â”€â”€ PAGE HEADER â”€â”€ */}
      <div className="vp-header">
        {/* Back button â€” use navigate('/guard/dashboard') in real app */}
        <button className="vp-back-btn" onClick={onNavigateBack}>
          <BackIcon />
          Dashboard
        </button>
        <div className="vp-header-titles">
          <h1 className="vp-page-title">Visitors</h1>
        </div>
      </div>

      {/* â”€â”€ TABS â”€â”€ */}
      <div className="vp-tabs">
        {TABS.map((tab) => {
          const count =
            tab.key === "pending"  ? pending.length  :
            tab.key === "approved" ? approved.length :
            tab.key === "rejected" ? rejected.length : null;

          return (
            <button
              key={tab.key}
              className={`vp-tab vp-tab--${tab.key}${activeTab === tab.key ? " vp-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon name={tab.icon} />
              <span>{tab.label}</span>
              {count !== null && (
                <span className={`vp-tab-count vp-tab-count--${tab.key}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* â”€â”€ PANELS â”€â”€ */}
      <div className="vp-panel">
        {activeTab === "add" && (
          <AddVisitorForm onSubmit={handleAddVisitor} showToast={showToast} />
        )}
        {activeTab === "pending" && (
          <VisitorTable
            variant="pending"
            data={pending}
            loading={loading}
            onApprove={handleApprove}
            onDeny={handleDeny}
            onCall={handleCall}
            onVerifyOtp={handleVerifyOtp}
          />
        )}
        {activeTab === "approved" && (
          <VisitorTable
            variant="approved"
            data={approved}
            loading={loading}
            onMarkExit={handleMarkExit}
          />
        )}
        {activeTab === "rejected" && (
          <VisitorTable
            variant="rejected"
            data={rejected}
            loading={loading}
            onReadd={handleReadd}
          />
        )}
      </div>

      {/* â”€â”€ TOAST â”€â”€ */}
      {toast && (
        <div className={`vp-toast vp-toast--${toast.type}`}>
          <div className={`vp-toast-icon vp-toast-icon--${toast.type}`}>
            {toast.type === "success" ? <CheckIcon /> : <XIcon />}
          </div>
          <div>
            <div className="vp-toast-title">{toast.title}</div>
            <div className="vp-toast-sub">{toast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* â”€â”€ Icons â”€â”€ */
function TabIcon({ name }) {
  const props = { className: "vp-tab-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  if (name === "plus")  return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (name === "clock") return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (name === "check") return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
  if (name === "x")     return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  return null;
}
function BackIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
