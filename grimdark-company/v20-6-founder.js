/* Grim Company v20.6 — The Founder
   The player now exists inside the same simulation as every other adventurer.
   Founder presence turns one chosen expedition into Direct Command without
   interrupting the rest of the company. */
const GC260_VERSION='20.6';
const GC260_TRAVEL_DAYS=.75;
const GC260_FIRMAMENT_TRAVEL_DAYS=1.5;
const GC260_TRAIN_DAYS=.50;
const GC260_PORTRAIT_VARIANTS=12;

/* --------------------------------------------------------------------------
   FOUNDER STATE — the founder is a normal roster record, referenced by ID.
   -------------------------------------------------------------------------- */
function gc260System(s=state){
 if(!s)return null;s.company=s.company||{};s.founderSystem=s.founderSystem||{};const f=s.founderSystem;
 f.version=GC260_VERSION;f.activity=f.activity||null;f.location=f.location||s.currentRegion||'veyric';f.decisionHistory=Array.isArray(f.decisionHistory)?f.decisionHistory:[];f.prompted=!!f.prompted;f.deathRecorded=!!f.deathRecorded;return f;
}
function gc260Founder(s=state){const id=s?.company?.founderId;return id?(s.roster||[]).find(a=>a.id===id)||null:null}
function gc260FounderParty(s=state){const id=s?.company?.founderId;if(!id)return null;return(s.parties||[]).find(p=>p.members?.includes(id))||null}
function gc260FounderInParty(p,s=state){const id=s?.company?.founderId;return!!(id&&p?.members?.includes(id)&&gc260Founder(s)?.status!=='Dead')}
function gc260InitState(s=state){
 if(!s)return s;const fs=gc260System(s),f=gc260Founder(s);
 if(f){f.gc260Founder=true;fs.location=f.regionId||fs.location;fs.needsSetup=false}else fs.needsSetup=true;
 (s.parties||[]).forEach(p=>{const e=p.expedition;if(!e)return;e.gc260FieldDecisionDone=!!e.gc260FieldDecisionDone;e.gc260BattleDecisionDone=!!e.gc260BattleDecisionDone;e.gc260PendingDecision=e.gc260PendingDecision||null;e.gc260LastDecision=e.gc260LastDecision||null});
 return s;
}
const _normalizeStateGC260=normalizeState;
normalizeState=function(s){return gc260InitState(_normalizeStateGC260(s))};
const _createStateGC260=createState;
createState=function(name,startRegion='veyric'){return gc260InitState(_createStateGC260(name,startRegion))};

/* Founder status must be physically meaningful. Personal activity and travel are
   not HQ stance work. */
const _gc193AtHQGC260=gc193AtHQ;
gc193AtHQ=function(a){if(a?.status==='Traveling'||a?.status==='Personal Activity')return false;return _gc193AtHQGC260(a)};
const _dismissAdventurerGC260=dismissAdventurer;
dismissAdventurer=function(id){if(id&&id===state?.company?.founderId)return toast('You cannot dismiss yourself from your own company.');return _dismissAdventurerGC260(id)};

/* Keep a selected modular SVG stable even though the portrait system normally
   hashes each adventurer's random ID. */
const _blPortraitHTMLGC260=blPortraitHTML;
blPortraitHTML=function(a,cls=''){
 if(a?.gc260PortraitKey&&typeof bl15PortraitSvg==='function'){
   const proxy=Object.assign({},a,{id:String(a.gc260PortraitKey)}),gender=bl15EnsureGender(proxy);
   return`<span class="blSvgPortrait ${cls}" data-race="${bl15EscAttr(proxy.race)}" data-gender="${bl15EscAttr(gender)}" data-culture="${bl15EscAttr(proxy.culture)}">${bl15PortraitSvg(proxy)}</span>`;
 }
 return _blPortraitHTMLGC260(a,cls);
};

function gc260FounderTraits(regionId){
 const r=state.regions[regionId],pool=Object.keys(TRAITS),traits=[pick(pool)];if(chance(.55))traits.push(pick(pool.filter(t=>!traits.includes(t))));
 const negChance=clamp((55-(Number(r.stability)||50))/100,0,.35);if(chance(negChance)&&!traits.some(t=>['Bad Knee','Sickly','Cowardly','Haunted'].includes(t)))traits.push(pick(['Bad Knee','Sickly','Cowardly','Haunted']));return traits;
}
function gc260BuildFounder(regionId,opts={}){
 const culture=CULTURES[opts.culture]?opts.culture:REGION_DEFS[regionId].culture,race=RACES[opts.race]?opts.race:(GC194_REGION_NATIVE[regionId]||'Human'),classes=CLASSES[culture]||CLASSES.Veyric,cls=classes.find(x=>x.name===opts.className)||classes[0],bg=pick(BACKGROUNDS),name=String(opts.name||'Founder').trim()||'Founder';
 const a={id:uid('f'),name,race,culture,className:cls.name,background:bg.name,traits:gc260FounderTraits(regionId),lvl:1,xp:0,stats:{power:rnd(9,15),defense:rnd(9,15),speed:rnd(9,15),awareness:rnd(9,15),resolve:rnd(9,15)},hp:100,maxHp:100,wage:0,status:'Ready',injury:null,recovery:0,gear:{weapon:null,armor:null,charm:null},kills:0,missions:0,scars:[],regionId,history:[`Day ${state.company.day}: founded ${state.company.name}.`],gender:opts.gender==='Female'?'Female':'Male',gc260PortraitKey:`founder-portrait-${clamp(Number(opts.portrait)||0,0,GC260_PORTRAIT_VARIANTS-1)}`,gc260Founder:true,dailyOrder:'Train'};
 gc201MigrateAdventurer(a);a.dailyOrder='Train';return a;
}
function gc260RegisterFounder(a,{assignFirstParty=false}={}){
 if(!a||!state)return null;(state.roster||[]).forEach(x=>x.gc260Founder=false);a.gc260Founder=true;if(!state.roster.some(x=>x.id===a.id))state.roster.unshift(a);state.company.founderId=a.id;const fs=gc260System();fs.location=a.regionId;fs.needsSetup=false;fs.prompted=true;fs.activity=null;fs.deathRecorded=a.status==='Dead';
 if(assignFirstParty){const p=state.parties.find(x=>x.regionId===a.regionId&&!x.expedition)||state.parties.find(x=>x.regionId===a.regionId);if(p&&!p.members.includes(a.id)&&p.members.length<partyCap(p.regionId))p.members.unshift(a.id);if(p&&!p.captainId)p.captainId=a.id}
 return a;
}
function gc260CreateFounderRecord(regionId,opts={},assignFirstParty=false){return gc260RegisterFounder(gc260BuildFounder(regionId,opts),{assignFirstParty})}
function gc260AdoptFounder(id){
 const a=state.roster.find(x=>x.id===id&&x.status!=='Dead');if(!a)return toast('That adventurer cannot become the founder.');gc260RegisterFounder(a);a.history=a.history||[];a.history.push(`Day ${state.company.day}: recorded as the player-controlled founder of ${state.company.name}.`);state.ui.tab='you';save();render();toast(`${a.name} is now you.`);
}

