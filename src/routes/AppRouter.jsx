import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

import Landing from '../pages/landingpage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/Dashboard';

import AdminDashboard from '../pages/admin/Dashboard';
import BuildingsPage from '../pages/admin/Buildings/BuildingsPage';
import BuildingFormPage from '../pages/admin/Buildings/BuildingFormPage';
import WingsPage from '../pages/admin/Wings/WingsPage';
import WingFormPage from '../pages/admin/Wings/WingFormPage';
import FlatsPage from '../pages/admin/Flats/FlatsPage';
import FlatFormPage from '../pages/admin/Flats/FlatFormPage';
import OccupanciesPage from '../pages/admin/Occupancies/OccupanciesPage';
import OccupancyFormPage from '../pages/admin/Occupancies/OccupancyFormPage';
import ResidentsPage from '../pages/admin/Residents/ResidentsPage';
import ResidentFormPage from '../pages/admin/Residents/ResidentFormPage';
import VisitsPage from '../pages/admin/Visits/VisitsPage';
import VisitFormPage from '../pages/admin/Visits/VisitFormPage';
import AdminVisitorsPage from '../pages/admin/Visitors/VisitorsPage';
import VisitorFormPage from '../pages/admin/Visitors/VisitorFormPage';
import StaffPage from '../pages/admin/Staff/StaffPage';
import StaffFormPage from '../pages/admin/Staff/StaffFormPage';
import GatesPage from '../pages/admin/Gates/GatesPage';
import GateFormPage from '../pages/admin/Gates/GateFormPage';
import ShiftsPage from '../pages/admin/Shifts/ShiftsPage';
import ShiftFormPage from '../pages/admin/Shifts/ShiftFormPage';
import GateOpsPage from '../pages/admin/GateOps/GateOpsPage';
import AttendancePage from '../pages/admin/Attendance/AttendancePage';
import ComplaintsPage from '../pages/admin/Complaints/ComplaintsPage';
import NocRequestsPage from '../pages/admin/Noc/NocRequestsPage';
import SecurityPage from '../pages/admin/Security/SecurityPage';
import SocietyPage from '../pages/admin/Society/SocietyPage';
import BillingDashboardPage from '../pages/admin/billing/BillingDashboardPage';
import ChargeHeadsPage from '../pages/admin/billing/ChargeHeadsPage';
import ChargeHeadFormPage from '../pages/admin/billing/ChargeHeadFormPage';
import BillingCyclesPage from '../pages/admin/billing/BillingCyclesPage';
import BillingCycleFormPage from '../pages/admin/billing/BillingCycleFormPage';
import FinancialYearsPage from '../pages/admin/billing/FinancialYearsPage';
import FinancialYearFormPage from '../pages/admin/billing/FinancialYearFormPage';
import LateFeeRulesPage from '../pages/admin/billing/LateFeeRulesPage';
import LateFeeRuleFormPage from '../pages/admin/billing/LateFeeRuleFormPage';
import DiscountRulesPage from '../pages/admin/billing/DiscountRulesPage';
import DiscountRuleFormPage from '../pages/admin/billing/DiscountRuleFormPage';
import BillsPage from '../pages/admin/billing/BillsPage';
import BillDetailPage from '../pages/admin/billing/BillDetailPage';
import BillGeneratePage from '../pages/admin/billing/BillGeneratePage';
import PaymentsPage from '../pages/admin/billing/PaymentsPage';
import PaymentFormPage from '../pages/admin/billing/PaymentFormPage';
import ReceiptsPage from '../pages/admin/billing/ReceiptsPage';
import ReceiptDetailPage from '../pages/admin/billing/ReceiptDetailPage';
import BillingReportsPage from '../pages/admin/billing/BillingReportsPage';
import NoticesDashboardPage from '../pages/admin/notices/NoticesDashboardPage';
import NoticesPage from '../pages/admin/notices/NoticesPage';
import NoticeFormPage from '../pages/admin/notices/NoticeFormPage';
import NoticeDetailPage from '../pages/admin/notices/NoticeDetailPage';
import NoticeReportsPage from '../pages/admin/notices/NoticeReportsPage';
import DocumentsDashboardPage from '../pages/admin/documents/DocumentsDashboardPage';
import DocumentsPage from '../pages/admin/documents/DocumentsPage';
import DocumentFormPage from '../pages/admin/documents/DocumentFormPage';
import DocumentDetailPage from '../pages/admin/documents/DocumentDetailPage';
import DocumentCategoriesPage from '../pages/admin/documents/DocumentCategoriesPage';
import DocumentReportsPage from '../pages/admin/documents/DocumentReportsPage';
import FacilitiesDashboardPage from '../pages/admin/facilities/FacilitiesDashboardPage';
import FacilitiesPage from '../pages/admin/facilities/FacilitiesPage';
import FacilityFormPage from '../pages/admin/facilities/FacilityFormPage';
import FacilityDetailPage from '../pages/admin/facilities/FacilityDetailPage';
import FacilityReportsPage from '../pages/admin/facilities/FacilityReportsPage';
import BookingsPage from '../pages/admin/facilities/BookingsPage';
import BookingDetailPage from '../pages/admin/facilities/BookingDetailPage';
import ParkingDashboardPage from '../pages/admin/parking/ParkingDashboardPage';
import ParkingZonesPage from '../pages/admin/parking/ParkingZonesPage';
import ParkingSlotsPage from '../pages/admin/parking/ParkingSlotsPage';
import VehiclesPage from '../pages/admin/parking/VehiclesPage';
import ParkingAllocationsPage from '../pages/admin/parking/ParkingAllocationsPage';
import VisitorParkingPage from '../pages/admin/parking/VisitorParkingPage';
import ParkingReportsPage from '../pages/admin/parking/ParkingReportsPage';
import NotificationsDashboardPage from '../pages/admin/notifications/NotificationsDashboardPage';
import NotificationTemplatesPage from '../pages/admin/notifications/NotificationTemplatesPage';
import NotificationTemplateFormPage from '../pages/admin/notifications/NotificationTemplateFormPage';
import BroadcastPage from '../pages/admin/notifications/BroadcastPage';
import ScheduledNotificationsPage from '../pages/admin/notifications/ScheduledNotificationsPage';
import ScheduledNotificationFormPage from '../pages/admin/notifications/ScheduledNotificationFormPage';
import DeliveryQueuePage from '../pages/admin/notifications/DeliveryQueuePage';
import NotificationReportsPage from '../pages/admin/notifications/NotificationReportsPage';
import ResidentDashboard from '../pages/resident/Dashboard';
import ResidentProfilePage from '../pages/resident/Profile';
import ResidentHouseholdPage from '../pages/resident/Household';
import ResidentFlatPage from '../pages/resident/Flat';
import ResidentVisitorsPage from '../pages/resident/Visitors';
import ResidentVisitorHistoryPage from '../pages/resident/VisitorHistory';
import ResidentVisitorInvitationsPage from '../pages/resident/VisitorInvitations';
import ResidentNoticesPage from '../pages/resident/Notices';
import ResidentNoticeDetailPage from '../pages/resident/NoticeDetail';
import ResidentPinnedNoticesPage from '../pages/resident/PinnedNotices';
import ResidentUnreadNoticesPage from '../pages/resident/UnreadNotices';
import ResidentNoticeArchivePage from '../pages/resident/NoticeArchive';
import ResidentDocumentsPage from '../pages/resident/Documents';
import ResidentDocumentDetailPage from '../pages/resident/DocumentDetail';
import ResidentNotificationsPage from '../pages/resident/Notifications';
import ResidentNotificationDetailPage from '../pages/resident/NotificationDetail';
import ResidentNotificationPreferencesPage from '../pages/resident/NotificationPreferences';
import ResidentSettingsPage from '../pages/resident/Settings';
import ResidentComplaintsPage from '../pages/resident/Complaints';
import NewComplaintPage from '../pages/resident/NewComplaint';
import ResidentBillsPage from '../pages/resident/Bills';
import ResidentOutstandingPage from '../pages/resident/Outstanding';
import ResidentPaymentsPage from '../pages/resident/ResidentPayments';
import ResidentReceiptsPage from '../pages/resident/ResidentReceipts';
import ResidentFacilitiesPage from '../pages/resident/Facilities';
import ResidentFacilityDetailPage from '../pages/resident/FacilityDetail';
import ResidentMyBookingsPage from '../pages/resident/MyBookings';
import ResidentBookingDetailPage from '../pages/resident/BookingDetail';
import ResidentMyParkingPage from '../pages/resident/MyParking';
import ResidentMyVehiclesPage from '../pages/resident/MyVehicles';
import ResidentVisitorParkingRequestPage from '../pages/resident/VisitorParkingRequest';
import ResidentParkingHistoryPage from '../pages/resident/ParkingHistory';
import ResidentLayout from '../layout/resident/ResidentLayout';
import FinanceDashboard from '../pages/finance/Dashboard';
import FinanceDocumentsPage from '../pages/finance/FinanceDocumentsPage';
import FinanceFacilityRevenuePage from '../pages/finance/FinanceFacilityRevenuePage';
import FinanceParkingRevenuePage from '../pages/finance/FinanceParkingRevenuePage';
import FinanceNotificationsPage from '../pages/finance/FinanceNotificationsPage';

