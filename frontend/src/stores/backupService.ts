// FILE: frontend/src/stores/backupService.ts
import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Backup {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: string;
    type: 'full' | 'table' | 'partial';
    format: 'sql' | 'json' | 'csv';
    includeStructure: boolean;
    tableName: string | null;
    status: 'pending' | 'completed' | 'failed';
    createdBy: number | null;
    restoredBy: number | null;
    restoredAt: string | null;
    createdAt: string;
    deletedAt: string | null;
}

export interface TableInfo {
    name: string;
    label: string;
    recordCount: number;
    size: string;
}

export interface BackupStats {
    totalTables: number;
    totalRecords: number;
    totalBackups: number;
    fullBackups: number;
    tableBackups: number;
    storageUsed: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: PaginationInfo;
}

export interface CreateBackupOptions {
    format?: 'sql' | 'json' | 'csv';
    includeStructure?: boolean;
}

export interface BackupTableOptions {
    tableName: string;
    format?: 'sql' | 'json' | 'csv';
    includeStructure?: boolean;
}

export interface RestoreOptions {
    dropExisting?: boolean;
}

export interface RestoreFromFileOptions {
    type?: 'full' | 'table';
    targetTable?: string;
    dropExisting?: boolean;
    includeData?: boolean;
    createBackup?: boolean;
}

export interface GetBackupsParams {
    page?: number;
    limit?: number;
}

// ============================================
// BACKUP SERVICE CLASS
// ============================================

class BackupService {
    // ================================================================
    // BACKUP OPERATIONS
    // ================================================================

    /**
     * Create a full database backup
     */
    async createBackup(options: CreateBackupOptions = {}): Promise<ApiResponse<Backup>> {
        try {
            const response = await api.post('/backup/backup', {
                format: options.format || 'sql',
                includeStructure: options.includeStructure !== undefined ? options.includeStructure : true,
            });
            return response.data;
        } catch (error: any) {
            console.error('Create backup error:', error);
            return {
                success: false,
                data: {} as Backup,
                error: error.response?.data?.error || 'Failed to create backup'
            };
        }
    }

    /**
     * Backup a specific table
     */
 // FILE: frontend/src/stores/backupService.ts

// Update the backupTable method
async backupTable(options: BackupTableOptions): Promise<ApiResponse<Backup>> {
  try {
    const response = await api.post('/backup/backup/table', {
      tableName: options.tableName,  // ✅ Use tableName (camelCase)
      format: options.format || 'json',
      includeStructure: options.includeStructure !== undefined ? options.includeStructure : true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Backup table error:', error);
    return {
      success: false,
      data: {} as Backup,
      error: error.response?.data?.error || 'Failed to backup table'
    };
  }
}

    /**
     * Get all backups with pagination
     */
    async getBackups(params: GetBackupsParams = {}): Promise<{
        success: boolean;
        data: Backup[];
        pagination: PaginationInfo;
        error?: string;
    }> {
        try {
            const response = await api.get('/backup/backups', {
                params: {
                    page: params.page || 1,
                    limit: params.limit || 12,
                },
            });
            return response.data;
        } catch (error: any) {
            console.error('Get backups error:', error);
            return {
                success: false,
                data: [],
                pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
                error: error.response?.data?.error || 'Failed to fetch backups'
            };
        }
    }

    /**
     * Get a single backup by ID
     */
    async getBackup(id: string): Promise<ApiResponse<Backup>> {
        try {
            const response = await api.get(`/backup/backup/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Get backup error:', error);
            return {
                success: false,
                data: {} as Backup,
                error: error.response?.data?.error || 'Failed to fetch backup'
            };
        }
    }

    /**
     * Download a backup file
     */
    async downloadBackup(id: string, filename?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await api.get(`/backup/backup/${id}/download`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `backup_${id}.sql`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error: any) {
            console.error('Download backup error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to download backup'
            };
        }
    }

    /**
     * Restore from a backup
     */
    async restoreFromBackup(id: string, options: RestoreOptions = {}): Promise<ApiResponse<any>> {
        try {
            const response = await api.post(`/backup/backup/${id}/restore`, {
                dropExisting: options.dropExisting !== undefined ? options.dropExisting : true,
            });
            return response.data;
        } catch (error: any) {
            console.error('Restore from backup error:', error);
            return {
                success: false,
                data: null,
                error: error.response?.data?.error || 'Failed to restore from backup'
            };
        }
    }

    /**
     * Restore from an uploaded file
     */
    async restoreFromFile(file: File, options: RestoreFromFileOptions = {}): Promise<ApiResponse<any>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', options.type || 'full');
            formData.append('targetTable', options.targetTable || '');
            formData.append('dropExisting', String(options.dropExisting !== undefined ? options.dropExisting : true));
            formData.append('includeData', String(options.includeData !== undefined ? options.includeData : true));
            formData.append('createBackup', String(options.createBackup !== undefined ? options.createBackup : false));

            const response = await api.post('/backup/backup/restore-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 120000, // 2 minutes for large restores
            });
            return response.data;
        } catch (error: any) {
            console.error('Restore from file error:', error);
            return {
                success: false,
                data: null,
                error: error.response?.data?.error || 'Failed to restore from file'
            };
        }
    }

    /**
     * Delete a backup (soft delete)
     */
    async deleteBackup(id: string): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await api.delete(`/backup/backup/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Delete backup error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete backup'
            };
        }
    }

    // ================================================================
    // TABLE MANAGEMENT
    // ================================================================

    /**
     * Get all tables with statistics
     */
    async getTables(): Promise<{ success: boolean; data: TableInfo[]; error?: string }> {
        try {
            const response = await api.get('/backup/tables');
            return response.data;
        } catch (error: any) {
            console.error('Get tables error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch tables'
            };
        }
    }

    /**
     * Get table data preview
     */
    async getTableData(tableName: string, limit: number = 10): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get(`/backup/tables/${tableName}/data`, {
                params: { limit },
            });
            return response.data;
        } catch (error: any) {
            console.error('Get table data error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch table data'
            };
        }
    }

