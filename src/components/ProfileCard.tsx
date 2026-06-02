import React, { useEffect, useState } from 'react';
import { fetchProfile, UserProfile, getFromCache } from '../services/dataService';
import { ProfileSkeleton } from './Skeleton';
import { motion } from 'motion/react';

export const ProfileCard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(getFromCache<UserProfile>('profile'));
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    fetchProfile().then(fresh => {
      if (fresh) setProfile(fresh);
      setLoading(false);
    });
  }, []);

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <section className="bg-white rounded-xl border border-[#D1E1F5] p-6 text-center text-secondary">
        No profile information found.
      </section>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden"
    >
      <div className="bg-surface-container-low px-6 py-4 border-b border-[#D1E1F5]">
        <h2 className="text-[20px] font-semibold text-primary">Employee Information</h2>
      </div>
      <div className="p-6 space-y-4">
        {[
          { label: "Full Name", value: profile.name },
          { label: "Employee ID", value: profile.employeeId },
          { label: "Department", value: profile.department },
          { label: "Joining Date", value: profile.joiningDate },
        ].map((item, index) => (
          <div key={index} className={`flex justify-between items-center ${index !== 3 ? 'border-b border-[#F0F0F0] pb-3' : ''}`}>
            <span className="text-[12px] font-bold text-secondary uppercase tracking-wider">{item.label}</span>
            <span className="text-[14px] font-semibold text-on-surface">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
};
