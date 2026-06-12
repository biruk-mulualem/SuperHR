# Common Charity Components — Usage Guide

All three components live in `components/common/`.  
Import them wherever you need:

```js
import ListTable   from '@/views/charity/components/common/ListTable.vue';
import FilterBar   from '@/views/charity/components/common/FilterBar.vue';
import StatsCards  from '@/views/charity/components/common/StatsCards.vue';
```

---

## ListTable

### Minimal (columns + rows only)
```vue
<ListTable
  :columns="[
    { key: 'beneficiaryId', label: 'ID' },
    { key: 'name',          label: 'Name' },
    { key: 'type',          label: 'Type',   format: 'badge' },
    { key: 'isActive',      label: 'Active', format: 'boolean' },
  ]"
  :rows="beneficiaries"
  row-key="beneficiaryId"
/>
```

### With actions slot + pagination + sorting
```vue
<ListTable
  :columns="columns"
  :rows="rows"
  row-key="donationId"
  :pagination="pagination"
  @page-change="page = $event"
  @sort-change="onSort"
>
  <template #actions="{ row }">
    <button class="action-btn view" @click="viewDonation(row)">…</button>
    <button v-if="row.status === 'draft'" class="action-btn edit" @click="editDonation(row)">…</button>
  </template>
</ListTable>
```

### Custom cell render (slot per column key)
```vue
<ListTable :columns="columns" :rows="rows" row-key="teamId">
  <!-- Override just the 'members' cell -->
  <template #cell-members="{ value }">
    <span class="members-pill">{{ value.length }} members</span>
  </template>

  <!-- Override the 'head' cell with a linked name -->
  <template #cell-head="{ row }">
    <router-link :to="`/employees/${row.head?.employeeId}`">
      {{ row.head?.firstName }} {{ row.head?.lastName }}
    </router-link>
  </template>
</ListTable>
```

### With bulk selection
```vue
<ListTable
  :columns="columns"
  :rows="rows"
  row-key="requestId"
  :selectable="true"
  @selection-change="selectedIds = $event"
>
  <template #bulk-actions="{ selected }">
    <button @click="bulkApprove(selected)">Approve All</button>
  </template>
</ListTable>
```

### Column definition reference
```js
const columns = [
  { key: 'donationId',        label: 'ID',          width: '60px' },
  { key: 'team.name',         label: 'Team' },                        // dot-notation ✓
  { key: 'totalValueInBirr',  label: 'Total',       format: 'currency', sortable: true },
  { key: 'donationDeliveryDate', label: 'Date',     format: 'date' },
  { key: 'status',            label: 'Status',      format: 'badge',
    badgeLabel: (v) => v.charAt(0).toUpperCase() + v.slice(1) },
  { key: 'isDelivered',       label: 'Delivered',   format: 'boolean',
    trueLabel: 'Yes', falseLabel: 'No' },
  { key: 'creator.fullName',  label: 'Created By',  fallback: 'N/A' },
  {
    key: 'quantity',
    label: 'Qty',
    render: (val, row) =>
      `<span style="font-weight:600">${val ?? '—'}</span> ${row.type === 'money' ? 'ETB' : 'units'}`,
  },
];
```

---

## FilterBar

### Simple search only
```vue
<FilterBar
  v-model:search="filters.search"
  search-placeholder="Search beneficiaries…"
  :show-clear="false"
/>
```

### Search + built-in status select
```vue
<FilterBar
  v-model:search="filters.search"
  v-model:status="filters.status"
  :status-options="[
    { value: 'draft',     label: 'Draft' },
    { value: 'pending',   label: 'Pending' },
    { value: 'approved',  label: 'Approved' },
    { value: 'cancelled', label: 'Cancelled' },
  ]"
  @clear="resetFilters"
/>
```

### Extra selects via #filters slot + action button in #actions slot
```vue
<FilterBar
  v-model:search="filters.search"
  search-placeholder="Search donations…"
  @clear="resetFilters"
>
  <template #filters>
    <select v-model="filters.teamId" class="fb-select" @change="loadData">
      <option value="">All Teams</option>
      <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
    </select>

    <input type="date" v-model="filters.fromDate" class="fb-select" @change="loadData" />
  </template>

  <template #actions>
    <button class="btn-primary" @click="$router.push('/charity/donations/create')">
      + New Donation
    </button>
  </template>
</FilterBar>
```

---

## StatsCards

### Data-driven (recommended)
```vue
<StatsCards :cards="[
  { key: 'total',     label: 'Total Beneficiaries', value: stats.total,    format: 'number'   },
  { key: 'active',    label: 'Active',              value: stats.active,   color: '#10b981'   },
  { key: 'value',     label: 'Total Value',         value: stats.value,    format: 'currency' },
  { key: 'pending',   label: 'Pending Requests',    value: stats.pending,  color: '#f59e0b'   },
]" />
```

### With custom icons per card (named slot `#icon-{key}`)
```vue
<StatsCards :cards="cards">
  <template #icon-total>
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5">
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372…" />
    </svg>
  </template>
  <template #icon-value>
    <svg …/>
  </template>
</StatsCards>
```

### Fully custom cards (slot mode)
```vue
<StatsCards :cols="3">
  <div class="sc-card">
    <div class="sc-icon" style="background:#6a11cb">…</div>
    <div class="sc-content">
      <span class="sc-label">My Custom Card</span>
      <span class="sc-value">42</span>
    </div>
  </div>
</StatsCards>
```
