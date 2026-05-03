/**
 * @module app
 * @description Main application entry point for ElectionIQ.
 * Initializes the PWA, sets up the UI, handles routing, and boots all features.
 */

import { initUI, showToast, setupTheme } from './modules/ui-controller.js';
import { initI18n } from './modules/i18n.js';
import { initTimeline } from './modules/timeline.js';
import { initGuide } from './modules/guide.js';
import { initQuiz } from './modules/quiz.js';
import { initGlossary } from './modules/glossary.js';
import { initChat } from './modules/chat.js';
import { initCompare } from './modules/compare.js';
import { initMaps } from './modules/maps.js';
import { initEligibility } from './modules/eligibility.js';
import { initResults } from './modules/results.js';
import { initVoice } from './modules/voice.js';
import { initAccessibility } from './modules/accessibility.js';
import { initCalendar } from './modules/calendar.js';
import { initAnalytics } from './modules/analytics.js';

/**
 * Unregisters any existing Service Workers and clears caches to ensure 
 * the user always gets the latest version of the app.
 * @returns {Promise<void>}
 */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // DEVELOPMENT MODE: Force unregister Service Worker to prevent old cached versions from loading
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('SW unregistered successfully.');
      }
      
      // Clear caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        console.log('Caches cleared successfully.');
      }
    } catch (err) {
      console.error('SW unregistration failed:', err);
    }
  }
};

/**
 * Listens for online/offline events and updates the UI accordingly.
 */
const handleNetworkStatus = () => {
  const offlineBanner = document.getElementById('offline-banner');
  
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      offlineBanner.hidden = true;
      document.body.classList.remove('is-offline');
    } else {
      offlineBanner.hidden = false;
      document.body.classList.add('is-offline');
      showToast("You are offline. Showing cached content.", "warning");
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
};

// ── PWA Install Prompt ──
let deferredPrompt;

/**
 * Sets up the PWA install prompt button logic.
 */
const setupInstallPrompt = () => {
  const installBtn = document.getElementById('pwa-install-btn');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    showToast("App installed successfully!", "success");
  });
};

/**
 * Boots the application by initializing all core modules and features.
 * @returns {Promise<void>}
 */
const initApp = async () => {
  console.log('Booting ElectionIQ...');
  
  // 1. Core Systems
  setupTheme();
  handleNetworkStatus();
  registerServiceWorker();
  setupInstallPrompt();
  
  // 2. UI & Navigation
  initUI();

  // 3. Floating AI Button
  const floatAiBtn = document.getElementById('floating-ai-btn');
  if (floatAiBtn) {
    floatAiBtn.addEventListener('click', () => {
      if (window.navigateTo) window.navigateTo('ai-chat');
    });
    // Add active class if ai-chat is the current section
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'ai-chat') floatAiBtn.classList.add('active');
      else floatAiBtn.classList.remove('active');
    });
  }

  // 4. Mobile "More" drawer toggle
  const moreBtn   = document.getElementById('bn-more');
  const drawer    = document.getElementById('mobile-drawer');
  if (moreBtn && drawer) {
    moreBtn.addEventListener('click', () => {
      const isHidden = drawer.hasAttribute('hidden');
      if (isHidden) { drawer.removeAttribute('hidden'); moreBtn.setAttribute('aria-expanded','true'); }
      else          { drawer.setAttribute('hidden',''); moreBtn.setAttribute('aria-expanded','false'); }
    });
    // Drawer items navigate and close drawer
    drawer.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.setAttribute('hidden','');
        moreBtn.setAttribute('aria-expanded','false');
        if (window.navigateTo) window.navigateTo(link.dataset.section);
      });
    });
    // Close drawer on outside tap
    document.addEventListener('click', (e) => {
      if (!drawer.hasAttribute('hidden') && !drawer.contains(e.target) && e.target !== moreBtn) {
        drawer.setAttribute('hidden','');
        moreBtn.setAttribute('aria-expanded','false');
      }
    });
  }

  
  // 3. Language
  await initI18n();
  
  // 4. Features (Lazy load or init async)
  initTimeline();
  initGuide();
  initQuiz();
  initGlossary();
  initChat();
  initCompare();
  initMaps();
  initEligibility();
  initResults();
  initVoice();
  initAccessibility();
  initCalendar();
  initAnalytics();
  
  // Update stats animation on home page
  animateStats();
  
  // Setup Scroll & Parallax Animations
  setupAnimations();
  
  // Floating buttons scroll fade
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    document.body.classList.add('scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 400);
  }, { passive: true });
};

/**
 * Animates numerical statistics on the home page from 0 to their target values.
 */
const animateStats = () => {
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach(stat => {
    const target = parseInt(stat.getAttribute('data-count'), 10);
    const duration = 2000;
    const stepTime = Math.abs(Math.floor(duration / target));
    let current = 0;
    
    // Quick fast forward for large numbers
    const increment = target > 100 ? Math.ceil(target / 50) : 1;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        stat.textContent = target;
        clearInterval(timer);
      } else {
        stat.textContent = current;
      }
    }, stepTime);
  });
};

/**
 * Sets up scroll animations and parallax effects for UI elements.
 */
const setupAnimations = () => {
  // 1. Intersection Observer for Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -20px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target); // Animate only once
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  document.querySelectorAll('.animate-card, .animate-slide-up, .animate-fade-in').forEach(el => {
    // Make sure they have base opacity 0 in CSS if not visible
    observer.observe(el);
  });

  // 2. Parallax Effect for Hero Section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < window.innerHeight) {
            // Move hero content slightly down for parallax
            heroSection.style.transform = `translateY(${scrollY * 0.3}px)`;
            heroSection.style.opacity = 1 - (scrollY / 700);
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
};

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
