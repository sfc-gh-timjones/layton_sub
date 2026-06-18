# Layton Tier Scorer Viewer

Static map viewer for Layton subdivision tier scores. This folder is intended to live in its **own GitHub repository** and deploy to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5176

### Map imagery (optional)

Create `.env` in this directory (not committed):

```env
VITE_UTAH_DISCOVER_KEY=your_utah_agrc_key
# or
VITE_STADIA_API_KEY=your_stadia_key
```

Same tiles and resolution as local dev. Without a key, Stadia satellite is used (may be rate-limited).

## Refresh parcel data

Data is exported from the main `real_estate` repo (Snowflake):

```bash
# From the main repo root (not this repo)
python3 scripts/export_layton_tier_scored.py
```

Copy `public/data/tiers.json` into this repo, commit, and push to update the live site.

## GitHub Pages setup (viewer-only repo)

1. Create a new **public** GitHub repo and push **the contents of this directory** as the repo root (not the parent monorepo).
2. In repo **Settings → Pages**, set source to **GitHub Actions**.
3. Add repository secrets (optional, for map tiles):
   - `VITE_UTAH_DISCOVER_KEY` — same key you use locally
   - `VITE_STADIA_API_KEY` — fallback if no Utah key
4. Push to `main` — `.github/workflows/deploy-pages.yml` builds and publishes `dist/`.

Site URL: [https://sfc-gh-timjones.github.io/layton_sub/](https://sfc-gh-timjones.github.io/layton_sub/)

## What stays the same on Pages

- App UI, map, filters, scoring display
- `tiers.json` parcel geometries and stats
- Map tile provider and quality (via the same env secrets)

Snowflake / SQL scoring stays in the main `real_estate` repo; only the exported JSON ships here.
