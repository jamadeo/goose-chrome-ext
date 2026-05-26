# Open in Goose — Chrome Extension

A small Chrome extension that lets you define **URL patterns → prompts**.
When the active page matches a pattern, a floating button appears in the
lower-right corner of the page. Clicking it opens the Goose desktop app via
the `goose://new-session?prompt=...` protocol, with your prompt template
filled in.

## Features

- 🪿 Floating button(s) in the lower-right of any matching page
- 🎯 Multiple patterns — each with its own button text and prompt
- 🧩 Placeholders: `<URL>` and numbered captures (`<1>`, `<2>`, …)
- ⚡ Reacts to SPA navigation (Turbo / `pushState`) and live-updates when you
  edit settings
- 🌗 Light/dark mode aware

## Install (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this directory.
4. Open the **Extension options** to configure your patterns (see below).

## Requirements

- The [Goose desktop app](https://block.github.io/goose/) must be installed
  and registered to handle the `goose://` protocol on your OS.

## Pattern & prompt syntax

Each entry has three fields:

| Field         | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| **Pattern**   | URL pattern. `https://` is auto-prepended if missing.          |
| **Button text** | The label shown on the floating button.                     |
| **Prompt**    | Multi-line template sent to Goose; supports placeholders.     |

### Pattern wildcards

- `*` — matches **one path segment** (no `/`)
- `**` — matches **any characters**, including `/`
- Patterns are matched against `scheme://host/pathname` only — query strings
  (`?foo=bar`) and hashes (`#x`) are ignored when matching.

### Prompt placeholders

- `<URL>` — the full canonical page URL (no query/hash)
- `<1>`, `<2>`, `<3>`, … — the values matched by each `*` / `**` in order

### Example

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Pattern       | `github.com/*/*/pull/*`                                                   |
| Button text   | `Open PR in goose`                                                        |
| Prompt        | `Review the PR at <URL>. The repo is <1>/<2> and the PR number is <3>.`  |

On the URL `https://github.com/foo/bar/pull/123/files`, clicking the button
opens:

```
goose://new-session?prompt=Review%20the%20PR%20at%20https%3A%2F%2Fgithub.com%2Ffoo%2Fbar%2Fpull%2F123.%20The%20repo%20is%20foo%2Fbar%20and%20the%20PR%20number%20is%20123.
```

## Editing settings

1. Go to `chrome://extensions`.
2. Find **Open in Goose** and click **Details**.
3. Click **Extension options** (opens in a new tab).
4. Add / edit / delete patterns. Press **Save** (or ⌘/Ctrl+S).
5. Open pages refresh their buttons live — no reload needed.

Settings sync across Chrome instances via `chrome.storage.sync`.

## File layout

```
goose-chrome-ext/
├── manifest.json
├── content.js          # Pattern matching + button rendering
├── content.css
├── options.html        # Settings UI
├── options.js
├── icons/
│   ├── goose.png       # Logo shown on the floating button
│   ├── icon16.png      # Extension chrome icons
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Permissions

The extension requests `<all_urls>` so it can evaluate your patterns against
any page you visit. It does not transmit your data anywhere — patterns are
stored locally via `chrome.storage.sync`, and clicks open a `goose://` URL
on your own machine.
