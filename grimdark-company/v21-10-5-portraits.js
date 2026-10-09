/* Grim Company — 50 original portraits, displayed without downsampling or filters.
 * Dedicated art database. Canonical game-save keys and gameplay state are unchanged.
 * Source art is loaded directly as JPEG Blobs. No image resampling/canvas/encoder.
 */
const GC425_VERSION='21.10.5';
const GC425_CULTURES=['veyric','skeldic','hoshin','nambaran','aethren'];
const GC425_RACES=['human','elf','dwarf','orc','celestial'];
const GC425_GENDERS=['male','female'];
const GC425_DB_NAME='grim-company-original-portraits-v1';
const GC425_SLOTS=[];
for(const culture of GC425_CULTURES)for(const race of GC425_RACES)for(const gender of GC425_GENDERS)
 GC425_SLOTS.push(culture+'_'+race+'_'+gender);
const GC425_URLS=Object.create(null);
let gc425Database=null;
let gc425ImportBusy=false;
let gc425ImportedCount=0;
function gc425Key(a){
 if(!a)return null;
 const c=String(a.culture||'').trim().toLowerCase().replace('velric','veyric');
 const r=String(a.race||'').trim().toLowerCase();
 let g=String(a.gender||'').trim().toLowerCase();
 if(!GC425_GENDERS.includes(g))try{g=String(bl15EnsureGender(a)).toLowerCase()}catch(_){}
 const key=c+'_'+r+'_'+g;
 return GC425_SLOTS.includes(key)?key:null;
}
function gc425SetImage(key,blob){
 if(GC425_URLS[key])URL.revokeObjectURL(GC425_URLS[key]);
 GC425_URLS[key]=URL.createObjectURL(blob);
}
const _gc425OldPortraitHTML=blPortraitHTML;
blPortraitHTML=function(a,cls=''){
 const key=gc425Key(a),src=key&&GC425_URLS[key];
 if(!src)return _gc425OldPortraitHTML(a,cls);
 return '<span class="blSvgPortrait gc425Portrait '+esc(cls)+'" data-gc425-portrait="'+key+'">'+
  '<img src="'+src+'" alt="'+esc(String(a.name||a.race||'Adventurer'))+' portrait" loading="eager" decoding="async" draggable="false"></span>';
};
function gc425OpenDb(){
 return new Promise(resolve=>{
  try{
   if(!window.indexedDB)return resolve(null);
   const q=indexedDB.open(GC425_DB_NAME,1);
   q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('images'))q.result.createObjectStore('images',{keyPath:'id'})};
   q.onsuccess=()=>resolve(q.result);
   q.onerror=()=>resolve(null);
  }catch(_){resolve(null)}
 });
}
function gc425ReadAll(){
 return new Promise(resolve=>{
  if(!gc425Database)return resolve([]);
  try{
   const q=gc425Database.transaction('images','readonly').objectStore('images').getAll();
   q.onsuccess=()=>resolve(q.result||[]);
   q.onerror=()=>resolve([]);
  }catch(_){resolve([])}
 });
}
function gc425StoreAll(rows){
 return new Promise(resolve=>{
  if(!gc425Database)return resolve(false);
  try{
   const t=gc425Database.transaction('images','readwrite');
   const store=t.objectStore('images');
   for(const row of rows)store.put(row);
   t.oncomplete=()=>resolve(true);
   t.onabort=()=>resolve(false);
   t.onerror=()=>resolve(false);
  }catch(_){resolve(false)}
 });
}
function gc425ParseArchive(buffer){
 const view=new DataView(buffer),decoder=new TextDecoder(),data=new Uint8Array(buffer);
 const slots=new Map();let offset=0,entries=0;
 while(offset+4<=data.length){
  const signature=view.getUint32(offset,true);
  if(signature!==0x04034b50)break;
  if(offset+30>data.length)throw Error('Incomplete ZIP entry');
  const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true);
  const comp=view.getUint32(offset+18,true),size=view.getUint32(offset+22,true);
  const nlen=view.getUint16(offset+26,true),elen=view.getUint16(offset+28,true);
  if(flags&8||method!==0)throw Error('Use the provided uncompressed portrait archive');
  const start=offset+30+nlen+elen,end=start+comp;
  if(end>data.length||comp!==size)throw Error('Damaged ZIP entry');
  const name=decoder.decode(data.subarray(offset+30,offset+30+nlen)).toLowerCase();
  const match=name.match(/^([a-z]+_[a-z]+_(?:male|female))\.(jpg|jpeg|png|webp)$/);
  if(match&&GC425_SLOTS.includes(match[1])){
   if(slots.has(match[1]))throw Error('Duplicate portrait: '+match[1]);
   const mime=match[2]==='png'?'image/png':match[2]==='webp'?'image/webp':'image/jpeg';
   slots.set(match[1],{id:match[1],blob:new Blob([data.slice(start,end)],{type:mime})});
  }
  offset=end;
  if(++entries>100)throw Error('Too many ZIP entries');
 }
 if(slots.size!==50)throw Error('Expected all 50 portraits. Found '+slots.size+'.');
 return GC425_SLOTS.map(id=>slots.get(id));
}
function gc425ValidateFile(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   const w=img.naturalWidth,h=img.naturalHeight;
   URL.revokeObjectURL(url);
   (w>=800&&h>=800&&w/h>.75&&w/h<1.3)?resolve(true):reject(Error('Portrait image dimensions are too small or distorted'));
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('One portrait cannot be decoded'))};
  img.src=url;
 });
}
function gc425Notice(text){const el=document.getElementById('gc425Notice');if(el)el.textContent=text}
function gc425Refresh(){
 gc425ImportedCount=GC425_SLOTS.filter(id=>!!GC425_URLS[id]).length;
 const t=document.getElementById('gc425Trigger');if(t)t.textContent='PORTRAITS '+gc425ImportedCount+'/50';
 const c=document.getElementById('gc425Count');if(c)c.textContent=gc425ImportedCount+'/50 original portraits loaded';
 try{if(typeof render==='function')render()}catch(_){}
 try{if(document.getElementById('modal')?.classList.contains('show')&&typeof renderModal==='function')renderModal()}catch(_){}
}
async function gc425ImportZip(file){
 if(!file||gc425ImportBusy)return;
 gc425ImportBusy=true;gc425Notice('Reading the original portraits…');
 try{
  if(file.size>100*1024*1024)throw Error('Archive exceeds 100 MB');
  const rows=gc425ParseArchive(await file.arrayBuffer());
  for(let i=0;i<rows.length;i++){
   await gc425ValidateFile(rows[i].blob);
   if((i+1)%10===0)gc425Notice('Verified '+(i+1)+'/50 original images…');
  }
  gc425Notice('Saving the full-resolution originals in this browser…');
  const persisted=await gc425StoreAll(rows);
  for(const item of rows)gc425SetImage(item.id,item.blob);
  gc425Refresh();
  gc425Notice(persisted?'All 50 installed. No artwork recompressed. Images will reload from browser storage.':
   'All 50 loaded for this session. Browser storage is unavailable; keep the ZIP to reimport next time.');
 }catch(error){gc425Notice('Import failed: '+String(error?.message||error))}
 finally{gc425ImportBusy=false}
}
function gc425Mount(){
 if(document.getElementById('gc425Trigger'))return;
 const s=document.createElement('style');s.id='gc425Style';
 s.textContent='.gc425Portrait{display:inline-block;position:relative;overflow:hidden;vertical-align:middle;isolation:isolate}'+
  '.gc425Portrait>img{display:block;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center 34%!important;image-rendering:auto!important;filter:none!important;transform:none!important;opacity:1!important}'+
  '#gc425Trigger{position:fixed;z-index:10010;right:10px;bottom:calc(76px + env(safe-area-inset-bottom,0px));background:#231d17;color:#f0d8af;border:1px solid #a38257;border-radius:5px;padding:8px 10px;min-height:42px;font:700 11px system-ui;box-shadow:0 2px 12px #0009}'+
  '#gc425Dialog{display:none;position:fixed;inset:0;z-index:10011;background:#000c;align-items:center;justify-content:center;padding:14px}'+
  '#gc425Dialog.gc425Open{display:flex}#gc425Box{box-sizing:border-box;width:100%;max-width:470px;background:#191816;color:#f2debc;border:1px solid #b38a58;border-radius:9px;padding:18px;max-height:85vh;overflow-y:auto;font:13px/1.55 system-ui}'+
  '#gc425Box h2{margin:0 0 10px;font:700 22px Georgia,serif}#gc425Box input{display:block;margin:15px 0;width:100%;min-height:44px}'+
  '#gc425Box button{background:#493325;border:1px solid #b38a58;color:#f2debc;padding:10px;min-height:44px}#gc425Notice{min-height:36px;color:#dec69e}';
 document.head.appendChild(s);
 const button=document.createElement('button');button.id='gc425Trigger';button.type='button';button.textContent='PORTRAITS 0/50';
 const dialog=document.createElement('div');dialog.id='gc425Dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 dialog.innerHTML='<div id="gc425Box"><h2>Original Adventurer Portraits</h2><p id="gc425Count">0/50 original portraits loaded</p>'+
  '<p>Import the 50-portrait ZIP once. The game displays the exact images without resizing, re-encoding, filters or atlases. Portraits are selected by culture, race and gender, not class.</p>'+
  '<label>Original portrait ZIP<input id="gc425Zip" type="file" accept=".zip,application/zip,application/x-zip-compressed"></label>'+
  '<p id="gc425Notice" role="status" aria-live="polite"></p><button type="button" id="gc425Close">CLOSE</button></div>';
 document.body.appendChild(button);document.body.appendChild(dialog);
 button.addEventListener('click',()=>{dialog.classList.add('gc425Open');gc425Refresh()});
 document.getElementById('gc425Close').addEventListener('click',()=>dialog.classList.remove('gc425Open'));
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.classList.remove('gc425Open')});
 document.getElementById('gc425Zip').addEventListener('change',e=>gc425ImportZip(e.target.files?.[0]));
 gc425Refresh();
}
async function gc425Boot(){
 gc425Mount();gc425Database=await gc425OpenDb();
 const rows=await gc425ReadAll();
 for(const row of rows)if(row&&GC425_SLOTS.includes(row.id)&&row.blob instanceof Blob)gc425SetImage(row.id,row.blob);
 gc425Refresh();
}
window.__GC425_TEST=function(){
 const ids=new Set(GC425_SLOTS);
 const expected=GC425_CULTURES.length*GC425_RACES.length*GC425_GENDERS.length;
 const id=gc425Key({culture:'Veyric',race:'Elf',gender:'Female'});
 const other=gc425Key({culture:'Nambaran',race:'Elf',gender:'Female'});
 return {ok:ids.size===50&&expected===50&&id==='veyric_elf_female'&&other==='nambaran_elf_female'&&
  gc425Key({culture:'Veyric',race:'Unknown',gender:'Male'})===null&&
  gc425Key({culture:'Veyric',race:'Human',gender:'Male',className:'Mage'})==='veyric_human_male',
  slots:ids.size,assetDb:GC425_DB_NAME,loaded:gc425ImportedCount};
};
window.__GC425_IMPORT={importZip:gc425ImportZip,parseZip:gc425ParseArchive,slots:GC425_SLOTS,loaded:()=>gc425ImportedCount};
setTimeout(gc425Boot,0);