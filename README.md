# SMO Worklog Tool - Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A browser extension to easily log your work hours to SRA SmartOSC.

> **Open Source Project** - Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Features

- ✅ Extract access token from SRA login
- ✅ Select date range and automatically filter weekends
- ✅ Fetch available projects
- ✅ Customize work hours per day
- ✅ Bulk submit worklogs
- ✅ Token persistence (saved in browser storage)

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked**
5. Select the `smo-worklog-extension` folder
6. The extension icon should appear in your toolbar!

### Method 2: Create PNG Icons (Optional)

The extension currently uses an SVG icon. To create proper PNG icons:

**Option A: Using online converter**
1. Open `icons/icon.svg` in a browser
2. Take screenshots at different sizes or use an online SVG to PNG converter
3. Create the following files:
   - `icons/icon16.png` (16x16)
   - `icons/icon32.png` (32x32)
   - `icons/icon48.png` (48x48)
   - `icons/icon128.png` (128x128)

**Option B: Using ImageMagick (if installed)**
```bash
cd smo-worklog-extension/icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

**Option C: Temporary workaround**
You can temporarily use any PNG images (just rename them to match the required filenames above).

## Usage

1. **Click the extension icon** in your browser toolbar
2. **Click "Start Logging Work"**
3. **Get your access token:**
   - Open https://sra.smartosc.com in a new tab
   - Press F12 to open Developer Tools
   - Go to Network tab
   - Login with Google
   - Find the `auth/google` request
   - Copy the `access_token` from the Response tab
4. **Paste the token** in the extension
5. **Select date range** (defaults to current week)
6. **Choose your project** from the dropdown
7. **Adjust work hours** if needed (default: 8 hours/day)
8. **Review and submit** your worklog

## Features Details

### Token Management
- Token is saved in browser storage
- Persists across browser sessions
- Auto-cleaned (removes "Bearer" prefix, extra spaces, newlines)

### Date Selection
- Default to current week (Monday to today)
- Automatically filters out weekends
- Fetch projects based on selected date range

### Work Hours
- Customizable per-day hours (0.5 - 24 hours)
- Supports half-hour increments
- Real-time preview of total hours

### Error Handling
- Token preserved on errors
- Retry without re-entering token
- Multiple recovery options (retry, change dates, update token)

## Project Structure

```
smo-worklog-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Styles
├── popup.js              # Main functionality
├── icons/                # Extension icons
│   ├── icon.svg         # Source SVG icon
│   ├── icon16.png       # 16x16 icon
│   ├── icon32.png       # 32x32 icon
│   ├── icon48.png       # 48x48 icon
│   └── icon128.png      # 128x128 icon
└── README.md            # This file
```

## Permissions

The extension requires the following permissions:

- `storage`: To save your access token locally
- `https://sra.smartosc.com/*`: To access SRA website
- `https://sra-api.smartosc.com/*`: To make API calls for projects and worklogs

## Development

To modify the extension:

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the **Reload** button under the extension

## Troubleshooting

### Extension not loading
- Make sure all files are in the correct directory
- Check that manifest.json is valid
- Ensure Developer mode is enabled

### Token not working
- Token may have expired - get a fresh one
- Make sure you copied the `access_token` value only (not the entire JSON)
- Check that "Bearer" prefix is removed

### Projects not loading
- Verify you're logged in to SRA
- Check the date range is valid
- Make sure your token hasn't expired

### Can't submit worklog
- Ensure you selected a project
- Verify work hours are between 0.5-24
- Check that date range contains weekdays

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to:
- Fork and clone the repository
- Create feature branches
- Submit pull requests
- Report bugs and suggest features

## Version

1.0.0 - Initial release

## License

MIT License - see [LICENSE](LICENSE) file for details.

This project is open source and free to use, modify, and distribute.