/* --------------------------------------------------------------------------
   NEW GAME / OLD SAVE FOUNDER CREATION.
   -------------------------------------------------------------------------- */
function gc260Option(value,label,selected=false){return`<option value="${esc(value)}" ${selected?'selected':''}>${esc(label||value)}</option>`}
function gc260ClassOptions(culture,selected=''){const list=CLASSES[culture]||CLASSES.Veyric;return list.map((c,i)=>gc260Option(c.name,`${c.name} — ${c.role}`,selected?c.name===selected:i===0)).join('')}
function gc260CreatorHTML({migration=false}={}){
 const cultures=Object.keys(CULTURES),races=Object.keys(RACES),defaultCulture=migration?(REGION_DEFS[state?.currentRegion||'veyric']?.culture||'Veyric'):'Veyric',regions=migration?REGION_ORDER.filter(id=>state.regions[id]?.hq?.established):[];
 return`<div class="gc260Creator"><div class="gc260CreatorPreview" id="gc260FounderPreview"></div><div class="gc260CreatorFields"><div class="label">Your name</div><input id="founderName" class="field" maxlength="30" placeholder="e.g. Jon Varn" value="${migration?'Founder':''}">${migration?`<div class="label">Starting location</div><select id="founderRegion" class="field">${regions.map(id=>gc260Option(id,REGION_DEFS[id].name,id===state.currentRegion)).join('')}</select>`:''}<div class="gc260CreatorGrid"><label><span>Race</span><select id="founderRace" class="field">${races.map((x,i)=>gc260Option(x,x,i===0)).join('')}</select></label><label><span>Culture</span><select id="founderCulture" class="field">${cultures.map(x=>gc260Option(x,x,x===defaultCulture)).join('')}</select></label><label><span>Class</span><select id="founderClass" class="field">${gc260ClassOptions(defaultCulture)}</select></label><label><span>Portrait</span><select id="founderGender" class="field"><option>Male</option><option>Female</option></select></label></div><input type="hidden" id="founderPortrait" value="0"><div class="gc260PortraitControls"><button class="btn ghost" data-action="gc260PortraitPrev">‹ Portrait</button><b id="gc260PortraitLabel">1/${GC260_PORTRAIT_VARIANTS}</b><button class="btn ghost" data-action="gc260PortraitNext">Portrait ›</button></div>${migration?`<button class="btn primary wide" data-action="gc260CreateFounder">Create My Level 1 Founder</button>`:''}</div></div>`;
}
function gc260ReadCreator(){
 return{name:(document.getElementById('founderName')?.value||'').trim(),race:document.getElementById('founderRace')?.value||'Human',culture:document.getElementById('founderCulture')?.value||'Veyric',className:document.getElementById('founderClass')?.value||'',gender:document.getElementById('founderGender')?.value||'Male',portrait:Number(document.getElementById('founderPortrait')?.value)||0};
}
function gc260RefreshCreator(changedCulture=false){
 const culture=document.getElementById('founderCulture')?.value;if(!culture)return;if(changedCulture){const sel=document.getElementById('founderClass');if(sel)sel.innerHTML=gc260ClassOptions(culture)}
 const o=gc260ReadCreator(),preview={id:`founder-portrait-${o.portrait}`,gc260PortraitKey:`founder-portrait-${o.portrait}`,name:o.name||'Your Founder',race:o.race,culture:o.culture,gender:o.gender};const box=document.getElementById('gc260FounderPreview');if(box)box.innerHTML=`${blPortraitHTML(preview,'blPortraitLarge')}<div><b>${esc(o.name||'Your Founder')}</b><small>${esc(o.race)} • ${esc(o.culture)} ${esc(o.className||'Adventurer')}</small></div>`;const lab=document.getElementById('gc260PortraitLabel');if(lab)lab.textContent=`${o.portrait+1}/${GC260_PORTRAIT_VARIANTS}`;
}
function gc260CyclePortrait(dir){const el=document.getElementById('founderPortrait');if(!el)return;el.value=(Number(el.value)+dir+GC260_PORTRAIT_VARIANTS)%GC260_PORTRAIT_VARIANTS;gc260RefreshCreator(false)}

renderStart=function(){
 document.title='Grim Company — The Founder';document.body.dataset.brand='grim-company';
 const choices=GC194_MORTAL_REGIONS.map((id,i)=>{const d=REGION_DEFS[id],native=GC194_REGION_NATIVE[id];return`<label class="gc194StartRegion"><input type="radio" name="startRegion" value="${id}" ${i===0?'checked':''}><span><b>${esc(d.name)}</b><small>${esc(d.culture)} homeland • 50% ${native} recruits</small><em>${esc(d.desc)}</em></span></label>`}).join('');
 document.getElementById('app').className='';document.getElementById('app').innerHTML=`<div class="start gc193Start"><div class="startPanel gc193StartPanel gc260StartPanel"><div class="gc193LogoHero">${gc193SkullSvg('hero')}</div><h1>GRIM COMPANY</h1><p>You are not an invisible manager. You are the first adventurer in the company you are about to build.</p><div class="label">Name your company</div><input id="companyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><div class="label gc194ChooseLabel">Choose your first region</div><div class="gc194StartRegions">${choices}</div><div class="sectionTitle"><h3>Create Yourself</h3><span>Level 1 • real roster member</span></div>${gc260CreatorHTML()}<button class="btn primary wide gc260FoundButton" data-action="begin">FOUND COMPANY</button><p class="tiny muted">You use the same race, culture, class, injury, equipment, relationship and progression systems as every employee. The Shattered Firmament remains locked until all four mortal HQs exist.</p></div></div>`;document.getElementById('nav').innerHTML='';requestAnimationFrame(()=>gc260RefreshCreator(true));
};
startCompany=function(){
 const company=(document.getElementById('companyName')?.value||'').trim(),opts=gc260ReadCreator();if(company.length<2)return toast('Give the company a name first.');if(opts.name.length<2)return toast('Give your founder a name.');const chosen=document.querySelector('input[name="startRegion"]:checked')?.value||'veyric';state=createState(company,chosen);const f=gc260CreateFounderRecord(chosen,opts,true);state.ui.tab='you';safeLocalRemove(LEGACY_KEY);save();unlockAudio();render();toast(`${company} founded. ${f.name} is its first adventurer.`);
};
function gc260CreateFounderFromForm(){const o=gc260ReadCreator();if(o.name.length<2)return toast('Give your founder a name.');const rid=document.getElementById('founderRegion')?.value||state.currentRegion,f=gc260CreateFounderRecord(rid,o,false);state.ui.tab='you';save();render();toast(`${f.name} has entered the company.`)}

