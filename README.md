# BanG Dream! Live2D / Spine Viewer

BanG Dream! Live2D / Spine Viewer is an unofficial web viewer for browsing, previewing, layering, and exporting BanG Dream! character model resources.

This repository contains only the viewer application code. BanG Dream! characters, model assets, trademarks, and related media belong to their respective rights holders.

## Features

- Browse remote Live2D and Spine model catalogs
- Preview Live2D and Spine models in a PixiJS canvas
- Compose multiple model layers with ordering, duplication, and transforms
- Select motions and expressions, including motion/expression borrowing flows
- Import local Live2D or Spine archives in the browser
- Export canvas images and batch image variants
- Generate downloadable model ZIP packages through server routes

## Stack

- Next.js App Router
- React 19
- PixiJS, `pixi-live2d-display-advanced`, and `pixi-spine`
- Tailwind CSS
- OpenNext for Cloudflare Workers
- Cloudflare R2 for private model asset storage
- pnpm

## Development

Install dependencies:

```bash
pnpm install
```

Start the Next.js development server:

```bash
pnpm dev
```

The local Next.js app runs at `http://localhost:3000`.

Remote model API routes are backed by a Cloudflare R2 binding. Use the Cloudflare preview command when you need to exercise those routes locally:

```bash
pnpm preview
```

## Configuration

The app has defaults for public configuration and can run without a local `.env.local`. To override public URLs or ZIP metadata, copy the example file:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_BESTDORI_LIVE2D_ASSET_BASE` | Base URL for Bestdori Live2D asset pages |
| `NEXT_PUBLIC_ZIP_COMMENT` | Comment embedded in generated ZIP files |

## Cloudflare Workers Deployment

This is a full-stack Next.js application with `app/api/*` route handlers. It should be deployed as a Cloudflare Worker through OpenNext, not as a static Cloudflare Pages site.

Build the Worker bundle:

```bash
pnpm build:cloudflare
```

Preview the production Worker locally:

```bash
pnpm wrangler dev
```

Deploy:

```bash
pnpm deploy
```

For Cloudflare Workers Git builds, use:

- Build command: `pnpm build:cloudflare`
- Deploy command: `pnpm opennextjs-cloudflare deploy`
- Wrangler config: `wrangler.jsonc`

## R2 Asset Access

Remote BanG Dream! model assets are read through the `BANGDREAM_R2` binding:

```jsonc
"r2_buckets": [
  {
    "binding": "BANGDREAM_R2",
    "bucket_name": "bangdream",
    "remote": true
  }
]
```

The bucket is expected to contain objects with keys matching the existing resource path layout, for example:

```text
live2d/_info.json
live2d/chara/001_2018_dog_rip/buildData.asset
sdchara/_info.json
```

The application reads those objects directly by R2 key. A public R2 custom domain is not required for the viewer to work, and the bucket can remain private as long as the Worker has the `BANGDREAM_R2` binding.

If the Worker is public, its API routes are public too. Private R2 access prevents direct bucket hotlinking; it does not by itself restrict access to `/api/chara/*`, `/api/spine/*`, or download routes. Add Cloudflare Access, authentication, signed requests, or rate limiting if the deployed viewer should be restricted.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Build the Next.js application |
| `pnpm build:cloudflare` | Build the OpenNext Cloudflare Worker |
| `pnpm preview` | Build and preview the Worker with Wrangler |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm lint` | Run the project lint script |
| `pnpm check` | Run the default project checks |

## License

The application code is released under the MIT License. See `LICENSE`.

This license does not apply to BanG Dream! characters, model assets, trademarks, or other third-party resources displayed or referenced by the application. Do not use those materials commercially unless you have the appropriate rights.
