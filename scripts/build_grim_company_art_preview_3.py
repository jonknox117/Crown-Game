"""Build independent Grim Company portrait preview without changing production saves."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_art_preview_2.py'),run_name='__main__')
marker='\nboot();\n})();'
source=(game/'play-art-preview-2'/'index.html').read_text(encoding='utf-8')
patch=(game/'v21-art-preview-3-portraits.js').read_text(encoding='utf-8')
if source.count(marker)!=1:raise RuntimeError('Missing boot marker')
html=source.replace(marker,'\n\n'+patch+marker,1)
html=html.replace('Grim Company — Eight Scenes and Portrait Architecture Preview 2','Grim Company — Curated Portrait Library Preview 3')
for required in ("GC423_VERSION='portrait-library-1'","window.__GC423_TEST","gc423ImportBatch"):
 if required not in html:raise RuntimeError('Missing preview marker '+required)
out=game/'play-art-preview-3'/'index.html'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(html,encoding='utf-8')
Path('/tmp/grim-art-preview-3.js').write_text(patch,encoding='utf-8')
print('Built',out,len(html),'bytes. Unchanged production save namespace.')
