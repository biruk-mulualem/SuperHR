<template>
  <div class="compliance-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div>
          <h1>Document Compliance</h1>
          <p class="subtitle">Track employee document submission status</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 4v6h-6M1 16v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L19 10M1 14l4.64 4.36A9 9 0 0 0 18.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards with Summary Data -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-content">
          <span class="stat-number">{{ summaryStats.totalEmployees || 0 }}</span>
          <span class="stat-label">Total Employees</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-content">
          <span class="stat-number">{{ summaryStats.fullyCompliant || 0 }}</span>
          <span class="stat-label">Fully Compliant</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">❌</div>
        <div class="stat-content">
          <span class="stat-number">{{ summaryStats.missingDocuments || 0 }}</span>
          <span class="stat-label">Missing Documents</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📊</div>
        <div class="stat-content">
          <span class="stat-number">{{ summaryStats.complianceRate || '0' }}%</span>
          <span class="stat-label">Compliance Rate</span>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation with Missing Counts -->
    <div class="tabs-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-link', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-name">{{ tab.name }}</span>
        <span class="tab-badge" :class="getBadgeClass(tab.missingCount)">
          {{ tab.missingCount }} missing
        </span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- ID Card Tab -->
      <div v-show="activeTab === 'id_card'" class="tab-panel">
        <IDCardTab
          @update-count="updateTabCount('id_card', $event)"
          @view-employee="viewEmployee"
        />
      </div>

      <!-- Degree Tab -->
      <div v-show="activeTab === 'degree'" class="tab-panel">
        <DegreeTab
          @update-count="updateTabCount('degree', $event)"
          @view-employee="viewEmployee"
        />
      </div>

      <!-- Guarantee Tab -->
      <div v-show="activeTab === 'guarantee_letter'" class="tab-panel">
        <GuaranteeTab
          @update-count="updateTabCount('guarantee_letter', $event)"
          @view-employee="viewEmployee"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <span>Updated: {{ lastUpdated }}</span>
      <span>•</span>
      <span>{{ summaryStats.totalEmployees || 0 }} employees</span>
      <span>•</span>
      <span>{{ summaryStats.complianceRate || '0' }}% compliant</span>
      <span>•</span>
      <span>{{ summaryStats.fullyCompliant || 0 }} fully compliant</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";

// Import Tab Components
import IDCardTab from "./tabs/IDCardTab.vue";
import DegreeTab from "./tabs/DegreeTab.vue";
import GuaranteeTab from "./tabs/GuaranteeTab.vue";

const router = useRouter();

// ========== STATE ==========
const loading = ref(false);
const activeTab = ref('id_card');
const lastUpdated = ref(new Date().toLocaleString());

const departments = ref([]);

// ========== SUMMARY STATS ==========
const summaryStats = ref({
  totalEmployees: 0,
  fullyCompliant: 0,
  missingDocuments: 0,
  complianceRate: '0'
});

// ========== TAB MISSING COUNTS ==========
const tabMissingCounts = ref({
  id_card: 0,
  degree: 0,
  guarantee_letter: 0
});

// ========== TABS WITH MISSING COUNTS ==========
const tabs = computed(() => [
  { 
    id: 'id_card', 
    name: 'National ID', 
    icon: '🪪', 
    missingCount: tabMissingCounts.value.id_card 
  },
  { 
    id: 'degree', 
    name: 'Degree', 
    icon: '🎓', 
    missingCount: tabMissingCounts.value.degree 
  },
  { 
    id: 'guarantee_letter', 
    name: 'Guarantee', 
    icon: '📋', 
    missingCount: tabMissingCounts.value.guarantee_letter 
  }
]);

// ========== METHODS ==========
const goBack = () => router.push({ name: 'dashboard' });

const viewEmployee = (id) => {
  if (id) router.push(`/employees/${id}`);
};

const getBadgeClass = (count) => {
  if (count === 0) return 'badge-success';
  if (count <= 5) return 'badge-warning';
  return 'badge-critical';
};

const switchTab = (tabId) => {
  activeTab.value = tabId;
};

const updateTabCount = (tabId, count) => {
  tabMissingCounts.value[tabId] = count;
};

// ========== LOAD COMPLIANCE SUMMARY ==========
const loadComplianceSummary = async () => {
  try {
    const res = await employeeService.getComplianceSummary();
    if (res.success && res.data) {
      const data = res.data;
      summaryStats.value = {
        totalEmployees: data.totalEmployees || 0,
        fullyCompliant: data.fullyCompliant || 0,
        missingDocuments: data.missingDocuments || 0,
        complianceRate: data.overallRate?.toFixed(2) || '0.00'
      };
    }
  } catch (error) {
    console.error('Error loading compliance summary:', error);
  }
};

// ========== LOAD TAB MISSING COUNTS - FIXED ==========
const loadTabCounts = async () => {
  try {
    // ✅ Use the existing getComplianceSummary which has all the data
    const res = await employeeService.getComplianceSummary();
    
    if (res.success && res.data) {
      const data = res.data;
      
      // ID Card missing count
      tabMissingCounts.value.id_card = data.idCard?.missing || 0;
      
      // Degree missing count
      tabMissingCounts.value.degree = data.degree?.missing || 0;
      
      // Guarantee missing count (employees with 0 or 1 guarantee)
      tabMissingCounts.value.guarantee_letter = (data.guarantee?.missing || 0) + (data.guarantee?.needSecond || 0);
    }
  } catch (error) {
    console.error('Error loading tab counts:', error);
  }
};

// ========== LOAD DEPARTMENTS ==========
const loadDepartments = async () => {
  try {
    const deptRes = await employeeService.getDepartmentDistribution();
    if (deptRes.success && deptRes.data) {
      departments.value = deptRes.data.departments || [];
    }
  } catch (error) {
    console.error('Error loading departments:', error);
  }
};

// ========== LOAD ALL DATA ==========
const loadAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadComplianceSummary(),
      loadTabCounts(),
      loadDepartments()
    ]);
    lastUpdated.value = new Date().toLocaleString();
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadAllData();
};

// ========== WATCHERS ==========
// Watch for changes in tab counts to update the UI
watch(tabMissingCounts, () => {
  // The tabs computed property will automatically update
}, { deep: true });

// ========== LIFECYCLE ==========
onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.compliance-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fb;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  transform: translateX(-2px);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 2px 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Stats Grid - 4 Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #dcfce7; }
.stat-icon.red { background: #fef2f2; }
.stat-icon.purple { background: #ede9fe; }

.stat-content {
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 4px;
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 8px 16px 0;
  border: 1px solid #e2e8f0;
  border-bottom: none;
}

.tab-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.tab-link:hover {
  color: #0f172a;
  background: #f8fafc;
}

.tab-link.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

.tab-icon { font-size: 16px; }

.tab-badge {
  padding: 1px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-success { background: #dcfce7; color: #10b981; }
.badge-warning { background: #fef3c7; color: #f59e0b; }
.badge-critical { background: #fef2f2; color: #ef4444; }

.tab-content {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-top: none;
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Footer */
.page-footer {
  margin-top: 24px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .compliance-page { padding: 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { flex-wrap: wrap; }
  .header-actions { justify-content: flex-start; }
  .tabs-nav { flex-wrap: wrap; gap: 0; }
  .tab-link { flex: 1; justify-content: center; padding: 10px 12px; font-size: 12px; }
  .tab-badge { display: none; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>