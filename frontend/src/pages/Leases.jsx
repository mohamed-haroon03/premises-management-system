import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Calendar, FileDown, MoreVertical, CreditCard, Edit, Trash2 } from 'lucide-react';
import useLeaseStore from '../store/leaseStore';
import usePropertyStore from '../store/propertyStore';
import useUnitStore from '../store/unitStore';
import useTenantStore from '../store/tenantStore';

const Leases = () => {
    const { leases, loading, fetchLeases, createLease, updateLease, deleteLease } = useLeaseStore();
    const { properties, fetchProperties } = usePropertyStore();
    const { units, fetchUnitsByProperty } = useUnitStore();
    const { tenants, fetchTenants } = useTenantStore();

    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLeaseId, setSelectedLeaseId] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        unit: '',
        tenant: '',
        leaseType: 'Lumpsum',
        startDate: '',
        endDate: '',
        leaseAmount: '',
        refundableAmount: '',
        fullDepositOption: '',
        deductionRules: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchLeases();
        fetchProperties();
        fetchTenants();
    }, []);

    useEffect(() => {
        if (selectedPropertyId) {
            fetchUnitsByProperty(selectedPropertyId);
        }
    }, [selectedPropertyId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: '' });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.unit) errors.unit = 'Unit is required';
        if (!formData.tenant) errors.tenant = 'Tenant is required';
        if (!formData.startDate) errors.startDate = 'Start date is required';
        if (!formData.endDate) errors.endDate = 'End date is required';
        if (!formData.leaseAmount || formData.leaseAmount <= 0) errors.leaseAmount = 'Valid lease amount is required';
        if (!formData.refundableAmount || formData.refundableAmount < 0) errors.refundableAmount = 'Refundable amount cannot be negative';
        if (formData.fullDepositOption && formData.fullDepositOption < 0) errors.fullDepositOption = 'Full deposit amount cannot be negative';

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                errors.endDate = 'End date must be after start date';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenModal = (lease = null) => {
        if (lease) {
            setIsEditing(true);
            setSelectedLeaseId(lease._id);
            // We'd ideally have the property ID from the unit to pre-select it, 
            // but for simplicity we'll just require the user to re-select property if editing unit,
            // or we just show the unit ID. Let's just set the unit ID.
            setFormData({
                unit: lease.unit?._id || lease.unit,
                tenant: lease.tenant?._id || lease.tenant,
                leaseType: lease.leaseType || 'Lumpsum',
                startDate: new Date(lease.startDate).toISOString().split('T')[0],
                endDate: new Date(lease.endDate).toISOString().split('T')[0],
                leaseAmount: lease.leaseAmount,
                refundableAmount: lease.refundableAmount,
                fullDepositOption: lease.fullDepositOption || '',
                deductionRules: lease.deductionRules || '',
                status: lease.status || 'Active'
            });
            const propId = typeof lease.unit?.property === 'object' ? lease.unit.property._id : lease.unit?.property;
            if (propId) {
                setSelectedPropertyId(propId);
            }
        } else {
            setIsEditing(false);
            setSelectedLeaseId(null);
            setSelectedPropertyId('');
            setFormData({
                unit: '',
                tenant: '',
                leaseType: 'Lumpsum',
                startDate: '',
                endDate: '',
                leaseAmount: '',
                refundableAmount: '',
                fullDepositOption: '',
                deductionRules: '',
                status: 'Active'
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        let success;
        if (isEditing) {
            success = await updateLease(selectedLeaseId, formData);
        } else {
            success = await createLease(formData);
        }

        if (success) {
            setShowModal(false);
            fetchLeases(); // Refresh list to get populated fields
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
            await deleteLease(id);
        }
    };

    if (loading && leases.length === 0) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;

    const filteredLeases = leases.filter(l =>
        l.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.unit?.unitNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableUnits = units.filter(u => {
        // If we are editing, always keep the currently selected unit in the dropdown.
        if (isEditing && formData.unit === u._id) return true;
        // Otherwise, only include units that are officially Available
        return u.status === 'Available';
    });

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Leases & Agreements</h2>
                    <p className="text-gray-500 mt-1">Manage tenant contracts and lumpsum structures.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105"
                >
                    <Plus size={20} />
                    Create Lease
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by tenant name or unit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                </div>
            </div>

            {leases.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No active leases</h3>
                    <p className="text-gray-500 mt-2 mb-6">Create a lease to assign a tenant to a unit and track their rent structure.</p>
                </div>
            ) : filteredLeases.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Search size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No matching leases</h3>
                    <p className="text-gray-500 mt-2 mb-6">We couldn't find any leases matching your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeases.map(lease => (
                        <div key={lease._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-2 ${lease.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        lease.status === 'Expired' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {lease.status}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900">{lease.tenant?.name || 'Unknown Tenant'}</h3>
                                    <p className="text-sm text-gray-500">Unit: {lease.unit?.unitNumber || 'Unassigned'}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(lease)}
                                        className="text-gray-400 hover:text-indigo-600 p-1 bg-gray-50 rounded-lg hover:bg-indigo-50"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lease._id)}
                                        className="text-gray-400 hover:text-red-600 p-1 bg-gray-50 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 py-4 border-y border-gray-50">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CreditCard size={16} className="text-gray-400" />
                                    <span className="flex-1">Lease Type</span>
                                    <span className="font-semibold text-gray-900">{lease.leaseType}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="flex-1">Duration</span>
                                    <span className="font-medium text-gray-900 border-b border-dashed border-gray-300">
                                        {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Advance / Deposit</span>
                                    <span className="text-base font-bold text-indigo-600">₹{lease.leaseAmount?.toLocaleString() || 0}</span>
                                </div>
                                <button className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-colors">
                                    <FileDown size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Lease' : 'Create New Lease'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center p-1 rounded-md hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                {/* Property Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Property</label>
                                    <select
                                        value={selectedPropertyId}
                                        onChange={(e) => {
                                            setSelectedPropertyId(e.target.value);
                                            setFormData({ ...formData, unit: '' }); // reset unit
                                        }}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow"
                                    >
                                        <option value="">Select Property...</option>
                                        {properties.map(p => (
                                            <option key={p._id} value={p._id}>{p.propertyName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Unit Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.unit ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Unit...</option>
                                        {availableUnits.map(u => (
                                            <option key={u._id} value={u._id}>{u.unitNumber}</option>
                                        ))}
                                    </select>
                                    {formErrors.unit && <p className="text-red-500 text-[10px] mt-1">{formErrors.unit}</p>}
                                </div>

                                {/* Tenant Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tenant</label>
                                    <select
                                        name="tenant"
                                        value={formData.tenant}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.tenant ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Tenant...</option>
                                        {tenants.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                                        ))}
                                    </select>
                                    {formErrors.tenant && <p className="text-red-500 text-[10px] mt-1">{formErrors.tenant}</p>}
                                </div>

                                {/* Dates */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.startDate ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formErrors.startDate && <p className="text-red-500 text-[10px] mt-1">{formErrors.startDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.endDate ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formErrors.endDate && <p className="text-red-500 text-[10px] mt-1">{formErrors.endDate}</p>}
                                </div>

                                {/* Amounts */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lease Amount (Advance)</label>
                                    <input
                                        type="number"
                                        name="leaseAmount"
                                        value={formData.leaseAmount}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.leaseAmount ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formErrors.leaseAmount && <p className="text-red-500 text-[10px] mt-1">{formErrors.leaseAmount}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Refundable Amount</label>
                                    <input
                                        type="number"
                                        name="refundableAmount"
                                        value={formData.refundableAmount}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.refundableAmount ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formErrors.refundableAmount && <p className="text-red-500 text-[10px] mt-1">{formErrors.refundableAmount}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Deposit Amount</label>
                                    <input
                                        type="number"
                                        name="fullDepositOption"
                                        value={formData.fullDepositOption}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow ${formErrors.fullDepositOption ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formErrors.fullDepositOption && <p className="text-red-500 text-[10px] mt-1">{formErrors.fullDepositOption}</p>}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>

                                {/* Deduction Rules */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deduction Rules (Optional)</label>
                                    <textarea
                                        name="deductionRules"
                                        value={formData.deductionRules}
                                        onChange={handleInputChange}
                                        rows="2"
                                        placeholder="Enter conditions for deductions..."
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-shadow"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    {isEditing ? 'Update Lease' : 'Create Lease'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leases;
