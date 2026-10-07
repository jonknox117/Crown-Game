/* Grim Company v21.7 — managed hiring, expedition approvals and accountability. */
let GC370_APPROVAL_BYPASS=null;
function gc370RecruitCandidate(r){
 const x=gc370Config(r),pool=state.regions[r]?.recruits||[];
 if(!['Balanced','Develop Roster'].includes(x?.priority)||localRoster(r).length>=Math.min(rosterCap(r),8)||!pool.length)return null;
 const leader=gc280Commander(r),t=gc370Talent(leader);
 const ranked=pool.slice().sort((a,b)=>{
  if(t.personnel||t.assessment){
   const rank=gc370Rank(b)-gc370Rank(a);if(rank)return rank;
  }
  return (b.lvl||1)-(a.lvl||1)||gc280CommandScore(b)-gc280CommandScore(a);
 });
 return ranked[0]||null;
}
function gc370Hire(r,id){
 const a=state.regions[r]?.recruits?.find(x=>x.id===id),leader=gc280Commander(r),x=gc370Config(r);
 if(!a||!leader||!x||localRoster(r).length>=Math.min(rosterCap(r),8))return false;
 const cost=gc201HireCost(a);
 if(state.company.silver<cost)return false;
 state.company.silver-=cost;state.regions[r].recruits=state.regions[r].recruits.filter(x=>x.id!==id);
 gc201MigrateAdventurer(a);a.dailyOrder='Train';state.roster.push(a);
 const p=x.performance;p.hires++;p.netSilver-=cost;
 pushHistory('Commander signed '+a.name+' for '+money(cost)+'.',r);
 gc370Record(r,'recruit',leader.name+' hired '+a.name+' (Lv.'+a.lvl+' '+gc360RankName(a)+') for '+money(cost)+'.');
 save();return true;
}
gc280MaybeRecruit=function(r){
 const a=gc370RecruitCandidate(r);if(!a)return null;
 const cost=gc201HireCost(a),x=gc370Config(r);
 if(state.company.silver<cost)return null;
 const approvalNeeded=x.authority==='All'||!gc370MaySpend(r,cost);
 if(approvalNeeded){
  gc370Ask(r,'hire',a.id,'Hire '+a.name+' (Lv.'+a.lvl+' '+gc360RankName(a)+')',cost,{targetId:a.id});
  return null;
 }
 return gc370Hire(r,a.id)?a:null;
};
function gc370Unassigned(r){
 const lead=gc280Commander(r),assigned=new Set(state.parties.flatMap(p=>p.members||[]));
 return state.roster.filter(a=>a.regionId===r&&a.status==='Ready'&&a.id!==state.company.founderId&&a.id!==lead?.id&&!assigned.has(a.id))
 .sort((a,b)=>gc370Rank(b)-gc370Rank(a)||(b.lvl||1)-(a.lvl||1));
}
function gc370SelectCaptain(p,r){
 const ms=partyMembers(p).filter(a=>a.status==='Ready');
 if(!ms.length){p.captainId=null;return}
 const lead=gc280Commander(r),t=gc370Talent(lead);
 if(t.personnel||t.assessment){
  ms.sort((a,b)=>gc370Rank(b)-gc370Rank(a)||gc280CommandScore(b)-gc280CommandScore(a));
  p.captainId=ms[0].id;
 }else if(!ms.some(a=>a.id===p.captainId)){
  p.captainId=ms[0].id;
 }
}
function gc370Charter(r){
 const commander=gc280Commander(r),x=gc370Config(r);
 let pool=gc370Unassigned(r);
 if(!commander||pool.length<2||state.parties.filter(p=>p.regionId===r).length>=8||state.company.silver<25)return false;
 const target=Math.min(partyCap(r),4+(hq(r).upgrades['Command Hall']>=3?1:0));
 const n=state.parties.filter(p=>p.regionId===r).length+1,p=makeParty(r,REGION_DEFS[r].culture+' Company '+n);
 p.members=[];while(p.members.length<target&&pool.length)p.members.push(pool.shift().id);
 gc370SelectCaptain(p,r);
 state.parties.push(p);state.company.silver-=25;
 x.performance.charters++;x.performance.netSilver-=25;
 gc370Record(r,'charter',commander.name+' chartered '+p.name+' for '+money(25)+'.');
 save();return true;
}
gc280BuildParties=function(r){
 const x=gc370Config(r),leader=gc280Commander(r);if(!x||!leader)return;
 let pool=gc370Unassigned(r);
 const target=Math.min(partyCap(r),4+(hq(r).upgrades['Command Hall']>=3?1:0));
 const idle=state.parties.filter(p=>p.regionId===r&&!p.expedition&&!p.members.includes(state.company.founderId));
 for(const p of idle){
  p.members=p.members.filter(id=>state.roster.some(a=>a.id===id&&a.status!=='Dead'));
  while(p.members.length<target&&pool.length)p.members.push(pool.shift().id);
  gc370SelectCaptain(p,r);
 }
 if(pool.length<2||state.parties.filter(p=>p.regionId===r).length>=8||state.company.silver<145)return;
 const requiresApproval=x.authority!=='Full'||!gc370MaySpend(r,25);
 if(requiresApproval){
  gc370Ask(r,'charter','new-party','Charter a new field party',25);
  return;
 }
 gc370Charter(r);
};
const _gc280DispatchGC370=gc280Dispatch;
gc280Dispatch=function(r,p,c){
 const x=gc370Config(r),lead=gc280Commander(r);
 if(!x||!lead||!p||!c||!gc280RiskAllowed(r,p,c.risk))return false;
 if(gc370NeedsDispatchApproval(r,c)){
  gc370Ask(r,'dispatch',p.id+':'+c.id,'Deploy '+p.name+' on Risk '+c.risk+' — '+c.title,0,{partyId:p.id,contractId:c.id,risk:c.risk});
  return false;
 }
 return gc370DispatchDirect(r,p,c);
};
function gc370DispatchDirect(r,p,c){
 const x=gc370Config(r),a=gc280Commander(r);if(!x||!a||!gc320PartyQualification(p,c).ok||p.expedition)return false;
 const t=gc370Talent(a);
 const result=_gc280DispatchGC370(r,p,c);
 if(result&&p.expedition){
  const e=p.expedition;
  e.gc370ManagerId=a.id;e.gc370RegionId=r;
  e.gc370Contingency=t.contingency;e.gc370AidKit=t.prep;
  e.gc370AidKitUsed=false;e.gc370RiskPolicy=x.risk;
  if(t.logistics){e.opening=(Number(e.opening)||0)+.10;e.events.push('An experienced commander arranged advance scouting before departure.')}
  if(t.prep)e.events.push('The commander issued an emergency treatment kit to the field crew.');
  x.performance.dispatches++;
  gc370Record(r,'dispatch',a.name+' ordered '+p.name+' into Risk '+c.risk+' ('+c.title+').');
 }
 return result;
}
function gc370ResolveRequest(r,id,approved){
 const x=gc370Config(r),a=gc280Commander(r);if(!x||!a)return false;
 const i=x.requests.findIndex(q=>q.id===id);if(i<0)return false;
 const q=x.requests[i];x.requests.splice(i,1);
 if(q.managerId!==a.id){gc370Record(r,'stale','An outdated request was discarded.');save();return false}
 if(!approved){x.performance.declines++;gc370Record(r,'declined','Declined: '+q.description);save();return true}
 let success=false;
 if(q.kind==='dispatch'){
  const p=state.parties.find(p=>p.id===q.partyId),c=contractById(q.contractId);
  if(p&&c&&gc280RiskAllowed(r,p,c.risk)&&!p.expedition)success=gc370DispatchDirect(r,p,c);
 }else if(q.kind==='hire'){
  const rec=state.regions[r]?.recruits?.find(a=>a.id===q.targetId);
  if(rec&&gc201HireCost(rec)<=state.company.silver)success=gc370Hire(r,q.targetId);
 }else if(q.kind==='charter')success=gc370Charter(r);
 if(success){x.performance.approvals++;gc370Record(r,'approved','Approved and executed: '+q.description)}
 else gc370Record(r,'stale','Could not execute: '+q.description+' (the circumstances changed).');
 save();render();return success;
}
const _gc280CommandActGC370=gc280CommandAct;
gc280CommandAct=function(r,force=false){
 const a=gc280Commander(r),x=gc370Config(r),t=gc370Talent(a);
 const first=_gc280CommandActGC370(r,force);
 if(!a||!x)return first;
 /* Veterans can supervise two independent contracts during one command cycle.
    Each expedition still uses its own crew, clocks and rarity qualification. */
 const extra=(t.master||t.coordination)?_gc280CommandActGC370(r,false):false;
 return first||extra;
};
const _gc280CommandTickGC370=gc280CommandTick;
gc280CommandTick=function(deltaDays){
 const out=_gc280CommandTickGC370(deltaDays);
 if(deltaDays>0&&gc280NetworkUnlocked())REGION_ORDER.forEach(r=>{
  const c=gc280CommandState(r),x=gc370Config(r);
  if(c?.autonomy&&c.commanderId)x.performance.days+=deltaDays;
 });
 return out;
};
const _gc193FinishNoTimeGC370=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,r=e?.gc370RegionId,managed=!!e?.gc370ManagerId;
 const oldSilver=state?.company?.silver||0,oldDeaths=p?.deaths||0;
 const result=_gc193FinishNoTimeGC370(p);
 if(managed){
  const x=gc370Config(r);
  if(x?.performance?.managerId===e.gc370ManagerId){
   x.performance.netSilver+=(state.company.silver-oldSilver);
   const deaths=Math.max(0,(p.deaths||0)-oldDeaths);
   if(deaths)gc370Record(r,'casualties',p.name+' suffered '+deaths+' deaths during a managed operation.');
   else gc370Record(r,'return',p.name+' returned from '+e.contract.title+'.');
  }
 }
 return result;
};
