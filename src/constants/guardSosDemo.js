/** Shared demo SOS rows for Guard UI preview when API has none. */
export const DEMO_SOS_ALERTS = [
  {
    id: 'demo-sos-1',
    flat: 'B-204',
    note: 'Resident pressed SOS — medical help needed',
    status: 'active',
    time: '12:18 pm',
    _demo: true,
  },
  {
    id: 'demo-sos-2',
    flat: 'A-101',
    note: 'Fire alarm triggered near kitchen',
    status: 'active',
    time: '11:55 am',
    _demo: true,
  },
  {
    id: 'demo-sos-3',
    flat: 'C-12',
    note: 'Suspicious person near lobby',
    status: 'active',
    time: '11:40 am',
    _demo: true,
  },
  {
    id: 'demo-sos-4',
    flat: 'D-308',
    note: 'Water leakage — emergency',
    status: 'responded',
    time: '10:22 am',
    _demo: true,
  },
  {
    id: 'demo-sos-5',
    flat: 'A-55',
    note: 'Elderly resident fell — responded',
    status: 'responded',
    time: '09:05 am',
    _demo: true,
  },
];

export function activeSosAlerts(alerts = []) {
  return (alerts || []).filter((a) => String(a.status || '').toLowerCase() === 'active');
}
