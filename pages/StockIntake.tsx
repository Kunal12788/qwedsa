import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Badge, Modal } from '../components/UI';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Gem, 
  CircleDot, 
  Link, 
  Link2, 
  Crown, 
  Sparkles, 
  Grid, 
  AlertCircle, 
  QrCode, 
  ScanLine, 
  Camera, 
  CheckCircle, 
  PackageCheck, 
  BoxSelect, 
  Scale, 
  X, 
  List, 
  Keyboard, 
  ShieldAlert, 
  Download, 
  Hash, 
  History, 
  User, 
  Clock, 
  PieChart, 
  FileText,
  Lock
} from 'lucide-react';
import { JEWELLERY_TYPES, PURITY_TYPES } from '../constants';
import { ProductStatus, Product } from '../types';

// Helper for Icons
const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'Ring': return <CircleDot size={20} />;
    case 'Necklace': return <Crown size={20} />;
    case 'Earrings': return <Sparkles size={20} />;
    case 'Bangle': return <CircleDot size={20} className="stroke-[3]" />;
    case 'Bracelet': return <Link2 size={20} />;
    case 'Chain': return <Link size={20} />;
    case 'Pendant': return <Gem size={20} />;
    default: return <Grid size={20} />;
  }
};

interface BatchRow {
  tempId: string;
  qrCodeId: string;
  category: string; // Dynamic category per row
  purity: string;
  goldWeight: string;
  stoneWeight: string;
  scannedImage?: string;
  isScanned: boolean;
}

