/* Grim Company v21.0 — Veteran Legacy: structured careers, titles, scars and accomplishments. */
const GC300_VERSION='21.0';

const GC300_SCARS={
 'One-Eyed':{desc:'A lost eye became part of the legend.',combat:{accuracy:-2,resolve:2}},
 'Mended Hand':{desc:'A hand never healed quite straight.',combat:{attack:-1},util:{endure:2}},
 'Burned':{desc:'Old burns remain visible long after the pain faded.',combat:{resolve:3},util:{talk:-1}},
 'Bad Leg':{desc:'The gait is permanent; so is the endurance it taught.',combat:{speed:-2},util:{endure:2}},
 'Split Brow':{desc:'A hard scar with no meaningful penalty.',combat:{resolve:1}},
 'Bite Marks':{desc:'Something once got close enough to leave proof.',util:{scout:2}}
};

function gc300Legacy(a){
 if(!a)return null;
 a.gc300Legacy=a.gc300Legacy||{};
 const l=a.gc300Legacy;
 l.version=GC300_VERSION;
 const nums=['contracts','wins','failures','risk5','campaignOps','campaigns','bossKills','injuries','nearDeaths','fieldSuccess','fieldFailure','captainMissions','commandDays','withFounder'];
 nums.forEach(k=>l[k]=Number(l[k])||0);
 l.contracts=Math.max(l.contracts,Number(a.missions)||0);
 l.regions=l.regions&&typeof l.regions==='object'?l.regions:{};
 l.parties=l.parties&&typeof l.parties==='object'?l.parties:{};
 l.legendaryItems=l.legendaryItems&&typeof l.legendaryItems==='object'?l.legendaryItems:{};
 l.accomplishments=Array.isArray(l.accomplishments)?l.accomplishments:[];
 l.titles=Array.isArray(l.titles)?l.titles:[];
 l.scars=Array.isArray(l.scars)?l.scars:[];
 l.bosses=Array.isArray(l.bosses)?l.bosses:[];
 if(!l.activeTitle&&l.titles.length)l.activeTitle=l.titles[l.titles.length-1];
 return l;
}
function gc300Accomplishment(a,id,name,desc,title=null){
 const l=gc300Legacy(a);if(l.accomplishments.some(x=>x.id===id))return false;
 l.accomplishments.push({id,name,desc,day:state?.company?.day||1});
 if(title)gc300EarnTitle(a,title,desc);
 a.history=a.history||[];a.history.push(`Day ${state?.company?.day||1}: earned ${name}.`);
 if(state&&typeof gc199RecordFeed==='function')gc199RecordFeed(`${a.name} earned ${name}.`,'legacy');
 return true;
}
function gc300EarnTitle(a,title,reason=''){
 const l=gc300Legacy(a);if(!title||l.titles.includes(title))return false;
 l.titles.push(title);l.activeTitle=title;
 a.history=a.history||[];a.history.push(`Day ${state?.company?.day||1}: became known as ${title}${reason?' — '+reason:''}.`);
 if(state&&typeof gc199RecordFeed==='function')gc199RecordFeed(`${a.name} is now known as ${title}.`,'legacy');
 return true;
}
function gc300Evaluate(a){
 const l=gc300Legacy(a);
 if(l.contracts>=10)gc300Accomplishment(a,'proven','Proven Hand','Completed ten contracts.');
 if(l.contracts>=25)gc300Accomplishment(a,'road-veteran','Veteran of the Road','Completed twenty-five contracts.','Road Veteran');
 if(l.contracts>=60)gc300Accomplishment(a,'old-hand','Old Hand','Completed sixty contracts.','Old Hand');
 if(l.risk5>=5)gc300Accomplishment(a,'riskbreaker','Riskbreaker','Survived five Risk 5 contracts.','Riskbreaker');
 if(l.campaigns>=3)gc300Accomplishment(a,'campaign-hardened','Campaign Hardened','Completed three full regional Campaigns.','Campaigner');
 if(l.bossKills>=1)gc300Accomplishment(a,'boss-slayer','Boss Slayer','Was present for the defeat of a named Campaign antagonist.','Boss-Slayer');
 if(l.bossKills>=3)gc300Accomplishment(a,'bane-maker','Bane-Maker','Helped kill three named Campaign antagonists.','Bane-Maker');
 if(l.fieldSuccess>=20)gc300Accomplishment(a,'fieldhand','Master Fieldhand','Recorded twenty successful field checks.','Fieldhand');
 if(l.captainMissions>=20)gc300Accomplishment(a,'seasoned-captain','Seasoned Captain','Led a party through twenty contracts.','Captain');
 if(l.commandDays>=30)gc300Accomplishment(a,'old-commander','Old Commander','Held regional command for thirty active simulation days.','Old Commander');
 if(l.withFounder>=20&&a.id!==state?.company?.founderId)gc300Accomplishment(a,'founders-companion',"Founder's Companion",'Completed twenty contracts alongside the Founder.',"Founder's Companion");
 if(l.nearDeaths>=3)gc300Accomplishment(a,'grave-returned','Grave-Returned','Was brought down and survived three times.','Grave-Returned');
 return l;
}
function gc300MaybeScar(a,cause='battlefield injury'){
 if(!a||a.status==='Dead')return null;
 const l=gc300Legacy(a);if(l.scars.length>=3||!chance(.28))return null;
 const choices=Object.keys(GC300_SCARS).filter(x=>!l.scars.includes(x));if(!choices.length)return null;
 const scar=pick(choices);l.scars.push(scar);a.scars=Array.isArray(a.scars)?a.scars:[];if(!a.scars.includes(scar))a.scars.push(scar);
 a.history=a.history||[];a.history.push(`Day ${state.company.day}: ${cause} left a permanent scar — ${scar}.`);
 if(typeof gc199RecordFeed==='function')gc199RecordFeed(`${a.name} survived with a permanent scar: ${scar}.`,'legacy');
 return scar;
}
function gc300InitState(s){
 if(!s)return s;s.gc300Memorials=Array.isArray(s.gc300Memorials)?s.gc300Memorials:[];
 (s.roster||[]).forEach(a=>{gc300Legacy(a);gc300Evaluate(a)});
 return s;
}
const _normalizeStateGC300=normalizeState;
normalizeState=function(s){return gc300InitState(_normalizeStateGC300(s))};
const _createStateGC300=createState;
createState=function(name,startRegion='veyric'){return gc300InitState(_createStateGC300(name,startRegion))};

