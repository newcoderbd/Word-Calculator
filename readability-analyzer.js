// Readability & Text Statistics logic

(function () {
  const textarea = document.getElementById("readabilityInput");
  const sampleBtn = document.getElementById("sampleTextBtn");
  const clearBtn = document.getElementById("clearTextBtn");

  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");
  const charNoSpaceCountEl = document.getElementById("charNoSpaceCount");
  const sentenceCountEl = document.getElementById("sentenceCount");
  const paragraphCountEl = document.getElementById("paragraphCount");
  const avgWordLengthEl = document.getElementById("avgWordLength");
  const avgSentenceLengthEl = document.getElementById("avgSentenceLength");
  const readingTimeEl = document.getElementById("readingTime");

  const fleschScoreEl = document.getElementById("fleschScore");
  const fkGradeEl = document.getElementById("fkGrade");
  const fogIndexEl = document.getElementById("fogIndex");
  const smogIndexEl = document.getElementById("smogIndex");
  const difficultyLabelEl = document.getElementById("difficultyLabel");
  const gradeLabelEl = document.getElementById("gradeLabel");

  function safeNumber(value) {
    if (!isFinite(value) || isNaN(value)) return 0;
    return value;
  }

  function countSyllables(word) {
    if (!word) return 0;
    const cleaned = word
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    if (!cleaned) return 0;
    if (cleaned.length <= 3) return 1;

    let syllableMatches = cleaned.match(/[aeiouy]+/g);
    let count = syllableMatches ? syllableMatches.length : 0;

    if (cleaned.endsWith("e")) {
      count -= 1;
    }
    if (count <= 0) count = 1;
    return count;
  }

  function analyzeText(text) {
    const trimmed = text.trim();

    const charCount = text.length;
    const charNoSpaceCount = text.replace(/\s+/g, "").length;

    let words = [];
    if (trimmed.length > 0) {
      words = trimmed.split(/\s+/).filter(Boolean);
    }
    const wordCount = words.length;

    let sentenceCount = 0;
    if (trimmed.length > 0) {
      const sentences = trimmed
        .split(/[.!?]+/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      sentenceCount = sentences.length || 1; // avoid division by zero
    }

    let paragraphs = 0;
    if (trimmed.length > 0) {
      const paras = trimmed
        .split(/\n{2,}/g)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      paragraphs = paras.length || 1;
    }

    let syllableCount = 0;
    let complexWordCount = 0;

    for (const rawWord of words) {
      const w = rawWord.replace(/[^a-zA-Z']/g, "");
      if (!w) continue;
      const sCount = countSyllables(w);
      syllableCount += sCount;
      if (sCount >= 3) {
        complexWordCount += 1;
      }
    }

    const avgWordLength =
      wordCount > 0 ? charNoSpaceCount / wordCount : 0;
    const avgSentenceLength =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // reading time: ~200 wpm
    const minutes = wordCount / 200;
    let readingTimeLabel = "0 sec";
    if (minutes > 0) {
      const totalSeconds = Math.round(minutes * 60);
      if (totalSeconds < 60) {
        readingTimeLabel = totalSeconds + " sec";
      } else {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        readingTimeLabel =
          mins + " min" + (secs > 0 ? " " + secs + " sec" : "");
      }
    }

    // Readability calculations
    let flesch = 0;
    let fk = 0;
    let fog = 0;
    let smog = 0;

    if (wordCount > 0 && sentenceCount > 0 && syllableCount > 0) {
      const wordsPerSentence = wordCount / sentenceCount;
      const syllablesPerWord = syllableCount / wordCount;

      flesch =
        206.835 -
        1.015 * wordsPerSentence -
        84.6 * syllablesPerWord;

      fk =
        0.39 * wordsPerSentence +
        11.8 * syllablesPerWord -
        15.59;

      fog =
        0.4 *
        (wordsPerSentence +
          (100 * complexWordCount) / wordCount);

      if (sentenceCount >= 1 && complexWordCount > 0) {
        smog =
          1.043 *
            Math.sqrt(
              (complexWordCount * 30) / sentenceCount
            ) +
          3.1291;
      }
    }

    return {
      charCount,
      charNoSpaceCount,
      wordCount,
      sentenceCount,
      paragraphs,
      avgWordLength,
      avgSentenceLength,
      readingTimeLabel,
      flesch,
      fk,
      fog,
      smog,
    };
  }

  function getDifficultyLabel(score) {
    if (!isFinite(score)) return "Not enough text yet.";
    if (score >= 90) return "Very easy (5th grade)";
    if (score >= 80) return "Easy (6th grade)";
    if (score >= 70) return "Fairly easy (7th grade)";
    if (score >= 60) return "Standard (8th–9th grade)";
    if (score >= 50) return "Fairly difficult (10th–12th grade)";
    if (score >= 30) return "Difficult (college level)";
    return "Very confusing (academic / specialist).";
  }

  function getGradeLabel(grade) {
    if (!isFinite(grade)) return "—";
    const rounded = Math.round(grade * 10) / 10;
    if (rounded <= 1) return "Grade " + rounded + " (Very simple text)";
    if (rounded <= 5) return "Grade " + rounded + " (Children / easy)";
    if (rounded <= 8) return "Grade " + rounded + " (Middle school)";
    if (rounded <= 12) return "Grade " + rounded + " (High school)";
    if (rounded <= 16) return "Grade " + rounded + " (College / university)";
    return "Grade " + rounded + " (Advanced / professional)";
  }

  function formatNumber(value, decimals) {
    const num = safeNumber(value);
    return num.toFixed(decimals);
  }

  function update() {
    const text = textarea.value || "";
    const stats = analyzeText(text);

    // Basic stats
    wordCountEl.textContent = stats.wordCount;
    charCountEl.textContent = stats.charCount;
    charNoSpaceCountEl.textContent = stats.charNoSpaceCount;
    sentenceCountEl.textContent = stats.sentenceCount;
    paragraphCountEl.textContent = stats.paragraphs;
    avgWordLengthEl.textContent = formatNumber(
      stats.avgWordLength || 0,
      2
    );
    avgSentenceLengthEl.textContent = formatNumber(
      stats.avgSentenceLength || 0,
      2
    );
    readingTimeEl.textContent = stats.readingTimeLabel;

    // Readability
    if (stats.wordCount === 0) {
      fleschScoreEl.textContent = "—";
      fkGradeEl.textContent = "—";
      fogIndexEl.textContent = "—";
      smogIndexEl.textContent = "—";
      difficultyLabelEl.textContent =
        "Start typing or paste your text above to see readability details.";
      gradeLabelEl.textContent = "—";
      return;
    }

    fleschScoreEl.textContent = formatNumber(stats.flesch, 1);
    fkGradeEl.textContent = formatNumber(stats.fk, 1);
    fogIndexEl.textContent = formatNumber(stats.fog, 1);
    smogIndexEl.textContent =
      stats.smog > 0 ? formatNumber(stats.smog, 1) : "—";

    difficultyLabelEl.textContent = getDifficultyLabel(stats.flesch);
    gradeLabelEl.textContent = getGradeLabel(stats.fk);
  }

  if (textarea) {
    textarea.addEventListener("input", update);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      textarea.value = "";
      update();
      textarea.focus();
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener("click", function () {
      const sample =
        "Writing clearly is one of the most important skills in the digital age. " +
        "Readers scan content quickly and rarely finish long, dense paragraphs. " +
        "Short sentences, familiar words, and a logical structure make your ideas easier to understand.\n\n" +
        "Use readability tools to check your work before you publish. " +
        "They will not replace good judgment, but they can highlight problems " +
        "like long sentences, complex wording, and inconsistent tone.";
      textarea.value = sample;
      update();
      textarea.focus();
    });
  }

  // Initial update
  update();
})();
