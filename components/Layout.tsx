import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  PackagePlus, 
  UserCheck, 
  Receipt, 
  LogOut, 
  ShoppingBag,
  Menu,
  X,
  Briefcase,
  PieChart,
  Landmark,
  Contact,
  Truck,
  ShieldAlert,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  alert?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, alert, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      alert
        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
        : active 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} className={`relative z-10 ${
      alert
        ? 'text-white'
        : active 
          ? 'text-gold-400' 
          : 'text-slate-400 group-hover:text-slate-700'
    }`} />
    <span className="font-medium text-sm tracking-wide relative z-10 flex-1 text-left">{label}</span>
    {alert && (
        <span className="relative flex h-2.5 w-2.5 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
    )}
  </button>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, auditLogs } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // Calculate active security incidents for Super Admin to alert in sidebar
  const hasActiveIncidents = useMemo(() => {
    if (currentUser?.role !== UserRole.SUPER_ADMIN) return false;
    return auditLogs.some(l => 
        l.status === 'OPEN' && (
          l.action === 'SECURITY_ALERT' || 
          l.action === 'CUSTOMER_MISMATCH' || 
          l.action === 'USER_REMOVED' ||
          l.action === 'BULK_STATUS_CHANGE'
        )
    );
  }, [auditLogs, currentUser]);
  
  if (!currentUser) return <>{children}</>;

  const getMenuItems = () => {
    switch(currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return [
          { label: 'Dashboard', icon: LayoutDashboard, hash: '#dashboard' },
          { label: 'Security Center', icon: ShieldAlert, hash: '#security' }, // New Item
          { label: 'Customer Registry', icon: Contact, hash: '#customers' },
          { label: 'Business Ledger', icon: Landmark, hash: '#ledger' },
          { label: 'Workforce Ops', icon: Briefcase, hash: '#workforce' },
          { label: 'Master Analytics', icon: PieChart, hash: '#analytics' },
          { label: 'Stock Intake', icon: PackagePlus, hash: '#stock-intake' },
          { label: 'Tag Manager', icon: QrCode, hash: '#qr-generator' }, // New Item
          { label: 'Allotment', icon: UserCheck, hash: '#allotment' },
          { label: 'Billing', icon: Receipt, hash: '#billing' },
          { label: 'Delivery', icon: Truck, hash: '#delivery' },
        ];
      case UserRole.QR_MANAGER:
        return [{ label: 'Tag Manager', icon: QrCode, hash: '#qr-generator' }];
      case UserRole.TAG_ENTRY_ADMIN:
        return [{ label: 'Tag Manager', icon: QrCode, hash: '#qr-generator' }];
      case UserRole.TAG_FINALIZER_ADMIN:
        return [{ label: 'Tag Manager', icon: QrCode, hash: '#qr-generator' }];
      case UserRole.STOCK_INTAKE_ADMIN:
        return [{ label: 'Stock Intake', icon: PackagePlus, hash: '#stock-intake' }];
      case UserRole.ALLOTMENT_ADMIN:
        return [{ label: 'Allotment', icon: UserCheck, hash: '#allotment' }];
      case UserRole.BILLING_ADMIN:
        return [
          { label: 'Billing', icon: Receipt, hash: '#billing' },
          { label: 'Customer Registry', icon: Contact, hash: '#customers' }
        ];
      case UserRole.DELIVERY_ADMIN:
        return [{ label: 'Delivery', icon: Truck, hash: '#delivery' }];
      case UserRole.CUSTOMER:
        return [{ label: 'My Vault', icon: ShoppingBag, hash: '#customer-portal' }];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const currentHash = window.location.hash || (menuItems[0]?.hash || '');

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="w-72 fixed h-full z-30 hidden md:flex flex-col p-4">
        <div className="bg-white/80 backdrop-blur-xl h-full rounded-2xl shadow-soft border border-white/50 flex flex-col">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <span className="font-serif font-bold text-gold-400 text-xl">A</span>
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight leading-none">
                    Aurum
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enterprise</p>
                </div>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"></div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  active={currentHash === item.hash}
                  alert={item.label === 'Security Center' && hasActiveIncidents}
                  onClick={() => window.location.hash = item.hash}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-slate-50">
              <div className="bg-slate-50/50 rounded-xl p-3 mb-3 border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-700 font-serif font-bold shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{currentUser.role.split('_')[0]}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="font-serif font-bold text-gold-400">A</span>
            </div>
            <span className="font-serif text-xl font-bold text-slate-900">Aurum</span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
           {mobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-white pt-20 px-4 pb-4 md:hidden flex flex-col"
          >
             <nav className="space-y-2">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    active={currentHash === item.hash}
                    alert={item.label === 'Security Center' && hasActiveIncidents}
                    onClick={() => {
                      window.location.hash = item.hash;
                      setMobileMenuOpen(false);
                    }}
                  />
                ))}
             </nav>
             <div className="mt-auto border-t border-slate-100 pt-4">
               <button 
                 onClick={logout}
                 className="w-full flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-xl text-slate-600 font-bold"
               >
                 <LogOut size={18} /> Sign Out
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-8 lg:p-12 overflow-x-hidden pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};