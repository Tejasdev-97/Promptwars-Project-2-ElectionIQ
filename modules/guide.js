/**
 * @module guide
 * @description Loads and renders the How to Vote guide steps.
 */

import { fetchJSON } from './data-loader.js';

export const initGuide = async () => {
  const container = document.getElementById('steps-container');
  if (!container) return;

  const data = await fetchJSON('data/faq-offline.json');
  if (!data) {
    container.innerHTML = '<p>Failed to load guide data.</p>';
    return;
  }

  // We extract a few specific FAQs to act as the "Guide Steps"
  // For a real app, this might be a dedicated JSON structure
  const steps = [
    { title: "Register to Vote", key: "register" },
    { title: "Check Voter List", key: "check name" },
    { title: "Find Polling Booth", key: "polling booth" },
    { title: "Carry Valid ID", key: "documents" },
    { title: "Cast Your Vote (EVM)", key: "evm" }
  ];

  container.innerHTML = ''; // Clear loading

  steps.forEach((step, index) => {
    // Find matching FAQ
    const faq = data.faqs.find(f => f.keywords && f.keywords.includes(step.key)) ||
      { answer: "Details available on ECI website." };

    const el = document.createElement('article');
    el.className = 'step-card animate-card';
    el.innerHTML = `
      <div class="step-number" aria-hidden="true">${index + 1}</div>
      <div class="step-content">
        <h3 class="step-title">${step.title}</h3>
        <p class="step-desc">${formatAnswer(faq.answer)}</p>
      </div>
    `;
    container.appendChild(el);
  });

  // Feature 11: EVM Explainer
  const evmBtn = document.getElementById('btn-evm-explainer');
  if (evmBtn) {
    evmBtn.addEventListener('click', () => {
      import('./ui-controller.js').then(({ showModal }) => {
        const content = `
          <div class="evm-explainer" style="text-align: left;">
            <div class="step">
              <h4>Step 1: The Ballot Unit</h4>
              <p>Voter presses candidate button on Ballot Unit.</p>
            </div>
            <div class="step">
              <h4>Step 2: Confirmation</h4>
              <p>Beep sound + light confirms vote registered on Control Unit.</p>
            </div>
            <div class="step">
              <h4>Step 3: VVPAT Printing</h4>
              <p>VVPAT prints a paper slip showing candidate name + symbol.</p>
            </div>
            <div class="step">
              <h4>Step 4: Verification</h4>
              <p>Voter sees slip through glass window for 7 seconds.</p>
            </div>
            <div class="step">
              <h4>Step 5: Secure Drop</h4>
              <p>Slip auto-cuts and drops into sealed VVPAT box.</p>
            </div>
            <div class="step">
              <h4>Step 6: Encryption</h4>
              <p>Vote stored encrypted in EVM memory.</p>
            </div>
            <hr>
            <h4>Official ECI EVM Explainer Video</h4>
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 15px 0;">
              <iframe src="https://www.youtube.com/embed/BtsyBetcCCs" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
            </div>
            <hr>
            <h4>Comparison: Paper Ballot vs EVM</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
              <tr style="border-bottom:1px solid #ddd;"><th>Feature</th><th>Paper</th><th>EVM</th></tr>
              <tr style="border-bottom:1px solid #ddd;"><td>Speed</td><td>Slow</td><td>Fast</td></tr>
              <tr><td>Invalid Votes</td><td>Common</td><td>Impossible</td></tr>
            </table>
          </div>
        `;
        showModal('EVM + VVPAT Interactive Explainer', content);
      });
    });
  }

  // Feature 14: Flowchart
  const flowBtn = document.getElementById('btn-flowchart');
  if (flowBtn) {
    flowBtn.addEventListener('click', () => {
      import('./ui-controller.js').then(({ showModal }) => {
        const content = `
          <div class="flowchart" style="text-align: left; position: relative;">
            <ul style="list-style-type: none; padding-left: 20px; border-left: 2px solid #1a73e8;">
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">1</span>
                <strong>Votes Cast</strong> - Booths close at 6PM
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">2</span>
                <strong>EVMs Sealed</strong> - Transported under security
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">3</span>
                <strong>Counting Day</strong> - Observers present
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">4</span>
                <strong>Votes Tallied</strong> - Candidate-wise
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">5</span>
                <strong>Result Declared</strong> - By Returning Officer
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">6</span>
                <strong>Certificate</strong> - Winner receives certificate
              </li>
              <li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">7</span>
                <strong>Oath Ceremony</strong> - At Parliament/Assembly
              </li>
              <li style="position: relative;">
                <span style="position: absolute; left: -28px; background: #1a73e8; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px;">8</span>
                <strong>Government Formed</strong> - New MP takes office
              </li>
            </ul>
          </div>
        `;
        showModal('What Happens After I Vote?', content);
      });
    });
  }
};

// Simple formatter to convert newlines to breaks or lists
const formatAnswer = (text) => {
  if (!text) return '';
  // Convert basic numbering (1. 2. 3.) to structured HTML if needed
  // For now, just handle newlines
  return text.replace(/\n/g, '<br/>');
};
