/* Grim Company v21.1 — Freelancer Economy: persistent mercenary pool and full-contract freeblade crews. */
const GC310_VERSION='21.1';
const GC310_FOUNDING_REP=8;
const GC310_POOL_SIZE=12;
const GC310_CREW_BY_RISK={1:4,2:4,3:5,4:5,5:6};
const GC310_REP_REQUIREMENT={1:0,2:3,3:8,4:16,5:26};
const GC310_LEVEL_REQUIREMENT={1:1,2:4,3:8,4:13,5:18};

function gc310Freeblade(s=state){
 const p=gc270Progression(s),fb=p?.freeblade;if(!fb)return null;
 fb.gc310Version=GC310_VERSION;
 fb.reputation=Number(fb.reputation);
 if(!Number.isFinite(fb.reputation))fb.reputation=(Number(fb.successes)||0)*2;
 fb.fallenFreelancers=Array.isArray(fb.fallenFreelancers)?fb.fallenFreelancers:[];
 return fb;
}
function gc310RegionPool(regionId,s=state){
 const r=s?.regions?.[regionId];if(!r)return[];
 r.gc310Freelancers=Array.isArray(r.gc310Freelancers)?r.gc310Freelancers:[];
 return r.gc310Freelancers;
}
function gc310MakeFreelancer(regionId,targetLevel=1){
 const a=generateAdventurer(regionId),goal=clamp(Math.round(targetLevel)||1,1,GC194_MAX_LEVEL);
 while(a.lvl<goal)levelUp(a,false);
 a.hp=derived(a).maxHp;a.maxHp=Math.max(a.maxHp,a.hp);
 a.status='Freelancer';a.gc310Freelancer=true;a.gc310JobsWithFounder=Number(a.gc310JobsWithFounder)||0;
 a.gc310AvailableDay=Number(a.gc310AvailableDay)||1;
 a.history=a.history||[];a.history.push(`Day ${state.company.day}: working independently in ${REGION_DEFS[regionId].name}.`);
 return a;
}
function gc310RefreshFreelancerRecovery(a){
 if(!a)return a;
 if(a.status==='Dead')return a;
 const day=Number(state.company?.day)||1;
 if(Number(a.gc310RecoverUntil)>day)return a;
 if(Number(a.gc310RecoverUntil)>0){
  a.gc310RecoverUntil=0;a.injury=null;a.recovery=0;a.hp=derived(a).maxHp;
 }
 a.status='Freelancer';return a;
}
function gc310EnsurePool(regionId){
 const pool=gc310RegionPool(regionId),f=gc260Founder(),base=Math.max(1,Math.min(6,(f?.lvl||1)+1));
 pool.forEach(gc310RefreshFreelancerRecovery);
 for(let i=pool.length;i<GC310_POOL_SIZE;i++)pool.push(gc310MakeFreelancer(regionId,clamp(base+rnd(-1,1),1,8)));
 return pool;
}
function gc310KnownFreelancer(id,regionId=null){
 const ids=regionId?[regionId]:REGION_ORDER;
 for(const rid of ids){const a=gc310RegionPool(rid).find(x=>x.id===id);if(a)return a}
 return null;
}
function gc310ClientValue(c,pay=null){
 const companyNet=Number(pay==null?c?.reward:pay)||0;
 return Math.max(companyNet,Math.round(companyNet/.62));
}
function gc310CrewSize(c){return GC310_CREW_BY_RISK[clamp(Number(c?.risk)||1,1,5)]||4}
function gc310ShareFromPay(c,pay,crewSize=gc310CrewSize(c)){
 const client=gc310ClientValue(c,pay);
 return Math.max(1,Math.round(client*.80/Math.max(1,crewSize)));
}
function gc310Eligibility(c,f=gc260Founder()){
 const risk=clamp(Number(c?.risk)||1,1,5),fb=gc310Freeblade(),lvl=f?.lvl||1,rep=fb?.reputation||0;
 const minLevel=GC310_LEVEL_REQUIREMENT[risk],minRep=GC310_REP_REQUIREMENT[risk];
 return{ok:lvl>=minLevel&&rep>=minRep,risk,minLevel,minRep,lvl,rep};
}
function gc310FreebladeContracts(){
 const fb=gc310Freeblade(),rid=fb?.startRegion||state.currentRegion;
 return gc250EnsureRiskBoard(rid).slice().sort((a,b)=>a.risk-b.risk);
}
function gc310UpgradeFreebladeState(){
 if(!state||!gc270IsFreeblade())return;
 const fb=gc310Freeblade(),rid=fb.startRegion||state.currentRegion,p=gc260FounderParty(),f=gc260Founder();
 fb.jobs=[];
 state.currentRegion=rid;
 gc250EnsureRiskBoard(rid);gc310EnsurePool(rid);
 if(p){
  p.name='Open Contract Crew';
  p.members=[f?.id].filter(Boolean);p.captainId=null;
 }
 if(f){
  f.history=f.history||[];
  if(!f.history.some(x=>String(x).includes('independent mercenary')))f.history.push(`Day ${state.company.day}: began taking contracts as an independent mercenary.`);
 }
}
const _gc270CreateFreebladeStateGC310=gc270CreateFreebladeState;
gc270CreateFreebladeState=function(regionId,opts){
 const s=_gc270CreateFreebladeStateGC310(regionId,opts);
 gc310UpgradeFreebladeState();return s;
};

