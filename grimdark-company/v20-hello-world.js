/* Grim Company v20.00 — “Hello, World”
   Continuous work simulation plus lightweight visual/audio feedback.
   Days remain a calendar boundary; adventurer work is tick-driven. */
const GC200_VERSION='20.00';
const GC200_RELATION_STEP=.25;

function gc200Work(a){
 if(!a)return{};
 a.gc200Work=a.gc200Work||{};
 const w=a.gc200Work;
 if(!Number.isFinite(Number(w.trainXP)))w.trainXP=0;
 if(!Number.isFinite(Number(w.heal)))w.heal=0;
 if(!Number.isFinite(Number(w.mentorXP)))w.mentorXP=0;
 if(!Number.isFinite(Number(w.selfXP)))w.selfXP=0;
 if(!Number.isFinite(Number(w.facilityXP)))w.facilityXP=0;
 if(!Number.isFinite(Number(w.scoutProgress)))w.scoutProgress=0;
 if(!Number.isFinite(Number(w.recoveryLeft)))w.recoveryLeft=Math.max(0,Number(a.recovery)||0);
 if(w.scoutTarget==null)w.scoutTarget=null;
 return w;
}
function gc200InitState(s=state){
 if(!s)return s;
 s.timeSystem=s.timeSystem||{};
 s.timeSystem.gc200Version=GC200_VERSION;
 (s.roster||[]).forEach(gc200Work);
 Object.values(s.regions||{}).forEach(r=>{
   if(!Number.isFinite(Number(r.gc200PatrolProgress)))r.gc200PatrolProgress=0;
   if(!Number.isFinite(Number(r.gc200RelationProgress)))r.gc200RelationProgress=0;
   if(!Number.isFinite(Number(r.gc200ArchiveProgress)))r.gc200ArchiveProgress=0;
 });
 return s;
}
const _normalizeStateGC200=normalizeState;
normalizeState=function(s){s=_normalizeStateGC200(s);return gc200InitState(s)};
const _createStateGC200=createState;
createState=function(name,startRegion='veyric'){return gc200InitState(_createStateGC200(name,startRegion))};

/* The calendar is now only the calendar. Midnight no longer hands out a day's
   worth of training/healing/scouting/patrol work in one lump. */
gc199AdvanceWorldDay=function(){
 if(!state)return false;
 const oldDay=state.company.day,before=state.history?.length||0;
 state.company.day++;
 processWorldDay();
 weeklyWages();
 REGION_ORDER.forEach(id=>{if(state.company.day%3===0)refreshRecruits(id)});
 pushHistory(`Day ${oldDay} ended. The company kept working through the night.`);
 const fresh=(state.history||[]).slice(before);
 fresh.forEach(h=>gc199RecordFeed(h.text||h,'history',h.day||state.company.day));
 state.timeSystem.lastReport={from:oldDay,to:state.company.day,lines:fresh.map(h=>h.text||String(h)).slice(-30)};
 state.parties.forEach(p=>{if(p.expedition){const e=p.expedition,remain=Math.max(0,e.durationDays-(e.elapsedDays+(Number(e.gc199FieldProgress)||0)));e.expectedReturnDay=state.company.day+Math.ceil(remain)}});
 save();render();
 return true;
};

