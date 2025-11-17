function showGsToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const inputEl = document.getElementById("gsInput");
  const langEl = document.getElementById("gsLanguage");
  const outputEl = document.getElementById("gsOutput");
  const suggestionsEl = document.getElementById("gsSuggestions");

  const charCountEl = document.getElementById("gsCharCount");
  const wordCountEl = document.getElementById("gsWordCount");
  const errorCountEl = document.getElementById("gsErrorCount");

  const checkBtn = document.getElementById("gsCheckBtn");
  const applyBtn = document.getElementById("gsApplyBtn");
  const copyBtn = document.getElementById("gsCopyBtn");
  const clearBtn = document.getElementById("gsClearBtn");

  const footerYearEl = document.getElementById("pf-year");
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  let lastText = "";
  let lastMatches = [];

  function updateStats(text, matchCount) {
    const chars = text.length;
    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    charCountEl.textContent = String(chars);
    wordCountEl.textContent = String(words);
    errorCountEl.textContent = String(matchCount || 0);
  }

  function renderPlainOutput() {
    const text = inputEl.value || "";
    lastText = text;
    lastMatches = [];
    outputEl.textContent = text;
    suggestionsEl.innerHTML = "";
    updateStats(text, 0);
  }

  function buildHighlightedHtml(text, matches) {
    if (!matches || matches.length === 0) {
      return text;
    }

    // Sort by offset ascending
    const sorted = matches.slice().sort((a, b) => a.offset - b.offset);

    let html = "";
    let lastIndex = 0;

    sorted.forEach((m, index) => {
      const start = m.offset;
      const end = m.offset + m.length;

      if (start > lastIndex) {
        html += escapeHtml(text.slice(lastIndex, start));
      }

      const original = text.slice(start, end);
      const title = [
        m.message || "",
        m.rule && m.rule.description ? "Rule: " + m.rule.description : "",
      ]
        .filter(Boolean)
        .join(" — ");

      html +=
        '<span class="gs-highlight" data-idx="' +
        index +
        '" title="' +
        escapeHtml(title) +
        '">' +
        escapeHtml(original) +
        "</span>";

      lastIndex = end;
    });

    if (lastIndex < text.length) {
      html += escapeHtml(text.slice(lastIndex));
    }

    return html;
  }

  function buildCorrectedText(text, matches) {
    if (!matches || matches.length === 0) return text;

    const sorted = matches.slice().sort((a, b) => a.offset - b.offset);
    let result = "";
    let lastIndex = 0;

    sorted.forEach(m => {
      const start = m.offset;
      const end = m.offset + m.length;

      if (start > lastIndex) {
        result += text.slice(lastIndex, start);
      }

      const replacement =
        m.replacements && m.replacements.length > 0
          ? m.replacements[0].value
          : text.slice(start, end);

      result += replacement;
      lastIndex = end;
    });

    if (lastIndex < text.length) {
      result += text.slice(lastIndex);
    }

    return result;
  }

  function renderSuggestions(matches) {
    if (!matches || matches.length === 0) {
      suggestionsEl.innerHTML =
        '<p>No grammar or spelling issues were detected. 🎉</p>';
      return;
    }

    const items = matches.map((m, idx) => {
      const original = lastText.slice(m.offset, m.offset + m.length);
      const bestReplacement =
        m.replacements && m.replacements.length > 0
          ? m.replacements[0].value
          : "(no suggestion)";

      const rule = m.rule && m.rule.description ? m.rule.description : "";

      return (
        '<div class="gs-suggestion-item">' +
        "<strong>" +
        (idx + 1) +
        ".</strong> " +
        escapeHtml(m.message || "Possible issue") +
        "<br/>" +
        '<strong>Text:</strong> "' +
        escapeHtml(original) +
        '"<br/>' +
        "<strong>Suggestion:</strong> " +
        escapeHtml(bestReplacement) +
        (rule
          ? '<div class="gs-suggestion-meta">Rule: ' +
            escapeHtml(rule) +
            "</div>"
          : "") +
        "</div>"
      );
    });

    suggestionsEl.innerHTML =
      "<h3>Suggestions (" +
      matches.length +
      ")</h3>" +
      items.join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function checkGrammar() {
    const text = inputEl.value;
    if (!text.trim()) {
      showGsToast("Please enter some text first.");
      return;
    }

    const language = langEl.value || "en-US";

    showGsToast("Checking grammar and spelling...");

    try {
      const params = new URLSearchParams();
      params.append("text", text);
      params.append("language", language);

      const response = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error("Grammar API error: " + response.status);
      }

      const data = await response.json();
      lastText = text;
      lastMatches = Array.isArray(data.matches) ? data.matches : [];

      const highlightedHtml = buildHighlightedHtml(text, lastMatches);
      outputEl.innerHTML = highlightedHtml;
      renderSuggestions(lastMatches);
      updateStats(text, lastMatches.length);

      if (lastMatches.length === 0) {
        showGsToast("No issues found. Nice writing!");
      } else {
        showGsToast("Check complete: " + lastMatches.length + " issue(s) found.");
      }
    } catch (err) {
      console.error(err);
      showGsToast("Could not check text. Please try again.");
    }
  }

  function applyCorrections() {
    if (!lastText) {
      showGsToast("Nothing to correct yet.");
      return;
    }

    const corrected = buildCorrectedText(lastText, lastMatches);
    outputEl.textContent = corrected;
    updateStats(corrected, 0);
    suggestionsEl.innerHTML =
      "<p>All available suggestions have been applied. Review and edit if needed.</p>";

    showGsToast("Corrections applied.");
  }

  async function copyCorrected() {
    const text = outputEl.textContent || "";
    if (!text.trim()) {
      showGsToast("Nothing to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showGsToast("Corrected text copied to clipboard.");
    } catch (err) {
      showGsToast("Clipboard not available in this browser.");
    }
  }

  function clearAll() {
    inputEl.value = "";
    outputEl.textContent = "";
    suggestionsEl.innerHTML = "";
    lastText = "";
    lastMatches = [];
    updateStats("", 0);
    showGsToast("Cleared.");
  }

  inputEl.addEventListener("input", () => {
    renderPlainOutput();
  });

  checkBtn.addEventListener("click", () => {
    checkGrammar();
  });

  applyBtn.addEventListener("click", () => {
    applyCorrections();
  });

  copyBtn.addEventListener("click", () => {
    copyCorrected();
  });

  clearBtn.addEventListener("click", () => {
    clearAll();
  });

  renderPlainOutput();
});
