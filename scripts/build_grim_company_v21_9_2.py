from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_9_1.py'),run_name='__main__')
marker='\nboot();\n})();'
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in
    ['v21-9-2-freeblade-home.js','v21-9-2-tests.js'])
def inject(base):
    if marker not in base:raise SystemExit('Missing injection point')
    return base.replace(marker,'\n\n'+patch+marker,1)
page=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
page=page.replace('Grim Company v21.9.1 — Chapterhouse Bonus Clarity','Grim Company v21.9.2 — Freeblade Chapterhouse Leadership')
page=page.replace('The v21.9.1 phone build loaded','The v21.9.2 phone build loaded')
for key in ["const GC392_VERSION='21.9.2'","window.__GC392_TEST","freebladeHomeBenefitAppliedToWork=true"]:
    if key not in page:raise SystemExit('Missing v21.9.2 feature: '+key)
for loc in ('play','mobile','play-2192'):
    p=game/loc/'index.html'
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(page,encoding='utf-8')
    print('Built',p,len(page))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Old saves and all archives preserved')
