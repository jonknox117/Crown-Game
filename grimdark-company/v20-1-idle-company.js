/* Grim Company v20.1 — Idle Company
   One continuous simulation. The player chooses stances and parties; characters
   perform the work. Days are calendar labels, not action-resolution gates. */
const GC201_VERSION='20.1';
const GC201_STANCES=['Scout','Patrol','Train','Recover'];
const GC201_COMBAT_STEP_DAYS=1000/GC199_DAY_MS; // one auto-combat round per ~1s at x1
const GC201_PUSH_STEP=.12;
const GC201_PUSH_CAP=.80;
const GC201_PUSH_DECAY=.65; // momentum points per simulation day
const GC201_RELATION_STEP=.25;
let GC201_BATTLE_LAST=(typeof performance!=='undefined'?performance.now():Date.now());

/* ---------- state migration / four HQ stances ---------- */
GC193_ORDERS.splice(0,GC193_ORDERS.length,...GC201_STANCES);

function gc201MigrateAdventurer(a){
 if(!a)return a;
 let order=a.dailyOrder;
 if(a.status==='Recovering')order='Recover';
 else if(order==='Rest'||order==='Recovery')order='Recover';
 else if(order==='Mentor')order='Train';
 else if(order==='Facility'){
   order=a.dailyFacility==='Infirmary'?'Recover':a.dailyFacility==='Training Yard'?'Train':'Scout';
 }
 if(!GC201_STANCES.includes(order))order='Train';
 a.dailyOrder=order;a.dailyMentorId=null;a.dailyFacility=null;
 const w=gc200Work(a);
 if(!Number.isFinite(Number(w.gc201TrainFraction)))w.gc201TrainFraction=0;
 if(!Number.isFinite(Number(w.gc201HealFraction)))w.gc201HealFraction=0;
 if(!Number.isFinite(Number(w.recoveryLeft)))w.recoveryLeft=Math.max(0,Number(a.recovery)||0);
 return a;
}
function gc201InitState(s=state,resume=false){
 if(!s)return s;
 s.timeSystem=s.timeSystem||{};
 const first=s.timeSystem.gc201Version!==GC201_VERSION;
 s.timeSystem.gc201Version=GC201_VERSION;
 (s.roster||[]).forEach(gc201MigrateAdventurer);
 Object.values(s.regions||{}).forEach(r=>{
   if(!Number.isFinite(Number(r.gc200PatrolProgress)))r.gc200PatrolProgress=0;
   if(r.gc200ScoutTarget==null)r.gc200ScoutTarget=null;
   (r.contracts||[]).forEach(c=>{gc193EnsureContract(c);if(!Number.isFinite(Number(c.gc200ScoutProgress)))c.gc200ScoutProgress=0});
 });
 (s.parties||[]).forEach(p=>{const e=p.expedition;if(!e)return;if(!Number.isFinite(Number(e.gc201Momentum)))e.gc201Momentum=0;if(!Number.isFinite(Number(e.gc201CombatClock)))e.gc201CombatClock=0;if(!Number.isFinite(Number(e.gc201ContactExposure)))e.gc201ContactExposure=0});
 if(first||resume){s.timeSystem.gc199Mode='play';s.timeSystem.gc199PauseReason=''}
 const face=(s.artifacts||[]).filter(a=>a.name==="The King’s Second Face");face.forEach(a=>a.cost='Successful contracts in this region attract attention and add +2 Threat.');
 return s;
}

/* ---------- fair starts in every mortal region ---------- */
function gc201MakeStarterContract(c,regionId){
 if(!c)return c;
 c.regionId=regionId;c.risk=1;c.enemyCount=rnd(2,4);c.nemesisId=null;c.unknown=Math.min(1,Math.max(0,Number(c.unknown)||0));
 c.expires=Math.max(Number(c.expires)||0,(state?.company?.day||1)+6);
 delete c.gc194Economy;delete c.gcDuration;gc193EnsureContract(c);gc194TuneContract(c);
 return c;
}
function gc201SeedStarterContracts(s,regionId){
 if(!s||!GC194_MORTAL_REGIONS.includes(regionId)||!s.regions?.[regionId])return s;
 withState(s,()=>{
   const r=s.regions[regionId];
   while(r.contracts.length<5)r.contracts.push(generateContract(regionId));
   let need=Math.max(0,3-r.contracts.filter(c=>Number(c.risk)===1).length);
   for(const c of r.contracts.filter(c=>Number(c.risk)!==1)){
     if(need<=0)break;gc201MakeStarterContract(c,regionId);need--;
   }
   r.contracts.forEach(gc193EnsureContract);r.gc201StarterSeeded=true;
 });
 return s;
}
function gc201EarlyCompany(s){return!!(s&&Number(s.company?.day||1)<=2&&Number(s.company?.renown||0)===0&&(s.parties||[]).every(p=>Number(p.missions||0)===0))}

