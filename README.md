# Portfolio demo

Static portfolio site with Shovel visual CSS editor (staging only).

**CSS source of truth:** `styles/main.scss` → `styles.css`. Local (`npm start`) and Netlify both compile the same SCSS so preview, prod, and localhost stay in sync.

```bash
cp .env.example .env   # add GITHUB_TOKEN
npm install
npm run dev              # live reload on save — http://localhost:3847
```

**Deploy parity:** `netlify.toml` runs `npm run build` (SCSS compile) before publish. Commit `styles/` + `netlify.toml` with any Shovel changes.

Integration guide for other projects: **[docs/SHOVEL_INTEGRATION.md](docs/SHOVEL_INTEGRATION.md)**
