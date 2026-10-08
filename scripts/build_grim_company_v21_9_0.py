from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_8_2.py'),run_name='__main__')
marker='\nboot();\n})();'
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in [
 'v21-9-0-hq-roadmaster.js',
 'v21-9-0-push-scroll.js',
 'v21-9-0-tests.js'])
def install(source):
 legacy='const GC201_PUSH_CAP=.80;'
 if source.count(legacy)!=1:raise SystemExit('Expected one historical 1.80x cap')
 source=source.replace(legacy,'const GC201_PUSH_CAP=1.00;')
 if marker not in source:raise SystemExit('Game boot marker not found')
 return source.replace(marker,'\n\n'+patch+marker,1)
html=install((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.8.2 — Dungeon Recovery & Art Stability','Grim Company v21.9.0 — HQ Command & Roadmaster Pace')
html=html.replace('The v21.8.2 phone build loaded','The v21.9.0 phone build loaded')
for req in ["const GC390_VERSION='21.9.0'",'GC390_PUSH_STEP=.12','window.__GC390_TEST','Roadmaster Stables','gc390HQStaffPanel']:
 if req not in html:raise SystemExit('Missing v21.9.0 feature: '+req)
for folder in ('play','mobile','play-2190'):
 dest=game/folder/'index.html';dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(html,encoding='utf-8')
 print('Built',dest,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(install(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Retained v21.8.2 and all older archives; only new release has 2x push-cap engine')
