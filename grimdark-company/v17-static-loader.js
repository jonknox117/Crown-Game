/* Broken Lantern v17 static Pages loader.
   Recreates the phone bundle in-browser so deployment needs no GitHub Actions build step. */
(function(){
'use strict';

const BASE='../';
const CORE=[
  'v9-a.js','v9-b.js','v9-c.js','v9-d1.js','v9-d2.js','v9-d3.js',
  'v9-d4.js','v9-e1.js','v9-e2.js','v9-f1.js'
];
const INJECT=[
  'v10.js','v10-hotfix.js','v14-gameplay.js','v15-svg-portraits.js',
  'v16-living-company.js','v17-career-svg.js'
];
const FINAL='v9-f2.js';

function esc(s){return String(s||'Unknown startup error').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function fail(msg){
  const app=document.getElementById('app');
  if(!app)return;
  app.innerHTML='<div style="max-width:560px;margin:24px auto;padding:18px;background:#18130f;border:1px solid #6a4930;border-radius:8px;color:#efe4cc;font-family:Georgia,serif"><h2 style="margin-top:0">The ledger failed to open.</h2><p style="color:#c2b29a;line-height:1.45">The static v17 files loaded, but the game engine failed to start. Your saved company has not been erased.</p><button onclick="location.reload()" style="width:100%;padding:13px;border-radius:3px;border:1px solid #8c593c;background:#6e3225;color:white;font-weight:700">Reload Game</button><details style="margin-top:12px;color:#9e8c76"><summary>Technical detail</summary><pre style="white-space:pre-wrap">'+esc(msg)+'</pre></details></div>';
}
async function get(name){
  const r=await fetch(BASE+name+'?v=17',{cache:'no-store'});
  if(!r.ok)throw new Error(name+' failed to load ('+r.status+')');
  return r.text();
}
async function start(){
  try{
    const [coreTexts,injectTexts,f2]=await Promise.all([
      Promise.all(CORE.map(get)),
      Promise.all(INJECT.map(get)),
      get(FINAL)
    ]);
    const needle='\nboot();\n})();';
    if(!f2.includes(needle))throw new Error('Could not locate Broken Lantern boot marker.');
    const injection=injectTexts.join('\n\n');
    const tail=f2.replace(needle,'\n\n'+injection+'\n\nboot();\n})();');
    const js=coreTexts.join('')+tail;
    const required=['brokenLanternCanonical_v9','BL15_CULTURE_COLORS','livingCompany','BL17_CAREER','bl17EnemySvg','v17CareerRarity'];
    const missing=required.filter(x=>!js.includes(x));
    if(missing.length)throw new Error('v17 bundle missing: '+missing.join(', '));
    (0,eval)(js+'\n//# sourceURL=broken-lantern-v17-static.js');
    window.__BL_STATIC_V17=true;
    setTimeout(()=>{
      if(!document.querySelector('.topbar')&&!document.querySelector('.startPanel'))fail('Startup timed out after bundle evaluation.');
    },4500);
  }catch(e){
    console.error(e);
    fail(e&&e.stack?e.stack:e);
  }
}
window.addEventListener('error',e=>{if(!document.querySelector('.topbar')&&!document.querySelector('.startPanel'))fail(e.message);});
window.addEventListener('unhandledrejection',e=>{if(!document.querySelector('.topbar')&&!document.querySelector('.startPanel'))fail(e.reason);});
start();
})();