document.addEventListener('input',e=>{if(['founderName'].includes(e.target.id))gc260RefreshCreator(false)});
document.addEventListener('change',e=>{if(e.target.id==='founderCulture')gc260RefreshCreator(true);else if(['founderRace','founderClass','founderGender','founderRegion'].includes(e.target.id))gc260RefreshCreator(false)});

/* --------------------------------------------------------------------------
   YOU TAB — physical location, party membership and personal activity.
   -------------------------------------------------------------------------- */
if(!NAV.some(x=>x[0]==='you'))NAV.unshift(['you','✦','YOU']);
function gc260RemoveFounderFromParties(){const id=state.company.founderId;state.parties.forEach(p=>{if(p.expedition&&p.members.includes(id))return;p.members=p.members.filter(x=>x!==id);if(p.captainId===id)p.captainId=p.members[0]||null})}
function gc260JoinParty(pid){
 const f=gc260Founder(),p=state.parties.find(x=>x.id===pid);if(!f||!p||f.status!=='Ready')return toast('You are not available to join a party.');if(p.expedition)return toast('That party is already in the field.');if(p.regionId!==f.regionId)return toast('You are not in that region.');if(!p.members.includes(f.id)&&p.members.length>=partyCap(p.regionId))return toast('That party is full.');gc260RemoveFounderFromParties();if(!p.members.includes(f.id))p.members.unshift(f.id);if(!p.captainId)p.captainId=f.id;save();render();toast(`You joined ${p.name}.`)
}
function gc260LeaveParty(){const f=gc260Founder(),p=gc260FounderParty();if(!f||!p)return;if(p.expedition)return toast('You cannot leave a party in the field.');p.members=p.members.filter(x=>x!==f.id);if(p.captainId===f.id)p.captainId=p.members[0]||null;save();render();toast(`You left ${p.name}.`)}
function gc260TravelDays(from,to){return(from==='firmament'||to==='firmament')?GC260_FIRMAMENT_TRAVEL_DAYS:GC260_TRAVEL_DAYS}
function gc260StartTravel(to){
 const f=gc260Founder(),fs=gc260System();if(!f||f.status!=='Ready')return toast('You cannot travel right now.');if(!state.regions[to]?.hq?.established)return toast('There is no company HQ there yet.');if(to===f.regionId)return toast('You are already there.');const p=gc260FounderParty();if(p?.expedition)return toast('You are currently in the field.');gc260RemoveFounderFromParties();const days=gc260TravelDays(f.regionId,to);fs.activity={id:uid('act'),type:'travel',from:f.regionId,to,total:days,remaining:days};fs.location=f.regionId;f.status='Traveling';save();render();gc199RecordFeed(`${f.name} departed ${REGION_DEFS[f.regionId].name} for ${REGION_DEFS[to].name}.`,'history')
}
function gc260OpenTraining(){
 const f=gc260Founder();if(!f||f.status!=='Ready')return toast('You cannot train right now.');if(gc260FounderParty())return toast('Leave your party before starting a personal activity.');const pool=state.roster.filter(a=>a.id!==f.id&&a.regionId===f.regionId&&a.status==='Ready');if(!pool.length)return toast('No available training partners here.');modal(`<div class="sheetHead"><h3>Train With Someone</h3><button class="x" data-action="close">×</button></div><div class="notice">You spend half a simulation day training together. Both adventurers gain XP and the relationship becomes stronger.</div><div class="list" style="margin-top:8px">${pool.map(a=>`<button class="card gc260TrainPick" data-action="gc260TrainWith" data-id="${a.id}">${blPortraitHTML(a,'blPortraitSmall')}<span><b>${esc(a.name)}</b><small>Lv.${a.lvl} ${esc(a.culture)} ${esc(a.className)}</small></span></button>`).join('')}</div>`)
}
function gc260StartTraining(id){
 const f=gc260Founder(),t=state.roster.find(a=>a.id===id),fs=gc260System();if(!f||!t||f.status!=='Ready'||t.status!=='Ready'||t.regionId!==f.regionId)return toast('That training session is not available.');if(gc260FounderParty())return toast('Leave your party first.');fs.activity={id:uid('act'),type:'training',partnerId:t.id,total:GC260_TRAIN_DAYS,remaining:GC260_TRAIN_DAYS,regionId:f.regionId};f.status='Personal Activity';closeModal();save();render();toast(`Training with ${t.name}.`)
}
function gc260CompleteActivity(){
 const f=gc260Founder(),fs=gc260System(),a=fs?.activity;if(!f||!a)return;fs.activity=null;
 if(a.type==='travel'){f.regionId=a.to;f.status='Ready';fs.location=a.to;f.history.push(`Day ${state.company.day}: traveled to ${REGION_DEFS[a.to].name}.`);pushHistory(`${f.name} arrived at ${REGION_DEFS[a.to].name}.`,a.to);gc199RecordFeed(`${f.name} arrived at ${REGION_DEFS[a.to].name}.`,'history');sfx('depart')}
 else if(a.type==='training'){const t=state.roster.find(x=>x.id===a.partnerId),yard=hq(f.regionId).upgrades['Training Yard']||0,fxp=12+yard*4,txp=7+yard*2;f.status='Ready';grantXP(f,fxp);if(t&&t.status!=='Dead'){grantXP(t,txp);const before=relValue(f.id,t.id);setRel(f.id,t.id,before+5);if(typeof bl18AdjustRelation==='function')bl18AdjustRelation(f,t,{trust:2,respect:2,affinity:2},'personal training');f.history.push(`Day ${state.company.day}: trained personally with ${t.name}.`);t.history=t.history||[];t.history.push(`Day ${state.company.day}: trained personally with founder ${f.name}.`);gc199RecordFeed(`${f.name} and ${t.name} completed personal training.`,'relationship')}sfx('level')}
 save();render();
}
function gc260FounderTick(deltaDays){
 const f=gc260Founder(),fs=gc260System();if(!f||!fs?.activity||deltaDays<=0)return;const a=fs.activity;a.remaining=Math.max(0,(Number(a.remaining)||0)-deltaDays);const pct=1-a.remaining/Math.max(.001,a.total||1),bucket=Math.floor(pct*20);if(bucket!==a.renderBucket){a.renderBucket=bucket;if(state.ui.tab==='you'&&typeof gc202ScheduleRender==='function')gc202ScheduleRender()}if(a.remaining<=0)gc260CompleteActivity();
}
const _gc200ContinuousWorkGC260=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){const out=_gc200ContinuousWorkGC260(deltaDays);gc260FounderTick(deltaDays);return out};

