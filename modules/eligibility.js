/**
 * @module eligibility
 * @description Checks if a user is eligible to vote based on age and nationality.
 */

export const initEligibility = () => {
  const form      = document.getElementById('eligibility-form');
  const resultDiv = document.getElementById('eligibility-result');
  const dobInput  = document.getElementById('elig-dob');

  if (!form || !resultDiv || !dobInput) return;

  // Prevent future dates and cap year range
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  dobInput.setAttribute('max', todayStr);
  dobInput.setAttribute('min', '1900-01-01');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const dobValue = dobInput.value;
    if (!dobValue) return;

    const dob    = new Date(dobValue);
    const now    = new Date();
    
    // Accurate age calculation
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;

    // Guard against absurd input
    if (age < 0 || age > 130) {
      resultDiv.innerHTML = `<div style="background:#ffebee;color:#c62828;padding:15px;border-radius:8px;">
        <h3>⚠️ Invalid Date of Birth</h3><p>Please enter a valid date.</p></div>`;
      return;
    }

    const nationality = document.getElementById('elig-nationality').value;

    if (nationality === 'indian') {
      if (age >= 18) {
        resultDiv.innerHTML = `
          <div style="background:#e8f5e9;color:#2e7d32;padding:20px;border-radius:8px;border-left:4px solid #2e7d32;">
            <h3>✅ You are ELIGIBLE to vote!</h3>
            <p>You are <strong>${age} years old</strong>. You meet the age requirement of 18+.</p>
            <p style="margin-top:8px;"><strong>Documents Needed:</strong> Voter ID / Aadhaar Card / Passport.</p>
            <a href="https://voters.eci.gov.in" target="_blank" rel="noopener" class="btn btn-primary" 
               style="margin-top:12px;display:inline-flex;">📝 Register / Check Roll</a>
          </div>`;
      } else {
        const turns18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
        const diffDays = Math.ceil((turns18 - now) / (1000 * 60 * 60 * 24));
        resultDiv.innerHTML = `
          <div style="background:#fff3e0;color:#e65100;padding:20px;border-radius:8px;border-left:4px solid #ef6c00;">
            <h3>⏳ Not Yet Eligible</h3>
            <p>You are <strong>${age} years old</strong>. You must be 18 to vote in India.</p>
            <p>You will be eligible in approximately <strong>${diffDays} more days</strong>.</p>
          </div>`;
      }
    } else {
      resultDiv.innerHTML = `
        <div style="background:#e3f2fd;color:#1565c0;padding:20px;border-radius:8px;border-left:4px solid #1565c0;">
          <h3>ℹ️ Non-Indian Nationals</h3>
          <p>Only Indian citizens are eligible to vote in Indian General Elections.</p>
          <p style="margin-top:8px;">If you are an NRI (holding an Indian passport), you may register but must be present at your constituency booth on voting day.</p>
        </div>`;
    }
  });
};

