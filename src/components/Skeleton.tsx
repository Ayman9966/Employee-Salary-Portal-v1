import { motion } from 'motion/react';
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular' 
}) => {
  const baseClasses = "bg-slate-200 animate-pulse";
  const variantClasses = {
    text: "rounded h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-blue-50 p-6 space-y-4">
    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="30%" />
    </div>
    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="30%" />
    </div>
    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="30%" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="30%" />
    </div>
  </div>
);

export const HistoryItemSkeleton: React.FC = () => (
  <div className="w-full bg-white border border-blue-50 rounded-xl p-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Skeleton variant="rectangular" width={48} height={48} className="rounded-lg" />
      <div className="space-y-2">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={120} />
      </div>
    </div>
    <div className="text-right space-y-2">
      <Skeleton variant="text" width={60} className="ml-auto" />
      <Skeleton variant="text" width={40} className="ml-auto" />
    </div>
  </div>
);

export const PayslipSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-white border border-blue-50 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-1/2">
          <Skeleton variant="text" height={12} width="40%" />
          <Skeleton variant="text" height={24} width="80%" />
        </div>
        <Skeleton variant="rectangular" width={70} height={20} className="rounded-full" />
      </div>
      <Skeleton variant="text" height={40} width="60%" />
      <Skeleton variant="text" height={16} width="50%" />
    </div>
    <div className="bg-white border border-blue-50 rounded-xl overflow-hidden">
      <Skeleton variant="rectangular" height={32} className="rounded-none" />
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="20%" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
