/* Grim Company v19.3 — global calendar, healing, meaningful daily orders, branding. */
const GC193_VERSION='19.3';
const GC193_ORDERS=['Rest','Train','Patrol','Scout','Mentor','Facility'];
const GC193_FACILITIES=['Infirmary','Training Yard','Contract Office','Occult Archive','Salvager’s Lodge'];
let GC193_FINISHING=false;
let GC193_ADVANCING=false;
let GC193_RETURN_REPORTS=[];

function gc193SkullSvg(cls=''){
 return `<svg class="gc193Skull ${cls}" viewBox="0 0 100 122" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grim Company bleeding skull"><path d="M50 7C27 7 12 24 12 46c0 15 6 25 15 33v12l8 17 5-25 6 32 5-37 6 37 5-32 5 25 8-17V79c9-8 15-18 15-33C88 24 73 7 50 7Z" fill="#ed1b2f"/><path d="M50 16c-18 0-29 13-29 31 0 10 4 18 11 25l7 6 4-13h14l4 13 7-6c7-7 11-15 11-25 0-18-11-31-29-31Z" fill="#f6f2e9"/><path d="M22 50c6-13 17-17 27-10-2 12-11 20-23 17Zm56 0c-6-13-17-17-27-10 2 12 11 20 23 17ZM50 53l-8 16 5 9h6l5-9Z" fill="#08090a"/><path d="M33 77h34l-4 11-7-8-6 11-6-11-7 8Z" fill="#08090a"/><path d="M30 81v28M42 84v30M50 88v27M58 84v30M70 81v28" stroke="#ed1b2f" stroke-width="5" stroke-linecap="round"/></svg>`;
}

function gc193InitState(s=state){
 if(!s)return s;
 s.timeSystem=s.timeSystem||{};
 s.timeSystem.version=GC193_VERSION;
 s.timeSystem.lastReport=s.timeSystem.lastReport||null;
 s.timeSystem.regionEffects=s.timeSystem.regionEffects||{};
 (s.roster||[]).forEach(a=>{
   if(a.status==='Recovering'&&(Number(a.recovery)||0)<=0){a.status='Ready';a.injury=null;a.recovery=0}
   if(!a.dailyOrder)a.dailyOrder='Train';
   if(a.dailyFacility==null)a.dailyFacility=null;
   if(a.dailyMentorId==null)a.dailyMentorId=null;
   a.history=a.history||[];
 });
 Object.values(s.regions||{}).forEach(r=>(r.contracts||[]).forEach(gc193EnsureContract));
 (s.parties||[]).forEach(p=>{if(p.expedition)gc193MigrateExpedition(p,s)});
 return s;
}

function gc193EnsureContract(c){
 if(!c)return c;
 if(!Number.isFinite(c.gcDuration))c.gcDuration=gc193ContractDuration(c);
 c.gcIntel=Number(c.gcIntel)||0;
 c.gcScoutEdge=Number(c.gcScoutEdge)||0;
 c.gcOccultEdge=Number(c.gcOccultEdge)||0;
 c.gcOfficeBonus=Number(c.gcOfficeBonus)||0;
 return c;
}
function gc193ContractDuration(c){
 const base={Defense:1,Negotiation:1,Hunt:2,Rescue:2,Retrieval:2,Investigation:2,Extermination:2,Assassination:2,Escort:3,Caravan:3,Exploration:3,Siege:4}[c?.type]||2;
 const hard=(Number(c?.risk)||1)>=4?1:0;
 const variable=['Hunt','Rescue','Retrieval','Extermination','Escort','Caravan','Exploration','Siege'].includes(c?.type)?(blHash(`${c?.id}|duration`)%2):0;
 return clamp(base+hard+variable,1,6);
}
function gc193MigrateExpedition(p,s=state){
 const e=p?.expedition;if(!e||!s)return;
 gc193EnsureContract(e.contract);
 if(!e.gcClock){
   e.durationDays=Math.max(1,e.contract.gcDuration||gc193ContractDuration(e.contract));
   e.elapsedDays=Math.min(e.durationDays,Math.max(0,Math.floor(((Number(e.progress)||0)/100)*e.durationDays)));
   e.departureDay=Number(e.departureDay)||s.company.day;
   e.expectedReturnDay=e.departureDay+e.durationDays;
   e.encounterDay=Math.max(1,e.durationDays-1);
   e.gcChecksDone=Number(e.gcChecksDone)||0;
   e.gcClock=true;
 }
 e.progress=clamp(Math.round((e.elapsedDays/e.durationDays)*100),0,100);
}

const _normalizeStateGC193=normalizeState;
normalizeState=function(s){s=_normalizeStateGC193(s);return gc193InitState(s)};
const _createStateGC193=createState;
createState=function(name){const s=_createStateGC193(name);return gc193InitState(s)};

