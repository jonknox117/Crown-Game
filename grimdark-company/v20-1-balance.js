/* Grim Company v20.1.1 — early-game danger/economy balance. */
const GC201_BALANCE='20.1.1';
const GC201_STARTING_SILVER=160;
const GC201_CONTACT_MULT={1:1.10,2:1.20,3:1.30,4:1.35,5:1.40};

/* Continuous contact pressure was landing too softly in live runs, especially at
   Risk 2–3. Preserve every existing modifier, but weight the final native tick
   hazard upward by career bracket so higher-risk work is much less likely to be
   free money while Risk 1 remains relatively forgiving. */
const _gc201ContactRateBalance=gc201ContactRate;
gc201ContactRate=function(p){
 const base=_gc201ContactRateBalance(p),risk=clamp(Number(p?.expedition?.contract?.risk)||1,1,5);
 return clamp(base*(GC201_CONTACT_MULT[risk]||1),.03,1.65);
};

/* New companies need enough signing capital to form an actual party before the
   first contract. This applies only when a new state is created; existing saves
   are never topped up or otherwise rewritten. */
const _createStateGC201Balance=createState;
createState=function(name,startRegion='veyric'){
 const s=_createStateGC201Balance(name,startRegion);
 if(s?.company){
   s.company.silver=Math.max(Number(s.company.silver)||0,GC201_STARTING_SILVER);
   s.company.gc201StartingCapital=GC201_STARTING_SILVER;
 }
 return s;
};

const _auditGC201Balance=audit;
audit=function(){
 const out=_auditGC201Balance();
 out.v201Balance=GC201_BALANCE;
 out.startingSilver=GC201_STARTING_SILVER;
 out.contactPressureMultipliers={...GC201_CONTACT_MULT};
 out.riskWeightedTickDanger=true;
 return out;
};
window.__BL_AUDIT=audit;

/* --------------------------------------------------------------------------
   v20.1.3 PACING PASS — expeditions should regularly produce something worth
   watching, and HQ work should visibly pay off on a human timescale.
   -------------------------------------------------------------------------- */
const GC201_PACING='20.1.3';
const GC213_CONTACT_FLOOR={1:.18,2:.28,3:.42,4:.65,5:.90};
const GC213_DRY_PRESSURE_PER_DAY=.55;
const GC213_DRY_PRESSURE_CAP=.95;
const GC213_TRAIN_MULT=2;
const GC213_PATROL_MULT=1.45;
const GC213_RECOVER_HP_PER_DAY=.45;
const GC213_INFIRMARY_HP_PER_LEVEL=.05;
const GC213_INJURY_SPEED=2.10;
const GC213_INFIRMARY_INJURY_SPEED=.25;

/* A contract can still be quiet, but pressure rises the longer a party travels
   without contact. An encounter resets only the dry-streak pressure, so long
   contracts can naturally produce multiple encounters. */
const _gc201ContactRatePacing=gc201ContactRate;
gc201ContactRate=function(p){
 const e=p?.expedition,risk=clamp(Number(e?.contract?.risk)||1,1,5),base=_gc201ContactRatePacing(p);
 if(!e)return base;
 const total=Math.max(0,Number(e.gc201ContactExposure)||0),last=Math.max(0,Number(e.gc213LastEncounterExposure)||0),dry=Math.max(0,total-last);
 const floor=GC213_CONTACT_FLOOR[risk]||GC213_CONTACT_FLOOR[1],ramp=1+Math.min(GC213_DRY_PRESSURE_CAP,dry*GC213_DRY_PRESSURE_PER_DAY);
 e.gc213DryTravel=dry;e.gc213PressureRamp=ramp;
 return clamp(Math.max(base,floor)*ramp,.04,2.4);
};

const _dispatchContractGC213=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_dispatchContractGC213(cid,pid),p=state.parties.find(x=>x.id===pid),e=p?.expedition;
 if(e){e.gc213LastEncounterExposure=0;e.gc213DryTravel=0;e.gc213PressureRamp=1;e.gc213EncounterCount=0;save();}
 return out;
};

const _startBattleGC213=startBattle;
startBattle=function(p){
 const e=p?.expedition,before=!!e?.battle,out=_startBattleGC213(p);
 if(e&&!before&&e.battle){
   e.gc213LastEncounterExposure=Math.max(0,Number(e.gc201ContactExposure)||0);
   e.gc213DryTravel=0;e.gc213PressureRamp=1;e.gc213EncounterCount=(Number(e.gc213EncounterCount)||0)+1;
 }
 return out;
};

/* Training should move roughly twice as fast as the original continuous pass,
   while relationship exposure still advances at real simulation time. */
function gc213TrainingRate(a){
 const team=gc201Team(a.regionId,'Train'),yard=hq(a.regionId).upgrades['Training Yard']||0;
 return(6+yard*2)*(1+gc201TrainingBonus(team))*GC213_TRAIN_MULT;
}
gc201TrainingRate=gc213TrainingRate;
gc201TrainRegion=function(regionId,deltaDays){
 const team=gc201Team(regionId,'Train');if(!team.length)return;
 team.forEach(a=>{
   const w=gc200Work(a),rate=gc213TrainingRate(a);w.gc201TrainFraction=(Number(w.gc201TrainFraction)||0)+rate*deltaDays;
   const gain=Math.floor(w.gc201TrainFraction+1e-8);if(gain>0){w.gc201TrainFraction-=gain;const before=a.lvl;if(grantXP(a,gain)&&a.lvl>before){gc199RecordFeed(`${a.name} reached Level ${a.lvl} while training.`,'level');sfx('level')}}
 });
 gc201PairActivityTick(regionId,'Train',team,deltaDays);
};

