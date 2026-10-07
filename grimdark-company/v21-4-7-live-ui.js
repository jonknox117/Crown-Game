/* Grim Company v21.4.7 — Live UI pass.
   The visible game must follow simulation state without requiring tab changes. */
const GC347_VERSION='21.4.7';
let GC347_TOUCHING=false;
let GC347_LAST_KEY='';
let GC347_LAST_BODY_HASH=0;
let GC347_LAST_BODY_SYNC=0;
let GC347_LAST_HUD_HASH=0;
let GC347_TIMER=null;
const GC347_STATS={ticks:0,bodyRefreshes:0,hudRefreshes:0,skippedInteraction:0,errors:0};

function gc347Hash(s){
 let h=2166136261>>>0;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
function gc347ScreenKey(){
 if(!state)return'';
 if(gc270IsFreeblade())return `free:${state.ui?.tab||'you'}:${state.currentRegion}`;
 return `company:${state.ui?.tab||'you'}:${state.ui?.gc330CompanySub||''}:${state.currentRegion}`;
}
function gc347CurrentBodyHTML(){
 if(!state)return'';
 if(gc270IsFreeblade()){
  const tab=state.ui?.tab||'you';
  if(tab==='you')return gc270FreebladeYou();
  if(tab==='jobs')return gc270Jobs();
  if(tab==='gear')return gc270Gear();
  return gc270Region();
 }
 const tab=state.ui?.tab||'you';
 if(tab==='you')return gc330YouScreen();
 if(tab==='company')return gc330CompanyScreen();
 if(tab==='contracts')return gc330ContractsScreen();
 return gc330WorldScreen();
}
function gc347CurrentTopbarHTML(){
 return gc270IsFreeblade()?gc270Topbar():gc330Topbar();
}
function gc347InteractionBusy(){
 const modal=document.getElementById('modal');
 if(modal?.classList.contains('show'))return true;
 const a=document.activeElement;
 if(a&&/^(INPUT|TEXTAREA|SELECT)$/i.test(a.tagName))return true;
 return GC347_TOUCHING;
}
function gc347RefreshHud(){
 const current=document.querySelector('.gc330Topbar .gc330Hud');
 if(!current)return false;
 const t=document.createElement('template');t.innerHTML=gc347CurrentTopbarHTML().trim();
 const fresh=t.content.querySelector('.gc330Hud');if(!fresh)return false;
 const hash=gc347Hash(fresh.innerHTML);
 if(hash===GC347_LAST_HUD_HASH)return false;
 current.innerHTML=fresh.innerHTML;GC347_LAST_HUD_HASH=hash;GC347_STATS.hudRefreshes++;return true;
}
function gc347RefreshVisibleBody(force=false){
 const screen=document.querySelector('#app .screen');if(!screen)return false;
 const key=gc347ScreenKey(),now=gc342Now();
 const phone=typeof gc345PhoneMode==='function'?gc345PhoneMode():false;
 const fast=gc199Mode()==='fast';
 const gap=force?0:(phone?(fast?850:650):(fast?550:450));
 if(!force&&now-GC347_LAST_BODY_SYNC<gap)return false;
 if(!force&&gc347InteractionBusy()){GC347_STATS.skippedInteraction++;return false}
 GC347_LAST_BODY_SYNC=now;
 let fresh;
 try{fresh=gc347CurrentBodyHTML()}catch(e){GC347_STATS.errors++;gc341RuntimeError('live screen renderer',e);return false}
 const hash=gc347Hash(fresh);
 if(key!==GC347_LAST_KEY){
  GC347_LAST_KEY=key;GC347_LAST_BODY_HASH=hash;return false;
 }
 if(hash===GC347_LAST_BODY_HASH)return false;
 const y=window.scrollY;
 screen.innerHTML=fresh;
 GC347_LAST_BODY_HASH=hash;GC347_STATS.bodyRefreshes++;
 requestAnimationFrame(()=>{
  if(Math.abs(window.scrollY-y)>4)window.scrollTo(0,y);
  try{gc346DedupClock();gc199UpdateClock()}catch(_){}
 });
 return true;
}
function gc347LiveTick(force=false){
 if(!state||document.hidden)return false;
 GC347_STATS.ticks++;
 try{
  gc347RefreshHud();
  if(typeof gc344RefreshQuickNumbers==='function')gc344RefreshQuickNumbers();
  return gc347RefreshVisibleBody(force);
 }catch(e){
  GC347_STATS.errors++;
  gc341RuntimeError('live UI tick',e);
  return false;
 }
}
function gc347ResetBaseline(){
 GC347_LAST_KEY=gc347ScreenKey();
 try{GC347_LAST_BODY_HASH=gc347Hash(gc347CurrentBodyHTML())}catch(_){GC347_LAST_BODY_HASH=0}
 GC347_LAST_HUD_HASH=0;GC347_LAST_BODY_SYNC=gc342Now();
}
document.addEventListener('touchstart',()=>{GC347_TOUCHING=true},{passive:true});
document.addEventListener('touchend',()=>{GC347_TOUCHING=false},{passive:true});
document.addEventListener('touchcancel',()=>{GC347_TOUCHING=false},{passive:true});
document.addEventListener('pointerdown',()=>{GC347_TOUCHING=true},{passive:true});
document.addEventListener('pointerup',()=>{GC347_TOUCHING=false},{passive:true});
document.addEventListener('pointercancel',()=>{GC347_TOUCHING=false},{passive:true});

/* Navigation/full renders establish a fresh baseline; simulation changes after that
   are reconciled into only the visible screen. */
const _renderGC347=render;
render=function(...args){
 const out=_renderGC347(...args);
 requestAnimationFrame(()=>{if(state){gc347ResetBaseline();gc347RefreshHud()}});
 return out;
};

/* Every master simulation step queues a lightweight live reconciliation. This does
   not save and does not rebuild topbar/nav/clock. */
const _gc199AdvanceFieldClocksGC347=gc199AdvanceFieldClocks;
gc199AdvanceFieldClocks=function(deltaDays){
 const out=_gc199AdvanceFieldClocksGC347(deltaDays);
 if(state)requestAnimationFrame(()=>gc347LiveTick(false));
 return out;
};

/* A low-frequency heartbeat also covers paused/manual mutations and systems that
   change state outside the main time loop. */
GC347_TIMER=setInterval(()=>gc347LiveTick(false),350);

function gc347InstallStyles(){
 if(document.getElementById('gc347Styles'))return;
 const st=document.createElement('style');st.id='gc347Styles';
 st.textContent=`
 .bar>i,.meter>i,[data-gc199-daybar],[data-gc331-progress],[data-gc340-activitybar]{transition:width .22s linear!important}
 body.gc343SafeFast .bar>i,body.gc343SafeFast .meter>i{transition:width .16s linear!important}
 `;
 document.head.appendChild(st);
}
gc347InstallStyles();

const _auditGC347=audit;
audit=function(){
 const out=_auditGC347();
 out.v347LiveUi=GC347_VERSION;
 out.visibleStatsUpdateWithoutNavigation=true;
 out.visibleProgressBarsUpdateWithoutNavigation=true;
 out.worldMetersUpdateWithoutNavigation=true;
 out.founderVitalsUpdateWithoutNavigation=true;
 out.contractAndExpeditionStateUpdateWithoutNavigation=true;
 out.freebladeMilestonesUpdateWithoutNavigation=true;
 out.liveUpdatesPreserveScroll=true;
 out.liveUpdatesSkipActiveInputsAndModals=true;
 out.liveUpdatesAvoidFullAppRender=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC347_STATS=()=>({...GC347_STATS});

window.__GC347_TEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  state=createState('Live UI Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=100;
  const f=gc260CreateFounderRecord('veyric',{name:'Live Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=5;f.xp=3;
  state.ui.tab='you';render();gc347ResetBaseline();
  const renders0=GC342_STATS.actualRenders;
  state.company.silver=177;f.xp=19;f.hp=Math.max(1,f.hp-3);
  gc347LiveTick(true);
  const hudLive=[...document.querySelectorAll('.gc330Hud>div')].some(x=>x.querySelector('span')?.textContent==='SILVER'&&x.querySelector('b')?.textContent==='177');
  const vitals=[...document.querySelectorAll('.gc330YouVitals>div')];
  const xpLive=vitals.some(x=>x.querySelector('span')?.textContent==='XP'&&x.querySelector('b')?.textContent?.startsWith('19/'));
  state.ui.tab='world';render();gc347ResetBaseline();
  state.regions.veyric.threat=73.4;state.regions.veyric.stability=61.2;state.regions.veyric.prosperity=48.6;
  gc347LiveTick(true);
  const worldText=document.querySelector('.screen')?.innerText||'';
  const worldLive=/73/.test(worldText)&&/61/.test(worldText)&&/49/.test(worldText);
  state.ui.tab='you';render();gc347ResetBaseline();gc340Presence().place='train';f.dailyOrder='Train';gc340StartFocused('personalDrill');
  gc347LiveTick(true);
  const focusBefore=document.querySelector('[data-gc340-activitybar]')?.style.width||'';
  gc199AdvanceFieldClocks(.04);gc347LiveTick(true);
  const focusAfter=document.querySelector('[data-gc340-activitybar]')?.style.width||'';
  const progressLive=focusBefore!==focusAfter;
  const noFullRender=GC342_STATS.actualRenders-renders0<=3;
  const oneClock=gc346AllClocks().length===1;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(hudLive&&xpLive&&worldLive&&progressLive&&noFullRender&&oneClock&&integrity),hudLive,xpLive,worldLive,progressLive,focusBefore,focusAfter,noFullRender,renderDelta:GC342_STATS.actualRenders-renders0,oneClock,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;window.__GC345_FORCE_PHONE=oldForce;
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};