function gc193OrderLabel(a){
 if(!a)return'—';
 if(a.status==='Dead')return'Fallen';
 if(a.status==='Expedition')return'On Contract';
 if(a.status==='Captured')return'Captured';
 if(a.status==='Recovering')return'Recovery';
 if(a.dailyOrder==='Mentor'){
   const m=state.roster.find(x=>x.id===a.dailyMentorId);
   return m?`Mentor ${m.name.split(' ')[0]}`:'Mentor';
 }
 if(a.dailyOrder==='Facility')return a.dailyFacility?`Duty: ${a.dailyFacility}`:'Facility Duty';
 return a.dailyOrder||'Train';
}
function gc193AtHQ(a){return a&&a.status!=='Dead'&&a.status!=='Expedition'&&a.status!=='Captured'}
function gc193ReadyAtHQ(a){return a&&a.status==='Ready'}
function gc193FacilityWorkers(regionId,facility){return state.roster.filter(a=>gc193ReadyAtHQ(a)&&a.regionId===regionId&&a.dailyOrder==='Facility'&&a.dailyFacility===facility)}
function gc193FacilityEffects(regionId){
 const effects={healPct:0,trainingMult:1,salvageBonus:0,office:null,archive:null};
 const inf=gc193FacilityWorkers(regionId,'Infirmary');
 if(inf.length){
   const scores=inf.map(a=>derived(a).util.occult+derived(a).combat.resolve).sort((a,b)=>b-a);
   effects.healPct=Math.min(.03,.015+(scores[0]||0)/3000+(scores[1]||0)/6000);
 }
 const trainers=gc193FacilityWorkers(regionId,'Training Yard');
 if(trainers.length){
   const best=trainers.map(a=>a.lvl*3+bl17EnsureCareer(a)*6+derived(a).combat.resolve*.25).sort((a,b)=>b-a)[0]||0;
   effects.trainingMult=1+Math.min(.55,.20+best/180);
 }
 const office=gc193FacilityWorkers(regionId,'Contract Office').sort((a,b)=>derived(b).util.talk-derived(a).util.talk)[0];
 if(office)effects.office=office;
 const archive=gc193FacilityWorkers(regionId,'Occult Archive').sort((a,b)=>derived(b).util.occult-derived(a).util.occult)[0];
 if(archive)effects.archive=archive;
 const salv=gc193FacilityWorkers(regionId,'Salvager’s Lodge').sort((a,b)=>derived(b).util.scout-derived(a).util.scout)[0];
 if(salv)effects.salvageBonus=Math.min(.18,.08+derived(salv).util.scout/350);
 return effects;
}

