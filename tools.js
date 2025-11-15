// Basic DOM helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initMobileMenu();
  initAuthModal();
  initToolsFiltering();
});

// Footer year
function initYear() {
  const yearEl = document.getElementById("pf-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Mobile nav
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileCloseBtn = document.getElementById("mobileCloseBtn");
  const mobileNav = document.getElementById("mobileNav");
  const mobileOverlay = document.getElementById("mobileOverlay");

  if (!mobileMenuBtn || !mobileNav || !mobileOverlay) return;

  const open = () => {
    mobileNav.classList.add("active");
    mobileOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    mobileNav.classList.remove("active");
    mobileOverlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  mobileMenuBtn.addEventListener("click", open);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener("click", close);
  mobileOverlay.addEventListener("click", close);

  $$(".mobile-link").forEach((link) => {
    link.addEventListener("click", close);
  });

  const openAuthBtnMobile = document.getElementById("openAuthBtnMobile");
  if (openAuthBtnMobile) {
    openAuthBtnMobile.addEventListener("click", () => {
      close();
      openAuthModal();
    });
  }
}

// Simple auth modal (demo only)
function initAuthModal() {
  const openBtn = document.getElementById("openAuthBtn");
  const overlay = document.getElementById("authOverlay");
  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("authCloseBtn");

  if (!overlay || !modal) return;

  const open = () => {
    overlay.style.display = "block";
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    overlay.style.display = "none";
    modal.style.display = "none";
    document.body.style.overflow = "";
  };

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function openAuthModal() {
  const overlay = document.getElementById("authOverlay");
  const modal = document.getElementById("authModal");
  if (!overlay || !modal) return;
  overlay.style.display = "block";
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

// Tools filtering & search
function initToolsFiltering() {
  const searchInput = document.getElementById("toolSearchInput");
  const filterContainer = document.getElementById("toolsFilter");
  const cards = $$("#toolsGrid .tool-card");
  const countLabel = document.getElementById("toolsCountLabel");
  const emptyState = document.getElementById("toolsEmptyState");

  if (!cards.length) return;

  let currentCategory = "all";
  let currentQuery = "";

  // Filter pills
  if (filterContainer) {
    filterContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      $$(".filter-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-category") || "all";
      applyFilters(cards, currentCategory, currentQuery, countLabel, emptyState);
    });
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentQuery = (searchInput.value || "").toLowerCase().trim();
      applyFilters(cards, currentCategory, currentQuery, countLabel, emptyState);
    });
  }

  // Coming soon click handler
  cards.forEach((card) => {
    const link = card.querySelector(".tool-link");
    if (!link) return;

    const comingSoon = link.getAttribute("data-coming-soon") === "true";
    if (comingSoon) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const title = card.querySelector("h3")?.textContent || "This tool";
        showToast(`${title} is coming soon. Stay tuned!`);
      });
    }
  });

  // Initial render
  applyFilters(cards, currentCategory, currentQuery, countLabel, emptyState);
}

function applyFilters(cards, category, query, countLabel, emptyState) {
  let visibleCount = 0;

  cards.forEach((card) => {
    const cardCategory = card.getAttribute("data-category") || "other";
    const name = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const keywords = (card.getAttribute("data-keywords") || "").toLowerCase();

    const matchCategory = category === "all" || cardCategory === category;

    const matchQuery =
      !query || name.includes(query) || keywords.includes(query);

    const show = matchCategory && matchQuery;
    card.style.display = show ? "flex" : "none";
    if (show) visibleCount++;
  });

  if (countLabel) {
    if (!query && category === "all") {
      countLabel.textContent = "Showing all tools";
    } else {
      const catLabel =
        category === "all"
          ? "all categories"
          : `"${category.charAt(0).toUpperCase() + category.slice(1)}"`;
      const searchLabel = query ? ` matching “${query}”` : "";
      countLabel.textContent = `Showing ${visibleCount} tool(s) in ${catLabel}${searchLabel}`;
    }
  }

  if (emptyState) {
    emptyState.hidden = visibleCount > 0;
  }
}

// Toast helper
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;

  toast.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}
