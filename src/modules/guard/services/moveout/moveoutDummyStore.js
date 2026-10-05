import { registerMockGuardFile } from '@/modules/guard/services/core/guardFile';

function docs(requestId, rows) {
  return rows.map((row, index) => {
    const viewUrl = `/guard/move-out/${requestId}/documents/${row.id}/view`;
    registerMockGuardFile(viewUrl, row.fileName);
    return {
      id: row.id,
      title: row.title,
      fileName: row.fileName,
      sizeBytes: row.sizeBytes,
      viewUrl,
      index,
    };
  });
}

const requests = [
  {
    id: 'mo-1',
    residentName: 'Rahul Mehta',
    flatNo: 'C3-312',
    buildingNo: 'C',
    wingNo: '3',
    moveOutDate: '2026-09-20',
    leaveLicense: true,
    tenantIdProof: true,
    ownerConfirmation: true,
    duesClearance: false,
    status: 'pending',
    canAllow: false,
    allowedAt: null,
    documents: docs('mo-1', [
      { id: 'mo-1-d1', title: 'Leave & License Agreement', fileName: 'leave-license.pdf', sizeBytes: 220000 },
      { id: 'mo-1-d2', title: 'Tenant ID Proof', fileName: 'tenant-id.pdf', sizeBytes: 180000 },
      { id: 'mo-1-d3', title: 'Owner Confirmation', fileName: 'owner-confirmation.pdf', sizeBytes: 140000 },
    ]),
  },
  {
    id: 'mo-2',
    residentName: 'Priya Sharma',
    flatNo: 'B2-204',
    buildingNo: 'B',
    wingNo: '2',
    moveOutDate: '2026-09-18',
    leaveLicense: true,
    tenantIdProof: true,
    ownerConfirmation: false,
    duesClearance: false,
    status: 'pending',
    canAllow: false,
    allowedAt: null,
    documents: docs('mo-2', [
      { id: 'mo-2-d1', title: 'Leave & License Agreement', fileName: 'leave-license.pdf', sizeBytes: 210000 },
      { id: 'mo-2-d2', title: 'Tenant ID Proof', fileName: 'tenant-id.pdf', sizeBytes: 160000 },
    ]),
  },
  {
    id: 'mo-3',
    residentName: 'Anita Desai',
    flatNo: 'A1-102',
    buildingNo: 'A',
    wingNo: '1',
    moveOutDate: '2026-09-12',
    leaveLicense: true,
    tenantIdProof: true,
    ownerConfirmation: true,
    duesClearance: true,
    status: 'ready',
    canAllow: true,
    allowedAt: null,
    documents: docs('mo-3', [
      { id: 'mo-3-d1', title: 'Leave & License Agreement', fileName: 'leave-license.pdf', sizeBytes: 230000 },
      { id: 'mo-3-d2', title: 'Tenant ID Proof', fileName: 'tenant-id.pdf', sizeBytes: 175000 },
      { id: 'mo-3-d3', title: 'Owner Confirmation', fileName: 'owner-confirmation.pdf', sizeBytes: 150000 },
      { id: 'mo-3-d4', title: 'Dues Clearance', fileName: 'dues-clearance.pdf', sizeBytes: 98000 },
    ]),
  },
];

function clone(row) {
  return {
    ...row,
    documents: (row.documents || []).map((d) => ({ ...d })),
  };
}

export function listMoveOutRows() {
  return requests.map(clone);
}

export function findMoveOut(id) {
  const row = requests.find((r) => r.id === id);
  return row ? clone(row) : null;
}

export function allowMoveOutRow(id) {
  const row = requests.find((r) => r.id === id);
  if (!row) {
    const e = new Error('Move-out request not found');
    e.status = 404;
    throw e;
  }
  if (row.status === 'allowed') {
    const e = new Error('Move-out is already allowed');
    e.status = 409;
    throw e;
  }
  if (!row.canAllow) {
    const e = new Error('Allow to go is available only when every check is Yes');
    e.status = 409;
    throw e;
  }
  row.status = 'allowed';
  row.canAllow = false;
  row.allowedAt = new Date().toISOString();
  return clone(row);
}
