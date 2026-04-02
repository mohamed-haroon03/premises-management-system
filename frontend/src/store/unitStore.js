import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const useUnitStore = create((set) => ({
    units: [],
    loading: false,
    error: null,

    fetchUnitsByProperty: async (propertyId) => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/units/property/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
            set({ units: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching units',
                loading: false
            });
        }
    },

    createUnit: async (unitData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/units`, unitData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                units: [...state.units, data],
                loading: false
            }));
            toast.success('Unit added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error creating unit',
                loading: false
            });
            return false;
        }
    },

    deleteUnit: async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/units/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                units: state.units.filter(u => u._id !== id),
                loading: false
            }));
            toast.success('Unit deleted successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error deleting unit',
                loading: false
            });
            return false;
        }
    },

    updateUnit: async (id, unitData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/units/${id}`, unitData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                units: state.units.map(u => u._id === id ? data : u),
                loading: false
            }));
            toast.success('Unit updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error updating unit',
                loading: false
            });
            return false;
        }
    }
}));

export default useUnitStore;
