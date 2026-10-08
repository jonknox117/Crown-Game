/* Broken Lantern v21.8.1 — seven new vector stages and scene routing.
   Presentation only. Neither the simulation nor save state is migrated. */
const GC381_VERSION='21.8.1';
const GC381_SCENES={
 chapterhouse:{file:'chapterhouse-grand.svg',focus:'50% 43%',alt:'A busy torchlit Gothic adventurers guild, with stone vaults, banners and a great hearth.'},
 market:{file:'market-grand.svg',focus:'50% 48%',alt:'An evening medieval market, cloth awnings, merchants, lanterns and stone towers.'},
 musterYard:{file:'muster-yard-grand.svg',focus:'50% 53%',alt:'A fortified training courtyard, sparring soldiers, wooden practice dummies and weapon racks.'},
 marchWatch:{file:'march-watch-grand.svg',focus:'57% 50%',alt:'A high stone watchtower overlooking forests and mountains, with a blazing beacon.'},
 pilgrimHouse:{file:'pilgrim-house-grand.svg',focus:'50% 46%',alt:'A quiet Gothic infirmary and shrine with stained-glass windows, healing beds and candles.'},
 jobsBoard:{file:'jobs-board-grand.svg',focus:'50% 47%',alt:'A grand guild contract board covered in parchment, wax seals and maps.'},
 armory:{file:'armory-grand.svg',focus:'50% 53%',alt:'A stone armory with swords, axes, shields, armor stands and a glowing forge.'},
 worldMap:{file:'world-map-grand.svg',focus:'50% 44%',alt:'A detailed hand-drawn fantasy world map laid out on a medieval command table.'}
};
const GC381_PLACE_SCENES={hall:'chapterhouse',odd:'market',train:'musterYard',scout:'marchWatch',recover:'pilgrimHouse'};
function gc381ResolveScene(){
 if(!state||!gc260Founder())return null;
 const free=gc270IsFreeblade(),tab=state.ui?.tab||'you',regionId=state.currentRegion||'veyric';
 const pr=gc340SyncPresence(),rid=pr?.regionId||regionId;
 if((tab==='you'||(!free&&tab==='gear'))&&pr?.mode==='town'){
  const id=GC381_PLACE_SCENES[pr.place]||'chapterhouse',place=GC340_TOWNS[rid]?.[pr.place];
  return{id,regionId:rid,place:pr.place,label:'YOU • '+(pr.place==='hall'?'AT THE CHAPTERHOUSE':'AT '+String(place?.name||pr.place).toUpperCase()),title:place?.name||'Chapterhouse'};
 }
 if(['jobs','contracts'].includes(tab))return{id:'jobsBoard',regionId,label:'JOBS • AVAILABLE WORK',title:free?'The Contract Board':'Company Contracts'};
 if(tab==='gear')return{id:'armory',regionId,label:'GEAR • EQUIPMENT',title:'Armory & Loadout'};
 if(['world','region'].includes(tab))return{id:'worldMap',regionId,label:'WORLD • REGIONS',title:'The Known World'};
 if(tab==='company'){
  const sub=state.ui?.gc330CompanySub||'overview';
  if(sub==='parties')return{id:'musterYard',regionId,label:'COMPANY • FIELD FORMATIONS',title:'Company Muster'};
  return{id:'chapterhouse',regionId,label:sub==='hq'?'HEADQUARTERS • OPERATIONS':sub==='people'?'COMPANY • ROSTER':'COMPANY • HOME',title:state.regions[regionId]?.hq?.name||GC340_TOWNS[regionId]?.hall?.name||'Chapterhouse'};
 }
 return null;
}
gc380SceneState=function(){
 const r=gc381ResolveScene();
 return r?{...r,scene:r.id,context:r.label}:null;
};
gc380VisibleData=function(scene=gc380SceneState()){
 if(!scene)return null;
 const r=state.regions[scene.regionId],d=REGION_DEFS[scene.regionId];
 const roster=state.roster.filter(a=>a.regionId===scene.regionId&&a.status!=='Dead').length;
 const field=state.parties.filter(p=>p.regionId===scene.regionId&&p.expedition).length;
 return{
  stage:scene.id,title:scene.title||'Chapterhouse',region:d?.name||scene.regionId,
  label:scene.label||scene.context||'',day:Math.floor(Number(state.company.day)||1),
  detail:roster+' adventurer'+(roster===1?'':'s')+' • '+field+' in the field'
 };
};
gc380StageHTML=function(scene){
 const d=gc380VisibleData(scene),cfg=GC381_SCENES[scene.id];
 if(!d||!cfg)return'';
 const folded=!!state.ui?.gc380StageFolded,url='../art/'+cfg.file;
 return '<section class="gc380Stage gc381Stage '+(folded?'gc380Folded':'')+'" data-gc380-stage="'+d.stage+'" data-gc381-art="'+cfg.file+'" aria-label="'+esc(d.title)+' illustrated scene">'+
 '<div class="gc380Illustration"><img class="gc380Artwork" src="'+url+'" width="1200" height="820" style="object-position:'+cfg.focus+'" alt="'+esc(cfg.alt)+'" decoding="async" loading="eager"/></div>'+
 '<div class="gc380Tone" aria-hidden="true"></div>'+
 '<div class="gc380SceneHeading"><span class="gc380Eyebrow" data-gc380-label>'+esc(d.label)+'</span><h2 data-gc380-title>'+esc(d.title)+'</h2>'+
 '<div class="gc380Info" data-gc380-info>'+esc(d.region)+' • Day '+d.day+' • '+esc(d.detail)+'</div></div>'+
 '<div class="gc380Frame"><span class="gc380Line" aria-hidden="true"></span>'+
 '<button class="gc380Fold" type="button" data-action="gc380ToggleStage" aria-label="'+(folded?'Expand illustrated scene':'Minimize illustrated scene')+'" aria-pressed="'+(folded?'true':'false')+'">'+
 '<span class="gc380FoldGlyph" aria-hidden="true">'+(folded?'＋':'−')+'</span><span>'+(folded?'EXPAND SCENE':'SHOW CONTROLS')+'</span></button></div>'+
 '<span class="gc380ArtCredit">ORIGINAL VECTOR ENVIRONMENT</span></section>';
};
gc380MountStage=function(){
 if(!state)return false;
 const host=gc380SceneHost(),scene=gc380SceneState();
 if(!host)return false;
 const existing=host.querySelector(':scope > .gc380Stage');
 if(!scene){if(existing){existing.remove();GC380_STATS.sceneChanges++}return false}
 const cfg=GC381_SCENES[scene.id];
 if(!cfg)return false;
 if(existing&&existing.dataset.gc380Stage===scene.id&&existing.dataset.gc381Art===cfg.file){
  gc380PatchStage();return true;
 }
 if(existing)existing.remove();
 host.insertAdjacentHTML('afterbegin',gc380StageHTML(scene));
 GC380_STATS.mounts++;GC380_STATS.sceneChanges++;
 return true;
};
gc380PatchStage=function(){
 const stage=document.querySelector('#app .gc380Stage'),scene=gc380SceneState();
 if(!stage||!scene)return false;
 if(stage.dataset.gc380Stage!==scene.id)return gc380MountStage();
 const d=gc380VisibleData(scene),cfg=GC381_SCENES[scene.id];
 const fields=[[stage.querySelector('[data-gc380-label]'),d.label],[stage.querySelector('[data-gc380-title]'),d.title],
 [stage.querySelector('[data-gc380-info]'),d.region+' • Day '+d.day+' • '+d.detail]];
 let changed=false;
 fields.forEach(([node,value])=>{if(node&&node.textContent!==value){node.textContent=value;changed=true}});
 const img=stage.querySelector('.gc380Artwork'),src='../art/'+cfg.file;
 if(img&&img.getAttribute('src')!==src){img.setAttribute('src',src);img.style.objectPosition=cfg.focus;img.alt=cfg.alt;changed=true}
 if(changed)GC380_STATS.updates++;
 return changed;
};
function gc381InstallStyles(){
 if(document.getElementById('gc381Styles'))return;
 const s=document.createElement('style');s.id='gc381Styles';
 s.textContent=[
 '.gc381Stage{height:clamp(210px,42dvh,390px);animation:gc381Arrive .26s ease-out both}',
 '.gc381Stage .gc380Artwork{object-fit:cover;image-rendering:auto;max-width:none;filter:none}',
 '.gc381Stage .gc380SceneHeading{bottom:44px}',
 'body.gc330Visual .screen{padding-bottom:calc(102px + env(safe-area-inset-bottom,0px))!important}',
 '#nav{box-sizing:border-box;padding-bottom:env(safe-area-inset-bottom,0px)!important}',
 'body.gc330Visual #nav{min-height:calc(58px + env(safe-area-inset-bottom,0px))}',
 '.gc381Stage .gc380Fold{min-height:44px;min-width:130px}',
 '@media(min-height:780px){.gc381Stage:not(.gc380Folded){height:clamp(250px,45dvh,430px)}}',
 '@media(max-height:670px){.gc381Stage:not(.gc380Folded){height:clamp(185px,39dvh,295px)}}',
 '@media(max-width:350px){.gc381Stage:not(.gc380Folded){height:clamp(194px,39dvh,320px)}.gc381Stage .gc380SceneHeading h2{font-size:clamp(20px,6vw,27px)}}',
 '.gc381Stage.gc380Folded{height:105px!important}',
 '@keyframes gc381Arrive{from{opacity:.85}to{opacity:1}}',
 '@media(prefers-reduced-motion:reduce){.gc381Stage{animation:none!important}}'
 ].join('');
 document.head.appendChild(s);
}
gc381InstallStyles();
/* The old v21.8.0 test asserted that scenes were absent on Jobs and Scout.
   Now test them as present, while preserving its public test hook for CI. */
