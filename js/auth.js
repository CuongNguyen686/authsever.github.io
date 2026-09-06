import { CONFIG } from "./config.js";
const KEY="akm_admin_session";
export const isUnlocked=()=>sessionStorage.getItem(KEY)==="1";
export const unlock=secret=>{
  if(!CONFIG.ADMIN_GATE_SECRET) return false;
  return secret===CONFIG.ADMIN_GATE_SECRET;
};
export const startSession=()=>sessionStorage.setItem(KEY,"1");
export const logout=()=>{sessionStorage.removeItem(KEY);location.replace("index.html")};