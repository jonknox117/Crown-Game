/* Grim Company v21.3 — Interface & QoL: clean core screens and visual priority. */

function gc330RiskCapForLevel(level){
 let cap=1;for(const r of [1,2,3,4,5])if(level>=gc320RiskLevel(r))cap=r;return cap;
}
function gc330PersonCard(a){
 const d=derived(a),legacy=typeof gc300Legacy==='function'?gc300Legacy(a):null,title=legacy?.activeTitle||'',risk=gc330RiskCapForLevel(a.lvl||1);
 const status=gc193OrderLabel(a),founder=a.id===state.company.founderId;
 return`<button class="gc330PersonRow ${a.status==='Recovering'?'wounded':''}" data-action="inspect" data-id="${a.id}"><div class="gc330Face">${blPortraitHTML(a,'blPortraitMini')}</div><div class="gc330PersonMain"><div class="gc330Name"><b>${esc(a.name)}</b>${founder?'<span>YOU</span>':''}${title?`<em>${esc(title)}</em>`:''}</div><small>Lv.${a.lvl} ${esc(a.culture)} ${esc(a.className)}</small><div class="gc330PersonStatus"><span>${esc(status)}</span><span>Risk ${risk} qualified</span>${a.injury?`<strong>${esc(a.injury)}</strong>`:''}</div><div class="hpbar"><i style="width:${clamp(a.hp/d.maxHp*100,0,100)}%"></i></div></div><i>›</i></button>`;
}
function gc330RecruitCard(a){
 const known=Number(a.gc310JobsWithFounder)||0,cost=gc201HireCost(a),relation=known&&gc260Founder()?relLabel(relValue(gc260Founder().id,a.id)):'';
 return`<div class="gc330RecruitRow"><button class="gc330RecruitIdentity" data-action="inspectRecruit" data-id="${a.id}"><div class="gc330Face">${blPortraitHTML(a,'blPortraitMini')}</div><div><b>${esc(a.name)}</b><small>Lv.${a.lvl} ${esc(a.culture)} ${esc(a.className)}</small>${known?`<em>Worked with you ×${known} • ${esc(relation)}</em>`:''}</div></button><button class="btn goldbtn" data-action="hire" data-id="${a.id}" ${state.company.silver<cost?'disabled':''}>Sign ${money(cost)}</button></div>`;
}
function gc330PartyRiskCap(p){
 let cap=0;for(const r of [1,2,3,4,5])if(gc320PartyQualification(p,{risk:r}).ok)cap=r;return cap;
}
function gc330PartyCard(p){
 const ms=partyMembers(p),captain=state.roster.find(a=>a.id===p.captainId),risk=gc330PartyRiskCap(p),active=!!p.expedition;
 return`<div class="card gc330PartyCard"><div class="gc330PartyHead"><div><b>${esc(p.name)}</b><small>${captain?`Captain ${esc(captain.name)} • `:''}${p.missions||0} contracts • ${p.wins||0} wins</small></div><div class="gc330PartyRisk">R${risk||'—'}</div></div><div class="gc330PartyFaces">${ms.map(a=>`<button data-action="inspect" data-id="${a.id}" title="${esc(a.name)}">${blPortraitHTML(a,'blPortraitMini')}<span>Lv.${a.lvl}</span></button>`).join('')||'<span class="muted">No members assigned.</span>'}</div><div class="gc330PartyMeta"><span>${ms.length}/${partyCap(p.regionId)} members</span><span>Cohesion ${Math.round(p.cohesion||0)}</span><span>${active?'IN FIELD':`Risk ${risk||1} capable`}</span></div><div class="tactics">${['Cautious','Balanced','Aggressive'].map(t=>`<button class="tactic ${p.tactic===t?'active':''}" data-action="tactic" data-id="${p.id}" data-value="${t}" ${active?'disabled':''}>${t}</button>`).join('')}</div><div class="actions"><button class="btn" data-action="editParty" data-id="${p.id}" ${active?'disabled':''}>Manage Party</button>${active?'<button class="btn primary" data-action="nav" data-tab="contracts">Monitor</button>':''}</div></div>`;
}
function gc330RegionVitals(r){
 return`<div class="gc330RegionVitals"><div><span>THREAT</span><b>${Math.round(r.threat)}</b><i><em style="width:${clamp(r.threat,0,100)}%"></em></i></div><div><span>STABILITY</span><b>${Math.round(r.stability)}</b><i><em style="width:${clamp(r.stability,0,100)}%"></em></i></div><div><span>PROSPERITY</span><b>${Math.round(r.prosperity)}</b><i><em style="width:${clamp(r.prosperity,0,100)}%"></em></i></div></div>`;
}
function gc330CompanyOverview(){
 const r=region(),d=regionDef(),active=localParties().filter(p=>p.expedition),recovering=localRoster().filter(a=>a.status==='Recovering'),ready=localRoster().filter(a=>a.status==='Ready').length;
 const command=typeof gc280CommandStrip==='function'?gc280CommandStrip(state.currentRegion):'';
 return`<div class="gc330PageLead"><span>${esc(d.name.toUpperCase())}</span><h2>${esc(r.hq.name)}</h2><p>${active.length} in field • ${ready} ready • ${recovering.length} recovering</p></div>${gc330RegionVitals(r)}${command||''}<div class="gc330Quick"><button data-action="gc330CompanySub" data-value="people"><b>${localRoster().length}</b><span>People</span></button><button data-action="gc330CompanySub" data-value="parties"><b>${localParties().length}</b><span>Parties</span></button><button data-action="market"><b>${Math.round(r.prosperity)}</b><span>Market</span></button><button data-action="gc330Vault"><b>${localInventory().reduce((n,x)=>n+x.qty,0)}</b><span>Vault</span></button></div><div class="sectionTitle"><h3>HQ Stances</h3><span>what your people are doing now</span></div>${gc201StanceDashboard(state.currentRegion)}${recovering.length?`<div class="sectionTitle"><h3>Needs Time</h3><span>${recovering.length} recovering</span></div><div class="gc330CompactList">${recovering.slice(0,4).map(gc330PersonCard).join('')}</div>`:''}${active.length?`<div class="sectionTitle"><h3>In the Field</h3><button class="btn ghost" data-action="nav" data-tab="contracts">Open Contracts</button></div><div class="gc330FieldSummary">${active.map(p=>`<button class="card" data-action="nav" data-tab="contracts"><b>${esc(p.name)}</b><span>${esc(p.expedition.contract.title)}</span><em>Risk ${p.expedition.contract.risk} • ${Math.round(p.expedition.progress||0)}%</em></button>`).join('')}</div>`:''}`;
}
function gc330PeopleScreen(){
 const r=region(),locals=localRoster();
 return`<div class="gc330PageLead"><span>ROSTER</span><h2>Your people</h2><p>${locals.length}/${rosterCap()} stationed in ${esc(REGION_DEFS[state.currentRegion].name)}.</p></div><div class="gc330CompactList">${locals.length?locals.map(gc330PersonCard).join(''):'<div class="empty">No adventurers stationed here.</div>'}</div><div class="sectionTitle"><h3>Recruitment</h3><span>Stability ${Math.round(r.stability)} • ${stabilityText(r.stability)}</span></div><div class="gc330RecruitList">${r.recruits.length?r.recruits.map(gc330RecruitCard).join(''):'<div class="empty">No recruits currently available.</div>'}</div>`;
}
function gc330PartiesScreen(){
 const parties=localParties();
 return`<div class="gc330PageLead"><span>PARTIES</span><h2>Field formations</h2><p>Experienced captains and veteran cores determine which Risk tiers a party can accept.</p></div><div class="sectionTitle"><h3>${parties.length} Parties</h3><button class="btn primary" data-action="newParty">+ New Party</button></div><div class="list">${parties.length?parties.map(gc330PartyCard).join(''):'<div class="empty">No parties organized at this HQ.</div>'}</div>`;
}
function gc330HQScreen(){
 const r=region(),d=regionDef(),command=typeof gc280CommandStrip==='function'?gc280CommandStrip(state.currentRegion):'';
 return`<div class="gc330PageLead"><span>HEADQUARTERS</span><h2>${esc(r.hq.name)}</h2><p>${esc(d.name)} • facilities and infrastructure</p></div>${command||''}<div class="gc330Quick gc330HQQuick"><button data-action="market"><b>Market</b><span>${marketQualityText(r.prosperity)}</span></button><button data-action="gc330Vault"><b>Vault</b><span>Gear & caches</span></button><button data-action="facilities"><b>Systems</b><span>Exact effects</span></button></div><div class="sectionTitle"><h3>Facilities</h3><span>mechanical upgrades</span></div><div class="gc330Facilities">${Object.entries(HQ_DEFS).map(([k,x])=>{const lv=r.hq.upgrades[k]||0,cost=hqUpgradeCost(k);return`<div class="card"><div class="statline"><b>${x.icon} ${esc(k)}</b><span>${lv}/${x.max}</span></div><small>${esc(x.desc)}</small><div class="actions"><button class="btn ghost" data-action="hqinfo" data-key="${esc(k)}">Details</button><button class="btn ${lv<x.max&&state.company.silver>=cost?'goldbtn':''}" data-action="upgrade" data-key="${esc(k)}" ${lv>=x.max||state.company.silver<cost?'disabled':''}>${lv>=x.max?'MAX':money(cost)}</button></div></div>`}).join('')}</div>`;
}
function gc330CompanyScreen(){
 const ui=gc330UIState(),body=ui.gc330CompanySub==='people'?gc330PeopleScreen():ui.gc330CompanySub==='parties'?gc330PartiesScreen():ui.gc330CompanySub==='hq'?gc330HQScreen():gc330CompanyOverview();
 return gc330CompanySubnav()+body;
}

