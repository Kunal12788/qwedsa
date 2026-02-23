
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Users, Package, AlertTriangle, ArrowUpRight, ShieldCheck, UserPlus, Trash2, Check, X, Printer, FileText, ShieldAlert, CheckCircle, Search, Filter, ChevronRight } from 'lucide-react';
import { UserRole, BillingRecord, Customer } from '../types';

// --- INVOICE TEMPLATE (Portal) ---
const InvoiceTemplate: React.FC<{ bill: BillingRecord | null; customer: Customer | undefined }> = ({ bill, customer }) => {
  if (!bill || !customer) return null;

  const isJobWork = bill.goldReceived;
  const invoiceTitle = isJobWork ? "JOB WORK INVOICE" : "TAX INVOICE";

  return createPortal(
    <div className="print-portal-container">
      <style>{`
        @media screen {
          .print-portal-container { display: none; }
        }
        @media print {
          body > *:not(.print-portal-container) { display: none !important; }
          .print-portal-container { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: auto; background: white; z-index: 9999; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
      <div className="bg-white text-slate-900 relative box-border p-[15mm]" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
          
          {/* BRAND HEADER */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-800">
             <div>
                <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Aurum</h1>
                <p className="text-xs font-bold text-gold-600 tracking-[0.3em] uppercase mt-0.5">Enterprise</p>
             </div>
             <div className="text-right">
                <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">{invoiceTitle}</h2>
                <p className="text-sm font-bold text-slate-900 mt-1">#{bill.id}</p>
             </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-3 gap-8 py-8 text-sm font-sans border-b border-slate-100">
             {/* COL 1: SELLER */}
             <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Seller Info</h3>
                <p className="font-bold text-slate-900">Aurum Enterprise Ltd.</p>
                <p className="text-slate-600 mt-1">123 Gold Vault Plaza, Zaveri Bazaar</p>
                <p className="text-slate-600">Mumbai, Maharashtra - 400002</p>
                <p className="text-slate-600 mt-2 font-medium">GSTIN: 27AABCU9603R1ZN</p>
             </div>

             {/* COL 2: BUYER */}
             <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To (Buyer)</h3>
                <p className="font-bold text-slate-900">{customer.legalName}</p>
                <p className="text-slate-600 mt-1">{customer.address || 'Address Not Provided'}</p>
                <p className="text-slate-600">{customer.city}</p>
                <p className="text-slate-600 mt-2">Phone: {customer.phone || 'N/A'}</p>
             </div>

             {/* COL 3: DETAILS */}
             <div className="text-right">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Invoice Details</h3>
                <div className="space-y-1">
                   <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium">{new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Place:</span>
                      <span className="font-medium">{customer.city || 'Mumbai'}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-medium">{bill.paymentMode || 'N/A'}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 mt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-16">HSN</th>
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-20">Weight</th>
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-24">Rate</th>
                   <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-700">
                {bill.items.map((item, idx) => {
                   const isLast = idx === bill.items.length - 1;
                   return (
                    <React.Fragment key={idx}>
                      {/* ROW 1: GOLD ITEM */}
                      <tr>
                         <td className="py-2 align-top text-slate-400">{idx + 1}</td>
                         <td className="py-2 align-top font-bold text-slate-900">
                            {item.productType} - {item.purity} Gold
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">BARCODE: {item.barcodeId}</span>
                         </td>
                         <td className="py-2 align-top text-right text-slate-500">7113</td>
                         <td className="py-2 align-top text-right">{item.grossWeight.toFixed(3)} g</td>
                         <td className="py-2 align-top text-right">
                            {isJobWork ? '-' : `₹${item.appliedRate.toLocaleString()}/10g`}
                         </td>
                         <td className="py-2 align-top text-right font-bold text-slate-900">
                            {isJobWork ? '-' : `₹${item.goldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                         </td>
                      </tr>
                      
                      {/* ROW 2: MAKING CHARGES */}
                      <tr className={isLast ? '' : 'border-b border-slate-100'}>
                         <td className="py-2"></td>
                         <td className="py-2 pb-4 text-slate-500 italic">
                            Making Charges
                            <span className="block text-[10px] text-slate-400 not-italic mt-0.5">
                               {item.makingChargePercent > 0 
                                  ? `Service Charge @ ${item.makingChargePercent}%` 
                                  : 'Fixed Labor Charge'}
                            </span>
                         </td>
                         <td className="py-2 text-right text-slate-500">9988</td>
                         <td className="py-2 text-right text-slate-400">-</td>
                         <td className="py-2 text-right text-slate-400">-</td>
                         <td className="py-2 pb-4 text-right">
                            ₹{item.makingChargeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </td>
                      </tr>
                    </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>

          {/* TOTALS & FOOTER */}
          <div className="mt-12">
             <div className="flex gap-8 border-t-2 border-slate-900 pt-6">
                
                {/* LEFT FOOTER INFO */}
                <div className="w-7/12 space-y-6">
                   <div>
                      <h4 className="font-bold text-xs text-slate-900 mb-2">Terms & Conditions:</h4>
                      <ul className="text-[10px] text-slate-500 list-decimal pl-4 space-y-1">
                         <li>Goods once sold will not be taken back.</li>
                         <li>Subject to Mumbai Jurisdiction.</li>
                         <li>This is a computer generated invoice.</li>
                         <li>Interest @ 24% p.a. will be charged if not paid within due date.</li>
                      </ul>
                   </div>

                   <div>
                      <h4 className="font-bold text-xs text-slate-900 mb-2">Bank Details:</h4>
                      <div className="text-[10px] text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                         <p><span className="font-bold">Bank:</span> HDFC Bank, Fort Branch</p>
                         <p className="mt-1"><span className="font-bold">A/c No:</span> 00600340012345 &nbsp;|&nbsp; <span className="font-bold">IFSC:</span> HDFC0000060</p>
                      </div>
                   </div>
                </div>

                {/* RIGHT TOTALS */}
                <div className="w-5/12">
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                         <span className="text-slate-600">Taxable Amount</span>
                         <span className="font-bold text-slate-900">₹{(bill.grandTotal - bill.totalTaxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500">
                         <span>CGST @ 1.5% (Gold)</span>
                         <span>₹{(bill.totalTaxAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                         <span>SGST @ 1.5% (Gold)</span>
                         <span>₹{(bill.totalTaxAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                         <span>CGST @ 9% (Making)</span>
                         <span>₹{(bill.totalTaxAmount * 0.35).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                         <span>SGST @ 9% (Making)</span>
                         <span>₹{(bill.totalTaxAmount * 0.35).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <span className="font-bold text-lg text-slate-900">Grand Total</span>
                         <span className="font-bold text-2xl text-slate-900">₹{bill.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                   </div>
                   
                   <div className="mt-12 text-right">
                      <p className="text-xs font-bold text-slate-900 mb-8">For Aurum Enterprise Ltd.</p>
                      <div className="border-t border-slate-400 w-32 ml-auto"></div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Authorised Signatory</p>
                   </div>
                </div>
             </div>
             
             <div className="text-center mt-8 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                   Aurum Enterprise Ltd. | Regd. Office: 123 Gold Vault Plaza, Mumbai | CIN: U12345MH2025PTC123456
                </p>
             </div>
          </div>
      </div>
    </div>,
    document.body
  );
};

export const SuperAdmin: React.FC = () => {
  const { auditLogs, products, customers, users, addAdmin, verifyUser, deleteUser, billingRecords } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Admin Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState(UserRole.STOCK_INTAKE_ADMIN);

  // Printing State
  const [printingBill, setPrintingBill] = useState<BillingRecord | null>(null);

  const totalStockWeight = products.reduce((acc, p) => acc + p.goldWeight, 0);
  const totalCustomerWeight = customers.reduce((acc, c) => acc + c.totalGoldInventory, 0);
  
  // --- AGGREGATE INCIDENTS (Open Only) ---
  const activeIncidents = useMemo(() => {
    return auditLogs.filter(l => 
        l.status === 'OPEN' && (
          l.action === 'SECURITY_ALERT' || 
          l.action === 'CUSTOMER_MISMATCH' || 
          l.action === 'USER_REMOVED' ||
          l.action === 'BULK_STATUS_CHANGE'
        )
    );
  }, [auditLogs]);
  
  const pendingUsers = users.filter(u => !u.verified);
  const activeAdmins = users.filter(u => u.verified && u.role !== UserRole.CUSTOMER && u.role !== UserRole.SUPER_ADMIN);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if(newAdminName && newAdminEmail) {
      addAdmin(newAdminName, newAdminEmail, newAdminRole);
      setNewAdminName('');
      setNewAdminEmail('');
      setIsAddModalOpen(false);
    }
  };

  const handlePrint = (bill: BillingRecord) => {
    setPrintingBill(bill);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const stockByStatus = [
    { name: 'In Stock', value: products.filter(p => p.status === 'IN_ADMIN_STOCK').length },
    { name: 'Allotted', value: products.filter(p => p.status === 'ALLOTTED').length },
    { name: 'Confirmed', value: products.filter(p => p.status === 'CONFIRMED_BY_CUSTOMER').length },
    { name: 'Completed', value: products.filter(p => p.status === 'COMPLETED').length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 border-b border-slate-200 gap-6">
         <div className="space-y-3">
            <h2 className="text-6xl font-serif font-bold text-slate-900 tracking-tight leading-none">
               Executive Dashboard
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
               Live overview of enterprise assets and security status.
            </p>
         </div>
         <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm self-start md:self-end mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">System Live</span>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Package size={80} className="text-indigo-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
               <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <Package size={20} />
               </div>
               <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Company Stock</h3>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-serif font-bold text-slate-900">{totalStockWeight.toFixed(2)}</span>
                     <span className="text-sm font-bold text-slate-400">g</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users size={80} className="text-emerald-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
               <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                  <Users size={20} />
               </div>
               <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Customer Holdings</h3>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-serif font-bold text-slate-900">{totalCustomerWeight.toFixed(2)}</span>
                     <span className="text-sm font-bold text-slate-400">g</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={80} className="text-blue-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Activity size={20} />
               </div>
               <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Audit Events</h3>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-serif font-bold text-slate-900">{auditLogs.length}</span>
                     <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
                        <ArrowUpRight size={10} /> Live
                     </span>
                  </div>
               </div>
            </div>
         </div>
         
         {/* ACTIVE SECURITY INCIDENTS WIDGET */}
         <button 
            onClick={() => window.location.hash = '#security'}
            className={`text-left p-6 rounded-2xl border shadow-soft relative overflow-hidden group transition-all hover:scale-[1.02] ${activeIncidents.length > 0 ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-slate-100'}`}
         >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <AlertTriangle size={80} className={activeIncidents.length > 0 ? "text-red-600" : "text-slate-400"} />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${activeIncidents.length > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                  <ShieldAlert size={20} />
               </div>
               <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Active Incidents</h3>
                  <div className="flex items-baseline gap-1">
                     <span className={`text-3xl font-serif font-bold ${activeIncidents.length > 0 ? "text-red-600" : "text-slate-900"}`}>{activeIncidents.length}</span>
                  </div>
               </div>
               <div className="mt-4 flex items-center text-xs font-bold text-slate-500 group-hover:text-slate-900 gap-1">
                  View Security Center <ChevronRight size={12} />
               </div>
            </div>
         </button>
      </div>

      {/* User Management Section */}
      <div className="grid lg:grid-cols-2 gap-8">
         <Card 
            title="Pending Access Requests" 
            className="h-[400px] flex flex-col"
            action={<span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{pendingUsers.length} Pending</span>}
         >
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
               {pendingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                     <ShieldCheck size={32} className="mb-2 opacity-50"/>
                     <p className="text-sm">All users verified.</p>
                  </div>
               ) : (
                  pendingUsers.map(u => (
                     <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div>
                           <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                           <p className="text-xs text-slate-500">{u.email}</p>
                           <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 mt-1 inline-block">{u.role.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => verifyUser(u.id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                              <Check size={18} />
                           </button>
                           <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                              <X size={18} />
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </Card>

         <Card 
            title="Admin Team Management" 
            className="h-[400px] flex flex-col"
            action={
               <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus size={16} /> Add Admin
               </Button>
            }
         >
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
               {activeAdmins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                     <Users size={32} className="mb-2 opacity-50"/>
                     <p className="text-sm">No active admins found.</p>
                  </div>
               ) : (
                  activeAdmins.map(u => (
                     <div key={u.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                              {u.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{u.role.split('_')[0]}</span>
                           <button onClick={() => deleteUser(u.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 justify-end ml-auto">
                              <Trash2 size={12} /> Remove
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Inventory Distribution" className="min-h-[400px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stockByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                tick={{fill: '#64748b', fontWeight: 500}}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tick={{fill: '#64748b'}} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#colorGradient)" 
                radius={[6, 6, 0, 0]} 
                barSize={40}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#334155" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Audit Log Stream" className="h-[460px] overflow-hidden flex flex-col">
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Filter activity logs..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto pr-2 space-y-3 flex-1 scrollbar-thin">
             {auditLogs
               .filter(l => l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.performedBy.toLowerCase().includes(searchTerm.toLowerCase()))
               .map((log, i) => (
               <div key={log.id} className="text-sm p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                  <div className="flex justify-between mb-2">
                    <span className={`font-bold text-xs uppercase tracking-wide px-2 py-0.5 rounded-md ${
                      log.action.includes('MISMATCH') || log.action.includes('SECURITY') ? 'bg-red-50 text-red-600' : 
                      log.action.includes('STOCK') ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-2">{log.details}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                     <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">
                        {log.performedBy.charAt(0)}
                     </div>
                     <p className="text-xs text-slate-500 font-medium">{log.performedBy} <span className="text-slate-300">•</span> {log.role.replace('ADMIN', '')}</p>
                  </div>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* BILLING HISTORY & PRINTING */}
      <Card title="Billing & Transaction History" className="col-span-full">
         <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[500px]">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs sticky top-0 z-10 shadow-sm">
                  <tr>
                     <th className="p-4">Bill ID</th>
                     <th className="p-4">Customer</th>
                     <th className="p-4">Date</th>
                     <th className="p-4">Items</th>
                     <th className="p-4">Total Amount</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {billingRecords.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">No billing records found.</td>
                     </tr>
                  ) : (
                     billingRecords.map(bill => {
                        const cust = customers.find(c => c.id === bill.customerId);
                        return (
                           <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-indigo-600">{bill.id}</td>
                              <td className="p-4">
                                 <p className="font-bold text-slate-900">{cust?.legalName}</p>
                                 <p className="text-xs text-slate-500">{cust?.uniqueName}</p>
                              </td>
                              <td className="p-4 text-slate-600 text-xs">
                                 {new Date(bill.createdAt).toLocaleDateString()}
                                 <span className="block text-[10px] text-slate-400">{new Date(bill.createdAt).toLocaleTimeString()}</span>
                              </td>
                              <td className="p-4">
                                 <Badge status={`${bill.items.length} Items`} />
                              </td>
                              <td className="p-4 font-serif font-bold text-slate-900">
                                 ₹{bill.grandTotal.toLocaleString()}
                              </td>
                              <td className="p-4">
                                 <div className="flex gap-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.paymentReceived ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                       {bill.paymentReceived ? 'Paid' : 'Unpaid'}
                                     </span>
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.goldReceived ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                       {bill.goldReceived ? 'Gold Recv' : 'Gold Pend'}
                                     </span>
                                 </div>
                              </td>
                              <td className="p-4 text-right">
                                 <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="ml-auto"
                                    onClick={() => handlePrint(bill)}
                                 >
                                    <Printer size={14} className="mr-1" /> Print
                                 </Button>
                              </td>
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>
      </Card>

      {/* Add Admin Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Provision New Admin">
        <form onSubmit={handleAddAdmin} className="space-y-6">
          <Input 
            label="Full Name"
            value={newAdminName}
            onChange={e => setNewAdminName(e.target.value)}
            required
          />
          <Input 
            label="Email Address"
            type="email"
            value={newAdminEmail}
            onChange={e => setNewAdminEmail(e.target.value)}
            required
          />
          <Select 
            label="Role Assignment" 
            value={newAdminRole}
            onChange={e => setNewAdminRole(e.target.value as UserRole)}
          >
             <option value={UserRole.STOCK_INTAKE_ADMIN}>Stock Intake Admin</option>
             <option value={UserRole.ALLOTMENT_ADMIN}>Allotment Admin</option>
             <option value={UserRole.BILLING_ADMIN}>Billing Admin</option>
             <option value={UserRole.DELIVERY_ADMIN}>Delivery/Logistics Admin</option>
          </Select>
          <div className="bg-indigo-50 p-4 rounded-xl text-xs text-indigo-700 leading-relaxed border border-indigo-100">
             Note: Admins created here are automatically verified and can access the system immediately using their credentials.
          </div>
          <Button type="submit" variant="primary" className="w-full">
            <UserPlus size={18} /> Create & Verify Account
          </Button>
        </form>
      </Modal>

      {/* Printing Portal */}
      <InvoiceTemplate 
        bill={printingBill} 
        customer={printingBill ? customers.find(c => c.id === printingBill.customerId) : undefined} 
      />
    </div>
  );
};
