from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_7_0.py'),run_name='__main__')
marker='\nboot();\n})();'
patch=(game/'v21-8-0-grand-stage.js').read_text(encoding='utf-8')
art=game/'art'/'chapterhouse-grand.svg'
if not art.exists():
    raise SystemExit('Grand Chapterhouse scene asset missing.')
raw=art.read_text(encoding='utf-8')
if 'viewBox="0 0 1200 820"' not in raw or '<svg' not in raw:
    raise SystemExit('Invalid high-resolution Chapterhouse SVG.')
def inject(source):
    if marker not in source:raise SystemExit('Missing game boot injection point')
    return source.replace(marker,'\n\n'+patch+marker,1)
base=(game/'play'/'index.html').read_text(encoding='utf-8')
source=inject(base).replace('Grim Company v21.7.0 — Regional Command 2.0','Grim Company v21.8.0 — Grand Chapterhouse Stage')
source=source.replace('The v21.7.0 phone build loaded','The v21.8.0 phone build loaded')
required=["const GC380_VERSION='21.8.0'",'../art/chapterhouse-grand.svg','window.__GC380_TEST','chapterhouseArtExternalSvg=true']
if any(x not in source for x in required):raise SystemExit('v21.8 release markers missing')
for folder in ('play','mobile','play-2180'):
    dest=game/folder/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(source,encoding='utf-8')
    print('Built',dest,len(source))
js=Path('/tmp/broken-lantern-v9.js')
js.write_text(inject(js.read_text(encoding='utf-8')),encoding='utf-8')
print('Standalone Chapterhouse artwork',len(raw),'chars; old play-2170 preserved')
