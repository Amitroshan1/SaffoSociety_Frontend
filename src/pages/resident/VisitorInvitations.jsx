import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import { createResidentVisitorInvitation } from '../../services/residentPortal.service';

const initialForm = {
  name: '',
  phone: '',
  purpose: '',
  visitorType: 'guest',
};

export default function ResidentVisitorInvitationsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        visitor: { name: form.name, phone: form.phone },
        purpose: form.purpose,
        visitorType: form.visitorType,
      };
      await createResidentVisitorInvitation(payload);
      setMessage('Invitation created successfully.');
      setForm(initialForm);
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Failed to create invitation');
    }
  };

  return (
    <div>
      <button
        type="button"
        className="resident-link"
        onClick={() => navigate('/resident/visitors')}
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: 12, cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 className="resident-page-title">Visitor Invitations</h1>
      <p className="resident-page-subtitle">Invite a guest to your flat ahead of their visit.</p>
      {error ? <EmptyState title="Could not submit invitation" description={error} /> : null}
      {message ? <p style={{ color: '#166534' }}>{message}</p> : null}
      <form onSubmit={onSubmit} style={{ maxWidth: 420, display: 'grid', gap: 10 }}>
        <input
          value={form.name}
          placeholder="Visitor name"
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          required
        />
        <input
          value={form.phone}
          placeholder="Visitor phone"
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          required
        />
        <input
          value={form.purpose}
          placeholder="Purpose"
          onChange={(e) => setForm((s) => ({ ...s, purpose: e.target.value }))}
          required
        />
        <select
          value={form.visitorType}
          onChange={(e) => setForm((s) => ({ ...s, visitorType: e.target.value }))}
        >
          <option value="guest">Guest</option>
          <option value="delivery">Delivery</option>
          <option value="vendor">Vendor</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="btn-primary">
          Create Invitation
        </button>
      </form>
    </div>
  );
}
