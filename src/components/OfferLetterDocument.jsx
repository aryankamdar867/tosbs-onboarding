import React from 'react';
import { numberToWordsIndian } from '../utils/numberToWords';

export const OfferLetterDocument = ({ data, id = 'tosbs-offer-letter-doc' }) => {
  if (!data) return null;

  const candidateCode = data.candidateCode || data.candidate_code || 'TOSBS01';
  const fullName = data.fullName || data.candidateName || data.full_name || 'Employee Name';
  const designation = data.designation || data.position || 'Software Engineer';
  const department = data.department || 'Operations';
  const joiningDate = data.joiningDate || data.date_of_joining || '2026-10-01';
  const location = data.location || data.workLocation || 'Pune';
  const reportingTo = data.reportingTo || data.reportingManager || 'Amar Talwar';
  const annualCtc = data.annualCtc || (data.monthlyCtc ? data.monthlyCtc * 12 : 600000);
  const monthlyCtc = data.monthlyCtc || Math.round(annualCtc / 12);
  const letterDate = data.letterDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/ /g, '.');
  const salaryBreakdown = data.salaryBreakdown || null;

  const monthlyVal = Math.round(Number(monthlyCtc) || Math.round(Number(annualCtc) / 12) || 0);
  const annualVal = Math.round(Number(annualCtc) || monthlyVal * 12 || 0);

  const monthlyWords = numberToWordsIndian(monthlyVal);
  const annualWords = numberToWordsIndian(annualVal);

  const basicMonthly = salaryBreakdown?.basicMonthly || Math.round(monthlyVal * 0.50);
  const basicAnnual = salaryBreakdown?.basicAnnual || (basicMonthly * 12);

  const hraMonthly = salaryBreakdown?.hraMonthly || Math.round(basicMonthly * 0.50);
  const hraAnnual = salaryBreakdown?.hraAnnual || (hraMonthly * 12);

  const convMonthly = salaryBreakdown?.convMonthly !== undefined ? salaryBreakdown.convMonthly : (monthlyVal >= 25000 ? 960 : Math.round(monthlyVal * 0.02));
  const convAnnual = salaryBreakdown?.convAnnual !== undefined ? salaryBreakdown.convAnnual : (convMonthly * 12);

  const medMonthly = salaryBreakdown?.medMonthly !== undefined ? salaryBreakdown.medMonthly : (monthlyVal >= 25000 ? 750 : Math.round(monthlyVal * 0.015));
  const medAnnual = salaryBreakdown?.medAnnual !== undefined ? salaryBreakdown.medAnnual : (medMonthly * 12);

  const specialMonthly = salaryBreakdown?.specialMonthly !== undefined ? salaryBreakdown.specialMonthly : Math.max(0, monthlyVal - basicMonthly - hraMonthly - convMonthly - medMonthly);
  const specialAnnual = salaryBreakdown?.specialAnnual !== undefined ? salaryBreakdown.specialAnnual : (specialMonthly * 12);

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN');

  const formattedJoiningDate = (() => {
    try {
      if (!joiningDate) return 'Immediate';
      const d = new Date(joiningDate);
      if (isNaN(d.getTime())) return joiningDate;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return joiningDate;
    }
  })();

  const pageContainerStyle = {
    width: '100%',
    maxWidth: '820px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.45',
  };

  const pageStyle = {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '1120px',
    padding: '40px 50px 70px 50px',
    backgroundColor: '#ffffff',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pageBreakAfter: 'always',
    breakAfter: 'page',
    marginBottom: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  const headerRender = () => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <img src="/Capture.JPG" alt="TOSBS" style={{ height: '52px', objectFit: 'contain' }} />
      </div>
      <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '10px 0 0 0' }} />
    </div>
  );

  const footerRender = () => (
    <div style={{ marginTop: '20px' }}>
      <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '0 0 8px 0' }} />
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#111827', lineHeight: '1.4' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '11.5px' }}>TOSBS - The One Stop Business Solution Pvt Ltd</p>
        <p style={{ margin: '2px 0 0 0' }}>01 Suman Apartment, Opp. Patil Plaza, Mitra Mandal Colony, Parvati, Pune, MH 411009</p>
        <p style={{ margin: '2px 0 0 0' }}>contact@tosbs.com | www.tosbs.com | +91 92011 11911</p>
      </div>
    </div>
  );

  return (
    <div id={id} className="tosbs-printable-offer-letter" style={pageContainerStyle}>
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tosbs-printable-offer-letter {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .offer-letter-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 35px 45px 50px 45px !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 290mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* PAGE 1 */}
      <div className="offer-letter-page" style={pageStyle}>
        <div>
          {headerRender()}
          
          <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '12px', margin: '15px 0 20px 0' }}>
            Date : {letterDate}
          </div>

          <div style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}><strong>Candidate Code:</strong> {candidateCode}</p>
            <p style={{ margin: 0 }}><strong>Name:</strong> {fullName}</p>
            <p style={{ margin: 0 }}><strong>Location :</strong> {location}</p>
          </div>

          <div style={{ textAlign: 'center', margin: '25px 0 20px 0' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, textDecoration: 'underline', color: '#000' }}>
              Subject: Appointment cum Offer Letter
            </h3>
          </div>

          <div style={{ lineHeight: '1.55', color: '#000' }}>
            <p style={{ margin: '0 0 12px 0' }}>Dear <strong>{fullName}</strong>,</p>
            <p style={{ margin: '0 0 12px 0' }}>
              With reference to our discussions, we are pleased to offer you a position of <strong>{designation}</strong> with TOSBS Advisor Pvt. Ltd, and appointed with the following terms and conditions.
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              <strong>Commencement of Employment:</strong> Your date of joining will be <strong>{formattedJoiningDate}</strong>.
            </p>
            <p style={{ margin: '0 0 4px 0' }}>
              • <strong>Reporting to:</strong> {reportingTo}
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#333' }}>
              Reporting relationships may be changed at any point in time at the discretion of the management.
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              • <strong>Compensation:</strong> Your monthly compensation will be <strong>{formatCurrency(monthlyVal)}/-</strong> [Rupees {monthlyWords} Only.] payable on or before the 15th of the following month. The salary will be paid via direct deposit
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              • <strong>Annual CTC :</strong> <strong>{formatCurrency(annualVal)}/-</strong> [ Rupees {annualWords} Only] per annum, for detail bifurcation refer [Annexure 1]
            </p>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              • <strong>Joining Date:</strong> We would appreciate you joining us on or before <strong>{formattedJoiningDate}</strong>. The offer stands revoked automatically on not joining as per the indicated timelines. Discussions or attempts to arrive at a revised joining date could be made, but in case no agreement on a date is arrived at, the date indicated in the offer (or last agreed in writing thereafter) would be considered as the date by which the candidate should join, failing which the offer would automatically stand revoked. While you are at liberty to drop the offer, by indicating in writing, if things don’t appear to be working out, the offer can also be revoked at the discretion of the management of the firm.
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              • <strong>Acceptance:</strong> Your formal acceptance of the terms & conditions of this offer should be confirmed in writing (reply to email / countersigning this offer letter).
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              • <strong>Verification:</strong> This offer is subject to a positive reference check and post-employment background screening.
            </p>
          </div>
        </div>
        {footerRender()}
      </div>

      {/* PAGE 2 */}
      <div className="offer-letter-page" style={pageStyle}>
        <div>
          {headerRender()}

          <div style={{ lineHeight: '1.5', color: '#000' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 700 }}>• Probation, Confirmation and Notice period:</p>
            <div style={{ paddingLeft: '15px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                i. You will initially be on probation for a period of 3 months. During this period, the Firm may conduct evaluation(s) on functional and behavioral aspects of your role as deemed fit, to ascertain the suitability of the employment.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                ii. During probation, the employment may be ended through a written notification, by given 15(fifteen) days’ notice, or equivalent compensation, in lieu thereof, on either side.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                iii. The probation period may be extended further for a maximum period of 90 (ninety) days, if deemed necessary, via a written communication and completely will be based on management decision.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                iv. On voluntary exit employee needs to serve 30 (thirty) days’ notice period, for completing an authorized exit with proper handover of responsibilities.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                v. As a confirmed employee, the employment can be terminated by giving notice, or equivalent compensation (as per policy), in lieu thereof, on either side.
              </p>
            </div>

            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              • <strong>Terms and Conditions of Association:</strong> An agreement outlining the terms and conditions of your association with the firm, will be issued as part of your joining formalities, You acknowledge and agree that dual employment is strictly prohibited. You confirm that you have not been engaged in any form of dual employment and that your last working day with any previous organization was before joining the TOSBS. You further acknowledge that any breach of this clause may immediately terminate this employment contract.
            </p>

            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              • <strong>Exams and Courses:</strong> In case you intended to take up any full-time/part-time course while working with TOSBS, which requires your absence from or which may hamper your regular work, you are required to obtain written permission from our HR and from aligned Manager, before doing so.
            </p>

            <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>• Documents: On the date of joining, please provide self-attested and dated copies of:</p>
            <div style={{ paddingLeft: '15px', marginBottom: '18px', fontSize: '12.5px' }}>
              <p style={{ margin: '0 0 4px 0' }}>1. <strong>Education:</strong> Mark sheets and Pass Certificate/Degree/Diploma (X, XII, UG, PG, Other)</p>
              <p style={{ margin: '0 0 4px 0' }}>2. <strong>Employment:</strong> Acceptance of Resignation / Relieving letter of all previous organization/s, Form 16 / Form 12B</p>
              <p style={{ margin: '0 0 4px 0' }}>3. <strong>Compliance:</strong> Aadhaar / UID, Voter ID PAN, PF Details (PF No. & UAN No.), Driving License, Passport, Bank Account Details</p>
              <p style={{ margin: '0 0 4px 0' }}>4. <strong>Other:</strong> Current & Permanent Address Proof, 3 Passport size photographs (formal business attire), Dependent Details, Vaccination Certificate, Professional References (2)</p>
            </div>

            <p style={{ margin: '0 0 18px 0', fontWeight: 600 }}>
              We welcome you to pursuit of excellence and wish you a very rewarding and satisfying career with us.
            </p>

            <div style={{ margin: '20px 0 35px 0' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>For TOSBS Advisors Private Limited!</p>
              <div style={{ height: '35px' }}></div>
              <p style={{ margin: 0, fontWeight: 700 }}>Senior Manager – Human Resources</p>
            </div>

            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '15px' }}>
              <p style={{ margin: '0 0 15px 0', fontWeight: 700 }}>Understood and Accepted:</p>
              <p style={{ margin: '0 0 8px 0' }}>Candidate Name: ____________________________________</p>
              <p style={{ margin: 0 }}>Date: ________________________</p>
            </div>
          </div>
        </div>
        {footerRender()}
      </div>

      {/* PAGE 3 (ANNEXURE 1) */}
      <div className="offer-letter-page" style={pageStyle}>
        <div>
          {headerRender()}

          <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>ANNEXURE 1</h3>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>Salary / CTC Annexure</h4>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', border: '1.5px solid #000', fontSize: '12.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #000', width: '35%' }}>Name</td>
                <td style={{ padding: '8px 12px', border: '1px solid #000', fontWeight: 600 }}>{fullName}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #000' }}>Internal Job Title</td>
                <td style={{ padding: '8px 12px', border: '1px solid #000' }}>{designation}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #000' }}>Location</td>
                <td style={{ padding: '8px 12px', border: '1px solid #000' }}>{location}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SALARY COMPUTATION
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', border: '1.5px solid #000', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>Component</th>
                <th style={{ padding: '8px 12px', border: '1px solid #000', textAlign: 'right', fontWeight: 700, width: '30%' }}>Annual Amount (₹)</th>
                <th style={{ padding: '8px 12px', border: '1px solid #000', textAlign: 'right', fontWeight: 700, width: '30%' }}>Monthly Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '7px 12px', border: '1px solid #000' }}>Basic</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(basicAnnual)}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(basicMonthly)}</td>
              </tr>
              <tr>
                <td style={{ padding: '7px 12px', border: '1px solid #000' }}>HRA</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(hraAnnual)}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(hraMonthly)}</td>
              </tr>
              <tr>
                <td style={{ padding: '7px 12px', border: '1px solid #000' }}>Conveyance Allowance</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(convAnnual)}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(convMonthly)}</td>
              </tr>
              <tr>
                <td style={{ padding: '7px 12px', border: '1px solid #000' }}>Medical Allowance</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(medAnnual)}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(medMonthly)}</td>
              </tr>
              <tr>
                <td style={{ padding: '7px 12px', border: '1px solid #000' }}>Special Allowance</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(specialAnnual)}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(specialMonthly)}</td>
              </tr>
              <tr style={{ fontWeight: 700, backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '8px 12px', border: '1.5px solid #000' }}>Total Compensation (CTC)</td>
                <td style={{ padding: '8px 12px', border: '1.5px solid #000', textAlign: 'right' }}>{formatCurrency(annualVal)}</td>
                <td style={{ padding: '8px 12px', border: '1.5px solid #000', textAlign: 'right' }}>{formatCurrency(monthlyVal)}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: '11.5px', color: '#1f2937', margin: '0 0 35px 0', lineHeight: 1.45 }}>
            <strong>Note:</strong> Performance incentives of Long-Term Incentives (if applicable) will be governed by the existing individual policies prevailing at the unit level.
          </p>

          <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '15px' }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: 700 }}>Understood and Accepted:</p>
            <p style={{ margin: '0 0 8px 0' }}>Candidate Name: ____________________________________</p>
            <p style={{ margin: 0 }}>Date: ________________________</p>
          </div>
        </div>
        {footerRender()}
      </div>

      {/* PAGE 4 (IT ACT AUTHORIZATION) */}
      <div className="offer-letter-page" style={pageStyle}>
        <div>
          {headerRender()}

          <div style={{ textAlign: 'center', margin: '15px 0 18px 0' }}>
            <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.4 }}>
              AUTHORIZATION TO COLLECT PERSONAL INFORMATION AS REQUIRED UNDER THE INFORMATION TECHNOLOGY ACT 2000 (“ACT”)
            </h3>
          </div>

          <div style={{ lineHeight: '1.5', color: '#000', fontSize: '12.5px' }}>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              I <strong>{fullName}</strong>, hereby acknowledge and confirm my understanding of the procedures regarding the access and retention of my personal information during and after my employment with TOSBS Advisors Pvt. Ltd
            </p>
            <div style={{ paddingLeft: '20px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 4px 0' }}>a) Validating my curriculum vitae and job application for prospective employment at TOSBS.</p>
              <p style={{ margin: '0 0 4px 0' }}>b) Processing my job application, including background verification checks and medical checks; and</p>
              <p style={{ margin: '0 0 4px 0' }}>c) Employment – related actions including record retention as prescribed under applicable law, processing compensation and benefits and any action required in the context of my employment with TOSBS</p>
            </div>

            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              <strong>Verification:</strong> This offer is subject to a positive reference check and post-employment background screening. The detailed background verification process.
            </p>
            <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Documents: On the date of joining, please provide self-attested and dated copies of:</p>
            <div style={{ paddingLeft: '15px', marginBottom: '12px', fontSize: '12px' }}>
              <p style={{ margin: '0 0 3px 0' }}>1. <strong>Education:</strong> Mark sheets and Pass Certificate/Degree/Diploma (X, XII, UG, PG, Other)</p>
              <p style={{ margin: '0 0 3px 0' }}>2. <strong>Employment:</strong> Acceptance of Resignation / Relieving letter of all previous organization/s, Form 16 / Form 12B Compliance: Aadhaar / UID, Voter ID PAN, PF Details (PF No. & UAN No.), Driving License, Passport, Bank Account Details</p>
              <p style={{ margin: '0 0 3px 0' }}>3. <strong>Other:</strong> Current & Permanent Address Proof, 3 Passport size photographs (formal business attire), Dependent Details, Vaccination Certificate, Professional References</p>
            </div>

            <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Data Access:</p>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              • I understand that during my employment, certain personal information and documents pertaining to my employment will be collected, stored, and processed by TOSBS for legitimate business purposes such as background verification, payroll, performance evaluations etc. meaning as under Rule 4 of the Information Technology (Reasonable practices and procedure and sensitive personal data or information) Rule, 2011 (“Rules”)
            </p>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              I acknowledge that authorized personnel may have access to my personal information on a need-to-know basis and for relevant business purposes only.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              • I agree to provide accurate and up-to-date personal information to TOSBS as and when required, and I understand my responsibility to inform HR of any changes to my personal details.
            </p>

            <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Data Retention:</p>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              • I am aware that TOSBS will retain my personal information for a reasonable period of time following the termination of my Employment, as required by applicable laws and for legitimate business purposes.
            </p>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              • I consent to the retention of my personal information in accordance with the company's data retention policies and procedures.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              • I understand that reasonable measures will be taken to ensure the security and confidentiality of my personal information during its retention period.
            </p>

            <p style={{ margin: '0 0 20px 0', fontSize: '11.5px', fontStyle: 'italic' }}>
              The Company reserves the right to change, modify and amend any of the benefits, as it deems necessary, from time to time
            </p>

            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '12px' }}>
              <p style={{ margin: '0 0 8px 0' }}>Candidate Name: ____________________________________</p>
              <p style={{ margin: 0 }}>Date: ________________________</p>
            </div>
          </div>
        </div>
        {footerRender()}
      </div>

      {/* PAGE 5 (STRICTLY PRIVATE & CONFIDENTIAL) */}
      <div className="offer-letter-page" style={pageStyle}>
        <div>
          {headerRender()}

          <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>
              STRICTLY PRIVATE & CONFIDENTIAL
            </h3>
          </div>

          <div style={{ lineHeight: '1.5', color: '#000', fontSize: '12.5px' }}>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              1. This appointment will be void in case any declaration/representations given by you with respect to your experiences/ qualifications/ credentials, etc., which form the basis of this employment is found to be wrong, or you are found to have willfully suppressed any material information. Your employment will be liable for termination without notice, or compensation in lieu thereof.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              2. The Firm shall have the right to get your character and antecedents verified through reference, police verification or any appropriate process and subject to its outcome, the employment shall be liable to be continued, modified, or cancelled/withdrawn at any stage, by either side.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              3. You may be required to enter into a non-disclosure agreement (NDA) upon taking up this assignment, as all of the responsibilities assigned to you are confidential and of business-sensitive nature.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              4. You shall observe strict secrecy with respect to all transactions and activities of the Firm. Accordingly, you shall not, except in the performance in good faith of the duties assigned to you, disclose, communicate or part with, directly or indirectly, any confidential or technical information, know-how, proprietary information of any licenses, plans, drawings, specifications, details or data, or any other information to any other person, including any other employee/consultant/associate of the Firm at any time, whether during your employment with the Firm or thereafter, without written consent of the Firm.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              5. You shall be obliged to disclose your association, in whatsoever manner, professional or personal, in past or present, with any entity, which participates in bidding for any goods, services, or works for the Firm or is a beneficiary of the Firm, resulting from or associated with the area in which you function or are in the know-how.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              6. Violation of the Firm’s policies, code of conduct, acts of sexual harassment, acts of violence, insubordination, turning up inebriated to work, misconduct, nonperformance , breach of trust, or circumstances where the Firm is satisfied that further continuation of the employee may be detrimental to the organization , to name a few, would be viewed seriously and liable for termination without notice or compensation thereof.
            </p>
            <p style={{ margin: '0 0 18px 0', textAlign: 'justify' }}>
              7. You will be responsible for safekeeping and return in good condition and order all the office properties, equipment’s, instruments, tools, books etc., which may be given to you for your use, custody, and charge. The Firm reserves the right to deduct fair value of its properties from your dues in the event of a failure to account for the previously mentioned properties to the satisfaction of the Firm.
            </p>

            <p style={{ margin: '0 0 15px 0', fontWeight: 600 }}>
              We are look forward to your valuable contribution to our team.
            </p>

            <div style={{ textAlign: 'center', margin: '25px 0' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#000' }}>
                Welcome to TOSBS !
              </h4>
            </div>
          </div>
        </div>
        {footerRender()}
      </div>
    </div>
  );
};

export default OfferLetterDocument;
