import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types';
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
  HiOutlineKey,
  HiOutlineBriefcase,
  HiOutlineCalendarDays
} from 'react-icons/hi2';

export const EmployeeManagement: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'employee'>('employee');
  const [formDept, setFormDept] = useState('Equipment Operations');
  const [formAddress, setFormAddress] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formImage, setFormImage] = useState('');

  // Auto Generate Credentials when Name changes
  useEffect(() => {
    if (formName && isAddModalOpen) {
      const parts = formName.toLowerCase().split(' ');
      const username = parts.length >= 2 ? `${parts[0]}.${parts[1][0]}` : parts[0];
      setFormUsername(username.replace(/[^a-z0-9.]/g, ''));
      setFormEmail(`${username.replace(/[^a-z0-9.]/g, '')}@nhhomes.in`);
      
      // Auto-generate standard starting password
      const randNum = Math.floor(100 + Math.random() * 900);
      setFormPassword(`NHHome@${randNum}`);
    }
  }, [formName, isAddModalOpen]);

  // List of departments
  const departments = [
    'Management',
    'Equipment Operations',
    'Sales & Client Relations',
    'Logistics & Dispatch',
    'Maintenance & Service',
    'Accounts & Finance'
  ];

  // Filtering Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('employee');
    setFormDept('Equipment Operations');
    setFormAddress('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormImage('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formPassword || !formEmail) {
      toast.error('All credential fields are required.');
      return;
    }

    try {
      await addEmployee({
        name: formName,
        username: formUsername,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        department: formDept,
        address: formAddress,
        joiningDate: formJoiningDate,
        status: formStatus,
        profilePicture: formImage
      });

      logActivity(
        user?.name || 'Admin',
        'admin',
        'Created Employee',
        'create',
        `Registered employee ${formName} (ID auto-generated)`
      );

      toast.success('Employee account registered successfully!');
      setIsAddModalOpen(false);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setFormName(emp.name);
    setFormUsername(emp.username);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormRole(emp.role);
    setFormDept(emp.department);
    setFormAddress(emp.address);
    setFormJoiningDate(emp.joiningDate);
    setFormStatus(emp.status);
    setFormImage(emp.profilePicture || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    try {
      await updateEmployee(selectedEmp.id, {
        name: formName,
        username: formUsername,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        department: formDept,
        address: formAddress,
        joiningDate: formJoiningDate,
        status: formStatus,
        profilePicture: formImage
      });

      logActivity(
        user?.name || 'Admin',
        'admin',
        'Updated Employee',
        'update',
        `Modified registry for employee ${formName}`
      );

      toast.success('Employee profile updated successfully');
      setIsEditModalOpen(false);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleDeleteTrigger = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmp) return;
    try {
      await deleteEmployee(selectedEmp.id);
      
      logActivity(
        user?.name || 'Admin',
        'admin',
        'Deleted Employee',
        'delete',
        `Removed employee account ID ${selectedEmp.employeeId}`
      );

      toast.success('Employee profile deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedEmp(null);
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Employees Registry</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Manage operator accounts, portal permissions, and employee login credentials.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<HiOutlinePlusCircle />}>
          Register Employee
        </Button>
      </div>

      {/* Filter panel */}
      <Card>
        <CardBody className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3 text-brand-dark-grey h-4 w-4" />
              <input
                type="text"
                placeholder="Search by ID, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="w-full sm:w-56">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-medium"
              >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Employees Table Grid */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {filteredEmployees.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Employee Profile</th>
                  <th className="px-6 py-4">Portal Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Joining Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-brand-light-grey/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-brand-text">{emp.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} src={emp.profilePicture} size="sm" />
                        <div>
                          <p className="font-bold text-brand-text">{emp.name}</p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">{emp.email} • {emp.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.role === 'admin' ? 'brand' : 'info'}>{emp.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-brand-text font-medium">{emp.department}</td>
                    <td className="px-6 py-4 text-brand-dark-grey font-medium">{emp.joiningDate}</td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.status === 'Active' ? 'success' : 'neutral'}>{emp.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 mt-1.5">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedEmp(emp); setIsDetailModalOpen(true); }} className="p-1.5" title="View details">
                        <HiOutlineEye className="h-4.5 w-4.5 text-brand-dark-grey" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(emp)} className="p-1.5" title="Edit Employee">
                        <HiOutlinePencilSquare className="h-4.5 w-4.5 text-brand-dark-grey" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTrigger(emp)} className="p-1.5 text-red-600 hover:text-red-700" title="Delete Account">
                        <HiOutlineTrash className="h-4.5 w-4.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Employees Found" description="Try editing your search filters or add a new team member." />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Employee Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Employee Account" size="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" placeholder="Vikram Singh" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Select label="Department *" options={departments.map(d => ({ label: d, value: d }))} value={formDept} onChange={e => setFormDept(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 p-4 border border-orange-100 rounded-xl">
            <div className="space-y-4">
              <span className="font-bold text-[10px] uppercase text-primary tracking-wider flex items-center gap-1"><HiOutlineKey /> Generated Credentials</span>
              <Input label="Username (Auto Generated) *" required value={formUsername} onChange={e => setFormUsername(e.target.value)} />
              <Input label="Assigned Password *" type="text" required value={formPassword} onChange={e => setFormPassword(e.target.value)} />
            </div>
            <div className="flex flex-col justify-center text-[10px] text-brand-dark-grey leading-relaxed p-2.5">
              <p className="font-bold text-brand-text mb-1">System Policy:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Usernames match institutional formatting rules.</li>
                <li>Initial passwords are automatically structured securely.</li>
                <li>Employees are forced to change their password on first login.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Email Address *" type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            <Input label="Direct Phone Number *" placeholder="+91 98765 43210" required value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Portal Access Role *"
              options={[
                { label: 'Standard Employee', value: 'employee' },
                { label: 'System Administrator', value: 'admin' }
              ]}
              value={formRole}
              onChange={e => setFormRole(e.target.value as any)}
            />
            <Input label="Joining Date *" type="date" required value={formJoiningDate} onChange={e => setFormJoiningDate(e.target.value)} />
            <Input label="Profile Photo Image URL" value={formImage} onChange={e => setFormImage(e.target.value)} />
          </div>

          <Input label="Home Address Record" placeholder="Flat 405, Sapphire Heights, Navi Mumbai" value={formAddress} onChange={e => setFormAddress(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Employee Account" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" required value={formName} onChange={e => setFormName(e.target.value)} />
            <Select label="Department *" options={departments.map(d => ({ label: d, value: d }))} value={formDept} onChange={e => setFormDept(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Portal Login Username *" required value={formUsername} onChange={e => setFormUsername(e.target.value)} />
            <Input label="Direct Phone Number *" required value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Email Address *" type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            <Input label="Profile Photo Image URL" value={formImage} onChange={e => setFormImage(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Portal Access Role *"
              options={[
                { label: 'Standard Employee', value: 'employee' },
                { label: 'System Administrator', value: 'admin' }
              ]}
              value={formRole}
              onChange={e => setFormRole(e.target.value as any)}
            />
            <Input label="Joining Date *" type="date" required value={formJoiningDate} onChange={e => setFormJoiningDate(e.target.value)} />
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

          <Input label="Home Address Record" value={formAddress} onChange={e => setFormAddress(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Employee Profile Details" size="md">
        {selectedEmp && (
          <div className="space-y-6 text-left text-xs">
            <div className="flex items-center gap-4">
              <Avatar name={selectedEmp.name} src={selectedEmp.profilePicture} size="lg" />
              <div>
                <h3 className="text-base font-extrabold text-brand-text leading-tight">{selectedEmp.name}</h3>
                <span className="text-xs text-brand-dark-grey mt-0.5 block">{selectedEmp.department}</span>
                <div className="mt-2.5 flex gap-2">
                  <Badge variant={selectedEmp.status === 'Active' ? 'success' : 'neutral'}>{selectedEmp.status}</Badge>
                  <Badge variant="brand">{selectedEmp.role}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 bg-brand-light-grey p-4 border border-brand-border rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey flex items-center gap-1"><HiOutlineBriefcase /> Employee ID</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedEmp.employeeId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey flex items-center gap-1"><HiOutlineCalendarDays /> Joining Date</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedEmp.joiningDate}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Direct Phone</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedEmp.phone}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Email Address</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedEmp.email}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Registered Address</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedEmp.address || 'No home address entered.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setIsDetailModalOpen(false)}>Close Profile</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Employee Removal" size="sm">
        <div className="space-y-4 text-left text-xs">
          <p className="text-brand-text leading-relaxed">
            Are you sure you want to permanently delete the profile for employee <strong className="text-red-600">{selectedEmp?.name} ({selectedEmp?.employeeId})</strong>? This will terminate their access permissions to the portal.
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
export default EmployeeManagement;
