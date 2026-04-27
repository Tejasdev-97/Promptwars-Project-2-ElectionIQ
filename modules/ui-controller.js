/**
 * @module ui-controller
 * @description Handles core UI: navigation, theme, modals, toasts, accessibility.
 */

let currentSection = 'home';

// ── Navigation ──
export const initUI = () => {
  const navLinks = document.querySelectorAll('[data-section]');

  const navigateTo = (sectionId) => {
    if (!document.getElementById(sectionId)) return;
    if (currentSection === sectionId) return;

    // Hide current
    const currentEl = document.getElementById(currentSection);
    if (currentEl) currentEl.classList.remove('active');

    // Show new
    const newEl = document.getElementById(sectionId);
    if (newEl) {
      newEl.classList.add('active');
      // Re-trigger card animations for this section
      newEl.querySelectorAll('.animate-card').forEach(el => {
        el.classList.remove('visible');
        requestAnimationFrame(() => el.classList.add('visible'));
      });
    }

    // Update all nav links (top + bottom)
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });

    currentSection = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState(null, null, `#${sectionId}`);
  };

  // Expose globally so other modules can navigate
  window.navigateTo = navigateTo;

  // Click listeners for all nav links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  // Buttons with data-navigate
  document.querySelectorAll('[data-navigate]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(btn.dataset.navigate);
    });
  });

  // Handle initial hash
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    // Small delay so JS modules have time to init
    setTimeout(() => navigateTo(hash), 50);
  }

  // Browser back/forward
  window.addEventListener('popstate', () => {
    const h = window.location.hash.slice(1);
    navigateTo(h && document.getElementById(h) ? h : 'home');
  });

  // Intersection observer for first-time animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-card, .animate-slide-up, .animate-fade-in').forEach(el => observer.observe(el));

  // Modal close
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  const closeModal = () => {
    modalOverlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  };
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modalOverlay.hasAttribute('hidden')) closeModal();
  });
};

// ── Theme ──
export const setupTheme = () => {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const icon = btn.querySelector('.theme-icon');
  const html = document.documentElement;

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('electioniq-theme', theme);
    if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
  };

  applyTheme(localStorage.getItem('electioniq-theme') || 'light');
  btn.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
};

// ── Toast ──
export const showToast = (message, type = 'info', duration = 3500) => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
};

// ── Modal ──
export const showModal = (title, contentHTML) => {
  const overlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  if (!overlay || !modalTitle || !modalBody) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = contentHTML;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  // Focus the close button for accessibility
  document.getElementById('modal-close-btn')?.focus();
};
