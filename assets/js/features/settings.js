import { get, set } from '../core/storage.js';
import { applySettings, toast } from '../core/ui.js';
import { api } from '../core/api.js';
const initSettingsPage = () => {
  const s = get('settings', { dark: false, fontSize: 16, notifAppointments: true, notifMedications: true });
  const dm = document.getElementById('darkModeToggle');
  const fs = document.getElementById('fontSizeRange');
  const na = document.getElementById('notifAppointments');
  const nm = document.getElementById('notifMedications');
  api.settings.get().then(({ settings }) => {
    set('settings', settings);
    dm.checked = settings.dark;
    fs.value = settings.fontSize;
    na.checked = settings.notifAppointments;
    nm.checked = settings.notifMedications;
    applySettings();
  }).catch(() => {
    dm.checked = s.dark;
    fs.value = s.fontSize;
    na.checked = s.notifAppointments;
    nm.checked = s.notifMedications;
    applySettings();
  });
  dm.addEventListener('change', () => {
    const v = dm.checked;
    const cur = get('settings', s);
    cur.dark = v;
    api.settings.set(cur).then(({ settings }) => {
      set('settings', settings);
      applySettings();
      toast(v ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    });
  });
  fs.addEventListener('input', () => {
    const v = Number(fs.value);
    const cur = get('settings', s);
    cur.fontSize = v;
    api.settings.set(cur).then(({ settings }) => {
      set('settings', settings);
      applySettings();
    });
  });
  na.addEventListener('change', () => {
    const cur = get('settings', s);
    cur.notifAppointments = na.checked;
    api.settings.set(cur).then(({ settings }) => set('settings', settings));
  });
  nm.addEventListener('change', () => {
    const cur = get('settings', s);
    cur.notifMedications = nm.checked;
    api.settings.set(cur).then(({ settings }) => set('settings', settings));
  });
};
export { initSettingsPage };
