import React, { useState, useEffect } from 'react';
import * as XLSX from "xlsx";
import supabase from './lib/supabaseClient';
import LineChart from './components/LineChart';
import DigiLockerModal from './components/DigiLockerModal';
import { saveAs } from "file-saver";
import {
  Users, UserCheck, ShieldAlert, Award,
  Plus, Search, Copy, Check, X, Clock, Eye, Trash2,
  LogOut, LayoutDashboard, FileText, CheckCircle2,
  Lock, ArrowRight, MapPin, Building, CreditCard, Bell, CalendarDays, Gift,
  UserMinus, AlertCircle, Calendar
} from 'lucide-react';
// Festival calendar — auto-checked against today's date, no manual entry needed.
// Fixed-date festivals repeat every year. Movable ones (Holi, Eid, Diwali, etc.)
// follow the lunar/lunisolar calendar and must be updated each year — dates below are for 2026.
const FESTIVALS = [
  // Fixed national days
  { month: '01', day: '01', name: "New Year's Day", emoji: '🎊' },
  { month: '01', day: '26', name: 'Republic Day', emoji: '🇮🇳' },
  { month: '08', day: '15', name: 'Independence Day', emoji: '🇮🇳' },
  { month: '10', day: '02', name: 'Gandhi Jayanti', emoji: '🕊️' },
  { month: '12', day: '25', name: 'Christmas', emoji: '🎄' },
  // Movable festivals — 2026 dates
  { month: '03', day: '04', name: 'Holi', emoji: '🎨' },
  { month: '03', day: '21', name: 'Eid al-Fitr', emoji: '🌙' },
  { month: '05', day: '28', name: 'Eid al-Adha', emoji: '🐐' },
  { month: '08', day: '28', name: 'Raksha Bandhan', emoji: '🎗️' },
  { month: '09', day: '14', name: 'Ganesh Chaturthi', emoji: '🐘' },
  { month: '10', day: '19', name: 'Dussehra', emoji: '🏹' },
  { month: '11', day: '06', name: 'Dhanteras', emoji: '🪔' },
  { month: '11', day: '08', name: 'Diwali', emoji: '🪔' },
  { month: '11', day: '10', name: 'Bhai Dooj', emoji: '🎗️' },
];

const getTodaysFestivals = () => {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return FESTIVALS.filter(f => f.month === mm && f.day === dd);
};

const getAnnouncementDates = (ann) => {
  if (!ann) return { startDate: '', endDate: '', cleanMessage: '' };
  let startDate = ann.scheduled_date || ann.start_date || (ann.created_at ? ann.created_at.split('T')[0] : '');
  let endDate = ann.end_date || '';
  let rawMsg = ann.message || '';
  if (!endDate && rawMsg.includes('<!--END_DATE:')) {
    const match = rawMsg.match(/<!--END_DATE:(.*?)-->/);
    if (match) endDate = match[1];
  }
  const cleanMessage = rawMsg.replace(/<!--END_DATE:.*?-->/g, '').trim();
  return { startDate, endDate, cleanMessage };
};

function App() {
  const [currentView, setCurrentView] = useState('splash');
  const [inviteToken, setInviteToken] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', start_date: '', end_date: '', scheduled_date: '', image_url: '' });
  const [announcementImageFile, setAnnouncementImageFile] = useState(null);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentPopupAnnouncement, setCurrentPopupAnnouncement] = useState(null); 
  const [hrUser, setHrUser] = useState(null);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pendingVerify: 0, pendingReview: 0 });
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [hrLoginError, setHrLoginError] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPersonalEmail, setNewEmpPersonalEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Engineering');
  const [newEmpDesg, setNewEmpDesg] = useState('Software Engineer');
  const [newEmpTempPassword, setNewEmpTempPassword] = useState('');
  const [newEmpShortCode, setNewEmpShortCode] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedEmpDetails, setSelectedEmpDetails] = useState(null);
  const [selectedEmpVerification, setSelectedEmpVerification] = useState(null);
  const [selectedEmpDocs, setSelectedEmpDocs] = useState([]);
  const [isEditingEmp, setIsEditingEmp] = useState(false);
  const [editEmpForm, setEditEmpForm] = useState({
    position: '', phone_number: '', dob: '', gender: 'Male',
    permanent_address: '', current_address: '', father_name: '', mother_name: '',
    marital_status: 'Single', spouse_name: '', emergency_contact1: '', emergency_contact2: '',
    aadhaar_masked: '', pan_number: '', name_on_aadhaar: '', dob_on_aadhaar: '',
  });
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTempPassword, setRegTempPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [declaration, setDeclaration] = useState({
    authenticityInitial: '', conflictType: 'none', conflictDetails: '',
    ndaInitial: '', codeInitial: '', medicalInitial: '', place: '', agreed: false,
  });
  const [empLoginEmail, setEmpLoginEmail] = useState('');
  const [empLoginPassword, setEmpLoginPassword] = useState('');
  const [empLoginError, setEmpLoginError] = useState('');
  // Short code + PIN login
  const [shortCode, setShortCode] = useState('');
  const [shortCodePin, setShortCodePin] = useState('');
  const [shortCodeError, setShortCodeError] = useState('');
  const [shortCodeLoading, setShortCodeLoading] = useState(false);
  const [activeEmpDetails, setActiveEmpDetails] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardPersonal, setWizardPersonal] = useState({
    phone: '', personalEmail: '', dob: '', dateOfJoining: '', gender: 'Male',
    permanentAddress: '', currentAddress: '', fatherName: '', fatherDob: '',
    motherName: '', motherDob: '', maritalStatus: 'Single', spouseName: '', spouseDob: '',
    numberOfKids: '0', child1Name: '', child1Dob: '', child2Name: '', child2Dob: '',
    emergencyContact1: '', emergencyContact2: '',
  });
  const [educationHistory, setEducationHistory] = useState([{ degree: 'B.Tech Computer Science', institution: 'State Tech University', year: '2018', grade: 'A+' }]);
  const [addressCoords, setAddressCoords] = useState(null);
  const [employmentHistory, setEmploymentHistory] = useState([{ company: 'Innovate Tech Labs', role: 'Junior Web Developer', startDate: '2019-06-01', endDate: '2022-12-31' }]);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationVerifyStatus, setLocationVerifyStatus] = useState('idle');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [locationDistance, setLocationDistance] = useState(null);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', ifscCode: '', branchName: '', uanNumber: '', pfNumber: '' });
  const [digiLockerDetails, setDigiLockerDetails] = useState(null);
  const [isDigiModalOpen, setIsDigiModalOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docUploadState, setDocUploadState] = useState({ photo: null, signature: null, degree: null });
  const [selfieImage, setSelfieImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [hrSearchQuery, setHrSearchQuery] = useState('');
  const [hrActiveTab, setHrActiveTab] = useState('analytics');

  // Attendance state
  const [attendanceTab, setAttendanceTab] = useState('overview');
  const [showWfhOption, setShowWfhOption] = useState(false);
  const [wfhPendingData, setWfhPendingData] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendancePhoto, setAttendancePhoto] = useState(null);
  const [isAttendanceCameraOpen, setIsAttendanceCameraOpen] = useState(false);
  const [attendanceStream, setAttendanceStream] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const attendanceVideoRef = React.useRef(null);
  const attendanceCanvasRef = React.useRef(null);
  const [isMarkingManual, setIsMarkingManual] = useState(false);
  const [manualAttendance, setManualAttendance] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'present', work_type: 'office', note: '' });
  const [hrAttendanceDate, setHrAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [hrAttendanceData, setHrAttendanceData] = useState([]);
  const [hrAttendanceEmployee, setHrAttendanceEmployee] = useState('all');
  const [hrAttendanceView, setHrAttendanceView] = useState('daily');
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summaryData, setSummaryData] = useState([]);

  // Leave state
    const [leaveApplications, setLeaveApplications] = useState([]);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryConfig, setSalaryConfig] = useState({ monthly_ctc: 0, overtime_multiplier: 1.5 });
  const [salaryBreakdown, setSalaryBreakdown] = useState(null);
  const [hrSalaryEmployee, setHrSalaryEmployee] = useState('');
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [hrLeaveApplications, setHrLeaveApplications] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'CL', from_date: '', to_date: '', reason: '' });
  const [leaveFormError, setLeaveFormError] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  // Reimbursement state
  const [reimbursements, setReimbursements] = useState([]);
  const [hrReimbursements, setHrReimbursements] = useState([]);
  const [reimbForm, setReimbForm] = useState({
    date: new Date().toISOString().split('T')[0],
    client_name: '',
    work_description: '',
    start_time: '',
    end_time: '',
    expenses: [{ category: 'Travel', description: '', amount: '' }],
    receipt_url: '',
  });
  const [reimbFormError, setReimbFormError] = useState('');
  const [reimbSubmitting, setReimbSubmitting] = useState(false);
  const [reimbReceiptFile, setReimbReceiptFile] = useState(null);

  // Notifications & Wishes state
  const [celebrations, setCelebrations] = useState([]);
  const [sentWishesToday, setSentWishesToday] = useState([]);
  const [wishesReceived, setWishesReceived] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [festivalsToday, setFestivalsToday] = useState([]);

  // Resignation state
  const [hrResignations, setHrResignations] = useState([]);
  const [myResignation, setMyResignation] = useState(null);
  const [resignationForm, setResignationForm] = useState({ reason: '', requested_last_day: '', notes: '' });
  const [resignationSubmitting, setResignationSubmitting] = useState(false);
  const [resignationError, setResignationError] = useState('');
  const [hrResignFilter, setHrResignFilter] = useState('all');
  const [hrResignActions, setHrResignActions] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const role = session.user.user_metadata?.role;
      if (role === 'hr') {
        setHrUser({ email: session.user.email, name: 'HR Admin' });
        setCurrentView('hr-dashboard');
        loadHrCelebrations();
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('auth_user_id', session.user.id).single();
        if (data) {
          if (['resigned', 'deactivated', 'inactive'].includes(data.status)) {
            await supabase.auth.signOut();
            alert('Your account has been deactivated as your notice period and offboarding are complete. Please contact HR for any queries.');
            return;
          }
          if (['digilocker_verified', 'approved'].includes(data.status)) {
            setActiveEmployee(data);
            loadActiveEmployeeDetails(data.id);
            setCurrentView('employee-status');
            loadTodayAttendance(data.id);
            loadAttendanceHistory(data.id);
            loadEmployeeLeaves(data.id);
            loadCelebrationsAndNotifications(data.id);
            loadEmployeeResignation(data.id);
          }
        }
      }
    });

    const params = new URLSearchParams(window.location.search);

    // Handle DigiLocker OAuth callback
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      handleDigiLockerCallback(code, state);
      return;
    }

    // Manual HR access via URL param (?hr=1), in addition to the small link on splash
    if (params.get('hr') === '1') { setCurrentView('hr-login'); return; }

    // Handle invite token
    const token = params.get('token');
    if (token) { setInviteToken(token); validateInviteToken(token); }
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
      const total = data.length;
      const completed = data.filter(e => e.status === 'approved').length;
      const pendingVerify = data.filter(e => e.status === 'registered' || e.status === 'details_filled').length;
      const pendingReview = data.filter(e => e.status === 'digilocker_verified').length;
      setStats({ total, completed, pendingVerify, pendingReview });
    } catch (err) { console.error('Error loading employees:', err); }
  };

  useEffect(() => { if (hrUser) loadEmployees(); }, [hrUser]);

  const validateInviteToken = async (tokenInput) => {
    if (!tokenInput) return;
    let cleanToken = tokenInput.trim();
    if (cleanToken.includes('?token=')) {
      try { const u = new URLSearchParams(cleanToken.substring(cleanToken.indexOf('?'))); cleanToken = u.get('token') || cleanToken; } catch (e) {}
    } else if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1]?.split('&')[0] || cleanToken;
    }
    setRegError('');
    try {
      // 1. Direct Supabase check by short_code (case-insensitive) or invite_token
      let profile = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`short_code.ilike.${cleanToken},invite_token.eq.${cleanToken}`)
          .maybeSingle();
        if (data) profile = data;
      } catch (e) {}

      // Fallback check on invite_token directly (case-insensitive)
      if (!profile) {
        try {
          const { data } = await supabase.from('profiles').select('*').ilike('invite_token', cleanToken).maybeSingle();
          if (data) profile = data;
        } catch (e) {}
      }

      // 2. Fallback to edge function if not found
      if (!profile) {
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/validate-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: cleanToken })
          });
          const result = await res.json();
          if (result && result.profile) profile = result.profile;
        } catch (e) {}
      }

      if (!profile) {
        setRegError('Invalid or expired Short Code / Invite Token. Please check with HR.');
        return;
      }

      setActiveEmployee(profile);
      if (profile.status === 'invited') {
        setCurrentView('employee-register');
      } else if (['digilocker_verified', 'approved'].includes(profile.status)) {
        loadActiveEmployeeDetails(profile.id);
        setCurrentView('employee-status');
        loadTodayAttendance(profile.id);
        loadAttendanceHistory(profile.id);
        loadEmployeeLeaves(profile.id);
        loadCelebrationsAndNotifications(profile.id);
      } else {
        // 'registered' or 'details_filled'
        const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', profile.id).maybeSingle();
        if (details) {
          setWizardPersonal({
            phone: details.phone_number || '', personalEmail: details.personal_email || '', dob: details.dob || '',
            dateOfJoining: details.date_of_joining || '', gender: details.gender || 'Male',
            permanentAddress: details.permanent_address || '', currentAddress: details.current_address || '',
            fatherName: details.father_name || '', fatherDob: details.father_dob || '',
            motherName: details.mother_name || '', motherDob: details.mother_dob || '',
            maritalStatus: details.marital_status || 'Single', spouseName: details.spouse_name || '', spouseDob: details.spouse_dob || '',
            numberOfKids: details.number_of_kids?.toString() || '0',
            child1Name: details.child1_name || '', child1Dob: details.child1_dob || '',
            child2Name: details.child2_name || '', child2Dob: details.child2_dob || '',
            emergencyContact1: details.emergency_contact1 || '', emergencyContact2: details.emergency_contact2 || '',
          });
          if (details.education_history) setEducationHistory(details.education_history);
          if (details.employment_history) setEmploymentHistory(details.employment_history);
        }
        setCurrentView('employee-wizard');
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setRegError('Failed to validate code. Please try again.');
    }
  };
