// ===== WORKLOG FUNCTIONALITY =====
let currentToken = null;
let currentUserId = null;
let selectedProject = null;
let projectsList = [];

// Template cache to avoid reloading templates
const templateCache = {};

// Helper function to load and render templates
async function loadTemplate(templateName, replacements = {}) {
  // Check cache first
  if (templateCache[templateName]) {
    return replacePlaceholders(templateCache[templateName], replacements);
  }

  try {
    const response = await fetch(chrome.runtime.getURL(`templates/${templateName}.html`));
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templateName}`);
    }
    const html = await response.text();
    templateCache[templateName] = html;
    return replacePlaceholders(html, replacements);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

// Helper function to replace placeholders in templates
function replacePlaceholders(html, replacements) {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Attach event listener to start button
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", showWorklogTool);
  }

  // Use event delegation for dynamically created buttons
  document.body.addEventListener("click", function (e) {
    const target = e.target;

    // Handle different button clicks
    if (target.id === "continueTokenBtn") {
      continueWithToken();
    } else if (target.id === "loadProjectsBtn") {
      loadProjectsWithDateRange();
    } else if (target.id === "submitBtn") {
      submitWorklog();
    } else if (target.classList.contains("changeDatesBtn")) {
      showDateRangeSelector().catch(console.error);
    } else if (target.classList.contains("updateTokenBtn")) {
      showTokenInput().catch(console.error);
    } else if (target.classList.contains("retryLoadBtn")) {
      loadProjectsWithDateRange();
    }
  });

  // Handle select and input changes
  document.body.addEventListener("change", function (e) {
    const target = e.target;

    if (target.id === "projectSelect") {
      onProjectSelected();
    } else if (target.id === "workHours") {
      updateWorklogPreview();
    }
  });
});

async function showWorklogTool() {
  const container = document.querySelector(".container");
  const worklogContainer = document.getElementById("worklogContainer");
  const initialContent = document.getElementById("initialContent");

  // Remove initial content from DOM to prevent showing through backdrop-filter
  if (initialContent) {
    initialContent.remove();
  }

  // Show worklog container and ensure it covers the entire container
  worklogContainer.style.display = "block";

  // Try to extract token automatically first
  currentToken = await findAccessToken();

  // Show token input form
  await showTokenInput();
}

async function showTokenInput() {
  const worklogContainer = document.getElementById("worklogContainer");

  const tokenValue = currentToken ? currentToken.substring(0, 50) + "..." : "";
  const hasToken = currentToken !== null;

  const tokenBgColor = hasToken
    ? "rgba(232, 245, 233, 0.25)"
    : "rgba(227, 242, 253, 0.25)";
  const tokenBorderColor = hasToken
    ? "rgba(76, 175, 80, 0.6)"
    : "rgba(33, 150, 243, 0.6)";
  const tokenTitle = hasToken
    ? "Token Detected!"
    : "How to Get Your Access Token:";
  
  const tokenContent = hasToken
    ? `
      <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          Your access token has been automatically captured from your browsing session!
      </p>
      <p style="margin: 10px 0; font-size: 12px; color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          Token preview: <code style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(5px); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.1);">${tokenValue}</code>
      </p>
    `
    : `
      <ol style="margin: 10px 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          <li>Open <a href="https://sra.smartosc.com" target="_blank" style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"><strong>https://sra.smartosc.com</strong></a> in a new tab</li>
          <li>Login with your credentials</li>
          <li>Return here - the token will be captured automatically!</li>
      </ol>
      <p style="margin: 10px 0; font-size: 13px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          <strong>Alternative:</strong> You can also paste your token manually below.
      </p>
    `;

  const tokenLabelSuffix = hasToken ? "(Auto-captured)" : "(Optional - Manual Entry)";
  const tokenHint = hasToken
    ? "Token ready! Click Continue below."
    : "Visit SRA SmartOSC and login, or paste token manually.";

  const html = await loadTemplate("token-input", {
    TOKEN_BG_COLOR: tokenBgColor,
    TOKEN_BORDER_COLOR: tokenBorderColor,
    TOKEN_TITLE: tokenTitle,
    TOKEN_CONTENT: tokenContent,
    TOKEN_LABEL_SUFFIX: tokenLabelSuffix,
    TOKEN_VALUE: currentToken || "",
    TOKEN_HINT: tokenHint,
  });

  worklogContainer.innerHTML = html;
}

async function continueWithToken() {
  let tokenInput = document.getElementById("tokenInput").value;

  // Clean up the token: remove extra spaces, newlines, and "Bearer" prefix
  tokenInput = tokenInput.trim().replace(/\s+/g, " "); // Replace multiple spaces/newlines with single space
  tokenInput = tokenInput.replace(/\n/g, ""); // Remove any newlines

  // Remove "Bearer " prefix if present (case insensitive)
  if (tokenInput.toLowerCase().startsWith("bearer ")) {
    tokenInput = tokenInput.substring(7).trim();
  }

  if (!tokenInput) {
    alert("Please paste your access token first!");
    return;
  }

  currentToken = tokenInput;

  // Save token to chrome storage for persistence
  await chrome.storage.local.set({ smo_token: currentToken });

  // Fetch user ID from the token
  await fetchCurrentUserId();

  // Show date range selector first
  await showDateRangeSelector();
}

async function fetchCurrentUserId() {
  const worklogContainer = document.getElementById("worklogContainer");

  try {
    const html = await loadTemplate("loading-user-info");
    worklogContainer.innerHTML = html;

    const response = await fetch(
      "https://sra-api.smartosc.com/api/users/current-user",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${currentToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch user info: ${response.status} - ${errorText}`
      );
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response received from server");
    }

    const userData = JSON.parse(responseText);
    currentUserId = userData.id;

    // Save user ID to chrome storage
    await chrome.storage.local.set({ smo_userId: currentUserId });
  } catch (error) {
    alert(
      `Error fetching user information: ${error.message}\nPlease check if your token is valid.`
    );
    await showTokenInput();
    throw error;
  }
}

