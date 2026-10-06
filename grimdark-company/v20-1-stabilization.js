/* Grim Company v20.1 stabilization — remove remaining day-era UI assumptions. */
const GC201_STABILIZATION='20.1';

/* Injured adventurers are physically in the Recover stance even while their
   status is Recovering, so the four-stance dashboard always accounts for them. */
gc201Team=function(regionId,stance){
 return state.roster.filter(a=>{
   if(a.regionId!==regionId||a.status==='Dead'||a.status==='Expedition'||a.status==='Captured')return false;
   if(stance==='Recover')return a.status==='Recovering'||(a.status==='Ready'&&a.dailyOrder==='Recover');
   return a.status==='Ready'&&a.dailyOrder===stance;
 });
};

/* v19.4 used to append a daily-risk sentence on dispatch. Replace it with the
   v20.1 native continuous-pressure language and initialize tick-era clocks. */
const _dispatchContractGC201=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_dispatchContractGC201(cid,pid),p=state.parties.find(x=>x.id===pid),e=p?.expedition;
 if(e){
   e.gc201Momentum=0;e.gc201CombatClock=0;e.gc201ContactExposure=0;
   e.events=(e.events||[]).filter(x=>!/daily hostile-contact risk|field operation continues autonomously/i.test(String(x)));
   e.events.push(`Continuous contact pressure: ${gc201ContactLabel(gc201ContactRate(p))} at departure.`);save();render();
 }
 return out;
};

/* Return reports no longer claim that completing a contract advanced a day, and
   they never pause the living company. */
showReport=function(r){
 if(!r)return;const text=`${r.win?'CONTRACT COMPLETE':'CONTRACT FAILED'} — ${r.title||'Expedition returned'}`;gc199RecordFeed(text,r.win?'return':'danger');
 if(r.pay)gc199RecordFeed(`${r.title}: ${money(r.pay)} paid.`,'return');if(r.deaths?.length)gc199RecordFeed(`${r.title}: dead — ${r.deaths.join(', ')}.`,'danger');
 toast(r.win?'A party completed its contract.':'A party returned from a failed contract.');
 modal(`<div class="sheetHead"><div><h3>${r.win?'CONTRACT COMPLETE':'CONTRACT FAILED'}</h3><div class="tiny muted">The company is still running</div></div><button class="x" data-action="close">×</button></div><div class="hero"><div class="kicker">${esc(r.title||'Expedition')}</div><h2>${r.win?'They came back.':'The contract went bad.'}</h2><p>${r.win?`Payment ${money(r.pay||0)}.`:'No contract payment.'}</p></div>${r.loot?itemHTML(r.loot):''}${r.cache?`<div class="notice"><b>${esc(r.cache.name)}</b> added to the Vault.</div>`:''}${r.artifact?`<div class="notice rarity-5"><b>Artifact recovered:</b> ${esc(r.artifact.name)}</div>`:''}${r.deaths?.length?`<div class="card danger"><b>Dead:</b> ${r.deaths.map(esc).join(', ')}</div>`:'<div class="card good"><b>No confirmed deaths.</b></div>'}<div class="notice">Travel, HQ stances and other parties continue progressing while this report is open.</div>`);
};

/* Facility upgrades modify the four stances passively; adventurers no longer
   need a separate Facility job. */
