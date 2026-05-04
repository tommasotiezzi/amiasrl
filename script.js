document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            if (mobileNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    let isScrolled = false;

    function updateHeader() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50 && !isScrolled) {
            header.classList.add('scrolled');
            isScrolled = true;
        } else if (scrollY <= 50 && isScrolled) {
            header.classList.remove('scrolled');
            isScrolled = false;
        }
    }

    let timeout;
    function handleScroll() {
        if (!timeout) {
            timeout = setTimeout(function() {
                updateHeader();
                timeout = null;
            }, 16); // ~60fps
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    updateHeader();
});

document.addEventListener('DOMContentLoaded', function() {
    
    let currentIndex = 0;
    const items = document.querySelectorAll('.timeline-item');
    const totalItems = items.length;
    const progressBar = document.querySelector('.timeline-progress');
    const indicators = document.querySelector('.timeline-indicators');
    
    console.log('Found', totalItems, 'timeline items');
    
    function createDots() {
        if (!indicators) return;
        
        indicators.innerHTML = '';
        for (let i = 0; i < totalItems; i++) {
            const dot = document.createElement('div');
            dot.className = 'timeline-indicator';
            dot.onclick = () => goTo(i);
            indicators.appendChild(dot);
        }
    }
    
    function updateDisplay() {
        console.log('Showing item', currentIndex + 1, 'of', totalItems);
        
        items.forEach(item => item.classList.remove('active'));
        
        if (items[currentIndex]) {
            items[currentIndex].classList.add('active');
        }
        
        if (progressBar) {
            const progress = (currentIndex / (totalItems - 1)) * 100;
            progressBar.style.width = progress + '%';
        }
        
        document.querySelectorAll('.timeline-indicator').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        const prevBtn = document.querySelector('.timeline-nav.prev');
        const nextBtn = document.querySelector('.timeline-nav.next');
        
        if (prevBtn) {
            prevBtn.disabled = (currentIndex === 0);
        }
        
        if (nextBtn) {
            nextBtn.disabled = (currentIndex === totalItems - 1);
        }
    }
    
    function next() {
        if (currentIndex < totalItems - 1) {
            currentIndex++;
            updateDisplay();
        }
    }
    
    function prev() {
        if (currentIndex > 0) {
            currentIndex--;
            updateDisplay();
        }
    }
    
    function goTo(index) {
        if (index >= 0 && index < totalItems) {
            currentIndex = index;
            updateDisplay();
        }
    }
    
    const nextButton = document.querySelector('.timeline-nav.next');
    const prevButton = document.querySelector('.timeline-nav.prev');
    
    if (nextButton) {
        nextButton.onclick = next;
    }
    
    if (prevButton) {
        prevButton.onclick = prev;
    }
    
    document.addEventListener('keydown', function(e) {
        const timelineContainer = document.querySelector('.timeline-carousel-container');
        if (!timelineContainer) return;
        
        const rect = timelineContainer.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                next();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prev();
            }
        }
    });
    
    let startX = 0;
    let startY = 0;
    const container = document.querySelector('.timeline-carousel-container');
    
    if (container) {
        container.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        container.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    next(); 
                } else {
                    prev(); 
                }
            }
        }, { passive: true });
    }
    
    if (totalItems > 0) {
        createDots();
        updateDisplay();
    }
    
    window.nextSlide = next;
    window.previousSlide = prev;
    window.goToSlide = goTo;
});

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.infinite-carousel');
    const wrapper = document.querySelector('.infinite-carousel-wrapper');
    
    if (!carousel || !wrapper) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;
    
    function pauseAnimation() {
        carousel.classList.add('paused');
    }
    
    function resumeAnimation() {
        carousel.classList.remove('paused');
    }
    
    carousel.addEventListener('mousedown', function(e) {
        isDown = true;
        isDragging = false;
        carousel.style.cursor = 'grabbing';
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        pauseAnimation();
    });
    
    carousel.addEventListener('mouseleave', function() {
        isDown = false;
        carousel.style.cursor = 'grab';
        resumeAnimation();
    });
    
    carousel.addEventListener('mouseup', function() {
        isDown = false;
        carousel.style.cursor = 'grab';
        resumeAnimation();
        
        setTimeout(() => {
            isDragging = false;
        }, 100);
    });
    
    carousel.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 1.5; 
        carousel.scrollLeft = scrollLeft - walk;
    });
    
    let touchStartX = 0;
    let touchStartTime = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        startX = touchStartX;
        scrollLeft = carousel.scrollLeft;
        pauseAnimation();
    }, { passive: true });
    
    carousel.addEventListener('touchmove', function(e) {
        if (!touchStartX) return;
        
        const touchX = e.touches[0].clientX;
        const walk = (touchStartX - touchX) * 1.2; 
        carousel.scrollLeft = scrollLeft + walk;
    }, { passive: true });
    
    carousel.addEventListener('touchend', function(e) {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        if (touchDuration < 300) {
            const touchEndX = e.changedTouches[0].clientX;
            const distance = touchStartX - touchEndX;
            const velocity = distance / touchDuration;
            
            const momentum = velocity * 50;
            carousel.scrollLeft += momentum;
        }
        
        touchStartX = 0;
        resumeAnimation();
    }, { passive: true });
    
    carousel.addEventListener('click', function(e) {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    function handleInfiniteScroll() {
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        const scrollLeft = carousel.scrollLeft;
        
        if (scrollLeft >= scrollWidth - clientWidth - 50) {
            carousel.scrollLeft = 0;
        }
        
        if (scrollLeft <= 0) {
            carousel.scrollLeft = scrollWidth - clientWidth - 50;
        }
    }
    
    carousel.addEventListener('scroll', handleInfiniteScroll, { passive: true });
    
    carousel.addEventListener('mouseenter', pauseAnimation);
    carousel.addEventListener('mouseleave', resumeAnimation);
    
    carousel.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            carousel.scrollLeft -= 320;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            carousel.scrollLeft += 320;
        }
    });
    
    carousel.setAttribute('tabindex', '0');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                resumeAnimation();
            } else {
                pauseAnimation();
            }
        });
    }, {
        threshold: 0.1
    });
    
    observer.observe(carousel);
    
    console.log('Bootcamp carousel initialized');
});