function gc193HealAdventurer(a,effects,order,report){
 if(!gc193AtHQ(a))return;
 const max=derived(a).maxHp;
 a.hp=Math.min(max,Math.max(0,a.hp));
 const infLv=hq(a.regionId).upgrades.Infirmary||0;
 const facility=effects?.healPct||0;
 let pct=0;
 if(a.status==='Recovering')pct=.10;
 else if(a.status==='Ready')pct=order==='Rest'?.10:.04;
 if(!pct)return;
 pct+=infLv*.01+facility;
 const before=a.hp;
 if(before<max)a.hp=Math.min(max,before+Math.max(1,Math.round(max*pct)));
 if(a.status==='Recovering'&&a.recovery>0){
   a.recovery=Math.max(0,a.recovery-1);
   if(a.recovery===0){
     a.status='Ready';a.injury=null;
     if(!a.dailyOrder)a.dailyOrder='Rest';
     pushHistory(`${a.name} returned to duty.`,a.regionId);
   }
 }
 const healed=Math.max(0,a.hp-before);
 if(healed)report.push(`${a.name}: +${healed} HP (${a.hp}/${max})${a.status==='Recovering'?` • ${a.recovery} recovery day(s) left`:''}`);
}
function gc193Train(a,effects,report){
 const yard=hq(a.regionId).upgrades['Training Yard']||0;
 const base=6+yard*2;
 const xp=Math.max(1,Math.round(base*(effects?.trainingMult||1)));
 grantXP(a,xp);
 report.push(`${a.name} trained: +${xp} XP${(effects?.trainingMult||1)>1.01?' with veteran instruction':''}.`);
}
function gc193Mentor(a,effects,report){
 const m=state.roster.find(x=>x.id===a.dailyMentorId);
 if(!m||m.regionId!==a.regionId||m.status!=='Ready'||m.dailyOrder!=='Train'){
   report.push(`${a.name}'s mentorship had no eligible trainee; they trained instead.`);
   return gc193Train(a,effects,report);
 }
 const gap=Math.max(0,a.lvl-m.lvl),career=bl17EnsureCareer(a);
 const yard=hq(a.regionId).upgrades['Training Yard']||0;
 const xp=Math.round((8+yard*2+gap*2+career*3)*(effects?.trainingMult||1));
 grantXP(m,xp);
 grantXP(a,2);
 if(typeof bl18AdjustRelation==='function')bl18AdjustRelation(a,m,{trust:2,respect:3,affinity:1},'training together');
 report.push(`${a.name} mentored ${m.name}: ${m.name} gained +${xp} XP.`);
}
function gc193ScoutRegion(regionId,scouts,report){
 if(!scouts.length)return;
 const contracts=state.regions[regionId].contracts.map(gc193EnsureContract).sort((a,b)=>(b.unknown||0)-(a.unknown||0)||a.gcIntel-b.gcIntel||b.risk-a.risk);
 scouts.forEach((a,i)=>{
   const c=contracts[i%Math.max(1,contracts.length)];
   if(!c){report.push(`${a.name} scouted, but no active contract needed intelligence.`);return}
   const d=derived(a),score=d.util.scout+d.combat.speed*.25;
   const gain=score>=30?2:1;
   c.gcIntel=Math.min(2,c.gcIntel+gain);
   c.unknown=Math.max(0,(c.unknown||0)-gain);
   c.gcScoutEdge=Math.max(c.gcScoutEdge,Math.min(.12,.04+Math.max(0,score-15)/220));
   grantXP(a,4+gain);
   bl18InitAdventurer(a).veteran.behavior.fieldcraft++;
   if(typeof bl18MaybeTraits==='function')bl18MaybeTraits(a);
   report.push(`${a.name} scouted ${c.title}: intel ${c.gcIntel}/2, ${c.unknown} unknowns remain.`);
 });
}
function gc193PatrolRegion(regionId,patrollers,report){
 if(!patrollers.length)return;
 const r=state.regions[regionId],d=REGION_DEFS[regionId];
 const score=patrollers.reduce((s,a)=>{const x=derived(a);return s+x.combat.attack*.22+x.combat.guard*.14+x.util.scout*.18+a.lvl*1.8},0);
 const reduction=clamp(Math.floor(score/30),1,4);
 const before=r.threat;r.threat=clamp(r.threat-reduction,0,100);
 patrollers.forEach(a=>grantXP(a,3+reduction));
 report.push(`${patrollers.map(a=>a.name.split(' ')[0]).join(', ')} patrolled ${d.name}: Threat ${Math.round(before)} → ${Math.round(r.threat)}.`);
 const encounterChance=clamp(.20+before/180,.20,.70);
 if(!chance(encounterChance))return;
 const species=pickEnemySpecies(regionId),family=bl18Family(species);
 const strength=score/Math.max(1,patrollers.length),danger=before+rnd(-10,15);
 patrollers.forEach(a=>{if(typeof bl18AwardMonster==='function')bl18AwardMonster(a,family,4+Math.ceil(reduction/2),true,false)});
 if(danger>strength*3.5&&chance(.45)){
   const victim=pick(patrollers),max=derived(victim).maxHp,dmg=Math.max(3,Math.round(max*(.06+before/900)));
   victim.hp=Math.max(1,victim.hp-dmg);
   if(victim.hp/max<.28&&chance(.28)){
     victim.status='Recovering';victim.injury=injuryName();victim.recovery=1+rnd(0,1);
   }
   report.push(`Patrol skirmish: ${species}. ${victim.name} took ${dmg} HP damage${victim.status==='Recovering'?' and was injured':''}.`);
 }else report.push(`Patrol skirmish: ${species}. The patrol drove them off without serious injury.`);
}
function gc193FacilityWork(regionId,effects,report){
 const r=state.regions[regionId];
 if(effects.office){
   const a=effects.office,d=derived(a),c=[...(r.contracts||[])].sort((x,y)=>y.reward-x.reward)[0];
   if(c){gc193EnsureContract(c);c.gcOfficeBonus=Math.max(c.gcOfficeBonus,Math.min(.18,.08+d.util.talk/500));report.push(`${a.name} worked the Contract Office: ${c.title} can pay +${Math.round(c.gcOfficeBonus*100)}%.`)}
 }
 if(effects.archive){
   const a=effects.archive,d=derived(a),c=(r.contracts||[]).filter(x=>ENEMY_SPECIES[x.species]?.supernatural).sort((x,y)=>(y.unknown||0)-(x.unknown||0))[0];
   if(c){gc193EnsureContract(c);c.unknown=Math.max(0,(c.unknown||0)-1);c.gcOccultEdge=Math.max(c.gcOccultEdge,Math.min(.12,.05+d.util.occult/500));report.push(`${a.name} worked the Occult Archive: ${c.title} gained supernatural countermeasures.`)}
 }
 const workers=GC193_FACILITIES.flatMap(f=>gc193FacilityWorkers(regionId,f));
 workers.forEach(a=>grantXP(a,2));
}

