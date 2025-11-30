// UI rendering functions

async function showTokenInput() {
  const worklogContainer = document.getElementById("worklogContainer");

  const tokenValue = AppState.currentToken ? AppState.currentToken.substring(0, 50) + "..." : "";
  const hasToken = AppState.currentToken !== null;

  // If token is detected, show mode selection instead of token input
  if (hasToken) {
    await showModeSelection();
    return;
  }

  const tokenBgColor = "rgba(227, 242, 253, 0.25)";
  const tokenBorderColor = "rgba(33, 150, 243, 0.6)";
  const tokenTitle = "How to Get Your Access Token:";

  const tokenContent = `
      <ol style="margin: 10px 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          <li>Open <a href="https://sra.smartosc.com" target="_blank" style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"><strong>https://sra.smartosc.com</strong></a> in a new tab</li>
          <li>Login with your credentials</li>
          <li>Return here - the token will be captured automatically!</li>
      </ol>
      <p style="margin: 10px 0; font-size: 13px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          <strong>Alternative:</strong> You can also paste your token manually below.
      </p>
    `;

  const tokenLabelSuffix = "(Optional - Manual Entry)";
  const tokenHint = "Visit SRA SmartOSC and login, or paste token manually.";

  const html = await loadTemplate("token-input", {
    TOKEN_BG_COLOR: tokenBgColor,
    TOKEN_BORDER_COLOR: tokenBorderColor,
    TOKEN_TITLE: tokenTitle,
    TOKEN_CONTENT: tokenContent,
    TOKEN_LABEL_SUFFIX: tokenLabelSuffix,
    TOKEN_VALUE: AppState.currentToken || "",
    TOKEN_HINT: tokenHint,
  });

  worklogContainer.innerHTML = html;
}

async function showModeSelection() {
  const worklogContainer = document.getElementById("worklogContainer");

  const tokenValue = AppState.currentToken ? AppState.currentToken.substring(0, 50) + "..." : "";
  const tokenBgColor = "rgba(232, 245, 233, 0.25)";
  const tokenBorderColor = "rgba(76, 175, 80, 0.6)";
  const tokenTitle = "Token Detected!";

  const tokenContent = `
      <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          Your access token has been automatically captured from your browsing session!
      </p>
      <p style="margin: 10px 0; font-size: 12px; color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          Token preview: <code style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(5px); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.1);">${tokenValue}</code>
      </p>
    `;

  const html = await loadTemplate("mode-selection", {
    TOKEN_BG_COLOR: tokenBgColor,
    TOKEN_BORDER_COLOR: tokenBorderColor,
    TOKEN_TITLE: tokenTitle,
    TOKEN_CONTENT: tokenContent,
  });

  worklogContainer.innerHTML = html;

  // Fetch and display user rates if we have userId
  if (AppState.currentUserId) {
    const ratesData = await fetchUserRates(AppState.currentUserId);
    if (ratesData) {
      displayUserRatesTable(ratesData, worklogContainer);
    }
  }
}

async function showDateRangeSelector() {
  const worklogContainer = document.getElementById("worklogContainer");

  // Set default dates (e.g., current week)
  const startOfWeek = getStartOfWeek();
  const today = new Date();

  const startDateDefault = formatDate(startOfWeek);
  const endDateDefault = formatDate(today);

  const html = await loadTemplate("date-range-selector", {
    START_DATE: startDateDefault,
    END_DATE: endDateDefault,
  });

  worklogContainer.innerHTML = html;
}

