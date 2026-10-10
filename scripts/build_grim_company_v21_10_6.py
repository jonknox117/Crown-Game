"""Build v21.10.6: bundle 50 original, non-reencoded adventurer portraits and 8 environment illustrations."""
from pathlib import Path
import runpy, hashlib, base64
root=Path(__file__).resolve().parents[1]
game=root/'grimdark-company'
# Save format is untouched; this adds only lossless image assets and presentation overrides.
PORTRAIT_HASHES={'veyric_human_male.jpg': 'e25a03b03ced21b339e24cb27ecbe7e019e8da63c375316e2ef273e9546ad60f', 'veyric_human_female.jpg': '6a4f375aa2bc48ba26f121f818b6d39612f186a0652e9c4d2e86a0ff242d4dd0', 'veyric_elf_male.jpg': '5bb5f18f3fdce214426e03138fcc1161a01797ddfc66b30bcc6fac6b71c7632e', 'veyric_elf_female.jpg': '1f3cbb71fd907bcd5759ec074fad90aac62d907df3ea7b31bc669211dd020203', 'veyric_dwarf_male.jpg': '557b0638b13e40c5ca82166327285ae0f4c5bf41b5b91fc2d81f3fb65925f24c', 'veyric_dwarf_female.jpg': '6cac74ff61f17a5bb6ebe9a0784804e8c2e51df4b8a4d5298a5c3c672fb5e6e3', 'veyric_orc_male.jpg': '1aa739c42408813ff7b05e59c5eafa38331057fe20e87462a40cb629d7563e23', 'veyric_orc_female.jpg': '843e815f703ef9522ea598c705ad1aa74b319c4ec2a79b17f012b5c98f775c3e', 'veyric_celestial_male.jpg': '7a5b8a558edf1117fc5a987ff8996e31760c8f63ee2096cf0a78e6984f96a6ac', 'veyric_celestial_female.jpg': 'dad26832ea7c87e8ebd914d2865f20338ba0673331f17a4306d76aff93b23259', 'skeldic_human_male.jpg': '0f9791b4acb7771c66c33adfd9ab30b69bc58da5a885013739d6196952243d97', 'skeldic_human_female.jpg': 'd00b9485e8bacdba6b87bebcaee26e30baea3fcf60d3e32cc03f45c19cb24639', 'skeldic_elf_male.jpg': '560e0d68db7d492b57a7cc615a9de067d6a05b7636a63878e03100876a1eab90', 'skeldic_elf_female.jpg': 'f2436837cf55c67f881624b69ce947a91631a2c934bb3832dab8ac91f21caace', 'skeldic_dwarf_male.jpg': '3b349a8a67f32616b3e1b50fb43b06e0de57693d267faa281a9f6066488286f7', 'skeldic_dwarf_female.jpg': '202e4878814716a406486f0334d5931c647897997a215ff3aeb5971f80251992', 'skeldic_orc_male.jpg': '423ec3f3bf8908a2a36d25d1148678dd40de9a5b29b62d140e90fdd4541b6ad5', 'skeldic_orc_female.jpg': 'd342878db894519aecd8675b1a176a1bd26f7d402e388f70bf8ae9013b8cea0c', 'skeldic_celestial_male.jpg': '6d570f9a92b54a8d023e038238f938d0b8ef26528f2cbb55113daf10702edad1', 'skeldic_celestial_female.jpg': 'cef2694733fce66e16c33c3429a113fb6241935333e205bba7a5e53f1c1faa47', 'hoshin_human_male.jpg': 'cac846b494b2af534954453e1c3c3bb86a8df5af8cc53b93493d22c82ef97695', 'hoshin_human_female.jpg': '214bd8b0bc19eb8f8ab409a47c377d65c52d0845ecca768e27ea83bb693f2714', 'hoshin_elf_male.jpg': '6b32e725a982d9170dab614e96c65a4ecd571e16e51816f6f1ff43f703679251', 'hoshin_elf_female.jpg': '234348da512fbd3e8dc88aab2a9139389cbed4ac8f24049b3c94eb1ebe0cc03b', 'hoshin_dwarf_male.jpg': '54381ead459ed5b25e5af2e495d27e021b6900beb14ee6ed6a10aa7684ea235a', 'hoshin_dwarf_female.jpg': '8e7177865c7b2d0a6de6c3371d83b6f85435b02568ea1846b30713811851b881', 'hoshin_orc_male.jpg': 'ad4eccbfe13eef66bbac18908d0099ea92eb4688f43be176cb315246e8017bb1', 'hoshin_orc_female.jpg': '8022cd4ebbdb425ee9f85f9905e793ee3dcbc4db2584c55a4d9a7a802ffd0b7a', 'hoshin_celestial_male.jpg': '7dcaaa95d9990e7d2c60c9c95acbaaab94a41b3c201c27d0e860ce58397e3745', 'hoshin_celestial_female.jpg': '6d6f5fbc45364536529cf7e8d96b9fdd3aa3d480783d721fe0e0139412d4d140', 'nambaran_human_male.jpg': 'c9f4151a853f2019f37f338891dfc1a9134e748dc07404bab1764fb11b5e6607', 'nambaran_human_female.jpg': '8c3aa9aacd4e111ef25990eb04103642c8939f4fca742837fc17d4ef0819cd37', 'nambaran_elf_male.jpg': 'cbceb55fb03f7092bf79431c193d039efd822ab80bd8d8c66167fec1adce920e', 'nambaran_elf_female.jpg': '3cd4b70fece68d4db807e43e9dd2af0ed63f0ae8502a9244368ba8014d6fec63', 'nambaran_dwarf_male.jpg': '5200b306c6ec040fea8479bdd98a8f9c12c812e35431593cdb84a7a738950a30', 'nambaran_dwarf_female.jpg': 'fc2664512f516acd0d41e64c54f9f39f48e1683ae6a380ba7f6711753c680df1', 'nambaran_orc_male.jpg': 'c7a0acbd709d2d3265a2ed495f3a908665f3008c7271c710d985bf17e9e37cf6', 'nambaran_orc_female.jpg': '99a22aabb6ab7fe1f0258b74680094f6b06f78f85a0ff346f19468039bf2e4c9', 'nambaran_celestial_male.jpg': '06f58ef9feadd3a2bd2f57ed0fe9a8c63164b7aaf9c7a46dfff1c1c5c324c0d6', 'nambaran_celestial_female.jpg': '1a5e7129cdb31c225b1e46d322332be027f79942d59bf27c4808441eaed4766d', 'aethren_human_male.jpg': '5f40b6c8e201f2cbd9dec7648e506689cb660014fce3dca36b2d11503741ec03', 'aethren_human_female.jpg': '631e379dbb1b47a2891ecad8f9d0638161be6273d5b12d3d36dd9bc7948401ae', 'aethren_elf_male.jpg': '0cd7931eff895dea0fea805adf29180517e72ba365789f23f9b1d4431b712aa9', 'aethren_elf_female.jpg': 'b919af4f8a95e7b6a7165f32cd050695c21fcbe35ca0d0308637f86d58088b2a', 'aethren_dwarf_male.jpg': '61168d46923f0f4a3ed7b3264b6e761c74b89b8c701c101f623c961577a312b0', 'aethren_dwarf_female.jpg': '4ead7c7c20ec794a242a5c14f0eaa48dcab14d658aaf7854fa97ae0c26e40861', 'aethren_orc_male.jpg': '7d804e69dada16b3d86ab663cb1e9af2eaee31083ba99c8291036793b3e3e9a3', 'aethren_orc_female.jpg': '3d5fb3f01ed8022bf33d63b0f19f3433ad057b8efd12c77219c9c7be00264629', 'aethren_celestial_male.jpg': '8f7aba9dc999caa2d7e80371c1d1b1001c4361f8077def6fc646d24d37f826e9', 'aethren_celestial_female.jpg': 'bd5f8082e5712d9ae23464f7c895216edd728381b0aa7bab3d2e5100d7e98509'}
SCENE_HASHES={'gothic_war_room_by_firelight.png': '1cb1b741885a05f4f209b8af27ff9542691ae216b3c40ef238f9b067e34ee27d', 'twilight_market_beneath_the_griffin_keep.png': 'af5bfe3e403a8bf1964a30421813ead564a3d215fa404059ef29f76a78b5330b', 'medieval_fortress_training_yard_at_dawn.png': '8ab96e2f566cc69fca860f66356f47c0384f120f6d9ac07ba54e59680db81aad', 'moonlit_fortress_over_a_misty_valley.png': '12164affa88efa4642a425a859c638f696030a3870c5494dce2dc3051a2b0eb8', 'candlelit_medieval_hospice_chapel.png': '6348964326dbbdd01c8124df04335a806ef747214eac87207787d35111ffd487', 'medieval_fantasy_contract_hall.png': 'fa0cfba2eb6fe1e7b7edbeb199f1f6fa0d3b627a91d615252215da2565403ccf', 'gothic_griffon_castle_armory_workshop.png': 'e3f1a30f78f9b20df70908e72abe75263a0a0068dfbe20ded792578a1fb03172', 'candlelit_fantasy_war_room_map.png': 'dfcbd3187bc8a0a7eb06fa45251fe5bce8b11a7bfbe75b7419dd6c06f115e3ef'}
portraits=game/'art'/'portraits'/'original-50'
source=game/'art-sources'/'scenes'
portraits.mkdir(parents=True,exist_ok=True)
# Earlier upload names are historical staging aliases; normalize to the actual culture/race/gender keys.
for alias,name in (('image-08.jpg','veyric_orc_female.jpg'),('image-09.jpg','veyric_celestial_male.jpg'),('image-10.jpg.b64','veyric_celestial_female.jpg.b64')):
 a=portraits/alias;b=portraits/name
 if a.exists() and not b.exists():b.write_bytes(a.read_bytes())
