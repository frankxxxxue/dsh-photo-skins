# dsh-photo-skins

[中文](README.zh.md) | English

Photo skins for the DSH Web GUI: import your own photos and turn them into
the interface skin. The photo paints the backdrop behind the GUI, and the
accent colors are extracted from the photo automatically (dominant color as
the accent, photo-tinted light/dark readability veils). Rendering controls:
fit (cover/contain), blur (0-100px, global or split empty/content), dim
(0-100%) and the auto-accent toggle.

A standalone cordis plugin: settings card + host routes + settings namespace +
client layer controller.

## What it does

- Import photos (PNG / JPG / WebP / GIF, up to 25MB each) via the file
  picker, drag-and-drop, or paste.
- Try on / apply / remove photos from a first-level settings section
  ("Photo skins").
- The applied photo persists across reloads through the `photo-skins`
  settings namespace; the selection survives, the file stays local.
- Accent extraction: the dominant photo color becomes the card accent and
  tints the light/dark scrims (CSS variables `--dsw-photo-accent`,
  `--dsw-photo-accent-soft`, `--dsw-photo-accent-contrast`).
- Blur: one global value, or a split mode with separate empty-conversation and
  with-content values switched live as messages appear.

## Install

From npm:

```sh
dsh plugin --profile web add dsh-photo-skins
```

From this repository (development):

```sh
pnpm install && pnpm build
dsh plugin --profile web add link:.
```

Then refresh the running Web GUI (restart `dsh web` if the new section does
not appear).

## Storage

Photos are stored under `<DSH_HOME>/photo-skins/<id>/` (`original.<ext>` plus
a `manifest.json` with the display name, type, size and import time). Nothing
is uploaded or shared; removal deletes the local copy.

## Security model

- All routes (`/api/photo-skins/*`) sit behind a same-origin fence
  (Sec-Fetch-Site / Origin): cross-site webpages cannot read, import or
  delete your photos.
- Uploads are validated by file magic bytes, not by name or declared
  content-type — a renamed SVG or executable is rejected (415). SVG is
  deliberately unsupported (script risk).
- Uploads are capped at 25MB (413) and written atomically (tmp + rename).
- Stored ids are generated and validated against a whitelist regex, so no
  path can escape the store directory.

## Known limitations

- Photo skins are presentation only: they paint a backdrop layer under the
  GUI and write CSS variables; they never touch model requests or shell
  internals.
- Photo skins do not participate in the `dsh-skin use` mutual exclusion; they
  coexist with the active skin by paint order (the photo covers the skin's
  backdrop while active).
- The auto-accent is an approximation (downscaled sample of the dominant
  color).
- SVG and animated formats other than GIF/APNG are not supported.

## Development

```sh
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # tsdown -> lib/ (host) + lib/client.js (browser bundle)
```

The build emits a closure-factory browser bundle for
`window.__ModuleLoader__` with CSS Modules inlined via lightningcss and
`@deepseek-ai` platform modules kept external.

## License

BSD-3-Clause. See THIRD_PARTY_NOTICES.md for attribution of incorporated
portions.
