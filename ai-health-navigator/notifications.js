// Health Notification System
let notificationPermission = Notification.permission;
let notificationInterval = null;
let notificationSettings = {
  enabled: false,
  breakReminders: true,
  breakInterval: 60, // minutes
  healthTips: true,
  healthTipsInterval: 120, // minutes
  quietHours: { start: 22, end: 8 }, // 10 PM to 8 AM
  lastBreakNotification: null,
  lastHealthTipNotification: null
};

// Load settings from localStorage
function loadNotificationSettings() {
  const saved = localStorage.getItem('healthNotificationSettings');
  if (saved) {
    notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
  }
}

// Save settings to localStorage
function saveNotificationSettings() {
  localStorage.setItem('healthNotificationSettings', JSON.stringify(notificationSettings));
}

// Request notification permission
async function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    notificationPermission = await Notification.requestPermission();
  } else {
    notificationPermission = Notification.permission;
  }
  return notificationPermission === 'granted';
}

// Check if we're in quiet hours
function isQuietHours() {
  const now = new Date();
  const hour = now.getHours();
  const { start, end } = notificationSettings.quietHours;
  
  if (start > end) {
    // Quiet hours span midnight (e.g., 22 to 8)
    return hour >= start || hour < end;
  } else {
    return hour >= start && hour < end;
  }
}

// Health break reminders
const breakReminders = [
  "⏰ Take a 5-minute break! Stretch your back and walk around.",
  "💪 Time for a break! Stand up, stretch, and take deep breaths.",
  "🧘 Take 5 minutes to relax. Stretch your neck and shoulders.",
  "🚶 Stand up and walk around for a few minutes. Your body will thank you!",
  "✨ Break time! Do some light stretching to prevent stiffness.",
  "🌿 Take a short break. Look away from your screen and stretch.",
  "💚 Time for a wellness break! Stretch your back and move around.",
  "🎯 Quick break reminder: Stand up, stretch, and hydrate!"
];

// Health tips
const healthTips = [
  "💧 Remember to drink water throughout the day!",
  "😴 Getting enough sleep is crucial for your health.",
  "🍎 Eat regular, balanced meals to maintain energy.",
  "🧘 Practice deep breathing to reduce stress.",
  "📱 Take regular breaks from screens to protect your eyes.",
  "🏃 Regular exercise helps maintain physical and mental health.",
  "☀️ Get some sunlight and fresh air when possible.",
  "📝 Track your symptoms and health patterns regularly."
];