const _normalizeStateGC201=normalizeState;
normalizeState=function(s){
 s=_normalizeStateGC201(s);if(!s)return s;gc201InitState(s,true);
 if(gc201EarlyCompany(s)&&!s.regions?.[s.currentRegion]?.gc201StarterSeeded)gc201SeedStarterContracts(s,s.currentRegion);
 return s;
};
const _createStateGC201=createState;
createState=function(name,startRegion='veyric'){
 const s=gc201InitState(_createStateGC201(name,startRegion),true);gc201SeedStarterContracts(s,s.currentRegion||startRegion);return s;
};

/* ---------- economy: sign people once, do not tax active play ---------- */
weeklyWages=function(){};
function gc201HireCost(a){return Math.max(16,Math.round((Number(a?.wage)||4)*4))}
hireRecruit=function(id){
 const r=region(),a=r.recruits.find(x=>x.id===id);if(!a)return;
 if(localRoster().length>=rosterCap())return toast('Barracks are full.');
 const cost=gc201HireCost(a);if(state.company.silver<cost)return toast(`Need ${money(cost)}.`);
 state.company.silver-=cost;r.recruits=r.recruits.filter(x=>x.id!==id);gc201MigrateAdventurer(a);a.dailyOrder='Train';state.roster.push(a);
 pushHistory(`Signed ${a.name}, ${a.culture} ${a.className}, for ${money(cost)}.`);sfx('hire');save();render();
};
const _recruitCardGC201=recruitCard;
recruitCard=function(a){
 let html=_recruitCardGC201(a),cost=gc201HireCost(a);
 html=html.replace(new RegExp(`• ${a.wage}s/week`,'g'),'• no recurring wage');
 html=html.replace(/>Hire [^<]+</,`>Sign ${money(cost)}<`);
 return html;
};
if(HQ_DEFS?.Stores)HQ_DEFS.Stores.desc='Reduces market purchase prices by 4% per level.';
const _renderInspectGC201=renderInspect;
renderInspect=function(id,recruit=false){const out=_renderInspectGC201(id,recruit);document.getElementById('sheet')?.querySelectorAll('.gc194PayrollCard').forEach(x=>x.remove());return out};
const _renderGC201=render;
render=function(){const out=_renderGC201();if(state)requestAnimationFrame(()=>document.querySelectorAll('.gc194RosterWage').forEach(x=>x.remove()));return out};

/* Preserve the Second Face's risk/reward tradeoff after payroll is removed. */
const _gc193FinishNoTimeGC201=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,c=e?.contract,rid=c?.regionId,face=!!(c&&hasArtifact("The King’s Second Face",rid)),won=e?.battleWon!==false;
 const out=_gc193FinishNoTimeGC201(p);
 if(face&&won&&rid&&state.regions[rid]){state.regions[rid].threat=clamp(state.regions[rid].threat+2,0,100);pushHistory("The King’s Second Face drew dangerous attention after the payout (+2 Threat).",rid);save()}
 return out;
};

