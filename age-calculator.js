// -------- Utility: read dates from three fields --------
function getDateFromParts(dayId, monthId, yearId, allowAllEmpty) {
  const dayStr = document.getElementById(dayId).value.trim();
  const monthStr = document.getElementById(monthId).value.trim();
  const yearStr = document.getElementById(yearId).value.trim();

  const allEmpty = !dayStr && !monthStr && !yearStr;

  if (allEmpty && allowAllEmpty) {
    // means "use today"
    return null;
  }

  // some fields filled, some empty → invalid
  if (!dayStr || !monthStr || !yearStr) {
    alert("Please fill day, month and year for this date.");
    return undefined;
  }

  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const year = parseInt(yearStr, 10);

  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    year < 100 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    alert("Please enter a valid date (day, month, year).");
    return undefined;
  }

  // JS months are 0-based
  const date = new Date(year, month - 1, day);

  // invalid (e.g. 31-Feb) check
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    alert("The date you entered is not valid. Please check it again.");
    return undefined;
  }

  return date;
}

// -------- Age differences in Y/M/D --------
function diffYMD(dob, asOf) {
  let years = asOf.getFullYear() - dob.getFullYear();
  let months = asOf.getMonth() - dob.getMonth();
  let days = asOf.getDate() - dob.getDate();

  if (days < 0) {
    // borrow days from previous month
    const prevMonthLastDay = new Date(
      asOf.getFullYear(),
      asOf.getMonth(),
      0
    ).getDate();
    days += prevMonthLastDay;
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days };
}

// -------- Helpers --------
function daysBetween(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const end = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((end - start) / oneDay);
}

function getNextBirthday(dob, asOf) {
  let year = asOf.getFullYear();
  let next = new Date(year, dob.getMonth(), dob.getDate());

  if (next < asOf) {
    year++;
    next = new Date(year, dob.getMonth(), dob.getDate());
  }

  const daysUntil = daysBetween(asOf, next);
  return { date: next, daysUntil };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// -------- Main calculation --------
function calculateAge() {
  const dob = getDateFromParts("dob-day", "dob-month", "dob-year", false);
  if (dob === undefined) return;

  let asOf = getDateFromParts("asof-day", "asof-month", "asof-year", true);
  if (asOf === undefined) return;

  if (asOf === null) {
    asOf = new Date(); // today
  }

  if (asOf < dob) {
    alert('"As of" date cannot be before the date of birth.');
    return;
  }

  const { years, months, days } = diffYMD(dob, asOf);
  const totalDays = daysBetween(dob, asOf);
  const weeks = Math.floor(totalDays / 7);
  const approxMonths = Math.round(totalDays / 30.4375);

  const { date: nextBday, daysUntil } = getNextBirthday(dob, asOf);

  // Breakdown
  setText("years-output", years);
  setText("months-output", months);
  setText("days-output", days);

  // Totals
  setText("total-days-output", totalDays.toLocaleString());
  setText("weeks-output", weeks.toLocaleString());
  setText("approx-months-output", approxMonths.toLocaleString());

  // Next birthday
  setText("next-birthday-date-output", formatDate(nextBday));
  setText("next-birthday-until-output", `${daysUntil} day(s)`);

  // Quick info
  setText("as-of-date-output", formatDate(asOf));
  setText("status-output", "Age calculated successfully.");
}

// -------- Reset --------
function resetForm() {
  const ids = [
    "dob-day",
    "dob-month",
    "dob-year",
    "asof-day",
    "asof-month",
    "asof-year",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") {
      el.value = "";
    } else {
      el.value = "";
    }
  });

  setText("years-output", "0");
  setText("months-output", "0");
  setText("days-output", "0");
  setText("total-days-output", "0");
  setText("weeks-output", "0");
  setText("approx-months-output", "0");
  setText("next-birthday-date-output", "—");
  setText("next-birthday-until-output", "—");
  setText("as-of-date-output", "—");
  setText("status-output", "Waiting for input…");
}

// -------- Event listeners --------
document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById("calculate-btn");
  const resetBtn = document.getElementById("reset-btn");

  if (calcBtn) calcBtn.addEventListener("click", calculateAge);
  if (resetBtn) resetBtn.addEventListener("click", resetForm);
});
