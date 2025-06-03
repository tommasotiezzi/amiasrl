// AMIA Website - JavaScript Refactored
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
  
  // Disabilita Bootstrap toggle per gestione manuale
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
  
  // Chiudi menu quando si clicca su un link
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
      
      // Aggiorna link attivo
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      // Smooth scroll alla sezione
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
      
      // Chiudi menu mobile se aperto
      if (navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
      }
    });
  });
  
  // Attiva About di default
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
  // Funzione vuota - niente più pausa al hover
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
// SEZIONE PRODOTTI - SISTEMA MIGLIORATO
// =============================================

// Tracciamento globale delle animazioni attive
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
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        if (element.classList.contains('product-highlights')) {
          animateHighlightsMobile(element);
        } else if (element.classList.contains('product-metrics')) {
          animateMetricsMobile(element);
        }
      } else {
        handleElementExit(entry.target, true);
      }
    });
  }, { 
    threshold: 0.15,
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
        
        if (element.classList.contains('product-intro')) {
          animateProductIntro(element);
        } else if (element.classList.contains('product-highlights')) {
          animateProductHighlights(element);
        } else if (element.classList.contains('product-metrics')) {
          animateProductMetrics(element);
        } else if (element.classList.contains('download-section')) {
          animateDownloadSection(element);
        }
      } else {
        handleElementExit(entry.target, false);
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -50px 0px'
  });
  
  productElements.forEach(element => {
    initializeElementForAnimation(element);
    
    // Prepara i dati originali per le metriche
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
  
  // Marca l'elemento come non animato
  element.setAttribute('data-animation-state', 'inactive');
}

function prepareMetricsData(container) {
  const metrics = container.querySelectorAll('.metric-value');
  metrics.forEach(metric => {
    if (!metric.getAttribute('data-original-text')) {
      const originalText = metric.textContent.trim();
      metric.setAttribute('data-original-text', originalText);
      
      // Estrai il numero target per le animazioni
      const matches = originalText.match(/(\d+(?:\.\d+)?)/);
      if (matches) {
        metric.setAttribute('data-target-number', matches[1]);
      }
    }
  });
}

function handleElementExit(element, isMobile) {
  // Cancella tutte le animazioni attive per questo elemento
  clearElementAnimations(element);
  
  // Reset visivo
  element.style.opacity = '0';
  element.style.transform = isMobile ? 'translateY(15px)' : 'translateY(30px)';
  element.setAttribute('data-animation-state', 'inactive');
  
  // Reset specifici per tipo di elemento
  if (element.classList.contains('product-highlights')) {
    resetHighlights(element);
  } else if (element.classList.contains('product-metrics')) {
    resetMetrics(element);
  }
}

function clearElementAnimations(element) {
  // Trova e cancella tutte le animazioni associate a questo elemento
  const elementId = element.dataset.elementId || generateElementId(element);
  
  if (activeAnimations.has(elementId)) {
    const animations = activeAnimations.get(elementId);
    animations.forEach(animationId => {
      clearTimeout(animationId);
    });
    activeAnimations.delete(elementId);
  }
  
  // Cancella anche le animazioni dei figli
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
    // Cancella timer se attivo
    if (metric.dataset.timerId) {
      clearInterval(parseInt(metric.dataset.timerId));
      metric.dataset.timerId = '';
    }
    metric.dataset.animating = 'false';
    
    // Reset del testo
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

function animateCounterNumber(element, isMobile = false) {
  // Previeni animazioni multiple
  if (element.dataset.animating === 'true') return;
  element.dataset.animating = 'true';
  
  const text = element.textContent.trim();
  
  // Trova il numero nel testo
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    element.dataset.animating = 'false';
    return;
  }
  
  const targetNumber = parseFloat(match[1]);
  const suffix = text.replace(match[1], '');
  const hasDecimal = text.includes('.');
  
  const duration = isMobile ? 1500 : 2000;
  const steps = 60;
  const stepDuration = duration / steps;
  const increment = targetNumber / steps;
  
  let currentNumber = 0;
  let currentStep = 0;
  
  const timer = setInterval(() => {
    currentStep++;
    currentNumber = (targetNumber / steps) * currentStep;
    
    if (currentStep >= steps) {
      // Valore finale esatto
      if (hasDecimal) {
        element.textContent = targetNumber.toFixed(1) + suffix;
      } else if (targetNumber >= 1000) {
        element.textContent = Math.floor(targetNumber).toLocaleString() + suffix;
      } else {
        element.textContent = Math.floor(targetNumber) + suffix;
      }
      clearInterval(timer);
      element.dataset.animating = 'false';
    } else {
      // Valore corrente
      if (hasDecimal) {
        element.textContent = currentNumber.toFixed(1) + suffix;
      } else if (targetNumber >= 1000) {
        element.textContent = Math.floor(currentNumber).toLocaleString() + suffix;
      } else {
        element.textContent = Math.floor(currentNumber) + suffix;
      }
    }
  }, stepDuration);
  
  // Salva il timer per poterlo cancellare
  element.dataset.timerId = timer;
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
