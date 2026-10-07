/* Grim Company v21.4.3 — mobile foreground safety and low-overhead fast presentation. */
let GC343_HIDDEN=false;

document.addEventListener('visibilitychange',()=>{
 if(document.hidden){GC343_HIDDEN=true;try{gc342FlushSave(true)}catch(_){};return}
 if(GC343_HIDDEN&&state){
  GC343_HIDDEN=false;
  gc199Pause('Paused after returning to the app.',false);
  try{gc342FlushSave(true)}catch(_){}
 }
});

window.addEventListener('pageshow',e=>{
 if(e.persisted&&state){
  gc199Pause('Paused after restoring the page.',false);
  try{gc342FlushSave(true)}catch(_){}
 }
});

function gc343InstallStyles(){
 if(document.getElementById('gc343Styles'))return;
 const st=document.createElement('style');st.id='gc343Styles';
 st.textContent=`
 body.gc343SafeFast *{transition:none!important}
 body.gc343SafeFast .topbar,body.gc343SafeFast .modal,body.gc343SafeFast .bottomnav{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
 `;
 document.head.appendChild(st);
}
gc343InstallStyles();

const _gc199UpdateClockGC343B=gc199UpdateClock;
gc199UpdateClock=function(){
 const out=_gc199UpdateClockGC343B();
 if(state)document.body.classList.toggle('gc343SafeFast',gc199Mode()==='fast'&&gc343PhoneMode());
 return out;
};

gc199TimeHelp=function(){
 const phone=gc343PhoneMode(),fast=gc343FastMultiplier(phone);
 modal(`<div class="sheetHead"><h3>How Time Works</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>Active play only.</b> Closing or backgrounding the game pauses it. Returning to the app now stays paused until you explicitly resume.</div><div class="list"><div class="card"><b>▶ Play</b><div class="small muted">Normal simulation speed and normal UI refresh.</div></div><div class="card"><b>▶▶ Fast — ${fast}×${phone?' on this phone':''}</b><div class="small muted">${phone?'Phone Fast is deliberately capped at 2× and strips expensive live presentation work for stability.':'Desktop Fast remains 4×.'}</div></div><div class="card"><b>Founder decisions</b><div class="small muted">Mandatory personal decisions still hard-lock the entire simulation immediately.</div></div></div>`);
};

const _auditGC343B=audit;
audit=function(){
 const out=_auditGC343B();
 out.backgroundReturnStaysPaused=true;
 out.fastVisualEffectsReduced=true;
 return out;
};
window.__BL_AUDIT=audit;