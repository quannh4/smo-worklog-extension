// ===== WORKLOG FUNCTIONALITY =====
let currentToken = null;
let currentUserId = null;
let selectedProject = null;
let projectsList = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Attach event listener to start button
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', showWorklogTool);
    }

    // Use event delegation for dynamically created buttons
    document.body.addEventListener('click', function (e) {
        const target = e.target;

        // Handle different button clicks
        if (target.id === 'continueTokenBtn') {
            continueWithToken();
        } else if (target.id === 'getNewTokenBtn') {
            // Open SRA SmartOSC login page
            window.open('https://sra.smartosc.com/login', '_blank');
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
    document.body.addEventListener('change', function (e) {
        const target = e.target;

        if (target.id === 'projectSelect') {
            onProjectSelected();
        } else if (target.id === 'workHours') {
            updateWorklogPreview();
        }
    });
});

async function showWorklogTool() {
    const container = document.querySelector('.container');
    const worklogContainer = document.getElementById('worklogContainer');
    const initialContent = document.getElementById('initialContent');
    
    // Xóa hoàn toàn nội dung ban đầu khỏi DOM để không hiện qua backdrop-filter
    if (initialContent) {
        initialContent.remove();
    }

    // Show worklog container và đảm bảo nó che phủ toàn bộ container
    worklogContainer.style.display = 'block';

    // Show loading state while checking token
    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Worklog Tool</h3>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Checking for valid token...</p>
            </div>
        </div>
    `;

    // Try to extract token automatically first
    currentToken = await findAccessToken();

    // Show token input form
    await showTokenInput();
}

async function showTokenInput() {
    const worklogContainer = document.getElementById('worklogContainer');

    const tokenValue = currentToken ? currentToken.substring(0, 50) + '...' : '';
    const hasToken = currentToken !== null;
    
    // If we have a token, check if it's still valid
    let isTokenValid = true;
    let tokenValidationComplete = false;
    if (hasToken) {
        isTokenValid = await validateToken(currentToken);
        tokenValidationComplete = true;
    }

    // Try to get user email from storage
    let userEmail = '';
    try {
        const result = await chrome.storage.local.get(['smo_userEmail']);
        userEmail = result.smo_userEmail || '';
    } catch (e) {
        console.log('Could not retrieve user email');
    }

    // Button text - always try to use user email, fallback to "Token" only if completely unavailable
    const buttonText = userEmail ? `Continue as ${userEmail}` : 'Continue with Token';

    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>Worklog Tool</h3>

            <div style="background: ${hasToken ? 'rgba(232, 245, 233, 0.25)' : 'rgba(227, 242, 253, 0.25)'}; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 4px solid ${hasToken ? 'rgba(76, 175, 80, 0.6)' : 'rgba(33, 150, 243, 0.6)'}; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);">
                <h4 style="margin-top: 0; color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);">
                    ${hasToken ? 'Token Detected!' : 'How to Get Your Access Token:'}
                </h4>
                ${hasToken ? `
                    <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                        Your access token has been automatically captured from your browsing session!
                    </p>
                    <p style="margin: 10px 0; font-size: 12px; color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                        Token preview: <code style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(5px); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.1);">${tokenValue}</code>
                    </p>
                ` : `
                    <ol style="margin: 10px 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                        <li>Open <a href="https://sra.smartosc.com" target="_blank" style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"><strong>https://sra.smartosc.com</strong></a> in a new tab</li>
                        <li>Login with your credentials</li>
                        <li>Return here - the token will be captured automatically!</li>
                    </ol>
                    <p style="margin: 10px 0; font-size: 13px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                        <strong>Alternative:</strong> You can also paste your token manually below.
                    </p>
                `}
            </div>

            <div class="form-group">
                <label>Access Token ${hasToken ? '(Auto-captured)' : '(Optional - Manual Entry)'}:</label>
                <textarea
                    id="tokenInput"
                    placeholder="${hasToken && !isTokenValid ? 'Token has expired! Please enter a new token.' : 'Token will be captured automatically, or paste here manually...'}"
                    style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; ${hasToken && !isTokenValid ? 'border: 2px solid #f44336;' : ''}"
                >${currentToken || ''}</textarea>
                <small style="color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); display: block; margin-top: 5px;">
                    ${hasToken ? 'Token ready! Click Continue below.' : 'Visit SRA SmartOSC and login, or paste token manually.'}
                </small>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button id="continueTokenBtn" class="success">
                    Continue with Token
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
        alert('Please paste your access token first!');
        return;
    }

    // Show loading state while validating token
    const worklogContainer = document.getElementById('worklogContainer');
    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>⏰ Worklog Tool</h3>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Validating token...</p>
            </div>
        </div>
    `;

    // Validate token before proceeding
    const isValid = await validateToken(tokenInput);
    if (!isValid) {
        alert('❌ Invalid or expired token! Please get a new token from SRA SmartOSC.');
        currentToken = tokenInput; // Still store the token so user can see it
        showTokenInput();
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
                <h3>Worklog Tool</h3>
                <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Token received! Fetching your user information...</p>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 24px; filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));">Loading...</div>
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
            // If token is invalid (401 or 403), notify user but don't clear it from storage
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token is invalid or expired. Please get a new token from SRA SmartOSC.');
            }
            const errorText = await response.text();
            throw new Error(`Failed to fetch user info: ${response.status} - ${errorText}`);
        }

        // Check if response has content before parsing JSON
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response received from server');
        }

        const userData = JSON.parse(responseText);
        currentUserId = userData.id;

        // Save user ID to chrome storage
        await chrome.storage.local.set({ 'smo_userId': currentUserId });

    } catch (error) {
        alert(`Error fetching user information: ${error.message}\nPlease check if your token is valid.`);
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
            <h3>Worklog Tool</h3>
            <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Token received!</p>

            <div class="form-group">
                <label>Select Date Range:</label>
                <div class="date-inputs">
                    <div>
                        <label style="font-weight: normal; font-size: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Start Date:</label>
                        <input type="date" id="startDateInitial" value="${startDateDefault}" />
                    </div>
                    <div>
                        <label style="font-weight: normal; font-size: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">End Date:</label>
                        <input type="date" id="endDateInitial" value="${endDateDefault}" />
                    </div>
                </div>
                <small style="color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); display: block; margin-top: 5px;">
                    We'll use this date range to fetch your available projects
                </small>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button id="loadProjectsBtn" class="success">
                    Load Projects
                </button>
            </div>
        </div>
    `;
}

async function loadProjectsWithDateRange() {
    const startDateInput = document.getElementById('startDateInitial').value;
    const endDateInput = document.getElementById('endDateInitial').value;

    if (!startDateInput || !endDateInput) {
        alert('Please select both start and end dates!');
        return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (startDate > endDate) {
        alert('Start date must be before or equal to end date!');
        return;
    }

    const worklogContainer = document.getElementById('worklogContainer');
    worklogContainer.innerHTML = `
        <div class="worklog-section">
            <h3>Worklog Tool</h3>
            <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Loading projects for ${startDateInput} to ${endDateInput}...</p>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px; filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));">Loading...</div>
                <p style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Fetching your projects...</p>
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
    const result = await chrome.storage.local.get(['smo_token', 'smo_userId', 'token_captured_at']);
    if (result.smo_token) {
        currentUserId = result.smo_userId || null;
        return result.smo_token;
    }
    return null;
}

