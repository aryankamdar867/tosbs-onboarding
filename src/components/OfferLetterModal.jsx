import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, Edit3, Eye, CheckCircle2, Save, FileText } from 'lucide-react';
import OfferLetterDocument from './OfferLetterDocument';
import supabase from '../lib/supabaseClient';

export const OfferLetterModal = ({
  isOpen,
  onClose,
  employee,
  offerData = null,
  initialOfferData = null,
  isHrMode = false,
  onSaveOfferLetter = null,
  onSaveSuccess = null
}) => {
  if (!isOpen || !employee) return null;

  const [mode, setMode] = useState('preview'); // 'preview' or 'edit'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Default initial fields
  const defaultLetterDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/ /g, '.');

  const [formData, setFormData] = useState({
    candidateCode: employee.short_code || employee.employee_code || (employee.invite_token ? `TOSBS${employee.invite_token.slice(-3).toUpperCase()}` : 'TOSBS01'),
    fullName: employee.full_name || '',
    designation: employee.position || employee.job_title || 'Software Engineer',
    department: employee.department || 'Operations',
    joiningDate: employee.date_of_joining || employee.dob || new Date().toISOString().split('T')[0],
    location: 'Pune',
    reportingTo: 'Amar Talwar',
    annualCtc: 600000,
    monthlyCtc: 50000,
    letterDate: defaultLetterDate,
    salaryBreakdown: null,
  });

  const effectiveOfferData = offerData || initialOfferData;

  useEffect(() => {
    if (effectiveOfferData) {
      setFormData(prev => ({
        ...prev,
        ...effectiveOfferData,
        fullName: effectiveOfferData.fullName || effectiveOfferData.candidateName || prev.fullName,
        candidateCode: effectiveOfferData.candidateCode || prev.candidateCode,
        location: effectiveOfferData.location || effectiveOfferData.workLocation || prev.location,
        reportingTo: effectiveOfferData.reportingTo || effectiveOfferData.reportingManager || prev.reportingTo,
      }));
    } else if (employee) {
      const candidateCode = employee.short_code || employee.employee_code || (employee.invite_token ? `TOSBS${employee.invite_token.slice(-3).toUpperCase()}` : 'TOSBS01');
      const monthly = employee.monthly_ctc || 50000;
      const annual = employee.annual_ctc || monthly * 12;

      setFormData(prev => ({
        ...prev,
        candidateCode,
        fullName: employee.full_name || prev.fullName,
        designation: employee.position || employee.job_title || prev.designation,
        department: employee.department || prev.department,
        joiningDate: employee.date_of_joining || prev.joiningDate,
        monthlyCtc: monthly,
        annualCtc: annual,
      }));
    }
  }, [employee, effectiveOfferData]);

  const handleCtcChange = (annual) => {
    const annualVal = Math.round(Number(annual) || 0);
    const monthlyVal = Math.round(annualVal / 12);
    setFormData(prev => ({
      ...prev,
      annualCtc: annualVal,
      monthlyCtc: monthlyVal,
    }));
  };

  const handleSaveOfferLetter = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccessMsg('');

    try {
      const payload = {
        ...formData,
        employee_id: employee.id,
        generated_at: new Date().toISOString(),
        generated_by: 'HR Admin'
      };

      const safeName = (employee.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const docRecord = {
        employee_id: employee.id,
        document_type: 'offer_letter',
        file_name: `TOSBS_Offer_Letter_${safeName}.pdf`,
        file_url: JSON.stringify(payload),
        uploaded_at: new Date().toISOString()
      };

      if (onSaveOfferLetter) {
        await onSaveOfferLetter(payload);
      } else {
        // Check if offer letter already exists for this employee
        const { data: existing } = await supabase
          .from('employee_documents')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('document_type', 'offer_letter');

        if (existing && existing.length > 0) {
          const ids = existing.map(e => e.id);
          await supabase.from('employee_documents').delete().in('id', ids);
        }

        const { error: insErr } = await supabase
          .from('employee_documents')
          .insert([docRecord]);

        if (insErr) throw insErr;
      }

      setSaveSuccessMsg('✓ Offer letter saved and published to employee portal successfully!');
      if (onSaveSuccess) onSaveSuccess(payload);
      setMode('preview');
    } catch (err) {
      console.error('Save offer letter error:', err);
      setSaveError(err.message || 'Failed to save offer letter.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      {/* Top Header Bar */}
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
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: 'rgba(200,146,42,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c8922a'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Appointment cum Offer Letter — {formData.fullName}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
              Code: {formData.candidateCode} | Position: {formData.designation}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isHrMode && (
            <div style={{ display: 'flex', backgroundColor: '#1f2937', borderRadius: '8px', padding: '3px', border: '1px solid #374151', marginRight: '0.5rem' }}>
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
                <Eye size={14} /> Preview
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
                <Edit3 size={14} /> Edit Details
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            title="Print or Save as PDF"
          >
            <Printer size={15} /> <span>Print / Download PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: '#f3f4f6',
        borderRadius: '0 0 12px 12px',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        {saveSuccessMsg && (
          <div className="no-print" style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '8px',
            color: '#065f46',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} color="#10b981" /> {saveSuccessMsg}
          </div>
        )}

        {saveError && (
          <div className="no-print" style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '0.88rem',
            marginBottom: '1rem'
          }}>
            {saveError}
          </div>
        )}

        {mode === 'edit' && isHrMode ? (
          /* EDIT FORM */
          <div className="glass-card no-print" style={{ backgroundColor: '#ffffff', color: '#111827', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
              Configure Offer Letter Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Candidate Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Candidate Code *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.candidateCode}
                  onChange={(e) => setFormData({ ...formData, candidateCode: e.target.value })}
                  placeholder="e.g. TOSBS34"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Designation / Job Title *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Department</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Date of Joining *</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Work Location</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Reporting Manager *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Letter Issuance Date</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.letterDate}
                  onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                  placeholder="e.g. 21.September.2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Annual CTC (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.annualCtc}
                  onChange={(e) => handleCtcChange(e.target.value)}
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#374151' }}>Monthly Compensation (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ color: '#111827', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }}
                  value={formData.monthlyCtc}
                  onChange={(e) => setFormData({ ...formData, monthlyCtc: Number(e.target.value) || 0 })}
                  step="500"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className="btn btn-secondary"
                style={{ color: '#374151', borderColor: '#d1d5db' }}
              >
                Preview Document
              </button>
              <button
                type="button"
                onClick={handleSaveOfferLetter}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={16} /> {isSaving ? 'Saving & Generating...' : 'Save & Generate Offer Letter'}
              </button>
            </div>
          </div>
        ) : (
          /* PREVIEW MODE */
          <div>
            {isHrMode && (
              <div className="no-print" style={{
                backgroundColor: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                    Offer Letter Document Preview
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    Verify candidate details and CTC bifurcation across all 5 pages.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: '#374151', borderColor: '#d1d5db' }}
                  >
                    <Edit3 size={14} style={{ marginRight: '4px' }} /> Edit Info
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOfferLetter}
                    disabled={isSaving}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                  >
                    <Save size={14} style={{ marginRight: '4px' }} /> {isSaving ? 'Saving...' : 'Save to Employee Record'}
                  </button>
                </div>
              </div>
            )}

            <OfferLetterDocument data={formData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferLetterModal;
