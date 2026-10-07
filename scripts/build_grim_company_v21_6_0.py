from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'
runpy.run_path(str(root / 'scripts' / 'build_grim_company_v21_5_4.py'),run_name='__main__')

marker = '\nboot();\n})();'
patch_files = [
 'v21-6-0-career-gates.js',
 'v21-6-0-abilities.js',
 'v21-6-0-combat-actions.js',
 'v21-6-0-combat-hooks.js',
 'v21-6-0-class-ui.js',
 'v21-6-0-combat-tests.js',
]
patch = '\n\n'.join((game / name).read_text(encoding='utf-8') for name in patch_files)
def inject(source):
    if marker not in source:
        raise SystemExit('Could not find boot injection point.')
    return source.replace(marker,'\n\n'+patch+marker,1)
base = (game/'play'/'index.html').read_text(encoding='utf-8')
source=inject(base).replace('Grim Company v21.5.4 — Founding Fix','Grim Company v21.6.0 — Career & Tactical Combat')
source=source.replace('The v21.5.4 phone build loaded','The v21.6.0 phone build loaded')
required = [
 "const GC360_VERSION='21.6.0'",
 'contractAccessBasedOnCareerRarity=true',
 'classActionEngine=true',
 'visibleClassLevelLadder=true',
 '__GC360_RARITY_TEST',
 '__GC360_CLASS_TEST',
 '__GC360_COMBAT_TEST',
 'GC360_ABILITIES',
]
missing = [s for s in required if s not in source]
if missing:
    raise SystemExit('Missing v21.6.0 release markers: '+', '.join(missing))
for dirname in ('play','mobile','play-2160'):
    path=game/dirname/'index.html'
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(source,encoding='utf-8')
    print('Built',path,len(source))
js_path=Path('/tmp/broken-lantern-v9.js')
js_path.write_text(inject(js_path.read_text(encoding='utf-8')),encoding='utf-8')
print('Preserved old archives: 2152, 2153, 2154')
