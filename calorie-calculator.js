function showCalToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const unitSystem = document.getElementById("unitSystemCal");

  const metricFields = document.getElementById("metricFieldsCal");
  const imperialFields = document.getElementById("imperialFieldsCal");

  const ageInput = document.getElementById("ageYears");
  const genderSelect = document.getElementById("gender");

  const heightCmInput = document.getElementById("heightCmCal");
  const weightKgInput = document.getElementById("weightKgCal");

  const heightFtInput = document.getElementById("heightFtCal");
  const heightInInput = document.getElementById("heightInCal");
  const weightLbInput = document.getElementById("weightLbCal");

  const activityLevelSelect = document.getElementById("activityLevel");
  const goalSelect = document.getElementById("goalSelect");

  const calcBtn = document.getElementById("calCalcBtn");
  const resetBtn = document.getElementById("calResetBtn");

  const bmrValueEl = document.getElementById("bmrValue");
  const maintenanceCaloriesEl = document.getElementById("maintenanceCalories");
  const goalMaintainEl = document.getElementById("goalMaintain");
  const goalLoseEl = document.getElementById("goalLose");
  const goalGainEl = document.getElementById("goalGain");

  const calCategoryChip = document.getElementById("calCategoryChip");
  const calCategoryChipText = document.getElementById("calCategoryChipText");
  const calPointerEl = document.getElementById("calPointer");

  const footerYearEl = document.getElementById("pf-year");

  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  function switchUnitSystem() {
    const system = unitSystem.value;
    if (system === "metric") {
      metricFields.style.display = "";
      imperialFields.style.display = "none";
    } else {
      metricFields.style.display = "none";
      imperialFields.style.display = "";
    }

    resetOutputs(false);
  }

  function getInputsAsMetric() {
    const age = parseInt(ageInput.value, 10);
    if (isNaN(age) || age < 10 || age > 100) {
      alert("Please enter a valid age between 10 and 100.");
      return null;
    }

    const gender = genderSelect.value === "female" ? "female" : "male";

    let heightCm;
    let weightKg;

    if (unitSystem.value === "metric") {
      const hCm = parseFloat(heightCmInput.value);
      const wKg = parseFloat(weightKgInput.value);

      if (isNaN(hCm) || hCm <= 0) {
        alert("Please enter a valid height in centimeters.");
        return null;
      }
      if (isNaN(wKg) || wKg <= 0) {
        alert("Please enter a valid weight in kilograms.");
        return null;
      }

      heightCm = hCm;
      weightKg = wKg;
    } else {
      const hFt = parseFloat(heightFtInput.value);
      const hIn = parseFloat(heightInInput.value) || 0;
      const wLb = parseFloat(weightLbInput.value);

      if (isNaN(hFt) || hFt <= 0) {
        alert("Please enter a valid height in feet.");
        return null;
      }
      if (hIn < 0 || hIn >= 12) {
        alert("Inches should be between 0 and 11.");
        return null;
      }
      if (isNaN(wLb) || wLb <= 0) {
        alert("Please enter a valid weight in pounds.");
        return null;
      }

      const totalInches = hFt * 12 + hIn;
      heightCm = totalInches * 2.54;
      weightKg = wLb * 0.45359237;
    }

    const activityFactor = parseFloat(activityLevelSelect.value) || 1.2;
    const goal = goalSelect.value || "maintain";

    return {
      age,
      gender,
      heightCm,
      weightKg,
      activityFactor,
      goal,
    };
  }

  function calculateBmrMetric(age, gender, heightCm, weightKg) {
    // Mifflin–St Jeor equation
    if (gender === "female") {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }
  }

  function clampCalories(value) {
    if (!isFinite(value)) return 0;
    // Keep within a reasonable range
    if (value < 800) return 800;
    if (value > 6000) return 6000;
    return value;
  }

  function updateActivityPointer(activityFactor) {
    // Map 1.2–1.9 to 0–100%
    const min = 1.2;
    const max = 1.9;
    let normalized = ((activityFactor - min) / (max - min)) * 100;
    if (normalized < 0) normalized = 0;
    if (normalized > 100) normalized = 100;
    calPointerEl.style.left = normalized + "%";
  }

  function calculateCalories() {
    const data = getInputsAsMetric();
    if (!data) return;

    const { age, gender, heightCm, weightKg, activityFactor, goal } = data;

    let bmr = calculateBmrMetric(age, gender, heightCm, weightKg);
    if (bmr < 0) bmr = 0;

    let maintenance = bmr * activityFactor;

    bmr = clampCalories(bmr);
    maintenance = clampCalories(maintenance);

    // Goal suggestions
    const maintain = maintenance;
    let lose = maintenance - 500;
    let gain = maintenance + 300;

    lose = clampCalories(lose);
    gain = clampCalories(gain);

    // Update UI
    bmrValueEl.textContent = Math.round(bmr) + " kcal/day";
    maintenanceCaloriesEl.textContent = Math.round(maintenance) + " kcal/day";

    goalMaintainEl.textContent = Math.round(maintain) + " kcal/day";
    goalLoseEl.textContent = Math.round(lose) + " kcal/day";
    goalGainEl.textContent = Math.round(gain) + " kcal/day";

    let goalText;
    if (goal === "lose") {
      goalText = "Focus on the 'Lose weight' target";
    } else if (goal === "gain") {
      goalText = "Focus on the 'Gain weight' target";
    } else {
      goalText = "Focus on the 'Maintain' target";
    }

    calCategoryChip.style.display = "inline-flex";
    calCategoryChipText.textContent = goalText;

    // Chip styling based on goal
    if (goal === "lose") {
      calCategoryChip.style.background = "rgba(239,68,68,0.14)";
      calCategoryChip.style.borderColor = "rgba(239,68,68,0.7)";
      calCategoryChip.style.color = "#fecaca";
    } else if (goal === "gain") {
      calCategoryChip.style.background = "rgba(234,179,8,0.18)";
      calCategoryChip.style.borderColor = "rgba(234,179,8,0.7)";
      calCategoryChip.style.color = "#fef9c3";
    } else {
      calCategoryChip.style.background = "rgba(59,130,246,0.16)";
      calCategoryChip.style.borderColor = "rgba(59,130,246,0.6)";
      calCategoryChip.style.color = "#bfdbfe";
    }

    updateActivityPointer(activityFactor);
    showCalToast("Calorie needs calculated successfully");
  }

  function resetOutputs(showToast = true) {
    bmrValueEl.textContent = "0 kcal/day";
    maintenanceCaloriesEl.textContent = "0 kcal/day";
    goalMaintainEl.textContent = "—";
    goalLoseEl.textContent = "—";
    goalGainEl.textContent = "—";
    calCategoryChip.style.display = "none";
    calPointerEl.style.left = "0%";

    if (showToast) {
      showCalToast("Form reset");
    }
  }

  function resetAll() {
    ageInput.value = "";
    genderSelect.value = "male";

    heightCmInput.value = "";
    weightKgInput.value = "";
    heightFtInput.value = "";
    heightInInput.value = "";
    weightLbInput.value = "";

    activityLevelSelect.value = "1.55";
    goalSelect.value = "maintain";

    unitSystem.value = "metric";
    switchUnitSystem();
    resetOutputs(true);
  }

  if (unitSystem) {
    unitSystem.addEventListener("change", switchUnitSystem);
  }

  if (calcBtn) {
    calcBtn.addEventListener("click", calculateCalories);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAll);
  }

  // Initial state
  switchUnitSystem();
  resetOutputs(false);
});