function gc200Effects(){
 const out={};
 REGION_ORDER.forEach(id=>out[id]=gc193FacilityEffects(id));
 state.timeSystem.regionEffects=Object.fromEntries(REGION_ORDER.map(id=>[id,{salvageBonus:out[id].salvageBonus||0}]));
 return out;
}
function gc200SpendFraction(w,key,amount,award){
 w[key]=(Number(w[key])||0)+Math.max(0,amount||0);
 let n=Math.floor(w[key]+1e-8);if(n<=0)return 0;
 w[key]-=n;
 for(let i=0;i<n;i++)award();
 return n;
}
function gc200HealTick(a,effects,deltaDays){
 if(!gc193AtHQ(a)||deltaDays<=0)return;
 const w=gc200Work(a),max=derived(a).maxHp,inf=hq(a.regionId).upgrades.Infirmary||0,facility=effects?.healPct||0;
 a.hp=clamp(Number(a.hp)||0,0,max);
 let pct=a.status==='Recovering'?.12:(a.dailyOrder==='Rest'?.11:.025);
 pct+=inf*.01+facility;
 if(a.hp<max){
   const amount=max*pct*deltaDays;
   gc200SpendFraction(w,'heal',amount,()=>{if(a.hp<max)a.hp=Math.min(max,a.hp+1)});
 }else w.heal=0;
 if(a.status==='Recovering'){
   if(w.lastStatus!=='Recovering'||w.recoveryLeft<=0)w.recoveryLeft=Math.max(.25,Number(a.recovery)||1);
   w.recoveryLeft=Math.max(0,w.recoveryLeft-deltaDays);
   a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
   if(w.recoveryLeft<=0){
     a.status='Ready';a.injury=null;a.recovery=0;a.dailyOrder='Rest';w.lastStatus='Ready';
     const text=`${a.name} finished recovering and returned to duty.`;pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');sfx('rest');
   }
 }
 w.lastStatus=a.status;
}
function gc200TrainRate(a,effects){
 const yard=hq(a.regionId).upgrades['Training Yard']||0;
 return Math.max(1,(6+yard*2)*(effects?.trainingMult||1));
}
function gc200TrainingTick(a,effects,deltaDays){
 if(a.status!=='Ready'||a.dailyOrder!=='Train')return;
 const w=gc200Work(a),rate=gc200TrainRate(a,effects);
 gc200SpendFraction(w,'trainXP',rate*deltaDays,()=>{
   const before=a.lvl;if(grantXP(a,1)&&a.lvl>before){const text=`${a.name} reached Level ${a.lvl} while training.`;gc199RecordFeed(text,'level');sfx('level')}
 });
}
function gc200ScoutTarget(a){
 const w=gc200Work(a),r=state.regions[a.regionId],valid=(r.contracts||[]).find(c=>c.id===w.scoutTarget);
 if(valid&&(valid.gcIntel<2||(valid.unknown||0)>0))return valid;
 const list=(r.contracts||[]).map(gc193EnsureContract).filter(c=>c.gcIntel<2||(c.unknown||0)>0).sort((x,y)=>(y.unknown||0)-(x.unknown||0)||x.gcIntel-y.gcIntel||y.risk-x.risk);
 const c=list[0]||null;w.scoutTarget=c?.id||null;if(!c)w.scoutProgress=0;return c;
}
function gc200ScoutRate(a){const d=derived(a),score=d.util.scout+d.combat.speed*.25;return clamp(.72+score/75,.75,2.25)}
function gc200ResolveScout(a,c){
 if(!c)return;
 const d=derived(a),score=d.util.scout+d.combat.speed*.25,gain=score>=30?2:1,beforeIntel=c.gcIntel||0,beforeUnknown=c.unknown||0;
 c.gcIntel=Math.min(2,(c.gcIntel||0)+gain);c.unknown=Math.max(0,(c.unknown||0)-gain);c.gcScoutEdge=Math.max(c.gcScoutEdge||0,Math.min(.12,.04+Math.max(0,score-15)/220));
 grantXP(a,4+gain);bl18InitAdventurer(a).veteran.behavior.fieldcraft++;if(typeof bl18MaybeTraits==='function')bl18MaybeTraits(a);
 const text=`${a.name} made a scouting breakthrough on ${c.title}: intel ${beforeIntel}→${c.gcIntel}, unknowns ${beforeUnknown}→${c.unknown}.`;
 gc199RecordFeed(text,'scout');
 if(c.gcIntel>=2&&(c.unknown||0)<=0)gc200Work(a).scoutTarget=null;
}
function gc200ScoutingTick(a,deltaDays){
 if(a.status!=='Ready'||a.dailyOrder!=='Scout')return;
 const w=gc200Work(a),c=gc200ScoutTarget(a);if(!c)return;
 w.scoutProgress+=gc200ScoutRate(a)*deltaDays;
 let guard=0;while(w.scoutProgress>=1&&guard++<3){w.scoutProgress-=1;gc200ResolveScout(a,c);if(!gc200ScoutTarget(a))break}
}
function gc200PatrolTick(regionId,deltaDays){
 const r=state.regions[regionId],patrollers=state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.dailyOrder==='Patrol');if(!patrollers.length)return;
 const score=patrollers.reduce((s,a)=>{const d=derived(a);return s+d.combat.attack*.22+d.combat.guard*.14+d.util.scout*.18+a.lvl*1.8},0),avg=score/patrollers.length;
 const rate=clamp(.72+avg/125+Math.min(.26,(patrollers.length-1)*.07),.75,1.65);
 r.gc200PatrolProgress=(Number(r.gc200PatrolProgress)||0)+rate*deltaDays;
 let guard=0;while(r.gc200PatrolProgress>=1&&guard++<2){
   r.gc200PatrolProgress-=1;const report=[];gc193PatrolRegion(regionId,patrollers,report);report.forEach(x=>gc199RecordFeed(x,'patrol'));
 }
}
function gc200MentorTick(a,effects,deltaDays){
 if(a.status!=='Ready'||a.dailyOrder!=='Mentor')return;
 const t=state.roster.find(x=>x.id===a.dailyMentorId),w=gc200Work(a);if(!t||t.regionId!==a.regionId||t.status!=='Ready'||t.dailyOrder!=='Train')return;
 const gap=Math.max(0,a.lvl-t.lvl),career=bl17EnsureCareer(a),yard=hq(a.regionId).upgrades['Training Yard']||0,rate=Math.max(1,(8+yard*2+gap*2+career*3)*(effects?.trainingMult||1));
 gc200SpendFraction(w,'mentorXP',rate*deltaDays,()=>grantXP(t,1));
 gc200SpendFraction(w,'selfXP',2*deltaDays,()=>grantXP(a,1));
}
function gc200FacilityTick(regionId,effects,deltaDays){
 const r=state.regions[regionId],workers=GC193_FACILITIES.flatMap(f=>gc193FacilityWorkers(regionId,f));
 workers.forEach(a=>gc200SpendFraction(gc200Work(a),'facilityXP',2*deltaDays,()=>grantXP(a,1)));
 if(effects.office){
   const a=effects.office,d=derived(a),c=[...(r.contracts||[])].sort((x,y)=>y.reward-x.reward)[0];
   if(c){gc193EnsureContract(c);const cap=Math.min(.18,.08+d.util.talk/500);c.gcOfficeBonus=Math.min(cap,(c.gcOfficeBonus||0)+cap*deltaDays)}
 }
 if(effects.archive){
   const a=effects.archive,d=derived(a),c=(r.contracts||[]).filter(x=>ENEMY_SPECIES[x.species]?.supernatural).sort((x,y)=>(y.unknown||0)-(x.unknown||0))[0];
   if(c){
     gc193EnsureContract(c);const cap=Math.min(.12,.05+d.util.occult/500);c.gcOccultEdge=Math.min(cap,(c.gcOccultEdge||0)+cap*deltaDays);
     r.gc200ArchiveProgress=(Number(r.gc200ArchiveProgress)||0)+clamp(.7+d.util.occult/90,.75,1.8)*deltaDays;
     if(r.gc200ArchiveProgress>=1){r.gc200ArchiveProgress-=1;const before=c.unknown||0;c.unknown=Math.max(0,before-1);if(before!==c.unknown)gc199RecordFeed(`${a.name} uncovered occult intelligence on ${c.title}.`,'scout')}
   }
 }
}
function gc200RelationshipTick(regionId,deltaDays){
 const r=state.regions[regionId],pool=state.roster.filter(a=>a.regionId===regionId&&a.status!=='Dead'&&a.status!=='Expedition'&&a.status!=='Captured');if(pool.length<2)return;
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){const rel=bl18Rel(pool[i],pool[j]);rel.gc200SharedTime=(Number(rel.gc200SharedTime)||0)+deltaDays}
 r.gc200RelationProgress=(Number(r.gc200RelationProgress)||0)+deltaDays;
 let guard=0;while(r.gc200RelationProgress>=GC200_RELATION_STEP&&guard++<3){
   r.gc200RelationProgress-=GC200_RELATION_STEP;
   const pairs=[];for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)pairs.push([pool[i],pool[j]]);
   for(const [a,b] of gc195Shuffle(pairs)){
     const daily=gc195PairEventChance(a,b,{kind:'hq'}),scaled=1-Math.pow(1-daily,GC200_RELATION_STEP);
     if(chance(scaled)){
       const before=(state.relationshipSystem?.recent||[]).length;
       if(gc195RunPairEvent(a,b,{kind:'hq'})){
         const ev=(state.relationshipSystem?.recent||[])[(state.relationshipSystem?.recent||[]).length-1];if(ev&&(state.relationshipSystem.recent.length>before))gc199RecordFeed(`RELATIONSHIP — ${ev.text}`,'relationship');
         break;
       }
     }
   }
 }
}
function gc200ContinuousWork(deltaDays){
 if(!state||deltaDays<=0)return;
 gc200InitState(state);const effects=gc200Effects();
 state.roster.forEach(a=>{if(!gc193AtHQ(a))return;gc200HealTick(a,effects[a.regionId],deltaDays);gc200TrainingTick(a,effects[a.regionId],deltaDays);gc200ScoutingTick(a,deltaDays);gc200MentorTick(a,effects[a.regionId],deltaDays)});
 REGION_ORDER.forEach(id=>{gc200PatrolTick(id,deltaDays);gc200FacilityTick(id,effects[id],deltaDays);gc200RelationshipTick(id,deltaDays)});
}

