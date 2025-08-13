// Utility to parse problem slug from LeetCode URL path
function getProblemIdFromUrl(urlPath) {
  const parts = urlPath.split("/").filter(Boolean);
  const problemsIndex = parts.indexOf("problems");
  if (problemsIndex !== -1 && parts.length > problemsIndex + 1) {
    return parts[problemsIndex + 1];
  }
  return null;
}

// Create the timer UI container and controls
function createTimerUI() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "4px";
  container.style.right = "400px";
  container.style.color = "white";
  container.style.padding = "0 10px";
  container.style.borderRadius = "8px";
  container.style.zIndex = "9999";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.width = "285px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "10px";

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.justifyContent = "space-between";
  controls.style.gap = "10px";

  const startPauseBtn = document.createElement("button");
  startPauseBtn.textContent = "Start";
  startPauseBtn.style.flexShrink = "0";

  const timerDisplay = document.createElement("div");
  timerDisplay.textContent = "00:00:00";
  timerDisplay.style.fontSize = "28px";
  timerDisplay.style.flexGrow = "1";
  timerDisplay.style.textAlign = "center";
  timerDisplay.style.userSelect = "none";

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.style.flexShrink = "0";

  const stopBtn = document.createElement("button");
  stopBtn.textContent = "Stop";
  stopBtn.style.flexShrink = "0";

  const lapBtn = document.createElement("button");
  lapBtn.textContent = "Lap";
  lapBtn.style.flexShrink = "0";

  const toggleLapBtn = document.createElement("button");
  toggleLapBtn.textContent = "Hide";
  toggleLapBtn.style.flexShrink = "0";
  toggleLapBtn.style.display = "none"; // Initially hidden

  controls.appendChild(startPauseBtn);
  controls.appendChild(timerDisplay);
  controls.appendChild(resetBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(lapBtn);
  controls.appendChild(toggleLapBtn);

  const lapList = document.createElement("div");
  lapList.style.color = "white";
  lapList.style.padding = "10px";
  lapList.style.borderRadius = "8px";
  lapList.style.fontFamily = "Arial, sans-serif";
  lapList.style.width = "100%";
  lapList.style.maxHeight = "200px";
  lapList.style.overflowY = "auto";
  lapList.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
  lapList.style.border = "1px solid #ccc";

  container.appendChild(controls);
  container.appendChild(lapList);
  document.body.appendChild(container);

  return {
    container,
    timerDisplay,
    startPauseBtn,
    resetBtn,
    stopBtn,
    lapBtn,
    lapList,
    toggleLapBtn,
  };
}

function formatTime(sec) {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const secs = String(sec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function makeDraggable(element) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + "px";
    element.style.left = element.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

(function () {
  let timerInterval = null;
  let seconds = 0;
  let running = false;
  let lapTimes = [];
  let timerHidden = false;
  let currentProblemId = null;
  let lapsVisible = true;

  const {
    container,
    timerDisplay,
    startPauseBtn,
    resetBtn,
    stopBtn,
    lapBtn,
    lapList,
    toggleLapBtn,
  } = createTimerUI();

  makeDraggable(container);

  function setVisible(visible) {
    container.style.display = visible ? "flex" : "none";
    if (visible && lapTimes.length > 0) {
      lapList.style.display = lapsVisible ? "block" : "none";
      toggleLapBtn.style.display = "inline-block";
    } else {
      lapList.style.display = "none";
      toggleLapBtn.style.display = "none";
    }
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(seconds);
  }

  function updateLapList() {
    lapList.innerHTML = "";
    if (lapTimes.length === 0) {
      lapList.style.display = "none";
      toggleLapBtn.style.display = "none";
    } else {
      lapTimes.forEach((lapTime, idx) => {
        const lapItem = document.createElement("div");
        lapItem.textContent = `Lap ${idx + 1}: ${formatTime(lapTime)}`;
        lapItem.style.borderBottom = "1px solid #ccc";
        lapItem.style.padding = "3px 0";
        lapList.appendChild(lapItem);
      });
      lapList.style.display = lapsVisible ? "block" : "none";
      toggleLapBtn.style.display = "inline-block";
    }
  }

  toggleLapBtn.addEventListener("click", () => {
    lapsVisible = !lapsVisible;
    lapList.style.display = lapsVisible ? "block" : "none";
    toggleLapBtn.textContent = lapsVisible ? "Hide" : "Show";
  });

  function persistState() {
    if (!currentProblemId) return;
    chrome.storage.local.set({
      [`timer-${currentProblemId}`]: {
        seconds,
        lapTimes,
        running,
      },
    });
  }

  function loadState(problemId) {
    chrome.storage.local.get([`timer-${problemId}`], (result) => {
      const saved = result[`timer-${problemId}`];
      if (saved) {
        seconds = saved.seconds || 0;
        lapTimes = saved.lapTimes || [];
        running = saved.running || false;
        updateDisplay();
        updateLapList();
        if (running) {
          startTimer();
        }
      } else {
        resetTimer();
      }
    });
  }

  function startTimer() {
    if (running) return;
    running = true;
    startPauseBtn.textContent = "Pause";
    timerInterval = setInterval(() => {
      seconds++;
      updateDisplay();
      persistState();
    }, 1000);
  }

  function pauseTimer() {
    running = false;
    startPauseBtn.textContent = "Start";
    clearInterval(timerInterval);
    persistState();
  }

  function resetTimer() {
    pauseTimer();
    seconds = 0;
    lapTimes = [];
    updateDisplay();
    updateLapList();
    persistState();
  }

  function stopTimer() {
    pauseTimer();
    seconds = 0;
    lapTimes = [];
    updateDisplay();
    updateLapList();
    persistState();
  }

  startPauseBtn.addEventListener("click", () => {
    if (running) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener("click", () => {
    resetTimer();
    startTimer();
  });

  stopBtn.addEventListener("click", () => {
    stopTimer();
  });

  lapBtn.addEventListener("click", () => {
    if (!running) return;
    lapTimes.push(seconds);
    updateLapList();
    persistState();
  });

  function checkPage() {
    const newProblemId = getProblemIdFromUrl(window.location.pathname);
    if (newProblemId && newProblemId !== currentProblemId) {
      currentProblemId = newProblemId;
      setVisible(!timerHidden);
      loadState(currentProblemId);
    } else if (!newProblemId) {
      setVisible(false);
      stopTimer();
    }
  }

  chrome.storage.local.get(["timerHidden"], (result) => {
    timerHidden = result.timerHidden || false;
    checkPage();
  });

  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      checkPage();
    }
  }, 1000);

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggle-timer") {
      timerHidden = !timerHidden;
      chrome.storage.local.set({ timerHidden: timerHidden }, () => {
        setVisible(!timerHidden);
        if (timerHidden) {
          stopTimer();
        } else {
          checkPage();
        }
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyA" && running) {
      lapTimes.push(seconds);
      updateLapList();
      persistState();
    }
    if (e.altKey && e.code === "KeyS") {
      if (!running) {
        startTimer();
      } else {
        stopTimer();
      }
    }
    if (e.altKey && e.code === "KeyW") {
      if (running) {
        resetTimer();
        startTimer();
      }
    }
    if (e.altKey && e.code === "KeyX") {
      if (running) {
        pauseTimer();
      } else {
        startTimer();
      }
    }
  });
})();
