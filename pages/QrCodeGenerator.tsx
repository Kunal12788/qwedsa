
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { useAppStore } from '../store';
import { Card, Button, Input, Select } from '../components/UI';
import { QrCode, Printer, Search, CheckSquare, Square, Tag, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Product, ProductStatus } from '../types';
import { JEWELLERY_TYPES, PURITY_TYPES } from '../constants';

// --- INVENTORY TAG TEMPLATE (Portal) ---
const InventoryTagTemplate: React.FC<{ items: any[] | null }> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return createPortal(
    <div className="qr-print-container">
      <style>{`
        @media screen {
          .qr-print-container { display: none; }
        }
        @media print {
          body > *:not(.qr-print-container) { display: none !important; }
          .qr-print-container { 
            display: grid !important; 
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            padding: 10px;
            width: 100%;
            background: white; 
            z-index: 9999; 
            position: absolute;
            top: 0;
            left: 0;
          }
          @page { margin: 0; size: A4; } 
          .qr-tag {
             border: 1px dashed #ccc;
             padding: 10px;
             page-break-inside: avoid;
             display: flex;
             align-items: center;
             gap: 10px;
             font-family: sans-serif;
             height: 140px;
          }
        }
      `}</style>
      
      {items.map((item, idx) => (
         <div key={idx} className="qr-tag">
            {/* QR Code Section */}
            <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
               <QRCode 
                  value={JSON.stringify(item.qrData) || ""} 
                  size={80} 
                  level="L"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
               />
            </div>
            
            {/* Details Section */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
               <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.type}</h3>
               <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>ID: {item.barcodeId}</p>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', fontSize: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Purity:</span> {item.purity}
                  </div>
                  {item.goldWeight > 0 ? (
                      <>
                        <div><span style={{ fontWeight: 'bold' }}>Net:</span> {item.goldWeight.toFixed(2)}g</div>
                        <div><span style={{ fontWeight: 'bold' }}>Total:</span> {item.totalWeight.toFixed(2)}g</div>
                      </>
                  ) : (
                      <div style={{ gridColumn: 'span 2', color: '#999', fontStyle: 'italic' }}>
                        Weight Pending Intake
                      </div>
                  )}
               </div>
               <div style={{ fontSize: '8px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#999' }}>
                  {item.status === 'NEW_TAG' ? 'PRE-INTAKE TAG' : 'INVENTORY ASSET'}
               </div>
            </div>
         </div>
      ))}
    </div>,
    document.body
  );
};

