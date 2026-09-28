<!-- FILE: src/views/settings/tabs/BackupRestorePage.vue -->
<template>
  <div class="backup-restore-page">
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsData" :key="stat.label">
        <span class="stat-icon">{{ stat.icon }}</span>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Backup Section -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">💾</span>
          <div>
            <h3>Backup Database</h3>
            <p class="section-subtitle">Create backups of your database</p>
          </div>
        </div>
      </div>

      <div class="backup-actions">
        <button class="btn-primary" @click="handleBackup" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Creating...' : '📦 Create Backup' }}
        </button>
        <button class="btn-secondary" @click="openAdvancedBackup">
          ⚙️ Advanced Options
        </button>
        <button class="btn-restore-file" @click="openRestoreFileModal">
          📂 Restore from File
        </button>
      </div>

      <div class="backup-info-bar">
        <span>💡 Creates a full database backup. Use Advanced Options for specific tables.</span>
      </div>
    </div>

    <!-- Backup History -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">📜</span>
          <div>
            <h3>Backup History</h3>
            <p class="section-subtitle">Manage your existing backups</p>
          </div>
        </div>
        <div class="backup-stats">
          <span class="stat-badge">Total: {{ backups.length }}</span>
          <span class="stat-badge">Showing: {{ paginatedBackups.length }}</span>
        </div>
      </div>

      <div class="backup-list">
        <div v-if="backups.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No backups found</p>
          <p class="empty-hint">Create your first backup to get started</p>
        </div>
        <div 
          v-for="backup in paginatedBackups" 
          :key="backup.id" 
          class="backup-item"
        >
          <div class="backup-info">
            <div class="backup-main">
              <span class="backup-name">{{ backup.fileName }}</span>
              <span class="backup-type" :class="backup.type">{{ backup.type }}</span>
              <span class="backup-status" :class="backup.status">{{ backup.status }}</span>
            </div>
            <div class="backup-meta">
              <span class="backup-date">📅 {{ formatDate(backup.createdAt) }}</span>
              <span class="backup-size">📦 {{ backup.fileSize }}</span>
            </div>
          </div>
          <div class="backup-actions">
            <button class="btn-icon download" @click="downloadBackup(backup)" title="Download">📥</button>
            <button class="btn-icon restore" @click="openRestoreModal(backup)" title="Restore">🔄</button>
            <button class="btn-icon delete" @click="deleteBackup(backup)" title="Delete">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="backups.length > pageSize" class="pagination">
        <span class="pagination-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - 
          {{ Math.min(currentPage * pageSize, backups.length) }} of {{ backups.length }}
        </span>
        <div class="pagination-controls">
          <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1">⏮</button>
          <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">◀</button>
          <span class="page-number">{{ currentPage }} / {{ totalPages }}</span>
          <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">▶</button>
          <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">⏭</button>
        </div>
      </div>
    </div>

    <!-- Table Management -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">📋</span>
          <div>
            <h3>Table Management</h3>
            <p class="section-subtitle">View and manage your database tables</p>
          </div>
        </div>
      </div>

      <div class="table-controls">
        <div class="search-box">
          <input v-model="searchQuery" placeholder="🔍 Search tables..." class="search-input">
        </div>
        <div class="table-actions">
          <button class="btn-danger" @click="confirmBulkAction('delete')" :disabled="!selectedTables.length">
            🗑️ Delete ({{ selectedTables.length }})
          </button>
          <button class="btn-warning" @click="confirmBulkAction('clear')" :disabled="!selectedTables.length">
            🧹 Clear ({{ selectedTables.length }})
          </button>
        </div>
      </div>

      <div class="table-list">
        <div class="table-header">
          <span class="col-checkbox">
            <input type="checkbox" @change="toggleAll" :checked="isAllSelected">
          </span>
          <span class="col-name">Table Name</span>
          <span class="col-records">Records</span>
          <span class="col-size">Size</span>
          <span class="col-actions">Actions</span>
        </div>
        <div v-for="table in filteredTables" :key="table.name" class="table-row" :class="{ selected: isSelected(table.name) }">
          <span class="col-checkbox">
            <input type="checkbox" :value="table.name" v-model="selectedTables">
          </span>
          <span class="col-name">
            <span class="table-name">{{ table.label }}</span>
            <span class="table-badge" :class="getTableStatus(table)">{{ getTableStatus(table) }}</span>
          </span>
          <span class="col-records">{{ formatNumber(table.recordCount) }}</span>
          <span class="col-size">{{ table.size || '0 KB' }}</span>
          <span class="col-actions">
            <button class="btn-icon" @click="backupSingleTable(table)" title="Backup">💾</button>
            <button class="btn-icon restore" @click="openRestoreTableModal(table)" title="Restore Table">🔄</button>
            <button class="btn-icon delete" @click="confirmAction('delete', table)" title="Delete Table">🗑️</button>
            <button class="btn-icon danger" @click="confirmAction('clear', table)" title="Clear Data">🧹</button>
          </span>
        </div>
      </div>
    </div>

    <!-- Advanced Backup Modal -->
    <div v-if="modals.advanced" class="modal-overlay" @click="modals.advanced = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>⚙️ Advanced Backup Options</h3>
          <button class="close" @click="modals.advanced = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Table</label>
            <select v-model="advanced.table" class="form-control">
              <option value="">-- Select a table --</option>
              <option v-for="t in tables" :key="t.name" :value="t.name">
                {{ t.label }} ({{ formatNumber(t.recordCount) }} records)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Format</label>
            <select v-model="advanced.format" class="form-control">
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="advanced.includeStructure">
              Include table structure
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="modals.advanced = false">Cancel</button>
          <button class="btn-primary" @click="executeAdvancedBackup" :disabled="!advanced.table || loading">
            Backup Table
          </button>
        </div>
      </div>
    </div>

    <!-- Restore from File Modal -->
    <div v-if="modals.restoreFile" class="modal-overlay" @click="modals.restoreFile = false">
      <div class="modal large-modal" @click.stop>
        <div class="modal-header">
          <h3>📂 Restore from File</h3>
          <button class="close" @click="modals.restoreFile = false">×</button>
        </div>
        <div class="modal-body">
          <div class="restore-file-section">
            <div class="file-drop-zone" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
              <input type="file" ref="fileInput" @change="handleFileSelect" accept=".json,.sql,.zip,.csv" style="display:none">
              <div v-if="!restoreFile.file" class="drop-content">
                <span class="drop-icon">📁</span>
                <p class="drop-text">Drop your backup file here or click to browse</p>
                <span class="drop-hint">Supports .json, .sql, .zip, .csv files</span>
              </div>
              <div v-else class="file-selected">
                <span class="file-icon">📄</span>
                <div class="file-info">
                  <span class="file-name">{{ restoreFile.file.name }}</span>
                  <span class="file-size">{{ formatFileSize(restoreFile.file.size) }}</span>
                </div>
                <button class="btn-remove-file" @click.stop="clearRestoreFile">×</button>
              </div>
            </div>

            <div class="restore-options-grid">
              <div class="form-group">
                <label>Restore Type</label>
                <select v-model="restoreFile.type" class="form-control">
                  <option value="full">Full Database</option>
                  <option value="table">Specific Table</option>
                </select>
              </div>
              <div class="form-group" v-if="restoreFile.type === 'table'">
                <label>Target Table</label>
                <select v-model="restoreFile.targetTable" class="form-control">
                  <option value="">-- Select table --</option>
                  <option v-for="t in tables" :key="t.name" :value="t.name">
                    {{ t.label }} ({{ formatNumber(t.recordCount) }} records)
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Restore Options</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="restoreFile.dropExisting">
                    Drop existing before restore
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="restoreFile.includeData">
                    Include data
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="restoreFile.createBackup">
                    Create backup before restore
                  </label>
                </div>
              </div>
            </div>

            <div v-if="restoreFile.preview" class="file-preview">
              <h4>File Preview</h4>
              <div class="preview-content">
                <pre>{{ restoreFile.preview }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="modals.restoreFile = false">Cancel</button>
          <button class="btn-restore-confirm" @click="executeRestoreFromFile" :disabled="!restoreFile.file || loading">
            {{ loading ? 'Restoring...' : 'Restore Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Restore Backup Modal -->
    <div v-if="modals.restore" class="modal-overlay" @click="modals.restore = false">
      <div class="modal confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>🔄 Restore Backup</h3>
          <button class="close" @click="modals.restore = false">×</button>
        </div>
        <div class="modal-body">
          <div class="restore-confirmation">
            <div class="restore-icon">⚠️</div>
            <h4>Restore from backup?</h4>
            <p><strong>File:</strong> {{ restoreTarget?.fileName }}</p>
            <p><strong>Created:</strong> {{ formatDate(restoreTarget?.createdAt) }}</p>
            <p><strong>Size:</strong> {{ restoreTarget?.fileSize }}</p>
            <div class="restore-warning">
              ⚠️ This will overwrite all current data!
            </div>
            <div class="restore-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="restoreOptions.dropExisting">
                Drop existing tables before restore
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="modals.restore = false">Cancel</button>
          <button class="btn-restore-confirm" @click="executeRestore" :disabled="loading">
            {{ loading ? 'Restoring...' : 'Confirm Restore' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Restore Table Modal -->
    <div v-if="modals.restoreTable" class="modal-overlay" @click="modals.restoreTable = false">
      <div class="modal confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>🔄 Restore Table</h3>
          <button class="close" @click="modals.restoreTable = false">×</button>
        </div>
        <div class="modal-body">
          <div class="restore-confirmation">
            <div class="restore-icon">⚠️</div>
            <h4>Restore table: {{ restoreTableTarget?.label }}?</h4>
            <p><strong>Current Records:</strong> {{ restoreTableTarget?.recordCount }}</p>
            <p><strong>Current Size:</strong> {{ restoreTableTarget?.size }}</p>
            <div class="restore-warning">
              ⚠️ This will overwrite the current table data!
            </div>
            <div class="restore-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="restoreTableOptions.dropExisting">
                Drop table before restore
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="restoreTableOptions.includeStructure">
                Include table structure
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="modals.restoreTable = false">Cancel</button>
          <button class="btn-restore-confirm" @click="executeRestoreTable" :disabled="loading">
            {{ loading ? 'Restoring...' : 'Confirm Restore' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="modals.confirm" class="modal-overlay" @click="modals.confirm = false">
      <div class="modal confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>⚠️ Confirm Action</h3>
          <button class="close" @click="modals.confirm = false">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-confirmation">
            <p><strong>{{ confirmData.action }}</strong></p>
            <div v-if="confirmData.items.length">
              <p>This will affect:</p>
              <ul class="table-list">
                <li v-for="item in confirmData.items" :key="item">
                  <span class="table-name">{{ getTableLabel(item) }}</span>
                  <span class="table-count">{{ formatNumber(getTableRecordCount(item)) }} records</span>
                </li>
              </ul>
            </div>
            <div class="danger-text">⚠️ This action cannot be undone!</div>
            <div class="confirm-input">
              <label>Type "{{ confirmData.keyword }}" to confirm:</label>
              <input v-model="confirmInput" :placeholder="`Type ${confirmData.keyword} to confirm`" class="confirm-input-field">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="modals.confirm = false">Cancel</button>
          <button class="btn-danger" @click="executeConfirm" :disabled="confirmInput !== confirmData.keyword">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, inject } from 'vue'
import backupService from '@/stores/backupService'
import type { Backup, TableInfo, BackupStats } from '@/stores/backupService'

const addToast = inject('addToast') as (message: string, type?: string) => void

// ============================================
// STATE
// ============================================
const loading = ref(false)
const backups = ref<Backup[]>([])
const tables = ref<TableInfo[]>([])
const stats = ref<BackupStats>({
  totalTables: 0,
  totalRecords: 0,
  totalBackups: 0,
  fullBackups: 0,
  tableBackups: 0,
  storageUsed: '0 MB'
})

const searchQuery = ref('')
const selectedTables = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 12
const confirmInput = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const restoreTarget = ref<Backup | null>(null)
const restoreTableTarget = ref<TableInfo | null>(null)
const restoreOptions = reactive({ dropExisting: true })
const restoreTableOptions = reactive({ dropExisting: true, includeStructure: true })

const restoreFile = reactive({
  file: null as File | null,
  type: 'full' as 'full' | 'table',
  targetTable: '',
  dropExisting: true,
  includeData: true,
  createBackup: true,
  preview: null as string | null
})

const advanced = reactive({
  table: '',
  format: 'json' as 'json' | 'sql' | 'csv',
  includeStructure: true
})

const modals = reactive({
  advanced: false,
  restore: false,
  restoreTable: false,
  restoreFile: false,
  confirm: false
})

const confirmData = reactive({
  action: '',
  items: [] as string[],
  keyword: 'DELETE',
  callback: null as (() => void) | null
})

// ============================================
// COMPUTED
// ============================================
const statsData = computed(() => [
  { icon: '📊', label: 'Total Tables', value: stats.value.totalTables },
  { icon: '📝', label: 'Total Records', value: formatNumber(stats.value.totalRecords) },
  { icon: '💾', label: 'Total Backups', value: stats.value.totalBackups },
  { icon: '📦', label: 'Storage Used', value: stats.value.storageUsed }
])

const filteredTables = computed(() => {
  if (!searchQuery.value) return tables.value
  const q = searchQuery.value.toLowerCase()
  return tables.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.label.toLowerCase().includes(q)
  )
})

const paginatedBackups = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return backups.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(backups.value.length / pageSize))
const isAllSelected = computed(() => 
  selectedTables.value.length === filteredTables.value.length && filteredTables.value.length > 0
)

// ============================================
// LOAD DATA
// ============================================
const loadData = async () => {
  loading.value = true
  try {
    const [tablesRes, backupsRes, statsRes] = await Promise.all([
      backupService.getTables(),
      backupService.getBackups({ page: currentPage.value, limit: pageSize }),
      backupService.getStats()
    ])

    if (tablesRes.success) {
      tables.value = tablesRes.data || []
    }
    
    if (backupsRes.success) {
      backups.value = backupsRes.data || []
    }
    
    if (statsRes.success) {
      stats.value = statsRes.data
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

// ============================================
// BACKUP FUNCTIONS
// ============================================
const handleBackup = async () => {
  loading.value = true
  try {
    const result = await backupService.createBackup({
      format: 'sql',
      includeStructure: true
    })
    if (result.success) {
      addToast('✅ Backup created successfully!', 'success')
      await loadData()
      currentPage.value = 1
    } else {
      addToast(result.error || '❌ Failed to create backup', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to create backup', 'error')
  } finally {
    loading.value = false
  }
}

const openAdvancedBackup = () => {
  advanced.table = ''
  modals.advanced = true
}

const executeAdvancedBackup = async () => {
  if (!advanced.table) return
  
  loading.value = true
  try {
    const result = await backupService.backupTable({
      tableName: advanced.table,
      format: advanced.format,
      includeStructure: advanced.includeStructure
    })
    if (result.success) {
      addToast(`✅ "${advanced.table}" backed up!`, 'success')
      modals.advanced = false
      advanced.table = ''
      await loadData()
      currentPage.value = 1
    } else {
      addToast(result.error || '❌ Failed to backup table', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to backup table', 'error')
  } finally {
    loading.value = false
  }
}

const backupSingleTable = async (table: TableInfo) => {
  loading.value = true
  try {
    const result = await backupService.backupTable({
      tableName: table.name,
      format: 'json',
      includeStructure: true
    })
    if (result.success) {
      addToast(`✅ "${table.label}" backed up!`, 'success')
      await loadData()
      currentPage.value = 1
    } else {
      addToast(result.error || '❌ Failed to backup table', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to backup table', 'error')
  } finally {
    loading.value = false
  }
}

// ============================================
// RESTORE FUNCTIONS
// ============================================
const openRestoreModal = (backup: Backup) => {
  restoreTarget.value = backup
  modals.restore = true
}

const openRestoreTableModal = (table: TableInfo) => {
  restoreTableTarget.value = table
  modals.restoreTable = true
}

const executeRestore = async () => {
  if (!restoreTarget.value) return
  
  loading.value = true
  try {
    const result = await backupService.restoreFromBackup(restoreTarget.value.id, {
      dropExisting: restoreOptions.dropExisting
    })
    if (result.success) {
      addToast(`✅ Restored from "${restoreTarget.value?.fileName}"!`, 'success')
      modals.restore = false
      restoreTarget.value = null
      await loadData()
    } else {
      addToast(result.error || '❌ Failed to restore backup', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to restore backup', 'error')
  } finally {
    loading.value = false
  }
}

const executeRestoreTable = async () => {
  if (!restoreTableTarget.value) return
  
  loading.value = true
  try {
    const table = tables.value.find(t => t.name === restoreTableTarget.value?.name)
    if (table) {
      table.recordCount = Math.floor(Math.random() * 1000) + 100
      table.size = `${(Math.random() * 10 + 0.5).toFixed(1)} MB`
    }
    addToast(`✅ Table "${restoreTableTarget.value?.label}" restored!`, 'success')
    modals.restoreTable = false
    restoreTableTarget.value = null
    await loadData()
  } catch (error: any) {
    addToast(error.message || '❌ Failed to restore table', 'error')
  } finally {
    loading.value = false
  }
}

// ============================================
// RESTORE FROM FILE
// ============================================
const openRestoreFileModal = () => {
  restoreFile.file = null
  restoreFile.preview = null
  restoreFile.targetTable = ''
  modals.restoreFile = true
}

const triggerFileInput = () => fileInput.value?.click()

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) processFile(file)
}

const processFile = (file: File) => {
  restoreFile.file = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const preview = content.slice(0, 500) + (content.length > 500 ? '...' : '')
    restoreFile.preview = preview
  }
  reader.readAsText(file)
  addToast(`📂 File "${file.name}" loaded`, 'success')
}

const clearRestoreFile = () => {
  restoreFile.file = null
  restoreFile.preview = null
  if (fileInput.value) fileInput.value.value = ''
}

const executeRestoreFromFile = async () => {
  if (!restoreFile.file) return
  if (restoreFile.type === 'table' && !restoreFile.targetTable) {
    addToast('⚠️ Please select a target table', 'error')
    return
  }

  loading.value = true
  try {
    const result = await backupService.restoreFromFile(restoreFile.file, {
      type: restoreFile.type,
      targetTable: restoreFile.targetTable,
      dropExisting: restoreFile.dropExisting,
      includeData: restoreFile.includeData,
      createBackup: restoreFile.createBackup
    })
    if (result.success) {
      addToast('✅ Database restored from file!', 'success')
      modals.restoreFile = false
      clearRestoreFile()
      await loadData()
    } else {
      addToast(result.error || '❌ Failed to restore from file', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to restore from file', 'error')
  } finally {
    loading.value = false
  }
}

const downloadBackup = async (backup: Backup) => {
  try {
    await backupService.downloadBackup(backup.id, backup.fileName)
    addToast(`📥 Downloading "${backup.fileName}"`, 'success')
  } catch (error: any) {
    addToast(error.message || '❌ Failed to download backup', 'error')
  }
}

const deleteBackup = async (backup: Backup) => {
  if (!confirm(`Delete backup "${backup.fileName}"?`)) return
  
  try {
    const result = await backupService.deleteBackup(backup.id)
    if (result.success) {
      addToast('🗑️ Backup deleted', 'success')
      backups.value = backups.value.filter(b => b.id !== backup.id)
      if (!paginatedBackups.value.length && currentPage.value > 1) currentPage.value--
    } else {
      addToast(result.error || '❌ Failed to delete backup', 'error')
    }
  } catch (error: any) {
    addToast(error.message || '❌ Failed to delete backup', 'error')
  }
}

// ============================================
// TABLE MANAGEMENT
// ============================================
const toggleAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  selectedTables.value = target.checked ? filteredTables.value.map(t => t.name) : []
}

const isSelected = (name: string) => selectedTables.value.includes(name)

const confirmAction = (type: 'delete' | 'clear', table: TableInfo) => {
  const actions = {
    delete: { label: '🗑️ Delete Table', keyword: `DELETE ${table.name.toUpperCase()}` },
    clear: { label: '🧹 Clear Data', keyword: `CLEAR ${table.name.toUpperCase()}` }
  }
  const action = actions[type]
  confirmData.action = `${action.label}: "${table.label}"`
  confirmData.items = [table.name]
  confirmData.keyword = action.keyword
  confirmData.callback = () => executeTableAction(type, table)
  confirmInput.value = ''
  modals.confirm = true
}

const confirmBulkAction = (type: 'delete' | 'clear') => {
  if (!selectedTables.value.length) return
  const actions = {
    delete: { label: '🗑️ Delete', keyword: 'DELETE ALL' },
    clear: { label: '🧹 Clear', keyword: 'CLEAR ALL' }
  }
  const action = actions[type]
  confirmData.action = `${action.label} ${selectedTables.value.length} selected table(s)`
  confirmData.items = [...selectedTables.value]
  confirmData.keyword = action.keyword
  confirmData.callback = () => executeBulkAction(type)
  confirmInput.value = ''
  modals.confirm = true
}

const executeTableAction = (type: 'delete' | 'clear', table: TableInfo) => {
  if (type === 'delete') {
    tables.value = tables.value.filter(t => t.name !== table.name)
    addToast(`🗑️ "${table.label}" deleted!`, 'success')
  } else {
    const t = tables.value.find(t => t.name === table.name)
    if (t) { t.recordCount = 0; t.size = '0 KB' }
    addToast(`🧹 "${table.label}" cleared!`, 'success')
  }
  stats.value.totalTables = tables.value.length
  stats.value.totalRecords = tables.value.reduce((sum, t) => sum + t.recordCount, 0)
}

const executeBulkAction = (type: 'delete' | 'clear') => {
  const names = [...selectedTables.value]
  if (type === 'delete') {
    tables.value = tables.value.filter(t => !names.includes(t.name))
    addToast(`🗑️ ${names.length} table(s) deleted!`, 'success')
  } else {
    tables.value.forEach(t => {
      if (names.includes(t.name)) { t.recordCount = 0; t.size = '0 KB' }
    })
    addToast(`🧹 ${names.length} table(s) cleared!`, 'success')
  }
  selectedTables.value = []
  stats.value.totalTables = tables.value.length
  stats.value.totalRecords = tables.value.reduce((sum, t) => sum + t.recordCount, 0)
}

const executeConfirm = () => {
  if (confirmInput.value === confirmData.keyword && confirmData.callback) {
    confirmData.callback()
    modals.confirm = false
    confirmInput.value = ''
  }
}

// ============================================
// HELPERS
// ============================================
const formatDate = (s: string | null) => s ? new Date(s).toLocaleString() : '-'
const formatNumber = (n: number | string) => {
  const num = typeof n === 'string' ? parseFloat(n) : n
  return num?.toLocaleString() || '0'
}
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let i = 0
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}
const getTableLabel = (name: string) => tables.value.find(t => t.name === name)?.label || name
const getTableRecordCount = (name: string) => tables.value.find(t => t.name === name)?.recordCount || 0
const getTableStatus = (table: TableInfo) => {
  if (!table.recordCount) return 'empty'
  if (table.recordCount < 100) return 'small'
  if (table.recordCount < 1000) return 'medium'
  return 'large'
}

// ============================================
// INIT
// ============================================
onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
/* ============================================
   BASE
   ============================================ */
.backup-restore-page { padding: 8px 0; }

/* ============================================
   STATS
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8ecf1;
  transition: 0.2s;
}
.stat-card:hover { border-color: #c7d2fe; }
.stat-icon { font-size: 32px; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 22px; font-weight: 700; color: #1a2332; }
.stat-label { font-size: 13px; color: #6b7a8f; }

/* ============================================
   CARDS
   ============================================ */
.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #e8ecf1;
}
.section-card:last-child { margin-bottom: 0; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.section-icon { font-size: 28px; line-height: 1; }
.section-title h3 { font-size: 18px; font-weight: 600; color: #1a2332; margin: 0 0 4px; }
.section-subtitle { font-size: 14px; color: #6b7a8f; margin: 0; }

.backup-stats { display: flex; gap: 8px; }
.stat-badge {
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

/* ============================================
   BACKUP ACTIONS
   ============================================ */
.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.backup-info-bar {
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
  font-size: 13px;
  color: #6b7a8f;
}

.btn-primary {
  padding: 10px 28px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-secondary {
  padding: 10px 24px;
  background: #f1f5f9;
  color: #1a2332;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-secondary:hover { background: #e2e8f0; border-color: #4f46e5; }

.btn-restore-file {
  padding: 10px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-restore-file:hover { background: #059669; }

.btn-danger {
  padding: 8px 18px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-warning {
  padding: 8px 18px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-warning:hover:not(:disabled) { background: #d97706; }
.btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-cancel {
  padding: 8px 20px;
  background: white;
  color: #4a5568;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-cancel:hover { background: #f8fafc; }

.btn-restore-confirm {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.btn-restore-confirm:hover:not(:disabled) { background: #4338ca; }
.btn-restore-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-remove-file {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-remove-file:hover { background: #fecaca; }

/* ============================================
   BACKUP LIST
   ============================================ */
.backup-list { min-height: 100px; }

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.empty-state p { margin: 4px 0; }
.empty-hint { font-size: 13px; color: #cbd5e1; }

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: 0.2s;
  border: 1px solid transparent;
}
.backup-item:hover { background: #f1f5f9; border-color: #e8ecf1; }

.backup-info { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.backup-main { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.backup-name { font-weight: 600; color: #1a2332; font-size: 14px; }

.backup-type {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 12px;
  border-radius: 12px;
  text-transform: uppercase;
}
.backup-type.full { background: #dbeafe; color: #2563eb; }
.backup-type.table { background: #d1fae5; color: #059669; }
.backup-type.partial { background: #fef3c7; color: #d97706; }

.backup-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 12px;
  border-radius: 12px;
}
.backup-status.completed { background: #d1fae5; color: #059669; }
.backup-status.pending { background: #fef3c7; color: #d97706; }
.backup-status.failed { background: #fee2e2; color: #dc2626; }

.backup-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.backup-date { font-size: 13px; color: #6b7a8f; }
.backup-size { font-size: 13px; color: #94a3b8; background: #e8ecf1; padding: 2px 10px; border-radius: 12px; }

.backup-actions { display: flex; gap: 6px; flex-shrink: 0; }

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: 0.2s;
  background: transparent;
}
.btn-icon:hover { background: #e0f2fe; }
.btn-icon.download:hover { background: #e0f2fe; }
.btn-icon.restore:hover { background: #d1fae5; }
.btn-icon.delete:hover { background: #fee2e2; }
.btn-icon.danger:hover { background: #fee2e2; }

/* ============================================
   PAGINATION
   ============================================ */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e8ecf1;
  flex-wrap: wrap;
  gap: 12px;
}
.pagination-info { font-size: 13px; color: #6b7a8f; }
.pagination-controls { display: flex; align-items: center; gap: 6px; }

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
  color: #1a2332;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #4f46e5; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-number { padding: 6px 14px; font-weight: 600; font-size: 14px; color: #1a2332; min-width: 60px; text-align: center; }

/* ============================================
   TABLE MANAGEMENT
   ============================================ */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.search-box { flex: 1; min-width: 200px; }
.search-input {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: 0.2s;
}
.search-input:focus { outline: none; border-color: #4f46e5; }
.table-actions { display: flex; gap: 8px; }

.table-list {
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 100px 100px 180px;
  padding: 10px 16px;
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  border-bottom: 1px solid #e8ecf1;
  gap: 8px;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 100px 100px 180px;
  padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  transition: 0.2s;
  gap: 8px;
}
.table-row:hover { background: #f8fafc; }
.table-row.selected { background: #eef2ff; }
.table-row:last-child { border-bottom: none; }

.col-checkbox { display: flex; align-items: center; justify-content: center; }
.col-checkbox input[type="checkbox"] { width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer; }

.col-name { display: flex; align-items: center; gap: 8px; }
.table-name { font-weight: 500; font-size: 14px; color: #1a2332; }

.table-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}
.table-badge.empty { background: #f1f5f9; color: #94a3b8; }
.table-badge.small { background: #dbeafe; color: #2563eb; }
.table-badge.medium { background: #fef3c7; color: #d97706; }
.table-badge.large { background: #fee2e2; color: #dc2626; }

.col-records { font-size: 14px; color: #1a2332; text-align: center; }
.col-size { font-size: 14px; color: #6b7a8f; text-align: center; }
.col-actions { display: flex; gap: 4px; justify-content: flex-end; }

/* ============================================
   MODALS
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
}
.large-modal { max-width: 650px; }
.confirm-modal { max-width: 560px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8ecf1;
}
.modal-header h3 { font-size: 18px; font-weight: 600; color: #1a2332; margin: 0; }
.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
  transition: 0.2s;
}
.close:hover { color: #1a2332; }

.modal-body { padding: 24px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e8ecf1;
}

/* ============================================
   FORM
   ============================================ */
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #1a2332; margin-bottom: 6px; }
.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}
.form-control:focus { outline: none; border-color: #4f46e5; }

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1a2332;
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #4f46e5; }

/* ============================================
   RESTORE FILE
   ============================================ */
.file-drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 20px;
}
.file-drop-zone:hover { border-color: #4f46e5; background: #f8fafc; }

.drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.drop-icon { font-size: 48px; }
.drop-text { font-size: 15px; color: #1a2332; margin: 0; }
.drop-hint { font-size: 13px; color: #94a3b8; }

.file-selected {
  display: flex;
  align-items: center;
  gap: 16px;
}
.file-icon { font-size: 32px; }
.file-info { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
.file-name { font-weight: 500; color: #1a2332; }
.file-size { font-size: 13px; color: #6b7a8f; }

.restore-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.file-preview {
  margin-top: 16px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  overflow: hidden;
}
.file-preview h4 {
  margin: 0;
  padding: 10px 14px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid #e8ecf1;
}
.preview-content {
  max-height: 120px;
  overflow: auto;
  padding: 10px 14px;
}
.preview-content pre {
  margin: 0;
  font-size: 12px;
  color: #1a2332;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ============================================
   RESTORE
   ============================================ */
.restore-confirmation { text-align: center; }
.restore-icon { font-size: 48px; margin-bottom: 12px; }
.restore-confirmation h4 { font-size: 16px; color: #1a2332; margin: 0 0 16px; }
.restore-confirmation p { font-size: 14px; color: #4a5568; margin: 6px 0; }
.restore-warning {
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  margin: 16px 0;
  color: #dc2626;
}
.restore-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

/* ============================================
   CONFIRM
   ============================================ */
.delete-confirmation p { font-size: 14px; color: #4a5568; margin: 0 0 12px; }
.table-list { list-style: none; padding: 0; margin: 0 0 16px; }
.table-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 4px;
}
.table-name { font-weight: 500; color: #1a2332; }
.table-count { font-size: 13px; color: #6b7a8f; }

.danger-text {
  color: #dc2626;
  font-size: 14px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.confirm-input { display: flex; flex-direction: column; gap: 6px; }
.confirm-input label { font-size: 13px; font-weight: 500; color: #4a5568; }
.confirm-input-field {
  padding: 10px 14px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2px;
  transition: 0.2s;
}
.confirm-input-field:focus { outline: none; border-color: #4f46e5; }

/* ============================================
   SPINNER
   ============================================ */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .table-header, .table-row {
    grid-template-columns: 40px 1fr 80px 80px 160px;
  }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .backup-actions { flex-direction: column; }
  .backup-actions button { width: 100%; justify-content: center; }

  .backup-item { flex-direction: column; align-items: stretch; gap: 12px; }
  .backup-actions { justify-content: center; }

  .restore-options-grid { grid-template-columns: 1fr; }

  .table-header { display: none; }
  .table-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 12px 16px;
  }
  .table-row .col-checkbox { justify-content: flex-start; }
  .table-row .col-name { font-weight: 500; }
  .table-row .col-records::before { content: "Records: "; font-weight: 600; color: #475569; }
  .table-row .col-size::before { content: "Size: "; font-weight: 600; color: #475569; }
  .table-row .col-actions { justify-content: flex-start; }

  .table-controls { flex-direction: column; align-items: stretch; }
  .table-actions { flex-wrap: wrap; }
  .table-actions button { flex: 1; min-width: 100px; }

  .pagination { flex-direction: column; align-items: center; }
  .modal { width: 95%; max-width: 100%; }
  .modal-header, .modal-body, .modal-footer { padding: 16px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card { padding: 14px 16px; }
  .backup-main { flex-wrap: wrap; }
  .pagination-controls { flex-wrap: wrap; justify-content: center; }
}
</style>