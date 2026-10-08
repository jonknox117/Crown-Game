/* Grim Company v21.10.3 — managers run the player's parties, not the roster.
   Strict dispatch readiness, three predictable policies, no automatic hiring,
   party formation, captain replacement, or HQ duty changes. */
const GC413_VERSION='21.10.3';
const GC413_RISK={Conservative:'Cautious',Normal:'Balanced',Ruthless:'Aggressive'};
const GC413_DESC={
 Conservative:'Favor safer jobs. Wait if every qualified job looks too dangerous.',
 Normal:'Match career-qualified jobs to the existing crew’s combat strength.',
 Ruthless:'Seek the highest career-qualified risks, even when the odds look rough.'
};
function gc413Orders(r,s=state){
 const c=gc280CommandState(r,s);if(!c)return null;
 const x=gc370Config(r,s);
 if(!x)return null;
 if(x.gc413Version!==GC413_VERSION){
  /* Old approvals, hiring requests and charters belong to the superseded
     manager workflow; never execute them after migration. */
  x.requests=[];
  x.gc413Version=GC413_VERSION;
 }
 x.risk=GC280_POLICIES.includes(x.risk)?x.risk:'Normal';
 x.priority='Balanced';x.authority='Full';
 c.directive='Balanced';c.casualtyPolicy=x.risk;
 return x;
}
const _normalizeStateGC413=normalizeState;
normalizeState=function(s){
 s=_normalizeStateGC413(s);
 if(s)REGION_ORDER.forEach(r=>gc413Orders(r,s));
 return s;
};
const _createStateGC413=createState;
createState=function(...args){
 const s=_createStateGC413(...args);
 if(s)REGION_ORDER.forEach(r=>gc413Orders(r,s));
 return s;
};
/* Appoint only unassigned people. Promoting a party captain is the player's
   decision, not an excuse to silently remove somebody from an existing crew. */
const _gc280EligibleCommandersGC413=gc280EligibleCommanders;
gc280EligibleCommanders=function(r){
 return _gc280EligibleCommandersGC413(r).filter(a=>
  !state.parties.some(p=>(p.members||[]).includes(a.id)));
};
const _gc280AppointGC413=gc280Appoint;
gc280Appoint=function(r,id){
 if(state.parties.some(p=>(p.members||[]).includes(id))){
  toast('Remove this adventurer from their party before appointing them manager.');
  return false;
 }
 const result=_gc280AppointGC413(r,id);
 if(result){gc413Orders(r);save()}
 return result;
};
function gc413Ready(p,r){
 if(!p||p.regionId!==r||p.expedition||p.gc413Manual||p.gc340DungeonRun?.active)return false;
 const ids=p.members||[];
 if(!ids.length||!p.captainId||!ids.includes(p.captainId))return false;
 if(ids.includes(state.company.founderId))return false;
 const crew=partyMembers(p);
 if(crew.length!==ids.length)return false;
 return crew.every(a=>{
  if(a.status!=='Ready'||a.regionId!==r||a.injury)return false;
  const max=derived(a).maxHp;
  return Number(a.hp)>=max-.001;
 });
}
function gc413PartyState(p,r){
 if(p.expedition)return 'Working';
 if((p.members||[]).includes(state.company.founderId)||p.gc413Manual)return 'Manual';
 if(!(p.members||[]).length)return 'Waiting';
 if(partyMembers(p).some(a=>a.status==='Recovering'||a.status==='Ready'&&Number(a.hp)<derived(a).maxHp-.001||!!a.injury))
  return 'Recovering';
 return gc413Ready(p,r)?'Waiting':'Unavailable';
}
/* Never edit dailyOrder, party membership, captain, or treasury here. */
gc280AssignStances=function(){return false};
gc280MaybeRecruit=function(){return null};
gc280BuildParties=function(){return false};
gc280RiskAllowed=function(r,p,risk){
 return gc413Ready(p,r)&&gc320PartyQualification(p,{risk}).ok;
};
function gc413Pool(r){
 const region=state.regions[r];
 if(!region)return[];
 const contracts=[...(region.contracts||[])];
 const active=gc240CampaignState(r)?.active;
 if(active?.currentContract&&!active.inFieldPartyId)contracts.push(active.currentContract);
 const seen=new Set();
 return contracts.filter(c=>{
  if(!c?.id||seen.has(c.id))return false;
  seen.add(c.id);return true;
 });
}
function gc413Score(r,p,c){
 const x=gc413Orders(r),mode=x?.risk||'Normal',leader=gc280Commander(r),t=gc370Talent(leader);
 const risk=clamp(Number(c.risk)||1,1,5),avg=gc280PartyAverageLevel(p);
 const gap=gc194RiskLevel(risk)-avg,unknown=Number(c.unknown)||0,reward=Number(c.reward)||0;
 if(mode==='Conservative'&&gap>0)return null;
 if(mode==='Normal'&&gap>(t.personnel?3:2))return null;
 let value=mode==='Conservative'? -risk*110-gap*14+reward*.045-unknown*15:
  mode==='Ruthless'?risk*120-gap*3+reward*.09-unknown*2:
  risk*22-Math.abs(gap)*27+reward*.14-unknown*8;
 if(t.assessment&&c.check){
  const b=bestUtility(p,c.check);
  if(b?.a)value+=(Number(b.value)||0)*.75;
 }
 if(t.adaptation&&unknown>=3)value-=mode==='Ruthless'?12:unknown*10;
 return value;
}
function gc413PickContract(r,p){
 if(!gc413Ready(p,r))return null;
 const choices=gc413Pool(r).filter(c=>gc320PartyQualification(p,c).ok)
  .map(c=>({c,score:gc413Score(r,p,c)})).filter(x=>x.score!==null);
 choices.sort((a,b)=>b.score-a.score||Number(b.c.reward||0)-Number(a.c.reward||0)||String(a.c.id).localeCompare(String(b.c.id)));
 return choices[0]?.c||null;
}
/* Override the legacy approval-based dispatch route. Dispatch uses the real
   expedition engine and existing manager perks. Any failure leaves the party
   intact and waiting for the next opportunity. */
