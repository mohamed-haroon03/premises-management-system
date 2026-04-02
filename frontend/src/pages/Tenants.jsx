import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MoreVertical, Mail, Phone, Edit2, ShieldAlert, AlertCircle, Trash2, X, CheckCircle } from 'lucide-react';
import useTenantStore from '../store/tenantStore';
import useRentStore from '../store/rentStore';

const Tenants = () => {
    const { tenants, loading, error, fetchTenants, createTenant, updateTenant, deleteTenant } = useTenantStore();
    const { rents, fetchRents } = useRentStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTenantId, setEditTenantId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        emergencyContact: { name: '', phone: '', relation: '' }
    });
    const [formErrors, setFormErrors] = useState([]);

    const validateForm = () => {
        const errors = [];
        if (!formData.name.trim()) errors.push('Tenant Name is required');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim() || !emailRegex.test(formData.email)) errors.push('Valid Email is required');

        // Strip out non-digits to check length. 
        // We expect either 10 digits or 12 digits (if starting with 91)
        const tenantPhoneDigits = formData.phone.replace(/\D/g, '');
        if (!tenantPhoneDigits || (tenantPhoneDigits.length !== 10 && !(tenantPhoneDigits.length === 12 && tenantPhoneDigits.startsWith('91')))) {
            errors.push('Valid 10-digit Indian Mobile Number is required');
        }

        if (!formData.emergencyContact.name.trim()) errors.push('Emergency Contact Name is required');

        const emergencyPhoneDigits = formData.emergencyContact.phone.replace(/\D/g, '');
        if (!emergencyPhoneDigits || (emergencyPhoneDigits.length !== 10 && !(emergencyPhoneDigits.length === 12 && emergencyPhoneDigits.startsWith('91')))) {
            errors.push('Valid 10-digit Indian Emergency Contact Phone is required');
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    useEffect(() => {
        fetchTenants();
        fetchRents();
    }, [fetchTenants, fetchRents]);

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Mocking user ObjectId for now until invites are implemented
        const success = await createTenant({ ...formData, user: '000000000000000000000000' });
        if (success) {
            setShowAddModal(false);
            setFormErrors([]);
            setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
            setSuccessMessage('Tenant added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleEditTenant = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const success = await updateTenant(editTenantId, formData);
        if (success) {
            setShowEditModal(false);
            setEditTenantId(null);
            setFormErrors([]);
            setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
            setSuccessMessage('Tenant updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleDeleteTenant = async (id) => {
        if (window.confirm('Are you sure you want to delete this tenant?')) {
            const success = await deleteTenant(id);
            if (success) {
                setSuccessMessage('Tenant deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    const openEditModal = (tenant) => {
        setEditTenantId(tenant._id);
        setFormData({
            name: tenant.name || '',
            email: tenant.email || '',
            phone: tenant.phone || '',
            emergencyContact: {
                name: tenant.emergencyContact?.name || '',
                phone: tenant.emergencyContact?.phone || '',
                relation: tenant.emergencyContact?.relation || ''
            }
        });
        setFormErrors([]);
        setShowEditModal(true);
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;

    const filteredTenants = tenants.filter(t =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(t => {
        // Find active rent for this tenant
        const activeRent = rents.find(r => (r.tenant?._id === t._id || r.tenant === t._id) && r.status === 'Active');
        return {
            ...t,
            computedUnit: activeRent ? activeRent.unit : null
        };
    });

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants</h2>
                    <p className="text-gray-500 mt-1">Manage tenant profiles and emergency contacts.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105"
                >
                    <Plus size={20} />
                    Add Tenant
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

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tenants by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                </div>
            </div>

            {tenants.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Users size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No tenants yet</h3>
                    <p className="text-gray-500 mt-2 mb-6">Start building your community by adding tenants to your database.</p>
                </div>
            ) : filteredTenants.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Search size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No matching tenants</h3>
                    <p className="text-gray-500 mt-2 mb-6">We couldn't find any tenants matching your search query.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Unit</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact</th>
                                <th className="px-6 py-4 relative"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTenants.map(t => (
                                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{t.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mb-1"><Mail size={14} /> {t.email}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2"><Phone size={14} /> {t.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {t.computedUnit ? (
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                                Unit {t.computedUnit.unitNumber}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert size={14} className="text-rose-400" />
                                            {t.emergencyContact?.name} ({t.emergencyContact?.relation})
                                        </div>
                                        <div className="text-xs mt-0.5 ml-6">{t.emergencyContact?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(t)} className="text-gray-400 hover:text-indigo-600 transition-colors p-2">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteTenant(t._id)} className="text-gray-400 hover:text-rose-600 transition-colors p-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl animate-fade-in relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Add New Tenant Profile</h3>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setFormErrors([]);
                                setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
                            }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateTenant} className="space-y-6">
                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h4>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="+91 98765 43210" />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Emergency Contact</h4>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                    <input type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input type="tel" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="+91 91234 56789" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation to Tenant</label>
                                    <input type="text" value={formData.emergencyContact.relation} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relation: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sister, Father, Friend" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => {
                                    setShowAddModal(false);
                                    setFormErrors([]);
                                    setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
                                }} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2">Add Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl animate-fade-in relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Edit Tenant Profile</h3>
                            <button onClick={() => {
                                setShowEditModal(false);
                                setFormErrors([]);
                                setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
                            }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleEditTenant} className="space-y-6">
                            {formErrors.length > 0 && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h4>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="+91 98765 43210" />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Emergency Contact</h4>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                    <input type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input type="tel" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="+91 91234 56789" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation to Tenant</label>
                                    <input type="text" value={formData.emergencyContact.relation} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relation: e.target.value } })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sister, Father, Friend" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => {
                                    setShowEditModal(false);
                                    setFormErrors([]);
                                    setFormData({ name: '', email: '', phone: '', emergencyContact: { name: '', phone: '', relation: '' } });
                                }} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tenants;
