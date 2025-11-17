function showBmiToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const unitSystem = document.getElementById("unitSystem");

  const metricFields = document.getElementById("metricFields");
  const imperialFields = document.getElementById("imperialFields");

  const heightCmInput = document.getElementById("heightCm");
  const weightKgInput = document.getElementById("weightKg");

  const heightFtInput = document.getElementById("heightFt");
  const heightInInput = document.getElementById("heightIn");
  const weightLbInput = document.getElementById("weightLb");

  const bmiCalcBtn = document.getElementById("bmiCalcBtn");
  const bmiResetBtn = document.getElementById("bmiResetBtn");

  const bmiValueEl = document.getElementById("bmiValue");
  const bmiCategoryEl = document.getElementById("bmiCategory");
  const bmiCategoryChip = document.getElementById("bmiCategoryChip");
  const bmiCategoryChipText = document.getElementById("bmiCategoryChipText");
  const healthyWeightRangeEl = document.getElementById("healthyWeightRange");
  const bmiPointerEl = document.getElementById("bmiPointer");
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

  function calculateMetricBMI() {
    const heightCm = parseFloat(heightCmInput.value);
    const weightKg = parseFloat(weightKgInput.value);

    if (isNaN(heightCm) || heightCm <= 0) {
      alert("Please enter a valid height in centimeters.");
      return null;
    }
    if (isNaN(weightKg) || weightKg <= 0) {
      alert("Please enter a valid weight in kilograms.");
      return null;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return { bmi, heightM, weightKg };
  }

  function calculateImperialBMI() {
    const heightFt = parseFloat(heightFtInput.value);
    const heightIn = parseFloat(heightInInput.value) || 0;
    const weightLb = parseFloat(weightLbInput.value);

    if (isNaN(heightFt) || heightFt <= 0) {
      alert("Please enter a valid height in feet.");
      return null;
    }
    if (heightIn < 0 || heightIn >= 12) {
      alert("Inches should be between 0 and 11.");
      return null;
    }
    if (isNaN(weightLb) || weightLb <= 0) {
      alert("Please enter a valid weight in pounds.");
      return null;
    }

    const totalInches = heightFt * 12 + heightIn;
    const bmi = (703 * weightLb) / (totalInches * totalInches);

    // Convert to metric to calculate healthy weight range more easily
    const heightM = totalInches * 0.0254;
    const weightKg = weightLb * 0.45359237;

    return { bmi, heightM, weightKg };
  }

  function getBmiCategory(bmi) {
    if (bmi < 18.5) {
      return {
        name: "Underweight",
        colorClass: "underweight",
      };
    } else if (bmi < 25) {
      return {
        name: "Normal weight",
        colorClass: "normal",
      };
    } else if (bmi < 30) {
      return {
        name: "Overweight",
        colorClass: "overweight",
      };
    } else {
      return {
        name: "Obesity",
        colorClass: "obese",
      };
    }
  }

  function updateBmiPointer(bmi) {
    // Map BMI 10–40 to 0–100% range
    const min = 10;
    const max = 40;
    let normalized = ((bmi - min) / (max - min)) * 100;
    if (normalized < 0) normalized = 0;
    if (normalized > 100) normalized = 100;
    bmiPointerEl.style.left = normalized + "%";
  }

  function calculateBmiHandler() {
    let result;
    if (unitSystem.value === "metric") {
      result = calculateMetricBMI();
    } else {
      result = calculateImperialBMI();
    }

    if (!result) {
      return;
    }

    const { bmi, heightM } = result;
    const roundedBmi = Math.round(bmi * 10) / 10;

    const category = getBmiCategory(roundedBmi);

    // Healthy weight range for BMI 18.5–24.9
    const healthyMinKg = 18.5 * heightM * heightM;
    const healthyMaxKg = 24.9 * heightM * heightM;

    // Convert depending on selected system
    let healthyText;
    if (unitSystem.value === "metric") {
      healthyText =
        healthyMinKg.toFixed(1) +
        " – " +
        healthyMaxKg.toFixed(1) +
        " kg";
    } else {
      const minLb = healthyMinKg / 0.45359237;
      const maxLb = healthyMaxKg / 0.45359237;
      healthyText = minLb.toFixed(1) + " – " + maxLb.toFixed(1) + " lb";
    }

    // Update UI
    bmiValueEl.textContent = roundedBmi.toFixed(1);
    bmiCategoryEl.textContent = category.name;
    healthyWeightRangeEl.textContent = healthyText;

    bmiCategoryChip.style.display = "inline-flex";
    bmiCategoryChipText.textContent = category.name;

    // Optional: adjust chip styling based on category
    bmiCategoryChip.style.background =
      category.name === "Normal weight"
        ? "rgba(34,197,94,0.12)"
        : "rgba(239,68,68,0.12)";
    bmiCategoryChip.style.borderColor =
      category.name === "Normal weight"
        ? "rgba(34,197,94,0.5)"
        : "rgba(239,68,68,0.5)";
    bmiCategoryChip.style.color =
      category.name === "Normal weight" ? "#bbf7d0" : "#fecaca";

    updateBmiPointer(roundedBmi);
    showBmiToast("BMI calculated successfully");
  }

  function resetOutputs(showToast = true) {
    bmiValueEl.textContent = "0.0";
    bmiCategoryEl.textContent = "—";
    healthyWeightRangeEl.textContent = "—";
    bmiCategoryChip.style.display = "none";
    bmiPointerEl.style.left = "0%";

    if (showToast) {
      showBmiToast("Form reset");
    }
  }

  function resetAll() {
    heightCmInput.value = "";
    weightKgInput.value = "";
    heightFtInput.value = "";
    heightInInput.value = "";
    weightLbInput.value = "";
    resetOutputs(true);
  }

  if (unitSystem) {
    unitSystem.addEventListener("change", switchUnitSystem);
  }

  if (bmiCalcBtn) {
    bmiCalcBtn.addEventListener("click", calculateBmiHandler);
  }

  if (bmiResetBtn) {
    bmiResetBtn.addEventListener("click", resetAll);
  }
});