const _derivedGC300=derived;
derived=function(a){
 const d=_derivedGC300(a),l=gc300Legacy(a);
 l.scars.forEach(name=>{const x=GC300_SCARS[name];if(!x)return;Object.entries(x.combat||{}).forEach(([k,v])=>{if(k in d.combat)d.combat[k]+=v});Object.entries(x.util||{}).forEach(([k,v])=>{if(k in d.util)d.util[k]+=v})});
 Object.keys(d.combat).forEach(k=>d.combat[k]=Math.max(1,Math.round(d.combat[k])));
 Object.keys(d.util).forEach(k=>d.util[k]=Math.max(0,Math.round(d.util[k])));
 return d;
};

function gc300Title(a){const l=gc300Legacy(a);return l.activeTitle||''}
function gc300RecordBoss(a,name){
 const l=gc300Legacy(a);l.bossKills++;if(name&&!l.bosses.includes(name))l.bosses.push(name);
 if(name)gc300EarnTitle(a,`${name}'s Bane`,`survived the fall of ${name}`);
}
function gc300Memorial(a,cause){
 if(!state||!a||a.gc300Memorialized)return;
 a.gc300Memorialized=true;const l=gc300Legacy(a);
 const rec={id:a.id,name:a.name,title:gc300Title(a),lvl:a.lvl,day:state.company.day,cause,contracts:l.contracts,campaigns:l.campaigns,bossKills:l.bossKills,kills:a.kills||0,commandDays:Math.floor(l.commandDays),scars:[...l.scars],accomplishments:l.accomplishments.map(x=>x.name)};
 state.gc300Memorials=state.gc300Memorials||[];state.gc300Memorials.push(rec);if(state.gc300Memorials.length>150)state.gc300Memorials.shift();
}
