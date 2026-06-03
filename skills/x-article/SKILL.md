---
name: x-article
description: Extract full text from X (Twitter) articles (x.com/i/article/...). Use when a tweet links to an X article and you need the actual article content — web scrapers, the X API, and Firecrawl all fail on these. Triggers on X article URLs, tweets containing article links, or requests to "read this X article" or "get the full article from this tweet".
triggers:
  - "read this X article"
  - "get the full article from this tweet"
  - "x.com/i/article"
  - "extract X article"
---

# X Article Reader

X articles (`x.com/i/article/...`) are locked behind auth walls that block all standard extraction methods:
- ❌ `web_fetch` — returns login page
- ❌ X API (`xurl read`) — doesn't expose article body
- ❌ Firecrawl — blocked
- ❌ Google cache / Wayback Machine — rarely cached

## How to Extract

Use the bundled script with the tweet ID (not the article ID):

```bash
bash scripts/fetch-x-article.sh <tweet_id_or_url> [output_file]
```

The script:
1. Extracts the tweet ID from a URL (or accepts a bare ID)
2. Pulls `APIFY_TOKEN` from 1Password (`op://Agents/Apify API Key/credential`) if not set
3. Runs the `fastcrawler~x-twitter-article-to-markdown` Apify actor
4. Returns the full article as markdown

### Examples

```bash
# From a tweet URL
bash scripts/fetch-x-article.sh "https://x.com/garrytan/status/2053127519872614419"

# Bare tweet ID, save to file
bash scripts/fetch-x-article.sh 2053127519872614419 ~/wiki/raw/articles/garry-article.md

# With token already set
APIFY_TOKEN=xxx bash scripts/fetch-x-article.sh 2053127519872614419
```

### Identifying X Articles

A tweet contains an X article when:
- The tweet URL or expanded URL points to `x.com/i/article/<id>`
- `xurl read <tweet_id>` shows an `article` field with a `title`
- The tweet text is just a `t.co` link that resolves to an article URL

### Costs

Each extraction uses one Apify actor run (~$0.01-0.05 depending on plan). Don't run in tight loops.
