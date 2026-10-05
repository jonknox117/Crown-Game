/* Broken Lantern v19 — Presentation & Polish.
   Visual systems consume real game state only. No decorative fake mechanics. */
const BL19_VERSION='19.0';

function bl19Svg(body,cls='',label=''){
 return `<svg class="bl19svg ${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}>${body}</svg>`;
}
function bl19Icon(kind,cls=''){
 const p={
  bond:'<path d="M29 56a17 17 0 1 1 14-28M57 28a17 17 0 1 1 14 28M39 42h22"/>',
  rival:'<path d="M22 20l25 25M78 20L53 45M34 32L16 78M66 32l18 46M20 72h22M58 72h22"/>',
  mentor:'<path d="M50 12v48M35 31l15-19 15 19M24 70h52M31 70v18M69 70v18"/>',
  fear:'<path d="M14 50q36-34 72 0-36 34-72 0zM50 35a15 15 0 1 1 0 30M50 42v16"/>',
  monster:'<path d="M22 76l7-43 15 10 6-24 7 24 15-10 7 43-19-8-10 17-10-17z"/>',
  crown:'<path d="M17 72l6-40 20 17L50 21l7 28 20-17 6 40zM24 80h52"/>',
  captain:'<path d="M21 80V18l42 10-21 14 21 14-42 9M21 80h24"/>',
  death:'<circle cx="50" cy="42" r="24"/><path d="M32 38h11M57 38h11M43 55h14M35 67v19M50 67v19M65 67v19"/>',
  hq:'<path d="M14 82V38l15-14 12 12 9-20 9 20 12-12 15 14v44M31 82V60h38v22M45 82V68h10v14"/>',
  history:'<path d="M25 16h48v68H25zM34 31h30M34 44h30M34 57h22M18 24h7M18 40h7M18 56h7M18 72h7"/>',
  loot:'<path d="M16 39h68v43H16zM22 39q3-23 28-23t28 23M16 52h68M44 49h12v18H44z"/>',
  check:'<path d="M17 52l19 19 47-48"/>',
  warning:'<path d="M50 13l39 70H11zM50 35v25M50 70v3"/>',
  sword:'<path d="M24 76L72 28M62 20l18-7-7 18M18 62l20 20M20 84l-4-4 12-12"/>',
  shield:'<path d="M50 12l31 11v26q0 28-31 40Q19 77 19 49V23z"/>',
  bow:'<path d="M28 15q44 35 0 70M30 15l27 35-27 35M17 50h60"/>',
  staff:'<path d="M47 18h6v70h-6zM30 28q20-28 40 0-20 18-40 0zM31 70l-12 18M69 70l12 18"/>',
  claw:'<path d="M20 74q7-36 23-54M42 78q4-39 15-59M62 78q1-33 17-50"/>',
  road:'<path d="M37 89L47 11M63 89L53 11M46 31h8M43 53h14M40 75h20"/>'
 }[kind]||'<circle cx="50" cy="50" r="28"/>';
 return bl19Svg(`<g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${p}</g>`,`bl19MiniIcon ${cls}`);
}
function bl19Badge(kind,text,tone=''){
 return `<span class="bl19Badge ${tone}">${bl19Icon(kind)}<span>${esc(text)}</span></span>`;
}

