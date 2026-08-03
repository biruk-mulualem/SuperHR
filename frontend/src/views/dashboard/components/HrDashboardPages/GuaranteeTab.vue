<template>
  <div class="guarantee-tab">
    <!-- Filters -->
    <div class="filter-controls">
      <div class="filter-group">
        <button
          :class="['filter-btn', { active: filter === 'missing' }]"
          @click="$emit('change-filter', 'missing')"
        >
          <span class="dot red"></span>
          No Guarantee ({{ missingData.length }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'one' }]"
          @click="$emit('change-filter', 'one')"
        >
          <span class="dot orange"></span>
          Only 1 ({{ needSecondData.length }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'two' }]"
          @click="$emit('change-filter', 'two')"
        >
          <span class="dot green"></span>
          Has 2 ({{ withTwoData.length }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'all' }]"
          @click="$emit('change-filter', 'all')"
        >
          <span class="dot blue"></span>
          All ({{ allData.length }})
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

    <!-- Table -->
    <div class="table-container">
      <div class="table-header">
        <h4>📋 Guarantee Letter Status</h4>
        <span class="table-stats">{{ filteredData.length }} total employees</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Guarantees</th>
              <th v-if="filter !== 'missing'">Latest Date</th>
              <th v-if="filter !== 'missing'">Latest Age</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, idx) in paginatedData"
              :key="emp.id"
              @click="$emit('view-employee', emp.id)"
              class="clickable-row"
            >
              <td class="text-center">{{ getRowIndex(idx) }}</td>
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
              <td>
                <span :class="['guarantee-badge', getGuaranteeCountClass(emp.guaranteeCount)]">
                  {{ emp.guaranteeCount || 0 }}
                </span>
              </td>
              <td v-if="filter !== 'missing'">{{ formatDate(emp.latestDate) }}</td>
              <td v-if="filter !== 'missing'">
                <span :class="['age-badge', getAgeClass(emp.latestAge)]">
                  {{ emp.latestAge || 'N/A' }}
                  {{ emp.latestAge ? 'months' : '' }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', getGuaranteeStatusClass(emp)]">
                  {{ getGuaranteeStatusLabel(emp) }}
                </span>
              </td>
              <td>
                <button
                  v-if="emp.guaranteeCount < 2"
                  class="btn-request"
                  @click.stop="requestGuarantee(emp)"
                >
                  📧 Request
                </button>
                <button
                  v-else
                  class="btn-view"
                  @click.stop="$emit('view-employee', emp.id)"
                >
                  👁 View
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="filter !== 'missing' ? 9 : 7" class="empty-state">
                No employees found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="!pagination.hasPrevPage"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="!pagination.hasNextPage"
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
  allData: { type: Array, default: () => [] },
  missingData: { type: Array, default: () => [] },
  needSecondData: { type: Array, default: () => [] },
  withTwoData: { type: Array, default: () => [] },
  filter: { type: String, default: 'missing' }
});

const emit = defineEmits(['change-filter', 'search', 'view-employee']);

const localSearch = ref('');
const pagination = ref({ page: 1, limit: 20, totalPages: 1, hasPrevPage: false, hasNextPage: false });

const filteredData = computed(() => {
  let source = [];
  switch (props.filter) {
    case 'missing': source = props.missingData; break;
    case 'one': source = props.needSecondData; break;
    case 'two': source = props.withTwoData; break;
    default: source = props.allData;
  }
  
  if (!localSearch.value) return source;
  const s = localSearch.value.toLowerCase();
  return source.filter(emp =>
    emp.fullName.toLowerCase().includes(s) ||
    emp.department?.toLowerCase().includes(s) ||
    emp.position?.toLowerCase().includes(s) ||
    emp.email?.toLowerCase().includes(s)
  );
});

const paginatedData = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit;
  const end = start + pagination.value.limit;
  return filteredData.value.slice(start, end);
});

const getRowIndex = (idx) => idx + 1 + (pagination.value.page - 1) * pagination.value.limit;

const updatePagination = () => {
  const total = filteredData.value.length;
  const limit = 20;
  pagination.value.totalPages = Math.max(1, Math.ceil(total / limit));
  pagination.value.hasNextPage = pagination.value.page < pagination.value.totalPages;
  pagination.value.hasPrevPage = pagination.value.page > 1;
  if (pagination.value.page > pagination.value.totalPages) {
    pagination.value.page = pagination.value.totalPages;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  updatePagination();
  emit('search', localSearch.value);
};

const requestGuarantee = (emp) => {
  const needed = 2 - (emp.guaranteeCount || 0);
  alert(`Request sent to ${emp.fullName} for ${needed} additional guarantee letter(s)`);
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

const getGuaranteeCountClass = (count) => {
  if (count === 0) return 'count-critical';
  if (count === 1) return 'count-warning';
  return 'count-success';
};

const getGuaranteeStatusClass = (emp) => {
  if (emp.guaranteeCount === 0) return 'status-critical';
  if (emp.guaranteeCount === 1) return 'status-warning';
  if (emp.latestAge > 12) return 'status-critical';
  if (emp.latestAge > 6) return 'status-warning';
  return 'status-ok';
};

const getGuaranteeStatusLabel = (emp) => {
  if (emp.guaranteeCount === 0) return '⚠️ No Guarantee';
  if (emp.guaranteeCount === 1) return '🟡 Need 1 more';
  if (emp.latestAge > 12) return '🔴 Expired';
  if (emp.latestAge > 6) return '🟠 Expiring Soon';
  return '✅ Compliant';
};

watch(() => props.filter, () => {
  pagination.value.page = 1;
  updatePagination();
});

watch([() => props.allData, () => props.missingData, () => props.needSecondData, () => props.withTwoData], updatePagination);
</script>

<style scoped>
.guarantee-tab {
  width: 100%;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 40px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.red { background: #ef4444; }
.dot.orange { background: #f59e0b; }
.dot.green { background: #10b981; }
.dot.blue { background: #6366f1; }

.search-wrapper-small {
  min-width: 200px;
}

.search-input-small {
  width: 100%;
  padding: 6px 16px;
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

.guarantee-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.count-success { background: #dcfce7; color: #10b981; }
.count-warning { background: #fef3c7; color: #f59e0b; }
.count-critical { background: #fef2f2; color: #ef4444; }

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
.status-warning { background: #fef3c7; color: #f59e0b; }
.status-critical { background: #fef2f2; color: #ef4444; }

.btn-request {
  padding: 4px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-request:hover {
  background: #d97706;
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
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    justify-content: center;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>