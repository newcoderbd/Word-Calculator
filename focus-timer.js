document.addEventListener("DOMContentLoaded", () => {
  const focusMinutesEl = document.getElementById("focusMinutes");
  const shortBreakMinutesEl = document.getElementById("shortBreakMinutes");
  const longBreakMinutesEl = document.getElementById("longBreakMinutes");
  const sessionsBeforeLongBreakEl = document.getElementById("sessionsBeforeLongBreak");

  const startBtn = document.getElementById("ftStartBtn");
  const pauseBtn = document.getElementById("ftPauseBtn");
  const resetBtn = document.getElementById("ftResetBtn");

  const phaseLabelEl = document.getElementById("ftPhaseLabel");
  const timerDisplayEl = document.getElementById("ftTimerDisplay");
  const sessionInfoEl = document.getElementById("ftSessionInfo");
  const progressFillEl = document.getElementById("ftProgressFill");
  const progressLabelEl = document.getElementById("ftProgressLabel");
  const statusEl = document.getElementById("ftStatus");

  const footerYear = document.getElementById("pf-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const STORAGE_KEY = "wc_focus_timer_settings";

  let timerId = null;
  let currentPhase = "focus"; // "focus" | "shortBreak" | "longBreak"
  let remainingSeconds = 0;
  let phaseTotalSeconds = 0;
  let completedFocusSessions = 0;

  function saveSettings() {
    const data = {
      focusMinutes: focusMinutesEl.value,
      shortBreakMinutes: shortBreakMinutesEl.value,
      longBreakMinutes: longBreakMinutesEl.value,
      sessionsBeforeLongBreak: sessionsBeforeLongBreakEl.value,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.focusMinutes) focusMinutesEl.value = data.focusMinutes;
      if (data.shortBreakMinutes) shortBreakMinutesEl.value = data.shortBreakMinutes;
      if (data.longBreakMinutes) longBreakMinutesEl.value = data.longBreakMinutes;
      if (data.sessionsBeforeLongBreak)
        sessionsBeforeLongBreakEl.value = data.sessionsBeforeLongBreak;
    } catch (e) {
      // ignore
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = m < 10 ? "0" + m : String(m);
    const ss = s < 10 ? "0" + s : String(s);
    return mm + ":" + ss;
  }

  function clampNumber(value, min, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min) return fallback;
    return n;
  }

  function updateUI() {
    timerDisplayEl.textContent = formatTime(remainingSeconds);

    let phaseText = "";
    if (currentPhase === "focus") phaseText = "Focus session";
    else if (currentPhase === "shortBreak") phaseText = "Short break";
    else if (currentPhase === "longBreak") phaseText = "Long break";

    phaseLabelEl.textContent = phaseText;

    const sessionsBeforeLong = clampNumber(
      sessionsBeforeLongBreakEl.value,
      1,
      4
    );

    sessionInfoEl.textContent =
      currentPhase === "focus"
        ? `Focus session ${completedFocusSessions + 1} • Long break after ${sessionsBeforeLong} sessions`
        : `On a break • Completed focus sessions: ${completedFocusSessions}`;

    const progress =
      phaseTotalSeconds > 0
        ? ((phaseTotalSeconds - remainingSeconds) / phaseTotalSeconds) * 100
        : 0;
    const safeProgress = progress < 0 ? 0 : progress > 100 ? 100 : progress;

    progressFillEl.style.width = safeProgress + "%";
    progressLabelEl.textContent = `${Math.round(
      safeProgress
    )}% of current session completed`;
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startPhase(phase) {
    currentPhase = phase;

    const focusMinutes = clampNumber(focusMinutesEl.value, 1, 25);
    const shortBreakMinutes = clampNumber(shortBreakMinutesEl.value, 1, 5);
    const longBreakMinutes = clampNumber(longBreakMinutesEl.value, 1, 15);

    let minutesForPhase = focusMinutes;

    if (phase === "focus") {
      minutesForPhase = focusMinutes;
      setStatus("Stay focused. Avoid distractions until this session ends.");
    } else if (phase === "shortBreak") {
      minutesForPhase = shortBreakMinutes;
      setStatus("Quick break. Stretch, hydrate, and get ready for the next focus session.");
    } else if (phase === "longBreak") {
      minutesForPhase = longBreakMinutes;
      setStatus("Long break. Relax properly before the next deep work block.");
    }

    phaseTotalSeconds = minutesForPhase * 60;
    remainingSeconds = phaseTotalSeconds;

    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = false;

    clearTimer();

    timerId = setInterval(() => {
      remainingSeconds -= 1;

      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        updateUI();
        clearTimer();
        handlePhaseEnd();
      } else {
        updateUI();
      }
    }, 1000);

    updateUI();
  }

  function handlePhaseEnd() {
    if (currentPhase === "focus") {
      completedFocusSessions += 1;
      const sessionsBeforeLong = clampNumber(
        sessionsBeforeLongBreakEl.value,
        1,
        4
      );

      if (completedFocusSessions % sessionsBeforeLong === 0) {
        currentPhase = "longBreak";
        setStatus(
          "Focus block completed! Time for a longer break to recharge."
        );
        startPhase("longBreak");
      } else {
        currentPhase = "shortBreak";
        setStatus("Focus block completed! Take a short break.");
        startPhase("shortBreak");
      }
    } else {
      currentPhase = "focus";
      setStatus("Break finished. Start another focus session when you're ready.");
      startPhase("focus");
    }
  }

  function startNewCycle() {
    saveSettings();
    completedFocusSessions = 0;
    startPhase("focus");
  }

  function pauseOrResume() {
    if (remainingSeconds <= 0 && !timerId) {
      return;
    }

    if (timerId !== null) {
      clearTimer();
      pauseBtn.textContent = "Resume";
      setStatus("Timer paused. Press Resume to continue.");
    } else {
      timerId = setInterval(() => {
        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {
          remainingSeconds = 0;
          updateUI();
          clearTimer();
          handlePhaseEnd();
        } else {
          updateUI();
        }
      }, 1000);
      pauseBtn.textContent = "Pause";
      setStatus("Timer running. Stay focused.");
    }
  }

  function resetTimer() {
    clearTimer();
    const focusMinutes = clampNumber(focusMinutesEl.value, 1, 25);
    completedFocusSessions = 0;
    currentPhase = "focus";
    phaseTotalSeconds = focusMinutes * 60;
    remainingSeconds = phaseTotalSeconds;

    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = false;

    phaseLabelEl.textContent = "Ready to focus";
    statusEl.textContent =
      "Timer reset. Press “Start Focus Session” to begin again.";

    updateUI();
  }

  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    startNewCycle();
  });

  pauseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    pauseOrResume();
  });

  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetTimer();
  });

  focusMinutesEl.addEventListener("change", saveSettings);
  shortBreakMinutesEl.addEventListener("change", saveSettings);
  longBreakMinutesEl.addEventListener("change", saveSettings);
  sessionsBeforeLongBreakEl.addEventListener("change", saveSettings);

  loadSettings();

  const initialFocusMinutes = clampNumber(focusMinutesEl.value, 1, 25);
  currentPhase = "focus";
  phaseTotalSeconds = initialFocusMinutes * 60;
  remainingSeconds = phaseTotalSeconds;
  updateUI();
  setStatus("Press “Start Focus Session” to begin your first Pomodoro.");
});
