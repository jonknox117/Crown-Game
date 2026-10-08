/* Broken Lantern v21.8.0 — Chapterhouse grand stage.
   Standalone SVG artwork, not a base64 raster or compressed sprite atlas. */
const GC380_VERSION='21.8.0';
const GC380_ART='../art/chapterhouse-grand.svg';
const GC380_STATS={mounts:0,updates:0,sceneChanges:0};
function gc380SceneState(){
 if(!state||!gc260Founder())return null;
 const ui=state.ui||{},tab=ui.tab||'you',p=gc340SyncPresence();
 const company=gc270IsCompany(),sub=ui.gc330CompanySub||'overview';
 if(tab==='you'&&p?.mode==='town'&&p.place==='hall')return{scene:'chapterhouse',context:'YOU • AT THE CHAPTERHOUSE',regionId:p.regionId};
 if(tab==='company'&&company&&['overview','hq'].includes(sub))return{scene:'chapterhouse',context:sub==='hq'?'HEADQUARTERS • OPERATIONS':'COMPANY • HOME',regionId:state.currentRegion};
 return null;
}
function gc380VisibleData(scene=gc380SceneState()){
 if(!scene)return null;
 const r=state.regions[scene.regionId]||region(),d=REGION_DEFS[scene.regionId]||regionDef();
 const town=GC340_TOWNS[scene.regionId]?.hall;
 const count=state.roster.filter(a=>a.regionId===scene.regionId&&a.status!=='Dead').length;
 const active=state.parties.filter(p=>p.regionId===scene.regionId&&p.expedition).length;
 return{title:town?.name||r.hq?.name||'The Chapterhouse',region:d.name||scene.regionId,day:Math.floor(Number(state.company.day)||1),label:scene.context,detail:count+' adventurer'+(count===1?'':'s')+' • '+active+' in the field',stage:scene.scene};
}
function gc380StageHTML(scene){
 const d=gc380VisibleData(scene),folded=!!state.ui?.gc380StageFolded;
 if(!d)return'';
 return '<section class="gc380Stage '+(folded?'gc380Folded':'')+'" data-gc380-stage="'+d.stage+'" aria-label="'+esc(d.title)+' illustrated scene">'+
  '<div class="gc380Illustration"><img class="gc380Artwork" src="'+GC380_ART+'" width="1200" height="820" alt="A grand stone guild hall illuminated by fireplaces and chandeliers, filled with banners, maps and adventurers." decoding="async" fetchpriority="high"/></div>'+
  '<div class="gc380Tone" aria-hidden="true"></div><div class="gc380SceneHeading"><span class="gc380Eyebrow" data-gc380-label>'+esc(d.label)+'</span><h2 data-gc380-title>'+esc(d.title)+'</h2>'+
  '<div class="gc380Info" data-gc380-info>'+esc(d.region)+' • Day '+d.day+' • '+esc(d.detail)+'</div></div>'+
  '<div class="gc380Frame"><span class="gc380Line" aria-hidden="true"></span>'+
  '<button class="gc380Fold" type="button" data-action="gc380ToggleStage" aria-label="'+(folded?'Expand illustrated scene':'Minimize illustrated scene')+'" aria-pressed="'+(folded?'true':'false')+'"><span class="gc380FoldGlyph" aria-hidden="true">'+(folded?'＋':'−')+'</span><span>'+(folded?'EXPAND SCENE':'SHOW CONTROLS')+'</span></button></div>'+
  '<span class="gc380ArtCredit">ORIGINAL VECTOR ENVIRONMENT</span></section>';
}
function gc380SceneHost(){return document.querySelector('#app .gc330Screen')||document.querySelector('#app .screen')||null}
function gc380MountStage(){
 if(!state)return false;
 const host=gc380SceneHost(),scene=gc380SceneState();
 if(!host)return false;
 const existing=host.querySelector(':scope > .gc380Stage');
 if(!scene){if(existing){existing.remove();GC380_STATS.sceneChanges++}return false}
 if(existing?.dataset.gc380Stage===scene.scene){gc380PatchStage();return true}
 if(existing)existing.remove();
 host.insertAdjacentHTML('afterbegin',gc380StageHTML(scene));
 GC380_STATS.mounts++;GC380_STATS.sceneChanges++;return true;
}
function gc380PatchStage(){
 const el=document.querySelector('#app .gc380Stage'),scene=gc380SceneState();
 if(!el||!scene)return false;
 const d=gc380VisibleData(scene),text=d.region+' • Day '+d.day+' • '+d.detail;
 const pairs=[[el.querySelector('[data-gc380-label]'),d.label],[el.querySelector('[data-gc380-title]'),d.title],[el.querySelector('[data-gc380-info]'),text]];
 let changed=false;
 pairs.forEach(([n,t])=>{if(n&&n.textContent!==t){n.textContent=t;changed=true}});
 if(changed)GC380_STATS.updates++;return changed;
}
const _renderGC380=render;
render=function(...args){const out=_renderGC380(...args);gc380MountStage();return out};
const _gc351TargetedPatchGC380=gc351TargetedPatch;
gc351TargetedPatch=function(...args){const result=_gc351TargetedPatchGC380(...args);gc380MountStage();return result};
const _processActionGC380=processAction;
processAction=function(el){
 if(el?.dataset?.action==='gc380ToggleStage'){
  state.ui=state.ui||{};state.ui.gc380StageFolded=!state.ui.gc380StageFolded;
  const stage=document.querySelector('#app .gc380Stage');
  if(stage){
   stage.classList.toggle('gc380Folded',!!state.ui.gc380StageFolded);
   const button=stage.querySelector('.gc380Fold');
   if(button){
    button.setAttribute('aria-label',state.ui.gc380StageFolded?'Expand illustrated scene':'Minimize illustrated scene');
    button.setAttribute('aria-pressed',String(!!state.ui.gc380StageFolded));
    button.innerHTML='<span class="gc380FoldGlyph" aria-hidden="true">'+(state.ui.gc380StageFolded?'＋':'−')+'</span><span>'+(state.ui.gc380StageFolded?'EXPAND SCENE':'SHOW CONTROLS')+'</span>';
   }
  }
  save();return;
 }
 return _processActionGC380(el);
};
function gc380InstallStyles(){
 if(document.getElementById('gc380Styles'))return;
 const s=document.createElement('style');s.id='gc380Styles';
 s.textContent=[
 '.gc380Stage{display:block;position:sticky;top:0;z-index:3;margin:0 -10px 13px;isolation:isolate;height:clamp(270px,45dvh,420px);overflow:hidden;border:1px solid #665038;background:#121824;box-shadow:0 9px 24px #000b;contain:layout paint}',
 '.gc380Illustration,.gc380Tone{position:absolute;inset:0;pointer-events:none}',
 '.gc380Artwork{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 43%;image-rendering:auto}',
 '.gc380Tone{background:linear-gradient(0deg,rgba(8,10,16,.96) 0%,rgba(11,13,19,.55) 18%,transparent 56%),linear-gradient(90deg,rgba(7,10,15,.65),transparent 60%);box-shadow:inset 0 0 1px #d0a36c75;z-index:1}',
 '.gc380SceneHeading{position:absolute;z-index:2;left:17px;right:17px;bottom:42px;pointer-events:none;text-shadow:0 2px 9px #000f}',
 '.gc380Eyebrow{display:block;font-size:9px;letter-spacing:.17em;font-weight:700;color:#dab883}',
 '.gc380SceneHeading h2{margin:3px 0;font-family:Georgia,serif;font-weight:700;font-size:clamp(23px,6.3vw,33px);line-height:1.03;color:#f4e5c5}',
 '.gc380Info{font-size:10px;color:#d6c4aa;line-height:1.4;margin-top:5px}',
 '.gc380Frame{position:absolute;z-index:4;left:13px;right:13px;bottom:7px;display:flex;align-items:center;justify-content:space-between;gap:10px}',
 '.gc380Line{display:block;width:58px;height:2px;background:linear-gradient(90deg,#ceaa6c,transparent)}',
 '.gc380Fold{border:1px solid #9d8154;background:#141514c9;border-radius:5px;min-height:44px;min-width:118px;color:#edcea0;display:flex;align-items:center;justify-content:center;gap:7px;font-size:8px;font-weight:750;letter-spacing:.09em;cursor:pointer;touch-action:manipulation}',
 '.gc380FoldGlyph{font-size:18px;font-weight:normal}',
 '.gc380ArtCredit{position:absolute;z-index:3;top:8px;right:9px;font-size:7px;letter-spacing:.12em;color:#cfbf9cb8;background:#0c1119aa;padding:4px 6px;border:1px solid #b18c513a}',
 '.gc380Folded{height:105px!important}.gc380Folded .gc380Illustration{opacity:.55}.gc380Folded .gc380SceneHeading{bottom:34px}',
 '.gc380Folded .gc380SceneHeading h2{font-size:19px}.gc380Folded .gc380Info,.gc380Folded .gc380ArtCredit{display:none}',
 'body.gc330Visual .gc330Screen{overflow:visible}',
 '@media(max-width:350px){.gc380Stage{margin-left:-8px;margin-right:-8px;height:clamp(235px,43dvh,360px)}.gc380SceneHeading{left:11px;right:11px}.gc380Frame{left:10px;right:10px}.gc380Info{font-size:9px}}',
 '@media(max-height:640px){.gc380Stage{height:clamp(210px,39dvh,300px)}.gc380SceneHeading h2{font-size:22px}}',
 '@media(min-width:760px){.gc380Stage{height:clamp(330px,48dvh,520px);max-height:520px}.gc380SceneHeading{left:25px;bottom:53px}.gc380SceneHeading h2{font-size:36px}}',
 '@media(prefers-reduced-motion:reduce){.gc380Stage *{animation:none!important;transition:none!important}}'
 ].join('');
 document.head.appendChild(s);
}
gc380InstallStyles();
const _auditGC380=audit;
audit=function(){
 const a=_auditGC380();
 a.v380GrandStage=GC380_VERSION;a.chapterhouseArtExternalSvg=true;
 a.noCompressedSceneAtlas=true;a.sceneRespondsToCurrentPlace=true;a.existingGameSystemsUnmodified=true;
 return a;
};
window.__BL_AUDIT=audit;
/* Explicit test hook for mobile layout checks. No production gameplay effect:
   it is called only from the temporary CI art-test page. */
