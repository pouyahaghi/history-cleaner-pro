document.addEventListener("DOMContentLoaded", async function () {
  // Load settings
  await loadSettings();
  await updateStats();

  // Toggle schedule settings visibility
  document
    .getElementById("scheduleEnabled")
    .addEventListener("change", function () {
      document.getElementById("scheduleSettings").style.display = this.checked
        ? "block"
        : "none";
    });

  // Toggle startup settings visibility
  document
    .getElementById("startupEnabled")
    .addEventListener("change", function () {
      document.getElementById("startupSettings").style.display = this.checked
        ? "block"
        : "none";
    });

  // Save button
  document.getElementById("saveBtn").addEventListener("click", saveSettings);

  // Reset buttons
  document
    .getElementById("resetSettingsBtn")
    .addEventListener("click", resetSettings);
  document
    .getElementById("resetStatsBtn")
    .addEventListener("click", resetStatistics);

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
        }

        // Startup settings
        if (startup) {
          document.getElementById("startupEnabled").checked =
            startup.enabled || false;
          document.getElementById("startupHistory").checked =
            startup.clearHistory !== false;
          document.getElementById("startupCache").checked =
            startup.clearCache || false;

          document.getElementById("startupSettings").style.display =
            startup.enabled ? "block" : "none";
        }

        // Load other settings from storage
        const data = await chrome.storage.sync.get([
          "historyCleanerAdvancedSettings",
        ]);
        if (data.historyCleanerAdvancedSettings) {
          const advanced = data.historyCleanerAdvancedSettings;

          document.getElementById("quickClearAction").value =
            advanced.quickClearAction || "lastHour";
          document.getElementById("fullCleanAction").value =
            advanced.fullCleanAction || "historyCache";
          document.getElementById("confirmQuickClear").checked =
            advanced.confirmQuickClear !== false;
          document.getElementById("confirmFullClear").checked =
            advanced.confirmFullClear !== false;
          document.getElementById("confirmAllHistory").checked =
            advanced.confirmAllHistory !== false;
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showStatus("Error loading settings", "error");
    }
  }

  async function saveSettings() {
    const settings = {
      schedule: {
        enabled: document.getElementById("scheduleEnabled").checked,
        interval: parseInt(document.getElementById("intervalSelect").value),
        clearHistory: document.getElementById("scheduleHistory").checked,
        clearCache: document.getElementById("scheduleCache").checked,
      },
      startup: {
        enabled: document.getElementById("startupEnabled").checked,
        clearHistory: document.getElementById("startupHistory").checked,
        clearCache: document.getElementById("startupCache").checked,
      },
    };

    const advancedSettings = {
      quickClearAction: document.getElementById("quickClearAction").value,
      fullCleanAction: document.getElementById("fullCleanAction").value,
      confirmQuickClear: document.getElementById("confirmQuickClear").checked,
      confirmFullClear: document.getElementById("confirmFullClear").checked,
      confirmAllHistory: document.getElementById("confirmAllHistory").checked,
    };

    try {
      // Save main settings
      const response = await chrome.runtime.sendMessage({
        action: "saveSchedule",
        schedule: settings.schedule,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to save schedule");
      }

      // Save startup settings
      const startupResponse = await chrome.runtime.sendMessage({
        action: "saveStartup",
        startup: settings.startup,
      });

      if (!startupResponse.success) {
        throw new Error(
          startupResponse.error || "Failed to save startup settings"
        );
      }

      // Save advanced settings
      await chrome.storage.sync.set({
        historyCleanerAdvancedSettings: advancedSettings,
      });

      showStatus("All settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showStatus("Error saving settings: " + error.message, "error");
    }
  }

  async function updateStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getStats",
      });

      if (response.success) {
        const statsContainer = document.getElementById("statsContainer");
        statsContainer.innerHTML = `
          <div class="stat-card">
            <div class="stat-value">${response.historyCount.toLocaleString()}</div>
            <div class="stat-label">History Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${response.totalCleared.toLocaleString()}</div>
            <div class="stat-label">Total Cleared</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${response.lastCleaned}</div>
            <div class="stat-label">Last Cleaned</div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  async function resetSettings() {
    if (
      !confirm("Are you sure? This will reset ALL settings to default values.")
    ) {
      return;
    }

    try {
      // Reset to default settings
      const defaultSettings = {
        schedule: {
          enabled: false,
          interval: 60,
          clearHistory: true,
          clearCache: false,
        },
        startup: {
          enabled: false,
          clearHistory: true,
          clearCache: false,
        },
      };

      await chrome.runtime.sendMessage({
        action: "saveSchedule",
        schedule: defaultSettings.schedule,
      });

      await chrome.runtime.sendMessage({
        action: "saveStartup",
        startup: defaultSettings.startup,
      });

      // Clear advanced settings
      await chrome.storage.sync.remove(["historyCleanerAdvancedSettings"]);

      // Reload settings
      await loadSettings();

      showStatus("All settings reset to defaults!", "success");
    } catch (error) {
      console.error("Error resetting settings:", error);
      showStatus("Error resetting settings", "error");
    }
  }

  async function resetStatistics() {
    if (
      !confirm("Are you sure? This will reset all statistics and counters.")
    ) {
      return;
    }

    try {
      // This would need to be implemented in background.js
      // For now, we'll show a message
      showStatus("Statistics reset feature coming soon!", "info");
    } catch (error) {
      console.error("Error resetting statistics:", error);
      showStatus("Error resetting statistics", "error");
    }
  }

  function showStatus(message, type) {
    const statusDiv = document.getElementById("statusMessage");
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }
});
