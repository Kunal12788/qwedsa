import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { 
  PlusCircle, 
  Trash2, 
  Briefcase, 
  AlertTriangle, 
  Layers, 
  CheckSquare, 
  Square, 
  Users, 
  UserPlus, 
  TrendingUp, 
  UserMinus,
  PackagePlus,
  UserCheck,
  Receipt,
  Truck,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Power,
  Clock
} from 'lucide-react';
import { UserRole, ProductStatus, User } from '../types';
import { JEWELLERY_TYPES } from '../constants';

export const WorkforceManagement: React.FC = () => {
  const { products, users, auditLogs, bulkUpdateProductStatus, injectProduct, addAdmin, transferAdminData, deleteUser, logAction, settings, toggleWorkingHours } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'QUEUES' | 'TEAM'>('QUEUES');

  // --- Queue State ---
  const [selectedWorkItems, setSelectedWorkItems] = useState<string[]>([]);
  const [workflowTab, setWorkflowTab] = useState<ProductStatus>(ProductStatus.IN_ADMIN_STOCK);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  
  // Inject Product State
  const [injectBarcode, setInjectBarcode] = useState('');
  const [injectType, setInjectType] = useState(JEWELLERY_TYPES[0]);
  const [injectWeight, setInjectWeight] = useState('');

  // --- Team State ---
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  
  // New Admin Provisioning State
  const [creationStep, setCreationStep] = useState<'DETAILS' | 'VERIFY'>('DETAILS');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState(UserRole.STOCK_INTAKE_ADMIN);
  const [creationOtp, setCreationOtp] = useState('');
  const [enteredCreationOtp, setEnteredCreationOtp] = useState('');
  const [isSimulatingEmail, setIsSimulatingEmail] = useState(false);
  const [creationError, setCreationError] = useState('');

  // Offboarding & Verification States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [adminToOffboard, setAdminToOffboard] = useState<User | null>(null);
  const [successorId, setSuccessorId] = useState('');
  const [offboardStep, setOffboardStep] = useState<'SELECT' | 'VERIFY'>('SELECT');
  
  // Security Codes
  const [emailOtp, setEmailOtp] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Workflow Queues Config
  const workflowQueues = [
    { label: 'Stock Queue', status: ProductStatus.IN_ADMIN_STOCK },
    { label: 'Allotment Pending', status: ProductStatus.ALLOTTED },
    { label: 'Billing Pending', status: ProductStatus.CONFIRMED_BY_CUSTOMER },
    { label: 'Collection Pending', status: ProductStatus.BILLED },
    { label: 'Suspended/Held', status: ProductStatus.SUSPENDED },
  ];

  const currentQueueItems = products.filter(p => p.status === workflowTab);
  const activeAdmins = users.filter(u => u.verified && u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.CUSTOMER);
  
  // Calculate Stats per Admin
  const getAdminStats = (admin: User) => {
    const activityCount = auditLogs.filter(l => l.performedBy === admin.name).length;
    let specificStat = 0;
    let statLabel = "Actions";

    if (admin.role === UserRole.STOCK_INTAKE_ADMIN) {
      specificStat = auditLogs.filter(l => l.performedBy === admin.name && l.action === 'STOCK_INTAKE').length;
      statLabel = "Items Added";
    } else if (admin.role === UserRole.ALLOTMENT_ADMIN) {
      specificStat = products.filter(p => p.allottedBy === admin.name).length;
      statLabel = "Active Allotments";
    } else if (admin.role === UserRole.BILLING_ADMIN) {
      // Counts billing creation AND gold collection events
      specificStat = auditLogs.filter(l => l.performedBy === admin.name && (l.action === 'BILLING_CREATE' || l.action === 'GOLD_RECEIVED')).length;
      statLabel = "Transactions";
    } else if (admin.role === UserRole.DELIVERY_ADMIN) {
      specificStat = auditLogs.filter(l => l.performedBy === admin.name && (l.action === 'PACKAGE_DISPATCH' || l.action === 'PACKAGE_DELIVERED')).length;
      statLabel = "Logistics Ops";
    }

    return { activityCount, specificStat, statLabel };
  };

  const handleInjectProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(injectWeight);
    if(injectBarcode && weight > 0) {
      injectProduct({
        id: Math.random().toString(36).substr(2, 9),
        barcodeId: injectBarcode,
        type: injectType,
        purity: '22k', // Default for inject
        goldWeight: weight,
        stoneWeight: 0,
        totalWeight: weight,
        imageUrl: `https://picsum.photos/400/400?random=${Math.random()}`,
        status: workflowTab, // Inject into currently selected queue
        createdAt: new Date().toISOString()
      });
      setInjectBarcode('');
      setInjectWeight('');
      setIsInjectModalOpen(false);
    }
  };

  const handleBulkTransfer = (targetStatus: ProductStatus) => {
    if(selectedWorkItems.length > 0) {
      bulkUpdateProductStatus(selectedWorkItems, targetStatus);
      setSelectedWorkItems([]);
    }
  };

  const handleBulkSuspend = () => {
     handleBulkTransfer(ProductStatus.SUSPENDED);
  };

  const toggleSelectAll = () => {
    if (selectedWorkItems.length === currentQueueItems.length) {
      setSelectedWorkItems([]);
    } else {
      setSelectedWorkItems(currentQueueItems.map(p => p.id));
    }
  };

  // --- New Admin Creation Logic ---

  const initiateAdminCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if(newAdminName && newAdminEmail) {
      setIsSimulatingEmail(true);
      setCreationError('');
      
      // Simulate API call to send email
      setTimeout(() => {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setCreationOtp(code);
        setIsSimulatingEmail(false);
        setCreationStep('VERIFY');
        // In real app this goes to email service
        alert(`Aurum Security System:\n\nOne-Time Verification Code for ${newAdminEmail}: ${code}`);
      }, 1500);
    }
  };

  const verifyAndCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCreationOtp === creationOtp) {
      addAdmin(newAdminName, newAdminEmail, newAdminRole);
      logAction('ADMIN_PROVISIONED', `Verified and created new admin: ${newAdminEmail}`);
      
      // Reset
      setNewAdminName('');
      setNewAdminEmail('');
      setEnteredCreationOtp('');
      setCreationStep('DETAILS');
      setIsAddAdminModalOpen(false);
    } else {
      setCreationError('Invalid verification code. Please check email.');
    }
  };

  const closeCreationModal = () => {
    setIsAddAdminModalOpen(false);
    setCreationStep('DETAILS');
    setEnteredCreationOtp('');
    setCreationError('');
  };

  // --- Offboarding Logic ---

  const initiateOffboard = (user: User) => {
    setAdminToOffboard(user);
    setSuccessorId('');
    setOffboardStep('SELECT');
    setEmailOtp('');
    setFixedCode('');
    setIsOtpSent(false);
    setVerifyError('');
    setIsTransferModalOpen(true);
  };

  const sendDemoOtp = () => {
    setIsOtpSent(true);
    // In a real app, this calls an API. Here we simulate.
    setTimeout(() => alert('Aurum Security Alert:\nYour Verification Code is 5555'), 500);
  };

  const finalConfirmOffboard = () => {
    // 1. Verify Codes
    if (emailOtp !== '5555') {
        setVerifyError('Invalid Email Verification Code.');
        return;
    }
    if (fixedCode !== '9999') {
        setVerifyError('Invalid Secure Passcode.');
        return;
    }

    // 2. Perform Action
    if (adminToOffboard && successorId) {
      transferAdminData(adminToOffboard.id, successorId);
      // Wait a tick for data transfer then delete
      setTimeout(() => {
          deleteUser(adminToOffboard.id);
          setIsTransferModalOpen(false);
          setAdminToOffboard(null);
          logAction('ADMIN_OFFBOARD', `Securely offboarded ${adminToOffboard.name}. Data transferred.`);
      }, 500);
    }
  };

  const possibleSuccessors = adminToOffboard 
    ? activeAdmins.filter(u => u.id !== adminToOffboard.id && u.role === adminToOffboard.role)
    : [];

  // --- Group Admins by Role ---
  const roleSections = [
    {
      title: 'Stock Intake Team',
      role: UserRole.STOCK_INTAKE_ADMIN,
      icon: PackagePlus,
      color: 'blue',
      description: 'Responsible for scanning, weighing, and registering new inventory assets.'
    },
    {
      title: 'Allotment Team',
      role: UserRole.ALLOTMENT_ADMIN,
      icon: UserCheck,
      color: 'amber',
      description: 'Handles customer assignment, approval matching, and basket management.'
    },
    {
      title: 'Billing & Collection Team',
      role: UserRole.BILLING_ADMIN,
      icon: Receipt,
      color: 'emerald',
      description: 'Manages invoices, payments, and 24k gold recovery.'
    },
    {
      title: 'Delivery Logistics Team',
      role: UserRole.DELIVERY_ADMIN,
      icon: Truck,
      color: 'indigo',
      description: 'Oversees packaging, dispatching, and delivery verification.'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Workforce Operations</h2>
            <p className="text-slate-500 mt-1">Directly manage, transfer, and oversee all admin work queues.</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('QUEUES')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'QUEUES' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <Layers size={16} /> Work Queues
            </button>
            <button 
              onClick={() => setActiveTab('TEAM')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'TEAM' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <Users size={16} /> Team & Performance
            </button>
         </div>
      </div>

      {/* MASTER CONTROL PANEL FOR WORKING TIME */}
      <div className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${settings.isWorkingHoursActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
         <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-sm ${settings.isWorkingHoursActive ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
               <Clock size={32} className={settings.isWorkingHoursActive ? 'animate-pulse' : ''} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900">Working Time Control</h3>
               <p className="text-sm text-slate-500">
                  {settings.isWorkingHoursActive 
                    ? 'System is LIVE. Admins have access.' 
                    : 'System is OFFLINE. Admin access restricted.'}
               </p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Admins</p>
               <p className="text-2xl font-serif font-bold text-slate-900">{activeAdmins.length}</p>
            </div>
            
            <button
               onClick={() => toggleWorkingHours(!settings.isWorkingHoursActive)}
               className={`relative group px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center gap-3 ${
                  settings.isWorkingHoursActive 
                    ? 'bg-white text-emerald-600 hover:bg-red-50 hover:text-red-600 hover:shadow-red-200 border border-emerald-200' 
                    : 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-emerald-200'
               }`}
            >
               <Power size={20} />
               <span>{settings.isWorkingHoursActive ? 'End Shift / Close' : 'Start Working Time'}</span>
            </button>
         </div>
      </div>

      {activeTab === 'QUEUES' ? (
        <Card 
          title="Active Queue Management" 
          className="overflow-hidden min-h-[600px] flex flex-col"
          action={
             <Button size="sm" variant="outline" onClick={() => setIsInjectModalOpen(true)}>
               <PlusCircle size={16} /> Inject Task
             </Button>
          }
        >
          <div className="flex flex-col space-y-4 flex-1">
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
               {workflowQueues.map(q => (
                 <button
                   key={q.status}
                   onClick={() => { setWorkflowTab(q.status); setSelectedWorkItems([]); }}
                   className={`px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-2 ${
                     workflowTab === q.status 
                       ? 'bg-white text-slate-900 shadow-sm' 
                       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                   }`}
                 >
                   {q.label}
                   <span className={`px-2 py-0.5 rounded-full text-[10px] ${workflowTab === q.status ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                     {products.filter(p => p.status === q.status).length}
                   </span>
                 </button>
               ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 gap-4">
               <div className="flex items-center gap-3 w-full md:w-auto">
                 <button 
                    onClick={toggleSelectAll} 
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded hover:bg-white transition-colors"
                  >
                    {currentQueueItems.length > 0 && selectedWorkItems.length === currentQueueItems.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    {selectedWorkItems.length === currentQueueItems.length ? 'Deselect All' : 'Select All'}
                 </button>
                 
                 <div className="h-6 w-px bg-slate-300 mx-2"></div>

                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedWorkItems.length} Selected</span>
                 
                 {selectedWorkItems.length > 0 && (
                   <button onClick={handleBulkSuspend} className="text-red-600 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-2 rounded ml-2 transition-colors">
                      <Trash2 size={14} /> Suspend / Delete
                   </button>
                 )}
               </div>
               
               {selectedWorkItems.length > 0 && (
                 <div className="flex items-center gap-2 w-full md:w-auto">
                   <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Transfer To:</span>
                   <div className="relative flex-1">
                      <Layers size={14} className="absolute left-3 top-3 text-slate-400" />
                      <select 
                        className="w-full pl-9 bg-white border border-slate-300 text-xs rounded-lg px-2 py-2 outline-none focus:border-indigo-500 font-bold text-slate-700"
                        onChange={(e) => handleBulkTransfer(e.target.value as ProductStatus)}
                        value=""
                      >
                          <option value="" disabled>Select Target Queue...</option>
                          <option value={ProductStatus.IN_ADMIN_STOCK}>Stock Intake Queue</option>
                          <option value={ProductStatus.ALLOTTED}>Allotment Queue</option>
                          <option value={ProductStatus.CONFIRMED_BY_CUSTOMER}>Billing Queue</option>
                          <option value={ProductStatus.BILLED}>Collection Queue</option>
                      </select>
                   </div>
                 </div>
               )}
            </div>

            {/* Task List */}
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                   <tr>
                     <th className="p-4 w-10">
                       <input 
                         type="checkbox" 
                         onChange={toggleSelectAll}
                         checked={currentQueueItems.length > 0 && selectedWorkItems.length === currentQueueItems.length}
                         className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                       />
                     </th>
                     <th className="p-4">Barcode / ID</th>
                     <th className="p-4">Type</th>
                     <th className="p-4">Weight</th>
                     <th className="p-4">Assigned Role</th>
                     <th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {currentQueueItems.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="p-16 text-center">
                          <div className="flex flex-col items-center text-slate-400">
                             <AlertTriangle size={32} className="mb-2 opacity-50" />
                             <p className="italic">No pending tasks in this queue.</p>
                          </div>
                       </td>
                     </tr>
                   ) : (
                     currentQueueItems.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="p-4">
                           <input 
                             type="checkbox" 
                             checked={selectedWorkItems.includes(p.id)}
                             onChange={(e) => {
                               if(e.target.checked) setSelectedWorkItems([...selectedWorkItems, p.id]);
                               else setSelectedWorkItems(selectedWorkItems.filter(id => id !== p.id));
                             }}
                             className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                           />
                         </td>
                         <td className="p-4 font-mono font-medium text-slate-600">{p.barcodeId}</td>
                         <td className="p-4 font-bold text-slate-900">{p.type}</td>
                         <td className="p-4 text-slate-600">{p.goldWeight}g</td>
                         <td className="p-4 text-xs">
                            {p.status === ProductStatus.IN_ADMIN_STOCK && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Stock Admin</span>}
                            {p.status === ProductStatus.ALLOTTED && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Allotment Admin</span>}
                            {p.status === ProductStatus.CONFIRMED_BY_CUSTOMER && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Billing Admin</span>}
                            {p.status === ProductStatus.BILLED && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Billing Admin</span>}
                            {p.status === ProductStatus.SUSPENDED && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Suspended</span>}
                         </td>
                         <td className="p-4 text-right">
                            <button 
                               onClick={() => { setSelectedWorkItems([p.id]); handleBulkSuspend(); }}
                               className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all" 
                               title="Suspend Task"
                            >
                               <Trash2 size={16} />
                            </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-10 animate-fade-in">
           {/* Top Actions */}
           <div className="flex justify-end">
              <Button onClick={() => setIsAddAdminModalOpen(true)}>
                 <UserPlus size={18} /> Provision New Admin
              </Button>
           </div>

           {/* Role Sections */}
           {roleSections.map((section) => {
             const roleAdmins = activeAdmins.filter(u => u.role === section.role);
             if (roleAdmins.length === 0) return null;

             const bgColors: any = {
               blue: 'bg-blue-50 border-blue-100 text-blue-700',
               amber: 'bg-amber-50 border-amber-100 text-amber-700',
               emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
               indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
             };

             return (
               <div key={section.role} className="space-y-4">
                  <div className={`p-4 rounded-xl border ${bgColors[section.color]} flex items-start gap-4`}>
                     <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                       <section.icon size={24} />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold">{section.title}</h3>
                       <p className="text-sm opacity-80">{section.description}</p>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {roleAdmins.map(admin => {
                        const stats = getAdminStats(admin);
                        return (
                          <Card key={admin.id} className="relative group overflow-hidden border-t-4 border-t-slate-200 hover:border-t-gold-400 transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 border border-slate-200">
                                      {admin.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900">{admin.name}</p>
                                      <p className="text-xs text-slate-500">{admin.email}</p>
                                   </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{stats.statLabel}</p>
                                   <p className="text-xl font-serif font-bold text-indigo-700 flex items-center gap-1">
                                     {stats.specificStat}
                                   </p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Logs</p>
                                   <p className="text-xl font-serif font-bold text-slate-900 flex items-center gap-1">
                                     {stats.activityCount} <TrendingUp size={12} className="text-emerald-500" />
                                   </p>
                                </div>
                             </div>

                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="w-full border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                               onClick={() => initiateOffboard(admin)}
                             >
                                <UserMinus size={16} /> Offboard & Delete
                             </Button>
                          </Card>
                        );
                      })}
                  </div>
               </div>
             );
           })}
           
           {activeAdmins.length === 0 && (
              <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                 <Users size={48} className="mx-auto mb-4 text-slate-400 opacity-50" />
                 <p className="text-slate-500 font-bold">No active administrators found.</p>
                 <p className="text-xs text-slate-400 mt-1">Use the button above to provision new staff.</p>
              </div>
           )}
        </div>
      )}

      {/* Inject Task Modal */}
      <Modal isOpen={isInjectModalOpen} onClose={() => setIsInjectModalOpen(false)} title={`Inject Task: ${workflowTab.replace(/_/g, ' ')}`}>
        <form onSubmit={handleInjectProduct} className="space-y-6">
           <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 mb-2">
             Warning: You are bypassing the standard chain of custody. This action will be logged.
           </div>
           <Input 
             label="Barcode ID" 
             value={injectBarcode} 
             onChange={e => setInjectBarcode(e.target.value)} 
             required 
           />
           <Select label="Jewellery Type" value={injectType} onChange={e => setInjectType(e.target.value)}>
             {JEWELLERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
           </Select>
           <Input 
             label="Gold Weight (g)" 
             type="number" 
             value={injectWeight} 
             onChange={e => setInjectWeight(e.target.value)} 
             required 
           />
           <Button type="submit" variant="gold" className="w-full">
             <Briefcase size={18} /> Create & Inject Task
           </Button>
        </form>
      </Modal>

      {/* Add Admin Modal (2-Step Verification) */}
      <Modal isOpen={isAddAdminModalOpen} onClose={closeCreationModal} title="Provision New Admin">
        {creationStep === 'DETAILS' ? (
          <form onSubmit={initiateAdminCreation} className="space-y-6 animate-fade-in">
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
               <option value={UserRole.DELIVERY_ADMIN}>Delivery Admin</option>
            </Select>
            <div className="bg-indigo-50 p-4 rounded-xl text-xs text-indigo-700 leading-relaxed border border-indigo-100">
               <span className="font-bold">Security Protocol:</span> A verification code will be sent to the entered email address. The account cannot be created without verifying email ownership.
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isSimulatingEmail}>
              {isSimulatingEmail ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> Sending Code...
                </>
              ) : (
                <>
                  <Mail size={18} /> Send Verification Code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyAndCreateAdmin} className="space-y-6 animate-slide-up">
             <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 border border-emerald-200">
                   <Mail size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verify Email Address</h3>
                <p className="text-xs text-slate-500 mt-1">
                   Enter the 4-digit code sent to <br/><span className="font-bold text-slate-700">{newAdminEmail}</span>
                </p>
             </div>

             <div className="relative">
                <Input 
                   type="text" 
                   value={enteredCreationOtp}
                   onChange={e => {
                     // Allow only numbers and max 4 digits
                     const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                     setEnteredCreationOtp(val);
                     setCreationError('');
                   }}
                   className="text-center tracking-[1em] font-mono text-2xl font-bold"
                   placeholder="0000"
                   maxLength={4}
                   required
                />
             </div>

             {creationError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-bold text-center border border-red-100 animate-pulse">
                   {creationError}
                </div>
             )}

             <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCreationStep('DETAILS')} type="button">
                   <ArrowLeft size={18} /> Back
                </Button>
                <Button type="submit" variant="success" className="flex-1" disabled={enteredCreationOtp.length !== 4}>
                   <CheckCircle2 size={18} /> Verify & Create Account
                </Button>
             </div>
          </form>
        )}
      </Modal>

      {/* Offboard / Transfer Modal */}
      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        title={offboardStep === 'SELECT' ? "Mandatory Data Transfer" : "Security Verification"}
      >
         {adminToOffboard && (
            <div className="space-y-6">
               
               {/* STEP 1: SELECT SUCCESSOR */}
               {offboardStep === 'SELECT' && (
                 <>
                   <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                      <div>
                         <p className="text-red-800 font-bold text-sm">Deletion Restricted</p>
                         <p className="text-red-600 text-xs mt-1 leading-relaxed">
                            To maintain data integrity, you <strong>cannot delete</strong> {adminToOffboard.name} until their active tasks and history are transferred to another admin of the same role.
                         </p>
                      </div>
                   </div>

                   {possibleSuccessors.length === 0 ? (
                      <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-500 mb-3">
                            <Users size={20} />
                         </div>
                         <p className="text-sm font-bold text-slate-700">No Successor Available</p>
                         <p className="text-xs text-slate-500 mt-1 mb-4">
                            There are no other admins with the role <strong>{adminToOffboard.role}</strong>. You must create a new one first.
                         </p>
                         <Button 
                           size="sm" 
                           onClick={() => { setIsTransferModalOpen(false); setIsAddAdminModalOpen(true); }}
                           className="w-full"
                         >
                            <UserPlus size={14} /> Create {adminToOffboard.role.split('_')[0]} Admin
                         </Button>
                      </div>
                   ) : (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-fade-in">
                         <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Select Successor for Data Transfer</p>
                         <select 
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            value={successorId}
                            onChange={e => setSuccessorId(e.target.value)}
                         >
                            <option value="">-- Choose Replacement --</option>
                            {possibleSuccessors.map(s => (
                               <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                            ))}
                         </select>
                      </div>
                   )}

                   <div className="pt-2 flex justify-end">
                      <Button 
                        disabled={!successorId} 
                        onClick={() => setOffboardStep('VERIFY')}
                        variant="primary"
                        className="w-full"
                      >
                         Proceed to Verification <ArrowRight size={16} />
                      </Button>
                   </div>
                 </>
               )}

               {/* STEP 2: VERIFY CODES */}
               {offboardStep === 'VERIFY' && (
                 <div className="animate-slide-up space-y-5">
                    <div className="text-center pb-2">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-gold-500 mb-4 shadow-lg shadow-gold-500/20">
                          <ShieldAlert size={32} />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900">High Security Action</h3>
                       <p className="text-xs text-slate-500">2-Factor Authentication Required to Delete Admin</p>
                    </div>

                    <div className="space-y-4">
                       {/* EMAIL OTP */}
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">1. Email Verification</label>
                          <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                <input 
                                   type="text" 
                                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                   placeholder="Enter OTP"
                                   value={emailOtp}
                                   onChange={e => setEmailOtp(e.target.value)}
                                   disabled={!isOtpSent}
                                />
                             </div>
                             <Button 
                               size="sm" 
                               variant={isOtpSent ? "secondary" : "outline"}
                               onClick={sendDemoOtp}
                               disabled={isOtpSent}
                               className="whitespace-nowrap min-w-[100px]"
                             >
                                {isOtpSent ? 'Sent' : 'Send OTP'}
                             </Button>
                          </div>
                          {isOtpSent && <p className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1"><CheckSquare size={10} /> Code sent to Super Admin email (Use: 5555)</p>}
                       </div>

                       {/* FIXED CODE */}
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">2. Secure Passcode</label>
                          <div className="relative">
                             <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                             <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="4-Digit Fixed Code"
                                maxLength={4}
                                value={fixedCode}
                                onChange={e => setFixedCode(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>

                    {verifyError && (
                       <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-bold text-center border border-red-100 animate-pulse">
                          {verifyError}
                       </div>
                    )}

                    <div className="flex gap-3 pt-2">
                       <Button variant="secondary" onClick={() => setOffboardStep('SELECT')} className="flex-1">Back</Button>
                       <Button variant="danger" onClick={finalConfirmOffboard} className="flex-1">Confirm Deletion</Button>
                    </div>
                 </div>
               )}
            </div>
         )}
      </Modal>
    </div>
  );
};