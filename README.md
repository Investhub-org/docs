# Investhub Docs

Source for [docs.investhub.org](https://docs.investhub.org). The site is VitePress 1.6.4. Cloudflare Pages builds it from this repository. Do not deploy with Wrangler from a laptop.

## Run locally

Requires Node.js 22 (see `.node-version`). Node 20 or newer also works.

```sh
npm install
npm run docs:dev
```

The dev server prints a local URL. `npm run docs:preview` serves the production build.

```sh
npm run docs:build
```

`npm run build` is the same command.

## Deploy

Connect the existing Cloudflare Pages project `investhub-docs` to this GitHub repository. Pages builds on push. Do not `wrangler pages deploy` over that project.

| Setting | Value |
| --- | --- |
| Framework preset | VitePress |
| Build command | `npm run docs:build` |
| Build output directory | `.vitepress/dist` |
| Root directory | `/` (repository root) |
| Production branch | `main` |
| Node.js | `22` (`NODE_VERSION=22`; `.node-version` is also `22`) |

The VitePress preset's default build command is `npx vitepress build`. `npm run docs:build` and `npm run build` call the same `vitepress build` and write `.vitepress/dist`.

Preview deployments run for pull requests. Merging to `main` publishes the production site. This repository does not deploy anything by itself.

## What the build emits

- HTML pages with `cleanUrls` (section indexes keep a trailing slash).
- Raw Markdown at the same paths VitePress serves today: `/readme.md`, `/overview.md`, `/guides.md`, and `/guides/<page>.md`.
- `llms.txt` and `sitemap.xml`.
- `public/` copied as-is: `robots.txt`, `openapi.yaml`, the Scalar page at `/api/`, `_redirects`, and `_headers`.

`_redirects` sends the old `/overview/<tag>` URLs to `/api/#...` with status 301, and `/readme` to `/`. Those rules apply on Cloudflare Pages, not on `vitepress preview`.

The live navigation title is the text **Investhub Docs**. There is no logo file. Colors are the VitePress defaults. `/api/` links `/favicon.png`, which is also missing on the live site.

## License

TODO (Marcel): confirm the license. This repo currently uses [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) for the documentation content. MIT is also fine. See `LICENSE`.
