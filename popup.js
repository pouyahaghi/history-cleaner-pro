document.addEventListener("DOMContentLoaded", async function () {
  // Load settings
  await loadSettings();
  await updateStats();

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${tabId}-tab`) {
          content.classList.add("active");
        }
      });
    });
  });

  // Settings button
  document.getElementById("settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // ========== QUICK ACTIONS ==========

  // Quick Clear (History only)
  document
    .getElementById("quickClearBtn")
    .addEventListener("click", async () => {
      showLoading("Clearing recent history...");
      try {
        const response = await chrome.runtime.sendMessage({
          action: "quickClear",
        });
        if (response.success) {
          showResult(
            `Quick clear completed! Removed ${response.count} items`,
            "success"
          );
          await updateStats();
        }
      } catch (error) {
        showResult("Error: " + error.message, "error");
      }
    });

  // Full Clean (History + Cache)
  document
    .getElementById("fullClearBtn")
    .addEventListener("click", async () => {
      if (
        confirm(
          "Are you sure? This will clear ALL browsing history, cache, and cookies."
        )
      ) {
        showLoading("Performing full clean...");
        try {
          const response = await chrome.runtime.sendMessage({
            action: "fullClean",
          });
          if (response.success) {
            showResult(
              "Full clean completed! All browsing data removed",
              "success"
            );
            await updateStats();
          }
        } catch (error) {
          showResult("Error: " + error.message, "error");
        }
      }
    });

  // ========== TARGETED CLEANING ==========

  document
    .getElementById("clearUrlBtn")
    .addEventListener("click", clearUrlHistory);
  document.getElementById("urlInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") clearUrlHistory();
  });

  document
    .getElementById("clearKeywordBtn")
    .addEventListener("click", clearKeywordHistory);
  document.getElementById("keywordInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") clearKeywordHistory();
  });

  document
    .getElementById("clearBulkBtn")
    .addEventListener("click", clearBulkHistory);

  // ========== SCHEDULED CLEANING ==========

  // Toggle schedule settings visibility
  document
    .getElementById("scheduleEnabled")
    .addEventListener("change", function () {
      document.getElementById("scheduleSettings").style.display = this.checked
        ? "block"
        : "none";
      document.getElementById("scheduleStatus").style.display = this.checked
        ? "flex"
        : "none";
      if (this.checked) updateNextCleanTime();
    });

  // Save schedule
  document
    .getElementById("saveScheduleBtn")
    .addEventListener("click", saveSchedule);

  // Save startup settings
  document
    .getElementById("saveStartupBtn")
    .addEventListener("click", saveStartupSettings);

  // ========== ADVANCED CLEANING ==========

  // Clear cache
  document
    .getElementById("clearCacheBtn")
    .addEventListener("click", clearCache);

  // Time-based clearing
  document
    .getElementById("clearTodayBtn")
    .addEventListener("click", () => clearTimeRange(24));
  document
    .getElementById("clearLastHourBtn")
    .addEventListener("click", () => clearTimeRange(1));
  document
    .getElementById("clearAllHistoryBtn")
    .addEventListener("click", clearAllHistory);

  // ========== FUNCTIONS ==========

  async function clearUrlHistory() {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) {
      showResult("Please enter a URL", "error");
      return;
    }

    showLoading("Clearing history for URL...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearUrl",
        url: url,
      });

      if (response.success) {
        showResult(
          `Cleared ${response.count} history items for: ${url}`,
          "success"
        );
        document.getElementById("urlInput").value = "";
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function clearKeywordHistory() {
    const keyword = document.getElementById("keywordInput").value.trim();
    if (!keyword) {
      showResult("Please enter a keyword", "error");
      return;
    }

    showLoading("Clearing history for keyword...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearKeyword",
        keyword: keyword,
      });

      if (response.success) {
        showResult(
          `Cleared ${response.count} items containing: "${keyword}"`,
          "success"
        );
        document.getElementById("keywordInput").value = "";
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function clearBulkHistory() {
    const urlsText = document.getElementById("bulkUrlsInput").value.trim();
    if (!urlsText) {
      showResult("Please enter URLs", "error");
      return;
    }

    const urls = urlsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      showResult("No valid URLs found", "error");
      return;
    }

    showLoading(`Clearing ${urls.length} URLs...`);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearBulk",
        urls: urls,
      });

      if (response.success) {
        showResult(
          `Cleared history for ${response.processedUrls} URLs (${response.totalCount} items)`,
          "success"
        );
        document.getElementById("bulkUrlsInput").value = "";
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function clearCache() {
    const options = {
      history: document.getElementById("cacheBrowsing").checked,
      cache: document.getElementById("cacheCache").checked,
      cookies: document.getElementById("cacheCookies").checked,
      localStorage: document.getElementById("cacheLocalStorage").checked,
    };

    // At least one option must be selected
    if (!Object.values(options).some((v) => v)) {
      showResult("Please select at least one option", "error");
      return;
    }

    showLoading("Clearing selected data...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearCache",
        options: options,
      });

      if (response.success) {
        let message = "Cleared: ";
        const clearedItems = [];
        if (options.history) clearedItems.push("history");
        if (options.cache) clearedItems.push("cache");
        if (options.cookies) clearedItems.push("cookies");
        if (options.localStorage) clearedItems.push("local storage");

        message += clearedItems.join(", ");
        showResult(message, "success");
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function clearTimeRange(hours) {
    const confirmMsg =
      hours === 1
        ? "Clear last hour of history?"
        : `Clear last ${hours} hours of history?`;

    if (!confirm(confirmMsg)) return;

    showLoading(`Clearing last ${hours} hours...`);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearTimeRange",
        hours: hours,
      });

      if (response.success) {
        showResult(
          `Cleared ${response.count} items from last ${hours} hours`,
          "success"
        );
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function clearAllHistory() {
    if (
      !confirm(
        "⚠️ WARNING: This will delete ALL browsing history. This action cannot be undone. Are you sure?"
      )
    ) {
      return;
    }

    showLoading("Clearing all history...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "clearAllHistory",
      });

      if (response.success) {
        showResult("All history cleared successfully!", "success");
        await updateStats();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function saveSchedule() {
    const schedule = {
      enabled: document.getElementById("scheduleEnabled").checked,
      interval: parseInt(document.getElementById("intervalSelect").value),
      clearHistory: document.getElementById("scheduleHistory").checked,
      clearCache: document.getElementById("scheduleCache").checked,
    };

    showLoading("Saving schedule...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSchedule",
        schedule: schedule,
      });

      if (response.success) {
        showResult("Schedule saved successfully!", "success");
        updateNextCleanTime();
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function saveStartupSettings() {
    const startup = {
      enabled: document.getElementById("startupEnabled").checked,
      clearHistory: document.getElementById("startupHistory").checked,
      clearCache: document.getElementById("startupCache").checked,
    };

    showLoading("Saving startup settings...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveStartup",
        startup: startup,
      });

      if (response.success) {
        showResult("Startup settings saved!", "success");
      } else {
        showResult("Error: " + (response.error || "Unknown error"), "error");
      }
    } catch (error) {
      showResult("Error: " + error.message, "error");
    }
  }

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSettings",
      });

      if (response.settings) {
        const { schedule, startup } = response.settings;

        // Schedule settings
        if (schedule) {
          document.getElementById("scheduleEnabled").checked =
            schedule.enabled || false;
          document.getElementById("intervalSelect").value =
            schedule.interval || 60;
          document.getElementById("scheduleHistory").checked =
            schedule.clearHistory !== false;
          document.getElementById("scheduleCache").checked =
            schedule.clearCache || false;

          document.getElementById("scheduleSettings").style.display =
            schedule.enabled ? "block" : "none";
          document.getElementById("scheduleStatus").style.display =
            schedule.enabled ? "flex" : "none";

          if (schedule.enabled) {
            updateNextCleanTime();
          }
        }

        // Startup settings
        if (startup) {
          document.getElementById("startupEnabled").checked =
            startup.enabled || false;
          document.getElementById("startupHistory").checked =
            startup.clearHistory !== false;
          document.getElementById("startupCache").checked =
            startup.clearCache || false;
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  async function updateStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getStats",
      });

      if (response.success) {
        document.getElementById("historyCount").textContent =
          response.historyCount.toLocaleString();
        document.getElementById("lastCleaned").textContent =
          response.lastCleaned || "Never";
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  function updateNextCleanTime() {
    chrome.runtime.sendMessage({ action: "getNextCleanTime" }, (response) => {
      if (response.nextCleanTime) {
        document.getElementById("nextCleanTime").textContent =
          response.nextCleanTime;
      }
    });
  }

  function showLoading(message = "Processing...") {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div>${message}</div>
      </div>
    `;
    resultDiv.className = "result";
  }

  function showResult(message, type) {
    const resultDiv = document.getElementById("result");
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (resultDiv.textContent === message) {
        resultDiv.textContent = "";
        resultDiv.className = "result";
      }
    }, 5000);
  }
});
