from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_1.py'),run_name='__main__')
marker='\nboot();\n})();'
pieces=['v21-10-2-live-qol.js','v21-10-2-live-tests.js']
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in pieces)
def inject(source):
 if marker not in source:raise SystemExit('Missing boot marker')
 return source.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.1 — Signed Recruit Availability','Grim Company v21.10.2 — Live Progress QoL')
html=html.replace('The v21.10.1 phone build loaded','The v21.10.2 phone build loaded')
for required in ["const GC412_VERSION='21.10.2'",'window.__GC412_TEST','gc412PatchScreen','gc412PatchModal']:
 if required not in html:raise SystemExit('Missing v21.10.2 marker: '+required)
for name in ('play','mobile','play-21102'):
 output=game/name/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(html,encoding='utf-8')
 print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.10.1 and all previous release archives preserved; save keys unchanged')
