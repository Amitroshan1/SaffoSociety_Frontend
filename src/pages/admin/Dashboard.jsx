import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  MessageSquare,
} from "lucide-react";

import { AppShell } from "../../layout/admin/AppShell.jsx";
import { PageHeader } from "../../layout/admin/PageHeader.jsx";
import { SidePanel, PanelSection } from "../../layout/admin/SidePanel.jsx";
import { StatCard } from "../../components/admin/StatCard.jsx";
import { PaymentsTable } from "../../components/admin/PaymentsTable.jsx";
import { ADMIN_ROUTES } from "../../constants/adminRoutes.js";
import { useState } from "react";
import '../../styles/admin/AdminDashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null);

  return (
    <AppShell
      active="dashboard"
      onChange={(id) => {
        if (id === "dashboard") return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: "Home" }, { label: "Dashboard" }]}
    >
      <PageHeader
        icon={LayoutDashboard}
        iconColor="#a5b4fc"
        title="Dashboard"
        subtitle="A bird's-eye view of your society — updated in real time."
      />

      <DashboardView onRowClick={(selectedRow) => setPanel(selectedRow)} />

      <SidePanel
        open={!!panel}
        onClose={() => setPanel(null)}
        title="Payment details"
      >
        {panel && (
          <>
            <PanelSection label="Unit & resident">
              <div className="panel-resident-row">
                <div className="panel-resident-avatar">
                  {panel.resident
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="panel-resident-name">{panel.resident}</div>
                  <div className="panel-resident-unit">Unit {panel.unit}</div>
                </div>
              </div>
            </PanelSection>

            <PanelSection label="Amount">
              <div className="panel-amount">{panel.amount}</div>
              <div className="panel-amount-sub">Maintenance · April 2026</div>
            </PanelSection>

            <PanelSection label="Timeline">
              <ul className="timeline">
                {[
                  { t: "Invoice generated", d: "01 Apr · 09:00" },
                  { t: "Reminder sent",     d: "07 Apr · 11:30" },
                  { t: "Payment received",  d: "14 Apr · 18:42" },
                ].map((e, i) => (
                  <li key={i}>
                    <span className={"timeline-dot" + (i === 2 ? " done" : "")} />
                    <div>
                      <div className="timeline-title">{e.t}</div>
                      <div className="timeline-meta">{e.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelSection>

            <div className="panel-actions">
              <button className="btn-primary" type="button">Send receipt</button>
              <button className="btn-ghost" type="button">Edit</button>
            </div>
          </>
        )}
      </SidePanel>
    </AppShell>
  );
}

function DashboardView({ onRowClick }) {
  return (
    <>
      <section className="stat-grid">
        <StatCard
          label="Total residents"
          value={1284}
          icon={Users}
          iconColor="#a5b4fc"
          accent="rgba(99,102,241,0.5)"
          trend={{ dir: "up", value: "+4.2%" }}
          delay={0}
        />
        <StatCard
          label="Outstanding dues"
          value={482300}
          prefix="₹ "
          icon={IndianRupee}
          iconColor="#fde68a"
          accent="rgba(251,191,36,0.5)"
          trend={{ dir: "down", value: "-1.8%" }}
          delay={80}
        />
        <StatCard
          label="Open complaints"
          value={37}
          icon={MessageSquare}
          iconColor="#fca5a5"
          accent="rgba(248,113,113,0.5)"
          trend={{ dir: "down", value: "-12%" }}
          delay={160}
        />
        <StatCard
          label="Visitors today"
          value={64}
          icon={Users}
          iconColor="#86efac"
          accent="rgba(52,211,153,0.5)"
          trend={{ dir: "up", value: "+9%" }}
          delay={240}
        />
      </section>

      <div style={{ marginTop: 16 }}>
        <PaymentsTable onRowClick={onRowClick} />
      </div>
    </>
  );
}
