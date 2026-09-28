<!-- views/storemanagement/purchasinggroups/PurchasingGroups.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>👥 Purchasing Groups</h2>
        <span class="total-badge">{{ totalGroups }} Groups</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by group name, code, or member..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">
          ➕ New Group
        </button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select
        v-model="filterStatus"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== GROUPS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading groups...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="groups-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-code">Group Code</th>
            <th class="col-name">Group Name</th>
            <th class="col-members">Members</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedGroups.length === 0">
            <td colspan="6" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">👥</span>
                <p>No purchasing groups found</p>
                <button class="btn-secondary" @click="openCreateModal">
                  Create First Group
                </button>
              </div>
            </td>
          </tr>
          <template
            v-for="group in paginatedGroups"
            :key="group.id"
          >
            <tr :class="{ 'expanded-row': expandedRow === group.id }">
              <td class="text-center">
                <button
                  class="expand-btn"
                  @click="toggleExpand(group.id)"
                >
                  {{ expandedRow === group.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ group.code }}</td>
              <td class="name-cell">{{ group.name }}</td>
              <td>
                <div class="members-summary">
                  <span class="member-count">
                    {{ group.members?.length || 0 }} member(s)
                  </span>
                  <span class="member-names">
                    {{ getMemberNames(group.members) }}
                  </span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', group.status]">
                  {{ group.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="icon-btn"
                    @click="editGroup(group)"
                    title="Edit Group"
                  >
                    ✏️
                  </button>
                  <button
                    class="icon-btn"
                    @click="openMembersModal(group)"
                    title="Manage Members"
                  >
                    👤➕
                  </button>
                  <button
                    class="icon-btn delete-btn"
                    @click="openDeleteConfirm(group)"
                    title="Delete Group"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr
              v-if="expandedRow === group.id"
              class="detail-expand-row"
            >
              <td colspan="6">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Group Info Card -->
                    <div class="detail-card">
                      <div class="detail-card-header">
                        <h4>📋 Group Information</h4>
                        <span :class="['status-badge', group.status]">
                          {{ group.status }}
                        </span>
                      </div>

                      <div class="info-rows">
                        <div class="info-row">
                          <span class="info-label">Group Code</span>
                          <span class="info-value code-value">{{ group.code }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Group Name</span>
                          <span class="info-value">{{ group.name }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Description</span>
                          <span class="info-value">{{ group.description || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Created</span>
                          <span class="info-value">{{ formatDateTime(group.createdAt) }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Last Updated</span>
                          <span class="info-value">
                            {{ group.updatedAt ? formatDateTime(group.updatedAt) : '—' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Members Card -->
                    <div class="detail-card">
                      <div class="detail-card-header">
                        <h4>👥 Members</h4>
                        <span class="member-count-badge">
                          {{ group.members?.length || 0 }}
                        </span>
                      </div>

                      <div v-if="group.members && group.members.length > 0" class="members-list-expanded">
                        <div
                          v-for="member in group.members"
                          :key="member.id"
                          class="member-item"
                        >
                          <div class="member-avatar">
                            {{ getInitials(member.fullName || member.username) }}
                          </div>
                          <div class="member-info">
                            <div class="member-name">
                              {{ member.fullName || member.username }}
                            </div>
                            <div class="member-meta">
                              <span v-if="member.department" class="member-dept">
                                🏢 {{ member.department }}
                              </span>
                              <span class="member-role-inline">
                                {{ member.role || 'Member' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else class="no-members">
                        <span class="no-members-icon">👤</span>
                        <span>No members yet</span>
                        <button
                          class="btn-secondary small"
                          @click="openMembersModal(group)"
                        >
                          ➕ Add Members
                        </button>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="detail-actions">
                      <button
                        class="btn-edit-detail"
                        @click="editGroup(group)"
                      >
                        ✏️ Edit Group
                      </button>
                      <button
                        class="btn-members-detail"
                        @click="openMembersModal(group)"
                      >
                        👤➕ Manage Members
                      </button>
                      <button
                        class="btn-delete-detail"
                        @click="openDeleteConfirm(group)"
                      >
                        🗑️ Delete Group
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="totalGroups > 0">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <div
      v-if="showGroupModal"
      class="modal-overlay"
      @click.self="closeGroupModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            {{ editingGroup ? "✏️ Edit Group" : "➕ New Group" }}
          </h3>
          <button class="modal-close" @click="closeGroupModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveGroup">
            <!-- ✅ Group Code REMOVED (backend generates it) -->

            <div class="form-group">
              <label>Group Name *</label>
              <input
                v-model="groupForm.name"
                type="text"
                required
                class="form-input"
                placeholder="e.g., Purchasing Team A"
              />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                v-model="groupForm.description"
                rows="3"
                class="textarea-field"
                placeholder="Brief description of this group..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="groupForm.status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div v-if="groupErrors.length > 0" class="form-errors">
              <div v-for="error in groupErrors" :key="error" class="form-error">
                ⚠️ {{ error }}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeGroupModal">Cancel</button>
          <button
            class="btn-primary"
            @click="saveGroup"
            :disabled="saving"
          >
            {{ saving ? "Saving..." : editingGroup ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== MEMBERS MODAL ==================== -->
    <div
      v-if="showMembersModal"
      class="modal-overlay"
      @click.self="closeMembersModal"
    >
      <div class="modal-container members-modal">
        <div class="modal-header">
          <h3>👥 Manage Members — {{ selectedGroup?.name }}</h3>
          <button class="modal-close" @click="closeMembersModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- ============================================================ -->
          <!-- ADD MEMBERS (TOP) -->
          <!-- ============================================================ -->
          <div class="section-block">
            <div class="section-header">
              <h4>➕ Add Members</h4>
              <span class="section-hint">Click a user to add them to the group</span>
            </div>

            <div class="search-wrapper">
              <span class="search-icon-small">🔍</span>
              <input
                type="text"
                v-model="userSearchQuery"
                placeholder="Search users by name or email..."
                class="search-input"
              />
            </div>

            <div class="available-users-list">
              <div v-if="filteredAvailableUsers.length === 0" class="no-users">
                <span v-if="userSearchQuery">No users found</span>
                <span v-else>All users already added</span>
              </div>
              <div
                v-for="user in filteredAvailableUsers"
                :key="user.userId"
                class="user-row"
              >
                <div class="user-info">
                  <div class="member-avatar small">
                    {{ getInitials(user.fullName || user.username) }}
                  </div>
                  <div>
                    <div class="member-name">{{ user.fullName || user.username }}</div>
                    <div class="member-meta">
                      <span v-if="user.department" class="member-dept">
                        🏢 {{ user.department }}
                      </span>
                      <span class="member-role-inline">
                        {{ user.role || 'Member' }}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-add-member"
                  @click="addMember(user)"
                >
                  ➕ Add
                </button>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- CURRENT MEMBERS (BOTTOM) -->
          <!-- ============================================================ -->
          <div class="section-block">
            <div class="section-header">
              <h4>👥 Current Members ({{ selectedGroupMembers.length }})</h4>
              <span class="section-hint">These users are already in the group</span>
            </div>

            <div v-if="selectedGroupMembers.length > 0" class="members-list">
              <div
                v-for="member in selectedGroupMembers"
                :key="member.id"
                class="member-row"
              >
                <div class="member-avatar">
                  {{ getInitials(member.fullName || member.username) }}
                </div>
                <div class="member-info">
                  <div class="member-name">
                    {{ member.fullName || member.username }}
                  </div>
                  <div class="member-meta">
                    <span v-if="member.department" class="member-dept">
                      🏢 {{ member.department }}
                    </span>
                    <span class="member-role-inline">
                      {{ member.role || 'Member' }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-remove-member"
                  @click="removeMember(member)"
                  title="Remove member"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
            <div v-else class="no-members">
              <span class="no-members-icon">👤</span>
              <span>No members yet. Add some above.</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeMembersModal">Close</button>
          <button class="btn-primary" @click="saveMembers">
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== DELETE CONFIRM MODAL ==================== -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>⚠️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🗑️</div>
          <p class="confirmation-title">
            Are you sure you want to delete this group?
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Group Code:</span>
              <span class="detail-value">{{ deleteTarget?.code }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Group Name:</span>
              <span class="detail-value">{{ deleteTarget?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Members:</span>
              <span class="detail-value">{{ deleteTarget?.members?.length || 0 }}</span>
            </div>
          </div>
          <p class="warning-text">
            ⚠️ This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">
            Delete Group
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import purchasingGroupService, {
  PurchasingGroup,
  PurchasingGroupMember,
  AvailableUser,
} from "@/stores/purchasingGroupService";

// ================================================================
// TYPES  (kept for compatibility with the template)
// ================================================================
type GroupMember = PurchasingGroupMember;
type User = AvailableUser;

// ================================================================
// STATE
// ================================================================

const loading = ref(false);
const searchQuery = ref("");
const filterStatus = ref<"all" | "active" | "inactive">("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalGroups = ref(0);
const expandedRow = ref<number | null>(null);

// Group Modal
const showGroupModal = ref(false);
const editingGroup = ref<PurchasingGroup | null>(null);
const saving = ref(false);
const groupErrors = ref<string[]>([]);

const groupForm = ref({
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
});

// Members Modal
const showMembersModal = ref(false);
const selectedGroup = ref<PurchasingGroup | null>(null);
const selectedGroupMembers = ref<GroupMember[]>([]);
const userSearchQuery = ref("");
const allUsers = ref<User[]>([]);

// Delete Modal
const showDeleteModal = ref(false);
const deleteTarget = ref<PurchasingGroup | null>(null);

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// SERVER STATE
// ================================================================

/** Groups for the CURRENT page (server-paginated). */
const groups = ref<PurchasingGroup[]>([]);

/** Server total + pages (used for pagination controls). */
const serverTotal = ref(0);
const serverTotalPages = ref(1);

// ================================================================
// COMPUTED
// ================================================================

/**
 * Because the server already applies search + status filters,
 * filteredGroups is a passthrough. Kept for template compatibility.
 */
const filteredGroups = computed(() => groups.value);

/** Groups for the current page — the server already returns exactly the slice we need. */
const paginatedGroups = computed(() => groups.value);

/** Server-provided total pages (or fallback to 1). */
const totalPages = computed(() => serverTotalPages.value);

const hasActiveFilters = computed(() => {
  return filterStatus.value !== "all" || !!searchQuery.value;
});

/**
 * Users eligible for "Add Members" — excludes those already in
 * the group and matches the local search box.
 */
const filteredAvailableUsers = computed(() => {
  const currentIds = new Set(selectedGroupMembers.value.map((m) => m.userId));
  let available = allUsers.value.filter((u) => !currentIds.has(u.userId));

  if (userSearchQuery.value) {
    const q = userSearchQuery.value.toLowerCase();
    available = available.filter((u) =>
      (u.fullName || u.full_name || u.username).toLowerCase().includes(q)
    );
  }

  return available;
});

// ================================================================
// HELPERS
// ================================================================

const getMemberNames = (members: GroupMember[]): string =>
  purchasingGroupService.getMemberNames({ members } as PurchasingGroup);

const getInitials = (name?: string | null): string =>
  purchasingGroupService.getMemberInitials(
    name ? ({ fullName: name } as GroupMember) : null
  );

const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return "—";
  return purchasingGroupService.formatDateTime(dateString);
};

const toggleExpand = (groupId: number): void => {
  expandedRow.value = expandedRow.value === groupId ? null : groupId;
};

const showToastMessage = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success"
): void => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// DATA LOADING
// ================================================================

const loadGroups = async (): Promise<void> => {
  loading.value = true;
  try {
    const res = await purchasingGroupService.getGroups({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value,
      sortBy: "id",
      sortOrder: "ASC",
    });

    if (res.success) {
      groups.value = res.data.items;
      serverTotal.value = res.data.total;
      totalGroups.value = res.data.total;
      serverTotalPages.value = res.data.totalPages;
    } else {
      showToastMessage(res.error || "Failed to load groups", "error");
      groups.value = [];
      serverTotal.value = 0;
      totalGroups.value = 0;
      serverTotalPages.value = 1;
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Load users that could be added to the currently selected group.
 */
const loadAvailableUsers = async (
  groupId: number,
  search = ""
): Promise<void> => {
  const res = await purchasingGroupService.getAvailableUsers(groupId, search);
  if (res.success) {
    allUsers.value = res.data.items;
  } else {
    allUsers.value = [];
    showToastMessage(res.error || "Failed to load users", "error");
  }
};

// ================================================================
// PAGINATION & FILTERS
// ================================================================

const onSearchChange = (): void => {
  currentPage.value = 1;
  loadGroups();
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  loadGroups();
};

const clearFilters = (): void => {
  filterStatus.value = "all";
  searchQuery.value = "";
  currentPage.value = 1;
  showToastMessage("Filters cleared", "info");
  loadGroups();
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadGroups();
};

const changePageSize = (): void => {
  currentPage.value = 1;
  loadGroups();
};

// Debounce search input so we don't hammer the server
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    onSearchChange();
  }, 350);
});

// ================================================================
// GROUP MODAL
// ================================================================

const openCreateModal = (): void => {
  editingGroup.value = null;
  groupForm.value = {
    name: "",
    description: "",
    status: "active",
  };
  groupErrors.value = [];
  showGroupModal.value = true;
};

const editGroup = (group: PurchasingGroup): void => {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || "",
    status: group.status,
  };
  groupErrors.value = [];
  showGroupModal.value = true;
};

const closeGroupModal = (): void => {
  showGroupModal.value = false;
  editingGroup.value = null;
  groupErrors.value = [];
};

const saveGroup = async (): Promise<void> => {
  groupErrors.value = purchasingGroupService.validateGroupForm(groupForm.value);
  if (groupErrors.value.length > 0) return;

  saving.value = true;

  try {
    const payload = {
      name: groupForm.value.name.trim(),
      description: groupForm.value.description.trim(),
      status: groupForm.value.status,
    };

    const res = editingGroup.value
      ? await purchasingGroupService.updateGroup(editingGroup.value.id, payload)
      : await purchasingGroupService.createGroup(payload);

    if (!res.success) {
      groupErrors.value = [res.error || "Failed to save group"];
      return;
    }

    showToastMessage(
      editingGroup.value ? "Group updated successfully!" : "Group created successfully!",
      "success"
    );

    closeGroupModal();
    await loadGroups();
  } catch (error: any) {
    console.error("Save error:", error);
    groupErrors.value = [error?.message || "Failed to save group"];
  } finally {
    saving.value = false;
  }
};

// ================================================================
// MEMBERS MODAL
// ================================================================

const openMembersModal = async (group: PurchasingGroup): Promise<void> => {
  selectedGroup.value = group;
  selectedGroupMembers.value = [...(group.members || [])];
  userSearchQuery.value = "";
  allUsers.value = [];
  showMembersModal.value = true;

  await loadAvailableUsers(group.id);
};

const closeMembersModal = (): void => {
  showMembersModal.value = false;
  selectedGroup.value = null;
  selectedGroupMembers.value = [];
  userSearchQuery.value = "";
  allUsers.value = [];
};

const addMember = (user: User): void => {
  const alreadyIn = selectedGroupMembers.value.some(
    (m) => m.userId === user.userId
  );
  if (alreadyIn) return;

  selectedGroupMembers.value.push({
    id: Date.now(), // temp id for v-for key
    userId: user.userId,
    username: user.username,
    fullName: user.fullName || user.full_name,
    department: user.department || undefined,
    role: user.role || "Member",
  });
};

const removeMember = (member: GroupMember): void => {
  selectedGroupMembers.value = selectedGroupMembers.value.filter(
    (m) => m.userId !== member.userId
  );
};

const saveMembers = async (): Promise<void> => {
  if (!selectedGroup.value) return;

  try {
    const userIds = selectedGroupMembers.value.map((m) => m.userId);

    const res = await purchasingGroupService.setMembers(
      selectedGroup.value.id,
      userIds
    );

    if (!res.success) {
      showToastMessage(res.error || "Failed to save members", "error");
      return;
    }

    showToastMessage("Members saved successfully!", "success");
    closeMembersModal();
    await loadGroups();
  } catch (error: any) {
    console.error("Save members error:", error);
    showToastMessage("Failed to save members", "error");
  }
};

// Re-fetch available users while the user types (debounced)
let userSearchTimer: ReturnType<typeof setTimeout> | null = null;
watch(userSearchQuery, (q) => {
  if (!selectedGroup.value) return;
  if (userSearchTimer) clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(() => {
    loadAvailableUsers(selectedGroup.value!.id, q);
  }, 300);
});

// ================================================================
// DELETE
// ================================================================

const openDeleteConfirm = (group: PurchasingGroup): void => {
  deleteTarget.value = group;
  showDeleteModal.value = true;
};

const closeDeleteModal = (): void => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};

const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) return;

  const target = deleteTarget.value;

  const res = await purchasingGroupService.deleteGroup(target.id);

  if (res.success) {
    showToastMessage(`Group "${target.code}" deleted`, "success");
    closeDeleteModal();

    // If we just emptied the current page, step back one page
    if (groups.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }

    await loadGroups();
  } else {
    showToastMessage(res.error || "Failed to delete group", "error");
  }
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  loadGroups();
});
</script>

<style scoped>
/* ================================================================ */
/* SECTION CARD */
/* ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 260px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add:hover {
  background: #2563eb;
}

/* ================================================================ */
/* FILTER BAR */
/* ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 850px;
}

.groups-table th,
.groups-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.groups-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.col-expand { width: 30px; }
.col-code { min-width: 100px; }
.col-name { min-width: 180px; }
.col-members { min-width: 200px; }
.col-status { min-width: 80px; }
.col-actions { min-width: 160px; }

.text-center { text-align: center; }

.code-cell {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 12px;
  background: #eff6ff;
  padding: 3px 10px;
  border-radius: 4px;
  display: inline-block;
}

.name-cell {
  font-weight: 600;
  color: #0f172a;
  font-size: 13px;
}

.members-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-count {
  font-weight: 500;
  color: #1e293b;
}

.member-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ================================================================ */
/* STATUS BADGE */
/* ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* ================================================================ */
/* ACTION BUTTONS */
/* ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: wrap;
}

.icon-btn {
  background: transparent;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ================================================================ */
/* EXPAND ROW */
/* ================================================================ */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #e0e7ff;
}

.expanded-row {
  background: #f8fafc;
}

/* ================================================================ */
/* EXPAND DETAILS - 2-COLUMN GRID */
/* ================================================================ */
.detail-expand-row td {
  padding: 0 !important;
}

.expand-details {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: grid;
  grid-template-columns: 1fr 1fr;   /* ✅ SIDE BY SIDE */
  gap: 14px;
}

/* Detail Card */
.detail-card {
  background: white;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.detail-card-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-count-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

/* Info Rows */
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 90px;
  flex-shrink: 0;
  padding-top: 2px;
}

.info-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}

.info-value.code-value {
  font-family: monospace;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

/* Members List in Expanded View */
.members-list-expanded {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 300px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.member-item:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.member-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 11px;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 3px;
}

.member-dept {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.member-role-inline {
  font-size: 10px;
  font-weight: 600;
  color: #3b82f6;
  background: #dbeafe;
  padding: 2px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.no-members {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: #94a3b8;
  font-size: 13px;
}

.no-members-icon {
  font-size: 32px;
  opacity: 0.5;
}

.btn-secondary.small {
  padding: 6px 14px;
  font-size: 12px;
}

/* ================================================================ */
/* DETAIL ACTIONS - SPANS BOTH COLUMNS */
/* ================================================================ */
.detail-actions {
  grid-column: 1 / -1;   /* ✅ Span both columns */
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 6px;
  margin-top: 4px;
}

.detail-actions button {
  padding: 9px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-edit-detail {
  background: #3b82f6;
  color: white;
}

.btn-edit-detail:hover {
  background: #2563eb;
}

.btn-members-detail {
  background: #8b5cf6;
  color: white;
}

.btn-members-detail:hover {
  background: #7c3aed;
}

.btn-delete-detail {
  background: #ef4444;
  color: white;
}

.btn-delete-detail:hover {
  background: #dc2626;
}

/* ================================================================ */
/* EMPTY STATE */
/* ================================================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state p {
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* LOADING */
/* ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #475569;
}

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================ */
/* MODALS */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-container.members-modal {
  max-width: 620px;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
  flex-shrink: 0;
}

/* ================================================================ */
/* FORMS */
/* ================================================================ */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.form-input,
.form-select,
.textarea-field {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.textarea-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
}

.hint {
  font-size: 11px;
  color: #94a3b8;
}

.form-errors {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.form-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #fecaca;
}

/* ================================================================ */
/* BUTTONS */
/* ================================================================ */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ================================================================ */
/* MEMBERS MODAL CONTENT */
/* ================================================================ */
.section-block {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.section-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.section-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.section-hint {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.btn-remove-member {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-remove-member:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.search-wrapper {
  position: relative;
  margin-bottom: 10px;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.available-users-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.available-users-list::-webkit-scrollbar {
  width: 6px;
}

.available-users-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.available-users-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.user-row:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.btn-add-member {
  background: #22c55e;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add-member:hover {
  background: #16a34a;
}

.no-users {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* ================================================================ */
/* CONFIRMATION */
/* ================================================================ */
.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.confirmation-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 16px;
}

.confirmation-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
  font-size: 13px;
}

.warning-text {
  color: #dc2626;
  font-weight: 500;
  text-align: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  max-width: 400px;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.toast.success { background: #22c55e; }
.toast.error { background: #ef4444; }
.toast.info { background: #3b82f6; }
.toast.warning { background: #f59e0b; }

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    justify-content: space-between;
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .search-box { width: 100%; }
  .search-box input { width: 100%; }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-container {
    grid-template-columns: 1fr;   /* ✅ Stack on mobile */
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    min-width: auto;
  }

  .groups-table {
    font-size: 11px;
    min-width: 700px;
  }

  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    font-size: 13px;
    padding: 10px 16px;
  }
}

@media (max-width: 480px) {
  .groups-table {
    min-width: 600px;
  }

  .groups-table th,
  .groups-table td {
    padding: 6px;
    font-size: 10px;
  }

  .detail-actions {
    flex-direction: column;
  }

  .detail-actions button {
    width: 100%;
    justify-content: center;
  }

  .member-row {
    flex-wrap: wrap;
  }

  .user-row {
    flex-wrap: wrap;
  }

  .member-item {
    flex-wrap: wrap;
  }
}
</style>