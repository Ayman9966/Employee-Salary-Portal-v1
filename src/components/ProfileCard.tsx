import React, { useEffect, useState } from 'react';
import { fetchProfile, UserProfile, getFromCache } from '../services/dataService';
import { ProfileSkeleton } from './Skeleton';
import { motion } from 'motion/react';

interface ProfileCardProps {
  lang?: 'en' | 'ar';
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ lang = 'en' }) => {
  const [profile, setProfile] = useState<UserProfile | null>(getFromCache<UserProfile>('profile'));
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    fetchProfile().then(fresh => {
      if (fresh) setProfile(fresh);
      setLoading(false);
    });
  }, []);

  const translations = {
    en: {
      fullName: "Full Name",
      jobTitle: "Job Title",
      employeeId: "Employee ID",
      department: "Department",
      joiningDate: "Joining Date",
      noProfile: "No profile information found.",
      fallbackTitle: "Standard Employee"
    },
    ar: {
      fullName: "الاسم بالكامل",
      jobTitle: "المسمى الوظيفي",
      employeeId: "الرقم الوظيفي",
      department: "القسم / الإدارة",
      joiningDate: "تاريخ الانضمام",
      noProfile: "لم يتم العثور على معلومات الملف الشخصي.",
      fallbackTitle: "موظف رسمي"
    }
  };

  const t = translations[lang];

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <section className="bg-white rounded-xl border border-[#D1E1F5] p-6 text-center text-secondary">
        {t.noProfile}
      </section>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden shadow-sm"
    >
      <div className="bg-[#fcfcff] px-6 py-5 border-b border-[#D1E1F5] flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-lg uppercase shadow-inner">
          {profile.name ? profile.name.charAt(0) : 'E'}
        </div>
        <div>
          <h2 className="text-[18px] font-extrabold text-on-background leading-tight">{profile.name}</h2>
          <p className="text-[11px] font-black text-primary uppercase tracking-wider mt-0.5">{profile.title || t.fallbackTitle}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {[
          { label: t.fullName, value: profile.name },
          { label: t.jobTitle, value: profile.title || t.fallbackTitle },
          { label: t.employeeId, value: profile.employeeId },
          { label: t.department, value: profile.department },
          { label: t.joiningDate, value: profile.joiningDate },
        ].map((item, index) => (
          <div key={index} className={`flex justify-between items-center ${index !== 4 ? 'border-b border-slate-100 pb-3' : ''}`}>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{item.label}</span>
            <span className="text-[13px] sm:text-[14px] font-semibold text-on-surface">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
};
