import React from 'react';

export const SettingsCard: React.FC = () => (
  <section className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden">
    <div className="bg-surface-container-low px-6 py-4 border-b border-[#D1E1F5]">
      <h2 className="text-[20px] font-semibold text-primary">Preferences</h2>
    </div>
    <div className="p-6 space-y-6">
      {[
        { icon: "mail", title: "Email Notifications", desc: "New Salary Slip Available", checked: false },
        { icon: "smartphone", title: "Push Notifications", desc: "Updates & Announcements", checked: false },
      ].map((setting, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined">{setting.icon}</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-on-surface">{setting.title}</p>
              <p className="text-[12px] text-secondary">{setting.desc}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={setting.checked} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-container after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 after:ease-in-out transition-all duration-200 ease-in-out"></div>
          </label>
        </div>
      ))}
    </div>
  </section>
);
