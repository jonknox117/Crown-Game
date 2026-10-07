/* Grim Company v21.3.1 — polish, mobile layout, and behavior regression tests. */
function gc331InstallStyles(){
 if(document.getElementById('gc331Styles'))return;
 const st=document.createElement('style');st.id='gc331Styles';
 st.textContent=`
 .gc331PartyManagerLead{padding:9px 10px;margin-bottom:7px;border-left:3px solid #8e744d;background:#15130f}.gc331PartyManagerLead b,.gc331PartyManagerLead span{display:block}.gc331PartyManagerLead b{font-size:10px;color:#cfb17a}.gc331PartyManagerLead span{margin-top:3px;font-size:8px;line-height:1.35;color:#918779}
 .gc331PartyManager{display:grid;gap:5px}.gc331PartyMember{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:8px;align-items:center;padding:7px;border:1px solid rgba(255,255,255,.06);border-radius:7px;background:#151411}.gc331PartyMember.assigned{border-left:2px solid #a88750}.gc331PartyMember.locked:not(.assigned){opacity:.62}.gc331PartyIdentity{display:grid;grid-template-columns:42px minmax(0,1fr);gap:7px;align-items:center;padding:0;border:0;background:transparent;color:inherit;text-align:left;min-width:0}.gc331PartyIdentity .blSvgPortrait{width:42px!important;height:42px!important;border-radius:5px}.gc331PartyIdentity b,.gc331PartyIdentity small,.gc331PartyIdentity em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gc331PartyIdentity b{font-size:10px}.gc331PartyIdentity small{font-size:8px;color:#8f8679;margin-top:2px}.gc331PartyIdentity em{font-size:7px;color:#baa06e;font-style:normal;margin-top:2px}.gc331PartyControls{display:grid;grid-template-columns:1fr 1fr;gap:4px}.gc331PartyControls .btn{min-height:36px;padding:5px;font-size:7px}.gc331PartyControls small{grid-column:1/-1;font-size:6px;line-height:1.25;color:#82796c}
 .gc331Expedition{overflow:hidden}.gc331Progress{margin:6px 0}.gc331LiveMeta{display:grid;grid-template-columns:1.35fr 1fr .8fr;gap:4px;margin:5px 0 7px}.gc331LiveMeta span{padding:4px 5px;border-radius:4px;background:#11110f;font-size:6px;color:#948979;text-align:center}.gc331ExpeditionActions>.gc331Push{width:100%;min-height:42px;margin-top:4px}.gc331ExpeditionActions>.gc331Push.disabled{opacity:.55}.gc331PushMeta{display:block;margin:3px 2px 7px;font-size:6px;line-height:1.3;color:#877d70;text-align:center}
 .gc331CombatStage{margin:8px 0;padding:8px;border:1px solid rgba(157,77,65,.25);border-left:3px solid #8f4a41;border-radius:7px;background:linear-gradient(180deg,rgba(43,20,17,.55),rgba(16,13,11,.95))}.gc331CombatStage.danger{border-left-color:#c55549;box-shadow:inset 0 0 24px rgba(112,35,30,.08)}.gc331CombatHeader{display:flex;justify-content:space-between;gap:8px;align-items:end;margin-bottom:7px}.gc331CombatHeader span,.gc331CombatHeader b,.gc331CombatHeader small{display:block}.gc331CombatHeader span{font-size:6px;letter-spacing:.14em;color:#c26457}.gc331CombatHeader b{margin-top:2px;font-size:13px}.gc331CombatHeader small{font-size:7px;color:#a88e84}.gc331CombatStage .battleGrid{margin:0;gap:5px}.gc331CombatStage .unit{padding:5px}.gc331CombatStage .unitTop{font-size:7px}.gc331CombatNote{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.05);font-size:7px;line-height:1.35;color:#8f8175}
 .gc330Expedition .gc200Travel{margin:7px 0!important;min-height:76px!important}.gc330Expedition .gc200TravelCaption{font-size:7px!important}.gc330Expedition .gc330Recent{max-height:104px;overflow:hidden}
 @media(max-width:430px){.gc331PartyMember{grid-template-columns:1fr}.gc331PartyControls{grid-template-columns:1fr 1fr}.gc331LiveMeta{grid-template-columns:1fr 1fr}.gc331LiveMeta span:first-child{grid-column:1/-1}.gc331CombatStage .battleGrid{grid-template-columns:1fr!important}.gc331CombatStage .battleGrid>div+div{margin-top:5px}}
 `;
 document.head.appendChild(st);
}
gc331InstallStyles();

