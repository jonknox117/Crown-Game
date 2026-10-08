/* Grim Company v21.4.1 — Presence stability hotfix and dungeon placement.
   Dungeons live with strategic work, directly below Campaigns and above Contracts. */
const GC341_VERSION='21.4.1';
let GC341_RENDER_QUEUED=false;
function gc341ScheduleRender(){
 if(GC341_RENDER_QUEUED||!state)return;
 GC341_RENDER_QUEUED=true;
 requestAnimationFrame(()=>{GC341_RENDER_QUEUED=false;if(state)try{render()}catch(e){gc341RuntimeError('scheduled render',e)}});
}
function gc341RuntimeError(where,e){
 try{
  const msg=String(e&&e.stack||e||'Unknown error'),entry={day:Number(state?.company?.day)||0,where:String(where||'runtime'),message:msg.slice(0,1800),version:GC341_VERSION};
  safeLocalSet('grimCompanyLastRuntimeError',JSON.stringify(entry));
  if(state){
   state.founderSystem=state.founderSystem||{};
   state.founderSystem.gc341LastRuntimeError=entry;
   if(state.timeSystem){state.timeSystem.gc199Mode='paused';state.timeSystem.gc199PauseReason='Paused after a recovered runtime error.'}
   save();
  }
  try{toast('A runtime error was contained. Simulation paused; your save was preserved.')}catch(_){}
 }catch(_){}
 return false;
}
function gc341Guard(label,fn,fallback){
 try{return fn()}catch(e){gc341RuntimeError(label,e);return fallback}
}

/* Prevent new Presence background systems from taking down the main simulation.
   If one fails, base company simulation survives and the game pauses safely. */
const _gc340TickFocusedGC341=gc340TickFocused;
gc340TickFocused=function(deltaDays){return gc341Guard('focused activity tick',()=>_gc340TickFocusedGC341(deltaDays),false)};
const _gc340AutonomyTickGC341=gc340AutonomyTick;
gc340AutonomyTick=function(deltaDays){return gc341Guard('autonomy tick',()=>_gc340AutonomyTickGC341(deltaDays),false)};

/* Focus completion used to render synchronously from inside the master time tick.
   Suppress that nested render and refresh once after the tick unwinds. */
const _gc340CompleteFocusedGC341=gc340CompleteFocused;
gc340CompleteFocused=function(act){
 const prior=typeof GC280_INTERNAL!=='undefined'?GC280_INTERNAL:false;
 try{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=true;
  return gc341Guard('focused activity completion',()=>_gc340CompleteFocusedGC341(act),false);
 }finally{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=prior;
  gc341ScheduleRender();
 }
};

/* Captain dispatch is also executed inside the simulation tick. Avoid nested full
   renders there; the normal live UI refresh will catch up on the next frame. */
gc340CaptainDispatch=function(p,c){
 const oldTab=state.ui.tab,oldRegion=state.currentRegion,prior=typeof GC280_INTERNAL!=='undefined'?GC280_INTERNAL:false;let ok=false;
 try{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=true;
  dispatchContract(c.id,p.id);ok=!!p.expedition;
 }catch(e){gc341RuntimeError('captain autonomous dispatch',e);ok=false}
 finally{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=prior;
  state.ui.tab=oldTab;state.currentRegion=oldRegion;
 }
 if(ok){gc199RecordFeed(`CAPTAIN AUTONOMY — ${p.name} accepted ${c.title} (Risk ${c.risk}).`,'command');save();gc341ScheduleRender()}
 return ok;
};

