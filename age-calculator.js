// Simple helper to show toast if #toast exists
function showAgeToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  // Inputs: date of birth
  const dobDayInput = document.getElementById("dobDay");
  const dobMonthInput = document.getElementById("dobMonth");
  const dobYearInput = document.getElementById("dobYear");

  // Inputs: as-of date
  const asOfDayInput = document.getElementById("asOfDay");
  const asOfMonthInput = document.getElementById("asOfMonth");
  const asOfYearInput = document.getElementById("asOfYear");

  const calculateBtn = document.getElementById("calculateBtn");
  const resetBtn = document.getElementById("resetBtn");

  // Result elements
  const yearsEl = document.getElementById("years");
  const monthsEl = document.getElementById("months");
  const daysEl = document.getElementById("days");
  const totalDaysEl = document.getElementById("totalDays");
  const weeksEl = document.getElementById("weeks");
  const approxMonthsEl = document.getElementById("approxMonths");
  const nextBirthdayEl = document.getElementById("nextBirthday");
  const timeUntilEl = document.getElementById("timeUntil");
  const asOfLabelEl = document.getElementById("asOfLabel");
  const statusLabelEl = document.getElementById("statusLabel");
  const footerYearEl = document.getElementById("pf-year");

  // Set footer year
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function formatNumber(value) {
    return value.toLocaleString("en-US");
  }

  // Build Date from separate fields (day/month/year)
  function buildDateFromParts(dayStr, monthStr, yearStr) {
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    if (month < 1 || month > 12) {
      return null;
    }

    if (year < 1900 || year > 9999) {
      return null;
    }

    const date = new Date(year, month - 1, day);

    // Validate (avoid invalid like 31-Feb)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function formatDisplayDate(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function calculateAge() {
    // Validate DOB fields
    if (
      !dobDayInput.value.trim() ||
      !dobMonthInput.value.trim() ||
      !dobYearInput.value.trim()
    ) {
      alert("Please enter a valid date of birth (day, month and year).");
      statusLabelEl.textContent = "Waiting for a valid date of birth…";
      return;
    }

    const dob = buildDateFromParts(
      dobDayInput.value,
      dobMonthInput.value,
      dobYearInput.value
    );

    if (!dob) {
      alert("Invalid date of birth. Please check the day, month and year.");
      statusLabelEl.textContent = "Invalid date of birth.";
      return;
    }

    // As-of date: either empty (use today) or fully filled and valid
    let asOf;
    const asOfAllEmpty =
      !asOfDayInput.value.trim() &&
      !asOfMonthInput.value.trim() &&
      !asOfYearInput.value.trim();

    if (asOfAllEmpty) {
      asOf = new Date();
    } else {
      if (
        !asOfDayInput.value.trim() ||
        !asOfMonthInput.value.trim() ||
        !asOfYearInput.value.trim()
      ) {
        alert(
          "Please either leave all 'as of' fields empty or fill all three (day, month and year)."
        );
        statusLabelEl.textContent = "Incomplete as-of date.";
        return;
      }

      asOf = buildDateFromParts(
        asOfDayInput.value,
        asOfMonthInput.value,
        asOfYearInput.value
      );

      if (!asOf) {
        alert("Invalid 'as of' date. Please check the values.");
        statusLabelEl.textContent = "Invalid as-of date.";
        return;
      }
    }

    if (asOf < dob) {
      alert("'As of' date must be on or after the date of birth.");
      statusLabelEl.textContent = "As-of date is before date of birth.";
      return;
    }

    // Years / months / days breakdown
    let years = asOf.getFullYear() - dob.getFullYear();
    let months = asOf.getMonth() - dob.getMonth();
    let days = asOf.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthIndex = (asOf.getMonth() - 1 + 12) % 12;
      const prevMonthYear =
        prevMonthIndex === 11 ? asOf.getFullYear() - 1 : asOf.getFullYear();
      days += daysInMonth(prevMonthYear, prevMonthIndex);
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total days / weeks / approximate months
    const diffMs = asOf.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const approxMonths = Math.floor(totalDays / 30.4375); // average month length

    // Next birthday
    let nextBirthday = new Date(
      asOf.getFullYear(),
      dob.getMonth(),
      dob.getDate()
    );

    if (nextBirthday <= asOf) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    const diffNextMs = nextBirthday.getTime() - asOf.getTime();
    const diffNextDays = Math.ceil(diffNextMs / (1000 * 60 * 60 * 24));

    let monthsUntil = nextBirthday.getMonth() - asOf.getMonth();
    let daysUntil = nextBirthday.getDate() - asOf.getDate();
    let yearsUntil = nextBirthday.getFullYear() - asOf.getFullYear();

    if (daysUntil < 0) {
      monthsUntil -= 1;
      const prevMonthIndex2 = (nextBirthday.getMonth() - 1 + 12) % 12;
      const prevMonthYear2 =
        prevMonthIndex2 === 11
          ? nextBirthday.getFullYear() - 1
          : nextBirthday.getFullYear();
      daysUntil += daysInMonth(prevMonthYear2, prevMonthIndex2);
    }

    if (monthsUntil < 0) {
      yearsUntil -= 1;
      monthsUntil += 12;
    }

    // Update UI
    yearsEl.textContent = years;
    monthsEl.textContent = months;
    daysEl.textContent = days;

    totalDaysEl.textContent = formatNumber(totalDays);
    weeksEl.textContent = formatNumber(weeks);
    approxMonthsEl.textContent = formatNumber(approxMonths);

    nextBirthdayEl.textContent = formatDisplayDate(nextBirthday);
    timeUntilEl.textContent = `${yearsUntil} years, ${monthsUntil} months, ${daysUntil} days (${diffNextDays} days)`;

    if (asOfAllEmpty) {
      asOfLabelEl.textContent = "Today";
    } else {
      asOfLabelEl.textContent = formatDisplayDate(asOf);
    }

    statusLabelEl.textContent = "Age calculated successfully.";
    showAgeToast("Age calculated successfully");
  }

  function resetAgeCalculator() {
    dobDayInput.value = "";
    dobMonthInput.value = "";
    dobYearInput.value = "";
    asOfDayInput.value = "";
    asOfMonthInput.value = "";
    asOfYearInput.value = "";

    yearsEl.textContent = "0";
    monthsEl.textContent = "0";
    daysEl.textContent = "0";
    totalDaysEl.textContent = "0";
    weeksEl.textContent = "0";
    approxMonthsEl.textContent = "0";
    nextBirthdayEl.textContent = "—";
    timeUntilEl.textContent = "—";
    asOfLabelEl.textContent = "Today";
    statusLabelEl.textContent = "Waiting for input…";
    showAgeToast("Form reset");
  }

  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateAge);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAgeCalculator);
  }
});
