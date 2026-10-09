/* Grim Company Step 5 — actual curated raster portrait catalog and safe importer.
   Only installed in play-art-preview-3. No fake upscaling and no save mutation. */
const GC423_VERSION='portrait-library-1';
const GC423_SLOT_NAMES=['human','elf','dwarf','orc','celestial'];
const GC423_GENDERS=['male','female'];
const GC423_SLOTS=[];
for(const race of GC423_SLOT_NAMES){
 for(const gender of GC423_GENDERS){
  for(let n=1;n<=6;n++){
   const number=String(n).padStart(2,'0');
   const stem=race+'-'+gender+'-'+number;
   GC423_SLOTS.push({id:'portrait.'+race+'.'+gender+'.'+number,
    assetId:'portrait.'+race+'.'+gender+'.'+number,filename:stem+'.webp',
    race:race[0].toUpperCase()+race.slice(1),
    gender:gender[0].toUpperCase()+gender.slice(1),
    approved:false,focus:'50% 34%',slot:n,group:race+'-'+gender});
  }
 }
}
GC422_CURATED_CATALOG.push(...GC423_SLOTS);
const GC423_SELECTION_KEY='grim-company-art-preview3-portrait-identity-v1';
let GC423_PINS={};
try{GC423_PINS=JSON.parse(localStorage.getItem(GC423_SELECTION_KEY)||'{}')||{}}
catch(_){GC423_PINS={}}
function gc423PersistPins(){
 try{localStorage.setItem(GC423_SELECTION_KEY,JSON.stringify(GC423_PINS))}catch(_){}
}
function gc423Slot(filename){
 const s=String(filename||'').toLowerCase();
 const m=s.match(/^(human|elf|dwarf|orc|celestial)-(male|female)-(0[1-6])\.(png|webp|avif|jpe?g)$/i);
 if(!m)return null;
 return GC423_SLOTS.find(x=>x.filename.slice(0,-5)===m[1]+'-'+m[2]+'-'+m[3])||null;
}
function gc423SlotReady(slot){return !!(slot?.approved&&gc420MediaUrl(slot.assetId))}
function gc423Choose(a){
 if(!a?.id||!GC423_SLOT_NAMES.includes(String(a.race||'').toLowerCase()))return null;
 const gender=bl15EnsureGender(a),key=String(a.id),pinned=GC423_PINS[key];
 if(pinned){
  const preset=GC423_SLOTS.find(s=>s.id===pinned);
  if(preset&&gc423SlotReady(preset)&&gc422Eligible(a,preset))return preset;
  return null; // Identity must not morph just because an image is temporarily missing.
 }
 const candidates=GC423_SLOTS.filter(s=>gc423SlotReady(s)&&gc422Eligible(a,s));
 if(!candidates.length)return null;
 candidates.sort((a,b)=>a.id.localeCompare(b.id));
 const seed=bl15Hash(key+'|'+a.race+'|'+gender+'|grim-curated-stable-v1');
 const chosen=candidates[seed%candidates.length];
 GC423_PINS[key]=chosen.id;gc423PersistPins();
 return chosen;
}
gc422Choose=function(a){return gc423Choose(a)};
function gc423ImageDimensions(blob){
 return new Promise((resolve,reject)=>{
  const uri=URL.createObjectURL(blob);
  const img=new Image();
  img.onload=()=>{const size=[img.naturalWidth,img.naturalHeight];URL.revokeObjectURL(uri);resolve(size)};
  img.onerror=()=>{URL.revokeObjectURL(uri);reject(new Error('Image could not decode'))};
  img.src=uri;
 });
}
async function gc423Validate(file){
 const slot=gc423Slot(file?.name);
 if(!slot)return {ok:false,reason:'Invalid name. Expected e.g. human-male-01.webp'};
 if(!file?.type?.startsWith('image/')||file.size>15*1024*1024)
  return {ok:false,reason:'Unsupported file or over 15 MB'};
 let dims;
 try{dims=await gc423ImageDimensions(file)}catch(e){return {ok:false,reason:String(e.message)}}
 const [w,h]=dims;
 if(w<512||h<512)return {ok:false,reason:'Below minimum 512×512 real pixels'};
 if(w/h<.75||w/h>1.3)return {ok:false,reason:'Portrait must be nearly square; contact sheets are not valid portrait assets'};
 return {ok:true,slot,dimensions:dims,quality:w>=1024&&h>=1024?'full':'card'};
}
function gc423MarkSlotReady(slot){
 slot.approved=true;
}
function gc423RosterRefresh(){
 try{if(state){render();if(document.getElementById('modal')?.classList.contains('show'))renderModal()}}catch(_){}
}
async function gc423ImportBatch(files){
 const arr=Array.from(files||[]);
 if(!arr.length)return;
 const notes=[];let ok=0,failed=0,stored=0;
 for(const file of arr){
  const check=await gc423Validate(file);
  if(!check.ok){failed++;notes.push(file.name+': '+check.reason);continue}
  const id=check.slot.assetId;
  const persisted=await gc420Put(gc420DB,id,file);
  if(persisted)stored++;
  const previous=GC420_IMAGES[id]?.url;
  if(previous)URL.revokeObjectURL(previous);
  GC420_IMAGES[id]={url:URL.createObjectURL(file),size:file.size,name:file.name,
    dimensions:check.dimensions,quality:check.quality};
  gc423MarkSlotReady(check.slot);
  ok++;
  if(check.quality==='card')notes.push(file.name+': card-sized (512–1023px), suitable for small views');
 }
 gc423RenderPanel();
 gc423RosterRefresh();
 gc420ShowNotice(ok+' imported; '+stored+' persisted in browser; '+failed+' rejected.'+
   (notes.length?' '+notes.slice(0,3).join(' | '):''));
}
function gc423Counts(){
 const groups={};
 for(const slot of GC423_SLOTS){
  const n=slot.group;
  if(!groups[n])groups[n]={ready:0,total:6};
  if(gc423SlotReady(slot))groups[n].ready++;
 }
 return groups;
}
function gc423RenderPanel(){
 const host=document.getElementById('gc423Inventory');
 if(!host)return;
 const groups=gc423Counts(),ready=GC423_SLOTS.filter(gc423SlotReady).length;
 host.innerHTML='<strong>'+ready+' / 60 CURATED PORTRAITS LOADED</strong>'+
  '<div class="gc423Groups">'+Object.keys(groups).map(k=>
   '<span>'+k.replace('-',' ')+' <b>'+groups[k].ready+' / '+groups[k].total+'</b></span>'
  ).join('')+'</div>'+
  '<small>SVG fallback remains in use for groups without imported artwork. A character keeps its selected portrait ID when more images are added.</small>';
}
async function gc423UseOriginalBenchmark(){
 const file=await gc420Get(gc420DB,'portrait');
 if(!file){gc420ShowNotice('Import the original benchmark portrait first (Step 2 portrait picker).');return}
 const named=new File([file],'human-male-01.webp',{type:'image/webp'});
 await gc423ImportBatch([named]);
}
const _gc420InstallControlsGC423=gc420InstallControls;
gc420InstallControls=function(){
 _gc420InstallControlsGC423();
 const panel=document.getElementById('gc420Panel');
 if(!panel||document.getElementById('gc423Importer'))return;
 const el=document.createElement('section');el.id='gc423Importer';
 el.innerHTML='<h3>Adventurer Portrait Library</h3>'+
  '<p>Import genuinely illustrated square portraits. Use <b>human-male-01.webp</b> through <b>celestial-female-06.webp</b> (six per race and presentation). No contact-sheet crops or tiny enlarged faces.</p>'+
  '<label>Import portrait images (select multiple)<input id="gc423MultiInput" type="file" multiple accept="image/png,image/webp,image/jpeg,image/avif"></label>'+
  '<button type="button" class="gc423Benchmark" id="gc423UseBenchmark">USE MY EXISTING BENCHMARK PORTRAIT</button>'+
  '<div id="gc423Inventory" aria-live="polite"></div>';
 const anchor=panel.querySelector('#gc421Importer');
 if(anchor)anchor.insertAdjacentElement('afterend',el);
 else panel.appendChild(el);
 document.getElementById('gc423MultiInput').addEventListener('change',e=>gc423ImportBatch(e.target.files));
 document.getElementById('gc423UseBenchmark').addEventListener('click',gc423UseOriginalBenchmark);
 gc423RenderPanel();
};
const _gc420StartGC423=gc420Start;
gc420Start=async function(){
 await _gc420StartGC423();
 for(const slot of GC423_SLOTS){
  const file=await gc420Get(gc420DB,slot.assetId);
  if(!file)continue;
  const dimensions=await gc423ImageDimensions(file).catch(()=>null);
  if(!dimensions||dimensions[0]<512||dimensions[1]<512||dimensions[0]/dimensions[1]<.75||dimensions[0]/dimensions[1]>1.3)continue;
  const before=GC420_IMAGES[slot.assetId]?.url;
  if(before)URL.revokeObjectURL(before);
  GC420_IMAGES[slot.assetId]={url:URL.createObjectURL(file),size:file.size,name:file.name,dimensions};
  gc423MarkSlotReady(slot);
 }
 gc423RenderPanel();
 gc423RosterRefresh();
};
const _gc420InstallCSSGC423=gc420InstallCSS;
gc420InstallCSS=function(){
 _gc420InstallCSSGC423();
 if(document.getElementById('gc423Styles'))return;
 const sheet=document.createElement('style');sheet.id='gc423Styles';
 sheet.textContent='#gc423Importer{background:#1e1b19;border:1px solid #b28b53;border-radius:5px;padding:12px;margin:14px 0;color:#f0e1c4}'+
  '#gc423Importer h3{font:700 18px Georgia,serif;margin:4px 0 9px}'+
  '#gc423Importer p{font:12px/1.55 system-ui;color:#c2b19a}'+
  '#gc423Importer input{display:block;width:100%;margin-top:9px;min-height:40px}'+
  '#gc423Importer label{font:700 12px system-ui}'+
  '.gc423Benchmark{margin:10px 0;min-height:45px;width:100%;background:#3b281d;border:1px solid #c69d61;color:#f1dbb9;font:700 11px system-ui}'+
  '#gc423Inventory>strong{font:700 12px system-ui;color:#f1d1a0}'+
  '.gc423Groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:10px 0}'+
  '.gc423Groups span{font:11px system-ui;border:1px solid #554331;background:#151312;padding:8px 5px;color:#cbb393;text-transform:capitalize}'+
  '.gc423Groups b{float:right;color:#f1d9ad}'+
  '.gc420RasterPortrait{background:#191513;border:1px solid #a37a46}';
 document.head.appendChild(sheet);
};
function gc423TestCatalog(){
 const ids=new Set(GC423_SLOTS.map(x=>x.id));
 const count=GC423_SLOTS.length===60&&ids.size===60;
 const five=GC423_SLOT_NAMES.length===5;
 const groups=Object.keys(gc423Counts()).length===10;
 const filename=gc423Slot('celestial-female-06.webp')?.race==='Celestial';
 const malformed=!gc423Slot('group-contact-sheet.png')&&!gc423Slot('human-male-07.webp');
 const race=gc422Eligible({race:'Elf',gender:'Female'},{approved:true,race:'Elf',gender:'Female'})&&
  !gc422Eligible({race:'Elf',gender:'Female'},{approved:true,race:'Human',gender:'Female'});
 const safe=SAVE_KEY==='brokenLanternCanonical_v9_artPreview1'&&
  GC423_SELECTION_KEY!=='brokenLanternCanonical_v9';
 const ui=!!document.getElementById('gc423MultiInput')&&!!document.getElementById('gc423UseBenchmark');
 const originalReady=typeof _blPortraitHTMLGC422==='function';
 return {ok:count&&five&&groups&&filename&&malformed&&race&&safe&&ui&&originalReady,
  count,five,groups,filename,malformed,race,safe,ui,originalReady};
}
window.__GC423_TEST=gc423TestCatalog;
window.__GC423_PORTFOLIO={version:GC423_VERSION,slots:GC423_SLOTS,
  counts:gc423Counts,choose:gc423Choose,validate:gc423Validate};
