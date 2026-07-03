# Shovel integration guide (for agents)

Use this document when integrating **Shovel** into another codebase via the **vanilla script** approach (`index.js` + CSS). Shovel is a visual CSS editor that maps page elements back to CSS rules and can open GitHub PRs with the changes.

**Source repo:** Shovel / Shovyl (`index.js`, `styles.css`)  
**Integration model:** copy two artifacts, stamp HTML, load one script. No npm package required for vanilla sites.

---

## What Shovel needs to work

1. **`index.js`** — editor overlay, live preview, GitHub PR flow (self-booting IIFE, ~500 lines, no imports)
2. **Shovel editor CSS** — all rules under `/* Shovel editor UI */` in `styles.css` (classes prefixed with `.shovel-`)
3. **Stamped elements** — at least one element with `data-shovel-source`
4. **Matching CSS rules** — the stamped selector must exist as a rule block in the referenced CSS file

Shovel **does not inject its own styles**. If you only add `index.js`, the UI will be broken/unstyled.

---

## Agent checklist

Copy this checklist and mark items as you go:

```
[ ] 1. Copy index.js into the target project (e.g. public/shovel/index.js)
[ ] 2. Extract Shovel CSS into a dedicated file (e.g. public/shovel/shovel.css)
[ ] 3. Link shovel.css in the HTML layout (or main template)
[ ] 4. Load index.js as type="module" before </body>
[ ] 5. Add data-shovel-source to editable elements
[ ] 6. Verify each data-shovel-source points to a real CSS rule in the repo
[ ] 7. (Optional) Set window.__SHOVEL_CONFIG for default GitHub repo/branch
[ ] 8. (Recommended) Only load Shovel on staging/local, not production
[ ] 9. Smoke test: shovel button appears, element select works, CSS preview updates
```

---

## Step 1 — Copy files from Shovel repo

From the Shovel repo root, copy:

| Source | Suggested target in other project |
|--------|-----------------------------------|
| `index.js` | `public/shovel/index.js` or `static/shovel/index.js` |
| `styles.css` (Shovel section only — from `/* Shovel editor UI */` to EOF) | `public/shovel/shovel.css` |

**Do not** copy the demo page styles (`.hero`, `.card`, etc.) unless the target project needs them.

**Quick extract** (from Shovel repo root, adjust start line if needed):

```bash
sed -n '/Shovel editor UI/,$p' styles.css > public/shovel/shovel.css
```

`index.js` boots automatically on `DOMContentLoaded`. It has **no imports**.

---

## Step 2 — Wire into HTML / layout

