function showIntToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {

  const pAmount = document.getElementById("pAmount");
  const iRate = document.getElementById("iRate");
  const iTime = document.getElementById("iTime");
  const iType = document.getElementById("iType");
  const iFreq = document.getElementById("iFreq");

  const interestOut = document.getElementById("interestOut");
  const maturityOut = document.getElementById("maturityOut");
  const principalOut = document.getElementById("principalOut");
  const rateOut = document.getElementById("rateOut");
  const timeOut = document.getElementById("timeOut");

  const intCalcBtn = document.getElementById("intCalcBtn");
  const intResetBtn = document.getElementById("intResetBtn");

  function resetValues() {
    interestOut.textContent = "0";
    maturityOut.textContent = "0";
    principalOut.textContent = "0";
    rateOut.textContent = "0%";
    timeOut.textContent = "0";
    showIntToast("Form reset");
  }

  function calculateInterest() {
    const P = parseFloat(pAmount.value);
    const R = parseFloat(iRate.value);
    const T = parseFloat(iTime.value);
    const type = iType.value;
    const freq = parseInt(iFreq.value);

    if (!P || !R || !T) {
      alert("Please fill all fields correctly");
      return;
    }

    let interest = 0;
    let maturity = 0;

    if (type === "simple") {
      interest = (P * R * T) / 100;
      maturity = P + interest;
    } 
    else {
      const ratePer = R / 100 / freq;
      const total = P * Math.pow(1 + ratePer, freq * T);
      maturity = total;
      interest = total - P;
    }

    interestOut.textContent = interest.toFixed(2);
    maturityOut.textContent = maturity.toFixed(2);

    principalOut.textContent = P;
    rateOut.textContent = R + "%";
    timeOut.textContent = T;

    showIntToast("Interest calculated");
  }

  intCalcBtn.addEventListener("click", calculateInterest);
  intResetBtn.addEventListener("click", resetValues);
});
