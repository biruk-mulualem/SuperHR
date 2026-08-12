import { ref, computed, onMounted, watch } from "vue";
import balanceService from "@/stores/balanceService";
import { useRouter } from "vue-router";
const router = useRouter();
// ================================================================
// USER DATA
// ================================================================
const getUserData = () => {
    try {
        const data = JSON.parse(localStorage.getItem("user") || "{}");
        return data;
    }
    catch (error) {
        console.error("Error parsing user data:", error);
        return {};
    }
};
const userData = ref(getUserData());
const isAdmin = computed(() => userData.value?.isAdmin || false);
// ================================================================
// STORE DATA
// ================================================================
const stores = ref([]);
const allGroups = ref([]);
const categories = ref([]);
const inventoryItems = ref([]);
const balances = ref([]);
const itemRequests = ref([]);
// ================================================================
// ITEM SELECTION STATE
// ================================================================
const itemSearchQuery = ref("");
const itemCategoryFilter = ref("");
const itemDisplayLimit = ref(10);
const isLoadingItems = ref(false);
const itemSelectContainer = ref(null);
const selectedItemDisplay = ref(null);
// ================================================================
// LOADING STATES
// ================================================================
const isLoading = ref(false);
const isLoadingStores = ref(false);
const isLoadingGroups = ref(false);
const isLoadingRequests = ref(false);
// ================================================================
// STATE
// ================================================================
const searchQuery = ref("");
const filterStore = ref("");
const filterGroup = ref("");
const filterCategory = ref("");
const filterStatus = ref("");
const currentPage = ref(1);
const pageSize = ref(5);
const showBalanceModal = ref(false);
const editingBalance = ref(null);
const showToggleModal = ref(false);
const toggleItem = ref(null);
const toggleNewStatus = ref("");
const exporting = ref(false);
const exportType = ref("full");
const showExportModal = ref(false);
// Balance Modal Tabs
const initTab = ref("manual");
const saving = ref(false);
const totalItemsFromAPI = ref(0); // ✅ Store the total from API response
// Import State
const csvFile = ref(null);
const csvFileInput = ref(null);
const isDragOver = ref(false);
const importPreviewData = ref([]);
const importResults = ref(null);
const importing = ref(false);
const importProgress = ref({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0,
});
// Delete Modal State
const showDeleteModal = ref(false);
const deleteTarget = ref(null);
// Process Requests State
const showProcessModal = ref(false);
const selectedStoreId = ref("");
const selectedGroupId = ref("");
const selectedRequestIds = ref([]);
const storeRequests = ref([]);
const processing = ref(false);
const selectAllRequests = ref(false);
const form = ref({
    storeId: "",
    groupId: "",
    itemId: "",
    balance: 0,
    status: "Active",
    minStock: 0,
});
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// ================================================================
// COMPUTED - AVAILABLE DATA BASED ON USER ROLE
// ================================================================
const availableStores = computed(() => {
    if (isAdmin.value) {
        return stores.value;
    }
    if (userData.value?.assignedStore) {
        return stores.value.filter((s) => s.id === userData.value.assignedStore.id);
    }
    return [];
});
const availableGroups = computed(() => {
    if (isAdmin.value) {
        return allGroups.value;
    }
    if (userData.value?.assignedGroup) {
        return allGroups.value.filter((g) => g.id === userData.value.assignedGroup.id);
    }
    return [];
});
const availableCategories = computed(() => {
    return categories.value.filter((c) => c.status === "Active");
});
// ================================================================
// COMPUTED - ITEM LIST WITH FILTERS - FIXED
// ================================================================
const filteredItemsList = computed(() => {
    // ✅ Safety check - if no items, return empty array
    if (!inventoryItems.value || inventoryItems.value.length === 0) {
        return [];
    }
    let items = [...inventoryItems.value];
    // ✅ Category filter
    if (itemCategoryFilter.value) {
        const categoryId = Number(itemCategoryFilter.value);
        items = items.filter((item) => {
            // Handle different possible property names
            const itemCategoryId = item.categoryId ||
                item.category?.categoryId ||
                item.category?.id ||
                null;
            return itemCategoryId === categoryId;
        });
    }
    // ✅ Search filter
    if (itemSearchQuery.value) {
        const query = itemSearchQuery.value.toLowerCase().trim();
        items = items.filter((item) => {
            const code = (item.code || "").toLowerCase();
            const name = (item.name || "").toLowerCase();
            const standardName = (item.standardName || "").toLowerCase();
            const brand = (item.brand || "").toLowerCase();
            const model = (item.model || "").toLowerCase();
            return (code.includes(query) ||
                name.includes(query) ||
                standardName.includes(query) ||
                brand.includes(query) ||
                model.includes(query));
        });
    }
    return items;
});
const displayedItems = computed(() => {
    return filteredItemsList.value.slice(0, itemDisplayLimit.value);
});
const hasMoreItems = computed(() => {
    return displayedItems.value.length < filteredItemsList.value.length;
});
// ================================================================
// COMPUTED - FILTERED BALANCES
// ================================================================
const hasActiveFilters = computed(() => {
    return (filterStore.value ||
        filterGroup.value ||
        filterCategory.value ||
        filterStatus.value ||
        searchQuery.value);
});
const filteredBalances = computed(() => {
    let result = [...balances.value];
    if (!isAdmin.value && userData.value?.hasAccess) {
        const assignedStoreId = userData.value.assignedStore?.id;
        const assignedGroupId = userData.value.assignedGroup?.id;
        if (assignedStoreId) {
            result = result.filter((item) => item.storeId === assignedStoreId);
        }
        if (assignedGroupId) {
            result = result.filter((item) => item.groupId === assignedGroupId);
        }
    }
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        result = result.filter((item) => {
            const itemName = (item.itemCommonName ||
                getItemCommonName(item.itemId) ||
                "").toLowerCase();
            const itemCode = (item.itemCode ||
                getItemCode(item.itemId) ||
                "").toLowerCase();
            const storeName = (item.storeName ||
                getStoreName(item.storeId) ||
                "").toLowerCase();
            const categoryName = (item.categoryName || "").toLowerCase();
            return (itemName.includes(s) ||
                itemCode.includes(s) ||
                storeName.includes(s) ||
                categoryName.includes(s));
        });
    }
    if (filterStore.value && filterStore.value !== "") {
        const storeId = Number(filterStore.value);
        if (!isNaN(storeId)) {
            result = result.filter((item) => item.storeId === storeId);
        }
    }
    if (filterGroup.value && filterGroup.value !== "") {
        const groupId = Number(filterGroup.value);
        if (!isNaN(groupId)) {
            result = result.filter((item) => item.groupId === groupId);
        }
    }
    if (filterCategory.value && filterCategory.value !== "") {
        const categoryId = Number(filterCategory.value);
        if (!isNaN(categoryId)) {
            result = result.filter((item) => item.categoryId === categoryId);
        }
    }
    if (filterStatus.value) {
        result = result.filter((item) => item.status === filterStatus.value);
    }
    return result;
});
// ================================================================
// COMPUTED - PAGINATED DATA
// ================================================================
const paginatedBalances = computed(() => {
    // Use filteredBalances which already has client-side filters applied
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredBalances.value.slice(start, end);
});
// ================================================================
// COMPUTED - STATS
// ================================================================
const totalStores = computed(() => {
    const uniqueStores = new Set(filteredBalances.value.map((item) => item.storeId));
    return uniqueStores.size;
});
// ================================================================
// COMPUTED - STATS - FIXED
// ================================================================
// ✅ Use the total from API for the stats
const totalItems = computed(() => {
    // If there are filters, use filteredBalances length (client-side filtering)
    // Otherwise, use the total from API
    if (hasActiveFilters.value) {
        return filteredBalances.value.length;
    }
    return totalItemsFromAPI.value || filteredBalances.value.length;
});
// ✅ For the total pages, use API total
const totalPages = computed(() => {
    const total = hasActiveFilters.value
        ? filteredBalances.value.length
        : totalItemsFromAPI.value;
    return Math.ceil(total / pageSize.value) || 1;
});
const lowStockItems = computed(() => {
    return filteredBalances.value.filter((item) => item.balance <= item.minStock && item.balance > 0).length;
});
const pendingRequestsCount = computed(() => {
    return itemRequests.value.filter((req) => {
        if (req.status !== "approved")
            return false;
        return true;
    }).length;
});
const selectedRequests = computed(() => {
    return storeRequests.value.filter((req) => selectedRequestIds.value.includes(req.id));
});
// ================================================================
// ITEM SELECTION METHODS
// ================================================================
const resetItemList = () => {
    itemDisplayLimit.value = 10;
};
const onItemScroll = (event) => {
    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        if (filteredItemsList.value.length > itemDisplayLimit.value &&
            !isLoadingItems.value) {
            isLoadingItems.value = true;
            setTimeout(() => {
                itemDisplayLimit.value = Math.min(itemDisplayLimit.value + 10, filteredItemsList.value.length);
                isLoadingItems.value = false;
            }, 300);
        }
    }
};
const selectItem = (item) => {
    form.value.itemId = item.id;
    selectedItemDisplay.value = item;
};
const clearItemSelection = () => {
    form.value.itemId = "";
    selectedItemDisplay.value = null;
    itemSearchQuery.value = "";
    itemCategoryFilter.value = "";
    itemDisplayLimit.value = 10;
};
// ================================================================
// HELPER METHODS - UPDATED (ONLY TWO NAME FIELDS)
// ================================================================
const getItemStandardName = (itemId) => {
    if (!itemId)
        return null;
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.itemStandardName || null;
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.standardName || null : null;
};
const getItemCommonName = (itemId) => {
    if (!itemId)
        return null;
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.itemCommonName || null;
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.name || item.standardName || null : null;
};
const getItemCode = (itemId) => {
    if (!itemId)
        return "N/A";
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.itemCode || "N/A";
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.code : "N/A";
};
const getItemName = (itemId) => {
    return getItemCommonName(itemId);
};
const getItemUnit = (itemId) => {
    if (!itemId)
        return "";
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.uomCode || "";
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.uomCode || "" : "";
};
const getBaseUOM = (itemId) => {
    if (!itemId)
        return "";
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.conversionUomCode || balance.uomCode || "";
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.conversionUomCode || item.uomCode || "" : "";
};
const getConversionValue = (itemId) => {
    if (!itemId)
        return 1;
    const balance = balances.value.find((b) => b.itemId === itemId);
    if (balance)
        return balance.conversionValue || 1;
    const item = inventoryItems.value.find((i) => i.id === itemId);
    return item ? item.conversionValue || 1 : 1;
};
const getBaseBalance = (item) => {
    const conversionValue = getConversionValue(item.itemId);
    return item.balance * conversionValue;
};
const getStoreName = (storeId) => {
    if (!storeId)
        return "Unknown";
    const balance = balances.value.find((b) => b.storeId === storeId);
    if (balance)
        return balance.storeName || "Unknown";
    const store = availableStores.value.find((s) => s.id === storeId);
    return store ? store.name : "Unknown";
};
const getGroupName = (groupId) => {
    if (!groupId)
        return "Unknown";
    const balance = balances.value.find((b) => b.groupId === groupId);
    if (balance)
        return balance.groupName || "Unknown";
    const group = availableGroups.value.find((g) => g.id === groupId);
    return group ? group.name : "Unknown";
};
const getItemNameByCode = (itemCode) => {
    if (!itemCode)
        return null;
    const item = inventoryItems.value.find((i) => i.code === itemCode);
    return item ? item.name || item.standardName || null : null;
};
const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
};
const getBalanceClass = (item) => {
    if (item.balance === 0)
        return "zero";
    if (item.balance <= item.minStock)
        return "low";
    return "normal";
};
const formatDate = (dateString) => {
    if (!dateString)
        return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
const formatFileSize = (bytes) => {
    if (!bytes)
        return "0 B";
    if (bytes < 1024)
        return bytes + " B";
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
const getItemActionLabel = (req) => {
    if (selectedStoreId.value === String(req.askingStoreId)) {
        return "➕ ADD to balance";
    }
    else if (selectedStoreId.value === String(req.supplyingStoreId)) {
        return "➖ REMOVE from balance";
    }
    return "";
};
const getItemActionClass = (req) => {
    if (selectedStoreId.value === String(req.askingStoreId)) {
        return "action-add";
    }
    else if (selectedStoreId.value === String(req.supplyingStoreId)) {
        return "action-remove";
    }
    return "";
};
const getSelectedTotalItems = () => {
    let total = 0;
    selectedRequests.value.forEach((req) => {
        total += req.items.length;
    });
    return total;
};
// ================================================================
// UI HELPERS
// ================================================================
const onItemChange = () => {
    if (!editingBalance.value) {
        form.value.balance = 0;
    }
};
const onBalanceChange = () => { };
// ================================================================
// API METHODS
// ================================================================
const fetchStores = async () => {
    isLoadingStores.value = true;
    try {
        const response = await balanceService.getStores();
        stores.value = response.data || [];
    }
    catch (error) {
        console.error("Error fetching stores:", error);
        showToastMessage("Failed to load stores", "error");
    }
    finally {
        isLoadingStores.value = false;
    }
};
const fetchGroups = async () => {
    isLoadingGroups.value = true;
    try {
        const response = await balanceService.getGroups();
        allGroups.value = response.data || [];
    }
    catch (error) {
        console.error("Error fetching groups:", error);
        showToastMessage("Failed to load groups", "error");
    }
    finally {
        isLoadingGroups.value = false;
    }
};
const fetchCategories = async () => {
    try {
        const response = await balanceService.getActiveCategories();
        if (response.success) {
            categories.value = response.data || [];
            console.log(`✅ Loaded ${categories.value.length} categories`);
        }
        else {
            console.error("Failed to fetch categories:", response.error);
        }
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        showToastMessage("Failed to load categories", "error");
    }
};
const fetchItems = async () => {
    isLoadingItems.value = true;
    try {
        const response = await balanceService.getActiveItems();
        console.log("📦 getActiveItems response:", response);
        if (response && response.success && response.data) {
            inventoryItems.value = response.data || [];
            console.log(`✅ Loaded ${inventoryItems.value.length} items`);
            if (inventoryItems.value.length > 0) {
                console.log("📦 Sample item:", {
                    id: inventoryItems.value[0].id,
                    code: inventoryItems.value[0].code,
                    name: inventoryItems.value[0].name,
                    standardName: inventoryItems.value[0].standardName,
                    categoryId: inventoryItems.value[0].categoryId,
                    brand: inventoryItems.value[0].brand,
                    model: inventoryItems.value[0].model,
                });
            }
        }
        else {
            console.error("❌ Invalid response from getActiveItems:", response);
            inventoryItems.value = [];
        }
        showToastMessage(`Loaded ${inventoryItems.value.length} items`, "success");
    }
    catch (error) {
        console.error("Error fetching items:", error);
        showToastMessage("Failed to load items", "error");
        inventoryItems.value = [];
    }
    finally {
        isLoadingItems.value = false;
    }
};
// ================================================================
// FETCH BALANCES - FIXED
// ================================================================
const fetchBalances = async () => {
    isLoading.value = true;
    try {
        const filters = {};
        if (!isAdmin.value && userData.value?.hasAccess) {
            if (userData.value.assignedStore) {
                filters.assignedStoreId = userData.value.assignedStore.id;
            }
            if (userData.value.assignedGroup) {
                filters.assignedGroupId = userData.value.assignedGroup.id;
            }
        }
        if (filterStore.value && filterStore.value !== "") {
            const storeId = Number(filterStore.value);
            if (!isNaN(storeId)) {
                filters.storeId = storeId;
            }
        }
        if (filterGroup.value && filterGroup.value !== "") {
            const groupId = Number(filterGroup.value);
            if (!isNaN(groupId)) {
                filters.groupId = groupId;
            }
        }
        if (filterCategory.value && filterCategory.value !== "") {
            const categoryId = Number(filterCategory.value);
            if (!isNaN(categoryId)) {
                filters.categoryId = categoryId;
            }
        }
        if (filterStatus.value) {
            filters.status = filterStatus.value;
        }
        if (searchQuery.value) {
            filters.search = searchQuery.value;
        }
        // ✅ Use pagination
        filters.page = currentPage.value;
        filters.limit = 10000; // High limit to get all data
        const response = await balanceService.getBalances(filters);
        // ✅ Store the data
        balances.value = response.data || [];
        // ✅ Store the total from API pagination
        if (response.pagination) {
            totalItemsFromAPI.value = response.pagination.total || 0;
            currentPage.value = response.pagination.page || 1;
        }
        // ✅ Debug logging
        console.log("📊 API Response:", {
            dataLength: balances.value.length,
            total: totalItemsFromAPI.value,
            page: currentPage.value,
        });
    }
    catch (error) {
        console.error("Error fetching balances:", error);
        showToastMessage("Failed to load balances", "error");
    }
    finally {
        isLoading.value = false;
    }
};
// ================================================================
// FETCH APPROVED REQUESTS
// ================================================================
const fetchApprovedRequests = async () => {
    isLoadingRequests.value = true;
    try {
        let response;
        if (!isAdmin.value &&
            userData.value?.hasAccess &&
            userData.value.assignedStore) {
            const storeId = userData.value.assignedStore.id;
            const groupId = userData.value.assignedGroup?.id;
            response = await balanceService.getApprovedRequests(storeId, groupId);
        }
        else if (isAdmin.value) {
            response = await balanceService.getApprovedRequests(0);
        }
        else {
            response = await balanceService.getApprovedRequests(0);
        }
        itemRequests.value = response.data || [];
    }
    catch (error) {
        console.error("Error fetching approved requests:", error);
        showToastMessage("Failed to load approved requests", "error");
    }
    finally {
        isLoadingRequests.value = false;
    }
};
// ================================================================
// FILTERS & PAGINATION
// ================================================================
const onSearchChange = () => {
    currentPage.value = 1;
    fetchBalances();
};
const onFilterChange = () => {
    currentPage.value = 1;
    fetchBalances();
};
const clearFilters = () => {
    filterStore.value = "";
    filterGroup.value = "";
    filterCategory.value = "";
    filterStatus.value = "";
    searchQuery.value = "";
    currentPage.value = 1;
    showToastMessage("Filters cleared", "info");
    fetchBalances();
};
const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};
const changePageSize = () => {
    currentPage.value = 1;
    fetchBalances();
};
// ================================================================
// BALANCE CRUD
// ================================================================
const openAddBalanceModal = () => {
    editingBalance.value = null;
    initTab.value = "manual";
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
    importProgress.value = {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        remaining: 0,
        percentage: 0,
    };
    itemSearchQuery.value = "";
    itemCategoryFilter.value = "";
    itemDisplayLimit.value = 10;
    selectedItemDisplay.value = null;
    if (!isAdmin.value && userData.value?.hasAccess) {
        const assignedStoreId = userData.value.assignedStore?.id;
        const assignedGroupId = userData.value.assignedGroup?.id;
        const assignedStoreName = userData.value.assignedStore?.name;
        const assignedGroupName = userData.value.assignedGroup?.name;
        const storeExists = assignedStoreId
            ? availableStores.value.some((s) => s.id === assignedStoreId)
            : false;
        const groupExists = assignedGroupId
            ? availableGroups.value.some((g) => g.id === assignedGroupId)
            : false;
        form.value = {
            storeId: assignedStoreId && storeExists ? assignedStoreId : "",
            groupId: assignedGroupId && groupExists ? assignedGroupId : "",
            itemId: "",
            balance: 0,
            status: "Active",
            minStock: 0,
        };
        if (form.value.storeId && form.value.groupId) {
            showToastMessage(` Pre-filled with your assigned store: ${assignedStoreName} and group: ${assignedGroupName}`, "info");
        }
        else if (form.value.storeId) {
            showToastMessage(` Pre-filled with your assigned store: ${assignedStoreName}`, "info");
        }
        else if (form.value.groupId) {
            showToastMessage(` Pre-filled with your assigned group: ${assignedGroupName}`, "info");
        }
    }
    else {
        form.value = {
            storeId: "",
            groupId: "",
            itemId: "",
            balance: 0,
            status: "Active",
            minStock: 0,
        };
    }
    showBalanceModal.value = true;
};
const editBalance = (item) => {
    editingBalance.value = item;
    initTab.value = "manual";
    form.value = {
        storeId: item.storeId,
        groupId: item.groupId,
        itemId: item.itemId,
        balance: item.balance,
        status: item.status || "Active",
        minStock: item.minStock || 0,
    };
    showBalanceModal.value = true;
};
const closeBalanceModal = () => {
    if (importing.value)
        return;
    showBalanceModal.value = false;
    editingBalance.value = null;
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
    importProgress.value = {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        remaining: 0,
        percentage: 0,
    };
    itemSearchQuery.value = "";
    itemCategoryFilter.value = "";
    itemDisplayLimit.value = 10;
    selectedItemDisplay.value = null;
};
const saveBalance = async () => {
    if (!form.value.storeId) {
        showToastMessage("Please select a store", "error");
        return;
    }
    if (!form.value.groupId) {
        showToastMessage("Please select a group", "error");
        return;
    }
    if (!form.value.itemId) {
        showToastMessage("Please select an item", "error");
        return;
    }
    if (form.value.balance < 0) {
        showToastMessage("Balance cannot be negative", "error");
        return;
    }
    saving.value = true;
    try {
        const payload = {
            storeId: Number(form.value.storeId),
            groupId: Number(form.value.groupId),
            itemId: Number(form.value.itemId),
            balance: Number(form.value.balance),
            minStock: Number(form.value.minStock) || 0,
            status: form.value.status || "Active",
        };
        let response;
        if (editingBalance.value) {
            response = await balanceService.updateBalance(editingBalance.value.id, payload);
            showToastMessage("Balance updated successfully!", "success");
        }
        else {
            response = await balanceService.createBalance(payload);
            showToastMessage("Balance initialized successfully!", "success");
        }
        await fetchBalances();
        closeBalanceModal();
    }
    catch (error) {
        console.error("Error saving balance:", error);
        if (error.response?.data?.error) {
            showToastMessage(error.response.data.error, "error");
        }
        else {
            showToastMessage("Failed to save balance", "error");
        }
    }
    finally {
        saving.value = false;
    }
};
// ================================================================
// IMPORT FUNCTIONS
// ================================================================
const downloadTemplate = async () => {
    try {
        const blob = await balanceService.downloadTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `balance_import_template_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToastMessage("Template CSV downloaded successfully!", "success");
    }
    catch (error) {
        console.error("Error downloading template:", error);
        showToastMessage("Failed to download template", "error");
    }
};
const triggerCsvUpload = (event) => {
    if (importing.value)
        return;
    if (csvFileInput.value) {
        csvFileInput.value.click();
    }
};
const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        csvFile.value = file;
        parseCsvFile(file);
    }
    else {
        showToastMessage("Please upload a valid CSV file", "error");
    }
    event.target.value = "";
};
const handleCsvDrop = (event) => {
    isDragOver.value = false;
    const file = event.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        csvFile.value = file;
        parseCsvFile(file);
    }
    else {
        showToastMessage("Please upload a valid CSV file", "error");
    }
};
const removeCsvFile = () => {
    csvFile.value = null;
    importPreviewData.value = [];
    importResults.value = null;
};
const parseCsvFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const lines = text
                .split("\n")
                .filter((line) => line.trim() && !line.trim().startsWith("#"));
            if (lines.length < 2) {
                showToastMessage("CSV file must contain headers and at least one data row", "error");
                return;
            }
            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
            const requiredHeaders = ["storeid", "groupid", "balance"];
            const hasItemId = headers.includes("itemid");
            const hasItemCode = headers.includes("itemcode");
            if (!hasItemId && !hasItemCode) {
                showToastMessage('CSV must contain either "itemId" or "itemCode" column', "error");
                return;
            }
            const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
            if (missingHeaders.length > 0) {
                showToastMessage(`Missing required headers: ${missingHeaders.join(", ")}`, "error");
                return;
            }
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",").map((v) => v.trim());
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h] = values[idx] || "";
                });
                const itemId = obj.itemid ? parseInt(obj.itemid) : null;
                const itemCode = obj.itemcode || null;
                if ((!itemId && !itemCode) ||
                    !obj.storeid ||
                    !obj.groupid ||
                    !obj.balance) {
                    continue;
                }
                const storeId = parseInt(obj.storeid);
                const groupId = parseInt(obj.groupid);
                const balance = parseFloat(obj.balance);
                if (isNaN(storeId) || isNaN(groupId) || isNaN(balance)) {
                    console.warn(`Skipping row ${i + 1}: Invalid data`, obj);
                    continue;
                }
                data.push({
                    storeId: storeId,
                    groupId: groupId,
                    itemId: itemId,
                    itemCode: itemCode,
                    balance: balance,
                    minStock: parseInt(obj.minstock) || 0,
                    status: obj.status || "Active",
                });
            }
            if (data.length === 0) {
                showToastMessage("No valid data found in CSV file. Please check the format.", "error");
                importPreviewData.value = [];
                return;
            }
            importPreviewData.value = data;
            showToastMessage(`Successfully parsed ${data.length} items from CSV`, "success");
        }
        catch (error) {
            console.error("CSV parse error:", error);
            showToastMessage("Failed to parse CSV file. Please check the format.", "error");
            importPreviewData.value = [];
        }
    };
    reader.onerror = () => {
        showToastMessage("Failed to read file", "error");
        importPreviewData.value = [];
    };
    reader.readAsText(file);
};
const processImport = async () => {
    if (!csvFile.value || importPreviewData.value.length === 0) {
        showToastMessage("No data to import. Please upload a valid CSV file.", "error");
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
        percentage: 0,
    };
    try {
        const response = await balanceService.importBalances(csvFile.value);
        importResults.value = response.data;
        showToastMessage(`Import completed: ${response.data.success} imported, ${response.data.failed} failed`, response.data.failed > 0 ? "warning" : "success");
        await fetchBalances();
        if (response.data.failed === 0) {
            setTimeout(() => {
                closeBalanceModal();
            }, 1500);
        }
    }
    catch (error) {
        console.error("Import error:", error);
        showToastMessage("Failed to import balances", "error");
    }
    finally {
        importing.value = false;
    }
};
// ================================================================
// DELETE BALANCE
// ================================================================
const openDeleteModal = (item) => {
    if (item.status === "Active") {
        showToastMessage("Cannot delete active balance. Please deactivate it first.", "error");
        return;
    }
    deleteTarget.value = item;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteTarget.value = null;
};
const confirmDelete = async () => {
    if (deleteTarget.value) {
        try {
            await balanceService.deleteBalance(deleteTarget.value.id);
            showToastMessage(`Balance record for ${getItemCommonName(deleteTarget.value.itemId)} deleted successfully!`, "success");
            await fetchBalances();
        }
        catch (error) {
            console.error("Error deleting balance:", error);
            showToastMessage("Failed to delete balance", "error");
        }
        closeDeleteModal();
    }
};
// ================================================================
// PROCESS REQUESTS
// ================================================================
const processApprovedRequests = async () => {
    selectedStoreId.value = "";
    selectedGroupId.value = "";
    selectedRequestIds.value = [];
    storeRequests.value = [];
    selectAllRequests.value = false;
    showProcessModal.value = true;
    if (!isAdmin.value && userData.value?.hasAccess) {
        if (userData.value.assignedStore) {
            selectedStoreId.value = String(userData.value.assignedStore.id);
            await onStoreSelect();
        }
        if (userData.value.assignedGroup) {
            selectedGroupId.value = String(userData.value.assignedGroup.id);
        }
    }
    await fetchApprovedRequests();
};
const closeProcessModal = () => {
    showProcessModal.value = false;
    selectedStoreId.value = "";
    selectedGroupId.value = "";
    selectedRequestIds.value = [];
    storeRequests.value = [];
    selectAllRequests.value = false;
};
const onStoreSelect = async () => {
    selectedRequestIds.value = [];
    storeRequests.value = [];
    selectAllRequests.value = false;
    selectedGroupId.value = "";
    if (!selectedStoreId.value) {
        return;
    }
    if (!isAdmin.value && userData.value?.assignedStore) {
        if (Number(selectedStoreId.value) !== userData.value.assignedStore.id) {
            showToastMessage("You do not have access to this store", "error");
            selectedStoreId.value = "";
            return;
        }
    }
    try {
        const storeId = Number(selectedStoreId.value);
        const groupId = userData.value?.assignedGroup?.id;
        const response = await balanceService.getApprovedRequests(storeId, groupId);
        storeRequests.value = response.data || [];
        if (storeRequests.value.length > 0) {
            selectAllRequests.value = true;
            selectedRequestIds.value = storeRequests.value.map((req) => req.id);
        }
        else {
            selectAllRequests.value = false;
            selectedRequestIds.value = [];
            showToastMessage("✅ No pending requests for this store", "info");
        }
    }
    catch (error) {
        console.error("Error fetching approved requests:", error);
        showToastMessage("Failed to fetch approved requests", "error");
    }
};
const toggleAllRequests = () => {
    if (selectAllRequests.value) {
        selectedRequestIds.value = storeRequests.value.map((req) => req.id);
    }
    else {
        selectedRequestIds.value = [];
    }
};
const onRequestSelect = () => {
    if (selectedRequestIds.value.length === storeRequests.value.length) {
        selectAllRequests.value = true;
    }
    else {
        selectAllRequests.value = false;
    }
};
const confirmProcessRequests = async () => {
    if (!selectedStoreId.value ||
        selectedRequestIds.value.length === 0 ||
        !selectedGroupId.value) {
        showToastMessage("Please select a store, requests, and a group", "warning");
        return;
    }
    if (!isAdmin.value && userData.value?.assignedGroup) {
        if (Number(selectedGroupId.value) !== userData.value.assignedGroup.id) {
            showToastMessage("You do not have access to this group", "error");
            return;
        }
    }
    processing.value = true;
    try {
        const response = await balanceService.processRequests({
            storeId: Number(selectedStoreId.value),
            groupId: Number(selectedGroupId.value),
            requestIds: selectedRequestIds.value.map((id) => Number(id)),
        });
        if (response.success) {
            const { processed, failed, missingItems, processedItems, autoInitializedItems, partialRequests, logs, processedRequestIds, totalRequests, } = response.data || {};
            const processedIds = processedRequestIds || [];
            storeRequests.value = storeRequests.value.filter((req) => !processedIds.includes(req.id));
            selectedRequestIds.value = storeRequests.value.map((req) => req.id);
            let message = "";
            let hasErrors = false;
            if (processed > 0 || processedItems?.length > 0) {
                message += `✅ Processed ${processed || processedItems?.length || 0} items successfully. `;
            }
            if (autoInitializedItems && autoInitializedItems.length > 0) {
                message += `\n📦 Auto-initialized ${autoInitializedItems.length} item(s): `;
                autoInitializedItems.slice(0, 3).forEach((item) => {
                    message += `${item.itemCode || item.itemName}, `;
                });
                if (autoInitializedItems.length > 3) {
                    message += `+${autoInitializedItems.length - 3} more. `;
                }
            }
            if (missingItems && missingItems.length > 0) {
                hasErrors = true;
                message += `\n⚠️ ${missingItems.length} item(s) need initialization: `;
                missingItems.slice(0, 3).forEach((item) => {
                    message += `${item.itemCode || "Unknown"}, `;
                });
                if (missingItems.length > 3) {
                    message += `+${missingItems.length - 3} more. `;
                }
                message += `\n💡 Please initialize these items first.`;
            }
            const alreadyProcessedCount = processedIds.length - (processedItems?.length || 0);
            if (alreadyProcessedCount > 0 && processed === 0) {
                message += `\n⏭️ ${alreadyProcessedCount} request(s) were already processed by your group and have been removed from your list.`;
            }
            if (partialRequests && partialRequests.length > 0) {
                message += `\n\n⏳ ${partialRequests.length} request(s) partially processed:`;
                partialRequests.forEach((req) => {
                    const remainingNames = req.remainingGroups.join(", ");
                    message += `\n   • ${req.requestCode}: ${req.remainingCount} group(s) remaining (${remainingNames})`;
                });
                message += `\n\n💡 The request will be finalized when ALL groups have processed it.`;
            }
            if (!message) {
                message = response.message || "Requests processed!";
            }
            const remainingCount = storeRequests.value.length;
            if (remainingCount === 0) {
                message += `\n\n🎉 All requests have been processed by your group!`;
                setTimeout(() => {
                    closeProcessModal();
                    showToastMessage("🎉 All requests processed by your group!", "success");
                }, 2000);
            }
            else {
                message += `\n\n📋 ${remainingCount} request(s) remaining in your list.`;
            }
            showToastMessage(message, hasErrors ? "warning" : "success");
            await Promise.all([fetchBalances(), fetchApprovedRequests()]);
        }
        else {
            showToastMessage(response.error || "Failed to process requests", "error");
        }
    }
    catch (error) {
        console.error("Error processing requests:", error);
        showToastMessage(error.response?.data?.error || "Error processing requests", "error");
    }
    finally {
        processing.value = false;
    }
};
// ================================================================
// TOGGLE STATUS
// ================================================================
const toggleStatus = (item) => {
    toggleItem.value = item;
    toggleNewStatus.value = item.status === "Active" ? "Inactive" : "Active";
    showToggleModal.value = true;
};
const closeToggleModal = () => {
    showToggleModal.value = false;
    toggleItem.value = null;
    toggleNewStatus.value = "";
};
const confirmToggle = async () => {
    if (toggleItem.value) {
        try {
            await balanceService.toggleStatus(toggleItem.value.id);
            showToastMessage(`Status changed to ${toggleNewStatus.value}`, "success");
            await fetchBalances();
        }
        catch (error) {
            console.error("Error toggling status:", error);
            showToastMessage("Failed to change status", "error");
        }
        closeToggleModal();
    }
};
// ================================================================
// PRINT & EXPORT
// ================================================================
const printReport = () => {
    try {
        const query = {};
        if (filterStore.value)
            query.storeId = filterStore.value;
        if (filterGroup.value)
            query.groupId = filterGroup.value;
        if (filterCategory.value)
            query.categoryId = filterCategory.value;
        if (filterStatus.value)
            query.status = filterStatus.value;
        console.log("🖨️ Navigating to print page with filters:", query);
        router
            .push({
            name: "print-store-balance",
            query: query,
        })
            .then(() => {
            console.log("✅ Navigation to print page successful");
        })
            .catch((err) => {
            console.error("❌ Navigation to print page failed:", err);
            showToastMessage("Failed to open print page", "error");
        });
    }
    catch (error) {
        console.error("Error in printReport:", error);
        showToastMessage("Failed to open print page", "error");
    }
};
const openExportModal = () => {
    exportType.value = "full";
    showExportModal.value = true;
};
const closeExportModal = () => {
    showExportModal.value = false;
};
// ================================================================
// PRINT & EXPORT
// ================================================================
// storebalance.vue - exportSelectedReport
const exportSelectedReport = async () => {
    exporting.value = true;
    try {
        const storeId = filterStore.value ? Number(filterStore.value) : (userData.value?.assignedStore?.id || 28);
        const groupId = filterGroup.value ? Number(filterGroup.value) : (userData.value?.assignedGroup?.id || 32);
        const categoryId = filterCategory.value ? Number(filterCategory.value) : undefined;
        const status = filterStatus.value || undefined;
        console.log('📊 Exporting with storeId:', storeId, 'groupId:', groupId, 'categoryId:', categoryId, 'status:', status);
        const blob = await balanceService.exportBalances(exportType.value, storeId, groupId, categoryId, status);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Store_Balance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToastMessage('Excel export completed successfully!', 'success');
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export data', 'error');
    }
    finally {
        exporting.value = false;
        closeExportModal();
    }
};
const showToastMessage = (msg, type = "success") => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};
// ================================================================
// LIFECYCLE HOOKS
// ================================================================
onMounted(async () => {
    userData.value = getUserData();
    await Promise.all([
        fetchStores(),
        fetchGroups(),
        fetchCategories(),
        fetchItems(),
        fetchBalances(),
    ]);
    if (!isAdmin.value && userData.value?.hasAccess) {
        if (userData.value.assignedStore) {
            filterStore.value = String(userData.value.assignedStore.id);
        }
        if (userData.value.assignedGroup) {
            filterGroup.value = String(userData.value.assignedGroup.id);
        }
        await fetchBalances();
    }
    await fetchApprovedRequests();
});
watch(() => localStorage.getItem("user"), (newVal) => {
    if (newVal) {
        userData.value = getUserData();
        fetchBalances();
        fetchApprovedRequests();
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['import-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['has-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['no-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-model']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
/** @type {__VLS_StyleScopedClasses['item-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['has-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['no-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-model']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['export-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['import-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['import-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-model']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-common']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['item-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
/** @type {__VLS_StyleScopedClasses['item-search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-container']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-common']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['item-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['item-no-results']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['item-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
/** @type {__VLS_StyleScopedClasses['item-search-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-common']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['req-status']} */ ;
/** @type {__VLS_StyleScopedClasses['req-status']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-process-requests']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['conversion-info']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['export-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['init-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['init-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['import-info']} */ ;
/** @type {__VLS_StyleScopedClasses['csv-format-list']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
/** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['import-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
/** @type {__VLS_StyleScopedClasses['result-errors']} */ ;
/** @type {__VLS_StyleScopedClasses['result-errors']} */ ;
/** @type {__VLS_StyleScopedClasses['process-info']} */ ;
/** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['process-rules']} */ ;
/** @type {__VLS_StyleScopedClasses['request-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['request-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['req-action']} */ ;
/** @type {__VLS_StyleScopedClasses['req-action']} */ ;
/** @type {__VLS_StyleScopedClasses['request-item']} */ ;
/** @type {__VLS_StyleScopedClasses['item-action']} */ ;
/** @type {__VLS_StyleScopedClasses['action-add']} */ ;
/** @type {__VLS_StyleScopedClasses['item-action']} */ ;
/** @type {__VLS_StyleScopedClasses['action-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-process-requests']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['request-header']} */ ;
/** @type {__VLS_StyleScopedClasses['request-items']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-header']} */ ;
/** @type {__VLS_StyleScopedClasses['request-info']} */ ;
/** @type {__VLS_StyleScopedClasses['init-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['import-info']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-checkbox-list']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-list']} */ ;
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
(__VLS_ctx.filteredBalances.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onSearchChange) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search items...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddBalanceModal) },
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.processApprovedRequests) },
    ...{ class: "btn-process-requests" },
});
/** @type {__VLS_StyleScopedClasses['btn-process-requests']} */ ;
if (__VLS_ctx.pendingRequestsCount > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge-count" },
    });
    /** @type {__VLS_StyleScopedClasses['badge-count']} */ ;
    (__VLS_ctx.pendingRequestsCount);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStore),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [store] of __VLS_vFor((__VLS_ctx.availableStores))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (store.id),
        value: (store.id),
    });
    (store.name);
    // @ts-ignore
    [filteredBalances, onSearchChange, searchQuery, openAddBalanceModal, processApprovedRequests, pendingRequestsCount, pendingRequestsCount, onFilterChange, filterStore, availableStores,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterGroup),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [group] of __VLS_vFor((__VLS_ctx.availableGroups))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (group.id),
        value: (group.id),
    });
    (group.name);
    // @ts-ignore
    [onFilterChange, filterGroup, availableGroups,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterCategory),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [cat] of __VLS_vFor((__VLS_ctx.availableCategories))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cat.id),
        value: (cat.id),
    });
    (cat.name);
    // @ts-ignore
    [onFilterChange, filterCategory, availableCategories,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
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
if (__VLS_ctx.hasActiveFilters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-actions" },
});
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
    id: "printable-area",
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "balance-table" },
});
/** @type {__VLS_StyleScopedClasses['balance-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "8",
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
}
else if (__VLS_ctx.paginatedBalances.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "8",
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
        ...{ onClick: (__VLS_ctx.openAddBalanceModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
for (const [item, index] of __VLS_vFor((__VLS_ctx.paginatedBalances))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (item.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    ((__VLS_ctx.currentPage - 1) * __VLS_ctx.pageSize + index + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-code" },
    });
    /** @type {__VLS_StyleScopedClasses['item-code']} */ ;
    (item.itemCode || __VLS_ctx.getItemCode(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-name-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['item-name-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-common-name" },
    });
    /** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
    (item.itemCommonName ||
        __VLS_ctx.getItemCommonName(item.itemId) ||
        "Unnamed");
    if (item.itemStandardName || __VLS_ctx.getItemStandardName(item.itemId)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-standard-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
        (item.itemStandardName || __VLS_ctx.getItemStandardName(item.itemId));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "category-tag" },
        ...{ class: (item.categoryName ? 'has-category' : 'no-category') },
    });
    /** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
    (item.categoryName || "Uncategorized");
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "uom-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['uom-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "uom-code" },
    });
    /** @type {__VLS_StyleScopedClasses['uom-code']} */ ;
    (item.uomCode || __VLS_ctx.getItemUnit(item.itemId));
    if ((item.conversionValue || __VLS_ctx.getConversionValue(item.itemId)) >
        1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "conversion-info" },
        });
        /** @type {__VLS_StyleScopedClasses['conversion-info']} */ ;
        (item.uomCode || __VLS_ctx.getItemUnit(item.itemId));
        (item.conversionValue || __VLS_ctx.getConversionValue(item.itemId));
        (item.conversionUomCode || __VLS_ctx.getBaseUOM(item.itemId));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "conversion-info base" },
        });
        /** @type {__VLS_StyleScopedClasses['conversion-info']} */ ;
        /** @type {__VLS_StyleScopedClasses['base']} */ ;
        (item.uomCode || __VLS_ctx.getItemUnit(item.itemId));
        (item.uomCode || __VLS_ctx.getItemUnit(item.itemId));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-value" },
        ...{ class: (item.statusClass || __VLS_ctx.getBalanceClass(item)) },
    });
    /** @type {__VLS_StyleScopedClasses['balance-value']} */ ;
    (__VLS_ctx.formatNumber(item.balance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "base-balance" },
    });
    /** @type {__VLS_StyleScopedClasses['base-balance']} */ ;
    (__VLS_ctx.formatNumber(item.baseBalance || __VLS_ctx.getBaseBalance(item)));
    (item.conversionUomCode || __VLS_ctx.getBaseUOM(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: ([
                'status-badge',
                (item.status || 'inactive').toLowerCase(),
            ]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (item.status || "Inactive");
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleStatus(item);
                // @ts-ignore
                [openAddBalanceModal, onFilterChange, filterStatus, hasActiveFilters, clearFilters, openExportModal, isLoading, paginatedBalances, paginatedBalances, currentPage, pageSize, getItemCode, getItemCommonName, getItemStandardName, getItemStandardName, getItemUnit, getItemUnit, getItemUnit, getItemUnit, getConversionValue, getConversionValue, getBaseUOM, getBaseUOM, getBalanceClass, formatNumber, formatNumber, getBaseBalance, toggleStatus,];
            } },
        ...{ class: "icon-btn" },
        title: (item.status === 'Active' ? 'Deactivate' : 'Activate'),
    });
    /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
    (item.status === "Active" ? "⏸️" : "▶️");
    if (item.status === 'Inactive') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(item.status === 'Inactive'))
                        return;
                    __VLS_ctx.openDeleteModal(item);
                    // @ts-ignore
                    [openDeleteModal,];
                } },
            ...{ class: "icon-btn delete-btn" },
            title: "Delete",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
    }
    // @ts-ignore
    [];
}
if (__VLS_ctx.filteredBalances.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filteredBalances.length > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [filteredBalances, currentPage, changePage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.currentPage);
    (__VLS_ctx.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filteredBalances.length > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [currentPage, currentPage, currentPage, changePage, totalPages,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changePageSize) },
        value: (__VLS_ctx.pageSize),
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
if (__VLS_ctx.showBalanceModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeBalanceModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container balance-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['balance-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingBalance ? "✏️ Edit Balance" : "📦 Initialize Balance");
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBalanceModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    if (!__VLS_ctx.editingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "init-tabs" },
        });
        /** @type {__VLS_StyleScopedClasses['init-tabs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(!__VLS_ctx.editingBalance))
                        return;
                    __VLS_ctx.initTab = 'manual';
                    // @ts-ignore
                    [currentPage, pageSize, totalPages, changePageSize, showBalanceModal, closeBalanceModal, closeBalanceModal, editingBalance, editingBalance, initTab,];
                } },
            ...{ class: "init-tab" },
            ...{ class: ({ active: __VLS_ctx.initTab === 'manual' }) },
        });
        /** @type {__VLS_StyleScopedClasses['init-tab']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(!__VLS_ctx.editingBalance))
                        return;
                    __VLS_ctx.initTab = 'import';
                    // @ts-ignore
                    [initTab, initTab,];
                } },
            ...{ class: "init-tab" },
            ...{ class: ({ active: __VLS_ctx.initTab === 'import' }) },
        });
        /** @type {__VLS_StyleScopedClasses['init-tab']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
    }
    if (__VLS_ctx.initTab === 'manual' || __VLS_ctx.editingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        if (!__VLS_ctx.editingBalance) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "init-info" },
            });
            /** @type {__VLS_StyleScopedClasses['init-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "info-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (__VLS_ctx.saveBalance) },
            ...{ class: "balance-form" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-form']} */ ;
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
            value: (__VLS_ctx.form.storeId),
            required: true,
            disabled: (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedStore),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (const [store] of __VLS_vFor((__VLS_ctx.availableStores))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (store.id),
                value: (store.id),
            });
            (store.name);
            // @ts-ignore
            [availableStores, editingBalance, editingBalance, initTab, initTab, saveBalance, form, isAdmin, userData,];
        }
        if (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedStore) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint pre-filled" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['pre-filled']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.userData.assignedStore.name);
        }
        else if (!__VLS_ctx.isAdmin && !__VLS_ctx.userData?.assignedStore) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint warning" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.form.groupId),
            required: true,
            disabled: (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedGroup),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (const [group] of __VLS_vFor((__VLS_ctx.availableGroups))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (group.id),
                value: (group.id),
            });
            (group.name);
            // @ts-ignore
            [availableGroups, form, isAdmin, isAdmin, isAdmin, userData, userData, userData, userData,];
        }
        if (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedGroup) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint pre-filled" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['pre-filled']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.userData.assignedGroup.name);
        }
        else if (!__VLS_ctx.isAdmin && !__VLS_ctx.userData?.assignedGroup) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint warning" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        }
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
            ...{ class: "item-search-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['item-search-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "search-icon-small" },
        });
        /** @type {__VLS_StyleScopedClasses['search-icon-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.resetItemList) },
            type: "text",
            value: (__VLS_ctx.itemSearchQuery),
            placeholder: "Search items by code, name, brand, or model...",
            ...{ class: "item-search-input" },
        });
        /** @type {__VLS_StyleScopedClasses['item-search-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-select-container" },
            ref: "itemSelectContainer",
        });
        /** @type {__VLS_StyleScopedClasses['item-select-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onScroll: (__VLS_ctx.onItemScroll) },
            ...{ class: "item-select-scroll" },
        });
        /** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
        if (__VLS_ctx.isLoadingItems) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-loading" },
            });
            /** @type {__VLS_StyleScopedClasses['item-loading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spinner-small" },
            });
            /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
        }
        else if (__VLS_ctx.displayedItems.length > 0) {
            for (const [item] of __VLS_vFor((__VLS_ctx.displayedItems))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.showBalanceModal))
                                return;
                            if (!(__VLS_ctx.initTab === 'manual' || __VLS_ctx.editingBalance))
                                return;
                            if (!!(__VLS_ctx.isLoadingItems))
                                return;
                            if (!(__VLS_ctx.displayedItems.length > 0))
                                return;
                            __VLS_ctx.selectItem(item);
                            // @ts-ignore
                            [isAdmin, isAdmin, userData, userData, userData, resetItemList, itemSearchQuery, onItemScroll, isLoadingItems, displayedItems, displayedItems, selectItem,];
                        } },
                    key: (item.id),
                    ...{ class: "item-option" },
                    ...{ class: ({ selected: __VLS_ctx.form.itemId === item.id }) },
                });
                /** @type {__VLS_StyleScopedClasses['item-option']} */ ;
                /** @type {__VLS_StyleScopedClasses['selected']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-content" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-left" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "item-option-code" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-code']} */ ;
                (item.code);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-middle" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-common-name" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-common-name']} */ ;
                (item.name || item.standardName || "Unnamed");
                if (item.standardName &&
                    item.standardName !== item.name) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "item-option-standard-name" },
                    });
                    /** @type {__VLS_StyleScopedClasses['item-option-standard-name']} */ ;
                    (item.standardName);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-right" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
                if (item.brand) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "item-option-brand" },
                    });
                    /** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
                    (item.brand);
                }
                if (item.model) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "item-option-model" },
                    });
                    /** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
                    (item.model);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-uom" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
                (item.uomCode || "N/A");
                // @ts-ignore
                [form,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-no-results" },
            });
            /** @type {__VLS_StyleScopedClasses['item-no-results']} */ ;
            (__VLS_ctx.itemSearchQuery || __VLS_ctx.itemCategoryFilter
                ? "No items match your search"
                : "No items available");
        }
        if (__VLS_ctx.hasMoreItems && !__VLS_ctx.isLoadingItems) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-load-more" },
            });
            /** @type {__VLS_StyleScopedClasses['item-load-more']} */ ;
        }
        if (__VLS_ctx.selectedItemDisplay) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "selected-item-display" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-code" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
            (__VLS_ctx.selectedItemDisplay.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-common-name" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-common-name']} */ ;
            (__VLS_ctx.selectedItemDisplay.name ||
                __VLS_ctx.selectedItemDisplay.standardName ||
                "Unnamed");
            if (__VLS_ctx.selectedItemDisplay.standardName &&
                __VLS_ctx.selectedItemDisplay.standardName !==
                    __VLS_ctx.selectedItemDisplay.name) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-standard-name" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-standard-name']} */ ;
                (__VLS_ctx.selectedItemDisplay.standardName);
            }
            if (__VLS_ctx.selectedItemDisplay.brand) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-brand" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-brand']} */ ;
                (__VLS_ctx.selectedItemDisplay.brand);
            }
            if (__VLS_ctx.selectedItemDisplay.model) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-model" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-model']} */ ;
                (__VLS_ctx.selectedItemDisplay.model);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-uom" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
            (__VLS_ctx.selectedItemDisplay.uomCode || "N/A");
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.clearItemSelection) },
                type: "button",
                ...{ class: "clear-selection" },
            });
            /** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.getItemUnit(__VLS_ctx.form.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.onBalanceChange) },
            type: "number",
            required: true,
            placeholder: "0",
            min: "0",
            step: "1",
            readonly: (!!__VLS_ctx.editingBalance),
        });
        (__VLS_ctx.form.balance);
        if (__VLS_ctx.form.itemId && __VLS_ctx.form.balance > 0 && !__VLS_ctx.editingBalance) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.formatNumber(__VLS_ctx.form.balance * __VLS_ctx.getConversionValue(Number(__VLS_ctx.form.itemId))));
            (__VLS_ctx.getBaseUOM(Number(__VLS_ctx.form.itemId)));
        }
        if (__VLS_ctx.editingBalance) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
        }
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
            value: (__VLS_ctx.form.status),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Active",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Inactive",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            placeholder: "Min stock level",
            min: "0",
            step: "1",
        });
        (__VLS_ctx.form.minStock);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    }
    if (__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-info" },
        });
        /** @type {__VLS_StyleScopedClasses['import-info']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint-text" },
        });
        /** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "info-text" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['info-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.downloadTemplate) },
            ...{ class: "btn-template" },
            disabled: (__VLS_ctx.importing),
        });
        /** @type {__VLS_StyleScopedClasses['btn-template']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance))
                        return;
                    !__VLS_ctx.importing && __VLS_ctx.triggerCsvUpload($event);
                    // @ts-ignore
                    [getItemUnit, getConversionValue, getBaseUOM, formatNumber, editingBalance, editingBalance, editingBalance, editingBalance, initTab, form, form, form, form, form, form, form, form, form, itemSearchQuery, isLoadingItems, itemCategoryFilter, hasMoreItems, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, selectedItemDisplay, clearItemSelection, onBalanceChange, downloadTemplate, importing, importing, triggerCsvUpload,];
                } },
            ...{ onDragover: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance))
                        return;
                    !__VLS_ctx.importing && (__VLS_ctx.isDragOver = true);
                    // @ts-ignore
                    [importing, isDragOver,];
                } },
            ...{ onDragleave: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance))
                        return;
                    !__VLS_ctx.importing && (__VLS_ctx.isDragOver = false);
                    // @ts-ignore
                    [importing, isDragOver,];
                } },
            ...{ onDrop: (...[$event]) => {
                    if (!(__VLS_ctx.showBalanceModal))
                        return;
                    if (!(__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance))
                        return;
                    !__VLS_ctx.importing && __VLS_ctx.handleCsvDrop($event);
                    // @ts-ignore
                    [importing, handleCsvDrop,];
                } },
            ...{ class: "file-upload-area import-upload" },
            ...{ class: ({ 'drag-over': __VLS_ctx.isDragOver, disabled: __VLS_ctx.importing }) },
        });
        /** @type {__VLS_StyleScopedClasses['file-upload-area']} */ ;
        /** @type {__VLS_StyleScopedClasses['import-upload']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled']} */ ;
        /** @type {__VLS_StyleScopedClasses['drag-over']} */ ;
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
                        if (!(__VLS_ctx.showBalanceModal))
                            return;
                        if (!(__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance))
                            return;
                        if (!(__VLS_ctx.csvFile))
                            return;
                        !__VLS_ctx.importing && __VLS_ctx.removeCsvFile();
                        // @ts-ignore
                        [importing, importing, isDragOver, csvFile, csvFile, csvFile, formatFileSize, removeCsvFile,];
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
                (__VLS_ctx.getStoreName(Number(item.storeId)) || item.storeId);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getGroupName(Number(item.groupId)) || item.groupId);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (item.itemCode || item.itemId);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemNameByCode(item.itemCode) ||
                    __VLS_ctx.getItemCommonName(Number(item.itemId)) ||
                    "Unknown");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.balance);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.status || "Active");
                // @ts-ignore
                [getItemCommonName, importing, importing, importing, importing, handleCsvUpload, importProgress, importProgress, importProgress, importProgress, importProgress, importProgress, importPreviewData, importPreviewData, importPreviewData, getStoreName, getGroupName, getItemNameByCode,];
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
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBalanceModal) },
        ...{ class: "btn-secondary" },
        disabled: (__VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    if (__VLS_ctx.initTab === 'manual' || __VLS_ctx.editingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveBalance) },
            ...{ class: "btn-primary" },
            disabled: (__VLS_ctx.saving ||
                (__VLS_ctx.editingBalance && __VLS_ctx.form.balance !== undefined) ||
                !__VLS_ctx.form.itemId),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        (__VLS_ctx.saving ? "Saving..." : __VLS_ctx.editingBalance ? "Update" : "Initialize");
    }
    if (__VLS_ctx.initTab === 'import' && !__VLS_ctx.editingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.processImport) },
            ...{ class: "btn-primary" },
            disabled: (!__VLS_ctx.csvFile || __VLS_ctx.importing || __VLS_ctx.importPreviewData.length === 0),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        (__VLS_ctx.importing ? "Importing..." : "Import Balances");
    }
}
if (__VLS_ctx.showDeleteModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container delete-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "delete-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteTarget ? __VLS_ctx.getItemCommonName(__VLS_ctx.deleteTarget.itemId) : "");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteTarget ? __VLS_ctx.getStoreName(__VLS_ctx.deleteTarget.storeId) : "");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteTarget ? __VLS_ctx.getGroupName(__VLS_ctx.deleteTarget.groupId) : "");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteTarget ? __VLS_ctx.deleteTarget.balance : 0);
    (__VLS_ctx.deleteTarget ? __VLS_ctx.getItemUnit(__VLS_ctx.deleteTarget.itemId) : "");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-question" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-question']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmDelete) },
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
}
if (__VLS_ctx.showProcessModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeProcessModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container process-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['process-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeProcessModal) },
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onStoreSelect) },
        value: (__VLS_ctx.selectedStoreId),
        required: true,
        disabled: (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedStore),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [store] of __VLS_vFor((__VLS_ctx.availableStores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (store.id),
            value: (store.id),
        });
        (store.name);
        // @ts-ignore
        [availableStores, getItemCommonName, getItemUnit, closeBalanceModal, editingBalance, editingBalance, editingBalance, editingBalance, initTab, initTab, saveBalance, form, form, isAdmin, userData, importing, importing, importing, csvFile, importPreviewData, getStoreName, getGroupName, importResults, importResults, saving, saving, processImport, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, deleteTarget, confirmDelete, showProcessModal, closeProcessModal, closeProcessModal, onStoreSelect, selectedStoreId,];
    }
    if (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedStore) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
        (__VLS_ctx.userData?.assignedStore?.name);
    }
    if (__VLS_ctx.selectedStoreId && __VLS_ctx.storeRequests.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "select-all-container" },
        });
        /** @type {__VLS_StyleScopedClasses['select-all-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "select-all-label" },
        });
        /** @type {__VLS_StyleScopedClasses['select-all-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.toggleAllRequests) },
            type: "checkbox",
        });
        (__VLS_ctx.selectAllRequests);
        (__VLS_ctx.storeRequests.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "requests-checkbox-list" },
        });
        /** @type {__VLS_StyleScopedClasses['requests-checkbox-list']} */ ;
        for (const [req] of __VLS_vFor((__VLS_ctx.storeRequests))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (req.id),
                ...{ class: "request-checkbox" },
            });
            /** @type {__VLS_StyleScopedClasses['request-checkbox']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.onRequestSelect) },
                type: "checkbox",
                value: (req.id),
            });
            (__VLS_ctx.selectedRequestIds);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "request-info" },
            });
            /** @type {__VLS_StyleScopedClasses['request-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "req-code" },
            });
            /** @type {__VLS_StyleScopedClasses['req-code']} */ ;
            (req.requestCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "req-date" },
            });
            /** @type {__VLS_StyleScopedClasses['req-date']} */ ;
            (__VLS_ctx.formatDate(req.requestedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "req-items-count" },
            });
            /** @type {__VLS_StyleScopedClasses['req-items-count']} */ ;
            (req.items?.length || 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "req-action" },
                ...{ class: (__VLS_ctx.getItemActionClass(req)) },
            });
            /** @type {__VLS_StyleScopedClasses['req-action']} */ ;
            (__VLS_ctx.getItemActionLabel(req));
            if (req.isProcessedByGroup) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "req-status processed" },
                });
                /** @type {__VLS_StyleScopedClasses['req-status']} */ ;
                /** @type {__VLS_StyleScopedClasses['processed']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "req-status pending" },
                });
                /** @type {__VLS_StyleScopedClasses['req-status']} */ ;
                /** @type {__VLS_StyleScopedClasses['pending']} */ ;
            }
            // @ts-ignore
            [isAdmin, userData, userData, selectedStoreId, storeRequests, storeRequests, storeRequests, toggleAllRequests, selectAllRequests, onRequestSelect, selectedRequestIds, formatDate, getItemActionClass, getItemActionLabel,];
        }
    }
    if (__VLS_ctx.selectedRequestIds.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.selectedGroupId),
            required: true,
            disabled: (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedGroup),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (const [group] of __VLS_vFor((__VLS_ctx.availableGroups))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (group.id),
                value: (group.id),
            });
            (group.name);
            // @ts-ignore
            [availableGroups, isAdmin, userData, selectedRequestIds, selectedGroupId,];
        }
        if (!__VLS_ctx.isAdmin && __VLS_ctx.userData?.assignedGroup) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.userData?.assignedGroup?.name);
        }
    }
    if (__VLS_ctx.selectedRequestIds.length > 0 && __VLS_ctx.selectedGroupId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "requests-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['requests-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-header" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.selectedRequestIds.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "badge-info" },
        });
        /** @type {__VLS_StyleScopedClasses['badge-info']} */ ;
        (__VLS_ctx.getSelectedTotalItems());
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "requests-list" },
        });
        /** @type {__VLS_StyleScopedClasses['requests-list']} */ ;
        for (const [req] of __VLS_vFor((__VLS_ctx.selectedRequests))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (req.id),
                ...{ class: "request-item" },
            });
            /** @type {__VLS_StyleScopedClasses['request-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "request-header" },
            });
            /** @type {__VLS_StyleScopedClasses['request-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "request-code" },
            });
            /** @type {__VLS_StyleScopedClasses['request-code']} */ ;
            (req.requestCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "request-date" },
            });
            /** @type {__VLS_StyleScopedClasses['request-date']} */ ;
            (__VLS_ctx.formatDate(req.requestedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "request-items" },
            });
            /** @type {__VLS_StyleScopedClasses['request-items']} */ ;
            for (const [item] of __VLS_vFor((req.items))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (item.itemId),
                    ...{ class: "request-item-detail" },
                });
                /** @type {__VLS_StyleScopedClasses['request-item-detail']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.getItemCommonName(item.itemId));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "item-qty" },
                });
                /** @type {__VLS_StyleScopedClasses['item-qty']} */ ;
                (item.quantity);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "item-uom" },
                });
                /** @type {__VLS_StyleScopedClasses['item-uom']} */ ;
                (__VLS_ctx.getItemUnit(item.itemId));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "item-action" },
                    ...{ class: (__VLS_ctx.getItemActionClass(req)) },
                });
                /** @type {__VLS_StyleScopedClasses['item-action']} */ ;
                (__VLS_ctx.getItemActionLabel(req));
                // @ts-ignore
                [getItemCommonName, getItemUnit, isAdmin, userData, userData, selectedRequestIds, selectedRequestIds, formatDate, getItemActionClass, getItemActionLabel, selectedGroupId, getSelectedTotalItems, selectedRequests,];
            }
            if (req.remark) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "request-remark" },
                });
                /** @type {__VLS_StyleScopedClasses['request-remark']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "remark-label" },
                });
                /** @type {__VLS_StyleScopedClasses['remark-label']} */ ;
                (req.remark);
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.selectedStoreId && __VLS_ctx.storeRequests.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-requests" },
        });
        /** @type {__VLS_StyleScopedClasses['no-requests']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "no-requests-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['no-requests-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeProcessModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmProcessRequests) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.selectedStoreId ||
            __VLS_ctx.selectedRequestIds.length === 0 ||
            !__VLS_ctx.selectedGroupId ||
            __VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.processing
        ? "Processing..."
        : `Process ${__VLS_ctx.selectedRequestIds.length} Request(s)`);
}
if (__VLS_ctx.showToggleModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container toggle-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['toggle-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.toggleItem?.status === "Active" ? "⏸️" : "▶️");
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.toggleItem ? __VLS_ctx.getItemCommonName(__VLS_ctx.toggleItem.itemId) : "");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleItem?.status.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleItem?.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleNewStatus?.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleNewStatus);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmToggle) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
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
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'full';
                // @ts-ignore
                [getItemCommonName, closeProcessModal, selectedStoreId, selectedStoreId, storeRequests, selectedRequestIds, selectedRequestIds, selectedGroupId, confirmProcessRequests, processing, processing, showToggleModal, closeToggleModal, closeToggleModal, closeToggleModal, toggleItem, toggleItem, toggleItem, toggleItem, toggleItem, toggleNewStatus, toggleNewStatus, confirmToggle, showExportModal, closeExportModal, closeExportModal, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "full",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'summary';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "summary",
    });
    (__VLS_ctx.exportType);
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
    (__VLS_ctx.exporting ? "Generating..." : "Generate Report");
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
[closeExportModal, exportType, exportSelectedReport, exporting, exporting, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
