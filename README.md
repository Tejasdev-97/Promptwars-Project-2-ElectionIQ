# ElectionIQ 🇮🇳 : Smart Voter Intelligence Platform

![ElectionIQ Banner](https://img.shields.io/badge/Platform-Progressive%20Web%20App%20(PWA)-1a73e8?style=for-the-badge) ![Gemini AI](https://img.shields.io/badge/Powered_by-Gemini_2.5_Flash-f97316?style=for-the-badge) ![Offline Ready](https://img.shields.io/badge/Status-Offline_Ready-success?style=for-the-badge)

ElectionIQ is a state-of-the-art, multilingual Progressive Web App (PWA) designed to demystify the Indian election process for the upcoming **2026 Election Cycle**. By combining offline-first web technologies with the real-time reasoning power of Google's **Gemini 2.5 Flash**, ElectionIQ ensures that every citizen—from urban youth to rural first-time voters—has access to accurate, unbiased, and easy-to-understand electoral information.

---

## 🎯 Who Does This Help?

*   **First-Time Voters (Youth):** Navigating the voting process for the first time can be intimidating. ElectionIQ provides a step-by-step registration guide, an interactive EVM explainer, and a gamified quiz to build confidence.
*   **Rural & Local Voters:** Features specialized guides for Gram Panchayat elections (explaining paper ballots) and guarantees full functionality even in areas with spotty 2G internet using its **Offline-First caching architecture**.
*   **Non-English Speakers:** The entire application—from static text to dynamic AI chat and real-time results—is universally translatable via the Google Translate API, ensuring language is never a barrier to democracy.
*   **Curious Citizens:** Those looking to understand how India's parliamentary system stacks up globally or wanting to check the latest real-time seat tallies and election timelines.

---

## ✨ Core Features

1.  **Multilingual AI Chatbot (Gemini Powered) 🤖**
    *   Ask any question about elections in any language. The bot uses Gemini 2.5 Flash to provide accurate, 500-1000 word detailed answers.
    *   Includes **Text-to-Speech (🔊)** capabilities and a quick **Translate to English (🌐 EN)** toggle.
    *   *Offline fallback:* If the internet drops, the bot instantly switches to a local database of 100+ pre-programmed FAQs.

2.  **Real-Time Data Streams 📡**
    *   **Live Results Dashboard:** Fetches the absolute latest election results (via Gemini) when online, caching them locally to display on a responsive Google Chart.
    *   **Dynamic Timeline:** Shows the active, upcoming, and completed phases of the 2026 state elections.

3.  **Constituency & Booth Locator 🗺️**
    *   Integrated with Google Maps. Users can input their Pincode to visualize their polling booth location and constituency details.

4.  **Gamified Election Quiz 🏆**
    *   Test your democratic knowledge across three difficulty levels.
    *   Earn dynamic ranks (e.g., *Beginner Voter* → *Democracy Legend 🏆*) based on perfect streaks. All questions and results are fully translated dynamically.

5.  **Global Comparison Engine ⚖️**
    *   Side-by-side comparison of India's electoral system with the USA, UK, and EU.
    *   Includes a dedicated section detailing India's internal tiers: Lok Sabha, Rajya Sabha, Vidhan Sabha, and Panchayats.

6.  **Accessibility & UX First ♿**
    *   Fully scroll-aware UI: Floating AI and Accessibility buttons fade to 15% opacity while scrolling to avoid blocking content.
    *   Adjustable text sizes, high-contrast modes, and dyslexic-friendly fonts.

---

## 🛠️ Tech Stack

*   **Frontend Framework:** Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid), and Modular JavaScript (ES6+). *Zero heavy frontend frameworks ensuring lightning-fast load times.*
*   **AI Integration:** Google Gemini API (`gemini-2.5-flash` model via `generativelanguage.googleapis.com`).
*   **Translation Engine:** Google Translate API (Batch processing for instant whole-site translation).
*   **Data Visualization:** Google Charts API.
*   **Mapping:** Google Maps Embed API.
*   **Architecture:** Progressive Web App (PWA) with a custom `service-worker.js` for aggressive offline caching and `localStorage` state management.

---

## 🚀 How to Run Locally

### Prerequisites
You need **Node.js** installed on your machine to run the local development server. You also need API keys for Gemini, Google Maps, and Google Translate.

### Step-by-Step Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Tejasdev-97/Promptwars-Project-2-ElectionIQ.git
   cd Promptwars-Project-2-ElectionIQ
   ```

2. **Configure API Keys:**
   * Look for the `env-config.example.js` file in the root directory.
   * Rename it to `env-config.js` (or create a new file named `env-config.js`).
   * *Note: `env-config.js` is included in `.gitignore` to prevent leaking your keys.*
   * Inside `env-config.js`, add your API keys:
   ```javascript
   window.ENV = {
     GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",
     MAPS_API_KEY: "YOUR_MAPS_API_KEY_HERE",
     TRANSLATE_API_KEY: "YOUR_TRANSLATE_API_KEY_HERE"
   };
   ```

3. **Install Dependencies:**
   *(The project relies heavily on vanilla web tech, but we use `vite` or `http-server` for serving the local dev environment)*
   ```bash
   npm install
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will typically start on `http://localhost:5173` or `http://localhost:8080`.*

---

## 🔒 Security Notes
*   **Never commit your `env-config.js` file.**
*   The `node_modules` directory and all `.env` variants are securely ignored via `.gitignore`.

---
*Built for the 2026 Indian Elections.* 🇮🇳
