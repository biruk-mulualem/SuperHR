<!-- views/storemanagement/itemRequests/CreateRequestPage.vue -->
<template>
  <div class="top-actions no-print">
    <button class="btn-back-top" @click="goBack" :disabled="saving">
      ← Back to Requests
    </button>

    <div class="top-actions-right">
      <button
        class="btn-toggle-side no-print"
        @click="showSidePanel = !showSidePanel"
        :class="{ active: showSidePanel }"
        :title="showSidePanel ? 'Hide options' : 'Show options'"
      >
        {{ showSidePanel ? '✖ Hide Options' : '⚙️ Options' }}
      </button>
      <button class="btn-edit-header" @click="goBack" :disabled="saving">Cancel</button>
      <button
        class="btn-print-top"
        @click="saveRequest"
        :disabled="saving || !isFormValid"
      >
        {{ saving ? "Saving…" : editingRequest ? "💾 Update Request" : "💾 Create Request" }}
      </button>
    </div>
  </div>

  <div class="page-layout" :class="{ 'with-side': showSidePanel }">
    <div class="print-page">
      <header class="form-header">
        <h1 class="motto">WE TRUST IN GOD!!!</h1>
        <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>

        <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>

        <h3 v-if="!isEditingHeader" class="form-subtitle-title">{{ displayHeader }}</h3>
        <h3
          v-else
          ref="headerLineRef"
          class="form-subtitle-title is-editing"
          contenteditable="true"
          @keydown.enter.prevent="saveHeader"
          @keydown.esc.prevent="cancelEditingHeader"
          @paste="onPastePlain"
        ></h3>

        <div class="header-edit-controls no-print">
          <button
            v-if="!isEditingHeader"
            class="btn-edit-header"
            @click="startEditingHeader"
            title="Edit header line"
          >✏️ Edit Header</button>
          <template v-else>
            <button class="btn-save-header" @click="saveHeader">💾 Save</button>
            <button class="btn-cancel-header" @click="cancelEditingHeader">✖ Cancel</button>
            <span class="edit-hint">Press Enter to save · Esc to cancel</span>
          </template>

          <button
            v-if="!isEditingHeader"
            class="btn-merge-toggle"
            :class="{ active: isMergingRemarks }"
            @click="toggleMergeMode"
            :title="isMergingRemarks ? 'Exit merge mode' : 'Merge remarks across rows'"
          >{{ isMergingRemarks ? '✖ Exit Merge' : '🔀 Merge Remarks' }}</button>

          <button
            v-if="!isEditingHeader && !isManagingColumns"
            class="btn-merge-toggle"
            @click="openColumnManager"
            title="Show/hide or add columns"
          >🧩 Columns ({{ visibleColumnCount }}/{{ columns.length }})</button>
          <button
            v-if="!isEditingHeader && isManagingColumns"
            class="btn-cancel-header"
            @click="closeColumnManager"
          >✖ Close Columns</button>

          <button
            v-if="!isEditingHeader && !isManagingSections"
            class="btn-merge-toggle"
            @click="openSectionManager"
            title="Show / hide sections"
          >📄 Sections ({{ visibleSectionCount }}/4)</button>
          <button
            v-if="!isEditingHeader && isManagingSections"
            class="btn-cancel-header"
            @click="closeSectionManager"
          >✖ Close Sections</button>
        </div>

        <div v-if="isManagingColumns && !isEditingHeader" class="column-manager no-print">
          <div class="column-manager-title">Show / hide columns</div>
          <div class="column-manager-list">
            <label
              v-for="col in columns"
              :key="col.key"
              class="column-manager-item"
              :class="{
                'is-hidden': !col.visible,
                'is-empty': isColumnEmpty(col) && !col.locked,
                'is-locked': isColumnLocked(col),
                'is-locked-data': !col.locked && !isColumnEmpty(col),
              }"
            >
              <input
                type="checkbox"
                :checked="col.visible"
                @change="toggleColumn(col.key)"
                :disabled="isColumnLocked(col)"
              />
              <span class="column-manager-label">{{ col.label }}</span>
              <span v-if="col.locked" class="column-manager-lock" title="Required column">🔒</span>
              <span
                v-else-if="!isColumnEmpty(col)"
                class="column-manager-lock-data"
                title="Has data — cannot hide"
              >🔒 has data</span>
              <span v-else class="column-manager-empty" title="No data — safe to hide">empty</span>
              <button
                v-if="col.custom"
                class="column-manager-remove"
                @click.prevent="removeCustomColumn(col.key)"
                :disabled="isColumnLocked(col) && !col.locked"
              >✕</button>
            </label>
          </div>

          <div class="column-manager-actions">
            <button
              class="btn-merge-apply"
              :disabled="!hasAnyEmptyVisibleColumn"
              @click="hideEmptyColumns"
            >🧹 Hide empty columns</button>
            <button
              class="btn-merge-clear"
              :disabled="!hasAnyHiddenColumn"
              @click="showAllColumns"
            >↺ Show all</button>
            <button class="btn-merge-clear" @click="resetColumnState">⟲ Reset columns</button>
          </div>

          <div class="column-manager-add">
            <label class="column-manager-add-label">Add column:</label>
            <select v-model="newColumnChoice" class="column-manager-select">
              <option value="">— Select a column —</option>
              <option
                v-for="opt in COLUMN_OPTIONS"
                :key="opt.value"
                :value="opt.value"
                :disabled="isColumnOptionDisabled(opt.value)"
              >{{ opt.label }}</option>
            </select>
            <input
              v-if="newColumnChoice === '__other__'"
              v-model="newColumnCustomLabel"
              type="text"
              class="column-manager-input"
              placeholder="Type the store / column name"
              @keydown.enter.prevent="addColumnFromDropdown"
            />
            <button
              class="btn-merge-apply"
              :disabled="!canAddColumn"
              @click="addColumnFromDropdown"
            >＋ Add</button>
          </div>
        </div>

        <div v-if="isManagingSections && !isEditingHeader" class="column-manager no-print">
          <div class="column-manager-title">Show / hide sections</div>
          <div class="column-manager-list">
            <label class="column-manager-item" :class="{ 'is-hidden': !sectionVisibility.department }">
              <input type="checkbox" :checked="sectionVisibility.department" @change="toggleSection('department')" />
              <span class="column-manager-label">Department</span>
            </label>
            <label class="column-manager-item" :class="{ 'is-hidden': !sectionVisibility.reason }">
              <input type="checkbox" :checked="sectionVisibility.reason" @change="toggleSection('reason')" />
              <span class="column-manager-label">Reason</span>
            </label>
            <label class="column-manager-item" :class="{ 'is-hidden': !sectionVisibility.comment }">
              <input type="checkbox" :checked="sectionVisibility.comment" @change="toggleSection('comment')" />
              <span class="column-manager-label">Comment</span>
            </label>
            <label class="column-manager-item" :class="{ 'is-hidden': !sectionVisibility.checkedBy }">
              <input type="checkbox" :checked="sectionVisibility.checkedBy" @change="toggleSection('checkedBy')" />
              <span class="column-manager-label">Checked By</span>
            </label>
          </div>
          <div class="column-manager-actions">
            <button class="btn-merge-apply" @click="showAllSections">↺ Show all</button>
            <button class="btn-merge-clear" @click="hideAllSections">✕ Hide all</button>
          </div>
        </div>

        <div class="date-row">
          <span>
            <strong>REQ. NO:-</strong>
            {{ editingRequest?.requestCode || editingRequest?.id || "NEW" }}
          </span>

          <span class="date-field">
            <strong>DATE:-</strong>
            <span
              v-if="!isEditingDate"
              class="date-display"
              @click="startEditingDate"
              title="Click to edit date"
            >
              {{ displayDate }}
              <span class="date-edit-pencil no-print" aria-hidden="true">✏️</span>
            </span>
            <span v-else class="date-edit-wrap">
              <input
                ref="dateInputRef"
                v-model="dateDraft"
                type="date"
                class="date-input no-print"
                @keydown.enter.prevent="saveDate"
                @keydown.esc.prevent="cancelEditingDate"
                @blur="saveDate"
              />
              <span class="date-edit-actions no-print">
                <button class="btn-save-header" @click="saveDate">💾</button>
                <button class="btn-cancel-header" @click="cancelEditingDate">✖</button>
              </span>
            </span>
          </span>
        </div>
      </header>

      <div v-if="isMergingRemarks" class="merge-bar no-print">
        <span class="merge-bar-info">
          <strong>{{ selectedRowIndexes.length }}</strong> row(s) selected
          <span v-if="selectedRowIndexes.length < 2" class="merge-hint">(select at least 2 consecutive rows)</span>
        </span>
        <button class="btn-merge-apply" :disabled="selectedRowIndexes.length < 2" @click="applyMerge">🔀 Merge Selected Remarks</button>
        <button class="btn-merge-clear" :disabled="selectedRowIndexes.length === 0" @click="clearSelection">Clear Selection</button>
        <span v-if="mergeGroups.length > 0" class="merge-groups-info">Active merges: <strong>{{ mergeGroups.length }}</strong></span>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th v-if="isMergingRemarks" class="no-print" style="width: 3%;">☑</th>
            <th style="width: 6%;">No</th>
            <th v-for="col in dataColumns" :key="col.key" :style="{ width: col.width }">{{ col.label }}</th>
            <th style="width: 10%;">Remark</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in requestItems"
            :key="`row-${index}-${item.itemId}`"
            :class="{
              'row-selected': isRowSelected(index),
              'row-merged-absorbed': isRowAbsorbedByMerge(index)
            }"
          >
            <td v-if="isMergingRemarks" class="no-print cell-checkbox">
              <input
                v-if="!isRowMerged(index)"
                type="checkbox"
                :checked="isRowSelected(index)"
                @change="toggleRowSelection(index)"
              />
              <span v-else class="merged-lock" title="Part of a merge">🔗</span>
            </td>

            <td class="row-number-cell">
              <div class="row-number-inner">
                <span class="row-number-text">{{ index + 1 }}</span>
                <button
                  type="button"
                  class="row-trash no-print"
                  @click="removeSelectedItem(index)"
                  title="Remove"
                >✕</button>
              </div>
            </td>

            <td
              v-for="col in dataColumns"
              :key="col.key"
              :class="{
                'text-left': col.align === 'left',
                'font-bold': col.bold,
                'spec-cell': col.key === 'specification',
                'custom-cell': isEditableColumn(col),
                'computed-cell': isComputedColumn(col),
              }"
            >
              <template v-if="isComputedColumn(col)">
                <span class="computed-value">{{ getComputedCellValue(item, index, col) }}</span>
              </template>

              <template v-else-if="isEditableColumn(col)">
                <div
                  class="custom-cell-editor no-print"
                  contenteditable="true"
                  :data-placeholder="'—'"
                  @blur="onCustomCellBlur(index, col.key, $event)"
                  @keydown.enter.prevent="onCustomCellEnter"
                  @paste="onPastePlain"
                  v-html="getCustomCellValue(index, col.key)"
                ></div>
                <span class="custom-cell-print">{{ getCustomCellValue(index, col.key) }}</span>
              </template>

              <!-- ✅ UOM column: no more dropdown — the UOM is baked into the itemId -->
              <template v-else-if="col.key === 'uom'">
                <span class="cell-print-inline">{{ getSelectedUomLabel(item) }}</span>
              </template>

              <template v-else-if="col.key === 'quantity'">
                <input
                  type="number"
                  :value="item.quantity"
                  min="0.01"
                  step="0.01"
                  class="qty-input no-print"
                  @input="updateQuantity(index, ($event.target as HTMLInputElement)?.value ?? '')"
                />
                <span class="cell-print">{{ formatQuantity(item.quantity) }}</span>
              </template>

              <template v-else-if="col.key === 'brand'">
                <input type="text" v-model="item.brand" class="cell-input no-print" placeholder=" "  />
                <span class="cell-print">{{ item.brand || '' }}</span>
              </template>

              <template v-else-if="col.key === 'model'">
                <input type="text" v-model="item.model" class="cell-input no-print" placeholder=" "  />
                <span class="cell-print">{{ item.model || '' }}</span>
              </template>

              <template v-else-if="col.key === 'specification'">
                <input type="text" v-model="item.specification" class="cell-input no-print" placeholder=" "  />
                <span class="cell-print">{{ item.specification || '' }}</span>
              </template>

              <template v-else>
                {{ getColumnValue(item, col, index) }}
              </template>
            </td>

            <td
              v-if="isMergeStartRow(index)"
              class="remark-cell merged-remark-cell"
              :rowspan="getMergeSize(index)"
            >
              <div class="merged-remark-content">
                <span class="merged-remark-text">{{ getMergedRemarkText(index) || '—' }}</span>
                <button
                  v-if="isMergingRemarks"
                  class="btn-unmerge no-print"
                  @click="unmergeGroup(index)"
                  title="Unmerge"
                >✖ Unmerge</button>
              </div>
            </td>
            <td v-else-if="!isRowAbsorbedByMerge(index)" class="remark-cell">
              <input v-model="item.remark" type="text" class="cell-input no-print" placeholder=" "  />
              <span class="cell-print">{{ item.remark || '' }}</span>
            </td>
          </tr>

          <!-- ============================================================ -->
          <!-- DRAFT ROW — FAMILY SEARCH + UOM PICKER                        -->
          <!-- ============================================================ -->
      <!-- ---- DRAFT ROW ---- -->
