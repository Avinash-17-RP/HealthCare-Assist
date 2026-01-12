import { toast, modalOpen, modalClose } from '../core/ui.js';
import { api } from '../core/api.js';
const statusOf = (appt) => {
  if (appt.completed) return 'completed';
  const dt = new Date(appt.dateTime);
  return dt < new Date() ? 'missed' : 'upcoming';
};
const renderList = () => {
  const list = document.getElementById('appointmentsList');
  api.appointments.list().then(({ items }) => {
    const appts = items.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    list.innerHTML = '';
    appts.forEach(a => {
      const el = document.createElement('div');
      el.className = 'appt-card';
      const left = document.createElement('div');
      left.innerHTML = `<div><strong>${a.docName}</strong> • ${a.department}</div><div class="muted">${new Date(a.dateTime).toLocaleString()} • ${a.location}</div>`;
      const right = document.createElement('div');
      right.className = 'actions';
      const st = document.createElement('span');
      const s = statusOf(a);
      st.className = `status ${s}`;
      st.textContent = s;
      const edit = document.createElement('button');
      edit.className = 'icon-btn';
      edit.innerHTML = '<span class="material-symbols-rounded">edit</span>';
      edit.addEventListener('click', () => {
        document.getElementById('editId').value = a.id;
        document.getElementById('editDocName').value = a.docName;
        document.getElementById('editDepartment').value = a.department;
        document.getElementById('editDateTime').value = a.dateTime;
        document.getElementById('editLocation').value = a.location;
        document.getElementById('editCompleted').checked = !!a.completed;
        modalOpen();
      });
      const del = document.createElement('button');
      del.className = 'icon-btn';
      del.innerHTML = '<span class="material-symbols-rounded">delete</span>';
      del.addEventListener('click', () => {
        if (confirm('Cancel this appointment?')) {
          api.appointments.remove(a.id).then(() => {
            renderList();
            toast('Appointment canceled', 'success');
          }).catch(err => toast(err.message, 'error'));
        }
      });
      right.append(st, edit, del);
      el.append(left, right);
      list.appendChild(el);
    });
  }).catch(err => {
    list.innerHTML = `<div class="muted">${err.message}</div>`;
  });
};
const initAppointmentsPage = () => {
  const form = document.getElementById('appointmentForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      docName: document.getElementById('docName').value.trim(),
      department: document.getElementById('department').value.trim(),
      dateTime: document.getElementById('dateTime').value,
      location: document.getElementById('location').value.trim()
    };
    api.appointments.add(data).then(() => {
      renderList();
      form.reset();
      toast('Appointment added', 'success');
    }).catch(err => toast(err.message, 'error'));
  });
  document.getElementById('closeModal').addEventListener('click', modalClose);
  document.getElementById('editAppointmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const payload = {
      docName: document.getElementById('editDocName').value.trim(),
      department: document.getElementById('editDepartment').value.trim(),
      dateTime: document.getElementById('editDateTime').value,
      location: document.getElementById('editLocation').value.trim(),
      completed: document.getElementById('editCompleted').checked
    };
    api.appointments.update(id, payload).then(() => {
      modalClose();
      renderList();
      toast('Appointment updated', 'success');
    }).catch(err => toast(err.message, 'error'));
  });
  const grid = document.getElementById('apptCalendarGrid');
  const titleEl = document.getElementById('apptCalTitle');
  let today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();
  const renderCal = () => {
    titleEl.textContent = `${new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}`;
    grid.innerHTML = '';
    const start = new Date(year, month, 1);
    const offset = start.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));
    for (let d = 1; d <= days; d++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      const dayEl = document.createElement('div');
      dayEl.className = 'day';
      dayEl.textContent = d;
      cell.appendChild(dayEl);
      cell.addEventListener('click', () => {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}T09:00`;
        const input = document.getElementById('dateTime');
        input.value = dateStr;
        toast('Date selected', 'info');
      });
      grid.appendChild(cell);
    }
  };
  document.getElementById('apptPrev').addEventListener('click', () => { month--; if (month < 0) { month = 11; year--; } renderCal(); });
  document.getElementById('apptNext').addEventListener('click', () => { month++; if (month > 11) { month = 0; year++; } renderCal(); });
  renderCal();
  renderList();
};
export { initAppointmentsPage, statusOf };