async function showProjectLoadError(errorMsg, showRetry) {
  const worklogContainer = document.getElementById("worklogContainer");
  const startDate = window.selectedStartDate || "N/A";
  const endDate = window.selectedEndDate || "N/A";
  const tokenPreview = AppState.currentToken ? AppState.currentToken.substring(0, 20) : "";

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

  const projectOptions = AppState.projectsList
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

async function renderAutoWorklogForm() {
  const worklogContainer = document.getElementById("worklogContainer");

  const startDate = window.selectedStartDate;
  const endDate = window.selectedEndDate;

  // Group worklogs by date for better display
  const worklogsByDate = {};
  AppState.autoGeneratedWorklogs.forEach((wl, index) => {
    if (!worklogsByDate[wl.date]) {
      worklogsByDate[wl.date] = [];
    }
    worklogsByDate[wl.date].push({ ...wl, index });
  });

  // Generate HTML for each worklog entry
  let worklogEntriesHtml = "";
  let totalHours = 0;

  Object.keys(worklogsByDate).sort().forEach(date => {
    const dayWorklogs = worklogsByDate[date];
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    dayWorklogs.forEach(wl => {
      totalHours += wl.hours;
      const entryId = `worklog_${wl.index}`;
      worklogEntriesHtml += `
        <div class="day-item" data-entry-id="${entryId}" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
            <input type="checkbox" 
                   class="auto-worklog-checkbox liquid-glass-inline liquid-glass-inline-sm" 
                   data-entry-id="${entryId}"
                   data-index="${wl.index}"
                   checked />
            <div style="flex: 1; margin-left: 10px;">
              <div style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); font-weight: bold;">
                ${dayName}, ${date}
              </div>
              <div style="color: rgba(255, 255, 255, 0.8); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); font-size: 13px; margin-top: 4px;">
                ${wl.projectName} (${wl.projectCode})
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <label style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); font-size: 13px;">
                Hours:
              </label>
              <input type="number" 
                     class="auto-worklog-hours" 
                     data-index="${wl.index}"
                     min="0.5" 
                     max="24" 
                     step="0.5" 
                     value="${wl.hours}" 
                     style="width: 70px; padding: 5px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.9);" />
            </div>
          </label>
        </div>
      `;
    });
  });

  const html = await loadTemplate("worklog-auto-form", {
    START_DATE: startDate,
    END_DATE: endDate,
    WORKLOG_ENTRIES: worklogEntriesHtml,
    TOTAL_ENTRIES: AppState.autoGeneratedWorklogs.length.toString(),
    TOTAL_HOURS: totalHours.toFixed(1),
  });

  worklogContainer.innerHTML = html;

  // Add event listeners for checkboxes and hour inputs
  const checkboxes = worklogContainer.querySelectorAll(".auto-worklog-checkbox");
  const hourInputs = worklogContainer.querySelectorAll(".auto-worklog-hours");

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", updateAutoWorklogTotals);
  });

  hourInputs.forEach(input => {
    input.addEventListener("change", updateAutoWorklogTotals);
    input.addEventListener("input", updateAutoWorklogTotals);
  });

  // Enable submit button
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = false;
  }

  updateAutoWorklogTotals();
}

function updateAutoWorklogTotals() {
  const checkboxes = document.querySelectorAll(".auto-worklog-checkbox");
  const hourInputs = document.querySelectorAll(".auto-worklog-hours");

  let totalEntries = 0;
  let totalHours = 0;

  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      totalEntries++;
      const index = parseInt(checkbox.dataset.index);
      const hourInput = document.querySelector(`.auto-worklog-hours[data-index="${index}"]`);
      if (hourInput) {
        const hours = parseFloat(hourInput.value) || 0;
        totalHours += hours;
      }
    }

    // Update visual feedback
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

  // Update totals display
  const totalEntriesCount = document.getElementById("totalEntriesCount");
  const totalHoursCount = document.getElementById("totalHoursCountAuto");

  if (totalEntriesCount) {
    totalEntriesCount.textContent = totalEntries;
  }
  if (totalHoursCount) {
    totalHoursCount.textContent = totalHours.toFixed(1);
  }

  // Enable/disable submit button
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = totalEntries === 0;
  }
}

function onProjectSelected() {
  const projectId = document.getElementById("projectSelect").value;
  AppState.selectedProject = AppState.projectsList.find((p) => p.id == projectId);
  updateWorklogPreview();
}

async function updateWorklogPreview() {
  const preview = document.getElementById("worklogPreview");
  const submitBtn = document.getElementById("submitBtn");
  const workHoursInput = document.getElementById("workHours");

  if (!AppState.selectedProject) {
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
    PROJECT_NAME: AppState.selectedProject.name,
    PROJECT_CODE: AppState.selectedProject.code,
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