function gc260LocationText(f){
 const fs=gc260System(),p=gc260FounderParty();if(f.status==='Dead')return'Fallen — remembered by the company';if(p?.expedition)return`In the field • ${p.name} • ${p.expedition.contract.title}`;if(fs.activity?.type==='travel')return`Traveling to ${REGION_DEFS[fs.activity.to].name}`;if(fs.activity?.type==='training'){const t=state.roster.find(x=>x.id===fs.activity.partnerId);return`Training with ${t?.name||'a company member'}`};return`${REGION_DEFS[f.regionId]?.name||f.regionId} • ${state.regions[f.regionId]?.hq?.name||'Company HQ'}`
}
function gc260ActivityHTML(f){const fs=gc260System(),a=fs.activity;if(!a)return'';const pct=clamp((1-a.remaining/Math.max(.001,a.total))*100,0,100),label=a.type==='travel'?`Travel to ${REGION_DEFS[a.to].name}`:`Training session`;return`<div class="gc260Activity"><div class="statline"><b>${esc(label)}</b><span>${Math.round(pct)}%</span></div><div class="bar goldbar"><i style="width:${pct}%"></i></div><div class="tiny muted">The company simulation continues while you are occupied.</div></div>`}
function gc260MigrationHTML(){
 const living=state.roster.filter(a=>a.status!=='Dead'),opts=living.map(a=>gc260Option(a.id,`${a.name} — Lv.${a.lvl} ${a.culture} ${a.className}`)).join('');
 return`<div class="hero gc260MigrationHero"><div class="kicker">v20.6 • THE FOUNDER</div><h2>Put yourself inside the company.</h2><p>This save predates player characters. Create a new Level 1 founder, or take control of one living adventurer already in your roster.</p></div>${living.length?`<div class="card"><b>Become an existing adventurer</b><div class="tiny muted" style="margin:4px 0 8px">Their level, gear, injuries, relationships and history remain exactly as they are.</div><select id="gc260AdoptId" class="field">${opts}</select><button class="btn goldbtn wide" data-action="gc260AdoptFounder">This Adventurer Is Me</button></div><div class="sectionTitle"><h3>Or create yourself</h3><span>new Level 1 roster member</span></div>`:''}${gc260CreatorHTML({migration:true})}`
}
function gc260FounderRelationships(f){return state.roster.filter(a=>a.id!==f.id&&a.status!=='Dead').map(a=>({a,v:relValue(f.id,a.id)})).filter(x=>x.v!==0).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v)).slice(0,6)}
function gc260RenderYou(){
 const f=gc260Founder();if(!f){requestAnimationFrame(()=>gc260RefreshCreator(true));return gc260MigrationHTML()}
 const d=derived(f),p=gc260FounderParty(),pending=p?.expedition?.gc260PendingDecision||null,rels=gc260FounderRelationships(f),fs=gc260System();
 if(f.status==='Dead')return`<div class="hero gc260DeadHero"><div class="kicker">THE FOUNDER • FALLEN</div><div class="gc260FounderHero">${blPortraitHTML(f,'blPortraitLarge')}<div><h2>${esc(f.name)}</h2><p>${esc(f.race)} • ${esc(f.culture)} ${esc(f.className)} • Level ${f.lvl}</p></div></div><p>Your death did not end the company. The organization you founded continues without plot armor.</p></div><div class="sectionTitle"><h3>Founder Legacy</h3><span>${f.missions} missions • ${f.kills} kills</span></div><div class="card history">${(f.history||[]).slice(-18).reverse().map(x=>`<div>${esc(x)}</div>`).join('')}</div>`;
 return`${pending?gc260PendingDecisionHTML(p,pending):''}<div class="hero gc260YouHero"><div class="kicker">YOU • COMPANY FOUNDER</div><div class="gc260FounderHero">${blPortraitHTML(f,'blPortraitLarge')}<div><h2>${esc(f.name)}</h2><p>Lv.${f.lvl} ${esc(f.race)} • ${esc(f.culture)} ${esc(f.className)}</p><div class="gc260Location">${esc(gc260LocationText(f))}</div></div></div></div>${gc260ActivityHTML(f)}<div class="grid3 gc260PersonalStats"><div class="card"><span>HP</span><b>${Math.round(f.hp)}/${d.maxHp}</b></div><div class="card"><span>XP</span><b>${f.lvl>=GC194_MAX_LEVEL?'MAX':`${f.xp}/${xpNeed(f.lvl)}`}</b></div><div class="card"><span>CAREER</span><b>${f.missions} jobs</b></div></div><div class="actions"><button class="btn" data-action="inspect" data-id="${f.id}">Full Character</button><button class="btn" data-action="gear" data-id="${f.id}" ${f.status==='Expedition'?'disabled':''}>Equipment</button>${p?.expedition?`<button class="btn primary" data-action="nav" data-tab="contracts">Monitor Expedition</button>`:''}</div>${f.status==='Ready'&&!fs.activity?gc260HQAgencyHTML(f,p):''}<div class="sectionTitle"><h3>Your Relationships</h3><span>real company members</span></div><div class="card">${rels.length?rels.map(x=>`<div class="relation"><span>${esc(x.a.name)}</span><b class="${x.v>0?'relGood':'relBad'}">${relLabel(x.v)} ${x.v>0?'+':''}${x.v}</b></div>`).join(''):'<div class="tiny muted">No notable relationships yet.</div>'}</div><div class="sectionTitle"><h3>Your History</h3><span>${f.kills} kills</span></div><div class="card history">${(f.history||[]).slice(-12).reverse().map(x=>`<div>${esc(x)}</div>`).join('')||'<div>Your story has just begun.</div>'}</div>`;
}
function gc260HQAgencyHTML(f,p){
 const idle=state.parties.filter(x=>x.regionId===f.regionId&&!x.expedition),otherRegions=REGION_ORDER.filter(id=>id!==f.regionId&&state.regions[id]?.hq?.established);
 return`<div class="sectionTitle"><h3>Your Agency</h3><span>one person • one place</span></div><div class="gc260AgencyGrid"><div class="card"><b>Party</b>${p?`<div class="small gold">${esc(p.name)}</div><div class="tiny muted">You will personally accompany this party's next contract.</div><button class="btn ghost wide" data-action="gc260LeaveParty">Leave Party</button>`:`<div class="tiny muted">Join one local company to personally accompany its next expedition.</div><div class="gc260MiniList">${idle.map(x=>`<button class="btn" data-action="gc260JoinParty" data-id="${x.id}" ${x.members.length>=partyCap(x.regionId)?'disabled':''}>Join ${esc(x.name)} • ${x.members.length}/${partyCap(x.regionId)}</button>`).join('')||'<span class="tiny muted">No idle parties here.</span>'}</div>`}</div><div class="card"><b>Personal Training</b><div class="tiny muted">Spend half a simulation day training with one real adventurer. Both gain XP and relationship progress.</div><button class="btn goldbtn wide" data-action="gc260TrainOpen" ${p?'disabled':''}>Train With Someone</button></div><div class="card"><b>Travel</b><div class="tiny muted">Your physical location matters. Management remains global, but Direct Command only happens where you actually are.</div><div class="gc260MiniList">${otherRegions.map(id=>`<button class="btn" data-action="gc260Travel" data-id="${id}">${esc(REGION_DEFS[id].name)} • ${gc260TravelDays(f.regionId,id).toFixed(2)} day</button>`).join('')||'<span class="tiny muted">Establish another HQ before you can travel there.</span>'}</div></div></div>`
}