<tr class="draft-row">
  <td v-if="isMergingRemarks" class="no-print cell-checkbox"></td>

  <!-- ➕ -->
  <td class="row-number-cell draft-number-cell">
    <button
      type="button"
      class="row-add-plus"
      @click="commitDraft"
      :disabled="!draftSelectedUom"
      :title="draftSelectedUom ? 'Add this item' : 'Pick an item + UOM first'"
    >➕</button>
  </td>

  <!-- Item cell — search + family pick (no UOM picker here) -->
  <td class="text-left draft-item-cell">
    <div class="draft-item-picker" ref="draftPickerRef">
      <div v-if="!draftSelectedFamily" class="draft-search-wrap">
        <span class="draft-search-icon">🔍</span>
        <input
          ref="draftSearchRef"
          v-model="draftSearch"
          type="text"
          class="draft-search-input"
          placeholder="Search item…"
          autocomplete="off"
          @focus="onDraftFocus"
          @input="onDraftSearchInput"
          @blur="onDraftBlur"
          @keydown.esc="resetDraft"
          @keydown.enter.prevent="onDraftSearchEnter"
        />
        <span v-if="isDraftSearching" class="draft-spinner">⏳</span>
      </div>

      <div
        v-if="showDraftDropdown && (draftOptions.length > 0 || isDraftSearching)"
        class="draft-dropdown"
      >
        <div v-if="isDraftSearching && draftOptions.length === 0" class="draft-no-results">
          Loading items…
        </div>
        <template v-else>
         <div
  v-for="family in draftOptions"
  :key="family.familyId"
  class="draft-option"
  @mousedown.prevent="pickFamily(family)"
>
  <span class="draft-option-code">{{ family.code }}</span>

  <div class="draft-option-main">
    <span class="draft-option-name">{{ family.displayName }}</span>
    <span v-if="family.category" class="draft-option-category">
      📂 {{ family.category }}
    </span>
  </div>

  <span class="draft-option-uom">
    <template v-if="family.uoms.length === 1">
      {{ family.uoms[0]?.uomCode }}
    </template>
    <template v-else>
      {{ family.uoms.length }} UOMs: {{ family.uoms.map(u => u.uomCode).join(' · ') }}
    </template>
  </span>
</div>
          <div
            v-if="hasMoreDraftItems"
            class="draft-option draft-option-more"
            @mousedown.prevent="loadMoreDraftItems"
          >
            {{ isDraftLoadingMore
              ? 'Loading…'
              : `Load more (${draftOptions.length}/${draftTotal})` }}
          </div>
        </template>
      </div>

      <div
        v-else-if="showDraftDropdown && draftSearch.trim() && !isDraftSearching && draftOptions.length === 0"
        class="draft-no-results"
      >
        No items match "{{ draftSearch }}"
      </div>

      <!-- Picked family — just shows the name, no UOM buttons -->
      <div v-if="draftSelectedFamily" class="draft-picked">
        <span class="item-code-pill">{{ draftSelectedFamily.code }}</span>
        <span class="item-name-text">{{ draftSelectedFamily.displayName }}</span>
        <button
          type="button"
          class="draft-picked-clear"
          @click="resetDraft"
          title="Clear"
        >✕</button>
      </div>
    </div>
  </td>

  <!-- Tail columns (Qty, Brand, Model, Spec, etc.) -->
  <td
    v-for="col in draftTailColumns"
    :key="`draft-${col.key}`"
    :class="{
      'cell-qty': col.key === 'quantity',
      'text-left': col.align === 'left',
    }"
  >
    <!-- ✅ UOM cell — now a <select> populated from the picked family -->
    <template v-if="col.key === 'uom'">
   <select
  :value="draftSelectedUom?.itemId ?? ''"
  class="cell-select no-print"
  :disabled="!draftSelectedFamily"
  @change="onDraftUomSelect"
>
  <option
    v-for="u in (draftSelectedFamily?.uoms ?? [])"
    :key="u.itemId"
    :value="u.itemId"
  >
    {{ u.uomCode }}
    <template v-if="u.stock !== null"> ({{ u.stock }} on hand)</template>
  </option>
</select>
    </template>

    <template v-else-if="col.key === 'quantity'">
      <input
        type="number"
        v-model.number="draftQty"
        min="0.01"
        step="0.01"
        class="qty-input no-print"
      />
    </template>

    <template v-else-if="col.key === 'brand'">
      <input type="text" v-model="draftBrand" class="cell-input no-print" placeholder=" "  />
    </template>

    <template v-else-if="col.key === 'model'">
      <input type="text" v-model="draftModel" class="cell-input no-print" placeholder=" "  />
    </template>

    <template v-else-if="col.key === 'specification'">
      <input type="text" v-model="draftSpecification" class="cell-input no-print" placeholder=" "  />
    </template>

    <template v-else>
      <input
        type="text"
        class="cell-input no-print"
        placeholder=" " 
        v-model="draftFieldValues[col.key]"
      />
    </template>
  </td>

  <!-- Remark -->
  <td class="remark-cell">
    <input v-model="draftRemark" type="text" class="cell-input no-print" placeholder=" "  />
  </td>
