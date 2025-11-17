document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("tmpUrl");
  const titleInput = document.getElementById("tmpTitle");
  const descInput = document.getElementById("tmpDescription");

  const titleCounter = document.getElementById("tmpTitleCounter");
  const descCounter = document.getElementById("tmpDescCounter");

  const previewUrl = document.getElementById("tmpPreviewUrl");
  const previewTitle = document.getElementById("tmpPreviewTitle");
  const previewDesc = document.getElementById("tmpPreviewDesc");

  const titleMetaInfo = document.getElementById("tmpTitleMetaInfo");
  const descMetaInfo = document.getElementById("tmpDescMetaInfo");

  const copyTitleBtn = document.getElementById("tmpCopyTitle");
  const copyMetaBtn = document.getElementById("tmpCopyMeta");
  const resetBtn = document.getElementById("tmpReset");

  const desktopBtn = document.getElementById("tmpDesktopBtn");
  const mobileBtn = document.getElementById("tmpMobileBtn");
  const googleBox = document.getElementById("tmpGoogleBox");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const DEFAULT_URL = "https://www.wordcalculator.net/example-page";
  const DEFAULT_TITLE = "Example page title for WordCalculator.net";
  const DEFAULT_DESC =
    "This is an example meta description. It shows how your page summary might appear in Google search results.";

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function classifyTitle(len) {
    if (len === 0) return { text: "Title: 0 chars — add a title", cls: "tmp-counter-bad" };
    if (len < 30) return { text: `Title: ${len} chars — too short`, cls: "tmp-counter-warn" };
    if (len >= 30 && len < 50) return { text: `Title: ${len} chars — okay`, cls: "tmp-counter-ok" };
    if (len >= 50 && len <= 60) return { text: `Title: ${len} chars — ideal range`, cls: "tmp-counter-ok" };
    if (len > 60 && len <= 70) return { text: `Title: ${len} chars — may be truncated`, cls: "tmp-counter-warn" };
    return { text: `Title: ${len} chars — likely truncated`, cls: "tmp-counter-bad" };
  }

  function classifyDescription(len) {
    if (len === 0) return { text: "Description: 0 chars — add a description", cls: "tmp-counter-bad" };
    if (len < 70) return { text: `Description: ${len} chars — too short`, cls: "tmp-counter-warn" };
    if (len >= 70 && len < 120) return { text: `Description: ${len} chars — okay`, cls: "tmp-counter-ok" };
    if (len >= 120 && len <= 160) return { text: `Description: ${len} chars — ideal range`, cls: "tmp-counter-ok" };
    if (len > 160 && len <= 200) return { text: `Description: ${len} chars — may be truncated`, cls: "tmp-counter-warn" };
    return { text: `Description: ${len} chars — likely truncated`, cls: "tmp-counter-bad" };
  }

  function updatePreview() {
    const urlVal = urlInput.value.trim() || DEFAULT_URL;
    const titleVal = titleInput.value.trim() || DEFAULT_TITLE;
    const descVal = descInput.value.trim() || DEFAULT_DESC;

    const titleLen = titleInput.value.trim().length;
    const descLen = descInput.value.trim().length;

    previewUrl.textContent = urlVal;
    previewTitle.textContent = titleVal;
    previewDesc.textContent = descVal;

    let titleCounterText = `${titleLen} characters`;
    let descCounterText = `${descLen} characters`;
    let titleClass = "";
    let descClass = "";

    const titleInfo = classifyTitle(titleLen);
    titleCounterText = titleInfo.text;
    titleClass = titleInfo.cls;

    const descInfo = classifyDescription(descLen);
    descCounterText = descInfo.text;
    descClass = descInfo.cls;

    titleCounter.textContent = titleCounterText;
    descCounter.textContent = descCounterText;

    titleCounter.classList.remove("tmp-counter-ok", "tmp-counter-warn", "tmp-counter-bad");
    descCounter.classList.remove("tmp-counter-ok", "tmp-counter-warn", "tmp-counter-bad");

    if (titleClass) {
      titleCounter.classList.add(titleClass);
    }
    if (descClass) {
      descCounter.classList.add(descClass);
    }

    titleMetaInfo.textContent = titleInfo.text;
    descMetaInfo.textContent = descInfo.text;
  }

  function copyTitleTag() {
    const titleVal = titleInput.value.trim();
    const value = titleVal || DEFAULT_TITLE;
    const tag = `<title>${escapeHtml(value)}</title>`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tag).catch(() => {});
    } else {
      const temp = document.createElement("textarea");
      temp.value = tag;
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(temp);
    }
  }

  function copyMetaTag() {
    const descVal = descInput.value.trim();
    const value = descVal || DEFAULT_DESC;
    const tag = `<meta name="description" content="${escapeHtml(value)}">`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tag).catch(() => {});
    } else {
      const temp = document.createElement("textarea");
      temp.value = tag;
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(temp);
    }
  }

  function resetForm() {
    urlInput.value = "";
    titleInput.value = "";
    descInput.value = "";
    updatePreview();
  }

  function setView(mode) {
    if (mode === "mobile") {
      mobileBtn.classList.add("active");
      desktopBtn.classList.remove("active");
      googleBox.style.maxWidth = "360px";
    } else {
      desktopBtn.classList.add("active");
      mobileBtn.classList.remove("active");
      googleBox.style.maxWidth = "600px";
    }
  }

  urlInput.addEventListener("input", updatePreview);
  titleInput.addEventListener("input", updatePreview);
  descInput.addEventListener("input", updatePreview);

  copyTitleBtn.addEventListener("click", copyTitleTag);
  copyMetaBtn.addEventListener("click", copyMetaTag);
  resetBtn.addEventListener("click", resetForm);

  desktopBtn.addEventListener("click", () => setView("desktop"));
  mobileBtn.addEventListener("click", () => setView("mobile"));

  setView("desktop");
  updatePreview();
});
