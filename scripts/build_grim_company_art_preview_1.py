"""Build isolated playable raster-art preview WITHOUT changing production play/mobile."""
from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_4.py'),run_name='__main__')

marker='\nboot();\n})();'
src=(game/'play'/'index.html').read_text(encoding='utf-8')
# FULL SAVE ISOLATION: preview has its own localStorage and IndexedDB namespace.
# A tester can play normally here without reading, changing, or clearing the
# real Grim Company save stored by the production play/mobile builds.
storage_changes={
 "const SAVE_KEY='brokenLanternCanonical_v9';":
   "const SAVE_KEY='brokenLanternCanonical_v9_artPreview1';",
 "const LEGACY_KEY='brokenLanternDemo_v1';":
   "const LEGACY_KEY='brokenLanternDemo_v1_artPreview1';",
 "const BACKUP_KEY='brokenLanternPreV9Backup';":
   "const BACKUP_KEY='brokenLanternPreV9Backup_artPreview1';",
 "name='brokenLanternCanonical'":"name='brokenLanternCanonical_artPreview1'",
 "indexedDB.deleteDatabase('brokenLanternCanonical')":
   "indexedDB.deleteDatabase('brokenLanternCanonical_artPreview1')",
 "indexedDB.deleteDatabase('brokenLanternMobile')":
   "indexedDB.deleteDatabase('brokenLanternMobile_artPreview1')",
}
for before,after in storage_changes.items():
 if before not in src:raise RuntimeError('Preview storage anchor missing: '+before)
 src=src.replace(before,after)
if "const SAVE_KEY='brokenLanternCanonical_v9';" in src:
 raise RuntimeError('Production save key leaked into preview')
patch=(game/'v21-art-preview-1.js').read_text(encoding='utf-8')
if src.count(marker)!=1:
 raise RuntimeError('Expected one game boot marker')
preview=src.replace(marker,'\n\n'+patch+marker,1)
preview=preview.replace('Grim Company v21.10.4 — Casualty Replacement','Grim Company — Art Preview 1')
preview=preview.replace('The v21.10.4 phone build loaded','The art preview loaded')
for token in ['GC420_VERSION','__GC420_TEST','gc420Start','gc420MediaUrl']:
 if token not in preview:raise RuntimeError('Missing preview marker '+token)
dest=game/'play-art-preview-1'/'index.html'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(preview,encoding='utf-8')
print(f'Built isolated art preview {dest} {len(preview)} bytes; production build unchanged')
Path('/tmp/grim-art-preview-1.js').write_text(patch,encoding='utf-8')
