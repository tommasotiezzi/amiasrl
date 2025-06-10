// AMIA Website - JavaScript Complete & Fixed
// =============================================

document.addEventListener('DOMContentLoaded', function() {
  // Elementi DOM principali
  const header = document.getElementById('header');
  const body = document.body;
  const menuButton = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('#navbarNav');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // Inizializza funzioni base
  initializeHeader(header, body);
  initializeMobileMenu(menuButton, navbarCollapse);
  initializeNavigation(navLinks, header, navbarCollapse);
  
  // Carica funzioni avanzate con delay per performance
  setTimeout(() => {
    initializeAdvancedFeatures();
  }, 50);
  
  // Initialize language switcher
  setTimeout(() => {
    initializeLanguageSwitcher();
  }, 500);
});

// =============================================
// HEADER E NAVIGAZIONE
// =============================================

function initializeHeader(header, body) {
  if (!header || !body) return;
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('sticky-top');
      body.classList.add('has-sticky-nav');
    } else {
      header.classList.remove('sticky-top');
      body.classList.remove('has-sticky-nav');
    }
  }, { passive: true });
}

function initializeMobileMenu(menuButton, navbarCollapse) {
  if (!menuButton || !navbarCollapse) return;
  
  menuButton.removeAttribute('data-bs-toggle');
  menuButton.removeAttribute('data-bs-target');
  
  menuButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isOpen = navbarCollapse.classList.contains('show');
    
    if (isOpen) {
      navbarCollapse.classList.remove('show');
    } else {
      navbarCollapse.classList.add('show');
    }
    
    menuButton.setAttribute('aria-expanded', !isOpen);
  });
  
  const navLinks = navbarCollapse.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbarCollapse.classList.remove('show');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

function initializeNavigation(navLinks, header, navbarCollapse) {
  if (!navLinks.length) return;
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection || targetId === '#about') {
        let headerHeight = header.offsetHeight || 80;
        
        if (targetId === '#about') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const offsets = {
            '#valori': -30,
            '#persone': -30,
            '#prodotti': 20,
            '#lavoraconnoi': -30
          };
          
          headerHeight += (offsets[targetId] || 0);
          
          window.scrollTo({
            top: targetSection.offsetTop - headerHeight,
            behavior: 'smooth'
          });
        }
      }
      
      if (navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
      }
    });
  });
  
  const firstLink = document.querySelector('.navbar-nav .nav-link[href="#about"]');
  if (firstLink) firstLink.classList.add('active');
}

// =============================================
// FUNZIONI AVANZATE
// =============================================

function initializeAdvancedFeatures() {
  addAnimationStyles();
  
  initializeTimelineCarousel();
  
  setTimeout(() => {
    initializeOptimizedCarousel();
  }, 300);
  
  setTimeout(() => {
    initializeAnimations();
  }, 100);
  
  setTimeout(() => {
    initializeAdvancedNavigation();
  }, 150);
  
  setTimeout(() => {
    initializeProductsSection();
  }, 400);
}

function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .animate-element {
      opacity: 0;
      transform: translateY(50px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .animate-element.animated {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

// =============================================
// SISTEMA DI ANIMAZIONI
// =============================================

function initializeAnimations() {
  initializeValoriAnimations();
  initializeCareersAnimations();
  initializeGeneralAnimations();
}

function initializeValoriAnimations() {
  const valoriItems = document.querySelectorAll('#valori .valori-item');
  if (valoriItems.length === 0) return;
  
  const valoriObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-element', 'animated');
      } else {
        entry.target.classList.remove('animated');
      }
    });
  }, { threshold: 0.25 });
  
  valoriItems.forEach(item => {
    item.classList.remove('animate-on-scroll');
    valoriObserver.observe(item);
  });
}

