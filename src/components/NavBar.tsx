import React from 'react';

interface NavBarProps {
  currentView: 'profile' | 'history' | 'documents' | 'admin';
  setCurrentView: (view: 'profile' | 'history' | 'documents' | 'admin') => void;
  isAdmin: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, setCurrentView, isAdmin }) => {
  const tabs = isAdmin
    ? [{ id: 'admin', icon: "admin_panel_settings", label: "Admin" }]
    : [
        { id: 'history', icon: "history", label: "History" },
        { id: 'documents', icon: "description", label: "Documents" },
        { id: 'profile', icon: "person", label: "Profile" }
      ];

  const isWide = currentView === 'admin';
  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${isWide ? 'max-w-7xl rounded-t-2xl px-6' : 'max-w-md px-2'} mx-auto z-50 border-t bg-white border-blue-50 flex justify-around items-center h-20 shadow-lg transition-all duration-300`}>
      {tabs.map((item, index) => (
        <button
          key={index}
          onClick={() => setCurrentView(item.id as 'profile' | 'history' | 'documents' | 'admin')}
          className={`flex flex-col items-center justify-center transition-all duration-200 ease-in-out active:scale-95 ${currentView === item.id ? 'text-blue-700 bg-blue-50 rounded-xl px-3.5 py-1' : 'text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={currentView === item.id ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
          <span className="text-caption font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
