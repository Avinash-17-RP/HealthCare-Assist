import { toast, modalOpen, modalClose } from '../core/ui.js';
import { api } from '../core/api.js';
const progress = (med) => {
  const total = med.duration * med.frequency;
  const taken = Object.values(med.taken || {}).reduce((a, b) => a + (b || 0), 0);
  return total ? Math.round((taken / total) * 100) : 0;
};
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const renderList = () => {
  const list = document.getElementById('medicationsList');
  api.medications.list().then(({ items }) => {
    const meds = items;
    list.innerHTML = '';
    meds.forEach(m => {
      const el = document.createElement('div');
      el.className = 'med-card';
      const left = document.createElement('div');
      left.innerHTML = `<div><strong>${m.name}</strong> • ${m.dosage}</div><div class="muted">${m.frequency}×/day • ${m.duration} days</div>`;
      const right = document.createElement('div');
      right.className = 'actions';
      const pr = document.createElement('span');
      pr.className = 'badge';
      pr.textContent = `${progress(m)}%`;
      const edit = document.createElement('button');
      edit.className = 'icon-btn';
      edit.innerHTML = '<span class="material-symbols-rounded">edit</span>';
      edit.addEventListener('click', () => {
        document.getElementById('editMedId').value = m.id;
        document.getElementById('editMedName').value = m.name;
        document.getElementById('editMedDosage').value = m.dosage;
        document.getElementById('editMedFrequency').value = m.frequency;
        document.getElementById('editMedDuration').value = m.duration;
        modalOpen();
      });
      right.append(pr, edit);
      el.append(left, right);
      const timeline = document.createElement('div');
      timeline.className = 'timeline';
      const tk = todayKey();
      const takenToday = (m.taken && m.taken[tk]) || 0;
      for (let i = 1; i <= m.frequency; i++) {
        const row = document.createElement('div');
        row.className = 'timeline-row';
        row.innerHTML = `<span>Dose ${i}</span>`;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = i <= takenToday;
        cb.addEventListener('change', () => {
          let count = 0;
          const rows = timeline.querySelectorAll('input[type="checkbox"]');
          rows.forEach(r => { if (r.checked) count++; });
          api.medications.taken(m.id, tk, count).then(() => renderList()).catch(err => toast(err.message, 'error'));
        });
        row.append(cb);
        timeline.appendChild(row);
      }
      list.appendChild(el);
      list.appendChild(timeline);
    });
  }).catch(err => {
    list.innerHTML = `<div class="muted">${err.message}</div>`;
  });
};
const initMedicationsPage = () => {
  const form = document.getElementById('medicineForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('medName').value.trim(),
      dosage: document.getElementById('medDosage').value.trim(),
      frequency: Number(document.getElementById('medFrequency').value),
      duration: Number(document.getElementById('medDuration').value),
      taken: {}
    };
    api.medications.add(data).then(() => {
      renderList();
      form.reset();
      toast('Medicine added', 'success');
    }).catch(err => toast(err.message, 'error'));
  });
  document.getElementById('closeModal').addEventListener('click', modalClose);
  document.getElementById('editMedicineForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editMedId').value;
    const payload = {
      name: document.getElementById('editMedName').value.trim(),
      dosage: document.getElementById('editMedDosage').value.trim(),
      frequency: Number(document.getElementById('editMedFrequency').value),
      duration: Number(document.getElementById('editMedDuration').value)
    };
    api.medications.update(id, payload).then(() => {
      modalClose();
      renderList();
      toast('Medicine updated', 'success');
    }).catch(err => toast(err.message, 'error'));
  });
  renderList();
};
export { initMedicationsPage, progress };
