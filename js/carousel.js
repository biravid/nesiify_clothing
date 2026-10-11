/**
 * ===================================================
 * NESIIFY CLOTHING — AUTOMATIC HERO CAROUSEL
 * ===================================================
 * 3-Image promotional banner carousel:
 * - Automatic transition every ~4 seconds (4000ms)
 * - Infinite seamless loop (1 -> 2 -> 3 -> 1)
 * - Clickable pagination dots (● ○ ○)
 * - Mobile touch swipe support (left/right)
 * - Pause on user hover / interaction, auto-resume
 * - Respects prefers-reduced-motion
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
});

function initHeroCarousel() {
  const carouselEl = document.getElementById('heroCarousel');
  if (!carouselEl) return;

  const slides = carouselEl.querySelectorAll('.hero-carousel-slide');
  const dots = carouselEl.querySelectorAll('.carousel-dot');
  const totalSlides = slides.length;
  if (totalSlides < 2) return;

  let currentIndex = 0;
  let autoTimer = null;
  const SLIDE_DURATION = 4000; // ~4 seconds

  /**
   * Switch to target slide index
   * @param {number} nextIndex 
   */
  function goToSlide(nextIndex) {
    currentIndex = (nextIndex + totalSlides) % totalSlides;

    slides.forEach((slide, idx) => {
      const isActive = idx === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoTimer = setInterval(nextSlide, SLIDE_DURATION);
  }

  function stopAutoSlide() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // 1. Pagination Dots Click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.getAttribute('data-slide-index'), 10);
      if (!isNaN(targetIdx)) {
        goToSlide(targetIdx);
        startAutoSlide(); // Reset timer after manual selection
      }
    });
  });

  // 2. Pause on Hover / Resume on Leave
  carouselEl.addEventListener('mouseenter', stopAutoSlide);
  carouselEl.addEventListener('mouseleave', startAutoSlide);

  // 3. Mobile Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  carouselEl.addEventListener('touchstart', (e) => {
    stopAutoSlide();
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  carouselEl.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
    startAutoSlide();
  }, { passive: true });

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    // Ensure horizontal gesture is intentional and exceeds vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) {
        nextSlide(); // Swiped left -> next
      } else {
        prevSlide(); // Swiped right -> prev
      }
    }
  }

  // 4. Keyboard Navigation when focused
  carouselEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoSlide();
    }
  });

  // 5. Start auto-sliding
  startAutoSlide();
}
