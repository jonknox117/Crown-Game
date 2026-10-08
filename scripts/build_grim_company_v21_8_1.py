from pathlib import Path
from xml.etree import ElementTree
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_8_0.py'),run_name='__main__')
marker='\nboot();\n})();'
patch=(game/'v21-8-1-scene-router.js').read_text(encoding='utf-8')
assets=['chapterhouse-grand.svg','market-grand.svg','muster-yard-grand.svg','march-watch-grand.svg','pilgrim-house-grand.svg','jobs-board-grand.svg','armory-grand.svg','world-map-grand.svg']
for asset in assets:
    path=game/'art'/asset
    raw=path.read_text(encoding='utf-8')
    doc=ElementTree.fromstring(raw)
    if doc.attrib.get('viewBox')!='0 0 1200 820' or doc.attrib.get('width')!='1200' or doc.attrib.get('height')!='820':
        raise SystemExit('Invalid art canvas: '+asset)
    if len(raw)<8000:
        raise SystemExit('Low-detail SVG, rejected: '+asset)
    if 'data:image/' in raw or 'base64,' in raw or '<image' in raw:
        raise SystemExit('Embedded/compressed sprite rejected: '+asset)
    print('Vector scene OK',asset,len(raw),'bytes')
def inject(html):
    if marker not in html:raise SystemExit('Missing scene router boot insertion point')
    return html.replace(marker,'\n\n'+patch+marker,1)
base=(game/'play'/'index.html').read_text(encoding='utf-8')
html=inject(base).replace('Grim Company v21.8.0 — Grand Chapterhouse Stage','Grim Company v21.8.1 — Multi-Scene Grand Stage')
html=html.replace('The v21.8.0 phone build loaded','The v21.8.1 phone build loaded')
for key in ["const GC381_VERSION='21.8.1'","window.__GC381_TEST","gc381ResolveScene","market-grand.svg","jobs-board-grand.svg","world-map-grand.svg"]:
    if key not in html:raise SystemExit('Required multi-scene marker missing: '+key)
for folder in ('play','mobile','play-2181'):
    output=game/folder/'index.html'
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(html,encoding='utf-8')
    print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Archives play-2180 and all older versions remain.')
