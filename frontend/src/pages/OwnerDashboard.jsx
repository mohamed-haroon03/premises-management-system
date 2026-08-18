import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, Users, DollarSign, WalletCards, Building2, BellRing, Activity, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

const OwnerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [urgentReminders, setUrgentReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPendingModal, setShowPendingModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, notifRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/owner`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setStats(statsRes.data);

                // Filter specifically for unread tax reminders
                const unreadTaxes = notifRes.data.filter(n => n.type === 'tax_due' && !n.isRead);
                setUrgentReminders(unreadTaxes);

            } catch (error) {
                console.error('Error fetching dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex h-64 items-center justify-center"><Activity className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    const occupancyData = [
        { name: 'Occupied', value: stats?.occupiedUnits || 0 },
        { name: 'Vacant', value: stats?.vacantUnits || 0 }
    ];

    const revenueData = stats?.revenueData || [
        { name: 'Jan', income: 0, expenses: 0 },
        { name: 'Feb', income: 0, expenses: 0 },
        { name: 'Mar', income: 0, expenses: 0 },
        { name: 'Apr', income: 0, expenses: 0 },
        { name: 'May', income: 0, expenses: 0 },
        { name: 'Jun', income: 0, expenses: 0 }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Property Overview</h2>
                    <p className="text-gray-500 mt-1">Here's what's happening with your properties today.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Properties" value={stats?.totalProperties || 0} icon={<Home className="text-indigo-500" />} />
                <StatCard title="Total Units" value={stats?.totalUnits || 0} sub={`${stats?.occupancyRate || 0}% Occupied`} icon={<Building2 className="text-purple-500" />} />
                <StatCard title="Total Payment Amount" value={`₹${stats?.monthlyIncome?.toLocaleString() || 0}`} icon={<DollarSign className="text-emerald-500" />} />
                <StatCard
                    title="Pending Rent"
                    value={`₹${stats?.pendingRent?.toLocaleString() || 0}`}
                    icon={<WalletCards className="text-rose-500" />}
                    onClick={() => setShowPendingModal(true)}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        Revenue vs Expenses
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="income" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Donut */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Occupancy Status</h3>
                    <div className="h-64 flex justify-center items-center">
                        {stats?.totalUnits > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={occupancyData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                                        {occupancyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <Building2 size={48} className="mx-auto mb-2 opacity-30" />
                                <p>No units added yet</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div><span className="text-sm text-gray-600">Occupied ({stats?.occupiedUnits})</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm text-gray-600">Vacant ({stats?.vacantUnits})</span></div>
                    </div>
                </div>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Urgent Reminders Widget */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-rose-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 opacity-50"></div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="text-rose-500" size={20} />
                            Urgent Tax Reminders
                        </h3>
                        {urgentReminders.length > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-lg">
                                {urgentReminders.length} Action Needed
                            </span>
                        )}
                    </div>

                    {urgentReminders.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 size={24} />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                            <p className="text-xs text-gray-400 mt-1">No pending property tax deadlines.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                            {urgentReminders.map(reminder => (
                                <Link
                                    to={`/properties/${reminder.referenceId}?tab=taxes`}
                                    key={reminder._id}
                                    className="block bg-rose-50/50 hover:bg-rose-50 p-4 border border-rose-100 rounded-xl transition-colors group cursor-pointer"
                                    title="Go to Property Taxes Tab"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{reminder.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{reminder.message}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                                        <span>Action Required</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Rent Details Modal */}
            {showPendingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <WalletCards className="text-rose-500" />
                                Pending Rent Details
                            </h3>
                            <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {!stats?.pendingRentDetails || stats.pendingRentDetails.length === 0 ? (
                                <div className="text-center py-10 opacity-70">
                                    <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                                    <p className="text-lg font-medium text-gray-900">Great Job!</p>
                                    <p className="text-gray-500">All tenants are up to date with their rent.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.pendingRentDetails.map((detail, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 border border-rose-100 bg-rose-50 rounded-xl">
                                            <div>
                                                <p className="font-bold text-gray-900">{detail.tenantName}</p>
                                                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">
                                                        Unit: {detail.unitNumber}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>{detail.propertyName}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-rose-600 text-lg">₹{detail.amountPending?.toLocaleString()}</p>
                                                <Link
                                                    to={`/tenants/${detail.tenantId}`}
                                                    className="text-xs text-indigo-600 font-semibold hover:underline mt-1 inline-block"
                                                >
                                                    View Tenant →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowPendingModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, sub, onClick }) => (
    <div
        onClick={onClick}
        className={`relative bg-white pt-6 px-6 pb-4 sm:pt-6 sm:px-6 shadow-sm rounded-2xl border border-gray-100 overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 hover:-translate-y-1' : 'hover:shadow-md'}`}
    >
        <dt>
            <div className="absolute bg-gray-50 rounded-xl p-3 shadow-inner">
                {icon}
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">{title}</p>
        </dt>
        <dd className="ml-16 pb-2 flex items-baseline sm:pb-3">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {sub && <p className="ml-2 flex items-baseline text-sm font-semibold text-emerald-600">{sub}</p>}
        </dd>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
    </div>
);

export default OwnerDashboard;
