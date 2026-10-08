from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_9_0.py'),run_name='__main__')
marker='\nboot();\n})();'
patches=['v21-9-1-chapterhouse-bonus.js','v21-9-1-chapterhouse-tests.js']
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in patches)
def inject(source):
    if marker not in source:raise SystemExit('Missing game boot point')
    return source.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.9.0 — HQ Command & Roadmaster Pace','Grim Company v21.9.1 — Chapterhouse Bonus Clarity')
html=html.replace('The v21.9.0 phone build loaded','The v21.9.1 phone build loaded')
for required in ["const GC391_VERSION='21.9.1'","window.__GC391_TEST","gc391HomePresence","gc391Bonus"]:
    if required not in html:raise SystemExit('Missing v21.9.1 marker: '+required)
for folder in ('play','mobile','play-2191'):
    dest=game/folder/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(html,encoding='utf-8')
    print('Built',dest,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Legacy versions play-2190 and older preserved')
