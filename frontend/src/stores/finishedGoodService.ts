// stores/finishedGoodService.ts
import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface FinishedGood {
    id: number;
    fgCode: string;
    name: string;
    type: 'Paint' | 'Fiber';
    status: 'Active' | 'Inactive' | 'Discontinued';
    createdBy?: number;
    updatedBy?: number;
    createdByUser?: User;
    updatedByUser?: User;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    userId: number;
    username: string;
    fullName: string;
    email?: string;
}

export interface FinishedGoodFilters {
    type?: 'Paint' | 'Fiber';
    status?: 'Active' | 'Inactive' | 'Discontinued';
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateFinishedGoodPayload {
    name: string;
    type: 'Paint' | 'Fiber';
    status?: 'Active' | 'Inactive' | 'Discontinued';
}

export interface UpdateFinishedGoodPayload {
    name?: string;
    type?: 'Paint' | 'Fiber';
    status?: 'Active' | 'Inactive' | 'Discontinued';
}

export interface FinishedGoodStats {
    total: number;
    paint: number;
    fiber: number;
    active: number;
    inactive: number;
    discontinued: number;
}

export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface NextFgCodeResponse {
    success: boolean;
    data: {
        fgCode: string;
    };
}

// ============================================
// FINISHED GOOD SERVICE CLASS
// ============================================

class FinishedGoodService {
    // ================================================================
    // CRUD OPERATIONS
    // ================================================================

    /**
     * Get all finished goods with filters and pagination
     */
    async getFinishedGoods(filters: FinishedGoodFilters = {}): Promise<PaginatedResponse<FinishedGood>> {
        const params = new URLSearchParams();
        
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        
        const response = await api.get(`/finished-goods?${params.toString()}`);
        return response.data;
    }

    /**
     * Get finished good by ID
     */
    async getFinishedGoodById(id: number): Promise<{ success: boolean; data: FinishedGood }> {
        const response = await api.get(`/finished-goods/${id}`);
        return response.data;
    }

    /**
     * Create a new finished good
     */
    async createFinishedGood(payload: CreateFinishedGoodPayload): Promise<{ 
        success: boolean; 
        message: string; 
        data: FinishedGood 
    }> {
        const response = await api.post('/finished-goods', payload);
        return response.data;
    }

    /**
     * Update a finished good
     */
    async updateFinishedGood(id: number, payload: UpdateFinishedGoodPayload): Promise<{ 
        success: boolean; 
        message: string; 
        data: FinishedGood 
    }> {
        const response = await api.put(`/finished-goods/${id}`, payload);
        return response.data;
    }

    /**
     * Delete a finished good
     */
    async deleteFinishedGood(id: number): Promise<{ success: boolean; message: string }> {
        const response = await api.delete(`/finished-goods/${id}`);
        return response.data;
    }

    // ================================================================
    // BULK IMPORT
    // ================================================================

