import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  isSyncing?: boolean;
  currentView?: 'profile' | 'history' | 'documents' | 'admin';
  lang?: 'en' | 'ar';
  onChangeLang?: (lang: 'en' | 'ar') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isSyncing, 
  currentView = 'history', 
  lang = 'en', 
  onChangeLang 
}) => {
  const maxWidthClass = currentView === 'admin' ? 'max-w-7xl' : 'max-w-md';
  
  // Dynamic header titles according to Task 29 and Task 3
  const companyName = localStorage.getItem('company_name') || 'AirSlip';
  
  const translations: Record<'en' | 'ar', Record<string, string>> = {
    en: {
      history: 'Pay History',
      documents: 'Payslip Document',
      profile: 'Profile',
      admin: 'Admin Console'
    },
    ar: {
      history: 'سجل الدفع',
      documents: 'قسيمة الراتب',
      profile: 'الملف الشخصي',
      admin: 'لوحة التحكم الإدارية'
    }
  };

  const activeLang = lang || 'en';
  let title = companyName;
  if (translations[activeLang][currentView]) {
    title = translations[activeLang][currentView];
  }

  return (
    <header className="bg-white border-b border-blue-100 font-sans antialiased z-50 sticky top-0 px-4">
      <div className={`${maxWidthClass} mx-auto flex justify-between items-center h-16 w-full`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-500">
            <User size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-sm sm:text-base font-bold text-blue-700 tracking-tight">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2.5 no-print">
          {/* Icon-only Language Button Toggle */}
          <button
            type="button"
            onClick={() => onChangeLang?.(activeLang === 'en' ? 'ar' : 'en')}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-transparent hover:bg-slate-50 text-slate-400 hover:text-blue-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/20 outline-none"
            title={activeLang === 'en' ? 'Switch to Arabic' : 'تغيير للإنجليزية'}
          >
            <span className="material-symbols-outlined text-[12px]">translate</span>
          </button>

          <div 
            aria-label={isSyncing ? "Synchronizing database" : "Database synchronized"}
            aria-live="polite"
            className={`p-2 rounded-full transition-all duration-300 ${isSyncing ? 'text-blue-700 bg-blue-50' : 'text-slate-300 opacity-50'}`}
          >
            <span className={`material-symbols-outlined text-[20px] block ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

