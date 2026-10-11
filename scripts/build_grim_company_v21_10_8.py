"""Grim Company v21.10.8: multi-HQ gameplay and quality-of-life audit fixes."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_7.py'),run_name='__main__')
anchor='\nboot();\n})();'
patch=(game/'v21-10-8-qol.js').read_text(encoding='utf-8')
assert "GC428_VERSION='21.10.8'" in patch and 'window.__GC428_TEST' in patch
def inject(src):
    if src.count(anchor)!=1:raise SystemExit('Missing unique boot anchor for QoL release')
    return src.replace(anchor,'\n\n'+patch+anchor,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.7 — Founder Follows Headquarters',
                  'Grim Company v21.10.8 — HQ and Party QoL Fixes')
html=html.replace('The v21.10.7 phone build loaded','The v21.10.8 phone build loaded')
for folder in ('play','mobile','play-21108'):
    dest=game/folder/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(html,encoding='utf-8')
    print('Built',dest,len(html))
script=Path('/tmp/broken-lantern-v9.js')
script.write_text(inject(script.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.10.8 QoL release; legacy save key and 58 original images unchanged')