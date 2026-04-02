import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 5 seconds to show notifications immediately without refresh
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                            <h3 className="font-bold text-sm">Notifications</h3>
                            <span className="bg-indigo-500 px-2 py-0.5 rounded-full text-xs font-semibold">{unreadCount} unread</span>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No notifications right now.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {notifications.map((notification) => (
                                        <li
                                            key={notification._id}
                                            onClick={() => {
                                                if (notification.type === 'rent_due' && notification.referenceId) {
                                                    setIsOpen(false);
                                                    navigate(`/payments?addPayment=true&unitId=${notification.referenceId}`);
                                                }
                                                if (notification.type === 'tax_due' && notification.referenceId) {
                                                    setIsOpen(false);
                                                    navigate(`/properties/${notification.referenceId}?tab=taxes`);
                                                }
                                                if (notification.type === 'lease_due' && notification.referenceId) {
                                                    setIsOpen(false);
                                                    const isFullDeposit = notification.title.toLowerCase().includes('full');
                                                    navigate(`/payments?addPayment=true&unitId=${notification.referenceId}&isLease=true&isFullDeposit=${isFullDeposit}`);
                                                }
                                            }}
                                            className={`p-4 transition-colors ${!notification.isRead ? 'bg-indigo-50/50' : 'hover:bg-gray-50'} ${notification.type === 'rent_due' || notification.type === 'tax_due' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {notification.type === 'tax_due' ? (
                                                        <Clock size={16} className={!notification.isRead ? 'text-rose-500' : 'text-gray-400'} />
                                                    ) : (notification.type === 'rent_due' || notification.type === 'lease_due') ? (
                                                        <Clock size={16} className={!notification.isRead ? 'text-emerald-500' : 'text-gray-400'} />
                                                    ) : (
                                                        <Bell size={16} className={!notification.isRead ? 'text-indigo-500' : 'text-gray-400'} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 line-clamp-2 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification._id);
                                                        }}
                                                        className="text-indigo-400 hover:text-indigo-600 p-1 rounded transition-colors self-start"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto shrink-0">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                View Activity History
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;
