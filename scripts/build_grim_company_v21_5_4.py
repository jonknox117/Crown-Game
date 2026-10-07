from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

runpy.run_path(str(root / 'scripts' / 'build_grim_company_v21_5_2.py'), run_name='__main__')

patch = (game / 'v21-5-4-founding-fix.js').read_text(encoding='utf-8')
marker = '\nboot();\n})();'

def inject(source, extra):
    if marker not in source:
        raise SystemExit('Could not locate boot marker for v21.5.4 injection.')
    return source.replace(marker, '\n\n' + extra + marker, 1)

# Preserve actual v21.5.3 archive from the current canonical output before upgrading it.
base = (game / 'play' / 'index.html').read_text(encoding='utf-8')
archive = game / 'play-2153'
archive.mkdir(parents=True, exist_ok=True)
(archive / 'index.html').write_text(base, encoding='utf-8')

source = inject(base, patch)
source = source.replace('Grim Company v21.5.3 — Stability & QoL', 'Grim Company v21.5.4 — Founding Fix')
source = source.replace('The v21.5.3 phone build loaded', 'The v21.5.4 phone build loaded')

required = [
    "const GC354_VERSION='21.5.4'",
    'foundingMilestonePersistsAfterEarned=true',
    'recoveryDoesNotHideFoundCompany=true',
    'fieldFoundingShowsReturnRequirement=true',
    '__GC354_TEST',
]
missing = [x for x in required if x not in source]
if missing:
    raise SystemExit('Grim Company v21.5.4 build missing markers: ' + ', '.join(missing))

for dirname in ('mobile','play','play-2154'):
    out=game/dirname
    out.mkdir(parents=True, exist_ok=True)
    (out/'index.html').write_text(source, encoding='utf-8')
    print(f'Built v21.5.4 {out / "index.html"} ({len(source)} bytes)')

js_path=Path('/tmp/broken-lantern-v9.js')
js=js_path.read_text(encoding='utf-8')
js_path.write_text(inject(js,patch),encoding='utf-8')
