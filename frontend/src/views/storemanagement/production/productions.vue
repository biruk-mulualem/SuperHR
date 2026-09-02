<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📋 Accepted Orders In Production</h2>
        <span class="total-badge">{{ productionOrders.length }} Orders</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search orders..."
            @input="onSearchChange"
          />
        </div>
        <div class="action-buttons">
          <button class="btn-issue" @click="openIssueModal">
            📤 Issue Materials
          </button>
          <button class="btn-return" @click="openReturnModal">
            📥 Return Materials
          </button>
          <button class="btn-request" @click="openRequestModal">
            📋 Additional Request
          </button>
          <button class="btn-export" @click="openExportModal" :disabled="exporting">
            <span v-if="exporting" class="spinner-small"></span>
            <span v-else>📊</span>
            {{ exporting ? "Report..." : "Report" }}
          </button>
          <button class="btn-filter-toggle" @click="toggleFilters">
            {{ showFilters ? '▲ Hide Filters' : '▼ Show Filters' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS - COLLAPSIBLE ==================== -->
    <div class="filter-wrapper" :class="{ 'filter-expanded': showFilters }">
      <div class="filter-bar">
        <div class="filter-group">
          <select
            v-model="filterStatus"
            class="filter-select"
            @change="onFilterChange"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div class="filter-group">
          <select
            v-model="filterProduct"
            class="filter-select"
            @change="onFilterChange"
          >
            <option value="">All Products</option>
            <option
              v-for="product in products"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }}
            </option>
          </select>
        </div>

        <button
          class="btn-clear-filters"
          @click="clearFilters"
          v-if="hasActiveFilters"
        >
          ✕ Clear Filters
        </button>
      </div>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalOrders }}</div>
          <div class="stat-label">Total Orders</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pendingOrders }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.completedOrders }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
    </div>

    <!-- ==================== PRODUCTION ORDERS TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading orders...</p>
      </div>
      <table v-else class="production-table">
        <thead>
          <tr>
            <th style="width:30px"></th>
            <th>Order #</th>
            <th>Products</th>
            <th>Total Qty</th>
            <th>Materials</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedOrders.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🏭</span>
                <p>No orders found</p>
                <small>Try adjusting your filters</small>
              </div>
            </td>
          </tr>
          <template v-for="order in paginatedOrders" :key="order.id">
            <!-- Main Row -->
            <tr
              :class="{
                'expanded-row': expandedRow === order.id
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(order.id)">
                  {{ expandedRow === order.id ? "▼" : "▶" }}
                </button>
              </td>
              <td>
                <span class="order-number">#{{ order.orderNumber }}</span>
              </td>
              <td>
                <div class="products-list">
                  <template v-for="(product, idx) in order.products" :key="idx">
                    <span v-if="idx < 2" class="product-tag">
                      {{ product.productName }}
                    </span>
                  </template>
                  <span v-if="order.products.length > 2" class="product-tag more-tag">
                    +{{ order.products.length - 2 }} more
                  </span>
                </div>
              </td>
              <td>
                <div class="total-qty-display">
                  {{ getTotalQuantity(order) }}
                  <span class="uom-tag">{{ order.products[0]?.uom || '' }}</span>
                </div>
              </td>
              <td>
                <div class="material-summary-cell">
                  <span class="material-count">{{ getTotalMaterials(order) }} items</span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', getStatusClass(order.status)]">
                  {{ order.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons-cell">
                  <button
                    class="btn-action print"
                    @click="printFormulation(order)"
                    title="Print Formulation"
                  >
                    🖨️
                  </button>
                  <button
                    class="btn-action complete"
                    v-if="order.status === 'Pending'"
                    @click="openCompleteModal(order)"
                    title="Complete Order"
                  >
                    ✅
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr v-if="expandedRow === order.id" class="detail-expand-row">
              <td colspan="7">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Order Info Section -->
                    <div class="info-row">
                      <div class="info-card">
                        <div class="info-label">📋 Order Information</div>
                        <div class="info-grid">
                          <div class="info-item">
                            <span class="label">Order Number</span>
                            <span class="value">#{{ order.orderNumber }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">Status</span>
                            <span :class="['status-badge', getStatusClass(order.status)]">
                              {{ order.status }}
                            </span>
                          </div>
                          <div class="info-item">
                            <span class="label">Created</span>
                            <span class="value">{{ formatDate(order.createdAt) }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">Total Products</span>
                            <span class="value">{{ order.products.length }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">Total Materials</span>
                            <span class="value">{{ getTotalMaterials(order) }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">Unique Materials</span>
                            <span class="value">{{ getUniqueMaterialsCount(order) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Products List -->
                    <div class="products-section">
                      <div class="products-header">
                        <span>📦 Products in this Order</span>
                        <span class="products-badge">{{ order.products.length }} products</span>
                      </div>
                      <div 
                        v-for="(product, pIdx) in order.products" 
                        :key="pIdx"
                        class="product-card"
                      >
                        <div class="product-card-header">
                          <div class="product-title">
                            <span class="product-number">#{{ pIdx + 1 }}</span>
                            <span class="product-name">{{ product.productName }}</span>
                            <span class="product-code">{{ product.productCode }}</span>
                          </div>
                          <div class="product-qty">
                            <span class="qty-label">Qty:</span>
                            <span class="qty-value">{{ formatNumber(product.quantity) }} {{ product.uom }}</span>
                          </div>
                        </div>

                        <!-- Materials Breakdown for this Product -->
                        <div class="materials-table-wrapper">
                          <div class="table-title">
                            <span>📦 Raw Materials Breakdown</span>
                            <span class="table-badge">{{ product.materials.length }} items</span>
                          </div>
                          <table class="materials-breakdown-table" :id="'formulation-'+order.id+'-'+pIdx">
                            <thead>
                              <tr>
                                <th style="width:5%">#</th>
                                <th style="width:20%">Material</th>
                                <th style="width:12%">Per Unit</th>
                                <th style="width:12%">× Order</th>
                                <th style="width:15%">Total Required</th>
                                <th style="width:12%">Issued</th>
                                <th style="width:12%">Returned</th>
                                <th style="width:12%">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(mat, idx) in product.materials"
                                :key="mat.id"
                                :class="getMaterialRowClass(mat)"
                              >
                                <td class="text-center">
                                  <span class="item-number">{{ idx + 1 }}</span>
                                </td>
                                <td>
                                  <div class="material-cell">
                                    <span class="material-code">{{ mat.code }}</span>
                                    <span class="material-name">{{ mat.name }}</span>
                                  </div>
                                </td>
                                <td class="text-center">
                                  <span class="per-unit">{{ formatNumber(mat.perUnit) }}</span>
                                  <span class="uom-small">{{ mat.uom }}</span>
                                </td>
                                <td class="text-center">
                                  <span class="multiply">× {{ formatNumber(product.quantity) }}</span>
                                </td>
                                <td class="text-center">
                                  <span class="total-required">{{ formatNumber(mat.required) }}</span>
                                  <span class="uom-small">{{ mat.uom }}</span>
                                </td>
                                <td class="text-center">
                                  <span class="issued-qty">{{ formatNumber(mat.issuedQty || 0) }}</span>
                                  <span class="uom-small">{{ mat.uom }}</span>
                                </td>
                                <td class="text-center">
                                  <span class="returned-qty">{{ formatNumber(mat.returnedQty || 0) }}</span>
                                  <span class="uom-small">{{ mat.uom }}</span>
                                </td>
                                <td class="text-center">
                                  <span :class="['status-tag', getMaterialStatusClass(mat)]">
                                    {{ getMaterialStatusText(mat) }}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <!-- ==================== FINAL TOTAL TABLE ==================== -->
                    <div class="final-total-section">
                      <div class="final-total-header">
                        <span>📊 Final Total - All Materials (Aggregated)</span>
                        <span class="final-total-badge">{{ getAggregatedMaterials(order).length }} unique materials</span>
                      </div>
                      <div class="final-total-note">
                        <span>ℹ️ Common materials used across multiple products are combined into a single total.</span>
                      </div>
                      <table class="final-total-table">
                        <thead>
                          <tr>
                            <th style="width:5%">#</th>
                            <th style="width:22%">Material</th>
                            <th style="width:10%">UOM</th>
                            <th style="width:15%">Total Required</th>
                            <th style="width:12%">Total Issued</th>
                            <th style="width:12%">Total Returned</th>
                            <th style="width:12%">Status</th>
                            <th style="width:12%">Products</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, index) in getAggregatedMaterials(order)"
                            :key="item.materialId"
                            :class="getAggregatedRowClass(item)"
                          >
                            <td class="text-center">
                              <span class="item-number">{{ index + 1 }}</span>
                            </td>
                            <td>
                              <div class="material-cell">
                                <span class="material-code">{{ item.code }}</span>
                                <span class="material-name">{{ item.name }}</span>
                              </div>
                            </td>
                            <td class="text-center">
                              <span class="uom-tag-final">{{ item.uom }}</span>
                            </td>
                            <td class="text-center">
                              <span class="total-required-final">{{ formatNumber(item.totalRequired) }}</span>
                              <span class="uom-small">{{ item.uom }}</span>
                            </td>
                            <td class="text-center">
                              <span class="issued-qty-final">{{ formatNumber(item.totalIssued) }}</span>
                              <span class="uom-small">{{ item.uom }}</span>
                            </td>
                            <td class="text-center">
                              <span class="returned-qty-final">{{ formatNumber(item.totalReturned) }}</span>
                              <span class="uom-small">{{ item.uom }}</span>
                            </td>
                            <td class="text-center">
                              <span :class="['status-tag', getAggregatedStatusClass(item)]">
                                {{ getAggregatedStatusText(item) }}
                              </span>
                            </td>
                            <td class="text-center">
                              <button 
                                class="btn-products-usage"
                                @click="openProductsUsageModal(item)"
                                title="View which products use this material"
                              >
                                📋 View Products
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
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
    <div class="pagination" v-if="filteredOrders.length > 0">
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
        <option :value="3">3 per page</option>
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
      </select>
    </div>

    <!-- ==================== COMPLETE ORDER MODAL ==================== -->
    <div
      v-if="showCompleteModal"
      class="modal-overlay"
      @click.self="closeCompleteModal"
    >
      <div class="modal-container complete-modal">
        <div class="modal-header complete-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">✅</span>
          </div>
          <div>
            <h3>Complete Production Order</h3>
            <p class="header-subtitle">Confirm completion of this production order</p>
          </div>
          <button class="modal-close" @click="closeCompleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="complete-order-info" v-if="selectedOrderForComplete">
            <div class="info-row">
              <span class="info-label">Order:</span>
              <span class="info-value">#{{ selectedOrderForComplete.orderNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Quantity:</span>
              <span class="info-value">{{ getTotalQuantity(selectedOrderForComplete) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Products:</span>
              <span class="info-value">{{ selectedOrderForComplete.products.length }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Status:</span>
              <span :class="['status-badge', getStatusClass(selectedOrderForComplete.status)]">
                {{ selectedOrderForComplete.status }}
              </span>
            </div>
          </div>

          <div class="complete-summary">
            <div class="summary-item">
              <span class="summary-label">Products:</span>
              <span class="summary-value">{{ selectedOrderForComplete?.products?.length || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Unique Materials:</span>
              <span class="summary-value">{{ getUniqueMaterialsCount(selectedOrderForComplete) }}</span>
            </div>
          </div>

          <div class="complete-warning">
            <span class="warning-icon">⚠️</span>
            <span>This action will mark the order as <strong>Completed</strong>. This cannot be undone.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeCompleteModal">✕ Cancel</button>
          <button
            class="btn-confirm"
            @click="confirmComplete"
            :disabled="processing"
          >
            <span v-if="processing" class="spinner-small"></span>
            <span v-else>✅ Yes, Complete Order</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== PRODUCTS USAGE MODAL ==================== -->
    <div
      v-if="showProductsUsageModal"
      class="modal-overlay"
      @click.self="closeProductsUsageModal"
    >
      <div class="modal-container usage-modal">
        <div class="modal-header usage-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">📦</span>
          </div>
          <div>
            <h3>Products Using This Material</h3>
            <p class="header-subtitle">{{ selectedMaterialForUsage?.name }} ({{ selectedMaterialForUsage?.code }})</p>
          </div>
          <button class="modal-close" @click="closeProductsUsageModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="usage-material-info">
            <div class="usage-info-item">
              <span class="usage-label">Code:</span>
              <span class="usage-value">{{ selectedMaterialForUsage?.code }}</span>
            </div>
            <div class="usage-info-item">
              <span class="usage-label">Name:</span>
              <span class="usage-value">{{ selectedMaterialForUsage?.name }}</span>
            </div>
            <div class="usage-info-item">
              <span class="usage-label">UOM:</span>
              <span class="usage-value">{{ selectedMaterialForUsage?.uom }}</span>
            </div>
            <div class="usage-info-item">
              <span class="usage-label">Total Required:</span>
              <span class="usage-value">{{ formatNumber(selectedMaterialForUsage?.totalRequired) }}</span>
            </div>
            <div class="usage-info-item">
              <span class="usage-label">Total Issued:</span>
              <span class="usage-value">{{ formatNumber(selectedMaterialForUsage?.totalIssued) }}</span>
            </div>
            <div class="usage-info-item">
              <span class="usage-label">Total Returned:</span>
              <span class="usage-value">{{ formatNumber(selectedMaterialForUsage?.totalReturned) }}</span>
            </div>
          </div>

          <div class="usage-products-list">
            <div class="usage-products-header">
              <span>📋 Products Using This Material</span>
              <span class="usage-count">{{ selectedMaterialForUsage?.usedInProducts?.length || 0 }} products</span>
            </div>
            <div
              v-for="(productName, idx) in selectedMaterialForUsage?.usedInProducts || []"
              :key="idx"
              class="usage-product-item"
            >
              <span class="usage-product-number">{{ idx + 1 }}</span>
              <span class="usage-product-name">{{ productName }}</span>
            </div>
            <div v-if="!selectedMaterialForUsage?.usedInProducts?.length" class="usage-no-products">
              No products using this material
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeProductsUsageModal">Close</button>
        </div>
      </div>
    </div>

    <!-- ==================== ISSUE CONFIRMATION MODAL ==================== -->
    <div
      v-if="showIssueConfirmModal"
      class="modal-overlay"
      @click.self="closeIssueConfirmModal"
    >
      <div class="modal-container issue-confirm-modal">
        <div class="modal-header issue-confirm-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">📤</span>
          </div>
          <div>
            <h3>Confirm Issue Materials</h3>
            <p class="header-subtitle">Review the materials to be issued</p>
          </div>
          <button class="modal-close" @click="closeIssueConfirmModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="issue-confirm-info">
            <div class="confirm-row">
              <span class="confirm-label">Store:</span>
              <span class="confirm-value">{{ getStoreName(selectedStoreId) }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Order:</span>
              <span class="confirm-value">#{{ selectedOrder?.orderNumber }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Materials:</span>
              <span class="confirm-value">{{ issueConfirmItems.length }} items</span>
            </div>
          </div>

          <div class="issue-confirm-list">
            <div class="confirm-list-header">
              <span>#</span>
              <span>Material</span>
              <span>Required</span>
              <span>UOM</span>
            </div>
            <div
              v-for="(item, idx) in issueConfirmItems"
              :key="idx"
              class="confirm-list-item"
            >
              <span>{{ idx + 1 }}</span>
              <span>{{ item.name }}</span>
              <span>{{ formatNumber(item.totalRequired) }}</span>
              <span>{{ item.uom }}</span>
            </div>
          </div>

          <div class="issue-confirm-warning">
            <span class="warning-icon">⚠️</span>
            <span>This will issue all materials listed above to the selected store.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeIssueConfirmModal">✕ Cancel</button>
          <button
            class="btn-confirm-issue"
            @click="confirmIssue"
            :disabled="processing"
          >
            <span v-if="processing" class="spinner-small"></span>
            <span v-else>✅ Confirm Issue</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ISSUE MATERIALS MODAL ==================== -->
    <div
      v-if="showIssueModal"
      class="modal-overlay"
      @click.self="closeIssueModal"
    >
      <div class="modal-container issue-modal">
        <div class="modal-header">
          <h3>📤 Issue Materials</h3>
          <button class="modal-close" @click="closeIssueModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="issue-info">
            Select store and order to issue all required materials for production.
          </p>

          <!-- Store and Order side by side -->
          <div class="issue-select-row">
            <div class="issue-store-select">
              <label>Select Store:</label>
              <select v-model="selectedStoreId" class="filter-select">
                <option value="">-- Select Store --</option>
                <option
                  v-for="store in storeList"
                  :key="store.id"
                  :value="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>

            <div class="issue-order-select">
              <label>Select Production Order:</label>
              <select v-model="selectedOrderId" class="filter-select" @change="onOrderSelect">
                <option value="">-- Select Order --</option>
                <option
                  v-for="order in availableOrders"
                  :key="order.id"
                  :value="order.id"
                >
                  #{{ order.orderNumber }}
                </option>
              </select>
            </div>
          </div>

          <!-- Material List - All selected automatically -->
          <div class="issue-item-list" v-if="selectedOrder">
            <div class="issue-all-selected-note">
              ✅ All materials below will be issued to the selected store
            </div>
            <div
              v-for="(item, index) in getAggregatedMaterials(selectedOrder)"
              :key="item.materialId"
              class="issue-item"
            >
              <div class="issue-item-info">
                <span class="issue-item-number">{{ index + 1 }}</span>
                <span class="issue-item-code">{{ item.code }}</span>
                <span class="issue-item-name">{{ item.name }}</span>
                <span class="issue-item-uom">{{ item.uom }}</span>
                <span class="issue-item-required">
                  Required: {{ formatNumber(item.totalRequired) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="no-issue-items">
            Please select a production order to view materials.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeIssueModal">Cancel</button>
          <button
            class="btn-primary"
            @click="openIssueConfirmModal"
            :disabled="!selectedOrderId || !selectedStoreId || processing"
          >
            {{ processing ? 'Processing...' : `Review & Issue` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== RETURN MATERIALS MODAL ==================== -->
    <div
      v-if="showReturnModal"
      class="modal-overlay"
      @click.self="closeReturnModal"
    >
      <div class="modal-container return-modal">
        <div class="modal-header">
          <h3>📥 Return Materials</h3>
          <button class="modal-close" @click="closeReturnModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="return-info">
            Select materials to return to the store and specify quantity.
          </p>

          <!-- Store and Order side by side -->
          <div class="return-select-row">
            <div class="return-store-select">
              <label>Select Store:</label>
              <select v-model="returnStoreId" class="filter-select">
                <option value="">-- Select Store --</option>
                <option
                  v-for="store in storeList"
                  :key="store.id"
                  :value="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>

            <div class="return-order-select">
              <label>Select Production Order:</label>
              <select v-model="returnOrderId" class="filter-select" @change="onReturnOrderSelect">
                <option value="">-- Select Order --</option>
                <option
                  v-for="order in pendingOrdersForReturn"
                  :key="order.id"
                  :value="order.id"
                >
                  #{{ order.orderNumber }}
                </option>
              </select>
            </div>
          </div>

          <div class="return-item-list" v-if="returnOrder">
            <div
              v-for="(item, index) in getAggregatedMaterials(returnOrder)"
              :key="item.materialId"
              class="return-item"
            >
              <div class="return-item-info">
                <span class="return-item-number">{{ index + 1 }}</span>
                <input
                  type="checkbox"
                  :checked="item.selected"
                  @change="toggleReturnSelection(item, $event)"
                  :disabled="(item.totalIssued - item.totalReturned) <= 0"
                />
                <span class="return-item-code">{{ item.code }}</span>
                <span class="return-item-name">{{ item.name }}</span>
                <span class="return-item-uom">{{ item.uom }}</span>
                <span class="return-item-issued">
                  Issued: {{ formatNumber(item.totalIssued) }}
                </span>
                <span class="return-item-returned" v-if="item.totalReturned > 0">
                  Returned: {{ formatNumber(item.totalReturned) }}
                </span>
                <span class="return-item-available" v-if="item.totalIssued - item.totalReturned > 0">
                  To Return: {{ formatNumber(item.totalIssued - item.totalReturned) }}
                </span>
              </div>
              <div class="return-item-input" v-if="item.selected">
                <label>Qty:</label>
                <input
                  type="number"
                  v-model.number="item.returnQty"
                  :max="item.totalIssued - item.totalReturned"
                  min="1"
                  step="1"
                  class="return-qty-input"
                  @focus="selectAllText($event)"
                />
                <span class="return-max">
                  Max: {{ formatNumber(item.totalIssued - item.totalReturned) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="no-return-items">
            Please select a production order to view materials.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeReturnModal">Cancel</button>
          <button
            class="btn-success"
            @click="processReturn"
            :disabled="!hasSelectedReturns || processing || !returnStoreId"
          >
            {{ processing ? 'Processing...' : `Return Selected` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== REQUEST MATERIAL MODAL ==================== -->
    <div
      v-if="showRequestModal"
      class="modal-overlay"
      @click.self="closeRequestModal"
    >
      <div class="modal-container request-modal">
        <div class="modal-header">
          <h3>📋 Additional Request</h3>
          <button class="modal-close" @click="closeRequestModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="request-info">
            Request additional materials outside of formulation if needed.
          </p>

          <!-- Store and Order side by side -->
          <div class="request-select-row">
            <div class="request-store-select">
              <label>From Store:</label>
              <select v-model="requestStoreId" class="filter-select">
                <option value="">-- Select Store --</option>
                <option
                  v-for="store in storeList"
                  :key="store.id"
                  :value="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>

            <div class="request-order-select">
              <label>For Order:</label>
              <select v-model="requestOrderId" class="filter-select" @change="onRequestOrderSelect">
                <option value="">-- Select Order --</option>
                <option
                  v-for="order in availableOrders"
                  :key="order.id"
                  :value="order.id"
                >
                  #{{ order.orderNumber }}
                </option>
              </select>
            </div>
          </div>

          <!-- Product and Material select -->
          <div class="request-select-row" v-if="requestOrder">
            <div class="request-product-select">
              <label>For Product:</label>
              <select v-model="requestProductId" class="filter-select" @change="onRequestProductSelect">
                <option value="">-- Select Product --</option>
                <option
                  v-for="(product, idx) in requestOrderProducts"
                  :key="idx"
                  :value="idx"
                >
                  {{ product.productName }}
                </option>
              </select>
            </div>

            <div class="request-material-select">
              <label>Material:</label>
              <select v-model="requestMaterialId" class="filter-select">
                <option value="">-- Select Material --</option>
                <option
                  v-for="mat in requestMaterials"
                  :key="mat.id"
                  :value="mat.id"
                >
                  {{ mat.code }} - {{ mat.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Quantity Input -->
          <div class="request-qty-row" v-if="requestMaterialId && requestProductId !== ''">
            <div class="request-qty-select">
              <label>Quantity:</label>
              <input
                type="number"
                v-model.number="requestQuantity"
                min="1"
                step="1"
                class="request-qty-input"
                placeholder="Enter quantity"
              />
              <span class="request-uom">{{ requestSelectedMaterial?.uom || '' }}</span>
            </div>
          </div>

          <!-- Material info when selected -->
          <div v-if="requestMaterialId && requestProductId !== ''" class="request-material-info">
            <div class="request-info-item">
              <span class="request-info-label">Material:</span>
              <span class="request-info-value">{{ requestSelectedMaterial?.name }}</span>
            </div>
            <div class="request-info-item">
              <span class="request-info-label">Required for order:</span>
              <span class="request-info-value">{{ formatNumber(requestSelectedMaterial?.totalRequired || 0) }} {{ requestSelectedMaterial?.uom || '' }}</span>
            </div>
            <div class="request-info-item">
              <span class="request-info-label">Already Issued:</span>
              <span class="request-info-value">{{ formatNumber(requestSelectedMaterial?.totalIssued || 0) }} {{ requestSelectedMaterial?.uom || '' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRequestModal">Cancel</button>
          <button
            class="btn-primary"
            @click="processRequest"
            :disabled="!requestStoreId || !requestOrderId || requestProductId === '' || !requestMaterialId || !requestQuantity || processing"
          >
            {{ processing ? 'Processing...' : 'Request Material' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div
      v-if="showExportModal"
      class="modal-overlay"
      @click.self="closeExportModal"
    >
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Generate Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" />
              Material Usage Summary
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button
            class="btn-primary"
            @click="exportSelectedReport"
            :disabled="exporting"
          >
            {{ exporting ? "Generating..." : "Generate Report" }}
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

<script setup>
import { ref, computed, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const isLoading = ref(false)
const processing = ref(false)
const exporting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)
const showIssueModal = ref(false)
const showIssueConfirmModal = ref(false)
const showReturnModal = ref(false)
const showRequestModal = ref(false)
const showCompleteModal = ref(false)
const showProductsUsageModal = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterProduct = ref('')
const currentPage = ref(1)
const pageSize = ref(3)

// Collapse state - default hidden
const showFilters = ref(false)

// Expand row (single row expansion)
const expandedRow = ref(null)

// Issue modal
const selectedOrderId = ref('')
const selectedStoreId = ref('')
const issueConfirmItems = ref([])
const returnOrderId = ref('')
const returnStoreId = ref('')
const selectedOrderForComplete = ref(null)
const selectedMaterialForUsage = ref(null)

// Request modal
const requestStoreId = ref('')
const requestOrderId = ref('')
const requestProductId = ref('')
const requestMaterialId = ref('')
const requestQuantity = ref(1)
const requestOrderProducts = ref([])
const requestMaterials = ref([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// DEMO DATA - STORES
// ================================================================
const storeList = ref([
  { id: 1, name: 'Main Store 1' },
  { id: 2, name: 'Main Store 2' },
  { id: 3, name: 'Main Store 3' },
  { id: 4, name: 'Paint Mini Store' },
  { id: 5, name: 'Fiber Mini Store' },
  { id: 6, name: 'Paint Mini-Mini Store' },
  { id: 7, name: 'Fiber Mini-Mini Store' }
])

// ================================================================
// DEMO DATA - PRODUCTS
// ================================================================
const products = ref([
  { id: 1, name: 'Premium White Paint', code: 'PWP-001', uom: 'L' },
  { id: 2, name: 'Industrial Epoxy Coating', code: 'IEC-002', uom: 'L' },
  { id: 3, name: 'Fiberglass Reinforced Panel', code: 'FRP-003', uom: 'pcs' },
  { id: 4, name: 'UV Resistant Sealant', code: 'UVS-004', uom: 'kg' },
  { id: 5, name: 'Heat Resistant Paint', code: 'HRP-005', uom: 'L' }
])

// ================================================================
// DEMO DATA - MATERIALS / RAW ITEMS
// ================================================================
const materials = ref([
  { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg' },
  { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg' },
  { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg' },
  { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg' },
  { id: 5, code: 'RM-005', name: 'Fiberglass Mat', uom: 'm' },
  { id: 6, code: 'RM-006', name: 'Polyester Resin', uom: 'kg' },
  { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg' },
  { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L' },
  { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg' },
  { id: 10, code: 'RM-010', name: 'Catalyst', uom: 'kg' }
])

// ================================================================
// DEMO DATA - FORMULATIONS (BOM) - Per Unit values
// ================================================================
const formulations = ref([
  {
    productId: 1,
    materials: [
      { materialId: 1, perUnit: 2.5 },
      { materialId: 2, perUnit: 3.0 },
      { materialId: 7, perUnit: 0.2 },
      { materialId: 8, perUnit: 1.0 },
      { materialId: 9, perUnit: 0.5 }
    ]
  },
  {
    productId: 2,
    materials: [
      { materialId: 3, perUnit: 2.0 },
      { materialId: 4, perUnit: 1.0 },
      { materialId: 8, perUnit: 0.8 },
      { materialId: 10, perUnit: 0.1 }
    ]
  },
  {
    productId: 3,
    materials: [
      { materialId: 5, perUnit: 1.5 },
      { materialId: 6, perUnit: 2.0 },
      { materialId: 10, perUnit: 0.2 }
    ]
  },
  {
    productId: 4,
    materials: [
      { materialId: 2, perUnit: 1.5 },
      { materialId: 7, perUnit: 0.5 },
      { materialId: 8, perUnit: 0.3 },
      { materialId: 9, perUnit: 0.2 }
    ]
  },
  {
    productId: 5,
    materials: [
      { materialId: 1, perUnit: 3.0 },
      { materialId: 3, perUnit: 2.5 },
      { materialId: 4, perUnit: 0.8 },
      { materialId: 8, perUnit: 0.5 },
      { materialId: 9, perUnit: 0.3 }
    ]
  }
])

// ================================================================
// DEMO DATA - PRODUCTION ORDERS (with 3-4 products per order)
// ================================================================
const productionOrders = ref([
  {
    id: 1,
    orderNumber: 'PO-2026-001',
    status: 'Completed',
    createdAt: '2026-08-20',
    products: [
      {
        productId: 1,
        productName: 'Premium White Paint',
        productCode: 'PWP-001',
        quantity: 100,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 2.5, required: 250, issuedQty: 250, returnedQty: 0 },
          { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg', perUnit: 3.0, required: 300, issuedQty: 300, returnedQty: 0 },
          { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg', perUnit: 0.2, required: 20, issuedQty: 20, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 1.0, required: 100, issuedQty: 100, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.5, required: 50, issuedQty: 50, returnedQty: 0 }
        ]
      },
      {
        productId: 4,
        productName: 'UV Resistant Sealant',
        productCode: 'UVS-004',
        quantity: 30,
        uom: 'kg',
        materials: [
          { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg', perUnit: 1.5, required: 45, issuedQty: 45, returnedQty: 0 },
          { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg', perUnit: 0.5, required: 15, issuedQty: 15, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.3, required: 9, issuedQty: 9, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.2, required: 6, issuedQty: 6, returnedQty: 0 }
        ]
      }
    ]
  },
  {
    id: 2,
    orderNumber: 'PO-2026-002',
    status: 'Pending',
    createdAt: '2026-08-22',
    products: [
      {
        productId: 2,
        productName: 'Industrial Epoxy Coating',
        productCode: 'IEC-002',
        quantity: 50,
        uom: 'L',
        materials: [
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.0, required: 100, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 1.0, required: 50, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.8, required: 40, issuedQty: 0, returnedQty: 0 },
          { id: 10, code: 'RM-010', name: 'Catalyst', uom: 'kg', perUnit: 0.1, required: 5, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 5,
        productName: 'Heat Resistant Paint',
        productCode: 'HRP-005',
        quantity: 30,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 3.0, required: 90, issuedQty: 0, returnedQty: 0 },
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.5, required: 75, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 0.8, required: 24, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.5, required: 15, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.3, required: 9, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 1,
        productName: 'Premium White Paint',
        productCode: 'PWP-001',
        quantity: 20,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 2.5, required: 50, issuedQty: 0, returnedQty: 0 },
          { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg', perUnit: 3.0, required: 60, issuedQty: 0, returnedQty: 0 },
          { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg', perUnit: 0.2, required: 4, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 1.0, required: 20, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.5, required: 10, issuedQty: 0, returnedQty: 0 }
        ]
      }
    ]
  },
  {
    id: 3,
    orderNumber: 'PO-2026-003',
    status: 'Pending',
    createdAt: '2026-08-25',
    products: [
      {
        productId: 3,
        productName: 'Fiberglass Reinforced Panel',
        productCode: 'FRP-003',
        quantity: 200,
        uom: 'pcs',
        materials: [
          { id: 5, code: 'RM-005', name: 'Fiberglass Mat', uom: 'm', perUnit: 1.5, required: 300, issuedQty: 0, returnedQty: 0 },
          { id: 6, code: 'RM-006', name: 'Polyester Resin', uom: 'kg', perUnit: 2.0, required: 400, issuedQty: 0, returnedQty: 0 },
          { id: 10, code: 'RM-010', name: 'Catalyst', uom: 'kg', perUnit: 0.2, required: 40, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 2,
        productName: 'Industrial Epoxy Coating',
        productCode: 'IEC-002',
        quantity: 25,
        uom: 'L',
        materials: [
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.0, required: 50, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 1.0, required: 25, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.8, required: 20, issuedQty: 0, returnedQty: 0 },
          { id: 10, code: 'RM-010', name: 'Catalyst', uom: 'kg', perUnit: 0.1, required: 2.5, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 5,
        productName: 'Heat Resistant Paint',
        productCode: 'HRP-005',
        quantity: 15,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 3.0, required: 45, issuedQty: 0, returnedQty: 0 },
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.5, required: 37.5, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 0.8, required: 12, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.5, required: 7.5, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.3, required: 4.5, issuedQty: 0, returnedQty: 0 }
        ]
      }
    ]
  },
  {
    id: 4,
    orderNumber: 'PO-2026-004',
    status: 'Pending',
    createdAt: '2026-08-26',
    products: [
      {
        productId: 4,
        productName: 'UV Resistant Sealant',
        productCode: 'UVS-004',
        quantity: 75,
        uom: 'kg',
        materials: [
          { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg', perUnit: 1.5, required: 112.5, issuedQty: 0, returnedQty: 0 },
          { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg', perUnit: 0.5, required: 37.5, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.3, required: 22.5, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.2, required: 15, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 1,
        productName: 'Premium White Paint',
        productCode: 'PWP-001',
        quantity: 20,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 2.5, required: 50, issuedQty: 0, returnedQty: 0 },
          { id: 2, code: 'RM-002', name: 'Acrylic Resin', uom: 'kg', perUnit: 3.0, required: 60, issuedQty: 0, returnedQty: 0 },
          { id: 7, code: 'RM-007', name: 'UV Stabilizer', uom: 'kg', perUnit: 0.2, required: 4, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 1.0, required: 20, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.5, required: 10, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 5,
        productName: 'Heat Resistant Paint',
        productCode: 'HRP-005',
        quantity: 10,
        uom: 'L',
        materials: [
          { id: 1, code: 'RM-001', name: 'Titanium Dioxide', uom: 'kg', perUnit: 3.0, required: 30, issuedQty: 0, returnedQty: 0 },
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.5, required: 25, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 0.8, required: 8, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.5, required: 5, issuedQty: 0, returnedQty: 0 },
          { id: 9, code: 'RM-009', name: 'Pigment Paste', uom: 'kg', perUnit: 0.3, required: 3, issuedQty: 0, returnedQty: 0 }
        ]
      },
      {
        productId: 2,
        productName: 'Industrial Epoxy Coating',
        productCode: 'IEC-002',
        quantity: 15,
        uom: 'L',
        materials: [
          { id: 3, code: 'RM-003', name: 'Epoxy Resin', uom: 'kg', perUnit: 2.0, required: 30, issuedQty: 0, returnedQty: 0 },
          { id: 4, code: 'RM-004', name: 'Hardener', uom: 'kg', perUnit: 1.0, required: 15, issuedQty: 0, returnedQty: 0 },
          { id: 8, code: 'RM-008', name: 'Solvent', uom: 'L', perUnit: 0.8, required: 12, issuedQty: 0, returnedQty: 0 },
          { id: 10, code: 'RM-010', name: 'Catalyst', uom: 'kg', perUnit: 0.1, required: 1.5, issuedQty: 0, returnedQty: 0 }
        ]
      }
    ]
  }
])

// ================================================================
// HELPER METHODS FOR ORDER AGGREGATION
// ================================================================

const getTotalQuantity = (order) => {
  if (!order || !order.products) return 0
  return order.products.reduce((sum, p) => sum + p.quantity, 0)
}

const getTotalMaterials = (order) => {
  if (!order || !order.products) return 0
  return order.products.reduce((sum, p) => sum + (p.materials?.length || 0), 0)
}

const getUniqueMaterialsCount = (order) => {
  return getAggregatedMaterials(order).length
}

// ================================================================
// AGGREGATED MATERIALS - FINAL TOTAL TABLE
// ================================================================

const getAggregatedMaterials = (order) => {
  if (!order || !order.products) return []
  
  const materialMap = new Map()
  
  order.products.forEach(product => {
    if (!product.materials) return
    
    product.materials.forEach(mat => {
      const key = mat.id
      
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          materialId: mat.id,
          code: mat.code,
          name: mat.name,
          uom: mat.uom,
          totalRequired: 0,
          totalIssued: 0,
          totalReturned: 0,
          usedInProducts: [],
          selected: false,
          issueQty: 1,
          returnQty: 1,
          remainingNeeded: 0,
          productId: product.productId,
          productName: product.productName
        })
      }
      
      const item = materialMap.get(key)
      item.totalRequired += mat.required || 0
      item.totalIssued += mat.issuedQty || 0
      item.totalReturned += mat.returnedQty || 0
      
      if (!item.usedInProducts.includes(product.productName)) {
        item.usedInProducts.push(product.productName)
      }
    })
  })
  
  const result = Array.from(materialMap.values()).sort((a, b) => a.code.localeCompare(b.code))
  result.forEach(item => {
    item.remainingNeeded = item.totalRequired - item.totalIssued + item.totalReturned
  })
  
  return result
}

const getAggregatedRowClass = (item) => {
  if (item.totalReturned >= item.totalRequired) return 'fully-returned'
  if (item.totalIssued >= item.totalRequired) return 'fully-issued'
  if (item.totalIssued > 0) return 'partially-issued'
  return 'pending'
}

const getAggregatedStatusClass = (item) => {
  if (item.totalReturned >= item.totalRequired) return 'fully-returned'
  if (item.totalIssued >= item.totalRequired) return 'fully-issued'
  if (item.totalIssued > 0) return 'partially-issued'
  return 'pending'
}

const getAggregatedStatusText = (item) => {
  const map = {
    'fully-returned': '✅ Fully Returned',
    'fully-issued': '✅ Fully Issued',
    'partially-issued': '⏳ Partial',
    'pending': '⏳ Pending'
  }
  return map[getAggregatedStatusClass(item)] || 'Unknown'
}

const getAggregatedIssuedPercentage = (item) => {
  if (!item || !item.totalRequired || item.totalRequired === 0) return 0
  return Math.min(100, ((item.totalIssued || 0) / item.totalRequired) * 100)
}

// ================================================================
// COMPUTED
// ================================================================

const hasActiveFilters = computed(() => {
  return filterStatus.value || filterProduct.value || searchQuery.value
})

const filteredOrders = computed(() => {
  let result = [...productionOrders.value]

  if (filterStatus.value) {
    result = result.filter(order => order.status === filterStatus.value)
  }

  if (filterProduct.value) {
    result = result.filter(order => {
      return order.products.some(p => p.productId === Number(filterProduct.value))
    })
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(order =>
      order.orderNumber.toLowerCase().includes(search) ||
      order.products.some(p => 
        p.productName.toLowerCase().includes(search) ||
        p.productCode.toLowerCase().includes(search)
      )
    )
  }

  return result
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / pageSize.value) || 1
})

const stats = computed(() => {
  const total = productionOrders.value.length
  const pending = productionOrders.value.filter(o => o.status === 'Pending').length
  const completed = productionOrders.value.filter(o => o.status === 'Completed').length

  return {
    totalOrders: total,
    pendingOrders: pending,
    completedOrders: completed
  }
})

// ================================================================
// ISSUE MODAL COMPUTED
// ================================================================

const availableOrders = computed(() => {
  return productionOrders.value.filter(order => order.status === 'Pending')
})

const selectedOrder = computed(() => {
  if (!selectedOrderId.value) return null
  return productionOrders.value.find(o => o.id === Number(selectedOrderId.value))
})

const pendingOrdersForReturn = computed(() => {
  return productionOrders.value.filter(order => order.status === 'Pending')
})

const returnOrder = computed(() => {
  if (!returnOrderId.value) return null
  return productionOrders.value.find(o => o.id === Number(returnOrderId.value))
})

const hasSelectedReturns = computed(() => {
  if (!returnOrder.value) return false
  const aggregated = getAggregatedMaterials(returnOrder.value)
  return aggregated.some(
    m => m.selected && m.returnQty > 0 && m.returnQty <= (m.totalIssued - m.totalReturned)
  )
})

// ================================================================
// REQUEST MODAL COMPUTED
// ================================================================

const requestOrder = computed(() => {
  if (!requestOrderId.value) return null
  return productionOrders.value.find(o => o.id === Number(requestOrderId.value))
})

const requestSelectedMaterial = computed(() => {
  if (!requestMaterialId.value) return null
  const aggregated = getAggregatedMaterials(requestOrder.value)
  return aggregated.find(m => m.materialId === Number(requestMaterialId.value))
})

// ================================================================
// HELPER METHODS
// ================================================================

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  const map = {
    'Pending': 'pending',
    'Completed': 'completed',
    'Cancelled': 'cancelled'
  }
  return map[status] || ''
}

const getMaterialRowClass = (mat) => {
  if (mat.returnedQty >= mat.required) return 'fully-returned'
  if (mat.issuedQty >= mat.required) return 'fully-issued'
  if (mat.issuedQty > 0) return 'partially-issued'
  return 'pending'
}

const getMaterialStatusClass = (mat) => {
  if (mat.returnedQty >= mat.required) return 'fully-returned'
  if (mat.issuedQty >= mat.required) return 'fully-issued'
  if (mat.issuedQty > 0) return 'partially-issued'
  return 'pending'
}

const getMaterialStatusText = (mat) => {
  const map = {
    'fully-returned': '✅ Fully Returned',
    'fully-issued': '✅ Fully Issued',
    'partially-issued': '⏳ Partial',
    'pending': '⏳ Pending'
  }
  return map[getMaterialStatusClass(mat)] || 'Unknown'
}

const getStoreName = (storeId) => {
  const store = storeList.value.find(s => s.id === Number(storeId))
  return store ? store.name : 'Unknown'
}

// ================================================================
// FILTERS & PAGINATION
// ================================================================

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filterStatus.value = ''
  filterProduct.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}

const selectAllText = (event) => {
  event.target.select()
}

// ================================================================
// PRINT FORMULATION
// ================================================================

const printFormulation = (order) => {
  // Open print window with only the formulation tables
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    showToastMessage('Please allow popups to print', 'warning')
    return
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Formulation - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin: 0; }
        .header p { font-size: 14px; color: #666; margin: 5px 0; }
        .product-section { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .product-title { background: #f5f5f5; padding: 10px 15px; font-weight: bold; font-size: 16px; border-bottom: 1px solid #ddd; }
        .product-title .qty { font-weight: normal; color: #666; margin-left: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #e8e8e8; padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .text-center { text-align: center; }
        .status-fully-issued { color: #16a34a; }
        .status-partially-issued { color: #d97706; }
        .status-pending { color: #94a3b8; }
        .status-fully-returned { color: #2563eb; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
        .agg-section { margin-top: 30px; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; }
        .agg-title { background: #eff6ff; padding: 10px 15px; font-weight: bold; font-size: 16px; border-bottom: 2px solid #3b82f6; }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Formulation Report</h1>
        <p><strong>Order:</strong> ${order.orderNumber} | <strong>Status:</strong> ${order.status} | <strong>Date:</strong> ${formatDate(order.createdAt)}</p>
      </div>
  `

  // Products
  order.products.forEach((product, idx) => {
    htmlContent += `
      <div class="product-section">
        <div class="product-title">
          #${idx + 1} ${product.productName} (${product.productCode})
          <span class="qty">Qty: ${formatNumber(product.quantity)} ${product.uom}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:5%">#</th>
              <th style="width:25%">Material</th>
              <th style="width:12%" class="text-center">Per Unit</th>
              <th style="width:12%" class="text-center">× Order</th>
              <th style="width:15%" class="text-center">Total Required</th>
              <th style="width:12%" class="text-center">Issued</th>
              <th style="width:12%" class="text-center">Returned</th>
              <th style="width:12%" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
    `
    product.materials.forEach((mat, mIdx) => {
      const statusClass = getMaterialStatusClass(mat)
      const statusText = getMaterialStatusText(mat)
      htmlContent += `
        <tr>
          <td class="text-center">${mIdx + 1}</td>
          <td>${mat.code} - ${mat.name}</td>
          <td class="text-center">${formatNumber(mat.perUnit)} ${mat.uom}</td>
          <td class="text-center">× ${formatNumber(product.quantity)}</td>
          <td class="text-center">${formatNumber(mat.required)} ${mat.uom}</td>
          <td class="text-center">${formatNumber(mat.issuedQty || 0)} ${mat.uom}</td>
          <td class="text-center">${formatNumber(mat.returnedQty || 0)} ${mat.uom}</td>
          <td class="text-center status-${statusClass}">${statusText}</td>
        </tr>
      `
    })
    htmlContent += `
          </tbody>
        </table>
      </div>
    `
  })

  // Aggregated section
  const aggregated = getAggregatedMaterials(order)
  htmlContent += `
    <div class="agg-section">
      <div class="agg-title">📊 Final Total - All Materials (Aggregated)</div>
      <table>
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th style="width:25%">Material</th>
            <th style="width:10%" class="text-center">UOM</th>
            <th style="width:18%" class="text-center">Total Required</th>
            <th style="width:14%" class="text-center">Total Issued</th>
            <th style="width:14%" class="text-center">Total Returned</th>
            <th style="width:14%" class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
  `
  aggregated.forEach((item, idx) => {
    const statusClass = getAggregatedStatusClass(item)
    const statusText = getAggregatedStatusText(item)
    htmlContent += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${item.code} - ${item.name}</td>
        <td class="text-center">${item.uom}</td>
        <td class="text-center">${formatNumber(item.totalRequired)} ${item.uom}</td>
        <td class="text-center">${formatNumber(item.totalIssued)} ${item.uom}</td>
        <td class="text-center">${formatNumber(item.totalReturned)} ${item.uom}</td>
        <td class="text-center status-${statusClass}">${statusText}</td>
      </tr>
    `
  })
  htmlContent += `
        </tbody>
      </table>
    </div>
  `

  htmlContent += `
      <div class="footer">
        Printed on ${new Date().toLocaleString()}
      </div>
      <script>
        window.onload = function() { window.print(); }
      </scr` + `ipt>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

// ================================================================
// EXPAND/COLLAPSE ROW
// ================================================================

const toggleExpand = (orderId) => {
  expandedRow.value = expandedRow.value === orderId ? null : orderId
}

// ================================================================
// COMPLETE ORDER MODAL
// ================================================================

const openCompleteModal = (order) => {
  selectedOrderForComplete.value = order
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  selectedOrderForComplete.value = null
}

const confirmComplete = async () => {
  if (!selectedOrderForComplete.value) return

  processing.value = true
  try {
    const order = productionOrders.value.find(o => o.id === selectedOrderForComplete.value.id)
    if (order) {
      order.status = 'Completed'
      showToastMessage(`✅ #${order.orderNumber} completed successfully!`, 'success')
    }
    closeCompleteModal()
  } catch (error) {
    console.error('Error completing order:', error)
    showToastMessage('Failed to complete order', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// PRODUCTS USAGE MODAL
// ================================================================

const openProductsUsageModal = (item) => {
  selectedMaterialForUsage.value = item
  showProductsUsageModal.value = true
}

const closeProductsUsageModal = () => {
  showProductsUsageModal.value = false
  selectedMaterialForUsage.value = null
}

// ================================================================
// ISSUE MODAL - WITH CONFIRMATION
// ================================================================

const openIssueModal = () => {
  selectedOrderId.value = ''
  selectedStoreId.value = ''
  showIssueModal.value = true
}

const closeIssueModal = () => {
  showIssueModal.value = false
  selectedOrderId.value = ''
  selectedStoreId.value = ''
}

const onOrderSelect = () => {
  // Auto-select all materials when order is selected
}

const openIssueConfirmModal = () => {
  if (!selectedOrder.value) return
  if (!selectedStoreId.value) {
    showToastMessage('Please select a store', 'warning')
    return
  }
  
  issueConfirmItems.value = getAggregatedMaterials(selectedOrder.value)
  showIssueConfirmModal.value = true
}

const closeIssueConfirmModal = () => {
  showIssueConfirmModal.value = false
  issueConfirmItems.value = []
}

const confirmIssue = async () => {
  if (!selectedOrder.value) return

  processing.value = true
  try {
    const aggregated = getAggregatedMaterials(selectedOrder.value)

    aggregated.forEach(item => {
      selectedOrder.value.products.forEach(product => {
        product.materials.forEach(mat => {
          if (mat.id === item.materialId) {
            const ratio = mat.required / item.totalRequired
            mat.issuedQty = (mat.issuedQty || 0) + (item.totalRequired * ratio)
            mat.issuedFromStore = selectedStoreId.value
          }
        })
      })
    })

    const storeName = storeList.value.find(s => s.id === Number(selectedStoreId.value))?.name || 'Unknown'
    showToastMessage(
      `✅ Issued all materials from ${storeName} for #${selectedOrder.value.orderNumber}`,
      'success'
    )
    closeIssueConfirmModal()
    closeIssueModal()
  } catch (error) {
    console.error('Error issuing materials:', error)
    showToastMessage('Failed to issue materials', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// RETURN MODAL - WITH QUANTITY INPUT
// ================================================================

const openReturnModal = () => {
  returnOrderId.value = ''
  returnStoreId.value = ''
  showReturnModal.value = true
}

const closeReturnModal = () => {
  showReturnModal.value = false
  returnOrderId.value = ''
  returnStoreId.value = ''
}

const onReturnOrderSelect = () => {
  if (returnOrder.value) {
    const aggregated = getAggregatedMaterials(returnOrder.value)
    aggregated.forEach(item => {
      item.selected = false
      item.returnQty = 1
    })
  }
}

const toggleReturnSelection = (item, event) => {
  item.selected = event.target.checked
  if (item.selected) {
    item.returnQty = Math.min(1, item.totalIssued - item.totalReturned)
  } else {
    item.returnQty = 0
  }
}

const processReturn = async () => {
  if (!returnOrder.value) return
  if (!returnStoreId.value) {
    showToastMessage('Please select a store', 'warning')
    return
  }

  // Check if all selected items have valid quantities
  const aggregated = getAggregatedMaterials(returnOrder.value)
  const selectedItems = aggregated.filter(m => m.selected)
  
  for (const item of selectedItems) {
    if (!item.returnQty || item.returnQty <= 0) {
      showToastMessage(`Please enter a valid quantity for ${item.name}`, 'warning')
      return
    }
    if (item.returnQty > (item.totalIssued - item.totalReturned)) {
      showToastMessage(`Quantity for ${item.name} exceeds available amount`, 'warning')
      return
    }
  }

  processing.value = true
  try {
    selectedItems.forEach(item => {
      returnOrder.value.products.forEach(product => {
        product.materials.forEach(mat => {
          if (mat.id === item.materialId) {
            const ratio = mat.issuedQty / item.totalIssued
            mat.returnedQty = (mat.returnedQty || 0) + (item.returnQty * ratio)
            mat.returnedToStore = returnStoreId.value
          }
        })
      })
    })

    const storeName = storeList.value.find(s => s.id === Number(returnStoreId.value))?.name || 'Unknown'
    showToastMessage(
      `✅ Returned ${selectedItems.length} materials to ${storeName} from #${returnOrder.value.orderNumber}`,
      'success'
    )
    closeReturnModal()
  } catch (error) {
    console.error('Error returning materials:', error)
    showToastMessage('Failed to return materials', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// REQUEST MODAL - ADDITIONAL REQUEST
// ================================================================

const openRequestModal = () => {
  requestStoreId.value = ''
  requestOrderId.value = ''
  requestProductId.value = ''
  requestMaterialId.value = ''
  requestQuantity.value = 1
  requestOrderProducts.value = []
  requestMaterials.value = []
  showRequestModal.value = true
}

const closeRequestModal = () => {
  showRequestModal.value = false
}

const onRequestOrderSelect = () => {
  requestProductId.value = ''
  requestMaterialId.value = ''
  requestMaterials.value = []
  
  if (requestOrder.value) {
    requestOrderProducts.value = requestOrder.value.products
  } else {
    requestOrderProducts.value = []
  }
}

const onRequestProductSelect = () => {
  requestMaterialId.value = ''
  
  if (requestProductId.value !== '' && requestOrder.value) {
    const product = requestOrder.value.products[Number(requestProductId.value)]
    if (product && product.materials) {
      requestMaterials.value = product.materials
    } else {
      requestMaterials.value = []
    }
  } else {
    requestMaterials.value = []
  }
}

const processRequest = async () => {
  if (!requestStoreId.value) {
    showToastMessage('Please select a store', 'warning')
    return
  }
  if (!requestOrderId.value) {
    showToastMessage('Please select an order', 'warning')
    return
  }
  if (requestProductId.value === '') {
    showToastMessage('Please select a product', 'warning')
    return
  }
  if (!requestMaterialId.value) {
    showToastMessage('Please select a material', 'warning')
    return
  }
  if (!requestQuantity.value || requestQuantity.value <= 0) {
    showToastMessage('Please enter a valid quantity', 'warning')
    return
  }

  processing.value = true
  try {
    const order = requestOrder.value
    const productIndex = Number(requestProductId.value)
    const product = order.products[productIndex]
    const material = product.materials.find(m => m.id === Number(requestMaterialId.value))
    
    if (material) {
      material.issuedQty = (material.issuedQty || 0) + requestQuantity.value
      material.issuedFromStore = requestStoreId.value
    }

    const storeName = storeList.value.find(s => s.id === Number(requestStoreId.value))?.name || 'Unknown'
    const materialName = materials.value.find(m => m.id === Number(requestMaterialId.value))?.name || 'Unknown'
    
    showToastMessage(
      `✅ Requested ${requestQuantity.value} ${materialName} from ${storeName} for #${order.orderNumber}`,
      'success'
    )
    closeRequestModal()
  } catch (error) {
    console.error('Error requesting material:', error)
    showToastMessage('Failed to request material', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// EXPORT
// ================================================================

const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = async () => {
  exporting.value = true
  try {
    let data = []

    if (exportType.value === 'full') {
      productionOrders.value.forEach(order => {
        order.products.forEach(product => {
          data.push({
            'Order #': order.orderNumber,
            'Product': product.productName,
            'Product Code': product.productCode,
            'Quantity': product.quantity,
            'UOM': product.uom,
            'Status': order.status,
            'Created': order.createdAt
          })
        })
      })
    } else {
      const matMap = new Map()
      productionOrders.value.forEach(order => {
        order.products.forEach(product => {
          product.materials.forEach(mat => {
            if (!matMap.has(mat.code)) {
              matMap.set(mat.code, {
                code: mat.code,
                name: mat.name,
                uom: mat.uom,
                totalRequired: 0,
                totalIssued: 0,
                totalReturned: 0
              })
            }
            const summary = matMap.get(mat.code)
            summary.totalRequired += mat.required
            summary.totalIssued += mat.issuedQty || 0
            summary.totalReturned += mat.returnedQty || 0
          })
        })
      })
      data = Array.from(matMap.values())
    }

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showToastMessage('✅ Report exported successfully!', 'success')
    closeExportModal()
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
  } finally {
    exporting.value = false
  }
}

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
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
  gap: 16px;
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
  width: 200px;
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

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-issue {
  background: #ef4444;
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

.btn-issue:hover {
  background: #dc2626;
}

.btn-return {
  background: #22c55e;
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

.btn-return:hover {
  background: #16a34a;
}

.btn-request {
  background: #8b5cf6;
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

.btn-request:hover {
  background: #7c3aed;
}

.btn-export {
  background: #10b981;
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

.btn-export:hover:not(:disabled) {
  background: #059669;
}
.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-filter-toggle {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
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

.btn-filter-toggle:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* FILTER WRAPPER - COLLAPSIBLE */
/* ================================================================ */
.filter-wrapper {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, margin 0.3s ease;
  margin-bottom: 0;
}

.filter-wrapper.filter-expanded {
  max-height: 400px;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  min-width: 150px;
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
  white-space: nowrap;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* STATS */
/* ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card:hover {
  background: #f1f5f9;
}

.stat-icon {
  font-size: 24px;
  background: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-container {
  overflow-x: auto;
  min-height: 200px;
}

.production-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.production-table th,
.production-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.production-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center {
  text-align: center;
}

.order-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.products-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.product-tag {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.product-tag.more-tag {
  background: #f1f5f9;
  color: #64748b;
  font-size: 10px;
  padding: 2px 6px;
}

.total-qty-display {
  font-weight: 600;
  color: #1e293b;
}

.uom-tag {
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
  margin-left: 4px;
}

.material-summary-cell {
  font-size: 12px;
  color: #64748b;
}

.material-count {
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* ================================================================ */
/* ACTION BUTTONS */
/* ================================================================ */
.action-buttons-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.btn-action {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action.complete {
  background: #d1fae5;
  color: #065f46;
}

.btn-action.complete:hover {
  background: #a7f3d0;
}

/* ================================================================ */
/* EXPAND ROW */
/* ================================================================ */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.expand-btn:hover {
  background: #e0e7ff;
}

.expanded-row {
  background: #f8fafc;
}

.detail-expand-row td {
  padding: 0 !important;
}

/* ================================================================ */
/* EXPAND DETAILS - VERTICAL LAYOUT */
/* ================================================================ */
.expand-details {
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ================================================================ */
/* INFO ROW */
/* ================================================================ */
.info-row {
  display: block;
}

.info-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
}

.info-card .info-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 12px;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #64748b;
}

.info-item .value {
  font-weight: 500;
  color: #1e293b;
}

/* ================================================================ */
/* PRODUCTS SECTION */
/* ================================================================ */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.products-badge {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 20px;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.product-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.product-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-number {
  font-weight: 600;
  color: #94a3b8;
  font-size: 12px;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.product-code {
  font-size: 12px;
  color: #94a3b8;
  background: white;
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.product-qty {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.product-qty .qty-label {
  color: #94a3b8;
}

.product-qty .qty-value {
  font-weight: 600;
  color: #1e293b;
}

/* ================================================================ */
/* MATERIALS TABLE - VERTICAL LAYOUT */
/* ================================================================ */
.materials-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 0 12px 12px 12px;
}

.table-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.table-badge {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  background: white;
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.materials-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.materials-breakdown-table thead th {
  padding: 8px 12px;
  text-align: left;
  background: #fafbfc;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 2px solid #e2e8f0;
}

.materials-breakdown-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.materials-breakdown-table tbody tr:last-child td {
  border-bottom: none;
}

.materials-breakdown-table tbody tr:hover {
  background: #f8fafc;
}

/* Row status colors */
.materials-breakdown-table tbody tr.fully-issued {
  background: #f0fdf4;
}

.materials-breakdown-table tbody tr.fully-issued:hover {
  background: #dcfce7;
}

.materials-breakdown-table tbody tr.partially-issued {
  background: #fffbeb;
}

.materials-breakdown-table tbody tr.partially-issued:hover {
  background: #fef3c7;
}

.materials-breakdown-table tbody tr.fully-returned {
  background: #eff6ff;
}

.materials-breakdown-table tbody tr.fully-returned:hover {
  background: #dbeafe;
}

.materials-breakdown-table tbody tr.pending {
  background: transparent;
}

.materials-breakdown-table tbody tr.pending:hover {
  background: #f8fafc;
}

/* Item Number */
.item-number {
  font-weight: 600;
  color: #94a3b8;
  font-size: 11px;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
}

/* Cell content styles */
.material-cell {
  display: flex;
  flex-direction: column;
}

.material-cell .material-code {
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
}

.material-cell .material-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.per-unit {
  font-weight: 600;
  color: #3b82f6;
  font-size: 13px;
}

.multiply {
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
}

.total-required {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.issued-qty {
  font-weight: 600;
  color: #2563eb;
}

.returned-qty {
  font-weight: 600;
  color: #22c55e;
}

.uom-small {
  font-size: 10px;
  color: #94a3b8;
  margin-left: 2px;
}

/* Status tags */
.status-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  display: inline-block;
  white-space: nowrap;
}

.status-tag.fully-issued {
  background: #d1fae5;
  color: #065f46;
}

.status-tag.partially-issued {
  background: #fef3c7;
  color: #92400e;
}

.status-tag.fully-returned {
  background: #dbeafe;
  color: #1e40af;
}

.status-tag.pending {
  background: #f1f5f9;
  color: #64748b;
}

/* ================================================================ */
/* FINAL TOTAL TABLE */
/* ================================================================ */
.final-total-section {
  border: 2px solid #3b82f6;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 4px;
  background: #f8fafc;
}

.final-total-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #eff6ff;
  border-bottom: 2px solid #3b82f6;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.final-total-badge {
  font-size: 12px;
  font-weight: 400;
  color: #2563eb;
  background: white;
  padding: 2px 14px;
  border-radius: 20px;
  border: 1px solid #3b82f6;
}

.final-total-note {
  padding: 8px 18px;
  background: #fef3c7;
  border-bottom: 1px solid #fcd34d;
  font-size: 12px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.final-total-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.final-total-table thead th {
  padding: 10px 14px;
  text-align: left;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 2px solid #e2e8f0;
}

.final-total-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  background: white;
}

.final-total-table tbody tr:last-child td {
  border-bottom: none;
}

.final-total-table tbody tr:hover td {
  background: #f8fafc;
}

/* Row status colors for final total */
.final-total-table tbody tr.fully-issued td {
  background: #f0fdf4;
}

.final-total-table tbody tr.fully-issued:hover td {
  background: #dcfce7;
}

.final-total-table tbody tr.partially-issued td {
  background: #fffbeb;
}

.final-total-table tbody tr.partially-issued:hover td {
  background: #fef3c7;
}

.final-total-table tbody tr.fully-returned td {
  background: #eff6ff;
}

.final-total-table tbody tr.fully-returned:hover td {
  background: #dbeafe;
}

.final-total-table tbody tr.pending td {
  background: transparent;
}

.final-total-table tbody tr.pending:hover td {
  background: #f8fafc;
}

.uom-tag-final {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 8px;
}

.total-required-final {
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
}

.issued-qty-final {
  font-weight: 600;
  color: #2563eb;
  font-size: 14px;
}

.returned-qty-final {
  font-weight: 600;
  color: #22c55e;
  font-size: 14px;
}

.btn-products-usage {
  background: #e0e7ff;
  color: #4338ca;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-products-usage:hover {
  background: #c7d2fe;
}

/* ================================================================ */
/* LOADING & EMPTY STATE */
/* ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

.empty-content small {
  color: #94a3b8;
  font-size: 12px;
}

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
}

/* ================================================================ */
/* COMPLETE MODAL */
/* ================================================================ */
.complete-modal .modal-container {
  max-width: 450px;
}

.complete-header {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0) !important;
  border-bottom: 2px solid #22c55e !important;
  padding: 18px 20px !important;
}

.complete-header .header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.complete-header .header-icon {
  font-size: 24px;
}

.complete-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.complete-header .header-subtitle {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.complete-header .modal-close {
  margin-left: auto;
}

.complete-order-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.complete-order-info .info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.complete-order-info .info-row:last-child {
  border-bottom: none;
}

.complete-order-info .info-label {
  color: #64748b;
}

.complete-order-info .info-value {
  font-weight: 500;
  color: #1e293b;
}

.complete-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.complete-summary .summary-item {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.complete-summary .summary-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.complete-summary .summary-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 2px;
}

.complete-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fcd34d;
  font-size: 13px;
  color: #92400e;
}

.complete-warning .warning-icon {
  font-size: 18px;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  padding: 8px 24px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================ */
/* PRODUCTS USAGE MODAL */
/* ================================================================ */
.usage-modal .modal-container {
  max-width: 450px;
}

.usage-header {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe) !important;
  border-bottom: 2px solid #4338ca !important;
  padding: 18px 20px !important;
}

.usage-header .header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #4338ca;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.usage-header .header-icon {
  font-size: 24px;
}

.usage-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.usage-header .header-subtitle {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #4338ca;
  font-weight: 500;
}

.usage-header .modal-close {
  margin-left: auto;
}

.usage-material-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.usage-info-item {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
}

.usage-info-item .usage-label {
  color: #64748b;
}

.usage-info-item .usage-value {
  font-weight: 600;
  color: #1e293b;
}

.usage-products-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.usage-products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.usage-count {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  background: white;
  padding: 1px 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.usage-product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.usage-product-item:last-child {
  border-bottom: none;
}

.usage-product-item:hover {
  background: #f8fafc;
}

.usage-product-number {
  font-weight: 600;
  color: #94a3b8;
  font-size: 12px;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  min-width: 28px;
  text-align: center;
}

.usage-product-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.usage-no-products {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* ================================================================ */
/* MODALS - REDUCED WIDTH */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.export-modal .modal-container {
  max-width: 380px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.modal-close {
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

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
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

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-success {
  background: #22c55e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ================================================================ */
/* ISSUE MODAL */
/* ================================================================ */
.issue-info,
.return-info,
.request-info {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.issue-select-row,
.return-select-row,
.request-select-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.issue-store-select,
.return-store-select,
.request-store-select,
.issue-order-select,
.return-order-select,
.request-order-select,
.request-product-select,
.request-material-select {
  margin-bottom: 0;
}

.issue-store-select label,
.return-store-select label,
.request-store-select label,
.issue-order-select label,
.return-order-select label,
.request-order-select label,
.request-product-select label,
.request-material-select label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 4px;
}

.issue-store-select .filter-select,
.return-store-select .filter-select,
.request-store-select .filter-select {
  border-color: #3b82f6;
  background: #f8fafc;
}

.issue-store-select .filter-select:focus,
.return-store-select .filter-select:focus,
.request-store-select .filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ================================================================ */
/* ISSUE ITEMS - ALL SELECTED */
/* ================================================================ */
.issue-all-selected-note {
  background: #dbeafe;
  color: #1e40af;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  text-align: center;
}

/* ================================================================ */
/* REQUEST MODAL */
/* ================================================================ */
.request-modal .modal-container {
  max-width: 550px;
}

.request-qty-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin: 12px 0;
}

.request-qty-select {
  flex: 1;
}

.request-qty-select label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 4px;
}

.request-qty-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.request-qty-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.request-uom {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-left: 8px;
}

.request-info-text {
  font-size: 13px;
  color: #64748b;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.request-material-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.request-info-item {
  display: flex;
  flex-direction: column;
}

.request-info-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.request-info-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.issue-item-list,
.return-item-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.issue-item,
.return-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  gap: 4px;
}

.issue-item:last-child,
.return-item:last-child {
  border-bottom: none;
}

.issue-item-info,
.return-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.issue-item-number,
.return-item-number {
  font-weight: 600;
  color: #94a3b8;
  font-size: 11px;
  min-width: 24px;
}

.issue-item-info input[type="checkbox"],
.return-item-info input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.issue-item-code,
.return-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 70px;
}

.issue-item-name,
.return-item-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  min-width: 80px;
  font-size: 13px;
}

.issue-item-uom,
.return-item-uom {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}

.issue-item-required {
  color: #dc2626;
  font-weight: 500;
  font-size: 12px;
}

.return-item-issued {
  color: #2563eb;
  font-weight: 500;
  font-size: 12px;
}

.return-item-returned {
  color: #22c55e;
  font-weight: 500;
  font-size: 12px;
}

.return-item-available {
  color: #166534;
  font-weight: 500;
  font-size: 12px;
}

.issue-item-input,
.return-item-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 28px;
  flex-wrap: wrap;
}

.issue-item-input label,
.return-item-input label {
  font-size: 12px;
  color: #64748b;
}

.issue-qty-input,
.return-qty-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
}

.issue-qty-input:focus,
.return-qty-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.issue-max,
.return-max {
  font-size: 11px;
  color: #94a3b8;
}

.no-issue-items,
.no-return-items {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
}

/* ================================================================ */
/* EXPORT MODAL */
/* ================================================================ */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  max-width: 90vw;
  font-size: 13px;
  white-space: pre-line;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

.toast.warning {
  border-left-color: #f59e0b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ================================================================ */
/* RESPONSIVE - TABLET */
/* ================================================================ */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .materials-breakdown-table,
  .final-total-table {
    font-size: 12px;
  }

  .materials-breakdown-table thead th,
  .materials-breakdown-table tbody td,
  .final-total-table thead th,
  .final-total-table tbody td {
    padding: 6px 10px;
  }

  .product-card-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .product-title {
    flex-wrap: wrap;
  }

  .usage-material-info {
    grid-template-columns: 1fr;
  }

  .issue-select-row,
  .return-select-row,
  .request-select-row {
    grid-template-columns: 1fr;
  }

  .request-material-info {
    grid-template-columns: 1fr;
  }
}

/* ================================================================ */
/* RESPONSIVE - MOBILE */
/* ================================================================ */
@media (max-width: 768px) {
  .section-card {
    padding: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box input {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
    width: 100%;
  }

  .action-buttons button {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-bar select {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .expand-details {
    padding: 12px 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    font-size: 12px;
  }

  .materials-breakdown-table,
  .final-total-table {
    font-size: 11px;
  }

  .materials-breakdown-table thead,
  .final-total-table thead {
    display: none;
  }

  .materials-breakdown-table tbody tr,
  .final-total-table tbody tr {
    display: block;
    padding: 10px 12px;
    border-bottom: 2px solid #e2e8f0;
  }

  .materials-breakdown-table tbody td,
  .final-total-table tbody td {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border: none;
    font-size: 12px;
  }

  .materials-breakdown-table tbody td:before,
  .final-total-table tbody td:before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
  }

  .materials-breakdown-table tbody td:first-child,
  .final-total-table tbody td:first-child {
    justify-content: flex-start;
    gap: 8px;
  }

  .material-cell .material-code {
    font-size: 11px;
  }

  .material-cell .material-name {
    font-size: 12px;
  }

  .per-unit {
    font-size: 13px;
  }

  .total-required,
  .total-required-final {
    font-size: 14px;
  }

  .status-tag {
    font-size: 10px;
    padding: 2px 10px;
  }

  .text-center {
    text-align: right;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .modal-container {
    margin: 10px;
    max-width: 100% !important;
  }

  .complete-modal .modal-container,
  .usage-modal .modal-container,
  .request-modal .modal-container {
    max-width: 100%;
  }

  .complete-summary {
    grid-template-columns: 1fr;
  }

  .production-table {
    font-size: 12px;
  }

  .production-table th,
  .production-table td {
    padding: 6px 8px;
  }

  .item-number {
    font-size: 10px;
    padding: 0 6px;
  }

  .issue-item-number,
  .return-item-number {
    font-size: 10px;
    min-width: 20px;
  }

  .product-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .product-title {
    flex-wrap: wrap;
  }

  .products-list {
    flex-wrap: wrap;
  }

  .product-tag {
    font-size: 10px;
    padding: 1px 6px;
  }

  .materials-table-wrapper {
    margin: 0 8px 8px 8px;
  }

  .table-title {
    font-size: 12px;
    padding: 8px 12px;
  }

  .final-total-section {
    border-width: 1px;
  }

  .final-total-header {
    font-size: 13px;
    padding: 10px 14px;
    flex-wrap: wrap;
    gap: 4px;
  }

  .final-total-note {
    font-size: 11px;
    padding: 6px 12px;
  }

  .btn-products-usage {
    font-size: 10px;
    padding: 3px 8px;
  }

  .issue-select-row,
  .return-select-row,
  .request-select-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .request-material-info {
    grid-template-columns: 1fr;
  }

  .request-qty-row {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .materials-breakdown-table tbody td,
  .final-total-table tbody td {
    font-size: 11px;
    flex-wrap: wrap;
  }

  .action-buttons button {
    font-size: 12px;
    padding: 6px 10px;
  }

  .product-card {
    border-radius: 8px;
  }

  .product-card-header {
    padding: 10px 12px;
  }

  .product-name {
    font-size: 13px;
  }

  .product-qty {
    font-size: 12px;
  }

  .usage-material-info {
    grid-template-columns: 1fr;
    padding: 10px 12px;
  }

  .usage-info-item {
    font-size: 12px;
  }

  .usage-products-header {
    font-size: 12px;
    padding: 8px 12px;
  }

  .usage-product-item {
    padding: 8px 12px;
  }

  .usage-product-name {
    font-size: 12px;
  }

  .request-material-info {
    grid-template-columns: 1fr;
  }
}

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-issue,
  .btn-return,
  .btn-request,
  .btn-export,
  .search-box,
  .filter-wrapper,
  .pagination,
  .action-buttons,
  .expand-btn,
  .btn-filter-toggle,
  .btn-products-usage {
    display: none !important;
  }

  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }

  .production-table th,
  .production-table td {
    border: 1px solid #ddd !important;
  }

  .stats-grid {
    display: none !important;
  }

  .detail-expand-row {
    display: table-row !important;
  }

  .expand-details {
    border: 1px solid #ddd !important;
  }

  .loading-state {
    display: none !important;
  }

  .status-badge {
    border: 1px solid #ddd;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge.pending {
    background: #fef3c7 !important;
  }
  .status-badge.completed {
    background: #d1fae5 !important;
  }

  .status-tag {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .product-card {
    border: 1px solid #ddd !important;
    break-inside: avoid;
  }

  .materials-table-wrapper {
    border: 1px solid #ddd !important;
  }

  .final-total-section {
    border: 2px solid #3b82f6 !important;
    break-inside: avoid;
  }

  .final-total-table tbody td {
    border: 1px solid #ddd !important;
  }

  .product-tag {
    border: 1px solid #4338ca !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>