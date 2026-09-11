import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Wrench,
  BarChart3,
  Shield,
  Home,
  ChevronRight,
  Star,
  ArrowRight,
  Sparkles,
  Bell,
  FileText,
  CreditCard,
  Lock,
  CheckCircle,
  Globe,
  Zap,
  Heart,
  Code2,
  Target,
} from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 8 + Math.random() * 10,
  size: 2 + Math.random() * 4,
}));

const FEATURES = [
  {
    icon: Bell,
    label: "Smart Notifications",
    desc: "Instant alerts for all society activities",
  },
  {
    icon: CreditCard,
    label: "Payment Tracking",
    desc: "Seamless maintenance fee management",
  },
  {
    icon: FileText,
    label: "Document Hub",
    desc: "Centralized notice & meeting minutes",
  },
  {
    icon: Zap,
    label: "Real-time Updates",
    desc: "Live dashboards for every stakeholder",
  },
  {
    icon: Shield,
    label: "Secure Access",
    desc: "Role-based permissions for every panel",
  },
  {
    icon: Globe,
    label: "Multi-Panel System",
    desc: "Dedicated portals for all user types",
  },
];

const PANELS = [
  {
    id: "admin",
    icon: Shield,
    title: "Admin Panel",
    subtitle: "Full Control",
    desc: "Oversee every aspect of society operations — members, finances, documents, and announcements.",
    gradient: "from-violet-600 via-purple-600 to-indigo-600",
    glow: "rgba(139, 92, 246, 0.4)",
    features: [
      "Member Management",
      "Financial Reports",
      "Access Control",
      "Announcements",
    ],
    badge: "Admin",
  },
  {
    id: "resident",
    icon: Home,
    title: "Resident Panel",
    subtitle: "Your Home Hub",
    desc: "Pay dues, raise complaints, track maintenance requests, and stay updated with all society announcements.",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    glow: "rgba(56, 189, 248, 0.4)",
    features: ["Bill Payments", "Complaints", "Notices", "Visitor Logs"],
    badge: "Resident",
  },
  {
    id: "guard",
    icon: Users,
    title: "Guard Panel",
    subtitle: "Gate Control",
    desc: "Manage visitor entries, track vehicle logs, send alerts, and maintain complete safety records.",
    gradient: "from-emerald-500 via-teal-500 to-green-600",
    glow: "rgba(52, 211, 153, 0.4)",
    features: [
      "Visitor Logs",
      "Vehicle Tracking",
      "Entry/Exit",
      "Emergency Alerts",
    ],
    badge: "Security",
  },
  {
    id: "finance",
    icon: Wrench,
    title: "Finance Panel",
    subtitle: "Billing & Accounts",
    desc: "Track dues, manage expenses, generate financial reports, and oversee all billing operations.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    glow: "rgba(251, 191, 36, 0.4)",
    features: ["Billing", "Expense Tracking", "Reports", "Dues Management"],
    badge: "Finance",
  },
];

const STATS = [
  { value: "4", label: "Dedicated Panels", icon: BarChart3 },
  { value: "100%", label: "Secure & Encrypted", icon: Lock },
  { value: "24/7", label: "System Uptime", icon: CheckCircle },
  { value: "Smart", label: "Automated Workflows", icon: Sparkles },
];

const TEAM = [
  {
    name: "Amaresh Maurya",
    role: "Full Stack Developer",
    initials: "AM",
    color: "from-violet-500 to-indigo-600",
  },
  {
    name: "Shubham Sir",
    role: "Backend Engineer",
    initials: "SS",
    color: "from-cyan-500 to-blue-600",
  },
  {
    name: "Nilesh Gupta",
    role: "Backend Developer",
    initials: "NG",
    color: "bg-gradient-to-r from-yellow-200 to-orange-200",
  },
];

