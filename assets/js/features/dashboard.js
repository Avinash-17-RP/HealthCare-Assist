import { api } from '../core/api.js';
const countTodayAppointments = async () => {
  const { items } = await api.appointments.list();
  const d = new Date();
  return items.filter(a => {
    const dt = new Date(a.dateTime);
    return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth() && dt.getDate() === d.getDate();
  }).length;
};
const countPendingMedications = async () => {
  const { items } = await api.medications.list();
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return items.reduce((acc, m) => {
    const taken = (m.taken && m.taken[key]) || 0;
    return acc + Math.max(m.frequency - taken, 0);
  }, 0);
};
const countUpcomingReminders = async () => {
  const { items } = await api.appointments.list();
  const now = Date.now();
  return items.filter(a => {
    const dt = new Date(a.dateTime).getTime();
    return dt > now && dt - now < 24 * 3600 * 1000;
  }).length;
};
const medProgress = async () => {
  const { items } = await api.medications.list();
  const total = items.reduce((acc, m) => acc + m.duration * m.frequency, 0);
  const taken = items.reduce((acc, m) => acc + Object.values(m.taken || {}).reduce((a, b) => a + (b || 0), 0), 0);
  return total ? Math.round((taken / total) * 100) : 0;
};
const buildCalendar = (grid, titleEl) => {
  const d = new Date();
  let month = d.getMonth();
  let year = d.getFullYear();
  const render = () => {
    titleEl.textContent = `${new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}`;
    grid.innerHTML = '';
    const start = new Date(year, month, 1);
    const offset = start.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < offset; i++) {
      const blank = document.createElement('div');
      grid.appendChild(blank);
    }
    Promise.all([api.appointments.list(), api.medications.list()]).then(([aRes, mRes]) => {
      const appts = aRes.items;
      const meds = mRes.items;
      const dstr = (dd) => `${year}-${String(month+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
      for (let day = 1; day <= days; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = day;
        cell.appendChild(dayEl);
        const ds = dstr(day);
        const hasAppt = appts.some(a => {
          const dt = new Date(a.dateTime);
          const s = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
          return s === ds;
        });
        const hasMed = meds.length > 0;
        if (hasAppt) {
          const dot = document.createElement('span');
          dot.className = 'dot appt';
          cell.appendChild(dot);
        }
        if (hasMed) {
          const dot = document.createElement('span');
          dot.className = 'dot med';
          cell.appendChild(dot);
        }
        grid.appendChild(cell);
      }
    });
  };
  render();
  document.getElementById('prevMonth').addEventListener('click', () => { month--; if (month < 0) { month = 11; year--; } render(); });
  document.getElementById('nextMonth').addEventListener('click', () => { month++; if (month > 11) { month = 0; year++; } render(); });
};
const initDashboard = () => {
  Promise.all([countTodayAppointments(), countPendingMedications(), countUpcomingReminders(), medProgress()]).then(([a, pm, r, pct]) => {
    document.getElementById('summaryAppointments').textContent = String(a);
    document.getElementById('summaryPendingMeds').textContent = String(pm);
    document.getElementById('summaryReminders').textContent = String(r);
    document.getElementById('medProgressBar').style.width = `${pct}%`;
    document.getElementById('medProgressLabel').textContent = `${pct}%`;
  });
  buildCalendar(document.getElementById('calendarGrid'), document.getElementById('calendarTitle'));
};
export { initDashboard };
