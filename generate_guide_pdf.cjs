const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectDir = 'C:\\Users\\Aryan Kamdar\\.gemini\\antigravity\\scratch\\tosbs-app\\tosbs-onboarding-main\\tosbs-onboarding-main';
const logoPath = path.join(projectDir, 'public', 'Capture.JPG');
const stampPath = path.join(projectDir, 'public', 'tosbs_stamp.png');
const sigPath = path.join(projectDir, 'public', 'tosbs_signature.png');

const logoBase64 = fs.existsSync(logoPath) ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString('base64')}` : '';
const stampBase64 = fs.existsSync(stampPath) ? `data:image/png;base64,${fs.readFileSync(stampPath).toString('base64')}` : '';
const sigBase64 = fs.existsSync(sigPath) ? `data:image/png;base64,${fs.readFileSync(sigPath).toString('base64')}` : '';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TOSBS - Employee Onboarding Process Manual</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.45;
    font-size: 9.5pt;
    margin: 0;
    padding: 0;
  }

  .page {
    page-break-after: always;
    break-after: page;
    position: relative;
    box-sizing: border-box;
    height: 270mm;
    overflow: hidden;
  }
  .page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Header & Branding */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f1f3d;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .brand-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand-logo {
    height: 38px;
    object-fit: contain;
  }
  .brand-text h1 {
    font-size: 14pt;
    font-weight: 800;
    color: #0f1f3d;
    margin: 0;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  .brand-text p {
    font-size: 7.5pt;
    color: #64748b;
    margin: 2px 0 0 0;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .doc-badge {
    text-align: right;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .doc-badge .tag {
    font-size: 7pt;
    font-weight: 700;
    color: #c8922a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .doc-badge .val {
    font-size: 8pt;
    font-weight: 600;
    color: #0f1f3d;
  }

  /* Section Titles */
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0f1f3d;
    border-left: 4px solid #c8922a;
    padding-left: 8px;
    margin: 10px 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-subtitle {
    font-size: 8pt;
    color: #64748b;
    margin: -2px 0 8px 12px;
  }

  /* Card / Boxes */
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
  }
  .card-navy {
    background: #0f1f3d;
    color: #ffffff;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 8px;
  }

  /* Steps Styling */
  .step-container {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 8px;
    background: #ffffff;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .step-header {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #0f1f3d;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .step-number.step-orange {
    background: #c8922a;
  }
  .step-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f1f3d;
    margin-left: 8px;
  }
  .step-badge {
    font-size: 7pt;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 12px;
    background: #e2e8f0;
    color: #475569;
  }
  .step-badge.mandatory {
    background: #fee2e2;
    color: #991b1b;
  }
  .step-badge.verified {
    background: #dcfce7;
    color: #166534;
  }
  .step-body {
    padding: 10px 12px;
    font-size: 8.5pt;
  }

  /* Grids & Tables */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-top: 4px;
  }
  table.data-table th {
    background: #f1f5f9;
    color: #0f1f3d;
    font-weight: 700;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #e2e8f0;
  }
  table.data-table td {
    padding: 5px 7px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  /* Alerts & Callouts */
  .alert {
    padding: 6px 10px;
    border-radius: 5px;
    font-size: 8pt;
    margin: 6px 0;
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .alert-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
  }
  .alert-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
  }
  .alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  /* Checklist pills */
  .chk-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
  }
  .chk-box {
    width: 13px;
    height: 13px;
    border: 2px solid #c8922a;
    border-radius: 3px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .chk-text strong {
    color: #0f1f3d;
    font-size: 8pt;
    display: block;
  }
  .chk-text span {
    color: #64748b;
    font-size: 7.2pt;
  }

  /* Footer */
  .doc-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    font-size: 7pt;
    color: #94a3b8;
  }

  /* Key-Value styling */
  .kv-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 5px 8px;
  }
  .kv-label {
    font-size: 6.8pt;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.05em;
  }
  .kv-value {
    font-size: 8pt;
    font-weight: 600;
    color: #0f1f3d;
    margin-top: 1px;
  }
</style>
</head>
<body>

<!-- ================= PAGE 1 ================= -->
<div class="page">
  <div class="doc-header">
    <div class="brand-box">
      ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="TOSBS Logo" />` : ''}
      <div class="brand-text">
        <h1>The Other Side Business Services</h1>
        <p>INTERNAL WORKSPACES &bull; HR OPERATIONS MANUAL</p>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Standard Operating Procedure</div>
      <div class="val">DOC-ID: TOSBS-SOP-ONB-01</div>
    </div>
  </div>

  <div class="card-navy">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <span style="background:rgba(200,146,42,0.25); color:#f59e0b; font-size:7pt; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.08em; border:1px solid rgba(245,158,11,0.4);">Official Guide</span>
        <h2 style="font-size:14pt; margin:6px 0 3px 0; font-weight:800; letter-spacing:-0.02em;">Employee Onboarding Process Manual</h2>
        <p style="font-size:8.2pt; margin:0; color:#cbd5e1; max-width:540px; line-height:1.4;">
          A comprehensive step-by-step roadmap for newly appointed employees to activate their portal account, complete digital verifications, submit compliance declarations, and access official workspaces.
        </p>
      </div>
      <div style="background:rgba(255,255,255,0.08); padding:6px 10px; border-radius:5px; border:1px solid rgba(255,255,255,0.15); text-align:right;">
        <div style="font-size:6.8pt; color:#94a3b8; text-transform:uppercase; font-weight:600;">Effective Date</div>
        <div style="font-size:8.2pt; font-weight:700; color:#ffffff;">November 2026</div>
        <div style="font-size:6.8pt; color:#94a3b8; margin-top:3px; text-transform:uppercase; font-weight:600;">System Release</div>
        <div style="font-size:8.2pt; font-weight:700; color:#f59e0b;">TOSBS Portal v2.4</div>
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>1. Pre-Onboarding Readiness & Document Checklist</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Read Before Beginning</span>
  </div>
  <p class="section-subtitle">To ensure seamless onboarding in one sitting, please ensure you have the following information and documents ready on your device.</p>

  <div class="grid-2" style="margin-bottom:8px;">
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>1. Short Code & Temporary Password</strong>
        <span>Received via official HR welcome email or SMS (e.g. <code>TOSBS28</code>).</span>
      </div>
    </div>
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>2. Aadhaar & Linked Mobile Number</strong>
        <span>Required for instant Government Identity Verification via DigiLocker OTP.</span>
      </div>
    </div>
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>3. Permanent Account Number (PAN)</strong>
        <span>Your 10-character PAN card details for tax and payroll compliance.</span>
      </div>
    </div>
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>4. Academic Degree / Highest Qualification</strong>
        <span>Scanned copy or crisp photo (PDF, JPG, PNG) of final degree or mark sheet.</span>
      </div>
    </div>
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>5. Banking Proof (Cancelled Cheque / Passbook)</strong>
        <span>Clearly legible document showing your Name, Bank A/C No, and IFSC Code.</span>
      </div>
    </div>
    <div class="chk-item">
      <div class="chk-box"></div>
      <div class="chk-text">
        <strong>6. EPFO Credentials (UAN & PF Number)</strong>
        <span>Universal Account Number and previous PF Member ID (if previously employed).</span>
      </div>
    </div>
  </div>

  <div class="alert alert-info">
    <span>💡</span>
    <div>
      <strong>Browser & Hardware Requirements:</strong>
      Please complete onboarding using Google Chrome, Microsoft Edge, or Safari on a device with a <strong>functional webcam/camera</strong> and <strong>GPS location services enabled</strong>. Ensure HTTPS is enabled in the browser bar.
    </div>
  </div>

  <div class="section-title">
    <span>2. Step 0: Portal Access & Account Setup</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Authentication</span>
  </div>
  <p class="section-subtitle">Initial gateway authorization to transition your candidate record into an active employee account.</p>

  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number step-orange">Step 0</span>
        <span class="step-title">Enter Portal & Set Your Personal Password</span>
      </div>
      <span class="step-badge mandatory">Mandatory First Step</span>
    </div>
    <div class="step-body">
      <ol style="margin:0; padding-left:16px; line-height:1.45;">
        <li>Open the official portal web address provided by HR.</li>
        <li>On the landing splash screen, locate the blue card labeled <strong>Employee Portal</strong> and click <em>"Continue as Employee"</em>.</li>
        <li>Under <strong>Employee Onboarding</strong>, type your assigned <strong>Short Code</strong> (e.g., <code>TOSBS28</code>) or Invite Token into the box and click <strong>Go</strong>.</li>
        <li>The system will validate your record and open the <strong>Create Account</strong> screen with your full name pre-populated.</li>
        <li>In the form, enter:
          <ul style="margin:2px 0; padding-left:16px;">
            <li><strong>Temporary Password:</strong> The default password provided in your HR onboarding communication.</li>
            <li><strong>Create Your Own Password:</strong> Enter a strong, private password known only to you.</li>
            <li><strong>Confirm Your Password:</strong> Re-enter the exact same password.</li>
          </ul>
        </li>
        <li>Click <strong>Set Password & Continue</strong>. You will immediately enter the 7-Step Onboarding Wizard.</li>
      </ol>
      <div class="alert alert-warning" style="margin-top:6px;">
        <span>⚠️</span>
        <div>
          <strong>Note for Future Sign-Ins:</strong> Once registered, you will log into the Employee Portal using your official work email and your new password under <em>"Already registered? Log back in"</em>. Keep your password confidential!
        </div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>TOSBS Employee Onboarding Guide &bull; Confidential & Proprietary</span>
    <span>Page 1 of 4</span>
  </div>
