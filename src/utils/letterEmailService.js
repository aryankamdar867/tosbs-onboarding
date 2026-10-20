/**
 * letterEmailService.js
 * Dedicated Resend integration for sending official TOSBS Offer Letters,
 * Relieving Letters, Experience Letters, and Resignation Acceptance Letters directly to employees.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Low-level Resend email dispatcher
 */
export const sendResendEmail = async ({ to, subject, html, from = null, replyTo = null }) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Resend API key is missing. Please set VITE_RESEND_API_KEY in .env.' };
  }

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid or missing recipient email address.' };
  }

  const senderEmail = from || import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const payload = {
      from: senderEmail,
      to: [to.trim()],
      subject: subject,
      html: html,
    };

    if (replyTo || import.meta.env.VITE_HR_EMAIL) {
      payload.reply_to = replyTo || import.meta.env.VITE_HR_EMAIL;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || data?.error?.message || `Resend HTTP error ${response.status}`;
      return { success: false, error: errorMsg, data };
    }

    return { success: true, data };
  } catch (err) {
    console.error('sendResendEmail error:', err);
    return { success: false, error: err.message || 'Network error while sending email.' };
  }
};

/* -------------------------------------------------------------
 * HTML EMAIL TEMPLATES (TOSBS EXECUTIVE BRANDING)
 * ----------------------------------------------------------- */

const emailHeaderHtml = (title, subtitle = 'The Other Side Business Services') => `
  <div style="background: linear-gradient(135deg, #0a1628 0%, #152744 100%); padding: 32px 28px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #c8922a; text-align: center;">
    <div style="display: inline-block; background: #ffffff; padding: 8px 18px; border-radius: 8px; margin-bottom: 14px;">
      <span style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 0.15em; color: #0a1628;">TOSBS</span>
    </div>
    <h1 style="color: #f8fafc; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.03em; font-family: 'Helvetica Neue', Arial, sans-serif;">
      ${title}
    </h1>
    <p style="color: #c8922a; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
      ${subtitle}
    </p>
  </div>
`;

const emailFooterHtml = () => `
  <div style="background: #0f172a; padding: 22px 28px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08);">
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px 0; font-family: Arial, sans-serif;">
      <strong>The Other Side Business Services</strong> • Human Resources Management
    </p>
    <p style="color: #64748b; font-size: 11px; margin: 0; font-family: Arial, sans-serif;">
      This is an official confidential communication. If you received this in error, please notify HR immediately.
    </p>
  </div>
`;

/**
 * 1. Generate HTML for Offer Letter
 */
