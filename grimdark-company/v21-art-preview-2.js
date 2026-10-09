/* Grim Company visual rollout: Step 3 scene coverage + Step 4 portrait architecture.
 * Injected only in play-art-preview-2; production builds & save keys untouched. */
const GC421_VERSION='art-preview-2';
const GC421_SCENE_IDS=Object.freeze(['chapterhouse','market','musterYard','marchWatch','pilgrimHouse','jobsBoard','armory','worldMap']);
const GC421_SCENE_FILES=Object.freeze({
 chapterhouse:'chapterhouse.webp',market:'market.webp',
 musterYard:'musterYard.webp',marchWatch:'marchWatch.webp',
 pilgrimHouse:'pilgrimHouse.webp',jobsBoard:'jobsBoard.webp',
 armory:'armory.webp',worldMap:'worldMap.webp'
});
const GC421_FOCAL=Object.freeze({
 chapterhouse:'50% 43%',market:'50% 48%',musterYard:'50% 53%',
 marchWatch:'57% 50%',pilgrimHouse:'50% 46%',jobsBoard:'50% 47%',
 armory:'50% 53%',worldMap:'50% 44%'
});
function gc421KnownScene(id){return GC421_SCENE_IDS.includes(id)}
function gc421SceneUrl(scene){
 if(!gc421KnownScene(scene?.id))return null;
 return gc420MediaUrl(scene.id);
}
/* Add the raster for whichever existing scene ID is in use.
   The old chapterhouse proof stays valid, but seven more routed scenes
   now use exactly the same decode/IndexedDB path. */
