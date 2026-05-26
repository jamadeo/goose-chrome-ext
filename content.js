(() => {
  const CONTAINER_ID = "goose-button-container";
  const STORAGE_KEY = "patterns";

  // ─── Pattern → RegExp ──────────────────────────────────────────────────────
  // Syntax:
  //   *   matches one path segment (no `/`)
  //   **  matches any characters (including `/`)
  // Scheme defaults to `https://` if not present.
  // The query string and hash of the page URL are ignored when matching.
  // Anchored to start; if the pattern doesn't end in `*`/`**`, we still allow
  // a trailing slash + arbitrary path so e.g. `github.com/*/*/pull/*` matches
  // `.../pull/123/files`.
  //
  // Returns { regex, captureCount } or null if the pattern is empty.
  const compilePattern = (rawPattern) => {
    if (!rawPattern) return null;
    let p = rawPattern.trim();
    if (!p) return null;

    // Add scheme if missing.
    if (!/^https?:\/\//.test(p)) {
      p = "https://" + p;
    }

    let captureCount = 0;
    let out = "";
    let i = 0;
    while (i < p.length) {
      const ch = p[i];
      if (ch === "*") {
        if (p[i + 1] === "*") {
          out += "(.*)";
          captureCount++;
          i += 2;
        } else {
          out += "([^/]*)";
          captureCount++;
          i += 1;
        }
      } else if (/[.+?^${}()|[\]\\]/.test(ch)) {
        // Escape regex metachars (note: `*` handled above; `/` is not special)
        out += "\\" + ch;
        i += 1;
      } else {
        out += ch;
        i += 1;
      }
    }

    // Allow trailing path/query/hash after the matched portion.
    const regex = new RegExp("^" + out + "(?:[/?#].*)?$");
    return { regex, captureCount };
  };

  // Canonical URL = origin + pathname (drop query + hash) for matching/display.
  const canonicalUrl = () => location.origin + location.pathname;

  // Evaluate one pattern against the current page URL.
  // Returns { captures: string[] } if it matches, else null.
  const matchPattern = (rawPattern) => {
    const compiled = compilePattern(rawPattern);
    if (!compiled) return null;
    const m = canonicalUrl().match(compiled.regex);
    if (!m) return null;
    return { captures: m.slice(1) };
  };

  // ─── Prompt templating ─────────────────────────────────────────────────────
  // Substitute <URL> and <1>, <2>, ... in the template.
  const fillTemplate = (template, captures, url) => {
    if (!template) return "";
    let out = template.split("<URL>").join(url);
    captures.forEach((cap, idx) => {
      out = out.split(`<${idx + 1}>`).join(cap);
    });
    return out;
  };

  const buildGooseUrl = (template, captures, url) => {
    const base = "goose://new-session";
    const filled = fillTemplate(template || "", captures, url).trim();
    if (!filled) return base;
    return `${base}?prompt=${encodeURIComponent(filled)}`;
  };

  // ─── Rendering ─────────────────────────────────────────────────────────────
  const ensureContainer = () => {
    let c = document.getElementById(CONTAINER_ID);
    if (!c) {
      c = document.createElement("div");
      c.id = CONTAINER_ID;
      document.body.appendChild(c);
    }
    return c;
  };

  const removeContainer = () => {
    const c = document.getElementById(CONTAINER_ID);
    if (c) c.remove();
  };

  const createButton = ({ buttonText, prompt }, captures, url) => {
    const btn = document.createElement("button");
    btn.className = "goose-pr-button";
    btn.type = "button";
    const label = (buttonText || "Open in goose").trim();
    btn.setAttribute("aria-label", label);
    btn.title = label;

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("icons/goose.png");
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    btn.appendChild(img);

    const span = document.createElement("span");
    span.textContent = label;
    btn.appendChild(span);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = buildGooseUrl(prompt, captures, url);
    });

    return btn;
  };

  const render = (patterns) => {
    const url = canonicalUrl();
    const matches = (patterns || [])
      .map((entry) => {
        const m = matchPattern(entry.pattern);
        return m ? { entry, captures: m.captures } : null;
      })
      .filter(Boolean);

    if (matches.length === 0) {
      removeContainer();
      return;
    }

    const container = ensureContainer();
    container.innerHTML = ""; // simple full-rerender; list is tiny
    for (const { entry, captures } of matches) {
      container.appendChild(createButton(entry, captures, url));
    }
  };

  // ─── State management ──────────────────────────────────────────────────────
  let currentPatterns = [];

  const loadAndRender = () => {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (items) => {
      currentPatterns = items[STORAGE_KEY] || [];
      render(currentPatterns);
    });
  };

  // React to settings changes without needing a page reload.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes[STORAGE_KEY]) {
      currentPatterns = changes[STORAGE_KEY].newValue || [];
      render(currentPatterns);
    }
  });

  // Initial render
  loadAndRender();

  // ─── SPA navigation handling ───────────────────────────────────────────────
  const onLocationChange = () => render(currentPatterns);

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const ret = origPush.apply(this, args);
    window.dispatchEvent(new Event("goose:locationchange"));
    return ret;
  };
  history.replaceState = function (...args) {
    const ret = origReplace.apply(this, args);
    window.dispatchEvent(new Event("goose:locationchange"));
    return ret;
  };
  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("goose:locationchange")),
  );
  window.addEventListener("goose:locationchange", onLocationChange);
  // GitHub & many SPAs use Turbo/pjax.
  document.addEventListener("turbo:load", onLocationChange);
  document.addEventListener("pjax:end", onLocationChange);
})();