export const generateOfferLetterEmailHtml = ({ employee, offerData }) => {
  const name = offerData?.fullName || offerData?.candidateName || employee?.full_name || 'Candidate';
  const designation = offerData?.designation || employee?.position || 'Associate';
  const department = offerData?.department || employee?.department || 'Operations';
  const candidateCode = offerData?.candidateCode || employee?.short_code || 'TOSBS';
  const joiningDate = offerData?.joiningDate || employee?.date_of_joining || 'As discussed';
  const location = offerData?.location || 'Pune, India';
  const reportingTo = offerData?.reportingTo || 'Amar Talwar';
  const probation = offerData?.probationPeriod || '3 months';

  const annualCtc = Number(offerData?.annualCtc) || (Number(offerData?.monthlyCtc) ? Number(offerData.monthlyCtc) * 12 : 600000);
  const monthlyCtc = Number(offerData?.monthlyCtc) || Math.round(annualCtc / 12);

  const formattedAnnual = annualCtc.toLocaleString('en-IN');
  const formattedMonthly = monthlyCtc.toLocaleString('en-IN');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f1f5f9; padding: 20px 10px;">
      <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
        ${emailHeaderHtml('Appointment cum Offer of Employment')}
        
        <div style="padding: 32px 30px; color: #1e293b; line-height: 1.65; font-size: 14.5px;">
          <p style="margin: 0 0 18px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            Dear ${name},
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            Following your recent interview and discussions with us, we are delighted to extend this formal offer of employment to join <strong>The Other Side Business Services</strong> as <strong>${designation}</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #c8922a; font-weight: 800;">
              Key Appointment Terms
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 7px 0; color: #64748b; width: 160px; font-weight: 600;">Employee / Candidate Code</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${candidateCode}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Designation</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${designation}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Department</td>
                <td style="padding: 7px 0; color: #0f172a;">${department}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Date of Joining</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700; color: #0284c7;">${joiningDate}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Work Location</td>
                <td style="padding: 7px 0; color: #0f172a;">${location}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Reporting To</td>
                <td style="padding: 7px 0; color: #0f172a;">${reportingTo}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Probation Period</td>
                <td style="padding: 7px 0; color: #0f172a;">${probation}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 9px 0; color: #64748b; font-weight: 700;">Total Fixed CTC</td>
                <td style="padding: 9px 0; color: #c8922a; font-weight: 800; font-size: 16px;">
                  ₹${formattedAnnual} per annum <span style="font-size: 12px; color: #64748b; font-weight: 500;">(₹${formattedMonthly}/month)</span>
                </td>
              </tr>
            </table>
          </div>

          <p style="margin: 0 0 20px 0; color: #334155;">
            Your full formal appointment letter with detailed compensation Annexure-A, confidentiality covenants, code of conduct, and terms of service has been officially published to your TOSBS Employee Portal.
          </p>

          <div style="background: #fefce8; border-left: 4px solid #c8922a; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #854d0e; font-size: 13.5px; font-weight: 600;">
              ℹ️ Please log in to your TOSBS Onboarding & Employee Portal to review, accept, or print your official stamped & signed Offer Letter document.
            </p>
          </div>

          <p style="margin: 0 0 6px 0; color: #334155;">
            We look forward to welcoming you aboard and building great milestones together!
          </p>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: 700; color: #0f172a;">HR Administration</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">The Other Side Business Services</p>
          </div>
        </div>

        ${emailFooterHtml()}
      </div>
    </div>
  `;
};

/**
 * 2. Generate HTML for Relieving Letter
 */
export const generateRelievingLetterEmailHtml = ({ employee, letterData }) => {
  const name = letterData?.fullName || letterData?.employeeName || employee?.full_name || 'Employee';
  const designation = letterData?.designation || letterData?.position || employee?.position || 'Associate';
  const department = letterData?.department || employee?.department || 'Operations';
  const candidateCode = letterData?.candidateCode || letterData?.employeeCode || employee?.short_code || 'TOSBS';
  const joiningDate = letterData?.joiningDate || employee?.date_of_joining || '—';
  const lastWorkingDay = letterData?.lastWorkingDay || employee?.notice_end_date || new Date().toLocaleDateString('en-GB');
  const resignationDate = letterData?.resignationDate || employee?.resignation_date || '—';
  const pronoun = letterData?.pronoun || (employee?.gender === 'male' ? 'He' : 'She');
  const posPronoun = pronoun === 'He' ? 'his' : 'her';

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f1f5f9; padding: 20px 10px;">
      <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
        ${emailHeaderHtml('Official Relieving Letter')}
        
        <div style="padding: 32px 30px; color: #1e293b; line-height: 1.65; font-size: 14.5px;">
          <p style="margin: 0 0 18px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            Dear ${name},
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            With reference to your resignation from the services of <strong>The Other Side Business Services</strong>, this is to formally certify that you have been officially relieved from your duties and responsibilities as <strong>${designation}</strong> effective from the close of business hours on <strong>${lastWorkingDay}</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #c8922a; font-weight: 800;">
              Service & Relieving Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 7px 0; color: #64748b; width: 160px; font-weight: 600;">Employee Code</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${candidateCode}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Designation</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${designation}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Department</td>
                <td style="padding: 7px 0; color: #0f172a;">${department}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Date of Joining</td>
                <td style="padding: 7px 0; color: #0f172a;">${joiningDate}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Resignation Date</td>
                <td style="padding: 7px 0; color: #0f172a;">${resignationDate}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Last Working Day</td>
                <td style="padding: 7px 0; color: #c8922a; font-weight: 800; font-size: 15px;">${lastWorkingDay}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Clearance & Settlement</td>
                <td style="padding: 7px 0; color: #16a34a; font-weight: 700;">Complete / No Dues Pending</td>
              </tr>
            </table>
          </div>

          <p style="margin: 0 0 16px 0; color: #334155;">
            We confirm that during ${posPronoun} tenure, ${posPronoun} conduct and character were found satisfactory. All company assets and departmental clearances have been duly verified.
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            We take this opportunity to thank you for your contributions to The Other Side Business Services and wish you every success in all your future professional endeavors.
          </p>

          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #15803d; font-size: 13.5px; font-weight: 600;">
              📄 Your official signed & stamped Relieving Letter PDF is available in your TOSBS portal under Relieving Letters.
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: 700; color: #0f172a;">Manager – Human Resources</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">The Other Side Business Services</p>
          </div>
        </div>

        ${emailFooterHtml()}
      </div>
    </div>
  `;
};

