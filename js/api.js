import { CONFIG } from "./config.js";
let app=null, database=null, fns=null;
async function firebaseInit(){
  if(database) return database;
  if(!CONFIG.firebase?.apiKey || !CONFIG.firebase?.databaseURL) throw new Error("Firebase chưa được cấu hình.");
  const [appMod,dbMod]=await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js")
  ]);
  app=appMod.getApps().length?appMod.getApps()[0]:appMod.initializeApp(CONFIG.firebase);
  database=dbMod.getDatabase(app); fns=dbMod; return database;
}
const apiFetch=async(path,opts={})=>{const url=`${CONFIG.API_BASE_URL.replace(/\/$/,"")}/${path.replace(/^\//,"")}`;const c=new AbortController();const t=setTimeout(()=>c.abort(),15000);try{const r=await fetch(url,{...opts,signal:c.signal,headers:{"Content-Type":"application/json",...(opts.headers||{})}});const text=await r.text();let d={};try{d=text?JSON.parse(text):{}}catch{throw new Error(`Phản hồi JSON không hợp lệ (${r.status})`)}if(!r.ok)throw new Error(d.message||d.error||`HTTP ${r.status}`);return d}finally{clearTimeout(t)}};
const normalize=x=>Array.isArray(x)?x:Object.entries(x||{}).map(([id,v])=>({id,...v}));
const firebase=async(method,path,payload)=>{await firebaseInit();const r=fns.ref(database,path);if(method==="GET"){const s=await fns.get(r);return s.val()}if(method==="POST"){const p=fns.push(r);await fns.set(p,payload);return{id:p.key,...payload}}if(method==="PUT"){await fns.set(r,payload);return payload}if(method==="PATCH"){await fns.update(r,payload);return payload}if(method==="DELETE"){await fns.remove(r);return{ok:true}}};
export const store={mode:()=>CONFIG.API_BASE_URL.trim()?"api":"firebase",list:async r=>CONFIG.API_BASE_URL.trim()?apiFetch(r):normalize(await firebase("GET",r)),get:(r,id)=>CONFIG.API_BASE_URL.trim()?apiFetch(`${r}/${encodeURIComponent(id)}`):firebase("GET",`${r}/${id}`),create:(r,p)=>CONFIG.API_BASE_URL.trim()?apiFetch(r,{method:"POST",body:JSON.stringify(p)}):firebase("POST",r,p),update:(r,id,p)=>CONFIG.API_BASE_URL.trim()?apiFetch(`${r}/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(p)}):firebase("PATCH",`${r}/${id}`,p),remove:(r,id)=>CONFIG.API_BASE_URL.trim()?apiFetch(`${r}/${encodeURIComponent(id)}`,{method:"DELETE"}):firebase("DELETE",`${r}/${id}`),health:async()=>{if(CONFIG.API_BASE_URL.trim())return apiFetch("health");await firebaseInit();return{ok:true}},subscribe:async(resource,callback)=>{await firebaseInit();return fns.onValue(fns.ref(database,resource),s=>callback(normalize(s.val())))}};
