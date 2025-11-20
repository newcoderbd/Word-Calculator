document.addEventListener("DOMContentLoaded", () => {
  const queryInput = document.getElementById("sfQuery");
  const searchBtn = document.getElementById("sfSearchBtn");
  const messageEl = document.getElementById("sfMessage");
  const contentEl = document.getElementById("sfContent");
  const footerYear = document.getElementById("pf-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function setMessage(type, text) {
    if (!messageEl) return;

    let icon = "fa-circle-info";
    if (type === "loading") icon = "fa-spinner fa-spin";
    if (type === "error") icon = "fa-triangle-exclamation";
    if (type === "success") icon = "fa-circle-check";

    messageEl.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
  }

  function createChip(word, className = "sf-chip") {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = className;
    chip.textContent = word;
    chip.addEventListener("click", () => {
      queryInput.value = word;
      queryInput.focus();
      performSearch(word);
    });
    return chip;
  }

  function renderResult(data, searchedWord) {
    if (!Array.isArray(data) || data.length === 0) {
      contentEl.innerHTML = `
        <div class="sf-empty">
          <i class="fas fa-circle-question"></i>
          <span>No synonyms or antonyms found for "<strong>${searchedWord}</strong>". Try a different word.</span>
        </div>
      `;
      return;
    }

    const entry = data[0];

    let displayWord = entry.word || searchedWord;
    displayWord = displayWord.charAt(0).toUpperCase() + displayWord.slice(1);

    let phoneticText = "";
    if (entry.phonetic) {
      phoneticText = entry.phonetic;
    } else if (Array.isArray(entry.phonetics)) {
      const ph = entry.phonetics.find(p => p.text);
      if (ph && ph.text) {
        phoneticText = ph.text;
      }
    }

    let partOfSpeechLabel = "";
    const allSynonyms = new Set();
    const allAntonyms = new Set();

    if (Array.isArray(entry.meanings)) {
      entry.meanings.forEach(meaning => {
        const pos = meaning.partOfSpeech || "";
        if (!partOfSpeechLabel && pos) {
          partOfSpeechLabel = pos;
        }

        if (Array.isArray(meaning.synonyms)) {
          meaning.synonyms.forEach(s => {
            if (s && typeof s === "string") {
              allSynonyms.add(s);
            }
          });
        }

        if (Array.isArray(meaning.antonyms)) {
          meaning.antonyms.forEach(a => {
            if (a && typeof a === "string") {
              allAntonyms.add(a);
            }
          });
        }

        if (Array.isArray(meaning.definitions)) {
          meaning.definitions.forEach(def => {
            if (Array.isArray(def.synonyms)) {
              def.synonyms.forEach(s => {
                if (s && typeof s === "string") {
                  allSynonyms.add(s);
                }
              });
            }
            if (Array.isArray(def.antonyms)) {
              def.antonyms.forEach(a => {
                if (a && typeof a === "string") {
                  allAntonyms.add(a);
                }
              });
            }
          });
        }
      });
    }

    const synonymsList = Array.from(allSynonyms);
    const antonymsList = Array.from(allAntonyms);

    const container = document.createElement("div");

    const header = document.createElement("div");
    header.className = "sf-word-header";

    const main = document.createElement("div");
    main.className = "sf-word-main";

    const wordEl = document.createElement("div");
    wordEl.className = "sf-word-text";
    wordEl.textContent = displayWord;

    const phoneticEl = document.createElement("div");
    phoneticEl.className = "sf-phonetic";
    phoneticEl.textContent = phoneticText || "";

    main.appendChild(wordEl);
    if (phoneticText) {
      main.appendChild(phoneticEl);
    }

    header.appendChild(main);

    const rightHeader = document.createElement("div");
    rightHeader.style.display = "flex";
    rightHeader.style.flexDirection = "column";
    rightHeader.style.gap = "4px";
    rightHeader.style.alignItems = "flex-end";

    if (partOfSpeechLabel) {
      const badge = document.createElement("div");
      badge.className = "sf-badge";
      badge.innerHTML = `<i class="fas fa-quote-left"></i><span>${partOfSpeechLabel}</span>`;
      rightHeader.appendChild(badge);
    }

    header.appendChild(rightHeader);
    container.appendChild(header);

    const metaRow = document.createElement("div");
    metaRow.className = "sf-meta-row";

    const sourceSpan = document.createElement("span");
    sourceSpan.innerHTML =
      '<i class="fas fa-database"></i><span>Source: dictionaryapi.dev</span>';
    metaRow.appendChild(sourceSpan);

    const countSpan = document.createElement("span");
    countSpan.innerHTML =
      `<i class="fas fa-shapes"></i><span>${synonymsList.length} synonyms, ${antonymsList.length} antonyms</span>`;
    metaRow.appendChild(countSpan);

    container.appendChild(metaRow);

    const grid = document.createElement("div");
    grid.className = "sf-grid";

    const synCol = document.createElement("div");
    synCol.className = "sf-col-block";
    const synTitle = document.createElement("div");
    synTitle.className = "sf-section-title";
    synTitle.innerHTML = '<i class="fas fa-sparkles"></i><span>Synonyms</span>';
    synCol.appendChild(synTitle);

    const synChips = document.createElement("div");
    synChips.className = "sf-chips";

    if (synonymsList.length > 0) {
      synonymsList.slice(0, 40).forEach(word => {
        synChips.appendChild(createChip(word));
      });
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "sf-placeholder";
      placeholder.textContent = "No synonyms found for this word.";
      synCol.appendChild(placeholder);
    }

    if (synonymsList.length > 0) {
      synCol.appendChild(synChips);
    }

    const antCol = document.createElement("div");
    antCol.className = "sf-col-block";
    const antTitle = document.createElement("div");
    antTitle.className = "sf-section-title";
    antTitle.innerHTML =
      '<i class="fas fa-scale-balanced"></i><span>Antonyms</span>';
    antCol.appendChild(antTitle);

    const antChips = document.createElement("div");
    antChips.className = "sf-chips";

    if (antonymsList.length > 0) {
      antonymsList.slice(0, 40).forEach(word => {
        antChips.appendChild(createChip(word));
      });
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "sf-placeholder";
      placeholder.textContent = "No antonyms found for this word.";
      antCol.appendChild(placeholder);
    }

    if (antonymsList.length > 0) {
      antCol.appendChild(antChips);
    }

    grid.appendChild(synCol);
    grid.appendChild(antCol);

    container.appendChild(grid);

    contentEl.innerHTML = "";
    contentEl.appendChild(container);
  }

  async function performSearch(rawWord) {
    const word = (rawWord || queryInput.value || "").trim();

    if (!word) {
      setMessage("info", "Please enter an English word to find synonyms and antonyms.");
      contentEl.innerHTML = `
        <div class="sf-empty">
          <i class="fas fa-circle-info"></i>
          <span>Waiting for a word. Try something like <strong>strong</strong>, <strong>clear</strong>, or <strong>creative</strong>.</span>
        </div>
      `;
      return;
    }

    setMessage("loading", `Searching for synonyms and antonyms of "${word}"...`);

    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word
    )}`;

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorMessage = `No results found for "${word}".`;
        try {
          const errorData = await res.json();
          if (errorData && errorData.title) {
            errorMessage = `${errorData.title}: ${errorData.message || ""}`;
          }
        } catch (_) {
          // ignore parse error
        }

        setMessage("error", errorMessage);
        contentEl.innerHTML = `
          <div class="sf-empty">
            <i class="fas fa-circle-xmark"></i>
            <span>Could not find synonyms or antonyms for "<strong>${word}</strong>". Please check spelling or try a simpler word.</span>
          </div>
        `;
        return;
      }

      const data = await res.json();
      setMessage("success", `Showing synonyms and antonyms for "${word}".`);
      renderResult(data, word);
    } catch (err) {
      console.error("Synonym/antonym lookup failed:", err);
      setMessage(
        "error",
        "Network error. Please check your connection and try again."
      );
      contentEl.innerHTML = `
        <div class="sf-empty">
          <i class="fas fa-wifi"></i>
          <span>There was a problem reaching the dictionary service. Please try again in a moment.</span>
        </div>
      `;
    }
  }

  searchBtn.addEventListener("click", () => {
    performSearch();
  });

  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  setMessage(
    "info",
    'Type a word and press "Search" or hit Enter to explore its synonyms and antonyms.'
  );
});