function gc213PatrolRate(regionId,team=gc201Team(regionId,'Patrol')){
 if(!team.length)return 0;
 const score=team.reduce((s,a)=>{const d=derived(a);return s+d.combat.attack*.22+d.combat.guard*.14+d.util.scout*.18+a.lvl*1.8},0),avg=score/team.length;
 const arm=hq(regionId).upgrades.Armory||0,command=hq(regionId).upgrades['Command Hall']||0;
 return clamp((.72+avg/125+Math.min(.30,(team.length-1)*.07))*(1+arm*.025+command*.02)*GC213_PATROL_MULT,1.0,2.8);
}
gc201PatrolRegion=function(regionId,deltaDays){
 const team=gc201Team(regionId,'Patrol');if(!team.length)return;const r=state.regions[regionId],rate=gc213PatrolRate(regionId,team);
 r.gc200PatrolProgress=(Number(r.gc200PatrolProgress)||0)+rate*deltaDays;
 let guard=0;while(r.gc200PatrolProgress>=1&&guard++<3){r.gc200PatrolProgress-=1;const report=[];gc193PatrolRegion(regionId,team,report);report.forEach(x=>gc199RecordFeed(x,'patrol'))}
 gc201PairActivityTick(regionId,'Patrol',team,deltaDays);
};

/* Recover is a deliberate productive sacrifice, so it should feel dramatically
   different from passive natural healing. */
const _gc202RecoveryMetricsGC213=gc202RecoveryMetrics;
gc202RecoveryMetrics=function(a){
 const m=_gc202RecoveryMetricsGC213(a);if(!m.focused)return m;
 m.hpPct=GC213_RECOVER_HP_PER_DAY+m.inf*GC213_INFIRMARY_HP_PER_LEVEL;
 m.hpPerDay=m.max*m.hpPct+gc202TraitHealPerDay(a);
 m.hpPerSec=m.hpPerDay/(GC199_DAY_MS/1000);
 const simSpeed=Math.max(1,gc199Speed()||1);
 m.hpEta=m.hpPerSec>0?Math.max(0,(m.max-m.visualHp)/(m.hpPerSec*simSpeed)):0;
 m.injurySpeed=GC213_INJURY_SPEED+m.inf*GC213_INFIRMARY_INJURY_SPEED;
 m.injuryEta=m.remaining>0?(m.remaining/m.injurySpeed)*(GC199_DAY_MS/1000)/simSpeed:0;
 return m;
};

/* Keep the live HQ cards useful: show the faster rate/cadence instead of making
   the player infer it from a moving bar. Scouting itself is intentionally left
   untouched because its current pacing is the benchmark. */
const _gc202StanceSnapshotGC213=gc202StanceSnapshot;
gc202StanceSnapshot=function(regionId,stance){
 const x=_gc202StanceSnapshotGC213(regionId,stance),daySec=GC199_DAY_MS/1000;
 if(stance==='Train'&&x.team.length){
   const rate=x.team.reduce((n,a)=>n+gc213TrainingRate(a),0)/x.team.length/daySec;
   x.detail=`${x.team.length} together • +${Math.round(gc201TrainingBonus(x.team)*100)}% group bonus • ${rate.toFixed(2)} XP/s each`;
 }
 if(stance==='Patrol'&&x.team.length){
   const r=state.regions[regionId],rate=gc213PatrolRate(regionId,x.team),remaining=Math.max(0,1-(Number(r.gc200PatrolProgress)||0)),seconds=remaining/rate*daySec/Math.max(1,gc199Speed()||1);
   x.detail=`${x.team.length} together • ${Math.round((Number(r.gc200PatrolProgress)||0)*100)}% patrol cycle • ~${gc199FormatSeconds(seconds)} to sweep`;
 }
 return x;
};

/* Replace the quality-pass badge without rebuilding the whole dashboard. */
const _gc193DailyDashboardGC213=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC213().replace('v20.1.2 • QUALITY PASS','v20.1.3 • PACING PASS')};

const _auditGC213=audit;
audit=function(){
 const out=_auditGC213();out.v201Pacing=GC201_PACING;out.risingContactPressure=true;out.contactPressureFloors={...GC213_CONTACT_FLOOR};out.multipleContinuousEncounters=true;out.trainingRateMultiplier=GC213_TRAIN_MULT;out.patrolRateMultiplier=GC213_PATROL_MULT;out.focusedRecoveryHpPerDay=GC213_RECOVER_HP_PER_DAY;out.scoutingPacingUnchanged=true;return out;
};
window.__BL_AUDIT=audit;

/* --------------------------------------------------------------------------
   v20.2 COMPANY FLOW — remove maintenance clicks, turn Patrol into safe local
   Odd Jobs, and make the simulation easier to read without adding busywork.
   -------------------------------------------------------------------------- */
