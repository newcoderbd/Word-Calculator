document.addEventListener("DOMContentLoaded", () => {
  const inputMain = document.getElementById("plgInputMain");
  const inputRef = document.getElementById("plgInputRef");
  const checkBtn = document.getElementById("plgCheckBtn");
  const clearBtn = document.getElementById("plgClearBtn");

  const scoreEl = document.getElementById("plgScore");
  const scoreLabelEl = document.getElementById("plgScoreLabel");

  const wordsMainEl = document.getElementById("plgWordsMain");
  const wordsRefEl = document.getElementById("plgWordsRef");
  const wordsCommonEl = document.getElementById("plgWordsCommon");

  const highlightedEl = document.getElementById("plgHighlighted");
  const phrasesEl = document.getElementById("plgPhrases");
  const messageEl = document.getElementById("plgMessage");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function tokenize(text) {
    const tokens = text.toLowerCase().match(/[a-z0-9']+/g);
    return tokens || [];
  }

  function cleanWord(word) {
    return word.toLowerCase().replace(/[^a-z0-9']/g, "");
  }

  function classifyScore(score) {
    if (score <= 0) {
      return { label: "No similarity calculated yet", level: "low" };
    }
    if (score < 20) {
      return { label: "Low similarity", level: "low" };
    }
    if (score < 50) {
      return { label: "Moderate similarity", level: "medium" };
    }
    if (score < 80) {
      return { label: "High similarity", level: "high" };
    }
    return { label: "Very high similarity", level: "high" };
  }

  function calculateSimilarity() {
    const mainText = inputMain.value.trim();
    const refText = inputRef.value.trim();

    if (!mainText || !refText) {
      scoreEl.textContent = "0%";
      scoreEl.classList.remove("medium", "high");
      scoreLabelEl.textContent = "Please enter both texts to calculate similarity.";
      wordsMainEl.textContent = "0";
      wordsRefEl.textContent = "0";
      wordsCommonEl.textContent = "0";
      highlightedEl.innerHTML = "Paste both texts and run the check to see highlighted overlaps here.";
      phrasesEl.innerHTML = "<li>No matches yet.</li>";
      if (messageEl) {
        messageEl.innerHTML =
          '<i class="fas fa-circle-info"></i><span>Enter both texts and click <strong>Check plagiarism</strong> to see results.</span>';
      }
      return;
    }

    const mainTokens = tokenize(mainText);
    const refTokens = tokenize(refText);

    const mainSet = new Set(mainTokens);
    const refSet = new Set(refTokens);

    let commonCount = 0;
    mainSet.forEach((word) => {
      if (refSet.has(word)) {
        commonCount++;
      }
    });

    const similarity =
      mainTokens.length > 0 ? (commonCount / mainTokens.length) * 100 : 0;

    // Update stats
    wordsMainEl.textContent = String(mainTokens.length);
    wordsRefEl.textContent = String(refTokens.length);
    wordsCommonEl.textContent = String(commonCount);

    const rounded = Math.round(similarity * 10) / 10;
    scoreEl.textContent = `${rounded}%`;

    scoreEl.classList.remove("medium", "high");
    const clsInfo = classifyScore(rounded);
    scoreLabelEl.textContent = clsInfo.label;
    if (clsInfo.level === "medium") {
      scoreEl.classList.add("medium");
    } else if (clsInfo.level === "high") {
      scoreEl.classList.add("high");
    }

    // Highlight overlapping phrases in main text
    highlightOverlaps(mainText, refTokens);

    if (messageEl) {
      messageEl.innerHTML =
        '<i class="fas fa-circle-check"></i><span>Similarity updated. Higher percentage means more overlapping content.</span>';
    }
  }

  function highlightOverlaps(mainText, refTokens) {
    const refSet = new Set(refTokens);
    const words = mainText.split(/\s+/);
    const markFlags = new Array(words.length).fill(false);
    const phraseSet = new Set();

    for (let i = 0; i < words.length; i++) {
      let run = 0;
      let j = i;
      while (j < words.length) {
        const cleaned = cleanWord(words[j]);
        if (!cleaned || !refSet.has(cleaned)) {
          break;
        }
        run++;
        j++;
      }
      if (run >= 3) {
        for (let k = 0; k < run; k++) {
          markFlags[i + k] = true;
        }
        const phrase = words.slice(i, i + run).join(" ").trim();
        if (phrase.length > 0) {
          phraseSet.add(phrase);
        }
        i = i + run - 1;
      }
    }

    const highlightedHtml = words
      .map((w, idx) =>
        markFlags[idx] ? `<mark>${escapeHtml(w)}</mark>` : escapeHtml(w)
      )
      .join(" ");

    highlightedEl.innerHTML = highlightedHtml || "No overlapping phrases detected.";

    const phrases = Array.from(phraseSet);
    if (phrases.length === 0) {
      phrasesEl.innerHTML = "<li>No 3+ word phrases matched.</li>";
    } else {
      const items = phrases.slice(0, 20).map((p, index) => {
        return `<li>${escapeHtml(p)}<span>(${index + 1})</span></li>`;
      });
      phrasesEl.innerHTML = items.join("");
    }
  }

  function clearAll() {
    inputMain.value = "";
    inputRef.value = "";

    scoreEl.textContent = "0%";
    scoreEl.classList.remove("medium", "high");
    scoreLabelEl.textContent = "No similarity calculated yet";

    wordsMainEl.textContent = "0";
    wordsRefEl.textContent = "0";
    wordsCommonEl.textContent = "0";

    highlightedEl.innerHTML =
      "Paste your text on the left and run the check to see highlighted overlaps here.";
    phrasesEl.innerHTML = "<li>No matches yet.</li>";

    if (messageEl) {
      messageEl.innerHTML =
        '<i class="fas fa-circle-info"></i><span>Enter both texts and click <strong>Check plagiarism</strong> to see results.</span>';
    }
  }

  checkBtn.addEventListener("click", calculateSimilarity);
  clearBtn.addEventListener("click", clearAll);
});