const _renderGC260=render;
render=function(){
 if(state&&!gc260Founder()&&gc260System()?.needsSetup&&!gc260System().prompted){state.ui.tab='you';state.founderSystem.prompted=true}
 const out=_renderGC260();if(state?.ui?.tab==='you'){const screen=document.querySelector('#app .screen');if(screen)screen.innerHTML=gc260RenderYou();document.getElementById('nav').innerHTML=navHTML()}return out;
};
const _rosterCardGC260=rosterCard;
rosterCard=function(a){let html=_rosterCardGC260(a);if(a?.id===state?.company?.founderId)html=html.replace(`<h4>${esc(a.name)}</h4>`,`<h4>${esc(a.name)} <span class="gc260YouTag">YOU</span></h4>`);return html};
const _renderInspectGC260=renderInspect;
renderInspect=function(id,recruit=false){const out=_renderInspectGC260(id,recruit);if(!recruit&&id===state?.company?.founderId){document.getElementById('sheet')?.querySelector('.sheetHead')?.insertAdjacentHTML('afterend','<div class="gc260FounderBadge">YOU • COMPANY FOUNDER</div>')}return out};

/* --------------------------------------------------------------------------
   DIRECT COMMAND — only the expedition containing the founder waits for input.
   Every other party remains fully autonomous.
   -------------------------------------------------------------------------- */
