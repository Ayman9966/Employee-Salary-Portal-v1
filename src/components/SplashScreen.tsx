import React from 'react';
import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#f9f9ff] flex flex-col items-center justify-center"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Background Pulse */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-32 h-32 bg-primary rounded-full blur-2xl"
        />
        
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="relative w-20 h-20 bg-primary rounded-[22px] flex items-center justify-center shadow-2xl shadow-primary/30"
        >
          <span className="material-symbols-outlined text-white text-[40px]">payments</span>
        </motion.div>

        {/* App Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 text-center"
        >
          <h1 className="text-2xl font-black text-[#041b3c] tracking-tight">
            EMPLOYEE <span className="text-primary tracking-widest">PORTAL</span>
          </h1>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">
            Secure Payroll Solutions
          </p>
        </motion.div>

        {/* Loading Indicator */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
              className="w-1.5 h-1.5 bg-primary rounded-full"
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="fixed bottom-12 text-[10px] font-black text-slate-300 uppercase tracking-widest"
      >
        © 2026 Enterprise Solutions
      </motion.div>
    </motion.div>
  );
}
