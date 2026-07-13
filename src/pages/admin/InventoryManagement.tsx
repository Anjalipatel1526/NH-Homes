import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { InventoryItem, InventoryStatus } from '../../types';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineQrCode,
  HiOutlineWrench
} from 'react-icons/hi2';

export const InventoryManagement: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [previewFullscreenImage, setPreviewFullscreenImage] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState(0);
  const [formPriceDay, setFormPriceDay] = useState(0);
  const [formPriceWeek, setFormPriceWeek] = useState(0);
  const [formPriceMonth, setFormPriceMonth] = useState(0);
  const [formDeposit, setFormDeposit] = useState(0);
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<InventoryStatus>('Available');
  const [formImage, setFormImage] = useState('');

  // Categories list
  const categories = [
    'Excavators', 'Concrete Mixers', 'Scaffolding', 'Compactors', 
    'Drilling Machines', 'Cutting Machines', 'Generators', 
    'Road Rollers', 'Water Pumps', 'Power Tools', 'Construction Machinery', 
    'Safety Equipment', 'Electrical Tools', 'Hand Tools'
  ];

  // Filtering Logic
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormCategory('');
    setFormBrand('');
    setFormModel('');
    setFormSerial('');
    setFormPurchaseDate('');
    setFormPurchasePrice(0);
    setFormPriceDay(0);
    setFormPriceWeek(0);
    setFormPriceMonth(0);
    setFormDeposit(0);
    setFormLocation('');
    setFormDescription('');
    setFormImage('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBrand || !formModel || !formSerial || !formCategory || !formLocation || !formPriceDay) {
      toast.error('Please complete all required fields');
      return;
    }

    addInventoryItem({
      name: formName,
      category: formCategory,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      purchaseDate: formPurchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: Number(formPurchasePrice),
      rentalPriceDay: Number(formPriceDay),
      rentalPriceWeek: Number(formPriceWeek),
      rentalPriceMonth: Number(formPriceMonth),
      securityDeposit: Number(formDeposit),
      currentLocation: formLocation || 'Yard Panvel',
      images: formImage ? [formImage] : [],
      status: 'Available',
      description: formDescription,
      specifications: [
        { label: 'Brand & Model', value: `${formBrand} ${formModel}` },
        { label: 'Serial No', value: formSerial }
      ]
    });

    logActivity(user?.name || 'Admin', 'admin', 'Created Equipment', 'create', `Created equipment unit ${formName}`);
    toast.success('Equipment added successfully');
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setFormSerial(item.serialNumber);
    setFormPurchaseDate(item.purchaseDate);
    setFormPurchasePrice(item.purchasePrice);
    setFormPriceDay(item.rentalPriceDay);
    setFormPriceWeek(item.rentalPriceWeek);
    setFormPriceMonth(item.rentalPriceMonth);
    setFormDeposit(item.securityDeposit);
    setFormLocation(item.currentLocation);
    setFormDescription(item.description);
    setFormStatus(item.status);
    setFormImage(item.images[0]);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formName || !formBrand || !formModel || !formSerial || !formCategory || !formLocation || !formPriceDay) {
      toast.error('Please complete all required fields');
      return;
    }

    updateInventoryItem(selectedItem.id, {
      name: formName,
      category: formCategory,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      purchaseDate: formPurchaseDate,
      purchasePrice: Number(formPurchasePrice),
      rentalPriceDay: Number(formPriceDay),
      rentalPriceWeek: Number(formPriceWeek),
      rentalPriceMonth: Number(formPriceMonth),
      securityDeposit: Number(formDeposit),
      currentLocation: formLocation,
      description: formDescription,
      status: formStatus,
      images: [formImage]
    });

    logActivity(user?.name || 'Admin', 'admin', 'Updated Equipment', 'update', `Updated details for ${formName}`);
    toast.success('Equipment updated successfully');
    setIsEditModalOpen(false);
  };

  const handleDeleteTrigger = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;
    deleteInventoryItem(selectedItem.id);
    logActivity(user?.name || 'Admin', 'admin', 'Deleted Equipment', 'delete', `Deleted equipment unit ID ${selectedItem.equipmentId}`);
    setIsDeleteConfirmOpen(false);
    setSelectedItem(null);
  };

  const handleOpenDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: InventoryStatus) => {
    switch (status) {
      case 'Available': return <Badge variant="success">Available</Badge>;
      case 'Rented': return <Badge variant="info">Rented</Badge>;
      case 'Maintenance': return <Badge variant="warning">Maintenance</Badge>;
      case 'Reserved': return <Badge variant="neutral">Reserved</Badge>;
      case 'Lost': return <Badge variant="danger">Lost</Badge>;
      case 'Damaged': return <Badge variant="danger">Damaged</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Inventory Registry</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Manage heavy equipment, power tools, scaffolding, and structural items.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<HiOutlinePlusCircle />}>
          Add New Equipment
        </Button>
      </div>

      {/* Filter panel */}
      <Card>
        <CardBody className="py-5 px-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey h-4 w-4" />
              <input
                type="text"
                placeholder="Search by ID, equipment name, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-xl text-xs transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            
            {/* Category Filter */}
            <div className="w-full md:w-52">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-xs bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-brand-text font-medium appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px'
                }}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-xs bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-brand-text font-medium appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table grid */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {filteredInventory.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                  <th className="px-6 py-4">Equipment ID</th>
                  <th className="px-6 py-4">Thumbnail</th>
                  <th className="px-6 py-4">Equipment Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Day Rent Rate</th>
                  <th className="px-6 py-4">Current Yard</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-light-grey/30 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4 font-bold text-brand-text">{item.equipmentId}</td>
                    <td className="px-6 py-4">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt={item.name} className="h-10 w-12 rounded object-cover border border-brand-border" />
                      ) : (
                        <div className="h-10 w-12 rounded border border-dashed border-brand-border bg-brand-light-grey flex items-center justify-center">
                          <svg className="w-5 h-5 text-brand-dark-grey opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-text">
                      {item.name}
                      <span className="block text-[10px] text-brand-dark-grey font-medium mt-0.5">{item.brand} • {item.model}</span>
                    </td>
                    <td className="px-6 py-4 text-brand-dark-grey font-medium">{item.category}</td>
                    <td className="px-6 py-4 font-bold text-primary">₹{item.rentalPriceDay.toLocaleString('en-IN')}/day</td>
                    <td className="px-6 py-4 text-brand-text font-medium">{item.currentLocation}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(item)} className="p-1.5" title="View Details">
                          <HiOutlineEye className="h-4.5 w-4.5 text-brand-dark-grey" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)} className="p-1.5" title="Edit Item">
                          <HiOutlinePencilSquare className="h-4.5 w-4.5 text-brand-dark-grey" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTrigger(item)} className="p-1.5 text-red-600 hover:text-red-700" title="Delete Item">
                          <HiOutlineTrash className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Equipment Found" description="Try refining your category selections or search query." />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Equipment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Equipment Asset" size="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Equipment Name *" placeholder="e.g. Caterpillar 320DL Excavator" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Select label="Category *" placeholder="Select a category" options={categories.map(c => ({ label: c, value: c }))} value={formCategory} onChange={e => setFormCategory(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Brand *" placeholder="e.g. Caterpillar" required value={formBrand} onChange={e => setFormBrand(e.target.value)} />
            <Input label="Model *" placeholder="e.g. 320 DL" required value={formModel} onChange={e => setFormModel(e.target.value)} />
            <Input label="Serial Number *" placeholder="e.g. CAT-SN-998877" required value={formSerial} onChange={e => setFormSerial(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Current Location / Yard *" placeholder="e.g. Yard Panvel" required value={formLocation} onChange={e => setFormLocation(e.target.value)} />
            <Input label="Day Rent Rate (₹) *" type="number" min="0" placeholder="e.g. 1500" required value={formPriceDay || ''} onChange={e => setFormPriceDay(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Week Rent Rate (₹)" type="number" min="0" placeholder="e.g. 9000" value={formPriceWeek || ''} onChange={e => setFormPriceWeek(Number(e.target.value))} />
            <Input label="Month Rent Rate (₹)" type="number" min="0" placeholder="e.g. 35000" value={formPriceMonth || ''} onChange={e => setFormPriceMonth(Number(e.target.value))} />
            <Input label="Security Deposit (₹)" type="number" min="0" placeholder="e.g. 5000" value={formDeposit || ''} onChange={e => setFormDeposit(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" value={formPurchaseDate} onChange={e => setFormPurchaseDate(e.target.value)} />
            <Input label="Purchase Price (₹)" type="number" min="0" placeholder="e.g. 450000" value={formPurchasePrice || ''} onChange={e => setFormPurchasePrice(Number(e.target.value))} />
          </div>

          <Textarea label="Asset Description" placeholder="Detailed specifications, attachments, driver requirements..." value={formDescription} onChange={e => setFormDescription(e.target.value)} />
          
          <div className="space-y-1.5 text-left">
            <span className="block font-semibold text-brand-text">Equipment Image</span>
            <div className="flex items-center gap-4">
              {formImage ? (
                <div className="relative group shrink-0">
                  <img
                    src={formImage}
                    alt="Preview"
                    className="h-20 w-24 object-cover rounded-lg border border-brand-border shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewFullscreenImage(formImage)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormImage('');
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow"
                    title="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="h-20 w-24 rounded-lg border border-dashed border-brand-border bg-brand-light-grey flex items-center justify-center text-brand-dark-grey shrink-0">
                  <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <label className="flex-1 cursor-pointer">
                <div className="border border-brand-border hover:border-primary/50 rounded-xl px-4 py-3 bg-white text-center hover:bg-brand-light-grey/30 transition-all">
                  <span className="block font-semibold text-brand-text text-xs">Choose image file</span>
                  <span className="block text-[10px] text-brand-dark-grey mt-0.5">Supports PNG, JPG, GIF (Max 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Register Equipment</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Equipment Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Asset Details" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Equipment Name *" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Select label="Category *" options={categories.map(c => ({ label: c, value: c }))} value={formCategory} onChange={e => setFormCategory(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Brand *" required value={formBrand} onChange={e => setFormBrand(e.target.value)} />
            <Input label="Model *" required value={formModel} onChange={e => setFormModel(e.target.value)} />
            <Input label="Serial Number *" required value={formSerial} onChange={e => setFormSerial(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Current Location / Yard *" required value={formLocation} onChange={e => setFormLocation(e.target.value)} />
            <Input label="Day Rent Rate (₹) *" type="number" min="0" required value={formPriceDay || ''} onChange={e => setFormPriceDay(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Week Rent Rate (₹)" type="number" min="0" value={formPriceWeek || ''} onChange={e => setFormPriceWeek(Number(e.target.value))} />
            <Input label="Month Rent Rate (₹)" type="number" min="0" value={formPriceMonth || ''} onChange={e => setFormPriceMonth(Number(e.target.value))} />
            <Input label="Security Deposit (₹)" type="number" min="0" value={formDeposit || ''} onChange={e => setFormDeposit(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" value={formPurchaseDate} onChange={e => setFormPurchaseDate(e.target.value)} />
            <Input label="Purchase Price (₹)" type="number" min="0" value={formPurchasePrice || ''} onChange={e => setFormPurchasePrice(Number(e.target.value))} />
          </div>

          <Select
            label="Equipment Operational Status *"
            options={[
              { label: 'Available', value: 'Available' },
              { label: 'Rented', value: 'Rented' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Reserved', value: 'Reserved' },
              { label: 'Lost', value: 'Lost' },
              { label: 'Damaged', value: 'Damaged' }
            ]}
            value={formStatus}
            onChange={e => setFormStatus(e.target.value as InventoryStatus)}
          />

          <Textarea label="Asset Description" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
          
          <div className="space-y-1.5 text-left">
            <span className="block font-semibold text-brand-text">Equipment Image</span>
            <div className="flex items-center gap-4">
              {formImage ? (
                <div className="relative group shrink-0">
                  <img
                    src={formImage}
                    alt="Preview"
                    className="h-20 w-24 object-cover rounded-lg border border-brand-border shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewFullscreenImage(formImage)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormImage('');
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow"
                    title="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="h-20 w-24 rounded-lg border border-dashed border-brand-border bg-brand-light-grey flex items-center justify-center text-brand-dark-grey shrink-0">
                  <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <label className="flex-1 cursor-pointer">
                <div className="border border-brand-border hover:border-primary/50 rounded-xl px-4 py-3 bg-white text-center hover:bg-brand-light-grey/30 transition-all">
                  <span className="block font-semibold text-brand-text text-xs">Choose image file</span>
                  <span className="block text-[10px] text-brand-dark-grey mt-0.5">Supports PNG, JPG, GIF (Max 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Update Asset</Button>
          </div>
        </form>
      </Modal>

      {/* Equipment Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Equipment Specifications & History" size="lg">
        {selectedItem && (
          <div className="space-y-6 text-left text-xs">
            {/* Header Details */}
            <div className="flex gap-4">
              {selectedItem.images[0] ? (
                <img src={selectedItem.images[0]} alt={selectedItem.name} className="h-24 w-32 object-cover rounded-lg border border-brand-border shadow-soft" />
              ) : (
                <div className="h-24 w-32 rounded-lg border border-dashed border-brand-border bg-brand-light-grey flex items-center justify-center">
                  <svg className="w-10 h-10 text-brand-dark-grey opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-base font-extrabold text-brand-text leading-tight">{selectedItem.name}</h3>
                <span className="block text-xs text-brand-dark-grey mt-1">ID: <strong className="text-brand-text">{selectedItem.equipmentId}</strong> | Brand: <strong className="text-brand-text">{selectedItem.brand} {selectedItem.model}</strong></span>
                <div className="mt-2.5 flex gap-2">
                  {getStatusBadge(selectedItem.status)}
                  <Badge variant="brand">{selectedItem.category}</Badge>
                </div>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-light-grey p-4 border border-brand-border rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Daily Rent</span>
                <p className="font-extrabold text-primary text-sm mt-0.5">₹{selectedItem.rentalPriceDay.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Weekly Rent</span>
                <p className="font-extrabold text-brand-text text-sm mt-0.5">₹{selectedItem.rentalPriceWeek.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Monthly Rent</span>
                <p className="font-extrabold text-brand-text text-sm mt-0.5">₹{selectedItem.rentalPriceMonth.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Security Deposit</span>
                <p className="font-extrabold text-brand-text text-sm mt-0.5">₹{selectedItem.securityDeposit.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Barcode & QR Code simulation */}
            <div className="border border-brand-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-light-grey rounded-lg border border-brand-border">
                  <HiOutlineQrCode className="h-12 w-12 text-brand-text" />
                </div>
                <div>
                  <span className="font-bold text-brand-text text-xs">Asset QR ID</span>
                  <code className="block text-[10px] text-brand-dark-grey font-mono mt-0.5">{selectedItem.qrCode}</code>
                  <span className="text-[10px] text-primary hover:underline font-bold cursor-pointer mt-1 block">Download Tag PDF</span>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-brand-border hidden md:block" />

              <div>
                <span className="font-bold text-brand-text text-xs block mb-1">Asset Serial Number Tag</span>
                <div className="bg-brand-light-grey px-4 py-2 border border-brand-border rounded font-mono text-center text-xs font-bold text-brand-text tracking-wider">
                  ||||| | ||||| | || || {selectedItem.serialNumber}
                </div>
              </div>
            </div>

            {/* Tabs for Maintenance & Rental History */}
            <div className="space-y-4">
              {/* Maintenance history */}
              <div>
                <h4 className="font-bold text-xs text-brand-text border-b border-brand-border pb-1.5 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineWrench className="h-4 w-4 text-brand-dark-grey" /> Maintenance Logs
                </h4>
                {selectedItem.maintenanceHistory.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItem.maintenanceHistory.map(log => (
                      <div key={log.id} className="p-2.5 bg-brand-light-grey rounded-lg border border-brand-border flex justify-between items-start">
                        <div>
                          <p className="font-bold text-brand-text">{log.type}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">{log.description} • Tech: {log.technician}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-primary block">₹{log.cost.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-brand-dark-grey block mt-0.5">{log.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-dark-grey italic">No maintenance history recorded for this unit.</p>
                )}
              </div>

              {/* Rental History */}
              <div>
                <h4 className="font-bold text-xs text-brand-text border-b border-brand-border pb-1.5 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  Rental Transactions
                </h4>
                {selectedItem.rentalHistory.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItem.rentalHistory.map(rent => (
                      <div key={rent.id} className="p-2.5 bg-brand-light-grey rounded-lg border border-brand-border flex justify-between items-center">
                        <div>
                          <p className="font-bold text-brand-text">{rent.clientName}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">Rental No: {rent.rentalNumber}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-brand-text block">{rent.startDate} to {rent.endDate}</span>
                          <Badge variant={rent.status === 'Completed' ? 'success' : 'brand'} className="mt-0.5 text-[9px]">{rent.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-dark-grey italic">No rental transactions recorded for this asset.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setIsDetailModalOpen(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Equipment Deletion" size="sm">
        <div className="space-y-4 text-left text-xs">
          <p className="text-brand-text leading-relaxed font-medium">
            Are you sure you want to delete?
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>Delete Asset</Button>
          </div>
        </div>
      </Modal>

      {previewFullscreenImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewFullscreenImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={previewFullscreenImage}
              alt="Fullscreen Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setPreviewFullscreenImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors cursor-pointer shadow-md"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryManagement;
