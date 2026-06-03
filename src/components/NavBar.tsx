import React from 'react';

interface NavBarProps {
  currentView: 'profile' | 'history' | 'documents' | 'admin';
  setCurrentView: (view: 'profile' | 'history' | 'documents' | 'admin') => void;
  isAdmin: boolean;
  lang?: 'en' | 'ar';
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, setCurrentView, isAdmin, lang = 'en' }) => {
  const translations: Record<'en' | 'ar', Record<string, string>> = {
    en: {
      history: "History",
      documents: "Documents",
      profile: "Profile",
      admin: "Admin"
    },
    ar: {
      history: "السجل",
      documents: "قسيمتي",
      profile: "الملف الشخصي",
      admin: "الإدارة"
    }
  };

  const tabs = isAdmin
    ? [{ id: 'admin', icon: "admin_panel_settings", label: translations[lang].admin }]
    : [
        { id: 'history', icon: "history", label: translations[lang].history },
        { id: 'documents', icon: "description", label: translations[lang].documents },
        { id: 'profile', icon: "person", label: translations[lang].profile }
      ];

  const isWide = currentView === 'admin';
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 ${isWide ? 'max-w-7xl rounded-t-2xl px-6' : 'max-w-md px-2'} mx-auto z-50 border-t bg-white border-blue-50 flex justify-around items-center min-h-20 shadow-lg transition-all duration-300`}
      style={{ paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((item, index) => (
        <button
          key={index}
          onClick={() => setCurrentView(item.id as 'profile' | 'history' | 'documents' | 'admin')}
          aria-label={item.label}
          aria-current={currentView === item.id ? 'page' : undefined}
          className={`flex flex-col items-center justify-center transition-all duration-200 ease-in-out active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500/20 outline-none rounded-xl px-3.5 py-1 ${currentView === item.id ? 'text-blue-700 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span className="material-symbols-outlined" style={currentView === item.id ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
          <span className="text-caption font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
