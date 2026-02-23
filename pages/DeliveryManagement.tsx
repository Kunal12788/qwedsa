import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';
import { Card, Button, Badge, Modal } from '../components/UI';
import { Truck, Package, QrCode, ScanLine, CheckCircle2, History, Box, Search, CheckSquare, Printer, MapPin, Download } from 'lucide-react';
import { ProductStatus, DeliveryPackage, Customer, BillingRecord } from '../types';

// --- SHIPPING LABEL TEMPLATE (PORTAL) ---
const ShippingLabelTemplate: React.FC<{ pkg: DeliveryPackage | null; customer: Customer | undefined }> = ({ pkg, customer }) => {
  if (!pkg || !customer) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pkg.packageQrId}`;

  return createPortal(
    <div className="print-label-container">
      <style>{`
        @media screen {
          .print-label-container { display: none; }
        }
        @media print {
          body > *:not(.print-label-container) { display: none !important; }
          .print-label-container { 
            display: flex !important; 
            align-items: center; 
            justify-content: center; 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: white; 
            z-index: 9999; 
          }
          @page { margin: 0; size: 4in 6in; } 
        }
      `}</style>
      <div className="bg-white text-slate-900 border-4 border-slate-900 box-border p-4 flex flex-col" style={{ width: '4in', height: '6in', fontFamily: 'sans-serif' }}>
          
          {/* HEADER */}
          <div className="border-b-2 border-slate-900 pb-2 mb-2 flex justify-between items-start">
             <div>
               <h1 className="text-2xl font-bold uppercase tracking-tighter">Aurum</h1>
               <p className="text-[10px] font-bold uppercase">Express Logistics</p>
             </div>
             <div className="text-right">
                <h2 className="text-3xl font-bold">{pkg.productIds.length}</h2>
                <p className="text-[8px] font-bold uppercase">Items</p>
             </div>
          </div>

          {/* TO ADDRESS */}
          <div className="flex-1 py-2">
             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ship To:</p>
             <p className="text-xl font-bold leading-tight mb-1">{customer.legalName}</p>
             <p className="text-sm font-medium leading-snug">{customer.address || 'Address Not Provided'}</p>
             <p className="text-sm font-medium leading-snug mb-2">{customer.city}</p>
             <p className="text-xs font-bold">Ph: {customer.phone || 'N/A'}</p>
          </div>

          {/* FROM ADDRESS */}
          <div className="border-t border-slate-300 py-2 mb-2">
             <p className="text-[8px] font-bold text-slate-400 uppercase">From:</p>
             <p className="text-[10px] font-bold">Aurum Enterprise Ltd.</p>
             <p className="text-[10px]">123 Gold Vault Plaza, Mumbai - 400002</p>
          </div>

          {/* QR CODE & TRACKING */}
          <div className="border-t-4 border-slate-900 pt-4 text-center">
             <img src={qrUrl} alt="QR Code" className="w-32 h-32 mx-auto mb-2 mix-blend-multiply" />
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tracking Number</p>
             <p className="text-lg font-mono font-bold tracking-wider">{pkg.packageQrId}</p>
          </div>

          {/* FOOTER */}
          <div className="mt-auto pt-2 border-t border-slate-300 flex justify-between items-end">
             <div className="text-[8px]">
                <p>Ref Bill: {pkg.billId}</p>
                <p>Date: {new Date(pkg.dispatchedAt).toLocaleDateString()}</p>
             </div>
             <div className="text-2xl font-bold text-slate-900">
                {customer.city?.substring(0, 3).toUpperCase() || 'MUM'}
             </div>
          </div>
      </div>
    </div>,
    document.body
  );
};

export const DeliveryManagement: React.FC = () => {
  const { billingRecords, products, customers, dispatchPackage, deliverPackage, deliveryPackages } = useAppStore();
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'TRANSIT' | 'HISTORY'>('DISPATCH');

  // --- Dispatch State ---
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [scannedProductIds, setScannedProductIds] = useState<string[]>([]);
  
  // --- Delivery / Verification State ---
  const [scanPackageId, setScanPackageId] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  const [verifyingPackage, setVerifyingPackage] = useState<DeliveryPackage | null>(null);
  const [verifiedItems, setVerifiedItems] = useState<string[]>([]);

  // --- Printing State ---
  const [printingPkg, setPrintingPkg] = useState<DeliveryPackage | null>(null);

  // 1. Get Orders Ready for Dispatch 
  // Logic Update: Show bills that are NOT yet in deliveryPackages
  const readyForDispatchBills = billingRecords.filter(b => {
    const isDispatched = deliveryPackages.some(pkg => pkg.billId === b.id);
    return !isDispatched;
  });

  const inTransitPackages = deliveryPackages.filter(p => p.status === 'DISPATCHED');
  const deliveredPackages = deliveryPackages.filter(p => p.status === 'DELIVERED');

  // --- Dispatch Actions ---
  const handleOpenDispatch = (billId: string) => {
    setSelectedBillId(billId);
    setScannedProductIds([]);
  };

  const simulateScanItem = (productId: string) => {
    if (!scannedProductIds.includes(productId)) {
      setScannedProductIds(prev => [...prev, productId]);
    }
  };

  const confirmDispatch = () => {
    if (selectedBillId) {
      const bill = billingRecords.find(b => b.id === selectedBillId);
      if (bill) {
         const allProdIds = bill.items.map(i => i.productId);
         dispatchPackage(selectedBillId, allProdIds);
         setSelectedBillId(null);
         setActiveTab('TRANSIT');
      }
    }
  };

  // --- Printing Action ---
  const handlePrintLabel = (pkg: DeliveryPackage) => {
    setPrintingPkg(pkg);
    setTimeout(() => {
      window.print();
    }, 500); // Allow portal to render
  };

  // --- Delivery Actions ---
  const handleScanGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryError('');
    
    // Simulate finding the package by QR
    const pkg = deliveryPackages.find(p => p.packageQrId === scanPackageId);
    
    if (pkg) {
       if (pkg.status === 'DELIVERED') {
          setDeliveryError('This package has already been delivered.');
       } else {
          setVerifyingPackage(pkg);
          setVerifiedItems([]); // Reset item checklist
       }
    } else {
       setDeliveryError('Invalid Package QR. Shipment not found.');
    }
  };

  const toggleVerifyItem = (productId: string) => {
    if (verifiedItems.includes(productId)) {
      setVerifiedItems(prev => prev.filter(id => id !== productId));
    } else {
      setVerifiedItems(prev => [...prev, productId]);
    }
  };

  const finalizeDelivery = () => {
    if (verifyingPackage) {
      deliverPackage(verifyingPackage.packageQrId);
      setVerifyingPackage(null);
      setScanPackageId('');
      setVerifiedItems([]);
      setActiveTab('HISTORY');
    }
  };

  const exportDeliveryPDF = () => {
    if (!window.html2pdf) return;
    const element = document.getElementById('delivery-content-area');
    const opt = {
      margin: 10,
      filename: `Delivery_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  // Helper
  const currentBill = readyForDispatchBills.find(b => b.id === selectedBillId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Delivery Logistics</h2>
            <p className="text-slate-500 mt-1">Group, Dispatch, and Verify Deliveries.</p>
         </div>
         <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" onClick={exportDeliveryPDF}>
               <Download size={16} /> Export Report
            </Button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                 onClick={() => setActiveTab('DISPATCH')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'DISPATCH' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
               >
                  <Package size={16} /> Dispatch Queue
               </button>
               <button 
                 onClick={() => setActiveTab('TRANSIT')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'TRANSIT' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
               >
                  <Truck size={16} /> In Transit
               </button>
               <button 
                 onClick={() => setActiveTab('HISTORY')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
               >
                  <History size={16} /> History
               </button>
            </div>
         </div>
      </div>

      <div id="delivery-content-area">
         {activeTab === 'DISPATCH' && (
           <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                 <Box className="text-indigo-600 mt-1" size={20} />
                 <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Logistics Queue</h4>
                    <p className="text-xs text-indigo-700 mt-1">
                       Orders appear here immediately after billing generation. Payment status does not block grouping and dispatch.
                    </p>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {readyForDispatchBills.length === 0 ? (
                   <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Package size={48} className="mx-auto mb-4 opacity-30 text-slate-400" />
                      <p className="text-slate-500 font-bold">No orders ready for grouping.</p>
                   </div>
                 ) : (
                   readyForDispatchBills.map(bill => {
                      const cust = customers.find(c => c.id === bill.customerId);
                      return (
                        <Card key={bill.id} className="relative group hover:border-indigo-200 transition-colors">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                    {cust?.legalName.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900 text-sm">{cust?.legalName}</p>
                                    <p className="text-xs text-slate-500">{cust?.uniqueName}</p>
                                 </div>
                              </div>
                              <Badge status="BILLED" />
                           </div>
                           
                           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs space-y-2">
                              <div className="flex justify-between">
                                 <span className="text-slate-500">Bill Ref:</span>
                                 <span className="font-mono font-bold text-slate-700">{bill.id}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-slate-500">Payment:</span>
                                 <span className={`font-bold ${bill.paymentReceived ? 'text-emerald-600' : 'text-red-500'}`}>
                                   {bill.paymentReceived ? 'Paid' : 'Pending'}
                                 </span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-slate-500">Destination:</span>
                                 <span className="font-bold text-slate-900 truncate max-w-[150px]">{cust?.city || 'N/A'}</span>
                              </div>
                           </div>

                           <Button className="w-full" onClick={() => handleOpenDispatch(bill.id)}>
                              <ScanLine size={16} /> Group & Dispatch
                           </Button>
                        </Card>
                      );
                   })
                 )}
              </div>
           </div>
         )}

         {activeTab === 'TRANSIT' && (
            <div className="grid lg:grid-cols-12 gap-8">
               {/* Verification Scanner */}
               <div className="lg:col-span-4" data-html2canvas-ignore="true">
                  <Card title="Delivery Verification" className="sticky top-6">
                     <div className="bg-slate-900 rounded-xl p-6 text-center mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:10px_10px] opacity-20"></div>
                        <QrCode size={64} className="text-white mx-auto mb-4 opacity-90 relative z-10" />
                        <p className="text-white font-bold text-sm relative z-10">Scan Group QR</p>
                        <p className="text-slate-400 text-xs mt-1 relative z-10">To verify contents at doorstep</p>
                     </div>
                     <form onSubmit={handleScanGroup}>
                        <div className="space-y-4">
                           <div className="relative">
                              <ScanLine className="absolute left-4 top-3.5 text-slate-400 animate-pulse" size={20} />
                              <input 
                                 type="text" 
                                 placeholder="PKG-XXXX-XXXX" 
                                 className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase text-slate-800"
                                 value={scanPackageId}
                                 onChange={e => {
                                    setScanPackageId(e.target.value);
                                    setDeliveryError('');
                                 }}
                              />
                           </div>
                           <Button variant="primary" className="w-full py-4" disabled={!scanPackageId}>
                              Verify Contents
                           </Button>
                           {deliveryError && (
                              <p className="text-xs text-red-500 text-center font-bold bg-red-50 p-2 rounded animate-shake">{deliveryError}</p>
                           )}
                        </div>
                     </form>
                  </Card>
               </div>

               {/* List Panel */}
               <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dispatched / Left Company ({inTransitPackages.length})</h3>
                  </div>
                  
                  {inTransitPackages.length === 0 ? (
                     <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No packages currently active.
                     </div>
                  ) : (
                     inTransitPackages.map(pkg => {
                        const cust = customers.find(c => c.id === pkg.customerId);
                        return (
                           <div key={pkg.packageQrId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-indigo-300 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                    <Truck size={24} />
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{pkg.packageQrId}</span>
                                       <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase">Dispatched</span>
                                    </div>
                                    <p className="font-bold text-slate-900 mt-1">{cust?.legalName}</p>
                                    <p className="text-xs text-slate-500">{pkg.productIds.length} Items Packed • {new Date(pkg.dispatchedAt).toLocaleTimeString()}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="text-right hidden md:block mr-4">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Destination</p>
                                    <p className="font-bold text-slate-700">{cust?.city}</p>
                                 </div>
                                 <button 
                                    onClick={() => handlePrintLabel(pkg)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                    data-html2canvas-ignore="true"
                                 >
                                    <Printer size={14} /> Print Label
                                 </button>
                              </div>
                           </div>
                        )
                     })
                  )}
               </div>
            </div>
         )}

         {activeTab === 'HISTORY' && (
            <Card className="overflow-hidden p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                        <tr>
                           <th className="p-4">Package QR</th>
                           <th className="p-4">Customer</th>
                           <th className="p-4">Timeline</th>
                           <th className="p-4 text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {deliveredPackages.map(pkg => {
                           const cust = customers.find(c => c.id === pkg.customerId);
                           return (
                              <tr key={pkg.packageQrId} className="hover:bg-slate-50/50">
                                 <td className="p-4 font-mono font-bold text-indigo-600">{pkg.packageQrId}</td>
                                 <td className="p-4">
                                    <p className="font-bold text-slate-900">{cust?.legalName}</p>
                                    <p className="text-xs text-slate-500">{cust?.city}</p>
                                 </td>
                                 <td className="p-4 text-xs text-slate-600">
                                    <p>Out: {new Date(pkg.dispatchedAt).toLocaleDateString()}</p>
                                    <p className="text-emerald-600 font-bold">In: {pkg.deliveredAt ? new Date(pkg.deliveredAt).toLocaleDateString() : '-'}</p>
                                 </td>
                                 <td className="p-4 text-right">
                                    <Badge status="DELIVERED" />
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </Card>
         )}
      </div>

      {/* Dispatch Modal (Grouping) */}
      <Modal isOpen={!!selectedBillId} onClose={() => setSelectedBillId(null)} title="Group & Dispatch Order">
         {currentBill && (
            <div className="space-y-6">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <div>
                     <p className="text-indigo-900 font-bold text-sm">Grouping Order #{currentBill.id}</p>
                     <p className="text-indigo-700 text-xs mt-1">Scan individual items to add to shipment group.</p>
                  </div>
                  <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-900">{scannedProductIds.length} / {currentBill.items.length}</p>
                      <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">Packed</p>
                  </div>
               </div>

               <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {currentBill.items.map(item => {
                     const isScanned = scannedProductIds.includes(item.productId);
                     return (
                        <div key={item.productId} className={`p-3 rounded-lg border flex justify-between items-center ${isScanned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                           <div>
                              <p className="font-bold text-sm text-slate-900">{item.productType}</p>
                              <p className="text-xs font-mono text-slate-500">{item.barcodeId}</p>
                           </div>
                           {isScanned ? (
                              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                 <CheckCircle2 size={16} /> Packed
                              </div>
                           ) : (
                              <button 
                                 onClick={() => simulateScanItem(item.productId)}
                                 className="px-3 py-1 bg-slate-900 text-white text-xs rounded hover:bg-slate-700 flex items-center gap-1"
                              >
                                 <QrCode size={12} /> Scan
                              </button>
                           )}
                        </div>
                     )
                  })}
               </div>

               <div className="pt-4 border-t border-slate-100">
                  <Button 
                     variant="gold" 
                     className="w-full py-4" 
                     disabled={scannedProductIds.length !== currentBill.items.length}
                     onClick={confirmDispatch}
                  >
                     <Package size={20} /> Generate Group QR & Dispatch
                  </Button>
               </div>
            </div>
         )}
      </Modal>

      {/* Verification Modal (Delivery) */}
      <Modal isOpen={!!verifyingPackage} onClose={() => setVerifyingPackage(null)} title="Verify Package Contents">
         {verifyingPackage && (
            <div className="space-y-6">
               <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center gap-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                     <QrCode size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Group QR Scanned</p>
                     <p className="font-mono text-lg font-bold text-gold-400">{verifyingPackage.packageQrId}</p>
                  </div>
               </div>

               <div className="text-sm font-bold text-slate-500 uppercase tracking-wide flex justify-between items-center">
                  <span>Manifest Checklist</span>
                  <span>{verifiedItems.length} / {verifyingPackage.productIds.length} Verified</span>
               </div>

               <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {products.filter(p => verifyingPackage.productIds.includes(p.id)).map(product => {
                     const isChecked = verifiedItems.includes(product.id);
                     return (
                        <div 
                           key={product.id} 
                           onClick={() => toggleVerifyItem(product.id)}
                           className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                        >
                           <div className="flex items-center gap-3">
                              <img src={product.imageUrl} className="w-10 h-10 rounded bg-slate-100 object-cover" />
                              <div>
                                 <p className="font-bold text-sm text-slate-900">{product.type}</p>
                                 <p className="text-xs font-mono text-slate-500">{product.barcodeId}</p>
                              </div>
                           </div>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                              <CheckCircle2 size={14} />
                           </div>
                        </div>
                     )
                  })}
               </div>

               <div className="pt-2">
                  <Button 
                     variant="success" 
                     className="w-full py-4" 
                     disabled={verifiedItems.length !== verifyingPackage.productIds.length}
                     onClick={finalizeDelivery}
                  >
                     <CheckCircle2 size={20} /> Confirm Full Delivery
                  </Button>
                  {verifiedItems.length !== verifyingPackage.productIds.length && (
                     <p className="text-center text-xs text-red-400 mt-2 font-bold">Must verify all items in the group before completing delivery.</p>
                  )}
               </div>
            </div>
         )}
      </Modal>

      {/* Printing Portal */}
      <ShippingLabelTemplate 
        pkg={printingPkg} 
        customer={printingPkg ? customers.find(c => c.id === printingPkg.customerId) : undefined} 
      />
    </div>
  );
};