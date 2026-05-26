(() => {
  const STORAGE_KEY = "patterns";

  const entriesEl = document.getElementById("entries");
  const tpl = document.getElementById("entry-template");
  const addBtn = document.getElementById("add");
  const saveBtn = document.getElementById("save");
  const status = document.getElementById("status");

  // ─── State ────────────────────────────────────────────────────────────────
  // Render directly from DOM on save; no separate in-memory list needed.

  const makeEntryNode = ({
    pattern = "",
    buttonText = "",
    prompt = "",
  } = {}) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".pattern").value = pattern;
    node.querySelector(".button-text").value = buttonText;
    node.querySelector(".prompt").value = prompt;
    node.querySelector(".delete").addEventListener("click", () => {
      node.remove();
      ensureEmptyState();
    });
    return node;
  };

  const addEntry = (data) => {
    const empty = entriesEl.querySelector(".empty");
    if (empty) empty.remove();
    entriesEl.appendChild(makeEntryNode(data));
  };

  const ensureEmptyState = () => {
    if (entriesEl.children.length === 0) {
      const div = document.createElement("div");
      div.className = "empty";
      div.textContent =
        "No patterns yet. Click \u201C+ Add pattern\u201D to create one.";
      entriesEl.appendChild(div);
    }
  };

  const readEntries = () => {
    const rows = entriesEl.querySelectorAll(".entry");
    const out = [];
    rows.forEach((row) => {
      const pattern = row.querySelector(".pattern").value.trim();
      const buttonText = row.querySelector(".button-text").value.trim();
      const prompt = row.querySelector(".prompt").value; // preserve whitespace
      // Skip rows that are completely empty so users can leave blanks while editing.
      if (!pattern && !buttonText && !prompt.trim()) return;
      out.push({ pattern, buttonText, prompt });
    });
    return out;
  };

  // ─── Status flash ─────────────────────────────────────────────────────────
  const showStatus = (msg) => {
    status.textContent = msg;
    status.classList.add("show");
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => status.classList.remove("show"), 1800);
  };

  // ─── Load ─────────────────────────────────────────────────────────────────
  // If no patterns are stored yet, seed a sensible default.
  const DEFAULT_ENTRY = {
    pattern: "github.com/*/*/pull/*",
    buttonText: "Open PR in goose",
    prompt: "Review the pull request at <URL>.",
  };

  chrome.storage.sync.get({ [STORAGE_KEY]: null }, (items) => {
    let list = items[STORAGE_KEY];
    if (!Array.isArray(list) || list.length === 0) {
      list = [DEFAULT_ENTRY];
    }
    list.forEach(addEntry);
    ensureEmptyState();
  });

  // ─── Wiring ───────────────────────────────────────────────────────────────
  addBtn.addEventListener("click", () => addEntry());

  saveBtn.addEventListener("click", () => {
    const list = readEntries();
    chrome.storage.sync.set({ [STORAGE_KEY]: list }, () => {
      if (chrome.runtime.lastError) {
        showStatus("Error: " + chrome.runtime.lastError.message);
      } else {
        showStatus(
          list.length === 1
            ? "Saved 1 pattern ✓"
            : `Saved ${list.length} patterns ✓`,
        );
      }
    });
  });

  // Cmd/Ctrl+S to save from anywhere on the page.
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      saveBtn.click();
    }
  });
})();
