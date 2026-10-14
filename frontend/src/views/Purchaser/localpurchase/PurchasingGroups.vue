<!-- views/storemanagement/purchasinggroups/PurchasingGroups.vue -->
<template>
  <div class="pg-page">
    <!-- ==================== TOP BAR ==================== -->
    <header class="pg-topbar">
      <div class="pg-topbar-left">
        <div class="pg-logo">👥</div>
        <div>
          <h1 class="pg-title">Purchasing Groups</h1>
          <p class="pg-subtitle">
            {{ totalGroups }} groups · {{ totalSubgroups }} subgroups ·
            {{ totalMembers }} members
          </p>
        </div>
      </div>

      <div class="pg-topbar-right">
        <div class="pg-search">
          <span class="pg-search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search groups, subgroups, members..."
          />
        </div>
        <button
          class="pg-btn-primary"
          title="Configure approval sequence"
          @click="openSequenceModal"
        >
          🔀 Sequence
          <span v-if="totalStages > 0" class="pg-seq-badge">
            {{ totalStages }}
          </span>
        </button>
        <button class="pg-btn-primary" @click="openCreateGroupModal">
          ➕ New Group
        </button>
      </div>
    </header>

    <!-- ==================== MAIN LAYOUT ==================== -->
    <div class="pg-layout">
      <!-- LEFT: GROUPS LIST -->
      <aside class="pg-sidebar">
        <div class="pg-sidebar-header">
          <span class="pg-sidebar-title">Groups</span>
          <select v-model="filterStatus" class="pg-mini-select">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div v-if="loading" class="pg-sidebar-loading">
          <div class="pg-spinner"></div>
        </div>

        <div v-else-if="filteredGroups.length === 0" class="pg-sidebar-empty">
          <p>No groups found</p>
          <button class="pg-btn-ghost" @click="openCreateGroupModal">
            Create First Group
          </button>
        </div>

        <ul v-else class="pg-group-list">
          <li
            v-for="group in filteredGroups"
            :key="group.id"
            class="pg-group-item"
            :class="{
              'is-active': selectedGroupId === group.id,
              'is-inactive': group.status === 'inactive',
            }"
            @click="selectGroup(group.id)"
          >
            <div class="pg-group-dot" />
            <div class="pg-group-item-body">
              <div class="pg-group-item-name">{{ group.name }}</div>
              <div class="pg-group-item-meta">
                {{ group.subgroups.length }} subgroups ·
                {{ countGroupMembers(group) }} members
              </div>
            </div>
            <span :class="['pg-dot-status', group.status]" :title="group.status" />
          </li>
        </ul>
      </aside>

      <!-- RIGHT: DETAIL PANEL -->
      <main class="pg-main">
        <div v-if="!selectedGroup" class="pg-empty-main">
          <div class="pg-empty-icon">👈</div>
          <h3>Select a group</h3>
          <p>Choose a group from the left to view its subgroups and members.</p>
        </div>

        <template v-else>
          <!-- GROUP HEADER -->
          <section class="pg-group-hero">
            <div class="pg-hero-left">
              <div class="pg-hero-avatar">
                {{ getInitials(selectedGroup.name) }}
              </div>
              <div>
                <div class="pg-hero-title-row">
                  <h2 class="pg-hero-title">{{ selectedGroup.name }}</h2>
                  <span class="pg-chip pg-chip-code">{{ selectedGroup.code }}</span>
                  <span :class="['pg-chip', `pg-chip-${selectedGroup.status}`]">
                    {{ selectedGroup.status }}
                  </span>
                </div>
                <p class="pg-hero-desc">
                  {{ selectedGroup.description || "No description" }}
                </p>
              </div>
            </div>

            <div class="pg-hero-actions">
              <button
                class="pg-btn-ghost"
                title="Edit group"
                @click="openEditGroupModal(selectedGroup)"
              >
                ✏️ Edit
              </button>
              <button
                class="pg-btn-ghost pg-btn-danger"
                title="Delete group"
                @click="openDeleteGroupModal(selectedGroup)"
              >
                🗑️
              </button>
            </div>
          </section>

          <!-- STATS STRIP -->
          <section class="pg-stats-strip">
            <div class="pg-stat">
              <span class="pg-stat-value">{{ selectedGroup.subgroups.length }}</span>
              <span class="pg-stat-label">Subgroups</span>
            </div>
            <div class="pg-stat-divider" />
            <div class="pg-stat">
              <span class="pg-stat-value">{{ countGroupMembers(selectedGroup) }}</span>
              <span class="pg-stat-label">Members</span>
            </div>
            <div class="pg-stat-divider" />
            <div class="pg-stat">
              <span class="pg-stat-value">
                {{ selectedGroup.updatedAt ? formatDate(selectedGroup.updatedAt) : "—" }}
              </span>
              <span class="pg-stat-label">Last Updated</span>
            </div>
          </section>

          <!-- SUBGROUPS SECTION -->
          <section class="pg-section">
            <div class="pg-section-header">
              <h3 class="pg-section-title">
                Subgroups
                <span class="pg-count-pill">{{ selectedGroup.subgroups.length }}</span>
              </h3>
              <button
                class="pg-btn-primary pg-btn-sm"
                @click="openCreateSubgroupModal(selectedGroup)"
              >
                ➕ Add Subgroup
              </button>
            </div>

            <div v-if="selectedGroup.subgroups.length === 0" class="pg-card-empty">
              <span class="pg-card-empty-icon">📂</span>
              <p>No subgroups yet</p>
              <button class="pg-btn-ghost" @click="openCreateSubgroupModal(selectedGroup)">
                Create First Subgroup
              </button>
            </div>

            <div v-else class="pg-subgroup-grid">
              <article
                v-for="subgroup in selectedGroup.subgroups"
                :key="subgroup.id"
                class="pg-subgroup-card"
                :class="{
                  'is-selected': selectedSubgroupId === subgroup.id,
                  'is-inactive': subgroup.status === 'inactive',
                }"
                @click="selectSubgroup(subgroup.id)"
              >
                <header class="pg-subgroup-head">
                  <div class="pg-subgroup-avatar">{{ getInitials(subgroup.name) }}</div>
                  <div class="pg-subgroup-head-body">
                    <h4 class="pg-subgroup-name">{{ subgroup.name }}</h4>
                    <div class="pg-subgroup-badges">
                      <span class="pg-chip pg-chip-code pg-chip-xs">{{ subgroup.code }}</span>
                      <span :class="['pg-chip', `pg-chip-${subgroup.status}`, 'pg-chip-xs']">
                        {{ subgroup.status }}
                      </span>
                    </div>
                  </div>
                  <div class="pg-subgroup-menu" @click.stop>
                    <button class="pg-icon-btn" title="Edit subgroup" @click="openEditSubgroupModal(selectedGroup, subgroup)">✏️</button>
                    <button class="pg-icon-btn pg-icon-btn-danger" title="Delete subgroup" @click="openDeleteSubgroupModal(selectedGroup, subgroup)">🗑️</button>
                  </div>
                </header>

                <p class="pg-subgroup-desc">{{ subgroup.description || "No description" }}</p>

                <footer class="pg-subgroup-foot">
                  <span class="pg-member-badge">👤 {{ subgroup.members.length }}</span>
                  <span v-if="subgroup.members.length > 0" class="pg-avatars-mini">
                    <span
                      v-for="m in subgroup.members.slice(0, 3)"
                      :key="m.id"
                      class="pg-mini-avatar"
                      :title="m.fullName || m.username"
                    >
                      {{ getInitials(m.fullName || m.username) }}
                    </span>
                    <span v-if="subgroup.members.length > 3" class="pg-mini-avatar pg-mini-avatar-more">
                      +{{ subgroup.members.length - 3 }}
                    </span>
                  </span>
                </footer>
              </article>
            </div>
          </section>

          <!-- MEMBERS SECTION -->
          <section class="pg-section" v-if="selectedSubgroup">
            <div class="pg-section-header">
              <h3 class="pg-section-title">
                Members of
                <span class="pg-section-subtitle">{{ selectedSubgroup.name }}</span>
                <span class="pg-count-pill">{{ selectedSubgroup.members.length }}</span>
              </h3>
              <button
                class="pg-btn-primary pg-btn-sm"
                :disabled="membersLoading"
                @click="openAddMemberModal(selectedGroup, selectedSubgroup)"
              >
                👤➕ Add Members
              </button>
            </div>

            <div v-if="membersLoading" class="pg-card-empty">
              <div class="pg-spinner" />
            </div>

            <div v-else-if="selectedSubgroup.members.length === 0" class="pg-card-empty">
              <span class="pg-card-empty-icon">👤</span>
              <p>No members in this subgroup</p>
              <button class="pg-btn-ghost" @click="openAddMemberModal(selectedGroup, selectedSubgroup)">
                Add Members
              </button>
            </div>

            <div v-else class="pg-members-list">
              <div
                v-for="member in selectedSubgroup.members"
                :key="member.id"
                class="pg-member-row"
              >
                <div class="pg-member-avatar">{{ getInitials(member.fullName || member.username) }}</div>
                <div class="pg-member-body">
                  <div class="pg-member-name">{{ member.fullName || member.username }}</div>
                  <div class="pg-member-meta">
                    <span v-if="member.email" class="pg-member-email">✉️ {{ member.email }}</span>
                    <span v-if="member.department" class="pg-member-dept">🏢 {{ member.department }}</span>
                  </div>
                </div>
                <span class="pg-member-role">{{ member.role || "Member" }}</span>
                <button
                  class="pg-icon-btn pg-icon-btn-danger"
                  title="Remove"
                  :disabled="removingMemberId === member.userId"
                  @click="removeMember(selectedGroup, selectedSubgroup, member)"
                >
                  {{ removingMemberId === member.userId ? "…" : "✕" }}
                </button>
              </div>
            </div>
          </section>

          <section v-else-if="selectedGroup.subgroups.length > 0" class="pg-pick-prompt">
            <span class="pg-pick-icon">👆</span>
            <p>Select a subgroup above to view its members</p>
          </section>
        </template>
      </main>
    </div>

    <!-- ==================== GROUP MODAL ==================== -->
    <div v-if="showGroupModal" class="pg-modal-overlay" @click.self="closeGroupModal">
      <div class="pg-modal">
        <header class="pg-modal-head">
          <h3>{{ editingGroup ? "✏️ Edit Group" : "➕ New Group" }}</h3>
          <button class="pg-modal-close" @click="closeGroupModal">✕</button>
        </header>
        <div class="pg-modal-body">
          <div class="pg-field">
            <label>Group Name *</label>
            <input v-model="groupForm.name" type="text" class="pg-input" placeholder="e.g., Local Purchasing Team" />
          </div>
          <div class="pg-field">
            <label>Description</label>
            <textarea v-model="groupForm.description" rows="3" class="pg-textarea" placeholder="Brief description..." />
          </div>
          <div class="pg-field">
            <label>Status</label>
            <select v-model="groupForm.status" class="pg-select">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div v-if="formErrors.length" class="pg-errors">
            <div v-for="err in formErrors" :key="err" class="pg-error">⚠️ {{ err }}</div>
          </div>
        </div>
        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeGroupModal">Cancel</button>
          <button class="pg-btn-primary" @click="saveGroup" :disabled="saving">
            {{ saving ? "Saving..." : editingGroup ? "Update" : "Create" }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== SUBGROUP MODAL ==================== -->
    <div v-if="showSubgroupModal" class="pg-modal-overlay" @click.self="closeSubgroupModal">
      <div class="pg-modal">
        <header class="pg-modal-head">
          <h3>
            {{ editingSubgroup ? "✏️ Edit Subgroup" : "➕ New Subgroup" }}
            <span class="pg-modal-subtitle">in {{ parentGroup?.name }}</span>
          </h3>
          <button class="pg-modal-close" @click="closeSubgroupModal">✕</button>
        </header>
        <div class="pg-modal-body">
          <div class="pg-field">
            <label>Subgroup Name *</label>
            <input v-model="subgroupForm.name" type="text" class="pg-input" placeholder="e.g., Chemicals Procurement" />
          </div>
          <div class="pg-field">
            <label>Description</label>
            <textarea v-model="subgroupForm.description" rows="3" class="pg-textarea" placeholder="What is this subgroup for?" />
          </div>
          <div class="pg-field">
            <label>Status</label>
            <select v-model="subgroupForm.status" class="pg-select">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div v-if="formErrors.length" class="pg-errors">
            <div v-for="err in formErrors" :key="err" class="pg-error">⚠️ {{ err }}</div>
          </div>
        </div>
        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeSubgroupModal">Cancel</button>
          <button class="pg-btn-primary" @click="saveSubgroup" :disabled="saving">
            {{ saving ? "Saving..." : editingSubgroup ? "Update" : "Create" }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== ADD MEMBER MODAL ==================== -->
    <div v-if="showAddMemberModal" class="pg-modal-overlay" @click.self="closeAddMemberModal">
      <div class="pg-modal pg-modal-lg">
        <header class="pg-modal-head">
          <h3>
            👤➕ Add Members
            <span class="pg-modal-subtitle">to {{ activeSubgroup?.name }}</span>
          </h3>
          <button class="pg-modal-close" @click="closeAddMemberModal">✕</button>
        </header>
        <div class="pg-modal-body">
          <div class="pg-search pg-search-full">
            <span class="pg-search-icon">🔍</span>
            <input v-model="memberSearchQuery" type="text" placeholder="Search users by name or email..." />
          </div>

          <div v-if="usersLoading" class="pg-card-empty pg-card-empty-sm">
            <div class="pg-spinner" />
          </div>

          <div v-else class="pg-users-list">
            <div v-if="filteredAvailableUsers.length === 0" class="pg-card-empty pg-card-empty-sm">
              <span v-if="memberSearchQuery">No users found</span>
              <span v-else>All users are already assigned to a subgroup in this group</span>
            </div>
            <div v-for="user in filteredAvailableUsers" :key="user.userId" class="pg-user-row">
              <div class="pg-member-avatar pg-member-avatar-sm">
                {{ getInitials(user.fullName || user.username) }}
              </div>
              <div class="pg-member-body">
                <div class="pg-member-name">{{ user.fullName || user.username }}</div>
                <div class="pg-member-meta">
                  <span v-if="user.department" class="pg-member-dept">🏢 {{ user.department }}</span>
                  <span class="pg-member-role">{{ user.role || "Member" }}</span>
                </div>
              </div>
              <button
                class="pg-btn-primary pg-btn-xs"
                :disabled="addingMemberId === user.userId"
                @click="addMemberToSubgroup(user)"
              >
                {{ addingMemberId === user.userId ? "…" : "➕ Add" }}
              </button>
            </div>
          </div>

          <p class="pg-hint">
            💡 A member can only belong to <b>one subgroup</b> inside this group.
            Users already assigned to another subgroup are hidden from this list.
          </p>
        </div>
        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeAddMemberModal">Close</button>
        </footer>
      </div>
    </div>

    <!-- ==================== SEQUENCE MODAL (TOP-LEVEL) ==================== -->
    <div
      v-if="showSequenceModal"
      class="pg-modal-overlay"
      @click.self="closeSequenceModal"
    >
      <div class="pg-modal pg-modal-xl">
        <header class="pg-modal-head">
          <h3>
            🔀 Approval Sequence
            <span class="pg-modal-subtitle">Purchase Requests</span>
          </h3>
          <button class="pg-modal-close" @click="closeSequenceModal">✕</button>
        </header>

        <div class="pg-modal-body pg-seq-body">
          <p class="pg-seq-intro">
            Add whole <b>groups</b> to each stage. A group can belong to
            <b>only one stage</b>. Every subgroup in every group of a stage
            sees the request at once. The next stage unlocks only after all
            groups in the current stage approve.
          </p>

          <div v-if="sequenceLoading" class="pg-card-empty">
            <div class="pg-spinner" />
          </div>

          <div v-else-if="sequenceStages.length === 0" class="pg-card-empty">
            <span class="pg-card-empty-icon">🔀</span>
            <p>No stages yet</p>
            <button class="pg-btn-ghost" @click="addStageToSequence">
              Create First Stage
            </button>
          </div>

          <div v-else class="pg-seq-stages">
            <div
              v-for="(stage, idx) in sequenceStages"
              :key="stage.id"
              class="pg-seq-stage-block"
            >
              <div v-if="idx > 0" class="pg-seq-connector">
                <div class="pg-seq-connector-line" />
                <div class="pg-seq-connector-text">
                  ▼ starts only after ALL groups in the previous stage approve
                </div>
              </div>

              <div class="pg-seq-stage-card">
                <header class="pg-seq-stage-head">
                  <div class="pg-seq-stage-head-left">
                    <div class="pg-seq-stage-number">Stage {{ idx + 1 }}</div>
                    <div class="pg-seq-stage-info">
                      <input
                        v-model="stage.label"
                        type="text"
                        class="pg-seq-stage-label-input"
                        placeholder="Stage name (e.g., Checkers)"
                      />
                      <div class="pg-seq-stage-hint">
                        {{ stage.groups.length }} group(s) ·
                        {{ countSequenceStageSubgroups(stage) }} subgroup(s)
                      </div>
                    </div>
                  </div>
                  <div class="pg-seq-stage-actions">
                    <button class="pg-icon-btn" title="Add group" @click="openAddGroupPicker(stage)">➕</button>
                    <button
                      class="pg-icon-btn pg-icon-btn-danger"
                      title="Remove stage"
                      @click="removeStageFromSequence(stage)"
                    >
                      🗑️
                    </button>
                  </div>
                </header>

                <div v-if="stage.groups.length === 0" class="pg-seq-stage-empty">
                  <span>No groups in this stage</span>
                  <button class="pg-btn-ghost pg-btn-xs" @click="openAddGroupPicker(stage)">
                    ➕ Add group
                  </button>
                </div>

                <div v-else class="pg-seq-stage-groups">
                  <div v-for="g in stage.groups" :key="g.id" class="pg-seq-stage-group">
                    <div class="pg-subgroup-avatar">{{ getInitials(g.name) }}</div>
                    <div class="pg-seq-stage-group-body">
                      <div class="pg-seq-stage-group-name">{{ g.name }}</div>
                      <div class="pg-seq-stage-group-meta">
                        {{ g.subgroupCount }} subgroup(s) · {{ g.memberCount }} member(s)
                      </div>
                      <div v-if="g.subgroupNames.length" class="pg-seq-mini-subs">
                        <span
                          v-for="(sn, i) in g.subgroupNames.slice(0, 4)"
                          :key="i"
                          class="pg-seq-mini-chip"
                        >
                          {{ sn }}
                        </span>
                        <span v-if="g.subgroupNames.length > 4" class="pg-seq-mini-chip pg-seq-mini-more">
                          +{{ g.subgroupNames.length - 4 }}
                        </span>
                      </div>
                    </div>
                    <button class="pg-seq-group-remove" title="Remove" @click="removeGroupFromSequence(stage, g)">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <button class="pg-seq-add-stage" @click="addStageToSequence">
              ➕ Add Stage
            </button>
          </div>
        </div>

        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeSequenceModal">Cancel</button>
          <button class="pg-btn-primary" @click="saveSequence" :disabled="saving">
            {{ saving ? "Saving..." : "💾 Save Sequence" }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== ADD GROUP PICKER (nested) ==================== -->
    <div
      v-if="showAddGroupPicker"
      class="pg-modal-overlay pg-modal-overlay-high"
      @click.self="closeAddGroupPicker"
    >
      <div class="pg-modal pg-modal-lg">
        <header class="pg-modal-head">
          <h3>
            👥 Add Groups to Stage {{ activeSequenceStageIndex + 1 }}
            <span v-if="activeSequenceStage?.label" class="pg-modal-subtitle">
              · {{ activeSequenceStage.label }}
            </span>
          </h3>
          <button class="pg-modal-close" @click="closeAddGroupPicker">✕</button>
        </header>
        <div class="pg-modal-body">
          <div class="pg-search pg-search-full">
            <span class="pg-search-icon">🔍</span>
            <input v-model="groupPickerSearch" type="text" placeholder="Search groups..." />
          </div>

          <div v-if="filteredPickerGroups.length === 0" class="pg-card-empty pg-card-empty-sm">
            <span v-if="groupPickerSearch">No groups found</span>
            <span v-else>
              Every eligible group is already assigned to a stage
            </span>
          </div>

          <div v-else class="pg-users-list">
            <div v-for="g in filteredPickerGroups" :key="g.id" class="pg-user-row">
              <div class="pg-subgroup-avatar">{{ getInitials(g.name) }}</div>
              <div class="pg-member-body">
                <div class="pg-member-name">{{ g.name }}</div>
                <div class="pg-member-meta">
                  <span class="pg-member-dept">{{ g.subgroupCount }} subgroup(s)</span>
                  <span class="pg-member-role">{{ g.memberCount }} member(s)</span>
                </div>
              </div>
              <button class="pg-btn-primary pg-btn-xs" @click="addGroupToSequenceStage(g)">➕ Add</button>
            </div>
          </div>

          <p class="pg-hint">
            💡 A group can appear in <b>only one stage</b>. Groups already
            assigned to another stage are hidden from this list.
          </p>
        </div>
        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeAddGroupPicker">Close</button>
        </footer>
      </div>
    </div>

    <!-- ==================== DELETE CONFIRM MODAL ==================== -->
    <div v-if="showDeleteModal" class="pg-modal-overlay" @click.self="closeDeleteModal">
      <div class="pg-modal pg-modal-sm">
        <header class="pg-modal-head">
          <h3>⚠️ Confirm Delete</h3>
          <button class="pg-modal-close" @click="closeDeleteModal">✕</button>
        </header>
        <div class="pg-modal-body pg-confirm-body">
          <div class="pg-confirm-icon">🗑️</div>
          <p class="pg-confirm-title">
            Delete {{ deleteTarget?.kind }} "<b>{{ deleteTarget?.name }}</b>"?
          </p>
          <p v-if="deleteTarget?.extra" class="pg-confirm-detail">{{ deleteTarget.extra }}</p>
          <p class="pg-confirm-warn">⚠️ This action cannot be undone.</p>
        </div>
        <footer class="pg-modal-foot">
          <button class="pg-btn-ghost" @click="closeDeleteModal">Cancel</button>
          <button class="pg-btn-danger" :disabled="saving" @click="confirmDelete">
            {{ saving ? "Deleting..." : "Delete" }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <transition name="pg-toast">
      <div v-if="showToast" class="pg-toast" :class="`pg-toast-${toastType}`">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import purchasingGroupService, {
  type PurchasingGroup,
  type PurchasingSubgroup,
  type PurchasingSubgroupMember,
  type AvailableUser,
  type SequenceGroup,
  type SequenceStage,
} from "@/stores/purchasingGroupService";

// ================================================================
// TYPES
// ================================================================

type Group = PurchasingGroup;
type Subgroup = PurchasingSubgroup;
type Member = PurchasingSubgroupMember;

// ================================================================
// STATE
// ================================================================

const loading = ref(false);
const membersLoading = ref(false);
const usersLoading = ref(false);
const saving = ref(false);
const sequenceLoading = ref(false);

const groups = ref<Group[]>([]);
const allUsers = ref<AvailableUser[]>([]);

const searchQuery = ref("");
const filterStatus = ref<"all" | "active" | "inactive">("all");

const selectedGroupId = ref<number | null>(null);
const selectedSubgroupId = ref<number | null>(null);

// Modals
const showGroupModal = ref(false);
const showSubgroupModal = ref(false);
const showAddMemberModal = ref(false);
const showDeleteModal = ref(false);
const showSequenceModal = ref(false);
const showAddGroupPicker = ref(false);

const editingGroup = ref<Group | null>(null);
const editingSubgroup = ref<Subgroup | null>(null);
const parentGroup = ref<Group | null>(null);
const activeSubgroup = ref<Subgroup | null>(null);

// Sequence modal state
const sequenceStages = ref<SequenceStage[]>([]);
const activeSequenceStage = ref<SequenceStage | null>(null);
const activeSequenceStageIndex = ref(0);
const groupPickerSearch = ref("");

const formErrors = ref<string[]>([]);

const groupForm = ref({
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
});

const subgroupForm = ref({
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
});

const memberSearchQuery = ref("");

const addingMemberId = ref<number | null>(null);
const removingMemberId = ref<number | null>(null);

const deleteTarget = ref<{
  kind: "group" | "subgroup";
  id: number;
  name: string;
  parentId?: number;
  extra?: string;
} | null>(null);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// COMPUTED
// ================================================================

const totalGroups = computed(() => groups.value.length);

const totalSubgroups = computed(() =>
  groups.value.reduce((sum, g) => sum + (g.subgroups?.length || 0), 0)
);

const totalMembers = computed(() =>
  groups.value.reduce(
    (sum, g) =>
      sum +
      (g.subgroups || []).reduce(
        (s, sg) => s + (sg.members?.length || 0),
        0
      ),
    0
  )
);

const totalStages = computed(() => sequenceStages.value.length);

const filteredGroups = computed(() => {
  let list = groups.value;

  if (filterStatus.value !== "all") {
    list = list.filter((g) => g.status === filterStatus.value);
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((g) => {
      if (
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q)
      )
        return true;
      return (g.subgroups || []).some((s) => {
        if (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
        )
          return true;
        return (s.members || []).some(
          (m) =>
            (m.fullName || "").toLowerCase().includes(q) ||
            (m.username || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q)
        );
      });
    });
  }

  return list;
});

const selectedGroup = computed(
  () => groups.value.find((g) => g.id === selectedGroupId.value) || null
);

const selectedSubgroup = computed(() => {
  if (!selectedGroup.value || !selectedSubgroupId.value) return null;
  return (
    (selectedGroup.value.subgroups || []).find(
      (s) => s.id === selectedSubgroupId.value
    ) || null
  );
});

const filteredAvailableUsers = computed(() => {
  const q = memberSearchQuery.value.trim().toLowerCase();
  if (!q) return allUsers.value;

  return allUsers.value.filter((u) => {
    const name = (u.fullName || u.full_name || u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });
});

/**
 * Every group id already used in ANY stage (not just the active one).
 * A group can only belong to one stage — this set enforces that.
 */
const groupsUsedInAnyStage = computed(() => {
  const used = new Set<number>();
  for (const stage of sequenceStages.value) {
    for (const g of stage.groups) {
      used.add(g.id);
    }
  }
  return used;
});

/**
 * Groups available to add to the current sequence stage:
 *  - not already in ANY stage anywhere
 */
const filteredPickerGroups = computed(() => {
  if (!activeSequenceStage.value) return [];

  let list: SequenceGroup[] = groups.value
    .filter((g) => !groupsUsedInAnyStage.value.has(g.id))
    .map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      subgroupCount: g.subgroups?.length ?? 0,
      memberCount: countGroupMembers(g),
      subgroupNames: (g.subgroups || []).map((s) => s.name),
    }));

  const q = groupPickerSearch.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q)
    );
  }

  return list;
});