const GC220_VERSION='20.2';
const GC220_STANCES=['Scout','Odd Jobs','Train','Recover'];
const GC220_ODD_JOBS=[
 {title:"Find Old Marta’s Missing Mule",aspect:'stability'},
 {title:'Track Down Three Runaway Goats',aspect:'stability'},
 {title:'Help Rebuild the East Fence',aspect:'stability'},
 {title:'Find Who Keeps Stealing Laundry',aspect:'stability'},
 {title:'Carry Water to the Hill Cottages',aspect:'stability'},
 {title:'Settle a Very Petty Property Dispute',aspect:'stability'},
 {title:'Escort a Nervous Tax Clerk',aspect:'stability'},
 {title:'Help Dig Out a Collapsed Cellar',aspect:'stability'},
 {title:"Guard the Baker’s Flour Cart",aspect:'prosperity'},
 {title:'Unload Apples Before the Rain',aspect:'prosperity'},
 {title:'Count Barrels at the Riverside Storehouse',aspect:'prosperity'},
 {title:'Carry a Very Suspicious Locked Chest',aspect:'prosperity'},
 {title:'Deliver Six Letters and One Cake',aspect:'prosperity'},
 {title:'Guide a Merchant Through the Back Roads',aspect:'prosperity'},
 {title:'Help the Cooper Move His Workshop',aspect:'prosperity'},
 {title:'Watch the Docks Overnight',aspect:'threat'},
 {title:'Keep Drunks Away from the Night Market',aspect:'threat'},
 {title:'Walk the South Road with a Lantern',aspect:'threat'},
 {title:'Check the Abandoned Mill for Squatters',aspect:'threat'},
 {title:'Stand Watch While a Surveyor Works',aspect:'threat'},
 {title:'Chase Vandals Away from the Shrine',aspect:'threat'},
 {title:'Escort the Lamplighter on His Round',aspect:'threat'}
];

GC201_STANCES.splice(0,GC201_STANCES.length,...GC220_STANCES);
GC193_ORDERS.splice(0,GC193_ORDERS.length,...GC220_STANCES);
GC202_STANCE_INFO['Odd Jobs']={icon:'¤',desc:'Take safe local work for pocket silver, relationships and tiny regional improvements.'};
delete GC202_STANCE_INFO.Patrol;

function gc220NormalizeStance(st){return st==='Patrol'?'Odd Jobs':GC220_STANCES.includes(st)?st:'Train'}
const _gc201MigrateAdventurerGC220=gc201MigrateAdventurer;
gc201MigrateAdventurer=function(a){if(a?.dailyOrder==='Patrol')a.dailyOrder='Odd Jobs';const out=_gc201MigrateAdventurerGC220(a);if(out&&out.dailyOrder==='Patrol')out.dailyOrder='Odd Jobs';return out};
function gc220InitRegion(r){
 if(!r)return r;r.gc220OddJobs=r.gc220OddJobs||{progress:0,current:null,completed:0};
 r.gc220OddJobs.progress=clamp(Number(r.gc220OddJobs.progress)||0,0,.9999);r.gc220OddJobs.completed=Number(r.gc220OddJobs.completed)||0;
 r.gc220RecentChanges=Array.isArray(r.gc220RecentChanges)?r.gc220RecentChanges:[];return r;
}
function gc220InitState(s=state){
 if(!s)return s;s.timeSystem=s.timeSystem||{};s.timeSystem.gc220Version=GC220_VERSION;
 (s.roster||[]).forEach(a=>{a.dailyOrder=gc220NormalizeStance(a.dailyOrder);});Object.values(s.regions||{}).forEach(gc220InitRegion);return s;
}
const _normalizeStateGC220=normalizeState;
normalizeState=function(s){return gc220InitState(_normalizeStateGC220(s))};
const _createStateGC220=createState;
createState=function(name,startRegion='veyric'){return gc220InitState(_createStateGC220(name,startRegion))};