function gc193ProgressExpedition(p,report){
 const e=p.expedition;if(!e)return;
 gc193MigrateExpedition(p);
 if(e.battle){report.push(`${p.name}: encounter still unresolved.`);return}
 if(e.elapsedDays>=e.durationDays){if(e.fought)gc193FinishNoTime(p);return}
 e.elapsedDays++;
 e.progress=clamp(Math.round((e.elapsedDays/e.durationDays)*100),0,100);
 e.events.push(`Day ${state.company.day}: ${e.elapsedDays}/${e.durationDays} expedition days elapsed.`);
 if(!e.fought&&e.gcChecksDone<1&&e.elapsedDays<=e.encounterDay){fieldCheck(p);e.gcChecksDone++}
 if(!e.fought&&e.elapsedDays>=e.encounterDay){
   startBattle(p);
   report.push(`${p.name}: ENCOUNTER on ${e.contract.title} — resolve combat before advancing another day.`);
   return;
 }
 if(e.fought&&e.elapsedDays>=e.durationDays){gc193FinishNoTime(p);return}
 report.push(`${p.name}: ${e.elapsedDays}/${e.durationDays} days • expected return Day ${e.expectedReturnDay}.`);
}

function gc193ApplyDispatchEdges(e){
 const c=e.contract;gc193EnsureContract(c);
 e.opening=(e.opening||0)+(c.gcScoutEdge||0);
 e.enemyDebuff=(e.enemyDebuff||0)+(c.gcOccultEdge||0);
 e.payBonus=(e.payBonus||0)+(c.gcOfficeBonus||0);
}
const _dispatchContractGC193=dispatchContract;
dispatchContract=function(cid,pid){
 const p=state.parties.find(x=>x.id===pid),c=contractById(cid);
 _dispatchContractGC193(cid,pid);
 if(!p?.expedition)return;
 const e=p.expedition;gc193EnsureContract(e.contract||c);
 let duration=e.contract.gcDuration||gc193ContractDuration(e.contract);
 const scout=bestUtility(p,'scout');
 if(duration>=3&&scout?.value>=28)duration--;
 e.gcClock=true;e.departureDay=state.company.day;e.durationDays=duration;e.elapsedDays=0;e.encounterDay=Math.max(1,duration-1);e.expectedReturnDay=state.company.day+duration;e.gcChecksDone=0;e.progress=0;
 gc193ApplyDispatchEdges(e);
 e.events.push(`Expected return: Day ${e.expectedReturnDay} (${duration} day${duration===1?'':'s'}).`);
 save();render();
};

const _advanceExpeditionGC193=advanceExpedition;
advanceExpedition=function(pid,manual=false){
 const p=state.parties.find(x=>x.id===pid);if(!p?.expedition)return;
 if(p.expedition.battle)return combatRound(p);
 toast('Travel progresses when the company advances the global day.');
};

const _resolveBattleGC193=resolveBattle;
resolveBattle=function(p,win){
 const out=_resolveBattleGC193(p,win);
 const e=p?.expedition;
 if(e&&!e.battle&&e.fought&&e.elapsedDays>=e.durationDays)gc193FinishNoTime(p);
 return out;
};

const _finishExpeditionGC193=finishExpedition;
function gc193FinishNoTime(p){
 if(!p?.expedition)return;
 const c=p.expedition.contract,fx=state.timeSystem?.regionEffects?.[c.regionId],oldCache=c.cacheChance;
 if(fx?.salvageBonus)c.cacheChance=clamp((c.cacheChance||0)+fx.salvageBonus,0,.95);
 GC193_FINISHING=true;
 try{return _finishExpeditionGC193(p)}finally{GC193_FINISHING=false;c.cacheChance=oldCache}
}
finishExpedition=function(p){return gc193FinishNoTime(p)};

const _advanceDayGC193=advanceDay;
advanceDay=function(reason='A day passes.'){
 if(GC193_FINISHING){pushHistory(reason);save();return}
 return gc193AdvanceDay();
};
restDay=function(){return gc193AdvanceDay()};

