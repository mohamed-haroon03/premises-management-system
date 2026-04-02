import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Building2, MapPin, MoreVertical, Edit2, Trash2, AlertCircle, X, CheckCircle } from 'lucide-react';
import usePropertyStore from '../store/propertyStore';

const Properties = () => {
    const navigate = useNavigate();
    const { properties, loading, error, fetchProperties, createProperty, updateProperty, deleteProperty: storeDeleteProperty } = usePropertyStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPropertyId, setEditPropertyId] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All Types');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        propertyName: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        type: 'House',
        totalUnits: 1,
        status: 'Active',
        images: []
    });
    const [formErrors, setFormErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    const validateForm = () => {
        const errors = [];
        if (!formData.propertyName.trim()) errors.push('Property Name is required');
        if (!formData.address.trim()) errors.push('Address is required');
        if (!formData.city.trim()) errors.push('City is required');
        if (!formData.state.trim() || formData.state.trim().length < 2) errors.push('State must be at least 2 characters');

        const zipRegex = /^\d{6}$/;
        if (!zipRegex.test(formData.zip)) errors.push('Valid 6-digit PIN code is required');

        if (formData.totalUnits < 1) errors.push('Total Units must be at least 1');
        if (formData.images.length === 0) errors.push('At least one property photo is required');

        setFormErrors(errors);
        return errors.length === 0;
    };

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        const success = await createProperty(formData);
        setIsSubmitting(false);
        if (success) {
            setShowAddModal(false);
            setFormErrors([]);
            setFormData({
                propertyName: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                type: 'House',
                totalUnits: 1,
                status: 'Active',
                images: []
            });
            setSuccessMessage('Property added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const promises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const MAX_HEIGHT = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG with 0.6 quality to stay well below limits
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                    img.onerror = (error) => reject(error);
                };
                reader.onerror = (error) => reject(error);
            });
        });

        Promise.all(promises).then((base64Images) => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...base64Images]
            }));
        });
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        const success = await updateProperty(editPropertyId, formData);
        setIsSubmitting(false);
        if (success) {
            setShowEditModal(false);
            setEditPropertyId(null);
            setFormErrors([]);
            setFormData({
                propertyName: '', address: '', city: '', state: '', zip: '', type: 'House', totalUnits: 1, status: 'Active', images: []
            });
            setSuccessMessage('Property updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const deleteProperty = async (id, e) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm('Are you sure you want to delete this property?')) {
            await storeDeleteProperty(id);
        }
        setActiveMenu(null);
    };

    const openEditModal = (p, e) => {
        e.stopPropagation();
        setEditPropertyId(p._id);
        setFormData({
            propertyName: p.propertyName,
            address: p.address,
            city: p.city,
            state: p.state,
            zip: p.zip,
            type: p.type,
            totalUnits: p.totalUnits,
            status: p.status,
            images: p.images || []
        });
        setFormErrors([]);
        setShowEditModal(true);
        setActiveMenu(null);
    };

    const filteredProperties = properties?.filter(p => {
        const matchesSearch = p.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesType = true;
        if (filterType !== 'All Types') {
            // Map the plural plural filter strings to singular model strings for exact matching
            const typeMap = {
                'Apartments': 'Apartment',
                'Houses': 'House',
                'Shops': 'Shop'
            };
            matchesType = p.type === typeMap[filterType];
        }

        return matchesSearch && matchesType;
    }) || [];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Properties</h2>
                    <p className="text-gray-500 mt-1">Manage your {properties?.length || 0} properties and their respective units.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Add Property
                </button>
            </div>

            {/* Toolbox */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search properties by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 outline-none"
                >
                    <option value="All Types">All Types</option>
                    <option value="Apartments">Apartments</option>
                    <option value="Houses">Houses</option>
                    <option value="Shops">Shops</option>
                </select>
            </div>

            {/* Grid */}
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
            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No properties found</h3>
                    <p className="text-gray-500 mt-2 mb-6">There are no properties matching your current filters or search.</p>
                    <button onClick={() => setShowAddModal(true)} className="text-indigo-600 font-medium hover:underline pb-1 border-b-2 border-transparent hover:border-indigo-600 transition-all">Add a Property +</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map(p => (
                        <div key={p._id} onClick={() => navigate(`/properties/${p._id}`)} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setActiveMenu(activeMenu === p._id ? null : p._id)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full shadow-sm opacity-100 transition-opacity focus:outline-none">
                                    <MoreVertical size={20} />
                                </button>
                                {activeMenu === p._id && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-1 z-20">
                                        <button onClick={(e) => openEditModal(p, e)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={(e) => deleteProperty(p._id, e)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            {p.images && p.images.length > 0 ? (
                                <div className="h-32 w-full rounded-2xl mb-4 overflow-hidden object-cover bg-gray-100 flex items-center justify-center">
                                    <img src={p.images[0]} alt={p.propertyName} className="h-full w-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4 text-indigo-600">
                                    <Building2 size={24} />
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.propertyName}</h3>
                            <div className="flex items-start gap-1 text-gray-500 mt-2 text-sm">
                                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{p.address}, {p.city}, {p.state} {p.zip}</span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {p.status}
                                </span>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-gray-900">{p.totalUnits || 0}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Units</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Property Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                            <h3 className="text-xl font-bold text-gray-900">Add New Property</h3>
                            <button onClick={() => { setShowAddModal(false); setFormErrors([]); }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">

                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                                    <input type="text" value={formData.propertyName} onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sunset Apartments" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="123 Main St" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="New York" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="New York" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                    <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="123456" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="House">House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Shop">Shop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                                    <input type="number" min="1" value={formData.totalUnits} onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Photos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {formData.images.length > 0 && (
                                        <div className="flex gap-2 mt-4 flex-wrap">
                                            {formData.images.map((img, index) => (
                                                <div key={index} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={img} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 focus:outline-none"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                                    {isSubmitting ? 'Adding...' : 'Add Property'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Property Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                            <h3 className="text-xl font-bold text-gray-900">Edit Property</h3>
                            <button onClick={() => { setShowEditModal(false); setFormErrors([]); }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditFormSubmit} className="p-6 space-y-6">

                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                                    <input type="text" value={formData.propertyName} onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                    <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="House">House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Shop">Shop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                                    <input type="number" min="1" value={formData.totalUnits} onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Photos</label>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                                    {formData.images.length > 0 && (
                                        <div className="flex gap-2 mt-4 flex-wrap">
                                            {formData.images.map((img, index) => (
                                                <div key={index} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={img} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 focus:outline-none"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Properties;
