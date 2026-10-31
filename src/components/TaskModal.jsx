import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Plus, Send, Clock, User, Calendar, Tag, FileText, CheckSquare } from 'lucide-react';
import supabase from '../lib/supabaseClient';

export const TaskModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit' | 'submit'
  task = null,
  employees = [],
  currentUser = null,
  onTaskSaved = () => {}
}) => {
  if (!isOpen) return null;

  const isSubmitMode = mode === 'submit';
  const isEditMode = mode === 'edit';

  // Form State for Create/Edit
  const [selectedEmpId, setSelectedEmpId] = useState(task?.employee_id || (employees[0]?.id || ''));
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState(task?.category || 'Operations');
  const [priority, setPriority] = useState(task?.priority || 'High');
  const [dueDate, setDueDate] = useState(() => {
    if (task?.due_date) return task.due_date.split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState(task?.description || '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimated_hours || '8');
  const [assignedBy, setAssignedBy] = useState(task?.assigned_by || currentUser?.name || 'Task Lead');

  // Form State for Employee Submission
  const [submissionNotes, setSubmissionNotes] = useState(task?.submission_notes || '');
  const [deliverableUrl, setDeliverableUrl] = useState(task?.deliverable_url || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Create or Edit Task by Ruchi
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }
    if (!selectedEmpId) {
      setErrorMsg('Please select an employee to assign this task.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const selectedEmp = employees.find(emp => emp.id === selectedEmpId);
      const taskId = task?.id || `task_${Date.now()}`;
      const now = new Date().toISOString();

      const taskPayload = {
        id: taskId,
        employee_id: selectedEmpId,
        employee_name: selectedEmp?.full_name || task?.employee_name || 'Employee',
        employee_code: selectedEmp?.short_code || task?.employee_code || 'TOSBS',
        employee_position: selectedEmp?.position || task?.employee_position || 'Associate',
        title: title.trim(),
        category: category,
        priority: priority,
        due_date: dueDate,
        description: description.trim(),
        estimated_hours: estimatedHours,
        assigned_by: assignedBy.trim() || currentUser?.name || 'Task Lead',
        assigned_at: task?.assigned_at || now,
        status: task?.status || 'assigned',
        submission_notes: task?.submission_notes || '',
        submitted_at: task?.submitted_at || null,
        completed_at: task?.completed_at || null,
        scorecard: task?.scorecard || null,
        updated_at: now
      };

      const fileName = `TOSBS_Task_${taskId}.json`;

      if (isEditMode && task?.doc_id) {
        // Update existing document in employee_documents
        const { error: updErr } = await supabase
          .from('employee_documents')
          .update({
            employee_id: selectedEmpId,
            file_name: fileName,
            file_url: JSON.stringify(taskPayload),
            uploaded_at: now
          })
          .eq('id', task.doc_id);
        if (updErr) throw updErr;
      } else {
        // Insert new document in employee_documents
        const { data: insData, error: insErr } = await supabase
          .from('employee_documents')
          .insert([{
            employee_id: selectedEmpId,
            document_type: 'performance_task',
            file_name: fileName,
            file_url: JSON.stringify(taskPayload),
            uploaded_at: now
          }])
          .select();
        if (insErr) throw insErr;
        if (insData && insData[0]) {
          taskPayload.doc_id = insData[0].id;
        }
      }

      setSuccessMsg(isEditMode ? 'Task updated successfully!' : 'Task assigned to employee successfully!');
      onTaskSaved(taskPayload);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving task:', err);
      setErrorMsg(err.message || 'Failed to save task.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Employee Task Submission
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!submissionNotes.trim()) {
      setErrorMsg('Please enter your completion summary/notes before submitting.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = new Date().toISOString();
      const updatedTaskPayload = {
        ...task,
        status: 'submitted',
        submission_notes: submissionNotes.trim(),
        deliverable_url: deliverableUrl.trim(),
        submitted_at: now,
        updated_at: now
      };

      if (task.doc_id) {
        const { error: updErr } = await supabase
          .from('employee_documents')
          .update({
            file_url: JSON.stringify(updatedTaskPayload),
            uploaded_at: now
          })
          .eq('id', task.doc_id);
        if (updErr) throw updErr;
      }

      setSuccessMsg('Task submitted successfully! Lead will review and evaluate your deliverables.');
      onTaskSaved(updatedTaskPayload);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Error submitting task:', err);
      setErrorMsg(err.message || 'Failed to submit task.');
    } finally {
      setIsLoading(false);
    }
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
        maxWidth: '620px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.25s ease',
        border: '1px solid rgba(200,146,42,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
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
              {isSubmitMode ? <Send size={20} /> : <CheckSquare size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                {isSubmitMode ? 'Submit Completed Task' : isEditMode ? 'Edit Assigned Task' : 'Assign New Task'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {isSubmitMode ? 'Send deliverable to your manager to evaluate & issue your scorecard' : 'TOSBS Task Management System'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {successMsg && (
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
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
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
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUBMIT MODE (FOR EMPLOYEE) */}
          {isSubmitMode ? (
            <form onSubmit={handleSubmitTask}>
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Task Deliverable
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <span>Category: <strong style={{ color: 'var(--color-orange)' }}>{task.category}</strong></span>
                  <span>•</span>
                  <span>Due: <strong style={{ color: '#fff' }}>{task.due_date}</strong></span>
                  <span>•</span>
                  <span>Assigned By: <strong style={{ color: '#fff' }}>{task.assigned_by || 'Task Lead'}</strong></span>
                </div>
                {task.description && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {task.description}
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Completion Summary & Handover Notes *
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  required
                  placeholder="Detail the actions taken, milestones completed, and where files/deliverables are saved..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">
                  Deliverable Link / File URL (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google Drive link, GitHub repository, Sheet link, or shared folder"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={16} /> {isLoading ? 'Submitting...' : (task?.assigned_by ? `Submit to ${task.assigned_by}` : 'Submit Deliverable')}
                </button>
              </div>
            </form>
          ) : (
            /* CREATE / EDIT MODE (FOR RUCHI / HR ADMIN) */
            <form onSubmit={handleSaveTask}>
              {/* Employee Selector */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">Assign To Employee *</label>
                <select
                  className="form-input"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.short_code || 'EMP'}) — {emp.position || 'Associate'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">Task Title / Deliverable *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q3 Vendor Reconciliation & Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Row: Category & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category / Department</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Operations">Operations</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="Client Servicing">Client Servicing</option>
                    <option value="Technical & Development">Technical & Development</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="HR & Compliance">HR & Compliance</option>
                    <option value="General">General Deliverable</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Urgent">🚨 Urgent</option>
                    <option value="High">⚡ High</option>
                    <option value="Medium">🔹 Medium</option>
                    <option value="Low">☕ Low</option>
                  </select>
                </div>
              </div>

              {/* Row: Due Date & Estimated Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Est. Hours</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="8"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                </div>
              </div>

              {/* Description & Deliverables */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">Task Objective & Instructions</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Clearly outline the scope, deliverables expected, and any key links or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Assigned By */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Assigned By</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignedBy}
                  onChange={(e) => setAssignedBy(e.target.value)}
                  placeholder="e.g. Amar, Ruchi, Riya, or HR Admin"
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> {isLoading ? 'Saving...' : isEditMode ? 'Update Task' : 'Assign Task'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
