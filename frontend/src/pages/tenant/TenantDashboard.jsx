import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, AlertCircle, CreditCard, ArrowRight, Phone } from 'lucide-react';

const TenantDashboard = () => {
    const { user } = useAuth();
    const [tenantInfo, setTenantInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ideally this would fetch by the user's ObjectId
        fetchTenantData();
    }, []);

    const fetchTenantData = async () => {
        try {
            // For prototype: we might not have a reliable 1:1 mapping yet due to mock data.
            // Assuming backend has a route like /api/tenants/me that uses req.user._id
            // For now, we'll just mock the response to show the UI structure if API fails
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenants`);
                // Just grab the first one for demo purposes if the dedicated route isn't built
                setTenantInfo(data[0] || mockTenantData);
            } catch (e) {
                setTenantInfo(mockTenantData);
            }
        } catch (error) {
            console.error('Error fetching tenant dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Home size={200} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Welcome home, {user?.name || tenantInfo?.name}</h2>
                    <p className="text-indigo-200 mb-8 max-w-xl">View your lease details, track maintenance requests, and manage your payments all in one place.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="text-indigo-300" size={20} />
                                <h3 className="font-medium text-indigo-100">Current Unit</h3>
                            </div>
                            <p className="text-xl font-bold">{tenantInfo?.currentUnit?.unitNumber || 'Apt 4B - Sunset Villas'}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-indigo-300" size={20} />
                                <h3 className="font-medium text-indigo-100">Next Rent Due</h3>
                            </div>
                            <p className="text-xl font-bold">1st Oct, 2024</p>
                            <p className="text-sm text-indigo-200 mt-1">₹15,000</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Phone className="text-indigo-300" size={20} />
                                <h3 className="font-medium text-indigo-100">Landlord Contact</h3>
                            </div>
                            <p className="text-lg font-bold">Mr. Sharma</p>
                            <p className="text-sm text-indigo-200 mt-1">+91 98765 43210</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Payments Widget */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-emerald-500" size={24} />
                            Recent Payments
                        </h3>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">₹</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Monthly Rent</p>
                                        <p className="text-xs text-gray-500">{i === 1 ? 'September 2024' : 'August 2024'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₹15,000</p>
                                    <p className="text-xs text-emerald-600 font-medium">Paid successfully</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Maintenance Status Widget */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="text-amber-500" size={24} />
                            Active Requests
                        </h3>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">New Request</button>
                    </div>

                    <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/50 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">In Progress</span>
                            <span className="text-xs text-gray-500 font-medium">Reported: 2 days ago</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Leaking Kitchen Sink</h4>
                            <p className="text-sm text-gray-600 mt-1">The pipe under the sink is dripping continuously. Plumber scheduled for tomorrow.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock data fallback
const mockTenantData = {
    name: "Alex Doe",
    email: "alex@example.com",
    currentUnit: { unitNumber: "B-402, Green Valley" }
};

export default TenantDashboard;
