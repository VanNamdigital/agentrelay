# Publishing

Before publishing or pushing a release, verify:

```bash
npm run check
npm test
npm run build:dashboard
npm audit --omit=dev --audit-level=moderate
```

Do not commit:

- `.env`
- `data/`
- `logs/`
- `node_modules/`
- `dashboard/node_modules/`
- `public/dashboard/`
- SQLite files

## npm Package Contents

`package.json` `files` should include runtime source, dashboard source/artifacts needed by setup scripts, images, docs, and top-level policy files.

After publishing, users can install with:

```bash
npm install -g @vannamdigital/agentrelay
agentrelay
```

## Release Notes

Record notable changes in `CHANGELOG.md` before tagging a release.