</tr>

          <tr v-if="requestItems.length === 0 && !draftSelectedFamily" class="empty-hint-row no-print">
            <td
              :colspan="(isMergingRemarks ? 3 : 2) + dataColumns.length + 1"
              class="no-items"
            >Search in the row above to add your first item</td>
          </tr>

          <tr v-if="hasTotalPriceColumn" class="grand-total-row">
            <td :colspan="isMergingRemarks ? 2 : 1" class="grand-total-spacer-cell"></td>
            <template v-for="col in dataColumns" :key="`tot-${col.key}`">
              <td v-if="col.key === 'unitPrice'" class="grand-total-label-cell">TOTAL</td>
              <td v-else-if="col.key === 'totalPrice'" class="grand-total-value-cell">
                <span class="grand-total-value">{{ grandTotalFormatted }}</span>
              </td>
              <td v-else class="grand-total-spacer-cell"></td>
            </template>
            <td class="grand-total-spacer-cell"></td>
          </tr>
        </tbody>
      </table>

      <div class="meta-grid">
        <div v-if="sectionVisibility.department" class="meta-col">
          <div class="block-header text-center">Department</div>
          <div class="block-body dept-body">
            <div v-if="!isEditingDepartment" class="dept-display" @click="startEditingDepartment" title="Click to edit">
              <strong class="dept-value">{{ displayDepartment }}</strong>
              <span class="dept-edit-pencil no-print" aria-hidden="true">✏️</span>
            </div>
            <div v-else class="dept-edit-wrap">
              <input
                ref="departmentInputRef"
                v-model="departmentDraft"
                type="text"
                class="dept-input no-print"
                @keydown.enter.prevent="saveDepartment"
                @keydown.esc.prevent="cancelEditingDepartment"
                @blur="saveDepartment"
              />
              <div class="dept-edit-actions no-print">
                <button class="btn-save-header" @click="saveDepartment">💾 Save</button>
                <button class="btn-cancel-header" @click="cancelEditingDepartment">✖ Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div class="meta-col">
          <div class="block-header text-center">Requested By</div>
          <div class="block-body workflow-body">
            <p class="name-line">
              <strong>Name:-</strong>
              <input
                v-model="form.requestedBy"
                type="text"
                class="inline-name-input no-print"
                placeholder="Requester name"
              />
              <span class="approved-name-print">{{ form.requestedBy }}</span>
            </p>
            <p><strong>Signature</strong> _______________________</p>
          </div>
        </div>

        <div class="meta-col">
          <div class="block-header text-center">Approved By</div>
          <div class="block-body workflow-body">
            <p class="approved-name-row">
              <strong>Name :-</strong>
              <span
                class="approved-name-editor no-print"
                contenteditable="true"
                data-placeholder="Type approver name…"
                @blur="onApprovedNameBlur"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement).blur()"
                @paste="onPastePlain"
                v-html="approvedByName"
              ></span>
              <span class="approved-name-print">{{ approvedByName }}</span>
            </p>
            <p><strong>Signature</strong> _______________________</p>
          </div>
        </div>
      </div>

      <div class="footer-sections">
        <div v-if="sectionVisibility.reason" class="input-row">
          <div class="gray-label">Reason</div>
          <div class="lines-container">
            <textarea
              v-model="form.remark"
              class="reason-textarea"
              rows="3"
              placeholder="Explain the reason for this request…"
            ></textarea>
          </div>
        </div>

        <div v-if="sectionVisibility.comment" class="input-row short-width">
          <div class="gray-label">Comment</div>
          <div class="lines-container">
            <div class="write-line"></div>
            <div class="write-line"></div>
          </div>
        </div>

        <div v-if="sectionVisibility.checkedBy" class="checked-by-section">
          <div class="gray-label inline-label">Checked By</div>
          <div class="checked-by-body">
            <p><strong>Name</strong> _____________________________.</p>
            <p><strong>Signature</strong> _____________________.</p>
          </div>
        </div>

        <div v-if="formErrors.length > 0" class="form-errors no-print">
          <div v-for="error in formErrors" :key="error" class="form-error">⚠️ {{ error }}</div>
        </div>
      </div>
    </div>

    <transition name="slide-panel">
      <aside v-if="showSidePanel" class="side-panel no-print">
        <section class="side-card">
          <header class="side-card-header">🏪 Supplying Store</header>
          <div class="side-card-body">
            <select v-model="form.supplyingStoreId" class="side-select">
              <option value="">— Select the supplying store —</option>
              <option
                v-for="store in filteredSupplyingStores"
                :key="store.storeId || store.id"
                :value="store.storeId || store.id"
              >
                {{ store.name }} ({{ store.code }})
              </option>
            </select>

            <div class="side-selected-store" :class="{ empty: !selectedSupplyingStore }">
              <span class="side-selected-store-label">Selected store</span>
              <strong class="side-selected-store-name">
                {{
                  selectedSupplyingStore
                    ? `${selectedSupplyingStore.name} (${selectedSupplyingStore.code})`
                    : 'None selected yet'
                }}
              </strong>
            </div>
          </div>
        </section>

        <section class="side-card">
          <header class="side-card-header">🚩 Flags</header>
          <div class="side-card-body">
            <label class="side-checkbox">
              <input type="checkbox" v-model="form.isAsset" />
              <span>🏛️ Requires department approval</span>
            </label>
            <label class="side-checkbox">
              <input type="checkbox" v-model="form.isTemelash" />
              <span>🔄 Temelash (temporary loan)</span>
            </label>
          </div>
        </section>

        <section v-if="form.isTemelash" class="side-card temelash-card">
          <header class="side-card-header">🔄 Temelash Window</header>
          <div class="side-card-body">
            <p class="side-hint">Items are given temporarily and must be returned between these dates.</p>
            <div class="side-field">
              <label>From</label>
              <input
                v-model="form.temelashFromDate"
                type="date"
                class="side-input"
                :min="form.requestedDate"
              />
            </div>
            <div class="side-field">
              <label>To</label>
              <input
                v-model="form.temelashToDate"
                type="date"
                class="side-input"
                :min="form.temelashFromDate || form.requestedDate"
              />
            </div>
          </div>
        </section>

        <section v-if="form.isAsset" class="side-card">
          <header class="side-card-header">
            🏛️ Departments
            <span class="side-count">
              {{ selectedDepartments.length }}/{{ applicableDepartments.length }}
            </span>
          </header>
          <div class="side-card-body">
            <div v-if="loadingDepartments" class="dept-empty">
              <span class="dept-empty-spinner">⏳</span> Loading departments…
            </div>

            <template v-else-if="applicableDepartments.length > 0">
              <ul class="dept-list">
                <li
                  v-for="dept in applicableDepartments"
                  :key="dept.departmentId"
                  class="dept-item"
                  :class="{ removed: removedDepartmentIds.has(dept.departmentId) }"
                >
                  <span class="dept-item-icon">🏛️</span>

                  <div class="dept-item-main">
                    <span class="dept-item-name">{{ dept.name }}</span>
                    <span class="dept-item-code">{{ dept.code }}</span>
                  </div>

                  <button
                    v-if="!removedDepartmentIds.has(dept.departmentId)"
                    type="button"
                    class="dept-item-btn"
                    title="Don't notify this department"
                    @click.stop="removeDepartment(dept.departmentId)"
                  >✕</button>
                  <button
                    v-else
                    type="button"
                    class="dept-item-btn restore"
                    title="Restore this department"
                    @click.stop="restoreDepartment(dept.departmentId)"
                  >↺</button>
                </li>
              </ul>

              <p class="dept-hint">
                {{ selectedDepartments.length }} of {{ applicableDepartments.length }}
                will be notified.
              </p>
            </template>

            <div v-else class="dept-empty warning">
              ⚠️ No departments configured for this store.
            </div>
          </div>
        </section>
      </aside>
    </transition>
  </div>

  <transition name="modal-fade">
    <div
      v-if="showValidationModal"
      class="val-modal-backdrop no-print"
      @click.self="closeValidationModal"
    >
      <div class="val-modal">
        <div class="val-modal-header">
          <div class="val-modal-title-group">
            <div class="val-modal-icon">❌</div>
            <div>
              <h3>Request Validation Failed</h3>
              <p>{{ validationMessage || 'Please fix the issues below and try again.' }}</p>
            </div>
          </div>
          <button class="val-modal-close" @click="closeValidationModal" title="Close">✕</button>
        </div>

        <div class="val-modal-body">
          <div class="val-error-list">
            <div
              v-for="(error, index) in validationErrors"
              :key="index"
              class="val-error-item"
            >
              <!-- Header: item name + code + requested qty -->
              <div class="val-error-head">
                <span class="val-error-icon">📦</span>
                <span class="val-error-name">
                  <strong>{{ error.itemName || 'Unknown Item' }}</strong>
                  <span v-if="error.itemCode" class="val-error-code">({{ error.itemCode }})</span>
                </span>
                <span
                  v-if="error.requestedQuantity"
                  class="val-error-qty"
                >Requested: {{ error.requestedQuantity }} {{ error.uomCode || '' }}</span>
              </div>

              <!-- Context line: asking → supplying · requested by -->
              <div
                v-if="error.askingStoreName || error.supplyingStoreName || error.requestedByName"
                class="val-error-context"
              >
                <span v-if="error.askingStoreName">
                  <span class="val-error-context-label">Asking:</span>
                  <strong>{{ error.askingStoreName }}</strong>
                </span>
                <span class="val-error-arrow">→</span>
                <span v-if="error.supplyingStoreName">
                  <span class="val-error-context-label">Supplying:</span>
                  <strong>{{ error.supplyingStoreName }}</strong>
                </span>
                <span v-if="error.requestedByName" class="val-error-requester">
                  <span class="val-error-context-label">By:</span>
                  <strong>{{ error.requestedByName }}</strong>
                </span>
              </div>

              <!-- Stock math line -->
             

              <!-- Open requests — TABLE -->
              <div
                v-if="error.blockingRequests && error.blockingRequests.length > 0"
                class="val-error-table-block"
              >
                <div class="val-error-table-title">
                  🔒 Open requests blocking this item ({{ error.blockingRequests.length }})
                </div>
                <div class="val-error-table-wrapper">
                  <table class="val-error-table">
                    <thead>
                      <tr>
                        <th>Request Code</th>
                        <th>Status</th>
                        <th class="text-right">Qty</th>
                        <th>Asking Store</th>
                        <th>Supplying Store</th>
                        <th>Requested By</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(br, i) in error.blockingRequests"
                        :key="i"
                      >
                        <td class="val-error-code-cell">
                          {{ br.requestCode || `#${br.requestId}` }}
                        </td>
                        <td>
                          <span :class="['val-error-status-badge', br.status]">
                            {{ br.status }}
                          </span>
                        </td>
                        <td class="text-right val-error-qty-cell">
                          {{ br.quantity }} {{ br.uom }}
                        </td>
                        <td>{{ br.askingStoreName || '—' }}</td>
                        <td>{{ br.supplyingStoreName || '—' }}</td>
                        <td>{{ br.requestedByName || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Temelash — TABLE -->
              <div
                v-if="error.blockingTemelash && error.blockingTemelash.length > 0"
                class="val-error-table-block temelash-block"
              >
                <div class="val-error-table-title">
                  🔄 Temelash loans blocking this item ({{ error.blockingTemelash.length }})
                </div>
                <div class="val-error-table-wrapper">
                  <table class="val-error-table">
                    <thead>
                      <tr>
                        <th>Record</th>
                        <th>Request Code</th>
                        <th class="text-right">Qty</th>
                        <th>From</th>
                        <th>To</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(bt, i) in error.blockingTemelash"
                        :key="i"
                      >
                        <td>#{{ bt.temelashRecordId }}</td>
                        <td class="val-error-code-cell">
                          {{ bt.requestCode || `#${bt.requestId}` }}
                        </td>
                        <td class="text-right val-error-qty-cell">
                          {{ bt.quantity }} {{ bt.uom }}
                        </td>
                        <td>{{ formatDate(bt.fromDate) }}</td>
                        <td>{{ formatDate(bt.toDate) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Fallback: legacy error.message when no structured data -->
              <div
                v-if="!error.blockingRequests?.length && !error.blockingTemelash?.length"
                class="val-error-message"
              >{{ error.message }}</div>

              <!-- Legacy chips (from earlier stock validation shapes) -->
              <div
                v-if="error.groupsWithoutBalance && error.groupsWithoutBalance.length > 0"
                class="val-error-groups"
              >
                <span class="val-error-groups-label">Missing groups:</span>
                <span
                  v-for="(group, gi) in error.groupsWithoutBalance"
                  :key="gi"
                  class="val-error-group-chip"
                >{{ group.groupName }}</span>
              </div>

              <div
                v-if="error.balanceDetails && error.balanceDetails.length > 0"
                class="val-error-balances"
              >
                <span class="val-error-balances-label">Balance variation:</span>
                <span
                  v-for="(detail, di) in error.balanceDetails"
                  :key="di"
                  class="val-error-balance-chip"
                >{{ detail.groupName }}: {{ detail.balance }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="val-modal-footer">
          <button class="val-modal-btn-secondary" @click="closeValidationModal">Close</button>
        </div>
      </div>
    </div>
  </transition>

  <div v-if="bootstrapping" class="loading-state">
    <div class="spinner"></div>
    <p>Loading request data…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import type {
  ItemRequest,
  Store,
  PageSnapshot,
  SnapshotColumn,
  SnapshotItem,
  FamilySearchResult,
  FamilySearchResultUom,
} from "@/stores/itemRequestService";

// ================================================================
// ROUTE / AUTH
// ================================================================
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const props = defineProps<{ id?: string | number }>();

// ================================================================
// UI STATE
// ================================================================
const showSidePanel = ref(false);
const showValidationModal = ref(false);

// ================================================================
// CORE STATE
// ================================================================
const bootstrapping = ref(false);
const saving = ref(false);
const editingRequest = ref<ItemRequest | null>(null);
const stores = ref<Store[]>([]);

const userAssignedStoreId = ref<number | null>(null);
const userAssignedStoreName = ref<string | null>(null);
const userIsAdmin = ref(false);
const userGroupId = ref<number | null>(null);

const validationErrors = ref<any[]>([]);
const validationMessage = ref("");
const showValidationErrors = ref(false);

const loadingDepartments = ref(false);
const applicableDepartments = ref<
  Array<{ departmentId: number; name: string; code: string }>
>([]);
const removedDepartmentIds = ref<Set<number>>(new Set());

const selectedDepartments = computed(() =>
  applicableDepartments.value.filter((d) => !removedDepartmentIds.value.has(d.departmentId)),
);

const form = ref({
  askingStoreId: "",
  supplyingStoreId: "",
  requestedBy: "",
  requestedDate: "",
  status: "pending" as "pending" | "approved" | "rejected",
  remark: "",
  isAsset: false,
  isTemelash: false,
  temelashFromDate: "",
  temelashToDate: "",
});

const formErrors = ref<string[]>([]);
const requestItems = ref<any[]>([]);

// ================================================================
// COMPUTED — stores
// ================================================================
const filteredSupplyingStores = computed(() => {
  const active = stores.value.filter((s) => s.status === "Active");
  if (!form.value.askingStoreId) return active;
  const askingId = String(form.value.askingStoreId);
  return active.filter((s) => String(s.storeId || s.id) !== askingId);
});

const selectedSupplyingStore = computed<Store | null>(() => {
  if (!form.value.supplyingStoreId) return null;
  const target = String(form.value.supplyingStoreId);
  return stores.value.find((s) => String(s.storeId || s.id) === target) || null;
});

const askingStoreDisplay = computed(() => {
  if (!form.value.askingStoreId) return "—";
  const store = stores.value.find(
    (s) => String(s.storeId || s.id) === String(form.value.askingStoreId),
  );
  return store ? `${store.name} (${store.code})` : userAssignedStoreName.value || "—";
});

// ================================================================
// HEADER / DATE / DEPARTMENT / SECTIONS
// ================================================================
const isEditingHeader = ref(false);
const headerLineRef = ref<HTMLElement | null>(null);
const customHeader = ref<string | null>(null);
const DEFAULT_HEADER = "ITEM REQUISITION FORM";
const displayHeader = computed(() => customHeader.value ?? DEFAULT_HEADER);

const isEditingDate = ref(false);
const dateDraft = ref("");
const dateInputRef = ref<HTMLInputElement | null>(null);

const isEditingDepartment = ref(false);
const departmentDraft = ref("");
const departmentInputRef = ref<HTMLInputElement | null>(null);
const approvedByName = ref("");

interface SectionVisibility {
  department: boolean;
  reason: boolean;
  comment: boolean;
  checkedBy: boolean;
}
const isManagingSections = ref(false);
const sectionVisibility = ref<SectionVisibility>({
  department: true,
  reason: true,
  comment: true,
  checkedBy: true,
});
const visibleSectionCount = computed(() => {
  const v = sectionVisibility.value;
  return (v.department ? 1 : 0) + (v.reason ? 1 : 0) + (v.comment ? 1 : 0) + (v.checkedBy ? 1 : 0);
});
const openSectionManager = () => (isManagingSections.value = true);
const closeSectionManager = () => (isManagingSections.value = false);
const toggleSection = (key: keyof SectionVisibility) => {
  sectionVisibility.value = { ...sectionVisibility.value, [key]: !sectionVisibility.value[key] };
};
const showAllSections = () => {
  sectionVisibility.value = { department: true, reason: true, comment: true, checkedBy: true };
};
const hideAllSections = () => {
  sectionVisibility.value = { department: false, reason: false, comment: false, checkedBy: false };
};

const startEditingHeader = async () => {
  customHeader.value = displayHeader.value;
  isEditingHeader.value = true;
  await nextTick();
  const el = headerLineRef.value;
  if (el) {
    el.innerText = displayHeader.value;
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
};
const cancelEditingHeader = () => (isEditingHeader.value = false);
const saveHeader = () => {
  const el = headerLineRef.value;
  const cleaned = (el?.innerText || "").replace(/\s+/g, " ").trim();
  customHeader.value = !cleaned || cleaned === DEFAULT_HEADER ? null : cleaned;
  isEditingHeader.value = false;
};

const onPastePlain = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") ?? "";
  document.execCommand("insertText", false, text);
};

const toInputDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
const displayDate = computed(() => formatDate(form.value.requestedDate));

const startEditingDate = async () => {
  dateDraft.value = toInputDate(form.value.requestedDate);
  isEditingDate.value = true;
  await nextTick();
  dateInputRef.value?.focus();
  dateInputRef.value?.select?.();
};
const saveDate = () => {
  if (!isEditingDate.value) return;
  const cleaned = (dateDraft.value || "").trim();
  if (cleaned) form.value.requestedDate = cleaned;
  isEditingDate.value = false;
};
const cancelEditingDate = () => {
  isEditingDate.value = false;
  dateDraft.value = "";
};

const displayDepartment = computed<string>(() => {
  if (departmentDraft.value && !isEditingDepartment.value && departmentDraft.value.trim()) {
    return departmentDraft.value;
  }

  const user = authStore.user as any;
  if (user) {
    if (typeof user.department === "string" && user.department.trim()) {
      return user.department.trim();
    }
    if (user.department?.name) return user.department.name;
    if (user.departmentName) return user.departmentName;
  }

  return userAssignedStoreName.value || "N/A";
});

const startEditingDepartment = async () => {
  departmentDraft.value = displayDepartment.value === "N/A" ? "" : displayDepartment.value;
  isEditingDepartment.value = true;
  await nextTick();
  departmentInputRef.value?.focus();
  departmentInputRef.value?.select?.();
};
const saveDepartment = () => (isEditingDepartment.value = false);
const cancelEditingDepartment = () => (isEditingDepartment.value = false);

const onApprovedNameBlur = (e: FocusEvent) => {
  const el = e.target as HTMLElement;
  const text = (el.innerText || "").replace(/\u00a0/g, " ").trim();
  approvedByName.value = text;
  el.innerText = text;
};

// ================================================================
// COLUMNS
// ================================================================
type ColumnAlign = "left" | "center";
interface ColumnDef {
  key: string;
  label: string;
  width: string;
  visible: boolean;
  getValue: (item: any) => string;
  align?: ColumnAlign;
  bold?: boolean;
  custom?: boolean;
  locked?: boolean;
  editable?: boolean;
  kind?: "text" | "number";
  computed?: "totalPrice";
  pairedKey?: string;
}

const isManagingColumns = ref(false);
const newColumnChoice = ref("");
const newColumnCustomLabel = ref("");

const COLUMN_OPTIONS = [
  { value: "unitPrice",        label: "Unit Price" },
  { value: "totalPrice",       label: "Total Price" },
  { value: "neberetStock",     label: "Neberet Astedader Stock Balance" },
  { value: "mainStoreBalance", label: "Main Store Balance" },
  { value: "miniStoreBalance", label: "Mini Store Balance" },
  { value: "miniMinBalance",   label: "Mini Min Store Balance" },
  { value: "__other__",        label: "Other… (type a name)" },
];

const getItemNameOnly = (item: any): string =>
  item?.name || item?.standardName || item?.item?.name || "Unknown Item";

const formatQuantity = (v: number | string): string => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "0.00";
  return n.toFixed(2);
};
const getItemBrand = (item: any): string => item?.brand || item?.item?.brand || "";
const getItemModel = (item: any): string => item?.model || item?.item?.model || "";
const stripHtml = (html: string): string => (html || "").replace(/<[^>]*>/g, "").trim();
const getItemSpecification = (item: any): string =>
  item?.specification || item?.item?.specText || "";

const getBaseUOM = (item: any): string => {
  if (!item) return "N/A";
  if (item._baseUom && item._baseUom !== "N/A") return item._baseUom;
  if (item.uom_code) return item.uom_code;
  if (item.uomCode) return item.uomCode;
  if (item.baseUom) return item.baseUom;
  if (item.item?.uom) {
    if (typeof item.item.uom === "string") return item.item.uom;
    if (item.item.uom.code) return item.item.uom.code;
    if (item.item.uom.name) return item.item.uom.name;
  }
  if (item.item?.uomCode) return item.item.uomCode;
  if (item.item?.uom_code) return item.item.uom_code;
  if (item.uom) {
    if (typeof item.uom === "string") return item.uom;
    if (item.uom.code) return item.uom.code;
    if (item.uom.name) return item.uom.name;
  }
  return "N/A";
};

const getConversionUOM = (item: any): string => {
  if (!item) return "N/A";
  if (item._convUom && item._convUom !== "N/A") return item._convUom;
  if (item.conversion_uom_code) return item.conversion_uom_code;
  if (item.conversionUomCode) return item.conversionUomCode;
  if (item.convUom) return item.convUom;
  if (item.item?.conversionUom) {
    if (typeof item.item.conversionUom === "string") return item.item.conversionUom;
    if (item.item.conversionUom.code) return item.item.conversionUom.code;
    if (item.item.conversionUom.name) return item.item.conversionUom.name;
  }
  if (item.conversionUom) {
    if (typeof item.conversionUom === "string") return item.conversionUom;
    if (item.conversionUom.code) return item.conversionUom.code;
    if (item.conversionUom.name) return item.conversionUom.name;
  }
  return "N/A";
};

const getSelectedUomLabel = (item: any): string => {
  if (item?._baseUom && item._baseUom !== "N/A") return item._baseUom;
  if (item?.uom_code && item.uom_code !== "") return item.uom_code;
  if (item?.uomCode && item.uomCode !== "") return item.uomCode;
  if (item?.selectedUom === "conversion") {
    return getConversionUOM(item) || getBaseUOM(item);
  }
  return getBaseUOM(item);
};

const buildDefaultColumns = (): ColumnDef[] => [
  {
    key: "item", label: "Item", width: "20%", visible: true, locked: true, align: "left",
    getValue: (it: any) => getItemNameOnly(it),
  },
  {
    key: "uom", label: "U.O.M", width: "7%", visible: true, locked: true,
    getValue: (it: any) => getSelectedUomLabel(it),
  },
  {
    key: "quantity", label: "Qty", width: "7%", visible: true, locked: true, bold: true,
    getValue: (it: any) => formatQuantity(it.quantity),
  },
  {
    key: "brand", label: "Brand", width: "11%", visible: true,
    getValue: (it: any) => getItemBrand(it) || "",
  },
  {
    key: "model", label: "Model", width: "11%", visible: true,
    getValue: (it: any) => getItemModel(it) || "",
  },
  {
    key: "specification", label: "Specification", width: "20%", visible: true,
    getValue: (it: any) => stripHtml(getItemSpecification(it)) || "",
  },
];

const columns = ref<ColumnDef[]>(buildDefaultColumns());
const customCellData = ref<Record<string, Record<string, Record<string, string>>>>({});

const visibleColumns = computed(() => columns.value.filter((c) => c.visible));
const dataColumns = computed(() => visibleColumns.value);
const visibleColumnCount = computed(() => visibleColumns.value.length);
const hasAnyHiddenColumn = computed(() => columns.value.some((c) => !c.visible));
const isEditableColumn = (col: ColumnDef) => !!col.editable && !col.computed;
const isComputedColumn = (col: ColumnDef) => !!col.computed;
const hasTotalPriceColumn = computed(() => dataColumns.value.some((c) => c.key === "totalPrice"));

const grandTotal = computed<number>(() => {
  const totalCol = dataColumns.value.find((c) => c.key === "totalPrice");
  if (!totalCol) return 0;
  let sum = 0;
  requestItems.value.forEach((it, idx) => {
    const raw = getComputedCellValue(it, idx, totalCol);
    const num = parseFloat(String(raw).replace(/[^0-9.\-]/g, "")) || 0;
    sum += num;
  });
  return sum;
});
const grandTotalFormatted = computed(() =>
  grandTotal.value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
);

const isColumnEmpty = (col: ColumnDef): boolean => {
  const list = requestItems.value;
  if (list.length === 0) return false;
  if (col.computed) {
    return !list.some((it, idx) =>
      String(getComputedCellValue(it, idx, col) || "").trim() !== "",
    );
  }
  if (col.editable) {
    const data = customCellData.value["compose"] || {};
    return !list.some((_, idx) => {
      const v = data[String(idx)]?.[col.key];
      return v != null && String(v).trim() !== "";
    });
  }
  return !list.some((it) => String(col.getValue(it) || "").trim() !== "");
};

const isColumnLocked = (col: ColumnDef): boolean => col.locked || !isColumnEmpty(col);
const hasAnyEmptyVisibleColumn = computed(() =>
  columns.value.some((c) => c.visible && !isColumnLocked(c) && isColumnEmpty(c)),
);

const toggleColumn = (key: string) => {
  const col = columns.value.find((c) => c.key === key);
  if (!col || isColumnLocked(col)) return;
  col.visible = !col.visible;
};
const hideEmptyColumns = () => {
  columns.value.forEach((col) => {
    if (isColumnLocked(col)) return;
    if (!col.visible) return;
    if (isColumnEmpty(col)) col.visible = false;
  });
};
const showAllColumns = () => columns.value.forEach((c) => (c.visible = true));
const resetColumnState = () => (columns.value = buildDefaultColumns());
const openColumnManager = () => (isManagingColumns.value = true);
const closeColumnManager = () => {
  isManagingColumns.value = false;
  newColumnChoice.value = "";
  newColumnCustomLabel.value = "";
};
const isColumnOptionDisabled = (value: string) =>
  !!value && value !== "__other__" && columns.value.some((c) => c.key === value);
const canAddColumn = computed(() => {
  if (!newColumnChoice.value) return false;
  if (newColumnChoice.value === "__other__") return !!newColumnCustomLabel.value.trim();
  return !columns.value.some((c) => c.key === newColumnChoice.value);
});
const addColumnFromDropdown = () => {
  if (!canAddColumn.value) return;
  const choice = newColumnChoice.value;
  if (choice === "__other__") {
    const label = newColumnCustomLabel.value.trim();
    if (!label) return;
    columns.value.push({
      key: `custom_${Date.now()}`, label, width: "12%", visible: true,
      custom: true, editable: true, kind: "text", getValue: () => "",
    });
    newColumnChoice.value = "";
    newColumnCustomLabel.value = "";
    return;
  }
  if (choice === "unitPrice" || choice === "totalPrice") {
    if (!columns.value.some((c) => c.key === "unitPrice")) {
      columns.value.push({
        key: "unitPrice", label: "Unit Price", width: "9%", visible: true,
        custom: true, editable: true, kind: "number",
        pairedKey: "totalPrice", getValue: () => "",
      });
    }
    if (!columns.value.some((c) => c.key === "totalPrice")) {
      columns.value.push({
        key: "totalPrice", label: "Total Price", width: "10%", visible: true,
        custom: true, computed: "totalPrice", getValue: () => "",
      });
    }
  } else {
    const preset = COLUMN_OPTIONS.find((o) => o.value === choice);
    if (preset && !columns.value.some((c) => c.key === preset.value)) {
      columns.value.push({
        key: preset.value, label: preset.label, width: "11%", visible: true,
        custom: true, editable: true, kind: "number", getValue: () => "",
      });
    }
  }
  newColumnChoice.value = "";
  newColumnCustomLabel.value = "";
};
const removeCustomColumn = (key: string) => {
  const col = columns.value.find((c) => c.key === key);
  if (!col || col.locked) return;
  if (!isColumnEmpty(col)) return;
  const keys = [key];
  if (col.key === "unitPrice") keys.push("totalPrice");
  if (col.key === "totalPrice") keys.push("unitPrice");
  columns.value = columns.value.filter((c) => !(c.custom && keys.includes(c.key)));
};

const getCustomCellValue = (rowIndex: number, colKey: string): string =>
  customCellData.value["compose"]?.[String(rowIndex)]?.[colKey] || "";
const setCustomCellValue = (rowIndex: number, colKey: string, value: string) => {
  if (!customCellData.value["compose"]) customCellData.value["compose"] = {};
  const bucket = customCellData.value["compose"];
  const rowKey = String(rowIndex);
  const rowBucket = bucket[rowKey] ?? (bucket[rowKey] = {});
  rowBucket[colKey] = value;
};
const onCustomCellBlur = (rowIndex: number, colKey: string, e: FocusEvent) => {
  const el = e.target as HTMLElement;
  let text = (el.innerText || "").replace(/\u00a0/g, " ").trim();
  const col = columns.value.find((c) => c.key === colKey);
  if (col?.kind === "number") {
    const cleaned = text.replace(/[^0-9.\-]/g, "");
    if (cleaned !== text) text = cleaned;
  }
  setCustomCellValue(rowIndex, colKey, text);
  el.innerText = text;
};
const onCustomCellEnter = (e: KeyboardEvent) => (e.target as HTMLElement).blur();

const getComputedCellValue = (item: any, rowIndex: number, col: ColumnDef): string => {
  if (col.computed === "totalPrice") {
    const unit = parseFloat(getCustomCellValue(rowIndex, "unitPrice")) || 0;
    const qty = parseFloat(String(item?.quantity ?? 0)) || 0;
    if (!unit || !qty) return "";
    return (unit * qty).toLocaleString(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }
  return "";
};

const getColumnValue = (item: any, col: ColumnDef, _i: number): string => {
  try { return col.getValue(item) ?? ""; } catch { return ""; }
};

// ================================================================
// MERGE
// ================================================================
const isMergingRemarks = ref(false);
const selectedRowIndexes = ref<number[]>([]);
interface MergeGroup { start: number; size: number; text: string }
const mergeGroups = ref<MergeGroup[]>([]);

const toggleMergeMode = () => {
  isMergingRemarks.value = !isMergingRemarks.value;
  if (!isMergingRemarks.value) selectedRowIndexes.value = [];
};
const isRowSelected = (i: number) => selectedRowIndexes.value.includes(i);
const toggleRowSelection = (i: number) => {
  const pos = selectedRowIndexes.value.indexOf(i);
  if (pos >= 0) selectedRowIndexes.value.splice(pos, 1);
  else selectedRowIndexes.value.push(i);
};
const clearSelection = () => (selectedRowIndexes.value = []);
const isRowMerged = (i: number) =>
  mergeGroups.value.some((g) => i >= g.start && i < g.start + g.size);
const isRowAbsorbedByMerge = (i: number) =>
  mergeGroups.value.some((g) => i > g.start && i < g.start + g.size);
const isMergeStartRow = (i: number) => mergeGroups.value.some((g) => g.start === i);
const getMergeSize = (start: number) => {
  const g = mergeGroups.value.find((grp) => grp.start === start);
  return g ? g.size : 1;
};
const getMergedRemarkText = (start: number) => {
  const g = mergeGroups.value.find((grp) => grp.start === start);
  return g ? g.text : "";
};
const applyMerge = () => {
  const selected = [...selectedRowIndexes.value].sort((a, b) => a - b);
  if (selected.length < 2) return;
  if (selected.some((i) => isRowMerged(i))) {
    alert("Some selected rows are already part of a merge.");
    return;
  }
  for (let i = 1; i < selected.length; i++) {
    if (selected[i] !== (selected[i - 1] ?? 0) + 1) {
      alert("Please select consecutive rows.");
      return;
    }
  }
  const first = selected[0]!;
  const text = (requestItems.value[first]?.remark || "").trim() || "—";
  mergeGroups.value = [...mergeGroups.value, { start: first, size: selected.length, text }];
  selectedRowIndexes.value = [];
};
const unmergeGroup = (start: number) => {
  mergeGroups.value = mergeGroups.value.filter((g) => g.start !== start);
};

// ================================================================
// ROW OPS
// ================================================================
const updateQuantity = (index: number, value: string) => {
  const item = requestItems.value[index];
  if (!item) return;
  let q = parseFloat(value);
  if (isNaN(q) || q < 0.01) q = 0.01;
  item.quantity = Math.round(q * 100) / 100;
};
const removeSelectedItem = (index: number) => {
  requestItems.value.splice(index, 1);
  mergeGroups.value = [];
};

// ================================================================
// DRAFT ROW — FAMILY SEARCH
// ================================================================
const draftSearchRef = ref<HTMLInputElement | null>(null);
const draftPickerRef = ref<HTMLElement | null>(null);

const draftSearch = ref("");
const draftOptions = ref<FamilySearchResult[]>([]);
const draftTotal = ref(0);
const draftPage = ref(1);
const isDraftSearching = ref(false);
const isDraftLoadingMore = ref(false);
const hasMoreDraftItems = ref(false);
const showDraftDropdown = ref(false);
const draftPreloaded = ref(false);

const draftSelectedFamily = ref<FamilySearchResult | null>(null);
const draftSelectedUom = ref<FamilySearchResultUom | null>(null);
const draftQty = ref(1);
const draftRemark = ref("");
const draftBrand = ref("");
const draftModel = ref("");
const draftSpecification = ref("");
const draftFieldValues = ref<Record<string, string>>({});

const draftTailColumns = computed(() => dataColumns.value.filter((c) => c.key !== "item"));

let draftSearchTimeout: ReturnType<typeof setTimeout> | null = null;

const onDraftFocus = () => {
  showDraftDropdown.value = true;
  if (!draftSearch.value.trim() && !draftPreloaded.value) {
    draftPreloaded.value = true;
    loadDraftOptions("", 1, false, true);
  } else if (draftSearch.value.trim() && draftOptions.value.length === 0) {
    loadDraftOptions(draftSearch.value.trim(), 1, false);
  }
};

const onDraftBlur = () => {
  setTimeout(() => {
    showDraftDropdown.value = false;
  }, 150);
};

const onDraftSearchInput = () => {
  showDraftDropdown.value = true;
  if (draftSearchTimeout) clearTimeout(draftSearchTimeout);

  const q = draftSearch.value.trim();
  if (!q) {
    draftPreloaded.value = true;
    loadDraftOptions("", 1, false, true);
    return;
  }

  isDraftSearching.value = true;
  draftSearchTimeout = setTimeout(() => loadDraftOptions(q, 1, false), 250);
};

const loadDraftOptions = async (
  query: string,
  page = 1,
  append = false,
  allowEmpty = false,
) => {
  const q = query.trim();

  if (!q && !allowEmpty) {
    draftOptions.value = [];
    draftTotal.value = 0;
    hasMoreDraftItems.value = false;
    isDraftSearching.value = false;
    return;
  }

  if (page === 1) isDraftSearching.value = true;
  else isDraftLoadingMore.value = true;

  try {
    const res = await itemRequestService.getActiveItems({
      search: q || undefined,
      page,
      limit: 20,
      storeId: Number(form.value.supplyingStoreId) || undefined,
      groupId: userGroupId.value ?? undefined,
    });
    if (!res.success) return;

    const existingIds = new Set(requestItems.value.map((it) => String(it.itemId)));
    const rows = (res.data || [])
      .map((fam) => ({
        ...fam,
        uoms: fam.uoms.filter((u) => !existingIds.has(String(u.itemId))),
      }))
      .filter((fam) => fam.uoms.length > 0);

    if (append) draftOptions.value = [...draftOptions.value, ...rows];
    else draftOptions.value = rows;

    const pagination = (res as any).pagination;
    if (pagination) {
      draftTotal.value = pagination.total;
      draftPage.value = pagination.page;
      hasMoreDraftItems.value = pagination.page < pagination.pages;
    } else {
      draftTotal.value = rows.length;
      hasMoreDraftItems.value = false;
    }
  } catch (e) {
    console.error("draft search error", e);
  } finally {
    isDraftSearching.value = false;
    isDraftLoadingMore.value = false;
  }
};

const loadMoreDraftItems = async () => {
  if (isDraftLoadingMore.value || !hasMoreDraftItems.value) return;
  await loadDraftOptions(draftSearch.value.trim(), draftPage.value + 1, true, true);
};
const pickFamily = (family: FamilySearchResult) => {
  draftSelectedFamily.value = family;
  draftSelectedUom.value = null;
  showDraftDropdown.value = false;
  draftQty.value = 1;
  draftBrand.value = "";
  draftModel.value = "";
  draftSpecification.value = "";
  draftRemark.value = "";
  draftFieldValues.value = {};

  // ✅ Default-select a UOM so the row is ready to add immediately.
  const preferred =
    (family.uoms as any[]).find((u: any) => u.isPrimary === true) ||
    family.uoms[0] ||
    null;

  if (preferred) {
    selectDraftUom(preferred);
  }
};

const selectDraftUom = (uom: FamilySearchResultUom) => {
  draftSelectedUom.value = uom;
  draftSearch.value = uom.code;
};

// ✅ NEW: called when the user picks a UOM from the select in the UOM column
const onDraftUomSelect = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const itemId = Number(target.value);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    draftSelectedUom.value = null;
    return;
  }
  const match = (draftSelectedFamily.value?.uoms || []).find(
    (u) => Number(u.itemId) === itemId
  );
  if (match) {
    selectDraftUom(match);
  }
};

const resetDraft = () => {
  draftSelectedFamily.value = null;
  draftSelectedUom.value = null;
  draftSearch.value = "";
  draftOptions.value = [];
  draftTotal.value = 0;
  draftPage.value = 1;
  hasMoreDraftItems.value = false;
  showDraftDropdown.value = false;
  draftQty.value = 1;
  draftBrand.value = "";
  draftModel.value = "";
  draftSpecification.value = "";
  draftRemark.value = "";
  draftFieldValues.value = {};
  isDraftSearching.value = false;
  nextTick(() => draftSearchRef.value?.focus());
};

const onDraftSearchEnter = () => {
  if (!draftSelectedFamily.value && draftOptions.value.length === 1) {
    const onlyOption = draftOptions.value[0];
    if (onlyOption) pickFamily(onlyOption);
  }
  commitDraft();
};

const commitDraft = () => {
  if (!draftSelectedUom.value) return;
  const u = draftSelectedUom.value;
  const id = Number(u.itemId);
  if (!Number.isFinite(id) || id <= 0) return;

  const exists = requestItems.value.some((it) => String(it.itemId) === String(id));
  if (exists) {
    resetDraft();
    return;
  }

  requestItems.value.push({
    itemId: id,
    code: u.code,
    name: u.name,
    quantity: Number(draftQty.value) || 1,
    remark: draftRemark.value || "",
    selectedUom: "base",
    _baseUom: u.uomCode,
    _convUom: "N/A",
    specification: draftSpecification.value || "",
    brand: draftBrand.value || "",
    model: draftModel.value || "",
    __extras: { ...draftFieldValues.value },
  });

  resetDraft();
};

// ================================================================
// PAGE SNAPSHOT
// ================================================================
const buildPageSnapshot = (): PageSnapshot => {
  const askingId =
    form.value.askingStoreId && !isNaN(Number(form.value.askingStoreId))
      ? Number(form.value.askingStoreId)
      : null;
  const supplyingId =
    form.value.supplyingStoreId && !isNaN(Number(form.value.supplyingStoreId))
      ? Number(form.value.supplyingStoreId)
      : null;

  const columnSnapshot: SnapshotColumn[] = columns.value.map((c) => ({
    key: c.key,
    label: c.label,
    width: c.width,
    visible: c.visible,
    custom: !!c.custom,
    locked: !!c.locked,
    editable: !!c.editable,
    kind: c.kind,
    computed: c.computed,
    pairedKey: c.pairedKey,
    align: c.align,
    bold: !!c.bold,
  }));

  const itemSnapshot: SnapshotItem[] = requestItems.value.map((it) => ({
    itemId: Number(it.itemId) || 0,
    code: it.code || "",
    name: it.name || "",
    quantity: Number(it.quantity) || 0,
    selectedUom: "base",
    uomCode: it._baseUom || "",
    isBaseUom: true,
    specification: it.specification || "",
    brand: it.brand || "",
    model: it.model || "",
    remark: it.remark || "",
    extras: { ...(it.__extras || {}) },
  }));

  return {
    requestCode:
      editingRequest.value?.requestCode ||
      editingRequest.value?.id?.toString() ||
      "NEW",
    askingStoreId: askingId,
    supplyingStoreId: supplyingId,

    header: displayHeader.value,
    department: displayDepartment.value,
    requestedBy: form.value.requestedBy || "",
    approvedByName: approvedByName.value || "",
    requestedDate: form.value.requestedDate || "",
    overrideDate: form.value.requestedDate || null,

    sectionVisibility: { ...sectionVisibility.value },

    columnsConfig: columnSnapshot,
    items: itemSnapshot,
    customCells: JSON.parse(
      JSON.stringify(customCellData.value["compose"] || {}),
    ),
    mergeGroups: mergeGroups.value.map((g) => ({ ...g })),

    isAsset: !!form.value.isAsset,
    isTemelash: !!form.value.isTemelash,
    temelashFromDate: form.value.isTemelash
      ? form.value.temelashFromDate || null
      : null,
    temelashToDate: form.value.isTemelash
      ? form.value.temelashToDate || null
      : null,
    remark: form.value.remark || "",

    savedAt: new Date().toISOString(),
    savedByUserId: authStore.user?.userId ?? null,
  };
};

// ================================================================
// LOAD / INIT
// ================================================================
const loadStores = async () => {
  try {
    const res = await itemRequestService.getActiveStores();
    if (res.success) stores.value = res.data;
  } catch (e) {
    console.error("Load stores error:", e);
  }
};

const loadUserData = () => {
  const user = authStore.user;
  if (!user) return;
  const ud: any = user;
  userIsAdmin.value = ud.isAdmin || user.role === "admin" || user.role === "Admin";

  userGroupId.value =
    ud.groupId || ud.assignedGroupId || authStore.userGroupId || null;

  let storeId = authStore.userStoreId;
  if (!storeId) {
    storeId =
      ud.storeId || ud.assignedStore?.id || ud.currentStore?.id || ud.store?.id || null;
  }
  if (storeId) {
    userAssignedStoreId.value = storeId;
    userAssignedStoreName.value =
      ud.storeName || ud.assignedStore?.name || ud.currentStore?.name || "Assigned Store";
    if (!editingRequest.value) form.value.askingStoreId = String(storeId);
  }
};

const loadEditingRequest = async () => {
  const id = props.id ?? route.params.id;
  if (!id) {
    editingRequest.value = null;
    return;
  }
  bootstrapping.value = true;
  try {
    const res = await itemRequestService.getRequestById(Number(id));
    if (res?.success && res.data) editingRequest.value = res.data;
    else {
      const req = (res as any)?.request || (res as any)?.data?.request;
      if (req) editingRequest.value = req;
    }
  } catch (e) {
    console.error("Load request error:", e);
  } finally {
    bootstrapping.value = false;
  }
};

const initializeForm = () => {
  const today = new Date().toISOString().split("T")[0] || "";
  const req = editingRequest.value;

  if (req) {
    form.value = {
      askingStoreId: String(req.askingStoreId || userAssignedStoreId.value || ""),
      supplyingStoreId: String(req.supplyingStoreId || ""),
      requestedBy:
        req.requestedBy ||
        req.requestedByUser?.fullName ||
        req.requestedByUser?.username ||
        getCurrentUser(),
      requestedDate: String(req.requestedDate || today),
      status: "pending",
      remark: req.remark || "",
      isAsset: (req as any).isAsset || false,
      isTemelash: (req as any).isTemelash || false,
      temelashFromDate: (req as any).temelashFromDate || "",
      temelashToDate: (req as any).temelashToDate || "",
    };

    requestItems.value = (req.items || []).map((it: any) => ({
      itemId: Number(it.itemId || it.id || 0),
      code: it.item?.code || it.itemCode || it.code || "N/A",
      name: it.item?.name || it.itemName || it.name || "Unknown",
      quantity: Number(it.quantity) || 1,
      remark: it.remark || "",
      selectedUom: "base",
      _baseUom: it.uom_code || it.item?.uom?.code || "N/A",
      _convUom: "N/A",
      specification: it.specification || it.item?.specText || "",
      brand: it.brand || it.item?.brand || "",
      model: it.model || it.item?.model || "",
    }));
  } else {
    form.value = {
      askingStoreId: String(userAssignedStoreId.value || ""),
      supplyingStoreId: "",
      requestedBy: getCurrentUser(),
      requestedDate: today,
      status: "pending",
      remark: "",
      isAsset: false,
      isTemelash: false,
      temelashFromDate: "",
      temelashToDate: "",
    };
    requestItems.value = [];
  }

  resetDraft();
  nextTick(() => draftSearchRef.value?.focus());
};

const applySnapshot = (snap: PageSnapshot | null | undefined) => {
  if (!snap) return;

  if (typeof snap.header === "string" && snap.header.trim()) {
    customHeader.value =
      snap.header.trim() === DEFAULT_HEADER ? null : snap.header.trim();
  }

  if (snap.sectionVisibility) {
    sectionVisibility.value = Object.assign({
      department: true,
      reason: true,
      comment: true,
      checkedBy: true,
    }, snap.sectionVisibility);
  }

  if (typeof snap.department === "string" && snap.department.trim()) {
    departmentDraft.value = snap.department.trim();
  }
  if (typeof snap.approvedByName === "string" && snap.approvedByName.trim()) {
    approvedByName.value = snap.approvedByName.trim();
  }
  if (typeof snap.overrideDate === "string" && snap.overrideDate.trim()) {
    form.value.requestedDate = snap.overrideDate;
  }

  if (Array.isArray(snap.columnsConfig) && snap.columnsConfig.length > 0) {
    const builtin = new Map(buildDefaultColumns().map((c) => [c.key, c]));
    const restored: ColumnDef[] = [];

    snap.columnsConfig.forEach((s) => {
      const base = builtin.get(s.key);
      if (base) {
        restored.push({ ...base, visible: s.visible !== false });
      } else if (s.custom) {
        restored.push({
          key: s.key,
          label: s.label || "Custom",
          width: s.width || "12%",
          visible: s.visible !== false,
          custom: true,
          editable: s.editable ?? true,
          kind: (s.kind as any) || "text",
          computed: s.computed as any,
          pairedKey: s.pairedKey,
          align: s.align,
          bold: !!s.bold,
          getValue: () => "",
        });
      }
    });

    builtin.forEach((b, k) => {
      if (!restored.find((c) => c.key === k)) {
        restored.push({ ...b, visible: true });
      }
    });

    columns.value = restored;
  }

  if (snap.customCells && typeof snap.customCells === "object") {
    customCellData.value = {
      compose: JSON.parse(JSON.stringify(snap.customCells)),
    };
  }

  if (Array.isArray(snap.mergeGroups)) {
    mergeGroups.value = snap.mergeGroups
      .map((g: any) => ({
        start: Number(g.start) || 0,
        size: Number(g.size) || 1,
        text: String(g.text ?? "—"),
      }))
      .filter((g: any) => g.size > 1);
  }
};

const getCurrentUser = (): string =>
  authStore.user?.fullName || authStore.user?.username || authStore.user?.email || "Unknown User";

const closeValidationErrors = () => {
  showValidationErrors.value = false;
  showValidationModal.value = false;
  validationErrors.value = [];
  validationMessage.value = "";
};

const closeValidationModal = () => {
  showValidationModal.value = false;
};

// ================================================================
// DEPARTMENTS
// ================================================================
const getAskingStoreCode = (): string => {
  if (!form.value.askingStoreId) return "N/A";
  const store = stores.value.find(
    (s) => String(s.storeId || s.id) === String(form.value.askingStoreId),
  );
  return store?.code || "N/A";
};

const loadApplicableDepartments = async () => {
  loadingDepartments.value = true;
  applicableDepartments.value = [];
  try {
    const code = getAskingStoreCode();
    if (!code || code === "N/A") return;
    const res = await itemRequestService.getApprovalDepartmentsForStore(code);
    if (!res.success || !res.data) return;
    if (!res.data.requiresApproval || !res.data.departments?.length) return;
    applicableDepartments.value = res.data.departments.map((d) => ({
      departmentId: d.departmentId,
      name: d.name,
      code: d.code,
    }));
  } catch (e) {
    console.warn("Failed to load approval departments:", e);
  } finally {
    loadingDepartments.value = false;
  }
};

const removeDepartment = (id: number) => {
  removedDepartmentIds.value.add(id);
  removedDepartmentIds.value = new Set(removedDepartmentIds.value);
};
const restoreDepartment = (id: number) => {
  removedDepartmentIds.value.delete(id);
  removedDepartmentIds.value = new Set(removedDepartmentIds.value);
};

// ================================================================
// SAVE
// ================================================================
const isFormValid = computed(() => {
  if (requestItems.value.length === 0) return false;
  const allValid = requestItems.value.every((it) => it.quantity > 0);
  if (!allValid) return false;
  const base =
    !!form.value.askingStoreId &&
    !!form.value.supplyingStoreId &&
    !!form.value.requestedBy &&
    !!form.value.requestedDate;
  if (!base) return false;
  if (form.value.isTemelash) {
    if (!form.value.temelashFromDate || !form.value.temelashToDate) return false;
    if (form.value.temelashToDate < form.value.temelashFromDate) return false;
  }
  return true;
});

const saveRequest = async () => {
  closeValidationErrors();
  formErrors.value = [];

  if (!form.value.askingStoreId) formErrors.value.push("Please select the asking store");
  if (!form.value.supplyingStoreId) formErrors.value.push("Please select the supplying store");
  if (form.value.askingStoreId === form.value.supplyingStoreId)
    formErrors.value.push("Asking store and supplying store cannot be the same");
  if (requestItems.value.length === 0) formErrors.value.push("Please add at least one item");

  const ids = requestItems.value.map((it) => String(it.itemId)).filter(Boolean);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    validationMessage.value = "Duplicate items found in the request.";
    validationErrors.value = requestItems.value
      .filter((it) => dupes.includes(String(it.itemId)))
      .map((it) => ({
        itemId: it.itemId,
        itemName: it.name,
        itemCode: it.code,
        requestedQuantity: it.quantity,
        message: "Duplicate item in the request.",
      }));
    showValidationErrors.value = true;
    showValidationModal.value = true;
    return;
  }

  if (form.value.isTemelash) {
    if (!form.value.temelashFromDate) formErrors.value.push("Temelash: Please select the 'From' date");
    if (!form.value.temelashToDate) formErrors.value.push("Temelash: Please select the 'To' date");
    if (
      form.value.temelashFromDate &&
      form.value.temelashToDate &&
      form.value.temelashToDate < form.value.temelashFromDate
    )
      formErrors.value.push("Temelash: 'To' date must be on or after 'From'");
  }

  if (formErrors.value.length > 0) return;

  saving.value = true;
  try {
    const snapshot = buildPageSnapshot();

    const requestData = {
      askingStoreId: Number(form.value.askingStoreId),
      supplyingStoreId: Number(form.value.supplyingStoreId),
      items: requestItems.value.map((it) => ({
        itemId: Number(it.itemId),
        quantity: it.quantity,
        remark: it.remark || "",
        selectedUom: "base" as const,
        uomCode: it._baseUom || it.uom_code || "Units",
        isBaseUom: true,
        specification: it.specification || "",
        brand: it.brand || "",
        model: it.model || "",
      })),
      requestedById: authStore.user?.userId,
      requestedBy: form.value.requestedBy,
      requestedDate: form.value.requestedDate,
      status: form.value.status as "pending" | "approved" | "rejected",
      remark: form.value.remark,
      isAsset: form.value.isAsset,
      isTemelash: form.value.isTemelash,
      temelashFromDate: form.value.isTemelash ? form.value.temelashFromDate || null : null,
      temelashToDate: form.value.isTemelash ? form.value.temelashToDate || null : null,
      excludedDepartmentIds: Array.from(removedDepartmentIds.value),

      customHeader: customHeader.value,
      department: departmentDraft.value || displayDepartment.value || null,
      approvedByName: approvedByName.value || null,
      overrideDate: form.value.requestedDate || null,
      sectionVisibility: { ...sectionVisibility.value },
      columnsConfig: snapshot.columnsConfig,
      customCells: snapshot.customCells,
      pageSnapshot: snapshot,
    };

    let res;
    if (editingRequest.value) {
      const rid = editingRequest.value.requestId || editingRequest.value.id;
      res = await itemRequestService.updateRequest(rid!, requestData);
    } else {
      res = await itemRequestService.createRequest(requestData);
    }

    if (res.success) {
      router.push({ name: "item-requests", query: { refresh: Date.now().toString() } });
    } else if (res.errors?.length) {
      validationErrors.value = res.errors;
      validationMessage.value = res.message || "Validation failed.";
      showValidationErrors.value = true;
      showValidationModal.value = true;
    } else {
      formErrors.value.push(res.error || res.message || "Failed to save");
    }
  } catch (e: any) {
    const ed = e?.response?.data;
    if (ed?.errors?.length) {
      validationErrors.value = ed.errors;
      validationMessage.value = ed.message || "Validation failed.";
      showValidationErrors.value = true;
      showValidationModal.value = true;
    } else {
      formErrors.value.push(ed?.error || e.message || "Failed to save");
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// NAV / WATCHERS / LIFECYCLE
// ================================================================
const goBack = () => {
  if (saving.value) return;
  if (window.history.length > 1) router.back();
  else router.push({ name: "item-requests" });
};

watch(() => form.value.askingStoreId, () => {
  removedDepartmentIds.value = new Set();
  if (form.value.isAsset) loadApplicableDepartments();
});
watch(() => form.value.isAsset, (v) => {
  removedDepartmentIds.value = new Set();
  if (v) loadApplicableDepartments();
});
watch(() => form.value.isTemelash, (v) => {
  if (!v) {
    form.value.temelashFromDate = "";
    form.value.temelashToDate = "";
  }
});

watch(showValidationErrors, (v) => {
  if (v && validationErrors.value.length > 0) {
    showValidationModal.value = true;
  }
});

const onEscKey = (e: KeyboardEvent) => {
  if (e.key === "Escape" && showValidationModal.value) {
    closeValidationModal();
  }
};

onMounted(async () => {
  window.addEventListener("keydown", onEscKey);
  loadUserData();
  await loadStores();
  await loadEditingRequest();
  initializeForm();

  const snap = (editingRequest.value as any)?.printOverride?.pageSnapshot ?? null;
  if (snap) applySnapshot(snap);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEscKey);
  if (draftSearchTimeout) clearTimeout(draftSearchTimeout);
});
</script>

<style scoped>
/* ================================================================
   THE ORIGINAL STYLES — unchanged except for the new
   .val-error-context / .val-error-math / .val-error-table-* classes
   appended at the bottom of this file (see below the existing rules)
   ================================================================ */

/* Grid column wrapping name + category */
.draft-option-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.draft-option-category {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 600;
  color: #4338ca;
  background: #e0e7ff;
  padding: 1px 7px;
  border-radius: 8px;
  align-self: flex-start;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.item-category-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #4338ca;
  background: #e0e7ff;
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

/* ================================================================
   PAGE LAYOUT
   ================================================================ */
.page-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 20px;
}
.print-page { flex: 1 1 auto; min-width: 0; max-width: 100%; }

.side-panel {
  flex: 0 0 260px;
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease, margin 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(30px);
  margin-right: -260px;
}
@media (max-width: 1100px) {
  .page-layout { flex-direction: column; }
  .side-panel { flex: 1 1 auto; width: 100%; position: static; }
}

/* Sidebar cards */
.side-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.side-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.4px; text-transform: uppercase; color: #334155;
}
.side-count {
  background: #e2e8f0; padding: 1px 7px; border-radius: 8px;
  font-size: 10px; font-weight: 700; color: #475569;
}
.side-card-body {
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.side-select, .side-input {
  width: 100%; padding: 7px 10px;
  border: 1px solid #cbd5e1; border-radius: 7px;
  font-size: 12.5px; background: #fff; outline: none; font-family: inherit;
}
.side-select:focus, .side-input:focus {
  border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.side-hint { font-size: 11px; color: #64748b; margin: 0; line-height: 1.4; }
.side-hint.warning { color: #92400e; font-style: italic; }
.side-checkbox {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 500; cursor: pointer;
  padding: 5px 6px; border-radius: 6px;
}
.side-checkbox:hover { background: #f8fafc; }
.side-checkbox input[type="checkbox"] {
  width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer;
}
.side-field { display: flex; flex-direction: column; gap: 4px; }
.side-field label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #64748b;
}
.temelash-card { border-color: #fed7aa; background: #fffbeb; }
.temelash-card .side-card-header {
  background: #fff7ed; border-color: #fed7aa; color: #9a3412;
}

.side-selected-store {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 10px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
}
.side-selected-store.empty { background: #f8fafc; border-color: #e2e8f0; }
.side-selected-store-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.4px;
  text-transform: uppercase; color: #64748b;
}
.side-selected-store-name {
  font-size: 13px; color: #0f172a; line-height: 1.35; word-break: break-word;
}
.side-selected-store.empty .side-selected-store-name {
  color: #94a3b8; font-style: italic; font-weight: 500;
}

/* Departments */
.dept-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.dept-item {
  display: grid;
  grid-template-columns: 22px 1fr 24px;
  align-items: center; gap: 8px;
  padding: 8px 10px;
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
  transition: background 0.15s, border-color 0.15s;
}
.dept-item:hover { background: #f8fafc; border-color: #cbd5e1; }
.dept-item.removed {
  background: #f8fafc; border-style: dashed; opacity: 0.6;
}
.dept-item.removed .dept-item-name {
  text-decoration: line-through; color: #94a3b8;
}
.dept-item-icon { font-size: 14px; text-align: center; }
.dept-item-main {
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.dept-item-name {
  font-size: 12.5px; font-weight: 600; color: #0f172a;
  line-height: 1.25; word-break: break-word;
}
.dept-item-code {
  font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  color: #a16207; background: #fef3c7;
  padding: 1px 6px; border-radius: 6px;
  align-self: flex-start;
}
.dept-item.removed .dept-item-code { background: #f1f5f9; color: #94a3b8; }
.dept-item-btn {
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid #e2e8f0; background: #ffffff;
  color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.dept-item-btn:hover {
  background: #fef2f2; border-color: #fecaca; color: #dc2626;
}
.dept-item-btn.restore:hover {
  background: #f0fdf4; border-color: #bbf7d0; color: #16a34a;
}
.dept-hint { font-size: 11px; color: #64748b; margin: 2px 0 0; }
.dept-empty {
  font-size: 12px; color: #64748b; padding: 10px 6px; text-align: center;
}
.dept-empty.warning { color: #92400e; font-style: italic; }
.dept-empty-spinner { margin-right: 4px; }

/* Top actions */
.top-actions {
  display: flex; justify-content: space-between; align-items: center;
  max-width: 1500px; margin: 10px auto 20px auto;
  padding: 12px 16px;
  background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;
}
.top-actions-right { display: flex; gap: 8px; align-items: center; }
.btn-back-top {
  background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0;
  padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 13px;
}
.btn-back-top:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-toggle-side {
  background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;
  padding: 8px 14px; border-radius: 6px; cursor: pointer;
  font-size: 12.5px; font-weight: 700;
}
.btn-toggle-side.active { background: #dc2626; color: #fff; border-color: #dc2626; }
.btn-print-top {
  background: #2563eb; color: white; border: none;
  padding: 8px 18px; border-radius: 6px; cursor: pointer;
  font-size: 13px; font-weight: 600;
}
.btn-print-top:hover:not(:disabled) { background: #1d4ed8; }
.btn-print-top:disabled { opacity: 0.5; cursor: not-allowed; }

/* Paper */
.print-page {
  font-family: 'Arial', sans-serif; color: #000;
  padding: 20px; background-color: #ffffff;
  border-radius: 12px; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}
.form-header { margin-bottom: 5px; }
.motto {
  text-align: center; font-family: Georgia, serif;
  font-size: 19px; font-weight: 900; letter-spacing: 1px;
  margin: 0 0 4px 0;
}
.company-name {
  text-align: center; font-size: 21px; font-weight: 800;
  margin: 0 0 8px 0;
}
.form-subtitle-title {
  text-align: center; font-size: 15px; font-weight: bold;
  letter-spacing: 0.5px; text-transform: uppercase;
  margin: 0 0 15px 0; color: #1a1a1a;
  border-radius: 6px; padding: 6px 10px;
  outline: 1px dashed transparent; outline-offset: 2px;
}
.form-subtitle-title:not(.is-editing):hover {
  outline-color: #cbd5e1; background: #f8fafc;
}
.form-subtitle-title.is-editing {
  background: #eff6ff; outline: 2px solid #2563eb;
  cursor: text; text-transform: none; white-space: pre-wrap;
}
.header-edit-controls {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin: -8px 0 15px 0; flex-wrap: wrap;
}
.btn-edit-header, .btn-save-header, .btn-cancel-header, .btn-merge-toggle {
  font-size: 11px; padding: 4px 12px; border-radius: 4px;
  border: 1px solid transparent; cursor: pointer; font-weight: 600;
}
.btn-edit-header { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
.btn-save-header { background: #16a34a; color: #fff; }
.btn-cancel-header { background: #e2e8f0; color: #334155; }
.btn-merge-toggle { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
.btn-merge-toggle.active { background: #dc2626; color: #fff; border-color: #dc2626; }
.edit-hint { font-size: 10px; color: #64748b; font-style: italic; margin-left: 4px; }

.date-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; margin-bottom: 6px;
  padding: 8px 0; border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
}
.date-field { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.date-display {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 8px; border-radius: 6px; cursor: pointer;
  outline: 1px dashed transparent;
}
.date-display:hover { background: #f1f5f9; outline-color: #cbd5e1; }
.date-edit-pencil { font-size: 12px; opacity: 0.5; }
.date-edit-wrap { display: inline-flex; align-items: center; gap: 6px; }
.date-input {
  padding: 4px 8px; border: 2px solid #2563eb; border-radius: 6px;
  font-size: 13px; font-weight: 600; outline: none; background: #eff6ff;
}

.column-manager {
  margin: 0 0 12px 0; padding: 12px 14px;
  background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px;
}
.column-manager-title {
  font-size: 12px; font-weight: 700; color: #334155;
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}
.column-manager-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.column-manager-item {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; background: #fff; border: 1px solid #cbd5e1;
  border-radius: 6px; font-size: 12px; cursor: pointer;
}
.column-manager-item.is-hidden { background: #f8fafc; color: #94a3b8; border-style: dashed; }
.column-manager-item.is-empty { border-color: #fcd34d; background: #fffbeb; }
.column-manager-item.is-locked { background: #e2e8f0; cursor: default; }
.column-manager-lock-data, .column-manager-empty {
  font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 700;
}
.column-manager-lock-data { background: #cbd5e1; color: #334155; }
.column-manager-empty { background: #fef3c7; color: #92400e; }
.column-manager-remove {
  background: transparent; border: none; color: #dc2626;
  font-size: 12px; font-weight: 900; cursor: pointer; padding: 0 2px;
}
.column-manager-actions { display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
.column-manager-add { display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  padding-top: 10px; border-top: 1px dashed #cbd5e1; }
.column-manager-add-label { font-size: 12px; font-weight: 700; color: #334155; }
.column-manager-select, .column-manager-input {
  flex: 1; min-width: 220px; padding: 6px 10px;
  border: 1px solid #cbd5e1; border-radius: 6px;
  font-size: 12px; background: #fff; outline: none;
}

.merge-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin: 0 0 12px 0;
  background: #fef3c7; border: 1px solid #fcd34d;
  border-radius: 8px; font-size: 12px; flex-wrap: wrap;
}
.merge-bar-info { color: #78350f; white-space: nowrap; }
.merge-hint { color: #a16207; font-style: italic; margin-left: 4px; }
.merge-groups-info { color: #166534; margin-left: auto; white-space: nowrap; }
.btn-merge-apply, .btn-merge-clear {
  font-size: 12px; padding: 6px 12px; border-radius: 4px;
  border: 1px solid transparent; cursor: pointer; font-weight: 600;
}
.btn-merge-apply { background: #d97706; color: #fff; }
.btn-merge-apply:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; }
.btn-merge-clear { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
.btn-merge-clear:disabled { opacity: 0.5; cursor: not-allowed; }

.items-table {
  width: 100%; border-collapse: collapse; margin-bottom: 25px;
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  font-size: 15px; table-layout: fixed;
}
.items-table th, .items-table td {
  border: 1px solid #7f7f7f; padding: 10px 6px;
  text-align: center; height: 36px;
  word-wrap: break-word; vertical-align: middle;
}
.items-table th {
  background-color: #c8c8c8; font-weight: 800;
  font-size: 16.5px; letter-spacing: 0.4px; padding: 12px 6px;
}
.items-table td.text-left { text-align: left; padding-left: 8px; }
.font-bold { font-weight: 700; }
.no-items { padding: 20px !important; color: #7f7f7f; font-style: italic; }
.spec-cell { font-size: 14.5px; line-height: 1.4; }

.row-number-cell { position: relative; padding: 4px !important; width: 44px; }
.row-number-inner {
  display: flex; align-items: center; justify-content: center;
  gap: 4px; position: relative;
}
.row-number-text { font-weight: 700; color: #0f172a; font-size: 14px; }
.row-trash {
  position: absolute; right: -2px;
  background: transparent; border: none;
  color: #94a3b8; font-size: 11px; cursor: pointer; padding: 0 2px;
  opacity: 0; transition: opacity 0.15s, color 0.15s;
}
.items-table tr:hover .row-trash { opacity: 1; }
.row-trash:hover { color: #dc2626; }

.draft-row td {
  background: #f8fafc;
  border-style: dashed !important;
  border-color: #94a3b8 !important;
}
.draft-number-cell { text-align: center; padding: 4px 4px !important; }
.row-add-plus {
  width: 30px; height: 30px; border-radius: 8px;
  background: #2563eb; color: #ffffff; border: none;
  font-size: 16px; font-weight: 900; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.1s;
}
.row-add-plus:hover:not(:disabled) { background: #1d4ed8; }
.row-add-plus:active:not(:disabled) { transform: scale(0.94); }
.row-add-plus:disabled { opacity: 0.4; cursor: not-allowed; }

.draft-item-cell { padding: 4px 6px !important; position: relative; }
.draft-item-picker { position: relative; }
.draft-search-wrap { position: relative; display: flex; align-items: center; }
.draft-search-icon {
  position: absolute; left: 10px; font-size: 12px; color: #94a3b8;
  pointer-events: none;
}
.draft-search-input {
  width: 100%; padding: 7px 30px 7px 30px;
  border: 1px solid #cbd5e1; border-radius: 6px;
  font-size: 13px; background: #fff; outline: none; font-family: inherit;
}
.draft-search-input:focus {
  border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.draft-spinner { position: absolute; right: 10px; font-size: 12px; }

.draft-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 520px;
  max-width: 720px;
  max-height: 340px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
  z-index: 100;
  padding: 6px;
}
.draft-option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.35;
  border: 1px solid transparent;
}
.draft-option + .draft-option { margin-top: 2px; }
.draft-option:hover { background: #eff6ff; border-color: #bfdbfe; }
.draft-option-code {
  font-family: monospace; font-size: 11px; font-weight: 700;
  color: #1d4ed8; background: #eff6ff;
  padding: 2px 7px; border-radius: 4px;
  align-self: start; white-space: nowrap;
}
.draft-option-name {
  color: #0f172a; font-weight: 500;
  word-break: break-word; white-space: normal;
  overflow: visible; text-overflow: clip;
  min-width: 0;
}
.draft-option-uom {
  font-size: 11px; color: #64748b; font-weight: 600;
  white-space: nowrap; align-self: start;
}
.draft-option-more {
  display: block; text-align: center;
  color: #2563eb; font-weight: 700; background: #f8fafc;
  margin-top: 4px; padding: 8px; border-radius: 6px;
  cursor: pointer; font-size: 12px;
}
.draft-option-more:hover { background: #eff6ff; }

.draft-no-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 520px;
  max-width: 720px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
  font-size: 12.5px;
  color: #64748b;
  font-style: italic;
  z-index: 100;
}

.draft-picked {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 6px 8px; background: #fff;
  border: 1px solid #cbd5e1; border-radius: 6px;
}
.draft-picked-clear {
  margin-left: auto; background: transparent; border: none;
  color: #94a3b8; cursor: pointer; font-size: 12px; padding: 0 4px;
}
.draft-picked-clear:hover { color: #dc2626; }

.empty-hint-row td {
  background: transparent; border: none !important;
  text-align: center; font-style: italic; color: #94a3b8;
  padding: 12px !important;
}

.cell-input {
  width: 100%; padding: 4px 6px; border: none;
  background: transparent; text-align: center;
  font-size: 12px; outline: none; border-radius: 4px;
}
.cell-input:hover { background: #f8fafc; }
.cell-input:focus { background: #eff6ff; box-shadow: inset 0 0 0 2px #2563eb; }
.cell-select {
  width: 100%; padding: 4px 6px; border: none;
  background: transparent; text-align: center;
  font-size: 12px; font-weight: 600; outline: none; cursor: pointer;
}
.cell-select:hover { background: #f8fafc; }
.cell-print { display: none; }
.cell-print-inline {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.qty-input {
  width: 100%; padding: 4px 6px; border: none;
  background: transparent; text-align: center;
  font-size: 13px; font-weight: 700; color: #0f172a; outline: none;
  border-radius: 4px; font-family: inherit;
}
.qty-input:hover { background: #f8fafc; }
.qty-input:focus { background: #eff6ff; box-shadow: inset 0 0 0 2px #2563eb; }
.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button { opacity: 0.4; height: 18px; }

.grand-total-row td {
  background: #e5e7eb !important;
  font-weight: 800; border-color: #7f7f7f !important; height: 40px;
}
.grand-total-label-cell, .grand-total-value-cell,
.grand-total-spacer-cell { background: #e5e7eb !important; }
.grand-total-label-cell {
  text-align: center !important; font-weight: 900;
  letter-spacing: 0.6px; color: #111827; font-size: 15px;
}
.grand-total-value { font-weight: 900; font-size: 16px; color: #111827; }

.custom-cell { padding: 2px !important; }
.custom-cell-editor {
  min-height: 26px; padding: 5px 6px; border-radius: 4px;
  outline: none; font-size: 14.5px; text-align: center;
  word-break: break-word; white-space: pre-wrap; cursor: text;
}
.custom-cell-editor:empty::before {
  content: attr(data-placeholder); color: #cbd5e1; font-style: italic;
}
.custom-cell-editor:hover { background: #f8fafc; outline: 1px dashed #cbd5e1; }
.custom-cell-editor:focus { background: #eff6ff; outline: 2px solid #2563eb; }
.custom-cell-print { display: none; }
.computed-cell { background: #f8fafc !important; }
.computed-value { font-weight: 700; color: #0f172a; font-size: 14.5px; }

.remark-cell {
  padding: 8px !important; font-size: 14.5px; line-height: 1.4;
  vertical-align: middle; word-break: break-word;
}
.merged-remark-cell {
  background: #fff; vertical-align: middle !important;
  border-top: none !important; border-bottom: none !important;
}
.merged-remark-content {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px; padding: 4px;
  min-height: 100%; text-align: center;
}
.merged-remark-text { font-size: 14.5px; line-height: 1.4; color: #000; text-align: center; }
.row-merged-absorbed td { background: #fafafa; }
.btn-unmerge {
  font-size: 11.5px; padding: 3px 8px; background: #fee2e2;
  color: #991b1b; border: 1px solid #fca5a5; border-radius: 3px;
  cursor: pointer; font-weight: 600; margin-top: 2px;
}

.meta-grid { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 25px; }
.meta-col { flex: 1; }
.block-header {
  background-color: #d9d9d9; border: none;
  padding: 5px; font-weight: bold; font-size: 14px;
}
.text-center { text-align: center; }
.block-body {
  padding: 12px 4px;
  font-size: 13px;
  min-height: 80px;
  border: none;
}
.dept-body { display: flex; align-items: center; justify-content: center; min-height: 80px; }
.dept-display {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 8px; cursor: pointer;
  outline: 1px dashed transparent;
}
.dept-display:hover { background: #f1f5f9; outline-color: #cbd5e1; }
.dept-value { font-size: 20px; font-weight: 600; text-align: center; }
.dept-edit-pencil { font-size: 14px; opacity: 0.5; }
.dept-edit-wrap { display: flex; flex-direction: column; gap: 8px; width: 100%; align-items: center; }
.dept-input {
  width: 100%; max-width: 260px; padding: 8px 12px;
  border: 2px solid #2563eb; border-radius: 8px;
  font-size: 16px; font-weight: 600; text-align: center;
  outline: none; background: #eff6ff;
}

.workflow-body p {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: nowrap;
}

.name-line,
.approved-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: nowrap;
}

.inline-name-input {
  flex: 1;
  min-width: 100px;
  border: none;
  border-bottom: 1px dashed #cbd5e1;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 6px;
  outline: none;
  font-family: inherit;
  display: inline-block;
  vertical-align: baseline;
}
.inline-name-input:focus {
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.approved-name-editor {
  display: inline-block;
  flex: 1;
  min-width: 100px;
  min-height: 20px;
  padding: 2px 6px;
  border-radius: 4px;
  outline: none;
  font-size: 13px;
  font-weight: 500;
  cursor: text;
  border-bottom: 1px dashed transparent;
  vertical-align: baseline;
}
.approved-name-editor:empty::before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  font-style: italic;
}
.approved-name-editor:hover {
  background: #f8fafc;
  border-bottom-color: #cbd5e1;
}
.approved-name-editor:focus {
  background: #eff6ff;
  outline: 2px solid #2563eb;
}
.approved-name-print { display: none; }

.footer-sections { display: flex; flex-direction: column; gap: 15px; }
.input-row {
  display: flex; width: 100%;
  border: 1px solid #7f7f7f; border-radius: 6px; overflow: hidden;
}
.input-row.short-width { width: 65%; }
.gray-label {
  background-color: #d9d9d9; color: #000; font-weight: bold;
  width: 220px; display: flex; align-items: center;
  justify-content: center; font-size: 13px;
  min-height: 46px; padding: 10px 12px; text-align: center; flex-shrink: 0;
}
.lines-container { flex-grow: 1; background-color: #fff; min-height: 46px; }
.reason-textarea {
  width: 100%; border: none; padding: 10px 12px;
  font-size: 13px; font-family: inherit; resize: vertical;
  outline: none; min-height: 80px; line-height: 1.5; background: #fff;
}
.write-line { height: 22px; border-bottom: 1px solid #7f7f7f; background: #fff; }
.write-line:last-child { border-bottom: none; background: #f9f9f9; }
.checked-by-section { display: flex; flex-direction: column; align-items: flex-start; }
.inline-label { width: 220px; padding: 4px 0; text-align: center; margin-bottom: 10px; }
.checked-by-body { font-size: 13px; padding-left: 2px; }
.checked-by-body p { margin: 6px 0; }

.form-errors { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.form-error {
  background: #fee2e2; color: #991b1b; padding: 6px 12px;
  border-radius: 6px; font-size: 12px; border: 1px solid #fecaca;
}

/* ================================================================
   VALIDATION MODAL
   ================================================================ */
.val-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.val-modal {
  background: #ffffff;
  border-radius: 14px;
  width: 720px;
  max-width: 100%;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
}

.val-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}

.val-modal-title-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.val-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.val-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #991b1b;
  letter-spacing: -0.2px;
}

.val-modal-header p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: #7f1d1d;
  line-height: 1.4;
}

.val-modal-close {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 7px;
  color: #b91c1c;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.val-modal-close:hover { background: rgba(255, 255, 255, 0.7); }

.val-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1 1 auto;
}

.val-error-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.val-error-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 14px 16px;
}

.val-error-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.val-error-icon { font-size: 14px; flex-shrink: 0; }
.val-error-name { font-size: 13px; color: #1e293b; }
.val-error-code {
  color: #64748b;
  margin-left: 4px;
  font-family: monospace;
  font-size: 11.5px;
}
.val-error-qty {
  font-size: 11px;
  color: #64748b;
  background: #fff;
  padding: 1px 8px;
  border-radius: 8px;
  margin-left: auto;
}

.val-error-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #334155;
  margin-bottom: 8px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 8px;
}
.val-error-context-label {
  font-weight: 700;
  color: #94a3b8;
  margin-right: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 10px;
}
.val-error-arrow {
  color: #94a3b8;
  font-size: 14px;
  margin: 0 2px;
}
.val-error-requester {
  margin-left: auto;
}

.val-error-math {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #64748b;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 6px;
}
.val-error-math-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.val-error-math-label {
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 10px;
}
.val-error-math-item strong {
  color: #0f172a;
  font-weight: 700;
}
.val-error-math-divider {
  color: #cbd5e1;
  font-weight: 700;
}
.val-error-math-highlight strong {
  color: #dc2626;
}

/* ✅ Open Requests table */
.val-error-table-block {
  margin-top: 10px;
}
.val-error-table-block + .val-error-table-block {
  margin-top: 14px;
}
.val-error-table-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #991b1b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.val-error-table-wrapper {
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 8px;
  overflow: hidden;
}
.val-error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.val-error-table thead th {
  background: #fef2f2;
  color: #7f1d1d;
  text-align: left;
  padding: 8px 10px;
  font-weight: 700;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #fecaca;
}
.val-error-table tbody td {
  padding: 8px 10px;
  border-bottom: 1px solid #fef2f2;
  color: #334155;
  vertical-align: middle;
}
.val-error-table tbody tr:last-child td {
  border-bottom: none;
}
.val-error-table .text-right { text-align: right; }
.val-error-code-cell {
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 11px;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
.val-error-qty-cell {
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}
.val-error-status-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 10px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}
.val-error-status-badge.pending { background: #fef3c7; color: #92400e; }
.val-error-status-badge.approved { background: #dbeafe; color: #1e40af; }
.val-error-status-badge.rejected { background: #fee2e2; color: #991b1b; }
.val-error-status-badge.finalized { background: #dcfce7; color: #166534; }

/* Temelash table variant */
.temelash-block .val-error-table thead th {
  background: #fff7ed;
  color: #9a3412;
  border-bottom-color: #fed7aa;
}
.temelash-block .val-error-table-wrapper {
  border-color: #fed7aa;
}
.temelash-block .val-error-table tbody td {
  border-bottom-color: #ffedd5;
}

.val-error-message {
  font-size: 12.5px;
  color: #7f1d1d;
  line-height: 1.5;
  padding-left: 22px;
  margin-top: 4px;
}

.val-error-groups,
.val-error-balances {
  margin-top: 8px;
  padding-left: 22px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.val-error-groups-label,
.val-error-balances-label {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #991b1b;
}

.val-error-group-chip,
.val-error-balance-chip {
  font-size: 11.5px;
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.val-error-balance-chip {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.val-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.val-modal-btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.val-modal-btn-secondary:hover { background: #e2e8f0; }

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .val-modal {
  animation: val-modal-in 0.22s cubic-bezier(.4,0,.2,1);
}
@keyframes val-modal-in {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.loading-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 200px;
}
.spinner {
  border: 4px solid #f3f4f6; border-top: 4px solid #2563eb;
  border-radius: 50%; width: 35px; height: 35px;
  animation: spin 1s linear infinite; margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media print {
  .no-print { display: none !important; }
  .page-layout { display: block !important; padding: 0 !important; }
  .side-panel { display: none !important; }
  .print-page {
    max-width: 100% !important; padding: 10px !important;
    margin: 0 !important; border: none !important; box-shadow: none !important;
  }
  .cell-input, .cell-select { display: none !important; }
  .cell-print { display: inline !important; }
  .cell-print-inline { display: inline !important; }
  .row-number-cell .row-trash { display: none !important; }
  .items-table th {
    background-color: #c0c0c0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .gray-label, .block-header {
    background-color: #d9d9d9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .inline-name-input { display: none !important; }
  .approved-name-print { display: inline !important; }
  .val-modal-backdrop { display: none !important; }
}

@media (max-width: 768px) {
  .top-actions { flex-direction: column; gap: 8px; }
  .top-actions-right { width: 100%; flex-wrap: wrap; }
  .print-page { padding: 14px; }
  .meta-grid { flex-direction: column; gap: 12px; }
  .input-row, .input-row.short-width { width: 100%; }
  .gray-label { width: 100px; font-size: 11px; }
  .items-table { font-size: 11px; }
  .items-table th, .items-table td { padding: 4px 3px; font-size: 11px; }
  .motto { font-size: 15px; }
  .company-name { font-size: 16px; }
  .form-subtitle-title { font-size: 12px; }
}
</style>