function initializeCareersAnimations() {
  const careersSection = document.querySelector('#lavoraconnoi');
  const statementItems = document.querySelectorAll('#lavoraconnoi .statement-content');
  
  if (statementItems.length === 0) return;
  
  const careersObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target === careersSection) {
        statementItems.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('animate-element', 'animated');
          }, i * 150);
        });
      } else if (!entry.isIntersecting) {
        statementItems.forEach(item => item.classList.remove('animated'));
      }
    });
  }, { threshold: 0.15 });
  
  careersObserver.observe(careersSection);
}

function initializeGeneralAnimations() {
  const otherElements = document.querySelectorAll(`
    #about .container2 .item,
    #persone .nostra-storia-title,
    #persone .timeline-photo,
    #persone .timeline-description,
    #persone .timeline-controls,
    #persone .current-year,
    #persone .bootcamp-subtitle,
    #persone .infinite-carousel,
    #prodotti .nostra-storia-title
  `);
  
  if (otherElements.length === 0) return;
  
  const generalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-element', 'animated');
      } else {
        entry.target.classList.remove('animated');
      }
    });
  }, { threshold: 0.2 });
  
  otherElements.forEach(element => {
    generalObserver.observe(element);
  });
}

// =============================================
// NAVIGAZIONE AVANZATA
// =============================================

function initializeAdvancedNavigation() {
  let lastClickedTime = 0;
  
  function updateActiveNavOnScroll() {
    if (lastClickedTime && Date.now() - lastClickedTime < 1500) return;
    
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;
    
    if (window.scrollY < 100) {
      document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#about') {
          link.classList.add('active');
        }
      });
      return;
    }
    
    sections.forEach(section => {
      const sectionId = '#' + section.getAttribute('id');
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateActiveNavOnScroll);
      ticking = true;
      setTimeout(() => ticking = false, 100);
    }
  }, { passive: true });
  
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', function() {
      lastClickedTime = Date.now();
    });
  });
}

// =============================================
// TIMELINE CAROUSEL
// =============================================

function initializeTimelineCarousel() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  const prevButton = document.querySelector('.timeline-controls .prev');
  const nextButton = document.querySelector('.timeline-controls .next');
  const currentYearElement = document.querySelector('.current-year');
  
  if (!timelineItems.length || !prevButton || !nextButton || !currentYearElement) return;
  
  let currentIndex = 0;
  
  function updateTimelineDisplay() {
    timelineItems.forEach(item => item.classList.remove('active'));
    timelineItems[currentIndex].classList.add('active');
    
    const currentYear = timelineItems[currentIndex].getAttribute('data-year');
    currentYearElement.textContent = currentYear;
    
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === timelineItems.length - 1;
  }
  
  prevButton.addEventListener('click', function() {
    if (currentIndex > 0) {
      currentIndex--;
      updateTimelineDisplay();
    }
  });
  
  nextButton.addEventListener('click', function() {
    if (currentIndex < timelineItems.length - 1) {
      currentIndex++;
      updateTimelineDisplay();
    }
  });
  
  updateTimelineDisplay();
}

// =============================================
// CAROSELLO INFINITO
// =============================================

function initializeOptimizedCarousel() {
  const carousel = document.querySelector('.infinite-carousel');
  if (!carousel) return;
  
  addCarouselStyles();
  setupCarouselVisibilityControl(carousel);
  setupCarouselHoverControls(carousel);
  optimizeCarouselForMobile(carousel);
}

function addCarouselStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .infinite-carousel {
      will-change: transform;
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .infinite-carousel-wrapper {
      will-change: transform;
      transform: translateZ(0);
      animation-duration: 40s !important;
    }
    
    .infinite-carousel-item {
      will-change: transform;
      backface-visibility: hidden;
    }
    
    .infinite-carousel-item img {
      will-change: auto;
      transform: translateZ(0);
    }
    
    .infinite-carousel:not(.in-viewport) .infinite-carousel-wrapper {
      animation-play-state: paused !important;
    }
    
    @media (max-width: 768px) {
      .infinite-carousel-wrapper {
        animation-duration: 40s !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function setupCarouselVisibilityControl(carousel) {
  const carouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-viewport');
      } else {
        entry.target.classList.remove('in-viewport');
      }
    });
  }, { threshold: 0.1 });
  
  carouselObserver.observe(carousel);
}