function gc220RegionSnapshot(regionId){const r=state.regions[regionId];return r?{prosperity:Number(r.prosperity)||0,stability:Number(r.stability)||0,threat:Number(r.threat)||0}:null}
function gc220RecordRegionChanges(regionId,before,after,cause){
 const r=state.regions[regionId];if(!r||!before||!after)return;gc220InitRegion(r);
 const bits=[];['prosperity','stability','threat'].forEach(k=>{const d=after[k]-before[k];if(Math.abs(d)>=.05)bits.push(`${k[0].toUpperCase()+k.slice(1)} ${d>0?'+':''}${d.toFixed(1)}`)});
 if(!bits.length)return;r.gc220RecentChanges.push({day:state.company.day,cause:String(cause||'Regional activity'),text:bits.join(' • ')});if(r.gc220RecentChanges.length>12)r.gc220RecentChanges.splice(0,r.gc220RecentChanges.length-12);
}
function gc220RollOddJob(regionId,previous=''){
 const pool=GC220_ODD_JOBS.filter(x=>x.title!==previous),def=pick(pool.length?pool:GC220_ODD_JOBS);
 return{id:uid('odd'),title:def.title,aspect:def.aspect,duration:.48+Math.random()*.50,pay:rnd(2,7)};
}
function gc220OddJobState(regionId,create=true){
 const r=state.regions[regionId];if(!r)return null;gc220InitRegion(r);const w=r.gc220OddJobs;
 if(create&&!w.current)w.current=gc220RollOddJob(regionId);return w;
}
function gc220OddJobEffect(regionId,job){
 const r=state.regions[regionId],before=gc220RegionSnapshot(regionId),amount=.18+Math.random()*.14;
 if(job.aspect==='prosperity')r.prosperity=clamp(r.prosperity+amount,0,100);
 else if(job.aspect==='stability')r.stability=clamp(r.stability+amount,0,100);
 else r.threat=clamp(r.threat-amount,0,100);
 const after=gc220RegionSnapshot(regionId);gc220RecordRegionChanges(regionId,before,after,`Odd Job: ${job.title}`);
 return job.aspect==='threat'?`Threat -${amount.toFixed(1)}`:`${job.aspect[0].toUpperCase()+job.aspect.slice(1)} +${amount.toFixed(1)}`;
}
function gc220OddJobsRegion(regionId,deltaDays){
 const team=gc201Team(regionId,'Odd Jobs');if(!team.length||deltaDays<=0)return;const w=gc220OddJobState(regionId,true),job=w.current;
 const avg=team.reduce((n,a)=>{const d=derived(a);return n+d.util.talk+d.util.endure+d.util.scout*.5},0)/team.length;
 const teamwork=1+Math.min(.35,Math.sqrt(Math.max(0,team.length-1))*.12),competence=1+Math.min(.18,Math.max(0,avg-30)/300);
 w.progress+=deltaDays*teamwork*competence/Math.max(.25,job.duration);
 gc201PairActivityTick(regionId,'Odd Jobs',team,deltaDays);
 let guard=0;while(w.progress>=1&&guard++<3){
   w.progress-=1;state.company.silver+=job.pay;team.forEach(a=>grantXP(a,job.pay>=5?2:1));const effect=gc220OddJobEffect(regionId,job);
   const names=team.map(a=>a.name.split(' ')[0]).join(', ');const line=`ODD JOB — ${job.title} • +${money(job.pay)} • ${effect}`;
   gc199RecordFeed(line,'oddjob');pushHistory(`${names} completed “${job.title}” for ${money(job.pay)}. ${effect}.`,regionId);
   if(chance(.12))gc199RecordFeed(`RUMOR — ${names} heard something worth remembering while working “${job.title}”.`,'rumor');
   w.completed++;const previous=job.title;w.current=gc220RollOddJob(regionId,previous);Object.assign(job,w.current);sfx('success');gc202ScheduleRender();
 }
}
/* The old loop still calls gc201PatrolRegion; it now drives harmless routine work. */
gc201PatrolRegion=function(regionId,deltaDays){return gc220OddJobsRegion(regionId,deltaDays)};

const _gc202StanceSceneGC220=gc202StanceScene;
gc202StanceScene=function(stance){
 if(stance==='Odd Jobs')return '<div class="gc202StanceScene gc220OddScene"><i class="gc220Coin one"></i><i class="gc220Coin two"></i><i class="gc220Parcel"></i><i class="gc220Footsteps"></i><b>¤</b></div>';
 return _gc202StanceSceneGC220(stance);
};
const _gc202StanceSnapshotGC220=gc202StanceSnapshot;
gc202StanceSnapshot=function(regionId,stance){
 if(stance==='Odd Jobs'){
   const team=gc201Team(regionId,'Odd Jobs'),w=gc220OddJobState(regionId,!!team.length),job=w?.current,pct=job?clamp((Number(w.progress)||0)*100,0,100):0;
   return{team,pct,detail:job?`${team.length} working • ${job.title} • ${Math.round(pct)}%`:'No one is taking local work'};
 }
 return _gc202StanceSnapshotGC220(regionId,stance);
};

function gc220RememberReturn(a,stance=a?.dailyOrder){
 if(!a)return;const st=gc220NormalizeStance(stance);if(st==='Recover')return;const w=gc200Work(a);w.gc220ReturnStance=st;
}
const _dispatchContractGC220=dispatchContract;
dispatchContract=function(cid,pid){const p=state.parties.find(x=>x.id===pid);if(p)partyMembers(p).forEach(a=>gc220RememberReturn(a));return _dispatchContractGC220(cid,pid)};
function gc220ReturnStance(a){const w=gc200Work(a),saved=gc220NormalizeStance(w.gc220ReturnStance);return saved==='Recover'?'Odd Jobs':saved}
function gc220ReturnToDuty(a,reason='fully recovered'){
 const w=gc200Work(a),st=gc220ReturnStance(a);a.dailyOrder=st;w.gc220ReturnStance=st;const text=`${a.name} ${reason} and automatically returned to ${st}.`;
 pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');sfx('rest');gc202ScheduleRender();
}
/* Focused recovery is maintenance, not a permanent assignment. Characters finish
   healing, then resume the stance they had before Recover. */
