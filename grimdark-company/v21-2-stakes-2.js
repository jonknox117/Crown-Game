/* Grim Company v21.2 — Stakes: DOWNED state, mortal danger, retreat and casualty choices. */
let GC320_SUPPRESS_FINISH=false;
let GC320_REPORT_GEAR=null;
const GC320_MORTAL_BASE={1:.08,2:.15,3:.25,4:.38,5:.52};

const _aliveGC320=alive;
alive=function(list){return _aliveGC320(list).filter(x=>!x.gc320Downed)};

function gc320DownedUnit(target,actor,p){
 const e=p?.expedition,b=e?.battle;if(!e||!b||!target||target.gc320Downed)return;
 const risk=clamp(Number(e.contract?.risk)||1,1,5),boss=gc290IsBoss(p,actor),horror=!!actor?.horror;
 target.hp=1;
 target.gc320Downed={round:b.round||1,exposure:0,base:GC320_MORTAL_BASE[risk],boss,horror,by:actor?.name||'hostile action',protection:null,extra:0};
 b.log.push(`${target.name} is DOWNED — ${gc320DangerLabel(gc320MortalityPreview(p,target,false))} MORTAL DANGER.`);
 gc199RecordFeed(`${target.name} was DOWNED on ${e.contract?.title||'an expedition'}.`,'danger');
}
function gc320BestFieldMedicine(p,excludeId=null){
 const people=partyMembers(p).filter(a=>a.status!=='Dead'&&a.id!==excludeId);
 return people.length?Math.max(...people.map(a=>derived(a).util.endure||0)):0;
}
function gc320MortalityPreview(p,u,loss=false){
 const d=u?.gc320Downed;if(!d)return 0;
 const e=p?.expedition,risk=clamp(Number(e?.contract?.risk)||1,1,5),a=state.roster.find(x=>x.id===u.charId);
 let chance=Number(d.base)||GC320_MORTAL_BASE[risk];
 chance+=Math.min(.20,(Number(d.exposure)||0)*.04)+(d.boss?.08:0)+(d.horror?.05:0)+(Number(d.extra)||0);
 if(loss)chance+=.22;else chance-=.07;
 const med=gc320BestFieldMedicine(p,u.charId);chance-=clamp((med-8)*.006,0,.12);
 const inf=e?.contract?.regionId&&state.regions[e.contract.regionId]?.hq?.established?(hq(e.contract.regionId).upgrades.Infirmary||0):0;chance-=inf*.025;
 if(a){chance-=clamp((derived(a).special.injuryResist||0)/200,0,.15)}
 if(d.protection==='protected')chance-=.16;
 if(d.protection==='carried')chance-=.27;
 if(d.protection==='extracted')chance-=.36;
 return clamp(chance,.03,.92);
}
function gc320DangerLabel(v){
 if(v<.14)return'LOW';if(v<.27)return'MODERATE';if(v<.43)return'HIGH';if(v<.62)return'SEVERE';return'CRITICAL';
}

const _enemyAttackGC320=enemyAttack;
enemyAttack=function(actor,target,p){
 const before=target?.hp||0,out=_enemyAttackGC320(actor,target,p);
 if(target&&before>0&&target.hp<=0)gc320DownedUnit(target,actor,p);
 return out;
};