</div>

<!-- ================= PAGE 2 ================= -->
<div class="page">
  <div class="doc-header">
    <div class="brand-box">
      ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="TOSBS Logo" />` : ''}
      <div class="brand-text">
        <h1>The Other Side Business Services</h1>
        <p>INTERNAL WORKSPACES &bull; HR OPERATIONS MANUAL</p>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Process Execution</div>
      <div class="val">Steps 1 Through 3</div>
    </div>
  </div>

  <div class="section-title">
    <span>3. Onboarding Wizard: Steps 1 Through 3</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Profile & Location</span>
  </div>

  <!-- STEP 1 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 1</span>
        <span class="step-title">Personal, Residential & Family Details</span>
      </div>
      <span class="step-badge mandatory">Profile Setup</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 6px 0;">Accurately enter your demographic details. This data updates your central HR profile and tax records automatically.</p>
      
      <div class="grid-3" style="margin-bottom:6px;">
        <div class="kv-item"><div class="kv-label">Phone & Email</div><div class="kv-value">Mobile No. & Personal Email</div></div>
        <div class="kv-item"><div class="kv-label">Date of Birth & Gender</div><div class="kv-value">Matches Official ID Records</div></div>
        <div class="kv-item"><div class="kv-label">Date of Joining (DOJ)</div><div class="kv-value">Official HR Assigned (Locked)</div></div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:25%;">Section</th>
            <th>Required Fields & Operational Guidance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Permanent Address</strong></td>
            <td>Enter your legal permanent hometown address as printed on government documents.</td>
          </tr>
          <tr>
            <td><strong>Current Address & Map Geocoding</strong></td>
            <td>Start typing your residential street or building name. <strong>Select your address from the dropdown list</strong>. This locks the precise coordinates for map verification in Step 3.</td>
          </tr>
          <tr>
            <td><strong>Family Details</strong></td>
            <td>Enter Father's Name & DOB, Mother's Name & DOB, Marital Status (Single / Married / Divorced). If married, enter Spouse Name & DOB. If you have children, select count and enter their names & DOBs.</td>
          </tr>
          <tr>
            <td><strong>Emergency Contacts</strong></td>
            <td>Provide two distinct emergency phone numbers (e.g. parent, spouse, sibling) reachable in case of an urgent event.</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:5px; font-size:7.5pt; color:#64748b; text-align:right;">
        <em>Click <strong>Next →</strong> to automatically sync and save all Step 1 details.</em>
      </div>
    </div>
  </div>

  <!-- STEP 2 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 2</span>
        <span class="step-title">Education & Employment History</span>
      </div>
      <span class="step-badge verified">Academic & Career</span>
    </div>
    <div class="step-body">
      <div class="grid-2">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:6px 8px;">
          <strong style="color:#0f1f3d; font-size:8pt;">Academic Credentials:</strong>
          <p style="margin:2px 0 4px 0; font-size:7.5pt; color:#475569;">Click <strong>+ Add Education</strong> to add your degrees:</p>
          <ul style="margin:0; padding-left:14px; font-size:7.5pt; color:#475569;">
            <li><strong>Degree:</strong> e.g. B.Tech / MBA / B.Com / Diploma</li>
            <li><strong>Institution:</strong> College / University Name</li>
            <li><strong>Year:</strong> Year of graduation (e.g. 2023)</li>
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:6px 8px;">
          <strong style="color:#0f1f3d; font-size:8pt;">Previous Employment:</strong>
          <p style="margin:2px 0 4px 0; font-size:7.5pt; color:#475569;">Click <strong>+ Add Employment</strong> for past companies:</p>
          <ul style="margin:0; padding-left:14px; font-size:7.5pt; color:#475569;">
            <li><strong>Company Name:</strong> Former employer title</li>
            <li><strong>Designation / Role:</strong> Official job title held</li>
            <li><strong>Start & End Dates:</strong> Duration of tenure</li>
          </ul>
          <span style="font-size:7pt; color:#94a3b8;">*Freshers may leave the employment section blank.</span>
        </div>
      </div>
      <div style="margin-top:6px; font-size:7.5pt; color:#64748b; text-align:right;">
        <em>Click <strong>Next →</strong> to proceed to location verification.</em>
      </div>
    </div>
  </div>

  <!-- STEP 3 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 3</span>
        <span class="step-title">Residential Address & GPS Location Verification</span>
      </div>
      <span class="step-badge mandatory">GPS Geofencing</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 5px 0;">TOSBS verifies candidate residency to ensure regional assignment compliance and office proximity.</p>
      
      <div class="grid-2">
        <div style="border:1px solid #e2e8f0; border-radius:5px; padding:6px 8px; background:#fdfbf7;">
          <strong style="font-size:7.8pt; color:#c8922a; text-transform:uppercase;">Standard In-City Verification:</strong>
          <ol style="margin:3px 0 0 0; padding-left:14px; font-size:7.5pt; color:#334155;">
            <li>Review the map pin showing your Step 1 address.</li>
            <li>Click <strong>📍 Verify My Location via GPS</strong>.</li>
            <li>Browser popup: Select <strong>"Allow"</strong> for location.</li>
            <li>System cross-checks GPS vs. address (limit: 15km).</li>
            <li>A green badge appears: <em>"Location Verified ✓"</em>.</li>
          </ol>
        </div>
        <div style="border:1px solid #e2e8f0; border-radius:5px; padding:6px 8px; background:#f8fafc;">
          <strong style="font-size:7.8pt; color:#475569; text-transform:uppercase;">Remote Worker / Localhost Exemption:</strong>
          <p style="margin:3px 0 0 0; font-size:7.5pt; color:#64748b; line-height:1.4;">
            If you are hired as a permanent remote worker located in another state, or testing over an unencrypted connection, click:
            <br>
            <span style="color:#d97706; font-weight:600; text-decoration:underline;">"Skip — Testing on localhost / Remote Worker"</span>.
            <br>
            HR will manually confirm your residency records.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>TOSBS Employee Onboarding Guide &bull; Confidential & Proprietary</span>
    <span>Page 2 of 4</span>
  </div>
</div>

<!-- ================= PAGE 3 ================= -->
<div class="page">
  <div class="doc-header">
    <div class="brand-box">
      ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="TOSBS Logo" />` : ''}
      <div class="brand-text">
        <h1>The Other Side Business Services</h1>
        <p>INTERNAL WORKSPACES &bull; HR OPERATIONS MANUAL</p>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Process Execution</div>
      <div class="val">Steps 4 Through 6</div>
    </div>
  </div>

  <div class="section-title">
    <span>4. Onboarding Wizard: Steps 4 Through 6</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Identity & Documents</span>
  </div>

  <!-- STEP 4 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 4</span>
        <span class="step-title">Government Identity Verification (DigiLocker Integration)</span>
      </div>
      <span class="step-badge mandatory">Statutory Aadhaar/PAN</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 5px 0;">Official statutory identity verification is executed directly via the Government of India's DigiLocker API gateway.</p>
      
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:5px; padding:8px; margin-bottom:6px;">
        <strong style="color:#166534; font-size:8pt;">Execution Procedure:</strong>
        <ol style="margin:3px 0 0 0; padding-left:16px; font-size:7.5pt; color:#14532d; line-height:1.45;">
          <li>Click the blue button labeled <strong>"Verify with DigiLocker"</strong>.</li>
          <li>You will be redirected securely to the DigiLocker Government Gateway portal.</li>
          <li>Enter your <strong>12-digit Aadhaar Number</strong> and submit.</li>
          <li>Enter the <strong>6-digit OTP</strong> sent to your Aadhaar-registered mobile phone.</li>
          <li>Authorize consent to share verified credentials with TOSBS.</li>
          <li>Upon redirect, your verified <strong>Name on Aadhaar</strong> and <strong>Masked Aadhaar Number</strong> will appear in green.</li>
        </ol>
      </div>
      <div class="alert alert-warning" style="margin:0;">
        <span>ℹ️</span>
        <div>
          <strong>DigiLocker Technical Contingency:</strong> If the government DigiLocker portal is temporarily undergoing UIDAI server maintenance or OTP delays, click <em>"Skip — DigiLocker verification pending activation"</em>. HR will conduct offline Aadhaar verification.
        </div>
      </div>
    </div>
  </div>

  <!-- STEP 5 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 5</span>
        <span class="step-title">Live Selfie & Facial Verification</span>
      </div>
      <span class="step-badge mandatory">Biometric Authentication</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 5px 0;">To eliminate proxy registrations and secure internal systems, each employee must capture a live webcam photo.</p>
      
      <div class="grid-2">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:6px 8px;">
          <strong style="color:#0f1f3d; font-size:8pt;">How to Capture:</strong>
          <ol style="margin:3px 0 0 0; padding-left:14px; font-size:7.5pt; color:#334155; line-height:1.45;">
            <li>Click <strong>"Open Camera"</strong> and grant camera permission.</li>
            <li>Align your face comfortably inside the <strong>golden oval guide</strong> on the screen.</li>
            <li>Ensure proper room lighting facing you. Remove dark sunglasses, masks, or hats.</li>
            <li>Click <strong>"📸 Take Photo"</strong>.</li>
            <li>Review the snapshot. If blurry, click <em>"Retake Photo"</em>. Once crisp, click <strong>Next →</strong>.</li>
          </ol>
        </div>
        <div style="background:#fdfbf7; border:1px solid #f1ddb5; border-radius:5px; padding:6px 8px;">
          <strong style="color:#c8922a; font-size:8pt;">HR Review & Storage:</strong>
          <p style="margin:3px 0 0 0; font-size:7.5pt; color:#78350f; line-height:1.4;">
            Your live selfie is securely encrypted and stored under your employee document vault. During final onboarding sign-off, HR compares this image directly against your DigiLocker Aadhaar photo to issue formal approval.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- STEP 6 -->
  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number">Step 6</span>
        <span class="step-title">Banking Details & Document Uploads</span>
      </div>
      <span class="step-badge mandatory">Payroll & Compliance</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 5px 0;">Mandatory financial repository required for salary bank transfers, PF deductions, and audit records.</p>
      
      <div class="grid-3" style="margin-bottom:6px;">
        <div class="kv-item"><div class="kv-label">Bank Name & A/C Number</div><div class="kv-value">Active Savings / Salary Account</div></div>
        <div class="kv-item"><div class="kv-label">IFSC Code & Branch</div><div class="kv-value">11-Digit Standard IFSC Code</div></div>
        <div class="kv-item"><div class="kv-label">UAN & PF Number</div><div class="kv-value">For Provident Fund Credits</div></div>
      </div>

      <div class="grid-2">
        <div style="border:1px dashed #cbd5e1; border-radius:5px; padding:6px 8px; background:#f8fafc;">
          <strong style="color:#0f1f3d; font-size:8pt;">1. Degree Certificate (PDF / Image)</strong>
          <p style="margin:2px 0 0 0; font-size:7.5pt; color:#64748b;">Upload your graduation certificate or final grade card. Supported: .pdf, .jpg, .png (Max: 10MB).</p>
        </div>
        <div style="border:1px dashed #cbd5e1; border-radius:5px; padding:6px 8px; background:#f8fafc;">
          <strong style="color:#0f1f3d; font-size:8pt;">2. Bank Proof (Cancelled Cheque / Passbook)</strong>
          <p style="margin:2px 0 0 0; font-size:7.5pt; color:#64748b;">Upload a clear photograph of a cancelled cheque or passbook front page showing name & account number.</p>
        </div>
      </div>
      <div style="margin-top:5px; font-size:7.5pt; color:#166534; font-weight:600;">
        ✓ A green checkmark confirms each file upload was stored successfully in your cloud folder.
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>TOSBS Employee Onboarding Guide &bull; Confidential & Proprietary</span>
    <span>Page 3 of 4</span>
  </div>
