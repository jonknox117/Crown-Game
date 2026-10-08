from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_3.py'),run_name='__main__')
marker='\nboot();\n})();'
files=['v21-10-4-casualty-replacement.js','v21-10-4-tests.js']
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in files)
def inject(s):
 if marker not in s:raise SystemExit('Missing boot anchor')
 return s.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.3 — Automatic Party Management','Grim Company v21.10.4 — Casualty Replacement')
html=html.replace('The v21.10.3 phone build loaded','The v21.10.4 phone build loaded')
for needle in ["const GC414_VERSION='21.10.4'",'window.__GC414_TEST','gc414HireReplacement','gc414DeathRecord']:
 if needle not in html:raise SystemExit('Missing v21.10.4 marker '+needle)
for name in ('play','mobile','play-21104'):
 output=game/name/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(html,encoding='utf-8')
 print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Historical release archives and existing save keys preserved')
