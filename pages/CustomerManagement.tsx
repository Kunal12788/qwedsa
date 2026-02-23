import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { Search, UserCheck, UserPlus, Check, X, MapPin, Phone, Calendar, Mail, ShoppingBag, FileText, Globe } from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const { customers, verifyUser, deleteUser, addCustomer } = useAppStore();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newGst, setNewGst] = useState('');
  const [newPan, setNewPan] = useState('');

  // Derived state
  const pendingCustomers = customers.filter(c => c.status === 'PENDING');
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE');

  // Filtering
  const displayedActive = activeCustomers.filter(c => 
    c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.uniqueName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(newName && newEmail && newPhone && newAddress) {
      addCustomer(newName, newEmail, newPhone, newAddress, newCity, newPincode, newLandmark, newGst, newPan);
      // Reset
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      setNewCity('');
      setNewPincode('');
      setNewLandmark('');
      setNewGst('');
      setNewPan('');
      setIsAddModalOpen(false);
      // Switch to Active tab to show result
      setActiveTab('ACTIVE');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
         <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Customer Registry</h2>
            <p className="text-slate-500 mt-1">Manage KYC approvals and customer directory.</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'PENDING' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
            >
               <UserPlus size={16} />
               Approval Queue
               {pendingCustomers.length > 0 && (
                 <span className="ml-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingCustomers.length}</span>
               )}
            </button>
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'ACTIVE' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
               <UserCheck size={16} />
               Active Directory
            </button>
         </div>
      </div>

      {activeTab === 'PENDING' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {pendingCustomers.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                  <Check size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
                <p className="text-slate-500 mt-1">No pending customer applications at the moment.</p>
             </div>
           ) : (
             pendingCustomers.map(customer => (
                <Card key={customer.id} className="relative overflow-hidden border-l-4 border-l-indigo-500">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {customer.legalName.charAt(0)}
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-900 text-lg">{customer.legalName}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                               <Calendar size={12} /> Applied: {new Date(customer.joinedAt).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase">New Application</span>
                   </div>

                   <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                      <div className="flex gap-3">
                         <Mail size={16} className="text-slate-400 shrink-0" />
                         <span className="text-slate-700">{customer.email}</span>
                      </div>
                      <div className="flex gap-3">
                         <Phone size={16} className="text-slate-400 shrink-0" />
                         <span className="text-slate-700">{customer.phone || 'N/A'}</span>
                      </div>
                      <div className="flex gap-3">
                         <MapPin size={16} className="text-slate-400 shrink-0" />
                         <span className="text-slate-700">
                           {customer.address ? `${customer.address}, ${customer.city}` : 'No Address Provided'}
                         </span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="danger" 
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                        onClick={() => deleteUser(customer.id)}
                      >
                         <X size={16} /> Reject
                      </Button>
                      <Button 
                        variant="success"
                        onClick={() => verifyUser(customer.id)}
                      >
                         <Check size={16} /> Approve Access
                      </Button>
                   </div>
                </Card>
             ))
           )}
        </div>
      ) : (
        <Card title="Active Customer Database" className="min-h-[500px] flex flex-col" 
           action={
             <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
               <UserPlus size={16} /> Add Customer
             </Button>
           }
        >
           <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search by name, ID or email..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-slate-600">
                 <ShoppingBag size={16} />
                 <span>Total Customers: {activeCustomers.length}</span>
              </div>
           </div>

           <div className="overflow-x-auto flex-1 rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                    <tr>
                       <th className="p-4">Customer Details</th>
                       <th className="p-4">Contact Info</th>
                       <th className="p-4">Location</th>
                       <th className="p-4">Compliance</th>
                       <th className="p-4">Inventory Holdings</th>
                       <th className="p-4 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {displayedActive.length === 0 ? (
                       <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">No active customers found matching your search.</td>
                       </tr>
                    ) : (
                       displayedActive.map(customer => (
                          <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                                      {customer.legalName.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900">{customer.legalName}</p>
                                      <p className="text-xs text-slate-400 font-mono">{customer.uniqueName}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 text-slate-600">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-xs">
                                      <Mail size={12} className="text-slate-400" /> {customer.email}
                                   </div>
                                   {customer.phone && (
                                      <div className="flex items-center gap-2 text-xs">
                                         <Phone size={12} className="text-slate-400" /> {customer.phone}
                                      </div>
                                   )}
                                </div>
                             </td>
                             <td className="p-4 text-slate-600 text-xs max-w-xs truncate">
                                {customer.city ? (
                                   <div className="flex items-center gap-1">
                                      <MapPin size={12} className="text-slate-400" /> {customer.city}
                                      {customer.pincode && <span className="text-slate-400">({customer.pincode})</span>}
                                   </div>
                                ) : '-'}
                             </td>
                             <td className="p-4 text-xs">
                                <div className="space-y-1">
                                   <p><span className="text-slate-400 font-bold">GST:</span> <span className="font-mono">{customer.gstin || 'N/A'}</span></p>
                                   <p><span className="text-slate-400 font-bold">PAN:</span> <span className="font-mono">{customer.pan || 'N/A'}</span></p>
                                </div>
                             </td>
                             <td className="p-4">
                                <span className="font-serif font-bold text-slate-900 text-lg">{customer.totalGoldInventory.toFixed(2)}</span>
                                <span className="text-xs text-slate-500 ml-1 font-bold">g</span>
                             </td>
                             <td className="p-4 text-right">
                                <Badge status={customer.status} />
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </Card>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer">
         <form onSubmit={handleManualAdd} className="space-y-6">
            <div className="bg-indigo-50 text-indigo-800 text-xs p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
              <UserCheck size={18} className="mt-0.5 shrink-0" />
              <div>
                 <p className="font-bold">Automated Setup</p>
                 <p className="opacity-90 mt-1">
                    New customers are automatically activated. 
                    Default login password will be set to <strong className="font-mono bg-indigo-100 px-1 rounded">1234</strong>. 
                    They can change this upon first login.
                 </p>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Personal Details */}
                <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Personal Details</h4>
                   <Input 
                     label="Legal Name" 
                     value={newName} 
                     onChange={e => setNewName(e.target.value)} 
                     placeholder="e.g. John Smith"
                     required 
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Email Address" 
                        type="email"
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)} 
                        placeholder="john@example.com"
                        required 
                      />
                      <Input 
                        label="Phone Number" 
                        value={newPhone} 
                        onChange={e => setNewPhone(e.target.value)} 
                        placeholder="+91 98765..."
                        required
                      />
                   </div>
                </div>

                {/* Address */}
                <div className="space-y-3 pt-2">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Location</h4>
                   <Input 
                     label="Full Address" 
                     value={newAddress} 
                     onChange={e => setNewAddress(e.target.value)} 
                     placeholder="Street Address, Building, etc."
                     required
                   />
                   <Input 
                     label="Landmark" 
                     value={newLandmark} 
                     onChange={e => setNewLandmark(e.target.value)} 
                     placeholder="Near..."
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="City" 
                        value={newCity} 
                        onChange={e => setNewCity(e.target.value)} 
                        placeholder="Mumbai"
                        required
                      />
                      <Input 
                        label="Pincode" 
                        value={newPincode} 
                        onChange={e => setNewPincode(e.target.value)} 
                        placeholder="400001"
                        maxLength={6}
                        required
                      />
                   </div>
                </div>

                {/* Tax */}
                <div className="space-y-3 pt-2">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Compliance & Tax</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="GST Number" 
                        value={newGst} 
                        onChange={e => setNewGst(e.target.value)} 
                        placeholder="27ABCDE1234F1Z5"
                        maxLength={15}
                      />
                      <Input 
                        label="PAN Number" 
                        value={newPan} 
                        onChange={e => setNewPan(e.target.value)} 
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                   </div>
                </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100">
               <Button type="submit" variant="primary" className="w-full">
                  Create Customer Record
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};