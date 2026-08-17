# Credits & licences

Chronicle vendors every asset it uses. The game makes **no external network
requests at runtime** — no CDNs, no font services, no APIs — so it runs from a
plain static host such as GitHub Pages, and works offline once loaded.

Because this repository redistributes these files verbatim and publicly, only
**CC0** and **public domain** sources were accepted. Several otherwise suitable
candidates were rejected during sourcing for carrying attribution or
share-alike conditions; they are listed at the bottom so the decision isn't
silently repeated later.

---

## Map geometry

| Asset | Source | Licence |
|---|---|---|
| `assets/map/world.svg` | [Natural Earth](https://www.naturalearthdata.com/) 110m `admin_0_countries` + `land`, via [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) | Public domain |

Natural Earth is released into the public domain by its authors. The GeoJSON
was converted to a single equirectangular SVG by `tools/build-map.mjs`; no
geometry was altered beyond coordinate rounding and cropping the view to
83.5°N–57°S.

---

## Typefaces

All five families are under the [SIL Open Font License 1.1](https://openfontlicense.org/),
which permits bundling and redistribution. Vendored by `tools/fetch-fonts.mjs`,
limited to the `latin` and `latin-ext` subsets.

| Family | Designer(s) | Role |
|---|---|---|
| UnifrakturMaguntia | Peter Wiegel (after Carl Albert Fahrenwaldt) | Masthead blackletter |
| Playfair Display | Claus Eggers Sørensen | Headlines |
| EB Garamond | Georg Duffner, Octavio Pardo | Body text |
| IM Fell English | Igino Marini (after the Fell Types, c. 1690) | Antique subheads |
| Special Elite | Astigmatic | Typewriter stamps |

---

## Sound effects

Processed by `tools/build-audio.sh` (trimmed, peak-normalised, encoded to Ogg
Vorbis + MP3). Processing does not affect the licence terms.

| Clip | Source | Author | Licence |
|---|---|---|---|
| `key1`, `key2`, `key3` | [Typewriter sounds](https://opengameart.org/content/typewriter-sounds) (OpenGameArt) | cassie-orbitgames | CC0 |
| `ding` | [Freesound 406243](https://freesound.org/people/_stubb/sounds/406243/), via Wikimedia Commons | \_stubb | CC0 |
| `correct` | [Bell-ring.flac](https://commons.wikimedia.org/wiki/File:Bell-ring.flac) (Commons) | qubodup | CC0 |
| `wrong`, `stamp`, `gong`, `chime`, `pin` | [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx) (OpenGameArt) | rubberduck | CC0 |
| `hint` | [10 Book Page Flips](https://opengameart.org/content/10-book-page-flips) (OpenGameArt) | starninjas | CC0 |
| `page` | [Turning a page.ogg](https://commons.wikimedia.org/wiki/File:Turning_a_page.ogg) (Commons) | planish | Public domain |
| `rustle`, `crumple` | [Various Paper Sound Effects](https://opengameart.org/content/various-paper-sound-effects) (OpenGameArt) | luckius | CC0 |
| `unfurl` | [Opening and Closing a Map Sounds](https://opengameart.org/content/opening-and-closing-a-map-sounds) (OpenGameArt) | spring-spring | CC0 |
| `tick` | [Watch tick.ogg](https://commons.wikimedia.org/wiki/File:Watch_tick.ogg) (Commons) | Marble Toast | CC0 |

## Music

| Clip | Source | Author | Licence |
|---|---|---|---|
| `theme` | [4 Music Box Tracks](https://opengameart.org/content/4-music-box-tracks) — *musicbox1 spooky waltz* (OpenGameArt) | aureolusomicron | CC0 |

---

## Rejected during sourcing

Kept on record so these aren't re-evaluated later. All were good fits
musically or sonically, but their terms are incompatible with verbatim
redistribution in a public repo without ongoing attribution obligations.

| Candidate | Licence | Verdict |
|---|---|---|
| Tchaikovsky *The Seasons*, arranged for music box (gregor-quendel) | CC-BY-SA 4.0 | Rejected — share-alike |
| Writing Scribbles (wandering-door-games) | CC-BY-SA 4.0 | Rejected — share-alike |
| Single Key Press Sounds (qubodup) | CC-BY 3.0 | Rejected — attribution required, despite the archive being named `…-cc0-…` |
| Paper Crumple Sfx (medicinestorm) | CC-BY 4.0 | Rejected — attribution required |
| Elegy Dm (yubatake) | CC-BY 4.0 | Rejected — attribution required |
| Dark Gothic Haunted Masquerade (isao) | OGA-BY 3.0 | Rejected — attribution required |
| Rubber seal dabbed on ink pad (Commons) | CC-BY 3.0 | Rejected — attribution required |

---

## Reproducing the asset build

```sh
node tools/fetch-fonts.mjs                 # -> assets/fonts/, css/fonts.css
node tools/build-map.mjs land.geojson countries.geojson assets/map/world.svg
./tools/fetch-audio.sh /tmp/chronicle-audio   # download raw CC0 sources
./tools/build-audio.sh /tmp/chronicle-audio   # -> assets/audio/
```

`tools/commons.py` and `tools/oga.py` are the licence-vetting helpers used to
screen candidates; both refuse anything that isn't CC0 or public domain.