if(HQ_DEFS?.Infirmary)HQ_DEFS.Infirmary.desc='Improves continuous Recover healing and injury recovery.';
if(HQ_DEFS?.['Training Yard'])HQ_DEFS['Training Yard'].desc='Improves continuous Train XP. Training partners add a diminishing group bonus.';
if(HQ_DEFS?.['Contract Office'])HQ_DEFS['Contract Office'].desc='Adds contract capacity/pay and contributes to shared Scout progress.';
if(HQ_DEFS?.['Occult Archive'])HQ_DEFS['Occult Archive'].desc='Improves supernatural intelligence and shared Scout progress.';
const _hqInfoGC201=hqInfo;
hqInfo=function(k){
 const lv=hq().upgrades[k]||0;
 if(k==='Infirmary')return modal(`<div class="sheetHead"><h3>Infirmary</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: Recover heals ${Math.round((.14+lv*.018)*100)}% max HP per simulation day before individual modifiers, and injuries recover faster.</div></div>`);
 if(k==='Training Yard')return modal(`<div class="sheetHead"><h3>Training Yard</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: +${lv*2} base XP-rate to every adventurer currently Training.</div></div>`);
 if(k==='Contract Office')return modal(`<div class="sheetHead"><h3>Contract Office</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: +${lv*5}% base contract pay, +${lv} board slot${lv===1?'':'s'}, and a small boost to shared scouting work.</div></div>`);
 if(k==='Occult Archive')return modal(`<div class="sheetHead"><h3>Occult Archive</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: stronger starting occult intel and +${lv*6}% shared Scout progress.</div></div>`);
 return _hqInfoGC201(k);
};

const _auditGC201Stabilization=audit;
audit=function(){const out=_auditGC201Stabilization();out.v201Stabilized=true;out.dispatchUsesContinuousPressure=true;out.returnReportsDoNotPause=true;out.recoveringCountedInStance=true;out.facilitiesArePassiveModifiers=true;return out};
window.__BL_AUDIT=audit;

/* --------------------------------------------------------------------------
   v20.1.2 QUALITY PASS — recovery must visibly flow, HQ work should feel alive,
   and common management actions should never make the player hunt for updates.
   -------------------------------------------------------------------------- */
const GC201_QUALITY='20.1.2';
const GC202_RECOVER_HP_PER_DAY=.36;
const GC202_INFIRMARY_HP_PER_LEVEL=.04;
const GC202_PASSIVE_HP_PER_DAY=.015;
const GC202_INJURY_SPEED=1.80;
const GC202_INFIRMARY_INJURY_SPEED=.22;
const GC202_STANCE_INFO={
 Scout:{icon:'⌖',desc:'Work one intelligence lead together. Shared time can build relationships.'},
 Patrol:{icon:'⚔',desc:'Work one regional patrol together. Shared danger can build relationships.'},
 Train:{icon:'✦',desc:'Train together. Everyone gains personal XP and benefits from the group.'},
 Recover:{icon:'✚',desc:'Focused individual healing and injury recovery.'}
};
let GC202_RENDER_PENDING=false;

function gc202InitAdventurer(a){
 if(!a)return a;const w=gc200Work(a);
 if(!Number.isFinite(Number(w.gc201HealFraction)))w.gc201HealFraction=0;
 if(a.status==='Recovering'){
   const rem=Math.max(.05,Number(w.recoveryLeft)||Number(a.recovery)||1);
   if(!Number.isFinite(Number(w.gc202RecoveryTotal))||Number(w.gc202RecoveryTotal)<rem)w.gc202RecoveryTotal=rem;
   if(w.gc202WasRecovering!==true){w.recoveryLeft=rem;w.gc202RecoveryTotal=rem;w.gc202InjuryName=a.injury||'Injury';w.gc202WasRecovering=true}
 }else w.gc202WasRecovering=false;
 return a;
}
function gc202InitState(s=state){if(!s)return s;(s.roster||[]).forEach(gc202InitAdventurer);s.timeSystem=s.timeSystem||{};s.timeSystem.gc201Quality=GC201_QUALITY;return s}
const _normalizeStateGC202=normalizeState;
normalizeState=function(s){s=_normalizeStateGC202(s);return gc202InitState(s)};
const _createStateGC202=createState;
createState=function(name,startRegion='veyric'){return gc202InitState(_createStateGC202(name,startRegion))};

