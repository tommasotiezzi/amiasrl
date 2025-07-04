// AMIA Website - JavaScript Complete & Fixed
// =============================================

document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('header');
  const body = document.body;
  const menuButton = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('#navbarNav');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  initializeHeader(header, body);
  initializeMobileMenu(menuButton, navbarCollapse);
  initializeNavigation(navLinks, header, navbarCollapse);
  
  setTimeout(() => {
    initializeAdvancedFeatures();
  }, 50);
  
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
        if (entry.intersectionRatio === 0) {
          handleElementExit(entry.target, true);
        }
      }
    });
  }, { 
    threshold: [0, 0.15],
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
        if (entry.intersectionRatio === 0) {
          handleElementExit(entry.target, false);
        }
      }
    });
  }, {
    threshold: [0, 0.3],  
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
  if (element.dataset.timerId) {
    clearInterval(parseInt(element.dataset.timerId));
    element.dataset.timerId = '';
  }
  
  if (element.dataset.animating === 'true') {
    element.dataset.animating = 'false';
  }
  
  element.dataset.animating = 'true';
  
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
    
    const progress = currentStep / steps;
    const easedProgress = 1 - Math.pow(1 - progress, 3); 
    const currentNumber = targetNumber * easedProgress;
    
    if (currentStep >= steps || !element.dataset.animating) {
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
    
    if (isEnglish) {
      translateToEnglish();
    } else {
      translateToItalian();
    }
    
    updateFlag();
    updateTooltip();
  });
}

