"""Build an isolated preview of all eight environments + curated portrait architecture."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_art_preview_1.py'),run_name='__main__')
marker='\nboot();\n})();'
base=(game/'play-art-preview-1'/'index.html').read_text(encoding='utf-8')
patch=(game/'v21-art-preview-2.js').read_text(encoding='utf-8')
if base.count(marker)!=1:raise RuntimeError('Expected one boot marker')
html=base.replace(marker,'\n\n'+patch+marker,1)
html=html.replace('Grim Company — Art Preview 1','Grim Company — Eight Scenes and Portrait Architecture Preview 2')
for token in ["GC421_VERSION='art-preview-2'","GC422_VERSION='portrait-architecture-1'","window.__GC421_TEST","window.__GC422_TEST"]:
 if token not in html:raise RuntimeError('Missing: '+token)
dest=game/'play-art-preview-2'/'index.html'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(html,encoding='utf-8')
Path('/tmp/grim-art-preview-2.js').write_text(patch,encoding='utf-8')
print('Built',dest,len(html),'bytes; current production saves/build unchanged')
