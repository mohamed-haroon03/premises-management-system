import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Save, History, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PropertyTaxesTab = ({ propertyId }) => {
    const [taxConfig, setTaxConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    const currentYear = new Date().getFullYear();
    const [mainForm, setMainForm] = useState({
        startYear: currentYear,
        nextDueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [propertyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/taxes/property/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.tax) {
                setTaxConfig(res.data.tax);
                setMainForm({
                    startYear: res.data.tax.startYear || currentYear,
                    nextDueDate: new Date(res.data.tax.nextDueDate).toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.log('No tax info found or error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfiguration = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/taxes',
                {
                    propertyId,
                    startYear: mainForm.startYear,
                    nextDueDate: mainForm.nextDueDate
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (taxConfig) {
                toast.success('Property Tax Reminder updated successfully!');
            } else {
                toast.success('Property Tax Reminder added successfully!');
            }
            
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving configuration');
        }
    };

    const handlePayTax = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/taxes/property/${propertyId}/pay`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Property tax marked as paid!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error marking tax as paid');
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading Configuration...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Bell className="text-indigo-600" size={20} />
                    Property Tax Reminder Settings
                </h3>

                <form onSubmit={handleSaveConfiguration} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Year of Property</label>
                            <input required type="number" min="1900" max="2100" value={mainForm.startYear} onChange={e => setMainForm({ ...mainForm, startYear: parseInt(e.target.value) })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="e.g. 2023" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Which Date to Remind the Property Tax</label>
                            <input required type="date" value={mainForm.nextDueDate} onChange={e => setMainForm({ ...mainForm, nextDueDate: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 shadow-sm">
                            <Save size={18} />
                            {taxConfig ? 'Update Reminder' : 'Add Reminder'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Overview */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <History className="text-indigo-600" size={20} />
                        Active Reminder Status
                    </h3>

                    {taxConfig ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Start Year</span>
                                <span className="font-bold text-gray-900">{taxConfig.startYear}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Status</span>
                                <span className={`font-bold px-2 py-1 rounded-md text-xs ${taxConfig.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {taxConfig.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <span className="text-sm font-medium text-emerald-800">Reminder Date</span>
                                <span className="font-bold text-emerald-700">{new Date(taxConfig.nextDueDate).toLocaleDateString()}</span>
                            </div>
                            
                            {taxConfig.status !== 'Paid' && taxConfig.status !== 'paid' && (
                                <button
                                    onClick={handlePayTax}
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 shadow-sm"
                                >
                                    <CheckCircle2 size={18} />
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CheckCircle2 size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-sm text-gray-500">No reminder configured. Set the dates on the left to begin receiving property tax notifications.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyTaxesTab;
