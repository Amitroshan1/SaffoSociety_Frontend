import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '@/modules/admin/pages/Dashboard';
import GuardsPage from '@/modules/admin/pages/Guards';
import ResidentsPage from '@/modules/admin/pages/Residents';
import BuildingsPage from '@/modules/admin/pages/Buildings';
import FlatsPage from '@/modules/admin/pages/Flats';
import ComplaintsPage from '@/modules/admin/pages/Complaints';
import NoticesPage from '@/modules/admin/pages/Notices';
import VisitorsPage from '@/modules/admin/pages/Visitors';
import SettingsPage from '@/modules/admin/pages/Settings';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="guards" element={<GuardsPage />} />
      <Route path="residents" element={<ResidentsPage />} />
      <Route path="buildings" element={<BuildingsPage />} />
      <Route path="flats" element={<FlatsPage />} />
      <Route path="complaints" element={<ComplaintsPage />} />
      <Route path="notices" element={<NoticesPage />} />
      <Route path="visitors" element={<VisitorsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
