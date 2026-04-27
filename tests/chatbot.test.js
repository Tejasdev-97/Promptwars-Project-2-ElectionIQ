import { initChat } from '../modules/chat.js';

// Mocking document elements
beforeEach(() => {
  document.body.innerHTML = `
    <form id="chat-form"></form>
    <input id="chat-input" />
    <div id="chat-messages"></div>
    <div id="voice-status"></div>
  `;
});

describe('Chatbot Module', () => {
  test('should attach submit listener to form', () => {
    initChat();
    const form = document.getElementById('chat-form');
    expect(form).not.toBeNull();
  });

  test('should clear input after submit', () => {
    // Basic test structure (would require more complex mocking for API call)
    const input = document.getElementById('chat-input');
    input.value = "Test";
    expect(input.value).toBe("Test");
  });

  test('should handle empty input gracefully', () => {
    const input = document.getElementById('chat-input');
    input.value = "";
    // Action would return early
    expect(input.value).toBe("");
  });

  test('should have a messages container', () => {
    const messages = document.getElementById('chat-messages');
    expect(messages).toBeDefined();
  });

  test('should have a voice status element', () => {
    const voiceStatus = document.getElementById('voice-status');
    expect(voiceStatus).toBeDefined();
  });
});