// ================================================================
// HELPERS
// ================================================================

const getInitials = (name?: string): string => {
  if (!name) return "??";
  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  const firstName = parts[0] ?? "";
  if (parts.length === 1) return firstName.slice(0, 2).toUpperCase();
  const first = firstName[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  if (!first || !last) return firstName.slice(0, 2).toUpperCase();
  return (first + last).toUpperCase();
};

const countGroupMembers = (group: Group): number =>
  (group.subgroups || []).reduce(
    (sum, sg) => sum + (sg.members?.length || 0),
    0
  );

const formatDate = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

const countSequenceStageSubgroups = (stage: SequenceStage): number =>
  stage.groups.reduce((sum, g) => sum + g.subgroupCount, 0);

// ================================================================
// SELECTION
// ================================================================

const selectGroup = (id: number): void => {
  selectedGroupId.value = id;
  const grp = groups.value.find((g) => g.id === id);
  const firstSubgroup = grp?.subgroups?.[0];
  selectedSubgroupId.value = firstSubgroup?.id ?? null;
};

const selectSubgroup = (id: number): void => {
  selectedSubgroupId.value = id;
};

// ================================================================
// SEQUENCE
// ================================================================

/** Load the sequence from the server */
const loadSequence = async (): Promise<void> => {
  sequenceLoading.value = true;
  try {
    const res = await purchasingGroupService.getSequence();
    if (res.success) {
      sequenceStages.value = res.data.items;
    } else {
      // Silent — sequence is optional; don't spam the user on first load
      sequenceStages.value = [];
    }
  } finally {
    sequenceLoading.value = false;
  }
};

/** Open the sequence modal — always fresh from the server */
const openSequenceModal = async (): Promise<void> => {
  showSequenceModal.value = true;

  await loadSequence();

  // Seed a single empty stage if the server returned nothing
  if (sequenceStages.value.length === 0) {
    sequenceStages.value.push({
      id: Date.now(),
      label: "",
      orderIndex: 1,
      groups: [],
    });
  }
};

const closeSequenceModal = (): void => {
  showSequenceModal.value = false;
  activeSequenceStage.value = null;
  showAddGroupPicker.value = false;
};

let stageCounter = 1000;

const addStageToSequence = (): void => {
  stageCounter += 1;
  sequenceStages.value.push({
    id: Date.now() + stageCounter,
    label: "",
    orderIndex: sequenceStages.value.length + 1,
    groups: [],
  });
};

const removeStageFromSequence = (stage: SequenceStage): void => {
  if (sequenceStages.value.length <= 1) {
    showToastMessage("At least one stage is required", "warning");
    return;
  }
  sequenceStages.value = sequenceStages.value.filter((s) => s.id !== stage.id);

  // Re-index orderIndex after removal
  sequenceStages.value.forEach((s, i) => {
    s.orderIndex = i + 1;
  });
};

const openAddGroupPicker = (stage: SequenceStage): void => {
  activeSequenceStage.value = stage;
  activeSequenceStageIndex.value = sequenceStages.value.findIndex(
    (s) => s.id === stage.id
  );
  groupPickerSearch.value = "";
  showAddGroupPicker.value = true;
};

const closeAddGroupPicker = (): void => {
  showAddGroupPicker.value = false;
  activeSequenceStage.value = null;
  groupPickerSearch.value = "";
};

const addGroupToSequenceStage = (g: SequenceGroup): void => {
  if (!activeSequenceStage.value) return;

  // Defensive double-check: refuse if the group is already in ANY stage
  if (groupsUsedInAnyStage.value.has(g.id)) {
    showToastMessage(
      `"${g.name}" is already assigned to another stage`,
      "warning"
    );
    return;
  }

  activeSequenceStage.value.groups.push({
    id: g.id,
    name: g.name,
    code: g.code,
    subgroupCount: g.subgroupCount,
    memberCount: g.memberCount,
    subgroupNames: [...g.subgroupNames],
  });

  showToastMessage(`"${g.name}" added to stage`, "success");
};

const removeGroupFromSequence = (
  stage: SequenceStage,
  g: SequenceGroup
): void => {
  stage.groups = stage.groups.filter((x) => x.id !== g.id);
  showToastMessage(`"${g.name}" removed`, "info");
};

const saveSequence = async (): Promise<void> => {
  // Final validation: no group may appear in more than one stage
  const seen = new Map<number, number>(); // groupId → stageIndex
  for (let i = 0; i < sequenceStages.value.length; i++) {
    const stage = sequenceStages.value[i];
    if (!stage) continue;

    for (const g of stage.groups) {
      if (seen.has(g.id)) {
        showToastMessage(
          `"${g.name}" is in both Stage ${seen.get(g.id)! + 1} and Stage ${i + 1}. A group can only be in one stage.`,
          "error"
        );
        return;
      }
      seen.set(g.id, i);
    }
  }

  saving.value = true;
  try {
    const res = await purchasingGroupService.saveSequence(sequenceStages.value);

    if (!res.success) {
      showToastMessage(res.error || "Failed to save sequence", "error");
      return;
    }

    // Replace with canonical server response
    sequenceStages.value = res.data.items;

    showToastMessage("Sequence saved", "success");
    closeSequenceModal();
  } finally {
    saving.value = false;
  }
};

// ================================================================
// DATA LOADING
// ================================================================

const loadGroups = async (): Promise<void> => {
  loading.value = true;
  try {
    const res = await purchasingGroupService.getGroups({
      page: 1,
      limit: 200,
      status: filterStatus.value,
      search: searchQuery.value || undefined,
    });

    if (!res.success) {
      showToastMessage(res.error || "Failed to load groups", "error");
      groups.value = [];
      return;
    }

    groups.value = res.data.items;

    if (
      selectedGroupId.value &&
      groups.value.some((g) => g.id === selectedGroupId.value)
    ) {
      const grp = groups.value.find((g) => g.id === selectedGroupId.value);
      if (
        grp &&
        (!selectedSubgroupId.value ||
          !grp.subgroups?.some((s) => s.id === selectedSubgroupId.value))
      ) {
        selectedSubgroupId.value = grp.subgroups?.[0]?.id ?? null;
      }
    } else if (groups.value.length > 0) {
      const firstGroup = groups.value[0];
      if (firstGroup) {
        selectGroup(firstGroup.id);
      } else {
        selectedGroupId.value = null;
        selectedSubgroupId.value = null;
      }
    } else {
      selectedGroupId.value = null;
      selectedSubgroupId.value = null;
    }
  } finally {
    loading.value = false;
  }
};

const loadAvailableUsers = async (): Promise<void> => {
  if (!activeSubgroup.value || !parentGroup.value) return;

  usersLoading.value = true;
  try {
    const res = await purchasingGroupService.getAvailableSubgroupUsers(
      parentGroup.value.id,
      activeSubgroup.value.id
    );

    if (res.success) {
      allUsers.value = res.data.items;
    } else {
      allUsers.value = [];
      showToastMessage(res.error || "Failed to load users", "error");
    }
  } finally {
    usersLoading.value = false;
  }
};

// ================================================================
// WATCHERS
// ================================================================

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadGroups();
  }, 350);
});

