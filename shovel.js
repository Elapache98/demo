/**
 * Shovel — visual editor + GitHub PR flow
 * Single-file vanilla JS. Boots automatically on page load.
 */
(function Shovel() {
  "use strict";

  const DISPLAY_OPTIONS = [
    "block",
    "inline",
    "inline-block",
    "flex",
    "inline-flex",
    "grid",
    "inline-grid",
    "none",
    "contents",
    "flow-root",
    "list-item",
    "table",
    "table-row",
    "table-cell",
  ];

  const DISPLAY_HINTS = {
    block: "Stacks as a full-width box",
    inline: "Sits in a line with text",
    "inline-block": "Inline, but with box sizing",
    flex: "Flexible row or column",
    "inline-flex": "Compact flexible layout",
    grid: "Even rows and columns",
    "inline-grid": "Compact grid layout",
    none: "Hides the element",
    contents: "Container ignores itself",
    "flow-root": "Contains floated children",
    "list-item": "Shows like a list bullet",
    table: "Table with rows and cells",
    "table-row": "Acts as a table row",
    "table-cell": "Acts as a table cell",
  };

  function formatDisplayLabel(value) {
    return value
      .split("-")
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function displayItemFromValue(value) {
    return {
      value: value,
      label: formatDisplayLabel(value),
      hint: DISPLAY_HINTS[value] || "",
    };
  }

  function renderDisplayVisual(value) {
    var box = 'fill="currentColor" rx="1"';
    var stroke = 'stroke="currentColor" stroke-width="1.25" fill="none"';
    switch (value) {
      case "block":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="4" y="3" width="24" height="5" ' + box + ' opacity="0.9"/><rect x="4" y="10" width="24" height="5" ' + box + ' opacity="0.55"/><rect x="4" y="17" width="24" height="4" ' + box + ' opacity="0.3"/></svg>';
      case "inline":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><line x1="3" y1="14" x2="29" y2="14" stroke="currentColor" stroke-width="1" opacity="0.2"/><rect x="4" y="9" width="5" height="5" ' + box + ' opacity="0.85"/><rect x="11" y="9" width="5" height="5" ' + box + ' opacity="0.55"/><rect x="18" y="9" width="5" height="5" ' + box + ' opacity="0.35"/><rect x="25" y="9" width="3" height="5" ' + box + ' opacity="0.2"/></svg>';
      case "inline-block":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="4" y="7" width="7" height="10" ' + box + ' opacity="0.85"/><rect x="13" y="7" width="7" height="10" ' + box + ' opacity="0.55"/><rect x="22" y="7" width="6" height="10" ' + box + ' opacity="0.35"/></svg>';
      case "flex":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="3" y="5" width="26" height="14" ' + stroke + ' opacity="0.25"/><rect x="5" y="7" width="6" height="10" ' + box + ' opacity="0.85"/><rect x="13" y="7" width="6" height="10" ' + box + ' opacity="0.55"/><rect x="21" y="7" width="6" height="10" ' + box + ' opacity="0.35"/></svg>';
      case "inline-flex":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="6" y="7" width="20" height="10" ' + stroke + ' opacity="0.25"/><rect x="8" y="9" width="4" height="6" ' + box + ' opacity="0.85"/><rect x="14" y="9" width="4" height="6" ' + box + ' opacity="0.55"/><rect x="20" y="9" width="4" height="6" ' + box + ' opacity="0.35"/></svg>';
      case "grid":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="4" y="4" width="10" height="7" ' + box + ' opacity="0.85"/><rect x="16" y="4" width="12" height="7" ' + box + ' opacity="0.55"/><rect x="4" y="13" width="10" height="7" ' + box + ' opacity="0.55"/><rect x="16" y="13" width="12" height="7" ' + box + ' opacity="0.35"/></svg>';
      case "inline-grid":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="7" y="5" width="18" height="14" ' + stroke + ' opacity="0.25"/><rect x="9" y="7" width="6" height="4" ' + box + ' opacity="0.85"/><rect x="17" y="7" width="6" height="4" ' + box + ' opacity="0.55"/><rect x="9" y="13" width="6" height="4" ' + box + ' opacity="0.55"/><rect x="17" y="13" width="6" height="4" ' + box + ' opacity="0.35"/></svg>';
      case "none":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="6" y="5" width="20" height="14" ' + stroke + ' opacity="0.35" stroke-dasharray="3 2"/><line x1="9" y1="8" x2="23" y2="16" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><line x1="23" y1="8" x2="9" y2="16" stroke="currentColor" stroke-width="1.5" opacity="0.7"/></svg>';
      case "contents":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="5" y="4" width="22" height="16" ' + stroke + ' opacity="0.3" stroke-dasharray="3 2"/><rect x="8" y="8" width="7" height="8" ' + box + ' opacity="0.85"/><rect x="17" y="8" width="7" height="8" ' + box + ' opacity="0.55"/></svg>';
      case "flow-root":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="4" y="4" width="24" height="16" ' + stroke + ' opacity="0.25"/><rect x="6" y="6" width="8" height="5" ' + box + ' opacity="0.55"/><rect x="6" y="13" width="20" height="5" ' + box + ' opacity="0.85"/></svg>';
      case "list-item":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><circle cx="7" cy="8" r="1.5" fill="currentColor" opacity="0.85"/><rect x="11" y="6" width="17" height="4" ' + box + ' opacity="0.55"/><circle cx="7" cy="16" r="1.5" fill="currentColor" opacity="0.55"/><rect x="11" y="14" width="14" height="4" ' + box + ' opacity="0.35"/></svg>';
      case "table":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="4" y="4" width="24" height="16" ' + stroke + ' opacity="0.35"/><line x1="4" y1="10" x2="28" y2="10" stroke="currentColor" opacity="0.35"/><line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" opacity="0.35"/><line x1="14" y1="4" x2="14" y2="20" stroke="currentColor" opacity="0.35"/><rect x="5" y="5" width="8" height="4" ' + box + ' opacity="0.7"/><rect x="15" y="5" width="12" height="4" ' + box + ' opacity="0.45"/></svg>';
      case "table-row":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="3" y="8" width="26" height="8" ' + stroke + ' opacity="0.35"/><rect x="5" y="10" width="7" height="4" ' + box + ' opacity="0.85"/><rect x="13" y="10" width="7" height="4" ' + box + ' opacity="0.55"/><rect x="21" y="10" width="6" height="4" ' + box + ' opacity="0.35"/></svg>';
      case "table-cell":
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="8" y="6" width="16" height="12" ' + stroke + ' opacity="0.45"/><rect x="10" y="9" width="12" height="6" ' + box + ' opacity="0.65"/></svg>';
      default:
        return '<svg viewBox="0 0 32 24" width="32" height="24" aria-hidden="true"><rect x="6" y="8" width="20" height="8" ' + box + ' opacity="0.4"/></svg>';
    }
  }

  function renderLayoutChipHtml(item, showHint) {
    var hintHtml = showHint && item.hint
      ? '<span class="shovel-layout-chip__hint">' + escapeHtml(item.hint) + "</span>"
      : "";
    return (
      '<span class="shovel-layout-chip">' +
      '<span class="shovel-layout-visual">' + renderDisplayVisual(item.value) + "</span>" +
      '<span class="shovel-layout-chip__text">' +
      '<span class="shovel-layout-chip__name">' + escapeHtml(item.label) + "</span>" +
      hintHtml +
      "</span></span>"
    );
  }

  function setLayoutDropdownValue(dropdown, item) {
    if (!dropdown) return;
    dropdown.dataset.value = item.value;
    var labelEl = dropdown.querySelector(".shovel-dropdown__label");
    if (labelEl) labelEl.innerHTML = renderLayoutChipHtml(item, false);
    dropdown.querySelectorAll(".shovel-dropdown__option").forEach(function (opt) {
      var selected = opt.dataset.value === item.value;
      opt.classList.toggle("shovel-dropdown__option--selected", selected);
      opt.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function buildLayoutDropdown(config) {
    var prop = config.prop;
    var value = config.value != null ? config.value : "";
    var items = config.items || [];
    var ariaLabel = config.ariaLabel || "";
    var selected = items.find(function (item) {
      return item.value === value;
    }) || items[0] || displayItemFromValue(value);
    var optionsHtml = items
      .map(function (item) {
        var isSelected = item.value === value;
        return (
          '<button type="button" class="shovel-dropdown__option shovel-layout-option' +
          (isSelected ? " shovel-dropdown__option--selected" : "") +
          '" data-value="' + escapeHtml(item.value) + '" data-label="' + escapeHtml(item.label) +
          '" role="option" aria-selected="' + (isSelected ? "true" : "false") + '">' +
          renderLayoutChipHtml(item, true) + "</button>"
        );
      })
      .join("");

    return (
      '<div class="shovel-dropdown shovel-dropdown--layout" data-prop="' + escapeHtml(prop) +
      '" data-dropdown data-value="' + escapeHtml(value) + '"' +
      (ariaLabel ? ' aria-label="' + escapeHtml(ariaLabel) + '"' : "") + ">" +
      '<button type="button" class="shovel-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="shovel-dropdown__label">' + renderLayoutChipHtml(selected, false) + "</span>" +
      '<svg class="shovel-dropdown__chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>" +
      '<div class="shovel-dropdown__menu shovel-dropdown__menu--layout" role="listbox" hidden>' + optionsHtml + "</div></div>"
    );
  }

  function bindLayoutDropdown(dropdown, onChange) {
    if (!dropdown) return;
    var trigger = dropdown.querySelector(".shovel-dropdown__trigger");
    var menu = dropdown.querySelector(".shovel-dropdown__menu");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      if (dropdown.classList.contains("shovel-dropdown--open")) closeDropdown(dropdown);
      else openDropdown(dropdown);
    });

    menu.querySelectorAll(".shovel-dropdown__option").forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.stopPropagation();
        var item = displayItemFromValue(option.dataset.value || "");
        item.label = option.dataset.label || item.label;
        setLayoutDropdownValue(dropdown, item);
        closeDropdown(dropdown);
        if (onChange) onChange(item);
      });
    });
  }

  const PROPERTY_GROUPS = [
    {
      title: "Color",
      columns: 2,
      items: [
        { prop: "color", label: "Text", type: "color" },
        { prop: "background-color", label: "Background", type: "color" },
      ],
    },
    {
      title: "Spacing",
      type: "spacing-row",
      controls: [
        { label: "Padding", prefix: "padding" },
        { label: "Margin", prefix: "margin" },
      ],
    },
    {
      title: "Typography",
      columns: 2,
      items: [
        { prop: "font-size", label: "Size", type: "text" },
        { prop: "font-weight", label: "Weight", type: "text" },
      ],
    },
    {
      title: "Size",
      columns: 2,
      items: [
        { prop: "width", label: "Width", type: "text" },
        { prop: "height", label: "Height", type: "text" },
      ],
    },
    {
      title: "Layout",
      columns: 2,
      items: [
        { prop: "display", label: "Display", type: "select", options: DISPLAY_OPTIONS },
        { prop: "gap", label: "Gap", type: "text" },
        { prop: "border-radius", label: "Radius", type: "text" },
      ],
    },
  ];

  const EDITABLE_PROPERTIES = PROPERTY_GROUPS.flatMap(function (group) {
    if (group.type === "spacing-row") {
      return (group.controls || []).flatMap(function (control) {
        return ["top", "right", "bottom", "left"].map(function (side) {
          return { prop: control.prefix + "-" + side, label: side, type: "text" };
        });
      });
    }
    return group.items || [];
  });

  // --- Source parsing (format: "styles.css:.selector") ---

  function parseSource(sourceAttr) {
    const splitAt = sourceAttr.indexOf(":");
    if (splitAt === -1) {
      throw new Error("Invalid data-shovel-source: " + sourceAttr);
    }
    return {
      file: sourceAttr.slice(0, splitAt),
      selector: sourceAttr.slice(splitAt + 1),
    };
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  /** Color inputs require #rrggbb; computed styles return rgb(...). */
  function cssColorToHex(value) {
    if (!value) return "#000000";
    var v = value.trim();
    if (v.startsWith("#")) {
      if (v.length === 4) {
        return "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      }
      return v.length >= 7 ? v.slice(0, 7) : "#000000";
    }
    var rgb = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (rgb) {
      function hex(n) {
        return Math.round(Number(n)).toString(16).padStart(2, "0");
      }
      return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }
    var probe = document.createElement("span");
    probe.style.color = v;
    document.body.appendChild(probe);
    var resolved = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return cssColorToHex(resolved);
  }

  function formatInputValue(item, raw) {
    if (item.type === "color") return cssColorToHex(raw);
    return raw;
  }

  function resolveTokenValue(tokenName, catalog, depth) {
    depth = depth || 0;
    if (depth > 8 || !tokenName || !catalog) return null;
    var raw = catalog[tokenName];
    if (!raw) return null;
    var varMatch = raw.match(/var\(\s*(--[^,)]+)/);
    if (varMatch) return resolveTokenValue(varMatch[1], catalog, depth + 1);
    return raw;
  }

  function normalizeColorForMatch(value, catalog) {
    if (!value) return null;
    var resolved = value.trim();
    if (resolved.startsWith("var(")) {
      var inner = resolved.match(/var\(\s*(--[^,)]+)/);
      resolved = inner ? resolveTokenValue(inner[1], catalog) : null;
    }
    if (!resolved) return null;
    return cssColorToHex(resolved).toLowerCase();
  }

  function resolveComputedToToken(rawValue, property, shovelMeta) {
    if (!rawValue || !shovelMeta) return null;
    var trimmed = rawValue.trim();
    if (trimmed.startsWith("var(")) {
      var inner = trimmed.match(/var\(\s*(--[^,)]+)/);
      if (inner && shovelMeta.tokens && shovelMeta.tokens[inner[1]]) return inner[1];
    }
    var catalog = shovelMeta.tokens || {};
    var groups = shovelMeta.propertyTokenGroups || {};
    var names = groups[property] || [];
    var normalized = normalizeColorForMatch(trimmed, catalog);
    if (!normalized) return null;
    for (var i = 0; i < names.length; i++) {
      var tokenName = names[i];
      if (catalog[tokenName] === undefined) continue;
      var resolved = resolveTokenValue(tokenName, catalog);
      if (resolved && normalizeColorForMatch(resolved, catalog) === normalized) {
        return tokenName;
      }
    }
    return null;
  }

  function resolveComputedToSpacingToken(rawValue, property, shovelMeta) {
    if (!rawValue || !shovelMeta) return null;
    var trimmed = rawValue.trim();
    if (trimmed.startsWith("var(")) {
      var inner = trimmed.match(/var\(\s*(--[^,)]+)/);
      if (inner && shovelMeta.tokens && shovelMeta.tokens[inner[1]]) return inner[1];
    }
    var catalog = shovelMeta.tokens || {};
    var groups = shovelMeta.propertyTokenGroups || {};
    var names = groups[property] || [];
    for (var i = 0; i < names.length; i++) {
      var tokenName = names[i];
      var resolved = resolveTokenValue(tokenName, catalog);
      if (resolved && resolved.trim() === trimmed) return tokenName;
    }
    return null;
  }

  function getTokenOptionsForProperty(prop, shovelMeta) {
    if (!shovelMeta) return [];
    var groups = shovelMeta.propertyTokenGroups || {};
    var catalog = shovelMeta.tokens || {};
    var names = groups[prop] || [];
    return names
      .filter(function (name) {
        return catalog[name] !== undefined;
      })
      .map(function (name) {
        return { name: name, value: catalog[name] };
      });
  }

  function getHiddenProperties(source, tag, shovelMeta) {
    var hidden = new Set();
    if (!shovelMeta) return hidden;
    var sourceRules = shovelMeta.sourceRules || {};
    var tagRules = shovelMeta.tagRules || {};
    var bgAllow = shovelMeta.backgroundColorAllowTags;
    if (Array.isArray(bgAllow) && tag && bgAllow.indexOf(tag) === -1) {
      hidden.add("background-color");
    }
    if (source) {
      var parsed = source.includes(":") ? source.slice(source.indexOf(":") + 1) : source;
      var rule = sourceRules[parsed] || sourceRules[source];
      if (rule && rule.hideProperties) {
        rule.hideProperties.forEach(function (p) {
          hidden.add(p);
        });
      }
    }
    if (tag && tagRules[tag] && tagRules[tag].hideProperties) {
      tagRules[tag].hideProperties.forEach(function (p) {
        hidden.add(p);
      });
    }
    return hidden;
  }

  function tokenVar(name) {
    return "var(" + name + ")";
  }

  /** Resolve var(--token) chains to a literal value for live preview. */
  function previewCSSValue(value, catalog) {
    if (value == null || value === "") return value;
    var trimmed = String(value).trim();
    var varMatch = trimmed.match(/^var\(\s*(--[^,)]+)/);
    if (varMatch && catalog) {
      var resolved = resolveTokenValue(varMatch[1], catalog);
      if (resolved) return previewCSSValue(resolved, catalog);
    }
    return trimmed;
  }

  function applyPreviewStyle(el, prop, value, catalog) {
    if (!el || !prop) return;
    var previewValue = previewCSSValue(value, catalog);
    if (previewValue == null || previewValue === "") {
      clearPreviewStyle(el, prop);
      return;
    }
    if (prop === "background-color") {
      el.style.setProperty("background-color", previewValue, "important");
      el.style.setProperty("background", previewValue, "important");
      return;
    }
    el.style.setProperty(prop, previewValue, "important");
  }

  function clearPreviewStyle(el, prop) {
    if (!el || !prop) return;
    el.style.removeProperty(prop);
    if (prop === "background-color") {
      el.style.removeProperty("background");
    }
  }

  function injectShovelTokenVariables(catalog) {
    if (!catalog || Object.keys(catalog).length === 0) return;
    var existing = document.getElementById("shovel-preview-tokens");
    if (existing) existing.remove();
    var lines = Object.keys(catalog).map(function (name) {
      return "  " + name + ": " + catalog[name] + ";";
    });
    var style = document.createElement("style");
    style.id = "shovel-preview-tokens";
    style.textContent = ":root {\n" + lines.join("\n") + "\n}";
    document.head.appendChild(style);
  }

  function formatTokenLabel(name) {
    var raw = name.replace(/^--/, "");
    var parts = raw.split("-");
    var strip = ["color", "font", "space", "layout", "radius", "card", "text"];
    while (parts.length > 1 && strip.indexOf(parts[0]) >= 0) {
      parts.shift();
    }
    if (parts[0] === "size") parts.shift();
    if (parts[0] === "weight") {
      return parts[1] === "heading" ? "Heading" : parts.slice(1).join(" ");
    }
    return parts
      .map(function (part) {
        if (/^h\d$/i.test(part)) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function formatTokenOptionLabel(tok, catalog) {
    var resolved = resolveTokenValue(tok.name, catalog);
    var shortName = formatTokenLabel(tok.name);
    if (!resolved) return shortName;
    if (/^#/.test(resolved)) {
      return shortName + " · " + resolved.toUpperCase();
    }
    if (/^(rgba?|[\d.]+(px|rem|em|%))/.test(resolved.trim())) {
      return resolved.trim();
    }
    return shortName;
  }

  function isValidHexColor(value) {
    return /^#[0-9a-fA-F]{3}$/.test(value) || /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function normalizeHexTyping(value) {
    var v = (value || "").trim();
    if (!v) return "#";
    if (!v.startsWith("#")) v = "#" + v.replace(/^#+/, "");
    return v.slice(0, 7);
  }

  function makeColorItem(value, name, hex) {
    var color = hex ? cssColorToHex(hex) : "";
    return {
      value: value || "",
      name: name || "Custom",
      hex: color ? color.toUpperCase() : "",
      color: color || "",
    };
  }

  function colorItemFromToken(tokenName, catalog) {
    var resolved = resolveTokenValue(tokenName, catalog);
    var hex = cssColorToHex(resolved || "");
    return makeColorItem(tokenName, formatTokenLabel(tokenName), hex);
  }

  function renderColorChipHtml(item) {
    return (
      '<span class="shovel-color-chip">' +
      '<span class="shovel-color-dot" style="background:' + escapeHtml(item.color) + '"></span>' +
      '<span class="shovel-color-chip__text">' +
      '<span class="shovel-color-chip__name">' + escapeHtml(item.name) + "</span>" +
      '<span class="shovel-color-chip__hex">' + escapeHtml(item.hex) + "</span>" +
      "</span></span>"
    );
  }

  function renderColorTriggerHtml(item) {
    if (!item.value) {
      return '<span class="shovel-color-chip shovel-color-chip--plain"><span class="shovel-color-chip__name">Custom</span></span>';
    }
    return renderColorChipHtml(item);
  }

  function setColorDropdownValue(dropdown, item) {
    if (!dropdown) return;
    dropdown.dataset.value = item.value;
    var labelEl = dropdown.querySelector(".shovel-dropdown__label");
    if (labelEl) labelEl.innerHTML = renderColorTriggerHtml(item);
    dropdown.querySelectorAll(".shovel-dropdown__option").forEach(function (opt) {
      var selected = opt.dataset.value === item.value;
      opt.classList.toggle("shovel-dropdown__option--selected", selected);
      opt.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function buildColorDropdown(config) {
    var prop = config.prop;
    var value = config.value != null ? config.value : "";
    var items = config.items || [];
    var ariaLabel = config.ariaLabel || "";
    var selected = items.find(function (item) {
      return item.value === value;
    }) || items[0];
    var optionsHtml = items
      .map(function (item) {
        var isSelected = item.value === value;
        var optionBody = item.value === ""
          ? '<span class="shovel-color-chip__name">Custom</span>'
          : renderColorChipHtml(item);
        return (
          '<button type="button" class="shovel-dropdown__option shovel-color-option' +
          (item.value === "" ? " shovel-color-option--custom" : "") +
          (isSelected ? " shovel-dropdown__option--selected" : "") +
          '" data-value="' + escapeHtml(item.value) + '" data-name="' + escapeHtml(item.name) +
          '" data-hex="' + escapeHtml(item.hex) + '" data-color="' + escapeHtml(item.color) +
          '" role="option" aria-selected="' + (isSelected ? "true" : "false") + '">' +
          optionBody + "</button>"
        );
      })
      .join("");

    return (
      '<div class="shovel-dropdown shovel-dropdown--color" data-prop="' + escapeHtml(prop) +
      '" data-dropdown data-value="' + escapeHtml(value) + '"' +
      (ariaLabel ? ' aria-label="' + escapeHtml(ariaLabel) + '"' : "") + ">" +
      '<button type="button" class="shovel-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="shovel-dropdown__label">' + renderColorTriggerHtml(selected) + "</span>" +
      '<svg class="shovel-dropdown__chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>" +
      '<div class="shovel-dropdown__menu shovel-dropdown__menu--color" role="listbox" hidden>' + optionsHtml + "</div></div>"
    );
  }

  function bindColorDropdown(dropdown, handlers) {
    if (!dropdown) return;
    var trigger = dropdown.querySelector(".shovel-dropdown__trigger");
    var menu = dropdown.querySelector(".shovel-dropdown__menu");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      if (dropdown.classList.contains("shovel-dropdown--open")) closeDropdown(dropdown);
      else openDropdown(dropdown);
    });

    menu.querySelectorAll(".shovel-dropdown__option").forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.stopPropagation();
        var item = {
          value: option.dataset.value || "",
          name: option.dataset.name || "Custom",
          hex: option.dataset.hex || "",
          color: option.dataset.color || "",
        };
        setColorDropdownValue(dropdown, item);
        closeDropdown(dropdown);
        if (handlers && handlers.onSelect) handlers.onSelect(item);
      });
    });
  }

  function customOptionLabel(value, fallback) {
    var trimmed = (value || "").trim();
    if (trimmed) return trimmed;
    return fallback || "Custom";
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove("shovel-dropdown--open");
    var trigger = dropdown.querySelector(".shovel-dropdown__trigger");
    var menu = dropdown.querySelector(".shovel-dropdown__menu");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (menu) {
      menu.hidden = true;
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.width = "";
      menu.style.right = "";
      menu.style.zIndex = "";
    }
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll("[data-shovel-root] [data-dropdown].shovel-dropdown--open").forEach(function (dd) {
      if (dd !== except) closeDropdown(dd);
    });
  }

  function openDropdown(dropdown) {
    if (!dropdown) return;
    closeAllDropdowns(dropdown);
    dropdown.classList.add("shovel-dropdown--open");
    var trigger = dropdown.querySelector(".shovel-dropdown__trigger");
    var menu = dropdown.querySelector(".shovel-dropdown__menu");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (menu) {
      menu.hidden = false;
      var rect = trigger.getBoundingClientRect();
      menu.style.position = "fixed";
      menu.style.top = rect.bottom + 4 + "px";
      menu.style.left = rect.left + "px";
      var menuWidth = rect.width;
      if (menu.classList.contains("shovel-dropdown__menu--layout")) {
        menuWidth = Math.max(menuWidth, 260);
      } else if (menu.classList.contains("shovel-dropdown__menu--color")) {
        menuWidth = Math.max(menuWidth, 220);
      }
      menu.style.width = menuWidth + "px";
      menu.style.right = "auto";
      menu.style.zIndex = "10001";
    }
  }

  function setDropdownValue(dropdown, value, label) {
    if (!dropdown) return;
    dropdown.dataset.value = value;
    var labelEl = dropdown.querySelector(".shovel-dropdown__label");
    if (labelEl) labelEl.textContent = label || value || "Custom";
    dropdown.querySelectorAll(".shovel-dropdown__option").forEach(function (opt) {
      var selected = opt.dataset.value === value;
      opt.classList.toggle("shovel-dropdown__option--selected", selected);
      opt.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function buildCustomDropdown(config) {
    var prop = config.prop;
    var value = config.value != null ? config.value : "";
    var items = config.items || [];
    var ariaLabel = config.ariaLabel || "";
    var extraClass = config.extraClass || "";
    var selected = items.find(function (item) {
      return item.value === value;
    }) || items[0];
    var optionsHtml = items
      .map(function (item) {
        var isSelected = item.value === value;
        return (
          '<button type="button" class="shovel-dropdown__option' +
          (isSelected ? " shovel-dropdown__option--selected" : "") +
          '" data-value="' + escapeHtml(item.value) + '" role="option" aria-selected="' +
          (isSelected ? "true" : "false") + '">' + escapeHtml(item.label) + "</button>"
        );
      })
      .join("");

    return (
      '<div class="shovel-dropdown' + (extraClass ? " " + extraClass : "") + '" data-prop="' + escapeHtml(prop) +
      '" data-dropdown data-value="' + escapeHtml(value) + '"' +
      (ariaLabel ? ' aria-label="' + escapeHtml(ariaLabel) + '"' : "") + ">" +
      '<button type="button" class="shovel-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="shovel-dropdown__label">' + escapeHtml(selected ? selected.label : "") + "</span>" +
      '<svg class="shovel-dropdown__chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>" +
      '<div class="shovel-dropdown__menu" role="listbox" hidden>' + optionsHtml + "</div></div>"
    );
  }

  function bindDropdown(dropdown, onChange) {
    if (!dropdown) return;
    var trigger = dropdown.querySelector(".shovel-dropdown__trigger");
    var menu = dropdown.querySelector(".shovel-dropdown__menu");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      if (dropdown.classList.contains("shovel-dropdown--open")) closeDropdown(dropdown);
      else openDropdown(dropdown);
    });

    menu.querySelectorAll(".shovel-dropdown__option").forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.stopPropagation();
        var val = option.dataset.value;
        var label = option.textContent || "";
        setDropdownValue(dropdown, val, label);
        closeDropdown(dropdown);
        if (onChange) onChange(val, label);
      });
    });
  }

  function storageKeyFor(config) {
    return "shovel:v1:" + (config.repo || "local") + ":" + location.pathname;
  }

  function serializeTrackedChanges(map) {
    return Array.from(map.values()).map(function (entry) {
      var changes = {};
      entry.changes.forEach(function (val, prop) {
        changes[prop] = val;
      });
      return {
        source: entry.source,
        tag: entry.tag,
        changes: changes,
        originals: entry.originals,
      };
    });
  }

  function deserializeTrackedChanges(items) {
    var map = new Map();
    if (!Array.isArray(items)) return map;
    items.forEach(function (item) {
      if (!item || !item.source) return;
      map.set(item.source, {
        source: item.source,
        tag: item.tag || "element",
        changes: new Map(Object.entries(item.changes || {})),
        originals: item.originals || {},
      });
    });
    return map;
  }

  // --- Visual editor overlay ---

  function mountOverlay(config) {
    if (document.querySelector("[data-shovel-root]")) return;

    const shovelMeta = config.shovelMeta || {
      tokens: {},
      propertyTokenGroups: {},
      sourceRules: {},
      tagRules: {},
      backgroundColorAllowTags: ["card", "button", "page"],
    };

    injectShovelTokenVariables(shovelMeta.tokens);

    const host = document.createElement("div");
    host.setAttribute("data-shovel-root", "true");
    host.className = "shovel-root";
    host.innerHTML =
      '<button type="button" class="shovel-fab" aria-label="Open Shovel editor">' +
      '  <img class="shovel-fab-icon" src="shovel.png" alt="" />' +
      "</button>" +
      '<div class="shovel-panel shovel-hidden">' +
      '  <header class="shovel-header"><strong>Shovel</strong><button type="button" class="shovel-close" aria-label="Close">×</button></header>' +
      '  <nav class="shovel-tabs" role="tablist">' +
      '    <button type="button" class="shovel-tab shovel-tab--active" role="tab" data-tab="css" aria-selected="true">CSS</button>' +
      '    <button type="button" class="shovel-tab" role="tab" data-tab="tracked" aria-selected="false">Changes <span class="shovel-tab-badge" hidden>0</span></button>' +
      "  </nav>" +
      '  <div class="shovel-tab-panel shovel-tab-panel--active" data-panel="css" role="tabpanel">' +
      '    <section class="shovel-section shovel-selection-wrap">' +
      '      <details class="shovel-details" hidden>' +
      '        <summary class="shovel-details__summary">' +
      '          <span class="shovel-details__label">' +
      '            <span>Element details</span>' +
      '            <span class="shovel-details__tag"></span>' +
      "          </span>" +
      '          <svg class="shovel-details__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      "          </svg>" +
      "        </summary>" +
      '        <div class="shovel-selection"></div>' +
      "      </details>" +
      "    </section>" +
      '    <section class="shovel-section shovel-props"></section>' +
      '    <footer class="shovel-footer"><button type="button" class="shovel-btn shovel-btn-secondary shovel-reset">Reset preview</button></footer>' +
      "  </div>" +
      '  <div class="shovel-tab-panel" data-panel="tracked" role="tabpanel" hidden>' +
      '    <section class="shovel-section shovel-tracked">' +
      '      <p class="shovel-hint">Review your edits below, then submit as a PR. After merge on GitHub, Shovel syncs <strong>' +
      escapeHtml(config.baseBranch || "main") +
      '</strong> into your local CSS.</p>' +
      '      <div class="shovel-tracked-list"></div>' +
      "    </section>" +
      '    <div class="shovel-status shovel-github-status"></div>' +
      '    <footer class="shovel-footer shovel-tracked-actions">' +
      '      <button type="button" class="shovel-btn shovel-btn-secondary shovel-clear-tracked" disabled>Undo all</button>' +
      '      <div class="shovel-tracked-actions__row">' +
      '        <button type="button" class="shovel-btn shovel-btn-secondary shovel-sync">Sync from main</button>' +
      '        <button type="button" class="shovel-btn shovel-btn-primary shovel-submit" disabled>Submit PR</button>' +
      "      </div>" +
      "    </footer>" +
      "  </div>" +
      "</div>";
    document.body.appendChild(host);

    const fab = host.querySelector(".shovel-fab");
    const panel = host.querySelector(".shovel-panel");
    const closeBtn = host.querySelector(".shovel-close");
    const selectionEl = host.querySelector(".shovel-selection");
    const selectionDetails = host.querySelector(".shovel-details");
    const selectionTagBadge = host.querySelector(".shovel-details__tag");
    const propsEl = host.querySelector(".shovel-props");
    const githubStatusEl = host.querySelector(".shovel-github-status");
    const submitBtn = host.querySelector(".shovel-submit");
    const syncBtn = host.querySelector(".shovel-sync");
    const resetBtn = host.querySelector(".shovel-reset");
    const clearTrackedBtn = host.querySelector(".shovel-clear-tracked");
    const trackedListEl = host.querySelector(".shovel-tracked-list");
    const trackedTabBadge = host.querySelector(".shovel-tab-badge");
    const tabButtons = host.querySelectorAll(".shovel-tab");
    const tabPanels = host.querySelectorAll(".shovel-tab-panel");

    const apiUrl = config.apiUrl || "/api/shovel/pr";
    const storageKey = storageKeyFor(config);

    let selectedElement = null;
    let selectedSource = null;
    let selectedTag = null;
    const originalValues = new Map();
    const pendingChanges = new Map();
    /** @type {Map<string, { source: string, tag: string, changes: Map<string, string>, originals: Record<string, string> }>} */
    const trackedChanges = new Map();
    let picking = false;
    let currentTab = "css";
    let focusedTrackedSource = null;
    let hoveredTrackedSource = null;
    let mergePollTimer = null;
    let pendingPrNumber = null;
    let pendingPrUrl = null;
    let persistTimer = null;

    const highlight = document.createElement("div");
    highlight.className = "shovel-highlight";
    highlight.style.display = "none";
    document.body.appendChild(highlight);

    function setGithubStatus(message, type) {
      githubStatusEl.textContent = message;
      githubStatusEl.dataset.type = type || "info";
    }

    function persistState() {
      clearTimeout(persistTimer);
      persistTimer = setTimeout(function () {
        try {
          var payload = {
            version: 1,
            updatedAt: new Date().toISOString(),
            tracked: serializeTrackedChanges(trackedChanges),
            pendingPr: pendingPrNumber
              ? { number: pendingPrNumber, url: pendingPrUrl || null }
              : null,
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (err) {
          console.warn("[Shovel] Could not save state to localStorage:", err);
        }
      }, 150);
    }

    function clearPersistedState() {
      clearTimeout(persistTimer);
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.warn("[Shovel] Could not clear localStorage:", err);
      }
    }

    function applyTrackedToPage() {
      trackedChanges.forEach(function (entry) {
        var el = findElementBySource(entry.source);
        if (!el) return;
        entry.changes.forEach(function (val, prop) {
          applyPreviewStyle(el, prop, val, shovelMeta.tokens);
        });
      });
    }

    function loadPersistedState() {
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data || data.version !== 1) return;

        var restored = deserializeTrackedChanges(data.tracked);
        restored.forEach(function (entry, source) {
          trackedChanges.set(source, entry);
        });
        applyTrackedToPage();

        if (data.pendingPr && data.pendingPr.number) {
          watchPrForMerge(data.pendingPr.number, data.pendingPr.url);
        }
      } catch (err) {
        console.warn("[Shovel] Could not restore state from localStorage:", err);
      }
    }

    function findElementBySource(source) {
      var stamped = document.querySelectorAll("[data-shovel-source]");
      for (var i = 0; i < stamped.length; i++) {
        if (stamped[i].getAttribute("data-shovel-source") === source) return stamped[i];
      }
      return null;
    }

    function snapshotOriginals() {
      var out = {};
      pendingChanges.forEach(function (_val, prop) {
        out[prop] = originalValues.get(prop) || "";
      });
      return out;
    }

    function flushPendingToTracked() {
      if (!selectedSource || pendingChanges.size === 0) return;
      trackedChanges.set(selectedSource, {
        source: selectedSource,
        tag: selectedElement
          ? selectedElement.getAttribute("data-shovel-tag") || selectedElement.tagName.toLowerCase()
          : "element",
        changes: new Map(pendingChanges),
        originals: snapshotOriginals(),
      });
    }

    function syncCurrentEditToTracked() {
      if (!selectedSource || pendingChanges.size === 0) {
        if (selectedSource) trackedChanges.delete(selectedSource);
      } else {
        flushPendingToTracked();
      }
      renderTrackedList();
      updateSubmitState();
      persistState();
    }

    function updateSubmitState() {
      var n = trackedChanges.size;
      submitBtn.disabled = n === 0;
      if (clearTrackedBtn) clearTrackedBtn.disabled = n === 0;
      if (trackedTabBadge) {
        trackedTabBadge.hidden = n === 0;
        trackedTabBadge.textContent = String(n);
      }
    }

    function renderTrackedList() {
      if (!trackedListEl) return;
      if (trackedChanges.size === 0) {
        trackedListEl.innerHTML = '<p class="shovel-tracked-empty">No changes yet. Edit elements on the CSS tab, then submit a PR from here.</p>';
        return;
      }

      var html = "";
      trackedChanges.forEach(function (entry) {
        var changeLines = Array.from(entry.changes.entries())
          .map(function (pair) {
            var prop = pair[0];
            var val = pair[1];
            var from = entry.originals[prop] || "";
            return (
              '<li><code>' + escapeHtml(prop) + "</code>: " +
              '<span class="shovel-tracked-from">' + escapeHtml(from || "—") + "</span> → " +
              '<span class="shovel-tracked-to">' + escapeHtml(val) + "</span></li>"
            );
          })
          .join("");

        var isActive = entry.source === focusedTrackedSource;
        html +=
          '<article class="shovel-tracked-item' + (isActive ? " shovel-tracked-item--active" : "") + '" data-source="' + escapeHtml(entry.source) + '">' +
          '  <header class="shovel-tracked-item__head">' +
          '    <span class="shovel-tracked-label">&lt;' + escapeHtml(entry.tag) + "&gt;</span>" +
          '    <button type="button" class="shovel-btn shovel-btn-secondary shovel-tracked-undo" data-source="' + escapeHtml(entry.source) + '">Undo</button>' +
          "  </header>" +
          '  <code class="shovel-source shovel-tracked-source">' + escapeHtml(entry.source) + "</code>" +
          '  <ul class="shovel-tracked-changes">' + changeLines + "</ul>" +
          "</article>";
      });
      trackedListEl.innerHTML = html;
    }

    function revertTrackedEntry(entry) {
      var el = findElementBySource(entry.source);
      if (!el) return;
      entry.changes.forEach(function (_val, prop) {
        var original = entry.originals[prop];
        if (original) applyPreviewStyle(el, prop, original, shovelMeta.tokens);
        else clearPreviewStyle(el, prop);
      });
    }

    function undoTracked(source) {
      var entry = trackedChanges.get(source);
      if (entry) revertTrackedEntry(entry);
      trackedChanges.delete(source);
      if (focusedTrackedSource === source) focusedTrackedSource = null;
      if (hoveredTrackedSource === source) hoveredTrackedSource = null;
      if (selectedSource === source) {
        pendingChanges.clear();
        renderPropertyEditors();
      }
      renderTrackedList();
      updateSubmitState();
      syncPageHighlight();
      persistState();
    }

    function clearAllTracked(options) {
      var revert = !options || options.revert !== false;
      if (revert) {
        trackedChanges.forEach(function (entry) {
          revertTrackedEntry(entry);
        });
      }
      trackedChanges.clear();
      pendingChanges.clear();
      focusedTrackedSource = null;
      hoveredTrackedSource = null;
      renderPropertyEditors();
      renderTrackedList();
      updateSubmitState();
      syncPageHighlight();
      if (!options || options.revert !== false) {
        clearPersistedState();
      } else {
        persistState();
      }
    }

    function isPanelOpen() {
      return panel && !panel.classList.contains("shovel-hidden");
    }

    function isSelectionLocked() {
      return Boolean(selectedElement && isPanelOpen());
    }

    function stripPreviewStylesFromPage() {
      document.querySelectorAll("[data-shovel-source]").forEach(function (el) {
        el.removeAttribute("style");
      });
    }

    function refreshStylesheetCache() {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
        try {
          var url = new URL(link.href, location.href);
          if (!url.pathname.endsWith("styles.css")) return;
          url.searchParams.set("shovel", String(Date.now()));
          link.href = url.toString();
        } catch (_err) {
          /* ignore bad href */
        }
      });
    }

    function resetAfterSync() {
      stripPreviewStylesFromPage();
      trackedChanges.clear();
      pendingChanges.clear();
      focusedTrackedSource = null;
      hoveredTrackedSource = null;
      selectedElement = null;
      selectedSource = null;
      selectedTag = null;
      originalValues.clear();
      if (propsEl) propsEl.innerHTML = "";
      if (selectionDetails) {
        selectionDetails.hidden = true;
        selectionDetails.open = false;
      }
      if (selectionEl) selectionEl.innerHTML = "";
      if (selectionTagBadge) selectionTagBadge.textContent = "";
      highlight.style.display = "none";
      renderTrackedList();
      updateSubmitState();
      clearPersistedState();
    }

    function collectShovelFiles() {
      var files = new Set();
      document.querySelectorAll("[data-shovel-source]").forEach(function (el) {
        var src = el.getAttribute("data-shovel-source");
        if (!src) return;
        var colon = src.indexOf(":");
        if (colon > 0) files.add(src.slice(0, colon));
      });
      return Array.from(files);
    }

    function collectEditsForPr() {
      flushPendingToTracked();
      return Array.from(trackedChanges.values()).map(function (entry) {
        return {
          source: entry.source,
          changes: Array.from(entry.changes.entries()).map(function (pair) {
            return { property: pair[0], value: pair[1] };
          }),
          originals: entry.originals,
        };
      });
    }

    function switchTab(tabName) {
      currentTab = tabName;
      tabButtons.forEach(function (btn) {
        const active = btn.dataset.tab === tabName;
        btn.classList.toggle("shovel-tab--active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
      tabPanels.forEach(function (panel) {
        const active = panel.dataset.panel === tabName;
        panel.classList.toggle("shovel-tab-panel--active", active);
        panel.hidden = !active;
      });
      if (tabName === "tracked") {
        renderTrackedList();
      } else {
        focusedTrackedSource = null;
        hoveredTrackedSource = null;
      }
      syncPageHighlight();
    }

    function openPanel() {
      panel.classList.remove("shovel-hidden");
      picking = true;
      if (!selectedElement) {
        selectionDetails.hidden = true;
      }
    }

    function closePanel() {
      panel.classList.add("shovel-hidden");
      picking = false;
      highlight.style.display = "none";
      focusedTrackedSource = null;
      hoveredTrackedSource = null;
      selectionDetails.hidden = true;
      selectionDetails.open = false;
      selectionEl.innerHTML = "";
      if (selectionTagBadge) selectionTagBadge.textContent = "";
    }

    function findStampedElement(target) {
      let node = target;
      while (node && node !== document.body) {
        if (node instanceof HTMLElement && node.hasAttribute("data-shovel-source")) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    }

    function isShovelUiEvent(event) {
      return event.composedPath().some(function (node) {
        return node === host || node === highlight;
      });
    }

    function positionHighlight(el) {
      const rect = el.getBoundingClientRect();
      highlight.style.display = "block";
      highlight.style.top = rect.top + "px";
      highlight.style.left = rect.left + "px";
      highlight.style.width = rect.width + "px";
      highlight.style.height = rect.height + "px";
    }

    function syncPageHighlight() {
      if (currentTab === "tracked") {
        var source = focusedTrackedSource || hoveredTrackedSource;
        if (source) {
          var trackedEl = findElementBySource(source);
          if (trackedEl) {
            positionHighlight(trackedEl);
            return;
          }
        }
        highlight.style.display = "none";
        return;
      }
      if (selectedElement) positionHighlight(selectedElement);
      else highlight.style.display = "none";
    }

    function focusTrackedItem(source) {
      focusedTrackedSource = source;
      renderTrackedList();
      var el = findElementBySource(source);
      if (el) {
        positionHighlight(el);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        highlight.style.display = "none";
      }
    }

    function refreshHighlightPosition() {
      syncPageHighlight();
    }

    function renderPropertyEditors() {
      propsEl.innerHTML = "";
      if (!selectedElement) return;

      const computed = getComputedStyle(selectedElement);
      const fragment = document.createDocumentFragment();

      function getPropValue(item) {
        const raw = pendingChanges.has(item.prop)
          ? pendingChanges.get(item.prop)
          : computed.getPropertyValue(item.prop).trim();
        return formatInputValue(item, raw);
      }

      function getSpacingValue(prop) {
        const raw = pendingChanges.has(prop)
          ? pendingChanges.get(prop)
          : computed.getPropertyValue(prop).trim();
        return raw;
      }

      function applyPropChange(prop, value) {
        if (!prop || !selectedElement) return;
        pendingChanges.set(prop, value);
        applyPreviewStyle(selectedElement, prop, value, shovelMeta.tokens);
        syncCurrentEditToTracked();
      }

      function createSpacingControl(group) {
        const prefix = group.prefix;
        const sides = ["top", "right", "bottom", "left"];
        const wrapper = document.createElement("div");
        wrapper.className = "shovel-spacing shovel-spacing--" + prefix;
        wrapper.dataset.spacingPrefix = prefix;

        sides.forEach(function (side) {
          const prop = prefix + "-" + side;
          const label = document.createElement("label");
          label.className = "shovel-spacing-side shovel-spacing-side--" + side;
          label.innerHTML =
            '<input type="text" data-prop="' + prop + '" data-spacing-role="side" value="' +
            escapeHtml(getSpacingValue(prop)) +
            '" aria-label="' + escapeHtml(group.title + " " + side) + '" spellcheck="false" />';
          wrapper.appendChild(label);
        });

        const core = document.createElement("div");
        core.className = "shovel-spacing-core";
        core.innerHTML =
          '<button type="button" class="shovel-spacing-lock shovel-spacing-lock--locked" aria-label="All sides locked together" title="All sides locked — click to unlock" data-lock-state="locked">' +
          '  <svg class="shovel-spacing-lock__icon shovel-spacing-lock__icon--locked" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '    <rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
          '    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          "  </svg>" +
          '  <svg class="shovel-spacing-lock__icon shovel-spacing-lock__icon--unlocked" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '    <rect x="3.5" y="8" width="9" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
          '    <path d="M4.5 8V5.5a3.5 3.5 0 0 1 7 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          "  </svg>" +
          "</button>";
        wrapper.appendChild(core);
        return wrapper;
      }

      function bindSpacingControl(wrapper) {
        const prefix = wrapper.dataset.spacingPrefix;
        const sides = ["top", "right", "bottom", "left"];
        const lockBtn = wrapper.querySelector(".shovel-spacing-lock");
        let linked = false;

        function getSideInputs() {
          return sides.map(function (side) {
            return wrapper.querySelector('[data-prop="' + prefix + "-" + side + '"]');
          });
        }

        function getSideValues() {
          return getSideInputs().map(function (input) {
            return input ? input.value.trim() : "";
          });
        }

        function allSidesEqual(values) {
          values = values || getSideValues();
          if (values.length === 0) return true;
          return values.every(function (val) {
            return val === values[0];
          });
        }

        function syncLockVisual() {
          if (!lockBtn) return;
          lockBtn.dataset.lockState = linked ? "locked" : "unlocked";
          lockBtn.classList.toggle("shovel-spacing-lock--locked", linked);
          lockBtn.classList.toggle("shovel-spacing-lock--unlocked", !linked);
          lockBtn.setAttribute(
            "aria-label",
            linked ? "All sides locked together" : "Sides independent — click to lock",
          );
          lockBtn.title = linked ? "All sides locked — click to unlock" : "Sides independent — click to lock";
        }

        function syncAllSidesTo(value, sourceInput) {
          sides.forEach(function (side) {
            const prop = prefix + "-" + side;
            const field = wrapper.querySelector('[data-prop="' + prop + '"]');
            if (field && field !== sourceInput) field.value = value;
            applyPropChange(prop, value);
          });
        }

        linked = allSidesEqual();
        syncLockVisual();

        if (lockBtn) {
          lockBtn.addEventListener("click", function () {
            if (linked) {
              linked = false;
              syncLockVisual();
              return;
            }
            linked = true;
            const values = getSideValues();
            const syncValue = values.find(function (val) {
              return val !== "";
            });
            if (syncValue !== undefined) {
              syncAllSidesTo(syncValue);
            }
            syncLockVisual();
          });
        }

        wrapper.querySelectorAll('[data-spacing-role="side"]').forEach(function (input) {
          function onEdit() {
            const value = input.value;
            if (linked) {
              syncAllSidesTo(value, input);
              syncLockVisual();
              return;
            }
            applyPropChange(input.dataset.prop, value);
            if (allSidesEqual()) {
              linked = true;
            }
            syncLockVisual();
          }
          input.addEventListener("input", onEdit);
          input.addEventListener("change", onEdit);
        });
      }

      function createTokenColorField(item, tokenOptions) {
        const raw = pendingChanges.has(item.prop)
          ? pendingChanges.get(item.prop)
          : computed.getPropertyValue(item.prop).trim();
        const currentToken = resolveComputedToToken(raw, item.prop, shovelMeta);
        const isCustom = !currentToken;
        const hexValue = isCustom
          ? formatInputValue(item, raw)
          : cssColorToHex(resolveTokenValue(currentToken, shovelMeta.tokens) || raw);

        var items = [makeColorItem("", "Custom", "")];
        tokenOptions.forEach(function (tok) {
          items.push(colorItemFromToken(tok.name, shovelMeta.tokens));
        });

        const field = document.createElement("div");
        field.className = "shovel-prop-field shovel-prop-field--token-color";
        field.innerHTML =
          "<span>" + escapeHtml(item.label) + "</span>" +
          '<div class="shovel-token-color" data-prop="' + item.prop + '">' +
          buildColorDropdown({
            prop: item.prop,
            value: currentToken || "",
            items: items,
            ariaLabel: item.label + " token",
          }) +
          '  <div class="shovel-color-control" data-token-role="custom" hidden>' +
          '    <label class="shovel-color-swatch">' +
          '      <input type="color" data-prop="' + item.prop + '" data-color-role="swatch" value="' + escapeHtml(hexValue) + '" aria-label="' + escapeHtml(item.label) + ' custom color" />' +
          "    </label>" +
          '    <input type="text" class="shovel-color-hex" data-prop="' + item.prop + '" data-color-role="hex" value="' + escapeHtml(hexValue) + '" spellcheck="false" autocapitalize="off" />' +
          "  </div>" +
          "</div>";
        return field;
      }

      function createTokenTextField(item, tokenOptions) {
        const raw = pendingChanges.has(item.prop)
          ? pendingChanges.get(item.prop)
          : computed.getPropertyValue(item.prop).trim();
        const currentToken = resolveComputedToSpacingToken(raw, item.prop, shovelMeta);
        const isCustom = !currentToken;
        const customValue = isCustom ? raw : resolveTokenValue(currentToken, shovelMeta.tokens) || raw;

        var items = [{ value: "", label: customOptionLabel(isCustom ? customValue : "", "Custom") }];
        tokenOptions.forEach(function (tok) {
          items.push({
            value: tok.name,
            label: formatTokenOptionLabel(tok, shovelMeta.tokens),
          });
        });

        const field = document.createElement("div");
        field.className = "shovel-prop-field shovel-prop-field--token-text";
        field.innerHTML =
          "<span>" + escapeHtml(item.label) + "</span>" +
          '<div class="shovel-token-text" data-prop="' + item.prop + '">' +
          buildCustomDropdown({
            prop: item.prop,
            value: currentToken || "",
            items: items,
            ariaLabel: item.label + " token",
          }) +
          '  <input type="text" class="shovel-input-mono" data-prop="' + item.prop + '" data-token-role="custom" value="' + escapeHtml(customValue) + '" hidden spellcheck="false" />' +
          "</div>";
        return field;
      }

      function createPropField(item) {
        const tokenOptions = getTokenOptionsForProperty(item.prop, shovelMeta);
        if (item.type === "color" && tokenOptions.length) {
          return createTokenColorField(item, tokenOptions);
        }
        if (item.type === "text" && tokenOptions.length) {
          return createTokenTextField(item, tokenOptions);
        }

        const value = getPropValue(item);

        if (item.type === "color") {
          const field = document.createElement("div");
          field.className = "shovel-prop-field shovel-prop-field--color";
          field.innerHTML =
            "<span>" + escapeHtml(item.label) + "</span>" +
            '<div class="shovel-color-control">' +
            '  <label class="shovel-color-swatch">' +
            '    <input type="color" data-prop="' + item.prop + '" data-color-role="swatch" value="' + escapeHtml(value) + '" aria-label="' + escapeHtml(item.label) + ' color" />' +
            "  </label>" +
            '  <input type="text" class="shovel-color-hex" data-prop="' + item.prop + '" data-color-role="hex" value="' + escapeHtml(value) + '" spellcheck="false" autocapitalize="off" />' +
            "</div>";
          return field;
        }

        if (item.type === "select") {
          const options = item.options || [];
          const normalized = value.toLowerCase();
          const hasValue = options.some(function (opt) {
            return opt.toLowerCase() === normalized;
          });
          var selectedValue = value;
          if (hasValue) {
            var match = options.find(function (opt) {
              return opt.toLowerCase() === normalized;
            });
            if (match) selectedValue = match;
          }

          const field = document.createElement("label");
          field.className = "shovel-prop-field";

          if (item.prop === "display") {
            var displayItems = [];
            if (!hasValue && value) {
              displayItems.push(displayItemFromValue(value));
            }
            options.forEach(function (opt) {
              displayItems.push(displayItemFromValue(opt));
            });
            field.innerHTML =
              "<span>" + escapeHtml(item.label) + "</span>" +
              buildLayoutDropdown({
                prop: item.prop,
                value: selectedValue,
                items: displayItems,
                ariaLabel: item.label,
              });
            return field;
          }

          var items = [];
          if (!hasValue && value) {
            items.push({ value: value, label: value });
          }
          options.forEach(function (opt) {
            items.push({ value: opt, label: opt });
          });
          field.innerHTML =
            "<span>" + escapeHtml(item.label) + "</span>" +
            buildCustomDropdown({
              prop: item.prop,
              value: selectedValue,
              items: items,
              ariaLabel: item.label,
            });
          return field;
        }

        const field = document.createElement("label");
        field.className = "shovel-prop-field";
        field.innerHTML =
          "<span>" + escapeHtml(item.label) + '</span><input data-prop="' + item.prop + '" type="' + item.type + '" value="' + escapeHtml(value) + '" />';
        return field;
      }

      function bindTokenColorControl(control) {
        const prop = control.dataset.prop;
        const dropdown = control.querySelector("[data-dropdown]");
        const customWrap = control.querySelector('[data-token-role="custom"]');
        const swatch = control.querySelector('[data-color-role="swatch"]');
        const hex = control.querySelector('[data-color-role="hex"]');
        if (!dropdown || !selectedElement) return;

        function showCustomPicker() {
          if (!customWrap) return;
          customWrap.hidden = false;
        }

        function hideCustomPicker() {
          if (!customWrap) return;
          customWrap.hidden = true;
        }

        function applyToken(item) {
          if (!item || !item.value) return;
          applyPropChange(prop, tokenVar(item.value));
          setColorDropdownValue(dropdown, item);
          hideCustomPicker();
        }

        function applyCustomColor(hexValue) {
          var next = cssColorToHex(hexValue);
          if (swatch) swatch.value = next;
          if (hex) hex.value = next.toUpperCase();
          applyPropChange(prop, next);
          setColorDropdownValue(dropdown, makeColorItem("", "Custom", ""));
        }

        bindColorDropdown(dropdown, {
          onSelect: function (item) {
            if (item.value) {
              applyToken(item);
              return;
            }
            var current = pendingChanges.get(prop) || computed.getPropertyValue(prop).trim();
            var next = cssColorToHex(formatInputValue({ type: "color", prop: prop }, current));
            if (swatch) swatch.value = next;
            if (hex) hex.value = next.toUpperCase();
            setColorDropdownValue(dropdown, makeColorItem("", "Custom", ""));
            showCustomPicker();
            if (hex) {
              hex.focus();
              hex.select();
            }
          },
        });

        if (swatch) {
          swatch.addEventListener("input", function () {
            applyCustomColor(swatch.value);
          });
          swatch.addEventListener("change", function () {
            applyCustomColor(swatch.value);
          });
        }
        if (hex) {
          hex.addEventListener("input", function () {
            var typed = normalizeHexTyping(hex.value);
            hex.value = typed.toUpperCase();
            if (isValidHexColor(typed)) {
              var next = cssColorToHex(typed);
              if (swatch) swatch.value = next;
              applyPropChange(prop, next);
            }
          });
          hex.addEventListener("change", function () {
            if (isValidHexColor(hex.value)) {
              applyCustomColor(hex.value);
              return;
            }
            var current = pendingChanges.get(prop) || computed.getPropertyValue(prop).trim();
            var next = cssColorToHex(formatInputValue({ type: "color", prop: prop }, current));
            hex.value = next.toUpperCase();
            if (swatch) swatch.value = next;
          });
        }
      }

      function bindTokenTextControl(control) {
        const prop = control.dataset.prop;
        const dropdown = control.querySelector("[data-dropdown]");
        const customInput = control.querySelector('[data-token-role="custom"]');
        if (!dropdown || !selectedElement) return;

        bindDropdown(dropdown, function (val, label) {
          if (val) {
            applyPropChange(prop, tokenVar(val));
            if (customInput) customInput.hidden = true;
            return;
          }
          if (customInput) {
            customInput.hidden = false;
            customInput.focus();
            customInput.select();
          }
        });

        if (customInput) {
          function onCustomEdit() {
            applyPropChange(prop, customInput.value);
            setDropdownValue(dropdown, "", customInput.value);
          }
          customInput.addEventListener("input", onCustomEdit);
          customInput.addEventListener("change", onCustomEdit);
        }
      }

      function bindColorControl(control) {
        const swatch = control.querySelector('[data-color-role="swatch"]');
        const hex = control.querySelector('[data-color-role="hex"]');
        if (!swatch || !hex || !selectedElement) return;

        const prop = swatch.dataset.prop;

        function applyColor(raw) {
          var next = cssColorToHex(raw);
          swatch.value = next;
          hex.value = next;
          pendingChanges.set(prop, next);
          applyPreviewStyle(selectedElement, prop, next, shovelMeta.tokens);
          syncCurrentEditToTracked();
        }

        swatch.addEventListener("input", function () {
          applyColor(swatch.value);
        });
        swatch.addEventListener("change", function () {
          applyColor(swatch.value);
        });
        hex.addEventListener("input", function () {
          applyColor(hex.value);
        });
        hex.addEventListener("change", function () {
          applyColor(hex.value);
        });
      }

      const hiddenProps = getHiddenProperties(selectedSource, selectedTag, shovelMeta);

      for (const group of PROPERTY_GROUPS) {
        if (group.type === "spacing-row") {
          // spacing stays visible for layout elements (e.g. photo-row gap)
        } else if (group.items) {
          const visibleItems = group.items.filter(function (item) {
            return !hiddenProps.has(item.prop);
          });
          if (visibleItems.length === 0) continue;
        }

        const section = document.createElement("section");
        section.className = "shovel-prop-group";

        const heading = document.createElement("h4");
        heading.className = "shovel-prop-group__title";
        heading.textContent = group.title;
        section.appendChild(heading);

        if (group.type === "spacing-row") {
          const row = document.createElement("div");
          row.className = "shovel-spacing-row";
          (group.controls || []).forEach(function (control) {
            const card = document.createElement("div");
            card.className = "shovel-spacing-card shovel-spacing-card--" + control.prefix;
            const colLabel = document.createElement("div");
            colLabel.className = "shovel-spacing-card__label";
            colLabel.textContent = control.label;
            card.appendChild(colLabel);
            card.appendChild(createSpacingControl({ title: control.label, prefix: control.prefix }));
            row.appendChild(card);
          });
          section.appendChild(row);
        } else if (group.type === "spacing") {
          section.appendChild(createSpacingControl(group));
        } else {
          const visibleItems = group.items.filter(function (item) {
            return !hiddenProps.has(item.prop);
          });
          const grid = document.createElement("div");
          var colCount = visibleItems.length === 1 ? 1 : (group.columns || 1);
          grid.className = "shovel-prop-grid shovel-prop-grid--" + colCount;
          visibleItems.forEach(function (item) {
            grid.appendChild(createPropField(item));
          });
          section.appendChild(grid);
        }
        fragment.appendChild(section);
      }

      propsEl.appendChild(fragment);
      updateSubmitState();

      propsEl.querySelectorAll(".shovel-spacing").forEach(bindSpacingControl);
      propsEl.querySelectorAll(".shovel-token-color").forEach(bindTokenColorControl);
      propsEl.querySelectorAll(".shovel-token-text").forEach(bindTokenTextControl);
      propsEl.querySelectorAll(".shovel-color-control:not([data-token-role])").forEach(bindColorControl);

      propsEl.querySelectorAll('input[data-prop]:not([data-color-role]):not([data-spacing-role]):not([data-token-role])').forEach(function (input) {
        function onEdit(event) {
          const prop = event.target.dataset.prop;
          if (!prop || !selectedElement) return;
          var next = event.target.value;
          if (event.target.type === "color") next = cssColorToHex(next);
          applyPropChange(prop, next);
        }
        input.addEventListener("input", onEdit);
        input.addEventListener("change", onEdit);
      });

      propsEl.querySelectorAll("[data-dropdown].shovel-dropdown--layout").forEach(function (dropdown) {
        bindLayoutDropdown(dropdown, function (item) {
          applyPropChange(dropdown.dataset.prop, item.value);
        });
      });

      propsEl.querySelectorAll(".shovel-prop-field [data-dropdown]").forEach(function (dropdown) {
        if (dropdown.closest(".shovel-token-color") || dropdown.closest(".shovel-token-text")) return;
        if (dropdown.classList.contains("shovel-dropdown--layout")) return;
        if (dropdown.classList.contains("shovel-dropdown--color")) return;
        bindDropdown(dropdown, function (val) {
          applyPropChange(dropdown.dataset.prop, val);
        });
      });
    }

    function selectElement(el) {
      flushPendingToTracked();
      openPanel();
      switchTab("css");
      selectedElement = el;
      selectedSource = el.getAttribute("data-shovel-source");
      selectedTag = el.getAttribute("data-shovel-tag") || el.tagName.toLowerCase();
      pendingChanges.clear();
      originalValues.clear();
      EDITABLE_PROPERTIES.forEach(function (item) {
        originalValues.set(item.prop, getComputedStyle(el).getPropertyValue(item.prop).trim());
      });

      var saved = trackedChanges.get(selectedSource);
      if (saved) {
        Object.keys(saved.originals).forEach(function (prop) {
          originalValues.set(prop, saved.originals[prop]);
        });
        saved.changes.forEach(function (val, prop) {
          pendingChanges.set(prop, val);
          applyPreviewStyle(selectedElement, prop, val, shovelMeta.tokens);
        });
      }

      positionHighlight(el);
      syncPageHighlight();

      const tag = selectedTag;
      selectionDetails.hidden = false;
      if (selectionTagBadge) selectionTagBadge.textContent = "<" + tag + ">";
      selectionEl.innerHTML =
        '<div class="shovel-meta">' +
        '  <div class="shovel-meta__row">' +
        '    <span class="shovel-meta__label">Tag</span>' +
        "    <code>&lt;" + tag + "&gt;</code>" +
        "  </div>" +
        '  <div class="shovel-meta__row">' +
        '    <span class="shovel-meta__label">Source</span>' +
        '    <code class="shovel-source">' + escapeHtml(selectedSource || "") + "</code>" +
        "  </div>" +
        "</div>";

      renderPropertyEditors();
      updateSubmitState();
    }

    function resetPreview() {
      if (!selectedElement || !selectedSource) return;
      originalValues.forEach(function (original, prop) {
        if (original) applyPreviewStyle(selectedElement, prop, original, shovelMeta.tokens);
        else clearPreviewStyle(selectedElement, prop);
      });
      pendingChanges.clear();
      trackedChanges.delete(selectedSource);
      renderPropertyEditors();
      renderTrackedList();
      updateSubmitState();
      persistState();
    }

    function parseApiResponse(response) {
      return response.text().then(function (text) {
        var data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            throw new Error(
              "Shovel API returned a non-JSON response (HTTP " + response.status + "). " +
              "Run npm start and open http://localhost:3847 — not Live Server or npx serve.",
            );
          }
        }
        if (!response.ok) {
          if (response.status === 405) {
            throw new Error(
              "HTTP 405: this server does not accept POST. You are on a static file server. " +
              "Stop it, run npm start, and open http://localhost:3847",
            );
          }
          if (response.status === 404) {
            throw new Error(
              "Shovel API not found. Run npm start and open http://localhost:3847 (same origin as the API).",
            );
          }
          throw new Error((data && data.error) || "Request failed (HTTP " + response.status + ").");
        }
        if (!data) {
          throw new Error(
            "Empty response from Shovel API. Run npm start — the PR endpoint only exists on the staging server.",
          );
        }
        return data;
      });
    }

    function checkApiHealth() {
      fetch("/api/shovel/test-github", { cache: "no-store" })
        .then(function (r) { return r.text().then(function (text) { return { ok: r.ok, text: text }; }); })
        .then(function (res) {
          var data;
          try {
            data = JSON.parse(res.text);
          } catch (e) {
            throw new Error(
              location.port && location.port !== "3847"
                ? "Wrong port — open http://localhost:3847 (you are on :" + location.port + ")"
                : "Stale server — run npm run restart in the project folder",
            );
          }
          if (data.ok && data.canPush) {
            setGithubStatus(
              "GitHub ready — " + data.repo + " (base: " + (config.baseBranch || "main") + ")",
              "success",
            );
          } else if (data.ok && !data.canPush) {
            setGithubStatus(
              "Token cannot write to " + (config.repo || data.repo) + ". Use a classic PAT with repo scope.",
              "error",
            );
          } else {
            setGithubStatus(data.error || "GitHub connection failed", "error");
          }
        })
        .catch(function (err) {
          var message = err.message || "PR API offline";
          if (message === "Failed to fetch" || err.name === "TypeError") {
            message =
              location.port && location.port !== "3847"
                ? "Cannot reach API on port " + location.port + ". Open http://localhost:3847"
                : "PR API offline — run npm run restart, then open http://localhost:3847";
          }
          setGithubStatus(message, "error");
        });
    }

    function syncFromMain(options) {
      var files = collectShovelFiles();
      var branch = config.baseBranch || "main";
      var silent = options && options.silent;

      if (!silent && syncBtn) syncBtn.disabled = true;
      if (!silent) {
        setGithubStatus("Syncing " + files.join(", ") + " from " + branch + "...");
      }

      return fetch("/api/shovel/sync-from-main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files }),
      })
        .then(parseApiResponse)
        .then(function (data) {
          resetAfterSync();
          refreshStylesheetCache();
          if (data.synced.length > 0) {
            setGithubStatus(
              "Synced " + data.synced.join(", ") + " from " + branch + " — reloading…",
              "success",
            );
            setTimeout(function () {
              location.reload();
            }, 400);
            return data;
          }
          if (!silent) {
            setGithubStatus("Local files already match " + branch + ". Ready to edit.", "success");
            switchTab("css");
          }
          if (syncBtn) syncBtn.disabled = false;
          return data;
        })
        .catch(function (error) {
          var message = error.message || String(error);
          if (message === "Failed to fetch" || error.name === "TypeError") {
            message = "Cannot reach Shovel API. Run npm start and open http://localhost:3847.";
          }
          setGithubStatus(message, "error");
          if (syncBtn) syncBtn.disabled = false;
          throw error;
        });
    }

    function stopMergeWatch() {
      if (mergePollTimer) {
        clearInterval(mergePollTimer);
        mergePollTimer = null;
      }
    }

    function watchPrForMerge(prNumber, prUrl) {
      pendingPrNumber = prNumber;
      pendingPrUrl = prUrl || null;
      stopMergeWatch();
      var link = prUrl ? " — " + prUrl : "";
      setGithubStatus("PR #" + prNumber + " open" + link + ". Will sync local files when merged.", "info");
      persistState();

      function checkMerge() {
        fetch("/api/shovel/pr/" + prNumber, { cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.merged) {
              stopMergeWatch();
              pendingPrNumber = null;
              pendingPrUrl = null;
              persistState();
              setGithubStatus("PR #" + prNumber + " merged — syncing local files from main…", "success");
              syncFromMain({ silent: true });
            } else if (data.state === "closed" && !data.merged) {
              stopMergeWatch();
              pendingPrNumber = null;
              pendingPrUrl = null;
              persistState();
              setGithubStatus("PR #" + prNumber + " was closed without merging.", "error");
              if (syncBtn) syncBtn.disabled = false;
            }
          })
          .catch(function () { /* keep polling */ });
      }

      checkMerge();
      mergePollTimer = setInterval(checkMerge, 15000);
    }

    function submitPullRequest() {
      var edits = collectEditsForPr();
      if (edits.length === 0) return;

      submitBtn.disabled = true;
      stopMergeWatch();
      switchTab("tracked");
      setGithubStatus("Creating pull request (" + edits.length + " element" + (edits.length === 1 ? "" : "s") + ")...");

      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits: edits }),
      })
        .then(parseApiResponse)
        .then(function (data) {
          clearAllTracked({ revert: false });
          updateSubmitState();
          watchPrForMerge(data.number, data.url);
        })
        .catch(function (error) {
          var message = error.message || String(error);
          if (message === "Failed to fetch" || error.name === "TypeError") {
            message = "Cannot reach Shovel API. Run npm start and open http://localhost:3847.";
          }
          setGithubStatus(message, "error");
          submitBtn.disabled = false;
          updateSubmitState();
        });
    }

    fab.addEventListener("click", function () {
      openPanel();
      switchTab("css");
    });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("click", function () {
      closeAllDropdowns();
    });
    window.addEventListener("resize", function () {
      closeAllDropdowns();
    });
    if (propsEl) {
      propsEl.addEventListener("scroll", function () {
        closeAllDropdowns();
      });
    }
    resetBtn.addEventListener("click", resetPreview);
    submitBtn.addEventListener("click", submitPullRequest);
    if (syncBtn) syncBtn.addEventListener("click", function () { syncFromMain(); });
    clearTrackedBtn.addEventListener("click", clearAllTracked);

    trackedListEl.addEventListener("click", function (event) {
      var undoBtn = event.target.closest(".shovel-tracked-undo");
      if (undoBtn) {
        event.stopPropagation();
        undoTracked(undoBtn.dataset.source);
        return;
      }
      var item = event.target.closest(".shovel-tracked-item");
      if (item) focusTrackedItem(item.dataset.source);
    });

    trackedListEl.addEventListener("mouseover", function (event) {
      var item = event.target.closest(".shovel-tracked-item");
      if (!item || currentTab !== "tracked") return;
      hoveredTrackedSource = item.dataset.source;
      syncPageHighlight();
    });

    trackedListEl.addEventListener("mouseout", function (event) {
      var item = event.target.closest(".shovel-tracked-item");
      if (!item || currentTab !== "tracked") return;
      var related = event.relatedTarget;
      if (related && item.contains(related)) return;
      if (hoveredTrackedSource === item.dataset.source) hoveredTrackedSource = null;
      syncPageHighlight();
    });

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.addEventListener(
      "mousemove",
      function (event) {
        if (currentTab !== "css") return;
        if (isShovelUiEvent(event)) return;
        if (isSelectionLocked()) {
          positionHighlight(selectedElement);
          return;
        }
        if (!picking || !isPanelOpen()) return;
        const el = findStampedElement(event.target);
        if (el) positionHighlight(el);
        else highlight.style.display = "none";
      },
      true,
    );

    document.addEventListener(
      "click",
      function (event) {
        if (isShovelUiEvent(event)) return;
        const el = findStampedElement(event.target);
        if (!el) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(el);
      },
      true,
    );

    window.addEventListener("scroll", function () {
      refreshHighlightPosition();
    }, true);

    window.addEventListener("resize", function () {
      refreshHighlightPosition();
    }, true);

    console.info("[Shovel] Editor ready — click any element or the shovel button to start.");
    loadPersistedState();
    renderTrackedList();
    updateSubmitState();
    if (!pendingPrNumber) checkApiHealth();
  }

  // --- Boot ---

  async function boot() {
    if (window.__SHOVEL_BOOTED) return;
    if (!document.querySelector("[data-shovel-source]")) {
      console.warn("[Shovel] No stamped elements found.");
      return;
    }
    window.__SHOVEL_BOOTED = true;

    var shovelMeta = {
      tokens: {},
      propertyTokenGroups: {},
      sourceRules: {},
      tagRules: {},
      backgroundColorAllowTags: ["card", "button", "page"],
    };
    try {
      var tokenRes = await fetch("/api/shovel/tokens");
      if (tokenRes.ok) {
        shovelMeta = await tokenRes.json();
      }
    } catch (_err) {
      console.warn("[Shovel] Token catalog unavailable — using raw property editors.");
    }

    mountOverlay({
      repo: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.repo ? window.__SHOVEL_CONFIG.repo : "",
      baseBranch: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.baseBranch ? window.__SHOVEL_CONFIG.baseBranch : "main",
      apiUrl: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.apiUrl ? window.__SHOVEL_CONFIG.apiUrl : "/api/shovel/pr",
      shovelMeta: shovelMeta,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
