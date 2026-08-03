<template>
  <div class="document-tab">
    <!-- Tab Controls -->
    <div class="tab-controls">
      <div class="toggle-group">
        <button
          :class="['toggle-btn', { active: view === 'missing' }]"
          @click="$emit('change-view', 'missing')"
        >
          <span class="toggle-icon">⚠️</span>
          Missing
          <span class="toggle-count">{{ missingData.length }}</span>
        </button>
        <button
          :class="['toggle-btn', { active: view === 'submitted' }]"
          @click="$emit('change-view', 'submitted')"
        >
          <span class="toggle-icon">✅</span>
          Submitted
          <span class="toggle-count">{{ submittedData.length }}</span>
        </button>
      </div>
      <div class="search-wrapper-small">
        <input
          type="text"
          v-model="localSearch"
          placeholder="🔍 Search employees..."
          class="search-input-small"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- Missing View -->
    <div v-if="view === 'missing'" class="table-container">
      <div class="table-header">
        <h4>⚠️ Employees Missing {{ title }}</h4>
        <span class="table-stats">{{ missingData.length }} total employees</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, idx) in paginatedMissing"
              :key="emp.id"
              @click="$emit('view-employee', emp.id)"
              class="clickable-row"
            >
              <td class="text-center">{{ getMissingRowIndex(idx) }}</td>
              <td>
                <div class="employee-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <span class="employee-name">{{ emp.fullName }}</span>
                </div>
              </td>
              <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
              <td>{{ emp.position || 'N/A' }}</td>
              <td>{{ emp.email || 'N/A' }}</td>
              <td>
                <button class="btn-remind" @click.stop="remindEmployee(emp)">
                  📧 Remind
                </button>
              </td>
            </tr>
            <tr v-if="paginatedMissing.length === 0">
              <td colspan="6" class="empty-state">
                ✅ All employees have submitted {{ title }}!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination for Missing -->
      <div class="pagination" v-if="missingPagination.totalPages > 1">
        <button
          @click="changeMissingPage(missingPagination.page - 1)"
          :disabled="!missingPagination.hasPrevPage"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ missingPagination.page }} of {{ missingPagination.totalPages }}
        </span>
        <button
          @click="changeMissingPage(missingPagination.page + 1)"
          :disabled="!missingPagination.hasNextPage"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Submitted View -->
    <div v-if="view === 'submitted'" class="table-container">
      <div class="table-header">
        <h4>📄 Employees Who Submitted {{ title }}</h4>
        <span class="table-stats">{{ submittedData.length }} total employees</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Submitted Date</th>
              <th>Age</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, idx) in paginatedSubmitted"
              :key="emp.id"
              @click="$emit('view-employee', emp.id)"
              class="clickable-row"
            >
              <td class="text-center">{{ getSubmittedRowIndex(idx) }}</td>
              <td>
                <div class="employee-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <span class="employee-name">{{ emp.fullName }}</span>
                </div>
              </td>
              <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
              <td>{{ emp.position || 'N/A' }}</td>
              <td>{{ formatDate(emp.submittedDate) }}</td>
              <td>
                <span :class="['age-badge', getAgeClass(emp.monthsOld)]">
                  {{ emp.monthsOld || 0 }} months
                </span>
              </td>
              <td>
                <span :class="['status-badge', getStatusClass(emp.status)]">
                  {{ getStatusLabel(emp.status) }}
                </span>
              </td>
              <td>
                <button class="btn-view" @click.stop="$emit('view-employee', emp.id)">
                  👁 View
                </button>
              </td>
            </tr>
            <tr v-if="paginatedSubmitted.length === 0">
              <td colspan="8" class="empty-state">
                No submitted {{ title }} found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination for Submitted -->
      <div class="pagination" v-if="submittedPagination.totalPages > 1">
        <button
          @click="changeSubmittedPage(submittedPagination.page - 1)"
          :disabled="!submittedPagination.hasPrevPage"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ submittedPagination.page }} of {{ submittedPagination.totalPages }}
        </span>
        <button
          @click="changeSubmittedPage(submittedPagination.page + 1)"
          :disabled="!submittedPagination.hasNextPage"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '📄' },
  missingData: { type: Array, default: () => [] },
  submittedData: { type: Array, default: () => [] },
  view: { type: String, default: 'missing' }
});

const emit = defineEmits(['change-view', 'search', 'view-employee']);

const localSearch = ref('');
const missingPagination = ref({ page: 1, limit: 20, totalPages: 1, hasPrevPage: false, hasNextPage: false });
const submittedPagination = ref({ page: 1, limit: 20, totalPages: 1, hasPrevPage: false, hasNextPage: false });

const filteredMissing = computed(() => {
  if (!localSearch.value) return props.missingData;
  const s = localSearch.value.toLowerCase();
  return props.missingData.filter(emp =>
    emp.fullName.toLowerCase().includes(s) ||
    emp.department?.toLowerCase().includes(s) ||
    emp.position?.toLowerCase().includes(s) ||
    emp.email?.toLowerCase().includes(s)
  );
});