watch(filterStatus, () => {
  loadGroups();
});

// ================================================================
// GROUP MODAL
// ================================================================

const openCreateGroupModal = (): void => {
  editingGroup.value = null;
  groupForm.value = { name: "", description: "", status: "active" };
  formErrors.value = [];
  showGroupModal.value = true;
};

const openEditGroupModal = (group: Group): void => {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || "",
    status: group.status,
  };
  formErrors.value = [];
  showGroupModal.value = true;
};

const closeGroupModal = (): void => {
  showGroupModal.value = false;
  editingGroup.value = null;
  formErrors.value = [];
};

const saveGroup = async (): Promise<void> => {
  formErrors.value = purchasingGroupService.validateGroupForm(groupForm.value);
  if (formErrors.value.length > 0) return;

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
      formErrors.value = [res.error || "Failed to save group"];
      return;
    }

    showToastMessage(
      editingGroup.value
        ? "Group updated successfully!"
        : "Group created successfully!",
      "success"
    );

    closeGroupModal();
    await loadGroups();

    if (!editingGroup.value && res.data?.id) {
      selectGroup(res.data.id);
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// SUBGROUP MODAL
// ================================================================

const openCreateSubgroupModal = (group: Group): void => {
  parentGroup.value = group;
  editingSubgroup.value = null;
  subgroupForm.value = { name: "", description: "", status: "active" };
  formErrors.value = [];
  showSubgroupModal.value = true;
};

const openEditSubgroupModal = (group: Group, subgroup: Subgroup): void => {
  parentGroup.value = group;
  editingSubgroup.value = subgroup;
  subgroupForm.value = {
    name: subgroup.name,
    description: subgroup.description || "",
    status: subgroup.status,
  };
  formErrors.value = [];
  showSubgroupModal.value = true;
};

const closeSubgroupModal = (): void => {
  showSubgroupModal.value = false;
  editingSubgroup.value = null;
  parentGroup.value = null;
  formErrors.value = [];
};

const saveSubgroup = async (): Promise<void> => {
  if (!parentGroup.value) return;

  formErrors.value = purchasingGroupService.validateSubgroupForm(
    subgroupForm.value
  );
  if (formErrors.value.length > 0) return;

  saving.value = true;
  try {
    const payload = {
      name: subgroupForm.value.name.trim(),
      description: subgroupForm.value.description.trim(),
      status: subgroupForm.value.status,
    };

    const res = editingSubgroup.value
      ? await purchasingGroupService.updateSubgroup(
          parentGroup.value.id,
          editingSubgroup.value.id,
          payload
        )
      : await purchasingGroupService.createSubgroup(
          parentGroup.value.id,
          payload
        );

    if (!res.success) {
      formErrors.value = [res.error || "Failed to save subgroup"];
      return;
    }

    showToastMessage(
      editingSubgroup.value
        ? "Subgroup updated successfully!"
        : "Subgroup created successfully!",
      "success"
    );

    const groupId = parentGroup.value.id;
    closeSubgroupModal();
    await loadGroups();

    selectGroup(groupId);
    if (!editingSubgroup.value && res.data?.id) {
      selectedSubgroupId.value = res.data.id;
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// MEMBERS
// ================================================================

const openAddMemberModal = async (
  group: Group,
  subgroup: Subgroup
): Promise<void> => {
  parentGroup.value = group;
  activeSubgroup.value = subgroup;
  memberSearchQuery.value = "";
  allUsers.value = [];
  showAddMemberModal.value = true;

  await loadAvailableUsers();
};

const closeAddMemberModal = (): void => {
  showAddMemberModal.value = false;
  parentGroup.value = null;
  activeSubgroup.value = null;
  memberSearchQuery.value = "";
  allUsers.value = [];
};

const addMemberToSubgroup = async (user: AvailableUser): Promise<void> => {
  if (!activeSubgroup.value || !parentGroup.value) return;

  addingMemberId.value = user.userId;
  try {
    const res = await purchasingGroupService.addSubgroupMembers(
      parentGroup.value.id,
      activeSubgroup.value.id,
      [user.userId]
    );

    if (!res.success) {
      showToastMessage(res.error || "Failed to add member", "error");
      return;
    }

    showToastMessage(
      `${user.fullName || user.username} added to ${activeSubgroup.value.name}`,
      "success"
    );

    allUsers.value = allUsers.value.filter((u) => u.userId !== user.userId);

    await loadGroups();
  } finally {
    addingMemberId.value = null;
  }
};

const removeMember = async (
  group: Group,
  subgroup: Subgroup,
  member: Member
): Promise<void> => {
  removingMemberId.value = member.userId;
  try {
    const res = await purchasingGroupService.removeSubgroupMember(
      group.id,
      subgroup.id,
      member.userId
    );

    if (!res.success) {
      showToastMessage(res.error || "Failed to remove member", "error");
      return;
    }

    showToastMessage(`${member.fullName || member.username} removed`, "info");

    await loadGroups();
  } finally {
    removingMemberId.value = null;
  }
};

// ================================================================
// DELETE
// ================================================================

const openDeleteGroupModal = (group: Group): void => {
  deleteTarget.value = {
    kind: "group",
    id: group.id,
    name: group.name,
    extra: `Contains ${group.subgroups?.length || 0} subgroup(s) and ${countGroupMembers(group)} member(s).`,
  };
  showDeleteModal.value = true;
};

const openDeleteSubgroupModal = (group: Group, subgroup: Subgroup): void => {
  deleteTarget.value = {
    kind: "subgroup",
    id: subgroup.id,
    name: subgroup.name,
    parentId: group.id,
    extra: `Contains ${subgroup.members?.length || 0} member(s).`,
  };
  showDeleteModal.value = true;
};

const closeDeleteModal = (): void => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};

const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) return;
  const target = deleteTarget.value;

  saving.value = true;
  try {
    if (target.kind === "group") {
      const res = await purchasingGroupService.deleteGroup(target.id);
      if (!res.success) {
        showToastMessage(res.error || "Failed to delete group", "error");
        return;
      }
      showToastMessage(`Group "${target.name}" deleted`, "success");
    } else if (target.kind === "subgroup" && target.parentId) {
      const res = await purchasingGroupService.deleteSubgroup(
        target.parentId,
        target.id
      );
      if (!res.success) {
        showToastMessage(res.error || "Failed to delete subgroup", "error");
        return;
      }
      showToastMessage(`Subgroup "${target.name}" deleted`, "success");
    }

    closeDeleteModal();
    await loadGroups();

    if (!groups.value.some((g) => g.id === selectedGroupId.value)) {
      const firstGroup = groups.value[0];
      if (firstGroup) {
        selectGroup(firstGroup.id);
      } else {
        selectedGroupId.value = null;
        selectedSubgroupId.value = null;
      }
    } else if (
      !groups.value
        .find((g) => g.id === selectedGroupId.value)
        ?.subgroups?.some((s) => s.id === selectedSubgroupId.value)
    ) {
      const grp = groups.value.find((g) => g.id === selectedGroupId.value);
      selectedSubgroupId.value = grp?.subgroups?.[0]?.id ?? null;
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await loadGroups();
  await loadSequence();
});
</script>

<style scoped>
/* ================================================================ */
/* PAGE SHELL */
/* ================================================================ */
.pg-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0f172a;
  max-width: 1400px;
  margin: 0 auto;
}

/* ================================================================ */
/* TOP BAR */
/* ================================================================ */
.pg-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.pg-topbar-left { display: flex; align-items: center; gap: 14px; }
.pg-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}
.pg-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.01em;
}
.pg-subtitle { font-size: 12px; color: #94a3b8; margin: 2px 0 0 0; }
.pg-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.pg-search { position: relative; }
.pg-search input {
  padding: 9px 14px 9px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 280px;
  background: #fff;
  transition: all 0.15s;
}
.pg-search input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.pg-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
  pointer-events: none;
}
.pg-search-full { width: 100%; margin-bottom: 14px; }
.pg-search-full input { width: 100%; box-sizing: border-box; }

