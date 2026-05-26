(() => {
  const STORAGE_KEY = "prompt";
  const input = document.getElementById("prompt");
  const saveBtn = document.getElementById("save");
  const status = document.getElementById("status");

  // Load existing value
  chrome.storage.sync.get({ [STORAGE_KEY]: "" }, (items) => {
    input.value = items[STORAGE_KEY] || "";
  });

  const showStatus = (msg) => {
    status.textContent = msg;
    status.classList.add("show");
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => status.classList.remove("show"), 1500);
  };

  const save = () => {
    // Preserve newlines/spaces inside the prompt; just store as-is.
    const value = input.value;
    chrome.storage.sync.set({ [STORAGE_KEY]: value }, () => {
      showStatus("Saved ✓");
    });
  };

  saveBtn.addEventListener("click", save);
  // Cmd/Ctrl+Enter to save from within the textarea
  input.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  });
})();