import AnalyticsExecutiveDashboardPage from '../pages/admin/analytics/AnalyticsExecutiveDashboardPage';
import AnalyticsCatalogPage from '../pages/admin/analytics/AnalyticsCatalogPage';
import AnalyticsReportRunnerPage from '../pages/admin/analytics/AnalyticsReportRunnerPage';
import AnalyticsExportsPage from '../pages/admin/analytics/AnalyticsExportsPage';
import AnalyticsSchedulesPage from '../pages/admin/analytics/AnalyticsSchedulesPage';
import AnalyticsSettingsPage from '../pages/admin/analytics/AnalyticsSettingsPage';
import FinanceAnalyticsPage from '../pages/finance/FinanceAnalyticsPage';
import ResidentAnalyticsPage from '../pages/resident/Analytics';
import GuardAnalyticsPage from '../pages/guard/analytics/GuardAnalyticsPage';

import GuardMain from '../pages/guard/GuardMain';
import GuardVisitorsPage from '../pages/guard/visitors/VisitorsPage';
import GuardDeliveryPage from '../pages/guard/delivery/GuardDeliveryPage';
import GuardStaffEntryPage from '../pages/guard/staff-entry/GuardStaffEntryPage';
import GuardCabEntryPage from '../pages/guard/cab-entry/GuardCabEntryPage';
import GuardShiftsPage from '../pages/guard/shifts/ShiftsPage';
import GuardAttendancePage from '../pages/guard/attendance/AttendancePage';
import GuardDocumentsPage from '../pages/guard/documents/GuardDocumentsPage';
import GuardBookingsPage from '../pages/guard/facilities/GuardBookingsPage';
import GuardParkingPage from '../pages/guard/parking/GuardParkingPage';
import GuardNotificationsPage from '../pages/guard/notifications/GuardNotificationsPage';
import GuardProfilePage from '../pages/guard/profile/GuardProfilePage';
import GuardSosPage from '../pages/guard/sos/GuardSosPage';

