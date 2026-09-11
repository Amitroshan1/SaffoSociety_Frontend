
// client/src/pages/guard/VisitorsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Route-level wrapper for the Visitors feature.
// Mirrors GuardMain.jsx structure — shares the same Sidebar and DashboardHeader.
//
// Route:      /guard/visitors   (register in AppRouter.jsx)
// Protected:  <ProtectedRoute role="guard"> wraps this page
//
// ── BACKEND / AUTH NOTES ──────────────────────────────────────────────────────
//
// 1. ROUTE PROTECTION
//    In AppRouter.jsx:
//      <Route path="/guard/visitors" element={
//        <ProtectedRoute allowedRoles={["guard"]}>
//          <VisitorsPage />
//        </ProtectedRoute>
//      } />
//
//    ProtectedRoute checks: useAuth().user.role === 'guard'
//    If not authenticated → redirect to /login
//    If wrong role → redirect to /unauthorized
//
// 2. AUTH TOKEN
//    All API calls inside Visitors.jsx / AddVisitorForm.jsx should use
//    the token from useAuth():
//      const { token } = useAuth();
//      fetch('/api/visitors', { headers: { Authorization: `Bearer ${token}` } })
//
//    OR configure axios defaults once at app level:
//      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//
// 3. GUARD PROFILE
//    DashboardHeader already shows guard info. The guard's data is:
//      user.id         → guard_id  (needed for POST /api/visitors body)
//      user.name       → shown in AddVisitorForm preview card
//      user.society_id → society_id (needed for all visitor queries)
//    Access via: const { user } = useAuth()  inside child components
//
// 4. PAGE TITLE / META
//    Set document title for browser tab:
//      useEffect(() => { document.title = 'Visitors | Guard Dashboard'; }, []);
//
// 5. SIDEBAR activeNav
//    Pass activeNav="visitors" to Sidebar so it highlights the correct nav item.
//    Make sure "visitors" is in the Sidebar's nav items list with the correct path.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { navigateGuard } from "../../../constants/guardRoutes.js";
import "../../../styles/guard/guard-main.css";
import "../../../styles/guard/visitor/visitors.css";
import Sidebar         from "../../../components/guard/Sidebar";
import DashboardHeader from "../../../components/guard/DashboardHeader";
import Visitors        from "../../../components/guard/visitor/Visitors";

export default function VisitorsPage() {
  const navigate = useNavigate();

  // Set browser tab title
  useEffect(() => {
    document.title = "Visitors | Guard Dashboard";
    return () => { document.title = "Guard Dashboard"; };
  }, []);

  // Handle sidebar navigation
  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Visitors" onNavigate={handleSidebarNav} />

      <div className="gm-content">
        <DashboardHeader />

        <main className="gm-main">
          <Visitors onNavigateBack={() => navigate("/guard/dashboard")} />
        </main>
      </div>
    </div>
  );
}




// // client/src/pages/guard/VisitorsPage.jsx
// // ─────────────────────────────────────────────────────────────
// // Route-level wrapper for the Visitors feature.
// // Mirrors GuardMain.jsx structure — shares the same Sidebar
// // and DashboardHeader so every guard page feels consistent.
// //
// // Route:    /guard/visitors   (add to AppRouter.jsx)
// // Protected by: ProtectedRoute (role = 'guard')
// // ─────────────────────────────────────────────────────────────

// import '../../../styles/guard/guard-main.css';
// import '../../../styles/guard/visitor/visitors.css';

// import { useNavigate } from 'react-router-dom';
// import Sidebar         from '../../../components/guard/Sidebar';
// import DashboardHeader from '../../../components/guard/DashboardHeader';
// import Visitors        from '../../../components/guard/visitor/Visitors';

// export default function VisitorsPage() {
//   const navigate = useNavigate();

//   return (
//     <div className="gm-root">
//       <Sidebar activeNav="visitors" />

//       <div className="gm-content">
//         <DashboardHeader />

//         <main className="gm-main">
//           <div style={{ marginBottom: '20px' }}>
//             <button 
//               onClick={() => navigate('/guard/dashboard')}
//               style={{
//                 padding: '8px 16px',
//                 backgroundColor: '#5b52f0',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: '500',
//               }}
//             >
//               ← Back to Dashboard
//             </button>
//           </div>
//           <Visitors />
//         </main>
//       </div>
//     </div>
//   );
// }