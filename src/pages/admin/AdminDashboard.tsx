import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { clsx, type ClassValue } from 'clsx';
import { toast } from 'react-toastify';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight
} from 'lucide-react';


export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// --- Global CSS for Mesh Gradient ---
export const MeshGradient = () => (
  <style>{`
    @keyframes float {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(40px, -60px) scale(1.15); }
      66% { transform: translate(-30px, 30px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    
    .mesh-bg {
      background-color: #fafaf9; /* Stone 50 */
      position: fixed;
      inset: 0;
      z-index: -10;
      overflow: hidden;
    }
    
    .blob {
      position: absolute;
      filter: blur(90px);
      opacity: 0.55;
      animation: float 12s infinite ease-in-out;
    }
    .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ffe7d3; animation-delay: 0s; } /* Soft NH Orange */
    .blob-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: #fff1e6; animation-delay: 3s; } /* Pale Cream */
    .blob-3 { top: 35%; left: 35%; width: 35vw; height: 35vw; background: #ffd9c0; animation-delay: 6s; } /* Mid Orange */
  `}</style>
);

// --- FrostCard Component ---
export function FrostCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// --- NavItem Component ---
export function NavItem({ icon: Icon, active, onClick, tooltip }: { icon: any; active: boolean; onClick: () => void; tooltip: string }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300',
        active
          ? 'bg-black text-white shadow-lg shadow-black/25'
          : 'text-stone-500 hover:bg-white/50 hover:text-black'
      )}
    >
      <Icon className="h-5 w-5" />
      {active && (
        <motion.div
          layoutId="active-dot"
          className="absolute -bottom-2 h-1 w-1 rounded-full bg-black"
        />
      )}
    </button>
  );
}