function translateToEnglish() {
  document.querySelector('a[href="#about"]').textContent = 'About Us';
  document.querySelector('a[href="#valori"]').textContent = 'Values';
  document.querySelector('a[href="#persone"]').textContent = 'People';
  document.querySelector('a[href="#prodotti"]').textContent = 'Products';
  document.querySelector('a[href="#lavoraconnoi"]').textContent = 'Work with us';
  
  document.querySelector('.heading-container h1').innerHTML = 'Innovate Today,<span class="glow">Shape Tomorrow</span>';
  document.querySelector('.about-text .lead').textContent = 'Our mission is to improve people\'s life experiences by offering intuitive and high-quality solutions, guided by data, passion for innovation and commitment to attention to detail';
  
  document.querySelector('#valori .title-section').textContent = 'Our Values';
  
  const valoriTitles = document.querySelectorAll('#valori .valori-content h3');
  const valoriDescriptions = document.querySelectorAll('#valori .valori-content p');
  
  valoriTitles[0].textContent = 'People, at the center';
  valoriDescriptions[0].textContent = 'They must be happy when using our product. Our goal is to have a concrete and positive impact, regardless of the form.';
  
  valoriTitles[1].textContent = 'We innovate yes, we also renew';
  valoriDescriptions[1].textContent = 'We want to know how to create the new, but also recognize what can be improved by transforming limitations into opportunities.';
  
  valoriTitles[2].textContent = 'Perfection as a means, not as an end';
  valoriDescriptions[2].textContent = 'Attention to detail guides us beyond standards. We seek the perfect balance between quality and functionality.';
  
  valoriTitles[3].textContent = 'The truth is in the data';
  valoriDescriptions[3].textContent = 'They are the compass to navigate uncertainty. We collect them, enhance them and transform them into tools for internal decisions or to create opportunities externally.';
  
  valoriTitles[4].textContent = 'Cognitive restlessness';
  valoriDescriptions[4].textContent = 'What we know is not enough for us. Curiosity and the constant desire to improve are our engine for growth.';
  
  valoriTitles[5].textContent = 'Fun';
  valoriDescriptions[5].textContent = 'We work hard, but we have fun. Because we do it in what we are passionate about and what gives us the most satisfaction.';
  
  document.querySelector('#persone .nostra-storia-title').innerHTML = 'Amia, a story of <br>people';
  document.querySelector('.bootcamp-section .nostra-storia-title').textContent = 'Growing & Having Fun, together';
  document.querySelector('.bootcamp-subtitle').textContent = 'Our first bootcamp, July 2024';
  
  const timelineDescriptions = document.querySelectorAll('.timeline-description');
  const englishDescriptions = [
    'Everything begins in 2020 with the birth of Fantatia, the page created by Mattia to talk about fantasy football. Amia? Algo? They are still distant dreams.',
    'During a live on Twitch, Abba proposes to help Mattia with communication. He is the first to get on the boat and today he is still with us as Customer Success Manager.',
    'Mattia realizes that fantasy coaches lack a strategic support tool. With Tancredi he creates the first version of Algo on Excel! Users are interested and start subscribing.',
    'After the first season we meet Paolo, who joins the team with new ideas to improve the algorithm. The Excel file is no longer enough. fantatia.com is born.',
    'Algo grows, we need a more solid team. Andrea (Backend), Leonardo (Frontend) and Tommaso (Business Analyst) arrive. Amia begins to take shape.',
    'Amia is officially born. But in August 2023 the release of Algo fails, we are not ready. We go back to fantatia.com and reorganize.',
    'We don\'t stop, we are motivated. The team expands: Michele (Product Designer), Luca (App Developer) and Giampaolo (Cloud & DevOps). We start again, all in. We invest everything.',
    'At the same time, the communication team is also born to support Tia and Algo\'s social pages. Matteo (Social Media Manager) and Nicola (Graphic Designer) join.',
    'After months of work and a summer spent writing code Algo Fantacalcio is live on the stores! Amia\'s first official product.',
    'The team changes face. Luca and Leonardo leave, but Chris (App Developer) and Mika (Backend) join, working alongside Andrea.',
    'The first year of Algo taught us a lot. Many difficulties, but also many satisfactions: over 150,000 downloads and many happy fantasy coaches. Now Amia is ready to grow. And no, we won\'t only do fantasy football.'
  ];
  
  timelineDescriptions.forEach((desc, index) => {
    if (englishDescriptions[index]) {
      desc.textContent = englishDescriptions[index];
    }
  });
  
  document.querySelector('#prodotti .nostra-storia-title').textContent = 'Our Products';
  document.querySelector('.product-tagline').textContent = 'Our first app, transforms data into fantasy football choices.';
  
  document.querySelector('.highlight-content h3').textContent = 'Proprietary Algorithm';
  document.querySelector('.highlight-content p').textContent = 'Developed internally to maximize your chances of winning.';
  
  const highlightItems = document.querySelectorAll('.highlight-item');
  highlightItems[1].querySelector('h3').textContent = '150k+ Active Users';
  highlightItems[1].querySelector('p').textContent = 'More than 150 thousand users in less than a year from release. A growing community.';
  
  highlightItems[2].querySelector('h3').textContent = 'Quality';
  highlightItems[2].querySelector('p').textContent = 'In line with our values, we are building a product that reflects our high expectations.';
  
  const metricLabels = document.querySelectorAll('.metric-label');
  metricLabels[0].textContent = 'Downloads';
  metricLabels[1].innerHTML = 'Average Rating<br>';
  metricLabels[2].textContent = 'Reviews';
  
  document.querySelector('.download-text').textContent = 'Available on';
  document.querySelectorAll('.button-secondary')[0].textContent = 'for iOS';
  document.querySelectorAll('.button-secondary')[1].textContent = 'for Android';
  
  const statements = document.querySelectorAll('.statement-text');
  statements[0].innerHTML = 'We have a forbidden dream: <span class="highlight">that sooner or later everyone has at least one Amia app on their phone.</span><br> It\'s our most ambitious goal.';
  statements[1].innerHTML = 'There\'s only one way to get there: <span class="highlight">create products that people really love.</span> Products crafted down to the smallest details, even those you can\'t see.';
  statements[2].innerHTML = 'But between saying and doing <span class="highlight">there\'s doing.</span>';
  statements[3].innerHTML = 'So let\'s do it. Let\'s build our future <span class="highlight">together.</span>';
  
  document.querySelector('.cta-text').textContent = 'Join the team';
  
  document.querySelector('footer h5').textContent = 'Contacts';
  document.querySelectorAll('footer h5')[1].textContent = 'Follow us';
  
  updateCurrentYear();
}