function gc202TraitHealPerDay(a){return(a?.traits||[]).reduce((n,t)=>n+(Number(TRAITS[t]?.heal)||0),0)}
function gc202RecoveryMetrics(a){
 const max=derived(a).maxHp,inf=hq(a.regionId).upgrades.Infirmary||0,w=gc200Work(a),focused=a.status==='Recovering'||a.dailyOrder==='Recover';
 const hpPct=focused?GC202_RECOVER_HP_PER_DAY+inf*GC202_INFIRMARY_HP_PER_LEVEL:GC202_PASSIVE_HP_PER_DAY;
 const hpPerDay=max*hpPct+(focused?gc202TraitHealPerDay(a):0),visualHp=clamp((Number(a.hp)||0)+(Number(w.gc201HealFraction)||0),0,max);
 const injurySpeed=GC202_INJURY_SPEED+inf*GC202_INFIRMARY_INJURY_SPEED,remaining=a.status==='Recovering'?Math.max(0,Number(w.recoveryLeft)||0):0,total=Math.max(remaining,Number(w.gc202RecoveryTotal)||remaining||0);
 const injuryPct=total>0?clamp((1-remaining/total)*100,0,100):100,simSpeed=Math.max(1,gc199Speed()||1),daySec=GC199_DAY_MS/1000;
 const hpPerSec=hpPerDay/daySec,hpEta=hpPerSec>0?Math.max(0,(max-visualHp)/(hpPerSec*simSpeed)):0,injuryEta=remaining>0?(remaining/injurySpeed)*daySec/simSpeed:0;
 return{max,inf,w,focused,hpPct,hpPerDay,hpPerSec,visualHp,injurySpeed,remaining,total,injuryPct,hpEta,injuryEta};
}
function gc202Seconds(sec){return gc199FormatSeconds(Math.max(0,sec||0))}
function gc202ScheduleRender(){
 if(GC202_RENDER_PENDING||!state)return;GC202_RENDER_PENDING=true;
 requestAnimationFrame(()=>{GC202_RENDER_PENDING=false;if(state)render()});
}

/* Actual HP stays integer-compatible for combat, but fractional healing is exposed
   every tick in the UI instead of being hidden until the next full render. */
gc201RecoveryTick=function(a,deltaDays){
 if(!gc193AtHQ(a)||deltaDays<=0)return;gc202InitAdventurer(a);const m=gc202RecoveryMetrics(a),w=m.w;
 a.hp=clamp(Number(a.hp)||0,0,m.max);
 if(a.hp<m.max){
   w.gc201HealFraction=(Number(w.gc201HealFraction)||0)+m.hpPerDay*deltaDays;
   const whole=Math.floor(w.gc201HealFraction+1e-8);
   if(whole>0){w.gc201HealFraction-=whole;a.hp=Math.min(m.max,a.hp+whole)}
 }else w.gc201HealFraction=0;
 if(a.status==='Recovering'){
   if(w.gc202WasRecovering!==true||w.gc202InjuryName!==a.injury){
     w.recoveryLeft=Math.max(.05,Number(a.recovery)||1);w.gc202RecoveryTotal=w.recoveryLeft;w.gc202InjuryName=a.injury||'Injury';w.gc202WasRecovering=true;
   }
   w.recoveryLeft=Math.max(0,Number(w.recoveryLeft)-deltaDays*m.injurySpeed);a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
   if(w.recoveryLeft<=0){
     a.status='Ready';a.injury=null;a.recovery=0;a.dailyOrder='Recover';w.gc202WasRecovering=false;w.gc202RecoveryTotal=0;w.gc202InjuryName=null;
     const text=`${a.name} completed injury recovery and remains on Recover until reassigned.`;pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');sfx('rest');gc202ScheduleRender();
   }
 }else w.gc202WasRecovering=false;
};

/* Patrol injuries can occur without a full-screen render. Refresh once when that
   meaningful status transition happens, not every simulation tick. */
const _gc193PatrolRegionGC202=gc193PatrolRegion;
gc193PatrolRegion=function(regionId,patrollers,report){
 const before=new Map((patrollers||[]).map(a=>[a.id,a.status]));const out=_gc193PatrolRegionGC202(regionId,patrollers,report);
 if((patrollers||[]).some(a=>before.get(a.id)!==a.status))gc202ScheduleRender();return out;
};

