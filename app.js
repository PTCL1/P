// ====== CONFIG ======
const API_URL = 'https://script.google.com/a/macros/AKfycbxVM_euuBkWOhjzRWfushPeNoDgnkmj5LnrwVV-0ZJC7ZfVBnuRsoKZ0gRTIwGMFl65OA/exec'; // e.g. https://script.google.com/macros/s/AKfycbx.../exec

async function api(action, data = {}) {
  const body = new URLSearchParams({ action, ...data });
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: 'Invalid JSON', raw: text }; }
  if (!json.ok) throw new Error(json.error || 'API error');
  return json;
}

// ====== AUTH STORAGE ======
function saveToken(t) { localStorage.setItem('ep_token', t); }
function getToken() { return localStorage.getItem('ep_token'); }
function clearToken() { localStorage.removeItem('ep_token'); }

// ====== API WRAPPERS ======
async function login(empId, password) {
  const r = await api('login', { empId, password });
  saveToken(r.token);
  if (r.profile && r.profile.Name) localStorage.setItem('ep_name', r.profile.Name);
  return r;
}
async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error('No token');
  const r = await api('me', { token });
  return r.data;
}
async function applyLeave(payload) {
  const token = getToken();
  if (!token) throw new Error('No token');
  return api('applyleave', { token, ...payload });
}
async function logout() {
  const token = getToken();
  if (token) { try { await api('logout', { token }); } catch(e){} }
  clearToken();
  window.location.href = 'index.html';
}