// Send notification
function sendNotification(title, body, icon = '🩺') {
  if (notificationPermission !== 'granted' || !notificationSettings.enabled) {
    return;
  }

  if (isQuietHours()) {
    return; // Don't send during quiet hours
  }

  try {
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico', // You can add a custom icon
      badge: '/favicon.ico',
      tag: 'health-reminder',
      requireInteraction: false,
      silent: false
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Send break reminder
function sendBreakReminder() {
  if (!notificationSettings.breakReminders) return;
  
  const now = Date.now();
  const lastNotification = notificationSettings.lastBreakNotification;
  
  // Check if enough time has passed
  if (lastNotification && (now - lastNotification) < notificationSettings.breakInterval * 60 * 1000) {
    return;
  }

  const reminder = breakReminders[Math.floor(Math.random() * breakReminders.length)];
  sendNotification('Break Reminder', reminder);
  notificationSettings.lastBreakNotification = now;
  saveNotificationSettings();
}

// Send health tip
function sendHealthTip() {
  if (!notificationSettings.healthTips) return;
  
  const now = Date.now();
  const lastNotification = notificationSettings.lastHealthTipNotification;
  
  // Check if enough time has passed
  if (lastNotification && (now - lastNotification) < notificationSettings.healthTipsInterval * 60 * 1000) {
    return;
  }

  const tip = healthTips[Math.floor(Math.random() * healthTips.length)];
  sendNotification('Health Tip', tip);
  notificationSettings.lastHealthTipNotification = now;
  saveNotificationSettings();
}

// Start notification system
function startNotifications() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  if (!notificationSettings.enabled || notificationPermission !== 'granted') {
    return;
  }

  // Check every minute
  notificationInterval = setInterval(() => {
    sendBreakReminder();
    sendHealthTip();
  }, 60000); // Check every minute
}

// Stop notifications
function stopNotifications() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

// Initialize notification system
function initNotifications() {
  loadNotificationSettings();
  
  // Request permission if not already granted/denied
  if (notificationPermission === 'default') {
    // Don't request immediately, let user enable it through settings
    return;
  }

  if (notificationSettings.enabled && notificationPermission === 'granted') {
    startNotifications();
  }
}

// Create notification settings UI
function createNotificationSettingsUI() {
  const settingsHTML = `
    <div id="notificationSettingsPanel" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10001; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1976d2;">🔔 Notification Settings</h3>
        <button id="closeNotificationSettings" style="background: #d32f2f; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <input type="checkbox" id="notificationsEnabled" ${notificationSettings.enabled ? 'checked' : ''} style="width: 20px; height: 20px;">
          <span style="font-weight: 500;">Enable Notifications</span>
        </label>
        <p style="font-size: 14px; color: #666; margin: 5px 0 0 30px;">Receive health reminders and tips</p>
      </div>

      <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <input type="checkbox" id="breakRemindersEnabled" ${notificationSettings.breakReminders ? 'checked' : ''} style="width: 20px; height: 20px;">
          <span style="font-weight: 500;">Break Reminders</span>
        </label>
        <div style="margin-left: 30px;">
          <label style="display: block; margin-bottom: 5px; font-size: 14px;">Interval (minutes):</label>
          <input type="number" id="breakInterval" value="${notificationSettings.breakInterval}" min="15" max="180" step="15" style="width: 100px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
        </div>
      </div>

      <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <input type="checkbox" id="healthTipsEnabled" ${notificationSettings.healthTips ? 'checked' : ''} style="width: 20px; height: 20px;">
          <span style="font-weight: 500;">Health Tips</span>
        </label>
        <div style="margin-left: 30px;">
          <label style="display: block; margin-bottom: 5px; font-size: 14px;">Interval (minutes):</label>
          <input type="number" id="healthTipsInterval" value="${notificationSettings.healthTipsInterval}" min="60" max="480" step="30" style="width: 100px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="font-weight: 500; display: block; margin-bottom: 10px;">Quiet Hours (No notifications):</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="number" id="quietStart" value="${notificationSettings.quietHours.start}" min="0" max="23" style="width: 80px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
          <span>to</span>
          <input type="number" id="quietEnd" value="${notificationSettings.quietHours.end}" min="0" max="23" style="width: 80px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">24-hour format (0-23)</p>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 25px;">
        <button id="saveNotificationSettings" class="primary-btn" style="flex: 1;">Save Settings</button>
        <button id="testNotification" class="secondary-btn" style="flex: 1;">Test Notification</button>
      </div>
    </div>
    <div id="notificationSettingsOverlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;"></div>
  `;

  document.body.insertAdjacentHTML('beforeend', settingsHTML);

  // Event listeners
  document.getElementById('closeNotificationSettings').addEventListener('click', () => {
    document.getElementById('notificationSettingsPanel').style.display = 'none';
    document.getElementById('notificationSettingsOverlay').style.display = 'none';
  });

  document.getElementById('notificationSettingsOverlay').addEventListener('click', () => {
    document.getElementById('notificationSettingsPanel').style.display = 'none';
    document.getElementById('notificationSettingsOverlay').style.display = 'none';
  });

  document.getElementById('saveNotificationSettings').addEventListener('click', async () => {
    const enabled = document.getElementById('notificationsEnabled').checked;
    
    if (enabled && notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please allow notifications in your browser settings to enable this feature.');
        return;
      }
    }

    notificationSettings.enabled = enabled;
    notificationSettings.breakReminders = document.getElementById('breakRemindersEnabled').checked;
    notificationSettings.breakInterval = parseInt(document.getElementById('breakInterval').value);
    notificationSettings.healthTips = document.getElementById('healthTipsEnabled').checked;
    notificationSettings.healthTipsInterval = parseInt(document.getElementById('healthTipsInterval').value);
    notificationSettings.quietHours = {
      start: parseInt(document.getElementById('quietStart').value),
      end: parseInt(document.getElementById('quietEnd').value)
    };

    saveNotificationSettings();

    if (enabled && notificationPermission === 'granted') {
      startNotifications();
    } else {
      stopNotifications();
    }

    alert('Notification settings saved!');
    document.getElementById('notificationSettingsPanel').style.display = 'none';
    document.getElementById('notificationSettingsOverlay').style.display = 'none';
  });

  document.getElementById('testNotification').addEventListener('click', async () => {
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please allow notifications to test.');
        return;
      }
    }
    sendNotification('Test Notification', 'This is a test notification from Health Navigator! 🩺');
  });
}

// Show notification settings
function showNotificationSettings() {
  const panel = document.getElementById('notificationSettingsPanel');
  const overlay = document.getElementById('notificationSettingsOverlay');
  
  if (!panel) {
    createNotificationSettingsUI();
  }
  
  document.getElementById('notificationSettingsPanel').style.display = 'block';
  document.getElementById('notificationSettingsOverlay').style.display = 'block';
}

// Add notification button to navbar
function addNotificationButton() {
  // Check if button already exists
  if (document.getElementById('notificationSettingsBtn')) {
    return;
  }

  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  const notificationBtn = document.createElement('button');
  notificationBtn.id = 'notificationSettingsBtn';
  notificationBtn.innerHTML = '🔔';
  notificationBtn.style.cssText = 'background: #1976d2; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 18px; margin-left: 10px;';
  notificationBtn.title = 'Notification Settings';
  notificationBtn.addEventListener('click', showNotificationSettings);

  // Insert before logout button or at the end
  const logoutBtn = navLinks.querySelector('.logout-btn');
  if (logoutBtn) {
    navLinks.insertBefore(notificationBtn, logoutBtn);
  } else {
    navLinks.appendChild(notificationBtn);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
    addNotificationButton();
  });
} else {
  initNotifications();
  addNotificationButton();
}

// Export functions for global use
window.showNotificationSettings = showNotificationSettings;
window.requestNotificationPermission = requestNotificationPermission;

