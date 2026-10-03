import React from 'react';
import { X, Printer } from 'lucide-react';
import PayslipDocument from './PayslipDocument';

export const PayslipModal = ({ isOpen, onClose, emp, breakdown, monthStr }) => {
  if (!isOpen || !emp || !breakdown) return null;

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
      {/* Header Bar */}
      <div className="no-print" style={{
        width: '100%',
        maxWidth: '890px',
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
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            TOSBS Salary Slip — {emp.full_name || 'Employee'}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            Pay Period: {monthStr} | Code: {emp.short_code || emp.employee_code || emp.id}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            title="Download PDF or Print"
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

      {/* Main Payslip Preview */}
      <div style={{
        width: '100%',
        maxWidth: '890px',
        backgroundColor: '#f3f4f6',
        borderRadius: '0 0 12px 12px',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <PayslipDocument emp={emp} breakdown={breakdown} monthStr={monthStr} />
      </div>
    </div>
  );
};

export default PayslipModal;
