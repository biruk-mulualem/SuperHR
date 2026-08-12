import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import itemService from '@/stores/itemService';
// Import Quill editor dynamically
const QuillEditor = defineAsyncComponent(() => import('@vueup/vue-quill').then(m => m.QuillEditor));
// ================================================================
// STATE
// ================================================================
const items = ref([]);
const categories = ref([]);
const uomList = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const filterUOM = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const totalPagesFromServer = ref(1);
// Add to your existing state
const exportFormat = ref('xlsx');
const exportScope = ref('all');
const activeTab = ref('items');
const expandedRow = ref(null);
const specType = ref('text');
// Item Modals
const showItemModal = ref(false);
const editingItem = ref(null);
const savingItem = ref(false);
// Deactivate Modal
const showDeactivateModal = ref(false);
const deactivateItem = ref(null);
// Category Modals
const showCategoryModal = ref(false);
const editingCategory = ref(null);
const categoryExists = ref(false);
const categoryForm = ref({ name: '', status: 'Active' });
const categoryPage = ref(1);
const categoryPageSize = ref(5);
// UOM Modals
const showUOMModal = ref(false);
const editingUOM = ref(null);
const uomForm = ref({ code: '', name: '', status: 'Active' });
const uomPage = ref(1);
const uomPageSize = ref(5);
// Export
const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref('full');
// Import
const showImportModal = ref(false);
const importing = ref(false);
const csvFile = ref(null);
const csvFileInput = ref(null);
const isDragOver = ref(false);
const importPreviewData = ref([]);
const importResults = ref(null);
const importProgress = ref({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0
});
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const pdfFileInput = ref(null);
// Quill Editor Toolbar
const quillToolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean']
];
// ================================================================
// TABS DEFINITION
// ================================================================
const tabs = [
    { key: 'items', label: '📦 Items' },
    { key: 'categories', label: '📁 Categories' },
    { key: 'uom', label: '📏 UOM' }
];
const itemForm = ref({
    name: '',
    standardName: '',
    description: '',
    brand: '',
    model: '',
    barcode: '',
    categoryId: '',
    uomId: '',
    conversionUomId: '',
    conversionValue: 0,
    costPrice: 0,
    specType: 'text',
    specText: '',
    specPdfFile: null,
    specPdfName: '',
    specPdfSize: ''
});
// ================================================================
// COMPUTED
// ================================================================
const activeCategories = computed(() => {
    return categories.value.filter(c => c.status === 'Active');
});
const activeUOMs = computed(() => {
    return uomList.value.filter(u => u.status === 'Active');
});
const activeCategoryNames = computed(() => {
    return categories.value.filter(c => c.status === 'Active').map(c => c.name);
});
// ✅ Use totalPages from server response directly
const totalPages = computed(() => {
    return totalPagesFromServer.value || 1;
});
const paginatedCategories = computed(() => {
    const start = (categoryPage.value - 1) * categoryPageSize.value;
    return categories.value.slice(start, start + categoryPageSize.value);
});
const categoryTotalPages = computed(() => {
    return Math.ceil(categories.value.length / categoryPageSize.value) || 1;
});
const paginatedUOMs = computed(() => {
    const start = (uomPage.value - 1) * uomPageSize.value;
    return uomList.value.slice(start, start + uomPageSize.value);
});
const uomTotalPages = computed(() => {
    return Math.ceil(uomList.value.length / uomPageSize.value) || 1;
});
const hasActiveFilters = computed(() => {
    return filterCategory.value || filterStatus.value || filterUOM.value || searchQuery.value;
});
// Display page numbers with ellipsis
const displayedPages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pages = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    }
    else {
        pages.push(1);
        if (current > 3) {
            pages.push('...');
        }
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (current < total - 2) {
            pages.push('...');
        }
        pages.push(total);
    }
    return pages;
});
// ================================================================
// HELPER METHODS
// ================================================================
const getUOMCode = (id) => {
    const uom = uomList.value.find(u => (u.uomId || u.id) === id);
    return uom?.code || '';
};
// ================================================================
// HELPER METHODS - FIXED CONVERSION DISPLAY
// ================================================================
// ================================================================
// HELPER METHODS - FIXED CONVERSION DISPLAY
// ================================================================
// ================================================================
// HELPER METHODS - CLEAN CONVERSION DISPLAY
// ================================================================
const getConversionDisplay = (item) => {
    if (!item)
        return 'No conversion';
    const uomCode = item.uom?.code || item.uom || '';
    const convUnit = item.conversionUom?.code || item.conversionUom;
    const convValue = parseFloat(item.conversionValue) || 0;
    // No conversion unit or value is 0
    if (!convUnit || convValue === 0) {
        return 'No conversion';
    }
    // Self-conversion (base unit)
    if (convUnit === uomCode) {
        return 'Base Unit';
    }
    // Actual conversion to different unit
    return `${convValue} ${convUnit} = 1 ${uomCode}`;
};
const getConversionUnitDisplay = (item) => {
    if (!item)
        return '-';
    const convUnit = item.conversionUom?.code || item.conversionUom;
    const convValue = parseFloat(item.conversionValue) || 0;
    const uomCode = item.uom?.code || item.uom || '';
    if (!convUnit || convValue === 0) {
        return '-';
    }
    return convUnit === uomCode ? `${convUnit}` : convUnit;
};
const getConversionValueDisplay = (item) => {
    if (!item)
        return '0';
    const convValue = parseFloat(item.conversionValue) || 0;
    const convUnit = item.conversionUom?.code || item.conversionUom;
    if (!convUnit) {
        return '0';
    }
    return convValue;
};
const hasConversion = (item) => {
    if (!item)
        return false;
    const convUnit = item.conversionUom?.code || item.conversionUom;
    const convValue = parseFloat(item.conversionValue) || 0;
    return !!(convUnit && convValue > 0);
};
const isSelfConversion = (item) => {
    if (!item)
        return false;
    const uomCode = item.uom?.code || item.uom || '';
    const convUnit = item.conversionUom?.code || item.conversionUom;
    const convValue = parseFloat(item.conversionValue) || 0;
    return !!(convUnit && convValue > 0 && convUnit === uomCode);
};
const getNewStatus = (currentStatus) => {
    return currentStatus === 'Active' ? 'Inactive' : 'Active';
};
const formatCurrency = (amt) => {
    if (!amt && amt !== 0)
        return '0.00';
    const num = parseFloat(amt);
    if (isNaN(num))
        return '0.00';
    return num.toFixed(2);
};
const formatFileSize = (bytes) => {
    if (!bytes)
        return '0 B';
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const toggleExpand = (id) => {
    expandedRow.value = expandedRow.value === id ? null : id;
};
// ================================================================
// PAGINATION METHODS
// ================================================================
const goToPage = (page) => {
    if (page === '...')
        return;
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
    loadItems();
};
const handleSearch = () => {
    currentPage.value = 1;
    loadItems();
};
const handleFilterChange = () => {
    currentPage.value = 1;
    loadItems();
};
const handlePageSizeChange = () => {
    currentPage.value = 1;
    loadItems();
};
const clearFilters = () => {
    searchQuery.value = '';
    filterCategory.value = '';
    filterStatus.value = '';
    filterUOM.value = '';
    currentPage.value = 1;
    loadItems();
    showToastMessage('Filters cleared', 'info');
};
// ================================================================
// LOAD DATA
// ================================================================
const loadCategories = async () => {
    try {
        const response = await itemService.getCategories();
        if (response.success) {
            categories.value = response.data;
        }
        else {
            showToastMessage(response.error || 'Failed to load categories', 'error');
        }
    }
    catch (error) {
        console.error('Load categories error:', error);
        showToastMessage('Failed to load categories', 'error');
    }
};
const loadUOMs = async () => {
    try {
        const response = await itemService.getUOMs();
        if (response.success) {
            uomList.value = response.data;
        }
        else {
            showToastMessage(response.error || 'Failed to load UOMs', 'error');
        }
    }
    catch (error) {
        console.error('Load UOMs error:', error);
        showToastMessage('Failed to load UOMs', 'error');
    }
};
const loadItems = async () => {
    loading.value = true;
    try {
        let categoryId = undefined;
        if (filterCategory.value) {
            const category = categories.value.find(c => c.name === filterCategory.value);
            categoryId = category?.categoryId || category?.id;
        }
        let uomId = undefined;
        if (filterUOM.value) {
            const uom = uomList.value.find(u => u.code === filterUOM.value);
            uomId = uom?.uomId || uom?.id;
        }
        const response = await itemService.getItems({
            page: currentPage.value,
            limit: itemsPerPage.value,
            search: searchQuery.value || undefined,
            categoryId: categoryId,
            status: filterStatus.value || undefined,
            uomId: uomId
        });
        if (response.success) {
            // ✅ Items from response.data.items
            items.value = response.data.items || [];
            // ✅ Total from response.data.pagination.total
            totalItems.value = response.data.pagination?.total || response.data.total || response.data.items?.length || 0;
            // ✅ Total pages from response.data.pagination.totalPages
            totalPagesFromServer.value = response.data.pagination?.totalPages || 1;
            // If current page is beyond total pages, go to last page
            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value;
                // Reload with corrected page
                await loadItems();
                return;
            }
        }
        else {
            showToastMessage(response.error || 'Failed to load items', 'error');
        }
    }
    catch (error) {
        console.error('Load items error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to load items', 'error');
    }
    finally {
        loading.value = false;
    }
};
// ================================================================
// DOWNLOAD TEMPLATE CSV
// ================================================================
const downloadTemplate = () => {
    const headers = [
        'name',
        'standardName',
        'description',
        'brand',
        'model',
        'barcode',
        'categoryName',
        'uomCode',
        'conversionUomCode',
        'conversionValue',
        'costPrice',
        'specText'
    ];
    const sampleData = [
        {
            name: 'Sample Item 1',
            standardName: 'Standard Name 1',
            description: 'This is a sample description for the item',
            brand: 'BrandX',
            model: 'Model-100',
            barcode: '1234567890123',
            categoryName: 'Electronics',
            uomCode: 'Each',
            conversionUomCode: 'Dozen',
            conversionValue: '12',
            costPrice: '25.50',
            specText: '<p><strong>Sample specifications</strong></p><ul><li>Feature 1</li><li>Feature 2</li></ul>'
        },
        {
            name: 'Sample Item 2',
            standardName: 'Standard Name 2',
            description: 'Another sample item description',
            brand: 'BrandY',
            model: 'Model-200',
            barcode: '9876543210987',
            categoryName: 'Chemicals',
            uomCode: 'KG',
            conversionUomCode: 'L',
            conversionValue: '1.5',
            costPrice: '45.75',
            specText: '<p><strong>Chemical specifications</strong></p><p>Purity: 99%</p>'
        }
    ];
    let csvContent = headers.join(',') + '\n';
    sampleData.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] || '';
            if (header === 'barcode') {
                value = `="${value}"`;
            }
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `item_import_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToastMessage('Template CSV downloaded successfully!', 'success');
};
// ================================================================
// SAVE ITEM - COMPLETE FIXED VERSION
// ================================================================
const saveItem = async () => {
    savingItem.value = true;
    try {
        // 🔥 Handle conversion properly
        let conversionUomId = itemForm.value.conversionUomId || null;
        let conversionValue = parseFloat(itemForm.value.conversionValue) || 0;
        // If conversionUomId is empty string or null, set to null
        if (!conversionUomId || conversionUomId === '') {
            conversionUomId = null;
            conversionValue = 0;
        }
        else {
            const uomIdInt = parseInt(itemForm.value.uomId);
            const convUomIdInt = parseInt(conversionUomId);
            // If conversion UOM is same as base UOM, set value to 1
            if (convUomIdInt === uomIdInt) {
                conversionValue = 1;
            }
        }
        console.log('📤 Saving with conversion:', {
            uomId: itemForm.value.uomId,
            conversionUomId: conversionUomId,
            conversionValue: conversionValue,
        });
        const formData = {
            name: itemForm.value.name,
            standardName: itemForm.value.standardName || null,
            description: itemForm.value.description || null,
            brand: itemForm.value.brand || null,
            model: itemForm.value.model || null,
            barcode: itemForm.value.barcode || null,
            categoryId: itemForm.value.categoryId ? parseInt(itemForm.value.categoryId) : null,
            uomId: parseInt(itemForm.value.uomId),
            conversionUomId: conversionUomId,
            conversionValue: conversionValue,
            costPrice: itemForm.value.costPrice || 0,
            specType: specType.value,
        };
        if (specType.value === 'text') {
            formData.specText = itemForm.value.specText || null;
            formData.specPdfName = null;
            formData.specPdfSize = null;
            formData.specPdfUrl = null;
        }
        else {
            formData.specText = null;
            if (itemForm.value.specPdfFile) {
                formData.specPdfName = itemForm.value.specPdfFile.name;
                formData.specPdfSize = formatFileSize(itemForm.value.specPdfFile.size);
            }
        }
        let response;
        const itemId = editingItem.value?.itemId || editingItem.value?.id;
        if (editingItem.value) {
            // 🔥 UPDATE existing item
            console.log('🔄 Updating item:', itemId, formData);
            response = await itemService.updateItem(itemId, formData);
            if (response.success) {
                showToastMessage('Item updated successfully!', 'success');
                // Upload PDF if exists
                if (itemForm.value.specPdfFile && specType.value === 'pdf') {
                    await uploadSpecificationFile(itemId, itemForm.value.specPdfFile);
                }
                await loadItems();
                closeItemModal();
            }
            else {
                showToastMessage(response.error || 'Failed to update item', 'error');
            }
        }
        else {
            // 🔥 CREATE new item
            console.log('📤 Creating new item:', formData);
            response = await itemService.createItem(formData);
            if (response.success) {
                showToastMessage('Item added successfully!', 'success');
                const newItemId = response.data.itemId || response.data.id;
                // Upload PDF if exists
                if (itemForm.value.specPdfFile && specType.value === 'pdf') {
                    await uploadSpecificationFile(newItemId, itemForm.value.specPdfFile);
                }
                await loadItems();
                closeItemModal();
            }
            else {
                showToastMessage(response.error || 'Failed to create item', 'error');
            }
        }
    }
    catch (error) {
        console.error('Save item error:', error);
        showToastMessage(error.response?.data?.error || error.message || 'Failed to save item', 'error');
    }
    finally {
        savingItem.value = false;
    }
};
const uploadSpecificationFile = async (itemId, file) => {
    try {
        const response = await itemService.uploadSpecification(itemId, file);
        if (!response.success) {
            showToastMessage(response.error || 'Failed to upload specification', 'error');
        }
    }
    catch (error) {
        console.error('Upload specification error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to upload specification', 'error');
    }
};
// ================================================================
// DEACTIVATE ITEM
// ================================================================
const confirmDeactivate = async () => {
    if (deactivateItem.value) {
        try {
            const newStatus = deactivateItem.value.status === 'Active' ? 'Inactive' : 'Active';
            const itemId = deactivateItem.value.itemId;
            let response;
            if (newStatus === 'Active') {
                response = await itemService.activateItem(itemId);
            }
            else {
                response = await itemService.deactivateItem(itemId);
            }
            if (response.success) {
                showToastMessage(`Item "${deactivateItem.value.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`, 'success');
                await loadItems();
                closeDeactivateModal();
            }
            else {
                showToastMessage(response.error || 'Failed to change status', 'error');
            }
        }
        catch (error) {
            console.error('Status change error:', error);
            showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
        }
    }
};
// ================================================================
// CATEGORY CRUD
// ================================================================
const confirmSaveCategory = async () => {
    const catName = categoryForm.value.name.trim();
    if (!catName)
        return;
    try {
        if (editingCategory.value) {
            const response = await itemService.updateCategory(editingCategory.value.categoryId, {
                name: catName,
                status: categoryForm.value.status
            });
            if (response.success) {
                showToastMessage('Category updated!', 'success');
                await loadCategories();
                await loadItems();
                closeCategoryModal();
            }
            else {
                showToastMessage(response.error || 'Failed to update category', 'error');
            }
        }
        else {
            const exists = categories.value.some(c => c.name === catName);
            if (exists) {
                categoryExists.value = true;
                return;
            }
            const response = await itemService.createCategory({ name: catName });
            if (response.success) {
                showToastMessage(`Category "${catName}" added!`, 'success');
                await loadCategories();
                await loadItems();
                closeCategoryModal();
            }
            else {
                showToastMessage(response.error || 'Failed to add category', 'error');
            }
        }
    }
    catch (error) {
        console.error('Category save error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to save category', 'error');
    }
};
const toggleCategoryStatus = async (cat) => {
    try {
        const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
        const response = await itemService.updateCategory(cat.categoryId, { status: newStatus });
        if (response.success) {
            showToastMessage(`Category "${cat.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
            await loadCategories();
            await loadItems();
        }
        else {
            showToastMessage(response.error || 'Failed to change status', 'error');
        }
    }
    catch (error) {
        console.error('Category status error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
    }
};
// ================================================================
// UOM CRUD
// ================================================================
const saveUOM = async () => {
    const code = uomForm.value.code.trim();
    const name = uomForm.value.name.trim();
    if (!code || !name) {
        showToastMessage('Please enter both code and name', 'error');
        return;
    }
    try {
        if (editingUOM.value) {
            const response = await itemService.updateUOM(editingUOM.value.uomId, { name });
            if (response.success) {
                showToastMessage('UOM updated!', 'success');
                await loadUOMs();
                await loadItems();
                closeUOMModal();
            }
            else {
                showToastMessage(response.error || 'Failed to update UOM', 'error');
            }
        }
        else {
            const exists = uomList.value.some(u => u.code === code);
            if (exists) {
                showToastMessage(`UOM "${code}" already exists`, 'error');
                return;
            }
            const response = await itemService.createUOM({ code, name });
            if (response.success) {
                showToastMessage(`UOM "${code}" added!`, 'success');
                await loadUOMs();
                await loadItems();
                closeUOMModal();
            }
            else {
                showToastMessage(response.error || 'Failed to add UOM', 'error');
            }
        }
    }
    catch (error) {
        console.error('UOM save error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to save UOM', 'error');
    }
};
const toggleUOMStatus = async (uom) => {
    try {
        const newStatus = uom.status === 'Active' ? 'Inactive' : 'Active';
        const response = await itemService.updateUOM(uom.uomId, { status: newStatus });
        if (response.success) {
            showToastMessage(`UOM "${uom.code}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
            await loadUOMs();
            await loadItems();
        }
        else {
            showToastMessage(response.error || 'Failed to change status', 'error');
        }
    }
    catch (error) {
        console.error('UOM status error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
    }
};
// ================================================================
// EXPORT
// ================================================================
const exportSelectedReport = async () => {
    exporting.value = true;
    try {
        let categoryId = undefined;
        if (filterCategory.value) {
            const category = categories.value.find(c => c.name === filterCategory.value);
            categoryId = category?.categoryId || category?.id;
        }
        const params = {
            categoryId: categoryId,
            status: filterStatus.value || undefined,
            format: exportFormat.value || 'xlsx', // 'xlsx' or 'csv'
        };
        const result = await itemService.downloadExport(params);
        if (result.success) {
            showToastMessage('Export completed successfully!', 'success');
        }
        else {
            showToastMessage(result.error || 'Failed to export', 'error');
        }
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage(error.message || 'Failed to export', 'error');
    }
    finally {
        exporting.value = false;
        closeExportModal();
    }
};
// ================================================================
// IMPORT
// ================================================================
const openImportModal = () => {
    showImportModal.value = true;
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
    importProgress.value = {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        remaining: 0,
        percentage: 0
    };
};
const closeImportModal = () => {
    showImportModal.value = false;
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
    importing.value = false;
    importProgress.value = {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        remaining: 0,
        percentage: 0
    };
};
const triggerCsvUpload = () => {
    csvFileInput.value.click();
};
const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        csvFile.value = file;
        parseCsvFile(file);
    }
    else {
        showToastMessage('Please upload a valid CSV file', 'error');
    }
    event.target.value = '';
};
const handleCsvDrop = (event) => {
    isDragOver.value = false;
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        csvFile.value = file;
        parseCsvFile(file);
    }
    else {
        showToastMessage('Please upload a valid CSV file', 'error');
    }
};
const parseCsvFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                showToastMessage('CSV file must contain headers and at least one data row', 'error');
                return;
            }
            const headers = parseCSVLine(lines[0]);
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                const obj = {};
                headers.forEach((h, idx) => {
                    let value = values[idx] || '';
                    value = value.trim();
                    if (h === 'barcode' && value) {
                        value = value.replace(/[^0-9]/g, '');
                    }
                    if (['conversionValue', 'costPrice'].includes(h) && value) {
                        value = parseFloat(value) || 0;
                    }
                    obj[h] = value;
                });
                if (obj.name) {
                    data.push(obj);
                }
            }
            importPreviewData.value = data;
            showToastMessage(`Successfully parsed ${data.length} items from CSV`, 'success');
        }
        catch (error) {
            console.error('CSV parse error:', error);
            showToastMessage('Failed to parse CSV file. Please check the format.', 'error');
        }
    };
    reader.readAsText(file);
};
const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};
const processImport = async () => {
    if (!csvFile.value || importPreviewData.value.length === 0) {
        showToastMessage('No data to import', 'error');
        return;
    }
    importing.value = true;
    importResults.value = null;
    const totalItems = importPreviewData.value.length;
    importProgress.value = {
        total: totalItems,
        processed: 0,
        success: 0,
        failed: 0,
        remaining: totalItems,
        percentage: 0
    };
    try {
        const response = await itemService.importItems(importPreviewData.value);
        if (response.success) {
            importResults.value = {
                success: response.data.success,
                failed: response.data.failed,
                total: response.data.total,
                errors: response.data.results
                    .filter(r => !r.success)
                    .map(r => `${r.data?.name || 'Unknown'}: ${r.error}`)
            };
            importProgress.value = {
                total: response.data.total,
                processed: response.data.total,
                success: response.data.success,
                failed: response.data.failed,
                remaining: 0,
                percentage: 100
            };
            showToastMessage(response.message, 'success');
            await loadItems();
            await loadCategories();
            await loadUOMs();
            setTimeout(() => {
                closeImportModal();
            }, 2000);
        }
        else {
            showToastMessage(response.error || 'Failed to import items', 'error');
            importResults.value = {
                success: 0,
                failed: totalItems,
                total: totalItems,
                errors: [response.error || 'Import failed']
            };
            importing.value = false;
        }
    }
    catch (error) {
        console.error('Import error:', error);
        showToastMessage(error.response?.data?.error || 'Failed to import items', 'error');
        importResults.value = {
            success: 0,
            failed: importPreviewData.value.length,
            total: importPreviewData.value.length,
            errors: [error.message || 'Unknown error occurred']
        };
        importing.value = false;
    }
};
// ================================================================
// UI HELPERS
// ================================================================
const onUOMChange = () => {
    if (itemForm.value.uomId) {
        // Reset conversion when UOM changes
        const uomId = parseInt(itemForm.value.uomId);
        const currentConvUomId = itemForm.value.conversionUomId ? parseInt(itemForm.value.conversionUomId) : null;
        // If conversion UOM is same as new UOM or not set, clear it
        if (!currentConvUomId || currentConvUomId === uomId) {
            itemForm.value.conversionUomId = null;
            itemForm.value.conversionValue = 0;
        }
    }
};
const onConversionUnitChange = () => {
    if (!itemForm.value.conversionUomId || itemForm.value.conversionUomId === itemForm.value.uomId) {
        itemForm.value.conversionValue = 1;
    }
};
const onQuillUpdate = (content) => {
    itemForm.value.specText = content;
};
const openAddItem = () => {
    editingItem.value = null;
    specType.value = 'text';
    itemForm.value = {
        name: '',
        standardName: '',
        description: '',
        brand: '',
        model: '',
        barcode: '',
        categoryId: '',
        uomId: '',
        conversionUomId: '',
        conversionValue: 0,
        costPrice: 0,
        specType: 'text',
        specText: '',
        specPdfFile: null,
        specPdfName: '',
        specPdfSize: ''
    };
    showItemModal.value = true;
};
const openEditItem = (item) => {
    editingItem.value = item;
    if (item.specType === 'pdf' && item.specPdfUrl) {
        specType.value = 'pdf';
    }
    else {
        specType.value = 'text';
    }
    itemForm.value = {
        name: item.name,
        standardName: item.standardName || '',
        description: item.description || '',
        brand: item.brand || '',
        model: item.model || '',
        barcode: item.barcode || '',
        categoryId: item.categoryId || '',
        uomId: item.uomId || '',
        conversionUomId: item.conversionUomId || '',
        conversionValue: item.conversionValue || 0,
        costPrice: item.costPrice || 0,
        specType: item.specType || 'text',
        specText: item.specText || '',
        specPdfFile: null,
        specPdfName: item.specPdfName || '',
        specPdfSize: item.specPdfSize || ''
    };
    showItemModal.value = true;
};
const closeItemModal = () => {
    showItemModal.value = false;
    editingItem.value = null;
};
const openDeactivateModal = (item) => {
    deactivateItem.value = item;
    showDeactivateModal.value = true;
};
const closeDeactivateModal = () => {
    showDeactivateModal.value = false;
    deactivateItem.value = null;
};
const openPdfNewTab = (item) => {
    if (item.specPdfUrl) {
        window.open(item.specPdfUrl, '_blank');
    }
    else {
        showToastMessage(`Opening ${item.specPdfName}...`, 'success');
    }
};
const triggerFileUpload = () => {
    pdfFileInput.value.click();
};
const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        itemForm.value.specPdfFile = file;
        itemForm.value.specPdfName = file.name;
        itemForm.value.specPdfSize = formatFileSize(file.size);
        showToastMessage('PDF uploaded successfully!', 'success');
    }
    else {
        showToastMessage('Please upload a valid PDF file', 'error');
    }
    event.target.value = '';
};
const removePdfFile = () => {
    itemForm.value.specPdfFile = null;
    itemForm.value.specPdfName = '';
    itemForm.value.specPdfSize = '';
};
// -- Category Modal --
const openAddCategoryModal = () => {
    editingCategory.value = null;
    categoryForm.value = { name: '', status: 'Active' };
    categoryExists.value = false;
    showCategoryModal.value = true;
};
const openEditCategoryModal = (cat) => {
    editingCategory.value = cat;
    categoryForm.value = { name: cat.name, status: cat.status || 'Active' };
    categoryExists.value = false;
    showCategoryModal.value = true;
};
const closeCategoryModal = () => {
    showCategoryModal.value = false;
    editingCategory.value = null;
    categoryForm.value = { name: '', status: 'Active' };
    categoryExists.value = false;
};
// -- UOM Modal --
const openAddUOMModal = () => {
    editingUOM.value = null;
    uomForm.value = { code: '', name: '', status: 'Active' };
    showUOMModal.value = true;
};
const openEditUOMModal = (uom) => {
    editingUOM.value = uom;
    uomForm.value = { code: uom.code, name: uom.name, status: uom.status || 'Active' };
    showUOMModal.value = true;
};
const closeUOMModal = () => {
    showUOMModal.value = false;
    editingUOM.value = null;
};
// -- Export --
const openExportModal = () => {
    showExportModal.value = true;
};
const closeExportModal = () => {
    showExportModal.value = false;
};
// -- Remove CSV --
const removeCsvFile = () => {
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
};
// -- Toast --
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 4000);
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await loadCategories();
    await loadUOMs();
    await loadItems();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-import']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-import']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-pdf-open']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['tab']} */ ;
