/* Grim Company v21.2 — Stakes: fair qualification, unavoidable founder decisions, and permanent personal stances. */
const GC320_VERSION='21.2';
const GC320_RISK_LEVEL={1:1,2:3,3:6,4:10,5:15};
const GC320_STANCES=['Scout','Odd Jobs','Train','Recover'];

function gc320RiskLevel(risk){return GC320_RISK_LEVEL[clamp(Number(risk)||1,1,5)]||1}
function gc320PartyQualification(p,c){
 const risk=clamp(Number(c?.risk)||1,1,5),need=gc320RiskLevel(risk),members=partyMembers(p).filter(a=>a.status==='Ready'||a.status==='Expedition');
 if(!members.length)return{ok:false,risk,need,reason:'No available adventurers.',qualified:0,core:1,avg:0,captain:null};
 const avg=members.reduce((s,a)=>s+(a.lvl||1),0)/members.length,core=Math.max(1,Math.ceil(members.length/2)),qualified=members.filter(a=>(a.lvl||1)>=need).length;
 const captain=members.find(a=>a.id===p.captainId)||null,captainOK=risk===1?true:!!captain&&(captain.lvl||1)>=need;
 const avgOK=avg>=Math.max(1,need-2),coreOK=qualified>=core,ok=captainOK&&avgOK&&coreOK;
 let reason='Qualified experienced core.';
 if(!captainOK)reason=`Captain must be Level ${need}+ for Risk ${risk}.`;
 else if(!coreOK)reason=`Need ${core} of ${members.length} members at Level ${need}+.`;
 else if(!avgOK)reason=`Party average must be at least Level ${Math.max(1,need-2)}.`;
 return{ok,risk,need,reason,qualified,core,avg,captain,captainOK,avgOK,coreOK};
}
function gc320QualificationHTML(p,c){
 const q=gc320PartyQualification(p,c);
 return`<div class="gc320Readiness ${q.ok?'ready':'blocked'}"><span>${q.ok?'QUALIFIED':'UNDERQUALIFIED'} • RISK ${q.risk}</span><b>Experienced benchmark Lv.${q.need}</b><small>${q.captain?`Captain ${esc(q.captain.name)} Lv.${q.captain.lvl} • `:''}${q.qualified}/${partyMembers(p).length} at benchmark • avg Lv.${q.avg.toFixed(1)}</small><em>${esc(q.reason)}</em></div>`;
}

/* Freeblade gates now use the same experience ladder. Reputation still matters
   because established crews do not hire an unknown blade for elite work. */
if(typeof GC310_LEVEL_REQUIREMENT!=='undefined')Object.assign(GC310_LEVEL_REQUIREMENT,GC320_RISK_LEVEL);
if(typeof gc310AssembleCrew==='function'){
 gc310AssembleCrew=function(c,p){
  const f=gc260Founder(),rid=c.regionId,risk=Number(c.risk)||1,need=Math.max(1,gc310CrewSize(c)-1),benchmark=gc320RiskLevel(risk);
  if(!f||!p)return[];
  p.members=[f.id];p.captainId=null;
  let candidates=gc310AvailablePool(rid,risk).filter(a=>(a.lvl||1)>=Math.max(1,benchmark-1));
  while(candidates.length<need){
   const newcomer=gc310MakeFreelancer(rid,clamp(benchmark+rnd(-1,2),1,GC194_MAX_LEVEL));
   gc310RegionPool(rid).push(newcomer);
   candidates=gc310AvailablePool(rid,risk).filter(a=>(a.lvl||1)>=Math.max(1,benchmark-1));
  }
  const chosen=candidates.slice(0,need).map(a=>gc310TakeFromPool(rid,a));
  chosen.forEach(a=>p.members.push(a.id));
  const lead=chosen.slice().sort((a,b)=>(b.lvl||1)-(a.lvl||1)||derived(b).combat.resolve-derived(a).combat.resolve)[0];
  p.captainId=lead?.id||f.id;
  return chosen;
 };
}