gc201RecoveryTick=function(a,deltaDays){
 if(!gc193AtHQ(a)||deltaDays<=0)return;gc202InitAdventurer(a);const w=gc200Work(a);
 if(a.status==='Recovering'&&!w.gc220ReturnStance)gc220RememberReturn(a,a.dailyOrder==='Recover'?'Odd Jobs':a.dailyOrder);
 const m=gc202RecoveryMetrics(a);a.hp=clamp(Number(a.hp)||0,0,m.max);
 if(a.hp<m.max){w.gc201HealFraction=(Number(w.gc201HealFraction)||0)+m.hpPerDay*deltaDays;const whole=Math.floor(w.gc201HealFraction+1e-8);if(whole>0){w.gc201HealFraction-=whole;a.hp=Math.min(m.max,a.hp+whole)}}else w.gc201HealFraction=0;
 if(a.status==='Recovering'){
   if(w.gc202WasRecovering!==true||w.gc202InjuryName!==a.injury){w.recoveryLeft=Math.max(.05,Number(a.recovery)||1);w.gc202RecoveryTotal=w.recoveryLeft;w.gc202InjuryName=a.injury||'Injury';w.gc202WasRecovering=true}
   w.recoveryLeft=Math.max(0,Number(w.recoveryLeft)-deltaDays*m.injurySpeed);a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
   if(w.recoveryLeft<=0){a.status='Ready';a.injury=null;a.recovery=0;a.dailyOrder='Recover';w.gc202WasRecovering=false;w.gc202RecoveryTotal=0;w.gc202InjuryName=null;const visual=clamp((Number(a.hp)||0)+(Number(w.gc201HealFraction)||0),0,m.max);if(visual>=m.max-.01)gc220ReturnToDuty(a,'completed injury recovery');else{const text=`${a.name} cleared the injury and remains in focused recovery until fully healthy.`;pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');gc202ScheduleRender()}}
 }else w.gc202WasRecovering=false;
 if(a.status==='Ready'&&a.dailyOrder==='Recover'){
   const visual=clamp((Number(a.hp)||0)+(Number(w.gc201HealFraction)||0),0,m.max);if(visual>=m.max-.01)gc220ReturnToDuty(a,'reached full health');
 }
};

function gc220FeedPriority(entry){
 const t=String(entry?.text||'');if(/died|dead|hostile contact|contract failed|captur|artifact|serious injury|goes down/i.test(t))return 3;
 if(/contract complete|returned|injur|recovered|level|relationship|named enemy|odd job|rumor/i.test(t))return 2;
 return 1;
}
function gc220FeedRows(rows,cls){return rows.map(x=>`<div class="gc220FeedRow ${cls}"><span>DAY ${x.day}</span><b>${esc(x.text)}</b></div>`).join('')}
function gc220ShowSmartFeed(){
 const feed=(state.timeSystem?.gc199Feed||[]).slice(),important=feed.filter(x=>gc220FeedPriority(x)>=2).slice(-14).reverse(),routine=feed.filter(x=>gc220FeedPriority(x)===1).slice(-12).reverse();
 modal(`<div class="sheetHead"><div><h3>Company Event Log</h3><div class="tiny muted">Important events stay above routine simulation noise.</div></div><button class="x" data-action="close">×</button></div><div class="sectionTitle"><h3>Important</h3><span>${important.length}</span></div><div class="gc220Feed">${important.length?gc220FeedRows(important,'important'):'<div class="empty">Nothing important needs review.</div>'}</div><div class="sectionTitle"><h3>Routine Activity</h3><span>latest</span></div><div class="gc220Feed routine">${routine.length?gc220FeedRows(routine,'routine'):'<div class="empty">No routine entries yet.</div>'}</div>`);
}

const _processActionGC220=processAction;
processAction=function(el){
 const action=el.dataset.action;
 if(action==='gc202SetStance'){
   const a=state.roster.find(x=>x.id===el.dataset.id),next=el.dataset.value;if(a&&a.status==='Ready'){
     if(next==='Recover')gc220RememberReturn(a,a.dailyOrder);
     else if(GC220_STANCES.includes(next))gc220RememberReturn(a,next);
   }
 }
 if(action==='gc202RecoverWounded')localRoster().filter(a=>a.status==='Ready'&&Number(a.hp)<derived(a).maxHp).forEach(a=>gc220RememberReturn(a,a.dailyOrder));
 if(action==='gc199Feed')return gc220ShowSmartFeed();
 return _processActionGC220(el);
};

function gc220StrongSuit(a){
 const d=derived(a),vals=[['Attack',d.combat.attack],['Guard',d.combat.guard],['Speed',d.combat.speed],['Accuracy',d.combat.accuracy],['Resolve',d.combat.resolve],['Scout',d.util.scout],['Sneak',d.util.sneak],['Talk',d.util.talk],['Occult',d.util.occult],['Endure',d.util.endure]];
 vals.sort((x,y)=>y[1]-x[1]);return`${vals[0][0]} ${Math.round(vals[0][1])}`;
}
function gc220ClosestRelation(a){
 const rels=state.roster.filter(b=>b.id!==a.id&&b.status!=='Dead').map(b=>({b,v:relValue(a.id,b.id)})).filter(x=>x.v>0).sort((x,y)=>y.v-x.v);return rels[0]||null;
}
function gc220IdentityHTML(a){
 const close=gc220ClosestRelation(a),kills=Number(a.kills)||0;return `<div class="gc220Identity"><span>★ ${esc(gc220StrongSuit(a))}</span><span>⚔ ${kills} kill${kills===1?'':'s'}</span>${close?`<span>↔ ${esc(close.b.name.split(' ')[0])} • ${esc(relLabel(close.v))}</span>`:''}</div>`;
}
const _rosterCardGC220=rosterCard;
rosterCard=function(a){let html=_rosterCardGC220(a);return html.replace('<div class="tags">',gc220IdentityHTML(a)+'<div class="tags">')};
const _renderInspectGC220=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC220(id,recruit),a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');if(a&&sheet&&!recruit&&!sheet.querySelector('.gc220CareerCard')){const close=gc220ClosestRelation(a),card=`<div class="gc220CareerCard"><b>CAREER SNAPSHOT</b><span>Known for ${esc(gc220StrongSuit(a))} • ${Number(a.kills)||0} confirmed kill${Number(a.kills)===1?'':'s'}${close?` • closest bond: ${esc(close.b.name)} (${esc(relLabel(close.v))})`:''}</span></div>`;const anchor=sheet.querySelector('.gc193OrderPanel,.buildStack');anchor?.insertAdjacentHTML('afterend',card)}return out;
};

function gc220GearDelta(a,item){
 const slot=item.slot,old=a.gear[slot],before=derived(a);let after;
 try{a.gear[slot]=item;after=derived(a)}finally{a.gear[slot]=old}
 const rows=[['HP',after.maxHp-before.maxHp],['Attack',after.combat.attack-before.combat.attack],['Guard',after.combat.guard-before.combat.guard],['Speed',after.combat.speed-before.combat.speed],['Accuracy',after.combat.accuracy-before.combat.accuracy],['Resolve',after.combat.resolve-before.combat.resolve],['Scout',after.util.scout-before.util.scout],['Sneak',after.util.sneak-before.util.sneak],['Talk',after.util.talk-before.util.talk],['Occult',after.util.occult-before.util.occult],['Endure',after.util.endure-before.util.endure]].filter(x=>Math.abs(x[1])>.01).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1]));
 const positive=rows.filter(x=>x[1]>0),score=positive.reduce((n,x)=>n+x[1],0)-rows.filter(x=>x[1]<0).reduce((n,x)=>n+Math.abs(x[1])*.35,0);
 const label=positive.length?positive[0][0]==='Attack'||positive[0][0]==='Accuracy'?'OFFENSE':positive[0][0]==='Guard'||positive[0][0]==='Resolve'||positive[0][0]==='HP'?'DEFENSE':positive[0][0]==='Scout'||positive[0][0]==='Sneak'?'FIELD':positive[0][0].toUpperCase():'SIDEGRADE';
 return{rows,score,label};
}
function gc220GearCompareHTML(a,item){const d=gc220GearDelta(a,item),text=d.rows.slice(0,4).map(([k,v])=>`${k} ${v>0?'+':''}${Math.round(v)}`).join(' • ')||'No major stat change';return`<div class="gc220GearCompare"><span>${d.label}</span><b>${esc(text)}</b></div>`}
showGear=function(aid){
 const a=state.roster.find(x=>x.id===aid);if(!a)return;const inv=state.inventory.filter(x=>x.regionId===a.regionId&&['weapon','armor','charm'].includes(x.item.slot));
 modal(`<div class="sheetHead"><div><h3>Equipment • ${esc(a.name)}</h3><div class="tiny muted">Candidates show their largest changes against currently equipped gear.</div></div><button class="x" data-action="close">×</button></div>${['weapon','armor','charm'].map(slot=>{const choices=inv.filter(e=>e.item.slot===slot).sort((x,y)=>gc220GearDelta(a,y.item).score-gc220GearDelta(a,x.item).score||y.item.rarity-x.item.rarity);return`<div class="sectionTitle"><h3>${slot.toUpperCase()}</h3>${a.gear[slot]?`<button class="btn ghost" data-action="unequip" data-id="${a.id}" data-slot="${slot}">Unequip</button>`:''}</div>${a.gear[slot]?itemHTML(a.gear[slot]):'<div class="empty">Empty slot</div>'}<div class="list gc220GearList">${choices.map(e=>`<button class="card gc220GearChoice" data-action="equip" data-id="${a.id}" data-item="${e.item.id}"><div><b class="rarity-${e.item.rarity+1}">${esc(RARITIES[e.item.rarity])} ${esc(e.item.name)}</b><div class="tiny muted">${e.item.mods.map(m=>esc(m.label)).join(' • ')}${e.qty>1?` • ×${e.qty}`:''}</div>${gc220GearCompareHTML(a,e.item)}</div><span>Equip ›</span></button>`).join('')||'<div class="empty">No alternatives stored here.</div>'}</div>`}).join('')}`);
};

