import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Calendar, CreditCard, ArrowDownRight, FileDown } from 'lucide-react';

const TenantPayments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyPayments();
    }, []);

    const fetchMyPayments = async () => {
        try {
            // In a real application, we would pass auth token, and backend would only return MY payments.
            // E.g., const { data } = await axios.get('http://localhost:5000/api/payments/me');

            // Since we don't have the `me` endpoint yet, let's do a basic fetch and mock filter 
            // or just assume the data returned is tailored if dummy data exists.
            const { data } = await axios.get('http://localhost:5000/api/payments');

            // Example: filter locally (in reality, backend should do this!)
            // const myPayments = data.filter(p => p.tenant?._id === user?.tenantId); 
            setPayments(data);
        } catch (error) {
            console.error('Error fetching tenant payments', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Late': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Payments</h2>
                    <p className="text-gray-500 mt-1">View your rent history, lease deposits, and pending dues.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 transform hover:scale-105">
                    <CreditCard size={20} />
                    Pay Now
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
            ) : payments.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Receipt size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No payment records found</h3>
                    <p className="text-gray-500 mt-2 mb-6">Your payment history will appear here once you make your first payment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method & Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 relative"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map(pay => (
                                <tr key={pay._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <ArrowDownRight size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">Ref: {pay.reference || 'Auto-generated'}</div>
                                                <div className="text-xs text-gray-500">ID: {pay._id.substring(pay._id.length - 6)}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium mb-1">
                                            {pay.paymentCategory === 'Monthly Residential Rent' ? pay.rentMonthYear : pay.leasePaymentType}
                                        </div>
                                        {pay.paymentCategory === 'Monthly Residential Rent' && (
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusStyle(pay.status)}`}>
                                                {pay.status}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="font-medium text-gray-700 mr-2">{pay.paymentMethod}</span>
                                        <span className="text-xs text-gray-400 block mt-1">{new Date(pay.paymentDate).toLocaleDateString()}</span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span className="font-bold text-gray-900">₹{pay.amountPaid?.toLocaleString()}</span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button className="text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 p-2 rounded-lg" title="Download Receipt">
                                            <FileDown size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TenantPayments;
