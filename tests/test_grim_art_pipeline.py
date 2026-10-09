"""Test the real export functions using generated test patterns, NOT sample game art."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "scripts" / "grim_art_pipeline.py"
SPEC = importlib.util.spec_from_file_location("grim_art_pipeline", PATH)
art = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(art)


class GrimArtPipelineTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = art.load_manifest(art.DEFAULT_MANIFEST)

    def build_master(self, path, size):
        image = Image.new("RGB", size)
        paint = ImageDraw.Draw(image)
        for y in range(0, size[1], 32):
            paint.rectangle((0, y, size[0], min(y + 31, size[1] - 1)),
                            fill=(15 + (y // 32) % 75, 18, 32 + (y // 20) % 100))
        paint.ellipse((size[0] // 3, size[1] // 4, size[0] * 2 // 3, size[1] * 3 // 4),
                      outline="#ca9b48", width=18)
        image.save(path, "PNG")

    def test_manifest_matches_existing_scene_routing(self):
        expected = {"chapterhouse", "market", "musterYard", "marchWatch",
                    "pilgrimHouse", "jobsBoard", "armory", "worldMap"}
        scenes = self.manifest["scenes"]
        self.assertEqual({s["sceneId"] for s in scenes}, expected)
        self.assertEqual(len(scenes), 8)
        self.assertTrue(all(s["master"] is None for s in scenes))
        self.assertEqual(self.manifest["portraits"]["plannedBaseCount"], 60)

    def test_environment_exports_without_modifying_master(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            source = folder / "original.png"
            self.build_master(source, (3072, 2048))
            original = art.sha256(source)
            result = art.export_asset(self.manifest, "scene.chapterhouse", source, folder / "output")
            self.assertEqual(original, art.sha256(source))
            self.assertEqual(result["master_pixels"], [3072, 2048])
            self.assertEqual(len(result["exports"]), 2)
            self.assertEqual([e["pixels"] for e in result["exports"]], [[2048, 1365], [1536, 1024]])
            for item in result["exports"]:
                self.assertTrue(Path(item["path"]).exists())
                with Image.open(item["path"]) as rendered:
                    self.assertEqual(rendered.format, "WEBP")
            self.assertTrue((folder / "output" / "scene-chapterhouse-export-report.json").exists())

    def test_portrait_exports_and_consistent_hashes(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            source = folder / "portrait.png"
            self.build_master(source, (1536, 1536))
            first = art.export_asset(self.manifest, "portrait.human.fighter.01", source, folder / "a")
            second = art.export_asset(self.manifest, "portrait.human.fighter.01", source, folder / "b")
            self.assertEqual([x["pixels"] for x in first["exports"]], [[1024, 1024], [512, 512]])
            self.assertEqual([x["sha256"] for x in first["exports"]],
                             [x["sha256"] for x in second["exports"]])

    def test_rejects_low_resolution_master_instead_of_upscaling(self):
        with tempfile.TemporaryDirectory() as d:
            source = Path(d) / "undersized.png"
            Image.new("RGB", (500, 500), "#444444").save(source)
            with self.assertRaisesRegex(art.ArtExportError, "Upscaling is prohibited"):
                art.export_asset(self.manifest, "scene.market", source, Path(d) / "export")
            self.assertFalse((Path(d) / "export").exists())

    def test_rejects_unknown_asset(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(art.ArtExportError, "Unknown asset"):
                art.export_asset(self.manifest, "random.thing", Path(d) / "a.png", Path(d) / "output")

    def test_focus_crop_dimensions(self):
        image = Image.new("RGB", (3072, 2048), "#444444")
        for focal in ((.5, .43), (.57, .5), (.01, .01), (.99, .99)):
            with self.subTest(focal=focal):
                crop = art.crop_with_focus(image, (1536, 1024), focal)
                self.assertEqual(crop.size, (1536, 1024))


if __name__ == "__main__":
    unittest.main()
