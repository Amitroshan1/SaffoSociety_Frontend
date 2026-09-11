
// client/src/components/guard/visitor/Visitors.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Inner content component — tabs, data state, and panel logic.
// Rendered inside VisitorsPage.jsx which provides the Sidebar + DashboardHeader.
//
// ── DB SCHEMA (reference) ─────────────────────────────────────────────────────
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
//    entry_time      TIMESTAMPTZ,                       -- set when status → approved
//    exit_time       TIMESTAMPTZ,                       -- set when Mark Exit is clicked
//    rejected_at     TIMESTAMPTZ,
//    rejected_by     VARCHAR(20)                        -- 'Guard' | 'Resident'
//  );
//
// ── API ENDPOINTS (to be implemented in visitor.service.js / visitor.routes.js) ─
//
//  GET    /api/visitors?status=pending&societyId=X     → array of visitor rows
//  GET    /api/visitors?status=approved&societyId=X    → array
//  GET    /api/visitors?status=rejected&societyId=X    → array
//  POST   /api/visitors                                → create new visitor (returns created row)
//  PATCH  /api/visitors/:id/approve                   → status=approved, entry_time=NOW()
//  PATCH  /api/visitors/:id/deny                      → status=rejected, rejected_at, rejected_by
//  PATCH  /api/visitors/:id/exit                      → status=exited, exit_time=NOW()
//  PATCH  /api/visitors/:id/readd                     → status=pending, clear rejected fields
//  GET    /api/visitors/recent?guardId=X&limit=5      → last 5 entries by this guard (for quick-fill)
//
// ── REAL-TIME (optional, recommended for pending tab) ─────────────────────────
//  Use Supabase Realtime OR Socket.IO room per societyId:
//    supabase.channel('visitors').on('postgres_changes', ...).subscribe()
//  On INSERT → add to pending list
//  On UPDATE → move row between tabs based on new status
//
// ── AUTH ──────────────────────────────────────────────────────────────────────
//  Guard ID comes from useAuth() hook → decoded JWT → user.id
//  Society ID comes from guard's profile → user.society_id
//  Attach to every API call as header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddVisitorForm from "./AddVisitorForm";
import VisitorTable   from "./VisitorTable";
import {
  apiError,
  checkInVisitor,
  listGuardVisitsByTab,
  logVisitor,
  markVisitorExit,
  readdRejectedVisit,
  tryGuardApprove,
  tryGuardDeny,
} from "../../../services/guard.service";

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
    (id) => {
      const visitor = pending.find((v) => v.id === id) || approved.find((v) => v.id === id);
      const phone = visitor?.phone || visitor?.raw?.residentPhone;
      if (!phone) {
        showToast("error", "No phone", "Resident/visitor phone is not available.");
        return;
      }
      window.location.href = `tel:${phone}`;
    },
    [pending, approved, showToast],
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
      {/* ── PAGE HEADER ── */}
      <div className="vp-header">
        {/* Back button — use navigate('/guard/dashboard') in real app */}
        <button className="vp-back-btn" onClick={onNavigateBack}>
          <BackIcon />
          Dashboard
        </button>
        <div className="vp-header-titles">
          <h1 className="vp-page-title">Visitors</h1>
        </div>
      </div>

      {/* ── TABS ── */}
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

      {/* ── PANELS ── */}
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

      {/* ── TOAST ── */}
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

/* ── Icons ── */
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



// // client/src/components/guard/Visitors.jsx
// // ─────────────────────────────────────────────────────────────
// // Inner content component — tabs, data state, and panel logic.
// // Rendered inside VisitorsPage.jsx which provides the
// // Sidebar + DashboardHeader shell.
// //
// // TODO (Backend):
// //   Replace INITIAL_* mock arrays with API calls from
// //   visitor.service.js inside useEffect hooks.
// // ─────────────────────────────────────────────────────────────

// import { useState, useCallback } from "react";
// import AddVisitorForm from "./AddVisitorForm";
// import VisitorTable from "./VisitorTable";

// const INITIAL_PENDING = [
//   {
//     id: 1,
//     name: "Amit Sharma",
//     phone: "9876543210",
//     flat: "B-102",
//     purpose: "Guest",
//     persons: 1,
//     time: "11:48 AM",
//     wait: "2m",
//     vehicle: "",
//   },
//   {
//     id: 2,
//     name: "Pooja Patel",
//     phone: "8765432109",
//     flat: "C-304",
//     purpose: "Guest",
//     persons: 2,
//     time: "11:47 AM",
//     wait: "3m",
//     vehicle: "",
//   },
//   {
//     id: 3,
//     name: "Suresh Nair",
//     phone: "7654321098",
//     flat: "A-205",
//     purpose: "Work",
//     persons: 1,
//     time: "11:40 AM",
//     wait: "11m",
//     vehicle: "MH04BV2210",
//   },
//   {
//     id: 4,
//     name: "Delivery Boy",
//     phone: "9988776655",
//     flat: "D-101",
//     purpose: "Delivery",
//     persons: 1,
//     time: "11:35 AM",
//     wait: "16m",
//     vehicle: "",
//   },
//   {
//     id: 5,
//     name: "Rahul Mehta",
//     phone: "8899001122",
//     flat: "E-402",
//     purpose: "Cab",
//     persons: 3,
//     time: "11:30 AM",
//     wait: "21m",
//     vehicle: "MH01AB5678",
//   },
// ];

