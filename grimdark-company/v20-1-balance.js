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
