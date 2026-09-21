import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import '@/styles/guard/visitor/visitors.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import Visitors from '@/components/guard/visitor/Visitors';

export default function VisitorsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Visitors | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Visitors" onNavigate={handleSidebarNav} />

      <div className="gm-content">
        <DashboardHeader />

        <main className="gm-main">
          <Visitors onNavigateBack={() => navigate('/guard/dashboard')} />
        </main>
      </div>
    </div>
  );
}
