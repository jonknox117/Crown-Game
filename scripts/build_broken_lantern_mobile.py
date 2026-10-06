from pathlib import Path

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

parts = [
    'v9-a.js','v9-b.js','v9-c.js','v9-d1.js','v9-d2.js','v9-d3.js',
    'v9-d4.js','v9-e1.js','v9-e2.js','v9-f1.js'
]
css_files = [
    'v9.css','v10.css','v11.css','v14.css','v15.css','v16.css','v17.css',
    'v18.css','v19.css','v19-2.css','v19-stability.css','v19-3-grim-company.css',
    'v19-4.css','v19-5.css','v19-9.css','v20.css','v20-1.css'
]
patch_files = [
    'v10.js','v10-hotfix.js','v14-gameplay.js','v15-svg-portraits.js',
    'v16-living-company.js','v17-career-svg.js','v18-living-veterans.js',
    'v18-mechanics-audit.js','v19-polish.js','v19-polish-2.js',
    'v19-stability.js','v19-stability-2.js','v19-stability-checks.js',
    'v19-3-grim-company.js','v19-3-clarity.js','v19-3-time-hotfix.js',
    'v19-3-hardening.js','v19-3-integration.js','v19-3-runtime-fix.js',
    'v19-4-consequences.js','v19-5-relationships.js','v19-9-time-qol.js',
    'v20-hello-world.js','v20-00-hotfix.js','v20-1-idle-company.js',
    'v20-1-stabilization.js','v20-1-balance.js','v20-3-world-pressure.js',
    'v20-4-campaigns-1.js','v20-4-campaigns-2.js','v20-4-campaigns-3.js',
    'v20-4-campaigns-4.js','v20-5-field-encounters.js','v20-6-founder.js'
]

css = '\n\n'.join((game / name).read_text(encoding='utf-8') for name in css_files).replace('</style>', '<\\/style>')

base_parts = []
for name in parts:
    text = (game / name).read_text(encoding='utf-8')
    if name == 'v9-b.js':
        old_open = "function idbOpen(name='brokenLanternCanonical'){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}"
        new_open = "const BL_IDB_BOOT_TIMEOUT_MS=2000;\nfunction idbOpen(name='brokenLanternCanonical'){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);let settled=false,timer=null;const finish=v=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);resolve(v)};timer=setTimeout(()=>finish(null),BL_IDB_BOOT_TIMEOUT_MS);try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};r.onsuccess=()=>finish(r.result);r.onerror=()=>finish(null);r.onblocked=()=>finish(null)}catch(e){finish(null)}})}"
        old_get = "async function idbGet(key=SAVE_KEY,name='brokenLanternCanonical'){const db=await idbOpen(name);if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}"
        new_get = "async function idbGet(key=SAVE_KEY,name='brokenLanternCanonical'){const db=await idbOpen(name);if(!db)return null;return new Promise(resolve=>{let settled=false,timer=null;const finish=v=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);resolve(v)};timer=setTimeout(()=>finish(null),BL_IDB_BOOT_TIMEOUT_MS);try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);r.onsuccess=()=>finish(r.result||null);r.onerror=()=>finish(null);tx.onabort=()=>finish(null);tx.onerror=()=>finish(null)}catch(e){finish(null)}})}"
        if old_open not in text or old_get not in text:
            raise SystemExit('Persistence bootstrap no longer matches expected source; refusing unsafe build.')
        text = text.replace(old_open, new_open, 1).replace(old_get, new_get, 1)
    base_parts.append(text)
base_js = ''.join(base_parts)

f2 = (game / 'v9-f2.js').read_text(encoding='utf-8')
patches = []
for name in patch_files:
    text = (game / name).read_text(encoding='utf-8')
    if name == 'v15-svg-portraits.js':
        text = text.replace('\nblPortraitHTML=function', '\nvar blPortraitHTML=function', 1)
        if '\nblPortraitHTML=function' in text:
            raise SystemExit('SVG portrait renderer is still undeclared.')
    patches.append(text)

needle = '\nboot();\n})();'
if needle not in f2:
    raise SystemExit('Could not locate boot marker for v20.6 injection.')
