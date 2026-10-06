/* Grim Company v20.7 — From Nothing, opening flow and freeblade UI. */
const GC270_FREEBLADE_TABS=[['you','✦','YOU'],['jobs','⚔','JOBS'],['gear','🎒','GEAR'],['region','🗺️','REGION']];

renderStart=function(){
 document.title='Grim Company — From Nothing';document.body.dataset.brand='grim-company';
 const choices=GC194_MORTAL_REGIONS.map((id,i)=>{const d=REGION_DEFS[id],native=GC194_REGION_NATIVE[id];return`<label class="gc194StartRegion"><input type="radio" name="startRegion" value="${id}" ${i===0?'checked':''}><span><b>${esc(d.name)}</b><small>${esc(d.culture)} homeland • 50% ${native} population</small><em>${esc(d.desc)}</em></span></label>`}).join('');
 document.getElementById('app').className='';
 document.getElementById('app').innerHTML=`<div class="start gc193Start"><div class="startPanel gc193StartPanel gc260StartPanel"><div class="gc193LogoHero">${gc193SkullSvg('hero')}</div><h1>GRIM COMPANY</h1><p>You do not begin with a company. You begin with your name, cheap equipment and whatever work one adventurer can survive.</p><div class="label gc194ChooseLabel">Choose where your story begins</div><div class="gc194StartRegions">${choices}</div><div class="sectionTitle"><h3>Create Yourself</h3><span>Level 1 • unaffiliated</span></div>${gc260CreatorHTML()}<button class="btn primary wide gc260FoundButton" data-action="begin">BEGIN AS A FREEBLADE</button><p class="tiny muted">Take jobs alone, build a reputation and earn enough silver to found a real company. The management game is something you grow into.</p></div></div>`;
 document.getElementById('nav').innerHTML='';requestAnimationFrame(()=>gc260RefreshCreator(true));
};
startCompany=function(){
 const opts=gc260ReadCreator();if(opts.name.length<2)return toast('Give your adventurer a name.');
 const chosen=document.querySelector('input[name="startRegion"]:checked')?.value||'veyric';gc270CreateFreebladeState(chosen,opts);safeLocalRemove(LEGACY_KEY);save();unlockAudio();render();toast(`${opts.name} takes their first work in ${REGION_DEFS[chosen].name}.`);
};

