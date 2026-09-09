import { store } from "./api.js";
import { $, esc, fmtDate, daysLeft, randomKey, csv, download, modal, confirmAction, toast } from "./utils.js";

let state={rows:[],page:1,search:"",status:""};
const statuses=["Unused","Active","Expired","Disabled","Banned","Revoked"];
const status=s=>`<span class="badge ${String(s||"unused").toLowerCase()}">${esc(s||"Unused")}</span>`;

export async function renderKeys(v){
  state.rows=await store.list("keys");
  if(!Array.isArray(state.rows)) state.rows=[];
  draw(v);
}

async function getPackages(){
  const rows=await store.list("packages");
  return Array.isArray(rows)?rows:[];
}

function packageOptions(packages, selected=""){
  return `<option value="">— Chọn package —</option>`+
    packages.map(p=>{
      const token=p.token||"";
      const label=p.name?`${p.name} (${token})`:token;
      return `<option value="${esc(token)}" ${selected===token?"selected":""} data-name="${esc(p.name||"")}" data-token="${esc(token)}">${esc(label)}</option>`;
    }).join("");
}

function draw(v){
  const filtered=state.rows.filter(x=>{
    const q=state.search.toLowerCase();
    return (!q||[x.key,x.keyName,x.package,x.packageName,x.tweak,x.deviceId].some(a=>String(a||"").toLowerCase().includes(q)))
      &&(!state.status||x.status===state.status);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/25));
  state.page=Math.min(state.page,pages);
  const rows=filtered.slice((state.page-1)*25,state.page*25);

  v.innerHTML=`<div class="page-head"><div><h1>Khóa</h1><p class="muted">Tạo và quản lý giấy phép.</p></div>
  <div class="page-actions"><button class="btn" id="copyAll">Sao chép tất cả</button><button class="btn" id="export">Xuất CSV</button><button class="btn primary" id="generate">Tạo khóa</button></div></div>
  <div class="section-card"><div class="toolbar"><input id="search" class="field-input" placeholder="Tìm khóa, tên, thiết bị, package, tweak" value="${esc(state.search)}">
  <select id="status"><option value="">Tất cả trạng thái</option>${statuses.map(s=>`<option ${state.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>Key</th><th>Tên</th><th>Trạng thái</th><th>Package</th><th>Tweak</th><th>Thiết bị</th><th>Tạo lúc</th><th>Hết hạn</th><th>Thao tác</th></tr></thead>
  <tbody>${rows.length?rows.map(x=>`<tr>
  <td><code>${esc(x.key)}</code></td><td>${esc(x.keyName||"—")}</td><td>${status(x.status)}</td><td>${esc(x.packageName||x.package||"—")}</td>
  <td>${esc(x.tweak||"—")}</td><td>${esc(x.deviceId||"—")}</td><td>${fmtDate(x.createdAt)}</td>
  <td>${x.expiresAt==="lifetime"?"Vĩnh viễn":`${fmtDate(x.expiresAt)}<br><small>${daysLeft(x.expiresAt)}</small>`}</td>
  <td><button class="btn" data-copy="${esc(x.key)}">Copy</button>
  ${x.status!=="Banned"?`<button class="btn danger" data-ban="${esc(x.id)}">Cấm</button>`:""}
  <button class="btn" data-edit="${esc(x.id)}">Sửa</button><button class="btn danger" data-delete="${esc(x.id)}">Xóa</button></td></tr>`).join("")
  :`<tr><td colspan="9"><div class="empty">Không tìm thấy khóa.</div></td></tr>`}</tbody></table></div>
  <div class="pagination"><span>${filtered.length} khóa · Page ${state.page}/${pages}</span><div class="actions"><button class="btn" id="prev">‹</button><button class="btn" id="next">›</button></div></div></div>`;

  $("#search").oninput=e=>{state.search=e.target.value;state.page=1;draw(v)};
  $("#status").onchange=e=>{state.status=e.target.value;state.page=1;draw(v)};
  $("#prev").onclick=()=>{if(state.page>1){state.page--;draw(v)}};
  $("#next").onclick=()=>{if(state.page<pages){state.page++;draw(v)}};
  $("#generate").onclick=()=>gen(v);
  $("#copyAll").onclick=async()=>{await navigator.clipboard.writeText(filtered.map(x=>x.key).join("\n"));toast("Đã sao chép các khóa đang hiển thị")};
  $("#export").onclick=()=>download("keys.csv",csv([["Key","Name","Status","Package","Tweak","Device","Created","Expires","Last Used"],...filtered.map(x=>[x.key,x.keyName,x.status,x.package,x.tweak,x.deviceId,x.createdAt,x.expiresAt,x.lastUsedAt])]),"text/csv");
  v.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.copy).then(()=>toast("Đã sao chép khóa")));
  v.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(await confirmAction("Xóa khóa","Thao tác này sẽ xóa vĩnh viễn khóa.")){await store.remove("keys",b.dataset.delete);toast("Đã xóa khóa");renderKeys(v)}});
  v.querySelectorAll("[data-ban]").forEach(b=>b.onclick=async()=>{
    const x=state.rows.find(k=>k.id===b.dataset.ban); if(!x)return;
    if(await confirmAction("Cấm khóa",`Cấm khóa ${x.key}? Trạng thái sẽ chuyển thành Đã cấm.`)){
      await store.update("keys",x.id,{status:"Banned",bannedAt:new Date().toISOString()});
      await navigator.clipboard.writeText(x.key).catch(()=>{});
      toast("Đã cấm và sao chép khóa");
      renderKeys(v);
    }
  });
  v.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(v,state.rows.find(x=>x.id===b.dataset.edit)));
}

async function gen(v){
  const packages=await getPackages();
  modal("Tạo khóa",`<form id="keyForm" class="form-grid">
  <div class="field"><label>Package</label><select name="package" id="packageSelect" required>${packageOptions(packages)}</select></div>
  <div class="field"><label>Tên khóa</label><input name="keyName" id="keyName" placeholder="Package name"></div>
  <div class="field"><label>Tiền tố</label><input name="prefix" id="prefix" value="AUTH"></div>
  <div class="field"><label>Độ dài</label><input name="length" type="number" min="5" max="64" value="20"></div>
  <div class="field"><label>Số lượng</label><select name="quantity">${[1,10,50,100,500,1000].map(n=>`<option>${n}</option>`).join("")}</select></div>
  <div class="field"><label>Thời hạn</label><select name="expiration"><option value="1">1 ngày</option><option value="3">3 ngày</option><option value="7">7 ngày</option><option value="30" selected>30 ngày</option><option value="90">90 ngày</option><option value="365">1 năm</option><option value="lifetime">Vĩnh viễn</option></select></div>
  <div class="field"><label>Số thiết bị tối đa</label><input name="maxDevices" type="number" min="1" value="1"></div>
  <div class="field"><label>Tweak</label><input name="tweak"></div>
  <div class="field wide"><label>Ghi chú</label><textarea name="note"></textarea></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#keyForm"));
    const qty=Number(f.get("quantity")); const now=new Date();
    const packageToken=String(f.get("package")||"").trim();
    const pkg=packages.find(p=>String(p.token||"")===packageToken)||{};
    if(!packageToken) { toast("Package chưa có token"); return; }
    const packageName=f.get("keyName")||pkg.name||packageToken;
    const exp=f.get("expiration")==="lifetime"?"lifetime":new Date(now.getTime()+Number(f.get("expiration"))*86400000).toISOString();
    for(let i=0;i<qty;i++) await store.create("keys",{
      key:randomKey(f.get("prefix"),Number(f.get("length"))),
      keyName:packageName,status:"Unused",package:packageToken,packageName:pkg.name||packageName,
      packageToken:packageToken,tweak:f.get("tweak"),note:f.get("note"),maxDevices:Number(f.get("maxDevices")),
      createdAt:now.toISOString(),expiresAt:exp
    });
    toast(`Đã tạo ${qty} khóa`); renderKeys(v);
  });
}