function gc202VitalState(a){
 const m=gc202RecoveryMetrics(a),hp=`${m.visualHp.toFixed(1)} / ${Math.round(m.max)} HP`;
 if(a.status==='Dead')return{hp,detail:'Fallen',hpPct:0,injuryPct:0};
 if(a.status==='Recovering')return{hp,detail:`${a.injury||'Injury'} • ${m.remaining.toFixed(2)}d • ~${gc202Seconds(m.injuryEta)} remaining`,hpPct:m.visualHp/m.max*100,injuryPct:m.injuryPct};
 if(a.status==='Ready'&&a.dailyOrder==='Recover')return{hp,detail:m.visualHp>=m.max-.01?'Fully healed • resting':`Focused recovery • +${m.hpPerSec.toFixed(2)} HP/s at 1× • ~${gc202Seconds(m.hpEta)} to full`,hpPct:m.visualHp/m.max*100,injuryPct:100};
 if(a.status==='Ready'&&m.visualHp<m.max-.01)return{hp,detail:`Natural healing • +${m.hpPerSec.toFixed(2)} HP/s at 1×`,hpPct:m.visualHp/m.max*100,injuryPct:100};
 return{hp,detail:gc193OrderLabel(a),hpPct:m.max?m.visualHp/m.max*100:0,injuryPct:100};
}
function gc202VitalsHTML(a,compact=false){
 const v=gc202VitalState(a),injured=a.status==='Recovering';
 return `<div class="gc202Vitals ${compact?'compact':''} ${injured?'injured':''}" data-gc202-vitals="${esc(a.id)}"><div class="gc202VitalsTop"><b data-gc202-hp>${esc(v.hp)}</b><span data-gc202-vital-detail>${esc(v.detail)}</span></div><div class="gc202HpTrack"><i data-gc202-hpbar style="width:${clamp(v.hpPct,0,100)}%"></i></div>${injured?`<div class="gc202InjuryLabel"><span>INJURY RECOVERY</span><b data-gc202-injury-label>${Math.round(v.injuryPct)}%</b></div><div class="gc202InjuryTrack"><i data-gc202-injury-bar style="width:${clamp(v.injuryPct,0,100)}%"></i></div>`:''}</div>`;
}
function gc202UpdateVitals(){
 document.querySelectorAll('[data-gc202-vitals]').forEach(el=>{
   const a=state.roster.find(x=>x.id===el.dataset.gc202Vitals);if(!a)return;const v=gc202VitalState(a),hp=el.querySelector('[data-gc202-hp]'),detail=el.querySelector('[data-gc202-vital-detail]'),bar=el.querySelector('[data-gc202-hpbar]'),ib=el.querySelector('[data-gc202-injury-bar]'),il=el.querySelector('[data-gc202-injury-label]');
   if(hp)hp.textContent=v.hp;if(detail)detail.textContent=v.detail;if(bar)bar.style.width=`${clamp(v.hpPct,0,100)}%`;if(ib)ib.style.width=`${clamp(v.injuryPct,0,100)}%`;if(il)il.textContent=`${Math.round(v.injuryPct)}%`;
 });
}

const _gc200WorkSnapshotGC202=gc200WorkSnapshot;
gc200WorkSnapshot=function(a){
 if(a&&(a.status==='Recovering'||(a.status==='Ready'&&a.dailyOrder==='Recover'))){const m=gc202RecoveryMetrics(a),v=gc202VitalState(a);return{label:a.status==='Recovering'?'RECOVERING':'RECOVER',detail:v.detail,pct:clamp(m.visualHp/m.max*100,0,100)}}
 return _gc200WorkSnapshotGC202(a);
};

