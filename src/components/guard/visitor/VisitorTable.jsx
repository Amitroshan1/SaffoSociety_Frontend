
// client/src/components/guard/visitor/VisitorTable.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Reusable table for Pending / Approved / Rejected visitor lists.
//
// Props:
//   variant     : "pending" | "approved" | "rejected"
//   data        : array of visitor objects (shape documented below)
//   loading     : boolean — show skeleton/spinner while API call is in flight
//   onApprove   : (id) => void  — pending only
//   onDeny      : (id) => void  — pending only
//   onCall      : (id) => void  — pending only — trigger call to resident
//   onMarkExit  : (id) => void  — approved only
//   onReadd     : (id) => void  — rejected only
//
// Visitor object shape (matches what the backend returns):
//   {
//     id        : number | string   — DB primary key (visitors.id)
//     name      : string            — visitors.name
//     phone     : string            — visitors.phone
//     flat      : string            — flats.flat_number (joined)
//     purpose   : string            — visitors.purpose
//     persons   : number            — visitors.persons_count
//     time      : string            — formatted entry/request time (from visitors.created_at)
//     wait      : string            — computed client-side from created_at (pending only)
//     duration  : string            — computed from entry_time (approved only)
//     by        : string            — visitors.rejected_by  (rejected only)
//     vehicle   : string            — visitors.vehicle_number (optional)
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

const AVATAR_COLORS = ["#5b52f0","#20c997","#f5a623","#f05353","#a855f7","#3b82f6"];
function avColor(name) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function initials(name) {
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
}

