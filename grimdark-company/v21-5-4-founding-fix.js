/* Grim Company v21.5.4 — founding milestone visibility fix. */
const GC354_VERSION='21.5.4';

function gc354FoundingEarned(){
 const p=gc270Progression(),fb=typeof gc310Freeblade==='function'?gc310Freeblade():p?.freeblade;
 const reputationReady=typeof GC310_FOUNDING_REP!=='undefined'?(Number(fb?.reputation)||0)>=GC310_FOUNDING_REP:null;
 const legacyReady=(Number(fb?.successes)||0)>=GC270_REQUIRED_WINS;
 return!!(gc270IsFreeblade()&&fb&&(reputationReady===null?legacyReady:reputationReady)&&state.company.silver>=GC270_FOUNDING_COST);
}

gc270FoundingReady=function(){
 const f=gc260Founder(),p=gc260FounderParty();
 return!!(gc354FoundingEarned()&&f&&f.status!=='Dead'&&!p?.expedition);
};

gc270FoundingStatusHTML=function(){
 const fb=typeof gc310Freeblade==='function'?gc310Freeblade():gc270Progression().freeblade;
 const useRep=typeof GC310_FOUNDING_REP!=='undefined',progress=useRep?Math.min(Number(fb?.reputation)||0,GC310_FOUNDING_REP):Math.min(Number(fb?.successes)||0,GC270_REQUIRED_WINS),need=useRep?GC310_FOUNDING_REP:GC270_REQUIRED_WINS,silver=Math.min(state.company.silver,GC270_FOUNDING_COST);
 const earned=gc354FoundingEarned(),ready=gc270FoundingReady(),pct=Math.min(100,((progress/need)+(silver/GC270_FOUNDING_COST))*50);
 let action='';
 if(earned){
  action=ready
   ?'<button class="btn primary wide" data-action="gc270FoundAsk">FOUND GRIM COMPANY</button>'
   :'<button class="btn primary wide" disabled>RETURN TO TOWN TO FOUND COMPANY</button><div class="tiny muted">You have earned the milestone. Finish the current job and the founding option will be ready.</div>';
 }else{
  action='<div class="tiny muted">Survive a few jobs and save enough to lease a chapterhouse. You can keep working alone after the opportunity unlocks.</div>';
 }
 const progressLabel=useRep?'Freeblade Reputation '+Math.round(Number(fb?.reputation)||0)+'/'+GC310_FOUNDING_REP:'Successful jobs '+(Number(fb?.successes)||0)+'/'+GC270_REQUIRED_WINS;
 return'<div class="gc270Founding '+(earned?'ready':'')+'"><div class="statline"><div><span>FIRST MAJOR MILESTONE</span><b>'+(earned?'You can found a company.':'Build a name worth following.')+'</b></div><strong>'+Math.round(progress)+'/'+need+'</strong></div><div class="tiny muted">'+progressLabel+' • Silver '+Math.round(state.company.silver)+'/'+GC270_FOUNDING_COST+'</div><div class="bar goldbar"><i style="width:'+pct+'%"></i></div>'+action+'</div>';
};

const _auditGC354=audit;
audit=function(){
 const out=_auditGC354();
 out.v354FoundingVisibility=GC354_VERSION;
 out.foundingMilestonePersistsAfterEarned=true;
 out.recoveryDoesNotHideFoundCompany=true;
 out.fieldFoundingShowsReturnRequirement=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC354_TEST=function(){
 const old=state;
 try{
  gc270CreateFreebladeState('veyric',{name:'Founding Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1});
  const f=gc260Founder(),fb=typeof gc310Freeblade==='function'?gc310Freeblade():gc270Progression().freeblade;
  if(typeof GC310_FOUNDING_REP!=='undefined')fb.reputation=GC310_FOUNDING_REP;else fb.successes=GC270_REQUIRED_WINS;
  state.company.silver=GC270_FOUNDING_COST+20;
  f.status='Recovering';
  const recoveringReady=gc270FoundingReady();
  const recoveringHtml=gc270FoundingStatusHTML();
  const buttonVisible=recoveringHtml.includes('FOUND GRIM COMPANY');
  const p=gc260FounderParty();
  p.expedition={contract:{title:'Test'},progress:0};
  const fieldReady=gc270FoundingReady();
  const fieldHtml=gc270FoundingStatusHTML();
  const fieldVisible=fieldHtml.includes('RETURN TO TOWN TO FOUND COMPANY');
  p.expedition=null;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(recoveringReady&&buttonVisible&&!fieldReady&&fieldVisible&&integrity),recoveringReady,buttonVisible,fieldReady,fieldVisible,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};