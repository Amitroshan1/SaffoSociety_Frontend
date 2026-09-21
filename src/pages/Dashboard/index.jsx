

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Bell, LogOut, Shield, Home, Wrench, Users,
  CreditCard, FileText, BarChart3, CheckCircle, Clock,
  AlertCircle, TrendingUp, ArrowUpRight, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ─── Static demo data ─────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Residents', value: '248',   change: '+12 this month',     icon: Users,       color: 'from-violet-500 to-indigo-600', glow: 'rgba(139,92,246,0.3)' },
  { label: 'Dues Collected',  value: '₹4.2L', change: '89% collection rate', icon: CreditCard,  color: 'from-emerald-500 to-green-600', glow: 'rgba(52,211,153,0.3)' },
  { label: 'Open Complaints', value: '23',    change: '-5 from last week',   icon: AlertCircle, color: 'from-amber-500 to-orange-500',  glow: 'rgba(251,191,36,0.3)' },
  { label: 'Active Staff',    value: '18',    change: 'All reporting',       icon: CheckCircle, color: 'from-cyan-500 to-blue-600',     glow: 'rgba(56,189,248,0.3)' },
];

const QUICK_PANELS = [
  { icon: Shield,   label: 'Admin Panel',     desc: 'Manage members & finances',   color: 'from-violet-500 to-indigo-600', glow: 'rgba(139,92,246,0.3)', path: '/admin/dashboard' },
  { icon: Home,     label: 'Resident Portal', desc: 'Bills, complaints & notices', color: 'from-cyan-500 to-blue-600',     glow: 'rgba(56,189,248,0.3)', path: '/resident/dashboard' },
  { icon: Users,    label: 'Guard Gate',      desc: 'Visitors & entry control',    color: 'from-emerald-500 to-green-600', glow: 'rgba(52,211,153,0.3)', path: '/guard/dashboard' },
  { icon: Wrench,   label: 'Finance',         desc: 'Billing, dues & reports',     color: 'from-amber-500 to-orange-500',  glow: 'rgba(251,191,36,0.3)', path: '/finance/dashboard' },
];

const ACTIVITIES = [
  { icon: CreditCard,  text: 'Flat 301 — Sharma paid maintenance dues',      time: '2 mins ago',  color: 'text-emerald-400' },
  { icon: AlertCircle, text: 'Flat 204 — Water leakage complaint raised',     time: '15 mins ago', color: 'text-amber-400' },
  { icon: Users,       text: 'Flat 502 — Visitor entry approved by security', time: '32 mins ago', color: 'text-cyan-400' },
  { icon: FileText,    text: 'Annual AGM notice published to all residents',   time: '1 hr ago',    color: 'text-violet-400' },
  { icon: CheckCircle, text: 'Lift maintenance completed — A Block',           time: '2 hrs ago',   color: 'text-emerald-400' },
];

const NAV_ITEMS = [
  { icon: BarChart3,  label: 'Dashboard', active: true },
  { icon: Users,      label: 'Members' },
  { icon: CreditCard, label: 'Finance' },
  { icon: FileText,   label: 'Notices' },
  { icon: Bell,       label: 'Alerts' },
];

const WING_DATA = [
  { wing: 'A Wing', units: 48, color: 'bg-violet-500',  fill: 92 },
  { wing: 'B Wing', units: 52, color: 'bg-cyan-500',    fill: 78 },
  { wing: 'C Wing', units: 40, color: 'bg-emerald-500', fill: 85 },
  { wing: 'D Wing', units: 60, color: 'bg-amber-500',   fill: 65 },
];

const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BAR_DATA  = [65, 82, 74, 91, 88, 95, 78, 89, 92, 100, 85, 98];

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate             = useNavigate();
  const { user, logout }     = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="auth-bg flex overflow-hidden" style={{ minHeight: '100vh' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        className={`fixed md:relative z-40 flex flex-col glass-card h-full min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 md:w-64'
        } overflow-hidden`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">SMS</div>
            <div className="text-slate-400 text-xs">Management System</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <motion.button key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-violet-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={item.active ? { border: '1px solid rgba(139,92,246,0.2)' } : {}}
              whileHover={{ x: 4 }}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-white text-sm font-medium">{user?.name || 'User'}</div>
              <div className="text-slate-500 text-xs">{user?.email || ''}</div>
            </div>
          </div>
          <motion.button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-all"
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <motion.header
          className="px-6 py-4 glass-card flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-400 hover:text-white">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-white font-black text-xl">Society Dashboard</h1>
              <p className="text-slate-400 text-xs">Welcome back — {today}</p>
            </div>
          </div>

          <motion.button
            className="relative p-2.5 rounded-xl glass-card-light text-slate-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            whileHover={{ scale: 1.05 }}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
          </motion.button>
        </motion.header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label}
                className="glass-card rounded-2xl p-5 group"
                style={{ border: '1px solid rgba(255,255,255,0.05)', boxShadow: `0 4px 20px ${stat.glow}` }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-slate-400 text-xs font-medium mb-1">{stat.label}</div>
                <div className="text-emerald-400 text-xs">{stat.change}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick Panel Access */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Quick Panel Access</h2>
              <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> 4 panels available
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_PANELS.map((panel, i) => (
                <motion.div key={panel.label}
                  className="glass-card rounded-2xl p-5 cursor-pointer group"
                  style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  whileHover={{ y: -5, boxShadow: `0 20px 40px ${panel.glow}` }}
                  onClick={() => navigate(panel.path)}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${panel.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <panel.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white font-bold text-sm mb-1">{panel.label}</div>
                  <div className="text-slate-400 text-xs">{panel.desc}</div>
                  <div className={`mt-3 text-xs font-semibold bg-gradient-to-r ${panel.color} bg-clip-text text-transparent`}>
                    Open Panel →
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Chart + Wing overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Bar chart */}
            <motion.div className="lg:col-span-2 glass-card rounded-2xl p-6"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold">Collection Trend</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Monthly maintenance dues — 2026</p>
                </div>
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex items-end gap-2 h-28">
                {BAR_DATA.map((h, i) => (
                  <motion.div key={i} className="flex-1 rounded-t-lg"
                    style={{ background: 'linear-gradient(to top, rgba(139,92,246,0.8), rgba(167,139,250,0.6))', height: `${h}%` }}
                    initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
                    transition={{ delay: 0.6 + i * 0.04, duration: 0.5 }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-slate-500 text-xs mt-2">
                {MONTHS.map(m => <span key={m}>{m}</span>)}
              </div>
            </motion.div>

            {/* Wing overview */}
            <motion.div className="glass-card rounded-2xl p-6"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <h3 className="text-white font-bold mb-4">Wing Overview</h3>
              <div className="space-y-4">
                {WING_DATA.map(w => (
                  <div key={w.wing}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>{w.wing}</span>
                      <span>{w.units} units · {w.fill}% paid</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div className={`h-full ${w.color} rounded-full`}
                        initial={{ width: 0 }} animate={{ width: `${w.fill}%` }}
                        transition={{ delay: 0.7, duration: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div className="glass-card rounded-2xl p-6"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Recent Activity</h3>
              <button className="text-violet-400 text-xs hover:text-violet-300 transition-colors">View All</button>
            </div>
            <div className="space-y-2">
              {ACTIVITIES.map((activity, i) => (
                <motion.div key={i} className="flex items-start gap-4 p-3 rounded-xl transition-colors"
                  style={{ '--hover-bg': 'rgba(255,255,255,0.03)' }}
                  initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm">{activity.text}</p>
                    <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" /> {activity.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}