</div>

<!-- ================= PAGE 4 ================= -->
<div class="page">
  <div class="doc-header">
    <div class="brand-box">
      ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="TOSBS Logo" />` : ''}
      <div class="brand-text">
        <h1>The Other Side Business Services</h1>
        <p>INTERNAL WORKSPACES &bull; HR OPERATIONS MANUAL</p>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Final Sign-Off</div>
      <div class="val">Step 7 & Active Workspaces</div>
    </div>
  </div>

  <div class="section-title">
    <span>5. Step 7: Employee Self-Declaration & Digital Sign-off</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Legal Binding</span>
  </div>

  <div class="step-container">
    <div class="step-header">
      <div style="display:flex; align-items:center;">
        <span class="step-number step-orange">Step 7</span>
        <span class="step-title">Legal Undertakings & Final Submission</span>
      </div>
      <span class="step-badge mandatory">Statutory Legal Form</span>
    </div>
    <div class="step-body">
      <p style="margin:0 0 6px 0; font-size:8pt;">Review the 6 core company clauses. <strong>Type your initials (e.g. <code>A.K.</code>)</strong> in each designated box:</p>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:28%;">Clause</th>
            <th>Summary of Legal Undertaking</th>
            <th style="width:16%;">Action Required</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Authenticity of Records</strong></td>
            <td>Affirming all submitted certificates, identities, and historical dates are genuine and unmanipulated.</td>
            <td>Enter Initials</td>
          </tr>
          <tr>
            <td><strong>2. Conflict of Interest</strong></td>
            <td>Confirming you hold no conflicting secondary employment or competing commercial interests. (If yes, disclose details).</td>
            <td>Select No Conflict / Declare Potential</td>
          </tr>
          <tr>
            <td><strong>3. Confidentiality & NDA</strong></td>
            <td>Pledging non-disclosure of TOSBS trade secrets, proprietary workflows, customer databases, and codebase.</td>
            <td>Enter Initials</td>
          </tr>
          <tr>
            <td><strong>4. Code of Conduct & Policies</strong></td>
            <td>Agreeing to abide by the TOSBS Employee Handbook, IT usage policies, and professional workplace standards.</td>
            <td>Enter Initials</td>
          </tr>
          <tr>
            <td><strong>5. Medical & Fitness</strong></td>
            <td>Confirming physical and mental fitness to fulfill standard duties of your appointed role.</td>
            <td>Enter Initials</td>
          </tr>
          <tr>
            <td><strong>6. Final Sign-Off & Place</strong></td>
            <td>Enter signing City/Place, review automated date, and check the confirmation box: <em>"I hereby confirm all declarations made above are true..."</em></td>
            <td>Enter Place & Checkbox</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1px solid #bbf7d0; padding:6px 10px; border-radius:5px;">
        <div style="font-size:8pt; color:#14532d;">
          Ready to finish? Click the primary green button: <strong>Submit Onboarding ✓</strong>
        </div>
        <div style="background:#15803d; color:#ffffff; font-size:7.5pt; font-weight:700; padding:3px 8px; border-radius:4px;">
          Submission Ready
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>6. Post-Submission: Your Active Employee Dashboard</span>
    <span style="font-size:7.5pt; font-weight:600; color:#c8922a;">Day 1 Onwards</span>
  </div>
  <p class="section-subtitle">Upon submission, your profile unlocks instant access to your daily operational workspace:</p>

  <div class="grid-4" style="margin-bottom:8px;">
    <div class="card" style="margin-bottom:0; padding:6px 8px;">
      <strong style="color:#0f1f3d; font-size:8pt;">📍 Attendance</strong>
      <p style="margin:2px 0 0 0; font-size:7.2pt; color:#64748b;">Daily Check-In & Check-Out with selfie capture and office geofencing (100m) or WFH requests.</p>
    </div>
    <div class="card" style="margin-bottom:0; padding:6px 8px;">
      <strong style="color:#0f1f3d; font-size:8pt;">📅 Leave Center</strong>
      <p style="margin:2px 0 0 0; font-size:7.2pt; color:#64748b;">Apply for paid leave, view balances, sandwich rule audits, and approved holidays.</p>
    </div>
    <div class="card" style="margin-bottom:0; padding:6px 8px;">
      <strong style="color:#0f1f3d; font-size:8pt;">💰 Salary & Payslips</strong>
      <p style="margin:2px 0 0 0; font-size:7.2pt; color:#64748b;">Monthly CTC, earnings, standard deductions, PF, TDS breakdown, and 1-click PDF payslips.</p>
    </div>
    <div class="card" style="margin-bottom:0; padding:6px 8px;">
      <strong style="color:#0f1f3d; font-size:8pt;">📋 Tasks & Letters</strong>
      <p style="margin:2px 0 0 0; font-size:7.2pt; color:#64748b;">Assigned deliverables, performance scorecards, and stamped Offer / Relieving Letters.</p>
    </div>
  </div>

  <div class="section-title">
    <span>7. HR Helpdesk & Support Directory</span>
  </div>
  <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px;">
    <div style="font-size:7.5pt; color:#334155; line-height:1.45;">
      <strong>Have questions or facing technical hurdles?</strong><br>
      HR Operations Desk: <span style="color:#0f1f3d; font-weight:600;">hr@tosbs.com</span> | Technical Team: <span style="color:#0f1f3d; font-weight:600;">support@tosbs.com</span><br>
      The Other Side Business Services &bull; Corporate Human Resources &bull; Pune, Maharashtra
    </div>
    <div style="text-align:right;">
      ${stampBase64 ? `<img src="${stampBase64}" style="height:42px; object-fit:contain; opacity:0.85;" alt="TOSBS Stamp" />` : ''}
    </div>
  </div>

  <div class="doc-footer">
    <span>TOSBS Employee Onboarding Guide &bull; Confidential & Proprietary</span>
    <span>Page 4 of 4</span>
  </div>
</div>

</body>
</html>`;

