import { currentUser, logout } from './auth.js';
import { toast } from './ui.js';
const initProfileMenu = () => {
  const cu = currentUser();
  const btn = document.getElementById('avatarBtn');
  const nameSpan = document.getElementById('avatarName');
  const pop = document.getElementById('profilePopover');
  const logoutBtn = document.getElementById('logoutInPopover');
  const loginLink = document.getElementById('loginLink');
  const signupLink = document.getElementById('signupLink');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  if (!btn || !pop || !logoutBtn) return;
  if (cu) {
    nameSpan.textContent = cu.name?.split(' ')[0] || 'User';
    btn.classList.remove('hidden');
    if (loginLink) loginLink.classList.add('hidden');
    if (signupLink) signupLink.classList.add('hidden');
    if (profileName) profileName.textContent = cu.name || 'User';
    if (profileEmail) profileEmail.textContent = cu.email || '';
  } else {
    btn.classList.add('hidden');
    if (loginLink) loginLink.classList.remove('hidden');
    if (signupLink) signupLink.classList.remove('hidden');
  }
  btn.addEventListener('click', () => {
    pop.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!pop.classList.contains('hidden')) {
      if (e.target !== btn && !pop.contains(e.target)) pop.classList.add('hidden');
    }
  });
  logoutBtn.addEventListener('click', () => {
    logout();
    pop.classList.add('hidden');
    toast('Logged out', 'info');
    location.href = 'index.html';
  });
};
export { initProfileMenu };
