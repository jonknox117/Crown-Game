/* Grim Company v21.3.1 — QoL & Bugfixes.
   Restore visible combat, make Push persistent/readable, and make party assignment frictionless. */
const GC331_VERSION='21.3.1';

function gc331PartyAssignmentState(a,target){
 const current=state.parties.find(q=>q.id!==target.id&&q.members.includes(a.id))||null;
 const targetHas=target.members.includes(a.id);
 let reason='';
 if(target.expedition)reason='This party is already in the field.';
 else if(targetHas)reason='Assigned here.';
 else if(a.status!=='Ready')reason=a.status==='Recovering'?'Recovering adventurers cannot deploy yet.':`${gc193OrderLabel(a)} — unavailable.`;
 else if(current?.expedition)reason=`In the field with ${current.name}.`;
 else if(target.members.length>=partyCap(target.regionId))reason='Target party is full.';
 else if(current)reason=`Will move from ${current.name}.`;
 else reason='Available.';
 return{current,targetHas,reason,canRemove:targetHas&&!target.expedition,canAdd:!targetHas&&!target.expedition&&a.status==='Ready'&&!current?.expedition&&target.members.length<partyCap(target.regionId)};
}
renderModalParty=function(pid){
 const p=state.parties.find(x=>x.id===pid);if(!p)return;
 const cap=partyCap(p.regionId),roster=localRoster(p.regionId).filter(a=>a.status!=='Dead'||p.members.includes(a.id));
 modal(`<div class="sheetHead"><div><h3>${esc(p.name)}</h3><div class="tiny muted">${p.members.length}/${cap} members • Cohesion ${Math.round(p.cohesion||0)}</div></div><button class="x" data-action="close">×</button></div><div class="gc331PartyManagerLead"><b>Build the party you actually want.</b><span>Adding someone who is assigned to another idle party moves them here automatically. People already in the field stay locked.</span></div><div class="gc331PartyManager">${roster.map(a=>{
  const s=gc331PartyAssignmentState(a,p),captain=p.captainId===a.id;
  const assignment=s.targetHas?`This party${captain?' • Captain':''}`:s.current?`${s.current.name}${s.current.captainId===a.id?' • Captain':''}`:'Unassigned';
  const action=s.targetHas?'Remove':s.current?'Move Here':'Add';
  const disabled=s.targetHas?!s.canRemove:!s.canAdd;
  return`<div class="gc331PartyMember ${s.targetHas?'assigned':''} ${disabled?'locked':''}"><button class="gc331PartyIdentity" data-action="inspect" data-id="${a.id}"><span>${blPortraitHTML(a,'blPortraitMini')}</span><div><b>${esc(a.name)}</b><small>Lv.${a.lvl} ${esc(a.culture)} ${esc(a.className)}</small><em>${esc(assignment)}</em></div></button><div class="gc331PartyControls"><button class="btn ${s.targetHas?'':'primary'}" data-action="toggleMember" data-party="${p.id}" data-id="${a.id}" ${disabled?'disabled':''}>${action}</button>${s.targetHas?`<button class="btn ghost" data-action="captain" data-party="${p.id}" data-id="${a.id}" ${captain?'disabled':''}>${captain?'Captain':'Make Captain'}</button>`:''}<small>${esc(s.reason)}</small></div></div>`;
 }).join('')}</div>`);
};
togglePartyMember=function(pid,aid){
 const p=state.parties.find(x=>x.id===pid),a=state.roster.find(x=>x.id===aid);if(!p||!a)return;
 if(p.expedition)return toast('That party is already in the field.');
 const inP=p.members.includes(aid);
 if(inP){
  p.members=p.members.filter(id=>id!==aid);
  if(p.captainId===aid)p.captainId=p.members[0]||null;
  save();renderModalParty(pid);return;
 }
 if(a.status!=='Ready')return toast(a.status==='Recovering'?'They need to recover before joining a party.':'That adventurer is not currently available.');
 if(p.members.length>=partyCap(p.regionId))return toast('Party is at its current capacity.');
 const other=state.parties.find(q=>q.id!==p.id&&q.members.includes(aid));
 if(other?.expedition)return toast(`${a.name} is currently in the field with ${other.name}.`);
 if(other){
  other.members=other.members.filter(id=>id!==aid);
  if(other.captainId===aid)other.captainId=other.members[0]||null;
 }
 p.members.push(aid);if(!p.captainId)p.captainId=aid;
 save();renderModalParty(pid);toast(other?`${a.name} moved to ${p.name}.`:`${a.name} added to ${p.name}.`);
};

