import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
// ================================================================
// STATE
// ================================================================
const router = useRouter();
const authStore = useAuthStore();
// Data
const stores = ref([]);
const items = ref([]);
const requests = ref([]);
const loading = ref(false);
const loadingStores = ref(false);
const loadingItems = ref(false);
// User data
const userAssignedStoreId = ref(null);
const userAssignedStoreName = ref(null);
const userIsAdmin = ref(false);
const userIsAskingStore = ref(false);
// Filters & Search
const searchQuery = ref("");
const filterStatus = ref("all");
const filterStore = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
// Validation Errors
const validationErrors = ref([]);
const validationMessage = ref("");
const showValidationErrors = ref(false);
// Expand
const expandedRow = ref(null);
// Modal states
const showModal = ref(false);
const editingRequest = ref(null);
const saving = ref(false);
const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref("full");
// Status Confirmation Modal
const showStatusModal = ref(false);
const statusTarget = ref(null);
const statusAction = ref("approved");
// Item Selection State
const itemSearchQueries = ref({});
const itemDisplayLimits = ref({});
const isLoadingItemsForRow = ref({});
const itemContainers = ref({});
const selectedItemDisplays = ref({});
const searchInputRefs = ref({});
// Form
const form = ref({
    askingStoreId: "",
    supplyingStoreId: "",
    items: [],
    requestedBy: "",
    requestedDate: "",
    status: "pending",
    remark: "",
});
const formErrors = ref([]);
// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// ================================================================
// COMPUTED
// ================================================================
const activeStores = computed(() => {
    return stores.value.filter((store) => store.status === "Active");
});
const filteredSupplyingStores = computed(() => {
    let result = activeStores.value;
    if (form.value.askingStoreId) {
        result = result.filter((store) => (store.storeId || store.id) !== Number(form.value.askingStoreId));
    }
    return result;
});
const isFormValid = computed(() => {
    return !!(form.value.askingStoreId &&
        form.value.supplyingStoreId &&
        form.value.items.length > 0 &&
        form.value.items.every((item) => item.itemId && item.quantity > 0) &&
        form.value.requestedBy &&
        form.value.requestedDate);
});
const hasActiveFilters = computed(() => {
    return (filterStatus.value !== "all" ||
        filterStore.value !== "all" ||
        searchQuery.value);
});
const paginatedRequests = computed(() => {
    return requests.value;
});
const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1;
});
const canCreateRequests = computed(() => {
    if (userIsAdmin.value)
        return true;
    return !!userAssignedStoreId.value;
});
// ================================================================
// 🔥 HELPER: Check if store is foreign/local purchase (skip notifications)
// ================================================================
const SKIP_NOTIFICATION_STORES = ['STORE-006', 'STORE-007'];
const shouldSkipNotifications = (storeCode) => {
    return SKIP_NOTIFICATION_STORES.includes(storeCode);
};
const isSkipStore = (req) => {
    const supplyingStore = stores.value.find(s => (s.storeId || s.id) === req.supplyingStoreId);
    return supplyingStore ? shouldSkipNotifications(supplyingStore.code) : false;
};
// ================================================================
// PERMISSION METHODS - UPDATED for skip stores
// ================================================================
const isUserAskingStore = (req) => {
    if (!userAssignedStoreId.value)
        return false;
    return Number(req.askingStoreId) === userAssignedStoreId.value;
};
const isUserSupplyingStore = (req) => {
    if (!userAssignedStoreId.value)
        return false;
    return Number(req.supplyingStoreId) === userAssignedStoreId.value;
};
const shouldShowRequest = (req) => {
    if (userIsAdmin.value)
        return true;
    // Asking store sees ALL statuses (pending, approved, finalized)
    if (isUserAskingStore(req))
        return true;
    // Supplying store ONLY sees approved and finalized requests
    if (isUserSupplyingStore(req)) {
        return req.status === 'approved' || req.status === 'finalized';
    }
    return false;
};
/**
 * Check if user can edit a request
 * - Only asking store can edit
 * - For skip stores (foreign/local purchase): can edit anytime when pending
 * - For normal stores: can edit if status is 'pending' and NOT fully accepted
 * - Can edit if status is 'rejected' (to fix and resubmit)
 */
const canEditRequest = (req) => {
    if (!isUserAskingStore(req))
        return false;
    // ✅ Can edit rejected requests to fix issues
    if (req.status === 'rejected') {
        return true;
    }
    // 🔥 Check if this is a skip store (foreign/local purchase)
    if (isSkipStore(req)) {
        // For foreign/local purchase stores, can edit anytime when pending
        return req.status === 'pending';
    }
    // ✅ Can edit pending requests if not fully accepted
    if (req.status === 'pending') {
        if (req.notifications && req.notifications.length > 0) {
            const allAccepted = req.notifications.every(n => n.status === 'accepted');
            // Can edit if NOT all accepted (there are still pending or rejected)
            return !allAccepted;
        }
        // If no notifications yet, can edit
        return true;
    }
    // ❌ Cannot edit approved or finalized requests
    return false;
};
/**
 * Check if user can approve a request
 * - Only asking store can approve
 * - For skip stores (foreign/local purchase): can approve anytime when pending
 * - For normal stores: only if all groups have accepted and no rejections
 */
const canApproveRequest = (req) => {
    if (!isUserAskingStore(req))
        return false;
    if (req.status !== 'pending')
        return false;
    // 🔥 Check if this is a skip store (foreign/local purchase)
    if (isSkipStore(req)) {
        // For foreign/local purchase stores, can approve anytime
        return true;
    }
    // Normal store: need all groups to accept
    if (!req.notifications || req.notifications.length === 0)
        return false;
    const allAccepted = req.notifications.every(n => n.status === 'accepted');
    const hasRejection = req.notifications.some(n => n.status === 'rejected');
    return allAccepted && !hasRejection;
};
/**
 * Check if user can print a request
 * - Only asking store can print
 * - For skip stores (foreign/local purchase): can print anytime when pending
 * - For normal stores: only if all groups have accepted and no rejections
 */
