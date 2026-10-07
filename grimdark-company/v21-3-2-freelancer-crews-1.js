/* Grim Company v21.3.2 — Freelancer Crew Fix.
   A freelancer is not a permanent party leader. Every personal freelance contract
   assembles a fresh, healthy temporary crew from the wider regional market. */
const GC332_VERSION='21.3.2';
const GC332_RECENT_LIMIT=10;

function gc332RecentIds(){
 const fs=gc260System();
 fs.gc332RecentFreelancers=Array.isArray(fs.gc332RecentFreelancers)?fs.gc332RecentFreelancers:[];
 return fs.gc332RecentFreelancers;
}
function gc332RememberCrew(ids){
 const fs=gc260System(),next=[...gc332RecentIds(),...(ids||[])];
 fs.gc332RecentFreelancers=[...new Set(next.slice(-GC332_RECENT_LIMIT))];
}
function gc332Healthy(a){
 if(!a||a.status==='Dead')return false;
 const max=derived(a).maxHp;
 return !a.injury&&!(Number(a.recovery)>0)&&!(Number(a.gc310RecoverUntil)>Number(state.company.day||1))&&(Number(a.hp)||0)>=max-.01;
}
function gc332PrepareFreelancer(a){
 const max=derived(a).maxHp;
 a.hp=max;a.maxHp=Math.max(Number(a.maxHp)||0,max);
 a.injury=null;a.recovery=0;a.gc310RecoverUntil=0;a.gc320PendingRecovery=false;
 a.status='Freelancer';
 return a;
}
function gc332Shuffle(arr){
 const out=arr.slice();
 for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=out[i];out[i]=out[j];out[j]=t}
 return out;
}
function gc332EligibleFreshPool(regionId,risk){
 const benchmark=gc320RiskLevel(risk),recent=new Set(gc332RecentIds());
 gc310EnsurePool(regionId);
 return gc332Shuffle(gc310RegionPool(regionId).filter(a=>gc332Healthy(a)&&(a.lvl||1)>=Math.max(1,benchmark-1)&&!recent.has(a.id)));
}

/* Fresh crew selection replaces the old "best relationship / most jobs with founder"
   sort that kept feeding the player the same three people. */
gc310AssembleCrew=function(c,p){
 const f=gc260Founder(),rid=c.regionId,risk=Number(c.risk)||1,need=Math.max(1,gc310CrewSize(c)-1),benchmark=gc320RiskLevel(risk);
 if(!f||!p)return[];
 p.members=[f.id];p.captainId=null;
 let candidates=gc332EligibleFreshPool(rid,risk);
 while(candidates.length<need){
  const newcomer=gc310MakeFreelancer(rid,clamp(benchmark+rnd(-1,2),1,GC194_MAX_LEVEL));
  gc332PrepareFreelancer(newcomer);
  gc310RegionPool(rid).push(newcomer);
  candidates=gc332EligibleFreshPool(rid,risk);
 }
 const chosen=candidates.slice(0,need).map(a=>gc310TakeFromPool(rid,gc332PrepareFreelancer(a)));
 chosen.forEach(a=>p.members.push(a.id));
 const lead=chosen.slice().sort((a,b)=>(b.lvl||1)-(a.lvl||1)||derived(b).combat.resolve-derived(a).combat.resolve)[0];
 p.captainId=lead?.id||f.id;
 gc332RememberCrew(chosen.map(a=>a.id));
 return chosen;
};

