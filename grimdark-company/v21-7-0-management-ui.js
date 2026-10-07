/* Grim Company v21.7 — appointment orders, autonomy controls and reports. */
const GC370_ORDER_INFO={
 Balanced:'Divide effort between revenue, safety and developing the company.',
 'Make Money':'Favor lucrative contracts and income-generating work.',
 'Secure Region':'Favor defensive contracts and intelligence gathering.',
 'Develop Roster':'Favor training, recruitment and sustainable missions.',
 'Break Campaign':'Prioritize an active regional campaign when qualified.',
 Conservative:'Avoid depleted parties and prioritize a safe withdrawal.',
 Normal:'Balance casualties, rewards and operational urgency.',
 Ruthless:'Allow aggressive operational risk; real deaths remain possible.',
 Ask:'Request approval before company funds are spent.',
 Budgeted:'Spend within the per-action limit and treasury reserve.',
 Broad:'Spend freely while respecting the treasury reserve.',
 All:'Ask before every mission dispatch and expenditure.',
 Major:'Ask for Risk 4–5 deployments and structural HQ changes.',
 Full:'Handle delegated decisions without requests unless financial limits block spending.'
};
function gc370Option(value,chosen,label){
 return '<option value="'+esc(value)+'" '+(value===chosen?'selected':'')+'>'+esc(label||value)+'</option>';
}
function gc370Select(label,id,options,current,description){
 return '<label class="gc370Field"><b>'+esc(label)+'</b><select class="field" id="'+id+'">'+options.map(o=>gc370Option(o[0],current,o[1]||o[0])).join('')+'</select><small>'+esc(description||'')+'</small></label>';
}
function gc370Settings(r){
 const x=gc370Config(r);
 return '<section class="gc370Orders"><div class="gc370Section"><span>YOUR STANDING ORDERS</span><b>Define the manager’s authority</b></div>'+
 gc370Select('Management priority','gc370Priority',GC370_GOALS.map(o=>[o,o]),x.priority,'Decides which contracts and daily duties receive attention.')+
 gc370Select('Risk & casualties','gc370Risk',[
 ['Conservative','Careful — preserve lives'],['Normal','Prudent — balanced danger'],['Ruthless','Bold — accept more risk']
 ],x.risk,'Higher-risk contracts still require career-qualified captains.')+
 gc370Select('Financial authority','gc370Spending',[
 ['Ask','Ask before spending'],['Budgeted','Limited spending'],['Broad','Broad spending authority']
 ],x.spending,'Spending never bypasses the treasury limit.')+
 gc370Select('Important decisions','gc370Authority',[
 ['All','Approve every dispatch and expense'],['Major','Approve major changes'],['Full','Manager decides within orders']
 ],x.authority,'A request appears in the management panel; time can continue elsewhere.')+
 '<div class="gc370Row">'+gc370Select('Treasury reserve','gc370Reserve',GC370_RESERVES.map(v=>[String(v),v+' silver']),String(x.reserve),'Budget authority never automatically spends below this reserve.')+
 gc370Select('Per-purchase limit','gc370Cap',[['50','50 silver'],['150','150 silver'],['300','300 silver'],['600','600 silver']],String([50,150,300,600].includes(x.actionCap)?x.actionCap:150),'Applies when spending is Limited.')+'</div></section>';
}
function gc370ManagerPerks(a){
 const t=gc370Talent(a),rows=[
 ['LEVEL 5','Emergency supply kit',t.prep],
 ['LEVEL 10','Improved party composition',t.personnel],
 ['LEVEL 15','Crisis withdrawal planning',t.contingency],
 ['LEVEL 20','Coordinate an extra dispatch',t.master],
 ['UNCOMMON','Advance scouting on deployments',t.logistics],
 ['RARE','Match contracts to crew skills',t.assessment],
 ['SUPER RARE','Coordinate an extra dispatch',t.coordination],
 ['LEGENDARY','Anticipate costly unknown threats',t.adaptation]
 ];
 return '<div class="gc370Perks">'+rows.map(o=>'<div class="'+(o[2]?'active':'')+'"><span>'+o[0]+'</span><b>'+esc(o[1])+'</b><em>'+(o[2]?'ACTIVE':'LOCKED')+'</em></div>').join('')+'</div>';
}
function gc370PendingHTML(r){
 const x=gc370Config(r),requests=x.requests;
 if(!requests.length)return'<div class="gc370Empty">No decisions are awaiting approval.</div>';
 return '<div class="gc370PendingList">'+requests.map(q=>
 '<div class="gc370Request"><div><span>'+esc(q.kind.toUpperCase())+' • DAY '+q.createdDay+'</span><b>'+esc(q.description)+'</b>'+(q.amount?'<small>One-time cost: '+money(q.amount)+'</small>':'')+'</div><div class="gc370RequestActions"><button class="btn primary" data-action="gc370Approve" data-region="'+r+'" data-id="'+q.id+'">Approve</button><button class="btn ghost" data-action="gc370Decline" data-region="'+r+'" data-id="'+q.id+'">Decline</button></div></div>').join('')+'</div>';
}
function gc370ManagerReport(r){
 const x=gc370Config(r),p=x.performance,log=x.history.slice(-10).reverse();
 return '<div class="gc370Stats">'+[
 ['OPERATIONS',p.dispatches],['RECRUITS',p.hires],['PARTIES',p.charters],['WITHDRAWALS',p.retreats]
 ].map(y=>'<div><span>'+y[0]+'</span><b>'+y[1]+'</b></div>').join('')+'</div>'+
 '<div class="gc370Ledger"><b>MANAGER RECORD</b><span>'+p.approvals+' approvals executed • '+p.declines+' requests declined • '+p.aidKits+' emergency kits used</span><small>Recorded treasury change: '+(p.netSilver>=0?'+':'')+money(p.netSilver)+' • '+Math.floor(p.days)+' days in command</small></div>'+
 '<div class="gc370Log">'+(log.length?log.map(h=>'<div><span>DAY '+h.day+' • '+esc(h.category.toUpperCase())+'</span><small>'+esc(h.description)+'</small></div>').join(''):'<div>No management actions logged yet.</div>')+'</div>';
}
gc280OpenCommand=function(r){
 if(!gc280NetworkUnlocked())return toast('Regional command unlocks after the second headquarters.');
 if(!state.regions[r]?.hq?.established)return;
 const c=gc280CommandState(r),x=gc370Config(r),a=gc280Commander(r),eligible=gc280EligibleCommanders(r),name=state.regions[r].hq.name;
 let html='<div class="sheetHead"><div><h3>'+esc(name)+'</h3><div class="tiny muted">Regional Command 2.0</div></div><button class="x" data-action="close">×</button></div>';
 if(a){
  html+='<div class="card gc370Hero">'+blPortraitHTML(a,'blPortraitLarge')+'<div><b>'+esc(a.name)+'</b><span>Lv.'+a.lvl+' '+esc(gc360RankName(a))+' • '+esc(a.className)+'</span><small>Command '+gc280CommandScore(a)+' • '+esc(gc280Temperament(a))+' • '+(c.autonomy?'AUTONOMOUS':'DIRECT CONTROL')+'</small></div></div>';
  html+='<div class="gc370Section"><span>EXPERIENCE & CAREER</span><b>Real managerial benefits</b></div>'+gc370ManagerPerks(a);
 }else{
  html+='<div class="gc370Section"><span>APPOINTMENT</span><b>Choose your regional manager</b></div>';
  html+='<div class="card gc370Appointment"><p>A manager leaves regular party duty to lead this headquarters. Level and career rarity affect actual management decisions.</p>';
  if(eligible.length)html+='<label class="gc370Field"><b>Available adventurer</b><select class="field" id="gc280CommanderPick">'+eligible.map(y=>'<option value="'+y.id+'">'+esc(y.name)+' — Lv.'+y.lvl+' '+esc(gc360RankName(y))+' • Command '+gc280CommandScore(y)+'</option>').join('')+'</select></label>';
  else html+='<div class="empty">No available local adventurers can be appointed.</div>';
  html+='</div>';
 }
 html+=gc370Settings(r);
 if(a){
  html+='<button class="btn goldbtn wide" data-action="gc370SaveOrders" data-region="'+r+'">SAVE STANDING ORDERS</button>';
  html+='<div class="gc370Section"><span>DECISION QUEUE</span><b>'+x.requests.length+' awaiting approval</b></div>'+gc370PendingHTML(r);
  html+='<div class="card gc370Control"><div><b>'+(c.autonomy?'MANAGER IN CONTROL':'YOU ARE IN CONTROL')+'</b><small>'+(c.autonomy?'Standing orders govern autonomous decisions.':'Autonomous orders are paused; the manager keeps their post.')+'</small></div><button class="btn '+(c.autonomy?'ghost':'primary')+'" data-action="gc280Toggle" data-region="'+r+'">'+(c.autonomy?'Take Control':'Resume Autonomy')+'</button></div>';
  html+='<div class="gc370Section"><span>ACCOUNTABILITY</span><b>Management record</b></div>'+gc370ManagerReport(r);
  html+='<button class="btn ghost wide" data-action="gc280Release" data-region="'+r+'">Return '+esc(a.name)+' to roster duty</button>';
 }else if(eligible.length){
  html+='<button class="btn goldbtn wide" data-action="gc280Appoint" data-region="'+r+'">APPOINT WITH THESE ORDERS</button>';
 }
 modal(html);
};
function gc370ReadOrders(){
 const value=id=>document.getElementById(id)?.value;
 return{
  priority:value('gc370Priority'),risk:value('gc370Risk'),spending:value('gc370Spending'),
  authority:value('gc370Authority'),reserve:Number(value('gc370Reserve')),actionCap:Number(value('gc370Cap'))
 };
}
const _processActionGC370=processAction;
processAction=function(el){
 const a=el?.dataset?.action,r=el?.dataset?.region;
 if(a==='gc280Appoint'){
  const id=document.getElementById('gc280CommanderPick')?.value;
  const orders=gc370ReadOrders();
  const appointed=gc280Appoint(r,id);
  if(appointed){gc370ChangeOrders(r,orders);gc280OpenCommand(r)}
  return;
 }
 if(a==='gc370SaveOrders'){
  const changed=gc370ChangeOrders(r,gc370ReadOrders());
  if(changed)gc280OpenCommand(r);
  return;
 }
 if(a==='gc370Approve'||a==='gc370Decline'){
  gc370ResolveRequest(r,el.dataset.id,a==='gc370Approve');
  gc280OpenCommand(r);
  return;
 }
 return _processActionGC370(el);
};
/* Call attention to pending decisions right on the HQ summary. */
const _gc280CommandStripGC370=gc280CommandStrip;
gc280CommandStrip=function(r){
 let html=_gc280CommandStripGC370(r),c=gc370Config(r);
 if(c?.requests?.length)html=html.replace('data-action="gc280Open"','title="'+c.requests.length+' management decision(s) awaiting approval" data-action="gc280Open"')
 .replace('>Manage</button>','>Review '+c.requests.length+' requests</button>');
 return html;
};
function gc370Styles(){
 if(document.getElementById('gc370Styles'))return;
 const st=document.createElement('style');st.id='gc370Styles';
 st.textContent='.gc370Section{display:flex;justify-content:space-between;align-items:end;gap:8px;margin:16px 0 9px;padding-bottom:6px;border-bottom:1px solid rgba(192,154,90,.22)}.gc370Section span{font-size:8px;color:#b49259;letter-spacing:.11em}.gc370Section b{font:700 13px Georgia,serif;color:#e5d6b9}.gc370Appointment p{font-size:11px;color:#c3b8a7;line-height:1.5}.gc370Orders{display:grid;gap:10px}.gc370Field{display:grid;gap:5px;min-width:0}.gc370Field b{font-size:10px;color:#d6c49e}.gc370Field select{width:100%;min-height:44px;border:1px solid #6b5840!important;background:#171612!important;color:#e4d8c3!important;font-size:12px!important}.gc370Field small{font-size:9px;line-height:1.4;color:#9c9181}.gc370Row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gc370Hero{display:flex;gap:10px;align-items:center}.gc370Hero>div:last-child{min-width:0}.gc370Hero b,.gc370Hero span,.gc370Hero small{display:block}.gc370Hero b{font-size:16px;color:#e5d4b6}.gc370Hero span{font-size:11px;color:#bda57c}.gc370Hero small{font-size:10px;color:#9e9385}.gc370Perks{display:grid;grid-template-columns:1fr 1fr;gap:6px}.gc370Perks>div{padding:8px;border-radius:6px;background:#171713;border:1px solid #3b3831;opacity:.56}.gc370Perks>div.active{opacity:1;border-color:#695638}.gc370Perks span,.gc370Perks b,.gc370Perks em{display:block}.gc370Perks span{font-size:8px;color:#b69860}.gc370Perks b{margin:3px 0;font-size:10px;line-height:1.25;color:#d6cbbc}.gc370Perks em{font-size:8px;color:#b7a275;font-style:normal}.gc370Request{padding:10px;margin-bottom:8px;border:1px solid #71553b;border-left:3px solid #ac874e;border-radius:6px;background:#201b15}.gc370Request span,.gc370Request b,.gc370Request small{display:block}.gc370Request span{font-size:8px;color:#d0a663}.gc370Request b{font-size:11px;line-height:1.45;margin:4px 0}.gc370Request small{font-size:9px;color:#aca08f}.gc370RequestActions{display:flex;gap:8px;margin-top:8px}.gc370RequestActions .btn{min-height:42px;flex:1}.gc370Empty{font-size:10px;color:#928675;padding:9px 0}.gc370Control{display:flex;align-items:center;justify-content:space-between;gap:8px}.gc370Control b,.gc370Control small{display:block}.gc370Control b{font-size:10px}.gc370Control small{margin-top:3px;font-size:9px;color:#9e9485}.gc370Control button{flex:0 0 auto}.gc370Stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.gc370Stats>div{padding:9px 4px;text-align:center;border-radius:5px;background:#1c1914}.gc370Stats span,.gc370Stats b{display:block}.gc370Stats span{font-size:7px;color:#998365}.gc370Stats b{font-size:18px;color:#e0c99c;margin-top:3px}.gc370Ledger{margin:9px 0;padding:9px;background:#1b1a17;border-left:2px solid #8b7147}.gc370Ledger b,.gc370Ledger span,.gc370Ledger small{display:block}.gc370Ledger b{font-size:9px;color:#c7a567}.gc370Ledger span,.gc370Ledger small{font-size:10px;line-height:1.5;color:#b9ac99}.gc370Log>div{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)}.gc370Log span,.gc370Log small{display:block}.gc370Log span{font-size:8px;color:#b99c65}.gc370Log small{font-size:10px;color:#b8ac9a;line-height:1.45;margin-top:3px}@media(max-width:360px){.gc370Perks,.gc370Row{grid-template-columns:1fr}.gc370Control{flex-direction:column;align-items:stretch}}';
 document.head.appendChild(st);
}
gc370Styles();
