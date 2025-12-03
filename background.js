// Background service worker for History Cleaner Pro

let settings = {
  schedule: {
    enabled: false,
    interval: 60, // minutes
    clearHistory: true,
    clearCache: false,
    lastRun: null,
    nextRun: null,
  },
  startup: {
    enabled: false,
    clearHistory: true,
    clearCache: false,
  },
  stats: {
    totalCleared: 0,
    lastCleaned: null,
  },
};

// Load settings on startup
chrome.runtime.onStartup.addListener(loadSettings);
chrome.runtime.onInstalled.addListener(loadSettings);

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(["historyCleanerSettings"]);
    if (data.historyCleanerSettings) {
      settings = { ...settings, ...data.historyCleanerSettings };
      console.log("Settings loaded:", settings);

      // Setup alarms if schedule is enabled
      if (settings.schedule.enabled) {
        setupScheduleAlarm();
      }
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

function saveSettings() {
  chrome.storage.sync.set({ historyCleanerSettings: settings });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "quickClear":
      quickClear().then(sendResponse);
      return true;

    case "fullClean":
      fullClean().then(sendResponse);
      return true;

    case "clearUrl":
      clearUrlHistory(request.url).then(sendResponse);
      return true;

    case "clearKeyword":
      clearKeywordHistory(request.keyword).then(sendResponse);
      return true;

    case "clearBulk":
      clearBulkHistory(request.urls).then(sendResponse);
      return true;

    case "clearCache":
      clearCacheData(request.options).then(sendResponse);
      return true;

    case "clearTimeRange":
      clearTimeRangeHistory(request.hours).then(sendResponse);
      return true;

    case "clearAllHistory":
      clearAllHistory().then(sendResponse);
      return true;

    case "saveSchedule":
      saveScheduleSettings(request.schedule).then(sendResponse);
      return true;

    case "saveStartup":
      saveStartupSettings(request.startup).then(sendResponse);
      return true;

    case "getSettings":
      sendResponse({ settings });
      return false;

    case "getStats":
      getStatistics().then(sendResponse);
      return true;

    case "getNextCleanTime":
      sendResponse({ nextCleanTime: getNextCleanTime() });
      return false;
  }
});

// Handle alarms for scheduled cleaning
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "scheduledCleaning") {
    performScheduledCleaning();
  }
});

// Handle browser startup
chrome.runtime.onStartup.addListener(() => {
  if (settings.startup.enabled) {
    performStartupCleaning();
  }
});

// ========== CLEANING FUNCTIONS ==========

