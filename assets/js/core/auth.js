import { get, set } from './storage.js';
import { api } from './api.js';
const signup = ({ name, email, password }) => api.signup({ name, email, password }).then(d => ({ ok: true, user: d.user })).catch(e => ({ ok: false, error: e.message }));
const login = (email, password, { remember } = {}) => api.login(email, password).then(d => {
  set('current_user', d.user);
  return { ok: true, user: d.user };
}).catch(e => ({ ok: false, error: e.message }));
const logout = () => {
  localStorage.removeItem('api_token');
  set('current_user', null);
};
const currentUser = () => get('current_user', null);
const requireAuth = () => {
  if (!localStorage.getItem('api_token')) location.href = 'login.html';
};
const greeting = () => {
  const h = new Date().getHours();
  const cu = currentUser();
  const base = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  return cu ? `${base}, ${cu.name}!` : `${base}!`;
};
export { signup, login, logout, currentUser, requireAuth, greeting };
