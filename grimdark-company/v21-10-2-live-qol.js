/* Grim Company v21.10.2 — live HUD and progress QoL sweep.
   Reconcile the currently mounted UI without resetting scroll, scene art,
   open inputs, combat controls or the whole screen every simulation tick. */
const GC412_VERSION='21.10.2';
const GC412_STATS={ticks:0,leafUpdates:0,barUpdates:0,modalUpdates:0,structuralMisses:0,errors:0};
let GC412_LAST_DOM=0;
const GC412_SKIP='.gc380Stage,[data-gc410-party],[data-gc410-field],.blSvgPortrait,svg,canvas,script,style';
function gc412KeepNode(node){
 return !(node?.nodeType===1&&node.matches?.('.gc380Stage,[data-gc410-party],[data-gc410-field]'));
}
function gc412Children(node,root=false){
 const all=Array.from(node?.childNodes||[]);
 return root?all.filter(gc412KeepNode):all;
}
function gc412Reconcile(now,next,depth=0){
 if(!now||!next||now.nodeType!==next.nodeType)return false;
 if(now.nodeType===3){
  if(now.nodeValue!==next.nodeValue){
   now.nodeValue=next.nodeValue;GC412_STATS.leafUpdates++;
  }
  return true;
 }
 if(now.nodeType!==1)return true;
 if(now.tagName!==next.tagName)return false;
 if(now.matches(GC412_SKIP)||next.matches(GC412_SKIP))return true;
 if(now.matches('input,textarea,select,[contenteditable]'))return true;
 if(now.matches('button')&&now.disabled!==next.disabled){now.disabled=next.disabled;GC412_STATS.leafUpdates++}
 for(const key of ['aria-valuenow','aria-valuetext','aria-disabled','aria-label','title']){
  const n=next.getAttribute(key),v=now.getAttribute(key);
  if(n!==v){
   if(n===null)now.removeAttribute(key);else now.setAttribute(key,n);
   GC412_STATS.leafUpdates++;
  }
 }
 /* Only touch explicitly rendered bar widths. Do not overwrite unrelated
    CSS animation styles, element transforms, or the art presentation. */
 if(next.style?.width&&now.style.width!==next.style.width){
  now.style.width=next.style.width;GC412_STATS.barUpdates++;
 }
 const oldChildren=gc412Children(now),newChildren=gc412Children(next);
 if(oldChildren.length!==newChildren.length)return false;
 for(let i=0;i<oldChildren.length;i++){
  if(!gc412Reconcile(oldChildren[i],newChildren[i],depth+1))return false;
 }
 return true;
}
function gc412PatchScreen(){
 if(!state||document.hidden)return false;
 const screen=document.querySelector('#app .screen');
 if(!screen||typeof gc347CurrentBodyHTML!=='function')return false;
 if(typeof gc347InteractionBusy==='function'&&gc347InteractionBusy())return false;
 const now=gc351Now();
 if(now-GC412_LAST_DOM<480)return false;
 GC412_LAST_DOM=now;GC412_STATS.ticks++;
 try{
  const t=document.createElement('template');
  t.innerHTML=gc347CurrentBodyHTML();
  const current=gc412Children(screen,true),fresh=gc412Children(t.content);
  if(current.length!==fresh.length){
   GC412_STATS.structuralMisses++;
   return false;
  }
  let complete=true;
  for(let i=0;i<current.length;i++){
   if(!gc412Reconcile(current[i],fresh[i]))complete=false;
  }
  if(!complete)GC412_STATS.structuralMisses++;
  return complete;
 }catch(e){
  GC412_STATS.errors++;
  if(typeof gc341RuntimeError==='function')gc341RuntimeError('v21.10.2 live DOM reconcile',e);
  return false;
 }
}
function gc412PatchModal(){
 if(!state||document.hidden)return false;
 const modalRoot=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(!modalRoot?.classList.contains('show')||!sheet)return false;
 const active=document.activeElement;
 if(active&&/^(INPUT|TEXTAREA|SELECT)$/i.test(active.tagName))return false;
 let changed=false;
 /* Training/staffing modal: keep team counters, live XP progress and HP
    current without replacing the selection modal or stealing touch focus. */
 const dashboard=sheet.querySelector('.gc201StanceGrid');
 if(dashboard&&typeof gc201StanceDashboard==='function'){
  const t=document.createElement('template');t.innerHTML=gc201StanceDashboard(state.currentRegion);
  const fresh=t.content.querySelector('.gc201StanceGrid');
  if(fresh&&gc412Reconcile(dashboard,fresh)){GC412_STATS.modalUpdates++;changed=true}
 }
 sheet.querySelectorAll('.gc193OrderRow').forEach(row=>{
  const id=row.querySelector('[data-action="gcOrderPick"]')?.dataset.id;
  const a=state.roster.find(x=>x.id===id);if(!a)return;
  const b=row.querySelector('span'),status=row.querySelector('strong'),btn=row.querySelector('[data-action="gcOrderPick"]');
  const val=a.culture+' '+a.className+' • '+a.hp+'/'+derived(a).maxHp+' HP';
  if(b&&b.textContent!==val){b.textContent=val;changed=true}
  const label=gc193OrderLabel(a);
  if(status&&status.textContent!==label){status.textContent=label;changed=true}
  if(btn){
   const locked=['Expedition','Captured','Recovering'].includes(a.status);
   if(btn.disabled!==locked){btn.disabled=locked;changed=true}
   const bt=a.status==='Ready'?'Change':'Locked';
   if(btn.textContent!==bt){btn.textContent=bt;changed=true}
  }
 });
 /* Live experience and health numbers on an open character sheet. */
 const charId=sheet.querySelector('[data-action="gear"][data-id]')?.dataset.id;
 const char=state.roster.find(x=>x.id===charId);
 if(char){
  const sections=[...sheet.querySelectorAll('.sectionTitle')];
  const condition=sections.find(n=>n.querySelector('h3')?.textContent?.trim()==='Condition & Experience');
  const card=condition?.nextElementSibling;
  if(condition&&card?.classList.contains('card')){
   const max=derived(char).maxHp,xpTotal=xpNeed(char.lvl);
   const exp=condition.querySelector('span');
   const xp=char.lvl>=GC194_MAX_LEVEL?'MAX':char.xp+'/'+xpTotal+' XP';
   const hp=card.querySelector('.statline b');
   const health=char.hp+'/'+max+' HP';
   const healthBar=card.querySelector('.hpbar i'),expBar=card.querySelector('.goldbar i');
   if(exp&&exp.textContent!==xp){exp.textContent=xp;changed=true}
   if(hp&&hp.textContent!==health){hp.textContent=health;changed=true}
   if(healthBar){const w=clamp(char.hp/max*100,0,100)+'%';if(healthBar.style.width!==w){healthBar.style.width=w;changed=true}}
   if(expBar){const w=clamp(char.xp/Math.max(1,xpTotal)*100,0,100)+'%';if(expBar.style.width!==w){expBar.style.width=w;changed=true}}
  }
 }
 if(changed)GC412_STATS.modalUpdates++;
 return changed;
}
/* Add previously missing structural signals. Numeric changes never cause
   teardown; roster duties, party membership, or loot list changes may. */
