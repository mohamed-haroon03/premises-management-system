import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const useTenantStore = create((set) => ({
    tenants: [],
    loading: false,
    error: null,

    fetchTenants: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/tenants`, { headers: { Authorization: `Bearer ${token}` } });
            set({ tenants: data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error fetching tenants',
                loading: false
            });
        }
    },

    createTenant: async (tenantData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/tenants`, tenantData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                tenants: [...state.tenants, data],
                loading: false
            }));
            toast.success('Tenant added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error creating tenant',
                loading: false
            });
            return false;
        }
    },

    updateTenant: async (id, tenantData) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/tenants/${id}`, tenantData, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                tenants: state.tenants.map(t => t._id === id ? data : t),
                loading: false
            }));
            toast.success('Tenant updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error updating tenant',
                loading: false
            });
            return false;
        }
    },

    deleteTenant: async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            set((state) => ({
                tenants: state.tenants.filter(t => t._id !== id),
                loading: false
            }));
            toast.success('Tenant deleted successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Error deleting tenant',
                loading: false
            });
            return false;
        }
    }
}));

export default useTenantStore;
