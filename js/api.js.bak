import { CONFIG, hasApi, hasFirebase } from "./config.js";

let fb=null, db=null;
async function firebaseInit(){
  if(!hasFirebase()) throw new Error("No API_BASE_URL or Firebase browser configuration is configured.");
  if(db) return db;
  const appMod=await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
  const dbMod=await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js");
  fb=appMod.initializeApp(CONFIG.firebase);
  const database=dbMod.getDatabase(fb);
  db={dbMod, database, ref:dbMod.ref, get:dbMod.get, set:dbMod.set, update:dbMod.update, remove:dbMod.remove, push:dbMod.push};
  return db;
}
const apiFetch=async(path,opts={})=>{
  const url=`${CONFIG.API_BASE_URL.replace(/\/$/,"")}/${path.replace(/^\//,"")}`;
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(url,{...opts,signal:controller.signal,headers:{"Content-Type":"application/json",...(opts.headers||{})}});
    const text=await r.text(); let data={}; try{data=text?JSON.parse(text):{}}catch{throw new Error(`Invalid JSON response (${r.status})`)}
    if(!r.ok) throw new Error(data.message||data.error||`HTTP ${r.status}`);
    return data;
  }finally{clearTimeout(timer)}
};
const normalize = x => Array.isArray(x)?x:Object.entries(x||{}).map(([id,v])=>({id,...v}));
const firebase = async (method,path,payload)=>{
  const x=await firebaseInit(); const r=x.ref(x.database, path);
  if(method==="GET"){const s=await x.get(r); return normalize(s.val());}
  if(method==="POST"){const p=x.push(r); await x.set(p,payload); return {id:p.key,...payload};}
  if(method==="PUT"||method==="PATCH"){await x.update(r,payload); return payload;}
  if(method==="DELETE"){await x.remove(r);return {ok:true};}
};
export const store={
  mode:()=>hasApi()?"api":hasFirebase()?"firebase":"unconfigured",
  async list(resource){ return hasApi()?apiFetch(resource):firebase("GET",resource); },
  async get(resource,id){ return hasApi()?apiFetch(`${resource}/${encodeURIComponent(id)}`):firebase("GET",`${resource}/${id}`); },
  async create(resource,payload){ return hasApi()?apiFetch(resource,{method:"POST",body:JSON.stringify(payload)}):firebase("POST",resource,payload); },
  async update(resource,id,payload){ return hasApi()?apiFetch(`${resource}/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(payload)}):firebase("PATCH",`${resource}/${id}`,payload); },
  async remove(resource,id){ return hasApi()?apiFetch(`${resource}/${encodeURIComponent(id)}`,{method:"DELETE"}):firebase("DELETE",`${resource}/${id}`); },
  async health(){ if(hasApi()) return apiFetch("health"); await firebaseInit(); return {ok:true}; }
};