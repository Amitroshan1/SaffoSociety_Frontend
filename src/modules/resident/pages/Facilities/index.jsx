import { useNavigate } from 'react-router-dom';
import AmenityIcon from '@/modules/resident/components/AmenityIcon';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import { useLoad } from '@/modules/resident/components/useLoad';
import { listBookableFacilities } from '@/modules/resident/services/facility.service';
import '@/modules/resident/styles/facility/facility.css';

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { loading, error, data, reload } = useLoad(() => listBookableFacilities(), []);
  const items = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader title="Facilities" />
      <StatusLine loading={loading} error={error} onRetry={reload}>
        {items.length ? (
          <div className="res-amenity-grid">
            {items.map((item) => {
              const slotCount = Array.isArray(item.slots) ? item.slots.length : null;
              const open = () => navigate(`/resident/facilities/${item.id}`);
              return (
                <article key={item.id} className="res-amenity">
                  <div className="res-amenity-top">
                    <AmenityIcon name={item.name} />
                    <span className="res-amenity-status">Open</span>
                  </div>

                  <h3>{item.name}</h3>

                  <ul className="res-amenity-facts">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {item.hours || 'Timings not set'}
                    </li>
                    {slotCount !== null ? (
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="17" rx="2" />
                          <path d="M3 10h18" />
                        </svg>
                        {slotCount} {slotCount === 1 ? 'slot' : 'slots'} available
                      </li>
                    ) : null}
                  </ul>

                  <div className="res-amenity-foot">
                    <div className="res-amenity-price">
                      <strong>{Number(item.fee) ? `₹${item.fee}` : 'Free'}</strong>
                      {Number(item.fee) ? <span>per slot</span> : null}
                    </div>
                    <button type="button" className="res-btn res-btn--primary" onClick={open}>Book now</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="res-card">
            <div className="res-empty">
              <strong>No facilities to book</strong>
              <p>Amenities added by your society will appear here.</p>
            </div>
          </section>
        )}
      </StatusLine>
    </>
  );
}