/* Company contracts require an experienced core. Rookies can be mentored into
   dangerous work, but they cannot make an unqualified party magically eligible. */
const _dispatchContractGC320=dispatchContract;
dispatchContract=function(cid,pid){
 const c=contractById(cid),p=state.parties.find(x=>x.id===pid);
 if(c&&p&&gc270IsCompany()&&!c.gc320Independent&&!p.gc320IndependentCrew){
  const q=gc320PartyQualification(p,c);if(!q.ok)return toast(q.reason);
 }
 return _dispatchContractGC320(cid,pid);
};
if(typeof gc280RiskAllowed==='function'){
 const _gc280RiskAllowedGC320=gc280RiskAllowed;
 gc280RiskAllowed=function(regionId,p,risk){
  if(!_gc280RiskAllowedGC320(regionId,p,risk))return false;
  return gc320PartyQualification(p,{risk}).ok;
 };
}
const _showChoosePartyGC320=showChooseParty;
showChooseParty=function(cid){
 const c=contractById(cid);if(!c||gc270IsFreeblade())return _showChoosePartyGC320(cid);
 const ps=localParties(c.regionId).filter(p=>!p.expedition&&p.members.length&&!p.gc320IndependentCrew);
 if(!ps.length)return toast('No staffed idle party.');
 modal(`<div class="sheetHead"><div><h3>Commit a Party</h3><div class="tiny muted">The contract tells you the danger before you commit. It does not promise survival.</div></div><button class="x" data-action="close">✕</button></div><div class="notice">${esc(c.title)} • Risk ${c.risk} • experienced benchmark Lv.${gc320RiskLevel(c.risk)} • approximately ${c.enemyCount} enemies.</div><div class="list" style="margin-top:8px">${ps.map(p=>{const prof=partyProfile(p),best=bestUtility(p,c.check),q=gc320PartyQualification(p,c);return`<div class="card"><div class="statline"><b>${esc(p.name)}</b><span>${p.members.length}/${partyCap(p.regionId)}</span></div><div class="tiny muted">ATK ${Math.round(prof.attack)} • GUARD ${Math.round(prof.guard)} • ${esc(c.check)} ${best.value}</div>${gc320QualificationHTML(p,c)}<div class="tiny gold">${best.a?`${esc(best.a.name)} is best suited to the field check.`:'No specialist.'}</div><button class="btn ${q.ok?'primary':''} wide" data-action="dispatch" data-id="${c.id}" data-party="${p.id}" ${q.ok?'':'disabled'}>${q.ok?'COMMIT PARTY':'NOT QUALIFIED'}</button></div>`}).join('')}</div>`);
};
const _contractCardGC320=contractCard;
contractCard=function(c){
 let html=_contractCardGC320(c),line=`<div class="gc320RiskGate"><b>Risk ${c.risk} professional benchmark: Lv.${gc320RiskLevel(c.risk)}</b><span>Captain + experienced core required. Veterans may bring developing adventurers.</span></div>`;
 return html.replace('<div class="actions">',line+'<div class="actions">');
};