/** @type {__VLS_StyleScopedClasses['tab']} */ ;
/** @type {__VLS_StyleScopedClasses['item-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-table']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-table']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['category-table']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['deactivate-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-option']} */ ;
/** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['quill-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['quill-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['quill-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['csv-format-list']} */ ;
/** @type {__VLS_StyleScopedClasses['import-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['import-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['import-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
/** @type {__VLS_StyleScopedClasses['result-errors']} */ ;
/** @type {__VLS_StyleScopedClasses['result-errors']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-type-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['item-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tab']} */ ;
/** @type {__VLS_StyleScopedClasses['item-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-table']} */ ;
/** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['page-numbers']} */ ;
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
    placeholder: "Search items...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openImportModal) },
    ...{ class: "btn-import" },
    disabled: (__VLS_ctx.importing),
});
/** @type {__VLS_StyleScopedClasses['btn-import']} */ ;
if (__VLS_ctx.importing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.importing ? "Importing..." : "Import");
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
    disabled: (__VLS_ctx.exporting),
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
if (__VLS_ctx.exporting) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.exporting ? "Exporting..." : "Export");
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddItem) },
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs" },
});
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeTab = tab.key;
                // @ts-ignore
                [totalItems, handleSearch, searchQuery, openImportModal, importing, importing, importing, openExportModal, exporting, exporting, exporting, openAddItem, tabs, activeTab,];
            } },
        key: (tab.key),
        ...{ class: (['tab', { active: __VLS_ctx.activeTab === tab.key }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab']} */ ;
    (tab.label);
    if (tab.key === 'categories' && __VLS_ctx.categories.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "tab-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
        (__VLS_ctx.categories.length);
    }
    if (tab.key === 'uom' && __VLS_ctx.uomList.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "tab-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
        (__VLS_ctx.uomList.length);
    }
    // @ts-ignore
    [activeTab, categories, categories, uomList, uomList,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-content" },
});
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
if (__VLS_ctx.activeTab === 'items') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "items-tab" },
    });
    /** @type {__VLS_StyleScopedClasses['items-tab']} */ ;
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
        [activeTab, handleFilterChange, filterCategory, activeCategoryNames,];
    }
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
        value: "Active",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Inactive",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Discontinued",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleFilterChange) },
        value: (__VLS_ctx.filterUOM),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [uom] of __VLS_vFor((__VLS_ctx.activeUOMs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (uom.code),
            value: (uom.code),
        });
        (uom.code);
        // @ts-ignore
        [handleFilterChange, handleFilterChange, filterStatus, filterUOM, activeUOMs,];
    }
    if (__VLS_ctx.hasActiveFilters) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.clearFilters) },
            ...{ class: "btn-clear-filters" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
    }
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
    else if (__VLS_ctx.items.length === 0) {
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
            ...{ onClick: (__VLS_ctx.openAddItem) },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-container" },
        });
        /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "item-table" },
        });
        /** @type {__VLS_StyleScopedClasses['item-table']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [item] of __VLS_vFor((__VLS_ctx.items))) {
            (item.itemId || item.id);
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: ({
                        'expanded-row': __VLS_ctx.expandedRow === (item.itemId || item.id),
                        'inactive-row': item.status === 'Inactive',
                        'discontinued-row': item.status === 'Discontinued'
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['inactive-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['discontinued-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'items'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.items.length === 0))
                            return;
                        __VLS_ctx.toggleExpand(item.itemId || item.id);
                        // @ts-ignore
                        [openAddItem, hasActiveFilters, clearFilters, loading, items, items, expandedRow, toggleExpand,];
                    } },
                ...{ class: "expand-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
            (__VLS_ctx.expandedRow === (item.itemId || item.id) ? "▼" : "▶");
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "sku" },
            });
            /** @type {__VLS_StyleScopedClasses['sku']} */ ;
            (item.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-info" },
            });
            /** @type {__VLS_StyleScopedClasses['item-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "common-name" },
            });
            /** @type {__VLS_StyleScopedClasses['common-name']} */ ;
            (item.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "standard-name" },
            });
            /** @type {__VLS_StyleScopedClasses['standard-name']} */ ;
            (item.standardName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.category?.name || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.uom?.code || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['status-badge', item.status.toLowerCase()]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (item.status);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "action-buttons" },
            });
            /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'items'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.items.length === 0))
                            return;
                        __VLS_ctx.openEditItem(item);
                        // @ts-ignore
                        [expandedRow, openEditItem,];
                    } },
                ...{ class: "icon-btn" },
                title: "Edit",
            });
            /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'items'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.items.length === 0))
                            return;
                        __VLS_ctx.openDeactivateModal(item);
                        // @ts-ignore
                        [openDeactivateModal,];
                    } },
                ...{ class: "icon-btn" },
                title: (item.status === 'Active' ? 'Deactivate' : 'Activate'),
            });
            /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
            (item.status === 'Active' ? '⏸️' : '▶️');
            if (__VLS_ctx.expandedRow === (item.itemId || item.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    ...{ class: "detail-expand-row" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    colspan: "7",
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
                (item.code);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.standardName || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.description || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.brand || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.model || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.barcode || '-');
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
                (item.uom?.code || item.uom || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                    ...{ class: ({
                            'no-conversion': !__VLS_ctx.hasConversion(item),
                            'base-unit': __VLS_ctx.isSelfConversion(item),
                            'has-conversion': __VLS_ctx.hasConversion(item) && !__VLS_ctx.isSelfConversion(item)
                        }) },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['no-conversion']} */ ;
                /** @type {__VLS_StyleScopedClasses['base-unit']} */ ;
                /** @type {__VLS_StyleScopedClasses['has-conversion']} */ ;
                (__VLS_ctx.getConversionDisplay(item));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                    ...{ class: ({
                            'no-conversion': !__VLS_ctx.hasConversion(item),
                            'base-unit': __VLS_ctx.isSelfConversion(item)
                        }) },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['no-conversion']} */ ;
                /** @type {__VLS_StyleScopedClasses['base-unit']} */ ;
                (__VLS_ctx.getConversionUnitDisplay(item));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                    ...{ class: ({
                            'no-conversion': !__VLS_ctx.hasConversion(item),
                            'base-unit': __VLS_ctx.isSelfConversion(item)
                        }) },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['no-conversion']} */ ;
                /** @type {__VLS_StyleScopedClasses['base-unit']} */ ;
                (__VLS_ctx.getConversionValueDisplay(item));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (__VLS_ctx.formatCurrency(item.costPrice));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-card full-width" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
                /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
                if (item.specType === 'text' && item.specText) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "spec-text-content" },
                    });
                    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (item.specText) }, null, null);
                    /** @type {__VLS_StyleScopedClasses['spec-text-content']} */ ;
                }
                if (item.specType === 'pdf' && item.specPdfUrl) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "spec-pdf-content" },
                    });
                    /** @type {__VLS_StyleScopedClasses['spec-pdf-content']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "pdf-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['pdf-icon']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "pdf-name" },
                    });
                    /** @type {__VLS_StyleScopedClasses['pdf-name']} */ ;
                    (item.specPdfName || 'Specification Document.pdf');
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "pdf-size" },
                    });
                    /** @type {__VLS_StyleScopedClasses['pdf-size']} */ ;
                    (item.specPdfSize || '250 KB');
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.activeTab === 'items'))
                                    return;
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.items.length === 0))
                                    return;
                                if (!(__VLS_ctx.expandedRow === (item.itemId || item.id)))
                                    return;
                                if (!(item.specType === 'pdf' && item.specPdfUrl))
                                    return;
                                __VLS_ctx.openPdfNewTab(item);
                                // @ts-ignore
                                [expandedRow, hasConversion, hasConversion, hasConversion, hasConversion, isSelfConversion, isSelfConversion, isSelfConversion, isSelfConversion, getConversionDisplay, getConversionUnitDisplay, getConversionValueDisplay, formatCurrency, openPdfNewTab,];
                            } },
                        ...{ class: "btn-pdf-open" },
                    });
                    /** @type {__VLS_StyleScopedClasses['btn-pdf-open']} */ ;
                }
                if (!item.specText && !item.specPdfUrl) {
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
        (__VLS_ctx.items.length);
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
                    if (!(__VLS_ctx.activeTab === 'items'))
                        return;
                    if (!(__VLS_ctx.totalItems > 0))
                        return;
                    __VLS_ctx.goToPage(__VLS_ctx.currentPage - 1);
                    // @ts-ignore
                    [totalItems, totalItems, items, currentPage, currentPage, totalPages, goToPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.currentPage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'items'))
                        return;
                    if (!(__VLS_ctx.totalItems > 0))
                        return;
                    __VLS_ctx.goToPage(__VLS_ctx.currentPage + 1);
                    // @ts-ignore
                    [currentPage, currentPage, goToPage,];
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (100),
        });
    }
}
if (__VLS_ctx.activeTab === 'categories') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "categories-tab" },
    });
    /** @type {__VLS_StyleScopedClasses['categories-tab']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openAddCategoryModal) },
        ...{ class: "btn-add" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "category-table" },
    });
    /** @type {__VLS_StyleScopedClasses['category-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.categories.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "4",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-content" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openAddCategoryModal) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    }
    for (const [cat, index] of __VLS_vFor((__VLS_ctx.paginatedCategories))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (cat.categoryId || cat.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        ((__VLS_ctx.categoryPage - 1) * __VLS_ctx.categoryPageSize + index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (cat.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', cat.status?.toLowerCase() || 'active']) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (cat.status || 'Active');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'categories'))
                        return;
                    __VLS_ctx.openEditCategoryModal(cat);
                    // @ts-ignore
                    [activeTab, categories, currentPage, totalPages, handlePageSizeChange, itemsPerPage, openAddCategoryModal, openAddCategoryModal, paginatedCategories, categoryPage, categoryPageSize, openEditCategoryModal,];
                } },
            ...{ class: "icon-btn" },
            title: "Edit",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'categories'))
                        return;
                    __VLS_ctx.toggleCategoryStatus(cat);
                    // @ts-ignore
                    [toggleCategoryStatus,];
                } },
            ...{ class: "icon-btn" },
            title: (cat.status === 'Active' ? 'Deactivate' : 'Activate'),
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        (cat.status === 'Active' ? '⏸️' : '▶️');
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.categories.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'categories'))
                        return;
                    if (!(__VLS_ctx.categories.length > 0))
                        return;
                    __VLS_ctx.categoryPage--;
                    // @ts-ignore
                    [categories, categoryPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.categoryPage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.categoryPage);
        (__VLS_ctx.categoryTotalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'categories'))
                        return;
                    if (!(__VLS_ctx.categories.length > 0))
                        return;
                    __VLS_ctx.categoryPage++;
                    // @ts-ignore
                    [categoryPage, categoryPage, categoryPage, categoryTotalPages,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.categoryPage === __VLS_ctx.categoryTotalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.categoryPageSize),
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
    }
}
if (__VLS_ctx.activeTab === 'uom') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "uom-tab" },
    });
    /** @type {__VLS_StyleScopedClasses['uom-tab']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openAddUOMModal) },
        ...{ class: "btn-add" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "uom-table" },
    });
    /** @type {__VLS_StyleScopedClasses['uom-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.uomList.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "5",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-content" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openAddUOMModal) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    }
    for (const [uom, index] of __VLS_vFor((__VLS_ctx.paginatedUOMs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (uom.uomId || uom.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        ((__VLS_ctx.uomPage - 1) * __VLS_ctx.uomPageSize + index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "code" },
        });
        /** @type {__VLS_StyleScopedClasses['code']} */ ;
        (uom.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (uom.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', uom.status?.toLowerCase() || 'active']) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (uom.status || 'Active');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'uom'))
                        return;
                    __VLS_ctx.openEditUOMModal(uom);
                    // @ts-ignore
                    [activeTab, uomList, categoryPage, categoryPageSize, categoryTotalPages, openAddUOMModal, openAddUOMModal, paginatedUOMs, uomPage, uomPageSize, openEditUOMModal,];
                } },
            ...{ class: "icon-btn" },
            title: "Edit",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'uom'))
                        return;
                    __VLS_ctx.toggleUOMStatus(uom);
                    // @ts-ignore
                    [toggleUOMStatus,];
                } },
            ...{ class: "icon-btn" },
            title: (uom.status === 'Active' ? 'Deactivate' : 'Activate'),
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        (uom.status === 'Active' ? '⏸️' : '▶️');
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.uomList.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'uom'))
                        return;
                    if (!(__VLS_ctx.uomList.length > 0))
                        return;
                    __VLS_ctx.uomPage--;
                    // @ts-ignore
                    [uomList, uomPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.uomPage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.uomPage);
        (__VLS_ctx.uomTotalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'uom'))
                        return;
                    if (!(__VLS_ctx.uomList.length > 0))
                        return;
                    __VLS_ctx.uomPage++;
                    // @ts-ignore
                    [uomPage, uomPage, uomPage, uomTotalPages,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.uomPage === __VLS_ctx.uomTotalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.uomPageSize),
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
    }
}
if (__VLS_ctx.showItemModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeItemModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container item-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['item-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingItem ? '✏️ Edit Item' : '➕ Add New Item');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeItemModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveItem) },
        ...{ class: "item-form" },
    });
    /** @type {__VLS_StyleScopedClasses['item-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.itemForm.name),
        type: "text",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.itemForm.standardName),
        type: "text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.itemForm.description),
        rows: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.itemForm.brand),
        type: "text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.itemForm.model),
        type: "text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.itemForm.barcode),
        type: "text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.itemForm.categoryId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [cat] of __VLS_vFor((__VLS_ctx.activeCategories))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (cat.categoryId),
            value: (cat.categoryId),
        });
        (cat.name);
        // @ts-ignore
        [uomPage, uomPageSize, uomTotalPages, showItemModal, closeItemModal, closeItemModal, editingItem, saveItem, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, activeCategories,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onUOMChange) },
        value: (__VLS_ctx.itemForm.uomId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [uom] of __VLS_vFor((__VLS_ctx.activeUOMs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (uom.uomId),
            value: (uom.uomId),
        });
        (uom.code);
        (uom.name);
        // @ts-ignore
        [activeUOMs, itemForm, onUOMChange,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onConversionUnitChange) },
        value: (__VLS_ctx.itemForm.conversionUomId),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [uom] of __VLS_vFor((__VLS_ctx.activeUOMs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (uom.uomId),
            value: (uom.uomId),
        });
        (uom.code);
        (uom.name);
        // @ts-ignore
        [activeUOMs, itemForm, onConversionUnitChange,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.01",
        min: "0",
        placeholder: "e.g., 165",
    });
    (__VLS_ctx.itemForm.conversionValue);
    if (__VLS_ctx.itemForm.conversionUomId && __VLS_ctx.itemForm.conversionValue) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
        (__VLS_ctx.itemForm.conversionValue);
        (__VLS_ctx.getUOMCode(__VLS_ctx.itemForm.conversionUomId));
        (__VLS_ctx.getUOMCode(__VLS_ctx.itemForm.uomId));
    }
    else if (__VLS_ctx.itemForm.uomId && !__VLS_ctx.itemForm.conversionUomId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.01",
        min: "0",
    });
    (__VLS_ctx.itemForm.costPrice);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spec-type-selector" },
    });
    /** @type {__VLS_StyleScopedClasses['spec-type-selector']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "spec-option" },
    });
    /** @type {__VLS_StyleScopedClasses['spec-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "text",
    });
    (__VLS_ctx.specType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "spec-option" },
    });
    /** @type {__VLS_StyleScopedClasses['spec-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "pdf",
    });
    (__VLS_ctx.specType);
    if (__VLS_ctx.specType === 'text') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        let __VLS_0;
        /** @ts-ignore @type {typeof __VLS_components.ClientOnly | typeof __VLS_components.ClientOnly} */
        ClientOnly;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
        const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
        const { default: __VLS_5 } = __VLS_3.slots;
        let __VLS_6;
        /** @ts-ignore @type {typeof __VLS_components.QuillEditor} */
        QuillEditor;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            ...{ 'onUpdate:content': {} },
            content: (__VLS_ctx.itemForm.specText),
            contentType: "html",
            theme: "snow",
            toolbar: (__VLS_ctx.quillToolbar),
            ...{ class: "quill-editor" },
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onUpdate:content': {} },
            content: (__VLS_ctx.itemForm.specText),
            contentType: "html",
            theme: "snow",
            toolbar: (__VLS_ctx.quillToolbar),
            ...{ class: "quill-editor" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_11;
        const __VLS_12 = ({ 'update:content': {} },
            { 'onUpdate:content': (__VLS_ctx.onQuillUpdate) });
        /** @type {__VLS_StyleScopedClasses['quill-editor']} */ ;
        var __VLS_9;
        var __VLS_10;
        // @ts-ignore
        [itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, itemForm, getUOMCode, getUOMCode, specType, specType, specType, quillToolbar, onQuillUpdate,];
        var __VLS_3;
    }
    if (__VLS_ctx.specType === 'pdf') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (__VLS_ctx.triggerFileUpload) },
            ...{ class: "file-upload-area" },
        });
        /** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
        if (__VLS_ctx.itemForm.specPdfFile) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "file-preview" },
            });
            /** @type {__VLS_StyleScopedClasses['file-preview']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['file-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            (__VLS_ctx.itemForm.specPdfFile.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-size" },
            });
            /** @type {__VLS_StyleScopedClasses['file-size']} */ ;
            (__VLS_ctx.formatFileSize(__VLS_ctx.itemForm.specPdfFile.size));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.removePdfFile) },
                type: "button",
                ...{ class: "remove-file" },
            });
            /** @type {__VLS_StyleScopedClasses['remove-file']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "upload-placeholder" },
            });
            /** @type {__VLS_StyleScopedClasses['upload-placeholder']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "upload-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['upload-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "upload-hint" },
            });
            /** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.handlePdfUpload) },
            type: "file",
            ref: "pdfFileInput",
            accept: ".pdf",
            ...{ style: {} },
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeItemModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveItem) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingItem),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingItem ? 'Saving...' : (__VLS_ctx.editingItem ? 'Update' : 'Add'));
}
if (__VLS_ctx.showDeactivateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDeactivateModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container deactivate-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['deactivate-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.deactivateItem?.status === 'Active' ? '⏸️ Confirm Deactivate' : '▶️ Confirm Activate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeactivateModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-title" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-details" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.deactivateItem?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.deactivateItem?.code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.deactivateItem?.status?.toLowerCase() || 'active']) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.deactivateItem?.status || 'Active');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.getNewStatus(__VLS_ctx.deactivateItem?.status)?.toLowerCase() || 'inactive']) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.getNewStatus(__VLS_ctx.deactivateItem?.status));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    (__VLS_ctx.deactivateItem?.status === 'Active' ? 'deactivate' : 'activate');
    if (__VLS_ctx.deactivateItem?.status === 'Active') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "warning-subtext" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-subtext']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "warning-subtext" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-subtext']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeactivateModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmDeactivate) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.deactivateItem?.status === 'Active' ? 'Deactivate' : 'Activate');
}
if (__VLS_ctx.showCategoryModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeCategoryModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container category-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['category-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingCategory ? '✏️ Edit Category' : '📁 Add New Category');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeCategoryModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.categoryForm.name),
        type: "text",
        required: true,
        placeholder: "Enter category name...",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    if (__VLS_ctx.categoryExists) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-error" },
        });
        /** @type {__VLS_StyleScopedClasses['form-error']} */ ;
        (__VLS_ctx.categoryForm.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeCategoryModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmSaveCategory) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.categoryForm.name.trim()),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.editingCategory ? 'Update' : 'Add');
}
if (__VLS_ctx.showUOMModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeUOMModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container uom-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['uom-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingUOM ? '✏️ Edit UOM' : '📏 Add New UOM');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeUOMModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveUOM) },
        ...{ class: "uom-form" },
    });
    /** @type {__VLS_StyleScopedClasses['uom-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.uomForm.code),
        type: "text",
        required: true,
        placeholder: "e.g., KG, L, Box",
        readonly: (!!__VLS_ctx.editingUOM),
    });
    if (__VLS_ctx.editingUOM) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.uomForm.name),
        type: "text",
        required: true,
        placeholder: "e.g., Kilogram, Liter, Box",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeUOMModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveUOM) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.uomForm.code || !__VLS_ctx.uomForm.name),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.editingUOM ? 'Update' : 'Add');
}
if (__VLS_ctx.showExportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container export-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['export-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "export-options" },
    });
    /** @type {__VLS_StyleScopedClasses['export-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "export-section" },
    });
    /** @type {__VLS_StyleScopedClasses['export-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "export-label" },
    });
    /** @type {__VLS_StyleScopedClasses['export-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "format-options" },
    });
    /** @type {__VLS_StyleScopedClasses['format-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportFormat = 'xlsx';
                // @ts-ignore
                [closeItemModal, editingItem, saveItem, itemForm, itemForm, itemForm, specType, triggerFileUpload, formatFileSize, removePdfFile, handlePdfUpload, savingItem, savingItem, showDeactivateModal, closeDeactivateModal, closeDeactivateModal, closeDeactivateModal, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, deactivateItem, getNewStatus, getNewStatus, confirmDeactivate, showCategoryModal, closeCategoryModal, closeCategoryModal, closeCategoryModal, editingCategory, editingCategory, categoryForm, categoryForm, categoryForm, categoryExists, confirmSaveCategory, showUOMModal, closeUOMModal, closeUOMModal, closeUOMModal, editingUOM, editingUOM, editingUOM, editingUOM, saveUOM, saveUOM, uomForm, uomForm, uomForm, uomForm, showExportModal, closeExportModal, closeExportModal, exportFormat,];
            } },
        ...{ class: "format-option" },
    });
    /** @type {__VLS_StyleScopedClasses['format-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "xlsx",
    });
    (__VLS_ctx.exportFormat);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "format-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['format-desc']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportFormat = 'csv';
                // @ts-ignore
                [exportFormat, exportFormat,];
            } },
        ...{ class: "format-option" },
    });
    /** @type {__VLS_StyleScopedClasses['format-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "csv",
    });
    (__VLS_ctx.exportFormat);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "format-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['format-desc']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "export-section" },
    });
    /** @type {__VLS_StyleScopedClasses['export-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "export-label" },
    });
    /** @type {__VLS_StyleScopedClasses['export-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scope-options" },
    });
    /** @type {__VLS_StyleScopedClasses['scope-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportScope = 'all';
                // @ts-ignore
                [exportFormat, exportScope,];
            } },
        ...{ class: "scope-option" },
    });
    /** @type {__VLS_StyleScopedClasses['scope-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "all",
    });
    (__VLS_ctx.exportScope);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportScope = 'filtered';
                // @ts-ignore
                [exportScope, exportScope,];
            } },
        ...{ class: "scope-option" },
    });
    /** @type {__VLS_StyleScopedClasses['scope-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "filtered",
    });
    (__VLS_ctx.exportScope);
    if (__VLS_ctx.hasActiveFilters) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "scope-desc" },
        });
        /** @type {__VLS_StyleScopedClasses['scope-desc']} */ ;
        (__VLS_ctx.items.length);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportSelectedReport) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.exporting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.exporting ? 'Exporting...' : '📥 Export');
}
if (__VLS_ctx.showImportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && __VLS_ctx.closeImportModal();
                // @ts-ignore
                [importing, exporting, exporting, hasActiveFilters, items, closeExportModal, exportScope, exportSelectedReport, showImportModal, closeImportModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container import-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['import-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && __VLS_ctx.closeImportModal();
                // @ts-ignore
                [importing, closeImportModal,];
            } },
        ...{ class: "modal-close" },
        disabled: (__VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "import-info" },
    });
    /** @type {__VLS_StyleScopedClasses['import-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-box" },
    });
    /** @type {__VLS_StyleScopedClasses['info-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "info-text" },
    });
    /** @type {__VLS_StyleScopedClasses['info-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "csv-format-list" },
    });
    /** @type {__VLS_StyleScopedClasses['csv-format-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadTemplate) },
        ...{ class: "btn-template" },
        disabled: (__VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && __VLS_ctx.triggerCsvUpload();
                // @ts-ignore
                [importing, importing, importing, downloadTemplate, triggerCsvUpload,];
            } },
        ...{ onDragover: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && (__VLS_ctx.isDragOver = true);
                // @ts-ignore
                [importing, isDragOver,];
            } },
        ...{ onDragleave: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && (__VLS_ctx.isDragOver = false);
                // @ts-ignore
                [importing, isDragOver,];
            } },
        ...{ onDrop: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && __VLS_ctx.handleCsvDrop($event);
                // @ts-ignore
                [importing, handleCsvDrop,];
            } },
        ...{ class: "file-upload-area import-upload" },
        ...{ class: ({ 'drag-over': __VLS_ctx.isDragOver, 'disabled': __VLS_ctx.importing }) },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['import-upload']} */ ;
    /** @type {__VLS_StyleScopedClasses['drag-over']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled']} */ ;
    if (__VLS_ctx.csvFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['file-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['file-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.csvFile.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-size" },
        });
        /** @type {__VLS_StyleScopedClasses['file-size']} */ ;
        (__VLS_ctx.formatFileSize(__VLS_ctx.csvFile.size));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showImportModal))
                        return;
                    if (!(__VLS_ctx.csvFile))
                        return;
                    !__VLS_ctx.importing && __VLS_ctx.removeCsvFile();
                    // @ts-ignore
                    [importing, importing, formatFileSize, isDragOver, csvFile, csvFile, csvFile, removeCsvFile,];
                } },
            type: "button",
            ...{ class: "remove-file" },
            disabled: (__VLS_ctx.importing),
        });
        /** @type {__VLS_StyleScopedClasses['remove-file']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "upload-placeholder" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-placeholder']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "upload-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "upload-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "upload-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleCsvUpload) },
        type: "file",
        ref: "csvFileInput",
        accept: ".csv",
        ...{ style: {} },
        disabled: (__VLS_ctx.importing),
    });
    if (__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-progress" },
        });
        /** @type {__VLS_StyleScopedClasses['import-progress']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-info" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.importProgress.processed);
        (__VLS_ctx.importProgress.total);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-fill" },
            ...{ style: ({ width: __VLS_ctx.importProgress.percentage + '%' }) },
        });
        /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-status" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-status']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-success" },
        });
        /** @type {__VLS_StyleScopedClasses['status-success']} */ ;
        (__VLS_ctx.importProgress.success);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-failed" },
        });
        /** @type {__VLS_StyleScopedClasses['status-failed']} */ ;
        (__VLS_ctx.importProgress.failed);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-remaining" },
        });
        /** @type {__VLS_StyleScopedClasses['status-remaining']} */ ;
        (__VLS_ctx.importProgress.remaining);
    }
    if (__VLS_ctx.importPreviewData.length > 0 && !__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['import-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (__VLS_ctx.importPreviewData.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-table-container" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-table-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "preview-table" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [item, index] of __VLS_vFor((__VLS_ctx.importPreviewData.slice(0, 10)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (index),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (index + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.name || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.categoryName || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.uomCode || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.conversionUomCode || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatCurrency(item.costPrice));
            // @ts-ignore
            [importing, importing, importing, importing, formatCurrency, handleCsvUpload, importProgress, importProgress, importProgress, importProgress, importProgress, importProgress, importPreviewData, importPreviewData, importPreviewData,];
        }
        if (__VLS_ctx.importPreviewData.length > 10) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "preview-more" },
            });
            /** @type {__VLS_StyleScopedClasses['preview-more']} */ ;
            (__VLS_ctx.importPreviewData.length - 10);
        }
    }
    if (__VLS_ctx.importResults && !__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-results" },
        });
        /** @type {__VLS_StyleScopedClasses['import-results']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['result-summary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "result-success" },
        });
        /** @type {__VLS_StyleScopedClasses['result-success']} */ ;
        (__VLS_ctx.importResults.success);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "result-failed" },
        });
        /** @type {__VLS_StyleScopedClasses['result-failed']} */ ;
        (__VLS_ctx.importResults.failed);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "result-total" },
        });
        /** @type {__VLS_StyleScopedClasses['result-total']} */ ;
        (__VLS_ctx.importResults.total);
        if (__VLS_ctx.importResults.errors && __VLS_ctx.importResults.errors.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "result-errors" },
            });
            /** @type {__VLS_StyleScopedClasses['result-errors']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
            for (const [err, idx] of __VLS_vFor((__VLS_ctx.importResults.errors.slice(0, 5)))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (idx),
                });
                (err);
                // @ts-ignore
                [importing, importPreviewData, importPreviewData, importResults, importResults, importResults, importResults, importResults, importResults, importResults,];
            }
            if (__VLS_ctx.importResults.errors.length > 5) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
                (__VLS_ctx.importResults.errors.length - 5);
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                !__VLS_ctx.importing && __VLS_ctx.closeImportModal();
                // @ts-ignore
                [importing, closeImportModal, importResults, importResults,];
            } },
        ...{ class: "btn-secondary" },
        disabled: (__VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.processImport) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.csvFile || __VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.importing ? 'Importing...' : 'Import Items');
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[importing, importing, importing, csvFile, processImport, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
