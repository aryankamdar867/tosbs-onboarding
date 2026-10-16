import React from 'react';

export const RelievingLetterDocument = ({ data, id = 'tosbs-relieving-letter-doc' }) => {
  if (!data) return null;

  const candidateCode = data.candidateCode || data.employeeCode || data.short_code || 'TOSBS20';
  const fullName = data.fullName || data.employeeName || data.full_name || 'Employee Name';
  const designation = data.designation || data.position || 'Associate';
  const pronoun = data.pronoun || 'She'; // 'She' | 'He' | 'They'
  const signatoryTitle = data.signatoryTitle || 'Manager – Human Resource';

  // Helper date formatters
  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day}/${monthNames[d.getMonth()]}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateDot = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day}.${monthNames[d.getMonth()]}.${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const letterDate = data.letterDate ? (data.letterDate.includes('.') ? data.letterDate : formatDateDot(data.letterDate)) : formatDateDot(new Date());
  const joiningDate = data.joiningDate ? (data.joiningDate.includes('/') ? data.joiningDate : formatDateSlash(data.joiningDate)) : '24/November/2025';
  const lastWorkingDay = data.lastWorkingDay ? (data.lastWorkingDay.includes('/') ? data.lastWorkingDay : formatDateSlash(data.lastWorkingDay)) : '20/February/2026';
  const resignationDate = data.resignationDate ? (data.resignationDate.includes('/') ? data.resignationDate : formatDateSlash(data.resignationDate)) : '06/February/2026';

  const pageContainerStyle = {
    width: '100%',
    maxWidth: '820px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
    fontSize: '13.5px',
    lineHeight: '1.5',
  };

  const pageStyle = {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '1080px',
    padding: '45px 55px 40px 55px',
    backgroundColor: '#ffffff',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  const headerRender = () => (
    <div style={{ marginBottom: '30px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left thick black accent bar */}
        <div style={{ height: '7px', backgroundColor: '#000000', flex: 1, marginRight: '24px' }} />
        {/* Right TOSBS official logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/Capture.JPG"
            alt="TOSBS - THE ONE STOP BUSINESS SOLUTION"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );

  const footerRender = () => (
    <div style={{ marginTop: 'auto', paddingTop: '20px', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#111827', lineHeight: '1.4' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '11.5px' }}>TOSBS - The One Stop Business Solution Pvt Ltd</p>
        <p style={{ margin: '2px 0 0 0' }}>01 Suman Apartment, Opp. Patil Plaza, Mitra Mandal Colony, Parvati, Pune, MH 411009 contact@tosbs.com</p>
        <p style={{ margin: '2px 0 0 0' }}>www.tosbs.com | +91 92011 11911</p>
      </div>
    </div>
  );

  return (
    <div id={id} className="tosbs-printable-exit-letter" style={pageContainerStyle}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tosbs-printable-exit-letter {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .exit-letter-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="exit-letter-page" style={pageStyle}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {headerRender()}

          {/* Metadata Row: Employee Code (Left) & Date (Right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', fontSize: '13px' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Employee Code: <span style={{ fontWeight: 400 }}>{candidateCode}</span>
            </p>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Date: <span style={{ fontWeight: 400 }}>{letterDate}</span>
            </p>
          </div>

          {/* Centered Document Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              color: '#000000'
            }}>
              Relieving Letter
            </h2>
          </div>

          {/* Salutation */}
          <p style={{ margin: '0 0 18px 0', fontSize: '13.5px', color: '#000000' }}>
            Dear {fullName},
          </p>

          {/* Body Paragraph 1 */}
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', lineHeight: '1.55', textAlign: 'justify', color: '#000000' }}>
            We refer to your Resignation dated {resignationDate}. Please note that you have been relieved from your employment as a {designation} at TOSBS Pvt. Ltd.
          </p>

          {/* Body Paragraph 2 */}
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.55', textAlign: 'justify', color: '#000000' }}>
            During their tenure with us, {pronoun} demonstrated a high level of professionalism, dedication, and responsibility in carrying out assigned duties. We are stating below the details of your employment with the company:
          </p>

          {/* Employment Details Block */}
          <div style={{ margin: '14px 0 18px 0', paddingLeft: '2px', fontSize: '13px', lineHeight: '1.7' }}>
            <p style={{ margin: '2px 0' }}>
              <strong>Date of Joining:</strong> {joiningDate}{joiningDate.endsWith('.') ? '' : '.'}
            </p>
            <p style={{ margin: '2px 0' }}>
              <strong>Last Working Day:</strong> {lastWorkingDay}
            </p>
            <p style={{ margin: '2px 0' }}>
              <strong>Employee Code:</strong> {candidateCode}
            </p>
            <p style={{ margin: '2px 0' }}>
              <strong>Designation:</strong> {designation}
            </p>
          </div>

          {/* Body Paragraph 3 */}
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', lineHeight: '1.55', textAlign: 'justify', color: '#000000' }}>
            We take this opportunity to wish you the very best in your future endeavors.
          </p>

          {/* Body Paragraph 4 */}
          <p style={{ margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.55', textAlign: 'justify', color: '#000000' }}>
            We would like to draw your attention to your continuing obligations towards the company including that of confidentiality with respect to all proprietary and confidential information of the Company and its customers that you have had access to during the course of the employment with the company
          </p>

          {/* Signatory Section */}
          <div style={{ marginTop: '28px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '13px', color: '#000000' }}>
              For TOSBS Private limited
            </p>

            {/* Official Stamp & Signature Overlay */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '80px', margin: '4px 0' }}>
              <img
                src="/tosbs_stamp.png"
                alt="TOSBS Official Stamp"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: 0.95,
                  transform: 'rotate(-4deg)',
                  pointerEvents: 'none'
                }}
              />
              <img
                src="/tosbs_signature.png"
                alt="Authorized Signatory"
                style={{
                  height: '62px',
                  width: 'auto',
                  objectFit: 'contain',
                  marginLeft: '-35px',
                  marginTop: '8px',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '12.5px', color: '#000000' }}>
              {signatoryTitle}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#111827' }}>
              (Authorised Signatory)
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        {footerRender()}
      </div>
    </div>
  );
};

export default RelievingLetterDocument;
