# NuBerea for OpenClaw

OpenClaw plugin for the [NuBerea](https://nuberea.com) biblical data platform. Registers 7 MCP tools and a skill into the OpenClaw gateway, giving the agent direct access to Hebrew/Greek morphology, lexicons, Bible texts, Dead Sea Scrolls, and SQL analytics.

- Package name: `@nuberea/openclaw`
- Plugin id: `nuberea`
- Skill id: `nuberea`
- License: `MIT`
- Required auth: NuBerea account — OAuth 2.1 + PKCE via `npx @nuberea/sdk login`

## Requirements

- OpenClaw `>=2026.3.28`
- Node.js `>=18`
- A free NuBerea account at [nuberea.com](https://nuberea.com)

## Install

Install the plugin:

```bash
openclaw plugins install @nuberea/openclaw
```

Install the skill:

```bash
openclaw skills install nuberea
```

Authenticate (one-time browser sign-in):

```bash
npx @nuberea/sdk login
```

Restart the gateway:

```bash
openclaw gateway restart
```

## Auth setup

The `@nuberea/sdk login` command opens a browser to `nuberea.com`, completes OAuth 2.1 + PKCE, and stores access/refresh tokens in the OS keychain under service `nuberea`, account `tokens`. Tokens auto-refresh before expiry — no recurring manual steps required.

There are no required environment variables. If the OS keychain is unavailable, the SDK falls back to a platform state directory file:

- macOS: `~/Library/Application Support/nuberea/tokens.json`
- Linux: `~/.local/state/nuberea/tokens.json`
- Windows: `%APPDATA%/nuberea/tokens.json`

## What the plugin calls

All 7 tools make HTTPS requests to the NuBerea MCP server at `https://nuberea.com/mcp`. Each call sends a JSON-RPC `tools/call` request and returns read-only query results. No local files, environment variables, or system resources are accessed beyond the stored OAuth token.

SQL endpoints (`nuberea_query`) enforce SELECT-only queries server-side. No INSERT, UPDATE, DELETE, or DDL is permitted.

## Tools registered

| Tool | Description |
|---|---|
| `nuberea_verse` | KJV verse lookup by book, chapter, and verse |
| `nuberea_bible_search` | KJV full-text search |
| `nuberea_greek_lookup` | LSJ Greek lexicon lookup |
| `nuberea_hebrew_lookup` | BDB Hebrew lexicon lookup by Strong's number |
| `nuberea_greek_morphology` | Macula Greek morphological analysis for a NT verse |
| `nuberea_hebrew_morphology` | Macula Hebrew morphological analysis for an OT verse |
| `nuberea_query` | Read-only SQL analytics across all NuBerea datasets |

## Datasets available via `nuberea_query`

| Schema | Description | Rows |
|---|---|---|
| `hebrew.morphemes` | Hebrew Bible word-by-word morphology (WLC/Macula) | 467,770 |
| `greek.morphemes` | Greek NT morphology (Nestle 1904/Macula) | 137,741 |
| `lxx.morphemes` | Septuagint LXX morphology | 623,693 |
| `lsj.entries` | Liddell-Scott-Jones Greek Lexicon | 119,553 |
| `bdb.entries` | Brown-Driver-Briggs Hebrew Lexicon | 10,221 |
| `kjv.verses` | King James Version Bible text | 36,821 |
| `dss.scrolls` | Dead Sea Scrolls word annotations | 500,991 |
| `cntr.transcriptions` | CNTR Greek NT manuscript transcriptions | 41,956 |
| `aland.pericopes` | Synoptic parallel pericopes (Aland) | 330 |

## Example agent prompts

- "Look up the Greek word λόγος in the LSJ lexicon"
- "What is the Hebrew morphology of Genesis 1:1?"
- "Find every verse in John that contains the word 'light'"
- "Join the Greek NT with the Septuagint on lemma for John 1:1 and show the gloss and definition"
