function showEmiToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const currencyLabelSelect = document.getElementById("currencyLabel");

  const loanAmountInput = document.getElementById("loanAmount");
  const interestRateInput = document.getElementById("interestRate");
  const loanTenureInput = document.getElementById("loanTenure");
  const tenureTypeSelect = document.getElementById("tenureType");
  const processingFeeInput = document.getElementById("processingFee");

  const emiCalcBtn = document.getElementById("emiCalcBtn");
  const emiResetBtn = document.getElementById("emiResetBtn");

  const emiValueEl = document.getElementById("emiValue");
  const tenureSummaryEl = document.getElementById("tenureSummary");
  const principalOutEl = document.getElementById("principalOut");
  const totalInterestOutEl = document.getElementById("totalInterestOut");
  const totalPaymentOutEl = document.getElementById("totalPaymentOut");
  const interestShareOutEl = document.getElementById("interestShareOut");

  const emiChip = document.getElementById("emiChip");
  const emiChipText = document.getElementById("emiChipText");
  const emiPointerEl = document.getElementById("emiPointer");

  const footerYearEl = document.getElementById("pf-year");
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  function formatMoney(value, currencySymbol) {
    const rounded = Math.round(value);
    const withGroup = rounded.toLocaleString("en-US");
    if (!currencySymbol) return withGroup;
    return currencySymbol + " " + withGroup;
  }

  function resetOutputs(showToast = true) {
    const currencySymbol = currencyLabelSelect.value || "";

    emiValueEl.textContent = formatMoney(0, currencySymbol);
    tenureSummaryEl.textContent = "0";

    principalOutEl.textContent = formatMoney(0, currencySymbol);
    totalInterestOutEl.textContent = formatMoney(0, currencySymbol);
    totalPaymentOutEl.textContent = formatMoney(0, currencySymbol);
    interestShareOutEl.textContent = "0%";

    emiChip.style.display = "none";
    emiPointerEl.style.left = "0%";

    if (showToast) {
      showEmiToast("Form reset");
    }
  }

  function getInputs() {
    const principal = parseFloat(loanAmountInput.value);
    const annualRate = parseFloat(interestRateInput.value);
    const tenureValue = parseInt(loanTenureInput.value, 10);
    const tenureType = tenureTypeSelect.value;
    const fee = parseFloat(processingFeeInput.value) || 0;
    const currencySymbol = currencyLabelSelect.value || "";

    if (isNaN(principal) || principal <= 0) {
      alert("Please enter a valid loan amount.");
      return null;
    }
    if (isNaN(annualRate) || annualRate < 0) {
      alert("Please enter a valid interest rate.");
      return null;
    }
    if (isNaN(tenureValue) || tenureValue <= 0) {
      alert("Please enter a valid loan tenure.");
      return null;
    }

    let months;
    if (tenureType === "years") {
      months = tenureValue * 12;
    } else {
      months = tenureValue;
    }

    return {
      principal,
      annualRate,
      months,
      fee,
      currencySymbol
    };
  }

  function calculateEmi() {
    const data = getInputs();
    if (!data) return;

    let { principal, annualRate, months, fee, currencySymbol } = data;

    const monthlyRate = annualRate / 12 / 100;

    let emi;
    if (annualRate === 0) {
      // No interest simple division
      emi = principal / months;
    } else {
      const pow = Math.pow(1 + monthlyRate, months);
      emi = (principal * monthlyRate * pow) / (pow - 1);
    }

    if (!isFinite(emi) || emi <= 0) {
      alert("Unable to calculate EMI with the given inputs.");
      return;
    }

    const totalPayment = emi * months + fee;
    const totalInterest = totalPayment - principal - fee;

    const interestShare = totalPayment > 0
      ? (totalInterest / totalPayment) * 100
      : 0;

    const emiRatio = emi / principal;
    let intensity = emiRatio * 100;
    if (intensity < 0) intensity = 0;
    if (intensity > 100) intensity = 100;

    emiValueEl.textContent = formatMoney(emi, currencySymbol);
    tenureSummaryEl.textContent = String(months);

    principalOutEl.textContent = formatMoney(principal, currencySymbol);
    totalInterestOutEl.textContent = formatMoney(totalInterest, currencySymbol);
    totalPaymentOutEl.textContent = formatMoney(totalPayment, currencySymbol);
    interestShareOutEl.textContent = Math.round(interestShare) + "%";

    emiChip.style.display = "inline-flex";

    let chipText;
    if (intensity < 1.5) {
      chipText = "Light EMI relative to loan size";
      emiChip.style.background = "rgba(34,197,94,0.18)";
      emiChip.style.borderColor = "rgba(34,197,94,0.7)";
      emiChip.style.color = "#bbf7d0";
    } else if (intensity < 3.0) {
      chipText = "Moderate EMI relative to loan size";
      emiChip.style.background = "rgba(59,130,246,0.16)";
      emiChip.style.borderColor = "rgba(59,130,246,0.6)";
      emiChip.style.color = "#bfdbfe";
    } else {
      chipText = "Heavy EMI relative to loan size";
      emiChip.style.background = "rgba(239,68,68,0.16)";
      emiChip.style.borderColor = "rgba(239,68,68,0.7)";
      emiChip.style.color = "#fecaca";
    }
    emiChipText.textContent = chipText;

    emiPointerEl.style.left = intensity + "%";

    showEmiToast("Loan & EMI calculated successfully");
  }

  function resetAll() {
    loanAmountInput.value = "";
    interestRateInput.value = "";
    loanTenureInput.value = "";
    tenureTypeSelect.value = "years";
    processingFeeInput.value = "";
    currencyLabelSelect.value = "৳";

    resetOutputs(true);
  }

  if (emiCalcBtn) {
    emiCalcBtn.addEventListener("click", calculateEmi);
  }
  if (emiResetBtn) {
    emiResetBtn.addEventListener("click", resetAll);
  }

  currencyLabelSelect.addEventListener("change", () => {
    resetOutputs(false);
  });

  resetOutputs(false);
});
