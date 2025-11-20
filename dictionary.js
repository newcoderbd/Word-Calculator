document.addEventListener("DOMContentLoaded", () => {
  const queryInput = document.getElementById("dictQuery");
  const searchBtn = document.getElementById("dictSearchBtn");
  const messageEl = document.getElementById("dictMessage");
  const contentEl = document.getElementById("dictContent");
  const footerYear = document.getElementById("pf-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  let currentAudio = null;

  function setMessage(type, text) {
    if (!messageEl) return;
    let icon = "fa-circle-info";
    if (type === "loading") icon = "fa-spinner fa-spin";
    if (type === "error") icon = "fa-triangle-exclamation";
    if (type === "success") icon = "fa-circle-check";

    messageEl.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
  }

  function createSynonymPill(word) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "dict-synonym-pill";
    pill.textContent = word;
    pill.addEventListener("click", () => {
      queryInput.value = word;
      queryInput.focus();
      performSearch(word);
    });
    return pill;
  }

  function renderResult(data, searchedWord) {
    if (!Array.isArray(data) || data.length === 0) {
      contentEl.innerHTML = `
        <div class="dict-empty">
          <i class="fas fa-circle-question"></i>
          <span>No definitions found for "<strong>${searchedWord}</strong>". Try a different word or spelling.</span>
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
      if (ph && ph.text) phoneticText = ph.text;
    }

    let audioUrl = "";
    if (Array.isArray(entry.phonetics)) {
      const withAudio = entry.phonetics.find(
        p => p.audio && p.audio.trim().length > 0
      );
      if (withAudio) {
        audioUrl = withAudio.audio;
        if (audioUrl && audioUrl.startsWith("//")) {
          audioUrl = "https:" + audioUrl;
        }
      }
    }

    const definitions = [];
    const allSynonyms = new Set();
    let partOfSpeechLabel = "";

    if (Array.isArray(entry.meanings)) {
      entry.meanings.forEach(meaning => {
        const pos = meaning.partOfSpeech || "";
        if (!partOfSpeechLabel && pos) {
          partOfSpeechLabel = pos;
        }

        if (Array.isArray(meaning.definitions)) {
          meaning.definitions.forEach(def => {
            if (def.definition) {
              definitions.push({
                pos: pos,
                definition: def.definition,
                example: def.example || "",
              });
            }
          });
        }

        if (Array.isArray(meaning.synonyms)) {
          meaning.synonyms.forEach(s => allSynonyms.add(s));
        }
      });
    }

    const topDefinitions = definitions.slice(0, 4);

    const container = document.createElement("div");

    const header = document.createElement("div");
    header.className = "dict-word-header";

    const main = document.createElement("div");
    main.className = "dict-word-main";

    const wordEl = document.createElement("div");
    wordEl.className = "dict-word-text";
    wordEl.textContent = displayWord;

    const phoneticEl = document.createElement("div");
    phoneticEl.className = "dict-phonetic";
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
      badge.className = "dict-badge";
      badge.innerHTML = `<i class="fas fa-quote-left"></i><span>${partOfSpeechLabel}</span>`;
      rightHeader.appendChild(badge);
    }

    if (audioUrl) {
      const audioBtn = document.createElement("button");
      audioBtn.type = "button";
      audioBtn.className = "dict-audio-btn";
      audioBtn.innerHTML = `<i class="fas fa-volume-up"></i><span>Play audio</span>`;
      audioBtn.addEventListener("click", () => {
        try {
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }
          currentAudio = new Audio(audioUrl);
          currentAudio.play();
        } catch (err) {
          console.error("Audio playback error:", err);
        }
      });
      rightHeader.appendChild(audioBtn);
    }

    if (rightHeader.children.length > 0) {
      header.appendChild(rightHeader);
    }

    container.appendChild(header);

    if (topDefinitions.length > 0) {
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "dict-section-title";
      sectionTitle.textContent = "Definitions";
      container.appendChild(sectionTitle);

      topDefinitions.forEach((item, index) => {
        const defBlock = document.createElement("div");
        defBlock.className = "dict-def-block";

        if (item.pos) {
          const posEl = document.createElement("div");
          posEl.className = "dict-pos";
          posEl.textContent = `${index + 1}. ${item.pos}`;
          defBlock.appendChild(posEl);
        }

        const defEl = document.createElement("div");
        defEl.className = "dict-def";
        defEl.textContent = item.definition;
        defBlock.appendChild(defEl);

        if (item.example) {
          const exEl = document.createElement("div");
          exEl.className = "dict-example";
          exEl.textContent = `“${item.example}”`;
          defBlock.appendChild(exEl);
        }

        container.appendChild(defBlock);
      });
    }

    const metaRow = document.createElement("div");
    metaRow.className = "dict-meta-row";

    const sourceSpan = document.createElement("span");
    sourceSpan.innerHTML =
      '<i class="fas fa-database"></i><span>Source: dictionaryapi.dev</span>';
    metaRow.appendChild(sourceSpan);

    if (definitions.length > 4) {
      const moreSpan = document.createElement("span");
      moreSpan.innerHTML =
        `<i class="fas fa-list"></i><span>${definitions.length} total definitions</span>`;
      metaRow.appendChild(moreSpan);
    }

    container.appendChild(metaRow);

    if (allSynonyms.size > 0) {
      const synWrap = document.createElement("div");
      synWrap.className = "dict-synonyms";

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = "Synonyms:";
      synWrap.appendChild(label);

      Array.from(allSynonyms)
        .slice(0, 10)
        .forEach(syn => {
          const pill = createSynonymPill(syn);
          synWrap.appendChild(pill);
        });

      container.appendChild(synWrap);
    }

    contentEl.innerHTML = "";
    contentEl.appendChild(container);
  }

  async function performSearch(wordRaw) {
    const word = (wordRaw || queryInput.value || "").trim();

    if (!word) {
      setMessage("info", "Please enter an English word to search.");
      contentEl.innerHTML = `
        <div class="dict-empty">
          <i class="fas fa-circle-info"></i>
          <span>Waiting for a word. Try something like <strong>clarity</strong> or <strong>momentum</strong>.</span>
        </div>
      `;
      return;
    }

    setMessage("loading", `Searching for "${word}"...`);

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
          // ignore JSON parse error for error response
        }

        setMessage("error", errorMessage);
        contentEl.innerHTML = `
          <div class="dict-empty">
            <i class="fas fa-circle-xmark"></i>
            <span>Could not find a definition for "<strong>${word}</strong>". Please check spelling or try a simpler word.</span>
          </div>
        `;
        return;
      }

      const data = await res.json();
      setMessage("success", `Showing results for "${word}".`);
      renderResult(data, word);
    } catch (err) {
      console.error("Dictionary lookup failed:", err);
      setMessage(
        "error",
        "Network error. Please check your connection and try again."
      );
      contentEl.innerHTML = `
        <div class="dict-empty">
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
    'Type a word and press "Search" or hit Enter to see definitions.'
  );
});