function gc331CombatPanel(p){
 const e=p?.expedition,b=e?.battle;if(!b)return'';
 const down=b.allies.filter(u=>u.gc320Downed).length;
 return`<div class="gc331CombatStage ${down?'danger':''}"><div class="gc331CombatHeader"><div><span>LIVE AUTO-COMBAT</span><b>Round ${Math.max(1,Number(b.round)||1)}</b></div><small>${down?`${down} ally downed`:'Combat resolves one round at a time.'}</small></div>${battleHTML(b)}<div class="gc331CombatNote">This fight is happening now. Play/Fast controls its speed; Founder decisions still hard-pause the entire simulation.</div></div>`;
}
function gc331PushControl(p){
 const e=p.expedition,mom=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP);
 if(e.battle)return`<button class="btn gc331Push disabled" disabled>PUSH LOCKED — COMBAT</button>`;
 return`<button class="btn goldbtn gc331Push" data-action="gc199Push" data-id="${p.id}">PUSH PACE +${Math.round(GC201_PUSH_STEP*100)}%</button><span class="gc331PushMeta">Current pace ${(1+mom).toFixed(2)}× • pushing increases travel strain and contact exposure.</span>`;
}
gc330ExpeditionCard=function(p){
 const e=p?.expedition;if(!e)return'';
 gc193MigrateExpedition(p);
 const members=partyMembers(p),down=e.battle?.allies?.filter(u=>u.gc320Downed)||[],recent=(e.battle?.log||e.events||[]).slice(-4),rate=gc201ContactRate(p),mom=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP);
 const total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),pct=clamp(total/Math.max(.001,Number(e.durationDays)||1)*100,0,100);
 const field=typeof gc250FieldEncounterHTML==='function'?gc250FieldEncounterHTML(e):'';
 return`<div class="card gc330Expedition gc331Expedition ${down.length?'critical':''}" data-gc331-party="${p.id}"><div class="gc330ExpeditionHead"><div><span>${gc330ExpeditionStatus(p)} • RISK ${e.contract.risk}</span><h3>${esc(p.name)}</h3><small>${esc(e.contract.title)}</small></div><strong data-gc331-pct>${Math.round(pct)}%</strong></div>${typeof gc201TravelVisual==='function'?gc201TravelVisual(p):''}<div class="bar goldbar gc331Progress"><i data-gc331-progress style="width:${pct}%"></i></div><div class="gc331LiveMeta"><span data-gc331-eta>${esc(gc199Eta(p))}</span><span data-gc331-contact>CONTACT ${esc(gc201ContactLabel(rate))}</span><span data-gc331-pace>PACE ${(1+mom).toFixed(2)}×</span></div><div class="gc330PartyFaces">${members.map(a=>`<button data-action="inspect" data-id="${a.id}" title="${esc(a.name)}">${blPortraitHTML(a,'blPortraitMini')}<span>${a.status==='Dead'?'DEAD':`Lv.${a.lvl}`}</span></button>`).join('')}</div>${down.length?`<div class="gc320DownedStrip"><b>${down.length} DOWNED — MORTAL DANGER</b><span>${down.map(u=>`${esc(u.name)} • ${gc320DangerLabel(gc320MortalityPreview(p,u,false))}`).join(' · ')}</span></div>`:''}${e.battle?gc331CombatPanel(p):field||''}<div class="gc330Recent"><b>${e.battle?'COMBAT FEED':'RECENT'}</b>${recent.length?recent.map(x=>`<div>${esc(x)}</div>`).join(''):'<div class="muted">No significant events yet.</div>'}</div><div class="gc331ExpeditionActions">${gc331PushControl(p)}<div class="actions"><button class="btn ghost" data-action="gc330FullLog" data-id="${p.id}">Full Log</button><button class="btn dangerBtn" data-action="gc320Retreat" data-id="${p.id}" ${e.gc260PendingDecision?'disabled':''}>Withdraw</button></div></div></div>`;
};

