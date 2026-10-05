import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '@/modules/finance/pages/Dashboard';
import PaymentsPage from '@/modules/finance/pages/Payments';
import MaintenancePage from '@/modules/finance/pages/Maintenance';
import ExpensesPage from '@/modules/finance/pages/Expenses';
import InvoicesPage from '@/modules/finance/pages/Invoices';
import ReportsPage from '@/modules/finance/pages/Reports';
import TransactionsPage from '@/modules/finance/pages/Transactions';

export default function FinanceRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="maintenance" element={<MaintenancePage />} />
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="transactions" element={<TransactionsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
