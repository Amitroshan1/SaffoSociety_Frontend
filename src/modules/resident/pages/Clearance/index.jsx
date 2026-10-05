import { useRef, useState } from 'react';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import { getMoveOutClearance, uploadClearanceFile } from '@/modules/resident/services/document.service';
import '@/modules/resident/styles/clearance/clearance.css';

const ORDER = ['leaveLicense', 'tenantIdProof', 'ownerConfirmation', 'duesClearance', 'utilityBills', 'policeIntimation'];

const DESCRIPTIONS = {
  leaveLicense: 'Rent agreement for this flat',
  tenantIdProof: 'Aadhaar, PAN or passport of the tenant',
  ownerConfirmation: 'Signed NOC from the flat owner',
  duesClearance: 'Maintenance dues paid receipt or NOC',
  utilityBills: 'Final electricity and gas bills, paid',
  policeIntimation: 'Tenant exit intimation to the local police',
};

const STATE_TEXT = {
  approved: 'Approved',
  pending: 'Pending review',
  rejected: 'Rejected',
  missing: 'Not uploaded',
};

const STEPS = [
  { title: 'Upload documents', text: 'Submit all required move-out documents.' },
  { title: 'Admin verification', text: 'The society admin approves or rejects each document.' },
  { title: 'Clearance & gate approval', text: 'Once all are approved, security can allow your move-out at the gate.' },
];

function docState(doc) {
  if (!doc.present) return 'missing';
  if (doc.reviewStatus === 'approved') return 'approved';
  if (doc.reviewStatus === 'rejected') return 'rejected';
  return 'pending';
}

function sortKeys(docs) {
  const rank = (key) => {
    const index = ORDER.indexOf(key);
    return index === -1 ? ORDER.length : index;
  };
  return Object.keys(docs).sort((a, b) => rank(a) - rank(b));
}

const TIPS = [
  'Ensure all required documents are uploaded and approved.',
  'Re-upload any document the admin rejects, after fixing the remark.',
  'Clear any outstanding society dues.',
  'Complete the required verification before your move-out date.',
  'Keep the approved clearance handy for gate verification.',
];

