/* Grim Company v21.2 — Stakes: independent mercenary work remains available after founding. */
function gc320IndependentBoards(){
 const fs=gc260System();fs.gc320IndependentBoards=fs.gc320IndependentBoards&&typeof fs.gc320IndependentBoards==='object'?fs.gc320IndependentBoards:{};return fs.gc320IndependentBoards;
}
function gc320MakeIndependentContract(regionId,risk,used=[]){
 const c=gc250FreshContractForRisk(regionId,risk,used);c.id=uid('ind');c.gc320Independent=true;c.expires=999999;
 c.gc320ClientValue=gc310ClientValue(c);return c;
}
function gc320IndependentBoard(regionId){
 const boards=gc320IndependentBoards(),existing=Array.isArray(boards[regionId])?boards[regionId]:[],next=[],used=[];
 for(const risk of [1,2,3,4,5]){
  let c=existing.find(x=>Number(x.risk)===risk&&!next.includes(x));
  if(!c)c=gc320MakeIndependentContract(regionId,risk,used);
  c.gc320Independent=true;c.expires=999999;next.push(c);used.push(c.title);
 }
 boards[regionId]=next;return next;
}
const _contractByIdGC320C=contractById;
contractById=function(id){
 if(state){
  const boards=gc320IndependentBoards();
  for(const list of Object.values(boards)){const c=(list||[]).find(x=>x.id===id);if(c)return c}
 }
 return _contractByIdGC320C(id);
};
function gc320IndependentEligible(c){
 const f=gc260Founder(),need=gc320RiskLevel(c?.risk),available=!!(f&&f.status==='Ready'&&!gc260System()?.activity&&!gc260FounderParty()?.expedition);
 return{ok:available&&(f.lvl||1)>=need,need,available,level:f?.lvl||0};
}
function gc320IndependentCard(c){
 const f=gc260Founder(),gate=gc320IndependentEligible(c),crew=gc310CrewSize(c),client=Number(c.gc320ClientValue)||gc310ClientValue(c),share=gc310ShareFromPay(c,c.reward,crew);
 return`<div class="card contract gc320IndependentContract ${gate.ok?'':'locked'}"><div class="statline"><div><h4>${esc(c.title)}</h4><div class="tiny muted">${esc(c.type)} • ${esc(c.species)} • approximately ${c.enemyCount} enemies</div></div><span class="riskDots">${'●'.repeat(c.risk)}${'○'.repeat(5-c.risk)}</span></div><p class="small">${esc(c.desc)}</p><div class="gc310ContractEconomy"><div><span>CLIENT VALUE</span><b>${money(client)}</b></div><div><span>YOUR SHARE</span><b>${money(share)}</b></div><div><span>CREW</span><b>${crew}</b></div></div><div class="gc320RiskGate"><b>Risk ${c.risk} requires you to be Lv.${gate.need}+</b><span>${gate.level>=gate.need?'You qualify personally.':'Your experience is not yet sufficient.'}</span></div><div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn ${gate.ok?'primary':''}" data-action="gc320TakeIndependent" data-id="${c.id}" ${gate.ok?'':'disabled'}>JOIN AS A FREEBLADE</button></div></div>`;
}
function gc320OpenIndependentBoard(){
 if(!gc270IsCompany())return toast('Independent work is already your main livelihood.');
 const f=gc260Founder();if(!f)return;
 const board=gc320IndependentBoard(f.regionId);
 modal(`<div class="sheetHead"><div><h3>Independent Mercenary Work</h3><div class="tiny muted">Owning a company does not stop you from taking a personal share on somebody else's crew.</div></div><button class="x" data-action="close">✕</button></div><div class="notice">These jobs are separate from ${esc(state.company.name)}'s contract board. Your company receives no organizational revenue or Renown from them; only your personal share enters the treasury.</div><div class="list" style="margin-top:8px">${board.map(gc320IndependentCard).join('')}</div>`);
}
function gc320PersonalParty(){
 return state.parties.find(p=>p.gc320IndependentCrew)||null;
}
function gc320TakeIndependent(cid){
 if(!gc270IsCompany())return;
 const c=contractById(cid),f=gc260Founder();if(!c?.gc320Independent||!f)return toast('That independent contract is no longer available.');
 const gate=gc320IndependentEligible(c);if(!gate.ok)return toast(`You need to be Level ${gate.need} and personally available.`);
 const rid=f.regionId,home=state.parties.find(p=>p.members.includes(f.id)&&!p.gc320IndependentCrew),homeIndex=home?home.members.indexOf(f.id):-1,wasCaptain=home?.captainId===f.id;
 if(home){home.members=home.members.filter(id=>id!==f.id);if(wasCaptain)home.captainId=home.members[0]||null}
 const p=makeParty(rid,'Independent Contract Crew');p.gc320IndependentCrew=true;p.gc320HomePartyId=home?.id||null;p.gc320HomeIndex=homeIndex;p.gc320WasCaptain=!!wasCaptain;p.members=[f.id];p.captainId=null;state.parties.push(p);
 const crew=gc310AssembleCrew(c,p),tempIds=crew.map(a=>a.id);
 const out=dispatchContract(c.id,p.id);
 if(!p.expedition){
  gc310ReturnFreelancers(p,tempIds,rid);state.parties=state.parties.filter(x=>x.id!==p.id);
  if(home&&f.status!=='Dead'&&!home.members.includes(f.id)){home.members.splice(Math.max(0,Math.min(homeIndex,home.members.length)),0,f.id);if(wasCaptain)home.captainId=f.id}
  return out;
 }
 p.expedition.gc310Freelance=true;p.expedition.gc320Independent=true;p.expedition.gc310TemporaryIds=tempIds;p.expedition.gc310CrewNames=[f.name,...crew.map(a=>a.name)];p.expedition.gc310CrewSize=p.members.length;p.expedition.gc310ClientValue=Number(c.gc320ClientValue)||gc310ClientValue(c);p.expedition.gc320HomePartyId=home?.id||null;p.expedition.gc320HomeIndex=homeIndex;p.expedition.gc320WasCaptain=!!wasCaptain;
 const board=gc320IndependentBoard(rid);const boards=gc320IndependentBoards();boards[rid]=board.filter(x=>x.id!==cid);gc320IndependentBoard(rid);
 state.ui.tab='you';save();render();return out;
}
const _gc193FinishNoTimeGC320C=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 if(GC320_SUPPRESS_FINISH)return _gc193FinishNoTimeGC320C(p);
 const e=p?.expedition,ind=!!e?.gc320Independent,homeId=e?.gc320HomePartyId,index=Number(e?.gc320HomeIndex),wasCaptain=!!e?.gc320WasCaptain,pid=p?.id;
 const out=_gc193FinishNoTimeGC320C(p);
 if(ind){
  const f=gc260Founder(),home=homeId?state.parties.find(x=>x.id===homeId):null;
  state.parties=state.parties.filter(x=>x.id!==pid);
  if(f&&f.status!=='Dead'&&home&&!home.members.includes(f.id)){
   const at=Number.isFinite(index)?Math.max(0,Math.min(index,home.members.length)):home.members.length;home.members.splice(at,0,f.id);if(wasCaptain)home.captainId=f.id;
  }
  gc320IndependentBoard(e.contract.regionId);save();render();
 }
 return out;
};