Add to the main HTML template (or root layout component's static HTML shell):

```html
<!-- Shovel editor styles (required) -->
<link rel="stylesheet" href="/shovel/shovel.css" />

<!-- Optional: pre-fill GitHub settings -->
<script>
  window.__SHOVEL_CONFIG = {
    repo: "your-org/your-repo",
    baseBranch: "main",
  };
</script>

<!-- Shovel editor script (must be type="module") -->
<script type="module" src="/shovel/index.js"></script>
```

### Staging-only gating (recommended)

Only include Shovel on local/staging builds. **Do not ship to production.**

**Plain HTML** — wrap in a build-time comment or server-side include:

```html
<!-- SHOVEL_START (staging only) -->
<link rel="stylesheet" href="/shovel/shovel.css" />
<script type="module" src="/shovel/index.js"></script>
<!-- SHOVEL_END -->
```

**Vite** — gate in `vite.config.js` with `transformIndexHtml`:

```js
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "shovel-staging",
      transformIndexHtml(html) {
        if (process.env.SHOVEL_STAGING !== "true") return html;
        return html.replace(
          "</head>",
          '  <link rel="stylesheet" href="/shovel/shovel.css" />\n  </head>',
        ).replace(
          "</body>",
          '  <script type="module" src="/shovel/index.js"></script>\n  </body>',
        );
      },
    },
  ],
});
```

Run staging with: `SHOVEL_STAGING=true npm run dev`

**Next.js (App Router)** — in `app/layout.tsx`:

```tsx
const isShovelStaging = process.env.SHOVEL_STAGING === "true";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {isShovelStaging && (
          <link rel="stylesheet" href="/shovel/shovel.css" />
        )}
      </head>
      <body>
        {children}
        {isShovelStaging && (
          <script type="module" src="/shovel/index.js" />
        )}
      </body>
    </html>
  );
}
```

Put `index.js` and `shovel.css` in `public/shovel/`. Set `SHOVEL_STAGING=true` in `.env.local` only.

---

## Step 3 — Stamp editable elements

Add attributes to any element designers should edit visually:

```html
<button
  class="hero__cta"
  data-shovel-source="src/styles/main.css:.hero__cta"
  data-shovel-tag="button"
>
  Get started
</button>
```

### `data-shovel-source` format

```
<css-file-path>:<css-selector>
```

- **File path** — path relative to repo root (as GitHub API expects), e.g. `styles.css`, `src/app/globals.css`
- **Selector** — exact CSS rule selector that exists in that file, e.g. `.hero__cta`, `.card--accent .card__title`
- First `:` separates file from selector. Selectors should not contain unencoded `:`.

**Examples:**

| Attribute value | Meaning |
|----------------|---------|
| `styles.css:.hero__cta` | Rule `.hero__cta` in `styles.css` |
| `styles.css:.card--accent .card__title` | Nested selector in `styles.css` |
| `src/styles/main.css:.landing-content h1` | Descendant selector in `src/styles/main.css` |

### `data-shovel-tag` (optional)

Human-readable tag name shown in the editor UI (e.g. `button`, `h1`, `article`). Defaults to the element's lowercase tag name if omitted.

### Boot guard

Shovel only boots if **at least one** `[data-shovel-source]` exists on the page. If none are found:

```
[Shovel] No stamped elements found.
```

---

## Step 4 — Ensure CSS rules exist

For each stamped element, the referenced selector **must** exist as a rule block in the CSS file. Shovel's PR flow uses regex to find and update that rule:

```css
.hero__cta {
  background: #0f172a;
  padding: 0.75rem 1.25rem;
}
```

If the selector is missing, PR submission fails with:

```
Selector not found in CSS: .hero__cta
```

**Agent task:** When adding `data-shovel-source`, grep the target CSS file to confirm the selector exists. If styles are utility-class-only (Tailwind in HTML, no CSS rules), Shovel's vanilla script **cannot** edit them — you need real CSS rule blocks.

---

## Step 5 — GitHub PR flow (designer workflow)

Once integrated, the workflow is:

1. Open staging/local URL
2. Click the **⛏ shovel button** (bottom-right)
3. Click an element on the page
4. Edit CSS properties in the side panel (live preview via inline styles)
5. Open the **GitHub** tab → enter `org/repo`, base branch, and a GitHub PAT
6. Click **Submit PR**

Shovel will:

- Fetch the CSS file from GitHub
- Rewrite the matching rule with changed properties
- Create a branch (`shovel/edit-<timestamp>`) and open a PR

PAT is stored in `sessionStorage` under key `shovel_github_pat`.

---

## Editable CSS properties

The script exposes these properties in the editor panel:

`color`, `background-color`, `padding-*`, `margin-*`, `font-size`, `font-weight`, `border-radius`, `width`, `height`, `gap`, `display`

Changes preview live on the element via `element.style.setProperty()`. **Reset preview** restores computed values from before editing.

---

## Framework notes

### Plain HTML / static sites

Follow steps above directly. Simplest integration path. Place files in a `shovel/` folder at site root or under `public/`.

### Vite / any bundler

- Place `index.js` and `shovel.css` in `public/` so they are served at `/shovel/...`
- Use `type="module"` script tag
- Gate behind `SHOVEL_STAGING=true` for non-production builds

### React / Vue / SSG

The vanilla script does **not** auto-stamp components. Add `data-shovel-source` manually to rendered HTML/JSX:

```jsx
<button
  className="hero__cta"
  data-shovel-source="src/styles/main.css:.hero__cta"
  data-shovel-tag="button"
>
  Get started
</button>
```

For automatic JSX stamping, Shovel has optional tooling in `tooling/` (`@shovel/vite-plugin`, `@shovel/babel-plugin`). That is a separate integration path — **this guide covers the script-only approach**.

### Next.js / App Router

- Put `index.js` + `shovel.css` in `public/shovel/`
- Conditionally render `<link>` and `<script>` in `app/layout.tsx` when `SHOVEL_STAGING === 'true'`
- Stamp elements in server or client components via `data-shovel-source`
- Never set `SHOVEL_STAGING` in production env vars

---

## Verification (smoke test)

After integration, confirm:

1. **Console:** `[Shovel] Editor ready — click any element or the shovel button to start.`
2. **UI:** ⛏ button visible bottom-right, styled correctly (not unstyled HTML)
3. **Select:** Clicking a stamped element opens the side panel and highlights the element
4. **Preview:** Changing a property (e.g. color) updates the element live
5. **Details:** Element details dropdown shows tag + source path
6. **No stamped elements:** Page without stamps logs warning and does not mount overlay

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| No shovel button | No `data-shovel-source` on page | Stamp at least one element |
| Broken/unstyled panel | Missing `shovel.css` | Link the Shovel editor CSS |
| Element not selectable | Missing/wrong `data-shovel-source` | Check attribute on element or ancestor |
| PR fails: selector not found | Selector doesn't exist in CSS file | Add the CSS rule or fix the selector string |
| PR fails: file not found | Wrong file path in `data-shovel-source` | Use repo-root-relative path matching GitHub |
| Script doesn't run | Wrong script type or path | Use `type="module"` and correct public URL |
| 404 on `/shovel/index.js` | Files not in static dir | Copy to `public/shovel/` (or equivalent) |
| Shovel on production | No env gating | Wrap script/link in staging-only condition |
| CORS / module error | Opening HTML via `file://` | Serve over HTTP (`npm run dev`, Live Server, etc.) |

---

## Files to never modify in the target project (unless fixing bugs)

When copying from Shovel, treat `index.js` as a vendored file. Prefer:

- Config via `window.__SHOVEL_CONFIG`
- Styling via `shovel.css` overrides (if needed)
- Stamping via HTML/JSX attributes

---

## Minimal end-to-end example

**`public/shovel/shovel.css`** — copy Shovel editor UI section from Shovel `styles.css`

**`public/shovel/index.js`** — copy Shovel `index.js`

**`index.html`:**

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/shovel/shovel.css" />
  </head>
  <body>
    <button
      class="cta"
      data-shovel-source="styles.css:.cta"
      data-shovel-tag="button"
    >
      Click me
    </button>

    <script>
      window.__SHOVEL_CONFIG = { repo: "org/repo", baseBranch: "main" };
    </script>
    <script type="module" src="/shovel/index.js"></script>
  </body>
</html>
```

**`styles.css`:**

```css
.cta {
  background: #111827;
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
}
```

---

## Cursor rule for target projects

Copy [`shovel-integration.cursor-rule.mdc`](./shovel-integration.cursor-rule.mdc) to the target repo:

```
your-other-repo/.cursor/rules/shovel-integration.mdc
```

Set `alwaysApply: true` in the frontmatter if you want the rule always on in that repo.

---

## Agent instructions summary

When asked to integrate Shovel into a codebase:

1. Locate the project's CSS files and main HTML/layout entry point.
2. Copy `index.js` and Shovel editor CSS from the Shovel repo into `public/shovel/` (or equivalent static dir).
3. Link CSS + script in the layout; gate behind staging env.
4. Add `data-shovel-source="<css-file>:<selector>"` to elements that map to real CSS rules.
5. Verify selectors exist in the referenced CSS files.
6. Do not add Shovel to production builds.
7. Run smoke test locally.

**Do not** use `npm install shovel` — there is no published npm package for the vanilla script. Copy the files.