/* Founder-present decisions stop the whole world and open immediately. */
function gc320PendingFounderParty(){
 return state?.parties?.find(p=>gc260FounderInParty(p)&&p.expedition?.gc260PendingDecision)||null;
}
function gc320ForcePause(reason){
 if(!state)return;gc199InitState(state);state.timeSystem.gc199Mode='paused';state.timeSystem.gc199PauseReason=reason||'Your decision is required.';GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());save();gc199UpdateClock();
}
function gc320OpenDecisionModal(p){
 const d=p?.expedition?.gc260PendingDecision;if(!p||!d)return;
 const label=p.expedition?.gc310Freelance?'FIELD AGENCY':'DIRECT COMMAND';
 modal(`<div class="gc320DecisionModal"><div class="gc320DecisionBanner"><span>SIMULATION PAUSED • ${label}</span><b>Your decision is required.</b><small>No company time passes until you choose.</small></div>${gc260PendingDecisionHTML(p,d)}</div>`);
}
const _gc260SetPendingGC320=gc260SetPending;
gc260SetPending=function(p,d){
 const e=p?.expedition,before=gc199Mode();if(!e)return;
 _gc260SetPendingGC320(p,d);
 if(!e.gc260PendingDecision)return;
 if(!e.gc320ResumeMode)e.gc320ResumeMode=before;
 gc320ForcePause(`${p.expedition?.gc310Freelance?'Field Agency':'Direct Command'} decision required.`);
 gc320OpenDecisionModal(p);
};
const _gc199SetModeGC320=gc199SetMode;
gc199SetMode=function(mode){
 const p=gc320PendingFounderParty();
 if(p&&mode!=='paused'){gc320ForcePause('Your expedition is waiting on a decision.');gc320OpenDecisionModal(p);return toast('Choose before time can resume.')}
 return _gc199SetModeGC320(mode);
};
const _closeModalGC320=closeModal;
closeModal=function(){
 const p=gc320PendingFounderParty();
 if(p){gc320OpenDecisionModal(p);return toast('This decision must be resolved before time resumes.')}
 return _closeModalGC320();
};
function gc320ResumeAfterDecision(mode){
 if(!state)return;
 gc199InitState(state);
 const next=mode==='fast'?'fast':mode==='play'?'play':'paused';
 state.timeSystem.gc199Mode=next;state.timeSystem.gc199PauseReason=next==='paused'?'Paused by player.':'';
 GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());save();gc199UpdateClock();
}
const _gc260ResolveDecisionGC320=gc260ResolveDecision;
gc260ResolveDecision=function(pid,choice){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition,resume=e?.gc320ResumeMode||'paused';
 const out=_gc260ResolveDecisionGC320(pid,choice);
 const now=state.parties.find(x=>x.id===pid),pending=now?.expedition?.gc260PendingDecision;
 if(pending){gc320ForcePause('Another expedition decision requires you.');gc320OpenDecisionModal(now);return out}
 _closeModalGC320();
 if(now?.expedition)delete now.expedition.gc320ResumeMode;
 gc320ResumeAfterDecision(resume);return out;
};

/* The founder always has the same four between-contract stances, before and
   after company founding. */
function gc320FounderStancesHTML(){
 const f=gc260Founder();if(!f)return'';
 const usable=f.status==='Ready'&&!gc260System()?.activity&&!gc260FounderParty()?.expedition;
 return`<div class="sectionTitle"><h3>Your Stance</h3><span>always available between contracts</span></div><div class="gc320FounderStances">${GC320_STANCES.map(st=>`<button class="card ${f.dailyOrder===st?'active':''}" data-action="gc320FounderStance" data-value="${st}" ${usable?'':'disabled'}>${gc202StanceScene(st)}<b>${esc(st)}</b><small>${esc(GC202_STANCE_INFO[st]?.desc||'')}</small></button>`).join('')}</div>${usable?'':`<div class="tiny muted">Your stance resumes when you are back and available.</div>`}`;
}
const _gc260RenderYouGC320=gc260RenderYou;
gc260RenderYou=function(){return _gc260RenderYouGC320()+gc320FounderStancesHTML()};
const _gc270FreebladeYouGC320=gc270FreebladeYou;
gc270FreebladeYou=function(){return _gc270FreebladeYouGC320()+gc320FounderStancesHTML()};

const _processActionGC320A=processAction;
processAction=function(el){
 if(el.dataset.action==='gc320FounderStance'){
  const f=gc260Founder(),st=el.dataset.value;if(!f||f.status!=='Ready'||!GC320_STANCES.includes(st)||gc260System()?.activity||gc260FounderParty()?.expedition)return toast('You cannot change stance while occupied.');
  f.dailyOrder=st;f.dailyMentorId=null;f.dailyFacility=null;if(typeof gc220RememberReturn==='function')gc220RememberReturn(f,st);sfx('tap');save();render();return;
 }
 return _processActionGC320A(el);
};