/* Expedition encounter chance is converted from “chance per day” into a hazard
   rate, so contact can happen at any tick instead of only on a day boundary. */
function gc200FieldRelations(p,deltaDays){
 const e=p?.expedition;if(!e)return;
 e.gc200RelationProgress=(Number(e.gc200RelationProgress)||0)+deltaDays;if(e.gc200RelationProgress<GC200_RELATION_STEP)return;
 e.gc200RelationProgress-=GC200_RELATION_STEP;
 const members=partyMembers(p).filter(a=>a.status!=='Dead');if(members.length<2)return;
 const pairs=[];for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)pairs.push([members[i],members[j]]);
 for(const [a,b] of gc195Shuffle(pairs)){
   const ctx={kind:'field',risk:e.contract?.risk||1,title:e.contract?.title||'contract'},daily=gc195PairEventChance(a,b,ctx),scaled=1-Math.pow(1-daily,GC200_RELATION_STEP);
   if(chance(scaled)){gc195RunPairEvent(a,b,ctx);break}
 }
}
function gc200SetFieldProgress(e,total){
 total=clamp(total,0,Math.max(1,e.durationDays));e.elapsedDays=Math.floor(total);e.gc199FieldProgress=clamp(total-e.elapsedDays,0,.9999);e.progress=clamp(Math.round(total/Math.max(1,e.durationDays)*100),0,100);
}
function gc200AdvanceExpedition(p,deltaDays,pushing=false){
 const e=p?.expedition;if(!e||e.battle||deltaDays<=0)return false;
 const current=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),remaining=Math.max(0,e.durationDays-current);if(remaining<=0){gc193FinishNoTime(p);return true}
 const span=Math.min(deltaDays,remaining);p._gc199Pushing=!!pushing;
 const daily=gc194EncounterChance(p);p._gc199Pushing=false;
 const hazard=1-Math.pow(1-clamp(daily,0,.98),span),contact=chance(hazard),travel=contact?span*Math.random():span,total=current+travel;
 gc200SetFieldProgress(e,total);e.gc200EncounterExposure=(Number(e.gc200EncounterExposure)||0)+travel;gc200FieldRelations(p,travel);
 if((e.gcChecksDone||0)<1&&total>=Math.min(.35,e.durationDays*.25)){fieldCheck(p);e.gcChecksDone=(e.gcChecksDone||0)+1}
 if(contact){
   e.gc194Encounters=(e.gc194Encounters||0)+1;e.events.push(`Hostile contact at ${Math.round(e.progress)}% progress (${Math.round(daily*100)}% daily risk).`);startBattle(p);save();render();return true;
 }
 if(total>=e.durationDays-.0001){gc200SetFieldProgress(e,e.durationDays);gc193FinishNoTime(p);return true}
 e.expectedReturnDay=state.company.day+Math.ceil(e.durationDays-total);return true;
}
function gc200AdvanceExpeditions(deltaDays){
 const parties=state.parties.filter(p=>p.expedition&&!p.expedition.battle).slice();
 for(const p of parties){gc200AdvanceExpedition(p,deltaDays,false);if(gc199Mode()==='paused')break}
}

