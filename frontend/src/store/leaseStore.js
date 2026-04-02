import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const useLeaseStore = create((set) => ({
    leases: [],
    loading: false,
    error: null,

    fetchLeases: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/leases`, { headers: { Authorization: `Bearer ${token}` } });
            set({ leases: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching leases',
                loading: false
            });
        }
    },

    createLease: async (leaseData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/leases`, leaseData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                leases: [...state.leases, data],
                loading: false
            }));
            toast.success('Lease added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error creating lease',
                loading: false
            });
            return false;
        }
    },

    updateLease: async (id, leaseData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/leases/${id}`, leaseData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                leases: state.leases.map(l => l._id === id ? data : l),
                loading: false
            }));
            toast.success('Lease updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error updating lease',
                loading: false
            });
            return false;
        }
    },

    deleteLease: async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/leases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                leases: state.leases.filter(l => l._id !== id),
                loading: false
            }));
            toast.success('Lease deleted successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error deleting lease',
                loading: false
            });
            return false;
        }
    }
}));

export default useLeaseStore;
