/* Grim Company v19.3.2 — calendar edge-case hardening. */
const GC193_TIME_HOTFIX='19.3.2';
function gc193TomorrowContracts(regionId){return (state.regions[regionId].contracts||[]).filter(c=>(c.expires==null||c.expires>state.company.day)).map(gc193EnsureContract)}

gc193ScoutRegion=function(regionId,scouts,report){
 if(!scouts.length)return;
 const contracts=gc193TomorrowContracts(regionId).sort((a,b)=>(b.unknown||0)-(a.unknown||0)||a.gcIntel-b.gcIntel||b.risk-a.risk);
 scouts.forEach((a,i)=>{
   const c=contracts[i%Math.max(1,contracts.length)];
   if(!c){report.push(`${a.name} found no contract that would still be active tomorrow; the scouting day produced no contract intel.`);return}
   const d=derived(a),score=d.util.scout+d.combat.speed*.25,gain=score>=30?2:1;
   c.gcIntel=Math.min(2,c.gcIntel+gain);
   c.unknown=Math.max(0,(c.unknown||0)-gain);
   c.gcScoutEdge=Math.max(c.gcScoutEdge,Math.min(.12,.04+Math.max(0,score-15)/220));
   grantXP(a,4+gain);
   bl18InitAdventurer(a).veteran.behavior.fieldcraft++;
   if(typeof bl18MaybeTraits==='function')bl18MaybeTraits(a);
   report.push(`${a.name} scouted ${c.title}: intel ${c.gcIntel}/2, ${c.unknown} unknowns remain.`);
 });
};

gc193FacilityWork=function(regionId,effects,report){
 const contracts=gc193TomorrowContracts(regionId),r=state.regions[regionId];
 if(effects.office){
   const a=effects.office,d=derived(a),c=[...contracts].sort((x,y)=>y.reward-x.reward)[0];
   if(c){c.gcOfficeBonus=Math.max(c.gcOfficeBonus,Math.min(.18,.08+d.util.talk/500));report.push(`${a.name} worked the Contract Office: ${c.title} can pay +${Math.round(c.gcOfficeBonus*100)}%.`)}
   else report.push(`${a.name} staffed the Contract Office, but no contract would remain open tomorrow.`);
 }
 if(effects.archive){
   const a=effects.archive,d=derived(a),c=contracts.filter(x=>ENEMY_SPECIES[x.species]?.supernatural).sort((x,y)=>(y.unknown||0)-(x.unknown||0))[0];
   if(c){c.unknown=Math.max(0,(c.unknown||0)-1);c.gcOccultEdge=Math.max(c.gcOccultEdge,Math.min(.12,.05+d.util.occult/500));report.push(`${a.name} worked the Occult Archive: ${c.title} gained supernatural countermeasures.`)}
   else report.push(`${a.name} worked the Occult Archive, but no surviving supernatural contract needed preparation.`);
 }
 const workers=GC193_FACILITIES.flatMap(f=>gc193FacilityWorkers(regionId,f));
 workers.forEach(a=>grantXP(a,2));
};

const _auditGC193Time=audit;
audit=function(){const out=_auditGC193Time();out.grimCompanyTimeHotfix=GC193_TIME_HOTFIX;out.dailyIntelNeverTargetsExpiringContracts=true;return out};
window.__BL_AUDIT=audit;
