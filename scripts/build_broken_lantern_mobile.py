from pathlib import Path
import base64

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

# v12 hotfix: materialize the compressed art atlases as real WebP files during
# the Pages build. This avoids Safari receiving the truncated v11 data URIs.
asset_dir = game / 'assets' / 'v11'
for asset_name in ('characters', 'environments', 'icons', 'caches', 'title'):
    src = asset_dir / f'{asset_name}.b64'
    if not src.exists():
        raise SystemExit(f'Missing Broken Lantern art source: {src}')
    raw = base64.b64decode(src.read_text(encoding='utf-8').strip(), validate=True)
    dest = asset_dir / f'{asset_name}.webp'
    dest.write_bytes(raw)
    if len(raw) < 1000 or raw[:4] != b'RIFF' or raw[8:12] != b'WEBP':
        raise SystemExit(f'Invalid Broken Lantern WebP: {asset_name}')
    print(f'Built {dest} ({len(raw)} bytes)')

parts = [
    'v9-a.js','v9-b.js','v9-c.js','v9-d1.js','v9-d2.js','v9-d3.js',
    'v9-d4.js','v9-e1.js','v9-e2.js','v9-f1.js'
]
css = (
    (game / 'v9.css').read_text(encoding='utf-8') + '\n\n' +
    (game / 'v10.css').read_text(encoding='utf-8') + '\n\n' +
    (game / 'v11.css').read_text(encoding='utf-8')
).replace('</style>', '<\\/style>')
base_js = ''.join((game / name).read_text(encoding='utf-8') for name in parts)
f2 = (game / 'v9-f2.js').read_text(encoding='utf-8')
v10 = (game / 'v10.js').read_text(encoding='utf-8')
v10_hotfix = (game / 'v10-hotfix.js').read_text(encoding='utf-8')
v11_assets_a = (game / 'v11-assets-a.js').read_text(encoding='utf-8')
v11_assets_b = (game / 'v11-assets-b.js').read_text(encoding='utf-8')
v11_visuals = (game / 'v11-visuals.js').read_text(encoding='utf-8')
v11_asset_fix = (game / 'v11-asset-fix.js').read_text(encoding='utf-8')
needle = '\nboot();\n})();'
if needle not in f2:
    raise SystemExit('Could not locate Broken Lantern boot marker for v11 injection.')
injection = '\n\n'.join([v10, v10_hotfix, v11_assets_a, v11_assets_b, v11_visuals, v11_asset_fix])
f2 = f2.replace(needle, '\n\n' + injection + '\n\nboot();\n})();', 1)
js = (base_js + f2).replace('</script>', '<\\/script>')

required = [
    'brokenLanternCanonical_v9', 'FOUND COMPANY', 'The Veyric Marches',
    'The Skeld Coast', 'The Hoshin Provinces', 'The Redveld of Nambara',
    'The Shattered Firmament', 'Common', 'Legendary', 'Game Menu', 'New Game',
    'Prosperity', 'Stability', 'Threat', '__BL_AUDIT',
    'REGION_ECOLOGY', 'FOUNDER’S MUSTER', 'LEGENDARY THREAT',
    'Storm Bird', 'Fallen Seraph', 'partyDanger', 'decorateNoEmoji',
    'retreatSystem', 'captureSystem', 'audioGainTargets',
    'BL_ART_DATA', 'v11Visuals', 'v11PortraitPools', 'blPortraitHTML',
    "../assets/v11/characters.webp?v=12"
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit('Broken Lantern v12 build missing required markers: ' + ', '.join(missing))

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