async function quickClear() {
  try {
    // Clear last hour of history
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const historyItems = await chrome.history.search({
      text: "",
      startTime: oneHourAgo,
      endTime: Date.now(),
      maxResults: 10000,
    });

    let deleteCount = 0;
    for (const item of historyItems) {
      try {
        await chrome.history.deleteUrl({ url: item.url });
        deleteCount++;
      } catch (error) {
        console.error("Error deleting URL:", item.url, error);
      }
    }

    updateStats(deleteCount);

    return {
      success: true,
      count: deleteCount,
    };
  } catch (error) {
    console.error("Error in quickClear:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function fullClean() {
  try {
    // Clear all history
    await chrome.history.deleteAll();

    // Clear all cache and cookies
    await chrome.browsingData.remove(
      {
        since: 0,
      },
      {
        cache: true,
        cookies: true,
        localStorage: true,
        indexedDB: true,
        webSQL: true,
        serviceWorkers: true,
      }
    );

    updateStats(9999); // Indicate massive cleanup

    return {
      success: true,
      message: "All browsing data cleared",
    };
  } catch (error) {
    console.error("Error in fullClean:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearUrlHistory(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const historyItems = await chrome.history.search({
      text: "",
      startTime: 0,
      maxResults: 10000,
    });

    const exactMatches = historyItems.filter(
      (item) => item.url && normalizeUrl(item.url).includes(normalizedUrl)
    );

    let deleteCount = 0;
    for (const item of exactMatches) {
      try {
        await chrome.history.deleteUrl({ url: item.url });
        deleteCount++;
      } catch (error) {
        console.error("Error deleting URL:", item.url, error);
      }
    }

    updateStats(deleteCount);

    return {
      success: true,
      count: deleteCount,
      url: url,
    };
  } catch (error) {
    console.error("Error in clearUrlHistory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearKeywordHistory(keyword) {
  try {
    const historyItems = await chrome.history.search({
      text: keyword,
      startTime: 0,
      maxResults: 10000,
    });

    let deleteCount = 0;
    for (const item of historyItems) {
      if (
        item.url &&
        (item.url.includes(keyword) ||
          (item.title && item.title.includes(keyword)))
      ) {
        try {
          await chrome.history.deleteUrl({ url: item.url });
          deleteCount++;
        } catch (error) {
          console.error("Error deleting URL:", item.url, error);
        }
      }
    }

    updateStats(deleteCount);

    return {
      success: true,
      count: deleteCount,
      keyword: keyword,
    };
  } catch (error) {
    console.error("Error in clearKeywordHistory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearBulkHistory(urls) {
  try {
    let totalCount = 0;
    let processedUrls = 0;

    for (const url of urls) {
      try {
        const result = await clearUrlHistory(url);
        if (result.success) {
          totalCount += result.count;
          processedUrls++;
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
    }

    return {
      success: true,
      totalCount: totalCount,
      processedUrls: processedUrls,
    };
  } catch (error) {
    console.error("Error in clearBulkHistory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearCacheData(options) {
  try {
    const removeOptions = {
      since: 0,
    };

    const dataTypes = {};

    if (options.cache) {
      dataTypes.cacheStorage = true;
      dataTypes.cache = true;
    }

    if (options.cookies) {
      dataTypes.cookies = true;
    }

    if (options.localStorage) {
      dataTypes.localStorage = true;
      dataTypes.indexedDB = true;
      dataTypes.webSQL = true;
    }

    if (options.history) {
      // Handle history separately
      await chrome.history.deleteAll();
      updateStats(9999);
    }

    if (Object.keys(dataTypes).length > 0) {
      await chrome.browsingData.remove(removeOptions, dataTypes);
    }

    return {
      success: true,
      message: "Cache data cleared",
    };
  } catch (error) {
    console.error("Error in clearCacheData:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearTimeRangeHistory(hours) {
  try {
    const startTime = Date.now() - hours * 60 * 60 * 1000;
    const historyItems = await chrome.history.search({
      text: "",
      startTime: startTime,
      endTime: Date.now(),
      maxResults: 10000,
    });

    let deleteCount = 0;
    for (const item of historyItems) {
      try {
        await chrome.history.deleteUrl({ url: item.url });
        deleteCount++;
      } catch (error) {
        console.error("Error deleting URL:", item.url, error);
      }
    }

    updateStats(deleteCount);

    return {
      success: true,
      count: deleteCount,
      hours: hours,
    };
  } catch (error) {
    console.error("Error in clearTimeRangeHistory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function clearAllHistory() {
  try {
    await chrome.history.deleteAll();
    updateStats(9999);

    return {
      success: true,
      message: "All history cleared",
    };
  } catch (error) {
    console.error("Error in clearAllHistory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ========== SCHEDULED CLEANING ==========

async function saveScheduleSettings(scheduleData) {
  try {
    settings.schedule = {
      ...settings.schedule,
      ...scheduleData,
      lastRun: null,
      nextRun: null,
    };

    if (scheduleData.enabled) {
      setupScheduleAlarm();
    } else {
      chrome.alarms.clear("scheduledCleaning");
    }

    saveSettings();

    return { success: true };
  } catch (error) {
    console.error("Error saving schedule:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function setupScheduleAlarm() {
  if (!settings.schedule.enabled) return;

  chrome.alarms.create("scheduledCleaning", {
    delayInMinutes: 1, // Start checking after 1 minute
    periodInMinutes: settings.schedule.interval,
  });

  settings.schedule.nextRun = new Date(
    Date.now() + settings.schedule.interval * 60000
  );
  saveSettings();
}

async function performScheduledCleaning() {
  try {
    console.log("Performing scheduled cleaning...");

    if (settings.schedule.clearHistory) {
      await chrome.history.deleteAll();
    }

    if (settings.schedule.clearCache) {
      await chrome.browsingData.remove(
        {
          since: 0,
        },
        {
          cache: true,
          cookies: true,
        }
      );
    }

    settings.schedule.lastRun = new Date().toISOString();
    settings.schedule.nextRun = new Date(
      Date.now() + settings.schedule.interval * 60000
    );
    updateStats(9999);
    saveSettings();

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "History Cleaner Pro",
      message: "Scheduled cleaning completed successfully!",
    });
  } catch (error) {
    console.error("Error in scheduled cleaning:", error);
  }
}

// ========== STARTUP CLEANING ==========

async function saveStartupSettings(startupData) {
  try {
    settings.startup = startupData;
    saveSettings();
    return { success: true };
  } catch (error) {
    console.error("Error saving startup settings:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function performStartupCleaning() {
  try {
    console.log("Performing startup cleaning...");

    if (settings.startup.clearHistory) {
      await chrome.history.deleteAll();
    }

    if (settings.startup.clearCache) {
      await chrome.browsingData.remove(
        {
          since: 0,
        },
        {
          cache: true,
          cookies: true,
        }
      );
    }

    updateStats(9999);
  } catch (error) {
    console.error("Error in startup cleaning:", error);
  }
}

// ========== STATISTICS ==========

async function getStatistics() {
  try {
    // Get history count
    const historyItems = await chrome.history.search({
      text: "",
      startTime: 0,
      maxResults: 100000, // Large number to get count
    });

    return {
      success: true,
      historyCount: historyItems.length,
      lastCleaned: settings.stats.lastCleaned || "Never",
      totalCleared: settings.stats.totalCleared,
    };
  } catch (error) {
    console.error("Error getting statistics:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function updateStats(count) {
  settings.stats.totalCleared += count;
  settings.stats.lastCleaned = new Date().toLocaleString();
  saveSettings();
}

// ========== HELPER FUNCTIONS ==========

function normalizeUrl(url) {
  let normalized = url.toLowerCase();
  normalized = normalized.replace(/^https?:\/\//, "");
  normalized = normalized.replace(/^www\./, "");
  normalized = normalized.replace(/\/$/, "");
  return normalized;
}

function getNextCleanTime() {
  if (!settings.schedule.enabled || !settings.schedule.nextRun) {
    return "Not scheduled";
  }

  const nextRun = new Date(settings.schedule.nextRun);
  const now = new Date();
  const diffMinutes = Math.round((nextRun - now) / 60000);

  if (diffMinutes <= 0) {
    return "Any minute now...";
  } else if (diffMinutes < 60) {
    return `In ${diffMinutes} minutes`;
  } else if (diffMinutes < 120) {
    return "In 1 hour";
  } else {
    const hours = Math.floor(diffMinutes / 60);
    return `In ${hours} hours`;
  }
}
