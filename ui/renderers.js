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

// Add Resource renderers
async function renderProjectsList(data, currentPage = 1) {
  const worklogContainer = document.getElementById("worklogContainer");

  const projects = data.data || [];
  const pagination = data.pagination || {};

  // Filter out closed projects
  const activeProjects = projects.filter(project => {
    return !(project.status && project.status.toLowerCase() === 'closed');
  });

  const projectsRows = activeProjects.map(project => `
    <tr class="project-row" data-project-id="${project.id}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: all 0.2s ease;">
      <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${project.code || 'N/A'}</td>
      <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${project.name || 'N/A'}</td>
      <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${project.customerName || 'N/A'}</td>
      <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${project.status || 'N/A'}</td>
    </tr>
  `).join('');

  const paginationInfo = `Page ${pagination.currentPage || 1} of ${pagination.lastPage || 1} (Total: ${pagination.total || 0} projects)`;
  const hasMore = pagination.currentPage < pagination.lastPage;
  const loadMoreDisplay = hasMore ? 'inline-block' : 'none';

  const html = await loadTemplate("projects-list", {
    PROJECTS_ROWS: projectsRows,
    PAGINATION_INFO: paginationInfo,
    LOAD_MORE_DISPLAY: loadMoreDisplay,
  });

  worklogContainer.innerHTML = html;

  // Store current page and data
  window.currentProjectsPage = currentPage;
  window.projectsPagination = pagination;
  window.lastProjectsData = data;

  // Add event listeners for project rows
  const projectRows = worklogContainer.querySelectorAll(".project-row");
  projectRows.forEach(row => {
    // Add hover effect
    row.addEventListener("mouseenter", () => {
      row.style.background = "rgba(255, 255, 255, 0.15)";
      row.style.transform = "translateX(5px)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
      row.style.transform = "translateX(0)";
    });

    // Add click event
    row.addEventListener("click", async () => {
      const projectId = row.dataset.projectId;
      await loadAndDisplayCrewMembers(projectId);
    });
  });

  // Add event listener for load more button
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", async () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "Loading...";
      try {
        const nextPage = currentPage + 1;
        const data = await fetchProjectsList(nextPage);
        await renderProjectsList(data, nextPage);
      } catch (error) {
        alert(`Error loading projects: ${error.message}`);
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Load More";
      }
    });
  }

  // Add event listener for back button
  const backToStartBtn = document.getElementById("backToStartBtn");
  if (backToStartBtn) {
    backToStartBtn.addEventListener("click", () => {
      location.reload();
    });
  }
}

