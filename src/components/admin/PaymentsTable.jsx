import { Eye, MoreHorizontal, Pencil } from "lucide-react";

const ROWS = [
  { id: "01", unit: "A-1204", resident: "Aarav Mehta",  amount: "₹ 12,400", status: "Paid",    date: "12 Apr" },
  { id: "02", unit: "B-0807", resident: "Priya Sharma", amount: "₹ 8,900",  status: "Pending", date: "14 Apr" },
  { id: "03", unit: "C-0301", resident: "Vikram Iyer",  amount: "₹ 14,200", status: "Overdue", date: "02 Apr" },
  { id: "04", unit: "A-0501", resident: "Neha Kapoor",  amount: "₹ 11,000", status: "Paid",    date: "16 Apr" },
  { id: "05", unit: "D-1102", resident: "Rohan Das",    amount: "₹ 9,750",  status: "Pending", date: "18 Apr" },
  { id: "06", unit: "B-0204", resident: "Sara Khan",    amount: "₹ 13,500", status: "Paid",    date: "20 Apr" },
];

function statusBadge(s) {
  if (s === "Paid")    return "badge-success";
  if (s === "Pending") return "badge-warning";
  return "badge-danger";
}

export function PaymentsTable({ onRowClick }) {
  return (
    <div className="glass card-accent-top payments-card">
      <div className="payments-head">
        <div>
          <h3>Recent payments</h3>
          <p>Activity from the last 14 days</p>
        </div>
        <button className="btn-ghost">View all</button>
      </div>

      <table className="payments-table">
        <thead>
          <tr>
            {["#", "Unit", "Resident", "Amount", "Status", "Date", ""].map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.id} onClick={() => onRowClick && onRowClick(row)}>
              <td className="cell-id">{row.id}</td>
              <td><span className="cell-strong">{row.unit}</span></td>
              <td>{row.resident}</td>
              <td className="cell-amount">{row.amount}</td>
              <td>
                <span className={`badge-base ${statusBadge(row.status)}`}>
                  {row.status}
                </span>
              </td>
              <td className="cell-muted">{row.date}</td>
              <td>
                <div className="row-actions">
                  <RowAction><Eye size={14} /></RowAction>
                  <RowAction><Pencil size={14} /></RowAction>
                  <RowAction><MoreHorizontal size={14} /></RowAction>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowAction({ children }) {
  return (
    <button onClick={(e) => e.stopPropagation()} className="row-action-btn">
      {children}
    </button>
  );
}