function gc220LatestRegionChange(id){const list=state.regions[id]?.gc220RecentChanges||[];return list[list.length-1]||null}
const _regionCardGC220=regionCard;
regionCard=function(id){let html=_regionCardGC220(id),last=gc220LatestRegionChange(id);const trail=`<div class="gc220RegionTrail"><b>RECENT CHANGE</b><span>${last?`${esc(last.cause)} • ${esc(last.text)}`:'No notable regional movement recorded yet.'}</span></div>`;return html.replace('<div class="actions">',trail+'<div class="actions">')};
const _gc193FinishNoTimeGC220=gc193FinishNoTime;
gc193FinishNoTime=function(p){const rid=p?.expedition?.contract?.regionId,title=p?.expedition?.contract?.title||'Contract',before=rid?gc220RegionSnapshot(rid):null,out=_gc193FinishNoTimeGC220(p);if(rid)gc220RecordRegionChanges(rid,before,gc220RegionSnapshot(rid),`Contract: ${title}`);return out};
const _gc199AdvanceWorldDayGC220=gc199AdvanceWorldDay;
gc199AdvanceWorldDay=function(){const before={};REGION_ORDER.forEach(id=>before[id]=gc220RegionSnapshot(id));const out=_gc199AdvanceWorldDayGC220();if(out)REGION_ORDER.forEach(id=>gc220RecordRegionChanges(id,before[id],gc220RegionSnapshot(id),'Daily regional simulation'));return out};

