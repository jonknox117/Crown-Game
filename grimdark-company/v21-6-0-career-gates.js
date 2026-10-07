/* Grim Company v21.6.0 — career-rarity qualifications. */
const GC360_VERSION='21.6.0';
const GC360_RISK_RANK={1:0,2:1,3:2,4:3,5:4};
function gc360Rank(a){return a?bl17RankForMissions(Math.max(0,Number(a.missions)||0)):0}
function gc360RiskName(r){return BL17_CAREER[GC360_RISK_RANK[clamp(Number(r)||1,1,5)]].name}
function gc360RankName(a){return BL17_CAREER[gc360Rank(a)].name}

/* Higher risk means proven command, not an arbitrary minimum character level.
   A veteran captain needs half the field party to have earned the same grade;
   developing companions can still join as the remainder. */
gc320PartyQualification=function(p,c){
 const risk=clamp(Number(c?.risk)||1,1,5),need=GC360_RISK_RANK[risk];
 const members=partyMembers(p).filter(a=>a.status==='Ready'||a.status==='Expedition');
 const core=Math.max(1,Math.ceil(members.length/2)),qualified=members.filter(a=>gc360Rank(a)>=need).length;
 const captain=members.find(a=>a.id===p.captainId)||null;
 const captainOK=risk===1||!!captain&&gc360Rank(captain)>=need;
 const coreOK=qualified>=core,avg=members.length?members.reduce((s,a)=>s+gc360Rank(a),0)/members.length:0;
 const ok=!!(members.length&&captainOK&&coreOK);
 let reason='Proven career-qualified captain and crew.';
 if(!members.length)reason='No available adventurers.';
 else if(!captainOK)reason='Captain must be '+gc360RiskName(risk)+' or higher for Risk '+risk+'.';
 else if(!coreOK)reason='Need '+core+' of '+members.length+' adventurers at '+gc360RiskName(risk)+' or higher.';
 return{ok,risk,need,reason,qualified,core,avg,captain,captainOK,coreOK,avgOK:coreOK};
};
gc320QualificationHTML=function(p,c){
 const q=gc320PartyQualification(p,c),total=partyMembers(p).length;
 return '<div class="gc320Readiness '+(q.ok?'ready':'blocked')+'"><span>'+(q.ok?'QUALIFIED':'UNDERQUALIFIED')+' • RISK '+q.risk+'</span><b>Career requirement: '+gc360RiskName(q.risk)+'+</b><small>'+(q.captain?'Captain '+esc(q.captain.name)+' • '+esc(gc360RankName(q.captain))+' • ':'')+q.qualified+'/'+total+' experienced core</small><em>'+esc(q.reason)+'</em></div>';
};

/* Independent players earn access through their own completed work rather than
   an arbitrary level threshold. Reputation still affects story/economy, not gates. */
gc310Eligibility=function(c,f=gc260Founder()){
 const risk=clamp(Number(c?.risk)||1,1,5),rank=gc360Rank(f),required=GC360_RISK_RANK[risk];
 const rep=gc310Freeblade()?.reputation||0;
 return{ok:!!(f&&rank>=required),risk,requiredRank:required,careerRank:rank,rarity:BL17_CAREER[rank].name,minLevel:0,minRep:0,lvl:f?.lvl||1,rep};
};

/* The self-employed contract screen uses its original economy/crew UI but its
   gate messaging must agree with the actual rarity rules. */
if(typeof gc310FreebladeContractCard==='function'){
 const _gc360FreebladeCard=gc310FreebladeContractCard;
 gc310FreebladeContractCard=function(c){
  let html=_gc360FreebladeCard(c),g=gc310Eligibility(c);
  if(!g.ok)html=html.replace(/Need Lv\.\d+ \+ Rep \d+/g,'Requires '+gc360RiskName(c.risk)+' career rarity');
  return html;
 };
}
if(typeof gc330PersonCard==='function'){
 const _gc360PersonCard=gc330PersonCard;
 gc330PersonCard=function(a){
  return _gc360PersonCard(a).replace(/Risk \d+ qualified/g,'Risk '+(gc360Rank(a)+1)+' career');
 };
}
if(typeof gc330ContractCard==='function'){
 const _gc360ContractCard=gc330ContractCard;
 gc330ContractCard=function(c){
  let html=_gc360ContractCard(c);
  return html.replace(new RegExp('benchmark Lv\\.'+gc320RiskLevel(c.risk),'g'),gc360RiskName(c.risk)+'+ career');
 };
}
if(typeof contractCard==='function'){
 const _gc360ContractCardOld=contractCard;
 contractCard=function(c){
  const html=_gc360ContractCardOld(c);
  return html.replace(/professional benchmark: Lv\.\d+/gi,'career requirement: '+gc360RiskName(c.risk)+'+').replace(/Captain \+ experienced core required/g,'Career-qualified captain and core required');
 };
}
if(typeof showChooseParty==='function'){
 const _gc360ShowChooseParty=showChooseParty;
 showChooseParty=function(cid){
  const result=_gc360ShowChooseParty(cid),c=contractById(cid);
  const sh=document.getElementById('sheet');
  if(sh&&c)sh.innerHTML=sh.innerHTML.replace(new RegExp('experienced benchmark Lv\\.'+gc320RiskLevel(c.risk),'g'),gc360RiskName(c.risk)+'+ career requirement');
  return result;
 };
}

/* Character level no longer sets risk permission. It remains combat strength. */
const _auditGC360R=audit;
audit=function(){
 const a=_auditGC360R();
 a.v360CareerCombat=GC360_VERSION;a.contractAccessBasedOnCareerRarity=true;
 a.riskGatesIgnoreAdventurerLevel=true;a.riskRequiresCareerCaptainAndCore=true;
 return a;
};
window.__BL_AUDIT=audit;

window.__GC360_RARITY_TEST=function(){
 const old=state;
 try{
  state=createState('Rarity Rules Test','veyric');state.regions.veyric.hq.established=true;
  const p=makeParty('veyric','Career Gate Test');state.parties.push(p);const crew=[];
  for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=20;a.missions=0;state.roster.push(a);crew.push(a)}
  p.members=crew.map(a=>a.id);p.captainId=crew[0].id;
  const initial=[1,2,3,4,5].map(r=>gc320PartyQualification(p,{risk:r}).ok);
  crew[0].missions=40;crew[1].missions=40;crew[2].missions=40;
  const experienced=[1,2,3,4,5].map(r=>gc320PartyQualification(p,{risk:r}).ok);
  crew.forEach(a=>a.lvl=1);
  const lowLevelHighRisk=gc320PartyQualification(p,{risk:5}).ok;
  crew[0].missions=0;
  const captainGate=!gc320PartyQualification(p,{risk:5}).ok;
  const f=crew[1],personalRisk5=gc310Eligibility({risk:5},f).ok;
  const ranks=[0,5,12,25,40].map(n=>BL17_CAREER[bl17RankForMissions(n)].name);
  return{ok:initial.join(',')==='true,false,false,false,false'&&experienced.every(Boolean)&&lowLevelHighRisk&&captainGate&&personalRisk5&&ranks.join(',')==='Common,Uncommon,Rare,Super Rare,Legendary',initial,experienced,lowLevelHighRisk,captainGate,personalRisk5,ranks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};