/* Strategic dungeon cards. */
function gc341DungeonProgress(d){
 const cleared=(d.rooms||[]).filter(r=>r.cleared).length,total=Math.max(1,(d.rooms||[]).length);
 return{cleared,total,pct:Math.round(cleared/total*100)};
}
function gc341DungeonActiveParty(d){
 return state.parties.find(p=>p.gc340DungeonRun?.dungeonId===d.id)||null;
}
function gc341DungeonCard(d,freeblade=false){
 const prog=gc341DungeonProgress(d),active=gc341DungeonActiveParty(d),f=gc260Founder(),need=gc320RiskLevel(d.risk);
 const companyQualified=freeblade?(typeof gc360Rank==='function'?gc360Rank(f)>=d.risk-1:(f?.lvl||1)>=need):state.parties.filter(p=>!p.expedition&&p.members.length&&gc320PartyQualification(p,{risk:d.risk}).ok).length;
 const status=d.cleared?'CLEARED':active?'IN PROGRESS':companyQualified?'AVAILABLE':'UNDERQUALIFIED';
 return`<div class="card gc341DungeonCard risk${d.risk} ${d.cleared?'cleared':''} ${active?'active':''}">
   <div class="gc330ContractTop"><div><span>DUNGEON • ${esc(status)}</span><h3>${esc(d.name)}</h3></div><div class="gc330RiskBadge"><b>${d.risk}</b><small>RISK</small></div></div>
   <div class="gc341DungeonBoss"><span>BOSS</span><b>${esc(d.bossName)}</b></div>
   <div class="gc330ContractFacts"><div><span>EXPLORED</span><b>${prog.cleared}/${prog.total}</b></div><div><span>PROGRESS</span><b>${prog.pct}%</b></div><div><span>HOARD</span><b>${d.cleared?'CLAIMED':'UNKNOWN'}</b></div></div>
   <div class="bar goldbar"><i style="width:${prog.pct}%"></i></div>
   <div class="gc330QualificationLine ${companyQualified?'ready':'blocked'}"><b>${active?`${esc(active.name)} inside`:d.cleared?'Site permanently cleared':freeblade?(companyQualified?'You are experienced enough to enter':(typeof gc360RiskName==='function'?`Need ${gc360RiskName(d.risk)} career`:`Need Level ${need}`)):(companyQualified?`${companyQualified} ${companyQualified===1?'party':'parties'} qualified`:'No qualified party')}</b><span>Persistent map • traps • mobs • loot • boss hoard</span></div>
   <div class="actions">${active?`<button class="btn primary" data-action="nav" data-tab="you">Open Dungeon</button>`:d.cleared?'':`<button class="btn ${companyQualified?'primary':''}" data-action="gc340DungeonEntry" data-id="${d.id}" ${companyQualified?'':'disabled'}>${freeblade?'Assemble Crew':'Choose Party'}</button>`}</div>
  </div>`;
}
function gc341DungeonBoardHTML(regionId,freeblade=false){
 const ds=(state.regions[regionId]?.gc340Dungeons||[]).filter(d=>!d.cleared||d.entered);
 if(!ds.length)return'';
 return`<div class="sectionTitle gc341DungeonTitle"><h3>Dungeons</h3><span>${ds.filter(d=>!d.cleared).length} active site${ds.filter(d=>!d.cleared).length===1?'':'s'}</span></div><div class="list gc341DungeonBoard">${ds.slice().sort((a,b)=>Number(a.cleared)-Number(b.cleared)||a.risk-b.risk).map(d=>gc341DungeonCard(d,freeblade)).join('')}</div>`;
}

/* Town is for personal activity. Dungeon opportunities belong to the strategic
   work hierarchy, not buried under YOU. */
