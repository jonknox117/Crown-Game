/* Grim Company v19.3.2 — runtime integration fix for legacy auto-expedition timer. */
const GC193_RUNTIME_FIX='19.3.2';

/* The legacy engine calls advanceExpedition() every ~1.7s. In the global-calendar
   model, that background timer may auto-resolve combat, but it must never advance
   travel or spam the UI while a party is simply in the field. */
advanceExpedition=function(pid,manual=false){
 const p=state.parties.find(x=>x.id===pid);if(!p?.expedition)return;
 if(p.expedition.battle)return combatRound(p);
 if(manual)toast('Travel progresses when the company advances the global day.');
};

function gc193RuntimeCheck(){
 const issues=[];
 const a=typeof window.__BL_AUDIT==='function'?window.__BL_AUDIT():null;
 if(!a||a.grimCompany!=='19.3')issues.push('Grim Company core missing');
 if(!a||!a.globalCalendar)issues.push('global calendar missing');
 if(!a||a.contractCompletionAdvancesDay!==false)issues.push('contract completion time guard missing');
 if(!a||!a.fieldOrdersReceiveHQHealing===false)issues.push('field-healing guard missing');
 const modalCheck=typeof window.__BL19_RUNTIME_CHECK==='function'?window.__BL19_RUNTIME_CHECK():null;
 if(modalCheck&&!modalCheck.ok)issues.push(...modalCheck.issues.map(x=>`modal: ${x}`));
 return{ok:issues.length===0,issues,audit:a};
}

const _auditGC193R=audit;
audit=function(){
 const out=_auditGC193R();
 out.grimCompanyRuntimeFix=GC193_RUNTIME_FIX;
 out.backgroundTravelFrozen=true;
 out.backgroundCombatAutoResolve=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC193_RUNTIME_CHECK=gc193RuntimeCheck;
