import React from 'react';
import { numberToWordsIndian } from '../utils/numberToWords';

export const PayslipDocument = ({ emp, breakdown, monthStr, id = 'tosbs-payslip-doc' }) => {
  if (!emp || !breakdown) return null;

  // Format month, e.g. "2026-04" => "April -2026"
  const formattedMonthYear = (() => {
    try {
      if (!monthStr) return 'April -2026';
      const [y, m] = monthStr.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      return `${monthName} -${y}`;
    } catch {
      return monthStr || 'April -2026';
    }
  })();

  const empName = emp.full_name || 'Employee Name';
  const empCode = emp.short_code || emp.employee_code || (emp.id ? `TOSBS${emp.id.slice(0, 4).toUpperCase()}` : 'TOSBS01');
  const dateOfJoining = (() => {
    const doj = emp.date_of_joining || emp.joining_date;
    if (!doj) return '17-November-2025';
    try {
      const d = new Date(doj);
      if (isNaN(d.getTime())) return doj;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
    } catch {
      return doj;
    }
  })();

  const totalDays = breakdown.daysInMonth || 30;
  const presentDays = breakdown.presentDays || 0;
  const leaveDays = breakdown.leaveDays || 0;
  const holidayDays = breakdown.holidayDays || 0;
  const absentDays = breakdown.billableAbsents || 0;
  const payableDays = breakdown.payableDays ?? (totalDays - absentDays);

  const monthlyCtc = Math.round(Number(breakdown.monthlyCtc) || 75000);
  const offer = breakdown.offerBreakdown || emp.offerData || null;

  // Earnings Components (Matched with Offer Letter Annexure)
  const basicSalary = offer?.basicMonthly ? Math.round(offer.basicMonthly) : Math.round(monthlyCtc * 0.50);
  const hra = offer?.hraMonthly ? Math.round(offer.hraMonthly) : Math.round(basicSalary * 0.50);
  const conveyance = offer?.convMonthly !== undefined ? Math.round(offer.convMonthly) : (monthlyCtc >= 25000 ? 960 : Math.round(monthlyCtc * 0.10));
  const medicalAllowance = offer?.medMonthly !== undefined ? Math.round(offer.medMonthly) : (monthlyCtc >= 25000 ? 750 : 0);
  const otherAllowance = offer?.specialMonthly !== undefined ? Math.round(offer.specialMonthly) : Math.max(0, monthlyCtc - basicSalary - hra - conveyance - medicalAllowance);
  const totalEarnings = basicSalary + hra + conveyance + medicalAllowance + otherAllowance;

  // Separate Itemized Deductions
  const includeTds = Boolean(breakdown.includeTds);
  const tdsDeduction = includeTds ? Math.round(breakdown.tds ?? (monthlyCtc * 0.02)) : 0;
  const leaveDeduction = Math.round(breakdown.leaveDeduction ?? (breakdown.excessLeaves ? (breakdown.excessLeaves * (monthlyCtc / totalDays)) : 0));
  const totalDeduction = tdsDeduction + leaveDeduction;

  const netPayable = Math.max(0, totalEarnings - totalDeduction);

  const formatMoney = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const wordsNetPayable = numberToWordsIndian(netPayable);

  const pageStyle = {
    width: '100%',
    maxWidth: '850px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4',
    padding: '40px 45px',
    boxSizing: 'border-box',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    position: 'relative'
  };

  return (
    <div id={id} className="tosbs-printable-payslip" style={pageStyle}>
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
          .tosbs-printable-payslip {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 25px 35px !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
        <div>
          <img src="/Capture.JPG" alt="TOSBS" style={{ height: '48px', objectFit: 'contain' }} />
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', color: '#111827', marginTop: '2px' }}>
            THE ONE STOP BUSINESS SOLUTION
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '5px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#000000' }}>
            Salary Slip
          </h2>
        </div>

        <div style={{ textAlign: 'right', marginTop: '5px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#000000' }}>
            Pay Period : {formattedMonthYear}
          </span>
        </div>
      </div>

      {/* Company & Employee Details */}
      <div style={{ marginBottom: '20px', fontSize: '13.5px', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 3px 0' }}>
          <strong>Company Name:</strong> TOSBS Advisors Pvt. Ltd.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>Address:</strong> Suman Apartment, 01, Vanari Rd, Mitra Mandal Colony, Parvati Paytha, Pune, Maharashtra 411009
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <strong>Employee Name:</strong> {empName}
          </div>
          <div>
            <strong>Employee Code:</strong> {empCode}
          </div>
          <div>
            <strong>Date of Joining:</strong> {dateOfJoining}
          </div>
          <div>
            <strong>Payable Days :</strong> {payableDays}
          </div>
        </div>
      </div>

      {/* Main Earnings & Deductions Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: '15px', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000000' }}>
            <th style={{ textAlign: 'left', padding: '8px 10px', borderRight: '1.5px solid #000000', width: '30%', fontWeight: 700 }}>Earning</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000', width: '18%', fontWeight: 700 }}>Rates (Rs.)</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000', width: '18%', fontWeight: 700 }}>Amount (Rs.)</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', width: '34%', fontWeight: 700 }}>Deduction</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Basic Salary</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(basicSalary)}</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(basicSalary)}</td>
            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TDS {includeTds ? '(2%)' : ''}</span>
                <span>{formatMoney(tdsDeduction)}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>HRA</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(hra)}</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(hra)}</td>
            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Leave Deduction</span>
                <span>{formatMoney(leaveDeduction)}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Conveyance Allowance</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(conveyance)}</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(conveyance)}</td>
            <td style={{ padding: '8px 10px' }}></td>
          </tr>
          {medicalAllowance > 0 && (
            <tr>
              <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Medical Allowance</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(medicalAllowance)}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(medicalAllowance)}</td>
              <td style={{ padding: '8px 10px' }}></td>
            </tr>
          )}
          <tr>
            <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Other Allowance</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(otherAllowance)}</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(otherAllowance)}</td>
            <td style={{ padding: '8px 10px' }}></td>
          </tr>

          {/* Totals Row */}
          <tr style={{ borderTop: '1.5px solid #000000', fontWeight: 700 }}>
            <td style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Total Payments (A) :</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(totalEarnings)}</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(totalEarnings)}</td>
            <td style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Deduction (B) :</span>
                <span>{formatMoney(totalDeduction)}</span>
              </div>
            </td>
          </tr>

          {/* Net Payable Row */}
          <tr style={{ borderTop: '1.5px solid #000000', fontWeight: 700 }}>
            <td colSpan={2} style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>Net Payable (A-B) :</td>
            <td style={{ textAlign: 'right', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>{formatMoney(netPayable)}</td>
            <td style={{ padding: '8px 10px' }}></td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '20px' }}>
        Amount in words : {wordsNetPayable ? `${wordsNetPayable.toLowerCase()} rupees only.` : 'Zero rupees only.'}
      </div>

      {/* Attendance & Leave Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: '15px', textAlign: 'center', fontSize: '12.5px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000000' }}>
            <th style={{ padding: '8px', borderRight: '1.5px solid #000000', width: '20%', fontWeight: 700 }}>Total Days</th>
            <th style={{ padding: '8px', borderRight: '1.5px solid #000000', width: '45%', fontWeight: 700 }}>Paid Days (TD/WO/HL/PL/OT/OH/CO)</th>
            <th style={{ padding: '8px', borderRight: '1.5px solid #000000', width: '15%', fontWeight: 700 }}>Unpaid</th>
            <th style={{ padding: '8px', width: '20%', fontWeight: 700 }}>
              LeaveSavedMonthly<br />Yearly
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 8px', borderRight: '1.5px solid #000000' }}>{totalDays}</td>
            <td style={{ padding: '10px 8px', borderRight: '1.5px solid #000000' }}>
              {payableDays} (0 / 0 / 0 / 0 / 0 / 0 / 0)
            </td>
            <td style={{ padding: '10px 8px', borderRight: '1.5px solid #000000' }}>{absentDays}</td>
            <td style={{ padding: '10px 8px', lineHeight: '1.5' }}>
              Yearly<br />Yearly<br />Yearly
            </td>
          </tr>
        </tbody>
      </table>

      {/* Explanatory Notes */}
      <div style={{ fontSize: '11.5px', lineHeight: '1.5', color: '#111827', marginBottom: '35px' }}>
        <p style={{ margin: '0 0 4px 0' }}>
          *Note : TD – Total worked days, WO – Weekly Off, HL – Paid Holidays, PL – Paid Leave, OT – Over Time Days, OH – Over Time Hrs, CO – Compensatory Off .
        </p>
        <p style={{ margin: 0 }}>
          *Note : Leave Balance (if any) as {formattedMonthYear}
        </p>
      </div>

      {/* Signature Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px' }}>
        <p style={{ margin: '0 0 45px 0', fontWeight: 700, fontSize: '14px' }}>
          For TOSBS Advisors Private Limited
        </p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>
          (Authorized Signatory)
        </p>
        <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '13px' }}>
          Senior Manager – Human Resources
        </p>
      </div>
    </div>
  );
};

export default PayslipDocument;