function gc320TickDownedExposure(p){
 const b=p?.expedition?.battle;if(!b)return;
 b.allies.filter(u=>u.gc320Downed).forEach(u=>{
  u.gc320Downed.exposure=(Number(u.gc320Downed.exposure)||0)+1;
 });
}
function gc320UnresolvedCasualty(p){
 const e=p?.expedition,b=e?.battle;if(!e||!b||e.gc260PendingDecision)return null;
 const f=gc260Founder();
 return b.allies.find(u=>u.gc320Downed&&u.charId!==f?.id&&!u.gc320Downed.prompted)||null;
}
function gc320CasualtyDecisionHTML(p,d){
 const b=p.expedition.battle,u=b?.allies.find(x=>x.charId===d.targetId),a=state.roster.find(x=>x.id===d.targetId);if(!u||!a)return'';
 const danger=gc320DangerLabel(gc320MortalityPreview(p,u,false));
 return`<div class="gc320DecisionModal"><div class="gc320DecisionBanner danger"><span>SIMULATION PAUSED • CASUALTY</span><b>${esc(a.name)} is down.</b><small>Mortal Danger: ${danger}. The fight has not stopped for you.</small></div><div class="gc260Decision dangerDecision"><div class="gc260DecisionHead"><span>YOUR DECISION</span><b>How much do you risk to get them home?</b></div><p>${esc(a.name)} is alive but unable to fight. Continuing exposes them to worsening field trauma. Withdrawal saves lives but forfeits the contract.</p><div class="gc260DecisionChoices"><button class="card" data-action="gc320Casualty" data-party="${p.id}" data-id="${a.id}" data-choice="extract"><b>Extract now</b><small>Abandon the contract. Strongly reduces ${esc(a.name)}'s mortality danger.</small></button><button class="card" data-action="gc320Casualty" data-party="${p.id}" data-id="${a.id}" data-choice="protect"><b>Protect them and continue</b><small>Standing allies lose 12% Attack. ${esc(a.name)} is substantially safer.</small></button><button class="card" data-action="gc320Casualty" data-party="${p.id}" data-id="${a.id}" data-choice="carry"><b>Carry them yourself</b><small>Your Founder loses 35% Attack, Guard and Speed for this battle. ${esc(a.name)} is much safer.</small></button><button class="card" data-action="gc320Casualty" data-party="${p.id}" data-id="${a.id}" data-choice="press"><b>Press the attack</b><small>No combat penalty. Mortal danger worsens if the battle continues.</small></button></div></div></div>`;
}
const _gc320OpenDecisionModalB=gc320OpenDecisionModal;
gc320OpenDecisionModal=function(p){
 const d=p?.expedition?.gc260PendingDecision;
 if(d?.type==='casualty')return modal(gc320CasualtyDecisionHTML(p,d));
 return _gc320OpenDecisionModalB(p);
};
function gc320SetCasualtyDecision(p,u){
 const e=p?.expedition;if(!e||!u||e.gc260PendingDecision)return;
 if(!e.gc320ResumeMode)e.gc320ResumeMode=gc199Mode();
 u.gc320Downed.prompted=true;
 e.gc260PendingDecision={id:uid('decision'),type:'casualty',targetId:u.charId,title:`${u.name} is down`,createdDay:state.company.day};
 gc320ForcePause(`${u.name} is down. Your decision is required.`);
 gc320OpenDecisionModal(p);sfx('danger');save();
}

const _combatRoundGC320=combatRound;
combatRound=function(p){
 const had=new Set((p?.expedition?.battle?.allies||[]).filter(u=>u.gc320Downed).map(u=>u.charId));
 const out=_combatRoundGC320(p),e=p?.expedition,b=e?.battle;
 if(b){
  gc320TickDownedExposure(p);
  const casualty=gc260FounderInParty(p)?gc320UnresolvedCasualty(p):null;
  if(casualty)gc320SetCasualtyDecision(p,casualty);
 }
 return out;
};

function gc320HandleCasualty(pid,targetId,choice){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition,b=e?.battle,d=e?.gc260PendingDecision,u=b?.allies.find(x=>x.charId===targetId);
 if(!p||!e||!b||d?.type!=='casualty'||!u?.gc320Downed)return toast('That casualty decision is no longer available.');
 const resume=e.gc320ResumeMode||'paused';
 if(choice==='extract'){
  u.gc320Downed.protection='extracted';e.gc320Extraction={targetId,day:state.company.day};
  e.gc260PendingDecision=null;delete e.gc320ResumeMode;
  gc199RecordFeed(`WITHDRAWAL — ${p.name} abandoned ${e.contract.title} to extract ${u.name}.`,'danger');
  return resolveBattle(p,false);
 }
 if(choice==='protect'){
  u.gc320Downed.protection='protected';
  alive(b.allies).forEach(x=>x.attack=Math.max(1,Math.round(x.attack*.88)));
  b.log.push(`The line contracts around ${u.name}. Standing allies lose 12% Attack.`);
 }else if(choice==='carry'){
  u.gc320Downed.protection='carried';
  const f=gc260Founder(),fu=b.allies.find(x=>x.charId===f?.id);
  if(fu&&!fu.gc320CarryPenalty){fu.gc320CarryPenalty=true;fu.attack=Math.max(1,Math.round(fu.attack*.65));fu.guard=Math.max(1,Math.round(fu.guard*.65));fu.speed=Math.max(1,Math.round(fu.speed*.65))}
  b.log.push(`${f?.name||'The founder'} carries ${u.name}; personal combat effectiveness drops sharply.`);
 }else if(choice==='press'){
  u.gc320Downed.extra=(Number(u.gc320Downed.extra)||0)+.07;
  b.log.push(`The party presses the attack while ${u.name} remains exposed.`);
 }else return;
 e.gc260PendingDecision=null;delete e.gc320ResumeMode;_closeModalGC320();save();render();gc320ResumeAfterDecision(resume);
}

