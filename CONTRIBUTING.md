# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc` or `engines` in `package.json`)
- [pnpm](https://pnpm.io/)

## Setup

```bash
git clone https://github.com/jeroenbach/dynamic-form.git
cd dynamic-form
pnpm install
```

`postinstall` automatically installs dependencies for the `docs` and `playgrounds/storybook` sub-projects.

## Project structure

```
packages/core          — the published library
playgrounds/storybook  — component playground (not published)
docs                   — VitePress documentation site (not published)
```

## Development workflow

Start the library in watch mode alongside the Storybook playground:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm build:watch   # rebuild packages/core on file change
pnpm storybook     # Storybook playground
pnpm docs:dev      # VitePress docs
```

## Testing & quality

```bash
pnpm test          # vitest
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint
```

All three are run together in CI via `pnpm ci`.

## Releasing a new version

The project uses [Changesets](https://github.com/changesets/changesets) for versioning. The process is two steps.

### Step 1 — describe the change (done while working on a feature/fix)

Run the interactive prompt and follow the instructions:

```bash
pnpm changeset
```

Choose the bump type (`major` / `minor` / `patch`) and write a changelog entry. This creates a Markdown file under `.changeset/`. Commit that file as part of your feature branch or as a separate commit.

### Step 2 — cut the release (done when ready to publish)

Create a dedicated release branch, run `changeset version`, and open a PR:

```bash
git checkout -b changeset-release/main
pnpm changeset version
git add .
git commit -m "chore: release"
# open a PR titled "chore: release" → merge into main
```

`changeset version` will:
- delete the `.md` file(s) from `.changeset/`
- bump the version in `packages/core/package.json`
- append the changelog entry to `CHANGELOG.md`

After the PR is merged, publish to npm from `main`:

```bash
pnpm changeset publish
```
