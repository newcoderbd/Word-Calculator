function showRtToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const textEl = document.getElementById("rtText");
  const wpmEl = document.getElementById("rtWpm");
  const manualCountEl = document.getElementById("rtWordCount");

  const resultMainEl = document.getElementById("rtResultMain");
  const resultSecondaryEl = document.getElementById("rtResultSecondary");
  const charCountEl = document.getElementById("rtCharCount");
  const wordCountStatEl = document.getElementById("rtWordCountStat");
  const wpmStatEl = document.getElementById("rtWpmStat");
  const categoryEl = document.getElementById("rtCategory");

  const fromTextBtn = document.getElementById("rtFromTextBtn");
  const fromCountBtn = document.getElementById("rtFromCountBtn");
  const copyStatsBtn = document.getElementById("rtCopyStatsBtn");
  const clearBtn = document.getElementById("rtClearBtn");

  const footerYearEl = document.getElementById("pf-year");
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  function getWordCountFromText(text) {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function normalizeWpm(value) {
    let wpm = parseInt(value, 10);
    if (isNaN(wpm) || wpm <= 0) {
      wpm = 200;
    }
    if (wpm < 50) wpm = 50;
    if (wpm > 1000) wpm = 1000;
    return wpm;
  }

  function calculateReadingTime(wordCount, wpm) {
    if (wordCount <= 0) {
      return {
        minutes: 0,
        seconds: 0,
        totalMinutes: 0,
      };
    }

    const totalMinutes = wordCount / wpm;
    let minutes = Math.floor(totalMinutes);
    let seconds = Math.round((totalMinutes - minutes) * 60);

    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }

    if (minutes === 0 && seconds === 0 && wordCount > 0) {
      seconds = 1;
    }

    return { minutes, seconds, totalMinutes };
  }

  function getCategory(wordCount) {
    if (wordCount === 0) return "";
    if (wordCount < 300) return "Very short — quick read.";
    if (wordCount < 800) return "Short article — easy to skim.";
    if (wordCount < 1500) return "Medium article — good for a blog post.";
    if (wordCount < 2500) return "Long article — in-depth reading.";
    return "Very long article — consider splitting into sections.";
  }

  function updateStats(chars, words, wpm) {
    charCountEl.textContent = String(chars);
    wordCountStatEl.textContent = String(words);
    wpmStatEl.textContent = String(wpm);
    categoryEl.textContent = getCategory(words);
  }

  function renderResult(wordCount, wpm) {
    const chars = textEl.value.length;
    const { minutes, seconds, totalMinutes } = calculateReadingTime(
      wordCount,
      wpm
    );

    if (wordCount === 0) {
      resultMainEl.textContent =
        "Enter text or a word count to estimate reading time.";
      resultSecondaryEl.textContent = "";
      updateStats(0, 0, wpm);
      return;
    }

    let main = "Approximate reading time: ";
    if (minutes > 0) {
      main +=
        minutes +
        " minute" +
        (minutes === 1 ? "" : "s") +
        (seconds > 0 ? " " : "");
    }
    if (seconds > 0) {
      main += seconds + " second" + (seconds === 1 ? "" : "s");
    }

    resultMainEl.innerHTML =
      '<span class="rt-result-highlight">' + main + "</span>";

    const roundedMinutes =
      totalMinutes < 1 ? "< 1 minute" : totalMinutes.toFixed(1) + " minutes";

    resultSecondaryEl.textContent =
      "Based on " +
      wordCount +
      " words at " +
      wpm +
      " words per minute (" +
      roundedMinutes +
      ").";

    updateStats(chars, wordCount, wpm);
  }

  function calculateFromText() {
    const text = textEl.value || "";
    const wpm = normalizeWpm(wpmEl.value);
    wpmEl.value = String(wpm);

    const wordCount = getWordCountFromText(text);
    renderResult(wordCount, wpm);
    showRtToast("Reading time calculated from text.");
  }

  function calculateFromManualCount() {
    const rawCount = manualCountEl.value;
    const wpm = normalizeWpm(wpmEl.value);
    wpmEl.value = String(wpm);

    const wordCount = Math.max(0, parseInt(rawCount || "0", 10) || 0);
    renderResult(wordCount, wpm);
    showRtToast("Reading time calculated from manual word count.");
  }

  async function copySummary() {
    const mainText = resultMainEl.textContent.trim();
    const secondaryText = resultSecondaryEl.textContent.trim();
    if (!mainText) {
      showRtToast("Nothing to copy yet.");
      return;
    }

    const summary = mainText + (secondaryText ? "\n" + secondaryText : "");
    try {
      await navigator.clipboard.writeText(summary);
      showRtToast("Reading time summary copied.");
    } catch (err) {
      showRtToast("Clipboard not available in this browser.");
    }
  }

  function clearAll() {
    textEl.value = "";
    manualCountEl.value = "";
    resultMainEl.textContent =
      "Enter text or word count to see the estimated reading time.";
    resultSecondaryEl.textContent = "";
    categoryEl.textContent = "";
    updateStats(0, 0, normalizeWpm(wpmEl.value));
    showRtToast("Cleared.");
  }

  textEl.addEventListener("input", () => {
    const text = textEl.value || "";
    const words = getWordCountFromText(text);
    const chars = text.length;
    const wpm = normalizeWpm(wpmEl.value);
    updateStats(chars, words, wpm);
  });

  fromTextBtn.addEventListener("click", () => {
    calculateFromText();
  });

  fromCountBtn.addEventListener("click", () => {
    calculateFromManualCount();
  });

  copyStatsBtn.addEventListener("click", () => {
    copySummary();
  });

  clearBtn.addEventListener("click", () => {
    clearAll();
  });

  // Initial state
  updateStats(0, 0, normalizeWpm(wpmEl.value));
});
