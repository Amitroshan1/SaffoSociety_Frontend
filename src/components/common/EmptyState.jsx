import { Inbox } from 'lucide-react';
import '../../styles/common/crud.css';

export default function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox, action }) {
  return (
    <div className="crud-empty">
      <Icon size={40} style={{ opacity: 0.35, marginBottom: 12 }} />
      <div className="crud-empty-title">{title}</div>
      {description && <p style={{ margin: '0 0 16px', fontSize: 14 }}>{description}</p>}
      {action}
    </div>
  );
}
