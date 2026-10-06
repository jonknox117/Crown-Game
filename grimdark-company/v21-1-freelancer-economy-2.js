/* Grim Company v21.1 — full-contract freeblade dispatch, individual shares, and founding reputation. */
let GC310_REPORT_CONTEXT=null;

function gc310AcceptContract(cid){
 if(!state||!gc270IsFreeblade())return;
 const c=contractById(cid),f=gc260Founder(),p=gc260FounderParty();
 if(!c||!f||!p)return toast('That contract is no longer available.');
 if(p.expedition||f.status!=='Ready')return toast('You are not available for another contract yet.');
 const gate=gc310Eligibility(c,f);
 if(!gate.ok)return toast(`Need Level ${gate.minLevel} and ${gate.minRep} Freeblade Reputation for Risk ${gate.risk}.`);
 const crew=gc310AssembleCrew(c,p),tempIds=crew.map(a=>a.id);
 p.tactic=p.tactic||'Balanced';p.cohesion=0;
 const out=dispatchContract(cid,p.id);
 if(!p.expedition){
  gc310ReturnFreelancers(p,tempIds,c.regionId);
  return out;
 }
 p.expedition.gc310Freelance=true;
 p.expedition.gc310TemporaryIds=tempIds;
 p.expedition.gc310CrewNames=[f.name,...crew.map(a=>a.name)];
 p.expedition.gc310CrewSize=p.members.length;
 p.expedition.gc310ClientValue=gc310ClientValue(c);
 p.expedition.events.unshift(`Independent contract crew assembled: ${p.expedition.gc310CrewNames.join(', ')}.`);
 state.ui.tab='jobs';save();render();
 return out;
}

function gc310ReputationGain(c,win){
 if(!win)return 0;
 return Math.max(2,(Number(c?.risk)||1)*2);
}

const _showReportGC310=showReport;
showReport=function(r){
 if(!GC310_REPORT_CONTEXT)return _showReportGC310(r);
 const ctx=GC310_REPORT_CONTEXT;
 ctx.originalPay=Number(r?.pay)||0;
 ctx.clientValue=gc310ClientValue(ctx.contract,ctx.originalPay||ctx.contract.reward);
 ctx.share=ctx.win?gc310ShareFromPay(ctx.contract,ctx.originalPay||ctx.contract.reward,ctx.crewSize):0;
 const copy={...r,pay:ctx.share};
 const out=_showReportGC310(copy),sheet=document.getElementById('sheet');
 if(sheet){
  const names=(ctx.crewNames||[]).map(esc).join(' • ');
  sheet.insertAdjacentHTML('afterbegin',`<div class="gc310ShareReport"><span>INDEPENDENT MERCENARY CONTRACT</span><b>Client value ${money(ctx.clientValue)} • Your share ${money(ctx.share)}</b><small>${names}</small><em>The remaining value covers the other mercenaries, organizer share and ordinary field expenses.</em></div>`);
 }
 return out;
};