function gc320IndependentWorkHTML(){
 if(!state||!gc270IsCompany())return'';
 const f=gc260Founder(),active=gc320PersonalParty()?.expedition,board=f?gc320IndependentBoard(f.regionId):[];
 if(!f)return'';
 if(active)return`<div class="sectionTitle"><h3>Independent Work</h3><span>you are freelancing</span></div><div class="gc320IndependentHero"><b>${esc(active.contract.title)}</b><span>This is personal mercenary work, not a ${esc(state.company.name)} contract.</span></div>`;
 const eligible=board.filter(c=>gc320IndependentEligible(c).ok).length;
 return`<div class="sectionTitle"><h3>Independent Work</h3><span>permanent personal option</span></div><div class="card gc320IndependentHero"><div class="statline"><div><b>You can still work as a freeblade.</b><div class="tiny muted">Owning ${esc(state.company.name)} does not remove your ability to join outside crews.</div></div><strong>${eligible}/5</strong></div><button class="btn goldbtn wide" data-action="gc320IndependentBoard">OPEN PERSONAL MERCENARY BOARD</button></div>`;
}
const _gc260RenderYouGC320C=gc260RenderYou;
gc260RenderYou=function(){return _gc260RenderYouGC320C()+gc320IndependentWorkHTML()};

const _processActionGC320C=processAction;
processAction=function(el){
 if(el.dataset.action==='gc320IndependentBoard')return gc320OpenIndependentBoard();
 if(el.dataset.action==='gc320TakeIndependent')return gc320TakeIndependent(el.dataset.id);
 return _processActionGC320C(el);
};
