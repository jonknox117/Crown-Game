/* Grim Company v21.4.4 — focused-action quality & stability pass.
   Repeated Founder commands update a tiny local UI instead of rebuilding the game. */
const GC344_VERSION='21.4.4';
let GC344_FOCUS_TRANSITION=false;

function gc344FocusHostHTML(){
 const pr=gc340Presence();
 if(!pr)return'';
 if(pr.activity)return gc340ActivityHTML();
 const last=pr.gc344LastFocus;
 const recent=last&&Number(last.realAt)>0&&(Date.now()-Number(last.realAt)<12000);
 const result=recent?`<div class="gc344FocusResult"><span>COMPLETED</span><b>${esc(last.label||'Focused activity')}</b><small>Choose another focused action or let the passive stance continue.</small></div>`:'';
 return result+`<div class="gc340FocusGrid">${gc340PlaceActions(pr.place)}</div>`;
}
function gc344RefreshFocusHost(){
 if(!state||state.ui?.tab!=='you')return false;
 const host=document.querySelector('[data-gc344-focus-host]');
 if(!host)return false;
 host.innerHTML=gc344FocusHostHTML();
 return true;
}
function gc344RefreshQuickNumbers(){
 if(!state)return;
 const f=gc260Founder(),d=f?derived(f):null;
 const vals=document.querySelectorAll('.gc330YouVitals>div');
 if(f&&d&&vals.length>=3){
  const b0=vals[0].querySelector('b'),b1=vals[1].querySelector('b'),b2=vals[2].querySelector('b');
  if(b0)b0.textContent=`${Math.round(f.hp)}/${d.maxHp}`;
  if(b1)b1.textContent=String(f.lvl);
  if(b2)b2.textContent=f.lvl>=GC194_MAX_LEVEL?'MAX':`${f.xp}/${xpNeed(f.lvl)}`;
 }
 document.querySelectorAll('.gc330Hud>div').forEach(x=>{
  const s=x.querySelector('span')?.textContent,b=x.querySelector('b');if(!b)return;
  if(s==='SILVER')b.textContent=String(Math.round(state.company.silver));
  if(s==='RENOWN')b.textContent=String(Math.round(state.company.renown||0));
 });
}
function gc344TrimRoutineHistory(){
 const f=gc260Founder();
 if(f&&Array.isArray(f.history)&&f.history.length>80)f.history=f.history.slice(-80);
 if(Array.isArray(state.history)&&state.history.length>180)state.history=state.history.slice(-180);
 Object.values(state.regions||{}).forEach(r=>{
  if(Array.isArray(r.history)&&r.history.length>120)r.history=r.history.slice(-120);
 });
 if(Array.isArray(state.timeSystem?.gc199Feed)&&state.timeSystem.gc199Feed.length>70)state.timeSystem.gc199Feed=state.timeSystem.gc199Feed.slice(-70);
}
function gc344FinishTinyUi(label){
 const pr=gc340Presence();
 if(pr)pr.gc344LastFocus={label:String(label||'Focused activity'),day:Number(state.company.day)||0,realAt:Date.now()};
 gc344TrimRoutineHistory();
 requestAnimationFrame(()=>{gc344RefreshFocusHost();gc344RefreshQuickNumbers()});
}

/* v21.4.1 had its own render scheduler and therefore bypassed the later Fast-mode
   render suppression. Route it through the modern scheduler. */
gc341ScheduleRender=function(){
 if(!state)return;
 return gc342ScheduleRender(false);
};

const _gc340StartFocusedGC344=gc340StartFocused;
gc340StartFocused=function(type,targetId=null){
 if(GC344_FOCUS_TRANSITION)return;
 GC344_FOCUS_TRANSITION=true;
 const depth=GC342_SIM_DEPTH;
 let out;
 try{
  GC342_SIM_DEPTH=depth+1;
  out=_gc340StartFocusedGC344(type,targetId);
 }finally{
  GC342_SIM_DEPTH=depth;
  GC344_FOCUS_TRANSITION=false;
 }
 const pr=gc340Presence();
 if(pr?.activity){
  GC342_RENDER_DIRTY=false;
  gc342FlushSave(true);
  requestAnimationFrame(()=>{gc344RefreshFocusHost();gc344RefreshQuickNumbers()});
 }
 return out;
};

const _gc340CancelFocusedGC344=gc340CancelFocused;
gc340CancelFocused=function(){
 if(GC344_FOCUS_TRANSITION)return;
 GC344_FOCUS_TRANSITION=true;
 const depth=GC342_SIM_DEPTH;
 try{
  GC342_SIM_DEPTH=depth+1;
  return _gc340CancelFocusedGC344();
 }finally{
  GC342_SIM_DEPTH=depth;
  GC344_FOCUS_TRANSITION=false;
  GC342_RENDER_DIRTY=false;
  gc342FlushSave(true);
  requestAnimationFrame(gc344RefreshFocusHost);
 }
};

