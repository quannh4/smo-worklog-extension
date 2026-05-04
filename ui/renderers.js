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

  // Store project data for later use (e.g., when canceling rebook view)
  window.lastProjectDataForRebook = projectData;

  const project = projectData.project || {};
  const crews = projectData.crews || {};
  const history = crews.history || [];
  const current = crews.current || [];

  // DEBUG: Log the full project data structure
  console.log('=== FULL PROJECT DATA ===');
  console.log('Project fields:', Object.keys(projectData));
  console.log('Project.project fields:', Object.keys(project));
  console.log('Project.crews fields:', Object.keys(crews));

  // Check for roles at various levels
  console.log('projectData.roles:', projectData.roles);
  console.log('projectData.projectRoles:', projectData.projectRoles);
  console.log('project.roles:', project.roles);
  console.log('project.projectRoles:', project.projectRoles);
  console.log('crews.roles:', crews.roles);
  console.log('crews.projectRoles:', crews.projectRoles);

  // Store project roles if available for later use
  window.availableProjectRoles = project.projectRoles || project.roles || projectData.projectRoles || projectData.roles || crews.projectRoles || crews.roles;
  if (window.availableProjectRoles) {
    console.log('Stored available project roles:', window.availableProjectRoles);
  } else {
    console.log('WARNING: No project roles found at project level!');
  }
  console.log('=========================');

  // DEBUG: Log the crew data structure
  console.log('=== CREW DATA STRUCTURE ===');
  console.log('Current crew members:', current.length);
  console.log('History groups:', history.length);

  if (current.length > 0) {
    console.log('Sample current member (all fields):', current[0]);
    console.log('Current member type:', typeof current[0]);
    console.log('Current member is array?:', Array.isArray(current[0]));
    console.log('Current member field names:', Object.keys(current[0]));

    // If it's an array, show the first element
    if (Array.isArray(current[0]) && current[0].length > 0) {
      console.log('Current member[0][0]:', current[0][0]);
      console.log('Current member[0][0] fields:', Object.keys(current[0][0]));
    }
  }

  if (history.length > 0 && Array.isArray(history[0]) && history[0].length > 0) {
    console.log('Sample history member (all fields):', history[0][0]);
    console.log('History member field names:', Object.keys(history[0][0]));
    console.log('History member projectRoles:', history[0][0].projectRoles);

    // Check if any history member has projectRoles
    let foundProjectRoles = false;
    for (let group of history) {
      if (Array.isArray(group)) {
        for (let member of group) {
          if (member.projectRoles && Array.isArray(member.projectRoles) && member.projectRoles.length > 0) {
            console.log('Found member with projectRoles:', member.username, member.projectRoles);
            foundProjectRoles = true;
            break;
          }
        }
      }
      if (foundProjectRoles) break;
    }
    if (!foundProjectRoles) {
      console.log('WARNING: No members in history have projectRoles!');
    }
  }
  console.log('===========================');

  // Process current crew members first to get projectRoles
  const userMap = new Map();

  // Helper function to merge projectRoles arrays and deduplicate by ID
  const mergeProjectRoles = (existing, newRoles) => {
    if (!newRoles || !Array.isArray(newRoles) || newRoles.length === 0) {
      return existing;
    }
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      return [...newRoles];
    }

    // Create a map of existing roles by ID
    const rolesMap = new Map();
    existing.forEach(role => {
      if (role && role.id) {
        rolesMap.set(role.id, role);
      }
    });

    // Add new roles if they don't exist
    newRoles.forEach(role => {
      if (role && role.id && !rolesMap.has(role.id)) {
        rolesMap.set(role.id, role);
      }
    });

    return Array.from(rolesMap.values());
  };

  // First, process current crew members (they have the most up-to-date projectRoles)
  if (Array.isArray(current)) {
    current.forEach(member => {
      const userId = member.id || member.username;
      const accountId = member.accountId || member.id;

      userMap.set(userId, {
        id: member.id,
        accountId: accountId,
        username: member.username,
        name: member.name,
        title: member.title,
        hourPerDay: member.hourPerDay,
        startDate: member.startDate,
        endDate: member.endDate,
        projectRoles: member.projectRoles || [],
      });
    });
  }

  // Then process history to fill in any missing members and collect ALL projectRoles
  history.forEach(group => {
    if (Array.isArray(group)) {
      group.forEach(member => {
        const userId = member.id || member.username;
        if (!userMap.has(userId)) {
          // Extract accountId - it might be in member.id or member.accountId
          const accountId = member.accountId || member.id;

          userMap.set(userId, {
            id: member.id,
            accountId: accountId,
            username: member.username,
            name: member.name,
            title: member.title,
            hourPerDay: member.hourPerDay,
            startDate: member.startDate,
            endDate: member.endDate,
            projectRoles: member.projectRoles || [],
          });
        } else {
          // Update with latest dates and MERGE projectRoles from all booking records
          const existing = userMap.get(userId);
          const existingEnd = new Date(existing.endDate);
          const currentEnd = new Date(member.endDate);

          // Update dates if this record is more recent
          if (currentEnd > existingEnd) {
            existing.startDate = member.startDate;
            existing.endDate = member.endDate;
            existing.hourPerDay = member.hourPerDay;
          }

          // ALWAYS merge projectRoles from all booking records
          existing.projectRoles = mergeProjectRoles(existing.projectRoles, member.projectRoles);
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

  // DEBUG: Log crew members with their projectRoles after processing
  console.log('=== PROCESSED CREW MEMBERS ===');
  console.log(`Total crew members: ${allCrewMembers.length}`);
  allCrewMembers.forEach((member, idx) => {
    console.log(`${idx + 1}. ${member.name} (${member.username}):`, {
      id: member.id,
      accountId: member.accountId,
      projectRoles: member.projectRoles,
      projectRolesCount: member.projectRoles?.length || 0
    });
  });
  const membersWithoutRoles = allCrewMembers.filter(m => !m.projectRoles || m.projectRoles.length === 0);
  if (membersWithoutRoles.length > 0) {
    console.log(`⚠️ WARNING: ${membersWithoutRoles.length} members have NO projectRoles:`);
    membersWithoutRoles.forEach(m => console.log(`  - ${m.name} (${m.username})`));
  }
  console.log('==============================');

  // Calculate one month ago
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Split into recent and older members
  const recentMembers = [];
  const olderMembers = [];

  allCrewMembers.forEach(member => {
    const memberEndDate = new Date(member.endDate);
    if (memberEndDate >= oneMonthAgo) {
      recentMembers.push(member);
    } else {
      olderMembers.push(member);
    }
  });

  // Generate rows for recent members (with checkboxes, all checked by default)
  const recentCrewRows = recentMembers.map((member, index) => {
    const startDate = member.startDate ? new Date(member.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const endDate = member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const hourPerDay = member.hourPerDay !== undefined && member.hourPerDay !== null ? member.hourPerDay : 'N/A';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <td style="padding: 12px; text-align: center;">
          <input type="checkbox" class="crew-checkbox recent-crew-checkbox liquid-glass-inline liquid-glass-inline-sm"
                 data-username="${member.username}"
                 data-name="${member.name}"
                 data-title="${member.title}"
                 data-hour-per-day="${member.hourPerDay !== undefined && member.hourPerDay !== null ? member.hourPerDay : ''}"
                 data-id="${member.id || member.username}"
                 data-account-id="${member.accountId || member.id || member.username}"
                 data-project-roles="${JSON.stringify(member.projectRoles || [])}"
                 checked
                 style="cursor: pointer;" />
        </td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.username || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.name || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.title || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${hourPerDay}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${startDate}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${endDate}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.9);">No recent members</td></tr>';

  // Generate rows for older members (with checkboxes, unchecked by default)
  const olderCrewRows = olderMembers.map((member, index) => {
    const startDate = member.startDate ? new Date(member.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const endDate = member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const hourPerDay = member.hourPerDay !== undefined && member.hourPerDay !== null ? member.hourPerDay : 'N/A';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <td style="padding: 12px; text-align: center;">
          <input type="checkbox" class="crew-checkbox older-crew-checkbox liquid-glass-inline liquid-glass-inline-sm"
                 data-username="${member.username}"
                 data-name="${member.name}"
                 data-title="${member.title}"
                 data-hour-per-day="${member.hourPerDay !== undefined && member.hourPerDay !== null ? member.hourPerDay : ''}"
                 data-id="${member.id || member.username}"
                 data-account-id="${member.accountId || member.id || member.username}"
                 data-project-roles="${JSON.stringify(member.projectRoles || [])}"
                 style="cursor: pointer;" />
        </td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.username || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.name || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.title || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${hourPerDay}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${startDate}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${endDate}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.9);">No older members</td></tr>';

  // Hide older section if no older members
  const olderSectionDisplay = olderMembers.length > 0 ? 'block' : 'none';

  // Store all crew members data globally so we can access projectRoles later
  // Create a map by member ID for quick lookup
  window.crewMembersDataMap = new Map();
  allCrewMembers.forEach(member => {
    const memberId = member.id || member.username;
    window.crewMembersDataMap.set(String(memberId), member);
    // Also store by username as a fallback
    if (member.username) {
      window.crewMembersDataMap.set(member.username, member);
    }
  });

  console.log('=== STORED CREW MEMBERS MAP ===');
  console.log(`Total entries in map: ${window.crewMembersDataMap.size}`);
  console.log('Sample entries:');
  let count = 0;
  for (let [key, value] of window.crewMembersDataMap) {
    if (count < 3) {
      console.log(`  ${key}:`, {
        id: value.id,
        username: value.username,
        name: value.name,
        projectRoles: value.projectRoles
      });
      count++;
    }
  }
  console.log('===============================');

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
    rebookBtn.addEventListener("click", async () => {
      const selectedMembers = [];
      const allCheckboxes = document.querySelectorAll(".crew-checkbox:checked");

      console.log('=== COLLECTING SELECTED MEMBERS ===');
      console.log(`Total checked checkboxes: ${allCheckboxes.length}`);

      allCheckboxes.forEach(cb => {
        const memberId = cb.dataset.id;
        const username = cb.dataset.username;

        // Try to get member data from global map
        let memberData = window.crewMembersDataMap?.get(String(memberId)) ||
                        window.crewMembersDataMap?.get(username);

        console.log(`Looking up member ${username} (${memberId}):`, {
          foundInMap: !!memberData,
          projectRoles: memberData?.projectRoles || 'NOT FOUND'
        });

        // If found in map, use that data (which has correct projectRoles)
        // Otherwise fall back to data attributes
        if (memberData) {
          selectedMembers.push({
            id: memberData.id,
            accountId: memberData.accountId || memberData.id,
            username: memberData.username,
            name: memberData.name,
            title: memberData.title,
            hourPerDay: memberData.hourPerDay || '',
            projectRoles: memberData.projectRoles || [],
          });
        } else {
          // Fallback to data attributes (shouldn't happen, but just in case)
          console.warn(`Member ${username} not found in crewMembersDataMap! Using data attributes.`);
          let projectRoles = [];
          try {
            projectRoles = JSON.parse(cb.dataset.projectRoles || '[]');
          } catch (e) {
            console.error(`Failed to parse projectRoles for ${username}:`, e);
          }
          selectedMembers.push({
            id: cb.dataset.id,
            accountId: cb.dataset.accountId || cb.dataset.id,
            username: cb.dataset.username,
            name: cb.dataset.name,
            title: cb.dataset.title,
            hourPerDay: cb.dataset.hourPerDay || '',
            projectRoles: projectRoles,
          });
        }
      });

      console.log('=== SELECTED MEMBERS RESULT ===');
      selectedMembers.forEach((m, idx) => {
        console.log(`${idx + 1}. ${m.name} (${m.username}):`, {
          projectRoles: m.projectRoles,
          projectRolesCount: m.projectRoles?.length || 0
        });
      });
      console.log('===============================');

      if (selectedMembers.length === 0) {
        // Show error UI instead of alert
        const worklogContainer = document.getElementById("worklogContainer");
        const errorHtml = await loadTemplate("rebook-error", {
          ERROR_MESSAGE: "Please select at least one member to rebook.",
        });
        worklogContainer.innerHTML = errorHtml;

        const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
        if (closeErrorBtn) {
          closeErrorBtn.addEventListener("click", () => {
            // Stay on current view (crew members)
          });
        }
        return;
      }

      // Store selected members and project data for rebook view
      window.selectedMembersForRebook = selectedMembers;
      await renderRebookView();
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

async function renderRebookView() {
  const worklogContainer = document.getElementById("worklogContainer");
  const selectedMembers = window.selectedMembersForRebook || [];
  const selectedProject = window.selectedProjectForResource || {};

  if (selectedMembers.length === 0) {
    // Show error UI instead of alert
    const errorHtml = await loadTemplate("rebook-error", {
      ERROR_MESSAGE: "No members selected for rebooking.",
    });
    worklogContainer.innerHTML = errorHtml;

    const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener("click", async () => {
        // Go back to crew members view
        const projectData = window.lastProjectDataForRebook;
        if (projectData) {
          await renderCrewMembers(projectData);
        }
      });
    }
    return;
  }

  // Weekend validation helper functions
  const weekendHelpers = {
    isWeekend: (date) => {
      const d = date instanceof Date ? date : new Date(date);
      const day = d.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    },
    getNextWeekday: (date) => {
      const d = date instanceof Date ? new Date(date) : new Date(date);
      const day = d.getDay();
      if (day === 0) { // Sunday -> Monday
        d.setDate(d.getDate() + 1);
      } else if (day === 6) { // Saturday -> Monday
        d.setDate(d.getDate() + 2);
      }
      return d;
    },
    getPreviousWeekday: (date) => {
      const d = date instanceof Date ? new Date(date) : new Date(date);
      const day = d.getDay();
      if (day === 0) { // Sunday -> Friday
        d.setDate(d.getDate() - 2);
      } else if (day === 6) { // Saturday -> Friday
        d.setDate(d.getDate() - 1);
      }
      return d;
    }
  };

  // Get start and end of current month
  let startOfMonth = getStartOfMonth();
  let endOfMonth = getEndOfMonth();

  // Adjust to weekdays if they fall on weekends
  if (weekendHelpers.isWeekend(startOfMonth)) {
    startOfMonth = weekendHelpers.getNextWeekday(startOfMonth);
  }
  if (weekendHelpers.isWeekend(endOfMonth)) {
    endOfMonth = weekendHelpers.getPreviousWeekday(endOfMonth);
  }

  const startDateStr = formatDate(startOfMonth);
  const endDateStr = formatDate(endOfMonth);

  // Generate member rows with editable hours
  const memberRows = selectedMembers.map((member, index) => {
    const defaultHours = member.hourPerDay || 8;
    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.username || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.name || 'N/A'}</td>
        <td style="padding: 12px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">${member.title || 'N/A'}</td>
        <td style="padding: 12px;">
          <input type="number" 
                 class="rebook-hours-input" 
                 data-member-id="${member.id}"
                 min="0.5" 
                 max="24" 
                 step="0.5" 
                 value="${defaultHours}" 
                 style="width: 100px; padding: 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.9); font-size: 14px;" />
        </td>
      </tr>
    `;
  }).join('');

  const html = await loadTemplate("rebook-view", {
    PROJECT_NAME: selectedProject.name || 'Unknown',
    PROJECT_CODE: selectedProject.code || 'N/A',
    START_DATE: startDateStr,
    END_DATE: endDateStr,
    MEMBER_ROWS: memberRows,
  });

  worklogContainer.innerHTML = html;

  // Add weekend validation for date inputs
  const startDateInput = document.getElementById("rebookStartDate");
  const endDateInput = document.getElementById("rebookEndDate");

  // Show notification helper
  const showWeekendNotification = (adjustedDate) => {
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(255, 152, 0, 0.9); color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;';
    notification.textContent = `Weekend date adjusted to ${adjustedDate}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  };

  // Validate and adjust start date
  if (startDateInput) {
    startDateInput.addEventListener("change", (e) => {
      const selectedDate = e.target.value;
      if (weekendHelpers.isWeekend(selectedDate)) {
        const adjustedDate = weekendHelpers.getNextWeekday(selectedDate).toISOString().split('T')[0];
        e.target.value = adjustedDate;
        showWeekendNotification(adjustedDate);
      }
    });
  }

  // Validate and adjust end date
  if (endDateInput) {
    endDateInput.addEventListener("change", (e) => {
      const selectedDate = e.target.value;
      if (weekendHelpers.isWeekend(selectedDate)) {
        const adjustedDate = weekendHelpers.getPreviousWeekday(selectedDate).toISOString().split('T')[0];
        e.target.value = adjustedDate;
        showWeekendNotification(adjustedDate);
      }
    });
  }

  // Add CSS animations for notifications
  if (!document.getElementById('weekend-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'weekend-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add event listener for cancel button
  const cancelRebookBtn = document.getElementById("cancelRebookBtn");
  if (cancelRebookBtn) {
    cancelRebookBtn.addEventListener("click", async () => {
      // Go back to crew members view
      const projectData = window.lastProjectDataForRebook;
      if (projectData) {
        await renderCrewMembers(projectData);
      } else {
        // Fallback: fetch project details if not stored
        const projectId = window.selectedProjectForResource?.id;
        if (projectId) {
          const fetchedProjectData = await fetchProjectDetails(projectId);
          await renderCrewMembers(fetchedProjectData);
        }
      }
    });
  }

  // Add event listener for submit button
  const submitRebookBtn = document.getElementById("submitRebookBtn");
  if (submitRebookBtn) {
    submitRebookBtn.addEventListener("click", async () => {
      let startDate = document.getElementById("rebookStartDate").value;
      let endDate = document.getElementById("rebookEndDate").value;

      if (!startDate || !endDate) {
        // Show error UI instead of alert
        const errorHtml = await loadTemplate("rebook-error", {
          ERROR_MESSAGE: "Please select both start and end dates!",
        });
        worklogContainer.innerHTML = errorHtml;

        const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
        if (closeErrorBtn) {
          closeErrorBtn.addEventListener("click", () => {
            // Go back to rebook view
            renderRebookView();
          });
        }
        return;
      }

      // Validate and adjust weekend dates one more time before submission
      if (weekendHelpers.isWeekend(startDate)) {
        startDate = weekendHelpers.getNextWeekday(startDate).toISOString().split('T')[0];
        document.getElementById("rebookStartDate").value = startDate;
      }
      if (weekendHelpers.isWeekend(endDate)) {
        endDate = weekendHelpers.getPreviousWeekday(endDate).toISOString().split('T')[0];
        document.getElementById("rebookEndDate").value = endDate;
      }

      if (new Date(startDate) > new Date(endDate)) {
        // Show error UI instead of alert
        const errorHtml = await loadTemplate("rebook-error", {
          ERROR_MESSAGE: "Start date must be before or equal to end date!",
        });
        worklogContainer.innerHTML = errorHtml;

        const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
        if (closeErrorBtn) {
          closeErrorBtn.addEventListener("click", () => {
            // Go back to rebook view
            renderRebookView();
          });
        }
        return;
      }

      // Collect rebook data for API
      const userBookingData = [];
      const hourInputs = document.querySelectorAll(".rebook-hours-input");
      const skippedMembers = [];
      let invalidHoursCount = 0;
      let noProjectRolesCount = 0;
      let memberNotFoundCount = 0;

      hourInputs.forEach(input => {
        const hours = parseFloat(input.value) || 0;
        if (hours <= 0 || hours > 24) {
          invalidHoursCount++;
          return; // Skip invalid hours
        }

        const memberId = input.dataset.memberId;
        // Convert both to strings for comparison (dataset returns strings)
        const member = selectedMembers.find(m => String(m.id) === String(memberId));

        console.log('=== Looking up member for submission ===');
        console.log('memberId from input:', memberId, typeof memberId);
        console.log('Found member:', member ? member.username : 'NOT FOUND');
        if (member) {
          console.log('Member details:', {
            id: member.id,
            accountId: member.accountId,
            username: member.username,
            projectRoles: member.projectRoles
          });
        }
        console.log('========================================');

        if (!member) {
          memberNotFoundCount++;
          skippedMembers.push({
            reason: 'Member not found in selectedMembers array',
            memberId,
            availableIds: selectedMembers.map(m => ({ id: m.id, username: m.username }))
          });
          return;
        }

        if (!member.accountId) {
          memberNotFoundCount++;
          skippedMembers.push({
            reason: 'Member missing accountId (accountId should equal id)',
            memberId,
            member: { id: member.id, username: member.username, accountId: member.accountId }
          });
          return;
        }

        // Build projectRoles array from member data - use actual projectRoles from crew data
        let projectRoles = [];

        // DEBUG: Log member data to see what's available
        console.log('=== Processing member:', member.username, '===');
        console.log('Available fields:', Object.keys(member));
        console.log('member.projectRoles:', member.projectRoles);
        console.log('member.roles:', member.roles);
        console.log('member.role:', member.role);
        console.log('member.projectRole:', member.projectRole);
        console.log('Full member object:', member);
        console.log('=====================================');

        // First, try to use projectRoles from member data (from crew history)
        if (member.projectRoles && Array.isArray(member.projectRoles) && member.projectRoles.length > 0) {
          // Use the actual projectRoles from crew data
          projectRoles = member.projectRoles.map(role => ({
            id: role.id,
            name: role.name || '',
          })).filter(role => role.id && role.name); // Filter out invalid roles

          console.log('Processed projectRoles for', member.username, ':', projectRoles);
        }

        // Skip if no valid projectRoles found
        if (projectRoles.length === 0) {
          noProjectRolesCount++;
          skippedMembers.push({
            reason: 'No valid projectRoles found',
            username: member.username,
            name: member.name,
            projectRoles: member.projectRoles
          });
          console.warn('Skipping member', member.username, 'due to missing projectRoles');
          return;
        }

        // Append each member as a separate object to userBookingData array
        const bookingEntry = {
          accountId: parseInt(member.accountId),
          startDate: startDate,
          endDate: endDate,
          hourPerDay: hours.toString(),
          projectRoles: projectRoles,
        };

        userBookingData.push(bookingEntry);
      });

      if (userBookingData.length === 0) {
        // Build a more helpful error message
        let errorMessage = "Unable to process rebook request. ";
        const reasons = [];

        if (invalidHoursCount > 0) {
          reasons.push(`${invalidHoursCount} member(s) have invalid hours`);
        }
        if (noProjectRolesCount > 0) {
          reasons.push(`${noProjectRolesCount} member(s) are missing project roles`);
        }
        if (memberNotFoundCount > 0) {
          reasons.push(`${memberNotFoundCount} member(s) could not be found`);
        }

        if (reasons.length > 0) {
          errorMessage += reasons.join(', ') + '.';
        } else {
          errorMessage += "Please check that members have valid hours and project roles.";
        }

        // Add details about which members have issues
        if (skippedMembers.length > 0) {
          errorMessage += '\n\nMembers with issues:\n';
          skippedMembers.forEach(sm => {
            if (sm.username) {
              errorMessage += `\n- ${sm.name} (${sm.username}): ${sm.reason}`;
            } else {
              errorMessage += `\n- Member ID ${sm.memberId}: ${sm.reason}`;
            }
          });
        }

        // Show error UI instead of alert
        const errorHtml = await loadTemplate("rebook-error", {
          ERROR_MESSAGE: errorMessage,
        });
        worklogContainer.innerHTML = errorHtml;

        const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
        if (closeErrorBtn) {
          closeErrorBtn.addEventListener("click", () => {
            // Go back to rebook view
            renderRebookView();
          });
        }
        return;
      }

      // Show confirmation dialog (keeping confirm for now, but could be replaced with custom UI)
      const membersList = userBookingData.map((m, idx) => {
        const member = selectedMembers.find(sm => parseInt(sm.accountId) === m.accountId);
        return `- ${member?.name || 'Unknown'} (${member?.username || 'N/A'}): ${m.hourPerDay} hours/day`;
      }).join('\n');

      const confirmed = confirm(`Rebook the following ${userBookingData.length} member(s)?\n\nDate Range: ${startDate} to ${endDate}\n\n${membersList}`);

      if (!confirmed) {
        return;
      }

      // Disable button and show loading
      submitRebookBtn.disabled = true;
      submitRebookBtn.innerHTML = "Submitting...";

      try {
        const projectId = window.selectedProjectForResource?.id;
        if (!projectId) {
          throw new Error("Project ID not found");
        }

        // Log the request data before sending
        console.log('=== REBOOK REQUEST ===');
        console.log('Project ID:', projectId);
        console.log('User Booking Data:', JSON.stringify(userBookingData, null, 2));
        console.log('Request payload:', JSON.stringify({
          quickBookingData: [{
            projectId: parseInt(projectId),
            userBookingData: userBookingData
          }]
        }, null, 2));
        console.log('======================');

        const result = await submitQuickBooking(projectId, userBookingData);

        // Log the response data
        console.log('=== REBOOK RESPONSE (SUCCESS) ===');
        console.log('Response:', JSON.stringify(result, null, 2));
        console.log('==================================');

        // Show success UI
        const selectedProject = window.selectedProjectForResource || {};
        const successMessage = result.message || `Successfully rebooked ${userBookingData.length} member(s)!`;

        const successHtml = await loadTemplate("rebook-success", {
          SUCCESS_MESSAGE: successMessage,
          PROJECT_NAME: selectedProject.name || 'Unknown',
          PROJECT_CODE: selectedProject.code || 'N/A',
          START_DATE: startDate,
          END_DATE: endDate,
          MEMBER_COUNT: userBookingData.length.toString(),
        });

        worklogContainer.innerHTML = successHtml;

        // Add event listeners for success buttons
        const backToProjectsBtn2 = document.getElementById("backToProjectsBtn2");
        const closeSuccessBtn2 = document.getElementById("closeRebookSuccessBtn2");

        if (backToProjectsBtn2) {
          backToProjectsBtn2.addEventListener("click", async () => {
            // Go back to projects list
            const currentPage = window.currentProjectsPage || 1;
            const data = await fetchProjectsList(currentPage);
            await renderProjectsList(data, currentPage);
          });
        }

        if (closeSuccessBtn2) {
          closeSuccessBtn2.addEventListener("click", () => {
            location.reload();
          });
        }
      } catch (error) {
        // Log the error response
        console.log('=== REBOOK RESPONSE (ERROR) ===');
        console.log('Error message:', error.message);
        console.log('Error object:', error);
        if (error.response) {
          console.log('Error response:', error.response);
        }
        console.log('================================');

        // Show error UI
        const errorHtml = await loadTemplate("rebook-error", {
          ERROR_MESSAGE: `Error submitting rebook: ${error.message}`,
        });
        worklogContainer.innerHTML = errorHtml;

        const closeErrorBtn = document.getElementById("closeRebookErrorBtn");
        if (closeErrorBtn) {
          closeErrorBtn.addEventListener("click", () => {
            // Go back to rebook view
            renderRebookView();
          });
        }
      }
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

