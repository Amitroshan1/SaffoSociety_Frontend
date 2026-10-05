import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '@/modules/super-admin/pages/Dashboard';
import SocietiesPage from '@/modules/super-admin/pages/Societies';
import UsersPage from '@/modules/super-admin/pages/Users';
import PlansPage from '@/modules/super-admin/pages/Plans';
import SettingsPage from '@/modules/super-admin/pages/Settings';

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="societies" element={<SocietiesPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="plans" element={<PlansPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
