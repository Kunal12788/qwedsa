import React, { useEffect, useState } from 'react';
import { AppProvider, useAppStore } from './store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { StockIntake } from './pages/StockIntake';
import { Allotment } from './pages/Allotment';
import { Billing } from './pages/Billing';
import { SuperAdmin } from './pages/SuperAdmin';
import { CustomerPortal } from './pages/CustomerPortal';
import { WorkforceManagement } from './pages/WorkforceManagement';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { BusinessLedger } from './pages/BusinessLedger';
import { CustomerManagement } from './pages/CustomerManagement';
import { DeliveryManagement } from './pages/DeliveryManagement';
import { SecurityCenter } from './pages/SecurityCenter';
import { QrCodeGenerator } from './pages/QrCodeGenerator'; // New Import
import { UserRole } from './types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Gem, ShieldCheck, Activity, Globe, Server, Lock } from 'lucide-react';
import { NotificationSystem } from './components/NotificationSystem';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      filter: "blur(10px)",
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[#0B0F19] z-50 flex flex-col items-center justify-center overflow-hidden font-sans"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
       {/* Minimalist Background */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
       <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-950"></div>
       
       {/* Subtle Ambient Light */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/5 rounded-full blur-[150px] animate-pulse-slow"></div>

       {/* Main Content - Centered & Clear */}
       <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-7xl px-6 w-full">
          
          <motion.div variants={itemVariants} className="flex flex-col items-center w-full">
             {/* Logo Mark */}
             <div className="relative w-24 h-24 mb-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center shadow-2xl shadow-black border border-white/5 ring-1 ring-white/10 group">
                <div className="absolute inset-0 bg-gold-500/10 blur-xl rounded-full group-hover:bg-gold-500/20 transition-all duration-1000"></div>
                <span className="font-serif text-5xl text-transparent bg-clip-text bg-gradient-to-br from-gold-300 to-gold-600 font-bold relative z-10">A</span>
             </div>
             
             {/* Brand Name */}
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white tracking-widest uppercase drop-shadow-2xl mb-6 leading-none">
               Aurum <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300">Enterprise</span>
             </h1>
             
             {/* Tagline */}
             <h2 className="text-xl md:text-3xl font-serif text-slate-300 tracking-wide italic leading-relaxed opacity-80 mb-16">
               "Preserving Value & Trust."
             </h2>

             {/* Key Features / Pillars of Trust */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full max-w-5xl border-t border-white/5 pt-12">
                {[
                  { icon: ShieldCheck, label: "AES-256 Encryption", sub: "Bank-Grade Security", color: "text-emerald-400", bg: "group-hover:bg-emerald-500/10", border: "group-hover:border-emerald-500/30" },
                  { icon: Activity, label: "Real-Time Ledger", sub: "Instant Valuation", color: "text-blue-400", bg: "group-hover:bg-blue-500/10", border: "group-hover:border-blue-500/30" },
                  { icon: Globe, label: "Global Compliance", sub: "SOC2 & ISO 27001", color: "text-purple-400", bg: "group-hover:bg-purple-500/10", border: "group-hover:border-purple-500/30" },
                  { icon: Server, label: "99.99% Reliability", sub: "Enterprise Infrastructure", color: "text-gold-400", bg: "group-hover:bg-gold-500/10", border: "group-hover:border-gold-500/30" },
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col items-center group cursor-default transition-all duration-500 hover:-translate-y-1">
                     <div className={`mb-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 ${feature.bg} ${feature.border} transition-colors duration-500 shadow-lg shadow-black/20`}>
                        <feature.icon size={24} className={`${feature.color}`} />
                     </div>
                     <h3 className="text-slate-200 text-xs font-bold uppercase tracking-widest mb-1.5 group-hover:text-white transition-colors">{feature.label}</h3>
                     <p className="text-slate-500 text-[10px] font-medium">{feature.sub}</p>
                  </div>
                ))}
             </div>

          </motion.div>

       </div>

       {/* Elegant Loading Bar at Bottom */}
       <div className="absolute bottom-12 left-0 w-full flex flex-col items-center">
           <div className="flex items-center gap-2 mb-4 opacity-70">
              <Lock size={12} className="text-emerald-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Establishing Secure Connection</span>
           </div>
           <motion.div 
             className="w-64 h-0.5 bg-slate-800 rounded-full overflow-hidden relative"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
           >
              <motion.div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-gold-500 to-emerald-500 w-full"
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              />
           </motion.div>
       </div>
    </motion.div>
  );
};

// Icon wrapper for diamond/gem
const DiamondIcon = (props: any) => <Gem {...props} />;

const AppContent: React.FC = () => {
  const { currentUser } = useAppStore();
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    const hash = currentHash.replace('#', '');
    
    switch (hash) {
      case 'dashboard':
        return currentUser?.role === UserRole.SUPER_ADMIN ? <SuperAdmin /> : <div className="text-slate-400">Access Denied</div>;
      case 'security':
        return currentUser?.role === UserRole.SUPER_ADMIN ? <SecurityCenter /> : <div className="text-slate-400">Access Denied</div>; // New Route
      case 'customers':
        return (currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.BILLING_ADMIN) ? <CustomerManagement /> : <div className="text-slate-400">Access Denied</div>;
      case 'ledger':
        return currentUser?.role === UserRole.SUPER_ADMIN ? <BusinessLedger /> : <div className="text-slate-400">Access Denied</div>;
      case 'workforce':
        return currentUser?.role === UserRole.SUPER_ADMIN ? <WorkforceManagement /> : <div className="text-slate-400">Access Denied</div>;
      case 'analytics':
        return currentUser?.role === UserRole.SUPER_ADMIN ? <AdminAnalytics /> : <div className="text-slate-400">Access Denied</div>;
      case 'stock-intake':
        return (currentUser?.role === UserRole.STOCK_INTAKE_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) ? <StockIntake /> : <div className="text-slate-400">Access Denied</div>;
      case 'allotment':
        return (currentUser?.role === UserRole.ALLOTMENT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) ? <Allotment /> : <div className="text-slate-400">Access Denied</div>;
      case 'billing':
        return (currentUser?.role === UserRole.BILLING_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) ? <Billing /> : <div className="text-slate-400">Access Denied</div>;
      case 'delivery':
        return (currentUser?.role === UserRole.DELIVERY_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) ? <DeliveryManagement /> : <div className="text-slate-400">Access Denied</div>;
      case 'qr-generator':
        return (currentUser?.role === UserRole.QR_MANAGER || currentUser?.role === UserRole.TAG_ENTRY_ADMIN || currentUser?.role === UserRole.TAG_FINALIZER_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) ? <QrCodeGenerator /> : <div className="text-slate-400">Access Denied</div>;
      case 'customer-portal':
        return currentUser?.role === UserRole.CUSTOMER ? <CustomerPortal /> : <div className="text-slate-400">Access Denied</div>;
      default:
        // Default Redirects
        if (currentUser?.role === UserRole.SUPER_ADMIN) return <SuperAdmin />;
        if (currentUser?.role === UserRole.STOCK_INTAKE_ADMIN) return <StockIntake />;
        if (currentUser?.role === UserRole.ALLOTMENT_ADMIN) return <Allotment />;
        if (currentUser?.role === UserRole.BILLING_ADMIN) return <Billing />;
        if (currentUser?.role === UserRole.DELIVERY_ADMIN) return <DeliveryManagement />;
        if (currentUser?.role === UserRole.QR_MANAGER) return <QrCodeGenerator />;
        if (currentUser?.role === UserRole.TAG_ENTRY_ADMIN) return <QrCodeGenerator />;
        if (currentUser?.role === UserRole.TAG_FINALIZER_ADMIN) return <QrCodeGenerator />;
        if (currentUser?.role === UserRole.CUSTOMER) return <CustomerPortal />;
        return <div className="text-white">Page not found</div>;
    }
  };

  return (
    <>
      <NotificationSystem />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : !currentUser ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} // Smooth exit for login when logging in
            transition={{ duration: 1 }}
          >
             <Login />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
             <Layout>
               {renderPage()}
             </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;