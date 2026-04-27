/**
 * @module chat
 * @description Ask AI feature using Google Gemini REST API.
 * Falls back to curated offline FAQ answers when offline or API unavailable.
 */

import { showToast } from './ui-controller.js';
import { getCurrentLang } from './i18n.js';
import { fetchJSON } from './data-loader.js';
import { speakResponse } from './voice.js';

let offlineFaqs = [];
let lastMessageTime = 0;
const RATE_LIMIT_MS = 4000;

export const initChat = async () => {
  const form      = document.getElementById('chat-form');
  const input     = document.getElementById('chat-input');
  const container = document.getElementById('chat-messages');
  const chips     = document.querySelectorAll('.chip');

  if (!form || !input || !container) return;

  // Load offline FAQs
  const faqData = await fetchJSON('data/faq-offline.json');
  if (faqData?.faqs) offlineFaqs = faqData.faqs;

  // Chip shortcuts
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.query;
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });
  });

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - lastMessageTime)) / 1000);
      showToast(`Please wait ${wait}s before asking again.`, 'warning');
      return;
    }
    lastMessageTime = now;

    addMessage(query, 'user');
    input.value = '';

    const loadingId = addMessage('Thinking…', 'ai', true);

    try {
      const reply = await askGemini(query);
      updateMessage(loadingId, reply);
    } catch (err) {
      console.warn('[chat] Gemini error:', err.message);
      const fallback = getOfflineAnswer(query);
      updateMessage(loadingId, fallback);
    }
  });

  // Enter = send (Shift+Enter = newline)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });
  
  // Handle language change for existing messages
  document.addEventListener('languageChanged', async (e) => {
    const lang = e.detail;
    const aiMessages = document.querySelectorAll('.chat-msg.ai');
    
    // We only translate if it's not English. If English, we revert to original.
    for (const msg of aiMessages) {
      const bubble = msg.querySelector('.msg-bubble-content');
      if (!bubble || !bubble.dataset.originalText) continue;
      
      if (lang === 'en') {
        bubble.innerHTML = bubble.dataset.originalText;
      } else {
        const { translateDynamicContent } = await import('./i18n.js');
        const translated = await translateDynamicContent([bubble.dataset.originalText], lang);
        if (translated && translated[0]) {
          bubble.innerHTML = translated[0];
        }
      }
    }
  });
};

// ── Add a message bubble ──────────────────────────────────────────────────────
const addMessage = (text, sender, isLoading = false) => {
  const container = document.getElementById('chat-messages');
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;
  div.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = sender === 'ai' ? '🤖' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (isLoading) {
    bubble.innerHTML = '<span class="voice-pulse" style="display:inline-block;margin-right:6px;"></span>Thinking…';
  } else {
    const content = document.createElement('div');
    content.className = 'msg-bubble-content';
    content.textContent = text;
    bubble.appendChild(content);
    
    if (sender === 'ai') {
      addMessageActions(bubble, text);
    }
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
};

const addMessageActions = (bubble, text) => {
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  
  const speakBtn = document.createElement('button');
  speakBtn.className = 'msg-action-btn speak-btn';
  speakBtn.innerHTML = '🔊';
  speakBtn.title = 'Listen to this response';
  speakBtn.onclick = () => speakResponse(bubble.querySelector('.msg-bubble-content').textContent);
  
  const translateBtn = document.createElement('button');
  translateBtn.className = 'msg-action-btn trans-btn';
  translateBtn.innerHTML = '🌐 EN';
  translateBtn.title = 'Translate to English';
  translateBtn.onclick = async () => {
    const content = bubble.querySelector('.msg-bubble-content');
    if (content.dataset.originalText) {
      content.innerHTML = content.dataset.originalText;
      showToast('Restored to English', 'info');
    }
  };
  
  actions.appendChild(speakBtn);
  actions.appendChild(translateBtn);
  bubble.appendChild(actions);
};

// ── Update a message bubble by ID ─────────────────────────────────────────────
const updateMessage = (id, newText) => {
  const el = document.getElementById(id);
  if (!el) return;
  const bubble = el.querySelector('.msg-bubble');
  if (!bubble) return;

  bubble.innerHTML = '';
  const content = document.createElement('div');
  content.className = 'msg-bubble-content';
  
  // Sanitise then render basic markdown
  const safe = newText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  content.innerHTML = safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  // Store original for language switching
  content.dataset.originalText = content.innerHTML;
  
  bubble.appendChild(content);
  addMessageActions(bubble, newText);

  // Scroll to bottom
  const container = document.getElementById('chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
};

// ── Call Gemini API ───────────────────────────────────────────────────────────
const askGemini = async (query) => {
  if (!navigator.onLine) throw new Error('Offline');

  const apiKey = window.ENV?.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey === 'AIzaSyCl99FvCto9nJUqJnS0dU7cvJ84aDDl-p0') throw new Error('Valid Gemini API key not configured');

  const lang = getCurrentLang();
  let systemPrompt = `You are ElectionIQ AI, a professional expert on Indian elections. 
Your goal is to provide a complete, well-structured, and helpful response.
- For simple greetings (like "Hi"), provide a friendly, short response.
- For complex questions, provide a thorough, comprehensive answer (500-1000 words if necessary) and ALWAYS finish your sentences.
- Never stop mid-thought or mid-sentence. 
- Current year is ${new Date().getFullYear()}.`;
  if (lang && lang !== 'en') {
    systemPrompt += ` Please reply in language code: ${lang}.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nUser question: ${query}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096, topK: 40, topP: 0.95 }
    })
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${resp.status}`);
  }

  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
};

// ── Offline FAQ keyword match ─────────────────────────────────────────────────
const getOfflineAnswer = (query) => {
  const q = query.toLowerCase();

  if (offlineFaqs.length > 0) {
    for (const faq of offlineFaqs) {
      if (Array.isArray(faq.keywords) && faq.keywords.some(kw => q.includes(kw.toLowerCase()))) {
        return `📡 (Offline) ${faq.answer}`;
      }
    }
  }

  // Built-in hardcoded answers for very common questions
  if (q.includes('evm'))   return '📡 (Offline) An EVM (Electronic Voting Machine) is a standalone device used to record votes in Indian elections. It has two units: the Control Unit (with the presiding officer) and the Ballot Unit (with the voter). EVMs were first used in 1982 in Kerala and became universal from 2004.';
  if (q.includes('nota'))  return '📡 (Offline) NOTA (None Of The Above) is an option on Indian ballots introduced in 2013 by the Supreme Court. It allows voters to reject all candidates without spoiling their ballot. If NOTA gets the most votes, the candidate with the next highest votes wins.';
  if (q.includes('vote') || q.includes('how')) return '📡 (Offline) To vote in India: (1) Register on the Electoral Roll at voters.eci.gov.in, (2) Check your name on the voter list, (3) Collect your Voter ID (EPIC), (4) Visit your polling booth on election day with a valid photo ID, (5) Get your finger inked and press your candidate\'s button on the EVM.';
  if (q.includes('age') || q.includes('eligible')) return '📡 (Offline) You must be 18 years or older as of January 1st of the year the electoral roll is prepared. You must also be an Indian citizen and a resident of the constituency where you register.';
  if (q.includes('2026') || q.includes('election')) return '📡 (Offline) Major elections in 2026: Bihar State Assembly elections (October-November 2026), Kerala Local Body elections (early 2026), and West Bengal Municipal elections. The next general Lok Sabha election is due in 2029.';

  return '📡 (Offline) I\'m currently offline. For election information, please visit eci.gov.in or voters.eci.gov.in. Connect to the internet for AI-powered answers.';
};