async function renderCrewMembers(projectData) {
  const worklogContainer = document.getElementById("worklogContainer");

  const project = projectData.project || {};
  const crews = projectData.crews || {};
  const history = crews.history || [];

  // Process history to group by user and get latest dates
  const userMap = new Map();

  history.forEach(group => {
    if (Array.isArray(group)) {
      group.forEach(member => {
        const userId = member.id || member.username;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            username: member.username,
            name: member.name,
            title: member.title,
            startDate: member.startDate,
            endDate: member.endDate,
          });
        } else {
          // Update with latest dates
          const existing = userMap.get(userId);
          const existingEnd = new Date(existing.endDate);
          const currentEnd = new Date(member.endDate);
          if (currentEnd > existingEnd) {
            existing.startDate = member.startDate;
            existing.endDate = member.endDate;
          }
        }
      });
    }
  });

  // Convert to array and sort by end date (most recent first)
  const allCrewMembers = Array.from(userMap.values()).sort((a, b) => {
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateB - dateA; // Descending order (newest first)
  });

  // Calculate one month ago
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Split into recent and older members
  const recentMembers = [];
  const olderMembers = [];

  allCrewMembers.forEach(member => {
    const memberStartDate = new Date(member.startDate);
    if (memberStartDate >= oneMonthAgo) {
      recentMembers.push(member);
    } else {
      olderMembers.push(member);
    }
  });

  // Generate rows for recent members (with checkboxes, all checked by default)
  const recentCrewRows = recentMembers.map((member, index) => {
    const startDate = member.startDate ? new Date(member.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const endDate = member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <td style="padding: 12px; text-align: center;">
          <input type="checkbox" class="crew-checkbox recent-crew-checkbox liquid-glass-inline liquid-glass-inline-sm"
                 data-username="${member.username}"
                 data-name="${member.name}"
                 data-title="${member.title}"
                 data-id="${member.id || member.username}"
                 checked
                 style="cursor: pointer;" />
        </td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.username || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.name || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.title || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${startDate}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${endDate}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.9);">No recent members</td></tr>';

  // Generate rows for older members (with checkboxes, unchecked by default)
  const olderCrewRows = olderMembers.map((member, index) => {
    const startDate = member.startDate ? new Date(member.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const endDate = member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <td style="padding: 12px; text-align: center;">
          <input type="checkbox" class="crew-checkbox older-crew-checkbox liquid-glass-inline liquid-glass-inline-sm"
                 data-username="${member.username}"
                 data-name="${member.name}"
                 data-title="${member.title}"
                 data-id="${member.id || member.username}"
                 style="cursor: pointer;" />
        </td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.username || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.name || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.title || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${startDate}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${endDate}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.9);">No older members</td></tr>';

  // Hide older section if no older members
  const olderSectionDisplay = olderMembers.length > 0 ? 'block' : 'none';

  // Get project name and code from stored projects list
  const selectedProject = window.selectedProjectForResource || {};

  const html = await loadTemplate("crew-members", {
    PROJECT_NAME: selectedProject.name || 'Unknown',
    PROJECT_CODE: selectedProject.code || 'N/A',
    RECENT_CREW_ROWS: recentCrewRows,
    OLDER_CREW_ROWS: olderCrewRows,
    OLDER_SECTION_DISPLAY: olderSectionDisplay,
  });

  worklogContainer.innerHTML = html;

  // Add event listener for username search
  const usernameSearch = document.getElementById("usernameSearch");
  if (usernameSearch) {
    usernameSearch.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const allRows = document.querySelectorAll("#recentCrewBody tr, #olderCrewBody tr");

      allRows.forEach(row => {
        const username = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
        if (username.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }

  // Add event listener for Rebook button
  const rebookBtn = document.getElementById("rebookBtn");
  if (rebookBtn) {
    rebookBtn.addEventListener("click", () => {
      const selectedMembers = [];
      const allCheckboxes = document.querySelectorAll(".crew-checkbox:checked");

      allCheckboxes.forEach(cb => {
        selectedMembers.push({
          id: cb.dataset.id,
          username: cb.dataset.username,
          name: cb.dataset.name,
          title: cb.dataset.title,
        });
      });

      if (selectedMembers.length === 0) {
        alert("Please select at least one member to rebook.");
        return;
      }

      // Show confirmation with selected members
      const membersList = selectedMembers.map(m => `- ${m.name} (${m.username})`).join('\n');
      const confirmed = confirm(`Rebook the following ${selectedMembers.length} member(s)?\n\n${membersList}\n\nNote: This is a demo. Actual rebooking API integration would go here.`);

      if (confirmed) {
        console.log("Selected members for rebooking:", selectedMembers);
        alert(`Successfully selected ${selectedMembers.length} member(s) for rebooking!`);
      }
    });
  }

  // Add event listeners for navigation buttons
  const backToProjectsBtn = document.getElementById("backToProjectsBtn");
  if (backToProjectsBtn) {
    backToProjectsBtn.addEventListener("click", async () => {
      const currentPage = window.currentProjectsPage || 1;
      const data = await fetchProjectsList(currentPage);
      await renderProjectsList(data, currentPage);
    });
  }

  const backToStartBtn = document.getElementById("backToStartBtn");
  if (backToStartBtn) {
    backToStartBtn.addEventListener("click", () => {
      location.reload();
    });
  }
}

async function loadAndDisplayCrewMembers(projectId) {
  const worklogContainer = document.getElementById("worklogContainer");

  try {
    // Show loading indicator
    worklogContainer.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 30px 50px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center;">
          <div style="color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); font-size: 18px; margin-bottom: 15px;">
            Loading project details...
          </div>
          <div style="width: 40px; height: 40px; border: 4px solid rgba(255, 255, 255, 0.3); border-top-color: rgba(255, 255, 255, 0.9); border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    // Store selected project info
    const projectsData = window.lastProjectsData || {};
    const projects = projectsData.data || [];
    const selectedProject = projects.find(p => p.id == projectId);
    window.selectedProjectForResource = selectedProject;

    const projectData = await fetchProjectDetails(projectId);
    await renderCrewMembers(projectData);
  } catch (error) {
    worklogContainer.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <p style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); margin-bottom: 15px;">
          Error loading project details: ${error.message}
        </p>
        <button class="danger" onclick="location.reload()">Go Back</button>
      </div>
    `;
  }
}