/* ---------- shared HQ activity ---------- */
function gc201Team(regionId,stance){return state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.dailyOrder===stance)}
function gc201PairActivityTick(regionId,stance,members,deltaDays){
 if(stance==='Recover'||members.length<2||deltaDays<=0)return;
 for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
   const a=members[i],b=members[j],rel=bl18Rel(a,b);rel.gc201StanceTime=rel.gc201StanceTime||{};
   rel.gc201StanceTime[stance]=(Number(rel.gc201StanceTime[stance])||0)+deltaDays;
   let guard=0;while(rel.gc201StanceTime[stance]>=GC201_RELATION_STEP&&guard++<2){
     rel.gc201StanceTime[stance]-=GC201_RELATION_STEP;
     const daily=gc195PairEventChance(a,b,{kind:'hq',activity:stance}),scaled=1-Math.pow(1-daily,GC201_RELATION_STEP);
     if(chance(scaled)){
       const before=(state.relationshipSystem?.recent||[]).length;
       if(gc195RunPairEvent(a,b,{kind:'hq',activity:stance})){
         const ev=state.relationshipSystem?.recent?.[state.relationshipSystem.recent.length-1];
         if(ev&&state.relationshipSystem.recent.length>before)gc199RecordFeed(`RELATIONSHIP — ${ev.text}`,'relationship');
       }
     }
   }
 }
}
function gc201TrainingBonus(team){
 if(team.length<2)return 0;
 const best=Math.max(...team.map(a=>a.lvl||1)),career=Math.max(...team.map(a=>bl17EnsureCareer(a)||0));
 return clamp(.07*Math.sqrt(team.length-1)+Math.max(0,best-1)*.008+career*.025,.05,.42);
}
function gc201TrainRegion(regionId,deltaDays){
 const team=gc201Team(regionId,'Train');if(!team.length)return;
 const yard=hq(regionId).upgrades['Training Yard']||0,bonus=gc201TrainingBonus(team);
 team.forEach(a=>{
   const w=gc200Work(a),rate=(6+yard*2)*(1+bonus);w.gc201TrainFraction=(Number(w.gc201TrainFraction)||0)+rate*deltaDays;
   const gain=Math.floor(w.gc201TrainFraction+1e-8);if(gain>0){w.gc201TrainFraction-=gain;const before=a.lvl;if(grantXP(a,gain)&&a.lvl>before){gc199RecordFeed(`${a.name} reached Level ${a.lvl} while training.`,'level');sfx('level')}}
 });
 gc201PairActivityTick(regionId,'Train',team,deltaDays);
}
function gc201ScoutRegion(regionId,deltaDays){
 const team=gc201Team(regionId,'Scout');if(!team.length)return;const c=gc200SharedScoutTarget(regionId);if(!c)return;
 team.forEach(a=>{const w=gc200Work(a);w.scoutTarget=c.id;w.scoutProgress=0});
 const office=hq(regionId).upgrades['Contract Office']||0,archive=hq(regionId).upgrades['Occult Archive']||0,mult=1+office*.025+archive*.06;
 const combined=team.reduce((s,a)=>s+gc200ScoutRate(a),0)*mult;c.gc200ScoutProgress=(Number(c.gc200ScoutProgress)||0)+combined*deltaDays;
 let guard=0;while(c.gc200ScoutProgress>=1&&guard++<4){c.gc200ScoutProgress-=1;gc200ResolveScoutTeam(regionId,team,c);if(c.gcIntel>=2&&(c.unknown||0)<=0)break}
 gc201PairActivityTick(regionId,'Scout',team,deltaDays);
}
function gc201PatrolRegion(regionId,deltaDays){
 const team=gc201Team(regionId,'Patrol');if(!team.length)return;const r=state.regions[regionId];
 const score=team.reduce((s,a)=>{const d=derived(a);return s+d.combat.attack*.22+d.combat.guard*.14+d.util.scout*.18+a.lvl*1.8},0),avg=score/team.length;
 const arm=hq(regionId).upgrades.Armory||0,command=hq(regionId).upgrades['Command Hall']||0;
 const rate=clamp((.72+avg/125+Math.min(.30,(team.length-1)*.07))*(1+arm*.025+command*.02),.75,2.1);
 r.gc200PatrolProgress=(Number(r.gc200PatrolProgress)||0)+rate*deltaDays;
 let guard=0;while(r.gc200PatrolProgress>=1&&guard++<3){r.gc200PatrolProgress-=1;const report=[];gc193PatrolRegion(regionId,team,report);report.forEach(x=>gc199RecordFeed(x,'patrol'))}
 gc201PairActivityTick(regionId,'Patrol',team,deltaDays);
}
function gc201RecoveryTick(a,deltaDays){
 if(!gc193AtHQ(a)||deltaDays<=0)return;const w=gc200Work(a),max=derived(a).maxHp,inf=hq(a.regionId).upgrades.Infirmary||0;
 a.hp=clamp(Number(a.hp)||0,0,max);const focused=a.status==='Recovering'||a.dailyOrder==='Recover';const pct=focused?(.14+inf*.018):.012;
 if(a.hp<max){w.gc201HealFraction=(Number(w.gc201HealFraction)||0)+max*pct*deltaDays;const heal=Math.floor(w.gc201HealFraction+1e-8);if(heal>0){w.gc201HealFraction-=heal;a.hp=Math.min(max,a.hp+heal)}}else w.gc201HealFraction=0;
 if(a.status==='Recovering'){
   if(w.gc201LastStatus!=='Recovering'||w.recoveryLeft<=0)w.recoveryLeft=Math.max(.25,Number(a.recovery)||1);
   w.recoveryLeft=Math.max(0,w.recoveryLeft-deltaDays*(1+inf*.12));a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
   if(w.recoveryLeft<=0){a.status='Ready';a.injury=null;a.recovery=0;a.dailyOrder='Recover';const text=`${a.name} completed injury recovery and remains on Recover until reassigned.`;pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');sfx('rest')}
 }
 w.gc201LastStatus=a.status;
}

gc200ContinuousWork=function(deltaDays){
 if(!state||deltaDays<=0)return;gc201InitState(state,false);
 state.roster.forEach(a=>gc201RecoveryTick(a,deltaDays));
 REGION_ORDER.forEach(id=>{gc201ScoutRegion(id,deltaDays);gc201PatrolRegion(id,deltaDays);gc201TrainRegion(id,deltaDays)});
};

/* ---------- native continuous expedition danger ---------- */
function gc201ContactRate(p){
 const e=p?.expedition,c=e?.contract;if(!c)return 0;const r=state.regions[c.regionId],risk=clamp(Number(c.risk)||1,1,5);
 let rate=({1:.10,2:.18,3:.29,4:.43,5:.62})[risk];
 rate+=({Extermination:.10,Siege:.13,Defense:.08,Hunt:.06,Escort:.03,Caravan:.03,Exploration:.05,Retrieval:.02,Rescue:0,Assassination:.04,Investigation:-.04,Negotiation:-.07})[c.type]||0;
 rate+=((r?.threat||50)-50)*.0032+Math.min(.16,(Number(c.unknown)||0)*.035);
 const scout=bestUtility(p,'scout')?.value||0;rate-=Math.min(.13,Math.max(0,scout-12)/180);rate-=(Number(c.gcIntel)||0)*.045+(Number(c.gcScoutEdge)||0)*.45;
 rate+=p?.tactic==='Cautious'?-.06:p?.tactic==='Aggressive'?.07:0;
 rate*=1+(Number(e?.gc201Momentum)||0)*.60;
 return clamp(rate,.025,1.25);
}
function gc201ContactLabel(rate){return rate<.12?'LOW':rate<.24?'MODERATE':rate<.40?'HIGH':rate<.68?'SEVERE':'EXTREME'}
function gc201PushStrain(p,travel,momentum){
 const e=p?.expedition;if(!e||travel<=0||momentum<=0)return;const risk=Number(e.contract?.risk)||1,people=partyMembers(p).filter(a=>a.status!=='Dead');if(!people.length)return;
 const hazard=1-Math.exp(-(.025*risk*momentum)*travel);if(!chance(hazard))return;
 const a=pick(people),max=derived(a).maxHp,dmg=Math.max(2,Math.round(max*(.025+Math.random()*.035)));a.hp=Math.max(1,a.hp-dmg);e.events.push(`${a.name} lost ${dmg} HP to the forced pace.`);
 if(a.hp/max<.25&&chance(.12)){a.status='Recovering';a.injury=injuryName();a.recovery=1+rnd(0,1);e.events.push(`${a.name} aggravated ${a.injury} while pushing the pace.`)}
}
function gc201AdvanceExpedition(p,deltaDays){
 const e=p?.expedition;if(!e||e.battle||deltaDays<=0)return;gc193MigrateExpedition(p);
 const current=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),remaining=Math.max(0,e.durationDays-current);if(remaining<=.0001)return gc193FinishNoTime(p);
 const momentum=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP),speed=1+momentum,span=Math.min(remaining,deltaDays*speed),rate=gc201ContactRate(p),hazard=1-Math.exp(-rate*span),contact=chance(hazard),travel=contact?span*Math.random():span,total=current+travel;
 gc200SetFieldProgress(e,total);e.gc201ContactExposure=(Number(e.gc201ContactExposure)||0)+travel;e.gc201LastContactRate=rate;gc200FieldRelations(p,travel);gc201PushStrain(p,travel,momentum);
 e.gc201Momentum=Math.max(0,momentum-GC201_PUSH_DECAY*deltaDays);
 if((e.gcChecksDone||0)<1&&total>=Math.min(.35,e.durationDays*.25)){fieldCheck(p);e.gcChecksDone=(e.gcChecksDone||0)+1}
 if(contact){e.gc194Encounters=(e.gc194Encounters||0)+1;e.events.push(`Hostile contact at ${Math.round(e.progress)}% travel progress.`);startBattle(p);save();render();return}
 if(total>=e.durationDays-.0001){gc200SetFieldProgress(e,e.durationDays);return gc193FinishNoTime(p)}
 e.expectedReturnDay=state.company.day+Math.ceil(Math.max(0,e.durationDays-total));
}
function gc201CombatTick(p,deltaDays){
 const e=p?.expedition,b=e?.battle;if(!e||!b||deltaDays<=0)return;e.gc201CombatClock=(Number(e.gc201CombatClock)||0)+deltaDays;
 let guard=0;while(e.gc201CombatClock>=GC201_COMBAT_STEP_DAYS&&guard++<6&&p.expedition?.battle){e.gc201CombatClock-=GC201_COMBAT_STEP_DAYS;combatRound(p)}
}
function gc201AdvanceField(deltaDays){
 const parties=state.parties.filter(p=>p.expedition).slice();
 for(const p of parties){if(p.expedition?.battle)gc201CombatTick(p,deltaDays);else gc201AdvanceExpedition(p,deltaDays)}
}
gc199AdvanceFieldClocks=function(deltaDays){gc200ContinuousWork(deltaDays);gc201AdvanceField(deltaDays)};

