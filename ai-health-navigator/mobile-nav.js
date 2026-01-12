// Mobile Navigation Handler
// Add this script to all pages with navigation

document.addEventListener('DOMContentLoaded', function() {
  // Create mobile menu toggle button if it doesn't exist
  const navContainer = document.querySelector('.nav-container');
  const navLinks = document.querySelector('.nav-links');
  
  if (navContainer && navLinks && window.innerWidth <= 768) {
    // Check if toggle button already exists
    if (!document.querySelector('.mobile-menu-toggle')) {
      const mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-menu-toggle';
      mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.innerHTML = '<span class="material-icons">menu</span>';
      
      // Insert before nav-links
      navContainer.insertBefore(mobileToggle, navLinks);
      
      // Create mobile overlay
      const overlay = document.createElement('div');
      overlay.className = 'mobile-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
      
      // Toggle menu function
      function toggleMenu() {
        const isActive = navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', !isActive);
        overlay.setAttribute('aria-hidden', isActive);
        
        // Update icon
        const icon = mobileToggle.querySelector('.material-icons');
        icon.textContent = isActive ? 'menu' : 'close';
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? '' : 'hidden';
      }
      
      // Toggle button click
      mobileToggle.addEventListener('click', toggleMenu);
      
      // Close menu when clicking overlay
      overlay.addEventListener('click', toggleMenu);
      
      // Close menu when clicking a link
      navLinks.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          setTimeout(toggleMenu, 300); // Small delay for better UX
        }
      });
      
      // Close menu on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
          toggleMenu();
        }
      });
      
      // Handle window resize
      let resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
          if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            const icon = mobileToggle.querySelector('.material-icons');
            if (icon) icon.textContent = 'menu';
          }
        }, 250);
      });
    }
  }
  
  // Handle existing mobile toggle if present
  const existingToggle = document.querySelector('.mobile-menu-toggle');
  const existingNavLinks = document.querySelector('.nav-links');
  const existingOverlay = document.querySelector('.mobile-overlay') || document.createElement('div');
  
  if (existingToggle && existingNavLinks) {
    if (!existingOverlay.parentElement) {
      existingOverlay.className = 'mobile-overlay';
      existingOverlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(existingOverlay);
    }
    
    function toggleMenu() {
      const isActive = existingNavLinks.classList.contains('active');
      existingNavLinks.classList.toggle('active');
      existingOverlay.classList.toggle('active');
      existingToggle.setAttribute('aria-expanded', !isActive);
      existingOverlay.setAttribute('aria-hidden', isActive);
      
      const icon = existingToggle.querySelector('.material-icons');
      if (icon) {
        icon.textContent = isActive ? 'menu' : 'close';
      }
      
      document.body.style.overflow = isActive ? '' : 'hidden';
    }
    
    existingToggle.addEventListener('click', toggleMenu);
    existingOverlay.addEventListener('click', toggleMenu);
    
    existingNavLinks.addEventListener('click', function(e) {
      if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('button')) {
        setTimeout(toggleMenu, 300);
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && existingNavLinks.classList.contains('active')) {
        toggleMenu();
      }
    });
  }
});