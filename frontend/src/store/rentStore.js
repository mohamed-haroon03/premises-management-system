import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const useRentStore = create((set) => ({
    rents: [],
    loading: false,
    error: null,

    fetchRents: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/rents`, { headers: { Authorization: `Bearer ${token}` } });
            set({ rents: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching rents',
                loading: false
            });
        }
    },

    createRent: async (rentData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/rents`, rentData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                rents: [...state.rents, data],
                loading: false
            }));
            toast.success('Rent parameter added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error creating rent agreement',
                loading: false
            });
            return false;
        }
    },

    updateRent: async (id, rentData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/rents/${id}`, rentData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                rents: state.rents.map(r => r._id === id ? data : r),
                loading: false
            }));
            toast.success('Rent parameter updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error updating rent agreement',
                loading: false
            });
            return false;
        }
    },

    deleteRent: async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/rents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                rents: state.rents.filter(r => r._id !== id),
                loading: false
            }));
            toast.success('Rent parameter deleted successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error deleting rent agreement',
                loading: false
            });
            return false;
        }
    }
}));

export default useRentStore;
