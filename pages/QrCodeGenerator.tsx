
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useAppStore } from '../store';
import { Card, Button, Input, Select } from '../components/UI';
import { Printer, Trash2, Plus, History, Layers, Tag, ArrowRight, CheckCircle, Edit3 } from 'lucide-react';
import { JEWELLERY_TYPES, PURITY_TYPES } from '../constants';
import { TagItem, UserRole } from '../types';

export const QrCodeGenerator: React.FC = () => {
  const { 
    currentUser,
    tagBatch, 
    draftTags,
    generatedTagsHistory, 
    createDraftTag,
    finalizeTag,
    addToBatch, 
    removeFromBatch, 
    saveBatchToHistory, 
    getPurityFactor,
    addNotification
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ENTRY' | 'FINALIZE' | 'BATCH' | 'HISTORY'>('ENTRY');
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // --- PDF GENERATION LOGIC ---
  const handleDownloadPDF = async () => {
    const originalElement = document.getElementById('print-container');
    if (!originalElement) return;

    // Clone the element to ensure it's captured fully without scrollbars or modal constraints
    const clone = originalElement.cloneNode(true) as HTMLElement;
    
    // Set explicit A4 pixel dimensions (at 96 DPI) to ensure consistent rendering across devices
    // A4 is 210mm x 297mm. At 96 DPI: 793.7px x 1122.5px
    const A4_WIDTH_PX = 794;
    const A4_HEIGHT_PX = 1123;

    clone.id = 'print-container-clone';
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.height = `${A4_HEIGHT_PX}px`;
    clone.style.zIndex = '99999';
    clone.style.background = 'white';
    clone.style.margin = '0';
    clone.style.padding = '5mm'; // Ensure padding matches the original
    clone.style.overflow = 'hidden';
    clone.style.pointerEvents = 'none';
    
    // Append to body
    document.body.appendChild(clone);

    // @ts-ignore
    const opt = {
      margin: 0,
      filename: `Aurum_Tags_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, // Higher scale for better quality
        useCORS: true, 
        logging: false,
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        windowWidth: A4_WIDTH_PX,
        windowHeight: A4_HEIGHT_PX,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(clone).save();
      
      setShowPdfPreview(false);
      saveBatchToHistory();
      addNotification('PDF Exported', 'Labels generated and batch saved to history.', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      addNotification('Export Failed', 'Could not generate PDF.', 'error');
    } finally {
      // Cleanup
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  };

  const handleExportPDF = () => {
    if (tagBatch.length === 0) return;
    setShowPdfPreview(true);
  };

  // Set initial tab based on role
  useEffect(() => {
    if (currentUser?.role === UserRole.TAG_FINALIZER_ADMIN) {
      setActiveTab('FINALIZE');
    } else {
      setActiveTab('ENTRY');
    }
  }, [currentUser]);

  // --- ENTRY STATE (Step 1) ---
  const [type, setType] = useState(JEWELLERY_TYPES[0]);
  const [purity, setPurity] = useState(PURITY_TYPES[1]); // Default 22k
  const [goldWeight, setGoldWeight] = useState<string>(''); // Net Weight
  
  // --- FINALIZE STATE (Step 2) ---
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [totalWeightInput, setTotalWeightInput] = useState<string>(''); // Gross Weight

  // Computed Values for Entry
  const net = parseFloat(goldWeight) || 0;
  const fine = net * getPurityFactor(purity);

  const handleCreateDraft = () => {
    if (net <= 0) {
      addNotification('Invalid Weight', 'Gold weight must be greater than 0', 'error');
      return;
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const id = `J-${dateStr}-${random}`;

    const newTag: TagItem = {
      id,
      type,
      purity,
      goldWeight: net,
      totalWeight: 0, // Pending
      stoneWeight: 0, // Pending
      fineWeight: fine,
      status: 'DRAFT',
      createdBy: currentUser?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };

    createDraftTag(newTag);
    // Reset weight, keep type/purity
    setGoldWeight('');
  };

  const handleFinalize = (draft: TagItem) => {
    const gross = parseFloat(totalWeightInput);
    if (!gross || gross <= 0) {
      addNotification('Invalid Weight', 'Total weight must be valid', 'error');
      return;
    }
    if (gross < draft.goldWeight) {
      addNotification('Invalid Weight', 'Total weight cannot be less than Gold weight', 'error');
      return;
    }

    finalizeTag(draft.id, gross);
    setSelectedDraftId(null);
    setTotalWeightInput('');
  };

  // const handleExportPDF = () => { ... } // Removed duplicate

  const canViewEntry = currentUser?.role === UserRole.TAG_ENTRY_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.QR_MANAGER;
  const canViewFinalize = currentUser?.role === UserRole.TAG_FINALIZER_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.QR_MANAGER;

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Tag Manager</h2>
          <p className="text-slate-500 mt-1">Generate Smart QR Labels for Inventory</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {canViewEntry && (
            <button 
              onClick={() => setActiveTab('ENTRY')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'ENTRY' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
              <Plus size={16} /> Step 1: Entry
            </button>
          )}
          {canViewFinalize && (
            <>
              <button 
                onClick={() => setActiveTab('FINALIZE')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'FINALIZE' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                <Edit3 size={16} /> Step 2: Finalize ({draftTags.length})
              </button>
              <button 
                onClick={() => setActiveTab('BATCH')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'BATCH' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                <Layers size={16} /> Batch ({tagBatch.length})
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                <History size={16} /> History
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- ENTRY TAB (Step 1) --- */}
      {activeTab === 'ENTRY' && canViewEntry && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card title="Step 1: Gold Details">
              <div className="space-y-4">
                <Select label="Jewelry Type" value={type} onChange={e => setType(e.target.value)}>
                  {JEWELLERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                
                <Select label="Gold Purity" value={purity} onChange={e => setPurity(e.target.value)}>
                  {PURITY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>

                <Input 
                  label="Gold Weight (Net) (g)" 
                  type="number" 
                  step="0.01"
                  value={goldWeight} 
                  onChange={e => setGoldWeight(e.target.value)} 
                  placeholder="0.00"
                  helperText="Enter weight of gold only. Stone weight will be added later."
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">24k Equivalent:</span>
                    <span className="font-bold text-gold-600">{fine.toFixed(2)} g</span>
                  </div>
                </div>

                <Button variant="primary" className="w-full" onClick={handleCreateDraft}>
                  Save Draft for Finalization <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-slate-400 text-center">
              <Tag size={64} className="mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-slate-500">Draft Creation Mode</h3>
              <p className="max-w-xs mx-auto mt-2">
                Enter the gold details here. The Finalizer Admin will add stone weight and generate the QR code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- FINALIZE TAB (Step 2) --- */}
      {activeTab === 'FINALIZE' && canViewFinalize && (
        <div className="space-y-6">
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftTags.length === 0 ? (
                 <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle size={48} className="mx-auto text-emerald-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">All Caught Up!</h3>
                    <p className="text-slate-400">No drafts pending finalization.</p>
                 </div>
              ) : (
                 draftTags.map(draft => (
                    <div key={draft.id} className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${selectedDraftId === draft.id ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200 hover:border-indigo-300'}`}>
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">{draft.type}</span>
                             <h4 className="font-mono font-bold text-slate-900 mt-1">{draft.id}</h4>
                          </div>
                          <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2 py-1 rounded">{draft.purity}</span>
                       </div>
                       
                       <div className="space-y-2 text-sm text-slate-600 mb-4">
                          <div className="flex justify-between">
                             <span>Gold Wt:</span>
                             <span className="font-bold">{draft.goldWeight.toFixed(2)}g</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                             <span>Created By:</span>
                             <span>{draft.createdBy}</span>
                          </div>
                       </div>

                       {selectedDraftId === draft.id ? (
                          <div className="space-y-3 animate-fade-in">
                             <Input 
                               label="Total Weight (Gross)" 
                               type="number" 
                               step="0.01"
                               value={totalWeightInput} 
                               onChange={e => setTotalWeightInput(e.target.value)} 
                               placeholder="0.00"
                               autoFocus
                             />
                             <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setSelectedDraftId(null)} className="flex-1">Cancel</Button>
                                <Button size="sm" variant="gold" onClick={() => handleFinalize(draft)} className="flex-1">Finalize</Button>
                             </div>
                          </div>
                       ) : (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => {
                             setSelectedDraftId(draft.id);
                             setTotalWeightInput('');
                          }}>
                             Enter Total Weight
                          </Button>
                       )}
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      {/* --- BATCH TAB --- */}
      {activeTab === 'BATCH' && canViewFinalize && (
        <div className="space-y-6">
          {tagBatch.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button onClick={handleExportPDF} variant="primary">
                  <Printer size={16} className="mr-2" /> Export PDF Labels
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Purity</th>
                      <th className="p-4 text-right">Gross (g)</th>
                      <th className="p-4 text-right">Net (g)</th>
                      <th className="p-4 text-right">Stone (g)</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tagBatch.map((tag) => (
                      <tr key={tag.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-xs">{tag.id}</td>
                        <td className="p-4 font-bold text-slate-900">{tag.type}</td>
                        <td className="p-4">
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">{tag.purity}</span>
                        </td>
                        <td className="p-4 text-right">{tag.totalWeight.toFixed(2)}</td>
                        <td className="p-4 text-right font-bold">{tag.goldWeight.toFixed(2)}</td>
                        <td className="p-4 text-right text-slate-500">{tag.stoneWeight.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => removeFromBatch(tag.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
              <Layers size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600">Batch is Empty</h3>
              <p className="text-slate-400">Finalize drafts to add them here.</p>
            </div>
          )}
        </div>
      )}

      {/* --- HISTORY TAB --- */}
      {activeTab === 'HISTORY' && canViewFinalize && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {generatedTagsHistory.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Gross Wt</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedTagsHistory.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(tag.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono text-xs">{tag.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900">{tag.type}</span>
                      <span className="ml-2 text-xs text-slate-500">{tag.purity}</span>
                    </td>
                    <td className="p-4 text-right">{tag.totalWeight.toFixed(2)}g</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => addToBatch(tag)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center justify-center gap-1 mx-auto"
                      >
                        <Plus size={14} /> Reprint
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <History size={48} className="mx-auto mb-2 opacity-30" />
              <p>No history available.</p>
            </div>
          )}
        </div>
      )}

      {/* --- PDF PREVIEW MODAL --- */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 flex flex-col items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-lg">Print Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleDownloadPDF}>
                  <Printer size={16} className="mr-2" /> Download PDF
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-slate-200 flex justify-center">
              <div 
                id="print-container" 
                className="bg-white w-[210mm] min-h-[297mm] p-[5mm] grid grid-cols-4 content-start gap-x-[5mm] gap-y-[8mm] shadow-lg"
              >
                {tagBatch.map((tag) => (
                  <div 
                    key={tag.id} 
                    className="w-[46mm] h-[50mm] bg-white rounded-lg border border-slate-200 flex flex-col relative overflow-hidden shadow-sm"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Header */}
                    <div className="bg-slate-900 h-[7mm] flex items-center justify-between px-2">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">{tag.type}</span>
                      <span className="bg-yellow-500 text-slate-900 text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-none">{tag.purity}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col px-2 pt-1.5 pb-1">
                      
                      {/* QR Code Area */}
                      <div className="flex items-center justify-center mb-1.5">
                        <div className="w-[20mm] h-[20mm]">
                          <QRCode 
                            value={JSON.stringify({
                              id: tag.id,
                              t: tag.type,
                              w: tag.totalWeight,
                              p: tag.purity,
                              n: tag.goldWeight
                            })} 
                            size={256}
                            style={{ height: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                          />
                        </div>
                      </div>

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-auto">
                        {/* Row 1 */}
                        <div className="flex flex-col">
                          <span className="text-[5px] uppercase text-slate-400 font-bold tracking-wider leading-none mb-0.5">Gross Weight</span>
                          <span className="text-[9px] font-bold text-slate-900 leading-none">{tag.totalWeight.toFixed(2)}g</span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[5px] uppercase text-slate-400 font-bold tracking-wider leading-none mb-0.5">Net Gold</span>
                          <span className="text-[9px] font-bold text-slate-900 leading-none">{tag.goldWeight.toFixed(2)}g</span>
                        </div>

                        {/* Row 2 */}
                        <div className="flex flex-col">
                          <span className="text-[5px] uppercase text-slate-400 font-bold tracking-wider leading-none mb-0.5">Stone Weight</span>
                          <span className="text-[9px] font-bold text-slate-900 leading-none">{tag.stoneWeight.toFixed(2)}g</span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[5px] uppercase text-slate-400 font-bold tracking-wider leading-none mb-0.5">24k Equiv</span>
                          <span className="text-[9px] font-bold text-blue-600 leading-none">{tag.fineWeight.toFixed(2)}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer ID */}
                    <div className="text-center pb-1 pt-0.5">
                      <span className="text-[7px] font-mono text-slate-500 tracking-wider block">{tag.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
