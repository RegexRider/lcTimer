let timerInterval = null;
let seconds = 0;
let running = false;
let currentProblemId = null; // store current problem identifier

function startTimer() {
  if (!running) {
    running = true;
    timerInterval = setInterval(() => {
      seconds++;
      saveTime();
    }, 1000);
  }
}

function pauseTimer() {
  running = false;
  clearInterval(timerInterval);
}

function resetTimer() {
  running = false;
  clearInterval(timerInterval);
  seconds = 0;
  saveTime();
}

function saveTime() {
  if (!currentProblemId) return;
  const key = `timer_${currentProblemId}`;
  chrome.storage.local.set({ [key]: seconds });
}

function loadTime(problemId, callback) {
  const key = `timer_${problemId}`;
  chrome.storage.local.get([key], (result) => {
    seconds = result[key] || 0;
    currentProblemId = problemId;
    callback(seconds);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_TIMER") {
    startTimer();
  } else if (message.type === "PAUSE_TIMER") {
    pauseTimer();
  } else if (message.type === "RESET_TIMER") {
    resetTimer();
  } else if (message.type === "GET_TIMER") {
    sendResponse({ seconds, running });
  } else if (message.type === "LOAD_PROBLEM_TIMER") {
    // message.problemId expected
    if (message.problemId) {
      loadTime(message.problemId, () => {
        sendResponse({ seconds, running });
      });
      // keep listener alive for async response
      return true;
    }
  } else if (message.type === "CLEAR_TIMER") {
    // Clear timer and stop for problem switch
    resetTimer();
    currentProblemId = null;
  }
  return false;
});
