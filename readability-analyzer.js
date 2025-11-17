(function () {
  "use strict";

  function getElement(id) {
    return document.getElementById(id);
  }

  const inputEl = getElement("rp-input");
  const analyzeBtn = getElement("rp-analyze-btn");
  const clearBtn = getElement("rp-clear-btn");
  const liveCountEl = getElement("rp-live-count");
  const wpmSelect = getElement("rp-wpm");

  const emptyStateEl = getElement("rp-empty-state");
  const resultsContainer = getElement("rp-results");

  const fleschScoreEl = getElement("rp-flesch-score");
  const readingEaseLabelEl = getElement("rp-reading-ease-label");
  const gradeLevelEl = getElement("rp-grade-level");
  const wordCountEl = getElement("rp-word-count");
  const textSummarySubEl = getElement("rp-text-summary-sub");
  const avgWordsSentenceEl = getElement("rp-avg-words-sentence");
  const avgLengthSubEl = getElement("rp-avg-length-sub");

  const readingTimeEl = getElement("rp-reading-time");
  const sentenceCountEl = getElement("rp-sentence-count");
  const syllableCountEl = getElement("rp-syllable-count");

  function countWords(text) {
    const cleaned = text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ");
    if (!cleaned) return 0;
    return cleaned.split(" ").filter(Boolean).length;
  }

  function countCharacters(text) {
    return text.length;
  }

  function countCharactersNoSpaces(text) {
    return text.replace(/\s+/g, "").length;
  }

  function countSentences(text) {
    const normalized = text.replace(/([.!?])+/g, "$1|");
    const parts = normalized.split("|").map((s) => s.trim());
    const filtered = parts.filter((s) => s.length > 0);
    return filtered.length;
  }

  function countParagraphs(text) {
    const parts = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length;
  }

  function countSyllablesInWord(word) {
    const lower = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!lower) return 0;

    if (lower.length <= 3) return 1;

    const endings = [/e$/i, /es$/i, /ed$/i/];
    let tmp = lower;
    endings.forEach((regex) => {
      if (regex.test(tmp)) {
        tmp = tmp.replace(regex, "");
      }
    });

    const matches = tmp.match(/[aeiouy]+/g);
    const groups = matches ? matches.length : 0;
    return Math.max(1, groups);
  }

  function countSyllables(text) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return 0;

    let syllables = 0;
    for (const w of words) {
      syllables += countSyllablesInWord(w);
    }
    return syllables;
  }

  function computeReadability(text) {
    const words = countWords(text);
    const sentences = countSentences(text);
    const syllables = countSyllables(text);

    if (words === 0 || sentences === 0 || syllables === 0) {
      return {
        flesch: null,
        grade: null,
        words,
        sentences,
        syllables
      };
    }

    const wordsPerSentence = words / sentences;
    const syllablesPerWord = syllables / words;

    const flesch =
      206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

    const grade =
      0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

    return {
      flesch,
      grade,
      words,
      sentences,
      syllables,
      wordsPerSentence,
      syllablesPerWord
    };
  }

  function getReadingEaseLabel(score) {
    if (score === null || isNaN(score)) return "–";
    if (score >= 90) return "Very easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly difficult";
    if (score >= 30) return "Difficult";
    return "Very confusing";
  }

  function getDifficultyClass(score) {
    if (score === null || isNaN(score)) return "";
    if (score >= 70) return "badge-easy";
    if (score >= 50) return "badge-medium";
    return "badge-hard";
  }

  function formatGrade(grade) {
    if (grade === null || isNaN(grade)) return "–";
    const value = Math.max(0, Math.round(grade * 10) / 10);
    if (value >= 13) return value.toFixed(1) + " (College)";
    return value.toFixed(1);
  }

  function formatReadingTime(words, wpm) {
    if (!words || !wpm) return "–";
    const minutesFloat = words / wpm;
    const minutes = Math.floor(minutesFloat);
    const seconds = Math.round((minutesFloat - minutes) * 60);

    if (minutes === 0 && seconds === 0) return "< 5 sec";
    if (minutes === 0) return seconds + " sec";
    if (seconds === 0) return minutes + " min";

    return minutes + " min " + seconds + " sec";
  }

  function updateLiveCount() {
    const text = inputEl.value || "";
    const words = countWords(text);
    const chars = countCharacters(text);
    liveCountEl.textContent = words + " words • " + chars + " characters";
  }

  function renderResults() {
    const text = (inputEl.value || "").trim();

    if (!text) {
      emptyStateEl.hidden = false;
      resultsContainer.hidden = true;

      wordCountEl.textContent = "0";
      textSummarySubEl.textContent = "0 characters • 0 sentences • 0 paragraphs";
      avgWordsSentenceEl.textContent = "–";
      avgLengthSubEl.textContent = "– words per sentence • – syllables per word";
      fleschScoreEl.textContent = "–";
      gradeLevelEl.textContent = "–";
      readingEaseLabelEl.textContent = "–";
      readingTimeEl.textContent = "–";
      sentenceCountEl.textContent = "0";
      syllableCountEl.textContent = "0";
      return;
    }

    const chars = countCharacters(text);
    const charsNoSpaces = countCharactersNoSpaces(text);
    const paragraphs = countParagraphs(text);
    const wpm = parseInt(wpmSelect.value, 10) || 200;

    const stats = computeReadability(text);
    const score = stats.flesch;
    const grade = stats.grade;
    const words = stats.words;
    const sentences = stats.sentences;
    const syllables = stats.syllables;

    emptyStateEl.hidden = true;
    resultsContainer.hidden = false;

    const scoreDisplay =
      score === null || isNaN(score)
        ? "–"
        : (Math.round(score * 10) / 10).toFixed(1);
    fleschScoreEl.textContent = scoreDisplay;

    const difficultyClass = getDifficultyClass(score);
    fleschScoreEl.classList.remove("badge-easy", "badge-medium", "badge-hard");
    if (difficultyClass) {
      fleschScoreEl.classList.add(difficultyClass);
    }

    readingEaseLabelEl.textContent = getReadingEaseLabel(score);
    gradeLevelEl.textContent = formatGrade(grade);

    wordCountEl.textContent = String(words);
    textSummarySubEl.textContent =
      chars +
      " characters (" +
      charsNoSpaces +
      " without spaces) • " +
      sentences +
      " sentences • " +
      paragraphs +
      " paragraphs";

    if (stats.wordsPerSentence && stats.syllablesPerWord) {
      const wps = Math.round(stats.wordsPerSentence * 10) / 10;
      const spw = Math.round(stats.syllablesPerWord * 100) / 100;

      avgWordsSentenceEl.textContent = wps.toFixed(1);
      avgLengthSubEl.textContent =
        wps.toFixed(1) +
        " words per sentence • " +
        spw.toFixed(2) +
        " syllables per word";
    } else {
      avgWordsSentenceEl.textContent = "–";
      avgLengthSubEl.textContent =
        "– words per sentence • – syllables per word";
    }

    readingTimeEl.textContent = formatReadingTime(words, wpm);
    sentenceCountEl.textContent = String(sentences);
    syllableCountEl.textContent = String(syllables);
  }

  function handleAnalyzeClick() {
    renderResults();
  }

  function handleClearClick() {
    inputEl.value = "";
    updateLiveCount();
    renderResults();
    inputEl.focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateLiveCount();
    renderResults();

    if (inputEl) {
      inputEl.addEventListener("input", updateLiveCount);
    }
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", handleAnalyzeClick);
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", handleClearClick);
    }
    if (wpmSelect) {
      wpmSelect.addEventListener("change", renderResults);
    }

    var yearEl = document.getElementById("pf-year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    var mobileMenuBtn = document.getElementById("mobileMenuBtn");
    var mobileCloseBtn = document.getElementById("mobileCloseBtn");
    var mobileNav = document.getElementById("mobileNav");
    var mobileOverlay = document.getElementById("mobileOverlay");

    function openMobileNav() {
      if (!mobileNav || !mobileOverlay) return;
      mobileNav.classList.add("open");
      mobileOverlay.classList.add("visible");
    }

    function closeMobileNav() {
      if (!mobileNav || !mobileOverlay) return;
      mobileNav.classList.remove("open");
      mobileOverlay.classList.remove("visible");
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", openMobileNav);
    }
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener("click", closeMobileNav);
    }
    if (mobileOverlay) {
      mobileOverlay.addEventListener("click", closeMobileNav);
    }
  });
})();