export const StockIntake: React.FC = () => {
  const { products, addProduct, getPurityFactor, logAction, currentUser } = useAppStore();
  
  // Workflow State: Start directly at 'BATCH'
  const [step, setStep] = useState<'BATCH' | 'SUMMARY'>('BATCH');
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  
  // Export State
  const [exportingBatch, setExportingBatch] = useState<any | null>(null);
  
  // Generate Unique Batch ID
  const generateBatchId = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timePart = now.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `B-${datePart}-${timePart}-${rand}`;
  };

  const [currentBatchId, setCurrentBatchId] = useState(generateBatchId());

  // Scanner State
  const [scannerInput, setScannerInput] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  // Batch Data State - Initialize empty
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [globalError, setGlobalError] = useState('');

  // Auto-focus scanner on mount
  useEffect(() => {
    if (step === 'BATCH' && scannerInputRef.current) {
        scannerInputRef.current.focus();
    }
  }, [step]);

  // Handle Batch Export Trigger
  useEffect(() => {
    if (exportingBatch && window.html2pdf) {
      const element = document.getElementById('batch-detailed-report');
      if (element) {
        // Force scroll to top to ensure capture starts at 0,0 coordinates
        window.scrollTo(0, 0);

        const opt = {
          margin: 0, 
          filename: `Batch_Report_${exportingBatch.batchId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            scrollY: 0,
            logging: false
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all' }
        };
        
        // Wait for render
        setTimeout(() => {
           window.html2pdf().set(opt).from(element).save().then(() => {
             setExportingBatch(null); // Reset after export
           });
        }, 500);
      }
    }
  }, [exportingBatch]);

  // --- Derived State for Summary ---
  const stockSummary = useMemo(() => {
    // Filter only items currently IN_ADMIN_STOCK
    const inStock = products.filter(p => p.status === ProductStatus.IN_ADMIN_STOCK);
    
    // Group by Category and Calculate Fine Gold
    const summary = JEWELLERY_TYPES.map(type => {
      const items = inStock.filter(p => p.type === type);
      
      const totalNetWeight = items.reduce((sum, p) => sum + p.goldWeight, 0);
      
      // Calculate 24k Equivalent (Fine Gold)
      const totalFineWeight = items.reduce((sum, p) => {
        const factor = getPurityFactor(p.purity);
        return sum + (p.goldWeight * factor);
      }, 0);

      return {
        type,
        count: items.length,
        totalNetWeight,
        totalFineWeight
      };
    });

    const totalItems = inStock.length;
    const grandTotalFine = summary.reduce((sum, cat) => sum + cat.totalFineWeight, 0);

    return { categoryBreakdown: summary, totalItems, grandTotalFine };
  }, [products, getPurityFactor]);

  // --- Derived State for Batch History ---
  const batchHistory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    
    // Group by BatchID
    products.forEach(p => {
      if (p.batchId) {
        if (!grouped[p.batchId]) grouped[p.batchId] = [];
        grouped[p.batchId].push(p);
      }
    });

    // Transform to array and sort by date desc
    return Object.entries(grouped)
      .map(([batchId, items]) => {
        const creator = items[0]?.createdBy || 'Unknown Admin';
        const createdAt = items[0]?.createdAt;
        
        // Metrics
        const totalItems = items.length;
        const totalWeight = items.reduce((sum, i) => sum + i.goldWeight, 0);
        const totalFineWeight = items.reduce((sum, i) => sum + (i.goldWeight * getPurityFactor(i.purity)), 0);
        
        // Category Breakdown
        const categories: Record<string, { count: number, weight: number }> = {};
        items.forEach(i => {
          if (!categories[i.type]) categories[i.type] = { count: 0, weight: 0 };
          categories[i.type].count++;
          categories[i.type].weight += i.goldWeight;
        });

        // Status Logic
        // Live = ANY item is NOT completed/delivered/dispatched
        // Sold = ALL items are COMPLETED/DELIVERED/DISPATCHED
        const soldItems = items.filter(i => 
          i.status === ProductStatus.COMPLETED || 
          i.status === ProductStatus.DELIVERED || 
          i.status === ProductStatus.DISPATCHED
        ).length;
        
        const isSoldOut = soldItems === totalItems;
        const liveItems = totalItems - soldItems;

        return {
          batchId,
          creator,
          createdAt,
          totalItems,
          totalWeight,
          totalFineWeight,
          categories,
          isSoldOut,
          soldItems,
          liveItems,
          items // Full items reference
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [products, getPurityFactor]);

  // --- Derived State for Detail Modal ---
  const categoryDetails = useMemo(() => {
    if (!detailCategory) return null;
    
    const items = products.filter(p => p.status === ProductStatus.IN_ADMIN_STOCK && p.type === detailCategory);
    
    // Group by Purity
    const breakdown = items.reduce((acc, item) => {
      if (!acc[item.purity]) {
        acc[item.purity] = {
           count: 0,
           goldWeight: 0,
           stoneWeight: 0,
           fineWeight: 0
        };
      }
      acc[item.purity].count++;
      acc[item.purity].goldWeight += item.goldWeight;
      acc[item.purity].stoneWeight += item.stoneWeight;
      acc[item.purity].fineWeight += item.goldWeight * getPurityFactor(item.purity);
      return acc;
    }, {} as Record<string, { count: number, goldWeight: number, stoneWeight: number, fineWeight: number }>);

    return { breakdown, allItems: items };
  }, [detailCategory, products, getPurityFactor]);

  // --- Actions ---

  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scannerInput.trim();
    if (!code) return;

    if (batchRows.length >= 20) {
      setGlobalError('Maximum batch size of 20 items reached.');
      return;
    }

    // Check Duplicate in Batch
    if (batchRows.some(r => r.qrCodeId === code)) {
        setGlobalError(`Batch Duplicate: Item "${code}" is already in the current list.`);
        setScannerInput('');
        return;
    }

    // Check Duplicate in System (The Complaint Trigger)
    const exists = products.find(p => p.barcodeId === code);
    if (exists) {
        // Log the security incident details
        const incidentDetails = `DUPLICATE SCAN ATTEMPT: Admin '${currentUser?.name}' tried to re-scan existing Asset ID: ${exists.barcodeId}. Type: ${exists.type}, Weight: ${exists.goldWeight}g, Purity: ${exists.purity}. Status: ${exists.status}.`;
        
        logAction('SECURITY_ALERT', incidentDetails);

        setGlobalError(`SECURITY ALERT: Asset "${code}" already exists! Incident logged to Super Admin.`);
        setScannerInput('');
        return;
    }

    // Simulate Data Fetching/Decoding from QR
    const randomCategory = JEWELLERY_TYPES[Math.floor(Math.random() * JEWELLERY_TYPES.length)];
    const randomWeight = (Math.random() * 20 + 5).toFixed(2);
    const randomStone = (Math.random() * 2).toFixed(2);
    const randomImg = `https://picsum.photos/400/400?random=${Math.random()}`;

    const newRow: BatchRow = {
      tempId: Math.random().toString(36),
      qrCodeId: code,
      category: randomCategory,
      purity: PURITY_TYPES[1], // Default 22k
      goldWeight: randomWeight,
      stoneWeight: randomStone,
      scannedImage: randomImg,
      isScanned: true
    };

    setBatchRows(prev => [...prev, newRow]);
    setScannerInput('');
    setGlobalError('');
  };

  const removeRow = (tempId: string) => {
    setBatchRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  const updateRow = (tempId: string, field: keyof BatchRow, value: string | boolean) => {
    setBatchRows(prev => prev.map(row => {
      if (row.tempId === tempId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const validateAndSubmit = () => {
    setGlobalError('');
    if (batchRows.length === 0) {
        setGlobalError('Batch is empty. Scan items first.');
        return;
    }

    const validItems: any[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];
      
      if (!row.qrCodeId) {
        setGlobalError(`Row ${i + 1}: QR Code ID is missing.`);
        return;
      }
      if (!row.goldWeight || parseFloat(row.goldWeight) <= 0) {
        setGlobalError(`Row ${i + 1}: Invalid Gold Weight.`);
        return;
      }

      if (usedIds.has(row.qrCodeId)) {
        setGlobalError(`Row ${i + 1}: Duplicate ID "${row.qrCodeId}" in current batch.`);
        return;
      }
      usedIds.add(row.qrCodeId);

      const exists = products.find(p => p.barcodeId === row.qrCodeId);
      if (exists) {
        setGlobalError(`Row ${i + 1}: ID "${row.qrCodeId}" already exists in system.`);
        return;
      }

      const gw = parseFloat(row.goldWeight);
      const sw = parseFloat(row.stoneWeight);

      validItems.push({
        id: Math.random().toString(36).substr(2, 9),
        barcodeId: row.qrCodeId, 
        type: row.category,
        purity: row.purity,
        goldWeight: gw,
        stoneWeight: sw,
        totalWeight: gw + sw,
        otherMetalWeight: 0,
        diamondWeight: 0,
        imageUrl: row.scannedImage || `https://picsum.photos/400/400?random=${Math.random()}`,
        status: ProductStatus.IN_ADMIN_STOCK,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'System', // Capture Creator
        batchId: currentBatchId // Attach Unique Batch ID
      });
    }

    validItems.forEach(item => addProduct(item));
    
    // Move to Summary Step
    setBatchRows([]);
    setStep('SUMMARY');
  };

  const startNewSession = () => {
    setBatchRows([]);
    setCurrentBatchId(generateBatchId()); // Generate new unique code for next session
    setStep('BATCH');
  };

  const exportBatchToPDF = () => {
    if (!window.html2pdf) return;
    const element = document.getElementById('stock-batch-table');
    const opt = {
      margin: 10,
      filename: `Stock_Intake_${currentBatchId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Stock Intake</h2>
          <p className="text-slate-500 mt-1">Register mixed inventory batches via Secure QR Scanning.</p>
        </div>
        <div className="hidden md:block">
           <Badge status="IN_ADMIN_STOCK" />
        </div>
      </div>

      {step === 'BATCH' && (
        <div className="animate-slide-up space-y-6">
          {/* Universal Scanner Header */}
          <div className={`text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-colors duration-300 ${globalError.includes('SECURITY ALERT') ? 'bg-red-900' : 'bg-slate-900'}`}>
             
             {/* Batch ID Badge */}
             <div className="absolute top-4 left-4 z-20">
               <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                  <Hash size={14} className="text-gold-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Batch Ref:</span>
                  <span className="font-mono text-sm font-bold text-white">{currentBatchId}</span>
               </div>
             </div>

             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <QrCode size={120} />
             </div>

             <div className="flex flex-col md:flex-row gap-6 relative z-10 mt-8">
                {/* Scanner Input */}
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-3">
                      <ScanLine className="text-gold-400" size={20} />
                      <label className="text-sm font-bold text-gold-400 uppercase tracking-widest">Universal Scanner</label>
                   </div>
                   <form onSubmit={handleScannerSubmit} className="relative">
                      <input 
                        ref={scannerInputRef}
                        type="text" 
                        value={scannerInput}
                        onChange={(e) => {
                            setScannerInput(e.target.value);
                            if(globalError) setGlobalError(''); // Clear error on new input
                        }}
                        placeholder="Scan QR or Type ID and Press Enter..."
                        className={`w-full bg-slate-800 border-2 text-white text-lg font-mono font-bold rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-600 ${globalError.includes('SECURITY ALERT') ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-gold-500 focus:ring-gold-500/20'}`}
                        autoFocus
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                         <QrCode size={24} />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-700 px-2 py-1 rounded">ENTER</span>
                      </div>
                   </form>
                   <p className="text-xs text-slate-500 mt-2 ml-1">
                      Ready to scan. System will auto-detect category and weight from tag.
                   </p>
                </div>

                {/* Batch Stats */}
                <div className="md:w-48 border-l border-slate-700 pl-6 flex flex-col justify-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Batch</span>
                   <span className="text-4xl font-mono font-bold text-white mb-1">{batchRows.length} <span className="text-base text-slate-500">/ 20</span></span>
                   <span className="text-xs text-slate-500">Items Scanned</span>
                </div>
             </div>
          </div>

          {/* Batch Table */}
          <Card className="overflow-hidden p-0 border-0 min-h-[300px] flex flex-col">
             <div className="overflow-x-auto flex-1" id="stock-batch-table">
               {/* Hidden ID for PDF print */}
               <div className="p-4 bg-slate-100 border-b border-slate-200 hidden print:block">
                  <h1 className="text-xl font-bold">Stock Intake Report</h1>
                  <p className="text-sm font-mono mt-1">Batch ID: {currentBatchId}</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
               </div>

               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                   <tr>
                     <th className="p-4 w-12 text-center">#</th>
                     <th className="p-4 w-32">Scan ID</th>
                     <th className="p-4 w-20 text-center">Image</th>
                     <th className="p-4 w-40">Category</th>
                     <th className="p-4 w-32">Purity</th>
                     <th className="p-4">Net Gold (g)</th>
                     <th className="p-4 text-gold-600 w-24">Fine (24k)</th>
                     <th className="p-4">Stone (g)</th>
                     <th className="p-4 w-24">Total (g)</th>
                     <th className="p-4 w-16 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {batchRows.length === 0 ? (
                      <tr>
                         <td colSpan={10} className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                               <PackageCheck size={48} className="mb-4 opacity-30" />
                               <p>No items scanned yet.</p>
                               <p className="text-xs mt-1">Use the scanner above to start.</p>
                            </div>
                         </td>
                      </tr>
                   ) : (
                     batchRows.map((row, index) => {
                       const netGw = parseFloat(row.goldWeight || '0');
                       const sw = parseFloat(row.stoneWeight || '0');
                       const factor = getPurityFactor(row.purity);
                       const fineGw = netGw * factor;
                       const totalGw = netGw + sw;

                       return (
                         <tr key={row.tempId} className={`group transition-colors ${row.isScanned ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'}`}>
                           <td className="p-4 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                           <td className="p-4">
                             <div className="relative">
                                <input 
                                  type="text"
                                  value={row.qrCodeId}
                                  onChange={(e) => updateRow(row.tempId, 'qrCodeId', e.target.value)}
                                  placeholder="Scan..."
                                  className={`w-full bg-transparent border-none px-0 py-2 text-xs font-mono font-bold focus:ring-0 ${row.isScanned ? 'text-emerald-700' : 'text-slate-900'}`}
                                  readOnly={row.isScanned} // Locked if scanned
                                />
                             </div>
                           </td>
                           <td className="p-4 text-center">
                              {row.scannedImage ? (
                                 <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm mx-auto group-hover:scale-150 transition-transform origin-center z-10 relative">
                                    <img src={row.scannedImage} className="w-full h-full object-cover" />
                                 </div>
                              ) : (
                                 <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
                                    <Camera size={14} />
                                 </div>
                              )}
                           </td>
                           <td className="p-4">
                             {row.isScanned ? (
                               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold cursor-not-allowed opacity-80">
                                  <div className="text-slate-400">{getCategoryIcon(row.category)}</div>
                                  <span>{row.category}</span>
                                  <Lock size={12} className="ml-auto text-slate-300" />
                               </div>
                             ) : (
                               <div className="relative flex items-center gap-2">
                                 <select
                                   value={row.category}
                                   onChange={(e) => updateRow(row.tempId, 'category', e.target.value)}
                                   className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-500"
                                 >
                                   {JEWELLERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                               </div>
                             )}
                           </td>
                           <td className="p-4">
                             {row.isScanned ? (
                               <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold text-center cursor-not-allowed opacity-80">
                                  {row.purity}
                               </div>
                             ) : (
                               <select
                                 value={row.purity}
                                 onChange={(e) => updateRow(row.tempId, 'purity', e.target.value)}
                                 className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                               >
                                 {PURITY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                               </select>
                             )}
                           </td>
                           <td className="p-4">
                             {row.isScanned ? (
                               <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-bold cursor-not-allowed">
                                  {parseFloat(row.goldWeight).toFixed(2)}
                               </div>
                             ) : (
                               <input 
                                 type="number"
                                 step="0.01"
                                 value={row.goldWeight}
                                 onChange={(e) => updateRow(row.tempId, 'goldWeight', e.target.value)}
                                 placeholder="0.00"
                                 className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-gold-500 outline-none"
                               />
                             )}
                           </td>
                           <td className="p-4">
                              <div className="font-mono font-bold text-gold-600 bg-gold-50 px-2 py-1.5 rounded-lg border border-gold-100 text-right text-xs">
                                 {fineGw > 0 ? fineGw.toFixed(3) : '-'}
                              </div>
                           </td>
                           <td className="p-4">
                             {row.isScanned ? (
                               <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 font-medium cursor-not-allowed">
                                  {parseFloat(row.stoneWeight).toFixed(2)}
                               </div>
                             ) : (
                               <input 
                                 type="number"
                                 step="0.01"
                                 value={row.stoneWeight}
                                 onChange={(e) => updateRow(row.tempId, 'stoneWeight', e.target.value)}
                                 placeholder="0.00"
                                 className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                             )}
                           </td>
                           <td className="p-4">
                              <div className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 text-right text-xs">
                                 {totalGw > 0 ? totalGw.toFixed(2) : '-'}
                              </div>
                           </td>
                           <td className="p-4 text-center">
                             <button 
                               onClick={() => removeRow(row.tempId)}
                               className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                               title="Remove Item"
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
             
             {/* Footer Actions */}
             <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={exportBatchToPDF}
                    variant="outline"
                    size="sm"
                    disabled={batchRows.length === 0}
                    className="border-slate-200 hover:border-slate-300 text-slate-600"
                  >
                     <Download size={16} /> Export Batch
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                   {globalError && (
                     <div className={`text-xs font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg border ${globalError.includes('SECURITY') ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {globalError.includes('SECURITY') ? <ShieldAlert size={16} /> : <AlertCircle size={16} />} 
                        {globalError}
                     </div>
                   )}
                   <Button onClick={validateAndSubmit} variant="gold" className="px-8" disabled={batchRows.length === 0}>
                      <Save size={18} /> Confirm Batch Intake
                   </Button>
                </div>
             </div>
          </Card>
        </div>
      )}

      {step === 'SUMMARY' && (
        <div className="animate-fade-in space-y-8">
           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-emerald-900">Intake Successful</h3>
              <p className="text-emerald-700">Inventory database has been updated securely.</p>
              <p className="text-xs text-emerald-600 mt-2 font-mono">Batch ID: {currentBatchId}</p>
              
              <div className="mt-6 flex justify-center">
                 <Button onClick={startNewSession} size="lg" variant="primary">
                    <Plus size={20} /> Start New Intake Session
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Persistent Stock Overview */}
      <div className="animate-fade-in space-y-8 border-t border-slate-200 pt-8">
         <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <PackageCheck size={24} className="text-indigo-600" />
               Current Stock Overview
            </h3>
            <div className="flex gap-4">
               <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Items</p>
                  <p className="text-xl font-bold">{stockSummary.totalItems}</p>
               </div>
               <div className="bg-gold-500 text-white px-4 py-2 rounded-xl text-right shadow-lg shadow-gold-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Fine Gold (24k)</p>
                  <p className="text-xl font-bold">{stockSummary.grandTotalFine.toFixed(2)}g</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stockSummary.categoryBreakdown.map((cat) => (
               <div 
                 key={cat.type} 
                 onClick={() => setDetailCategory(cat.type)}
                 className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-gold-300 transition-colors group cursor-pointer relative"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors">
                        {getCategoryIcon(cat.type)}
                     </div>
                     <span className="text-2xl font-bold text-slate-900">{cat.count}</span>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-700">{cat.type}</p>
                     <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500 flex justify-between">
                          <span>Net Wt:</span>
                          <span className="font-medium text-slate-700">{cat.totalNetWeight.toFixed(2)}g</span>
                        </p>
                        <p className="text-xs text-slate-500 flex justify-between">
                          <span>Fine (24k):</span>
                          <span className="font-bold text-gold-600">{cat.totalFineWeight.toFixed(2)}g</span>
                        </p>
                     </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors rounded-xl pointer-events-none">
                     <span className="opacity-0 group-hover:opacity-100 bg-white shadow-lg text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-all">View Details</span>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* NEW SECTION: Batch Lifecycle Registry */}
      <div className="animate-fade-in space-y-6 pt-8 border-t border-slate-200">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <History size={20} />
            </div>
            <div>
               <h3 className="text-xl font-bold text-slate-900">Batch Lifecycle Registry</h3>
               <p className="text-xs text-slate-500">Track production batches from intake to final sale.</p>
            </div>
         </div>

         <div className="space-y-4">
            {batchHistory.length === 0 ? (
               <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <PackageCheck size={32} className="mx-auto mb-2 opacity-50"/>
                  <p className="text-sm">No batches recorded yet.</p>
               </div>
            ) : (
               batchHistory.map(batch => (
                  <div key={batch.batchId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                     {/* Batch Header */}
                     <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-10 rounded-full ${batch.isSoldOut ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="font-mono font-bold text-sm text-indigo-900">{batch.batchId}</span>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${batch.isSoldOut ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {batch.isSoldOut ? 'Sold Out' : 'Live Batch'}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                 <Clock size={10} /> {new Date(batch.createdAt).toLocaleString()}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                           <div className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                              <User size={14} className="text-indigo-500" />
                              <span className="font-bold">{batch.creator}</span>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Fine Wt</p>
                              <p className="font-mono font-bold text-gold-600">{batch.totalFineWeight.toFixed(3)}g</p>
                           </div>
                           
                           {/* Export Specific Batch Button */}
                           <button 
                              onClick={() => setExportingBatch(batch)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                              title="Download Report"
                           >
                              <FileText size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Batch Breakdown */}
                     <div className="p-4 grid md:grid-cols-12 gap-6 items-center">
                        {/* Progress */}
                        <div className="md:col-span-3">
                           <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-slate-600">Sales Progress</span>
                              <span className="text-indigo-600">{batch.soldItems} / {batch.totalItems} Sold</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                 className={`h-full transition-all duration-1000 ${batch.isSoldOut ? 'bg-slate-400' : 'bg-indigo-500'}`} 
                                 style={{ width: `${(batch.soldItems / batch.totalItems) * 100}%` }}
                              ></div>
                           </div>
                        </div>

                        {/* Category Composition */}
                        <div className="md:col-span-9 flex flex-wrap gap-2">
                           {Object.entries(batch.categories).map(([cat, value]) => {
                              const data = value as { count: number, weight: number };
                              return (
                              <div key={cat} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
                                 <div className="text-slate-400">{getCategoryIcon(cat)}</div>
                                 <div>
                                    <span className="font-bold text-slate-900">{data.count}x</span> {cat}
                                    <span className="text-slate-400 ml-1">({data.weight.toFixed(1)}g)</span>
                                 </div>
                              </div>
                           )})}
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Category Detail Modal */}
      <Modal 
        isOpen={!!detailCategory} 
        onClose={() => setDetailCategory(null)} 
        title={`${detailCategory} Stock Breakdown`}
      >
        {categoryDetails && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Pieces</p>
                   <p className="text-2xl font-bold text-slate-900">{categoryDetails.allItems.length}</p>
                </div>
                <div className="bg-gold-50 p-4 rounded-xl border border-gold-100">
                   <p className="text-xs text-gold-700 uppercase font-bold mb-1">Total Fine Gold (24k)</p>
                   <p className="text-2xl font-bold text-gold-900">
                     {Number(Object.values(categoryDetails.breakdown).reduce((sum: number, d: any) => sum + d.fineWeight, 0)).toFixed(3)}g
                   </p>
                </div>
             </div>

             <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                      <tr>
                         <th className="p-3">Purity (Karat)</th>
                         <th className="p-3 text-right">Count</th>
                         <th className="p-3 text-right">Stone Wt</th>
                         <th className="p-3 text-right">Gross Wt</th>
                         <th className="p-3 text-right">Fine (24k)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {Object.entries(categoryDetails.breakdown).sort().map(([purity, val]: [string, any]) => {
                         const data = val as { count: number, goldWeight: number, stoneWeight: number, fineWeight: number };
                         return (
                         <tr key={purity} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-indigo-700">{purity}</td>
                            <td className="p-3 text-right font-medium">{data.count}</td>
                            <td className="p-3 text-right text-slate-500">{Number(data.stoneWeight).toFixed(2)}g</td>
                            <td className="p-3 text-right text-slate-700">{Number(data.goldWeight).toFixed(2)}g</td>
                            <td className="p-3 text-right font-bold text-gold-600">{Number(data.fineWeight).toFixed(3)}g</td>
                         </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
             
             {/* Individual Items List */}
             <div className="mt-6">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                   <List size={16} /> Individual Items ({categoryDetails.allItems.length})
                </h4>
                <div className="overflow-y-auto max-h-[300px] border border-slate-200 rounded-xl custom-scrollbar">
                   <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 shadow-sm">
                         <tr>
                            <th className="p-3 w-32">Barcode ID</th>
                            <th className="p-3">Purity</th>
                            <th className="p-3 text-right">Gross Wt</th>
                            <th className="p-3 text-right">Stone Wt</th>
                            <th className="p-3 text-right">Fine Wt</th>
                            <th className="p-3 text-right">Batch ID</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                         {categoryDetails.allItems.sort((a,b) => b.goldWeight - a.goldWeight).map(item => {
                           const fineWt = item.goldWeight * getPurityFactor(item.purity);
                           return (
                             <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono font-bold text-slate-600">{item.barcodeId}</td>
                                <td className="p-3">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200">{item.purity}</span>
                                </td>
                                <td className="p-3 text-right font-medium">{item.goldWeight.toFixed(2)}g</td>
                                <td className="p-3 text-right text-slate-400">{item.stoneWeight.toFixed(2)}g</td>
                                <td className="p-3 text-right font-bold text-gold-600">{fineWt.toFixed(3)}g</td>
                                <td className="p-3 text-right font-mono text-slate-400 text-[10px]">{item.batchId || '-'}</td>
                             </tr>
                           )
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </Modal>

      {/* Hidden Report Container - Specific standalone configuration for Stock Intake */}
      {exportingBatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, background: 'white' }}>
            <div id="batch-detailed-report" className="bg-white text-slate-900 flex flex-col font-sans" style={{ width: '210mm', minHeight: '296mm', padding: '12mm', boxSizing: 'border-box' }}>
               {/* Compact Header */}
               <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-slate-900">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-slate-900 text-gold-500 rounded-xl flex items-center justify-center font-serif font-bold text-3xl shadow-sm">A</div>
                     <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight leading-none uppercase">Aurum <span className="text-gold-600">Enterprise</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1">Batch Intake Audit Registry</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Reference</div>
                     <div className="font-mono text-xl font-bold text-slate-900 tracking-tight bg-slate-100 px-3 py-1 rounded inline-block">{exportingBatch.batchId}</div>
                     <p className="text-[10px] text-slate-500 mt-1">Created: {new Date(exportingBatch.createdAt).toLocaleString()}</p>
                  </div>
               </div>

               {/* Compact Metrics Grid */}
               <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Officer In-Charge</p>
                     <p className="font-bold text-slate-800 text-sm truncate">{exportingBatch.creator}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Volume</p>
                     <p className="font-bold text-slate-900 text-lg">{exportingBatch.totalItems} <span className="text-xs font-normal text-slate-500">Units</span></p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross Wt</p>
                     <p className="font-bold text-slate-900 text-lg">{exportingBatch.totalWeight.toFixed(2)}<span className="text-xs font-normal text-slate-500">g</span></p>
                  </div>
                  <div className="bg-gold-50 p-3 rounded-lg border border-gold-200 shadow-sm">
                     <p className="text-[9px] font-bold text-gold-700 uppercase tracking-wider mb-1">Net Fine Gold (24k)</p>
                     <p className="font-bold text-gold-700 text-lg">{exportingBatch.totalFineWeight.toFixed(3)}<span className="text-xs font-normal text-gold-600">g</span></p>
                  </div>
               </div>

               {/* High Density Table */}
               <div className="flex-1">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b-2 border-slate-900">
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider w-8 text-center">#</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider">Barcode ID</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider">Category</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider">Purity</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider text-right">Gross Wt</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider text-right">Stone Wt</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider text-right text-gold-700">Fine Wt</th>
                           <th className="py-2 px-2 text-[9px] font-bold text-slate-900 uppercase tracking-wider text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="text-[10px] text-slate-600">
                        {exportingBatch.items.map((item: Product, idx: number) => {
                           const fineWt = item.goldWeight * getPurityFactor(item.purity);
                           const isEven = idx % 2 === 0;
                           return (
                              <tr key={item.id} className={`border-b border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/30'}`} style={{ pageBreakInside: 'avoid' }}>
                                 <td className="py-2 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                 <td className="py-2 px-2 font-mono font-bold text-slate-800">{item.barcodeId}</td>
                                 <td className="py-2 px-2 font-medium">{item.type}</td>
                                 <td className="py-2 px-2">
                                    <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600">{item.purity}</span>
                                 </td>
                                 <td className="py-2 px-2 text-right font-medium text-slate-900">{item.goldWeight.toFixed(2)}</td>
                                 <td className="py-2 px-2 text-right text-slate-400">{item.stoneWeight.toFixed(2)}</td>
                                 <td className="py-2 px-2 text-right font-bold text-gold-600">{fineWt.toFixed(3)}</td>
                                 <td className="py-2 px-2 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                                       item.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                                       item.status === 'IN_ADMIN_STOCK' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                       'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                       {item.status.replace(/_/g, ' ')}
                                    </span>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
               
               {/* Compact Footer */}
               <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-[8px] text-slate-400 leading-relaxed max-w-md">
                     <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">System Generated Report</p>
                     <p>Electronically generated by Aurum Enterprise Systems. Official audit record. Weights subject to verification.</p>
                     <p className="mt-0.5">ID: {exportingBatch.batchId} | Printed: {new Date().toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <div className="h-8 border-b border-slate-900 w-32 mb-1 ml-auto"></div>
                     <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Authorized Signatory</p>
                  </div>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};