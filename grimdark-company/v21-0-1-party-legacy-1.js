/* Grim Company v21.0.1 — Party Legacy: persistent company identities and traditions. */
const GC301_VERSION='21.0.1';
const GC301_TRADITIONS={
 'Night Hunters':{desc:'Repeated Scout and Sneak successes taught this company how to control first contact.'},
 'Hold the Line':{desc:'Repeated cautious victories hardened the formation against incoming pressure.'},
 'Bossbreakers':{desc:'This company has survived enough named enemies to know where monsters of reputation actually break.'},
 'Shock Company':{desc:'Repeated aggressive victories turned violent initiative into doctrine.'},
 'Long Road Veterans':{desc:'Twenty completed contracts made travel discipline second nature.'}
};
function gc301Party(p){
 if(!p)return null;
 p.gc301Legacy=p.gc301Legacy||{};
 const l=p.gc301Legacy;l.version=GC301_VERSION;
 l.foundedDay=Number(l.foundedDay)||Math.max(1,(state?.company?.day||1)-Math.max(0,Number(p.missions)||0));
 l.originalMembers=Array.isArray(l.originalMembers)?l.originalMembers:[...(p.members||[])];
 l.missions=Math.max(Number(l.missions)||0,Number(p.missions)||0);
 l.wins=Math.max(Number(l.wins)||0,Number(p.wins)||0);
 l.campaignOps=Number(l.campaignOps)||0;l.campaigns=Number(l.campaigns)||0;l.bossKills=Number(l.bossKills)||0;l.casualties=Math.max(Number(l.casualties)||0,Number(p.deaths)||0);
 l.scoutSneakSuccess=Number(l.scoutSneakSuccess)||0;l.cautiousWins=Number(l.cautiousWins)||0;l.aggressiveWins=Number(l.aggressiveWins)||0;
 l.captains=l.captains&&typeof l.captains==='object'?l.captains:{};
 l.traditions=Array.isArray(l.traditions)?l.traditions:[];
 l.history=Array.isArray(l.history)?l.history:[];
 return l;
}
function gc301AddTradition(p,name,reason){
 const l=gc301Party(p);if(!GC301_TRADITIONS[name]||l.traditions.includes(name))return false;
 l.traditions.push(name);l.history.push({day:state.company.day,text:`Earned tradition ${name}: ${reason}`});
 pushHistory(`${p.name} developed the tradition ${name}.`,p.regionId);
 if(typeof gc199RecordFeed==='function')gc199RecordFeed(`${p.name} became known as ${name}.`,'legacy');
 return true;
}
function gc301Evaluate(p){
 const l=gc301Party(p);
 if(l.scoutSneakSuccess>=8)gc301AddTradition(p,'Night Hunters','eight successful scouting or stealth checks');
 if(l.cautiousWins>=8)gc301AddTradition(p,'Hold the Line','eight victories under Cautious tactics');
 if(l.bossKills>=2)gc301AddTradition(p,'Bossbreakers','two named Campaign enemies defeated');
 if(l.aggressiveWins>=8)gc301AddTradition(p,'Shock Company','eight victories under Aggressive tactics');
 if(l.missions>=20)gc301AddTradition(p,'Long Road Veterans','twenty completed contracts');
 return l;
}
function gc301Has(p,name){return gc301Party(p)?.traditions.includes(name)}
function gc301InitState(s){
 if(!s)return s;(s.parties||[]).forEach(p=>{gc301Party(p);gc301Evaluate(p)});return s;
}
const _normalizeStateGC301=normalizeState;
normalizeState=function(s){return gc301InitState(_normalizeStateGC301(s))};
const _createStateGC301=createState;
createState=function(name,startRegion='veyric'){return gc301InitState(_createStateGC301(name,startRegion))};
const _makePartyGC301=makeParty;
makeParty=function(regionId,name){
 const p=_makePartyGC301(regionId,name);
 p.gc301Legacy={version:GC301_VERSION,foundedDay:state?.company?.day||1,originalMembers:[...(p.members||[])],missions:0,wins:0,campaignOps:0,campaigns:0,bossKills:0,casualties:0,scoutSneakSuccess:0,cautiousWins:0,aggressiveWins:0,captains:{},traditions:[],history:[]};
 return p;
};

