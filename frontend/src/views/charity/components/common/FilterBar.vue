<template>
  <div class="fb-bar">

    <!-- Search -->
    <div v-if="showSearch" class="fb-search">
      <svg class="fb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="localSearch"
        type="text"
        :placeholder="searchPlaceholder"
        class="fb-search-input"
        @input="onSearchInput"
      />
      <button v-if="localSearch" class="fb-search-clear" @click="clearSearch" title="Clear search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Built-in status filter (opt-in via :statusOptions) -->
    <select
      v-if="statusOptions.length"
      v-model="localStatus"
      class="fb-select"
      @change="emit('update:status', localStatus)"
    >
      <option value="">{{ statusAllLabel }}</option>
      <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <!--
      Extra filters slot — drop any <select>, <input>, date-picker etc. here.
      They live inside the same flex row.
      Usage:
        <FilterBar ...>
          <template #filters>
            <select v-model="myFilter" class="fb-select">…</select>
          </template>
        </FilterBar>
    -->
    <slot name="filters" />

    <!-- Right side slot — e.g. a "New" button, export button -->
    <div class="fb-actions">
      <slot name="actions" />

      <!-- Clear button — always last -->
      <button v-if="showClear" class="fb-clear" @click="clearAll">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fb-icon">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        {{ clearLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  /** Controlled search string (use v-model:search) */
  search: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search…',
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  /**
   * Pass an array of { value, label } to get a built-in status <select>.
   * Leave empty [] to hide it and use the #filters slot instead.
   */
  statusOptions: {
    type: Array,
    default: () => [],
  },
  /** Controlled status value (use v-model:status) */
  status: {
    type: String,
    default: '',
  },
  statusAllLabel: {
    type: String,
    default: 'All Statuses',
  },
  showClear: {
    type: Boolean,
    default: true,
  },
  clearLabel: {
    type: String,
    default: 'Clear',
  },
  /** Debounce delay in ms for the search input */
  debounce: {
    type: Number,
    default: 300,
  },
});

const emit = defineEmits([
  'update:search',
  'update:status',
  'clear',
]);

// ── Local state mirrors props (so this works with or without v-model) ─────────

const localSearch = ref(props.search);
const localStatus = ref(props.status);

watch(() => props.search, v => { localSearch.value = v; });
watch(() => props.status, v => { localStatus.value = v; });

// ── Debounced search ──────────────────────────────────────────────────────────

let debounceTimer = null;

function onSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('update:search', localSearch.value);
  }, props.debounce);
}

function clearSearch() {
  localSearch.value = '';
  emit('update:search', '');
}

function clearAll() {
  localSearch.value = '';
  localStatus.value = '';
  emit('update:search', '');
  emit('update:status', '');
  emit('clear');
}
</script>

<style scoped>
.fb-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: white;
  padding: 14px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

/* Search */
.fb-search {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.fb-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: #94a3b8;
  pointer-events: none;
}
.fb-search-input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #334155;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.fb-search-input:focus { border-color: #6a11cb; }
.fb-search-input::placeholder { color: #94a3b8; }

.fb-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.fb-search-clear:hover { color: #334155; }
.fb-search-clear svg { width: 13px; height: 13px; }

/* Select */
.fb-select {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  min-width: 140px;
  outline: none;
  transition: border-color 0.2s;
}
.fb-select:focus { border-color: #6a11cb; }

/* Actions area */
.fb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* Clear button */
.fb-clear {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  transition: background 0.15s;
  white-space: nowrap;
}
.fb-clear:hover { background: #e2e8f0; }
.fb-icon { width: 14px; height: 14px; }

@media (max-width: 600px) {
  .fb-search { min-width: 100%; }
  .fb-actions { margin-left: 0; }
}
</style>