const canPrintRequest = (req) => {
    if (!isUserAskingStore(req))
        return false;
    if (req.status !== 'pending')
        return false;
    // 🔥 Check if this is a skip store (foreign/local purchase)
    if (isSkipStore(req)) {
        // For foreign/local purchase stores, can print anytime
        return true;
    }
    // Normal store: need all groups to accept
    if (!req.notifications || req.notifications.length === 0)
        return false;
    const allAccepted = req.notifications.every(n => n.status === 'accepted');
    const hasRejection = req.notifications.some(n => n.status === 'rejected');
    return allAccepted && !hasRejection;
};
const getApproveTooltip = (req) => {
    if (req.status !== 'pending')
        return 'Request is not pending';
    // 🔥 Check if this is a skip store (foreign/local purchase)
    if (isSkipStore(req)) {
        return '📦 No approval required - Click to approve (Foreign/Local Purchase)';
    }
    const hasRejection = req.notifications?.some(n => n.status === 'rejected') || false;
    if (hasRejection)
        return 'Some groups have rejected - Edit and resubmit';
    const allAccepted = req.notifications?.every(n => n.status === 'accepted') || false;
    if (!allAccepted)
        return 'Waiting for all groups to accept';
    return 'All groups accepted - Ready to proceed';
};
const getAcceptanceSummary = (req) => {
    // 🔥 Check if this is a skip store (foreign/local purchase)
    if (isSkipStore(req)) {
        return '📦 you can directly print the request';
    }
    if (!req.notifications || req.notifications.length === 0)
        return 'No responses';
    const total = req.notifications.length;
    const accepted = req.notifications.filter(n => n.status === 'accepted').length;
    const rejected = req.notifications.filter(n => n.status === 'rejected').length;
    if (rejected > 0)
        return `❌ ${rejected} rejected`;
    if (accepted === total)
        return `✅ All ${total} accepted`;
    return `⏳ ${accepted}/${total} accepted`;
};
const getRejectionReasons = (req) => {
    if (!req.notifications)
        return [];
    return req.notifications
        .filter(n => n.status === 'rejected')
        .map(n => ({
        groupName: n.group?.name || `Group ${n.group_id}`,
        reason: n.rejected_reason || 'No reason provided',
        respondedBy: n.respondedByUser?.fullName || n.respondedByUser?.username || 'Unknown',
        respondedAt: n.responded_at,
    }));
};
// ================================================================
// ITEM SELECTION METHODS - ALL FUNCTIONS DEFINED HERE
// ================================================================
const isItemAlreadyAdded = (itemId, currentIndex) => {
    if (!itemId || itemId === 0)
        return false;
    const exists = form.value.items.some((item, index) => item.itemId === itemId && index !== currentIndex);
    return exists;
};
const setItemContainer = (el, index) => {
    itemContainers.value[index] = el;
};
const setSearchInputRef = (el, index) => {
    searchInputRefs.value[index] = el;
};
const resetItemList = (index) => {
    itemDisplayLimits.value[index] = 10;
};
const onItemScroll = (index) => {
    const element = itemContainers.value[index];
    if (!element)
        return;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        const filtered = getFilteredItems(index);
        const currentLimit = itemDisplayLimits.value[index] || 10;
        if (filtered.length > currentLimit && !isLoadingItemsForRow.value[index]) {
            isLoadingItemsForRow.value[index] = true;
            setTimeout(() => {
                itemDisplayLimits.value[index] = Math.min(currentLimit + 10, filtered.length);
                isLoadingItemsForRow.value[index] = false;
            }, 300);
        }
    }
};
const getFilteredItems = (rowIndex) => {
    let itemsList = [...items.value];
    const query = itemSearchQueries.value[rowIndex] || "";
    if (query) {
        const q = query.toLowerCase();
        itemsList = itemsList.filter((item) => item.code?.toLowerCase().includes(q) ||
            item.name?.toLowerCase().includes(q) ||
            item.standardName?.toLowerCase().includes(q) ||
            item.brand?.toLowerCase().includes(q) ||
            item.model?.toLowerCase().includes(q));
    }
    return itemsList;
};
const getDisplayedItems = (rowIndex) => {
    const limit = itemDisplayLimits.value[rowIndex] || 10;
    return getFilteredItems(rowIndex).slice(0, limit);
};
const hasMoreItems = (rowIndex) => {
    const limit = itemDisplayLimits.value[rowIndex] || 10;
    return getDisplayedItems(rowIndex).length < getFilteredItems(rowIndex).length;
};
const selectItemForRow = (rowIndex, itemOption) => {
    const itemRow = form.value.items[rowIndex];
    if (!itemRow)
        return;
    const itemId = itemOption.itemId || itemOption.id;
    if (isItemAlreadyAdded(itemId, rowIndex)) {
        showToastMessage(`"${itemOption.name || itemOption.standardName || 'Item'}" is already added to this request. Please remove the existing one or use a different item.`, "warning");
        return;
    }
    itemRow.itemId = itemId;
    selectedItemDisplays.value[rowIndex] = itemOption;
    updateItemDetails(rowIndex);
    const searchInput = searchInputRefs.value[rowIndex];
    if (searchInput) {
        searchInput.blur();
    }
};
const clearItemSelection = (rowIndex) => {
    const itemRow = form.value.items[rowIndex];
    if (!itemRow)
        return;
    itemRow.itemId = 0;
    selectedItemDisplays.value[rowIndex] = null;
    itemSearchQueries.value[rowIndex] = "";
    itemDisplayLimits.value[rowIndex] = 10;
};
// ================================================================
// METHODS
// ================================================================
const loadUserData = () => {
    const user = authStore.user;
    if (user) {
        const userData = user;
        userIsAdmin.value =
            userData.isAdmin || user.role === "admin" || user.role === "Admin";
        if (user && "assignedStore" in user && user.assignedStore) {
            const assignedStore = user.assignedStore;
            userAssignedStoreId.value = assignedStore.id || null;
            userAssignedStoreName.value = assignedStore.name || null;
        }
        else {
            userAssignedStoreId.value = null;
            userAssignedStoreName.value = null;
        }
        userIsAskingStore.value = !!userAssignedStoreId.value;
    }
};
const getUserAssignedStoreName = () => {
    return userAssignedStoreName.value || "No store assigned";
};
const loadStores = async () => {
    loadingStores.value = true;
    try {
        const response = await itemRequestService.getActiveStores();
        if (response.success) {
            stores.value = response.data;
        }
        else {
            showToastMessage(response.error || "Failed to load stores", "error");
        }
    }
    catch (error) {
        console.error("Load stores error:", error);
        showToastMessage("Failed to load stores", "error");
    }
    finally {
        loadingStores.value = false;
    }
};
const loadItems = async () => {
    loadingItems.value = true;
    try {
        const response = await itemRequestService.getActiveItems();
        if (response.success) {
            items.value = response.data;
        }
        else {
            showToastMessage(response.error || "Failed to load items", "error");
        }
    }
    catch (error) {
        console.error("Load items error:", error);
        showToastMessage("Failed to load items", "error");
    }
    finally {
        loadingItems.value = false;
    }
};
const loadRequests = async () => {
    loading.value = true;
    try {
        const filters = {
            page: currentPage.value,
            limit: pageSize.value,
            search: searchQuery.value || undefined,
        };
        if (!userIsAdmin.value && userAssignedStoreId.value) {
            filters.storeId = userAssignedStoreId.value;
        }
        if (filterStatus.value !== "all") {
            filters.status = filterStatus.value;
        }
        if (filterStore.value !== "all") {
            filters.storeId = Number(filterStore.value);
        }
        const response = await itemRequestService.getRequests(filters);
        if (response.success) {
            requests.value = response.data.requests;
            totalItems.value = response.data.pagination.total;
        }
        else {
            showToastMessage(response.error || "Failed to load requests", "error");
        }
    }
    catch (error) {
        console.error("Load requests error:", error);
        showToastMessage("Failed to load requests", "error");
    }
    finally {
        loading.value = false;
    }
};
const getStoreName = (storeId) => {
    const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
    return store ? store.name : "Unknown Store";
};
const getStoreCode = (storeId) => {
    const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
    return store ? store.code : "N/A";
};
const getItemName = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item ? item.name : "Unknown Item";
};
const getItemCode = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item ? item.code : "N/A";
};
const getItemBrand = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item?.brand || "";
};
const getItemModel = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item?.model || "";
};
const getItemStandardName = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item?.standardName || "";
};
const getItemUOM = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    if (item?.uom) {
        if (typeof item.uom === "string")
            return item.uom;
        if (typeof item.uom === "object" && item.uom.code)
            return item.uom.code;
    }
    return "";
};
const getItemSpecification = (itemId) => {
    const item = items.value.find((i) => (i.itemId || i.id) === itemId);
    return item?.specText || "";
};
const getItemNames = (items) => {
    if (!items || items.length === 0)
        return "";
    const names = items.map((i) => getItemName(Number(i.itemId)));
    return names.join(", ");
};
const getRequesterName = (req) => {
    if (req.requestedByUser) {
        return (req.requestedByUser.fullName ||
            req.requestedByUser.full_name ||
            req.requestedByUser.username ||
            "N/A");
    }
    return req.requestedBy || "N/A";
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
const formatDateTime = (dateString) => {
    if (!dateString)
        return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
const getCurrentUser = () => {
    return (authStore.user?.fullName ||
        authStore.user?.username ||
        authStore.user?.email ||
        "Unknown User");
};
const getCurrentUserId = () => {
    return authStore.user?.userId;
};
const addItemRow = () => {
    const newIndex = form.value.items.length;
    form.value.items.push({
        itemId: 0,
        quantity: 1,
        remark: "",
    });
    itemSearchQueries.value[newIndex] = "";
    itemDisplayLimits.value[newIndex] = 10;
    isLoadingItemsForRow.value[newIndex] = false;
    selectedItemDisplays.value[newIndex] = null;
    itemContainers.value[newIndex] = null;
    searchInputRefs.value[newIndex] = null;
};
const removeItemRow = (index) => {
    form.value.items.splice(index, 1);
    delete itemSearchQueries.value[index];
    delete itemDisplayLimits.value[index];
    delete isLoadingItemsForRow.value[index];
    delete itemContainers.value[index];
    delete selectedItemDisplays.value[index];
    delete searchInputRefs.value[index];
};
const updateItemDetails = (_index) => { };
const toggleExpand = (id) => {
    if (id === undefined || id === null) {
        expandedRow.value = null;
        return;
    }
    expandedRow.value = expandedRow.value === id ? null : id;
};
const closeValidationErrors = () => {
    showValidationErrors.value = false;
    validationErrors.value = [];
    validationMessage.value = "";
};
const openCreateModal = () => {
    editingRequest.value = null;
    const today = new Date().toISOString().split("T")[0] || "";
    closeValidationErrors();
    const askingStoreId = userIsAdmin.value
        ? ""
        : String(userAssignedStoreId.value || "");
    form.value = {
        askingStoreId: askingStoreId,
        supplyingStoreId: "",
        items: [{ itemId: 0, quantity: 1, remark: "" }],
        requestedBy: getCurrentUser(),
        requestedDate: today,
        status: "pending",
        remark: "",
    };
    itemSearchQueries.value[0] = "";
    itemDisplayLimits.value[0] = 10;
    isLoadingItemsForRow.value[0] = false;
    selectedItemDisplays.value[0] = null;
    itemContainers.value[0] = null;
    searchInputRefs.value[0] = null;
    formErrors.value = [];
    showModal.value = true;
};
const editRequest = (req) => {
    // Only asking store can edit
    if (!isUserAskingStore(req)) {
        showToastMessage("You don't have permission to edit this request", "error");
        return;
    }
    // 🔥 Store the original request for reference
    const originalRequest = req;
    if (req.status === 'rejected') {
        showToastMessage("📝 This request was rejected. Please fix the issues and resubmit.", "info");
    }
    // 🔥 Set editingRequest BEFORE populating the form
    editingRequest.value = req;
    const today = new Date().toISOString().split("T")[0] || "";
    const requestedDate = String(req.requestedDate || today);
    closeValidationErrors();
    const askingStoreId = String(req.askingStoreId);
    form.value = {
        askingStoreId: askingStoreId,
        supplyingStoreId: String(req.supplyingStoreId),
        items: req.items
            ? req.items.map((item) => ({
                ...item,
                itemId: Number(item.itemId || 0),
            }))
            : [{ itemId: 0, quantity: 1, remark: "" }],
        requestedBy: getRequesterName(req),
        requestedDate,
        status: "pending",
        remark: req.remark || "",
    };
    form.value.items.forEach((_, index) => {
        itemSearchQueries.value[index] = "";
        itemDisplayLimits.value[index] = 10;
        isLoadingItemsForRow.value[index] = false;
        selectedItemDisplays.value[index] = null;
        itemContainers.value[index] = null;
        searchInputRefs.value[index] = null;
    });
    formErrors.value = [];
    showModal.value = true;
    console.log('✏️ Editing request:', {
        originalRequest: originalRequest,
        editingRequestId: editingRequest.value?.requestId || editingRequest.value?.id,
        formData: form.value
    });
};
const closeModal = () => {
    showModal.value = false;
    editingRequest.value = null; // 🔥 Reset editingRequest
    saving.value = false; // 🔥 Reset saving state
    closeValidationErrors();
    Object.keys(itemSearchQueries.value).forEach((key) => {
        delete itemSearchQueries.value[Number(key)];
        delete itemDisplayLimits.value[Number(key)];
        delete isLoadingItemsForRow.value[Number(key)];
        delete itemContainers.value[Number(key)];
        delete selectedItemDisplays.value[Number(key)];
        delete searchInputRefs.value[Number(key)];
    });
};
// -- Save Request --
const saveRequest = async () => {
    closeValidationErrors();
    formErrors.value = [];
    // Validation checks
    if (!form.value.askingStoreId) {
        formErrors.value.push("Please select the asking store");
    }
    if (!form.value.supplyingStoreId) {
        formErrors.value.push("Please select the supplying store");
    }
    if (form.value.askingStoreId === form.value.supplyingStoreId) {
        formErrors.value.push("Asking store and supplying store cannot be the same");
    }
    if (form.value.items.length === 0) {
        formErrors.value.push("Please add at least one item");
    }
    // Check for duplicates
    const itemIds = form.value.items.map(item => item.itemId).filter(id => id && id !== 0);
    const duplicateIds = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        const duplicateItems = form.value.items.filter(item => duplicateIds.includes(item.itemId));
        duplicateItems.forEach(item => {
            const itemName = getItemName(Number(item.itemId)) || 'Unknown Item';
            formErrors.value.push(`⚠️ "${itemName}" (${getItemCode(Number(item.itemId))}) is already added to this request. Please remove the duplicate entry.`);
        });
        validationErrors.value = duplicateItems.map(item => ({
            itemId: item.itemId,
            itemName: getItemName(Number(item.itemId)) || 'Unknown Item',
            itemCode: getItemCode(Number(item.itemId)) || 'N/A',
            requestedQuantity: item.quantity,
            message: 'This item is already added to the request. Please remove the duplicate entry.'
        }));
        validationMessage.value = 'Duplicate items found in the request. Please fix the following issues:';
        showValidationErrors.value = true;
        saving.value = false;
        return;
    }
    form.value.items.forEach((item, index) => {
        if (!item.itemId) {
            formErrors.value.push(`Item #${index + 1}: Please select an item`);
        }
        if (!item.quantity || item.quantity <= 0) {
            formErrors.value.push(`Item #${index + 1}: Please enter a valid quantity`);
        }
    });
    if (!form.value.requestedDate) {
        formErrors.value.push("Please select a requested date");
    }
    if (formErrors.value.length > 0) {
        saving.value = false;
        return;
    }
    saving.value = true;
    try {
        const userId = getCurrentUserId();
        console.log('📤 Saving request data:', {
            isEditing: !!editingRequest.value,
            editingRequestId: editingRequest.value?.requestId || editingRequest.value?.id,
            formData: form.value
        });
        const requestData = {
            askingStoreId: Number(form.value.askingStoreId),
            supplyingStoreId: Number(form.value.supplyingStoreId),
            items: form.value.items.map((item) => ({
                itemId: Number(item.itemId),
                quantity: item.quantity,
                remark: item.remark || "",
            })),
            requestedById: userId,
            requestedDate: form.value.requestedDate,
            status: form.value.status,
            remark: form.value.remark,
        };
        let response;
        if (editingRequest.value) {
            const requestId = editingRequest.value.requestId || editingRequest.value.id;
            console.log(`🔄 Updating request ${requestId} with data:`, requestData);
            try {
                response = await itemRequestService.updateRequest(requestId, requestData);
            }
            catch (apiError) {
                console.error('❌ API call failed:', apiError);
                showToastMessage(apiError.message || 'Failed to update request', 'error');
                saving.value = false;
                return;
            }
            console.log('📥 Update response:', response);
            // 🔥 Check if response is valid
            if (!response) {
                console.error('❌ No response received from server');
                showToastMessage('No response from server', 'error');
                saving.value = false;
                return;
            }
            // 🔥 Check if response has success property
            if (response.success === true) {
                showToastMessage("✅ Request updated and resubmitted successfully!", "success");
                await loadRequests();
                closeModal();
                saving.value = false;
                return;
            }
            else {
                // 🔥 Check for validation errors
                if (response.errors && response.errors.length > 0) {
                    validationErrors.value = response.errors;
                    validationMessage.value = response.message || "Validation failed. Please fix the issues below.";
                    showValidationErrors.value = true;
                    showToastMessage("Validation failed - please fix the issues below", "error");
                }
                else {
                    // 🔥 Check if there's an error message
                    const errorMsg = response.error || response.message || 'Failed to update request';
                    showToastMessage(errorMsg, "error");
                    console.error('❌ Update failed:', errorMsg);
                }
                saving.value = false;
                return;
            }
        }
        else {
            // Creating new request
            console.log('📤 Creating new request with data:', requestData);
            try {
                response = await itemRequestService.createRequest(requestData);
            }
            catch (apiError) {
                console.error('❌ API call failed:', apiError);
                showToastMessage(apiError.message || 'Failed to create request', 'error');
                saving.value = false;
                return;
            }
            console.log('📥 Create response:', response);
            if (!response) {
                console.error('❌ No response received from server');
                showToastMessage('No response from server', 'error');
                saving.value = false;
                return;
            }
            if (response.success === true) {
                showToastMessage("✅ Request created successfully!", "success");
                await loadRequests();
                closeModal();
                saving.value = false;
                return;
            }
            else {
                if (response.errors && response.errors.length > 0) {
                    validationErrors.value = response.errors;
                    validationMessage.value = response.message || "The request cannot be created due to the following issues:";
                    showValidationErrors.value = true;
                    showToastMessage("Validation failed - please fix the issues below", "error");
                }
                else {
                    const errorMsg = response.error || response.message || 'Failed to create request';
                    showToastMessage(errorMsg, "error");
                    console.error('❌ Create failed:', errorMsg);
                }
                saving.value = false;
                return;
            }
        }
    }
    catch (error) {
        console.error("❌ Save request error:", error);
        const errorData = error.response?.data;
        if (errorData && errorData.errors && errorData.errors.length > 0) {
            validationErrors.value = errorData.errors;
            validationMessage.value = errorData.message || "The request cannot be created due to the following issues:";
            showValidationErrors.value = true;
            showToastMessage("Validation failed - please fix the issues below", "error");
        }
        else {
            showToastMessage(error.message || "Failed to save request", "error");
        }
    }
    finally {
        saving.value = false;
        console.log('✅ Saving completed, saving state reset to false');
    }
};
const openStatusConfirmation = (req, action) => {
    statusTarget.value = req;
    statusAction.value = action;
    showStatusModal.value = true;
};
const closeStatusModal = () => {
    showStatusModal.value = false;
    statusTarget.value = null;
    statusAction.value = "approved";
};
const confirmStatusChange = async () => {
    if (!statusTarget.value)
        return;
    const req = statusTarget.value;
    const action = statusAction.value;
    const requestId = req.requestId || req.id;
    try {
        const response = await itemRequestService.updateStatus(requestId, action);
        if (response.success) {
            showToastMessage(`Request ${action} successfully!`, "success");
            await loadRequests();
        }
        else {
            showToastMessage(response.error || `Failed to ${action} request`, "error");
        }
        closeStatusModal();
    }
    catch (error) {
        showToastMessage(error.message || `Failed to ${action} request`, "error");
    }
};
const printRequest = (req) => {
    const requestId = req.requestId || req.id;
    router.push({
        name: "print-requests",
        query: { id: String(requestId) },
    });
};
const onSearchChange = () => {
    currentPage.value = 1;
    loadRequests();
};
const onFilterChange = () => {
    currentPage.value = 1;
    loadRequests();
};
const clearFilters = () => {
    filterStatus.value = "all";
    filterStore.value = "all";
    searchQuery.value = "";
    currentPage.value = 1;
    showToastMessage("Filters cleared", "info");
    loadRequests();
};
const changePage = (page) => {
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
};
const changePageSize = () => {
    currentPage.value = 1;
};
const openExportModal = () => {
    exportType.value = "full";
    showExportModal.value = true;
};
const closeExportModal = () => {
    showExportModal.value = false;
};
const exportSelectedReport = async () => {
    exporting.value = true;
    try {
        const response = await itemRequestService.exportRequests({
            status: filterStatus.value === "all" ? undefined : filterStatus.value,
            storeId: filterStore.value === "all" ? undefined : Number(filterStore.value),
        });
        if (response.success && response.data.length > 0) {
            const firstRow = response.data[0];
            const headers = Object.keys(firstRow);
            const rows = response.data.map((item) => headers.map((key) => item[key] ?? ""));
            const csv = [
                headers.join(","),
                ...rows.map((row) => row.join(",")),
            ].join("\n");
            const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `item_requests_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToastMessage("Export completed successfully!", "success");
        }
        else {
            showToastMessage(response.error || "No data to export", "error");
        }
    }
    catch (error) {
        console.error("Export error:", error);
        showToastMessage(error.message || "Failed to export", "error");
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
// WATCHERS
// ================================================================
watch([filterStatus, filterStore, searchQuery], () => {
    currentPage.value = 1;
    loadRequests();
});
watch(currentPage, (newPage, oldPage) => {
    if (newPage !== oldPage) {
        loadRequests();
    }
});
watch(pageSize, () => {
    currentPage.value = 1;
    loadRequests();
});
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    loadUserData();
    await Promise.all([loadStores(), loadItems(), loadRequests()]);
    // 🔥 REMOVE this line - let the backend handle filtering based on user role
    // if (!userIsAdmin.value && userAssignedStoreId.value) {
    //   filterStore.value = String(userAssignedStoreId.value);
    // }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['validation-error-header']} */ ;
/** @type {__VLS_StyleScopedClasses['validation-error-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['print-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['items-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-edit-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-approve-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-finalize-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-item']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-remove-item']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['already-added']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['item-search-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['item-search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['item-search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-container']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-container']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['item-row']} */ ;
/** @type {__VLS_StyleScopedClasses['col-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-header']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-date']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['col-code']} */ ;
/** @type {__VLS_StyleScopedClasses['col-items']} */ ;
/** @type {__VLS_StyleScopedClasses['col-store']} */ ;
/** @type {__VLS_StyleScopedClasses['col-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-content']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-left']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
/** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['approved']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['finalized']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-details']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
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
    placeholder: "Search by item, store, or requester...",
});
if (__VLS_ctx.userIsAdmin || __VLS_ctx.userIsAskingStore) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openCreateModal) },
        ...{ class: "btn-add" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStatus),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "pending",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "approved",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "rejected",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "finalized",
});
if (__VLS_ctx.userIsAdmin) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onFilterChange) },
        value: (__VLS_ctx.filterStore),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "all",
    });
    for (const [store] of __VLS_vFor((__VLS_ctx.activeStores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (store.storeId || store.id),
            value: (String(store.storeId || store.id)),
        });
        (store.name);
        // @ts-ignore
        [totalItems, onSearchChange, searchQuery, userIsAdmin, userIsAdmin, userIsAskingStore, openCreateModal, onFilterChange, onFilterChange, filterStatus, filterStore, activeStores,];
    }
}
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
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "requests-table" },
    });
    /** @type {__VLS_StyleScopedClasses['requests-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-expand" },
    });
    /** @type {__VLS_StyleScopedClasses['col-expand']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-code" },
    });
    /** @type {__VLS_StyleScopedClasses['col-code']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-items" },
    });
    /** @type {__VLS_StyleScopedClasses['col-items']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-store" },
    });
    /** @type {__VLS_StyleScopedClasses['col-store']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['col-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-store" },
    });
    /** @type {__VLS_StyleScopedClasses['col-store']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-status" },
    });
    /** @type {__VLS_StyleScopedClasses['col-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['col-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.paginatedRequests.length === 0) {
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
        if (__VLS_ctx.canCreateRequests) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.openCreateModal) },
                ...{ class: "btn-secondary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        }
    }
    for (const [req] of __VLS_vFor((__VLS_ctx.paginatedRequests))) {
        (req.requestId || req.id);
        if (__VLS_ctx.shouldShowRequest(req)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: ({
                        'expanded-row': __VLS_ctx.expandedRow === (req.requestId || req.id),
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.shouldShowRequest(req)))
                            return;
                        __VLS_ctx.toggleExpand(req.requestId || req.id);
                        // @ts-ignore
                        [openCreateModal, hasActiveFilters, clearFilters, openExportModal, loading, paginatedRequests, paginatedRequests, canCreateRequests, shouldShowRequest, expandedRow, toggleExpand,];
                    } },
                ...{ class: "expand-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
            (__VLS_ctx.expandedRow === (req.requestId || req.id) ? "▼" : "▶");
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "code-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['code-cell']} */ ;
            (req.requestCode || req.id);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "items-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['items-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "item-count" },
            });
            /** @type {__VLS_StyleScopedClasses['item-count']} */ ;
            (req.items?.length || 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "item-names" },
            });
            /** @type {__VLS_StyleScopedClasses['item-names']} */ ;
            (__VLS_ctx.getItemNames(req.items));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "store-name" },
            });
            /** @type {__VLS_StyleScopedClasses['store-name']} */ ;
            (__VLS_ctx.getStoreName(req.askingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "arrow-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['arrow-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "store-name" },
            });
            /** @type {__VLS_StyleScopedClasses['store-name']} */ ;
            (__VLS_ctx.getStoreName(req.supplyingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['status-badge', req.status]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (req.status);
            if (req.status === 'pending') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-status" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-status']} */ ;
                for (const [notification] of __VLS_vFor(((req.notifications || [])))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (notification.id),
                        ...{ class: (['notification-dot', notification.status]) },
                        title: ('Group: ' + (notification.group?.name || notification.group_id) + ' - ' + notification.status),
                    });
                    /** @type {__VLS_StyleScopedClasses['notification-dot']} */ ;
                    // @ts-ignore
                    [expandedRow, getItemNames, getStoreName, getStoreName,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "notification-text" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-text']} */ ;
                (__VLS_ctx.getAcceptanceSummary(req));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "action-buttons" },
            });
            /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
            if (__VLS_ctx.canPrintRequest(req) && __VLS_ctx.userIsAskingStore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.shouldShowRequest(req)))
                                return;
                            if (!(__VLS_ctx.canPrintRequest(req) && __VLS_ctx.userIsAskingStore))
                                return;
                            __VLS_ctx.printRequest(req);
                            // @ts-ignore
                            [userIsAskingStore, getAcceptanceSummary, canPrintRequest, printRequest,];
                        } },
                    ...{ class: "icon-btn print-btn" },
                    disabled: (!__VLS_ctx.canPrintRequest(req)),
                    title: (__VLS_ctx.getApproveTooltip(req)),
                });
                /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
                /** @type {__VLS_StyleScopedClasses['print-btn']} */ ;
            }
            if (__VLS_ctx.canEditRequest(req) && __VLS_ctx.userIsAskingStore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.shouldShowRequest(req)))
                                return;
                            if (!(__VLS_ctx.canEditRequest(req) && __VLS_ctx.userIsAskingStore))
                                return;
                            __VLS_ctx.editRequest(req);
                            // @ts-ignore
                            [userIsAskingStore, canPrintRequest, getApproveTooltip, canEditRequest, editRequest,];
                        } },
                    ...{ class: "icon-btn" },
                    title: (__VLS_ctx.canEditRequest(req) ? 'Edit' : 'Cannot edit this request'),
                });
                /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
            }
            if (__VLS_ctx.canApproveRequest(req) && __VLS_ctx.userIsAskingStore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.shouldShowRequest(req)))
                                return;
                            if (!(__VLS_ctx.canApproveRequest(req) && __VLS_ctx.userIsAskingStore))
                                return;
                            __VLS_ctx.openStatusConfirmation(req, 'approved');
                            // @ts-ignore
                            [userIsAskingStore, canEditRequest, canApproveRequest, openStatusConfirmation,];
                        } },
                    ...{ class: "icon-btn" },
                    disabled: (!__VLS_ctx.canApproveRequest(req)),
                    title: (__VLS_ctx.getApproveTooltip(req)),
                });
                /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
            }
        }
        if (__VLS_ctx.expandedRow === (req.requestId || req.id) && __VLS_ctx.shouldShowRequest(req)) {
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
            (req.requestCode || req.id);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['status-badge', req.status]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (req.status);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getRequesterName(req));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatDate(req.requestedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatDateTime(req.createdAt));
            if (req.updatedAt) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (__VLS_ctx.formatDateTime(req.updatedAt));
            }
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
            (__VLS_ctx.getStoreName(req.askingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getStoreCode(req.askingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getStoreName(req.supplyingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getStoreCode(req.supplyingStoreId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "items-detail-table" },
            });
            /** @type {__VLS_StyleScopedClasses['items-detail-table']} */ ;
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            if (!req.items || req.items.length === 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    colspan: "9",
                    ...{ class: "text-center no-items" },
                });
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['no-items']} */ ;
            }
            for (const [item, index] of __VLS_vFor((req.items))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (index),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "text-center" },
                });
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                (index + 1);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemName(item.itemId));
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemCode(item.itemId));
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemBrand(item.itemId) || "N/A");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemModel(item.itemId) || "N/A");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.getItemUOM(item.itemId) || "N/A");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "text-center" },
                });
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                (item.quantity);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "spec-cell" },
                });
                /** @type {__VLS_StyleScopedClasses['spec-cell']} */ ;
                (__VLS_ctx.getItemSpecification(item.itemId) || "N/A");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.remark || "-");
                // @ts-ignore
                [shouldShowRequest, expandedRow, getStoreName, getStoreName, getApproveTooltip, canApproveRequest, getRequesterName, formatDate, formatDateTime, formatDateTime, getStoreCode, getStoreCode, getItemName, getItemCode, getItemBrand, getItemModel, getItemUOM, getItemSpecification,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: "total-row" },
            });
            /** @type {__VLS_StyleScopedClasses['total-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (req.items?.length || 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            if (req.remark) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "remark-content" },
                });
                /** @type {__VLS_StyleScopedClasses['remark-content']} */ ;
                (req.remark);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-remark" },
                });
                /** @type {__VLS_StyleScopedClasses['no-remark']} */ ;
            }
            if (__VLS_ctx.getRejectionReasons(req).length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-card full-width rejection-card" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
                /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
                /** @type {__VLS_StyleScopedClasses['rejection-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
                for (const [reason, idx] of __VLS_vFor((__VLS_ctx.getRejectionReasons(req)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (idx),
                        ...{ class: "rejection-item" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-item']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "rejection-header" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-header']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rejection-group" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-group']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rejection-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-icon']} */ ;
                    (reason.groupName);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rejection-date" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-date']} */ ;
                    (__VLS_ctx.formatDateTime(reason.respondedAt));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "rejection-reason-textarea" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-reason-textarea']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                        value: (reason.reason),
                        readonly: true,
                        rows: "3",
                        ...{ class: "rejection-textarea-readonly" },
                        placeholder: "No reason provided",
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-textarea-readonly']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "rejection-by" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-by']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rejection-by-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rejection-by-icon']} */ ;
                    (reason.respondedBy);
                    // @ts-ignore
                    [formatDateTime, getRejectionReasons, getRejectionReasons,];
                }
            }
            if (__VLS_ctx.userIsAskingStore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
                if (__VLS_ctx.canPrintRequest(req)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedRow === (req.requestId || req.id) && __VLS_ctx.shouldShowRequest(req)))
                                    return;
                                if (!(__VLS_ctx.userIsAskingStore))
                                    return;
                                if (!(__VLS_ctx.canPrintRequest(req)))
                                    return;
                                __VLS_ctx.printRequest(req);
                                // @ts-ignore
                                [userIsAskingStore, canPrintRequest, printRequest,];
                            } },
                        ...{ class: "btn-print-detail" },
                        disabled: (!__VLS_ctx.canPrintRequest(req)),
                    });
                    /** @type {__VLS_StyleScopedClasses['btn-print-detail']} */ ;
                }
                if (__VLS_ctx.canEditRequest(req)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedRow === (req.requestId || req.id) && __VLS_ctx.shouldShowRequest(req)))
                                    return;
                                if (!(__VLS_ctx.userIsAskingStore))
                                    return;
                                if (!(__VLS_ctx.canEditRequest(req)))
                                    return;
                                __VLS_ctx.editRequest(req);
                                // @ts-ignore
                                [canPrintRequest, canEditRequest, editRequest,];
                            } },
                        ...{ class: "btn-edit-detail" },
                    });
                    /** @type {__VLS_StyleScopedClasses['btn-edit-detail']} */ ;
                }
                if (__VLS_ctx.canApproveRequest(req)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedRow === (req.requestId || req.id) && __VLS_ctx.shouldShowRequest(req)))
                                    return;
                                if (!(__VLS_ctx.userIsAskingStore))
                                    return;
                                if (!(__VLS_ctx.canApproveRequest(req)))
                                    return;
                                __VLS_ctx.openStatusConfirmation(req, 'approved');
                                // @ts-ignore
                                [canApproveRequest, openStatusConfirmation,];
                            } },
                        ...{ class: "btn-approve-detail" },
                        disabled: (!__VLS_ctx.canApproveRequest(req)),
                        title: (__VLS_ctx.getApproveTooltip(req)),
                    });
                    /** @type {__VLS_StyleScopedClasses['btn-approve-detail']} */ ;
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-actions readonly-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
                /** @type {__VLS_StyleScopedClasses['readonly-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "readonly-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['readonly-badge']} */ ;
            }
        }
        // @ts-ignore
        [getApproveTooltip, canApproveRequest,];
    }
}
if (__VLS_ctx.totalItems > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [totalItems, changePage, currentPage,];
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
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [changePage, currentPage, currentPage, currentPage, totalPages,];
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
if (__VLS_ctx.showModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container request-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['request-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingRequest ? "✏️ Edit Request" : "➕ New Item Request");
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    if (__VLS_ctx.showValidationErrors && __VLS_ctx.validationErrors.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "validation-error-box" },
        });
        /** @type {__VLS_StyleScopedClasses['validation-error-box']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "validation-error-header" },
        });
        /** @type {__VLS_StyleScopedClasses['validation-error-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-title" },
        });
        /** @type {__VLS_StyleScopedClasses['error-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "validation-error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['validation-error-message']} */ ;
        (__VLS_ctx.validationMessage);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "validation-error-list" },
        });
        /** @type {__VLS_StyleScopedClasses['validation-error-list']} */ ;
        for (const [error, index] of __VLS_vFor((__VLS_ctx.validationErrors))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (index),
                ...{ class: "validation-error-item" },
            });
            /** @type {__VLS_StyleScopedClasses['validation-error-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "error-item-header" },
            });
            /** @type {__VLS_StyleScopedClasses['error-item-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "error-item-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['error-item-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "error-item-title" },
            });
            /** @type {__VLS_StyleScopedClasses['error-item-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (error.itemName || "Unknown Item");
            if (error.itemCode) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "error-code" },
                });
                /** @type {__VLS_StyleScopedClasses['error-code']} */ ;
                (error.itemCode);
            }
            if (error.requestedQuantity) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "error-quantity" },
                });
                /** @type {__VLS_StyleScopedClasses['error-quantity']} */ ;
                (error.requestedQuantity);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "error-item-message" },
            });
            /** @type {__VLS_StyleScopedClasses['error-item-message']} */ ;
            (error.message);
            if (error.groupsWithoutBalance &&
                error.groupsWithoutBalance.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "error-groups" },
                });
                /** @type {__VLS_StyleScopedClasses['error-groups']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "groups-label" },
                });
                /** @type {__VLS_StyleScopedClasses['groups-label']} */ ;
                for (const [group, idx] of __VLS_vFor((error.groupsWithoutBalance))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (idx),
                        ...{ class: "group-tag" },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-tag']} */ ;
                    (group.groupName);
                    // @ts-ignore
                    [currentPage, totalPages, changePageSize, pageSize, showModal, closeModal, closeModal, editingRequest, showValidationErrors, validationErrors, validationErrors, validationMessage,];
                }
            }
            if (error.balanceDetails && error.balanceDetails.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "error-balance-details" },
                });
                /** @type {__VLS_StyleScopedClasses['error-balance-details']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "balance-label" },
                });
                /** @type {__VLS_StyleScopedClasses['balance-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "balance-list" },
                });
                /** @type {__VLS_StyleScopedClasses['balance-list']} */ ;
                for (const [detail, idx] of __VLS_vFor((error.balanceDetails))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (idx),
                        ...{ class: "balance-item" },
                    });
                    /** @type {__VLS_StyleScopedClasses['balance-item']} */ ;
                    (detail.groupName);
                    (detail.balance);
                    // @ts-ignore
                    [];
                }
            }
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "validation-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['validation-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.closeValidationErrors) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveRequest) },
        ...{ class: "request-form" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.showValidationErrors) }, null, null);
    /** @type {__VLS_StyleScopedClasses['request-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    if (__VLS_ctx.userIsAdmin) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.form.askingStoreId),
            required: true,
            disabled: (!!__VLS_ctx.userAssignedStoreId || !!__VLS_ctx.editingRequest),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (const [store] of __VLS_vFor((__VLS_ctx.activeStores))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (store.storeId || store.id),
                value: (store.storeId || store.id),
            });
            (store.name);
            // @ts-ignore
            [userIsAdmin, activeStores, editingRequest, showValidationErrors, closeValidationErrors, saveRequest, form, userAssignedStoreId,];
        }
        if (__VLS_ctx.userAssignedStoreId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.getUserAssignedStoreName());
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.supplyingStoreId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [store] of __VLS_vFor((__VLS_ctx.filteredSupplyingStores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (store.storeId || store.id),
            value: (store.storeId || store.id),
        });
        (store.name);
        // @ts-ignore
        [form, userAssignedStoreId, getUserAssignedStoreName, filteredSupplyingStores,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addItemRow) },
        type: "button",
        ...{ class: "btn-add-item" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-add-item']} */ ;
    if (__VLS_ctx.form.items.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-items-message" },
        });
        /** @type {__VLS_StyleScopedClasses['no-items-message']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.form.items))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "item-row" },
        });
        /** @type {__VLS_StyleScopedClasses['item-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-row-header" },
        });
        /** @type {__VLS_StyleScopedClasses['item-row-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "item-number" },
        });
        /** @type {__VLS_StyleScopedClasses['item-number']} */ ;
        (index + 1);
        if (__VLS_ctx.form.items.length > 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showModal))
                            return;
                        if (!(__VLS_ctx.form.items.length > 1))
                            return;
                        __VLS_ctx.removeItemRow(index);
                        // @ts-ignore
                        [form, form, form, addItemRow, removeItemRow,];
                    } },
                type: "button",
                ...{ class: "btn-remove-item" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-remove-item']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        if (item.itemId && __VLS_ctx.isItemAlreadyAdded(item.itemId, index)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "duplicate-error" },
            });
            /** @type {__VLS_StyleScopedClasses['duplicate-error']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-search-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['item-search-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.showModal))
                        return;
                    __VLS_ctx.resetItemList(index);
                    // @ts-ignore
                    [isItemAlreadyAdded, resetItemList,];
                } },
            type: "text",
            ref: ((el) => __VLS_ctx.setSearchInputRef(el, index)),
            value: (__VLS_ctx.itemSearchQueries[index]),
            placeholder: "Search items by code, name, brand, or model...",
            ...{ class: "item-search-input" },
        });
        /** @type {__VLS_StyleScopedClasses['item-search-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-select-container" },
            ref: ((el) => __VLS_ctx.setItemContainer(el, index)),
        });
        /** @type {__VLS_StyleScopedClasses['item-select-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onScroll: (...[$event]) => {
                    if (!(__VLS_ctx.showModal))
                        return;
                    __VLS_ctx.onItemScroll(index);
                    // @ts-ignore
                    [setSearchInputRef, itemSearchQueries, setItemContainer, onItemScroll,];
                } },
            ...{ class: "item-select-scroll" },
        });
        /** @type {__VLS_StyleScopedClasses['item-select-scroll']} */ ;
        for (const [itemOption] of __VLS_vFor((__VLS_ctx.getDisplayedItems(index)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showModal))
                            return;
                        __VLS_ctx.selectItemForRow(index, itemOption);
                        // @ts-ignore
                        [getDisplayedItems, selectItemForRow,];
                    } },
                key: (itemOption.id),
                ...{ class: "item-option" },
                ...{ class: ({
                        selected: item.itemId ===
                            (itemOption.itemId || itemOption.id),
                        'already-added': __VLS_ctx.isItemAlreadyAdded(itemOption.itemId || itemOption.id, index)
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['item-option']} */ ;
            /** @type {__VLS_StyleScopedClasses['selected']} */ ;
            /** @type {__VLS_StyleScopedClasses['already-added']} */ ;
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
            (itemOption.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-option-middle" },
            });
            /** @type {__VLS_StyleScopedClasses['item-option-middle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-option-common-name" },
            });
            /** @type {__VLS_StyleScopedClasses['item-option-common-name']} */ ;
            (itemOption.commonName ||
                itemOption.name ||
                "Unnamed");
            if (itemOption.standardName &&
                itemOption.standardName !==
                    (itemOption.commonName || itemOption.name)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-standard-name" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-standard-name']} */ ;
                (itemOption.standardName);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-option-right" },
            });
            /** @type {__VLS_StyleScopedClasses['item-option-right']} */ ;
            if (itemOption.brand) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-brand" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-brand']} */ ;
                (itemOption.brand);
            }
            if (itemOption.model) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "item-option-model" },
                });
                /** @type {__VLS_StyleScopedClasses['item-option-model']} */ ;
                (itemOption.model);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-option-uom" },
            });
            /** @type {__VLS_StyleScopedClasses['item-option-uom']} */ ;
            (itemOption.uom?.code || "N/A");
            if (__VLS_ctx.isItemAlreadyAdded(itemOption.itemId || itemOption.id, index)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "already-added-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['already-added-badge']} */ ;
            }
            // @ts-ignore
            [isItemAlreadyAdded, isItemAlreadyAdded,];
        }
        if (__VLS_ctx.isLoadingItemsForRow[index]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-loading" },
            });
            /** @type {__VLS_StyleScopedClasses['item-loading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spinner-small" },
            });
            /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
        }
        if (__VLS_ctx.getFilteredItems(index).length === 0 &&
            !__VLS_ctx.isLoadingItemsForRow[index]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-no-results" },
            });
            /** @type {__VLS_StyleScopedClasses['item-no-results']} */ ;
        }
        if (__VLS_ctx.hasMoreItems(index) && !__VLS_ctx.isLoadingItemsForRow[index]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-load-more" },
            });
            /** @type {__VLS_StyleScopedClasses['item-load-more']} */ ;
        }
        if (__VLS_ctx.selectedItemDisplays[index]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "selected-item-display" },
                ...{ class: ({
                        'selected-duplicate': item.itemId && __VLS_ctx.isItemAlreadyAdded(item.itemId, index)
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-display']} */ ;
            /** @type {__VLS_StyleScopedClasses['selected-duplicate']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-badge']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-code" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-code']} */ ;
            (__VLS_ctx.selectedItemDisplays[index].code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-name" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-name']} */ ;
            (__VLS_ctx.selectedItemDisplays[index].standardName ||
                __VLS_ctx.selectedItemDisplays[index].name);
            if (__VLS_ctx.selectedItemDisplays[index].commonName) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-common" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-common']} */ ;
                (__VLS_ctx.selectedItemDisplays[index].commonName);
            }
            if (__VLS_ctx.selectedItemDisplays[index].brand) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-brand" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-brand']} */ ;
                (__VLS_ctx.selectedItemDisplays[index].brand);
            }
            if (__VLS_ctx.selectedItemDisplays[index].model) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "selected-item-model" },
                });
                /** @type {__VLS_StyleScopedClasses['selected-item-model']} */ ;
                (__VLS_ctx.selectedItemDisplays[index].model);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "selected-item-uom" },
            });
            /** @type {__VLS_StyleScopedClasses['selected-item-uom']} */ ;
            (__VLS_ctx.selectedItemDisplays[index].uom?.code || "N/A");
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showModal))
                            return;
                        if (!(__VLS_ctx.selectedItemDisplays[index]))
                            return;
                        __VLS_ctx.clearItemSelection(index);
                        // @ts-ignore
                        [isItemAlreadyAdded, isLoadingItemsForRow, isLoadingItemsForRow, isLoadingItemsForRow, getFilteredItems, hasMoreItems, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, selectedItemDisplays, clearItemSelection,];
                    } },
                type: "button",
                ...{ class: "clear-selection" },
            });
            /** @type {__VLS_StyleScopedClasses['clear-selection']} */ ;
            if (item.itemId && __VLS_ctx.isItemAlreadyAdded(item.itemId, index)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "duplicate-tag" },
                });
                /** @type {__VLS_StyleScopedClasses['duplicate-tag']} */ ;
            }
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.getItemUOM(Number(item.itemId))),
            type: "text",
            readonly: true,
            ...{ class: "readonly-field" },
        });
        /** @type {__VLS_StyleScopedClasses['readonly-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0.01",
            step: "0.01",
            required: true,
            placeholder: "Enter quantity",
        });
        (item.quantity);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.getItemStandardName(Number(item.itemId))),
            type: "text",
            readonly: true,
            ...{ class: "readonly-field" },
        });
        /** @type {__VLS_StyleScopedClasses['readonly-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (item.remark),
            rows: "2",
            placeholder: "Add remark for this item...",
            ...{ class: "textarea-field" },
        });
        /** @type {__VLS_StyleScopedClasses['textarea-field']} */ ;
        // @ts-ignore
        [getItemUOM, isItemAlreadyAdded, getItemStandardName,];
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
        value: (__VLS_ctx.form.requestedBy),
        type: "text",
        readonly: true,
        ...{ class: "readonly-field" },
    });
    /** @type {__VLS_StyleScopedClasses['readonly-field']} */ ;
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
        type: "date",
        required: true,
    });
    (__VLS_ctx.form.requestedDate);
    if (!__VLS_ctx.editingRequest) {
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
            value: "pending",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "approved",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "rejected",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    }
    if (__VLS_ctx.editingRequest) {
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
            value: "Pending (Reset on Edit)",
            type: "text",
            readonly: true,
            ...{ class: "status-info-field" },
        });
        /** @type {__VLS_StyleScopedClasses['status-info-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.remark),
        rows: "3",
        placeholder: "General notes or remarks...",
        ...{ class: "textarea-field" },
    });
    /** @type {__VLS_StyleScopedClasses['textarea-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    if (__VLS_ctx.formErrors.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-errors" },
        });
        /** @type {__VLS_StyleScopedClasses['form-errors']} */ ;
        for (const [error] of __VLS_vFor((__VLS_ctx.formErrors))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (error),
                ...{ class: "form-error" },
            });
            /** @type {__VLS_StyleScopedClasses['form-error']} */ ;
            (error);
            // @ts-ignore
            [editingRequest, editingRequest, form, form, form, form, formErrors, formErrors,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveRequest) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving || !__VLS_ctx.isFormValid),
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.showValidationErrors) }, null, null);
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? "Saving..." : __VLS_ctx.editingRequest ? "Update" : "Create");
}
if (__VLS_ctx.showStatusModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeStatusModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container status-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeStatusModal) },
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
    (__VLS_ctx.statusTarget?.requestCode ||
        __VLS_ctx.statusTarget?.id ||
        __VLS_ctx.statusTarget?.requestId);
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
    (__VLS_ctx.statusTarget?.items?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.statusTarget?.status]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.statusTarget?.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.statusAction]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.statusAction);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.statusAction);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeStatusModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmStatusChange) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.statusAction);
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
                [closeModal, editingRequest, showValidationErrors, saveRequest, saving, saving, isFormValid, showStatusModal, closeStatusModal, closeStatusModal, closeStatusModal, statusTarget, statusTarget, statusTarget, statusTarget, statusTarget, statusTarget, statusAction, statusAction, statusAction, statusAction, confirmStatusChange, showExportModal, closeExportModal, closeExportModal, exportType,];
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
    (__VLS_ctx.exporting ? "Exporting..." : "Export");
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