/* v19.9's loop calls this every quarter-second. It is now the master tick for
   field travel and HQ work rather than merely a fractional field-day accumulator. */
gc199AdvanceFieldClocks=function(deltaDays){gc200ContinuousWork(deltaDays);gc200AdvanceExpeditions(deltaDays)};

/* Prevent the original 1.7-second legacy expedition timer from advancing travel
   or combat. Combat only advances from an explicit player press. */
advanceExpedition=function(pid,manual=false){
 const p=state.parties.find(x=>x.id===pid);if(!p?.expedition)return;
 if(p.expedition.battle){if(manual)return combatRound(p);return}
 if(manual)return gc199PushParty(pid);
};

gc199PushParty=function(pid){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition;if(!e)return toast('That party is not in the field.');if(e.battle)return toast('Resolve the encounter before ordering a push.');
 if(Number(e.gc199LastPushDay)===state.company.day)return toast('This party has already been pushed hard today.');
 e.gc199LastPushDay=state.company.day;e.events.push(`Day ${state.company.day}: headquarters ordered a forced pace.`);gc199PushAttrition(p);gc199RecordFeed(`${p.name} was ordered to push ${e.contract.title}.`,'push');
 gc200AdvanceExpedition(p,1,true);save();if(p.expedition)render();
};

