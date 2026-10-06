from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[1]
game = root / "grimdark-company"

# Build the proven v20.6 bundle first, then layer the progression/command patches.
runpy.run_path(str(root / "scripts" / "build_broken_lantern_mobile.py"), run_name="__main__")

patch_files = [
    "v20-7-from-nothing-1.js",
    "v20-7-from-nothing-2.js",
    "v20-8-command-1.js",
    "v20-8-command-2.js",
    "v20-8-command-3.js",
    "v20-8-command-4.js",
    "v20-8-command-5.js",
    "v20-8-command-6.js",
    "v20-8-command-7.js",
    "v20-8-command-8.js",
]
injection = "\n\n".join((game / name).read_text(encoding="utf-8") for name in patch_files)
marker = "\nboot();\n})();"

js_path = Path("/tmp/broken-lantern-v9.js")
js = js_path.read_text(encoding="utf-8")
if marker not in js:
    raise SystemExit("Could not locate boot marker for v20.8 injection.")
js = js.replace(marker, "\n\n" + injection + marker, 1)

required = [
    "brokenLanternCanonical_v9",
    "const GC260_VERSION='20.6'",
    "const GC270_VERSION='20.7'",
    "const GC280_VERSION='20.8'",
    "freebladeOpening=true",
    "soloJobsUseRealExpeditions=true",
    "companyFoundingIsMilestone=true",
    "founderProgressPersistsIntoCompany=true",
    "managementHiddenBeforeFounding=true",
    "realRosterCommanders=true",
    "multiHQDelegation=true",
    "commandersUseRealContracts=true",
    "commandersUseRealParties=true",
    "commandDirectives=true",
    "commandRiskPolicy=true",
    "directControlAlwaysAvailable=true",
    "__GC230_TEST",
    "__GC240_TEST",
    "__GC250_TEST",
    "__GC260_TEST",
    "__GC270_TEST",
    "__GC280_TEST",
]
missing = [x for x in required if x not in js]
if missing:
    raise SystemExit("Grim Company v20.8 build missing markers: " + ", ".join(missing))
js_path.write_text(js, encoding="utf-8")

source = (game / "play" / "index.html").read_text(encoding="utf-8")
if marker not in source:
    raise SystemExit("Canonical HTML did not contain the boot marker.")
source = source.replace(marker, "\n\n" + injection + marker, 1)
source = source.replace("Grim Company v20.6 — The Founder", "Grim Company v20.8 — From Nothing to Command")
source = source.replace("The v20.6 phone build loaded", "The v20.8 phone build loaded")

for dirname in (
    "mobile","play","play-1934","play-199","play-200","play-201","play-2012",
    "play-203","play-204","play-205","play-206","play-207","play-208"
):
    out = game / dirname
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(source, encoding="utf-8")
    print(f"Built v20.8 {out / 'index.html'} ({len(source)} bytes)")
