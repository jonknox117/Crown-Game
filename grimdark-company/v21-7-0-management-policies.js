/* Grim Company v21.7 — regional command policy, persistent and save-compatible. */
const GC370_VERSION='21.7.0';
const GC370_GOALS=['Balanced','Make Money','Secure Region','Develop Roster','Break Campaign'];
const GC370_RISKS=['Conservative','Normal','Ruthless'];
const GC370_SPENDING=['Ask','Budgeted','Broad'];
const GC370_AUTHORITY=['All','Major','Full'];
const GC370_RESERVES=[0,100,250,500];
if(!GC280_DIRECTIVES.includes('Balanced'))GC280_DIRECTIVES.push('Balanced');
function gc370Config(regionId,s=state){
 const c=gc280CommandState(regionId,s);if(!c)return null;
 c.gc370=c.gc370||{};
 const x=c.gc370;
 x.priority=GC370_GOALS.includes(x.priority)?x.priority:(GC370_GOALS.includes(c.directive)?c.directive:'Balanced');
 x.risk=GC370_RISKS.includes(x.risk)?x.risk:(GC370_RISKS.includes(c.casualtyPolicy)?c.casualtyPolicy:'Normal');
 x.spending=GC370_SPENDING.includes(x.spending)?x.spending:'Budgeted';
 x.authority=GC370_AUTHORITY.includes(x.authority)?x.authority:'Major';
 x.reserve=GC370_RESERVES.includes(x.reserve)?x.reserve:100;
 x.actionCap=Number.isFinite(x.actionCap)?clamp(x.actionCap,25,1000):150;
 x.requests=Array.isArray(x.requests)?x.requests.slice(-10):[];
 x.history=Array.isArray(x.history)?x.history.slice(-48):[];
 x.performance=x.performance&&typeof x.performance==='object'?x.performance:{};
 for(const name of ['dispatches','hires','charters','approvals','declines','retreats','aidKits','netSilver'])x.performance[name]=Number(x.performance[name])||0;
 x.performance.days=Number(x.performance.days)||0;
 x.performance.managerId=x.performance.managerId||c.commanderId||null;
 c.directive=x.priority;c.casualtyPolicy=x.risk;
 return x;
}
const _normalizeStateGC370=normalizeState;
normalizeState=function(s){
 const out=_normalizeStateGC370(s);
 if(out)REGION_ORDER.forEach(r=>gc370Config(r,out));
 return out;
};
const _createStateGC370=createState;
createState=function(...args){
 const s=_createStateGC370(...args),prev=state;
 try{state=s;REGION_ORDER.forEach(r=>gc370Config(r,s));}
 finally{state=prev}
 return s;
};
function gc370Rank(a){return a?gc360Rank(a):0}
function gc370Talent(a){
 const lvl=a?.lvl||1,rarity=gc370Rank(a);
 return{
  lvl,rarity,prep:lvl>=5,personnel:lvl>=10,contingency:lvl>=15,master:lvl>=20,
  logistics:rarity>=1,assessment:rarity>=2,coordination:rarity>=3,adaptation:rarity>=4
 };
}
function gc370Record(r,category,description){
 const x=gc370Config(r);if(!x)return;
 x.history.push({day:state.company.day,category,description:String(description)});
 if(x.history.length>48)x.history.splice(0,x.history.length-48);
 gc280Log(r,description);
}
function gc370ChangeOrders(r,opts){
 const x=gc370Config(r),c=gc280CommandState(r);if(!x||!c)return false;
 if(!gc280Commander(r))return false;
 const o=opts||{};
 if(GC370_GOALS.includes(o.priority))x.priority=o.priority;
 if(GC370_RISKS.includes(o.risk))x.risk=o.risk;
 if(GC370_SPENDING.includes(o.spending))x.spending=o.spending;
 if(GC370_AUTHORITY.includes(o.authority))x.authority=o.authority;
 if(GC370_RESERVES.includes(Number(o.reserve)))x.reserve=Number(o.reserve);
 if(Number.isFinite(Number(o.actionCap)))x.actionCap=clamp(Number(o.actionCap),25,1000);
 c.directive=x.priority;c.casualtyPolicy=x.risk;
 gc370Record(r,'orders','Standing orders revised: '+x.priority+', '+x.risk+', '+x.spending+' spending, '+x.authority+' approval.');
 save();return true;
}
const _gc280AppointGC370=gc280Appoint;
gc280Appoint=function(regionId,id){
 const x=gc370Config(regionId),before=gc280Commander(regionId)?.id;
 const ok=_gc280AppointGC370(regionId,id);
 if(!ok)return ok;
 const manager=gc280Commander(regionId);if(manager&&before!==manager.id){
  x.requests=[];
  x.performance={managerId:manager.id,days:0,dispatches:0,hires:0,charters:0,approvals:0,declines:0,retreats:0,aidKits:0,netSilver:0};
  gc370Record(regionId,'appointed',manager.name+' took command: Lv.'+manager.lvl+' '+gc360RankName(manager)+'.');
 }
 return ok;
};
const _gc280ReleaseGC370=gc280Release;
gc280Release=function(regionId,silent=false){
 const c=gc370Config(regionId),a=gc280Commander(regionId);
 if(c){c.requests=[];if(a)gc370Record(regionId,'relieved',a.name+' relinquished the headquarters.');}
 return _gc280ReleaseGC370(regionId,silent);
};
function gc370Pending(r,kind,key){
 return gc370Config(r)?.requests.find(q=>q.kind===kind&&q.key===key)||null;
}
function gc370Ask(r,kind,key,description,amount=0,extra={}){
 const x=gc370Config(r),a=gc280Commander(r);if(!x||!a)return false;
 const existing=gc370Pending(r,kind,key);
 if(existing)return existing;
 if(x.requests.length>=8)return false;
 const q={id:uid('mgr'),managerId:a.id,regionId:r,kind,key,description,amount,createdDay:state.company.day,...extra};
 x.requests.push(q);
 gc370Record(r,'approval','Approval requested: '+description);
 save();
 return q;
}
function gc370MaySpend(r,amount){
 const x=gc370Config(r),cost=Math.max(0,Number(amount)||0);
 if(!x)return false;
 if(x.spending==='Ask')return false;
 if(state.company.silver-cost<x.reserve)return false;
 if(x.spending==='Budgeted'&&cost>x.actionCap)return false;
 return true;
}
function gc370NeedsDispatchApproval(r,c){
 const x=gc370Config(r);if(!x)return false;
 return x.authority==='All'||(x.authority==='Major'&&Number(c?.risk)>=4);
}
function gc370WillApproveAction(r,kind,cost=0,major=false){
 const x=gc370Config(r);
 if(!x)return false;
 if(x.authority==='All')return false;
 if(major&&x.authority==='Major')return false;
 if(kind==='spend'&&!gc370MaySpend(r,cost))return false;
 return true;
}
/* Orders govern commanders. Traits affect decisions and confidence, not the
   player's explicit casualty limits. */
