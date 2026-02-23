
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input } from '../components/UI';
import { Coins, TrendingUp, ArrowUpRight, Scale, CheckCircle, History, Clock } from 'lucide-react';

export const GoldCollection: React.FC = () => {
  const { settings, updateGoldRate, logAction, billingRecords, customers, products, toggleBillGold } = useAppStore();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  
  // Filter pending gold collections
  const pendingCollections = billingRecords.filter(b => b.status === 'PENDING' && !b.goldReceived);
  
  // Filter completed collections
  const completedCollections = billingRecords.filter(b => b.goldReceived);

  const confirmCollection = (billId: string, weight: number, customerName: string) => {
    // This action marks the specific bill's gold as received
    toggleBillGold(billId);
    logAction('GOLD_RECEIVED', `Recovered ${weight.toFixed(3)}g (24k) from ${customerName} for Bill #${billId}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Gold Collection</h2>
            <p className="text-slate-500 mt-1">Manage 24k gold equivalents recovery.</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'PENDING' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <Clock size={16} /> Pending
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <History size={16} /> Completed
            </button>
         </div>
      </div>
      
      <div className="w-full">
        {activeTab === 'PENDING' ? (
           <Card title={`Pending Gold Recovery (${pendingCollections.length})`} className="w-full">
             {pendingCollections.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   <Scale size={48} className="mx-auto mb-2 opacity-50"/>
                   <p>No pending gold collections.</p>
                </div>
             ) : (
                <div className="space-y-4">
                   {pendingCollections.map(bill => {
                      const cust = customers.find(c => c.id === bill.customerId);
                      
                      return (
                         <div key={bill.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gold-300 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                  {cust?.legalName.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-900">{cust?.legalName}</h4>
                                  <p className="text-xs text-indigo-600 font-mono font-bold mt-1">Bill: {bill.id}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">{bill.items.length} Items</span>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="text-center md:text-right bg-gold-50 px-6 py-3 rounded-xl border border-gold-100">
                               <p className="text-[10px] font-bold text-gold-700 uppercase tracking-wider mb-1">Required Fine Gold (24k)</p>
                               <p className="text-2xl font-serif font-bold text-slate-900">{bill.totalFineGoldWeight.toFixed(3)}g</p>
                            </div>
                            
                            <Button 
                              variant="primary" 
                              onClick={() => confirmCollection(bill.id, bill.totalFineGoldWeight, cust?.legalName || 'Unknown')}
                              className="w-full md:w-auto"
                            >
                               <CheckCircle size={18} /> Confirm Receipt
                            </Button>
                         </div>
                      )
                   })}
                </div>
             )}
           </Card>
        ) : (
           <Card title={`Recovery History (${completedCollections.length})`} className="w-full">
             {completedCollections.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   <History size={48} className="mx-auto mb-2 opacity-50"/>
                   <p>No gold recovery history found.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                         <tr>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Collected Weight (24k)</th>
                            <th className="p-4 text-right">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {completedCollections.map(bill => {
                            const cust = customers.find(c => c.id === bill.customerId);
                            return (
                               <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4">
                                     <p className="font-bold text-slate-900">{cust?.legalName}</p>
                                     <p className="text-xs text-indigo-600 font-mono font-bold mt-0.5">Bill: {bill.id}</p>
                                  </td>
                                  <td className="p-4 text-slate-600">
                                     {bill.items.length} items (Gross: {bill.items.reduce((acc, i) => acc + i.grossWeight, 0).toFixed(2)}g)
                                  </td>
                                  <td className="p-4">
                                     <span className="font-mono font-bold text-gold-600">{bill.totalFineGoldWeight.toFixed(3)}g</span>
                                  </td>
                                  <td className="p-4 text-right">
                                     <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        <CheckCircle size={12} /> Recovered
                                     </div>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             )}
           </Card>
        )}
      </div>
    </div>
  );
};
