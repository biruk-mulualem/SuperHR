// stores/storeToStoreRelationshipService.ts
import api from './interceptor';
// ================================================================
// STORE-TO-STORE RELATIONSHIP SERVICE
// ================================================================
class StoreToStoreRelationshipService {
    // ================================================================
    // CRUD OPERATIONS
    // ================================================================
    /**
     * Get all relationships with pagination and filtering
     * GET /api/store-to-store-relationships
     */
    async getRelationships(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.search)
                queryParams.append('search', params.search);
            if (params.status && params.status !== 'all')
                queryParams.append('status', params.status);
            if (params.storeId && params.storeId !== 'all')
                queryParams.append('storeId', params.storeId.toString());
            if (params.sortBy)
                queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder)
                queryParams.append('sortOrder', params.sortOrder);
            const url = queryParams.toString()
                ? `/store-to-store-relationships?${queryParams.toString()}`
                : '/store-to-store-relationships';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get relationships error:', error);
            return {
                success: false,
                data: {
                    relationships: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch relationships'
            };
        }
    }
    /**
     * Get single relationship by ID
     * GET /api/store-to-store-relationships/:id
     */
    async getRelationshipById(id) {
        try {
            const response = await api.get(`/store-to-store-relationships/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get relationship by ID error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch relationship'
            };
        }
    }
    /**
     * Generate next relationship code
     * GET /api/store-to-store-relationships/generate-code
     */
    async generateRelationshipCode() {
        try {
            const response = await api.get('/store-to-store-relationships/generate-code');
            return response.data;
        }
        catch (error) {
            console.error('Generate relationship code error:', error);
            return {
                success: false,
                data: { code: '' },
                error: error.response?.data?.error || 'Failed to generate code'
            };
        }
    }
    /**
     * Create a new relationship
     * POST /api/store-to-store-relationships
     */
    async createRelationship(data) {
        try {
            const response = await api.post('/store-to-store-relationships', data);
            return response.data;
        }
        catch (error) {
            console.error('Create relationship error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to create relationship'
            };
        }
    }
    /**
     * Update a relationship
     * PUT /api/store-to-store-relationships/:id
     */
    async updateRelationship(id, data) {
        try {
            const response = await api.put(`/store-to-store-relationships/${id}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update relationship error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to update relationship'
            };
        }
    }
    /**
     * Update relationship status
     * PATCH /api/store-to-store-relationships/:id/status
     */
    async updateRelationshipStatus(id, status) {
        try {
            const response = await api.patch(`/store-to-store-relationships/${id}/status`, { status });
            return response.data;
        }
        catch (error) {
            console.error('Update relationship status error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to update status'
            };
        }
    }
    /**
     * Soft delete a relationship (set status to inactive)
     * DELETE /api/store-to-store-relationships/:id
     */
    async deleteRelationship(id) {
        try {
            const response = await api.delete(`/store-to-store-relationships/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete relationship error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete relationship'
            };
        }
    }
    /**
     * Permanently delete a relationship
     * DELETE /api/store-to-store-relationships/:id/permanent
     */
    async permanentDeleteRelationship(id) {
        try {
            const response = await api.delete(`/store-to-store-relationships/${id}/permanent`);
            return response.data;
        }
        catch (error) {
            console.error('Permanent delete relationship error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to permanently delete relationship'
            };
        }
    }
    // ================================================================
    // STATISTICS & EXPORT
    // ================================================================
    /**
     * Get relationship statistics
     * GET /api/store-to-store-relationships/statistics
     */
    async getRelationshipStatistics() {
        try {
            const response = await api.get('/store-to-store-relationships/statistics');
            return response.data;
        }
        catch (error) {
            console.error('Get relationship statistics error:', error);
            return {
                success: false,
                data: {
                    overview: {
                        total: 0,
                        active: 0,
                        inactive: 0
                    },
                    bySourceStore: [],
                    byTargetStore: []
                },
                error: error.response?.data?.error || 'Failed to fetch statistics'
            };
        }
    }
    /**
     * Export relationships as CSV data
     * GET /api/store-to-store-relationships/export
     */
    async exportRelationships(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.status && params.status !== 'all')
                queryParams.append('status', params.status);
            if (params?.storeId && params.storeId !== 'all')
                queryParams.append('storeId', params.storeId.toString());
            const url = queryParams.toString()
                ? `/store-to-store-relationships/export?${queryParams.toString()}`
                : '/store-to-store-relationships/export';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Export relationships error:', error);
            return {
                success: false,
                data: [],
                total: 0,
                error: error.response?.data?.error || 'Failed to export relationships'
            };
        }
    }
    // ================================================================
    // HELPER METHODS
    // ================================================================
    /**
     * Get status color for badges
     */
    getStatusColor(status) {
        return status === 'active' ? 'green' : 'yellow';
    }
    /**
     * Check if relationship is active
     */
    isActive(relationship) {
        return relationship.status === 'active';
    }
    /**
     * Get display name for relationship
     */
    getDisplayName(relationship) {
        const source = relationship.sourceStore?.name || 'Unknown';
        const target = relationship.targetStore?.name || 'Unknown';
        return `${source} ➡️ ${target}`;
    }
    /**
     * Get full description with code
     */
    getFullDescription(relationship) {
        return `${relationship.code}: ${relationship.description || 'No description'}`;
    }
    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString)
            return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Get store name from relationship
     */
    getStoreName(relationship, type) {
        if (type === 'source') {
            return relationship.sourceStore?.name || 'Unknown';
        }
        return relationship.targetStore?.name || 'Unknown';
    }
}
export default new StoreToStoreRelationshipService();
