import { useEffect, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { getResidentProfile } from '@/services/residentPortal.service';

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Field({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || '-'}</span>
    </div>
  );
}

function Section({ title, fields }) {
  const visible = fields.filter((field) => field.value);
  if (!visible.length) return null;
  return (
    <section className="resident-section">
      <h3>{title}</h3>
      <div className="profile-grid">
        {visible.map((field) => (
          <Field key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </section>
  );
}

export default function ResidentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getResidentProfile();
        setProfile(res.data?.data?.user || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonLoader rows={4} />;
  if (error) return <EmptyState title="Profile unavailable" description={error} />;
  if (!profile) return <EmptyState title="No profile data" />;

  const initials = (profile.name || 'R')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <h1 className="resident-page-title">My Profile</h1>
      <p className="resident-page-subtitle">Your account and residence details.</p>

      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-hero-text">
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <div className="profile-hero-chips">
            <span className="notice-chip">{profile.role}</span>
            {profile.flatNo && <span className="notice-chip">Flat {profile.flatNo}</span>}
            <span className={`notice-chip ${profile.isVerified ? 'profile-chip--ok' : 'profile-chip--warn'}`}>
              {profile.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      <Section
        title="Account"
        fields={[
          { label: 'Name', value: profile.name },
          { label: 'Email', value: profile.email },
          { label: 'Phone', value: profile.phone },
          { label: 'Role', value: profile.role },
          { label: 'Status', value: profile.isActive ? 'Active' : 'Inactive' },
          { label: 'Member since', value: formatDate(profile.createdAt) },
        ]}
      />

      <Section
        title="Residence"
        fields={[
          { label: 'Flat', value: profile.flatNo },
          { label: 'Wing', value: profile.wing },
          { label: 'Building', value: profile.building },
          { label: 'Address', value: profile.address },
        ]}
      />

      <Section
        title="Personal"
        fields={[
          { label: 'Date of birth', value: formatDate(profile.dob) },
          { label: 'Gender', value: profile.gender },
          { label: 'Blood group', value: profile.bloodGroup },
        ]}
      />

      <Section
        title="Emergency contact"
        fields={[
          { label: 'Contact name', value: profile.emergencyName },
          { label: 'Contact phone', value: profile.emergencyPhone },
        ]}
      />

      <Section
        title="Work"
        fields={[
          { label: 'Designation', value: profile.designation },
          { label: 'Office contact', value: profile.officeContact },
          { label: 'Office address', value: profile.officeAddress },
        ]}
      />
    </div>
  );
}
