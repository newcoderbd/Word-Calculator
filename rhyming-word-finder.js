document.addEventListener("DOMContentLoaded", () => {
  const queryInput = document.getElementById("rfQuery");
  const searchBtn = document.getElementById("rfSearchBtn");
  const messageEl = document.getElementById("rfMessage");
  const contentEl = document.getElementById("rfContent");
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

  function createChip(word, className = "rf-chip") {
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

  function renderResults(baseWord, perfectRhymes, nearRhymes) {
    const container = document.createElement("div");

    const header = document.createElement("div");
    header.className = "rf-word-header";

    const main = document.createElement("div");
    main.className = "rf-word-main";

    const wordEl = document.createElement("div");
    wordEl.className = "rf-word-text";
    wordEl.textContent =
      baseWord.charAt(0).toUpperCase() + baseWord.slice(1);

    main.appendChild(wordEl);
    header.appendChild(main);

    const rightHeader = document.createElement("div");
    rightHeader.style.display = "flex";
    rightHeader.style.flexDirection = "column";
    rightHeader.style.gap = "4px";
    rightHeader.style.alignItems = "flex-end";

    const badge = document.createElement("div");
    badge.className = "rf-badge";
    badge.innerHTML =
      '<i class="fas fa-music"></i><span>Rhyme suggestions</span>';
    rightHeader.appendChild(badge);

    header.appendChild(rightHeader);
    container.appendChild(header);

    const metaRow = document.createElement("div");
    metaRow.className = "rf-meta-row";

    const sourceSpan = document.createElement("span");
    sourceSpan.innerHTML =
      '<i class="fas fa-database"></i><span>Source: api.datamuse.com</span>';
    metaRow.appendChild(sourceSpan);

    const countSpan = document.createElement("span");
    countSpan.innerHTML =
      `<i class="fas fa-shapes"></i><span>${perfectRhymes.length} perfect rhymes, ${nearRhymes.length} near rhymes</span>`;
    metaRow.appendChild(countSpan);

    container.appendChild(metaRow);

    const grid = document.createElement("div");
    grid.className = "rf-grid";

    const perfectCol = document.createElement("div");
    perfectCol.className = "rf-col-block";
    const perfectTitle = document.createElement("div");
    perfectTitle.className = "rf-section-title";
    perfectTitle.innerHTML =
      '<i class="fas fa-record-vinyl"></i><span>Perfect rhymes</span>';
    perfectCol.appendChild(perfectTitle);

    const perfectChips = document.createElement("div");
    perfectChips.className = "rf-chips";

    if (perfectRhymes.length > 0) {
      perfectRhymes.slice(0, 80).forEach((word) => {
        perfectChips.appendChild(createChip(word));
      });
      perfectCol.appendChild(perfectChips);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "rf-placeholder";
      placeholder.textContent =
        "No perfect rhymes found for this word.";
      perfectCol.appendChild(placeholder);
    }

    const nearCol = document.createElement("div");
    nearCol.className = "rf-col-block";
    const nearTitle = document.createElement("div");
    nearTitle.className = "rf-section-title";
    nearTitle.innerHTML =
      '<i class="fas fa-wave-square"></i><span>Near rhymes</span>';
    nearCol.appendChild(nearTitle);

    const nearChips = document.createElement("div");
    nearChips.className = "rf-chips";

    if (nearRhymes.length > 0) {
      nearRhymes.slice(0, 80).forEach((word) => {
        nearChips.appendChild(createChip(word));
      });
      nearCol.appendChild(nearChips);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "rf-placeholder";
      placeholder.textContent =
        "No near rhymes found for this word.";
      nearCol.appendChild(placeholder);
    }

    grid.appendChild(perfectCol);
    grid.appendChild(nearCol);

    container.appendChild(grid);

    contentEl.innerHTML = "";
    contentEl.appendChild(container);
  }

  async function performSearch(rawWord) {
    const word = (rawWord || queryInput.value || "").trim();

    if (!word) {
      setMessage(
        "info",
        "Please enter an English word to find rhyming suggestions."
      );
      contentEl.innerHTML = `
        <div class="rf-empty">
          <i class="fas fa-circle-info"></i>
          <span>Waiting for a word. Try something like <strong>time</strong>, <strong>light</strong>, or <strong>heart</strong>.</span>
        </div>
      `;
      return;
    }

    setMessage(
      "loading",
      `Searching for rhymes of "${word}" (perfect & near)...`
    );

    const base = "https://api.datamuse.com/words";
    const perfectUrl = `${base}?rel_rhy=${encodeURIComponent(
      word
    )}&max=80`;
    const nearUrl = `${base}?rel_nry=${encodeURIComponent(
      word
    )}&max=80`;

    try {
      const [perfectRes, nearRes] = await Promise.all([
        fetch(perfectUrl),
        fetch(nearUrl),
      ]);

      if (!perfectRes.ok && !nearRes.ok) {
        setMessage(
          "error",
          `Could not find rhymes for "${word}". Please try a different word.`
        );
        contentEl.innerHTML = `
          <div class="rf-empty">
            <i class="fas fa-circle-xmark"></i>
            <span>No rhyming results found for "<strong>${word}</strong>".</span>
          </div>
        `;
        return;
      }

      const perfectData = perfectRes.ok ? await perfectRes.json() : [];
      const nearData = nearRes.ok ? await nearRes.json() : [];

      const perfectRhymes = Array.isArray(perfectData)
        ? perfectData
            .filter((item) => item && typeof item.word === "string")
            .map((item) => item.word)
        : [];

      const nearRhymes = Array.isArray(nearData)
        ? nearData
            .filter((item) => item && typeof item.word === "string")
            .map((item) => item.word)
        : [];

      if (perfectRhymes.length === 0 && nearRhymes.length === 0) {
        setMessage(
          "error",
          `No perfect or near rhymes were found for "${word}".`
        );
        contentEl.innerHTML = `
          <div class="rf-empty">
            <i class="fas fa-circle-question"></i>
            <span>We could not find any rhyming matches for "<strong>${word}</strong>". Try a simpler or shorter word.</span>
          </div>
        `;
        return;
      }

      setMessage(
        "success",
        `Showing rhyming words for "${word}".`
      );
      renderResults(word, perfectRhymes, nearRhymes);
    } catch (err) {
      console.error("Rhyming lookup failed:", err);
      setMessage(
        "error",
        "Network error. Please check your connection and try again."
      );
      contentEl.innerHTML = `
        <div class="rf-empty">
          <i class="fas fa-wifi"></i>
          <span>There was a problem reaching the rhyming service. Please try again in a moment.</span>
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
    'Type a word and press "Find rhymes" or hit Enter to explore rhyming options.'
  );
});