function gc332HoldingParty(f=gc260Founder()){
 if(!f)return null;
 let p=state.parties.find(x=>x.gc332FreebladeHolding)||state.parties.find(x=>!x.expedition&&x.members?.includes(f.id)&&!x.gc320IndependentCrew&&!x.gc332EphemeralFreelance);
 if(!p){
  p=makeParty(f.regionId,'Unaffiliated');
  p.gc332FreebladeHolding=true;p.members=[f.id];p.captainId=null;state.parties.push(p);
 }else{
  p.gc332FreebladeHolding=true;p.name='Unaffiliated';
 }
 return p;
}
function gc332RestoreFounderHome(temp){
 const f=gc260Founder(),homeId=temp?.gc332HoldingPartyId;
 state.parties=state.parties.filter(x=>x.id!==temp?.id);
 if(!f||f.status==='Dead')return;
 let home=homeId?state.parties.find(x=>x.id===homeId):null;
 if(!home)home=gc332HoldingParty(f);
 if(home&&!home.members.includes(f.id))home.members=[f.id];
 if(home)home.captainId=null;
}
function gc332CreateFreelanceCrew(c){
 const f=gc260Founder(),home=gc332HoldingParty(f);
 if(home?.expedition)return null;
 if(home)home.members=home.members.filter(id=>id!==f.id);
 const p=makeParty(c.regionId,'Freelance Contract Crew');
 p.gc332EphemeralFreelance=true;p.gc332HoldingPartyId=home?.id||null;p.members=[f.id];p.captainId=null;
 state.parties.push(p);
 return p;
}

/* Pre-company freelance work now creates a disposable crew object for the contract
   instead of mutating and reusing the same pseudo-party forever. */
gc310AcceptContract=function(cid){
 if(!state||!gc270IsFreeblade())return;
 const c=contractById(cid),f=gc260Founder();
 if(!c||!f)return toast('That contract is no longer available.');
 if(f.status!=='Ready'||state.parties.some(p=>p.gc332EphemeralFreelance&&p.expedition))return toast('You are not available for another contract yet.');
 const gate=gc310Eligibility(c,f);
 if(!gate.ok)return toast(`Need Level ${gate.minLevel} and ${gate.minRep} Freeblade Reputation for Risk ${gate.risk}.`);
 const p=gc332CreateFreelanceCrew(c);if(!p)return toast('Your freelance contract record is busy.');
 const crew=gc310AssembleCrew(c,p),tempIds=crew.map(a=>a.id);
 p.tactic='Balanced';p.cohesion=0;
 const out=dispatchContract(cid,p.id);
 if(!p.expedition){
  gc310ReturnFreelancers(p,tempIds,c.regionId);gc332RestoreFounderHome(p);return out;
 }
 p.expedition.gc310Freelance=true;p.expedition.gc332EphemeralFreelance=true;
 p.expedition.gc310TemporaryIds=tempIds;p.expedition.gc310CrewNames=[f.name,...crew.map(a=>a.name)];
 p.expedition.gc310CrewSize=p.members.length;p.expedition.gc310ClientValue=gc310ClientValue(c);
 p.expedition.events.unshift(`A fresh freelance crew was assembled for this contract: ${p.expedition.gc310CrewNames.join(', ')}.`);
 state.ui.tab='jobs';save();render();return out;
};

/* After the contract resolves, throw away the temporary crew container and return
   the player to being unaffiliated rather than carrying the crew forward. */
const _gc193FinishNoTimeGC332=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const ephemeral=!!p?.gc332EphemeralFreelance,homeId=p?.gc332HoldingPartyId,pid=p?.id;
 const out=_gc193FinishNoTimeGC332(p);
 if(ephemeral){
  const temp=state.parties.find(x=>x.id===pid)||{id:pid,gc332HoldingPartyId:homeId};
  gc332RestoreFounderHome(temp);save();render();
 }
 return out;
};

/* Loaded freeblade saves are migrated to the holding-record model without changing
   the founder or save identity. */
const _normalizeStateGC332=normalizeState;
normalizeState=function(s){
 s=_normalizeStateGC332(s);
 if(s&&gc270IsFreeblade(s)){
  const f=s.roster?.find(a=>a.id===s.company?.founderId);
  if(f&&!s.parties.some(p=>p.gc332EphemeralFreelance&&p.expedition)){
   let home=s.parties.find(p=>p.members?.includes(f.id));
   if(home){home.gc332FreebladeHolding=true;home.name='Unaffiliated';home.members=[f.id];home.captainId=null}
  }
 }
 return s;
};