// const INITIAL_APPROVED = [
//   {
//     id: 6,
//     name: "Sanjay Mehta",
//     phone: "9123456780",
//     flat: "A-101",
//     purpose: "Guest",
//     persons: 2,
//     time: "10:20 AM",
//     duration: "1h 29m",
//     vehicle: "",
//   },
//   {
//     id: 7,
//     name: "Rohit Verma",
//     phone: "8012345679",
//     flat: "D-203",
//     purpose: "Work",
//     persons: 1,
//     time: "09:15 AM",
//     duration: "2h 34m",
//     vehicle: "MH02CD3456",
//   },
//   {
//     id: 8,
//     name: "Karan Singh",
//     phone: "7901234568",
//     flat: "B-402",
//     purpose: "Guest",
//     persons: 3,
//     time: "08:45 AM",
//     duration: "3h 04m",
//     vehicle: "",
//   },
//   {
//     id: 9,
//     name: "Vikram Reddy",
//     phone: "6890123457",
//     flat: "C-301",
//     purpose: "Guest",
//     persons: 2,
//     time: "08:10 AM",
//     duration: "3h 39m",
//     vehicle: "MH03EF7890",
//   },
//   {
//     id: 10,
//     name: "Priya Sharma",
//     phone: "9911223344",
//     flat: "F-501",
//     purpose: "Delivery",
//     persons: 1,
//     time: "10:55 AM",
//     duration: "46m",
//     vehicle: "",
//   },
// ];

// const INITIAL_REJECTED = [
//   {
//     id: 11,
//     name: "Unknown Caller",
//     phone: "9000000001",
//     flat: "B-501",
//     purpose: "Other",
//     persons: 1,
//     time: "09:45 AM",
//     by: "Resident",
//   },
//   {
//     id: 12,
//     name: "Salesman XYZ",
//     phone: "8000000002",
//     flat: "C-102",
//     purpose: "Other",
//     persons: 1,
//     time: "10:30 AM",
//     by: "Guard",
//   },
//   {
//     id: 13,
//     name: "Wrong Flat",
//     phone: "7000000003",
//     flat: "D-404",
//     purpose: "Delivery",
//     persons: 1,
//     time: "08:00 AM",
//     by: "Resident",
//   },
// ];

// const TABS = [
//   { key: "add", label: "Add Visitor", icon: "plus" },
//   { key: "pending", label: "Pending", icon: "clock" },
//   { key: "approved", label: "Approved", icon: "check" },
//   { key: "rejected", label: "Rejected", icon: "x" },
// ];

// export default function Visitors() {
//   const [activeTab, setActiveTab] = useState("add");
//   const [pending, setPending] = useState(INITIAL_PENDING);
//   const [approved, setApproved] = useState(INITIAL_APPROVED);
//   const [rejected, setRejected] = useState(INITIAL_REJECTED);
//   const [toast, setToast] = useState(null);

//   /* ── Toast helper ── */
//   const showToast = useCallback((type, title, sub) => {
//     setToast({ type, title, sub });
//     setTimeout(() => setToast(null), 3500);
//   }, []);

//   /* ── Actions ── */
//   const handleAddVisitor = useCallback(
//     (entry) => {
//       setPending((prev) => [entry, ...prev]);
//       showToast(
//         "success",
//         "Visitor added",
//         `Notification sent to flat ${entry.flat}.`,
//       );
//       setActiveTab("pending");
//     },
//     [showToast],
//   );

//   const handleApprove = useCallback(
//     (id) => {
//       setPending((prev) => {
//         const v = prev.find((x) => x.id === id);
//         if (!v) return prev;
//         const now = new Date().toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         });
//         setApproved((a) => [{ ...v, duration: "0m", time: now }, ...a]);
//         showToast(
//           "success",
//           "Visitor approved",
//           `${v.name} approved for Flat ${v.flat}.`,
//         );
//         return prev.filter((x) => x.id !== id);
//       });
//     },
//     [showToast],
//   );

