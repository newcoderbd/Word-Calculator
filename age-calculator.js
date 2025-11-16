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
  // Manual date inputs
  const dobDayInput = document.getElementById("dob-day");
  const dobMonthInput = document.getElementById("dob-month");
  const dobYearInput = document.getElementById("dob-year");

  const asOfDayInput = document.getElementById("asof-day");
  const asOfMonthInput = document.getElementById("asof-month");
  const asOfYearInput = document.getElementById("asof-year");

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

  function buildDateFromInputs(dayInput, monthInput, yearInput, allowEmpty) {
    const dayStr = dayInput.value.trim();
    const monthStr = monthInput.value.trim();
    const yearStr = yearInput.value.trim();

    const allEmpty = !dayStr && !monthStr && !yearStr;

    if (allowEmpty && allEmpty) {
      return null; // caller will decide (e.g. use today)
    }

    if (!dayStr || !monthStr || !yearStr) {
      throw new Error("Please fill day, month and year.");
    }

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (
      isNaN(day) ||
      isNaN(month) ||
      isNaN(year) ||
      year < 1900 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new Error("Please enter a valid date.");
    }

    const date = new Date(year, month - 1, day);

    // Validate that JS did not auto-correct invalid dates
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error("The date you entered is not valid.");
    }

    return date;
  }

  function formatDateLabel(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function calculateAge() {
    try {
      // Build DOB (required)
      const dob = buildDateFromInputs(dobDayInput, dobMonthInput, dobYearInput, false);

      // Build as-of (optional, if empty -> today)
      let asOf = null;
      try {
        asOf = buildDateFromInputs(asOfDayInput, asOfMonthInput, asOfYearInput, true);
      } catch (err) {
        // If user partially filled but invalid, show message
        alert(err.message);
        statusLabelEl.textContent = err.message;
        return;
      }

      if (!asOf) {
        asOf = new Date();
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
      const nbMonthLabel = nextBirthday.toLocaleString("en-US", { month: "short" });
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

      nextBirthdayEl.textContent = `${nbDay}-${nbMonthLabel}-${nbYear}`;
      timeUntilEl.textContent = `${yearsUntil} years, ${monthsUntil} months, ${daysUntil} days (${diffNextDays} days)`;

      asOfLabelEl.textContent = formatDateLabel(asOf);
      statusLabelEl.textContent = "Age calculated successfully.";
      showAgeToast("Age calculated successfully");
    } catch (err) {
      alert(err.message || "Something went wrong.");
      statusLabelEl.textContent = err.message || "Error calculating age.";
    }
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
