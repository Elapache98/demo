import "dotenv/config";
import { execSync } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureRootTokensInCss, loadShovelConfig, loadTokensFromFile } from "./lib/tokens.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3847;
const LIVE_RELOAD = process.env.SHOVEL_LIVE_RELOAD !== "false";
let stopLiveReload = () => {};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SHOVEL_REPO = process.env.SHOVEL_REPO || "Elapache98/demo";
const SHOVEL_BASE_BRANCH = process.env.SHOVEL_BASE_BRANCH || "main";

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) &&
    origin !== "http://localhost:" + PORT &&
    origin !== "http://127.0.0.1:" + PORT
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function parseSource(sourceAttr) {
  const splitAt = sourceAttr.indexOf(":");
  if (splitAt === -1) throw new Error("Invalid source: " + sourceAttr);
  return {
    file: sourceAttr.slice(0, splitAt),
    selector: sourceAttr.slice(splitAt + 1),
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setPropertyInRule(body, property, value) {
  var candidates = [property];
  if (property === "background-color") candidates.push("background");

  for (var i = 0; i < candidates.length; i++) {
    var prop = candidates[i];
    var propPattern = new RegExp(
      "\\s*" + escapeRegex(prop) + "\\s*:[^;\\n]*;?",
      "i",
    );
    if (propPattern.test(body)) {
      return body.replace(propPattern, "\n  " + prop + ": " + value + ";");
    }
  }
  return body + "\n  " + property + ": " + value + ";";
}

function isInsideMediaBlock(cssText, charIndex) {
  const before = cssText.slice(0, charIndex);
  let lastMediaOpen = -1;
  const mediaRegex = /@media[^{]*\{/g;
  let match;
  while ((match = mediaRegex.exec(before)) !== null) {
    lastMediaOpen = match.index + match[0].length - 1;
  }
  if (lastMediaOpen === -1) return false;

  let depth = 1;
  for (let i = lastMediaOpen + 1; i < charIndex; i++) {
    if (cssText[i] === "{") depth++;
    else if (cssText[i] === "}") depth--;
  }
  return depth > 0;
}

function isGroupedSelectorMatch(match, selector) {
  const header = match[0].slice(0, match[0].indexOf(match[1]));
  return header.includes(",");
}

function buildRuleBody(changes) {
  let body = "";
  for (const change of changes) {
    body = setPropertyInRule(body, change.property, change.value);
  }
  return body;
}

function insertCssRule(cssText, selector, changes) {
  const body = buildRuleBody(changes);
  const newRule = "\n" + selector + " {\n" + body + "\n}\n";

  const parts = selector.trim().split(/\s+/);
  if (parts.length > 1) {
    const parent = parts[0];
    const parentPattern = new RegExp(
      "(" + escapeRegex(parent) + "\\s*\\{)([\\s\\S]*?)(\\})",
      "gm",
    );
    const parentMatches = [...cssText.matchAll(parentPattern)];
    const baseParents = parentMatches.filter(function (m) {
      return !isInsideMediaBlock(cssText, m.index) && !isGroupedSelectorMatch(m, parent);
    });
    if (baseParents.length > 0) {
      let parentTarget = baseParents[0];
      for (const m of baseParents) {
        if (m[2].length > parentTarget[2].length) parentTarget = m;
      }
      const insertAt = parentTarget.index + parentTarget[0].length;
      return cssText.slice(0, insertAt) + newRule + cssText.slice(insertAt);
    }
  }

  const mediaIdx = cssText.search(/@media\b/);
  if (mediaIdx > 0) {
    return cssText.slice(0, mediaIdx) + newRule + cssText.slice(mediaIdx);
  }
  return cssText + newRule;
}

function applyCssChanges(cssText, selector, changes) {
  const rulePattern = new RegExp(
    "(" + escapeRegex(selector) + "\\s*\\{)([\\s\\S]*?)(\\})",
    "gm",
  );
  const matches = [...cssText.matchAll(rulePattern)];

  const baseMatches = matches.filter(function (m) {
    return !isInsideMediaBlock(cssText, m.index) && !isGroupedSelectorMatch(m, selector);
  });

  if (baseMatches.length === 0) {
    if (matches.length === 0) {
      return insertCssRule(cssText, selector, changes);
    }
    return insertCssRule(cssText, selector, changes);
  }

  let target = baseMatches[0];
  for (const match of baseMatches) {
    if (match[2].length > target[2].length) target = match;
  }

  let body = target[2];
  for (const change of changes) {
    body = setPropertyInRule(body, change.property, change.value);
  }

  const updatedRule = target[1] + body + target[3];
  return cssText.slice(0, target.index) + updatedRule + cssText.slice(target.index + target[0].length);
}

function encodeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function isSafeRelativePath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  if (filePath.includes("..") || path.isAbsolute(filePath)) return false;
  return true;
}

function resolveSafePath(relativePath) {
  if (!isSafeRelativePath(relativePath)) {
    throw new Error("Invalid file path: " + relativePath);
  }
  const resolved = path.resolve(__dirname, relativePath);
  const root = path.resolve(__dirname);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Path outside project: " + relativePath);
  }
  return resolved;
}

function rebuildStylesFromScss() {
  const mainScss = path.join(__dirname, "styles", "main.scss");
  if (!fs.existsSync(mainScss)) return false;
  execSync("npm run build:styles", { cwd: __dirname, stdio: "pipe" });
  return true;
}

function finalizeCssForDeploy(cssText) {
  return ensureRootTokensInCss(cssText, __dirname);
}

const SCSS_LEGACY = "styles/styles.legacy.scss";
const SCSS_PIPELINE_FILES = [
  "styles/main.scss",
  "styles/_tokens.scss",
  SCSS_LEGACY,
  "netlify.toml",
];

async function remoteFileExists(github, filePath) {
  try {
    await github.fetchFile(filePath);
    return true;
  } catch (_err) {
    return false;
  }
}

/** Patch SCSS source, rebuild styles.css — same pipeline as local npm start. */
async function buildPrStyleFiles(github, fileEdits) {
  let scssText;
  try {
    scssText = await github.fetchFile(SCSS_LEGACY);
  } catch (_err) {
    const localPath = resolveSafePath(SCSS_LEGACY);
    if (fs.existsSync(localPath)) {
      scssText = fs.readFileSync(localPath, "utf8");
    }
  }
  if (!scssText) return null;

  for (const edit of fileEdits) {
    scssText = applyCssChanges(scssText, edit.selector, edit.changes);
  }

  const scssPath = resolveSafePath(SCSS_LEGACY);
  fs.mkdirSync(path.dirname(scssPath), { recursive: true });
  fs.writeFileSync(scssPath, scssText, "utf8");
  if (!rebuildStylesFromScss()) return null;

  const files = [{ filePath: SCSS_LEGACY, content: scssText }];
  files.push({
    filePath: "styles.css",
    content: fs.readFileSync(resolveSafePath("styles.css"), "utf8"),
  });
  return files;
}

async function appendMissingPipelineFiles(github, filesToCommit) {
  const have = new Set(filesToCommit.map(function (f) { return f.filePath; }));
  for (const rel of SCSS_PIPELINE_FILES) {
    if (have.has(rel)) continue;
    const localPath = resolveSafePath(rel);
    if (!fs.existsSync(localPath)) continue;
    if (await remoteFileExists(github, rel)) continue;
    filesToCommit.push({
      filePath: rel,
      content: fs.readFileSync(localPath, "utf8"),
    });
  }
}

function createGitHubClient(token, repo, baseBranch) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error("SHOVEL_REPO must be org/repo");

  const apiBase = "https://api.github.com";

  async function request(pathname, init) {
    let response;
    try {
      response = await fetch(apiBase + pathname, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + token,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init?.headers || {}),
        },
      });
    } catch (err) {
      const detail = err.cause?.message || err.message || String(err);
      throw new Error("Cannot reach GitHub API (" + detail + "). Check internet/VPN/firewall.");
    }
    const body = await response.text();
    if (!response.ok) {
      throw new Error("GitHub API " + response.status + ": " + body);
    }
    if (response.status === 204) return null;
    return JSON.parse(body);
  }

  return {
    fetchFile(filePath, ref = baseBranch) {
      return request(
        "/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(filePath) + "?ref=" + encodeURIComponent(ref),
      ).then((data) => {
        if (!data?.content) throw new Error("File not found: " + filePath);
        return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
      });
    },
    fetchPullRequest(number) {
      return request("/repos/" + owner + "/" + name + "/pulls/" + number);
    },
    async createPullRequestMulti(params) {
      const branchName = "shovel/edit-" + Date.now();
      const files = params.files || [];

      const baseRef = await request(
        "/repos/" + owner + "/" + name + "/git/ref/heads/" + encodeURIComponent(baseBranch),
      );
      if (!baseRef?.object?.sha) {
        throw new Error("Base branch not found: " + baseBranch);
      }

      await request("/repos/" + owner + "/" + name + "/git/refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: "refs/heads/" + branchName,
          sha: baseRef.object.sha,
        }),
      });

      for (const fileUpdate of files) {
        const filePath = fileUpdate.filePath;
        let existing = null;
        try {
          existing = await request(
            "/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(filePath) + "?ref=" + encodeURIComponent(baseBranch),
          );
        } catch (_err) {
          existing = null;
        }

        const payload = {
          message: "Shovel: update " + filePath,
          content: encodeBase64(fileUpdate.content),
          branch: branchName,
        };
        if (existing?.sha) payload.sha = existing.sha;

        await request("/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(filePath), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      return request("/repos/" + owner + "/" + name + "/pulls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: params.title,
          head: branchName,
          base: baseBranch,
          body: params.body,
        }),
      });
    },
  };
}