function gc260Delegate(p,key){const f=gc260Founder(),list=partyMembers(p).filter(a=>a.id!==f?.id&&a.status!=='Dead').map(a=>({a,value:derived(a).util[key]||0})).sort((x,y)=>y.value-x.value);return list[0]||null}
function gc260SetPending(p,d){const e=p.expedition;e.gc260PendingDecision=Object.assign({id:uid('decision'),createdDay:state.company.day,progress:Number(e.progress)||0},d);e.events.push(`DIRECT COMMAND — ${d.title||'Founder decision'} is waiting on ${gc260Founder()?.name||'the founder'}.`);gc199RecordFeed(`DIRECT COMMAND — ${e.contract.title}: ${d.title||'decision required'}.`,'field');save();if(state.ui.tab==='you')render();else toast('Direct Command decision waiting in YOU.')}
const _fieldCheckGC260=fieldCheck;
fieldCheck=function(p){
 const e=p?.expedition,c=e?.contract;if(!e||!c||!gc260FounderInParty(p)||e.gc260FieldDecisionDone)return _fieldCheckGC260(p);if(e.gc260PendingDecision)return{pending:true};const key=c.check||'scout',meta=GC250_CHECK_META[key]||GC250_CHECK_META.scout,delegate=gc260Delegate(p,key);gc260SetPending(p,{type:'field',key,title:meta.label,scene:gc250CheckScene(key,c),delegateId:delegate?.a?.id||null});return{pending:true,key};
};
function gc260FieldSafeText(p,d){const risk=Number(p.expedition.contract.risk)||1;if(d.key==='scout')return['Take the long road',`+0.25 expedition day • future contact pressure -10%`];if(d.key==='sneak')return['Wait for darkness',`+0.18 day • contact -8% • small opening advantage`];if(d.key==='talk')return['Pay for cooperation',`${money(5+risk*4)} now • payment +5% • contact -4%`];if(d.key==='occult')return['Seal it and move on','Safer enemies • -10% cache chance'];return['Slow the march','+0.22 day • attrition and Push strain reduced']}
function gc260AddTravelTime(e,days){const current=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0);e.durationDays=Math.max(current+.05,(Number(e.durationDays)||1)+days);if(typeof gc200SetFieldProgress==='function')gc200SetFieldProgress(e,current);e.expectedReturnDay=state.company.day+Math.ceil(Math.max(0,e.durationDays-current))}
function gc260ResolveFieldRoll(p,d,actor){
 const e=p.expedition,c=e.contract,key=d.key,b=actor?{a:actor,value:derived(actor).util[key]||0}:bestUtility(p,key),diff=8+c.risk*4+c.unknown*2;let roll=b.value+rnd(-4,5);if(b.a?.traits?.includes('Lucky')&&chance(.22))roll+=4;const ok=roll>=diff,consequence=gc250ApplyCheckConsequences(p,key,ok),meta=GC250_CHECK_META[key]||GC250_CHECK_META.scout;e.checks=Array.isArray(e.checks)?e.checks:[];e.checks.push({key,ok,name:b.a?.name||'Unknown',roll,diff,consequence,gc260Direct:true});e.events.push(`${key.toUpperCase()} — ${b.a?.name||'Unknown'} ${ok?'succeeds':'fails'} (${roll} vs ${diff}).`);e.events.push(`DIRECT CONSEQUENCE — ${consequence}`);e.gc250FieldEvent={id:uid('field'),key,ok,name:b.a?.name||'Unknown',roll,diff,scene:d.scene||gc250CheckScene(key,c),consequence,label:meta.label,icon:meta.icon,progress:Number(e.progress)||0,day:state.company.day};return{title:`${meta.label} — ${ok?'SUCCESS':'FAILURE'}`,result:consequence,ok,actor:b.a?.name||'Unknown'}
}
function gc260ResolveSafeField(p,d){
 const e=p.expedition,c=e.contract,risk=Number(c.risk)||1;let result='';if(d.key==='scout'){gc260AddTravelTime(e,.25);e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.10;result='You deliberately take the long route. Expedition time +0.25 day; future hostile-contact pressure -10%.'}
 else if(d.key==='sneak'){gc260AddTravelTime(e,.18);e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.08;e.opening=(Number(e.opening)||0)+.10;result='You wait for darkness. Expedition time +0.18 day; contact pressure -8% and the next fight gains a small opening edge.'}
 else if(d.key==='talk'){const cost=5+risk*4;if(state.company.silver<cost)return null;state.company.silver-=cost;e.payBonus=(Number(e.payBonus)||0)+.05;e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.04;result=`You pay ${money(cost)} for cooperation. Contract payment +5% and hostile-contact pressure -4%.`}
 else if(d.key==='occult'){c.cacheChance=clamp((Number(c.cacheChance)||0)-.10,0,.95);e.enemyDebuff=(Number(e.enemyDebuff)||0)+.08;result='You order the dangerous pattern destroyed instead of studied. Enemy Attack/Guard -8%, but cache discovery chance -10%.'}
 else{gc260AddTravelTime(e,.22);e.attritionGuard=(Number(e.attritionGuard)||0)+.15;e.gc250PushStrainMult=Math.min(Number(e.gc250PushStrainMult)||1,.85);result='You slow the march. Expedition time +0.22 day; attrition resistance +15% and Push strain -15%.'}
 e.checks=Array.isArray(e.checks)?e.checks:[];e.checks.push({key:d.key,ok:true,name:'Direct order',roll:null,diff:null,consequence:result,gc260Safe:true});e.events.push(`DIRECT ORDER — ${result}`);return{title:'CONTROLLED APPROACH',result,ok:true,actor:gc260Founder()?.name||'Founder'}
}
function gc260CreateEngagementDecision(p){const e=p.expedition;if(!e||e.gc260PendingDecision||e.gc260BattleDecisionDone)return;gc260SetPending(p,{type:'engagement',title:'HOSTILE CONTACT',species:e.contract.species,contractTitle:e.contract.title})}
const _startBattleGC260=startBattle;
startBattle=function(p){
 const e=p?.expedition;if(gc260FounderInParty(p)&&e&&!e.gc260BattleDecisionDone){e.gc260DeferredBattle=true;if(!e.gc260PendingDecision)gc260CreateEngagementDecision(p);return null}
 const before=!!e?.battle,out=_startBattleGC260(p),b=e?.battle;if(!before&&b&&!b.gc260DirectiveApplied){if(Number(e.gc260GuardMult)>1)b.allies.forEach(x=>x.guard=Math.round(x.guard*e.gc260GuardMult));if(Number(e.gc260EnemyAttackMult)>1)b.enemies.forEach(x=>x.attack=Math.round(x.attack*e.gc260EnemyAttackMult));b.gc260DirectiveApplied=true;if(e.gc260LastDecision?.type==='engagement')b.log.unshift(`Direct Command: ${e.gc260LastDecision.result}`)}return out;
};
function gc260BestApproach(p){const s=bestUtility(p,'scout'),n=bestUtility(p,'sneak');return(s.value>=n.value)?{...s,key:'scout'}:{...n,key:'sneak'}}
function gc260ResolveEngagement(p,d,choice){
 const e=p.expedition,c=e.contract,risk=Number(c.risk)||1,unknown=Number(c.unknown)||0;let result='',avoid=false;
 if(choice==='ambush'){const b=gc260BestApproach(p),diff=10+risk*5+unknown*2,roll=b.value+rnd(-4,5),ok=roll>=diff;if(ok){e.opening=(Number(e.opening)||0)+.28;e.enemyDebuff=(Number(e.enemyDebuff)||0)+.05;result=`${b.a?.name||'The party'} sets the ambush (${roll} vs ${diff}). Major opening advantage; enemy Attack/Guard -5%.`}else{e.enemyOpening=(Number(e.enemyOpening)||0)+.18;result=`The ambush fails (${roll} vs ${diff}). The enemy gains the opening advantage.`}}
 else if(choice==='hold'){e.gc260GuardMult=1.12;result='You order a disciplined formation. Party Guard +12% for this encounter.'}
 else if(choice==='shock'){e.opening=(Number(e.opening)||0)+.20;e.gc260EnemyAttackMult=1.08;result='You attack before the enemy fully forms. Major opening advantage, but enemy Attack +8% for the fight.'}
 else if(choice==='break'){const b=gc260BestApproach(p),diff=12+risk*5+unknown*2,roll=b.value+rnd(-4,5),ok=roll>=diff;if(ok){gc260AddTravelTime(e,.18);e.gc250ContactMod=(Number(e.gc250ContactMod)||0)+.05;e.gc213LastEncounterExposure=Math.max(0,Number(e.gc201ContactExposure)||0);avoid=true;result=`${b.a?.name||'The party'} breaks contact (${roll} vs ${diff}). This fight is avoided, but travel +0.18 day and future contact pressure +5%.`}else{e.enemyOpening=(Number(e.enemyOpening)||0)+.22;result=`The disengagement fails (${roll} vs ${diff}). The enemy gets a major opening advantage.`}}
 else return null;
 e.gc260BattleDecisionDone=true;e.gc260DeferredBattle=false;return{title:avoid?'CONTACT BROKEN':'ENGAGEMENT ORDER',result,avoid,type:'engagement'}
}
function gc260ResolveDecision(pid,choice){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition,d=e?.gc260PendingDecision;if(!p||!e||!d||!gc260FounderInParty(p))return toast('That decision is no longer available.');let out=null;
 if(d.type==='field'){if(choice==='self')out=gc260ResolveFieldRoll(p,d,gc260Founder());else if(choice==='delegate'){const a=state.roster.find(x=>x.id===d.delegateId);out=gc260ResolveFieldRoll(p,d,a||gc260Founder())}else if(choice==='safe')out=gc260ResolveSafeField(p,d);if(!out)return toast('That controlled approach is not currently affordable.');e.gc260FieldDecisionDone=true}
 else if(d.type==='engagement')out=gc260ResolveEngagement(p,d,choice);if(!out)return;
 e.gc260PendingDecision=null;e.gc260LastDecision=Object.assign({id:d.id,type:d.type,day:state.company.day,choice},out);const fs=gc260System();fs.decisionHistory.push({contract:e.contract.title,...gc240Clone(e.gc260LastDecision)});if(fs.decisionHistory.length>40)fs.decisionHistory.splice(0,fs.decisionHistory.length-40);e.events.push(`DIRECT COMMAND — ${out.result}`);gc199RecordFeed(`DIRECT COMMAND — ${e.contract.title}: ${out.result}`,'field');
 if(d.type==='field'&&e.gc260DeferredBattle)startBattle(p);else if(d.type==='engagement'&&!out.avoid)startBattle(p);save();render();
}
function gc260PendingDecisionHTML(p,d){
 const e=p.expedition,f=gc260Founder();if(d.type==='field'){const key=d.key,founderScore=derived(f).util[key]||0,delegate=state.roster.find(x=>x.id===d.delegateId),delegateScore=delegate?(derived(delegate).util[key]||0):0,safe=gc260FieldSafeText(p,d),cost=key==='talk'?5+(Number(e.contract.risk)||1)*4:0;return`<div class="gc260Decision"><div class="gc260DecisionHead"><span>DIRECT COMMAND • ACTION REQUIRED</span><b>${esc(d.title)}</b></div><p>${esc(d.scene)}</p><div class="gc260DecisionChoices"><button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="self"><b>Take point yourself</b><small>${esc(f.name)} • ${esc(key)} ${founderScore}. You personally own the roll.</small></button>${delegate?`<button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="delegate"><b>Delegate to ${esc(delegate.name)}</b><small>${esc(key)} ${delegateScore}. Trust your specialist.</small></button>`:''}<button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="safe" ${cost&&state.company.silver<cost?'disabled':''}><b>${esc(safe[0])}</b><small>${esc(safe[1])}</small></button></div><div class="tiny muted">Only this expedition is waiting. Every other company activity continues normally.</div></div>`}
 const approach=gc260BestApproach(p);return`<div class="gc260Decision dangerDecision"><div class="gc260DecisionHead"><span>DIRECT COMMAND • HOSTILE CONTACT</span><b>${esc(e.contract.species)} ahead</b></div><p>Your party has made contact on <b>${esc(e.contract.title)}</b>. Because you are physically here, you choose how the first engagement develops.</p><div class="gc260DecisionChoices"><button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="ambush"><b>Set an ambush</b><small>${esc(approach.a?.name||'Best specialist')} uses ${esc(approach.key)} ${approach.value}. High upside; failure gives the enemy initiative.</small></button><button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="hold"><b>Hold formation</b><small>Party Guard +12% for this fight. Reliable, defensive command.</small></button><button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="shock"><b>Shock attack</b><small>Major opening advantage, but enemy Attack +8% for the encounter.</small></button><button class="card" data-action="gc260Decision" data-party="${p.id}" data-choice="break"><b>Try to break contact</b><small>${esc(approach.a?.name||'Best specialist')} attempts ${esc(approach.key)} ${approach.value}. Success avoids this fight at a time/risk cost.</small></button></div><div class="tiny muted">Only this expedition is waiting. The company simulation is still running.</div></div>`
}
const _gc200AdvanceExpeditionGC260=gc200AdvanceExpedition;
gc200AdvanceExpedition=function(p,deltaDays,pushing=false){if(p?.expedition?.gc260PendingDecision)return false;return _gc200AdvanceExpeditionGC260(p,deltaDays,pushing)};
const _gc193FinishNoTimeGC260=gc193FinishNoTime;
gc193FinishNoTime=function(p){if(p?.expedition?.gc260PendingDecision&&gc260FounderInParty(p))return false;return _gc193FinishNoTimeGC260(p)};
const _gc199PushPartyGC260=gc199PushParty;
gc199PushParty=function(pid){const p=state.parties.find(x=>x.id===pid);if(p?.expedition?.gc260PendingDecision)return toast('Your expedition is waiting for a Direct Command decision in YOU.');return _gc199PushPartyGC260(pid)};

