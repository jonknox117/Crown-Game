/* Grim Company v21.4.8 — true live expedition UI.
   Freeblade and company expedition state now patch directly from simulation state.
   No tab switch or full-page render is required. */
const GC348_VERSION='21.4.8';
let GC348_LAST_POINTER_REAL=0;
const GC348_CARD_REFRESH_REAL=new Map();
const GC348_STATS={expeditionDomUpdates:0,pushImmediateUpdates:0,interactionExpiryUses:0,combatCardRefreshes:0};

/* v21.4.7 used a persistent touching boolean. On iOS, a missed touchend/pointerup
   could leave the entire live reconciler disabled forever. Interaction protection
   is now time-bounded instead of sticky. */
['touchstart','pointerdown','touchmove','pointermove'].forEach(name=>{
 document.addEventListener(name,()=>{GC348_LAST_POINTER_REAL=gc342Now()},{passive:true});
});
gc347InteractionBusy=function(){
 const modal=document.getElementById('modal');
 if(modal?.classList.contains('show'))return true;
 const a=document.activeElement;
 if(a&&/^(INPUT|TEXTAREA|SELECT)$/i.test(a.tagName))return true;
 const recent=gc342Now()-GC348_LAST_POINTER_REAL<300;
 if(recent)GC348_STATS.interactionExpiryUses++;
 return recent;
};

function gc348ExpeditionNumbers(p){
 const e=p?.expedition;if(!e)return null;
 const total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0);
 const duration=Math.max(.001,Number(e.durationDays)||1);
 const pct=clamp(total/duration*100,0,100);
 const mom=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP);
 const rate=gc201ContactRate(p);
 return{e,pct,mom,rate};
}
function gc348PatchLegacyCard(card,p){
 const x=gc348ExpeditionNumbers(p);if(!x)return false;
 const {e,pct,mom,rate}=x;
 const bar=card.querySelector('[data-gc199-progress]');
 const eta=card.querySelector('[data-gc199-eta]');
 const pace=card.querySelector('[data-gc201-momentum]');
 const risk=card.querySelector('[data-gc201-risk]');
 const status=card.querySelector('.statline .tiny.muted');
 const travel=card.querySelector('.gc200Travel');
 if(bar)bar.style.width=`${pct}%`;
 if(eta)eta.textContent=gc199Eta(p);
 if(pace)pace.textContent=`PACE ${(1+mom).toFixed(2)}×`;
 if(risk)risk.textContent=`CONTACT ${gc201ContactLabel(rate)}`;
 if(status)status.textContent=`${e.battle?'AUTO-COMBAT':'TRAVELING'} • ${Math.round(pct)}% complete`;
 if(travel){
  travel.style.setProperty('--gc201-speed',(1+mom).toFixed(2));
  travel.classList.toggle('gc201Pushing',mom>.02);
  const cap=travel.querySelector('.gc200TravelCaption');
  if(cap)cap.textContent=e.battle?'AUTO-COMBAT':mom>.02?`PUSHING ${(1+mom).toFixed(2)}×`:'ON THE ROAD';
 }
 return true;
}
function gc348PatchModernCard(card,p){
 const x=gc348ExpeditionNumbers(p);if(!x)return false;
 const {pct,mom,rate}=x;
 const n=card.querySelector('[data-gc331-pct]');
 const bar=card.querySelector('[data-gc331-progress]');
 const eta=card.querySelector('[data-gc331-eta]');
 const contact=card.querySelector('[data-gc331-contact]');
 const pace=card.querySelector('[data-gc331-pace]');
 const travel=card.querySelector('.gc200Travel');
 if(n)n.textContent=`${Math.round(pct)}%`;
 if(bar)bar.style.width=`${pct}%`;
 if(eta)eta.textContent=gc199Eta(p);
 if(contact)contact.textContent=`CONTACT ${gc201ContactLabel(rate)}`;
 if(pace)pace.textContent=`PACE ${(1+mom).toFixed(2)}×`;
 if(travel){
  travel.style.setProperty('--gc201-speed',(1+mom).toFixed(2));
  travel.classList.toggle('gc201Pushing',mom>.02);
  const cap=travel.querySelector('.gc200TravelCaption');
  if(cap)cap.textContent=p.expedition?.battle?'AUTO-COMBAT':mom>.02?`PUSHING ${(1+mom).toFixed(2)}×`:'ON THE ROAD';
 }
 return true;
}
function gc348RefreshExpeditionDOM(pid=null,forceCard=false){
 if(!state)return false;
 const cards=[...document.querySelectorAll('[data-gc199-party],[data-gc331-party]')];
 let changed=false;
 for(const card of cards){
  const id=card.dataset.gc199Party||card.dataset.gc331Party;
  if(pid&&id!==pid)continue;
  const p=state.parties.find(x=>x.id===id),e=p?.expedition;if(!p||!e)continue;
  const modern=card.hasAttribute('data-gc331-party');
  changed=(modern?gc348PatchModernCard(card,p):gc348PatchLegacyCard(card,p))||changed;

  /* Combat/log structure can change materially. Refresh only that expedition card,
     at a bounded rate, instead of waiting for navigation or rebuilding the app. */
  const now=gc342Now(),last=GC348_CARD_REFRESH_REAL.get(id)||0;
  if((forceCard||e.battle)&&now-last>650){
   GC348_CARD_REFRESH_REAL.set(id,now);
   if(modern&&typeof gc330ExpeditionCard==='function'){
    const fresh=gc330ExpeditionCard(p);
    if(fresh&&card.outerHTML!==fresh){card.outerHTML=fresh;GC348_STATS.combatCardRefreshes++;changed=true}
   }else if(!modern&&typeof expeditionCard==='function'){
    const fresh=expeditionCard(p);
    if(fresh&&card.outerHTML!==fresh){card.outerHTML=fresh;GC348_STATS.combatCardRefreshes++;changed=true}
   }
  }
 }
 if(changed)GC348_STATS.expeditionDomUpdates++;
 return changed;
}
window.__GC348_REFRESH=gc348RefreshExpeditionDOM;

