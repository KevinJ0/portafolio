// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================

// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', function() {
  
  // Configuration for the observer
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  // Create the observer
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add visible class when element enters viewport
        entry.target.classList.add('animate-visible');
        
        // Stop observing after animation (animate only once)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  const animatedElements = document.querySelectorAll(
    '.animate-fade-in, .animate-slide-up, .animate-slide-left, .animate-slide-right, .animate-zoom-in, .animate-stagger'
  );

  animatedElements.forEach(element => {
    observer.observe(element);
  });

  // Handle stagger animations (children animate one by one)
  const staggerObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const children = Array.from(container.children);
        
        // Apply stagger delay to each child
        children.forEach((child, index) => {
          child.style.transitionDelay = `${index * 0.15}s`;
        });
        
        // Trigger animation
        container.classList.add('animate-visible');
        
        // Stop observing
        staggerObserver.unobserve(container);
      }
    });
  }, observerOptions);

  const staggerContainers = document.querySelectorAll('.animate-stagger');
  staggerContainers.forEach(container => {
    staggerObserver.observe(container);
  });

  // Add smooth scroll behavior for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Add entrance animation to hero section
  const heroElements = document.querySelectorAll('#home h1, #home h2, #home .icons');
  heroElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('animate-visible');
    }, 200 * (index + 1));
  });

});
