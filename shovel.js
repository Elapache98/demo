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
      '    <button type="button" class="shovel-tab" role="tab" data-tab="github" aria-selected="false">GitHub</button>' +
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
      '      <p class="shovel-hint">Tracked edits are saved in this browser. Review before opening a PR.</p>' +
      '      <div class="shovel-tracked-list"></div>' +
      "    </section>" +
      '    <footer class="shovel-footer">' +
      '      <button type="button" class="shovel-btn shovel-btn-secondary shovel-clear-tracked" disabled>Undo all</button>' +
      "    </footer>" +
      "  </div>" +
      '  <div class="shovel-tab-panel" data-panel="github" role="tabpanel" hidden>' +
      '    <section class="shovel-section shovel-settings">' +
      '      <p class="shovel-hint">Submit tracked edits as a PR. After merge on GitHub, Shovel syncs <strong>' +
      escapeHtml(config.baseBranch || "main") +
      '</strong> into your local CSS so preview matches deploy.</p>' +
      "    </section>" +
      '    <footer class="shovel-footer shovel-github-actions">' +
      '      <button type="button" class="shovel-btn shovel-btn-secondary shovel-sync">Sync from main</button>' +
      '      <button type="button" class="shovel-btn shovel-btn-primary shovel-submit" disabled>Submit PR</button>' +
      "    </footer>" +
      '    <div class="shovel-status shovel-github-status"></div>' +
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
          el.style.setProperty(prop, val);
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
        trackedListEl.innerHTML = '<p class="shovel-tracked-empty">No tracked changes yet. Edit elements on the CSS tab.</p>';
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
        if (original) el.style.setProperty(prop, original);
        else el.style.removeProperty(prop);
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
        selectedElement.style.setProperty(prop, value);
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
          '<button type="button" class="shovel-spacing-link" aria-label="Link all sides" title="Link all sides">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<path d="M6.2 9.8a2.2 2.2 0 0 0 3.1 0l1.5-1.5a2.2 2.2 0 0 0-3.1-3.1L7 5.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path d="M9.8 6.2a2.2 2.2 0 0 0-3.1 0L5.2 7.7a2.2 2.2 0 0 0 3.1 3.1L9 10.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          "</svg></button>";
        wrapper.appendChild(core);
        return wrapper;
      }

      function bindSpacingControl(wrapper) {
        const prefix = wrapper.dataset.spacingPrefix;
        const linkBtn = wrapper.querySelector(".shovel-spacing-link");
        let linked = false;

        if (linkBtn) {
          linkBtn.addEventListener("click", function () {
            linked = !linked;
            linkBtn.classList.toggle("shovel-spacing-link--active", linked);
          });
        }

        wrapper.querySelectorAll('[data-spacing-role="side"]').forEach(function (input) {
          function onEdit() {
            const value = input.value;
            if (linked) {
              ["top", "right", "bottom", "left"].forEach(function (side) {
                const prop = prefix + "-" + side;
                applyPropChange(prop, value);
                const field = wrapper.querySelector('[data-prop="' + prop + '"]');
                if (field && field !== input) field.value = value;
              });
              return;
            }
            applyPropChange(input.dataset.prop, value);
          }
          input.addEventListener("input", onEdit);
          input.addEventListener("change", onEdit);
        });
      }

      function createPropField(item) {
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
          var optionsHtml = "";
          if (!hasValue && value) {
            optionsHtml +=
              '<option value="' + escapeHtml(value) + '" selected>' + escapeHtml(value) + "</option>";
          }
          options.forEach(function (opt) {
            const selected = opt.toLowerCase() === normalized ? " selected" : "";
            optionsHtml +=
              '<option value="' + escapeHtml(opt) + '"' + selected + ">" + escapeHtml(opt) + "</option>";
          });

          const field = document.createElement("label");
          field.className = "shovel-prop-field";
          field.innerHTML =
            "<span>" + escapeHtml(item.label) + '</span><select data-prop="' + item.prop + '">' + optionsHtml + "</select>";
          return field;
        }

        const field = document.createElement("label");
        field.className = "shovel-prop-field";
        field.innerHTML =
          "<span>" + escapeHtml(item.label) + '</span><input data-prop="' + item.prop + '" type="' + item.type + '" value="' + escapeHtml(value) + '" />';
        return field;
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
          selectedElement.style.setProperty(prop, next);
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

      for (const group of PROPERTY_GROUPS) {
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
          const grid = document.createElement("div");
          grid.className = "shovel-prop-grid shovel-prop-grid--" + (group.columns || 1);
          group.items.forEach(function (item) {
            grid.appendChild(createPropField(item));
          });
          section.appendChild(grid);
        }
        fragment.appendChild(section);
      }

      propsEl.appendChild(fragment);
      updateSubmitState();

      propsEl.querySelectorAll(".shovel-spacing").forEach(bindSpacingControl);
      propsEl.querySelectorAll(".shovel-color-control").forEach(bindColorControl);

      propsEl.querySelectorAll('input[data-prop]:not([data-color-role]):not([data-spacing-role])').forEach(function (input) {
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

      propsEl.querySelectorAll("select[data-prop]").forEach(function (select) {
        function onSelect() {
          applyPropChange(select.dataset.prop, select.value);
        }
        select.addEventListener("change", onSelect);
      });
    }

    function selectElement(el) {
      flushPendingToTracked();
      openPanel();
      switchTab("css");
      selectedElement = el;
      selectedSource = el.getAttribute("data-shovel-source");
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
          selectedElement.style.setProperty(prop, val);
        });
      }

      positionHighlight(el);
      syncPageHighlight();

      const tag = el.getAttribute("data-shovel-tag") || el.tagName.toLowerCase();
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
        selectedElement.style.setProperty(prop, original);
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
          if (data.synced.length === 0) {
            if (!silent) {
              setGithubStatus("Local files already match " + branch + ".", "success");
              if (syncBtn) syncBtn.disabled = false;
            }
            return data;
          }
          setGithubStatus("Synced " + data.synced.join(", ") + " from " + branch + " — reloading…", "success");
          clearAllTracked({ revert: false });
          clearPersistedState();
          setTimeout(function () {
            location.reload();
          }, 400);
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
      switchTab("github");
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
        const el = findStampedElement(event.target);
        if (el && el !== selectedElement) positionHighlight(el);
        else if (!el && !selectedElement) highlight.style.display = "none";
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

  function boot() {
    if (window.__SHOVEL_BOOTED) return;
    if (!document.querySelector("[data-shovel-source]")) {
      console.warn("[Shovel] No stamped elements found.");
      return;
    }
    window.__SHOVEL_BOOTED = true;
    mountOverlay({
      repo: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.repo ? window.__SHOVEL_CONFIG.repo : "",
      baseBranch: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.baseBranch ? window.__SHOVEL_CONFIG.baseBranch : "main",
      apiUrl: window.__SHOVEL_CONFIG && window.__SHOVEL_CONFIG.apiUrl ? window.__SHOVEL_CONFIG.apiUrl : "/api/shovel/pr",
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
