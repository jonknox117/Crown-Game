from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / 'grimdark-company'

runpy.run_path(str(root / 'scripts' / 'build_grim_company_v21_4_6.py'), run_name='__main__')

patch_files = ['v21-4-7-live-ui.js']
injection = '\n\n'.join((game / name).read_text(encoding='utf-8') for name in patch_files)
marker = '\nboot();\n})();'

js_path = Path('/tmp/broken-lantern-v9.js')
js = js_path.read_text(encoding='utf-8')
if marker not in js:
    raise SystemExit('Could not locate boot marker for v21.4.7 injection.')
js = js.replace(marker, '\n\n' + injection + marker, 1)

required = [
    "const GC347_VERSION='21.4.7'",
    'visibleStatsUpdateWithoutNavigation=true',
    'visibleProgressBarsUpdateWithoutNavigation=true',
    'worldMetersUpdateWithoutNavigation=true',
    'founderVitalsUpdateWithoutNavigation=true',
    'contractAndExpeditionStateUpdateWithoutNavigation=true',
    'freebladeMilestonesUpdateWithoutNavigation=true',
    'liveUpdatesPreserveScroll=true',
    'liveUpdatesSkipActiveInputsAndModals=true',
    'liveUpdatesAvoidFullAppRender=true',
    '__GC347_TEST',
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit('Grim Company v21.4.7 build missing markers: ' + ', '.join(missing))
js_path.write_text(js, encoding='utf-8')

source = (game / 'play' / 'index.html').read_text(encoding='utf-8')
if marker not in source:
    raise SystemExit('Canonical HTML did not contain the boot marker.')
source = source.replace(marker, '\n\n' + injection + marker, 1)
source = source.replace('Grim Company v21.4.6 — Clock Hotfix', 'Grim Company v21.4.7 — Live UI')
source = source.replace('The v21.4.6 phone build loaded', 'The v21.4.7 phone build loaded')

for dirname in (
    'mobile','play','play-1934','play-199','play-200','play-201','play-2012',
    'play-203','play-204','play-205','play-206','play-207','play-208',
    'play-209','play-2091','play-210','play-2101','play-211','play-212','play-2121','play-213','play-2131','play-2132','play-214','play-2141','play-2142','play-2143','play-2144','play-2145','play-2146','play-2147'
):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(source, encoding='utf-8')
    print(f'Built v21.4.7 {out / "index.html"} ({len(source)} bytes)')
