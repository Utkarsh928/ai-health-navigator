// Skeleton Loader Utilities
// Provides helper functions to create and manage skeleton loaders

(function() {
  'use strict';

  /**
   * Create a skeleton loader for a chart card
   */
  function createChartSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'chart-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-chart"></div>
    `;
    return skeleton;
  }

  /**
   * Create a skeleton loader for a stat card
   */
  function createStatSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton skeleton-stat';
    return skeleton;
  }

  /**
   * Create a skeleton loader for a list item
   */
  function createListItemSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'card';
    skeleton.style.display = 'flex';
    skeleton.style.alignItems = 'center';
    skeleton.style.padding = '16px';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-avatar"></div>
      <div style="flex: 1;">
        <div class="skeleton skeleton-text short" style="margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text medium"></div>
      </div>
    `;
    return skeleton;
  }

  /**
   * Create skeleton loaders for dashboard stats
   */
  function createDashboardStatsSkeleton(count = 5) {
    const container = document.createElement('div');
    container.className = 'dashboard-skeleton';
    
    for (let i = 0; i < count; i++) {
      container.appendChild(createStatSkeleton());
    }
    
    return container;
  }

  /**
   * Create skeleton loaders for chart cards
   */
  function createChartGridSkeleton(count = 4) {
    const container = document.createElement('div');
    container.className = 'dashboard-grid';
    
    for (let i = 0; i < count; i++) {
      container.appendChild(createChartSkeleton());
    }
    
    return container;
  }

  /**
   * Show skeleton loader in an element
   * @param {HTMLElement} element - The element to show skeleton in
   * @param {string} type - Type of skeleton ('chart', 'stat', 'list-item', 'stats-grid', 'charts-grid')
   * @param {number} count - Number of skeletons to create (for grid types)
   */
  function showSkeleton(element, type = 'chart', count = 1) {
    if (!element) return;

    // Store original content
    if (!element.dataset.originalContent) {
      element.dataset.originalContent = element.innerHTML;
    }

    // Clear element
    element.innerHTML = '';

    // Add skeleton based on type
    switch (type) {
      case 'chart':
        element.appendChild(createChartSkeleton());
        break;
      case 'stat':
        element.appendChild(createStatSkeleton());
        break;
      case 'list-item':
        element.appendChild(createListItemSkeleton());
        break;
      case 'stats-grid':
        const statsGrid = createDashboardStatsSkeleton(count);
        element.appendChild(statsGrid);
        break;
      case 'charts-grid':
        const chartsGrid = createChartGridSkeleton(count);
        element.appendChild(chartsGrid);
        break;
      default:
        const defaultSkeleton = document.createElement('div');
        defaultSkeleton.className = 'skeleton';
        defaultSkeleton.style.height = '200px';
        element.appendChild(defaultSkeleton);
    }
  }

  /**
   * Hide skeleton loader and restore original content
   * @param {HTMLElement} element - The element to hide skeleton in
   * @param {string} newContent - Optional new content to set after hiding skeleton
   */
  function hideSkeleton(element, newContent = null) {
    if (!element) return;

    // Add fade-out animation
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      if (newContent !== null) {
        element.innerHTML = newContent;
      } else if (element.dataset.originalContent) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
      }

      element.style.opacity = '1';
    }, 300);
  }

  /**
   * Create a skeleton text line
   */
  function createTextSkeleton(width = '100%', className = '') {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-text ${className}`;
    skeleton.style.width = width;
    return skeleton;
  }

  /**
   * Create a paragraph skeleton
   */
  function createParagraphSkeleton(lines = 3) {
    const container = document.createElement('div');
    for (let i = 0; i < lines; i++) {
      let width = '100%';
      if (i === lines - 1) width = '70%'; // Last line shorter
      container.appendChild(createTextSkeleton(width));
    }
    return container;
  }

  // Export skeleton functions
  window.SkeletonLoader = {
    show: showSkeleton,
    hide: hideSkeleton,
    createChart: createChartSkeleton,
    createStat: createStatSkeleton,
    createListItem: createListItemSkeleton,
    createStatsGrid: createDashboardStatsSkeleton,
    createChartsGrid: createChartGridSkeleton,
    createText: createTextSkeleton,
    createParagraph: createParagraphSkeleton
  };

})();