/* A day begins at sunrise. The sun crosses the clock first; the moon crosses the
   same lane second. The meter underneath remains the exact progress indicator. */
gc199ClockLabel=function(){
 const f=clamp(Number(state?.timeSystem?.gc199DayProgress)||0,0,.9999),mins=(360+Math.floor(f*1440))%1440,hh=String(Math.floor(mins/60)).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');
 return `DAY ${state?.company?.day||1} · ${hh}:${mm}`;
};
gc199ClockHTML=function(){
 const mode=gc199Mode(),reason=state.timeSystem.gc199PauseReason||'';
 return `<div class="gc199ClockBar gc200ClockBar" id="gc199ClockBar"><div class="gc199ClockMain"><div><b data-gc199-clock>${gc199ClockLabel()}</b><span data-gc199-state>${mode==='paused'?(reason||'PAUSED'):mode==='fast'?'RUNNING 4×':'RUNNING'}</span></div><div class="gc199ClockBtns"><button class="gc199ModeBtn ${mode==='paused'?'active':''}" data-action="gc199Pause" aria-label="Pause">Ⅱ</button><button class="gc199ModeBtn ${mode==='play'?'active':''}" data-action="gc199Play" aria-label="Play">▶</button><button class="gc199ModeBtn ${mode==='fast'?'active':''}" data-action="gc199Fast" aria-label="Fast">▶▶</button></div></div><div class="gc200Sky" data-gc200-sky><div class="gc200Horizon"></div><div class="gc200Sun" data-gc200-sun><i></i></div><div class="gc200Moon" data-gc200-moon><i></i></div><span data-gc200-phase>DAYLIGHT</span></div><div class="gc199ClockTrack"><i data-gc199-daybar style="width:${Math.round(state.timeSystem.gc199DayProgress*100)}%"></i></div></div>`;
};
const _gc199UpdateClockGC200=gc199UpdateClock;
gc199UpdateClock=function(){
 _gc199UpdateClockGC200();if(!state)return;
 const f=clamp(Number(state.timeSystem.gc199DayProgress)||0,0,.9999),day=f<.5,phase=day?f*2:(f-.5)*2,bar=document.getElementById('gc199ClockBar');
 if(bar){
   const sun=bar.querySelector('[data-gc200-sun]'),moon=bar.querySelector('[data-gc200-moon]'),sky=bar.querySelector('[data-gc200-sky]'),label=bar.querySelector('[data-gc200-phase]');
   const left=5+phase*90,top=23-Math.sin(Math.PI*phase)*17;
   if(sun){sun.style.left=`${left}%`;sun.style.top=`${top}px`;sun.style.opacity=day?'1':'0'}
   if(moon){moon.style.left=`${left}%`;moon.style.top=`${top}px`;moon.style.opacity=day?'0':'1'}
   if(sky)sky.dataset.phase=day?'day':'night';if(label)label.textContent=day?'DAYLIGHT':'NIGHT';
 }
 gc200UpdateWorkUI();
};

