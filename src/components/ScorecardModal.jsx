import React, { useState } from 'react';
import { X, Award, Printer, CheckCircle, Edit3, Star, AlertCircle, TrendingUp, User, Calendar, FileText } from 'lucide-react';
import ScorecardDocument from './ScorecardDocument';
import supabase from '../lib/supabaseClient';

export const ScorecardModal = ({
  isOpen,
  onClose,
  task,
  initialMode = 'view', // 'view' or 'evaluate'
  currentUser = null,
  onScorecardSaved = () => {}
}) => {
  if (!isOpen || !task) return null;

  const existingScorecard = task.scorecard || null;
  const [mode, setMode] = useState(initialMode === 'evaluate' || !existingScorecard ? 'evaluate' : 'view');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'document'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Form state
  const [ratings, setRatings] = useState({
    quality: existingScorecard?.ratings?.quality ?? 9,
    timeliness: existingScorecard?.ratings?.timeliness ?? 9,
    efficiency: existingScorecard?.ratings?.efficiency ?? 9,
    problem_solving: existingScorecard?.ratings?.problem_solving ?? 8,
    communication: existingScorecard?.ratings?.communication ?? 9,
  });

  const [strengths, setStrengths] = useState(
    existingScorecard?.strengths || 'Consistent dedication, meticulous follow-through on task requirements, and positive collaborative approach.'
  );
  const [improvements, setImprovements] = useState(
    existingScorecard?.improvements || 'Continue scaling independent workflow automation and further proactively optimizing turnaround time.'
  );
  const [remarks, setRemarks] = useState(
    existingScorecard?.remarks || 'Task successfully executed to expectations with high professional integrity. Keep up the commendable performance!'
  );
  const [evaluatorName, setEvaluatorName] = useState(
    existingScorecard?.evaluatorName || existingScorecard?.evaluated_by || currentUser?.name || 'Task Lead'
  );

  // Calculations
  const totalScore = (
    Number(ratings.quality || 0) +
    Number(ratings.timeliness || 0) +
    Number(ratings.efficiency || 0) +
    Number(ratings.problem_solving || 0) +
    Number(ratings.communication || 0)
  );
  const percentage = Math.round((totalScore / 50) * 100);
  const ratingOutOf5 = (totalScore / 10).toFixed(1);

  const getGradeInfo = (pct) => {
    if (pct >= 90) return { grade: 'Grade A+', label: 'Outstanding Performance', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (pct >= 80) return { grade: 'Grade A', label: 'Exceeds Expectations', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (pct >= 70) return { grade: 'Grade B', label: 'Meets Expectations', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (pct >= 60) return { grade: 'Grade C', label: 'Needs Improvement', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    return { grade: 'Grade D', label: 'Unsatisfactory', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  };

  const gradeInfo = getGradeInfo(percentage);

  const criteria = [
    { key: 'quality', label: 'Quality of Work & Accuracy', desc: 'Thoroughness, precision, error-free output, and high standard of delivery.' },
    { key: 'timeliness', label: 'Timeliness & Deadline Adherence', desc: 'Planning, punctuality, and meeting agreed deadlines without delays.' },
    { key: 'efficiency', label: 'Efficiency & Ownership', desc: 'Autonomous execution, proactive responsibility, and resource optimization.' },
    { key: 'problem_solving', label: 'Problem Solving & Initiative', desc: 'Analytical thinking, overcome bottlenecks, and creative solutions.' },
    { key: 'communication', label: 'Communication & Teamwork', desc: 'Transparent updates, responsiveness, and collaborative professional attitude.' }
  ];

  const handleRatingChange = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveScorecard = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccessMsg('');

    try {
      const evaluationDate = new Date().toISOString();
      const scorecardPayload = {
        scorecard_id: existingScorecard?.scorecard_id || `sc_${Date.now()}`,
        task_id: task.id,
        taskTitle: task.title,
        employee_id: task.employee_id,
        employeeName: task.employee_name,
        employeeCode: task.employee_code,
        designation: task.employee_position || task.position,
        category: task.category,
        assignedDate: task.assigned_at,
        completedDate: task.completed_at || task.submitted_at || evaluationDate,
        evaluationDate: evaluationDate,
        evaluatorName: evaluatorName.trim() || currentUser?.name || 'Task Lead',
        evaluatorTitle: 'Task & Operations Lead',
        ratings: ratings,
        totalScore: totalScore,
        percentage: percentage,
        grade: gradeInfo.grade,
        gradeLabel: gradeInfo.label,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        remarks: remarks.trim()
      };

      // Updated task payload
      const updatedTaskData = {
        ...task,
        status: 'completed',
        completed_at: task.completed_at || evaluationDate,
        scorecard: scorecardPayload,
        updated_at: evaluationDate
      };

      // 1. Update in employee_documents for the task record
      if (task.doc_id) {
        const { error: updateErr } = await supabase
          .from('employee_documents')
          .update({
            file_url: JSON.stringify(updatedTaskData),
            uploaded_at: evaluationDate
          })
          .eq('id', task.doc_id);
        if (updateErr) throw updateErr;
      }

      // 2. Also save or update a separate performance_scorecard doc entry for fast direct retrieval
      const scFileName = `TOSBS_Scorecard_${(task.employee_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_')}_${task.id}.json`;
      const { data: existingScDoc } = await supabase
        .from('employee_documents')
        .select('id')
        .eq('employee_id', task.employee_id)
        .eq('file_name', scFileName);

      if (existingScDoc && existingScDoc.length > 0) {
        await supabase
          .from('employee_documents')
          .update({
            file_url: JSON.stringify(scorecardPayload),
            uploaded_at: evaluationDate
          })
          .eq('id', existingScDoc[0].id);
      } else {
        await supabase
          .from('employee_documents')
          .insert([{
            employee_id: task.employee_id,
            document_type: 'performance_scorecard',
            file_name: scFileName,
            file_url: JSON.stringify(scorecardPayload),
            uploaded_at: evaluationDate
          }]);
      }

      setSaveSuccessMsg('Performance Scorecard generated and saved successfully!');
      task.scorecard = scorecardPayload;
      task.status = 'completed';
      onScorecardSaved(updatedTaskData);

      setTimeout(() => {
        setMode('view');
        setActiveTab('document');
        setSaveSuccessMsg('');
      }, 900);
    } catch (err) {
      console.error('Error saving scorecard:', err);
      setSaveError(err.message || 'Failed to save scorecard. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Printable document data
  const docData = task.scorecard ? {
    ...task.scorecard,
    taskTitle: task.title,
    employeeName: task.employee_name,
    employeeCode: task.employee_code,
    designation: task.employee_position || task.position,
    category: task.category,
    assignedDate: task.assigned_at,
    completedDate: task.completed_at || task.submitted_at
  } : {
    taskTitle: task.title,
    employeeName: task.employee_name,
    employeeCode: task.employee_code,
    designation: task.employee_position || task.position,
    category: task.category,
    assignedDate: task.assigned_at,
    completedDate: task.completed_at || task.submitted_at || new Date().toISOString(),
    evaluatorName: evaluatorName,
    ratings: ratings,
    totalScore: totalScore,
    percentage: percentage,
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    strengths: strengths,
    improvements: improvements,
    remarks: remarks
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: mode === 'view' && activeTab === 'document' ? '900px' : '780px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.25s ease',
        border: '1px solid rgba(200,146,42,0.3)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(200,146,42,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-orange)',
              border: '1px solid rgba(200,146,42,0.3)'
            }}>
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                {mode === 'evaluate' ? 'Evaluate & Issue Scorecard' : 'Performance Scorecard'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {task.title} • {task.employee_name} ({task.employee_code || 'TOSBS'})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {task.scorecard && mode === 'view' && (
              <button
                type="button"
                onClick={() => setMode('evaluate')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Edit Evaluation"
              >
                <Edit3 size={14} /> Edit Evaluation
              </button>
            )}

            {mode === 'view' && (
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} /> Print / Download PDF
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher when in view mode */}
        {mode === 'view' && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem 0',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '6px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'summary' ? '2px solid var(--color-orange)' : '2px solid transparent',
                color: activeTab === 'summary' ? 'var(--color-orange)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'summary' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Executive Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              style={{
                padding: '6px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'document' ? '2px solid var(--color-orange)' : '2px solid transparent',
                color: activeTab === 'document' ? 'var(--color-orange)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'document' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Official Printable Scorecard
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {saveSuccessMsg && (
            <div style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={18} />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {saveError && (
            <div style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          {/* MODE 1: EVALUATION FORM (FILLED BY RUCHI) */}
          {mode === 'evaluate' && (
            <div>
              {/* Task & Employee Info Card */}
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Employee</span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{task.employee_name}</strong>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{task.employee_position || 'Associate'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Category / Department</span>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(200,146,42,0.15)',
                    color: 'var(--color-orange)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '2px'
                  }}>
                    {task.category || 'General'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Assigned By</span>
                  <strong style={{ color: '#fff' }}>{task.assigned_by || 'Ruchi (Admin)'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Completed Date</span>
                  <span style={{ color: '#fff' }}>
                    {task.submitted_at || task.completed_at ? new Date(task.submitted_at || task.completed_at).toLocaleDateString('en-IN') : 'Completed Today'}
                  </span>
                </div>
                {task.submission_notes && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Employee Submission Notes:</span>
                    <p style={{ margin: '3px 0 0', color: '#e2e8f0', fontSize: '0.82rem', fontStyle: 'italic' }}>
                      "{task.submission_notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Live Score Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                backgroundColor: gradeInfo.bg,
                border: `1.5px solid ${gradeInfo.color}`,
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: gradeInfo.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Scorecard Calculation
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: gradeInfo.color, marginTop: '2px' }}>
                    {gradeInfo.grade} — {gradeInfo.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>/ 50</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: gradeInfo.color, marginTop: '4px' }}>
                    {percentage}% • {ratingOutOf5} / 5.0 ★
                  </div>
                </div>
              </div>

              {/* Evaluation Parameters (5 criteria with 1-10 selector buttons) */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-orange)', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  Evaluation Criteria (Rate 1 to 10)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {criteria.map((c) => {
                    const currentVal = ratings[c.key] ?? 8;
                    return (
                      <div key={c.key} style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{c.label}</span>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.desc}</p>
                          </div>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            backgroundColor: currentVal >= 8 ? 'rgba(16,185,129,0.2)' : currentVal >= 6 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)',
                            color: currentVal >= 8 ? '#10b981' : currentVal >= 6 ? '#3b82f6' : '#ef4444'
                          }}>
                            {currentVal} / 10
                          </span>
                        </div>

                        {/* 1 - 10 Score Selector Pills */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isSelected = currentVal === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleRatingChange(c.key, num)}
                                style={{
                                  flex: 1,
                                  minWidth: '32px',
                                  height: '36px',
                                  borderRadius: '6px',
                                  border: isSelected ? '2px solid var(--color-orange)' : '1px solid rgba(255,255,255,0.1)',
                                  backgroundColor: isSelected ? 'var(--color-orange)' : 'rgba(255,255,255,0.04)',
                                  color: isSelected ? '#000' : 'var(--color-text-primary)',
                                  fontWeight: isSelected ? 800 : 500,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Feedback Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Key Strengths Demonstrated
                  </label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Specific skills, diligence, and positive highlights demonstrated in this task..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: '#f59e0b' }}>✦</span> Areas for Growth / Improvements
                  </label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Constructive points where the employee can sharpen efficiency or accuracy..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Overall Evaluator Remarks & Feedback</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Summary evaluation notes, recommendations, and acknowledgment..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Evaluator Name & Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    placeholder="e.g. Ruchi (Admin / Task Lead)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {existingScorecard && (
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    className="btn btn-secondary"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveScorecard}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '170px', justifyContent: 'center' }}
                >
                  {isSaving ? 'Saving Scorecard...' : (
                    <>
                      <CheckCircle size={16} /> Save & Issue Scorecard
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: VIEW SCORECARD */}
          {mode === 'view' && (
            <div>
              {activeTab === 'summary' ? (
                <div>
                  {/* Summary Rating Card */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: gradeInfo.bg,
                    border: `1.5px solid ${gradeInfo.color}`,
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: gradeInfo.color, letterSpacing: '0.8px' }}>
                          Performance Evaluation
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#fff'
                        }}>
                          Verified
                        </span>
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: gradeInfo.color }}>
                        {gradeInfo.grade} — {gradeInfo.label}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Evaluated by <strong>{task.scorecard?.evaluatorName || 'Ruchi (Admin)'}</strong> on{' '}
                        {new Date(task.scorecard?.evaluationDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                        {totalScore} <span style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>/ 50</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: gradeInfo.color, marginTop: '4px' }}>
                        {percentage}% Score • {ratingOutOf5} / 5.0 ★
                      </div>
                    </div>
                  </div>

                  {/* 5 Parameters Breakdown */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-orange)', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                      Competency Breakdown
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {criteria.map((c) => {
                        const score = ratings[c.key] ?? 9;
                        const pct = (score / 10) * 100;
                        return (
                          <div key={c.key} style={{
                            padding: '0.85rem 1.1rem',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{c.label}</span>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: score >= 8 ? '#10b981' : score >= 6 ? '#3b82f6' : '#ef4444'
                              }}>
                                {score} / 10
                              </span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: score >= 8 ? '#10b981' : score >= 6 ? '#3b82f6' : '#ef4444',
                                borderRadius: '3px'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Qualitative Feedback Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'rgba(16,185,129,0.05)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        <span>✓</span> Key Strengths
                      </div>
                      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {task.scorecard?.strengths || strengths}
                      </p>
                    </div>

                    <div style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'rgba(245,158,11,0.05)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        <span>✦</span> Areas for Improvement
                      </div>
                      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {task.scorecard?.improvements || improvements}
                      </p>
                    </div>
                  </div>

                  {/* Evaluator Remarks */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-orange)', marginBottom: '0.5rem' }}>
                      Overall Evaluator Remarks
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      "{task.scorecard?.remarks || remarks}"
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  overflowX: 'auto'
                }}>
                  <ScorecardDocument data={docData} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorecardModal;