const BL19_REL_ICON={
 'Blood-Bound':['bond','Blood-Bound','good'],
 'Trusted Friends':['bond','Trusted','good'],
 'Friends':['bond','Friends','good'],
 'Mentor & Protégé':['mentor','Mentor/Protégé','good'],
 'Respected Companions':['check','Respected','neutral'],
 'Professional Rivals':['rival','Rivals','neutral'],
 'Grudge':['rival','Grudge','bad'],
 'Bitter Enemies':['rival','Enemies','bad'],
 'Dislike':['warning','Dislike','bad']
};
function bl19ExistingRelation(a,b){
 const lv=state?.livingVeterans,rec=lv?.relationships?.[bl18PairKey(a.id,b.id)];
 return rec?bl18RelationStage(rec,a,b):'Acquaintances';
}
function bl19StrongestRelation(a,partyOnly=false){
 const ids=partyOnly?new Set(state.parties.flatMap(p=>p.members||[])):null;
 const weight={'Blood-Bound':9,'Bitter Enemies':8,'Trusted Friends':7,'Professional Rivals':6,'Mentor & Protégé':6,'Grudge':5,'Friends':4,'Respected Companions':3,'Dislike':2,'Acquaintances':0};
 let best=null;
 state.roster.forEach(b=>{
   if(b.id===a.id||b.status==='Dead'||(ids&&!ids.has(b.id)))return;
   const stage=bl19ExistingRelation(a,b),w=weight[stage]||0;
   if(w&&(!best||w>best.w))best={b,stage,w};
 });
 return best;
}
function bl19TopMastery(a){
 const rows=Object.entries(bl18InitAdventurer(a).veteran.monsters||{}).map(([family,m])=>({family,m,rank:bl18MonsterRank(m)})).filter(x=>x.rank>0).sort((x,y)=>y.rank-x.rank||y.m.xp-x.m.xp);
 return rows[0]||null;
}
function bl19WorstFear(a){
 const rows=Object.entries(bl18InitAdventurer(a).veteran.fears||{}).map(([family,f])=>({family,f,stage:bl18FearStage(f)})).filter(x=>x.stage>0).sort((x,y)=>y.stage-x.stage||y.f.trauma-x.f.trauma);
 return rows[0]||null;
}
function bl19VeteranBadges(a,limit=4){
 const out=[];
 const captain=state.parties.some(p=>p.captainId===a.id);
 if(captain)out.push(bl19Badge('captain','Captain','gold'));
 const rel=bl19StrongestRelation(a);
 if(rel&&BL19_REL_ICON[rel.stage])out.push(bl19Badge(...BL19_REL_ICON[rel.stage]));
 const m=bl19TopMastery(a);
 if(m)out.push(bl19Badge('monster',`${m.family} ${BL18_MONSTER_RANKS[m.rank].name}`,m.rank>=3?'gold':'neutral'));
 const f=bl19WorstFear(a);
 if(f)out.push(bl19Badge('fear',bl18FearName(f.f,f.family),'bad'));
 const t=(a.veteran?.developedTraits||[])[0];
 if(t&&out.length<limit)out.push(bl19Badge('check',t,'neutral'));
 return out.slice(0,limit).join('');
}

rosterCard=function(a){
 const d=derived(a),pct=clamp(a.hp/d.maxHp*100,0,100),skills=bl17Skills(a),badges=bl19VeteranBadges(a);
 return `<button class="card member blMember bl17CareerCard bl19VeteranCard rank-${a.careerRank}" data-action="inspect" data-id="${a.id}">
  <div class="portrait blPortraitFrame">${blPortraitHTML(a)}</div>
  <div class="bl19VeteranBody">
   <div class="statline"><h4>${bl17Name(a)}</h4><span>Lv.${a.lvl}</span></div>
   <div class="small muted">${esc(a.race)} • <b class="gold">${esc(a.culture)} ${esc(a.className)}</b> ${bl17RarityBadge(a)}</div>
   <div class="tiny muted">${esc(a.background)} • ${esc(a.status)} • ${a.hp}/${d.maxHp} HP • ${a.missions||0} contracts</div>
   <div class="hpbar"><i style="width:${pct}%"></i></div>
   ${badges?`<div class="bl19BadgeRow">${badges}</div>`:''}
   <div class="tiny bl17SkillLine">${skills.map(s=>`${esc(s.name)} ${bl17TierRoman(s.tier)}`).join(' • ')}</div>
  </div><span class="tiny bl19Chevron">›</span>
 </button>`;
};

