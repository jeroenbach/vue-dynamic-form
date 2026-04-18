# Vue Dynamic Form

A schema-driven Vue form library built on top of `vee-validate`.

The repository contains:

- `packages/core`: the core library
- `docs/`: the VitePress manual with interactive demos
- `playgrounds/storybook`: component-focused exploration

## Start Here

- Manual: [docs/index.md](docs/index.md)
- Core package guide: [packages/core/README.md](packages/core/README.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Local Development

```bash
pnpm install
pnpm test
pnpm docs:dev
```

## Release Flow

1. Run `pnpm changeset`.
2. Open your PR against `main`.
3. Let the release workflow handle versioning and publishing.
