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
    'v19-4.css'
]
patch_files = [
    'v10.js','v10-hotfix.js','v14-gameplay.js','v15-svg-portraits.js',
    'v16-living-company.js','v17-career-svg.js','v18-living-veterans.js',
    'v18-mechanics-audit.js','v19-polish.js','v19-polish-2.js',
    'v19-stability.js','v19-stability-2.js','v19-stability-checks.js',
    'v19-3-grim-company.js','v19-3-clarity.js','v19-3-time-hotfix.js',
    'v19-3-hardening.js','v19-3-integration.js','v19-3-runtime-fix.js',
    'v19-4-consequences.js'
]

css = '\n\n'.join((game / name).read_text(encoding='utf-8') for name in css_files).replace('</style>', '<\\/style>')

base_parts = []
for name in parts:
    text = (game / name).read_text(encoding='utf-8')
    if name == 'v9-b.js':
        # Startup must never wait forever on IndexedDB. Safari private/embedded
        # contexts and headless browsers can leave open/get requests pending.
        # LocalStorage remains the first save source; this only makes the backup
        # database fail soft without deleting or mutating any saved company.
        old_open = "function idbOpen(name='brokenLanternCanonical'){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}"
        new_open = "const BL_IDB_BOOT_TIMEOUT_MS=2000;\nfunction idbOpen(name='brokenLanternCanonical'){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);let settled=false,timer=null;const finish=v=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);resolve(v)};timer=setTimeout(()=>finish(null),BL_IDB_BOOT_TIMEOUT_MS);try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};r.onsuccess=()=>finish(r.result);r.onerror=()=>finish(null);r.onblocked=()=>finish(null)}catch(e){finish(null)}})}"
        old_get = "async function idbGet(key=SAVE_KEY,name='brokenLanternCanonical'){const db=await idbOpen(name);if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}"
        new_get = "async function idbGet(key=SAVE_KEY,name='brokenLanternCanonical'){const db=await idbOpen(name);if(!db)return null;return new Promise(resolve=>{let settled=false,timer=null;const finish=v=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);resolve(v)};timer=setTimeout(()=>finish(null),BL_IDB_BOOT_TIMEOUT_MS);try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);r.onsuccess=()=>finish(r.result||null);r.onerror=()=>finish(null);tx.onabort=()=>finish(null);tx.onerror=()=>finish(null)}catch(e){finish(null)}})}"
        if old_open not in text or old_get not in text:
            raise SystemExit('Broken Lantern persistence bootstrap no longer matches expected source; refusing an unsafe build patch.')
        text = text.replace(old_open, new_open, 1).replace(old_get, new_get, 1)
    base_parts.append(text)
base_js = ''.join(base_parts)

f2 = (game / 'v9-f2.js').read_text(encoding='utf-8')
patches = []
for name in patch_files:
    text = (game / name).read_text(encoding='utf-8')
    if name == 'v15-svg-portraits.js':
        # The v15 renderer used to replace a v11 raster declaration. The modern
        # bundle omits that raster module, so it must declare itself in strict mode.
        text = text.replace('\nblPortraitHTML=function', '\nvar blPortraitHTML=function', 1)
        if '\nblPortraitHTML=function' in text:
            raise SystemExit('Broken Lantern SVG portrait renderer is still undeclared.')
    patches.append(text)

needle = '\nboot();\n})();'
if needle not in f2:
    raise SystemExit('Could not locate Broken Lantern boot marker for v19.4 injection.')
injection = '\n\n'.join(patches)
f2 = f2.replace(needle, '\n\n' + injection + '\n\nboot();\n})();', 1)
js = (base_js + f2).replace('</script>', '<\\/script>')

required = [
    'brokenLanternCanonical_v9', 'FOUND COMPANY', 'The Shattered Firmament',
    'Prosperity', 'Stability', 'Threat', '__BL_AUDIT',
    'var blPortraitHTML=function', 'BL17_CAREER', 'BL18_MECHANICS_AUDIT',
    "const BL19_STABILITY='19.2'", "const GC193_VERSION='19.3'",
    'function gc193AdvanceDay', 'function gc193HealAdventurer',
    'function gc193PatrolRegion', 'function gc193ScoutRegion',
    "const GC193_HARDENING='19.3.1'", "const GC193_INTEGRATION='19.3.3'",
    "const GC193_RUNTIME_FIX='19.3.2'", 'function gc193RuntimeCheck',
    "const GC194_VERSION='19.4'", 'GC194_MAX_LEVEL=20',
    'function gc194EncounterChance', 'function gc194InitPayroll',
    'chooseStartingRegion=true', 'individualPayroll=true',
    'BL_IDB_BOOT_TIMEOUT_MS=2000'
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit('Broken Lantern v19.4 build missing required markers: ' + ', '.join(missing))

for forbidden in ('BL_ART_DATA', 'characters.webp?v=13', 'environments.webp?v=13', 'caches.webp?v=13'):
    if forbidden in js:
        raise SystemExit('Broken Lantern v19.4 unexpectedly contains raster gameplay art marker: ' + forbidden)

preboot = r'''(function(){
  var failed=false;
  function showFailure(msg){
    var app=document.getElementById('app');
    if(!app || document.querySelector('.topbar') || document.querySelector('.startPanel') || failed) return;
    failed=true;
    var detail=String(msg||'Unknown startup error').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});
    app.innerHTML='<div style="max-width:560px;margin:24px auto;padding:18px;background:#18130f;border:1px solid #6a4930;border-radius:8px;color:#efe4cc;font-family:Georgia,serif"><h2 style="margin-top:0">The ledger failed to open.</h2><p style="color:#c2b29a;line-height:1.45">The v19.4 phone build loaded, but the game engine failed to start. Your saved company has not been intentionally erased.</p><button onclick="location.reload()" style="width:100%;padding:13px;border-radius:3px;border:1px solid #8c593c;background:#6e3225;color:white;font-weight:700">Reload Game</button><details style="margin-top:12px;color:#9e8c76"><summary>Technical detail</summary><pre style="white-space:pre-wrap">'+detail+'</pre></details></div>';
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
<title>The Broken Lantern — Grim Company v19.4</title>
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

for dirname in ('mobile', 'play', 'play-1934'):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(html, encoding='utf-8')
    print(f'Built {out / "index.html"} ({len(html)} bytes)')

Path('/tmp/broken-lantern-v9.js').write_text(js, encoding='utf-8')
