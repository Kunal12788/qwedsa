import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Badge } from '../components/UI';
import { Eye, EyeOff, Check, AlertTriangle, ShieldCheck, Lock, UserCog } from 'lucide-react';
import { ProductStatus } from '../types';
import { PURITY_TYPES } from '../constants';

export const CustomerPortal: React.FC = () => {
  const { products, currentUser, customers, changePassword } = useAppStore();
  
  const myCustomerProfile = customers.find(c => c.email === currentUser?.email);
  
  // States for password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  
  // Show ALL items assigned to customer except those still in Admin Stock
  const myInventory = products.filter(p => p.customerId === myCustomerProfile?.id && p.status !== ProductStatus.IN_ADMIN_STOCK);

  const allottedCount = myInventory.filter(p => p.status === ProductStatus.ALLOTTED).length;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setPasswordMessage('Passwords do not match.');
        return;
    }
    if (newPassword.length < 4) {
        setPasswordMessage('Password too short.');
        return;
    }
    
    changePassword(newPassword);
    setPasswordMessage('Password updated successfully.');
    setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMessage('');
        setNewPassword('');
        setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800"></div>
        {/* Decorative Gold Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border-[32px] border-gold-500/10 blur-sm"></div>
        <div className="absolute top-1/2 -right-12 w-32 h-32 rounded-full bg-gold-500/20 blur-2xl"></div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-2 mb-4">
               <ShieldCheck className="text-gold-400" size={24} />
               <span className="text-gold-400 font-bold tracking-widest text-xs uppercase">Secure Personal Vault</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">My Collection</h1>
             <p className="text-slate-300 text-lg leading-relaxed">
               View your allotted inventory and track billing status in real-time.
             </p>
          </div>
          
          <div className="flex gap-8 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gold</p>
               <div className="flex items-baseline">
                 <p className="text-3xl font-serif font-bold text-white">{myCustomerProfile?.totalGoldInventory.toFixed(2)}</p>
                 <span className="text-sm text-gold-500 font-bold ml-1">g</span>
               </div>
             </div>
             <div className="w-px bg-white/10"></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Allotted / Pending Bill</p>
               <p className="text-3xl font-serif font-bold text-white">{allottedCount}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
          {/* Main Inventory Column */}
          <div className="md:col-span-8 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900 border-l-4 border-slate-900 pl-4">Vault Inventory</h2>
            <Card className="p-0 overflow-hidden border-0 shadow-soft">
              {myInventory.length === 0 ? (
                 <div className="p-16 text-center bg-slate-50">
                    <p className="text-slate-400 font-serif text-lg italic">Your vault is currently empty.</p>
                 </div>
              ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                       <tr>
                         <th className="p-6">Item Details</th>
                         <th className="p-6">Purity</th>
                         <th className="p-6">Gold Weight</th>
                         <th className="p-6">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                       {myInventory.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-slate-100">
                                   <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900">{p.type}</p>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-wider">{p.barcodeId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6">
                              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">{p.purity}</span>
                           </td>
                           <td className="p-6">
                              <span className="font-serif text-lg font-bold text-slate-900">{p.goldWeight}</span>
                              <span className="text-xs text-slate-500 ml-1">g</span>
                           </td>
                           <td className="p-6"><Badge status={p.status} /></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              )}
            </Card>
          </div>

          {/* Profile & Security Column */}
          <div className="md:col-span-4 space-y-6">
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCog size={20} className="text-slate-400" /> Account Settings
             </h2>
             <Card title="Security Profile">
                <div className="space-y-6">
                   <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                         {currentUser?.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                         <p className="font-bold text-slate-900 truncate">{currentUser?.name}</p>
                         <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                      </div>
                   </div>

                   {!showPasswordForm ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setShowPasswordForm(true)}
                      >
                         <Lock size={16} /> Change Password
                      </Button>
                   ) : (
                      <form onSubmit={handleChangePassword} className="space-y-3 animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200">
                         <Input 
                           label="New Password" 
                           type="password" 
                           value={newPassword}
                           onChange={e => setNewPassword(e.target.value)}
                           placeholder="New secure password"
                           required
                         />
                         <Input 
                           label="Confirm Password" 
                           type="password" 
                           value={confirmPassword}
                           onChange={e => setConfirmPassword(e.target.value)}
                           placeholder="Repeat password"
                           required
                         />
                         {passwordMessage && (
                            <p className={`text-xs font-bold text-center ${passwordMessage.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
                               {passwordMessage}
                            </p>
                         )}
                         <div className="flex gap-2 pt-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => setShowPasswordForm(false)} className="flex-1">
                               Cancel
                            </Button>
                            <Button type="submit" size="sm" variant="primary" className="flex-1">
                               Update
                            </Button>
                         </div>
                      </form>
                   )}
                </div>
             </Card>
          </div>
      </div>
    </div>
  );
};