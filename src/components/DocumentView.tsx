import React, { useEffect, useState } from 'react';
import { fetchPayrollDetails, PayrollDetails, getFromCache } from '../services/dataService';
import { PayslipSkeleton } from './Skeleton';
import { motion } from 'motion/react';
import { formatAmount } from '../lib/format';
import { getTranslatedLabel } from '../lib/translations';

interface DocumentViewProps {
  selectedSlip: { month: string; year: number } | null;
  historySlips: any[];
  onSelectSlip: (slip: { month: string; year: number }) => void;
  lang?: 'en' | 'ar';
  isAdmin?: boolean;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ 
  selectedSlip, 
  historySlips, 
  onSelectSlip,
  lang = 'en',
  isAdmin = false
}) => {
  const [details, setDetails] = useState<PayrollDetails | null>(null);
  const [loading, setLoading] = useState(!!selectedSlip);
  const [error, setError] = useState<string | null>(null);

  // Filter months available for the currently selected year
  const availableMonths = historySlips
    .filter(s => s.year === selectedSlip?.year)
    .sort((a, b) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months.indexOf(a.month) - months.indexOf(b.month);
    });

  // Auto-select the most recent slip if none is selected
  useEffect(() => {
    if (!selectedSlip && historySlips && historySlips.length > 0) {
      onSelectSlip({ month: historySlips[0].month, year: historySlips[0].year });
    }
  }, [selectedSlip, historySlips, onSelectSlip]);

  useEffect(() => {
    if (selectedSlip) {
      setError(null);
      const cached = getFromCache<PayrollDetails>(`payroll_${selectedSlip.month}_${selectedSlip.year}`);
      
      // If we have cache, show it immediately but still sync in background
      if (cached) {
        setDetails(cached);
        setLoading(false);
      } else {
        setDetails(null);
        setLoading(true);
      }

      fetchPayrollDetails(selectedSlip.month, selectedSlip.year).then((fresh) => {
          if (fresh) setDetails(fresh);
          setLoading(false);
      }).catch((err) => {
        console.error('Fetch Details Error:', err);
        setError('Failed to load payslip details.');
        setLoading(false);
      });
      
    } else {
      setDetails(null);
      setLoading(false);
    }
  }, [selectedSlip]);

  if (loading && !details) {
    return (
      <main className="pt-2 px-3 pb-24 space-y-4 max-w-md mx-auto">
        <PayslipSkeleton />
      </main>
    );
  }

  if (!details && !loading) {
    return (
      <main className="pt-2 px-3 pb-24 space-y-4 max-w-md mx-auto text-center py-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          {error ? (
            <div className="bg-error-container/10 border border-error/20 p-4 rounded-xl">
              <span className="material-symbols-outlined text-error text-[48px] mb-4">signal_disconnected</span>
              <p className="text-error font-medium">{error}</p>
              <p className="text-caption text-secondary mt-2">Please check your connection and try again.</p>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-[48px] text-outline mb-4">description</span>
              <p className="text-secondary font-medium">Please select a payslip from history to view details.</p>
            </>
          )}
        </motion.div>
      </main>
    );
  }

  const isRtl = lang === 'ar';
  const isMathValid = details ? Math.abs((details.grossEarnings - details.totalDeductions) - details.netPay) < 0.1 : true;

  // Bilingual Arabic month names dictionary
  const monthArabicMap: { [key: string]: string } = {
    January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل',
    May: 'مايو', June: 'يونيو', July: 'يوليو', August: 'أغسطس',
    September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر', December: 'ديسمبر'
  };

  const getTranslatedMonth = (englishMonth: string) => {
    return monthArabicMap[englishMonth] || englishMonth;
  };

  return (
    <motion.main 
      key={`${selectedSlip?.month}-${selectedSlip?.year}-${lang}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`pt-2 px-3 pb-24 space-y-4 max-w-md mx-auto ${isRtl ? 'text-right' : 'text-left'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Month Shortcuts */}
      <div className="overflow-x-auto hide-scrollbar py-1 no-print">
        <div className="flex gap-2">
          {availableMonths.map((m, idx) => (
            <button 
              key={`${m.month}-${m.year}-${idx}`} 
              onClick={() => onSelectSlip({ month: m.month, year: m.year })}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-medium text-caption transition-all duration-200 ease-in-out ${details && details.month === m.month ? 'bg-primary text-white shadow-sm scale-105' : 'bg-white border border-outline-variant text-secondary hover:border-primary/50 hover:bg-slate-50'}`}
            >
              {isRtl ? getTranslatedMonth(m.month) : m.month.substring(0, 3).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Payslip Body */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-caption font-bold text-on-secondary-container uppercase tracking-wider mb-0.5">
              {isRtl ? `${details.year} ${getTranslatedMonth(details.month)}` : `${details.month} ${details.year}`}
            </p>
            <h2 className="text-display font-semibold text-on-background">{details.employeeName}</h2>
            <p className="text-caption text-secondary font-medium mt-0.5 tracking-wide">
              {isRtl ? 'صافي الراتب الشهري' : 'Net Monthly Pay'}
            </p>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-caption font-bold ${details.status?.toUpperCase() === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
            {details.status?.toUpperCase() === 'PROCESSED' 
              ? (isRtl ? 'تم الصرف' : 'PROCESSED') 
              : (isRtl ? 'قيد المراجعة' : 'UNDER REVIEW')}
          </div>
        </div>
        <div className="text-[32px] font-extrabold text-primary mb-1-alt font-sans">
          {formatAmount(details.netPay)}
        </div>
        <div className="flex items-center gap-1.5 text-secondary text-caption">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          <span>
            {isRtl ? 'تاريخ الدفع' : 'Payment Date'}: {details.paymentDate}
          </span>
        </div>
      </motion.section>

      {/* Earnings Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-blue-100 rounded-xl overflow-hidden"
      >
        <div className="bg-[#E9F2FF] px-4 py-2 flex items-center justify-between">
          <h3 className="text-caption font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            {isRtl ? 'المستحقات والعلاوات' : 'Earnings & Allowances'}
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {details.earnings.map(item => (
            <div key={item.label} className="flex justify-between items-center text-body">
              <span className="text-on-surface-variant font-medium">{getTranslatedLabel(item.label, lang as 'en' | 'ar')}</span>
              <span className="font-bold text-on-background">{formatAmount(item.val, {maximumFractionDigits: 0})}</span>
            </div>
          ))}
          <hr className="border-t border-slate-100"/>
          <div className="flex justify-between items-center text-primary text-body font-bold py-1">
            <span>{isRtl ? 'إجمالي الراتب المستحق' : 'Gross Earnings'}</span>
            <span>{formatAmount(details.grossEarnings)}</span>
          </div>
        </div>
      </motion.section>

      {/* Deductions Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-blue-100 rounded-xl overflow-hidden"
      >
        <div className="bg-surface-container-low px-4 py-2 flex items-center justify-between">
          <h3 className="text-caption font-bold text-error flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            {isRtl ? 'الاستقطاعات والخصومات' : 'Deductions & Offsets'}
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {details.deductions.map(item => (
            <div key={item.label} className="flex justify-between items-center text-body">
              <span className="text-on-surface-variant font-medium">{getTranslatedLabel(item.label, lang as 'en' | 'ar')}</span>
              <span className="font-bold text-error">-{formatAmount(item.val, {maximumFractionDigits: 0})}</span>
            </div>
          ))}
          <hr className="border-t border-slate-100"/>
          <div className="flex justify-between items-center text-error text-body font-bold py-1">
            <span>{isRtl ? 'إجمالي الاستقطاعات' : 'Total Deductions'}</span>
            <span>-{formatAmount(details.totalDeductions)}</span>
          </div>
        </div>
      </motion.section>

      {/* Math trust audit banner */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className={`p-3 rounded-xl border flex items-center justify-between text-[11px] ${isMathValid ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">{isMathValid ? 'verified' : 'error'}</span>
            <span>
              {isRtl ? 'تدقيق الحساب' : 'Math Audit'}: {formatAmount(details.grossEarnings, {maximumFractionDigits: 0})} − {formatAmount(details.totalDeductions, {maximumFractionDigits: 0})} = {formatAmount(details.netPay, {maximumFractionDigits: 0})}
            </span>
          </div>
          <span className="font-bold">
            {isMathValid 
              ? (isRtl ? '✓ متطابق' : '✓ MATCHING') 
              : (isRtl ? '⚠️ فارق حسابي' : '⚠️ MISMATCH')}
          </span>
        </motion.div>
      )}

      {/* Metadata widgets */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-white p-3 rounded-xl border border-blue-50">
          <p className="text-caption font-bold text-secondary uppercase mb-0.5">{isRtl ? 'الرقم الوظيفي' : 'Emp ID'}</p>
          <p className="text-body font-bold text-on-background">#{details.employeeId}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-50">
          <p className="text-caption font-bold text-secondary uppercase mb-0.5">{isRtl ? 'الأيام المستحقة' : 'Days Payable'}</p>
          <p className="text-body font-bold text-on-background">
            {details.daysPayable} {isRtl ? 'أيام' : 'Days'}
          </p>
        </div>
      </motion.div>

      {/* Comments section */}
      {details.comments && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-low border border-blue-50 rounded-xl p-4"
        >
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
            <div className="w-full">
              <p className="text-caption font-bold text-primary uppercase tracking-wider mb-2">{isRtl ? 'ملاحظات وتعليقات' : 'Notes & Comments'}</p>
              <p className="text-body text-on-surface-variant font-medium whitespace-pre-wrap leading-relaxed">
                {details.comments}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Dynamic Action Buttons for Printing */}
      <div className="pt-2 no-print">
        <button
          onClick={() => window.print()}
          className="w-full h-11 bg-primary hover:bg-blue-800 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 outline-none"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          {isRtl ? 'طباعة القسيمة' : 'PRINT PAYSLIP'}
        </button>
      </div>
    </motion.main>
  );
};