const _gc340CompleteFocusedGC344=gc340CompleteFocused;
gc340CompleteFocused=function(act){
 if(!act||GC344_FOCUS_TRANSITION)return false;
 GC344_FOCUS_TRANSITION=true;
 let out;
 try{
  out=_gc340CompleteFocusedGC344(act);
 }finally{
  GC344_FOCUS_TRANSITION=false;
  GC342_RENDER_DIRTY=false;
  GC342_SAVE_DIRTY=true;
  gc344FinishTinyUi(act.label);
 }
 return out;
};

/* The town renderer gets one stable host. Repeated activities swap only this node. */
gc340TownHTML=function(){
 const f=gc260Founder(),pr=gc340SyncPresence();if(!f||!pr)return'';
 if(pr.mode!=='town')return`<div class="sectionTitle"><h3>Presence</h3><span>${pr.mode==='dungeon'?'inside a dungeon':'away from town'}</span></div><div class="gc340Away"><b>Your physical presence is committed elsewhere.</b><span>Town focus actions and local Founder support resume when you return.</span></div>`;
 const defs=gc340TownDef(f.regionId),active=defs[pr.place]||defs.hall,support=active.stance?`Your presence strengthens ${active.stance} work at this HQ by ${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%.`:'This is your neutral management location.';
 return`<div class="sectionTitle"><h3>Town</h3><span>YOU are physically here</span></div><div class="gc340TownMap">${Object.entries(defs).map(([id,d])=>`<button class="gc340Place ${id} ${pr.place===id?'active':''}" data-action="gc340Move" data-value="${id}"><b>${d.icon}</b><span>${esc(d.name)}</span><em>${d.stance?esc(d.stance):'HOME'}</em></button>`).join('')}</div><div class="gc340PlacePanel"><div class="gc340PlaceHead"><div><span>${active.stance?`${active.stance.toUpperCase()} • ACTIVE PRESENCE`:'HOME'}</span><b>${esc(active.name)}</b><small>${esc(active.desc)}</small></div>${active.stance?`<strong>+${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%</strong>`:''}</div><p>${esc(support)}</p>${active.stance?`<div data-gc344-focus-host>${gc344FocusHostHTML()}</div>`:''}</div>`;
};

function gc344InstallStyles(){
 if(document.getElementById('gc344Styles'))return;
 const st=document.createElement('style');st.id='gc344Styles';
 st.textContent=`
 .gc344FocusResult{margin:7px 0;padding:7px 8px;border-left:2px solid #7d9a62;background:#12170f;border-radius:4px}
 .gc344FocusResult span,.gc344FocusResult b,.gc344FocusResult small{display:block}
 .gc344FocusResult span{font-size:6px;letter-spacing:.13em;color:#91ad73}
 .gc344FocusResult b{font-size:9px;margin-top:2px}.gc344FocusResult small{font-size:7px;color:#817a6e;margin-top:2px}
 body.gc343SafeFast .gc340Activity i em{transition:none!important}
 `;
 document.head.appendChild(st);
}
gc344InstallStyles();

const _auditGC344=audit;
audit=function(){
 const out=_auditGC344();
 out.v344FocusedActionStability=GC344_VERSION;
 out.focusActionsUseTinyDomUpdates=true;
 out.focusStartAvoidsFullRender=true;
 out.focusCompletionAvoidsFullRender=true;
 out.legacyFocusSchedulerRedirected=true;
 out.routineFounderHistoryBounded=true;
 out.repeatedFocusStressTest=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC344_TEST=function(){
 const old=state,oldErr=safeLocalGet('grimCompanyLastRuntimeError');
 try{
  safeLocalRemove('grimCompanyLastRuntimeError');
  state=createState('Focus Stress','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=100;
  const f=gc260CreateFounderRecord('veyric',{name:'Stress Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=5;f.dailyOrder='Train';state.ui.tab='you';gc340Presence().place='train';
  render();
  const r0=GC342_STATS.actualRenders,s0=state.company.silver,x0=f.xp;
  for(let i=0;i<30;i++){gc340StartFocused('personalDrill');gc340TickFocused(1)}
  gc340Presence().place='odd';f.dailyOrder='Odd Jobs';
  for(let i=0;i<30;i++){gc340StartFocused('lucrativeJob');gc340TickFocused(1)}
  const renderDelta=GC342_STATS.actualRenders-r0;
  const rewards=(f.xp>x0)&&(state.company.silver>s0);
  const bounded=Array.isArray(f.history)&&f.history.length<=80&&(state.timeSystem.gc199Feed||[]).length<=70;
  const idle=!gc340Presence().activity;
  const noError=!safeLocalGet('grimCompanyLastRuntimeError')&&!state.founderSystem?.gc341LastRuntimeError;
  const integrity=gc342StateIntegrity().ok;
  const tiny=!!document.querySelector('[data-gc344-focus-host]');
  return{ok:!!(renderDelta<=3&&rewards&&bounded&&idle&&noError&&integrity&&tiny),renderDelta,rewards,bounded,idle,noError,integrity,tiny,history:f.history?.length||0,feed:(state.timeSystem.gc199Feed||[]).length};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;
  if(oldErr)safeLocalSet('grimCompanyLastRuntimeError',oldErr);else safeLocalRemove('grimCompanyLastRuntimeError');
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};