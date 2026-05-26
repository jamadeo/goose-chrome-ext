# Open GitHub PR in Goose — Chrome Extension

A small Chrome extension that adds a hovering button to the upper-right of any GitHub Pull Request page. Clicking it opens the Goose desktop app via the `goose://new-session` protocol.

## Features

- 🪿 Floating goose button in the upper-right corner
- 🎯 Only appears on GitHub PR pages (`github.com/<org>/<repo>/pull/<number>`)
- ⚡ Reacts to GitHub's SPA navigation (Turbo / `pushState`) so it appears and disappears as you navigate
- 🌗 Light/dark mode aware

## Install (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this directory: `goose-chrome-ext`.
4. Visit any GitHub PR, e.g. `https://github.com/your-org/your-repo/pull/123` — you should see a floating goose button in the upper-right.

## Settings

The extension exposes one setting:

- **Prompt** — a multi-line prompt template sent to Goose when opening a PR.
  Use the literal placeholder `<PR LINK>` anywhere in the prompt; it will be
  replaced with the canonical PR URL (e.g. `https://github.com/foo/bar/pull/123`)
  before the link is opened. The final prompt is URL-encoded and appended to
  the Goose link as `?prompt=...`, e.g.:

  ```
  goose://new-session?prompt=Review%20the%20PR%20at%20https%3A%2F%2Fgithub.com%2Ffoo%2Fbar%2Fpull%2F123%20and%20summarize%20the%20changes.
  ```

  If the prompt is empty, the button opens a plain `goose://new-session`.

To edit:

1. Go to `chrome://extensions`.
2. Find **Open GitHub PR in Goose** and click **Details**.
3. Click **Extension options**.
4. Enter your prompt and click **Save** (or press ⌘/Ctrl+Enter inside the textarea). Settings sync across Chrome instances via `chrome.storage.sync`.

## Requirements

- The [Goose desktop app](https://block.github.io/goose/) must be installed and registered to handle the `goose://` protocol on your OS.

## How it works

- `manifest.json` — Manifest V3, registers the content script for all of `github.com`.
- `content.js` — Tests the current URL against `^https://github\.com/[^/]+/[^/]+/pull/\d+` and injects/removes a floating button accordingly. It hooks `history.pushState` / `replaceState` and listens for `turbo:load` to handle GitHub's SPA navigation.
- `content.css` — Styles the floating button.
- `icons/` — Goose logo (SVG + PNGs for the extension chrome).

## File layout

```
goose-chrome-ext/
├── manifest.json
├── content.js
├── content.css
├── options.html
├── options.js
├── icons/
│   ├── goose.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Customizing

- Change the button position by editing `#goose-pr-button` in `content.css` (`top` / `right`).
- Change the URL opened on click in `content.js` (search for `goose://new-session`).
