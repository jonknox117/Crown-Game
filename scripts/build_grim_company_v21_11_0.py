"""Grim Company v21.11.0 — mission objectives within existing combat and expedition engine."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_8.py'),run_name='__main__')
anchor='\nboot();\n})();'
patch=(game/'v21-11-0-missions.js').read_text(encoding='utf-8')
assert "GC430_VERSION='21.11.0'" in patch and 'window.__GC430_TEST' in patch
def inject(src):
    if src.count(anchor)!=1:raise SystemExit('Missing unique boot anchor for mission update')
    return src.replace(anchor,'\n\n'+patch+anchor,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.8 — HQ and Party QoL Fixes',
                  'Grim Company v21.11.0 — Objective-Driven Contracts')
html=html.replace('The v21.10.8 phone build loaded','The v21.11.0 phone build loaded')
for folder in ('play','mobile','play-21110'):
    dest=game/folder/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(html,encoding='utf-8')
    print('Built',dest,len(html))
script=Path('/tmp/broken-lantern-v9.js')
script.write_text(inject(script.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.11.0 mission objectives + 58 original artworks; save key unchanged')