/* Grim Company v21.1 — Freelancer Economy presentation and verification. */
function gc310KnownMercsHTML(){
 if(!state||!gc270IsFreeblade())return'';
 const rid=gc310Freeblade().startRegion||state.currentRegion,f=gc260Founder();
 const known=gc310RegionPool(rid).filter(a=>(a.gc310JobsWithFounder||0)>0&&a.status!=='Dead').sort((a,b)=>(b.gc310JobsWithFounder||0)-(a.gc310JobsWithFounder||0)||relValue(f.id,b.id)-relValue(f.id,a.id)).slice(0,6);
 if(!known.length)return'';
 return`<div class="sectionTitle"><h3>People You've Worked With</h3><span>persistent freelancers</span></div><div class="list">${known.map(a=>`<div class="card gc310KnownMerc"><div>${blPortraitHTML(a,'blPortraitMini')}<span><b>${esc(a.name)}</b><small>Lv.${a.lvl} ${esc(a.culture)} ${esc(a.className)} • ${a.gc310JobsWithFounder} job${a.gc310JobsWithFounder===1?'':'s'} with you</small><em>${esc(relLabel(relValue(f.id,a.id)))}${a.injury?` • recovering from ${esc(a.injury)}`:''}</em></span></div></div>`).join('')}</div>`;
}
gc270FoundingStatusHTML=function(){
 const fb=gc310Freeblade(),rep=Math.min(Number(fb?.reputation)||0,GC310_FOUNDING_REP),silver=Math.min(state.company.silver,GC270_FOUNDING_COST),ready=gc270FoundingReady();
 const pct=Math.min(100,((rep/GC310_FOUNDING_REP)+(silver/GC270_FOUNDING_COST))*50);
 return`<div class="gc270Founding ${ready?'ready':''}"><div class="statline"><div><span>FIRST MAJOR MILESTONE</span><b>${ready?'Other adventurers would work under your banner.':'Build a name worth following.'}</b></div><strong>${Math.round(rep)}/${GC310_FOUNDING_REP}</strong></div><div class="tiny muted">Freeblade Reputation ${Math.round(fb?.reputation||0)}/${GC310_FOUNDING_REP} • Silver ${Math.round(state.company.silver)}/${GC270_FOUNDING_COST}</div><div class="bar goldbar"><i style="width:${pct}%"></i></div>${ready?'<button class="btn primary wide" data-action="gc270FoundAsk">FOUND GRIM COMPANY</button>':'<div class="tiny muted">Complete real contracts with hired crews. Harder work builds reputation faster. Save enough to lease the chapterhouse.</div>'}</div>`;
};

gc270AskFound=function(){
 if(!gc270FoundingReady())return toast(`Need ${GC310_FOUNDING_REP} Freeblade Reputation and ${money(GC270_FOUNDING_COST)}.`);
 const fb=gc310Freeblade();
 modal(`<div class="sheetHead"><h3>Found a Company</h3><button class="x" data-action="close">×</button></div><div class="hero"><div class="kicker">FROM FREEBLADE TO FOUNDER</div><h2>Your name carries weight now.</h2><p>After ${fb.successes||0} independent wins and ${Math.round(fb.reputation||0)} reputation, other adventurers are willing to work under your banner. Spend ${money(GC270_FOUNDING_COST)} to lease the chapterhouse and start accepting contracts as an organization.</p></div><div class="label">Company name</div><input id="gc270CompanyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><button class="btn primary wide" data-action="gc270FoundConfirm">FOUND COMPANY • ${money(GC270_FOUNDING_COST)}</button><div class="tiny muted" style="margin-top:8px">Your character, gear, relationships and history stay intact. Mercenaries you already know can appear in recruitment.</div>`);
};

gc270Topbar=function(){
 const f=gc260Founder(),r=region(),fb=gc310Freeblade();
 return`<div class="topbar"><div class="toprow"><div class="brand"><h1>${esc(f?.name||'Freeblade')}</h1><small>INDEPENDENT MERCENARY • ${esc(REGION_DEFS[state.currentRegion].name)} • Day ${state.company.day}</small></div><button class="iconbtn" data-action="audio">${state.settings.sfx?'🔊':'🔇'}</button><button class="iconbtn" data-action="menu">☰</button></div><div class="resources"><div class="res">Silver<b>${Math.round(state.company.silver)}</b></div><div class="res">Reputation<b>${Math.round(fb?.reputation||0)}</b></div><div class="res">Level<b>${f?.lvl||1}</b></div><div class="res">Threat<b>${Math.round(r.threat)}%</b></div></div></div>`;
};

