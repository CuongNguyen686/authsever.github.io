import { isUnlocked, logout } from "./auth.js";
import { store } from "./api.js";
import { $, $$, esc, fmtDate, toast } from "./utils.js";
import { renderDashboard } from "./statistics.js";
import { renderKeys } from "./keys.js";
import { renderDevices } from "./devices.js";
import { renderPackages } from "./packages.js";
import { renderTweaks } from "./tweaks.js";
import { renderBlacklist } from "./blacklist.js";
import { renderLogs } from "./logs.js";

if(!isUnlocked()) location.replace("index.html");
const routes={dashboard:["Dashboard",renderDashboard],keys:["Keys",renderKeys],devices:["Devices",renderDevices],packages:["Packages",renderPackages],tweaks:["Tweaks",renderTweaks],blacklist:["Blacklist",renderBlacklist],logs:["Logs",renderLogs],statistics:["Statistics",renderDashboard],docs:["API Docs",renderDocs],settings:["Settings",renderSettings]};
const icons={dashboard:"⌂",keys:"⚿",devices:"▣",packages:"▦",tweaks:"✦",blacklist:"⊘",logs:"≡",statistics:"◔",docs:"◇",settings:"⚙"};
const nav=$("#mainNav");
nav.innerHTML=Object.entries(routes).map(([k,[n]])=>`<button class="nav-item" data-route="${k}"><span class="nav-icon">${icons[k]}</span><span>${n}</span></button>`).join("");
$("#logoutBtn").onclick=logout;
$("#menuBtn").onclick=()=>{$("#sidebar").classList.add("open");$("#drawerBackdrop").classList.add("open")};
$("#drawerBackdrop").onclick=()=>{$("#sidebar").classList.remove("open");$("#drawerBackdrop").classList.remove("open")};
$$(".nav-item",nav).forEach(b=>b.onclick=()=>go(b.dataset.route));
$("#refreshBtn").onclick=()=>go(location.hash.slice(1)||"dashboard");
const dbStatus=$("#dbStatus");
async function health(){try{await store.health();dbStatus.textContent=`${store.mode()} connected`;dbStatus.className="status-pill"}catch(e){dbStatus.textContent="Connection failed";dbStatus.className="status-pill bad";toast(e.message,"error")}}
async function go(route){route=routes[route]?route:"dashboard";location.hash=route;$$(".nav-item",nav).forEach(b=>b.classList.toggle("active",b.dataset.route===route));$("#sidebar").classList.remove("open");$("#drawerBackdrop").classList.remove("open");const v=$("#view");v.innerHTML='<div class="loading">Loading…</div>';try{await routes[route][1](v)}catch(e){v.innerHTML=`<div class="alert error"><strong>Unable to load this view.</strong><br>${esc(e.message)}<br><button class="btn" id="retry">Retry</button></div>`;$("#retry").onclick=()=>go(route)}}
function renderDocs(v){v.innerHTML=`<div class="page-head"><div><h1>API Docs</h1><p class="muted">REST contract for your external API server.</p></div></div><div class="section-card doc"><h3>Authentication</h3><p>Protect admin endpoints server-side. Never put a private API secret in this static frontend.</p><h3>Client endpoints</h3><div class="code">POST /auth/validate
POST /auth/activate
POST /auth/heartbeat</div><h3>Request</h3><div class="code">{
  "key": "AUTH-7X82K-92HDQ-91KQ",
  "device_id": "device-hash",
  "package": "com.example.tweak",
  "version": "1.0.0"
}</div><h3>Responses</h3><p><b>Valid</b>, <b>Invalid</b>, <b>Expired</b>, <b>Banned</b>, <b>Device mismatch</b>, <b>Package mismatch</b>, timeout and server-error responses should be explicit JSON.</p></div>`}
async function renderSettings(v){let s={};try{s=await store.get("settings","global")}catch{};v.innerHTML=`<div class="page-head"><div><h1>Settings</h1><p class="muted">Runtime configuration stored in the configured data source.</p></div></div><div class="section-card"><form id="settingsForm" class="form-grid"><div class="field"><label>Site Name</label><input name="siteName" value="${esc(s.siteName||"API Key Manager")}"></div><div class="field"><label>API URL</label><input name="apiUrl" value="${esc(s.apiUrl||"")}"></div><div class="field"><label>Default Expiration (days)</label><input name="expirationDays" type="number" min="0" value="${s.expirationDays??30}"></div><div class="field"><label>Default Max Devices</label><input name="maxDevices" type="number" min="1" value="${s.maxDevices??1}"></div><div class="field"><label>Offline Grace (minutes)</label><input name="offlineGraceMinutes" type="number" min="0" value="${s.offlineGraceMinutes??0}"></div><div class="field checkbox"><input name="maintenance" type="checkbox" ${s.maintenance?"checked":""}><label>Maintenance mode</label></div><div class="wide"><button class="btn primary">Save Settings</button></div></form></div>`;$("#settingsForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await store.update("settings","global",{siteName:f.get("siteName"),apiUrl:f.get("apiUrl"),expirationDays:Number(f.get("expirationDays")),maxDevices:Number(f.get("maxDevices")),offlineGraceMinutes:Number(f.get("offlineGraceMinutes")),maintenance:f.has("maintenance"),updatedAt:new Date().toISOString()});toast("Settings saved")}}
window.addEventListener("hashchange",()=>go(location.hash.slice(1)||"dashboard"));
health();go(location.hash.slice(1)||"dashboard");