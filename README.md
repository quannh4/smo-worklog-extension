# SMO Worklog Tool - Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](manifest.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A powerful browser extension for managing work hours and resources on SRA SmartOSC. Features automatic token capture, smart worklog generation, and crew member rebooking capabilities.

> **Open Source Project** - Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🌟 Key Features

### 📋 Worklog Management
- **Automatic Token Capture** - No manual token extraction needed
- **Two Logging Modes:**
  - **Manual Mode** - Select date range and project manually
  - **Auto Mode** - Smart generation based on allocated hours
- **Intelligent Date Handling** - Automatic weekend filtering
- **Flexible Hours** - 0.5 to 24 hours per day in 0.5-hour increments
- **Bulk Submission** - Submit multiple days at once
- **Real-time Preview** - See total hours before submitting

### 👥 Resource Management
- **Browse Active Projects** - Filter and search through projects
- **View Crew History** - See recent and historical crew members
- **Smart Member Filtering** - Recent members (last month) vs older members
- **Bulk Rebooking** - Rebook multiple team members at once
- **Automatic Weekend Adjustment** - Prevents weekend booking errors
- **Role Preservation** - Maintains project roles during rebooking

### 🎨 Modern UI
- **Liquid Glass Design** - Beautiful glassmorphism interface
- **Responsive Layout** - Works on various screen sizes
- **Real-time Feedback** - Loading states and notifications
- **Error Recovery** - Helpful error messages with retry options

---

## 📦 Installation

### Method 1: Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome/Chromium browser
3. Navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right corner)
5. Click **Load unpacked**
6. Select the `smo-worklog-extension` folder
7. The extension icon should appear in your toolbar!

### Method 2: Icon Setup (Optional)

The extension includes PNG icons. If you need to regenerate them from the SVG source:

**Using ImageMagick:**
```bash
cd smo-worklog-extension/icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

---

## 🚀 Usage Guide

### Worklog Logging

#### Getting Started
1. **Click the extension icon** in your browser toolbar
2. **Click "Start Logging Work"**
3. **Token Auto-Capture:**
   - The extension will automatically capture your token if you're logged in
   - Alternative: Open https://sra.smartosc.com and login
   - The token is captured automatically from your session

#### Manual Mode
Perfect for logging specific date ranges:

1. Click **"Manual Input"**
2. **Select date range** (defaults to current week)
3. **Load projects** - Projects for your selected dates will load
4. **Choose your project** from the dropdown
5. **Set work hours** (default: 8 hours/day)
6. **Uncheck any leave days** (e.g., sick days, holidays)
7. **Review preview** - Check total days and hours
8. **Submit** - Bulk submit all worklogs at once

#### Auto Mode
Smart worklog generation from allocated hours:

1. Click **"Auto"**
2. **Automatic date range** - Start of current month to today
3. **Smart generation:**
   - Reads your allocated hours from SRA
   - Compares with existing worklogs
   - Generates missing entries automatically
4. **Review generated worklogs:**
   - Each day shows project and hours
   - Adjust hours if needed
   - Uncheck days to skip
5. **Submit** - All checked worklogs submitted

### Resource Management (Add Resource)

#### Viewing Crew Members
1. **Click "Start Add Resource"**
2. **Browse projects** - All active projects displayed
3. **Search projects** - Filter by name or code
4. **Click a project** - View crew member history

#### Understanding Member Lists
- **Recent Members (Last Month)** - Members whose work ended within the last month (auto-selected)
- **Other Members** - Older crew members (unselected by default)
- **Search functionality** - Filter members by username

#### Rebooking Members
1. **Select members** - Check the members you want to rebook
2. **Click "Rebook Selected Members"**
3. **Review member details:**
   - Username, name, and title displayed
   - Default hours from previous booking
4. **Set date range:**
   - Dates default to current month
   - Weekend dates automatically adjusted
5. **Adjust hours** - Modify hours per day for each member
6. **Submit rebook** - Confirmation shows before submitting

---

## 🏗️ Project Structure

```
smo-worklog-extension/
├── manifest.json              # Extension configuration
├── popup.html                 # Main popup UI
├── popup.css                  # Glassmorphism styles
├── popup.js                   # Main orchestration & event handling
├── background.js              # Service worker for token capture
│
├── api/
│   └── api.js                 # API calls to SRA endpoints
│
├── ui/
│   └── renderers.js           # UI rendering functions
│
├── utils/
│   ├── dateUtils.js           # Date manipulation utilities
│   ├── tokenManager.js        # Token extraction & management
│   └── templateLoader.js      # HTML template loading
│
├── worklog/
│   └── worklogGenerator.js    # Auto worklog generation logic
│
├── templates/                 # HTML templates
│   ├── token-input.html
│   ├── mode-selection.html
│   ├── date-range-selector.html
│   ├── loading-projects.html
│   ├── project-load-error.html
│   ├── worklog-form.html
│   ├── worklog-auto-form.html
│   ├── worklog-preview.html
│   ├── worklog-success.html
│   ├── projects-list.html
│   ├── crew-members.html
│   ├── rebook-view.html
│   ├── rebook-success.html
│   ├── rebook-error.html
│   ├── error-invalid-hours.html
│   ├── error-no-weekdays.html
│   └── loading-user-info.html
│
├── icons/                     # Extension icons
│   ├── icon.svg               # Source SVG
│   ├── icon16.png             # 16x16 icon
│   ├── icon32.png             # 32x32 icon
│   ├── icon48.png             # 48x48 icon
│   └── icon128.png            # 128x128 icon
│
└── README.md                  # This file
```

---

## 🔑 Permissions

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save access token locally for persistence |
| `webRequest` | Intercept network requests to capture authentication token |
| `https://sra.smartosc.com/*` | Access to SRA website for authentication |
| `https://sra-api.smartosc.com/*` | API calls for projects, worklogs, and crew management |

