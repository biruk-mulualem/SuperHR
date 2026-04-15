<template>
  <div class="filters-bar">
    <div class="search-box">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input 
        type="text" 
        :value="filters.search"
        @input="$emit('update:filters', { search: $event.target.value })"
        placeholder="Search users..."
        class="search-input"
      />
    </div>
    
    <div class="filter-group">
      <select :value="filters.role" @change="$emit('update:filters', { role: $event.target.value })" class="filter-select">
        <option value="">All Roles</option>
        <option v-for="role in roles" :key="role.roleId" :value="role.name">
          {{ capitalize(role.name) }}
        </option>
      </select>
      
      <select :value="filters.department" @change="$emit('update:filters', { department: $event.target.value })" class="filter-select">
        <option value="">All Depts</option>
        <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
          {{ dept.name }}
        </option>
      </select>
      
      <select :value="filters.status" @change="$emit('update:filters', { status: $event.target.value })" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      
      <select :value="filters.sortBy" @change="$emit('update:filters', { sortBy: $event.target.value })" class="filter-select">
        <option value="created_at">Sort by Created</option>
        <option value="lastLogin">Sort by Last Login</option>
        <option value="fullName">Sort by Name</option>
        <option value="username">Sort by Username</option>
      </select>
      
      <button class="btn-clear" @click="$emit('clear-filters')">
        <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: {
    type: Object,
    default: () => ({})
  },
  roles: {
    type: Array,
    default: () => []
  },
  departments: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:filters', 'clear-filters'])

const capitalize = (value) => {
  if (!value) return ''
  if (value.toLowerCase() === 'hr') return 'HR'
  return value.charAt(0).toUpperCase() + value.slice(1)
}
</script>

<style scoped>
.filters-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box { flex: 1; position: relative; min-width: 180px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 12px 10px 36px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; }

.filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-select { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; font-size: 13px; cursor: pointer; }
.btn-clear { padding: 10px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; display: flex; align-items: center; }
.btn-icon-small { width: 14px; height: 14px; }

@media (max-width: 768px) {
  .filters-bar { flex-direction: column; }
  .search-box { min-width: 100%; }
  .filter-group { width: 100%; }
  .filter-select { flex: 1; }
}
</style>