function bl19RoleKind(role=''){
 if(role==='Archer')return'bow';
 if(role==='Shield')return'shield';
 if(role==='Shaman')return'staff';
 if(role==='Stalker')return'claw';
 if(role==='Brute')return'sword';
 return'road';
}
function bl19EnemyArt(u,cls=''){
 const role=u?.role||'';
 return `<span class="bl19EnemyArt ${u?.legendary?'legendary':''} ${cls}">${bl17EnemySvg(u)}${role?`<span class="bl19RoleMark" title="${esc(role)}">${bl19Icon(bl19RoleKind(role))}</span><span class="bl19EnemyRole">${esc(role)}</span>`:''}</span>`;
}
function bl19CurrentFamilies(b){return b?((b._v18Families&&b._v18Families.length)?b._v18Families:bl18BattleFamilies(b)):[]}
function bl19UnitStateBadges(a,b,allies){
 if(!a)return'';
 const chips=[];
 const fams=bl19CurrentFamilies(b);
 let best=null,worst=null;
 fams.forEach(f=>{
   const m=bl18Monster(a,f),rank=bl18MonsterRank(m);if(rank&&(!best||rank>best.rank))best={f,rank};
   const fr=bl18Fear(a,f),stage=bl18FearStage(fr);if(stage&&(!worst||stage>worst.stage))worst={f,fr,stage};
 });
 if(best)chips.push(bl19Badge('monster',BL18_MONSTER_RANKS[best.rank].name,best.rank>=3?'gold':'neutral'));
 if(worst)chips.push(bl19Badge('fear',worst.stage===3?'Phobia':'Fear','bad'));
 let relBest=null;
 (allies||[]).forEach(u=>{
   if(!u.charId||u.charId===a.id)return;const other=state.roster.find(x=>x.id===u.charId);if(!other)return;
   const s=bl19ExistingRelation(a,other),w={'Blood-Bound':9,'Bitter Enemies':8,'Trusted Friends':7,'Professional Rivals':6,'Mentor & Protégé':6,'Grudge':5,'Friends':4}[s]||0;
   if(w&&(!relBest||w>relBest.w))relBest={s,w};
 });
 if(relBest&&BL19_REL_ICON[relBest.s])chips.push(bl19Badge(...BL19_REL_ICON[relBest.s]));
 return chips.slice(0,2).join('');
}
function bl19CombatUnit(u,side,b){
 const hp=clamp(u.hp/u.maxHp*100,0,100),dead=u.hp<=0;
 if(side==='ally'){
   const a=state.roster.find(x=>x.id===u.charId),form=bl14Formation(u),badges=a?bl19UnitStateBadges(a,b,b.allies):'';
   return `<div class="bl19BattleUnit ally ${dead?'dead':''} form-${form.toLowerCase()} ${u.legendary?'legendary':''}" data-unit="${esc(u.charId||'')}">
    <div class="bl19UnitPortrait">${a?blPortraitHTML(a,'blCombatPortrait'):bl17RaceMini(u.race||'Human')}</div>
    <div class="bl19UnitName">${esc(u.name)}</div><div class="bl19UnitSub">${esc(u.className||form)} • ${form}</div>
    <div class="bl19UnitHP"><i style="width:${hp}%"></i></div><div class="bl19UnitHPText">${Math.max(0,Math.round(u.hp))}/${u.maxHp}</div>
    ${badges?`<div class="bl19CombatBadges">${badges}</div>`:''}
   </div>`;
 }
 return `<div class="bl19BattleUnit enemy ${dead?'dead':''} role-${String(u.role||'').toLowerCase()} ${u.legendary?'legendary':''}" data-unit="${esc(u.id||'')}">
  <div class="bl19UnitPortrait enemy">${bl19EnemyArt(u)}</div>
  <div class="bl19UnitName">${esc(u.name)}</div><div class="bl19UnitSub">${esc(u.species||'Enemy')} • ${esc(u.role||'Fighter')}</div>
  <div class="bl19UnitHP enemy"><i style="width:${hp}%"></i></div><div class="bl19UnitHPText">${Math.max(0,Math.round(u.hp))}/${u.maxHp}</div>
 </div>`;
}
function bl19PushFx(b,fx){
 if(!b||!fx)return;b._v19Fx=b._v19Fx||[];b._v19Fx.push({...fx,id:uid('fx')});if(b._v19Fx.length>4)b._v19Fx.splice(0,b._v19Fx.length-4);
}
function bl19FxHTML(b){
 const fx=(b?._v19Fx||[]).slice(-3);
 if(!fx.length)return'';
 return `<div class="bl19FxRail">${fx.map(x=>`<div class="bl19Fx ${esc(x.kind||'hit')}"><b>${esc(x.label||'')}</b>${x.detail?`<span>${esc(x.detail)}</span>`:''}</div>`).join('')}</div>`;
}