function gc202StanceScene(stance){
 if(stance==='Scout')return '<div class="gc202StanceScene scout"><i class="gc202Scan"></i><i class="gc202ScoutMark one"></i><i class="gc202ScoutMark two"></i><b>⌖</b></div>';
 if(stance==='Patrol')return '<div class="gc202StanceScene patrol"><i class="gc202Road"></i><i class="gc202March one"></i><i class="gc202March two"></i><i class="gc202March three"></i><b>⚔</b></div>';
 if(stance==='Train')return '<div class="gc202StanceScene train"><i class="gc202Blade one"></i><i class="gc202Blade two"></i><i class="gc202Spark one"></i><i class="gc202Spark two"></i><b>✦</b></div>';
 return '<div class="gc202StanceScene recover"><i class="gc202PulseRing one"></i><i class="gc202PulseRing two"></i><i class="gc202HealMote one"></i><i class="gc202HealMote two"></i><b>✚</b></div>';
}
function gc202StanceSnapshot(regionId,stance){
 const team=gc201Team(regionId,stance),r=state.regions[regionId];
 if(stance==='Scout'){
   const c=team.length?gc200SharedScoutTarget(regionId):null,pct=c?clamp((Number(c.gc200ScoutProgress)||0)*100,0,100):0;
   return{team,pct,detail:c?`${team.length} together • ${c.title} • ${Math.round(pct)}% to breakthrough`:'No active intelligence target'};
 }
 if(stance==='Patrol'){
   const pct=clamp((Number(r.gc200PatrolProgress)||0)*100,0,100);return{team,pct,detail:team.length?`${team.length} together • ${Math.round(pct)}% patrol cycle • Threat ${Math.round(r.threat)}`:'No patrol active'};
 }
 if(stance==='Train'){
   const bonus=gc201TrainingBonus(team),pct=team.length?team.reduce((n,a)=>n+clamp((Number(a.xp)||0)/Math.max(1,xpNeed(a.lvl))*100,0,100),0)/team.length:0,avg=team.length?team.reduce((n,a)=>n+(a.lvl||1),0)/team.length:0;
   return{team,pct,detail:team.length?`${team.length} together • +${Math.round(bonus*100)}% group bonus • avg Lv.${avg.toFixed(1)}`:'Training yard empty'};
 }
 const wounded=team.filter(a=>a.status==='Recovering'||gc202RecoveryMetrics(a).visualHp<gc202RecoveryMetrics(a).max-.01),pct=team.length?team.reduce((n,a)=>{const m=gc202RecoveryMetrics(a);return n+m.visualHp/m.max*100},0)/team.length:0;
 return{team,pct,detail:team.length?`${team.length} recovering • ${wounded.length} need care • avg HP ${Math.round(pct)}%`:'No one recovering'};
}
gc201StanceDashboard=function(regionId=state.currentRegion){
 const cards=GC201_STANCES.map(st=>{const x=gc202StanceSnapshot(regionId,st);return`<button class="gc201Stance ${st.toLowerCase()} ${x.team.length?'active':''}" data-action="gcOrders" data-gc202-stance="${st}" data-gc202-region="${regionId}" data-active="${x.team.length?'1':'0'}"><div class="gc201StanceHead"><b>${GC202_STANCE_INFO[st].icon} ${st.toUpperCase()}</b><span data-gc202-stance-count>${x.team.length}</span></div>${gc202StanceScene(st)}<div class="gc201Faces">${x.team.slice(0,7).map(a=>`<span title="${esc(a.name)}">${blPortraitHTML(a)}</span>`).join('')||'<em>Empty</em>'}</div><div class="gc201StanceMeta" data-gc202-stance-meta>${esc(x.detail)}</div><i><em data-gc202-stance-bar style="width:${clamp(x.pct,0,100)}%"></em></i></button>`}).join('');
 return `<div class="gc201StanceGrid gc202StanceGrid">${cards}</div>`;
};
function gc202UpdateStances(){
 document.querySelectorAll('[data-gc202-stance]').forEach(el=>{const st=el.dataset.gc202Stance,rid=el.dataset.gc202Region||state.currentRegion,x=gc202StanceSnapshot(rid,st),count=el.querySelector('[data-gc202-stance-count]'),meta=el.querySelector('[data-gc202-stance-meta]'),bar=el.querySelector('[data-gc202-stance-bar]');if(count)count.textContent=x.team.length;if(meta)meta.textContent=x.detail;if(bar)bar.style.width=`${clamp(x.pct,0,100)}%`;el.dataset.active=x.team.length?'1':'0';el.classList.toggle('active',!!x.team.length)});
}

