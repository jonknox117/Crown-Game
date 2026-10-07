from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_6_0.py'),run_name='__main__')
marker='\nboot();\n})();'
patches=[
 'v21-7-0-management-policies.js',
 'v21-7-0-management-operations.js',
 'v21-7-0-management-field.js',
 'v21-7-0-management-ui.js',
 'v21-7-0-management-tests.js',
]
patch='\n\n'.join((game/p).read_text(encoding='utf-8') for p in patches)
def inject(source):
 if marker not in source:raise SystemExit('Missing v21.7 injection point')
 return source.replace(marker,'\n\n'+patch+marker,1)
base=(game/'play'/'index.html').read_text(encoding='utf-8')
source=inject(base).replace('Grim Company v21.6.0 — Career & Tactical Combat','Grim Company v21.7.0 — Regional Command 2.0')
source=source.replace('The v21.6.0 phone build loaded','The v21.7.0 phone build loaded')
markers=["const GC370_VERSION='21.7.0'","window.__GC370_TEST", 'managerStandingOrders=true','managerApprovalsAndTreasuryReserve=true','managerLevelMilestoneBenefits=true','managerRarityBenefits=true']
missing=[x for x in markers if x not in source]
if missing:raise SystemExit('Missing v21.7 markers: '+repr(missing))
for dir in ('mobile','play','play-2170'):
 out=game/dir/'index.html'
 out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(source,encoding='utf-8')
 print('Built v21.7',out,len(source))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Retained v21.6 archive')
