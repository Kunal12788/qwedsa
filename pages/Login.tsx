import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { Loader2, ArrowRight, ShieldCheck, Mail, Lock, ChevronDown, Globe, Server, CheckCircle2, ScanFace, KeyRound, Activity, FileKey, Eye, EyeOff, ArrowLeft, Smartphone } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const { login, users, logAction, settings, recordUnauthorizedAttempt } = useAppStore(); // Get users to pre-validate email & settings for Working Time
  const [authStep, setAuthStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Security States
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);
  const [securityCheck, setSecurityCheck] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // OTP Input Ref
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Helper to detect device
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile Device';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS Device';
    if (/android/i.test(ua)) return 'Android Device';
    if (/win/i.test(ua)) return 'Windows PC';
    if (/mac/i.test(ua)) return 'macOS';
    return 'Unknown Device';
  };

  // Simulate a security handshake animation on load
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityCheck(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Focus OTP input when switching steps
  useEffect(() => {
    if (authStep === 'OTP' && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [authStep]);

  // Step 1: Validate Credentials & Check Working Hours
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate API Check
    setTimeout(() => {
      const userExists = users.find(u => u.email === email);
      
      // REAL SECURITY CHECK: Compare entered password strictly against stored user password
      const isValidUser = userExists && userExists.password === password;

      if (isValidUser) {
        // --- WORKING TIME CHECK ---
        // If user is NOT Super Admin and NOT Customer, check if working hours are active
        if (userExists.role !== UserRole.SUPER_ADMIN && userExists.role !== UserRole.CUSTOMER) {
            if (!settings.isWorkingHoursActive) {
                // RECORD UNAUTHORIZED ATTEMPT
                recordUnauthorizedAttempt(userExists.email, getDeviceType());
                
                setLoading(false);
                setError('Operations Closed: Security Incident Reported to Command Center.');
                return; // Stop here, do not proceed to OTP
            }
        }

        setLoading(false);
        setAuthStep('OTP');
      } else {
        setLoading(false);
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        
        if (newFailCount >= 2) {
           // THREAT DETECTED
           const device = getDeviceType();
           logAction('SECURITY_ALERT', `Multiple failed login attempts detected for ${email} from ${device}. Possible brute force.`);
           setError('Security Lockout: Suspicious activity reported to Super Admin.');
        } else {
           setError('Access Denied: Invalid Enterprise ID or Passkey.');
        }
      }
    }, 1000); 
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate Network Verification
    setTimeout(() => {
      if (otp === '7890') { // Hardcoded 4-digit special code
        const device = getDeviceType();
        // IMPORTANT: Pass the `password` state to login function to validate against store again
        const result = login(email, device, password);
        if (!result.success) {
          setError(result.message || 'Authentication Failed.');
          setLoading(false);
        }
        // If success, the App component will unmount Login, so no need to set loading false
      } else {
        setError('Security Violation: Invalid One-Time Password.');
        setLoading(false);
        setOtp('');
      }
    }, 1200);
  };

  const fillDemo = (email: string) => {
    setEmail(email);
    // Find the user to autofill the correct CURRENT password
    const user = users.find(u => u.email === email);
    if (user) {
        setPassword(user.password || 'password123');
    } else {
        setPassword('password123'); 
    }
  };

  const SecurityFeature = ({ icon: Icon, title, desc, color }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
       <div className={`p-3 rounded-lg bg-slate-900/50 ${color}`}>
          <Icon size={20} />
       </div>
       <div>
          <h4 className="text-sm font-bold text-slate-200">{title}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
       </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#0B0F19] font-sans overflow-hidden text-slate-200 selection:bg-gold-500/30 selection:text-gold-200 relative">
      
      {/* Background Ambience - Cyber/Vault feel */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-gold-600/5 rounded-full blur-[100px]"></div>
         
         {/* Subtle Grid Lines */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto flex min-h-screen items-center justify-center relative z-10 lg:gap-24 px-6 py-12">
        
        {/* Left Panel - Trust & Security Features (Desktop Only) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center max-w-lg w-full"
        >
           {/* Brand Header */}
           <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center shadow-xl shadow-gold-900/5">
                    <span className="font-serif font-bold text-2xl text-gold-500">A</span>
                 </div>
                 <h1 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 tracking-wide">
                    Aurum Enterprise
                 </h1>
              </div>
              <h2 className="text-5xl font-serif font-medium leading-[1.1] text-white mb-6">
                 Secure Access to <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300">Global Assets.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-gold-500/30 pl-6">
                 Welcome to the centralized vault for inventory management, billing, and logistics.
              </p>
           </div>

           {/* Security Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SecurityFeature 
                icon={ShieldCheck} 
                color="text-emerald-400"
                title="Bank-Grade Security" 
                desc="AES-256 encryption for all data in transit and at rest."
              />
              <SecurityFeature 
                icon={Globe} 
                color="text-blue-400"
                title="Global Compliance" 
                desc="ISO 27001 & SOC2 certified infrastructure."
              />
              <SecurityFeature 
                icon={Activity} 
                color="text-indigo-400"
                title="Real-Time Audit" 
                desc="Immutable ledger tracking every transaction."
              />
              <SecurityFeature 
                icon={FileKey} 
                color="text-gold-400"
                title="Role-Based Access" 
                desc="Zero-trust architecture with strict privilege separation."
              />
           </div>

           {/* Live Status Footer */}
           <div className="mt-12 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <span>System Operational</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                 <Server size={12} />
                 <span>Node: Mumbai_Secure_01</span>
              </div>
           </div>
        </motion.div>

        {/* Right Panel - Login Box */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2, duration: 0.5 }}
           className="w-full max-w-[460px]"
        >
           {/* Card Container */}
           <div className="bg-[#111625]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group h-[620px] flex flex-col">
              
              {/* Top Gold Line */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold-600 to-transparent opacity-60 shrink-0"></div>

              <div className="p-8 md:p-10 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                 
                 {/* Mobile Brand */}
                 <div className="lg:hidden flex justify-center mb-6 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-lg">
                       <span className="font-serif font-bold text-3xl text-gold-500">A</span>
                    </div>
                 </div>

                 {/* Header & Handshake */}
                 <div className="space-y-8 shrink-0">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-serif font-semibold flex items-center justify-center gap-2">
                           {authStep === 'CREDENTIALS' ? <Lock size={20} className="text-gold-500" /> : <ShieldCheck size={20} className="text-emerald-500" />}
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300">
                             {authStep === 'CREDENTIALS' ? 'Identity Verification' : 'Two-Factor Auth'}
                           </span>
                        </h3>
                        <p className="text-slate-400 text-sm">
                           {authStep === 'CREDENTIALS' 
                             ? 'Please authenticate to decrypt your dashboard.' 
                             : `Enter the 4-digit code sent to ${email}`}
                        </p>
                    </div>

                    {/* Security Pre-check (Handshake) */}
                    <div className="relative">
                        {securityCheck < 100 ? (
                            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                     <Loader2 size={10} className="animate-spin text-gold-500" /> Establishing Secure Tunnel
                                  </span>
                                  <span className="text-[10px] font-mono text-gold-500">{securityCheck}%</span>
                               </div>
                               <div className="h-1 bg-slate-800 rounded-full w-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-75 ease-out" style={{ width: `${securityCheck}%` }}></div>
                               </div>
                            </div>
                        ) : (
                            <motion.div 
                               initial={{ opacity: 0, y: 5 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="bg-emerald-500/10 rounded-lg p-3 flex items-center justify-center gap-2 border border-emerald-500/20 shadow-inner"
                            >
                               <ShieldCheck size={14} className="text-emerald-400" />
                               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Encrypted Channel Established</span>
                            </motion.div>
                        )}
                    </div>
                 </div>

                 {/* ANIMATED FORM AREA */}
                 <div className="mt-8 flex-1 relative">
                    <AnimatePresence mode="wait">
                       {authStep === 'CREDENTIALS' ? (
                          <motion.form 
                             key="credentials"
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -20 }}
                             transition={{ duration: 0.3 }}
                             onSubmit={handleCredentialsSubmit} 
                             className="space-y-6"
                          >
                             
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                                   <span>Enterprise ID</span>
                                   {activeField === 'email' && <span className="text-gold-500 animate-pulse">Scanning...</span>}
                                </label>
                                <div className={`relative group transition-all duration-300 ${activeField === 'email' ? 'scale-[1.02]' : ''}`}>
                                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <Mail className={`h-5 w-5 transition-colors ${activeField === 'email' ? 'text-gold-500' : 'text-slate-500'}`} />
                                   </div>
                                   <input 
                                     type="email" 
                                     value={email}
                                     onChange={(e) => setEmail(e.target.value)}
                                     onFocus={() => setActiveField('email')}
                                     onBlur={() => setActiveField(null)}
                                     className="block w-full pl-12 pr-10 py-4 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all font-medium text-sm shadow-inner"
                                     placeholder="username@aurum.com"
                                     required
                                   />
                                   <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                      <ScanFace className={`h-4 w-4 transition-all duration-500 ${activeField === 'email' ? 'text-gold-500 opacity-100 scale-110' : 'text-slate-600 opacity-50'}`} />
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                                   <span>Passkey</span>
                                   {activeField === 'password' && <span className="text-gold-500 animate-pulse">Verifying...</span>}
                                </label>
                                <div className={`relative group transition-all duration-300 ${activeField === 'password' ? 'scale-[1.02]' : ''}`}>
                                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <KeyRound className={`h-5 w-5 transition-colors ${activeField === 'password' ? 'text-gold-500' : 'text-slate-500'}`} />
                                   </div>
                                   <input 
                                     type={showPassword ? "text" : "password"}
                                     value={password}
                                     onChange={(e) => setPassword(e.target.value)}
                                     className="block w-full pl-12 pr-12 py-4 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all font-medium text-sm shadow-inner"
                                     placeholder="••••••••••••••••"
                                     onFocus={() => setActiveField('password')}
                                     onBlur={() => setActiveField(null)}
                                     required
                                   />
                                   <button 
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-gold-500 transition-colors focus:outline-none"
                                      tabIndex={-1}
                                   >
                                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                   </button>
                                </div>
                             </div>

                             <button 
                               type="submit" 
                               disabled={loading || securityCheck < 100}
                               className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold tracking-wide rounded-xl shadow-lg shadow-gold-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-0"
                             >
                               {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                 <>
                                   <span className="relative z-10">Proceed to Verification</span>
                                   <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={18} />
                                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                                 </>
                               )}
                             </button>

                             {/* Quick Access Drawer */}
                             <div className="border-t border-white/5 pt-6">
                                <button 
                                  type="button"
                                  onClick={() => setShowDemoProfiles(!showDemoProfiles)}
                                  className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors group p-2 rounded-lg hover:bg-white/5"
                                >
                                  <div className="flex items-center gap-2">
                                     <div className="w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center bg-slate-800 group-hover:border-gold-500 group-hover:text-gold-500 transition-colors">
                                       <Eye size={12} />
                                     </div>
                                    <span>Quick Access Profiles</span>
                                  </div>
                                  <ChevronDown size={14} className={`transition-transform duration-300 ${showDemoProfiles ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                  {showDemoProfiles && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
                                         {MOCK_USERS.map((user, idx) => (
                                           <button
                                             key={idx}
                                             type="button"
                                             onClick={() => fillDemo(user.email)}
                                             className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800 hover:border-gold-500/30 transition-all group/card text-left relative overflow-hidden"
                                           >
                                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs group-hover/card:bg-gold-500 group-hover/card:text-black transition-colors border border-white/10 group-hover/card:border-gold-500 relative z-10">
                                                {user.name.charAt(0)}
                                              </div>
                                              <div className="min-w-0 relative z-10">
                                                 <span className="block text-xs font-bold text-slate-300 group-hover/card:text-white truncate">
                                                   {user.role === 'CUSTOMER' ? 'Client Vault' : user.role.split('_')[0]}
                                                 </span>
                                                 <span className="block text-[10px] text-slate-500 group-hover/card:text-gold-400 transition-colors truncate">
                                                   {user.email}
                                                 </span>
                                              </div>
                                              <div className="ml-auto opacity-0 group-hover/card:opacity-100 transition-opacity relative z-10">
                                                 <CheckCircle2 size={14} className="text-gold-500" />
                                              </div>
                                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-700"></div>
                                           </button>
                                         ))}
                                       </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                             </div>
                          </motion.form>
                       ) : (
                          <motion.form 
                             key="otp"
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: 20 }}
                             transition={{ duration: 0.3 }}
                             onSubmit={handleOtpVerify}
                             className="space-y-6"
                          >
                             <div className="text-center pb-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4 relative">
                                   <div className="absolute inset-0 border border-gold-500/30 rounded-full animate-ping opacity-20"></div>
                                   <Smartphone className="text-gold-400" size={32} />
                                </div>
                                <p className="text-xs text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                                  A secure 4-digit numeric code has been sent to your registered device. <span className="text-slate-400 italic">(Demo: Use 7890)</span>
                                </p>
                             </div>

                             <div className="space-y-4">
                                <div className="relative group">
                                   <input 
                                     ref={otpInputRef}
                                     type="text" 
                                     maxLength={4}
                                     value={otp}
                                     onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setOtp(val);
                                     }}
                                     className="block w-full py-4 bg-[#0B0F19] border border-slate-700 rounded-xl text-white text-center text-3xl font-mono tracking-[1em] focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all shadow-inner"
                                     placeholder="0000"
                                     autoComplete="off"
                                   />
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                      <div className="w-px h-6 bg-slate-700 mx-[14px]"></div>
                                      <div className="w-px h-6 bg-slate-700 mx-[14px]"></div>
                                      <div className="w-px h-6 bg-slate-700 mx-[14px]"></div>
                                   </div>
                                </div>
                             </div>

                             <div className="flex gap-3">
                                <button 
                                  type="button"
                                  onClick={() => {
                                     setAuthStep('CREDENTIALS');
                                     setOtp('');
                                     setError('');
                                  }}
                                  className="px-4 py-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                   <ArrowLeft size={20} />
                                </button>
                                <button 
                                  type="submit" 
                                  disabled={loading || otp.length !== 4}
                                  className="flex-1 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold tracking-wide rounded-xl shadow-lg shadow-gold-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-0"
                                >
                                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>
                                      <span className="relative z-10">Verify & Access</span>
                                      <ShieldCheck className="relative z-10" size={18} />
                                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                                    </>
                                  )}
                                </button>
                             </div>
                             
                             <div className="text-center">
                                <button type="button" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors">
                                   Resend Code
                                </button>
                             </div>
                          </motion.form>
                       )}
                    </AnimatePresence>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        className="bg-red-500/10 text-red-400 text-xs px-4 py-3 rounded-lg border border-red-500/20 flex items-center gap-3"
                      >
                         <ShieldCheck size={16} className="shrink-0" />
                         <span>{error}</span>
                      </motion.div>
                    )}
                 </div>
              </div>
              
              {/* Card Footer */}
              <div className="bg-[#0B0F19]/50 p-4 text-center border-t border-white/5 flex justify-center gap-6 shrink-0">
                 <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity" title="Service Organization Control 2">
                    <ShieldCheck size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">SOC2 Type II</span>
                 </div>
                 <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity" title="Secure Sockets Layer">
                    <Lock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">256-bit SSL</span>
                 </div>
              </div>
           </div>
           
           <div className="mt-8 text-center">
             <p className="text-[10px] text-slate-600">
               &copy; {new Date().getFullYear()} Aurum Enterprise Systems. All rights reserved.
             </p>
           </div>
        </motion.div>
      </div>
    </div>
  );
};