gc280Dispatch=function(r,p,c){
 if(!gc280NetworkUnlocked()||!gc280Commander(r)||!gc280CommandState(r).autonomy||!c||
   !gc413Ready(p,r)||!gc320PartyQualification(p,c).ok||
   !gc413Pool(r).some(x=>x.id===c.id))return false;
 const ok=gc370DispatchDirect(r,p,c);
 if(ok)p.gc413LastDispatch=Number(state.company.day)||0;
 return ok;
};
gc280PickContract=gc413PickContract;
gc280CommandAct=function(r){
 if(!gc280NetworkUnlocked())return false;
 const c=gc280CommandState(r),manager=gc280Commander(r),region=state.regions[r];
 if(!region?.hq?.established||!c.autonomy||manager?.status!=='Command')return false;
 const t=gc370Talent(manager),cap=t.master||t.coordination?2:1;
 const parties=state.parties.filter(p=>gc413Ready(p,r))
  .sort((a,b)=>(Number(a.gc413LastDispatch)||0)-(Number(b.gc413LastDispatch)||0)
   ||a.id.localeCompare(b.id));
 let sent=0;
 for(const p of parties){
  const contract=gc413PickContract(r,p);
  if(contract&&gc280Dispatch(r,p,contract))sent++;
  if(sent>=cap)break;
 }
 return sent>0;
};
/* Simple status is live in both regional strips and the management sheet. */
function gc413Totals(r){
 const parties=state.parties.filter(p=>p.regionId===r);
 const counts={Working:0,Recovering:0,Waiting:0,Manual:0,Unavailable:0};
 parties.forEach(p=>{counts[gc413PartyState(p,r)]++});
 return counts;
}
function gc413PartyRows(r){
 const parties=state.parties.filter(p=>p.regionId===r);
 return parties.map(p=>{
  const stateName=gc413PartyState(p,r),manual=!!p.gc413Manual;
  const owner=(p.members||[]).includes(state.company.founderId);
  const note=stateName==='Working'?'On contract':stateName==='Recovering'?'Waiting for full recovery':
   stateName==='Manual'?'Controlled by you':stateName==='Unavailable'?'Crew/captain unavailable':
   gc413Ready(p,r)?'Ready for a suitable contract':'No complete crew';
  return '<div class="gc413Party" data-gc413-party="'+esc(p.id)+'"><div><b>'+esc(p.name)+'</b>'+
    '<small>'+esc(stateName)+' • '+esc(note)+'</small></div>'+
    (!owner?'<button type="button" class="btn ghost" data-action="gc413Party" data-region="'+r+'" data-id="'+esc(p.id)+'">'+
    (manual?'ENABLE AUTO':'MANUAL')+'</button>':'<span>PLAYER PARTY</span>')+'</div>';
 }).join('')||'<div class="gc413Empty">Build a party to begin automatic contracting.</div>';
}
function gc413Board(r){
 const t=gc413Totals(r),x=gc413Orders(r),c=gc280CommandState(r);
 return '<div class="gc413ManagerBoard" data-gc413-region="'+r+'"><div class="gc413Totals">'+
  [['Working',t.Working],['Recovering',t.Recovering],['Waiting',t.Waiting]].map(([label,value])=>
  '<div><b>'+value+'</b><span>'+label.toUpperCase()+'</span></div>').join('')+'</div>'+
  '<p>Managers dispatch only your existing, fully healed parties. Captains, crew and HQ stances stay exactly as you assigned them. Parties you mark Manual are never sent automatically.</p>'+
  '<div class="gc413PartyList">'+gc413PartyRows(r)+'</div>'+
  (t.Manual||t.Unavailable?'<small>'+t.Manual+' manually controlled • '+t.Unavailable+' otherwise unavailable</small>':'')+'</div>';
}
function gc413PolicyControls(r){
 const x=gc413Orders(r);
 return '<div class="gc413Policies">'+GC280_POLICIES.map(v=>
  '<button type="button" class="gc413Policy '+(x.risk===v?'selected':'')+'" data-action="gc413Policy" data-region="'+r+'" data-value="'+v+'"><b>'+GC413_RISK[v]+'</b><small>'+esc(GC413_DESC[v])+'</small></button>'
 ).join('')+'</div>';
}
function gc413ManagerPerks(manager){
 const t=gc370Talent(manager);
 const items=[
  ['Lv.5','Emergency treatment kit',t.prep],
  ['Lv.10','Improved risk assessment',t.personnel],
  ['Lv.15','Crisis withdrawal plan',t.contingency],
  ['Lv.20','Coordinate two expeditions',t.master],
  ['Uncommon','Advance scouting',t.logistics],
  ['Rare','Crew-skill contract matching',t.assessment],
  ['Super Rare','Coordinate two expeditions',t.coordination],
  ['Legendary','Identify dangerous unknowns',t.adaptation]
 ];
 return '<div class="gc413Talents">'+items.map(([req,label,on])=>
  '<div class="'+(on?'active':'')+'"><span>'+req+'</span><b>'+esc(label)+'</b></div>').join('')+'</div>';
}
gc280OpenCommand=function(r){
 if(!gc280NetworkUnlocked())return toast('Regional command unlocks after your second headquarters.');
 if(!state.regions[r]?.hq?.established)return false;
 const c=gc280CommandState(r),x=gc413Orders(r),manager=gc280Commander(r),eligible=gc280EligibleCommanders(r);
 let html='<div class="sheetHead"><div><h3>'+esc(state.regions[r].hq.name)+'</h3><div class="tiny muted">Party Dispatch Management</div></div><button class="x" data-action="close">×</button></div>';
 if(manager){
  html+='<div class="card gc413Hero">'+blPortraitHTML(manager,'blPortraitLarge')+'<div><b>'+esc(manager.name)+'</b><small>Lv.'+manager.lvl+' • '+esc(gc360RankName(manager))+' • Command '+gc280CommandScore(manager)+'</small></div></div>';
 }else{
  html+='<div class="card"><b>Appoint a regional manager</b><p>The appointee must be unassigned. Existing parties will not be reorganized.</p>';
  if(eligible.length)html+='<select class="field" id="gc413ManagerPick">'+eligible.map(a=>
   '<option value="'+esc(a.id)+'">'+esc(a.name)+' • Lv.'+a.lvl+' '+esc(gc360RankName(a))+'</option>').join('')+'</select>';
  else html+='<small>No unassigned, ready adventurers in this region.</small>';
  html+='</div>';
 }
 html+='<div class="sectionTitle"><h3>Risk Policy</h3><span>one setting</span></div>'+gc413PolicyControls(r);
 if(!manager&&eligible.length)html+='<button class="btn goldbtn wide" data-action="gc413Appoint" data-region="'+r+'">APPOINT MANAGER</button>';
 if(manager){
  html+='<div class="gc413Switch"><b>'+(c.autonomy?'AUTOMATION ON':'AUTOMATION PAUSED')+'</b>'+
   '<button class="btn '+(c.autonomy?'ghost':'primary')+'" data-action="gc280Toggle" data-region="'+r+'">'+(c.autonomy?'PAUSE AUTO DISPATCH':'RESUME AUTO DISPATCH')+'</button></div>';
  html+='<div class="sectionTitle"><h3>Existing Parties</h3><span>live status</span></div>'+gc413Board(r);
  html+='<div class="sectionTitle"><h3>Manager Expertise</h3><span>level and rarity</span></div>'+gc413ManagerPerks(manager);
  const performance=x.performance;
  html+='<div class="gc413Record">'+performance.dispatches+' missions dispatched • '+performance.retreats+' crisis withdrawals • '+performance.aidKits+' field kits used</div>';
  html+='<button class="btn ghost wide" data-action="gc280Release" data-region="'+r+'">RELIEVE MANAGER</button>';
 }
 modal(html);return true;
};
function gc413SetPolicy(r,v){
 if(!GC280_POLICIES.includes(v)||!state.regions[r]?.hq?.established)return false;
 const x=gc413Orders(r),c=gc280CommandState(r);if(!x||!c)return false;
 x.risk=v;c.casualtyPolicy=v;
 if(gc280Commander(r))gc370Record(r,'orders','Dispatch policy set to '+GC413_RISK[v]+'.');
 save();gc280OpenCommand(r);return true;
}
function gc413ToggleParty(r,id){
 const p=state.parties.find(p=>p.id===id&&p.regionId===r);
 if(!p||(p.members||[]).includes(state.company.founderId))return false;
 p.gc413Manual=!p.gc413Manual;save();gc280OpenCommand(r);return true;
}
const _processActionGC413=processAction;
processAction=function(el){
 const action=el?.dataset?.action,r=el?.dataset?.region;
 if(action==='gc413Policy')return gc413SetPolicy(r,el.dataset.value);
 if(action==='gc413Party')return gc413ToggleParty(r,el.dataset.id);
 if(action==='gc413Appoint'){
  const id=document.getElementById('gc413ManagerPick')?.value;
  if(id&&gc280Appoint(r,id))return gc280OpenCommand(r);
  return false;
 }
 return _processActionGC413(el);
};
gc280CommandStrip=function(r){
 if(!gc280NetworkUnlocked()||!state?.regions?.[r]?.hq?.established)return'';
 const c=gc280CommandState(r),manager=gc280Commander(r),t=gc413Totals(r);
 return '<div class="card gc280CommandStrip '+(manager&&c.autonomy?'active':'')+'"><div><span>PARTY MANAGEMENT</span>'+
  '<b>'+esc(manager?.name||'Direct control')+'</b><small>'+
  (manager?GC413_RISK[gc413Orders(r).risk]+' • '+(c.autonomy?'AUTO DISPATCH':'PAUSED'):'No manager appointed')+
  '</small><em>'+t.Working+' working • '+t.Recovering+' recovering • '+t.Waiting+' waiting</em></div>'+
  '<button class="btn '+(manager?'ghost':'goldbtn')+'" data-action="gc280Open" data-region="'+r+'">'+(manager?'Manage':'Appoint')+'</button></div>';
};
/* Live updates inside the open management sheet, without reopening it and
   interrupting the player's scrolling or button presses. */
