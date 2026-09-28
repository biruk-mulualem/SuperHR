// stores/formulationService.ts
import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface User {
    userId: number;
    username: string;
    fullName: string;
    email?: string;
}

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

export interface UOM {
    uomId: number;
    id: number;
    code: string;
    name: string;
}

export interface Item {
    itemId: number;
    id: number;
    code: string;
    name: string;
    costPrice: number;
    conversionUomId?: number;
    conversionValue?: number;
    conversionUom?: UOM;
    conversionUomCode?: string;
}

export interface FormulationDetail {
    id: number;
    formulationId: number;
    itemId: number;
    quantity: number;
    itemCode?: string;
    itemName?: string;
    itemCostPrice?: number;
    conversionUomId?: number;
    conversionValue?: number;
    totalCost?: number;
    item?: Item;
    conversionUomCode?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Formulation {
    id: number;
    finishedGoodId: number;
    fgCode: string;
    productName: string;
    productType: 'Paint' | 'Fiber';
    status: 'Draft' | 'Active' | 'Inactive';
    description: string;
    version: number;
    isActive: boolean;
    rawMaterials: FormulationDetail[];
    totalRawMaterials: number;
    totalCost: number;
    createdBy?: number;
    updatedBy?: number;
    createdByUser?: User;
    updatedByUser?: User;
    createdAt: string;
    updatedAt: string;
    formattedCreatedAt?: string;
    formattedUpdatedAt?: string;
    isDraft?: boolean;
    isInactive?: boolean;
    displayName?: string;
    statusColor?: string;
    typeColor?: string;
}

export interface FormulationFilters {
    search?: string;
    status?: 'Draft' | 'Active' | 'Inactive';
    productType?: 'Paint' | 'Fiber';
    finishedGoodId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface CreateFormulationPayload {
    finishedGoodId: number;
    status?: 'Draft' | 'Active' | 'Inactive';
    description?: string;
    rawMaterials: {
        itemId: number;
        quantity: number;
        uomId: number;
    }[];
}

export interface UpdateFormulationPayload {
    finishedGoodId?: number;
    status?: 'Draft' | 'Active' | 'Inactive';
    description?: string;
    rawMaterials?: {
        itemId: number;
        quantity: number;
        uomId: number;
    }[];
}

export interface FormulationStats {
    total: number;
    active: number;
    draft: number;
    inactive: number;
    uniqueMaterials: number;
    paintCount: number;
    fiberCount: number;
    totalCost: number;
    totalMaterialsUsed: number;
}

export interface FormulationVersion {
    id: number;
    version: number;
    status: string;
    description: string;
    totalMaterials: number;
    createdAt: string;
    createdBy: string;
    isLatest: boolean;
}

export interface FormulationVersionResponse {
    success: boolean;
    data: FormulationVersion[];
    finishedGood: {
        id: number;
        fgCode: string;
        name: string;
        type: string;
    };
}

export interface PaginatedResponse<T> {
    message: string;
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters?: {
        search: string | null;
        status: string | null;
        productType: string | null;
        finishedGoodId: string | null;
    };
}

export interface FormulationMaterialsResponse {
    success: boolean;
    data: FormulationDetail[];
    total: number;
    totalCost: number;
}

export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
    created?: number[];
}

export interface ImportPayload {
    formulations: {
        finishedGoodId: number;
        status?: string;
        description?: string;
        rawMaterials: {
            itemId: number;
            quantity: number;
            uomId: number;
        }[];
    }[];
}

export interface StatusUpdateResponse {
    success: boolean;
    message: string;
    data: {
        id: number;
        status: string;
        previousStatus: string;
    };
}

// ============================================
// FORMULATION SERVICE CLASS
// ============================================

class FormulationService {
    // ================================================================
    // CRUD OPERATIONS
    // ================================================================

    async getFormulations(filters: FormulationFilters = {}): Promise<PaginatedResponse<Formulation>> {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.productType) params.append('productType', filters.productType);
        if (filters.finishedGoodId) params.append('finishedGoodId', filters.finishedGoodId);
        if (filters.page) params.append('page', filters.page?.toString() || '1');
        if (filters.limit) params.append('limit', filters.limit?.toString() || '20');
        if (filters.sortBy) params.append('sortBy', filters.sortBy || 'createdAt');
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder || 'DESC');
        
