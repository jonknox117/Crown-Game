/* Grim Company v19.9 — active-play time, autonomous expeditions, push controls,
   event pausing, and stabilization/QoL. No offline catch-up: hidden/closed play is paused. */
const GC199_VERSION='19.9';
const GC199_DAY_MS=45000;
const GC199_FAST_MULT=4;
let GC199_AUTOTICK=false;
let GC199_CALENDAR_TICK=false;
let GC199_FIELD_TICK=false;
let GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());
let GC199_LAST_SAVE=GC199_LAST_REAL;

function gc199InitState(s=state,loaded=false){
 if(!s)return s;
 s.timeSystem=s.timeSystem||{};
 const t=s.timeSystem;
 t.gc199Version=GC199_VERSION;
 t.gc199DayProgress=clamp(Number(t.gc199DayProgress)||0,0,.9999);
 t.gc199Feed=Array.isArray(t.gc199Feed)?t.gc199Feed:[];
 t.gc199PauseReason=String(t.gc199PauseReason||'');
 /* A loaded/new game always opens paused. Real time while the app was closed is never applied. */
 if(loaded||!['paused','play','fast'].includes(t.gc199Mode))t.gc199Mode='paused';
 (s.parties||[]).forEach(p=>{
   if(!p.expedition)return;
   p.expedition.gc199FieldProgress=clamp(Number(p.expedition.gc199FieldProgress)||0,0,.9999);
   if(!Number.isFinite(Number(p.expedition.gc199LastPushDay)))p.expedition.gc199LastPushDay=-9999;
 });
 return s;
}

/* v19.5 accidentally dropped the second createState argument. Restore regional starts
   while keeping every v19.5 relationship migration. */
const _normalizeStateGC199=normalizeState;
normalizeState=function(s){s=_normalizeStateGC199(s);return gc199InitState(s,true)};
createState=function(name,startRegion='veyric'){
 const s=gc195InitRelationState(_createStateGC195(name,startRegion));
 return gc199InitState(s,true);
};

function gc199Mode(){return state?.timeSystem?.gc199Mode||'paused'}
function gc199Speed(){return gc199Mode()==='fast'?GC199_FAST_MULT:gc199Mode()==='play'?1:0}
function gc199ClockLabel(){
 const f=clamp(Number(state?.timeSystem?.gc199DayProgress)||0,0,.9999),mins=Math.floor(f*24*60),hh=String(Math.floor(mins/60)).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');
 return `DAY ${state?.company?.day||1} · ${hh}:${mm}`;
}
function gc199FormatSeconds(sec){
 sec=Math.max(0,Math.round(sec));if(sec<60)return`${sec}s`;
 const m=Math.floor(sec/60),s=sec%60;return s?`${m}m ${s}s`:`${m}m`;
}
function gc199RecordFeed(text,kind='event',day=state?.company?.day||1){
 if(!state||!text)return;
 const t=gc199InitState(state).timeSystem,last=t.gc199Feed[t.gc199Feed.length-1];
 if(last&&last.day===day&&last.text===text)return;
 t.gc199Feed.push({day,text:String(text),kind});
 if(t.gc199Feed.length>80)t.gc199Feed.splice(0,t.gc199Feed.length-80);
}
function gc199InterestingLine(x){return /ENCOUNTER|RETURNED|CONTRACT|patrol|scout|relationship|injur|died|dead|artifact|payroll|recovered|threat|settlement|captur|level/i.test(String(x||''))}

