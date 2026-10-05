import { Navigate, Route, Routes } from 'react-router-dom';
import PermissionGuard from '@/auth/PermissionGuard';
import { GuardThemeProvider } from '@/modules/guard/shims/ThemeContext';

import GuardMain from '@/modules/guard/pages/GuardMain';
import VisitorsPage from '@/modules/guard/pages/visitors/VisitorsPage';
import GuardDeliveryPage from '@/modules/guard/pages/delivery/GuardDeliveryPage';
import GuardStaffEntryPage from '@/modules/guard/pages/staff-entry/GuardStaffEntryPage';
import GuardCabEntryPage from '@/modules/guard/pages/cab-entry/GuardCabEntryPage';
import MySchedulePage from '@/modules/guard/pages/schedule/MySchedulePage';
import GuardDocumentsPage from '@/modules/guard/pages/Documents/GuardDocumentsPage';
import GuardBookingsPage from '@/modules/guard/pages/facilities/GuardBookingsPage';
import GuardParkingPage from '@/modules/guard/pages/parking/GuardParkingPage';
import GuardNotificationsPage from '@/modules/guard/pages/notifications/GuardNotificationsPage';
import GuardSosPage from '@/modules/guard/pages/sos-alerts/GuardSosPage.jsx';
import GuardProfilePage from '@/modules/guard/pages/Profile/GuardProfilePage';

/**
 * Guard routes — pages are 1:1 with Frontend (same UI), mock services only.
 */
export default function GuardRoutes() {
  return (
    <GuardThemeProvider>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PermissionGuard><GuardMain /></PermissionGuard>} />
        <Route path="visitors" element={<PermissionGuard><VisitorsPage /></PermissionGuard>} />
        <Route path="delivery" element={<PermissionGuard><GuardDeliveryPage /></PermissionGuard>} />
        <Route path="staff-entry" element={<PermissionGuard><GuardStaffEntryPage /></PermissionGuard>} />
        <Route path="cab-entry" element={<PermissionGuard><GuardCabEntryPage /></PermissionGuard>} />
        <Route path="schedule" element={<PermissionGuard><MySchedulePage /></PermissionGuard>} />
        <Route path="shifts" element={<Navigate to="/guard/schedule" replace />} />
        <Route path="attendance" element={<Navigate to="/guard/schedule" replace />} />
        <Route path="documents" element={<PermissionGuard><GuardDocumentsPage /></PermissionGuard>} />
        <Route path="bookings" element={<PermissionGuard><GuardBookingsPage /></PermissionGuard>} />
        <Route path="parking" element={<PermissionGuard><GuardParkingPage /></PermissionGuard>} />
        <Route path="vehicles" element={<Navigate to="/guard/parking" replace />} />
        <Route path="notifications" element={<PermissionGuard><GuardNotificationsPage /></PermissionGuard>} />
        <Route path="sos" element={<PermissionGuard><GuardSosPage /></PermissionGuard>} />
        <Route path="emergency" element={<Navigate to="/guard/sos" replace />} />
        <Route path="profile" element={<PermissionGuard><GuardProfilePage /></PermissionGuard>} />
        <Route path="*" element={<Navigate to="/guard/dashboard" replace />} />
      </Routes>
    </GuardThemeProvider>
  );
}
