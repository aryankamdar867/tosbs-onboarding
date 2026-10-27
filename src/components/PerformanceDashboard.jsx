import React, { useState } from 'react';
import {
  Users, CheckSquare, Clock, FileText, CheckCircle2,
  Star, Plus, Search, Eye, Edit3, Trash2, LogOut,
  Target, Award, TrendingUp, Filter, RefreshCw, Send, AlertCircle
} from 'lucide-react';

export const PerformanceDashboard = ({
  leadUser,
  onSignOut,
  performanceTasks = [],
  performanceLoading = false,
  employees = [],
  onOpenTaskModal,
  onOpenScorecardModal,
  onUpdateTaskStatus,
  onDeleteTask,
  onRefreshTasks
}) => {
  const [activeTab, setActiveTab] = useState('my_tasks'); // 'my_tasks' | 'awaiting_review' | 'all_tasks' | 'scorecards'
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Helper to check if task belongs to this lead
  const isMyTask = (t) => {
    if (!leadUser) return true;
    if (leadUser.id === 'hr') return true; // HR can view all tasks or HR-assigned
    const assignedBy = (t.assigned_by || '').toLowerCase().trim();
    const leadName = (leadUser.name || '').toLowerCase().trim();
    const leadUserVal = (leadUser.username || '').toLowerCase().trim();
    return assignedBy.includes(leadName) || assignedBy.includes(leadUserVal);
  };

  // Filter tasks based on activeTab, search, and filters
  const visibleTasks = performanceTasks.filter((t) => {
    // Tab filter
    if (activeTab === 'my_tasks') {
      if (!isMyTask(t)) return false;
    } else if (activeTab === 'awaiting_review') {
      if (t.status !== 'submitted') return false;
      if (leadUser?.id !== 'hr' && !isMyTask(t)) return false;
    } else if (activeTab === 'scorecards') {
      if (!t.scorecard) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && (t.priority || 'medium').toLowerCase() !== priorityFilter.toLowerCase()) return false;

    // Employee filter
    if (employeeFilter !== 'all' && t.employee_id !== employeeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (t.title || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const emp = (t.employee_name || '').toLowerCase();
      const code = (t.employee_code || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const assigned = (t.assigned_by || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !emp.includes(q) && !code.includes(q) && !cat.includes(q) && !assigned.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Counters
  const myTasksList = performanceTasks.filter(isMyTask);
  const myTasksCount = myTasksList.length;
  const myAwaitingCount = myTasksList.filter(t => t.status === 'submitted').length;
  const myInProgCount = myTasksList.filter(t => t.status === 'in_progress').length;
  const myCompletedCount = myTasksList.filter(t => t.status === 'completed' && t.scorecard).length;

  const myEvaluatedList = myTasksList.filter(t => t.scorecard && t.scorecard.percentage != null);
  const myAvgScore = myEvaluatedList.length > 0
    ? Math.round(myEvaluatedList.reduce((acc, t) => acc + Number(t.scorecard.percentage || 0), 0) / myEvaluatedList.length)
    : 0;

  const allScorecardsList = performanceTasks.filter(t => t.scorecard);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc' }}>
      {/* PERFORMANCE LEAD SIDEBAR */}
      <div style={{
        width: '270px',
        height: '100vh',
        background: 'linear-gradient(180deg, #0a1324 0%, #0d1a33 100%)',
        borderRight: '1px solid rgba(200,146,42,0.25)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        flexShrink: 0
      }}>
        {/* Brand Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center' }}>
            <img src="/Capture.JPG" alt="TOSBS Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-orange)', letterSpacing: '0.8px' }}>
              Task Management
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              Team Lead Portal
            </div>
          </div>
        </div>

        {/* Lead Profile Badge */}
        <div style={{
          padding: '1rem 1.25rem',
          margin: '0.75rem 1rem',
          backgroundColor: 'rgba(200,146,42,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(200,146,42,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-orange)',
            color: '#070b14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            flexShrink: 0
          }}>
            {leadUser?.avatar || 'TL'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {leadUser?.name}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--color-orange)', fontWeight: 600 }}>
              {leadUser?.title || 'Task Lead'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1 }}>
          <button
            onClick={() => setActiveTab('my_tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: activeTab === 'my_tasks' ? 700 : 500,
              fontSize: '0.88rem',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'my_tasks' ? 'rgba(200,146,42,0.18)' : 'transparent',
              color: activeTab === 'my_tasks' ? 'var(--color-orange)' : '#94a3b8',
              borderLeft: activeTab === 'my_tasks' ? '3px solid var(--color-orange)' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Target size={18} />
            <span style={{ flex: 1 }}>My Assigned Tasks</span>
            {myTasksCount > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                {myTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('awaiting_review')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: activeTab === 'awaiting_review' ? 700 : 500,
              fontSize: '0.88rem',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'awaiting_review' ? 'rgba(139,92,246,0.18)' : 'transparent',
              color: activeTab === 'awaiting_review' ? '#c4b5fd' : '#94a3b8',
              borderLeft: activeTab === 'awaiting_review' ? '3px solid #a78bfa' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={18} />
            <span style={{ flex: 1 }}>Awaiting Scorecard</span>
            {myAwaitingCount > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', backgroundColor: '#ef4444', color: '#fff' }}>
                {myAwaitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all_tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: activeTab === 'all_tasks' ? 700 : 500,
              fontSize: '0.88rem',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'all_tasks' ? 'rgba(200,146,42,0.18)' : 'transparent',
              color: activeTab === 'all_tasks' ? 'var(--color-orange)' : '#94a3b8',
              borderLeft: activeTab === 'all_tasks' ? '3px solid var(--color-orange)' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={18} />
            <span style={{ flex: 1 }}>All Team Deliverables</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              {performanceTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scorecards')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: activeTab === 'scorecards' ? 700 : 500,
              fontSize: '0.88rem',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'scorecards' ? 'rgba(16,185,129,0.18)' : 'transparent',
              color: activeTab === 'scorecards' ? '#10b981' : '#94a3b8',
              borderLeft: activeTab === 'scorecards' ? '3px solid #10b981' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Award size={18} />
            <span style={{ flex: 1 }}>Scorecards Archive</span>
            {allScorecardsList.length > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                {allScorecardsList.length}
              </span>
            )}
          </button>

          {/* Quick Action Button */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => onOpenTaskModal({ assigned_by: leadUser?.name || 'Task Lead' }, 'create')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Assign Deliverable
            </button>
          </div>
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0,0,0,0.25)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{leadUser?.name}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Signed In</p>
          </div>
          <button
            onClick={onSignOut}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Sign Out"
          >
            <LogOut size={14} /> Exit
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', minWidth: 0 }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-orange)', letterSpacing: '0.8px' }}>
                Task Management Portal
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                Lead: {leadUser?.name}
              </span>
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {activeTab === 'my_tasks' ? `Tasks Assigned by ${leadUser?.name}` : activeTab === 'awaiting_review' ? 'Deliverables Awaiting Scorecard Evaluation' : activeTab === 'scorecards' ? 'Official Task Scorecards Archive' : 'All Company Tasks & Deliverables'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Assign tasks, monitor employee progress, evaluate completion, and generate official scorecards.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onRefreshTasks}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '0.55rem 1rem' }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={() => onOpenTaskModal({ assigned_by: leadUser?.name || 'Task Lead' }, 'create')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
            >
              <Plus size={16} /> Assign Task
            </button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {leadUser?.id === 'hr' ? 'Total Deliverables' : `Assigned by ${leadUser?.name}`}
                </p>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800 }}>{myTasksCount}</h3>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(200,146,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-orange)' }}>
                <CheckSquare size={20} />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Progress</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{myInProgCount}</h3>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Clock size={20} />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{
            padding: '1.25rem',
            border: myAwaitingCount > 0 ? '1.5px solid rgba(139,92,246,0.6)' : undefined,
            backgroundColor: myAwaitingCount > 0 ? 'rgba(139,92,246,0.08)' : undefined
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Awaiting Scorecard</p>
                  {myAwaitingCount > 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />}
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#c4b5fd' }}>{myAwaitingCount}</h3>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <FileText size={20} />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scorecards Issued</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{myCompletedCount}</h3>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Rating Awarded</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-orange)' }}>
                  {myEvaluatedList.length > 0 ? `${myAvgScore}%` : '—'}
                </h3>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(200,146,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-orange)' }}>
                <Star size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search deliverables, employee, or instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <select
              className="form-input"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '170px' }}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.short_code || 'EMP'})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Awaiting Scorecard</option>
              <option value="completed">Completed & Evaluated</option>
            </select>

            <select
              className="form-input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '130px' }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="high">⚡ High</option>
              <option value="medium">🔹 Medium</option>
              <option value="low">☕ Low</option>
            </select>

            {(searchQuery || employeeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setEmployeeFilter('all');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Main Content: Tasks or Scorecards Archive */}
        {activeTab === 'scorecards' ? (
          /* SCORECARDS ARCHIVE VIEW */
          <div>
            {allScorecardsList.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <Award size={36} style={{ color: 'var(--color-orange)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Scorecards Issued Yet</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                  Once you evaluate a completed task and issue an appraisal, the official verified Scorecard document will be archived here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {allScorecardsList.map((t) => {
                  const sc = t.scorecard;
                  const pct = sc.percentage || 0;
                  const gradeColor = pct >= 90 ? '#10b981' : pct >= 80 ? '#3b82f6' : pct >= 70 ? '#f59e0b' : '#ef4444';

                  return (
                    <div
                      key={t.id}
                      className="glass-card"
                      style={{
                        padding: '1.35rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {t.category || 'Deliverable'}
                            </span>
                            <h4 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                              {t.title}
                            </h4>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            backgroundColor: `${gradeColor}20`,
                            color: gradeColor
                          }}>
                            {sc.grade || 'Grade A'}
                          </span>
                        </div>

                        {/* Employee info */}
                        <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{t.employee_name}</p>
                          <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                            {t.employee_code || 'EMP'} • {t.employee_position || 'Associate'}
                          </p>
                        </div>

                        {/* Score breakdown bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Score Rating</span>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: gradeColor }}>
                            {sc.totalScore || 0} / 50 ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: gradeColor, borderRadius: '3px' }} />
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Evaluator: <strong style={{ color: '#fff' }}>{sc.evaluatorName || 'Task Lead'}</strong> •{' '}
                          {new Date(sc.evaluationDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          type="button"
                          onClick={() => onOpenScorecardModal(t, 'view')}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <Eye size={14} /> View & Print Scorecard
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenScorecardModal(t, 'evaluate')}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="Edit Evaluation"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* TASKS LIST VIEW */
          <div>
            {performanceLoading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem' }}>
                <Clock size={32} className="animate-spin" style={{ color: 'var(--color-orange)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Loading deliverables and scorecard evaluations...</p>
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <Target size={36} style={{ color: 'var(--color-orange)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Tasks Found</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  {searchQuery || employeeFilter !== 'all' || statusFilter !== 'all'
                    ? 'No deliverables match your current filter parameters. Try resetting your search filters.'
                    : activeTab === 'awaiting_review'
                    ? 'No deliverables currently awaiting your scorecard evaluation. Great job staying on top!'
                    : `No tasks have been assigned by ${leadUser?.name} yet. Click below to assign a new deliverable.`}
                </p>
                <button
                  onClick={() => onOpenTaskModal({ assigned_by: leadUser?.name || 'Task Lead' }, 'create')}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Assign First Deliverable
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visibleTasks.map((task) => {
                  const isSubmitted = task.status === 'submitted';
                  const isCompleted = task.status === 'completed';
                  const isInProgress = task.status === 'in_progress';
                  const isAssigned = task.status === 'assigned';

                  const prio = (task.priority || 'medium').toLowerCase();
                  const prioBadge = prio === 'urgent'
                    ? { label: '🚨 Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
                    : prio === 'high'
                    ? { label: '⚡ High', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
                    : prio === 'low'
                    ? { label: '☕ Low', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' }
                    : { label: '🔹 Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };

                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

                  return (
                    <div
                      key={task.id}
                      className="glass-card"
                      style={{
                        padding: '1.35rem',
                        border: isSubmitted
                          ? '1.5px solid rgba(139,92,246,0.45)'
                          : isCompleted
                          ? '1px solid rgba(16,185,129,0.35)'
                          : '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      {/* Top Row: Meta Badges and Employee Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: prioBadge.bg,
                              color: prioBadge.color
                            }}>
                              {prioBadge.label}
                            </span>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: 'var(--color-text-secondary)'
                            }}>
                              {task.category || 'General'}
                            </span>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: isCompleted ? 'rgba(16,185,129,0.15)' : isSubmitted ? 'rgba(139,92,246,0.18)' : isInProgress ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)',
                              color: isCompleted ? '#10b981' : isSubmitted ? '#a78bfa' : isInProgress ? '#f59e0b' : '#38bdf8'
                            }}>
                              {isCompleted ? '✓ Completed & Evaluated' : isSubmitted ? '⏳ Submitted (Scorecard Ready)' : isInProgress ? '⚙️ In Progress' : '📌 Assigned'}
                            </span>

                            {isOverdue && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(239,68,68,0.2)',
                                color: '#ef4444'
                              }}>
                                ⚠️ Overdue
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
                            {task.title}
                          </h3>

                          {task.description && (
                            <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Assigned Employee & Metadata */}
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          minWidth: '190px',
                          fontSize: '0.78rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div className="avatar-circle" style={{ width: '26px', height: '26px', fontSize: '0.75rem' }}>
                              {(task.employee_name || 'E').charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>{task.employee_name}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{task.employee_code || 'EMP'} • {task.employee_position || 'Associate'}</div>
                            </div>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '4px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                            Assigned By: <strong style={{ color: '#fff' }}>{task.assigned_by || leadUser?.name}</strong>
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Due Date: <strong style={{ color: isOverdue ? '#ef4444' : '#fff' }}>{task.due_date}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Employee Submission Handover Notes (if submitted or completed) */}
                      {task.submission_notes && (
                        <div style={{
                          padding: '10px 14px',
                          backgroundColor: 'rgba(139,92,246,0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(139,92,246,0.25)',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                              Employee Completion Handover
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                              {task.submitted_at ? new Date(task.submitted_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                            "{task.submission_notes}"
                          </p>
                          {task.deliverable_url && (
                            <div style={{ marginTop: '6px' }}>
                              <a
                                href={task.deliverable_url.startsWith('http') ? task.deliverable_url : `https://${task.deliverable_url}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--color-orange)', fontSize: '0.78rem', textDecoration: 'underline' }}
                              >
                                🔗 Open Attached Deliverable / Resource ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Scorecard Preview (if evaluated) */}
                      {task.scorecard && (
                        <div style={{
                          padding: '10px 14px',
                          backgroundColor: 'rgba(16,185,129,0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(16,185,129,0.25)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          fontSize: '0.82rem'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.88rem' }}>
                                {task.scorecard.grade || 'Grade A'} — {task.scorecard.gradeLabel || 'Evaluated'}
                              </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>•</span>
                              <span style={{ fontWeight: 700, color: '#fff' }}>
                                {task.scorecard.totalScore || 0} / 50 ({task.scorecard.percentage || 0}%)
                              </span>
                            </div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                              Evaluated by <strong>{task.scorecard.evaluatorName || leadUser?.name}</strong> on{' '}
                              {new Date(task.scorecard.evaluationDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenScorecardModal(task, 'view')}
                            className="btn btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}
                          >
                            <Award size={14} /> View Scorecard
                          </button>
                        </div>
                      )}

                      {/* Card Bottom Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.15)',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="assigned">Status: Assigned</option>
                            <option value="in_progress">Status: In Progress</option>
                            <option value="submitted">Status: Submitted</option>
                            <option value="completed">Status: Completed</option>
                          </select>

                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            Assigned {new Date(task.assigned_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Prominent Scorecard Button for Lead */}
                          {isSubmitted || !task.scorecard ? (
                            <button
                              type="button"
                              onClick={() => onOpenScorecardModal(task, 'evaluate')}
                              className="btn btn-primary"
                              style={{
                                padding: '5px 14px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: isSubmitted ? 'var(--color-orange)' : undefined,
                                color: isSubmitted ? '#000' : undefined,
                                fontWeight: 700
                              }}
                            >
                              <Star size={14} /> {task.scorecard ? 'Update Scorecard' : 'Fill Scorecard'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenScorecardModal(task, 'evaluate')}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Scorecard"
                            >
                              <Edit3 size={13} /> Edit Scorecard
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenTaskModal(task, 'edit')}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                            title="Edit Deliverable"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => onDeleteTask(task, e)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
