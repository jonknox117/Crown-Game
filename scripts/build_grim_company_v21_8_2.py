from pathlib import Path
from xml.etree import ElementTree
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_8_1.py'),run_name='__main__')
marker='\nboot();\n})();'
patches=['v21-8-2-dungeon-recovery.js','v21-8-2-dungeon-tests.js']
code='\n\n'.join((game/p).read_text(encoding='utf-8') for p in patches)
def inject(x):
 if marker not in x:raise SystemExit('Missing insertion point')
 return x.replace(marker,'\n\n'+code+marker,1)
for asset in (game/'art').glob('*-grand.svg'):
 raw=asset.read_text(encoding='utf-8')
 ElementTree.fromstring(raw)
 if '@keyframes flicker' not in raw:
  raise SystemExit('Flicker animation missing from '+asset.name)
 block=raw.split('@keyframes flicker{',1)[1].split('@keyframes',1)[0]
 if 'transform:' in block:raise SystemExit('Unanchored flame transform found in '+asset.name)
 if '@keyframes banner{' in raw and 'transform:' in raw.split('@keyframes banner{',1)[1].split('@keyframes',1)[0]:
  raise SystemExit('Unanchored banner transform found in '+asset.name)
 if '@keyframes wave{' in raw and 'transform:' in raw.split('@keyframes wave{',1)[1].split('@keyframes',1)[0]:
  raise SystemExit('Unanchored banner transform found in '+asset.name)
 print('Anchored flame verified:',asset.name)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.8.1 — Multi-Scene Grand Stage','Grim Company v21.8.2 — Dungeon Recovery & Art Stability')
html=html.replace('The v21.8.1 phone build loaded','The v21.8.2 phone build loaded')
required=["const GC382_VERSION='21.8.2'",'data-action="gc382DungeonWithdraw"',"window.__GC382_TEST",'gc382InlineDecision']
if any(x not in html for x in required):raise SystemExit('Missing dungeon recovery markers')
for folder in ('play','mobile','play-2182'):
 path=game/folder/'index.html'
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(html,encoding='utf-8')
 print('Built',path,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Archives retained through 21.8.1')
