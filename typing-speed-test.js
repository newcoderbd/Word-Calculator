document.addEventListener("DOMContentLoaded", () => {

  const tsDisplay = document.getElementById("tsDisplay");
  const tsInput = document.getElementById("tsInput");
  const tsStartBtn = document.getElementById("tsStartBtn");
  const tsRestartBtn = document.getElementById("tsRestartBtn");

  const tsTimer = document.getElementById("tsTimer");
  const tsWpm = document.getElementById("tsWpm");
  const tsAccuracy = document.getElementById("tsAccuracy");
  const tsCorrect = document.getElementById("tsCorrect");
  const tsWrong = document.getElementById("tsWrong");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  let words = [];
  let timeLeft = 60;
  let timerInterval = null;

  let correctKeys = 0;
  let wrongKeys = 0;

  // Random typing text (short + simple)
  const typingTexts = [
    "The quick brown fox jumps over the lazy dog",
    "Typing speed tests help you practice fast writing",
    "Improve your accuracy by focusing on each word",
    "Practice makes perfect in typing and writing",
    "Keep your eyes on the screen and type smoothly"
  ];

  function loadRandomText() {
    const random = typingTexts[Math.floor(Math.random() * typingTexts.length)];
    words = random.split(" ");
    tsDisplay.innerHTML = words.map(w => `<span class="word-default">${w}</span>`).join(" ");
  }

  function startTest() {
    loadRandomText();
    tsInput.disabled = false;
    tsInput.focus();
    tsInput.value = "";

    timeLeft = 60;
    tsTimer.textContent = timeLeft;

    correctKeys = 0;
    wrongKeys = 0;

    tsCorrect.textContent = 0;
    tsWrong.textContent = 0;

    tsWpm.textContent = 0;
    tsAccuracy.textContent = "0%";

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    timeLeft--;
    tsTimer.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      tsInput.disabled = true;
      calculateResults();
    }
  }

  function compareWords() {
    const userWords = tsInput.value.trim().split(" ");

    const displaySpans = tsDisplay.querySelectorAll("span");

    displaySpans.forEach((span, index) => {
      const userWord = userWords[index] || "";
      const actual = words[index];

      if (userWord === "") {
        span.className = "word-default";
      } else if (userWord === actual) {
        span.className = "word-correct";
      } else {
        span.className = "word-wrong";
      }
    });
  }

  function calculateResults() {
    const userWords = tsInput.value.trim().split(" ");
    let goodWords = 0;

    userWords.forEach((w, i) => {
      if (w === words[i]) {
        goodWords++;
      }
    });

    const wpm = goodWords;
    tsWpm.textContent = wpm;

    const totalKeys = correctKeys + wrongKeys;
    const accuracy = totalKeys === 0 
      ? 0 
      : Math.round((correctKeys / totalKeys) * 100);

    tsAccuracy.textContent = accuracy + "%";
  }

  tsInput.addEventListener("input", (e) => {
    const inputValue = tsInput.value;

    const lastChar = inputValue[inputValue.length - 1];

    if (lastChar && /[a-zA-Z0-9 ]/.test(lastChar)) {
      correctKeys++;
    } else {
      wrongKeys++;
    }

    tsCorrect.textContent = correctKeys;
    tsWrong.textContent = wrongKeys;

    compareWords();
  });

  tsStartBtn.addEventListener("click", startTest);
  tsRestartBtn.addEventListener("click", startTest);

});