function gc199Pause(reason='',notify=false){
 if(!state)return;
 gc199InitState(state);state.timeSystem.gc199Mode='paused';state.timeSystem.gc199PauseReason=reason||state.timeSystem.gc199PauseReason||'Paused by player.';
 GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());
 if(!GC199_AUTOTICK&&!GC199_FIELD_TICK)save();
 gc199UpdateClock();
 if(notify&&reason)toast(reason);
}
function gc199SetMode(mode){
 if(!state)return;
 if(mode!=='paused'&&state.parties.some(p=>p.expedition?.battle))return gc199Pause('Resolve active encounters before restarting time.',true);
 gc199InitState(state);state.timeSystem.gc199Mode=mode;state.timeSystem.gc199PauseReason=mode==='paused'?'Paused by player.':'';
 GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());save();gc199UpdateClock();
 if(mode==='play')toast('Simulation running at normal speed.');
 if(mode==='fast')toast('Simulation running at 4× speed.');
}

/* Expeditions now own their own field clocks. Global day changes handle HQ/world
   systems only, so a party dispatched halfway through a day still receives a full
   amount of field time instead of jumping at midnight. */
const _gc193ProgressExpeditionGC199=gc193ProgressExpedition;
gc193ProgressExpedition=function(p,report=[]){
 if(GC199_CALENDAR_TICK){if(p?.expedition)report.push(`${p.name}: field operation continues autonomously.`);return}
 return _gc193ProgressExpeditionGC199(p,report);
};

const _dispatchContractGC199=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_dispatchContractGC199(cid,pid),p=state.parties.find(x=>x.id===pid);
 if(p?.expedition){p.expedition.gc199FieldProgress=0;p.expedition.gc199LastPushDay=-9999;p.expedition.events.push('The party will progress on its own while simulation time is running.');save();render()}
 return out;
};

const _gc194EncounterChanceGC199=gc194EncounterChance;
gc194EncounterChance=function(p){
 let v=_gc194EncounterChanceGC199(p);
 if(p?._gc199Pushing){const risk=Number(p.expedition?.contract?.risk)||1;v=clamp(v+.10+risk*.025,.06,.88)}
 return v;
};

function gc199PushAttrition(p){
 const e=p?.expedition;if(!e)return;
 const risk=Number(e.contract?.risk)||1,people=partyMembers(p).filter(a=>a.status!=='Dead');if(!people.length)return;
 const attrition=clamp(.10+risk*.045+(e.contract?.unknown||0)*.012,.10,.42);
 if(!chance(attrition)){e.events.push(`Forced pace held together; no serious attrition (${Math.round(attrition*100)}% risk).`);return}
 const a=pick(people),max=derived(a).maxHp,dmg=Math.max(2,Math.round(max*(.035+risk*.012+Math.random()*.045)));
 a.hp=Math.max(1,a.hp-dmg);a.history=a.history||[];
 a.history.push(`Day ${state.company.day}: lost ${dmg} HP forcing the pace on ${e.contract.title}.`);
 e.events.push(`${a.name} lost ${dmg} HP to forced-march attrition.`);
 if(a.hp/max<.28&&chance(.12+risk*.04)&&!a.injury){a.injury=injuryName();a.recovery=Math.max(Number(a.recovery)||0,1+rnd(0,2));e.events.push(`${a.name} aggravated ${a.injury} while pushing the expedition.`)}
}

function gc199ProgressParty(p,manualPush=false){
 if(!p?.expedition||p.expedition.battle)return false;
 const e=p.expedition,report=[],title=e.contract?.title||'contract';
 GC199_FIELD_TICK=true;p._gc199Pushing=!!manualPush;
 try{
   _gc193ProgressExpeditionGC199(p,report);
 }finally{
   p._gc199Pushing=false;GC199_FIELD_TICK=false;
 }
 report.filter(gc199InterestingLine).forEach(x=>gc199RecordFeed(x,manualPush?'push':'field'));
 if(p.expedition){p.expedition.expectedReturnDay=state.company.day+Math.max(0,p.expedition.durationDays-p.expedition.elapsedDays);save();render()}
 else{save();gc199RecordFeed(`${p.name} returned from ${title}.`,'return');gc199MountClock()}
 return true;
}

