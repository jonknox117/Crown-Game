/* Grim Company v20.8 — Command, commander judgment and party organization. */
function gc280PolicyIndex(policy){return Math.max(0,GC280_POLICIES.indexOf(policy))}
function gc280EffectivePolicy(regionId){
 const c=gc280CommandState(regionId),a=gc280Commander(regionId);let i=gc280PolicyIndex(c.casualtyPolicy),t=gc280Temperament(a);if(t==='Reckless')i++;if(t==='Cautious')i--;return GC280_POLICIES[clamp(i,0,2)];
}
function gc280PartyAverageLevel(p){const ms=partyMembers(p).filter(a=>a.status==='Ready');return ms.length?ms.reduce((s,a)=>s+(a.lvl||1),0)/ms.length:0}
function gc280RiskAllowed(regionId,p,risk){
 const ms=partyMembers(p).filter(a=>a.status==='Ready');if(!ms.length)return false;const policy=gc280EffectivePolicy(regionId),minSize=policy==='Conservative'?3:policy==='Normal'?2:1;if(ms.length<minSize)return false;
 const avg=gc280PartyAverageLevel(p),benchmark=gc194RiskLevel(risk),score=gc280CommandScore(gc280Commander(regionId)),tol=(policy==='Conservative'?0:policy==='Normal'?2:5)+(score>=85?1:0);return benchmark<=avg+tol;
}
function gc280ContractScore(regionId,p,c){
 const cmd=gc280CommandState(regionId),avg=gc280PartyAverageLevel(p),benchmark=gc194RiskLevel(c.risk),unknown=Number(c.unknown)||0;let score=0;
 if(cmd.directive==='Make Money')score=(Number(c.reward)||0)-c.risk*12-unknown*5;
 else if(cmd.directive==='Secure Region'){const typeBonus={Defense:45,Rescue:35,Extermination:32,Hunt:24,Escort:20,Siege:38,Investigation:14,Negotiation:12}[c.type]||8;score=c.risk*28+typeBonus-unknown*6}
 else if(cmd.directive==='Develop Roster')score=115-Math.abs(avg-benchmark)*14+c.risk*8-unknown*4;
 else score=c.gc240CampaignId?10000+c.risk*50:(c.risk*18-unknown*5);
 if(gc280Temperament(gc280Commander(regionId))==='Profit-minded')score+=(Number(c.reward)||0)*.12;return score;
}
function gc280PickContract(regionId,p){
 const r=state.regions[regionId],cmd=gc280CommandState(regionId),list=[];
 if(cmd.directive==='Break Campaign'){const active=gc240CampaignState(regionId)?.active;if(active?.currentContract&&!active.inFieldPartyId)list.push(active.currentContract)}
 (r.contracts||[]).forEach(c=>list.push(c));
 return list.filter(c=>gc280RiskAllowed(regionId,p,Number(c.risk)||1)).sort((a,b)=>gc280ContractScore(regionId,p,b)-gc280ContractScore(regionId,p,a))[0]||null;
}
function gc280AssignStances(regionId){
 const cmd=gc280CommandState(regionId),commander=gc280Commander(regionId),people=state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.id!==state.company.founderId&&a.id!==commander?.id);
 people.forEach((a,i)=>{let stance='Train';if(cmd.directive==='Make Money')stance='Odd Jobs';else if(cmd.directive==='Secure Region')stance=i%3===0?'Train':'Scout';else if(cmd.directive==='Develop Roster')stance='Train';else if(cmd.directive==='Break Campaign')stance=i%4===0?'Train':'Scout';a.dailyOrder=stance});
}
function gc280MaybeRecruit(regionId){
 const cmd=gc280CommandState(regionId);if(cmd.directive!=='Develop Roster')return null;const r=state.regions[regionId],locals=localRoster(regionId);if(locals.length>=Math.min(rosterCap(regionId),8)||!r.recruits?.length)return null;
 const best=[...r.recruits].sort((a,b)=>(b.lvl||1)-(a.lvl||1)||gc280CommandScore(b)-gc280CommandScore(a))[0];if(!best)return null;const cost=gc201HireCost(best);if(state.company.silver<cost+120)return null;
 state.company.silver-=cost;r.recruits=r.recruits.filter(x=>x.id!==best.id);gc201MigrateAdventurer(best);best.dailyOrder='Train';state.roster.push(best);pushHistory(`Commander signed ${best.name} for ${money(cost)}.`,regionId);gc280Log(regionId,`${gc280Commander(regionId).name} signed ${best.name}, Lv.${best.lvl} ${best.className}, for ${money(cost)}.`);return best;
}
function gc280Unassigned(regionId){
 const commander=gc280Commander(regionId),assigned=new Set(state.parties.flatMap(p=>p.members||[]));return state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.id!==state.company.founderId&&a.id!==commander?.id&&!assigned.has(a.id)).sort((a,b)=>(b.lvl||1)-(a.lvl||1));
}
function gc280BuildParties(regionId){
 let pool=gc280Unassigned(regionId);const target=Math.min(partyCap(regionId),4+(hq(regionId).upgrades['Command Hall']>=3?1:0)),idle=state.parties.filter(p=>p.regionId===regionId&&!p.expedition&&!p.members.includes(state.company.founderId));
 for(const p of idle){p.members=p.members.filter(id=>state.roster.some(a=>a.id===id&&a.status!=='Dead'));while(p.members.length<target&&pool.length)p.members.push(pool.shift().id);if(p.members.length&&!p.captainId)p.captainId=p.members.map(id=>state.roster.find(a=>a.id===id)).filter(Boolean).sort((a,b)=>gc280CommandScore(b)-gc280CommandScore(a))[0]?.id||null}
 if(pool.length>=2&&state.parties.filter(p=>p.regionId===regionId).length<8&&state.company.silver>=145){const n=state.parties.filter(p=>p.regionId===regionId).length+1,p=makeParty(regionId,`${REGION_DEFS[regionId].culture} Company ${n}`);state.company.silver-=25;state.parties.push(p);while(p.members.length<target&&pool.length)p.members.push(pool.shift().id);p.captainId=p.members[0]||null;gc280Log(regionId,`${gc280Commander(regionId).name} chartered ${p.name} for ${money(25)}.`)}
}