async function validateToken(token) {
    try {
        const response = await fetch('https://sra-api.smartosc.com/api/users/current-user', {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'authorization': `Bearer ${token}`
            }
        });
        
        // If we get a successful response, token is valid
        return response.ok;
    } catch (error) {
        // If there's an error (network issue, etc.), assume token is invalid
        return false;
    }
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
            // If token is invalid (401 or 403), notify user but don't clear it from storage
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token is invalid or expired. Please get a new token from SRA SmartOSC.');
            }
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        // Check if response has content before parsing JSON
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response received from server');
        }

        projectsList = JSON.parse(responseText);

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
            <h3>Error Loading Projects</h3>
            <p style="color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);"><strong>Error:</strong> ${errorMsg}</p>

            <div style="background: rgba(255, 243, 224, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 12px; border-radius: 12px; margin: 15px 0; border-left: 4px solid rgba(255, 152, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);">
                <strong style="color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Current Settings:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Date Range: ${startDate} to ${endDate}<br>
                Token: ${currentToken.substring(0, 20)}...</span>
            </div>

            <p style="color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);"><strong>Possible solutions:</strong></p>
            <ul style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                <li>Check if your token is still valid (tokens expire after some time)</li>
                <li>Make sure you're logged in to <strong>https://sra.smartosc.com</strong></li>
                <li>Try selecting a different date range</li>
                <li>Get a fresh token from the Network tab</li>
            </ul>

            <div style="margin-top: 20px; text-align: center;">
                ${showRetry ? `
                    <button class="retryLoadBtn success">
                        Retry Loading Projects
                    </button>
                ` : ''}
                <button class="changeDatesBtn info">
                    Change Date Range
                </button>
                <button class="updateTokenBtn info">
                    Update Token
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
            <h3>Log Your Work Hours</h3>

            <div style="background: rgba(232, 245, 233, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 12px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid rgba(76, 175, 80, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);">
                <strong style="color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Selected Date Range:</strong> <span style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${startDate} to ${endDate}</span>
                <button class="changeDatesBtn info" style="font-size: 12px; padding: 5px 10px; margin-left: 10px;">
                    Change Dates
                </button>
            </div>

            <div class="form-group">
                <label>Select Project:</label>
                <select id="projectSelect">
                    <option value="">-- Select a project --</option>
                    ${projectOptions}
                </select>
            </div>

            <div class="form-group">
                <label>Work Hours per Day:</label>
                <input type="number" id="workHours" min="0.5" max="24" step="0.5" value="8" />
                <small style="color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); display: block; margin-top: 5px;">
                    Default is 8 hours. You can adjust this value (0.5 - 24 hours)
                </small>
            </div>

            <div id="worklogPreview"></div>

            <div style="margin-top: 20px; text-align: center;">
                <button id="submitBtn" disabled>
                    Submit Worklog
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
            <div style="color: rgba(255, 255, 255, 0.95); padding: 10px; background: rgba(255, 235, 238, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                Work hours must be between 0.5 and 24 hours
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
            <div style="color: rgba(255, 255, 255, 0.95); padding: 10px; background: rgba(255, 243, 224, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                No weekdays found in this date range
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
                <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                    <input type="checkbox" 
                           class="leave-checkbox" 
                           data-date="${dateStr}" 
                           checked
                           style="margin-right: 10px; cursor: pointer; width: 18px; height: 18px;" />
                    <span style="flex: 1; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${dayName}, ${dateStr}</span>
                    <span style="color: rgba(255, 255, 255, 0.95); font-weight: bold; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${workHours} hours</span>
                </label>
            </div>
        `;
    }).join('');

    // Calculate initial totals (all working days)
    const totalHours = weekdays.length * workHours;

    preview.innerHTML = `
        <div class="worklog-summary">
            <h4 style="margin-top: 0;">Worklog Preview</h4>
            <p><strong>Project:</strong> ${selectedProject.name} (${selectedProject.code})</p>
            <div style="background: rgba(255, 243, 224, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 10px; border-radius: 12px; margin: 10px 0; border-left: 3px solid rgba(255, 152, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);">
                <p style="margin: 5px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
                    <strong>Tip:</strong> All days are selected by default. Uncheck the boxes for days you're on leave (no work will be logged for those days)
                </p>
            </div>
            <p><strong>Total Days:</strong> <span id="workingDaysCount">${weekdays.length}</span> weekdays</p>
            <p><strong>Total Hours:</strong> <span id="totalHoursCount">${totalHours}</span> hours</p>
            <div style="margin-top: 15px;">
                <strong>Days to log:</strong>
                ${dayItems}
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    const checkboxes = preview.querySelectorAll('.leave-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotals);
    });

    submitBtn.disabled = false;
}