const _rosterCardGC202=rosterCard;
rosterCard=function(a){
 let html=_rosterCardGC202(a),stance=String(gc193OrderLabel(a)||'').toLowerCase().replace(/[^a-z]+/g,'-');
 html=html.replace('class="card member','class="card member gc202Member gc202-'+stance);
 html=html.replace('<div class="tags">',gc202VitalsHTML(a,true)+'<div class="tags">');
 return html;
};

function gc202InspectRecoveryHTML(a){
 const m=gc202RecoveryMetrics(a),focused=m.focused;
 return `<div class="card gc202InspectVitals"><div class="gc202InspectHead"><div><b>LIVE RECOVERY</b><span>${focused?'FOCUSED':'PASSIVE'} • ${Math.round(m.hpPct*100)}% max HP / simulation day</span></div><div class="gc202MiniCross">✚</div></div>${gc202VitalsHTML(a,false)}</div>`;
}
const _renderInspectGC202=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC202(id,recruit);if(recruit)return out;const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');if(!a||!sheet)return out;
 sheet.querySelectorAll('.gc202InspectVitals').forEach(x=>x.remove());const anchor=sheet.querySelector('.gc193OrderPanel,.buildStack');if(anchor)anchor.insertAdjacentHTML('afterend',gc202InspectRecoveryHTML(a));else sheet.insertAdjacentHTML('afterbegin',gc202InspectRecoveryHTML(a));return out;
};

gc193OrderPanel=function(a){
 if(a.status==='Expedition')return '<div class="gc193OrderPanel"><b>STANCE</b><span>ON CONTRACT</span></div>';
 if(a.status==='Captured')return '<div class="gc193OrderPanel"><b>STANCE</b><span>CAPTURED</span></div>';
 if(a.status==='Recovering')return `<div class="gc193OrderPanel gc202RecoverOrder"><div><b>STANCE</b><span>RECOVER • ${esc(a.injury||'Injury')}</span></div><span class="gc202Locked">FOCUSED CARE</span></div>`;
 return `<div class="gc193OrderPanel"><div><b>STANCE</b><span>${esc(gc193OrderLabel(a))}</span></div><button class="btn ghost" data-action="gcOrderPick" data-id="${a.id}">Change</button></div>`;
};