const _expeditionCardGC260=expeditionCard;
expeditionCard=function(p){let html=_expeditionCardGC260(p);if(!gc260FounderInParty(p))return html;const d=p.expedition?.gc260PendingDecision,tag=d?`<div class="gc260FieldPresence waiting"><b>YOU ARE HERE • DECISION WAITING</b><span>${esc(d.title||'Direct Command')}</span><button class="btn primary" data-action="gc260GoYou">Open YOU</button></div>`:`<div class="gc260FieldPresence"><b>YOU ARE HERE • DIRECT COMMAND</b><span>Important field moments can be personally directed.</span></div>`;return html.replace('<div class="actions">',tag+'<div class="actions">')};

const _resolveBattleGC260=resolveBattle;
resolveBattle=function(p,win){const f=gc260Founder(),wasAlive=!!(f&&f.status!=='Dead'),out=_resolveBattleGC260(p,win),now=gc260Founder();if(wasAlive&&now?.status==='Dead'&&!gc260System().deathRecorded){gc260System().deathRecorded=true;now.history=now.history||[];now.history.push(`Day ${state.company.day}: died in the field as founder of ${state.company.name}.`);pushHistory(`FOUNDER FALLEN — ${now.name} died in the field. The company continues.`,now.regionId);gc199RecordFeed(`FOUNDER FALLEN — ${now.name}.`,'danger')}return out};

/* --------------------------------------------------------------------------
   ACTIONS / PRESENTATION.
   -------------------------------------------------------------------------- */
const _processActionGC260=processAction;
processAction=function(el){const a=el.dataset.action;if(a==='gc260PortraitPrev')return gc260CyclePortrait(-1);if(a==='gc260PortraitNext')return gc260CyclePortrait(1);if(a==='gc260CreateFounder')return gc260CreateFounderFromForm();if(a==='gc260AdoptFounder')return gc260AdoptFounder(document.getElementById('gc260AdoptId')?.value);if(a==='gc260JoinParty')return gc260JoinParty(el.dataset.id);if(a==='gc260LeaveParty')return gc260LeaveParty();if(a==='gc260Travel')return gc260StartTravel(el.dataset.id);if(a==='gc260TrainOpen')return gc260OpenTraining();if(a==='gc260TrainWith')return gc260StartTraining(el.dataset.id);if(a==='gc260Decision')return gc260ResolveDecision(el.dataset.party,el.dataset.choice);if(a==='gc260GoYou'){state.ui.tab='you';closeModal();save();return render()}return _processActionGC260(el)};

