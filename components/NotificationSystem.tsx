import React from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className="pointer-events-auto w-80 bg-white/90 backdrop-blur-md border border-white/50 shadow-lg rounded-xl overflow-hidden flex items-start p-4 gap-3"
          >
            <div className={`mt-0.5 shrink-0 ${
              notification.type === 'success' ? 'text-emerald-500' :
              notification.type === 'error' ? 'text-red-500' :
              notification.type === 'warning' ? 'text-amber-500' :
              'text-blue-500'
            }`}>
              {notification.type === 'success' && <CheckCircle size={20} />}
              {notification.type === 'error' && <AlertOctagon size={20} />}
              {notification.type === 'warning' && <AlertTriangle size={20} />}
              {notification.type === 'info' && <Info size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-bold ${
                 notification.type === 'success' ? 'text-emerald-700' :
                 notification.type === 'error' ? 'text-red-700' :
                 notification.type === 'warning' ? 'text-amber-700' :
                 'text-blue-700'
              }`}>
                {notification.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {notification.message}
              </p>
            </div>

            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
