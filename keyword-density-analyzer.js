document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("kdaForm");
  const textEl = document.getElementById("kdaText");
  const keywordsEl = document.getElementById("kdaKeywords");
  const minLengthEl = document.getElementById("kdaMinLength");
  const excludeStopwordsEl = document.getElementById("kdaExcludeStopwords");
  const includeNumbersEl = document.getElementById("kdaIncludeNumbers");
  const clearBtn = document.getElementById("kdaClearBtn");

  const totalWordsEl = document.getElementById("kdaTotalWords");
  const uniqueWordsEl = document.getElementById("kdaUniqueWords");
  const topDensityEl = document.getElementById("kdaTopDensity");
  const statusEl = document.getElementById("kdaStatus");
  const tableWrapEl = document.getElementById("kdaTableWrap");

  const focusWrapEl = document.getElementById("kdaFocusWrap");
  const focusListEl = document.getElementById("kdaFocusList");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const STOPWORDS = new Set([
    "the", "and", "a", "an", "of", "to", "in", "on", "for", "with", "at",
    "by", "from", "up", "about", "into", "over", "after", "under", "above",
    "below", "this", "that", "these", "those", "is", "are", "was", "were",
    "be", "been", "being", "it", "its", "as", "or", "if", "but", "not",
    "no", "so", "can", "will", "just", "do", "does", "did", "than", "then",
    "there", "their", "them", "they", "you", "your", "yours", "we", "our",
    "ours", "i", "me", "my", "mine"
  ]);

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function tokenize(text, includeNumbers) {
    const lower = text.toLowerCase();
    const pattern = includeNumbers ? /[a-z0-9']+/g : /[a-z']+/g;
    const matches = lower.match(pattern);
    return matches || [];
  }

  function analyzeText() {
    const rawText = textEl.value || "";
    const focusRaw = keywordsEl.value || "";
    const minLength = Number(minLengthEl.value) || 1;
    const excludeStopwords = excludeStopwordsEl.checked;
    const includeNumbers = includeNumbersEl.checked;

    if (!rawText.trim()) {
      statusEl.textContent = "Please paste or type some content to analyze.";
      totalWordsEl.textContent = "0";
      uniqueWordsEl.textContent = "0";
      topDensityEl.textContent = "0%";
      tableWrapEl.innerHTML =
        '<div class="kda-table-empty">No data available. Add text and click “Analyze”.</div>';
      focusWrapEl.style.display = "none";
      return;
    }

    let words = tokenize(rawText, includeNumbers);

    if (minLength > 1) {
      words = words.filter((w) => w.length >= minLength);
    }

    if (excludeStopwords) {
      words = words.filter((w) => !STOPWORDS.has(w));
    }

    const totalWords = words.length;
    if (totalWords === 0) {
      statusEl.textContent =
        "No words left after applying filters (min length / stopwords). Try lowering the minimum word length or disabling stopword filtering.";
      totalWordsEl.textContent = "0";
      uniqueWordsEl.textContent = "0";
      topDensityEl.textContent = "0%";
      tableWrapEl.innerHTML =
        '<div class="kda-table-empty">No data available after filtering.</div>';
      focusWrapEl.style.display = "none";
      return;
    }

    const freq = new Map();
    words.forEach((w) => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });

    const uniqueCount = freq.size;

    const entries = Array.from(freq.entries()).map(([word, count]) => {
      const density = (count / totalWords) * 100;
      return { word, count, density };
    });

    entries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.word.localeCompare(b.word);
    });

    const top = entries[0];
    const topDensity = top ? top.density : 0;

    totalWordsEl.textContent = totalWords.toString();
    uniqueWordsEl.textContent = uniqueCount.toString();
    topDensityEl.textContent = `${topDensity.toFixed(2)}%`;

    statusEl.textContent = `Found ${uniqueCount} unique word${
      uniqueCount === 1 ? "" : "s"
    } across ${totalWords} total words.`;

    renderTable(entries, totalWords);
    renderFocusKeywords(focusRaw, freq, totalWords);
  }

  function densityBadgeClass(density) {
    if (density >= 3 && density <= 5) return "kda-badge kda-badge-strong";
    if ((density > 1 && density < 3) || (density > 5 && density <= 7)) {
      return "kda-badge kda-badge-medium";
    }
    return "kda-badge kda-badge-weak";
  }

  function renderTable(entries, totalWords) {
    if (!entries.length) {
      tableWrapEl.innerHTML =
        '<div class="kda-table-empty">No keyword statistics available.</div>';
      return;
    }

    const topLimit = 200;
    const sliced = entries.slice(0, topLimit);

    let rows = "";
    sliced.forEach((item, index) => {
      const { word, count, density } = item;
      const percent = density.toFixed(2);
      const badgeClass = densityBadgeClass(density);
      let label = "Low";

      if (density >= 3 && density <= 5) {
        label = "SEO-friendly";
      } else if ((density > 1 && density < 3) || (density > 5 && density <= 7)) {
        label = "Medium";
      } else if (density > 7) {
        label = "High";
      }

      rows += `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(word)}</td>
          <td>${count}</td>
          <td>${percent}%</td>
          <td><span class="${badgeClass}">${label}</span></td>
        </tr>
      `;
    });

    tableWrapEl.innerHTML = `
      <table class="kda-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Word</th>
            <th>Count</th>
            <th>Density</th>
            <th>Signal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function renderFocusKeywords(focusRaw, freq, totalWords) {
    const raw = focusRaw.trim();
    if (!raw) {
      focusWrapEl.style.display = "none";
      focusListEl.innerHTML = "";
      return;
    }

    const parts = raw
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p.length > 0);

    if (!parts.length) {
      focusWrapEl.style.display = "none";
      focusListEl.innerHTML = "";
      return;
    }

    let content = "";
    parts.forEach((kw) => {
      const count = freq.get(kw) || 0;
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
      const percent = density.toFixed(2);

      content += `
        <div class="kda-focus-chip">
          <span class="value">${escapeHtml(kw)}</span>
          <span class="meta">${count} × • ${percent}%</span>
        </div>
      `;
    });

    focusWrapEl.style.display = "block";
    focusListEl.innerHTML = content;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    analyzeText();
  }

  function clearAll() {
    textEl.value = "";
    keywordsEl.value = "";
    minLengthEl.value = "2";
    excludeStopwordsEl.checked = true;
    includeNumbersEl.checked = false;

    totalWordsEl.textContent = "0";
    uniqueWordsEl.textContent = "0";
    topDensityEl.textContent = "0%";
    statusEl.textContent =
      "Paste your content and click “Analyze” to see keyword density.";
    tableWrapEl.innerHTML =
      '<div class="kda-table-empty">No data available. Add text and click “Analyze”.</div>';
    focusWrapEl.style.display = "none";
    focusListEl.innerHTML = "";
  }

  form.addEventListener("submit", handleFormSubmit);
  clearBtn.addEventListener("click", clearAll);

  clearAll();
});
