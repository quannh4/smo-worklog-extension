// ===== WORKLOG FUNCTIONALITY =====
let currentToken = null;
let currentUserId = null;
let selectedProject = null;
let projectsList = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listener to start button
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', showWorklogTool);
    }

    // Use event delegation for dynamically created buttons
    document.body.addEventListener('click', function(e) {
        const target = e.target;

        // Handle different button clicks
        if (target.id === 'continueTokenBtn') {
            continueWithToken();
        } else if (target.id === 'loadProjectsBtn') {
            loadProjectsWithDateRange();
        } else if (target.id === 'submitBtn') {
            submitWorklog();
        } else if (target.classList.contains('changeDatesBtn')) {
            showDateRangeSelector();
        } else if (target.classList.contains('updateTokenBtn')) {
            showTokenInput();
        } else if (target.classList.contains('retryLoadBtn')) {
            loadProjectsWithDateRange();
        }
    });

    // Handle select and input changes
    document.body.addEventListener('change', function(e) {
        const target = e.target;

        if (target.id === 'projectSelect') {
            onProjectSelected();
        } else if (target.id === 'workHours') {
            updateWorklogPreview();
        }
    });
});

async function showWorklogTool() {
    const worklogContainer = document.getElementById('worklogContainer');
    worklogContainer.style.display = 'block';

    // Try to extract token automatically first
    currentToken = await findAccessToken();

    // Show token input form
    showTokenInput();
}

function showTokenInput() {
    const worklogContainer = document.getElementById('worklogContainer');

    const tokenValue = currentToken ? currentToken.substring(0, 50) + '...' : '';
    const hasToken = currentToken !== null;

    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Worklog Tool</h3>

            <div style="background: ${hasToken ? '#e8f5e9' : '#e3f2fd'}; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${hasToken ? '#4CAF50' : '#2196F3'};">
                <h4 style="margin-top: 0; color: ${hasToken ? '#2E7D32' : '#1976D2'};">
                    ${hasToken ? '✅ Token Detected!' : '📡 How to Get Your Access Token:'}
                </h4>
                ${hasToken ? `
                    <p style="margin: 10px 0;">
                        Your access token has been automatically captured from your browsing session!
                    </p>
                    <p style="margin: 10px 0; font-size: 12px; color: #555;">
                        Token preview: <code style="background: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${tokenValue}</code>
                    </p>
                ` : `
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Open <a href="https://sra.smartosc.com" target="_blank" style="color: #1976D2;"><strong>https://sra.smartosc.com</strong></a> in a new tab</li>
                        <li>Login with your credentials</li>
                        <li>Return here - the token will be captured automatically!</li>
                    </ol>
                    <p style="margin: 10px 0; font-size: 13px;">
                        <strong>Alternative:</strong> You can also paste your token manually below.
                    </p>
                `}
            </div>

            <div class="form-group">
                <label>🔑 Access Token ${hasToken ? '(Auto-captured)' : '(Optional - Manual Entry)'}:</label>
                <textarea
                    id="tokenInput"
                    placeholder="Token will be captured automatically, or paste here manually..."
                    style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5;"
                >${currentToken || ''}</textarea>
                <small style="color: #666; display: block; margin-top: 5px;">
                    ${hasToken ? '✅ Token ready! Click Continue below.' : 'ℹ️ Visit SRA SmartOSC and login, or paste token manually.'}
                </small>
            </div>

            <div style="margin-top: 20px;">
                <button id="continueTokenBtn" class="success">
                    ▶️ Continue with Token
                </button>
            </div>
        </div>
    `;
}

async function continueWithToken() {
    let tokenInput = document.getElementById('tokenInput').value;

    // Clean up the token: remove extra spaces, newlines, and "Bearer" prefix
    tokenInput = tokenInput.trim().replace(/\s+/g, ' '); // Replace multiple spaces/newlines with single space
    tokenInput = tokenInput.replace(/\n/g, ''); // Remove any newlines

    // Remove "Bearer " prefix if present (case insensitive)
    if (tokenInput.toLowerCase().startsWith('bearer ')) {
        tokenInput = tokenInput.substring(7).trim();
    }

    if (!tokenInput) {
        alert('❌ Please paste your access token first!');
        return;
    }

    currentToken = tokenInput;

    // Save token to chrome storage for persistence
    await chrome.storage.local.set({ 'smo_token': currentToken });

    // Fetch user ID from the token
    await fetchCurrentUserId();

    // Show date range selector first
    showDateRangeSelector();
}

async function fetchCurrentUserId() {
    const worklogContainer = document.getElementById('worklogContainer');

    try {
        worklogContainer.innerHTML = `
            <div class="worklog-section">
                <h3>⏰ Worklog Tool</h3>
                <p style="margin: 10px 0;">✅ Token received! Fetching your user information...</p>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 24px;">⏳</div>
                </div>
            </div>
        `;

        const response = await fetch('https://sra-api.smartosc.com/api/users/current-user', {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status}`);
        }

        const userData = await response.json();
        currentUserId = userData.id;

        // Save user ID to chrome storage
        await chrome.storage.local.set({ 'smo_userId': currentUserId });

    } catch (error) {
        alert(`❌ Error fetching user information: ${error.message}\nPlease check if your token is valid.`);
        showTokenInput();
        throw error;
    }
}

