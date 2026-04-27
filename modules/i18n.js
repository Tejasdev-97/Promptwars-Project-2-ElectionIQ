/**
 * @module i18n
 * @description Handles multilingual support and UI translation using offline dictionary or Google Translate.
 */

import { showToast } from './ui-controller.js';

let currentLang = localStorage.getItem('appLang') || 'en';

// Basic static dictionary for UI elements (fallback/offline)
const dict = {
  en: { home: "Home", timeline: "Timeline", guide: "How to Vote", quiz: "Quiz", glossary: "Glossary", ai: "Ask AI", compare: "Compare" },
  hi: { home: "होम", timeline: "समयरेखा", guide: "वोट कैसे दें", quiz: "प्रश्नोत्तरी", glossary: "शब्दावली", ai: "AI से पूछें", compare: "तुलना" },
  bn: { home: "होम", timeline: "টাইমলাইন", guide: "কীভাবে ভোট দেবেন", quiz: "কুইজ", glossary: "শব্দকোষ", ai: "AI কে জিজ্ঞাসা করুন", compare: "তুলনা করুন" },
  ta: { home: "முகப்பு", timeline: "காலக்கோடு", guide: "வாக்களிப்பது எப்படி", quiz: "வினாடி வினா", glossary: "சொற்களஞ்சியம்", ai: "AI ஐ கேள்", compare: "ஒப்பிடு" },
  te: { home: "హోమ్", timeline: "టైమ్‌లైన్", guide: "ఎలా ఓటు వేయాలి", quiz: "క్విజ్", glossary: "పదకోశం", ai: "AI ని అడగండి", compare: "పోల్చండి" },
  mr: { home: "मुख्यपृष्ठ", timeline: "वेळापत्रक", guide: "मतदान कसे करावे", quiz: "क्विझ", glossary: "शब्दकोश", ai: "AI ला विचारा", compare: "तुलना करा" }
};

export const initI18n = async () => {
  const toggleBtn = document.getElementById('lang-toggle-btn');
  const menu = document.getElementById('lang-menu');
  const options = menu.querySelectorAll('li');
  
  // Toggle menu
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.hidden;
    menu.hidden = !isHidden;
    toggleBtn.setAttribute('aria-expanded', !isHidden);
  });
  
  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !menu.contains(e.target)) {
      menu.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle selection
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      const flag = opt.dataset.flag;
      const label = opt.textContent.substring(0, 2).toUpperCase(); // EN, HI, etc.
      
      setLanguage(lang, flag, label);
      menu.hidden = true;
    });
  });

  // Initialize with saved
  const initialOpt = Array.from(options).find(o => o.dataset.lang === currentLang) || options[0];
  setLanguage(currentLang, initialOpt.dataset.flag, initialOpt.textContent.substring(0, 2).toUpperCase(), true);
};


// Use Google Translate API to dynamically translate content blocks
export const translateDynamicContent = async (queries, targetLang) => {
  if (targetLang === 'en' || !queries || queries.length === 0) return queries;
  
  const apiKey = window.ENV?.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_') || !navigator.onLine) {
    return queries; // Return original if offline or no key
  }
  
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: queries,
        target: targetLang,
        source: 'en',
        format: 'html'
      })
    });
    
    if (!response.ok) throw new Error('Translation API failed');
    
    const data = await response.json();
    return data.data.translations.map(t => t.translatedText);
  } catch (error) {
    console.warn('Google Translate API Error:', error);
    return queries; // Fallback
  }
};

// Call this when language changes to translate all marked content blocks
export const translateContentBlocks = async () => {
  const blocks = Array.from(document.querySelectorAll('[data-translate="true"]'));
  if (blocks.length === 0) return;

  if (currentLang === 'en') {
    blocks.forEach(block => {
      if (block.dataset.originalText) block.innerHTML = block.dataset.originalText;
      if (block.dataset.originalPlaceholder) block.placeholder = block.dataset.originalPlaceholder;
    });
    return;
  }
  
  import('./ui-controller.js').then(({ showToast }) => showToast(`Translating site to ${currentLang.toUpperCase()}...`, 'info', 2000));
  
  const textsToTranslate = [];
  blocks.forEach(block => {
    if (!block.dataset.originalText) block.dataset.originalText = block.innerHTML;
    textsToTranslate.push(block.dataset.originalText);
    
    // Also handle placeholders for inputs
    if (block.placeholder && !block.dataset.originalPlaceholder) {
      block.dataset.originalPlaceholder = block.placeholder;
      textsToTranslate.push(block.dataset.originalPlaceholder);
    }
  });

  const translatedTexts = await translateDynamicContent(textsToTranslate, currentLang);

  let translatedIdx = 0;
  blocks.forEach(block => {
    if (translatedTexts[translatedIdx]) {
      block.innerHTML = translatedTexts[translatedIdx++];
    }
    if (block.dataset.originalPlaceholder && translatedTexts[translatedIdx]) {
      block.placeholder = translatedTexts[translatedIdx++];
    }
  });
};

// Global listener to re-translate when language changes
document.addEventListener('languageChanged', () => {
  translateContentBlocks();
});

const setLanguage = (lang, flag, label, isInitial = false) => {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  
  const flagEl = document.getElementById('current-lang-flag');
  const labelEl = document.getElementById('current-lang-label');
  if (flagEl) flagEl.textContent = flag;
  if (labelEl) labelEl.textContent = label;
  
  // Translate core UI elements (Nav)
  translateUI();
  translateContentBlocks();
  
  if (!isInitial) {
    import('./ui-controller.js').then(({ showToast }) => showToast(`Language changed to ${label}`, 'success'));
    // Dispatch event so other modules can re-render data
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }
};

const translateUI = () => {
  const t = dict[currentLang] || dict['en'];
  
  // Update desktop nav
  const ids = ['home', 'timeline', 'guide', 'quiz', 'glossary', 'ai', 'compare', 'booth', 'eligibility', 'results'];
  ids.forEach(id => {
    const el = document.getElementById(`nav-${id}`);
    if (el && t[id]) el.textContent = t[id];
  });
  
  // Update bottom nav labels
  ids.forEach(id => {
    const el = document.getElementById(`bn-${id}`);
    if (el && t[id]) {
      const labelEl = el.querySelector('.bn-label');
      if (labelEl) labelEl.textContent = t[id];
    }
  });
  
  // Update mobile drawer items
  const drawerItems = document.querySelectorAll('.drawer-item');
  drawerItems.forEach(link => {
    const section = link.dataset.section;
    const labelEl = link.querySelector('span:last-child');
    if (labelEl && t[section]) {
      labelEl.textContent = t[section];
    }
  });
};

export const getCurrentLang = () => currentLang;
