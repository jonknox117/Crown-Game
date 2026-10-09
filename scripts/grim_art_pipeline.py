#!/usr/bin/env python3
"""Non-destructive Grim Company raster export. Requires Pillow >= 10.

Examples:
  python scripts/grim_art_pipeline.py list
  python scripts/grim_art_pipeline.py export \
    --id scene.chapterhouse --source /originals/chapterhouse.png \
    --dest /tmp/grim-art-exports
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

try:
    from PIL import Image, ImageCms, ImageOps, UnidentifiedImageError
except ImportError as exc:
    raise SystemExit("Pillow >= 10 required: python -m pip install 'Pillow>=10'") from exc

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "grimdark-company" / "art-direction" / "manifest.json"


class ArtExportError(ValueError):
    pass


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_manifest(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != "grim-art-1":
        raise ArtExportError("Wrong art manifest version")
    return data


def asset_spec(manifest: dict, asset_id: str) -> dict:
    registered = manifest["scenes"] + [manifest["portraits"]["benchmark"]]
    return next((a for a in registered if a["id"] == asset_id), None)


def check_source(source: Path, required: tuple[int, int]) -> tuple[int, int]:
    """Reject insufficient native pixels. Never enlarge a small original."""
    if not source.is_file():
        raise ArtExportError(f"Missing master: {source}")
    try:
        with Image.open(source) as image:
            image.verify()
        with Image.open(source) as image:
            width, height = image.size
    except (UnidentifiedImageError, OSError) as exc:
        raise ArtExportError("Unreadable or corrupt master") from exc
    if width < required[0] or height < required[1]:
        raise ArtExportError(
            f"Master {width}x{height} is too small; requires >= "
            f"{required[0]}x{required[1]}. Upscaling is prohibited."
        )
    if source.suffix.lower() not in (".png", ".tif", ".tiff", ".webp"):
        raise ArtExportError("Use a lossless original master (PNG or TIFF preferred)")
    return width, height


def srgb_image(image: Image.Image) -> tuple[Image.Image, list[str]]:
    warnings = []
    fixed = ImageOps.exif_transpose(image)
    has_alpha = "A" in fixed.getbands()
    profile = fixed.info.get("icc_profile")
    if profile:
        try:
            src_profile = ImageCms.ImageCmsProfile(io.BytesIO(profile))
            dst_profile = ImageCms.createProfile("sRGB")
            if has_alpha:
                alpha = fixed.getchannel("A")
                rgb = ImageCms.profileToProfile(fixed.convert("RGB"), src_profile, dst_profile, outputMode="RGB")
                rgb.putalpha(alpha)
                fixed = rgb
            else:
                fixed = ImageCms.profileToProfile(fixed.convert("RGB"), src_profile, dst_profile, outputMode="RGB")
        except Exception as exc:
            raise ArtExportError(f"Master has an invalid or unsupported color profile: {exc}") from exc
    else:
        warnings.append("No ICC profile in master; assuming standard sRGB input")
        fixed = fixed.convert("RGBA" if has_alpha else "RGB")
    return fixed, warnings


def crop_with_focus(image: Image.Image, size: tuple[int, int], focal: tuple[float, float]) -> Image.Image:
    """Cover, crop around artist-approved focus, then downsample once."""
    w, h = image.size
    target_w, target_h = size
    if w < target_w or h < target_h:
        raise ArtExportError(f"Raster export would upscale {w}x{h} -> {target_w}x{target_h}")
    ratio = max(target_w / w, target_h / h)
    crop_width = target_w / ratio
    crop_height = target_h / ratio
    center_x = max(crop_width / 2, min(w - crop_width / 2, focal[0] * w))
    center_y = max(crop_height / 2, min(h - crop_height / 2, focal[1] * h))
    bounds = (
        round(center_x - crop_width / 2),
        round(center_y - crop_height / 2),
        round(center_x + crop_width / 2),
        round(center_y + crop_height / 2),
    )
    return image.crop(bounds).resize(size, Image.Resampling.LANCZOS)


def export_asset(manifest: dict, asset_id: str, source: Path, dest: Path) -> dict:
    spec = asset_spec(manifest, asset_id)
    if spec is None:
        raise ArtExportError(f"Unknown asset ID: {asset_id}")
    category = spec["type"]
    rule = manifest["requirements"][category]
    width, height = check_source(source, tuple(rule["minMaster"]))
    before_hash = sha256(source)
    result = {
        "asset_id": asset_id, "category": category,
        "master": str(source), "master_sha256": before_hash,
        "master_pixels": [width, height], "focal": spec["focal"],
        "exports": [], "warnings": [],
    }
    dest.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image, warnings = srgb_image(original)
        result["warnings"] += warnings
        for rendition in rule["renditions"]:
            size = (int(rendition["width"]), int(rendition["height"]))
            q = int(rendition["quality"])
            if not 84 <= q <= 96:
                raise ArtExportError("Export quality must remain in approved 84–96 range")
            ready = crop_with_focus(image, size, tuple(spec["focal"]))
            file = dest / f"{asset_id.replace('.', '-')}-{rendition['suffix']}.webp"
            # WebP saves from the original master only; never recompress a compressed export.
            ready.save(file, "WEBP", quality=q, method=6, exact=True)
            with Image.open(file) as check:
                check.load()
                if check.size != size or check.format != "WEBP":
                    raise ArtExportError(f"Round-trip failed: {file}")
            bytesize = file.stat().st_size
            item = {
                "path": str(file), "pixels": list(size),
                "format": "WEBP", "quality": q, "bytes": bytesize,
                "sha256": sha256(file),
            }
            if bytesize > int(rendition["maxBytes"]):
                result["warnings"].append(
                    f"{rendition['suffix']} is {bytesize} bytes above budget "
                    f"{rendition['maxBytes']}; review visually before reducing quality"
                )
            result["exports"].append(item)
    if before_hash != sha256(source):
        raise ArtExportError("The master changed during export; aborting")
    report = dest / f"{asset_id.replace('.', '-')}-export-report.json"
    report.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=("list", "export"))
    p.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    p.add_argument("--id")
    p.add_argument("--source", type=Path)
    p.add_argument("--dest", type=Path)
    args = p.parse_args()
    manifest = load_manifest(args.manifest)
    if args.command == "list":
        for a in manifest["scenes"] + [manifest["portraits"]["benchmark"]]:
            print(f"{a['id']}: {a['status']} — {a.get('mood','')}")
        return 0
    if not args.id or not args.source or not args.dest:
        p.error("export requires --id, --source and --dest")
    try:
        result = export_asset(manifest, args.id, args.source, args.dest)
    except ArtExportError as exc:
        p.error(str(exc))
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
