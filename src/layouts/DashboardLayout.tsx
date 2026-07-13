import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Home,
  Briefcase,
  Users,
  FileText,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  Sparkles,
  Bell,
  Search,
  Clock,
  ShoppingCart
} from 'lucide-react';
import {
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineLockClosed
} from 'react-icons/hi2';

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, role, logout, changePassword } = useAuth();
  const { clients, employees, inventory, rentalRequests } = useData();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Modals
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications State (Mock)
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Return Reminder', message: 'Wacker Neuson Plate Compactor (EQ-CMP-001) was due for return on 2026-07-15.', read: false, type: 'alert' },
    { id: '2', title: 'Overdue Payment', message: 'Invoice INV-2026-005 for RK Infrastructure Ltd is overdue by ₹14,612.', read: false, type: 'payment' },
    { id: '3', title: 'New Rental Request', message: 'Sanjay Dutt submitted a request for core drill EQ-DRL-001.', read: false, type: 'rental' },
    { id: '4', title: 'Maintenance Alert', message: 'Generator EQ-GEN-001 alternator rewinding is in progress.', read: true, type: 'system' }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      toast.success('Password changed successfully');
      setIsChangePasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Invalid old password');
    }
  };

  interface MenuItem {
    path: string;
    name: string;
    icon: any;
    badgeCount?: number;
  }

  // Nav Items Configuration based on role
  const menuItems: Record<'admin' | 'employee' | 'client', MenuItem[]> = {
    admin: [
      { path: '/admin/dashboard', name: 'Dashboard', icon: Home },
      { path: '/admin/inventory', name: 'Inventory Management', icon: Briefcase },
      { path: '/admin/clients', name: 'Clients Management', icon: Users },
      { path: '/admin/employees', name: 'Employees Management', icon: Users },
      { path: '/admin/rentals', name: 'Rental Requests', icon: FileText, badgeCount: rentalRequests.filter(r => r.status === 'Pending').length },
      { path: '/admin/payments', name: 'Payments Portal', icon: DollarSign },
      { path: '/admin/reports', name: 'Reports & Analytics', icon: BarChart2 },
      { path: '/admin/settings', name: 'System Settings', icon: Settings }
    ],
    employee: [
      { path: '/employee/dashboard', name: 'Dashboard', icon: Home },
      { path: '/employee/inventory', name: 'Search Inventory', icon: Briefcase },
      { path: '/employee/clients', name: 'Manage Clients', icon: Users },
      { path: '/employee/rentals', name: 'Rent Equipment', icon: FileText },
      { path: '/employee/assigned', name: 'Assigned Rentals', icon: Clock }
    ],
    client: [
      { path: '/client/inventory', name: 'Inventory Management', icon: Briefcase },
      { path: '/client/cart', name: 'Add to Cart', icon: ShoppingCart }
    ]
  };

  const currentMenuItems = role ? menuItems[role] : [];

  // Global Search logic
  const filteredSearch = () => {
    if (!searchQuery) return { clients: [], employees: [], inventory: [], rentals: [] };
    const query = searchQuery.toLowerCase();
    
    return {
      clients: clients.filter(c => c.name.toLowerCase().includes(query) || c.companyName.toLowerCase().includes(query)),
      employees: employees.filter(e => e.name.toLowerCase().includes(query) || e.employeeId.toLowerCase().includes(query)),
      inventory: inventory.filter(i => i.name.toLowerCase().includes(query) || i.equipmentId.toLowerCase().includes(query) || i.category.toLowerCase().includes(query)),
      rentals: rentalRequests.filter(r => r.rentalNumber.toLowerCase().includes(query) || r.clientName.toLowerCase().includes(query) || r.invoiceNumber.toLowerCase().includes(query))
    };
  };

  const searchResults = filteredSearch();
  const hasSearchResults = searchQuery && (
    searchResults.clients.length > 0 ||
    searchResults.employees.length > 0 ||
    searchResults.inventory.length > 0 ||
    searchResults.rentals.length > 0
  );

  const cn = (...inputs: any[]) => clsx(inputs);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  return (
    <div className="min-h-screen font-sans text-stone-850 selection:bg-orange-100 selection:text-orange-950 relative overflow-hidden flex flex-col bg-stone-50">
      <div 
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          padding: isDesktop ? '24px' : '16px',
          gap: isDesktop ? '24px' : '16px',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
        className="flex h-screen w-full overflow-hidden p-4 md:p-6 gap-6 relative z-10"
      >
        
        {/* Floating Sidebar - Desktop */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            display: isDesktop ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '32px',
            border: '1px solid #e7e5e4',
            backgroundColor: '#ffffff',
            paddingTop: '24px',
            paddingBottom: '24px',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            width: '256px',
            flexShrink: 0,
            height: '100%',
            boxSizing: 'border-box'
          }}
          className="hidden md:flex w-64 flex-col justify-between rounded-[32px] border border-stone-200 bg-white py-6 px-4 shadow-md shrink-0"
        >
          <div>
            {/* Logo container */}
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 shadow-md shadow-primary/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xs font-extrabold tracking-wider text-stone-850 m-0 leading-none">NH HOMES</h1>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1 leading-none">CIVIL RENTALS</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5">
              {currentMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-stone-600 hover:bg-white/40 hover:text-black"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-stone-500 group-hover:text-black")} />
                    <span className="truncate">{item.name}</span>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className={cn("ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border", isActive ? "bg-white/20 border-white/10 text-white" : "bg-orange-50 border-orange-100 text-primary")}>
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer logout */}
          <div className="pt-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: isDesktop ? '24px' : '16px',
            position: 'relative',
            minWidth: 0,
            boxSizing: 'border-box',
            paddingLeft: isDesktop ? '24px' : '16px',
            paddingRight: isDesktop ? '24px' : '16px',
            overflow: 'hidden'
          }}
          className="flex-1 flex flex-col gap-6 relative min-w-0 px-4 md:px-6 overflow-hidden"
        >
          
          {/* Floating Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between rounded-[32px] border border-stone-200 bg-white px-6 py-4 shadow-md shrink-0"
          >
            {/* Left Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                <HiOutlineBars3 className="h-6 w-6" />
              </button>
              
              <div className="text-left">
                <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
                  NH Homes CRM
                </span>
                <h2 className="text-sm font-extrabold text-stone-850 m-0 leading-tight capitalize">
                  {location.pathname.split('/').slice(-1)[0].replace('-', ' ')} Portal
                </h2>
              </div>
            </div>

            {/* Center: Global Search Bar */}
            <div className="flex-1 max-w-md mx-6 relative hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-stone-450 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Client, Equipment, Invoices, Rentals..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 border border-stone-200 bg-stone-50 rounded-2xl text-xs font-semibold transition-all duration-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-3.5 top-3 p-0.5 rounded-full hover:bg-stone-200"
                  >
                    <HiOutlineXMark className="h-3 w-3 text-stone-500" />
                  </button>
                )}
              </div>

              {/* Spotlight Search Results Dropdown */}
              {isSearchOpen && searchQuery && (
                <div className="absolute top-12 left-0 right-0 bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl rounded-2xl p-4 max-h-96 overflow-y-auto z-50 text-left">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Search Results</span>
                    <button onClick={() => setIsSearchOpen(false)} className="text-xs font-bold text-primary hover:underline">Close</button>
                  </div>
                  
                  {hasSearchResults ? (
                    <div className="space-y-4">
                      {/* Equipment Results */}
                      {searchResults.inventory.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Equipment</h4>
                          <div className="space-y-1">
                            {searchResults.inventory.map(item => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  navigate(`/${role}/inventory`);
                                }}
                                className="px-2.5 py-2 rounded-xl hover:bg-stone-50 cursor-pointer text-xs flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-bold text-stone-850">{item.name}</p>
                                  <p className="text-[10px] text-stone-400">{item.equipmentId} • {item.category}</p>
                                </div>
                                <Badge variant={item.status === 'Available' ? 'success' : item.status === 'Rented' ? 'info' : 'warning'}>{item.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clients Results */}
                      {searchResults.clients.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Clients</h4>
                          <div className="space-y-1">
                            {searchResults.clients.map(clt => (
                              <div
                                key={clt.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  navigate(`/${role}/clients`);
                                }}
                                className="px-2.5 py-2 rounded-xl hover:bg-stone-50 cursor-pointer text-xs"
                              >
                                <p className="font-bold text-stone-850">{clt.name}</p>
                                <p className="text-[10px] text-stone-400">{clt.companyName} • {clt.phone}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rentals & Invoices Results */}
                      {searchResults.rentals.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Rentals & Invoices</h4>
                          <div className="space-y-1">
                            {searchResults.rentals.map(rent => (
                              <div
                                key={rent.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  navigate(`/${role}/rentals`);
                                }}
                                className="px-2.5 py-2 rounded-xl hover:bg-stone-50 cursor-pointer text-xs flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-bold text-stone-850">{rent.rentalNumber || 'Request pending approval'}</p>
                                  <p className="text-[10px] text-stone-400">{rent.clientName} • {rent.invoiceNumber || 'INV-Pending'}</p>
                                </div>
                                <Badge variant={rent.paymentStatus === 'Completed' ? 'success' : rent.paymentStatus === 'Overdue' ? 'danger' : 'warning'}>{rent.paymentStatus}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 text-center py-4">No matching records found for "{searchQuery}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Notifications & ProfileDropdown */}
            <div className="flex items-center gap-3">
              
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 rounded-full bg-white hover:scale-105 transition-transform shadow-sm relative cursor-pointer"
                >
                  <Bell className="h-5 w-5 text-stone-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border border-white" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-4 z-50 text-left">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                      <h3 className="font-bold text-xs text-stone-850">System Alerts</h3>
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                          <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0", n.read ? "bg-stone-200" : "bg-primary")} />
                          <div>
                            <p className="font-bold text-stone-850">{n.title}</p>
                            <p className="text-[10px] text-stone-400 leading-relaxed mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <div 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center rounded-full bg-white p-1 shadow-sm border border-stone-150 cursor-pointer hover:shadow-md transition-all relative"
                >
                  {user?.profileImage ? (
                    <img src={user.profileImage} className="h-9 w-9 rounded-full bg-orange-105 object-cover border border-stone-100" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(user?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2.5 z-50 text-xs font-semibold space-y-1 text-left">
                    <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      Account Operations
                    </div>
                    <button
                      onClick={() => { setIsProfileDropdownOpen(false); setIsProfileModalOpen(true); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-700"
                    >
                      <Users className="h-4 w-4 text-stone-400" /> My Profile
                    </button>
                    <button
                      onClick={() => { setIsProfileDropdownOpen(false); setIsChangePasswordOpen(true); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-700"
                    >
                      <HiOutlineLockClosed className="h-4 w-4 text-stone-400" /> Change Password
                    </button>
                    <div className="border-t border-stone-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </motion.header>

          {/* Dynamic Main Body Content wrapped inside scrollable container */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-2 scrollbar-hide">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            className="relative flex flex-col w-64 max-w-xs bg-white/95 backdrop-blur-xl h-full border-r border-stone-200 z-10 p-6 justify-between text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">NH</div>
                  <div>
                    <h1 className="text-xs font-extrabold text-stone-850 m-0 leading-none">NH HOMES</h1>
                    <p className="text-[9px] font-semibold text-primary uppercase tracking-widest mt-0.5 leading-none">CIVIL RENTALS</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg text-stone-500 hover:bg-stone-100">
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="space-y-1.5">
                {currentMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 group",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-stone-600 hover:bg-stone-100 hover:text-black"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="pt-4 border-t border-stone-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Change Password */}
      <Modal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} title="Change Password" size="sm">
        <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsChangePasswordOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: My Profile Details */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Account Profile Details" size="md">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar name={user?.name || 'User'} src={user?.profileImage} size="xl" />
          <div>
            <h3 className="font-bold text-base text-stone-850">{user?.name}</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{role} Portal Account</p>
          </div>
          
          <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-250/40 text-left space-y-2.5 text-xs font-semibold text-stone-800">
            <div className="flex justify-between">
              <span className="text-stone-400">Username:</span>
              <span className="text-stone-800">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Email Address:</span>
              <span className="text-stone-800">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Account ID:</span>
              <span className="text-stone-850 font-mono text-[10px]">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Associated Entity ID:</span>
              <span className="text-stone-850 font-mono text-[10px]">{user?.entityId || 'N/A'}</span>
            </div>
          </div>

          <div className="flex justify-end w-full pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsProfileModalOpen(false)}>
              Close Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