gc280EffectivePolicy=function(r){return gc370Config(r)?.risk||'Normal'};
const _gc280ContractScoreGC370=gc280ContractScore;
gc280ContractScore=function(r,p,c){
 const x=gc370Config(r),a=gc280Commander(r),t=gc370Talent(a);
 if(!x)return _gc280ContractScoreGC370(r,p,c);
 let score;
 const risk=Number(c.risk)||1,unknown=Number(c.unknown)||0;
 const avg=gc280PartyAverageLevel(p),benchmark=gc194RiskLevel(risk);
 if(x.priority==='Balanced'){
  const reward=Number(c.reward)||0,type=c.type||'';
  score=reward*.4+(['Rescue','Defense','Escort'].includes(type)?30:0)-unknown*9-risk*4;
 }else score=_gc280ContractScoreGC370(r,p,c);
 /* All managers can select qualified contracts; experience determines judgment
    about danger and party suitability, not which risk is legally unlocked. */
 if(x.risk==='Conservative')score-=(Math.max(0,benchmark-avg)*10+unknown*12+risk*4);
 if(x.risk==='Normal')score-=(Math.max(0,benchmark-avg)*4+unknown*5);
 if(x.risk==='Ruthless')score+=risk*5;
 if(t.assessment&&c.check){
  const b=bestUtility(p,c.check);
  if(b?.a)score+=(Number(b.value)||0)*1.3;
 }
 if(t.adaptation){
  if(unknown>=3&&x.risk!=='Ruthless')score-=28+unknown*7;
  if(x.priority==='Balanced')score+=(Number(state.regions[r]?.threat)||0)*risk*.045;
 }
 return score;
};
/* Risk permission is always career rarity. Conservative managers require
   stronger team numbers, but levels only influence preference, not legality. */
gc280RiskAllowed=function(r,p,risk){
 const x=gc370Config(r),members=partyMembers(p).filter(a=>a.status==='Ready');
 if(!members.length||!gc320PartyQualification(p,{risk}).ok)return false;
 const minimum=x?.risk==='Conservative'?3:x?.risk==='Ruthless'?1:2;
 return members.length>=minimum;
};
/* Existing stances are still meaningful. Balanced administrators actually
   distribute daily work instead of defaulting everyone to Train. */
const _gc280AssignStancesGC370=gc280AssignStances;
gc280AssignStances=function(r){
 const x=gc370Config(r);
 if(x?.priority!=='Balanced')return _gc280AssignStancesGC370(r);
 const lead=gc280Commander(r),people=state.roster.filter(a=>a.regionId===r&&a.status==='Ready'&&a.id!==state.company.founderId&&a.id!==lead?.id);
 people.forEach((a,i)=>a.dailyOrder=['Train','Scout','Odd Jobs','Train','Recover'][i%5]);
};
