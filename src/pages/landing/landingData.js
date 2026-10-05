import {
  Building2,
  DoorOpen,
  FolderOpen,
  Home,
  LockKeyhole,
  Megaphone,
  Receipt,
  Shield,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 8 + Math.random() * 10,
  size: 2 + Math.random() * 3.5,
}));

export const PROBLEMS = [
  'Manual record keeping',
  'Visitor management through registers',
  'Scattered maintenance complaints',
  'Difficult payment and dues tracking',
  'Poor communication between residents and management',
  'Separate processes for security and finance',
];

export const FEATURES = [
  {
    icon: Users,
    label: 'Resident Management',
    desc: 'Maintain resident and unit records in one place.',
  },
  {
    icon: DoorOpen,
    label: 'Visitor & Gate Management',
    desc: 'Record visitor entries, vehicles, and gate activity.',
  },
  {
    icon: Wrench,
    label: 'Maintenance & Complaints',
    desc: 'Keep maintenance requests and complaints together.',
  },
  {
    icon: Megaphone,
    label: 'Society Notices & Announcements',
    desc: 'Share notices with the people who need them.',
  },
  {
    icon: Receipt,
    label: 'Billing & Payment Tracking',
    desc: 'Follow dues and payment status without separate sheets.',
  },
  {
    icon: Wallet,
    label: 'Expense & Financial Management',
    desc: 'Record society expenses alongside billing.',
  },
  {
    icon: LockKeyhole,
    label: 'Role-Based Access',
    desc: 'Give each role the access that matches their work.',
  },
  {
    icon: FolderOpen,
    label: 'Reports & Records',
    desc: 'Keep operational and financial records with the right people.',
  },
];

export const PANELS = [
  {
    id: 'admin',
    icon: Building2,
    kicker: 'Admin',
    title: 'Manage the entire society',
    desc: 'Manage residents, complaints, notices, finances and society operations from one place.',
    accent: '#6d28d9',
    tile: '#f5f3ff',
  },
  {
    id: 'resident',
    icon: Home,
    kicker: 'Resident',
    title: 'Everything residents need',
    desc: 'View dues, raise complaints, receive notices and stay connected with society updates.',
    accent: '#4338ca',
    tile: '#eef2ff',
  },
  {
    id: 'guard',
    icon: Shield,
    kicker: 'Guard',
    title: 'Secure the society gate',
    desc: 'Manage visitor entries, vehicle records, alerts and gate activity.',
    accent: '#0f766e',
    tile: '#f0fdfa',
  },
  {
    id: 'finance',
    icon: Wallet,
    kicker: 'Finance',
    title: 'Manage billing and accounts',
    desc: 'Track dues, expenses, billing and financial records.',
    accent: '#0369a1',
    tile: '#f0f9ff',
  },
];

export const STEPS = [
  {
    n: '01',
    title: 'Connect your society',
    desc: 'Set up your society and define roles.',
  },
  {
    n: '02',
    title: 'Manage everything in one place',
    desc: 'Handle residents, visitors, complaints, notices and finances.',
  },
  {
    n: '03',
    title: 'Keep everyone connected',
    desc: 'Residents, guards, administrators and finance teams work through their dedicated experiences.',
  },
];

export const ROLES = [
  {
    icon: Building2,
    title: 'Administrators',
    desc: 'A working view of society operations, from residents and complaints to notices.',
  },
  {
    icon: Home,
    title: 'Residents',
    desc: 'A direct place to follow dues, raise complaints, and read society updates.',
  },
  {
    icon: Shield,
    title: 'Security Guards',
    desc: 'A gate-focused view for visitor entries, vehicles, and alerts.',
  },
  {
    icon: Wallet,
    title: 'Finance Teams',
    desc: 'A view centered on dues, expenses, billing, and financial records.',
  },
];

export const ACCESS_POINTS = [
  {
    title: 'Role-based access',
    desc: 'Admin, resident, guard, and finance are separate experiences.',
  },
  {
    title: 'Protected application areas',
    desc: 'Working panels sit apart from this public site.',
  },
  {
    title: 'Controlled permissions',
    desc: 'Each role is limited to the work it is responsible for.',
  },
  {
    title: 'Secure authentication',
    desc: 'Sign-in is the intended way into those areas.',
  },
];

export const BENEFITS = [
  {
    title: 'Faster day-to-day operations',
    desc: 'Routine society work has one place to live.',
  },
  {
    title: 'Better communication',
    desc: 'Notices and updates can reach the people they are for.',
  },
  {
    title: 'Centralized records',
    desc: 'Resident, gate, and finance information shares a home.',
  },
  {
    title: 'Easier visitor management',
    desc: 'Gate entries can be recorded in the system, not only on paper.',
  },
  {
    title: 'Better financial visibility',
    desc: 'Dues and expenses can be followed together.',
  },
  {
    title: 'Clear responsibility by role',
    desc: 'Each person works from the experience that matches their role.',
  },
];

export const TEAM = [
  { name: 'Amaresh ', role: 'Full Stack Developer', initials: 'AM' },
  { name: 'Shubham ', role: 'Backend Engineer', initials: 'SS' },
  { name: 'Nilesh ', role: 'Backend Developer', initials: 'NG' },
];
