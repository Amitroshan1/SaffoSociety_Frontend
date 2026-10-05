import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/app/routes';
import AuthProvider from '@/app/providers/AuthProvider';
import TenantProvider from '@/app/providers/TenantProvider';
import ThemeProvider from '@/app/providers/ThemeProvider';
import '@/styles/globals.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
