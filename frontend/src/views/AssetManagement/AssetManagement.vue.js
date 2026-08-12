import { ref, computed, onMounted } from 'vue';
// ============================================
// DEMO DATA - FLEXIBLE ASSIGNMENTS
// ============================================
const employees = [
    { id: 1, name: 'Brook Umeta', department: 'ICT' },
    { id: 2, name: 'Habtamu Tesfaye', department: 'ICT' },
    { id: 3, name: 'Meti Shafe', department: 'Finance' },
    { id: 4, name: 'Yerusalam Medelcho', department: 'HR' },
    { id: 5, name: 'Daniel Abebe', department: 'Operations' },
    { id: 6, name: 'Sara G/Mariam', department: 'Marketing' },
    { id: 7, name: 'Tigist Ayele', department: 'Sales' },
    { id: 8, name: 'Solomon Hailu', department: 'Engineering' },
];
const departments = [
    { id: 1, name: 'ICT Department' },
    { id: 2, name: 'Finance Department' },
    { id: 3, name: 'HR Department' },
    { id: 4, name: 'Marketing Department' },
    { id: 5, name: 'Sales Department' },
    { id: 6, name: 'Engineering Department' },
    { id: 7, name: 'Operations Department' },
];
const demoAssets = [
    // ==================== SINGLE ITEM - ASSIGNED TO ONE PERSON ====================
    {
        id: 1,
        code: 'LAP-001',
        name: 'MacBook Pro 16"',
        category: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 16" M3',
        serial: 'SN-MBP-2023-001',
        status: 'assigned',
        condition: 'good',
        quantity: 1,
        purchasePrice: 250000,
        currentValue: 220000,
        purchaseDate: '2024-01-15',
        location: 'ICT Department',
        notes: 'High-end development laptop',
        specifications: {
            'Processor': 'Apple M3 Pro',
            'RAM': '16GB',
            'Storage': '512GB SSD',
            'Screen': '16" Retina'
        },
        assignments: [
            { type: 'individual', name: 'Brook Umeta', quantity: 1, date: '2024-01-20', notes: 'Primary developer' }
        ],
        documents: [],
        transactions: [
            { id: 1, date: '2024-01-20', action: 'assigned', to: 'Brook Umeta', notes: 'Assigned to developer' }
        ]
    },
    // ==================== SINGLE ITEM - ASSIGNED TO MULTIPLE PEOPLE (Shared) ====================
    {
        id: 2,
        code: 'PRJ-001',
        name: 'Projector - Epson 4K',
        category: 'Electronics',
        brand: 'Epson',
        model: 'Epson 4K Pro',
        serial: 'SN-EPS-PRJ-001',
        status: 'assigned',
        condition: 'good',
        quantity: 1,
        purchasePrice: 80000,
        currentValue: 65000,
        purchaseDate: '2024-02-01',
        location: 'Meeting Room A',
        notes: 'Shared projector for presentations',
        specifications: {
            'Resolution': '4K UHD',
            'Brightness': '4000 lumens',
            'Connectivity': 'HDMI, USB-C, Wireless'
        },
        assignments: [
            { type: 'individual', name: 'Brook Umeta', quantity: 1, date: '2024-02-10', notes: 'Main user' },
            { type: 'individual', name: 'Habtamu Tesfaye', quantity: 1, date: '2024-02-10', notes: 'Secondary user' },
            { type: 'individual', name: 'Sara G/Mariam', quantity: 1, date: '2024-02-15', notes: 'Marketing presentations' }
        ],
        documents: [],
        transactions: [
            { id: 2, date: '2024-02-10', action: 'assigned', to: 'Brook Umeta, Habtamu Tesfaye', notes: 'Shared projector assigned to team' },
            { id: 3, date: '2024-02-15', action: 'assigned', to: 'Sara G/Mariam', notes: 'Added for marketing' }
        ]
    },
    // ==================== MULTIPLE ITEMS - ASSIGNED TO ONE PERSON ====================
    {
        id: 3,
        code: 'MON-001',
        name: 'Dell 27" Monitors',
        category: 'Monitor',
        brand: 'Dell',
        model: 'UltraSharp U2723QE',
        serial: 'BULK-MON-001',
        status: 'assigned',
        condition: 'good',
        quantity: 3,
        purchasePrice: 45000,
        currentValue: 40000,
        purchaseDate: '2024-01-20',
        location: 'ICT Department',
        notes: '3 monitors for developer setup',
        specifications: {
            'Screen': '27" 4K UHD',
            'Brightness': '400 cd/m²',
            'Connectivity': 'USB-C, HDMI'
        },
        assignments: [
            { type: 'individual', name: 'Brook Umeta', quantity: 3, date: '2024-01-25', notes: 'Multi-monitor setup for development' }
        ],
        documents: [],
        transactions: [
            { id: 4, date: '2024-01-25', action: 'assigned', to: 'Brook Umeta', notes: '3 monitors for developer' }
        ]
    },
    // ==================== MULTIPLE ITEMS - ASSIGNED TO A DEPARTMENT ====================
    {
        id: 4,
        code: 'PHN-001',
        name: 'iPhone 15 Pro',
        category: 'Phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serial: 'BULK-PHN-001',
        status: 'assigned',
        condition: 'good',
        quantity: 10,
        purchasePrice: 130000,
        currentValue: 120000,
        purchaseDate: '2024-04-01',
        location: 'Sales Office',
        notes: '10 phones for sales team',
        specifications: {
            'Storage': '256GB',
            'Camera': '48MP Main',
            'Battery': '3274 mAh'
        },
        assignments: [
            { type: 'department', name: 'Sales Department', quantity: 10, date: '2024-04-15', notes: '5 for field agents, 5 for office staff' }
        ],
        documents: [],
        transactions: [
            { id: 5, date: '2024-04-15', action: 'assigned', to: 'Sales Department', notes: '10 phones assigned to sales team' }
        ]
    },
    // ==================== MULTIPLE ITEMS - ASSIGNED TO MULTIPLE PEOPLE ====================
    {
        id: 5,
        code: 'TAB-001',
        name: 'iPad Pro Tablets',
        category: 'Tablet',
        brand: 'Apple',
        model: 'iPad Pro 12.9" M2',
        serial: 'BULK-TAB-001',
        status: 'assigned',
        condition: 'good',
        quantity: 8,
        purchasePrice: 140000,
        currentValue: 130000,
        purchaseDate: '2024-05-01',
        location: 'Design Studio',
        notes: '8 tablets for designers and content creators',
        specifications: {
            'Storage': '256GB',
            'Display': '12.9" Liquid Retina XDR',
            'Processor': 'M2'
        },
        assignments: [
            { type: 'individual', name: 'Tigist Ayele', quantity: 2, date: '2024-05-10', notes: 'For design team lead' },
            { type: 'individual', name: 'Solomon Hailu', quantity: 2, date: '2024-05-10', notes: 'For content creation' },
            { type: 'individual', name: 'Sara G/Mariam', quantity: 2, date: '2024-05-15', notes: 'For marketing design' },
            { type: 'department', name: 'Engineering Department', quantity: 2, date: '2024-06-01', notes: 'For engineering team' }
        ],
        documents: [],
        transactions: [
            { id: 6, date: '2024-05-10', action: 'assigned', to: 'Tigist Ayele, Solomon Hailu', notes: 'Tablets assigned to designers' },
            { id: 7, date: '2024-05-15', action: 'assigned', to: 'Sara G/Mariam', notes: 'Tablets assigned to marketing' },
            { id: 8, date: '2024-06-01', action: 'assigned', to: 'Engineering Department', notes: 'Tablets assigned to engineering' }
        ]
    },
    // ==================== AVAILABLE ASSETS ====================
    {
        id: 6,
        code: 'PRN-001',
        name: 'HP LaserJet Pro Printers',
        category: 'Printer',
        brand: 'HP',
        model: 'LaserJet Pro MFP M428',
        serial: 'BULK-PRN-001',
        status: 'available',
        condition: 'good',
        quantity: 5,
        purchasePrice: 35000,
        currentValue: 30000,
        purchaseDate: '2024-02-01',
        location: 'Store Room',
        notes: '5 printers in storage',
        specifications: {
            'Type': 'Laser Printer',
            'Speed': '30 pages/min',
            'Connectivity': 'USB, Ethernet'
        },
        assignments: [],
        documents: [],
        transactions: [
            { id: 9, date: '2024-02-01', action: 'received', to: 'Store Room', notes: '5 printers received' }
        ]
    },
    {
        id: 7,
        code: 'KIT-001',
        name: 'Office Desk Kits',
        category: 'Furniture',
        brand: 'IKEA',
        model: 'Office Pro Set',
        serial: 'BULK-KIT-001',
        status: 'available',
        condition: 'good',
        quantity: 20,
        purchasePrice: 15000,
        currentValue: 12000,
        purchaseDate: '2024-03-01',
        location: 'Store Room C',
        notes: '20 complete desk sets available',
        specifications: {
            'Set Includes': 'Desk, Chair, Filing Cabinet',
            'Color': 'Black/Walnut'
        },
        assignments: [],
        documents: [],
        transactions: [
            { id: 10, date: '2024-03-01', action: 'received', to: 'Store Room C', notes: '20 desk sets received' }
        ]
    },
    {
        id: 8,
        code: 'VEH-001',
        name: 'Toyota Hilux',
        category: 'Vehicle',
        brand: 'Toyota',
        model: 'Hilux 4x4',
        serial: 'SN-TOY-VEH-001',
        status: 'available',
        condition: 'good',
        quantity: 1,
        purchasePrice: 4500000,
        currentValue: 4000000,
        purchaseDate: '2023-10-01',
        location: 'Garage',
        notes: 'Field work vehicle available',
        specifications: {
            'Engine': '2.8L Turbo Diesel',
            'Drive': '4x4'
        },
        assignments: [],
        documents: [],
        transactions: [
            { id: 11, date: '2023-10-01', action: 'received', to: 'Garage', notes: 'Vehicle received' }
        ]
    },
    {
        id: 9,
        code: 'MON-002',
        name: 'LG 24" Monitors',
        category: 'Monitor',
        brand: 'LG',
        model: '24MK600M',
        serial: 'BULK-MON-002',
        status: 'available',
        condition: 'good',
        quantity: 15,
        purchasePrice: 25000,
        currentValue: 22000,
        purchaseDate: '2024-02-15',
        location: 'ICT Lab',
        notes: '15 monitors for lab upgrade',
        specifications: {
            'Screen': '24" Full HD',
            'Aspect Ratio': '16:9'
        },
        assignments: [],
        documents: [],
        transactions: [
            { id: 12, date: '2024-02-15', action: 'received', to: 'ICT Lab', notes: '15 monitors received' }
        ]
    }
];
// ============================================
// STATE
// ============================================
const assets = ref([...demoAssets]);
const loading = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const filterAssignmentType = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(5);
const expandedRow = ref(null);
const showViewModal = ref(false);
const showAssignModal = ref(false);
const viewingAsset = ref(null);
const selectedAsset = ref(null);
const assignmentType = ref('individual');
const assignTo = ref('');
const assignQuantity = ref(1);
const assignDate = ref('');
const assignNotes = ref('');
// ============================================
// COMPUTED
// ============================================
const totalItems = computed(() => assets.value.length);
const activeCategoryNames = computed(() => {
    const cats = new Set(assets.value.map(a => a.category));
    return Array.from(cats);
});
const stats = computed(() => {
    const total = assets.value.length;
    const available = assets.value.filter(a => a.status === 'available').length;
    const assigned = assets.value.filter(a => a.status === 'assigned').length;
    const maintenance = assets.value.filter(a => a.status === 'maintenance').length;
    const totalAssignments = assets.value.reduce((sum, a) => sum + (a.assignments?.length || 0), 0);
    return [
        { icon: '📦', label: 'Total Assets', value: total, color: '#6366f1' },
        { icon: '✅', label: 'Available', value: available, color: '#10b981' },
        { icon: '📌', label: 'Assigned', value: assigned, color: '#f59e0b' },
        { icon: '👥', label: 'Total Assignments', value: totalAssignments, color: '#8b5cf6' }
    ];
});
const assignmentOptions = computed(() => {
    if (assignmentType.value === 'individual') {
        return employees;
    }
    else {
        return departments;
    }
});
const filteredAssets = computed(() => {
    let result = [...assets.value];
    if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase();
        result = result.filter(a => a.name.toLowerCase().includes(search) ||
            a.code.toLowerCase().includes(search) ||
            a.serial?.toLowerCase().includes(search) ||
            a.model?.toLowerCase().includes(search));
    }
    if (filterCategory.value) {
        result = result.filter(a => a.category === filterCategory.value);
    }
    if (filterAssignmentType.value === 'assigned') {
        result = result.filter(a => a.assignments && a.assignments.length > 0);
    }
    else if (filterAssignmentType.value === 'unassigned') {
        result = result.filter(a => !a.assignments || a.assignments.length === 0);
    }
    if (filterStatus.value) {
        result = result.filter(a => a.status === filterStatus.value);
    }
    return result;
});
const totalPages = computed(() => Math.ceil(filteredAssets.value.length / itemsPerPage.value) || 1);
const paginatedAssets = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredAssets.value.slice(start, end);
});
const hasActiveFilters = computed(() => {
    return searchQuery.value || filterCategory.value || filterAssignmentType.value || filterStatus.value;
});
const displayedPages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pages = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++)
            pages.push(i);
    }
    else {
        pages.push(1);
        if (current > 3)
            pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++)
            pages.push(i);
        if (current < total - 2)
            pages.push('...');
        pages.push(total);
    }
    return pages;
});
// ============================================
// METHODS
// ============================================
const getCategoryIcon = (category) => {
    const icons = {
        'Laptop': '💻',
        'Desktop': '🖥',
        'Monitor': '🖥',
        'Keyboard': '⌨️',
        'Mouse': '🖱',
        'Phone': '📱',
        'Tablet': '📱',
        'Printer': '🖨',
        'Vehicle': '🚗',
        'Furniture': '🪑',
        'Electronics': '📡'
    };
    return icons[category] || '📦';
};
const getCategoryColor = (category) => {
    const colors = {
        'Laptop': '#eef2ff',
        'Desktop': '#e0f2fe',
        'Monitor': '#d1fae5',
        'Keyboard': '#fef3c7',
        'Mouse': '#fce7f3',
        'Phone': '#dbeafe',
        'Tablet': '#ede9fe',
        'Printer': '#ffedd5',
        'Vehicle': '#d1fae5',
        'Furniture': '#fef3c7',
        'Electronics': '#e0f2fe'
    };
    return colors[category] || '#f1f5f9';
};
const getStatusLabel = (status) => {
    const labels = {
        available: 'Available',
        assigned: 'Assigned',
        maintenance: 'Maintenance',
        retired: 'Retired'
    };
    return labels[status] || status;
};
const getConditionLabel = (condition) => {
    const labels = {
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        damaged: 'Damaged',
        retired: 'Retired'
    };
    return labels[condition] || condition;
};
const getActionLabel = (action) => {
    const labels = {
        received: 'Received',
        assigned: 'Assigned',
        returned: 'Returned',
        transferred: 'Transferred',
        maintenance: 'Maintenance',
        repaired: 'Repaired'
    };
    return labels[action] || action;
};
const formatCurrency = (value) => {
    if (!value)
        return 'ETB 0.00';
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};
const formatDate = (date) => {
    if (!date)
        return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const toggleExpand = (id) => {
    expandedRow.value = expandedRow.value === id ? null : id;
};
const handleSearch = () => { currentPage.value = 1; };
const handleFilterChange = () => { currentPage.value = 1; };
const handlePageSizeChange = () => { currentPage.value = 1; };
const clearFilters = () => {
    searchQuery.value = '';
    filterCategory.value = '';
    filterAssignmentType.value = '';
    filterStatus.value = '';
    currentPage.value = 1;
};
const goToPage = (page) => {
    if (page === '...')
        return;
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
};
const openAddAsset = () => {
    alert('Open Add Asset form');
};
const openEditAsset = (asset) => {
    alert(`Edit asset: ${asset.name}`);
};
const viewAsset = (asset) => {
    viewingAsset.value = asset;
    showViewModal.value = true;
};
const openAssignModal = (asset) => {
    selectedAsset.value = asset;
    assignmentType.value = 'individual';
    assignTo.value = '';
    assignQuantity.value = 1;
    assignDate.value = new Date().toISOString().split('T')[0];
    assignNotes.value = '';
    showAssignModal.value = true;
};
const confirmAssign = () => {
    if (!assignTo.value || !assignQuantity.value) {
        alert('Please select a person/department and quantity');
        return;
    }
    const item = assignmentType.value === 'individual'
        ? employees.find(e => e.id === parseInt(assignTo.value))
        : departments.find(d => d.id === parseInt(assignTo.value));
    if (!item)
        return;
    const asset = selectedAsset.value;
    // Add assignment
    if (!asset.assignments)
        asset.assignments = [];
    asset.assignments.push({
        type: assignmentType.value,
        name: item.name,
        quantity: parseInt(assignQuantity.value),
        date: assignDate.value || new Date().toISOString().split('T')[0],
        notes: assignNotes.value || ''
    });
    // Update asset status
    asset.status = 'assigned';
    // Add transaction
    if (!asset.transactions)
        asset.transactions = [];
    asset.transactions.unshift({
        id: Date.now(),
        date: assignDate.value || new Date().toISOString().split('T')[0],
        action: 'assigned',
        to: item.name,
        notes: assignNotes.value || `${assignQuantity.value} unit(s) assigned`
    });
    showAssignModal.value = false;
    selectedAsset.value = null;
    alert(`✅ ${assignQuantity.value} unit(s) of ${asset.name} assigned to ${item.name}`);
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    assignDate.value = new Date().toISOString().split('T')[0];
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['serial-info']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-row']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-type']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-type']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-row']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-link']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-row']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['assigned']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['maintenance']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['assignments-section']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-item']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-date']} */ ;
/** @type {__VLS_StyleScopedClasses['assignment-notes']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-section']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-notes']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-notes']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-history']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-date']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-notes']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-detail-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-title" },
});
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "total-badge" },
});
/** @type {__VLS_StyleScopedClasses['total-badge']} */ ;
(__VLS_ctx.totalItems);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-filters" },
});
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.handleSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by name, code, serial...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddAsset) },
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
for (const [stat] of __VLS_vFor((__VLS_ctx.stats))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
        key: (stat.label),
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
        ...{ style: ({ background: stat.color }) },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (stat.icon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (stat.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (stat.label);
    // @ts-ignore
    [totalItems, handleSearch, searchQuery, openAddAsset, stats,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.handleFilterChange) },
    value: (__VLS_ctx.filterCategory),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [cat] of __VLS_vFor((__VLS_ctx.activeCategoryNames))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cat),
        value: (cat),
    });
    (cat);
    // @ts-ignore
    [handleFilterChange, filterCategory, activeCategoryNames,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.handleFilterChange) },
    value: (__VLS_ctx.filterAssignmentType),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "assigned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "unassigned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.handleFilterChange) },
    value: (__VLS_ctx.filterStatus),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "available",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "assigned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "maintenance",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "retired",
});
if (__VLS_ctx.hasActiveFilters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.assets.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openAddAsset) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "asset-table" },
    });
    /** @type {__VLS_StyleScopedClasses['asset-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [asset] of __VLS_vFor((__VLS_ctx.paginatedAssets))) {
        (asset.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: ({
                    'expanded-row': __VLS_ctx.expandedRow === asset.id,
                    'inactive-row': asset.status === 'retired'
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['inactive-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.assets.length === 0))
                        return;
                    __VLS_ctx.toggleExpand(asset.id);
                    // @ts-ignore
                    [openAddAsset, handleFilterChange, handleFilterChange, filterAssignmentType, filterStatus, hasActiveFilters, clearFilters, loading, assets, paginatedAssets, expandedRow, toggleExpand,];
                } },
            ...{ class: "expand-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
        (__VLS_ctx.expandedRow === asset.id ? "▼" : "▶");
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-info" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-icon" },
            ...{ style: ({ background: __VLS_ctx.getCategoryColor(asset.category) }) },
        });
        /** @type {__VLS_StyleScopedClasses['asset-icon']} */ ;
        (__VLS_ctx.getCategoryIcon(asset.category));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-name" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-name']} */ ;
        (asset.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-code" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-code']} */ ;
        (asset.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "category-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['category-badge']} */ ;
        (asset.category);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "serial-info" },
        });
        /** @type {__VLS_StyleScopedClasses['serial-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "serial" },
        });
        /** @type {__VLS_StyleScopedClasses['serial']} */ ;
        (asset.serial || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "model" },
        });
        /** @type {__VLS_StyleScopedClasses['model']} */ ;
        (asset.model || '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "quantity-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['quantity-badge']} */ ;
        (asset.quantity || 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge" },
            ...{ class: (asset.status) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getStatusLabel(asset.status));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "assignment-info" },
        });
        /** @type {__VLS_StyleScopedClasses['assignment-info']} */ ;
        if (asset.assignments && asset.assignments.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "assignment-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['assignment-badge']} */ ;
            (asset.assignments.length);
            (asset.assignments.length > 1 ? 's' : '');
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "unassigned-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['unassigned-badge']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.assets.length === 0))
                        return;
                    __VLS_ctx.viewAsset(asset);
                    // @ts-ignore
                    [expandedRow, getCategoryColor, getCategoryIcon, getStatusLabel, viewAsset,];
                } },
            ...{ class: "icon-btn" },
            title: "View Details",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.assets.length === 0))
                        return;
                    __VLS_ctx.openAssignModal(asset);
                    // @ts-ignore
                    [openAssignModal,];
                } },
            ...{ class: "icon-btn" },
            title: "Assign",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.assets.length === 0))
                        return;
                    __VLS_ctx.openEditAsset(asset);
                    // @ts-ignore
                    [openEditAsset,];
                } },
            ...{ class: "icon-btn" },
            title: "Edit",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        if (__VLS_ctx.expandedRow === asset.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: "detail-expand-row" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "expand-details" },
            });
            /** @type {__VLS_StyleScopedClasses['expand-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-container" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-container']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-row-two-cols" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.category);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.brand || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.model || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value serial-number" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            /** @type {__VLS_StyleScopedClasses['serial-number']} */ ;
            (asset.serial || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.location || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (asset.quantity || 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-badge" },
                ...{ class: (asset.status) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (__VLS_ctx.getStatusLabel(asset.status));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "condition-badge" },
                ...{ class: (asset.condition) },
            });
            /** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
            (__VLS_ctx.getConditionLabel(asset.condition));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            if (asset.specifications && Object.keys(asset.specifications).length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                for (const [value, key] of __VLS_vFor((asset.specifications))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (key),
                        ...{ class: "spec-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['spec-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (key);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "value" },
                    });
                    /** @type {__VLS_StyleScopedClasses['value']} */ ;
                    (value);
                    // @ts-ignore
                    [expandedRow, getStatusLabel, getConditionLabel,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-specs" },
                });
                /** @type {__VLS_StyleScopedClasses['no-specs']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-row-two-cols" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value purchase-price" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            /** @type {__VLS_StyleScopedClasses['purchase-price']} */ ;
            (__VLS_ctx.formatCurrency(asset.purchasePrice));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value current-price" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            /** @type {__VLS_StyleScopedClasses['current-price']} */ ;
            (__VLS_ctx.formatCurrency(asset.currentValue));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatDate(asset.purchaseDate) || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value depreciation" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            /** @type {__VLS_StyleScopedClasses['depreciation']} */ ;
            (__VLS_ctx.formatCurrency((asset.purchasePrice || 0) - (asset.currentValue || 0)));
            (asset.purchasePrice ? (((asset.purchasePrice - asset.currentValue) / asset.purchasePrice * 100).toFixed(1)) : 0);
            if (asset.notes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value notes-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['notes-text']} */ ;
                (asset.notes);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            if (asset.assignments && asset.assignments.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                for (const [assignment, idx] of __VLS_vFor((asset.assignments))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (idx),
                        ...{ class: "assignment-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "assignment-detail" },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-detail']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "assignment-type" },
                        ...{ class: (assignment.type) },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-type']} */ ;
                    (assignment.type === 'individual' ? '👤' : '🏢');
                    (assignment.name);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "assignment-qty" },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-qty']} */ ;
                    (assignment.quantity || 1);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "assignment-date" },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-date']} */ ;
                    (__VLS_ctx.formatDate(assignment.date));
                    if (assignment.notes) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            ...{ class: "assignment-notes" },
                        });
                        /** @type {__VLS_StyleScopedClasses['assignment-notes']} */ ;
                        (assignment.notes);
                    }
                    // @ts-ignore
                    [formatCurrency, formatCurrency, formatCurrency, formatDate, formatDate,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-specs" },
                });
                /** @type {__VLS_StyleScopedClasses['no-specs']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-row-two-cols" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            if (asset.documents && asset.documents.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                for (const [doc] of __VLS_vFor((asset.documents))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (doc.id),
                        ...{ class: "doc-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['doc-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "doc-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                        href: (doc.url),
                        target: "_blank",
                        ...{ class: "doc-link" },
                    });
                    /** @type {__VLS_StyleScopedClasses['doc-link']} */ ;
                    (doc.name);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "doc-date" },
                    });
                    /** @type {__VLS_StyleScopedClasses['doc-date']} */ ;
                    (__VLS_ctx.formatDate(doc.uploadDate));
                    // @ts-ignore
                    [formatDate,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-specs" },
                });
                /** @type {__VLS_StyleScopedClasses['no-specs']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            if (asset.transactions && asset.transactions.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                for (const [tx] of __VLS_vFor((asset.transactions))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (tx.id),
                        ...{ class: "tx-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['tx-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "tx-badge" },
                        ...{ class: (tx.action) },
                    });
                    /** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
                    (__VLS_ctx.getActionLabel(tx.action));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "tx-date" },
                    });
                    /** @type {__VLS_StyleScopedClasses['tx-date']} */ ;
                    (__VLS_ctx.formatDate(tx.date));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "tx-detail" },
                    });
                    /** @type {__VLS_StyleScopedClasses['tx-detail']} */ ;
                    if (tx.from) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        (tx.from);
                    }
                    if (tx.to) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        (tx.to);
                    }
                    if (tx.notes) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "tx-notes" },
                        });
                        /** @type {__VLS_StyleScopedClasses['tx-notes']} */ ;
                        (tx.notes);
                    }
                    // @ts-ignore
                    [formatDate, getActionLabel,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-specs" },
                });
                /** @type {__VLS_StyleScopedClasses['no-specs']} */ ;
            }
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination-container" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination-info" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.paginatedAssets.length);
    (__VLS_ctx.totalItems);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.currentPage);
    (__VLS_ctx.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [totalItems, totalItems, paginatedAssets, currentPage, currentPage, totalPages, goToPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-numbers" },
    });
    /** @type {__VLS_StyleScopedClasses['page-numbers']} */ ;
    for (const [page] of __VLS_vFor((__VLS_ctx.displayedPages))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.totalItems > 0))
                        return;
                    __VLS_ctx.goToPage(page);
                    // @ts-ignore
                    [currentPage, goToPage, displayedPages,];
                } },
            key: (page),
            ...{ class: "page-number" },
            ...{ class: ({ active: page === __VLS_ctx.currentPage }) },
            disabled: (page === '...'),
        });
        /** @type {__VLS_StyleScopedClasses['page-number']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        (page);
        // @ts-ignore
        [currentPage,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [currentPage, goToPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handlePageSizeChange) },
        value: (__VLS_ctx.itemsPerPage),
        ...{ class: "limit-select" },
    });
    /** @type {__VLS_StyleScopedClasses['limit-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (5),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (10),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (20),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (50),
    });
}
if (__VLS_ctx.showViewModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showViewModal))
                    return;
                __VLS_ctx.showViewModal = false;
                // @ts-ignore
                [currentPage, totalPages, handlePageSizeChange, itemsPerPage, showViewModal, showViewModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container view-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['view-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showViewModal))
                    return;
                __VLS_ctx.showViewModal = false;
                // @ts-ignore
                [showViewModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    if (__VLS_ctx.viewingAsset) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "modal-body" },
        });
        /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-detail-header" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-detail-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-detail-icon" },
            ...{ style: ({ background: __VLS_ctx.getCategoryColor(__VLS_ctx.viewingAsset.category) }) },
        });
        /** @type {__VLS_StyleScopedClasses['asset-detail-icon']} */ ;
        (__VLS_ctx.getCategoryIcon(__VLS_ctx.viewingAsset.category));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        (__VLS_ctx.viewingAsset.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-detail-code" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-detail-code']} */ ;
        (__VLS_ctx.viewingAsset.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge" },
            ...{ class: (__VLS_ctx.viewingAsset.status) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getStatusLabel(__VLS_ctx.viewingAsset.status));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "asset-detail-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['asset-detail-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.viewingAsset.category);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.viewingAsset.brand || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.viewingAsset.model || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "serial-number" },
        });
        /** @type {__VLS_StyleScopedClasses['serial-number']} */ ;
        (__VLS_ctx.viewingAsset.serial || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "condition-badge" },
            ...{ class: (__VLS_ctx.viewingAsset.condition) },
        });
        /** @type {__VLS_StyleScopedClasses['condition-badge']} */ ;
        (__VLS_ctx.getConditionLabel(__VLS_ctx.viewingAsset.condition));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.viewingAsset.location || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.viewingAsset.quantity || 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "purchase-price" },
        });
        /** @type {__VLS_StyleScopedClasses['purchase-price']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.viewingAsset.purchasePrice));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-item" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "current-price" },
        });
        /** @type {__VLS_StyleScopedClasses['current-price']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.viewingAsset.currentValue));
        if (__VLS_ctx.viewingAsset.assignments && __VLS_ctx.viewingAsset.assignments.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "assignments-section" },
            });
            /** @type {__VLS_StyleScopedClasses['assignments-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "assignments-list" },
            });
            /** @type {__VLS_StyleScopedClasses['assignments-list']} */ ;
            for (const [assignment, idx] of __VLS_vFor((__VLS_ctx.viewingAsset.assignments))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (idx),
                    ...{ class: "assignment-item" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "assignment-icon" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-icon']} */ ;
                if (assignment.type === 'individual') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "assignment-content" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-content']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "assignment-header" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "assignment-name" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-name']} */ ;
                (assignment.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "assignment-qty-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-qty-badge']} */ ;
                (assignment.quantity || 1);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "assignment-date" },
                });
                /** @type {__VLS_StyleScopedClasses['assignment-date']} */ ;
                (__VLS_ctx.formatDate(assignment.date));
                if (assignment.notes) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "assignment-notes" },
                    });
                    /** @type {__VLS_StyleScopedClasses['assignment-notes']} */ ;
                    (assignment.notes);
                }
                // @ts-ignore
                [getCategoryColor, getCategoryIcon, getStatusLabel, getConditionLabel, formatCurrency, formatCurrency, formatDate, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset,];
            }
        }
        if (__VLS_ctx.viewingAsset.notes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "asset-notes" },
            });
            /** @type {__VLS_StyleScopedClasses['asset-notes']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.viewingAsset.notes);
        }
        if (__VLS_ctx.viewingAsset.specifications && Object.keys(__VLS_ctx.viewingAsset.specifications).length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spec-section" },
            });
            /** @type {__VLS_StyleScopedClasses['spec-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spec-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['spec-grid']} */ ;
            for (const [value, key] of __VLS_vFor((__VLS_ctx.viewingAsset.specifications))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "spec-item" },
                    key: (key),
                });
                /** @type {__VLS_StyleScopedClasses['spec-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "spec-key" },
                });
                /** @type {__VLS_StyleScopedClasses['spec-key']} */ ;
                (key);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "spec-value" },
                });
                /** @type {__VLS_StyleScopedClasses['spec-value']} */ ;
                (value);
                // @ts-ignore
                [viewingAsset, viewingAsset, viewingAsset, viewingAsset, viewingAsset,];
            }
        }
        if (__VLS_ctx.viewingAsset.transactions?.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "transaction-history" },
            });
            /** @type {__VLS_StyleScopedClasses['transaction-history']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "transaction-list" },
            });
            /** @type {__VLS_StyleScopedClasses['transaction-list']} */ ;
            for (const [tx] of __VLS_vFor((__VLS_ctx.viewingAsset.transactions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (tx.id),
                    ...{ class: "transaction-item" },
                });
                /** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "tx-date" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-date']} */ ;
                (__VLS_ctx.formatDate(tx.date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "tx-action" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-action']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tx-badge" },
                    ...{ class: (tx.action) },
                });
                /** @type {__VLS_StyleScopedClasses['tx-badge']} */ ;
                (__VLS_ctx.getActionLabel(tx.action));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "tx-details" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-details']} */ ;
                if (tx.from) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (tx.from);
                }
                if (tx.to) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (tx.to);
                }
                if (tx.notes) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "tx-notes" },
                    });
                    /** @type {__VLS_StyleScopedClasses['tx-notes']} */ ;
                    (tx.notes);
                }
                // @ts-ignore
                [formatDate, getActionLabel, viewingAsset, viewingAsset,];
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showViewModal))
                    return;
                __VLS_ctx.showViewModal = false;
                // @ts-ignore
                [showViewModal,];
            } },
        ...{ class: "btn-close" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-close']} */ ;
}
if (__VLS_ctx.showAssignModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAssignModal))
                    return;
                __VLS_ctx.showAssignModal = false;
                // @ts-ignore
                [showAssignModal, showAssignModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container assign-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['assign-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAssignModal))
                    return;
                __VLS_ctx.showAssignModal = false;
                // @ts-ignore
                [showAssignModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedAsset?.name);
    (__VLS_ctx.selectedAsset?.quantity || 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "assignment-type-selector" },
    });
    /** @type {__VLS_StyleScopedClasses['assignment-type-selector']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAssignModal))
                    return;
                __VLS_ctx.assignmentType = 'individual';
                // @ts-ignore
                [selectedAsset, selectedAsset, assignmentType,];
            } },
        ...{ class: "type-option" },
    });
    /** @type {__VLS_StyleScopedClasses['type-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "individual",
    });
    (__VLS_ctx.assignmentType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAssignModal))
                    return;
                __VLS_ctx.assignmentType = 'department';
                // @ts-ignore
                [assignmentType, assignmentType,];
            } },
        ...{ class: "type-option" },
    });
    /** @type {__VLS_StyleScopedClasses['type-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "department",
    });
    (__VLS_ctx.assignmentType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.assignmentType === 'individual' ? 'Select Person' : 'Select Department');
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.assignTo),
        ...{ class: "form-control" },
    });
    /** @type {__VLS_StyleScopedClasses['form-control']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.assignmentType === 'individual' ? 'person' : 'department');
    for (const [item] of __VLS_vFor((__VLS_ctx.assignmentOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (item.id),
            value: (item.id),
        });
        (item.name);
        // @ts-ignore
        [assignmentType, assignmentType, assignmentType, assignTo, assignmentOptions,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        ...{ class: "form-control" },
        min: "1",
        max: (__VLS_ctx.selectedAsset?.quantity || 1),
    });
    (__VLS_ctx.assignQuantity);
    /** @type {__VLS_StyleScopedClasses['form-control']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    (__VLS_ctx.selectedAsset?.quantity || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "form-control" },
    });
    (__VLS_ctx.assignDate);
    /** @type {__VLS_StyleScopedClasses['form-control']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.assignNotes),
        ...{ class: "form-control" },
        rows: "2",
        placeholder: "Assignment notes...",
    });
    /** @type {__VLS_StyleScopedClasses['form-control']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-box" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.assignQuantity || 0);
    (__VLS_ctx.assignmentType === 'individual' ? 'person' : 'department');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAssignModal))
                    return;
                __VLS_ctx.showAssignModal = false;
                // @ts-ignore
                [showAssignModal, selectedAsset, selectedAsset, assignmentType, assignQuantity, assignQuantity, assignDate, assignNotes,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmAssign) },
        ...{ class: "btn-confirm" },
        disabled: (!__VLS_ctx.assignTo || !__VLS_ctx.assignQuantity),
    });
    /** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
}
// @ts-ignore
[assignTo, assignQuantity, confirmAssign,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