/* Update expedition DOM every simulation step, regardless of Freeblade/company mode. */
const _gc199AdvanceFieldClocksGC348=gc199AdvanceFieldClocks;
gc199AdvanceFieldClocks=function(deltaDays){
 const out=_gc199AdvanceFieldClocksGC348(deltaDays);
 if(state&&!document.hidden)requestAnimationFrame(()=>gc348RefreshExpeditionDOM());
 return out;
};

/* Also patch during clock refreshes. This directly fixes the old v21.3.1 branch
   that intentionally skipped Freeblade expedition cards. */
const _gc199UpdateClockGC348=gc199UpdateClock;
gc199UpdateClock=function(){
 const out=_gc199UpdateClockGC348();
 if(state&&!document.hidden)gc348RefreshExpeditionDOM();
 return out;
};

/* Pushing changes pace immediately, so show it on the same frame as the tap. */
const _gc199PushPartyGC348=gc199PushParty;
gc199PushParty=function(pid){
 const out=_gc199PushPartyGC348(pid);
 requestAnimationFrame(()=>{
  gc348RefreshExpeditionDOM(pid,true);
  gc347RefreshVisibleBody?.(false);
 });
 GC348_STATS.pushImmediateUpdates++;
 return out;
};

/* Make the v21.4.7 heartbeat recover a frozen screen even after a touch sequence. */
clearInterval(GC347_TIMER);
GC347_TIMER=setInterval(()=>{
 if(!state||document.hidden)return;
 gc348RefreshExpeditionDOM();
 gc347LiveTick(false);
},300);

const _auditGC348=audit;
audit=function(){
 const out=_auditGC348();
 out.v348TrueLiveExpeditionUi=GC348_VERSION;
 out.freebladeJobProgressUpdatesLive=true;
 out.freebladePushPaceUpdatesLive=true;
 out.companyExpeditionProgressUpdatesLive=true;
 out.expeditionEtaUpdatesLive=true;
 out.expeditionContactUpdatesLive=true;
 out.iosTouchCannotPermanentlyFreezeLiveUi=true;
 out.pushUpdatesSameFrame=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC348_STATS=()=>({...GC348_STATS});

window.__GC348_TEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  gc270CreateFreebladeState('veyric',{name:'Live Job Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1});
  const f=gc260Founder();f.lvl=8;gc310Freeblade().reputation=30;
  const c=gc310FreebladeContracts().find(x=>x.risk===1)||gc310FreebladeContracts()[0];
  gc310AcceptContract(c.id);
  const p=state.parties.find(x=>x.expedition&&x.members.includes(f.id));
  if(!p?.expedition)throw new Error('Freeblade contract did not start.');
  state.ui.tab='jobs';render();gc199MountClock();
  let card=document.querySelector(`[data-gc199-party="${p.id}"]`);
  if(!card)throw new Error('Freeblade expedition card not rendered.');
  const bar=()=>document.querySelector(`[data-gc199-party="${p.id}"] [data-gc199-progress]`)?.style.width||'';
  const pace=()=>document.querySelector(`[data-gc199-party="${p.id}"] [data-gc201-momentum]`)?.textContent||'';
  const status=()=>document.querySelector(`[data-gc199-party="${p.id}"] .statline .tiny.muted`)?.textContent||'';
  const beforeBar=bar(),beforeStatus=status();
  state.timeSystem.gc199Mode='play';
  for(let i=0;i<5;i++)gc199AdvanceFieldClocks(.015);
  gc348RefreshExpeditionDOM(p.id);
  const afterBar=bar(),afterStatus=status();
  const progressMoved=beforeBar!==afterBar&&beforeStatus!==afterStatus;

  p.expedition.gc201Momentum=0;
  gc348RefreshExpeditionDOM(p.id);
  const paceBefore=pace();
  gc199PushParty(p.id);
  gc348RefreshExpeditionDOM(p.id,true);
  const paceAfter=pace();
  const pushLive=paceBefore.includes('1.00')&&!paceAfter.includes('1.00')&&paceAfter.includes('PACE');

  /* Reproduce the exact iOS failure mode: sticky old touch flag must no longer block. */
  GC347_TOUCHING=true;GC348_LAST_POINTER_REAL=gc342Now()-2000;
  const notSticky=!gc347InteractionBusy();
  GC347_TOUCHING=false;

  const sameTab=state.ui.tab==='jobs';
  const oneClock=gc346AllClocks().length===1;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(progressMoved&&pushLive&&notSticky&&sameTab&&oneClock&&integrity),progressMoved,beforeBar,afterBar,beforeStatus,afterStatus,pushLive,paceBefore,paceAfter,notSticky,sameTab,oneClock,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;window.__GC345_FORCE_PHONE=oldForce;GC347_TOUCHING=false;
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};