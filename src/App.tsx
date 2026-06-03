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
import { Lock, AlertTriangle, Smartphone, X, Check, HelpCircle } from 'lucide-react';

export default function App() {
  const [accessCode, setAccessCode] = useState<string | null>(localStorage.getItem('access_code'));
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem('is_demo_mode') === 'true');
  const [tempCode, setTempCode] = useState(() => {
    return localStorage.getItem('is_demo_mode') === 'true' ? '1234' : '';
  });
  const [inviteCountdown, setInviteCountdown] = useState<number | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone || 
        document.referrer.includes('android-app://') ||
        window.location.search.includes('display=standalone');
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', checkStandalone);
      }
    };
  }, []);

  const handleArmSetupUrl = () => {
    const companyName = localStorage.getItem('company_name') || 'Workspace';
    const gasUrl = localStorage.getItem('gas_url') || '';
    const email = localStorage.getItem('company_email') || '';
    const whatsapp = localStorage.getItem('company_whatsapp') || '';
    const companySize = localStorage.getItem('company_size') || '';
    
    const obj = { companyName, gasUrl, email, whatsapp, companySize };
    const b64 = btoa(encodeURIComponent(JSON.stringify(obj)));
    
    const newUrl = `${window.location.origin}${window.location.pathname}?invite=${b64}`;
    window.history.replaceState({}, document.title, newUrl);
    
    setInviteCountdown(60);
    // Smooth scroll to top to see the top countdown banner
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // States for PWA install guide modal
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android'>('ios');
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceOS('ios');
      setInstallTab('ios');
    } else if (/android/.test(ua)) {
      setDeviceOS('android');
      setInstallTab('android');
    } else {
      setDeviceOS('other');
      setInstallTab('ios');
    }
  }, []);

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
  const [lang, setLang] = useState<'en' | 'ar'>(() => (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en');

  const handleChangeLang = (newLang: 'en' | 'ar') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

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

      {inviteCountdown !== null && !isStandalone && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0b251e] to-slate-900 text-white border-b border-emerald-500/10 z-[100] animate-in slide-in-from-top duration-300">
          {/* Main Content Area */}
          <div className="px-4 py-3.5 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-center lg:text-left flex-col sm:flex-row">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'en' ? 'App Setup Active' : 'إعداد التطبيق نشط'}
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white tracking-wide">
                  {lang === 'en' 
                    ? 'Install AirSlip on your Phone for the Full Borderless Experience' 
                    : 'قم بتثبيت AirSlip على هاتفك لتجربة تطبيق متكاملة وكاملة الشاشة'}
                </p>
                <p className="text-[10px] text-slate-300 font-medium font-sans">
                  {lang === 'en'
                    ? 'Your current payroll configuration and workspace settings are armed and ready to sync.'
                    : 'إعدادات الشركة الحالية مهيأة وتلقائية للمزامنة فور التنزيل.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (deviceOS === 'android') setInstallTab('android');
                  else setInstallTab('ios');
                  setShowInstallGuideModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-[10px] sm:text-[10.5px] font-black uppercase px-4 py-2 rounded-xl transition-all duration-155 shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer border border-emerald-400/20 text-white"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Mobile Setup (iOS & Android)' : 'دليل تثبيت الهاتف'}</span>
              </button>

              <div className="bg-slate-800/80 border border-slate-700/50 text-slate-200 font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] sm:text-xs shadow-inner">
                <span className="text-[10px] text-emerald-400 font-sans font-semibold uppercase tracking-wider">
                  {lang === 'en' ? 'Time Left:' : 'الوقت المتبقي:'}
                </span>
                <span className="text-white bg-slate-900/95 px-2 py-0.5 rounded-lg border border-slate-700/60 font-black tracking-wide">
                  {inviteCountdown}s
                </span>
              </div>
            </div>
          </div>

          {/* Liquid Countdown Progress Bar */}
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(inviteCountdown / 60) * 100}%` }} />
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
            <button
              onClick={handlePerformFullReset}
              className="ml-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded-lg text-[9px] uppercase tracking-wider transition-all active:scale-95 duration-150 cursor-pointer shadow-sm shadow-red-950/20"
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
            {isDemoMode ? (
              <div className="space-y-6">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-blue-50 text-[#003d9b] rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100">
                    <span className="material-symbols-outlined text-[28px] font-bold">explore</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight">Demo Sandbox Entrance</h1>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">
                    Explore AirSlip instantly without entering credentials. Choose either sandbox viewpoint below:
                  </p>
                </div>

                <div className="space-y-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTempCode('1234');
                      localStorage.setItem('access_code', '1234');
                      setAccessCode('1234');
                    }}
                    className="w-full p-4 border border-blue-100 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl transition-all cursor-pointer text-left flex items-start gap-4 active:scale-[0.98] group shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#003d9b] flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:bg-[#003d9b] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>Test Employee View</span>
                        <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </h3>
                      <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5 leading-normal">
                        Browse payslip histories, check active statements, export interactive items as PDF, and toggle language preferences.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('access_code', 'admin');
                      setAccessCode('admin');
                      setCurrentView('admin');
                    }}
                    className="w-full p-4 border border-slate-100 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer text-left flex items-start gap-4 active:scale-[0.98] group shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>Test Admin View</span>
                        <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </h3>
                      <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5 leading-normal">
                        Load XLS records natively, perform math verification audits on active records, and update details directly.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            ) : isAdminRoute ? (
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
                      type="text"
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
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div 
          className={`bg-[#f9f9ff] min-h-screen pb-24 text-[#041b3c] ${lang === 'ar' ? 'text-right justify-start' : 'text-left'}`} 
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <Header isSyncing={isSyncing} currentView={currentView} lang={lang} onChangeLang={handleChangeLang} />
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
                {(() => {
                  const appTranslations = {
                    en: {
                      statementYear: "Statement Year",
                      annualNet: "Annual Net",
                      fiscal: "Fiscal",
                      logout: "LOGOUT",
                      version: "Version 2.4.1 (Build 882)",
                      retry: "RETRY"
                    },
                    ar: {
                      statementYear: "سنة كشف الراتب",
                      annualNet: "صافي الدخل السنوي",
                      fiscal: "السنة المالية",
                      logout: "تسجيل الخروج",
                      version: "الإصدار 2.4.1 (البناء 882)",
                      retry: "إعادة المحاولة"
                    }
                  };
                  const t = appTranslations[lang];

                  if (currentView === 'profile') {
                    return (
                      <>
                        <ProfileCard lang={lang} />
                        <SettingsCard lang={lang} />

                        {/* Dynamic PWA Custom Setup Card - Shown only in standard web browser */}
                        {!isStandalone && (
                          <div className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden shadow-sm p-5 space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <Smartphone className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="space-y-0.5">
                                <h3 className="text-sm font-black text-slate-800">
                                  {lang === 'en' ? 'Add to Home Screen' : 'إضافة إلى الشاشة الرئيسية'}
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                                  {lang === 'en' 
                                    ? 'Install AirSlip on your mobile device as a fast, borderless app with offline support.' 
                                    : 'قم بتثبيت AirSlip على هاتفك المحمول كتطبيق سريع دون هوامش مع ميزات تصفح ذكي.'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (deviceOS === 'android') setInstallTab('android');
                                  else setInstallTab('ios');
                                  setShowInstallGuideModal(true);
                                }}
                                className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 border border-slate-200/50 font-black rounded-xl text-[10.5px] uppercase tracking-wider transition-all duration-155 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-slate-550 text-slate-500" />
                                <span>{lang === 'en' ? 'Installation Guide' : 'دليل التثبيت'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleArmSetupUrl}
                                className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10.5px] uppercase tracking-wider transition-all duration-155 cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                              >
                                <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                                <span>{lang === 'en' ? 'Prepare Setup URL (60s)' : 'رابط التثبيت (60 ثانية)'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="pt-4">
                          <button 
                            onClick={handleLogout}
                            className="w-full h-12 flex items-center justify-center gap-2 border border-error text-error font-bold rounded-xl hover:bg-error-container/20 transition-all duration-200 ease-in-out active:scale-[0.98] cursor-pointer"
                          >
                            <span className="material-symbols-outlined">logout</span>
                            {t.logout}
                          </button>
                          <p className="text-center text-caption text-slate-400 mt-6">{t.version}</p>
                        </div>
                      </>
                    );
                  }

                  if (currentView === 'history') {
                    return (
                      <div className="space-y-6">
                        <section>
                          <div className="flex justify-between items-end mb-4 gap-4">
                            <div>
                              <span className="text-caption font-bold text-secondary uppercase tracking-wider block mb-1">{t.statementYear}</span>
                              {summary.availableYears.length > 1 ? (
                                <div className="flex flex-col gap-2">
                                  <div className="relative flex items-center">
                                    <select 
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="appearance-none bg-white border border-outline-variant rounded-xl pl-4 pr-10 py-2 font-headline-md text-display text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ease-in-out cursor-pointer min-w-[120px] shadow-sm"
                                    >
                                      {summary.availableYears.map(year => (
                                          <option key={year} value={year}>{year}</option>
                                      ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 pointer-events-none text-secondary">expand_more</span>
                                  </div>
                                  
                                  {/* Horizontal Year Filter Chips for Task 24 */}
                                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                                    {summary.availableYears.map(year => (
                                      <button
                                        type="button"
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                        className={`px-2.5 py-1 text-[9px] font-black tracking-wider rounded-lg transition-all border shrink-0 cursor-pointer ${selectedYear === year ? 'bg-primary text-white border-primary shadow-xs' : 'bg-white border-slate-200 text-secondary hover:bg-slate-50'}`}
                                      >
                                        {year}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-primary font-bold px-3 py-1.5 rounded-xl text-caption shadow-xs">
                                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                  <span>{selectedYear}</span>
                                </div>
                              )}
                            </div>
                            <div className={lang === 'ar' ? 'text-left' : 'text-right'}>
                              <span className="text-caption font-bold text-secondary uppercase tracking-wider block mb-0.5">{t.annualNet}</span>
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
                              {t.retry}
                            </button>
                          </div>
                        )}
                        
                        {isLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <HistoryItemSkeleton key={i} />)}
                          </div>
                        ) : (
                          <HistoryList slips={historySlips} selectedSlip={selectedSlip} onSelect={handleViewSlip} onRefresh={() => window.location.reload()} lang={lang} />
                        )}
                      </div>
                    );
                  }

                  if (currentView === 'documents') {
                    return (
                       <DocumentView 
                         selectedSlip={selectedSlip} 
                         historySlips={historySlips}
                         onSelectSlip={setSelectedSlip}
                         lang={lang}
                         isAdmin={accessCode?.toLowerCase() === 'admin'}
                       />
                    );
                  }

                  return (
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
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </main>
          <NavBar currentView={currentView} setCurrentView={setCurrentView} isAdmin={accessCode?.toLowerCase() === 'admin'} lang={lang} />
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

      {showInstallGuideModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstallGuideModal(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          
          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/60 text-left flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-55 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-none">
                    {lang === 'en' ? 'Add to Home Screen' : 'إضافة إلى الشاشة الرئيسية'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    {lang === 'en' ? 'Setup AirSlip on Android & iOS devices' : 'إعداد وتثبيت التطبيق على هواتف أندرويد وآيفون'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="flex border-b border-slate-100/80 bg-slate-50 p-1 rounded-xl mt-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  installTab === 'ios'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🍏</span>
                <span>{lang === 'en' ? 'Apple iOS' : 'آيفون وآيباد'}</span>
                {deviceOS === 'ios' && (
                  <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                    {lang === 'en' ? 'Best' : 'مناسب'}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  installTab === 'android'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🤖</span>
                <span>{lang === 'en' ? 'Android' : 'أندرويد'}</span>
                {deviceOS === 'android' && (
                  <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                    {lang === 'en' ? 'Best' : 'مناسب'}
                  </span>
                )}
              </button>
            </div>

            {/* Instruction Steps (Scrollable) */}
            <div className="py-4 overflow-y-auto flex-1 space-y-4 max-h-[50vh] pr-1">
              {installTab === 'ios' ? (
                // iOS Instructions
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">📢</span>
                    <p className="text-[10.5px] text-amber-900 leading-relaxed font-semibold">
                      {lang === 'en' 
                        ? 'Apple iOS requires Safari to add apps to the home screen. Please open this app URL in Safari if using other web browsers.'
                        : 'يتطلب نظام iOS فتح الرابط بواسطة متصفح Safari الأساسي لتتمكن من إضافة التطبيق إلى شاشتك الرئيسية.'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Step 1 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-[#003d9b] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-[#003d9b] text-xs">
                          {lang === 'en' ? 'Tap the Share Button' : 'اضغط على زر المشاركة'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? 'Tap the Share icon at the bottom browser bar (square with an upwards arrow 📤).' 
                            : 'اضغط على أيقونة المشاركة (مربع بسهم متجه لأعلى 📤) في شريط أدوات Safari السفلي.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-[#003d9b] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-[#003d9b] text-xs">
                          {lang === 'en' ? "Select 'Add to Home Screen'" : 'اختر "إضافة إلى الشاشة الرئيسية"'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? "Scroll down the sharing options and tap 'Add to Home Screen' (plus icon ➕)." 
                            : 'قم بالتمرير للأسفل في القائمة، واضغط على خيار "إضافة إلى الشاشة الرئيسية" (بجوار علامة الزائد ➕).'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-emerald-800 text-xs">
                          {lang === 'en' ? 'Confirm Addition' : 'تأكيد الإضافة'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? "Confirm the name 'AirSlip' and tap 'Add' in the top right. Launch the shortcut to experience borderless app!" 
                            : 'قم بتأكيد الاسم ثم اضغط على "إضافة" بالأعلى. افتح التطبيق من خلفية شاشتك للاستمتاع بواجهة كاملة.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Android Instructions
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="p-3 bg-amber-50/50 border border-amber-105 rounded-2xl flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">📢</span>
                    <p className="text-[10.5px] text-amber-900 leading-relaxed font-semibold">
                      {lang === 'en' 
                        ? 'Works on any mobile browser (Chrome, Samsung Internet, Edge, Firefox). Google Chrome is highly recommended.'
                        : 'متوافق مع جميع متصفحات أندرويد الذكية (Chrome, Samsung Internet). نوصي بمتصفح Chrome لسهولة التنصيب.'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Step 1 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-[#003d9b] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-[#003d9b] text-xs">
                          {lang === 'en' ? 'Tap the Options Menu' : 'انقر على خيارات المتصفح'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? 'Tap the browser’s overflow menu icon (three vertical dots ⋮) in the top-right corner.' 
                            : 'انقر على رمز قائمة الثلاث النقاط العمودية ⋮ في الزاوية العلوية اليمنى بجانب شريط العناوين.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-[#003d9b] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-[#003d9b] text-xs">
                          {lang === 'en' ? "Select 'Add to Home Screen' / 'Install app'" : 'اختر إضافة إلى الشاشة الرئيسية'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? "Look for 'Add to Home Screen' or 'Install App' inside the dropdown menu panel." 
                            : 'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق" من اللوحة المنسدلة.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3 items-start p-2 rounded-2xl border border-slate-100/50">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-emerald-800 text-xs">
                          {lang === 'en' ? 'Click Add/Install' : 'اضغط إضافة / تثبيت'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {lang === 'en' 
                            ? "Tap 'Add' or 'Install' on the popup dialogue. The application has now been added to your phone drawer!" 
                            : 'اضغط على زر "إضافة" أو "تثبيت". سيظهر التطبيق الآن مع تطبيقات هاتفك الأخرى!'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button / Bottom Bar */}
            <div className="border-t border-slate-100 pt-4 flex-shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs transition-all active:scale-[0.99] cursor-pointer text-center"
              >
                {lang === 'en' ? 'Got it, thank you!' : 'حسناً، فهمت!'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

