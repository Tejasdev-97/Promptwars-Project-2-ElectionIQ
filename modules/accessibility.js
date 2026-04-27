/**
 * @module accessibility
 * @description High Contrast, Large Font, Dyslexia Font, Reduce Motion toggles.
 * All preferences are persisted to localStorage.
 */

export const initAccessibility = () => {
  const toggleBtn = document.getElementById('a11y-toggle');
  const panel     = document.getElementById('a11y-panel');
  if (!toggleBtn || !panel) return;

  // Open / close panel
  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.hasAttribute('hidden');
    if (isHidden) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.hasAttribute('hidden') &&
        !panel.contains(e.target) &&
        e.target !== toggleBtn) {
      panel.setAttribute('hidden', '');
    }
  });

  const features = [
    { id: 'a11y-high-contrast', cls: 'a11y-high-contrast',  label: 'High Contrast' },
    { id: 'a11y-large-font',    cls: 'a11y-large-font',     label: 'Large Font' },
    { id: 'a11y-dyslexia',      cls: 'a11y-dyslexia',       label: 'Dyslexia Font' },
    { id: 'a11y-reduce-motion', cls: 'a11y-reduce-motion',  label: 'Reduce Motion' },
    { id: 'a11y-screen-reader', cls: 'a11y-screen-reader',  label: 'Enhanced Screen Reader' },
  ];

  features.forEach(({ id, cls }) => {
    const cb = document.getElementById(id);
    if (!cb) return;

    // Restore saved preference
    const saved = localStorage.getItem(`electioniq-${id}`) === 'true';
    cb.checked = saved;
    if (saved) document.body.classList.add(cls);

    cb.addEventListener('change', () => {
      localStorage.setItem(`electioniq-${id}`, cb.checked);
      document.body.classList.toggle(cls, cb.checked);
    });
  });
};
