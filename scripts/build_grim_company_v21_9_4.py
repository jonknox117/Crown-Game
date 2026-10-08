from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_9_3.py'),run_name='__main__')
marker='\nboot();\n})();'
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in
 ['v21-9-4-persistent-managers.js','v21-9-4-persistent-managers-tests.js'])
def inject(html):
 if marker not in html:raise SystemExit('Missing boot marker')
 return html.replace(marker,'\n\n'+patch+marker,1)
page=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
page=page.replace('Grim Company v21.9.3 — Five Room Leadership & Live UI','Grim Company v21.9.4 — Persistent NPC Room Managers')
page=page.replace('The v21.9.3 phone build loaded','The v21.9.4 phone build loaded')
for word in ["const GC394_VERSION='21.9.4'","window.__GC394_TEST","stanceBonusesPersistOnExpedition=true","assignedUnavailableRemoved=true"]:
 if word not in page:raise SystemExit('Missing v21.9.4 marker: '+word)
for folder in ('play','mobile','play-2194'):
 dest=game/folder/'index.html';dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(page,encoding='utf-8')
 print('Built',dest,len(page))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Previously released archives and stored saves preserved')