function setupCarouselHoverControls(carousel) {
  return;
}

function optimizeCarouselForMobile(carousel) {
  if (window.innerWidth > 768) return;
  
  const images = carousel.querySelectorAll('img');
  images.forEach(img => {
    img.style.imageRendering = 'optimizeSpeed';
  });
}

// =============================================
// SEZIONE PRODOTTI
// =============================================

const activeAnimations = new Map();

function initializeProductsSection() {
  setupProductAnimations();
  setupProductInteractions();
}

function setupProductAnimations() {
  const isMobile = window.innerWidth <= 768;
  
  const productElements = [
    document.querySelector('.product-intro'),
    document.querySelector('.product-highlights'), 
    document.querySelector('.product-metrics'),
    document.querySelector('.download-section')
  ].filter(element => element !== null);
  
  if (isMobile) {
    setupMobileProductAnimations(productElements);
  } else {
    setupDesktopProductAnimations(productElements);
  }
}

function setupMobileProductAnimations(productElements) {
  const mobileObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Only animate if not already animated
        if (element.getAttribute('data-animation-state') !== 'active') {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
          
          if (element.classList.contains('product-highlights')) {
            animateHighlightsMobile(element);
          } else if (element.classList.contains('product-metrics')) {
            animateMetricsMobile(element);
          }
        }
      } else {
        // Only reset if the element is completely out of view
        if (entry.intersectionRatio === 0) {
          handleElementExit(entry.target, true);
        }
      }
    });
  }, { 
    threshold: [0, 0.15],  // Multiple thresholds
    rootMargin: '0px 0px -30px 0px' 
  });
  
  productElements.forEach(element => {
    initializeElementForAnimation(element);
    mobileObserver.observe(element);
  });
}

function setupDesktopProductAnimations(productElements) {
  const desktopObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Only animate if not already animated
        if (element.getAttribute('data-animation-state') !== 'active') {
          if (element.classList.contains('product-intro')) {
            animateProductIntro(element);
          } else if (element.classList.contains('product-highlights')) {
            animateProductHighlights(element);
          } else if (element.classList.contains('product-metrics')) {
            animateProductMetrics(element);
          } else if (element.classList.contains('download-section')) {
            animateDownloadSection(element);
          }
        }
      } else {
        // Only reset if the element is completely out of view
        if (entry.intersectionRatio === 0) {
          handleElementExit(entry.target, false);
        }
      }
    });
  }, {
    threshold: [0, 0.3],  // Multiple thresholds to better track visibility
    rootMargin: '0px 0px -50px 0px'
  });
  
  productElements.forEach(element => {
    initializeElementForAnimation(element);
    
    if (element.classList.contains('product-metrics')) {
      prepareMetricsData(element);
    }
    
    desktopObserver.observe(element);
  });
}

function initializeElementForAnimation(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(30px)';
  element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  
  element.setAttribute('data-animation-state', 'inactive');
}

function prepareMetricsData(container) {
  const metrics = container.querySelectorAll('.metric-value');
  metrics.forEach(metric => {
    if (!metric.getAttribute('data-original-text')) {
      const originalText = metric.textContent.trim();
      metric.setAttribute('data-original-text', originalText);
      
      const matches = originalText.match(/(\d+(?:\.\d+)?)/);
      if (matches) {
        metric.setAttribute('data-target-number', matches[1]);
      }
    }
  });
}

function handleElementExit(element, isMobile) {
  clearElementAnimations(element);
  
  element.style.opacity = '0';
  element.style.transform = isMobile ? 'translateY(15px)' : 'translateY(30px)';
  element.setAttribute('data-animation-state', 'inactive');
  
  if (element.classList.contains('product-highlights')) {
    resetHighlights(element);
  } else if (element.classList.contains('product-metrics')) {
    resetMetrics(element);
  }
}

