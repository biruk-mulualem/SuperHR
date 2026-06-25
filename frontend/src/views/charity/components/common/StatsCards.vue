<template>
  <div class="sc-grid" :style="gridStyle">

    <!--
      MODE A — data-driven (pass :cards array)
      Each card: { label, value, icon?, color?, format? }
    -->
    <template v-if="cards.length">
      <div
        v-for="(card, i) in cards"
        :key="i"
        class="sc-card"
        :class="card.class"
      >
        <!-- Icon area -->
        <div
          class="sc-icon"
          :style="{ background: card.color || defaultColors[i % defaultColors.length] }"
        >
          <!-- Named slot per card: #icon-{i} or #icon-{card.key} -->
          <slot
            v-if="card.key && $slots[`icon-${card.key}`]"
            :name="`icon-${card.key}`"
          />
          <slot
            v-else-if="$slots[`icon-${i}`]"
            :name="`icon-${i}`"
          />
          <!-- Inline SVG string passed via card.icon -->
          <span v-else-if="card.icon" v-html="card.icon" class="sc-icon-inner" />
          <!-- Fallback icon -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" class="sc-icon-svg">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="sc-content">
          <span class="sc-label">{{ card.label }}</span>
          <span class="sc-value">{{ displayValue(card) }}</span>
          <!-- Optional sub-text / trend -->
          <span v-if="card.sub" class="sc-sub" :class="card.subClass">{{ card.sub }}</span>
        </div>
      </div>
    </template>

    <!--
      MODE B — fully slotted
      Use when you need complete custom markup per card.
      <StatsCards :cols="4">
        <template #default>
          <div class="sc-card"> … </div>
          <div class="sc-card"> … </div>
        </template>
      </StatsCards>
    -->
    <slot v-else />

  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Array of card definitions:
   * {
   *   key?:    string,             // used for named icon slots (#icon-{key})
   *   label:   string,
   *   value:   number | string,
   *   icon?:   string,             // raw SVG HTML string
   *   color?:  string,             // icon background e.g. '#3b82f6'
   *   format?: 'currency' | 'number' | 'percent' | null,
   *   sub?:    string,             // small sub-text below value
   *   subClass?: string,           // e.g. 'sc-sub--up' / 'sc-sub--down'
   *   class?:  string,             // extra class on the card wrapper
   * }
   *
   * Leave empty to use the default slot (MODE B).
   */
  cards: {
    type: Array,
    default: () => [],
  },
  /** Number of columns in the grid (default: auto-fit minmax 200px) */
  cols: {
    type: Number,
    default: null,
  },
  /** Min card width when cols is not set */
  minCardWidth: {
    type: String,
    default: '200px',
  },
});

// ── Default icon background palette (same vibe as existing cards) ─────────────
const defaultColors = [
  '#6a11cb',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

// ── Grid style ────────────────────────────────────────────────────────────────
const gridStyle = computed(() =>
  props.cols
    ? { gridTemplateColumns: `repeat(${props.cols}, 1fr)` }
    : { gridTemplateColumns: `repeat(auto-fit, minmax(${props.minCardWidth}, 1fr))` }
);

// ── Value formatter ───────────────────────────────────────────────────────────
function displayValue(card) {
  const v = card.value;
  if (v === null || v === undefined) return '—';
  if (card.format === 'currency') {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  }
  if (card.format === 'number') {
    return new Intl.NumberFormat('en-ET').format(v);
  }
  if (card.format === 'percent') {
    return `${Number(v).toFixed(1)}%`;
  }
  return v;
}
</script>

<style scoped>
/* Grid */
.sc-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

/* Card */
.sc-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}
.sc-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
  transform: translateY(-1px);
}

/* Icon */
.sc-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6a11cb;
}
.sc-icon-svg { width: 24px; height: 24px; }
.sc-icon-inner { display: flex; align-items: center; justify-content: center; }
.sc-icon-inner :deep(svg) { width: 24px; height: 24px; }

/* Content */
.sc-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.sc-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.sc-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}
.sc-sub--up   { color: #15803d; }
.sc-sub--down { color: #b91c1c; }

@media (max-width: 768px) {
  .sc-grid { grid-template-columns: 1fr 1fr !important; }
  .sc-value { font-size: 22px; }
}
@media (max-width: 480px) {
  .sc-grid { grid-template-columns: 1fr !important; }
}
</style>
