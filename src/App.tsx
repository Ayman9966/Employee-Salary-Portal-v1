/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProfileCard } from './components/ProfileCard';
import { SettingsCard } from './components/SettingsCard';
import { NavBar } from './components/NavBar';
import { HistoryList } from './components/HistoryList';
import { DocumentView } from './components/DocumentView';
import { SplashScreen } from './components/SplashScreen';
import { fetchSalarySlips, fetchDashboardSummary, DashboardSummary, getFromCache, verifyAdminLogin, checkTenantBlockedStatus } from './services/dataService';
import { HistoryItemSkeleton } from './components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { formatAmount } from './lib/format';
import { AdminPanel } from './components/AdminPanel';
import { Onboarding } from './components/Onboarding';
import { Lock, AlertTriangle } from 'lucide-react';

export default function App() {
  const [accessCode, setAccessCode] = useState<string | null>(localStorage.getItem('access_code'));
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem('is_demo_mode') === 'true');
  const [tempCode, setTempCode] = useState(() => {
    return localStorage.getItem('is_demo_mode') === 'true' ? '1234' : '';
  });
  const [inviteCountdown, setInviteCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setTempCode('1234');
    }
  }, [isDemoMode]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const [gasUrlConfigured, setGasUrlConfigured] = useState(() => {
    return !!(localStorage.getItem('gas_url') || '').trim();
  });
  const [joinedWorkspace, setJoinedWorkspace] = useState(() => localStorage.getItem('company_name') || '');
  const [shareInviteCopied, setShareInviteCopied] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if tenant is blocked by super admin on load
  useEffect(() => {
    if (gasUrlConfigured) {
      checkTenantBlockedStatus().then((blocked) => {
        if (blocked) setIsBlocked(true);
      });
    }
  }, [gasUrlConfigured]);

  // Handle URL "invite" parameter for Zero-Environment Auto-Onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(inviteParam)));
        if (decoded && decoded.gasUrl) {
          localStorage.setItem('gas_url', decoded.gasUrl.trim());
          if (decoded.companyName) localStorage.setItem('company_name', decoded.companyName.trim());
          if (decoded.email) localStorage.setItem('company_email', decoded.email.trim());
          if (decoded.whatsapp) localStorage.setItem('company_whatsapp', decoded.whatsapp.trim());
          if (decoded.companySize) localStorage.setItem('company_size', decoded.companySize.trim());
          
          setGasUrlConfigured(true);
          setJoinedWorkspace(decoded.companyName);

          // Retain 'invite' query parameter for exactly 60 seconds so user has time to download/install PWA configured with preset setup
          setInviteCountdown(60);
        }
      } catch (err) {
        console.error('Failed to parse dynamic onboarding invitation token:', err);
      }
    }
  }, []);

  // Handle invite link 60 seconds countdown clean up
  useEffect(() => {
    if (inviteCountdown === null) return;
    if (inviteCountdown <= 0) {
      // Clear invite parameter after 60 seconds
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setInviteCountdown(null);
      return;
    }

    const timer = setInterval(() => {
      setInviteCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [inviteCountdown]);
  
  // Custom states for Admin login
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    const isPath = window.location.pathname.toLowerCase().endsWith('/admin') || window.location.pathname.toLowerCase() === '/admin';
    const isHash = window.location.hash.toLowerCase() === '#admin';
    const isQuery = new URLSearchParams(window.location.search).has('admin');
    return isPath || isHash || isQuery;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const isPath = window.location.pathname.toLowerCase().endsWith('/admin') || window.location.pathname.toLowerCase() === '/admin';
      const isHash = window.location.hash.toLowerCase() === '#admin';
      const isQuery = new URLSearchParams(window.location.search).has('admin');
      setIsAdminRoute(isPath || isHash || isQuery);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  const [currentView, setCurrentView] = useState<'profile' | 'history' | 'documents' | 'admin'>('history');
  const [isLoading, setIsLoading] = useState(!getFromCache<any[]>('slips'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Minimum splash time
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 seconds splash
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = (config: {
    companyName: string;
    whatsapp: string;
    email: string;
    companySize: string;
    gasUrl: string;
  }) => {
    localStorage.setItem('gas_url', config.gasUrl);
    localStorage.setItem('company_name', config.companyName);
    localStorage.setItem('company_whatsapp', config.whatsapp);
    localStorage.setItem('company_email', config.email);
    localStorage.setItem('company_size', config.companySize);
    setGasUrlConfigured(true);
    setJoinedWorkspace(config.companyName);
    setIsDemoMode(localStorage.getItem('is_demo_mode') === 'true');
  };

  const [historySlips, setHistorySlips] = useState<any[]>(getFromCache<any[]>('slips') || []);
  const [selectedSlip, setSelectedSlip] = useState<{month: string, year: number} | null>(() => {
    const cached = getFromCache<any[]>('slips');
    if (cached && cached.length > 0) {
      return { month: cached[0].month, year: cached[0].year };
    }
    return null;
  });
  const [summary, setSummary] = useState<DashboardSummary>(getFromCache<DashboardSummary>(`dashboard_${new Date().getFullYear()}`) || { annualNet: 0, availableYears: [] });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Handle URL "ref" parameter for automatic login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode && !accessCode) {
      localStorage.setItem('access_code', refCode);
      setAccessCode(refCode);
      // Clean up the URL
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [accessCode]);

  // Route to Admin mode automatically when logged in as admin
  useEffect(() => {
    if (accessCode?.toLowerCase() === 'admin') {
      setCurrentView('admin');
    }
  }, [accessCode]);

  useEffect(() => {
    if (accessCode) {
      setIsSyncing(true);
      setError(null);
      // Fetch slips and summary (slips sorted by latest first in GAS)
      Promise.all([
          fetchSalarySlips(),
          fetchDashboardSummary(selectedYear)
      ]).then(([freshSlips, freshSummary]) => {
        setHistorySlips(freshSlips);
        setSummary(freshSummary);
        setIsLoading(false);
        setIsSyncing(false);

        // Auto-select latest slip if none selected
        if (freshSlips.length > 0 && !selectedSlip) {
          setSelectedSlip({ month: freshSlips[0].month, year: freshSlips[0].year });
        }
      }).catch((err) => {
        console.error('Sync Error:', err);
        setError('Connection failed. Please check your VITE_GAS_URL or internet connection.');
        setIsLoading(false);
        setIsSyncing(false);
      });

      if (historySlips.length === 0) {
        setIsLoading(true);
      }
    }
  }, [selectedYear, accessCode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCode.trim()) {
      if (tempCode.trim().toLowerCase() === 'admin') {
        setError('Unauthorized access code.');
        return;
      }
      localStorage.setItem('access_code', tempCode.trim());
      setAccessCode(tempCode.trim());
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setIsAdminLoggingIn(true);
    try {
      const res = await verifyAdminLogin(adminEmail, adminPassword);
      if (res.success) {
        localStorage.setItem('access_code', 'admin');
        setAccessCode('admin');
        setCurrentView('admin');
      } else {
        setAdminError(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      setAdminError('Service authentication failed. Please try again.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (isDemoMode) {
      handlePerformFullReset();
      return;
    }
    setShowLogoutDialog(true);
  };

  const handlePerformJustLogout = () => {
    localStorage.removeItem('access_code');
    setAccessCode(null);
    setTempCode('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminError(null);
    setShowLogoutDialog(false);
    if (window.location.hash.toLowerCase() === '#admin') {
      window.location.hash = '';
    }
  };

  const handlePerformFullReset = () => {
    localStorage.removeItem('access_code');
    localStorage.removeItem('gas_url');
    localStorage.removeItem('company_name');
    localStorage.removeItem('company_whatsapp');
    localStorage.removeItem('company_email');
    localStorage.removeItem('company_size');
    localStorage.removeItem('payslip_db_employees');
    localStorage.removeItem('payslip_db_slips');
    localStorage.removeItem('payslip_db_initialized');
    localStorage.removeItem('is_demo_mode');
    
    // clear memory / cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });

    setAccessCode(null);
    setTempCode('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminError(null);
    setGasUrlConfigured(false);
    setJoinedWorkspace('');
    setIsDemoMode(false);
    setShowLogoutDialog(false);
    if (window.location.hash.toLowerCase() === '#admin') {
      window.location.hash = '';
    }
    // Reload safely to restore Onboarding pristine state
    window.location.reload();
  };

  const handleViewSlip = (slip: {month: string, year: number}) => {
    setSelectedSlip(slip);
    setCurrentView('documents');
  };

  if (!gasUrlConfigured) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-rose-50/50 flex items-center justify-center p-6 antialiased font-sans text-rose-950">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-rose-100 max-w-md w-full border border-rose-100/80 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <span className="material-symbols-outlined text-[32px] font-bold">block</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-rose-950 tracking-tight">Workspace Suspended</h1>
            <p className="text-xs text-rose-600 leading-relaxed font-semibold">
              This payroll workspace has been suspended by the super administrator. Access to records, pay slips, and admin management is temporarily offline.
            </p>
          </div>
          <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100/50 font-medium text-[11px] text-slate-500 leading-normal">
            Please contact your organization's human resource administrative manager or system integrator for billing or access updates.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {inviteCountdown !== null && (
        <div className="bg-emerald-600 text-white px-4 py-3 text-[11px] sm:text-xs flex flex-col md:flex-row items-center justify-between gap-3 shadow-md border-b border-emerald-500/25 z-[100] relative animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span className="bg-white text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              📩 Invitation Active
            </span>
            <span className="font-bold text-rose-50/0 text-emerald-50">
              Workspace saved locally!
            </span>
            <span className="font-semibold text-white">
              Add to Home Screen to download the app with this preconfigured setup.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-[10px] sm:text-[11px]">
            <span className="bg-white/15 text-white font-mono font-bold px-2 py-1 rounded flex items-center gap-1.5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-450 bg-rose-400 inline-block animate-ping"></span>
              Cleaning URL in <strong className="text-white">{inviteCountdown}s</strong>
            </span>
          </div>
        </div>
      )}

      {isDemoMode && (
        <div className="bg-[#003d9b] text-white px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs flex flex-col md:flex-row items-center justify-between gap-3 shadow-md border-b border-indigo-500/25 z-50 relative animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
              Demo Mode
            </span>
            <span className="font-bold text-blue-100">
              Demo Workspace:
            </span>
            <span className="font-semibold text-white">
              AirSlip Demo
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px]">
            <span className="text-slate-200">
              🎫 Employee Test Code: <strong className="text-white font-mono bg-white/20 px-1.5 py-0.5 rounded">1234</strong>
            </span>
            <span className="text-slate-200">
              🔑 Admin Test: <span className="text-white font-mono bg-white/20 px-1.5 py-0.5 rounded">admin@enterprise.com</span> / <span className="text-white font-mono bg-white/20 px-1.5 py-0.5 rounded">admin123</span>
            </span>
            <button
              onClick={handlePerformFullReset}
              className="ml-2 bg-red-650 hover:bg-red-700 bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all active:scale-95 duration-150 cursor-pointer shadow-sm shadow-red-950/20"
            >
              Leave Demo
            </button>
          </div>
        </div>
      )}

      {!accessCode ? (
        <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-blue-50"
          >
            {isAdminRoute ? (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 text-blue-700">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Console</h1>
                  <p className="text-slate-500 text-sm mt-1">Sign in with management credentials</p>
                </div>
                
                {adminError && (
                  <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm text-center font-medium">
                    {adminError}
                  </div>
                )}
                
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      placeholder="e.g. admin@enterprise.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isAdminLoggingIn}
                    className="w-full h-12 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 active:scale-[0.98] transition-all flex items-center justify-center shadow-md shadow-blue-200 disabled:opacity-50 mt-6 cursor-pointer"
                  >
                    {isAdminLoggingIn ? 'AUTHENTICATING...' : 'ACCESS ADMIN PANEL'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                       setIsAdminRoute(false);
                       window.location.hash = '';
                    }}
                    className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors mt-4 block p-1"
                  >
                    ← Employee Portal
                  </button>
                </form>

                {/* Quick login button for admin if in demo mode */}
                {isDemoMode && (
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <p className="text-[9px] text-[#003d9b] font-bold uppercase tracking-wider text-center">Quick Test Access Console</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminEmail('admin@enterprise.com');
                        setAdminPassword('admin123');
                        // Instantly auto-log in for ultimate convenience
                        localStorage.setItem('access_code', 'admin');
                        setAccessCode('admin');
                        setCurrentView('admin');
                      }}
                      className="w-full p-2.5 border border-amber-150 bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 rounded-xl text-[10px] font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] group"
                    >
                      <span className="text-slate-500 font-normal">Autofill & Login as Sandbox Admin</span>
                      <span className="text-[#003d9b] uppercase group-hover:underline mt-0.5">Click here to log in instantly</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#041b3c]">
                    {joinedWorkspace ? `Login to: ${joinedWorkspace}` : "Payslip Access"}
                  </h1>
                  <p className="text-slate-500 text-sm mt-2">
                    {joinedWorkspace 
                      ? 'Please enter your personal access code to authenticate'
                      : 'Please enter your personal access code'}
                  </p>
                </div>
                
                {joinedWorkspace && (
                  <div className="mb-5 bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-100 text-xs text-center font-bold flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Workspace Connected: {joinedWorkspace}</span>
                  </div>
                )}
                
                {error && (
                  <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm text-center font-medium">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <input 
                      type="password"
                      placeholder="Access Code"
                      value={tempCode}
                      onChange={(e) => setTempCode(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ease-in-out outline-none text-center text-lg tracking-widest font-mono font-bold"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full h-12 bg-primary text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-200 ease-in-out shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    UNLOCK DATA
                  </button>
                </form>

                {/* Quick login buttons for employee / admin if in demo mode */}
                {isDemoMode && (
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                    <p className="text-[9px] text-[#003d9b] font-bold uppercase tracking-wider text-center">Quick Test Access Console</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTempCode('1234');
                          localStorage.setItem('access_code', '1234');
                          setAccessCode('1234');
                        }}
                        className="py-2.5 px-2 border border-blue-150 bg-blue-50 hover:bg-blue-100/70 text-[#003d9b] rounded-xl text-[10px] font-bold transition-all text-center flex flex-col justify-center items-center cursor-pointer active:scale-[0.98]"
                      >
                        <span className="text-slate-500 font-normal">Log in as Employee</span>
                        <span className="tracking-wide">Use Code "1234"</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminRoute(true);
                          window.location.hash = '#admin';
                        }}
                        className="py-2.5 px-2 border border-blue-150 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold transition-all text-center flex flex-col justify-center items-center cursor-pointer active:scale-[0.98]"
                      >
                        <span className="text-slate-500 font-normal">Log in as Admin</span>
                        <span>Credentials Console</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="bg-[#f9f9ff] min-h-screen pb-24 text-[#041b3c]">
      <Header isSyncing={isSyncing} currentView={currentView} />
      <main className={`${currentView === 'admin' ? 'max-w-7xl px-4 md:px-6' : 'max-w-md px-3'} mx-auto py-4`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentView === 'profile' ? (
              <>
                <ProfileCard />
                <SettingsCard />
                <div className="pt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full h-12 flex items-center justify-center gap-2 border border-error text-error font-bold rounded-xl hover:bg-error-container/20 transition-all duration-200 ease-in-out active:scale-[0.98]">
                    <span className="material-symbols-outlined">logout</span>
                    LOGOUT
                  </button>
                  <p className="text-center text-caption text-slate-400 mt-6">Version 2.4.1 (Build 882)</p>
                </div>
              </>
            ) : currentView === 'history' ? (
              <div className="space-y-6">
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-caption font-bold text-secondary uppercase tracking-wider block mb-1">Statement Year</span>
                      <div className="relative flex items-center">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="appearance-none bg-white border border-outline-variant rounded-xl pl-4 pr-10 py-2 font-headline-md text-display text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ease-in-out cursor-pointer min-w-[120px] shadow-sm">
                          {summary.availableYears.map(year => (
                              <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 pointer-events-none text-secondary">expand_more</span>
                      </div>
                    </div>
                    <div className="text-right pb-1">
                      <span className="text-caption font-bold text-secondary uppercase tracking-wider">Annual Net</span>
                      <p className="font-headline-md text-display font-semibold text-primary">{formatAmount(summary.annualNet, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                </section>
                
                {error && (
                  <div className="bg-error-container/10 border border-error/20 p-4 rounded-xl text-center">
                    <span className="material-symbols-outlined text-error text-[32px] mb-2">signal_disconnected</span>
                    <p className="text-error text-body font-medium">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-3 text-caption bg-primary text-white px-4 py-1.5 rounded-full font-bold hover:bg-primary/90 transition-colors"
                    >
                      RETRY
                    </button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <HistoryItemSkeleton key={i} />)}
                  </div>
                ) : (
                  <HistoryList slips={historySlips} onSelect={handleViewSlip} />
                )}
              </div>
            ) : currentView === 'documents' ? (
              <DocumentView 
                selectedSlip={selectedSlip} 
                historySlips={historySlips}
                onSelectSlip={setSelectedSlip}
              />
            ) : (
              <AdminPanel 
                onSyncTrigger={() => {
                  // Instantly update local slip lists and dashboard aggregators when changed
                  fetchSalarySlips().then(freshSlips => {
                    setHistorySlips(freshSlips);
                  });
                  fetchDashboardSummary(selectedYear).then(freshSumm => {
                    setSummary(freshSumm);
                  });
                }} 
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <NavBar currentView={currentView} setCurrentView={setCurrentView} isAdmin={accessCode?.toLowerCase() === 'admin'} />
    </div>
    )}

    {/* Dynamic English-Only Logout Options Confirmation Modal */}
    <AnimatePresence>
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutDialog(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          
          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/60 text-left space-y-5 overflow-hidden"
          >
            <div className="text-center md:text-left space-y-2">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto md:mx-0 border border-red-100">
                <span className="material-symbols-outlined text-xl font-bold">logout</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center justify-between">
                <span>Sign Out</span>
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Choose how you want to sign out. You can sign out of your current session, or completely reset this device's company configurations.
              </p>
            </div>

            {/* Options list */}
            <div className="space-y-3">
              {/* Option 1: Just Logout */}
              <button
                type="button"
                onClick={handlePerformJustLogout}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group animate-none"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  A
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>Just Sign Out</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Logs you out but keeps the Google Sheets connection settings.
                  </p>
                </div>
              </button>

              {/* Option 2: Logout and Clear Setup */}
              <button
                type="button"
                onClick={handlePerformFullReset}
                className="w-full text-left p-3.5 rounded-2xl border border-red-100 bg-red-50/20 hover:bg-red-50/50 hover:border-red-300 transition-all flex items-start gap-3 cursor-pointer group animate-none"
              >
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-900 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-red-200 transition-colors">
                  B
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-bold text-xs text-red-900 flex items-center justify-between">
                    <span>Sign Out & Clear Company</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Removes session, company details, and Google Apps Script endpoint. Resets system.
                  </p>
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