function clearElementAnimations(element) {
  const elementId = element.dataset.elementId || generateElementId(element);
  
  if (activeAnimations.has(elementId)) {
    const animations = activeAnimations.get(elementId);
    animations.forEach(animationId => {
      clearTimeout(animationId);
    });
    activeAnimations.delete(elementId);
  }
  
  const childMetrics = element.querySelectorAll('.metric-value');
  childMetrics.forEach(metric => {
    const metricId = metric.dataset.animationId;
    if (metricId && activeAnimations.has(metricId)) {
      const animations = activeAnimations.get(metricId);
      animations.forEach(animationId => {
        clearTimeout(animationId);
      });
      activeAnimations.delete(metricId);
    }
  });
}

function generateElementId(element) {
  if (!element.dataset.elementId) {
    element.dataset.elementId = 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  return element.dataset.elementId;
}

function resetHighlights(container) {
  const highlights = container.querySelectorAll('.highlight-item');
  highlights.forEach(highlight => {
    highlight.style.opacity = '0';
    highlight.style.transform = 'translateY(15px)';
    highlight.classList.remove('animate');
  });
}

function resetMetrics(container) {
  const metrics = container.querySelectorAll('.metric-value');
  metrics.forEach(metric => {
    if (metric.dataset.timerId) {
      clearInterval(parseInt(metric.dataset.timerId));
      metric.dataset.timerId = '';
    }
    metric.dataset.animating = 'false';
    
    // Always reset to original text, don't depend on current state
    const originalText = metric.getAttribute('data-original-text');
    if (originalText) {
      metric.textContent = originalText;
    }
  });
}

function animateHighlightsMobile(container) {
  if (container.getAttribute('data-animation-state') === 'active') return;
  container.setAttribute('data-animation-state', 'active');
  
  const highlights = container.querySelectorAll('.highlight-item');
  const elementId = generateElementId(container);
  const timeouts = [];
  
  highlights.forEach((highlight, index) => {
    const timeoutId = setTimeout(() => {
      highlight.style.opacity = '1';
      highlight.style.transform = 'translateY(0)';
      highlight.classList.add('animate');
    }, index * 80);
    
    timeouts.push(timeoutId);
  });
  
  activeAnimations.set(elementId, timeouts);
}

function animateMetricsMobile(container) {
  if (container.getAttribute('data-animation-state') === 'active') return;
  container.setAttribute('data-animation-state', 'active');
  
  const metrics = container.querySelectorAll('.metric-value');
  const elementId = generateElementId(container);
  const timeouts = [];
  
  metrics.forEach((metric, index) => {
    const timeoutId = setTimeout(() => {
      animateCounterNumber(metric, true);
    }, index * 100);
    
    timeouts.push(timeoutId);
  });
  
  activeAnimations.set(elementId, timeouts);
}

function animateProductIntro(element) {
  if (element.getAttribute('data-animation-state') === 'active') return;
  element.setAttribute('data-animation-state', 'active');
  
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
}

function animateProductHighlights(container) {
  if (container.getAttribute('data-animation-state') === 'active') return;
  container.setAttribute('data-animation-state', 'active');
  
  const isMobile = window.innerWidth <= 768;
  
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';
  
  const highlights = container.querySelectorAll('.highlight-item');
  if (highlights.length === 0) return;
  
  const elementId = generateElementId(container);
  const timeouts = [];
  
  highlights.forEach((highlight, index) => {
    highlight.style.opacity = '0';
    highlight.style.transform = 'translateY(15px)';
    highlight.style.transition = isMobile ? 'all 0.4s ease-out' : 'all 0.6s ease-out';
    
    const delay = isMobile ? index * 100 : index * 150;
    
    const timeoutId = setTimeout(() => {
      highlight.style.opacity = '1';
      highlight.style.transform = 'translateY(0)';
      highlight.classList.add('animate');
    }, delay);
    
    timeouts.push(timeoutId);
  });
  
  activeAnimations.set(elementId, timeouts);
}

function animateProductMetrics(container) {
  if (container.getAttribute('data-animation-state') === 'active') return;
  container.setAttribute('data-animation-state', 'active');
  
  const isMobile = window.innerWidth <= 768;
  
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';
  
  const metrics = container.querySelectorAll('.metric-value');
  if (metrics.length === 0) return;
  
  const elementId = generateElementId(container);
  const timeouts = [];
  
  metrics.forEach((metric, index) => {
    const delay = isMobile ? index * 150 : index * 200;
    
    const timeoutId = setTimeout(() => {
      animateCounterNumber(metric, isMobile);
    }, delay);
    
    timeouts.push(timeoutId);
  });
  
  activeAnimations.set(elementId, timeouts);
}

function animateDownloadSection(element) {
  if (element.getAttribute('data-animation-state') === 'active') return;
  element.setAttribute('data-animation-state', 'active');
  
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
}

// FIXED COUNTER ANIMATION FUNCTION
function animateCounterNumber(element, isMobile = false) {
  // Clear any existing animation first
  if (element.dataset.timerId) {
    clearInterval(parseInt(element.dataset.timerId));
    element.dataset.timerId = '';
  }
  
  if (element.dataset.animating === 'true') {
    element.dataset.animating = 'false';
  }
  
  element.dataset.animating = 'true';
  
  // Get target number from data attribute if available, otherwise parse from text
  let targetNumber;
  let suffix = '';
  let hasDecimal = false;
  
  if (element.getAttribute('data-target-number')) {
    targetNumber = parseFloat(element.getAttribute('data-target-number'));
    const originalText = element.getAttribute('data-original-text') || element.textContent.trim();
    suffix = originalText.replace(targetNumber.toString(), '');
    hasDecimal = originalText.includes('.');
  } else {
    const text = element.textContent.trim();
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      element.dataset.animating = 'false';
      return;
    }
    targetNumber = parseFloat(match[1]);
    suffix = text.replace(match[1], '');
    hasDecimal = text.includes('.');
  }
  
  const duration = isMobile ? 1500 : 2000;
  const steps = 60;
  const stepDuration = duration / steps;
  
  let currentStep = 0;
  
  const timer = setInterval(() => {
    currentStep++;
    
    // Use easing function for smoother animation
    const progress = currentStep / steps;
    const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const currentNumber = targetNumber * easedProgress;
    
    if (currentStep >= steps || !element.dataset.animating) {
      // Ensure we always show the final number
      if (hasDecimal) {
        element.textContent = targetNumber.toFixed(1) + suffix;
      } else if (targetNumber >= 1000) {
        element.textContent = Math.floor(targetNumber).toLocaleString() + suffix;
      } else {
        element.textContent = Math.floor(targetNumber) + suffix;
      }
      clearInterval(timer);
      element.dataset.animating = 'false';
      element.dataset.timerId = '';
    } else {
      // Display current number
      if (hasDecimal) {
        element.textContent = currentNumber.toFixed(1) + suffix;
      } else if (targetNumber >= 1000) {
        element.textContent = Math.floor(currentNumber).toLocaleString() + suffix;
      } else {
        element.textContent = Math.floor(currentNumber) + suffix;
      }
    }
  }, stepDuration);
  
  element.dataset.timerId = timer.toString();
}

