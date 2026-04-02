import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Calendar, FileDown, MoreVertical, CreditCard, Edit, Trash2 } from 'lucide-react';
import useRentStore from '../store/rentStore';
import usePropertyStore from '../store/propertyStore';
import useUnitStore from '../store/unitStore';
import useTenantStore from '../store/tenantStore';

const Rents = () => {
    const { rents, loading, fetchRents, createRent, updateRent, deleteRent } = useRentStore();
    const { properties, fetchProperties } = usePropertyStore();
    const { units, fetchUnitsByProperty } = useUnitStore();
    const { tenants, fetchTenants } = useTenantStore();

    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRentId, setSelectedRentId] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        unit: '',
        tenant: '',
        rentType: 'Monthly',
        startDate: '',
        endDate: '',
        monthlyRentAmount: '',
        securityDeposit: '',
        paymentDate: 1,
        status: 'Active'
    });

    useEffect(() => {
        fetchRents();
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
        if (!formData.monthlyRentAmount || formData.monthlyRentAmount <= 0) errors.monthlyRentAmount = 'Valid rent amount is required';
        if (!formData.securityDeposit || formData.securityDeposit < 0) errors.securityDeposit = 'Deposit cannot be negative';
        if (!formData.paymentDate || formData.paymentDate < 1 || formData.paymentDate > 31) errors.paymentDate = 'Must be between 1 and 31';

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                errors.endDate = 'End date must be after start date';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenModal = (rent = null) => {
        if (rent) {
            setIsEditing(true);
            setSelectedRentId(rent._id);
            setFormData({
                unit: rent.unit?._id || rent.unit,
                tenant: rent.tenant?._id || rent.tenant,
                rentType: rent.rentType || 'Monthly',
                startDate: new Date(rent.startDate).toISOString().split('T')[0],
                endDate: new Date(rent.endDate).toISOString().split('T')[0],
                monthlyRentAmount: rent.monthlyRentAmount,
                securityDeposit: rent.securityDeposit,
                paymentDate: rent.paymentDate || 1,
                status: rent.status || 'Active'
            });
            const propId = rent.unit?.property?._id || rent.unit?.property;
            if (propId) {
                setSelectedPropertyId(propId);
            }
        } else {
            setIsEditing(false);
            setSelectedRentId(null);
            setSelectedPropertyId('');
            setFormData({
                unit: '',
                tenant: '',
                rentType: 'Monthly',
                startDate: '',
                endDate: '',
                monthlyRentAmount: '',
                securityDeposit: '',
                paymentDate: 1,
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
            success = await updateRent(selectedRentId, formData);
        } else {
            success = await createRent(formData);
        }

        if (success) {
            setShowModal(false);
            fetchRents();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rent agreement? This action cannot be undone.')) {
            await deleteRent(id);
        }
    };

    if (loading && rents.length === 0) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;

    const filteredRents = rents.filter(r =>
        r.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.unit?.unitNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Monthly Rents</h2>
                    <p className="text-gray-500 mt-1">Manage monthly rent agreements and structures.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105"
                >
                    <Plus size={20} />
                    New Agreement
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

            {rents.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No active rent agreements</h3>
                    <p className="text-gray-500 mt-2 mb-6">Create an agreement to assign a tenant to a unit for monthly rent.</p>
                </div>
            ) : filteredRents.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Search size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No matching agreements</h3>
                    <p className="text-gray-500 mt-2 mb-6">We couldn't find any agreements matching your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRents.map(rent => {
                        const propId = typeof rent.unit?.property === 'object' ? rent.unit.property._id : rent.unit?.property;
                        const propertyObj = properties.find(p => p._id === propId);
                        const propertyNameDisplay = propertyObj?.propertyName || rent.unit?.property?.propertyName || 'Unknown Property';

                        return (
                            <div key={rent._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-2 ${rent.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            rent.status === 'Expired' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            {rent.status}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900">{rent.tenant?.name || 'Unknown Tenant'}</h3>
                                        <p className="text-sm text-gray-500 font-medium text-indigo-600 mb-0.5">{propertyNameDisplay}</p>
                                        <p className="text-sm text-gray-500">Unit: {rent.unit?.unitNumber || 'Unassigned'}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(rent)}
                                            className="text-gray-400 hover:text-indigo-600 p-1 bg-gray-50 rounded-lg hover:bg-indigo-50"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rent._id)}
                                            className="text-gray-400 hover:text-red-600 p-1 bg-gray-50 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 py-4 border-y border-gray-50">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <CreditCard size={16} className="text-gray-400" />
                                        <span className="flex-1">Due Date</span>
                                        <span className="font-semibold text-gray-900">{rent.paymentDate}{rent.paymentDate === 1 ? 'st' : rent.paymentDate === 2 ? 'nd' : rent.paymentDate === 3 ? 'rd' : 'th'} of month</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span className="flex-1">Duration</span>
                                        <span className="font-medium text-gray-900 border-b border-dashed border-gray-300">
                                            {new Date(rent.startDate).toLocaleDateString()} - {new Date(rent.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Monthly Rent</span>
                                        <span className="text-base font-bold text-indigo-600">₹{rent.monthlyRentAmount?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Deposit</span>
                                        <span className="text-base font-bold text-gray-700">₹{rent.securityDeposit?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center p-4 pt-16 sm:pt-20">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] relative">
                        <div className="p-6 sm:px-8 sm:py-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Agreement' : 'New Rent Agreement'}</h3>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Property Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                                    <select
                                        value={selectedPropertyId}
                                        onChange={(e) => {
                                            setSelectedPropertyId(e.target.value);
                                            setFormData({ ...formData, unit: '' });
                                        }}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Select Property...</option>
                                        {properties.map(p => (
                                            <option key={p._id} value={p._id}>{p.propertyName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Unit Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.unit ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Unit...</option>
                                        {units
                                            .filter(u => u.status === 'Available' || u._id === formData.unit)
                                            .map(u => (
                                                <option key={u._id} value={u._id}>
                                                    {u.unitNumber} {u.status !== 'Available' ? `(${u.status})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                    {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
                                </div>

                                {/* Tenant Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                                    <select
                                        name="tenant"
                                        value={formData.tenant}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.tenant ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Tenant...</option>
                                        {tenants.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                                        ))}
                                    </select>
                                    {formErrors.tenant && <p className="text-red-500 text-xs mt-1">{formErrors.tenant}</p>}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.startDate ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {formErrors.startDate && <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.endDate ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {formErrors.endDate && <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>}
                                    </div>
                                </div>

                                {/* Amounts */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent</label>
                                        <input
                                            type="number"
                                            name="monthlyRentAmount"
                                            value={formData.monthlyRentAmount}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.monthlyRentAmount ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {formErrors.monthlyRentAmount && <p className="text-red-500 text-xs mt-1">{formErrors.monthlyRentAmount}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Deposit</label>
                                        <input
                                            type="number"
                                            name="securityDeposit"
                                            value={formData.securityDeposit}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.securityDeposit ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {formErrors.securityDeposit && <p className="text-red-500 text-xs mt-1">{formErrors.securityDeposit}</p>}
                                    </div>
                                </div>

                                {/* Status and Payment Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                        <input
                                            type="number"
                                            name="paymentDate"
                                            value={formData.paymentDate}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="31"
                                            placeholder="1"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.paymentDate ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Day of the month</p>
                                        {formErrors.paymentDate && <p className="text-red-500 text-xs mt-1">{formErrors.paymentDate}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Terminated">Terminated</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-6 mt-4 border-t border-gray-100 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setFormErrors({});
                                        }}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm"
                                    >
                                        {isEditing ? 'Save Changes' : 'Create Agreement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rents;
