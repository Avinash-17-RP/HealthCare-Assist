import { api } from './api.js';
import { toast } from './ui.js';

const loadScript = (src) => new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.onload = resolve;
  s.onerror = reject;
  document.head.appendChild(s);
});

const clientIdFromMeta = () => {
  const m = document.querySelector('meta[name="google-client-id"]');
  return (m && m.content) ? m.content.trim() : '';
};

const clientId = () => {
  return localStorage.getItem('google_client_id') || clientIdFromMeta() || '';
};

const initGoogleLogin = async () => {
  const container = document.getElementById('googleSignInContainer');
  if (!container) return;
  const cid = clientId();
  if (!cid) {
    const btn = document.createElement('button');
    btn.className = 'google-btn';
    btn.innerHTML = '<img src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" alt="G"> Continue with Google';
    btn.addEventListener('click', () => {
      toast('Set Google Client ID to enable Google login', 'info');
    });
    container.appendChild(btn);
    return;
  }
  try {
    await loadScript('https://accounts.google.com/gsi/client');
    /* global google */
    if (!window.google || !google.accounts || !google.accounts.id) {
      throw new Error('Google Identity Services not available');
    }
    google.accounts.id.initialize({
      client_id: cid,
      callback: async (response) => {
        const idToken = response.credential;
        try {
          const { user } = await api.googleLogin(idToken, cid);
          toast(`Welcome, ${user.name}`, 'success');
          location.href = 'dashboard.html';
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });
    const btn = document.createElement('div');
    btn.id = 'googleButton';
    container.appendChild(btn);
    google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', shape: 'pill' });
  } catch (err) {
    const fallback = document.createElement('button');
    fallback.className = 'google-btn';
    fallback.innerHTML = '<img src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" alt="G"> Continue with Google';
    fallback.addEventListener('click', () => toast('Google Sign-In failed to load', 'error'));
    container.appendChild(fallback);
  }
};

export { initGoogleLogin };
