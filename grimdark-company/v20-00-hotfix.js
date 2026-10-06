/* Grim Company v20.00.1 — shared scouting + immediate UI refresh hotfix. */
const GC200_HOTFIX='20.00.1';

function gc200SharedScoutInit(s=state){
 if(!s)return s;
 Object.values(s.regions||{}).forEach(r=>{
   if(r.gc200ScoutTarget==null)r.gc200ScoutTarget=null;
   (r.contracts||[]).forEach(c=>{
     gc193EnsureContract(c);
     if(!Number.isFinite(Number(c.gc200ScoutProgress)))c.gc200ScoutProgress=0;
   });
 });
 /* Migrate any in-progress v20.00 individual scout meters into the shared meter.
    Use the furthest existing meter rather than summing them so loading this hotfix
    cannot grant a free breakthrough to saves with several scouts already working. */
 (s.roster||[]).forEach(a=>{
   const w=gc200Work(a),old=clamp(Number(w.scoutProgress)||0,0,.9999);
   if(old>0&&w.scoutTarget){
     const c=s.regions?.[a.regionId]?.contracts?.find(x=>x.id===w.scoutTarget);
     if(c)c.gc200ScoutProgress=Math.max(Number(c.gc200ScoutProgress)||0,old);
   }
   w.scoutProgress=0;
 });
 return s;
}

const _normalizeStateGC200Hotfix=normalizeState;
normalizeState=function(s){s=_normalizeStateGC200Hotfix(s);return gc200SharedScoutInit(s)};
const _createStateGC200Hotfix=createState;
createState=function(name,startRegion='veyric'){return gc200SharedScoutInit(_createStateGC200Hotfix(name,startRegion))};

function gc200SharedScoutTarget(regionId){
 const r=state.regions[regionId];if(!r)return null;
 const unfinished=c=>c&&((Number(c.gcIntel)||0)<2||(Number(c.unknown)||0)>0);
 let c=(r.contracts||[]).find(x=>x.id===r.gc200ScoutTarget&&unfinished(x));
 if(!c){
   c=(r.contracts||[]).map(gc193EnsureContract).filter(unfinished).sort((x,y)=>(y.unknown||0)-(x.unknown||0)||(x.gcIntel||0)-(y.gcIntel||0)||(y.risk||0)-(x.risk||0))[0]||null;
   r.gc200ScoutTarget=c?.id||null;
 }
 if(c&&!Number.isFinite(Number(c.gc200ScoutProgress)))c.gc200ScoutProgress=0;
 return c;
}

function gc200ResolveScoutTeam(regionId,scouts,c){
 if(!c||!scouts.length)return;
 const scored=scouts.map(a=>{const d=derived(a),score=d.util.scout+d.combat.speed*.25;return{a,score}}).sort((x,y)=>y.score-x.score),lead=scored[0];
 const gain=lead.score>=42?2:1,beforeIntel=Number(c.gcIntel)||0,beforeUnknown=Number(c.unknown)||0;
 c.gcIntel=Math.min(2,beforeIntel+gain);
 c.unknown=Math.max(0,beforeUnknown-gain);
 c.gcScoutEdge=Math.max(Number(c.gcScoutEdge)||0,Math.min(.14,.04+Math.max(0,lead.score-15)/210+Math.min(.03,(scouts.length-1)*.008)));
 scouts.forEach(a=>{
   grantXP(a,2+gain);
   const v=bl18InitAdventurer(a).veteran;v.behavior.fieldcraft++;
   if(typeof bl18MaybeTraits==='function')bl18MaybeTraits(a);
 });
 const names=scouts.map(a=>a.name.split(' ')[0]).join(', ');
 gc199RecordFeed(`${names} completed a shared scouting breakthrough on ${c.title}: intel ${beforeIntel}→${c.gcIntel}, unknowns ${beforeUnknown}→${c.unknown}.`,'scout');
 if(c.gcIntel>=2&&(c.unknown||0)<=0){
   const r=state.regions[regionId];r.gc200ScoutTarget=null;c.gc200ScoutProgress=0;
   scouts.forEach(a=>gc200Work(a).scoutTarget=null);
 }
}

function gc200ScoutingRegionTick(regionId,deltaDays){
 if(deltaDays<=0)return;
 const scouts=state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.dailyOrder==='Scout');
 if(!scouts.length)return;
 const c=gc200SharedScoutTarget(regionId);if(!c)return;
 scouts.forEach(a=>{const w=gc200Work(a);w.scoutTarget=c.id;w.scoutProgress=0});
 const combined=scouts.reduce((sum,a)=>sum+gc200ScoutRate(a),0);
 c.gc200ScoutProgress=(Number(c.gc200ScoutProgress)||0)+combined*deltaDays;
 let guard=0;
 while(c.gc200ScoutProgress>=1&&guard++<4){
   c.gc200ScoutProgress-=1;
   gc200ResolveScoutTeam(regionId,scouts,c);
   if(c.gcIntel>=2&&(c.unknown||0)<=0)break;
 }
}

/* v20.00 gave every scout a private breakthrough meter. Disable that path and
   resolve one shared regional meter after the rest of the continuous work tick. */
const _gc200ContinuousWorkSharedScout=gc200ContinuousWork;
gc200ScoutingTick=function(){};
gc200ContinuousWork=function(deltaDays){
 _gc200ContinuousWorkSharedScout(deltaDays);
 REGION_ORDER.forEach(id=>gc200ScoutingRegionTick(id,deltaDays));
};

const _gc200WorkSnapshotSharedScout=gc200WorkSnapshot;
gc200WorkSnapshot=function(a){
 if(a?.status==='Ready'&&a.dailyOrder==='Scout'){
   const c=gc200SharedScoutTarget(a.regionId),r=state.regions[a.regionId],team=state.roster.filter(x=>x.regionId===a.regionId&&x.status==='Ready'&&x.dailyOrder==='Scout');
   if(!c)return{label:'SCOUTING',detail:'No contract needs intel',pct:0};
   const pct=clamp((Number(c.gc200ScoutProgress)||0)*100,0,100);
   return{label:'SCOUTING',detail:`${c.title} • ${team.length} scout${team.length===1?'':'s'} contributing • ${Math.round(pct)}% to shared breakthrough`,pct};
 }
 return _gc200WorkSnapshotSharedScout(a);
};

/* State-changing buttons must update the visible screen immediately. The old
   implementations correctly changed state but some only called renderVault(),
   which returns markup instead of mounting it. */
const _sellInventoryGC200Hotfix=sellInventory;
sellInventory=function(itemId){
 const existed=!!localInventory().find(x=>x.item.id===itemId),out=_sellInventoryGC200Hotfix(itemId);
 if(existed)render();
 return out;
};
const _openCacheGC200Hotfix=openCache;
openCache=function(id){
 const existed=!!state.caches.find(x=>x.id===id),out=_openCacheGC200Hotfix(id);
 if(existed)render();
 return out;
};

const _auditGC200Hotfix=audit;
audit=function(){const out=_auditGC200Hotfix();out.helloWorldHotfix=GC200_HOTFIX;out.sharedScoutingBreakthroughs=true;out.immediateMutationRerender=true;return out};
window.__BL_AUDIT=audit;