**Privacy Note:** Your token is stored locally in your browser and never sent to any third-party servers.

---

## 🎯 Feature Details

### Token Management
- **Automatic Capture** - Extracts token from SRA login automatically
- **Manual Entry** - Fallback option for manual token paste
- **Auto-cleanup** - Removes "Bearer" prefix, extra spaces, and newlines
- **Persistence** - Token saved in browser storage across sessions
- **Security** - Token stored locally, never transmitted elsewhere

### Smart Date Handling
- **Weekend Filtering** - Automatically excludes Saturdays and Sundays
- **Weekend Adjustment** - When selecting weekend dates:
  - Start dates (Sat/Sun) → Next Monday
  - End dates (Sat/Sun) → Previous Friday
- **Holiday Aware** - Auto mode skips holidays from SRA data
- **Flexible Ranges** - Select any custom date range

### Auto Worklog Generation
The Auto mode intelligently generates worklogs by:

1. **Reading Allocated Hours** - Fetches your resource allocation from SRA
2. **Checking Existing Logs** - Compares with already submitted worklogs
3. **Gap Detection** - Identifies missing or incomplete entries
4. **Smart Generation:**
   - No worklogs → Generates all allocated entries
   - Partial worklogs → Generates only missing hours
   - Complete worklogs → Skips that day

### Resource Rebooking
- **Project Roles Preservation** - Maintains member roles across bookings
- **Bulk Operations** - Rebook multiple members simultaneously
- **Flexible Hours** - Customize hours per day for each member
- **Smart Defaults** - Pre-fills hours from previous bookings
- **Validation** - Prevents invalid dates and configurations

### Error Handling & Recovery
- **User-Friendly Messages** - Clear error descriptions
- **Multiple Recovery Options:**
  - Retry current operation
  - Change dates
  - Update token
  - Go back to previous step
- **Token Preservation** - Errors don't lose your token
- **State Management** - Can resume from any point