function gc199PushParty(pid){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition;
 if(!e)return toast('That party is not in the field.');
 if(e.battle)return toast('Resolve the encounter before ordering a push.');
 if(Number(e.gc199LastPushDay)===state.company.day)return toast('This party has already been pushed hard today.');
 e.gc199LastPushDay=state.company.day;e.events.push(`Day ${state.company.day}: headquarters ordered the party to force the pace.`);
 gc199PushAttrition(p);
 gc199RecordFeed(`${p.name} was ordered to push ${e.contract.title}.`,'push');
 gc199ProgressParty(p,true);
}

/* Any real encounter stops the clock so reading another screen never costs the player a battle. */
const _startBattleGC199=startBattle;
startBattle=function(p){
 const out=_startBattleGC199(p);
 if(p?.expedition?.battle){const text=`HOSTILE CONTACT — ${p.name}: ${p.expedition.contract?.title||'contract'}`;gc199RecordFeed(text,'danger');gc199Pause(text,false)}
 return out;
};

const _showReportGC199=showReport;
showReport=function(r){
 if(GC199_FIELD_TICK){
   const text=`${r?.win?'CONTRACT COMPLETE':'CONTRACT FAILED'} — ${r?.title||'Expedition returned'}`;
   gc199RecordFeed(text,r?.win?'return':'danger');
   if(r?.deaths?.length||r?.artifact)gc199Pause(r.deaths?.length?'Casualty report received.':'Artifact recovered.',false);
   else gc199Pause('A party has returned. Review the report when ready.',false);
 }
 return _showReportGC199(r);
};

/* Suppress the old every-day modal during real-time play; retain its information in
   a compact event log instead. Manual/legacy calls can still show the old report. */
const _gc193ShowDayReportGC199=gc193ShowDayReport;
gc193ShowDayReport=function(r){
 if(!GC199_AUTOTICK)return _gc193ShowDayReportGC199(r);
 if(!r)return;
 const recent=(state.relationshipSystem?.recent||[]).filter(x=>!x.reported&&x.day>=r.from&&x.day<=r.to);
 recent.forEach(x=>x.reported=true);
 const lines=[...(r.lines||[]),...recent.slice(-6).map(x=>`RELATIONSHIP — ${x.text}`)];
 state.timeSystem.lastReport={...r,lines};
 lines.filter(gc199InterestingLine).forEach(x=>gc199RecordFeed(x,/RELATIONSHIP/.test(x)?'relationship':'day',r.to));
};

function gc199AdvanceWorldDay(){
 if(!state)return false;
 const beforeDay=state.company.day,beforeHistory=state.history?.length||0;
 GC199_AUTOTICK=true;GC199_CALENDAR_TICK=true;
 try{gc193AdvanceDay()}finally{GC199_CALENDAR_TICK=false;GC199_AUTOTICK=false}
 if(state.company.day===beforeDay)return false;
 (state.history||[]).slice(beforeHistory).forEach(h=>gc199RecordFeed(h.text||h,'history',h.day||state.company.day));
 state.parties.forEach(p=>{if(p.expedition){p.expedition.expectedReturnDay=state.company.day+Math.max(0,p.expedition.durationDays-p.expedition.elapsedDays)}});
 if(state.parties.some(p=>p.expedition?.battle))gc199Pause('An expedition encountered hostile contact.',false);
 return true;
}

function gc199AdvanceFieldClocks(deltaDays){
 if(!state||deltaDays<=0)return;
 const parties=state.parties.filter(p=>p.expedition&&!p.expedition.battle).slice();
 for(const p of parties){
   const e=p.expedition;if(!e)continue;
   e.gc199FieldProgress=clamp((Number(e.gc199FieldProgress)||0)+deltaDays,0,1.999);
   if(e.gc199FieldProgress>=1){
     e.gc199FieldProgress-=1;
     gc199ProgressParty(p,false);
     if(gc199Mode()==='paused')break;
   }
 }
}

