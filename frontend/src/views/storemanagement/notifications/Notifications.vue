<!-- views/storemanagement/notifications/Notifications.vue -->
<template>
  <div class="nt-page">

    <!-- ==================== DETAIL VIEW (full page) ==================== -->
    <div v-if="detailTarget" class="nt-detail-page">
      <!-- Top action bar -->
      <div class="nt-detail-topbar">
        <button class="nt-back-btn" @click="closeDetail">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Notifications
        </button>

        <div class="nt-detail-actions">
          <span :class="['nt-status-badge', detailSummaryStatus]">
            {{ capitalize(detailSummaryStatus) }}
          </span>

          <template v-if="detailSummaryStatus === 'pending'">
            <button class="nt-action-btn reject" @click="openRejectFor(detailTarget)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Reject
            </button>
            <button class="nt-action-btn accept" @click="acceptAllPendingFor(detailTarget)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Accept all
            </button>
          </template>

          <button
            v-else-if="decidedApprovals(detailTarget).length > 0"
            class="nt-action-btn change"
            @click="openChangeFor(detailTarget)"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 12a9 9 0 0115-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 01-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Change decision
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="snapshotLoading[detailTarget.requestId]" class="nt-paper-loading">
        <div class="nt-paper-spinner"></div>
        <p>Loading paper view…</p>
      </div>

      <!-- Paper view -->
      <div v-else class="view-paper">
        <header class="paper-header">
          <h1 class="paper-motto">WE TRUST IN GOD!!!</h1>
          <h1 class="paper-motto">እግዚአብሔር ይባርክ!!!</h1>
          <h2 class="paper-company">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
          <h3 class="paper-subtitle">{{ snapshotHeader(detailTarget.requestId) }}</h3>

          <div class="paper-date-row">
            <span>
              <strong>REQ. NO:-</strong>
              {{ detailTarget.request.requestCode || detailTarget.requestId }}
            </span>
            <span class="paper-date-field">
              <strong>DATE:-</strong>
              <span class="paper-date-display">
                {{ formatPaperDate(getRequestedDate(detailTarget.request)) }}
              </span>
            </span>
          </div>
        </header>

        <table class="paper-items-table">
          <thead>
            <tr>
              <th
                v-if="snapshotMergeGroups(detailTarget.requestId).length > 0"
                class="no-print"
                style="width: 3%"
              >
                ☑
              </th>
              <th style="width: 6%">No</th>
              <th
                v-for="col in snapshotColumns(detailTarget.requestId)"
                :key="col.key"
                :style="{ width: col.width }"
              >
                {{ col.label }}
              </th>
              <th style="width: 10%">Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in snapshotItems(detailTarget.requestId)"
              :key="`v-${index}-${item.itemId}`"
              :class="{ 'row-merged-absorbed': isSnapshotAbsorbed(detailTarget.requestId, index) }"
            >
              <td
                v-if="snapshotMergeGroups(detailTarget.requestId).length > 0"
                class="no-print cell-checkbox"
              ></td>

              <td class="paper-row-number">{{ index + 1 }}</td>

              <td
                v-for="col in snapshotColumns(detailTarget.requestId)"
                :key="col.key"
                :class="{
                  'text-left': col.align === 'left',
                  'font-bold': col.bold,
                  'spec-cell': col.key === 'specification',
                }"
              >
                <template v-if="col.computed === 'totalPrice'">
                  {{ getSnapshotComputedValue(detailTarget.requestId, item, index, col) }}
                </template>
                <template v-else-if="col.editable">
                  {{ getSnapshotCustomCell(detailTarget.requestId, index, col.key) || '—' }}
                </template>
                <template v-else-if="col.key === 'uom'">
                  {{ getSnapshotUom(item) }}
                </template>
                <template v-else-if="col.key === 'quantity'">
                  {{ formatSnapshotQuantity(item.quantity) }}
                </template>
                <template v-else-if="col.key === 'brand'">
                  {{ item.brand || '' }}
                </template>
                <template v-else-if="col.key === 'model'">
                  {{ item.model || '' }}
                </template>
                <template v-else-if="col.key === 'specification'">
                  {{ item.specification || '' }}
                </template>
                <template v-else>
                  {{ getSnapshotColumnValue(item, col) }}
                </template>
              </td>

              <td
                v-if="isSnapshotMergeStart(detailTarget.requestId, index)"
                class="paper-remark-cell merged"
                :rowspan="getSnapshotMergeSize(detailTarget.requestId, index)"
              >
                <div class="merged-remark-content">
                  <span class="merged-remark-text">
                    {{ getSnapshotMergedRemark(detailTarget.requestId, index) || '—' }}
                  </span>
                </div>
              </td>
              <td
                v-else-if="!isSnapshotAbsorbed(detailTarget.requestId, index)"
                class="paper-remark-cell"
              >
                {{ item.remark || '' }}
              </td>
            </tr>

            <tr v-if="snapshotItems(detailTarget.requestId).length === 0">
              <td
                :colspan="
                  (snapshotMergeGroups(detailTarget.requestId).length > 0 ? 3 : 2) +
                  snapshotColumns(detailTarget.requestId).length +
                  1
                "
                class="no-items"
              >
                No items in this request
              </td>
            </tr>

            <tr v-if="snapshotHasTotalPrice(detailTarget.requestId)" class="paper-grand-total-row">
              <td
                :colspan="snapshotMergeGroups(detailTarget.requestId).length > 0 ? 2 : 1"
                class="paper-grand-total-spacer"
              ></td>
              <template
                v-for="col in snapshotColumns(detailTarget.requestId)"
                :key="`tot-${col.key}`"
              >
                <td v-if="col.key === 'unitPrice'" class="paper-grand-total-label">TOTAL</td>
                <td v-else-if="col.key === 'totalPrice'" class="paper-grand-total-value">
                  <span class="paper-grand-total-amount">
                    {{ getSnapshotGrandTotal(detailTarget.requestId) }}
                  </span>
                </td>
                <td v-else class="paper-grand-total-spacer"></td>
              </template>
              <td class="paper-grand-total-spacer"></td>
            </tr>
          </tbody>
        </table>

        <div class="paper-meta-grid">
          <div
            v-if="snapshotSectionVisibility(detailTarget.requestId).department"
            class="paper-meta-col"
          >
            <div class="paper-block-header">Department</div>
            <div class="paper-block-body paper-dept-body">
              <strong class="paper-dept-value">
                {{ getDepartmentForPaper(detailTarget) }}
              </strong>
            </div>
          </div>

          <div class="paper-meta-col">
            <div class="paper-block-header">Requested By</div>
            <div class="paper-block-body paper-workflow-body">
              <p>
                <strong>Name:-</strong>
                <span class="paper-inline">
                  {{ getRequestedByName(detailTarget) }}
                </span>
              </p>
              <p><strong>Signature</strong> _______________________</p>
            </div>
          </div>

          <div class="paper-meta-col">
            <div class="paper-block-header">Approved By</div>
            <div class="paper-block-body paper-workflow-body">
              <p>
                <strong>Name :-</strong>
                <span class="paper-inline">
                  {{ snapshotApprovedByName(detailTarget.requestId) || ' ' }}
                </span>
              </p>
              <p><strong>Signature</strong> _______________________</p>
            </div>
          </div>
        </div>

        <div class="paper-footer-sections">
          <div
            v-if="snapshotSectionVisibility(detailTarget.requestId).reason"
            class="paper-input-row"
          >
            <div class="paper-gray-label">Reason</div>
            <div class="paper-lines-container">
              <div class="paper-reason-readonly">
                {{ detailTarget.request.remark || '—' }}
              </div>
            </div>
          </div>

          <div
            v-if="snapshotSectionVisibility(detailTarget.requestId).comment"
            class="paper-input-row paper-short-width"
          >
            <div class="paper-gray-label">Comment</div>
            <div class="paper-lines-container">
              <div class="paper-write-line"></div>
              <div class="paper-write-line"></div>
            </div>
          </div>

          <div
            v-if="snapshotSectionVisibility(detailTarget.requestId).checkedBy"
            class="paper-checked-by"
          >
            <div class="paper-gray-label paper-inline-label">Checked By</div>
            <div class="paper-checked-body">
              <p><strong>Name</strong> _____________________________.</p>
              <p><strong>Signature</strong> _____________________.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Approvals section -->
      <div class="nt-detail-section">
        <div class="nt-block-header">
          <span class="nt-block-title">Approvals</span>
          <span class="nt-block-badge">{{ detailTarget.acceptedCount }}/{{ detailTarget.approvals.length }}</span>
        </div>
        <div class="nt-approvals-list">
          <div
            v-for="a in detailTarget.approvals"
            :key="a.id"
            class="nt-approval-item"
            :class="a.status"
          >
            <div class="nt-approval-item-icon">
              <svg v-if="a.approval_type === 'group'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              </svg>
            </div>
            <div class="nt-approval-item-body">
              <span class="nt-approval-item-name">
                {{ a.group?.name || a.department?.name || '—' }}
              </span>
              <span class="nt-approval-item-type">
                {{ a.approval_type === 'group' ? 'Group approval' : 'Department approval' }}
                <template v-if="a.respondedByUser">
                  · {{ a.respondedByUser.fullName || a.respondedByUser.username }}
                </template>
              </span>
              <span v-if="a.rejected_reason" class="nt-approval-item-reason">
                "{{ a.rejected_reason }}"
              </span>
            </div>
            <span class="nt-approval-item-status" :class="a.status">
              <svg v-if="a.status === 'pending'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <svg v-else-if="a.status === 'accepted'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== LIST VIEW ==================== -->
    <template v-else>
      <!-- TOP BAR -->
      <header class="nt-topbar">
        <div class="nt-topbar-left">
          <h1 class="nt-title">
            <span class="nt-title-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </span>
            Notifications
          </h1>
          <p class="nt-subtitle">
            <span class="nt-subtitle-dot"></span>
            <strong>{{ totalPendingRequests }}</strong>
            pending request{{ totalPendingRequests === 1 ? '' : 's' }} need your attention
          </p>
        </div>

        <div class="nt-topbar-actions">
          <div class="nt-segment">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="nt-seg-btn"
              :class="[`seg-${opt.value}`, { active: filterStatus === opt.value }]"
              @click="filterStatus = opt.value; onFilterChange()"
            >
              {{ opt.label }}
              <span class="nt-seg-count">{{ tabCounts[opt.value] ?? (summary[opt.value] || 0) }}</span>
            </button>
          </div>

          <button class="nt-icon-btn" @click="loadNotifications(true)" :disabled="loading" title="Refresh">
            <svg :class="{ spinning: loading }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </header>

      <!-- SEARCH -->
      <div class="nt-searchbar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search request code, item, user, or store…"
          @input="onSearchChange"
        />
        <button v-if="searchQuery" class="nt-search-clear" @click="searchQuery = ''; onFilterChange()">✕</button>
      </div>

      <!-- LOADING -->
      <div v-if="loading && notifications.length === 0" class="nt-list">
        <div v-for="i in 5" :key="i" class="nt-skeleton-card">
          <div class="nt-skeleton-stripe"></div>
          <div class="nt-skeleton-body">
            <div class="nt-skel-line" style="width: 30%"></div>
            <div class="nt-skel-line" style="width: 60%"></div>
            <div class="nt-skel-line" style="width: 45%"></div>
          </div>
        </div>
      </div>

      <!-- EMPTY -->
      <div v-else-if="groupedRequests.length === 0" class="nt-empty">
        <div class="nt-empty-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <h3>All caught up</h3>
        <p>
          {{ filterStatus === 'all'
              ? 'No notifications to review right now.'
              : `No ${filterStatus} notifications.` }}
        </p>
      </div>

      <!-- LIST -->
      <div v-else class="nt-list">
        <template v-for="(group, gi) in groupedNotifications" :key="gi">
          <div class="nt-date-divider">
            <span class="nt-date-label">{{ group.date }}</span>
            <span class="nt-divider-line"></span>
            <span class="nt-divider-count">{{ group.requests.length }}</span>
          </div>

          <div
            v-for="req in group.requests"
            :key="req.requestId"
            class="nt-request"
            :class="req.summaryStatus"
          >
            <button
              class="nt-request-header"
              @click="openDetail(req)"
            >
              <span class="nt-stripe" :class="req.summaryStatus"></span>

              <span class="nt-expand-arrow">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                  <polygon points="8,5 8,19 19,12" />
                </svg>
              </span>

              <span class="nt-cell nt-cell-code">
                <span class="nt-code-chip">{{ req.request.requestCode }}</span>
              </span>

              <span class="nt-cell nt-cell-items">
                <span class="nt-item-count">
                  {{ req.request.items?.length || 0 }} item(s)
                </span>
                <span class="nt-item-names">{{ getItemNames(req.request.items) }}</span>
              </span>

              <span class="nt-cell nt-cell-asking">
                <span class="nt-store-name" :class="{ other: isOther(req.request) }">
                  {{ getOriginName(req.request) }}
                </span>
              </span>

              <span class="nt-cell nt-cell-arrow">➡️</span>

              <span class="nt-cell nt-cell-supplying">
                <span class="nt-store-name">
                  {{ req.request.supplyingStore?.name || '—' }}
                </span>
              </span>

              <span class="nt-cell nt-cell-status">
                <span :class="['nt-status-badge', req.summaryStatus]">
                  {{ capitalize(req.summaryStatus) }}
                </span>

                <span class="nt-dots-row">
                  <span
                    v-for="a in req.approvals"
                    :key="a.id"
                    :class="[
                      'nt-notif-dot',
                      a.status,
                      a.approval_type === 'department' ? 'dept-dot' : 'group-dot',
                    ]"
                    :title="a.group?.name || a.department?.name || ''"
                  ></span>
                </span>

                <span v-if="req.request.isTemelash" class="nt-badge nt-badge-temelash">🔄 Temelash</span>
                <!-- <span v-if="req.request.isAsset" class="nt-badge nt-badge-asset">🏛️ Asset</span> -->
              </span>

              <span class="nt-cell nt-cell-time">
                {{ formatDate(getRequestedDate(req.request)) }}
              </span>
            </button>
          </div>
        </template>

        <!-- Pagination -->
        <div v-if="pagination && pagination.total > 0 && !searchQuery" class="nt-pagination">
          <button class="nt-page-btn" :disabled="currentPage <= 1 || loading" @click="goToPage(currentPage - 1)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div class="nt-page-numbers">
            <button
              v-for="(p, i) in visiblePages"
              :key="i"
              class="nt-page-num"
              :class="{ active: p === currentPage, dots: p === '...' }"
              :disabled="p === '...'"
              @click="p !== '...' && goToPage(p)"
            >{{ p }}</button>
          </div>
          <button class="nt-page-btn" :disabled="currentPage >= totalPages || loading" @click="goToPage(currentPage + 1)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </template>

    <!-- ==================== ACCEPT MODAL ==================== -->
    <transition name="modal">
      <div v-if="showAcceptModal" class="nt-modal-backdrop" @click.self="closeAcceptModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header accept">
            <div class="nt-modal-icon accept">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3>Confirm acceptance</h3>
              <p>You are about to accept this transfer request</p>
            </div>
            <button class="nt-modal-close" @click="closeAcceptModal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="nt-modal-body">
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request</span>
              <span class="nt-modal-value code">{{ currentRequestForAction?.request?.requestCode }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request date</span>
              <span class="nt-modal-value">{{ formatDateFull(getRequestedDate(currentRequestForAction?.request)) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">From</span>
              <span class="nt-modal-value">{{ getOriginName(currentRequestForAction?.request) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">To</span>
              <span class="nt-modal-value">{{ currentRequestForAction?.request?.supplyingStore?.name }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">Approvals pending</span>
              <span class="nt-modal-value">{{ currentRequestForAction?.pendingCount || 0 }}</span>
            </div>

            <template v-if="currentRequestForAction?.request?.isTemelash">
              <div class="nt-modal-row">
                <span class="nt-modal-label">Temelash from</span>
                <span class="nt-modal-value">{{ formatTemelashDate(currentRequestForAction.request.temelashFromDate) }}</span>
              </div>
              <div class="nt-modal-row">
                <span class="nt-modal-label">Return by</span>
                <span class="nt-modal-value">{{ formatTemelashDate(currentRequestForAction.request.temelashToDate) }}</span>
              </div>
            </template>

            <div v-if="currentRequestForAction?.request?.remark" class="nt-modal-row column">
              <span class="nt-modal-label">Remark</span>
              <span class="nt-modal-value small">{{ currentRequestForAction.request.remark }}</span>
            </div>

            <div v-if="currentRequestForAction?.request?.isTemelash" class="nt-temelash-banner" style="margin-top: 8px;">
              🔄 This is a <strong>Temelash</strong> request — items will be recorded as a temporary loan and must be returned by the date above.
            </div>
          </div>

          <div class="nt-modal-footer">
            <button class="nt-btn ghost" @click="closeAcceptModal">Cancel</button>
            <button class="nt-btn primary green" @click="confirmAccept" :disabled="accepting">
              {{ accepting ? 'Processing…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== REJECT MODAL ==================== -->
    <transition name="modal">
      <div v-if="showRejectModal" class="nt-modal-backdrop" @click.self="closeRejectModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header reject">
            <div class="nt-modal-icon reject">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <div>
              <h3>Reject request</h3>
              <p>Please provide a clear reason</p>
            </div>
            <button class="nt-modal-close" @click="closeRejectModal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="nt-modal-body">
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request</span>
              <span class="nt-modal-value code">{{ currentRequestForAction?.request?.requestCode }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request date</span>
              <span class="nt-modal-value">{{ formatDateFull(getRequestedDate(currentRequestForAction?.request)) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">From</span>
              <span class="nt-modal-value">{{ getOriginName(currentRequestForAction?.request) }}</span>
            </div>

            <div class="nt-field">
              <label>Reason <span class="req">*</span></label>
              <textarea
                v-model="rejectReason"
                rows="4"
                placeholder="Explain why this request is being rejected…"
                :class="{ error: rejectReasonError }"
              ></textarea>
              <span v-if="rejectReasonError" class="nt-error">{{ rejectReasonError }}</span>
            </div>
          </div>

          <div class="nt-modal-footer">
            <button class="nt-btn ghost" @click="closeRejectModal">Cancel</button>
            <button
              class="nt-btn primary red"
              @click="confirmReject"
              :disabled="!rejectReason.trim() || submitting"
            >
              {{ submitting ? 'Submitting…' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== CHANGE DECISION MODAL ==================== -->
    <transition name="modal">
      <div v-if="showChangeModal" class="nt-modal-backdrop" @click.self="closeChangeModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header change">
            <div class="nt-modal-icon change">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.2">
                <path d="M3 12a9 9 0 0115-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </div>
            <div>
              <h3>Change decision</h3>
              <p>Flip this approval between accepted and rejected</p>
            </div>
            <button class="nt-modal-close" @click="closeChangeModal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="nt-modal-body">
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request</span>
              <span class="nt-modal-value code">{{ changeTarget?.request?.requestCode }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request date</span>
              <span class="nt-modal-value">{{ formatDateFull(getRequestedDate(changeTarget?.request)) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">From</span>
              <span class="nt-modal-value">{{ getOriginName(changeTarget?.request) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">To</span>
              <span class="nt-modal-value">{{ changeTarget?.request?.supplyingStore?.name }}</span>
            </div>

            <div class="nt-field">
              <label>New decision <span class="req">*</span></label>
              <div class="nt-segment nt-segment-block">
                <button
                  type="button"
                  class="nt-seg-btn seg-accepted"
                  :class="{ active: changeStatus === 'accepted' }"
                  @click="changeStatus = 'accepted'; changeReasonError = ''"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Accept
                </button>
                <button
                  type="button"
                  class="nt-seg-btn seg-rejected"
                  :class="{ active: changeStatus === 'rejected' }"
                  @click="changeStatus = 'rejected'"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>

            <div v-if="changeStatus === 'rejected'" class="nt-field">
              <label>Reason <span class="req">*</span></label>
              <textarea
                v-model="changeReason"
                rows="4"
                placeholder="Explain why the decision is changing to rejected…"
                :class="{ error: changeReasonError }"
              ></textarea>
              <span v-if="changeReasonError" class="nt-error">{{ changeReasonError }}</span>
            </div>

            <div class="nt-temelash-banner" style="margin-top: 10px;">
              ⚠️ This action flips the current decision. Once changed, the parent request stays
              <strong>pending</strong> and there is no way to revert back to “pending”.
            </div>
          </div>

          <div class="nt-modal-footer">
            <button class="nt-btn ghost" @click="closeChangeModal">Cancel</button>
            <button
              class="nt-btn primary amber"
              @click="confirmChangeDecision"
              :disabled="changing || (changeStatus === 'rejected' && !changeReason.trim())"
            >
              {{ changing ? 'Updating…' : 'Confirm change' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="nt-toast" :class="toastType">
        <span class="nt-toast-icon">
          <svg v-if="toastType === 'success'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else-if="toastType === 'error'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'

const authStore = useAuthStore()

// ---------------- state ----------------
const loading = ref(false)
const submitting = ref(false)
const accepting = ref(false)
const notifications = ref([])
const pagination = ref(null)
const summary = ref({ total: 0, pending: 0, accepted: 0, rejected: 0 })
const currentRequestForAction = ref(null)
const rejectReason = ref('')
const rejectReasonError = ref('')
const showAcceptModal = ref(false)
const showRejectModal = ref(false)
const filterStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const statusOptions = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

// Detail view state
const detailTarget = ref(null)
const detailSummaryStatus = ref('pending')

// Change-decision state
const showChangeModal = ref(false)
const changeTarget = ref(null)
const changeStatus = ref('rejected')
const changeReason = ref('')
const changeReasonError = ref('')
const changing = ref(false)

// ==================== SNAPSHOT STATE ====================
const DEFAULT_VIEW_HEADER = 'ITEM REQUISITION FORM'

const snapshots = reactive({})
const snapshotLoading = reactive({})

const buildDefaultViewColumns = () => [
  { key: 'item',          label: 'Item',          width: '20%', visible: true, align: 'left' },
  { key: 'uom',           label: 'U.O.M',         width: '7%',  visible: true },
  { key: 'quantity',      label: 'Qty',           width: '7%',  visible: true, bold: true },
  { key: 'brand',         label: 'Brand',         width: '11%', visible: true },
  { key: 'model',         label: 'Model',         width: '11%', visible: true },
  { key: 'specification', label: 'Specification', width: '20%', visible: true },
]

const makeEmptySnapshot = () => ({
  header: DEFAULT_VIEW_HEADER,
  department: '',
  approvedByName: '',
  columns: buildDefaultViewColumns(),
  customCells: {},
  mergeGroups: [],
  items: [],
  sectionVisibility: { department: true, reason: true, comment: true, checkedBy: true },
})

const restoreSnapshotFromPayload = (snap) => {
  const out = makeEmptySnapshot()
  if (!snap) return out

  if (typeof snap.header === 'string') out.header = snap.header
  if (typeof snap.department === 'string') out.department = snap.department
  if (typeof snap.approvedByName === 'string') out.approvedByName = snap.approvedByName

  if (snap.sectionVisibility) {
    out.sectionVisibility = {
      department: true, reason: true, comment: true, checkedBy: true,
      ...snap.sectionVisibility,
    }
  }

  if (Array.isArray(snap.columnsConfig) && snap.columnsConfig.length > 0) {
    const builtin = new Map(buildDefaultViewColumns().map(c => [c.key, c]))
    const restored = []
    snap.columnsConfig.forEach(s => {
      const b = builtin.get(s.key)
      if (b) restored.push({ ...b, visible: s.visible !== false })
      else if (s.custom) {
        restored.push({
          key: s.key,
          label: s.label || 'Custom',
          width: s.width || '12%',
          visible: s.visible !== false,
          custom: true,
          editable: s.editable ?? true,
          kind: s.kind || 'text',
          computed: s.computed,
          pairedKey: s.pairedKey,
          align: s.align,
          bold: s.bold,
        })
      }
    })
    builtin.forEach((b, k) => {
      if (!restored.find(c => c.key === k)) restored.push({ ...b, visible: true })
    })
    out.columns = restored
  }

  if (snap.customCells && typeof snap.customCells === 'object') {
    out.customCells = { ...snap.customCells }
  }

  if (Array.isArray(snap.mergeGroups)) {
    out.mergeGroups = snap.mergeGroups.map(g => ({
      start: Number(g.start) || 0,
      size: Number(g.size) || 1,
      text: String(g.text ?? '—'),
    }))
  }

  if (Array.isArray(snap.items) && snap.items.length > 0) {
    out.items = snap.items.map(it => ({
      itemId: Number(it.itemId),
      code: it.code || '',
      name: it.name || '',
      quantity: Number(it.quantity) || 1,
      remark: it.remark || '',
      selectedUom: it.selectedUom || 'base',
      _baseUom: it.isBaseUom ? it.uomCode : it.uomCode || 'N/A',
      _convUom: it.isBaseUom ? 'N/A' : it.uomCode,
      specification: it.specification || '',
      brand: it.brand || '',
      model: it.model || '',
    }))
  }

  return out
}

const makeFallbackSnapshot = (req) => {
  const out = makeEmptySnapshot()
  out.items = (req.items || []).map(it => ({
    itemId: Number(it.itemId || it.id || 0),
    code: it.item?.code || it.itemCode || it.code || 'N/A',
    name: it.item?.name || it.itemName || it.name || 'Unknown',
    quantity: Number(it.quantity) || 1,
    remark: it.remark || '',
    selectedUom: it.selected_uom || 'base',
    _baseUom: it.uom_code || it.item?.uom?.code || 'N/A',
    _convUom: it.conversion_uom_code || it.item?.conversionUom?.code || 'N/A',
    specification: it.specification || it.item?.specText || '',
    brand: it.brand || it.item?.brand || '',
    model: it.model || it.item?.model || '',
  }))
  out.department =
    req.requestedByUser?.Department?.name ||
    req.department?.name ||
    ''
  return out
}

// ✅ FIX: no permanent cache — always re-fetch on open
const loadSnapshot = async (reqEntry) => {
  const rid = reqEntry.requestId
  if (!rid || snapshotLoading[rid]) return

  snapshotLoading[rid] = true
  try {
    const res = await itemRequestService.getRequestById(rid)
    let snapshot = null
    if (res?.success && res.data) {
      const snap = res.data.printOverride?.pageSnapshot ?? null
      if (snap) snapshot = restoreSnapshotFromPayload(snap)
    }
    if (!snapshot) snapshot = makeFallbackSnapshot(reqEntry.request)
    snapshots[rid] = snapshot
  } catch (err) {
    console.warn('Could not load print snapshot for', rid, err)
    snapshots[rid] = makeFallbackSnapshot(reqEntry.request)
  } finally {
    snapshotLoading[rid] = false
  }
}

// ---------------- snapshot accessors ----------------
const snapshotHeader = (rid) => snapshots[rid]?.header || DEFAULT_VIEW_HEADER
const snapshotApprovedByName = (rid) => snapshots[rid]?.approvedByName || ''
const snapshotColumns = (rid) =>
  (snapshots[rid]?.columns || buildDefaultViewColumns()).filter(c => c.visible !== false)
const snapshotItems = (rid) => snapshots[rid]?.items || []
const snapshotMergeGroups = (rid) => snapshots[rid]?.mergeGroups || []
const snapshotSectionVisibility = (rid) =>
  snapshots[rid]?.sectionVisibility || { department: true, reason: true, comment: true, checkedBy: true }

const getSnapshotCustomCell = (rid, rowIndex, colKey) =>
  snapshots[rid]?.customCells?.[String(rowIndex)]?.[colKey] || ''

const getSnapshotUom = (item) => {
  if (!item) return '—'
  if (item.selectedUom === 'conversion') return item._convUom || item._baseUom || '—'
  return item._baseUom || item.uom_code || item.uomCode || '—'
}

const formatSnapshotQuantity = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0.00'
  return n.toFixed(2)
}

const getSnapshotColumnValue = (item, col) => {
  if (col.key === 'item') {
    return item.name || item.standardName || item.item?.name || 'Unknown Item'
  }
  return ''
}

const getSnapshotComputedValue = (rid, item, rowIndex, col) => {
  if (col.computed === 'totalPrice') {
    const unit = parseFloat(getSnapshotCustomCell(rid, rowIndex, 'unitPrice')) || 0
    const qty = parseFloat(String(item?.quantity ?? 0)) || 0
    if (!unit || !qty) return ''
    return (unit * qty).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return ''
}

const snapshotHasTotalPrice = (rid) =>
  snapshotColumns(rid).some(c => c.key === 'totalPrice')

const getSnapshotGrandTotal = (rid) => {
  const cols = snapshotColumns(rid)
  const items = snapshotItems(rid)
  const totalCol = cols.find(c => c.key === 'totalPrice')
  if (!totalCol) return ''
  let sum = 0
  items.forEach((it, idx) => {
    const raw = getSnapshotComputedValue(rid, it, idx, totalCol)
    const num = parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) || 0
    sum += num
  })
  return sum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const isSnapshotAbsorbed = (rid, i) =>
  snapshotMergeGroups(rid).some(g => i > g.start && i < g.start + g.size)

const isSnapshotMergeStart = (rid, i) =>
  snapshotMergeGroups(rid).some(g => g.start === i)

const getSnapshotMergeSize = (rid, start) => {
  const g = snapshotMergeGroups(rid).find(grp => grp.start === start)
  return g ? g.size : 1
}

const getSnapshotMergedRemark = (rid, start) => {
  const g = snapshotMergeGroups(rid).find(grp => grp.start === start)
  return g ? g.text : ''
}

// ---------------- department (paper view: name, not role) ----------------
const getDepartmentForPaper = (reqEntry) => {
  if (!reqEntry) return 'N/A'

  const rid = reqEntry.requestId

  // 1️⃣ PRIORITY: The edited snapshot department (what the user typed/saved)
  const snapDept = snapshots[rid]?.department
  if (snapDept && String(snapDept).trim()) return String(snapDept).trim()

  // 2️⃣ Fallback: the raw pageSnapshot on the request's printOverride
  //    (in case snapshot hasn't been hydrated yet)
  const printOverride = reqEntry.request?.printOverride
  const rawSnapDept =
    printOverride?.pageSnapshot?.department ||
    printOverride?.department
  if (rawSnapDept && String(rawSnapDept).trim()) return String(rawSnapDept).trim()

  // 3️⃣ Fallback: the request-linked department record
  const realName =
    reqEntry.request?.department?.name ||
    reqEntry.request?.requestedByUser?.Department?.name

  if (realName && String(realName).trim()) return String(realName).trim()

  return 'N/A'
}

// ✅ NEW: "Requested By" — free-text field first, then linked user
const getRequestedByName = (reqEntry) => {
  if (!reqEntry) return '—'
  const req = reqEntry.request
  if (!req) return '—'

  const explicit = req.requestedBy
  if (explicit && String(explicit).trim()) return String(explicit).trim()

  const full = req.requestedByUser?.fullName
  if (full && String(full).trim()) return String(full).trim()

  const uname = req.requestedByUser?.username
  if (uname && String(uname).trim()) return String(uname).trim()

  return '—'
}

// ---------------- grouping ----------------
const requestsById = computed(() => {
  const map = new Map()
  for (const n of notifications.value) {
    const req = n.request
    if (!req) continue
    const rid = req.requestId
    if (!map.has(rid)) {
      map.set(rid, { requestId: rid, request: req, approvals: [], latestCreatedAt: 0 })
    }
    const entry = map.get(rid)
    entry.approvals.push(n)
    if (n.created_at && new Date(n.created_at).getTime() > entry.latestCreatedAt) {
      entry.latestCreatedAt = new Date(n.created_at).getTime()
    }
  }
  return Array.from(map.values()).map(entry => {
    const statuses = entry.approvals.map(a => a.status)
    const hasPending  = statuses.includes('pending')
    const hasRejected = statuses.includes('rejected')
    const hasAccepted = statuses.includes('accepted')
    let summaryStatus = 'pending'
    if (hasRejected) summaryStatus = 'rejected'
    else if (hasPending) summaryStatus = 'pending'
    else if (hasAccepted) summaryStatus = 'accepted'

    return {
      ...entry,
      summaryStatus,
      acceptedCount: statuses.filter(s => s === 'accepted').length,
      pendingCount:  statuses.filter(s => s === 'pending').length,
      rejectedCount: statuses.filter(s => s === 'rejected').length,
      rejections:    entry.approvals.filter(a => a.status === 'rejected'),
    }
  })
})

const filteredRequests = computed(() => {
  const all = requestsById.value
  if (filterStatus.value === 'all') return all
  return all.filter(req => req.summaryStatus === filterStatus.value)
})

const groupedRequests = computed(() => filteredRequests.value)

const groupedNotifications = computed(() => {
  const groups = {}
  const sorted = [...filteredRequests.value].sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
  for (const req of sorted) {
    const d = new Date(req.latestCreatedAt)
    const key = d.toDateString()
    if (!groups[key]) groups[key] = { date: formatDateGroup(d), requests: [] }
    groups[key].requests.push(req)
  }
  return Object.values(groups)
})

// ---------------- computed ----------------
const totalPages = computed(() => {
  const p = pagination.value
  if (!p) return 1
  const directPages = p.pages ?? p.totalPages ?? p.pageCount ?? p.lastPage
  if (directPages != null && Number(directPages) > 0) return Number(directPages)
  const total = Number(p.total ?? p.totalItems ?? 0)
  const limit = Number(p.limit ?? p.pageSize ?? pageSize.value ?? 10)
  return Math.max(1, Math.ceil(total / Math.max(1, limit)))
})

const totalPendingRequests = computed(() => {
  const serverPending = summary.value.pending
  if (typeof serverPending === 'number' && serverPending > 0) return serverPending
  return requestsById.value.filter(r => r.summaryStatus === 'pending').length
})

const tabCounts = computed(() => {
  const all = requestsById.value
  return {
    all: all.length,
    pending: all.filter(r => r.summaryStatus === 'pending').length,
    accepted: all.filter(r => r.summaryStatus === 'accepted').length,
    rejected: all.filter(r => r.summaryStatus === 'rejected').length,
  }
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ---------------- helpers ----------------
const utcToLocal = (utcDate) => {
  if (!utcDate) return new Date()
  const d = new Date(utcDate)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset)
}

const getRequestedDate = (request) =>
  request?.requestedAt ||
  request?.requested_at ||
  request?.requestedDate ||
  request?.createdAt ||
  null

const formatDate = (date) => {
  if (!date) return ''
  const d = utcToLocal(date)
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 'Just now'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const formatDateFull = (date) => {
  if (!date) return '—'
  const d = utcToLocal(date)
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const formatPaperDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const formatDateGroup = (date) => {
  const d = date instanceof Date ? date : utcToLocal(date)
  const today = new Date()
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const key = x => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
  if (key(d) === key(today)) return 'Today'
  if (key(d) === key(yest)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

const isOther = (request) => {
  const store = request?.askingStore
  if (!store) return false
  const code = (store.code || '').toUpperCase()
  const name = (store.name || '').trim().toLowerCase()
  return code === 'STORE-008' || name === 'other'
}

const getOriginName = (request) => {
  if (!request) return '—'
  if (isOther(request)) return request.requestedByUser?.Department?.name || 'External'
  return request.askingStore?.name || '—'
}

const getItemNames = (items) => {
  if (!items || items.length === 0) return ''
  const names = items.map(i => i.item?.name || i.itemName || i.name || 'Unknown')
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

// ---------------- Temelash ----------------
const formatTemelashDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------- change helpers ----------------
const decidedApprovals = (reqEntry) =>
  (reqEntry?.approvals || []).filter(a => a.status === 'accepted' || a.status === 'rejected')

// ---------------- detail view navigation ----------------
// ✅ FIX: re-fetch the request on open so edits made elsewhere show up
const openDetail = async (reqEntry) => {
  let freshEntry = reqEntry
  try {
    const res = await itemRequestService.getRequestById(reqEntry.requestId)
    if (res?.success && res.data) {
      freshEntry = { ...reqEntry, request: res.data }
    }
  } catch (err) {
    console.warn('Could not refresh request', reqEntry.requestId, err)
  }

  detailTarget.value = freshEntry
  detailSummaryStatus.value = freshEntry.summaryStatus
  window.scrollTo({ top: 0, behavior: 'auto' })
  await loadSnapshot(freshEntry)
}

const closeDetail = () => {
  detailTarget.value = null
  window.scrollTo({ top: 0, behavior: 'auto' })
}

// ---------------- load ----------------
const loadNotifications = async (resetPage = true) => {
  try {
    loading.value = true

    if (resetPage) {
      currentPage.value = 1
    }

    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    const departmentId = authStore.user?.departmentId
    const hasGroupAccess = !!(storeId && groupId)
    const hasDeptAccess = !!departmentId

    if (!hasGroupAccess && !hasDeptAccess) {
      notifications.value = []
      return
    }

    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
      search: searchQuery.value || undefined,
    }

    let response = null

    if (hasGroupAccess && hasDeptAccess) {
      const [g, d] = await Promise.all([
        itemRequestService.getGroupNotifications(storeId, groupId, params),
        itemRequestService.getDepartmentNotifications(departmentId, params),
      ])
      const gNotifs = g.success ? g.data?.notifications || [] : []
      const dNotifs = d.success ? d.data?.notifications || [] : []
      const merged = [...gNotifs, ...dNotifs]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const gPag = g.data?.pagination || {}
      const dPag = d.data?.pagination || {}
      const totalBoth = (gPag.total || 0) + (dPag.total || 0)
      const pagesBoth = Math.max(
        gPag.pages || 1,
        dPag.pages || 1,
        Math.ceil(totalBoth / (parseInt(pageSize.value) || 10))
      )

      const gs = g.data?.summary || {}
      const ds = d.data?.summary || {}

      response = {
        success: true,
        data: {
          notifications: merged,
          pagination: {
            page: currentPage.value,
            limit: pageSize.value,
            total: totalBoth,
            pages: pagesBoth,
          },
          summary: {
            total:    (gs.total    || 0) + (ds.total    || 0),
            pending:  (gs.pending  || 0) + (ds.pending  || 0),
            accepted: (gs.accepted || 0) + (ds.accepted || 0),
            rejected: (gs.rejected || 0) + (ds.rejected || 0),
          },
        },
      }
    } else if (hasGroupAccess) {
      response = await itemRequestService.getGroupNotifications(storeId, groupId, params)
    } else if (hasDeptAccess) {
      response = await itemRequestService.getDepartmentNotifications(departmentId, params)
    }

    if (response?.success) {
      notifications.value = response.data?.notifications || []
      pagination.value = response.data?.pagination || null
      summary.value = response.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 }
    } else {
      showToastMessage(response?.error || 'Failed to load', 'error')
      notifications.value = []
    }
  } catch (e) {
    console.error('Load error:', e)
    showToastMessage('Failed to load notifications', 'error')
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  if (p < 1 || p > totalPages.value || loading.value) return
  currentPage.value = p
  loadNotifications(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onFilterChange = () => loadNotifications(true)
const onSearchChange = () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadNotifications(true), 300)
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// ---------------- accept / reject ----------------
const acceptAllPendingFor = async (reqEntry) => {
  const pending = reqEntry.approvals.filter(a => a.status === 'pending')
  if (pending.length === 0) {
    showToastMessage('Nothing pending to accept', 'warning')
    return
  }
  currentRequestForAction.value = reqEntry
  showAcceptModal.value = true
}

const closeAcceptModal = () => {
  showAcceptModal.value = false
  currentRequestForAction.value = null
  accepting.value = false
}

const confirmAccept = async () => {
  const entry = currentRequestForAction.value
  if (!entry) return
  accepting.value = true
  try {
    const pending = entry.approvals.filter(a => a.status === 'pending')
    const results = await Promise.all(pending.map(a => itemRequestService.acceptNotification(a.id)))
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(`${ok} approval${ok === 1 ? '' : 's'} accepted`, 'success')
      delete snapshots[entry.requestId]
      await loadNotifications(true)
      if (detailTarget.value && detailTarget.value.requestId === entry.requestId) {
        const refreshed = requestsById.value.find(r => r.requestId === entry.requestId)
        if (refreshed) {
          detailTarget.value = refreshed
          detailSummaryStatus.value = refreshed.summaryStatus
          await loadSnapshot(refreshed)
        } else {
          closeDetail()
        }
      }
      closeAcceptModal()
    } else {
      showToastMessage('Failed to accept', 'error')
    }
  } catch {
    showToastMessage('Failed to accept', 'error')
  } finally {
    accepting.value = false
  }
}

const openRejectFor = (reqEntry) => {
  const pending = reqEntry.approvals.filter(a => a.status === 'pending')
  if (pending.length === 0) {
    showToastMessage('Nothing pending to reject', 'warning')
    return
  }
  currentRequestForAction.value = reqEntry
  rejectReason.value = ''
  rejectReasonError.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  currentRequestForAction.value = null
  rejectReason.value = ''
  rejectReasonError.value = ''
  submitting.value = false
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    rejectReasonError.value = 'Please provide a rejection reason'
    return
  }
  const entry = currentRequestForAction.value
  if (!entry) return
  submitting.value = true
  try {
    const pending = entry.approvals.filter(a => a.status === 'pending')
    const results = await Promise.all(
      pending.map(a => itemRequestService.rejectNotification(a.id, rejectReason.value.trim()))
    )
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(`Request rejected`, 'warning')
      delete snapshots[entry.requestId]
      await loadNotifications(true)
      if (detailTarget.value && detailTarget.value.requestId === entry.requestId) {
        const refreshed = requestsById.value.find(r => r.requestId === entry.requestId)
        if (refreshed) {
          detailTarget.value = refreshed
          detailSummaryStatus.value = refreshed.summaryStatus
          await loadSnapshot(refreshed)
        } else {
          closeDetail()
        }
      }
      closeRejectModal()
    } else {
      showToastMessage('Failed to reject', 'error')
    }
  } catch {
    showToastMessage('Failed to reject', 'error')
  } finally {
    submitting.value = false
  }
}

// ---------------- change decision ----------------
const openChangeFor = (reqEntry) => {
  const decided = decidedApprovals(reqEntry)
  if (decided.length === 0) {
    showToastMessage('Nothing decided to change', 'warning')
    return
  }
  changeTarget.value = reqEntry
  changeStatus.value = decided[0].status === 'accepted' ? 'rejected' : 'accepted'
  changeReason.value = ''
  changeReasonError.value = ''
  showChangeModal.value = true
}

const closeChangeModal = () => {
  showChangeModal.value = false
  changeTarget.value = null
  changeStatus.value = 'rejected'
  changeReason.value = ''
  changeReasonError.value = ''
  changing.value = false
}

const confirmChangeDecision = async () => {
  if (changeStatus.value === 'rejected' && !changeReason.value.trim()) {
    changeReasonError.value = 'Please provide a rejection reason'
    return
  }

  const entry = changeTarget.value
  if (!entry) return

  const targets = decidedApprovals(entry)
  if (targets.length === 0) {
    showToastMessage('Nothing decided to change', 'warning')
    closeChangeModal()
    return
  }

  changing.value = true
  try {
    const reason = changeStatus.value === 'rejected' ? changeReason.value.trim() : undefined
    const results = await Promise.all(
      targets.map(a =>
        itemRequestService.changeNotificationDecision(a.id, changeStatus.value, reason)
      )
    )
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(
        `Decision changed to ${changeStatus.value}`,
        changeStatus.value === 'accepted' ? 'success' : 'warning'
      )
      delete snapshots[entry.requestId]
      await loadNotifications(true)
      if (detailTarget.value && detailTarget.value.requestId === entry.requestId) {
        const refreshed = requestsById.value.find(r => r.requestId === entry.requestId)
        if (refreshed) {
          detailTarget.value = refreshed
          detailSummaryStatus.value = refreshed.summaryStatus
          await loadSnapshot(refreshed)
        } else {
          closeDetail()
        }
      }
      closeChangeModal()
    } else {
      const err = results.find(r => !r.success)?.error || 'Failed to change decision'
      showToastMessage(err, 'error')
    }
  } catch {
    showToastMessage('Failed to change decision', 'error')
  } finally {
    changing.value = false
  }
}

// ---------------- lifecycle ----------------
onMounted(() => loadNotifications(true))

watch([filterStatus], () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadNotifications(true), 200)
})
</script>

<style scoped>
/* ================= BASE ================= */
.nt-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 40px 64px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 768px) {
  .nt-page { padding: 20px 16px 48px; }
}

/* ================= DETAIL PAGE ================= */
.nt-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nt-detail-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  position: sticky;
  top: 8px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.nt-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-back-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.nt-detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nt-detail-actions .nt-action-btn {
  padding: 8px 14px;
  font-size: 12.5px;
  flex: 0 0 auto;
}

.nt-detail-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

/* ================= TOPBAR ================= */
.nt-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.nt-topbar-left { min-width: 0; }

.nt-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.8px;
  margin: 0;
  color: #0f172a;
}

.nt-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #ede9fe;
  color: #6d28d9;
  flex-shrink: 0;
}

.nt-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #64748b;
  margin: 8px 0 0 48px;
  font-weight: 500;
}

.nt-subtitle strong { color: #6d28d9; font-weight: 700; }

.nt-subtitle-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #a78bfa;
}

.nt-topbar-actions { display: flex; align-items: center; gap: 10px; }

.nt-segment {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.nt-seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-seg-btn:hover:not(.active) { background: #f8fafc; color: #0f172a; }

.nt-seg-btn.active {
  background: #0f172a;
  color: #ffffff;
}

.nt-seg-btn.seg-pending.active  { background: #d97706; }
.nt-seg-btn.seg-accepted.active { background: #059669; }
.nt-seg-btn.seg-rejected.active { background: #dc2626; }

.nt-seg-count {
  background: rgba(15, 23, 42, 0.06);
  color: inherit;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
  min-width: 18px;
  text-align: center;
}

.nt-seg-btn.active .nt-seg-count { background: rgba(255, 255, 255, 0.25); }

.nt-icon-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-icon-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #6d28d9;
  border-color: #c4b5fd;
}

.nt-icon-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.nt-icon-btn svg.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ================= SEARCH ================= */
.nt-searchbar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 14px;
  height: 42px;
  margin-bottom: 24px;
  color: #94a3b8;
  transition: all 0.15s;
}

.nt-searchbar:focus-within {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.nt-searchbar input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: #0f172a;
  font-weight: 500;
}

.nt-searchbar input::placeholder { color: #94a3b8; font-weight: 400; }

.nt-search-clear {
  border: none; background: none; color: #94a3b8;
  cursor: pointer; font-size: 12px; padding: 4px;
  border-radius: 5px; transition: all 0.15s;
}

.nt-search-clear:hover { background: #f1f5f9; color: #0f172a; }

/* ================= LIST ================= */
.nt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nt-date-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 4px 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
}

.nt-date-label { color: #64748b; }
.nt-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
.nt-divider-count {
  font-size: 10px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 7px;
  border-radius: 8px;
  font-weight: 700;
}

/* ================= COLLAPSIBLE REQUEST ================= */
.nt-request {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.18s, border-color 0.18s;
}

.nt-request:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.nt-request-header {
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  gap: 0;
  min-height: 56px;
}

.nt-stripe {
  width: 4px;
  flex-shrink: 0;
  align-self: stretch;
}
.nt-stripe.pending  { background: #f59e0b; }
.nt-stripe.accepted { background: #10b981; }
.nt-stripe.rejected { background: #ef4444; }

.nt-expand-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 100%;
  flex-shrink: 0;
  color: #3b82f6;
}

.nt-expand-arrow svg { display: block; }

.nt-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 8px 10px;
  gap: 2px;
  font-size: 12px;
  color: #1e293b;
  border-right: 1px solid #f1f5f9;
}
.nt-cell:last-child { border-right: none; }

.nt-cell-code {
  flex: 0 0 auto;
  min-width: 130px;
  max-width: none;
  width: auto;
}

.nt-code-chip {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  background: #f8fafc;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  letter-spacing: 0.3px;
  align-self: flex-start;
  white-space: nowrap;
}

.nt-cell-items { flex: 1 1 180px; min-width: 120px; gap: 1px; }

.nt-item-count {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.nt-item-names {
  font-size: 10.5px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.nt-cell-asking { flex: 0 1 130px; min-width: 90px; }

.nt-cell-arrow {
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  padding: 8px 4px;
  color: #94a3b8;
}

.nt-cell-supplying { flex: 0 1 130px; min-width: 90px; }

.nt-store-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nt-store-name.other { color: #7c3aed; }

.nt-cell-status {
  flex: 0 0 130px;
  align-items: flex-start;
  gap: 4px;
}

.nt-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.nt-status-badge.pending  { background: #fef3c7; color: #92400e; }
.nt-status-badge.accepted { background: #d1fae5; color: #065f46; }
.nt-status-badge.rejected { background: #fee2e2; color: #991b1b; }

.nt-dots-row {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

.nt-notif-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
.nt-notif-dot.pending  { background: #f59e0b; }
.nt-notif-dot.accepted { background: #10b981; }
.nt-notif-dot.rejected { background: #ef4444; }
.nt-notif-dot.dept-dot {
  border-radius: 2px;
  transform: rotate(45deg);
  width: 7px;
  height: 7px;
  margin: 1px;
}

.nt-cell-time {
  flex: 0 0 80px;
  align-items: flex-end;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-align: right;
}

/* ================= LOADING ================= */
.nt-paper-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.nt-paper-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #6d28d9;
  border-radius: 50%;
  animation: nt-paper-spin 0.8s linear infinite;
}

@keyframes nt-paper-spin {
  to { transform: rotate(360deg); }
}

.nt-paper-loading p {
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* ================= PAPER VIEW ================= */
.view-paper {
  font-family: "Arial", sans-serif;
  color: #000;
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}

.paper-header { margin-bottom: 5px; }
.paper-motto {
  text-align: center;
  font-family: Georgia, serif;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 4px 0;
}
.paper-company {
  text-align: center;
  font-size: 21px;
  font-weight: 800;
  margin: 0 0 8px 0;
}
.paper-subtitle {
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 15px 0;
  color: #1a1a1a;
  border-radius: 6px;
  padding: 6px 10px;
}
.paper-date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 6px;
  padding: 8px 0;
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
}
.paper-date-field { display: inline-flex; align-items: center; gap: 6px; }
.paper-date-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
}

.paper-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-family: "Segoe UI", Tahoma, Verdana, sans-serif;
  font-size: 15px;
  table-layout: fixed;
}
.paper-items-table th,
.paper-items-table td {
  border: 1px solid #7f7f7f;
  padding: 10px 6px;
  text-align: center;
  height: 36px;
  word-wrap: break-word;
  vertical-align: middle;
}
.paper-items-table th {
  background-color: #c8c8c8;
  font-weight: 800;
  font-size: 16.5px;
  letter-spacing: 0.4px;
  padding: 12px 6px;
}
.paper-items-table td.text-left { text-align: left; padding-left: 8px; }
.paper-items-table .font-bold { font-weight: 700; }
.paper-items-table .no-items {
  padding: 20px !important;
  color: #7f7f7f;
  font-style: italic;
}
.paper-items-table .spec-cell { font-size: 14.5px; line-height: 1.4; }

.paper-row-number {
  padding: 4px !important;
  width: 44px;
  font-weight: 700;
  color: #0f172a;
  font-size: 14px;
}

.paper-remark-cell {
  padding: 8px !important;
  font-size: 14.5px;
  line-height: 1.4;
  vertical-align: middle;
  word-break: break-word;
}
.paper-remark-cell.merged {
  background: #fff;
  vertical-align: middle !important;
  border-top: none !important;
  border-bottom: none !important;
}
.merged-remark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px;
  min-height: 100%;
  text-align: center;
}
.merged-remark-text {
  font-size: 14.5px;
  line-height: 1.4;
  color: #000;
  text-align: center;
}
.row-merged-absorbed td { background: #fafafa; }

.paper-grand-total-row td {
  background: #e5e7eb !important;
  font-weight: 800;
  border-color: #7f7f7f !important;
  height: 40px;
}
.paper-grand-total-label,
.paper-grand-total-value,
.paper-grand-total-spacer { background: #e5e7eb !important; }
.paper-grand-total-label {
  text-align: center !important;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #111827;
  font-size: 15px;
}
.paper-grand-total-amount {
  font-weight: 900;
  font-size: 16px;
  color: #111827;
}

.paper-meta-grid {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 25px;
}
.paper-meta-col { flex: 1; }
.paper-block-header {
  background-color: #d9d9d9;
  border: none;
  padding: 5px;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}
.paper-block-body {
  padding: 12px 4px;
  font-size: 13px;
  min-height: 80px;
  border: none;
}
.paper-dept-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}
.paper-dept-value { font-size: 20px; font-weight: 600; text-align: center; }
.paper-workflow-body p {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: nowrap;
}
.paper-inline {
  display: inline-block;
  flex: 1;
  min-width: 100px;
  padding: 2px 6px;
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.paper-footer-sections { display: flex; flex-direction: column; gap: 15px; }
.paper-input-row {
  display: flex;
  width: 100%;
  border: 1px solid #7f7f7f;
  border-radius: 6px;
  overflow: hidden;
}
.paper-input-row.paper-short-width { width: 65%; }
.paper-gray-label {
  background-color: #d9d9d9;
  color: #000;
  font-weight: bold;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  min-height: 46px;
  padding: 10px 12px;
  text-align: center;
  flex-shrink: 0;
}
.paper-lines-container {
  flex-grow: 1;
  background-color: #fff;
  min-height: 46px;
}
.paper-reason-readonly {
  font-size: 13px;
  padding: 10px 12px;
  line-height: 1.5;
  min-height: 46px;
  box-sizing: border-box;
  color: #1e293b;
}
.paper-write-line {
  height: 22px;
  border-bottom: 1px solid #7f7f7f;
  background: #fff;
}
.paper-write-line:last-child { border-bottom: none; background: #f9f9f9; }

.paper-checked-by {
  display: flex;
  border: 1px solid #7f7f7f;
  border-radius: 6px;
  overflow: hidden;
  width: 65%;
}
.paper-gray-label.paper-inline-label { width: 220px; }
.paper-checked-body {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
}
.paper-checked-body p {
  margin: 8px 0;
  font-size: 13px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

/* ================= APPROVALS ================= */
.nt-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.nt-block-title {
  font-size: 10.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #64748b;
}

.nt-block-badge {
  font-size: 10.5px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
}

.nt-approvals-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.nt-approval-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.nt-approval-item:last-child { border-bottom: none; }
.nt-approval-item.pending  { background: #fffbeb; }
.nt-approval-item.accepted { background: #f0fdf4; }
.nt-approval-item.rejected { background: #fef2f2; }

.nt-approval-item-icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  flex-shrink: 0;
  color: #64748b;
}

.nt-approval-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.nt-approval-item-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nt-approval-item-type {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nt-approval-item-reason {
  font-size: 11px;
  color: #991b1b;
  font-weight: 600;
  font-style: italic;
  margin-top: 3px;
  padding: 3px 8px;
  background: rgba(254, 226, 226, 0.7);
  border-radius: 5px;
  display: inline-block;
  align-self: flex-start;
}

.nt-approval-item-status {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nt-approval-item-status.pending  { color: #d97706; }
.nt-approval-item-status.accepted { color: #059669; }
.nt-approval-item-status.rejected { color: #dc2626; }

/* ================= ACTIONS ================= */
.nt-action-btn {
  flex: 1;
  padding: 11px 18px;
  border-radius: 10px;
  border: none;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: -0.1px;
}

.nt-action-btn.accept {
  background: #10b981;
  color: #ffffff;
}

.nt-action-btn.accept:hover { background: #059669; }

.nt-action-btn.reject {
  background: #ffffff;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.nt-action-btn.reject:hover { background: #fef2f2; border-color: #fca5a5; }

.nt-action-btn.change {
  background: #ffffff;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.nt-action-btn.change:hover {
  background: #fff7ed;
  border-color: #fdba74;
}

/* ================= PAGINATION ================= */
.nt-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0 8px;
}

.nt-page-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.nt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.nt-page-numbers { display: flex; gap: 3px; }

.nt-page-num {
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12.5px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-page-num:hover:not(.dots):not(.active) { background: #f1f5f9; color: #0f172a; }
.nt-page-num.active { background: #0f172a; color: #ffffff; }
.nt-page-num.dots { cursor: default; color: #cbd5e1; }

/* ================= SKELETON ================= */
.nt-skeleton-card {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  min-height: 92px;
}

.nt-skeleton-stripe { width: 4px; background: #e2e8f0; }
.nt-skeleton-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 10px; justify-content: center; }

.nt-skel-line {
  height: 11px;
  border-radius: 5px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ================= EMPTY ================= */
.nt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.nt-empty-icon {
  margin-bottom: 16px;
  width: 72px; height: 72px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f5f3ff;
  color: #a78bfa;
}

.nt-empty h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 4px;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.nt-empty p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* ================= MODALS ================= */
.nt-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.nt-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 460px;
  max-width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.nt-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
}

.nt-modal-header.accept { background: #f0fdf4; }
.nt-modal-header.reject { background: #fef2f2; }
.nt-modal-header.change { background: #fff7ed; }

.nt-modal-icon {
  width: 42px; height: 42px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nt-modal-icon.accept { background: #10b981; }
.nt-modal-icon.reject { background: #ef4444; }
.nt-modal-icon.change { background: #f59e0b; }

.nt-modal-header h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.nt-modal-header p {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0;
  font-weight: 500;
}

.nt-modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 30px; height: 30px;
  border: none; background: transparent;
  border-radius: 7px;
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.nt-modal-close:hover { background: rgba(255, 255, 255, 0.8); color: #0f172a; }

.nt-modal-body {
  padding: 18px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nt-modal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.nt-modal-row:last-child { border-bottom: none; }
.nt-modal-row.column { flex-direction: column; align-items: stretch; gap: 6px; }

.nt-modal-label { font-size: 12px; color: #64748b; font-weight: 600; }

.nt-modal-value { font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; }
.nt-modal-value.code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #7c3aed;
  font-weight: 800;
}

.nt-modal-value.small {
  font-weight: 500;
  font-size: 12.5px;
  color: #334155;
  text-align: left;
  padding: 8px 11px;
  background: #f8fafc;
  border-radius: 7px;
}

.nt-field { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.nt-field label { font-size: 12px; font-weight: 800; color: #0f172a; }
.nt-field .req { color: #ef4444; }

.nt-field textarea {
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  padding: 11px 13px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.15s;
  outline: none;
}

.nt-field textarea:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.nt-field textarea.error { border-color: #ef4444; }
.nt-error { font-size: 11.5px; color: #ef4444; font-weight: 600; }

.nt-segment-block {
  display: flex;
  width: 100%;
}

.nt-segment-block .nt-seg-btn {
  flex: 1;
  justify-content: center;
  padding: 10px 12px;
  font-size: 13px;
}

.nt-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.nt-btn {
  padding: 10px 18px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: -0.1px;
}

.nt-btn.ghost {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #334155;
}

.nt-btn.ghost:hover { background: #f1f5f9; border-color: #cbd5e1; }

.nt-btn.primary { color: #ffffff; }
.nt-btn.primary.green { background: #10b981; }
.nt-btn.primary.green:hover:not(:disabled) { background: #059669; }
.nt-btn.primary.red { background: #ef4444; }
.nt-btn.primary.red:hover:not(:disabled) { background: #dc2626; }
.nt-btn.primary.amber { background: #f59e0b; }
.nt-btn.primary.amber:hover:not(:disabled) { background: #d97706; }
.nt-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================= TOAST ================= */
.nt-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  z-index: 2000;
  letter-spacing: -0.1px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
}

.nt-toast.success { background: #10b981; }
.nt-toast.error   { background: #ef4444; }
.nt-toast.warning { background: #f59e0b; }
.nt-toast-icon { display: inline-flex; align-items: center; }

/* ================= BADGES ================= */
.nt-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 5px;
  white-space: nowrap;
}

.nt-badge-temelash {
  background: #ffedd5;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.nt-badge-asset {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

/* ================= TEMELASH BANNER ================= */
.nt-temelash-banner {
  font-size: 12px;
  padding: 10px 13px;
  border-radius: 9px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.5;
}

.nt-temelash-banner strong {
  font-weight: 900;
}

/* ================= TRANSITIONS ================= */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .nt-modal { animation: nt-modal-in 0.22s cubic-bezier(.4,0,.2,1); }

@keyframes nt-modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .nt-title { font-size: 22px; }
  .nt-title-icon { width: 32px; height: 32px; border-radius: 9px; }
  .nt-subtitle { margin-left: 44px; font-size: 12.5px; }

  .nt-topbar { flex-direction: column; align-items: stretch; }
  .nt-topbar-actions { width: 100%; justify-content: space-between; }
  .nt-segment { flex: 1; overflow-x: auto; }
  .nt-seg-btn { padding: 6px 10px; font-size: 11.5px; }

  .nt-request-header {
    flex-wrap: wrap;
    min-height: 0;
  }
  .nt-expand-arrow { width: 26px; }
  .nt-cell {
    padding: 6px 8px;
    font-size: 11px;
    border-right: none;
  }
  .nt-cell-code {
    flex: 0 0 auto;
    min-width: 100px;
  }
  .nt-code-chip {
    font-size: 10px;
    padding: 2px 6px;
    white-space: nowrap;
  }
  .nt-cell-items { flex: 1 1 100%; min-width: 0; }
  .nt-cell-asking,
  .nt-cell-supplying { flex: 1 1 40%; }
  .nt-cell-arrow { flex: 0 0 24px; font-size: 11px; padding: 4px; }
  .nt-cell-status { flex: 0 0 100%; align-items: flex-start; }
  .nt-cell-time { flex: 0 0 100%; align-items: flex-start; text-align: left; }
  .nt-status-badge { font-size: 9px; padding: 2px 8px; }

  .nt-detail-topbar {
    position: static;
    flex-direction: column;
    align-items: stretch;
  }
  .nt-detail-actions { justify-content: space-between; }

  .view-paper { padding: 12px; }
  .paper-company { font-size: 16px; }
  .paper-motto { font-size: 14px; }
  .paper-subtitle { font-size: 13px; }
  .paper-items-table { font-size: 11px; }
  .paper-items-table th,
  .paper-items-table td { padding: 6px 4px; height: 30px; }
  .paper-meta-grid { flex-direction: column; gap: 12px; }
  .paper-short-width { width: 100% !important; }
  .paper-checked-by { width: 100% !important; }
  .paper-gray-label { width: 120px; font-size: 12px; }
}
</style>