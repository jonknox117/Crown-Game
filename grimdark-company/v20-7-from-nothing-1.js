/* Grim Company v20.7 — From Nothing, core state and freeblade work. */
const GC270_VERSION='20.7';
const GC270_FOUNDING_COST=60;
const GC270_REQUIRED_WINS=3;
const GC270_STARTING_SILVER=18;
const GC270_JOB_COUNT=3;

function gc270Progression(s=state){
 if(!s)return null;
 s.progression=s.progression||{};
 const p=s.progression;
 p.version=GC270_VERSION;
 if(!p.phase)p.phase='company';
 p.freeblade=p.freeblade||{};
 p.freeblade.jobs=Array.isArray(p.freeblade.jobs)?p.freeblade.jobs:[];
 p.freeblade.completed=Number(p.freeblade.completed)||0;
 p.freeblade.successes=Number(p.freeblade.successes)||0;
 p.freeblade.failures=Number(p.freeblade.failures)||0;
 p.freeblade.startRegion=p.freeblade.startRegion||s.currentRegion||'veyric';
 p.freeblade.foundingCost=GC270_FOUNDING_COST;
 p.freeblade.requiredWins=GC270_REQUIRED_WINS;
 return p;
}
function gc270IsFreeblade(s=state){return gc270Progression(s)?.phase==='freeblade'}
function gc270IsCompany(s=state){return!!s&&!gc270IsFreeblade(s)}
function gc270EstablishedCount(s=state){return REGION_ORDER.filter(id=>s?.regions?.[id]?.hq?.established).length}
function gc270InitState(s=state,loaded=false){
 if(!s)return s;
 const existed=!!s.progression,p=gc270Progression(s);
 if(!existed&&loaded)p.phase='company';
 if(!['freeblade','company','network'].includes(p.phase))p.phase='company';
 return s;
}
const _normalizeStateGC270=normalizeState;
normalizeState=function(s){return gc270InitState(_normalizeStateGC270(s),true)};
const _createStateGC270=createState;
createState=function(name,startRegion='veyric'){return gc270InitState(_createStateGC270(name,startRegion),false)};

const GC270_JOB_TEMPLATES=[
 {titles:['A Wolf at the Fence','Teeth in the Barley','Something in the Sheepfold'],type:'Hunt',check:'scout',days:1,desc:'Farmers are paying one sword to find what has been taking livestock before it comes closer to the houses.'},
 {titles:['The Missing Shepherd','Gone Beyond the Marker','Someone Did Not Come Home'],type:'Rescue',check:'scout',days:1,desc:'Someone is missing outside the safe roads. Find them, or find enough to tell the family what happened.'},
 {titles:['Medicine Through Rain','A Sack of Bitterroot','The Fever Road'],type:'Caravan',check:'endure',days:1,desc:'A small delivery has to cross bad country quickly. The pay is poor, but people are waiting on the other end.'},
 {titles:['The Cellar Thing','Scratching Under the Floor','The Locked Root Cellar'],type:'Investigation',check:'occult',days:1,desc:'A household swears something beneath the building is not an animal. They want one adventurer to prove them wrong.'},
 {titles:['A Quiet Debt','Words at the Tollhouse','Settle It Without Knives'],type:'Negotiation',check:'talk',days:1,desc:'Two sides are close to violence. Someone armed, neutral and capable of talking is worth a few silver today.'},
 {titles:['One Lookout Watching','Smoke Above the Cut','The Roadside Lookout'],type:'Investigation',check:'sneak',days:1,desc:'A lookout has been marking travelers for a larger gang. Deal with the problem before the gang learns the road is profitable.'},
 {titles:['Night Watch for Hire','One Bad Night','Keep the Lamps Lit'],type:'Defense',check:'endure',days:1,desc:'A frightened household wants a professional awake between them and whatever has been circling after dark.'},
 {titles:['Tracks by the Old Milepost','The Broken Cart','Marks on the North Road'],type:'Investigation',check:'scout',days:2,desc:'There is evidence of trouble on an old road. Follow it far enough to learn what happened and come back.'}
];
function gc270MakeFreebladeJob(regionId,used=[]){
 const t=pick(GC270_JOB_TEMPLATES),base=gc250FreshContractForRisk(regionId,1,used);
 base.id=uid('solo');base.title=pick(t.titles);base.type=t.type;base.check=t.check;base.desc=t.desc;base.risk=1;base.enemyCount=1;base.unknown=chance(.35)?1:0;base.gcDuration=t.days;base.reward=rnd(14,22);base.expires=999999;base.gc270Freeblade=true;base.gc194Economy=GC194_VERSION;gc193EnsureContract(base);return base;
}
function gc270EnsureJobs(s=state){
 if(!s||!gc270IsFreeblade(s))return[];
 const fb=gc270Progression(s).freeblade,used=fb.jobs.map(x=>x.title);
 while(fb.jobs.length<GC270_JOB_COUNT){const j=gc270MakeFreebladeJob(fb.startRegion,used);fb.jobs.push(j);used.push(j.title)}
 if(fb.jobs.length>GC270_JOB_COUNT)fb.jobs=fb.jobs.slice(0,GC270_JOB_COUNT);
 return fb.jobs;
}
function gc270StarterGear(f){
 f.gear.weapon={id:uid('i'),name:'Secondhand Field Weapon',slot:'weapon',rarity:0,mods:[{id:'gc270-edge',label:'+2 Attack',value:2,effect:{attack:2}}],baseValue:6,_gc194Power:true};
 f.gear.armor={id:uid('i'),name:'Patched Travel Gear',slot:'armor',rarity:0,mods:[{id:'gc270-hide',label:'+2 Guard',value:2,effect:{guard:2}}],baseValue:6,_gc194Power:true};
}
function gc270CreateFreebladeState(regionId,opts){
 state=createState('Unaffiliated',regionId);
 REGION_ORDER.forEach(id=>{const r=state.regions[id];r.hq.established=false;Object.keys(r.hq.upgrades||{}).forEach(k=>r.hq.upgrades[k]=0)});
 state.currentRegion=regionId;state.company.name='Unaffiliated';state.company.silver=GC270_STARTING_SILVER;state.company.renown=0;state.roster=[];state.parties=[makeParty(regionId,'Lone Road')];
 const f=gc260CreateFounderRecord(regionId,opts,true);f.dailyOrder='Recover';f.history=[`Day ${state.company.day}: began taking work alone in ${REGION_DEFS[regionId].name}.`];gc270StarterGear(f);
 const p=gc270Progression();p.phase='freeblade';p.freeblade={jobs:[],completed:0,successes:0,failures:0,startRegion:regionId,foundingCost:GC270_FOUNDING_COST,requiredWins:GC270_REQUIRED_WINS};gc260System().location=regionId;state.ui.tab='you';gc270EnsureJobs();return state;
}

