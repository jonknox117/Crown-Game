/* Grim Company v20.8 — command audit and behavior check. */
const _auditGC280=audit;
audit=function(){
 const out=_auditGC280();
 out.v280Command=GC280_VERSION;
 out.realRosterCommanders=true;
 out.multiHQDelegation=true;
 out.commandersUseRealContracts=true;
 out.commandersUseRealParties=true;
 out.commandDirectives=true;
 out.commandRiskPolicy=true;
 out.directControlAlwaysAvailable=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC280_TEST=function(){
 const old=state;
 try{
  state=createState('Command Test','veyric');
  const f=gc260CreateFounderRecord('veyric',{name:'Founder Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  state.regions.skeld.hq.established=true;gc270Progression().phase='network';state.company.silver=500;
  const leader=generateAdventurer('veyric');leader.name='Commander Test';leader.lvl=12;leader.status='Ready';state.roster.push(leader);
  const crew=[];for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.lvl=6;a.status='Ready';state.roster.push(a);crew.push(a)}
  const managed=makeParty('veyric','Managed Test Company');managed.members=crew.slice(0,3).map(a=>a.id);managed.captainId=crew[0].id;state.parties.push(managed);gc250EnsureRiskBoard('veyric');
  const appointed=gc280Appoint('veyric',leader.id)===true,c=gc280CommandState('veyric');c.directive='Make Money';c.casualtyPolicy='Normal';c.autonomy=true;
  const acted=gc280CommandAct('veyric',true),realDispatch=!!managed.expedition&&!managed.members.includes(f.id),stanceReal=crew[3].dailyOrder==='Odd Jobs';
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=copy.regions.veyric.gc280Command.commanderId===leader.id&&copy.roster.find(a=>a.id===leader.id)?.status==='Command';
  return{ok:!!(appointed&&acted&&realDispatch&&stanceReal&&saveSafe),appointed,acted,realDispatch,stanceReal,saveSafe,directive:c.directive,policy:gc280EffectivePolicy('veyric')};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
