// readability-analyzer.js

document.addEventListener("DOMContentLoaded", function () {
  const inputText = document.getElementById("inputText");

  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");
  const charCountNoSpacesEl = document.getElementById("charCountNoSpaces");
  const sentenceCountEl = document.getElementById("sentenceCount");
  const paragraphCountEl = document.getElementById("paragraphCount");
  const syllableCountEl = document.getElementById("syllableCount");

  const fleschScoreEl = document.getElementById("fleschScore");
  const fleschLabelEl = document.getElementById("fleschLabel");
  const fkGradeEl = document.getElementById("fkGrade");
  const fkLabelEl = document.getElementById("fkLabel");

  const avgWordsPerSentenceEl = document.getElementById("avgWordsPerSentence");
  const avgCharsPerWordEl = document.getElementById("avgCharsPerWord");
  const avgSyllablesPerWordEl = document.getElementById("avgSyllablesPerWord");
  const readingTimeEl = document.getElementById("readingTime");

  const btnSample = document.getElementById("btnSample");
  const btnClear = document.getElementById("btnClear");

  function countWords(text) {
    const matches = text.trim().match(/[A-Za-z0-9']+/g);
    return matches ? matches.length : 0;
  }

  function countSentences(text) {
    // Split on ., !, ? while ignoring empty segments
    const sentences = text
      .replace(/\s+/g, " ")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return sentences.length;
  }

  function countParagraphs(text) {
    const paragraphs = text
      .split(/\n{2,}|\r{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return paragraphs.length;
  }

  function countCharacters(text) {
    return text.length;
  }

  function countCharactersNoSpaces(text) {
    return text.replace(/\s/g, "").length;
  }

  function countSyllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;

    if (w.length <= 3) return 1;

    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    w = w.replace(/^y/, "");

    const matches = w.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function getAllWords(text) {
    const matches = text.toLowerCase().match(/[a-z0-9']+/g);
    return matches || [];
  }

  function calculateReadability() {
    const text = inputText.value || "";

    const words = getAllWords(text);
    const wordCount = words.length;
    const sentenceCount = countSentences(text);
    const paragraphCount = countParagraphs(text);
    const charCount = countCharacters(text);
    const charCountNoSpaces = countCharactersNoSpaces(text);

    let totalSyllables = 0;
    for (let i = 0; i < words.length; i++) {
      totalSyllables += countSyllables(words[i]);
    }

    // Update basic stats
    wordCountEl.textContent = wordCount;
    sentenceCountEl.textContent = sentenceCount;
    paragraphCountEl.textContent = paragraphCount;
    charCountEl.textContent = charCount;
    charCountNoSpacesEl.textContent = charCountNoSpaces;
    syllableCountEl.textContent = totalSyllables;

    if (wordCount === 0 || sentenceCount === 0) {
      fleschScoreEl.textContent = "--";
      fleschLabelEl.textContent = "Add more text to calculate";
      fkGradeEl.textContent = "--";
      fkLabelEl.textContent = "Approx. US grade level";

      avgWordsPerSentenceEl.textContent = "0";
      avgCharsPerWordEl.textContent = "0";
      avgSyllablesPerWordEl.textContent = "0";
      readingTimeEl.textContent = "0 sec";
      return;
    }

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgCharsPerWord =
      wordCount > 0 ? charCountNoSpaces / wordCount : 0;
    const avgSyllablesPerWord =
      wordCount > 0 ? totalSyllables / wordCount : 0;

    // Flesch Reading Ease
    const fleschReadingEase =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Flesch–Kincaid Grade
    const fkGrade =
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    // Estimated reading time (200 wpm)
    const wordsPerMinute = 200;
    const totalMinutes = wordCount / wordsPerMinute;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    // Update stats display
    avgWordsPerSentenceEl.textContent = avgWordsPerSentence.toFixed(1);
    avgCharsPerWordEl.textContent = avgCharsPerWord.toFixed(2);
    avgSyllablesPerWordEl.textContent = avgSyllablesPerWord.toFixed(2);

    if (minutes === 0 && seconds === 0) {
      readingTimeEl.textContent = "< 1 sec";
    } else if (minutes === 0) {
      readingTimeEl.textContent = `${seconds} sec`;
    } else {
      readingTimeEl.textContent = `${minutes} min ${seconds} sec`;
    }

    // Flesch Reading Ease label
    let easeLabel = "";
    if (fleschReadingEase >= 90) {
      easeLabel = "Very easy (5th grade)";
    } else if (fleschReadingEase >= 80) {
      easeLabel = "Easy";
    } else if (fleschReadingEase >= 70) {
      easeLabel = "Fairly easy";
    } else if (fleschReadingEase >= 60) {
      easeLabel = "Standard (plain English)";
    } else if (fleschReadingEase >= 50) {
      easeLabel = "Fairly difficult";
    } else if (fleschReadingEase >= 30) {
      easeLabel = "Difficult (academic)";
    } else {
      easeLabel = "Very confusing";
    }

    fleschScoreEl.textContent = fleschReadingEase.toFixed(1);
    fleschLabelEl.textContent = easeLabel;

    // FK grade label
    const gradeRounded = Math.max(0, Math.min(20, fkGrade));
    fkGradeEl.textContent = gradeRounded.toFixed(1);
    fkLabelEl.textContent = `Approx. US grade ${gradeRounded.toFixed(1)}`;
  }

  // Sample text loader
  function loadSampleText() {
    const sample =
      "WordCalculator helps you write clearer, sharper content. " +
      "This sample paragraph is here to demonstrate how the readability " +
      "analyzer works. Longer sentences with more complex words will " +
      "increase the reading difficulty, while short and direct sentences " +
      "keep your writing easy to read.";
    inputText.value = sample;
    calculateReadability();
  }

  function clearText() {
    inputText.value = "";
    calculateReadability();
  }

  inputText.addEventListener("input", calculateReadability);
  btnSample.addEventListener("click", loadSampleText);
  btnClear.addEventListener("click", clearText);

  // Initial state
  calculateReadability();
});