for name,expected in PORTRAIT_HASHES.items():
 dest=portraits/name
 if not dest.exists():
  encoded=dest.with_name(name+'.b64')
  if not encoded.exists():raise SystemExit('Missing original portrait: '+name)
  dest.write_bytes(base64.b64decode(''.join(encoded.read_text(encoding='ascii').split()),validate=True))
 actual=hashlib.sha256(dest.read_bytes()).hexdigest()
 if actual!=expected:raise SystemExit('Original portrait checksum mismatch: '+name+' got '+actual+' expected '+expected)
for name,expected in SCENE_HASHES.items():
 dest=game/'art'/name
 if dest.is_file():
  original=dest.read_bytes()
 else:
  parts=sorted(source.glob(name+'.part*.b64'))
  if not parts:raise SystemExit('Missing original illustration: '+name)
  body=''.join(p.read_text(encoding='ascii') for p in parts)
  original=base64.b64decode(body,validate=True)
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(original)
 if hashlib.sha256(original).hexdigest()!=expected:raise SystemExit('Original illustration checksum mismatch: '+name)
runpy.run_path(str(root/'scripts'/'build_grim_company_v21_10_5.py'),run_name='__main__')
anchor='\nboot();\n})();'
patch=(game/'v21-10-6-auto-art.js').read_text(encoding='utf-8')
def inject(src):
 if src.count(anchor)!=1:raise SystemExit('Unique boot anchor missing')
 return src.replace(anchor,'\n\n'+patch+anchor,1)
html=inject((game/'play'/'index.html').read_text(encoding='utf-8'))
html=html.replace('Grim Company v21.10.5 — Original Character Portraits','Grim Company v21.10.6 — Original Artwork Bundled')
html=html.replace('The v21.10.5 phone build loaded','The v21.10.6 phone build loaded')
for folder in ('play','mobile','play-21106'):
 dest=game/folder/'index.html'
 dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(html,encoding='utf-8')
print('Bundled',len(PORTRAIT_HASHES),'byte-identical portraits and',len(SCENE_HASHES),'byte-identical environments')
script=Path('/tmp/broken-lantern-v9.js')
script.write_text(inject(script.read_text(encoding='utf-8')),encoding='utf-8')