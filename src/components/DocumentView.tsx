import React, { useEffect, useState } from 'react';
import { fetchPayrollDetails, PayrollDetails, getFromCache } from '../services/dataService';
import { PayslipSkeleton } from './Skeleton';
import { motion } from 'motion/react';
import { formatAmount } from '../lib/format';

interface DocumentViewProps {
  selectedSlip: { month: string; year: number } | null;
  historySlips: any[];
  onSelectSlip: (slip: { month: string; year: number }) => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ selectedSlip, historySlips, onSelectSlip }) => {
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

  return (
    <motion.main 
      key={`${selectedSlip?.month}-${selectedSlip?.year}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="pt-2 px-3 pb-24 space-y-4 max-w-md mx-auto"
    >
      {/* Month Shortcuts */}
      <div className="overflow-x-auto hide-scrollbar py-1">
        <div className="flex gap-2">
          {availableMonths.map((m, idx) => (
            <button 
              key={`${m.month}-${m.year}-${idx}`} 
              onClick={() => onSelectSlip({ month: m.month, year: m.year })}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-medium text-caption transition-all duration-200 ease-in-out ${details.month === m.month ? 'bg-primary text-white shadow-sm scale-105' : 'bg-white border border-outline-variant text-secondary hover:border-primary/50 hover:bg-slate-50'}`}
            >
              {m.month.substring(0, 3).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-caption font-bold text-on-secondary-container uppercase tracking-wider mb-0.5">{details.month} {details.year}</p>
            <h2 className="text-display font-semibold text-on-background">{details.employeeName}</h2>
            <p className="text-caption text-secondary font-medium mt-0.5 tracking-wide">Net Monthly Pay</p>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-caption font-bold ${details.status?.toUpperCase() === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
            {details.status?.toUpperCase()}
          </div>
        </div>
        <div className="text-[32px] font-bold text-primary mb-1">{formatAmount(details.netPay)}</div>
        <div className="flex items-center gap-1.5 text-secondary text-caption">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          <span>Payment Date: {details.paymentDate}</span>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-blue-100 rounded-xl overflow-hidden"
      >
        <div className="bg-[#E9F2FF] px-4 py-2">
          <h3 className="text-caption font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            Earnings
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {details.earnings.map(item => (
            <div key={item.label} className="flex justify-between items-center text-body">
              <span className="text-on-surface-variant font-medium">{item.label}</span>
              <span className="font-bold text-on-background">{formatAmount(item.val, {maximumFractionDigits: 0})}</span>
            </div>
          ))}
          <hr className="border-t border-slate-100"/>
          <div className="flex justify-between items-center text-primary text-body font-bold py-1">
            <span>Gross Earnings</span>
            <span>{formatAmount(details.grossEarnings)}</span>
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-blue-100 rounded-xl overflow-hidden"
      >
        <div className="bg-surface-container-low px-4 py-2">
          <h3 className="text-caption font-bold text-error flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            Deductions
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {details.deductions.map(item => (
            <div key={item.label} className="flex justify-between items-center text-body">
              <span className="text-on-surface-variant font-medium">{item.label}</span>
              <span className="font-bold text-error">-{formatAmount(item.val, {maximumFractionDigits: 0})}</span>
            </div>
          ))}
          <hr className="border-t border-slate-100"/>
          <div className="flex justify-between items-center text-error text-body font-bold py-1">
            <span>Total Deductions</span>
            <span>-{formatAmount(details.totalDeductions)}</span>
          </div>
        </div>
      </motion.section>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-white p-3 rounded-xl border border-blue-50">
          <p className="text-caption font-bold text-secondary uppercase mb-0.5">Emp ID</p>
          <p className="text-body font-bold text-on-background">#{details.employeeId}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-50">
          <p className="text-caption font-bold text-secondary uppercase mb-0.5">Days Payable</p>
          <p className="text-body font-bold text-on-background">{details.daysPayable} Days</p>
        </div>
      </motion.div>

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
              <p className="text-caption font-bold text-primary uppercase tracking-wider mb-2">Notes & Comments</p>
              <p className="text-body text-on-surface-variant font-medium whitespace-pre-wrap leading-relaxed">
                {details.comments}
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </motion.main>
  );
};