function gc199Loop(){
 const now=(typeof performance!=='undefined'?performance.now():Date.now()),dt=Math.max(0,Math.min(1000,now-GC199_LAST_REAL));GC199_LAST_REAL=now;
 if(!state)return;
 gc199InitState(state);
 if(document.hidden){if(gc199Mode()!=='paused')gc199Pause('Paused while the game was in the background.',false);return}
 if(gc199Mode()==='paused'){gc199UpdateClock();return}
 if(state.parties.some(p=>p.expedition?.battle)){gc199Pause('Resolve active encounters before restarting time.',false);return}
 const mult=gc199Speed(),deltaDays=(dt*mult)/GC199_DAY_MS;
 state.timeSystem.gc199DayProgress+=deltaDays;
 gc199AdvanceFieldClocks(deltaDays);
 if(gc199Mode()==='paused'){gc199UpdateClock();return}
 let guard=0;
 while(state.timeSystem.gc199DayProgress>=1&&guard++<3){
   state.timeSystem.gc199DayProgress-=1;
   if(!gc199AdvanceWorldDay()){state.timeSystem.gc199DayProgress=Math.min(.999,state.timeSystem.gc199DayProgress+1);gc199Pause('Time stopped because the company needs attention.',false);break}
   if(gc199Mode()==='paused')break;
 }
 if(now-GC199_LAST_SAVE>10000){GC199_LAST_SAVE=now;save()}
 gc199UpdateClock();
}

function gc199Eta(p){
 const e=p?.expedition;if(!e)return'';
 const remaining=Math.max(0,e.durationDays-e.elapsedDays-(Number(e.gc199FieldProgress)||0));
 const mult=Math.max(1,gc199Speed()||1),sec=remaining*(GC199_DAY_MS/1000)/mult;
 return gc199Mode()==='paused'?`~${gc199FormatSeconds(remaining*GC199_DAY_MS/1000)} at x1 • paused`:`~${gc199FormatSeconds(sec)} at current speed`;
}
function gc199ClockHTML(){
 const mode=gc199Mode(),reason=state.timeSystem.gc199PauseReason||'';
 return `<div class="gc199ClockBar" id="gc199ClockBar"><div class="gc199ClockMain"><div><b data-gc199-clock>${gc199ClockLabel()}</b><span data-gc199-state>${mode==='paused'?(reason||'PAUSED'):mode==='fast'?'RUNNING 4×':'RUNNING'}</span></div><div class="gc199ClockBtns"><button class="gc199ModeBtn ${mode==='paused'?'active':''}" data-action="gc199Pause" aria-label="Pause">Ⅱ</button><button class="gc199ModeBtn ${mode==='play'?'active':''}" data-action="gc199Play" aria-label="Play">▶</button><button class="gc199ModeBtn ${mode==='fast'?'active':''}" data-action="gc199Fast" aria-label="Fast">▶▶</button></div></div><div class="gc199ClockTrack"><i data-gc199-daybar style="width:${Math.round(state.timeSystem.gc199DayProgress*100)}%"></i></div></div>`;
}
function gc199MountClock(){
 if(!state)return;
 let bar=document.getElementById('gc199ClockBar');
 if(!bar){
   const top=document.querySelector('.topbar'),host=document.getElementById('app');if(!host)return;
   if(top)top.insertAdjacentHTML('afterend',gc199ClockHTML());else host.insertAdjacentHTML('afterbegin',gc199ClockHTML());
 }
 gc199UpdateClock();
}
function gc199UpdateClock(){
 if(!state)return;
 const bar=document.getElementById('gc199ClockBar');if(bar){
   const mode=gc199Mode(),reason=state.timeSystem.gc199PauseReason||'';
   const c=bar.querySelector('[data-gc199-clock]'),s=bar.querySelector('[data-gc199-state]'),p=bar.querySelector('[data-gc199-daybar]');
   if(c)c.textContent=gc199ClockLabel();if(s)s.textContent=mode==='paused'?(reason||'PAUSED'):mode==='fast'?'RUNNING 4×':'RUNNING';if(p)p.style.width=`${state.timeSystem.gc199DayProgress*100}%`;
   bar.querySelectorAll('.gc199ModeBtn').forEach(x=>x.classList.remove('active'));const which=mode==='paused'?'gc199Pause':mode==='play'?'gc199Play':'gc199Fast';bar.querySelector(`[data-action="${which}"]`)?.classList.add('active');
 }
 document.querySelectorAll('.gc199Expedition[data-gc199-party]').forEach(card=>{
   const pty=state.parties.find(p=>p.id===card.dataset.gc199Party),e=pty?.expedition;if(!e)return;
   const pct=clamp(((e.elapsedDays+(Number(e.gc199FieldProgress)||0))/Math.max(1,e.durationDays))*100,0,100);
   const line=card.querySelector('[data-gc199-progress]'),eta=card.querySelector('[data-gc199-eta]');if(line)line.style.width=`${pct}%`;if(eta)eta.textContent=gc199Eta(pty);
 });
}