/* Legacy auto timer cannot advance the new simulation. Manual advance becomes Push. */
advanceExpedition=function(pid,manual=false){if(manual)return gc199PushParty(pid)};
gc199PushParty=function(pid){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition;if(!e)return toast('That party is not in the field.');if(e.battle)return toast('They are fighting. Travel momentum resumes after combat.');
 const before=Number(e.gc201Momentum)||0;e.gc201Momentum=clamp(before+GC201_PUSH_STEP,0,GC201_PUSH_CAP);e.events.push(`Headquarters pushed the pace to ${(1+e.gc201Momentum).toFixed(2)}× travel.`);sfx('depart');save();gc199UpdateClock();
};

/* v19.9 pauses when any battle exists. Keep its normal loop for ordinary travel,
   and run this companion master tick only while battles exist so the rest of the
   company and every other expedition continue moving during auto-combat. */
function gc201AutoPauseReason(reason){return /Resolve active encounters|HOSTILE CONTACT|hostile contact|party has returned|Casualty report|Artifact recovered|Opening recovered cache/i.test(String(reason||''))}
const _gc199PauseGC201=gc199Pause;
gc199Pause=function(reason='',notify=false){
 if(gc201AutoPauseReason(reason)){if(state?.timeSystem){state.timeSystem.gc199PauseReason=''}if(notify&&reason)toast(reason);gc199UpdateClock();return}
 return _gc199PauseGC201(reason,notify);
};
gc199SetMode=function(mode){
 if(!state||!['paused','play','fast'].includes(mode))return;gc199InitState(state);state.timeSystem.gc199Mode=mode;state.timeSystem.gc199PauseReason=mode==='paused'?'Paused by player.':'';GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());save();gc199UpdateClock();
 if(mode==='play')toast('Company running at normal speed.');if(mode==='fast')toast('Company running at 4× speed.');
};
function gc201BattleLoop(){
 const now=(typeof performance!=='undefined'?performance.now():Date.now()),dt=Math.max(0,Math.min(1000,now-GC201_BATTLE_LAST));GC201_BATTLE_LAST=now;
 if(!state||document.hidden||gc199Mode()==='paused'||!state.parties.some(p=>p.expedition?.battle))return;
 const deltaDays=(dt*gc199Speed())/GC199_DAY_MS;state.timeSystem.gc199DayProgress+=deltaDays;gc199AdvanceFieldClocks(deltaDays);
 let guard=0;while(state.timeSystem.gc199DayProgress>=1&&guard++<3){state.timeSystem.gc199DayProgress-=1;if(!gc199AdvanceWorldDay())break}
 gc199UpdateClock();
}
setInterval(gc201BattleLoop,250);

