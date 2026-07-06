import fs from "fs";
import path from "path";

export function loadShovelConfig(rootDir) {
  const configPath = path.join(rootDir, "shovel.config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

export function loadTokensFromFile(rootDir, tokensFile) {
  const filePath = path.join(rootDir, tokensFile || "styles/_tokens.scss");
  const text = fs.readFileSync(filePath, "utf8");
  const tokens = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = re.exec(text))) {
    tokens["--" + match[1]] = match[2].trim();
  }
  return tokens;
}

/** Emit a :root { ... } block from the token catalog. */
export function buildRootTokensCss(catalog) {
  if (!catalog || Object.keys(catalog).length === 0) return "";
  const lines = Object.keys(catalog).map(function (name) {
    return "  " + name + ": " + catalog[name] + ";";
  });
  return ":root {\n" + lines.join("\n") + "\n}\n\n";
}

/** Ensure deployed CSS defines tokens when rules use var(--*). */
export function ensureRootTokensInCss(cssText, rootDir) {
  if (!cssText || /:root\s*\{/.test(cssText)) return cssText;
  if (!/var\(\s*--/.test(cssText)) return cssText;
  try {
    const catalog = loadTokensFromFile(rootDir);
    const block = buildRootTokensCss(catalog);
    if (!block) return cssText;
    return block + cssText;
  } catch (_err) {
    return cssText;
  }
}

export function getTokensForProperty(property, config, catalog) {
  const groups = config.propertyTokenGroups || {};
  const names = groups[property] || [];
  return names
    .filter((name) => catalog[name] !== undefined)
    .map((name) => ({ name, value: catalog[name] }));
}

export function resolveComputedToToken(rawValue, property, config, catalog) {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (trimmed.startsWith("var(")) {
    const inner = trimmed.match(/var\(\s*(--[^,)]+)/);
    if (inner && catalog[inner[1]]) return inner[1];
  }
  const candidates = getTokensForProperty(property, config, catalog);
  const normalized = normalizeColor(trimmed, catalog);
  if (!normalized) return null;
  for (const token of candidates) {
    const resolved = resolveTokenValue(token.name, catalog);
    if (resolved && normalizeColor(resolved, catalog) === normalized) {
      return token.name;
    }
  }
  return null;
}

export function resolveTokenValue(tokenName, catalog, depth = 0) {
  if (depth > 8) return null;
  const raw = catalog[tokenName];
  if (!raw) return null;
  const varMatch = raw.match(/var\(\s*(--[^,)]+)/);
  if (varMatch) return resolveTokenValue(varMatch[1], catalog, depth + 1);
  return raw;
}

function normalizeColor(value, catalog) {
  const resolved = value.startsWith("var(")
    ? resolveTokenValue(value.match(/var\(\s*(--[^,)]+)/)?.[1], catalog)
    : value;
  if (!resolved) return null;
  const hex = cssColorToHex(resolved);
  return hex ? hex.toLowerCase() : null;
}

function cssColorToHex(value) {
  if (!value) return null;
  const v = value.trim();
  if (v.startsWith("#")) {
    if (v.length === 4) {
      return ("#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
    }
    return v.slice(0, 7).toLowerCase();
  }
  const rgb = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgb) {
    const hex = (n) => Math.round(Number(n)).toString(16).padStart(2, "0");
    return ("#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])).toLowerCase();
  }
  return null;
}

export function getHiddenProperties(source, tag, config) {
  const hidden = new Set();
  const sourceRules = config.sourceRules || {};
  const tagRules = config.tagRules || {};
  const bgAllow = config.backgroundColorAllowTags;

  if (Array.isArray(bgAllow) && tag && !bgAllow.includes(tag)) {
    hidden.add("background-color");
  }

  if (source) {
    const parsed = source.includes(":") ? source.slice(source.indexOf(":") + 1) : source;
    const rule = sourceRules[parsed] || sourceRules[source];
    if (rule?.hideProperties) {
      rule.hideProperties.forEach((p) => hidden.add(p));
    }
  }
  if (tag && tagRules[tag]?.hideProperties) {
    tagRules[tag].hideProperties.forEach((p) => hidden.add(p));
  }
  return hidden;
}
