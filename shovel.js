/**
 * Shovel — visual editor + GitHub PR flow
 * Single-file vanilla JS. Boots automatically on page load.
 */
(function Shovel() {
  "use strict";

  const PAT_STORAGE_KEY = "shovel_github_pat";

  const EDITABLE_PROPERTIES = [
    { prop: "color", label: "Color", type: "color" },
    { prop: "background-color", label: "Background", type: "color" },
    { prop: "padding-top", label: "Padding top", type: "text" },
    { prop: "padding-right", label: "Padding right", type: "text" },
    { prop: "padding-bottom", label: "Padding bottom", type: "text" },
    { prop: "padding-left", label: "Padding left", type: "text" },
    { prop: "margin-top", label: "Margin top", type: "text" },
    { prop: "margin-right", label: "Margin right", type: "text" },
    { prop: "margin-bottom", label: "Margin bottom", type: "text" },
    { prop: "margin-left", label: "Margin left", type: "text" },
    { prop: "font-size", label: "Font size", type: "text" },
    { prop: "font-weight", label: "Font weight", type: "text" },
    { prop: "border-radius", label: "Border radius", type: "text" },
    { prop: "width", label: "Width", type: "text" },
    { prop: "height", label: "Height", type: "text" },
    { prop: "gap", label: "Gap", type: "text" },
    { prop: "display", label: "Display", type: "text" },
  ];

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

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // --- CSS file rewriting ---

  function applyCssChanges(cssText, selector, changes) {
    const rulePattern = new RegExp(
      "(" + escapeRegex(selector) + "\\s*\\{)([\\s\\S]*?)(\\})",
      "m",
    );
    const match = cssText.match(rulePattern);
    if (!match) {
      throw new Error("Selector not found in CSS: " + selector);
    }

    let body = match[2];
    for (const change of changes) {
      const propPattern = new RegExp(
        "\\s*" + escapeRegex(change.property) + "\\s*:[^;\\n]*;?",
        "i",
      );
      const declaration = "\n  " + change.property + ": " + change.value + ";";
      if (propPattern.test(body)) {
        body = body.replace(propPattern, declaration);
      } else {
        body += declaration;
      }
    }

    return cssText.replace(rulePattern, "$1" + body + "\n$3");
  }

  // --- GitHub API ---

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function createGitHubClient(token, repo, baseBranch) {
    const parts = repo.split("/");
    const owner = parts[0];
    const name = parts[1];
    if (!owner || !name) throw new Error("Repo must be org/repo");

    const apiBase = "https://api.github.com";

    async function request(path, init) {
      const response = await fetch(apiBase + path, Object.assign({}, init, {
        headers: Object.assign(
          {
            Accept: "application/vnd.github+json",
            Authorization: "Bearer " + token,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          init && init.headers ? init.headers : {},
        ),
      }));
      if (!response.ok) {
        throw new Error("GitHub API " + response.status + ": " + (await response.text()));
      }
      if (response.status === 204) return null;
      return response.json();
    }

    return {
      fetchFile: function (filePath, ref) {
        ref = ref || baseBranch;
        return request(
          "/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(filePath) + "?ref=" + encodeURIComponent(ref),
        ).then(function (data) {
          if (!data || !data.content) throw new Error("File not found: " + filePath);
          return atob(data.content.replace(/\n/g, ""));
        });
      },
      createPullRequest: function (params) {
        const branchName = "shovel/edit-" + Date.now();
        return request("/repos/" + owner + "/" + name + "/git/ref/heads/" + baseBranch)
          .then(function (baseRef) {
            return request("/repos/" + owner + "/" + name + "/git/refs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ref: "refs/heads/" + branchName, sha: baseRef.object.sha }),
            });
          })
          .then(function () {
            return request(
              "/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(params.filePath) + "?ref=" + encodeURIComponent(branchName),
            );
          })
          .then(function (existing) {
            return request("/repos/" + owner + "/" + name + "/contents/" + encodeURIComponent(params.filePath), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: "Shovel: update " + params.filePath,
                content: encodeBase64(params.content),
                branch: branchName,
                sha: existing.sha,
              }),
            });
          })
          .then(function () {
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
          });
      },
    };
  }

  // --- Visual editor overlay ---

  function mountOverlay(config) {
    if (document.querySelector("[data-shovel-root]")) return;

    const host = document.createElement("div");
    host.setAttribute("data-shovel-root", "true");
    host.className = "shovel-root";
    host.innerHTML =
      '<button type="button" class="shovel-fab" aria-label="Open Shovel editor">⛏</button>' +
      '<div class="shovel-panel shovel-hidden">' +
      '  <header class="shovel-header"><strong>Shovel</strong><button type="button" class="shovel-close" aria-label="Close">×</button></header>' +
      '  <nav class="shovel-tabs" role="tablist">' +
      '    <button type="button" class="shovel-tab shovel-tab--active" role="tab" data-tab="css" aria-selected="true">CSS</button>' +
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
      '    <div class="shovel-status shovel-css-status"></div>' +
      "  </div>" +
      '  <div class="shovel-tab-panel" data-panel="github" role="tabpanel" hidden>' +
      '    <section class="shovel-section shovel-settings">' +
      '      <p class="shovel-hint">Connect GitHub to open a pull request with your CSS changes.</p>' +
      '      <label>GitHub repo<input class="shovel-input shovel-repo" type="text" placeholder="org/repo" value="' + escapeHtml(config.repo || "") + '" /></label>' +
      '      <label>Base branch<input class="shovel-input shovel-branch" type="text" value="' + escapeHtml(config.baseBranch || "main") + '" /></label>' +
      '      <label>GitHub PAT<input class="shovel-input shovel-pat" type="password" placeholder="ghp_..." /></label>' +
      "    </section>" +
      '    <footer class="shovel-footer"><button type="button" class="shovel-btn shovel-btn-primary shovel-submit" disabled>Submit PR</button></footer>' +
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
    const cssStatusEl = host.querySelector(".shovel-css-status");
    const githubStatusEl = host.querySelector(".shovel-github-status");
    const submitBtn = host.querySelector(".shovel-submit");
    const resetBtn = host.querySelector(".shovel-reset");
    const repoInput = host.querySelector(".shovel-repo");
    const branchInput = host.querySelector(".shovel-branch");
    const patInput = host.querySelector(".shovel-pat");
    const tabButtons = host.querySelectorAll(".shovel-tab");
    const tabPanels = host.querySelectorAll(".shovel-tab-panel");

    const savedPat = sessionStorage.getItem(PAT_STORAGE_KEY);
    if (savedPat) patInput.value = savedPat;

    let selectedElement = null;
    let selectedSource = null;
    const originalValues = new Map();
    const pendingChanges = new Map();
    let picking = false;

    const highlight = document.createElement("div");
    highlight.className = "shovel-highlight";
    highlight.style.display = "none";
    document.body.appendChild(highlight);

    function setCssStatus(message) {
      cssStatusEl.textContent = message;
    }

    function setGithubStatus(message, type) {
      githubStatusEl.textContent = message;
      githubStatusEl.dataset.type = type || "info";
    }

    function switchTab(tabName) {
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
    }

    function openPanel() {
      panel.classList.remove("shovel-hidden");
      picking = true;
      if (!selectedElement) {
        setCssStatus("");
        selectionDetails.hidden = true;
      }
    }

    function closePanel() {
      panel.classList.add("shovel-hidden");
      picking = false;
      highlight.style.display = "none";
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

    function renderPropertyEditors() {
      propsEl.innerHTML = "";
      if (!selectedElement) return;

      const computed = getComputedStyle(selectedElement);
      const fragment = document.createDocumentFragment();

      for (const item of EDITABLE_PROPERTIES) {
        const row = document.createElement("label");
        row.className = "shovel-prop-row";
        const value = pendingChanges.get(item.prop) || computed.getPropertyValue(item.prop).trim();
        originalValues.set(item.prop, computed.getPropertyValue(item.prop).trim());
        row.innerHTML =
          "<span>" + item.label + '</span><input data-prop="' + item.prop + '" type="' + item.type + '" value="' + escapeHtml(value) + '" />';
        fragment.appendChild(row);
      }

      propsEl.appendChild(fragment);
      submitBtn.disabled = pendingChanges.size === 0;

      propsEl.querySelectorAll("input[data-prop]").forEach(function (input) {
        input.addEventListener("input", function (event) {
          const prop = event.target.dataset.prop;
          if (!prop || !selectedElement) return;
          pendingChanges.set(prop, event.target.value);
          selectedElement.style.setProperty(prop, event.target.value);
          submitBtn.disabled = pendingChanges.size === 0;
        });
      });
    }

    function selectElement(el) {
      openPanel();
      switchTab("css");
      selectedElement = el;
      selectedSource = el.getAttribute("data-shovel-source");
      pendingChanges.clear();
      originalValues.clear();
      positionHighlight(el);

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
      setCssStatus("Editing selected element. Changes preview live on the page.");
    }

    function resetPreview() {
      if (!selectedElement) return;
      originalValues.forEach(function (original, prop) {
        selectedElement.style.setProperty(prop, original);
      });
      pendingChanges.clear();
      renderPropertyEditors();
      setCssStatus("Preview reset.");
    }

    function submitPullRequest() {
      if (!selectedElement || !selectedSource || pendingChanges.size === 0) return;

      const repo = repoInput.value.trim();
      const baseBranch = branchInput.value.trim() || "main";
      const token = patInput.value.trim();

      if (!repo || !token) {
        switchTab("github");
        setGithubStatus("GitHub repo and PAT are required.", "error");
        return;
      }

      sessionStorage.setItem(PAT_STORAGE_KEY, token);
      submitBtn.disabled = true;
      switchTab("github");
      setGithubStatus("Creating pull request...");

      const location = parseSource(selectedSource);
      const github = createGitHubClient(token, repo, baseBranch);
      const changes = Array.from(pendingChanges.entries()).map(function (entry) {
        return { property: entry[0], value: entry[1] };
      });

      github
        .fetchFile(location.file, baseBranch)
        .then(function (source) {
          const updated = applyCssChanges(source, location.selector, changes);
          const diffSummary = changes
            .map(function (c) {
              return "- `" + c.property + "`: `" + (originalValues.get(c.property) || "") + "` → `" + c.value + "`";
            })
            .join("\n");

          return github.createPullRequest({
            filePath: location.file,
            content: updated,
            title: "Shovel: visual edit " + location.selector,
            body: [
              "## Shovel visual edit",
              "",
              "**Element:** `" + location.selector + "`",
              "**Source:** `" + selectedSource + "`",
              "",
              "### CSS changes",
              diffSummary,
              "",
              "_Created by Shovel_",
            ].join("\n"),
          });
        })
        .then(function (pr) {
          setGithubStatus("PR created: #" + pr.number, "success");
        })
        .catch(function (error) {
          setGithubStatus(error.message || String(error), "error");
          submitBtn.disabled = false;
        });
    }

    fab.addEventListener("click", function () {
      openPanel();
      switchTab("css");
    });
    closeBtn.addEventListener("click", closePanel);
    resetBtn.addEventListener("click", resetPreview);
    submitBtn.addEventListener("click", submitPullRequest);

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.addEventListener(
      "mousemove",
      function (event) {
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
      if (selectedElement) positionHighlight(selectedElement);
    }, true);

    window.addEventListener("resize", function () {
      if (selectedElement) positionHighlight(selectedElement);
    }, true);

    console.info("[Shovel] Editor ready — click any element or the shovel button to start.");
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
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
