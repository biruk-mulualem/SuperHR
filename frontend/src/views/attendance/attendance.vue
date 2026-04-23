<template>
  <div class="attendance-hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="hub-title">
        <span class="hub-icon">⏱️</span>
        <div>
          <h1>Attendance Log</h1>
          <p>Manage employee attendance</p>
        </div>
      </div>
      <div class="header-right">
          <router-link to="/LunchTracking" class="lunch-nav-btn">
  <span class="lunch-icon">🍽️</span>
  Lunch Break
  <span class="lunch-badge">
    <span class="badge-number">{{ LunchCount }}</span>

  </span>
</router-link>
        <button class="expired-btn" @click="openExpiredModal">
          <span>⚠️</span>
          Expired Late Approvals
          <span v-if="expiredCount > 0" class="expired-badge">{{
            expiredCount
          }}</span>
        </button>
        <router-link to="/pendingAbsentees" class="pending-nav-btn">
          <span class="pending-icon">⚠️</span>
          Pending Review
          <span v-if="pendingCount > 0" class="pending-badge">{{
            pendingCount
          }}</span>
        </router-link>
             
        <div class="hub-time">{{ currentTime }}</div>
      </div>
    </div>

    <!-- Stats Row with all status types -->
    <div class="stats-strip">
      <div class="stat-block">
        <div class="stat-value green">{{ summaryStats.present || 0 }}</div>
        <div class="stat-label">Present</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <div class="stat-value orange">{{ summaryStats.late || 0 }}</div>
        <div class="stat-label">Late</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <div class="stat-value red">{{ summaryStats.absent || 0 }}</div>
        <div class="stat-label">Absent</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <div class="stat-value blue">{{ summaryStats.sick || 0 }}</div>
        <div class="stat-label">Sick</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <div class="stat-value yellow">{{ summaryStats.leave || 0 }}</div>
        <div class="stat-label">On Leave</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <div class="stat-value purple">{{ summaryStats.total || 0 }}</div>
        <div class="stat-label">Total</div>
      </div>
    </div>

    <!-- Check-in/out Toggle Button -->
    <div class="toggle-section">
      <button class="toggle-btn" @click="showCheckinPanel = !showCheckinPanel">
        <span>{{ showCheckinPanel ? "▼" : "▶" }}</span>
        {{ showCheckinPanel ? "Hide Check-in Panel" : "Show Check-in Panel" }}
      </button>
    </div>

    <!-- Collapsible Check-in Panel -->
    <Transition name="slide">
      <div v-if="showCheckinPanel" class="checkin-panel">
        <div class="panel-header">
          <span class="panel-icon">🔄</span>
          <h3>Quick Check-in / Check-out</h3>
        </div>

        <!-- Search -->
        <div class="search-area">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, ID or employee code..."
              class="search-input"
              @input="debouncedSearch"
              @keyup.enter="selectFirstResult"
            />
            <button
              v-if="searchQuery"
              class="search-clear"
              @click="clearSearch"
            >
              ✕
            </button>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length" class="search-results">
            <div
              v-for="emp in searchResults"
              :key="emp.id"
              class="search-result"
              @click="selectEmployee(emp)"
            >
              <div class="result-avatar">
                <img
                  v-if="emp.profilePictureUrl"
                  :src="emp.profilePictureUrl"
                />
                <span v-else>{{
                  (emp.firstName?.[0] || "") + (emp.lastName?.[0] || "")
                }}</span>
              </div>
              <div class="result-info">
                <div class="result-name">
                  {{ emp.firstName }} {{ emp.lastName }}
                </div>
                <div class="result-code">
                  {{ emp.employeeCode }} • {{ emp.departmentName || "—" }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Employee -->
        <div v-if="selectedEmployee" class="selected-employee">
          <div class="selected-header">
            <div class="selected-avatar">
              <img
                v-if="selectedEmployee.profilePictureUrl"
                :src="selectedEmployee.profilePictureUrl"
              />
              <span v-else>{{
                (selectedEmployee.firstName?.[0] || "") +
                (selectedEmployee.lastName?.[0] || "")
              }}</span>
            </div>
            <div class="selected-details">
              <h4>
                {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
              </h4>
              <div class="selected-badges">
                <span>📛 {{ selectedEmployee.employeeCode }}</span>
                <span
                  >🏢 {{ selectedEmployee.departmentName || "No Dept" }}</span
                >
              </div>
            </div>
            <button class="selected-close" @click="clearSelected">✕</button>
          </div>

          <div class="info-cards">
            <div class="info-card">
              <div class="info-label">Check-In</div>
              <div class="info-value">
                {{ todaySchedule?.checkInTime || "--:--" }}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Check-Out</div>
              <div class="info-value">
                {{ todaySchedule?.checkOutTime || "--:--" }}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Shift</div>
              <div class="info-value">
                {{ todaySchedule?.shiftType === "day" ? "Day" : "Night" }}
              </div>
            </div>
          </div>

          <div class="status-cards">
            <div class="status-card">
              <div class="status-label">Check-In Status</div>
              <div class="status-data">
                <span class="status-time">{{
                  currentStatus?.checkInTime
                    ? formatTime(currentStatus.checkInTime)
                    : "—"
                }}</span>
                <span v-if="currentStatus?.isLate" class="status-tag late"
                  >Late {{ currentStatus.lateMinutes }}m</span
                >
                <span
                  v-else-if="currentStatus?.checkInTime"
                  class="status-tag success"
                  >On Time</span
                >
              </div>
            </div>
            <div class="status-card">
              <div class="status-label">Check-Out Status</div>
              <div class="status-data">
                <span class="status-time">{{
                  currentStatus?.checkOutTime
                    ? formatTime(currentStatus.checkOutTime)
                    : "—"
                }}</span>
                <span v-if="currentStatus?.totalHours" class="status-tag info"
                  >{{ currentStatus.totalHours }} hrs</span
                >
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button
              class="btn-checkin"
              :disabled="currentStatus?.isCheckedIn || processing"
              @click="recordCheckIn"
            >
              <span
                v-if="processing && actionType === 'checkin'"
                class="btn-spinner"
              ></span>
              <span v-else>✅</span>
              {{
                processing && actionType === "checkin"
                  ? "Processing..."
                  : "Check In"
              }}
            </button>
            <button
              class="btn-checkout"
              :disabled="
                !currentStatus?.isCheckedIn ||
                currentStatus?.isCheckedOut ||
                processing
              "
              @click="recordCheckOut"
            >
              <span
                v-if="processing && actionType === 'checkout'"
                class="btn-spinner"
              ></span>
              <span v-else>🏁</span>
              {{
                processing && actionType === "checkout"
                  ? "Processing..."
                  : "Check Out"
              }}
            </button>
          </div>

          <div v-if="currentStatus?.isHoliday" class="warning-message">
            🎉 Today is a holiday
          </div>
        </div>

        <div v-else-if="!searchQuery" class="empty-checkin">
          <div class="empty-icon">🔍</div>
          <p>Search for an employee to check in/out</p>
        </div>
      </div>
    </Transition>

    <!-- Today's Records Table -->
    <div class="records-section">
      <div class="records-header">
        <div class="header-left">
          <span class="header-icon">📋</span>
          <h3>Today's Attendance Records</h3>
        </div>
        <div class="header-right">
          <span class="update-time">Last updated: {{ lastUpdateTime }}</span>
          <button
            class="refresh-btn"
            @click="manualRefresh"
            :disabled="loadingRecords"
          >
            🔄
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <span>🔍</span>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Filter by name or code..."
            @input="applyFilters"
          />
        </div>
        <select
          v-model="filters.status"
          class="filter-select"
          @change="applyFilters"
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="sick">Sick</option>
          <option value="leave">On Leave</option>
          <option value="ontime">On Time</option>
          <option value="pending_late">Pending Late</option>
          <option value="pending_absent">Pending Absent</option>
        </select>
        <select
          v-model="filters.departmentId"
          class="filter-select"
          @change="applyFilters"
        >
          <option value="">All Departments</option>
          <option
            v-for="dept in departments"
            :key="dept.departmentId"
            :value="dept.departmentId"
          >
            {{ dept.name }}
          </option>
        </select>
      </div>

      <!-- Silent Loading -->
      <div v-if="silentLoading" class="silent-update">
        <div class="silent-spinner"></div>
        <span>Updating...</span>
      </div>

      <!-- Table with Loading State -->
      <div
        v-if="loadingRecords && !todayRecords.length"
        class="loading-container"
      >
        <div class="loader"></div>
        <span>Loading records...</span>
      </div>

      <div v-else-if="!todayRecords.length" class="empty-records">
        <span>📭</span>
        <p>No attendance records found for today</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Shift</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Morning</th>
              <th>Afternoon</th>
              <th>Late</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in todayRecords" :key="record.id">
              <td class="employee-cell">
                <div class="employee-info">
                  <div class="employee-avatar">
                    <img
                      v-if="record.profilePictureUrl"
                      :src="record.profilePictureUrl"
                      class="avatar-img"
                    />
                    <span v-else>{{
                      record.employeeName?.charAt(0) ||
                      record.employeeFirstName?.charAt(0) ||
                      "U"
                    }}</span>
                  </div>
                  <div class="employee-details">
                    <div class="employee-name">
                      {{
                        record.employeeName ||
                        `${record.employeeFirstName} ${record.employeeLastName}`
                      }}
                    </div>
                    <div class="employee-code">{{ record.employeeCode }}</div>
                  </div>
                </div>
              </td>
              <td class="dept-cell">{{ record.departmentName || "—" }}</td>
              <td class="shift-cell">
                <span
                  :class="[
                    'shift-badge',
                    record.shiftType === 'night' ? 'shift-night' : 'shift-day',
                  ]"
                >
                  {{ record.shiftType === "night" ? "Night" : "Day" }}
                </span>
              </td>
              <td class="time-cell">
                {{ record.checkInTime ? formatTime(record.checkInTime) : "—" }}
              </td>
              <td class="time-cell">
                {{
                  record.checkOutTime ? formatTime(record.checkOutTime) : "—"
                }}
              </td>
              <td class="status-cell">
                <span
                  :class="[
                    'morning-badge',
                    getMorningStatusClass(record.morningStatus),
                  ]"
                >
                  {{ getMorningStatusText(record.morningStatus) }}
                </span>
              </td>
              <td class="status-cell">
                <span
                  :class="[
                    'afternoon-badge',
                    getAfternoonStatusClass(record.afternoonStatus),
                  ]"
                >
                  {{ getAfternoonStatusText(record.afternoonStatus) }}
                </span>
              </td>
              <td class="late-cell">
                <span
                  :class="[
                    'late-minutes',
                    { 'has-late': record.lateMinutes > 0 },
                  ]"
                >
                  {{ record.lateMinutes > 0 ? `${record.lateMinutes}m` : "0m" }}
                </span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', getStatusClass(record)]">
                  {{ getStatusText(record) }}
                </span>
              </td>
              <td class="note-cell">
                <button
                  v-if="record.notes"
                  class="note-btn"
                  @click="openNoteModal(record)"
                >
                  📝
                </button>
                <span v-else class="no-note">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > pagination.limit" class="pagination">
        <button
          class="page-btn"
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
        >
          ← Previous
        </button>
        <span class="page-info"
          >{{ pagination.page }} / {{ pagination.totalPages }}</span
        >
        <button
          class="page-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Expired Pending Late Modal -->
    <div
      v-if="showExpiredModal"
      class="modal-overlay"
      @click.self="closeExpiredModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-content">
            <span class="warning-icon">⚠️</span>
            <div>
              <h3>Expired Late Approvals</h3>
              <p>
                Employees who were approved for late arrival but missed their
                deadline
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeExpiredModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="expiredLoading" class="loading-state">
            <div class="spinner"></div>
            <span>Loading expired records...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="!expiredRecords.length" class="empty-state">
            <span class="empty-icon">✅</span>
            <h4>No Expired Records</h4>
            <p>All pending late approvals are within their deadline</p>
          </div>

          <!-- Records List -->
          <div v-else class="records-list">
            <div class="records-header">
              <div class="select-all">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                <label>Select All ({{ expiredRecords.length }})</label>
              </div>
              <button
                v-if="expiredSelectedIds.length"
                class="mark-absent-btn"
                @click="markExpiredAsAbsent"
                :disabled="expiredProcessing"
              >
                <span v-if="expiredProcessing" class="btn-spinner"></span>
                <span v-else>✓</span>
                Mark Selected as Absent ({{ expiredSelectedIds.length }})
              </button>
            </div>

            <div class="records-grid">
              <div
                v-for="record in expiredRecords"
                :key="record.id"
                class="record-card"
                :class="{ selected: expiredSelectedIds.includes(record.id) }"
              >
                <div class="card-checkbox">
                  <input
                    type="checkbox"
                    :value="record.id"
                    v-model="expiredSelectedIds"
                    @change="updateSelectedIds"
                  />
                </div>

                <div class="card-content">
                  <div class="employee-info">
                    <div class="employee-avatar">
                      <img
                        v-if="record.employee?.profilePictureUrl"
                        :src="record.employee.profilePictureUrl"
                      />
                      <span v-else>
                        {{
                          (record.employee?.firstName?.[0] || "") +
                          (record.employee?.lastName?.[0] || "")
                        }}
                      </span>
                    </div>
                    <div class="employee-details">
                      <div class="employee-name">
                        {{ record.employee?.firstName }}
                        {{ record.employee?.lastName }}
                      </div>
                      <div class="employee-code">
                        {{ record.employee?.employeeCode }}
                      </div>
                    </div>
                  </div>

                  <div class="deadline-info">
                    <div class="info-row">
                      <span class="label">Deadline:</span>
                      <span class="value deadline">{{
                        record.allowUntilTime
                      }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Current Time:</span>
                      <span class="value">{{ expiredCurrentTime }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Time Passed:</span>
                      <span class="value time-passed">{{
                        calculateTimePassed(record.allowUntilTime)
                      }}</span>
                    </div>
                  </div>

                  <div class="notes-preview" v-if="record.notes">
                    <span class="label">Notes:</span>
                    <p class="notes">{{ truncateNotes(record.notes, 100) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" v-if="expiredRecords.length">
          <button class="btn-secondary" @click="closeExpiredModal">
            Close
          </button>
          <button
            class="btn-primary"
            @click="markExpiredAsAbsent"
            :disabled="!expiredSelectedIds.length || expiredProcessing"
          >
            <span v-if="expiredProcessing" class="btn-spinner"></span>
            <span v-else>✓</span>
            {{
              expiredProcessing
                ? "Processing..."
                : `Mark ${expiredSelectedIds.length} as Absent`
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Note Modal -->
    <div
      v-if="showNoteModal"
      class="modal-overlay"
      @click.self="closeNoteModal"
    >
      <div class="modal-content note-modal">
        <div class="modal-header">
          <h3>📝 Attendance Note</h3>
          <button class="modal-close" @click="closeNoteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="note-text">
            {{ selectedNoteRecord?.notes || "No notes available" }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-close" @click="closeNoteModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', toast.type]"
        >
          <span>{{ toast.type === "success" ? "✓" : "⚠" }}</span>
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import attendanceService from "@/stores/attendanceService";
import employeesService from "@/stores/employee";

// State
const showCheckinPanel = ref(false);
const showExpiredModal = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const selectedEmployee = ref(null);
const currentStatus = ref(null);
const todaySchedule = ref(null);
const todayRecords = ref([]);
const departments = ref([]);
const loadingRecords = ref(false);
const silentLoading = ref(false);
const processing = ref(false);
const actionType = ref(null);
const currentTime = ref("");
const lastUpdateTime = ref("");
const toasts = ref([]);
const pendingCount = ref(0);
const expiredCount = ref(0);
const LunchCount = ref(0);
const showNoteModal = ref(false);
const selectedNoteRecord = ref(null);

// Expired modal state
const expiredLoading = ref(false);
const expiredProcessing = ref(false);
const expiredRecords = ref([]);
const expiredSelectedIds = ref([]);
const expiredCurrentTime = ref("");

const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const filters = ref({ search: "", status: "", departmentId: "" });
const summaryStats = ref({
  present: 0,
  late: 0,
  absent: 0,
  sick: 0,
  leave: 0,
  total: 0,
});

let searchTimeout = null;
let refreshInterval = null;
let timeInterval = null;
let expiredTimeInterval = null;

const isAllSelected = computed(() => {
  return (
    expiredRecords.value.length > 0 &&
    expiredSelectedIds.value.length === expiredRecords.value.length
  );
});

const openExpiredModal = async () => {
  console.log("Opening expired modal...");
  // Fetch fresh data
  await fetchExpiredRecords();
  console.log("After fetch, records count:", expiredRecords.value.length);
  // Then open modal
  showExpiredModal.value = true;
};

const formatTime = (dt) => {
  if (!dt) return null;
  const date = new Date(dt);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateLastUpdateTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateExpiredCurrentTime = () => {
  const now = new Date();
  expiredCurrentTime.value = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const showToast = (msg, type = "success") => {
  const id = Date.now();
  toasts.value.push({ id, message: msg, type });
  setTimeout(
    () => (toasts.value = toasts.value.filter((t) => t.id !== id)),
    3000,
  );
};

const calculateTimePassed = (deadlineTime) => {
  if (!deadlineTime) return "N/A";

  const [deadlineHour, deadlineMinute] = deadlineTime.split(":");
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const deadlineMinutes =
    parseInt(deadlineHour) * 60 + parseInt(deadlineMinute);

  const minutesPassed = nowMinutes - deadlineMinutes;
  if (minutesPassed <= 0) return "Just passed";

  const hours = Math.floor(minutesPassed / 60);
  const minutes = minutesPassed % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
};

const truncateNotes = (notes, maxLength) => {
  if (!notes) return "No notes";
  if (notes.length <= maxLength) return notes;
  return notes.substring(0, maxLength) + "...";
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    expiredSelectedIds.value = [];
  } else {
    expiredSelectedIds.value = expiredRecords.value.map((r) => r.id);
  }
  console.log("Selected IDs after toggle:", expiredSelectedIds.value);
};

const applyFilters = () => {
  pagination.value.page = 1;
  fetchTodayRecords(false);
};

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchEmployees, 300);
};

const searchEmployees = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  try {
    const res = await employeesService.getEmployees({
      limit: 10,
      search: searchQuery.value,
    });
    if (res.success && res.data) {
      const term = searchQuery.value.toLowerCase();
      searchResults.value = res.data.filter((emp) => {
        const full = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return (
          full.includes(term) ||
          (emp.employeeCode || "").toLowerCase().includes(term)
        );
      });
    } else {
      searchResults.value = [];
    }
  } catch (err) {
    console.error("Search failed:", err);
    searchResults.value = [];
  }
};

const selectFirstResult = () => {
  if (searchResults.value.length) selectEmployee(searchResults.value[0]);
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

const selectEmployee = async (emp) => {
  const id = Number(emp.id);
  if (isNaN(id)) return showToast("Invalid employee", "error");
  selectedEmployee.value = emp;
  clearSearch();
  try {
    const [status, schedule] = await Promise.all([
      attendanceService.getTodayStatus(id),
      attendanceService.getTodaySchedule(id),
    ]);
    currentStatus.value = status;
    todaySchedule.value = schedule;
  } catch (err) {
    console.error("Failed to fetch employee data:", err);
    showToast("Failed to load employee data", "error");
  }
};

const clearSelected = () => {
  selectedEmployee.value = null;
  currentStatus.value = null;
  todaySchedule.value = null;
};

const fetchDepartments = async () => {
  try {
    const res = await employeesService.getDepartments();
    if (res.success && res.data) departments.value = res.data;
  } catch (err) {
    console.error("Failed to fetch departments:", err);
  }
};

const fetchPendingCount = async () => {
  try {
    const res = await attendanceService.getPendingAbsentees({
      page: 1,
      limit: 1,
    });
    if (res.success && res.pagination) {
      pendingCount.value = res.pagination.total;
    }
  } catch (err) {
    console.error("Failed to fetch pending count:", err);
  }
};

const fetchExpiredCount = async () => {
  try {
    const res = await attendanceService.getExpiredPendingLate();
    console.log("Count response:", res);
    if (res.success) {
      expiredCount.value = res.count || 0;
      console.log("Set expiredCount to:", expiredCount.value);
    }
  } catch (err) {
    console.error("Failed to fetch expired count:", err);
    expiredCount.value = 0;
  }
};

const fetchLunchCount = async () => {
  try {
    const response = await attendanceService.getLunchHistory({ page: 1, limit: 1 })
    if (response && response.success === true) {
      LunchCount.value = response.pagination?.total || response.count || 0
    }
  } catch (err) {
    console.error('Failed to fetch lunch count:', err)
    LunchCount.value = 0
  }
}

const fetchExpiredRecords = async () => {
  expiredLoading.value = true;
  try {
    const res = await attendanceService.getExpiredPendingLate();
    console.log("Full response:", res);

    if (res.success && res.data) {
      // Make sure we're setting the data correctly
      expiredRecords.value = res.data;
      console.log(
        "Set expiredRecords to:",
        expiredRecords.value.length,
        "records",
      );
      console.log("expiredRecords.value:", expiredRecords.value);
    } else {
      console.log("No data in response");
      expiredRecords.value = [];
    }
  } catch (error) {
    console.error("Failed to fetch expired records:", error);
    expiredRecords.value = [];
  } finally {
    expiredLoading.value = false;
  }
};

const markExpiredAsAbsent = async () => {
  console.log("Selected IDs before mark:", expiredSelectedIds.value);

  if (!expiredSelectedIds.value.length) {
    console.log("No IDs selected, returning");
    showToast("Please select at least one record", "error");
    return;
  }

  expiredProcessing.value = true;
  try {
    const payload = {
      recordIds: expiredSelectedIds.value,
    };
    console.log("Sending payload:", payload);

    const res = await attendanceService.markExpiredAsAbsent(expiredSelectedIds.value);
    console.log("Response:", res);

    if (res.success) {
      await fetchExpiredRecords();
      await fetchTodayRecords(false);
      await fetchPendingCount();
      await fetchExpiredCount();
      expiredSelectedIds.value = [];
      showToast(
        `Successfully marked ${expiredSelectedIds.value.length} employees as absent`,
        "success",
      );
    }
  } catch (error) {
    console.error("Failed to mark as absent:", error);
    showToast("Failed to mark as absent", "error");
  } finally {
    expiredProcessing.value = false;
  }
};

const closeExpiredModal = () => {
  showExpiredModal.value = false;
  expiredSelectedIds.value = [];
};

const fetchTodayRecords = async (showSilent = true) => {
  if (showSilent && !loadingRecords.value) {
    silentLoading.value = true;
  }

  loadingRecords.value = true;

  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await attendanceService.getAllTodayAttendance(today, {
      search: filters.value.search,
      status: filters.value.status,
      departmentId: filters.value.departmentId,
      page: pagination.value.page,
      limit: pagination.value.limit,
    });

    if (res.success) {
      todayRecords.value = res.data || [];
      updateLastUpdateTime();

      pagination.value = {
        page: res.page || 1,
        limit: res.limit || 10,
        total: res.total || 0,
        totalPages: res.totalPages || 0,
      };

      if (res.summary) {
        summaryStats.value = res.summary;
      }
    } else {
      showToast("Failed to load attendance records", "error");
    }
  } catch (err) {
    console.error("Failed to fetch records:", err);
    showToast("Error loading attendance data", "error");
  } finally {
    loadingRecords.value = false;
    if (showSilent) {
      setTimeout(() => {
        silentLoading.value = false;
      }, 300);
    }
  }
};

const manualRefresh = async () => {
  loadingRecords.value = true;
  await fetchTodayRecords(false);
  await fetchPendingCount();
  await fetchExpiredCount();
  loadingRecords.value = false;
  showToast("Records refreshed", "success");
};

const changePage = (page) => {
  pagination.value.page = page;
  fetchTodayRecords(false);
};

const recordCheckIn = async () => {
  if (!selectedEmployee.value)
    return showToast("Select employee first", "error");

  const id = Number(selectedEmployee.value.id);
  if (isNaN(id)) return showToast("Invalid employee ID", "error");

  processing.value = true;
  actionType.value = "checkin";

  try {
    const response = await attendanceService.recordCheckIn(id);
    showToast(
      response.message ||
        `${selectedEmployee.value.firstName} checked in successfully`,
      "success",
    );
    await Promise.all([
      fetchTodayRecords(true),
      fetchPendingCount(),
      fetchExpiredCount(),
      attendanceService
        .getTodayStatus(id)
        .then((set) => (currentStatus.value = set)),
    ]);
  } catch (err) {
    const errorMsg =
      err.response?.data?.error || err.message || "Check-in failed";
    showToast(errorMsg, "error");
  } finally {
    processing.value = false;
    actionType.value = null;
  }
};

const recordCheckOut = async () => {
  if (!selectedEmployee.value)
    return showToast("Select employee first", "error");

  const id = Number(selectedEmployee.value.id);
  if (isNaN(id)) return showToast("Invalid employee ID", "error");

  processing.value = true;
  actionType.value = "checkout";

  try {
    const response = await attendanceService.recordCheckOut(id);
    showToast(
      response.message ||
        `${selectedEmployee.value.firstName} checked out successfully`,
      "success",
    );
    await Promise.all([
      fetchTodayRecords(true),
      fetchPendingCount(),
      fetchExpiredCount(),
      attendanceService
        .getTodayStatus(id)
        .then((set) => (currentStatus.value = set)),
    ]);
  } catch (err) {
    const errorMsg =
      err.response?.data?.error || err.message || "Check-out failed";
    showToast(errorMsg, "error");
  } finally {
    processing.value = false;
    actionType.value = null;
  }
};

const openNoteModal = (record) => {
  selectedNoteRecord.value = record;
  showNoteModal.value = true;
};

const closeNoteModal = () => {
  showNoteModal.value = false;
  selectedNoteRecord.value = null;
};

const getMorningStatusClass = (status) => {
  if (status === "present") return "morning-present";
  if (status === "late") return "morning-late";
  if (status === "absent") return "morning-absent";
  if (status === "sick") return "morning-sick";
  if (status === "leave") return "morning-leave";
  if (status === "pending_late") return "morning-pending-late";
  return "morning-pending";
};

const getMorningStatusText = (status) => {
  if (status === "present") return "Present";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  if (status === "sick") return "Sick";
  if (status === "leave") return "Leave";
  if (status === "pending_late") return "Pending Late";
  return "Pending";
};

const getAfternoonStatusClass = (status) => {
  if (status === "present") return "afternoon-present";
  if (status === "late") return "afternoon-late";
  if (status === "absent") return "afternoon-absent";
  if (status === "sick") return "afternoon-sick";
  if (status === "leave") return "afternoon-leave";
  return "afternoon-pending";
};

const getAfternoonStatusText = (status) => {
  if (status === "present") return "Present";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  if (status === "sick") return "Sick";
  if (status === "leave") return "Leave";
  return "Pending";
};

const getStatusClass = (record) => {
  if (record.status === "PENDING_LATE") return "status-pending-late";
  if (record.status === "PENDING_ABSENT") return "status-pending-absent";
  if (record.status === "sick") return "status-sick";
  if (record.status === "leave") return "status-leave";
  if (record.status === "absent") return "status-absent";
  if (record.status === "late") return "status-late";
  if (record.status === "present") return "status-present";
  if (!record.checkInTime) return "status-absent";
  if (record.isLate) return "status-late";
  return "status-active";
};

const getStatusText = (record) => {
  if (record.status === "PENDING_LATE") return "Pending Late";
  if (record.status === "PENDING_ABSENT") return "Pending Absent";
  if (record.status === "sick") return "Sick";
  if (record.status === "leave") return "Leave";
  if (record.status === "absent") return "Absent";
  if (record.status === "late") return "Late";
  if (record.status === "present") return "Present";
  if (!record.checkInTime) return "Absent";
  if (record.isLate) return `Late`;
  return record.statusText || "Active";
};

onMounted(() => {
  fetchDepartments();
  fetchTodayRecords(false);
  fetchPendingCount();
  fetchExpiredCount();
  updateLastUpdateTime();
  fetchLunchCount();

  refreshInterval = setInterval(() => {
    fetchTodayRecords(true);
    fetchPendingCount();
    fetchExpiredCount();
  }, 30000);

  timeInterval = setInterval(updateCurrentTime, 1000);
  expiredTimeInterval = setInterval(updateExpiredCurrentTime, 1000);
  updateCurrentTime();
  updateExpiredCurrentTime();
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (timeInterval) clearInterval(timeInterval);
  if (expiredTimeInterval) clearInterval(expiredTimeInterval);
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<style scoped>
/* Add styles for pending statuses */
.status-pending-late {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #f59e0b;
}

.status-pending-absent {
  background: #fed7aa;
  color: #9a3412;
  border: 1px solid #ea580c;
}

.morning-pending-late {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #f59e0b;
}

/* Expired button styles */
.expired-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.expired-btn:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

.expired-badge {
  background: #ef4444;
  color: white;
  border-radius: 20px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
}

/* Modal styles */
.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eef2ff;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-icon {
  font-size: 28px;
}

.header-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.header-content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-all input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.mark-absent-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mark-absent-btn:hover:not(:disabled) {
  background: #dc2626;
}

.mark-absent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.records-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
  transition: all 0.2s;
  background: white;
}

.record-card.selected {
  border-color: #ef4444;
  background: #fef2f2;
}

.card-checkbox {
  padding-top: 4px;
}

.card-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.card-content {
  flex: 1;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.employee-avatar {
  width: 48px;
  height: 48px;
  background: #e0e7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: #4f46e5;
  overflow: hidden;
}

.employee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  margin-bottom: 2px;
}

.employee-code {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.deadline-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

/* Lunch Navigation Button */
.lunch-nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #10b981;
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.lunch-nav-btn:hover {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.lunch-icon {
  font-size: 14px;
}

.lunch-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #10b981;
  border-radius: 30px;
  padding: 2px 8px;
  margin-left: 4px;
}

.badge-number {
  color: white;
  font-size: 11px;
  font-weight: 700;
}

.badge-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
}

/* Animate when there are active lunches */
.lunch-nav-btn.has-active {
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row .label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.info-row .value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.info-row .value.deadline {
  color: #ef4444;
}

.info-row .value.time-passed {
  color: #ef4444;
  font-weight: 700;
}

.notes-preview {
  margin-top: 8px;
}

.notes-preview .label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

.notes {
  font-size: 11px;
  color: #475569;
  line-height: 1.4;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eef2ff;
}

.btn-secondary {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-primary {
  padding: 8px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #dc2626;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

/* Rest of your existing styles remain exactly the same */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.attendance-hub {
  min-height: 100vh;
  background: #f0f2f6;
  padding: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.hub-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hub-icon {
  font-size: 28px;
}

.hub-title h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.hub-title p {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pending-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  border: 1px solid #f59e0b;
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  color: #d97706;
  text-decoration: none;
  transition: all 0.2s;
}

.pending-nav-btn:hover {
  background: linear-gradient(135deg, #fde68a, #fef3c7);
  transform: translateY(-1px);
}

.pending-badge {
  background: #ef4444;
  color: white;
  border-radius: 20px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
}

.hub-time {
  background: white;
  padding: 6px 16px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stats-strip {
  background: white;
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 12px;
}

.stat-block {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
}

.stat-value.green {
  color: #10b981;
}
.stat-value.orange {
  color: #f59e0b;
}
.stat-value.red {
  color: #ef4444;
}
.stat-value.blue {
  color: #3b82f6;
}
.stat-value.yellow {
  color: #eab308;
}
.stat-value.purple {
  color: #8b5cf6;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #e2e8f0;
}

.toggle-section {
  margin-bottom: 16px;
}

.toggle-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 500;
  color: #4f46e5;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
}

.checkin-panel {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2ff;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-area {
  position: relative;
  margin-bottom: 16px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 35px;
  border: 1.5px solid #e2e8f0;
  border-radius: 40px;
  font-size: 13px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #94a3b8;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 6px;
}

.search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.search-result:hover {
  background: #f8fafc;
}

.result-avatar {
  width: 36px;
  height: 36px;
  background: #e0e7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  color: #4f46e5;
  overflow: hidden;
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.result-code {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.selected-employee {
  margin-top: 8px;
}

.selected-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.selected-avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
}

.selected-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-details {
  flex: 1;
}

.selected-details h4 {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.selected-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.selected-badges span {
  font-size: 10px;
  padding: 3px 8px;
  background: #f1f5f9;
  border-radius: 20px;
  color: #475569;
}

.selected-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-close:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.info-card {
  background: #f8fafc;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
}

.info-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.info-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.status-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.status-card {
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
}

.status-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}

.status-data {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
}

.status-time {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.btn-checkin,
.btn-checkout {
  flex: 1;
  padding: 10px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-checkin {
  background: #3b82f6;
  color: white;
}

.btn-checkin:hover:not(:disabled) {
  background: #2563eb;
}

.btn-checkout {
  background: #10b981;
  color: white;
}

.btn-checkout:hover:not(:disabled) {
  background: #059669;
}

.btn-checkin:disabled,
.btn-checkout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.warning-message {
  margin-top: 10px;
  padding: 8px;
  background: #dbeafe;
  border-radius: 10px;
  font-size: 11px;
  text-align: center;
  color: #2563eb;
}

.empty-checkin {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.records-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2ff;
  flex-wrap: wrap;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.update-time {
  font-size: 10px;
  color: #94a3b8;
}

.refresh-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 20px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #f1f5f9;
}

.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-group {
  position: relative;
  flex: 1;
  min-width: 160px;
}

.filter-group span {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  opacity: 0.6;
}

.filter-group input {
  width: 100%;
  padding: 8px 10px 8px 28px;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  font-size: 12px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.silent-update {
  position: fixed;
  bottom: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 12px;
  border-radius: 30px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeOut 2s ease forwards;
}

.silent-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.data-table th {
  text-align: left;
  padding: 12px 8px;
  color: #64748b;
  font-weight: 600;
  border-bottom: 2px solid #eef2ff;
  background: white;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.employee-cell {
  min-width: 160px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  background: #eef2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #4f46e5;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-details {
  flex: 1;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 12px;
  margin-bottom: 2px;
}

.employee-code {
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
}

.dept-cell {
  color: #475569;
  font-size: 11px;
}

.daytype-badge,
.shift-badge,
.morning-badge,
.afternoon-badge,
.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.daytype-normal {
  background: #e0e7ff;
  color: #4f46e5;
}

.daytype-holiday {
  background: #fed7aa;
  color: #9a3412;
}

.daytype-weekend {
  background: #e2e8f0;
  color: #475569;
}

.shift-day {
  background: #dbeafe;
  color: #2563eb;
}

.shift-night {
  background: #e0e7ff;
  color: #4f46e5;
}

.morning-present,
.afternoon-present {
  background: #d1fae5;
  color: #059669;
}

.morning-late,
.afternoon-late {
  background: #fee2e2;
  color: #dc2626;
}

.morning-absent,
.afternoon-absent {
  background: #f1f5f9;
  color: #64748b;
}

.morning-sick,
.afternoon-sick {
  background: #dbeafe;
  color: #2563eb;
}

.morning-leave,
.afternoon-leave {
  background: #fef3c7;
  color: #d97706;
}

.morning-pending,
.afternoon-pending {
  background: #fef9c3;
  color: #ca8a04;
}

.status-present {
  background: #d1fae5;
  color: #059669;
}

.status-late {
  background: #fee2e2;
  color: #dc2626;
}

.status-absent {
  background: #f1f5f9;
  color: #64748b;
}

.status-sick {
  background: #dbeafe;
  color: #2563eb;
}

.status-leave {
  background: #fef3c7;
  color: #d97706;
}

.status-active {
  background: #fef3c7;
  color: #d97706;
}

.time-cell {
  font-family: monospace;
  font-size: 11px;
  color: #1e293b;
}

.late-cell {
  text-align: center;
}

.late-minutes {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.late-minutes.has-late {
  color: #dc2626;
  font-weight: 700;
}

.note-cell {
  text-align: center;
}

.note-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.note-btn:hover {
  background: #e2e8f0;
}

.no-note {
  color: #cbd5e1;
  font-size: 11px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #eef2ff;
}

.page-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #6366f1;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #94a3b8;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-records span {
  font-size: 40px;
  opacity: 0.5;
  display: block;
  margin-bottom: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 450px;
  max-width: 90%;
  overflow: hidden;
}

.note-modal {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2ff;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 16px 20px;
}

.note-text {
  background: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  border: 1px solid #eef2ff;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #eef2ff;
}

.btn-close {
  padding: 6px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #6366f1;
}

.toast-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toast {
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast.error {
  background: #ef4444;
  color: white;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
    visibility: hidden;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-active {
  position: absolute;
}

@media (max-width: 1200px) {
  .data-table {
    min-width: 900px;
  }
}

@media (max-width: 768px) {
  .attendance-hub {
    padding: 12px;
  }

  .stats-strip {
    padding: 10px 16px;
  }

  .stat-value {
    font-size: 22px;
  }

  .info-cards {
    grid-template-columns: 1fr;
  }

  .status-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .deadline-info {
    grid-template-columns: 1fr;
  }

  .records-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