function updateTotals() {
    const workHoursInput = document.getElementById('workHours');
    const workHours = parseFloat(workHoursInput.value) || 8;

    const checkboxes = document.querySelectorAll('.leave-checkbox');
    const workingDays = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalDays = checkboxes.length;
    const leaveDays = totalDays - workingDays;
    const totalHours = workingDays * workHours;

    // Update the display
    const workingDaysCount = document.getElementById('workingDaysCount');
    const totalHoursCount = document.getElementById('totalHoursCount');

    if (workingDaysCount) {
        workingDaysCount.textContent = workingDays;
    }
    if (totalHoursCount) {
        totalHoursCount.textContent = totalHours;
    }

        // Visual feedback for leave days (unchecked)
    checkboxes.forEach(checkbox => {
        const dayItem = checkbox.closest('.day-item');
        if (!checkbox.checked) {
            dayItem.style.background = 'rgba(255, 235, 238, 0.2)';
            dayItem.style.opacity = '0.6';
            dayItem.style.textDecoration = 'line-through';
        } else {
            dayItem.style.background = 'rgba(255, 255, 255, 0.15)';
            dayItem.style.opacity = '1';
            dayItem.style.textDecoration = 'none';
        }
    });
}

async function submitWorklog() {
    const submitBtn = document.getElementById('submitBtn');
    const workHoursInput = document.getElementById('workHours');

    if (!selectedProject) {
        alert('Please select a project');
        return;
    }

    const workHours = parseFloat(workHoursInput.value) || 8;

    if (workHours <= 0 || workHours > 24) {
        alert('Work hours must be between 0.5 and 24 hours');
        return;
    }

    const startDate = new Date(window.selectedStartDate);
    const endDate = new Date(window.selectedEndDate);
    const weekdays = getWeekdaysBetween(startDate, endDate);

    // Get all leave days (unchecked checkboxes)
    const checkboxes = document.querySelectorAll('.leave-checkbox');
    const leaveDates = new Set(
        Array.from(checkboxes)
            .filter(cb => !cb.checked)
            .map(cb => cb.dataset.date)
    );

    // Filter out leave days from weekdays
    const workingDays = weekdays.filter(date => {
        const dateStr = date.toISOString().split('T')[0];
        return !leaveDates.has(dateStr);
    });

    // Check if there are any working days
    if (workingDays.length === 0) {
        alert('No working days selected! Please check at least one day or select a different date range.');
        return;
    }

    // Generate workLogs payload only for working days
    const workLogs = workingDays.map(date => ({
        date: date.toISOString().split('T')[0],
        description: null,
        workHours: workHours,
        typeOfWork: 6,
        projectId: selectedProject.id
    }));

    const payload = { workLogs };

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

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
            // If token is invalid (401 or 403), notify user but don't clear it from storage
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token is invalid or expired. Please get a new token from SRA SmartOSC.');
            }
            const errorText = await response.text();
            throw new Error(`Failed to submit worklog: ${response.status} - ${errorText}`);
        }

        // Check if response has content before parsing JSON
        const responseText = await response.text();
        let result;

        if (responseText && responseText.trim() !== '') {
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                // If JSON parsing fails, use the text response
                result = { message: 'Success', response: responseText };
            }
        } else {
            // Empty response means success (204 No Content or similar)
            result = { message: 'Worklog submitted successfully' };
        }

        // Show success message
        const totalHours = workingDays.length * workHours;
        const leaveDaysCount = weekdays.length - workingDays.length;

        document.getElementById('worklogPreview').innerHTML = `
            <div style="background: rgba(212, 237, 218, 0.3); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(195, 230, 203, 0.4); color: rgba(255, 255, 255, 0.95); padding: 15px; border-radius: 12px; margin: 15px 0; box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);">
                <h4 style="margin-top: 0; text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);">Worklog Submitted Successfully!</h4>
                <p style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Logged ${workingDays.length} days (${totalHours} hours) for project: <strong>${selectedProject.name}</strong></p>
                ${leaveDaysCount > 0 ? `<p style="color: rgba(255, 255, 255, 0.95); background: rgba(255, 243, 205, 0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Skipped ${leaveDaysCount} day(s) marked as leave</p>` : ''}
                <pre style="background: rgba(30, 30, 30, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #d4d4d4; padding: 10px; margin-top: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 15px 0 rgba(0, 0, 0, 0.2);">${JSON.stringify(result, null, 2)}</pre>
            </div>
        `;

        submitBtn.innerHTML = 'Submitted!';
        setTimeout(() => {
            submitBtn.innerHTML = 'Submit Worklog';
            submitBtn.disabled = false;
        }, 3000);

    } catch (error) {
        alert(`Error: ${error.message}`);
        submitBtn.innerHTML = 'Submit Worklog';
        submitBtn.disabled = false;
    }
}
