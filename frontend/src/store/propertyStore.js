import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const usePropertyStore = create((set, get) => ({
    properties: [],
    activeProperty: null,
    loading: false,
    error: null,

    fetchProperties: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/properties`, { headers: { Authorization: `Bearer ${token}` } });
            set({ properties: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching properties',
                loading: false
            });
        }
    },

    fetchPropertyById: async (id) => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set({ activeProperty: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching property details',
                loading: false
            });
        }
    },

    createProperty: async (propertyData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/properties`, propertyData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                properties: [...state.properties, data],
                loading: false
            }));
            toast.success('Property added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error creating property',
                loading: false
            });
            return false;
        }
    },

    updateProperty: async (id, propertyData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/properties/${id}`, propertyData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                properties: state.properties.map(p => p._id === id ? data : p),
                loading: false
            }));
            toast.success('Property updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error updating property',
                loading: false
            });
            return false;
        }
    },

    deleteProperty: async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                properties: state.properties.filter(p => p._id !== id),
                loading: false
            }));
            toast.success('Property deleted successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error deleting property',
                loading: false
            });
            return false;
        }
    }
}));

export default usePropertyStore;
