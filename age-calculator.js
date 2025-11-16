// Simple helper to show toast if #toast exists
function showAgeToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// DOM ready
document.addEventListener("DOMContentLoaded", function () {
  const dobInput = document.getElementById("dob");
  const asOfInput = document.getElementById("asOf");
  const calculateBtn = document.getElementById("calculateBtn");
  const resetBtn = document.getElementById("resetBtn");

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

  function calculateAge() {
    if (!dobInput.value) {
      alert("Please select your date of birth.");
      statusLabelEl.textContent = "Waiting for date of birth…";
      return;
    }

    const dob = new Date(dobInput.value);
    let asOf = asOfInput.value ? new Date(asOfInput.value) : new Date();

    if (isNaN(dob.getTime())) {
      alert("Invalid date of birth.");
      statusLabelEl.textContent = "Invalid date of birth.";
      return;
    }

    if (isNaN(asOf.getTime())) {
      alert("Invalid 'as of' date.");
      statusLabelEl.textContent = "Invalid as-of date.";
      return;
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

    // Totals
    const diffMs = asOf.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const approxMonths = Math.floor(totalDays / 30.4375); // average month length

    // Next birthday
    let nextBirthday = new Date(asOf.getFullYear(), dob.getMonth(), dob.getDate());

    if (nextBirthday <= asOf) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    const diffNextMs = nextBirthday.getTime() - asOf.getTime();
    const diffNextDays = Math.ceil(diffNextMs / (1000 * 60 * 60 * 24));

    const nbYear = nextBirthday.getFullYear();
    const nbMonth = nextBirthday.toLocaleString("en-US", { month: "short" });
    const nbDay = String(nextBirthday.getDate()).padStart(2, "0");

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

    nextBirthdayEl.textContent = `${nbDay}-${nbMonth}-${nbYear}`;
    timeUntilEl.textContent = `${yearsUntil} years, ${monthsUntil} months, ${daysUntil} days (${diffNextDays} days)`;

    if (asOfInput.value) {
      asOfLabelEl.textContent = asOfInput.value;
    } else {
      asOfLabelEl.textContent = "Today";
    }

    statusLabelEl.textContent = "Age calculated successfully.";
    showAgeToast("Age calculated successfully");
  }

  function resetAgeCalculator() {
    dobInput.value = "";
    asOfInput.value = "";

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