/* Preserve relationship-aware battle setup but remove the automatic pause. */
startBattle=function(p){
 const out=_startBattleGC199(p),e=p?.expedition;if(e?.battle){e.gc201CombatClock=0;const text=`HOSTILE CONTACT — ${p.name}: ${e.contract?.title||'contract'}`;gc199RecordFeed(text,'danger');toast(`${p.name} entered combat.`)}return out;
};

/* Resume automatically after iOS/background pause unless the player paused manually. */
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state&&/background|foreground|closed|left/i.test(state.timeSystem?.gc199PauseReason||''))gc199SetMode('play')});

/* ---------- live UI ---------- */
gc193OrderLabel=function(a){
 if(!a)return'—';if(a.status==='Dead')return'Fallen';if(a.status==='Expedition')return'On Contract';if(a.status==='Captured')return'Captured';if(a.status==='Recovering')return'Recover';return GC201_STANCES.includes(a.dailyOrder)?a.dailyOrder:'Train';
};
function gc201TrainingRate(a){const team=gc201Team(a.regionId,'Train'),yard=hq(a.regionId).upgrades['Training Yard']||0;return(6+yard*2)*(1+gc201TrainingBonus(team))}
gc200WorkSnapshot=function(a){
 if(!a)return{label:'',detail:'',pct:0};const max=derived(a).maxHp,daySec=GC199_DAY_MS/1000;
 if(a.status==='Recovering'){const w=gc200Work(a),inf=hq(a.regionId).upgrades.Infirmary||0;return{label:'RECOVERING',detail:`+${((.14+inf*.018)*max/daySec).toFixed(2)} HP/s at x1 • injury ${Math.max(0,w.recoveryLeft||0).toFixed(2)}d`,pct:max?clamp(a.hp/max*100,0,100):0}}
 if(a.status!=='Ready')return{label:gc193OrderLabel(a).toUpperCase(),detail:'',pct:0};
 if(a.dailyOrder==='Recover'){const inf=hq(a.regionId).upgrades.Infirmary||0;return{label:'RECOVER',detail:`+${((.14+inf*.018)*max/daySec).toFixed(2)} HP/s at x1`,pct:max?clamp(a.hp/max*100,0,100):0}}
 if(a.dailyOrder==='Train'){const team=gc201Team(a.regionId,'Train'),bonus=gc201TrainingBonus(team),w=gc200Work(a);return{label:'TRAIN',detail:`${team.length} training • +${bonus?Math.round(bonus*100):0}% group bonus • ${(gc201TrainingRate(a)/daySec).toFixed(2)} XP/s`,pct:clamp((Number(w.gc201TrainFraction)||0)*100,0,100)}}
 if(a.dailyOrder==='Scout'){const c=gc200SharedScoutTarget(a.regionId),team=gc201Team(a.regionId,'Scout'),pct=c?clamp((Number(c.gc200ScoutProgress)||0)*100,0,100):0;return{label:'SCOUT',detail:c?`${team.length} together • ${c.title} • ${Math.round(pct)}% breakthrough`:'No contract needs intel',pct}}
 if(a.dailyOrder==='Patrol'){const r=state.regions[a.regionId],team=gc201Team(a.regionId,'Patrol'),pct=clamp((Number(r.gc200PatrolProgress)||0)*100,0,100);return{label:'PATROL',detail:`${team.length} together • ${Math.round(pct)}% patrol cycle`,pct}}
 return{label:'TRAIN',detail:'',pct:0};
};
function gc201StanceDashboard(regionId=state.currentRegion){
 const data=GC201_STANCES.map(st=>{const team=gc201Team(regionId,st),sample=team[0],snap=sample?gc200WorkSnapshot(sample):null;return`<button class="gc201Stance ${st.toLowerCase()}" data-action="gcOrders"><div class="gc201StanceHead"><b>${st.toUpperCase()}</b><span>${team.length}</span></div><div class="gc201Faces">${team.slice(0,7).map(a=>`<span title="${esc(a.name)}">${blPortraitHTML(a)}</span>`).join('')||'<em>Empty</em>'}</div><div class="gc201StanceMeta">${snap?esc(snap.detail):st==='Recover'?'Individual healing; no group relationship gain':'Assign people here to work together.'}</div>${snap?`<i><em style="width:${snap.pct}%"></em></i>`:''}</button>`}).join('');
 return `<div class="gc201StanceGrid">${data}</div>`;
}
gc193OrderSummary=function(regionId=state.currentRegion){return GC201_STANCES.map(k=>`<span class="gc193OrderChip"><b>${gc201Team(regionId,k).length}</b>${k}</span>`).join('')};
gc193DailyDashboard=function(){
 const active=state.parties.filter(p=>p.expedition).length,battles=state.parties.filter(p=>p.expedition?.battle).length;
 return `<div class="gc193DayPanel gc199DayPanel gc201CompanyPanel"><div class="gc193DayHead"><div><span>LIVE COMPANY</span><b>${gc199ClockLabel()}</b></div>${gc193SkullSvg('small')}</div>${gc201StanceDashboard()}<div class="gc193DayMeta">${active} contract${active===1?'':'s'} running${battles?` • <strong>${battles} auto-combat${battles===1?'':'s'} active</strong>`:''}</div><div class="actions"><button class="btn" data-action="gcOrders">Assign Stances</button><button class="btn" data-action="gc199Feed">Event Log</button><button class="btn ghost" data-action="gc199TimeHelp">Time?</button></div></div>`;
};
gc193OrderPanel=function(a){
 if(a.status==='Expedition')return `<div class="gc193OrderPanel"><b>STANCE</b><span>ON CONTRACT</span></div>`;if(a.status==='Captured')return `<div class="gc193OrderPanel"><b>STANCE</b><span>CAPTURED</span></div>`;if(a.status==='Recovering')return `<div class="gc193OrderPanel"><b>STANCE</b><span>RECOVER • injury ${a.recovery}d</span></div>`;
 return `<div class="gc193OrderPanel"><div><b>STANCE</b><span>${esc(gc193OrderLabel(a))}</span></div><button class="btn ghost" data-action="gcOrderPick" data-id="${a.id}">Change</button></div>`;
};
gc193OrdersModal=function(){
 const rows=localRoster().filter(a=>a.status!=='Dead');
 modal(`<div class="sheetHead"><div><h3>${gc193SkullSvg('tiny')} HQ Stances</h3><div class="tiny muted">Scout • Patrol • Train work together. Recover is individual.</div></div><button class="x" data-action="close">×</button></div>${gc201StanceDashboard()}<div class="notice">People sharing Scout, Patrol or Train spend that simulation time together and can build relationships naturally.</div><div class="list gc193OrdersList">${rows.map(a=>`<div class="card gc193OrderRow"><div class="gc193OrderFace">${blPortraitHTML(a)}</div><div><b>${esc(a.name)}</b><span>${esc(a.culture)} ${esc(a.className)} • ${a.hp}/${derived(a).maxHp} HP</span><strong>${esc(gc193OrderLabel(a))}</strong></div><button class="btn ghost" data-action="gcOrderPick" data-id="${a.id}" ${['Expedition','Captured','Recovering'].includes(a.status)?'disabled':''}>${a.status==='Ready'?'Change':'Locked'}</button></div>`).join('')}</div>`);
};
gc193OrderPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 const desc={Scout:'Work the shared regional intel target with every other scout. Builds relationships.',Patrol:'Work the same patrol route together, suppress Threat, and face patrol trouble as a group.',Train:'Gain personal XP while training partners provide diminishing shared bonuses and relationship time.',Recover:'Drop productive work for maximum personal HP and injury recovery.'};
 modal(`<div class="sheetHead"><div><h3>Stance • ${esc(a.name)}</h3><div class="tiny muted">Current: ${esc(gc193OrderLabel(a))}</div></div><button class="x" data-action="close">×</button></div><div class="list">${GC201_STANCES.map(o=>`<button class="card gc193OrderChoice" data-action="gcSetOrder" data-id="${a.id}" data-value="${o}"><b>${o}</b><span>${esc(desc[o])}</span></button>`).join('')}</div>`);
};
const _processActionGC201=processAction;
processAction=function(el){
 if(el.dataset.action==='gcSetOrder'){
   const a=state.roster.find(x=>x.id===el.dataset.id),v=el.dataset.value;if(!a||a.status!=='Ready'||!GC201_STANCES.includes(v))return;a.dailyOrder=v;a.dailyMentorId=null;a.dailyFacility=null;save();render();return gc193OrdersModal();
 }
 return _processActionGC201(el);
};

