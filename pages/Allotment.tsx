import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { 
  UserCheck, Search, ShieldCheck, ShoppingBag, Plus, X, Grid, 
  List, MapPin, QrCode, MousePointerClick, ScanLine, ArrowLeft, 
  CheckCircle2, AlertCircle, Download, User, Scale, Layers, 
  Gem, Trash2, PackageCheck, ChevronDown, ChevronUp, ShieldAlert 
} from 'lucide-react';
import { ProductStatus } from '../types';
import { JEWELLERY_TYPES } from '../constants';

export const Allotment: React.FC = () => {
  const { products, customers, bulkAllotProducts, verifyAllotment, currentUser, getPurityFactor, logAction, addNotification } = useAppStore();
  
  const [showPendingVerify, setShowPendingVerify] = useState(false);
  
  // QR Mode States
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<{ status: 'success' | 'error' | 'security', message: string, itemDetails?: string } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Shared Data States
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // Assignment States
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [targetCustomer, setTargetCustomer] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Available Data
  const availableProducts = products.filter(p => p.status === ProductStatus.IN_ADMIN_STOCK);
  const pendingVerifyProducts = products.filter(p => p.status === ProductStatus.ALLOTTED && !p.doubleVerifiedAllotment);

  // Derived Locations for Filter
  const uniqueCities = useMemo(() => {
    const cities = customers.map(c => c.city).filter(city => city && city.trim() !== '');
    return Array.from(new Set(cities)).sort();
  }, [customers]);

  // Filtered Customers based on Location & Search
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesCity = !selectedCityFilter || c.city === selectedCityFilter;
      
      const term = customerSearchTerm.toLowerCase();
      const matchesSearch = !customerSearchTerm || 
                            c.legalName.toLowerCase().includes(term) ||
                            c.uniqueName.toLowerCase().includes(term) ||
                            (c.phone && c.phone.toLowerCase().includes(term)) ||
                            (c.address && c.address.toLowerCase().includes(term)) ||
                            (c.city && c.city.toLowerCase().includes(term));

      return matchesCity && matchesSearch;
    });
  }, [customers, selectedCityFilter, customerSearchTerm]);

  // --- BASKET CALCULATIONS ---
  const basketStats = useMemo(() => {
    const items = products.filter(p => selectedProductIds.includes(p.id));
    
    const stats = items.reduce((acc, item) => {
      const purityFactor = getPurityFactor(item.purity);
      const fineWeight = item.goldWeight * purityFactor;
      
      // Category Breakdown
      if (!acc.categoryWeights[item.type]) {
        acc.categoryWeights[item.type] = { count: 0, weight: 0 };
      }
      acc.categoryWeights[item.type].count += 1;
      acc.categoryWeights[item.type].weight += item.goldWeight;

      // Totals
      acc.totalGrossGold += item.goldWeight;
      acc.totalFineGold += fineWeight;
      acc.totalStoneWeight += item.stoneWeight;
      
      return acc;
    }, { 
      totalGrossGold: 0, 
      totalFineGold: 0, 
      totalStoneWeight: 0, 
      categoryWeights: {} as Record<string, { count: number, weight: number }> 
    });

    return { items, ...stats };
  }, [selectedProductIds, products, getPurityFactor]);

  const selectedCustomerDetails = customers.find(c => c.id === targetCustomer);

  // Focus Input on Mount
  useEffect(() => {
    if (scanInputRef.current) {
        scanInputRef.current.focus();
    }
  }, []);

  const handleToggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(prev => prev.filter(pid => pid !== id));
    } else {
      setSelectedProductIds(prev => [...prev, id]);
    }
  };

  const handleQrScan = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = scanInput.trim();
    if (!barcode) return;

    // 1. Check if item exists in Admin Stock
    const product = availableProducts.find(p => p.barcodeId === barcode);

    if (product) {
        // 2. Check if already in basket
        if (selectedProductIds.includes(product.id)) {
            setLastScanResult({ 
                status: 'error', 
                message: `Duplicate Scan`,
                itemDetails: `Item ${barcode} is already in basket`
            });
        } else {
            // 3. Add to basket
            setSelectedProductIds(prev => [...prev, product.id]);
            setLastScanResult({ 
                status: 'success', 
                message: `Scanned Successfully`,
                itemDetails: `${product.type} (${product.goldWeight}g) - ${product.purity}`
            });
        }
    } else {
        // Check if it exists but status is wrong
        const existsAnywhere = products.find(p => p.barcodeId === barcode);
        if (existsAnywhere) {
            setLastScanResult({ 
                status: 'error', 
                message: `Invalid Status`, 
                itemDetails: `Item is ${existsAnywhere.status.replace(/_/g, ' ')}, not Admin Stock.`
            });
        } else {
            // CRITICAL: UNKNOWN BARCODE SECURITY THREAT
            const incidentDetails = `UNAUTHORIZED SCAN: Admin '${currentUser?.name}' scanned unknown asset ID '${barcode}' during allotment.`;
            logAction('SECURITY_ALERT', incidentDetails);

            setLastScanResult({ 
                status: 'security', 
                message: `Security Threat Detected`, 
                itemDetails: `Unknown ID '${barcode}' reported to Security Center.`
            });
        }
    }

    setScanInput('');
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  const handleBulkAllot = () => {
    if (selectedProductIds.length > 0 && targetCustomer && currentUser) {
      bulkAllotProducts(selectedProductIds, targetCustomer, currentUser.name);
      setSelectedProductIds([]);
      setTargetCustomer('');
      setIsConfirmModalOpen(false);
      setLastScanResult(null);
    }
  };

  const exportBasketPDF = () => {
    if (!window.html2pdf) return;
    const element = document.getElementById('allotment-basket-container');
    const opt = {
      margin: 10,
      filename: `Allotment_Manifest_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    window.html2pdf().set(opt).from(element).save().then(() => {
        addNotification('PDF Exported', 'Allotment manifest downloaded successfully.', 'success');
    });
  };

  // --- RENDER: MAIN INTERFACE ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
                Allotment Operations
            </h2>
            <p className="text-slate-500 mt-1">Scan inventory tags to assign stock to customers.</p>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setShowPendingVerify(true)} className="relative">
              <ShieldCheck size={16} /> Pending Verification
              {pendingVerifyProducts.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
           </Button>
        </div>
      </div>

      {/* TOP ROW: INPUT AREA (Scanner) - FULL WIDTH */}
      <div className="w-full">
             <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden relative flex flex-col md:flex-row min-h-[200px] transition-colors duration-300 ${lastScanResult?.status === 'security' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'}`}>
                 {/* Scanner Visual Header */}
                 <div className={`absolute top-0 left-0 h-full w-1.5 ${lastScanResult?.status === 'security' ? 'bg-red-500' : 'bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500'}`}></div>
                 
                 <div className="p-8 flex gap-8 items-center flex-1">
                     {/* Scanner Icon/Visual */}
                     <div className="hidden md:flex flex-col items-center justify-center w-32 shrink-0">
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center relative group ${lastScanResult?.status === 'security' ? 'bg-red-50' : 'bg-slate-50'}`}>
                           <div className={`absolute inset-0 border-2 border-dashed rounded-2xl animate-[spin_10s_linear_infinite] opacity-50 ${lastScanResult?.status === 'security' ? 'border-red-400' : 'border-slate-300'}`}></div>
                           {lastScanResult?.status === 'security' ? <ShieldAlert size={40} className="text-red-600 relative z-10 animate-pulse" /> : <ScanLine size={40} className="text-indigo-600 relative z-10" />}
                           <div className={`absolute -bottom-1 w-16 h-1 rounded-full blur-sm animate-pulse ${lastScanResult?.status === 'security' ? 'bg-red-500/50' : 'bg-indigo-500/50'}`}></div>
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${lastScanResult?.status === 'security' ? 'text-red-500' : 'text-slate-400'}`}>{lastScanResult?.status === 'security' ? 'Threat Detected' : 'Active Scanner'}</p>
                     </div>

                     {/* Scanner Input & Status */}
                     <div className="flex-1 space-y-4 max-w-3xl">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Barcode / Asset ID</label>
                             <form onSubmit={handleQrScan} className="relative">
                                 <input 
                                     ref={scanInputRef}
                                     type="text" 
                                     value={scanInput}
                                     onChange={(e) => {
                                         setScanInput(e.target.value);
                                         // Keep the security message until they start typing a new one, but can clear others
                                         if (lastScanResult && lastScanResult.status !== 'security') setLastScanResult(null); 
                                     }}
                                     onKeyDown={() => {
                                         // Clear security alert on new input
                                         if(lastScanResult?.status === 'security') setLastScanResult(null);
                                     }}
                                     placeholder="Scan item tag here..."
                                     className={`w-full pl-6 pr-16 py-5 bg-slate-50 border-2 rounded-xl text-2xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-300 ${lastScanResult?.status === 'security' ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                     autoFocus
                                 />
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">ENTER</span>
                                 </div>
                             </form>
                         </div>

                         {/* Feedback Area */}
                         <div className="min-h-[40px]">
                             {lastScanResult ? (
                                 <div className={`flex items-center gap-3 animate-slide-up ${
                                     lastScanResult.status === 'success' ? 'text-emerald-700' : 
                                     lastScanResult.status === 'security' ? 'text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100' : 'text-amber-600'
                                 }`}>
                                     {lastScanResult.status === 'success' && <CheckCircle2 size={20} />}
                                     {lastScanResult.status === 'error' && <AlertCircle size={20} />}
                                     {lastScanResult.status === 'security' && <ShieldAlert size={20} className="animate-bounce" />}
                                     
                                     <span className="font-bold">{lastScanResult.message}</span>
                                     <span className={`text-sm pl-3 ml-1 ${lastScanResult.status === 'security' ? 'border-l border-red-200' : 'opacity-80 border-l border-current'}`}>{lastScanResult.itemDetails}</span>
                                 </div>
                             ) : (
                                 <p className="text-slate-400 text-sm italic flex items-center gap-2">
                                    <PackageCheck size={16} /> Waiting for input...
                                 </p>
                             )}
                         </div>
                     </div>
                 </div>
                 
                 {/* Quick Stats Panel */}
                 <div className="w-full md:w-64 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-center">
                    <div className="space-y-4">
                       <div>
                          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Session Count</p>
                          <p className="text-4xl font-mono font-bold text-slate-900">{selectedProductIds.length}</p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Session Weight</p>
                          <p className="text-xl font-mono font-bold text-slate-600">{basketStats.totalGrossGold.toFixed(2)}g</p>
                       </div>
                    </div>
                 </div>
             </div>
      </div>

      {/* BOTTOM ROW: ALLOTMENT BASKET (Full Width) */}
      <div id="allotment-basket-container" className="animate-slide-up">
         <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-slate-200/50">
            {/* 1. Basket Header */}
            <div className="bg-slate-900 p-4 px-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <ShoppingBag className="text-gold-400" size={20} />
                   <h3 className="text-lg font-bold">Allotment Manifest</h3>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                   <div>
                      <span className="text-slate-400 text-xs uppercase font-bold mr-2">Total Gross:</span>
                      <span className="font-mono font-bold">{basketStats.totalGrossGold.toFixed(2)}g</span>
                   </div>
                   <div>
                      <span className="text-slate-400 text-xs uppercase font-bold mr-2">Total Fine (24k):</span>
                      <span className="font-mono font-bold text-gold-400">{basketStats.totalFineGold.toFixed(3)}g</span>
                   </div>
                </div>
            </div>

            {/* 2. Customer Assignment & Filters (INTEGRATED) */}
            <div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center relative z-20">
               <div className="flex-1 w-full">
                  {targetCustomer ? (
                     <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
                              {selectedCustomerDetails?.legalName.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-0.5">Assigned Customer</p>
                              <div className="flex items-center gap-2">
                                 <p className="font-bold text-slate-900">{selectedCustomerDetails?.legalName}</p>
                                 <span className="text-xs text-slate-500">• {selectedCustomerDetails?.city}</span>
                              </div>
                           </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setTargetCustomer('')} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100">
                           Change
                        </Button>
                     </div>
                  ) : (
                     <div className="flex gap-2 w-full max-w-3xl relative">
                        <div className="relative w-1/3">
                           <MapPin className="absolute left-3 top-3 text-slate-400" size={14} />
                           <select 
                              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none font-medium text-slate-700"
                              value={selectedCityFilter}
                              onChange={e => setSelectedCityFilter(e.target.value)}
                           >
                              <option value="">All Cities</option>
                              {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                           </select>
                           <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
                        </div>
                        
                        <div className="relative flex-1">
                           <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                           <input 
                              type="text" 
                              placeholder="Search Name, Phone, ID, or Location..." 
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              value={customerSearchTerm}
                              onChange={e => {
                                 setCustomerSearchTerm(e.target.value);
                                 setShowCustomerDropdown(true);
                              }}
                              onFocus={() => setShowCustomerDropdown(true)}
                           />
                           
                           {/* Integrated Dropdown Results */}
                           {showCustomerDropdown && (customerSearchTerm || filteredCustomers.length > 0) && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                                 {filteredCustomers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">No customers found.</div>
                                 ) : (
                                    filteredCustomers.map(c => (
                                       <button 
                                          key={c.id}
                                          onClick={() => {
                                             setTargetCustomer(c.id);
                                             setShowCustomerDropdown(false);
                                             setCustomerSearchTerm('');
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group transition-colors"
                                       >
                                          <div>
                                             <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{c.legalName}</p>
                                             <p className="text-xs text-slate-500">{c.city || 'No City'}</p>
                                          </div>
                                          <Plus size={14} className="text-slate-300 group-hover:text-indigo-500" />
                                       </button>
                                    ))
                                 )}
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               {/* Category Pills - Right Aligned in Row */}
               <div className="flex flex-wrap gap-2 justify-end">
                   {Object.entries(basketStats.categoryWeights).map(([cat, data]: [string, any]) => (
                      <span key={cat} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-600 font-bold">
                         <span>{cat}</span>
                         <span className="bg-white border border-slate-200 px-1 rounded">{data.count}</span>
                      </span>
                   ))}
               </div>
            </div>

            {/* 3. Detailed Item Table */}
            <div className="overflow-x-auto max-h-[500px] min-h-[200px] bg-slate-50/30">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 shadow-sm z-10">
                     <tr>
                        <th className="p-4 w-16 text-center">#</th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4">Purity</th>
                        <th className="p-4 text-right">Gross Wt (g)</th>
                        <th className="p-4 text-right">Stone Wt (g)</th>
                        <th className="p-4 text-right text-gold-600">Fine 24k (g)</th>
                        <th className="p-4 text-center w-16">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {basketStats.items.length === 0 ? (
                        <tr>
                           <td colSpan={7} className="p-16 text-center text-slate-400">
                              <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                              <p>Basket is empty. Start scanning to add items.</p>
                           </td>
                        </tr>
                     ) : (
                        basketStats.items.map((item, idx) => {
                           const fineWt = item.goldWeight * getPurityFactor(item.purity);
                           return (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                          <img src={item.imageUrl} className="w-full h-full object-cover" />
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-900 text-sm">{item.type}</p>
                                          <p className="text-xs font-mono text-slate-500">{item.barcodeId}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{item.purity}</span>
                                 </td>
                                 <td className="p-4 text-right font-medium text-slate-700">{item.goldWeight.toFixed(2)}</td>
                                 <td className="p-4 text-right text-slate-500">{item.stoneWeight.toFixed(2)}</td>
                                 <td className="p-4 text-right font-bold text-gold-600 bg-gold-50/10">{fineWt.toFixed(3)}</td>
                                 <td className="p-4 text-center">
                                    <button 
                                       onClick={() => handleToggleProduct(item.id)}
                                       className="text-slate-300 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           );
                        })
                     )}
                  </tbody>
               </table>
            </div>

            {/* 4. Footer Action */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
               <div className="flex gap-2">
                   <Button size="sm" variant="outline" onClick={exportBasketPDF} disabled={selectedProductIds.length === 0}>
                      <Download size={14} className="mr-1" /> PDF
                   </Button>
                   <Button size="sm" variant="danger" onClick={() => { setSelectedProductIds([]); setTargetCustomer(''); }} disabled={selectedProductIds.length === 0}>
                      Clear All
                   </Button>
               </div>
               
               <Button 
                  size="lg" 
                  disabled={selectedProductIds.length === 0 || !targetCustomer}
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-12 shadow-lg shadow-indigo-500/20"
               >
                  Confirm Allotment
               </Button>
            </div>
         </Card>
      </div>

      {/* Pending Verification Modal/Panel */}
      <Modal isOpen={showPendingVerify} onClose={() => setShowPendingVerify(false)} title="Items Pending Verification">
         <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800">
               These items have been allotted by another admin but require a second confirmation check before being fully released to the customer.
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
               {pendingVerifyProducts.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm">No items pending verification.</p>
               ) : (
                  pendingVerifyProducts.map(p => (
                     <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                           <div className="p-2 bg-slate-100 rounded text-slate-500">
                              <ShieldCheck size={16} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm">{p.type} <span className="text-slate-400 text-xs font-normal">({p.barcodeId})</span></p>
                              <p className="text-xs text-slate-500">Allotted by: {p.allottedBy}</p>
                           </div>
                        </div>
                        <Button size="sm" onClick={() => verifyAllotment(p.id)} variant="success" className="text-xs px-3">
                           Verify
                        </Button>
                     </div>
                  ))
               )}
            </div>
            <div className="pt-2 text-right">
               <Button variant="secondary" onClick={() => setShowPendingVerify(false)}>Close</Button>
            </div>
         </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Bulk Allotment">
         <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
               <p className="text-indigo-900 font-bold text-lg">{selectedProductIds.length} Items</p>
               <p className="text-indigo-600 text-sm">Assigning to <span className="font-bold">{selectedCustomerDetails?.legalName}</span></p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
               <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase">Gross Wt</p>
                  <p className="font-bold text-slate-900">{basketStats.totalGrossGold.toFixed(2)}g</p>
               </div>
               <div className="bg-gold-50 p-2 rounded border border-gold-100">
                  <p className="text-[10px] text-gold-600 uppercase">Fine (24k)</p>
                  <p className="font-bold text-gold-800">{basketStats.totalFineGold.toFixed(3)}g</p>
               </div>
               <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase">Stone Wt</p>
                  <p className="font-bold text-slate-900">{basketStats.totalStoneWeight.toFixed(2)}g</p>
               </div>
            </div>
            
            <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">
               These items will be moved from <strong>Admin Stock</strong> to <strong>Allotted</strong> status. 
               Wait for Secondary Verification and Customer Confirmation before billing.
            </div>

            <div className="flex gap-4">
               <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} className="flex-1">Cancel</Button>
               <Button variant="primary" onClick={handleBulkAllot} className="flex-1">Confirm Allotment</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};