function gc202StanceButtons(a){
 return `<div class="gc202StanceButtons">${GC201_STANCES.map(st=>`<button class="gc202StanceBtn ${a.status==='Ready'&&a.dailyOrder===st?'active':''}" data-action="gc202SetStance" data-id="${a.id}" data-value="${st}" ${a.status!=='Ready'?'disabled':''}><b>${GC202_STANCE_INFO[st].icon}</b><span>${st}</span></button>`).join('')}</div>`;
}
gc193OrdersModal=function(){
 const rows=localRoster().filter(a=>a.status!=='Dead');
 modal(`<div class="sheetHead"><div><h3>${gc193SkullSvg('tiny')} HQ Stances</h3><div class="tiny muted">One tap to reassign. Shared work is actually shared.</div></div><button class="x" data-action="close">×</button></div>${gc201StanceDashboard()}<div class="gc202QuickActions"><button class="btn" data-action="gc202RecoverWounded">✚ Recover Everyone Wounded</button></div><div class="list gc193OrdersList gc202OrdersList">${rows.map(a=>`<div class="card gc202AssignRow"><div class="gc202AssignTop"><div class="gc193OrderFace">${blPortraitHTML(a)}</div><div class="gc202AssignIdentity"><b>${esc(a.name)}</b><span>${esc(a.culture)} ${esc(a.className)} • Lv.${a.lvl}</span></div><strong>${esc(gc193OrderLabel(a))}</strong></div>${gc202VitalsHTML(a,true)}${a.status==='Ready'?gc202StanceButtons(a):`<div class="gc202LockedRow">${a.status==='Recovering'?'Recovering automatically until the injury clears.':esc(a.status)}</div>`}</div>`).join('')}</div>`);
};
gc193OrderPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 modal(`<div class="sheetHead"><div><h3>Stance • ${esc(a.name)}</h3><div class="tiny muted">Choose what they do while they are at HQ.</div></div><button class="x" data-action="close">×</button></div>${gc202VitalsHTML(a,false)}<div class="gc202ChoiceGrid">${GC201_STANCES.map(st=>`<button class="card gc202Choice ${a.dailyOrder===st?'active':''}" data-action="gc202SetStance" data-id="${a.id}" data-value="${st}">${gc202StanceScene(st)}<b>${GC202_STANCE_INFO[st].icon} ${st}</b><span>${esc(GC202_STANCE_INFO[st].desc)}</span></button>`).join('')}</div>`);
};
const _processActionGC202=processAction;
processAction=function(el){
 const action=el.dataset.action;
 if(action==='gc202SetStance'){
   const a=state.roster.find(x=>x.id===el.dataset.id),st=el.dataset.value;if(!a||a.status!=='Ready'||!GC201_STANCES.includes(st))return;
   a.dailyOrder=st;a.dailyMentorId=null;a.dailyFacility=null;sfx('tap');save();render();return gc193OrdersModal();
 }
 if(action==='gc202RecoverWounded'){
   const wounded=localRoster().filter(a=>a.status==='Ready'&&gc193AtHQ(a)&&Number(a.hp)<derived(a).maxHp);if(!wounded.length)return toast('Everyone available is already at full HP.');
   wounded.forEach(a=>{a.dailyOrder='Recover';a.dailyMentorId=null;a.dailyFacility=null});save();render();gc193OrdersModal();return toast(`${wounded.length} wounded adventurer${wounded.length===1?'':'s'} moved to Recover.`);
 }
 return _processActionGC202(el);
};

/* Keep every live screen visibly synced. Closing any modal also refreshes the
   background so purchases/equipment/reports never leave stale numbers behind. */
function gc202UpdateLiveUI(){if(!state)return;gc202UpdateVitals();gc202UpdateStances()}
const _gc199UpdateClockGC202Quality=gc199UpdateClock;
gc199UpdateClock=function(){_gc199UpdateClockGC202Quality();if(state)gc202UpdateLiveUI()};
const _renderGC202Quality=render;
render=function(){const out=_renderGC202Quality();document.body.classList.add('gc202Quality');requestAnimationFrame(()=>{if(state)gc202UpdateLiveUI()});return out};
const _closeModalGC202=closeModal;
closeModal=function(){const out=_closeModalGC202();if(state)render();return out};

/* Infirmary copy now matches the stronger, continuous Recover stance. */
const _hqInfoGC202Quality=hqInfo;
hqInfo=function(k){
 if(k==='Infirmary'){
   const lv=hq().upgrades.Infirmary||0,hp=Math.round((GC202_RECOVER_HP_PER_DAY+lv*GC202_INFIRMARY_HP_PER_LEVEL)*100),speed=(GC202_INJURY_SPEED+lv*GC202_INFIRMARY_INJURY_SPEED).toFixed(2);
   return modal(`<div class="sheetHead"><h3>Infirmary</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">Focused recovery is continuous and visibly updates every simulation tick.</div><div class="gold small" style="margin-top:6px">Lv.${lv}: Recover restores ${hp}% max HP per simulation day and heals injuries at ${speed}× calendar speed.</div></div>`);
 }
 return _hqInfoGC202Quality(k);
};

