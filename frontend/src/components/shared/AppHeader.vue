<template>
  <header class="header" v-if="authStore.isAuthenticated && authStore.user">
    <div class="header-left">
      <button @click="toggleSidebar" class="menu-btn">
        <svg
          class="menu-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div class="logo-section">
        <span class="system-name">SUPER SYSTEM</span>
      </div>
    </div>

    <!-- ✅ Centered Store Name Display -->
    <div class="header-center">
      <div v-if="storeName" class="store-brand">
        <div class="store-icon-wrapper">
          <span class="store-icon">🏪</span>
        </div>
        <div class="store-info-wrapper">
          <span class="store-name-main">{{ storeName }}</span>
          <span v-if="groupName" class="group-divider">•</span>
          <span v-if="groupName" class="group-name-tag">👥 {{ groupName }}</span>
        </div>
      </div>
      <div v-else class="store-brand empty">
        <span class="no-store-text">No Store Assigned</span>
      </div>
    </div>

    <div class="header-right">
      <!-- 🔔 Existing Item Request Notifications - UNTOUCHED -->
      <div class="notification-dropdown" @click.stop>
        <button
          class="notification-btn"
          @click="toggleNotifications"
          :disabled="loading"
        >
          <svg
            class="notification-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a1 1 0 0 1-3.46 0" />
          </svg>
          <span v-if="pendingCount > 0" class="notification-badge">{{
            pendingCount
          }}</span>
        </button>

        <!-- Existing Notifications Panel - UNTOUCHED -->
        <transition name="dropdown">
          <div v-if="showNotifications" class="notifications-panel">
            <div class="notifications-header">
              <h3>🔔 Pending Notifications</h3>
              <div class="header-actions">
                <span class="pending-count" v-if="pendingCount > 0">
                  {{ pendingCount }} pending
                </span>
                <button
                  class="mark-all"
                  @click="loadNotifications(true)"
                  :disabled="loading"
                >
                  🔄
                </button>
              </div>
            </div>

            <div
              class="notifications-list"
              v-if="!loading"
              @scroll="handleScroll"
              ref="notificationsListRef"
            >
              <div
                v-if="pendingNotifications.length === 0"
                class="empty-notifications"
              >
                <span class="empty-icon">✅</span>
                <p>All caught up! No pending notifications</p>
              </div>
              
              <div
                v-for="notif in pendingNotifications"
                :key="notif.id"
                class="notification-item pending"
              >
                <div class="notification-icon pending">
                  <span>{{ notif.approval_type === 'department' ? '🏛️' : '👥' }}</span>
                </div>
                <div class="notification-content">
                  <div class="notification-header">
                    <span class="request-code">{{ notif.request?.requestCode }}</span>
                    <span class="notification-time">{{ formatDate(notif.created_at) }}</span>
                  </div>
                  <p class="notification-message">
                    <strong>{{ notif.request?.requestedByUser?.fullName || "Someone" }}</strong>
                    requested items from
                    <strong>{{ notif.request?.askingStore?.name || "Unknown" }}</strong>
                  </p>
                  <div class="notification-items">
                    <span
                      v-for="(item, idx) in (notif.request?.items || []).slice(0, 2)"
                      :key="idx"
                      class="item-tag"
                    >
                      {{ item.item?.name || "Unknown" }} ({{ item.quantity }})
                    </span>
                    <span
                      v-if="(notif.request?.items || []).length > 2"
                      class="item-more"
                    >
                      +{{ (notif.request?.items || []).length - 2 }} more
                    </span>
                  </div>
                  <div class="notification-actions">
                    <button
                      class="btn-accept-small"
                      @click.stop="openAcceptModal(notif)"
                    >
                      ✅ Accept
                    </button>
                    <button
                      class="btn-reject-small"
                      @click.stop="openRejectModal(notif)"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>

              <!-- Loading indicator at bottom -->
              <div v-if="loadingMore" class="loading-more">
                <div class="spinner-small"></div>
              </div>

              <!-- No more notifications -->
              <div
                v-if="
                  !hasMorePages &&
                  pendingNotifications.length > 0 &&
                  !loadingMore
                "
                class="no-more"
              >
                <span>— No more notifications —</span>
              </div>
            </div>

            <div v-if="loading && !loadingMore" class="loading-notifications">
              <div class="spinner-small"></div>
              <span>Loading...</span>
            </div>

            <div class="notifications-footer">
              <button class="view-all" @click="goToNotifications">
                View all notifications history →
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- 📋 NEW: Order Notifications - Separate Icon -->
      <div class="notification-dropdown" @click.stop>
        <button
          class="notification-btn order-btn"
          @click="toggleOrderNotifications"
          :disabled="orderLoading"
          title="Order Notifications"
        >
          <svg
            class="notification-icon order-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span v-if="orderPendingCount > 0" class="notification-badge order-badge">{{
            orderPendingCount
          }}</span>
        </button>

        <!-- Order Notifications Panel -->
        <transition name="dropdown">
          <div v-if="showOrderNotifications" class="notifications-panel order-panel">
            <div class="notifications-header">
              <h3>📋 Order Notifications</h3>
              <div class="header-actions">
                <span class="pending-count" v-if="orderPendingCount > 0">
                  {{ orderPendingCount }} pending
                </span>
                <button
                  class="mark-all"
                  @click="loadOrderNotifications(true)"
                  :disabled="orderLoading"
                >
                  🔄
                </button>
              </div>
            </div>

            <div
              class="notifications-list"
              v-if="!orderLoading"
              @scroll="handleOrderScroll"
              ref="orderListRef"
            >
              <div
                v-if="pendingOrders.length === 0"
                class="empty-notifications"
              >
                <span class="empty-icon">📋</span>
                <p>No pending orders</p>
              </div>
              
            <!-- In the order notification item template -->