function showDateRangeSelector() {
    const worklogContainer = document.getElementById('worklogContainer');

    // Set default dates (e.g., current week)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const startDateDefault = startOfWeek.toISOString().split('T')[0];
    const endDateDefault = today.toISOString().split('T')[0];

    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Worklog Tool</h3>
            <p style="margin: 10px 0;">✅ Token received!</p>

            <div class="form-group">
                <label>📅 Select Date Range:</label>
                <div class="date-inputs">
                    <div>
                        <label style="font-weight: normal; font-size: 12px;">Start Date:</label>
                        <input type="date" id="startDateInitial" value="${startDateDefault}" />
                    </div>
                    <div>
                        <label style="font-weight: normal; font-size: 12px;">End Date:</label>
                        <input type="date" id="endDateInitial" value="${endDateDefault}" />
                    </div>
                </div>
                <small style="color: #666; display: block; margin-top: 5px;">
                    ℹ️ We'll use this date range to fetch your available projects
                </small>
            </div>

            <div style="margin-top: 20px;">
                <button id="loadProjectsBtn" class="success">
                    ▶️ Load Projects
                </button>
            </div>
        </div>
    `;
}

async function loadProjectsWithDateRange() {
    const startDateInput = document.getElementById('startDateInitial').value;
    const endDateInput = document.getElementById('endDateInitial').value;

    if (!startDateInput || !endDateInput) {
        alert('❌ Please select both start and end dates!');
        return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (startDate > endDate) {
        alert('❌ Start date must be before or equal to end date!');
        return;
    }

    const worklogContainer = document.getElementById('worklogContainer');
    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Worklog Tool</h3>
            <p style="margin: 10px 0;">✅ Loading projects for ${startDateInput} to ${endDateInput}...</p>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Fetching your projects...</p>
            </div>
        </div>
    `;

    // Store the selected dates for later use
    window.selectedStartDate = startDateInput;
    window.selectedEndDate = endDateInput;

    // Fetch projects using the selected date
    await loadProjects();
}

async function findAccessToken() {
    // Try to get token and userId from chrome storage first
    const result = await chrome.storage.local.get(['smo_token', 'smo_userId']);
    if (result.smo_token) {
        currentUserId = result.smo_userId || null;
        return result.smo_token;
    }
    return null;
}