const handleHrLogin = (e) => {
  e.preventDefault();
  setHrLoginError('');
  if (hrEmail === 'hrtosbs' && hrPassword === 'tosbs@011') {
    setHrUser({ email: hrEmail, name: 'HR Admin' });
    setHrLoginError('');
    setCurrentView('hr-dashboard');
    loadHrCelebrations();
  } else {
    setHrLoginError('Invalid username or password.');
  }
};

  const handleShortCodeLogin = async () => {
    const code = shortCode.trim().toUpperCase();
    const pin = shortCodePin.trim();
    if (!code || !pin) { setShortCodeError('Please enter both your short code and PIN.'); return; }
    setShortCodeLoading(true);
    setShortCodeError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('short_code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setShortCodeError('Short code not found. Please check with HR.'); setShortCodeLoading(false); return; }
      if ((data.employee_pin || '').trim() !== pin) { setShortCodeError('Incorrect PIN. Please check with HR.'); setShortCodeLoading(false); return; }

      setActiveEmployee(data);

      if (['digilocker_verified', 'approved'].includes(data.status)) {
        loadActiveEmployeeDetails(data.id);
        setCurrentView('employee-status');
        loadTodayAttendance(data.id);
        loadAttendanceHistory(data.id);
        loadEmployeeLeaves(data.id);
        loadCelebrationsAndNotifications(data.id);
      } else {
        // First-time or mid-wizard employee → go to onboarding wizard
        const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', data.id).single();
        if (details) {
          if (details.education_history) setEducationHistory(details.education_history);
          if (details.employment_history) setEmploymentHistory(details.employment_history);
          setWizardPersonal({
            phone: details.phone_number || '', personalEmail: details.personal_email || '',
            dob: details.dob || '', dateOfJoining: details.date_of_joining || '',
            gender: details.gender || 'Male', permanentAddress: details.permanent_address || '',
            currentAddress: details.current_address || '', fatherName: details.father_name || '',
            fatherDob: details.father_dob || '', motherName: details.mother_name || '',
            motherDob: details.mother_dob || '', maritalStatus: details.marital_status || 'Single',
            spouseName: details.spouse_name || '', spouseDob: details.spouse_dob || '',
            numberOfKids: details.number_of_kids?.toString() || '0',
            child1Name: details.child1_name || '', child1Dob: details.child1_dob || '',
            child2Name: details.child2_name || '', child2Dob: details.child2_dob || '',
            emergencyContact1: details.emergency_contact1 || '', emergencyContact2: details.emergency_contact2 || '',
          });
          if (data.status === 'details_filled') setWizardStep(4);
          else setWizardStep(2);
        }
        setCurrentView('employee-wizard');
      }
    } catch (err) {
      console.error(err);
      setShortCodeError('Something went wrong. Please try again.');
    }
    setShortCodeLoading(false);
  };

  const handleEmployeeLogin = async (e) => {
  e.preventDefault();
  setEmpLoginError('');
  if (!empLoginEmail || !empLoginPassword) { setEmpLoginError('Please enter your email and password.'); return; }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', empLoginEmail.trim().toLowerCase())
      .single();

    if (error || !data) { setEmpLoginError('No account found with this email.'); return; }
    if (data.status === 'invited') { setEmpLoginError('Please use your invite link to register first.'); return; }
    if (['resigned', 'deactivated', 'inactive'].includes(data.status)) {
      setEmpLoginError('Your account has been deactivated as your notice period and offboarding are complete. Please contact HR for assistance.');
      return;
    }
    if ((data.login_password || '').trim() !== empLoginPassword.trim()) { setEmpLoginError('Incorrect password.'); return; }
    setActiveEmployee(data);
    const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', data.id).single();

    if (details) {
      if (['digilocker_verified', 'approved'].includes(data.status)) {
        loadActiveEmployeeDetails(data.id);
        setCurrentView('employee-status');
        loadTodayAttendance(data.id);
        loadAttendanceHistory(data.id);
        loadEmployeeLeaves(data.id);
        loadCelebrationsAndNotifications(data.id);
        loadEmployeeResignation(data.id);
      } else {
        setWizardPersonal({
          phone: details.phone_number || '', personalEmail: details.personal_email || '', dob: details.dob || '',
          dateOfJoining: details.date_of_joining || '', gender: details.gender || 'Male',
          permanentAddress: details.permanent_address || '', currentAddress: details.current_address || '',
          fatherName: details.father_name || '', fatherDob: details.father_dob || '',
          motherName: details.mother_name || '', motherDob: details.mother_dob || '',
          maritalStatus: details.marital_status || 'Single', spouseName: details.spouse_name || '', spouseDob: details.spouse_dob || '',
          numberOfKids: details.number_of_kids?.toString() || '0',
          child1Name: details.child1_name || '', child1Dob: details.child1_dob || '',
          child2Name: details.child2_name || '', child2Dob: details.child2_dob || '',
          emergencyContact1: details.emergency_contact1 || '', emergencyContact2: details.emergency_contact2 || '',
        });
        if (details.education_history) setEducationHistory(details.education_history);
        if (details.employment_history) setEmploymentHistory(details.employment_history);
        if (details.location_verified != null) {
          setLocationVerified(details.location_verified);
          setLocationVerifyStatus(details.location_verified ? 'success' : 'skipped');
        }
        if (details.location_distance_m) setLocationDistance(details.location_distance_m);
        if (data.status === 'details_filled') setWizardStep(4);
        else setWizardStep(2);
        setCurrentView('employee-wizard');
      }
    } else {
      setCurrentView('employee-wizard');
    }
  } catch (err) {
    console.error(err);
    setEmpLoginError('Something went wrong. Please try again.');
  }
};

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail) { alert('Please fill in Name and Email.'); return; }
    const generatedUuid = window.crypto.randomUUID().toLowerCase();
    const code = (newEmpShortCode.trim() || `TOSBS${Math.floor(10 + Math.random() * 90)}`).toUpperCase();
    const tempPass = newEmpTempPassword.trim() || 'Welcome@123';
    try {
      const newRecord = {
        id: generatedUuid,
        full_name: newEmpName,
        email: newEmpEmail.trim().toLowerCase(),
        position: `${newEmpDept} - ${newEmpDesg}`,
        role: 'employee',
        status: 'invited',
        short_code: code,
        invite_token: code,
        temp_password: tempPass,
        created_at: new Date().toISOString(),
      };
      let { error } = await supabase.from('profiles').insert([newRecord]);
      if (error && error.message?.includes('short_code')) {
        // Fallback without short_code column (invite_token stores the short code)
        const recordWithoutShortCode = { ...newRecord };
        delete recordWithoutShortCode.short_code;
        const res = await supabase.from('profiles').insert([recordWithoutShortCode]);
        error = res.error;
      }
      if (error) throw error;
      setGeneratedInviteLink(code);
      setNewEmpName(''); setNewEmpEmail(''); setNewEmpPersonalEmail('');
      setNewEmpShortCode(''); setNewEmpTempPassword('');
      loadEmployees();
    } catch (err) {
      console.error('Error creating employee:', err);
      alert('Failed to create employee. If the short code is already taken, please choose another.');
    }
  };

  const copyInviteLink = () => { navigator.clipboard.writeText(generatedInviteLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };

  const handleDeleteEmployee = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this employee onboarding profile?')) {
      try { await supabase.from('profiles').delete().eq('id', id); loadEmployees(); if (selectedEmp?.id === id) setCurrentView('hr-dashboard'); }
      catch (err) { console.error(err); }
    }
  };

  const loadActiveEmployeeDetails = async (empId) => {
    try {
      const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', empId).single();
      const { data: verify } = await supabase.from('digilocker_verifications').select('*').eq('employee_id', empId).single();
      const { data: docs } = await supabase.from('employee_documents').select('*').eq('employee_id', empId);
      setActiveEmpDetails({ ...details, digilocker: verify, docs: docs || [] });
    } catch (err) { console.error(err); }
  };

  const handleInspectEmployee = async (emp) => {
    setSelectedEmp(emp); setCurrentView('hr-employee-detail');
    try {
      const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', emp.id).single();
      setSelectedEmpDetails(details);
      const { data: verify } = await supabase.from('digilocker_verifications').select('*').eq('employee_id', emp.id).single();
      setSelectedEmpVerification(verify);
      const { data: docs } = await supabase.from('employee_documents').select('*').eq('employee_id', emp.id);
      setSelectedEmpDocs(docs || []);
    } catch (err) { console.error('Error loading inspector details:', err); }
  };

  const handlePhotoVerdict = async (id, verdict) => {
    try {
      await supabase.from('profiles').update({ photo_status: verdict }).eq('id', id);
      setSelectedEmp(prev => prev ? { ...prev, photo_status: verdict } : null);
      alert(verdict === 'photo_approved' ? 'Photo approved successfully.' : 'Photo rejected. Employee will be notified.');
    } catch (err) { console.error(err); }
  };

  const startEditingEmployee = () => {
    setEditEmpForm({
      position: selectedEmp.position || '',
      phone_number: selectedEmpDetails?.phone_number || '',
      dob: selectedEmpDetails?.dob || '',
      gender: selectedEmpDetails?.gender || 'Male',
      permanent_address: selectedEmpDetails?.permanent_address || '',
      current_address: selectedEmpDetails?.current_address || '',
      father_name: selectedEmpDetails?.father_name || '',
      mother_name: selectedEmpDetails?.mother_name || '',
      marital_status: selectedEmpDetails?.marital_status || 'Single',
      spouse_name: selectedEmpDetails?.spouse_name || '',
      emergency_contact1: selectedEmpDetails?.emergency_contact1 || '',
      emergency_contact2: selectedEmpDetails?.emergency_contact2 || '',
      aadhaar_masked: selectedEmpVerification?.aadhaar_masked || '',
      pan_number: selectedEmpVerification?.pan_number || '',
      name_on_aadhaar: selectedEmpVerification?.name_on_aadhaar || '',
      dob_on_aadhaar: selectedEmpVerification?.dob_on_aadhaar || '',
    });
    setIsEditingEmp(true);
  };

  const handleSaveEmployeeEdits = async () => {
    try {
      await supabase.from('profiles').update({ position: editEmpForm.position }).eq('id', selectedEmp.id);
      await supabase.from('employee_details').upsert({
        employee_id: selectedEmp.id,
        phone_number: editEmpForm.phone_number,
        dob: editEmpForm.dob || null,
        gender: editEmpForm.gender,
        permanent_address: editEmpForm.permanent_address,
        current_address: editEmpForm.current_address,
        father_name: editEmpForm.father_name,
        mother_name: editEmpForm.mother_name,
        marital_status: editEmpForm.marital_status,
        spouse_name: editEmpForm.spouse_name,
        emergency_contact1: editEmpForm.emergency_contact1,
        emergency_contact2: editEmpForm.emergency_contact2,
      }, { onConflict: 'employee_id' });
      await supabase.from('digilocker_verifications').upsert({
        employee_id: selectedEmp.id,
        aadhaar_masked: editEmpForm.aadhaar_masked,
        pan_number: editEmpForm.pan_number,
        name_on_aadhaar: editEmpForm.name_on_aadhaar,
        dob_on_aadhaar: editEmpForm.dob_on_aadhaar || null,
      }, { onConflict: 'employee_id' });

      setSelectedEmp(prev => ({ ...prev, position: editEmpForm.position }));
      setIsEditingEmp(false);
      handleInspectEmployee({ ...selectedEmp, position: editEmpForm.position });
      loadEmployees();
    } catch (err) {
      console.error('Error saving employee edits:', err);
      alert('Failed to save changes. Check console for details.');
    }
  };

  const handleApproveOnboarding = async (id) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      setSelectedEmp(prev => prev ? { ...prev, status: 'approved' } : null);
      loadEmployees();
      alert('Employee Onboarding Profile has been approved successfully!');
    } catch (err) { console.error(err); }
  };

  const handleEmployeeRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regTempPassword) { setRegError('Please enter the temporary password shared by HR.'); return; }
    if (activeEmployee.temp_password && regTempPassword.trim() !== activeEmployee.temp_password.trim()) {
      setRegError('Incorrect temporary password. Please check with HR.');
      return;
    }
    if (regPassword !== regConfirmPassword) { setRegError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }

    try {
      let authUserId = null;
      try {
        const { data } = await supabase.auth.signUp({
          email: activeEmployee.email,
          password: regPassword,
        });
        if (data?.user?.id) {
          authUserId = data.user.id;
        }
      } catch (authErr) {
        console.warn('Supabase Auth signUp note:', authErr);
      }

      const updatePayload = {
        status: 'registered',
        login_password: regPassword,
      };
      if (authUserId) {
        updatePayload.auth_user_id = authUserId;
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', activeEmployee.id);

      if (dbError) throw dbError;

      setActiveEmployee(prev => ({ ...prev, ...updatePayload }));
      setCurrentView('employee-wizard');
    } catch (err) {
      console.error('Registration error:', err);
      setRegError(err.message || 'Something went wrong creating your account. Try again.');
    }
  };

  const addEducationRow = () => setEducationHistory([...educationHistory, { degree: '', institution: '', year: '', grade: '' }]);
  const removeEducationRow = (i) => setEducationHistory(educationHistory.filter((_, idx) => idx !== i));
  const addEmploymentRow = () => setEmploymentHistory([...employmentHistory, { company: '', role: '', startDate: '', endDate: '' }]);
  const removeEmploymentRow = (i) => setEmploymentHistory(employmentHistory.filter((_, idx) => idx !== i));

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = mediaStream; }, 100);
    } catch (err) {
      alert('Could not access camera. Please allow camera permission and try again.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsCameraOpen(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setSelfieImage(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
  };

  const handleFileUpload = (type, e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocUploadState(prev => ({ ...prev, [type]: file.name }));
      const newDoc = { employee_id: activeEmployee.id, document_type: type, file_name: file.name, file_url: reader.result };
      setUploadedDocs(prev => [...prev.filter(d => d.document_type !== type), newDoc]);
    };
    reader.readAsDataURL(file);
  };

  const geocodeAddress = async (addressString) => {
    const attempts = [
      addressString,
      addressString.replace(/^[^,]+,?\s*/, ''),
      addressString.split(' ').slice(-3).join(' '),
      addressString.split(' ').slice(-2).join(' '),
    ];
    for (const query of attempts) {
      if (!query || query.trim().length < 4) continue;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=1&countrycodes=in`, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TOSBS-Onboarding/1.0' } });
        const data = await res.json();
        if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } catch { continue; }
    }
    return null;
  };

  const searchAddressSuggestions = async (query) => {
    if (!query || query.trim().length < 3) { setAddressSuggestions([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TOSBS-Onboarding/1.0' } });
      const data = await res.json();
      setAddressSuggestions(data || []);
      setShowSuggestions(true);
    } catch { setAddressSuggestions([]); }
  };

  const handleAddressInputChange = (value) => {
    setWizardPersonal(prev => ({ ...prev, currentAddress: value }));
    setAddressCoords(null);
    if (addressSearchTimeout) clearTimeout(addressSearchTimeout);
    setAddressSearchTimeout(setTimeout(() => searchAddressSuggestions(value), 400));
  };

  const selectAddressSuggestion = (suggestion) => {
    setWizardPersonal(prev => ({ ...prev, currentAddress: suggestion.display_name }));
    setAddressCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const haversineDistance = (a, b) => {
    const R = 6371000, toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  };

  const handleVerifyLocation = async () => {
    setLocationVerifyStatus('checking');
    if (!wizardPersonal.currentAddress) { alert('No current address found. Go back to Step 1.'); setLocationVerifyStatus('idle'); return; }
    const geocoded = await geocodeAddress(wizardPersonal.currentAddress);
    if (!geocoded) { alert('Could not find your address. Please be more specific.'); setLocationVerifyStatus('failed'); return; }
    setAddressCoords(geocoded);
    if (!navigator.geolocation) { alert('Your browser does not support location access.'); setLocationVerifyStatus('failed'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = haversineDistance(geocoded, gps);
        setLocationDistance(Math.round(dist));
        if (dist <= 15000) { setLocationVerifyStatus('success'); setLocationVerified(true); }
        else { setLocationVerifyStatus('failed'); setLocationVerified(false); }
      },
      (err) => {
        if (err.code === 1) alert('Location permission denied. Allow location access or use Skip.');
        else if (window.location.protocol !== 'https:') alert('GPS requires HTTPS. Use Skip for localhost testing.');
        setLocationVerifyStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveProgressToSupabase = async (step) => {
    if (!activeEmployee?.id) return;
    try {
      if (step >= 1) {
        await supabase.from('employee_details').upsert({
          employee_id: activeEmployee.id,
          phone_number: wizardPersonal.phone, personal_email: wizardPersonal.personalEmail,
          dob: wizardPersonal.dob || null, date_of_joining: wizardPersonal.dateOfJoining || null, gender: wizardPersonal.gender,
          permanent_address: wizardPersonal.permanentAddress, current_address: wizardPersonal.currentAddress,
          father_name: wizardPersonal.fatherName, father_dob: wizardPersonal.fatherDob || null,
          mother_name: wizardPersonal.motherName, mother_dob: wizardPersonal.motherDob || null,
          marital_status: wizardPersonal.maritalStatus, spouse_name: wizardPersonal.spouseName, spouse_dob: wizardPersonal.spouseDob || null,
          number_of_kids: parseInt(wizardPersonal.numberOfKids) || 0,
          child1_name: wizardPersonal.child1Name, child1_dob: wizardPersonal.child1Dob || null,
          child2_name: wizardPersonal.child2Name, child2_dob: wizardPersonal.child2Dob || null,
          emergency_contact1: wizardPersonal.emergencyContact1, emergency_contact2: wizardPersonal.emergencyContact2,
        }, { onConflict: 'employee_id' });
      }
      if (step >= 2) {
        await supabase.from('employee_details').upsert({ employee_id: activeEmployee.id, education_history: educationHistory, employment_history: employmentHistory }, { onConflict: 'employee_id' });
      }
      if (step >= 3) {
        await supabase.from('employee_details').upsert({ employee_id: activeEmployee.id, location_verified: locationVerified, location_distance_m: locationDistance }, { onConflict: 'employee_id' });
      }
      if (step >= 4 && digiLockerDetails) {
        await supabase.from('digilocker_verifications').upsert({
          employee_id: activeEmployee.id, aadhaar_masked: digiLockerDetails.aadhaarMasked, pan_number: digiLockerDetails.panNumber,
          name_on_aadhaar: digiLockerDetails.nameOnAadhaar, dob_on_aadhaar: digiLockerDetails.dobOnAadhaar, gender_on_aadhaar: digiLockerDetails.genderOnAadhaar,
        }, { onConflict: 'employee_id' });
      }
      const statusMap = { 1: 'registered', 2: 'registered', 3: 'details_filled', 4: 'details_filled', 5: 'digilocker_verified' };
      await supabase.from('profiles').update({ status: statusMap[step] || 'registered' }).eq('id', activeEmployee.id);
      setActiveEmployee(prev => ({ ...prev, status: statusMap[step] || 'registered' }));
    } catch (err) { console.error('Error saving progress:', err); }
  };

  const handleDigiLockerCallback = async (code, state) => {
    try {
      const savedEmployeeId = sessionStorage.getItem('digilocker_employee_id');
      if (!savedEmployeeId) { setCurrentView('splash'); return; }
      const { data: empData } = await supabase.from('profiles').select('*').eq('id', savedEmployeeId).single();
      if (empData) setActiveEmployee(empData);

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/digilocker-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.error) { alert('DigiLocker verification failed: ' + data.error); setCurrentView('employee-wizard'); return; }

      const user = data.user || {};
      const verifiedDetails = {
        aadhaarMasked: user.masked_aadhaar || user.sub?.slice(-4).padStart(12, 'X') || 'XXXX-XXXX-XXXX',
        panNumber: user.pan || '', nameOnAadhaar: user.name || user.given_name || '',
        dobOnAadhaar: user.birthdate || '', genderOnAadhaar: user.gender || '', verifiedAt: new Date().toISOString(),
      };
      await supabase.from('digilocker_verifications').upsert({
        employee_id: savedEmployeeId, aadhaar_masked: verifiedDetails.aadhaarMasked, pan_number: verifiedDetails.panNumber,
        name_on_aadhaar: verifiedDetails.nameOnAadhaar, dob_on_aadhaar: verifiedDetails.dobOnAadhaar, gender_on_aadhaar: verifiedDetails.genderOnAadhaar,
      }, { onConflict: 'employee_id' });

      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('digilocker_employee_id');
      setDigiLockerDetails(verifiedDetails);
      setWizardStep(5);
      setCurrentView('employee-wizard');
    } catch (err) {
      console.error('DigiLocker callback error:', err);
      setCurrentView('splash');
    }
  };

  const startAttendanceCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setAttendanceStream(mediaStream);
      setIsAttendanceCameraOpen(true);
      setTimeout(() => { if (attendanceVideoRef.current) attendanceVideoRef.current.srcObject = mediaStream; }, 100);
    } catch (err) { setAttendanceError('Could not access camera. Please allow camera permission.'); }
  };

  const stopAttendanceCamera = () => {
    if (attendanceStream) { attendanceStream.getTracks().forEach(t => t.stop()); setAttendanceStream(null); }
    setIsAttendanceCameraOpen(false);
  };

  const captureAttendancePhoto = () => {
    if (!attendanceVideoRef.current || !attendanceCanvasRef.current) return;
    const video = attendanceVideoRef.current;
    const canvas = attendanceCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setAttendancePhoto(canvas.toDataURL('image/jpeg', 0.85));
    stopAttendanceCamera();
  };

  const loadTodayAttendance = async (empId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('attendance').select('*').eq('employee_id', empId).eq('date', today).single();
      setTodayAttendance(data || null);
    } catch { setTodayAttendance(null); }
  };
  const escapeHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

  const loadAttendanceHistory = async (empId) => {
    try {
      const { data } = await supabase.from('attendance').select('*').eq('employee_id', empId).order('date', { ascending: false }).limit(30);
      setAttendanceHistory(data || []);
    } catch { setAttendanceHistory([]); }
  };

  const loadHrAttendance = async () => {
    try {
      console.log('Loading attendance for date:', hrAttendanceDate);
      let query = supabase
        .from('attendance')
        .select('*, profiles(full_name, email, position)')
        .eq('date', hrAttendanceDate)
        .order('created_at', { ascending: true });
      if (hrAttendanceEmployee !== 'all') query = query.eq('employee_id', hrAttendanceEmployee);
      const { data } = await query;
      console.log('Attendance data received:', data);
      setHrAttendanceData(data || []);
   } catch (err) { console.error('Catch error:', err); }
  };

  const handleManualAttendance = async () => {
    if (!manualAttendance.employeeId) { alert('Please select an employee.'); return; }
    try {
      const existing = await supabase.from('attendance').select('id').eq('employee_id', manualAttendance.employeeId).eq('date', manualAttendance.date).single();
      if (existing.data) {
        await supabase.from('attendance').update({ status: manualAttendance.status, work_type: manualAttendance.work_type, wfh_reason: manualAttendance.note }).eq('id', existing.data.id);
      } else {
        await supabase.from('attendance').insert({
          employee_id: manualAttendance.employeeId, date: manualAttendance.date, status: manualAttendance.status,
          work_type: manualAttendance.work_type, wfh_reason: manualAttendance.note,
          check_in_time: manualAttendance.status !== 'absent' ? `${manualAttendance.date}T09:00:00Z` : null,
        });
      }
      alert('Attendance updated successfully.');
      setIsMarkingManual(false);
      loadHrAttendance();
    } catch (err) { console.error(err); alert('Failed to update attendance.'); }
  };

  const handleMarkAttendance = async (type, forceWfh = false) => {
    if (!attendancePhoto) { setAttendanceError('Please take a photo first.'); return; }
    setAttendanceLoading(true);
    setAttendanceError('');
    setShowWfhOption(false);

    const OFFICE_LAT = parseFloat(import.meta.env.VITE_OFFICE_LAT);
    const OFFICE_LNG = parseFloat(import.meta.env.VITE_OFFICE_LNG);
    const OFFICE_RADIUS = parseInt(import.meta.env.VITE_OFFICE_RADIUS_M || '300');

    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      console.log('Browser reports you at:', lat, lng, '(accuracy: ±' + Math.round(position.coords.accuracy) + 'm)');
console.log('Office coords are:', OFFICE_LAT, OFFICE_LNG);
      const dist = Math.round(haversineDistance({ lat: OFFICE_LAT, lng: OFFICE_LNG }, { lat, lng }));
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      if (dist > OFFICE_RADIUS && !forceWfh) {
        setWfhPendingData({ lat, lng, dist, now, today, type });
        setShowWfhOption(true);
        setAttendanceLoading(false);
        return;
      }

      const workType = forceWfh ? 'wfh' : 'office';
      const pendingData = forceWfh ? wfhPendingData : { lat, lng, dist, now, today, type };

      if (pendingData.type === 'in') {
        const { data, error } = await supabase.from('attendance').insert({
          employee_id: activeEmployee.id, date: pendingData.today, check_in_time: pendingData.now, check_in_photo: attendancePhoto,
          check_in_lat: pendingData.lat, check_in_lng: pendingData.lng, check_in_distance_m: pendingData.dist,
          status: 'present', work_type: workType, wfh_reason: pendingData.reason || null,
        }).select().single();
        if (error) throw error;
        setTodayAttendance(data);

        if (forceWfh) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}` },
              body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: import.meta.env.VITE_HR_EMAIL,
                subject: `WFH Alert — ${activeEmployee.full_name} is working from home today`,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #1a2d4a; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #c8922a; margin: 0; font-size: 22px;">TOSBS Attendance Alert</h1>
                  </div>
                  <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1a2d4a; margin-top: 0;">Work From Home — Check In</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #64748b; width: 140px;">Employee</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${activeEmployee.full_name}</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; color: #0f172a;">${activeEmployee.email}</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b;">Distance from Office</td><td style="padding: 8px 0; color: #0f172a;">${pendingData.dist}m away</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b;">Reason</td><td style="padding: 8px 0; color: #0f172a;">${pendingData.reason || 'No reason provided'}</td></tr>
                    </table>
                  </div>
                </div>`
              })
            });
          } catch (emailErr) { console.error('WFH email failed:', emailErr); }
        }
      } else {
        if (!todayAttendance) { setAttendanceError('No check-in found for today.'); setAttendanceLoading(false); return; }

        // If outside office on checkout and not already WFH — show WFH prompt
        if (dist > OFFICE_RADIUS && !forceWfh && todayAttendance.work_type !== 'wfh') {
          setWfhPendingData({ lat, lng, dist, now, today, type: 'out' });
          setShowWfhOption(true);
          setAttendanceLoading(false);
          return;
        }

        const workHours = parseFloat(((new Date(pendingData.now) - new Date(todayAttendance.check_in_time)) / (1000 * 60 * 60)).toFixed(2));
        const { data, error } = await supabase.from('attendance').update({
          check_out_time: pendingData.now,
          check_out_photo: attendancePhoto,
          check_out_lat: pendingData.lat,
          check_out_lng: pendingData.lng,
          check_out_distance_m: pendingData.dist,
          work_hours: workHours,
          work_type: forceWfh ? 'wfh' : todayAttendance.work_type,
        }).eq('id', todayAttendance.id).select().single();
        if (error) throw error;
        setTodayAttendance(data);
      }

      setAttendancePhoto(null);
      setWfhPendingData(null);
      setShowWfhOption(false);
      loadAttendanceHistory(activeEmployee.id);
    } catch (err) {
      if (err.code === 1) setAttendanceError('Location permission denied. Please allow location access.');
      else setAttendanceError('Failed to mark attendance. Try again.');
      console.error(err);
    }
    setAttendanceLoading(false);
  };

  // ---------- Leave ----------
  const loadEmployeeLeaves = async (empId) => {
    try {
      const { data } = await supabase.from('leave_applications').select('*').eq('employee_id', empId).order('applied_at', { ascending: false });
      setLeaveApplications(data || []);
    } catch (err) { console.error(err); }
  };
    const handleAnnouncementImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnnouncementImageFile(file.name);
      setAnnouncementForm(prev => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.title.trim()) { alert('Please enter a title.'); return; }
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = announcementForm.start_date || announcementForm.scheduled_date || today;
      const endDate = announcementForm.end_date || null;

      if (endDate && endDate < startDate) {
        alert('End date cannot be before start date.');
        return;
      }

      const rawMessage = announcementForm.message || '';
      const messageWithEndDate = endDate ? `${rawMessage}\n<!--END_DATE:${endDate}-->` : rawMessage;

      const payload = {
        employee_id: null,
        title: announcementForm.title.trim(),
        message: messageWithEndDate,
        scheduled_date: startDate,
        image_url: announcementForm.image_url || null,
        is_announcement: true,
        created_at: new Date().toISOString(),
      };

      // Try inserting with end_date column first, fallback to message-encoded if column does not exist
      try {
        const { error: errWithCol } = await supabase.from('notifications').insert({ ...payload, end_date: endDate });
        if (errWithCol) {
          await supabase.from('notifications').insert(payload);
        }
      } catch (e) {
        await supabase.from('notifications').insert(payload);
      }

      setAnnouncementForm({ title: '', message: '', start_date: '', end_date: '', scheduled_date: '', image_url: '' });
      setAnnouncementImageFile(null);
      setShowAnnouncement(false);
      loadHrCelebrations();
      alert(startDate > today ? `Announcement scheduled from ${startDate}${endDate ? ` to ${endDate}` : ''}!` : `Announcement published${endDate ? ` (active until ${endDate})` : ''}!`);
    } catch (err) {
      console.error('Error sending announcement:', err);
      alert('Failed to send announcement.');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase.from('notifications').delete().eq('id', id);
    loadHrCelebrations();
  };
  const loadHrLeaves = async () => {
    try {
      const { data } = await supabase.from('leave_applications').select('*, profiles(full_name, email, position)').order('applied_at', { ascending: false });
      setHrLeaveApplications(data || []);
    } catch (err) { console.error(err); }
  };

  const calculateSalaryForEmployee = async (employeeId, monthStr) => {
    if (!employeeId || !monthStr) return null;
    try {
      const { data: config } = await supabase.from('salary_config').select('*').eq('employee_id', employeeId).maybeSingle();
      const monthlyCtc = config?.monthly_ctc || 0;

      const { data: empProfile } = await supabase.from('profiles').select('id, full_name, position').eq('id', employeeId).maybeSingle();

      const [year, month] = monthStr.split('-');
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;

      const { data: rows } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      const records = rows || [];
      const dateMap = {};
      records.forEach(r => { dateMap[r.date] = r; });

      // Also fetch approved leaves for this employee in this month
      const { data: leaveRows } = await supabase
        .from('leave_applications')
        .select('from_date, to_date')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .lte('from_date', endDate)
        .gte('to_date', startDate);
      const approvedLeaves = leaveRows || [];

      const todayStr = new Date().toISOString().split('T')[0];

      // Count working days in month (Mon-Sat, excluding Sundays)
      let workingDaysInMonth = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(parseInt(year), parseInt(month) - 1, d).getDay();
        if (day !== 0) workingDaysInMonth++;
      }

      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      let weeklyOffDays = 0;
      let holidayDays = 0;
      let onTourDays = 0;
      let sundayWorkedDays = 0;
      let compOffUsed = 0;

      // Loop every calendar day to capture both recorded AND missing days
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = new Date(parseInt(year), parseInt(month) - 1, d).getDay();

        // Skip Sundays
        if (dayOfWeek === 0) {
          const rec = dateMap[dateStr];
          if (rec && rec.status === 'present') sundayWorkedDays++;
          continue;
        }

        // Skip future dates (don't mark upcoming days as absent)
        if (dateStr > todayStr) continue;

        const isFestival = FESTIVALS.some(f => f.month === month && f.day === String(d).padStart(2, '0'));
        const isOnLeave = approvedLeaves.some(l => dateStr >= l.from_date && dateStr <= l.to_date);
        const rec = dateMap[dateStr];

        if (rec) {
          // Has an attendance record — classify it
          if (rec.status === 'present' || rec.work_type === 'wfh' || rec.work_type === 'on_tour') presentDays++;
          else if (rec.status === 'absent') absentDays++;
          else if (rec.status === 'half_day') halfDays++;
          else if (rec.status === 'leave') leaveDays++;
          else if (rec.status === 'holiday') holidayDays++;
          else if (rec.status === 'weekly_off') weeklyOffDays++;
          else if (rec.status === 'comp_off') compOffUsed++;
          else if (rec.status === 'tour') onTourDays++;
        } else if (isOnLeave) {
          // Approved leave application covers this day
          leaveDays++;
        } else if (isFestival) {
          // Public holiday — not absent
          holidayDays++;
        } else {
          // No record, not a holiday, not on leave → absent
          absentDays++;
        }
      }

      const leavesAllowed = 1.0;
      // leavesTaken includes both unrecorded absents AND approved leave applications
      const leavesTaken = absentDays + leaveDays + (halfDays * 0.5);
      const excessLeaves = Math.max(0, leavesTaken - leavesAllowed);
      const extraDaysWorked = 0;
      const netPayDays = daysInMonth - excessLeaves + extraDaysWorked;

      const perDayRate = daysInMonth > 0 ? monthlyCtc / daysInMonth : 0;
      const grossEarned = perDayRate * netPayDays;

      // TDS calculation: 2% for consultant/professional or configured profiles
      let tds = 0;
      const nameLower = (empProfile?.full_name || '').toLowerCase();
      if (nameLower.includes('purva') || nameLower.includes('adarsh') || config?.tds_rate) {
        tds = (config?.tds_rate ? (grossEarned * config.tds_rate / 100) : (grossEarned * 0.02));
      }

      const leaveDeduction = excessLeaves * perDayRate;
      const totalDeduction = leaveDeduction + tds;
      const netSalary = Math.max(0, grossEarned - tds);

      return {
        monthlyCtc,
        perDayRate: parseFloat(perDayRate.toFixed(2)),
        workingDaysInMonth,
        daysInMonth,
        presentDays,
        absentDays,
        leavesTaken,
        leavesAllowed,
        excessLeaves,
        netPayDays: parseFloat(netPayDays.toFixed(2)),
        extraDaysWorked,
        billableAbsents: parseFloat(excessLeaves.toFixed(1)),
        freeLeaveAllowance: leavesAllowed,
        halfDays,
        leaveDays,
        holidayDays,
        onTourDays,
        weeklyOffDays,
        sundayWorkedDays,
        compOffUsed,
        tds: parseFloat(tds.toFixed(2)),
        leaveDeduction: parseFloat(leaveDeduction.toFixed(2)),
        deduction: parseFloat(totalDeduction.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
        overtimeHours: 0,
        overtimePay: 0,
      };
    } catch (err) {
      console.error('Error calculating salary for employee:', employeeId, err);
      return null;
    }
  };

  const computeSalary = async (employeeId, monthStr) => {
    if (!employeeId || !monthStr) return;
    setSalaryLoading(true);
    try {
      const breakdown = await calculateSalaryForEmployee(employeeId, monthStr);
      setSalaryBreakdown(breakdown);
      if (breakdown) {
        setSalaryConfig({ monthly_ctc: breakdown.monthlyCtc, overtime_multiplier: 1 });
      }
    } catch (err) {
      console.error('Error computing salary:', err);
      setSalaryBreakdown(null);
    }
    setSalaryLoading(false);
  };

  const exportSalaryMasterSheet = async () => {
    try {
      const { data: configs } = await supabase.from('salary_config').select('*');
      const configMap = Object.fromEntries((configs || []).map(c => [c.employee_id, c.monthly_ctc]));

      const { data: details } = await supabase.from('employee_details').select('*');
      const detailMap = Object.fromEntries((details || []).map(d => [d.employee_id, d]));

      const approvedEmployees = employees.filter(e => e.status === 'approved' && (configMap[e.id] || 0) > 0);
      if (approvedEmployees.length === 0) {
        alert('No approved employees with salary configuration found.');
        return;
      }

      const salarySheetRows = [
        ['Sr No.', 'Employee Name', 'Dept.', 'Basic Salary', 'TDS 2%', 'Leaves Taken', 'Leaves Allowed', 'Extra Days Worked', 'Net Pay Days', 'Net Salary For the Month', 'Advance / Other Adjustments', 'Total Salary Payable', 'Bonus Payable', 'Bank', 'Status']
      ];

      const bankPayoutRows = [
        ['Name as per Bank', 'Other Bank Account Number', 'IFSC Code', 'Final Amount']
      ];

      let totalBasic = 0;
      let totalTds = 0;
      let totalNetForMonth = 0;
      let totalSalaryPayable = 0;

      for (let idx = 0; idx < approvedEmployees.length; idx++) {
        const emp = approvedEmployees[idx];
        const basic = configMap[emp.id] || 0;
        const det = detailMap[emp.id] || {};
        const breakdown = await calculateSalaryForEmployee(emp.id, salaryMonth);

        const tds = breakdown?.tds || 0;
        const netPayDays = breakdown ? breakdown.netPayDays : 31.00;
        const netSalaryMonth = breakdown ? Math.round(breakdown.netSalary) : basic;
        const totalPayable = breakdown ? breakdown.netSalary : basic;

        totalBasic += basic;
        totalTds += tds;
        totalNetForMonth += netSalaryMonth;
        totalSalaryPayable += totalPayable;

        let dept = 'CAP';
        const nameLower = (emp.full_name || '').toLowerCase();
        if (nameLower.includes('raj')) dept = 'Common';
        else if (nameLower.includes('saurabh') || nameLower.includes('vrushali') || nameLower.includes('vrushall')) dept = 'Foreign';
        else if (nameLower.includes('neha')) dept = 'Loans';
        else if (nameLower.includes('sabina')) dept = 'Credknow';
        else if (emp.position?.includes('Accountant')) dept = 'Accounts';
        else if (emp.position?.includes('CS')) dept = 'CS';

        let bankName = det.bank_name || 'Federal';
        const bankUpper = bankName.toUpperCase();
        if (bankUpper.includes('FED')) bankName = 'Federal';
        else if (bankUpper.includes('KOTAK')) bankName = 'Kotak Mahindra Bank';
        else if (bankUpper.includes('STATE') || bankUpper.includes('SBI')) bankName = 'State Bank of India';

        salarySheetRows.push([
          idx + 1,
          emp.full_name,
          dept,
          basic.toFixed(2),
          tds > 0 ? tds.toFixed(2) : '',
          breakdown?.leavesTaken || 0,
          '1.00',
          '-',
          netPayDays.toFixed(2),
          netSalaryMonth.toLocaleString('en-IN'),
          '-',
          totalPayable.toFixed(2),
          '-',
          bankName,
          ''
        ]);

        const accNo = (det.account_number || '').replace(/[^0-9]/g, '');
        bankPayoutRows.push([
          (emp.full_name || '').toUpperCase(),
          accNo,
          det.ifsc_code || '',
          totalPayable.toLocaleString('en-IN')
        ]);
      }

      // Summary Row for Salary Sheet
      salarySheetRows.push([
        '',
        '',
        '',
        totalBasic.toFixed(2),
        totalTds > 0 ? totalTds.toFixed(2) : '',
        '',
        '',
        'TOTAL',
        '',
        totalNetForMonth.toLocaleString('en-IN'),
        '',
        totalSalaryPayable.toFixed(2),
        '-',
        '',
        ''
      ]);

      // Summary Row for Bank Payout Sheet
      bankPayoutRows.push([
        '',
        '',
        'TOTAL:',
        totalSalaryPayable.toFixed(2)
      ]);

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Salary Sheet
      const ws1 = XLSX.utils.aoa_to_sheet(salarySheetRows);
      ws1['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 22 },
        { wch: 26 }, { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(workbook, ws1, 'Salary Sheet');

      // Sheet 2: Bank Payout
      const ws2 = XLSX.utils.aoa_to_sheet(bankPayoutRows);
      ws2['!cols'] = [
        { wch: 32 }, { wch: 28 }, { wch: 16 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(workbook, ws2, 'Bank Payout');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      saveAs(blob, `TOSBS_Salary_Master_${salaryMonth}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Unable to export Salary Master Sheet.');
    }
  };

  const isPayslipAvailableForMonth = (monthStr) => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (monthStr < currentMonthStr) {
      return { available: true, message: 'Available' };
    } else if (monthStr === currentMonthStr) {
      if (today.getDate() >= 21) {
        return { available: true, message: 'Available' };
      } else {
        const daysLeft = 21 - today.getDate();
        return {
          available: false,
          message: `Salary slips for ${new Date(monthStr + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} will be released on the 21st (in ${daysLeft} day${daysLeft > 1 ? 's' : ''}).`
        };
      }
    } else {
      return { available: false, message: 'Future month salary slips are not available yet.' };
    }
  };

  const downloadEmployeePayslip = async (emp, breakdown, monthStr) => {
    try {
      if (!breakdown) {
        alert('No salary calculation available for this month.');
        return;
      }

      const { data: details } = await supabase.from('employee_details').select('*').eq('employee_id', emp.id).maybeSingle();
      const { data: verification } = await supabase.from('digilocker_verifications').select('*').eq('employee_id', emp.id).maybeSingle();

      const monthName = new Date(monthStr + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      const workbook = XLSX.utils.book_new();
      const payslipRows = [
        ["THE ONE STOP BUSINESS SOLUTION (TOSBS)"],
        [`SALARY SLIP FOR ${monthName.toUpperCase()}`],
        [],
        ["EMPLOYEE DETAILS", "", "BANK & TAX DETAILS", ""],
        ["Employee Name:", emp.full_name, "Bank Name:", details?.bank_name || "—"],
        ["Employee ID:", emp.id, "Account Number:", details?.account_number || "—"],
        ["Designation:", emp.position || "—", "IFSC Code:", details?.ifsc_code || "—"],
        ["Email:", emp.email, "PAN Number:", verification?.pan_number || "—"],
        ["Date of Joining:", details?.date_of_joining || "—", "UAN Number:", details?.uan_number || "—"],
        [],
        ["ATTENDANCE SUMMARY", "", "", ""],
        ["Days in Month:", breakdown.daysInMonth, "Present Days:", breakdown.presentDays],
        ["Working Days:", breakdown.workingDaysInMonth, "Half Days:", breakdown.halfDays],
        ["Paid Leaves / Holidays:", breakdown.leaveDays + breakdown.holidayDays, "Absent Days:", breakdown.absentDays],
        ["Free Leave Allowance:", `${breakdown.freeLeaveAllowance} days`, "Billable Absents:", `${breakdown.billableAbsents} days`],
        ["Sandwich Penalty Days:", `${breakdown.sandwichPenaltyDays} day(s)`, "Sunday Worked:", `${breakdown.sundayWorkedDays} day(s)`],
        [],
        ["SALARY & EARNINGS", "AMOUNT (₹)", "DEDUCTIONS", "AMOUNT (₹)"],
        ["Monthly CTC / Gross Salary", breakdown.monthlyCtc, "Absence & Half-Day Deduction", parseFloat(((breakdown.billableAbsents * breakdown.perDayRate) + (breakdown.halfDays * breakdown.perDayRate * 0.5)).toFixed(2))],
        ["Overtime Pay", breakdown.overtimePay || 0, "Sandwich Rule Penalty", parseFloat((breakdown.sandwichPenaltyDays * breakdown.perDayRate).toFixed(2))],
        [],
        ["TOTAL GROSS PAY (₹):", breakdown.monthlyCtc + (breakdown.overtimePay || 0), "TOTAL DEDUCTIONS (₹):", breakdown.deduction],
        [],
        ["NET SALARY PAYABLE (₹):", breakdown.netSalary, "", ""],
        [],
        ["Note: This is a computer-generated salary slip from TOSBS Workforce Portal."],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(payslipRows);
      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 25 },
        { wch: 28 },
        { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payslip");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      const safeName = (emp.full_name || "Employee").replace(/[^a-z0-9]/gi, "_");
      saveAs(blob, `TOSBS_Payslip_${safeName}_${monthStr}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Unable to download salary slip.');
    }
  };

  const saveSalaryConfig = async (employeeId) => {
    try {
      await supabase.from('salary_config').upsert({
        employee_id: employeeId,
        monthly_ctc: parseFloat(salaryConfig.monthly_ctc) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'employee_id' });
      alert('CTC saved. Recalculating...');
      computeSalary(employeeId, salaryMonth);
    } catch (err) {
      console.error(err);
      alert('Failed to save CTC.');
    }
  };

  const handleApplyLeave = async () => {
    setLeaveFormError('');
    if (!leaveForm.from_date || !leaveForm.to_date) { setLeaveFormError('Please select from and to dates.'); return; }
    if (!leaveForm.reason.trim()) { setLeaveFormError('Please provide a reason.'); return; }
    if (new Date(leaveForm.from_date) > new Date(leaveForm.to_date)) { setLeaveFormError('From date cannot be after to date.'); return; }

    setLeaveSubmitting(true);
    try {
      const { error } = await supabase.from('leave_applications').insert({
        employee_id: activeEmployee.id, leave_type: leaveForm.leave_type, from_date: leaveForm.from_date,
        to_date: leaveForm.to_date, reason: leaveForm.reason, status: 'pending',
      });
      if (error) throw error;

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/send-notification-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            
            to: import.meta.env.VITE_HR_EMAIL,
            subject: `Leave Application — ${activeEmployee.full_name}`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a2d4a; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #c8922a; margin: 0; font-size: 22px;">TOSBS Leave Application</h1>
              </div>
              <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; width: 140px;">Employee</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${activeEmployee.full_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Leave Type</td><td style="padding: 8px 0; color: #0f172a;">${leaveForm.leave_type}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">From</td><td style="padding: 8px 0; color: #0f172a;">${leaveForm.from_date}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">To</td><td style="padding: 8px 0; color: #0f172a;">${leaveForm.to_date}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Reason</td><td style="padding: 8px 0; color: #0f172a;">${leaveForm.reason}</td></tr>
                </table>
              </div>
            </div>`
          })
        });
      } catch (e) { console.error('Leave email failed:', e); }

      setLeaveForm({ leave_type: 'CL', from_date: '', to_date: '', reason: '' });
      loadEmployeeLeaves(activeEmployee.id);
      loadReimbursements(activeEmployee.id);
      alert('Leave application submitted successfully. HR will review it shortly.');
    } catch (err) {
      console.error(err);
      setLeaveFormError('Failed to submit. Please try again.');
    }
    setLeaveSubmitting(false);
  };

  const handleLeaveVerdict = async (leave, verdict, hrNote = '') => {
    try {
      await supabase.from('leave_applications').update({ status: verdict, hr_note: hrNote, reviewed_at: new Date().toISOString() }).eq('id', leave.id);

      if (verdict === 'approved') {
        const start = new Date(leave.from_date);
        const end = new Date(leave.to_date);
        const dates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(new Date(d).toISOString().split('T')[0]);

        for (const date of dates) {
          const { data: existing } = await supabase.from('attendance').select('id').eq('employee_id', leave.employee_id).eq('date', date).single();
          if (existing) await supabase.from('attendance').update({ status: 'leave', work_type: 'leave' }).eq('id', existing.id);
          else await supabase.from('attendance').insert({ employee_id: leave.employee_id, date, status: 'leave', work_type: 'leave' });
        }

        try {
          const { data: empData } = await supabase.from('profiles').select('email, full_name').eq('id', leave.employee_id).single();
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}` },
            body: JSON.stringify({
              from: 'onboarding@resend.dev', to: empData.email,
              subject: `Leave Approved ✓ — TOSBS`,
              html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a2d4a; padding: 24px; border-radius: 8px 8px 0 0;"><h1 style="color: #c8922a; margin: 0; font-size: 22px;">TOSBS Leave Update</h1></div>
                <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                  <p style="color: #475569;">Dear ${empData.full_name}, your leave from <strong>${leave.from_date}</strong> to <strong>${leave.to_date}</strong> has been approved.</p>
                  ${hrNote ? `<p style="color: #475569;"><strong>HR Note:</strong> ${hrNote}</p>` : ''}
                </div>
              </div>`
            })
          });
        } catch (e) { console.error('Verdict email failed:', e); }
      }

      loadHrLeaves();
      alert(`Leave ${verdict} successfully.`);
    } catch (err) { console.error(err); }
  };

  // ---------- Celebrations & Notifications ----------
  const loadCelebrationsAndNotifications = async (empId) => {
    try {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayISO = today.toISOString().split('T')[0];

      const { data: rpcData } = await supabase.rpc('get_todays_celebrations');
      const todays = (rpcData || []).map(r => ({ employeeId: r.employee_id, name: r.full_name, position: r.position, type: r.celebration_type }));
      setCelebrations(todays);
      setFestivalsToday(getTodaysFestivals());

      const { data: wishesToday } = await supabase.from('wishes').select('to_employee_id').eq('from_employee_id', empId).eq('occasion_date', todayISO);
      setSentWishesToday((wishesToday || []).map(w => w.to_employee_id));

      const { data: myWishes } = await supabase.from('wishes').select('*').eq('to_employee_id', empId).eq('occasion_date', todayISO);
      let wishesWithNames = myWishes || [];
      if (wishesWithNames.length) {
        const fromIds = [...new Set(wishesWithNames.map(w => w.from_employee_id))];
        const { data: fromProfiles } = await supabase.from('profiles').select('id, full_name').in('id', fromIds);
        const fromMap = Object.fromEntries((fromProfiles || []).map(p => [p.id, p.full_name]));
        wishesWithNames = wishesWithNames.map(w => ({ ...w, from_name: fromMap[w.from_employee_id] || 'A colleague' }));
      }
      setWishesReceived(wishesWithNames);

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .or(`employee_id.eq.${empId},employee_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs || []);

      // Show popup for latest unseen active announcement
      const latestAnnouncement = (notifs || []).find(n => {
        if (!n.is_announcement) return false;
        const { startDate, endDate } = getAnnouncementDates(n);
        if (startDate && startDate > todayISO) return false;
        if (endDate && endDate < todayISO) return false;
        return true;
      });
      if (latestAnnouncement) {
        const seenKey = `seen_ann_${latestAnnouncement.id}`;
        if (!sessionStorage.getItem(seenKey)) {
          setCurrentPopupAnnouncement(latestAnnouncement);
          setShowAnnouncementPopup(true);
          sessionStorage.setItem(seenKey, 'true');
        }
      }
    } catch (err) { console.error('Error loading celebrations:', err); }
  };

  const loadHrCelebrations = async () => {
    try {
     const { data: rpcData } = await supabase.rpc('get_todays_celebrations');
      const todays = (rpcData || []).map(r => ({ employeeId: r.employee_id, name: r.full_name, position: r.position, type: r.celebration_type }));
      setCelebrations(todays);
      setFestivalsToday(getTodaysFestivals());

      const { data: notifs } = await supabase.from('notifications').select('*').is('employee_id', null).order('created_at', { ascending: false }).limit(20);
      setNotifications(notifs || []);
    } catch (err) { console.error('Error loading HR celebrations:', err); }
  };

  const sendWish = async (toEmployeeId, occasionType) => {
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const message = occasionType === 'birthday' ? '🎉 Happy Birthday! Wishing you a fantastic year ahead!' : '🎊 Happy Work Anniversary! Congrats on another great year!';
      const { error } = await supabase.from('wishes').insert({
        to_employee_id: toEmployeeId, from_employee_id: activeEmployee.id, occasion_type: occasionType, occasion_date: todayISO, message,
      });
      if (error) {
        if (error.code === '23505') { alert('You already wished them today! 🎉'); return; }
        throw error;
      }
      setSentWishesToday(prev => [...prev, toEmployeeId]);
    } catch (err) { console.error(err); alert('Failed to send wish.'); }
  };
const loadReimbursements = async (empId) => {
    try {
      const { data } = await supabase.from('reimbursements').select('*').eq('employee_id', empId).order('submitted_at', { ascending: false });
      setReimbursements(data || []);
    } catch (err) { console.error(err); }
  };

  const loadHrReimbursements = async () => {
    try {
      const { data } = await supabase.from('reimbursements').select('*, profiles(full_name, email, position)').order('submitted_at', { ascending: false });
      setHrReimbursements(data || []);
    } catch (err) { console.error(err); }
  };

  const handleReimbReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReimbReceiptFile(file.name);
      setReimbForm(prev => ({ ...prev, receipt_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const addExpenseRow = () => setReimbForm(prev => ({ ...prev, expenses: [...prev.expenses, { category: 'Travel', description: '', amount: '' }] }));
  const removeExpenseRow = (i) => setReimbForm(prev => ({ ...prev, expenses: prev.expenses.filter((_, idx) => idx !== i) }));
  const updateExpenseRow = (i, field, value) => setReimbForm(prev => {
    const updated = [...prev.expenses];
    updated[i] = { ...updated[i], [field]: value };
    return { ...prev, expenses: updated };
  });

  const getTotalAmount = () => reimbForm.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const handleSubmitReimbursement = async () => {
    setReimbFormError('');
    if (!reimbForm.client_name.trim()) { setReimbFormError('Please enter client/place name.'); return; }
    if (!reimbForm.work_description.trim()) { setReimbFormError('Please describe the work done.'); return; }
    if (!reimbForm.date) { setReimbFormError('Please select the date.'); return; }
    if (reimbForm.expenses.some(e => !e.description.trim() || !e.amount)) { setReimbFormError('Please fill all expense details.'); return; }
    const total = getTotalAmount();
    if (total <= 0) { setReimbFormError('Total amount must be greater than 0.'); return; }

    setReimbSubmitting(true);
    try {
      const { error } = await supabase.from('reimbursements').insert({
        employee_id: activeEmployee.id,
        date: reimbForm.date,
        client_name: reimbForm.client_name,
        work_description: reimbForm.work_description,
        start_time: reimbForm.start_time,
        end_time: reimbForm.end_time,
        expenses: reimbForm.expenses,
        total_amount: total,
        receipt_url: reimbForm.receipt_url || null,
        status: 'pending',
      });
      if (error) throw error;

      // Email HR
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: import.meta.env.VITE_HR_EMAIL,
            subject: `Reimbursement Request — ${activeEmployee.full_name} — ₹${total.toFixed(2)}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1a2d4a;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="color:#c8922a;margin:0;font-size:22px">TOSBS Reimbursement Request</h1>
              </div>
              <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#64748b;width:160px">Employee</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${activeEmployee.full_name}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0;color:#0f172a">${reimbForm.date}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b">Client / Place</td><td style="padding:8px 0;color:#0f172a">${reimbForm.client_name}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b">Work Done</td><td style="padding:8px 0;color:#0f172a">${reimbForm.work_description}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b">Total Amount</td><td style="padding:8px 0;font-weight:700;color:#c8922a;font-size:18px">₹${total.toFixed(2)}</td></tr>
                </table>
                <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:6px;border-left:4px solid #c8922a">
                  <p style="margin:0;color:#92400e;font-size:14px">Please log in to approve or reject this reimbursement request.</p>
                </div>
              </div>
            </div>`
          })
        });
      } catch (e) { console.error('Reimb email failed:', e); }

      setReimbForm({ date: new Date().toISOString().split('T')[0], client_name: '', work_description: '', start_time: '', end_time: '', expenses: [{ category: 'Travel', description: '', amount: '' }], receipt_url: '' });
      setReimbReceiptFile(null);
      loadReimbursements(activeEmployee.id);
      alert('Reimbursement request submitted! HR will review it shortly.');
    } catch (err) {
      console.error(err);
      setReimbFormError('Failed to submit. Please try again.');
    }
    setReimbSubmitting(false);
  };

  const handleReimbVerdict = async (reimb, verdict, hrNote = '') => {
    try {
      await supabase.from('reimbursements').update({
        status: verdict,
        hr_note: hrNote,
        reviewed_at: new Date().toISOString(),
        paid_date: verdict === 'approved' ? new Date().toISOString().split('T')[0] : null,
      }).eq('id', reimb.id);
      loadHrReimbursements();
      alert(`Reimbursement ${verdict} successfully.`);
    } catch (err) { console.error(err); }
  };

  const exportReimbursementsExcel = () => {
    try {
      const rows = hrReimbursements.map(r => ({
        'Employee': r.profiles?.full_name || '—',
        'Email': r.profiles?.email || '—',
        'Position': r.profiles?.position || '—',
        'Date': r.date,
        'Client / Place': r.client_name,
        'Work Description': r.work_description,
        'Start Time': r.start_time || '—',
        'End Time': r.end_time || '—',
        'Expenses': (r.expenses || []).map(e => `${e.category}: ${e.description} (₹${e.amount})`).join(' | '),
        'Total Amount (₹)': r.total_amount,
        'Status': r.status,
        'HR Note': r.hr_note || '—',
        'Paid Date': r.paid_date || '—',
        'Submitted At': r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN') : '—',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 16 }, { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 18 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reimbursements');
      XLSX.writeFile(wb, `TOSBS_Reimbursements_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) { console.error(err); alert('Export failed.'); }
  };

  // ---------- Resignation Handlers ----------
  const loadEmployeeResignation = async (empId) => {
    if (!empId) return;
    try {
      const { data, error } = await supabase
        .from('resignations')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading resignation:', error);
        return;
      }

      if (data) {
        const todayStr = new Date().toISOString().split('T')[0];
        // Check 5-day auto-deactivation
        if ((data.status === 'notice_period' || data.status === 'approved') && data.notice_end_date) {
          const endD = new Date(data.notice_end_date);
          const autoDeactD = new Date(endD);
          autoDeactD.setDate(autoDeactD.getDate() + 5);
          const autoDeactStr = autoDeactD.toISOString().split('T')[0];

          if (todayStr >= autoDeactStr) {
            await supabase.from('resignations').update({ status: 'deactivated', deactivated_at: new Date().toISOString() }).eq('id', data.id);
            await supabase.from('profiles').update({ status: 'resigned' }).eq('id', empId);
            data.status = 'deactivated';
            alert('Your notice period has completed and your account has been deactivated. Thank you for your service at TOSBS.');
            await supabase.auth.signOut();
            setActiveEmployee(null);
            setCurrentView('splash');
            return;
          }
        }
        setMyResignation(data);
      } else {
        setMyResignation(null);
      }
    } catch (err) {
      console.error('Error loading resignation:', err);
    }
  };

  const loadHrResignations = async () => {
    try {
      const { data, error } = await supabase
        .from('resignations')
        .select('*, profiles(id, full_name, email, position, status)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading HR resignations:', error);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const updatedList = [];

      for (const r of (data || [])) {
        // Check 5-day auto-deactivation
        if ((r.status === 'notice_period' || r.status === 'approved') && r.notice_end_date) {
          const endD = new Date(r.notice_end_date);
          const autoDeactD = new Date(endD);
          autoDeactD.setDate(autoDeactD.getDate() + 5);
          const autoDeactStr = autoDeactD.toISOString().split('T')[0];

          if (todayStr >= autoDeactStr) {
            await supabase.from('resignations').update({ status: 'deactivated', deactivated_at: new Date().toISOString() }).eq('id', r.id);
            await supabase.from('profiles').update({ status: 'resigned' }).eq('id', r.employee_id);
            r.status = 'deactivated';
          }
        }
        updatedList.push(r);
      }

      setHrResignations(updatedList);
    } catch (err) {
      console.error('Error in loadHrResignations:', err);
    }
  };

  const handleApplyResignation = async () => {
    setResignationError('');
    if (!resignationForm.reason.trim()) {
      setResignationError('Please provide a reason for resignation.');
      return;
    }
    if (!resignationForm.requested_last_day) {
      setResignationError('Please select your desired last working day.');
      return;
    }

    setResignationSubmitting(true);
    try {
      const { error } = await supabase.from('resignations').insert({
        employee_id: activeEmployee.id,
        reason: resignationForm.reason.trim(),
        requested_last_day: resignationForm.requested_last_day,
        notes: resignationForm.notes?.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      // Broadcast notification to HR
      try {
        await supabase.from('notifications').insert({
          employee_id: null,
          title: `📄 New Resignation Request — ${activeEmployee.full_name}`,
          message: `${activeEmployee.full_name} (${activeEmployee.position || 'Employee'}) has submitted a resignation request with desired last day ${resignationForm.requested_last_day}. Reason: ${resignationForm.reason}`,
          is_announcement: false,
        });
      } catch (ne) { console.error('Notification insert failed:', ne); }

      alert('Resignation request submitted successfully. HR will review and assign your notice period.');
      setResignationForm({ reason: '', requested_last_day: '', notes: '' });
      loadEmployeeResignation(activeEmployee.id);
    } catch (err) {
      console.error(err);
      setResignationError(err.message || 'Failed to submit resignation. Please try again.');
    }
    setResignationSubmitting(false);
  };

  const handleApproveResignation = async (resignationId, employeeId, noticeDays, startDate, hrNote = '') => {
    const days = parseInt(noticeDays) || 30;
    const start = startDate || new Date().toISOString().split('T')[0];
    const startD = new Date(start);
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + days);
    const endDate = endD.toISOString().split('T')[0];

    try {
      const { error } = await supabase.from('resignations').update({
        status: 'notice_period',
        notice_period_days: days,
        notice_start_date: start,
        notice_end_date: endDate,
        hr_note: hrNote || null,
        approved_at: new Date().toISOString(),
      }).eq('id', resignationId);

      if (error) throw error;

      // Notify employee
      try {
        await supabase.from('notifications').insert({
          employee_id: employeeId,
          title: '📋 Resignation Approved & Notice Period Assigned',
          message: `Your resignation has been approved. Notice period: ${days} days (from ${start} to ${endDate}). Normal salary will be processed during your notice period.`,
          is_announcement: false,
        });
      } catch (ne) { console.error('Notify emp failed:', ne); }

      alert(`Resignation approved! Notice period set to ${days} days (Ends on ${endDate}). Account will auto-deactivate 5 days after notice ends.`);
      loadHrResignations();
      loadEmployees();
    } catch (err) {
      console.error(err);
      alert('Failed to approve resignation: ' + err.message);
    }
  };

  const handleRejectResignation = async (resignationId, employeeId, hrNote = '') => {
    try {
      const { error } = await supabase.from('resignations').update({
        status: 'rejected',
        hr_note: hrNote || null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', resignationId);

      if (error) throw error;

      // Notify employee
      try {
        await supabase.from('notifications').insert({
          employee_id: employeeId,
          title: '❌ Resignation Request Rejected',
          message: `Your resignation request has been rejected by HR.${hrNote ? ' Note: ' + hrNote : ''} Please contact HR for discussion.`,
          is_announcement: false,
        });
      } catch (ne) { console.error('Notify emp failed:', ne); }

      alert('Resignation request rejected.');
      loadHrResignations();
    } catch (err) {
      console.error(err);
      alert('Failed to reject resignation.');
    }
  };

  const handleDeactivateResignedEmployee = async (resignationId, employeeId) => {
    if (!confirm('Are you sure you want to deactivate this employee account? They will no longer be able to log in.')) return;
    try {
      await supabase.from('profiles').update({ status: 'resigned' }).eq('id', employeeId);
      await supabase.from('resignations').update({
        status: 'deactivated',
        deactivated_at: new Date().toISOString(),
      }).eq('id', resignationId);

      alert('Employee account has been deactivated successfully.');
      loadHrResignations();
      loadEmployees();
    } catch (err) {
      console.error(err);
      alert('Failed to deactivate account.');
    }
  };

  const exportResignationsExcel = () => {
    try {
      const rows = hrResignations.map(r => ({
        'Employee': r.profiles?.full_name || '—',
        'Email': r.profiles?.email || '—',
        'Position': r.profiles?.position || '—',
        'Reason': r.reason || '—',
        'Requested Last Day': r.requested_last_day || '—',
        'Notice Period (Days)': r.notice_period_days || '—',
        'Notice Start Date': r.notice_start_date || '—',
        'Notice End Date': r.notice_end_date || '—',
        'Status': r.status,
        'HR Note': r.hr_note || '—',
        'Approved At': r.approved_at ? new Date(r.approved_at).toLocaleDateString('en-IN') : '—',
        'Deactivated At': r.deactivated_at ? new Date(r.deactivated_at).toLocaleDateString('en-IN') : '—',
        'Applied At': r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 25 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resignations');
      XLSX.writeFile(wb, `TOSBS_Resignations_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) { console.error(err); alert('Export failed.'); }
  };
  const handleDigiLockerSuccess = (verifiedData) => setDigiLockerDetails(verifiedData);

  const handleWizardSubmit = async () => {
    if (!digiLockerDetails) { alert('Please complete DigiLocker verification before submitting.'); return; }
    try {
      const detailRecord = {
        employee_id: activeEmployee.id,
        phone_number: wizardPersonal.phone, personal_email: wizardPersonal.personalEmail,
        dob: wizardPersonal.dob || null, date_of_joining: wizardPersonal.dateOfJoining || null, gender: wizardPersonal.gender,
        permanent_address: wizardPersonal.permanentAddress, current_address: wizardPersonal.currentAddress,
        father_name: wizardPersonal.fatherName, father_dob: wizardPersonal.fatherDob || null,
        mother_name: wizardPersonal.motherName, mother_dob: wizardPersonal.motherDob || null,
        marital_status: wizardPersonal.maritalStatus, spouse_name: wizardPersonal.spouseName, spouse_dob: wizardPersonal.spouseDob || null,
        number_of_kids: parseInt(wizardPersonal.numberOfKids) || 0,
        child1_name: wizardPersonal.child1Name, child1_dob: wizardPersonal.child1Dob || null,
        child2_name: wizardPersonal.child2Name, child2_dob: wizardPersonal.child2Dob || null,
        emergency_contact1: wizardPersonal.emergencyContact1, emergency_contact2: wizardPersonal.emergencyContact2,
        bank_name: bankDetails.bankName, account_number: bankDetails.accountNumber, ifsc_code: bankDetails.ifscCode,
        branch_name: bankDetails.branchName, uan_number: bankDetails.uanNumber, pf_number: bankDetails.pfNumber,
        education_history: educationHistory, employment_history: employmentHistory,
        location_verified: locationVerified, location_distance_m: locationDistance,
      };
      await supabase.from('employee_details').upsert(detailRecord, { onConflict: 'employee_id' });

      for (const doc of uploadedDocs) await supabase.from('employee_documents').insert(doc);
      if (selfieImage) {
        await supabase.from('employee_documents').insert({ employee_id: activeEmployee.id, document_type: 'selfie', file_name: 'live_selfie.jpg', file_url: selfieImage });
      }
      await supabase.from('profiles').update({ status: 'digilocker_verified', declaration: declaration }).eq('id', activeEmployee.id);
      setActiveEmployee(prev => ({ ...prev, status: 'digilocker_verified' }));

      // Automatically post a welcome announcement to the Announcements tab
      try {
        const empName = activeEmployee.full_name || 'A new colleague';
        const empPos = activeEmployee.position ? ` as ${activeEmployee.position}` : '';
        const todayISO = new Date().toISOString().split('T')[0];
        await supabase.from('notifications').insert({
          employee_id: null,
          title: `🎉 Welcome ${empName} to TOSBS!`,
          message: `${empName} has completed their onboarding and joined the team${empPos}! Please give them a warm welcome! 👏✨`,
          scheduled_date: todayISO,
          is_announcement: true,
          created_at: new Date().toISOString(),
        });
      } catch (annErr) {
        console.error('Error posting welcome announcement:', annErr);
      }

      setCurrentView('employee-status');
      loadActiveEmployeeDetails(activeEmployee.id);
      loadTodayAttendance(activeEmployee.id);
      loadEmployeeLeaves(activeEmployee.id);
      loadAttendanceHistory(activeEmployee.id);
      loadCelebrationsAndNotifications(activeEmployee.id);
    } catch (err) { console.error('Error submitting:', err); }
  };

  const getStatusBadge = (status) => {
    const map = { invited: 'badge-info', registered: 'badge-info', details_filled: 'badge-pending', digilocker_verified: 'badge-pending', approved: 'badge-success' };
    const labels = { invited: 'Invited', registered: 'Registered', details_filled: 'Details Filled', digilocker_verified: 'DigiLocker Verified', approved: 'Completed' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{labels[status] || status}</span>;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(hrSearchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(hrSearchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(hrSearchQuery.toLowerCase())
  );

  const exportEmployeeMasterSheet = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase.from("profiles").select("*");
      if (profileError) throw profileError;
      const { data: details, error: detailsError } = await supabase.from("employee_details").select("*");
      if (detailsError) throw detailsError;
      const { data: verifications, error: verificationsError } = await supabase.from("digilocker_verifications").select("*");
      if (verificationsError) throw verificationsError;
      const { data: docs, error: docsError } = await supabase.from("employee_documents").select("*");
      if (docsError) throw docsError;

      const exportData = profiles.map((emp) => {
        const detail = details.find((d) => d.employee_id === emp.id) || {};
        const verify = verifications.find((v) => v.employee_id === emp.id) || {};
        const empDocs = docs.filter((d) => d.employee_id === emp.id);
        const educationSummary = (detail.education_history || []).map((edu) => `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})`).join(' | ');
        const employmentSummary = (detail.employment_history || []).map((job) => `${job.role || ''} @ ${job.company || ''} (${job.startDate || '?'} to ${job.endDate || '?'})`).join(' | ');

        return {
          "Employee Name": emp.full_name || "", "Official Email": emp.email || "", "Designation": emp.position || "", "Status": emp.status || "",
          "Phone Number": detail.phone_number || "", "Personal Email": detail.personal_email || "",
          "Date of Birth": detail.dob || "", "Date of Joining": detail.date_of_joining || "", "Gender": detail.gender || "",
          "Permanent Address": detail.permanent_address || "", "Current Address": detail.current_address || "",
          "Father Name": detail.father_name || "", "Mother Name": detail.mother_name || "", "Marital Status": detail.marital_status || "",
          "Emergency Contact 1": detail.emergency_contact1 || "", "Emergency Contact 2": detail.emergency_contact2 || "",
          "Location Verified": detail.location_verified ? "Yes" : "No", "Distance From Address (m)": detail.location_distance_m ?? "",
          "Bank Name": detail.bank_name || "", "Account Number": detail.account_number || "", "IFSC Code": detail.ifsc_code || "",
          "Branch Name": detail.branch_name || "", "UAN Number": detail.uan_number || "", "PF Number": detail.pf_number || "",
          "Aadhaar (Masked)": verify.aadhaar_masked || "", "PAN Number": verify.pan_number || "",
          "Name on Aadhaar": verify.name_on_aadhaar || "", "DOB on Aadhaar": verify.dob_on_aadhaar || "",
          "Education History": educationSummary, "Employment History": employmentSummary,
          "Documents Uploaded": empDocs.length, "Photo Status": emp.photo_status || "", "Created At": emp.created_at || ""
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
      worksheet["!cols"] = [
        { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
        { wch: 35 }, { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
        { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 25 },
        { wch: 20 }, { wch: 50 }, { wch: 50 }, { wch: 16 }, { wch: 16 }, { wch: 25 }
      ];

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(blob, `Employee_Master_Sheet_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) { console.error(err); alert("Unable to export Excel sheet."); }
  };
  const exportAttendanceMasterSheet = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, position, status')
        .order('full_name', { ascending: true });

      const approvedEmployees = (profiles || []).filter(p => ['approved', 'digilocker_verified', 'details_filled', 'registered'].includes(p.status));
      if (approvedEmployees.length === 0) {
        alert('No employees found to export attendance master sheet.');
        return;
      }

      const { data: details } = await supabase
        .from('employee_details')
        .select('employee_id, date_of_joining');
      const dojMap = Object.fromEntries((details || []).map(d => [d.employee_id, d.date_of_joining]));

      const { data: leaves } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('status', 'approved');

      const workbook = XLSX.utils.book_new();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Start exporting from August 2026 (2026-08) up to current month
      const startYear = 2026;
      const startMonth = 8;
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const monthsToExport = [];
      let y = startYear;
      let m = startMonth;
      while (y < currentYear || (y === currentYear && m <= currentMonth)) {
        monthsToExport.push({ year: y, month: m });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      for (const { year, month } of monthsToExport) {
        const monthStr = String(month).padStart(2, '0');
        const daysInMonth = new Date(year, month, 0).getDate();
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        const attMap = {};
        (attendance || []).forEach(r => {
          attMap[`${r.employee_id}_${r.date}`] = r;
        });

        const monthHeaderLabel = `${monthNamesShort[month - 1]}-${String(year).slice(-2)}`;

        // Row 1: Month Year label (e.g. Aug-26)
        const row1 = ['', monthHeaderLabel];
        // Row 2: Legend
        const row2 = ['', 'H - HOLIDAY    NA - NOT APPLICABLE    HD - HALF DAY    WH- WORK FROM HOME    A-ABSENT    P - PRESENT    TOUR - T'];
        // Row 3: Day numbers (SR.NO., Name, 1, 2, 3...)
        const row3 = ['SR.NO.', 'Name'];
        // Row 4: Day names of week (SAT, SUN, MON, TUE, WED, THUR, FRI...)
        const row4 = ['', ''];

        for (let d = 1; d <= daysInMonth; d++) {
          row3.push(d);
          const dayOfWeek = new Date(year, month - 1, d).getDay();
          row4.push(dayNames[dayOfWeek]);
        }

        const sheetRows = [row1, row2, row3, row4];

        approvedEmployees.forEach((emp, idx) => {
          const row = [idx + 1, (emp.full_name || 'EMPLOYEE').toUpperCase()];
          const doj = dojMap[emp.id] || (emp.created_at ? emp.created_at.split('T')[0] : null);

          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            const rec = attMap[`${emp.id}_${dateStr}`];
            const isFest = FESTIVALS.some(f => f.month === monthStr && f.day === String(d).padStart(2, '0'));
            const hasLeave = (leaves || []).some(l => l.employee_id === emp.id && dateStr >= l.from_date && dateStr <= l.to_date);

            if (doj && dateStr < doj) {
              row.push('NA');
            } else if (rec) {
              if (rec.work_type === 'wfh') row.push('WFH');
              else if (rec.work_type === 'on_tour' || rec.status === 'tour') row.push('Tour');
              else if (rec.status === 'half_day') row.push('HD');
              else if (rec.status === 'leave') row.push('Leave');
              else if (rec.status === 'holiday') row.push('H');
              else if (rec.status === 'absent') row.push('A');
              else if (rec.status === 'present') row.push('P');
              else row.push(rec.status?.toUpperCase() || 'P');
            } else if (hasLeave) {
              row.push('Leave');
            } else if (isFest) {
              row.push('H');
            } else if (dayOfWeek === 0) {
              // Sunday
              row.push('');
            } else if (dateStr <= todayStr) {
              row.push('A');
            } else {
              row.push('');
            }
          }
          sheetRows.push(row);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
        const cols = [{ wch: 8 }, { wch: 30 }];
        for (let i = 0; i < daysInMonth; i++) {
          cols.push({ wch: 5 });
        }
        worksheet['!cols'] = cols;

        const sheetTabName = `${monthNamesShort[month - 1]} ${year}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetTabName);
      }

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      saveAs(blob, `Attendance_Master_Sheet_${todayStr}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Unable to export attendance master sheet.');
    }
  };

  const exportSingleEmployeeSheet = (emp, details, verification, docs) => {
    try {
      const workbook = XLSX.utils.book_new();
      const profileRows = [
        ["Employee Name", emp.full_name || ""], ["Official Email", emp.email || ""], ["Designation", emp.position || ""],
        ["Status", emp.status || ""], ["Employee ID", emp.id || ""], [],
        ["Phone Number", details?.phone_number || ""], ["Personal Email", details?.personal_email || ""],
        ["Date of Birth", details?.dob || ""], ["Date of Joining", details?.date_of_joining || ""], ["Gender", details?.gender || ""],
        ["Permanent Address", details?.permanent_address || ""], ["Current Address", details?.current_address || ""], [],
        ["Father Name", details?.father_name || ""], ["Father DOB", details?.father_dob || ""],
        ["Mother Name", details?.mother_name || ""], ["Mother DOB", details?.mother_dob || ""],
        ["Marital Status", details?.marital_status || ""], ["Spouse Name", details?.spouse_name || ""], ["Spouse DOB", details?.spouse_dob || ""],
        ["Number of Kids", details?.number_of_kids ?? ""], ["Emergency Contact 1", details?.emergency_contact1 || ""],
        ["Emergency Contact 2", details?.emergency_contact2 || ""], [],
        ["Location Verified", details?.location_verified ? "Yes" : "No"], ["Distance From Address (m)", details?.location_distance_m ?? ""], [],
        ["Bank Name", details?.bank_name || ""], ["Account Number", details?.account_number || ""], ["IFSC Code", details?.ifsc_code || ""],
        ["Branch Name", details?.branch_name || ""], ["UAN Number", details?.uan_number || ""], ["PF Number", details?.pf_number || ""], [],
        ["Aadhaar (Masked)", verification?.aadhaar_masked || ""], ["PAN Number", verification?.pan_number || ""],
        ["Name on Aadhaar", verification?.name_on_aadhaar || ""], ["DOB on Aadhaar", verification?.dob_on_aadhaar || ""],
        ["Gender on Aadhaar", verification?.gender_on_aadhaar || ""], [],
        ["Photo Status", emp.photo_status || ""], ["Created At", emp.created_at || ""],
      ];
      const profileSheet = XLSX.utils.aoa_to_sheet(profileRows);
      profileSheet["!cols"] = [{ wch: 26 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(workbook, profileSheet, "Profile");

      const educationRows = (details?.education_history || []).map((edu) => ({ "Degree": edu.degree || "", "Institution": edu.institution || "", "Year": edu.year || "", "Grade": edu.grade || "" }));
      const educationSheet = XLSX.utils.json_to_sheet(educationRows.length ? educationRows : [{ "Degree": "", "Institution": "", "Year": "", "Grade": "" }]);
      educationSheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, educationSheet, "Education History");

      const employmentRows = (details?.employment_history || []).map((job) => ({ "Company": job.company || "", "Role": job.role || "", "Start Date": job.startDate || "", "End Date": job.endDate || "" }));
      const employmentSheet = XLSX.utils.json_to_sheet(employmentRows.length ? employmentRows : [{ "Company": "", "Role": "", "Start Date": "", "End Date": "" }]);
      employmentSheet["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(workbook, employmentSheet, "Employment History");

      const documentRows = (docs || []).map((doc) => ({ "Document Type": doc.document_type?.toUpperCase() || "", "File Name": doc.file_name || "", "Uploaded At": doc.uploaded_at || "" }));
      const documentsSheet = XLSX.utils.json_to_sheet(documentRows.length ? documentRows : [{ "Document Type": "", "File Name": "", "Uploaded At": "" }]);
      documentsSheet["!cols"] = [{ wch: 18 }, { wch: 30 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, documentsSheet, "Documents");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      const safeName = (emp.full_name || "Employee").replace(/[^a-z0-9]/gi, "_");
      saveAs(blob, `${safeName}_Onboarding_Data.xlsx`);
    } catch (err) { console.error(err); alert("Unable to export this employee's Excel sheet."); }
  };

  return (
    <div className="app-container">
      {showAnnouncementPopup && currentPopupAnnouncement && (() => {
        const { startDate, endDate, cleanMessage } = getAnnouncementDates(currentPopupAnnouncement);
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ backgroundColor: '#0f1f3d', border: '2px solid rgba(200,146,42,0.4)', borderRadius: '20px', maxWidth: '520px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a2d4a, #0f1f3d)', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(200,146,42,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #c8922a, #e0a832)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', animation: 'pulse 2s ease infinite' }}>📢</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-orange)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOSBS Announcement</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      {endDate ? ` → ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAnnouncementPopup(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
              </div>
              {currentPopupAnnouncement.image_url && (
                <img src={currentPopupAnnouncement.image_url} alt="Announcement" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.3 }}>{currentPopupAnnouncement.title}</h2>
                {cleanMessage && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{cleanMessage}</p>}
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(200,146,42,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAnnouncementPopup(false)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Got it 👍</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* VIEW 1: SPLASH — employee-first, HR access is a small manual link only */}
      {currentView === 'splash' && (
        <div style={splashContainerStyle}>
          <img src="/Capture.JPG" alt="TOSBS Logo" style={{ height: '150px', marginBottom: '1rem' }} />
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={splashLogoStyle}>ONBOARDING PORTAL</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}></p>
          </div>
          <div className="glass-card" style={{ ...splashCardStyle, maxWidth: '480px', width: '100%', cursor: 'pointer' }} onClick={() => setCurrentView('employee-login')}>
            <div style={splashIconWrapperStyle}><Users size={32} color="#3b82f6" /></div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Employee Onboarding</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>Join your team, log back in, or continue your onboarding and credential verification.</p>
            <div style={splashLinkStyle}><span>Continue as Employee</span><ArrowRight size={16} /></div>
          </div>
          <button
            onClick={() => setCurrentView('hr-login')}
            style={{ marginTop: '2.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            HR Administration Login
          </button>
        </div>
      )}

      {/* VIEW 1b: EMPLOYEE LOGIN */}
      {currentView === 'employee-login' && (
        <div style={loginWrapperStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Employee Onboarding</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>New here? Enter your Short Code or Invite Token below.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Short Code / Invite Token</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. TOSBS28 or token..."
                  value={inviteToken}
                  onChange={(e) => { setInviteToken(e.target.value); setRegError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && validateInviteToken(inviteToken)}
                  style={{ flexGrow: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                  className="form-input"
                  autoFocus
                />
                <button onClick={() => validateInviteToken(inviteToken)} className="btn btn-primary" style={{ padding: '0 1.25rem' }}>Go</button>
              </div>
              {regError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{regError}</p>}
            </div>
            <div style={{ margin: '1.75rem 0', paddingTop: '1.75rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>Already registered? Log back in:</p>
              <form onSubmit={handleEmployeeLogin}>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input type="email" placeholder="you@tosbs.com" value={empLoginEmail} onChange={(e) => setEmpLoginEmail(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Password</label>
                  <input type="password" placeholder="••••••••" value={empLoginPassword} onChange={(e) => setEmpLoginPassword(e.target.value)} className="form-input" />
                </div>
                {empLoginError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>{empLoginError}</p>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login →</button>
              </form>
            </div>
            <button onClick={() => setCurrentView('splash')} className="btn btn-secondary" style={{ width: '100%' }}>← Back</button>
          </div>
        </div>
      )}

      {/* VIEW 2: HR LOGIN */}
      {currentView === 'hr-login' && (
        <div style={loginWrapperStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>HR Officer Login</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Sign in to manage employees and view records</p>
            </div>
            <form onSubmit={handleHrLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} className="form-input" placeholder="Username" required />
              </div>
              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">Password</label>
                <input type="password" value={hrPassword} onChange={(e) => setHrPassword(e.target.value)} className="form-input" required />
              </div>
              {hrLoginError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ShieldAlert size={16} /><span>{hrLoginError}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setCurrentView('splash')} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Log In <Lock size={16} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 3: HR DASHBOARD */}
      {currentView === 'hr-dashboard' && hrUser && (
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>
              <img src="/Capture.JPG" alt="TOSBS" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
            </div>
            <nav style={sidebarNavStyle}>
              <button onClick={() => setHrActiveTab('analytics')} style={hrActiveTab === 'analytics' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <LayoutDashboard size={18} /><span>Dashboard</span>
              </button>
              <button onClick={() => setHrActiveTab('employees')} style={hrActiveTab === 'employees' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <Users size={18} /><span>Employees</span>
                {stats.pendingReview > 0 && <span style={badgeCountStyle}>{stats.pendingReview}</span>}
              </button>
              <button onClick={() => { setHrActiveTab('attendance'); loadHrAttendance(); }} style={hrActiveTab === 'attendance' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <Clock size={18} /><span>Attendance</span>
              </button>
                           <button onClick={() => { setHrActiveTab('leaves'); loadHrLeaves(); }} style={hrActiveTab === 'leaves' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <CalendarDays size={18} /><span>Leave Requests</span>
                {hrLeaveApplications.filter(l => l.status === 'pending').length > 0 && <span style={badgeCountStyle}>{hrLeaveApplications.filter(l => l.status === 'pending').length}</span>}
              </button>
              <button onClick={() => setHrActiveTab('salary')} style={hrActiveTab === 'salary' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <Award size={18} /><span>Salary</span>
              </button>
            
              <button onClick={() => { setHrActiveTab('reimbursements'); loadHrReimbursements(); }} style={hrActiveTab === 'reimbursements' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <CreditCard size={18} /><span>Reimbursements</span>
                {hrReimbursements.filter(r => r.status === 'pending').length > 0 && <span style={badgeCountStyle}>{hrReimbursements.filter(r => r.status === 'pending').length}</span>}
              </button>
              <button onClick={() => { setHrActiveTab('resignations'); loadHrResignations(); }} style={hrActiveTab === 'resignations' ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <UserMinus size={18} /><span>Resignations</span>
                {hrResignations.filter(r => r.status === 'pending').length > 0 && <span style={badgeCountStyle}>{hrResignations.filter(r => r.status === 'pending').length}</span>}
              </button>
              <button onClick={() => setShowAnnouncement(!showAnnouncement)} style={sidebarLinkStyle}>
                <Bell size={18} /><span>Announce</span>
              </button>
                            {showAnnouncement && (
                <div style={{ position: 'fixed', top: 0, left: '260px', right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-start', padding: '2rem', overflowY: 'auto' }}>
                  <div className="glass-card" style={{ width: '100%', maxWidth: '700px', border: '1px solid rgba(200,146,42,0.3)', animation: 'slideUp 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📢 Manage Announcements</h2>
                      <button onClick={() => setShowAnnouncement(false)} className="btn btn-secondary" style={{ padding: '4px 10px' }}>✕</button>
                    </div>

                    {/* Create */}
                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(200,146,42,0.05)', borderRadius: '12px', border: '1px solid rgba(200,146,42,0.15)', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.85rem', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>New Announcement</h3>
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input type="text" placeholder="e.g. Office closed on Diwali" value={announcementForm.title} onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})} className="form-input" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Start Date (blank = today)</label>
                          <input type="date" value={announcementForm.start_date || announcementForm.scheduled_date} onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value, scheduled_date: e.target.value})} className="form-input" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Date (optional / until when active)</label>
                          <input type="date" value={announcementForm.end_date} onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})} className="form-input" min={announcementForm.start_date || announcementForm.scheduled_date || new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Message</label>
                        <textarea placeholder="Write your announcement message..." value={announcementForm.message} onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})} className="form-input" style={{ minHeight: '90px', resize: 'vertical' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Attach Image (optional)</label>
                        <input type="file" accept="image/*" onChange={handleAnnouncementImageUpload} className="form-input" />
                        {announcementImageFile && <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>✓ {announcementImageFile}</p>}
                        {announcementForm.image_url && <img src={announcementForm.image_url} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem' }} />}
                      </div>
                      <button onClick={sendAnnouncement} className="btn btn-primary">
                        {(announcementForm.start_date || announcementForm.scheduled_date) && (announcementForm.start_date || announcementForm.scheduled_date) > new Date().toISOString().split('T')[0] ? '📅 Schedule Announcement' : '📢 Publish Announcement'}
                      </button>
                    </div>

                    {/* List */}
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>All Announcements</h3>
                    {notifications.filter(n => n.is_announcement).length === 0
                      ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No announcements yet.</p>
                      : notifications.filter(n => n.is_announcement).map((ann, i) => {
                        const { startDate, endDate, cleanMessage } = getAnnouncementDates(ann);
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isFuture = startDate && startDate > todayStr;
                        const isExpired = endDate && endDate < todayStr;
                        const isActive = !isFuture && !isExpired;

                        return (
                          <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${isActive ? 'rgba(200,146,42,0.3)' : isFuture ? 'rgba(59,130,246,0.3)' : 'rgba(100,116,139,0.2)'}`, display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            {ann.image_url && <img src={ann.image_url} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>{ann.title}</p>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
                                    <span className={`badge ${isActive ? 'badge-success' : isFuture ? 'badge-pending' : ''}`} style={!isActive && !isFuture ? { backgroundColor: 'rgba(100,116,139,0.15)', color: '#64748b' } : {}}>
                                      {isActive ? '● Active / Live' : isFuture ? '📅 Scheduled' : '⌛ Expired'}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                      {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                      {endDate ? ` → ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ' (No expiry)'}
                                    </span>
                                  </div>
                                </div>
                                <button onClick={() => deleteAnnouncement(ann.id)} className="btn btn-danger" style={{ padding: '3px 7px', fontSize: '0.72rem' }}>Delete</button>
                              </div>
                              {cleanMessage && <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{cleanMessage}</p>}
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}
            </nav>
            <div style={sidebarUserStyle}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>SJ</div>
              <div style={{ flexGrow: 1, minWidth: 0, marginLeft: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{hrUser.name}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Team Leader</p>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); setHrUser(null); setCurrentView('splash'); }} style={logoutButtonStyle} title="Sign Out"><LogOut size={16} /></button>
            </div>
          </div>

          <div className="main-content">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {hrActiveTab === 'analytics' ? 'HR Dashboard' : hrActiveTab === 'attendance' ? 'Attendance Records' : hrActiveTab === 'leaves' ? 'Leave Requests' : hrActiveTab === 'salary' ? 'Salary & Payroll' : hrActiveTab === 'reimbursements' ? 'Reimbursements' : hrActiveTab === 'resignations' ? 'Resignations & Offboarding' : 'Employee Profiles'}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {hrActiveTab === 'analytics' ? 'Real-time workforce efficiency and onboarding tracking metrics.'
                    : hrActiveTab === 'attendance' ? 'Review daily check-in/check-out records across the team.'
                    : hrActiveTab === 'leaves' ? 'Approve or reject employee leave applications.'
                    : hrActiveTab === 'salary' ? 'Monthly CTC configuration and compensation breakdowns.'
                    : hrActiveTab === 'reimbursements' ? 'Review and process employee expense claims.'
                    : hrActiveTab === 'resignations' ? 'Manage employee resignation requests, notice periods, and automated 5-day deactivation.'
                    : 'Manage registrations and monitor your global human capital pipelines.'}
                </p>
              </div>
              {hrActiveTab === 'employees' && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={exportEmployeeMasterSheet} className="btn btn-secondary"><FileText size={16} /> Master Sheet</button>
                  <button onClick={() => setIsAddingEmployee(true)} className="btn btn-primary"><Plus size={18} /> Add Employee</button>
                </div>
              )}
            </header>

            {hrActiveTab === 'analytics' && (
              <div>
                <div className="stats-grid">
                  {[
                    { label: 'Total Pipeline', val: stats.total, sub: 'Active accounts created', icon: <Users size={20} color="var(--color-orange)" /> },
                    { label: 'Onboarding Completed', val: stats.completed, sub: 'Credentials approved by HR', icon: <UserCheck size={20} color="var(--color-success)" /> },
                    { label: 'Under Review', val: stats.pendingReview, sub: 'Verified via DigiLocker', icon: <Clock size={20} color="var(--color-pending)" /> },
                    { label: 'Pending Submission', val: stats.pendingVerify, sub: 'Hires filling forms', icon: <FileText size={20} color="#3b82f6" /> },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={statCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={statLabelStyle}>{s.label}</span>{s.icon}</div>
                      <h3 style={statValStyle}>{s.val}</h3>
                      <p style={statSubStyle}>{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div style={analyticsGridStyle}>
                  <div className="glass-card" style={{ flexGrow: 2 }}>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Workforce Onboarding Trend</h3>
                    <div style={{ height: '220px', width: '100%' }}>
                      <LineChart data={[15, 30, 25, 45, 55, 70, stats.total * 3.5 || 60, 75, 90]} labels={['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} />
                    </div>
                  </div>
                  <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Onboarding Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {employees.filter(e => e.status === 'digilocker_verified').length === 0
                        ? <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No pending verifications to review.</div>
                        : employees.filter(e => e.status === 'digilocker_verified').map(emp => (
                          <div key={emp.id} style={actionItemStyle} onClick={() => handleInspectEmployee(emp)}>
                            <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.75rem', flexShrink: 0 }}>{emp.full_name?.charAt(0) || 'E'}</div>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{emp.full_name}</p>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>DigiLocker ID Verified</p>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Audit</button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hrActiveTab === 'employees' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input type="text" placeholder="Search employees by name, position..." value={hrSearchQuery} onChange={(e) => setHrSearchQuery(e.target.value)} style={{ paddingLeft: '2.5rem' }} className="form-input" />
                  </div>
                </div>

                {isAddingEmployee && (
                  <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--color-orange)' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem' }}>Register New Employee</h3>
                      <button onClick={() => { setIsAddingEmployee(false); setGeneratedInviteLink(''); }} className="btn btn-secondary" style={{ padding: '4px 8px' }}><X size={16} /></button>
                    </div>
                    <form onSubmit={handleCreateEmployee}>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input type="text" placeholder="e.g. Shivaji Kharat" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Work Email</label>
                          <input type="email" placeholder="e.g. shivaji.k@tosbs.com" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Department</label>
                          <input type="text" placeholder="e.g. Engineering" value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)} className="form-input" required />
                        </div>
                      </div>
                      <div className="form-row" style={{ marginTop: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Designation</label>
                          <input type="text" placeholder="e.g. Software Engineer" value={newEmpDesg} onChange={(e) => setNewEmpDesg(e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Short Code (e.g. TOSBS28)</label>
                          <input type="text" placeholder="e.g. TOSBS28 (auto-generated if blank)" value={newEmpShortCode} onChange={(e) => setNewEmpShortCode(e.target.value.toUpperCase())} className="form-input" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Temporary Password</label>
                          <input type="text" placeholder="e.g. Welcome@123" value={newEmpTempPassword} onChange={(e) => setNewEmpTempPassword(e.target.value)} className="form-input" required />
                        </div>
                      </div>
                      {generatedInviteLink && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-orange)', fontWeight: 600, marginBottom: '0.5rem' }}>Employee Short Code Created:</p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <input type="text" readOnly value={generatedInviteLink} className="form-input" style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-primary)' }} />
                            <button type="button" onClick={copyInviteLink} className="btn btn-secondary">{copiedLink ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}</button>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            Share this <strong style={{ color: 'var(--color-text-primary)' }}>Short Code ({generatedInviteLink})</strong> with the employee. They simply enter this code into the <strong style={{ color: 'var(--color-text-primary)' }}>Short Code / Invite Token</strong> field on the Employee login screen to start onboarding!
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={() => { setIsAddingEmployee(false); setGeneratedInviteLink(''); }} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Employee & Generate Short Code</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="custom-table">
                    <thead><tr><th>Employee</th><th>Short Code</th><th>Position</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                    <tbody>
                      {filteredEmployees.length === 0
                        ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No employees found.</td></tr>
                        : filteredEmployees.map(emp => (
                          <tr key={emp.id} onClick={() => handleInspectEmployee(emp)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="avatar-circle" style={{ width: '32px', height: '32px' }}>{emp.full_name?.charAt(0) || 'E'}</div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600 }}>{emp.full_name}</p>
                                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{emp.email}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              {emp.short_code || emp.invite_token ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(59,130,246,0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                  {emp.short_code || emp.invite_token}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>-</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{emp.position || 'General Staff'}</td>
                            <td>{getStatusBadge(emp.status)}</td>
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{emp.created_at ? new Date(emp.created_at).toLocaleDateString() : 'Recent'}</td>
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button onClick={() => handleInspectEmployee(emp)} className="btn btn-secondary" style={{ padding: '6px' }}><Eye size={14} /></button>
                                <button onClick={(e) => handleDeleteEmployee(emp.id, e)} className="btn btn-danger" style={{ padding: '6px' }}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {hrActiveTab === 'attendance' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input type="date" value={hrAttendanceDate} onChange={(e) => setHrAttendanceDate(e.target.value)} className="form-input" style={{ maxWidth: '180px' }} />
                  <select value={hrAttendanceEmployee} onChange={(e) => setHrAttendanceEmployee(e.target.value)} className="form-select" style={{ maxWidth: '220px' }}>
                    <option value="all">All Employees</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                  </select>
                  <button onClick={loadHrAttendance} className="btn btn-primary">Load Attendance</button>
                  <button onClick={exportAttendanceMasterSheet} className="btn btn-secondary"><FileText size={16} /> Download Master Sheet</button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  {!isMarkingManual ? (
                    <button onClick={() => setIsMarkingManual(true)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>✏️ Manual Attendance Entry</button>
                  ) : (
                    <div className="glass-card" style={{ border: '1px solid rgba(200,146,42,0.3)' }}>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Manual Attendance Override</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Employee</label>
                                            <select className="form-select" value={hrSalaryEmployee} onChange={(e) => { setHrSalaryEmployee(e.target.value); setSalaryBreakdown(null); if (e.target.value) computeSalary(e.target.value, salaryMonth); }} style={{ maxWidth: '260px' }}>
                            <option value="">Select employee...</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date</label>
                          <input type="date" className="form-input" value={manualAttendance.date} onChange={(e) => setManualAttendance({ ...manualAttendance, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <select className="form-select" value={manualAttendance.status} onChange={(e) => setManualAttendance({ ...manualAttendance, status: e.target.value })}>
                            <option value="present">Present</option><option value="absent">Absent</option>
                            <option value="half_day">Half Day</option><option value="leave">On Leave</option><option value="holiday">Holiday</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Work Type</label>
                          <select className="form-select" value={manualAttendance.work_type} onChange={(e) => setManualAttendance({ ...manualAttendance, work_type: e.target.value })}>
                            <option value="office">Office</option><option value="wfh">WFH</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Note (optional)</label>
                        <input type="text" className="form-input" placeholder="e.g. Medical leave, approved WFH..." value={manualAttendance.note} onChange={(e) => setManualAttendance({ ...manualAttendance, note: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button onClick={() => setIsMarkingManual(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleManualAttendance} className="btn btn-primary">Save Attendance</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                  {[
                   { label: 'Present', val: hrAttendanceData.filter(r => r.status === 'present').length, color: 'var(--color-success)' },
                    { label: 'Absent', val: hrAttendanceData.filter(r => r.status === 'absent').length, color: 'var(--color-danger)' },
                    { label: 'WFH', val: hrAttendanceData.filter(r => r.work_type === 'wfh').length, color: 'var(--color-pending)' },
                    { label: 'WFH Today', val: hrAttendanceData.filter(r => r.work_type === 'wfh').length, color: '#c8922a' },
                    { label: 'Avg Hours', val: hrAttendanceData.filter(r => r.work_hours).length > 0 ? (hrAttendanceData.reduce((s, r) => s + (r.work_hours || 0), 0) / hrAttendanceData.filter(r => r.work_hours).length).toFixed(1) + 'h' : '—', color: 'var(--color-orange)' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                      <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</h3>
                    </div>
                  ))}
                </div>

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="custom-table">
                    <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Distance</th><th>Photos</th><th>Status</th></tr></thead>
                    <tbody>
                      {hrAttendanceData.length === 0
                        ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No attendance records for this date.</td></tr>
                        : hrAttendanceData.map((rec, i) => (
                          <tr key={i}>
                            <td>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{rec.profiles?.full_name || '—'}</p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.profiles?.position || ''}</p>
                            </td>
                            <td>{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td>{rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td style={{ fontWeight: 600 }}>{rec.work_hours ? `${rec.work_hours}h` : '—'}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{rec.check_in_distance_m ? `${rec.check_in_distance_m}m` : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {rec.check_in_photo && <img src={rec.check_in_photo} alt="In" title="Check In" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)', transform: 'scaleX(-1)' }} onClick={() => window.open(rec.check_in_photo)} />}
                                {rec.check_out_photo && <img src={rec.check_out_photo} alt="Out" title="Check Out" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.4)', transform: 'scaleX(-1)' }} onClick={() => window.open(rec.check_out_photo)} />}
                                {!rec.check_in_photo && !rec.check_out_photo && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                               {rec.work_type === 'wfh' && <span className="badge badge-pending">🏠 WFH</span>}
                                {rec.work_type === 'on_tour' && <span className="badge badge-info">🚗 On Tour</span>}
                                {rec.status === 'present' && rec.work_type === 'office' && !rec.work_type?.includes('wfh') && !rec.work_type?.includes('tour') && <span className="badge badge-success">✓ Present</span>}
                                {rec.status === 'absent' && <span className="badge badge-danger">✗ Absent</span>}
                                {rec.status === 'holiday' && <span className="badge badge-info">🎉 Holiday</span>}
                                {rec.status === 'leave' && <span className="badge badge-pending">📋 Leave</span>}
                                {rec.work_hours > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.work_hours}h</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {hrActiveTab === 'salary' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select className="form-select" value={hrSalaryEmployee} onChange={(e) => { setHrSalaryEmployee(e.target.value); setSalaryBreakdown(null); if (e.target.value) computeSalary(e.target.value, salaryMonth); }} style={{ maxWidth: '260px' }}>
                    <option value="">Select employee...</option>
                    {employees.filter(e => e.status === 'approved').map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                  </select>
                  <input type="month" className="form-input" value={salaryMonth} onChange={(e) => { setSalaryMonth(e.target.value); if (hrSalaryEmployee) computeSalary(hrSalaryEmployee, e.target.value); }} style={{ maxWidth: '180px' }} />
                  <button onClick={() => hrSalaryEmployee && computeSalary(hrSalaryEmployee, salaryMonth)} className="btn btn-primary" disabled={!hrSalaryEmployee || salaryLoading}>
                    {salaryLoading ? 'Calculating...' : 'Calculate Salary'}
                  </button>
                  <button onClick={exportSalaryMasterSheet} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> Export Salary Master Sheet
                  </button>
                </div>

                {hrSalaryEmployee && (
                  <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Set Monthly CTC</h3>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Monthly CTC (₹)</label>
                        <input type="number" className="form-input" value={salaryConfig.monthly_ctc} onChange={(e) => setSalaryConfig({ ...salaryConfig, monthly_ctc: e.target.value })} placeholder="e.g. 45000" />
                      </div>
                      
                    </div>
                    <button onClick={() => saveSalaryConfig(hrSalaryEmployee)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Save CTC</button>
                  </div>
                )}

                                {salaryBreakdown && (
                  <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      Salary Breakdown — {employees.find(e => e.id === hrSalaryEmployee)?.full_name} · {new Date(salaryMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div><p style={detailLabelStyle}>Monthly CTC</p><p style={detailValueStyle}>₹{salaryBreakdown.monthlyCtc.toLocaleString('en-IN')}</p></div>
                      <div><p style={detailLabelStyle}>Per-Day Rate</p><p style={detailValueStyle}>₹{salaryBreakdown.perDayRate.toFixed(2)}</p></div>
                      <div><p style={detailLabelStyle}>Working Days</p><p style={detailValueStyle}>{salaryBreakdown.workingDaysInMonth}</p></div>
                      <div><p style={detailLabelStyle}>Present Days</p><p style={detailValueStyle}>{salaryBreakdown.presentDays}</p></div>
                      <div><p style={detailLabelStyle}>Total Absents</p><p style={{ ...detailValueStyle, color: 'var(--color-danger)' }}>{salaryBreakdown.absentDays}</p></div>
                      <div><p style={detailLabelStyle}>Free Leave (1.5d)</p><p style={{ ...detailValueStyle, color: 'var(--color-success)' }}>{salaryBreakdown.freeLeaveAllowance}</p></div>
                      <div><p style={detailLabelStyle}>Billable Absents</p><p style={{ ...detailValueStyle, color: 'var(--color-danger)' }}>{salaryBreakdown.billableAbsents}</p></div>
                      <div><p style={detailLabelStyle}>Half Days</p><p style={{ ...detailValueStyle, color: 'var(--color-pending)' }}>{salaryBreakdown.halfDays}</p></div>
                      <div><p style={detailLabelStyle}>Sandwich Penalty</p><p style={{ ...detailValueStyle, color: 'var(--color-danger)' }}>{salaryBreakdown.sandwichPenaltyDays} day(s)</p></div>
                      <div><p style={detailLabelStyle}>Leave Days</p><p style={detailValueStyle}>{salaryBreakdown.leaveDays}</p></div>
                      <div><p style={detailLabelStyle}>Holidays</p><p style={detailValueStyle}>{salaryBreakdown.holidayDays}</p></div>
                      <div><p style={detailLabelStyle}>Sunday Worked</p><p style={{ ...detailValueStyle, color: 'var(--color-success)' }}>{salaryBreakdown.sundayWorkedDays} (comp-off earned)</p></div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.9rem' }}>Monthly CTC</span><span style={{ fontSize: '0.9rem' }}>₹{salaryBreakdown.monthlyCtc.toLocaleString('en-IN')}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>− Absence Deduction ({salaryBreakdown.billableAbsents} days)</span><span style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>− ₹{salaryBreakdown.deduction.toLocaleString('en-IN')}</span></div>
                      {salaryBreakdown.sandwichPenaltyDays > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>− Sandwich Rule ({salaryBreakdown.sandwichPenaltyDays} extra day)</span><span style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>included above</span></div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-orange)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>Net Salary</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-orange)' }}>₹{salaryBreakdown.netSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    {salaryBreakdown.sundayWorkedDays > 0 && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem', color: 'var(--color-success)' }}>
                        ℹ️ {salaryBreakdown.sundayWorkedDays} Sunday(s) worked this month. Compensatory off to be approved by HR separately.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {hrActiveTab === 'leaves' && (
              <div>
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Pending', val: hrLeaveApplications.filter(l => l.status === 'pending').length, color: 'var(--color-pending)' },
                    { label: 'Approved', val: hrLeaveApplications.filter(l => l.status === 'approved').length, color: 'var(--color-success)' },
                    { label: 'Rejected', val: hrLeaveApplications.filter(l => l.status === 'rejected').length, color: 'var(--color-danger)' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                      <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</h3>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hrLeaveApplications.length === 0
                    ? <div className="glass-card"><p style={noDataStyle}>No leave applications yet.</p></div>
                    : hrLeaveApplications.map((leave) => (
                      <div key={leave.id} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{leave.profiles?.full_name || '—'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{leave.profiles?.position || ''}</p>
                            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                              {leave.leave_type === 'CL' ? 'Casual Leave' : leave.leave_type === 'SL' ? 'Sick Leave' : 'Earned Leave'} · {leave.from_date} → {leave.to_date}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{leave.reason}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <span className={`badge ${leave.status === 'approved' ? 'badge-success' : leave.status === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                              {leave.status === 'approved' ? '✓ Approved' : leave.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                            </span>
                            {leave.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleLeaveVerdict(leave, 'approved')} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>Approve</button>
                                <button onClick={() => { const note = window.prompt('Reason for rejection (optional):') || ''; handleLeaveVerdict(leave, 'rejected', note); }} className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {hrActiveTab === 'reimbursements' && (
              <div>
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Pending', val: hrReimbursements.filter(r => r.status === 'pending').length, color: 'var(--color-pending)' },
                    { label: 'Approved', val: hrReimbursements.filter(r => r.status === 'approved').length, color: 'var(--color-success)' },
                    { label: 'Rejected', val: hrReimbursements.filter(r => r.status === 'rejected').length, color: 'var(--color-danger)' },
                    { label: 'Total Pending (₹)', val: `₹${hrReimbursements.filter(r => r.status === 'pending').reduce((s, r) => s + parseFloat(r.total_amount || 0), 0).toFixed(2)}`, color: 'var(--color-orange)' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                      <h3 style={{ margin: 0, fontSize: s.label.includes('₹') ? '1.5rem' : '2rem', fontWeight: 800, color: s.color }}>{s.val}</h3>
                    </div>
                  ))}
                </div>

                {/* Export button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                  <button onClick={exportReimbursementsExcel} className="btn btn-secondary"><FileText size={16} /> Export to Excel</button>
                </div>

                {/* Reimbursement cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hrReimbursements.length === 0 ? (
                    <div className="glass-card"><p style={noDataStyle}>No reimbursement requests yet.</p></div>
                  ) : hrReimbursements.map((r, i) => (
                    <div key={i} className="glass-card" style={{ border: `1px solid ${r.status === 'approved' ? 'rgba(16,185,129,0.2)' : r.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(200,146,42,0.2)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>

                        {/* Left */}
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.8rem', flexShrink: 0 }}>{r.profiles?.full_name?.charAt(0)}</div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{r.profiles?.full_name}</p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.profiles?.position}</p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div><p style={detailLabelStyle}>Date</p><p style={detailValueStyle}>{r.date}</p></div>
                            <div><p style={detailLabelStyle}>Client / Place</p><p style={detailValueStyle}>{r.client_name}</p></div>
                            {r.start_time && <div><p style={detailLabelStyle}>Timing</p><p style={detailValueStyle}>{r.start_time} – {r.end_time}</p></div>}
                          </div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p style={detailLabelStyle}>Work Description</p>
                            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{r.work_description}</p>
                          </div>
                          <div>
                            <p style={detailLabelStyle}>Expenses</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '4px' }}>
                              {(r.expenses || []).map((e, j) => (
                                <span key={j} style={{ fontSize: '0.78rem', padding: '3px 10px', backgroundColor: 'rgba(200,146,42,0.08)', borderRadius: '20px', border: '1px solid rgba(200,146,42,0.15)', color: 'var(--color-text-primary)' }}>
                                  {e.category}: {e.description} — ₹{e.amount}
                                </span>
                              ))}
                            </div>
                          </div>
                          {r.receipt_url && (
                            <a href={r.receipt_url} download="receipt" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FileText size={13} /> View Receipt
                            </a>
                          )}
                          {r.hr_note && <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--color-pending)' }}>HR Note: {r.hr_note}</p>}
                          {r.paid_date && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-success)' }}>✓ Paid on: {r.paid_date}</p>}
                        </div>

                        {/* Right */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '160px' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-orange)' }}>₹{parseFloat(r.total_amount).toFixed(2)}</span>
                          <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                            {r.status === 'approved' ? '✓ Approved & Paid' : r.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                          </span>
                          {r.status === 'pending' && (
                            <>
                              <input type="text" placeholder="Add note (optional)..." className="form-input" style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', width: '100%' }} id={`reimb-note-${r.id}`} />
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleReimbVerdict(r, 'rejected', document.getElementById(`reimb-note-${r.id}`)?.value)} className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>✗ Reject</button>
                                <button onClick={() => handleReimbVerdict(r, 'approved', document.getElementById(`reimb-note-${r.id}`)?.value)} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>✓ Approve & Pay</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hrActiveTab === 'resignations' && (
              <div>
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Pending Requests', val: hrResignations.filter(r => r.status === 'pending').length, color: 'var(--color-pending)', icon: <Clock size={20} color="var(--color-pending)" /> },
                    { label: 'Serving Notice', val: hrResignations.filter(r => (r.status === 'notice_period' || r.status === 'approved') && (!r.notice_end_date || r.notice_end_date >= new Date().toISOString().split('T')[0])).length, color: 'var(--color-orange)', icon: <CalendarDays size={20} color="var(--color-orange)" /> },
                    { label: 'Notice Over (5d Grace)', val: hrResignations.filter(r => (r.status === 'notice_period' || r.status === 'approved') && r.notice_end_date && r.notice_end_date < new Date().toISOString().split('T')[0]).length, color: '#f59e0b', icon: <AlertCircle size={20} color="#f59e0b)" /> },
                    { label: 'Deactivated Accounts', val: hrResignations.filter(r => r.status === 'deactivated').length, color: 'var(--color-text-muted)', icon: <UserMinus size={20} color="var(--color-text-muted)" /> },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                        {s.icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</h3>
                    </div>
                  ))}
                </div>

                {/* Filters & Export */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All Requests' },
                      { id: 'pending', label: 'Pending Review' },
                      { id: 'notice_period', label: 'Serving Notice' },
                      { id: 'notice_over', label: 'Notice Ended (5d Grace)' },
                      { id: 'deactivated', label: 'Deactivated' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setHrResignFilter(f.id)}
                        className={hrResignFilter === f.id ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={exportResignationsExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> Export Resignations to Excel
                  </button>
                </div>

                {/* Resignation Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const filtered = hrResignations.filter(r => {
                      if (hrResignFilter === 'pending') return r.status === 'pending';
                      if (hrResignFilter === 'notice_period') return (r.status === 'notice_period' || r.status === 'approved') && (!r.notice_end_date || r.notice_end_date >= todayStr);
                      if (hrResignFilter === 'notice_over') return (r.status === 'notice_period' || r.status === 'approved') && r.notice_end_date && r.notice_end_date < todayStr;
                      if (hrResignFilter === 'deactivated') return r.status === 'deactivated';
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                          <p style={{ ...noDataStyle, fontSize: '0.95rem' }}>No resignation records found in this category.</p>
                        </div>
                      );
                    }

                    return filtered.map((r, i) => {
                      const empName = r.profiles?.full_name || 'Employee';
                      const empEmail = r.profiles?.email || '—';
                      const empPos = r.profiles?.position || 'Employee';
                      const isPending = r.status === 'pending';
                      const isServingNotice = (r.status === 'notice_period' || r.status === 'approved') && (!r.notice_end_date || r.notice_end_date >= todayStr);
                      const isNoticeOver = (r.status === 'notice_period' || r.status === 'approved') && r.notice_end_date && r.notice_end_date < todayStr;
                      const isDeactivated = r.status === 'deactivated';

                      // Calculations for notice period
                      let daysRemaining = 0;
                      let daysElapsed = 0;
                      let progressPercent = 0;
                      let autoDeactivateDaysLeft = 5;

                      if (r.notice_start_date && r.notice_end_date) {
                        const startD = new Date(r.notice_start_date);
                        const endD = new Date(r.notice_end_date);
                        const todayD = new Date(todayStr);
                        const totalDays = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)));

                        if (todayD <= endD) {
                          daysRemaining = Math.max(0, Math.round((endD - todayD) / (1000 * 60 * 60 * 24)));
                          daysElapsed = totalDays - daysRemaining;
                          progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
                        } else {
                          // Notice ended, calculate 5-day grace window
                          const daysSinceEnd = Math.round((todayD - endD) / (1000 * 60 * 60 * 24));
                          autoDeactivateDaysLeft = Math.max(0, 5 - daysSinceEnd);
                        }
                      }

                      const currentAction = hrResignActions[r.id] || {
                        notice_period_days: 30,
                        notice_start_date: todayStr,
                        hr_note: '',
                      };

                      return (
                        <div
                          key={r.id || i}
                          className="glass-card"
                          style={{
                            border: `1px solid ${isPending ? 'rgba(200,146,42,0.3)' : isServingNotice ? 'rgba(59,130,246,0.3)' : isNoticeOver ? 'rgba(245,158,11,0.4)' : isDeactivated ? 'rgba(100,116,139,0.2)' : 'var(--border-color)'}`,
                            backgroundColor: isNoticeOver ? 'rgba(245,158,11,0.03)' : 'var(--bg-card)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            {/* Employee Info Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div className="avatar-circle" style={{ width: '42px', height: '42px', fontSize: '1rem', flexShrink: 0, backgroundColor: isDeactivated ? '#64748b' : '#c8922a' }}>
                                {empName.charAt(0)}
                              </div>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{empName}</h3>
                                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                  {empPos} • {empEmail}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isPending && <span className="badge badge-pending">⏳ Awaiting HR Review</span>}
                              {isServingNotice && <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>📋 Serving Notice ({daysRemaining} days left)</span>}
                              {isNoticeOver && <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}>⚠️ Notice Over (Auto-deactivation in {autoDeactivateDaysLeft}d)</span>}
                              {isDeactivated && <span className="badge" style={{ backgroundColor: 'rgba(100,116,139,0.15)', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)' }}>🔒 Account Deactivated</span>}
                              {r.status === 'rejected' && <span className="badge badge-danger">✗ Rejected</span>}
                            </div>
                          </div>

                          {/* Submission Details */}
                          <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div>
                                <p style={detailLabelStyle}>Reason for Resignation</p>
                                <p style={{ ...detailValueStyle, fontWeight: 600 }}>{r.reason || '—'}</p>
                              </div>
                              <div>
                                <p style={detailLabelStyle}>Requested Last Day</p>
                                <p style={detailValueStyle}>{r.requested_last_day || '—'}</p>
                              </div>
                              <div>
                                <p style={detailLabelStyle}>Applied On</p>
                                <p style={detailValueStyle}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</p>
                              </div>
                              {r.notice_period_days && (
                                <div>
                                  <p style={detailLabelStyle}>Approved Notice Period</p>
                                  <p style={{ ...detailValueStyle, color: 'var(--color-orange)', fontWeight: 700 }}>{r.notice_period_days} Days</p>
                                </div>
                              )}
                            </div>
                            {r.notes && (
                              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                                <p style={detailLabelStyle}>Employee Notes</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>{r.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Notice Period Timeline Bar */}
                          {(isServingNotice || isNoticeOver) && r.notice_start_date && r.notice_end_date && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(59,130,246,0.04)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <CalendarDays size={16} color="#3b82f6" />
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Notice Timeline: {r.notice_start_date} → {r.notice_end_date}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isNoticeOver ? '#d97706' : '#3b82f6' }}>
                                  {isNoticeOver ? 'Notice Completed ✓' : `${daysRemaining} days remaining`}
                                </span>
                              </div>

                              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: isNoticeOver ? '#10b981' : '#3b82f6', transition: 'width 0.3s ease' }} />
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                  💰 Normal salary calculation continues during notice period based on daily attendance.
                                </p>
                                <button
                                  onClick={() => {
                                    setHrActiveTab('salary');
                                    setHrSalaryEmployee(r.employee_id);
                                    computeSalary(r.employee_id, salaryMonth);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                >
                                  View Notice Salary ➔
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Notice Over 5-Day Auto-Deactivation Warning Banner */}
                          {isNoticeOver && (
                            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <AlertCircle size={18} color="#d97706" />
                                <div>
                                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                                    Notice Period Ended on {r.notice_end_date}
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b45309' }}>
                                    Account will automatically deactivate in <strong>{autoDeactivateDaysLeft} day(s)</strong>, or you can deactivate it now.
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeactivateResignedEmployee(r.id, r.employee_id)}
                                className="btn btn-danger"
                                style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
                              >
                                🔒 Deactivate Account Now
                              </button>
                            </div>
                          )}

                          {/* HR Note */}
                          {r.hr_note && (
                            <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                              <strong>HR Note:</strong> {r.hr_note}
                            </div>
                          )}

                          {/* Action Forms */}
                          {isPending && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(200,146,42,0.03)', padding: '1rem', borderRadius: '8px' }}>
                              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-orange)' }}>
                                Assign Notice Period & Decision
                              </h4>

                              {/* Quick notice period preset buttons */}
                              <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Notice Period Duration (Days)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                  {[15, 30, 45, 60, 90].map(days => (
                                    <button
                                      key={days}
                                      type="button"
                                      onClick={() => {
                                        setHrResignActions(prev => ({
                                          ...prev,
                                          [r.id]: { ...(prev[r.id] || currentAction), notice_period_days: days }
                                        }));
                                      }}
                                      className={currentAction.notice_period_days === days ? 'btn btn-primary' : 'btn btn-secondary'}
                                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                                    >
                                      {days} Days
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                  <div>
                                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Custom Notice Days</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="180"
                                      className="form-input"
                                      value={currentAction.notice_period_days}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setHrResignActions(prev => ({
                                          ...prev,
                                          [r.id]: { ...(prev[r.id] || currentAction), notice_period_days: val }
                                        }));
                                      }}
                                      style={{ fontSize: '0.85rem' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Notice Start Date</label>
                                    <input
                                      type="date"
                                      className="form-input"
                                      value={currentAction.notice_start_date}
                                      onChange={(e) => {
                                        setHrResignActions(prev => ({
                                          ...prev,
                                          [r.id]: { ...(prev[r.id] || currentAction), notice_start_date: e.target.value }
                                        }));
                                      }}
                                      style={{ fontSize: '0.85rem' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Calculated End Date Preview */}
                              {(() => {
                                const sDate = new Date(currentAction.notice_start_date || todayStr);
                                const eDate = new Date(sDate);
                                eDate.setDate(eDate.getDate() + (parseInt(currentAction.notice_period_days) || 30));
                                return (
                                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: '6px', fontSize: '0.78rem', color: '#1e40af' }}>
                                    📅 <strong>Calculated Last Working Day:</strong> {eDate.toISOString().split('T')[0]} (Account will auto-deactivate 5 days later)
                                  </div>
                                );
                              })()}

                              <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>HR Note / Instructions (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Please handover client credentials to team lead"
                                  className="form-input"
                                  value={currentAction.hr_note || ''}
                                  onChange={(e) => {
                                    setHrResignActions(prev => ({
                                      ...prev,
                                      [r.id]: { ...(prev[r.id] || currentAction), hr_note: e.target.value }
                                    }));
                                  }}
                                  style={{ fontSize: '0.85rem' }}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleRejectResignation(r.id, r.employee_id, currentAction.hr_note)}
                                  className="btn btn-danger"
                                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                                >
                                  ✗ Reject Request
                                </button>
                                <button
                                  onClick={() => handleApproveResignation(r.id, r.employee_id, currentAction.notice_period_days, currentAction.notice_start_date, currentAction.hr_note)}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.8rem', padding: '0.45rem 1.25rem' }}
                                >
                                  ✓ Approve & Start Notice Period
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Active / Notice Over Manual Deactivate Button */}
                          {(isServingNotice || isNoticeOver) && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                              <button
                                onClick={() => handleDeactivateResignedEmployee(r.id, r.employee_id)}
                                className="btn btn-danger"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                              >
                                🔒 Early Deactivate Account
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: HR EMPLOYEE DETAIL INSPECTOR */}
      {currentView === 'hr-employee-detail' && selectedEmp && (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <button onClick={() => setCurrentView('hr-dashboard')} className="btn btn-secondary">← Back to Panel</button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => exportSingleEmployeeSheet(selectedEmp, selectedEmpDetails, selectedEmpVerification, selectedEmpDocs)} className="btn btn-secondary"><FileText size={16} /> Download as Excel</button>
              {selectedEmp.status === 'digilocker_verified' && (
                <button onClick={() => handleApproveOnboarding(selectedEmp.id)} className="btn btn-primary">Approve Onboarding ✓</button>
              )}
              {!isEditingEmp ? (
                <button onClick={startEditingEmployee} className="btn btn-secondary">Edit Details ✎</button>
              ) : (
                <>
                  <button onClick={() => setIsEditingEmp(false)} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleSaveEmployeeEdits} className="btn btn-primary">Save Changes ✓</button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="avatar-circle" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem' }}>{selectedEmp.full_name?.charAt(0)}</div>
                <h2 style={{ fontSize: '1.2rem' }}>{selectedEmp.full_name}</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{selectedEmp.email}</p>
                <div style={{ marginTop: '1rem' }}>{getStatusBadge(selectedEmp.status)}</div>
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={detailLabelStyle}>Position</p>
                  {isEditingEmp ? (
                    <input type="text" value={editEmpForm.position} onChange={(e) => setEditEmpForm({ ...editEmpForm, position: e.target.value })} className="form-input" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }} />
                  ) : (<p style={detailValueStyle}>{selectedEmp.position || 'Unassigned'}</p>)}
                </div>
                <div>
                  <p style={detailLabelStyle}>Employee ID</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>{selectedEmp.id}</p>
                </div>
                {(selectedEmp.short_code || selectedEmp.invite_token) && (
                  <div>
                    <p style={detailLabelStyle}>Short Code</p>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                      {selectedEmp.short_code || selectedEmp.invite_token}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card">
                <h3 style={cardTitleStyle}>Personal Information</h3>
                {isEditingEmp ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Phone</label><input type="tel" value={editEmpForm.phone_number} onChange={(e) => setEditEmpForm({ ...editEmpForm, phone_number: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Date of Birth</label><input type="date" value={editEmpForm.dob} onChange={(e) => setEditEmpForm({ ...editEmpForm, dob: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Gender</label>
                      <select value={editEmpForm.gender} onChange={(e) => setEditEmpForm({ ...editEmpForm, gender: e.target.value })} className="form-select"><option>Male</option><option>Female</option><option>Other</option></select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Marital Status</label>
                      <select value={editEmpForm.marital_status} onChange={(e) => setEditEmpForm({ ...editEmpForm, marital_status: e.target.value })} className="form-select"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Father's Name</label><input type="text" value={editEmpForm.father_name} onChange={(e) => setEditEmpForm({ ...editEmpForm, father_name: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Mother's Name</label><input type="text" value={editEmpForm.mother_name} onChange={(e) => setEditEmpForm({ ...editEmpForm, mother_name: e.target.value })} className="form-input" /></div>
                    {editEmpForm.marital_status === 'Married' && (
                      <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Spouse Name</label><input type="text" value={editEmpForm.spouse_name} onChange={(e) => setEditEmpForm({ ...editEmpForm, spouse_name: e.target.value })} className="form-input" /></div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Emergency Contact 1</label><input type="tel" value={editEmpForm.emergency_contact1} onChange={(e) => setEditEmpForm({ ...editEmpForm, emergency_contact1: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Emergency Contact 2</label><input type="tel" value={editEmpForm.emergency_contact2} onChange={(e) => setEditEmpForm({ ...editEmpForm, emergency_contact2: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Permanent Address</label><input type="text" value={editEmpForm.permanent_address} onChange={(e) => setEditEmpForm({ ...editEmpForm, permanent_address: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}><label className="form-label">Current Address</label><input type="text" value={editEmpForm.current_address} onChange={(e) => setEditEmpForm({ ...editEmpForm, current_address: e.target.value })} className="form-input" /></div>
                  </div>
                ) : selectedEmpDetails ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><p style={detailLabelStyle}>Phone</p><p style={detailValueStyle}>{selectedEmpDetails.phone_number || '—'}</p></div>
                    <div><p style={detailLabelStyle}>Date of Birth</p><p style={detailValueStyle}>{selectedEmpDetails.dob || '—'}</p></div>
                    <div><p style={detailLabelStyle}>Gender</p><p style={detailValueStyle}>{selectedEmpDetails.gender || '—'}</p></div>
                    <div><p style={detailLabelStyle}>Permanent Address</p><p style={detailValueStyle}>{selectedEmpDetails.permanent_address || '—'}</p></div>
                    <div style={{ gridColumn: '1 / -1' }}><p style={detailLabelStyle}>Current Address</p><p style={detailValueStyle}>{selectedEmpDetails.current_address || '—'}</p></div>
                  </div>
                ) : <p style={noDataStyle}>No personal details submitted yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Location Verification</h3>
                {selectedEmpDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <p style={{ ...detailLabelStyle, minWidth: '140px', margin: 0 }}>GPS Status</p>
                      {selectedEmpDetails.location_verified ? <span className="badge badge-success">✓ GPS Verified</span> : <span className="badge badge-pending">Skipped / Unverified</span>}
                    </div>
                    {selectedEmpDetails.location_distance_m != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <p style={{ ...detailLabelStyle, minWidth: '140px', margin: 0 }}>Distance from Address</p>
                        <p style={detailValueStyle}>{selectedEmpDetails.location_distance_m}m</p>
                      </div>
                    )}
                    {selectedEmpDetails.current_address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEmpDetails.current_address)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} /> View on Google Maps
                      </a>
                    )}
                  </div>
                ) : <p style={noDataStyle}>No location data submitted yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Banking Details</h3>
                {selectedEmpDetails ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><p style={detailLabelStyle}>Bank Name</p><p style={detailValueStyle}>{selectedEmpDetails.bank_name || '—'}</p></div>
                    <div><p style={detailLabelStyle}>Account Number</p><p style={detailValueStyle}>{selectedEmpDetails.account_number || '—'}</p></div>
                    <div><p style={detailLabelStyle}>IFSC Code</p><p style={detailValueStyle}>{selectedEmpDetails.ifsc_code || '—'}</p></div>
                  </div>
                ) : <p style={noDataStyle}>No banking details submitted yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Education History</h3>
                {selectedEmpDetails?.education_history?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedEmpDetails.education_history.map((edu, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{edu.degree}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{edu.institution} · {edu.year} · {edu.grade}</p>
                      </div>
                    ))}
                  </div>
                ) : <p style={noDataStyle}>No education records submitted yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Employment History</h3>
                {selectedEmpDetails?.employment_history?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedEmpDetails.employment_history.map((job, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{job.role} @ {job.company}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{job.startDate} → {job.endDate}</p>
                      </div>
                    ))}
                  </div>
                ) : <p style={noDataStyle}>No employment records submitted yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>DigiLocker Verification</h3>
                {isEditingEmp ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Aadhaar (Masked)</label><input type="text" placeholder="XXXX-XXXX-1234" value={editEmpForm.aadhaar_masked} onChange={(e) => setEditEmpForm({ ...editEmpForm, aadhaar_masked: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">PAN</label><input type="text" value={editEmpForm.pan_number} onChange={(e) => setEditEmpForm({ ...editEmpForm, pan_number: e.target.value.toUpperCase() })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Name on Aadhaar</label><input type="text" value={editEmpForm.name_on_aadhaar} onChange={(e) => setEditEmpForm({ ...editEmpForm, name_on_aadhaar: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">DOB on Aadhaar</label><input type="date" value={editEmpForm.dob_on_aadhaar} onChange={(e) => setEditEmpForm({ ...editEmpForm, dob_on_aadhaar: e.target.value })} className="form-input" /></div>
                  </div>
                ) : selectedEmpVerification ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><p style={detailLabelStyle}>Aadhaar</p><p style={detailValueStyle}>{selectedEmpVerification.aadhaar_masked}</p></div>
                    <div><p style={detailLabelStyle}>PAN</p><p style={detailValueStyle}>{selectedEmpVerification.pan_number || '—'}</p></div>
                    <div><p style={detailLabelStyle}>Name on Aadhaar</p><p style={detailValueStyle}>{selectedEmpVerification.name_on_aadhaar}</p></div>
                    <div><p style={detailLabelStyle}>DOB on Aadhaar</p><p style={detailValueStyle}>{selectedEmpVerification.dob_on_aadhaar}</p></div>
                  </div>
                ) : <p style={noDataStyle}>No DigiLocker verification completed yet.</p>}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Live Selfie Verification</h3>
                {(() => {
                  const selfie = selectedEmpDocs.find(d => d.document_type === 'selfie');
                  return selfie ? (
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <img src={selfie.file_url} alt="Employee Selfie" style={{ width: '160px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(200,146,42,0.3)', transform: 'scaleX(-1)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                        <p style={detailLabelStyle}>Captured During Onboarding</p>
                        <p style={{ ...detailValueStyle, fontSize: '0.8rem' }}>{new Date(selfie.uploaded_at).toLocaleString()}</p>
                        <p style={detailLabelStyle}>Cross-check with DigiLocker</p>
                        <p style={detailValueStyle}>{selectedEmpVerification?.name_on_aadhaar || '—'}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handlePhotoVerdict(selectedEmp.id, 'photo_approved')} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>✓ Approve Photo</button>
                          <button onClick={() => handlePhotoVerdict(selectedEmp.id, 'photo_rejected')} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>✗ Reject Photo</button>
                        </div>
                        {selectedEmp.photo_status && (
                          <span className={`badge ${selectedEmp.photo_status === 'photo_approved' ? 'badge-success' : 'badge-danger'}`}>{selectedEmp.photo_status === 'photo_approved' ? '✓ Photo Approved' : '✗ Photo Rejected'}</span>
                        )}
                      </div>
                    </div>
                  ) : <p style={noDataStyle}>No selfie submitted yet.</p>;
                })()}
              </div>

              <div className="glass-card">
                <h3 style={cardTitleStyle}>Uploaded Documents</h3>
                {selectedEmpDocs.filter(d => d.document_type !== 'selfie').length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedEmpDocs.filter(d => d.document_type !== 'selfie').map(doc => (
                      <div key={doc.id} className="flex-between" style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} color="var(--color-orange)" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{doc.document_type?.toUpperCase()}: {doc.file_name}</span>
                        </div>
                        <a href={doc.file_url} download={doc.file_name} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Download</a>
                      </div>
                    ))}
                  </div>
                ) : <p style={noDataStyle}>No documents uploaded yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: EMPLOYEE REGISTRATION */}
      {currentView === 'employee-register' && activeEmployee && (
        <div style={loginWrapperStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Create Account</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Welcome, <strong style={{ color: 'var(--color-text-primary)' }}>{activeEmployee.full_name}</strong>. Set a password to get started.</p><br></br>
            </div>
            <form onSubmit={handleEmployeeRegister}>
              <div className="form-group">
                <label className="form-label">Temporary Password (shared by HR)</label>
                <input type="password" value={regTempPassword} onChange={(e) => setRegTempPassword(e.target.value)} className="form-input" required placeholder="Enter the password HR shared" />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Create Your Own Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="form-input" required placeholder="••••••••" />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Confirm Your Password</label>
                <input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="form-input" required placeholder="••••••••" />
              </div>
              {regError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{regError}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Set Password & Continue</button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 6: EMPLOYEE ONBOARDING WIZARD */}
      {currentView === 'employee-wizard' && activeEmployee && (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2>Employee Onboarding</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Step {wizardStep} of 7</p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(s => (<span key={s} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: wizardStep >= s ? 'var(--color-orange)' : '#d8dee6' }} />))}
              </div>
            </div>

            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 style={{ color: 'var(--color-orange)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Basic Information</h4>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone Number</label><input type="tel" value={wizardPersonal.phone} onChange={(e) => setWizardPersonal({ ...wizardPersonal, phone: e.target.value })} className="form-input" placeholder="+91 XXXXX XXXXX" /></div>
                  <div className="form-group"><label className="form-label">Personal Email</label><input type="email" value={wizardPersonal.personalEmail} onChange={(e) => setWizardPersonal({ ...wizardPersonal, personalEmail: e.target.value })} className="form-input" placeholder="personal@email.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" value={wizardPersonal.dob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, dob: e.target.value })} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Date of Joining</label><input type="date" value={wizardPersonal.dateOfJoining} onChange={(e) => setWizardPersonal({ ...wizardPersonal, dateOfJoining: e.target.value })} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Gender</label><select value={wizardPersonal.gender} onChange={(e) => setWizardPersonal({ ...wizardPersonal, gender: e.target.value })} className="form-select"><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">Permanent Address</label><input type="text" value={wizardPersonal.permanentAddress} onChange={(e) => setWizardPersonal({ ...wizardPersonal, permanentAddress: e.target.value })} className="form-input" placeholder="Your permanent address" /></div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Current Address</label>
                  <input type="text" value={wizardPersonal.currentAddress} onChange={(e) => handleAddressInputChange(e.target.value)} onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="form-input" placeholder="Start typing your address..." autoComplete="off" />
                  {addressCoords && <p style={{ fontSize: '0.72rem', color: 'var(--color-success)', marginTop: '0.3rem' }}>✓ Address confirmed and located on map</p>}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#ffffff', border: '1px solid rgba(200,146,42,0.3)', borderRadius: '8px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(16,24,40,0.15)' }}>
                      {addressSuggestions.map((s, i) => (
                        <div key={i} onClick={() => selectAddressSuggestion(s)} style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer', borderBottom: i < addressSuggestions.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(200,146,42,0.08)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <MapPin size={12} style={{ marginRight: '6px', display: 'inline', color: 'var(--color-orange)' }} />{s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <h4 style={{ color: 'var(--color-orange)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '0.5rem' }}>Family Information</h4>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Father's Name</label><input type="text" value={wizardPersonal.fatherName} onChange={(e) => setWizardPersonal({ ...wizardPersonal, fatherName: e.target.value })} className="form-input" placeholder="Father's full name" /></div>
                  <div className="form-group"><label className="form-label">Father's Date of Birth</label><input type="date" value={wizardPersonal.fatherDob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, fatherDob: e.target.value })} className="form-input" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Mother's Name</label><input type="text" value={wizardPersonal.motherName} onChange={(e) => setWizardPersonal({ ...wizardPersonal, motherName: e.target.value })} className="form-input" placeholder="Mother's full name" /></div>
                  <div className="form-group"><label className="form-label">Mother's Date of Birth</label><input type="date" value={wizardPersonal.motherDob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, motherDob: e.target.value })} className="form-input" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Marital Status</label><select value={wizardPersonal.maritalStatus} onChange={(e) => setWizardPersonal({ ...wizardPersonal, maritalStatus: e.target.value })} className="form-select"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                  {wizardPersonal.maritalStatus === 'Married' && (
                    <>
                      <div className="form-group"><label className="form-label">Spouse Name</label><input type="text" value={wizardPersonal.spouseName} onChange={(e) => setWizardPersonal({ ...wizardPersonal, spouseName: e.target.value })} className="form-input" placeholder="Spouse's full name" /></div>
                      <div className="form-group"><label className="form-label">Spouse Date of Birth</label><input type="date" value={wizardPersonal.spouseDob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, spouseDob: e.target.value })} className="form-input" /></div>
                    </>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Number of Kids</label><select value={wizardPersonal.numberOfKids} onChange={(e) => setWizardPersonal({ ...wizardPersonal, numberOfKids: e.target.value })} className="form-select"><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3+">3+</option></select></div>
                </div>
                {parseInt(wizardPersonal.numberOfKids) >= 1 && (
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Child 1 Name</label><input type="text" value={wizardPersonal.child1Name} onChange={(e) => setWizardPersonal({ ...wizardPersonal, child1Name: e.target.value })} className="form-input" placeholder="Child 1 full name" /></div>
                    <div className="form-group"><label className="form-label">Child 1 Date of Birth</label><input type="date" value={wizardPersonal.child1Dob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, child1Dob: e.target.value })} className="form-input" /></div>
                  </div>
                )}
                {parseInt(wizardPersonal.numberOfKids) >= 2 && (
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Child 2 Name</label><input type="text" value={wizardPersonal.child2Name} onChange={(e) => setWizardPersonal({ ...wizardPersonal, child2Name: e.target.value })} className="form-input" placeholder="Child 2 full name" /></div>
                    <div className="form-group"><label className="form-label">Child 2 Date of Birth</label><input type="date" value={wizardPersonal.child2Dob} onChange={(e) => setWizardPersonal({ ...wizardPersonal, child2Dob: e.target.value })} className="form-input" /></div>
                  </div>
                )}

                <h4 style={{ color: 'var(--color-orange)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '0.5rem' }}>Emergency Contacts</h4>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Emergency Contact 1</label><input type="tel" value={wizardPersonal.emergencyContact1} onChange={(e) => setWizardPersonal({ ...wizardPersonal, emergencyContact1: e.target.value })} className="form-input" placeholder="+91 XXXXX XXXXX" /></div>
                  <div className="form-group"><label className="form-label">Emergency Contact 2</label><input type="tel" value={wizardPersonal.emergencyContact2} onChange={(e) => setWizardPersonal({ ...wizardPersonal, emergencyContact2: e.target.value })} className="form-input" placeholder="+91 XXXXX XXXXX" /></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button onClick={async () => { await saveProgressToSupabase(1); setWizardStep(2); }} className="btn btn-primary">Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Education History</h3>
                {educationHistory.map((edu, index) => (
                  <div key={index} className="form-row" style={{ marginBottom: '0.75rem' }}>
                    <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => { const u = [...educationHistory]; u[index].degree = e.target.value; setEducationHistory(u); }} className="form-input" />
                    <input type="text" placeholder="Institution" value={edu.institution} onChange={(e) => { const u = [...educationHistory]; u[index].institution = e.target.value; setEducationHistory(u); }} className="form-input" />
                    <input type="text" placeholder="Year" value={edu.year} onChange={(e) => { const u = [...educationHistory]; u[index].year = e.target.value; setEducationHistory(u); }} className="form-input" style={{ maxWidth: '100px' }} />
                    <button onClick={() => removeEducationRow(index)} className="btn btn-danger" style={{ padding: '8px' }}><X size={16} /></button>
                  </div>
                ))}
                <button onClick={addEducationRow} className="btn btn-secondary" style={{ fontSize: '0.8rem', marginBottom: '2rem' }}>+ Add Education</button>

                <h3 style={{ marginBottom: '1rem' }}>Employment History</h3>
                {employmentHistory.map((job, index) => (
                  <div key={index} className="form-row" style={{ marginBottom: '0.75rem' }}>
                    <input type="text" placeholder="Company" value={job.company} onChange={(e) => { const u = [...employmentHistory]; u[index].company = e.target.value; setEmploymentHistory(u); }} className="form-input" />
                    <input type="text" placeholder="Role" value={job.role} onChange={(e) => { const u = [...employmentHistory]; u[index].role = e.target.value; setEmploymentHistory(u); }} className="form-input" />
                    <input type="date" placeholder="Start Date" value={job.startDate || ''} onChange={(e) => { const u = [...employmentHistory]; u[index].startDate = e.target.value; setEmploymentHistory(u); }} className="form-input" />
                    <input type="date" placeholder="End Date" value={job.endDate || ''} onChange={(e) => { const u = [...employmentHistory]; u[index].endDate = e.target.value; setEmploymentHistory(u); }} className="form-input" />
                    <button onClick={() => removeEmploymentRow(index)} className="btn btn-danger" style={{ padding: '8px' }}><X size={16} /></button>
                  </div>
                ))}
                <button onClick={addEmploymentRow} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>+ Add Employment</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setWizardStep(1)} className="btn btn-secondary">← Back</button>
                  <button onClick={async () => { await saveProgressToSupabase(2); setWizardStep(3); }} className="btn btn-primary">Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Address & Location Verification</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>We'll show your entered address on the map, then cross-check it with your device GPS.</p>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,0,0,0.025)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Address Being Verified</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{wizardPersonal.currentAddress || '—'}</p>
                  {addressCoords && <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>📍 {addressCoords.lat.toFixed(4)}, {addressCoords.lng.toFixed(4)}</p>}
                </div>
                <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  {wizardPersonal.currentAddress ? (
                    <iframe title="Map" width="100%" height="100%" style={{ border: 0, display: 'block' }} src={addressCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${addressCoords.lng - 0.01},${addressCoords.lat - 0.01},${addressCoords.lng + 0.01},${addressCoords.lat + 0.01}&layer=mapnik&marker=${addressCoords.lat},${addressCoords.lng}` : `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${encodeURIComponent(wizardPersonal.currentAddress)}`} allowFullScreen />
                  ) : (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No address entered</div>)}
                </div>
                {locationVerifyStatus === 'idle' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {!addressCoords && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-pending-bg)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-pending)', maxWidth: '380px' }}>⚠️ Please go back to Step 1 and select your address from the suggestions dropdown for accurate map placement.</div>}
                    <button onClick={handleVerifyLocation} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}><MapPin size={18} /> Verify My Location via GPS</button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>⚠️ GPS requires HTTPS. On localhost, use Skip below.</p>
                    <button onClick={() => { setLocationVerifyStatus('skipped'); setLocationVerified(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-pending)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Skip — Testing on localhost / Remote Worker</button>
                  </div>
                )}
                {locationVerifyStatus === 'checking' && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--color-orange)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Fetching GPS and geocoding address…</p></div>)}
                {locationVerifyStatus === 'success' && (<div style={{ padding: '1.25rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', maxWidth: '380px', margin: '0 auto' }}><CheckCircle2 size={32} color="var(--color-success)" style={{ marginBottom: '0.5rem' }} /><h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>Location Verified ✓</h4><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>Your GPS is <strong style={{ color: 'var(--color-text-primary)' }}>{locationDistance}m</strong> from entered address.</p></div>)}
                {locationVerifyStatus === 'failed' && (
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', maxWidth: '380px', margin: '0 auto' }}>
                    <ShieldAlert size={32} color="var(--color-danger)" style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>Verification Failed</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>{locationDistance ? `GPS is ${locationDistance}m away (limit: 15km).` : 'Could not access GPS. Allow location permission and retry.'}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button onClick={() => { setLocationVerifyStatus('idle'); setLocationDistance(null); }} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Retry</button>
                      <button onClick={() => { setLocationVerifyStatus('skipped'); setLocationVerified(true); }} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', color: 'var(--color-pending)' }}>Skip (Remote Worker)</button>
                    </div>
                  </div>
                )}
                {locationVerifyStatus === 'skipped' && (<div style={{ padding: '1.25rem', backgroundColor: 'var(--color-pending-bg)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', maxWidth: '380px', margin: '0 auto' }}><Clock size={32} color="var(--color-pending)" style={{ marginBottom: '0.5rem' }} /><h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>Skipped — Remote Worker</h4><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>HR will manually verify your address.</p></div>)}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setWizardStep(2)} className="btn btn-secondary">← Back</button>
                  <button onClick={async () => { if (!locationVerified) { alert('Please verify or skip your location.'); return; } await saveProgressToSupabase(3); setWizardStep(4); }} className={locationVerified ? 'btn btn-primary' : 'btn btn-disabled'} disabled={!locationVerified}>Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <CheckCircle2 size={48} color={digiLockerDetails ? 'var(--color-success)' : 'var(--color-orange)'} style={{ marginBottom: '1rem' }} />
                <h3>Government Identity Verification</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>Verify your Aadhaar & PAN via DigiLocker.</p>
                {digiLockerDetails ? (
                  <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.025)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-success)' }}>
                    <p style={{ margin: 0, color: 'var(--color-success)', fontWeight: 600 }}>✓ Verification Successful</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}><strong>Name:</strong> {digiLockerDetails.nameOnAadhaar}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}><strong>Aadhaar:</strong> {digiLockerDetails.aadhaarMasked}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => {
                      sessionStorage.setItem('digilocker_employee_id', activeEmployee.id);
                      const params = new URLSearchParams({ response_type: 'code', client_id: import.meta.env.VITE_DIGILOCKER_CLIENT_ID, redirect_uri: import.meta.env.VITE_DIGILOCKER_REDIRECT_URI, state: Math.random().toString(36).substring(2), scope: 'openid profile' });
                      window.location.href = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?${params}`;
                    }} className="btn btn-primary">Verify with DigiLocker</button>
                    <button onClick={() => { setDigiLockerDetails({ aadhaarMasked: 'XXXX-XXXX-1234', panNumber: 'ABCDE1234F', nameOnAadhaar: activeEmployee.full_name, dobOnAadhaar: wizardPersonal.dob || '', genderOnAadhaar: wizardPersonal.gender || '', verifiedAt: new Date().toISOString(), skipped: true }); }} style={{ background: 'none', border: 'none', color: 'var(--color-pending)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Skip — DigiLocker verification pending activation</button>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setWizardStep(3)} className="btn btn-secondary">← Back</button>
                  <button onClick={async () => { await saveProgressToSupabase(4); setWizardStep(5); }} className={digiLockerDetails ? 'btn btn-primary' : 'btn btn-disabled'} disabled={!digiLockerDetails}>Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Live Photo Verification</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>Take a live selfie to verify your identity. This will be reviewed by HR to prevent proxy registrations.</p>
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 1.5rem', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(200,146,42,0.3)', backgroundColor: '#0a1628', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {isCameraOpen && <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}
                  {selfieImage && !isCameraOpen && <img src={selfieImage} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}
                  {!isCameraOpen && !selfieImage && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)' }}><div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed rgba(200,146,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={28} color="rgba(200,146,42,0.5)" /></div><p style={{ fontSize: '0.85rem', margin: 0 }}>Camera preview will appear here</p></div>)}
                  {isCameraOpen && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><div style={{ width: '180px', height: '220px', border: '2px solid rgba(200,146,42,0.6)', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} /></div>)}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {!isCameraOpen && !selfieImage && <button onClick={startCamera} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Open Camera</button>}
                  {isCameraOpen && (<div style={{ display: 'flex', gap: '1rem' }}><button onClick={stopCamera} className="btn btn-secondary">Cancel</button><button onClick={captureSelfie} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>📸 Take Photo</button></div>)}
                  {selfieImage && !isCameraOpen && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--color-success-bg)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}><CheckCircle2 size={16} color="var(--color-success)" /><span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>Selfie captured successfully</span></div><button onClick={() => { setSelfieImage(null); startCamera(); }} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Retake Photo</button></div>)}
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '320px' }}>⚠️ Camera requires HTTPS on deployed site. On localhost this may not work — you can skip for testing.</p>
                  {!selfieImage && <button onClick={() => setWizardStep(6)} style={{ background: 'none', border: 'none', color: 'var(--color-pending)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Skip — Testing on localhost</button>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setWizardStep(4)} className="btn btn-secondary">← Back</button>
                  <button onClick={() => { stopCamera(); setWizardStep(6); }} className={selfieImage ? 'btn btn-primary' : 'btn btn-disabled'} disabled={!selfieImage}>Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3>Upload Documents</h3>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--color-orange)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Banking Details</label>
                  <div className="form-row">
                    <input type="text" placeholder="Bank Name" value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} className="form-input" />
                    <input type="text" placeholder="Account Number" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} className="form-input" />
                    <input type="text" placeholder="IFSC Code" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })} className="form-input" />
                    <input type="text" placeholder="Branch Name" value={bankDetails.branchName} onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })} className="form-input" />
                    <input type="text" placeholder="UAN Number" value={bankDetails.uanNumber} onChange={(e) => setBankDetails({ ...bankDetails, uanNumber: e.target.value })} className="form-input" />
                    <input type="text" placeholder="PF Number" value={bankDetails.pfNumber} onChange={(e) => setBankDetails({ ...bankDetails, pfNumber: e.target.value })} className="form-input" />
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Degree Certificate (PDF/Image)</label><input type="file" onChange={(e) => handleFileUpload('degree', e)} className="form-input" />{docUploadState.degree && <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>✓ {docUploadState.degree}</p>}</div>
                <div className="form-group"><label className="form-label">Bank Proof (Passbook / Cancelled Cheque)</label><input type="file" onChange={(e) => handleFileUpload('bank_proof', e)} className="form-input" />{docUploadState.bank_proof && <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>✓ {docUploadState.bank_proof}</p>}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setWizardStep(5)} className="btn btn-secondary">← Back</button>
                  <button onClick={() => setWizardStep(7)} className="btn btn-primary">Next →</button>
                </div>
              </div>
            )}

            {wizardStep === 7 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Employee Self-Declaration Form</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>Please read carefully, initial each section, and submit.</p>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>1. Personal & Employment Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><span style={declLabelStyle}>Full Name</span><p style={declValueStyle}>{activeEmployee.full_name}</p></div>
                    <div><span style={declLabelStyle}>Position</span><p style={declValueStyle}>{activeEmployee.position || '—'}</p></div>
                    <div><span style={declLabelStyle}>Date of Joining</span><p style={declValueStyle}>{wizardPersonal.dateOfJoining || '—'}</p></div>
                    <div><span style={declLabelStyle}>Work Email</span><p style={declValueStyle}>{activeEmployee.email}</p></div>
                  </div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>2. Declaration of Authenticity</h4>
                  <p style={declTextStyle}>I hereby declare that all information, certificates, academic degrees, and employment history documents submitted by me during the recruitment and onboarding process are genuine, accurate, and true to the best of my knowledge.</p>
                  <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}><label className="form-label">Initial here to confirm</label><input type="text" maxLength={5} placeholder="e.g. A.K." value={declaration.authenticityInitial} onChange={(e) => setDeclaration({ ...declaration, authenticityInitial: e.target.value })} className="form-input" style={{ maxWidth: '120px' }} /></div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>3. Conflict of Interest Declaration</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}><input type="radio" name="conflict" value="none" checked={declaration.conflictType === 'none'} onChange={() => setDeclaration({ ...declaration, conflictType: 'none', conflictDetails: '' })} style={{ marginTop: '3px', accentColor: 'var(--color-orange)' }} /><span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}><strong>No Conflict:</strong> I declare that I do not have any direct or indirect business, financial, or personal interests that conflict with the interests of TOSBS, nor do I hold any secondary employment that impacts my role here.</span></label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}><input type="radio" name="conflict" value="potential" checked={declaration.conflictType === 'potential'} onChange={() => setDeclaration({ ...declaration, conflictType: 'potential' })} style={{ marginTop: '3px', accentColor: 'var(--color-orange)' }} /><span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}><strong>Potential Conflict:</strong> I have an interest or secondary engagement that might be perceived as a conflict of interest, detailed below.</span></label>
                    {declaration.conflictType === 'potential' && (<textarea placeholder="Describe the conflict of interest..." value={declaration.conflictDetails} onChange={(e) => setDeclaration({ ...declaration, conflictDetails: e.target.value })} className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} />)}
                  </div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>4. Confidentiality & NDA Acknowledgement</h4>
                  <p style={declTextStyle}>I acknowledge that during my employment, I will have access to confidential, proprietary, and trade secret information belonging to TOSBS. I declare that I will maintain strict confidentiality and will not disclose, misappropriate, or use this information outside of my official duties, both during and after my employment.</p>
                  <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}><label className="form-label">Initial here to confirm</label><input type="text" maxLength={5} placeholder="e.g. A.K." value={declaration.ndaInitial} onChange={(e) => setDeclaration({ ...declaration, ndaInitial: e.target.value })} className="form-input" style={{ maxWidth: '120px' }} /></div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>5. Code of Conduct & Company Policies</h4>
                  <p style={declTextStyle}>I declare that I have received, read, and understood the TOSBS Employee Handbook, IT Usage Policy, and Code of Conduct. I agree to abide by all company rules, regulations, and workplace ethics policies.</p>
                  <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}><label className="form-label">Initial here to confirm</label><input type="text" maxLength={5} placeholder="e.g. A.K." value={declaration.codeInitial} onChange={(e) => setDeclaration({ ...declaration, codeInitial: e.target.value })} className="form-input" style={{ maxWidth: '120px' }} /></div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>6. Medical & Fitness Declaration</h4>
                  <p style={declTextStyle}>I declare that I am physically and mentally fit to perform the essential duties of my assigned role. If you require any reasonable workplace accommodations due to a medical condition, please contact HR directly.</p>
                  <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}><label className="form-label">Initial here to confirm</label><input type="text" maxLength={5} placeholder="e.g. A.K." value={declaration.medicalInitial} onChange={(e) => setDeclaration({ ...declaration, medicalInitial: e.target.value })} className="form-input" style={{ maxWidth: '120px' }} /></div>
                </div>
                <div style={declSectionStyle}>
                  <h4 style={declTitleStyle}>7. Final Authorization & Sign-Off</h4>
                  <p style={declTextStyle}>I explicitly understand that if any declaration made in this form or any document provided by me is found to be false, misleading, or deliberately misrepresented, TOSBS reserves the right to take disciplinary action, up to and including immediate termination of employment without notice or compensation.</p>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Place</label><input type="text" placeholder="City where you are signing" value={declaration.place} onChange={(e) => setDeclaration({ ...declaration, place: e.target.value })} className="form-input" style={{ maxWidth: '220px' }} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Date</label><p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p></div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}><input type="checkbox" checked={declaration.agreed} onChange={(e) => setDeclaration({ ...declaration, agreed: e.target.checked })} style={{ marginTop: '3px', accentColor: 'var(--color-orange)', width: '16px', height: '16px' }} /><span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>I, <strong style={{ color: 'var(--color-text-primary)' }}>{activeEmployee.full_name}</strong>, hereby confirm that all declarations made above are true and accurate. I understand the consequences of providing false information.</span></label>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button onClick={() => setWizardStep(6)} className="btn btn-secondary">← Back</button>
                  <button onClick={() => {
                    if (!declaration.authenticityInitial || !declaration.ndaInitial || !declaration.codeInitial || !declaration.medicalInitial) { alert('Please initial all required sections before submitting.'); return; }
                    if (!declaration.place) { alert('Please enter the place of signing.'); return; }
                    if (!declaration.agreed) { alert('Please check the final authorization checkbox.'); return; }
                    if (declaration.conflictType === 'potential' && !declaration.conflictDetails) { alert('Please describe the conflict of interest details.'); return; }
                    handleWizardSubmit();
                  }} className="btn btn-primary">Submit Onboarding ✓</button>
                </div>
              </div>
            )}
          </div>
          <DigiLockerModal isOpen={isDigiModalOpen} onClose={() => setIsDigiModalOpen(false)} onVerifySuccess={handleDigiLockerSuccess} employeeName={activeEmployee.full_name} />
        </div>
      )}

      {/* VIEW 7: EMPLOYEE DASHBOARD */}
      {currentView === 'employee-status' && activeEmployee && (
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>
            
              <img src="/Capture.jpg" alt="TOSBS" style={{ height: '50px', filter: 'brightness(0) invert(1)' }} />
            </div>
            <nav style={sidebarNavStyle}>
              <button onClick={() => setAttendanceTab('overview')} style={attendanceTab === 'overview' ? sidebarLinkActiveStyle : sidebarLinkStyle}><LayoutDashboard size={18} /><span>Overview</span></button>
              <button onClick={() => { setAttendanceTab('attendance'); loadTodayAttendance(activeEmployee.id); loadAttendanceHistory(activeEmployee.id); }} style={attendanceTab === 'attendance' ? sidebarLinkActiveStyle : sidebarLinkStyle}><Clock size={18} /><span>Attendance</span></button>
                             <button onClick={() => { setAttendanceTab('leave'); loadEmployeeLeaves(activeEmployee.id); }} style={attendanceTab === 'leave' ? sidebarLinkActiveStyle : sidebarLinkStyle}><CalendarDays size={18} /><span>Leave</span></button>
              <button onClick={() => { setAttendanceTab('salary'); computeSalary(activeEmployee.id, salaryMonth); }} style={attendanceTab === 'salary' ? sidebarLinkActiveStyle : sidebarLinkStyle}><Award size={18} /><span>Salary</span></button>
            
              <button onClick={() => { setAttendanceTab('reimbursement'); loadReimbursements(activeEmployee.id); }} style={attendanceTab === 'reimbursement' ? sidebarLinkActiveStyle : sidebarLinkStyle}><CreditCard size={18} /><span>Reimbursement</span></button>
              <button onClick={() => { setAttendanceTab('resignation'); loadEmployeeResignation(activeEmployee.id); }} style={attendanceTab === 'resignation' ? sidebarLinkActiveStyle : sidebarLinkStyle}><UserMinus size={18} /><span>Resignation</span></button>
            </nav>
            <div style={sidebarUserStyle}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{activeEmployee.full_name?.charAt(0)}</div>
              <div style={{ flexGrow: 1, minWidth: 0, marginLeft: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeEmployee.full_name}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{activeEmployee.position || 'Employee'}</p>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); setActiveEmployee(null); setCurrentView('splash'); }} style={logoutButtonStyle} title="Sign Out"><LogOut size={16} /></button>
            </div>
          </div>

          <div className="main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Dashboard</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track your onboarding progress and submitted details</p>
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={(celebrations.length > 0 || notifications.length > 0 || wishesReceived.length > 0) ? 'notif-bell-active' : ''}
                  style={{ ...logoutButtonStyle, position: 'relative', color: 'var(--color-text-primary)', backgroundColor: 'var(--bg-tertiary)', padding: '0.6rem' }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {(celebrations.length > 0 || notifications.length > 0 || wishesReceived.length > 0) && (
                    <span className="notif-dot" style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', border: '2px solid var(--bg-secondary)' }} />
                  )}
                </button>
                {showNotifications && (
                  <div style={notifPanelStyle}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bell size={16} color="var(--color-orange)" /><h4 style={{ margin: 0, fontSize: '0.95rem' }}>Notifications</h4>
                    </div>
                    <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
                      {festivalsToday.map((f, i) => (
                        <div key={`hfest-${i}`} className="notif-card notif-celebration-bg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(200,146,42,0.3)', marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '1.5rem' }} className="notif-gift-icon">{f.emoji}</span>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Happy {f.name}! 🎉</p>
                        </div>
                      ))}
                      {celebrations.filter(c => c.employeeId !== activeEmployee.id).length === 0 && wishesReceived.length === 0 && notifications.length === 0 && festivalsToday.length === 0 ? (
                        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>No new notifications right now.</p>
                      ) : (
                        <>
                          {celebrations.filter(c => c.employeeId !== activeEmployee.id).map((c, i) => (
                            <div key={`cel-${i}`} style={celebrationCardStyle}>
                              <div style={{ fontSize: '1.5rem' }}>{c.type === 'birthday' ? '🎂' : '🎊'}</div>
                              <div style={{ flexGrow: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{c.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                  {c.type === 'birthday' ? "🎉 It's their birthday today!" : "🎉 Work anniversary today!"}
                                </p>
                              </div>
                              <button
                                onClick={() => sendWish(c.employeeId, c.type)}
                                disabled={sentWishesToday.includes(c.employeeId)}
                                className={sentWishesToday.includes(c.employeeId) ? 'btn btn-disabled' : 'btn btn-primary'}
                                style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem', whiteSpace: 'nowrap' }}
                              >
                                {sentWishesToday.includes(c.employeeId) ? '✓ Wished' : 'Wish 🎉'}
                              </button>
                            </div>
                          ))}
                          {celebrations.some(c => c.employeeId === activeEmployee.id) && (
                            <div style={{ ...celebrationCardStyle, background: 'linear-gradient(135deg, rgba(200,146,42,0.12), rgba(200,146,42,0.04))' }}>
                              <div style={{ fontSize: '1.5rem' }}><Gift size={22} color="var(--color-orange)" /></div>
                              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>It's your special day today! 🎉 Happy Celebrations from TOSBS!</p>
                            </div>
                          )}
                          {wishesReceived.map((w, i) => (
                            <div key={`wish-${i}`} style={wishCardStyle}>
                              <p style={{ margin: 0, fontSize: '0.82rem' }}><strong>{w.from_name}</strong> wished you:</p>
                              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-orange)', fontWeight: 600 }}>{w.message}</p>
                            </div>
                          ))}
                          {notifications
                            .filter(n => {
                              if (!n.is_announcement) return true;
                              const { startDate, endDate } = getAnnouncementDates(n);
                              const todayStr = new Date().toISOString().split('T')[0];
                              if (startDate && startDate > todayStr) return false;
                              if (endDate && endDate < todayStr) return false;
                              return true;
                            })
                            .map((n, i) => {
                              const { startDate, endDate, cleanMessage } = getAnnouncementDates(n);
                              return (
                                <div key={`notif-${i}`} style={announcementCardStyle}>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{n.title}</p>
                                  {cleanMessage && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{cleanMessage}</p>}
                                  <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    {n.is_announcement && startDate ? `${new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}${endDate ? ` – ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}` : new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </p>
                                </div>
                              );
                            })
                          }
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {attendanceTab === 'overview' && (
              <>
                {/* TOSBS Logo Banner */}
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.5rem' }}>
                  <img src="/Capture.JPG" alt="TOSBS" style={{ height: '48px' }} />
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-orange)' }}>TOSBS</h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Employee Onboarding & Workforce Portal</p>
                  </div>
                </div>

                {/* Notifications Bar — festivals, birthdays, wishes, announcements */}
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={16} color="var(--color-orange)" /> Celebrations & Announcements
                  </h3>
                  {festivalsToday.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.85rem' }}>
                      {festivalsToday.map((f, i) => (
                        <div key={`fest-${i}`} className="notif-card notif-celebration-bg" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(200,146,42,0.3)' }}>
                          <span style={{ fontSize: '1.8rem' }} className="notif-gift-icon">{f.emoji}</span>
                          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Happy {f.name}! 🎉 Wishing everyone at TOSBS a joyful celebration.</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {celebrations.length === 0 && wishesReceived.length === 0 && notifications.length === 0 && festivalsToday.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>No celebrations or announcements today. Check back tomorrow! 🎉</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                      {celebrations.some(c => c.employeeId === activeEmployee.id) && (
                        <div className="notif-card notif-celebration-bg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(200,146,42,0.3)' }}>
                          <Gift size={22} color="var(--color-orange)" className="notif-gift-icon" />
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>It's your special day today! 🎉 Happy Celebrations from TOSBS!</p>
                        </div>
                      )}

                      {celebrations.filter(c => c.employeeId !== activeEmployee.id).map((c, i) => (
                        <div key={`ov-cel-${i}`} className="notif-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', animationDelay: `${i * 0.06}s` }}>
                          <div style={{ fontSize: '1.4rem' }}>{c.type === 'birthday' ? '🎂' : '🎊'}</div>
                          <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.87rem' }}>{c.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{c.type === 'birthday' ? "It's their birthday today!" : "Work anniversary today!"}</p>
                          </div>
                          <button
                            onClick={() => sendWish(c.employeeId, c.type)}
                            disabled={sentWishesToday.includes(c.employeeId)}
                            className={(sentWishesToday.includes(c.employeeId) ? 'btn btn-disabled' : 'btn btn-primary') + ' notif-wish-btn'}
                            style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem', whiteSpace: 'nowrap' }}
                          >
                            {sentWishesToday.includes(c.employeeId) ? '✓ Wished' : 'Wish 🎉'}
                          </button>
                        </div>
                      ))}

                      {wishesReceived.map((w, i) => (
                        <div key={`ov-wish-${i}`} className="notif-card" style={{ padding: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', animationDelay: `${(celebrations.length + i) * 0.06}s` }}>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>{w.from_name}</strong> wished you:</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--color-orange)', fontWeight: 600 }}>{w.message}</p>
                        </div>
                      ))}

                      {notifications
                        .filter(n => {
                          if (!n.is_announcement) return false;
                          const { startDate, endDate } = getAnnouncementDates(n);
                          const todayStr = new Date().toISOString().split('T')[0];
                          if (startDate && startDate > todayStr) return false;
                          if (endDate && endDate < todayStr) return false;
                          return true;
                        })
                        .map((ann, i) => {
                          const { startDate, endDate, cleanMessage } = getAnnouncementDates(ann);
                          return (
                            <div key={`ann-${i}`} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(200,146,42,0.25)', animation: `slideUp 0.${i+3}s ease both`, marginBottom: '0.75rem' }}>
                              {ann.image_url && <img src={ann.image_url} alt={ann.title} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />}
                              <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(200,146,42,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                  <span style={{ fontSize: '1rem', animation: 'pulse 2s infinite' }}>📢</span>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{ann.title}</p>
                                </div>
                                {cleanMessage && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{cleanMessage}</p>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-orange)' }}>
                                    {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                                    {endDate ? ` – ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                      {notifications.filter(n => !n.is_announcement).map((n, i) => (
                        <div key={`ov-notif-${i}`} className="notif-card" style={{ padding: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', animationDelay: `${(celebrations.length + wishesReceived.length + i) * 0.06}s` }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.87rem' }}>{n.title}</p>
                          {n.message && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{n.message}</p>}
                          <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.5rem' }}>
                  <div className="avatar-circle" style={{ width: '64px', height: '64px', fontSize: '1.5rem', flexShrink: 0 }}>{activeEmployee.full_name?.charAt(0)}</div>
                  <div style={{ flexGrow: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{activeEmployee.full_name}</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>{activeEmployee.email}</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '2px 0 0' }}>{activeEmployee.position || 'Position not assigned'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Onboarding Status</p>
                    <div style={{ marginTop: '0.4rem' }}>{getStatusBadge(activeEmployee.status)}</div>
                  </div>
                </div>

                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Onboarding Checklist</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Account Created', done: true },
                      { label: 'Personal Details Submitted', done: ['details_filled', 'digilocker_verified', 'approved'].includes(activeEmployee.status) },
                      { label: 'Location Verified', done: ['details_filled', 'digilocker_verified', 'approved'].includes(activeEmployee.status) },
                      { label: 'DigiLocker Identity Verified', done: ['digilocker_verified', 'approved'].includes(activeEmployee.status) },
                      { label: 'Documents Uploaded', done: ['digilocker_verified', 'approved'].includes(activeEmployee.status) },
                      { label: 'HR Approval', done: activeEmployee.status === 'approved' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: item.done ? 'var(--color-success-bg)' : 'var(--bg-tertiary)', border: `2px solid ${item.done ? 'var(--color-success)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.done && <Check size={12} color="var(--color-success)" />}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: item.done ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: item.done ? 500 : 400 }}>{item.label}</span>
                        {i === 5 && !item.done && <span className="badge badge-pending" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Awaiting HR</span>}
                        {i === 5 && item.done && <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Approved ✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="glass-card">
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Personal Details</h3>
                    <EmpDetailRow label="Phone" value={activeEmpDetails?.phone_number} />
                    <EmpDetailRow label="Date of Birth" value={activeEmpDetails?.dob} />
                    <EmpDetailRow label="Gender" value={activeEmpDetails?.gender} />
                    <EmpDetailRow label="Permanent Address" value={activeEmpDetails?.permanent_address} />
                    <EmpDetailRow label="Current Address" value={activeEmpDetails?.current_address} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card">
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Location Verification</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        {activeEmpDetails?.location_verified ? <span className="badge badge-success">✓ GPS Verified</span> : <span className="badge badge-pending">Skipped / Unverified</span>}
                        {activeEmpDetails?.location_distance_m != null && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{activeEmpDetails.location_distance_m}m from address</span>}
                      </div>
                    </div>
                    <div className="glass-card">
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Banking Details</h3>
                      <EmpDetailRow label="Bank" value={activeEmpDetails?.bank_name} />
                      <EmpDetailRow label="Account No." value={activeEmpDetails?.account_number} />
                      <EmpDetailRow label="IFSC" value={activeEmpDetails?.ifsc_code} />
                    </div>
                  </div>
                  <div className="glass-card">
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>DigiLocker Verification</h3>
                    <EmpDetailRow label="Aadhaar" value={activeEmpDetails?.digilocker?.aadhaar_masked} />
                    <EmpDetailRow label="PAN" value={activeEmpDetails?.digilocker?.pan_number} />
                    <EmpDetailRow label="Name on Aadhaar" value={activeEmpDetails?.digilocker?.name_on_aadhaar} />
                  </div>
                  <div className="glass-card">
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Uploaded Documents</h3>
                    {activeEmpDetails?.docs?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {activeEmpDetails.docs.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: '6px' }}>
                            <FileText size={14} color="var(--color-orange)" /><span style={{ fontSize: '0.82rem' }}>{doc.document_type?.toUpperCase()}: {doc.file_name}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>No documents uploaded.</p>}
                  </div>
                </div>
              </>
            )}

            {attendanceTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h3>
                  {todayAttendance ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700, textTransform: 'uppercase' }}>✓ Checked In</p>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{new Date(todayAttendance.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{todayAttendance.check_in_distance_m}m from office</p>
                        {todayAttendance.check_in_photo && <img src={todayAttendance.check_in_photo} alt="In" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', marginTop: '0.75rem', transform: 'scaleX(-1)' }} />}
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: todayAttendance.check_out_time ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.025)', borderRadius: '10px', border: `1px solid ${todayAttendance.check_out_time ? 'rgba(59,130,246,0.2)' : 'var(--border-color)'}` }}>
                        {todayAttendance.check_out_time ? (
                          <>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--color-info)', fontWeight: 700, textTransform: 'uppercase' }}>✓ Checked Out</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{new Date(todayAttendance.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{todayAttendance.work_hours}h worked</p>
                            {todayAttendance.check_out_photo && <img src={todayAttendance.check_out_photo} alt="Out" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', marginTop: '0.75rem', transform: 'scaleX(-1)' }} />}
                          </>
                        ) : (<><p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Not Checked Out</p><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Check out when you leave</p></>)}
                      </div>
                    </div>
                  ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No attendance marked today.</p>}
                </div>

                {(!todayAttendance || !todayAttendance.check_out_time) && (
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>{!todayAttendance ? '📍 Mark Check In' : '📍 Mark Check Out'}</h3>
                    <div style={{ width: '100%', maxWidth: '320px', margin: '0 auto 1.25rem', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(200,146,42,0.3)', backgroundColor: '#0a1628', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {isAttendanceCameraOpen && <video ref={attendanceVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}
                      {attendancePhoto && !isAttendanceCameraOpen && <img src={attendancePhoto} alt="Attendance" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}
                      {!isAttendanceCameraOpen && !attendancePhoto && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}><Users size={28} color="rgba(200,146,42,0.5)" /><p style={{ fontSize: '0.8rem', margin: 0 }}>Take a selfie to mark attendance</p></div>)}
                      {isAttendanceCameraOpen && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><div style={{ width: '140px', height: '170px', border: '2px solid rgba(200,146,42,0.6)', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} /></div>)}
                    </div>
                    <canvas ref={attendanceCanvasRef} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      {!isAttendanceCameraOpen && !attendancePhoto && <button onClick={startAttendanceCamera} className="btn btn-primary">Open Camera</button>}
                      {isAttendanceCameraOpen && (<div style={{ display: 'flex', gap: '0.75rem' }}><button onClick={stopAttendanceCamera} className="btn btn-secondary">Cancel</button><button onClick={captureAttendancePhoto} className="btn btn-primary">📸 Take Photo</button></div>)}
                      {attendancePhoto && !isAttendanceCameraOpen && !showWfhOption && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>✓ Photo taken</span>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => { setAttendancePhoto(null); startAttendanceCamera(); }} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Retake</button>
                            <button onClick={() => handleMarkAttendance(todayAttendance ? 'out' : 'in')} className="btn btn-primary" disabled={attendanceLoading} style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem' }}>{attendanceLoading ? 'Verifying...' : todayAttendance ? '✓ Mark Check Out' : '✓ Mark Check In'}</button>
                          </div>
                        </div>
                      )}
                      {showWfhOption && (
                        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-pending-bg)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', maxWidth: '380px', textAlign: 'center' }}>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>📍 You're outside office range</p>
                          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>You are <strong>{wfhPendingData?.dist}m</strong> away from the office. Working from home today?</p>
                          <textarea placeholder="Reason for WFH..." value={wfhPendingData?.reason || ''} onChange={(e) => setWfhPendingData(prev => ({ ...prev, reason: e.target.value }))} className="form-input" style={{ minHeight: '70px', resize: 'vertical', marginBottom: '1rem', fontSize: '0.82rem', textAlign: 'left' }} />
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => { setShowWfhOption(false); setAttendancePhoto(null); setWfhPendingData(null); }} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Cancel</button>
                            <button onClick={() => handleMarkAttendance(wfhPendingData?.type, true)} className="btn btn-primary" disabled={attendanceLoading} style={{ fontSize: '0.85rem' }}>{attendanceLoading ? 'Submitting...' : '🏠 Yes, Mark as WFH'}</button>
                          </div>
                          <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>HR will be notified automatically via email.</p>
                        </div>
                      )}
                      {attendanceError && !showWfhOption && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.82rem', maxWidth: '380px', textAlign: 'center' }}>{attendanceError}</div>}
                    </div>
                  </div>
                )}

                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Last 30 Days</h3>
                  {attendanceHistory.length > 0 ? (
                    <table className="custom-table">
                      <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                      <tbody>
                        {attendanceHistory.map((rec, i) => (
                          <tr key={i}>
                            <td>{new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td>{rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td>{rec.work_hours ? `${rec.work_hours}h` : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                {rec.work_type === 'wfh' && <span className="badge badge-pending">🏠 WFH</span>}
                                {rec.work_hours >= 8 ? <span className="badge badge-success">Full Day</span> : rec.work_hours > 0 ? <span className="badge badge-pending">Half Day</span> : rec.check_in_time ? <span className="badge badge-info">In Progress</span> : <span className="badge badge-danger">Absent</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No attendance records yet.</p>}
                </div>
              </div>
            )}

            {attendanceTab === 'leave' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Apply for Leave</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Leave Type</label>
                      <select className="form-select" value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                        <option value="CL">Casual Leave (CL)</option><option value="SL">Sick Leave (SL)</option><option value="EL">Earned Leave (EL)</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">From Date</label><input type="date" className="form-input" value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} min={new Date().toISOString().split('T')[0]} /></div>
                    <div className="form-group"><label className="form-label">To Date</label><input type="date" className="form-input" value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} min={leaveForm.from_date || new Date().toISOString().split('T')[0]} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Reason</label><textarea className="form-input" placeholder="Describe your reason for leave..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} /></div>
                  {leaveFormError && <p style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{leaveFormError}</p>}
                  <button onClick={handleApplyLeave} className="btn btn-primary" disabled={leaveSubmitting}>{leaveSubmitting ? 'Submitting...' : 'Submit Leave Application'}</button>
                </div>

                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>My Leave Applications</h3>
                  {leaveApplications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leaveApplications.map((leave, i) => (
                        <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: `1px solid ${leave.status === 'approved' ? 'rgba(16,185,129,0.2)' : leave.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{leave.leave_type === 'CL' ? 'Casual Leave' : leave.leave_type === 'SL' ? 'Sick Leave' : 'Earned Leave'}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{leave.from_date} → {leave.to_date}</p>
                              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{leave.reason}</p>
                              {leave.hr_note && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-pending)' }}>HR Note: {leave.hr_note}</p>}
                            </div>
                            <span className={`badge ${leave.status === 'approved' ? 'badge-success' : leave.status === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                              {leave.status === 'approved' ? '✓ Approved' : leave.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                                    ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No leave applications yet.</p>}
                </div>
              </div>
            )}

            {attendanceTab === 'salary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <input type="month" className="form-input" value={salaryMonth} onChange={(e) => { setSalaryMonth(e.target.value); computeSalary(activeEmployee.id, e.target.value); }} style={{ maxWidth: '180px' }} />
                </div>
                {salaryLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Calculating...</p>
                ) : salaryBreakdown ? (
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      My Salary — {new Date(salaryMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div><p style={detailLabelStyle}>Present Days</p><p style={detailValueStyle}>{salaryBreakdown.presentDays}</p></div>
                      <div><p style={detailLabelStyle}>Paid Leave / Holiday Days</p><p style={detailValueStyle}>{salaryBreakdown.leaveDays}</p></div>
                      <div><p style={detailLabelStyle}>Absent Days</p><p style={{ ...detailValueStyle, color: 'var(--color-danger)' }}>{salaryBreakdown.absentDays}</p></div>
                      <div><p style={detailLabelStyle}>Overtime Hours</p><p style={detailValueStyle}>{salaryBreakdown.overtimeHours}h</p></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.9rem' }}>Monthly CTC</span><span style={{ fontSize: '0.9rem' }}>₹{salaryBreakdown.monthlyCtc.toLocaleString('en-IN')}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>− Deductions</span><span style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>− ₹{salaryBreakdown.deduction.toLocaleString('en-IN')}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}>+ Overtime Pay</span><span style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}>+ ₹{salaryBreakdown.overtimePay.toLocaleString('en-IN')}</span></div>
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.4rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>Net Salary</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-orange)' }}>₹{salaryBreakdown.netSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Monthly Payslip Download Section */}
                    {(() => {
                      const status = isPayslipAvailableForMonth(salaryMonth);
                      return (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} color="var(--color-orange)" />
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Monthly Salary Slip</p>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: status.available ? 'var(--color-text-secondary)' : 'var(--color-pending)' }}>
                              {status.available ? 'Your official salary slip for this month is ready to download.' : status.message}
                            </p>
                          </div>
                          {status.available ? (
                            <button
                              onClick={() => downloadEmployeePayslip(activeEmployee, salaryBreakdown, salaryMonth)}
                              className="btn btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                            >
                              <FileText size={16} /> Download Payslip (.xlsx)
                            </button>
                          ) : (
                            <button
                              disabled
                              className="btn btn-disabled"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.6 }}
                              title={status.message}
                            >
                              <Clock size={16} /> Unlocks on 21st
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No salary data available for this month yet — contact HR if this seems wrong.</p>}
              </div>
            )}

            {attendanceTab === 'reimbursement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Submit Form */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    💼 New Reimbursement Request
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Visit</label>
                      <input type="date" className="form-input" value={reimbForm.date} onChange={(e) => setReimbForm({...reimbForm, date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-input" value={reimbForm.start_time} onChange={(e) => setReimbForm({...reimbForm, start_time: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-input" value={reimbForm.end_time} onChange={(e) => setReimbForm({...reimbForm, end_time: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Client Name / Place Visited</label>
                    <input type="text" className="form-input" placeholder="e.g. Raj Electricals, Pune" value={reimbForm.client_name} onChange={(e) => setReimbForm({...reimbForm, client_name: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Description</label>
                    <textarea className="form-input" placeholder="Describe the work done at the client place..." value={reimbForm.work_description} onChange={(e) => setReimbForm({...reimbForm, work_description: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
                  </div>

                  {/* Expense rows */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ color: 'var(--color-orange)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Expense Breakdown</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                      {reimbForm.expenses.map((exp, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px 36px', gap: '0.5rem', alignItems: 'center' }}>
                          <select className="form-select" value={exp.category} onChange={(e) => updateExpenseRow(i, 'category', e.target.value)} style={{ fontSize: '0.82rem' }}>
                            <option value="Travel">🚗 Travel</option>
                            <option value="Food">🍱 Food & Meals</option>
                            <option value="Stationery">📋 Stationery</option>
                            <option value="Other">📦 Other</option>
                          </select>
                          <input type="text" className="form-input" placeholder="Description (e.g. Ola cab to client)" value={exp.description} onChange={(e) => updateExpenseRow(i, 'description', e.target.value)} style={{ fontSize: '0.82rem' }} />
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>₹</span>
                            <input type="number" className="form-input" placeholder="0.00" value={exp.amount} onChange={(e) => updateExpenseRow(i, 'amount', e.target.value)} style={{ paddingLeft: '24px', fontSize: '0.82rem' }} min="0" />
                          </div>
                          {reimbForm.expenses.length > 1 && (
                            <button onClick={() => removeExpenseRow(i)} className="btn btn-danger" style={{ padding: '7px', height: '36px', width: '36px' }}><X size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={addExpenseRow} className="btn btn-secondary" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>+ Add Expense</button>
                  </div>

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1rem', backgroundColor: 'rgba(200,146,42,0.08)', borderRadius: '8px', border: '1px solid rgba(200,146,42,0.2)', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginRight: '1rem' }}>Total Amount</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-orange)' }}>₹{getTotalAmount().toFixed(2)}</span>
                  </div>

                  {/* Receipt Upload */}
                  <div className="form-group">
                    <label className="form-label">Upload Receipt / Bill (optional)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={handleReimbReceiptUpload} className="form-input" />
                    {reimbReceiptFile && <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>✓ {reimbReceiptFile}</p>}
                  </div>

                  {reimbFormError && <p style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{reimbFormError}</p>}
                  <button onClick={handleSubmitReimbursement} className="btn btn-primary" disabled={reimbSubmitting} style={{ marginTop: '0.5rem' }}>
                    {reimbSubmitting ? 'Submitting...' : '📤 Submit Reimbursement Request'}
                  </button>
                </div>

                {/* History */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>My Reimbursement Requests</h3>
                  {reimbursements.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reimbursements.map((r, i) => (
                        <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${r.status === 'approved' ? 'rgba(16,185,129,0.2)' : r.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>{r.client_name}</p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.date}</span>
                                {r.start_time && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.start_time} – {r.end_time}</span>}
                              </div>
                              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.work_description}</p>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {(r.expenses || []).map((e, j) => (
                                  <span key={j} style={{ fontSize: '0.72rem', padding: '2px 8px', backgroundColor: 'rgba(200,146,42,0.08)', borderRadius: '20px', color: 'var(--color-text-secondary)', border: '1px solid rgba(200,146,42,0.15)' }}>
                                    {e.category}: ₹{e.amount}
                                  </span>
                                ))}
                              </div>
                              {r.hr_note && <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--color-pending)' }}>HR Note: {r.hr_note}</p>}
                              {r.paid_date && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-success)' }}>Paid on: {r.paid_date}</p>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-orange)' }}>₹{parseFloat(r.total_amount).toFixed(2)}</span>
                              <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                                {r.status === 'approved' ? '✓ Approved' : r.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No reimbursement requests yet.</p>}
                </div>

              </div>
            )}

            {attendanceTab === 'resignation' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Resignation & Offboarding</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                      Submit your resignation request, track notice period countdown, and view offboarding details.
                    </p>
                  </div>
                  {myResignation && (
                    <div>
                      {myResignation.status === 'pending' && <span className="badge badge-pending">⏳ Pending HR Review</span>}
                      {(myResignation.status === 'notice_period' || myResignation.status === 'approved') && (
                        <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                          📋 Notice Period Active
                        </span>
                      )}
                      {myResignation.status === 'deactivated' && <span className="badge" style={{ backgroundColor: 'rgba(100,116,139,0.15)', color: '#64748b' }}>🔒 Offboarded / Deactivated</span>}
                      {myResignation.status === 'rejected' && <span className="badge badge-danger">✗ Request Rejected</span>}
                    </div>
                  )}
                </div>

                {/* CASE 1: No resignation submitted yet or rejected */}
                {(!myResignation || myResignation.status === 'rejected') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {/* Resignation Form */}
                    <div className="glass-card">
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-orange)' }}>
                        Submit Resignation Request
                      </h3>

                      {resignationError && (
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <AlertCircle size={16} /><span>{resignationError}</span>
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">Reason for Resignation *</label>
                        <textarea
                          rows={4}
                          className="form-input"
                          placeholder="Please share the reason for your resignation (e.g. Higher studies, Better opportunity, Personal reasons, Relocation, etc.)"
                          value={resignationForm.reason}
                          onChange={(e) => setResignationForm({ ...resignationForm, reason: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Desired / Requested Last Working Day *</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="form-input"
                          value={resignationForm.requested_last_day}
                          onChange={(e) => setResignationForm({ ...resignationForm, requested_last_day: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Handover Notes / Feedback (Optional)</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="Any preliminary handover details, current project status, or comments for HR"
                          value={resignationForm.notes}
                          onChange={(e) => setResignationForm({ ...resignationForm, notes: e.target.value })}
                        />
                      </div>

                      <button
                        onClick={handleApplyResignation}
                        disabled={resignationSubmitting}
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem' }}
                      >
                        {resignationSubmitting ? 'Submitting Request...' : 'Submit Resignation Request ➔'}
                      </button>
                    </div>

                    {/* Policy & Guidance Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="glass-card" style={{ border: '1px solid rgba(200,146,42,0.2)' }}>
                        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          📋 Resignation & Notice Process
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                          <li><strong>HR Review:</strong> HR will review your request and assign the official notice period duration.</li>
                          <li><strong>Normal Salary:</strong> Your salary during the notice period is calculated as normal based on your working attendance.</li>
                          <li><strong>Asset & Work Handover:</strong> Ensure all company credentials, project files, and hardware assets are handed over.</li>
                          <li><strong>5-Day Auto-Deactivation:</strong> Your employee portal account will automatically deactivate 5 days after your notice period ends.</li>
                        </ul>
                      </div>

                      <div className="glass-card" style={{ backgroundColor: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>Need to discuss before resigning?</h5>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                              You can always reach out directly to HR or your team lead for any guidance or confidential discussions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 2: Pending HR Approval */}
                {myResignation && myResignation.status === 'pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '750px' }}>
                    <div className="glass-card" style={{ border: '1px solid rgba(200,146,42,0.3)', backgroundColor: 'rgba(200,146,42,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(200,146,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={20} color="var(--color-orange)" />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Resignation Request Submitted</h3>
                          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Applied on {myResignation.created_at ? new Date(myResignation.created_at).toLocaleDateString('en-IN') : '—'}
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <p style={detailLabelStyle}>Reason Submitted</p>
                            <p style={{ ...detailValueStyle, fontWeight: 600 }}>{myResignation.reason}</p>
                          </div>
                          <div>
                            <p style={detailLabelStyle}>Requested Last Day</p>
                            <p style={detailValueStyle}>{myResignation.requested_last_day}</p>
                          </div>
                        </div>
                        {myResignation.notes && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                            <p style={detailLabelStyle}>Handover Notes</p>
                            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{myResignation.notes}</p>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: '6px', fontSize: '0.82rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        <span>HR is reviewing your request. Once approved, your official notice period duration and last working day will appear here.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 3: In Notice Period */}
                {myResignation && (myResignation.status === 'notice_period' || myResignation.status === 'approved') && (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const startD = new Date(myResignation.notice_start_date || todayStr);
                  const endD = new Date(myResignation.notice_end_date || todayStr);
                  const todayD = new Date(todayStr);
                  const totalDays = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)));
                  const isNoticeOver = todayD > endD;

                  let daysRemaining = 0;
                  let daysElapsed = 0;
                  let progressPercent = 0;
                  let autoDeactDaysLeft = 5;

                  if (!isNoticeOver) {
                    daysRemaining = Math.max(0, Math.round((endD - todayD) / (1000 * 60 * 60 * 24)));
                    daysElapsed = totalDays - daysRemaining;
                    progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
                  } else {
                    const daysSinceEnd = Math.round((todayD - endD) / (1000 * 60 * 60 * 24));
                    autoDeactDaysLeft = Math.max(0, 5 - daysSinceEnd);
                  }

                  const autoDeactDateObj = new Date(endD);
                  autoDeactDateObj.setDate(autoDeactDateObj.getDate() + 5);
                  const autoDeactDateStr = autoDeactDateObj.toLocaleDateString('en-IN');

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
                      {/* Notice Countdown Banner */}
                      <div className="glass-card" style={{ border: '1px solid rgba(59,130,246,0.3)', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(200,146,42,0.03))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Official Notice Period
                            </span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0', color: isNoticeOver ? '#10b981' : '#1e3a8a' }}>
                              {isNoticeOver ? 'Notice Period Completed ✓' : `${daysRemaining} Days Remaining`}
                            </h2>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Notice Duration</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-orange)' }}>
                              {myResignation.notice_period_days} Days
                            </h3>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            <span>Started: {myResignation.notice_start_date}</span>
                            <span>Last Day: {myResignation.notice_end_date}</span>
                          </div>
                          <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${isNoticeOver ? 100 : progressPercent}%`, height: '100%', backgroundColor: isNoticeOver ? '#10b981' : '#3b82f6', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>

                        {/* Key Dates Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <p style={detailLabelStyle}>Notice Start Date</p>
                            <p style={detailValueStyle}>{myResignation.notice_start_date || '—'}</p>
                          </div>
                          <div>
                            <p style={detailLabelStyle}>Official Last Working Day</p>
                            <p style={{ ...detailValueStyle, fontWeight: 700, color: '#1e40af' }}>{myResignation.notice_end_date || '—'}</p>
                          </div>
                          <div>
                            <p style={detailLabelStyle}>Account Deactivation Date</p>
                            <p style={{ ...detailValueStyle, color: '#d97706', fontWeight: 700 }}>{autoDeactDateStr}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notice Over Grace Warning */}
                      {isNoticeOver && (
                        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                              Notice period ended on {myResignation.notice_end_date}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                              Your account is in the 5-day grace period and will automatically deactivate in <strong>{autoDeactDaysLeft} day(s)</strong>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Salary & Payout Info Card */}
                      <div className="glass-card" style={{ border: '1px solid rgba(200,146,42,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={18} color="var(--color-orange)" />
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notice Period Salary</h4>
                          </div>
                          <button
                            onClick={() => {
                              setAttendanceTab('salary');
                              computeSalary(activeEmployee.id, salaryMonth);
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                          >
                            Open Salary View ➔
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                          Your compensation during the notice period is calculated as normal based on your monthly CTC, regular working days, and marked daily attendance. Any excess leave taken will be deducted accordingly as per company policy.
                        </p>
                      </div>

                      {/* HR Note */}
                      {myResignation.hr_note && (
                        <div className="glass-card">
                          <p style={detailLabelStyle}>HR Instructions / Notes</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{myResignation.hr_note}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CASE 4: Deactivated */}
                {myResignation && myResignation.status === 'deactivated' && (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(100,116,139,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <UserMinus size={28} color="#64748b" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Offboarding Complete</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
                      Your notice period has completed and your account has been deactivated. Thank you for your service and contributions at TOSBS!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




const splashContainerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', width: '100%', maxWidth: '700px', margin: '0 auto', padding: '1rem' };
const splashLogoStyle = { fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #c8922a, #e0a832)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.08em' };
const splashCardStyle = { padding: '2.5rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column' };
const splashIconWrapperStyle = { width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const splashLinkStyle = { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-orange)', fontSize: '0.9rem', fontWeight: 700 };
const loginWrapperStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', width: '100%' };
const sidebarStyle = { width: '260px', height: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3d 100%)', borderRight: '1px solid rgba(200,146,42,0.2)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, flexShrink: 0 };
const sidebarHeaderStyle = { padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)' };
const sidebarNavStyle = { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 };
const sidebarLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.15s ease', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' };
const sidebarLinkActiveStyle = { ...sidebarLinkStyle, color: '#c8922a', backgroundColor: 'rgba(200,146,42,0.1)', borderLeft: '3px solid #c8922a', borderRadius: '0 8px 8px 0', fontWeight: 700 };
const sidebarUserStyle = { padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', backgroundColor: '#060910' };
const logoutButtonStyle = { padding: '6px', borderRadius: '6px', color: 'var(--color-text-secondary)', border: 'none', background: 'none', cursor: 'pointer' };
const badgeCountStyle = { marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', backgroundColor: '#c8922a', color: '#0a1628' };
const statCardStyle = { padding: '1.5rem' };
const statLabelStyle = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' };
const statValStyle = { fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'var(--font-display)' };
const statSubStyle = { margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' };
const analyticsGridStyle = { display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' };
const actionItemStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease' };
const cardTitleStyle = { borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', fontSize: '1rem' };
const detailLabelStyle = { margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const detailValueStyle = { margin: '3px 0 0', fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 };
const noDataStyle = { color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 };
const EmpDetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.4rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', minWidth: '110px' }}>{label}</span>
    <span style={{ fontSize: '0.85rem', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', textAlign: 'right', maxWidth: '180px', wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);
const declSectionStyle = { backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(200,146,42,0.15)', borderRadius: '12px', padding: '1.25rem' };
const declTitleStyle = { fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-orange)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const declTextStyle = { fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 };
const declLabelStyle = { fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' };
const declValueStyle = { margin: '2px 0 0', fontSize: '0.88rem', color: 'var(--color-text-primary)', fontWeight: 500 };

// Notification / Wish panel styles
const notifPanelStyle = { position: 'absolute', top: '110%', right: 0, width: '360px', maxWidth: '90vw', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 12px 32px rgba(16,24,40,0.18)', zIndex: 100 };
const celebrationCardStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(200,146,42,0.08), rgba(200,146,42,0.02))', border: '1px solid rgba(200,146,42,0.15)', marginBottom: '0.6rem' };
const wishCardStyle = { padding: '0.85rem', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '0.6rem' };
const announcementCardStyle = { padding: '0.85rem', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '0.6rem' };

export default App;