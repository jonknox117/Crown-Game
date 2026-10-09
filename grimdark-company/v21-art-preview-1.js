/* Grim Company visual overhaul: Step 2 isolated image renderer proof.
 * This module is injected ONLY in play-art-preview-1.
 * Original gameplay builds, saves, SVG fallbacks remain untouched. */
const GC420_VERSION='art-preview-1';
const GC420_IMAGES={chapterhouse:null,portrait:null};
const GC420_ASSET_DB='grim-company-art-preview-v1';
const GC420_STORE='assets';
const GC420_DEFAULT_FOCAL='50% 44%';
let gc420DemoId=null, gc420DB=null;
let gc420Busy=false;
function gc420OpenDB(){
 return new Promise((resolve)=>{
  try{
   if(!window.indexedDB)return resolve(null);
   const req=indexedDB.open(GC420_ASSET_DB,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(GC420_STORE))req.result.createObjectStore(GC420_STORE)};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>resolve(null);
  }catch(_){resolve(null)}
 });
}
function gc420Get(db,id){
 return new Promise(resolve=>{
  if(!db)return resolve(null);
  try{
   const r=db.transaction(GC420_STORE,'readonly').objectStore(GC420_STORE).get(id);
   r.onsuccess=()=>resolve(r.result||null);
   r.onerror=()=>resolve(null);
  }catch(_){resolve(null)}
 });
}
function gc420Put(db,id,file){
 return new Promise(resolve=>{
  if(!db)return resolve(false);
  try{
   const tx=db.transaction(GC420_STORE,'readwrite');
   tx.objectStore(GC420_STORE).put(file,id);
   tx.oncomplete=()=>resolve(true);
   tx.onerror=()=>resolve(false);
   tx.onabort=()=>resolve(false);
  }catch(_){resolve(false)}
 });
}
function gc420MediaUrl(id){return GC420_IMAGES[id]?.url||null}
function gc420SaveMedia(id,file){
 if(GC420_IMAGES[id]?.url)URL.revokeObjectURL(GC420_IMAGES[id].url);
 GC420_IMAGES[id]={url:URL.createObjectURL(file),size:file.size,name:file.name};
 const img=new Image();
 img.decoding='async';img.src=GC420_IMAGES[id].url;
 img.decode?.().catch(()=>gc420ShowNotice(id+' failed to decode; SVG fallback remains available.'));
 gc420UpdateControls();
 try{if(state)render()}catch(_){}
}
function gc420ShowNotice(message){
 const el=document.getElementById('gc420Notice');if(el)el.textContent=message;
}
function gc420Subject(a){
 if(!a?.id)return false;
 const choices=state?.roster||[];
 if(!choices.some(x=>x.id===gc420DemoId)){
  const suitable=choices.find(x=>x.race==='Human'&&bl15EnsureGender(x)==='Male'&&x.status!=='Dead');
  gc420DemoId=(suitable||null)?.id||null;
 }
 return gc420DemoId!==null&&String(gc420DemoId)===String(a.id);
}
const _gc380StageHTMLGC420=gc380StageHTML;
gc380StageHTML=function(scene){
 let result=_gc380StageHTMLGC420(scene);
 const src=gc420MediaUrl('chapterhouse');
 if(src&&scene?.id==='chapterhouse'){
  result=result.replace('src="../art/chapterhouse-grand.svg"','src="'+src+'"');
  result=result.replace('class="gc380Stage gc381Stage ','class="gc380Stage gc381Stage gc420RasterStage ');
  result=result.replace('ORIGINAL VECTOR ENVIRONMENT','ORIGINAL RASTER • ART PREVIEW');
 }
 return result;
};
const _gc380PatchStageGC420=gc380PatchStage;
gc380PatchStage=function(...args){
 const result=_gc380PatchStageGC420(...args),scene=gc380SceneState();
 const art=document.querySelector('#app .gc380Artwork');
 const url=gc420MediaUrl('chapterhouse');
 if(art&&url&&scene?.id==='chapterhouse'){
  if(art.getAttribute('src')!==url)art.setAttribute('src',url);
  art.setAttribute('data-gc420-raster','chapterhouse');
  art.style.objectPosition=GC420_DEFAULT_FOCAL;
  art.loading='eager';
  art.decoding='async';
  art.style.filter='none';
  art.style.imageRendering='auto';
 }
 return result;
};
const _blPortraitHTMLGC420=blPortraitHTML;
blPortraitHTML=function(a,cls=''){
 const uri=gc420MediaUrl('portrait');
 if(!uri||!gc420Subject(a))return _blPortraitHTMLGC420(a,cls);
 const gender=bl15EnsureGender(a);
 return '<span class="blSvgPortrait gc420RasterPortrait '+esc(cls)+'" data-race="'+esc(a.race)+'" data-gender="'+esc(gender)+'" data-culture="'+esc(a.culture)+'">'+
 '<img alt="'+esc(a.name)+' portrait benchmark" src="'+uri+'" decoding="async" loading="eager"/></span>';
};
function gc420UpdateControls(){
 const e=document.getElementById('gc420EnvStatus'),p=document.getElementById('gc420FaceStatus');
 if(e)e.textContent=GC420_IMAGES.chapterhouse?'Loaded ('+Math.round(GC420_IMAGES.chapterhouse.size/1024)+' KB)':'SVG fallback';
 if(p)p.textContent=GC420_IMAGES.portrait?'Loaded ('+Math.round(GC420_IMAGES.portrait.size/1024)+' KB)':'SVG fallback';
 const demo=document.getElementById('gc420PortraitDemo');
 if(demo){
  const uri=gc420MediaUrl('portrait');
  demo.innerHTML=uri?'<img src="'+uri+'" alt="Adventurer portrait preview"/>':
   '<div class="gc420EmptyPortrait">Portrait art not imported</div>';
 }
}
async function gc420HandleFile(id,file){
 if(gc420Busy||!file)return;
 if(!file.type.startsWith('image/')||file.size>15*1024*1024){
  gc420ShowNotice('Choose a PNG, WebP, AVIF, or JPEG image under 15 MB.');return;
 }
 gc420Busy=true;
 try{
  const ok=await gc420Put(gc420DB,id,file);
  gc420SaveMedia(id,file);
  gc420ShowNotice(ok?'Imported and saved in this browser for future visits.':
   'Imported for this visit; private browsing may prevent permanent storage.');
 }finally{gc420Busy=false}
}
function gc420TogglePanel(open){
 const panel=document.getElementById('gc420Panel'),button=document.getElementById('gc420Trigger');
 if(!panel)return;
 const show=open===undefined?!panel.classList.contains('gc420Open'):open;
 panel.classList.toggle('gc420Open',show);
 if(button)button.setAttribute('aria-expanded',String(show));
}
function gc420InstallControls(){
 if(document.getElementById('gc420Root'))return;
 const root=document.createElement('div');root.id='gc420Root';
 root.innerHTML='<button id="gc420Trigger" type="button" aria-controls="gc420Panel" aria-expanded="false">ART PREVIEW <span>Step 2</span></button>'+
 '<aside id="gc420Panel" aria-label="Raster artwork sandbox">'+
 '<header><b>GRIM COMPANY • ART PREVIEW</b><button id="gc420Close" type="button" aria-label="Close art importer">×</button></header>'+
 '<p>This separate playable preview uses your two benchmark artworks. Select the WebP files once; they are stored only in this browser, not in your company save or on a server. Existing SVG images remain the fallback.</p>'+
 '<label>Chapterhouse environment <small id="gc420EnvStatus">SVG fallback</small>'+
 '<input type="file" id="gc420SceneInput" accept="image/webp,image/png,image/avif,image/jpeg"/></label>'+
 '<label>Adventurer portrait <small id="gc420FaceStatus">SVG fallback</small>'+
 '<input type="file" id="gc420PortraitInput" accept="image/webp,image/png,image/avif,image/jpeg"/></label>'+
 '<div class="gc420PreviewRow"><div id="gc420PortraitDemo"><div class="gc420EmptyPortrait">Portrait art not imported</div></div>'+
 '<div><strong>Game integration proof</strong><p>The Chapterhouse image appears in the actual scene viewport. One eligible human adventurer receives the benchmark portrait throughout the game UI. Other characters retain SVG portraits.</p></div></div>'+
 '<div id="gc420Notice" role="status" aria-live="polite">No game saves are modified.</div>'+
 '<small>Art originals are kept separately. File selection uses native browser images with no canvas recompression or blur filters.</small>'+
 '</aside>';
 document.body.appendChild(root);
 document.getElementById('gc420Trigger').addEventListener('click',e=>{e.stopPropagation();gc420TogglePanel()});
 document.getElementById('gc420Close').addEventListener('click',e=>{e.stopPropagation();gc420TogglePanel(false)});
 document.getElementById('gc420SceneInput').addEventListener('change',e=>gc420HandleFile('chapterhouse',e.target.files?.[0]));
 document.getElementById('gc420PortraitInput').addEventListener('change',e=>gc420HandleFile('portrait',e.target.files?.[0]));
 document.getElementById('gc420Panel').addEventListener('click',e=>e.stopPropagation());
 gc420UpdateControls();
}
function gc420InstallCSS(){
 const style=document.createElement('style');style.id='gc420Style';
 style.textContent=[
 '.gc420RasterStage .gc380Artwork{image-rendering:auto!important;filter:none!important;transform:none!important;object-fit:cover!important}',
 '.gc420RasterPortrait{display:inline-block;overflow:hidden;isolation:isolate;vertical-align:middle}',
 '.gc420RasterPortrait img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:center 34%;image-rendering:auto;filter:none;transform:none}',
 '#gc420Root{position:fixed;z-index:9998;right:12px;bottom:calc(74px + env(safe-area-inset-bottom,0px));max-width:100%;font-family:system-ui,-apple-system,sans-serif}',
 '#gc420Trigger{border:1px solid #ceaa6f;background:#281d17;box-shadow:0 3px 18px #000a;color:#eed3a1;border-radius:5px;min-height:44px;padding:9px 14px;font:700 12px system-ui}',
 '#gc420Trigger span{font-size:9px;opacity:.75;padding-left:6px}',
 '#gc420Panel{display:none;position:fixed;z-index:9999;inset:calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 20px);max-width:520px;max-height:780px;margin:auto;overflow:auto;border:1px solid #a87e4a;background:#111214;color:#e8d9bb;box-shadow:0 0 0 100vmax #000b,0 16px 50px #000;padding:17px;border-radius:7px}',
 '#gc420Panel.gc420Open{display:block}',
 '#gc420Panel header{display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid #665039;padding-bottom:12px;font:700 13px Georgia,serif;letter-spacing:.08em}',
 '#gc420Close{min-width:44px;min-height:44px;border:1px solid #746148;background:#231b16;color:#f1ddbc;font-size:28px}',
 '#gc420Panel p,#gc420Panel small{font:12px/1.5 system-ui;color:#b9ab96}',
 '#gc420Panel label{display:block;margin:14px 0;font-size:13px;font-weight:bold}',
 '#gc420Panel label small{display:block;font-weight:400}',
 '#gc420Panel input[type=file]{display:block;width:100%;margin-top:5px;min-height:40px;color:#dbc49d;font-size:12px}',
 '.gc420PreviewRow{display:flex;gap:12px;margin:16px 0;align-items:flex-start}',
 '#gc420PortraitDemo{height:116px;width:116px;flex:0 0 116px;background:#28201b;border:1px solid #a87e4a;overflow:hidden}',
 '#gc420PortraitDemo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 34%}',
 '.gc420EmptyPortrait{padding:16px;font:12px Georgia,serif;color:#bfaa89}',
 '#gc420Notice{margin:10px 0;padding:8px;border-left:2px solid #cda36b;background:#211b17;font:12px/1.4 system-ui}',
 '@media(max-width:360px){#gc420Panel{inset:10px 5px 12px;padding:12px}.gc420PreviewRow{gap:8px}#gc420PortraitDemo{height:88px;width:88px;flex-basis:88px}}'
 ].join('');
 document.head.appendChild(style);
}
async function gc420Start(){
 gc420InstallCSS();gc420InstallControls();
 gc420DB=await gc420OpenDB();
 for(const id of ['chapterhouse','portrait']){
  const file=await gc420Get(gc420DB,id);
  if(file)gc420SaveMedia(id,file);
 }
 gc420UpdateControls();
 if(!GC420_IMAGES.chapterhouse||!GC420_IMAGES.portrait)gc420TogglePanel(true);
}
const _renderGC420=render;
render=function(...args){
 const result=_renderGC420(...args);
 if(gc420MediaUrl('chapterhouse'))gc380PatchStage();
 return result;
};
document.addEventListener('error',e=>{
 const el=e.target;
 if(!el?.matches)return;
 if(el.matches('.gc420RasterPortrait img')){
  const frame=el.closest('.gc420RasterPortrait');
  if(frame)frame.replaceWith(document.createTextNode('Portrait unavailable'));
 }
 if(el.matches('.gc380Artwork')&&el.dataset.gc420Raster){
  el.removeAttribute('data-gc420-raster');
  el.src='../art/chapterhouse-grand.svg';
  gc420ShowNotice('Raster failed to load; original SVG scene restored.');
 }
},true);
window.__GC420_PREVIEW={
 version:GC420_VERSION,
 images:GC420_IMAGES,
 status:()=>({scene:!!gc420MediaUrl('chapterhouse'),portrait:!!gc420MediaUrl('portrait'),demoId:gc420DemoId}),
};
window.__GC420_TEST=function(){
 const a=GC420_ASSET_DB==='grim-company-art-preview-v1';
 const b=typeof gc420OpenDB==='function'&&typeof gc420SaveMedia==='function';
 const c=typeof _gc380StageHTMLGC420==='function'&&typeof _blPortraitHTMLGC420==='function';
 const d=!!document.getElementById('gc420SceneInput')&&!!document.getElementById('gc420PortraitInput');
 return{ok:a&&b&&c&&d,isolatedStorage:a,browserImport:b,svgFallback:c,importControls:d}
};
setTimeout(gc420Start,0);
