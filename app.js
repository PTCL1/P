// ====== CONFIG ======
const API_URL = 'https://script.google.com/macros/s/AKfycbxVM_euuBkWOhjzRWfushPeNoDgnkmj5LnrwVV-0ZJC7ZfVBnuRsoKZ0gRTIwGMFl65OA/exec';
const API_TIMEOUT_MS = 15000;

async function api(action, data = {}) {
  const body = new URLSearchParams();
  body.set('action', action);
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    body.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res, text;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json,text/plain,*/*'
      },
      body,
      cache: 'no-store',
      signal: controller.signal
    });
    text = await res.text();
  } catch (err) {
    if (err && err.name === 'AbortError') throw new Error('Request timeout');
    throw new Error('Network error');
  } finally {
    clearTimeout(timer);
  }

  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Invalid JSON: ' + String(text).slice(0, 200)); }

  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  if (!json.ok) throw new Error(json.error || 'API error');
  return json;
}

// ====== AUTH STORAGE ======
function saveToken(t) { localStorage.setItem('ep_token', t); }
function getToken() { return localStorage.getItem('ep_token'); }
function clearAuth() {
  localStorage.removeItem('ep_token');
  localStorage.removeItem('ep_name');
}

// ====== API WRAPPERS ======
async function login(empId, password) {
  const r = await api('login', { empId, password });
  if (r.token) saveToken(r.token);
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
  clearAuth();
  window.location.href = 'index.html';
}