const filteredSubmitted = computed(() => {
  if (!localSearch.value) return props.submittedData;
  const s = localSearch.value.toLowerCase();
  return props.submittedData.filter(emp =>
    emp.fullName.toLowerCase().includes(s) ||
    emp.department?.toLowerCase().includes(s) ||
    emp.position?.toLowerCase().includes(s) ||
    emp.email?.toLowerCase().includes(s)
  );
});

const paginatedMissing = computed(() => {
  const start = (missingPagination.value.page - 1) * missingPagination.value.limit;
  const end = start + missingPagination.value.limit;
  return filteredMissing.value.slice(start, end);
});

const paginatedSubmitted = computed(() => {
  const start = (submittedPagination.value.page - 1) * submittedPagination.value.limit;
  const end = start + submittedPagination.value.limit;
  return filteredSubmitted.value.slice(start, end);
});

const getMissingRowIndex = (idx) => idx + 1 + (missingPagination.value.page - 1) * missingPagination.value.limit;
const getSubmittedRowIndex = (idx) => idx + 1 + (submittedPagination.value.page - 1) * submittedPagination.value.limit;

const updateMissingPagination = () => {
  const total = filteredMissing.value.length;
  const limit = 20;
  missingPagination.value.totalPages = Math.max(1, Math.ceil(total / limit));
  missingPagination.value.hasNextPage = missingPagination.value.page < missingPagination.value.totalPages;
  missingPagination.value.hasPrevPage = missingPagination.value.page > 1;
  if (missingPagination.value.page > missingPagination.value.totalPages) {
    missingPagination.value.page = missingPagination.value.totalPages;
  }
};

const updateSubmittedPagination = () => {
  const total = filteredSubmitted.value.length;
  const limit = 20;
  submittedPagination.value.totalPages = Math.max(1, Math.ceil(total / limit));
  submittedPagination.value.hasNextPage = submittedPagination.value.page < submittedPagination.value.totalPages;
  submittedPagination.value.hasPrevPage = submittedPagination.value.page > 1;
  if (submittedPagination.value.page > submittedPagination.value.totalPages) {
    submittedPagination.value.page = submittedPagination.value.totalPages;
  }
};

const changeMissingPage = (page) => {
  if (page >= 1 && page <= missingPagination.value.totalPages) {
    missingPagination.value.page = page;
  }
};

const changeSubmittedPage = (page) => {
  if (page >= 1 && page <= submittedPagination.value.totalPages) {
    submittedPagination.value.page = page;
  }
};

const handleSearch = () => {
  missingPagination.value.page = 1;
  submittedPagination.value.page = 1;
  updateMissingPagination();
  updateSubmittedPagination();
  emit('search', localSearch.value);
};

const remindEmployee = (emp) => {
  alert(`Reminder sent to ${emp.fullName} for ${props.title}`);
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const getAgeClass = (months) => {
  if (!months) return '';
  if (months > 12) return 'age-critical';
  if (months > 6) return 'age-warning';
  if (months > 3) return 'age-attention';
  return 'age-ok';
};

const getStatusClass = (status) => {
  const classes = {
    valid: 'status-ok',
    recent: 'status-attention',
    expiring_soon: 'status-warning',
    expired: 'status-critical',
    missing: 'status-critical'
  };
  return classes[status] || 'status-ok';
};

const getStatusLabel = (status) => {
  const labels = {
    valid: '✅ Valid',
    recent: '📄 Recent',
    expiring_soon: '⚠️ Expiring Soon',
    expired: '🔴 Expired',
    missing: '❌ Missing'
  };
  return labels[status] || status;
};

watch(() => props.missingData, updateMissingPagination);
watch(() => props.submittedData, updateSubmittedPagination);
watch(localSearch, () => {
  missingPagination.value.page = 1;
  submittedPagination.value.page = 1;
  updateMissingPagination();
  updateSubmittedPagination();
});
</script>

<style scoped>
.document-tab {
  width: 100%;
}

.tab-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.toggle-group {
  display: flex;
  background: #f1f5f9;
  border-radius: 40px;
  padding: 4px;
  gap: 4px;
}

.toggle-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 30px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-btn.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #6366f1;
}

.toggle-count {
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.toggle-btn.active .toggle-count {
  background: #e0e7ff;
}

.search-wrapper-small {
  min-width: 200px;
}

.search-input-small {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  font-size: 13px;
  transition: all 0.2s;
}

.search-input-small:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.table-container {
  margin-top: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.table-stats {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  padding: 10px 14px;
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  font-size: 11px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.clickable-row {
  cursor: pointer;
}

.text-center {
  text-align: center;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
}

.dept-badge {
  background: #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: inline-block;
}

.age-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.age-ok { background: #dcfce7; color: #10b981; }
.age-attention { background: #dbeafe; color: #3b82f6; }
.age-warning { background: #fef3c7; color: #f59e0b; }
.age-critical { background: #fef2f2; color: #ef4444; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-ok { background: #dcfce7; color: #10b981; }
.status-attention { background: #dbeafe; color: #3b82f6; }
.status-warning { background: #fef3c7; color: #f59e0b; }
.status-critical { background: #fef2f2; color: #ef4444; }

.btn-remind {
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remind:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.btn-view {
  padding: 4px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.empty-state {
  text-align: center;
  padding: 30px !important;
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.pagination-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 768px) {
  .tab-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toggle-group {
    justify-content: center;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>