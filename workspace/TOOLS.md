# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Host

- Environment: DigitalOcean droplet running Ubuntu 24.04.4 LTS.
- Public IP observed on 2026-07-03: `203.0.113.10`.
- Eve has root-level system access in this Linux environment; inspect existing state before changing services/config.

## Web Serving

- Nginx installed from Ubuntu packages: `nginx/1.24.0 (Ubuntu)`.
- Nginx service is enabled and active under systemd.
- Canonical public domain: `https://docs.acmecorp.example` (use this in every link you give out).
- Vhost: `/etc/nginx/sites-available/docs-acmecorp` (HTTPS, Letsencrypt cert, HTTP to HTTPS redirect).
- Legacy domain still served: `https://docs-legacy.acmecorp.example` (vhost `docs-acmecorp-legacy`). Do not cite it in answers.
- Catch-all HTTP site: `/etc/nginx/sites-available/eve-landing` (server_name `_`).
- Enabled symlinks in `/etc/nginx/sites-enabled/`: `eve-landing`, `docs-acmecorp-legacy`, `docs-acmecorp`.
- Certbot auto-renewal runs via `certbot.timer`; both certificates renew unattended.
- Ubuntu package default site symlink moved to `/etc/nginx/sites-disabled/default`; source remains at `/etc/nginx/sites-available/default`.
- Current static root served at `/`: `/srv/wiki/current` (symlink to the live release).
- Temporary original landing remains at `/var/www/eve-landing`.
- Health check: `http://127.0.0.1/health` returns `ok`.

## Acmecorp Docs Site

- Repository: `https://gitlab.com/acmecorp/acmecorp-docs-site`.
- Local checkout: `/srv/acmecorp-docs-site`.
- Only allowed branch to modify: `feat/reestructura-areas-empresa`.
- Publish command: `wiki-publish` (builds to a new release, validates, then swaps the symlink atomically). Never run `npm run build` directly: it writes to a directory nothing serves.
- Releases live in `/srv/wiki/releases/<timestamp>`; `/srv/wiki/current` points at the published one. The 3 newest are kept, older ones are pruned automatically.
- A failed build never reaches the live site, and rollback is `ln -sfn /srv/wiki/releases/<older> /srv/wiki/current`.
- Do not store GitLab access tokens in files, remotes, or memory notes.

## Acmecorp Doc Link Resolver

- Purpose: answer docs-link questions with minimal token usage by searching a compact local index instead of reading the docs into context.
- Config: `/etc/eve-doc-link/config.json`.
- Scripts: `/opt/eve-doc-link/build-index.cjs` and `/opt/eve-doc-link/search.cjs`.
- Compact index: `/var/lib/eve-doc-link/index.json`.
- `wiki-publish` regenerates this index automatically after each publish; no separate step needed.
- Search one best link: `eve-doc-link "image tracker 8th wall"`.
- Search with ambiguity handling for Slack: `eve-doc-link --auto "lens studio"`.
- Machine-readable candidates: `eve-doc-link --json --auto "lens studio"`.
- Current public base URL in config: `https://docs.acmecorp.example`.
- `wiki-publish` already reindexes after publishing, so links never go stale on their own.
- The index is generated from the Docusaurus build, so `slug`/`id` are already resolved and `deprecated/` is excluded automatically. Prefer it over reading files when citing links.

## Swap

- `/swapfile` is a 4 GB swapfile, enabled and persisted in `/etc/fstab`.
- It was added because Docusaurus production build was OOM-killed on the 2 GB RAM droplet with no swap.

## Related

- [Agent workspace](/concepts/agent-workspace)