/* ================================================================ */
/* BUTTONS */
/* ================================================================ */
.pg-btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pg-btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.pg-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.pg-seq-badge {
  background: rgba(255, 255, 255, 0.25);
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 700;
}

.pg-btn-sm { padding: 7px 14px; font-size: 12px; }
.pg-btn-xs { padding: 5px 12px; font-size: 11px; }

.pg-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}
.pg-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

.pg-btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.pg-btn-danger:hover:not(:disabled) { background: #dc2626; }
.pg-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.pg-icon-btn {
  background: transparent;
  border: none;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  color: #64748b;
}
.pg-icon-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.pg-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pg-icon-btn-danger:hover:not(:disabled) { background: #fef2f2; color: #ef4444; }

/* ================================================================ */
/* LAYOUT */
/* ================================================================ */
.pg-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
}

/* ================================================================ */
/* SIDEBAR */
/* ================================================================ */
.pg-sidebar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}
.pg-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
.pg-sidebar-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
}
.pg-mini-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  background: white;
  cursor: pointer;
}
.pg-sidebar-loading,
.pg-sidebar-empty {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.pg-group-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  flex: 1;
}
.pg-group-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.pg-group-item:hover { background: #f8fafc; }
.pg-group-item.is-active {
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  box-shadow: inset 0 0 0 1px #c7d2fe;
}
.pg-group-item.is-inactive { opacity: 0.55; }
.pg-group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}
.pg-group-item.is-active .pg-group-dot { background: #6366f1; }
.pg-group-item-body { flex: 1; min-width: 0; }
.pg-group-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pg-group-item-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.pg-dot-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pg-dot-status.active {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}
.pg-dot-status.inactive { background: #cbd5e1; }

/* ================================================================ */
/* MAIN */
/* ================================================================ */
.pg-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.pg-empty-main {
  background: #fff;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
}
.pg-empty-icon { font-size: 56px; opacity: 0.5; display: block; margin-bottom: 12px; }
.pg-empty-main h3 { font-size: 18px; font-weight: 600; margin: 0 0 6px 0; color: #334155; }
.pg-empty-main p { color: #94a3b8; font-size: 13px; margin: 0; }

/* ================================================================ */
/* HERO */
/* ================================================================ */
.pg-group-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
  flex-wrap: wrap;
}
.pg-hero-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
.pg-hero-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}
.pg-hero-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.pg-hero-title { font-size: 18px; font-weight: 700; margin: 0; color: #0f172a; letter-spacing: -0.01em; }
.pg-hero-desc { font-size: 13px; color: #64748b; margin: 0; }
.pg-hero-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

/* Chips */
.pg-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.pg-chip-xs { padding: 2px 8px; font-size: 10px; }
.pg-chip-code {
  font-family: "SF Mono", Menlo, monospace;
  background: #eef2ff;
  color: #4f46e5;
  text-transform: none;
  letter-spacing: 0;
}
.pg-chip-active { background: #dcfce7; color: #166534; }
.pg-chip-inactive { background: #f1f5f9; color: #64748b; }

/* ================================================================ */
/* STATS STRIP */
/* ================================================================ */
.pg-stats-strip {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 24px;
  flex-wrap: wrap;
}
.pg-stat { display: flex; flex-direction: column; gap: 2px; }
.pg-stat-value { font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.1; }
.pg-stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
}
.pg-stat-divider { width: 1px; height: 32px; background: #f1f5f9; }

/* ================================================================ */
/* SECTIONS */
/* ================================================================ */
.pg-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
}
.pg-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.pg-section-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.01em;
}
.pg-section-subtitle { font-weight: 500; color: #6366f1; }
.pg-count-pill {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ================================================================ */
/* SUBGROUP GRID */
/* ================================================================ */
.pg-subgroup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.pg-subgroup-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pg-subgroup-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}
.pg-subgroup-card.is-selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.pg-subgroup-card.is-inactive { opacity: 0.65; }
.pg-subgroup-head { display: flex; align-items: flex-start; gap: 10px; }
.pg-subgroup-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}
.pg-subgroup-head-body { flex: 1; min-width: 0; }
.pg-subgroup-name {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pg-subgroup-badges { display: flex; gap: 4px; flex-wrap: wrap; }
.pg-subgroup-menu { display: flex; gap: 2px; flex-shrink: 0; }
.pg-subgroup-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pg-subgroup-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
}
.pg-member-badge {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 12px;
}
.pg-avatars-mini { display: flex; align-items: center; }
.pg-mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 9px;
  border: 2px solid #fff;
  margin-left: -6px;
}
.pg-mini-avatar:first-child { margin-left: 0; }
.pg-mini-avatar-more { background: #e2e8f0; color: #475569; }

/* ================================================================ */
/* MEMBERS LIST */
/* ================================================================ */
.pg-members-list { display: flex; flex-direction: column; gap: 6px; }
.pg-member-row,
.pg-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  transition: all 0.15s;
}
.pg-member-row:hover,
.pg-user-row:hover { border-color: #e2e8f0; background: #fafbfc; }
.pg-member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}
.pg-member-avatar-sm { width: 32px; height: 32px; font-size: 11px; }
.pg-member-body { flex: 1; min-width: 0; }
.pg-member-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pg-member-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.pg-member-email,
.pg-member-dept { font-size: 11px; color: #94a3b8; }
.pg-member-role {
  font-size: 10px;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 3px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

/* ================================================================ */
/* EMPTY / PICK */
/* ================================================================ */
.pg-card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background: #fafbfc;
}
.pg-card-empty-sm { padding: 24px 16px; font-size: 13px; color: #94a3b8; }
.pg-card-empty-icon { font-size: 32px; opacity: 0.6; }
.pg-card-empty p { margin: 0; color: #94a3b8; font-size: 13px; }

.pg-pick-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 16px;
}
.pg-pick-icon { font-size: 28px; opacity: 0.6; }
.pg-pick-prompt p { margin: 0; }

.pg-users-list {
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pg-hint {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
  margin-top: 14px;
  text-align: center;
  line-height: 1.5;
}

/* ================================================================ */
/* SPINNER */
/* ================================================================ */
.pg-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f1f5f9;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: pg-spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes pg-spin { to { transform: rotate(360deg); } }

/* ================================================================ */
/* MODALS */
/* ================================================================ */
.pg-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: pg-fadeIn 0.15s ease;
}
.pg-modal-overlay-high { z-index: 1100; }
@keyframes pg-fadeIn { from { opacity: 0; } to { opacity: 1; } }

.pg-modal {
  background: #fff;
  border-radius: 16px;
  max-width: 500px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  animation: pg-slideUp 0.2s ease;
}
.pg-modal-lg { max-width: 600px; }
.pg-modal-xl { max-width: 860px; }
.pg-modal-sm { max-width: 420px; }
@keyframes pg-slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.pg-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.pg-modal-head h3 { font-size: 16px; font-weight: 700; margin: 0; color: #0f172a; }
.pg-modal-subtitle { font-size: 13px; font-weight: 400; color: #64748b; margin-left: 6px; }
.pg-modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}
.pg-modal-close:hover { background: #f1f5f9; color: #0f172a; }
.pg-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.pg-modal-foot {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ================================================================ */
/* SEQUENCE MODAL BODY */
/* ================================================================ */
.pg-seq-body { padding: 20px 24px; }
.pg-seq-intro {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 20px 0;
  line-height: 1.6;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.pg-seq-intro b { color: #4f46e5; }
.pg-seq-stages { display: flex; flex-direction: column; gap: 4px; }
.pg-seq-stage-block { display: flex; flex-direction: column; }
.pg-seq-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}
.pg-seq-connector-line { width: 2px; height: 12px; background: #e2e8f0; margin-bottom: 6px; }
.pg-seq-connector-text {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #94a3b8;
  background: #fafbff;
  padding: 3px 10px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}
.pg-seq-stage-card {
  background: #fafbff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
}
.pg-seq-stage-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pg-seq-stage-head-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.pg-seq-stage-number {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex-shrink: 0;
}
.pg-seq-stage-info { flex: 1; min-width: 0; }
.pg-seq-stage-label-input {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  padding: 2px 4px;
  border-radius: 6px;
  outline: none;
  width: 100%;
  max-width: 260px;
}
.pg-seq-stage-label-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.pg-seq-stage-label-input::placeholder { color: #94a3b8; font-weight: 500; }
.pg-seq-stage-hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.pg-seq-stage-actions { display: flex; gap: 2px; flex-shrink: 0; }

.pg-seq-stage-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  background: #fff;
}
.pg-seq-stage-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.pg-seq-stage-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.15s;
}
.pg-seq-stage-group:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}
.pg-seq-stage-group-body { flex: 1; min-width: 0; }
.pg-seq-stage-group-name {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pg-seq-stage-group-meta { font-size: 10px; color: #94a3b8; margin-top: 1px; }
.pg-seq-mini-subs { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
.pg-seq-mini-chip {
  font-size: 9px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
}
.pg-seq-mini-more { background: #e2e8f0; color: #475569; }
.pg-seq-group-remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.pg-seq-group-remove:hover { background: #fef2f2; color: #ef4444; }

.pg-seq-add-stage {
  margin-top: 16px;
  padding: 12px;
  background: transparent;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.15s;
}
.pg-seq-add-stage:hover {
  border-color: #6366f1;
  color: #4f46e5;
  background: #f5f3ff;
}

/* ================================================================ */
/* FORMS */
/* ================================================================ */
.pg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pg-field label { font-size: 12px; font-weight: 600; color: #334155; }
.pg-input,
.pg-select,
.pg-textarea {
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.15s;
}
.pg-input:focus,
.pg-select:focus,
.pg-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.pg-textarea { resize: vertical; min-height: 70px; }
.pg-errors { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.pg-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
}

/* ================================================================ */
/* CONFIRM BODY */
/* ================================================================ */
.pg-confirm-body { text-align: center; }
.pg-confirm-icon { font-size: 44px; margin-bottom: 10px; }
.pg-confirm-title { font-size: 15px; font-weight: 500; margin: 0 0 10px 0; color: #0f172a; line-height: 1.5; }
.pg-confirm-detail { font-size: 12px; color: #64748b; margin: 0 0 12px 0; }
.pg-confirm-warn {
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  background: #fef2f2;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 0;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.pg-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  max-width: 400px;
}
.pg-toast-success { background: #22c55e; }
.pg-toast-error   { background: #ef4444; }
.pg-toast-info    { background: #6366f1; }
.pg-toast-warning { background: #f59e0b; }
.pg-toast-enter-active,
.pg-toast-leave-active { transition: all 0.3s ease; }
.pg-toast-enter-from { transform: translateX(100%); opacity: 0; }
.pg-toast-leave-to { transform: translateY(-10px); opacity: 0; }

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 900px) {
  .pg-layout { grid-template-columns: 1fr; }
  .pg-sidebar { position: static; max-height: none; }
  .pg-topbar-right { width: 100%; flex-direction: column; align-items: stretch; }
  .pg-search, .pg-search input { width: 100%; }
  .pg-subgroup-grid { grid-template-columns: 1fr; }
  .pg-hero-left { flex-direction: column; }
  .pg-hero-actions { width: 100%; }
  .pg-hero-actions button { flex: 1; }
  .pg-seq-stage-groups { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .pg-member-row, .pg-user-row { flex-wrap: wrap; }
  .pg-member-role { font-size: 9px; }
  .pg-stats-strip { flex-direction: column; align-items: flex-start; gap: 12px; }
  .pg-stat-divider { width: 100%; height: 1px; }
  .pg-modal-foot { flex-direction: column; }
  .pg-modal-foot button { width: 100%; }
  .pg-seq-stage-head { flex-direction: column; align-items: stretch; }
  .pg-seq-stage-actions { justify-content: flex-end; }
}
</style>