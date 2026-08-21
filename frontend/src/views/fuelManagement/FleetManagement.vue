<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🚗 Vehicle Registration</h2>
        <span class="total-badge">{{ vehicles.length }} Vehicles</span>
      </div>

      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search vehicles..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="toggleAddForm">
          {{ showAddForm ? '✕ Close' : '➕ Register' }}
        </button>
      </div>
    </div>

    <!-- ==================== ADD/EDIT FORM (COLLAPSIBLE) ==================== -->
    <div v-if="showAddForm" class="form-panel">
      <div class="form-panel-header">
        <h3>{{ isEditing ? '✏️ Edit Vehicle' : '🚗 Register New Vehicle' }}</h3>
        <button class="form-close" @click="closeForm">✕</button>
      </div>

      <form @submit.prevent="saveVehicle" class="form-grid-layout">
        <div class="form-column">
          <div class="form-group">
            <label>Plate Number *</label>
            <input type="text" v-model="form.plateNumber" placeholder="AA-1234" required />
          </div>
          <div class="form-group">
            <label>Model *</label>
            <input type="text" v-model="form.model" placeholder="Hilux" required />
          </div>
          <div class="form-group">
            <label>Brand</label>
            <input type="text" v-model="form.brand" placeholder="Toyota" />
          </div>
          <div class="form-group">
            <label>Year</label>
            <input type="number" v-model="form.year" placeholder="2020" min="2000" max="2030" />
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="text" v-model="form.color" placeholder="White" />
          </div>
          <div class="form-group">
            <label>Fuel Type</label>
            <select v-model="form.fuelType">
              <option value="petrol">⛽ Petrol</option>
              <option value="diesel">⛽ Diesel</option>
              <option value="electric">⚡ Electric</option>
              <option value="hybrid">🔋 Hybrid</option>
            </select>
          </div>
        </div>

        <div class="form-column">
          <div class="form-group">
            <label>Current Mileage (km)</label>
            <input type="number" v-model="form.currentMileage" placeholder="0" min="0" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status">
              <option value="active">✅ Active</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="inactive">📋 Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label>Owner/Company</label>
            <input type="text" v-model="form.owner" placeholder="Owner or company name" />
          </div>
          <div class="form-group">
            <label>Owner Phone</label>
            <input type="text" v-model="form.ownerPhone" placeholder="+251 9XX XXX XXX" />
          </div>
          <div class="form-group">
            <label>Assigned Driver</label>
            <input type="text" v-model="form.driver" placeholder="Driver name" />
          </div>
          <div class="form-group">
            <label>Driver Phone</label>
            <input type="text" v-model="form.driverPhone" placeholder="+251 9XX XXX XXX" />
          </div>
        </div>

        <div class="form-column">
          <div class="form-group">
            <label>Responsible Person</label>
            <input type="text" v-model="form.responsiblePerson" placeholder="Name of responsible person" />
          </div>
          <div class="form-group">
            <label>Responsible Phone</label>
            <input type="text" v-model="form.responsiblePhone" placeholder="+251 9XX XXX XXX" />
          </div>
          <div class="form-group">
            <label>VIN / Chassis</label>
            <input type="text" v-model="form.vin" placeholder="Vehicle Identification Number" />
          </div>
          <div class="form-group">
            <label>Engine Number</label>
            <input type="text" v-model="form.engineNumber" placeholder="Engine number" />
          </div>
          <div class="form-group">
            <label>Insurance Policy</label>
            <input type="text" v-model="form.insurancePolicy" placeholder="Policy number" />
          </div>
          <div class="form-group">
            <label>Insurance Expiry</label>
            <input type="date" v-model="form.insuranceExpiry" />
          </div>
        </div>

        <div class="form-column">
          <div class="form-group">
            <label>Registration Certificate</label>
            <input type="text" v-model="form.registrationCertificate" placeholder="Certificate number" />
          </div>
          <div class="form-group">
            <label>Registration Expiry</label>
            <input type="date" v-model="form.registrationExpiry" />
          </div>
          <div class="form-group">
            <label>Purchase Date</label>
            <input type="date" v-model="form.purchaseDate" />
          </div>
          <div class="form-group">
            <label>Purchase Price (ETB)</label>
            <input type="number" v-model="form.purchasePrice" placeholder="0" min="0" />
          </div>
          <div class="form-group">
            <label>Supplier / Vendor</label>
            <input type="text" v-model="form.supplier" placeholder="Supplier name" />
          </div>
          <div class="form-group">
            <label>Department</label>
            <input type="text" v-model="form.department" placeholder="e.g., Administration" />
          </div>
        </div>

        <div class="form-notes">
          <label>📝 Notes</label>
          <textarea v-model="form.notes" rows="2" placeholder="Additional notes..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="closeForm">Cancel</button>
          <button type="submit" class="btn-primary">
            {{ isEditing ? '✏️ Update' : '✅ Register' }} Vehicle
          </button>
        </div>
      </form>
    </div>

    <!-- ==================== FILTER BAR ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="active">✅ Active</option>
        <option value="maintenance">🔧 Maintenance</option>
        <option value="inactive">📋 Inactive</option>
      </select>
      <select v-model="filterFuelType" class="filter-select" @change="onFilterChange">
        <option value="all">All Fuel</option>
        <option value="petrol">Petrol</option>
        <option value="diesel">Diesel</option>
        <option value="electric">Electric</option>
        <option value="hybrid">Hybrid</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== VEHICLES TABLE ==================== -->
    <div class="table-container">
      <table class="vehicle-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>Plate</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Responsible</th>
            <th>Fuel</th>
            <th>Status</th>
            <th style="width:80px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredVehicles.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🚗</span>
                <p>No vehicles found</p>
                <button class="btn-secondary" @click="toggleAddForm">Add First Vehicle</button>
              </div>
            </td>
          </tr>
          <template v-for="vehicle in filteredVehicles" :key="vehicle.id">
            <tr
              :class="{
                'expanded-row': expandedRow === vehicle.id,
                'inactive-row': vehicle.status === 'inactive'
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(vehicle.id)">
                  {{ expandedRow === vehicle.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="plate-number">{{ vehicle.plateNumber }}</td>
              <td>
                <div class="vehicle-info">
                  <span class="vehicle-model">{{ vehicle.model }}</span>
                  <span class="vehicle-brand" v-if="vehicle.brand">{{ vehicle.brand }}</span>
                </div>
              </td>
              <td>
                <span v-if="vehicle.driver" class="driver-name">{{ vehicle.driver }}</span>
                <span v-else class="text-muted">Unassigned</span>
              </td>
              <td>
                <span v-if="vehicle.responsiblePerson" class="responsible-name">{{ vehicle.responsiblePerson }}</span>
                <span v-else class="text-muted">N/A</span>
              </td>
              <td>
                <span class="fuel-badge" :class="vehicle.fuelType">
                  {{ vehicle.fuelType }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="vehicle.status">
                  {{ vehicle.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="editVehicle(vehicle)" class="icon-btn" title="Edit">✏️</button>
                  <button @click="deleteVehicle(vehicle)" class="icon-btn" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === vehicle.id" class="detail-expand-row">
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-two-cols">
                      <!-- Column 1: Vehicle Info -->
                      <div class="detail-card">
                        <h4>🚗 Vehicle Information</h4>
                        <div><span>Plate Number</span><span class="value">{{ vehicle.plateNumber }}</span></div>
                        <div><span>Model</span><span class="value">{{ vehicle.model }}</span></div>
                        <div><span>Brand</span><span class="value">{{ vehicle.brand || 'N/A' }}</span></div>
                        <div><span>Year</span><span class="value">{{ vehicle.year || 'N/A' }}</span></div>
                        <div><span>Color</span><span class="value">{{ vehicle.color || 'N/A' }}</span></div>
                        <div><span>Fuel Type</span><span class="value">{{ vehicle.fuelType }}</span></div>
                        <div><span>Mileage</span><span class="value">{{ vehicle.currentMileage?.toLocaleString() || 0 }} km</span></div>
                        <div><span>Status</span><span class="status-badge" :class="vehicle.status">{{ vehicle.status }}</span></div>
                      </div>

                      <!-- Column 2: Responsible Persons -->
                      <div class="detail-card">
                        <h4>👤 Responsible Persons</h4>
                        <div><span>Owner</span><span class="value">{{ vehicle.owner || 'N/A' }}</span></div>
                        <div><span>Owner Phone</span><span class="value">{{ vehicle.ownerPhone || 'N/A' }}</span></div>
                        <div><span>Assigned Driver</span><span class="value">{{ vehicle.driver || 'Unassigned' }}</span></div>
                        <div><span>Driver Phone</span><span class="value">{{ vehicle.driverPhone || 'N/A' }}</span></div>
                        <div><span>Responsible Person</span><span class="value">{{ vehicle.responsiblePerson || 'N/A' }}</span></div>
                        <div><span>Responsible Phone</span><span class="value">{{ vehicle.responsiblePhone || 'N/A' }}</span></div>
                      </div>

                      <!-- Column 3: Identification & Insurance -->
                      <div class="detail-card">
                        <h4>🔑 Identification & Insurance</h4>
                        <div><span>VIN / Chassis</span><span class="value">{{ vehicle.vin || 'N/A' }}</span></div>
                        <div><span>Engine Number</span><span class="value">{{ vehicle.engineNumber || 'N/A' }}</span></div>
                        <div><span>Insurance Policy</span><span class="value">{{ vehicle.insurancePolicy || 'N/A' }}</span></div>
                        <div><span>Insurance Expiry</span><span class="value">{{ formatDate(vehicle.insuranceExpiry) }}</span></div>
                        <div><span>Registration Certificate</span><span class="value">{{ vehicle.registrationCertificate || 'N/A' }}</span></div>
                        <div><span>Registration Expiry</span><span class="value">{{ formatDate(vehicle.registrationExpiry) }}</span></div>
                      </div>

                      <!-- Column 4: Purchase Information -->
                      <div class="detail-card">
                        <h4>💰 Purchase Information</h4>
                        <div><span>Purchase Date</span><span class="value">{{ formatDate(vehicle.purchaseDate) }}</span></div>
                        <div><span>Purchase Price</span><span class="value">{{ vehicle.purchasePrice ? vehicle.purchasePrice.toLocaleString() + ' ETB' : 'N/A' }}</span></div>
                        <div><span>Supplier</span><span class="value">{{ vehicle.supplier || 'N/A' }}</span></div>
                        <div><span>Department</span><span class="value">{{ vehicle.department || 'N/A' }}</span></div>
                      </div>
                    </div>
                    
                    <!-- Notes -->
                    <div v-if="vehicle.notes" class="detail-card full-width">
                      <h4>📝 Notes</h4>
                      <div class="notes-text">{{ vehicle.notes }}</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
const vehicles = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')
const filterFuelType = ref('all')
const expandedRow = ref(null)
const showAddForm = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Form data
const form = ref({
  plateNumber: '',
  model: '',
  brand: '',
  year: '',
  color: '',
  fuelType: 'petrol',
  currentMileage: 0,
  status: 'active',
  owner: '',
  ownerPhone: '',
  driver: '',
  driverPhone: '',
  responsiblePerson: '',
  responsiblePhone: '',
  vin: '',
  engineNumber: '',
  insurancePolicy: '',
  insuranceExpiry: '',
  registrationCertificate: '',
  registrationExpiry: '',
  purchaseDate: '',
  purchasePrice: 0,
  supplier: '',
  department: '',
  notes: ''
})

// ================================================================
// DEMO DATA
// ================================================================
const demoVehicles = [
  {
    id: 1,
    plateNumber: 'AA-1234',
    model: 'Hilux',
    brand: 'Toyota',
    year: 2020,
    color: 'White',
    fuelType: 'diesel',
    currentMileage: 45230,
    status: 'active',
    owner: 'SuperHR PLC',
    ownerPhone: '+251 911 123 456',
    driver: 'Abebe Kebede',
    driverPhone: '+251 922 123 456',
    responsiblePerson: 'Abebe Kebede',
    responsiblePhone: '+251 922 123 456',
    vin: 'JTEBU3FJ0LK123456',
    engineNumber: 'ENG-001234',
    insurancePolicy: 'INS-2023-001',
    insuranceExpiry: '2024-12-31',
    registrationCertificate: 'REG-2023-001',
    registrationExpiry: '2025-06-30',
    purchaseDate: '2020-01-15',
    purchasePrice: 4500000,
    supplier: 'Toyota Ethiopia',
    department: 'Administration',
    notes: 'Main company vehicle used for executive transport'
  },
  {
    id: 2,
    plateNumber: 'AA-5678',
    model: 'Corolla',
    brand: 'Toyota',
    year: 2021,
    color: 'Silver',
    fuelType: 'petrol',
    currentMileage: 28340,
    status: 'active',
    owner: 'SuperHR PLC',
    ownerPhone: '+251 911 123 456',
    driver: 'Meron Tadesse',
    driverPhone: '+251 933 123 456',
    responsiblePerson: 'Meron Tadesse',
    responsiblePhone: '+251 933 123 456',
    vin: '1NXBR32E18Z123456',
    engineNumber: 'ENG-002345',
    insurancePolicy: 'INS-2023-002',
    insuranceExpiry: '2024-11-30',
    registrationCertificate: 'REG-2023-002',
    registrationExpiry: '2025-03-31',
    purchaseDate: '2021-03-10',
    purchasePrice: 3500000,
    supplier: 'Toyota Ethiopia',
    department: 'HR',
    notes: 'Staff transport for HR department'
  },
  {
    id: 3,
    plateNumber: 'AA-9012',
    model: 'NLR Truck',
    brand: 'Isuzu',
    year: 2022,
    color: 'Blue',
    fuelType: 'diesel',
    currentMileage: 125890,
    status: 'maintenance',
    owner: 'SuperHR PLC',
    ownerPhone: '+251 911 123 456',
    driver: 'Samuel Girma',
    driverPhone: '+251 944 123 456',
    responsiblePerson: 'Samuel Girma',
    responsiblePhone: '+251 944 123 456',
    vin: 'JAANPR77HP7123456',
    engineNumber: 'ENG-003456',
    insurancePolicy: 'INS-2023-003',
    insuranceExpiry: '2024-10-15',
    registrationCertificate: 'REG-2023-003',
    registrationExpiry: '2025-01-31',
    purchaseDate: '2022-01-05',
    purchasePrice: 5500000,
    supplier: 'Isuzu Motors',
    department: 'Logistics',
    notes: 'Heavy duty truck - engine check needed'
  },
  {
    id: 4,
    plateNumber: 'AA-3456',
    model: 'Accent',
    brand: 'Hyundai',
    year: 2019,
    color: 'Red',
    fuelType: 'petrol',
    currentMileage: 18920,
    status: 'active',
    owner: 'SuperHR PLC',
    ownerPhone: '+251 911 123 456',
    driver: '',
    driverPhone: '',
    responsiblePerson: 'Tigist Hailu',
    responsiblePhone: '+251 955 123 456',
    vin: 'KMHDH4AE9KU123456',
    engineNumber: 'ENG-004567',
    insurancePolicy: 'INS-2023-004',
    insuranceExpiry: '2024-09-30',
    registrationCertificate: 'REG-2023-004',
    registrationExpiry: '2024-12-31',
    purchaseDate: '2019-08-20',
    purchasePrice: 2800000,
    supplier: 'Hyundai Motors',
    department: 'Operations',
    notes: 'Available for assignment'
  },
  {
    id: 5,
    plateNumber: 'AA-7890',
    model: 'Land Cruiser',
    brand: 'Toyota',
    year: 2018,
    color: 'Black',
    fuelType: 'diesel',
    currentMileage: 67890,
    status: 'inactive',
    owner: 'SuperHR PLC',
    ownerPhone: '+251 911 123 456',
    driver: 'Tigist Hailu',
    driverPhone: '+251 955 123 456',
    responsiblePerson: 'Tigist Hailu',
    responsiblePhone: '+251 955 123 456',
    vin: 'MR0FZ29G1L5123456',
    engineNumber: 'ENG-005678',
    insurancePolicy: 'INS-2023-005',
    insuranceExpiry: '2024-09-30',
    registrationCertificate: 'REG-2023-005',
    registrationExpiry: '2024-12-31',
    purchaseDate: '2018-06-15',
    purchasePrice: 1800000,
    supplier: 'Toyota Ethiopia',
    department: 'Administration',
    notes: 'Retired - to be sold'
  }
]

// ================================================================
// COMPUTED
// ================================================================
const activeCount = computed(() => 
  vehicles.value.filter(v => v.status === 'active').length
)

const maintenanceCount = computed(() => 
  vehicles.value.filter(v => v.status === 'maintenance').length
)

const inactiveCount = computed(() => 
  vehicles.value.filter(v => v.status === 'inactive').length
)

const hasActiveFilters = computed(() => {
  return filterStatus.value !== 'all' || filterFuelType.value !== 'all' || searchQuery.value
})

const filteredVehicles = computed(() => {
  let result = vehicles.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v => 
      v.plateNumber.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      (v.driver && v.driver.toLowerCase().includes(query)) ||
      (v.owner && v.owner.toLowerCase().includes(query)) ||
      (v.responsiblePerson && v.responsiblePerson.toLowerCase().includes(query)) ||
      (v.brand && v.brand.toLowerCase().includes(query))
    )
  }
  
  if (filterStatus.value !== 'all') {
    result = result.filter(v => v.status === filterStatus.value)
  }
  
  if (filterFuelType.value !== 'all') {
    result = result.filter(v => v.fuelType === filterFuelType.value)
  }
  
  return result
})

// ================================================================
// METHODS
// ================================================================
const loadDemoData = () => {
  vehicles.value = [...demoVehicles]
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ET', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  })
}

const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

const toggleAddForm = () => {
  if (showAddForm.value) {
    closeForm()
  } else {
    openAddForm()
  }
}

const openAddForm = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    plateNumber: '',
    model: '',
    brand: '',
    year: '',
    color: '',
    fuelType: 'petrol',
    currentMileage: 0,
    status: 'active',
    owner: '',
    ownerPhone: '',
    driver: '',
    driverPhone: '',
    responsiblePerson: '',
    responsiblePhone: '',
    vin: '',
    engineNumber: '',
    insurancePolicy: '',
    insuranceExpiry: '',
    registrationCertificate: '',
    registrationExpiry: '',
    purchaseDate: '',
    purchasePrice: 0,
    supplier: '',
    department: '',
    notes: ''
  }
  showAddForm.value = true
  setTimeout(() => {
    document.querySelector('.form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

const editVehicle = (vehicle) => {
  isEditing.value = true
  editingId.value = vehicle.id
  form.value = { ...vehicle }
  showAddForm.value = true
  setTimeout(() => {
    document.querySelector('.form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

const closeForm = () => {
  showAddForm.value = false
  isEditing.value = false
  editingId.value = null
}

const onSearchChange = () => {}

const onFilterChange = () => {}

const clearFilters = () => {
  filterStatus.value = 'all'
  filterFuelType.value = 'all'
  searchQuery.value = ''
  showToastMessage('Filters cleared', 'info')
}

const saveVehicle = () => {
  if (!form.value.plateNumber || !form.value.model) {
    showToastMessage('Please fill in all required fields (Plate Number and Model)', 'error')
    return
  }

  const duplicate = vehicles.value.find(v => 
    v.plateNumber.toLowerCase() === form.value.plateNumber.toLowerCase() &&
    v.id !== editingId.value
  )
  
  if (duplicate) {
    showToastMessage(`Vehicle with plate number "${form.value.plateNumber}" already exists.`, 'error')
    return
  }

  if (isEditing.value) {
    const index = vehicles.value.findIndex(v => v.id === editingId.value)
    if (index !== -1) {
      vehicles.value[index] = { 
        ...form.value, 
        id: editingId.value 
      }
      showToastMessage('Vehicle updated successfully!', 'success')
    }
  } else {
    const newId = Math.max(...vehicles.value.map(v => v.id), 0) + 1
    vehicles.value.push({
      ...form.value,
      id: newId
    })
    showToastMessage('Vehicle registered successfully!', 'success')
  }

  closeForm()
}

const deleteVehicle = (vehicle) => {
  if (confirm(`Are you sure you want to delete ${vehicle.model} (${vehicle.plateNumber})?`)) {
    vehicles.value = vehicles.value.filter(v => v.id !== vehicle.id)
    showToastMessage('Vehicle deleted successfully!', 'success')
  }
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadDemoData()
})
</script>

<style scoped>
/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
}

.header-filters {
  display: flex;
  gap: 12px;
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
  width: 220px;
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

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-add {
  background: #3b82f6;
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
.btn-add:hover { background: #2563eb; }

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
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

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
}
.btn-secondary:hover { background: #e2e8f0; }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
.icon-btn:hover { background: #f1f5f9; }

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}
.btn-clear-filters:hover { background: #e2e8f0; }

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================
   FORM PANEL
   ================================================================ */
.form-panel {
  background: #f8fafc;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
}

.form-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.form-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
}
.form-close:hover { background: #dbeafe; color: #1e293b; }

.form-grid-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-notes {
  grid-column: 1 / -1;
}

.form-notes label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: block;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-notes textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}

.form-notes textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.vehicle-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.vehicle-table th,
.vehicle-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.vehicle-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }

.plate-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
}

.vehicle-model {
  font-weight: 500;
  color: #1e293b;
}

.vehicle-brand {
  font-size: 11px;
  color: #94a3b8;
}

.driver-name {
  font-weight: 500;
  color: #1e293b;
}

.responsible-name {
  font-weight: 500;
  color: #1e293b;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

/* ================================================================
   BADGES
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.maintenance {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.fuel-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.fuel-badge.petrol {
  background: #dbeafe;
  color: #1e40af;
}

.fuel-badge.diesel {
  background: #fef3c7;
  color: #92400e;
}

.fuel-badge.electric {
  background: #dcfce7;
  color: #166534;
}

.fuel-badge.hybrid {
  background: #f3e8ff;
  color: #6b21a8;
}

/* ================================================================
   EXPAND ROW
   ================================================================ */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover { background: #e0e7ff; }
.expanded-row { background: #f8fafc; }
.inactive-row { opacity: 0.7; }
.detail-expand-row td { padding: 0 !important; }

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}
.detail-card > div:last-child { border-bottom: none; }
.detail-card .value { font-weight: 500; color: #1e293b; }

.notes-text {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-content p { color: #94a3b8; }

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}
.toast.error { border-left-color: #ef4444; }
.toast.info { border-left-color: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .form-grid-layout {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .detail-row-two-cols { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-filters { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
}

@media (max-width: 768px) {
  .section-card { padding: 12px; }
  .form-grid-layout {
    grid-template-columns: 1fr;
  }
  .vehicle-table { font-size: 12px; }
  .vehicle-table th, .vehicle-table td { padding: 8px 10px; }
}
</style>