function gc201TravelVisual(p){
 const e=p?.expedition,combat=!!e?.battle,momentum=clamp(Number(e?.gc201Momentum)||0,0,GC201_PUSH_CAP),pushing=momentum>.02;
 return `<div class="gc200Travel ${combat?'combat':''} ${pushing?'gc201Pushing':''}" style="--gc201-speed:${(1+momentum).toFixed(2)}" aria-hidden="true"><div class="gc200TravelSky"><i></i><i></i><i></i></div><div class="gc200Ground"></div><svg viewBox="0 0 280 82" class="gc200Wagon" role="presentation"><g class="gc200Cart"><path d="M24 34h82l15 29H17z"/><path d="M37 33q25-30 53 0"/><circle class="wheel" cx="39" cy="66" r="12"/><circle class="wheel" cx="102" cy="66" r="12"/><path d="M39 54v24M27 66h24M102 54v24M90 66h24"/></g><path class="gc200Harness" d="M112 47L150 43M112 50L203 47"/><g class="gc200Horse horseA"><ellipse cx="163" cy="43" rx="23" ry="12"/><circle cx="187" cy="31" r="9"/><path d="M181 25l3-10 5 9M193 27l8-8-2 11"/><path class="leg l1" d="M151 51l-8 22M163 52l-2 21M173 50l8 22M181 48l14 19"/></g><g class="gc200Horse horseB"><ellipse cx="216" cy="47" rx="23" ry="12"/><circle cx="240" cy="35" r="9"/><path d="M234 29l3-10 5 9M246 31l8-8-2 11"/><path class="leg l1" d="M204 55l-8 19M216 56l-2 18M226 54l8 20M234 52l14 17"/></g></svg><div class="gc200TravelCaption">${combat?'AUTO-COMBAT':pushing?`PUSHING ${(1+momentum).toFixed(2)}×`:'ON THE ROAD'}</div></div>`;
}
gc200TravelVisual=gc201TravelVisual;

