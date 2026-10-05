import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import Visitors from '@/modules/guard/components/visitor/Visitors';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/visitor/visitor.css';

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
    <div className="gm-root" data-theme="light">
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
