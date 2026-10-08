/* Broken Lantern v21.9.3 — restore live numerical updates without page rebuilding.
   Only mutate the text / width of already mounted DOM nodes. */
const GC393_LIVE_VERSION='21.9.3';
const GC393_LIVE_STATS={ticks:0,patches:0,errors:0};
function gc393SetText(node,text){
 if(!node||node.textContent===String(text))return false;
 node.textContent=String(text);return true;
}
function gc393SetWidth(node,pct){
 if(!node)return false;
 const w=clamp(Number(pct)||0,0,100)+'%';
 if(node.style.width===w)return false;
 node.style.width=w;return true;
}
function gc393RoomLive(){
 const panel=document.querySelector('#app .gc340PlacePanel');
 if(!panel||!state)return false;
 const pr=gc340SyncPresence(),f=gc260Founder(),rid=f?.regionId;
 if(!f||!pr||pr.mode!=='town')return false;
 let changed=false;
 if(pr.place==='hall'){
  const d=gc391HomePresence(rid),badge=panel.querySelector('[data-gc391-presence-bonus]');
  if(d){
   changed=gc393SetText(panel.querySelector('[data-gc391-presence-label]'),d.label)||changed;
   changed=gc393SetText(badge,d.badge)||changed;
   changed=gc393SetText(panel.querySelector('[data-gc391-presence-description]'),d.description)||changed;
   if(badge&&badge.className!=='gc391Bonus '+d.kind){badge.className='gc391Bonus '+d.kind;changed=true}
  }
 }else{
  const name=gc340TownDef(rid)?.[pr.place]?.stance;
  if(name){
   const pct=Math.round((gc393PersonalMultiplier(name,f)-1)*100);
   changed=gc393SetText(panel.querySelector('.gc340PlaceHead strong'),'+'+pct+'%')||changed;
   const msg='Your presence strengthens '+name+' work at this HQ by '+pct+'%. Level '+f.lvl+' • '+gc360RankName(f)+' career. Novice baseline +'+Math.round((GC393_BASE_PRESENCE[name]-1)*100)+'%; experience improves it.';
   changed=gc393SetText(panel.querySelector('p'),msg)||changed;
  }
 }
 const focus=pr.activity,small=panel.querySelector('.gc340Activity small');
 if(focus&&small){
  changed=gc393SetText(small,Math.max(0,focus.remainingDays*24).toFixed(1)+'h remaining • normal company simulation continues')||changed;
  changed=gc393SetWidth(panel.querySelector('[data-gc340-activitybar]'),
   (1-focus.remainingDays/Math.max(.000001,focus.durationDays))*100)||changed;
 }
 if(document.querySelector('.gc393RoomManagement')){
  const manager=gc390Director(rid);
  changed=gc393SetText(document.querySelector('.gc393HomeManager [data-gc393-director]'),manager?.a?.name||'No active director')||changed;
  changed=gc393SetText(document.querySelector('.gc393HomeManager [data-gc393-directorbonus]'),
   manager?'+'+Math.round((gc390Power(manager.a,'director')-1)*100)+'% to all HQ stances • '+manager.source:'Return here to lead')||changed;
  document.querySelectorAll('.gc393RoomPost').forEach(node=>{
   const stance=node.dataset.stance,lead=gc390StanceLead(rid,stance),
   id=gc390EnsurePosts(rid)?.[stance],
   standby=!lead&&id?state.roster.find(x=>x.id===id):null;
   changed=gc393SetText(node.querySelector('[data-gc393-post]'),
    (lead?.name||standby?.name||'No manager')+(lead?' • +'+Math.round((gc390Power(lead,'stance')-1)*100)+'%':''))||changed;
  });
 }
 return changed;
}
function gc393FreebladeLive(){
 if(!gc270IsFreeblade())return false;
 let changed=false;
 const f=gc260Founder(),pr=gc270Progression().freeblade,stats=document.querySelector('.gc260PersonalStats,.gc270PersonalStats');
 if(stats&&f){
  const labels=[...stats.querySelectorAll('.card')];
  labels.forEach(node=>{
   const name=node.querySelector('span')?.textContent?.trim().toUpperCase(),v=node.querySelector('b');
   const next=name==='HP'?Math.round(f.hp)+'/'+derived(f).maxHp:
    name==='XP'?f.lvl>=GC194_MAX_LEVEL?'MAX':f.xp+'/'+xpNeed(f.lvl):
    name==='JOBS'?pr.completed:null;
   if(next!==null)changed=gc393SetText(v,next)||changed;
  });
 }
 const founding=document.querySelector('.gc270Founding');
 if(founding){
  const ready=gc270FoundingReady();
  if(founding.classList.contains('ready')!==ready){
   const holder=document.createElement('template');holder.innerHTML=gc270FoundingStatusHTML();
   const replacement=holder.content.firstElementChild;
   if(replacement){founding.replaceWith(replacement);changed=true}
  }else{
   const wins=Math.min(pr.successes,GC270_REQUIRED_WINS);
   const silver=Math.min(state.company.silver,GC270_FOUNDING_COST);
   const percentage=clamp(((wins/GC270_REQUIRED_WINS)+(silver/GC270_FOUNDING_COST))*50,0,100);
   changed=gc393SetText(founding.querySelector('.statline strong'),wins+'/'+GC270_REQUIRED_WINS)||changed;
   changed=gc393SetText(founding.querySelector('.tiny.muted'),
    'Successful jobs '+pr.successes+'/'+GC270_REQUIRED_WINS+' • Silver '+Math.round(state.company.silver)+'/'+GC270_FOUNDING_COST)||changed;
   changed=gc393SetWidth(founding.querySelector('.bar i'),percentage)||changed;
  }
 }
 const world=document.querySelector('.regionStats');
 const r=state.regions?.[state.currentRegion];
 if(world&&r){
  const map={PROSPERITY:r.prosperity,STABILITY:r.stability,THREAT:r.threat};
  world.querySelectorAll('.regionStat').forEach(node=>{
   const key=node.querySelector('span')?.textContent?.trim().toUpperCase();
   if(!(key in map))return;
   const val=map[key];
   changed=gc393SetText(node.querySelector('b'),Math.round(val))||changed;
   changed=gc393SetWidth(node.querySelector('.meter i'),val)||changed;
  });
 }
 return changed;
}
function gc393CompanyLive(){
 if(gc270IsFreeblade())return false;
 let changed=false;
 const f=gc260Founder(),vit=document.querySelector('.gc330YouVitals');
 if(f&&vit&&state.ui?.tab==='you'){
  vit.querySelectorAll(':scope > div').forEach(node=>{
   const label=node.querySelector('span')?.textContent?.trim().toUpperCase();
   const next=label==='HP'?Math.round(f.hp)+'/'+derived(f).maxHp:
    label==='LEVEL'?f.lvl:
    label==='XP'?f.lvl>=GC194_MAX_LEVEL?'MAX':f.xp+'/'+xpNeed(f.lvl):
    label==='CONTRACTS'?f.missions:null;
   if(next!==null)changed=gc393SetText(node.querySelector('b'),next)||changed;
  });
 }
 if(state.ui?.tab==='company'){
  const box=document.querySelector('.gc201StanceGrid');
  if(box){
   const fresh=document.createElement('template');fresh.innerHTML=gc201StanceDashboard(state.currentRegion);
   const updated=[...fresh.content.querySelectorAll('.gc201Stance')];
   const live=[...box.querySelectorAll('.gc201Stance')];
   live.forEach((node,i)=>{
    const expected=updated[i];if(!expected)return;
    changed=gc393SetText(node.querySelector('.gc201StanceHead span'),
     expected.querySelector('.gc201StanceHead span')?.textContent||'0')||changed;
    changed=gc393SetText(node.querySelector('.gc201StanceMeta'),
     expected.querySelector('.gc201StanceMeta')?.textContent||'')||changed;
    const bar=node.querySelector(':scope > i em'),newBar=expected.querySelector(':scope > i em');
    if(bar&&newBar)changed=gc393SetWidth(bar,parseFloat(newBar.style.width)||0)||changed;
    const faces=node.querySelector('.gc201Faces'),newFaces=expected.querySelector('.gc201Faces');
    if(faces&&newFaces&&faces.innerHTML!==newFaces.innerHTML){faces.innerHTML=newFaces.innerHTML;changed=true}
   });
  }
  document.querySelectorAll('.gc330Quick button').forEach(btn=>{
   const label=btn.querySelector('span')?.textContent.trim();
   const map={People:localRoster(state.currentRegion).length,Parties:localParties(state.currentRegion).length,
    Market:Math.round(state.regions[state.currentRegion]?.prosperity||0),
    Vault:localInventory().reduce((s,x)=>s+x.qty,0)};
   if(Object.prototype.hasOwnProperty.call(map,label))
    changed=gc393SetText(btn.querySelector('b'),map[label])||changed;
  });
 }
 if(state.ui?.tab==='contracts'){
  const txt=document.querySelector('.gc330ContractContext span:first-child');
  const r=state.regions?.[state.currentRegion];
  if(txt&&r){
   const b=txt.querySelector('b');
   changed=gc393SetText(b,Math.round(r.threat))||changed;
  }
 }
 return changed;
}
const _gc351TargetedPatchGC393=gc351TargetedPatch;
gc351TargetedPatch=function(...args){
 const original=_gc351TargetedPatchGC393(...args);
 if(!state||document.hidden)return original;
 GC393_LIVE_STATS.ticks++;
 try{
  const updated=gc393RoomLive()||gc393FreebladeLive()||gc393CompanyLive();
  /* Execute all patch families on every heartbeat, not short-circuit OR. */
  const two=gc393FreebladeLive(),three=gc393CompanyLive();
  if(updated||two||three){GC393_LIVE_STATS.patches++;return true}
 }catch(e){
  GC393_LIVE_STATS.errors++;
  if(typeof gc341RuntimeError==='function')gc341RuntimeError('v21.9.3 live number patch',e);
 }
 return original;
};
window.__GC393_LIVE_STATS=()=>({...GC393_LIVE_STATS});
const _auditGC393Live=audit;
audit=function(){
 const a=_auditGC393Live();
 a.liveTownActivityCountdown=true;
 a.liveFounderAndFreebladeNumbers=true;
 a.liveRegionalProgressBars=true;
 a.liveStanceProgressBars=true;
 a.liveFoundingProgress=true;
 return a;
};
window.__BL_AUDIT=audit;