function gc200TravelVisual(p){
 const combat=!!p?.expedition?.battle;
 return `<div class="gc200Travel ${combat?'combat':''}" aria-hidden="true"><div class="gc200TravelSky"><i></i><i></i><i></i></div><div class="gc200Ground"></div><svg viewBox="0 0 280 82" class="gc200Wagon" role="presentation"><g class="gc200Horse horseA"><ellipse cx="54" cy="43" rx="23" ry="12"/><circle cx="78" cy="31" r="9"/><path d="M72 25l3-10 5 9M84 27l8-8-2 11"/><path class="leg l1" d="M42 51l-8 22M54 52l-2 21M64 50l8 22M72 48l14 19"/></g><g class="gc200Horse horseB"><ellipse cx="108" cy="47" rx="23" ry="12"/><circle cx="132" cy="35" r="9"/><path d="M126 29l3-10 5 9M138 31l8-8-2 11"/><path class="leg l1" d="M96 55l-8 19M108 56l-2 18M118 54l8 20M126 52l14 17"/></g><path class="gc200Harness" d="M79 40L154 48M133 44L154 49"/><g class="gc200Cart"><path d="M153 33h82l15 30h-104z"/><path d="M166 32q25-30 53 0"/><circle class="wheel" cx="166" cy="66" r="12"/><circle class="wheel" cx="229" cy="66" r="12"/><path d="M166 54v24M154 66h24M229 54v24M217 66h24"/></g></svg><div class="gc200TravelCaption">${combat?'HOSTILE CONTACT':'ON THE ROAD'}</div></div>`;
}
const _expeditionCardGC200=expeditionCard;
expeditionCard=function(p){let html=_expeditionCardGC200(p);if(!p?.expedition)return html;return html.replace('<div class="gc193Timeline">',gc200TravelVisual(p)+'<div class="gc193Timeline">')};

function gc200WorkSnapshot(a){
 if(!a)return{label:'',detail:'',pct:0};const w=gc200Work(a),effects=gc193FacilityEffects(a.regionId),daySec=GC199_DAY_MS/1000;
 if(a.status==='Recovering'){const max=derived(a).maxHp,pct=(.12+(hq(a.regionId).upgrades.Infirmary||0)*.01+(effects.healPct||0))*max/daySec;return{label:'RECOVERING',detail:`+${pct.toFixed(2)} HP/s at x1`,pct:clamp((1-(w.recoveryLeft/Math.max(1,Number(a.recovery)||1)))*100,0,100)}}
 if(a.status!=='Ready')return{label:gc193OrderLabel(a).toUpperCase(),detail:'',pct:0};
 if(a.dailyOrder==='Train'){const rate=gc200TrainRate(a,effects);return{label:'TRAINING',detail:`+${(rate/daySec).toFixed(2)} XP/s at x1`,pct:clamp((Number(w.trainXP)||0)*100,0,100)}}
 if(a.dailyOrder==='Rest'){const max=derived(a).maxHp,rate=(.11+(hq(a.regionId).upgrades.Infirmary||0)*.01+(effects.healPct||0))*max/daySec;return{label:'RECOVERY',detail:`+${rate.toFixed(2)} HP/s at x1`,pct:max?clamp(a.hp/max*100,0,100):0}}
 if(a.dailyOrder==='Scout'){const c=gc200ScoutTarget(a);return{label:'SCOUTING',detail:c?`${c.title} • ${Math.round((w.scoutProgress||0)*100)}% to breakthrough`:'No contract needs intel',pct:clamp((w.scoutProgress||0)*100,0,100)}}
 if(a.dailyOrder==='Patrol'){const r=state.regions[a.regionId];return{label:'PATROLLING',detail:`${Math.round((r.gc200PatrolProgress||0)*100)}% to patrol cycle`,pct:clamp((r.gc200PatrolProgress||0)*100,0,100)}}
 if(a.dailyOrder==='Mentor'){const t=state.roster.find(x=>x.id===a.dailyMentorId);return{label:'MENTORING',detail:t?`${t.name} • progress accrues while they Train`:'Choose a trainee',pct:clamp((w.mentorXP||0)*100,0,100)}}
 if(a.dailyOrder==='Facility')return{label:(a.dailyFacility||'FACILITY').toUpperCase(),detail:'Effect is active continuously while assigned',pct:50};
 return{label:String(a.dailyOrder||'READY').toUpperCase(),detail:'',pct:0};
}
function gc200WorkHTML(a){const x=gc200WorkSnapshot(a);return `<div class="gc200WorkLive" data-gc200-work="${a.id}"><div><b>${esc(x.label)}</b><span>${esc(x.detail)}</span></div><i><em style="width:${x.pct}%"></em></i></div>`}
function gc200UpdateWorkUI(){
 if(!state)return;document.querySelectorAll('[data-gc200-work]').forEach(el=>{const a=state.roster.find(x=>x.id===el.dataset.gc200Work);if(!a)return;const x=gc200WorkSnapshot(a),b=el.querySelector('b'),s=el.querySelector('span'),em=el.querySelector('em');if(b)b.textContent=x.label;if(s)s.textContent=x.detail;if(em)em.style.width=`${x.pct}%`})
}
const _gc193OrderPanelGC200=gc193OrderPanel;
gc193OrderPanel=function(a){return _gc193OrderPanelGC200(a).replace(/DAILY ORDER/g,'ASSIGNMENT')+gc200WorkHTML(a)};
const _rosterCardGC200=rosterCard;
rosterCard=function(a){let html=_rosterCardGC200(a);return html.replace('<div class="tiny bl17SkillLine">',gc200WorkHTML(a)+'<div class="tiny bl17SkillLine">')};
const _gc193OrdersModalGC200=gc193OrdersModal;
gc193OrdersModal=function(){const out=_gc193OrdersModalGC200(),sheet=document.getElementById('sheet');if(sheet){sheet.innerHTML=sheet.innerHTML.replace(/Daily Orders/g,'Assignments').replace(/One persistent order per available adventurer/g,'Assignments work continuously while simulation time is running').replace(/Orders resolve automatically as active-play time passes\./g,'Assignments accumulate real progress every simulation tick. Changing an assignment preserves completed progress where it makes sense.')}return out};

