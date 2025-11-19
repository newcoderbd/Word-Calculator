document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("rtInput");
  const analyzeBtn = document.getElementById("rtAnalyzeBtn");
  const clearBtn = document.getElementById("rtClearBtn");
  const messageEl = document.getElementById("rtMessage");

  const wordsEl = document.getElementById("rtWords");
  const wordsSubEl = document.getElementById("rtWordsSub");
  const charsWithSpacesEl = document.getElementById("rtCharsWithSpaces");
  const charsNoSpacesEl = document.getElementById("rtCharsNoSpaces");
  const sentencesEl = document.getElementById("rtSentences");
  const paragraphsEl = document.getElementById("rtParagraphs");
  const avgWordsSentenceEl = document.getElementById("rtAvgWordsSentence");
  const avgCharsWordEl = document.getElementById("rtAvgCharsWord");

  const fleschScoreEl = document.getElementById("rtFleschScore");
  const fleschLabelEl = document.getElementById("rtFleschLabel");
  const fkGradeEl = document.getElementById("rtFkGrade");
  const fkLabelEl = document.getElementById("rtFkLabel");
  const readingTimeEl = document.getElementById("rtReadingTime");
  const difficultyTextEl = document.getElementById("rtDifficultyText");
  const progressFillEl = document.getElementById("rtProgressFill");
  const summaryEl = document.getElementById("rtSummary");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function tokenizeWords(text) {
    const matches = text.toLowerCase().match(/[a-z0-9']+/g);
    return matches || [];
  }

  function countSentences(text) {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return 0;
    const segments = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    return segments.length;
  }

  function countParagraphs(text) {
    const cleaned = text.replace(/\r\n/g, "\n");
    const blocks = cleaned
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);
    if (blocks.length === 0 && text.trim().length > 0) {
      return 1;
    }
    return blocks.length;
  }

  function estimateSyllables(word) {
    let w = word.toLowerCase();
    w = w.replace(/[^a-z]/g, "");
    if (!w) return 0;

    if (w.length <= 3) {
      return 1;
    }

    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/g, "");
    w = w.replace(/^y/, "");

    const matches = w.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function calculateReadability(text) {
    const words = tokenizeWords(text);
    const wordCount = words.length;

    const sentenceCount = countSentences(text);
    const paragraphCount = countParagraphs(text);

    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, "").length;

    const uniqueWords = new Set(words).size;

    let totalSyllables = 0;
    for (const w of words) {
      totalSyllables += estimateSyllables(w);
    }

    const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgCharsPerWord = wordCount > 0 ? charsNoSpaces / wordCount : 0;

    let fleschScore = 0;
    let fkGrade = 0;

    if (wordCount > 0 && sentenceCount > 0) {
      fleschScore =
        206.835 -
        1.015 * (wordCount / sentenceCount) -
        84.6 * (totalSyllables / wordCount);

      fkGrade =
        0.39 * (wordCount / sentenceCount) +
        11.8 * (totalSyllables / wordCount) -
        15.59;
    }

    const readingTimeMinutes = wordCount / 200;

    return {
      wordCount,
      uniqueWords,
      sentenceCount,
      paragraphCount,
      charsWithSpaces,
      charsNoSpaces,
      avgWordsPerSentence,
      avgCharsPerWord,
      fleschScore,
      fkGrade,
      readingTimeMinutes,
    };
  }

  function classifyFlesch(score) {
    if (score <= 0) {
      return {
        label: "No readability score yet",
        difficulty: "not calculated",
        levelClass: "",
        barPercent: 0,
      };
    }
    if (score >= 90) {
      return {
        label: "Very easy (5th grade)",
        difficulty: "Very easy to read",
        levelClass: "",
        barPercent: 10,
      };
    }
    if (score >= 80) {
      return {
        label: "Easy (6th grade)",
        difficulty: "Easy to read",
        levelClass: "",
        barPercent: 25,
      };
    }
    if (score >= 70) {
      return {
        label: "Fairly easy",
        difficulty: "Suitable for general audience",
        levelClass: "",
        barPercent: 35,
      };
    }
    if (score >= 60) {
      return {
        label: "Standard",
        difficulty: "Comfortable for most adults",
        levelClass: "medium",
        barPercent: 50,
      };
    }
    if (score >= 50) {
      return {
        label: "Fairly difficult",
        difficulty: "Requires focused reading",
        levelClass: "hard",
        barPercent: 65,
      };
    }
    if (score >= 30) {
      return {
        label: "Difficult",
        difficulty: "Best for academic audiences",
        levelClass: "very-hard",
        barPercent: 82,
      };
    }
    return {
      label: "Very confusing",
      difficulty: "Extremely complex, specialist level",
      levelClass: "very-hard",
      barPercent: 96,
    };
  }

  function formatReadingTime(minutes) {
    if (minutes <= 0) return "0 min";
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (mins === 0) {
      return `${secs} sec`;
    }
    if (secs === 0) {
      return `${mins} min`;
    }
    return `${mins} min ${secs} sec`;
  }

  function updateUI() {
    const text = input.value || "";

    if (!text.trim()) {
      wordsEl.textContent = "0";
      wordsSubEl.textContent = "0 unique words";
      charsWithSpacesEl.textContent = "0";
      charsNoSpacesEl.textContent = "0";
      sentencesEl.textContent = "0";
      paragraphsEl.textContent = "0";
      avgWordsSentenceEl.textContent = "0";
      avgCharsWordEl.textContent = "0";

      fleschScoreEl.textContent = "0";
      fleschScoreEl.classList.remove("medium", "hard", "very-hard");
      fleschLabelEl.textContent = "No readability score yet";
      fkGradeEl.textContent = "–";
      fkLabelEl.textContent = "Flesch–Kincaid Grade Level";

      readingTimeEl.textContent = "0 min";
      difficultyTextEl.textContent = "Difficulty: not calculated";
      progressFillEl.style.width = "0%";

      summaryEl.textContent =
        "Paste some text to see a quick reading summary here.";

      if (messageEl) {
        messageEl.innerHTML =
          '<i class="fas fa-arrow-up-right-from-square"></i>' +
          '<span>Start typing or paste your text and click <strong>Analyze text</strong>.</span>';
      }
      return;
    }

    const stats = calculateReadability(text);

    wordsEl.textContent = String(stats.wordCount);
    wordsSubEl.textContent = `${stats.uniqueWords} unique words`;
    charsWithSpacesEl.textContent = String(stats.charsWithSpaces);
    charsNoSpacesEl.textContent = String(stats.charsNoSpaces);
    sentencesEl.textContent = String(stats.sentenceCount);
    paragraphsEl.textContent = String(stats.paragraphCount);

    avgWordsSentenceEl.textContent =
      stats.avgWordsPerSentence > 0
        ? stats.avgWordsPerSentence.toFixed(1)
        : "0";

    avgCharsWordEl.textContent =
      stats.avgCharsPerWord > 0 ? stats.avgCharsPerWord.toFixed(2) : "0";

    const flesch = stats.fleschScore;
    const fkGrade = stats.fkGrade;
    const classification = classifyFlesch(flesch);

    let fleschDisplay = isNaN(flesch) ? 0 : Math.round(flesch);
    if (fleschDisplay < 0) fleschDisplay = 0;
    if (fleschDisplay > 100) fleschDisplay = 100;

    fleschScoreEl.textContent = String(fleschDisplay);
    fleschScoreEl.classList.remove("medium", "hard", "very-hard");
    if (classification.levelClass) {
      fleschScoreEl.classList.add(classification.levelClass);
    }
    fleschLabelEl.textContent = classification.label;

    if (isNaN(fkGrade)) {
      fkGradeEl.textContent = "–";
      fkLabelEl.textContent = "Flesch–Kincaid Grade Level";
    } else {
      const roundedGrade = Math.max(0, Math.round(fkGrade * 10) / 10);
      fkGradeEl.textContent = `${roundedGrade}`;
      fkLabelEl.textContent = "Approximate US school grade level";
    }

    const readingTimeText = formatReadingTime(stats.readingTimeMinutes);
    readingTimeEl.textContent = readingTimeText;

    difficultyTextEl.textContent = `Difficulty: ${classification.difficulty}`;
    progressFillEl.style.width = `${classification.barPercent}%`;

    const wc = stats.wordCount;
    let summary;
    if (wc === 0) {
      summary = "No text detected.";
    } else if (wc < 100) {
      summary =
        "Very short text. Ideal for UI copy, microcopy, or short descriptions.";
    } else if (wc < 300) {
      summary =
        "Short-form content. Great for social posts, product descriptions, or short blog intros.";
    } else if (wc < 800) {
      summary =
        "Medium-length content. Suitable for standard blog posts and editorial content.";
    } else {
      summary =
        "Long-form content. Consider adding headings, bullet points, and spacing to keep it readable.";
    }

    summaryEl.textContent = summary;

    if (messageEl) {
      messageEl.innerHTML =
        '<i class="fas fa-circle-check"></i>' +
        '<span>Statistics and readability scores updated. Higher Flesch scores are easier to read.</span>';
    }
  }

  function clearAll() {
    input.value = "";
    updateUI();
  }

  analyzeBtn.addEventListener("click", updateUI);
  clearBtn.addEventListener("click", clearAll);
  input.addEventListener("input", () => {
    // Live update while typing
    updateUI();
  });

  updateUI();
});