const ABOUT_VALUES = [
  {
    icon: Heart,
    title: "Community First",
    desc: "Built with real residents and admins in mind — every feature solves a real pain point.",
  },
  {
    icon: Code2,
    title: "Modern Technology",
    desc: "Powered by a robust React frontend and secure REST APIs with JWT authentication.",
  },
  {
    icon: Target,
    title: "Mission Driven",
    desc: "Our goal is to eliminate paperwork and manual coordination from every residential society.",
  },
];

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background:
              p.id % 3 === 0
                ? "rgba(139,92,246,0.6)"
                : p.id % 3 === 1
                  ? "rgba(56,189,248,0.6)"
                  : "rgba(52,211,153,0.6)",
          }}
          animate={{
            y: [0, -1000],
            x: [0, (Math.random() - 0.5) * 200],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FloatingOrb({ size, color, top, left, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(40px)",
      }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{
        duration: 6 + delay,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);

  const featuresRef = useRef(null);
  const panelsRef = useRef(null);
  const aboutRef = useRef(null);

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="auth-bg relative" style={{ minHeight: "100vh" }}>
      <div className="absolute inset-0 pointer-events-none grid-overlay" />
      <ParticleField />
      <FloatingOrb
        size={600}
        color="rgba(139,92,246,0.15)"
        top="-10%"
        left="-10%"
        delay={0}
      />
      <FloatingOrb
        size={500}
        color="rgba(56,189,248,0.10)"
        top="30%"
        left="60%"
        delay={2}
      />
      <FloatingOrb
        size={400}
        color="rgba(52,211,153,0.08)"
        top="70%"
        left="10%"
        delay={4}
      />

      {/* ── Navbar ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-card"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Saffo Society"
            className="w-9 h-9 rounded-full object-cover shadow-lg"
          />
          <div>
            <span className="text-white font-bold text-lg leading-none tracking-tight">
              Saffo Society
            </span>
            <p className="text-slate-400 text-xs">A Better Living Together</p>
          </div>
        </div>

        {/* Nav links — each scrolls to its section */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", ref: featuresRef },
            { label: "Panels", ref: panelsRef },
            { label: "About", ref: aboutRef },
          ].map(({ label, ref }) => (
            <button
              key={label}
              onClick={() => scrollTo(ref)}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="nav" />
          <motion.button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
          <motion.button
            onClick={() => navigate("/register")}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 shadow-lg"
            style={{ boxShadow: "0 4px 15px rgba(139,92,246,0.35)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-light text-violet-300 text-sm font-medium mb-8"
            style={{ border: "1px solid rgba(139,92,246,0.2)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4" /> Next-Generation Saffo Society
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Manage Your
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #a78bfa, #38bdf8, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Society Smarter
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            A powerful, all-in-one platform with dedicated panels for Admins,
            Residents, Security, and Finance — bringing harmony to residential
            living.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => navigate("/login")}
              className="group flex items-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600"
              style={{ boxShadow: "0 10px 40px rgba(139,92,246,0.4)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              onClick={() => scrollTo(panelsRef)}
              className="flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 rounded-2xl glass-card-light hover:text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Panels <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass-card rounded-2xl p-4 flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <stat.icon className="w-5 h-5 text-violet-400 mb-2" />
                <div
                  className="text-2xl font-black"
                  style={{
                    background: "linear-gradient(135deg,#a78bfa,#38bdf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 text-center mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        ref={featuresRef}
        className="relative py-20 px-6"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-cyan-400 text-sm font-medium mb-4"
              style={{
                background: "rgba(56,189,248,0.1)",
                border: "1px solid rgba(56,189,248,0.2)",
              }}
            >
              <Star className="w-3.5 h-3.5" /> Core Features
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Powerful tools designed for modern residential communities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.label}
                className="glass-card rounded-2xl p-6 group"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                  {feature.label}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Panels ── */}
      <section
        ref={panelsRef}
        className="relative py-20 px-6"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium mb-4"
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <Building2 className="w-3.5 h-3.5" /> 4 Dedicated Panels
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Every Role,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Perfectly Served
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PANELS.map((panel, i) => (
              <motion.div
                key={panel.id}
                className="glass-card rounded-3xl overflow-hidden cursor-pointer"
                style={{
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow:
                    activePanel === panel.id
                      ? `0 25px 50px ${panel.glow}, 0 0 0 1px rgba(255,255,255,0.1)`
                      : "none",
                }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onHoverStart={() => setActivePanel(panel.id)}
                onHoverEnd={() => setActivePanel(null)}
                onClick={() => navigate(`/login?panel=${panel.id}`)}
              >
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${panel.gradient}`}
                />
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-linear-to-br ${panel.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <panel.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-xl">
                          {panel.title}
                        </h3>
                        <span className="text-sm text-slate-400">
                          {panel.subtitle}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r ${panel.gradient} text-white`}
                    >
                      {panel.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {panel.desc}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {panel.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 text-slate-300 text-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{" "}
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-violet-400 text-sm font-semibold">
                    Access {panel.title} <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative pt-12 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass-card rounded-3xl p-12 text-center relative overflow-hidden mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))",
              }}
            />
            <div className="relative z-10">
              <img
                src="/logo.png"
                alt="Saffo Society"
                className="w-16 h-16 rounded-full object-cover mb-6 mx-auto shadow-xl"
              />
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Ready to Transform Your
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg,#a78bfa,#38bdf8,#34d399)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Saffo Society?
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Join residential communities already using this system.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => navigate("/register")}
                  className="group flex items-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-xl w-full sm:w-auto justify-center"
                  style={{ boxShadow: "0 10px 40px rgba(139,92,246,0.4)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Free Account{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 text-base font-medium text-white rounded-2xl glass-card-light w-full sm:w-auto"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer with About ── */}
      <footer
        ref={aboutRef}
        className="relative pt-6 pb-8 px-4 md:px-10 mt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-5xl mx-auto mt-8">
          {/* About content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* Brand + mission */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="Saffo Society"
                  className="w-9 h-9 rounded-full object-cover shadow-lg"
                />
                <div>
                  <span className="text-white font-bold text-base leading-none">
                    Saffo Society
                  </span>
                  <p className="text-slate-500 text-xs">A Better Living Together</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Built to eliminate paperwork and bring harmony to residential
                communities through smart, role-based management.
              </p>
            </div>

            {/* Values */}
            <div className="md:col-span-1">
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
                Our Values
              </h4>
              <ul className="space-y-3">
                {ABOUT_VALUES.map((val) => (
                  <li key={val.title} className="flex items-start gap-2">
                    <val.icon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-300 text-sm font-medium">
                        {val.title}
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {val.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Team */}
            <div className="md:col-span-1">
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
                Team
              </h4>
              <ul className="space-y-3">
                {TEAM.map((member) => (
                  <li key={member.name} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-linear-to-br ${member.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium">
                        {member.name}
                      </p>
                      <p className="text-slate-500 text-xs">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="md:col-span-1">
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {[
                  { label: "Features", action: () => scrollTo(featuresRef) },
                  { label: "Panels", action: () => scrollTo(panelsRef) },
                  { label: "Sign In", action: () => navigate("/login") },
                  { label: "Register", action: () => navigate("/register") },
                  { label: "Privacy Policy", action: () => {} },
                  { label: "Terms of Service", action: () => {} },
                  { label: "Support", action: () => {} },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8 mt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-slate-500 text-sm">
              Saffo Society &copy; 2026. All rights reserved.
            </span>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>
                Made with care for residential communities bySaffoTech
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// import { useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import {
//   Building2, Users, Wrench, BarChart3, Shield, Home, ChevronRight,
//   Star, ArrowRight, Sparkles, Bell, FileText, CreditCard, Lock,
//   CheckCircle, Globe, Zap
// } from 'lucide-react';

// const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
//   id: i, x: Math.random() * 100,
//   delay: Math.random() * 8,
//   duration: 8 + Math.random() * 10,
//   size: 2 + Math.random() * 4,
// }));

// const FEATURES = [
//   { icon: Bell,       label: 'Smart Notifications', desc: 'Instant alerts for all society activities' },
//   { icon: CreditCard, label: 'Payment Tracking',    desc: 'Seamless maintenance fee management' },
//   { icon: FileText,   label: 'Document Hub',        desc: 'Centralized notice & meeting minutes' },
//   { icon: Zap,        label: 'Real-time Updates',   desc: 'Live dashboards for every stakeholder' },
//   { icon: Shield,     label: 'Secure Access',       desc: 'Role-based permissions for every panel' },
//   { icon: Globe,      label: 'Multi-Panel System',  desc: 'Dedicated portals for all user types' },
// ];

// const PANELS = [
//   {
//     id: 'admin', icon: Shield, title: 'Admin Panel', subtitle: 'Full Control',
//     desc: 'Oversee every aspect of society operations — members, finances, documents, and announcements.',
//     gradient: 'from-violet-600 via-purple-600 to-indigo-600', glow: 'rgba(139, 92, 246, 0.4)',
//     features: ['Member Management', 'Financial Reports', 'Access Control', 'Announcements'], badge: ' Admin',
//   },
//   {
//     id: 'resident', icon: Home, title: 'Resident Panel', subtitle: 'Your Home Hub',
//     desc: 'Pay dues, raise complaints, track maintenance requests, and stay updated with all society announcements.',
//     gradient: 'from-cyan-500 via-sky-500 to-blue-600', glow: 'rgba(56, 189, 248, 0.4)',
//     features: ['Bill Payments', 'Complaints', 'Notices', 'Visitor Logs'], badge: 'Resident',
//   },
//   {
//     id: 'guard', icon: Users, title: 'Guard Panel', subtitle: 'Gate Control',
//     desc: 'Manage visitor entries, track vehicle logs, send alerts, and maintain complete safety records.',
//     gradient: 'from-emerald-500 via-teal-500 to-green-600', glow: 'rgba(52, 211, 153, 0.4)',
//     features: ['Visitor Logs', 'Vehicle Tracking', 'Entry/Exit', 'Emergency Alerts'], badge: 'Security',
//   },
//   {
//     id: 'finance', icon: Wrench, title: 'Finance Panel', subtitle: 'Billing & Accounts',
//     desc: 'Track dues, manage expenses, generate financial reports, and oversee all billing operations.',
//     gradient: 'from-amber-500 via-orange-500 to-rose-500', glow: 'rgba(251, 191, 36, 0.4)',
//     features: ['Billing', 'Expense Tracking', 'Reports', 'Dues Management'], badge: 'Finance',
//   },
// ];

// const STATS = [
//   { value: '4',     label: 'Dedicated Panels',    icon: BarChart3 },
//   { value: '100%',  label: 'Secure & Encrypted',  icon: Lock },
//   { value: '24/7',  label: 'System Uptime',       icon: CheckCircle },
//   { value: 'Smart', label: 'Automated Workflows', icon: Sparkles },
// ];

// function ParticleField() {
//   return (
//     <div className="absolute inset-0 overflow-hidden pointer-events-none">
//       {PARTICLES.map(p => (
//         <motion.div key={p.id} className="absolute rounded-full"
//           style={{
//             left: `${p.x}%`, bottom: '-10px',
//             width: `${p.size}px`, height: `${p.size}px`,
//             background: p.id % 3 === 0 ? 'rgba(139,92,246,0.6)' : p.id % 3 === 1 ? 'rgba(56,189,248,0.6)' : 'rgba(52,211,153,0.6)',
//           }}
//           animate={{ y: [0, -1000], x: [0, (Math.random() - 0.5) * 200], opacity: [0, 0.8, 0.8, 0], scale: [0, 1, 1, 0] }}
//           transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
//         />
//       ))}
//     </div>
//   );
// }

// function FloatingOrb({ size, color, top, left, delay }) {
//   return (
//     <motion.div className="absolute rounded-full pointer-events-none"
//       style={{ width: size, height: size, top, left, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: 'blur(40px)' }}
//       animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
//       transition={{ duration: 6 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
//     />
//   );
// }

// export default function Landing() {
//   const navigate    = useNavigate();
//   const [activePanel, setActivePanel] = useState(null);
//   const panelRef    = useRef(null);

//   const scrollToPanels = () => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

//   return (
//     <div className="auth-bg relative" style={{ minHeight: '100vh' }}>
//       <div className="absolute inset-0 pointer-events-none grid-overlay" />
//       <ParticleField />
//       <FloatingOrb size={600} color="rgba(139,92,246,0.15)"  top="-10%" left="-10%" delay={0} />
//       <FloatingOrb size={500} color="rgba(56,189,248,0.10)"  top="30%"  left="60%"  delay={2} />
//       <FloatingOrb size={400} color="rgba(52,211,153,0.08)"  top="70%"  left="10%"  delay={4} />

//       {/* Navbar */}
//       <motion.nav
//         className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-card"
//         style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
//         initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
//       >
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
//             <Building2 className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <span className="text-white font-bold text-lg leading-none tracking-tight">SMS</span>
//             <p className="text-slate-400 text-xs">Society Management</p>
//           </div>
//         </div>

//         <div className="hidden md:flex items-center gap-8">
//           {['Features', 'Panels', 'About'].map(item => (
//             <button key={item} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">{item}</button>
//           ))}
//         </div>

//         <div className="flex items-center gap-3">
//           <motion.button onClick={() => navigate('/login')}
//             className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
//             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//             Sign In
//           </motion.button>
//           <motion.button onClick={() => navigate('/register')}
//             className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg"
//             style={{ boxShadow: '0 4px 15px rgba(139,92,246,0.35)' }}
//             whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
//             Get Started
//           </motion.button>
//         </div>
//       </motion.nav>

//       {/* Hero */}
//       <section className="relative pt-36 pb-20 px-6 overflow-hidden">
//         <div className="max-w-6xl mx-auto text-center">
//           <motion.div
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-light text-violet-300 text-sm font-medium mb-8"
//             style={{ border: '1px solid rgba(139,92,246,0.2)' }}
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
//           >
//             <Sparkles className="w-4 h-4" /> Next-Generation Society Management
//           </motion.div>

//           <motion.h1
//             className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6"
//             initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
//           >
//             Manage Your<br />
//             <span style={{ background: 'linear-gradient(135deg, #a78bfa, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//               Society Smarter
//             </span>
//           </motion.h1>

//           <motion.p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
//             A powerful, all-in-one platform with dedicated panels for Admins, Residents, Security,
//             and Finance — bringing harmony to residential living.
//           </motion.p>

//           <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
//             <motion.button onClick={() => navigate('/login')}
//               className="group flex items-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600"
//               style={{ boxShadow: '0 10px 40px rgba(139,92,246,0.4)' }}
//               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
//               Sign In to Dashboard
//               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </motion.button>
//             <motion.button onClick={scrollToPanels}
//               className="flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 rounded-2xl glass-card-light hover:text-white transition-all"
//               style={{ border: '1px solid rgba(255,255,255,0.1)' }}
//               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//               Explore Panels <ChevronRight className="w-5 h-5" />
//             </motion.button>
//           </motion.div>

//           {/* Stats */}
//           <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
//             {STATS.map((stat, i) => (
//               <motion.div key={stat.label} className="glass-card rounded-2xl p-4 flex flex-col items-center"
//                 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//                 transition={{ delay: 0.6 + i * 0.1 }}>
//                 <stat.icon className="w-5 h-5 text-violet-400 mb-2" />
//                 <div className="text-2xl font-black" style={{ background: 'linear-gradient(135deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
//                 <div className="text-xs text-slate-400 text-center mt-1">{stat.label}</div>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="relative py-20 px-6">
//         <div className="max-w-6xl mx-auto">
//           <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
//             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-cyan-400 text-sm font-medium mb-4"
//               style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
//               <Star className="w-3.5 h-3.5" /> Core Features
//             </div>
//             <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Everything You Need</h2>
//             <p className="text-slate-400 text-lg max-w-xl mx-auto">Powerful tools designed for modern residential communities</p>
//           </motion.div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//             {FEATURES.map((feature, i) => (
//               <motion.div key={feature.label} className="glass-card rounded-2xl p-6 group"
//                 style={{ border: '1px solid rgba(255,255,255,0.05)' }}
//                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -5 }}>
//                 <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
//                   style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.2)' }}>
//                   <feature.icon className="w-6 h-6 text-violet-400" />
//                 </div>
//                 <h3 className="text-white font-bold text-lg mb-2">{feature.label}</h3>
//                 <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Panels */}
//       <section ref={panelRef} className="relative py-20 px-6">
//         <div className="max-w-7xl mx-auto">
//           <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
//             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium mb-4"
//               style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
//               <Building2 className="w-3.5 h-3.5" /> 4 Dedicated Panels
//             </div>
//             <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
//               Every Role,{' '}
//               <span style={{ background: 'linear-gradient(135deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//                 Perfectly Served
//               </span>
//             </h2>
//           </motion.div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {PANELS.map((panel, i) => (
//               <motion.div key={panel.id} className="glass-card rounded-3xl overflow-hidden cursor-pointer"
//                 style={{
//                   border: '1px solid rgba(255,255,255,0.05)',
//                   boxShadow: activePanel === panel.id ? `0 25px 50px ${panel.glow}, 0 0 0 1px rgba(255,255,255,0.1)` : 'none',
//                 }}
//                 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }} transition={{ delay: i * 0.1 }}
//                 onHoverStart={() => setActivePanel(panel.id)}
//                 onHoverEnd={() => setActivePanel(null)}
//                 onClick={() => navigate(`/login?panel=${panel.id}`)}
//               >
//                 <div className={`h-1.5 w-full bg-gradient-to-r ${panel.gradient}`} />
//                 <div className="p-8">
//                   <div className="flex items-start justify-between mb-6">
//                     <div className="flex items-center gap-4">
//                       <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center shadow-lg`}>
//                         <panel.icon className="w-7 h-7 text-white" />
//                       </div>
//                       <div>
//                         <h3 className="text-white font-black text-xl">{panel.title}</h3>
//                         <span className="text-sm text-slate-400">{panel.subtitle}</span>
//                       </div>
//                     </div>
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${panel.gradient} text-white`}>
//                       {panel.badge}
//                     </span>
//                   </div>
//                   <p className="text-slate-400 text-sm leading-relaxed mb-6">{panel.desc}</p>
//                   <div className="grid grid-cols-2 gap-2 mb-6">
//                     {panel.features.map(f => (
//                       <div key={f} className="flex items-center gap-2 text-slate-300 text-sm">
//                         <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
//                       </div>
//                     ))}
//                   </div>
//                   <div className="flex items-center gap-1 text-violet-400 text-sm font-semibold">
//                     Access {panel.title} <ChevronRight className="w-4 h-4" />
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="relative py-24 px-6">
//         <div className="max-w-4xl mx-auto">
//           <motion.div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden"
//             initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
//             <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))' }} />
//             <div className="relative z-10">
//               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6 mx-auto shadow-xl">
//                 <Building2 className="w-8 h-8 text-white" />
//               </div>
//               <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
//                 Ready to Transform Your<br />
//                 <span style={{ background: 'linear-gradient(135deg,#a78bfa,#38bdf8,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//                   Society Management?
//                 </span>
//               </h2>
//               <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
//                 Join residential communities already using this system.
//               </p>
//               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//                 <motion.button onClick={() => navigate('/register')}
//                   className="group flex items-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-xl w-full sm:w-auto justify-center"
//                   style={{ boxShadow: '0 10px 40px rgba(139,92,246,0.4)' }}
//                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
//                   Create Free Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                 </motion.button>
//                 <motion.button onClick={() => navigate('/login')}
//                   className="px-8 py-4 text-base font-medium text-white rounded-2xl glass-card-light w-full sm:w-auto"
//                   style={{ border: '1px solid rgba(255,255,255,0.1)' }}
//                   whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                   Sign In
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="relative py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
//               <Building2 className="w-4 h-4 text-white" />
//             </div>
//             <span className="text-slate-400 text-sm">Society Management System &copy; 2026</span>
//           </div>
//           <div className="flex items-center gap-6 text-slate-500 text-sm">
//             <span>Privacy Policy</span><span>Terms of Service</span><span>Support</span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
