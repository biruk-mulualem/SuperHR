// stores/storeService.js
import api from './interceptor';
// ================================================================
// STORE SERVICE
// ================================================================
class StoreService {
    // ================================================================
    // STORE CRUD OPERATIONS
    // ================================================================
    /**
     * Get all stores with pagination and filtering
     * GET /api/stores
     */
    async getStores(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.search)
                queryParams.append('search', params.search);
            if (params.status)
                queryParams.append('status', params.status);
            if (params.location)
                queryParams.append('location', params.location);
            if (params.sortBy)
                queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder)
                queryParams.append('sortOrder', params.sortOrder);
            const url = queryParams.toString()
                ? `/stores?${queryParams.toString()}`
                : '/stores';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get stores error:', error);
            return {
                success: false,
                data: {
                    stores: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch stores'
            };
        }
    }
    /**
     * Get single store by ID
     * GET /api/stores/:id
     */
    async getStoreById(id) {
        try {
            const response = await api.get(`/stores/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get store by ID error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch store'
            };
        }
    }
    /**
     * Get store by code
     * GET /api/stores/code/:code
     */
    async getStoreByCode(code) {
        try {
            const response = await api.get(`/stores/code/${code}`);
            return response.data;
        }
        catch (error) {
            console.error('Get store by code error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch store'
            };
        }
    }
    /**
     * Generate next store code
     * GET /api/stores/generate-code
     */
    async generateStoreCode() {
        try {
            const response = await api.get('/stores/generate-code');
            return response.data;
        }
        catch (error) {
            console.error('Generate store code error:', error);
            return {
                success: false,
                data: { code: '' },
                error: error.response?.data?.error || 'Failed to generate code'
            };
        }
    }
    /**
     * Create a new store
     * POST /api/stores
     */
    async createStore(storeData) {
        try {
            const response = await api.post('/stores', storeData);
            return response.data;
        }
        catch (error) {
            console.error('Create store error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to create store'
            };
        }
    }
    /**
     * Update a store
     * PUT /api/stores/:id
     */
    async updateStore(id, storeData) {
        try {
            const response = await api.put(`/stores/${id}`, storeData);
            return response.data;
        }
        catch (error) {
            console.error('Update store error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to update store'
            };
        }
    }
    /**
     * Update store status
     * PATCH /api/stores/:id/status
     */
    async updateStoreStatus(id, status) {
        try {
            const response = await api.patch(`/stores/${id}/status`, { status });
            return response.data;
        }
        catch (error) {
            console.error('Update store status error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to update status'
            };
        }
    }
    /**
     * Soft delete a store (set status to Closed)
     * DELETE /api/stores/:id
     */
    async deleteStore(id) {
        try {
            const response = await api.delete(`/stores/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete store error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete store'
            };
        }
    }
    /**
     * Permanently delete a store
     * DELETE /api/stores/:id/permanent
     */
    async permanentDeleteStore(id) {
        try {
            const response = await api.delete(`/stores/${id}/permanent`);
            return response.data;
        }
        catch (error) {
            console.error('Permanent delete store error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to permanently delete store'
            };
        }
    }
    // ================================================================
    // STORE-GROUP RELATIONSHIP OPERATIONS
    // ================================================================
    /**
     * Get available groups for a store (for dropdown)
     * GET /api/stores/:storeId/available-groups
     */
    async getAvailableGroupsForStore(storeId) {
        try {
            const id = storeId || 0;
            const response = await api.get(`/stores/${id}/available-groups`);
            return response.data;
        }
        catch (error) {
            console.error('Get available groups error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch available groups'
            };
        }
    }
    /**
     * Get all groups (for dropdown)
     * GET /api/stores/groups
     */
    async getAllGroups() {
        try {
            const response = await api.get('/stores/groups');
            return response.data;
        }
        catch (error) {
            console.error('Get all groups error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch groups'
            };
        }
    }
    /**
     * Get all groups assigned to a store
     * GET /api/stores/:storeId/groups
     */
    async getStoreGroups(storeId) {
        try {
            const response = await api.get(`/stores/${storeId}/groups`);
            return response.data;
        }
        catch (error) {
            console.error('Get store groups error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch store groups'
            };
        }
    }
    /**
     * Add group to store
     * POST /api/stores/:storeId/groups/:groupId
     */
    async addGroupToStore(storeId, groupId) {
        try {
            const response = await api.post(`/stores/${storeId}/groups/${groupId}`);
            return response.data;
        }
        catch (error) {
            console.error('Add group to store error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to add group to store'
            };
        }
    }
    /**
     * Remove group from store
     * DELETE /api/stores/:storeId/groups/:groupId
     */
    async removeGroupFromStore(storeId, groupId) {
        try {
            const response = await api.delete(`/stores/${storeId}/groups/${groupId}`);
            return response.data;
        }
        catch (error) {
            console.error('Remove group from store error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to remove group from store'
            };
        }
    }
    // ================================================================
    // USER OPERATIONS (FOR DROPDOWN)
    // ================================================================
    /**
     * Get all users (for dropdown)
     * GET /api/stores/users
     */
    async getAllUsers() {
        try {
            const response = await api.get('/stores/users');
            return response.data;
        }
        catch (error) {
            console.error('Get all users error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch users'
            };
        }
    }
    // ================================================================
    // STATISTICS & EXPORT
    // ================================================================
    /**
     * Get store statistics
     * GET /api/stores/statistics
     */
    async getStoreStatistics() {
        try {
            const response = await api.get('/stores/statistics');
            return response.data;
        }
        catch (error) {
            console.error('Get store statistics error:', error);
            return {
                success: false,
                data: {
                    stores: {
                        total: 0,
                        active: 0,
                        inactive: 0,
                        closed: 0
                    },
                    groups: {
                        total: 0,
                        active: 0,
                        inactive: 0
                    },
                    relations: {
                        storeGroup: 0,
                        userGroup: 0,
                        usersInGroups: 0
                    },
                    topStores: [],
                    locationStats: []
                },
                error: error.response?.data?.error || 'Failed to fetch statistics'
            };
        }
    }
    /**
     * Export stores as CSV data
     * GET /api/stores/export
     */
    async exportStores(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.status)
                queryParams.append('status', params.status);
            if (params?.location)
                queryParams.append('location', params.location);
            const url = queryParams.toString()
                ? `/stores/export?${queryParams.toString()}`
                : '/stores/export';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Export stores error:', error);
            return {
                success: false,
                data: [],
                total: 0,
                error: error.response?.data?.error || 'Failed to export stores'
            };
        }
    }
    // ================================================================
    // HELPER METHODS
    // ================================================================
    /**
     * Get total users across all groups in a store
     */
    getTotalUsers(store) {
        let count = 0;
        store.groups?.forEach(group => {
            count += group.users?.length || 0;
        });
        return count;
    }
    /**
     * Get store status color for badges
     */
    getStatusColor(status) {
        switch (status) {
            case 'Active':
                return 'green';
            case 'Inactive':
                return 'yellow';
            case 'Closed':
                return 'red';
            default:
                return 'gray';
        }
    }
    /**
     * Format store location display
     */
    formatLocation(store) {
        return store.location || '-';
    }
    /**
     * Check if store has groups
     */
    hasGroups(store) {
        return store.groups && store.groups.length > 0;
    }
    /**
     * Get group names as comma-separated string
     */
    getGroupNames(store) {
        if (!store.groups || store.groups.length === 0) {
            return 'No groups';
        }
        return store.groups.map(g => g.name).join(', ');
    }
    /**
     * Get group count
     */
    getGroupCount(store) {
        return store.groups?.length || 0;
    }
    /**
     * Check if store is active
     */
    isStoreActive(store) {
        return store.status === 'Active';
    }
    /**
     * Format store code with styling
     */
    formatStoreCode(store) {
        return store.code || '';
    }
    /**
     * Get store display name with location
     */
    getStoreDisplayName(store) {
        if (store.location) {
            return `${store.name} (${store.location})`;
        }
        return store.name;
    }
    /**
     * Get user count for a specific group
     */
    getGroupUserCount(group) {
        return group.users?.length || 0;
    }
    /**
     * Check if a group is assigned to a store
     */
    isGroupAssignedToStore(store, groupId) {
        return store.groups?.some(g => g.id === groupId) || false;
    }
    /**
     * Get available groups for a store (not yet assigned)
     */
    getAvailableGroupsForStoreFromList(store, allGroups) {
        const assignedGroupIds = store.groups?.map(g => g.id) || [];
        return allGroups.filter(g => !assignedGroupIds.includes(g.id));
    }
    /**
     * Sort stores by name
     */
    sortStoresByName(stores, ascending = true) {
        return [...stores].sort((a, b) => {
            if (ascending) {
                return a.name.localeCompare(b.name);
            }
            return b.name.localeCompare(a.name);
        });
    }
    /**
     * Filter stores by status
     */
    filterStoresByStatus(stores, status) {
        if (!status)
            return stores;
        return stores.filter(store => store.status === status);
    }
    /**
     * Filter stores by location
     */
    filterStoresByLocation(stores, location) {
        if (!location)
            return stores;
        return stores.filter(store => store.location === location);
    }
    /**
     * Search stores by term
     */
    searchStores(stores, term) {
        if (!term)
            return stores;
        const lowerTerm = term.toLowerCase();
        return stores.filter(store => store.name.toLowerCase().includes(lowerTerm) ||
            store.code.toLowerCase().includes(lowerTerm) ||
            store.location?.toLowerCase().includes(lowerTerm));
    }
    /**
     * Get unique locations from stores
     */
    getUniqueLocations(stores) {
        const locations = new Set();
        stores.forEach(store => {
            if (store.location) {
                locations.add(store.location);
            }
        });
        return Array.from(locations).sort();
    }
    /**
     * Get status distribution
     */
    getStatusDistribution(stores) {
        const distribution = new Map();
        stores.forEach(store => {
            const status = store.status || 'Active';
            distribution.set(status, (distribution.get(status) || 0) + 1);
        });
        return Array.from(distribution.entries()).map(([status, count]) => ({
            status,
            count
        }));
    }
}
export default new StoreService();