const htmlFilePath = path.join(projectDir, 'onboarding_guide.html');
const pdfOutputPath = path.join(projectDir, 'TOSBS_Employee_Onboarding_Guide.pdf');
const publicPdfPath = path.join(projectDir, 'public', 'TOSBS_Employee_Onboarding_Guide.pdf');
const artifactPdfPath = 'C:\\Users\\Aryan Kamdar\\.gemini\\antigravity\\brain\\235b0cff-a0b7-47b1-bee3-56f79abaad24\\TOSBS_Employee_Onboarding_Guide.pdf';

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('HTML written successfully to:', htmlFilePath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlUrl = `file:///${htmlFilePath.replace(/\\/g, '/')}`;

console.log('Executing Edge headless to generate PDF...');
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + pdfOutputPath,
  htmlUrl
];

execFileSync(edgePath, args, { stdio: 'inherit' });

if (fs.existsSync(pdfOutputPath)) {
  const stats = fs.statSync(pdfOutputPath);
  console.log(`PDF generated successfully: ${pdfOutputPath} (${stats.size} bytes)`);

  // Verify page count
  const pdfData = fs.readFileSync(pdfOutputPath, 'utf8');
  const count = (pdfData.match(/\/Type\s*\/Page\b/g) || []).length;
  console.log(`Verified total page count: ${count}`);

  // Copy to public/
  fs.copyFileSync(pdfOutputPath, publicPdfPath);
  console.log(`Copied to: ${publicPdfPath}`);

  // Copy to artifacts dir
  fs.copyFileSync(pdfOutputPath, artifactPdfPath);
  console.log(`Copied to: ${artifactPdfPath}`);
} else {
  console.error('PDF file was not found at expected path:', pdfOutputPath);
}
