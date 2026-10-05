from pathlib import Path

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'
parts = [
    'v9-a.js','v9-b.js','v9-c.js','v9-d1.js','v9-d2.js','v9-d3.js',
    'v9-d4.js','v9-e1.js','v9-e2.js','v9-f1.js'
]
css = ((game / 'v9.css').read_text(encoding='utf-8') + '\n\n' + (game / 'v10.css').read_text(encoding='utf-8')).replace('</style>', '<\\/style>')
base_js = ''.join((game / name).read_text(encoding='utf-8') for name in parts)
f2 = (game / 'v9-f2.js').read_text(encoding='utf-8')
v10 = (game / 'v10.js').read_text(encoding='utf-8')
v10_hotfix = (game / 'v10-hotfix.js').read_text(encoding='utf-8')
needle = '\nboot();\n})();'
if needle not in f2:
    raise SystemExit('Could not locate Broken Lantern boot marker for v10 injection.')
f2 = f2.replace(needle, '\n\n' + v10 + '\n\n' + v10_hotfix + '\n\nboot();\n})();', 1)
js = (base_js + f2).replace('</script>', '<\\/script>')

required = [
    'brokenLanternCanonical_v9', 'FOUND COMPANY', 'The Veyric Marches',
    'The Skeld Coast', 'The Hoshin Provinces', 'The Redveld of Nambara',
    'The Shattered Firmament', 'Common', 'Legendary', 'Game Menu', 'New Game',
    'Prosperity', 'Stability', 'Threat', '__BL_AUDIT',
    'REGION_ECOLOGY', 'FOUNDER’S MUSTER', 'LEGENDARY THREAT',
    'Storm Bird', 'Fallen Seraph', 'partyDanger', 'decorateNoEmoji',
    'retreatSystem', 'captureSystem', 'audioGainTargets'
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit('Broken Lantern v10 build missing required markers: ' + ', '.join(missing))

preboot = r'''(function(){
  var failed=false;
  function showFailure(msg){
    var app=document.getElementById('app');
    if(!app || document.querySelector('.topbar') || document.querySelector('.startPanel') || failed) return;
    failed=true;
    var detail=String(msg||'Unknown startup error').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});
    app.innerHTML='<div style="max-width:560px;margin:24px auto;padding:18px;background:#18130f;border:1px solid #6a4930;border-radius:8px;color:#efe4cc;font-family:Georgia,serif"><h2 style="margin-top:0">The ledger failed to open.</h2><p style="color:#c2b29a;line-height:1.45">The phone build loaded, but the game engine failed to start. Your saved company has not been intentionally erased.</p><button onclick="location.reload()" style="width:100%;padding:13px;border-radius:3px;border:1px solid #8c593c;background:#6e3225;color:white;font-weight:700">Reload Game</button><details style="margin-top:12px;color:#9e8c76"><summary>Technical detail</summary><pre style="white-space:pre-wrap">'+detail+'</pre></details></div>';
  }
  window.addEventListener('error',function(e){setTimeout(function(){showFailure(e.message)},0)});
  window.addEventListener('unhandledrejection',function(e){setTimeout(function(){showFailure(e.reason)},0)});
  setTimeout(function(){if(!document.querySelector('.topbar')&&!document.querySelector('.startPanel'))showFailure('Startup timed out.')},4000);
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
<title>The Broken Lantern — Company RPG</title>
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

for dirname in ('mobile', 'play'):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(html, encoding='utf-8')
    print(f'Built {out / "index.html"} ({len(html)} bytes)')

# Used by CI for syntax validation; this is outside the published tree.
Path('/tmp/broken-lantern-v9.js').write_text(js, encoding='utf-8')
