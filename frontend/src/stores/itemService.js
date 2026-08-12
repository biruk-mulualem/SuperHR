// stores/itemService.ts
import api from './interceptor';
// ================================================================
// ITEM SERVICE
// ================================================================
class ItemService {
    // ================================================================
    // CATEGORY METHODS
    // ================================================================
    /**
     * Get all categories
     * GET /api/items/categories
     */
    async getCategories() {
        try {
            const response = await api.get('/items/categories');
            return response.data;
        }
        catch (error) {
            console.error('Get categories error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch categories'
            };
        }
    }
    /**
     * Create a new category
     * POST /api/items/categories
     */
    async createCategory(data) {
        try {
            const response = await api.post('/items/categories', data);
            return response.data;
        }
        catch (error) {
            console.error('Create category error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create category'
            };
        }
    }
    /**
     * Update a category
     * PUT /api/items/categories/:id
     */
    async updateCategory(id, data) {
        try {
            const response = await api.put(`/items/categories/${id}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update category error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update category'
            };
        }
    }
    /**
     * Delete a category
     * DELETE /api/items/categories/:id
     */
    async deleteCategory(id) {
        try {
            const response = await api.delete(`/items/categories/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete category error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete category'
            };
        }
    }
    // ================================================================
    // UOM METHODS
    // ================================================================
    /**
     * Get all UOMs
     * GET /api/items/uom
     */
    async getUOMs() {
        try {
            const response = await api.get('/items/uom');
            return response.data;
        }
        catch (error) {
            console.error('Get UOMs error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch UOMs'
            };
        }
    }
    /**
     * Create a new UOM
     * POST /api/items/uom
     */
    async createUOM(data) {
        try {
            const response = await api.post('/items/uom', data);
            return response.data;
        }
        catch (error) {
            console.error('Create UOM error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create UOM'
            };
        }
    }
    /**
     * Update a UOM
     * PUT /api/items/uom/:id
     */
    async updateUOM(id, data) {
        try {
            const response = await api.put(`/items/uom/${id}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update UOM error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update UOM'
            };
        }
    }
    /**
     * Delete a UOM
     * DELETE /api/items/uom/:id
     */
    async deleteUOM(id) {
        try {
            const response = await api.delete(`/items/uom/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete UOM error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete UOM'
            };
        }
    }
    // ================================================================
    // ITEM METHODS
    // ================================================================
    /**
     * Get all items with pagination and filtering
     * GET /api/items
     */
    async getItems(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.search)
                queryParams.append('search', params.search);
            if (params.categoryId)
                queryParams.append('categoryId', params.categoryId.toString());
            if (params.status)
                queryParams.append('status', params.status);
            if (params.uomId)
                queryParams.append('uomId', params.uomId.toString());
            if (params.sortBy)
                queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder)
                queryParams.append('sortOrder', params.sortOrder);
            const url = queryParams.toString()
                ? `/items?${queryParams.toString()}`
                : '/items';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get items error:', error);
            return {
                success: false,
                data: {
                    items: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch items'
            };
        }
    }
    /**
     * Get single item by ID
     * GET /api/items/:id
     */
    async getItemById(id) {
        try {
            const response = await api.get(`/items/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get item by ID error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch item'
            };
        }
    }
    /**
     * Get item by code
     * GET /api/items/code/:code
     */
    async getItemByCode(code) {
        try {
            const response = await api.get(`/items/code/${code}`);
            return response.data;
        }
        catch (error) {
            console.error('Get item by code error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch item'
            };
        }
    }
    /**
     * Get active items only
     * GET /api/items/active
     */
    async getActiveItems() {
        try {
            const response = await api.get('/items/active');
            return response.data;
        }
        catch (error) {
            console.error('Get active items error:', error);
            return {
                success: false,
                data: { items: [], total: 0 },
                error: error.response?.data?.error || 'Failed to fetch active items'
            };
        }
    }
    /**
     * Get items by category
     * GET /api/items/category/:categoryId
     */
    async getItemsByCategory(categoryId) {
        try {
            const response = await api.get(`/items/category/${categoryId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get items by category error:', error);
            return {
                success: false,
                data: { category: {}, items: [], total: 0 },
                error: error.response?.data?.error || 'Failed to fetch items by category'
            };
        }
    }
    /**
     * Search items
     * GET /api/items/search
     */
    async searchItems(query) {
        try {
            const response = await api.get(`/items/search?q=${encodeURIComponent(query)}`);
            return response.data;
        }
        catch (error) {
            console.error('Search items error:', error);
            return {
                success: false,
                data: { items: [], total: 0, searchTerm: query },
                error: error.response?.data?.error || 'Failed to search items'
            };
        }
    }
    /**
     * Get item statistics
     * GET /api/items/statistics
     */
    async getStats() {
        try {
            const response = await api.get('/items/statistics');
            return response.data;
        }
        catch (error) {
            console.error('Get item stats error:', error);
            return {
                success: false,
                data: {
                    total: 0,
                    active: 0,
                    inactive: 0,
                    discontinued: 0,
                    byCategory: []
                },
                error: error.response?.data?.error || 'Failed to fetch statistics'
            };
        }
    }
    /**
     * Generate next item code
     * GET /api/items/generate-code
     */
    async generateItemCode() {
        try {
            const response = await api.get('/items/generate-code');
            return response.data;
        }
        catch (error) {
            console.error('Generate item code error:', error);
            return {
                success: false,
                data: { code: '' },
                error: error.response?.data?.error || 'Failed to generate code'
            };
        }
    }
    /**
     * Create a new item
     * POST /api/items
     */
    async createItem(itemData) {
        try {
            const response = await api.post('/items', itemData);
            return response.data;
        }
        catch (error) {
            console.error('Create item error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to create item'
            };
        }
    }
    /**
     * Update an item
     * PUT /api/items/:id
     */
    async updateItem(id, itemData) {
        try {
            const response = await api.put(`/items/${id}`, itemData);
            return response.data;
        }
        catch (error) {
            console.error('Update item error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to update item'
            };
        }
    }
    /**
     * Update item status
     * PATCH /api/items/:id/status
     */
    async updateItemStatus(id, status) {
        try {
            const response = await api.patch(`/items/${id}/status`, { status });
            return response.data;
        }
        catch (error) {
            console.error('Update item status error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to update status'
            };
        }
    }
    /**
     * Activate an item
     * PATCH /api/items/:id/activate
     */
    async activateItem(id) {
        try {
            const response = await api.patch(`/items/${id}/activate`);
            return response.data;
        }
        catch (error) {
            console.error('Activate item error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to activate item'
            };
        }
    }
    /**
     * Deactivate an item
     * PATCH /api/items/:id/deactivate
     */
    async deactivateItem(id) {
        try {
            const response = await api.patch(`/items/${id}/deactivate`);
            return response.data;
        }
        catch (error) {
            console.error('Deactivate item error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to deactivate item'
            };
        }
    }
    /**
     * Soft delete an item (set status to Discontinued)
     * DELETE /api/items/:id
     */
    async deleteItem(id) {
        try {
            const response = await api.delete(`/items/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete item error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete item'
            };
        }
    }
    /**
     * Permanently delete an item
     * DELETE /api/items/:id/permanent
     */
    async permanentDeleteItem(id) {
        try {
            const response = await api.delete(`/items/${id}/permanent`);
            return response.data;
        }
        catch (error) {
            console.error('Permanent delete item error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to permanently delete item'
            };
        }
    }
    /**
     * Upload item specification PDF
     * POST /api/items/:id/upload-specification
     */
    async uploadSpecification(id, file) {
        try {
            const formData = new FormData();
            formData.append('specification', file);
            const response = await api.post(`/items/${id}/upload-specification`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Upload specification error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to upload specification'
            };
        }
    }
    /**
     * Remove item specification PDF
     * DELETE /api/items/:id/remove-specification
     */
    async removeSpecification(id) {
        try {
            const response = await api.delete(`/items/${id}/remove-specification`);
            return response.data;
        }
        catch (error) {
            console.error('Remove specification error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to remove specification'
            };
        }
    }
    /**
     * Bulk create items
     * POST /api/items/bulk
     */
    async bulkCreateItems(itemsData) {
        try {
            const response = await api.post('/items/bulk', { items: itemsData });
            return response.data;
        }
        catch (error) {
            console.error('Bulk create items error:', error);
            return {
                success: false,
                message: 'Failed to create items',
                data: {
                    created: [],
                    failed: [],
                    total: 0
                }
            };
        }
    }
    /**
     * Import items from CSV data
     * POST /api/items/import
     */
    async importItems(itemsData) {
        try {
            const response = await api.post('/items/import', { items: itemsData });
            return response.data;
        }
        catch (error) {
            console.error('Import items error:', error);
            return {
                success: false,
                message: 'Failed to import items',
                data: {
                    results: [],
                    total: 0,
                    success: 0,
                    failed: 0
                }
            };
        }
    }
    /**
     * Export items as CSV data (JSON response)
     * GET /api/items/export
     * @deprecated Use exportItemsFile for file download
     */
    async exportItems(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.categoryId)
                queryParams.append('categoryId', params.categoryId.toString());
            if (params?.status)
                queryParams.append('status', params.status);
            const url = queryParams.toString()
                ? `/items/export?${queryParams.toString()}`
                : '/items/export';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Export items error:', error);
            return {
                success: false,
                data: [],
                total: 0,
                error: error.response?.data?.error || 'Failed to export items'
            };
        }
    }
    /**
     * Export items as file (Excel or CSV)
     * GET /api/items/export
     * Returns a Blob for file download
     */
    async exportItemsFile(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.categoryId)
                queryParams.append('categoryId', params.categoryId.toString());
            if (params?.status)
                queryParams.append('status', params.status);
            if (params?.format)
                queryParams.append('format', params.format);
            else
                queryParams.append('format', 'xlsx');
            const url = queryParams.toString()
                ? `/items/export?${queryParams.toString()}`
                : '/items/export';
            const response = await api.get(url, {
                responseType: 'blob',
            });
            return response.data;
        }
        catch (error) {
            console.error('Export items file error:', error);
            throw new Error(error.response?.data?.error || 'Failed to export items');
        }
    }
    /**
     * Download exported file with proper filename
     * GET /api/items/export
     */
    async downloadExport(params) {
        try {
            const blob = await this.exportItemsFile(params);
            // Get filename from content-disposition or generate one
            const ext = params?.format === 'csv' ? 'csv' : 'xlsx';
            const filename = `items_export_${new Date().toISOString().split('T')[0]}.${ext}`;
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return { success: true };
        }
        catch (error) {
            console.error('Download export error:', error);
            return {
                success: false,
                error: error.message || 'Failed to download export'
            };
        }
    }
    // ================================================================
    // HELPER METHODS
    // ================================================================
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }
    /**
     * Format date
     */
    formatDate(date) {
        if (!date)
            return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime()))
            return 'N/A';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Get conversion display
     */
    getConversionDisplay(item) {
        if (!item)
            return '';
        if (item.conversionUom && item.conversionValue > 0) {
            return `${item.conversionValue} ${item.conversionUom.code} = 1 ${item.uom?.code || ''}`;
        }
        return `1 ${item.uom?.code || ''} = 1 ${item.uom?.code || ''}`;
    }
    /**
     * Check if item is active
     */
    isItemActive(item) {
        return item.status === 'Active';
    }
    /**
     * Get status badge color
     */
    getStatusColor(status) {
        switch (status) {
            case 'Active':
                return 'green';
            case 'Inactive':
                return 'yellow';
            case 'Discontinued':
                return 'red';
            default:
                return 'gray';
        }
    }
}
export default new ItemService();