function gc270FoundingStatusHTML(){
 const fb=gc270Progression().freeblade,wins=Math.min(fb.successes,GC270_REQUIRED_WINS),silver=Math.min(state.company.silver,GC270_FOUNDING_COST),ready=gc270FoundingReady(),pct=Math.min(100,((wins/GC270_REQUIRED_WINS)+(silver/GC270_FOUNDING_COST))*50);
 return`<div class="gc270Founding ${ready?'ready':''}"><div class="statline"><div><span>FIRST MAJOR MILESTONE</span><b>${ready?'You can found a company.':'Build a name worth following.'}</b></div><strong>${wins}/${GC270_REQUIRED_WINS}</strong></div><div class="tiny muted">Successful jobs ${fb.successes}/${GC270_REQUIRED_WINS} • Silver ${Math.round(state.company.silver)}/${GC270_FOUNDING_COST}</div><div class="bar goldbar"><i style="width:${pct}%"></i></div>${ready?'<button class="btn primary wide" data-action="gc270FoundAsk">FOUND GRIM COMPANY</button>':'<div class="tiny muted">Survive a few jobs and save enough to lease a chapterhouse. You can keep working alone after the opportunity unlocks.</div>'}</div>`;
}
function gc270AskFound(){
 if(!gc270FoundingReady())return toast('You have not earned the opportunity yet.');
 modal(`<div class="sheetHead"><h3>Found a Company</h3><button class="x" data-action="close">×</button></div><div class="hero"><div class="kicker">FROM FREEBLADE TO FOUNDER</div><h2>People know your name now.</h2><p>You can spend ${money(GC270_FOUNDING_COST)} to lease the local chapterhouse, recruit adventurers and begin taking contracts under your own banner.</p></div><div class="label">Company name</div><input id="gc270CompanyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><button class="btn primary wide" data-action="gc270FoundConfirm">FOUND COMPANY • ${money(GC270_FOUNDING_COST)}</button><div class="tiny muted" style="margin-top:8px">Your character, level, gear, injuries and job history remain exactly the same.</div>`);
}
function gc270Topbar(){
 const f=gc260Founder(),r=region(),fb=gc270Progression().freeblade;
 return`<div class="topbar"><div class="toprow"><div class="brand"><h1>${esc(f?.name||'Freeblade')}</h1><small>UNAFFILIATED • ${esc(REGION_DEFS[state.currentRegion].name)} • Day ${state.company.day}</small></div><button class="iconbtn" data-action="audio">${state.settings.sfx?'🔊':'🔇'}</button><button class="iconbtn" data-action="menu">☰</button></div><div class="resources"><div class="res">Silver<b>${Math.round(state.company.silver)}</b></div><div class="res">Jobs Won<b>${fb.successes}</b></div><div class="res">Level<b>${f?.lvl||1}</b></div><div class="res">Threat<b>${Math.round(r.threat)}%</b></div></div></div>`;
}
function gc270NavHTML(){return GC270_FREEBLADE_TABS.map(([id,ic,l])=>`<button class="navbtn ${state.ui.tab===id?'active':''}" data-action="nav" data-tab="${id}"><b>${ic}</b>${l}</button>`).join('')}
function gc270FreebladeYou(){
 const f=gc260Founder();if(!f)return'';const d=derived(f),p=gc260FounderParty(),pending=p?.expedition?.gc260PendingDecision;
 if(f.status==='Dead')return`<div class="hero gc260DeadHero"><div class="kicker">YOUR STORY ENDS HERE</div><div class="gc260FounderHero">${blPortraitHTML(f,'blPortraitLarge')}<div><h2>${esc(f.name)}</h2><p>Lv.${f.lvl} ${esc(f.race)} • ${esc(f.culture)} ${esc(f.className)}</p></div></div><p>You fell before there was a company to outlive you.</p></div><div class="card history">${(f.history||[]).slice(-18).reverse().map(x=>`<div>${esc(x)}</div>`).join('')}</div><button class="btn dangerBtn wide" data-action="newGame">Start Again</button>`;
 return`${pending?gc260PendingDecisionHTML(p,pending):''}<div class="hero"><div class="kicker">YOU • FREEBLADE</div><div class="gc260FounderHero">${blPortraitHTML(f,'blPortraitLarge')}<div><h2>${esc(f.name)}</h2><p>Lv.${f.lvl} ${esc(f.race)} • ${esc(f.culture)} ${esc(f.className)}</p><div class="gc260Location">${esc(gc260LocationText(f))}</div></div></div><p>No roster. No headquarters. No one else to blame if the job goes bad.</p></div>${gc260ActivityHTML(f)}<div class="grid3 gc260PersonalStats"><div class="card"><span>HP</span><b>${Math.round(f.hp)}/${d.maxHp}</b></div><div class="card"><span>XP</span><b>${f.lvl>=GC194_MAX_LEVEL?'MAX':`${f.xp}/${xpNeed(f.lvl)}`}</b></div><div class="card"><span>JOBS</span><b>${gc270Progression().freeblade.completed}</b></div></div><div class="actions"><button class="btn" data-action="inspect" data-id="${f.id}">Character</button><button class="btn" data-action="gear" data-id="${f.id}" ${f.status==='Expedition'?'disabled':''}>Equipment</button></div>${gc270FoundingStatusHTML()}<div class="sectionTitle"><h3>Your History</h3><span>${f.kills} kills</span></div><div class="card history">${(f.history||[]).slice(-12).reverse().map(x=>`<div>${esc(x)}</div>`).join('')||'<div>Your story has just begun.</div>'}</div>`;
}
function gc270JobCard(c){
 const f=gc260Founder(),p=gc260FounderParty(),busy=!!p?.expedition||f?.status!=='Ready';
 return`<div class="card contract gc270SoloJob"><div class="statline"><h4>${esc(c.title)}</h4><span class="riskDots">●○○○○</span></div><div class="small muted">${esc(c.type)} • solo work • ${esc(c.check)} check</div><p class="small">${esc(c.desc)}</p><div class="grid3"><div class="tiny"><span class="muted">Pay</span><br><b class="gold">${money(c.reward)}</b></div><div class="tiny"><span class="muted">Contact</span><br>1 hostile expected</div><div class="tiny"><span class="muted">Time</span><br>${c.gcDuration} day${c.gcDuration===1?'':'s'}</div></div><div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn primary" data-action="gc270TakeJob" data-id="${c.id}" ${busy?'disabled':''}>Take Job Alone</button></div></div>`;
}
function gc270Jobs(){
 const p=gc260FounderParty(),active=p?.expedition;
 return`<div class="hero"><div class="kicker">LOCAL WORK • NO COMPANY</div><h2>Jobs that will hire one adventurer</h2><p>These are smaller than company contracts, but checks, hostile contacts, injuries and rewards use the same expedition simulation.</p></div>${active?`<div class="sectionTitle"><h3>Your Current Job</h3><span>Direct Command</span></div>${expeditionCard(p)}`:`${gc270FoundingStatusHTML()}<div class="sectionTitle"><h3>Available Jobs</h3><span>${GC270_JOB_COUNT} rotating offers</span></div><div class="list">${gc270EnsureJobs().map(gc270JobCard).join('')}</div>`}`;
}
function gc270Gear(){
 const f=gc260Founder(),inv=localInventory();
 return`<div class="hero"><div class="kicker">YOUR KIT</div><h2>What you carry into the next job</h2><p>Your equipment remains yours when the company is eventually founded.</p></div><div class="actions"><button class="btn primary" data-action="gear" data-id="${f.id}">Manage Equipment</button><button class="btn" data-action="market">Visit Local Market</button></div><div class="sectionTitle"><h3>Stored Gear</h3><span>${inv.reduce((s,x)=>s+x.qty,0)} items</span></div><div class="list">${inv.length?inv.map(e=>`<div class="card"><div class="marketRow"><div><b class="rarity-${(e.item.rarity||0)+1}">${esc(e.item.name)}</b><div class="tiny muted">${esc(e.item.slot||'item')} • ×${e.qty}</div></div><button class="btn ghost" data-action="itemInfo" data-id="${e.item.id}">ⓘ</button></div></div>`).join(''):'<div class="empty">Everything useful is currently on your back.</div>'}</div>`;
}
function gc270Region(){
 const r=region(),d=regionDef();
 return`<div class="hero"><div class="kicker">${esc(d.culture.toUpperCase())} HOMELAND</div><h2>${esc(d.name)}</h2><p>${esc(d.desc)}</p></div><div class="regionStats"><div class="regionStat"><span>PROSPERITY</span><b>${Math.round(r.prosperity)}</b><div class="meter"><i style="width:${r.prosperity}%"></i></div></div><div class="regionStat"><span>STABILITY</span><b>${Math.round(r.stability)}</b><div class="meter"><i style="width:${r.stability}%"></i></div></div><div class="regionStat"><span>THREAT</span><b>${Math.round(r.threat)}</b><div class="meter"><i style="width:${r.threat}%"></i></div></div></div><div class="card" style="margin-top:8px"><b>You have no headquarters here.</b><div class="small muted">For now this is simply the region where you live and work. Founding a company will turn it into your first operating territory.</div><button class="btn ghost wide" data-action="regionInfo" data-id="${state.currentRegion}">Regional Details</button></div>${gc270FoundingStatusHTML()}`;
}
function gc270RenderFreeblade(){
 if(!GC270_FREEBLADE_TABS.some(x=>x[0]===state.ui.tab))state.ui.tab='you';
 const app=document.getElementById('app'),body=state.ui.tab==='you'?gc270FreebladeYou():state.ui.tab==='jobs'?gc270Jobs():state.ui.tab==='gear'?gc270Gear():gc270Region();
 app.className='app';app.innerHTML=gc270Topbar()+`<div class="screen">${body}</div>`;document.getElementById('nav').innerHTML=gc270NavHTML();save();if(typeof gc199MountClock==='function')gc199MountClock();return true;
}
const _renderGC270=render;
render=function(){if(state&&gc270IsFreeblade())return gc270RenderFreeblade();return _renderGC270()};

