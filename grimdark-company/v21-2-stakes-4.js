/* Grim Company v21.2 — Stakes presentation, audit and behavior checks. */
function gc320InstallStyles(){
 if(document.getElementById('gc320Styles'))return;
 const st=document.createElement('style');st.id='gc320Styles';
 st.textContent=`
 .gc320RiskGate,.gc320Readiness{margin:7px 0;padding:7px 8px;border-left:2px solid #846b48;background:rgba(132,107,72,.055);border-radius:5px}.gc320RiskGate b,.gc320Readiness b{display:block;font-size:9px;color:#c8a96e}.gc320RiskGate span,.gc320Readiness small,.gc320Readiness em{display:block;margin-top:2px;font-size:8px;line-height:1.35;color:#9d907d;font-style:normal}.gc320Readiness.blocked{border-left-color:#8e463e;background:rgba(142,70,62,.07)}.gc320Readiness.blocked span{color:#d08376}.gc320Readiness.ready span{color:#c5ad74}
 .gc320DecisionBanner{margin-bottom:8px;padding:11px;border:1px solid #a36e3f;border-left:4px solid #c48a4e;border-radius:8px;background:linear-gradient(135deg,#2b1c11,#120d09);box-shadow:0 10px 30px rgba(0,0,0,.35)}.gc320DecisionBanner.danger{border-color:#9b4d43;border-left-color:#c55b4c;background:linear-gradient(135deg,#2a1310,#110908)}.gc320DecisionBanner span{display:block;font-size:8px;letter-spacing:.15em;color:#d2a464}.gc320DecisionBanner b{display:block;margin-top:3px;font:700 19px Georgia,serif}.gc320DecisionBanner small{display:block;margin-top:4px;font-size:9px;color:#aa9b87}.gc320DecisionModal .gc260Decision{margin-bottom:0}
 .gc320DownedStrip{margin:8px 0;padding:7px 8px;border:1px solid rgba(180,69,57,.32);border-left:3px solid #b64b40;border-radius:5px;background:rgba(130,40,34,.09)}.gc320DownedStrip b{display:block;font-size:8px;letter-spacing:.12em;color:#dc7b6d}.gc320DownedStrip span{display:block;margin-top:2px;font-size:8px;color:#bba195}.gc320DownedUnit{border-color:#8c443d!important;background:rgba(110,38,32,.11)!important}.gc320DownedUnit .unitTop span{color:#dd7467;font-weight:800}.gc320MortalTag{margin-top:3px;font-size:7px;letter-spacing:.08em;color:#c76a5e}
 .gc320FounderStances{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.gc320FounderStances .card{margin:0;padding:7px;text-align:center}.gc320FounderStances .card.active{border-color:#b48b51;background:rgba(180,139,81,.08)}.gc320FounderStances .gc202StanceScene{min-height:52px}.gc320FounderStances b{display:block;font-size:9px;margin-top:3px}.gc320FounderStances small{display:block;margin-top:2px;font-size:7px;line-height:1.25;color:#938674}.gc320FounderStances button:disabled{opacity:.42}
 .gc320IndependentHero{margin-bottom:8px}.gc320IndependentHero strong{color:#d4b06f}.gc320IndependentContract.locked{opacity:.62}
 @media(max-width:440px){.gc320FounderStances{grid-template-columns:repeat(2,1fr)}}
 `;
 document.head.appendChild(st);
}
gc320InstallStyles();

const _gc193DailyDashboardGC320=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC320().replace('v21.1 • FREELANCER ECONOMY','v21.2 • STAKES')};

const _auditGC320=audit;
audit=function(){
 const out=_auditGC320();
 out.v320Stakes=GC320_VERSION;
 out.founderDecisionGlobalPause=true;
 out.companyContinuesDuringFounderDecision=false;
 out.decisionAutoPopup=true;
 out.riskLockedByExperience=true;
 out.downedMortalDanger=true;
 out.retreatIsStrategic=true;
 out.lossCanRemoveCapability=true;
 out.independentWorkAfterFounding=true;
 out.founderFourStancesAlways=true;
 out.fairBeforePunishingAfter=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC320_TEST=function(){
 const old=state;
 try{
  state=createState('Stakes Test','veyric');state.regions.veyric.hq.established=true;
  const f=gc260CreateFounderRecord('veyric',{name:'Stakes Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  gc270Progression().phase='company';f.status='Ready';f.dailyOrder='Train';
  const p=makeParty('veyric','Stakes Company'),crew=[];
  for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=1;state.roster.push(a);crew.push(a)}
  p.members=crew.map(a=>a.id);p.captainId=crew[0].id;state.parties.push(p);
  const c={id:'stakes-risk4',risk:4,regionId:'veyric',check:'scout',title:'Stakes Test',enemyCount:8};
  const blocked=!gc320PartyQualification(p,c).ok;
  crew[0].missions=25;crew[1].missions=25;crew[2].missions=25;crew[3].missions=0;
  const qualified=gc320PartyQualification(p,c).ok;
  const ladder=[1,2,3,4,5].map(gc320RiskLevel).join(',')==='1,3,6,10,15';
  const stanceHTML=gc320FounderStancesHTML(),stances=GC320_STANCES.every(x=>stanceHTML.includes(x));
  const board=gc320IndependentBoard('veyric'),independent=board.length===5&&board.every(x=>x.gc320Independent)&&contractById(board[0].id)?.id===board[0].id;
  const fp=makeParty('veyric','Decision Test');fp.members=[f.id];fp.captainId=f.id;state.parties.push(fp);f.status='Expedition';fp.expedition={contract:{id:'decision',risk:1,regionId:'veyric',title:'Decision Test',check:'scout'},events:[],checks:[],battle:null,progress:20};
  state.timeSystem.gc199Mode='fast';gc260SetPending(fp,{type:'field',key:'scout',title:'Decision Test',scene:'A dangerous road.',delegateId:null});
  const pause=gc199Mode()==='paused'&&fp.expedition.gc320ResumeMode==='fast'&&document.getElementById('modal')?.classList.contains('show');
  fp.expedition.gc260PendingDecision=null;delete fp.expedition.gc320ResumeMode;_closeModalGC320();f.status='Ready';fp.expedition=null;
  const low=GC320_MORTAL_BASE[1],high=GC320_MORTAL_BASE[5],mortality=high>low&&high>=.5;
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=Array.isArray(copy.founderSystem?.gc320IndependentBoards?.veyric);
  return{ok:!!(blocked&&qualified&&ladder&&stances&&independent&&pause&&mortality&&saveSafe),blocked,qualified,ladder,stances,independent,pause,mortality,lowRiskDowned:low,highRiskDowned:high,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old;try{_closeModalGC320()}catch(_){}}
};
