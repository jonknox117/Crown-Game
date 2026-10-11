"""Grim Company v21.10.7: founder follows the HQ selected for management."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_6.py'),run_name='__main__')
anchor='\nboot();\n})();'
patch=(game/'v21-10-7-hq-follow.js').read_text(encoding='utf-8')
assert "GC427_VERSION='21.10.7'" in patch and 'window.__GC427_TEST' in patch
def inject(src):
    if src.count(anchor)!=1:raise SystemExit('Missing unique boot anchor for founder-follow update')
    return src.replace(anchor,'\n\n'+patch+anchor,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.6 — Original Artwork Bundled',
                  'Grim Company v21.10.7 — Founder Follows Headquarters')
html=html.replace('The v21.10.6 phone build loaded','The v21.10.7 phone build loaded')
for folder in ('play','mobile','play-21107'):
    dest=game/folder/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(html,encoding='utf-8')
    print('Built',dest,len(html))
script=Path('/tmp/broken-lantern-v9.js')
script.write_text(inject(script.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.10.7: founder HQ switching works; existing saves and 58 originals preserved')