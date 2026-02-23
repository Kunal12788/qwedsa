
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Badge } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { UserRole, ProductStatus, User } from '../types';
import { Users, TrendingUp, Scale, Package, Calendar, Activity, ChevronRight, FileText } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const { users, products, auditLogs, billingRecords } = useAppStore();
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const activeAdmins = users.filter(u => u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.CUSTOMER && u.verified);

  // Helper to extract numeric weight from log details if possible (e.g. for Gold Collection)
  const extractWeightFromLog = (details: string): number => {
    const match = details.match(/(\d+(\.\d+)?)g/);
    return match ? parseFloat(match[1]) : 0;
  };

  // --- Aggregated Stats Calculation ---
  const adminStats = useMemo(() => {
    return activeAdmins.map(admin => {
      let totalItems = 0;
      let totalWeight = 0;

      const myLogs = auditLogs.filter(l => l.performedBy === admin.name);
      
      if (admin.role === UserRole.STOCK_INTAKE_ADMIN) {
        myLogs.filter(l => l.action === 'STOCK_INTAKE').forEach(l => {
          totalItems++;
          totalWeight += extractWeightFromLog(l.details);
        });
      } else if (admin.role === UserRole.ALLOTMENT_ADMIN) {
        const myAllotments = products.filter(p => p.allottedBy === admin.name);
        totalItems = myAllotments.length;
        totalWeight = myAllotments.reduce((sum, p) => sum + p.goldWeight, 0);
      } else if (admin.role === UserRole.BILLING_ADMIN) {
         // Count bills created (Transactions)
         const myBillLogs = myLogs.filter(l => l.action === 'BILLING_CREATE');
         totalItems += myBillLogs.length;

         // Also count gold recovered actions
         const myGoldLogs = myLogs.filter(l => l.action === 'GOLD_RECEIVED');
         
         myGoldLogs.forEach(l => {
           // Billing Admin gets credit for recovering gold too
           totalWeight += extractWeightFromLog(l.details);
         });
      }

      return {
        ...admin,
        totalItems,
        totalWeight,
        logCount: myLogs.length,
        lastActive: myLogs.length > 0 ? myLogs[0].timestamp : null
      };
    });
  }, [activeAdmins, products, auditLogs, billingRecords]);

  const selectedAdmin = selectedAdminId ? adminStats.find(a => a.id === selectedAdminId) : null;
  const selectedAdminLogs = selectedAdmin ? auditLogs.filter(l => l.performedBy === selectedAdmin.name) : [];

  const chartData = adminStats.map(a => ({
    name: a.name.split(' ')[0],
    Items: a.totalItems,
    Weight: a.totalWeight
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Master Analytics</h2>
            <p className="text-slate-500 mt-1">Comprehensive data intelligence on all administrative operations.</p>
         </div>
      </div>

      {/* High Level Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card title="Operational Output (Units)" className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="Items" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Gold Weight Processed (g)" className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="Weight" fill="#d97706" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">Admin Roster</h3>
          </div>
          <div className="space-y-3">
            {adminStats.map(admin => (
              <button
                key={admin.id}
                onClick={() => setSelectedAdminId(admin.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                  selectedAdminId === admin.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      selectedAdminId === admin.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${selectedAdminId === admin.id ? 'text-white' : 'text-slate-900'}`}>{admin.name}</p>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${selectedAdminId === admin.id ? 'text-slate-400' : 'text-slate-400'}`}>
                        {admin.role.replace('_ADMIN', '').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${selectedAdminId === admin.id ? 'text-gold-400' : 'text-slate-300'}`} />
                </div>
                
                {/* Mini Stats in card */}
                <div className="mt-4 flex gap-4 text-xs relative z-10">
                   <div>
                     <span className={`block opacity-60 ${selectedAdminId === admin.id ? 'text-slate-300' : 'text-slate-400'}`}>Items</span>
                     <span className="font-bold text-lg">{admin.totalItems}</span>
                   </div>
                   <div>
                     <span className={`block opacity-60 ${selectedAdminId === admin.id ? 'text-slate-300' : 'text-slate-400'}`}>Weight</span>
                     <span className="font-bold text-lg">{admin.totalWeight.toFixed(1)}g</span>
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8">
           {selectedAdmin ? (
             <div className="space-y-6 animate-fade-in">
                {/* Header Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 mb-2 text-indigo-600">
                       <Package size={18} />
                       <span className="text-xs font-bold uppercase tracking-widest">Total Output</span>
                     </div>
                     <p className="text-3xl font-serif font-bold text-slate-900">{selectedAdmin.totalItems}</p>
                     <p className="text-xs text-slate-400 mt-1">Processed Units</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 mb-2 text-gold-600">
                       <Scale size={18} />
                       <span className="text-xs font-bold uppercase tracking-widest">Mass Handled</span>
                     </div>
                     <p className="text-3xl font-serif font-bold text-slate-900">{selectedAdmin.totalWeight.toFixed(2)}</p>
                     <p className="text-xs text-slate-400 mt-1">Grams of Gold</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 mb-2 text-emerald-600">
                       <Activity size={18} />
                       <span className="text-xs font-bold uppercase tracking-widest">System Events</span>
                     </div>
                     <p className="text-3xl font-serif font-bold text-slate-900">{selectedAdmin.logCount}</p>
                     <p className="text-xs text-slate-400 mt-1">Audit Log Entries</p>
                  </div>
                </div>

                {/* Detailed Logs */}
                <Card title="Operational Dossier" className="min-h-[500px]">
                   <div className="overflow-hidden rounded-xl border border-slate-100">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                         <tr>
                           <th className="p-4">Timestamp</th>
                           <th className="p-4">Action Type</th>
                           <th className="p-4">Detailed Description</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {selectedAdminLogs.length === 0 ? (
                           <tr>
                             <td colSpan={3} className="p-8 text-center text-slate-400 italic">No activity recorded for this administrator.</td>
                           </tr>
                         ) : (
                           selectedAdminLogs.map(log => (
                             <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="p-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                 {new Date(log.timestamp).toLocaleString()}
                               </td>
                               <td className="p-4">
                                 <Badge status={log.action} />
                               </td>
                               <td className="p-4 text-slate-700 max-w-md truncate">
                                 {log.details}
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                </Card>
             </div>
           ) : (
             <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
                <Users size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-lg">Select an Administrator</p>
                <p className="text-sm">Click on an admin from the roster to view their full operational dossier.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