function gc331RefreshExpeditionCard(pid){
 if(!state||gc270IsFreeblade())return;
 const p=state.parties.find(x=>x.id===pid),node=document.querySelector(`[data-gc331-party="${pid}"]`);
 if(!node||!p?.expedition)return;
 node.outerHTML=gc330ExpeditionCard(p);
}
const _gc199UpdateClockGC331=gc199UpdateClock;
gc199UpdateClock=function(){
 _gc199UpdateClockGC331();
 if(!state||gc270IsFreeblade())return;
 document.querySelectorAll('[data-gc331-party]').forEach(card=>{
  const p=state.parties.find(x=>x.id===card.dataset.gc331Party),e=p?.expedition;if(!e)return;
  const total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),pct=clamp(total/Math.max(.001,Number(e.durationDays)||1)*100,0,100),mom=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP),rate=gc201ContactRate(p);
  const n=card.querySelector('[data-gc331-pct]'),bar=card.querySelector('[data-gc331-progress]'),eta=card.querySelector('[data-gc331-eta]'),contact=card.querySelector('[data-gc331-contact]'),pace=card.querySelector('[data-gc331-pace]');
  if(n)n.textContent=`${Math.round(pct)}%`;if(bar)bar.style.width=`${pct}%`;if(eta)eta.textContent=gc199Eta(p);if(contact)contact.textContent=`CONTACT ${gc201ContactLabel(rate)}`;if(pace)pace.textContent=`PACE ${(1+mom).toFixed(2)}×`;
 });
};

let GC331_COMBAT_REFRESH=false;
const _combatRoundGC331=combatRound;
combatRound=function(p){
 const out=_combatRoundGC331(p);
 if(!GC331_COMBAT_REFRESH){
  GC331_COMBAT_REFRESH=true;
  requestAnimationFrame(()=>{GC331_COMBAT_REFRESH=false;if(p?.expedition)gc331RefreshExpeditionCard(p.id);else if(state?.ui?.tab==='contracts')render()});
 }
 return out;
};

/* Founder combat is close-up play: once a battle actually begins, put it in front
   of the player. Background company battles remain background unless inspected. */
const _startBattleGC331=startBattle;
startBattle=function(p){
 const out=_startBattleGC331(p),e=p?.expedition;
 if(e?.battle&&gc260FounderInParty(p)){
  state.ui.tab=gc270IsFreeblade()?'jobs':'contracts';save();render();
  requestAnimationFrame(()=>document.querySelector(`[data-gc331-party="${p.id}"]`)?.scrollIntoView({block:'start',behavior:'smooth'}));
 }
 return out;
};

/* Remove stale text left over from systems that no longer exist. */
const _hqInfoGC331=hqInfo;
hqInfo=function(k){
 if(k==='Contract Office'){
  const lv=hq().upgrades[k]||0,d=HQ_DEFS[k];return modal(`<div class="sheetHead"><h3>${d.icon} ${esc(k)}</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(d.desc)}</div><div class="gold small" style="margin-top:6px">The board always shows one contract at every Risk tier. Contract Office does not add slots; its value is better contract pay and stronger scouting/intel support. Current Lv.${lv}/${d.max}.</div></div>`);
 }
 if(k==='Stores'){
  const lv=hq().upgrades[k]||0,d=HQ_DEFS[k];return modal(`<div class="sheetHead"><h3>${d.icon} ${esc(k)}</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(d.desc)}</div><div class="gold small" style="margin-top:6px">Market purchase prices are reduced by ${lv*4}%. Adventurers are paid through contract shares; there is no weekly payroll.</div></div>`);
 }
 return _hqInfoGC331(k);
};
gc199TimeHelp=function(){
 modal(`<div class="sheetHead"><h3>How Time Works</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>Active play only.</b> Closing or backgrounding the game pauses it. No offline catch-up.</div><div class="list"><div class="card"><b>Play / Fast</b><div class="small muted">HQ stances, travel, world pressure and auto-combat advance together while the simulation runs.</div></div><div class="card"><b>Personal decisions hard-lock time</b><div class="small muted">If you are personally on an expedition and a decision appears, absolutely nothing progresses until you answer it.</div></div><div class="card"><b>Four HQ stances</b><div class="small muted">Scout, Odd Jobs and Train are group activities. Recover is individual.</div></div><div class="card"><b>Push Pace</b><div class="small muted">Push is always visible while traveling. Repeated pushes add temporary speed at the cost of greater strain and danger. It is locked during combat.</div></div><div class="card"><b>Combat</b><div class="small muted">Combat resolves automatically and is shown live on the expedition card. Founder combat is brought directly in front of you.</div></div></div>`);
};