const _processActionGC270=processAction;
processAction=function(el){
 const a=el.dataset.action;
 if(gc270IsFreeblade()&&a==='nav'){let t=el.dataset.tab;if(t==='contracts')t='jobs';if(!GC270_FREEBLADE_TABS.some(x=>x[0]===t))t='you';state.ui.tab=t;save();return render()}
 if(a==='gc270TakeJob'){const p=gc260FounderParty();if(!p)return toast('Your solo expedition record is missing.');return dispatchContract(el.dataset.id,p.id)}
 if(a==='gc270FoundAsk')return gc270AskFound();
 if(a==='gc270FoundConfirm')return gc270FoundCompany(document.getElementById('gc270CompanyName')?.value);
 return _processActionGC270(el);
};

const _gc193DailyDashboardGC270=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC270().replace('v20.5 • FIELD ENCOUNTERS','v20.7 • FROM NOTHING')};

function gc270InstallStyles(){if(document.getElementById('gc270Styles'))return;const st=document.createElement('style');st.id='gc270Styles';st.textContent=`
 .gc270Founding{margin:12px 0;padding:11px;border:1px solid rgba(190,145,73,.28);border-left:3px solid rgba(190,145,73,.62);border-radius:9px;background:linear-gradient(135deg,rgba(45,31,18,.85),rgba(18,14,10,.92))}.gc270Founding.ready{border-color:rgba(213,168,87,.65)}.gc270Founding span{display:block;font-size:8px;letter-spacing:.12em;color:#b59461}.gc270Founding b{display:block;margin-top:2px;font:700 15px Georgia,serif}.gc270Founding strong{font-size:20px;color:#d9b572}.gc270Founding .bar{margin:7px 0}.gc270Founding .btn{margin-top:8px}.gc270SoloJob{border-left-color:#85613a}.gc270SoloJob .grid3{margin-top:8px}.gc270SoloJob p{min-height:0}
 `;document.head.appendChild(st)}