gc199Eta=function(p){
 const e=p?.expedition;if(!e)return'';const current=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),remaining=Math.max(0,e.durationDays-current),speed=(1+(Number(e.gc201Momentum)||0))*Math.max(1,gc199Speed()||1),sec=remaining*(GC199_DAY_MS/1000)/speed;
 return e.battle?'Auto-combat resolving':gc199Mode()==='paused'?`~${gc199FormatSeconds(remaining*GC199_DAY_MS/1000/(1+(Number(e.gc201Momentum)||0)))} • paused`:`~${gc199FormatSeconds(sec)} at current pace`;
};
expeditionCard=function(p){
 const e=p?.expedition;if(!e)return'';gc193MigrateExpedition(p);const total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),pct=clamp(total/Math.max(1,e.durationDays)*100,0,100),rate=gc201ContactRate(p),risk=gc201ContactLabel(rate),mom=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP);
 return `<div class="card gc193Expedition gc199Expedition gc201Expedition" data-gc199-party="${p.id}"><div class="statline"><div><b>${esc(p.name)}</b><div class="tiny muted">${e.battle?'AUTO-COMBAT':'TRAVELING'} • ${Math.round(pct)}% complete</div></div><span class="gold">${esc(e.contract.title)}</span></div>${gc201TravelVisual(p)}<div class="gc193Timeline"><i data-gc199-progress style="width:${pct}%"></i></div><div class="gc201FieldMeta"><span data-gc199-eta>${esc(gc199Eta(p))}</span><span data-gc201-risk>CONTACT ${risk}</span><span data-gc201-momentum>${mom?`PACE ${(1+mom).toFixed(2)}×`:'PACE 1.00×'}</span></div>${e.battle?battleHTML(e.battle):''}<div class="combatLog">${(e.battle?e.battle.log:e.events).slice(-12).map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="actions">${e.battle?`<div class="gc201AutoCombat"><b>Combat is resolving automatically.</b><span>One round per simulation tick cycle • Fast accelerates it.</span></div>`:`<button class="btn goldbtn" data-action="gc199Push" data-id="${p.id}">Push Party +${Math.round(GC201_PUSH_STEP*100)}%</button>`}</div></div>`;
};
const _gc199UpdateClockGC201=gc199UpdateClock;
gc199UpdateClock=function(){
 _gc199UpdateClockGC201();if(!state)return;
 document.querySelectorAll('.gc201Expedition[data-gc199-party]').forEach(card=>{const p=state.parties.find(x=>x.id===card.dataset.gc199Party),e=p?.expedition;if(!e)return;const mom=Number(e.gc201Momentum)||0,rate=gc201ContactRate(p),m=card.querySelector('[data-gc201-momentum]'),r=card.querySelector('[data-gc201-risk]'),travel=card.querySelector('.gc200Travel');if(m)m.textContent=mom?`PACE ${(1+mom).toFixed(2)}×`:'PACE 1.00×';if(r)r.textContent=`CONTACT ${gc201ContactLabel(rate)}`;if(travel){travel.style.setProperty('--gc201-speed',(1+mom).toFixed(2));travel.classList.toggle('gc201Pushing',mom>.02)}});
};