function gc193RelationshipDowntime(readyAtStart=null){
 REGION_ORDER.forEach(id=>{
   const pool=state.roster.filter(a=>a.regionId===id&&a.status==='Ready'&&a.dailyOrder!=='Patrol'&&(!readyAtStart||readyAtStart.has(a.id)));
   if(pool.length<2||!chance(.35))return;
   const a=pick(pool),others=pool.filter(x=>x.id!==a.id),b=pick(others);if(!b)return;
   if(typeof bl18AdjustRelation==='function')bl18AdjustRelation(a,b,{affinity:rnd(-1,2),trust:chance(.6)?1:0,respect:chance(.45)?1:0,tension:chance(.12)?1:0},'a day together at headquarters');
 });
}
function gc193AdvanceDay(){
 if(GC193_ADVANCING)return;
 const battles=state.parties.filter(p=>p.expedition?.battle);
 if(battles.length)return toast(`Resolve ${battles.length} active encounter${battles.length===1?'':'s'} before advancing the day.`);
 GC193_ADVANCING=true;
 try{
   gc193InitState();
   const oldDay=state.company.day,report=[],effectsByRegion={},readyAtStart=new Set(state.roster.filter(a=>a.status==='Ready').map(a=>a.id));
   GC193_RETURN_REPORTS=[];
   REGION_ORDER.forEach(id=>effectsByRegion[id]=gc193FacilityEffects(id));
   state.timeSystem.regionEffects=Object.fromEntries(REGION_ORDER.map(id=>[id,{salvageBonus:effectsByRegion[id].salvageBonus||0}]));

   /* Resolve the day the characters actually spent before moving the calendar. */
   state.roster.forEach(a=>{
     if(!gc193AtHQ(a))return;
     gc193HealAdventurer(a,effectsByRegion[a.regionId],a.dailyOrder||'Train',report);
   });
   REGION_ORDER.forEach(id=>{
     const ready=state.roster.filter(a=>a.regionId===id&&a.status==='Ready'&&readyAtStart.has(a.id));
     ready.filter(a=>a.dailyOrder==='Train').forEach(a=>gc193Train(a,effectsByRegion[id],report));
     ready.filter(a=>a.dailyOrder==='Mentor').forEach(a=>gc193Mentor(a,effectsByRegion[id],report));
     gc193ScoutRegion(id,ready.filter(a=>a.dailyOrder==='Scout'),report);
     gc193PatrolRegion(id,ready.filter(a=>a.dailyOrder==='Patrol'),report);
     gc193FacilityWork(id,effectsByRegion[id],report);
   });

   gc193RelationshipDowntime(readyAtStart);
   state.company.day++;
   state.parties.filter(p=>p.expedition).slice().forEach(p=>gc193ProgressExpedition(p,report));
   GC193_RETURN_REPORTS.forEach(r=>{const bits=[`${r.win?'RETURNED — CONTRACT COMPLETE':'RETURNED — CONTRACT FAILED'}: ${r.title}`];if(r.pay)bits.push(`${money(r.pay)} paid`);if(r.loot)bits.push(`${RARITIES[r.loot.rarity]||''} ${r.loot.name}`.trim());if(r.cache)bits.push(`${r.cache.name} recovered`);if(r.artifact)bits.push(`ARTIFACT: ${r.artifact.name}`);if(r.deaths?.length)bits.push(`dead: ${r.deaths.join(', ')}`);report.push(bits.join(' • '))});
   processWorldDay();
   weeklyWages();
   REGION_ORDER.forEach(id=>{if(state.company.day%3===0)refreshRecruits(id)});
   pushHistory(`Day ${oldDay} closed. Company orders and field operations advanced together.`);
   state.timeSystem.lastReport={from:oldDay,to:state.company.day,lines:report.slice(-40)};
   save();render();gc193ShowDayReport(state.timeSystem.lastReport);
 }finally{GC193_ADVANCING=false}
}

function gc193OrderSummary(regionId=state.currentRegion){
 const rows=state.roster.filter(a=>a.regionId===regionId&&a.status!=='Dead');
 const counts={};rows.forEach(a=>{const k=a.status==='Expedition'?'On Contract':a.status==='Recovering'?'Recovery':a.status==='Captured'?'Captured':(a.dailyOrder||'Train');counts[k]=(counts[k]||0)+1});
 return Object.entries(counts).map(([k,v])=>`<span class="gc193OrderChip"><b>${v}</b>${esc(k)}</span>`).join('');
}
function gc193DailyDashboard(){
 const active=state.parties.filter(p=>p.expedition).length,battles=state.parties.filter(p=>p.expedition?.battle).length;
 return `<div class="gc193DayPanel"><div class="gc193DayHead"><div><span>GLOBAL CALENDAR</span><b>DAY ${state.company.day}</b></div>${gc193SkullSvg('small')}</div><div class="gc193OrderSummary">${gc193OrderSummary()}</div><div class="gc193DayMeta">${active} active expedition${active===1?'':'s'}${battles?` • <strong>${battles} encounter${battles===1?'':'s'} unresolved</strong>`:''}</div><div class="actions"><button class="btn" data-action="gcOrders">Daily Orders</button><button class="btn primary" data-action="gcAdvanceDay" ${battles?'disabled':''}>Advance to Day ${state.company.day+1}</button></div></div>`;
}

const _renderHQGC193=renderHQ;
renderHQ=function(){
 let html=_renderHQGC193();
 html=html.replace(/<button class="card" data-action="rest">[\s\S]*?<\/button>/,`<button class="card gc193AdvanceCard" data-action="gcAdvanceDay"><b>◷ Advance Day</b><div class="tiny muted">Resolve all HQ orders and expeditions concurrently</div></button>`);
 html=html.replace('1 day passes per contract or Rest Day','Recovery advances with the global calendar');
 const marker='<div class="sectionTitle"><h3>Headquarters</h3>';
 if(html.includes(marker))html=html.replace(marker,gc193DailyDashboard()+marker);else html=gc193DailyDashboard()+html;
 return html;
};

