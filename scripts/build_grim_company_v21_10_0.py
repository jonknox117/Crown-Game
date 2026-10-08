from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_9_5.py'),run_name='__main__')
marker='\nboot();\n})();'
pieces=[
 'v21-10-0-passives.js',
 'v21-10-0-ultimates.js',
 'v21-10-0-combat-ui.js',
 'v21-10-0-tests.js',
]
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in pieces)
def inject(s):
 if marker not in s:raise SystemExit('Game boot insertion point missing')
 return s.replace(marker,'\n\n'+patch+marker,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.9.5 — Loot & Chests Restored','Grim Company v21.10.0 — Combat Identity & Active Play')
html=html.replace('The v21.9.5 phone build loaded','The v21.10.0 phone build loaded')
required=[
 "const GC410_VERSION='21.10.0'","window.__GC410_TEST",
 "const GC410_PASSIVES=","const GC410_ULTIMATE_DETAILS=",
 "GC410_STRIKE_COOLDOWN_MS=1400","playerOnlyManualEnemyTap=true",
 "gc410MountContext()"
]
for key in required:
 if key not in html:raise SystemExit('Missing v21.10.0 release marker: '+key)
for folder in ('play','mobile','play-21100'):
 output=game/folder/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(html,encoding='utf-8')
 print('Built',output,len(html))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('v21.9.5 and all earlier release archives preserved; save keys unchanged')
