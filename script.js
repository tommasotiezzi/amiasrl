// =============================================
// AMIA WEBSITE - SCRIPT PRINCIPALE
// =============================================
// Versione: 2.1 - Apple Style Integration + Animazioni Fix
// Ultimo aggiornamento: 2025
// =============================================

// =============================================
// 1. INIZIALIZZAZIONE PRINCIPALE
// =============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inizializzazione AMIA Website...');
  
  // Elementi DOM principali
  const header = document.getElementById('header');
  const body = document.body;
  const menuButton = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // Inizializza funzioni base immediate
  initializeHeader(header, body);
  initializeMobileMenu(menuButton, navbarCollapse);
  initializeNavigation(navLinks, header, navbarCollapse);
  
  console.log('✅ Caricamento base completato');
  
  // Carica funzioni avanzate con delay per performance
  setTimeout(() => {
    initializeAdvancedFeatures();
  }, 50);
});

// =============================================
// 2. HEADER E NAVIGAZIONE
// =============================================

/**
 * Gestisce lo sticky header durante lo scroll
 */
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
  
  console.log('📌 Header sticky inizializzato');
}

/**
 * Gestisce il menu mobile hamburger
 */
function initializeMobileMenu(menuButton, navbarCollapse) {
  if (!menuButton || !navbarCollapse) return;
  
  menuButton.addEventListener('click', function(e) {
    e.stopPropagation(); 
    navbarCollapse.classList.toggle('show');
  });
  
  console.log('📱 Menu mobile inizializzato');
}

/**
 * Gestisce la navigazione tra sezioni con smooth scroll
 */
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
        
        // Aggiustamenti specifici per sezione
        if (targetId === '#about') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Offsets personalizzati per ogni sezione
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
  
  console.log('🧭 Navigazione inizializzata');
}

// =============================================
// 3. FUNZIONI AVANZATE
// =============================================

/**
 * Inizializza tutte le funzioni avanzate con timing ottimizzato
 */
function initializeAdvancedFeatures() {
  console.log('⚡ Caricamento funzioni avanzate...');
  
  // CSS per animazioni generali
  addAnimationStyles();
  
  // Inizializza componenti nell'ordine corretto
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
  
  // NUOVO: Prodotti Apple-style - DELAY MAGGIORE per evitare conflitti
  setTimeout(() => {
    initializeAppleStyleProducts();
  }, 400);
  
  console.log('🎨 Funzioni avanzate caricate');
}

/**
 * Aggiunge gli stili CSS per le animazioni
 */
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
// 4. SISTEMA DI ANIMAZIONI
// =============================================

/**
 * Gestisce tutte le animazioni scroll delle sezioni
 */
function initializeAnimations() {
  console.log('🎭 Inizializzazione animazioni...');
  
  // Animazioni Valori
  initializeValoriAnimations();
  
  // Animazioni Careers
  initializeCareersAnimations();
  
  // Animazioni generali (escluso prodotti per evitare conflitti)
  initializeGeneralAnimations();
}

/**
 * Animazioni specifiche per la sezione Valori
 */
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
  
  console.log('📋 Animazioni Valori attive');
}

/**
 * Animazioni specifiche per la sezione Careers
 */
function initializeCareersAnimations() {
  const careersSection = document.querySelector('#lavoraconnoi');
  const statementItems = document.querySelectorAll('#lavoraconnoi .statement-content');
  
  if (statementItems.length === 0) return;
  
  const careersObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target === careersSection) {
        // Anima tutti gli statement in sequenza
        statementItems.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('animate-element', 'animated');
          }, i * 150);
        });
      } else if (!entry.isIntersecting) {
        // Reset quando esce dalla vista
        statementItems.forEach(item => item.classList.remove('animated'));
      }
    });
  }, { threshold: 0.15 });
  
  careersObserver.observe(careersSection);
  
  console.log('💼 Animazioni Careers attive');
}

/**
 * Animazioni per elementi generali del sito
 */
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
  
  console.log('🌟 Animazioni generali attive');
}

// =============================================
// 5. NAVIGAZIONE AVANZATA
// =============================================

/**
 * Evidenzia automaticamente la sezione corrente durante lo scroll
 */
