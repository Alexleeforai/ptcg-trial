# SNKRDUNK Index + Auto-Match Runbook

This runbook describes the automated matching pipeline:

1. Build/update `SnkrdunkIndex` from SNKRDUNK public sitemaps
2. Auto-match local `Card` documents by `setCode + cardNum`

## Required secrets

Configure these in GitHub Actions secrets:

- `MONGODB_URI` (required)
- `SNKRDUNK_UA` (optional; custom User-Agent string)

## Local commands

```bash
# Build index (incremental sample)
npm run snkrdunk:index -- --mode=incremental --sitemap-limit=1 --max-urls=3000

# Full build (all sitemap files)
npm run snkrdunk:index -- --mode=full --sitemap-limit=8 --max-urls=0

# Dry-run matching
npm run snkrdunk:match-index -- --dry-run=true

# Apply matching
npm run snkrdunk:match-index
```

## GitHub Actions workflow

Workflow file: `.github/workflows/snkrdunk-index-match.yml`

- Scheduled daily run at 03:30 HKT
- Manual `workflow_dispatch` supports:
  - `mode`: `incremental` or `full`
  - `sitemap_limit`: number of sitemap files to process
  - `max_urls`: max URLs per sitemap (`0` = all)
  - `dry_run`: do not write DB

## Matching rules

- Uses exact `setCode` + parsed `cardNum`
- Skips cards with no `setCode`
- Skips cards with no detectable card number
- Will not overwrite manual lock (`snkrdunkProductId > 0 && snkrdunkAutoMatched === false`)

