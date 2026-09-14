import { CONFIG } from "./config.js";

let app = null;
let database = null;
let fns = null;

const firebaseBase = () => String(CONFIG.firebase?.databaseURL || "").replace(/\/$/, "");

function firebaseError(status, body, fallback = "Firebase request failed") {
  let message = "";
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    message = parsed?.error?.message || parsed?.error || parsed?.message || "";
  } catch (_) {
    message = String(body || "").trim();
  }
  if (status === 401) message = message || "Firebase 401 - Unauthorized";
  else if (status === 403) message = message || "Firebase 403 - Permission denied";
  else if (status >= 500) message = message || `Firebase ${status} - Server error`;
  else message = message || `${fallback} (HTTP ${status})`;
  const err = new Error(message);
  err.status = status;
  err.firebase = true;
  return err;
}

function firebaseURL(path) {
  const clean = String(path || "").replace(/^\/+|\/+$/g, "");
  return `${firebaseBase()}/${clean ? clean + ".json" : ".json"}`;
}

async function firebaseREST(method, path, payload) {
  if (!firebaseBase()) throw new Error("Firebase databaseURL chưa được cấu hình.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const options = { method, signal: controller.signal, headers: {} };
    if (payload !== undefined && method !== "GET") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }
    let response;
    try {
      response = await fetch(firebaseURL(path), options);
    } catch (e) {
      if (e?.name === "AbortError") throw new Error("Không thể kết nối Firebase: timeout sau 12 giây.");
      throw new Error(`Không thể kết nối Firebase: ${e?.message || "Network error"}`);
    }
    const text = await response.text();
    if (!response.ok) throw firebaseError(response.status, text);
    if (!text) return null;
    try { return JSON.parse(text); }
    catch (_) { throw new Error(`Firebase trả về dữ liệu JSON không hợp lệ (HTTP ${response.status}).`); }
  } finally {
    clearTimeout(timer);
  }
}

async function firebaseSDKInit() {
  if (database) return database;
  if (!CONFIG.firebase?.apiKey || !firebaseBase()) throw new Error("Firebase chưa được cấu hình.");
  try {
    const [appMod, dbMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js")
    ]);
    app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(CONFIG.firebase);
    database = dbMod.getDatabase(app);
    fns = dbMod;
    return database;
  } catch (e) {
    throw new Error(`Không tải được Firebase SDK realtime: ${e?.message || e}`);
  }
}

const apiFetch = async (path, opts = {}) => {
  const base = CONFIG.API_BASE_URL.replace(/\/$/, "");
  const url = `${base}/${path.replace(/^\//, "")}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let r;
    try { r = await fetch(url, { ...opts, signal: controller.signal, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } }); }
    catch (e) { throw new Error(e?.name === "AbortError" ? "API timeout sau 12 giây." : `Không thể kết nối API: ${e?.message || "Network error"}`); }
    const text = await r.text();
    let d = {};
    try { d = text ? JSON.parse(text) : {}; } catch { throw new Error(`Phản hồi JSON không hợp lệ (HTTP ${r.status})`); }
    if (!r.ok) throw new Error(d.message || d.error || `HTTP ${r.status}`);
    return d;
  } finally { clearTimeout(timer); }
};

const normalize = x => Array.isArray(x) ? x : Object.entries(x || {}).map(([id, v]) => ({ id, ...(v || {}) }));

export const store = {
  mode: () => CONFIG.API_BASE_URL.trim() ? "api" : "firebase",

  list: async resource => CONFIG.API_BASE_URL.trim()
    ? apiFetch(resource)
    : normalize(await firebaseREST("GET", resource)),

  get: async (resource, id) => CONFIG.API_BASE_URL.trim()
    ? apiFetch(`${resource}/${encodeURIComponent(id)}`)
    : firebaseREST("GET", `${resource}/${encodeURIComponent(id)}`),

  create: async (resource, payload) => {
    if (CONFIG.API_BASE_URL.trim()) return apiFetch(resource, { method: "POST", body: JSON.stringify(payload) });
    const result = await firebaseREST("POST", resource, payload);
    return { id: result?.name, ...payload };
  },

  update: async (resource, id, payload) => CONFIG.API_BASE_URL.trim()
    ? apiFetch(`${resource}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) })
    : firebaseREST("PATCH", `${resource}/${encodeURIComponent(id)}`, payload),

  remove: async (resource, id) => CONFIG.API_BASE_URL.trim()
    ? apiFetch(`${resource}/${encodeURIComponent(id)}`, { method: "DELETE" })
    : firebaseREST("DELETE", `${resource}/${encodeURIComponent(id)}`),

  health: async () => {
    if (CONFIG.API_BASE_URL.trim()) return apiFetch("health");
    // Test the exact Firebase collection the dashboard needs, not the root.
    await firebaseREST("GET", "packages?shallow=true");
    return { ok: true, mode: "firebase-rest", databaseURL: firebaseBase() };
  },

  subscribe: async (resource, callback) => {
    await firebaseSDKInit();
    return fns.onValue(fns.ref(database, resource), s => callback(normalize(s.val())));
  }
};