/* HQ and expedition QoL: the clock is the heartbeat; daily orders remain strategic,
   and a watched party can be pushed once per company day for extra danger. */
gc193DailyDashboard=function(){
 const active=state.parties.filter(p=>p.expedition).length,battles=state.parties.filter(p=>p.expedition?.battle).length;
 return `<div class="gc193DayPanel gc199DayPanel"><div class="gc193DayHead"><div><span>ACTIVE-PLAY SIMULATION</span><b>${gc199ClockLabel()}</b></div>${gc193SkullSvg('small')}</div><div class="gc193OrderSummary">${gc193OrderSummary()}</div><div class="gc193DayMeta">${active} active expedition${active===1?'':'s'}${battles?` • <strong>${battles} encounter${battles===1?'':'s'} awaiting you</strong>`:' • expeditions progress on their own'}</div><div class="actions"><button class="btn" data-action="gcOrders">Daily Orders</button><button class="btn" data-action="gc199Feed">Event Log</button><button class="btn ghost" data-action="gc199TimeHelp">Time?</button></div></div>`;
};
const _renderHQGC199=renderHQ;
renderHQ=function(){
 let html=_renderHQGC199();
 html=html.replace(/<button class="card gc193AdvanceCard"[\s\S]*?<\/button>/,`<div class="card gc199AutoCard"><b>◷ Company Time</b><div class="tiny muted">Time advances while Play or Fast is active. Closing or backgrounding the game pauses it.</div></div>`);
 return html;
};

const _gc193OrdersModalGC199=gc193OrdersModal;
gc193OrdersModal=function(){
 const out=_gc193OrdersModalGC199(),sheet=document.getElementById('sheet');
 if(sheet){const n=[...sheet.querySelectorAll('.notice')].find(x=>/Orders resolve together when the global day advances/i.test(x.textContent));if(n)n.textContent='Orders resolve automatically as active-play time passes. Expedition members ignore HQ orders until they return.'}
 return out;
};

const _expeditionCardGC199=expeditionCard;
expeditionCard=function(p){
 let html=_expeditionCardGC199(p),e=p?.expedition;if(!e)return html;
 e.gc199FieldProgress=clamp(Number(e.gc199FieldProgress)||0,0,.9999);
 const pct=clamp(((e.elapsedDays+e.gc199FieldProgress)/Math.max(1,e.durationDays))*100,0,100),used=Number(e.gc199LastPushDay)===state.company.day;
 html=html.replace('class="card gc193Expedition"',`class="card gc193Expedition gc199Expedition" data-gc199-party="${p.id}"`);
 html=html.replace(/<div class="gc193Timeline"><i style="width:[^"]*"><\/i><\/div>/,`<div class="gc193Timeline"><i data-gc199-progress style="width:${pct}%"></i></div>`);
 html=html.replace(/<div class="tiny muted">Day \d+\/\d+ • ([\s\S]*?)<\/div>/,`<div class="tiny muted">Field progress ${Math.round(pct)}% • $1</div><div class="gc199Eta" data-gc199-eta>${esc(gc199Eta(p))}</div>`);
 if(!e.battle){
   const riskBoost=10+(Number(e.contract?.risk)||1)*2.5;
   const button=`<button class="btn goldbtn" data-action="gc199Push" data-id="${p.id}" ${used?'disabled':''}>${used?'Pushed Today':'Push Party'}</button>`;
   html=html.replace(/<button class="btn" data-action="advance" data-id="[^"]+">Progresses Next Day<\/button>/,button);
   html=html.replace('<div class="actions">',`<div class="gc199PushInfo">Push once per company day: immediately resolves an extra field day with attrition and roughly +${Math.round(riskBoost)} points hostile-contact risk.</div><div class="actions">`);
 }
 return html;
};

