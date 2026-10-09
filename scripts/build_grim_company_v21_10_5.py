"""Grim Company 21.10.5: original culture/race/gender portraits on the live build."""
from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_4.py'),run_name='__main__')
anchor='\nboot();\n})();'
patch=(game/'v21-10-5-portraits.js').read_text(encoding='utf-8')
assert 'GC425_VERSION' in patch and 'gc425ParseArchive' in patch

def inject(source):
    if source.count(anchor)!=1:raise SystemExit('Missing unique boot anchor for portrait release')
    return source.replace(anchor,'\n\n'+patch+anchor,1)

original=(game/'play'/'index.html').read_text(encoding='utf-8')
html=inject(original)
html=html.replace('Grim Company v21.10.4 — Casualty Replacement', 'Grim Company v21.10.5 — Original Character Portraits')
html=html.replace('The v21.10.4 phone build loaded','The v21.10.5 phone build loaded')
for expected in ('const GC425_VERSION=\'21.10.5\'', 'window.__GC425_TEST', 'grim-company-original-portraits-v1', 'gc425ParseArchive'):
    if expected not in html:raise SystemExit('Missing portrait release marker: '+expected)
for folder in ('play','mobile','play-21105'):
    path=game/folder/'index.html'
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(html,encoding='utf-8')
    print('Built',path,len(html))
script=Path('/tmp/broken-lantern-v9.js')
script.write_text(inject(script.read_text(encoding='utf-8')),encoding='utf-8')
print('Canonical save and all older release archives preserved; raster originals are not encoded into HTML')