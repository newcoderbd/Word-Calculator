document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("kdForm");
  const textEl = document.getElementById("kdText");
  const focusKeywordEl = document.getElementById("kdFocusKeyword");
  const minLengthEl = document.getElementById("kdMinLength");
  const ignoreCaseEl = document.getElementById("kdIgnoreCase");
  const excludeStopWordsEl = document.getElementById("kdExcludeStopWords");
  const clearBtn = document.getElementById("kdClearBtn");

  const totalWordsEl = document.getElementById("kdTotalWords");
  const uniqueWordsEl = document.getElementById("kdUniqueWords");
  const focusDensityEl = document.getElementById("kdFocusDensity");
  const focusInfoEl = document.getElementById("kdFocusInfo");
  const statusEl = document.getElementById("kdStatus");
  const tableWrapEl = document.getElementById("kdTableWrap");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "while",
    "at", "by", "for", "from", "in", "into", "of", "on", "to", "up", "with",
    "as", "is", "it", "its", "be", "are", "was", "were", "this", "that", "these",
    "those", "your", "my", "our", "their", "you", "we", "they", "he", "she",
    "him", "her", "them", "me", "i", "so", "no", "not", "too", "very", "can",
    "could", "should", "would", "will", "just", "about", "than", "also", "such"
  ]);

  function normalizeText(text, ignoreCase) {
    let result = text.replace(/[\u2018\u2019']/g, "'").replace(/[\u201C\u201D"]/g, '"');
    if (ignoreCase) {
      result = result.toLowerCase();
    }
    return result;
  }

  function tokenize(text) {
    return text
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function analyzeKeywordDensity(content, options) {
    const ignoreCase = options.ignoreCase;
    const excludeStopWords = options.excludeStopWords;
    const minLength = options.minLength;

    const normalized = normalizeText(content, ignoreCase);
    const tokens = tokenize(normalized);

    const totalWords = tokens.length;
    const frequencies = new Map();

    for (const token of tokens) {
      const word = token;
      if (excludeStopWords && STOP_WORDS.has(word)) {
        continue;
      }
      if (word.length < minLength) {
        continue;
      }
      const current = frequencies.get(word) || 0;
      frequencies.set(word, current + 1);
    }

    const resultArray = [];
    frequencies.forEach((count, word) => {
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
      resultArray.push({
        word,
        count,
        density
      });
    });

    resultArray.sort((a, b) => {
      if (b.count === a.count) {
        return a.word < b.word ? -1 : 1;
      }
      return b.count - a.count;
    });

    return {
      totalWords,
      uniqueWords: frequencies.size,
      entries: resultArray,
      normalizedText: normalized,
      tokens
    };
  }

  function countPhraseOccurrences(text, phrase, ignoreCase) {
    if (!phrase) return 0;
    let normalizedText = text;
    let normalizedPhrase = phrase;

    if (ignoreCase) {
      normalizedText = text.toLowerCase();
      normalizedPhrase = phrase.toLowerCase();
    }

    normalizedText = normalizedText.replace(/[\u2018\u2019']/g, "'").replace(/[\u201C\u201D"]/g, '"');
    normalizedPhrase = normalizedPhrase.replace(/[\u2018\u2019']/g, "'").replace(/[\u201C\u201D"]/g, '"');

    let count = 0;
    let index = 0;

    while (true) {
      const foundIndex = normalizedText.indexOf(normalizedPhrase, index);
      if (foundIndex === -1) break;
      count += 1;
      index = foundIndex + normalizedPhrase.length;
    }

    return count;
  }

  function renderSummary(stats, focusKeyword, options) {
    const { totalWords, uniqueWords, normalizedText } = stats;

    totalWordsEl.textContent = totalWords;
    uniqueWordsEl.textContent = uniqueWords;

    if (!focusKeyword || !focusKeyword.trim()) {
      focusDensityEl.textContent = "0%";
      focusInfoEl.textContent = "No focus keyword set.";
      return;
    }

    const trimmedFocus = focusKeyword.trim();
    const occurrences = countPhraseOccurrences(
      normalizedText,
      trimmedFocus,
      options.ignoreCase
    );
    const total = totalWords;

    const density = total > 0 ? (occurrences * trimmedFocus.split(/\s+/).length / total) * 100 : 0;
    const densityRounded = density.toFixed(2);

    focusDensityEl.textContent = `${densityRounded}%`;
    focusInfoEl.textContent = `“${trimmedFocus}” appears ${occurrences} time${occurrences === 1 ? "" : "s"} in your text.`;
  }

  function renderTable(stats) {
    const entries = stats.entries;

    if (!stats.totalWords) {
      tableWrapEl.innerHTML =
        '<div class="kd-table-empty">No words to display. Paste some text and analyze it first.</div>';
      return;
    }

    if (!entries.length) {
      tableWrapEl.innerHTML =
        '<div class="kd-table-empty">No keywords found based on your current settings (stop words / minimum length).</div>';
      return;
    }

    let rows = "";
    entries.forEach((entry) => {
      rows += `
        <tr>
          <td>${entry.word.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
          <td>${entry.count}</td>
          <td>${entry.density.toFixed(2)}%</td>
        </tr>
      `;
    });

    tableWrapEl.innerHTML = `
      <table class="kd-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Count</th>
            <th>Density (%)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function updateStatus(stats) {
    if (!stats.totalWords) {
      statusEl.innerHTML =
        'Paste some content and click <span class="kd-highlight">Analyze Density</span> to see results.';
      return;
    }

    statusEl.textContent = `Analyzed ${stats.totalWords} word${stats.totalWords === 1 ? "" : "s"} with ${stats.uniqueWords} unique keyword${stats.uniqueWords === 1 ? "" : "s"}.`;
  }

  function handleAnalyze(event) {
    event.preventDefault();

    const content = textEl.value || "";
    const focusKeyword = focusKeywordEl.value || "";
    const minLengthRaw = Number(minLengthEl.value || "1");
    const minLength = Number.isFinite(minLengthRaw) && minLengthRaw > 0 ? minLengthRaw : 1;
    const ignoreCase = !!ignoreCaseEl.checked;
    const excludeStopWords = !!excludeStopWordsEl.checked;

    if (!content.trim()) {
      statusEl.textContent = "Please paste or type some content first.";
      tableWrapEl.innerHTML =
        '<div class="kd-table-empty">No content to analyze.</div>';
      totalWordsEl.textContent = "0";
      uniqueWordsEl.textContent = "0";
      focusDensityEl.textContent = "0%";
      focusInfoEl.textContent = "No focus keyword set.";
      return;
    }

    const stats = analyzeKeywordDensity(content, {
      ignoreCase,
      excludeStopWords,
      minLength
    });

    renderSummary(stats, focusKeyword, {
      ignoreCase
    });
    renderTable(stats);
    updateStatus(stats);
  }

  function handleClear() {
    textEl.value = "";
    focusKeywordEl.value = "";
    minLengthEl.value = "3";
    ignoreCaseEl.checked = true;
    excludeStopWordsEl.checked = true;

    totalWordsEl.textContent = "0";
    uniqueWordsEl.textContent = "0";
    focusDensityEl.textContent = "0%";
    focusInfoEl.textContent = "No focus keyword set.";
    statusEl.innerHTML =
      'Paste some content and click <span class="kd-highlight">Analyze Density</span> to see results.';
    tableWrapEl.innerHTML =
      '<div class="kd-table-empty">No content to analyze.</div>';
  }

  tableWrapEl.innerHTML =
    '<div class="kd-table-empty">No content to analyze.</div>';

  form.addEventListener("submit", handleAnalyze);
  clearBtn.addEventListener("click", handleClear);
});
