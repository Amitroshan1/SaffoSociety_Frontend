import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingLayout from '@/app/layouts/LandingLayout';
import LandingPage from '@/pages/landing/LandingPage';
import AboutPage from '@/pages/landing/AboutPage';
import FeaturesPage from '@/pages/landing/FeaturesPage';
import PricingPage from '@/pages/landing/PricingPage';
import ContactPage from '@/pages/landing/ContactPage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage';
import RoleGuard from '@/auth/RoleGuard';

/* Lazy: keep Guard CSS out of the landing bundle */
const GuardRoutes = lazy(() =>
  import('@/modules/guard').then((m) => ({ default: m.GuardRoutes })),
);
const ResidentRoutes = lazy(() =>
  import('@/modules/resident').then((m) => ({ default: m.ResidentRoutes })),
);
const AdminRoutes = lazy(() =>
  import('@/modules/admin').then((m) => ({ default: m.AdminRoutes })),
);
const FinanceRoutes = lazy(() =>
  import('@/modules/finance').then((m) => ({ default: m.FinanceRoutes })),
);
const SuperAdminRoutes = lazy(() =>
  import('@/modules/super-admin').then((m) => ({ default: m.SuperAdminRoutes })),
);

function GuardFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#040d1a',
        color: '#94a3b8',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      Loading…
    </div>
  );
}

function PanelGate({ role, children }) {
  return (
    <RoleGuard role={role}>
      <Suspense fallback={<GuardFallback />}>{children}</Suspense>
    </RoleGuard>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingLayout>
            <LandingPage />
          </LandingLayout>
        }
      />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/guard/*" element={<PanelGate role="guard"><GuardRoutes /></PanelGate>} />
      <Route path="/resident/*" element={<PanelGate role="resident"><ResidentRoutes /></PanelGate>} />
      <Route path="/admin/*" element={<PanelGate role="admin"><AdminRoutes /></PanelGate>} />
      <Route path="/finance/*" element={<PanelGate role="finance"><FinanceRoutes /></PanelGate>} />
      <Route path="/super-admin/*" element={<PanelGate role="super_admin"><SuperAdminRoutes /></PanelGate>} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
