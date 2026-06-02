import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  isSyncing?: boolean;
  currentView?: 'profile' | 'history' | 'documents' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ isSyncing, currentView = 'history' }) => {
  const maxWidthClass = currentView === 'admin' ? 'max-w-7xl' : 'max-w-md';
  return (
    <header className="bg-white border-b border-blue-100 font-sans antialiased z-50 sticky top-0 px-4">
      <div className={`${maxWidthClass} mx-auto flex justify-between items-center h-16 w-full`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-400">
            <User size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-bold text-blue-700">Salary Slips</h1>
        </div>
        <div className={`p-2 rounded-full transition-all duration-300 ${isSyncing ? 'text-primary bg-primary/5' : 'text-slate-300 opacity-50'}`}>
          <span className={`material-symbols-outlined ${isSyncing ? 'animate-spin' : ''}`}>
            sync
          </span>
        </div>
      </div>
    </header>
  );
};
