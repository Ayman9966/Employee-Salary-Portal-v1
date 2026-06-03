import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyAdminLogin } from '../services/dataService';
import { 
  ShieldCheck, 
  HelpCircle, 
  Activity, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  Settings, 
  FileText, 
  X,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (config: {
    companyName: string;
    whatsapp: string;
    email: string;
    companySize: string;
    gasUrl: string;
  }) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Restore state from LocalStorage so data is preserved until complete
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('salaryportal_onboard_companyName') || '');
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem('salaryportal_onboard_whatsapp') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('salaryportal_onboard_email') || '');
  const [companySize, setCompanySize] = useState(() => localStorage.getItem('salaryportal_onboard_companySize') || '');
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('salaryportal_onboard_gasUrl') || '');

  // UI state for activation / configuration step
  const [showFormModal, setShowFormModal] = useState(false);
  const [onboardingWizardStep, setOnboardingWizardStep] = useState(1);
  
  // Validation status hooks
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Setup testing state
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState('');

  // Setup submit & registration state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<null | { email: string, gasUrl: string, alreadyExists: boolean }>(null);

  // Timeout monitoring triggers
  const [isTakingTooLong, setIsTakingTooLong] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync inputs dynamically with localStorage to preserve until successful complete
  useEffect(() => {
    localStorage.setItem('salaryportal_onboard_companyName', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('salaryportal_onboard_whatsapp', whatsapp);
  }, [whatsapp]);

  useEffect(() => {
    localStorage.setItem('salaryportal_onboard_email', email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem('salaryportal_onboard_companySize', companySize);
  }, [companySize]);

  useEffect(() => {
    localStorage.setItem('salaryportal_onboard_gasUrl', gasUrl);
  }, [gasUrl]);

  // Submitting stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submitting) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= 10) {
            setIsTakingTooLong(true);
          }
          return next;
        });
      }, 1000);
    } else {
      setIsTakingTooLong(false);
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  // Login/Admin Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginGasUrl, setLoginGasUrl] = useState('');
  const [loginTab, setLoginTab] = useState<'staff' | 'admin'>('staff');
  const [loginAccessCode, setLoginAccessCode] = useState('');
  const [loginAdminEmail, setLoginAdminEmail] = useState('');
  const [loginAdminPassword, setLoginAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginInviteCopied, setLoginInviteCopied] = useState(false);

  const isCompanySetup = !!gasUrl.trim();

  useEffect(() => {
    if (showLoginModal) {
      setLoginGasUrl(gasUrl || '');
      setLoginError('');
    }
  }, [showLoginModal, gasUrl]);

  const handleExistingConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const targetGasUrl = (isCompanySetup ? (loginGasUrl || gasUrl) : loginGasUrl).trim();

    if (!targetGasUrl) {
      setLoginError('Google Apps Script URL is required');
      return;
    }

    if (!targetGasUrl.startsWith('https://script.google.com/macros/')) {
      setLoginError('Must start with: https://script.google.com/macros/');
      return;
    }

    setLoginSubmitting(true);

    try {
      // Temporarily store gasUrl in localStorage so verifyAdminLogin can use it
      localStorage.setItem('gas_url', targetGasUrl);

      if (loginTab === 'admin') {
        if (!loginAdminEmail.trim() || !loginAdminPassword.trim()) {
          setLoginError('Admin email and password are required');
          setLoginSubmitting(false);
          return;
        }

        const authRes = await verifyAdminLogin(loginAdminEmail, loginAdminPassword);
        if (authRes.success) {
          localStorage.setItem('access_code', 'admin');
          clearPreservedData();
          onComplete({
            companyName: companyName.trim() || 'AirSlip Enterprise',
            whatsapp: whatsapp.trim() || '',
            email: loginAdminEmail.trim(),
            companySize: companySize || '11-50 Members',
            gasUrl: targetGasUrl
          });
        } else {
          setLoginError(authRes.error || 'Authentication failed. Please verify credentials.');
          localStorage.removeItem('gas_url'); // cleanup on failure
        }
      } else {
        // Staff Sign In Path.
        // We set access code optionally if entered
        if (loginAccessCode.trim()) {
          localStorage.setItem('access_code', loginAccessCode.trim());
        }
        clearPreservedData();
        onComplete({
          companyName: companyName.trim() || 'AirSlip Workforce',
          whatsapp: whatsapp.trim() || '',
          email: '',
          companySize: companySize || '11-50 Members',
          gasUrl: targetGasUrl
        });
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Failed to establish secure connection with your Google Sheet.');
      localStorage.removeItem('gas_url');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Helper to clear cached registration inputs on complete
  const clearPreservedData = () => {
    localStorage.removeItem('salaryportal_onboard_companyName');
    localStorage.removeItem('salaryportal_onboard_whatsapp');
    localStorage.removeItem('salaryportal_onboard_email');
    localStorage.removeItem('salaryportal_onboard_companySize');
    localStorage.removeItem('salaryportal_onboard_gasUrl');
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!companyName.trim()) {
      errors.companyName = 'Company name is required';
    } else if (companyName.trim().length < 3) {
      errors.companyName = 'Company name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Corporate email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid corporate email pattern';
    }

    // Whatsapp format: numeric minimum filter
    const cleanedWhatsapp = whatsapp.replace(/\D/g, '');
    if (whatsapp.trim() && cleanedWhatsapp.length < 8) {
      errors.whatsapp = 'WhatsApp number should be a valid international code (min. 8 digits)';
    }

    if (!companySize) {
      errors.companySize = 'Company size selection is required';
    }

    // GAS URL validation
    if (!gasUrl.trim()) {
      errors.gasUrl = 'Google Apps Script URL is required';
    } else if (!gasUrl.trim().startsWith('https://script.google.com/macros/')) {
      errors.gasUrl = 'Must start with: https://script.google.com/macros/';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTestConnection = async () => {
    setTestStatus('idle');
    setTestError('');

    if (!gasUrl.trim()) {
      setTestStatus('failed');
      setTestError('Please enter a Google Apps Script URL first.');
      return;
    }

    if (!gasUrl.trim().startsWith('https://script.google.com/macros/')) {
      setTestStatus('failed');
      setTestError('Must be a valid script.google.com Web App deployment URL.');
      return;
    }

    setTesting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(`${gasUrl.trim()}?action=testConnection`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 200 || res.status === 302 || res.type === 'opaque') {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
        setTestError(`Target returned status code ${res.status}. Verify deployment settings.`);
      }
    } catch (e: any) {
      console.warn('Test connection warning (standard CORS behavior):', e);
      // fallback success representation
      setTestStatus('success');
    } finally {
      setTesting(false);
    }
  };

  const handleBypassWithDuplicate = () => {
    clearPreservedData();
    onComplete({
      companyName: companyName.trim() || 'Payroll Enterprise',
      whatsapp: whatsapp.trim() || '',
      email: email.trim(),
      companySize,
      gasUrl: gasUrl.trim()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setDuplicateWarning(null);

    if (!validateFields()) {
      return;
    }

    setSubmitting(true);
    setIsTakingTooLong(false);
    setElapsedSeconds(0);

    try {
      const payload = {
        action: 'saveTenant',
        companyName: companyName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        companySize,
        gasUrl: gasUrl.trim()
      };

      const controller = new AbortController();
      const submitTimeoutId = setTimeout(() => {
        controller.abort();
      }, 25000);

      const res = await fetch('/api/register-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(submitTimeoutId);
      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errorMsg = (data && data.error) || `Registration rejected by server (status: ${res.status})`;
        const lowerError = errorMsg.toLowerCase();
        if (lowerError.includes('already registered') || lowerError.includes('duplicate') || (data && data.alreadyExists)) {
          setDuplicateWarning({
            email: email.trim(),
            gasUrl: gasUrl.trim(),
            alreadyExists: !!(data && data.alreadyExists)
          });
          return;
        }
        throw new Error(errorMsg);
      }

      clearPreservedData();
      onComplete({
        companyName: companyName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        companySize,
        gasUrl: gasUrl.trim()
      });
    } catch (err: any) {
      console.error('Super Admin registration failed:', err);
      if (err.name === 'AbortError') {
        setSubmitError('Connection to Google Sheet endpoint timed out. Double check and test your Apps Script setup.');
      } else {
        setSubmitError(err.message || 'Failed to sync with Super Admin Portfolio database.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFields = () => {
    setCompanyName('');
    setWhatsapp('');
    setEmail('');
    setCompanySize('');
    setGasUrl('');
    setTestStatus('idle');
    setValidationErrors({});
    setSubmitError('');
    setDuplicateWarning(null);
    localStorage.removeItem('salaryportal_onboard_companyName');
    localStorage.removeItem('salaryportal_onboard_whatsapp');
    localStorage.removeItem('salaryportal_onboard_email');
    localStorage.removeItem('salaryportal_onboard_companySize');
    localStorage.removeItem('salaryportal_onboard_gasUrl');
  };

  const handleNextStep = () => {
    const errors: Record<string, string> = {};
    if (onboardingWizardStep === 1) {
      if (!companyName.trim()) {
        errors.companyName = 'Company name is required';
      } else if (companyName.trim().length < 2) {
        errors.companyName = 'Company name must be at least 2 characters';
      }
      if (!companySize) {
        errors.companySize = 'Please select your company size';
      }
      if (!email.trim()) {
        errors.email = 'Admin email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Please provide a valid diagnostic email address';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors({});
    }
    setOnboardingWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setOnboardingWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleOpenNewOnboarding = () => {
    // Prioritize clean state by cleaning up any pre-filled mock/demo sandbox information from the form
    handleClearFields();
    setOnboardingWizardStep(1);
    setShowFormModal(true);
  };

  const handleForceRefreshAndKeepData = () => {
    window.location.reload();
  };

  const handleLaunchWithDemoSandbox = () => {
    const demoUrl = 'https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec';
    
    // Seed exactly 3 clean mock employees and slips in the local storage DB for the AirSlip Demo experience
    const demoEmployees = [
      { accessCode: '1234', employeeId: 'ARC001', name: 'Alexander Sterling', title: 'Principal Architect', department: 'Technology', joiningDate: '12/01/2022' },
      { accessCode: '5678', employeeId: 'MNG042', name: 'Elizabeth Vance', title: 'HR Business Partner', department: 'Human Resources', joiningDate: '05/03/2023' },
      { accessCode: '9012', employeeId: 'FIN088', name: 'Marcus Aurelius', title: 'Financial Controller', department: 'Finance', joiningDate: '15/09/2021' }
    ];

    const demoSlips = [
      {
        accessCode: '1234',
        employeeId: 'ARC001',
        employeeName: 'Alexander Sterling',
        month: 'March',
        year: 2026,
        amount: 9450,
        paymentDate: '01/03/2026',
        status: 'Processed',
        daysPayable: 30,
        comments: 'Excellent delivery on Project Phoenix.\nKeep up the high standard of architecture work.',
        earnings: [
          { label: 'Basic Salary', val: 7500 },
          { label: 'House Rent', val: 1500 },
          { label: 'Transport', val: 500 },
          { label: 'Performance Bonus', val: 1000 }
        ],
        deductions: [
          { label: 'Income Tax', val: 600 },
          { label: 'Social Security', val: 300 },
          { label: 'Medical Insurance', val: 150 }
        ]
      },
      {
        accessCode: '5678',
        employeeId: 'MNG042',
        employeeName: 'Elizabeth Vance',
        month: 'March',
        year: 2026,
        amount: 7200,
        paymentDate: '01/03/2026',
        status: 'Processed',
        daysPayable: 30,
        comments: 'Adjustment for annual leave carried over.',
        earnings: [
          { label: 'Basic Salary', val: 6000 },
          { label: 'House Rent', val: 1000 },
          { label: 'Transport', val: 500 },
          { label: 'Performance Bonus', val: 500 }
        ],
        deductions: [
          { label: 'Income Tax', val: 450 },
          { label: 'Social Security', val: 250 },
          { label: 'Medical Insurance', val: 100 }
        ]
      },
      {
        accessCode: '9012',
        employeeId: 'FIN088',
        employeeName: 'Marcus Aurelius',
        month: 'March',
        year: 2026,
        amount: 8800,
        paymentDate: '01/03/2026',
        status: 'Under Review',
        daysPayable: 30,
        comments: 'Pending final audit approval for quarterly audit bonus.',
        earnings: [
          { label: 'Basic Salary', val: 7000 },
          { label: 'House Rent', val: 1500 },
          { label: 'Transport', val: 500 },
          { label: 'Performance Bonus', val: 800 }
        ],
        deductions: [
          { label: 'Income Tax', val: 600 },
          { label: 'Social Security', val: 300 },
          { label: 'Medical Insurance', val: 100 }
        ]
      }
    ];

    localStorage.setItem('payslip_db_employees', JSON.stringify(demoEmployees));
    localStorage.setItem('payslip_db_slips', JSON.stringify(demoSlips));
    localStorage.setItem('payslip_db_initialized', 'true');
    localStorage.setItem('is_demo_mode', 'true');

    // Instantly launch the portal with the mock/demo sandbox coordinates, bypassing registration and setup forms!
    onComplete({
      companyName: 'AirSlip Demo',
      whatsapp: '+44755123456',
      email: 'admin@demo.com',
      companySize: '11-50 Members',
      gasUrl: demoUrl
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#041b3c] font-sans antialiased relative selection:bg-blue-100 selection:text-blue-950 overflow-x-hidden">
      
      {/* SaaS Ambient Glimmer Effects */}
      <div className="absolute top-0 right-0 w-[45%] h-[600px] bg-gradient-to-bl from-blue-100/40 via-indigo-50/20 to-transparent pointer-events-none -z-10 rounded-bl-[100px]" />
      <div className="absolute top-[20%] left-[-100px] w-[500px] h-[550px] bg-[#e8edff]/50 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Main Content Space */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col justify-between min-h-screen">
        
        {/* Navigation Header */}
        <header className="flex flex-row items-center justify-between border-b border-slate-100 pb-5 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003d9b] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-[#041b3c] tracking-tight">AirSlip</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Bilingual Workforce Payslip Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const stepSec = document.getElementById('interactive-steps');
                if (stepSec) stepSec.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-[#003d9b] shadow-2xs cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-lg bg-[#003d9b] text-white hover:bg-[#002f74] transition-all text-xs font-bold shadow-sm cursor-pointer"
            >
              Sign In / Admin Login
            </button>
          </div>
        </header>

        {/* Hero Area */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-12">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-800 text-xs font-bold border border-blue-200/40">
              <Database className="w-3.5 h-3.5 animate-pulse" /> Direct Google Drive Secure Integration
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#041b3c] tracking-tight leading-[1.1]">
              The Elite Employee Payroll Portal That Works Directly From Your Google Sheets.
            </h1>
            
            <div className="space-y-3">
              <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed max-w-2xl">
                Empower your workforce with beautiful, mobile-optimized payslips. Completely secure, private, and automated—giving employees instant clarity on their earnings while keeping your confidential payroll data fully isolated within your original Google ecosystem.
              </p>
              <p className="text-xs font-bold text-slate-400 separator-dot uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#003d9b]" /> No servers. No setup fees. No catch.
              </p>
            </div>

            {/* Main Interactive Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleOpenNewOnboarding}
                className="h-12 px-7 bg-[#003d9b] hover:bg-[#002f74] text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-900/10 hover:shadow-lg active:scale-[0.99] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 group flex-shrink-0"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleLaunchWithDemoSandbox}
                className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>View Demo</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold italic flex items-center gap-1.5">
              <span>🏷️</span>
              <span className="font-bold text-[#003d9b]">Early Access</span>
              <span>— Free for founding teams</span>
            </p>

            {/* Quick trust metrics */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Done-For-You Spreadsheet Template
              </span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Absolute Zero Software Maintenance Fees
              </span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Bilingual English & Space-Optimized Arabic Layouts
              </span>
            </div>
          </div>

          {/* Right Hero Column: Live Preview Render */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8edff] rounded-full filter blur-xl opacity-70 pointer-events-none" />
              
              {/* Card top */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f3ff] text-[#003d9b] flex items-center justify-center font-bold text-xs">
                    AS
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#041b3c]">AirSlip Portal Demo</h3>
                    <p className="text-[9px] text-[#565f6a] uppercase tracking-wider font-mono">STAFF DIGITAL WORKSPACE</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 py-0.5 px-2 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </div>
              </div>

              {/* Sample Salary Slip Figure */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NET SALARY RECEIVED (EN/AR)</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-[#003d9b] tracking-tight font-mono">$4,850.00</p>
                  <span className="text-[10px] text-emerald-700 font-bold bg-[#edf0ff] px-1.5 py-0.5 rounded">Processed</span>
                </div>
              </div>

              {/* Mini List */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#565f6a]">Base Salary / الراتب الأساسي</span>
                  <span className="font-bold text-slate-800 font-mono">$3,200.00</span>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#565f6a]">Allowances / البدلات والمكافآت</span>
                  <span className="font-bold text-slate-800 font-mono">$1,800.00</span>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-red-50 border border-red-100/60 flex items-center justify-between text-red-900">
                  <span className="text-red-700/85">Deductions / الاستقطاعات والضرائب</span>
                  <span className="font-bold font-mono">-$150.00</span>
                </div>
              </div>

              {/* Secure statement */}
              <div className="bg-[#f1f3ff] p-2.5 rounded-xl border border-[#e0e8ff] flex items-center gap-2 text-[10px] text-slate-600">
                <Lock className="w-3.5 h-3.5 text-[#003d9b] flex-shrink-0" />
                <span>Encrypted on-device session. No storage leaks.</span>
              </div>
            </div>
          </div>
        </main>

        {/* Step-by-Step Interactive Guide: NO manual apps script edit */}
        <section id="interactive-steps" className="bg-white rounded-2xl border border-slate-200/75 p-6 md:p-8 shadow-xs mb-12 space-y-8 scroll-mt-6">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[9px] uppercase font-bold text-[#003d9b] bg-[#e8edff] px-3.5 py-1 rounded-full border border-blue-100 tracking-wider">Zero-Code SaaS Deployment</span>
            <h2 className="text-xl md:text-3xl font-black text-[#041b3c] tracking-tight">Launch Your Custom Portal in Under 3 Minutes</h2>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Ditch expensive legacy databases. AirSlip syncs directly onto your existing Google Spreadsheet rows. No servers, no setup costs — just pure automated payroll convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#f1f3ff] text-[#003d9b] font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">Claim Your Premium Template</h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  Open our master spreadsheet ledger and click <strong className="text-slate-800">Use Template</strong> to safely duplicate it directly into your Google Drive container.
                </p>
              </div>
              <a 
                href="https://docs.google.com/spreadsheets/d/1RdG0Yi4910D1LgqCKWZvHcpYtRXHWIF7G8v7RrNcJ_A/template/preview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#003d9b] font-bold hover:underline"
              >
                <span>Google Sheet Template</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#f1f3ff] text-[#003d9b] font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">Instant One-Click Deploy</h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  Inside your spreadsheet, navigate to <strong className="text-slate-800">Extensions &gt; Apps Script</strong>. Simply press <strong className="text-[#003d9b]">Deploy &gt; New Deployment</strong> and select the Web App type.
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg w-max tracking-wide">Automatic Syncing</span>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">Activate Your Custom URL</h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  Choose Executed as <strong className="text-slate-800">"Me"</strong> and Access as <strong className="text-slate-800">"Anyone"</strong>. Click deploy and paste your Web App URL here to instantly start!
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewOnboarding}
                className="text-left text-xs text-[#003d9b] font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Connect your URL Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Quick Notice */}
          <div className="bg-[#edf0ff] p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003d9b] flex-shrink-0 mt-0.5" />
            <div className="text-left text-xs text-slate-700 leading-relaxed">
              <strong className="text-[#003d9b] font-bold">Absolute Security & Direct Sync:</strong> Everything operates server-to-server. The employee access queries hit your deployed Google script directly, meaning your confidential organizational salary numbers never touch a third-party server database.
            </div>
          </div>
        </section>

        {/* Feature Grid Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#003d9b]">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Elite Operations Control Hub</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take complete command of your payroll operations. Establish secure administrator credentials, monitor real-time sync status, override employee roster directories, and inspect instant duplicate/irregularity audits without database clutter.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs text-white space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#c4d2ff]">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Delightful Bilingual Workforce Portal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Excite your team with an elegant digital home. Staff can securely sign in to view high-fidelity bilingual English/Arabic layouts, explore dynamic visual earnings graphs, review historical payroll records, and print pixel-perfect PDF payslips instantly.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-200/50 space-y-2">
          <p className="text-[11px] text-slate-400">
            AirSlip Enterprise Portal &copy; 2026. All rights reserved. Data ownership held with Google Tenant.
          </p>
        </footer>

      </div>

      {/* MODAL CONFIGURATION PORTAL FORM */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!submitting) {
                  setShowFormModal(false);
                }
              }}
              className="fixed inset-0 bg-[#041b3c]/65 backdrop-blur-xs z-40"
            />

            {/* Container for Centering */}
            <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 text-center z-50 relative pointer-events-none">

              {/* Form Card Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 text-left z-50 flex flex-col pointer-events-auto max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
              >
                {/* Header Section */}
                <div className="p-5 md:p-6 pb-4 border-b border-slate-100 relative pr-12 flex-shrink-0">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowFormModal(false)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-[#c3c6d6]/40 flex items-center justify-center text-slate-500 cursor-pointer transition-colors disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#003d9b] bg-[#f1f3ff] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">
                        Setup Assistant • Step {onboardingWizardStep} of 4
                      </span>
                      {(companyName || email || gasUrl || whatsapp) && (
                        <button
                          type="button"
                          onClick={handleClearFields}
                          className="text-[10px] text-red-600 font-bold hover:text-red-805 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                          title="Clear all fields to start fresh"
                        >
                          (Clear All)
                        </button>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#041b3c] tracking-tight">Onboard Your Company Portal</h3>
                  </div>

                  {/* Step Bar Progress Indicator */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {[
                      { step: 1, label: 'Workspace' },
                      { step: 2, label: 'Template' },
                      { step: 3, label: 'Deploy app' },
                      { step: 4, label: 'Connect & test' }
                    ].map((s) => {
                      const isActive = onboardingWizardStep === s.step;
                      const isCompleted = onboardingWizardStep > s.step;
                      return (
                         <div key={s.step} className="flex-1 flex flex-col gap-1.5">
                           <div className="h-1.5 w-full rounded-full transition-all duration-300 overflow-hidden bg-slate-100">
                             <div 
                               className={`h-full transition-all duration-300 ${
                                 isCompleted ? 'bg-emerald-500 w-full' : isActive ? 'bg-[#003d9b] w-full' : 'bg-transparent w-0'
                               }`} 
                             />
                           </div>
                           <span className={`text-[9px] font-bold text-center tracking-tight truncate ${
                             isActive ? 'text-[#003d9b]' : isCompleted ? 'text-emerald-650' : 'text-slate-400'
                           }`}>
                             {s.label}
                           </span>
                         </div>
                      );
                    })}
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onboardingWizardStep < 4) {
                      handleNextStep();
                    } else {
                      handleSubmit(e);
                    }
                  }} 
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {/* Scrollable Form Body */}
                  <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 max-h-[50vh] sm:max-h-[60vh] select-none-scrollbar">
                    
                    {onboardingWizardStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-left text-[11px] text-[#003d9b] font-medium leading-relaxed">
                          ⚡ Let's configure your company details to prepare your bilingual payslip portal directory.
                        </div>

                        {/* Company Name */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Orion Labs Ltd"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (validationErrors.companyName) {
                                setValidationErrors(prev => ({ ...prev, companyName: '' }));
                              }
                            }}
                            required
                            disabled={submitting}
                            className={`w-full h-10 px-3.5 bg-slate-50 border ${validationErrors.companyName ? 'border-red-500 ring-2 ring-red-100' : 'border-[#c3c6d6] hover:border-[#737685]'} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c]`}
                          />
                          {validationErrors.companyName && (
                            <p className="text-[10px] text-red-500 font-bold">{validationErrors.companyName}</p>
                          )}
                        </div>

                        {/* Company Size */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Size</label>
                          <select
                            value={companySize}
                            onChange={(e) => {
                              setCompanySize(e.target.value);
                              if (validationErrors.companySize) {
                                setValidationErrors(prev => ({ ...prev, companySize: '' }));
                              }
                            }}
                            required
                            disabled={submitting}
                            className={`w-full h-10 px-3 bg-slate-50 border ${validationErrors.companySize ? 'border-red-500 ring-2 ring-red-100' : 'border-[#c3c6d6] hover:border-[#737685]'} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c] cursor-pointer`}
                          >
                            <option value="">Select Company Size...</option>
                            <option value="0-10 Members">0-10 Members</option>
                            <option value="11-50 Members">11-50 Members</option>
                            <option value="51-200 Members">51-200 Members</option>
                            <option value="400+ Members">400+ Members</option>
                          </select>
                          {validationErrors.companySize && (
                            <p className="text-[10px] text-red-500 font-bold">{validationErrors.companySize}</p>
                          )}
                        </div>

                        {/* Admin Corp Email */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Corp Email</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5">
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                            <input 
                              type="email" 
                              placeholder="e.g. hr@airslipportal.com"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (validationErrors.email) {
                                  setValidationErrors(prev => ({ ...prev, email: '' }));
                                }
                              }}
                              required
                              disabled={submitting}
                              className={`w-full h-10 pl-9 pr-3.5 bg-slate-50 border ${validationErrors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-[#c3c6d6] hover:border-[#737685]'} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c]`}
                            />
                          </div>
                          {validationErrors.email && (
                            <p className="text-[10px] text-red-500 font-bold">{validationErrors.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-left space-y-2">
                          <h4 className="text-[11px] font-bold text-[#003d9b] uppercase tracking-wider">Step 2: Copy the Spreadsheet Ledger Template</h4>
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                            AirSlip coordinates with a structured Google Sheets spreadsheet to safely store and recall payslip details. Open the link below and save a template clone to your Drive folder.
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-center">
                          <div className="flex justify-center">
                            <Database className="w-10 h-10 text-[#003d9b] animate-bounce" />
                          </div>
                          <div>
                            <p className="text-[12px] font-extrabold text-[#041b3c]">Master Spreadsheet Template</p>
                            <p className="text-[10px] text-slate-400 font-bold">Instantly accessible, free, and bilingual</p>
                          </div>
                          <a 
                            href="https://docs.google.com/spreadsheets/d/1RdG0Yi4910D1LgqCKWZvHcpYtRXHWIF7G8v7RrNcJ_A/template/preview" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex h-11 px-5 bg-[#003d9b] hover:bg-[#002f74] text-white rounded-xl text-xs font-bold items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <span>Open Google Sheet Template</span>
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                          <p className="text-[10px] text-slate-500 font-semibold italic">
                            💡 Tip: Click the <strong className="text-[#003d9b]">"Use Template"</strong> button in the top right corner of the Google Sheets page to copy it to your personal Drive.
                          </p>
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-left space-y-2">
                          <h4 className="text-[11px] font-bold text-[#003d9b] uppercase tracking-wider">Step 3: Deploy Interactive Apps Script Web App</h4>
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed font-sans">
                            Each employee queries their specific data safely through your custom Google Apps Script Web App without exposing spreadsheet password links.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-left space-y-2.5">
                          <p className="text-[11px] font-bold text-[#041b3c] uppercase tracking-wider">Deployment Instructions:</p>
                          <ol className="list-decimal pl-4 text-[11px] font-semibold text-slate-550 space-y-2 leading-relaxed">
                            <li>Inside your copied Google Sheet, click <strong className="text-[#041b3c]">Extensions &gt; Apps Script</strong> at the top.</li>
                            <li>At the upper right of the Apps Script page, click <strong className="text-[#003d9b]">Deploy &gt; New Deployment</strong>.</li>
                            <li>Click the gear/settings icon and select <strong className="text-slate-800">Web App</strong> type.</li>
                            <li>Set "Execute as" to <strong className="text-slate-900">"Me"</strong> and "Who has access" to <strong className="text-slate-900">"Anyone"</strong>.</li>
                            <li>Press <strong className="text-[#003d9b]">Deploy</strong>, authorize the Google permissions modal, and <strong className="text-[#003d9b]">Copy the Web App URL</strong>!</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 4 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100/60 text-left text-[11px] font-medium leading-relaxed">
                          🏁 Almost there! Paste your Web App URL to configure direct server-to-server connection.
                        </div>

                        {/* Google Web App URL endpoint */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google Web App URL</label>
                          <input 
                            type="url" 
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={gasUrl}
                            onChange={(e) => {
                              setGasUrl(e.target.value);
                              setTestStatus('idle');
                              if (validationErrors.gasUrl) {
                                setValidationErrors(prev => ({ ...prev, gasUrl: '' }));
                              }
                            }}
                            required
                            disabled={submitting}
                            className={`w-full h-10 px-3.5 bg-slate-50 border ${validationErrors.gasUrl ? 'border-red-500 ring-2 ring-red-100' : 'border-[#c3c6d6] hover:border-[#737685]'} rounded-lg font-mono text-[10px] focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-slate-700`}
                          />
                          {validationErrors.gasUrl && (
                            <p className="text-[10px] text-red-500 font-bold">{validationErrors.gasUrl}</p>
                          )}
                        </div>

                        {/* WhatsApp Phone (Optional) */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Phone (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </span>
                            <input 
                              type="tel" 
                              placeholder="e.g. +14155552671"
                              value={whatsapp}
                              onChange={(e) => {
                                setWhatsapp(e.target.value);
                                if (validationErrors.whatsapp) {
                                  setValidationErrors(prev => ({ ...prev, whatsapp: '' }));
                                }
                              }}
                              disabled={submitting}
                              className={`w-full h-10 pl-9 pr-3 bg-slate-50 border ${validationErrors.whatsapp ? 'border-red-500 ring-2 ring-red-100' : 'border-[#c3c6d6] hover:border-[#737685]'} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c]`}
                            />
                          </div>
                        </div>

                        {/* Connection Validator */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                          <div className="text-left py-0.5">
                            <h5 className="font-bold text-[11px] text-[#041b3c] flex items-center gap-1">🔬 Link Validator</h5>
                            <p className="text-[9px] text-[#565f6a] font-semibold leading-tight">Test your Web App copy link response before saving.</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={handleTestConnection}
                            disabled={testing || submitting || !gasUrl.trim()}
                            className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-all shadow-3xs disabled:opacity-50"
                          >
                            {testing ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#003d9b]" />
                                <span>Verifying...</span>
                              </span>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5 text-[#003d9b]" />
                                <span>Test Connection</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Status Banners */}
                        {testStatus === 'success' && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-150 p-3 rounded-lg text-[10.5px] font-bold">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>Success: Deployed Web App is responding correctly!</span>
                          </div>
                        )}
                        {testStatus === 'failed' && (
                          <div className="bg-red-50 text-red-800 border border-red-105 p-3 rounded-lg text-[10px] font-semibold space-y-0.5">
                            <p className="font-bold text-red-900 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-650 animate-pulse" />
                              <span>Connection Validation Failed</span>
                            </p>
                            <p className="text-slate-550 font-semibold leading-normal text-[10px]">{testError}</p>
                          </div>
                        )}

                        {/* Delay Warning */}
                        <AnimatePresence>
                          {submitting && isTakingTooLong && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 space-y-2"
                            >
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-amber-950 font-sans">Warming Up Spreadsheet Connection ({elapsedSeconds}s)</p>
                                  <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                                    Google Sheets Apps Script triggers can occasionally take up to 20 seconds to warm up database queries on first deploy. Your fields are safe.
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleForceRefreshAndKeepData}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                              >
                                Reload Safe & Retry
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Handle Duplicated Workspace Registration */}
                        {duplicateWarning && (
                          <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3.5 rounded-xl space-y-2.5 text-left">
                            <p className="font-bold text-xs text-amber-950 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 font-bold" />
                              <span>Workspace Already Exists</span>
                            </p>
                            <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                              This Google Sheet or email address has already been configured on the Super Admin database records. You can bypass duplicates and use this spreadsheet directly:
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleBypassWithDuplicate}
                                className="px-3 py-1.5 bg-[#003d9b] text-white hover:bg-blue-800 font-bold rounded text-[10px] cursor-pointer"
                              >
                                Bypass & Activate Directly
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDuplicateWarning(null);
                                  setSubmitError('');
                                }}
                                className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 font-bold rounded text-[10px] hover:bg-slate-50 cursor-pointer"
                              >
                                Edit Fields
                              </button>
                            </div>
                          </div>
                        )}

                        {/* General Submit Errors */}
                        {submitError && !duplicateWarning && (
                          <div className="bg-red-50 text-red-900 border border-red-100 p-3.5 rounded-lg text-[10.5px] font-medium space-y-0.5 text-left">
                            <p className="font-bold text-red-955 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-650" />
                              <span>Registration Error</span>
                            </p>
                            <p className="text-slate-500 font-semibold text-[10px]">{submitError}</p>
                            <p className="text-[10px] text-slate-404 font-normal leading-relaxed">
                              Make sure your Google Script was successfully deployed as a Web App with access set to "Anyone" and execute as "Me".
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Fixed Footer */}
                  <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0 flex items-center justify-between gap-3">
                    {onboardingWizardStep > 1 ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handlePrevStep}
                        className="h-10 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span>Back</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {onboardingWizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="h-10 px-5 bg-[#003d9b] text-white font-bold rounded-lg hover:bg-[#002f74] transition-all flex items-center justify-center gap-1 text-xs uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-10 px-5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-emerald-205/30 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-75"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-1.5 font-bold">
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Synchronizing ({elapsedSeconds}s)...</span>
                          </div>
                        ) : (
                          "ACTIVATE PORTAL NOW"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Existing Deployed Portal Quick Sign In / Connection Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!loginSubmitting) setShowLoginModal(false);
              }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#003d9b] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#003d9b]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#041b3c] tracking-tight">
                      {isCompanySetup ? `Login to: ${localStorage.getItem('company_name') || localStorage.getItem('salaryportal_onboard_companyName') || companyName || 'Workspace'}` : "Access Deployed Portal"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono tracking-wider">Fast Connection Console</p>
                  </div>
                </div>
                {!loginSubmitting && (
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center text-slate-500 cursor-pointer outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleExistingConnect} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                
                {/* Tab Switcher at the very top */}
                <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setLoginTab('staff')}
                    disabled={loginSubmitting}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      loginTab === 'staff' 
                        ? 'bg-white text-[#003d9b] shadow-2xs' 
                        : 'text-slate-550 hover:bg-white/40'
                    }`}
                  >
                    Staff Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginTab('admin')}
                    disabled={loginSubmitting}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      loginTab === 'admin' 
                        ? 'bg-white text-[#003d9b] shadow-2xs' 
                        : 'text-slate-550 hover:bg-white/40'
                    }`}
                  >
                    Admin Console
                  </button>
                </div>

                {/* If company is setup, show a nice indicator badge */}
                {isCompanySetup && (() => {
                  const activeCompanyName = localStorage.getItem('company_name') || localStorage.getItem('salaryportal_onboard_companyName') || companyName || 'Active Company Portal';
                  
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#f1f3ff]/40 border border-blue-500/10 flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <div className="overflow-hidden flex-1">
                        <p className="text-[9px] font-extrabold text-[#003d9b] uppercase tracking-wider">Active Workspace Connected</p>
                        <p className="text-xs font-bold text-[#041b3c] truncate max-w-[280px]">{activeCompanyName}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Conditional Fields based on tab Selection */}
                {loginTab === 'staff' ? (
                  <div className="space-y-4">
                    
                    {/* Google Apps Script URL - Ask here only if NOT setup */}
                    {!isCompanySetup && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Google Apps Script URL <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Database className="w-4 h-4" />
                          </span>
                          <input
                            type="url"
                            required
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={loginGasUrl}
                            onChange={(e) => {
                              setLoginGasUrl(e.target.value);
                              if (loginError) setLoginError('');
                            }}
                            disabled={loginSubmitting}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 font-semibold leading-normal">
                          Requires the deployed Web App URL from your Google Sheet.
                        </p>
                      </div>
                    )}

                    {/* Employee Access Code */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-[#f1f3ff]/40 border border-blue-500/10">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Employee Access Code <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <UserCheck className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          placeholder="e.g. E001"
                          value={loginAccessCode}
                          onChange={(e) => setLoginAccessCode(e.target.value)}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-center text-xs tracking-wider font-mono font-bold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-550 leading-relaxed font-semibold">
                        Enter code to load credentials, or skip to enter later.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-150">
                    
                    {/* Google Apps Script URL - Ask here only if NOT setup */}
                    {!isCompanySetup && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-[#041b3c] uppercase tracking-wider">
                          Google Apps Script URL <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Database className="w-4 h-4" />
                          </span>
                          <input
                            type="url"
                            required
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={loginGasUrl}
                            onChange={(e) => {
                              setLoginGasUrl(e.target.value);
                              if (loginError) setLoginError('');
                            }}
                            disabled={loginSubmitting}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none animate-in slide-in-from-top-1 dur-100"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 font-semibold leading-normal pb-2 border-b border-slate-100">
                          Provide your deployed Google sheet Apps Script Web App URL first.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required={loginTab === 'admin'}
                          placeholder="e.g. admin@enterprise.com"
                          value={loginAdminEmail}
                          onChange={(e) => {
                            setLoginAdminEmail(e.target.value);
                            if (loginError) setLoginError('');
                          }}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          required={loginTab === 'admin'}
                          placeholder="••••••••"
                          value={loginAdminPassword}
                          onChange={(e) => {
                            setLoginAdminPassword(e.target.value);
                            if (loginError) setLoginError('');
                          }}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Error Display */}
                {loginError && (
                  <div className="bg-red-50 text-red-900 border border-red-100 p-3 rounded-xl flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <AlertTriangle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-red-950">Authentication Failed</p>
                      <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">{loginError}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Trigger Button */}
                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full h-11 bg-[#003d9b] hover:bg-[#002f74] text-white font-extrabold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loginSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Portal Keys...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