    /**
     * Import finished goods from CSV file
     */
    async importFinishedGoods(file: File): Promise<{ 
        success: boolean; 
        message: string; 
        data: ImportResult 
    }> {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/finished-goods/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 120000 // 2 minutes for large imports
        });
        return response.data;
    }

    // ================================================================
    // UTILITY ENDPOINTS
    // ================================================================

    /**
     * Get next FG code (for preview)
     */
    async getNextFgCode(): Promise<NextFgCodeResponse> {
        const response = await api.get('/finished-goods/next-code');
        return response.data;
    }

    /**
     * Get statistics
     */
    async getStats(): Promise<{ success: boolean; data: FinishedGoodStats }> {
        const response = await api.get('/finished-goods/stats');
        return response.data;
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    /**
     * Get status label with icon
     */
    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive',
            'Discontinued': '🚫 Discontinued'
        };
        return labels[status] || status;
    }

    /**
     * Get status class for styling
     */
    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'Active': 'active',
            'Inactive': 'inactive',
            'Discontinued': 'discontinued'
        };
        return classes[status] || '';
    }

    /**
     * Get type label with icon
     */
    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'Paint': '🎨 Paint',
            'Fiber': '🧵 Fiber'
        };
        return labels[type] || type;
    }

    /**
     * Get type class for styling
     */
    getTypeClass(type: string): string {
        const classes: Record<string, string> = {
            'Paint': 'paint',
            'Fiber': 'fiber'
        };
        return classes[type] || '';
    }

    /**
     * Get status color
     */
    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'Active': '#16a34a',      // Green
            'Inactive': '#dc2626',     // Red
            'Discontinued': '#64748b'  // Gray
        };
        return colors[status] || '#94a3b8';
    }

    /**
     * Get type color
     */
    getTypeColor(type: string): string {
        const colors: Record<string, string> = {
            'Paint': '#3b82f6',        // Blue
            'Fiber': '#8b5cf6'         // Purple
        };
        return colors[type] || '#94a3b8';
    }

    /**
     * Format FG code for display
     */
    formatFgCode(fgCode: string): string {
        return fgCode || 'N/A';
    }

    /**
     * Check if finished good is active
     */
    isActive(finishedGood: FinishedGood): boolean {
        return finishedGood.status === 'Active';
    }

    /**
     * Check if finished good is inactive
     */
    isInactive(finishedGood: FinishedGood): boolean {
        return finishedGood.status === 'Inactive';
    }

    /**
     * Check if finished good is discontinued
     */
    isDiscontinued(finishedGood: FinishedGood): boolean {
        return finishedGood.status === 'Discontinued';
    }

    /**
     * Get available statuses for dropdown
     */
    getStatusOptions(): { value: string; label: string }[] {
        return [
            { value: 'Active', label: '✅ Active' },
            { value: 'Inactive', label: '⏸️ Inactive' },
            { value: 'Discontinued', label: '🚫 Discontinued' }
        ];
    }

    /**
     * Get available types for dropdown
     */
    getTypeOptions(): { value: string; label: string }[] {
        return [
            { value: 'Paint', label: '🎨 Paint' },
            { value: 'Fiber', label: '🧵 Fiber' }
        ];
    }

    /**
     * Get status badge HTML class
     */
    getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            'Active': 'badge-success',
            'Inactive': 'badge-danger',
            'Discontinued': 'badge-secondary'
        };
        return classes[status] || 'badge-secondary';
    }

    /**
     * Get type badge HTML class
     */
    getTypeBadgeClass(type: string): string {
        const classes: Record<string, string> = {
            'Paint': 'badge-primary',
            'Fiber': 'badge-purple'
        };
        return classes[type] || 'badge-secondary';
    }

    /**
     * Check if a product name already exists (for validation)
     */
    async checkNameExists(name: string): Promise<boolean> {
        try {
            const response = await this.getFinishedGoods({ search: name, limit: 1 });
            if (response.success && response.data.length > 0) {
                return response.data.some(item => 
                    item.name.toLowerCase() === name.toLowerCase()
                );
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Validate product data before sending to API
     */
    validateProductData(data: CreateFinishedGoodPayload): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Product name is required');
        }

        if (!data.type || !['Paint', 'Fiber'].includes(data.type)) {
            errors.push('Product type must be Paint or Fiber');
        }

        if (data.status && !['Active', 'Inactive', 'Discontinued'].includes(data.status)) {
            errors.push('Status must be Active, Inactive, or Discontinued');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Prepare CSV template for download
     */
    getCsvTemplate(): string {
        const headers = ['productName', 'productType', 'status'];
        const sampleData = [
            ['Gloss White Paint', 'Paint', 'Active'],
            ['Matte Blue Paint', 'Paint', 'Active'],
            ['Water Tanker 1000L', 'Fiber', 'Active'],
            ['Water Tanker 5000L', 'Fiber', 'Active']
        ];
        
        let csv = headers.join(',') + '\n';
        sampleData.forEach(row => {
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }

    /**
     * Download CSV template
     */
    downloadTemplate(): void {
        const csv = this.getCsvTemplate();
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finished_goods_import_template_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Parse CSV file content
     */
    parseCsvContent(content: string): { productName: string; productType: string; status: string }[] {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must contain headers and at least one data row');
        }

        const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['productname', 'producttype'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const results: { productName: string; productType: string; status: string }[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) {
                continue;
            }
            const values = line.split(',').map(v => v.trim());
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => {
                obj[h] = values[idx] || '';
            });

            if (!obj.productname || !obj.producttype) {
                continue;
            }

            const productType = obj.producttype.charAt(0).toUpperCase() + obj.producttype.slice(1).toLowerCase();
            if (productType !== 'Paint' && productType !== 'Fiber') {
                continue;
            }

            const status = obj.status ? obj.status.charAt(0).toUpperCase() + obj.status.slice(1).toLowerCase() : 'Active';
            if (!['Active', 'Inactive', 'Discontinued'].includes(status)) {
                continue;
            }

            results.push({
                productName: obj.productname,
                productType: productType,
                status: status
            });
        }

        if (results.length === 0) {
            throw new Error('No valid data found in CSV file');
        }

        return results;
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new FinishedGoodService();