function setupProductInteractions() {
  setupHighlightHovers();
  setupDownloadButtons();
}

function setupHighlightHovers() {
  const highlights = document.querySelectorAll('.highlight-item');
  
  highlights.forEach((highlight) => {
    highlight.addEventListener('mouseenter', () => {
      if (highlight.classList.contains('animate')) {
        highlight.style.transform = 'translateY(-4px)';
        
        const icon = highlight.querySelector('.highlight-icon');
        if (icon) {
          icon.style.background = '#e9ecef';
          icon.style.transform = 'scale(1.1)';
        }
      }
    });
    
    highlight.addEventListener('mouseleave', () => {
      if (highlight.classList.contains('animate')) {
        highlight.style.transform = 'translateY(0)';
        
        const icon = highlight.querySelector('.highlight-icon');
        if (icon) {
          icon.style.background = '#f5f5f7';
          icon.style.transform = 'scale(1)';
        }
      }
    });
  });
}

function setupDownloadButtons() {
  const downloadButtons = document.querySelectorAll('.download-button');
  
  downloadButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      button.style.transform = 'translateY(0) scale(0.98)';
      
      setTimeout(() => {
        button.style.transform = 'translateY(-2px) scale(1)';
      }, 150);
      
      showDownloadFeedback(button);
    });
  });
}