function uploadedOn(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function StatusBadge({ ready }) {
  return (
    <span className={`res-clr-badge${ready ? ' is-ready' : ''}`}>
      <span className="res-clr-dot" aria-hidden="true" />
      {ready ? 'Ready' : 'Not Ready'}
    </span>
  );
}

export default function ClearancePage() {
  const { loading, error, data, reload, setData } = useLoad(() => getMoveOutClearance(), []);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputs = useRef({});

  const docs = data?.documents || {};
  const keys = sortKeys(docs);
  const requiredKeys = keys.filter((key) => docs[key].required !== false);
  const states = Object.fromEntries(keys.map((key) => [key, docState(docs[key])]));
  const count = (list, state) => list.filter((key) => states[key] === state).length;

  const total = requiredKeys.length;
  const approved = count(requiredKeys, 'approved');
  const uploaded = total - count(requiredKeys, 'missing');
  const pending = count(keys, 'pending');
  const rejected = count(keys, 'rejected');
  const percent = total ? Math.round((approved / total) * 100) : 0;
  const ready = Boolean(data?.gateAllowed);
  const complete = total > 0 && uploaded === total && count(requiredKeys, 'rejected') === 0;

  const nextKey = requiredKeys.find((key) => states[key] === 'missing')
    || keys.find((key) => states[key] === 'rejected');
  const nextDoc = nextKey ? docs[nextKey] : null;
  const nextVerb = nextKey && states[nextKey] === 'rejected' ? 'Re-upload' : 'Upload';
  const activeStep = ready ? STEPS.length : complete ? 1 : 0;

  let nextText = 'Waiting for admin approval';
  if (ready) nextText = 'Clearance approved';
  else if (nextDoc) nextText = `${nextVerb} ${nextDoc.title}`;
  else if (!submitted) nextText = 'Submit clearance';

  let ctaText = 'Upload all required documents to continue.';
  if (ready) ctaText = 'All required documents are approved by the society admin.';
  else if (nextDoc && nextVerb === 'Re-upload') ctaText = 'Re-upload the rejected document to continue.';
  else if (complete) ctaText = submitted ? 'Clearance submitted. Waiting for admin approval.' : 'All documents are uploaded. Submit your clearance for approval.';

  function pick(key) {
    inputs.current[key]?.click();
  }

  async function onFile(key, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;
    setNote('');
    setUploading(key);
    try {
      setData(await uploadClearanceFile(key, file));
    } catch (err) {
      setNote(err.message);
      reload();
    } finally {
      setUploading('');
    }
  }

  return (
    <div className="res-clr">
      <PageHeader title="Move-out Clearance" />

      <StatusLine loading={loading} error={error} onRetry={reload}>
        {data ? (
          <>
            <section className="res-card res-clr-summary" aria-label="Clearance progress">
              <div className="res-clr-summary-top">
                <div>
                  <span className="res-clr-eyebrow">Move-out clearance</span>
                  <strong className="res-clr-summary-title">
                    {approved} of {total} documents approved
                  </strong>
                </div>
                <span className="res-clr-percent">{percent}%</span>
              </div>
              <div
                className="res-clr-bar"
                role="progressbar"
                aria-label="Documents approved"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <span style={{ width: `${percent}%` }} className={ready ? 'is-full' : ''} />
              </div>
              <div className="res-clr-counts">
                <span>Uploaded <strong>{uploaded}/{total}</strong></span>
                <span className="is-approved">Approved <strong>{approved}</strong></span>
                <span className="is-pending">Pending review <strong>{pending}</strong></span>
                <span className="is-rejected">Rejected <strong>{rejected}</strong></span>
              </div>
              <div className="res-clr-summary-foot">
                <StatusBadge ready={ready} />
                <span className="res-clr-next">
                  <span>Next:</span>
                  {nextText}
                </span>
              </div>
            </section>

            <div className="res-clr-grid">
              <section className="res-card res-clr-docs" aria-labelledby="res-clr-docs-title">
                <div className="res-card-head">
                  <div>
                    <h2 id="res-clr-docs-title">Required documents</h2>
                    <p>Upload all required documents to submit your move-out clearance.</p>
                  </div>
                  <span className="res-clr-head-count">{uploaded}/{total} uploaded</span>
                </div>

                {note ? <div className="res-clr-note"><ResidentNote tone="err">{note}</ResidentNote></div> : null}

                <ul className="res-clr-list">
                  {keys.map((key) => {
                    const doc = docs[key];
                    const state = states[key];
                    const optional = doc.required === false;
                    const isBusy = uploading === key;
                    const date = uploadedOn(doc.uploadedAt);
                    const reviewed = uploadedOn(doc.reviewedAt);
                    const label = state === 'missing' ? 'Upload' : state === 'rejected' ? 'Re-upload' : 'Replace';
                    const primary = state === 'missing' || state === 'rejected';
                    let desc = DESCRIPTIONS[key] || doc.description || (optional ? 'Optional document' : 'Required document');
                    if (state === 'missing' && !optional) desc = 'Required before clearance can be submitted';
                    return (
                      <li key={key} className={`res-clr-row is-${state}${optional && state === 'missing' ? ' is-optional' : ''}`}>
                        <span className="res-clr-icon" aria-hidden="true">
                          {state === 'approved' ? <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg> : null}
                          {state === 'pending' ? <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></Svg> : null}
                          {state === 'rejected' ? <Svg><path d="M7 7l10 10M17 7L7 17" /></Svg> : null}
                          {state === 'missing' ? <Svg><path d="M12 8v5" /><path d="M12 16.5v.01" /><circle cx="12" cy="12" r="9" /></Svg> : null}
                        </span>
                        <div className="res-clr-info">
                          <span className="res-clr-title">
                            <strong>{doc.title}</strong>
                            {optional ? <span className="res-clr-optional">Optional</span> : null}
                          </span>
                          <span className="res-clr-desc">{desc}</span>
                          <span className="res-clr-file">
                            {doc.present && doc.fileName ? <span className="res-clr-filename">{doc.fileName}</span> : null}
                            {doc.present && date ? <span>Uploaded {date}</span> : null}
                            <span className={`res-clr-state is-${state}`}>
                              {STATE_TEXT[state]}
                              {(state === 'approved' || state === 'rejected') && reviewed ? ` · ${reviewed}` : ''}
                            </span>
                          </span>
                          {state === 'rejected' && doc.remark ? (
                            <span className="res-clr-remark"><strong>Admin remark:</strong> {doc.remark}</span>
                          ) : null}
                        </div>
                        <input
                          ref={(node) => { inputs.current[key] = node; }}
                          className="res-file"
                          type="file"
                          tabIndex={-1}
                          aria-hidden="true"
                          onChange={(event) => onFile(key, event)}
                        />
                        <button
                          type="button"
                          className={`res-btn res-clr-action ${primary && !optional ? 'res-btn--primary' : 'res-btn--secondary'}`}
                          onClick={() => pick(key)}
                          disabled={Boolean(uploading)}
                          aria-label={`${label} ${doc.title}`}
                        >
                          {isBusy ? 'Uploading…' : label}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="res-clr-cta">
                  <p className="res-clr-cta-text" aria-live="polite">
                    {ctaText}
                  </p>
                  <div className="res-clr-cta-actions">
                    {nextDoc ? (
                      <button
                        type="button"
                        className="res-btn res-btn--secondary"
                        onClick={() => pick(nextKey)}
                        disabled={Boolean(uploading)}
                      >
                        {nextVerb} {nextDoc.title}
                      </button>
                    ) : null}
                    {ready ? null : (
                      <button
                        type="button"
                        className="res-btn res-btn--primary"
                        onClick={() => setSubmitted(true)}
                        disabled={!complete || submitted || Boolean(uploading)}
                      >
                        {submitted ? 'Submitted' : 'Submit Move-out Clearance'}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <aside className="res-clr-side">
                <section className="res-card" aria-labelledby="res-clr-steps-title">
                  <div className="res-card-head">
                    <h2 id="res-clr-steps-title">What happens next?</h2>
                  </div>
                  <ol className="res-clr-steps">
                    {STEPS.map((step, index) => {
                      const state = index < activeStep ? 'is-done' : index === activeStep ? 'is-current' : '';
                      return (
                        <li key={step.title} className={`res-clr-step ${state}`}>
                          <span className="res-clr-step-num" aria-hidden="true">
                            {index < activeStep ? <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg> : index + 1}
                          </span>
                          <div>
                            <strong>{step.title}</strong>
                            <p>{step.text}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                <section className="res-card res-clr-tips" aria-labelledby="res-clr-tips-title">
                  <div className="res-card-head">
                    <h2 id="res-clr-tips-title">Before you move out</h2>
                  </div>
                  <ul>
                    {TIPS.map((tip) => <li key={tip}>{tip}</li>)}
                  </ul>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </StatusLine>
    </div>
  );
}
