# NuBerea for OpenClaw

OpenClaw plugin for the [NuBerea](https://nuberea.com) biblical data platform. Registers 7 MCP tools and a skill into the OpenClaw gateway, giving the agent direct access to Hebrew/Greek morphology, lexicons, Bible texts, Dead Sea Scrolls, and SQL analytics.

- Package name: `@nuberea/openclaw`
- Plugin id: `nuberea`
- Skill id: `nuberea`
- License: `MIT`
- Required auth: NuBerea account — OAuth 2.1 + PKCE via `npx @nuberea/sdk login`

## Requirements

- OpenClaw `>=2026.11.2` (development and registration tests pin `2026.11.2`)
- Node.js `>=24.16.0 <25 || >=26.1.0`, matching that host's supported runtimes
- A free NuBerea account at [nuberea.com](https://nuberea.com)

### Security and the 2.0 release

Version 2.0 raises the host and Node.js minimums, so this is a breaking release,
not a patch to 1.0.0. The previously allowed OpenClaw 2026.3.28 baseline is
affected by known host advisories. As of November 10, 2026, the latest first-fixed
version among the 208 reported OpenClaw advisories is 2026.6.6, but that older
host still resolves vulnerable transitive packages. The development host is
therefore pinned to the current 2026.11.2 release, and all host minimum
declarations use that same floor. This is a baseline for known advisories, not
a guarantee against future vulnerabilities. Keep the separately installed
OpenClaw gateway updated.

The package does not bundle or upgrade the gateway. Existing installations must
upgrade their host themselves; editing repository metadata does not patch a
running gateway. Because OpenClaw's plugin APIs are experimental, registration
tests on the pinned version do not prove compatibility with every future host.
Validate a newer host before deploying it.

The development tree also uses scoped overrides for the host's pinned Zod and
minimatch dependencies and updates its embedded npm dependency to 12.2.2.
Root-package overrides do not propagate to consumers of this plugin and do not
patch a separately installed gateway. The current published host still requires
upstream dependency fixes; do not treat installing this plugin as a gateway
security update.

The full development audit still reports moderate findings rooted in the npm
package's **bundled** `glob` and `minimatch` copies. npm overrides do not replace
those bundled copies. They and their affected-package chains remain visible;
the release does not claim an all-clear full-host audit. There are no
critical/high findings in the tested development tree and `npm audit --omit=dev`
reports no findings for the plugin's shipped dependencies. These audit results
do not establish reachability or prove the whole gateway secure.

### Package release

Merging a new package version to `main` triggers the automated release workflow
described under [Publishing](#publishing). A merge alone is not proof of
publication: check the workflow result and verify npm `latest` separately with
`npm view @nuberea/openclaw version`. In particular, the SDK dependency update
from `^0.0.7` to `^0.1.5` is not available to users of the old published plugin
until a new package is successfully released.

The 2.0.0 version here is release preparation, not evidence that npm publication
has happened. Review the breaking host/runtime requirements and remaining
upstream audit limitations before authorizing a release.

`prepack` rebuilds the entry point even for a local tarball. The automated release
builds, runs the registration/tool tests and shipped dependency audit, and then
publishes that validated tarball. Local builds, tests, and package inspection do
not publish anything by themselves.

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

## Publishing

[Build and publish](.github/workflows/publish.yml) builds and packs the plugin on
every pull request and push to `main`. Merging an unpublished package version to
`main` automatically publishes the validated tarball to npm with provenance.
Already-published versions are skipped, so ordinary merges and workflow retries
do not try to overwrite an npm release.

### One-time npm setup

In the `@nuberea/openclaw` package settings on npmjs.com, add a **GitHub Actions
trusted publisher** with these case-sensitive values:

| Field | Value |
|---|---|
| Organization or user | `streamsapps` |
| Repository | `nuberea-openclaw` |
| Workflow filename | `publish.yml` |
| Environment | Leave empty |

Allow direct publishing, not stage-only publishing. No `NPM_TOKEN` or GitHub
secret is required. The publish job uses OIDC on a GitHub-hosted runner with
Node.js 26 and npm 11.5.1 or later. A newly configured publisher must complete its
first publish within two days; otherwise, recreate it before retrying.
See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

### Releasing a version

After merging the changes to release, prepare a release branch:

```bash
git switch main
git pull --ff-only
git switch -c release/next
npm ci --ignore-scripts
npm version patch --no-git-tag-version
# Set openclaw.plugin.json's version to match package.json.
git add package.json package-lock.json openclaw.plugin.json
git commit -m "chore: release next patch"
git push -u origin release/next
```

Open a pull request and merge it to `main`. Use `minor` or `major` instead of
`patch` when appropriate. Dependency updates also need a package version bump
to reach existing consumers; publishing does not invent versions or commit back
to the repository.

Pushing a `v<version>` tag also triggers publishing, but its version must match
`package.json`. The workflow can be run manually from `main` or a matching
version tag after fixing a failed release (for example, after configuring the
trusted publisher). Only stable versions are published to `latest`, and an
unpublished version older than the current npm `latest` is rejected.