document.addEventListener('DOMContentLoaded', function() {
    const scrollArrow = document.querySelector('.scroll-content svg');
    const scrollContent = document.querySelector('.scroll-content');
    
    if (scrollArrow && scrollContent) {
        function animateArrow() {
            scrollArrow.style.transform = 'translateY(-12px)';
            
            setTimeout(() => {
                scrollArrow.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                    scrollArrow.style.transform = 'translateY(-6px)';
                    
                    setTimeout(() => {
                        scrollArrow.style.transform = 'translateY(0)';
                        
                        setTimeout(() => {
                            scrollArrow.style.transform = 'translateY(-2px)';
                            
                            setTimeout(() => {
                                scrollArrow.style.transform = 'translateY(0)';
                            }, 150);
                        }, 100);
                    }, 200);
                }, 100);
            }, 300);
        }
        
        scrollArrow.style.transition = 'transform 0.25s ease-out';
        
        let animationInterval = setInterval(animateArrow, 3000);
        
        scrollContent.addEventListener('mouseenter', () => {
            clearInterval(animationInterval);
            scrollArrow.style.transform = 'translateY(0)';
        });
        
        scrollContent.addEventListener('mouseleave', () => {
            animationInterval = setInterval(animateArrow, 3000);
        });
        
        scrollContent.addEventListener('click', function() {
            const valuesSection = document.querySelector('.values');
            
            if (valuesSection) {
                const headerHeight = document.querySelector('header').offsetHeight || 80;
                const targetPosition = valuesSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
        
        scrollContent.style.cursor = 'pointer';
    }
});
