import React from 'react';

export const ScorecardDocument = ({ data, id = 'tosbs-performance-scorecard-doc' }) => {
  if (!data) return null;

  const employeeName = data.employeeName || data.full_name || 'Employee Name';
  const employeeCode = data.employeeCode || data.short_code || 'TOS000';
  const designation = data.designation || data.position || 'Associate';
  const taskTitle = data.taskTitle || data.title || 'Assigned Performance Task';
  const category = data.category || 'Operations & Business';
  const assignedDate = data.assignedDate || data.assigned_at ? new Date(data.assignedDate || data.assigned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const completedDate = data.completedDate || data.submitted_at || data.completed_at ? new Date(data.completedDate || data.submitted_at || data.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const evaluationDate = data.evaluationDate || data.evaluated_at ? new Date(data.evaluationDate || data.evaluated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const evaluatorName = data.evaluatorName || data.evaluated_by || 'Performance Lead';
  const evaluatorTitle = data.evaluatorTitle || 'Performance & Operations Lead';

  // Ratings
  const ratings = data.ratings || {
    quality: 9,
    timeliness: 9,
    efficiency: 9,
    problem_solving: 8,
    communication: 9
  };

  const totalScore = Number(data.totalScore ?? data.total_score ?? (
    Number(ratings.quality || 0) +
    Number(ratings.timeliness || 0) +
    Number(ratings.efficiency || 0) +
    Number(ratings.problem_solving || 0) +
    Number(ratings.communication || 0)
  ));

  const percentage = Math.round((totalScore / 50) * 100);
  const ratingOutOf5 = (totalScore / 10).toFixed(1);

  // Grade calculation
  const getGradeInfo = (pct) => {
    if (pct >= 90) return { grade: 'Grade A+', label: 'Outstanding / Exceptional Performance', color: '#047857', bg: '#ecfdf5' };
    if (pct >= 80) return { grade: 'Grade A', label: 'Exceeds Expectations', color: '#1d4ed8', bg: '#eff6ff' };
    if (pct >= 70) return { grade: 'Grade B', label: 'Meets Expectations / Competent', color: '#b45309', bg: '#fffbeb' };
    if (pct >= 60) return { grade: 'Grade C', label: 'Needs Improvement / Developing', color: '#c2410c', bg: '#fff7ed' };
    return { grade: 'Grade D', label: 'Unsatisfactory', color: '#b91c1c', bg: '#fef2f2' };
  };

  const gradeInfo = getGradeInfo(percentage);

  const criteriaList = [
    {
      num: 1,
      title: 'Quality of Work & Accuracy',
      desc: 'Deliverable adheres to high standards, thoroughness, precision, and error-free execution.',
      score: ratings.quality ?? 0,
      max: 10
    },
    {
      num: 2,
      title: 'Timeliness & Deadline Adherence',
      desc: 'Task planned, executed, and completed within the allocated schedule or ahead of time.',
      score: ratings.timeliness ?? 0,
      max: 10
    },
    {
      num: 3,
      title: 'Efficiency & Ownership',
      desc: 'Demonstrated proactive accountability, autonomous execution, and optimal resource usage.',
      score: ratings.efficiency ?? 0,
      max: 10
    },
    {
      num: 4,
      title: 'Problem Solving & Initiative',
      desc: 'Analytical thinking, smart problem resolution, creativity, and overcoming task obstacles.',
      score: ratings.problem_solving ?? 0,
      max: 10
    },
    {
      num: 5,
      title: 'Communication & Collaboration',
      desc: 'Clear status updates, transparent coordination, responsiveness, and professional demeanor.',
      score: ratings.communication ?? 0,
      max: 10
    }
  ];

  const pageContainerStyle = {
    width: '100%',
    maxWidth: '820px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.5',
  };

  const pageStyle = {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '1080px',
    padding: '40px 50px 35px 50px',
    backgroundColor: '#ffffff',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  return (
    <div id={id} className="tosbs-printable-scorecard" style={pageContainerStyle}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tosbs-printable-scorecard {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .scorecard-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px 25px !important;
            min-height: auto !important;
          }
        }
      `}</style>

      <div className="scorecard-page" style={pageStyle}>
        <div>
          {/* Header Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ height: '6px', backgroundColor: '#c8922a', flex: 1, marginRight: '24px', borderRadius: '3px' }} />
              <img
                src="/Capture.JPG"
                alt="TOSBS"
                style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Title Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <h1 style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#111827'
            }}>
              EMPLOYEE PERFORMANCE SCORECARD
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#6b7280', letterSpacing: '0.5px' }}>
              TOSBS PRIVATE LIMITED • PERFORMANCE MANAGEMENT SYSTEM
            </p>
          </div>

          {/* Employee & Task Overview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '12px'
          }}>
            <div>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Employee Name:</strong> <span style={{ fontWeight: 600, color: '#111827' }}>{employeeName}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Employee Code:</strong> <span style={{ color: '#111827' }}>{employeeCode}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Designation:</strong> <span style={{ color: '#111827' }}>{designation}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Category / Department:</strong> <span style={{ color: '#111827' }}>{category}</span>
              </p>
            </div>
            <div>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Assigned Task:</strong> <span style={{ fontWeight: 600, color: '#111827' }}>{taskTitle}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Assigned Date:</strong> <span style={{ color: '#111827' }}>{assignedDate}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Completed Date:</strong> <span style={{ color: '#111827' }}>{completedDate}</span>
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong style={{ color: '#374151' }}>Evaluated By:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{evaluatorName}</span>
              </p>
            </div>
          </div>

          {/* Performance Summary Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: gradeInfo.bg,
            border: `1.5px solid ${gradeInfo.color}`,
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                color: gradeInfo.color,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '2px'
              }}>
                Overall Evaluation Result
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: gradeInfo.color }}>
                {gradeInfo.grade} — {gradeInfo.label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827', lineHeight: '1' }}>
                {totalScore} <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>/ 50</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: gradeInfo.color, marginTop: '3px' }}>
                {percentage}% • {ratingOutOf5} / 5.0 ★
              </div>
            </div>
          </div>

          {/* Criteria Evaluation Table */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#374151'
            }}>
              Detailed Parameter Ratings
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              border: '1px solid #d1d5db'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #9ca3af' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '35px', fontWeight: 700, color: '#111827' }}>#</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#111827' }}>Evaluation Criteria & Competency</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px', fontWeight: 700, color: '#111827' }}>Max Score</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px', fontWeight: 700, color: '#111827' }}>Score Awarded</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '85px', fontWeight: 700, color: '#111827' }}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {criteriaList.map((item, idx) => {
                  const itemPct = (item.score / item.max) * 100;
                  const itemLevel = itemPct >= 90 ? 'Outstanding' : itemPct >= 80 ? 'Very Good' : itemPct >= 70 ? 'Good' : itemPct >= 60 ? 'Satisfactory' : 'Needs Focus';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{item.num}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.3' }}>{item.desc}</div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{item.max}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '12px',
                          backgroundColor: item.score >= 8 ? '#ecfdf5' : item.score >= 6 ? '#eff6ff' : '#fef2f2',
                          color: item.score >= 8 ? '#047857' : item.score >= 6 ? '#1d4ed8' : '#b91c1c'
                        }}>
                          {item.score} / 10
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                        {itemLevel}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Summary Row */}
                <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #9ca3af', fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', textTransform: 'uppercase', fontSize: '12px', color: '#111827' }}>
                    Cumulative Score:
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', color: '#111827' }}>50</td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: '13px', color: '#047857', fontWeight: 800 }}>
                    {totalScore} / 50
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', color: gradeInfo.color, fontWeight: 800 }}>
                    {percentage}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Qualitative Evaluation Feedback */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11.5px', textTransform: 'uppercase', color: '#047857', letterSpacing: '0.5px' }}>
                ✓ Key Strengths Demonstrated
              </h4>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                {data.strengths || 'Consistent dedication, meticulous follow-through on task requirements, and positive collaborative approach.'}
              </p>
            </div>

            <div style={{
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11.5px', textTransform: 'uppercase', color: '#b45309', letterSpacing: '0.5px' }}>
                ✦ Areas for Improvement & Focus
              </h4>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                {data.improvements || 'Continue scaling independent workflow automation and further proactively optimizing turnaround time.'}
              </p>
            </div>
          </div>

          {/* Overall Evaluator Remarks */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '11.5px', textTransform: 'uppercase', color: '#1e293b', letterSpacing: '0.5px' }}>
              Overall Evaluator Remarks & Recommendations
            </h4>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {data.remarks || 'Task successfully executed to expectations with high professional integrity. Keep up the commendable performance!'}
            </p>
          </div>

          {/* Signatures & Official Stamp */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '15px',
            paddingTop: '10px'
          }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>
                Evaluation Recorded On: <strong>{evaluationDate}</strong>
              </p>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>
                Official Document ID: <strong style={{ color: '#111827' }}>TOSBS-PSC-{String(data.task_id || data.id || '001').slice(-6).toUpperCase()}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '12px', color: '#000000' }}>
                For TOSBS Private Limited
              </p>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: '65px', margin: '2px 0' }}>
                <img
                  src="/tosbs_stamp.png"
                  alt="TOSBS Stamp"
                  style={{
                    height: '65px',
                    width: 'auto',
                    objectFit: 'contain',
                    opacity: 0.95,
                    transform: 'rotate(-4deg)',
                    pointerEvents: 'none'
                  }}
                />
                <img
                  src="/tosbs_signature.png"
                  alt="Signatory"
                  style={{
                    height: '52px',
                    width: 'auto',
                    objectFit: 'contain',
                    marginLeft: '-30px',
                    marginTop: '6px',
                    pointerEvents: 'none'
                  }}
                />
              </div>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '12px', color: '#111827' }}>
                {evaluatorName}
              </p>
              <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#4b5563' }}>
                {evaluatorTitle} (Authorised Signatory)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10.5px', color: '#6b7280', lineHeight: '1.4' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>TOSBS - The One Stop Business Solution Pvt Ltd</p>
          <p style={{ margin: '2px 0 0 0' }}>01 Suman Apartment, Opp. Patil Plaza, Mitra Mandal Colony, Parvati, Pune, MH 411009 • contact@tosbs.com</p>
          <p style={{ margin: '1px 0 0 0' }}>www.tosbs.com | Confidential Performance Record</p>
        </div>
      </div>
    </div>
  );
};

export default ScorecardDocument;