gc270InstallStyles();

const _auditGC270=audit;
audit=function(){const out=_auditGC270();out.v270FromNothing=GC270_VERSION;out.freebladeOpening=true;out.soloJobsUseRealExpeditions=true;out.companyFoundingIsMilestone=true;out.founderProgressPersistsIntoCompany=true;out.managementHiddenBeforeFounding=true;return out};
window.__BL_AUDIT=audit;
window.__GC270_TEST=function(){
 const old=state;try{
   gc270CreateFreebladeState('veyric',{name:'Road Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:2});
   const f=gc260Founder(),p=gc260FounderParty(),jobs=gc270EnsureJobs(),freeOk=gc270IsFreeblade()&&f&&state.roster.length===1&&p?.members.length===1&&!state.regions.veyric.hq.established&&jobs.length===3&&jobs.every(x=>x.risk===1&&x.gc270Freeblade);
   const sameId=f.id;f.lvl=3;state.company.silver=90;gc270Progression().freeblade.successes=3;const founded=gc270FoundCompany('Road Company'),persist=gc270IsCompany()&&state.company.founderId===sameId&&gc260Founder()?.lvl===3&&state.regions.veyric.hq.established&&state.company.name==='Road Company';
   const saved=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=saved.progression?.phase==='company'&&saved.company.founderId===sameId;
   return{ok:!!(freeOk&&founded&&persist&&saveSafe),freeOk,jobs:jobs.length,founded,persist,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
