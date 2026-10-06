from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / "grimdark-company"

runpy.run_path(str(root / "scripts" / "build_grim_company_v20_8.py"), run_name="__main__")

patch_files = [
    "v20-9-loot-1.js",
    "v20-9-loot-2.js",
    "v20-9-loot-3.js",
    "v20-9-loot-4.js",
    "v21-0-veteran-legacy-1.js",
    "v21-0-veteran-legacy-2.js",
    "v21-0-veteran-legacy-3.js",
    "v21-0-1-party-legacy-1.js",
    "v21-0-1-party-legacy-2.js",
]
injection = "\n\n".join((game / name).read_text(encoding="utf-8") for name in patch_files)
marker = "\nboot();\n})();"

js_path = Path("/tmp/broken-lantern-v9.js")
js = js_path.read_text(encoding="utf-8")
if marker not in js:
    raise SystemExit("Could not locate boot marker for v21.0.1 injection.")
js = js.replace(marker, "\n\n" + injection + marker, 1)

required = [
    "brokenLanternCanonical_v9",
    "const GC290_VERSION='20.9'",
    "const GC291_VERSION='20.9.1'",
    "const GC300_VERSION='21.0'",
    "const GC301_VERSION='21.0.1'",
    "itemTriggerEngine=true",
    "rarityBehaviorIdentity=true",
    "oldGearMigrates=true",
    "structuredCareerHistory=true",
    "earnedTitles=true",
    "permanentScars=true",
    "namedBossLegacy=true",
    "persistentPartyHistory=true",
    "emergentPartyTraditions=true",
    "partyTraditionsHaveEffects=true",
    "__GC290_TEST",
    "__GC300_TEST",
    "__GC301_TEST",
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit("Grim Company v21.0.1 build missing markers: " + ", ".join(missing))
js_path.write_text(js, encoding="utf-8")

source = (game / "play" / "index.html").read_text(encoding="utf-8")
if marker not in source:
    raise SystemExit("Canonical HTML did not contain the boot marker.")
source = source.replace(marker, "\n\n" + injection + marker, 1)
source = source.replace("Grim Company v20.8 — From Nothing to Command", "Grim Company v21.0.1 — Living Legends")
source = source.replace("The v20.8 phone build loaded", "The v21.0.1 phone build loaded")

for dirname in (
    "mobile","play","play-1934","play-199","play-200","play-201","play-2012",
    "play-203","play-204","play-205","play-206","play-207","play-208",
    "play-209","play-2091","play-210","play-2101"
):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(source, encoding="utf-8")
    print(f"Built v21.0.1 {out / 'index.html'} ({len(source)} bytes)")