const _contractByIdGC270=contractById;
contractById=function(id){if(gc270IsFreeblade()){const j=gc270Progression().freeblade.jobs.find(x=>x.id===id);if(j)return j}return _contractByIdGC270(id)};
const _gc201ContactRateGC270=gc201ContactRate;
gc201ContactRate=function(p){const v=_gc201ContactRateGC270(p);return p?.expedition?.contract?.gc270Freeblade?clamp(v*.68,.015,.72):v};
const _dispatchContractGC270=dispatchContract;
dispatchContract=function(cid,pid){
 const free=gc270IsFreeblade()&&gc270Progression().freeblade.jobs.some(x=>x.id===cid);
 if(free){const f=gc260Founder(),p=state.parties.find(x=>x.id===pid);if(!f||!p||p.members.length!==1||p.members[0]!==f.id)return toast('Freeblade work is taken alone.')}
 const out=_dispatchContractGC270(cid,pid);
 if(free){const fb=gc270Progression().freeblade;fb.jobs=fb.jobs.filter(x=>x.id!==cid);gc270EnsureJobs();state.ui.tab='jobs';save();render()}
 return out;
};
const _gc193FinishNoTimeGC270=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,free=!!(gc270IsFreeblade()&&e?.contract?.gc270Freeblade),won=free?(e.battleWon!==false):false,title=e?.contract?.title;
 const out=_gc193FinishNoTimeGC270(p);
 if(free){const fb=gc270Progression().freeblade;fb.completed++;if(won)fb.successes++;else fb.failures++;const f=gc260Founder();if(f){f.history=f.history||[];f.history.push(`Day ${state.company.day}: ${won?'completed':'failed'} freeblade job ${title}.`)}gc270EnsureJobs();gc199RecordFeed(`FREEBLADE — ${title}: ${won?'job completed':'job failed'}.`,'field');save();render()}
 return out;
};
function gc270FoundingReady(){
 const fb=gc270Progression().freeblade,f=gc260Founder();
 return!!(gc270IsFreeblade()&&f&&f.status==='Ready'&&!gc260FounderParty()?.expedition&&fb.successes>=GC270_REQUIRED_WINS&&state.company.silver>=GC270_FOUNDING_COST);
}
function gc270FoundCompany(name){
 if(!gc270FoundingReady())return false;
 name=String(name||'').trim();if(name.length<2){toast('Give the company a name.');return false}
 const p=gc270Progression(),fb=p.freeblade,f=gc260Founder(),rid=f.regionId;
 state.company.silver-=GC270_FOUNDING_COST;state.company.name=name;state.regions[rid].hq.established=true;state.regions[rid].hq.upgrades.Barracks=Math.max(1,state.regions[rid].hq.upgrades.Barracks||0);p.phase='company';p.foundedDay=state.company.day;p.foundedRegion=rid;
 const party=gc260FounderParty();if(party){party.name=`${REGION_DEFS[rid].culture} First Company`;party.captainId=f.id}
 f.history.push(`Day ${state.company.day}: founded ${name} after ${fb.successes} successful freeblade jobs.`);refreshRegion(rid,true);pushHistory(`${f.name} founded ${name} at ${state.regions[rid].hq.name}.`,rid);gc199RecordFeed(`${name} was founded by ${f.name}.`,'history');state.currentRegion=rid;state.ui.tab='hq';closeModal();sfx('success');save();render();toast(`${name} is open for business.`);return true;
}
