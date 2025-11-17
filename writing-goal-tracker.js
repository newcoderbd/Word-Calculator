document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const goalTypeEl = document.getElementById("goalType");
  const goalPeriodEl = document.getElementById("goalPeriod");
  const goalAmountEl = document.getElementById("goalAmount");
  const completedAmountEl = document.getElementById("completedAmount");

  const calculateBtn = document.getElementById("wgtCalculateBtn");
  const resetBtn = document.getElementById("wgtResetBtn");

  const goalSummaryEl = document.getElementById("wgtGoalSummary");
  const progressTextEl = document.getElementById("wgtProgressText");
  const progressFillEl = document.getElementById("wgtProgressFill");
  const progressPercentEl = document.getElementById("wgtProgressPercent");
  const remainingTextEl = document.getElementById("wgtRemainingText");
  const statusEl = document.getElementById("wgtStatus");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const STORAGE_KEY = "wc_writing_goal_tracker";

  function formatUnit(type, value) {
    const n = Number(value);
    if (type === "words") {
      return n === 1 ? "word" : "words";
    }
    if (type === "minutes") {
      return n === 1 ? "minute" : "minutes";
    }
    return "";
  }

  function saveState() {
    const data = {
      goalType: goalTypeEl.value,
      goalPeriod: goalPeriodEl.value,
      goalAmount: goalAmountEl.value,
      completedAmount: completedAmountEl.value,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore storage errors
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.goalType) goalTypeEl.value = data.goalType;
      if (data.goalPeriod) goalPeriodEl.value = data.goalPeriod;
      if (data.goalAmount) goalAmountEl.value = data.goalAmount;
      if (data.completedAmount) completedAmountEl.value = data.completedAmount;

      if (data.goalAmount) {
        calculateProgress();
      }
    } catch (e) {
      // ignore
    }
  }

  function calculateProgress() {
    const goalType = goalTypeEl.value;
    const goalPeriod = goalPeriodEl.value;
    const goalAmount = Number(goalAmountEl.value);
    const completedAmount = Number(completedAmountEl.value || 0);

    if (!goalAmount || goalAmount <= 0) {
      goalSummaryEl.textContent = "—";
      progressTextEl.textContent = "Please enter a valid goal amount.";
      progressFillEl.style.width = "0%";
      progressPercentEl.textContent = "0%";
      remainingTextEl.textContent = "—";
      statusEl.textContent = "Goal amount must be greater than zero.";
      return;
    }

    const safeCompleted = completedAmount < 0 ? 0 : completedAmount;

    const unitLabel = formatUnit(goalType, goalAmount);
    const periodLabel =
      goalPeriod === "daily"
        ? "per day"
        : goalPeriod === "weekly"
        ? "per week"
        : "per month";

    goalSummaryEl.textContent = `${goalAmount} ${unitLabel} ${periodLabel}`;

    const progressPercentRaw = (safeCompleted / goalAmount) * 100;
    const progressPercent =
      progressPercentRaw < 0 ? 0 : progressPercentRaw > 999 ? 999 : progressPercentRaw;

    const displayPercent = progressPercent > 100 ? 100 : progressPercent;

    progressFillEl.style.width = `${displayPercent}%`;
    progressPercentEl.textContent = `${Math.round(progressPercent)}%`;

    const usedUnit = formatUnit(goalType, safeCompleted);
    progressTextEl.textContent = `${safeCompleted} ${usedUnit} completed out of ${goalAmount} ${unitLabel}.`;

    const remaining = goalAmount - safeCompleted;

    if (remaining > 0) {
      const remainingUnit = formatUnit(goalType, remaining);
      remainingTextEl.textContent = `${remaining} ${remainingUnit} remaining to reach your goal.`;

      if (progressPercent <= 30) {
        statusEl.textContent = "You're just getting started. Keep writing!";
      } else if (progressPercent <= 70) {
        statusEl.textContent = "Nice progress! Stay consistent and you'll hit your goal.";
      } else {
        statusEl.textContent = "You're very close. A final push will complete your goal!";
      }
    } else {
      const extra = Math.abs(remaining);
      const extraText =
        extra > 0
          ? `You've exceeded your goal by ${extra} ${formatUnit(goalType, extra)}. `
          : "";
      remainingTextEl.textContent = "No remaining amount — goal completed!";
      statusEl.textContent = `${extraText}Excellent work! You've reached your writing goal.`;
    }

    saveState();
  }

  function resetForm() {
    goalAmountEl.value = "";
    completedAmountEl.value = "";
    progressFillEl.style.width = "0%";
    progressPercentEl.textContent = "0%";
    goalSummaryEl.textContent = "—";
    progressTextEl.textContent = "—";
    remainingTextEl.textContent = "—";
    statusEl.textContent = "Set your goal to see details.";

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  calculateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    calculateProgress();
  });

  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
  });

  loadState();
});