window.__GC380_TEST=function(){return window.__GC381_TEST()};
window.__GC381_TEST=function(){
 const previous=state;
 try{
  state=createState('Multi Scene Test','veyric');
  state.regions.veyric.hq.established=true;
  const f=gc260CreateFounderRecord('veyric',{name:'Scene Tester',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';
  const pr=gc340Presence(),checks={},snap=()=>({
   stage:document.querySelector('.gc380Stage')?.dataset.gc380Stage||null,
   file:document.querySelector('.gc380Artwork')?.getAttribute('src')||null
  });
  gc270Progression().phase='freeblade';gc270EnsureJobs();
  state.ui.tab='you';pr.place='hall';pr.mode='town';render();checks.hall=snap();
  for(const [p,key] of [['odd','market'],['train','musterYard'],['scout','marchWatch'],['recover','pilgrimHouse']]){
   pr.place=p;render();checks[key]=snap();
  }
  for(const [tab,key] of [['jobs','jobsBoard'],['gear','armory'],['region','worldMap']]){
   state.ui.tab=tab;render();checks[key]=snap();
  }
  gc270Progression().phase='company';
  state.ui.tab='contracts';render();checks.companyContracts=snap();
  state.ui.tab='world';render();checks.companyWorld=snap();
  state.ui.tab='company';state.ui.gc330CompanySub='overview';render();checks.companyHQ=snap();
  state.ui.gc330CompanySub='parties';render();checks.companyParties=snap();
  const mapped={hall:'chapterhouse',market:'market',musterYard:'musterYard',marchWatch:'marchWatch',pilgrimHouse:'pilgrimHouse',
   jobsBoard:'jobsBoard',armory:'armory',worldMap:'worldMap',companyContracts:'jobsBoard',companyWorld:'worldMap',
   companyHQ:'chapterhouse',companyParties:'musterYard'};
  const routed=Object.entries(mapped).every(([name,id])=>checks[name]?.stage===id&&checks[name]?.file==='../art/'+GC381_SCENES[id].file);
  pr.place='odd';state.ui.tab='you';render();
  const stage=document.querySelector('.gc380Stage');
  const before=!!stage&&stage.dataset.gc380Stage==='market';
  const button=stage?.querySelector('.gc380Fold');
  if(button)processAction(button);
  const folded=!!document.querySelector('.gc380Folded');
  if(button)processAction(button);
  const expanded=!document.querySelector('.gc380Folded');
  const nav=document.querySelectorAll('#nav button').length===4;
  const unique=Object.values(GC381_SCENES).length===8&&new Set(Object.values(GC381_SCENES).map(x=>x.file)).size===8;
  const vitality=gc342StateIntegrity().ok;
  return{ok:routed&&before&&folded&&expanded&&nav&&unique&&vitality,routed,before,folded,expanded,nav,unique,vitality,checks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=previous;try{render()}catch(_){}}
};
const _auditGC381=audit;
audit=function(){
 const a=_auditGC381();a.v381SceneRouter=GC381_VERSION;
 a.sevenNewStandaloneSVGScenes=true;a.freebladeAndCompanyNavigationScenes=true;
 a.locationAwareArt=true;a.mobileSafeAreaStage=true;
 return a;
};
window.__BL_AUDIT=audit;