<!-- views/storemanagement/storebalance/ReturnAndwestLeWest.vue -->
<template>
  <div class="tabs-page">
    <!-- ============ TAB BAR — 50/50 split ============ -->
    <div class="tabs-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'return' }]"
        @click="activeTab = 'return'"
      >
        ↩️ Return
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'wust-lewust' }]"
        @click="activeTab = 'wust-lewust'"
      >
        🔁 ውስጥ ለውስጥ
      </button>
    </div>

    <!-- ============ TAB CONTENT ============ -->
    <div class="tabs-content">
      <KeepAlive>
        <component :is="activeComponent" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue';
import ReturnTab from './ReturnTab.vue';
import WustLeWustTab from './WustLeWustTab.vue';

const activeTab = ref('return');

const returnComp = shallowRef(ReturnTab);
const wustComp = shallowRef(WustLeWustTab);

const activeComponent = computed(() =>
  activeTab.value === 'return' ? returnComp.value : wustComp.value
);
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.tabs-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ================================================================
   TAB BAR — full width, each button 50%
   ================================================================ */
.tabs-bar {
  display: flex;
  width: 100%;
  background: #ffffff;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;                 /* 👈 light border on the bar */
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  gap: 4px;
  box-sizing: border-box;
}

.tab-btn {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;                 /* 👈 light border on each button */
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.tab-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;                     /* 👈 slightly darker border on hover */
  color: #1e293b;
}

.tab-btn.active {
  background: #16a34a;
  border-color: #15803d;                     /* 👈 darker green border to match active bg */
  color: #ffffff;
}

.tab-btn.active:hover {
  background: #15803d;
  border-color: #166534;
  color: #ffffff;
}

/* ================================================================
   CONTENT
   ================================================================ */
.tabs-content {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 640px) {
  .tabs-page { padding: 12px 8px; }

  .tab-btn {
    padding: 10px 12px;
    font-size: 12.5px;
  }
}
</style>