f2 = f2.replace(needle, '\n\n' + '\n\n'.join(patches) + '\n\nboot();\n})();', 1)
js = (base_js + f2).replace('</script>', '<\\/script>')

required = [
    'brokenLanternCanonical_v9','FOUND COMPANY','The Shattered Firmament','__BL_AUDIT',
    'var blPortraitHTML=function','BL_IDB_BOOT_TIMEOUT_MS=2000',
    "const GC194_VERSION='19.4'","const GC195_VERSION='19.5'","const GC199_VERSION='19.9'",
    "const GC200_VERSION='20.00'","const GC201_VERSION='20.1'","const GC220_VERSION='20.2'",
    "const GC230_VERSION='20.3'","const GC240_VERSION='20.4'","const GC250_VERSION='20.5'",
    "const GC260_VERSION='20.6'",
    'riskThreatSeparated=true','regionalCampaigns=true','fixedRiskLadder=true',
    'guaranteedFieldCheck=true','animatedFieldChecks=true','meaningfulFieldConsequences=true',
    'playerCharacterIsRosterMember=true','founderCharacterCreation=true','modularPortraitSelection=true',
    'youTab=true','founderPhysicalLocation=true','founderTravel=true','personalTraining=true',
    'directCommandExpeditions=true','companyContinuesDuringFounderDecision=true',
    'founderNoPlotArmor=true','existingSaveFounderMigration=true',
    '__GC230_TEST','__GC240_TEST','__GC250_TEST','__GC260_TEST'
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit('Grim Company v20.6 build missing markers: ' + ', '.join(missing))

for forbidden in ('BL_ART_DATA','characters.webp?v=13','environments.webp?v=13','caches.webp?v=13'):
    if forbidden in js:
        raise SystemExit('v20.6 unexpectedly contains raster gameplay art marker: ' + forbidden)

preboot = r'''(function(){
  var failed=false;
  function showFailure(msg){
    var app=document.getElementById('app');
    if(!app || document.querySelector('.topbar') || document.querySelector('.startPanel') || failed) return;
    failed=true;
    var detail=String(msg||'Unknown startup error').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});
    app.innerHTML='<div style="max-width:560px;margin:24px auto;padding:18px;background:#18130f;border:1px solid #6a4930;border-radius:8px;color:#efe4cc;font-family:Georgia,serif"><h2 style="margin-top:0">The ledger failed to open.</h2><p style="color:#c2b29a;line-height:1.45">The v20.6 phone build loaded, but the game engine failed to start. Your saved company has not been intentionally erased.</p><button onclick="location.reload()" style="width:100%;padding:13px;border-radius:3px;border:1px solid #8c593c;background:#6e3225;color:white;font-weight:700">Reload Game</button><details style="margin-top:12px;color:#9e8c76"><summary>Technical detail</summary><pre style="white-space:pre-wrap">'+detail+'</pre></details></div>';
  }
  window.addEventListener('error',function(e){setTimeout(function(){showFailure(e.message)},0)});
  window.addEventListener('unhandledrejection',function(e){setTimeout(function(){showFailure(e.reason)},0)});
  setTimeout(function(){if(!document.querySelector('.topbar')&&!document.querySelector('.startPanel'))showFailure('Startup timed out.')},6500);
})();'''

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no" />
<meta name="theme-color" content="#08090a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="format-detection" content="telephone=no" />
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<title>Grim Company v20.6 — The Founder</title>
<style>{css}</style>
</head>
<body>
<div id="app"></div>
<div class="bottomnav"><div class="inner" id="nav"></div></div>
<div class="modal" id="modal"><div class="sheet" id="sheet"></div></div>
<div class="toast" id="toast"></div>
<script>{preboot}</script>
<script>{js}</script>
</body>
</html>'''

for dirname in ('mobile','play','play-1934','play-199','play-200','play-201','play-2012','play-203','play-204','play-205','play-206'):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(html, encoding='utf-8')
    print(f'Built {out / "index.html"} ({len(html)} bytes)')

Path('/tmp/broken-lantern-v9.js').write_text(js, encoding='utf-8')