function gc260InstallStyles(){if(document.getElementById('gc260Styles'))return;const st=document.createElement('style');st.id='gc260Styles';st.textContent=`
 .bottomnav .inner{grid-template-columns:repeat(6,1fr)}.navbtn{font-size:7px}.navbtn b{font-size:16px}.gc260StartPanel{width:min(610px,100%)}.gc260Creator{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:start;margin:8px 0 12px}.gc260CreatorPreview{border:1px solid #513b2a;background:#100d0a;border-radius:12px;min-height:176px;padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.gc260CreatorPreview .blSvgPortrait{width:118px;height:118px}.gc260CreatorPreview b{display:block;margin-top:5px;font:700 14px Georgia,serif}.gc260CreatorPreview small{display:block;font-size:9px;color:#9d8e79;margin-top:2px}.gc260CreatorGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.gc260CreatorGrid label span{display:block;font-size:8px;color:#998873;text-transform:uppercase;letter-spacing:.08em}.gc260CreatorGrid .field{margin:4px 0 6px}.gc260PortraitControls{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;margin:4px 0 10px}.gc260PortraitControls b{text-align:center;font-size:9px;color:#c7ad84}.gc260FoundButton{margin-top:9px}.gc260FounderHero{display:grid;grid-template-columns:105px 1fr;gap:12px;align-items:center;margin-top:7px}.gc260FounderHero .blSvgPortrait{width:105px;height:105px}.gc260FounderHero h2{margin:0 0 3px}.gc260FounderHero p{margin:0}.gc260Location{margin-top:7px;padding:6px 8px;border-left:2px solid #b17a45;background:#15100c;font-size:9px;color:#c6b293}.gc260Activity{margin:8px 0;padding:10px;border:1px solid #60462f;border-radius:10px;background:#17110d}.gc260PersonalStats .card{text-align:center}.gc260PersonalStats span{display:block;font-size:7px;color:#8f806c;letter-spacing:.08em}.gc260PersonalStats b{font-size:12px}.gc260AgencyGrid{display:grid;grid-template-columns:1fr;gap:7px}.gc260AgencyGrid .card{margin:0}.gc260MiniList{display:grid;gap:5px;margin-top:8px}.gc260MiniList .btn{text-align:left}.gc260TrainPick{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;text-align:left}.gc260TrainPick .blSvgPortrait{width:42px;height:42px}.gc260TrainPick small{display:block;color:#9d8f7a;font-size:8px}.gc260YouTag{font-size:7px;color:#f0c779;border:1px solid #73522f;border-radius:999px;padding:2px 5px;vertical-align:middle}.gc260FounderBadge{margin:0 0 8px;padding:7px 9px;border-left:3px solid #c58f4f;background:#24180f;color:#e2bd7a;font-size:9px;font-weight:800;letter-spacing:.09em}.gc260Decision{margin:0 0 11px;padding:12px;border:1px solid #9a633d;border-radius:12px;background:linear-gradient(145deg,#2c1d12,#120d09);box-shadow:0 0 0 1px rgba(208,158,87,.08) inset,0 9px 24px rgba(0,0,0,.28)}.gc260Decision.dangerDecision{border-color:#8c493f;background:linear-gradient(145deg,#2b1411,#120b09)}.gc260DecisionHead span{display:block;font-size:8px;letter-spacing:.13em;color:#d1a05f}.gc260DecisionHead b{display:block;margin-top:3px;font:700 18px Georgia,serif}.gc260Decision p{font-size:10px;line-height:1.5;color:#baa78d}.gc260DecisionChoices{display:grid;gap:6px}.gc260DecisionChoices .card{text-align:left;margin:0;cursor:pointer}.gc260DecisionChoices .card b{display:block;font-size:11px}.gc260DecisionChoices .card small{display:block;margin-top:3px;font-size:8px;line-height:1.4;color:#a4937d}.gc260DecisionChoices .card:disabled{opacity:.35}.gc260FieldPresence{margin:8px 0;padding:7px 8px;border-left:2px solid #c3934e;background:rgba(194,145,72,.06);display:grid;grid-template-columns:1fr;gap:2px}.gc260FieldPresence b{font-size:8px;letter-spacing:.1em;color:#d4aa68}.gc260FieldPresence span{font-size:8px;color:#9f917e}.gc260FieldPresence.waiting{border-color:#c85e50;background:rgba(157,53,43,.10)}.gc260FieldPresence .btn{margin-top:4px}.gc260MigrationHero{border-color:#8a5b38}.gc260DeadHero{border-color:#77352f;filter:saturate(.75)}
 @media(max-width:520px){.gc260Creator{grid-template-columns:1fr}.gc260CreatorPreview{min-height:142px;display:grid;grid-template-columns:112px 1fr;text-align:left}.gc260CreatorPreview .blSvgPortrait{width:105px;height:105px}.gc260CreatorGrid{grid-template-columns:1fr 1fr}.bottomnav .inner{grid-template-columns:repeat(6,1fr)}.navbtn{font-size:6.5px;padding-left:0;padding-right:0}.navbtn b{font-size:15px}.gc260FounderHero{grid-template-columns:90px 1fr}.gc260FounderHero .blSvgPortrait{width:88px;height:88px}}
 `;document.head.appendChild(st)}
gc260InstallStyles();

const _auditGC260=audit;
audit=function(){const out=_auditGC260();out.v260Founder=GC260_VERSION;out.playerCharacterIsRosterMember=true;out.founderCharacterCreation=true;out.modularPortraitSelection=true;out.youTab=true;out.founderPhysicalLocation=true;out.founderTravel=true;out.personalTraining=true;out.directCommandExpeditions=true;out.companyContinuesDuringFounderDecision=true;out.founderNoPlotArmor=true;out.existingSaveFounderMigration=true;return out};
window.__BL_AUDIT=audit;
window.__GC260_TEST=function(){
 const old=state;try{
   state=createState('Founder Test','veyric');const f=gc260CreateFounderRecord('veyric',{name:'Test Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Female',portrait:3},true),p=gc260FounderParty(),founderOk=state.company.founderId===f.id&&state.roster.some(a=>a.id===f.id)&&p?.members.includes(f.id)&&p.captainId===f.id&&f.lvl===1;
   const c=gc250FreshContractForRisk('veyric',1,[]);c.check='scout';f.status='Expedition';p.expedition={contract:c,progress:30,events:[],checks:[],battle:null,fought:false,complete:false,durationDays:2,elapsedDays:0,gc199FieldProgress:.6,gc201ContactExposure:0,gc213LastEncounterExposure:0};const pending=fieldCheck(p),pausedBefore=p.expedition.progress,gated=gc200AdvanceExpedition(p,.1,false)===false&&p.expedition.progress===pausedBefore&&p.expedition.gc260PendingDecision?.type==='field';gc260ResolveDecision(p.id,'self');const directOk=!p.expedition.gc260PendingDecision&&p.expedition.gc260FieldDecisionDone&&p.expedition.checks.length===1;
   p.expedition.gc260BattleDecisionDone=false;startBattle(p);const engagePending=p.expedition.gc260PendingDecision?.type==='engagement'&&!p.expedition.battle;gc260ResolveDecision(p.id,'hold');const battleOk=!!p.expedition.battle&&p.expedition.gc260BattleDecisionDone;
   const saved=JSON.parse(JSON.stringify(state)),loaded=normalizeState(saved),saveSafe=loaded.company.founderId===f.id&&loaded.roster.some(a=>a.id===f.id&&a.gc260Founder);
   state=loaded;const lf=gc260Founder();state.parties.forEach(x=>{x.expedition=null;x.members=x.members.filter(id=>id!==lf.id)});lf.status='Ready';lf.regionId='veyric';state.regions.skeld.hq.established=true;gc260StartTravel('skeld');gc260FounderTick(2);const travelOk=lf.regionId==='skeld'&&lf.status==='Ready'&&!gc260System().activity;
   return{ok:founderOk&&gated&&directOk&&engagePending&&battleOk&&saveSafe&&travelOk,founderOk,gated,directOk,engagePending,battleOk,saveSafe,travelOk,founder:f.name};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
