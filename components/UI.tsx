import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={`bg-white/80 backdrop-blur-sm border border-white/50 shadow-soft rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center mb-6">
        {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </motion.div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary: "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 focus:ring-slate-900",
    gold: "bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/30 focus:ring-gold-500",
    secondary: "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 shadow-sm focus:ring-slate-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-200",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-500",
    outline: "border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 bg-transparent focus:ring-slate-200",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <input
      className={`bg-white border ${error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200 focus:border-indigo-500'} text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-sm ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 font-medium ml-1 animate-pulse">{error}</span>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, children, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative">
      <select
        className={`w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer shadow-sm ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl pointer-events-auto border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur z-10">
              <h2 className="text-xl font-serif font-bold text-slate-900">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Badge ---
export const Badge: React.FC<{ status: string }> = ({ status }) => {
  let style = "bg-slate-100 text-slate-600 border-slate-200";
  switch (status) {
    case 'IN_ADMIN_STOCK': style = "bg-blue-50 text-blue-700 border-blue-200"; break;
    case 'ALLOTTED': style = "bg-amber-50 text-amber-700 border-amber-200"; break;
    case 'CONFIRMED_BY_CUSTOMER': style = "bg-emerald-50 text-emerald-700 border-emerald-200"; break;
    case 'BILLED': style = "bg-purple-50 text-purple-700 border-purple-200"; break;
    case 'COMPLETED': style = "bg-slate-800 text-white border-slate-800"; break;
    case 'MISMATCH': style = "bg-red-50 text-red-700 border-red-200"; break;
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};