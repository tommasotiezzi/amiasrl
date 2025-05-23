// Script principale ultra-ottimizzato per il sito Amia

document.addEventListener('DOMContentLoaded', function() {
  // 1. ELEMENTI DOM
  const header = document.getElementById('header');
  const body = document.body;
  const menuButton = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // 2. SOLO FUNZIONI ESSENZIALI AL CARICAMENTO
  
  // Sticky header semplificato
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('sticky-top');
      body.classList.add('has-sticky-nav');
    } else {
      header.classList.remove('sticky-top');
      body.classList.remove('has-sticky-nav');
    }
  }, { passive: true });
  
  // Menu mobile essenziale - FIXED VERSION
  if (menuButton && navbarCollapse) {
    // Remove the manual toggle listener since Bootstrap handles it
    // Just add click outside to close
    document.addEventListener('click', function(e) {
      if (!navbarCollapse.contains(e.target) && !menuButton.contains(e.target)) {
        if (navbarCollapse.classList.contains('show')) {
          // Use Bootstrap's collapse instance to properly close
          const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});
          bsCollapse.hide();
        }
      }
    });
  }
  
  // Navigazione base
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
          if (targetId === '#valori') headerHeight -= 30;
          else if (targetId === '#persone') headerHeight -= 30;
          else if (targetId === '#prodotti') headerHeight -= -20;
          else if (targetId === '#lavoraconnoi') headerHeight -= 30;
          
          window.scrollTo({
            top: targetSection.offsetTop - headerHeight,
            behavior: 'smooth'
          });
        }
      }
      
      // Close mobile menu after navigation - FIXED VERSION
      if (navbarCollapse.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});
        bsCollapse.hide();
      }
    });
  });
  
  // Attiva About di default
  const firstLink = document.querySelector('.navbar-nav .nav-link[href="#about"]');
  if (firstLink) {
    firstLink.classList.add('active');
  }
  
  console.log('Base loading complete!');
  
  // 3. INIZIALIZZAZIONE RITARDATA DI TUTTO IL RESTO
  setTimeout(function() {
    initializeAdvancedFeatures();
  }, 50); // Ridotto da 100ms a 50ms
});

// FUNZIONI AVANZATE - CARICATE DOPO
function initializeAdvancedFeatures() {
  console.log('Loading advanced features...');
  
  // CSS per animazioni
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
  
  // Timeline carousel
  initializeTimelineCarousel();
  
  // Carosello infinito ottimizzato - caricato dopo per ridurre lag
  setTimeout(function() {
    initializeOptimizedCarousel();
  }, 300);
  
  // Animazioni con delay maggiore per non bloccare
  setTimeout(function() {
    initializeAnimations();
  }, 100); // Ridotto da 200ms a 100ms
  
  // Navigazione avanzata con delay
  setTimeout(function() {
    initializeAdvancedNavigation();
  }, 150); // Ridotto da 300ms a 150ms
}

// ANIMAZIONI SEMPLIFICATE
function initializeAnimations() {
  // Valori - observer singolo più leggero
  const valoriItems = document.querySelectorAll('#valori .valori-item');
  
  if (valoriItems.length > 0) {
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
  
  // CAREERS - logica speciale di gruppo come prima
  const careersSection = document.querySelector('#lavoraconnoi');
  const statementItems = document.querySelectorAll('#lavoraconnoi .statement-content');
  
  if (statementItems.length > 0) {
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
          // Reset quando esce
          statementItems.forEach(item => item.classList.remove('animated'));
        }
      });
    }, { threshold: 0.15 });
    
    careersObserver.observe(careersSection);
  }
  
  // Altri elementi - observer unico per tutti (SENZA careers)
  const otherElements = document.querySelectorAll(`
    #about .container2 .item,
    #persone .nostra-storia-title,
    #persone .timeline-photo,
    #persone .timeline-description,
    #persone .timeline-controls,
    #persone .current-year,
    #persone .bootcamp-subtitle,
    #persone .infinite-carousel,
    #prodotti .nostra-storia-title,
    #prodotti .product-image,
    #prodotti .product-info
  `);
  
  if (otherElements.length > 0) {
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
  
  console.log('Animations initialized');
}

// NAVIGAZIONE AVANZATA
function initializeAdvancedNavigation() {
  let lastClickedTime = 0;
  
  // Evidenzia sezione corrente durante scroll
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
  
  // Throttled scroll per nav
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateActiveNavOnScroll);
      ticking = true;
      setTimeout(() => ticking = false, 100);
    }
  }, { passive: true });
  
  // Aggiorna il tracking dei click
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', function() {
      lastClickedTime = Date.now();
    });
  });
  
  console.log('Advanced navigation initialized');
}

// TIMELINE CAROUSEL SEMPLIFICATO
function initializeTimelineCarousel() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  const prevButton = document.querySelector('.timeline-controls .prev');
  const nextButton = document.querySelector('.timeline-controls .next');
  const currentYearElement = document.querySelector('.current-year');
  
  if (!timelineItems.length || !prevButton || !nextButton || !currentYearElement) {
    return;
  }
  
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

// CAROSELLO INFINITO OTTIMIZZATO
function initializeOptimizedCarousel() {
  const carousel = document.querySelector('.infinite-carousel');
  
  if (!carousel) return;
  
  // Ottimizzazioni performance
  const style = document.createElement('style');
  style.textContent = `
    .infinite-carousel {
      will-change: transform;
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .infinite-carousel-wrapper {
      will-change: transform;
      transform: translateZ(0); /* Force hardware acceleration */
      animation-duration: 40s !important; /* Slower for all devices */

    }
    
    .infinite-carousel-item {
      will-change: transform;
      backface-visibility: hidden;
    }
    
    .infinite-carousel-item img {
      will-change: auto; /* Remove will-change from images */
      transform: translateZ(0);
    }
    
    /* Pausa animazione quando non è visibile */
    .infinite-carousel:not(.in-viewport) .infinite-carousel-wrapper {
      animation-play-state: paused !important;
    }
    
    /* Ridotta velocità per meno lag */
    @media (max-width: 768px) {
      .infinite-carousel-wrapper {
        animation-duration: 40s !important; /* Più lento su mobile */
      }
    }
  `;
  document.head.appendChild(style);
  
  // Intersection Observer per pausare quando non visibile
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
  
  // Pausa al hover (solo desktop)
  if (window.innerWidth > 768) {
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
  
  // Riduci qualità immagini su mobile
  if (window.innerWidth <= 768) {
    const images = carousel.querySelectorAll('img');
    images.forEach(img => {
      img.style.imageRendering = 'optimizeSpeed';
    });
  }
  
  console.log('Optimized carousel initialized');
}