function gc310FreebladeContractCard(c){
 const f=gc260Founder(),p=gc260FounderParty(),gate=gc310Eligibility(c,f),busy=!!p?.expedition||f?.status!=='Ready',crew=gc310CrewSize(c),client=gc310ClientValue(c),share=gc310ShareFromPay(c,c.reward,crew);
 const reason=!gate.ok?`Need Lv.${gate.minLevel} + Rep ${gate.minRep}`:'Crew available';
 return`<div class="card contract gc310FreelanceContract ${gate.ok?'':'locked'}"><div class="statline"><div><h4>${esc(c.title)}</h4><div class="tiny muted">${esc(c.type)} • ${esc(c.check)} field work</div></div><span class="riskDots">${'●'.repeat(c.risk)}${'○'.repeat(5-c.risk)}</span></div><p class="small">${esc(c.desc)}</p><div class="gc310ContractEconomy"><div><span>CLIENT VALUE</span><b>${money(client)}</b></div><div><span>YOUR SHARE</span><b>${money(share)}</b></div><div><span>CREW</span><b>${crew}</b></div></div><div class="tiny ${gate.ok?'muted':'dangerText'}">${esc(reason)} • full Risk ${c.risk} contract</div><div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn ${gate.ok&&!busy?'primary':''}" data-action="gc310Accept" data-id="${c.id}" ${!gate.ok||busy?'disabled':''}>JOIN CONTRACT CREW</button></div></div>`;
}
gc270Jobs=function(){
 const p=gc260FounderParty(),active=p?.expedition,board=gc310FreebladeContracts();
 return`<div class="hero"><div class="kicker">THE MERCENARY BOARD • NO COMPANY YET</div><h2>Take a place on somebody else's contract crew</h2><p>These are the same jobs companies take. You are being hired as one adventurer, so you receive an individual share instead of the full contract revenue.</p></div>${active?`<div class="sectionTitle"><h3>Current Contract</h3><span>Field Agency</span></div>${expeditionCard(p)}`:`${gc270FoundingStatusHTML()}<div class="sectionTitle"><h3>Open Contracts</h3><span>Risk 1–5 • reputation gates harder crews</span></div><div class="list">${board.map(gc310FreebladeContractCard).join('')}</div>${gc310KnownMercsHTML()}`}`;
};

const _gc270FreebladeYouGC310=gc270FreebladeYou;
gc270FreebladeYou=function(){
 let html=_gc270FreebladeYouGC310();
 html=html.replace('No roster. No headquarters. No one else to blame if the job goes bad.','No company yet. You earn your living by joining temporary contract crews, building relationships and taking your own share of completed work.');
 if(!gc260FounderParty()?.expedition)html+=gc310KnownMercsHTML();
 return html;
};

const _renderStartGC310=renderStart;
renderStart=function(){
 const out=_renderStartGC310(),app=document.getElementById('app');
 if(app){
  app.innerHTML=app.innerHTML.replace('You do not begin with a company. You begin with your name, cheap equipment and whatever work one adventurer can survive.','You do not begin with a company. You begin as one independent adventurer taking a place on other mercenaries’ contract crews.');
  app.innerHTML=app.innerHTML.replace('Take jobs alone, build a reputation and earn enough silver to found a real company. The management game is something you grow into.','Join full contracts, work beside recurring freelancers, earn your individual share, and eventually become established enough to put people under your own banner.');
 }
 return out;
};

const _recruitCardGC310=recruitCard;
recruitCard=function(a){
 let html=_recruitCardGC310(a);
 if(a?.gc310JobsWithFounder>0){
  const f=gc260Founder(),relationship=f?relLabel(relValue(f.id,a.id)):'Known';
  html=html.replace('</h4>',` <span class="gc310KnownTag">WORKED WITH YOU ×${a.gc310JobsWithFounder}</span></h4>`);
  html=html.replace(/no recurring wage/g,'paid from contract shares');
  html=html.replace('<div class="tiny muted">',`<div class="tiny gc310PriorHistory">${esc(relationship)} • known from your Freeblade years</div><div class="tiny muted">`);
 }
 return html;
};

const _renderContractsGC310=renderContracts;
renderContracts=function(){
 const html=_renderContractsGC310();
 if(!state||!gc270IsCompany())return html;
 return`<div class="gc310ShareEconomy"><span>CONTRACT-SHARE ECONOMY</span><b>Displayed pay is company revenue.</b><small>Adventurer shares and routine field expenses are already accounted for. Employees live on their share of completed work, so there is no weekly payroll.</small></div>${html}`;
};

const _processActionGC310=processAction;
processAction=function(el){
 if(el.dataset.action==='gc310Accept')return gc310AcceptContract(el.dataset.id);
 return _processActionGC310(el);
};