const _allyAttackV19=allyAttack;
allyAttack=function(actor,target,p){
 const b=p?.expedition?.battle,before=target?.hp||0,logBefore=b?.log?.length||0;
 const out=_allyAttackV19(actor,target,p);
 if(b&&target&&target.hp<before){
   const dmg=Math.max(0,Math.round(before-target.hp));
   const critical=(b.log||[]).slice(logBefore).some(x=>/critical strike/i.test(x));
   bl19PushFx(b,{kind:target.hp<=0?'kill':critical?'crit':'hit',label:target.hp<=0?'ENEMY DOWN':critical?'CRITICAL STRIKE':'HIT',detail:`${actor.name} → ${target.name} • ${dmg}`});
 }
 return out;
};
const _enemyAttackV19=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=p?.expedition?.battle,snap=new Map((b?.allies||[]).map(u=>[u.charId,u.hp])),logBefore=b?.log?.length||0;
 const out=_enemyAttackV19(actor,target,p);
 if(b){
   const hit=(b.allies||[]).find(u=>u.hp<(snap.get(u.charId)??u.hp));
   const logs=(b.log||[]).slice(logBefore),intercept=logs.find(x=>/intercepts/i.test(x));
   if(intercept)bl19PushFx(b,{kind:'intercept',label:'PROTECTIVE INTERCEPT',detail:intercept});
   if(hit){const dmg=Math.max(0,Math.round((snap.get(hit.charId)||hit.hp)-hit.hp));bl19PushFx(b,{kind:hit.hp<=0?'down':'hurt',label:hit.hp<=0?'ADVENTURER DOWN':'WOUNDED',detail:`${actor.name} → ${hit.name} • ${dmg}`});}
 }
 return out;
};
const _supportActionV19=supportAction;
supportAction=function(actor,p){
 const b=p?.expedition?.battle,snap=new Map((b?.allies||[]).map(u=>[u.charId,u.hp]));
 const out=_supportActionV19(actor,p);
 if(out&&b){const healed=(b.allies||[]).find(u=>u.hp>(snap.get(u.charId)??u.hp));if(healed){const n=Math.round(healed.hp-(snap.get(healed.charId)||0));bl19PushFx(b,{kind:'heal',label:'SUPPORT',detail:`${actor.name} steadies ${healed.name} • +${n} HP`});}}
 return out;
};

battleHTML=function(b){
 const p=state.parties.find(x=>x.expedition?.battle===b),assessment=p?bl14BattleAssessment(p,b):null;
 return `<div class="bl19Battlefield ${b.enemies.some(x=>x.legendary)?'hasLegendary':''}">
  <div class="bl19BattleBackdrop">${bl17RegionScene(p?.regionId||state.currentRegion)}</div>
  <div class="bl19BattleHeader"><div><b>ROUND ${b.round||0}</b><span>${b.first==='party'?'Your party seized the opening':'Enemy pressure seized the opening'}</span></div>${assessment?`<div class="bl19Assessment ${assessment.label.toLowerCase()}">${assessment.label}<small>${assessment.ratio.toFixed(2)}×</small></div>`:''}</div>
  ${bl19FxHTML(b)}
  <div class="bl19FormationLabel enemy">ENEMY FORMATION</div><div class="bl19Formation enemy">${b.enemies.map(u=>bl19CombatUnit(u,'enemy',b)).join('')}</div>
  <div class="bl19Versus"><span></span><b>VS</b><span></span></div>
  <div class="bl19FormationLabel ally">YOUR COMPANY</div><div class="bl19Formation ally">${b.allies.map(u=>bl19CombatUnit(u,'ally',b)).join('')}</div>
 </div>`;
};

