# Signature Moments demo assets

Retrieved from the live https://jjettas.com/ Signature Moments section on 2026-10-04. The user chose original card artwork/video for the local comparison demo. Site artwork and broadcast clips belong to their respective owners; these files are reference/demo content, not a production-use license. Replace them with personal content before publishing the personal site.

## Card images

| Local file | Live title | Source |
| --- | --- | --- |
| `card-01.webp` | The Peach Bowl | https://cdn.sanity.io/images/zil8k06j/production/3f87e2e9f8ece228d78796a9d6cf13cd7bcd07b8-1036x1519.webp |
| `card-02.webp` | Single Season Record | https://cdn.sanity.io/images/zil8k06j/production/03d6c9eafd4617b664182954a83c507eb40b5245-1046x1503.webp |
| `card-03.webp` | The Catch | https://cdn.sanity.io/images/zil8k06j/production/c2b96a5fec736475faad01463642b3b7c1885620-1036x1519.webp |
| `card-04.webp` | Offensive Player of the Year | https://cdn.sanity.io/images/zil8k06j/production/7cbe65037e3972ee39b5dfb6d1a18a454d96fa2b-1039x1514.webp |
| `card-05.webp` | Pro Bowl Selection | https://cdn.sanity.io/images/zil8k06j/production/2accc8a2c65b6c18f8f6f49ef3c107f2b39c033d-1023x1537.webp |

## Video clips

Locally hosted `videoSmall` 480p variants from the live CMS. For the public component demo, `moment-05.mp4` duplicates the smaller `moment-02.mp4` clip at the user's request; the original 68,098,861-byte Pro Bowl clip has been removed. The fifth card's artwork and title remain, but its video is a demo placeholder. No clip is requested before opening a card.

| Local file | Bytes | Source |
| --- | ---: | --- |
| `moment-01.mp4` | 21,948,607 | https://vz-e818877b-c14.b-cdn.net/df40c88a-9166-4ff6-a11c-e00e939b7afe/play_480p.mp4 |
| `moment-02.mp4` | 3,579,887 | https://vz-e818877b-c14.b-cdn.net/eae64093-2258-41fd-9e38-cc4921c7276c/play_480p.mp4 |
| `moment-03.mp4` | 4,211,940 | https://vz-e818877b-c14.b-cdn.net/4bdeef73-cb99-489a-af9b-590ccbd33886/play_480p.mp4 |
| `moment-04.mp4` | 20,754,286 | https://vz-e818877b-c14.b-cdn.net/2e11fb02-f0c0-4661-8c97-94961a64b1ac/play_480p.mp4 |
| `moment-05.mp4` | 3,579,887 | Duplicate of `moment-02.mp4` above; demo placeholder |

CMS source provenance references respectively: `bc5d4991a6c3a070373a41fc218e793a080d381b.mp4`, `95127222de0f64890c5d8ec2bc59ea783e303f4a.mp4`, `8b1ed3e66580a305061038c85a001bb12c5005ad.mp4`, `b4bb14208eae1ead112194c117d5007fe516f06c.mp4`, `5b4cffccd8be610d683fe19ec90ceefe3ebb4254.mp4`, under Sanity project `zil8k06j/production`.

## Textures and font

- `grass.webp`: https://jjettas.com/textures/grass.webp (117,938 bytes).
- `light.webp`: https://jjettas.com/textures/light-03.webp (94,876 bytes).
- `intro-grain.webp`, `intro-light.webp`, `intro-light-mobile.webp`: copies of the same previously sourced JJettas files used in the leather demo, packaged here to make this component's assets independent. Original URLs: https://jjettas.com/textures/pebble.webp, https://jjettas.com/textures/light-01.webp, https://jjettas.com/textures/light-01-phone.webp.
- `barlow-condensed-latin-700.woff2`: **Barlow Condensed Bold**, The Barlow Project Authors, SIL Open Font License 1.1. Latin subset downloaded from https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuQ.woff2 through the Google Fonts CSS endpoint. Full license: `OFL.txt`. Source family: https://github.com/google/fonts/tree/main/ofl/barlowcondensed.
- Beachwood/Adobe Fonts is not loaded. Barlow Condensed is an intentional approximation chosen by the user.

Raw CMS metadata and download receipts: ignored `artifacts/references/signature-assets.json`.
