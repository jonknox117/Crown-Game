from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_9_2.py'),run_name='__main__')
marker='\nboot();\n})();'
patch='\n\n'.join((game/name).read_text(encoding='utf-8') for name in [
 'v21-9-3-room-leadership.js','v21-9-3-live-numbers.js','v21-9-3-tests.js'])
def inject(source):
 if marker not in source:raise SystemExit('Missing JS boot insertion')
 return source.replace(marker,'\n\n'+patch+marker,1)
source=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
source=source.replace('Grim Company v21.9.2 — Freeblade Chapterhouse Leadership','Grim Company v21.9.3 — Five Room Leadership & Live UI')
source=source.replace('The v21.9.2 phone build loaded','The v21.9.3 phone build loaded')
for check in ["const GC393_VERSION='21.9.3'","GC393_LIVE_VERSION='21.9.3'","window.__GC393_TEST","roomManagerPickerOnTownMap=true","liveStanceProgressBars=true"]:
 if check not in source:raise SystemExit('Missing v21.9.3 marker: '+check)
for folder in ('play','mobile','play-2193'):
 dest=game/folder/'index.html';dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(source,encoding='utf-8')
 print('Built',dest,len(source))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Retained all earlier play archives and existing save keys')
