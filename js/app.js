import { unlock,startSession,isUnlocked } from "./auth.js";
const form=document.querySelector("#adminGateForm");
const error=document.querySelector("#gateError");
if(isUnlocked()) location.replace("dashboard.html");
form?.addEventListener("submit",e=>{
  e.preventDefault();
  const secret=new FormData(form).get("adminSecret")||"";
  if(unlock(secret)){startSession();location.replace("dashboard.html")}
  else {
    error.textContent="Admin secret is invalid or has not been configured in js/config.js.";
    error.classList.remove("hidden");
  }
});