const _expeditionCardGC193=expeditionCard;
expeditionCard=function(p){
 const e=p.expedition;if(!e)return'';gc193MigrateExpedition(p);
 const status=e.battle?'ENCOUNTER':e.fought?'RETURNING':'IN THE FIELD';
 return `<div class="card gc193Expedition"><div class="statline"><div><b>${esc(p.name)}</b><div class="tiny muted">${status} • departed Day ${e.departureDay} • expected Day ${e.expectedReturnDay}</div></div><span class="gold">${esc(e.contract.title)}</span></div><div class="gc193Timeline"><i style="width:${clamp(e.elapsedDays/e.durationDays*100,0,100)}%"></i></div><div class="tiny muted">Day ${e.elapsedDays}/${e.durationDays} • ${esc(e.contract.species)} opposition</div>${e.battle?battleHTML(e.battle):''}<div class="combatLog">${(e.battle?e.battle.log:e.events).slice(-10).map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="actions">${e.battle?`<button class="btn primary" data-action="advance" data-id="${p.id}">Resolve Round</button>`:`<button class="btn" data-action="advance" data-id="${p.id}">Progresses Next Day</button>`}</div></div>`;
};

function gc193ContractIntel(c){
 gc193EnsureContract(c);const family=bl18Family(c.species);
 if(c.gcIntel>=2)return `<div class="gc193Intel strong"><b>FULL INTEL</b><span>${c.enemyCount} enemies confirmed • ${c.unknown} unknowns • cache ${Math.round((c.cacheChance||0)*100)}%</span></div>`;
 if(c.gcIntel>=1)return `<div class="gc193Intel"><b>SCOUTED</b><span>${c.enemyCount} enemies • ${c.unknown} unknowns • ${esc(family)}</span></div>`;
 return `<div class="gc193Intel dim"><b>LIMITED INTEL</b><span>Approx. ${Math.max(2,c.enemyCount-2)}–${c.enemyCount+2} enemies • ${c.unknown} unknowns</span></div>`;
}
const _contractCardGC193=contractCard;
contractCard=function(c){
 gc193EnsureContract(c);let html=_contractCardGC193(c);
 const duration=`<div class="gc193ContractTime"><b>${c.gcDuration} DAY${c.gcDuration===1?'':'S'}</b><span>estimated duration</span></div>`;
 html=html.replace('<div class="actions">',`${gc193ContractIntel(c)}${c.gcOfficeBonus?`<div class="gc193OfficeBonus">Contract Office: +${Math.round(c.gcOfficeBonus*100)}% payout prepared</div>`:''}${duration}<div class="actions">`);
 if(c.risk>=4){html=html.replace('class="card contract','class="card contract gc193SkullThreat');html=html.replace('<div class="bl19ContractBody">',`${gc193SkullSvg('contractWatermark')}<div class="bl19ContractBody">`)}
 return html;
};

function gc193OrderPanel(a){
 if(a.status==='Expedition')return `<div class="gc193OrderPanel"><b>DAILY ORDER</b><span>ON CONTRACT</span></div>`;
 if(a.status==='Captured')return `<div class="gc193OrderPanel"><b>DAILY ORDER</b><span>CAPTURED</span></div>`;
 if(a.status==='Recovering')return `<div class="gc193OrderPanel"><b>DAILY ORDER</b><span>RECOVERY • ${a.recovery} day(s)</span></div>`;
 return `<div class="gc193OrderPanel"><div><b>DAILY ORDER</b><span>${esc(gc193OrderLabel(a))}</span></div><button class="btn ghost" data-action="gcOrderPick" data-id="${a.id}">Change</button></div>`;
}
const _rosterCardGC193=rosterCard;
rosterCard=function(a){
 let html=_rosterCardGC193(a);const badge=`<div class="gc193RosterOrder">${esc(gc193OrderLabel(a))}</div>`;
 return html.replace('<div class="tiny bl17SkillLine">',`${badge}<div class="tiny bl17SkillLine">`);
};
const _renderInspectGC193=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC193(id,recruit);
 if(!recruit){
   const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');
   if(a&&sheet&&!sheet.querySelector('.gc193OrderPanel')){
     const anchor=sheet.querySelector('.blInspectPortrait,.bl19InspectBanner,.buildStack');
     if(anchor)anchor.insertAdjacentHTML('afterend',gc193OrderPanel(a));else sheet.insertAdjacentHTML('afterbegin',gc193OrderPanel(a));
   }
 }
 return out;
};