async function loadProjects() {
    const worklogContainer = document.getElementById('worklogContainer');

    try {
        // Use the selected start date to fetch projects
        const dateToUse = window.selectedStartDate || new Date().toISOString().split('T')[0];
        const response = await fetch(`https://sra-api.smartosc.com/api/projects/all?userId=${currentUserId}&date=${dateToUse}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        projectsList = await response.json();

        // If no projects are returned, add the default "Other" project with ID 0
        if (!projectsList || projectsList.length === 0) {
            projectsList = [
                {
                    id: 0,
                    name: 'Other',
                    code: 'OTHER'
                }
            ];
        }

        renderWorklogForm();

    } catch (error) {
        showProjectLoadError(error.message, true);
    }
}

function showProjectLoadError(errorMsg, showRetry) {
    const worklogContainer = document.getElementById('worklogContainer');
    const startDate = window.selectedStartDate || 'N/A';
    const endDate = window.selectedEndDate || 'N/A';

    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>❌ Error Loading Projects</h3>
            <p style="color: #f44336;"><strong>Error:</strong> ${errorMsg}</p>

            <div style="background: #fff3e0; padding: 12px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff9800;">
                <strong>Current Settings:</strong><br>
                📅 Date Range: ${startDate} to ${endDate}<br>
                🔑 Token: ${currentToken.substring(0, 20)}...
            </div>

            <p><strong>Possible solutions:</strong></p>
            <ul>
                <li>Check if your token is still valid (tokens expire after some time)</li>
                <li>Make sure you're logged in to <strong>https://sra.smartosc.com</strong></li>
                <li>Try selecting a different date range</li>
                <li>Get a fresh token from the Network tab</li>
            </ul>

            <div style="margin-top: 20px;">
                ${showRetry ? `
                    <button class="retryLoadBtn success">
                        🔄 Retry Loading Projects
                    </button>
                ` : ''}
                <button class="changeDatesBtn info">
                    📅 Change Date Range
                </button>
                <button class="updateTokenBtn info">
                    🔑 Update Token
                </button>
            </div>
        </div>
    `;
}

function renderWorklogForm() {
    const worklogContainer = document.getElementById('worklogContainer');

    const projectOptions = projectsList.map(p =>
        `<option value="${p.id}">${p.name} (${p.code})</option>`
    ).join('');

    const startDate = window.selectedStartDate || new Date().toISOString().split('T')[0];
    const endDate = window.selectedEndDate || new Date().toISOString().split('T')[0];

    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Log Your Work Hours</h3>

            <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
                <strong>📅 Selected Date Range:</strong> ${startDate} to ${endDate}
                <button class="changeDatesBtn info" style="font-size: 12px; padding: 5px 10px; margin-left: 10px;">
                    Change Dates
                </button>
            </div>

            <div class="form-group">
                <label>📁 Select Project:</label>
                <select id="projectSelect">
                    <option value="">-- Select a project --</option>
                    ${projectOptions}
                </select>
            </div>

            <div class="form-group">
                <label>⏱️ Work Hours per Day:</label>
                <input type="number" id="workHours" min="0.5" max="24" step="0.5" value="8" />
                <small style="color: #666; display: block; margin-top: 5px;">
                    ℹ️ Default is 8 hours. You can adjust this value (0.5 - 24 hours)
                </small>
            </div>

            <div id="worklogPreview"></div>

            <div style="margin-top: 20px;">
                <button id="submitBtn" disabled>
                    📤 Submit Worklog
                </button>
            </div>
        </div>
    `;
}

function onProjectSelected() {
    const projectId = document.getElementById('projectSelect').value;
    selectedProject = projectsList.find(p => p.id == projectId);
    updateWorklogPreview();
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function getWeekdaysBetween(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        if (!isWeekend(current)) {
            dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function updateWorklogPreview() {
    const preview = document.getElementById('worklogPreview');
    const submitBtn = document.getElementById('submitBtn');
    const workHoursInput = document.getElementById('workHours');

    if (!selectedProject) {
        preview.innerHTML = '';
        submitBtn.disabled = true;
        return;
    }

    const workHours = parseFloat(workHoursInput.value) || 8;

    if (workHours <= 0 || workHours > 24) {
        preview.innerHTML = `
            <div style="color: #f44336; padding: 10px; background: #ffebee; border-radius: 5px;">
                ⚠️ Work hours must be between 0.5 and 24 hours
            </div>
        `;
        submitBtn.disabled = true;
        return;
    }

    const startDate = new Date(window.selectedStartDate);
    const endDate = new Date(window.selectedEndDate);

    const weekdays = getWeekdaysBetween(startDate, endDate);

    if (weekdays.length === 0) {
        preview.innerHTML = `
            <div style="color: #ff9800; padding: 10px; background: #fff3e0; border-radius: 5px;">
                ⚠️ No weekdays found in this date range
            </div>
        `;
        submitBtn.disabled = true;
        return;
    }

    const dayItems = weekdays.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `
            <div class="day-item">
                <span>${dayName}, ${dateStr}</span>
                <span style="color: #4CAF50; font-weight: bold;">${workHours} hours</span>
            </div>
        `;
    }).join('');

    const totalHours = weekdays.length * workHours;

    preview.innerHTML = `
        <div class="worklog-summary">
            <h4 style="margin-top: 0;">📋 Worklog Preview</h4>
            <p><strong>Project:</strong> ${selectedProject.name} (${selectedProject.code})</p>
            <p><strong>Total Days:</strong> ${weekdays.length} weekdays</p>
            <p><strong>Total Hours:</strong> ${totalHours} hours</p>
            <div style="margin-top: 15px;">
                <strong>Days to log:</strong>
                ${dayItems}
            </div>
        </div>
    `;

    submitBtn.disabled = false;
}

async function submitWorklog() {
    const submitBtn = document.getElementById('submitBtn');
    const workHoursInput = document.getElementById('workHours');

    if (!selectedProject) {
        alert('❌ Please select a project');
        return;
    }

    const workHours = parseFloat(workHoursInput.value) || 8;

    if (workHours <= 0 || workHours > 24) {
        alert('❌ Work hours must be between 0.5 and 24 hours');
        return;
    }

    const startDate = new Date(window.selectedStartDate);
    const endDate = new Date(window.selectedEndDate);
    const weekdays = getWeekdaysBetween(startDate, endDate);

    // Generate workLogs payload
    const workLogs = weekdays.map(date => ({
        date: date.toISOString().split('T')[0],
        description: null,
        workHours: workHours,
        typeOfWork: 6,
        projectId: selectedProject.id
    }));

    const payload = { workLogs };

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Submitting...';

    try {
        const response = await fetch('https://sra-api.smartosc.com/api/user/worklogs', {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'authorization': `Bearer ${currentToken}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to submit worklog: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Show success message
        const totalHours = weekdays.length * workHours;
        document.getElementById('worklogPreview').innerHTML = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4 style="margin-top: 0;">✅ Worklog Submitted Successfully!</h4>
                <p>Logged ${weekdays.length} days (${totalHours} hours) for project: <strong>${selectedProject.name}</strong></p>
                <pre style="background: #fff; color: #333; padding: 10px; margin-top: 10px;">${JSON.stringify(result, null, 2)}</pre>
            </div>
        `;

        submitBtn.innerHTML = '✅ Submitted!';
        setTimeout(() => {
            submitBtn.innerHTML = '📤 Submit Worklog';
            submitBtn.disabled = false;
        }, 3000);

    } catch (error) {
        alert(`❌ Error: ${error.message}`);
        submitBtn.innerHTML = '📤 Submit Worklog';
        submitBtn.disabled = false;
    }
}