const _gc193FinishNoTimeGC301=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition;if(!e||e.gc301Recorded)return _gc193FinishNoTimeGC301(p);
 e.gc301Recorded=true;
 const c=e.contract||{},win=e.battleWon!==false,checks=(e.checks||[]).map(x=>({...x})),deaths=[...(e.deaths||[]),...(e.gc194Deaths||[])],captain=p.captainId,tactic=p.tactic,boss=c.gc240BossName||null,campaign=!!c.gc240CampaignId;
 const out=_gc193FinishNoTimeGC301(p);
 const l=gc301Party(p);l.missions=Math.max(l.missions,Number(p.missions)||l.missions+1);l.wins=Math.max(l.wins,Number(p.wins)||l.wins+(win?1:0));
 if(campaign)l.campaignOps++;if(win&&boss){l.campaigns++;l.bossKills++;l.history.push({day:state.company.day,text:`Defeated ${boss} in ${c.title}.`})}
 l.casualties=Math.max(l.casualties,Number(p.deaths)||0);l.casualties+=Math.max(0,new Set(deaths).size-Math.max(0,Number(p.deaths)||0-l.casualties));
 l.scoutSneakSuccess+=checks.filter(x=>x.ok&&(x.key==='scout'||x.key==='sneak')).length;
 if(win&&tactic==='Cautious')l.cautiousWins++;if(win&&tactic==='Aggressive')l.aggressiveWins++;
 if(captain)l.captains[captain]=(l.captains[captain]||0)+1;
 l.history.push({day:state.company.day,text:`${win?'Completed':'Failed'} ${c.title||'contract'}${deaths.length?` • casualties: ${[...new Set(deaths)].join(', ')}`:''}.`});
 if(l.history.length>40)l.history.splice(0,l.history.length-40);gc301Evaluate(p);save();return out;
};

const _gc201ContactRateGC301=gc201ContactRate;
gc201ContactRate=function(p){let v=_gc201ContactRateGC301(p);if(p&&gc301Has(p,'Long Road Veterans'))v*=.95;if(p&&gc301Has(p,'Night Hunters'))v*=.94;return clamp(v,.01,.98)};

const _startBattleGC301=startBattle;
startBattle=function(p){
 const out=_startBattleGC301(p),b=p?.expedition?.battle;if(!b||b.gc301Applied)return out;b.gc301Applied=true;
 if(gc301Has(p,'Hold the Line')){b.allies.forEach(u=>u.guard=Math.round(u.guard*1.08));b.log.unshift(`${p.name}'s Hold the Line tradition hardens the formation.`)}
 if(gc301Has(p,'Shock Company'))b.gc301Shock=true;
 if(gc301Has(p,'Bossbreakers'))b.gc301Bossbreakers=true;
 return out;
};
const _allyAttackGC301=allyAttack;
allyAttack=function(actor,target,p){
 const b=p?.expedition?.battle,before=target?.hp||0,out=_allyAttackGC301(actor,target,p);if(!b||!target||target.hp<=0)return out;
 const dealt=Math.max(0,before-target.hp);let bonus=0;
 if(dealt>0&&b.round===1&&b.gc301Shock)bonus+=dealt*.08;
 if(dealt>0&&b.gc301Bossbreakers&&gc290IsBoss(p,target))bonus+=dealt*.10;
 if(bonus>0){const d=Math.max(1,Math.round(bonus));target.hp=Math.max(0,target.hp-d);b.log.push(`${p.name}'s tradition adds ${d} damage.`)}
 return out;
};
