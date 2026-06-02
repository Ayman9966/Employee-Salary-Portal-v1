import React from 'react';
import { formatAmount } from '../lib/format';

interface SalarySlip {
  id: string;
  month: string;
  year: number;
  status: string;
  amount: number;
}

interface HistoryListProps {
  slips: SalarySlip[];
  onSelect: (slip: SalarySlip) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ slips, onSelect }) => (
  <div className="space-y-3">
    {slips.map((slip, index) => (
      <button
        key={slip.id}
        onClick={() => onSelect(slip)}
        className="w-full text-left bg-white border border-blue-50 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ease-out group overflow-hidden relative"
      >
        {/* Modern Icon Container */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${index === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary/70'}`}>
          <span className="material-symbols-outlined text-[22px]">description</span>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] font-black text-[#041b3c] tracking-tight leading-tight">
              {slip.month} {slip.year}
            </p>
            <div className="flex">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${slip.status?.toUpperCase() === 'PROCESSED' ? 'bg-[#f0fdf4] text-[#166534]' : 'bg-[#fffaf0] text-[#c2410c]'}`}>
                {slip.status}
              </div>
            </div>
          </div>
        </div>

        {/* Amount Area */}
        <div className="flex-shrink-0 flex items-center gap-2 pl-2">
          <div className="text-right">
            <p className="text-[17px] font-black text-on-background leading-none tracking-tight group-hover:text-primary transition-colors">
              {formatAmount(slip.amount)}
            </p>
            <p className="text-[9px] text-outline font-bold uppercase tracking-widest mt-1">NET PAY</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all text-[20px]">chevron_right</span>
        </div>

        {/* Left accent for the most recent one */}
        {index === 0 && (
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
        )}
      </button>
    ))}
  </div>
);
