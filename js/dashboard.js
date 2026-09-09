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
const routes={dashboard:["Tổng quan",renderDashboard],keys:["Khóa",renderKeys],devices:["Thiết bị",renderDevices],packages:["Package",renderPackages],tweaks:["Tweak",renderTweaks],blacklist:["Danh sách chặn",renderBlacklist],logs:["Nhật ký",renderLogs],statistics:["Thống kê",renderDashboard],docs:["Tài liệu API",renderDocs],settings:["Cài đặt",renderCài đặt]};
const icons={dashboard:"⌂",keys:"⚿",devices:"▣",packages:"▦",tweaks:"✦",blacklist:"⊘",logs:"≡",statistics:"◔",docs:"◇",settings:"⚙"};
const nav=$("#mainNav");
nav.innerHTML=Object.entries(routes).map(([k,[n]])=>`<button class="nav-item" data-route="${k}"><span class="nav-icon">${icons[k]}</span><span>${n}</span></button>`).join("");
$("#logoutBtn").onclick=logout;
$("#menuBtn").onclick=()=>{$("#sidebar").classList.add("open");$("#drawerBackdrop").classList.add("open")};
$("#drawerBackdrop").onclick=()=>{$("#sidebar").classList.remove("open");$("#drawerBackdrop").classList.remove("open")};
$$(".nav-item",nav).forEach(b=>b.onclick=()=>go(b.dataset.route));
$("#refreshBtn").onclick=()=>go(location.hash.slice(1)||"dashboard");
const dbStatus=$("#dbStatus");
async function health(){try{await store.health();dbStatus.textContent="Firebase đã kết nối";dbStatus.className="status-pill"}catch(e){dbStatus.textContent="Kết nối thất bại";dbStatus.className="status-pill bad";toast(e.message,"error")}}
async function go(route){route=routes[route]?route:"dashboard";location.hash=route;$$(".nav-item",nav).forEach(b=>b.classList.toggle("active",b.dataset.route===route));$("#sidebar").classList.remove("open");$("#drawerBackdrop").classList.remove("open");const v=$("#view");v.innerHTML='<div class="loading">Đang tải…</div>';try{await routes[route][1](v)}catch(e){v.innerHTML=`<div class="alert error"><strong>Không thể tải trang này.</strong><br>${esc(e.message)}<br><button class="btn" id="retry">Thử lại</button></div>`;$("#retry").onclick=()=>go(route)}}
function renderDocs(v){v.innerHTML=`<div class="page-head"><div><h1>Tài liệu API</h1><p class="muted">Tài liệu REST cho máy chủ API bên ngoài.</p></div></div><div class="section-card doc"><h3>Xác thực</h3><p>Bảo vệ quyền quản trị ở phía máy chủ. Không đặt bí mật riêng tư vào frontend tĩnh.</p><h3>Luồng xác thực Firebase</h3><div class="code">Theos → Firebase /keys
Theos → Firebase /packages
Theos → Firebase /keyDevices
Theos → Firebase /devices
Web ← Firebase Realtime Database</div><h3>Yêu cầu</h3><div class="code">{
  "key": "AUTH-7X82K-92HDQ-91KQ",
  "device_id": "device-hash",
  "package": "com.example.tweak",
  "version": "1.0.0"
}</div><h3>Phản hồi</h3><p><b>Hợp lệ</b>, <b>Không hợp lệ</b>, <b>Hết hạn</b>, <b>Bị cấm</b>, <b>Sai thiết bị</b>, <b>Sai package</b>, timeout và lỗi máy chủ cần trả về JSON rõ ràng.</p></div>`}
async function renderCài đặt(v){let s={};try{s=await store.get("settings","global")}catch{};v.innerHTML=`<div class="page-head"><div><h1>Cài đặt</h1><p class="muted">Cấu hình runtime được lưu trực tiếp trong Firebase.</p></div></div><div class="section-card"><form id="settingsForm" class="form-grid"><div class="field"><label>Tên website</label><input name="siteName" value="${esc(s.siteName||"Quản lý khóa API")}"></div><div class="field"><label>URL API</label><input name="apiUrl" value="${esc(s.apiUrl||"")}"></div><div class="field"><label>Thời hạn mặc định (ngày)</label><input name="expirationDays" type="number" min="0" value="${s.expirationDays??30}"></div><div class="field"><label>Số thiết bị tối đa mặc định</label><input name="maxDevices" type="number" min="1" value="${s.maxDevices??1}"></div><div class="field"><label>Thời gian ngoại tuyến (phút)</label><input name="offlineGraceMinutes" type="number" min="0" value="${s.offlineGraceMinutes??0}"></div><div class="field checkbox"><input name="maintenance" type="checkbox" ${s.maintenance?"checked":""}><label>Chế độ bảo trì</label></div><div class="wide"><button class="btn primary">Lưu cài đặt</button></div></form></div>`;$("#settingsForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await store.update("settings","global",{siteName:f.get("siteName"),apiUrl:f.get("apiUrl"),expirationDays:Number(f.get("expirationDays")),maxDevices:Number(f.get("maxDevices")),offlineGraceMinutes:Number(f.get("offlineGraceMinutes")),maintenance:f.has("maintenance"),updatedAt:new Date().toISOString()});toast("Đã lưu cài đặt")}}
window.addEventListener("hashchange",()=>go(location.hash.slice(1)||"dashboard"));
health();
let realtimeStarted=false;
async function startRealtime(){
  if(realtimeStarted || store.mode()!=="firebase") return;
  realtimeStarted=true;
  for(const resource of ["keys","packages","devices","tweaks","blacklist","logs","settings"]){
    try{ await store.subscribe(resource,()=>{ const route=location.hash.slice(1)||"dashboard"; go(route); }); }
    catch(e){ console.warn("Firebase realtime",resource,e); }
  }
}
startRealtime();
go(location.hash.slice(1)||"dashboard");