const _contractCardGC201=contractCard;
contractCard=function(c){
 let html=_contractCardGC201(c),fake={expedition:{contract:c,gc201Momentum:0},tactic:'Balanced',members:[]},rate=gc201ContactRate(fake),label=gc201ContactLabel(rate);
 html=html.replace(/<div class="gc194RiskReadout">[\s\S]*?<\/div>/,`<div class="gc194RiskReadout gc201RiskReadout"><b>RISK ${c.risk} — ${gc194RiskBand(c.risk)}</b><span>Recommended Lv.${gc194RiskLevel(c.risk)}+ • continuous contact pressure ${label} before party scouting</span></div>`);
 return html;
};

/* Cache feedback no longer pauses the living company. */
openCache=function(id){
 const c=state.caches.find(x=>x.id===id);if(!c)return;const item=generateItem(c.regionId,c.rarity);inventoryEntry(item,c.regionId,1);state.caches=state.caches.filter(x=>x.id!==id);save();render();gc200ChestSounds();
 const stars=Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('');
 modal(`<div class="sheetHead"><div><h3>Recovered Cache</h3><div class="tiny muted">${esc(c.from||'Field recovery')}</div></div><button class="x" data-action="close">×</button></div><div class="gc200ChestScene opening" data-rarity="${item.rarity}"><div class="gc200Glow"></div><div class="gc200Particles">${stars}</div><div class="gc200Chest"><div class="gc200ChestLid"><span></span></div><div class="gc200ChestBody"><span></span></div></div></div><div class="gc200ChestReveal" id="gc200ChestReveal">${itemHTML(item)}<div class="notice">${RARITIES[item.rarity]} reward • ${item.mods.length} modifier${item.mods.length===1?'':'s'}</div></div>`);
 setTimeout(()=>{const reveal=document.getElementById('gc200ChestReveal');if(reveal){reveal.classList.add('shown');sfx('loot');simpleTone(1040,.16,'sine',.10,false,.08)}},520);
};

gc199TimeHelp=function(){
 modal(`<div class="sheetHead"><h3>How Time Works • v20.1</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>The company is a continuous simulation.</b> You choose stances, parties and tactics; the characters perform them.</div><div class="list"><div class="card"><b>Four HQ stances</b><div class="small muted">Scout, Patrol and Train are shared activities and build relationship time. Recover is individual.</div></div><div class="card"><b>Contracts run themselves</b><div class="small muted">Travel, hostile contact and combat all advance on ticks. Combat auto-resolves; Fast accelerates everything.</div></div><div class="card"><b>Push Party</b><div class="small muted">Every tap adds temporary travel momentum. Repeated pushes stack up to ${(1+GC201_PUSH_CAP).toFixed(2)}×, then decay. Hard pushing raises danger and attrition.</div></div><div class="card"><b>No recurring wages</b><div class="small muted">Adventurers cost a larger signing fee up front. Active play is not punished by payroll.</div></div><div class="card"><b>No offline catch-up</b><div class="small muted">Closing/backgrounding pauses simulation time; returning to the app resumes it.</div></div></div>`);
};

/* Start screen promise: every homeland is a real starting region, not midgame. */
const _renderStartGC201=renderStart;
renderStart=function(){_renderStartGC201();const panel=document.querySelector('.gc193StartPanel');if(panel&&!panel.querySelector('.gc201StartPromise'))panel.insertAdjacentHTML('beforeend','<p class="tiny muted gc201StartPromise">Every mortal starting region begins with at least three Risk 1 contracts.</p>')};

const _auditGC201=audit;
audit=function(){
 const out=_auditGC201();out.grimCompanyIdle=GC201_VERSION;out.hqStances=[...GC201_STANCES];out.sharedStanceRelationships=true;out.groupTraining=true;out.groupScouting=true;out.groupPatrol=true;out.individualRecovery=true;out.wagesRemoved=true;out.individualPayroll=false;out.dailyEncounterRolls=false;out.nativeTickContactPressure=true;out.autoCombatTicks=true;out.pushMomentum=true;out.carriageHorsesLead=true;out.defaultSimulationRunning=true;
 out.starterRiskOneAllRegions=GC194_MORTAL_REGIONS.every(id=>{const s=createState(`Audit ${id}`,id);return(s.regions[id].contracts||[]).filter(c=>Number(c.risk)===1).length>=3});
 return out;
};
window.__BL_AUDIT=audit;
