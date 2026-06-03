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
  selectedSlip?: { month: string; year: number } | null;
  onSelect: (slip: SalarySlip) => void;
  onRefresh?: () => void;
  lang?: 'en' | 'ar';
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  slips, 
  selectedSlip, 
  onSelect, 
  onRefresh,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  const monthArabicMap: Record<string, string> = {
    January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل',
    May: 'مايو', June: 'يونيو', July: 'يوليو', August: 'أغسطس',
    September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر', December: 'ديسمبر'
  };

  const getTranslatedMonth = (englishMonth: string) => {
    return monthArabicMap[englishMonth] || englishMonth;
  };

  const translations = {
    en: {
      active: "Active",
      netPay: "NET PAY",
      processed: "PROCESSED",
      review: "UNDER REVIEW",
      noSlipsTitle: "No Payslips Found",
      noSlipsDesc: "Your historic payslip records will appear here as soon as they are processed by payroll.",
      checkAgain: "Check Again"
    },
    ar: {
      active: "نشط",
      netPay: "صافي الراتب",
      processed: "تم الصرف",
      review: "تحت التدقيق",
      noSlipsTitle: "لا توجد مسيرات راتب",
      noSlipsDesc: "ستظهر سجلات قسائم الرواتب التاريخية الخاصة بك هنا بمجرد معالجتها من قبل قسم الرواتب.",
      checkAgain: "تحقق مرة أخرى"
    }
  };

  const t = translations[lang];

  if (!slips || slips.length === 0) {
    return (
      <div className="bg-white border border-blue-50 rounded-2xl p-8 text-center space-y-4 max-w-sm mx-auto shadow-sm">
        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">receipt_long</span>
        </div>
        <div>
          <h3 className="font-bold text-[#041b3c] text-base">{t.noSlipsTitle}</h3>
          <p className="text-secondary text-caption mt-1 max-w-[250px] mx-auto">
            {t.noSlipsDesc}
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-blue-800 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">sync</span>
            {t.checkAgain}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slips.map((slip, index) => {
        const isCurrentActive = selectedSlip && selectedSlip.month === slip.month && selectedSlip.year === slip.year;
        const displayMonth = isAr ? getTranslatedMonth(slip.month) : slip.month;
        const statusText = slip.status?.toUpperCase() === 'PROCESSED' ? t.processed : t.review;
        
        return (
          <button
            key={slip.id}
            onClick={() => onSelect(slip)}
            className={`w-full text-left bg-white border rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ease-out group overflow-hidden relative ${isCurrentActive ? 'border-primary ring-2 ring-primary/10 shadow-sm shadow-primary/10' : 'border-blue-50'} ${isAr ? 'text-right' : 'text-left'}`}
          >
            {/* Modern Icon Container */}
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${isCurrentActive ? 'bg-primary text-white' : index === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary/70'}`}>
              <span className="material-symbols-outlined text-[22px]">description</span>
            </div>
            
            {/* Content Area */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-col gap-1.5">
                <p className="text-[15px] sm:text-[16px] font-black text-[#041b3c] tracking-tight leading-tight flex items-center gap-1.5">
                  <span>{displayMonth} {slip.year}</span>
                </p>
                <div className="flex">
                  <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${slip.status?.toUpperCase() === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#fffaf0] text-[#c2410c] border-amber-200'}`}>
                    {statusText}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Area */}
            <div className={`flex-shrink-0 flex items-center gap-2 pl-2 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={isAr ? 'text-left' : 'text-right'}>
                <p className="text-[16px] sm:text-[17px] font-black text-on-background leading-none tracking-tight group-hover:text-primary transition-colors">
                  {formatAmount(slip.amount)}
                </p>
                <p className="text-[9px] text-outline font-bold uppercase tracking-widest mt-1">{t.netPay}</p>
              </div>
              <span className={`material-symbols-outlined text-slate-300 group-hover:text-primary transition-all text-[20px] ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>chevron_right</span>
            </div>

            {/* Accent mark for the current active or most recent */}
            {(isCurrentActive || (!selectedSlip && index === 0)) && (
              <div className={`absolute top-0 w-1.5 h-full bg-primary ${isAr ? 'right-0' : 'left-0'}`} />
            )}
          </button>
        );
      })}
    </div>
  );
};
