// ============================================
// PROJECT SLIDER & NESTED CAROUSEL FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // --------------------------------------------
  // MAIN PROJECT SLIDER LOGIC
  // --------------------------------------------
  const slider = document.querySelector('.slider-container');
  const slides = document.querySelectorAll('.slider-slide');
  const prevBtn = document.querySelector('.slider-nav.prev');
  const nextBtn = document.querySelector('.slider-nav.next');
  const pagination = document.querySelector('.slider-pagination');
  
  if (!slider || slides.length === 0) return;

  let currentSlide = 0;
  const totalSlides = slides.length;

  // Create pagination dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    pagination.appendChild(dot);
  });

  const dots = document.querySelectorAll('.slider-pagination .dot');

  // Update slider position
  function updateSlider() {
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }

  // Go to specific slide
  function goToSlide(index) {
    currentSlide = index;
    updateSlider();
  }

  // Next slide
  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  }

  // Previous slide
  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  }

  // Event listeners for navigation
  if (nextBtn) nextBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent bubbling layout issues
    nextSlide();
  });
  if (prevBtn) prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    prevSlide();
  });

  // Keyboard navigation for MAIN slider
  document.addEventListener('keydown', (e) => {
    // Only navigate if not interacting with a specific input or similar
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        // Don't navigate while the fullscreen image viewer is open (it owns the keys)
        const cvOverlay = document.getElementById('cv-overlay');
        if (cvOverlay && cvOverlay.classList.contains('open')) return;
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    }
  });

  // Touch/Swipe support for MAIN slider
  let touchStartX = 0;
  let touchEndX = 0;

  // We attach this to the wrapper/slider but we must be careful not to trigger it 
  // when swiping inside the nested carousel, although usually vertical scrolling is the issue.
  // Here we use a simple check, but nested swipe logic handles stopPropagation.
  
  slider.addEventListener('touchstart', (e) => {
    // If the touch started on a nested carousel control or image, we might want to be careful
    // But usually default swipe logic is fine as long as nested logic stops propagation if it consumes the event
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe(e.target);
  }, { passive: true });

  function handleSwipe(target) {
    // If we swiped inside a nested carousel, DO NOT change the main slide
    if (target.closest('.image-carousel')) return;
    // If we swiped over the fullscreen image viewer, DO NOT change the main slide
    if (target.closest('#cv-overlay')) return;

    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }


  // --------------------------------------------
  // NESTED IMAGE CAROUSEL LOGIC
  // --------------------------------------------
  const carousels = document.querySelectorAll('.image-carousel');

  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    const prevCBtn = carousel.querySelector('.carousel-prev');
    const nextCBtn = carousel.querySelector('.carousel-next');
    const indicatorsContainer = carousel.querySelector('.carousel-indicators');
    
    if (images.length === 0) return;

    let currentImgIndex = 0;
    const totalImages = images.length;

    // Create indicators
    images.forEach((_, idx) => {
      const ind = document.createElement('div');
      ind.classList.add('indicator');
      if (idx === 0) ind.classList.add('active');
      ind.addEventListener('click', (e) => {
        e.stopPropagation();
        goToImage(idx);
      });
      indicatorsContainer.appendChild(ind);
    });

    const indicators = carousel.querySelectorAll('.indicator');

    function updateCarousel() {
      // Hide all, show active
      images.forEach((img, idx) => {
        img.classList.toggle('active', idx === currentImgIndex);
      });
      
      // Update indicators
      indicators.forEach((ind, idx) => {
        ind.classList.toggle('active', idx === currentImgIndex);
      });
    }

    function goToImage(idx) {
      currentImgIndex = idx;
      updateCarousel();
    }

    function nextImage(e) {
      if(e) e.stopPropagation();
      currentImgIndex = (currentImgIndex + 1) % totalImages;
      updateCarousel();
    }

    function prevImage(e) {
      if(e) e.stopPropagation();
      currentImgIndex = (currentImgIndex - 1 + totalImages) % totalImages;
      updateCarousel();
    }

    // Event listeners
    if(nextCBtn) nextCBtn.addEventListener('click', nextImage);
    if(prevCBtn) prevCBtn.addEventListener('click', prevImage);

    // Touch support for Nested Carousel
    let cTouchStartX = 0;
    let cTouchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        cTouchStartX = e.changedTouches[0].screenX;
        e.stopPropagation(); // Prevent main slider from seeing this start
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
        cTouchEndX = e.changedTouches[0].screenX;
        e.stopPropagation(); // Prevent main slider from seeing this end
        handleCarouselSwipe();
    }, { passive: true });

    function handleCarouselSwipe() {
        const swipeThreshold = 50;
        const diff = cTouchStartX - cTouchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe Left -> Next Image
                currentImgIndex = (currentImgIndex + 1) % totalImages;
            } else {
                // Swipe Right -> Prev Image
                currentImgIndex = (currentImgIndex - 1 + totalImages) % totalImages;
            }
            updateCarousel();
        }
    }
  });

});