    /**
     * Delete a table (DROP TABLE)
     */
    async deleteTable(tableName: string): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await api.delete(`/backup/table/${tableName}`);
            return response.data;
        } catch (error: any) {
            console.error('Delete table error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete table'
            };
        }
    }

    /**
     * Clear all data from a table (TRUNCATE or DELETE)
     */
    async clearTable(tableName: string): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await api.post(`/backup/table/${tableName}/clear`);
            return response.data;
        } catch (error: any) {
            console.error('Clear table error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to clear table'
            };
        }
    }

    /**
     * Delete multiple tables
     */
    async deleteTables(tableNames: string[]): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await api.post('/backup/tables/delete-multiple', { tableNames });
            return response.data;
        } catch (error: any) {
            console.error('Delete tables error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete tables'
            };
        }
    }

    /**
     * Clear multiple tables
     */
    async clearTables(tableNames: string[]): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await api.post('/backup/tables/clear-multiple', { tableNames });
            return response.data;
        } catch (error: any) {
            console.error('Clear tables error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to clear tables'
            };
        }
    }

    // ================================================================
    // STATISTICS
    // ================================================================

    /**
     * Get backup statistics
     */
    async getStats(): Promise<{ success: boolean; data: BackupStats; error?: string }> {
        try {
            const response = await api.get('/backup/stats');
            return response.data;
        } catch (error: any) {
            console.error('Get stats error:', error);
            return {
                success: false,
                data: {
                    totalTables: 0,
                    totalRecords: 0,
                    totalBackups: 0,
                    fullBackups: 0,
                    tableBackups: 0,
                    storageUsed: '0 MB'
                },
                error: error.response?.data?.error || 'Failed to fetch statistics'
            };
        }
    }

    // ================================================================
    // UTILITY METHODS - FIXED TYPE SAFETY
    // ================================================================

    /**
     * Format file size from bytes
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    }

    /**
     * Get backup size in bytes from string
     */
    getBackupSizeInBytes(sizeStr: string): number {
        if (!sizeStr) return 0;
        
        const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
        if (!match) return 0;
        
        const value = Number.parseFloat(match[1] ?? '0');
        const unit = (match[2] ?? 'B').toUpperCase();
        
        const multipliers: Record<string, number> = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };
        
        return value * (multipliers[unit] || 1);
    }

    /**
     * Format date
     */
    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get backup type label with icon
     */
    getBackupTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'full': '📦 Full Backup',
            'table': '📋 Table Backup',
            'partial': '📊 Partial Backup'
        };
        return labels[type] || type;
    }

    /**
     * Get backup format label
     */
    getBackupFormatLabel(format: string): string {
        const labels: Record<string, string> = {
            'sql': '🗄️ SQL',
            'json': '📄 JSON',
            'csv': '📊 CSV'
        };
        return labels[format] || format;
    }

    /**
     * Get backup status label with icon
     */
    getBackupStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'pending': '⏳ Pending',
            'completed': '✅ Completed',
            'failed': '❌ Failed'
        };
        return labels[status] || status;
    }

    /**
     * Get backup status class for styling
     */
    getBackupStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'pending': 'status-pending',
            'completed': 'status-completed',
            'failed': 'status-failed'
        };
        return classes[status] || '';
    }

    /**
     * Get restore type label
     */
    getRestoreTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'full': '🔄 Full Restore',
            'table': '📋 Table Restore'
        };
        return labels[type] || type;
    }

    /**
     * Get table status badge class
     */
    getTableStatusClass(table: TableInfo): string {
        if (table.recordCount === 0) return 'empty';
        if (table.recordCount < 100) return 'small';
        if (table.recordCount < 1000) return 'medium';
        return 'large';
    }

    /**
     * Get table status label
     */
    getTableStatusLabel(table: TableInfo): string {
        if (table.recordCount === 0) return 'Empty';
        if (table.recordCount < 100) return 'Small';
        if (table.recordCount < 1000) return 'Medium';
        return 'Large';
    }

    /**
     * Generate a backup filename with timestamp
     */
    generateBackupFilename(prefix: string = 'backup', format: string = 'sql'): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        return `${prefix}_${timestamp}.${format}`;
    }

    /**
     * Validate backup file type
     */
    isValidBackupFile(file: File): boolean {
        const allowedTypes = [
            'application/json',
            'application/sql',
            'application/zip',
            'text/csv',
            'text/plain'
        ];
        const allowedExtensions = ['.json', '.sql', '.zip', '.csv'];

        const fileType = file.type;
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        return allowedTypes.includes(fileType) ||
            (!!fileExt && allowedExtensions.includes(fileExt));
    }

    /**
     * Get file extension from backup
     */
    getFileExtension(backup: Backup): string {
        return backup.fileName.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * Check if backup is restorable
     */
    isRestorable(backup: Backup): boolean {
        return backup.status === 'completed' && backup.deletedAt === null;
    }

    /**
     * Format backup size for display
     */
    formatBackupSize(sizeStr: string): string {
        if (!sizeStr) return '0 B';
        return sizeStr;
    }

    /**
     * Get backup file name without extension
     */
    getBackupNameWithoutExtension(backup: Backup): string {
        const lastDotIndex = backup.fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? backup.fileName.substring(0, lastDotIndex) : backup.fileName;
    }

    /**
     * Get backup file extension
     */
    getBackupExtension(backup: Backup): string {
        const fileName = backup.fileName || '';
        const parts = fileName.split('.');
        const last = parts.length > 1 ? parts[parts.length - 1] : '';
        return typeof last === 'string' && last.length > 0 ? last.toLowerCase() : '';
    }

    /**
     * Check if backup is a full backup
     */
    isFullBackup(backup: Backup): boolean {
        return backup.type === 'full';
    }

    /**
     * Check if backup is a table backup
     */
    isTableBackup(backup: Backup): boolean {
        return backup.type === 'table';
    }

    /**
     * Get backup age in days
     */
    getBackupAgeInDays(backup: Backup): number {
        if (!backup.createdAt) return 0;
        const created = new Date(backup.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get backup size class for display
     */
    getBackupSizeClass(sizeStr: string): string {
        const bytes = this.getBackupSizeInBytes(sizeStr);
        if (bytes < 1024 * 1024) return 'small'; // < 1MB
        if (bytes < 1024 * 1024 * 10) return 'medium'; // < 10MB
        return 'large';
    }

    /**
     * Get backup size label
     */
    getBackupSizeLabel(sizeStr: string): string {
        const bytes = this.getBackupSizeInBytes(sizeStr);
        if (bytes < 1024 * 1024) return 'Small';
        if (bytes < 1024 * 1024 * 10) return 'Medium';
        return 'Large';
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new BackupService();