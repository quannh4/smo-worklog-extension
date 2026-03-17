// Date utility functions

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

function getStartOfMonth() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  // Set to midnight local time to avoid timezone issues
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

function getStartOfWeek() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  return startOfWeek;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEndOfMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  // Get the last day of the current month (day 0 of next month)
  const lastDay = new Date(year, month + 1, 0);
  // Set to midnight local time to avoid timezone issues
  lastDay.setHours(0, 0, 0, 0);
  return lastDay;
}

