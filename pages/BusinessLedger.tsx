
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card, Badge, Input, Select } from '../components/UI';
import { 
  IndianRupee, 
  TrendingUp, 
  Scale, 
  Search, 
  Filter, 
  Download,
  ArrowRight,
  Gem
} from 'lucide-react';
import { ProductStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const BusinessLedger: React.FC = () => {
  const { products, customers, billingRecords, settings } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // --- Data Processing Engine ---
  const ledgerData = useMemo(() => {
    // We filter products that have at least reached ALLOTTED status as "Transactions"
    const activeTransactions = products.filter(p => p.status !== ProductStatus.IN_ADMIN_STOCK && p.status !== ProductStatus.SUSPENDED);

    return activeTransactions.map(product => {
      const customer = customers.find(c => c.id === product.customerId);
      // Find the bill that contains this product item
      const bill = billingRecords.find(b => b.items.some(i => i.productId === product.id));
      const billItem = bill ? bill.items.find(i => i.productId === product.id) : null;
      
      // Calculate Financials
      // If billed, use bill item data. If not, estimate.
      const appliedRate = billItem ? billItem.appliedRate : settings.goldRatePer10Gm;
      const goldRevenue = billItem ? billItem.goldValue : (product.goldWeight * (settings.goldRatePer10Gm / 10));
      
      let makingRevenue = 0;
      let makingPercentage = 0;

      if (billItem) {
        makingRevenue = billItem.makingChargeAmount;
        makingPercentage = billItem.makingChargePercent;
      } else {
        // Estimated making charge (e.g. default 12%) for projection
        makingPercentage = 12; 
        makingRevenue = (goldRevenue * 12) / 100;
      }

      const totalTurnover = goldRevenue + makingRevenue;

      return {
        id: product.id,
        date: product.createdAt,
        productName: product.type,
        barcode: product.barcodeId,
        purity: product.purity,
        weight: product.goldWeight,
        customerName: customer ? customer.legalName : 'Unknown',
        adminName: product.allottedBy || 'System',
        status: product.status,
        rateApplied: appliedRate,
        makingPercent: makingPercentage,
        goldRevenue,
        makingRevenue,
        totalTurnover,
        isBilled: !!bill,
        isPaid: bill?.status === 'COMPLETED' // Bill level status
      };
    });
  }, [products, customers, billingRecords, settings]);

  // --- Aggregate Totals ---
  const totals = useMemo(() => {
    return ledgerData.reduce((acc, item) => {
      // Only count actual turnover if billed, otherwise it's projected
      if (item.isBilled) {
        acc.realizedTurnover += item.totalTurnover;
        acc.realizedProfit += item.makingRevenue;
        acc.goldRevenue += item.goldRevenue;
      } else {
        acc.projectedTurnover += item.totalTurnover;
      }
      acc.totalWeight += item.weight;
      return acc;
    }, { realizedTurnover: 0, realizedProfit: 0, goldRevenue: 0, projectedTurnover: 0, totalWeight: 0 });
  }, [ledgerData]);

  // --- Chart Data ---
  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    ledgerData.forEach(item => {
      dist[item.productName] = (dist[item.productName] || 0) + item.totalTurnover;
    });
    return Object.keys(dist).map(key => ({ name: key, value: dist[key] }));
  }, [ledgerData]);

  const filteredLedger = ledgerData.filter(item => {
    const matchesSearch = 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.barcode.includes(searchTerm) ||
      item.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' ? true : item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#d97706'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Business Ledger</h2>
            <p className="text-slate-500 mt-1">Financial intelligence, transaction lifecycle, and profit analysis.</p>
         </div>
         <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wide hover:bg-slate-50 shadow-sm">
               <Download size={16} /> Export Report
            </button>
         </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/20 text-white relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Turnover (Realized)</p>
              <p className="text-3xl font-serif font-bold text-white">₹{totals.realizedTurnover.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">+₹{totals.projectedTurnover.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>in pipeline</span>
              </div>
           </div>
           <IndianRupee className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Net Profit (Making Charges)</p>
              <p className="text-3xl font-serif font-bold text-indigo-600">₹{totals.realizedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                 <TrendingUp size={14} className="text-emerald-500" />
                 <span>Service Revenue</span>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -mr-4 -mt-4 opacity-50"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Gold Sales Revenue</p>
              <p className="text-3xl font-serif font-bold text-gold-600">₹{totals.goldRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                 <Scale size={14} className="text-gold-500" />
                 <span>Asset Liquidation</span>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-24 h-24 bg-gold-50 rounded-bl-[100px] -mr-4 -mt-4 opacity-50"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Gold Sold</p>
              <p className="text-3xl font-serif font-bold text-slate-800">{totals.totalWeight.toFixed(2)} <span className="text-lg text-slate-400">g</span></p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                 <Gem size={14} className="text-blue-400" />
                 <span>Across all types</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Chart */}
         <Card title="Revenue Distribution" className="lg:col-span-1 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={typeDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
               </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
               {typeDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                     {entry.name}
                  </div>
               ))}
            </div>
         </Card>

         {/* Ledger Table */}
         <Card title="Master Transaction Ledger" className="lg:col-span-2 h-[600px] flex flex-col">
            <div className="flex gap-4 mb-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Search customer, admin, barcode..." 
                     className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="relative w-48">
                  <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
                  <select 
                     className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 appearance-none"
                     value={filterStatus}
                     onChange={e => setFilterStatus(e.target.value)}
                  >
                     <option value="ALL">All Statuses</option>
                     <option value={ProductStatus.ALLOTTED}>Allotted</option>
                     <option value={ProductStatus.CONFIRMED_BY_CUSTOMER}>Confirmed</option>
                     <option value={ProductStatus.BILLED}>Billed</option>
                     <option value={ProductStatus.COMPLETED}>Paid & Complete</option>
                  </select>
               </div>
            </div>

            <div className="overflow-auto flex-1 rounded-xl border border-slate-100">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs sticky top-0 z-10">
                     <tr>
                        <th className="p-4 bg-slate-50">Customer / Item</th>
                        <th className="p-4 bg-slate-50">Progress</th>
                        <th className="p-4 bg-slate-50">Financials</th>
                        <th className="p-4 bg-slate-50 text-right">Total Value</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredLedger.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="font-bold text-slate-900">{item.customerName}</span>
                                 <span className="text-xs text-slate-500">{item.productName} • {item.weight}g • {item.purity}</span>
                                 <span className="text-[10px] text-slate-400 font-mono mt-1">{item.barcode}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="space-y-2">
                                 <Badge status={item.status} />
                                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    <span>By: {item.adminName}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="space-y-1 text-xs">
                                 <div className="flex justify-between w-32">
                                    <span className="text-slate-500">Rate:</span>
                                    <span className="font-mono text-slate-700">₹{item.rateApplied}</span>
                                 </div>
                                 <div className="flex justify-between w-32">
                                    <span className="text-slate-500">Making:</span>
                                    <span className="font-mono text-indigo-600 font-bold">{item.makingPercent}%</span>
                                 </div>
                                 <div className="flex justify-between w-32 border-t border-slate-100 pt-1 mt-1">
                                    <span className="text-slate-500">Profit:</span>
                                    <span className="font-mono text-emerald-600 font-bold">+₹{Math.round(item.makingRevenue)}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4 text-right">
                              <span className={`text-lg font-serif font-bold ${item.isPaid ? 'text-slate-900' : 'text-slate-400'}`}>
                                 ₹{Math.round(item.totalTurnover).toLocaleString()}
                              </span>
                              {item.isPaid && <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex justify-end items-center gap-1"><ArrowRight size={10} /> Paid</div>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>
      </div>
    </div>
  );
};
