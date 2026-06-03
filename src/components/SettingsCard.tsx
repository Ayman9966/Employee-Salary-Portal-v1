import React, { useState } from 'react';

interface SettingsCardProps {
  lang?: 'en' | 'ar';
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ lang = 'en' }) => {
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('pref_email_notifications') !== 'false'; // Default to true
  });
  
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('pref_push_notifications') === 'true'; // Default to false
  });

  const handleEmailToggle = () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    localStorage.setItem('pref_email_notifications', String(newVal));
  };

  const handlePushToggle = () => {
    const newVal = !pushNotifications;
    setPushNotifications(newVal);
    localStorage.setItem('pref_push_notifications', String(newVal));
  };

  const translations = {
    en: {
      preferences: "Preferences",
      emailTitle: "Email Notifications",
      emailDesc: "New Salary Slip Available",
      pushTitle: "Push Notifications",
      pushDesc: "Updates & Announcements"
    },
    ar: {
      preferences: "تفضيلاتك وإشعاراتك",
      emailTitle: "تنبيهات البريد الإلكتروني",
      emailDesc: "إشعار عند توفر قسيمة راتب جديدة تلقائياً",
      pushTitle: "الإشعارات الفورية (Push)",
      pushDesc: "الحصول على التحديثات والمستجدات فوراً"
    }
  };

  const t = translations[lang];

  return (
    <section className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden shadow-sm">
      <div className="bg-[#fcfcff] px-6 py-4 border-b border-[#D1E1F5]">
        <h2 className="text-[17px] sm:text-[18px] font-extrabold text-primary">{t.preferences}</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Email notifications */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary border border-blue-100/50">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-on-surface">{t.emailTitle}</p>
              <p className="text-[11px] text-secondary leading-normal">{t.emailDesc}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={emailNotifications} 
              onChange={handleEmailToggle} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 after:ease-in-out transition-all duration-200 ease-in-out"></div>
          </label>
        </div>

        {/* Push notifications */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-155">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary border border-blue-100/50">
              <span className="material-symbols-outlined">smartphone</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-on-surface">{t.pushTitle}</p>
              <p className="text-[11px] text-secondary leading-normal">{t.pushDesc}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={pushNotifications} 
              onChange={handlePushToggle} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 after:ease-in-out transition-all duration-200 ease-in-out"></div>
          </label>
        </div>
      </div>
    </section>
  );
};
