/**
 * @module voice
 * @description Handles Web Speech API for Speech-to-Text and Text-to-Speech
 */

import { getCurrentLang } from './i18n.js';

export const initVoice = () => {
  const voiceBtn = document.getElementById('voice-btn');
  const chatInput = document.getElementById('chat-input');
  const chatForm = document.getElementById('chat-form');
  const voiceStatus = document.getElementById('voice-status');

  if (!voiceBtn || !chatInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    voiceBtn.style.display = 'none'; // Not supported
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceBtn.addEventListener('click', () => {
    try {
      const lang = getCurrentLang();
      // Map basic app lang codes to speech lang codes
      const langMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'mr': 'mr-IN'
      };
      recognition.lang = langMap[lang] || 'en-IN';
      recognition.start();
      voiceStatus.hidden = false;
      document.getElementById('voice-status-text').textContent = 'Listening...';
    } catch (e) {
      console.warn("Speech recognition already started or error:", e);
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    voiceStatus.hidden = true;
    chatForm.dispatchEvent(new Event('submit'));
  };

  recognition.onerror = (event) => {
    document.getElementById('voice-status-text').textContent = 'Error listening. Try again.';
    setTimeout(() => { voiceStatus.hidden = true; }, 2000);
  };
  
  recognition.onend = () => {
    voiceStatus.hidden = true;
  };
};

export const speakResponse = (text) => {
  if (!window.speechSynthesis) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Strip markdown/html tags
  const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[*#]/g, '');
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const lang = getCurrentLang();
  const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'bn': 'bn-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'mr': 'mr-IN' };
  utterance.lang = langMap[lang] || 'en-IN';
  
  window.speechSynthesis.speak(utterance);
};
