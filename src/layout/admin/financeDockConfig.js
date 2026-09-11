import {
  LayoutDashboard,
  IndianRupee,
  FileCheck,
  CreditCard,
  BarChart3,
  FolderOpen,
  CalendarCheck,
  Car,
  Megaphone,
  LogOut,
} from 'lucide-react';

export const FINANCE_DOCK_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Billing',
    items: [
      { id: 'billing', label: 'Billing', icon: IndianRupee },
      { id: 'bills', label: 'Bills', icon: FileCheck },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'receipts', label: 'Receipts', icon: FileCheck },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'More',
    items: [
      { id: 'facility-revenue', label: 'Facility Revenue', icon: CalendarCheck },
      { id: 'parking-revenue', label: 'Parking Revenue', icon: Car },
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'notifications', label: 'Notifications', icon: Megaphone },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
];

export const FINANCE_DOCK_BOTTOM = [
  { id: 'logout', label: 'Sign out', icon: LogOut },
];

export const FINANCE_PALETTE_ITEMS = [
  { id: 'dashboard', label: 'Finance dashboard', module: 'Overview', icon: LayoutDashboard },
  { id: 'billing', label: 'Billing dashboard', module: 'Billing', icon: IndianRupee },
  { id: 'bills', label: 'Bills', module: 'Billing', icon: FileCheck },
  { id: 'payments', label: 'Payments', module: 'Billing', icon: CreditCard },
  { id: 'receipts', label: 'Receipts', module: 'Billing', icon: FileCheck },
  { id: 'reports', label: 'Billing reports', module: 'Billing', icon: BarChart3 },
  { id: 'facility-revenue', label: 'Facility revenue', module: 'Revenue', icon: CalendarCheck },
  { id: 'parking-revenue', label: 'Parking revenue', module: 'Revenue', icon: Car },
  { id: 'documents', label: 'Finance documents', module: 'Documents', icon: FolderOpen },
  { id: 'notifications', label: 'Finance notifications', module: 'Communication', icon: Megaphone },
  { id: 'analytics', label: 'Finance analytics', module: 'Insights', icon: BarChart3 },
];
