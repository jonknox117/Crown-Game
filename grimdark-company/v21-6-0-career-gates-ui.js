/* Grim Company v21.6.0 — career rarity gates, not character levels. */
const GC360_RARITIES=['Common','Uncommon','Rare','Super Rare','Legendary'];
function gc360Rank(a){return a?bl17RankForMissions(a.missions||0):0}
function gc360Required(risk){return clamp(Math.round(Number(risk)||1),1,5)-1}
function gc360RankName(rank){return GC360_RARITIES[clamp(Number(rank)||0,0,4)]}
function gc360RiskCap(a){return a?gc360Rank(a)+1:0}
gc320PartyQualification=function(p,c){
 const risk=clamp(Number(c?.risk)||1,1,5),need=gc360Required(risk);
 const members=partyMembers(p).filter(a=>a.status==='Ready'||a.status==='Expedition');
 const core=Math.max(1,Math.ceil(members.length/2)),supportNeed=Math.max(0,need-1);
 const captain=members.find(a=>a.id===p.captainId)||null;
 const captainOK=risk===1?true:!!captain&&gc360Rank(captain)>=need;
 const qualified=members.filter(a=>gc360Rank(a)>=supportNeed).length;
 const coreOK=qualified>=core;
 const ok=members.length>0&&captainOK&&coreOK;
 let reason='Captain and supporting crew have the required career experience.';
 if(!members.length)reason='No available adventurers.';
 else if(!captainOK)reason='Captain must be '+gc360RankName(need)+' or better for Risk '+risk+'.';
 else if(!coreOK)reason='Need '+core+' of '+members.length+' members at '+gc360RankName(supportNeed)+' or better.';
 return{ok,risk,need,needRarity:gc360RankName(need),core,qualified,captain,captainOK,coreOK,avg:members.length?members.reduce((s,a)=>s+a.lvl,0)/members.length:0,reason};
};
gc320QualificationHTML=function(p,c){
 const q=gc320PartyQualification(p,c),cap=q.captain?gc360RankName(gc360Rank(q.captain)):'Unassigned';
 return '<div class="gc320Readiness '+(q.ok?'ready':'blocked')+'"><span>'+(q.ok?'QUALIFIED':'UNDERQUALIFIED')+' • RISK '+q.risk+'</span><b>Captain: '+q.needRarity+' career rarity</b><small>Captain '+esc(cap)+' • '+q.qualified+'/'+partyMembers(p).length+' core at '+gc360RankName(Math.max(0,q.need-1))+'+</small><em>'+esc(q.reason)+'</em></div>';
};
// The commander's automation must not retain a hidden level-based block.
if(typeof gc280RiskAllowed==='function')gc280RiskAllowed=function(regionId,p,risk){return!!(p&&!p.expedition&&gc320PartyQualification(p,{risk}).ok)};
// A freeblade's personal career rank and reputation, not level, unlock risk.
gc310Eligibility=function(c,f=gc260Founder()){
 const risk=clamp(Number(c?.risk)||1,1,5),minRank=gc360Required(risk),rep=gc310Freeblade()?.reputation||0,minRep=GC310_REP_REQUIREMENT[risk],rank=gc360Rank(f),lvl=f?.lvl||1;
 return{ok:!!(f&&rank>=minRank&&rep>=minRep),risk,minRank,rank,minLevel:0,minRep,lvl,rep,reason:'Need '+gc360RankName(minRank)+' career rarity and '+minRep+' reputation.'};
};
const _gc360AcceptContract=gc310AcceptContract;
gc310AcceptContract=function(cid){
 const c=contractById(cid),f=gc260Founder(),g=c?gc310Eligibility(c,f):null;
 if(c&&f&&g&&!g.ok)return toast(g.reason);
 return _gc360AcceptContract(cid);
};
const _gc360FreebladeCard=gc310FreebladeContractCard;
gc310FreebladeContractCard=function(c){
 const h=_gc360FreebladeCard(c),g=gc310Eligibility(c);
 return h.replace(/Need Lv\.\d+ \+ Rep \d+/g,esc(g.reason))
         .replace(/Crew available/g,'Career rarity qualified');
};
gc320IndependentEligible=function(c){
 const f=gc260Founder(),need=gc360Required(c?.risk),available=!!(f&&f.status==='Ready'&&!gc260System()?.activity&&!gc260FounderParty()?.expedition);
 return{ok:available&&gc360Rank(f)>=need,need,available,level:f?.lvl||0,rank:gc360Rank(f)};
};
const _gc360TakeIndependent=gc320TakeIndependent;
gc320TakeIndependent=function(cid){
 const c=contractById(cid),g=c?gc320IndependentEligible(c):null;
 if(g&&!g.ok)return toast('Need '+gc360RankName(g.need)+' career rarity and personal availability.');
 return _gc360TakeIndependent(cid);
};
const _gc360IndependentCard=gc320IndependentCard;
gc320IndependentCard=function(c){
 const g=gc320IndependentEligible(c);
 return _gc360IndependentCard(c)
  .replace(/Risk (\d+) requires you to be Lv\.\d+\+/g,'Risk $1 requires '+gc360RankName(g.need)+' rarity')
  .replace('Your experience is not yet sufficient.','Your career rarity is not yet sufficient.');
};
// External freeblade crews have believable recorded experience and a qualified captain.
gc310AssembleCrew=function(c,p){
 const f=gc260Founder(),rid=c.regionId,risk=clamp(Number(c.risk)||1,1,5),need=Math.max(1,gc310CrewSize(c)-1),rank=gc360Required(risk),coreRank=Math.max(0,rank-1);
 if(!f||!p)return[];
 p.members=[f.id];p.captainId=null;
 const pool=gc310AvailablePool(rid,risk),selected=[];
 const qualified=pool.slice().sort((a,b)=>gc360Rank(b)-gc360Rank(a)||(b.lvl||1)-(a.lvl||1));
 for(const a of qualified){if(selected.length>=need)break;if(gc360Rank(a)>=coreRank)selected.push(a)}
 while(selected.length<need){
  const a=gc310MakeFreelancer(rid,Math.max(1,Math.min(GC194_MAX_LEVEL,1+risk*2+rnd(-1,2))));
  // Independent veterans can predate the player's career; never create a Level requirement.
  a.missions=BL17_CAREER[Math.min(4,coreRank)].min+rnd(0,2);
  bl17EnsureCareer(a);
  gc310RegionPool(rid).push(a);selected.push(a);
 }
 if(rank>0&&!selected.some(a=>gc360Rank(a)>=rank)){
  const lead=selected[0];
  lead.missions=Math.max(lead.missions||0,BL17_CAREER[rank].min);
  bl17EnsureCareer(lead);
 }
 const chosen=selected.slice(0,need).map(a=>gc310TakeFromPool(rid,a));
 chosen.forEach(a=>p.members.push(a.id));
 const lead=chosen.slice().sort((a,b)=>gc360Rank(b)-gc360Rank(a)||(b.lvl||1)-(a.lvl||1))[0];
 p.captainId=lead?.id||f.id;
 return chosen;
};
const _gc360ShowChoose=showChooseParty;
showChooseParty=function(cid){
 const c=contractById(cid);
 if(!c||gc270IsFreeblade())return _gc360ShowChoose(cid);
 const ps=localParties(c.regionId).filter(p=>!p.expedition&&p.members.length&&!p.gc320IndependentCrew);
 if(!ps.length)return toast('No staffed idle party.');
 modal('<div class="sheetHead"><div><h3>Commit a Party</h3><div class="tiny muted">Career rarity authorizes the risk; level and class decide who survives.</div></div><button class="x" data-action="close">×</button></div><div class="notice">'+esc(c.title)+' • Risk '+c.risk+' • captain '+gc360RankName(gc360Required(c.risk))+'+ • '+c.enemyCount+' hostiles</div><div class="list">'+ps.map(p=>{
  const q=gc320PartyQualification(p,c),prof=partyProfile(p),best=bestUtility(p,c.check);
  return '<div class="card"><div class="statline"><b>'+esc(p.name)+'</b><span>'+p.members.length+'/'+partyCap(p.regionId)+'</span></div><div class="tiny muted">ATK '+Math.round(prof.attack)+' • GUARD '+Math.round(prof.guard)+' • '+esc(c.check)+' '+best.value+'</div>'+gc320QualificationHTML(p,c)+'<button class="btn '+(q.ok?'primary':'')+' wide" data-action="dispatch" data-id="'+c.id+'" data-party="'+p.id+'" '+(q.ok?'':'disabled')+'>'+(q.ok?'COMMIT PARTY':'NOT QUALIFIED')+'</button></div>';
 }).join('')+'</div>');
};
const _gc360ContractCard=gc330ContractCard;
gc330ContractCard=function(c){
 const h=_gc360ContractCard(c);
 return h.replace(/Risk (\d+) benchmark Lv\.\d+/g,'Risk $1 captain '+gc360RankName(gc360Required(c.risk))+'+');
};
const _gc360PersonCard=gc330PersonCard;
gc330PersonCard=function(a){
 const html=_gc360PersonCard(a);
 return html.replace(/Risk \d+ qualified/g,'Risk '+gc360RiskCap(a)+' eligible');
};
const _gc360Parties=gc330PartiesScreen;
gc330PartiesScreen=function(){
 return _gc360Parties().replace('Experienced captains and veteran cores determine','Career-ranked captains and supporting crews determine');
};
// Keep legacy level benchmark as a *difficulty reference*, not a contract qualification rule.
// Display a direct level/class ability track in the existing character inspection sheet.
const _gc360RenderInspect=renderInspect;
renderInspect=function(id,recruit){
 const out=_gc360RenderInspect(id,recruit);
 const a=state.roster.find(x=>x.id===id)||REGION_ORDER.flatMap(r=>state.regions[r]?.recruits||[]).find(x=>x.id===id);
 const sheet=document.getElementById('sheet');
 if(a&&sheet&&!sheet.querySelector('.gc360AbilityPanel')){
  const abilities=gc360Skills(a),rank=gc360RankName(gc360Rank(a)),passive=classRule7(a)?.ability||'Class training applies automatically.';
  const rows=abilities.map(x=>'<div class="gc360Ability '+(a.lvl>=x.level?'unlocked':'locked')+'"><span>LVL '+x.level+'</span><div><b>'+esc(x.name)+'</b><small>'+esc(x.desc)+'</small><em>'+x.cooldown+'-round cooldown • '+(a.lvl>=x.level?'UNLOCKED':'LOCKED')+'</em></div></div>').join('');
  sheet.insertAdjacentHTML('beforeend','<div class="gc360AbilityPanel"><div class="sectionTitle"><h3>Class Techniques</h3><span>'+esc(rank)+' • Level '+a.lvl+'</span></div><div class="gc360AbilityPassive"><span>CLASS PASSIVE</span><b>'+esc(passive)+'</b></div><div class="gc360AbilityList">'+rows+'</div><div class="tiny muted">Attack, Guard and Reposition are available to everyone. Techniques consume a turn and activate automatically when useful.</div></div>');
 }
 return out;
};
const _gc360AuditG=audit;
audit=function(){const out=_gc360AuditG();out.v360CareerRisk=true;out.rarityOnlyContractGates=true;out.levelMilestoneAbilities=true;out.classTechniques=GC360_ALL.reduce((s,x)=>s+x[1].length,0);return out};
window.__BL_AUDIT=audit;
(function(){const s=document.createElement('style');s.textContent='.gc360AbilityPanel{margin-top:14px}.gc360AbilityPassive{padding:10px;background:#1b1913;border-left:3px solid #b39157;border-radius:4px}.gc360AbilityPassive span{display:block;font-size:10px;letter-spacing:.1em;color:#c8a568}.gc360AbilityPassive b{display:block;margin-top:5px;font-size:12px;line-height:1.5;color:#e1d6bd}.gc360AbilityList{display:grid;gap:7px;margin:8px 0}.gc360Ability{display:grid;grid-template-columns:56px 1fr;gap:10px;padding:11px;border:1px solid #6f5635;border-radius:7px;background:#1b1a16}.gc360Ability.locked{opacity:.56;border-color:#383630}.gc360Ability>span{font-size:11px;font-weight:700;color:#d8b780}.gc360Ability b,.gc360Ability small,.gc360Ability em{display:block}.gc360Ability b{font-size:12px}.gc360Ability small{font-size:11px;line-height:1.4;margin-top:3px}.gc360Ability em{font-size:10px;color:#b6a084;margin-top:4px;font-style:normal}';document.head.appendChild(s)})();
