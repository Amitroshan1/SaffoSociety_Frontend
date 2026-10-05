import { Navigate, Route, Routes } from 'react-router-dom';
import PermissionGuard from '@/auth/PermissionGuard';
import ResidentShell from '@/modules/resident/components/ResidentShell';
import DashboardPage from '@/modules/resident/pages/Dashboard';
import VisitorsPage from '@/modules/resident/pages/Visitors';
import InvitePage from '@/modules/resident/pages/Invite';
import HistoryPage from '@/modules/resident/pages/History';
import SosPage from '@/modules/resident/pages/Sos';
import FacilitiesPage from '@/modules/resident/pages/Facilities';
import FacilityDetailPage from '@/modules/resident/pages/FacilityDetail';
import BookingsPage from '@/modules/resident/pages/Bookings';
import ParkingPage from '@/modules/resident/pages/Parking';
import ClearancePage from '@/modules/resident/pages/Clearance';
import NotificationsPage from '@/modules/resident/pages/Notifications';
import ProfilePage from '@/modules/resident/pages/Profile';

function Screen({ children }) {
  return (
    <PermissionGuard>
      <ResidentShell>{children}</ResidentShell>
    </PermissionGuard>
  );
}

export default function ResidentRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="login" element={<Navigate to="/login" replace />} />
      <Route path="dashboard" element={<Screen><DashboardPage /></Screen>} />
      <Route path="visitors" element={<Screen><VisitorsPage /></Screen>} />
      <Route path="visitor-invitations" element={<Screen><InvitePage /></Screen>} />
      <Route path="visitor-history" element={<Screen><HistoryPage /></Screen>} />
      <Route path="sos" element={<Screen><SosPage /></Screen>} />
      <Route path="facilities" element={<Screen><FacilitiesPage /></Screen>} />
      <Route path="facilities/:id" element={<Screen><FacilityDetailPage /></Screen>} />
      <Route path="bookings" element={<Screen><BookingsPage /></Screen>} />
      <Route path="parking" element={<Screen><ParkingPage /></Screen>} />
      <Route path="vehicles" element={<Navigate to="/resident/parking" replace />} />
      <Route path="visitor-parking" element={<Navigate to="/resident/parking" replace state={{ open: 'visitor' }} />} />
      <Route path="clearance" element={<Screen><ClearancePage /></Screen>} />
      <Route path="notifications" element={<Screen><NotificationsPage /></Screen>} />
      <Route path="flat" element={<Navigate to="/resident/dashboard" replace />} />
      <Route path="profile" element={<Screen><ProfilePage /></Screen>} />
      <Route path="*" element={<Navigate to="/resident/dashboard" replace />} />
    </Routes>
  );
}
