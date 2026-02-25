
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useAppStore } from '../store';
import { Card, Button, Input, Select } from '../components/UI';
import { Printer, Trash2, Plus, History, Layers, Tag, ArrowRight, CheckCircle, Edit3 } from 'lucide-react';
import { JEWELLERY_TYPES, PURITY_TYPES } from '../constants';
import { TagItem, UserRole } from '../types';

// --- PDF GENERATION LOGIC ---
const generatePDF = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // @ts-ignore
  const opt = {
    margin: 0,
    filename: `Aurum_Tags_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // @ts-ignore
  window.html2pdf().set(opt).from(element).save();
};

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

  const handleExportPDF = () => {
    if (tagBatch.length === 0) return;
    generatePDF('print-container');
    saveBatchToHistory();
    addNotification('PDF Exported', 'Labels generated and batch saved to history.', 'success');
  };

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

      {/* --- HIDDEN PRINT CONTAINER (A4 Layout) --- */}
      <div id="print-container" className="fixed top-0 left-0 -z-50 bg-white w-[210mm] min-h-[297mm] p-[5mm] grid grid-cols-4 content-start gap-[2mm]">
        {tagBatch.map((tag) => (
          <div 
            key={tag.id} 
            className="w-[44mm] h-[53mm] border border-slate-200 rounded-lg overflow-hidden flex flex-col relative bg-white"
            style={{ pageBreakInside: 'avoid' }}
          >
            {/* Header */}
            <div className="bg-[#1e1b4b] text-white text-center py-1 text-[10px] font-bold uppercase tracking-wider">
              {tag.type}
            </div>

            {/* Purity Badge */}
            <div className="absolute top-8 right-1 bg-yellow-400 text-[#78350f] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
              {tag.purity}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-1">
              {/* QR Code */}
              <div className="mb-1">
                <QRCode 
                  value={JSON.stringify({
                    id: tag.id,
                    t: tag.type,
                    w: tag.totalWeight, // Gross
                    p: tag.purity,
                    n: tag.goldWeight // Net
                  })} 
                  size={64}
                  level="M"
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 w-full text-[8px] gap-x-1 gap-y-0.5 text-center mt-1">
                <div className="text-slate-500">Gross</div>
                <div className="font-bold text-slate-900">{tag.totalWeight.toFixed(2)}g</div>
                
                <div className="text-slate-500">Net</div>
                <div className="font-bold text-slate-900">{tag.goldWeight.toFixed(2)}g</div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 text-slate-600 text-center py-0.5 text-[7px] font-mono border-t border-slate-200">
              {tag.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