export const QrCodeGenerator: React.FC = () => {
  const { products, getPurityFactor } = useAppStore();
  
  // Tabs: NEW (Pre-stock) or EXISTING (Reprint)
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW');

  // --- NEW TAG STATE ---
  const [newCategory, setNewCategory] = useState(JEWELLERY_TYPES[0]);
  const [newPurity, setNewPurity] = useState(PURITY_TYPES[1]); // Default 22k
  const [newQuantity, setNewQuantity] = useState(10);
  const [generatedTags, setGeneratedTags] = useState<any[]>([]);

  // --- EXISTING TAG STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // --- SHARED PRINT STATE ---
  const [printingItems, setPrintingItems] = useState<any[] | null>(null);

  // Filter available products for existing tab
  const availableProducts = products.filter(p => 
     p.status !== ProductStatus.COMPLETED && p.status !== ProductStatus.DELIVERED
  );

  const displayedProducts = availableProducts.filter(p => 
     p.barcodeId.includes(searchTerm) || 
     p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- HANDLERS FOR EXISTING ---
  const toggleSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
       setSelectedProductIds(prev => prev.filter(pid => pid !== id));
    } else {
       setSelectedProductIds(prev => [...prev, id]);
    }
  };

  const toggleSelectAll = () => {
     if (selectedProductIds.length === displayedProducts.length) {
        setSelectedProductIds([]);
     } else {
        setSelectedProductIds(displayedProducts.map(p => p.id));
     }
  };

  // --- HANDLERS FOR NEW ---
  const handleGenerateNewTags = () => {
    const timestamp = Date.now().toString().slice(-6);
    const tags = Array.from({ length: newQuantity }).map((_, i) => {
        const id = `TAG-${timestamp}-${i + 1}`;
        return {
            id: id,
            barcodeId: id,
            type: newCategory,
            purity: newPurity,
            goldWeight: 0, // Placeholder
            stoneWeight: 0,
            totalWeight: 0,
            fineWeight: 0,
            imageUrl: '',
            status: 'NEW_TAG',
            // Minimal Payload for Pre-Intake
            qrData: {
                id: id,
                t: newCategory, // Short key for Type
                p: newPurity    // Short key for Purity
            }
        };
    });
    setGeneratedTags(tags);
  };

  // --- PRINT LOGIC ---
  const handlePrint = () => {
     let itemsToPrint: any[] = [];

     if (mode === 'NEW') {
         itemsToPrint = generatedTags;
     } else {
         itemsToPrint = products
            .filter(p => selectedProductIds.includes(p.id))
            .map(p => {
               const fineWeight = p.goldWeight * getPurityFactor(p.purity);
               return {
                  ...p,
                  fineWeight,
                  qrData: {
                     id: p.barcodeId,
                     t: p.type,
                     p: p.purity,
                     gw: p.goldWeight,
                     sw: p.stoneWeight,
                     img: p.imageUrl
                  }
               };
            });
     }
     
     setPrintingItems(itemsToPrint);
     
     setTimeout(() => {
        window.print();
     }, 500);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">QR Tag Generator</h2>
            <p className="text-slate-500 mt-1">Create tags for new inventory or reprint existing labels.</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('NEW')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'NEW' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <Plus size={16} /> New Batch
            </button>
            <button 
              onClick={() => setMode('EXISTING')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'EXISTING' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <RefreshCw size={16} /> Reprint
            </button>
         </div>
      </div>

      {mode === 'NEW' ? (
          <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                  <Card title="Batch Configuration">
                      <div className="space-y-4">
                          <Select label="Jewellery Type" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                              {JEWELLERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </Select>
                          <Select label="Gold Purity" value={newPurity} onChange={e => setNewPurity(e.target.value)}>
                              {PURITY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                          </Select>
                          <Input 
                             label="Quantity to Generate" 
                             type="number" 
                             min={1} 
                             max={100} 
                             value={newQuantity} 
                             onChange={e => setNewQuantity(parseInt(e.target.value))} 
                          />
                          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 flex gap-2">
                             <AlertCircle size={16} className="shrink-0" />
                             <p>
                               Generating <strong>{newQuantity}</strong> tags for <strong>{newPurity} {newCategory}</strong>.
                               These tags will have unique IDs but 0 weight. Weights will be captured during Stock Intake scan.
                             </p>
                          </div>
                          <Button variant="gold" className="w-full" onClick={handleGenerateNewTags}>
                             Generate Tags
                          </Button>
                      </div>
                  </Card>
              </div>

              <div className="lg:col-span-8">
                  {generatedTags.length > 0 ? (
                      <Card 
                        title={`Generated Batch (${generatedTags.length})`} 
                        action={
                            <Button onClick={handlePrint} size="sm">
                                <Printer size={16} /> Print Batch
                            </Button>
                        }
                      >
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
                              {generatedTags.map((tag, idx) => (
                                  <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col items-center text-center shadow-sm">
                                      <div className="w-24 h-24 mb-2">
                                         <QRCode 
                                            value={JSON.stringify(tag.qrData)} 
                                            size={96} 
                                            level="L"
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                         />
                                      </div>
                                      <p className="font-bold text-slate-900 text-sm">{tag.type}</p>
                                      <p className="text-[10px] font-mono text-slate-500">{tag.id}</p>
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-1 font-bold">
                                         {tag.purity}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      </Card>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-12">
                          <Tag size={48} className="mb-4 opacity-50" />
                          <p>Configure batch details and click Generate.</p>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          /* EXISTING INVENTORY MODE */
          <div className="grid lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 space-y-4">
                {/* Search & Filter */}
                <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                         type="text" 
                         placeholder="Search by Barcode ID or Type..." 
                         className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <button 
                      onClick={toggleSelectAll}
                      className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                   >
                      {displayedProducts.length > 0 && selectedProductIds.length === displayedProducts.length ? <CheckSquare size={18} /> : <Square size={18} />}
                      Select All
                   </button>
                </div>

                {/* Product List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                   {displayedProducts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                         <Tag size={48} className="mx-auto mb-2 opacity-30" />
                         <p>No products found in inventory.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                              <tr>
                                 <th className="p-4 w-10">Select</th>
                                 <th className="p-4">Item Details</th>
                                 <th className="p-4">Weights (g)</th>
                                 <th className="p-4">Purity</th>
                                 <th className="p-4">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {displayedProducts.map(p => {
                                 const isSelected = selectedProductIds.includes(p.id);
                                 return (
                                    <tr 
                                       key={p.id} 
                                       className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                       onClick={() => toggleSelect(p.id)}
                                    >
                                       <td className="p-4">
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                             {isSelected && <CheckSquare size={14} />}
                                          </div>
                                       </td>
                                       <td className="p-4">
                                          <div className="flex items-center gap-3">
                                             <img src={p.imageUrl} className="w-10 h-10 rounded bg-slate-100 object-cover" />
                                             <div>
                                                <p className="font-bold text-slate-900">{p.type}</p>
                                                <p className="text-xs font-mono text-slate-500">{p.barcodeId}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="p-4">
                                          <div className="text-xs space-y-0.5">
                                             <div className="flex justify-between w-24"><span className="text-slate-400">Gross:</span> <span className="font-bold">{p.goldWeight}</span></div>
                                          </div>
                                       </td>
                                       <td className="p-4">
                                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-200">{p.purity}</span>
                                       </td>
                                       <td className="p-4">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.status.replace(/_/g, ' ')}</span>
                                       </td>
                                    </tr>
                                 )
                              })}
                           </tbody>
                        </table>
                      </div>
                   )}
                </div>
             </div>

             {/* Preview Panel for Existing */}
             <div className="lg:col-span-4">
                <Card title="Live Tag Preview" className="sticky top-6">
                   <div className="bg-slate-100 p-6 rounded-xl flex items-center justify-center min-h-[200px] border border-dashed border-slate-300">
                      {selectedProductIds.length > 0 ? (
                         <div className="bg-white p-4 shadow-md w-full max-w-[280px] border border-slate-200 rounded">
                            {(() => {
                               const lastId = selectedProductIds[selectedProductIds.length - 1];
                               const p = products.find(prod => prod.id === lastId);
                               if (!p) return null;
                               
                               const qrData = {
                                  id: p.barcodeId,
                                  t: p.type,
                                  p: p.purity,
                                  gw: p.goldWeight,
                                  sw: p.stoneWeight,
                                  img: p.imageUrl
                               };

                               return (
                                  <div className="flex gap-4 items-center">
                                     <div className="w-20 h-20 shrink-0">
                                        <QRCode 
                                           value={JSON.stringify(qrData) || ""} 
                                           size={80} 
                                           level="L"
                                           style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        />
                                     </div>
                                     <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold uppercase text-slate-900">{p.type}</h3>
                                        <p className="text-[10px] text-slate-500 mb-1">ID: {p.barcodeId}</p>
                                        <div className="text-[10px] text-slate-700">
                                           <div><span className="font-bold">Pur:</span> {p.purity}</div>
                                           <div><span className="font-bold">Net:</span> {p.goldWeight}g</div>
                                        </div>
                                     </div>
                                  </div>
                               );
                            })()}
                         </div>
                      ) : (
                         <div className="text-center text-slate-400">
                            <QrCode size={40} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Select an item to view preview</p>
                         </div>
                      )}
                   </div>
                   <Button onClick={handlePrint} disabled={selectedProductIds.length === 0} variant="primary" className="w-full mt-4">
                      <Printer size={18} /> Print {selectedProductIds.length} Tags
                   </Button>
                </Card>
             </div>
          </div>
      )}
      
      {/* Hidden Print Portal */}
      <InventoryTagTemplate items={printingItems} />
    </div>
  );
};
