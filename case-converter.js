function showCaseToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.addEventListener("DOMContentLoaded", function () {
  const inputEl = document.getElementById("ccInput");
  const previewEl = document.getElementById("ccPreview");

  const charCountEl = document.getElementById("ccCharCount");
  const wordCountEl = document.getElementById("ccWordCount");
  const lineCountEl = document.getElementById("ccLineCount");

  const toUpperBtn = document.getElementById("toUpperBtn");
  const toLowerBtn = document.getElementById("toLowerBtn");
  const toTitleBtn = document.getElementById("toTitleBtn");
  const toSentenceBtn = document.getElementById("toSentenceBtn");
  const toToggleBtn = document.getElementById("toToggleBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  const footerYearEl = document.getElementById("pf-year");
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  function updateStats(text) {
    const chars = text.length;

    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const lines = text.split(/\r\n|\r|\n/).length;

    charCountEl.textContent = String(chars);
    wordCountEl.textContent = String(words);
    lineCountEl.textContent = String(lines);
  }

  function syncPreview(fromInput = true) {
    const sourceText = fromInput ? inputEl.value : previewEl.textContent || "";
    previewEl.textContent = sourceText;
    updateStats(sourceText);
  }

  function toTitleCase(text) {
    return text
      .toLowerCase()
      .split(/(\s+)/)
      .map(part => {
        if (part.trim().length === 0) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");
  }

  function toSentenceCase(text) {
    const lower = text.toLowerCase();
    let result = "";
    let capitalizeNext = true;

    for (let i = 0; i < lower.length; i++) {
      const char = lower[i];
      if (capitalizeNext && /[a-zA-Z]/.test(char)) {
        result += char.toUpperCase();
        capitalizeNext = false;
      } else {
        result += char;
      }

      if (/[.!?]/.test(char)) {
        capitalizeNext = true;
      }
    }

    return result;
  }

  function toToggleCase(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ch.toUpperCase()) {
        out += ch.toLowerCase();
      } else {
        out += ch.toUpperCase();
      }
    }
    return out;
  }

  function convertAndShow(fn, label) {
    const source = inputEl.value;
    if (!source.trim()) {
      showCaseToast("Please enter some text first.");
      return;
    }
    const converted = fn(source);
    previewEl.textContent = converted;
    updateStats(converted);
    showCaseToast(label + " applied");
  }

  toUpperBtn.addEventListener("click", () => {
    convertAndShow(text => text.toUpperCase(), "UPPERCASE");
  });

  toLowerBtn.addEventListener("click", () => {
    convertAndShow(text => text.toLowerCase(), "lowercase");
  });

  toTitleBtn.addEventListener("click", () => {
    convertAndShow(toTitleCase, "Title Case");
  });

  toSentenceBtn.addEventListener("click", () => {
    convertAndShow(toSentenceCase, "Sentence case");
  });

  toToggleBtn.addEventListener("click", () => {
    convertAndShow(toToggleCase, "Toggle case");
  });

  copyBtn.addEventListener("click", async () => {
    const text = previewEl.textContent || "";
    if (!text.trim()) {
      showCaseToast("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showCaseToast("Converted text copied to clipboard");
    } catch (err) {
      showCaseToast("Clipboard not available in this browser");
    }
  });

  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    previewEl.textContent = "";
    updateStats("");
    showCaseToast("Cleared");
  });

  inputEl.addEventListener("input", () => {
    syncPreview(true);
  });

  syncPreview(true);
});
