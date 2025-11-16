// Utility: get element
function $(id) {
  return document.getElementById(id);
}

// Build Date from manual inputs (UTC-safe)
function getDateFromFields(prefix, options = {}) {
  const dayValue = $(prefix + "-day").value.trim();
  const monthValue = $(prefix + "-month").value.trim();
  const yearValue = $(prefix + "-year").value.trim();

  const allowEmptyAll = options.allowEmptyAll === true;

  const allEmpty = !dayValue && !monthValue && !yearValue;

  if (allEmpty && allowEmptyAll) {
    // Caller will decide what to do (e.g. use today)
    return null;
  }

  // If some field filled but not all => invalid
  if (allEmpty === false && (!dayValue || !monthValue || !yearValue)) {
    return { error: "Please enter day, month and year for the full date." };
  }

  const day = parseInt(dayValue, 10);
  const month = parseInt(monthValue, 10);
  const year = parseInt(yearValue, 10);

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return { error: "Please enter a valid day, month and year." };
  }

  // Build UTC date and validate
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: "The date you entered does not exist. Please check it." };
  }

  return { date };
}

// Main calculation
function calculateAge() {
  clearError();

  const dobResult = getDateFromFields("dob");
  if (dobResult.error) {
    return showError(dobResult.error);
  }
  const dob = dobResult.date;

  const asofResult = getDateFromFields("asof", { allowEmptyAll: true });

  let asof;
  if (asofResult === null) {
    // Use today at UTC midnight
    const now = new Date();
    asof = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  } else if (asofResult.error) {
    return showError(asofResult.error);
  } else {
    asof = asofResult.date;
  }

  if (asof < dob) {
    return showError("The 'as of' date cannot be before the date of birth.");
  }

  updateResults(dob, asof);
}

function updateResults(dob, asof) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Breakdown years/months/days
  let yearA = dob.getUTCFullYear();
  let monthA = dob.getUTCMonth();
  let dayA = dob.getUTCDate();

  let yearB = asof.getUTCFullYear();
  let monthB = asof.getUTCMonth();
  let dayB = asof.getUTCDate();

  let years = yearB - yearA;
  let months = monthB - monthA;
  let days = dayB - dayA;

  if (days < 0) {
    // Borrow days from previous month
    const prevMonthDate = new Date(Date.UTC(yearB, monthB, 0)); // day 0 => last day of previous month
    const daysInPrevMonth = prevMonthDate.getUTCDate();
    days += daysInPrevMonth;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  // Totals
  const totalDays = Math.round((asof - dob) / MS_PER_DAY);
  const weeks = Math.floor(totalDays / 7);
  const approxMonths = Math.round(totalDays / 30.4375);

  // Next birthday
  let nextBirthdayYear = asof.getUTCFullYear();
  let nextBirthday = new Date(
    Date.UTC(nextBirthdayYear, dob.getUTCMonth(), dob.getUTCDate())
  );

  if (nextBirthday <= asof) {
    nextBirthdayYear += 1;
    nextBirthday = new Date(
      Date.UTC(nextBirthdayYear, dob.getUTCMonth(), dob.getUTCDate())
    );
  }

  // Handle Feb 29 on non-leap year: fallback to Feb 28
  if (Number.isNaN(nextBirthday.getTime())) {
    nextBirthday = new Date(
      Date.UTC(nextBirthdayYear, 1, 28) // Feb 28
    );
  }

  const daysUntilBirthday = Math.round(
    (nextBirthday - asof) / MS_PER_DAY
  );

  // Format next birthday & countdown
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const nbDay = nextBirthday.getUTCDate();
  const nbMonth = monthNames[nextBirthday.getUTCMonth()];
  const nbYear = nextBirthday.getUTCFullYear();
  const nextBirthdayLabel = `${nbDay}-${nbMonth}-${nbYear}`;

  // Simple countdown text: X years, Y months, Z days until
  const ageUntil = diffWithBreakdown(asof, nextBirthday);
  const countdownLabel = `${ageUntil.years} year(s), ${ageUntil.months} month(s), ${ageUntil.days} day(s) (${daysUntilBirthday} days)`;

  // As-of label
  const asofLabel = `${asof.getUTCDate()}-${monthNames[asof.getUTCMonth()]}-${asof.getUTCFullYear()}`;

  // Update DOM
  $("result-years").textContent = years;
  $("result-months").textContent = months;
  $("result-days").textContent = days;

  $("result-total-days").textContent = totalDays.toLocaleString();
  $("result-weeks").textContent = weeks.toLocaleString();
  $("result-total-months").textContent = approxMonths.toLocaleString();

  $("result-next-birthday").textContent = nextBirthdayLabel;
  $("result-next-countdown").textContent = countdownLabel;

  $("result-asof-label").textContent = asofLabel;
  $("result-status").textContent = "Age calculated successfully.";
}

// Helper: breakdown between two dates (for countdown)
function diffWithBreakdown(start, end) {
  let yearA = start.getUTCFullYear();
  let monthA = start.getUTCMonth();
  let dayA = start.getUTCDate();

  let yearB = end.getUTCFullYear();
  let monthB = end.getUTCMonth();
  let dayB = end.getUTCDate();

  let years = yearB - yearA;
  let months = monthB - monthA;
  let days = dayB - dayA;

  if (days < 0) {
    const prevMonthDate = new Date(Date.UTC(yearB, monthB, 0));
    const daysInPrevMonth = prevMonthDate.getUTCDate();
    days += daysInPrevMonth;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
}

// Error helpers
function showError(message) {
  const el = $("error-message");
  el.textContent = message;
  $("result-status").textContent = "Waiting for valid input…";
}

function clearError() {
  $("error-message").textContent = "";
}

// Reset form and results
function resetAll() {
  ["dob-day", "dob-month", "dob-year", "asof-day", "asof-month", "asof-year"].forEach(
    (id) => {
      $(id).value = "";
    }
  );

  clearError();

  $("result-years").textContent = "0";
  $("result-months").textContent = "0";
  $("result-days").textContent = "0";
  $("result-total-days").textContent = "0";
  $("result-weeks").textContent = "0";
  $("result-total-months").textContent = "0";
  $("result-next-birthday").textContent = "—";
  $("result-next-countdown").textContent = "—";
  $("result-asof-label").textContent = "—";
  $("result-status").textContent = "Waiting for input…";
}

// Footer year
function setFooterYear() {
  const yearSpan = $("footer-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

// Bind events
document.addEventListener("DOMContentLoaded", function () {
  $("calculate-btn").addEventListener("click", function (e) {
    e.preventDefault();
    calculateAge();
  });

  $("reset-btn").addEventListener("click", function (e) {
    e.preventDefault();
    resetAll();
  });

  setFooterYear();
});
