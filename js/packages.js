import { store } from "./api.js";
import { $, esc, modal, confirmAction, toast, randomKey } from "./utils.js";

export async function renderPackages(v){
  const rows=await store.list("packages");
  v.innerHTML=`<div class="page-head"><div><h1>Packages</h1><p class="muted">Quản lý package, tên và token client.</p></div><button class="btn primary" id="create">Tạo package</button></div>
  <div class="section-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tên</th><th>Token</th><th>Phiên bản</th><th>Min</th><th>Max</th><th>Trạng thái</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
  <tbody>${rows.length?rows.map(x=>`<tr><td>${esc(x.name||"")}</td><td><code>${esc(x.token||"—")}</code></td><td>${esc(x.version||"")}</td><td>${esc(x.minVersion||"—")}</td><td>${esc(x.maxVersion||"—")}</td><td>${esc(x.status||"Enabled")}</td><td>${esc(x.description||"")}</td>
  <td><button class="btn" data-token="${esc(x.id)}">Token</button> <button class="btn" data-copy="${esc(x.token||"")}">Sao chép token</button> <button class="btn" data-edit="${esc(x.id)}">Sửa</button> <button class="btn danger" data-del="${esc(x.id)}">Xóa</button></td></tr>`).join("")
  :`<tr><td colspan="8"><div class="empty">Chưa có package nào.</div></td></tr>`}</tbody></table></div></div>`;

  $("#create").onclick=()=>form(v,null,rows);
  v.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>form(v,rows.find(x=>x.id===b.dataset.edit),rows));
  v.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(await confirmAction("Xóa package","Xóa package này?")){await store.remove("packages",b.dataset.del);toast("Đã xóa package");renderPackages(v)}});
  v.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>b.dataset.copy?navigator.clipboard.writeText(b.dataset.copy).then(()=>toast("Đã sao chép token package")):toast("Package chưa có token"));
  v.querySelectorAll("[data-token]").forEach(b=>b.onclick=()=>tokenForm(v,rows.find(x=>x.id===b.dataset.token)));
}

function makeToken(){ return "PKG-"+randomKey("",24).replace(/^-+/,""); }

async function syncKeyPackageToken(oldToken,newToken,packageName){
  if(!oldToken || oldToken===newToken) return;
  const keys=await store.list("keys");
  const affected=(Array.isArray(keys)?keys:[]).filter(k=>String(k.packageToken||k.package||"")===String(oldToken));
  await Promise.all(affected.map(k=>store.update("keys",k.id,{package:newToken,packageToken:newToken,packageName:packageName||k.packageName||"",updatedAt:new Date().toISOString()})));
}

function tokenForm(v,x){
  const token=x.token||makeToken();
  modal("Token package",`<form id="tf" class="form-grid"><div class="field wide"><label>Token</label><input name="token" value="${esc(token)}" required></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#tf")); const t=String(f.get("token")).trim();
    const oldToken=String(x.token||"").trim();
    const duplicate=(await store.list("packages")).some(r=>String(r.id)!==String(x.id||"") && String(r.token||"").trim()===t);
    if(duplicate){ toast("Token package đã tồn tại"); return; }
    await store.update("packages",x.id,{token:t,tokenUpdatedAt:new Date().toISOString()});
    await syncKeyPackageToken(oldToken,t,x.name);
    await navigator.clipboard.writeText(t).catch(()=>{}); toast("Đã lưu và sao chép token"); renderPackages(v);
  });
}

function form(v,x={},rows=[]){
  modal(x.id?"Sửa package":"Tạo package",`<form id="f" class="form-grid">
  <div class="field"><label>Tên package</label><input name="name" required value="${esc(x.name||"")}"></div>
  <div class="field"><label>Token package</label><input name="token" value="${esc(x.token||"")}" placeholder="Để trống để tự tạo"></div>
  <div class="field"><label>Phiên bản</label><input name="version" value="${esc(x.version||"")}"></div>
  <div class="field"><label>Phiên bản tối thiểu</label><input name="minVersion" value="${esc(x.minVersion||"")}"></div>
  <div class="field"><label>Phiên bản tối đa</label><input name="maxVersion" value="${esc(x.maxVersion||"")}"></div>
  <div class="field"><label>Trạng thái</label><select name="status"><option>Enabled</option><option ${x.status==="Disabled"?"selected":""}>Disabled</option></select></div>
  <div class="field wide"><label>Mô tả</label><textarea name="description">${esc(x.description||"")}</textarea></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#f")); const p=Object.fromEntries(f);
    p.token=String(p.token||"").trim()||makeToken();
    const duplicate=rows.some(r=>String(r.id)!==String(x.id||"") && String(r.token||"").trim()===p.token);
    if(duplicate){ toast("Token package đã tồn tại"); return; }
    if(x.id){
      const oldToken=String(x.token||"").trim();
      await store.update("packages",x.id,p);
      await syncKeyPackageToken(oldToken,p.token,p.name);
    } else {
      await store.create("packages",p);
    }
    toast("Đã lưu package"); renderPackages(v);
  });
}