function gc330ContractQualifiedCount(c){
 return localParties(c.regionId).filter(p=>!p.expedition&&p.members.length&&!p.gc320IndependentCrew&&gc320PartyQualification(p,c).ok).length;
}
function gc330ContractCard(c){
 const nem=c.nemesisId?state.nemeses.find(n=>n.id===c.nemesisId&&n.alive):null,count=gc330ContractQualifiedCount(c),need=gc320RiskLevel(c.risk),r=state.regions[c.regionId];
 return`<div class="card gc330ContractCard risk${c.risk} ${count?'':'blocked'}"><div class="gc330ContractTop"><div><span>${esc(c.type)} • ${esc(c.species)}</span><h3>${esc(c.title)}</h3></div><div class="gc330RiskBadge"><b>${c.risk}</b><small>RISK</small></div></div><div class="gc330ContractFacts"><div><span>COMPANY REVENUE</span><b>${money(c.reward)}</b></div><div><span>HOSTILES</span><b>${c.enemyCount}</b></div><div><span>FIELD</span><b>${esc(c.check)}</b></div></div>${nem?`<div class="gc330Boss"><span>NAMED TARGET</span><b>${esc(nem.name)}</b></div>`:''}<div class="gc330QualificationLine ${count?'ready':'blocked'}"><b>${count?`${count} ${count===1?'party':'parties'} qualified`:'No qualified party'}</b><span>Risk ${c.risk} benchmark Lv.${need} • regional Threat ${Math.round(r.threat)}</span></div><div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn ${count?'primary':''}" data-action="chooseParty" data-id="${c.id}" ${count?'':'disabled'}>${count?'Choose Party':'Underqualified'}</button></div></div>`;
}
function gc330ExpeditionStatus(p){
 const e=p.expedition;if(e.gc260PendingDecision)return'WAITING ON YOU';if(e.battle)return'AUTO-COMBAT';if(e.gc320Independent)return'INDEPENDENT WORK';return'TRAVELING';
}
function gc330ExpeditionCard(p){
 const e=p.expedition;if(!e)return'';
 const members=partyMembers(p),down=e.battle?.allies?.filter(u=>u.gc320Downed)||[],recent=(e.battle?.log||e.events||[]).slice(-4),contact=e.battle?'Combat active':`${gc201ContactLabel(gc201ContactRate(p))} hostile pressure`;
 const field=typeof gc250FieldEncounterHTML==='function'?gc250FieldEncounterHTML(e):'';
 return`<div class="card gc330Expedition ${down.length?'critical':''}"><div class="gc330ExpeditionHead"><div><span>${gc330ExpeditionStatus(p)} • RISK ${e.contract.risk}</span><h3>${esc(p.name)}</h3><small>${esc(e.contract.title)}</small></div><strong>${Math.round(e.progress||0)}%</strong></div><div class="bar goldbar"><i style="width:${clamp(e.progress||0,0,100)}%"></i></div><div class="gc330PartyFaces">${members.map(a=>`<button data-action="inspect" data-id="${a.id}" title="${esc(a.name)}">${blPortraitHTML(a,'blPortraitMini')}<span>${a.status==='Dead'?'DEAD':`Lv.${a.lvl}`}</span></button>`).join('')}</div>${down.length?`<div class="gc320DownedStrip"><b>${down.length} DOWNED — MORTAL DANGER</b><span>${down.map(u=>`${esc(u.name)} • ${gc320DangerLabel(gc320MortalityPreview(p,u,false))}`).join(' · ')}</span></div>`:''}<div class="gc330ExpeditionState"><span>${esc(contact)}</span><span>${esc(e.contract.species)} opposition</span></div>${field||''}<div class="gc330Recent"><b>RECENT</b>${recent.length?recent.map(x=>`<div>${esc(x)}</div>`).join(''):'<div class="muted">No significant events yet.</div>'}</div><div class="actions">${!e.battle?`<button class="btn" data-action="advance" data-id="${p.id}">Push Pace</button>`:''}<button class="btn ghost" data-action="gc330FullLog" data-id="${p.id}">Full Log</button><button class="btn dangerBtn" data-action="gc320Retreat" data-id="${p.id}" ${e.gc260PendingDecision?'disabled':''}>Withdraw</button></div></div>`;
}
function gc330ContractsScreen(){
 const r=region();gc250EnsureRiskBoard(state.currentRegion);
 const active=state.parties.filter(p=>p.regionId===state.currentRegion&&p.expedition),campaign=typeof gc240CampaignPanelHTML==='function'?gc240CampaignPanelHTML(state.currentRegion,false):'';
 return`<div class="gc330PageLead"><span>CONTRACT DESK • ${esc(REGION_DEFS[state.currentRegion].name.toUpperCase())}</span><h2>Choose what is worth risking people for.</h2><p>Risk is the work you choose. Threat is how hostile the region makes that work.</p></div><div class="gc330ContractContext"><span>THREAT <b>${Math.round(r.threat)}</b> • ${esc(threatText(r.threat))}</span><span>Displayed pay is company revenue after ordinary adventurer shares and field expenses.</span></div>${active.length?`<div class="sectionTitle"><h3>In the Field</h3><span>${active.length} active</span></div><div class="list">${active.map(gc330ExpeditionCard).join('')}</div>`:''}${campaign}<div class="sectionTitle"><h3>Available Work</h3><span>Risk 1–5 always visible</span></div><div class="list">${r.contracts.slice().sort((a,b)=>a.risk-b.risk).map(gc330ContractCard).join('')}</div>`;
}
function gc330WorldRegion(id){
 const r=state.regions[id],d=REGION_DEFS[id],req=branchRequirements(id),current=id===state.currentRegion,cmd=typeof gc280CommandStrip==='function'?gc280CommandStrip(id):'';
 return`<div class="card gc330WorldRegion ${current?'current':''} ${r.lost?'lost':''}"><div class="gc330WorldHead"><div><span>${esc(d.culture)}</span><h3>${esc(d.name)}</h3></div><b>${r.hq.established?'HQ ACTIVE':'NO HQ'}</b></div>${gc330RegionVitals(r)}<div class="gc330WorldMeta"><span>Settlements ${r.settlements}/${r.totalSettlements}</span><span>Nemeses ${state.nemeses.filter(n=>n.regionId===id&&n.alive).length}</span></div>${cmd||''}<div class="actions">${r.hq.established?`<button class="btn ${current?'':'primary'}" data-action="switchRegion" data-id="${id}" ${current?'disabled':''}>${current?'Current HQ':'Switch HQ'}</button>`:`<button class="btn goldbtn" data-action="foundBranch" data-id="${id}">Found Branch • ${money(req.cost)} • ${req.renown} Renown</button>`}<button class="btn ghost" data-action="regionInfo" data-id="${id}">Details</button></div></div>`;
}
function gc330WorldScreen(){
 const established=REGION_ORDER.filter(id=>state.regions[id]?.hq?.established).length,command=typeof gc280CompanyCommandHTML==='function'?gc280CompanyCommandHTML():'';
 return`<div class="gc330PageLead"><span>THE WORLD</span><h2>${established}/5 regions under your reach</h2><p>Threat is what remains dangerous. Stability and Prosperity show whether civilization is actually recovering.</p></div>${command||''}<div class="list">${REGION_ORDER.map(gc330WorldRegion).join('')}</div>`;
}
function gc330YouScreen(){
 const f=gc260Founder();if(!f)return gc260RenderYou();
 const d=derived(f),p=gc260FounderParty(),fs=gc260System(),legacy=typeof gc300Legacy==='function'?gc300Legacy(f):null,title=legacy?.activeTitle||'';
 if(f.status==='Dead')return`<div class="gc330PageLead danger"><span>THE FOUNDER • FALLEN</span><h2>${esc(f.name)}</h2><p>Your company survives you. Your career remains in its history.</p></div><div class="card gc330FounderDead">${blPortraitHTML(f,'blPortraitLarge')}<div><b>Lv.${f.lvl} ${esc(f.culture)} ${esc(f.className)}</b><small>${f.missions} contracts • ${f.kills} kills</small></div></div><button class="btn wide" data-action="inspect" data-id="${f.id}">View Full Legacy</button>`;
 const rels=gc260FounderRelationships(f).slice(0,3);
 return`<div class="gc330YouLead"><div class="gc330YouPortrait">${blPortraitHTML(f,'blPortraitLarge')}</div><div><span>YOU • ${esc(gc260LocationText(f))}</span><h2>${esc(f.name)}</h2>${title?`<em>${esc(title)}</em>`:''}<p>Lv.${f.lvl} ${esc(f.race)} • ${esc(f.culture)} ${esc(f.className)}</p></div></div>${gc260ActivityHTML(f)}<div class="gc330YouVitals"><div><span>HP</span><b>${Math.round(f.hp)}/${d.maxHp}</b></div><div><span>LEVEL</span><b>${f.lvl}</b></div><div><span>XP</span><b>${f.lvl>=GC194_MAX_LEVEL?'MAX':`${f.xp}/${xpNeed(f.lvl)}`}</b></div><div><span>CONTRACTS</span><b>${legacy?.contracts??f.missions??0}</b></div></div><div class="actions gc330YouActions"><button class="btn" data-action="inspect" data-id="${f.id}">Character Sheet</button><button class="btn" data-action="gear" data-id="${f.id}" ${f.status==='Expedition'?'disabled':''}>Equipment</button>${p?.expedition?'<button class="btn primary" data-action="nav" data-tab="contracts">Monitor Expedition</button>':''}</div>${gc320FounderStancesHTML()}${gc320IndependentWorkHTML()}${f.status==='Ready'&&!fs.activity?gc260HQAgencyHTML(f,p):''}${rels.length?`<div class="sectionTitle"><h3>Closest Relationships</h3><span>details on character sheet</span></div><div class="gc330Relations">${rels.map(x=>`<button data-action="inspect" data-id="${x.a.id}"><span>${esc(x.a.name)}</span><b class="${x.v>0?'relGood':'relBad'}">${esc(relLabel(x.v))}</b></button>`).join('')}</div>`:''}`;
}

