
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Badge } from '../components/UI';
import { ShieldAlert, CheckCircle, Search, AlertTriangle, User, Calendar, MessageSquare, History, Laptop, Smartphone, Monitor } from 'lucide-react';
import { UserRole } from '../types';

export const SecurityCenter: React.FC = () => {
  const { auditLogs, resolveIncident, users } = useAppStore();
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED' | 'ACCESS'>('OPEN');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs for relevant alert types
  const relevantLogs = useMemo(() => {
    return auditLogs.filter(l => 
        ['SECURITY_ALERT', 'CUSTOMER_MISMATCH', 'USER_REMOVED', 'BULK_STATUS_CHANGE'].includes(l.action) ||
        (l.status === 'OPEN' || l.status === 'RESOLVED') 
    );
  }, [auditLogs]);

  // Split into Open vs Resolved
  const openIncidents = relevantLogs.filter(l => l.status === 'OPEN').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const resolvedIncidents = relevantLogs.filter(l => l.status === 'RESOLVED').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply search for incidents
  const displayedIncidents = (activeTab === 'OPEN' ? openIncidents : resolvedIncidents).filter(l => 
    l.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Admins for Access Monitor
  const admins = users.filter(u => u.role !== UserRole.CUSTOMER && u.role !== UserRole.SUPER_ADMIN);

  const getDeviceIcon = (deviceStr?: string) => {
    if (!deviceStr) return <Monitor size={16} className="text-slate-400" />;
    if (deviceStr.toLowerCase().includes('mobile') || deviceStr.toLowerCase().includes('iphone') || deviceStr.toLowerCase().includes('android')) {
      return <Smartphone size={16} className="text-indigo-500" />;
    }
    return <Laptop size={16} className="text-indigo-500" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Security Command Center</h2>
            <p className="text-slate-500 mt-1">Incident response, compliance monitoring, and access logs.</p>
         </div>
         
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('OPEN')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'OPEN' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
               <ShieldAlert size={16} />
               Active Incidents
               {openIncidents.length > 0 && <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px]">{openIncidents.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('ACCESS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'ACCESS' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
               <User size={16} />
               Access Monitor
            </button>
            <button 
              onClick={() => setActiveTab('RESOLVED')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'RESOLVED' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
               <History size={16} />
               Archives
            </button>
         </div>
      </div>

      {activeTab !== 'ACCESS' && (
        <div className="relative">
           <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
           <input 
              type="text" 
              placeholder="Search incident details, admin name..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      )}

      {activeTab === 'OPEN' && (
         <div className="space-y-6">
            {displayedIncidents.length === 0 ? (
               <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">All Secure</h3>
                  <p className="text-slate-500">No active security incidents requiring attention.</p>
               </div>
            ) : (
               <div className="grid md:grid-cols-2 gap-6">
                  {displayedIncidents.map(log => (
                     <Card key={log.id} className="border-l-4 border-l-red-500 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-2">
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                 <AlertTriangle size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</h4>
                                 <p className="text-[10px] text-red-500 font-bold">Priority: High</p>
                              </div>
                           </div>
                           <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {new Date(log.timestamp).toLocaleString()}
                           </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm text-slate-700 leading-relaxed">
                           {log.details}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <User size={14} />
                              {log.performedBy}
                              <span className="font-normal opacity-70">({log.role.split('_')[0]})</span>
                           </div>
                           
                           <Button 
                              onClick={() => resolveIncident(log.id)}
                              className="bg-slate-900 hover:bg-emerald-600 text-white text-xs px-4 py-2 h-auto"
                           >
                              <CheckCircle size={14} /> Mark Resolved
                           </Button>
                        </div>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      )}

      {activeTab === 'ACCESS' && (
         <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-700 text-sm">Real-time Access Logs</h3>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monitoring {admins.length} Admins</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                     <tr>
                        <th className="p-4">Administrator</th>
                        <th className="p-4">Device Used</th>
                        <th className="p-4">Last Login</th>
                        <th className="p-4 text-right">Total Logins</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {admins.map(admin => (
                        <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200">
                                    {admin.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900">{admin.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{admin.role.split('_')[0]}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 {getDeviceIcon(admin.lastDevice)}
                                 <span className="text-slate-700 text-xs font-medium">
                                    {admin.lastDevice || 'Never Logged In'}
                                 </span>
                              </div>
                           </td>
                           <td className="p-4 text-xs font-mono text-slate-500">
                              {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '-'}
                           </td>
                           <td className="p-4 text-right">
                              <span className="inline-block bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">
                                 {admin.loginCount || 0}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>
      )}

      {activeTab === 'RESOLVED' && (
         <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                     <tr>
                        <th className="p-4">Incident Type</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Responsible Admin</th>
                        <th className="p-4">Timestamps</th>
                        <th className="p-4 text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {displayedIncidents.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="p-8 text-center text-slate-400">No archived incidents found.</td>
                        </tr>
                     ) : (
                        displayedIncidents.map(log => (
                           <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-bold text-slate-700 text-xs">
                                 {log.action.replace(/_/g, ' ')}
                              </td>
                              <td className="p-4 text-slate-600 text-xs max-w-sm truncate" title={log.details}>
                                 {log.details}
                              </td>
                              <td className="p-4 text-xs font-medium">
                                 {log.performedBy}
                              </td>
                              <td className="p-4 text-[10px] text-slate-500 space-y-1">
                                 <div className="flex items-center gap-1">
                                    <AlertTriangle size={10} className="text-red-400"/> {new Date(log.timestamp).toLocaleString()}
                                 </div>
                                 {log.resolvedAt && (
                                    <div className="flex items-center gap-1 text-emerald-600">
                                       <CheckCircle size={10} /> {new Date(log.resolvedAt).toLocaleString()}
                                    </div>
                                 )}
                              </td>
                              <td className="p-4 text-right">
                                 <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                    <CheckCircle size={12} /> Solved
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}
    </div>
  );
};