<div
  v-for="order in pendingOrders"
  :key="order.id"
  class="notification-item pending order-item"
>
  <div class="notification-icon pending order-icon-bg">
    <span>📋</span>
  </div>
  <div class="notification-content">
    <div class="notification-header">
      <span class="request-code">{{ order.orderNumber }}</span>
      <span class="notification-time">{{ formatDate(order.sentAt) }}</span>
    </div>
    <p class="notification-message">
      Order for <strong>{{ order.productName }}</strong>
      from <strong>{{ order.sentBy || 'Unknown' }}</strong>
    
    </p>
    <div class="notification-items">
      <span class="item-tag">
        {{ order.quantity }}  {{ order.packaging }}
      </span>
      <span v-if="order.items && order.items.length > 0" class="item-tag">
        {{ order.items.length }} item(s)
      </span>
    </div>
    <div class="notification-actions">
      <button
        class="btn-accept-small"
        @click.stop="openOrderAcceptModal(order)"
      >
        ✅ Accept
      </button>
      <button
        class="btn-reject-small"
        @click.stop="openOrderRejectModal(order)"
      >
        ❌ Reject
      </button>
    </div>
  </div>
</div>

              <div v-if="orderLoadingMore" class="loading-more">
                <div class="spinner-small"></div>
                <span>Loading more...</span>
              </div>

              <div
                v-if="
                  !hasMoreOrderPages &&
                  pendingOrders.length > 0 &&
                  !orderLoadingMore
                "
                class="no-more"
              >
                <span>— No more orders —</span>
              </div>
            </div>

            <div v-if="orderLoading && !orderLoadingMore" class="loading-notifications">
              <div class="spinner-small"></div>
              <span>Loading...</span>
            </div>

            <div class="notifications-footer">
              <button class="view-all" @click="goToOrderNotifications">
                View all orders history →
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- User Avatar -->
      <div class="user-avatar-btn" @click="toggleDropdown">
        <img
          :src="userProfilePicture"
          class="avatar"
          @error="handleImageError"
        />
        <svg
          class="dropdown-arrow"
          :class="{ rotated: isDropdownOpen }"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Dropdown Menu -->
      <transition name="dropdown">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div class="dropdown-header">
            <img
              :src="userProfilePicture"
              class="dropdown-avatar"
              @error="handleImageError"
            />
            <div class="dropdown-user-info">
              <span class="dropdown-user-name">{{ userDisplayName }}</span>
              <span
                class="dropdown-role-badge"
                :class="`role-${authStore.user?.role}`"
              >
                {{ getRoleTitle() }}
              </span>
              
              <div class="dropdown-store-info">
                <span v-if="storeName" class="store-info-item">
                  <span class="info-icon">🏪</span>
                  {{ storeName }}
                  <span v-if="storeId" class="store-id-badge">storeId: {{ storeId }}</span>
                </span>
                <span v-if="groupName" class="group-info-item">
                  <span class="info-icon">👥</span>
                  {{ groupName }}
                  <span v-if="groupId" class="group-id-badge">groupId: {{ groupId }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <button @click="goToProfile" class="dropdown-item">
            <svg
              class="dropdown-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>My Profile</span>
          </button>

          <div class="dropdown-divider"></div>

          <div
            v-if="
              authStore.user?.employeeCode || authStore.user?.departmentCode
            "
            class="dropdown-stats"
          >
            <div v-if="authStore.user?.employeeCode" class="stat-item">
              <span class="stat-label">Employee ID</span>
              <span class="stat-value">{{ authStore.user.employeeCode }}</span>
            </div>
          </div>

          <button @click="handleLogout" class="dropdown-item logout-item">
            <svg
              class="dropdown-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Backdrop -->
    <div
      v-if="isDropdownOpen || showNotifications || showOrderNotifications"
      class="dropdown-backdrop"
      @click="closeAll"
    ></div>

    <!-- ================================================================ -->
    <!-- EXISTING MODALS - UNTOUCHED -->
    <!-- ================================================================ -->

    <!-- Accept Confirmation Modal -->
    <div
      v-if="showAcceptModal"
      class="modal-overlay"
      @click.self="closeAcceptModal"
    >
      <div class="modal-container accept-modal" @click.stop>
        <div class="modal-header">
          <h3>✅ Confirm Acceptance</h3>
          <button class="modal-close" @click="closeAcceptModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">✅</div>
          <p class="confirmation-title">
            Are you sure you want to accept this request?
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{
                currentNotification?.request?.requestCode
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value"
                >{{
                  currentNotification?.request?.items?.length || 0
                }}
                item(s)</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested By:</span>
              <span class="detail-value">{{
                currentNotification?.request?.requestedByUser?.fullName ||
                "Unknown"
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asking Store:</span>
              <span class="detail-value">{{
                currentNotification?.request?.askingStore?.name || "Unknown"
              }}</span>
            </div>
          </div>
          <p class="confirm-text">
            This action will accept the request and move it forward in the
            approval process.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAcceptModal">
            Cancel
          </button>
          <button
            class="btn-accept-confirm"
            @click="confirmAccept"
            :disabled="accepting"
          >
            {{ accepting ? "Processing..." : "✅ Confirm Accept" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showRejectModal"
      class="modal-overlay"
      @click.self="closeRejectModal"
    >
      <div class="modal-container reject-modal" @click.stop>
        <div class="modal-header">
          <h3>🚫 Reject Request</h3>
          <button class="modal-close" @click="closeRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="request-summary">
            <p>
              <strong>Request:</strong>
              {{ currentNotification?.request?.requestCode }}
            </p>
            <p>
              <strong>Items:</strong>
              {{ currentNotification?.request?.items?.length || 0 }} items
            </p>
          </div>
          <div class="form-group">
            <label>Rejection Reason *</label>
            <textarea
              v-model="rejectReason"
              placeholder="Please provide a reason for rejecting..."
              rows="3"
              class="reject-textarea"
              @click.stop
              @keydown.stop
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRejectModal">
            Cancel
          </button>
          <button
            class="btn-danger"
            @click="confirmReject"
            :disabled="!rejectReason.trim() || submitting"
          >
            {{ submitting ? "Submitting..." : "Confirm Reject" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- NEW: ORDER MODALS -->
    <!-- ================================================================ -->

    <!-- Order Accept Modal -->
    <div
      v-if="showOrderAcceptModal"
      class="modal-overlay"
      @click.self="closeOrderAcceptModal"
    >
      <div class="modal-container accept-modal" @click.stop>
        <div class="modal-header">
          <h3>✅ Accept Order</h3>
          <button class="modal-close" @click="closeOrderAcceptModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">✅</div>
          <p class="confirmation-title">
            Are you sure you want to accept this order?
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Order:</span>
              <span class="detail-value">{{ currentOrder?.orderNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Product:</span>
              <span class="detail-value">{{ currentOrder?.productName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">{{ currentOrder?.quantity }} {{ currentOrder?.uom }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Store:</span>
              <span class="detail-value">{{ currentOrder?.storeName || 'N/A' }}</span>
            </div>
          </div>
          <p class="confirm-text">
            This will accept the order and move it to production.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeOrderAcceptModal">
            Cancel
          </button>
          <button
            class="btn-accept-confirm"
            @click="confirmOrderAccept"
            :disabled="orderAccepting"
          >
            {{ orderAccepting ? "Processing..." : "✅ Confirm Accept" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Order Reject Modal -->
    <div
      v-if="showOrderRejectModal"
      class="modal-overlay"
      @click.self="closeOrderRejectModal"
    >
      <div class="modal-container reject-modal" @click.stop>
        <div class="modal-header">
          <h3>🚫 Reject Order</h3>
          <button class="modal-close" @click="closeOrderRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="request-summary">
            <p>
              <strong>Order:</strong>
              {{ currentOrder?.orderNumber }}
            </p>
            <p>
              <strong>Product:</strong>
              {{ currentOrder?.productName }}
            </p>
            <p>
              <strong>Quantity:</strong>
              {{ currentOrder?.quantity }} {{ currentOrder?.uom }}
            </p>
          </div>
          <div class="form-group">
            <label>Rejection Reason *</label>
            <textarea
              v-model="orderRejectReason"
              placeholder="Please provide a reason for rejecting this order..."
              rows="3"
              class="reject-textarea"
              @click.stop
              @keydown.stop
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeOrderRejectModal">
            Cancel
          </button>
          <button
            class="btn-danger"
            @click="confirmOrderReject"
            :disabled="!orderRejectReason.trim() || orderSubmitting"
          >
            {{ orderSubmitting ? "Submitting..." : "Confirm Reject" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import orderService from "@/stores/orderService";

// Import demo image
import demoProfileImage from "@/assets/profile.png";

const emit = defineEmits(["toggle-sidebar"]);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ================================================================
// EXISTING STATE - UNTOUCHED
// ================================================================
const isDropdownOpen = ref(false);
const showNotifications = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);
const accepting = ref(false);
const notifications = ref([]);
const pagination = ref(null);
const currentNotification = ref(null);
const rejectReason = ref("");
const showAcceptModal = ref(false);
const showRejectModal = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
const refreshInterval = ref(null);
const notificationsListRef = ref(null);

// ================================================================
// NEW: ORDER NOTIFICATION STATE
// ================================================================
const showOrderNotifications = ref(false);
const orderLoading = ref(false);
const orderLoadingMore = ref(false);
const orderNotifications = ref([]);
const orderPagination = ref(null);
const currentOrder = ref(null);
const orderRejectReason = ref("");
const showOrderAcceptModal = ref(false);
const showOrderRejectModal = ref(false);
const orderAccepting = ref(false);
const orderSubmitting = ref(false);
const orderListRef = ref(null);

// ================================================================
// EXISTING COMPUTED - UNTOUCHED
// ================================================================
const pendingNotifications = computed(() => {
  return notifications.value.filter((n) => n.status === "pending");
});

const pendingCount = computed(() => {
  return pendingNotifications.value.length;
});

const hasMorePages = computed(() => {
  if (!pagination.value) return false;
  return pagination.value.page < pagination.value.pages;
});

// ================================================================
// NEW: ORDER COMPUTED
// ================================================================
const pendingOrders = computed(() => {
  return orderNotifications.value.filter((n) => n.status === "pending");
});

const orderPendingCount = computed(() => {
  return pendingOrders.value.length;
});

const hasMoreOrderPages = computed(() => {
  if (!orderPagination.value) return false;
  return orderPagination.value.page < orderPagination.value.pages;
});

// ================================================================
// EXISTING USER COMPUTED - UNTOUCHED
// ================================================================
const userDisplayName = computed(() => {
  const user = authStore.user;
  if (!user) return "User";
  return user.fullEmployeeName || user.fullName || "User";
});

const userProfilePicture = computed(() => {
  const user = authStore.user;
  if (!user) return demoProfileImage;
  
  if (user.profilePicture || user.profilePictureUrl) {
    return user.profilePicture || user.profilePictureUrl;
  }
  
  return demoProfileImage;
});

const storeName = computed(() => {
  const user = authStore.user;
  return user?.assignedStore?.name || 
         user?.storeName || 
         user?.store?.name || 
         null;
});

const storeId = computed(() => {
  const user = authStore.user;
  return user?.assignedStore?.id || 
         user?.storeId || 
         user?.store?.id || 
         null;
});

const groupName = computed(() => {
  const user = authStore.user;
  return user?.assignedGroup?.name || 
         user?.groupName || 
         user?.group?.name || 
         null;
});

const groupId = computed(() => {
  const user = authStore.user;
  return user?.assignedGroup?.id || 
         user?.group?.id || 
         user?.groupId || 
         null;
});

const hasDepartmentAccess = computed(() => {
  return !!authStore.user?.departmentId;
});

const hasGroupAccess = computed(() => {
  return !!(authStore.userStoreId && authStore.userGroupId);
});

// ================================================================
// EXISTING METHODS - UNTOUCHED
// ================================================================

const loadNotifications = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true;
      notifications.value = [];
      pagination.value = null;
    } else {
      loadingMore.value = true;
    }

    const storeId = authStore.userStoreId;
    const groupId = authStore.userGroupId;
    const departmentId = authStore.user?.departmentId;

    const hasGroupAccess = !!(storeId && groupId);
    const hasDeptAccess = !!departmentId;

    if (!hasGroupAccess && !hasDeptAccess) {
      notifications.value = [];
      pagination.value = null;
      loading.value = false;
      loadingMore.value = false;
      return;
    }

    const page = reset ? 1 : (pagination.value?.page || 0) + 1;
    let response = null;
    let allNotifications = [];

    if (hasGroupAccess && hasDeptAccess) {
      try {
        const [groupResponse, deptResponse] = await Promise.all([
          itemRequestService.getGroupNotifications(storeId, groupId, {
            status: "pending",
            limit: 10,
            page: page,
          }),
          itemRequestService.getDepartmentNotifications(departmentId, {
            status: "pending",
            limit: 10,
            page: page,
          })
        ]);

        const groupNotifs = groupResponse.success ? groupResponse.data?.notifications || [] : [];
        const deptNotifs = deptResponse.success ? deptResponse.data?.notifications || [] : [];

        allNotifications = [...groupNotifs, ...deptNotifs].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });

        response = {
          success: true,
          data: {
            notifications: allNotifications,
            pagination: {
              page: page,
              limit: 10,
              total: allNotifications.length,
              pages: Math.ceil(allNotifications.length / 10)
            }
          }
        };
      } catch (error) {
        console.error('❌ Error fetching both notifications:', error);
        try {
          const deptResponse = await itemRequestService.getDepartmentNotifications(departmentId, {
            status: "pending",
            limit: 10,
            page: page,
          });
          if (deptResponse.success) {
            response = deptResponse;
          }
        } catch (deptError) {
          console.error('❌ Error fetching department notifications:', deptError);
        }
      }
    } else if (hasDeptAccess && !hasGroupAccess) {
      response = await itemRequestService.getDepartmentNotifications(
        departmentId,
        {
          status: "pending",
          limit: 10,
          page: page,
        }
      );
    } else if (hasGroupAccess && !hasDeptAccess) {
      response = await itemRequestService.getGroupNotifications(
        storeId,
        groupId,
        {
          status: "pending",
          limit: 10,
          page: page,
        }
      );
    }

    if (response && response.success) {
      const newNotifications = response.data?.notifications || [];
      const newPagination = response.data?.pagination || null;

      if (reset) {
        notifications.value = newNotifications;
      } else {
        const existingIds = new Set(notifications.value.map((n) => n.id));
        const uniqueNew = newNotifications.filter(
          (n) => !existingIds.has(n.id)
        );
        notifications.value = [...notifications.value, ...uniqueNew];
      }

      pagination.value = newPagination;
    } else {
      if (reset) {
        notifications.value = [];
      }
    }
  } catch (error) {
    console.error("❌ Error loading notifications:", error);
    if (reset) {
      notifications.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMoreNotifications = async () => {
  if (loadingMore.value || !hasMorePages.value) return;
  await loadNotifications(false);
};

const handleScroll = (event) => {
  const element = event.target;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMoreNotifications();
  }
};

const showToastMessage = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// EXISTING ACCEPT/REJECT - UNTOUCHED
// ================================================================

const openAcceptModal = (notification) => {
  currentNotification.value = notification;
  showAcceptModal.value = true;
};

const closeAcceptModal = () => {
  showAcceptModal.value = false;
  currentNotification.value = null;
  accepting.value = false;
};

const confirmAccept = async () => {
  accepting.value = true;
  try {
    const response = await itemRequestService.acceptNotification(
      currentNotification.value.id,
    );
    if (response.success) {
      showToastMessage("✅ Request accepted successfully!", "success");
      await loadNotifications(true);
      closeAcceptModal();
    } else {
      showToastMessage(response.error || "Failed to accept request", "error");
    }
  } catch (error) {
    console.error("Error accepting notification:", error);
    showToastMessage("Failed to accept request", "error");
  } finally {
    accepting.value = false;
  }
};

const openRejectModal = (notification) => {
  currentNotification.value = notification;
  rejectReason.value = "";
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
  currentNotification.value = null;
  rejectReason.value = "";
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showToastMessage("Please provide a rejection reason", "warning");
    return;
  }

  submitting.value = true;
  try {
    const response = await itemRequestService.rejectNotification(
      currentNotification.value.id,
      rejectReason.value.trim(),
    );
    if (response.success) {
      showToastMessage("❌ Request rejected", "warning");
      await loadNotifications(true);
      closeRejectModal();
    } else {
      showToastMessage(response.error || "Failed to reject request", "error");
    }
  } catch (error) {
    console.error("Error rejecting notification:", error);
    showToastMessage("Failed to reject request", "error");
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// NEW: ORDER NOTIFICATION METHODS
// ================================================================

const loadOrderNotifications = async (reset = true) => {
  try {
    if (reset) {
      orderLoading.value = true;
      orderNotifications.value = [];
      orderPagination.value = null;
    } else {
      orderLoadingMore.value = true;
    }

    const storeId = authStore.userStoreId;
    
    if (!storeId) {
      orderNotifications.value = [];
      orderPagination.value = null;
      orderLoading.value = false;
      orderLoadingMore.value = false;
      return;
    }

    const page = reset ? 1 : (orderPagination.value?.page || 0) + 1;

    const response = await orderService.getOrderNotifications(storeId, {
      status: "pending",
      limit: 10,
      page: page,
    });

    if (response && response.success) {
      const newNotifications = response.data || [];
      const newPagination = response.pagination || null;

      if (reset) {
        orderNotifications.value = newNotifications;
      } else {
        const existingIds = new Set(orderNotifications.value.map((n) => n.id));
        const uniqueNew = newNotifications.filter(
          (n) => !existingIds.has(n.id)
        );
        orderNotifications.value = [...orderNotifications.value, ...uniqueNew];
      }

      orderPagination.value = newPagination;
    } else {
      if (reset) {
        orderNotifications.value = [];
      }
    }
  } catch (error) {
    console.error("❌ Error loading order notifications:", error);
    if (reset) {
      orderNotifications.value = [];
    }
  } finally {
    orderLoading.value = false;
    orderLoadingMore.value = false;
  }
};

const loadMoreOrders = async () => {
  if (orderLoadingMore.value || !hasMoreOrderPages.value) return;
  await loadOrderNotifications(false);
};

const handleOrderScroll = (event) => {
  const element = event.target;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMoreOrders();
  }
};

// ================================================================
// NEW: ORDER ACCEPT/REJECT
// ================================================================

const openOrderAcceptModal = (order) => {
  currentOrder.value = order;
  showOrderAcceptModal.value = true;
};

const closeOrderAcceptModal = () => {
  showOrderAcceptModal.value = false;
  currentOrder.value = null;
  orderAccepting.value = false;
};

const confirmOrderAccept = async () => {
  orderAccepting.value = true;
  try {
    const response = await orderService.acceptOrderNotification(
      currentOrder.value.id,
    );
    if (response.success) {
      showToastMessage("✅ Order accepted successfully!", "success");
      await loadOrderNotifications(true);
      closeOrderAcceptModal();
    } else {
      showToastMessage(response.message || "Failed to accept order", "error");
    }
  } catch (error) {
    console.error("Error accepting order:", error);
    showToastMessage("Failed to accept order", "error");
  } finally {
    orderAccepting.value = false;
  }
};

const openOrderRejectModal = (order) => {
  currentOrder.value = order;
  orderRejectReason.value = "";
  showOrderRejectModal.value = true;
};

const closeOrderRejectModal = () => {
  showOrderRejectModal.value = false;
  currentOrder.value = null;
  orderRejectReason.value = "";
};

const confirmOrderReject = async () => {
  if (!orderRejectReason.value.trim()) {
    showToastMessage("Please provide a rejection reason", "warning");
    return;
  }

  orderSubmitting.value = true;
  try {
    const response = await orderService.rejectOrderNotification(
      currentOrder.value.id,
      orderRejectReason.value.trim(),
    );
    if (response.success) {
      showToastMessage("❌ Order rejected", "warning");
      await loadOrderNotifications(true);
      closeOrderRejectModal();
    } else {
      showToastMessage(response.message || "Failed to reject order", "error");
    }
  } catch (error) {
    console.error("Error rejecting order:", error);
    showToastMessage("Failed to reject order", "error");
  } finally {
    orderSubmitting.value = false;
  }
};

// ================================================================
// UI TOGGLE METHODS
// ================================================================

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
  showNotifications.value = false;
  showOrderNotifications.value = false;
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  showOrderNotifications.value = false;
  isDropdownOpen.value = false;
  if (showNotifications.value) {
    loadNotifications(true);
  }
};

const toggleOrderNotifications = () => {
  showOrderNotifications.value = !showOrderNotifications.value;
  showNotifications.value = false;
  isDropdownOpen.value = false;
  if (showOrderNotifications.value) {
    loadOrderNotifications(true);
  }
};

const closeAll = () => {
  isDropdownOpen.value = false;
  showNotifications.value = false;
  showOrderNotifications.value = false;
};

const goToNotifications = () => {
  closeAll();
  router.push("/notifications");
};

const goToOrderNotifications = () => {
  closeAll();
  router.push("/order-notifications");
};

// ================================================================
// EXISTING HELPERS - UNTOUCHED
// ================================================================

const getRoleTitle = () => {
  const titles = {
    admin: "Administrator",
    hr: "HR Manager",
    finance: "Finance Officer",
    employee: "Employee",
    attendance: "Attendance Manager",
    storekeeper: "Storekeeper",
    store_it: "IT Store",
    checker: "Checker",
    cost: "Cost Analyst",
    nebret: "Asset Manager"
  };
  return titles[authStore.user?.role] || authStore.user?.role || "User";
};

const handleImageError = (e) => {
  e.target.src = demoProfileImage;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const goToProfile = () => {
  closeAll();
  router.push("/profile");
};

const handleLogout = async () => {
  closeAll();
  await authStore.logout();
  window.location.replace("/login");
};

const toggleSidebar = () => {
  emit("toggle-sidebar");
};

// ================================================================
// CLICK OUTSIDE HANDLER
// ================================================================

const handleClickOutside = (event) => {
  if (showAcceptModal.value || showRejectModal.value || showOrderAcceptModal.value || showOrderRejectModal.value) {
    const modalOverlay = document.querySelector(".modal-overlay");
    if (modalOverlay && modalOverlay.contains(event.target)) {
      return;
    }
  }

  const headerRight = document.querySelector(".header-right");
  if (headerRight && !headerRight.contains(event.target)) {
    closeAll();
  }
};

const handleEscapeKey = (event) => {
  if (event.key === "Escape") {
    if (showAcceptModal.value) {
      closeAcceptModal();
    } else if (showRejectModal.value) {
      closeRejectModal();
    } else if (showOrderAcceptModal.value) {
      closeOrderAcceptModal();
    } else if (showOrderRejectModal.value) {
      closeOrderRejectModal();
    } else {
      closeAll();
    }
  }
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscapeKey);

  if (authStore.isAuthenticated) {
    setTimeout(() => {
      loadNotifications(true);
      loadOrderNotifications(true);
    }, 500);
  }

  refreshInterval.value = setInterval(() => {
    if (
      authStore.isAuthenticated &&
      !showAcceptModal.value &&
      !showRejectModal.value &&
      !showOrderAcceptModal.value &&
      !showOrderRejectModal.value
    ) {
      loadNotifications(true);
      loadOrderNotifications(true);
    }
  }, 50000);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscapeKey);

  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
});
</script>

<style scoped>

/* Add to the <style> section */
.sent-by-tag {
  display: inline-block;
  font-size: 10px;
  color: #2563eb;
  background: #eff6ff;
  padding: 1px 8px;
  border-radius: 10px;
  margin-left: 6px;
  font-weight: 500;
}
/* ================================================================ */
/* EXISTING STYLES - UNTOUCHED */
/* ================================================================ */
.header {
  background: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  border-bottom: 1px solid #e9edf2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 0 0 auto;
}

.menu-btn {
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #e2e8f0;
}

.menu-icon {
  width: 20px;
  height: 20px;
  color: #475569;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.system-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b, #475569);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
}

.store-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 6px 18px 6px 12px;
  border-radius: 30px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: default;
}

.store-brand:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}

.store-brand.empty {
  background: transparent;
  border: 1px dashed #e2e8f0;
  box-shadow: none;
  padding: 6px 16px;
}

.store-brand.empty:hover {
  transform: none;
  border-color: #e2e8f0;
}

.store-icon-wrapper {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 2px 16px rgba(59, 130, 246, 0.4); }
}

.store-icon { font-size: 14px; line-height: 1; }

.store-info-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.store-name-main {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.store-id-tag {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 8px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.group-divider { color: #cbd5e1; font-weight: 300; font-size: 12px; }
.group-name-tag { font-size: 11px; color: #059669; font-weight: 500; }
.group-id-tag {
  font-size: 8px;
  font-weight: 600;
  color: #64748b;
  background: #ecfdf5;
  padding: 1px 6px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
}
.no-store-text { font-size: 13px; color: #94a3b8; font-weight: 500; }

.header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

/* ================================================================ */
/* EXISTING NOTIFICATION STYLES - UNTOUCHED */
/* ================================================================ */
.notification-dropdown { position: relative; }

.notification-btn {
  position: relative;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.notification-btn:hover { background: #f1f5f9; }

.notification-icon {
  width: 18px;
  height: 18px;
  color: #475569;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 20px;
  min-width: 14px;
}

.notifications-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 420px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

/* ================================================================ */
/* NEW: ORDER NOTIFICATION STYLES */
/* ================================================================ */
.notification-btn.order-btn {
  background: #f0fdf4;
}

.notification-btn.order-btn:hover {
  background: #dcfce7;
}

.notification-icon.order-icon {
  color: #059669;
}

.notification-badge.order-badge {
  background: #059669;
}

.notifications-panel.order-panel {
  right: -40px;
  width: 420px;
}

.order-item {
  border-left-color: #059669 !important;
}

.order-icon-bg {
  background: #dcfce7 !important;
}

/* ================================================================ */
/* EXISTING NOTIFICATIONS LIST - UNTOUCHED */
/* ================================================================ */
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.notifications-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-count { font-size: 11px; color: #f59e0b; font-weight: 600; }

.mark-all {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.mark-all:hover { background: #e2e8f0; }

.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
  padding: 4px 0;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.no-more {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
  font-size: 12px;
  border-top: 1px solid #f1f5f9;
}

.notification-item {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f5f7fb;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:hover { background: #fafbfc; }
.notification-item.pending { border-left: 3px solid #f59e0b; }
.notification-item.accepted { border-left: 3px solid #10b981; }
.notification-item.rejected { border-left: 3px solid #ef4444; }

.notification-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}
.notification-icon.pending { background: #fef3c7; }
.notification-icon.accepted { background: #dcfce7; }
.notification-icon.rejected { background: #fee2e2; }

.notification-content { flex: 1; min-width: 0; }

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.request-code {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
}

.notification-time { font-size: 10px; color: #94a3b8; flex-shrink: 0; }

.notification-message {
  font-size: 12px;
  color: #1e293b;
  margin: 2px 0 4px 0;
  line-height: 1.4;
}
.notification-message strong { color: #0f172a; }

.notification-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.item-tag {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 10px;
  color: #475569;
}
.item-more { font-size: 10px; color: #94a3b8; }

.notification-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.btn-accept-small {
  background: #10b981;
  color: white;
  border: none;
  padding: 2px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-accept-small:hover { background: #059669; }

.btn-reject-small {
  background: #ef4444;
  color: white;
  border: none;
  padding: 2px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reject-small:hover { background: #dc2626; }

.empty-notifications {
  text-align: center;
  padding: 30px 20px;
}
.empty-icon { font-size: 32px; display: block; margin-bottom: 4px; }
.empty-notifications p { color: #94a3b8; font-size: 13px; margin: 0; }

.loading-notifications {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #94a3b8;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.notifications-footer {
  padding: 8px 16px;
  text-align: center;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.view-all {
  background: none;
  border: none;
  font-size: 12px;
  color: #6a11cb;
  cursor: pointer;
  font-weight: 500;
}
.view-all:hover { text-decoration: underline; }

/* ================================================================ */
/* EXISTING DROPDOWN MENU - UNTOUCHED */
/* ================================================================ */
.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
  border-radius: 40px;
  transition: all 0.2s;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.user-avatar-btn:hover { background: #f1f5f9; }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.dropdown-arrow {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  transition: transform 0.2s;
}
.dropdown-arrow.rotated { transform: rotate(180deg); }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
  border: 1px solid #e2e8f0;
}

.dropdown-header {
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #f8fafc;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  flex-shrink: 0;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.dropdown-user-name { font-size: 14px; font-weight: 700; color: #1e293b; }

.dropdown-role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  width: fit-content;
}
.role-admin { background: #dc2626; color: white; }
.role-hr { background: #3b82f6; color: white; }
.role-finance { background: #10b981; color: white; }
.role-employee { background: #8b5cf6; color: white; }
.role-attendance { background: #f59e0b; color: white; }
.role-storekeeper { background: #059669; color: white; }
.role-store_it { background: #6a11cb; color: white; }
.role-checker { background: #6366f1; color: white; }
.role-cost { background: #f97316; color: white; }
.role-nebret { background: #14b8a6; color: white; }

.dropdown-store-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
  padding: 2px 0;
}
.store-info-item, .group-info-item {
  font-size: 11px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.store-info-item { color: #2563eb; background: #eff6ff; }
.group-info-item { color: #059669; background: #ecfdf5; }
.info-icon { font-size: 11px; flex-shrink: 0; }
.store-id-badge, .group-id-badge {
  font-size: 9px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0px 6px;
  border-radius: 8px;
  font-family: monospace;
  margin-left: 2px;
  flex-shrink: 0;
}

.dropdown-divider { height: 1px; background: #e2e8f0; margin: 6px 0; }

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}
.dropdown-item:hover { background: #f8fafc; }
.dropdown-icon { width: 16px; height: 16px; color: #64748b; }
.dropdown-item.logout-item { color: #ef4444; }
.dropdown-item.logout-item:hover { background: #fef2f2; }
.dropdown-item.logout-item .dropdown-icon { color: #ef4444; }

.dropdown-stats {
  padding: 8px 20px;
  display: flex;
  gap: 16px;
}
.stat-item { display: flex; flex-direction: column; gap: 1px; }
.stat-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; }
.stat-value { font-size: 11px; font-weight: 600; color: #1e293b; }

/* ================================================================ */
/* BACKDROP */
/* ================================================================ */
.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.1);
}

/* ================================================================ */
/* MODALS - EXISTING + NEW */
/* ================================================================ */
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
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.accept-modal, .reject-modal {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; }

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.modal-close:hover { background: #e2e8f0; color: #1e293b; }

.modal-body { padding: 20px; }

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  display: block;
  margin-bottom: 8px;
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
.detail-row:last-child { border-bottom: none; }
.detail-label { font-weight: 500; color: #64748b; font-size: 13px; }
.detail-value { color: #1e293b; font-weight: 500; font-size: 13px; }

.confirm-text {
  color: #475569;
  font-size: 13px;
  text-align: center;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.request-summary {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.request-summary p { margin: 4px 0; font-size: 13px; color: #475569; }
.request-summary strong { color: #1e293b; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}
.form-group label { font-size: 13px; font-weight: 500; color: #1e293b; }

.reject-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  transition: all 0.2s;
  font-family: inherit;
}
.reject-textarea:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-footer button {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary { background: #e2e8f0; color: #475569; }
.btn-secondary:hover { background: #cbd5e1; }

.btn-accept-confirm { background: #10b981; color: white; }
.btn-accept-confirm:hover:not(:disabled) { background: #059669; }
.btn-accept-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  max-width: 400px;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.toast.success { background: #10b981; color: white; }
.toast.error { background: #ef4444; color: white; }
.toast.warning { background: #f59e0b; color: white; }

/* ================================================================ */
/* TRANSITIONS */
/* ================================================================ */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .header { padding: 0 12px; height: 56px; }
  .header-center { padding: 0 8px; }
  .store-brand { padding: 4px 12px 4px 8px; gap: 6px; }
  .store-icon-wrapper { width: 22px; height: 22px; }
  .store-icon { font-size: 11px; }
  .store-name-main { font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .store-id-tag { font-size: 8px; padding: 0px 6px; }
  .menu-btn { padding: 6px; }
  .menu-icon { width: 18px; height: 18px; }
  .notifications-panel { width: 340px; right: -70px; }
  .notifications-panel.order-panel { width: 340px; right: -100px; }
  .dropdown-menu { width: 320px; right: -40px; }
  .dropdown-stats { flex-direction: column; gap: 6px; }
  .modal-container { width: 95%; }
  .dropdown-store-info { max-width: 100%; }
  .store-info-item, .group-info-item { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

@media (max-width: 480px) {
  .header { padding: 0 8px; height: 52px; }
  .store-brand { padding: 3px 8px 3px 6px; gap: 4px; }
  .store-icon-wrapper { width: 18px; height: 18px; }
  .store-icon { font-size: 9px; }
  .store-name-main { font-size: 10px; max-width: 80px; }
  .store-id-tag { font-size: 7px; padding: 0px 4px; }
  .system-name { font-size: 12px; }
  .menu-icon { width: 16px; height: 16px; }
  .notifications-panel { width: 300px; right: -90px; max-height: 500px; }
  .notifications-panel.order-panel { width: 300px; right: -110px; }
  .dropdown-menu { width: 290px; right: -50px; }
  .modal-container { width: 95%; }
  .notification-item { padding: 8px 12px; }
  .dropdown-store-info { max-width: 100%; }
  .store-info-item, .group-info-item { max-width: 100%; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .store-id-badge, .group-id-badge { font-size: 8px; padding: 0px 4px; }
}
</style>