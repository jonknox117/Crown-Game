/* Grim Company v21.5.2 — decision tap carryover shield.
   Prevent rapid Push Pace taps from falling through into a newly opened mandatory decision. */
const GC352_VERSION='21.5.2';
const GC352_STATS={guardsStarted:0,carryoverTapsBlocked:0,guardsExtended:0};
const GC352_INITIAL_GUARD_MS=900;
const GC352_EXTEND_GUARD_MS=550;
let GC352_ARM_AT=0;
let GC352_GUARD_TIMER=0;

function gc352Now(){return typeof performance!=='undefined'?performance.now():Date.now()}
function gc352DecisionModal(){return document.querySelector('#modal.show .gc320DecisionModal')}
function gc352DecisionChoiceTarget(target){
 return target?.closest?.('.gc320DecisionModal .gc260DecisionChoices [data-action]')||null;
}
function gc352SetGuard(ms,extended=false){
 const modal=gc352DecisionModal();if(!modal)return false;
 GC352_ARM_AT=gc352Now()+ms;
 modal.classList.add('gc352Guarded');
 modal.setAttribute('data-gc352-guarded','true');
 clearTimeout(GC352_GUARD_TIMER);
 GC352_GUARD_TIMER=setTimeout(()=>{
  const current=gc352DecisionModal();
  if(current&&gc352Now()>=GC352_ARM_AT){
   current.classList.remove('gc352Guarded');
   current.setAttribute('data-gc352-guarded','false');
  }
 },ms+25);
 if(extended)GC352_STATS.guardsExtended++;else GC352_STATS.guardsStarted++;
 return true;
}
function gc352StartDecisionGuard(){return gc352SetGuard(GC352_INITIAL_GUARD_MS,false)}
function gc352GuardEvent(ev){
 const choice=gc352DecisionChoiceTarget(ev.target);
 if(!choice)return;
 const now=gc352Now();
 if(now>=GC352_ARM_AT)return;
 ev.preventDefault();
 ev.stopPropagation();
 ev.stopImmediatePropagation?.();
 GC352_STATS.carryoverTapsBlocked++;
 choice.classList.remove('gc352CarryoverBlocked');void choice.offsetWidth;choice.classList.add('gc352CarryoverBlocked');
 setTimeout(()=>choice.classList.remove('gc352CarryoverBlocked'),180);
 gc352SetGuard(GC352_EXTEND_GUARD_MS,true);
}
document.addEventListener('pointerdown',gc352GuardEvent,true);
document.addEventListener('click',gc352GuardEvent,true);

/* Every mandatory decision path eventually comes through this function.
   Guard is applied after the sheet exists, regardless of field/casualty/dungeon type. */
const _gc320OpenDecisionModalGC352=gc320OpenDecisionModal;
gc320OpenDecisionModal=function(p){
 const out=_gc320OpenDecisionModalGC352(p);
 requestAnimationFrame(gc352StartDecisionGuard);
 return out;
};

function gc352InstallStyles(){
 if(document.getElementById('gc352Styles'))return;
 const st=document.createElement('style');st.id='gc352Styles';
 st.textContent=`
 .gc320DecisionModal .gc260DecisionChoices [data-action]{transition:opacity .16s ease,filter .16s ease,transform .12s ease}
 .gc320DecisionModal.gc352Guarded .gc260DecisionChoices [data-action]{opacity:.72;filter:saturate(.72)}
 .gc320DecisionModal.gc352Guarded .gc260DecisionChoices::before{
   content:"RELEASE • THEN CHOOSE";display:block;margin:0 0 6px;padding:5px 7px;border:1px solid rgba(202,166,103,.18);
   border-radius:5px;background:rgba(201,166,103,.05);color:#b89a68;font-size:7px;letter-spacing:.12em;text-align:center
 }
 .gc352CarryoverBlocked{animation:gc352BlockedTap .18s ease-out!important}
 @keyframes gc352BlockedTap{0%,100%{transform:translateX(0)}35%{transform:translateX(-2px)}70%{transform:translateX(2px)}}
 @media (prefers-reduced-motion:reduce){.gc352CarryoverBlocked{animation:none!important}}
 `;
 document.head.appendChild(st);
}
gc352InstallStyles();

const _auditGC352=audit;
audit=function(){
 const out=_auditGC352();
 out.v352DecisionTapShield=GC352_VERSION;
 out.decisionChoicesRejectCarryoverTaps=true;
 out.repeatedPushCannotChooseDecision=true;
 out.decisionGuardExtendsWhileTapping=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC352_STATS=()=>({...GC352_STATS});

window.__GC352_TEST=function(){
 const host=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(!host||!sheet)return{ok:false,error:'modal host missing'};
 const oldClass=host.className,oldHTML=sheet.innerHTML,oldArm=GC352_ARM_AT;
 let bubbled=0;
 const bubble=()=>bubbled++;
 try{
  host.classList.add('show');
  sheet.innerHTML='<div class="gc320DecisionModal"><div class="gc260DecisionChoices"><button data-action="gc260Decision">Choice</button></div></div>';
  document.body.addEventListener('click',bubble);
  gc352StartDecisionGuard();
  const btn=sheet.querySelector('[data-action="gc260Decision"]');
  btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  const blocked=bubbled===0&&GC352_STATS.carryoverTapsBlocked>0;
  GC352_ARM_AT=gc352Now()-1;
  btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  const deliberateAllowed=bubbled===1;
  return{ok:!!(blocked&&deliberateAllowed),blocked,deliberateAllowed,stats:{...GC352_STATS}};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  document.body.removeEventListener('click',bubble);
  clearTimeout(GC352_GUARD_TIMER);GC352_ARM_AT=oldArm;
  host.className=oldClass;sheet.innerHTML=oldHTML;
 }
};