function bl19ContractTypeIcon(type){
 const kind={Hunt:'claw',Rescue:'bond',Escort:'road',Defense:'shield',Retrieval:'loot',Investigation:'history',Extermination:'sword',Negotiation:'bond',Exploration:'road',Siege:'hq',Assassination:'sword',Caravan:'road'}[type]||'history';
 return bl19Icon(kind,'bl19ContractTypeIcon');
}
function bl19CompanyExperience(c){
 const family=bl18Family(c.species),people=state.roster.filter(a=>a.regionId===c.regionId&&a.status!=='Dead');
 const ranks=people.map(a=>bl18MonsterRank(a.veteran?.monsters?.[family]));
 const counts=[0,0,0,0,0];ranks.forEach(r=>counts[r]++);
 const parts=[];for(let r=4;r>=1;r--)if(counts[r])parts.push(`${counts[r]} ${BL18_MONSTER_RANKS[r].name}`);
 const afraid=people.filter(a=>bl18FearStage(a.veteran?.fears?.[family])>0).length;
 return {family,text:parts.length?parts.slice(0,2).join(' • '):'No specialists yet',afraid};
}
contractCard=function(c){
 const nem=c.nemesisId?state.nemeses.find(n=>n.id===c.nemesisId&&n.alive):null,exp=bl19CompanyExperience(c),legendary=!!c.legendarySpecies||/^LEGENDARY/i.test(c.title||''),recommended=c.recommended||[2,3,4,5,7][Math.max(0,(c.risk||1)-1)];
 return `<div class="card contract bl19Contract ${nem?'boss':''} ${legendary?'legendary':''}">
  <div class="bl19ContractVisual"><div class="bl19ContractScene">${bl17RegionScene(c.regionId)}</div><div class="bl19ContractEnemy">${bl19EnemyArt({species:c.legendarySpecies||c.species,legendary,role:nem?'Brute':''})}</div><div class="bl19ContractStamp">${bl19ContractTypeIcon(c.type)}<span>${esc(c.type)}</span></div>${legendary?'<div class="bl19LegendaryRibbon">LEGENDARY THREAT</div>':''}</div>
  <div class="bl19ContractBody"><div class="statline"><h4>${esc(c.title)}</h4><span class="riskDots">${'●'.repeat(c.risk)}${'○'.repeat(5-c.risk)}</span></div>
  <div class="bl19BadgeRow">${bl19Badge('monster',exp.family,'neutral')}${bl19Badge('captain',`Party ${recommended}+`,'neutral')}${exp.afraid?bl19Badge('fear',`${exp.afraid} fearful`,'bad'):''}</div>
  <p class="small">${esc(c.desc)}</p>
  <div class="bl19ContractStats"><div><span>REWARD</span><b>${money(c.reward)}</b></div><div><span>FIELD CHECK</span><b>${esc(String(c.check).toUpperCase())}</b></div><div><span>CACHE</span><b>${Math.round((c.cacheChance||0)*100)}%</b></div><div><span>UNKNOWN</span><b>${c.unknown}</b></div></div>
  <div class="bl19Expertise"><span>Company experience</span><b>${esc(exp.text)}</b></div>
  ${nem?`<div class="notice danger"><b>Named enemy:</b> ${esc(nem.name)} • Level ${nem.level}</div>`:''}
  <div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn primary" data-action="chooseParty" data-id="${c.id}">Send Party</button></div></div>
 </div>`;
};

function bl19FacilityShape(regionId,x,y,w,h,lv,name){
 const active=lv>0,op=active?1:.20,raise=Math.min(16,lv*3),yy=y-raise,hh=h+raise;
 let roof='';
 if(regionId==='hoshin')roof=`<path d="M${x-3} ${yy+8} Q${x+w/2} ${yy-8} ${x+w+3} ${yy+8} L${x+w-2} ${yy+14} Q${x+w/2} ${yy+3} ${x+2} ${yy+14}Z"/>`;
 else if(regionId==='nambara')roof=`<path d="M${x-2} ${yy+5}H${x+w+2}V${yy+12}H${x-2}Z"/>`;
 else if(regionId==='firmament')roof=`<path d="M${x+w/2} ${yy-9}L${x+w+6} ${yy+11}H${x-6}Z"/><path d="M${x+3} ${y+hh+4}L${x+w/2} ${y+hh+13}L${x+w-3} ${y+hh+4}"/>`;
 else if(regionId==='skeld')roof=`<path d="M${x-4} ${yy+13}L${x+w/2} ${yy-4}L${x+w+4} ${yy+13}Z"/>`;
 else roof=`<path d="M${x-4} ${yy+12}L${x+w/2} ${yy-5}L${x+w+4} ${yy+12}Z"/>`;
 let dots='';for(let i=0;i<Math.min(lv,5);i++)dots+=`<circle cx="${x+5+i*5}" cy="${y+hh-4}" r="1.5"/>`;
 return `<g class="bl19Facility ${active?'active':'inactive'}" opacity="${op}">${roof}<rect x="${x}" y="${yy+11}" width="${w}" height="${hh-11}" rx="2"/><rect class="door" x="${x+w/2-3}" y="${y+hh-14}" width="6" height="14"/>${dots}<text x="${x+w/2}" y="${y+hh+12}" text-anchor="middle">${esc(name)}</text></g>`;
}
function bl19HQScene(){
 const id=state.currentRegion,up=hq(id).upgrades||{},defs=[['Barracks',15,73,48,50],['Infirmary',78,83,42,40],['Armory',134,74,48,49],['Command Hall',195,58,62,65],['Occult Archive',271,77,44,46],['Salvager’s Lodge',328,85,50,38]];
 const total=Object.values(up).reduce((s,v)=>s+(Number(v)||0),0),active=Object.values(up).filter(v=>Number(v)>0).length;
 return `<div class="bl19HQScene"><div class="bl19HQBackdrop">${bl17RegionScene(id)}</div><svg viewBox="0 0 400 155" aria-label="${esc(hq(id).name)} visual headquarters"><g class="bl19Ground"><path d="M0 120Q100 103 200 119T400 113V155H0Z"/></g>${defs.map(([k,x,y,w,h])=>bl19FacilityShape(id,x,y,w,h,up[k]||0,k.replace('Occult Archive','Archive').replace('Salvager’s Lodge','Salvager'))).join('')}</svg><div class="bl19HQCaption"><div><b>${esc(hq(id).name)}</b><span>${active} active facilities • ${total} total upgrade levels</span></div><span class="bl19HQSeal">${bl19Icon('hq')} HQ</span></div></div>`;
}
const _renderHQV19=renderHQ;
renderHQ=function(){return bl19HQScene()+_renderHQV19()};

