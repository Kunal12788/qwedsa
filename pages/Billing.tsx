import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';
import { Card, Button, Input, Badge, Modal, Select } from '../components/UI';
import { Receipt, CheckCircle2, Clock, Hourglass, Printer, MapPin, AlertCircle, ShoppingCart, Check, FileText, Users, Layers, Divide, ArrowRight, Wallet, Calculator, ChevronDown, ChevronUp, Edit3, Hammer, Coins, Percent, ArrowDownUp, CheckSquare, Square, ListChecks, Download, Loader2 } from 'lucide-react';
import { ProductStatus, Product, Customer, BillItem, BillingRecord } from '../types';

declare global {
  interface Window {
    html2pdf: any;
  }
}

// --- SINGLE PAGE INVOICE COMPONENT (A4) ---
const SingleInvoicePage: React.FC<{ 
  bill: BillingRecord; 
  customer: Customer; 
  copyType: string;
}> = ({ bill, customer, copyType }) => {
  const isJobWork = bill.goldReceived;
  const invoiceTitle = isJobWork ? "JOB WORK INVOICE" : "TAX INVOICE";

  return (
    <div className="relative flex flex-col h-[297mm] w-[210mm] bg-white text-slate-900 overflow-hidden box-border">
      
      {/* 1. BRAND HEADER & COPY TYPE */}
      <div className="bg-[#0f172a] text-white p-8">
         <div className="flex justify-between items-start">
             <div>
                <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-1 leading-none">Aurum</h1>
                <p className="text-xs font-bold text-gold-500 tracking-[0.4em] uppercase">Enterprise Systems</p>
             </div>
             <div className="text-right">
                <div className="inline-block border border-gold-500/30 bg-gold-500/10 px-3 py-1 rounded mb-2">
                   <p className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">{copyType}</p>
                </div>
                <h2 className="text-2xl font-light tracking-widest uppercase text-slate-300">{invoiceTitle}</h2>
                <p className="text-sm font-mono text-slate-400 mt-1 font-bold">Invoice #: {bill.id}</p>
             </div>
         </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        
        {/* 2. ADDRESS GRID (SUPPLIER vs CUSTOMER) */}
        <div className="flex gap-8 mb-8 border-b border-slate-200 pb-8">
           {/* SUPPLIER */}
           <div className="w-1/2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Details of Supplier</h3>
              <div className="text-sm space-y-1">
                 <p className="font-bold text-lg text-slate-900">Aurum Enterprise Ltd.</p>
                 <p className="text-slate-600">123 Gold Vault Plaza, Zaveri Bazaar</p>
                 <p className="text-slate-600">Mumbai, Maharashtra - 400002</p>
                 <div className="mt-3 space-y-0.5">
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">Email:</span> <span className="font-medium">billing@aurum.com</span></p>
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">GSTIN:</span> <span className="font-medium">27AABCU9603R1ZN</span></p>
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">State Code:</span> <span className="font-medium">27 (Maharashtra)</span></p>
                 </div>
              </div>
           </div>

           {/* CUSTOMER */}
           <div className="w-1/2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Details of Recipient (Billed To)</h3>
              <div className="text-sm space-y-1">
                 <p className="font-bold text-lg text-slate-900">{customer.legalName}</p>
                 <p className="text-slate-600">{customer.address || 'Address Not Provided'}</p>
                 <p className="text-slate-600">{customer.city || 'City Not Provided'}</p>
                 <div className="mt-3 space-y-0.5">
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">Phone:</span> <span className="font-medium">{customer.phone || 'N/A'}</span></p>
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">Email:</span> <span className="font-medium">{customer.email}</span></p>
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">GSTIN:</span> <span className="font-medium">{customer.gstin || 'Unregistered'}</span></p>
                    <p className="flex justify-between w-3/4"><span className="text-slate-500">PAN:</span> <span className="font-medium">{customer.pan || 'N/A'}</span></p>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. INVOICE META */}
        <div className="grid grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded border border-slate-100">
           <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Invoice Date</p>
              <p className="text-sm font-bold text-slate-900">{new Date(bill.createdAt).toLocaleDateString()}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Place of Supply</p>
              <p className="text-sm font-bold text-slate-900">{customer.city || 'Mumbai'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Mode</p>
              <p className="text-sm font-bold text-slate-900">{bill.paymentMode || 'Credit/Pending'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle/Transport</p>
              <p className="text-sm font-bold text-slate-900">Hand Delivery</p>
           </div>
        </div>

        {/* 4. ITEM TABLE */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100">
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider w-10 text-center">Sr.</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider">Description of Goods</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider text-center w-16">HSN</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider text-right w-20">Qty/Wt</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider text-right w-24">Rate</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider text-right w-16">GST %</th>
                 <th className="py-3 px-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-800">
              {bill.items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {/* Main Item Row */}
                    <tr className="border-b border-slate-100">
                       <td className="py-2 px-2 align-top text-center text-slate-500 text-xs">{idx + 1}</td>
                       <td className="py-2 px-2 align-top">
                          <span className="font-bold text-slate-900 text-sm block">{item.productType}</span>
                          <span className="text-xs text-slate-500 font-medium block mt-0.5">{item.purity} Gold | ID: {item.barcodeId}</span>
                       </td>
                       <td className="py-2 px-2 align-top text-center text-slate-500 text-xs">7113</td>
                       <td className="py-2 px-2 align-top text-right font-medium">{item.grossWeight.toFixed(3)} g</td>
                       <td className="py-2 px-2 align-top text-right text-slate-600 text-xs font-mono">
                          {isJobWork ? '-' : `₹${item.appliedRate.toLocaleString()}`}
                       </td>
                       <td className="py-2 px-2 align-top text-right text-slate-600 text-xs">3%</td>
                       <td className="py-2 px-2 align-top text-right font-bold text-slate-900 font-mono">
                          {isJobWork ? '-' : `₹${item.goldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                       </td>
                    </tr>
                    {/* Making Charges Row */}
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                       <td className="py-1 px-2"></td>
                       <td className="py-1 px-2 align-top">
                          <span className="text-xs text-slate-500 italic pl-2 border-l-2 border-slate-300">Making Charges</span>
                       </td>
                       <td className="py-1 px-2 align-top text-center text-slate-400 text-xs">9988</td>
                       <td className="py-1 px-2 align-top text-right text-slate-400 text-xs">1 Unit</td>
                       <td className="py-1 px-2 align-top text-right text-slate-400 text-xs">-</td>
                       <td className="py-1 px-2 align-top text-right text-slate-600 text-xs">18%</td>
                       <td className="py-1 px-2 align-top text-right text-slate-700 text-xs font-mono">
                          ₹{item.makingChargeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </td>
                    </tr>
                  </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. FOOTER */}
        <div className="mt-auto">
           <div className="flex gap-8 pt-4 border-t-2 border-slate-900">
              
              {/* Left: Bank & Amounts in Words */}
              <div className="w-7/12 space-y-4">
                 <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase tracking-wider">Bank Details</h4>
                    <div className="text-xs text-slate-700 grid grid-cols-2 gap-y-1">
                       <span className="text-slate-500">Bank Name:</span> <span className="font-bold">HDFC Bank</span>
                       <span className="text-slate-500">A/c No:</span> <span className="font-bold">00600340012345</span>
                       <span className="text-slate-500">IFSC Code:</span> <span className="font-bold">HDFC0000060</span>
                       <span className="text-slate-500">Branch:</span> <span>Fort, Mumbai</span>
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Declaration</h4>
                    <p className="text-[10px] text-slate-500 leading-tight text-justify">
                       We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold will not be taken back. Subject to Mumbai Jurisdiction.
                    </p>
                 </div>
              </div>

              {/* Right: Totals */}
              <div className="w-5/12 flex flex-col justify-between">
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                       <span className="text-slate-600">Taxable Amount</span>
                       <span className="font-bold text-slate-900">₹{(bill.grandTotal - bill.totalTaxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-600">Total GST</span>
                       <span className="font-bold text-slate-900">₹{bill.totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between items-end">
                       <span className="text-base font-bold text-slate-900 uppercase">Grand Total</span>
                       <span className="text-2xl font-serif font-bold text-slate-900">₹{bill.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 italic">(E. & O.E.)</div>
                 </div>

                 <div className="mt-8 text-right">
                    <p className="text-xs font-bold text-slate-900 mb-8">For Aurum Enterprise Ltd.</p>
                    <div className="border-t border-slate-400 w-32 ml-auto"></div>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Authorized Signatory</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// --- WRAPPER TO RENDER BOTH COPIES ---
const InvoiceTemplate: React.FC<{ bills: BillingRecord[] | null; customer: Customer | undefined; id: string }> = ({ bills, customer, id }) => {
  if (!bills || bills.length === 0 || !customer) return null;

  return createPortal(
    // Render hidden from view but available for PDF capture
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -100, overflow: 'hidden', height: 0 }}>
      <div 
        id={id}
        style={{ width: '210mm', margin: '0 auto' }}
      >
        {bills.map((bill) => (
          <React.Fragment key={bill.id}>
             {/* PAGE 1: ORIGINAL */}
             <div style={{ pageBreakAfter: 'always' }}>
                <SingleInvoicePage bill={bill} customer={customer} copyType="ORIGINAL FOR RECIPIENT" />
             </div>
             {/* PAGE 2: DUPLICATE */}
             <div style={{ pageBreakAfter: 'always' }}>
                <SingleInvoicePage bill={bill} customer={customer} copyType="DUPLICATE FOR TRANSPORTER" />
             </div>
          </React.Fragment>
        ))}
      </div>
    </div>,
    document.body
  );
};

export const Billing: React.FC = () => {
  const { products, customers, createBill, settings, billingRecords, settleBillPayment, toggleBillGold, getPurityFactor } = useAppStore();
  
  // --- States for Split Billing Workflow ---
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<{ customer: Customer, items: Product[] } | null>(null);
  const [splitParts, setSplitParts] = useState<number>(1);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  
  // --- Configuration Steps State ---
  const [configStep, setConfigStep] = useState<1 | 2>(1);
  const [transactionType, setTransactionType] = useState<'SALE' | 'GOLD_GIVEN' | null>(null);

  // --- Pricing Configuration State ---
  const [itemPricing, setItemPricing] = useState<Record<string, { rate: number, makingRate: number, makingGst: number }>>({});
  
  // States for Payment Settlement
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'RTGS' | 'CHEQUE' | 'CASH' | 'OTHER'>('UPI');

  // --- EXPORT STATE ---
  const [exportingBills, setExportingBills] = useState<BillingRecord[] | null>(null);
  const EXPORT_ELEMENT_ID = 'invoice-export-content';

  // Queues
  const billableProducts = products.filter(p => 
    p.status === ProductStatus.CONFIRMED_BY_CUSTOMER || 
    p.status === ProductStatus.ALLOTTED
  );
  
  const pendingSettlementBills = billingRecords.filter(b => b.status === 'PENDING');
  const completedBills = billingRecords.filter(b => b.status === 'COMPLETED');

  // --- Grouping Logic ---
  const customerQueues = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    billableProducts.forEach(p => {
      if (!groups[p.customerId || 'unknown']) {
        groups[p.customerId || 'unknown'] = [];
      }
      groups[p.customerId || 'unknown'].push(p);
    });
    return groups;
  }, [billableProducts]);

  // --- Bill Number Generator ---
  const generateBillNumber = (offset = 0) => {
    const currentYear = new Date().getFullYear();
    const sequence = billingRecords.length + 1 + offset;
    return `AUR/${currentYear}/${sequence.toString().padStart(4, '0')}`;
  };

  // --- Split Logic Helpers ---
  const getSplitBatches = (): Product[][] => {
    if (!selectedCustomerGroup) return [];
    
    const items = [...selectedCustomerGroup.items];
    const batches: Product[][] = Array.from({ length: splitParts }, () => []);
    
    items.forEach((item, index) => {
      batches[index % splitParts].push(item);
    });

    return batches;
  };

  const batches = useMemo(() => getSplitBatches(), [selectedCustomerGroup, splitParts]);

  // --- Calculation Helper for Preview ---
  const calculateItemTotals = (p: Product, pricing: { rate: number, makingRate: number, makingGst: number }) => {
      const purityFactor = getPurityFactor(p.purity);
      const fineWeight = p.goldWeight * purityFactor;
      
      const effectiveRate = transactionType === 'GOLD_GIVEN' ? 0 : pricing.rate;
      const goldValue = fineWeight * (effectiveRate / 10);
      
      let makingAmount = 0;
      
      if (transactionType === 'SALE') {
          const shadowGoldValue = fineWeight * (effectiveRate / 10);
          makingAmount = (shadowGoldValue * pricing.makingRate) / 100;
      } else {
          makingAmount = p.goldWeight * pricing.makingRate;
      }
      
      const goldGst = goldValue * 0.03; 
      const makingGst = makingAmount * (pricing.makingGst / 100);
      
      return {
          goldValue,
          makingAmount,
          goldGst,
          makingGst,
          total: goldValue + makingAmount + goldGst + makingGst
      };
  };

  const calculateBatchTotal = (batchItems: Product[]) => {
    return batchItems.reduce((acc, p) => {
      const pricing = itemPricing[p.id] || { 
          rate: transactionType === 'SALE' ? settings.goldRatePer10Gm : 0, 
          makingRate: transactionType === 'SALE' ? 12 : 500, 
          makingGst: 18 
      };
      const totals = calculateItemTotals(p, pricing);
      return acc + totals.total;
    }, 0);
  };

  // --- Actions ---
  const openSplitModal = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const items = customerQueues[customerId];
    if (customer && items) {
      setSelectedCustomerGroup({ customer, items });
      setSplitParts(1);
      setConfigStep(1); 
      setTransactionType(null);
      setIsSplitModalOpen(true);
    }
  };

  const selectTransactionMode = (type: 'SALE' | 'GOLD_GIVEN') => {
      setTransactionType(type);
      const initialPricing: Record<string, { rate: number, makingRate: number, makingGst: number }> = {};
      selectedCustomerGroup?.items.forEach(item => {
        initialPricing[item.id] = {
           rate: type === 'GOLD_GIVEN' ? 0 : settings.goldRatePer10Gm,
           makingRate: type === 'GOLD_GIVEN' ? 500 : 12, 
           makingGst: 18
        };
      });
      setItemPricing(initialPricing);
      setConfigStep(2);
  };

  const updateItemPricing = (itemId: string, field: 'rate' | 'makingRate' | 'makingGst', value: number) => {
     setItemPricing(prev => ({
        ...prev,
        [itemId]: {
           ...prev[itemId],
           [field]: value
        }
     }));
  };

  // --- PDF Export Logic ---
  const performExport = (bills: BillingRecord[]) => {
    if (!window.html2pdf) {
      alert("PDF Engine loading... please try again in a moment.");
      return;
    }

    const element = document.getElementById(EXPORT_ELEMENT_ID);
    if (!element) return;

    // Scroll top to ensure everything captures correctly
    window.scrollTo(0, 0);

    const filename = bills.length === 1 
       ? `Invoice_${bills[0].id.replace(/\//g, '-')}.pdf`
       : `Invoices_Batch_${new Date().toISOString().split('T')[0]}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        scrollY: 0,
        // Removed specific windowWidth/height to let html2pdf handle standard A4 scaling naturally from the element size
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
       setExportingBills(null);
    });
  };

  const handleExportPdf = (billOrBills: BillingRecord | BillingRecord[]) => {
    const bills = Array.isArray(billOrBills) ? billOrBills : [billOrBills];
    setExportingBills(bills);
  };

  const exportLedgerPDF = () => {
    if (!window.html2pdf) return;
    const element = document.getElementById('billing-ledger-table');
    const opt = {
      margin: 10,
      filename: `Transaction_Ledger_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (exportingBills && exportingBills.length > 0) {
       const timer = setTimeout(() => {
         performExport(exportingBills);
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [exportingBills]);

  const generateSplitBills = () => {
    if (!selectedCustomerGroup) return;

    const createdBills: BillingRecord[] = [];

    batches.forEach((batchItems, index) => {
      if (batchItems.length === 0) return;

      const newBillId = generateBillNumber(index);
      const billItems: BillItem[] = batchItems.map(p => {
        const pricing = itemPricing[p.id];
        const totals = calculateItemTotals(p, pricing);
        const purityFactor = getPurityFactor(p.purity);
        const fineWeight = p.goldWeight * purityFactor;
        
        return {
          productId: p.id,
          productType: p.type,
          purity: p.purity,
          barcodeId: p.barcodeId,
          grossWeight: p.goldWeight,
          purityFactor,
          fineGoldWeight: fineWeight,
          appliedRate: pricing.rate,
          goldValue: totals.goldValue,
          makingChargePercent: transactionType === 'SALE' ? pricing.makingRate : 0, 
          makingChargeAmount: totals.makingAmount,
          goldGstPercent: 3,
          makingGstPercent: pricing.makingGst,
          taxAmount: totals.goldGst + totals.makingGst,
          totalAmount: totals.total
        };
      });

      const totalFineGoldWeight = billItems.reduce((acc, i) => acc + i.fineGoldWeight, 0);
      const totalGoldValue = billItems.reduce((acc, i) => acc + i.goldValue, 0);
      const totalMakingCharges = billItems.reduce((acc, i) => acc + i.makingChargeAmount, 0);
      const totalTaxAmount = billItems.reduce((acc, i) => acc + i.taxAmount, 0);
      const grandTotal = billItems.reduce((acc, i) => acc + i.totalAmount, 0);

      const newBill: BillingRecord = {
        id: newBillId,
        customerId: selectedCustomerGroup.customer.id,
        items: billItems,
        totalFineGoldWeight,
        totalGoldValue,
        totalMakingCharges,
        totalTaxAmount,
        grandTotal,
        status: 'PENDING',
        paymentReceived: false,
        goldReceived: transactionType === 'GOLD_GIVEN', 
        createdAt: new Date().toISOString()
      };

      createBill(newBill);
      createdBills.push(newBill);
    });

    setIsSplitModalOpen(false);
    
    if (createdBills.length > 0) {
       handleExportPdf(createdBills);
    }
    
    setSelectedCustomerGroup(null);
  };

  const initiatePayment = (billId: string) => {
    setSelectedBillId(billId);
    setPaymentMode('UPI');
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = () => {
    if (selectedBillId) {
      settleBillPayment(selectedBillId, paymentMode);
      setIsPaymentModalOpen(false);
      setSelectedBillId(null);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">Billing</h2>
              <p className="text-slate-500 mt-1">Consolidated invoicing and payment collection.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* LEFT: PENDING BILLING QUEUES (GROUPED BY CUSTOMER) */}
          <div className="lg:col-span-8 space-y-8">
              
              {/* 1. Customer Groups Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> Customer Order Queues
                </h3>
                
                {Object.keys(customerQueues).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                      <CheckCircle2 size={48} className="mb-2 opacity-50 text-emerald-500"/>
                      <p>No allotted items pending billing.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(customerQueues).map(([customerId, items]: [string, Product[]]) => {
                          const cust = customers.find(c => c.id === customerId);
                          const totalWeight = items.reduce((acc, i) => acc + i.goldWeight, 0);
                          
                          return (
                            <Card key={customerId} className="relative group hover:border-indigo-300 transition-all cursor-default">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                        {cust?.legalName.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900">{cust?.legalName}</p>
                                        <p className="text-xs text-slate-500">{cust?.uniqueName}</p>
                                      </div>
                                  </div>
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">
                                      {items.length} Items
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Weight</p>
                                      <p className="font-serif font-bold text-slate-900">{totalWeight.toFixed(2)}g</p>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Value</p>
                                      <p className="font-serif font-bold text-slate-900">~₹{(totalWeight * (settings.goldRatePer10Gm/10)).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                  </div>
                                </div>

                                <Button 
                                  variant="gold" 
                                  className="w-full"
                                  onClick={() => openSplitModal(customerId)}
                                >
                                  <FileText size={16} /> Process Order
                                </Button>
                            </Card>
                          );
                      })}
                    </div>
                )}
              </div>

              {/* 2. Settlement Queue */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={16} /> Settlement Queue (Payment & Gold)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {pendingSettlementBills.map(bill => {
                        const cust = customers.find(c => c.id === bill.customerId);
                        
                        return (
                          <div key={bill.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-900">{cust?.legalName}</h4>
                                    <p className="text-xs text-slate-500 font-mono font-bold mt-1 text-indigo-600">{bill.id}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{bill.items.length} items • {new Date(bill.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-serif font-bold text-indigo-700 text-lg">₹{bill.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Due</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {/* Gold Status */}
                                <div className={`p-2 rounded-lg border text-center transition-colors ${bill.goldReceived ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className={`text-[10px] font-bold uppercase mb-1 ${bill.goldReceived ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {bill.goldReceived ? 'Gold Received' : 'Gold Pending'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-900 mb-2">{bill.totalFineGoldWeight.toFixed(3)}g <span className="text-[10px] text-slate-400">(24k)</span></p>
                                    <button 
                                      onClick={() => toggleBillGold(bill.id)}
                                      className={`w-full text-[10px] font-bold px-2 py-1 rounded transition-colors ${bill.goldReceived ? 'text-emerald-600 hover:bg-emerald-100' : 'bg-white border border-slate-200 text-slate-600 hover:text-gold-600'}`}
                                    >
                                      {bill.goldReceived ? 'Undo' : 'Collect'}
                                    </button>
                                </div>

                                {/* Payment Status */}
                                <div className={`p-2 rounded-lg border text-center transition-colors ${bill.paymentReceived ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className={`text-[10px] font-bold uppercase mb-1 ${bill.paymentReceived ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {bill.paymentReceived ? 'Paid' : 'Payment Due'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-900 mb-2">₹{bill.totalMakingCharges.toLocaleString(undefined, {maximumFractionDigits:0})}+</p>
                                    <button 
                                      onClick={() => !bill.paymentReceived && initiatePayment(bill.id)}
                                      disabled={bill.paymentReceived}
                                      className={`w-full text-[10px] font-bold px-2 py-1 rounded transition-colors ${bill.paymentReceived ? 'text-emerald-600 cursor-default' : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600'}`}
                                    >
                                      {bill.paymentReceived ? `Paid via ${bill.paymentMode}` : 'Mark Paid'}
                                    </button>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                <button 
                                  onClick={() => handleExportPdf(bill)} 
                                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest"
                                >
                                  <Download size={12} /> Export PDF
                                </button>
                              </div>
                          </div>
                        );
                    })}
                </div>
              </div>
          </div>

          {/* RIGHT: HISTORY */}
          <div className="lg:col-span-4 space-y-6">
              <Card 
                title="Settlement History" 
                className="h-full max-h-[800px] flex flex-col"
                action={
                   <Button size="sm" variant="outline" onClick={exportLedgerPDF}>
                      <Download size={16} /> Export List
                   </Button>
                }
              >
                  <div className="space-y-4 overflow-y-auto flex-1 pr-2" id="billing-ledger-table">
                    {completedBills.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">No completed history.</p>
                    ) : (
                        completedBills.map(bill => {
                          const c = customers.find(cus => cus.id === bill.customerId);
                          return (
                              <div key={bill.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{c?.legalName}</p>
                                    <p className="text-xs text-indigo-600 font-mono font-bold">{bill.id}</p>
                                    <p className="text-[10px] text-slate-500">{bill.items.length} items • {new Date(bill.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-700">₹{bill.grandTotal.toLocaleString()}</p>
                                    <div className="flex justify-end gap-2 mt-1">
                                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Settled</span>
                                      <button 
                                        onClick={() => handleExportPdf(bill)}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded"
                                        title="Export PDF Invoice"
                                      >
                                        <Download size={14} />
                                      </button>
                                    </div>
                                </div>
                              </div>
                          )
                        })
                    )}
                  </div>
              </Card>
          </div>
        </div>

        {/* PAYMENT MODE MODAL */}
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Confirm Payment Settlement">
          <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                <p className="text-emerald-800 font-bold text-lg">Marking as Paid</p>
                <p className="text-emerald-600 text-sm">Select the method used by the customer.</p>
              </div>
              
              <Select 
                label="Payment Mode" 
                value={paymentMode} 
                onChange={e => setPaymentMode(e.target.value as any)}
              >
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="RTGS">RTGS / NEFT / IMPS</option>
                <option value="CHEQUE">Cheque / DD</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </Select>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">Cancel</Button>
                <Button variant="success" onClick={confirmPayment} className="flex-1">Confirm Receipt</Button>
              </div>
          </div>
        </Modal>

        {/* 2-STEP CONFIGURATION MODAL */}
        <Modal isOpen={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} title="Configure Invoice Generation">
          {selectedCustomerGroup && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Customer</p>
                      <p className="font-bold text-slate-900">{selectedCustomerGroup.customer.legalName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Items</p>
                      <p className="font-bold text-indigo-600 text-lg">{selectedCustomerGroup.items.length}</p>
                    </div>
                </div>

                {/* STEP 1: SELECT STRATEGY */}
                {configStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Layers size={16} /> Select Transaction Type
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => selectTransactionMode('SALE')}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${transactionType === 'SALE' ? 'border-gold-500 bg-gold-50/20 shadow-md' : 'border-slate-100 hover:border-gold-300 hover:shadow-md'}`}
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                                  <Coins size={24} className="text-gold-600" />
                                  Sell Gold
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Standard sale. Charge for Gold Value (at current rate) + Making Charges (%).
                                </p>
                            </button>
                            <button 
                                onClick={() => selectTransactionMode('GOLD_GIVEN')}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${transactionType === 'GOLD_GIVEN' ? 'border-indigo-500 bg-indigo-50/20 shadow-md' : 'border-slate-100 hover:border-indigo-300 hover:shadow-md'}`}
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                                  <Hammer size={24} className="text-indigo-600" />
                                  Gold Given (Job Work)
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Customer provided gold. Charge only Fixed Making Costs (₹/g) + GST on service.
                                </p>
                            </button>
                          </div>
                      </div>
                    </div>
                )}

                {/* STEP 2: CONFIGURE VALUES */}
                {configStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center">
                          <button onClick={() => setConfigStep(1)} className="text-xs font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1 mb-2">
                            ← Back to Selection
                          </button>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                            Mode: {transactionType === 'SALE' ? 'Sell Gold (Itemized)' : 'Job Work (Fixed Rate)'}
                          </span>
                      </div>

                      <div className="border rounded-xl overflow-hidden max-h-[500px] flex flex-col">
                          <div className="overflow-y-auto p-2 bg-slate-50 space-y-2 flex-1">
                            {selectedCustomerGroup.items.map((item, idx) => (
                                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                  <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-slate-800">{item.type} <span className="text-slate-400 font-normal">({item.barcodeId})</span></p>
                                            <p className="text-[10px] text-slate-500">{item.goldWeight}g • {item.purity}</p>
                                        </div>
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">ID: {item.id.substr(0,4)}</div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-3">
                                      {transactionType === 'SALE' ? (
                                        <>
                                            <div>
                                              <label className="text-[10px] text-slate-400 font-bold block mb-1">Gold Rate (10g)</label>
                                              <div className="relative">
                                                  <input 
                                                    type="number" 
                                                    className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-900"
                                                    value={itemPricing[item.id]?.rate || 0}
                                                    onChange={e => updateItemPricing(item.id, 'rate', parseFloat(e.target.value))}
                                                  />
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-slate-400 font-bold block mb-1">Making (%)</label>
                                              <div className="relative">
                                                  <input 
                                                    type="number" 
                                                    className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-900"
                                                    value={itemPricing[item.id]?.makingRate || 0}
                                                    onChange={e => updateItemPricing(item.id, 'makingRate', parseFloat(e.target.value))}
                                                  />
                                                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-slate-400 font-bold block mb-1">GST (%)</label>
                                              <input 
                                                  type="number" 
                                                  className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-900"
                                                  value={itemPricing[item.id]?.makingGst || 0}
                                                  onChange={e => updateItemPricing(item.id, 'makingGst', parseFloat(e.target.value))}
                                              />
                                            </div>
                                        </>
                                      ) : (
                                        <>
                                            <div className="opacity-50 pointer-events-none">
                                              <label className="text-[10px] text-slate-400 font-bold block mb-1">Gold Rate</label>
                                              <input type="text" value="0" disabled className="w-full text-xs p-2 border rounded bg-slate-100 text-slate-400" />
                                            </div>
                                            
                                            <div>
                                              <label className="text-[10px] text-indigo-500 font-bold block mb-1">Making Cost (₹/g)</label>
                                              <div className="relative">
                                                  <span className="absolute left-2 top-2 text-[10px] text-slate-400">₹</span>
                                                  <input 
                                                    type="number" 
                                                    className="w-full text-xs pl-5 p-2 border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 bg-indigo-50/30"
                                                    value={itemPricing[item.id]?.makingRate || 0}
                                                    onChange={e => updateItemPricing(item.id, 'makingRate', parseFloat(e.target.value))}
                                                  />
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-slate-400 font-bold block mb-1">GST (%)</label>
                                              <input 
                                                  type="number" 
                                                  className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-900"
                                                  value={itemPricing[item.id]?.makingGst || 0}
                                                  onChange={e => updateItemPricing(item.id, 'makingGst', parseFloat(e.target.value))}
                                              />
                                            </div>
                                        </>
                                      )}
                                  </div>
                                </div>
                            ))}
                          </div>
                      </div>

                      <div className="space-y-3 pt-2">
                          <label className="text-sm font-bold text-slate-700 flex justify-between">
                            <span>Split into how many bills?</span>
                            <span className="text-indigo-600">{splitParts} Part{splitParts > 1 ? 's' : ''}</span>
                          </label>
                          <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            value={splitParts} 
                            onChange={e => setSplitParts(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                      </div>

                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[200px] overflow-y-auto">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preview Breakdown (Estimated)</p>
                          <div className="space-y-3">
                            {batches.map((batch: Product[], idx: number) => {
                                const batchTotal = calculateBatchTotal(batch);
                                return (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                        {idx + 1}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-slate-900">Invoice Part {idx + 1}</p>
                                        <p className="text-xs text-slate-500">{batch.length} Items</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-slate-400">Total Payable</p>
                                      <p className="font-bold text-slate-700 text-sm">
                                        ₹{batchTotal.toLocaleString(undefined, {maximumFractionDigits:0})}
                                      </p>
                                  </div>
                                </div>
                            )})}
                          </div>
                      </div>

                      <div className="pt-2">
                          <Button variant="gold" className="w-full py-4" onClick={generateSplitBills}>
                            <Layers size={18} /> Generate Invoice(s)
                          </Button>
                      </div>
                    </div>
                )}
              </div>
          )}
        </Modal>
      </div>
      
      {/* Hidden Invoice Template - Visible only during PDF export */}
      <InvoiceTemplate 
        bills={exportingBills} 
        customer={exportingBills && exportingBills.length > 0 ? customers.find(c => c.id === exportingBills[0].customerId) : undefined}
        id={EXPORT_ELEMENT_ID} 
      />
    </>
  );
};