function translateToItalian() {
  document.querySelector('a[href="#about"]').textContent = 'Chi siamo';
  document.querySelector('a[href="#valori"]').textContent = 'Valori';
  document.querySelector('a[href="#persone"]').textContent = 'Persone';
  document.querySelector('a[href="#prodotti"]').textContent = 'Prodotti';
  document.querySelector('a[href="#lavoraconnoi"]').textContent = 'Lavora con noi';
  
  document.querySelector('.heading-container h1').innerHTML = 'Innova oggi,<span class="glow">transforma domani</span>';
  document.querySelector('.about-text .lead').textContent = 'La nostra missione è migliorare l\'esperienza di attimi di vita delle persone, offrendo soluzioni intuitive e di alta qualità, guidati dai dati, dalla passione per l\'innovazione e dall\'impegno nella cura dei particolari';
  
  document.querySelector('#valori .title-section').textContent = 'I Nostri Valori';
  
  const valoriTitles = document.querySelectorAll('#valori .valori-content h3');
  const valoriDescriptions = document.querySelectorAll('#valori .valori-content p');
  
  valoriTitles[0].textContent = 'Le persone, al centro';
  valoriDescriptions[0].textContent = 'Devono essere felici quando usano un nostro prodotto. Il nostro obiettivo è avere, a prescindere dalla forma, un impatto concreto e positivo.';
  
  valoriTitles[1].textContent = 'Innoviamo si, Rinnoviamo anche';
  valoriDescriptions[1].textContent = 'Vogliamo saper creare il nuovo, ma anche riconoscere ciò che può essere migliorato trasformando i limiti in opportunità.';
  
  valoriTitles[2].textContent = 'Perfezione come mezzo, non come fine';
  valoriDescriptions[2].textContent = 'La cura nei dettagli ci guida oltre gli standard. Cerchiamo l\'equilibrio perfetto tra qualità, velocità e funzionalità.';
  
  valoriTitles[3].textContent = 'La verità è nei dati';
  valoriDescriptions[3].textContent = 'Sono la bussola per navigare l\'incertezza. Li raccogliamo, li valorizziamo e li trasformiamo in strumenti per decisioni interne o per creare opportunità all\'esterno.';
  
  valoriTitles[4].textContent = 'Inquietudine conoscitiva';
  valoriDescriptions[4].textContent = 'Ciò che sappiamo non ci basta. La curiosità e la costante voglia di migliorare sono il nostro motore per crescere.';
  
  valoriTitles[5].textContent = 'Divertimento';
  valoriDescriptions[5].textContent = 'Lavoriamo tanto, ma ci divertiamo. Perché lo facciamo in ciò che ci appassiona e ci dà più soddisfazione.';
  
  document.querySelector('#persone .nostra-storia-title').innerHTML = 'Amia, una storia di <br>persone';
  document.querySelector('.bootcamp-section .nostra-storia-title').textContent = 'Crescere & Divertirsi, insieme';
  document.querySelector('.bootcamp-subtitle').textContent = 'Il nostro primo bootcamp, Luglio 2024';
  
  const timelineDescriptions = document.querySelectorAll('.timeline-description');
  const italianDescriptions = [
    'Tutto comincia nel 2020 con la nascita di Fantatia, la pagina creata da Mattia per parlare di fantacalcio. Amia? Algo? Sono ancora sogni lontani.',
    'Durante una live su Twitch, Abba si propone per aiutare Mattia con la comunicazione. È il primo a salire sulla barca e oggi è ancora con noi come Customer Success Manager.',
    'Mattia intuisce che ai fantallenatori manca uno strumento di supporto strategico. Con Tancredi crea la prima versione di Algo su Excel! Agli utenti interessa e iniziano ad abbonarsi.',
    'Dopo la prima stagione conosciamo Paolo, che si unisce al team con nuove idee per migliorare l\'algoritmo. Il file Excel non basta più. Nasce fantatia.com.',
    'Algo cresce, serve un team più solido. Arrivano Andrea (Backend), Leonardo (Frontend) e Tommaso (Business Analyst). Amia comincia a prendere forma.',
    'Nasce ufficialmente Amia. Ma nell\'agosto 2023 l\'uscita di Algo fallisce, non siamo pronti. Torniamo su fantatia.com e ci riorganizziamo.',
    'Non ci fermiamo, siamo motivati. Il team si amplia: Michele (Product Designer), Luca (App Developer) e Giampaolo (Cloud & DevOps). Si riparte, all in. Investiamo tutto.',
    'Contemporaneamente nasce anche il team comunicazione a supporto di Tia e delle pagine social di Algo. Entrano Matteo (Social Media Manager) e Nicola (Graphic Designer).',
    'Dopo mesi di lavoro e un estate passata a scrivere codice Algo Fantacalcio è live sugli store! Il primo prodotto ufficiale di Amia.',
    'Il team cambia volto. Luca e Leonardo lasciano, ma entrano Chris (App Developer) e Mika (Backend), che si affianca ad Andrea.',
    'Il primo anno di Algo ci ha insegnato tanto. Tante difficoltà, ma anche tante soddisfazioni: oltre 150.000 download e moltissimi fantallenatori felici. Ora Amia è pronta a crescere. E no, non faremo solo fantacalcio.'
  ];
  
  timelineDescriptions.forEach((desc, index) => {
    if (italianDescriptions[index]) {
      desc.textContent = italianDescriptions[index];
    }
  });
  
  document.querySelector('#prodotti .nostra-storia-title').textContent = 'I Nostri Prodotti';
  document.querySelector('.product-tagline').textContent = 'La nostra prima app, trasforma dati in scelte fantacalcistiche.';
  
  document.querySelector('.highlight-content h3').textContent = 'Algoritmo Proprietario';
  document.querySelector('.highlight-content p').textContent = 'Sviluppato internamente per massimizzare le tue probabilità di vittoria.';
  
  const highlightItems = document.querySelectorAll('.highlight-item');
  highlightItems[1].querySelector('h3').textContent = '150k+ Utenti Attivi';
  highlightItems[1].querySelector('p').textContent = 'Più di 150mila utenti a meno di un anno dal rilascio. Una community in continua crescita.';
  
  highlightItems[2].querySelector('h3').textContent = 'Qualità';
  highlightItems[2].querySelector('p').textContent = 'In linea con i nostri valori, stiamo costruendo un prodotto che rispecchi le nostre, alte, aspettative.';
  
  const metricLabels = document.querySelectorAll('.metric-label');
  metricLabels[0].textContent = 'Download';
  metricLabels[1].innerHTML = 'Rating medio<br>';
  metricLabels[2].textContent = 'Reviews';
  
  document.querySelector('.download-text').textContent = 'Disponibile su';
  document.querySelectorAll('.button-secondary')[0].textContent = 'per iOS';
  document.querySelectorAll('.button-secondary')[1].textContent = 'per Android';
  
  const statements = document.querySelectorAll('.statement-text');
  statements[0].innerHTML = 'Abbiamo un sogno proibito: <span class="highlight">che prima o poi tutti abbiano almeno un\'app di Amia sul telefono.</span><br> È il nostro obiettivo più ambizioso.';
  statements[1].innerHTML = 'La strada per arrivarci è una sola: <span class="highlight">creare prodotti che le persone amino davvero.</span> Prodotti curati fin nei minimi dettagli, anche quelli che non si vedono.';
  statements[2].innerHTML = 'Ma tra il dire e il fare <span class="highlight">c\'è di mezzo il fare.</span>';
  statements[3].innerHTML = 'E allora facciamolo. Costruiamo il nostro futuro <span class="highlight">insieme.</span>';
  
  document.querySelector('.cta-text').textContent = 'Unisciti al team';
  
  // Footer
  document.querySelector('footer h5').textContent = 'Contatti';
  document.querySelectorAll('footer h5')[1].textContent = 'Seguici';
  
  updateCurrentYear();
}

function updateCurrentYear() {
  const currentYearElement = document.querySelector('.current-year');
  const activeTimelineItem = document.querySelector('.timeline-item.active');
  
  if (currentYearElement && activeTimelineItem) {
    const year = activeTimelineItem.getAttribute('data-year');
    
    const yearTranslations = {
      'Maggio 2020': 'May 2020',
      'Dicembre 2020': 'December 2020',
      'Marzo 2021': 'March 2021',
      'Agosto 2022': 'August 2022',
      'Marzo 2023': 'March 2023',
      'Agosto 2023': 'August 2023',
      'Marzo 2024': 'March 2024',
      'Giugno 2024': 'June 2024',
      'Agosto 2024': 'August 2024',
      'Ottobre 2024': 'October 2024',
      'Agosto 2025': 'August 2025'
    };
    
    if (isEnglish && yearTranslations[year]) {
      currentYearElement.textContent = yearTranslations[year];
    } else {
      currentYearElement.textContent = year;
    }
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

function updateTooltip() {
  const switcher = document.getElementById('languageSwitcher');
  if (switcher) {
    switcher.setAttribute('data-tooltip', isEnglish ? 'Passa all\'italiano' : 'Switch to English');
  }
}

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
    
    updateCurrentYear();
    
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