import SuperAdminLayout from '../layout/superadmin/SuperAdminLayout';
import PlatformDashboardPage from '../pages/superadmin/PlatformDashboardPage';
import TenantsPage from '../pages/superadmin/TenantsPage';
import TenantDetailPage from '../pages/superadmin/TenantDetailPage';
import SubscriptionsPage from '../pages/superadmin/SubscriptionsPage';
import LicensesPage from '../pages/superadmin/LicensesPage';
import FeatureFlagsPage from '../pages/superadmin/FeatureFlagsPage';
import GlobalSettingsPage from '../pages/superadmin/GlobalSettingsPage';
import PlatformUsersPage from '../pages/superadmin/PlatformUsersPage';
import GlobalRolesPage from '../pages/superadmin/GlobalRolesPage';
import AnnouncementsPage from '../pages/superadmin/AnnouncementsPage';
import PlatformAnalyticsPage from '../pages/superadmin/PlatformAnalyticsPage';
import PlatformHealthPage from '../pages/superadmin/PlatformHealthPage';
import BackgroundJobsPage from '../pages/superadmin/BackgroundJobsPage';
import MaintenancePage from '../pages/superadmin/MaintenancePage';
import PlatformAuditPage from '../pages/superadmin/PlatformAuditPage';
import IntegrationProvidersPage from '../pages/superadmin/IntegrationProvidersPage';
import WebhooksPage from '../pages/superadmin/WebhooksPage';
import ApiClientsPage from '../pages/superadmin/ApiClientsPage';
import ProviderHealthPage from '../pages/superadmin/ProviderHealthPage';
import MobileDevicesPage from '../pages/superadmin/MobileDevicesPage';
import PaymentProvidersPage from '../pages/superadmin/PaymentProvidersPage';
import IdentityProvidersPage from '../pages/superadmin/IdentityProvidersPage';
import PushDashboardPage from '../pages/superadmin/PushDashboardPage';
import { PLATFORM_ROLES } from '../constants/superAdminRoutes';

