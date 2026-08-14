import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';

const DigiLockerModal = ({ isOpen, onClose, onVerifySuccess, employeeName }) => {
  const [step, setStep] = useState(1); // 1: Input Aadhaar/Mobile, 2: OTP, 3: Consent, 4: Success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setStep(1);
      setIdentifier('');
      setOtp('');
      setError('');
      setShowOtpNotification(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!identifier || identifier.trim().length < 10) {
      setError('Please enter a valid 12-digit Aadhaar or 10-digit Mobile number.');
      return;
    }
    
    // Generate a random 6-digit mock OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setError('');
    setStep(2);
    
    // Trigger mock notification
    setShowOtpNotification(true);
    setTimeout(() => {
      setShowOtpNotification(false);
    }, 10000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '123456') { // Allow 123456 as bypass code
      setError('');
      setStep(3);
    } else {
      setError('Invalid OTP. Please enter the code sent to your mobile device (or use bypass code 123456).');
    }
  };

  const handleConsent = () => {
    // Generate mock details using the employee's actual name to make it look realistic
    const verifiedDetails = {
      aadhaarMasked: 'XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000).toString(),
      panNumber: 'ABC' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 'P' + Math.floor(1000 + Math.random() * 9000).toString() + 'Z',
      nameOnAadhaar: employeeName || 'John Doe',
      dobOnAadhaar: '1995-05-12',
      genderOnAadhaar: 'Male',
      verifiedAt: new Date().toISOString()
    };
    
    setStep(4);
    setTimeout(() => {
      onVerifySuccess(verifiedDetails);
      onClose();
    }, 2000);
  };

  return (
    <div style={modalOverlayStyle}>
      {/* Mock SMS Notification Pop-up */}
      {showOtpNotification && (
        <div style={notificationStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={otpBadgeStyle}>OTP</div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>DigiLocker OTP Alert</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Your OTP for DigiLocker verification is <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{generatedOtp}</strong>. Valid for 10 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={modalContentStyle}>
        {/* DigiLocker Portal Header */}
        <div style={digiHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} color="#0066cc" />
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                digi<span style={{ color: '#ff6600' }}>locker</span>
              </span>
              <p style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600, marginTop: '-3px' }}>
                DEPARTMENT OF ELECTRONICS & IT, GOVT. OF INDIA
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={modalBodyStyle}>
          {step === 1 && (
            <div>
              <h3 style={titleStyle}>Verify Identity via DigiLocker</h3>
              <p style={subtitleStyle}>
                Connect your DigiLocker account to instantly verify your Aadhaar and PAN documents.
              </p>
              
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Aadhaar Number or Registered Mobile Number</label>
                  <div style={inputWrapperStyle}>
                    <Smartphone size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      placeholder="12-digit Aadhaar / 10-digit Mobile"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      style={digiInputStyle}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={errorContainerStyle}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" style={digiButtonStyle}>
                  Get OTP via SMS
                </button>
              </form>
              <div style={safetyBadgeStyle}>
                <Shield size={14} color="#10b981" />
                <span>Your data is secured by government-grade 256-bit encryption.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={titleStyle}>Enter Security Code</h3>
              <p style={subtitleStyle}>
                We have sent a 6-digit verification code to the mobile number registered with your Aadhaar.
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Enter 6-Digit OTP</label>
                  <div style={inputWrapperStyle}>
                    <Key size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={digiInputStyle}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={errorContainerStyle}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" style={digiButtonStyle}>
                  Verify OTP
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button 
                  onClick={() => {
                    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(mockOtp);
                    setShowOtpNotification(true);
                    setError('');
                  }} 
                  style={resendButtonStyle}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={titleStyle}>Consent Request</h3>
              <p style={subtitleStyle}>
                <strong>TOSBS ONBOARDING</strong> has requested permission to retrieve the following documents from your DigiLocker account:
              </p>

              <div style={consentBoxStyle}>
                <div style={consentItemStyle}>
                  <FileText size={18} color="#0066cc" />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Aadhaar Card Details</strong>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Includes Full Name, DOB, Gender, Masked Aadhaar Number, and Photo
                    </p>
                  </div>
                </div>
                
                <div style={consentItemStyle}>
                  <FileText size={18} color="#0066cc" />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>PAN Verification Record</strong>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Retrieves Verified PAN Card Number and Status
                    </p>
                  </div>
                </div>
              </div>

              <p style={consentNoticeStyle}>
                By clicking 'Allow', you authorize DigiLocker to share these details with TOSBS ONBOARDING for verification purposes.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={onClose} style={denyButtonStyle}>
                  Deny
                </button>
                <button onClick={handleConsent} style={allowButtonStyle}>
                  Allow
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, marginBottom: '0.5rem' }}>
                Identity Verified!
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '300px', margin: '0 auto' }}>
                Aadhaar and PAN details have been successfully retrieved and attached to your onboarding profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline Styles for DigiLocker Portal (designed to look like the authentic government portal)
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(6, 11, 19, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  width: '100%',
  maxWidth: '420px',
  borderRadius: '12px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  fontFamily: 'Inter, sans-serif',
};

const digiHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#64748b',
  padding: '4px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: '#cbd5e1',
  }
};

const modalBodyStyle = {
  padding: '1.5rem',
};

const titleStyle = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '0.5rem',
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: '#64748b',
  lineHeight: 1.5,
  marginBottom: '1.5rem',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const digiInputStyle = {
  width: '100%',
  padding: '0.75rem 1rem 0.75rem 2.25rem',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#0f172a',
  outline: 'none',
  transition: 'border-color 0.2s',
  ':focus': {
    borderColor: '#0066cc',
  }
};

const digiButtonStyle = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#0066cc',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const resendButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#0066cc',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
};

const errorContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem',
  backgroundColor: '#fef2f2',
  border: '1px solid #fca5a5',
  borderRadius: '6px',
  color: '#b91c1c',
  fontSize: '0.8rem',
  marginBottom: '1rem',
};

const safetyBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '1.25rem',
  padding: '0.5rem 0.75rem',
  backgroundColor: '#ecfdf5',
  borderRadius: '6px',
  fontSize: '0.7rem',
  color: '#047857',
  lineHeight: 1.3,
};

const notificationStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  backgroundColor: '#ffffff',
  borderLeft: '4px solid #ff6600',
  borderRadius: '6px',
  padding: '12px 16px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
  width: '320px',
  zIndex: 10000,
  fontFamily: 'Inter, sans-serif',
  animation: 'slideIn 0.3s ease-out',
};

const otpBadgeStyle = {
  backgroundColor: '#ff6600',
  color: '#ffffff',
  fontSize: '0.65rem',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
};

const consentBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const consentItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
};

const consentNoticeStyle = {
  fontSize: '0.75rem',
  color: '#64748b',
  lineHeight: 1.4,
};

const denyButtonStyle = {
  flex: 1,
  padding: '0.65rem',
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const allowButtonStyle = {
  flex: 1,
  padding: '0.65rem',
  backgroundColor: '#0066cc',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};

export default DigiLockerModal;