function gc320RecoverDeadGear(a,e,win){
 const rid=e.contract.regionId,items=Object.entries(a.gear||{}).filter(([,item])=>!!item);if(!items.length)return;
 e.gc320GearEvents=e.gc320GearEvents||[];
 state.regions[rid].gc320LostGear=Array.isArray(state.regions[rid].gc320LostGear)?state.regions[rid].gc320LostGear:[];
 const recovered=win||!!e.gc320Extraction;
 const names=[];
 items.forEach(([slot,item])=>{
  names.push(item.name);
  if(recovered)inventoryEntry(item,rid,1);
  else state.regions[rid].gc320LostGear.push({id:uid('lost'),item,owner:a.name,contract:e.contract.title,day:state.company.day});
  a.gear[slot]=null;
 });
 e.gc320GearEvents.push({name:a.name,recovered,names});
}
function gc320RecordFounderDeath(a,e){
 const fs=gc260System();if(!a?.gc260Founder||fs.deathRecorded)return;
 fs.deathRecorded=true;a.history=a.history||[];a.history.push(`Day ${state.company.day}: died from wounds suffered on ${e.contract.title}.`);
 pushHistory(`FOUNDER FALLEN — ${a.name} died on ${e.contract.title}.`,a.regionId);gc199RecordFeed(`FOUNDER FALLEN — ${a.name}.`,'danger');
}
function gc320ResolveDowned(p,e,b,win){
 const downed=b.allies.filter(u=>u.gc320Downed);
 downed.forEach(u=>{
  const a=state.roster.find(x=>x.id===u.charId);if(!a)return;
  const deathChance=gc320MortalityPreview(p,u,!win),label=gc320DangerLabel(deathChance);
  if(typeof gc300Legacy==='function'){const l=gc300Legacy(a);l.nearDeaths++;l.injuries++;gc300Evaluate(a)}
  let dead=chance(deathChance);
  if(dead&&hasArtifact('The Mourning Bell',e.contract.regionId)&&!e.bellUsed){
   e.bellUsed=true;dead=false;a.injury='Bell-Touched';a.recovery=Math.max(4,Number(a.recovery)||0);u.gc320Downed.protection='bell';
   e.events.push(`The Mourning Bell rings. ${a.name} is dragged back from death.`);
  }
  if(dead){
   a.status='Dead';a.hp=0;p.deaths=(Number(p.deaths)||0)+1;
   e.deaths=Array.isArray(e.deaths)?e.deaths:[];if(!e.deaths.includes(a.name))e.deaths.push(a.name);
   e.gc194Deaths=Array.isArray(e.gc194Deaths)?e.gc194Deaths:[];if(!e.gc194Deaths.includes(a.name))e.gc194Deaths.push(a.name);
   a.history=a.history||[];a.history.push(`Day ${state.company.day}: died after being downed on ${e.contract.title} (${label} mortal danger).`);
   e.events.push(`${a.name} died from wounds after the battle (${label} mortal danger).`);
   gc199RecordFeed(`DEATH — ${a.name} died after being downed on ${e.contract.title}.`,'danger');
   gc320RecoverDeadGear(a,e,win);
   if(typeof gc300Memorial==='function')gc300Memorial(a,e.contract.title);
   if(typeof bl18Memorial==='function')bl18Memorial(a,e.contract.title);
   gc320RecordFounderDeath(a,e);
  }else{
   const max=derived(a).maxHp;a.status='Expedition';a.hp=Math.max(1,Math.round(max*(.06+Math.random()*.08)));
   a.injury=a.injury||injuryName();a.recovery=Math.max(Number(a.recovery)||0,2+Math.round((Number(e.contract.risk)||1)*.8)+(win?0:2));
   a.gc320PendingRecovery=true;
   a.history=a.history||[];a.history.push(`Day ${state.company.day}: survived being downed on ${e.contract.title} (${label} mortal danger).`);
   e.events.push(`${a.name} survives but is badly wounded (${label} mortal danger).`);
   if(typeof gc300MaybeScar==='function')gc300MaybeScar(a,`surviving ${e.contract.title}`);
  }
 });
 return downed.length;
}