export default function VisitorTable({
  variant,
  data,
  loading = false,
  onApprove,
  onDeny,
  onCall,
  onMarkExit,
  onReadd,
  onVerifyOtp,
  actionLabels = {},
}) {
  const [search,  setSearch]  = useState("");
  const [purpose, setPurpose] = useState("");
  const labels = {
    visitorCol: "Visitor",
    approve: "Approve",
    deny: "Deny",
    checkIn: "Check in",
    exit: "Mark exit",
    readd: "Re-add",
    done: "Done",
    ...actionLabels,
  };

  // ── Client-side filter (search + purpose dropdown) ───────────────────────
  // BACKEND NOTE: For large datasets (>500 rows) move this to a query param:
  //   GET /api/visitors?status=pending&search=amit&purpose=Guest&page=1&limit=20
  // The backend should do:  WHERE (name ILIKE '%amit%' OR phone LIKE '%amit%')
  //   AND purpose = 'Guest'  ORDER BY created_at DESC  LIMIT 20 OFFSET 0
  const filtered = data.filter((v) => {
    const matchSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search) ||
      v.flat.toLowerCase().includes(search.toLowerCase());
    const matchPurpose = !purpose || v.purpose === purpose;
    return matchSearch && matchPurpose;
  });

  return (
    <div className="vtbl-root">
      {/* ── Toolbar ── */}
      <div className="vtbl-toolbar">
        <div className="vtbl-search-wrap">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name, phone or flat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="vtbl-filter-select"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          <option value="">All purposes</option>
          {["Guest","Work / Service","Delivery","Cab","Medical","Other"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="vtbl-table">
        {/* Head */}
        <div className={`vtbl-head vtbl-grid vtbl-grid--${variant}`}>
          <span>{labels.visitorCol}</span>
          <span className="vtbl-hide">Flat</span>
          <span className="vtbl-hide">Purpose</span>
          {variant === "pending"  && <><span className="vtbl-hide">Requested</span><span>Waiting</span></>}
          {variant === "approved" && <><span className="vtbl-hide">Entry time</span><span className="vtbl-hide">Duration</span></>}
          {variant === "completed" && <><span className="vtbl-hide">Exit time</span><span className="vtbl-hide">Duration</span></>}
          {variant === "rejected" && <><span className="vtbl-hide">Time</span><span className="vtbl-hide">By</span></>}
          <span className="vtbl-actions-head">Actions</span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="vtbl-loading">
            <div className="vtbl-spinner" />
          </div>
        )}

        {/* Rows / Empty */}
        {!loading && (filtered.length === 0 ? (
          <EmptyState variant={variant} labels={labels} />
        ) : (
          filtered.map((v) => (
            <div key={v.id} className={`vtbl-row vtbl-grid vtbl-grid--${variant}`}>

              {/* Visitor info */}
              <div className="vtbl-visitor-info">
                <div
                  className="vtbl-av"
                  style={{
                    background: `${avColor(v.name)}22`,
                    color: avColor(v.name),
                    borderColor: `${avColor(v.name)}55`,
                  }}
                >
                  {/* BACKEND NOTE: replace initials with visitor photo if available */}
                  {/* src={v.photo_url} — stored in Supabase Storage / S3 */}
                  {initials(v.name)}
                </div>
                <div>
                  <div className="vtbl-name">{v.name}</div>
                  <div className="vtbl-phone">{v.phone}</div>
                </div>
              </div>

              {/* Flat — visitors.flat_id → flats.flat_number */}
              <div className="vtbl-mono vtbl-hide">{v.flat}</div>

              {/* Purpose — visitors.purpose (enum / varchar) */}
              <div className="vtbl-text vtbl-hide">{v.purpose}</div>

              {/* Variant-specific cells */}
              {variant === "pending" && (
                <>
                  {/* time = visitors.created_at formatted */}
                  <div className="vtbl-time vtbl-hide">{v.time}</div>
                  {/* wait = computed from (now - created_at), can also be done in SQL:
                      EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS wait_minutes */}
                  <div>
                    <span className="vtbl-badge vtbl-badge--pending">
                      <span className="vtbl-badge-dot" />
                      {v.wait}
                    </span>
                  </div>
                </>
              )}
              {variant === "approved" && (
                <>
                  <div className="vtbl-time vtbl-hide">{v.time}</div>
                  <div className="vtbl-hide">
                    <span className="vtbl-badge vtbl-badge--approved">
                      <span className="vtbl-badge-dot" />
                      {v.duration}
                    </span>
                  </div>
                </>
              )}
              {variant === "completed" && (
                <>
                  <div className="vtbl-time vtbl-hide">{v.time}</div>
                  <div className="vtbl-hide">
                    <span className="vtbl-badge vtbl-badge--approved">
                      <span className="vtbl-badge-dot" />
                      {v.duration}
                    </span>
                  </div>
                </>
              )}
              {variant === "rejected" && (
                <>
                  {/* time = visitors.rejected_at formatted */}
                  <div className="vtbl-time vtbl-hide">{v.time}</div>
                  {/* by = visitors.rejected_by ("Guard" | "Resident") */}
                  <div className="vtbl-text vtbl-hide">{v.by}</div>
                </>
              )}

              {/* Actions */}
              <div className="vtbl-actions">
                {variant === "pending" && (
                  <>
                    <button
                      className="vtbl-act vtbl-act--call"
                      title="Call resident"
                      onClick={() => onCall?.(v.id)}
                    >
                      <PhoneIcon />
                    </button>
                    <button
                      className="vtbl-act vtbl-act--approve"
                      title="Received by Resident"
                      onClick={() => onApprove(v.id)}
                    >
                      {labels.approve}
                    </button>
                    <button
                      className="vtbl-act vtbl-act--deny"
                      title="Received by Guard"
                      onClick={() => onDeny(v.id)}
                    >
                      {labels.deny}
                    </button>
                    {onVerifyOtp ? (
                      <button
                        className="vtbl-act vtbl-act--readd"
                        title="Verify OTP"
                        onClick={() => onVerifyOtp(v.id)}
                      >
                        OTP
                      </button>
                    ) : null}
                  </>
                )}

          {variant === "approved" && (
                  <button
                    className="vtbl-act vtbl-act--exit"
                    onClick={() => onMarkExit(v.id)}
                  >
                    {v.visitStatus === "approved" ? labels.checkIn : labels.exit}
                  </button>
                )}

                {variant === "completed" && (
                  <span className="vtbl-badge vtbl-badge--approved">{labels.done}</span>
                )}

                {variant === "rejected" && (
                  /*
                    BACKEND: PATCH /api/visitors/:id/readd
                    Body: {}
                    Action: UPDATE visitors SET status='pending',
                            rejected_at=NULL, rejected_by=NULL WHERE id=:id
                  */
                  <button
                    className="vtbl-act vtbl-act--readd"
                    onClick={() => onReadd(v.id)}
                  >
                    {labels.readd}
                  </button>
                )}
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

function EmptyState({ variant, labels = {} }) {
  const msgs = {
    pending:  [labels.emptyPending || "No pending requests",  labels.emptyPendingSub || "All entries have been reviewed."],
    approved: [labels.emptyActive || "No active entries", labels.emptyActiveSub || "Approved / inside entries appear here."],
    completed: [labels.emptyCompleted || "No completed entries", labels.emptyCompletedSub || "Finished check-outs appear here."],
    rejected: [labels.emptyRejected || "No rejected entries",  labels.emptyRejectedSub || "Rejected entries will appear here."],
  };
  const [title, sub] = msgs[variant] || ["No data", ""];
  return (
    <div className="vtbl-empty">
      <div className="vtbl-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);




// // client/src/components/guard/VisitorTable.jsx

// import { useState } from "react";

// const AVATAR_COLORS = ["#5b52f0","#20c997","#f5a623","#f05353","#a855f7","#3b82f6"];
// function avColor(name) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
// function initials(name) {
//   const p = name.trim().split(" ");
//   return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
// }

// export default function VisitorTable({ variant, data, onApprove, onDeny, onMarkExit, onReadd }) {
//   const [search,  setSearch]  = useState("");
//   const [purpose, setPurpose] = useState("");

//   const filtered = data.filter((v) => {
//     const matchSearch =
//       !search ||
//       v.name.toLowerCase().includes(search.toLowerCase()) ||
//       v.phone.includes(search) ||
//       v.flat.toLowerCase().includes(search.toLowerCase());
//     const matchPurpose = !purpose || v.purpose === purpose;
//     return matchSearch && matchPurpose;
//   });

//   return (
//     <div className="vtbl-root">
//       {/* toolbar */}
//       <div className="vtbl-toolbar">
//         <div className="vtbl-search-wrap">
//           <SearchIcon />
//           <input
//             type="text"
//             placeholder="Search by name, phone or flat…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//         <select
//           className="vtbl-filter-select"
//           value={purpose}
//           onChange={(e) => setPurpose(e.target.value)}
//         >
//           <option value="">All purposes</option>
//           {["Guest","Work / Service","Delivery","Cab","Medical","Other"].map((p) => (
//             <option key={p}>{p}</option>
//           ))}
//         </select>
//       </div>

//       {/* table */}
//       <div className="vtbl-table">
//         {/* head */}
//         <div className={`vtbl-head vtbl-grid vtbl-grid--${variant}`}>
//           <span>Visitor</span>
//           <span className="vtbl-hide">Flat</span>
//           <span className="vtbl-hide">Purpose</span>
//           {variant === "pending"  && <><span className="vtbl-hide">Requested</span><span>Waiting</span></>}
//           {variant === "approved" && <><span className="vtbl-hide">Entry time</span><span className="vtbl-hide">Duration</span></>}
//           {variant === "rejected" && <><span className="vtbl-hide">Time</span><span className="vtbl-hide">Rejected by</span></>}
//           <span style={{ textAlign: "right" }}>Actions</span>
//         </div>

//         {/* rows */}
//         {filtered.length === 0 ? (
//           <EmptyState variant={variant} />
//         ) : (
//           filtered.map((v) => (
//             <div key={v.id} className={`vtbl-row vtbl-grid vtbl-grid--${variant}`}>
//               {/* visitor info */}
//               <div className="vtbl-visitor-info">
//                 <div
//                   className="vtbl-av"
//                   style={{ background: `${avColor(v.name)}22`, color: avColor(v.name), borderColor: `${avColor(v.name)}55` }}
//                 >
//                   {initials(v.name)}
//                 </div>
//                 <div>
//                   <div className="vtbl-name">{v.name}</div>
//                   <div className="vtbl-phone">{v.phone}</div>
//                 </div>
//               </div>

//               {/* flat */}
//               <div className="vtbl-mono vtbl-hide">{v.flat}</div>

//               {/* purpose */}
//               <div className="vtbl-text vtbl-hide">{v.purpose}</div>

//               {/* variant-specific cells */}
//               {variant === "pending" && (
//                 <>
//                   <div className="vtbl-time vtbl-hide">{v.time}</div>
//                   <div>
//                     <span className="vtbl-badge vtbl-badge--pending">
//                       <span className="vtbl-badge-dot" />
//                       {v.wait}
//                     </span>
//                   </div>
//                 </>
//               )}
//               {variant === "approved" && (
//                 <>
//                   <div className="vtbl-time vtbl-hide">{v.time}</div>
//                   <div className="vtbl-hide">
//                     <span className="vtbl-badge vtbl-badge--approved">
//                       <span className="vtbl-badge-dot" />
//                       {v.duration}
//                     </span>
//                   </div>
//                 </>
//               )}
//               {variant === "rejected" && (
//                 <>
//                   <div className="vtbl-time vtbl-hide">{v.time}</div>
//                   <div className="vtbl-text vtbl-hide">{v.by}</div>
//                 </>
//               )}

//               {/* actions */}
//               <div className="vtbl-actions">
//                 {variant === "pending" && (
//                   <>
//                     <button className="vtbl-act vtbl-act--approve" onClick={() => onApprove(v.id)}>Approve</button>
//                     <button className="vtbl-act vtbl-act--deny"    onClick={() => onDeny(v.id)}>Deny</button>
//                     <button className="vtbl-act vtbl-act--call" title="Call resident">
//                       <PhoneIcon />
//                     </button>
//                   </>
//                 )}
//                 {variant === "approved" && (
//                   <button className="vtbl-act vtbl-act--exit" onClick={() => onMarkExit(v.id)}>Mark exit</button>
//                 )}
//                 {variant === "rejected" && (
//                   <button className="vtbl-act vtbl-act--readd" onClick={() => onReadd(v.id)}>Re-add</button>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// function EmptyState({ variant }) {
//   const msgs = {
//     pending:  ["No pending requests",  "All visitors have been reviewed."],
//     approved: ["No approved visitors", "Approved entries will appear here."],
//     rejected: ["No rejected entries",  "Rejected entries will appear here."],
//   };
//   const [title, sub] = msgs[variant] || ["No data", ""];
//   return (
//     <div className="vtbl-empty">
//       <div className="vtbl-empty-icon">
//         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
//           <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
//           <circle cx="9" cy="7" r="4"/>
//         </svg>
//       </div>
//       <h3>{title}</h3>
//       <p>{sub}</p>
//     </div>
//   );
// }

// const SearchIcon = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//   </svg>
// );
// const PhoneIcon = () => (
//   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
//   </svg>
// );