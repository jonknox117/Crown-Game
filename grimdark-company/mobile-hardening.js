(function(){
'use strict';

let dbPromise=null;
let hadLocalSave=false;
try{hadLocalSave=!!localStorage.getItem(SAVE)}catch(e){}

function openDB(){
  if(!('indexedDB' in window)) return Promise.resolve(null);
  if(dbPromise) return dbPromise;
  dbPromise=new Promise(resolve=>{
    try{
      const req=indexedDB.open('brokenLanternMobile',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
    }catch(e){resolve(null)}
  });
  return dbPromise;
}
function idbPut(raw){openDB().then(db=>{if(!db)return;try{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(raw,SAVE)}catch(e){}})}
function idbGet(){return openDB().then(db=>new Promise(resolve=>{if(!db)return resolve(null);try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(SAVE);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(e){resolve(null)}}))}

save=function(){
  let raw;
  try{raw=JSON.stringify(state)}catch(e){return false}
  let localOK=false;
  try{localStorage.setItem(SAVE,raw);localOK=true}catch(e){}
  idbPut(raw);
  window.__blLastSave=Date.now();
  const dot=document.querySelector('.saveState');
  if(dot){dot.textContent=localOK?'SAVED':'BACKUP';dot.classList.toggle('fallback',!localOK)}
  return true;
};
window.save=save;

if(!hadLocalSave){
  idbGet().then(raw=>{
    if(!raw)return;
    try{
      const restored=JSON.parse(raw);
      if(!restored||typeof restored!=='object')return;
      state=restored;
      window.state=state;
      try{localStorage.setItem(SAVE,raw)}catch(e){}
      const apply=()=>{if(typeof render==='function'){render();toast('Recovered your saved company.')}else setTimeout(apply,80)};
      apply();
    }catch(e){}
  });
}

function backupPanel(){
  const raw=JSON.stringify(state);
  modal(`<div class="sheetHead"><div><h3>Company Save</h3><div class="small muted">Autosaves after every meaningful action.</div></div><button class="x" onclick="closeModal()">✕</button></div>
  <div class="card savePanelCard"><b>Automatic save</b><div class="small muted">Stored on this phone/browser and mirrored to a second browser database when available.</div><div class="saveState">SAVED</div></div>
  <div class="actions"><button class="btn goldbtn" id="forceSave">Save Now</button><button class="btn" id="copySave">Copy Backup</button></div>
  <div class="sectionTitle"><h3>Restore Backup</h3><span>Paste a copied save</span></div>
  <textarea id="restoreSave" class="saveText" placeholder="Paste save data here"></textarea>
  <div class="actions"><button class="btn primary" id="restoreBtn">Restore</button></div>`);
  setTimeout(()=>{
    const fs=document.getElementById('forceSave');if(fs)fs.onclick=()=>{save();toast('Company saved.')};
    const cp=document.getElementById('copySave');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(raw);toast('Backup copied.')}catch(e){const t=document.getElementById('restoreSave');if(t){t.value=raw;t.select();toast('Backup placed in the box. Copy it manually.')}}};
    const rs=document.getElementById('restoreBtn');if(rs)rs.onclick=()=>{const t=document.getElementById('restoreSave');try{const next=JSON.parse(t.value.trim());if(!next||typeof next!=='object')throw 0;state=next;window.state=state;save();closeModal();render();toast('Backup restored.')}catch(e){toast('That backup is not valid.')}};
  },0);
}
window.blBackupPanel=backupPanel;

function injectMobileControls(){
  const util=document.querySelector('.utilityButtons');
  if(util&&!util.querySelector('.saveBtn')){
    const b=document.createElement('button');b.className='soundToggle saveBtn';b.setAttribute('aria-label','Save and backup');b.title='Save & Backup';b.textContent='💾';b.onclick=e=>{e.stopPropagation();backupPanel()};util.insertBefore(b,util.firstChild);
  }
}
new MutationObserver(injectMobileControls).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(injectMobileControls,0);

const style=document.createElement('style');
style.textContent=`.saveBtn{margin-right:4px}.saveState{margin-top:8px;display:inline-block;border:1px solid #587248;background:#1a2417;color:#b7d59e;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800;letter-spacing:.08em}.saveState.fallback{border-color:#866f3c;background:#2a2214;color:#e0c27e}.saveText{width:100%;min-height:96px;background:#0e0b09;color:#e8dcc5;border:1px solid #513b2a;border-radius:10px;padding:10px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}.savePanelCard{margin-top:10px}`;
document.head.appendChild(style);
})();
