from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_0.py'),run_name='__main__')
marker='\nboot();\n})();'
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in (
 'v21-10-1-signed-recruits.js','v21-10-1-tests.js'))
def inject(source):
 if marker not in source:raise SystemExit('Missing boot marker')
 return source.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.0 — Combat Identity & Active Play','Grim Company v21.10.1 — Signed Recruit Availability')
html=html.replace('The v21.10.0 phone build loaded','The v21.10.1 phone build loaded')
for needle in ("const GC411_VERSION='21.10.1'",'window.__GC411_TEST','gc411RepairSignedPeople'):
 if needle not in html:raise SystemExit('Missing v21.10.1 marker: '+needle)
for folder in ('play','mobile','play-21101'):
 output=game/folder/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(html,encoding='utf-8')
 print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.10.0 and earlier release archives preserved; save keys unchanged')