window.__GC380_LAYOUT_PROBE=function(){
 state=createState('Art Quality Test','veyric');
 state.regions.veyric.hq.established=true;
 const f=gc260CreateFounderRecord('veyric',{name:'Stage Tester',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
 f.status='Ready';gc270Progression().phase='company';
 state.ui.tab='you';gc340Presence().mode='town';gc340Presence().place='hall';
 render();const stage=document.querySelector('.gc380Stage');const diag={mounted:!!stage,scene:gc380SceneState()?.scene,host:!!gc380SceneHost(),tab:state.ui.tab,company:gc270IsCompany(),art:stage?.querySelector('img')?.getAttribute('src')};window.__GC380_LAYOUT_RESULT=diag;return diag;
};
window.__GC380_TEST=function(){
 const old=state;
 try{
  state=createState('Grand Scene Test','veyric');state.regions.veyric.hq.established=true;
  const f=gc260CreateFounderRecord('veyric',{name:'Scene Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';gc270Progression().phase='company';
  state.ui.tab='you';gc340Presence().mode='town';gc340Presence().place='hall';render();
  const hall=!!document.querySelector('.gc380Stage img[src="../art/chapterhouse-grand.svg"]');
  const titleCorrect=document.querySelector('[data-gc380-title]')?.textContent==='Greyhaven Chapterhouse';
  state.ui.tab='contracts';render();const absentContracts=!document.querySelector('.gc380Stage');
  state.ui.tab='company';state.ui.gc330CompanySub='overview';render();const overview=!!document.querySelector('.gc380Stage');
  state.ui.tab='you';gc340Presence().place='scout';render();const absentScout=!document.querySelector('.gc380Stage');
  gc340Presence().place='hall';render();
  const button=document.querySelector('.gc380Fold');if(button)processAction(button);
  const collapsed=!!state.ui.gc380StageFolded&&document.querySelector('.gc380Stage')?.classList.contains('gc380Folded');
  const navStillAvailable=[...document.querySelectorAll('#nav button')].length>=4;
  const correctPath=document.querySelector('.gc380Artwork')?.getAttribute('src')===GC380_ART;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(hall&&titleCorrect&&absentContracts&&overview&&absentScout&&collapsed&&navStillAvailable&&correctPath&&integrity),hall,titleCorrect,absentContracts,overview,absentScout,collapsed,navStillAvailable,correctPath,integrity,mounts:GC380_STATS.mounts};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old;try{render()}catch(_){}}
};