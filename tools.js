// tools.js
// All text is written in US English as requested.

// Wait for DOM ready
document.addEventListener("DOMContentLoaded", function () {
  initMobileNav();
  initSignInModal();
  initToolModal();
  initFooterYear();
});

/* ------------ MOBILE NAV ------------ */
function initMobileNav() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const mobileCloseBtn = document.getElementById("mobileCloseBtn");
  const mobileOverlay = document.getElementById("mobileOverlay");

  if (!mobileMenuBtn || !mobileNav || !mobileCloseBtn || !mobileOverlay) return;

  function openNav() {
    mobileNav.classList.add("open");
    mobileOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    mobileNav.classList.remove("open");
    mobileOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  mobileMenuBtn.addEventListener("click", openNav);
  mobileCloseBtn.addEventListener("click", closeNav);
  mobileOverlay.addEventListener("click", closeNav);

  // Close when clicking a mobile nav link
  mobileNav.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", closeNav);
  });
}

/* ------------ SIGN-IN MODAL ------------ */
function initSignInModal() {
  const openBtnDesktop = document.getElementById("openSignIn");
  const openBtnMobile = document.getElementById("openSignInMobile");
  const overlay = document.getElementById("signinOverlay");
  const modal = document.getElementById("signinModal");
  const closeBtn = document.getElementById("closeSignIn");

  if (!overlay || !modal) return;

  function openModal() {
    overlay.classList.add("show");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("show");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (openBtnDesktop) openBtnDesktop.addEventListener("click", openModal);
  if (openBtnMobile) openBtnMobile.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

/* ------------ TOOL MODAL (DEMO PANEL) ------------ */
function initToolModal() {
  const overlay = document.getElementById("toolModalOverlay");
  const modal = document.getElementById("toolModal");
  const titleEl = document.getElementById("toolModalTitle");
  const bodyEl = document.getElementById("toolModalBody");
  const closeBtn = document.getElementById("closeToolModal");

  if (!overlay || !modal || !titleEl || !bodyEl || !closeBtn) return;

  function openToolPanel(toolName, toolId) {
    titleEl.textContent = toolName || "Tool Panel";

    // You can later swap this placeholder with real tool interfaces.
    bodyEl.innerHTML = `
      <p>
        This is a dedicated workspace for <strong>${toolName}</strong>.
        At this stage, the panel is a demo layout only.
      </p>
      <div class="tool-modal-placeholder">
        <p>
          Here you can load a custom editor, preview area, or configuration form
          for the <strong>${toolId}</strong> feature. When you are ready to integrate
          the final logic, you can connect this panel to your main editor or a separate
          processing workflow.
        </p>
      </div>
    `;

    overlay.classList.add("show");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeToolPanel() {
    overlay.classList.remove("show");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  // Attach triggers to all tool cards
  document.querySelectorAll(".tool-card").forEach(card => {
    const btn = card.querySelector(".tool-open-btn");
    const toolName = card.getAttribute("data-tool-name");
    const toolId = card.getAttribute("data-tool-id");

    if (btn) {
      btn.addEventListener("click", function () {
        openToolPanel(toolName, toolId);
      });
    }

    // Optional: clicking entire card could also open tool
    card.addEventListener("dblclick", function () {
      openToolPanel(toolName, toolId);
    });
  });

  closeBtn.addEventListener("click", closeToolPanel);
  overlay.addEventListener("click", closeToolPanel);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeToolPanel();
    }
  });
}

/* ------------ FOOTER YEAR ------------ */
function initFooterYear() {
  const yearSpan = document.getElementById("footerYear");
  if (!yearSpan) return;
  yearSpan.textContent = new Date().getFullYear();
}