        const response = await api.get(`/formulations?${params.toString()}`);
        return response.data;
    }

    async getFormulationById(id: number): Promise<{ success: boolean; data: Formulation }> {
        const response = await api.get(`/formulations/${id}`);
        return response.data;
    }

    async createFormulation(payload: CreateFormulationPayload): Promise<{
        success: boolean;
        message: string;
        data: Formulation;
    }> {
        const response = await api.post('/formulations', payload);
        return response.data;
    }

    async updateFormulation(id: number, payload: UpdateFormulationPayload): Promise<{
        success: boolean;
        message: string;
        data: Formulation;
    }> {
        const response = await api.put(`/formulations/${id}`, payload);
        return response.data;
    }

    async deleteFormulation(id: number): Promise<{ success: boolean; message: string }> {
        const response = await api.delete(`/formulations/${id}`);
        return response.data;
    }

    async updateFormulationStatus(id: number, status: 'Draft' | 'Active' | 'Inactive'): Promise<StatusUpdateResponse> {
        const response = await api.patch(`/formulations/${id}/status`, { status });
        return response.data;
    }

    // ================================================================
    // GET FORMULATION VERSIONS
    // ================================================================

    async getFormulationVersions(finishedGoodId: number): Promise<FormulationVersionResponse> {
        const response = await api.get(`/formulations/versions/${finishedGoodId}`);
        return response.data;
    }

    // ================================================================
    // GET FORMULATION MATERIALS
    // ================================================================

    async getFormulationMaterials(id: number): Promise<FormulationMaterialsResponse> {
        const response = await api.get(`/formulations/${id}/materials`);
        return response.data;
    }

    // ================================================================
    // STATISTICS
    // ================================================================

    async getStats(): Promise<{ success: boolean; data: FormulationStats }> {
        const response = await api.get('/formulations/stats');
        return response.data;
    }

    // ================================================================
    // BULK IMPORT
    // ================================================================

    async bulkImport(payload: ImportPayload): Promise<{
        success: boolean;
        message: string;
        data: ImportResult;
    }> {
        const response = await api.post('/formulations/import', payload);
        return response.data;
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'Draft': '📝 Draft',
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive'
        };
        return labels[status] || status;
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'Draft': 'draft',
            'Active': 'active',
            'Inactive': 'inactive'
        };
        return classes[status] || '';
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'Draft': '#f59e0b',
            'Active': '#16a34a',
            'Inactive': '#dc2626'
        };
        return colors[status] || '#94a3b8';
    }

    getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            'Draft': 'badge-warning',
            'Active': 'badge-success',
            'Inactive': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'Paint': '🎨 Paint',
            'Fiber': '🧵 Fiber'
        };
        return labels[type] || type;
    }

    getTypeClass(type: string): string {
        const classes: Record<string, string> = {
            'Paint': 'paint',
            'Fiber': 'fiber'
        };
        return classes[type] || '';
    }

    getTypeColor(type: string): string {
        const colors: Record<string, string> = {
            'Paint': '#3b82f6',
            'Fiber': '#8b5cf6'
        };
        return colors[type] || '#94a3b8';
    }

    getTypeBadgeClass(type: string): string {
        const classes: Record<string, string> = {
            'Paint': 'badge-primary',
            'Fiber': 'badge-purple'
        };
        return classes[type] || 'badge-secondary';
    }

    formatCurrency(amount: number): string {
        if (!amount && amount !== 0) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatQuantity(quantity: number): string {
        if (!quantity && quantity !== 0) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(quantity);
    }

    formatDate(date: string | Date): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    }

    getStatusOptions(): { value: string; label: string }[] {
        return [
            { value: 'Draft', label: '📝 Draft' },
            { value: 'Active', label: '✅ Active' },
            { value: 'Inactive', label: '⏸️ Inactive' }
        ];
    }

    getTypeOptions(): { value: string; label: string }[] {
        return [
            { value: 'Paint', label: '🎨 Paint' },
            { value: 'Fiber', label: '🧵 Fiber' }
        ];
    }

    getSortOptions(): { value: string; label: string }[] {
        return [
            { value: 'createdAt', label: 'Created Date' },
            { value: 'updatedAt', label: 'Updated Date' },
            { value: 'version', label: 'Version' },
            { value: 'status', label: 'Status' },
            { value: 'productName', label: 'Product Name' }
        ];
    }

    getPageSizeOptions(): number[] {
        return [5, 10, 20, 50, 100];
    }

    // ================================================================
    // VALIDATION METHODS
    // ================================================================

    validateFormulationData(data: CreateFormulationPayload | UpdateFormulationPayload): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if ('finishedGoodId' in data && data.finishedGoodId === undefined) {
            errors.push('Finished good is required');
        }

        if (data.rawMaterials) {
            if (data.rawMaterials.length === 0) {
                errors.push('At least one raw material is required');
            }

            const itemIds = data.rawMaterials.map(m => m.itemId);
            const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
            if (duplicates.length > 0) {
                errors.push('Duplicate raw materials detected');
            }

            for (const material of data.rawMaterials) {
                if (!material.itemId) {
                    errors.push('Each raw material must have an item selected');
                }
                if (!material.quantity || material.quantity <= 0) {
                    errors.push('Each raw material must have a valid quantity greater than 0');
                }
                if (!material.uomId) {
                    errors.push('Each raw material must have a unit of measurement');
                }
            }
        }

        if (data.status && !['Draft', 'Active', 'Inactive'].includes(data.status)) {
            errors.push('Status must be Draft, Active, or Inactive');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ================================================================
    // FORMATTING METHODS - ONLY CONVERSION UOM
    // ================================================================

    formatFormulation(formulation: any): Formulation {
        const rawMaterials = formulation.rawMaterials || formulation.details || [];
        
        const mappedMaterials = rawMaterials.map((m: any) => {
            const conversionUomCode = m.conversionUomCode || 
                                     m.item?.conversionUom?.code || 
                                     m.conversionUom?.code || 
                                     '';
            const conversionUomId = m.conversionUomId || 
                                   m.item?.conversionUomId || 
                                   m.conversionUom?.uomId || 
                                   m.conversionUom?.id || 
                                   null;
            
            return {
                id: m.id,
                itemId: m.itemId,
                itemCode: m.itemCode || m.item?.code || null,
                itemName: m.itemName || m.item?.name || null,
                quantity: m.quantity,
                conversionUomId: conversionUomId,
                conversionUomCode: conversionUomCode,
                costPrice: m.costPrice || m.item?.costPrice || 0,
                totalCost: m.totalCost || (m.quantity * (m.item?.costPrice || 0)) || 0,
                item: m.item || null,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt
            };
        });

        return {
            id: formulation.id,
            finishedGoodId: formulation.finishedGoodId,
            fgCode: formulation.fgCode || formulation.finishedGood?.fgCode || '',
            productName: formulation.productName || formulation.finishedGood?.name || '',
            productType: formulation.productType || formulation.finishedGood?.type || 'Paint',
            status: formulation.status || 'Draft',
            description: formulation.description || '',
            version: formulation.version || 1,
            isActive: formulation.status === 'Active',
            rawMaterials: mappedMaterials,
            totalRawMaterials: mappedMaterials.length,
            totalCost: formulation.totalCost || mappedMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0),
            createdBy: formulation.createdBy,
            updatedBy: formulation.updatedBy,
            createdByUser: formulation.createdByUser || null,
            updatedByUser: formulation.updatedByUser || null,
            createdAt: formulation.createdAt,
            updatedAt: formulation.updatedAt,
            formattedCreatedAt: this.formatDate(formulation.createdAt),
            formattedUpdatedAt: this.formatDate(formulation.updatedAt),
            isDraft: formulation.status === 'Draft',
            isInactive: formulation.status === 'Inactive',
            displayName: `${formulation.fgCode || formulation.finishedGood?.fgCode || ''} - ${formulation.productName || formulation.finishedGood?.name || ''}`,
            statusColor: this.getStatusColor(formulation.status),
            typeColor: this.getTypeColor(formulation.productType || formulation.finishedGood?.type || 'Paint')
        };
    }

    formatFormulations(formulations: any[]): Formulation[] {
        return formulations.map(f => this.formatFormulation(f));
    }

    // ================================================================
    // CSV EXPORT
    // ================================================================

    exportToCSV(formulations: Formulation[], filename: string = 'formulations_export'): void {
        if (!formulations || formulations.length === 0) {
            throw new Error('No data to export');
        }

        const headers = [
            'ID',
            'FG Code',
            'Product Name',
            'Product Type',
            'Status',
            'Version',
            'Total Materials',
            'Total Cost',
            'Created At',
            'Updated At'
        ];

        const rows = formulations.map(f => [
            f.id || '',
            f.fgCode || '',
            f.productName || '',
            f.productType || '',
            f.status || '',
            f.version || '',
            f.rawMaterials?.length || 0,
            this.formatCurrency(f.totalCost || 0),
            this.formatDate(f.createdAt),
            this.formatDate(f.updatedAt)
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ================================================================
    // CSV IMPORT HELPERS
    // ================================================================

    getCsvTemplate(): string {
        const headers = ['finishedGoodCode', 'materialCode', 'quantity', 'status'];
        const sampleData = [
            ['FG-001', 'SDT000004', '50', 'Active'],
            ['FG-001', 'SDT000007', '40', 'Active'],
            ['FG-007', 'SDT000010', '150', 'Active']
        ];

        let csv = headers.join(',') + '\n';
        sampleData.forEach(row => {
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    downloadTemplate(): void {
        const csv = this.getCsvTemplate();
        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `formulation_import_template_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    parseCsvContent(content: string): {
        finishedGoodCode: string;
        materialCode: string;
        quantity: number;
        status: string;
    }[] {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must contain headers and at least one data row');
        }

        const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['finishedgoodcode', 'materialcode', 'quantity'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const results: {
            finishedGoodCode: string;
            materialCode: string;
            quantity: number;
            status: string;
        }[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => {
                obj[h] = values[idx] || '';
            });

            if (!obj.finishedgoodcode || !obj.materialcode || !obj.quantity) {
                continue;
            }

            const quantity = parseFloat(obj.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                continue;
            }

            const status = obj.status
                ? obj.status.charAt(0).toUpperCase() + obj.status.slice(1).toLowerCase()
                : 'Draft';

            if (!['Draft', 'Active', 'Inactive'].includes(status)) {
                continue;
            }

            results.push({
                finishedGoodCode: obj.finishedgoodcode,
                materialCode: obj.materialcode,
                quantity: quantity,
                status: status
            });
        }

        if (results.length === 0) {
            throw new Error('No valid data found in CSV file');
        }

        return results;
    }

    // ================================================================
    // BUILD PAYLOAD HELPERS
    // ================================================================

    buildCreatePayload(formData: {
        finishedGoodId: number;
        status?: string;
        description?: string;
        rawMaterials: {
            itemId: number;
            quantity: number;
            uomId: number;
        }[];
    }): CreateFormulationPayload {
        return {
            finishedGoodId: formData.finishedGoodId,
            status: (formData.status as 'Draft' | 'Active' | 'Inactive') || 'Draft',
            description: formData.description || '',
            rawMaterials: formData.rawMaterials
                .filter(m => m.itemId && m.quantity > 0)
                .map(m => ({
                    itemId: m.itemId,
                    quantity: m.quantity,
                    uomId: m.uomId
                }))
        };
    }

    buildUpdatePayload(formData: {
        finishedGoodId?: number;
        status?: string;
        description?: string;
        rawMaterials?: {
            itemId: number;
            quantity: number;
            uomId: number;
        }[];
    }): UpdateFormulationPayload {
        const payload: UpdateFormulationPayload = {};

        if (formData.finishedGoodId !== undefined) {
            payload.finishedGoodId = formData.finishedGoodId;
        }

        if (formData.status) {
            payload.status = formData.status as 'Draft' | 'Active' | 'Inactive';
        }

        if (formData.description !== undefined) {
            payload.description = formData.description;
        }

        if (formData.rawMaterials) {
            payload.rawMaterials = formData.rawMaterials
                .filter(m => m.itemId && m.quantity > 0)
                .map(m => ({
                    itemId: m.itemId,
                    quantity: m.quantity,
                    uomId: m.uomId
                }));
        }

        return payload;
    }

    // ================================================================
    // CHECK METHODS
    // ================================================================

    isActive(formulation: Formulation): boolean {
        return formulation.status === 'Active';
    }

    isDraft(formulation: Formulation): boolean {
        return formulation.status === 'Draft';
    }

    isInactive(formulation: Formulation): boolean {
        return formulation.status === 'Inactive';
    }

    isEditable(formulation: Formulation): boolean {
        return formulation.status === 'Draft' || formulation.status === 'Active';
    }

    isDeletable(formulation: Formulation): boolean {
        return formulation.status === 'Draft';
    }

    hasMaterials(formulation: Formulation): boolean {
        return formulation.rawMaterials && formulation.rawMaterials.length > 0;
    }

    // ================================================================
    // CALCULATION HELPERS
    // ================================================================

    calculateTotalCost(formulation: Formulation): number {
        if (!formulation.rawMaterials || formulation.rawMaterials.length === 0) {
            return 0;
        }

        return formulation.rawMaterials.reduce((sum, detail) => {
            return sum + (detail.quantity * (detail.itemCostPrice || 0));
        }, 0);
    }

    calculateTotalMaterials(formulation: Formulation): number {
        return formulation.rawMaterials?.length || 0;
    }

    getMaterialSummary(formulation: Formulation): {
        totalItems: number;
        totalQuantity: number;
        totalCost: number;
        averageCost: number;
    } {
        const materials = formulation.rawMaterials || [];
        const totalItems = materials.length;
        const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
        const totalCost = this.calculateTotalCost(formulation);
        const averageCost = totalItems > 0 ? totalCost / totalItems : 0;

        return {
            totalItems,
            totalQuantity,
            totalCost,
            averageCost
        };
    }
}

export default new FormulationService();