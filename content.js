(() => {
  const BUTTON_ID = "goose-pr-button";
  // Matches github.com/<org>/<repo>/pull/<pr> with optional trailing path/query/hash.
  // Capture group 1 = PR number.
  const PR_URL_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)(\/.*)?$/;

  const getPRNumber = () => {
    const m = location.href.match(PR_URL_RE);
    return m ? m[1] : null;
  };

  const isPRPage = () => getPRNumber() !== null;

  const getPRLink = () => {
    const m = location.href.match(PR_URL_RE);
    if (!m) return null;
    // Canonical PR URL: strip any sub-path (/files, /commits, ...), query, or hash.
    // m[0] is the full match including any trailing path; rebuild from the base.
    const prNumber = m[1];
    const { origin, pathname } = location;
    // pathname looks like /<org>/<repo>/pull/<num>[/...]; keep up to the number.
    const base = pathname.replace(/^(\/[^/]+\/[^/]+\/pull\/\d+).*$/, "$1");
    return `${origin}${base}`;
  };

  const buildGooseUrl = (prLink, promptTemplate) => {
    const base = "goose://new-session";
    const template = (promptTemplate || "").trim();
    if (!template) return base;
    // Replace the literal placeholder <PR LINK> (case-sensitive, as specified).
    const filled = template.split("<PR LINK>").join(prLink);
    return `${base}?prompt=${encodeURIComponent(filled)}`;
  };

  const openInGoose = () => {
    const prLink = getPRLink();
    if (!prLink) return;
    chrome.storage.sync.get({ prompt: "" }, (items) => {
      const url = buildGooseUrl(prLink, items.prompt);
      window.location.href = url;
    });
  };

  const createButton = () => {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.setAttribute("aria-label", "Open PR in goose");
    btn.title = "Open PR in goose";

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("icons/goose.png");
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    btn.appendChild(img);

    const label = document.createElement("span");
    label.textContent = "Open PR in goose";
    btn.appendChild(label);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInGoose();
    });

    document.body.appendChild(btn);
  };

  const removeButton = () => {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
  };

  const sync = () => {
    if (isPRPage()) {
      createButton();
    } else {
      removeButton();
    }
  };

  // Initial render
  sync();

  // GitHub is a SPA — watch for URL changes via history API + popstate.
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
  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event("goose:locationchange"));
  });
  window.addEventListener("goose:locationchange", sync);

  // Fallback: GitHub's Turbo navigation events.
  document.addEventListener("turbo:load", sync);
  document.addEventListener("pjax:end", sync);
})();
