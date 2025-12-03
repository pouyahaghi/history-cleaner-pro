History Cleaner Pro - Chrome Extension
A powerful, all-in-one Chrome extension for complete browsing privacy and data management

🚀 Overview
History Cleaner Pro is a comprehensive privacy tool for Chrome that gives you complete control over your browsing data. Whether you want to delete specific website history, clear cache automatically, or schedule regular cleanups - this extension has you covered!

✨ Features
🎯 Targeted History Cleaning
URL-based cleaning: Remove history for specific websites
Keyword search: Delete all history containing specific keywords
Bulk operations: Clear multiple URLs at once
Time-based filtering: Delete history from last hour, today, or custom ranges

🔥 Advanced Cache Management
Selective cache cleaning: Choose what to clear:
Cached images and files
Cookies and site data
Local storage
IndexedDB and WebSQL
One-click full clean: Remove all browsing data instantly
Smart cleanup: Preserve important data while removing clutter

⏰ Automated Scheduling
Custom intervals: Clean every 15min, 30min, 1hr, 3hrs, 6hrs, 12hrs, daily, or weekly
Startup cleaning: Automatically clean when Chrome starts
Background operation: Runs silently without interrupting your work
Notifications: Get alerts when cleaning completes

⚡ Quick Actions
One-click Quick Clear: Instantly clean recent history
Full Clean: Comprehensive cleanup with confirmation
Predefined ranges: Clear last hour, today, or all time
Custom presets: Configure your own quick actions

📊 Smart Features
Real-time statistics: Track items cleared and remaining
Visual feedback: Success/error notifications
Tabbed interface: Organized by cleaning type
Dark mode ready: Modern, clean UI design

🛠️ Installation
Method 1: Manual Installation (Developer Mode)
Download the extension from GitHub

#bash
git clone https://github.com/yourusername/history-cleaner-pro.git

Open Chrome Extensions Page
Navigate to chrome://extensions/
Or click Chrome menu → More Tools → Extensions
Enable Developer Mode
Toggle the "Developer mode" switch in top-right
Load Unpacked Extension
Click "Load unpacked" button
Select the extension folder
Pin the Extension
Click the puzzle piece icon in Chrome's toolbar
Pin "History Cleaner Pro" for easy access

📖 How to Use
Basic Usage
Click the extension icon in Chrome toolbar
Choose cleaning type from tabs:
Targeted: Clean specific URLs or keywords
Scheduled: Set up automatic cleaning
Advanced: Cache management and quick actions
Configure options and click clean!

Quick Start Guide
🎯 Clean Specific Website History
1. Open extension
2. Go to "Targeted" tab
3. Enter URL: https://facebook.com
4. Click "Clear History for URL"
🔥 Clear Cache & Cookies
1. Open extension
2. Go to "Advanced" tab
3. Select data types to clear
4. Click "Clear Selected Data"
⏰ Set Up Automatic Cleaning
1. Open extension
2. Go to "Scheduled" tab
3. Enable "Automatic cleaning"
4. Set interval: Every hour
5. Choose what to clean
6. Save settings
⚡ Quick One-Click Cleaning
1. Click extension icon
2. Click "Quick Clear" for recent history
   OR
3. Click "Full Clean" for complete cleanup
   
🔧 Configuration
Settings Page
Access advanced configuration:
Click gear icon ⚙️ in popup
Or navigate to chrome://extensions → History Cleaner Pro → Options

Available Settings:
Quick Clear Action: Configure behavior
Full Clean Action: Set cleanup scope
Confirmations: Toggle warning dialogs
Notification Settings: Control alerts
Statistics: View cleaning history
Reset Options: Restore defaults

📁 Project Structure
history-cleaner-pro/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # Popup logic
├── background.js         # Background service worker
├── options.html          # Settings page
├── options.js           # Settings logic
├── icon.png             # Extension icons
├── README.md            # This file
└── LICENSE              # MIT License

🔌 Technical Details
Permissions Required
Permission	Purpose
history	Access and manage browsing history
storage	Save user preferences and settings
browsingData	Clear cache, cookies, and local storage
alarms	Schedule automatic cleanings
notifications	Show cleaning completion alerts

APIs Used
Chrome History API: History management
Chrome BrowsingData API: Cache/cookie clearing
Chrome Storage API: Settings persistence
Chrome Alarms API: Scheduled tasks
Chrome Runtime API: Extension communication
