document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('header');
    
    const sections = document.querySelectorAll('section[id]');
    
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    function handleNavigation() {
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
        
        const scrollPosition = window.scrollY + (window.innerHeight / 3); 
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - header.offsetHeight;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section.id;
            }
        });
        
        navLinks.forEach(link => {
            let href = link.getAttribute('href');
            let sectionId = '';
            
            if (href.includes('#')) {
                sectionId = href.split('#').pop();
            }
            
            console.log("Link:", href, "->", sectionId, "Current section:", currentSection);
            
            link.classList.remove('active');
            link.style.backgroundColor = '';
            link.style.color = '#141414';
            
            if (sectionId && sectionId === currentSection) {
                link.classList.add('active');
                link.style.backgroundColor = '#141414';
                link.style.color = '#fafafa';
                console.log("ACTIVATED:", sectionId);
            }
        });
    }
    
    window.addEventListener('scroll', handleNavigation);
    
    handleNavigation();
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (!href.includes('#')) return;
            
            e.preventDefault();
            
            const targetId = href.includes('#') ? '#' + href.split('#').pop() : href;
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
    
    const navbarCollapse = document.querySelector('.navbar-collapse');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                navbarCollapse.classList.remove('show');
            }
        });
    });
        const sideBanner = document.getElementById('sideBanner');
    const bannerTab = document.getElementById('bannerTab');
    const closeBtn = document.getElementById('closeBtn');


    if (bannerTab && sideBanner) {
        bannerTab.addEventListener('click', () => {
            sideBanner.classList.add('open');
        });
    } else {
    }

    if (closeBtn && sideBanner) {
        closeBtn.addEventListener('click', () => {
            sideBanner.classList.remove('open');
        });
    } else {
    };

    if (bannerLink && sideBanner) {
    bannerLink.addEventListener('click', () => {
        sideBanner.classList.remove('open');
        setTimeout(() => {
        const section = document.getElementById('lavora-con-noi');
        if (section) {
            const offsetPosition = section.offsetTop - header.offsetHeight;
            window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
            });
        }
        }, 300);e
    });
    }
});