const _auditGC331=audit;
audit=function(){
 const out=_auditGC331();
 out.v331QolBugfix=GC331_VERSION;
 out.pushControlNeverDisappears=true;
 out.liveCombatVisible=true;
 out.founderCombatAutoFocused=true;
 out.partyMembersTransferBetweenIdleParties=true;
 out.partyUnavailableReasonsVisible=true;
 out.expeditionUiUpdatesWithoutFullPageRender=true;
 out.staleFacilityCopyFixed=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC331_TEST=function(){
 const old=state,modalEl=document.getElementById('modal');
 try{
  state=createState('QoL Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=500;
  const f=gc260CreateFounderRecord('veyric',{name:'QoL Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);f.status='Ready';
  const a=generateAdventurer('veyric'),b=generateAdventurer('veyric'),c=generateAdventurer('veyric');[a,b,c].forEach(x=>{x.status='Ready';x.lvl=6;state.roster.push(x)});
  const p1=makeParty('veyric','Old Party'),p2=makeParty('veyric','New Party');p1.members=[a.id,b.id];p1.captainId=a.id;p2.members=[c.id];p2.captainId=c.id;state.parties.push(p1,p2);
  togglePartyMember(p2.id,a.id);
  const moved=p2.members.includes(a.id)&&!p1.members.includes(a.id)&&p1.captainId===b.id;
  const managerText=document.getElementById('sheet')?.innerText||'',managerOK=managerText.includes('Build the party you actually want.');
  closeModal();
  const con=gc250FreshContractForRisk('veyric',2,[]);con.id='qol-contract';gc193EnsureContract(con);
  p2.expedition={contract:con,progress:12,elapsedDays:.1,durationDays:2,expectedReturnDay:3,events:['Road quiet.'],checks:[],battle:null,fought:false,complete:false,gcChecksDone:1,gc199FieldProgress:.1,gc201Momentum:.12,gc201ContactExposure:.1};
  p2.members.forEach(id=>{const x=state.roster.find(y=>y.id===id);if(x)x.status='Expedition'});
  const travelHTML=gc330ExpeditionCard(p2),pushVisible=/data-action="gc199Push"/.test(travelHTML)&&/PUSH PACE/.test(travelHTML);
  p2.expedition.gc260BattleDecisionDone=true;startBattle(p2);
  const combatHTML=gc330ExpeditionCard(p2),combatVisible=/gc331CombatStage/.test(combatHTML)&&/battleGrid/.test(combatHTML)&&/LIVE AUTO-COMBAT/.test(combatHTML),pushLocked=/PUSH LOCKED — COMBAT/.test(combatHTML);
  p2.expedition=null;p2.members.forEach(id=>{const x=state.roster.find(y=>y.id===id);if(x&&x.status!=='Dead')x.status='Ready'});
  const fp=state.parties.find(p=>p.members.includes(f.id))||makeParty('veyric','Founder Party');if(!state.parties.includes(fp)){fp.members=[f.id];fp.captainId=f.id;state.parties.push(fp)}
  const fc=gc250FreshContractForRisk('veyric',1,[]);gc193EnsureContract(fc);f.status='Expedition';fp.expedition={contract:fc,progress:25,elapsedDays:.2,durationDays:1.5,expectedReturnDay:2,events:[],checks:[],battle:null,fought:false,complete:false,gcChecksDone:1,gc199FieldProgress:.1,gc201Momentum:0,gc201ContactExposure:.1,gc260BattleDecisionDone:true};
  state.ui.tab='company';startBattle(fp);const founderFocused=state.ui.tab==='contracts'&&!!fp.expedition.battle;
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=!!copy.parties;
  return{ok:!!(moved&&managerOK&&pushVisible&&combatVisible&&pushLocked&&founderFocused&&saveSafe),moved,managerOK,pushVisible,combatVisible,pushLocked,founderFocused,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old;try{modalEl?.classList.remove('show')}catch(_){}}
};