function gc193OrdersModal(){
 const rows=localRoster().filter(a=>a.status!=='Dead');
 modal(`<div class="sheetHead"><div><h3>${gc193SkullSvg('tiny')} Daily Orders</h3><div class="tiny muted">One persistent order per available adventurer</div></div><button class="x" data-action="close">×</button></div><div class="notice">Orders resolve together when the global day advances. Expedition members ignore HQ orders until they return.</div><div class="list gc193OrdersList">${rows.map(a=>`<div class="card gc193OrderRow"><div class="gc193OrderFace">${blPortraitHTML(a)}</div><div><b>${esc(a.name)}</b><span>${esc(a.culture)} ${esc(a.className)} • ${a.hp}/${derived(a).maxHp} HP</span><strong>${esc(gc193OrderLabel(a))}</strong></div><button class="btn ghost" data-action="gcOrderPick" data-id="${a.id}" ${['Expedition','Captured','Recovering'].includes(a.status)?'disabled':''}>${a.status==='Ready'?'Change':'Locked'}</button></div>`).join('')}</div>`);
}
function gc193OrderPick(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 const desc={Rest:'Fastest HP recovery. No XP or field utility.',Train:'Gain meaningful XP; heals only at the normal active-HQ rate.',Patrol:'Suppress local Threat; may skirmish and earn real monster experience.',Scout:'Improve specific contract intel and opening advantage.',Mentor:'Use this veteran’s day to accelerate one trainee and build their relationship.',Facility:'Staff a facility with a concrete daily effect.'};
 modal(`<div class="sheetHead"><div><h3>Order • ${esc(a.name)}</h3><div class="tiny muted">Current: ${esc(gc193OrderLabel(a))}</div></div><button class="x" data-action="close">×</button></div><div class="list">${GC193_ORDERS.map(o=>`<button class="card gc193OrderChoice" data-action="gcSetOrder" data-id="${a.id}" data-value="${o}"><b>${o}</b><span>${esc(desc[o])}</span></button>`).join('')}</div>`);
}
function gc193MentorPick(id){
 const a=state.roster.find(x=>x.id===id);if(!a)return;
 const targets=state.roster.filter(x=>x.id!==a.id&&x.regionId===a.regionId&&x.status==='Ready');
 modal(`<div class="sheetHead"><h3>Mentor • ${esc(a.name)}</h3><button class="x" data-action="close">×</button></div><div class="notice">The trainee must spend the day Training for mentorship to apply.</div><div class="list">${targets.map(t=>`<button class="card statline" data-action="gcMentorTarget" data-id="${a.id}" data-target="${t.id}"><span><b>${esc(t.name)}</b><br><span class="tiny muted">Lv.${t.lvl} ${esc(t.className)} • ${esc(gc193OrderLabel(t))}</span></span><span>Choose</span></button>`).join('')||'<div class="empty">No eligible trainees at this HQ.</div>'}</div>`);
}
function gc193FacilityPick(id){
 const a=state.roster.find(x=>x.id===id);if(!a)return;
 const desc={Infirmary:'Raises HP recovery for everyone healing at this HQ today.','Training Yard':'Boosts XP for everyone assigned to Train today.','Contract Office':'Prepares a meaningful payout bonus on one contract.','Occult Archive':'Reduces unknowns and adds countermeasures to a supernatural contract.',"Salvager’s Lodge":'Raises cache recovery chance for contracts returning today.'};
 modal(`<div class="sheetHead"><h3>Facility Duty • ${esc(a.name)}</h3><button class="x" data-action="close">×</button></div><div class="list">${GC193_FACILITIES.filter(f=>(hq(a.regionId).upgrades[f]||0)>0).map(f=>`<button class="card gc193OrderChoice" data-action="gcFacilityTarget" data-id="${a.id}" data-value="${esc(f)}"><b>${esc(f)}</b><span>${esc(desc[f])}</span></button>`).join('')||'<div class="empty">Upgrade a meaningful facility before assigning staff duty.</div>'}</div>`);
}

function gc193ShowDayReport(r){
 if(!r)return;const lines=r.lines||[];
 modal(`<div class="sheetHead"><div><h3>${gc193SkullSvg('tiny')} Day ${r.to}</h3><div class="tiny muted">Day ${r.from} resolved across the whole company</div></div><button class="x" data-action="close">×</button></div><div class="gc193Report"><div class="gc193ReportLead"><b>ONE DAY PASSED</b><span>HQ orders, contracts and the world advanced simultaneously.</span></div>${lines.length?lines.map(x=>`<div>${esc(x)}</div>`).join(''):'<div>No notable events today.</div>'}</div>`);
}

const _processActionGC193=processAction;
processAction=function(el){
 const a=el.dataset.action;
 if(a==='gcAdvanceDay')return gc193AdvanceDay();
 if(a==='gcOrders')return gc193OrdersModal();
 if(a==='gcOrderPick')return gc193OrderPick(el.dataset.id);
 if(a==='gcSetOrder'){
   const adv=state.roster.find(x=>x.id===el.dataset.id);if(!adv||adv.status!=='Ready')return;
   const order=el.dataset.value;
   if(order==='Mentor')return gc193MentorPick(adv.id);
   if(order==='Facility')return gc193FacilityPick(adv.id);
   if(!GC193_ORDERS.includes(order))return;
   adv.dailyOrder=order;adv.dailyMentorId=null;adv.dailyFacility=null;save();return gc193OrdersModal();
 }
 if(a==='gcMentorTarget'){
   const adv=state.roster.find(x=>x.id===el.dataset.id),target=state.roster.find(x=>x.id===el.dataset.target);if(!adv||!target)return;
   adv.dailyOrder='Mentor';adv.dailyMentorId=target.id;adv.dailyFacility=null;save();return gc193OrdersModal();
 }
 if(a==='gcFacilityTarget'){
   const adv=state.roster.find(x=>x.id===el.dataset.id);if(!adv)return;
   adv.dailyOrder='Facility';adv.dailyFacility=el.dataset.value;adv.dailyMentorId=null;save();return gc193OrdersModal();
 }
 return _processActionGC193(el);
};

