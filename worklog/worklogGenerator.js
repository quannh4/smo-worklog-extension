// Worklog generation logic

function generateWorklogsFromAllocated(timesheetOverview) {
  const worklogs = [];

  timesheetOverview.forEach(day => {
    // Skip weekends and holidays
    if (day.isWeekend || day.isHoliday) {
      return;
    }

    const date = day.date;
    const allocated = day.allocated;
    const workLogs = day.workLogs;

    // Case 1: Has allocated data but no worklogs (workLogs is null) - generate all allocated entries
    if (allocated && allocated.detail && allocated.detail.length > 0 && (!workLogs || workLogs === null || workLogs.totalHours === 0)) {
      allocated.detail.forEach(alloc => {
        worklogs.push({
          date: date,
          projectId: null, // Will need to find project ID by code
          projectCode: alloc.code,
          projectName: alloc.name,
          hours: alloc.hours,
          typeOfWork: 6,
        });
      });
    }
    // Case 2: Has worklogs but not enough - compare and generate missing
    else if (allocated && allocated.detail && allocated.detail.length > 0 && workLogs && workLogs.detail) {
      // Create a map of logged projects by code
      const loggedProjects = new Map();
      Object.values(workLogs.detail).forEach(log => {
        loggedProjects.set(log.done, log.hours || 0);
      });

      // Check each allocated project
      allocated.detail.forEach(alloc => {
        const loggedHours = loggedProjects.get(alloc.code) || 0;
        const allocatedHours = alloc.hours || 0;

        // If logged hours are less than allocated, generate the difference
        if (loggedHours < allocatedHours) {
          const missingHours = allocatedHours - loggedHours;
          worklogs.push({
            date: date,
            projectId: null, // Will need to find project ID by code
            projectCode: alloc.code,
            projectName: alloc.name,
            hours: missingHours,
            typeOfWork: 6,
          });
        }
      });
    }
  });

  return worklogs;
}

