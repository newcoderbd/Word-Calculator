document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("wfInput");
  const analyzeBtn = document.getElementById("wfAnalyzeBtn");
  const clearBtn = document.getElementById("wfClearBtn");
  const messageEl = document.getElementById("wfMessage");
  const contentEl = document.getElementById("wfContent");
  const ignoreCaseEl = document.getElementById("wfIgnoreCase");
  const excludeStopwordsEl = document.getElementById("wfExcludeStopwords");
  const minLengthEl = document.getElementById("wfMinLength");
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

  const STOPWORDS = new Set([
    "a","an","the","and","or","but","if","then","else","when","while","of","in",
    "on","for","to","from","by","with","about","into","through","during","before",
    "after","above","below","up","down","out","over","under","again","further",
    "then","once","here","there","all","any","both","each","few","more","most",
    "other","some","such","no","nor","not","only","own","same","so","than","too",
    "very","can","will","just","don","should","now","is","am","are","was","were",
    "be","been","being","have","has","had","do","does","did","having"
  ]);

  function analyzeText() {
    const rawText = (inputEl.value || "").trim();

    if (!rawText) {
      setMessage("info", "Please paste some text to analyze word frequency.");
      contentEl.innerHTML = `
        <div class="wf-empty">
          <i class="fas fa-circle-info"></i>
          <span>Waiting for content. Paste your article, blog post, or text above and click <strong>Analyze text</strong>.</span>
        </div>
      `;
      return;
    }

    setMessage("loading", "Analyzing word frequency...");

    const ignoreCase = !!ignoreCaseEl.checked;
    const excludeStopwords = !!excludeStopwordsEl.checked;
    const minLength = parseInt(minLengthEl.value || "1", 10) || 1;

    let textToProcess = rawText;
    if (ignoreCase) {
      textToProcess = textToProcess.toLowerCase();
    }

    const tokens = textToProcess.match(/[a-zA-Z]+/g) || [];

    const freqMap = new Map();
    let totalWords = 0;

    for (let token of tokens) {
      const word = ignoreCase ? token.toLowerCase() : token;

      if (word.length < minLength) continue;
      if (excludeStopwords && STOPWORDS.has(word.toLowerCase())) continue;

      totalWords++;
      freqMap.set(word, (freqMap.get(word) || 0) + 1);
    }

    if (totalWords === 0 || freqMap.size === 0) {
      setMessage(
        "error",
        "No valid words found based on your filters. Try lowering the minimum length or disabling stopword exclusion."
      );
      contentEl.innerHTML = `
        <div class="wf-empty">
          <i class="fas fa-circle-question"></i>
          <span>No words passed the current filters. Adjust your settings and try again.</span>
        </div>
      `;
      return;
    }

    const entries = Array.from(freqMap.entries());
    entries.sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    const uniqueWords = entries.length;
    const topPreview = entries.slice(0, 5);

    setMessage(
      "success",
      `Analysis complete: ${totalWords} words, ${uniqueWords} unique words.`
    );

    const container = document.createElement("div");

    const summary = document.createElement("div");
    summary.className = "wf-summary";

    const cardTotal = document.createElement("div");
    cardTotal.className = "wf-s-card";
    cardTotal.innerHTML = `
      <div class="wf-s-label"><i class="fas fa-hashtag"></i><span>Total words</span></div>
      <div class="wf-s-value">${totalWords}</div>
      <div class="wf-s-sub">Tokens after filtering &amp; cleaning</div>
    `;
    summary.appendChild(cardTotal);

    const cardUnique = document.createElement("div");
    cardUnique.className = "wf-s-card";
    const lexicalDiversity = (uniqueWords / totalWords * 100).toFixed(1);
    cardUnique.innerHTML = `
      <div class="wf-s-label"><i class="fas fa-layer-group"></i><span>Unique words</span></div>
      <div class="wf-s-value">${uniqueWords}</div>
      <div class="wf-s-sub">Lexical diversity: ${lexicalDiversity}%</div>
    `;
    summary.appendChild(cardUnique);

    const cardTop = document.createElement("div");
    cardTop.className = "wf-s-card";
    let topText = "Top words: ";
    topText += topPreview
      .map(([word, count]) => `${word} (${count})`)
      .join(", ");
    cardTop.innerHTML = `
      <div class="wf-s-label"><i class="fas fa-ranking-star"></i><span>Most frequent</span></div>
      <div class="wf-s-sub">${topText}</div>
    `;
    summary.appendChild(cardTop);

    container.appendChild(summary);

    const tableWrap = document.createElement("div");
    tableWrap.className = "wf-table-wrap";

    const header = document.createElement("div");
    header.className = "wf-table-header";
    header.innerHTML = `
      <span><i class="fas fa-table"></i><span>Full word frequency list</span></span>
      <span>${entries.length} unique words</span>
    `;
    tableWrap.appendChild(header);

    const table = document.createElement("table");
    table.className = "wf-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Word</th>
        <th>Count</th>
        <th>Share</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    entries.slice(0, 300).forEach(([word, count], index) => {
      const row = document.createElement("tr");

      const rankCell = document.createElement("td");
      rankCell.textContent = index + 1;
      row.appendChild(rankCell);

      const wordCell = document.createElement("td");
      wordCell.className = "word-cell";
      wordCell.textContent = word;
      row.appendChild(wordCell);

      const countCell = document.createElement("td");
      countCell.textContent = count;
      row.appendChild(countCell);

      const shareCell = document.createElement("td");
      const pct = (count / totalWords) * 100;
      shareCell.textContent = `${pct.toFixed(2)}%`;
      row.appendChild(shareCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);

    container.appendChild(tableWrap);

    contentEl.innerHTML = "";
    contentEl.appendChild(container);
  }

  analyzeBtn.addEventListener("click", () => {
    analyzeText();
  });

  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    contentEl.innerHTML = `
      <div class="wf-empty">
        <i class="fas fa-wand-magic-sparkles"></i>
        <span>Text cleared. Paste new content to analyze word frequency.</span>
      </div>
    `;
    setMessage(
      "info",
      "Paste your text again and click Analyze text to see updated statistics."
    );
  });

  inputEl.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      analyzeText();
    }
  });

  setMessage(
    "info",
    "Paste your text above and click Analyze text to get a full word frequency breakdown."
  );
});