app.get("/api/shovel/health", (_req, res) => {
  res.json({
    ok: true,
    github: Boolean(GITHUB_TOKEN),
    repo: SHOVEL_REPO,
    branch: SHOVEL_BASE_BRANCH,
  });
});

app.get("/api/shovel/tokens", (_req, res) => {
  try {
    const config = loadShovelConfig(__dirname);
    const tokens = loadTokensFromFile(__dirname, config.tokensFile);
    res.json({
      tokens,
      propertyTokenGroups: config.propertyTokenGroups || {},
      sourceRules: config.sourceRules || {},
      tagRules: config.tagRules || {},
      backgroundColorAllowTags: config.backgroundColorAllowTags || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.get("/api/shovel/test-github", async (_req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(503).json({ ok: false, error: "GITHUB_TOKEN missing in .env" });
  }
  try {
    const [owner, name] = SHOVEL_REPO.split("/");
    const response = await fetch("https://api.github.com/repos/" + owner + "/" + name, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + GITHUB_TOKEN,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: data.message || "GitHub API " + response.status,
        status: response.status,
      });
    }
    res.json({
      ok: true,
      repo: data.full_name,
      defaultBranch: data.default_branch,
      canPush: Boolean(data.permissions?.push),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

app.post("/api/shovel/pr", async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(503).json({ error: "GITHUB_TOKEN is not configured on the server." });
  }

  const body = req.body || {};
  const edits = Array.isArray(body.edits)
    ? body.edits
    : body.source && Array.isArray(body.changes) && body.changes.length > 0
      ? [{ source: body.source, changes: body.changes, originals: body.originals }]
      : [];

  if (edits.length === 0) {
    return res.status(400).json({ error: "edits[] or source + changes[] are required." });
  }

  try {
    const github = createGitHubClient(GITHUB_TOKEN, SHOVEL_REPO, SHOVEL_BASE_BRANCH);
    const fileGroups = new Map();
    const prBodyParts = ["## Shovel visual edit", ""];

    for (const edit of edits) {
      if (!edit.source || !Array.isArray(edit.changes) || edit.changes.length === 0) {
        throw new Error("Each edit needs source and changes[].");
      }
      const location = parseSource(edit.source);
      if (!fileGroups.has(location.file)) fileGroups.set(location.file, []);
      fileGroups.get(location.file).push({
        selector: location.selector,
        source: edit.source,
        changes: edit.changes,
        originals: edit.originals || {},
      });
    }

    const filesToCommit = [];
    for (const [file, fileEdits] of fileGroups) {
      for (const edit of fileEdits) {
        prBodyParts.push("### `" + edit.source + "`");
        prBodyParts.push("");
        for (const c of edit.changes) {
          const from = edit.originals[c.property] ?? "";
          prBodyParts.push("- `" + c.property + "`: `" + from + "` → `" + c.value + "`");
        }
        prBodyParts.push("");
      }

      if (file === "styles.css") {
        const scssBuilt = await buildPrStyleFiles(github, fileEdits);
        if (scssBuilt) {
          scssBuilt.forEach(function (f) { filesToCommit.push(f); });
          continue;
        }
      }

      let cssText = await github.fetchFile(file);
      for (const edit of fileEdits) {
        cssText = applyCssChanges(cssText, edit.selector, edit.changes);
      }
      filesToCommit.push({ filePath: file, content: finalizeCssForDeploy(cssText) });
    }

    await appendMissingPipelineFiles(github, filesToCommit);

    prBodyParts.push("_Created by Shovel_");

    const firstSelector = parseSource(edits[0].source).selector;
    const title =
      edits.length === 1
        ? "Shovel: visual edit " + firstSelector
        : "Shovel: visual edit (" + edits.length + " elements)";

    const pr = await github.createPullRequestMulti({
      files: filesToCommit,
      title,
      body: prBodyParts.join("\n"),
    });

    res.json({
      number: pr.number,
      url: pr.html_url,
      repo: SHOVEL_REPO,
      editCount: edits.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.get("/api/shovel/pr/:number", async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(503).json({ error: "GITHUB_TOKEN is not configured on the server." });
  }

  const number = Number(req.params.number);
  if (!Number.isFinite(number) || number <= 0) {
    return res.status(400).json({ error: "Invalid pull request number." });
  }

  try {
    const github = createGitHubClient(GITHUB_TOKEN, SHOVEL_REPO, SHOVEL_BASE_BRANCH);
    const pr = await github.fetchPullRequest(number);
    res.json({
      number: pr.number,
      state: pr.state,
      merged: Boolean(pr.merged_at),
      mergedAt: pr.merged_at,
      url: pr.html_url,
      baseBranch: SHOVEL_BASE_BRANCH,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/shovel/sync-from-main", async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(503).json({ error: "GITHUB_TOKEN is not configured on the server." });
  }

  const files = req.body?.files;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "files[] is required." });
  }

  try {
    const github = createGitHubClient(GITHUB_TOKEN, SHOVEL_REPO, SHOVEL_BASE_BRANCH);
    const synced = [];
    const unchanged = [];

    for (const file of files) {
      if (!isSafeRelativePath(file)) {
        throw new Error("Invalid file path: " + file);
      }
      const safePath = resolveSafePath(file);
      const remoteContent = await github.fetchFile(file);
      let localContent = "";
      try {
        localContent = fs.readFileSync(safePath, "utf8");
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
      if (localContent === remoteContent) {
        unchanged.push(file);
      } else {
        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, remoteContent, "utf8");
        synced.push(file);
      }
    }

    if (rebuildStylesFromScss()) {
      synced.push("styles.css (rebuilt from SCSS)");
    }

    res.json({
      branch: SHOVEL_BASE_BRANCH,
      repo: SHOVEL_REPO,
      synced,
      unchanged,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.get(["/", "/index.html"], (_req, res, next) => {
  fs.readFile(path.join(__dirname, "index.html"), "utf8", (err, html) => {
    if (err) return next(err);
    res.type("html").send(html);
  });
});

if (LIVE_RELOAD) {
  let reloadEpoch = String(Date.now());
  let reloadTimer = null;
  const watchedPaths = [];

  app.use((req, res, next) => {
    if (/\.(css|js|html|png|svg|ico)$/.test(req.path)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    }
    next();
  });

  app.get("/__shovel-reload-check", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.type("text").send(reloadEpoch);
  });

  function notifyReload(filePath) {
    const ext = path.extname(filePath);
    if (![".html", ".css", ".js", ".png", ".svg"].includes(ext)) return;
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      reloadEpoch = String(Date.now());
      console.log("[live reload]", path.basename(filePath));
    }, 150);
  }

  for (const file of ["index.html", "shovel.css", "shovel.js", "shovel.png", "styles.css"]) {
    const full = path.join(__dirname, file);
    if (!fs.existsSync(full)) continue;
    fs.watchFile(full, { interval: 400 }, () => notifyReload(full));
    watchedPaths.push(full);
  }

  stopLiveReload = () => {
    for (const full of watchedPaths) fs.unwatchFile(full);
  };
}

app.use(express.static(__dirname, { index: false }));

const server = app.listen(PORT, () => {
  console.log("");
  console.log("  Shovel staging server");
  console.log("  → http://localhost:" + PORT);
  if (LIVE_RELOAD) console.log("  Live reload on — save a file to refresh the browser");
  console.log("  Do NOT use Live Server or npx serve for PRs.");
  console.log("");
  if (!GITHUB_TOKEN) {
    console.warn("Warning: GITHUB_TOKEN not set — PR submission will fail until .env is configured.");
  } else {
    console.log("GitHub target: " + SHOVEL_REPO + " (" + SHOVEL_BASE_BRANCH + ")");
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("");
    console.error("  Port " + PORT + " is already in use.");
    console.error("  Run: kill $(lsof -t -i:" + PORT + ")");
    console.error("  Then: npm start");
    console.error("");
  } else {
    console.error(err);
  }
  process.exit(1);
});

function shutdown() {
  stopLiveReload();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