---

## 🛠️ Development

### Making Changes

1. Edit the relevant files in your local copy
2. Go to `chrome://extensions/`
3. Click the **Reload** button under the SMO Worklog Tool extension
4. Test your changes

### Code Organization

- **`popup.js`** - Main event handling and flow orchestration
- **`api/api.js`** - All API calls (projects, worklogs, crew, rebooking)
- **`ui/renderers.js`** - UI rendering and template population
- **`utils/`** - Reusable utility functions
- **`worklog/`** - Business logic for worklog generation
- **`templates/`** - HTML templates for different views

### Adding New Features

1. Create template in `templates/` if needed
2. Add API functions in `api/api.js` if needed
3. Add rendering function in `ui/renderers.js`
4. Wire up events in `popup.js`
5. Test thoroughly before committing

---

## 🐛 Troubleshooting

### Extension Issues

**Extension not loading**
- Ensure all files are in the correct directory
- Check that `manifest.json` is valid JSON
- Verify Developer mode is enabled in `chrome://extensions/`
- Check browser console for errors (F12)

**Extension icon not appearing**
- Make sure icon PNG files exist in `icons/` folder
- Reload the extension
- Try reinstalling the extension

### Token Issues

**Token not auto-captured**
- Make sure you're logged in to https://sra.smartosc.com
- Try logging out and logging in again
- Use manual token entry as fallback
- Check browser console for capture errors

**Token expired / not working**
- Token may have expired (typically after a few hours)
- Click "Update Token" button to get a fresh one
- Or reload the extension and login to SRA again

**"Bearer" token error**
- The extension auto-removes "Bearer" prefix
- If manually pasting, paste only the token value
- Example: `eyJhbGc...` not `Bearer eyJhbGc...`

### Worklog Issues

**Projects not loading**
- Verify you're logged in to SRA
- Check the date range is valid (has weekdays)
- Ensure token hasn't expired
- Try changing date range and retrying

**Can't submit worklog**
- Ensure you selected a project
- Verify work hours are between 0.5-24
- Check that at least one weekday is selected
- Make sure dates are not on weekends

**Auto mode not generating worklogs**
- Check that you have allocated hours in SRA for the date range
- Verify the project codes match your allocations
- Some days may be skipped if already logged

### Resource Management Issues

**Projects not showing**
- Only active (non-closed) projects are shown
- Use the search to filter projects
- Try clicking "Load More" if available

**No recent members showing**
- "Recent members" are those whose work ended within last month
- Members may all be in "Other Members" if bookings are older
- Use the search box to find specific members

**Rebook failing**
- Ensure all selected members have valid project roles
- Check that date range has no weekends
- Verify hours are between 0.5-24 for each member
- Weekend dates should auto-adjust (check notifications)

**Weekend date errors**
- Extension automatically adjusts weekend dates
- If you see "start_date or end_date must not be weekend" error:
  - This shouldn't happen with latest version
  - Try selecting weekday dates manually
  - Check browser console for validation errors

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs
1. Check existing issues first
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Browser and extension version

### Suggesting Features
1. Open an issue with the "enhancement" label
2. Describe the feature and its use case
3. Explain why it would be valuable

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📝 Version History

### Version 1.0.0 (Current)
- ✅ Automatic token capture from browsing session
- ✅ Manual and Auto worklog modes
- ✅ Smart worklog generation from allocated hours
- ✅ Resource management and crew rebooking
- ✅ Automatic weekend filtering and adjustment
- ✅ Bulk worklog submission
- ✅ Modern glassmorphism UI
- ✅ Comprehensive error handling
- ✅ Token persistence
- ✅ Real-time preview and validation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is open source and free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- Built for the SmartOSC development community
- Inspired by the need for streamlined worklog management
- UI design influenced by modern glassmorphism trends

---

## 📞 Support

Having issues or questions?

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new) if needed

---

**Made with ❤️ for SmartOSC developers**
