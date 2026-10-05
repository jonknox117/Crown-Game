from pathlib import Path

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

css_parts = [
    (game / 'style.css').read_text(encoding='utf-8'),
    (game / 'polish.css').read_text(encoding='utf-8'),
]
js_parts = [
    (game / 'core.js').read_text(encoding='utf-8'),
    (game / 'mobile-hardening.js').read_text(encoding='utf-8'),
    (game / 'ui.js').read_text(encoding='utf-8'),
    (game / 'sim.js').read_text(encoding='utf-8'),
    (game / 'polish.js').read_text(encoding='utf-8'),
    (game / 'systems-v2.js').read_text(encoding='utf-8'),
    (game / 'systems-ui-fix.js').read_text(encoding='utf-8'),
    (game / 'systems-v3-progression.js').read_text(encoding='utf-8'),
    (game / 'systems-v4-quality.js').read_text(encoding='utf-8'),
    (game / 'systems-v5-auditfix.js').read_text(encoding='utf-8'),
    (game / 'systems-v6-audio-newgame.js').read_text(encoding='utf-8'),
]

css = '\n\n'.join(css_parts).replace('</style>', '<\\/style>')
js = '\n\n;\n\n'.join(js_parts)

# Browsers expose a non-configurable window.top. The original UI helper was
# named top(), which causes global script initialization to fail on iOS/WebKit
# and Chromium. Rename the source-level occurrences in the bundled build.
js = js.replace('top()', 'blTop()')
js = js.replace('</script>', '<\\/script>')

preboot = r'''(function(){
  var failed=false;
  function showFailure(msg){
    var app=document.getElementById('app');
    if(!app || document.querySelector('.topbar') || failed) return;
    failed=true;
    var detail=String(msg||'Unknown startup error').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});
    app.innerHTML='<div class="bootFailure" style="max-width:560px;margin:24px auto;padding:18px;background:#18130f;border:1px solid #6a4930;border-radius:16px;color:#efe4cc;font-family:Georgia,serif"><h2 style="margin-top:0">The ledger failed to open.</h2><p style="color:#c2b29a;line-height:1.45">The game shell loaded, but startup failed. Your saved company has not been intentionally erased.</p><button onclick="location.reload()" style="width:100%;padding:13px;border-radius:10px;border:1px solid #8c593c;background:#6e3225;color:white;font-weight:700">Reload Game</button><details style="margin-top:12px;color:#9e8c76"><summary>Technical detail</summary><pre style="white-space:pre-wrap">'+detail+'</pre></details></div>';
  }
  window.addEventListener('error',function(e){setTimeout(function(){showFailure(e.message)},0)});
  window.addEventListener('unhandledrejection',function(e){setTimeout(function(){showFailure(e.reason)},0)});
  setTimeout(function(){if(!document.querySelector('.topbar'))showFailure('Startup timed out.')},3500);
})();'''

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no" />
<meta name="theme-color" content="#0d0b09" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="format-detection" content="telephone=no" />
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<title>The Broken Lantern Company — Phone</title>
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
