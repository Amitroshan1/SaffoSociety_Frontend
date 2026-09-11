/** Build axios query params from list state (camelCase API). */
export function toListParams(state) {
  const params = {
    page: state.page ?? 1,
    pageSize: state.pageSize ?? 20,
    sortBy: state.sortBy ?? 'created_at',
    sortOrder: state.sortOrder ?? 'desc',
  };
  if (state.search?.trim()) params.search = state.search.trim();
  if (state.isActive !== undefined && state.isActive !== '') {
    params.isActive = state.isActive;
  }
  if (state.buildingId) params.buildingId = state.buildingId;
  if (state.wingId) params.wingId = state.wingId;
  if (state.flatId) params.flatId = state.flatId;
  if (state.occupancyId) params.occupancyId = state.occupancyId;
  if (state.visitorId) params.visitorId = state.visitorId;
  if (state.residentId) params.residentId = state.residentId;
  if (state.role) params.role = state.role;
  if (state.status) params.status = state.status;
  if (state.visitorType) params.visitorType = state.visitorType;
  if (state.passType) params.passType = state.passType;
  if (state.phone) params.phone = state.phone;
  if (state.governmentIdType) params.governmentIdType = state.governmentIdType;
  if (state.fromDate) params.fromDate = state.fromDate;
  if (state.toDate) params.toDate = state.toDate;
  if (state.staffRole) params.staffRole = state.staffRole;
  if (state.employmentType) params.employmentType = state.employmentType;
  if (state.assignedGateId) params.assignedGateId = state.assignedGateId;
  if (state.gateType) params.gateType = state.gateType;
  if (state.staffId) params.staffId = state.staffId;
  if (state.gateId) params.gateId = state.gateId;
  if (state.shiftId) params.shiftId = state.shiftId;
  if (state.shiftType) params.shiftType = state.shiftType;
  if (state.shiftDate) params.shiftDate = state.shiftDate;
  if (state.priority) params.priority = state.priority;
  if (state.category) params.category = state.category;
  if (state.assignedStaffId) params.assignedStaffId = state.assignedStaffId;
  if (state.source) params.source = state.source;
  if (state.mode) params.mode = state.mode;
  if (state.frequency) params.frequency = state.frequency;
  if (state.billId) params.billId = state.billId;
  if (state.paymentId) params.paymentId = state.paymentId;
  if (state.billingCycleId) params.billingCycleId = state.billingCycleId;
  if (state.financialYearId) params.financialYearId = state.financialYearId;
  if (state.isVoid !== undefined && state.isVoid !== '') {
    params.isVoid = state.isVoid === true || state.isVoid === 'true';
  }
  if (state.isPreapproved !== undefined && state.isPreapproved !== '') {
    params.isPreapproved = state.isPreapproved === true || state.isPreapproved === 'true';
  }
  if (state.isPrimary !== undefined && state.isPrimary !== '') {
    params.isPrimary = state.isPrimary === true || state.isPrimary === 'true';
  }
  if (state.currentOnly !== undefined && state.currentOnly !== '') {
    params.currentOnly = state.currentOnly === true || state.currentOnly === 'true';
  }
  return params;
}

export const DEFAULT_LIST_STATE = {
  page: 1,
  pageSize: 10,
  search: '',
  sortBy: 'name',
  sortOrder: 'asc',
  isActive: '',
};

export function normalizePagination(data) {
  return data?.pagination ?? {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
}
