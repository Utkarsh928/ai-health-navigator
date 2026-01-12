// Toast Notification System
// Usage: toast.success('Message'), toast.error('Error'), toast.info('Info'), toast.warning('Warning')

(function() {
  'use strict';

  // Create toast container if it doesn't exist
  function getToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  // Toast types with icons and colors
  const toastTypes = {
    success: {
      icon: 'check_circle',
      class: 'success'
    },
    error: {
      icon: 'error',
      class: 'error'
    },
    warning: {
      icon: 'warning',
      class: 'warning'
    },
    info: {
      icon: 'info',
      class: 'info'
    }
  };

  /**
   * Show a toast notification
   * @param {string} type - 'success', 'error', 'warning', or 'info'
   * @param {string} message - The message to display
   * @param {string} title - Optional title
   * @param {number} duration - Duration in milliseconds (default: 5000, 0 = persistent)
   */
  function showToast(type, message, title = null, duration = 5000) {
    const container = getToastContainer();
    const toastConfig = toastTypes[type] || toastTypes.info;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${toastConfig.class}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Build toast content
    toast.innerHTML = `
      <span class="material-icons toast-icon" aria-hidden="true">${toastConfig.icon}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification" type="button">
        <span class="material-icons" aria-hidden="true">close</span>
      </button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(toast);
      }, duration);
    }
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
    
    // Click anywhere on toast to dismiss
    toast.addEventListener('click', (e) => {
      if (e.target === toast || e.target.closest('.toast-content')) {
        removeToast(toast);
      }
    });
    
    return toast;
  }

  /**
   * Remove toast with animation
   */
  function removeToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Clear all toasts
   */
  function clearAllToasts() {
    const container = getToastContainer();
    const toasts = container.querySelectorAll('.toast');
    toasts.forEach(toast => removeToast(toast));
  }

  // Export toast functions
  window.toast = {
    success: (message, title = null, duration = 5000) => showToast('success', message, title, duration),
    error: (message, title = null, duration = 7000) => showToast('error', message, title, duration),
    warning: (message, title = null, duration = 6000) => showToast('warning', message, title, duration),
    info: (message, title = null, duration = 5000) => showToast('info', message, title, duration),
    clear: clearAllToasts
  };

})();