const _gc193FinishNoTimeGC320=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 if(GC320_SUPPRESS_FINISH)return false;
 const e=p?.expedition,pending=(p?.members||[]).map(id=>state.roster.find(a=>a.id===id)).filter(a=>a?.gc320PendingRecovery),gear=e?.gc320GearEvents?JSON.parse(JSON.stringify(e.gc320GearEvents)):null;
 if(gear?.length)GC320_REPORT_GEAR=gear;
 let out;try{out=_gc193FinishNoTimeGC320(p)}finally{GC320_REPORT_GEAR=null}
 pending.forEach(a=>{
  if(a.status!=='Dead'){a.status='Recovering';a.gc320PendingRecovery=false;a.dailyOrder='Recover';if(typeof gc220RememberReturn==='function'&&!gc200Work(a).gc220ReturnStance)gc220RememberReturn(a,'Train')}
 });
 save();return out;
};

const _resolveBattleGC320=resolveBattle;
resolveBattle=function(p,win){
 const e=p?.expedition,b=e?.battle;if(!e||!b)return _resolveBattleGC320(p,win);
 const hasDowned=b.allies.some(u=>u.gc320Downed);
 GC320_SUPPRESS_FINISH=true;let out;
 try{out=_resolveBattleGC320(p,win)}finally{GC320_SUPPRESS_FINISH=false}
 if(hasDowned)gc320ResolveDowned(p,e,b,win);
 if(!win&&p.expedition)return gc193FinishNoTime(p);
 save();render();return out;
};

const _showReportGC320=showReport;
showReport=function(r){
 const out=_showReportGC320(r),sheet=document.getElementById('sheet'),gear=GC320_REPORT_GEAR;
 if(sheet&&gear?.length){
  sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Equipment Recovery</h3><span>battlefield consequence</span></div>${gear.map(x=>`<div class="card ${x.recovered?'good':'danger'}"><b>${esc(x.name)} — ${x.recovered?'GEAR RECOVERED':'GEAR LOST IN THE FIELD'}</b><div class="tiny muted">${x.names.map(esc).join(' • ')}</div></div>`).join('')}`);
 }
 return out;
};

function gc320RetreatParty(pid){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition;if(!p||!e)return;
 if(e.gc260PendingDecision)return toast('Resolve the current decision first.');
 e.events.push('The party was ordered to withdraw. The contract will be recorded as failed.');
 gc199RecordFeed(`WITHDRAWAL ORDER — ${p.name} is abandoning ${e.contract.title}.`,'danger');
 if(e.battle)return resolveBattle(p,false);
 e.battleWon=false;return gc193FinishNoTime(p);
}
const _expeditionCardGC320=expeditionCard;
expeditionCard=function(p){
 let html=_expeditionCardGC320(p);if(!p?.expedition)return html;
 const down=p.expedition.battle?.allies?.filter(u=>u.gc320Downed)||[];
 const warning=down.length?`<div class="gc320DownedStrip"><b>${down.length} DOWNED</b><span>${down.map(u=>`${esc(u.name)} • ${gc320DangerLabel(gc320MortalityPreview(p,u,false))}`).join(' · ')}</span></div>`:'';
 const retreat=`<button class="btn dangerBtn" data-action="gc320Retreat" data-id="${p.id}" ${p.expedition.gc260PendingDecision?'disabled':''}>WITHDRAW</button>`;
 html=html.replace('<div class="actions">',warning+'<div class="actions">'+retreat);
 return html;
};
const _unitHTMLGC320=unitHTML;
unitHTML=function(u){
 if(!u?.gc320Downed)return _unitHTMLGC320(u);
 return`<div class="unit gc320DownedUnit"><div class="unitTop"><b>${esc(u.name)}</b><span>DOWNED</span></div><div class="hpbar"><i style="width:2%"></i></div><div class="gc320MortalTag">${gc320DangerLabel(u.gc320Downed.base+(u.gc320Downed.exposure||0)*.04)} MORTAL DANGER</div></div>`;
};

const _processActionGC320B=processAction;
processAction=function(el){
 if(el.dataset.action==='gc320Casualty')return gc320HandleCasualty(el.dataset.party,el.dataset.id,el.dataset.choice);
 if(el.dataset.action==='gc320Retreat')return gc320RetreatParty(el.dataset.id);
 return _processActionGC320B(el);
};
