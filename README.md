# gta6-cover-art-01-r4

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Syamsi02/gta6-cover-art-01-r4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Syamsi02/gta6-cover-art-01-r4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Golden Getaway** — an offline browser web app that turns your photos and a caption into GTA 6-style poster cover art, exported as a PNG to share. Load up to 4 photos, choose one of 6 multi-panel layouts (hero-and-three, four-grid, full-bleed, diagonal slash, tilted snapshots, story strip), grade it with one of 5 golden-hour duotones, letter it with a bold outlined title, an italic tagline ribbon and a chevron getaway meter, then export 1080 × 1080, 1080 × 1350 and 1920 × 1080 in one click. Drag any panel to pan its photo, zoom per panel, cycle photos per panel, undo/redo with Ctrl+Z. Everything runs offline from static files — photos never leave your machine. All art, lettering and effects are original; no Rockstar Games logo, artwork or font is used.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Hand the entry in (writes app/, screenshots/ and dossier.json to `out/`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are taken from the app's own `?shot=` scenes (see `shots.json`): the first is the exported wide cover, the second the editor with photos loaded, the third and fourth the square and portrait covers.

---

<sub>Entered on [make.fun](https://make.fun/?ref=fgwhnby2&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