const _gc380StageHTMLGC421=gc380StageHTML;
gc380StageHTML=function(scene){
 let html=_gc380StageHTMLGC421(scene);
 const src=gc421SceneUrl(scene),cfg=GC381_SCENES[scene?.id];
 if(!src||!cfg)return html;
 const fallback='src="../art/'+cfg.file+'"';
 if(html.includes(fallback))html=html.replace(fallback,'src="'+src+'"');
 html=html.replace('class="gc380Stage gc381Stage ','class="gc380Stage gc381Stage gc420RasterStage ');
 return html;
};
const _gc380PatchStageGC421=gc380PatchStage;
gc380PatchStage=function(...args){
 const result=_gc380PatchStageGC421(...args);
 const scene=gc380SceneState();
 const img=document.querySelector('#app .gc380Artwork');
 const src=gc421SceneUrl(scene);
 if(img&&src){
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  img.dataset.gc421Scene=scene.id;
  img.style.objectPosition=GC421_FOCAL[scene.id];
  img.style.filter='none';img.style.imageRendering='auto';
 }
 return result;
};
function gc421AssetStatus(){
 return GC421_SCENE_IDS.map(id=>({id,ready:!!gc420MediaUrl(id),size:GC420_IMAGES[id]?.size||0}));
}
function gc421PaintStatus(){
 const el=document.getElementById('gc421Coverage');
 if(!el)return;
 const rows=gc421AssetStatus();
 const ready=rows.filter(x=>x.ready).length;
 el.innerHTML='<strong>'+ready+' / 8 ENVIRONMENTS LOADED</strong>'+
  '<div class="gc421CoverageGrid">'+rows.map(row=>
    '<span class="'+(row.ready?'gc421Present':'gc421Missing')+'">'+
    (row.ready?'●':'○')+' '+row.id+'</span>').join('')+'</div>';
}
function gc421IdForFile(file){
 const name=String(file?.name||'').toLowerCase();
 return GC421_SCENE_IDS.find(id=>{
  const stem=GC421_SCENE_FILES[id].slice(0,-5).toLowerCase();
  return name===stem+'.webp'||name===stem+'.png'||name===stem+'.jpg'||name===stem+'.jpeg'||name===stem+'.avif';
 })||null;
}
async function gc421ImportFiles(files){
 if(gc420Busy)return;
 gc420Busy=true;
 let loaded=0, rejected=[];
 try{
  for(const file of Array.from(files||[])){
   const id=gc421IdForFile(file);
   if(!id||!file.type.startsWith('image/')||file.size>15*1024*1024){
    rejected.push(file.name);continue;
   }
   const persisted=await gc420Put(gc420DB,id,file);
   gc420SaveMedia(id,file);
   if(!persisted)rejected.push(id+' (session only)');
   loaded++;
  }
  gc421PaintStatus();
  gc420ShowNotice(loaded+' environment images imported. '+
    (rejected.length?'Check: '+rejected.join(', '):'')+
    ' Scene changes show the corresponding illustration automatically.');
 }finally{gc420Busy=false}
}
const _gc420InstallControlsGC421=gc420InstallControls;
gc420InstallControls=function(){
 _gc420InstallControlsGC421();
 const panel=document.getElementById('gc420Panel');
 if(!panel||document.getElementById('gc421MultiInput'))return;
 const art=document.createElement('div');art.id='gc421Importer';
 art.innerHTML='<h3>Eight-scene environment pack</h3>'+
  '<p>Download the Step 3 ZIP, extract it in iPhone Files, then select the eight WebP files. Your browser stores them locally and retains SVG fallbacks for missing artwork.</p>'+
  '<label>Import environment images (select multiple)'+
  '<input type="file" id="gc421MultiInput" accept="image/png,image/webp,image/jpeg,image/avif" multiple></label>'+
  '<div id="gc421Coverage" aria-live="polite"></div>'+
  '<small>Import names: chapterhouse, market, musterYard, marchWatch, pilgrimHouse, jobsBoard, armory, worldMap.</small>';
 const before=panel.querySelector('.gc420PreviewRow');
 if(before)panel.insertBefore(art,before);
 else panel.appendChild(art);
 document.getElementById('gc421MultiInput').addEventListener('change',ev=>gc421ImportFiles(ev.target.files));
 gc421PaintStatus();
};
const _gc420StartGC421=gc420Start;
gc420Start=async function(){
 await _gc420StartGC421();
 for(const id of GC421_SCENE_IDS){
  if(id==='chapterhouse')continue;
  const file=await gc420Get(gc420DB,id);
  if(file)gc420SaveMedia(id,file);
 }
 gc421PaintStatus();
};
const _gc420SaveMediaGC421=gc420SaveMedia;
gc420SaveMedia=function(id,file){
 _gc420SaveMediaGC421(id,file);
 if(gc421KnownScene(id))gc421PaintStatus();
};
document.addEventListener('error',e=>{
 const img=e.target,id=img?.dataset?.gc421Scene;
 if(!gc421KnownScene(id))return;
 const saved=GC420_IMAGES[id];
 if(saved?.url)URL.revokeObjectURL(saved.url);
 GC420_IMAGES[id]=null;
 const cfg=GC381_SCENES[id];
 img.removeAttribute('data-gc421-scene');
 img.src='../art/'+cfg.file;
 gc421PaintStatus();
 gc420ShowNotice(id+' image failed to decode; original SVG restored.');
},true);
const _gc420InstallCSSGC421=gc420InstallCSS;
gc420InstallCSS=function(){
 _gc420InstallCSSGC421();
 if(document.getElementById('gc421Style'))return;
 const s=document.createElement('style');s.id='gc421Style';
 s.textContent='#gc421Importer{border:1px solid #6c5132;padding:11px;margin:15px 0;background:#201814;color:#e9d7b6}'+
  '#gc421Importer h3{font:700 17px Georgia,serif;margin:5px 0}'+
  '#gc421Importer p{font:12px/1.5 system-ui;color:#c6b99e}'+
  '.gc421CoverageGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;font:11px/1.45 system-ui;margin:8px 0}'+
  '.gc421Present{color:#b3d7a3}.gc421Missing{color:#a79070}'+
  '#gc421Coverage>strong{color:#f1d29d;font:700 11px system-ui}';
 document.head.appendChild(s);
};
/* Portrait Architecture — no attempt to fabricate high-resolution procedural
   faces at runtime. Catalog slots are deterministic and race/gender safe.
   Until approved assets are imported, SVG portraits remain the default. */
