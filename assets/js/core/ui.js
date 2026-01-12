import { get, set } from './storage.js';
const toastContainer = () => document.getElementById('toastContainer');
const toast = (msg, type = 'info') => {
  const c = toastContainer();
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};
const modalOpen = () => {
  const m = document.getElementById('modal');
  if (m) m.classList.remove('hidden');
};
const modalClose = () => {
  const m = document.getElementById('modal');
  if (m) m.classList.add('hidden');
};
const applySettings = () => {
  const s = get('settings', { dark: false, fontSize: 16, notifAppointments: true, notifMedications: true });
  document.documentElement.setAttribute('data-theme', s.dark ? 'dark' : 'light');
  document.documentElement.style.fontSize = `${s.fontSize}px`;
};
const initThemeToggle = () => {
  const t = document.getElementById('themeToggle');
  if (!t) return;
  t.addEventListener('click', () => {
    const s = get('settings', { dark: false, fontSize: 16, notifAppointments: true, notifMedications: true });
    s.dark = !s.dark;
    set('settings', s);
    applySettings();
    toast(s.dark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
  });
};
export { toast, modalOpen, modalClose, applySettings, initThemeToggle };