function edit(v,x){
  getPackages().then(packages=>modal("Sửa khóa",`<form id="editForm" class="form-grid">
  <div class="field"><label>Trạng thái</label><select name="status">${statuses.map(s=>`<option ${x.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
  <div class="field"><label>Tên khóa</label><input name="keyName" value="${esc(x.keyName||"")}"></div>
  <div class="field"><label>Số thiết bị tối đa</label><input name="maxDevices" type="number" min="1" value="${x.maxDevices||1}"></div>
  <div class="field"><label>Package</label><select name="package">${packageOptions(packages,x.package||"")}</select></div>
  <div class="field"><label>Tweak</label><input name="tweak" value="${esc(x.tweak||"")}"></div>
  <div class="field wide"><label>Ghi chú</label><textarea name="note">${esc(x.note||"")}</textarea></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#editForm"));
    const packageToken=String(f.get("package")||"").trim(); const pkg=packages.find(p=>String(p.token||"")===packageToken)||{};
    if(!packageToken) { toast("Package chưa có token"); return; }
    await store.update("keys",x.id,{status:f.get("status"),keyName:f.get("keyName"),maxDevices:Number(f.get("maxDevices")),
      package:packageToken,packageName:pkg.name||packageToken,packageToken:packageToken,tweak:f.get("tweak"),note:f.get("note"),updatedAt:new Date().toISOString()});
    toast("Đã cập nhật khóa"); renderKeys(v);
  }));
}