const _gc193DailyDashboardGC310=gc193DailyDashboard;
gc193DailyDashboard=function(){
 return _gc193DailyDashboardGC310().replace('v20.8 • COMMAND','v21.1 • FREELANCER ECONOMY');
};

function gc310InstallStyles(){
 if(document.getElementById('gc310Styles'))return;
 const st=document.createElement('style');st.id='gc310Styles';
 st.textContent='.gc310ContractEconomy{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:8px 0}.gc310ContractEconomy>div{padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:5px;background:rgba(255,255,255,.018);text-align:center}.gc310ContractEconomy span{display:block;font-size:7px;color:#8f8270;letter-spacing:.08em}.gc310ContractEconomy b{display:block;margin-top:2px;color:#d4b06f;font-size:11px}.gc310FreelanceContract.locked{opacity:.66}.gc310KnownMerc>div{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center}.gc310KnownMerc .blSvgPortrait{width:40px;height:40px}.gc310KnownMerc span b,.gc310KnownMerc span small,.gc310KnownMerc span em{display:block}.gc310KnownMerc span small,.gc310KnownMerc span em{font-size:8px;color:#938777;font-style:normal;margin-top:2px}.gc310CrewStrip,.gc310ShareReport,.gc310ShareEconomy{margin:8px 0;padding:8px;border:1px solid rgba(180,139,72,.25);border-left:3px solid #9b7441;border-radius:6px;background:rgba(125,87,40,.055)}.gc310CrewStrip span,.gc310ShareReport span,.gc310ShareEconomy span{display:block;font-size:7px;letter-spacing:.12em;color:#b39360}.gc310CrewStrip b,.gc310ShareReport b,.gc310ShareEconomy b{display:block;margin-top:2px;font-size:10px}.gc310CrewStrip small,.gc310ShareReport small,.gc310ShareReport em,.gc310ShareEconomy small{display:block;margin-top:3px;font-size:8px;color:#9a8d7a;font-style:normal}.gc310KnownTag{display:inline-block;margin-left:4px;padding:1px 4px;border:1px solid #655037;border-radius:999px;color:#c9a76e;font-size:6px}.gc310PriorHistory{color:#c8a96e;margin-bottom:3px}@media(max-width:390px){.gc310ContractEconomy{grid-template-columns:1fr 1fr}.gc310ContractEconomy>div:last-child{grid-column:1/-1}}';
 document.head.appendChild(st);
}
gc310InstallStyles();

const _auditGC310=audit;
audit=function(){
 const out=_auditGC310();
 out.v310FreelancerEconomy=GC310_VERSION;
 out.fullContractsBeforeCompany=true;
 out.persistentFreelancerPool=true;
 out.personalContractShares=true;
 out.sameMercenariesRecruitable=true;
 out.shareEconomyNoWeeklyPayroll=true;
 out.riskBoardExistsBeforeFounding=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC310_TEST=function(){
 const old=state;
 try{
  gc270CreateFreebladeState('veyric',{name:'Freeblade Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1});
  const f=gc260Founder(),p=gc260FounderParty(),board=gc310FreebladeContracts(),risks=board.map(x=>x.risk);
  const boardOk=risks.join(',')==='1,2,3,4,5',poolOk=gc310EnsurePool('veyric').length>=GC310_POOL_SIZE;
  const c=board[0],crew=gc310AssembleCrew(c,p),crewOk=p.members.length===gc310CrewSize(c)&&crew.every(a=>a.gc310Temporary);
  const recurring=crew[0],rid=recurring.id;
  crew.forEach(a=>a.status='Ready');gc310ReturnFreelancers(p,crew.map(a=>a.id),'veyric');
  const returned=gc310KnownFreelancer(rid,'veyric'),persistent=!!returned&&returned.gc310JobsWithFounder===1&&!state.roster.some(a=>a.id===rid);
  const client=gc310ClientValue(c),share=gc310ShareFromPay(c,c.reward,gc310CrewSize(c)),shareOk=share>0&&share<client;
  const fb=gc310Freeblade();fb.reputation=GC310_FOUNDING_REP;state.company.silver=GC270_FOUNDING_COST+20;
  const ready=gc270FoundingReady(),founded=gc270FoundCompany('Freeblade Guild')===true;
  const recruitable=founded&&state.regions.veyric.recruits.some(a=>a.id===rid);
  const saveCopy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=saveCopy.regions.veyric.gc310Freelancers!=null&&saveCopy.progression.phase==='company';
  return{ok:!!(boardOk&&poolOk&&crewOk&&persistent&&shareOk&&ready&&founded&&recruitable&&saveSafe),risks,pool:gc310RegionPool('veyric').length,crew:gc310CrewSize(c),persistent,client,share,ready,founded,recruitable,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
window.__GC270_TEST=window.__GC310_TEST;
