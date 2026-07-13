import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { RentalRequest, InventoryStatus } from '../../types';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import {
  HiOutlineCalendar,
  HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2';

export const ReturnsCalendar: React.FC = () => {
  const { rentalRequests, inventory, updateInventoryItem, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRental, setSelectedRental] = useState<RentalRequest | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  // Check-In Form States
  const [itemConditions, setItemConditions] = useState<Record<string, { condition: string; notes: string }>>({});

  // Active rentals that need to be returned
  const activeRentals = rentalRequests.filter(r => {
    // Show only approved rentals
    if (r.status !== 'Approved') return false;

    // Check if at least one item is still rented in our inventory
    return r.items.some(i => {
      const invItem = inventory.find(inv => inv.equipmentId === i.equipmentId);
      return invItem?.status === 'Rented';
    });
  });

  const filteredRentals = activeRentals.filter(r => 
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rentalNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCheckIn = (rental: RentalRequest) => {
    setSelectedRental(rental);
    
    // Initialize conditions
    const initialConditions: Record<string, { condition: string; notes: string }> = {};
    rental.items.forEach(i => {
      initialConditions[i.equipmentId] = { condition: 'Available', notes: '' };
    });
    setItemConditions(initialConditions);
    setIsCheckInModalOpen(true);
  };

  const handleConditionChange = (equipmentId: string, value: string) => {
    setItemConditions(prev => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        condition: value
      }
    }));
  };

  const handleNotesChange = (equipmentId: string, value: string) => {
    setItemConditions(prev => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        notes: value
      }
    }));
  };

  const handleConfirmCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    // Process each item and update inventory status in database
    selectedRental.items.forEach(item => {
      const conditionData = itemConditions[item.equipmentId];
      const invItem = inventory.find(i => i.equipmentId === item.equipmentId);
      
      if (invItem && conditionData) {
        let finalStatus: InventoryStatus = 'Available';
        
        if (conditionData.condition === 'Maintenance') {
          finalStatus = 'Maintenance';
        } else if (conditionData.condition === 'Damaged') {
          finalStatus = 'Damaged';
        }

        // Update inventory item status
        updateInventoryItem(invItem.id, {
          status: finalStatus,
          currentLocation: 'Panvel Yard Main Depot',
          description: conditionData.notes 
            ? `${invItem.description || ''} | Check-in Notes: ${conditionData.notes}`
            : invItem.description
        });

        // Log specific item return
        logActivity(
          user?.name || 'Staff User',
          'employee',
          'Equipment Check-In',
          'system',
          `Checked in asset ${item.equipmentName} (${item.equipmentId}) as ${finalStatus}. Condition details: ${conditionData.notes || 'None'}`
        );
      }
    });

    toast.success(`Processed returns for rental contract ${selectedRental.rentalNumber}!`);
    setIsCheckInModalOpen(false);
    setSelectedRental(null);
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">Returns Center</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Track expected return dates, check in returned equipment, and log equipment conditions.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-4">
          <div className="relative">
            <HiOutlineCalendar className="absolute left-3.5 top-3.5 text-brand-dark-grey h-4 w-4" />
            <input
              type="text"
              placeholder="Filter by company name, project lead, or contract number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary text-brand-text"
            />
          </div>
        </CardBody>
      </Card>

      {/* Grid of returns */}
      <Card>
        <CardHeader>
          <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Pending Returns Schedule</h3>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {filteredRentals.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                  <th className="px-6 py-4">Contract No</th>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Equipment Description</th>
                  <th className="px-6 py-4">Scheduled Return</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredRentals.map(rental => {
                  const isOverdue = new Date(rental.expectedReturnDate) < new Date();
                  return (
                    <tr key={rental.id} className="hover:bg-brand-light-grey/30 transition-colors whitespace-nowrap">
                      <td className="px-6 py-4 font-bold text-brand-text font-mono">{rental.rentalNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-brand-text">{rental.companyName}</p>
                        <p className="text-[10px] text-brand-dark-grey mt-0.5">{rental.clientName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-text">{rental.items[0]?.equipmentName}</p>
                        <p className="text-[10px] text-brand-dark-grey mt-0.5">{rental.items.length} units rented total</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-text">{rental.expectedReturnDate}</td>
                      <td className="px-6 py-4">
                        <Badge variant={isOverdue ? 'danger' : 'warning'}>
                          {isOverdue ? 'Overdue Return' : 'Active On-Site'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="primary" size="sm" onClick={() => handleOpenCheckIn(rental)} leftIcon={<HiOutlineClipboardDocumentCheck />}>
                            Check-In Items
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Active Shipments" description="All equipment shipments are checked in or awaiting dispatcher allocations." />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Check In Modal */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="Audit & Process Yard Return" size="lg">
        {selectedRental && (
          <form onSubmit={handleConfirmCheckIn} className="space-y-4 text-left text-xs">
            <div className="bg-brand-light-grey p-3 border border-brand-border rounded-xl space-y-1 block">
              <span className="text-[10px] text-brand-dark-grey block">Corporate Client:</span>
              <strong className="text-brand-text text-sm block">{selectedRental.companyName} ({selectedRental.clientName})</strong>
              <span className="text-[10px] text-brand-dark-grey block mt-1">Contract: <strong>{selectedRental.rentalNumber}</strong></span>
            </div>

            {/* List of items with condition inputs */}
            <div className="space-y-4">
              <h4 className="font-bold text-[10px] uppercase text-brand-dark-grey tracking-wider">Inspect Received Assets</h4>
              
              {selectedRental.items.map((item) => (
                <div key={item.equipmentId} className="p-3 border border-brand-border rounded-xl space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-text">{item.equipmentName} ({item.equipmentId})</span>
                    <span className="text-[10px] font-semibold text-brand-dark-grey">Daily Rate: ₹{item.dailyCharges.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      label="Post-Rental Status *"
                      options={[
                        { label: 'Available (Excellent Condition)', value: 'Available' },
                        { label: 'Maintenance (Requires Servicing)', value: 'Maintenance' },
                        { label: 'Damaged (Needs Major Repair)', value: 'Damaged' }
                      ]}
                      value={itemConditions[item.equipmentId]?.condition || 'Available'}
                      onChange={e => handleConditionChange(item.equipmentId, e.target.value)}
                    />
                    <Input
                      label="Inspection Notes"
                      placeholder="e.g. Engine service check ok. Minimal cosmetic scratches."
                      value={itemConditions[item.equipmentId]?.notes || ''}
                      onChange={e => handleNotesChange(item.equipmentId, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCheckInModalOpen(false)}>Cancel Inspection</Button>
              <Button variant="primary" size="sm" type="submit">Verify & Check-In</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default ReturnsCalendar;
