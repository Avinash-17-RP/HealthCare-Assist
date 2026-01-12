import { toast } from '../core/ui.js';
import { api } from '../core/api.js';
const buildNotifications = async () => {
  const { items } = await api.reminders.list();
  return items;
};
const renderPanel = () => {
  const panel = document.getElementById('notificationsPanel');
  panel.innerHTML = '';
  buildNotifications().then(items => {
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'No notifications right now';
      panel.appendChild(empty);
      return;
    }
    items.forEach(n => {
      const el = document.createElement('div');
      el.className = 'notif';
      el.innerHTML = `<span class=\"badge\">${n.type}</span><div>${n.title}</div><div class=\"muted\">${n.time}</div>`;
      panel.appendChild(el);
    });
  }).catch(err => {
    const e = document.createElement('div');
    e.className = 'muted';
    e.textContent = err.message;
    panel.appendChild(e);
  });
};
const initRemindersPage = () => {
  renderPanel();
  const btn = document.getElementById('previewReminder');
  btn.addEventListener('click', () => {
    toast('Reminder: upcoming care task', 'info');
  });
};
export { initRemindersPage, buildNotifications };