/**
 * 3. Generate HTML for Experience Letter
 */
export const generateExperienceLetterEmailHtml = ({ employee, letterData }) => {
  const name = letterData?.fullName || letterData?.employeeName || employee?.full_name || 'Employee';
  const designation = letterData?.designation || letterData?.position || employee?.position || 'Associate';
  const candidateCode = letterData?.candidateCode || letterData?.employeeCode || employee?.short_code || 'TOSBS';
  const joiningDate = letterData?.joiningDate || employee?.date_of_joining || '—';
  const lastWorkingDay = letterData?.lastWorkingDay || employee?.notice_end_date || new Date().toLocaleDateString('en-GB');
  const pronoun = letterData?.pronoun || (employee?.gender === 'male' ? 'He' : 'She');
  const posPronoun = pronoun === 'He' ? 'his' : 'her';

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f1f5f9; padding: 20px 10px;">
      <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
        ${emailHeaderHtml('Service & Experience Certificate')}
        
        <div style="padding: 32px 30px; color: #1e293b; line-height: 1.65; font-size: 14.5px;">
          <p style="margin: 0 0 18px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            To Whom It May Concern,
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            This is to certify that <strong>${name}</strong> (Employee Code: <strong>${candidateCode}</strong>) was employed with <strong>The Other Side Business Services</strong> as <strong>${designation}</strong> from <strong>${joiningDate}</strong> to <strong>${lastWorkingDay}</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #c8922a; font-weight: 800;">
              Service Details
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 7px 0; color: #64748b; width: 160px; font-weight: 600;">Employee Name</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${name}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Employee Code</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${candidateCode}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Designation</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${designation}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Period of Service</td>
                <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${joiningDate} to ${lastWorkingDay}</td>
              </tr>
            </table>
          </div>

          <p style="margin: 0 0 16px 0; color: #334155;">
            During ${posPronoun} tenure with us, ${pronoun.toLowerCase()} demonstrated diligent commitment, professional integrity, and sound technical competence. ${pronoun} maintained cordial working relationships with peers and leadership throughout.
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            We wish ${name} continued growth, success, and prosperity in all future career undertakings.
          </p>

          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #15803d; font-size: 13.5px; font-weight: 600;">
              📄 Your official Experience Certificate PDF has been archived in your TOSBS portal for printing and download.
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: 700; color: #0f172a;">Manager – Human Resources</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">The Other Side Business Services</p>
          </div>
        </div>

        ${emailFooterHtml()}
      </div>
    </div>
  `;
};

/**
 * 4. Generate HTML for Resignation Acceptance & Notice Period Letter
 */
export const generateResignationAcceptanceEmailHtml = ({ employee, resignationData }) => {
  const name = employee?.full_name || resignationData?.profiles?.full_name || 'Employee';
  const designation = employee?.position || resignationData?.profiles?.position || 'Associate';
  const noticeDays = resignationData?.notice_period_days !== undefined ? Number(resignationData.notice_period_days) : 30;
  const startDate = resignationData?.notice_start_date || new Date().toISOString().split('T')[0];
  const endDate = resignationData?.notice_end_date || '—';
  const hrNote = resignationData?.hr_note || '';

  const isImmediate = noticeDays === 0;

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f1f5f9; padding: 20px 10px;">
      <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
        ${emailHeaderHtml('Resignation Acceptance & Notice Period', 'Formal Notice Acknowledgement')}
        
        <div style="padding: 32px 30px; color: #1e293b; line-height: 1.65; font-size: 14.5px;">
          <p style="margin: 0 0 18px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            Dear ${name},
          </p>

          <p style="margin: 0 0 20px 0; color: #334155;">
            We acknowledge receipt of your resignation notice from your position as <strong>${designation}</strong> at <strong>The Other Side Business Services</strong>. We confirm that management has formally accepted your resignation.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #c8922a; font-weight: 800;">
              Notice Period & Exit Schedule
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 7px 0; color: #64748b; width: 170px; font-weight: 600;">Notice Period Duration</td>
                <td style="padding: 7px 0; color: ${isImmediate ? '#dc2626' : '#c8922a'}; font-weight: 700;">
                  ${isImmediate ? '⚡ Immediate Exit (0 Days Notice)' : `${noticeDays} Days`}
                </td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Notice Start Date</td>
                <td style="padding: 7px 0; color: #0f172a;">${startDate}</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Official Last Working Day</td>
                <td style="padding: 7px 0; color: #c8922a; font-weight: 800; font-size: 15px;">${endDate}</td>
              </tr>
              ${hrNote ? `
                <tr style="border-top: 1px solid #f1f5f9;">
                  <td style="padding: 7px 0; color: #64748b; font-weight: 600;">HR Instructions / Notes</td>
                  <td style="padding: 7px 0; color: #334155; font-style: italic;">"${hrNote}"</td>
                </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13.5px; color: #1e40af; font-weight: 700;">
              📋 Handover & Transition Guidelines
            </h4>
            <ul style="margin: 0; padding-left: 18px; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
              <li>Please coordinate with your manager to complete pending deliverable handovers and project transitions.</li>
              <li>Return all company assets, login credentials, and documentation before your last working day.</li>
              <li>Daily attendance check-ins will continue to record compensation calculations until your last working day.</li>
              <li>Your formal Relieving and Experience letters will be issued following clearance confirmation.</li>
            </ul>
          </div>

          <p style="margin: 0 0 20px 0; color: #334155;">
            If you have questions regarding the notice period, final clearance, or transition schedule, feel free to contact HR.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: 700; color: #0f172a;">HR Administration</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">The Other Side Business Services</p>
          </div>
        </div>

        ${emailFooterHtml()}
      </div>
    </div>
  `;
};

/* -------------------------------------------------------------
 * HIGH-LEVEL SENDER FUNCTIONS
 * ----------------------------------------------------------- */

/**
 * Send Offer Letter Email
 */
export const sendOfferLetterEmail = async (employee, offerData) => {
  const to = employee?.email || offerData?.email;
  if (!to) {
    return { success: false, error: 'Employee has no email address on file.' };
  }

  const name = offerData?.fullName || employee?.full_name || 'Candidate';
  const html = generateOfferLetterEmailHtml({ employee, offerData });

  return await sendResendEmail({
    to,
    subject: `Offer of Employment — The Other Side Business Services (${name})`,
    html,
  });
};

/**
 * Send Relieving Letter Email
 */
export const sendRelievingLetterEmail = async (employee, letterData) => {
  const to = employee?.email || letterData?.email;
  if (!to) {
    return { success: false, error: 'Employee has no email address on file.' };
  }

  const name = letterData?.fullName || employee?.full_name || 'Employee';
  const html = generateRelievingLetterEmailHtml({ employee, letterData });

  return await sendResendEmail({
    to,
    subject: `Official Relieving Letter — The Other Side Business Services (${name})`,
    html,
  });
};

/**
 * Send Experience Letter Email
 */
export const sendExperienceLetterEmail = async (employee, letterData) => {
  const to = employee?.email || letterData?.email;
  if (!to) {
    return { success: false, error: 'Employee has no email address on file.' };
  }

  const name = letterData?.fullName || employee?.full_name || 'Employee';
  const html = generateExperienceLetterEmailHtml({ employee, letterData });

  return await sendResendEmail({
    to,
    subject: `Service Experience Certificate — The Other Side Business Services (${name})`,
    html,
  });
};

/**
 * Send Resignation Acceptance Email
 */
export const sendResignationAcceptanceEmail = async (employee, resignationData) => {
  const to = employee?.email || resignationData?.profiles?.email;
  if (!to) {
    return { success: false, error: 'Employee has no email address on file.' };
  }

  const name = employee?.full_name || resignationData?.profiles?.full_name || 'Employee';
  const html = generateResignationAcceptanceEmailHtml({ employee, resignationData });

  return await sendResendEmail({
    to,
    subject: `Resignation Acceptance & Notice Period Details — TOSBS (${name})`,
    html,
  });
};
