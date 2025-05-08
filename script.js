// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the header element
    const header = document.getElementById('header');
    
    // Get all sections that should trigger navigation changes
    const sections = document.querySelectorAll('section[id]');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    // Make the navigation sticky and highlight the active section
    function handleNavigation() {
        // Make header sticky after scrolling a bit
        if (window.scrollY > 50) {
            header.classList.add('sticky-top');
            header.style.backgroundColor = '#fafafa';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            header.style.transition = 'background-color 0.3s ease, box-shadow 0.3s ease';
        } else {
            header.classList.remove('sticky-top');
            header.style.backgroundColor = 'transparent';
            header.style.boxShadow = 'none';
        }
        
        // Calculate current scroll position with some offset
        const scrollPosition = window.scrollY + 100; // Adding offset for better detection
        
        // Determine which section is currently in view
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - header.offsetHeight;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Update navigation links
        navLinks.forEach(link => {
            // Get the section ID from the href attribute
            const sectionId = link.getAttribute('href').substring(1);
            
            // Remove active class from all links
            link.classList.remove('active');
            link.style.backgroundColor = '';
            link.style.color = '#141414';
            
            // Add active class to current section link
            if (sectionId === currentSection) {
                link.classList.add('active');
                link.style.backgroundColor = '#141414';
                link.style.color = '#fafafa';
            }
        });
    }
    
    // Listen for scroll events
    window.addEventListener('scroll', handleNavigation);
    
    // Initial call to set up navigation state on page load
    handleNavigation();
    
    // Add smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetPosition = targetSection.offsetTop - header.offsetHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Close mobile navigation when clicking a link
    const navbarCollapse = document.querySelector('.navbar-collapse');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                navbarCollapse.classList.remove('show');
            }
        });
    });
    const items = document.querySelectorAll('.timeline-item');
    const dot = document.querySelector('.timeline-dot');
    const year = document.querySelector('.current-year');
    const prev = document.querySelector('.prev');
    const next = document.querySelector('.next');
    let current = 0;
    
    function showItem(index) {
        items.forEach(item => item.classList.remove('active'));
        items[index].classList.add('active');
        
        const position = (index / (items.length - 1)) * 100;
        dot.style.left = position + '%';
        
        year.textContent = items[index].dataset.year;
    }
    
    next.addEventListener('click', () => {
        if (current < items.length - 1) {
            current++;
            showItem(current);
        }
    });
    
    prev.addEventListener('click', () => {
        if (current > 0) {
            current--;
            showItem(current);
        }
    });
    
    showItem(current);
});