function bl19MapNode(id){
 const r=state.regions[id],d=REGION_DEFS[id],current=id===state.currentRegion,legendary=(r.contracts||[]).some(c=>c.legendarySpecies||/^LEGENDARY/i.test(c.title||''));
 return `<button class="bl19MapNode ${current?'current':''} ${r.lost?'lost':''}" data-action="regionInfo" data-id="${id}"><div class="bl19MapArt">${bl17RegionScene(id)}</div><div class="bl19MapBody"><div><b>${esc(d.name)}</b><span>${r.hq.established?'HQ ACTIVE':'NO HQ'} • ${r.settlements}/${r.totalSettlements} settlements</span></div><div class="bl19MapThreat ${r.threat>=82?'critical':r.threat>=60?'high':''}"><small>THREAT</small><b>${Math.round(r.threat)}</b></div></div><div class="bl19MapMeters"><i class="stability" style="width:${r.stability}%"></i><i class="threat" style="width:${r.threat}%"></i></div>${legendary?'<span class="bl19ApexMarker">APEX REPORTED</span>':''}</button>`;
}
renderWorld=function(){
 return `<div class="hero"><div class="kicker">COMPANY NETWORK</div><h2>The world changes while you work.</h2><p>Every light, threat marker, settlement count and HQ shown here comes from the regional simulation.</p></div><div class="sectionTitle"><h3>Campaign Map</h3><span>${REGION_ORDER.filter(id=>hq(id).established).length}/5 HQs established</span></div><div class="bl19WorldMap">${REGION_ORDER.map(bl19MapNode).join('')}</div><div class="sectionTitle"><h3>Regional Detail</h3><span>markets • recruitment • threat</span></div><div class="list">${REGION_ORDER.map(regionCard).join('')}</div>`;
};

const _itemHTMLV19=itemHTML;
itemHTML=function(item){return _itemHTMLV19(item).replace('bl17ItemCard','bl17ItemCard bl19ItemCard')};
const _openCacheV19=openCache;
openCache=function(id){
 const cache=state.caches.find(x=>x.id===id),rarity=cache?.rarity||0,name=cache?.name||'Field Cache';
 const out=_openCacheV19(id);
 requestAnimationFrame(()=>{const sheet=document.getElementById('sheet');if(!sheet)return;sheet.classList.add('bl19LootReveal');sheet.insertAdjacentHTML('afterbegin',`<div class="bl19LootSeal rarity-${rarity+1}">${bl17CacheSvg(rarity)}<div><span>RECOVERED CACHE</span><b>${esc(name)}</b></div></div>`);const card=sheet.querySelector('.bl19ItemCard');if(card)card.classList.add('revealed')});
 return out;
};
const _showReportV19=showReport;
showReport=function(r){
 const out=_showReportV19(r);
 const sheet=document.getElementById('sheet');if(sheet){sheet.classList.add('bl19MissionReport');sheet.insertAdjacentHTML('afterbegin',`<div class="bl19ReportScene ${r.win?'win':'loss'}"><div>${bl17RegionScene(r.regionId||state.currentRegion)}</div><span>${r.win?bl19Icon('check'):bl19Icon('warning')}<b>${r.win?'CONTRACT COMPLETE':'CONTRACT FAILED'}</b></span></div>`);sheet.querySelectorAll('.bl19ItemCard').forEach(x=>x.classList.add('revealed'));}
 return out;
};

