import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Receipt, Search, Plus, Filter, Wallet, ArrowDownRight, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';
import useTenantStore from '../store/tenantStore';
import usePropertyStore from '../store/propertyStore';
import useUnitStore from '../store/unitStore';
import useRentStore from '../store/rentStore';
import useLeaseStore from '../store/leaseStore';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Monthly Residential Rent');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        tenant: '',
        property: '',
        unit: '',
        amountPaid: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Online Transaction',
        reference: '',
        rentMonthYear: '', // e.g., 'April-2024'
        status: 'Paid',
        lease: '',
        leasePaymentType: 'Security Deposit',
        rentPaymentType: 'Monthly Rent'
    });
    const [formErrors, setFormErrors] = useState({});

    // Stores
    const { tenants, fetchTenants } = useTenantStore();
    const { properties, fetchProperties } = usePropertyStore();
    const { units, fetchUnitsByProperty } = useUnitStore();
    const { rents, fetchRents } = useRentStore();
    const { leases, fetchLeases } = useLeaseStore();

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTenants();
        fetchProperties();
        fetchRents();
        fetchLeases();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('addPayment') === 'true') {
            const queryUnitId = params.get('unitId');
            const isDepositQuery = params.get('isDeposit') === 'true';
            const isLeaseQuery = params.get('isLease') === 'true';
            const isLeaseFullDeposit = params.get('isFullDeposit') === 'true';
            const queryPaymentType = isDepositQuery ? 'Security Deposit' : 'Monthly Rent';

            if (isLeaseQuery && queryUnitId && leases.length > 0) {
                const associatedLease = leases.find(l => (typeof l.unit === 'object' ? l.unit._id : l.unit) === queryUnitId && (l.status === 'Active' || !l.status));

                if (associatedLease) {
                    const associatedUnit = typeof associatedLease.unit === 'object' ? associatedLease.unit : { _id: queryUnitId, property: '' };
                    let propId = '';
                    if (associatedUnit.property) {
                        propId = typeof associatedUnit.property === 'object' ? associatedUnit.property._id : associatedUnit.property;
                    }
                    const tenantId = typeof associatedLease.tenant === 'object' ? associatedLease.tenant._id : associatedLease.tenant;

                    const activeLeasePaymentType = isLeaseFullDeposit ? 'Full Deposit' : 'Security Deposit';
                    const activeLeaseAmount = isLeaseFullDeposit ? associatedLease.fullDepositOption : associatedLease.leaseAmount;

                    setFormData(prev => ({
                        ...prev,
                        property: propId || '',
                        unit: queryUnitId,
                        tenant: tenantId,
                        lease: associatedLease._id,
                        leasePaymentType: activeLeasePaymentType,
                        amountPaid: activeLeaseAmount || ''
                    }));
                    if (propId) {
                        fetchUnitsByProperty(propId);
                    }
                    setShowAddModal(true);
                    setActiveTab('Lease Rent');
                    navigate('/payments', { replace: true });
                }
            } else if (!isLeaseQuery && queryUnitId && rents.length > 0) {
                const associatedRent = rents.find(r => (typeof r.unit === 'object' ? r.unit._id : r.unit) === queryUnitId && r.status === 'Active');

                if (associatedRent) {
                    const associatedUnit = typeof associatedRent.unit === 'object' ? associatedRent.unit : { _id: queryUnitId, property: associatedRent.property || '' };
                    let propId = '';
                    if (associatedUnit.property) {
                        propId = typeof associatedUnit.property === 'object' ? associatedUnit.property._id : associatedUnit.property;
                    } else if (associatedRent.property) {
                        propId = typeof associatedRent.property === 'object' ? associatedRent.property._id : associatedRent.property;
                    }
                    const tenantId = typeof associatedRent.tenant === 'object' ? associatedRent.tenant._id : associatedRent.tenant;

                    setFormData(prev => ({
                        ...prev,
                        property: propId || '',
                        unit: queryUnitId,
                        tenant: tenantId,
                        rentPaymentType: queryPaymentType,
                        amountPaid: queryPaymentType === 'Security Deposit' ? (associatedRent.securityDeposit || '') : (associatedRent.monthlyRentAmount || '')
                    }));
                    if (propId) {
                        fetchUnitsByProperty(propId);
                    }
                    setShowAddModal(true);
                    setActiveTab('Monthly Residential Rent');
                    navigate('/payments', { replace: true });
                }
            }
        }
    }, [location.search, rents, units, leases]);

    const resetForm = () => {
        setFormData({
            tenant: '', property: '', unit: '', amountPaid: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Online Transaction', reference: '',
            rentMonthYear: '', status: 'Paid', lease: '',
            leasePaymentType: 'Security Deposit', rentPaymentType: 'Monthly Rent'
        });
        setFormErrors({});
        setIsEditing(false);
        setEditId(null);
    };

    const handlePropertyChange = (e) => {
        const propId = e.target.value;
        setFormData(prev => ({ ...prev, property: propId, unit: '', amountPaid: '' }));
        if (propId) fetchUnitsByProperty(propId);
    };

    // Auto-fill logic
    useEffect(() => {
        if (activeTab === 'Monthly Residential Rent' && formData.unit && formData.tenant) {
            // Find active rent contract
            const activeRent = rents.find(r => {
                const rentUnitId = typeof r.unit === 'object' ? r.unit._id : r.unit;
                const rentTenantId = typeof r.tenant === 'object' ? r.tenant._id : r.tenant;
                return rentUnitId === formData.unit && rentTenantId === formData.tenant && r.status === 'Active';
            });
            if (activeRent) {
                if (formData.rentPaymentType === 'Security Deposit') {
                    setFormData(prev => ({ ...prev, amountPaid: activeRent.securityDeposit }));
                } else {
                    setFormData(prev => ({ ...prev, amountPaid: activeRent.monthlyRentAmount }));
                }
            }
        } else if (activeTab === 'Lease Rent' && formData.lease) {
            // Auto fill for lease rent
            const activeLease = leases.find(l => l._id === formData.lease);
            if (activeLease) {
                // Determine if we should set amountPaid based on type. For deposit, use refundableAmount or leaseAmount. Typically leaseAmount represents lump sum or full deposit.
                if (formData.leasePaymentType === 'Security Deposit') {
                    setFormData(prev => ({ ...prev, amountPaid: activeLease.leaseAmount }));
                } else if (formData.leasePaymentType === 'Full Deposit') {
                    setFormData(prev => ({ ...prev, amountPaid: activeLease.fullDepositOption }));
                }
            }
        }
    }, [formData.unit, formData.tenant, formData.lease, formData.leasePaymentType, formData.rentPaymentType, activeTab, rents, leases]);

    // Auto-fill tenant and lease for Lease Rent when a unit is selected
    useEffect(() => {
        if (activeTab === 'Lease Rent' && formData.unit && !editId) {
            const activeLease = leases.find(l =>
                (typeof l.unit === 'object' ? l.unit?._id : l.unit) === formData.unit &&
                (l.status === 'Active' || !l.status)
            );

            if (activeLease) {
                setFormData(prev => ({
                    ...prev,
                    lease: activeLease._id,
                    tenant: typeof activeLease.tenant === 'object' ? activeLease.tenant._id : activeLease.tenant
                }));
            }
        }
    }, [formData.unit, activeTab, leases, editId]);

    // Check if security deposit is already paid for the selected unit/tenant (for the current active rent contract)
    const isDepositPaid = React.useMemo(() => {
        if (!formData.unit || !formData.tenant) return false;

        // Prevent older security deposits from interfering if a new rent contract was made recently
        const activeRent = rents.find(r =>
            (typeof r.unit === 'object' ? r.unit._id : r.unit) === formData.unit &&
            (typeof r.tenant === 'object' ? r.tenant._id : r.tenant) === formData.tenant &&
            r.status === 'Active'
        );
        let activeStartDate = 0;
        if (activeRent && activeRent.startDate) {
            activeStartDate = new Date(activeRent.startDate).setHours(0, 0, 0, 0);
        }

        return payments.some(p => {
            const paymentDate = new Date(p.paymentDate).setHours(0, 0, 0, 0);
            return p.paymentCategory === 'Monthly Residential Rent' &&
                (typeof p.unit === 'object' ? p.unit?._id : p.unit) === formData.unit &&
                (typeof p.tenant === 'object' ? p.tenant?._id : p.tenant) === formData.tenant &&
                p.rentPaymentType === 'Security Deposit' &&
                p._id !== editId &&
                parseFloat(p.amountPaid) > 0 &&
                (activeStartDate === 0 || paymentDate >= activeStartDate);
        });
    }, [payments, formData.unit, formData.tenant, editId, rents]);

    // Check if lease security/full deposit is already paid for the selected lease
    const isLeaseDepositPaid = React.useMemo(() => {
        if (!formData.lease) return { securityDeposit: false, fullDeposit: false };

        const paidSecurity = payments.some(p =>
            p.paymentCategory === 'Lease Rent' &&
            (typeof p.lease === 'object' ? p.lease?._id : p.lease) === formData.lease &&
            p.leasePaymentType === 'Security Deposit' &&
            p._id !== editId
        );

        const paidFull = payments.some(p =>
            p.paymentCategory === 'Lease Rent' &&
            (typeof p.lease === 'object' ? p.lease?._id : p.lease) === formData.lease &&
            p.leasePaymentType === 'Full Deposit' &&
            p._id !== editId
        );

        return { securityDeposit: paidSecurity, fullDeposit: paidFull };
    }, [payments, formData.lease, editId]);

    // We removed the auto-fallback to Monthly Rent so the URL parameter isn't silently overridden.

    // Automatically clear lease payment type if the selected one is already paid
    useEffect(() => {
        if (activeTab === 'Lease Rent') {
            if (isLeaseDepositPaid.securityDeposit && formData.leasePaymentType === 'Security Deposit') {
                setFormData(prev => ({ ...prev, leasePaymentType: '' }));
            }
            if (isLeaseDepositPaid.fullDeposit && formData.leasePaymentType === 'Full Deposit') {
                setFormData(prev => ({ ...prev, leasePaymentType: '' }));
            }
        }
    }, [isLeaseDepositPaid, formData.leasePaymentType, activeTab]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let updates = { [name]: value };

        // Auto-select tenant when unit changes
        if (name === 'unit' && value) {
            console.log("All Rents:", rents);
            console.log("Selected Unit ID:", value);
            // Need to handle cases where rent.unit is an object (populated via mongoose) or just an ID string
            const activeRent = rents.find(r => {
                const rentUnitId = typeof r.unit === 'object' ? r.unit._id : r.unit;
                return rentUnitId === value && r.status === 'Active';
            });
            console.log("Found Active Rent:", activeRent);

            if (activeRent && activeRent.tenant) {
                const tenantId = typeof activeRent.tenant === 'object' ? activeRent.tenant._id : activeRent.tenant;
                updates.tenant = tenantId;
            } else {
                updates.tenant = '';
            }
        }

        // Auto-select tenant when lease changes
        if (name === 'lease' && value) {
            const selectedLease = leases.find(l => l._id === value);
            if (selectedLease && selectedLease.tenant) {
                const tenantId = typeof selectedLease.tenant === 'object' ? selectedLease.tenant._id : selectedLease.tenant;
                updates.tenant = tenantId;
            } else {
                updates.tenant = '';
            }
        }

        setFormData(prev => ({ ...prev, ...updates }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.tenant) errors.tenant = "Tenant is required";
        if (!formData.amountPaid || formData.amountPaid <= 0) errors.amountPaid = "A positive amount is required";

        if (activeTab === 'Monthly Residential Rent') {
            if (!formData.unit) errors.unit = "Unit is required";
            if (!formData.rentPaymentType) errors.rentPaymentType = "Payment type is required";
            if (formData.rentPaymentType === 'Monthly Rent' && !formData.rentMonthYear) errors.rentMonthYear = "Rent period is required";
        } else {
            if (!formData.unit) errors.unit = "Unit is required";
            if (!formData.lease) errors.lease = "Lease Contract is required";
            if (!formData.leasePaymentType) errors.leasePaymentType = "Payment type is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');

            const payload = {
                paymentCategory: activeTab,
                tenant: formData.tenant,
                amountPaid: Number(formData.amountPaid),
                paymentDate: formData.paymentDate,
                paymentMethod: formData.paymentMethod,
                reference: formData.reference
            };

            if (activeTab === 'Monthly Residential Rent') {
                payload.unit = formData.unit;
                payload.rentPaymentType = formData.rentPaymentType;
                if (formData.rentPaymentType === 'Monthly Rent') {
                    payload.rentMonthYear = formData.rentMonthYear;
                }
                payload.status = formData.status;
            } else {
                // Lease specific
                payload.unit = formData.unit;
                payload.leasePaymentType = formData.leasePaymentType;
                if (formData.lease) payload.lease = formData.lease;
            }

            if (isEditing) {
                const { data } = await axios.put(`http://localhost:5000/api/payments/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPayments(payments.map(p => p._id === editId ? data : p));
            } else {
                const { data } = await axios.post(`http://localhost:5000/api/payments`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPayments([data, ...payments]);
            }

            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error(error);
            setFormErrors({ submit: error.response?.data?.message || 'Server Error' });
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [activeTab]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`http://localhost:5000/api/payments?category=${activeTab}`);
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (payment) => {
        setFormData({
            tenant: payment.tenant?._id || payment.tenant,
            property: payment.unit?.property || '',
            unit: payment.unit?._id || payment.unit || '',
            amountPaid: payment.amountPaid,
            paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
            paymentMethod: payment.paymentMethod,
            reference: payment.reference || '',
            rentMonthYear: payment.rentMonthYear || '',
            status: payment.status || 'Paid',
            rentPaymentType: payment.rentPaymentType || 'Monthly Rent',
            lease: payment.lease?._id || payment.lease || '',
            leasePaymentType: payment.leasePaymentType || 'Security Deposit'
        });

        // Populate unit dropdown options if property is known
        if (payment.unit?.property) {
            fetchUnitsByProperty(payment.unit.property);
        }

        setEditId(payment._id);
        setIsEditing(true);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/payments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(payments.filter(p => p._id !== id));
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert(error.response?.data?.message || 'Error deleting payment');
        }
    };

    const calculateTotal = () => {
        return payments.reduce((sum, pay) => sum + (pay.amountPaid || 0), 0);
    };

    // Calculate available properties based on active leases and rents
    const availableLeaseProperties = React.useMemo(() => {
        const leasePropertyIds = new Set(
            leases
                .filter(l => l.status === 'Active' || !l.status)
                .map(l => {
                    const unitObj = typeof l.unit === 'object' ? l.unit : null;
                    if (unitObj && unitObj.property) {
                        return typeof unitObj.property === 'object' ? unitObj.property._id : unitObj.property;
                    }
                    return null;
                })
                .filter(id => id !== null)
        );
        return properties.filter(p => leasePropertyIds.has(p._id));
    }, [properties, leases]);

    const availableRentProperties = React.useMemo(() => {
        const rentPropertyIds = new Set(
            rents
                .filter(r => r.status === 'Active' || !r.status)
                .map(r => {
                    const unitObj = typeof r.unit === 'object' ? r.unit : null;
                    if (unitObj && unitObj.property) {
                        return typeof unitObj.property === 'object' ? unitObj.property._id : unitObj.property;
                    }
                    return null;
                })
                .filter(id => id !== null)
        );
        return properties.filter(p => rentPropertyIds.has(p._id));
    }, [properties, rents]);

    // Calculate available units for Lease Rent
    const availableLeaseUnits = React.useMemo(() => {
        if (!formData.property) return [];

        // Get all unique unit IDs from active leases
        const leaseUnitIds = new Set(
            leases
                .filter(l => l.status === 'Active' || !l.status) // Assume undefined means active if schema doesn't strictly enforce it
                .map(l => typeof l.unit === 'object' ? l.unit?._id : l.unit)
        );

        // Filter the globally fetched units to only those present in leases
        return units.filter(u => leaseUnitIds.has(u._id));
    }, [units, leases, formData.property]);

    // Calculate available units for Monthly Rent
    const availableRentUnits = React.useMemo(() => {
        if (!formData.property) return [];

        // Get all unique unit IDs from active rent contracts
        const rentUnitIds = new Set(
            rents
                .filter(r => r.status === 'Active' || !r.status)
                .map(r => typeof r.unit === 'object' ? r.unit?._id : r.unit)
        );

        // Filter the globally fetched units to only those present in active rents
        return units.filter(u => rentUnitIds.has(u._id));
    }, [units, rents, formData.property]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h2>
                    <p className="text-gray-500 mt-1">Track monthly collections, lease deposits, and pending dues.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105"
                >
                    <Plus size={20} />
                    Record Payment
                </button>
            </div>

            {/* Tabs and Summary */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex-1 flex">
                    <button
                        onClick={() => setActiveTab('Monthly Residential Rent')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'Monthly Residential Rent' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        Monthly Res. Rent
                    </button>
                    <button
                        onClick={() => setActiveTab('Lease Rent')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'Lease Rent' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        Lease Deposits & Fees
                    </button>
                </div>

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 shadow-sm text-white flex items-center gap-4 min-w-[250px]">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Wallet size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Total Collected ({activeTab === 'Monthly Residential Rent' ? 'Rent' : 'Lease'})</p>
                        <h3 className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search references or tenants..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <button className="px-4 py-2.5 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
            ) : payments.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Receipt size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No payments found</h3>
                    <p className="text-gray-500 mt-2 mb-6">There are no recorded transactions in this category yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                                {activeTab === 'Monthly Residential Rent' && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period & Status</th>
                                )}
                                {activeTab === 'Lease Rent' && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Type</th>
                                )}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method & Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map(pay => (
                                <tr key={pay._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <ArrowDownRight size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">Ref: {pay.reference || 'N/A'}</div>
                                                <div className="text-xs text-gray-500 text-ellipsis overflow-hidden">ID: {pay._id.substring(pay._id.length - 6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{pay.tenant?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">
                                            {activeTab === 'Monthly Residential Rent' ? `Unit: ${pay.unit?.unitNumber || '?'}` : `Lease: ${typeof pay.lease === 'string' ? pay.lease.substring(pay.lease.length - 6) : (pay.lease?._id?.substring(pay.lease._id.length - 6) || '?')}`}
                                        </div>
                                    </td>

                                    {activeTab === 'Monthly Residential Rent' ? (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium mb-1">
                                                {pay.rentPaymentType === 'Security Deposit' ? 'Security Deposit' : pay.rentMonthYear}
                                                {pay.rentPaymentType === 'Security Deposit' && <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Deposit</span>}
                                            </div>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${pay.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                pay.status === 'Late' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                    ) : (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-full border border-indigo-100">
                                                {pay.leasePaymentType}
                                            </span>
                                        </td>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="font-medium text-gray-700 mr-2">{pay.paymentMethod}</span>
                                        <span className="text-xs text-gray-400 block mt-1">{new Date(pay.paymentDate).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span className="font-bold text-gray-900">₹{pay.amountPaid.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(pay)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit Payment"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pay._id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Payment"
                                            >
                                                <Trash2 size={16} />
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-start p-4 sm:pt-20 overflow-y-auto">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-xl font-bold">{isEditing ? 'Edit Payment' : 'Record Payment'}</h3>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {formErrors.submit && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{formErrors.submit}</div>}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                                    <select
                                        name="property"
                                        value={formData.property}
                                        onChange={handlePropertyChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                    >
                                        <option value="">Select a property</option>
                                        {(activeTab === 'Monthly Residential Rent' ? availableRentProperties : availableLeaseProperties).map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                                    </select>
                                    {activeTab === 'Lease Rent' && formData.property && availableLeaseUnits.length === 0 && (
                                        <p className="text-red-500 text-xs mt-1">There are no active leases available in this property.</p>
                                    )}
                                    {activeTab === 'Monthly Residential Rent' && formData.property && availableRentUnits.length === 0 && (
                                        <p className="text-red-500 text-xs mt-1">There are no active rent contracts available in this property.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 ${formErrors.unit ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Unit</option>
                                        {(activeTab === 'Monthly Residential Rent' ? availableRentUnits : availableLeaseUnits).map(u => <option key={u._id} value={u._id}>{u.unitNumber}</option>)}
                                    </select>
                                    {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                                    <select
                                        name="tenant"
                                        value={formData.tenant}
                                        onChange={handleInputChange}
                                        disabled
                                        className={`w-full px-4 py-2.5 bg-gray-100 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-500 cursor-not-allowed ${formErrors.tenant ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Tenant</option>
                                        {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                    {formErrors.tenant && <p className="text-red-500 text-xs mt-1">{formErrors.tenant}</p>}
                                </div>

                                {activeTab === 'Monthly Residential Rent' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                                            <select
                                                name="rentPaymentType"
                                                value={formData.rentPaymentType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                            >
                                                <option value="Monthly Rent">Monthly Rent</option>
                                                <option value="Security Deposit">Security Deposit</option>
                                            </select>
                                            {isDepositPaid && formData.rentPaymentType === 'Security Deposit' && (
                                                <p className="text-amber-600 text-xs mt-1">A security deposit has already been recorded for this contract.</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {formData.rentPaymentType === 'Monthly Rent' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Month/Year</label>
                                                    <input
                                                        type="text"
                                                        name="rentMonthYear"
                                                        placeholder="e.g. May-2024"
                                                        value={formData.rentMonthYear}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 ${formErrors.rentMonthYear ? 'border-red-500' : 'border-gray-200'}`}
                                                    />
                                                    {formErrors.rentMonthYear && <p className="text-red-500 text-xs mt-1">{formErrors.rentMonthYear}</p>}
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                <select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                                >
                                                    <option value="Paid">Paid</option>
                                                    <option value="Late">Late</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Lease Contract</label>
                                            <select
                                                name="lease"
                                                value={formData.lease}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 ${formErrors.lease ? 'border-red-500' : 'border-gray-200'}`}
                                            >
                                                <option value="">Select Lease</option>
                                                {leases.map(l => (
                                                    <option key={l._id} value={l._id}>
                                                        {l.tenant?.name || 'Lease'} - {new Date(l.startDate).toLocaleDateString()}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.lease && <p className="text-red-500 text-xs mt-1">{formErrors.lease}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                                            <select
                                                name="leasePaymentType"
                                                value={formData.leasePaymentType}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 ${formErrors.leasePaymentType ? 'border-red-500' : 'border-gray-200'}`}
                                            >
                                                <option value="">Select Payment Type</option>
                                                {!isLeaseDepositPaid.securityDeposit && <option value="Security Deposit">Security Deposit</option>}
                                                {!isLeaseDepositPaid.fullDeposit && <option value="Full Deposit">Full Deposit</option>}
                                            </select>
                                            {formErrors.leasePaymentType && <p className="text-red-500 text-xs mt-1">{formErrors.leasePaymentType}</p>}
                                            {isLeaseDepositPaid.securityDeposit && isLeaseDepositPaid.fullDeposit && formData.lease && (
                                                <p className="text-amber-600 text-xs mt-1">Both deposits have already been paid for this lease.</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                        <input
                                            type="date"
                                            name="paymentDate"
                                            value={formData.paymentDate}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                        >
                                            <option value="Online Transaction">Online</option>
                                            <option value="Cash">Cash</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-yellow-700 mb-2 font-bold flex justify-between">
                                        Amount Auto-Calculated
                                    </label>
                                    <input
                                        type="number"
                                        name="amountPaid"
                                        value={formData.amountPaid}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className={`w-full px-4 py-2.5 bg-yellow-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 font-bold text-lg ${formErrors.amountPaid ? 'border-red-500' : 'border-yellow-200'}`}
                                    />
                                    {formErrors.amountPaid && <p className="text-red-500 text-xs mt-1">{formErrors.amountPaid}</p>}
                                </div>

                                {formData.paymentMethod === 'Online Transaction' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reference ID (e.g. UPI / Receipt)</label>
                                        <input
                                            type="text"
                                            name="reference"
                                            value={formData.reference}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                        />
                                    </div>
                                )}

                                <div className="pt-6 mt-4 border-t border-gray-100 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddModal(false); resetForm(); }}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        {isEditing ? 'Save Changes' : 'Record Payment'}
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

export default Payments;
