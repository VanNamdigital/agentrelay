# Upgrading

## Global Installs

```bash
npm install -g @vannamdigital/agentrelay@latest
agentrelay
```

The dashboard checks npm for a newer `@vannamdigital/agentrelay` version after login. When a newer package is available, it shows an update banner with the exact command to run, then the user should restart AgentRelay.

Set `UPDATE_CHECK_ENABLED=false` to disable the npm update check.

## Cloned Repo Installs

```bash
git pull
npm install
npm run build:dashboard
npm start
```

## Migrating from 2.0.1 Global Installs

If you installed version `2.0.1` globally, migrate legacy runtime data once before updating:

```powershell
$legacy = Join-Path (npm root -g) '@vannamdigital\agentrelay'
$target = Join-Path $HOME '.agentrelay'
New-Item -ItemType Directory -Force -Path $target
if ((Test-Path "$legacy\.env") -and -not (Test-Path "$target\.env")) { Copy-Item "$legacy\.env" "$target\.env" }
if ((Test-Path "$legacy\data") -and -not (Test-Path "$target\data")) { Copy-Item "$legacy\data" "$target\data" -Recurse }
```

Global installs store runtime config, SQLite data, and logs in `~/.agentrelay` by default. Set `AGENTRELAY_HOME` before running `agentrelay` if you want a different data directory.
