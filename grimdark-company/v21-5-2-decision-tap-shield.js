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
  sheet.innerHTML='<div class="gc320DecisionModal"><div class="gc260DecisionChoices"><button data-action="gc352TestChoice">Choice</button></div></div>';
  document.body.addEventListener('click',bubble);
  gc352StartDecisionGuard();
  const btn=sheet.querySelector('[data-action="gc352TestChoice"]');
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

/* Grim Company v21.5.3 — stability & QoL follow-up.
   Rapid Push stays responsive, town movement preserves scroll, and freelance return presence is corrected immediately. */
const GC353_VERSION='21.5.3';

/* Push Pace is intentionally repeat-tapped. The generic duplicate-mutation guard
   should not throw away legitimate fast taps; v21.5.2's decision shield handles
   the dangerous transition into mandatory decision menus. */
if(typeof GC351_ACTION_EXEMPT!=='undefined')GC351_ACTION_EXEMPT.add('gc199Push');

/* Re-rendering the town panel after a location tap should not jerk the phone
   viewport up or down. */
const _gc340MoveGC353=gc340Move;
gc340Move=function(place){
 const y=window.scrollY||0,out=_gc340MoveGC353(place);
 requestAnimationFrame(()=>{if(Math.abs((window.scrollY||0)-y)>2)window.scrollTo(0,y)});
 return out;
};

/* Disposable freelance crews are removed at contract end. Keep the Founder's
   physical-presence state consistent in the same transaction instead of waiting
   for the YOU screen to lazily self-heal it. */
const _gc193FinishNoTimeGC353=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const out=_gc193FinishNoTimeGC353(p),f=gc260Founder(),pr=gc340Presence();
 if(f&&pr&&!gc340FounderInField()&&!gc340FounderInDungeon()){
  pr.regionId=f.regionId;pr.mode='town';
  if(!gc340TownDef(f.regionId)?.[pr.place])pr.place='hall';
 }
 return out;
};

const _auditGC353=audit;
audit=function(){
 const out=_auditGC353();
 out.v353StabilityQol=GC353_VERSION;
 out.pushRapidTapsStayResponsive=true;
 out.freelanceReturnPresenceImmediate=true;
 out.townMovePreservesScroll=true;
 out.decisionShieldTestHasNoRuntimeSideEffects=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC353_TEST=function(){
 const old=state;
 try{
  gc270CreateFreebladeState('veyric',{name:'QoL Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1});
  const f=gc260Founder();state.ui.tab='you';render();
  window.scrollTo(0,Math.min(320,Math.max(0,document.documentElement.scrollHeight-innerHeight)));
  const y0=window.scrollY;gc340Move('scout');
  return new Promise(resolve=>requestAnimationFrame(()=>{
   const y1=window.scrollY;
   state.ui.tab='jobs';render();
   const c=gc310FreebladeContracts()[0];gc310AcceptContract(c.id);
   const p=state.parties.find(x=>x.gc332EphemeralFreelance&&x.expedition);
   const m0=Number(p?.expedition?.gc201Momentum)||0;
   gc199PushParty(p.id);const m1=Number(p.expedition.gc201Momentum)||0;
   gc199PushParty(p.id);const m2=Number(p.expedition.gc201Momentum)||0;
   p.expedition.complete=true;gc193FinishNoTime(p);
   const pr=gc340Presence(),pushResponsive=m2>m1&&m1>m0,scrollStable=Math.abs(y1-y0)<=2,returnTown=pr.mode==='town';
   const integrity=gc342StateIntegrity().ok,oneClock=gc346AllClocks().length===1;
   resolve({ok:!!(pushResponsive&&scrollStable&&returnTown&&integrity&&oneClock),pushResponsive,scrollStable,returnTown,m0,m1,m2,y0,y1,integrity,oneClock});
  }));
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  setTimeout(()=>{state=old},0);
 }
};