const _renderGC330B=render;
render=function(){
 if(!state)return _renderGC330B();
 if(gc270IsFreeblade()){
  const out=_renderGC330B();document.body.classList.add('gc330Visual');return out;
 }
 gc330UIState();
 const app=document.getElementById('app'),ui=state.ui;
 const body=ui.tab==='you'?gc330YouScreen():ui.tab==='company'?gc330CompanyScreen():ui.tab==='contracts'?gc330ContractsScreen():gc330WorldScreen();
 document.body.classList.add('gc330Visual');app.className='app gc330UI';app.innerHTML=gc330Topbar()+`<div class="screen gc330Screen">${body}</div>`;
 document.getElementById('nav').innerHTML=gc330NavHTML();
 save();
 if(typeof gc199MountClock==='function')requestAnimationFrame(gc199MountClock);
 if(typeof gc321Locked==='function'&&gc321Locked())requestAnimationFrame(gc321EnsureModal);
 return true;
};

/* Reports prioritize consequence over bookkeeping while preserving every legacy block. */
const _showReportGC330=showReport;
showReport=function(r){
 const out=_showReportGC330(r),sheet=document.getElementById('sheet');if(!sheet)return out;
 sheet.classList.toggle('gc330DeathReport',!!r?.deaths?.length);
 const old=sheet.querySelector('.gc330ReportLead');if(old)old.remove();
 const headline=r?.deaths?.length?(r.win?'PYRRHIC VICTORY':'CATASTROPHIC RETURN'):(r?.win?'CONTRACT COMPLETE':'CONTRACT FAILED');
 const detail=r?.deaths?.length?`${r.deaths.length} adventurer${r.deaths.length===1?'':'s'} did not come home.`:(r?.win?`${money(r.pay||0)} company revenue.`:'No payment. The company absorbs the loss.');
 sheet.querySelector('.sheetHead')?.insertAdjacentHTML('afterend',`<div class="gc330ReportLead ${r?.deaths?.length?'danger':r?.win?'good':'warn'}"><span>${esc(headline)}</span><b>${esc(r?.title||'Expedition')}</b><small>${esc(detail)}</small></div>`);
 return out;
};
