from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

# Build the v21.5.1 base first. Older archived paths remain available from that builder.
runpy.run_path(str(root / 'scripts' / 'build_grim_company_v21_5_1.py'), run_name='__main__')

patch_text = (game / 'v21-5-2-decision-tap-shield.js').read_text(encoding='utf-8')
v353_marker = '/* Grim Company v21.5.3 — stability & QoL follow-up.'
if v353_marker not in patch_text:
    raise SystemExit('Could not split v21.5.2 archive from v21.5.3 follow-up.')
patch_352 = patch_text.split(v353_marker, 1)[0].rstrip()
marker = '\nboot();\n})();'

base_source = (game / 'play' / 'index.html').read_text(encoding='utf-8')
if marker not in base_source:
    raise SystemExit('Canonical HTML did not contain the boot marker.')

def inject(source, patch):
    return source.replace(marker, '\n\n' + patch + marker, 1)

# Preserve an actual v21.5.2 archive.
source_352 = inject(base_source, patch_352)
source_352 = source_352.replace('Grim Company v21.5.1 — Smoothness & QoL', 'Grim Company v21.5.2 — Decision Tap Shield')
source_352 = source_352.replace('The v21.5.1 phone build loaded', 'The v21.5.2 phone build loaded')
out_352 = game / 'play-2152'
out_352.mkdir(parents=True, exist_ok=True)
(out_352 / 'index.html').write_text(source_352, encoding='utf-8')

# Current v21.5.3 build.
source_353 = inject(base_source, patch_text)
source_353 = source_353.replace('Grim Company v21.5.1 — Smoothness & QoL', 'Grim Company v21.5.3 — Stability & QoL')
source_353 = source_353.replace('The v21.5.1 phone build loaded', 'The v21.5.3 phone build loaded')

required = [
    "const GC352_VERSION='21.5.2'",
    "const GC353_VERSION='21.5.3'",
    'decisionChoicesRejectCarryoverTaps=true',
    'repeatedPushCannotChooseDecision=true',
    'decisionGuardExtendsWhileTapping=true',
    'pushRapidTapsStayResponsive=true',
    'freelanceReturnPresenceImmediate=true',
    'townMovePreservesScroll=true',
    'decisionShieldTestHasNoRuntimeSideEffects=true',
    '__GC352_TEST',
    '__GC353_TEST',
]
missing = [x for x in required if x not in source_353]
if missing:
    raise SystemExit('Grim Company v21.5.3 build missing markers: ' + ', '.join(missing))

for dirname in ('mobile', 'play', 'play-2153'):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(source_353, encoding='utf-8')
    print(f'Built v21.5.3 {out / "index.html"} ({len(source_353)} bytes)')

# Keep the workflow's JS syntax check pointed at the current bundle.
js_path = Path('/tmp/broken-lantern-v9.js')
base_js = js_path.read_text(encoding='utf-8')
# build_v21_5_1 already wrote the base bundle; inject the combined 21.5.2 + 21.5.3 patch.
if marker not in base_js:
    raise SystemExit('Could not locate boot marker for v21.5.3 JS injection.')
js_path.write_text(inject(base_js, patch_text), encoding='utf-8')
print(f'Preserved v21.5.2 {out_352 / "index.html"} ({len(source_352)} bytes)')