function showDownloadFeedback(button) {
  const platform = button.classList.contains('app-store') ? 'App Store' : 'Google Play';
  
  const feedback = document.createElement('div');
  feedback.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.78-9.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5z"/>
      </svg>
      <span>Reindirizzamento a ${platform}...</span>
    </div>
  `;
  
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  addFeedbackStyles();
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.animation = 'slideOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    setTimeout(() => {
      feedback.remove();
    }, 300);
  }, 3000);
}

function addFeedbackStyles() {
  if (document.querySelector('#feedback-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'feedback-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// =============================================
// LANGUAGE SWITCHER
// =============================================

let isEnglish = false;

const englishTranslations = {
    'About Us': 'About Us',
    'Valori': 'Values',
    'People': 'People',
    'Prodotti': 'Products', 
    'Careers': 'Careers',
    
    'La nostra missione è migliorare l\'esperienza di attimi di vita delle persone, offrendo soluzioni intuitive e di alta qualità, guidati dai dati, dalla passione per l\'innovazione e dall\'impegno nella cura dei particolari': 'Our mission is to improve people\'s life experiences by offering intuitive and high-quality solutions, guided by data, passion for innovation and commitment to attention to detail',
    
    'I Nostri Valori': 'Our Values',
    'Le persone, al centro': 'People, at the center',
    'Mettiamo le persone al centro. Il nostro scopo è quello avere un impatto positivo nella vita delle persone.': 'We put people at the center. Our purpose is to have a positive impact on people\'s lives.',
    'Innoviamo si, Rinnoviamo anche': 'We innovate yes, we also renew',
    'Vogliamo essere capaci di creare il nuovo ma anche di migliorare l\'esistente trasformando i limiti in opportunità.': 'We want to be able to create the new but also to improve the existing by transforming limits into opportunities.',
    'Perfezione come mezzo, non come fine': 'Perfection as a means, not as an end',
    'La cura per i dettagli ci guida oltre gli standard. Cerchiamo l\'equilibrio perfetto tra qualità e funzionalità.': 'Attention to detail guides us beyond standards. We seek the perfect balance between quality and functionality.',
    'La verità è nei dati': 'The truth is in the data',
    'I dati sono la nostra bussola per navigare l\'incertezza e trasformare intuizioni in certezze.': 'Data is our compass to navigate uncertainty and transform insights into certainties.',
    'Inquietudine conoscitiva': 'Cognitive restlessness',
    'Ciò che sappiamo non ci basta. La curiosità il nostro motore per crescere e migliorare.': 'What we know is not enough. Curiosity is our engine to grow and improve.',
    'Divertimento': 'Fun',
    'Nella vita bisogna divertirsi. E noi non vogliamo lavorare neanche un giorno della nostra vita.': 'In life you have to have fun. And we don\'t want to work a single day of our lives.',
    
    'Crescere & Divertirsi, insieme': 'Growing & Having Fun, together',
    'Il nostro primo bootcamp, Luglio 2024': 'Our first bootcamp, July 2024',
    
    'I Nostri Prodotti': 'Our Products',
    'La nostra prima app, trasforma dati in scelte fantacalcistiche.': 'Our first app, transforms data into fantasy football choices.',
    'Algoritmo Proprietario': 'Proprietary Algorithm',
    'Sviluppato internamente per massimizzare le tue probabilità di vittoria.': 'Developed internally to maximize your chances of winning.',
    '150k+ Utenti Attivi': '150k+ Active Users',
    'Più di 150mila utenti a meno di un anno dal rilascio. Una community in continua crescita.': 'More than 150 thousand users in less than a year from release. A growing community.',
    'Qualità': 'Quality',
    'In linea con i nostri valori, stiamo costruendo un prodotto che rispecchi le nostre, alte, aspettative.': 'In line with our values, we are building a product that reflects our high expectations.',
    'Download': 'Downloads',
    'Rating medio': 'Average Rating',
    'Reviews': 'Reviews',
    'Disponibile su': 'Available on',
    'per iOS': 'for iOS',
    'per Android': 'for Android',
    
    'Unisciti al team': 'Join the team',
    
    'Contatti': 'Contacts',
    'Seguici': 'Follow us'
};

function initializeLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    const flagIcon = document.getElementById('flagIcon');
    
    if (!switcher || !flagIcon) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            switcher.classList.add('hidden');
        } else {
            switcher.classList.remove('hidden');
        }
    }, { passive: true });
    
    switcher.addEventListener('click', () => {
        isEnglish = !isEnglish;
        updateLanguage();
        updateFlag();
    });
}

function updateLanguage() {
    if (isEnglish) {
        document.querySelectorAll('*').forEach(element => {
            if (element.tagName === 'SCRIPT' || element.children.length > 0) return;
            
            const text = element.textContent?.trim();
            if (text && englishTranslations[text]) {
                element.textContent = englishTranslations[text];
            }
        });
        
        // Special case for hero heading with glow span
        const heroHeading = document.querySelector('.heading-container h1');
        if (heroHeading) {
            heroHeading.innerHTML = 'Innovate Today, <span class="glow">Shape Tomorrow</span>';
        }

        // Special case for hero description
        const heroDescription = document.querySelector('.about-text .lead');
        if (heroDescription) {
            heroDescription.textContent = 'Our mission is to improve people\'s life experiences by offering intuitive and high-quality solutions, guided by data, passion for innovation and commitment to attention to detail';
        }
        
        const peopleTitle = document.querySelector('#persone .nostra-storia-title');
        if (peopleTitle) {
            peopleTitle.innerHTML = 'Amia, a story of <br>people';
        }
        
        const statements = document.querySelectorAll('.statement-text');
        const englishStatements = [
            'We have a forbidden dream: <span class="highlight">that sooner or later everyone has at least one Amia app on their phone.</span><br> It\'s our most ambitious goal.',
            'There\'s only one way to get there: <span class="highlight">create products that people really love.</span> Products crafted down to the smallest details, even those you can\'t see.',
            'But between saying and doing <span class="highlight">there\'s doing.</span>',
            'So let\'s do it. Let\'s build our future <span class="highlight">together.</span>'
        ];
        
        statements.forEach((statement, index) => {
            if (englishStatements[index]) {
                statement.innerHTML = englishStatements[index];
            }
        });
        
    } else {
        location.reload();
    }
    
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
        switcher.setAttribute('data-tooltip', isEnglish ? 'Passa all\'italiano' : 'Switch to English');
    }
}

function updateFlag() {
    const flagIcon = document.getElementById('flagIcon');
    if (!flagIcon) return;
    
    if (isEnglish) {
        flagIcon.src = 'https://flagcdn.com/w40/gb.png';
        flagIcon.alt = 'British Flag';
    } else {
        flagIcon.src = 'https://flagcdn.com/w40/it.png';
        flagIcon.alt = 'Italian Flag';
    }
}