function bl19ChronIcon(kind,text=''){
 if(kind==='death'||/died|killed/i.test(text))return'death';
 if(kind==='hq'||/upgraded|founded|established/i.test(text))return'hq';
 if(kind==='founding')return'crown';
 if(/legendary|slain|dragon|jötunn|ryū|storm bird|seraph/i.test(text))return'monster';
 return'history';
}
bl18ChronicleModal=function(){
 const lv=bl18State(),events=lv.chronicle.slice().reverse(),fallen=lv.fallen.slice().reverse(),apex=events.filter(e=>/legendary|slain|dragon|jötunn|ryū|storm bird|seraph/i.test(e.text)).length;
 modal(`<div class="sheetHead"><div><h3>${bl19Icon('history')} Company Chronicle</h3><div class="tiny muted">What the Broken Lantern remembers</div></div><button class="x" data-action="close">×</button></div>
 <div class="bl19ChronStats"><div><span>MAJOR EVENTS</span><b>${events.length}</b></div><div><span>FALLEN</span><b>${fallen.length}</b></div><div><span>APEX DEEDS</span><b>${apex}</b></div><div><span>COMPANY DAY</span><b>${state.company.day}</b></div></div>
 <div class="sectionTitle"><h3>Chronicle</h3><span>newest first</span></div><div class="bl19Chronicle">${events.length?events.map(e=>`<div class="bl19ChronEntry ${esc(e.kind||'major')}"><div class="bl19ChronIcon">${bl19Icon(bl19ChronIcon(e.kind,e.text))}</div><div><span>DAY ${e.day}</span><b>${esc(e.text)}</b></div></div>`).join(''):'<div class="empty">No major events have entered the chronicle yet.</div>'}</div>
 <div class="sectionTitle"><h3>Memorial Wall</h3><span>${fallen.length} names</span></div><div class="bl19MemorialWall">${fallen.length?fallen.map(f=>{const a=state.roster.find(x=>x.id===f.id);return`<div class="bl19MemorialCard"><div class="bl19MemorialPortrait">${a?blPortraitHTML(a,'blFacePortrait'):bl19Icon('death')}</div><div><b>${esc(f.name)}${f.nickname?` “${esc(f.nickname)}”`:''}</b><span>${esc(f.culture)} ${esc(f.className)} • Lv.${f.lvl} • ${esc(f.careerRarity)}</span><small>${f.missions} contracts • ${f.kills} kills</small><small class="danger">${esc(f.cause)} • Day ${f.day}</small>${f.mastery?.length?`<div class="bl19BadgeRow">${f.mastery.slice(0,2).map(m=>bl19Badge('monster',`${m.family} ${m.rank}`,'neutral')).join('')}</div>`:''}</div></div>`}).join(''):'<div class="empty">No names on the memorial wall.</div>'}</div>`);
 const sheet=document.getElementById('sheet');if(sheet)sheet.classList.add('bl19ChronicleSheet');
};

const _renderInspectV19=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectV19(id,recruit);
 if(!recruit){const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');if(a&&sheet){const head=sheet.querySelector('.sheetHead');if(head)head.insertAdjacentHTML('afterend',`<div class="bl19InspectBanner rank-${bl17EnsureCareer(a)}"><div class="bl19InspectPortrait">${blPortraitHTML(a)}</div><div><span>${esc(a.culture)} ${esc(a.className)}</span><b>${bl17Name(a)}</b><div class="bl19BadgeRow">${bl19VeteranBadges(a,5)}</div></div></div>`)}}
 return out;
};

const _renderV19=render;
render=function(){
 const out=_renderV19();
 if(state){document.body.dataset.v19='1';document.body.dataset.region=state.currentRegion;requestAnimationFrame(()=>document.querySelectorAll('.screen>.card,.screen>.sectionTitle,.screen>.list>.card,.bl19WorldMap,.bl19HQScene').forEach((el,i)=>{el.style.setProperty('--bl19-order',String(Math.min(i,10)));el.classList.add('bl19Enter')}));}
 return out;
};

const _auditV19=audit;
audit=function(){const out=_auditV19();out.v19Presentation=BL19_VERSION;out.v19Battlefield=true;out.v19StateDrivenBadges=true;out.v19HQGrowthScene=true;out.v19ContractPresentation=true;out.v19WorldMap=true;out.v19LootPresentation=true;out.v19ChroniclePresentation=true;out.v19FakeVisualMechanics=false;return out};
window.__BL_AUDIT=audit;