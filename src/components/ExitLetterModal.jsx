import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Edit3, Eye, CheckCircle2, Save, FileText, Award, Calendar, User, Briefcase, Mail, Loader2 } from 'lucide-react';
import RelievingLetterDocument from './RelievingLetterDocument';
import ExperienceLetterDocument from './ExperienceLetterDocument';
import supabase from '../lib/supabaseClient';
import { sendRelievingLetterEmail, sendExperienceLetterEmail } from '../utils/letterEmailService';

export const ExitLetterModal = ({
  isOpen,
  onClose,
  employee,
  letterType = 'relieving', // 'relieving' | 'experience'
  initialData = null,
  isHrMode = false,
  onSaveSuccess = null,
}) => {
  if (!isOpen || !employee) return null;

  const [activeType, setActiveType] = useState(letterType || 'relieving');
  const [mode, setMode] = useState('preview'); // 'preview' or 'edit'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  // Default date formatting helper (DD.Month.YYYY)
  const defaultLetterDate = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${day}.${monthNames[d.getMonth()]}.${d.getFullYear()}`;
  })();

  const formatDateSlash = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day}/${monthNames[d.getMonth()]}/${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  const formatDateDash = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  const [formData, setFormData] = useState({
    candidateCode: employee.short_code || employee.employee_code || (employee.id ? `TOSBS${employee.id.slice(0, 4).toUpperCase()}` : 'TOSBS20'),
    fullName: employee.full_name || '',
    designation: employee.position || employee.job_title || 'Associate',
    department: employee.department || 'Operations',
    joiningDate: employee.date_of_joining ? formatDateSlash(employee.date_of_joining) : '24/November/2025',
    lastWorkingDay: employee.notice_end_date ? formatDateSlash(employee.notice_end_date) : formatDateSlash(new Date()),
    resignationDate: employee.resignation_date ? formatDateSlash(employee.resignation_date) : formatDateSlash(new Date()),
    pronoun: employee.gender === 'male' ? 'He' : employee.gender === 'female' ? 'She' : 'She',
    letterDate: defaultLetterDate,
    signatoryTitle: 'Manager – Human Resource',
  });

  useEffect(() => {
    if (letterType) {
      setActiveType(letterType);
    }
  }, [letterType]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        candidateCode: initialData.candidateCode || initialData.employeeCode || prev.candidateCode,
        fullName: initialData.fullName || initialData.employeeName || prev.fullName,
        designation: initialData.designation || initialData.position || prev.designation,
        joiningDate: initialData.joiningDate || prev.joiningDate,
        lastWorkingDay: initialData.lastWorkingDay || prev.lastWorkingDay,
        resignationDate: initialData.resignationDate || prev.resignationDate,
        pronoun: initialData.pronoun || prev.pronoun,
        letterDate: initialData.letterDate || prev.letterDate,
        signatoryTitle: initialData.signatoryTitle || prev.signatoryTitle || 'Manager – Human Resource',
      }));
    } else if (employee) {
      const code = employee.short_code || employee.employee_code || (employee.id ? `TOSBS${employee.id.slice(0, 4).toUpperCase()}` : 'TOSBS20');
      const doj = employee.date_of_joining ? formatDateSlash(employee.date_of_joining) : '24/November/2025';
      const lwd = employee.notice_end_date ? formatDateSlash(employee.notice_end_date) : formatDateSlash(new Date());
      const resDate = employee.resignation_date ? formatDateSlash(employee.resignation_date) : formatDateSlash(new Date());

      setFormData(prev => ({
        ...prev,
        candidateCode: code,
        fullName: employee.full_name || prev.fullName,
        designation: employee.position || employee.job_title || prev.designation,
        department: employee.department || prev.department,
        joiningDate: doj,
        lastWorkingDay: lwd,
        resignationDate: resDate,
        pronoun: employee.gender === 'male' ? 'He' : employee.gender === 'female' ? 'She' : 'She',
      }));
    }
  }, [employee, initialData]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveExitLetter = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccessMsg('');

    try {
      const docType = activeType === 'relieving' ? 'relieving_letter' : 'experience_letter';
      const safeName = (employee.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = activeType === 'relieving' 
        ? `TOSBS_Relieving_Letter_${safeName}.pdf` 
        : `TOSBS_Experience_Letter_${safeName}.pdf`;

      const payload = {
        ...formData,
        document_type: docType,
        letter_type: activeType,
        employee_id: employee.id,
        generated_at: new Date().toISOString(),
        generated_by: 'HR Admin'
      };

      // Check if existing record exists in employee_documents
      const { data: existing } = await supabase
        .from('employee_documents')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('document_type', docType);

      if (existing && existing.length > 0) {
        const { error: updateErr } = await supabase
          .from('employee_documents')
          .update({
            file_name: fileName,
            file_url: JSON.stringify(payload),
            uploaded_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insErr } = await supabase
          .from('employee_documents')
          .insert([{
            employee_id: employee.id,
            document_type: docType,
            file_name: fileName,
            file_url: JSON.stringify(payload),
            uploaded_at: new Date().toISOString()
          }]);
        if (insErr) throw insErr;
      }

      setSaveSuccessMsg(`✓ ${activeType === 'relieving' ? 'Relieving' : 'Experience'} Letter saved and issued successfully!`);
      if (onSaveSuccess) onSaveSuccess(payload, docType);
      setMode('preview');
    } catch (err) {
      console.error('Save exit letter error:', err);
      setSaveError(err.message || 'Failed to save exit letter.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailExitLetter = async () => {
    const targetEmail = employee?.email || formData?.email;
    if (!targetEmail) {
      setEmailErrorMsg('Employee has no email address on file.');
      return;
    }

    const docTitle = activeType === 'relieving' ? 'Relieving Letter' : 'Experience Letter';
    if (!window.confirm(`Send official ${docTitle} directly to ${formData.fullName || employee.full_name} (${targetEmail})?`)) {
      return;
    }

    setIsSendingEmail(true);
    setEmailErrorMsg('');
    setEmailSuccessMsg('');

    try {
      const res = activeType === 'relieving'
        ? await sendRelievingLetterEmail(employee, formData)
        : await sendExperienceLetterEmail(employee, formData);

      if (res.success) {
        setEmailSuccessMsg(`✓ ${docTitle} successfully delivered to ${targetEmail}!`);
        setTimeout(() => setEmailSuccessMsg(''), 7000);
      } else {
        setEmailErrorMsg(res.error || 'Failed to send email via Resend.');
      }
    } catch (err) {
      setEmailErrorMsg(err.message || 'Unexpected error while sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      {/* Top Header Bar (Fixed / Sticky) */}
      <div className="no-print" style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: '#111827',
        border: '1px solid rgba(200,146,42,0.3)',
        borderRadius: '12px 12px 0 0',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'rgba(200,146,42,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c8922a'
          }}>
            {activeType === 'relieving' ? <FileText size={20} /> : <Award size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              {activeType === 'relieving' ? 'Relieving Letter' : 'Experience Letter'} — {formData.fullName}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
              Code: {formData.candidateCode} | Role: {formData.designation}
            </p>
          </div>
        </div>

        {/* Document Type Switcher (Relieving vs Experience) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#1f2937', borderRadius: '8px', padding: '3px', border: '1px solid #374151' }}>
            <button
              type="button"
              onClick={() => setActiveType('relieving')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeType === 'relieving' ? 'var(--color-orange, #c8922a)' : 'transparent',
                color: activeType === 'relieving' ? '#ffffff' : '#9ca3af'
              }}
            >
              <FileText size={13} /> Relieving Letter
            </button>
            <button
              type="button"
              onClick={() => setActiveType('experience')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeType === 'experience' ? 'var(--color-orange, #c8922a)' : 'transparent',
                color: activeType === 'experience' ? '#ffffff' : '#9ca3af'
              }}
            >
              <Award size={13} /> Experience Letter
            </button>
          </div>

          {/* Mode Switcher: Preview vs Edit */}
          {isHrMode && (
            <div style={{ display: 'flex', backgroundColor: '#1f2937', borderRadius: '8px', padding: '3px', border: '1px solid #374151' }}>
              <button
                type="button"
                onClick={() => setMode('preview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'preview' ? 'var(--color-orange, #c8922a)' : 'transparent',
                  color: mode === 'preview' ? '#ffffff' : '#9ca3af'
                }}
              >
                <Eye size={13} /> Preview
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'edit' ? 'var(--color-orange, #c8922a)' : 'transparent',
                  color: mode === 'edit' ? '#ffffff' : '#9ca3af'
                }}
              >
                <Edit3 size={13} /> Edit Details
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleEmailExitLetter}
            disabled={isSendingEmail}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              padding: '0.5rem 0.95rem',
              borderColor: 'rgba(59,130,246,0.4)',
              color: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.1)'
            }}
            title={`Directly email this ${activeType === 'relieving' ? 'Relieving' : 'Experience'} letter to ${employee?.email || 'employee'}`}
          >
            {isSendingEmail ? <Loader2 size={15} className="spin" /> : <Mail size={15} />}
            <span>{isSendingEmail ? 'Sending...' : 'Email to Employee'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
            title="Print or Save as PDF"
          >
            <Printer size={15} /> Print / PDF
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem', borderRadius: '8px', color: '#9ca3af' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: mode === 'preview' ? '#f3f4f6' : '#1a2332',
        borderRadius: '0 0 12px 12px',
        padding: mode === 'preview' ? '1.5rem 1rem' : '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        minHeight: '600px',
        border: '1px solid rgba(200,146,42,0.3)',
        borderTop: 'none'
      }}>
        {/* Alerts */}
        {saveSuccessMsg && (
          <div className="no-print" style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={16} />
            {saveSuccessMsg}
          </div>
        )}

        {saveError && (
          <div className="no-print" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            {saveError}
          </div>
        )}

        {emailSuccessMsg && (
          <div className="no-print" style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={16} />
            {emailSuccessMsg}
          </div>
        )}

        {emailErrorMsg && (
          <div className="no-print" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            ⚠️ {emailErrorMsg}
          </div>
        )}

        {/* PREVIEW MODE */}
        {mode === 'preview' && (
          <div>
            {activeType === 'relieving' ? (
              <RelievingLetterDocument data={formData} />
            ) : (
              <ExperienceLetterDocument data={formData} />
            )}

            {isHrMode && (
              <div className="no-print" style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #d1d5db'
              }}>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Edit3 size={15} /> Edit Letter Details
                </button>
                <button
                  type="button"
                  onClick={handleSaveExitLetter}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Save size={15} /> {isSaving ? 'Saving...' : `Save & Issue ${activeType === 'relieving' ? 'Relieving' : 'Experience'} Letter`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* EDIT DETAILS MODE */}
        {mode === 'edit' && isHrMode && (
          <div style={{ color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  Customise Letter Details
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                  Verify or update the dates, designation, and metadata before issuing this official document.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Back to Preview
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Employee Code */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Employee Code
                </label>
                <input
                  type="text"
                  value={formData.candidateCode}
                  onChange={(e) => setFormData({ ...formData, candidateCode: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Employee Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Designation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Date of Issue */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Letter Issue Date (e.g. 20.March.2026)
                </label>
                <input
                  type="text"
                  value={formData.letterDate}
                  onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Date of Joining */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Date of Joining
                </label>
                <input
                  type="text"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 24/November/2025"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Last Working Day */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Last Working Day
                </label>
                <input
                  type="text"
                  value={formData.lastWorkingDay}
                  onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 20/February/2026"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>

              {/* Resignation Date (Relieving Letter only) */}
              {activeType === 'relieving' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    Resignation Date
                  </label>
                  <input
                    type="text"
                    value={formData.resignationDate}
                    onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 06/February/2026"
                    style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  />
                </div>
              )}

              {/* Pronoun (Relieving Letter only) */}
              {activeType === 'relieving' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    Pronoun in Body Text
                  </label>
                  <select
                    value={formData.pronoun}
                    onChange={(e) => setFormData({ ...formData, pronoun: e.target.value })}
                    className="form-select"
                    style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  >
                    <option value="She">She ("During their tenure with us, She demonstrated...")</option>
                    <option value="He">He ("During their tenure with us, He demonstrated...")</option>
                    <option value="They">They ("During their tenure with us, They demonstrated...")</option>
                  </select>
                </div>
              )}

              {/* Signatory Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                  Signatory Designation
                </label>
                <input
                  type="text"
                  value={formData.signatoryTitle}
                  onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel & Return to Preview
              </button>
              <button
                type="button"
                onClick={handleSaveExitLetter}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Save size={15} /> {isSaving ? 'Saving...' : `Save & Issue ${activeType === 'relieving' ? 'Relieving' : 'Experience'} Letter`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitLetterModal;
