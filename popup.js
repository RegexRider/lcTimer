const toggleBtn = document.getElementById("toggleTimerBtn");

toggleBtn.addEventListener("click", async () => {
  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to content script to toggle timer
  chrome.tabs.sendMessage(tab.id, { action: "toggle-timer" });
});
