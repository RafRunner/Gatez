# Development setup

## Requirements

-   **Node.js 16** (the build was never updated past it; the `Dockerfile` uses `node:16`). With nvm: `nvm install 16 && nvm use 16`.
-   **Yarn 1** (`npm install -g yarn`)
-   **Java** (runs the texture packer that builds the sprite atlas)
-   **ffmpeg** on your `PATH` (sound processing)

## Running the game

```bash
yarn            # root dependencies
cd gulp
yarn            # build-tool dependencies
yarn gulp       # dev build + live reload at http://localhost:3005
```

`yarn dev` in the root does the same as the last step. Edits to `src/` and `res_raw/` rebuild automatically.

Debug flags (e.g. `fastGameEnter`, `noArtificialDelays`, `disableSavegameWrite`) go in `src/js/core/config.local.js`. Copy them from `config.local.template.js`.

## Running with the backend

The game talks to `http://localhost:15001` (hard-coded in `src/js/platform/api.js` → `getEndpoint`).

```bash
# in ../gatez-backend
yarn
echo 'JWT_KEY="any-secret"' > .env
yarn dev
```

Then in the game: **Create account** → **Sign in** → **Puzzle mode**. Without the backend, use **Play offline** to play the bundled official levels.

To play from another device on your network, change `getEndpoint()` to your machine's IP.

## Useful scripts

| Command (root) | Description |
| -------------- | ----------- |
| `yarn dev` | Dev server (`gulp main.serveDev`) |
| `yarn lint` | ESLint on `src/js` |
| `yarn tslint` | Type check via `tsc` on the JSDoc types |
| `yarn prettier-all` | Format sources |
| `yarn syncTranslations` | Sync every language file with `base-en.yaml` (adds missing keys, removes obsolete ones) |

## Production builds

⚠️ They don't work yet. The `html.staging`, `html.prod`, `html.standalone-beta` and `html.standalone-prod` tasks in `gulp/html.js` have their `return buildHtml(...)` commented out, and the deploy/publish scripts still point at upstream's FTP, itch.io and Steam. Only the dev builds (`html.dev`, `html.standalone-dev`) work. Fixing this is on the roadmap.

## Editing official levels

See the backend's [docs/DATA_MODEL.md](https://github.com/armandosneto/gatez-backend/blob/main/docs/DATA_MODEL.md#workflow-to-change-or-add-an-official-level). Remember to regenerate `src/js/platform/offlineFallback/officialLevelsDownload.json` afterwards.

## Code style

ES2015+ JavaScript with JSDoc types, checked by `tsc`, formatted with Prettier (`.prettierrc.yaml`), indented with 4 spaces. Commit messages follow Conventional Commits (`feat:`, `fix:`, `perf:`, ...).
