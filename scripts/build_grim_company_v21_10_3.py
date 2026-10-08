from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_2.py'),run_name='__main__')
marker='\nboot();\n})();'
files=['v21-10-3-manager-simple.js','v21-10-3-manager-tests.js']
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in files)
def inject(s):
 if marker not in s:raise SystemExit('Missing boot anchor')
 return s.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.2 — Live Progress QoL','Grim Company v21.10.3 — Automatic Party Management')
html=html.replace('The v21.10.2 phone build loaded','The v21.10.3 phone build loaded')
for required in ["const GC413_VERSION='21.10.3'",'window.__GC413_TEST','gc413Ready','gc413PickContract']:
 if required not in html:raise SystemExit('Missing v21.10.3 marker '+required)
for name in ('play','mobile','play-21103'):
 output=game/name/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(html,encoding='utf-8')
 print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('All historical release archives and existing save keys preserved')
