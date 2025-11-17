document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shForm");
  const typeEl = document.getElementById("shType");
  const dateEl = document.getElementById("shDate");
  const startTimeEl = document.getElementById("shStartTime");
  const durationEl = document.getElementById("shDuration");
  const wordsEl = document.getElementById("shWords");
  const notesEl = document.getElementById("shNotes");
  const clearAllBtn = document.getElementById("shClearAllBtn");

  const totalSessionsEl = document.getElementById("shTotalSessions");
  const totalMinutesEl = document.getElementById("shTotalMinutes");
  const totalWordsEl = document.getElementById("shTotalWords");
  const statusEl = document.getElementById("shStatus");
  const tableWrapEl = document.getElementById("shTableWrap");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const STORAGE_KEY = "wc_session_history_v1";
  let sessions = [];

  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        sessions = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        sessions = parsed;
      } else {
        sessions = [];
      }
    } catch (e) {
      sessions = [];
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      // ignore
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    // Keep as YYYY-MM-DD for simplicity
    return dateStr;
  }

  function formatTime(timeStr) {
    if (!timeStr) return "-";
    return timeStr;
  }

  function formatDuration(minutes) {
    const n = Number(minutes);
    if (!Number.isFinite(n) || n <= 0) return "-";
    if (n < 60) return `${n} min`;
    const hours = Math.floor(n / 60);
    const rem = n % 60;
    if (rem === 0) return `${hours} h`;
    return `${hours} h ${rem} min`;
  }

  function typeToLabelAndClass(type) {
    switch (type) {
      case "writing":
        return { label: "Writing", className: "sh-tag sh-tag-writing" };
      case "reading":
        return { label: "Reading", className: "sh-tag sh-tag-reading" };
      case "focus":
        return { label: "Focus", className: "sh-tag sh-tag-focus" };
      case "planning":
        return { label: "Planning", className: "sh-tag sh-tag-other" };
      case "editing":
        return { label: "Editing", className: "sh-tag sh-tag-other" };
      default:
        return { label: "Other", className: "sh-tag sh-tag-other" };
    }
  }

  function updateSummary() {
    const totalSessions = sessions.length;
    let totalMinutes = 0;
    let totalWords = 0;

    sessions.forEach((s) => {
      const dur = Number(s.durationMinutes);
      if (Number.isFinite(dur) && dur > 0) {
        totalMinutes += dur;
      }
      if (s.type === "writing") {
        const w = Number(s.words || 0);
        if (Number.isFinite(w) && w > 0) {
          totalWords += w;
        }
      }
    });

    totalSessionsEl.textContent = totalSessions;
    totalMinutesEl.textContent = totalMinutes;
    totalWordsEl.textContent = totalWords;

    if (totalSessions === 0) {
      statusEl.textContent =
        "No sessions yet. Add your first session to start tracking your progress.";
    } else {
      statusEl.textContent = `You have logged ${totalSessions} session${
        totalSessions === 1 ? "" : "s"
      } so far. Great job staying consistent.`;
    }
  }

  function renderTable() {
    if (!sessions.length) {
      tableWrapEl.innerHTML =
        '<div class="sh-table-empty">No session history yet. Your recent sessions will appear here.</div>';
      return;
    }

    const sorted = [...sessions].sort((a, b) => {
      // newest first by date + createdAt
      const aDate = a.date || "";
      const bDate = b.date || "";
      if (aDate === bDate) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return aDate < bDate ? 1 : -1;
    });

    let rows = "";

    sorted.forEach((s) => {
      const typeInfo = typeToLabelAndClass(s.type);
      const dateStr = formatDate(s.date);
      const timeStr = formatTime(s.startTime);
      const durationStr = formatDuration(s.durationMinutes);
      const words =
        s.words && Number(s.words) > 0 ? Number(s.words).toString() : "-";
      const notes = s.notes ? s.notes : "";

      rows += `
        <tr data-id="${s.id}">
          <td>
            <span class="${typeInfo.className}">
              ${typeInfo.label}
            </span>
          </td>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${durationStr}</td>
          <td>${words}</td>
          <td>${notes ? notes.replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""}</td>
          <td>
            <button type="button" class="sh-delete-btn" data-id="${s.id}">
              Delete
            </button>
          </td>
        </tr>
      `;
    });

    tableWrapEl.innerHTML = `
      <table class="sh-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Start</th>
            <th>Duration</th>
            <th>Words</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    const deleteButtons = tableWrapEl.querySelectorAll(".sh-delete-btn");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        deleteSession(id);
      });
    });
  }

  function renderAll() {
    updateSummary();
    renderTable();
  }

  function deleteSession(id) {
    if (!id) return;
    sessions = sessions.filter((s) => String(s.id) !== String(id));
    saveSessions();
    renderAll();
  }

  function clearAllSessions() {
    if (!sessions.length) return;
    const confirmClear = window.confirm(
      "Are you sure you want to delete all session history?"
    );
    if (!confirmClear) return;
    sessions = [];
    saveSessions();
    renderAll();
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const type = typeEl.value || "other";
    const date = dateEl.value;
    const durationMinutes = Number(durationEl.value);
    const words = wordsEl.value ? Number(wordsEl.value) : 0;
    const startTime = startTimeEl.value || "";
    const notes = notesEl.value ? notesEl.value.trim() : "";

    if (!date) {
      alert("Please select a date.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      alert("Please enter a valid session duration (minutes).");
      return;
    }

    const newSession = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      type,
      date,
      startTime,
      durationMinutes,
      words: Number.isFinite(words) && words > 0 ? words : 0,
      notes,
      createdAt: Date.now(),
    };

    sessions.push(newSession);
    saveSessions();
    renderAll();

    // Reset only some fields
    durationEl.value = "";
    wordsEl.value = "";
    notesEl.value = "";
  }

  function initDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  // Init
  loadSessions();
  initDefaultDate();
  renderAll();

  form.addEventListener("submit", handleFormSubmit);
  clearAllBtn.addEventListener("click", clearAllSessions);
});