/* Keep facility descriptions aligned with the actual v19.3 mechanics. */
if(HQ_DEFS?.Infirmary)HQ_DEFS.Infirmary.desc='Improves HQ healing by +1% max HP per level and still reduces serious injury/death risk.';
if(HQ_DEFS?.['Training Yard'])HQ_DEFS['Training Yard'].desc='Adds +2 XP per level to adventurers assigned to Train; a staffed instructor can boost all trainees further.';
const _hqInfoGC193=hqInfo;
hqInfo=function(k){
 if(k==='Infirmary'){
   const lv=hq().upgrades.Infirmary||0;
   return modal(`<div class="sheetHead"><h3>Infirmary</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS.Infirmary.desc)}</div><div class="gold small" style="margin-top:6px">Current Lv.${lv}: +${lv}% max HP to daily HQ healing. Staffing the Infirmary adds another skill-based bonus.</div></div>`);
 }
 if(k==='Training Yard'){
   const lv=hq().upgrades['Training Yard']||0;
   return modal(`<div class="sheetHead"><h3>Training Yard</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS['Training Yard'].desc)}</div><div class="gold small" style="margin-top:6px">Current Lv.${lv}: +${lv*2} base XP to each Train order before instructor bonuses.</div></div>`);
 }
 return _hqInfoGC193(k);
};

const _showReportGC193=showReport;
showReport=function(r){
 if(GC193_ADVANCING){GC193_RETURN_REPORTS.push(r);return}
 return _showReportGC193(r);
};

/* Brand application: keep the existing save key/internal compatibility while all visible identity becomes Grim Company. */
const _renderStartGC193=renderStart;
renderStart=function(){
 document.title='Grim Company';document.body.dataset.brand='grim-company';
 document.getElementById('app').className='';
 document.getElementById('app').innerHTML=`<div class="start gc193Start"><div class="startPanel gc193StartPanel"><div class="gc193LogoHero">${gc193SkullSvg('hero')}</div><h1>GRIM COMPANY</h1><p>Build an adventuring company in a world that survives by sending professionals into places everyone else has learned to fear.</p><div class="label">Name your company</div><input id="companyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><button class="btn primary wide" data-action="begin">FOUND COMPANY</button><p class="tiny muted">You begin in Greyhaven, in the Graven March of the Veyric Marches.</p></div></div>`;
 document.getElementById('nav').innerHTML='';
};

const _renderGC193=render;
render=function(){
 document.title='Grim Company';document.body.dataset.brand='grim-company';
 const out=_renderGC193();
 if(state){
   gc193InitState();
   requestAnimationFrame(()=>{
     const brand=document.querySelector('.brand');
     if(brand&&!brand.querySelector('.gc193TopMark'))brand.insertAdjacentHTML('afterbegin',`<span class="gc193TopMark">${gc193SkullSvg('tiny')}</span>`);
     const threat=[...document.querySelectorAll('.res')].find(x=>x.textContent.trim().startsWith('Threat'));
     if(threat)threat.classList.add('gc193ThreatRes');
   });
 }
 return out;
};

/* Chronicle uses the Grim Company death mark for actual death entries. */
const _chronicleGC193=bl18ChronicleModal;
bl18ChronicleModal=function(){
 const out=_chronicleGC193();
 const sheet=document.getElementById('sheet');
 if(sheet){
   sheet.querySelectorAll('.bl19ChronEntry.death .bl19ChronIcon').forEach(x=>x.innerHTML=gc193SkullSvg('tiny'));
   const sub=sheet.querySelector('.sheetHead .tiny.muted');if(sub&&/Broken Lantern/i.test(sub.textContent))sub.textContent='What the company remembers';
 }
 return out;
};

const _auditGC193=audit;
audit=function(){
 const out=_auditGC193();
 out.grimCompany=GC193_VERSION;
 out.globalCalendar=true;
 out.concurrentExpeditions=true;
 out.contractCompletionAdvancesDay=false;
 out.readyHQHealing=true;
 out.dailyOrders=[...GC193_ORDERS];
 out.meaningfulFacilityDuty=[...GC193_FACILITIES];
 out.svgBleedingSkullBrand=true;
 return out;
};
window.__BL_AUDIT=audit;