const _gc351StructuralSignatureGC412=gc351StructuralSignature;
gc351StructuralSignature=function(){
 const basic=_gc351StructuralSignatureGC412();
 if(!state)return basic;
 const roster=(state.roster||[]).map(a=>[a.id,a.regionId,a.status,a.dailyOrder].join(':')).join('|');
 const parties=(state.parties||[]).map(p=>p.id+':'+(p.members||[]).join(',')).join('|');
 const items=(state.inventory||[]).map(x=>x.item?.id||x.id||'').join(',');
 const caches=(state.caches||[]).map(x=>x.id).join(',');
 const recruits=state.regions?.[state.currentRegion]?.recruits?.map(a=>a.id).join(',')||'';
 return basic+';R:'+roster+';P:'+parties+';I:'+items+';C:'+caches+';H:'+recruits;
};
/* The structural refresh remains the existing guarded, scroll-preserving
   fallback. All numeric updates happen directly on mounted DOM nodes. */
const _gc351TargetedPatchGC412=gc351TargetedPatch;
gc351TargetedPatch=function(...args){
 const out=_gc351TargetedPatchGC412(...args);
 gc412PatchScreen();
 gc412PatchModal();
 return out;
};
const _auditGC412=audit;
audit=function(){
 const a=_auditGC412();
 a.liveEveryMountedNumberAndBar=true;
 a.noTabSwitchNeededForProgress=true;
 a.modalStanceAndConditionUpdates=true;
 a.livePatchPreservesNodeIdentity=true;
 a.livePatchPreservesScrollAndControls=true;
 return a;
};
window.__BL_AUDIT=audit;
window.__GC412_STATS=()=>({...GC412_STATS});