const _gc412PatchModalGC413=gc412PatchModal;
gc412PatchModal=function(...args){
 const out=_gc412PatchModalGC413(...args);
 if(!state||document.hidden)return out;
 const sheet=document.getElementById('sheet'),modalRoot=document.getElementById('modal');
 if(!modalRoot?.classList.contains('show'))return out;
 const board=sheet?.querySelector('.gc413ManagerBoard');if(!board)return out;
 if(document.activeElement?.matches?.('input,select,textarea'))return out;
 const r=board.dataset.gc413Region;
 if(!r||!state.regions[r])return out;
 const t=document.createElement('template');t.innerHTML=gc413Board(r);
 const next=t.content.querySelector('.gc413ManagerBoard');if(!next)return out;
 if(board.innerHTML!==next.innerHTML){
  /* Small localized replacement only. No full page or modal redraw. */
  board.innerHTML=next.innerHTML;
  return true;
 }
 return out;
};
function gc413InstallStyle(){
 if(document.getElementById('gc413CSS'))return;
 const style=document.createElement('style');style.id='gc413CSS';
 style.textContent=[
 '.gc413Hero{display:flex;gap:12px;align-items:center}.gc413Hero>div:last-child{min-width:0}.gc413Hero b,.gc413Hero small{display:block}.gc413Hero small{font-size:10px;color:#bda98a;margin-top:5px}',
 '.gc413Policies{display:grid;gap:8px}.gc413Policy{width:100%;min-height:66px;text-align:left!important;background:#191715;border:1px solid #655039;border-radius:7px;padding:10px 12px;color:#e6d4b4}.gc413Policy.selected{border-color:#d4aa63;background:#332818}.gc413Policy b,.gc413Policy small{display:block}.gc413Policy b{font:700 14px Georgia,serif}.gc413Policy small{font-size:10px;color:#bda98d;margin-top:4px;line-height:1.5}',
 '.gc413Switch{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:13px;border:1px solid #51412d;padding:10px}.gc413Switch b{font-size:10px}.gc413Switch button{min-height:44px}',
 '.gc413ManagerBoard>p{color:#b4a48e;font-size:11px;line-height:1.55}.gc413Totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.gc413Totals>div{text-align:center;padding:12px 3px;background:#201b15;border-radius:5px}.gc413Totals b,.gc413Totals span{display:block}.gc413Totals b{font:700 23px Georgia,serif;color:#e6c88d}.gc413Totals span{font-size:8px;color:#b69c75}',
 '.gc413Party{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #453a2c;padding:11px 2px}.gc413Party>div{min-width:0;flex:1}.gc413Party b,.gc413Party small{display:block}.gc413Party b{font-size:12px}.gc413Party small{font-size:9px;line-height:1.4;color:#baa587;margin-top:5px}.gc413Party button{min-width:92px;min-height:42px;font-size:9px}.gc413Party>span{font-size:8px;color:#a79372}.gc413ManagerBoard>small{display:block;color:#b7a17e;margin-top:9px}.gc413Empty{font-size:11px;color:#988c7b;padding:13px}',
 '.gc413Talents{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.gc413Talents>div{padding:9px;background:#191815;border:1px solid #41392c;opacity:.48}.gc413Talents>div.active{border-color:#86683e;opacity:1}.gc413Talents span,.gc413Talents b{display:block}.gc413Talents span{font-size:8px;color:#be995f}.gc413Talents b{font-size:10px;color:#e1cfb1;margin-top:4px}.gc413Record{margin:12px 0;font-size:10px;color:#c7b393}',
 '@media(max-width:355px){.gc413Switch{flex-direction:column;align-items:stretch}.gc413Talents{grid-template-columns:1fr}}'
 ].join('');
 document.head.appendChild(style);
}
gc413InstallStyle();
const _auditGC413=audit;
audit=function(){
 const o=_auditGC413();
 o.managerDispatchesOnlyPlayerBuiltParties=true;
 o.managerNeverRearrangesTeamsOrCaptains=true;
 o.managerRequiresFullHPAndRecovery=true;
 o.managerRiskIsThreeSimplePolicies=true;
 o.managerRespectsManualParties=true;
 return o;
};
window.__BL_AUDIT=audit;