const GC422_VERSION='portrait-architecture-1';
const GC422_RACES=Object.freeze(['Human','Elf','Dwarf','Orc','Celestial']);
const GC422_PRESENTATIONS=Object.freeze(['Male','Female']);
const GC422_INITIAL_BASES_PER_GROUP=6;
const GC422_TARGET_BASES=GC422_RACES.length*GC422_PRESENTATIONS.length*GC422_INITIAL_BASES_PER_GROUP;
const GC422_CURATED_CATALOG=[]; // No substitute assets; populate after human review.
function gc422Eligible(a,p){
 if(!a||!p||!p.approved)return false;
 if(a.race!==p.race||bl15EnsureGender(a)!==p.gender)return false;
 if(p.culture&&p.culture!==a.culture)return false;
 if(p.role&&p.role!==classRule(a).role)return false;
 return true;
}
function gc422Choose(a,catalog=GC422_CURATED_CATALOG){
 if(!a?.id||!Array.isArray(catalog))return null;
 const matching=catalog.filter(p=>gc422Eligible(a,p)&&!!gc420MediaUrl(p.assetId))
  .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 if(!matching.length)return null;
 const hash=bl15Hash(String(a.id)+'|'+String(a.race)+'|'+bl15EnsureGender(a)+'|curated-v1');
 return matching[hash%matching.length];
}
const _blPortraitHTMLGC422=blPortraitHTML;
blPortraitHTML=function(a,cls=''){
 const p=gc422Choose(a);
 if(!p)return _blPortraitHTMLGC422(a,cls);
 const src=gc420MediaUrl(p.assetId);
 return '<span class="blSvgPortrait gc420RasterPortrait '+esc(cls)+'" data-gc422-preset="'+esc(p.id)+'" data-race="'+esc(a.race)+'" data-gender="'+esc(bl15EnsureGender(a))+'">'+
  '<img src="'+src+'" alt="'+esc(a.name)+' portrait" loading="lazy" decoding="async" style="object-position:'+esc(p.focus||'50% 35%')+'"></span>';
};
window.__GC421_TEST=function(){
 const routes=GC421_SCENE_IDS.length===8&&GC421_SCENE_IDS.every(id=>!!GC381_SCENES[id]&&!!GC421_SCENE_FILES[id]);
 const files=GC421_SCENE_IDS.every(id=>gc421IdForFile({name:GC421_SCENE_FILES[id]})===id);
 const ui=!!document.getElementById('gc421MultiInput');
 const fallback=typeof _gc380StageHTMLGC421==='function'&&typeof _gc380PatchStageGC421==='function';
 const safe=SAVE_KEY==='brokenLanternCanonical_v9_artPreview1';
 return{ok:routes&&files&&ui&&fallback&&safe,routes,files,ui,fallback,saveIsolated:safe}
};
window.__GC422_TEST=function(){
 const hypothetical={id:'fixed-identity',race:'Human',gender:'Male',culture:'Veyric',className:'Knight-Errant'};
 const f=GC422_CURATED_CATALOG;
 const identity=gc422Choose(hypothetical,f)===null;
 const rejectRace=!gc422Eligible(hypothetical,{approved:true,race:'Elf',gender:'Male'});
 const rejectGender=!gc422Eligible(hypothetical,{approved:true,race:'Human',gender:'Female'});
 const neverRandom=GC422_TARGET_BASES===60;
 return{ok:identity&&rejectRace&&rejectGender&&neverRandom,svgDefault:identity,raceSafety:rejectRace,genderSafety:rejectGender,realRaceCount:GC422_RACES.length,plannedBases:GC422_TARGET_BASES}
};
