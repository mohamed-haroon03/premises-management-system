import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Building2, MapPin, ArrowLeft, Plus,
    DoorClosed, Users, Receipt, Wrench, FileText,
    Edit2, Trash2, Home, X, AlertCircle, CheckCircle
} from 'lucide-react';
import PropertyTaxesTab from './PropertyTaxesTab';
import usePropertyStore from '../store/propertyStore';
import useUnitStore from '../store/unitStore';
import useTenantStore from '../store/tenantStore';
import useRentStore from '../store/rentStore';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeProperty: property, loading: propLoading, error: propError, fetchPropertyById } = usePropertyStore();
    const { units, loading: unitLoading, error: unitError, fetchUnitsByProperty, createUnit, deleteUnit, updateUnit } = useUnitStore();
    const { tenants, loading: tenantLoading, error: tenantError, fetchTenants } = useTenantStore();
    const { rents, loading: rentLoading, fetchRents } = useRentStore();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'units';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [showEditUnit, setShowEditUnit] = useState(false);
    const [editUnitId, setEditUnitId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [capacityError, setCapacityError] = useState('');
    const [formErrors, setFormErrors] = useState([]);
    const [unitForm, setUnitForm] = useState({
        unitNumber: '', bedrooms: 1, bathrooms: 1, status: 'Available'
    });

    useEffect(() => {
        if (id) {
            fetchPropertyById(id);
            fetchUnitsByProperty(id);
            fetchTenants();
            fetchRents();
        }
    }, [id, fetchPropertyById, fetchUnitsByProperty, fetchTenants, fetchRents]);

    // Compute tenants occupying units in this property based on active rents
    const activeRents = rents.filter(r => {
        const propId = r.unit?.property?._id || r.unit?.property;
        return propId === id && r.status === 'Active';
    });

    const propertyTenants = activeRents.map(rent => {
        const fullTenant = tenants.find(t => t._id === (rent.tenant?._id || rent.tenant));
        if (!fullTenant) return null;
        return {
            ...fullTenant,
            assignedUnitNumber: rent.unit?.unitNumber || 'Unknown'
        };
    }).filter(Boolean);

    const validateUnitForm = () => {
        const errors = [];
        if (!unitForm.unitNumber.trim()) errors.push('Unit Number is required');
        if (unitForm.bedrooms < 0) errors.push('Bedrooms cannot be negative');
        if (unitForm.bathrooms < 0) errors.push('Bathrooms cannot be negative');
        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();

        if (units.length >= property.totalUnits) {
            setFormErrors([`Cannot add more units. The property has reached its maximum capacity of ${property.totalUnits} units.`]);
            return;
        }

        if (!validateUnitForm()) return;

        const success = await createUnit({ ...unitForm, property: id });
        if (success) {
            setShowAddUnit(false);
            setUnitForm({ unitNumber: '', bedrooms: 1, bathrooms: 1, status: 'Available' });
            setFormErrors([]);
            setSuccessMessage('Unit created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleEditUnit = async (e) => {
        e.preventDefault();
        if (!validateUnitForm()) return;

        const success = await updateUnit(editUnitId, unitForm);
        if (success) {
            setShowEditUnit(false);
            setEditUnitId(null);
            setUnitForm({ unitNumber: '', bedrooms: 1, bathrooms: 1, status: 'Available' });
            setFormErrors([]);
            setSuccessMessage('Unit updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleDeleteUnit = async (unitId) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            const success = await deleteUnit(unitId);
            if (success) {
                setSuccessMessage('Unit deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    const openEditModal = (unit) => {
        setEditUnitId(unit._id);
        setUnitForm({
            unitNumber: unit.unitNumber,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms,
            status: unit.status
        });
        setFormErrors([]);
        setShowEditUnit(true);
    };

    if (propLoading && !property) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;
    if (propError) return <div className="text-center py-10 text-rose-500">{propError}</div>;
    if (!property) return <div className="text-center py-10">Property not found</div>;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/properties')}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        {property.propertyName}
                        <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {property.type}
                        </span>
                    </h2>
                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <MapPin size={16} />
                        <span>{property.address}, {property.city}, {property.state} {property.zip}</span>
                    </div>
                </div>
            </div>

            {/* Tabs Layout */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 px-6">
                    <nav className="flex space-x-8">
                        <TabButton active={activeTab === 'units'} onClick={() => setActiveTab('units')} icon={<DoorClosed size={18} />} label="Units" />
                        <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Users size={18} />} label="Tenants" />
                        <TabButton active={activeTab === 'taxes'} onClick={() => setActiveTab('taxes')} icon={<FileText size={18} />} label="Property Taxes" />
                    </nav>
                </div>

                <div className="p-6 bg-gray-50/50 min-h-[400px]">
                    {activeTab === 'units' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Manage Units ({units.length}/{property.totalUnits})</h3>
                                <button
                                    onClick={() => {
                                        if (units.length >= property.totalUnits) {
                                            setCapacityError(`Cannot add more units. The property has reached its maximum capacity of ${property.totalUnits} units.`);
                                            setTimeout(() => setCapacityError(''), 4000);
                                            return;
                                        }
                                        setCapacityError('');
                                        setUnitForm({ unitNumber: '', bedrooms: 1, bathrooms: 1, status: 'Available' });
                                        setFormErrors([]);
                                        setShowAddUnit(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <Plus size={18} />
                                    Add Unit
                                </button>
                            </div>

                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center justify-between gap-3 mb-6 animate-fade-in shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={20} className="text-emerald-600" />
                                        <p className="font-medium">{successMessage}</p>
                                    </div>
                                    <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {(unitError || capacityError) && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3 mb-6 animate-fade-in">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p>{unitError || capacityError}</p>
                                </div>
                            )}

                            {unitLoading && units.length === 0 ? (
                                <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
                            ) : units.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <Home size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h4 className="text-gray-900 font-medium pb-1">No units created yet</h4>
                                    <p className="text-gray-500 text-sm">Create units to start assigning tenants and tracking leases.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {units.map(unit => (
                                        <div key={unit._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                    {unit.unitNumber}
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${unit.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    unit.status === 'Rented' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-rose-50 text-rose-700 border-rose-100'
                                                    }`}>
                                                    {unit.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Bedrooms</span>
                                                    <span className="font-medium text-gray-700">{unit.bedrooms}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Bathrooms</span>
                                                    <span className="font-medium text-gray-700">{unit.bathrooms}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 flex gap-2">
                                                <button onClick={() => openEditModal(unit)} className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteUnit(unit._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'tenants' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Manage Tenants</h3>
                            </div>

                            {tenantError && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                                    <AlertCircle size={20} />
                                    <p>{tenantError}</p>
                                </div>
                            )}

                            {tenantLoading || rentLoading ? (
                                <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
                            ) : propertyTenants.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h4 className="text-gray-900 font-medium pb-1">No tenants found</h4>
                                    <p className="text-gray-500 text-sm">There are no tenants assigned to units in this property.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {propertyTenants.map(tenant => (
                                        <div key={tenant._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 text-lg">
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{tenant.name}</h4>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <DoorClosed size={14} /> Unit {tenant.assignedUnitNumber}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="text-sm">
                                                    <span className="text-gray-500 block text-xs">Email</span>
                                                    <span className="font-medium text-gray-700 truncate block">{tenant.email}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-gray-500 block text-xs">Phone</span>
                                                    <span className="font-medium text-gray-700">{tenant.phone}</span>
                                                </div>
                                            </div>

                                            {tenant.emergencyContact && (
                                                <div className="pt-3 border-t border-gray-100 mt-3 pt-3">
                                                    <span className="text-gray-500 block text-xs mb-1">Emergency Contact</span>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-gray-700">{tenant.emergencyContact.name}</span>
                                                        <a href={`tel:${tenant.emergencyContact.phone}`} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                                                            {tenant.emergencyContact.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'taxes' && (
                        <div className="py-2">
                            <PropertyTaxesTab propertyId={id} />
                        </div>
                    )}
                </div>
            </div>

            {/* Add Unit Modal */}
            {showAddUnit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Add New Unit</h3>
                            <button onClick={() => setShowAddUnit(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateUnit} className="p-6 space-y-4">
                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                                <input required type="text" value={unitForm.unitNumber} onChange={e => setUnitForm({ ...unitForm, unitNumber: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. Apt 101" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                    <input required type="number" min="0" value={unitForm.bedrooms} onChange={e => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                    <input required type="number" min="0" value={unitForm.bathrooms} onChange={e => setUnitForm({ ...unitForm, bathrooms: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={unitForm.status} onChange={e => setUnitForm({ ...unitForm, status: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                    <option value="Available">Available</option>
                                    <option value="Rented">Rented</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowAddUnit(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Unit Modal */}
            {showEditUnit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Edit Unit</h3>
                            <button onClick={() => setShowEditUnit(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleEditUnit} className="p-6 space-y-4">
                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                                <input required type="text" value={unitForm.unitNumber} onChange={e => setUnitForm({ ...unitForm, unitNumber: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                    <input required type="number" min="0" value={unitForm.bedrooms} onChange={e => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                    <input required type="number" min="0" value={unitForm.bathrooms} onChange={e => setUnitForm({ ...unitForm, bathrooms: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={unitForm.status} onChange={e => setUnitForm({ ...unitForm, status: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                    <option value="Available">Available</option>
                                    <option value="Rented">Rented</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEditUnit(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${active
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default PropertyDetails;
