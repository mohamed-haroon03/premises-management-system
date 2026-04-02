import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Clock, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications(true);
        // Poll every 5 seconds so new notifications show immediately without manual refresh
        const interval = setInterval(() => fetchNotifications(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllRead = async () => {
        if (!window.confirm("Are you sure you want to clear all read notifications?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/all-read`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => !n.isRead));
        } catch (error) {
            console.error('Error clearing read notifications:', error);
        }
    };

    const hasReadNotifications = notifications.some(n => n.isRead);

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Activity History</h2>
                        <p className="text-gray-500 mt-1">View and manage all your notifications.</p>
                    </div>
                    {hasReadNotifications && (
                        <button
                            onClick={clearAllRead}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Clear Read
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-24">
                        <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No notifications yet</h3>
                        <p className="text-gray-500 mt-2">When you get notifications, they'll show up here.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <li
                                key={notification._id}
                                onClick={() => {
                                    if (notification.type === 'rent_due' && notification.referenceId) {
                                        const isDeposit = notification.title.toLowerCase().includes('deposit');
                                        navigate(`/payments?addPayment=true&unitId=${notification.referenceId}&isDeposit=${isDeposit}`);
                                    }
                                    if (notification.type === 'tax_due' && notification.referenceId) {
                                        navigate(`/properties/${notification.referenceId}?tab=taxes`);
                                    }
                                    if (notification.type === 'lease_due' && notification.referenceId) {
                                        const isLeaseFullDeposit = notification.title.toLowerCase().includes('full');
                                        navigate(`/payments?addPayment=true&unitId=${notification.referenceId}&isLease=true&isFullDeposit=${isLeaseFullDeposit}`);
                                    }
                                }}
                                className={`p-6 transition-colors flex gap-4 w-full ${!notification.isRead ? 'bg-indigo-50/30' : 'hover:bg-gray-50'} ${notification.type === 'rent_due' || notification.type === 'tax_due' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {notification.type === 'tax_due' ? (
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Clock size={20} />
                                        </div>
                                    ) : (notification.type === 'rent_due' || notification.type === 'lease_due') ? (
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Clock size={20} />
                                        </div>
                                    ) : (
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Bell size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className={`text-base font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </p>
                                            <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            {!notification.isRead ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification._id);
                                                    }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center"
                                                    title="Mark as read"
                                                >
                                                    <Check size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 font-medium">
                                        {new Date(notification.createdAt).toLocaleString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Notifications;