/* Cache opening is now a short reward moment: latch/thunk, lid motion, light burst,
   particles, then the item card rises into view. All audio respects SFX settings. */
function gc200ChestSounds(){noise(.07,.12);simpleTone(105,.10,'square',.10,false);simpleTone(165,.08,'triangle',.09,false,.08)}
openCache=function(id){
 const c=state.caches.find(x=>x.id===id);if(!c)return;
 const item=generateItem(c.regionId,c.rarity);inventoryEntry(item,c.regionId,1);state.caches=state.caches.filter(x=>x.id!==id);save();gc199Pause('Opening recovered cache.',false);gc200ChestSounds();
 const stars=Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('');
 modal(`<div class="sheetHead"><div><h3>Recovered Cache</h3><div class="tiny muted">${esc(c.from||'Field recovery')}</div></div><button class="x" data-action="close">×</button></div><div class="gc200ChestScene opening" data-rarity="${item.rarity}"><div class="gc200Glow"></div><div class="gc200Particles">${stars}</div><div class="gc200Chest"><div class="gc200ChestLid"><span></span></div><div class="gc200ChestBody"><span></span></div></div></div><div class="gc200ChestReveal" id="gc200ChestReveal">${itemHTML(item)}<div class="notice">${RARITIES[item.rarity]} reward • ${item.mods.length} modifier${item.mods.length===1?'':'s'}</div></div>`);
 setTimeout(()=>{const reveal=document.getElementById('gc200ChestReveal');if(reveal){reveal.classList.add('shown');sfx('loot');simpleTone(1040,.16,'sine',.10,false,.08)}},520);
};

const _gc199TimeHelpGC200=gc199TimeHelp;
gc199TimeHelp=function(){
 modal(`<div class="sheetHead"><h3>How Time Works • v20.00</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>The simulation is tick-driven.</b> Midnight changes the date; it does not hand out a day's work.</div><div class="list"><div class="card"><b>▶ Play / ▶▶ Fast</b><div class="small muted">Training XP, recovery HP, scouting, patrols, mentoring, facilities, relationships and expedition travel all accumulate continuously. Fast multiplies those rates by ${GC199_FAST_MULT}.</div></div><div class="card"><b>Sun → Moon → New Day</b><div class="small muted">The sun crosses the clock during daylight, then the moon crosses during night. The meter below is the exact cycle progress.</div></div><div class="card"><b>Push Party</b><div class="small muted">Force roughly one field-day of progress immediately. It retains the extra encounter risk and attrition cost.</div></div><div class="card"><b>No offline progress</b><div class="small muted">Backgrounding or closing the game pauses the company.</div></div></div>`);
};

const _auditGC200=audit;
audit=function(){const out=_auditGC200();out.helloWorld=GC200_VERSION;out.tickDrivenWork=true;out.calendarOnlyMidnight=true;out.tickDrivenEncounterHazard=true;out.sunMoonClock=true;out.expeditionTravelAnimation=true;out.chestOpeningFeedback=true;out.legacyAutoExpeditionDisabled=true;return out};
window.__BL_AUDIT=audit;