function gc220ExpeditionBrief(p){
 const e=p?.expedition;if(!e)return'';let hp=0,max=0,count=0;
 if(e.battle){e.battle.allies.forEach(x=>{hp+=Math.max(0,x.hp);max+=Math.max(1,x.maxHp);count++})}
 else partyMembers(p).filter(a=>a.status!=='Dead').forEach(a=>{const d=derived(a);hp+=Math.max(0,a.hp);max+=Math.max(1,d.maxHp);count++});
 const condition=max?Math.round(hp/max*100):0,contacts=Number(e.gc213EncounterCount)||Number(e.gc194Encounters)||0,latest=(e.events||[]).slice().reverse().find(x=>/contact|attrition|succeed|fail|injur|depart/i.test(String(x)))||'No notable field event yet.';
 return `<div class="gc220FieldBrief"><div><span>PARTY</span><b>${count} active • ${condition}% condition</b></div><div><span>CONTACTS</span><b>${contacts}</b></div><div><span>RETURN</span><b>${esc(gc199Eta(p))}</b></div><p>${esc(latest)}</p></div>`;
}
const _expeditionCardGC220=expeditionCard;
expeditionCard=function(p){let html=_expeditionCardGC220(p);return p?.expedition?html.replace('<div class="combatLog">',gc220ExpeditionBrief(p)+'<div class="combatLog">'):html};

function gc220CommandDeskHTML(){
 const rid=state.currentRegion,r=state.regions[rid],battles=state.parties.filter(p=>p.expedition?.battle),recovering=localRoster().filter(a=>a.status==='Recovering'),wounded=localRoster().filter(a=>a.status==='Ready'&&a.dailyOrder!=='Recover'&&Number(a.hp)<derived(a).maxHp*.65),caches=state.caches.filter(c=>c.regionId===rid).length;
 const attention=[];if(battles.length)attention.push(`${battles.length} hostile contact${battles.length===1?'':'s'} resolving`);if(recovering.length)attention.push(`${recovering.length} injured in recovery`);if(wounded.length)attention.push(`${wounded.length} badly wounded but still on duty`);if(caches)attention.push(`${caches} unopened loot cache${caches===1?'':'s'}`);
 const active=state.parties.filter(p=>p.expedition&&p.regionId===rid).length,scouts=gc201Team(rid,'Scout').length,odd=gc201Team(rid,'Odd Jobs').length,train=gc201Team(rid,'Train').length,recover=gc201Team(rid,'Recover').length,last=gc220LatestRegionChange(rid),job=gc220OddJobState(rid,false)?.current;
 return `<div class="gc220CommandDesk"><div class="gc220CommandHead"><span>COMMAND DESK</span><b>${esc(REGION_DEFS[rid].name)}</b></div><div class="gc220CommandGrid"><div class="gc220CommandCell attention"><span>NEEDS ATTENTION</span><b>${attention.length?attention.map(esc).join(' • '):'Nothing urgent'}</b></div><div class="gc220CommandCell"><span>IN MOTION</span><b>${active} field • ${scouts} scout • ${odd} odd jobs • ${train} train • ${recover} recover</b>${job&&odd?`<small>Current local job: ${esc(job.title)}</small>`:''}</div><div class="gc220CommandCell"><span>REGION</span><b>P ${Math.round(r.prosperity)} • S ${Math.round(r.stability)} • T ${Math.round(r.threat)}</b><small>${last?`${esc(last.cause)} • ${esc(last.text)}`:'No recent regional change'}</small></div></div></div>`;
}
const _gc193DailyDashboardGC220=gc193DailyDashboard;
gc193DailyDashboard=function(){return gc220CommandDeskHTML()+_gc193DailyDashboardGC220().replace('v20.1.3 • PACING PASS','v20.2 • COMPANY FLOW')};

