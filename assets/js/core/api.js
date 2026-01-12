const base = () => window.location.origin;
const token = () => localStorage.getItem('api_token');
const authHeader = () => token() ? { 'Authorization': `Bearer ${token()}` } : {};
const json = async (method, url, body, requireAuth = false) => {
  const res = await fetch(`${base()}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(requireAuth ? authHeader() : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const api = {
  signup: (payload) => json('POST', '/api/auth/signup', payload),
  login: async (email, password) => {
    const data = await json('POST', '/api/auth/login', { email, password });
    localStorage.setItem('api_token', data.token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    return data;
  },
  googleLogin: async (idToken, clientId) => {
    const data = await json('POST', '/api/auth/google', { idToken, clientId });
    localStorage.setItem('api_token', data.token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    return data;
  },
  me: () => json('GET', '/api/me', null, true),
  appointments: {
    list: () => json('GET', '/api/appointments', null, true),
    add: (payload) => json('POST', '/api/appointments', payload, true),
    update: (id, payload) => json('PUT', `/api/appointments/${id}`, payload, true),
    remove: (id) => json('DELETE', `/api/appointments/${id}`, null, true)
  },
  medications: {
    list: () => json('GET', '/api/medications', null, true),
    add: (payload) => json('POST', '/api/medications', payload, true),
    update: (id, payload) => json('PUT', `/api/medications/${id}`, payload, true),
    taken: (id, dateKey, count) => json('PATCH', `/api/medications/${id}/taken`, { dateKey, count }, true)
  },
  reminders: {
    list: () => json('GET', '/api/reminders', null, true)
  },
  settings: {
    get: () => json('GET', '/api/settings', null, true),
    set: (payload) => json('PUT', '/api/settings', payload, true)
  }
};
export { api };
