import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import FormLayout from '../../components/common/FormLayout';
import FormSelect from '../../components/common/FormSelect';
import { createResidentComplaint } from '../../services/complaint.service';

const CATEGORIES = [
  'electrical',
  'plumbing',
  'housekeeping',
  'security',
  'parking',
  'lift',
  'water',
  'internet',
  'common_area',
  'other',
];

const initialForm = {
  category: 'plumbing',
  title: '',
  description: '',
  priority: 'medium',
  attachmentName: '',
  attachmentUrl: '',
};

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const attachments = form.attachmentUrl
        ? [{ fileName: form.attachmentName || 'attachment', fileUrl: form.attachmentUrl }]
        : [];
      await createResidentComplaint({
        category: form.category,
        title: form.title,
        description: form.description,
        priority: form.priority,
        attachments,
      });
      navigate('/resident/complaints');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create complaint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="resident-link"
        onClick={() => navigate('/resident/complaints')}
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: 12, cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 className="resident-page-title">New Complaint</h1>
      <p className="resident-page-subtitle">Describe the issue so society staff can follow up.</p>
      {error && <p className="resident-error">{error}</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <FormLayout
          sections={[
            {
              title: 'Complaint details',
              content: (
                <>
                  <FormSelect
                    label="Category"
                    value={form.category}
                    options={CATEGORIES}
                    onChange={(v) => setForm((s) => ({ ...s, category: v }))}
                  />
                  <FormField
                    label="Title"
                    value={form.title}
                    onChange={(v) => setForm((s) => ({ ...s, title: v }))}
                    required
                  />
                  <FormField
                    textarea
                    label="Description"
                    value={form.description}
                    onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                    required
                  />
                  <FormSelect
                    label="Priority"
                    value={form.priority}
                    options={['low', 'medium', 'high', 'critical']}
                    onChange={(v) => setForm((s) => ({ ...s, priority: v }))}
                  />
                  <FormField
                    label="Attachment URL (optional)"
                    value={form.attachmentUrl}
                    onChange={(v) => setForm((s) => ({ ...s, attachmentUrl: v }))}
                  />
                  <FormField
                    label="Attachment name"
                    value={form.attachmentName}
                    onChange={(v) => setForm((s) => ({ ...s, attachmentName: v }))}
                  />
                </>
              ),
            },
          ]}
          footer={
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Complaint'}
            </button>
          }
        />
      </form>
    </div>
  );
}
