# SMO Worklog Tool — Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)

Chrome extension for [SRA SmartOSC](https://sra.smartosc.com): worklog submission (manual and auto from allocations), optional **user rates** summary after login, and **Add Resource** flows including crew history and bulk rebooking via quick booking.

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Requirements

- **Google Chrome** (or another Chromium browser that supports unpacked MV3 extensions)
- An **SRA SmartOSC** account and normal login in the browser

There is **no Node/npm build**: the extension is plain HTML/CSS/JS loaded from the folder that contains `manifest.json`.

---

## Install (load unpacked)

1. Clone or copy this repository.
2. Open `chrome://extensions/`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the **repository root** (the directory containing `manifest.json`).
5. Pin the extension from the puzzle menu if you want the toolbar icon.

### Icons (optional)

Source SVG: `icons/icon.svg`. To regenerate PNGs with ImageMagick:

```bash
cd icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

---

## Usage

### First-time token

1. Log in to **https://sra.smartosc.com** (and use the app as usual) so requests include an `Authorization` header.
2. Open the extension popup and choose **Start Logging Work** or **Start Add Resource**.

The **background service worker** listens to requests to SRA and the API, strips the `Bearer` prefix, and stores the token. You can still paste a token manually if needed.

### Worklog — Manual

1. **Start Logging Work** → token step if required.
2. **Manual Input** → pick date range → **Load projects**.
3. Choose project, set hours per day, mark leave days, preview, **Submit**.

Weekdays only; weekends are excluded from generated days. Leave days are unchecked checkboxes.

### Worklog — Auto

1. **Start Logging Work** → **Auto**.
2. Range is **start of current calendar month** through **today**.
3. The extension calls `timesheet-overview`, builds missing hours from **allocated vs logged** data (skips weekends and holidays from the API payload), resolves **project IDs per date** (fetches projects for every distinct date in the draft — not only the range start — and matches codes case-insensitively when needed), then shows an editable checklist before submit.

### Add Resource (rebook)

1. **Start Add Resource** → browse/search projects → open a project for crew history.
2. Select members (recent vs older lists in the UI), set dates and hours, submit **quick booking** to the API.

---

## Permissions and data

| Manifest capability | Purpose |
|---------------------|---------|
| `storage` | Persist token, user id, username, captured-at timestamp, and related fields locally |
| `webRequest` + `onBeforeSendHeaders` | Read `Authorization` on SRA/API requests to capture the bearer token |
| Host permissions `https://sra.smartosc.com/*`, `https://sra-api.smartosc.com/*` | Login site + REST API used by popup and background |

**Privacy:** tokens and user fields stay in **`chrome.storage.local`** on your machine. Nothing is sent to third-party servers beyond SmartOSC’s own hosts.

### Stored keys (for debugging)

Includes but is not limited to: `smo_token`, `token_captured_at`, `smo_userId`, `smo_username`, and fields written by the background script from `/api/users/current-user` (e.g. display name / email). Inspect in DevTools → Application → Extension storage.

---

## Development

1. Edit files in this repo.
2. On `chrome://extensions/`, click **Reload** on the extension.
3. For the popup: right-click inside the popup → **Inspect** to see console logs.

There is no bundler: changes are picked up on reload.

### Adding a screen

1. Add or edit a file under `templates/`.
2. Load it with `loadTemplate('name')` (see `templateLoader.js`).
3. Add any API helpers in `api/api.js` and rendering in `ui/renderers.js`.
4. Wire events from `popup.js`.

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Token never appears | Log in on `sra.smartosc.com`, trigger an API call, reload the extension, or paste the token manually. |
| “User” / project errors | Token may have expired; update token or log in again. |
| Auto mode empty | Often means allocations already match worklogs for the range; confirm allocations in SRA for the current month. |
| Wrong project in auto rows | Extension maps by project **code** per day; if code is missing from `/projects/all` for that date, the row may fall back to **Other** (`projectId` 0). |
| Quick booking fails | Check popup DevTools console for logged payload/status; verify dates are valid weekdays and hours within allowed range. |

---

## Version history

### 1.0.0 (manifest)

- MV3 service worker token capture and user prefetch on token change.
- Manual and auto worklog flows with timesheet-based gap filling.
- Per-date project lookup for auto-generated rows and case-insensitive code match.
- User rates summary (allocation / utilization / work log) when user info loads.
- Add Resource: project list, crew views, quick booking submission.
- Template-based popup UI and glass-style layout.

---

## License

[MIT](LICENSE) — Copyright (c) 2025 SMO Worklog Extension Contributors.

---

## Support

1. Use the troubleshooting table above.
2. Search existing GitHub issues.
3. Open a new issue with steps to reproduce and Chrome version.

Built for SmartOSC developers using SRA.