function initializeAdvancedNavigation() {
  let lastClickedTime = 0;
  
  function updateActiveNavOnScroll() {
    // Non aggiornare se l'utente ha appena cliccato
    if (lastClickedTime && Date.now() - lastClickedTime < 1500) return;
    
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;
    
    // Se siamo in cima, attiva About
    if (window.scrollY < 100) {
      document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#about') {
          link.classList.add('active');
        }
      });
      return;
    }
    
    // Trova la sezione corrente
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
  
  // Throttled scroll per performance
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateActiveNavOnScroll);
      ticking = true;
      setTimeout(() => ticking = false, 100);
    }
  }, { passive: true });
  
  // Traccia i click per evitare interferenze
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', function() {
      lastClickedTime = Date.now();
    });
  });
  
  console.log('🎯 Navigazione avanzata attiva');
}

// =============================================
// 6. TIMELINE CAROUSEL
// =============================================

/**
 * Gestisce il carousel della timeline nella sezione People
 */
function initializeTimelineCarousel() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  const prevButton = document.querySelector('.timeline-controls .prev');
  const nextButton = document.querySelector('.timeline-controls .next');
  const currentYearElement = document.querySelector('.current-year');
  
  if (!timelineItems.length || !prevButton || !nextButton || !currentYearElement) {
    console.log('⚠️ Timeline carousel: elementi mancanti');
    return;
  }
  
  let currentIndex = 0;
  
  function updateTimelineDisplay() {
    // Aggiorna visualizzazione
    timelineItems.forEach(item => item.classList.remove('active'));
    timelineItems[currentIndex].classList.add('active');
    
    // Aggiorna anno corrente
    const currentYear = timelineItems[currentIndex].getAttribute('data-year');
    currentYearElement.textContent = currentYear;
    
    // Aggiorna stato bottoni
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === timelineItems.length - 1;
  }
  
  // Event listeners
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
  
  // Inizializza
  updateTimelineDisplay();
  
  console.log('🎠 Timeline carousel inizializzato');
}

// =============================================
// 7. CAROSELLO INFINITO
// =============================================

/**
 * Gestisce il carosello infinito delle foto bootcamp
 */
function initializeOptimizedCarousel() {
  const carousel = document.querySelector('.infinite-carousel');
  
  if (!carousel) {
    console.log('⚠️ Carosello infinito non trovato');
    return;
  }
  
  // Aggiungi stili per ottimizzazione
  addCarouselStyles();
  
  // Pausa quando non visibile per performance
  setupCarouselVisibilityControl(carousel);
  
  // Controlli hover solo su desktop
  setupCarouselHoverControls(carousel);
  
  // Ottimizzazioni mobile
  optimizeCarouselForMobile(carousel);
  
  console.log('🎡 Carosello infinito ottimizzato');
}

/**
 * Aggiunge stili CSS per il carosello
 */
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

/**
 * Controlla la visibilità del carosello per pausarlo quando non serve
 */
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

/**
 * Aggiunge controlli hover per desktop
 */
function setupCarouselHoverControls(carousel) {
  if (window.innerWidth <= 768) return;
  
  carousel.addEventListener('mouseenter', function() {
    const wrapper = this.querySelector('.infinite-carousel-wrapper');
    if (wrapper) {
      wrapper.style.animationPlayState = 'paused';
    }
  });
  
  carousel.addEventListener('mouseleave', function() {
    const wrapper = this.querySelector('.infinite-carousel-wrapper');
    if (wrapper) {
      wrapper.style.animationPlayState = 'running';
    }
  });
}

/**
 * Ottimizzazioni specifiche per mobile
 */
function optimizeCarouselForMobile(carousel) {
  if (window.innerWidth > 768) return;
  
  const images = carousel.querySelectorAll('img');
  images.forEach(img => {
    img.style.imageRendering = 'optimizeSpeed';
  });
}

// =============================================
// 8. PRODOTTI APPLE-STYLE [COMPLETAMENTE RISCRITTO]
// =============================================

/**
 * Inizializza la nuova sezione prodotti in stile Apple
 */
function initializeAppleStyleProducts() {
  console.log('🍎 Inizializzazione prodotti Apple-style...');
  
  // Setup animazioni con controlli specifici
  setupProductAnimationsFixed();
  
  // Setup interazioni
  setupProductInteractions();
  
  console.log('✨ Prodotti Apple-style attivi');
}

/**
 * ANIMAZIONI PRODOTTI - VERSIONE CORRETTA (MOBILE FIXED)
 */
