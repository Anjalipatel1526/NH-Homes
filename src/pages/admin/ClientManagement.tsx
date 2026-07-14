import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { Client } from '../../types';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCreditCard
} from 'react-icons/hi2';

export const ClientManagement: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formIdProof, setFormIdProof] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formImage, setFormImage] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Filtering Logic
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormCompany('');
    setFormGst('');
    setFormPan('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormIdProof('GST_Certificate.pdf');
    setFormNotes('');
    setFormStatus('Active');
    setFormImage('');
    setFormPassword('');
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCompany || !formPhone || !formEmail) {
      toast.error('Name, Company, Phone, and Email are required.');
      return;
    }

    try {
      await addClient({
        name: formName,
        companyName: formCompany,
        gstNumber: formGst,
        panNumber: formPan,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        city: formCity,
        state: formState,
        pincode: formPincode,
        idProof: formIdProof,
        status: formStatus,
        notes: formNotes,
        profileImage: formImage,
        documents: ['PAN_Card.pdf', 'GST_Certificate.pdf'],
        password: formPassword
      });

      logActivity(user?.name || 'Admin', 'admin', 'Created Client', 'create', `Created profile for client ${formName} (${formCompany})`);
      toast.success('Client profile created successfully');
      setIsAddModalOpen(false);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormName(client.name);
    setFormCompany(client.companyName);
    setFormGst(client.gstNumber);
    setFormPan(client.panNumber);
    setFormPhone(client.phone);
    setFormEmail(client.email);
    setFormAddress(client.address);
    setFormCity(client.city);
    setFormState(client.state);
    setFormPincode(client.pincode);
    setFormIdProof(client.idProof);
    setFormNotes(client.notes);
    setFormStatus(client.status);
    setFormImage(client.profileImage || '');
    setFormPassword(client.password || '');
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      await updateClient(selectedClient.id, {
        name: formName,
        companyName: formCompany,
        gstNumber: formGst,
        panNumber: formPan,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        city: formCity,
        state: formState,
        pincode: formPincode,
        idProof: formIdProof,
        notes: formNotes,
        status: formStatus,
        profileImage: formImage,
        password: formPassword
      });

      logActivity(user?.name || 'Admin', 'admin', 'Updated Client', 'update', `Updated contact details for client ${formName}`);
      toast.success('Client profile updated successfully');
      setIsEditModalOpen(false);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleDeleteTrigger = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      logActivity(user?.name || 'Admin', 'admin', 'Deleted Client', 'delete', `Deleted client profile: ${selectedClient.name}`);
      toast.success('Client deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedClient(null);
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Clients Management</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Maintain client GST profiles, billing addresses, documents, and rental histories.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<HiOutlinePlusCircle />}>
          Register New Client
        </Button>
      </div>

      {/* Filters panel */}
      <Card>
        <CardBody className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3 text-brand-dark-grey h-4 w-4" />
              <input
                type="text"
                placeholder="Search by client name, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Clients list table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Client Portfolio</th>
                  <th className="px-6 py-4">Company Details</th>
                  <th className="px-6 py-4">Contact Channels</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-brand-light-grey/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.name} src={client.profileImage} size="sm" />
                        <div>
                          <p className="font-bold text-brand-text">{client.name}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">{client.city}, {client.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-brand-text">{client.companyName}</p>
                      <p className="text-[10px] text-brand-dark-grey mt-0.5">PIN: {client.pincode}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5 text-brand-dark-grey font-medium">
                          <HiOutlineEnvelope className="h-3.5 w-3.5" /> {client.email}
                        </span>
                        <span className="flex items-center gap-1.5 text-brand-dark-grey font-medium">
                          <HiOutlinePhone className="h-3.5 w-3.5" /> {client.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={client.status === 'Active' ? 'success' : 'neutral'}>{client.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 mt-1.5">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="p-1.5" title="View Profile">
                        <HiOutlineEye className="h-4.5 w-4.5 text-brand-dark-grey" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(client)} className="p-1.5" title="Edit Profile">
                        <HiOutlinePencilSquare className="h-4.5 w-4.5 text-brand-dark-grey" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTrigger(client)} className="p-1.5 text-red-600 hover:text-red-700" title="Delete Profile">
                        <HiOutlineTrash className="h-4.5 w-4.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Clients Registered" description="There are no clients matching the search filter criteria." />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Client Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Corporate Client" size="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Client Representative Name *" placeholder="Amit Patel" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Input label="Company Name *" placeholder="L&T Construction Projects" required value={formCompany} onChange={e => setFormCompany(e.target.value)} />
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Phone Number *" placeholder="+91 99887 76655" required value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            <Input label="Email Address *" type="email" placeholder="amit.patel@lntecc.com" required value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            <Input
              label="Account Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formPassword}
              onChange={e => setFormPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer flex items-center justify-center p-1"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-4.5 w-4.5" />
                  ) : (
                    <HiOutlineEye className="h-4.5 w-4.5" />
                  )}
                </button>
              }
            />
          </div>

          <Input label="Registered Billing Address" placeholder="L&T House, Ballard Estate, Fort" value={formAddress} onChange={e => setFormAddress(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="City" placeholder="Mumbai" value={formCity} onChange={e => setFormCity(e.target.value)} />
            <Input label="State" placeholder="Maharashtra" value={formState} onChange={e => setFormState(e.target.value)} />
            <Input label="Pincode" placeholder="400001" value={formPincode} onChange={e => setFormPincode(e.target.value)} />
          </div>



          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Profile</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Client Profile" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Client Representative Name *" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Input label="Company Name *" required value={formCompany} onChange={e => setFormCompany(e.target.value)} />
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Phone Number *" required value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            <Input label="Email Address *" type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            <Input
              label="Account Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formPassword}
              onChange={e => setFormPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer flex items-center justify-center p-1"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-4.5 w-4.5" />
                  ) : (
                    <HiOutlineEye className="h-4.5 w-4.5" />
                  )}
                </button>
              }
            />
          </div>

          <Input label="Registered Billing Address" value={formAddress} onChange={e => setFormAddress(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="City" value={formCity} onChange={e => setFormCity(e.target.value)} />
            <Input label="State" value={formState} onChange={e => setFormState(e.target.value)} />
            <Input label="Pincode" value={formPincode} onChange={e => setFormPincode(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Select
              label="Account Access Status *"
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]}
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as any)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Client Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Client Profile Details" size="xl">
        {selectedClient && (
          <div className="space-y-6 text-left text-xs">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <Avatar name={selectedClient.name} src={selectedClient.profileImage} size="lg" />
              <div>
                <h3 className="text-base font-extrabold text-brand-text leading-tight">{selectedClient.name}</h3>
                <span className="text-xs text-brand-dark-grey mt-0.5 block">{selectedClient.companyName}</span>
                <div className="mt-2.5 flex gap-2">
                  <Badge variant={selectedClient.status === 'Active' ? 'success' : 'neutral'}>{selectedClient.status}</Badge>
                  <Badge variant="info">Corporate client</Badge>
                </div>
              </div>
            </div>

            {/* Profile fields details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 bg-brand-light-grey p-4 border border-brand-border rounded-xl">

              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Pincode / Location</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedClient.pincode} • {selectedClient.city}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Billing Address</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedClient.address}, {selectedClient.city}, {selectedClient.state}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Direct Phone</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedClient.phone}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Primary Email Address</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedClient.email}</p>
              </div>
            </div>



            {/* Tabs for Rental & Payments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rentals */}
              <div>
                <h4 className="font-bold text-xs text-brand-text border-b border-brand-border pb-1.5 mb-2.5 uppercase tracking-wider flex items-center gap-2">
                  Rental Transactions
                </h4>
                {selectedClient.rentalHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedClient.rentalHistory.map((rent, idx) => (
                      <div key={idx} className="p-2.5 bg-brand-light-grey border border-brand-border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-brand-text">{rent.rentalNumber}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">Duration: {rent.startDate} to {rent.endDate}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-primary block">₹{rent.totalAmount.toLocaleString('en-IN')}</span>
                          <Badge variant={rent.status === 'Completed' ? 'success' : rent.status === 'Active' ? 'info' : 'warning'} className="mt-0.5 text-[9px]">{rent.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-dark-grey italic">No rental transactions registered for this account.</p>
                )}
              </div>

              {/* Payments */}
              <div>
                <h4 className="font-bold text-xs text-brand-text border-b border-brand-border pb-1.5 mb-2.5 uppercase tracking-wider flex items-center gap-2">
                  <HiOutlineCreditCard className="h-4 w-4 text-brand-dark-grey" /> Payment Records
                </h4>
                {selectedClient.paymentHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedClient.paymentHistory.map((pmt, idx) => (
                      <div key={idx} className="p-2.5 bg-brand-light-grey border border-brand-border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-brand-text">{pmt.invoiceNumber}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">{pmt.date} via {pmt.method}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-brand-text block">₹{pmt.amount.toLocaleString('en-IN')}</span>
                          <Badge variant={pmt.status === 'Completed' ? 'success' : pmt.status === 'Partial' ? 'brand' : 'warning'} className="mt-0.5 text-[9px]">{pmt.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-dark-grey italic">No payment history recorded for this account.</p>
                )}
              </div>
            </div>



            <div className="flex justify-end pt-4 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setIsDetailModalOpen(false)}>Close Portfolio</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Client Removal" size="sm">
        <div className="space-y-4 text-left text-xs">
          <p className="text-brand-text leading-relaxed">
            Are you sure you want to permanently delete the profile for client <strong className="text-red-600">{selectedClient?.name} ({selectedClient?.companyName})</strong>? This will remove all contact registries.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>Delete Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ClientManagement;