gc340TownHTML=function(){
 const f=gc260Founder(),pr=gc340SyncPresence();if(!f||!pr)return'';
 if(pr.mode!=='town')return`<div class="sectionTitle"><h3>Presence</h3><span>${pr.mode==='dungeon'?'inside a dungeon':'away from town'}</span></div><div class="gc340Away"><b>Your physical presence is committed elsewhere.</b><span>Town focus actions and local Founder support resume when you return.</span></div>`;
 const defs=gc340TownDef(f.regionId),active=defs[pr.place]||defs.hall,support=active.stance?`Your presence strengthens ${active.stance} work at this HQ by ${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%.`:'This is your neutral management location.';
 return`<div class="sectionTitle"><h3>Town</h3><span>YOU are physically here</span></div><div class="gc340TownMap">${Object.entries(defs).map(([id,d])=>`<button class="gc340Place ${id} ${pr.place===id?'active':''}" data-action="gc340Move" data-value="${id}"><b>${d.icon}</b><span>${esc(d.name)}</span><em>${d.stance?esc(d.stance):'HOME'}</em></button>`).join('')}</div><div class="gc340PlacePanel"><div class="gc340PlaceHead"><div><span>${active.stance?`${active.stance.toUpperCase()} • ACTIVE PRESENCE`:'HOME'}</span><b>${esc(active.name)}</b><small>${esc(active.desc)}</small></div>${active.stance?`<strong>+${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%</strong>`:''}</div><p>${esc(support)}</p>${gc340ActivityHTML()}${!pr.activity&&active.stance?`<div class="gc340FocusGrid">${gc340PlaceActions(pr.place)}</div>`:''}</div>`;
};

/* Campaign → Dungeons → ordinary Contracts. Dungeon expeditions are represented
   in their own section rather than masquerading as 999-day contracts. */
gc330ContractsScreen=function(){
 const r=region();gc250EnsureRiskBoard(state.currentRegion);
 const active=state.parties.filter(p=>p.regionId===state.currentRegion&&p.expedition&&!p.expedition.gc340Dungeon),
       campaign=typeof gc240CampaignPanelHTML==='function'?gc240CampaignPanelHTML(state.currentRegion,false):'',
       dungeons=gc341DungeonBoardHTML(state.currentRegion,false);
 return`<div class="gc330PageLead"><span>CONTRACT DESK • ${esc(REGION_DEFS[state.currentRegion].name.toUpperCase())}</span><h2>Choose what is worth risking people for.</h2><p>Campaigns are strategic wars. Dungeons are persistent dangerous places. Contracts are ordinary work.</p></div><div class="gc330ContractContext"><span>THREAT <b>${Math.round(r.threat)}</b> • ${esc(threatText(r.threat))}</span><span>Every dungeon has its own fixed Risk and saved exploration state.</span></div>${active.length?`<div class="sectionTitle"><h3>In the Field</h3><span>${active.length} active</span></div><div class="list">${active.map(gc330ExpeditionCard).join('')}</div>`:''}${campaign}${dungeons}<div class="sectionTitle"><h3>Available Contracts</h3><span>Risk 1–5 always visible</span></div><div class="list">${r.contracts.slice().sort((a,b)=>a.risk-b.risk).map(gc330ContractCard).join('')}</div>`;
};

/* Freeblades have no Campaign layer yet, so discovered Dungeons sit directly
   above freelance contracts on the Jobs screen. */
const _gc270JobsGC341=gc270Jobs;
gc270Jobs=function(){
 let html=_gc270JobsGC341();
 if(gc340FounderInDungeon())return gc340DungeonRunHTML(gc340FounderInDungeon());
 const board=gc341DungeonBoardHTML(state.currentRegion,true);
 if(!board)return html;
 const marker='<div class="sectionTitle"><h3>Available Jobs</h3>';
 if(html.includes(marker))return html.replace(marker,board+marker);
 return board+html;
};

function gc341InstallStyles(){
 if(document.getElementById('gc341Styles'))return;
 const st=document.createElement('style');st.id='gc341Styles';
 st.textContent=`
 .gc341DungeonTitle{margin-top:12px!important}.gc341DungeonBoard{margin-bottom:10px}.gc341DungeonCard{border-left:3px solid #7e443d!important}.gc341DungeonCard.active{border-left-color:#b87853!important}.gc341DungeonCard.cleared{opacity:.58;border-left-color:#536b53!important}.gc341DungeonBoss{display:flex;justify-content:space-between;gap:8px;padding:6px 7px;margin:6px 0;background:#15100f;border:1px solid rgba(166,74,61,.12);border-radius:5px}.gc341DungeonBoss span{font-size:6px;letter-spacing:.12em;color:#a65f54}.gc341DungeonBoss b{font-size:9px}
 `;
 document.head.appendChild(st);
}
gc341InstallStyles();

/* Lightweight runtime diagnostic lives in the existing menu only if a recovered
   error exists, so normal players never see debug clutter. */
const _showMenuGC341=showMenu;
showMenu=function(){
 const out=_showMenuGC341(),raw=safeLocalGet('grimCompanyLastRuntimeError'),sheet=document.getElementById('sheet');
 if(raw&&sheet){try{const e=JSON.parse(raw);sheet.querySelector('.list')?.insertAdjacentHTML('beforeend',`<button class="card" data-action="gc341Diagnostic"><b>Runtime Diagnostic</b><div class="tiny muted">${esc(e.where)} • Day ${e.day||'?'} • v${esc(e.version||'')}</div></button>`)}catch(_){}}
 return out;
};
const _processActionGC341=processAction;
processAction=function(el){
 if(el.dataset.action==='gc341Diagnostic'){
  let e={};try{e=JSON.parse(safeLocalGet('grimCompanyLastRuntimeError')||'{}')}catch(_){}
  return modal(`<div class="sheetHead"><h3>Runtime Diagnostic</h3><button class="x" data-action="close">×</button></div><div class="notice">If the game contained a Presence-system error, it was paused rather than allowed to destroy the running session.</div><div class="card"><b>${esc(e.where||'No captured error')}</b><div class="tiny muted">Day ${esc(e.day||'?')} • ${esc(e.version||'')}</div><pre style="white-space:pre-wrap;font-size:7px;margin-top:7px">${esc(e.message||'No runtime error has been captured.')}</pre></div>`);
 }
 return _processActionGC341(el);
};