function setupProductAnimationsFixed() {
  console.log('🎬 Setup animazioni prodotti...');
  
  // Rilevamento mobile
  const isMobile = window.innerWidth <= 768;
  console.log('📱 Mobile detected:', isMobile);
  
  // Configurazione observer ottimizzata per mobile
  const observerOptions = {
    threshold: isMobile ? [0.1, 0.3] : [0.3],
    rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
  };
  
  // Osservatore per tutti gli elementi prodotti
  const productObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        console.log('🎯 Elemento prodotto in vista:', element.className);
        
        // ANIMAZIONI SPECIFICHE PER TIPO
        if (element.classList.contains('product-intro')) {
          animateProductIntro(element);
        } else if (element.classList.contains('product-highlights')) {
          animateProductHighlights(element);
        } else if (element.classList.contains('product-metrics')) {
          animateProductMetrics(element);
        } else if (element.classList.contains('download-section')) {
          animateDownloadSection(element);
        }
        
        // Non osservare più dopo l'animazione
        productObserver.unobserve(element);
      }
    });
  }, observerOptions);
  
  // TROVA E OSSERVA TUTTI GLI ELEMENTI PRODOTTI
  const productElements = [
    document.querySelector('.product-intro'),
    document.querySelector('.product-highlights'),
    document.querySelector('.product-metrics'),
    document.querySelector('.download-section')
  ].filter(element => element !== null);
  
  console.log('📊 Elementi prodotti trovati:', productElements.length);
  
  if (productElements.length === 0) {
    console.log('⚠️ Nessun elemento prodotto trovato - verificare HTML');
    return;
  }
  
  productElements.forEach(element => {
    // Setup iniziale per l'animazione - MOBILE FRIENDLY
    if (isMobile) {
      // Su mobile: setup più aggressivo
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'all 0.6s ease-out';
    } else {
      // Su desktop: setup originale
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    
    productObserver.observe(element);
    console.log('👀 Osservando:', element.className);
  });
  
  // FALLBACK per mobile - forza animazioni dopo delay
  if (isMobile) {
    setTimeout(() => {
      console.log('🔄 Fallback mobile - controllo elementi non animati');
      productElements.forEach(element => {
        if (element.style.opacity === '0') {
          console.log('🚨 Forzando animazione per:', element.className);
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    }, 2000);
  }
}

/**
 * Anima l'introduzione del prodotto
 */
function animateProductIntro(element) {
  console.log('📝 Animando product intro...');
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
}

/**
 * Anima gli highlights in sequenza - MOBILE OPTIMIZED
 */
function animateProductHighlights(container) {
  console.log('⭐ Animando highlights...');
  
  const isMobile = window.innerWidth <= 768;
  
  // Anima il container
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';
  
  // Trova e anima gli highlights in sequenza
  const highlights = container.querySelectorAll('.highlight-item');
  console.log('🔍 Highlights trovati:', highlights.length);
  
  if (highlights.length === 0) {
    console.log('⚠️ Nessun highlight trovato nel container');
    return;
  }
  
  highlights.forEach((highlight, index) => {
    // Setup iniziale per ogni highlight
    highlight.style.opacity = '0';
    highlight.style.transform = 'translateY(15px)';
    highlight.style.transition = isMobile ? 'all 0.4s ease-out' : 'all 0.6s ease-out';
    
    const delay = isMobile ? index * 100 : index * 150;
    
    setTimeout(() => {
      highlight.style.opacity = '1';
      highlight.style.transform = 'translateY(0)';
      highlight.classList.add('animate');
      console.log(`✨ Highlight ${index + 1} animato`);
    }, delay);
  });
}

/**
 * Anima le metriche con contatori - MOBILE OPTIMIZED
 */
function animateProductMetrics(container) {
  console.log('📊 Animando metriche...');
  
  const isMobile = window.innerWidth <= 768;
  
  // Anima il container
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';
  
  // Trova e anima i contatori
  const metrics = container.querySelectorAll('.metric-value');
  console.log('🔢 Metriche trovate:', metrics.length);
  
  if (metrics.length === 0) {
    console.log('⚠️ Nessuna metrica trovata nel container');
    return;
  }
  
  metrics.forEach((metric, index) => {
    const delay = isMobile ? index * 150 : index * 200;
    
    setTimeout(() => {
      animateCounterNumber(metric);
    }, delay);
  });
}

/**
 * Anima la sezione download
 */
function animateDownloadSection(element) {
  console.log('⬇️ Animando download section...');
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
}

/**
 * Anima un contatore numerico - MOBILE OPTIMIZED
 */
function animateCounterNumber(element) {
  const text = element.textContent.trim();
  console.log('🔢 Animando contatore:', text);
  
  const hasNumber = /\d/.test(text);
  if (!hasNumber) {
    console.log('⚠️ Nessun numero trovato in:', text);
    return;
  }
  
  const matches = text.match(/(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!matches) {
    console.log('⚠️ Pattern non riconosciuto:', text);
    return;
  }
  
  const targetNumber = parseFloat(matches[1]);
  const suffix = matches[2];
  const isMobile = window.innerWidth <= 768;
  const duration = isMobile ? 1500 : 2000; // Più veloce su mobile
  const startTime = performance.now();
  
  console.log('🎯 Target:', targetNumber, 'Suffix:', suffix, 'Mobile:', isMobile);
  
  // Easing function per animazione naturale
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const currentNumber = targetNumber * easedProgress;
    
    // Formatta il numero
    let displayNumber;
    if (text.includes('.')) {
      displayNumber = currentNumber.toFixed(1);
    } else if (targetNumber >= 1000) {
      displayNumber = Math.floor(currentNumber).toLocaleString();
    } else {
      displayNumber = Math.floor(currentNumber);
    }
    
    element.textContent = displayNumber + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      console.log('✅ Contatore completato:', displayNumber + suffix);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

/**
 * Setup interazioni prodotti
 */
function setupProductInteractions() {
  console.log('🤝 Setup interazioni prodotti...');
  
  // Hover effects sugli highlights - VERSIONE CORRETTA
  setupHighlightHoversFixed();
  
  // Pulsanti download
  setupDownloadButtonsFixed();
}

/**
 * Hover effects per gli highlights - VERSIONE CORRETTA
 */
function setupHighlightHoversFixed() {
  const highlights = document.querySelectorAll('.highlight-item');
  console.log('👆 Setup hover per highlights:', highlights.length);
  
  highlights.forEach((highlight, index) => {
    highlight.addEventListener('mouseenter', () => {
      // Solo se l'elemento è già stato animato
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

/**
 * Pulsanti download - VERSIONE CORRETTA
 */
function setupDownloadButtonsFixed() {
  const downloadButtons = document.querySelectorAll('.download-button');
  console.log('📱 Setup download buttons:', downloadButtons.length);
  
  downloadButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      console.log('🔘 Click su download button');
      
      // Animazione click
      button.style.transform = 'translateY(0) scale(0.98)';
      
      setTimeout(() => {
        button.style.transform = 'translateY(-2px) scale(1)';
      }, 150);
      
      // Feedback visivo
      showDownloadFeedbackFixed(button);
      
      // Log per analytics
      const platform = button.classList.contains('app-store') ? 'App Store' : 'Google Play';
      console.log(`📱 Download avviato: ${platform}`);
    });
  });
}

/**
 * Feedback download - VERSIONE CORRETTA
 */
function showDownloadFeedbackFixed(button) {
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
    animation: slideInApple 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Aggiungi animazioni se non esistono
  addAppleFeedbackStylesFixed();
  
  document.body.appendChild(feedback);
  console.log('💬 Feedback mostrato:', platform);
  
  // Rimuovi dopo 3 secondi
  setTimeout(() => {
    feedback.style.animation = 'slideOutApple 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    setTimeout(() => {
      feedback.remove();
      console.log('💬 Feedback rimosso');
    }, 300);
  }, 3000);
}

/**
 * Stili feedback Apple - VERSIONE CORRETTA
 */
function addAppleFeedbackStylesFixed() {
  if (document.querySelector('#apple-feedback-styles-fixed')) return;
  
  const style = document.createElement('style');
  style.id = 'apple-feedback-styles-fixed';
  style.textContent = `
    @keyframes slideInApple {
      from {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes slideOutApple {
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
// 9. UTILITY E HELPER
// =============================================

/**
 * Utility per debug - mostra info sulle sezioni
 */
function debugSections() {
  const sections = document.querySelectorAll('section[id]');
  console.log('📋 Sezioni trovate:', sections.length);
  sections.forEach(section => {
    console.log(`- ${section.id}: ${section.offsetTop}px`);
  });
}

/**
 * Performance monitor - mostra FPS
 */
function monitorPerformance() {
  let fps = 0;
  let lastTime = performance.now();
  
  function countFPS() {
    const currentTime = performance.now();
    fps++;
    
    if (currentTime >= lastTime + 1000) {
      console.log(`🚀 FPS: ${fps}`);
      fps = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(countFPS);
  }
  
  // Avvia solo in development
  if (window.location.hostname === 'localhost') {
    countFPS();
  }
}

// =============================================
// 10. INIZIALIZZAZIONE FINALE
// =============================================

// Avvia monitor performance se in development
if (window.location.hostname === 'localhost') {
  setTimeout(monitorPerformance, 2000);
}

// Export per testing (se necessario)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeHeader,
    initializeMobileMenu,
    initializeNavigation,
    initializeAppleStyleProducts
  };
}

console.log('🎉 AMIA Website completamente inizializzato!');