function gc199ShowFeed(){
 const rows=(state.timeSystem?.gc199Feed||[]).slice(-35).reverse();
 modal(`<div class="sheetHead"><div><h3>Company Event Log</h3><div class="tiny muted">Important events from active-play time</div></div><button class="x" data-action="close">×</button></div><div class="list gc199Feed">${rows.length?rows.map(x=>`<div class="card ${x.kind==='danger'?'danger':''}"><b>Day ${x.day}</b><div class="small">${esc(x.text)}</div></div>`).join(''):'<div class="empty">Nothing important has happened yet.</div>'}</div>`);
}
function gc199TimeHelp(){
 modal(`<div class="sheetHead"><h3>How Time Works</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>No offline progress.</b> Closing or backgrounding the game pauses the company.</div><div class="list"><div class="card"><b>▶ Play</b><div class="small muted">One company day is about ${GC199_DAY_MS/1000} seconds of active play. HQ orders, healing, payroll, relationships, markets and the world advance automatically.</div></div><div class="card"><b>▶▶ Fast</b><div class="small muted">Runs company and expedition time at ${GC199_FAST_MULT}× speed.</div></div><div class="card"><b>Push Party</b><div class="small muted">Once per company day, force a selected expedition through one extra field day immediately. It also raises encounter risk and can cause attrition.</div></div><div class="card"><b>Important events pause time</b><div class="small muted">Hostile encounters and returning parties stop the simulation so you can respond without being punished for reading another screen.</div></div></div>`);
}

const _processActionGC199=processAction;
processAction=function(el){
 const a=el.dataset.action;
 if(a==='gc199Pause')return gc199SetMode('paused');
 if(a==='gc199Play')return gc199SetMode('play');
 if(a==='gc199Fast')return gc199SetMode('fast');
 if(a==='gc199Push')return gc199PushParty(el.dataset.id);
 if(a==='gc199Feed')return gc199ShowFeed();
 if(a==='gc199TimeHelp')return gc199TimeHelp();
 if(a==='gcAdvanceDay')return toast('Company time now advances automatically. Use Play or Fast.');
 if(a==='rest')return toast('Use Daily Orders for Rest; time advances automatically.');
 return _processActionGC199(el);
};

const _renderGC199=render;
render=function(){const out=_renderGC199();if(state)requestAnimationFrame(gc199MountClock);return out};

document.addEventListener('visibilitychange',()=>{
 GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());
 if(document.hidden&&state&&gc199Mode()!=='paused'){gc199Pause('Paused while the game was in the background.',false);save()}
});
window.addEventListener('pagehide',()=>{if(state){gc199Pause('Paused when the game closed or left the foreground.',false);save()}});

const _auditGC199=audit;
audit=function(){
 const out=_auditGC199();out.grimCompanyTimeQol=GC199_VERSION;out.activePlayTime=true;out.noOfflineProgress=true;out.autonomousExpeditions=true;out.pushParty=true;out.importantEventAutoPause=true;out.timeSpeeds=['paused','play','fast'];return out;
};
window.__BL_AUDIT=audit;

setInterval(gc199Loop,250);