function gc310AvailablePool(regionId,risk){
 const benchmark=gc194RiskLevel(risk),day=Number(state.company.day)||1;
 const pool=gc310EnsurePool(regionId);
 pool.forEach(gc310RefreshFreelancerRecovery);
 return pool.filter(a=>a.status!=='Dead'&&Number(a.gc310RecoverUntil||0)<=day).sort((a,b)=>{
  const ar=Math.abs((a.lvl||1)-benchmark),br=Math.abs((b.lvl||1)-benchmark);
  if(ar!==br)return ar-br;
  const relA=relValue(state.company.founderId,a.id),relB=relValue(state.company.founderId,b.id);
  if(relA!==relB)return relB-relA;
  return (b.gc310JobsWithFounder||0)-(a.gc310JobsWithFounder||0);
 });
}
function gc310TakeFromPool(regionId,a){
 const pool=gc310RegionPool(regionId),i=pool.findIndex(x=>x.id===a.id);
 if(i>=0)pool.splice(i,1);
 a.status='Ready';a.gc310Temporary=true;a.regionId=regionId;
 if(!state.roster.some(x=>x.id===a.id))state.roster.push(a);
 return a;
}
function gc310AssembleCrew(c,p){
 const f=gc260Founder(),rid=c.regionId,risk=Number(c.risk)||1,need=Math.max(1,gc310CrewSize(c)-1),benchmark=gc194RiskLevel(risk);
 if(!f||!p)return[];
 p.members=[f.id];p.captainId=null;
 let candidates=gc310AvailablePool(rid,risk);
 while(candidates.length<need){
  const newcomer=gc310MakeFreelancer(rid,clamp(benchmark+rnd(-1,1),1,GC194_MAX_LEVEL));
  gc310RegionPool(rid).push(newcomer);candidates=gc310AvailablePool(rid,risk);
 }
 const chosen=candidates.slice(0,need).map(a=>gc310TakeFromPool(rid,a));
 chosen.forEach(a=>p.members.push(a.id));
 const lead=chosen.slice().sort((a,b)=>(b.lvl||1)-(a.lvl||1)||derived(b).combat.resolve-derived(a).combat.resolve)[0];
 p.captainId=lead?.id||f.id;
 return chosen;
}
function gc310ReturnFreelancers(p,ids,regionId){
 const fb=gc310Freeblade(),pool=gc310RegionPool(regionId);
 (ids||[]).forEach(id=>{
  const a=state.roster.find(x=>x.id===id);if(!a)return;
  a.gc310Temporary=false;a.gc310JobsWithFounder=(Number(a.gc310JobsWithFounder)||0)+1;
  if(a.status==='Dead'){
   if(fb&&!fb.fallenFreelancers.some(x=>x.id===a.id))fb.fallenFreelancers.push({id:a.id,name:a.name,day:state.company.day,lvl:a.lvl});
  }else{
   if(a.status==='Recovering'||a.injury){
    a.gc310RecoverUntil=state.company.day+Math.max(1,Number(a.recovery)||2);
   }else a.gc310RecoverUntil=0;
   a.status='Freelancer';
   if(!pool.some(x=>x.id===a.id))pool.push(a);
  }
 });
 state.roster=state.roster.filter(a=>!(ids||[]).includes(a.id));
 if(p){
  const f=gc260Founder();p.members=f&&f.status!=='Dead'?[f.id]:[];p.captainId=null;
 }
}
function gc310KnownAvailableForRecruit(regionId){
 const day=Number(state.company.day)||1;
 return gc310RegionPool(regionId).filter(a=>a.status!=='Dead'&&Number(a.gc310RecoverUntil||0)<=day&&Number(a.gc310JobsWithFounder||0)>0);
}
const _refreshRecruitsGC310=refreshRecruits;
refreshRecruits=function(regionId){
 const out=_refreshRecruitsGC310(regionId);
 if(state&&gc270IsCompany()){
  const r=state.regions[regionId],known=gc310KnownAvailableForRecruit(regionId).sort((a,b)=>(b.gc310JobsWithFounder||0)-(a.gc310JobsWithFounder||0)||relValue(state.company.founderId,b.id)-relValue(state.company.founderId,a.id)).slice(0,3);
  known.forEach(a=>{if(!r.recruits.some(x=>x.id===a.id)){a.status='Ready';r.recruits.unshift(a)}});
 }
 return out;
};
const _hireRecruitGC310=hireRecruit;
hireRecruit=function(id){
 const known=gc310KnownFreelancer(id,state.currentRegion),before=state.roster.some(x=>x.id===id),out=_hireRecruitGC310(id),after=state.roster.some(x=>x.id===id);
 if(!before&&after&&known){
  state.regions[state.currentRegion].gc310Freelancers=gc310RegionPool(state.currentRegion).filter(x=>x.id!==id);
  const a=state.roster.find(x=>x.id===id);if(a){a.gc310Freelancer=false;a.gc310Temporary=false;a.history=a.history||[];a.history.push(`Day ${state.company.day}: signed with ${state.company.name} after ${a.gc310JobsWithFounder||0} contract(s) alongside the Founder.`)}
  save();
 }
 return out;
};
