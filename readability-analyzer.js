document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("rtsInput");
  const analyzeBtn = document.getElementById("rtsAnalyzeBtn");
  const clearBtn = document.getElementById("rtsClearBtn");

  const fleschScoreEl = document.getElementById("rtsFleschScore");
  const fleschLabelEl = document.getElementById("rtsFleschLabel");
  const fkGradeEl = document.getElementById("rtsFkGrade");
  const readingTimeEl = document.getElementById("rtsReadingTime");

  const wordsEl = document.getElementById("rtsWords");
  const charsWithEl = document.getElementById("rtsCharsWith");
  const charsWithoutEl = document.getElementById("rtsCharsWithout");
  const sentencesEl = document.getElementById("rtsSentences");
  const wordsPerSentenceEl = document.getElementById("rtsWordsPerSentence");
  const paragraphsEl = document.getElementById("rtsParagraphs");
  const summaryEl = document.getElementById("rtsSummary");
  const messageEl = document.getElementById("rtsMessage");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function normalizeText(text) {
    return text.replace(/\r\n/g, "\n");
  }

  function countWords(text) {
    const tokens = text.trim().split(/\s+/).filter((t) => t.length > 0);
    return tokens.length;
  }

  function countSentences(text) {
    const parts = text
      .replace(/[\r\n]+/g, " ")
      .split(/[.!?]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return parts.length;
  }

  function countParagraphs(text) {
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return paragraphs.length;
  }

  function countCharacters(text) {
    const withSpaces = text.length;
    const withoutSpaces = text.replace(/\s+/g, "").length;
    return { withSpaces, withoutSpaces };
  }

  // Simple syllable estimation for English text
  function estimateSyllables(text) {
    const lower = text.toLowerCase();
    const words = lower.match(/[a-z]+/g) || [];
    let syllables = 0;

    words.forEach((word) => {
      let w = word;
      w = w.replace(/e\b/g, "");
      const matches = w.match(/[aeiouy]+/g);
      let count = matches ? matches.length : 0;
      if (count === 0) count = 1;
      syllables += count;
    });

    return syllables;
  }

  function formatReadingTime(words) {
    if (words === 0) return "0 min";

    const wordsPerMinute = 200;
    const totalMinutes = words / wordsPerMinute;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    if (minutes <= 0) {
      return `${seconds}s`;
    }

    if (seconds === 0) {
      return `${minutes} min`;
    }

    return `${minutes} min ${seconds}s`;
  }

  function classifyFlesch(score) {
    if (isNaN(score)) {
      return {
        label: "Not enough data to calculate readability score",
        level: "none",
        description:
          "Add more sentences and words to get a meaningful readability estimate."
      };
    }

    if (score >= 90) {
      return {
        label: "Very easy (5th grade)",
        level: "high",
        description:
          "Simple language, suitable for younger readers and quick-scan content."
      };
    }
    if (score >= 80) {
      return {
        label: "Easy (6th grade)",
        level: "high",
        description:
          "Accessible language, great for general web content and marketing copy."
      };
    }
    if (score >= 70) {
      return {
        label: "Fairly easy",
        level: "high",
        description:
          "Comfortable to read for most adults. Suitable for blogs and how-to guides."
      };
    }
    if (score >= 60) {
      return {
        label: "Standard",
        level: "medium",
        description:
          "Typical for online articles and product documentation."
      };
    }
    if (score >= 50) {
      return {
        label: "Fairly difficult",
        level: "medium",
        description:
          "More complex language. Consider simplifying sentences or vocabulary."
      };
    }
    if (score >= 30) {
      return {
        label: "Difficult",
        level: "low",
        description:
          "Academic-style writing. Readers may need extra focus and time."
      };
    }
    return {
      label: "Very confusing",
      level: "low",
      description:
        "Highly complex text. Recommended only for expert or academic audiences."
    };
  }

  function analyzeText() {
    const rawText = inputEl.value || "";
    const text = normalizeText(rawText).trim();

    if (!text) {
      resetResults();
      if (messageEl) {
        messageEl.innerHTML =
          '<i class="fas fa-circle-info"></i><span>Paste some text first, then click <strong>Analyze text</strong>.</span>';
      }
      return;
    }

    const wordCount = countWords(text);
    const sentenceCount = countSentences(text);
    const paragraphCount = countParagraphs(text);
    const chars = countCharacters(text);
    const syllables = estimateSyllables(text);

    const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const readingTime = formatReadingTime(wordCount);

    let flesch = NaN;
    let fkGrade = NaN;

    if (wordCount > 0 && sentenceCount > 0 && syllables > 0) {
      flesch =
        206.835 - 1.015 * (wordCount / sentenceCount) -
        84.6 * (syllables / wordCount);
      fkGrade =
        0.39 * (wordCount / sentenceCount) +
        11.8 * (syllables / wordCount) -
        15.59;
    }

    const roundedFlesch = isNaN(flesch)
      ? NaN
      : Math.round(flesch * 10) / 10;
    const roundedGrade = isNaN(fkGrade)
      ? NaN
      : Math.round(fkGrade * 10) / 10;

    wordsEl.textContent = String(wordCount);
    charsWithEl.textContent = String(chars.withSpaces);
    charsWithoutEl.textContent = String(chars.withoutSpaces);
    sentencesEl.textContent = String(sentenceCount);
    wordsPerSentenceEl.textContent = sentenceCount
      ? (Math.round(avgWordsPerSentence * 10) / 10).toString()
      : "0";
    paragraphsEl.textContent = String(paragraphCount);

    readingTimeEl.textContent = readingTime;

    fleschScoreEl.classList.remove("medium", "low");
    if (isNaN(roundedFlesch)) {
      fleschScoreEl.textContent = "–";
      fleschLabelEl.textContent =
        "Not enough data to calculate readability score";
    } else {
      fleschScoreEl.textContent = `${roundedFlesch}`;
      const cls = classifyFlesch(roundedFlesch);
      fleschLabelEl.textContent = cls.label;
      if (cls.level === "medium") {
        fleschScoreEl.classList.add("medium");
      } else if (cls.level === "low") {
        fleschScoreEl.classList.add("low");
      }
    }

    if (isNaN(roundedGrade)) {
      fkGradeEl.textContent = "–";
    } else {
      fkGradeEl.textContent = `${roundedGrade}`;
    }

    if (summaryEl) {
      const sentencePart =
        sentenceCount > 0
          ? `Your text has an average of ${Math.round(
              avgWordsPerSentence * 10
            ) / 10} words per sentence, `
          : "Your text does not contain enough sentence-ending punctuation for a detailed readability estimate. ";

      const fleschInfo = isNaN(roundedFlesch)
        ? ""
        : `The Flesch Reading Ease score is approximately ${roundedFlesch}, which indicates that the text is ${classifyFlesch(
            roundedFlesch
          ).label.toLowerCase()}. `;

      const gradeInfo = isNaN(roundedGrade)
        ? ""
        : `The Flesch–Kincaid grade level is about ${roundedGrade}, meaning it should be understandable for readers around that grade level. `;

      summaryEl.textContent =
        `This text contains ${wordCount} words, ${sentenceCount} sentences, and ${paragraphCount} paragraphs. ` +
        sentencePart +
        fleschInfo +
        gradeInfo +
        "Use these metrics to refine your content for your target audience.";
    }

    if (messageEl) {
      messageEl.innerHTML =
        '<i class="fas fa-circle-check"></i><span>Analysis updated. Use the readability score and grade level to adjust tone and complexity.</span>';
    }
  }

  function resetResults() {
    wordsEl.textContent = "0";
    charsWithEl.textContent = "0";
    charsWithoutEl.textContent = "0";
    sentencesEl.textContent = "0";
    wordsPerSentenceEl.textContent = "0";
    paragraphsEl.textContent = "0";

    fleschScoreEl.textContent = "–";
    fleschScoreEl.classList.remove("medium", "low");
    fleschLabelEl.textContent = "No readability score calculated yet";
    fkGradeEl.textContent = "–";

    readingTimeEl.textContent = "0 min";

    if (summaryEl) {
      summaryEl.textContent =
        "Stats and readability interpretation will appear here after analysis.";
    }
  }

  function clearAll() {
    inputEl.value = "";
    resetResults();

    if (messageEl) {
      messageEl.innerHTML =
        '<i class="fas fa-circle-info"></i><span>Paste your content and click <strong>Analyze text</strong> to see detailed statistics.</span>';
    }
  }

  analyzeBtn.addEventListener("click", analyzeText);
  clearBtn.addEventListener("click", clearAll);
});
