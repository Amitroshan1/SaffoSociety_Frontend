/**
 * Booking dummy store — Guard Booking is READ-ONLY; status = approved.
 */
import { buildPagination, indiaTodayISO } from '@/modules/guard/services/core/http';

function daysOffset(n) {
  const d = new Date(`${indiaTodayISO()}T12:00:00+05:30`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seed() {
  const today = indiaTodayISO();
  return [
    {
      id: 1,
      bookingCode: 'BK-1001',
      residentName: 'Priya Mehta',
      flatNo: 'A-101',
      facility: 'Clubhouse',
      bookingDate: today,
      startTime: '16:00',
      endTime: '18:00',
      status: 'approved',
    },
    {
      id: 2,
      bookingCode: 'BK-1003',
      residentName: 'Kabir Singh',
      flatNo: 'C-501',
      facility: 'Tennis Court',
      bookingDate: today,
      startTime: '07:00',
      endTime: '08:00',
      status: 'approved',
    },
    {
      id: 3,
      bookingCode: 'BK-1002',
      residentName: 'Rohan Das',
      flatNo: 'B-220',
      facility: 'Banquet Hall',
      bookingDate: daysOffset(1),
      startTime: '18:00',
      endTime: '22:00',
      status: 'approved',
    },
    {
      id: 4,
      bookingCode: 'BK-FUT-101',
      residentName: 'Demo Resident',
      flatNo: 'A1-101',
      facility: 'Clubhouse',
      bookingDate: daysOffset(3),
      startTime: '10:00',
      endTime: '12:00',
      status: 'approved',
    },
    {
      id: 5,
      bookingCode: 'BK-DAT-088',
      residentName: 'Rahul Mehta',
      flatNo: 'C3-312',
      facility: 'Tennis Court',
      bookingDate: daysOffset(-1),
      startTime: '06:00',
      endTime: '07:00',
      status: 'approved',
    },
    {
      id: 6,
      bookingCode: 'BK-DAT-074',
      residentName: 'Anita Desai',
      flatNo: 'A1-102',
      facility: 'Party Lawn',
      bookingDate: daysOffset(-4),
      startTime: '17:00',
      endTime: '21:00',
      status: 'approved',
    },
    {
      id: 7,
      bookingCode: 'BK-DAT-055',
      residentName: 'Neha Kapoor',
      flatNo: 'B1-110',
      facility: 'Clubhouse',
      bookingDate: daysOffset(-7),
      startTime: '11:00',
      endTime: '13:00',
      status: 'approved',
    },
  ];
}

let bookings = seed();

function matchSearch(row, q) {
  if (!q) return true;
  const n = String(q).toLowerCase();
  return [row.bookingCode, row.flatNo, row.residentName, row.facility].some((h) =>
    String(h || '')
      .toLowerCase()
      .includes(n),
  );
}

function computeCounts(all) {
  const today = indiaTodayISO();
  return {
    today: all.filter((b) => b.bookingDate === today).length,
    upcoming: all.filter((b) => b.bookingDate > today).length,
    history: all.filter((b) => b.bookingDate < today).length,
  };
}

function scopeFilter(rows, params) {
  const today = indiaTodayISO();
  const view = params.view || params.scope || 'today';
  if (view === 'today') return rows.filter((b) => b.bookingDate === today);
  if (view === 'upcoming') return rows.filter((b) => b.bookingDate > today);
  if (view === 'history') return rows.filter((b) => b.bookingDate < today);
  if (view === 'date') {
    const date = params.date || params.bookingDate;
    if (!date) return [];
    return rows.filter((b) => b.bookingDate === date);
  }
  return rows;
}

export const bookingDummyStore = {
  reset() {
    bookings = seed();
  },

  list(params = {}) {
    const counts = computeCounts(bookings);
    let rows = scopeFilter(bookings, params);
    // Search filters result set only — counts stay overall
    if (params.search) rows = rows.filter((r) => matchSearch(r, params.search));
    rows = [...rows].sort((a, b) => {
      const byDate = String(a.bookingDate).localeCompare(String(b.bookingDate));
      if (byDate !== 0) return byDate;
      return String(a.startTime).localeCompare(String(b.startTime));
    });
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
    const start = (page - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize),
      pagination: buildPagination(rows.length, page, pageSize),
      counts,
    };
  },

  get(id) {
    return bookings.find((b) => String(b.id) === String(id)) || null;
  },
};