//   const handleDeny = useCallback(
//     (id) => {
//       setPending((prev) => {
//         const v = prev.find((x) => x.id === id);
//         if (!v) return prev;
//         const now = new Date().toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         });
//         setRejected((r) => [{ ...v, by: "Guard", time: now }, ...r]);
//         showToast("error", "Visitor denied", `${v.name} has been turned away.`);
//         return prev.filter((x) => x.id !== id);
//       });
//     },
//     [showToast],
//   );

//   const handleMarkExit = useCallback(
//     (id) => {
//       setApproved((prev) => prev.filter((x) => x.id !== id));
//       showToast("success", "Exit marked", "Visitor has exited the premises.");
//     },
//     [showToast],
//   );

//   const handleReadd = useCallback(
//     (id) => {
//       setRejected((prev) => {
//         const v = prev.find((x) => x.id === id);
//         if (!v) return prev;
//         setPending((p) => [{ ...v, wait: "0m" }, ...p]);
//         showToast(
//           "success",
//           "Moved to pending",
//           `${v.name} added back to pending queue.`,
//         );
//         return prev.filter((x) => x.id !== id);
//       });
//     },
//     [showToast],
//   );

//   return (
//     <div className="vp-root">
//       {/* ── PAGE HEADER ── */}
//       <div className="vp-header">
//         <div className="vp-header-left">
//           <h1 className="vp-page-title">Visitors</h1>
//           <span className="vp-page-sub">Manage all visitor entries</span>
//         </div>
//       </div>

//       {/* ── TABS ── */}
//       <div className="vp-tabs">
//         {TABS.map((tab) => {
//           const count =
//             tab.key === "pending"
//               ? pending.length
//               : tab.key === "approved"
//                 ? approved.length
//                 : tab.key === "rejected"
//                   ? rejected.length
//                   : null;

//           return (
//             <button
//               key={tab.key}
//               className={`vp-tab vp-tab--${tab.key}${activeTab === tab.key ? " vp-tab--active" : ""}`}
//               onClick={() => setActiveTab(tab.key)}
//             >
//               <TabIcon name={tab.icon} />
//               <span>{tab.label}</span>
//               {count !== null && (
//                 <span className={`vp-tab-count vp-tab-count--${tab.key}`}>
//                   {count}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* ── PANELS ── */}
//       <div className="vp-panel">
//         {activeTab === "add" && (
//           <AddVisitorForm onSubmit={handleAddVisitor} showToast={showToast} />
//         )}
//         {activeTab === "pending" && (
//           <VisitorTable
//             variant="pending"
//             data={pending}
//             onApprove={handleApprove}
//             onDeny={handleDeny}
//           />
//         )}
//         {activeTab === "approved" && (
//           <VisitorTable
//             variant="approved"
//             data={approved}
//             onMarkExit={handleMarkExit}
//           />
//         )}
//         {activeTab === "rejected" && (
//           <VisitorTable
//             variant="rejected"
//             data={rejected}
//             onReadd={handleReadd}
//           />
//         )}
//       </div>

//       {/* ── TOAST ── */}
//       {toast && (
//         <div className={`vp-toast vp-toast--${toast.type}`}>
//           <div className={`vp-toast-icon vp-toast-icon--${toast.type}`}>
//             {toast.type === "success" ? <CheckIcon /> : <XIcon />}
//           </div>
//           <div>
//             <div className="vp-toast-title">{toast.title}</div>
//             <div className="vp-toast-sub">{toast.sub}</div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ── Tab icon helper ── */
// function TabIcon({ name }) {
//   if (name === "plus")
//     return (
//       <svg
//         className="vp-tab-icon"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <line x1="12" y1="5" x2="12" y2="19" />
//         <line x1="5" y1="12" x2="19" y2="12" />
//       </svg>
//     );
//   if (name === "clock")
//     return (
//       <svg
//         className="vp-tab-icon"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <circle cx="12" cy="12" r="10" />
//         <polyline points="12 6 12 12 16 14" />
//       </svg>
//     );
//   if (name === "check")
//     return (
//       <svg
//         className="vp-tab-icon"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <polyline points="20 6 9 17 4 12" />
//       </svg>
//     );
//   if (name === "x")
//     return (
//       <svg
//         className="vp-tab-icon"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <line x1="18" y1="6" x2="6" y2="18" />
//         <line x1="6" y1="6" x2="18" y2="18" />
//       </svg>
//     );
//   return null;
// }

// function CheckIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.5"
//       width="14"
//       height="14"
//     >
//       <polyline points="20 6 9 17 4 12" />
//     </svg>
//   );
// }
// function XIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       width="14"
//       height="14"
//     >
//       <line x1="18" y1="6" x2="6" y2="18" />
//       <line x1="6" y1="6" x2="18" y2="18" />
//     </svg>
//   );
// }