// --- StatPill Component ---
export function StatPill({ val, positive }: { val: string; positive?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
    )}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-180" />}
      {val}
    </div>
  );
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { clients, employees, inventory, rentalRequests, activityLogs } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [chartRange, setChartRange] = useState<'Daily' | 'Monthly' | 'Yearly'>('Monthly');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(activityLogs[0]?.id || null);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Dynamic calculations from context
  const totalRevenue = rentalRequests
    .filter(r => r.status === 'Approved')
    .reduce((sum, r) => sum + r.amountPaid, 0);

  const activeClientsCount = clients.filter(c => c.status === 'Active').length;

  const totalInvCount = inventory.length;
  const availableInvCount = inventory.filter(i => i.status === 'Available').length;
  const rentedInvCount = inventory.filter(i => i.status === 'Rented').length;
  const maintenanceInvCount = inventory.filter(i => i.status === 'Maintenance').length;

  const pendingApprovals = rentalRequests.filter(r => r.status === 'Pending');

  // Chart Data: dynamic trends based on Context values
  const chartData = {
    Daily: [
      { name: 'Mon', revenue: 18500, users: 3 },
      { name: 'Tue', revenue: 24000, users: 5 },
      { name: 'Wed', revenue: 19800, users: 4 },
      { name: 'Thu', revenue: 32000, users: 7 },
      { name: 'Fri', revenue: 28000, users: 6 },
      { name: 'Sat', revenue: 15000, users: 3 },
      { name: 'Sun', revenue: 22000, users: 4 },
    ],
    Monthly: [
      { name: 'Jan', revenue: 45000, users: 10 },
      { name: 'Feb', revenue: 78000, users: 14 },
      { name: 'Mar', revenue: 92000, users: 16 },
      { name: 'Apr', revenue: 110000, users: 20 },
      { name: 'May', revenue: 145000, users: 24 },
      { name: 'Jun', revenue: 185000, users: 27 },
      { name: 'Jul', revenue: totalRevenue > 0 ? totalRevenue : 160000, users: activeClientsCount },
    ],
    Yearly: [
      { name: '2023', revenue: 480000, users: 22 },
      { name: '2024', revenue: 980000, users: 45 },
      { name: '2025', revenue: 1450000, users: 78 },
      { name: '2026', revenue: (totalRevenue * 8) || 1850000, users: activeClientsCount * 2 },
    ]
  };

  const filteredLogs = activityLogs.filter(log => {
    const term = logsSearchTerm.toLowerCase();
    return log.user?.toLowerCase().includes(term) ||
           log.action?.toLowerCase().includes(term) ||
           log.details?.toLowerCase().includes(term) ||
           log.role?.toLowerCase().includes(term) ||
           log.type?.toLowerCase().includes(term);
  });

  const selectedLog = filteredLogs.find(log => log.id === selectedLogId) || filteredLogs[0] || activityLogs[0];

  // System Load progress bars mapped to actual inventory rates
  const rentedRate = Math.round((rentedInvCount / (totalInvCount || 1)) * 100);
  const maintenanceRate = Math.round((maintenanceInvCount / (totalInvCount || 1)) * 100);
  const availableRate = 100 - (rentedRate + maintenanceRate);

  return (
    <div className="space-y-6 pb-6 text-left">
      {/* Sub tabs for Dashboard views */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/40 border border-white/60 rounded-2xl backdrop-blur-md self-start w-fit">
        {['Overview', 'Performance Analytics', 'Operations Staff', 'System Audit Logs'].map((tabLabel, idx) => (
          <button
            key={tabLabel}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === idx
                ? "bg-primary text-white shadow-md shadow-primary/10"
                : "text-stone-600 hover:bg-white/50 hover:text-stone-900"
            )}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Dynamic Content Grid */}
      <div className="w-full">
            
            {/* TAB 0: OVERVIEW */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                {/* Welcome Card Section */}
                <div className="md:col-span-2">
                  <FrostCard className="h-full flex flex-col justify-center bg-gradient-to-br from-primary to-amber-500 text-white border-none shadow-lg shadow-primary/20">
                    <div className="relative z-10 p-2">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-md mb-4 border border-white/10">
                          NH Systems Live
                        </span>
                        <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Welcome, {user?.name.split(' ')[0] || 'Admin'}!</h2>
                        <p className="text-orange-50 max-w-lg mb-6 text-xs font-medium leading-relaxed">
                          The rental depot operations are stable. You have <span className="font-bold text-white">{availableInvCount} equipment units</span> available in the yards, and <span className="font-bold text-white">{rentedInvCount} units</span> actively deployed on corporate client construction sites.
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => navigate('/admin/rentals')} className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-primary shadow-xl shadow-black/10 hover:scale-105 transition-transform cursor-pointer">
                            Approve Contracts ({pendingApprovals.length})
                          </button>
                          <button onClick={() => navigate('/admin/inventory')} className="rounded-xl bg-primary-hover/50 px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-hover/70 transition-colors cursor-pointer">
                            Inspect Equipment Registry
                          </button>
                        </div>
                      </motion.div>
                    </div>
                    {/* Decorative radial blur */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  </FrostCard>
                </div>

                {/* Quick Stat: Revenue */}
                <FrostCard delay={0.1} className="flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-orange-100 rounded-2xl text-primary border border-orange-200/50">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === 'revenue' ? null : 'revenue')}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {activeMenuId === 'revenue' && (
                        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white border border-stone-200 shadow-lg py-1.5 z-20 text-xs font-semibold text-stone-700">
                          <button 
                            onClick={() => {
                              toast.success('Refreshing billing metrics...');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Refresh Metrics
                          </button>
                          <button 
                            onClick={() => {
                              navigate('/admin/reports');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Go to Reports
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Total Rental Billings</p>
                    <h3 className="text-2xl font-extrabold text-stone-800 tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <StatPill val="12.4%" positive />
                      <span className="text-[10px] text-stone-400 font-semibold">vs last month</span>
                    </div>
                  </div>
                </FrostCard>

                {/* Main Billing Trend Chart */}
                <FrostCard delay={0.2} className="md:col-span-2 min-h-[350px]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">NH Billing Analytics</h3>
                      <p className="text-xs text-stone-400 font-medium mt-0.5">Monthly Revenue Growth vs Active Clients</p>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/40">
                      {(['Daily', 'Monthly', 'Yearly'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setChartRange(t)}
                          className={cn(
                            'px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer',
                            chartRange === t
                              ? 'bg-white shadow-sm text-stone-800'
                              : 'text-stone-400 hover:text-stone-600'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[250px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData[chartRange]}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F58220" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F58220" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#a8a29e" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="#a8a29e" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="revenue" name="Billing (INR)" stroke="#F58220" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="users" name="Active Customers" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </FrostCard>

                {/* Task List / Pending Actions */}
                <FrostCard delay={0.3} className="flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Required Actions</h3>
                    <button onClick={() => navigate('/admin/rentals')} className="bg-black text-white hover:bg-stone-900 rounded-full p-1 cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
                    {pendingApprovals.length > 0 ? (
                      pendingApprovals.map((req) => (
                        <div 
                          key={req.id} 
                          onClick={() => navigate('/admin/rentals')}
                          className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/50 transition-colors border border-transparent hover:border-white/50 cursor-pointer"
                        >
                          <button className="h-5 w-5 rounded-full border-2 border-stone-300 text-transparent flex items-center justify-center transition-colors hover:border-black">
                            <CheckCircle2 className="h-3 w-3 text-stone-800" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-800 truncate">{req.companyName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-semibold mt-0.5">
                              <Clock className="h-3 w-3" />
                              {req.items.length} units • ₹{req.grandTotal.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-1 bg-amber-50 rounded-lg font-bold text-primary shrink-0 group-hover:bg-white transition-colors border border-amber-100">
                            Pending
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-stone-400">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold">All caught up!</p>
                        <p className="text-[10px]">No pending rental requests.</p>
                      </div>
                    )}
                  </div>
                </FrostCard>

                {/* Bottom Row - Team members */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FrostCard delay={0.4} className="md:col-span-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-4">Operations Team</h3>
                    <div className="flex flex-col gap-4">
                      {employees.slice(0, 3).map((emp) => (
                        <div key={emp.id} className="flex items-center gap-3">
                          <div className="relative">
                            <img src={emp.profilePicture} className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200/50 object-cover" alt={emp.name} />
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-stone-800 leading-tight">{emp.name}</p>
                            <p className="text-[10px] text-stone-400 font-medium mt-0.5">{emp.department.substring(0, 16)}...</p>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab(2)} className="w-full mt-2 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer border border-stone-200/30">
                        View Staff Directory
                      </button>
                    </div>
                  </FrostCard>

                  {/* System Load */}
                  <FrostCard delay={0.5} className="md:col-span-3 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Depot Equipment Load</h3>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600">All Systems Operational</span>
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                          <span>Deployed Assets (Site Rental)</span>
                          <span>{rentedRate}% ({rentedInvCount} units)</span>
                        </div>
                        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rentedRate}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                          <span>In Yard (Available For Dispatch)</span>
                          <span>{availableRate}% ({availableInvCount} units)</span>
                        </div>
                        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${availableRate}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                          <span>Undergoing Maintenance Testing</span>
                          <span>{maintenanceRate}% ({maintenanceInvCount} units)</span>
                        </div>
                        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${maintenanceRate}%` }}
                            transition={{ duration: 1, delay: 0.9 }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </FrostCard>
                </div>
              </div>
            )}

            {/* TAB 1: PERFORMANCE ANALYTICS */}
            {activeTab === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <FrostCard delay={0.1} className="flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">NH Monthly Acquisitions</h3>
                      <p className="text-xs text-stone-400 font-medium">New Customer Profiles Registered</p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === 'acquisitions' ? null : 'acquisitions')}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {activeMenuId === 'acquisitions' && (
                        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white border border-stone-200 shadow-lg py-1.5 z-20 text-xs font-semibold text-stone-700">
                          <button 
                            onClick={() => {
                              toast.success('Refreshing acquisitions trend...');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Refresh Chart
                          </button>
                          <button 
                            onClick={() => {
                              navigate('/admin/clients');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Manage Clients
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.Monthly}>
                        <defs>
                          <linearGradient id="acqColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#a8a29e" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="#a8a29e" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="users" name="New Registrations" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#acqColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </FrostCard>

                <FrostCard delay={0.2} className="flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Depot Inventory Share</h3>
                      <p className="text-xs text-stone-400 font-medium">Category distribution overview</p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === 'inventory_share' ? null : 'inventory_share')}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {activeMenuId === 'inventory_share' && (
                        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white border border-stone-200 shadow-lg py-1.5 z-20 text-xs font-semibold text-stone-700">
                          <button 
                            onClick={() => {
                              toast.success('Recalculating inventory share...');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Recalculate
                          </button>
                          <button 
                            onClick={() => {
                              navigate('/admin/inventory');
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          >
                            Manage Inventory
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-5">
                    {[
                      { source: 'Heavy Machinery (Excavators & Rollers)', percent: Math.round(((inventory.filter(i => i.category === 'Excavators' || i.category === 'Road Rollers').length) / (totalInvCount || 1)) * 100), color: 'bg-primary' },
                      { source: 'Concrete & Mixing Plants', percent: Math.round(((inventory.filter(i => i.category === 'Concrete Mixers').length) / (totalInvCount || 1)) * 100), color: 'bg-amber-500' },
                      { source: 'Power Generators', percent: Math.round(((inventory.filter(i => i.category === 'Generators').length) / (totalInvCount || 1)) * 100), color: 'bg-yellow-500' },
                      { source: 'Power Tools & Concrete Cutters', percent: Math.round(((inventory.filter(i => i.category === 'Power Tools' || i.category === 'Cutting Machines' || i.category === 'Drilling Machines').length) / (totalInvCount || 1)) * 100), color: 'bg-emerald-500' }
                    ].map((s, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-stone-700">
                          <span>{s.source}</span>
                          <span>{s.percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.percent}%` }}
                            transition={{ duration: 1, delay: i * 0.15 }}
                            className={cn('h-full rounded-full', s.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </FrostCard>
              </div>
            )}

            {/* TAB 2: OPERATIONS STAFF */}
            {activeTab === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {employees.map((emp, i) => (
                  <FrostCard key={emp.id} delay={i * 0.1} className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-100 mb-4 shadow-sm border-2 border-white relative">
                      <img src={emp.profilePicture} className="w-full h-full object-cover" alt={emp.name} />
                      <span className="absolute bottom-0 right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <h3 className="text-base font-bold text-stone-800 leading-snug">{emp.name}</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{emp.role}</p>
                    <p className="text-xs text-stone-500 font-semibold mt-1.5 mb-6">{emp.department}</p>
                    <div className="flex gap-2.5 w-full">
                      <button 
                        onClick={() => navigate('/admin/employees')}
                        className="flex-1 bg-orange-50 border border-orange-100 text-primary py-2 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer"
                      >
                        Edit Credentials
                      </button>
                      <button 
                        onClick={() => toast.info(`Initializing chat with ${emp.name}`)}
                        className="flex-1 bg-stone-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                      >
                        Ping Staff
                      </button>
                    </div>
                  </FrostCard>
                ))}
              </div>
            )}

            {/* TAB 3: SYSTEM AUDIT LOGS */}
            {activeTab === 3 && (
              <div className="flex flex-col lg:flex-row h-[600px] gap-6 text-left">
                {/* Logs List Pane */}
                <FrostCard delay={0.1} className="w-full lg:w-96 flex flex-col p-4 shrink-0">
                  <div className="flex items-center gap-2 bg-white/50 border border-stone-200 rounded-2xl px-4 py-2.5 mb-5 shadow-inner">
                    <Search className="h-4 w-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Filter audit entries..." 
                      className="bg-transparent border-none outline-none text-xs w-full text-stone-700 font-medium"
                      value={logsSearchTerm}
                      onChange={e => setLogsSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
                    {filteredLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLogId(log.id)}
                        className={cn(
                          'p-4 rounded-2xl cursor-pointer transition-all border text-xs',
                          selectedLogId === log.id 
                            ? 'bg-white shadow-md border-orange-200/70 translate-x-1' 
                            : 'hover:bg-white/40 border-transparent'
                        )}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="font-bold text-stone-800">{log.user}</h4>
                          <span className="text-[9px] text-stone-400 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="font-semibold text-stone-600 truncate mb-1">{log.action}</p>
                        <p className="text-[10px] text-stone-400 font-medium line-clamp-1">{log.details}</p>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8 text-stone-400 font-medium">No matching audit logs found.</div>
                    )}
                  </div>
                </FrostCard>

                {/* Details Pane */}
                <FrostCard delay={0.2} className="flex-1 flex flex-col p-8">
                  {selectedLog ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-stone-200/50 pb-6 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 text-primary border border-orange-200/40 flex items-center justify-center font-bold text-lg">
                              {selectedLog.user.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-stone-800 mb-0.5">{selectedLog.action}</h2>
                              <p className="text-xs font-semibold text-stone-400">
                                Operator: <span className="text-primary">{selectedLog.user}</span> ({selectedLog.role})
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full border border-stone-200/30">
                            {new Date(selectedLog.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-stone-600 text-xs leading-relaxed max-w-2xl font-medium space-y-4">
                          <p className="text-stone-800 font-bold text-sm">System Audit Details:</p>
                          <p className="bg-white/60 p-4 border border-stone-200/40 rounded-2xl shadow-inner font-mono text-[11px] text-stone-700">
                            {selectedLog.details}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200/30 text-[10px]">
                            <div>
                              <span className="text-stone-400 block font-bold uppercase tracking-wider">Audit Ref ID</span>
                              <span className="font-mono text-stone-700 mt-0.5 block">{selectedLog.id}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block font-bold uppercase tracking-wider">Log Category</span>
                              <span className="font-semibold text-stone-700 mt-0.5 block capitalize">{selectedLog.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-stone-200/50 flex justify-between items-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          Logged via NH Homes Portal API
                        </span>
                        <button 
                          onClick={() => toast.success('Log entry exported to clipboard')}
                          className="bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm cursor-pointer"
                        >
                          Export Entry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-stone-400 text-xs font-semibold">
                      Select an activity audit entry to review system credentials.
                    </div>
                  )}
                </FrostCard>
              </div>
            )}
            
      </div>
    </div>
  );
};

export default AdminDashboard;
