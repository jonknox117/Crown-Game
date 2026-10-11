/* Grim Company v21.11.0 — objective-driven missions, using the existing combat engine.
   Objective state is saved in the expedition; dungeon/independent modes are exempt. */
const GC430_VERSION='21.11.0';
const GC430_OBJECTIVES={
 Hunt:{name:'Monster Hunt',desc:'Defeat the marked quarry before it flees.',classes:['March Ranger','Houndmaster','Crossbowman','Yumi Archer','Shinobi']},
 Escort:{name:'Escort',desc:'Keep the caravan intact while repelling the attackers.',classes:['Knight-Errant','Shieldthane','Spearwall','Battle Chaplain','Lumen Guard']},
 Rescue:{name:'Rescue',desc:'Extract prisoners before hostile forces recapture them.',classes:['Shinobi','Veilwalker','Horn Runner','Battle Chaplain','March Ranger']},
 Defense:{name:'Defense',desc:'Hold the settlement through the enemy assault.',classes:['Spearwall','Shieldthane','Knight-Errant','Man-at-Arms','War-Singer']},
 Assassination:{name:'Assassination',desc:'Eliminate the enemy commander before they escape.',classes:['Shinobi','Crossbowman','Yumi Archer','Veilwalker','Horn Runner']},
 Occult:{name:'Occult Purge',desc:'Interrupt the ritual and eliminate its conduit.',classes:['Rune-Seer','Spirit Scribe','Pattern-Savant','Lumen Guard','Star-Spear']}
};
function gc430Kind(c){
 if(!c||c.gc340Dungeon||c.gc320Independent)return null;
 return ({Hunt:'Hunt',Escort:'Escort',Caravan:'Escort',Rescue:'Rescue',Defense:'Defense',Assassination:'Assassination','Occult Purge':'Occult',Investigation:'Occult'})[c.type]||null;
}
function gc430Role(p,kind){return partyMembers(p).filter(a=>a.status!=='Dead'&&GC430_OBJECTIVES[kind]?.classes.includes(a.className)).length}
const _gc430GenerateContract=generateContract;
generateContract=function(rid){
 const c=_gc430GenerateContract(rid);
 if(c?.type==='Investigation')c.type='Occult Purge';
 return c;
};
function gc430Mission(p){
 const e=p?.expedition,kind=gc430Kind(e?.contract);
 if(!kind)return null;
 if(e.gc430Mission?.kind===kind)return e.gc430Mission;
 const m=e.gc430Mission={kind,status:'active',outcome:null,integrity:100,progress:0,pressure:0,
  rounds:0,priorityId:null,notes:[],objectiveText:GC430_OBJECTIVES[kind].desc};
 e.events=e.events||[];e.events.push('MISSION OBJECTIVE: '+m.objectiveText);
 return m;
}
const _gc430Dispatch=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_gc430Dispatch(cid,pid),p=state?.parties?.find(x=>x.id===pid);
 if(p?.expedition?.contract?.id===cid&&gc430Mission(p))save();
 return out;
};
function gc430Log(p,msg){
 const e=p.expedition,m=e.gc430Mission;
 m.notes.push(msg);if(m.notes.length>12)m.notes.shift();
 e.events=e.events||[];e.events.push('Objective: '+msg);
 if(e.battle){e.battle.log=e.battle.log||[];e.battle.log.push('OBJECTIVE — '+msg);}
}
function gc430SetOutcome(p,outcome,msg){
 const m=gc430Mission(p);if(!m||m.outcome)return false;
 m.outcome=outcome;m.status=outcome;gc430Log(p,msg);return true;
}
function gc430Priority(p){const m=p?.expedition?.gc430Mission,b=p?.expedition?.battle;return b?.enemies?.find(x=>x.id===m?.priorityId)||null;}
function gc430SetupBattle(p){
 const e=p?.expedition,b=e?.battle,m=gc430Mission(p);
 if(!b||!m||m.priorityId)return;
 if(['Hunt','Assassination','Occult'].includes(m.kind)&&b.enemies?.length){
  const target=m.kind==='Occult'?
   (b.enemies.find(x=>x.role==='Shaman')||b.enemies[0]):
   (b.enemies.find(x=>x.bossId)||b.enemies[0]);
  m.priorityId=target.id;target.gc430Objective=true;
  if(m.kind==='Occult'){target.name='Ritual Conduit';target.role='Shaman';target.supernatural=true;}
  if(m.kind==='Hunt'){target.name='Quarry — '+target.name;target.maxHp=Math.round(target.maxHp*1.25);target.hp=target.maxHp;}
  if(m.kind==='Assassination')target.name='Target — '+target.name;
  b.log.push('OBJECTIVE TARGET: '+target.name);
 }
 b.log.push('MISSION: '+m.objectiveText);
}
const _gc430StartBattle=startBattle;
startBattle=function(p){
 const out=_gc430StartBattle(p);
 if(p?.expedition?.battle&&!p.expedition.gc340Dungeon)gc430SetupBattle(p);
 return out;
};
function gc430Tick(p){
 const e=p?.expedition,b=e?.battle,m=e?.gc430Mission;
 if(!m||!b||m.outcome||e.gc340Dungeon)return null;
 m.rounds++;
 const targets=b.enemies.filter(x=>x.hp>0),target=gc430Priority(p);
 const count=targets.length,archers=targets.filter(x=>['Archer','Stalker'].includes(x.role)).length;
 const risk=clamp(Number(e.contract.risk)||1,1,5),roles=gc430Role(p,m.kind);
 const fieldSuccess=(e.checks||[]).some(x=>x.ok);
 if(['Hunt','Assassination'].includes(m.kind)){
  if(target?.hp<=0){gc430SetOutcome(p,'success','Priority target defeated.');return 'success';}
  const baseline=(m.kind==='Hunt'?19:23)+Math.max(0,risk-2)*4;
  m.pressure=clamp(m.pressure+Math.max(8,baseline-Math.min(13,roles*5)-(fieldSuccess?6:0)),0,100);
  if(m.pressure>=100){gc430SetOutcome(p,'failure',m.kind==='Hunt'?'The quarry escaped.':'The commander escaped.');return 'failure';}
  gc430Log(p,'Escape pressure '+Math.round(m.pressure)+'%.');
 }else if(['Escort','Defense'].includes(m.kind)){
  const baseline=m.kind==='Escort'?3+archers*8+Math.floor(count*.9):5+count*3;
  const loss=Math.max(1,baseline+Math.max(0,risk-2)*2-Math.min(20,roles*6)-(fieldSuccess?3:0));
  m.integrity=clamp(m.integrity-loss,0,100);
  if(m.integrity<=0){gc430SetOutcome(p,'failure',m.kind==='Escort'?'Caravan destroyed.':'Fortifications overrun.');return 'failure';}
  gc430Log(p,(m.kind==='Escort'?'Caravan':'Fortification')+' integrity '+Math.round(m.integrity)+'%.');
 }else if(m.kind==='Rescue'){
  const stealth=partyMembers(p).filter(a=>['Shinobi','Veilwalker','Horn Runner','March Ranger'].includes(a.className)).length;
  const medic=partyMembers(p).some(a=>a.className==='Battle Chaplain');
  m.progress=clamp(m.progress+15+Math.min(18,stealth*7)+(fieldSuccess?7:0),0,100);
  m.integrity=clamp(m.integrity-Math.max(2,Math.round(count*2.6)+risk*2-stealth*3-(medic?5:0)),0,100);
  if(m.integrity<=0){gc430SetOutcome(p,'failure','The prisoners were recaptured.');return 'failure';}
  if(m.progress>=100){gc430SetOutcome(p,'success','The prisoners escaped under cover.');return 'success';}
  gc430Log(p,'Extraction '+Math.round(m.progress)+'% • prisoners '+Math.round(m.integrity)+'%.');
 }else if(m.kind==='Occult'){
  if(target?.hp<=0){gc430SetOutcome(p,'success','Ritual conduit defeated.');return 'success';}
  const stop=target&&(target.gc360StaggerUntil>=b.round+1||target.gc360CurseUntil>=b.round+1||
   target.gc360BindUntil>=b.round+1||target.gc360SilenceUntil>=b.round+1);
  m.pressure=clamp(m.pressure+(stop?5:Math.max(9,26+Math.max(0,risk-2)*4-Math.min(19,roles*6)-(fieldSuccess?5:0))),0,100);
  if(m.pressure>=100){gc430SetOutcome(p,'failure','The ritual completed.');return 'failure';}
  gc430Log(p,'Ritual progress '+Math.round(m.pressure)+'%.');
 }
 return null;
}
const _gc430CombatRound=combatRound;
combatRound=function(p){
 const b=p?.expedition?.battle,m=gc430Mission(p);
 if(!b||!m||p.expedition.gc340Dungeon)return _gc430CombatRound(p);
 gc430SetupBattle(p);
 const before=gc430Tick(p);
 if(before==='failure')return resolveBattle(p,false);
 if(before==='success')return resolveBattle(p,true);
 const out=_gc430CombatRound(p);
 if(p?.expedition?.battle&&m.status==='active'){
  const target=gc430Priority(p);
  if(['Hunt','Assassination','Occult'].includes(m.kind)&&target?.hp<=0){
   gc430SetOutcome(p,'success','The marked target falls.');
   return resolveBattle(p,true);
  }
 }
 return out;
};
const _gc430ResolveBattle=resolveBattle;
resolveBattle=function(p,win){
 const e=p?.expedition,m=e?.gc430Mission,b=e?.battle;
 if(m&&b&&!e.gc340Dungeon){
  const target=gc430Priority(p);
  if(!m.outcome){
   if(['Hunt','Assassination','Occult'].includes(m.kind)){
    if(target?.hp<=0)gc430SetOutcome(p,'success','The objective target is down.');
    else gc430SetOutcome(p,win?'partial':'failure',win?'The defenders fell, but the target escaped.':'The mission target remains at large.');
   }else if(m.kind==='Rescue'){
    if(m.integrity>0&&m.progress>=70)gc430SetOutcome(p,'success','The prisoners have been freed.');
    else gc430SetOutcome(p,m.integrity>0&&m.progress>=35?'partial':'failure','The extraction ended before everyone escaped.');
   }else{
    gc430SetOutcome(p,win&&m.integrity>0?'success':m.integrity>=35?'partial':'failure',
     win&&m.integrity>0?'The protected objective survived.':'The defense was overcome.');
   }
  }
  win=m.outcome==='success';
 }
 return _gc430ResolveBattle(p,win);
};
let GC430_REPORT=null;
const _gc430ShowReport=showReport;
showReport=function(report){
 if(GC430_REPORT&&report?.regionId===GC430_REPORT.regionId&&report?.title===GC430_REPORT.title){
  report.gc430Outcome=GC430_REPORT.outcome;
  if(GC430_REPORT.outcome==='partial')report.pay=(Number(report.pay)||0)+GC430_REPORT.pay;
 }
 return _gc430ShowReport(report);
};
const _gc430FinishNoTime=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,m=e?.gc430Mission;
 if(!e||!m||e.gc340Dungeon)return _gc430FinishNoTime(p);
 if(!m.outcome){
  if(e.battleWon===false)gc430SetOutcome(p,'failure','The party was defeated.');
  else if(['Hunt','Assassination','Occult'].includes(m.kind))gc430SetOutcome(p,'partial','Objective completion was not confirmed.');
  else if(m.integrity<=0||m.kind==='Rescue'&&m.progress<35)gc430SetOutcome(p,'failure','The protected objective was lost.');
  else gc430SetOutcome(p,'success','The field objective was completed.');
 }
 e.battleWon=m.outcome==='success';
 const partial=m.outcome==='partial',pay=partial?Math.round(Math.max(0,e.contract.reward)*.25):0,prior=GC430_REPORT;
 GC430_REPORT={regionId:e.contract.regionId,title:e.contract.title,outcome:m.outcome,pay};
 if(partial){state.company.silver+=pay;pushHistory(p.name+' salvaged '+money(pay)+' from an incomplete '+e.contract.title+'.',e.contract.regionId);}
 try{return _gc430FinishNoTime(p)}finally{GC430_REPORT=prior;}
};
function gc430ObjectiveHTML(e){
 const m=e?.gc430Mission;if(!m)return '';
 const kind=m.kind,obj=GC430_OBJECTIVES[kind],value=kind==='Escort'||kind==='Defense'?m.integrity:kind==='Rescue'?m.progress:m.pressure;
 const label=kind==='Rescue'?'EXTRACTION':kind==='Escort'?'CARAVAN':kind==='Defense'?'FORTIFICATION':kind==='Occult'?'RITUAL':'ESCAPE';
 return '<section class="gc430Objective"><div><b>'+esc(obj?.name||'Objective')+'</b><strong>'+
  esc(m.outcome?m.outcome.toUpperCase():'IN PROGRESS')+'</strong></div><p>'+esc(m.objectiveText)+'</p>'+
  '<div class="gc430Stats"><span>'+label+'</span><b>'+Math.round(value)+'%</b></div><i><em style="width:'+
  clamp(value,0,100)+'%"></em></i>'+(kind==='Rescue'?'<small>Prisoner safety '+Math.round(m.integrity)+'%</small>':'')+
  (m.notes.length?'<small>'+esc(m.notes[m.notes.length-1])+'</small>':'')+'</section>';
}
const _gc430ContractCard=gc330ContractCard;
gc330ContractCard=function(c){
 const html=_gc430ContractCard(c),kind=gc430Kind(c);
 if(!kind)return html;
 const obj=GC430_OBJECTIVES[kind];
 return html.replace('<div class="gc330ContractFacts">',
  '<div class="gc430ContractBrief"><b>'+esc(obj.name.toUpperCase())+'</b><span>'+esc(obj.desc)+'</span></div><div class="gc330ContractFacts">');
};
const _gc430ExpeditionCard=gc330ExpeditionCard;
gc330ExpeditionCard=function(p){const html=_gc430ExpeditionCard(p),obj=gc430ObjectiveHTML(p?.expedition);return obj?html+obj:html;};
const _gc430CombatFocus=gc410CombatFocusHTML;
gc410CombatFocusHTML=function(p){
 const html=_gc430CombatFocus(p),obj=gc430ObjectiveHTML(p?.expedition);
 return obj?html.replace('<div class="gc410EnemyGrid">',obj+'<div class="gc410EnemyGrid">'):html;
};
const _gc430ManagerScore=gc413Score;
gc413Score=function(r,p,c){
 const raw=_gc430ManagerScore(r,p,c),kind=gc430Kind(c);
 if(raw===null||!kind)return raw;
 const count=gc430Role(p,kind),assessment=gc370Talent(gc280Commander(r))?.assessment;
 return raw+Math.min(4,count)*19-Math.max(0,2-count)*(assessment?18:11);
};
function gc430Style(){
 if(document.getElementById('gc430Style'))return;
 const s=document.createElement('style');s.id='gc430Style';
 s.textContent='.gc430Objective,.gc430ContractBrief{margin:9px 0;padding:10px;border:1px solid #665039;border-left:3px solid #b38a52;border-radius:7px;background:#1a1713;color:#d4bc96}'+
 '.gc430Objective>div:first-child{display:flex;justify-content:space-between;gap:8px;font-size:10px}.gc430Objective strong{font-size:9px;color:#c6a46a}'+
 '.gc430Objective p,.gc430ContractBrief span{display:block;margin:5px 0;font-size:10px;line-height:1.45;color:#b9ab93}'+
 '.gc430ContractBrief b{font-size:10px;color:#dbba83}.gc430Stats{display:flex;justify-content:space-between;font-size:9px}'+
 '.gc430Objective i{display:block;height:6px;margin:6px 0;background:#342c21;border-radius:4px;overflow:hidden}'+
 '.gc430Objective em{display:block;height:100%;border-radius:4px;background:#aa8550}'+
 '.gc430Objective small{display:block;margin-top:5px;color:#a89b85;font-size:9px}';
 document.head.appendChild(s);
}
gc430Style();
window.__GC430_TEST=function(){
 const original=state,oldSave=save,oldRender=render,oldToast=toast,checks={};
 try{
  save=function(){};render=function(){};toast=function(){};
  state=createState('Mission QA','veyric');state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';state.company.silver=100000;
  function create(type,cls){
   const a=generateAdventurer('veyric');a.status='Ready';a.className=cls;
   a.hp=derived(a).maxHp;state.roster.push(a);
   const p=makeParty('veyric',type+' QA');p.members=[a.id];p.captainId=a.id;
   p.expedition={contract:{id:uid('q'),regionId:'veyric',title:type+' QA',type,
    risk:2,enemyCount:2,check:'scout',species:'Bandit',reward:80},checks:[],events:[]};
   state.parties.push(p);const m=gc430Mission(p);
   p.expedition.battle={round:0,allies:[{charId:a.id,hp:100,maxHp:100}],
    enemies:[{id:uid('enemy'),hp:100,maxHp:100,name:'Caster',role:'Shaman',attack:10},
     {id:uid('enemy'),hp:100,maxHp:100,name:'Archer',role:'Archer',attack:10}],log:[]};
   gc430SetupBattle(p);return {p,m};
  }
  let x=create('Hunt','March Ranger');checks.huntTagged=!!gc430Priority(x.p)?.gc430Objective;
  for(let i=0;i<12&&!x.m.outcome;i++)gc430Tick(x.p);
  checks.huntEscapes=x.m.outcome==='failure';
  x=create('Assassination','Shinobi');gc430Priority(x.p).hp=0;
  checks.assassinationCanSucceed=gc430Tick(x.p)==='success';
  x=create('Escort','Knight-Errant');gc430Tick(x.p);
  checks.escortIntegrity=x.m.integrity>0&&x.m.integrity<100;
  for(let i=0;i<60&&!x.m.outcome;i++)gc430Tick(x.p);
  checks.escortCanFail=x.m.outcome==='failure';
  x=create('Defense','Spearwall');gc430Tick(x.p);
  checks.defenseIntegrity=x.m.integrity>0&&x.m.integrity<100;
  x=create('Rescue','Shinobi');
  for(let i=0;i<10&&!x.m.outcome;i++)gc430Tick(x.p);
  checks.rescueExtracts=x.m.outcome==='success'&&x.m.progress===100;
  x=create('Occult Purge','Rune-Seer');checks.ritualConduit=gc430Priority(x.p)?.role==='Shaman';
  for(let i=0;i<15&&!x.m.outcome;i++)gc430Tick(x.p);
  checks.ritualCanFail=x.m.outcome==='failure';
  checks.saveReload=!!normalizeState(JSON.parse(JSON.stringify(state))).parties.find(p=>p.id===x.p.id)?.expedition?.gc430Mission;
  checks.dungeonsUnaffected=gc430Kind({type:'Rescue',gc340Dungeon:true})===null;
  checks.legacyContractsUnaffected=gc430Kind({type:'Negotiation'})===null;
  checks.uiHasObjective=gc430ObjectiveHTML(x.p.expedition).includes('RITUAL');
  const failed=Object.keys(checks).filter(k=>!checks[k]);
  return {ok:failed.length===0,failed,...checks};
 }catch(e){return {ok:false,error:String(e?.stack||e),partial:checks}}
 finally{state=original;save=oldSave;render=oldRender;toast=oldToast;try{render()}catch(_){}}
};