const PrivateRoute = ({ children }) => {
  const { user, isLoading, status } = useAuth();
  if (isLoading || status === 'loading') {
    return (
      <div
        className="auth-bg flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }
  return user && status === 'authenticated' ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isLoading, status } = useAuth();
  // Wait for session restore before rendering login — avoids flicker / race.
  // Do NOT auto-redirect authenticated users away from /login (explicit sign-in form).
  if (isLoading || status === 'loading') {
    return (
      <div
        className="auth-bg flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }
  return children;
};

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Landing />} />

    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />

    <Route path="/forgot-password" element={<ForgotPassword />} />

    <Route
      path="/dashboard"
      element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }
    />

    <Route
      path="/unauthorized"
      element={
        <div
          className="auth-bg flex items-center justify-center p-6"
          style={{ minHeight: '100vh' }}
        >
          <div className="glass-card rounded-2xl p-6 text-center" style={{ maxWidth: 520 }}>
            <h2 className="text-white font-black text-2xl mb-2">Access denied</h2>
            <p className="text-slate-400 text-sm">
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      }
    />

    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/society" element={<SocietyPage />} />
      <Route path="/admin/buildings" element={<BuildingsPage />} />
      <Route path="/admin/buildings/new" element={<BuildingFormPage />} />
      <Route path="/admin/buildings/:id" element={<BuildingFormPage />} />
      <Route path="/admin/wings" element={<WingsPage />} />
      <Route path="/admin/wings/new" element={<WingFormPage />} />
      <Route path="/admin/wings/:id" element={<WingFormPage />} />
      <Route path="/admin/flats" element={<FlatsPage />} />
      <Route path="/admin/flats/new" element={<FlatFormPage />} />
      <Route path="/admin/flats/:id" element={<FlatFormPage />} />
      <Route path="/admin/occupancies" element={<OccupanciesPage />} />
      <Route path="/admin/occupancies/new" element={<OccupancyFormPage />} />
      <Route path="/admin/occupancies/:id" element={<OccupancyFormPage />} />
      <Route path="/admin/residents" element={<ResidentsPage />} />
      <Route path="/admin/residents/new" element={<ResidentFormPage />} />
      <Route path="/admin/residents/:id" element={<ResidentFormPage />} />
      <Route path="/admin/visitors" element={<AdminVisitorsPage />} />
      <Route path="/admin/visitors/new" element={<VisitorFormPage />} />
      <Route path="/admin/visitors/:id" element={<VisitorFormPage />} />
      <Route path="/admin/visits" element={<VisitsPage />} />
      <Route path="/admin/visits/new" element={<VisitFormPage />} />
      <Route path="/admin/visits/:id" element={<VisitFormPage />} />
      <Route path="/admin/staff" element={<StaffPage />} />
      <Route path="/admin/staff/new" element={<StaffFormPage />} />
      <Route path="/admin/staff/:id" element={<StaffFormPage />} />
      <Route path="/admin/gates" element={<GatesPage />} />
      <Route path="/admin/gates/new" element={<GateFormPage />} />
      <Route path="/admin/gates/:id" element={<GateFormPage />} />
      <Route path="/admin/shifts" element={<ShiftsPage />} />
      <Route path="/admin/shifts/new" element={<ShiftFormPage />} />
      <Route path="/admin/shifts/:id" element={<ShiftFormPage />} />
      <Route path="/admin/gate-ops" element={<GateOpsPage />} />
      <Route path="/admin/attendance" element={<AttendancePage />} />
      <Route path="/admin/complaints" element={<ComplaintsPage />} />
      <Route path="/admin/noc" element={<NocRequestsPage />} />
      <Route path="/admin/security" element={<SecurityPage />} />
      <Route path="/admin/billing" element={<BillingDashboardPage />} />
      <Route path="/admin/charge-heads" element={<ChargeHeadsPage />} />
      <Route path="/admin/charge-heads/new" element={<ChargeHeadFormPage />} />
      <Route path="/admin/charge-heads/:id" element={<ChargeHeadFormPage />} />
      <Route path="/admin/billing-cycles" element={<BillingCyclesPage />} />
      <Route path="/admin/billing-cycles/new" element={<BillingCycleFormPage />} />
      <Route path="/admin/billing-cycles/:id" element={<BillingCycleFormPage />} />
      <Route path="/admin/financial-years" element={<FinancialYearsPage />} />
      <Route path="/admin/financial-years/new" element={<FinancialYearFormPage />} />
      <Route path="/admin/financial-years/:id" element={<FinancialYearFormPage />} />
      <Route path="/admin/late-fee-rules" element={<LateFeeRulesPage />} />
      <Route path="/admin/late-fee-rules/new" element={<LateFeeRuleFormPage />} />
      <Route path="/admin/late-fee-rules/:id" element={<LateFeeRuleFormPage />} />
      <Route path="/admin/discount-rules" element={<DiscountRulesPage />} />
      <Route path="/admin/discount-rules/new" element={<DiscountRuleFormPage />} />
      <Route path="/admin/discount-rules/:id" element={<DiscountRuleFormPage />} />
      <Route path="/admin/bills" element={<BillsPage />} />
      <Route path="/admin/bills/generate" element={<BillGeneratePage />} />
      <Route path="/admin/bills/:id" element={<BillDetailPage />} />
      <Route path="/admin/payments" element={<PaymentsPage />} />
      <Route path="/admin/payments/new" element={<PaymentFormPage />} />
      <Route path="/admin/payments/:id" element={<PaymentFormPage />} />
      <Route path="/admin/receipts" element={<ReceiptsPage />} />
      <Route path="/admin/receipts/:id" element={<ReceiptDetailPage />} />
      <Route path="/admin/billing/reports" element={<BillingReportsPage />} />
      <Route path="/admin/notices" element={<NoticesDashboardPage />} />
      <Route path="/admin/notices/list" element={<NoticesPage />} />
      <Route path="/admin/notices/new" element={<NoticeFormPage />} />
      <Route path="/admin/notices/reports" element={<NoticeReportsPage />} />
      <Route path="/admin/notices/:id/edit" element={<NoticeFormPage />} />
      <Route path="/admin/notices/:id" element={<NoticeDetailPage />} />
      <Route path="/admin/documents" element={<DocumentsDashboardPage />} />
      <Route path="/admin/documents/list" element={<DocumentsPage />} />
      <Route path="/admin/documents/new" element={<DocumentFormPage />} />
      <Route path="/admin/documents/categories" element={<DocumentCategoriesPage />} />
      <Route path="/admin/documents/reports" element={<DocumentReportsPage />} />
      <Route path="/admin/documents/:id/edit" element={<DocumentFormPage />} />
      <Route path="/admin/documents/:id" element={<DocumentDetailPage />} />
      <Route path="/admin/facilities" element={<FacilitiesDashboardPage />} />
      <Route path="/admin/facilities/list" element={<FacilitiesPage />} />
      <Route path="/admin/facilities/new" element={<FacilityFormPage />} />
      <Route path="/admin/facilities/reports" element={<FacilityReportsPage />} />
      <Route path="/admin/facilities/:id/edit" element={<FacilityFormPage />} />
      <Route path="/admin/facilities/:id" element={<FacilityDetailPage />} />
      <Route path="/admin/amenities" element={<Navigate to="/admin/facilities" replace />} />
      <Route path="/admin/amenities/list" element={<Navigate to="/admin/facilities/list" replace />} />
      <Route path="/admin/amenities/new" element={<Navigate to="/admin/facilities/new" replace />} />
      <Route path="/admin/amenities/reports" element={<Navigate to="/admin/facilities/reports" replace />} />
      <Route path="/admin/bookings" element={<BookingsPage />} />
      <Route path="/admin/bookings/:id" element={<BookingDetailPage />} />
      <Route path="/admin/parking" element={<ParkingDashboardPage />} />
      <Route path="/admin/parking/zones" element={<ParkingZonesPage />} />
      <Route path="/admin/parking/slots" element={<ParkingSlotsPage />} />
      <Route path="/admin/parking/vehicles" element={<VehiclesPage />} />
      <Route path="/admin/parking/allocations" element={<ParkingAllocationsPage />} />
      <Route path="/admin/parking/visitor" element={<VisitorParkingPage />} />
      <Route path="/admin/parking/reports" element={<ParkingReportsPage />} />
      <Route path="/admin/notifications" element={<NotificationsDashboardPage />} />
      <Route path="/admin/notifications/templates" element={<NotificationTemplatesPage />} />
      <Route path="/admin/notifications/templates/new" element={<NotificationTemplateFormPage />} />
      <Route path="/admin/notifications/templates/:id" element={<NotificationTemplateFormPage />} />
      <Route path="/admin/notifications/broadcast" element={<BroadcastPage />} />
      <Route path="/admin/notifications/scheduled" element={<ScheduledNotificationsPage />} />
      <Route path="/admin/notifications/scheduled/new" element={<ScheduledNotificationFormPage />} />
      <Route path="/admin/notifications/deliveries" element={<DeliveryQueuePage />} />
      <Route path="/admin/notifications/reports" element={<NotificationReportsPage />} />
      <Route path="/admin/analytics" element={<AnalyticsExecutiveDashboardPage />} />
      <Route path="/admin/analytics/catalog" element={<AnalyticsCatalogPage />} />
      <Route path="/admin/analytics/exports" element={<AnalyticsExportsPage />} />
      <Route path="/admin/analytics/schedules" element={<AnalyticsSchedulesPage />} />
      <Route path="/admin/analytics/settings" element={<AnalyticsSettingsPage />} />
      <Route path="/admin/analytics/reports/:reportKey" element={<AnalyticsReportRunnerPage />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['resident']} />}>
      <Route element={<ResidentLayout />}>
        <Route path="/resident/dashboard" element={<ResidentDashboard />} />
        <Route path="/resident/profile" element={<ResidentProfilePage />} />
        <Route path="/resident/household" element={<ResidentHouseholdPage />} />
        <Route path="/resident/flat" element={<ResidentFlatPage />} />
        <Route path="/resident/visitors" element={<ResidentVisitorsPage />} />
        <Route path="/resident/visitor-history" element={<ResidentVisitorHistoryPage />} />
        <Route path="/resident/visitor-invitations" element={<ResidentVisitorInvitationsPage />} />
        <Route path="/resident/notices" element={<ResidentNoticesPage />} />
        <Route path="/resident/notices/pinned" element={<ResidentPinnedNoticesPage />} />
        <Route path="/resident/notices/unread" element={<ResidentUnreadNoticesPage />} />
        <Route path="/resident/notices/archive" element={<ResidentNoticeArchivePage />} />
        <Route path="/resident/notices/:id" element={<ResidentNoticeDetailPage />} />
        <Route path="/resident/documents" element={<ResidentDocumentsPage />} />
        <Route path="/resident/documents/:id" element={<ResidentDocumentDetailPage />} />
        <Route path="/resident/notifications" element={<ResidentNotificationsPage />} />
        <Route path="/resident/notifications/:id" element={<ResidentNotificationDetailPage />} />
        <Route path="/resident/notification-preferences" element={<ResidentNotificationPreferencesPage />} />
        <Route path="/resident/complaints" element={<ResidentComplaintsPage />} />
        <Route path="/resident/complaints/new" element={<NewComplaintPage />} />
        <Route path="/resident/bills" element={<ResidentBillsPage />} />
        <Route path="/resident/outstanding" element={<ResidentOutstandingPage />} />
        <Route path="/resident/payments" element={<ResidentPaymentsPage />} />
        <Route path="/resident/receipts" element={<ResidentReceiptsPage />} />
        <Route path="/resident/facilities" element={<ResidentFacilitiesPage />} />
        <Route path="/resident/facilities/:id" element={<ResidentFacilityDetailPage />} />
        <Route path="/resident/amenities" element={<Navigate to="/resident/facilities" replace />} />
        <Route path="/resident/amenities/:id" element={<Navigate to="/resident/facilities" replace />} />
        <Route path="/resident/bookings" element={<ResidentMyBookingsPage />} />
        <Route path="/resident/bookings/:id" element={<ResidentBookingDetailPage />} />
        <Route path="/resident/parking" element={<ResidentMyParkingPage />} />
        <Route path="/resident/vehicles" element={<ResidentMyVehiclesPage />} />
        <Route path="/resident/visitor-parking" element={<ResidentVisitorParkingRequestPage />} />
        <Route path="/resident/parking-history" element={<ResidentParkingHistoryPage />} />
        <Route path="/resident/analytics" element={<ResidentAnalyticsPage />} />
        <Route path="/resident/settings" element={<ResidentSettingsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['finance']} />}>
      <Route path="/finance/dashboard" element={<FinanceDashboard />} />
      <Route path="/finance/billing" element={<BillingDashboardPage basePath="/finance" />} />
      <Route path="/finance/bills" element={<BillsPage basePath="/finance" />} />
      <Route path="/finance/bills/:id" element={<BillDetailPage basePath="/finance" />} />
      <Route path="/finance/payments" element={<PaymentsPage basePath="/finance" />} />
      <Route path="/finance/payments/new" element={<PaymentFormPage basePath="/finance" />} />
      <Route path="/finance/payments/:id" element={<PaymentFormPage basePath="/finance" />} />
      <Route path="/finance/receipts" element={<ReceiptsPage basePath="/finance" />} />
      <Route path="/finance/receipts/:id" element={<ReceiptDetailPage basePath="/finance" />} />
      <Route path="/finance/reports" element={<BillingReportsPage basePath="/finance" />} />
      <Route path="/finance/documents" element={<FinanceDocumentsPage />} />
      <Route path="/finance/facility-revenue" element={<FinanceFacilityRevenuePage />} />
      <Route path="/finance/amenity-revenue" element={<Navigate to="/finance/facility-revenue" replace />} />
      <Route path="/finance/parking-revenue" element={<FinanceParkingRevenuePage />} />
      <Route path="/finance/notifications" element={<FinanceNotificationsPage />} />
      <Route path="/finance/analytics" element={<FinanceAnalyticsPage />} />
      <Route path="/finance/analytics/exports" element={<AnalyticsExportsPage basePath="/finance" />} />
      <Route path="/finance/analytics/schedules" element={<AnalyticsSchedulesPage basePath="/finance" />} />
      <Route
        path="/finance/analytics/reports/:reportKey"
        element={<AnalyticsReportRunnerPage basePath="/finance" />}
      />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['guard']} />}>
      <Route path="/guard/dashboard" element={<GuardMain />} />
      <Route path="/guard/visitors" element={<GuardVisitorsPage />} />
      <Route path="/guard/delivery" element={<GuardDeliveryPage />} />
      <Route path="/guard/staff-entry" element={<GuardStaffEntryPage />} />
      <Route path="/guard/cab-entry" element={<GuardCabEntryPage />} />
      <Route path="/guard/shifts" element={<GuardShiftsPage />} />
      <Route path="/guard/attendance" element={<GuardAttendancePage />} />
      <Route path="/guard/documents" element={<GuardDocumentsPage />} />
      <Route path="/guard/bookings" element={<GuardBookingsPage />} />
      <Route path="/guard/parking" element={<GuardParkingPage />} />
      <Route path="/guard/notifications" element={<GuardNotificationsPage />} />
      <Route path="/guard/analytics" element={<GuardAnalyticsPage />} />
      <Route path="/guard/profile" element={<GuardProfilePage />} />
      <Route path="/guard/sos" element={<GuardSosPage />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={PLATFORM_ROLES} />}>
      <Route path="/superadmin" element={<SuperAdminLayout />}>
        <Route path="dashboard" element={<PlatformDashboardPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="feature-flags" element={<FeatureFlagsPage />} />
        <Route path="settings" element={<GlobalSettingsPage />} />
        <Route path="users" element={<PlatformUsersPage />} />
        <Route path="roles" element={<GlobalRolesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="analytics" element={<PlatformAnalyticsPage />} />
        <Route path="health" element={<PlatformHealthPage />} />
        <Route path="jobs" element={<BackgroundJobsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="audit" element={<PlatformAuditPage />} />
        <Route path="integrations" element={<IntegrationProvidersPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="api-clients" element={<ApiClientsPage />} />
        <Route path="provider-health" element={<ProviderHealthPage />} />
        <Route path="mobile-devices" element={<MobileDevicesPage />} />
        <Route path="payment-providers" element={<PaymentProvidersPage />} />
        <Route path="identity-providers" element={<IdentityProvidersPage />} />
        <Route path="push-dashboard" element={<PushDashboardPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