const _gc193FinishNoTimeGC310=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition;
 if(!e?.gc310Freelance)return _gc193FinishNoTimeGC310(p);
 const c=e.contract,fb=gc310Freeblade(),f=gc260Founder(),silverBefore=state.company.silver,renownBefore=state.company.renown;
 const tempIds=[...(e.gc310TemporaryIds||[])],crewNames=[...(e.gc310CrewNames||[])],crewSize=Number(e.gc310CrewSize)||p.members.length,win=e.battleWon!==false;
 const ctx={contract:c,crewNames,crewSize,win,originalPay:0,share:0,clientValue:gc310ClientValue(c)};
 GC310_REPORT_CONTEXT=ctx;
 let out;
 try{out=_gc193FinishNoTimeGC310(p)}
 finally{GC310_REPORT_CONTEXT=null}
 const fullGain=Math.max(0,state.company.silver-silverBefore);
 const payBase=ctx.originalPay||fullGain||Number(c.reward)||0;
 const share=win?(ctx.share||gc310ShareFromPay(c,payBase,crewSize)):0;
 state.company.silver=silverBefore+share;
 state.company.renown=renownBefore;
 fb.completed=(Number(fb.completed)||0)+1;
 if(win)fb.successes=(Number(fb.successes)||0)+1;else fb.failures=(Number(fb.failures)||0)+1;
 const rep=gc310ReputationGain(c,win);fb.reputation=(Number(fb.reputation)||0)+rep;
 if(f){
  f.history=f.history||[];
  f.history.push(`Day ${state.company.day}: ${win?'completed':'failed'} ${c.title} with an independent crew${win?` for a ${money(share)} personal share`:''}.`);
 }
 tempIds.forEach(id=>{
  const a=state.roster.find(x=>x.id===id);
  if(a){
   a.history=a.history||[];
   a.history.push(`Day ${state.company.day}: ${win?'completed':'failed'} ${c.title} alongside ${f?.name||'another freeblade'}.`);
  }
 });
 gc310ReturnFreelancers(p,tempIds,c.regionId);
 gc310EnsurePool(c.regionId);
 gc199RecordFeed(`FREEBLADE — ${c.title}: ${win?`completed for ${money(share)} personal share`:'failed'}${rep?` • +${rep} reputation`:''}.`,'field');
 save();
 return out;
};

gc270FoundingReady=function(){
 const fb=gc310Freeblade(),f=gc260Founder();
 return!!(gc270IsFreeblade()&&f&&f.status==='Ready'&&!gc260FounderParty()?.expedition&&(fb?.reputation||0)>=GC310_FOUNDING_REP&&state.company.silver>=GC270_FOUNDING_COST);
};

const _gc270FoundCompanyGC310=gc270FoundCompany;
gc270FoundCompany=function(name){
 const fb=gc310Freeblade(),rep=Number(fb?.reputation)||0,rid=fb?.startRegion||state.currentRegion;
 const ok=_gc270FoundCompanyGC310(name);
 if(ok){
  state.company.renown=Math.max(Number(state.company.renown)||0,Math.floor(rep/2));
  refreshRecruits(rid);
  const f=gc260Founder();
  if(f){
   f.history=f.history||[];
   f.history.push(`Day ${state.company.day}: entered company ownership with ${rep} Freeblade Reputation.`);
  }
  pushHistory(`${state.company.name} began with a founder already known from ${fb?.successes||0} independent contract wins.`,rid);
  save();render();
 }
 return ok;
};

if(typeof gc260PendingDecisionHTML==='function'){
 const _gc260PendingDecisionHTMLGC310=gc260PendingDecisionHTML;
 gc260PendingDecisionHTML=function(p,d){
  let html=_gc260PendingDecisionHTMLGC310(p,d);
  if(p?.expedition?.gc310Freelance){
   html=html.replace(/DIRECT COMMAND/g,'FIELD AGENCY');
   html=html.replace('Because you are physically here, you choose how the first engagement develops.','You are part of this hired crew, so you can influence how the first engagement develops.');
   html=html.replace('Only this expedition is waiting. Every other company activity continues normally.','Only this contract crew is waiting on your response.');
  }
  return html;
 };
}
const _expeditionCardGC310=expeditionCard;
expeditionCard=function(p){
 let html=_expeditionCardGC310(p);
 if(p?.expedition?.gc310Freelance){
  html=html.replace(/YOU ARE HERE • DIRECT COMMAND/g,'YOU ARE HERE • FIELD AGENCY');
  html=html.replace(/YOU ARE HERE • DECISION WAITING/g,'YOU ARE HERE • DECISION WAITING');
  const e=p.expedition,crew=(e.gc310CrewNames||[]).map(esc).join(' • ');
  const strip=`<div class="gc310CrewStrip"><span>HIRED CONTRACT CREW</span><b>${crew}</b><small>Client value ${money(e.gc310ClientValue||gc310ClientValue(e.contract))} • Your expected share ≈ ${money(gc310ShareFromPay(e.contract,e.contract.reward,e.gc310CrewSize||p.members.length))}</small></div>`;
  html=html.replace('<div class="actions">',strip+'<div class="actions">');
 }
 return html;
};
