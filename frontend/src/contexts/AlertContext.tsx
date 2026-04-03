'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomAlertProps {
  isOpen: boolean;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose: () => void;
}

function CustomAlert({ isOpen, message, type = 'error', onClose }: CustomAlertProps) {
  if (!isOpen) return null;

  const config = {
    error: { icon: '✖', color: 'var(--accent-red)' },
    warning: { icon: '⚠', color: 'var(--accent-amber)' },
    info: { icon: 'ℹ', color: 'var(--accent-cyan)' }
  }[type];

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: 'rgba(5, 13, 26, 0.85)', 
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backdropFilter: 'blur(12px)', transition: 'all 0.3s ease'
    }}>
       <div style={{ 
         background: 'var(--bg-surface)', border: `1px solid rgba(255, 255, 255, 0.1)`, 
         padding: '40px 48px', borderRadius: 8, display: 'flex', flexDirection: 'column', 
         alignItems: 'center', gap: 24, boxShadow: `0 24px 64px rgba(0,0,0,0.4)`,
         animation: 'appear 0.3s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: 480, textAlign: 'center'
       }}>
          <style>{`
            @keyframes appear {
              0% { opacity: 0; transform: scale(0.95) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${config.color}`, color: config.color, fontSize: 32 }}>
            {config.icon}
          </div>
          <div>
             <h2 className="font-display" style={{ fontSize: 24, color: 'white', marginBottom: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
               {type === 'error' ? 'SYSTEM ERROR' : type === 'warning' ? 'SYSTEM WARNING' : 'SYSTEM NOTICE'}
             </h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{message}</p>
             
             <button 
               onClick={onClose}
               style={{ 
                 background: 'transparent', color: config.color, border: `1px solid ${config.color}`, 
                 padding: '10px 32px', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', 
                 cursor: 'pointer', borderRadius: 2, transition: 'background 0.2s' 
               }}
             >
               ACKNOWLEDGE
             </button>
          </div>
       </div>
    </div>
  );
}

interface AlertContextType {
  showAlert: (message: string, type?: 'error' | 'warning' | 'info') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'error' | 'warning' | 'info'>('error');

  const showAlert = (msg: string, alertType: 'error' | 'warning' | 'info' = 'error') => {
    setMessage(msg);
    setType(alertType);
    setIsOpen(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert isOpen={isOpen} message={message} type={type} onClose={() => setIsOpen(false)} />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
