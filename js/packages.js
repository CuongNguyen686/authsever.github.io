import { store } from "./api.js";
import { $, esc, modal, confirmAction, toast, randomKey } from "./utils.js";

export async function renderPackages(v){
  const rows=await store.list("packages");
  v.innerHTML=`<div class="page-head"><div><h1>Packages</h1><p class="muted">Manage package identifiers, names and client tokens.</p></div><button class="btn primary" id="create">Create Package</button></div>
  <div class="section-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Package ID</th><th>Name</th><th>Token</th><th>Version</th><th>Min</th><th>Max</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
  <tbody>${rows.length?rows.map(x=>`<tr><td>${esc(x.packageId||x.id)}</td><td>${esc(x.name||"")}</td><td><code>${esc(x.token||"—")}</code></td><td>${esc(x.version||"")}</td><td>${esc(x.minVersion||"—")}</td><td>${esc(x.maxVersion||"—")}</td><td>${esc(x.status||"Enabled")}</td><td>${esc(x.description||"")}</td>
  <td><button class="btn" data-token="${esc(x.id)}">Token</button> <button class="btn" data-copy="${esc(x.token||"")}">Copy Token</button> <button class="btn" data-edit="${esc(x.id)}">Edit</button> <button class="btn danger" data-del="${esc(x.id)}">Delete</button></td></tr>`).join("")
  :`<tr><td colspan="9"><div class="empty">No packages found.</div></td></tr>`}</tbody></table></div></div>`;

  $("#create").onclick=()=>form(v);
  v.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>form(v,rows.find(x=>x.id===b.dataset.edit)));
  v.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(await confirmAction("Delete package","Delete this package?")){await store.remove("packages",b.dataset.del);toast("Package deleted");renderPackages(v)}});
  v.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>b.dataset.copy?navigator.clipboard.writeText(b.dataset.copy).then(()=>toast("Package token copied")):toast("Package has no token"));
  v.querySelectorAll("[data-token]").forEach(b=>b.onclick=()=>tokenForm(v,rows.find(x=>x.id===b.dataset.token)));
}

function makeToken(){ return "PKG-"+randomKey("",24).replace(/^-+/,""); }

function tokenForm(v,x){
  const token=x.token||makeToken();
  modal("Package Token",`<form id="tf" class="form-grid"><div class="field wide"><label>Token</label><input name="token" value="${esc(token)}" required></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#tf")); const t=String(f.get("token")).trim();
    await store.update("packages",x.id,{token:t,tokenUpdatedAt:new Date().toISOString()});
    await navigator.clipboard.writeText(t).catch(()=>{}); toast("Token saved and copied"); renderPackages(v);
  });
}

function form(v,x={}){
  modal(x.id?"Edit Package":"Create Package",`<form id="f" class="form-grid">
  <div class="field"><label>Package ID</label><input name="packageId" required value="${esc(x.packageId||"")}"></div>
  <div class="field"><label>Package Name</label><input name="name" required value="${esc(x.name||"")}"></div>
  <div class="field"><label>Package Token</label><input name="token" value="${esc(x.token||"")}" placeholder="Leave empty to generate"></div>
  <div class="field"><label>Version</label><input name="version" value="${esc(x.version||"")}"></div>
  <div class="field"><label>Minimum Version</label><input name="minVersion" value="${esc(x.minVersion||"")}"></div>
  <div class="field"><label>Maximum Version</label><input name="maxVersion" value="${esc(x.maxVersion||"")}"></div>
  <div class="field"><label>Status</label><select name="status"><option>Enabled</option><option ${x.status==="Disabled"?"selected":""}>Disabled</option></select></div>
  <div class="field wide"><label>Description</label><textarea name="description">${esc(x.description||"")}</textarea></div></form>`,
  async root=>{
    const f=new FormData(root.querySelector("#f")); const p=Object.fromEntries(f);
    p.token=String(p.token||"").trim()||makeToken();
    if(x.id) await store.update("packages",x.id,p); else await store.create("packages",p);
    toast("Package saved"); renderPackages(v);
  });
}