function gc220InstallStyles(){
 if(document.getElementById('gc220Styles'))return;const style=document.createElement('style');style.id='gc220Styles';style.textContent=`
 .gc220CommandDesk{margin:10px 0 12px;padding:10px;border:1px solid rgba(208,166,94,.32);background:linear-gradient(180deg,rgba(34,27,20,.96),rgba(14,14,13,.98));border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.22)}
 .gc220CommandHead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}.gc220CommandHead span{font-size:10px;letter-spacing:.16em;color:#caa86a}.gc220CommandHead b{font-size:12px}
 .gc220CommandGrid{display:grid;grid-template-columns:1fr;gap:6px}.gc220CommandCell{padding:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:6px}.gc220CommandCell>span{display:block;font-size:9px;letter-spacing:.12em;color:#8f8678}.gc220CommandCell>b{display:block;margin-top:3px;font-size:11px;line-height:1.35}.gc220CommandCell small{display:block;margin-top:4px;color:#9b9184;line-height:1.35}.gc220CommandCell.attention{border-color:rgba(218,91,73,.25)}
 .gc220OddScene{overflow:hidden}.gc220OddScene .gc220Parcel{position:absolute;width:16px;height:12px;border:1px solid #caa86a;left:50%;top:48%;transform:translate(-50%,-50%);animation:gc220Bob 1.8s ease-in-out infinite}.gc220OddScene .gc220Coin{position:absolute;width:5px;height:5px;border:1px solid #d2b46f;border-radius:50%;top:28%;animation:gc220Coin 1.7s ease-in-out infinite}.gc220OddScene .gc220Coin.one{left:25%}.gc220OddScene .gc220Coin.two{right:25%;animation-delay:.55s}.gc220OddScene .gc220Footsteps{position:absolute;left:18%;right:18%;bottom:15%;height:1px;background:linear-gradient(90deg,transparent,#85745b,transparent);animation:gc220Sweep 2s linear infinite}
 @keyframes gc220Bob{50%{transform:translate(-50%,-60%) rotate(-2deg)}}@keyframes gc220Coin{0%,100%{opacity:.15;transform:translateY(7px)}50%{opacity:1;transform:translateY(-4px)}}@keyframes gc220Sweep{0%{transform:translateX(-14px);opacity:.2}50%{opacity:1}100%{transform:translateX(14px);opacity:.2}}
 .gc220Identity{display:flex;flex-wrap:wrap;gap:4px;margin:5px 0}.gc220Identity span{font-size:9px;padding:2px 5px;border:1px solid rgba(202,168,106,.18);background:rgba(202,168,106,.055);border-radius:10px;color:#bcae98}.gc220CareerCard{display:flex;flex-direction:column;gap:3px;margin:8px 0;padding:8px;border-left:2px solid #9b7442;background:rgba(155,116,66,.08)}.gc220CareerCard b{font-size:9px;letter-spacing:.12em;color:#caa86a}.gc220CareerCard span{font-size:11px;color:#c4b8a8}
 .gc220GearChoice{width:100%;display:flex;justify-content:space-between;gap:10px;text-align:left;align-items:center}.gc220GearChoice>span{font-size:10px;color:#caa86a;white-space:nowrap}.gc220GearCompare{display:flex;gap:6px;align-items:center;margin-top:5px}.gc220GearCompare span{font-size:8px;letter-spacing:.1em;border:1px solid rgba(202,168,106,.35);padding:2px 4px;border-radius:3px;color:#caa86a}.gc220GearCompare b{font-size:9px;color:#c6b9a7;font-weight:600}
 .gc220RegionTrail{margin:8px 0;padding:7px 8px;border-left:2px solid rgba(202,168,106,.45);background:rgba(255,255,255,.02)}.gc220RegionTrail b{display:block;font-size:8px;letter-spacing:.13em;color:#9a8e7e}.gc220RegionTrail span{display:block;font-size:10px;margin-top:2px;color:#c6b9a7}
 .gc220FieldBrief{display:grid;grid-template-columns:1fr .6fr 1.1fr;gap:5px;margin:7px 0;padding:7px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);border-radius:5px}.gc220FieldBrief div span{display:block;font-size:8px;letter-spacing:.1em;color:#8f8678}.gc220FieldBrief div b{display:block;font-size:10px;margin-top:2px}.gc220FieldBrief p{grid-column:1/-1;margin:2px 0 0;font-size:9px;color:#a99d8c}
 .gc220Feed{display:flex;flex-direction:column;gap:5px}.gc220FeedRow{display:grid;grid-template-columns:44px 1fr;gap:7px;padding:7px;border:1px solid rgba(255,255,255,.06);border-radius:4px}.gc220FeedRow span{font-size:8px;color:#81796d}.gc220FeedRow b{font-size:10px;line-height:1.35}.gc220FeedRow.important{border-left:2px solid #a87845;background:rgba(168,120,69,.055)}.gc220Feed.routine{opacity:.78}
 @media(min-width:680px){.gc220CommandGrid{grid-template-columns:1.1fr 1fr 1fr}}
 @media(prefers-reduced-motion:reduce){.gc220OddScene *{animation:none!important}}
 `;document.head.appendChild(style);
}
gc220InstallStyles();

const _auditGC220=audit;
audit=function(){
 const out=_auditGC220();out.v220=GC220_VERSION;out.oddJobsStance=true;out.patrolReplacedByOddJobs=true;out.safeRoutineWork=true;out.oddJobsRegionalEffects=true;out.autoRecoveryReturn=true;out.commandDesk=true;out.smartEventLog=true;out.rosterIdentity=true;out.gearComparison=true;out.regionalChangeTrail=true;out.expeditionBrief=true;return out;
};
window.__BL_AUDIT=audit;