async function showDateRangeSelector() {
  const worklogContainer = document.getElementById("worklogContainer");

  // Set default dates (e.g., current week)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  const startDateDefault = startOfWeek.toISOString().split("T")[0];
  const endDateDefault = today.toISOString().split("T")[0];

  const html = await loadTemplate("date-range-selector", {
    START_DATE: startDateDefault,
    END_DATE: endDateDefault,
  });

  worklogContainer.innerHTML = html;
}

async function loadProjectsWithDateRange() {
  const startDateInput = document.getElementById("startDateInitial").value;
  const endDateInput = document.getElementById("endDateInitial").value;

  if (!startDateInput || !endDateInput) {
    alert("Please select both start and end dates!");
    return;
  }

  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  if (startDate > endDate) {
    alert("Start date must be before or equal to end date!");
    return;
  }

  const worklogContainer = document.getElementById("worklogContainer");
  const html = await loadTemplate("loading-projects", {
    START_DATE: startDateInput,
    END_DATE: endDateInput,
  });
  worklogContainer.innerHTML = html;

  // Store the selected dates for later use
  window.selectedStartDate = startDateInput;
  window.selectedEndDate = endDateInput;

  // Fetch projects using the selected date
  await loadProjects();
}

async function findAccessToken() {
  // Try to get token and userId from chrome storage first
  const result = await chrome.storage.local.get(["smo_token", "smo_userId"]);
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
  const worklogContainer = document.getElementById("worklogContainer");

  try {
    // Use the selected start date to fetch projects
    const dateToUse =
      window.selectedStartDate || new Date().toISOString().split("T")[0];
    const response = await fetch(
      `https://sra-api.smartosc.com/api/projects/all?userId=${currentUserId}&date=${dateToUse}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${currentToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response received from server");
    }

    projectsList = JSON.parse(responseText);

    // If no projects are returned, add the default "Other" project with ID 0
    if (!projectsList || projectsList.length === 0) {
      projectsList = [
        {
          id: 0,
          name: "Other",
          code: "OTHER",
        },
      ];
    }

    await renderWorklogForm();
  } catch (error) {
    await showProjectLoadError(error.message, true);
  }
}

async function showProjectLoadError(errorMsg, showRetry) {
  const worklogContainer = document.getElementById("worklogContainer");
  const startDate = window.selectedStartDate || "N/A";
  const endDate = window.selectedEndDate || "N/A";
  const tokenPreview = currentToken ? currentToken.substring(0, 20) : "";

  const retryButton = showRetry
    ? `<button class="retryLoadBtn success">Retry Loading Projects</button>`
    : "";

  const html = await loadTemplate("project-load-error", {
    ERROR_MESSAGE: errorMsg,
    START_DATE: startDate,
    END_DATE: endDate,
    TOKEN_PREVIEW: tokenPreview,
    RETRY_BUTTON: retryButton,
  });

  worklogContainer.innerHTML = html;
}

async function renderWorklogForm() {
  const worklogContainer = document.getElementById("worklogContainer");

  const projectOptions = projectsList
    .map((p) => `<option value="${p.id}">${p.name} (${p.code})</option>`)
    .join("");

  const startDate =
    window.selectedStartDate || new Date().toISOString().split("T")[0];
  const endDate =
    window.selectedEndDate || new Date().toISOString().split("T")[0];

  const html = await loadTemplate("worklog-form", {
    START_DATE: startDate,
    END_DATE: endDate,
    PROJECT_OPTIONS: projectOptions,
  });

  worklogContainer.innerHTML = html;
}

function onProjectSelected() {
  const projectId = document.getElementById("projectSelect").value;
  selectedProject = projectsList.find((p) => p.id == projectId);
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

async function updateWorklogPreview() {
  const preview = document.getElementById("worklogPreview");
  const submitBtn = document.getElementById("submitBtn");
  const workHoursInput = document.getElementById("workHours");

  if (!selectedProject) {
    preview.innerHTML = "";
    submitBtn.disabled = true;
    return;
  }

  const workHours = parseFloat(workHoursInput.value) || 8;

  if (workHours <= 0 || workHours > 24) {
    const html = await loadTemplate("error-invalid-hours");
    preview.innerHTML = html;
    submitBtn.disabled = true;
    return;
  }

  const startDate = new Date(window.selectedStartDate);
  const endDate = new Date(window.selectedEndDate);

  const weekdays = getWeekdaysBetween(startDate, endDate);

  if (weekdays.length === 0) {
    const html = await loadTemplate("error-no-weekdays");
    preview.innerHTML = html;
    submitBtn.disabled = true;
    return;
  }

  const dayItems = weekdays
    .map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      return `
            <div class="day-item">
                <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                    <input type="checkbox" 
                           class="leave-checkbox liquid-glass-inline liquid-glass-inline-sm" 
                           data-date="${dateStr}" 
                           checked />
                    <span style="flex: 1; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${dayName}, ${dateStr}</span>
                    <span style="color: rgba(255, 255, 255, 0.95); font-weight: bold; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${workHours} hours</span>
                </label>
            </div>
        `;
    })
    .join("");

  // Calculate initial totals (all working days)
  const totalHours = weekdays.length * workHours;

  const html = await loadTemplate("worklog-preview", {
    PROJECT_NAME: selectedProject.name,
    PROJECT_CODE: selectedProject.code,
    TOTAL_DAYS: weekdays.length.toString(),
    TOTAL_HOURS: totalHours.toString(),
    DAY_ITEMS: dayItems,
  });

  preview.innerHTML = html;

  // Add event listeners for checkboxes
  const checkboxes = preview.querySelectorAll(".leave-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateTotals);
  });

  submitBtn.disabled = false;
}

function updateTotals() {
  const workHoursInput = document.getElementById("workHours");
  const workHours = parseFloat(workHoursInput.value) || 8;

  const checkboxes = document.querySelectorAll(".leave-checkbox");
  const workingDays = Array.from(checkboxes).filter((cb) => cb.checked).length;
  const totalDays = checkboxes.length;
  const leaveDays = totalDays - workingDays;
  const totalHours = workingDays * workHours;

  // Update the display
  const workingDaysCount = document.getElementById("workingDaysCount");
  const totalHoursCount = document.getElementById("totalHoursCount");

  if (workingDaysCount) {
    workingDaysCount.textContent = workingDays;
  }
  if (totalHoursCount) {
    totalHoursCount.textContent = totalHours;
  }

  // Visual feedback for leave days (unchecked)
  checkboxes.forEach((checkbox) => {
    const dayItem = checkbox.closest(".day-item");
    if (!checkbox.checked) {
      dayItem.style.background = "rgba(255, 235, 238, 0.2)";
      dayItem.style.opacity = "0.6";
      dayItem.style.textDecoration = "line-through";
    } else {
      dayItem.style.background = "rgba(255, 255, 255, 0.15)";
      dayItem.style.opacity = "1";
      dayItem.style.textDecoration = "none";
    }
  });
}

async function submitWorklog() {
  const submitBtn = document.getElementById("submitBtn");
  const workHoursInput = document.getElementById("workHours");

  if (!selectedProject) {
    alert("Please select a project");
    return;
  }

  const workHours = parseFloat(workHoursInput.value) || 8;

  if (workHours <= 0 || workHours > 24) {
    alert("Work hours must be between 0.5 and 24 hours");
    return;
  }

  const startDate = new Date(window.selectedStartDate);
  const endDate = new Date(window.selectedEndDate);
  const weekdays = getWeekdaysBetween(startDate, endDate);

  // Get all leave days (unchecked checkboxes)
  const checkboxes = document.querySelectorAll(".leave-checkbox");
  const leaveDates = new Set(
    Array.from(checkboxes)
      .filter((cb) => !cb.checked)
      .map((cb) => cb.dataset.date)
  );

  // Filter out leave days from weekdays
  const workingDays = weekdays.filter((date) => {
    const dateStr = date.toISOString().split("T")[0];
    return !leaveDates.has(dateStr);
  });

  // Check if there are any working days
  if (workingDays.length === 0) {
    alert(
      "No working days selected! Please check at least one day or select a different date range."
    );
    return;
  }

  // Generate workLogs payload only for working days
  const workLogs = workingDays.map((date) => ({
    date: date.toISOString().split("T")[0],
    description: null,
    workHours: workHours,
    typeOfWork: 6,
    projectId: selectedProject.id,
  }));

  const payload = { workLogs };

  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = "Submitting...";

  try {
    const response = await fetch(
      "https://sra-api.smartosc.com/api/user/worklogs",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${currentToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to submit worklog: ${response.status} - ${errorText}`
      );
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    let result;

    if (responseText && responseText.trim() !== "") {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, use the text response
        result = { message: "Success", response: responseText };
      }
    } else {
      // Empty response means success (204 No Content or similar)
      result = { message: "Worklog submitted successfully" };
    }

    // Show success message
    const totalHours = workingDays.length * workHours;
    const leaveDaysCount = weekdays.length - workingDays.length;

    const leaveDaysMessage = leaveDaysCount > 0
      ? `<p style="color: rgba(255, 255, 255, 0.95); background: rgba(255, 243, 205, 0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">Skipped ${leaveDaysCount} day(s) marked as leave</p>`
      : "";

    const html = await loadTemplate("worklog-success", {
      WORKING_DAYS: workingDays.length.toString(),
      TOTAL_HOURS: totalHours.toString(),
      PROJECT_NAME: selectedProject.name,
      LEAVE_DAYS_MESSAGE: leaveDaysMessage,
      RESPONSE_JSON: JSON.stringify(result, null, 2),
    });

    document.getElementById("worklogPreview").innerHTML = html;

    submitBtn.innerHTML = "Submitted!";
    setTimeout(() => {
      submitBtn.innerHTML = "Submit Worklog";
      submitBtn.disabled = false;
    }, 3000);
  } catch (error) {
    alert(`Error: ${error.message}`);
    submitBtn.innerHTML = "Submit Worklog";
    submitBtn.disabled = false;
  }
}