/* Combat remains automatic, but every resolved round now has visible impact and
   a live round banner instead of only silently replacing log text. */
function gc202CombatImpact(pid,kind='hit'){
 requestAnimationFrame(()=>{const card=document.querySelector(`.gc201Expedition[data-gc199-party="${pid}"]`);if(!card)return;card.dataset.gc202Impact=kind;clearTimeout(card._gc202ImpactTimer);card._gc202ImpactTimer=setTimeout(()=>{delete card.dataset.gc202Impact},430)});
}
const _combatRoundGC202=combatRound;
combatRound=function(p){
 const b=p?.expedition?.battle,before=b?.log?.length||0;const out=_combatRoundGC202(p);if(b){const lines=(b.log||[]).slice(before).join(' '),kind=/critical/i.test(lines)?'crit':/(falls|goes down|died|dead)/i.test(lines)?'down':'hit';gc202CombatImpact(p.id,kind)}return out;
};
const _expeditionCardGC202=expeditionCard;
expeditionCard=function(p){
 let html=_expeditionCardGC202(p),b=p?.expedition?.battle;if(!b)return html;const allies=alive(b.allies).length,enemies=alive(b.enemies).length,banner=`<div class="gc202CombatBanner"><span>AUTO-COMBAT</span><b>ROUND ${b.round}</b><em>${allies} COMPANY • ${enemies} HOSTILE</em></div>`;return html.replace('<div class="battleGrid">',banner+'<div class="battleGrid">');
};
const _gc199PushPartyGC202=gc199PushParty;
gc199PushParty=function(pid){
 const p=state.parties.find(x=>x.id===pid),before=Number(p?.expedition?.gc201Momentum)||0,out=_gc199PushPartyGC202(pid),after=Number(p?.expedition?.gc201Momentum)||0;
 if(after>before)requestAnimationFrame(()=>{const travel=document.querySelector(`.gc201Expedition[data-gc199-party="${pid}"] .gc200Travel`);if(!travel)return;travel.classList.remove('gc202PushKick');void travel.offsetWidth;travel.classList.add('gc202PushKick');const pop=document.createElement('span');pop.className='gc202PushBurst';pop.textContent=`+PACE ${(1+after).toFixed(2)}×`;travel.appendChild(pop);setTimeout(()=>pop.remove(),650)});return out;
};

/* Contract resolution updates the background immediately and gets a lightweight
   result burst. The simulation keeps running underneath it. */
const _showReportGC202=showReport;
showReport=function(r){
 if(state)render();const out=_showReportGC202(r),sheet=document.getElementById('sheet');if(sheet&&!sheet.querySelector('.gc202ResultBurst')){const bits=Array.from({length:10},(_,i)=>`<i style="--i:${i}"></i>`).join('');const head=sheet.querySelector('.sheetHead');head?.insertAdjacentHTML('afterend',`<div class="gc202ResultBurst ${r?.win?'win':'loss'}"><b>${r?.win?'CONTRACT SECURED':'COMPANY BLOODIED'}</b>${bits}</div>`)}return out;
};

const _gc193DailyDashboardGC202=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC202().replace('<div class="actions">','<div class="gc202BuildBadge">v20.1.2 • QUALITY PASS</div><div class="actions">')};

const _auditGC202=audit;
audit=function(){
 const out=_auditGC202();out.v201Quality=GC201_QUALITY;out.recoveryTickVisuals=true;out.focusedRecoveryHpPerDay=GC202_RECOVER_HP_PER_DAY;out.recoveryInjurySpeed=GC202_INJURY_SPEED;out.liveVitals=true;out.oneTapStances=true;out.stanceMicroAnimations=true;out.combatImpactFeedback=true;out.systemicModalRefresh=true;return out;
};
window.__BL_AUDIT=audit;
