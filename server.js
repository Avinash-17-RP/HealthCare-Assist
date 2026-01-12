const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
const { OAuth2Client } = (() => {
  try {
    return require('google-auth-library');
  } catch {
    return { OAuth2Client: function(){ return {}; } };
  }
})();

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: {}, appointments: [], medications: [], settings: {} }, null, 2));
}
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (db) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const session = db.sessions[token];
  if (!session) return res.status(401).json({ error: 'Invalid token' });
  const user = db.users.find(u => u.id === session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = user;
  req.token = token;
  req.db = db;
  next();
};

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = readDB();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = { id: uid(), name, email, password };
  db.users.push(user);
  writeDB(db);
  return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = uid();
  db.sessions[token] = { userId: user.id, createdAt: Date.now() };
  writeDB(db);
  return res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken, clientId } = req.body || {};
  const cid = clientId || process.env.GOOGLE_CLIENT_ID;
  if (!idToken || !cid) return res.status(400).json({ error: 'Missing idToken or clientId' });
  try {
    const client = new OAuth2Client(cid);
    let payload = null;
    if (client && client.verifyIdToken) {
      const ticket = await client.verifyIdToken({ idToken, audience: cid });
      payload = ticket.getPayload();
    } else {
      return res.status(500).json({ error: 'Google auth library not installed' });
    }
    const email = payload.email;
    const name = payload.name || email;
    if (!email) return res.status(400).json({ error: 'Email not present in token' });
    const db = readDB();
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = { id: uid(), name, email, password: null, provider: 'google', googleSub: payload.sub };
      db.users.push(user);
    } else {
      user.name = user.name || name;
    }
    const token = uid();
    db.sessions[token] = { userId: user.id, createdAt: Date.now() };
    writeDB(db);
    res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

app.get('/api/appointments', authMiddleware, (req, res) => {
  const appts = req.db.appointments.filter(a => a.userId === req.user.id);
  res.json({ items: appts });
});
app.post('/api/appointments', authMiddleware, (req, res) => {
  const { docName, department, dateTime, location } = req.body || {};
  if (!docName || !department || !dateTime || !location) return res.status(400).json({ error: 'Missing fields' });
  const appt = { id: uid(), userId: req.user.id, docName, department, dateTime, location, completed: false };
  const db = req.db;
  db.appointments.push(appt);
  writeDB(db);
  res.json({ ok: true, item: appt });
});
app.put('/api/appointments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = req.db;
  const idx = db.appointments.findIndex(a => a.id === id && a.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const cur = db.appointments[idx];
  const patch = req.body || {};
  db.appointments[idx] = { ...cur, ...patch };
  writeDB(db);
  res.json({ ok: true, item: db.appointments[idx] });
});
app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = req.db;
  const before = db.appointments.length;
  db.appointments = db.appointments.filter(a => !(a.id === id && a.userId === req.user.id));
  if (db.appointments.length === before) return res.status(404).json({ error: 'Not found' });
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/medications', authMiddleware, (req, res) => {
  const meds = req.db.medications.filter(m => m.userId === req.user.id);
  res.json({ items: meds });
});
app.post('/api/medications', authMiddleware, (req, res) => {
  const { name, dosage, frequency, duration } = req.body || {};
  if (!name || !dosage || !frequency || !duration) return res.status(400).json({ error: 'Missing fields' });
  const med = { id: uid(), userId: req.user.id, name, dosage, frequency: Number(frequency), duration: Number(duration), taken: {} };
  const db = req.db;
  db.medications.push(med);
  writeDB(db);
  res.json({ ok: true, item: med });
});
app.put('/api/medications/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = req.db;
  const idx = db.medications.findIndex(m => m.id === id && m.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const cur = db.medications[idx];
  const patch = req.body || {};
  db.medications[idx] = { ...cur, ...patch };
  writeDB(db);
  res.json({ ok: true, item: db.medications[idx] });
});
app.patch('/api/medications/:id/taken', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { dateKey, count } = req.body || {};
  if (!dateKey || typeof count !== 'number') return res.status(400).json({ error: 'Missing fields' });
  const db = req.db;
  const idx = db.medications.findIndex(m => m.id === id && m.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const cur = db.medications[idx];
  const taken = { ...(cur.taken || {}) };
  taken[dateKey] = count;
  db.medications[idx] = { ...cur, taken };
  writeDB(db);
  res.json({ ok: true, item: db.medications[idx] });
});

app.get('/api/reminders', authMiddleware, (req, res) => {
  const db = req.db;
  const appts = db.appointments.filter(a => a.userId === req.user.id);
  const meds = db.medications.filter(m => m.userId === req.user.id);
  const now = Date.now();
  const upcomingAppts = appts.filter(a => {
    const t = new Date(a.dateTime).getTime();
    return t > now && t - now < 24 * 3600 * 1000;
  }).map(a => ({ type: 'Appointment', title: `${a.docName} • ${a.department}`, time: new Date(a.dateTime).toLocaleTimeString() }));
  const medNotifs = meds.map(m => ({ type: 'Medication', title: `${m.name} • ${m.dosage}`, time: 'Today' }));
  res.json({ items: [...upcomingAppts, ...medNotifs] });
});

app.get('/api/settings', authMiddleware, (req, res) => {
  const db = req.db;
  const s = db.settings[req.user.id] || { dark: false, fontSize: 16, notifAppointments: true, notifMedications: true };
  res.json({ settings: s });
});
app.put('/api/settings', authMiddleware, (req, res) => {
  const db = req.db;
  const cur = db.settings[req.user.id] || { dark: false, fontSize: 16, notifAppointments: true, notifMedications: true };
  db.settings[req.user.id] = { ...cur, ...(req.body || {}) };
  writeDB(db);
  res.json({ ok: true, settings: db.settings[req.user.id] });
});

app.use(express.static(__dirname));

// Pretty path mappings for multi-page front-end
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/appointments', (req, res) => res.sendFile(path.join(__dirname, 'appointments.html')));
app.get('/medications', (req, res) => res.sendFile(path.join(__dirname, 'medications.html')));
app.get('/reminders', (req, res) => res.sendFile(path.join(__dirname, 'reminders.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'settings.html')));
app.get('/help', (req, res) => res.sendFile(path.join(__dirname, 'help.html')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
