import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import leaveService from '@/stores/leaveService';
import employeeService from '@/stores/employee';
const router = useRouter();
// State
const loading = ref(false);
const loadingPending = ref(false);
const loadingApproved = ref(false);
const loadingRejected = ref(false);
const loadingOverdue = ref(false);
const loadingCalendar = ref(false);
const loadingBalance = ref(false);
const activeTab = ref('pending');
const formSubmitted = ref(false);
const today = new Date().toISOString().split('T')[0];
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const toastIcon = ref('✅');
// Validation
const validationErrors = ref({});
const isFormValid = ref(false);
// Return confirmation
const showReturnConfirmModal = ref(false);
const returnConfirmEmployee = ref(null);
const actualReturnDate = ref('');
// Data lists
const departmentsList = ref([]);
const leaveTypesList = ref([]);
const employeesList = ref([]);
const employeeBalances = ref({});
// Pagination state for each tab
const pendingPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const approvedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const rejectedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
// Data arrays
const pendingLeaveRequests = ref([]);
const approvedLeaveRequests = ref([]);
const rejectedLeaveRequests = ref([]);
const overdueReturnsList = ref([]);
const calendarData = ref([]);
// Filters
const pendingFilters = ref({ search: '', department: null, leaveType: null });
const approvedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) });
const rejectedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) });
// Balance filters
const balanceSearch = ref('');
const balanceDepartmentFilter = ref(null);
const balancePage = ref(1);
const balanceData = ref([]);
const balanceTotalPages = ref(1);
const itemsPerPage = 10;
// Calendar
const calendarMonth = ref(new Date().getMonth());
const calendarYear = ref(new Date().getFullYear());
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Tooltip
const tooltipVisible = ref(false);
const tooltipLeaves = ref([]);
const tooltipReturns = ref([]);
const tooltipStyle = ref({});
// Modal
const showAddLeaveModal = ref(false);
// New Leave Form
const newLeave = ref({
    employeeId: null,
    leaveTypeId: null,
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending'
});
const selectedEmployee = ref(null);
const selectedLeaveType = ref(null);
// Stats - FIXED: Use camelCase to match API
const stats = ref({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    employeesOnLeaveToday: 0,
    totalDaysRequested: 0,
    departmentsWithLeave: 0,
    overdueReturns: 0
});
// Debounce function
let debounceTimeout;
function debounce(func, delay = 500) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
}
// Helper function to get employee display name with department and code
function getEmployeeDisplayName(emp) {
    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    // Get department name - available as departmentName directly
    const departmentName = emp.departmentName || 'No Dept';
    // Get employee code - it's actually called employeeId in your API response
    const employeeCode = emp.employeeId || emp.employeeCode || emp.code || 'No Code';
    return `${fullName} (${departmentName} / ${employeeCode})`;
}
const debouncedLoadPending = () => debounce(() => loadPendingRequests());
const debouncedLoadApproved = () => debounce(() => loadApprovedRequests());
const debouncedLoadRejected = () => debounce(() => loadRejectedRequests());
const debouncedLoadBalance = () => debounce(() => loadBalanceData());
// ==================== API CALLS ====================
async function loadPendingRequests() {
    loadingPending.value = true;
    try {
        const params = {
            status: 'pending',
            page: pendingPagination.value.page,
            limit: pendingPagination.value.limit,
            search: pendingFilters.value.search || undefined,
            departmentId: pendingFilters.value.department || undefined,
            leaveTypeId: pendingFilters.value.leaveType || undefined
        };
        const result = await leaveService.getLeaveRequests(params);
        if (result.success) {
            pendingLeaveRequests.value = result.data;
            pendingPagination.value = {
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                totalPages: result.pagination.totalPages
            };
        }
    }
    catch (error) {
        console.error('Error loading pending requests:', error);
    }
    finally {
        loadingPending.value = false;
    }
}
async function loadApprovedRequests() {
    loadingApproved.value = true;
    try {
        const params = {
            status: 'approved',
            page: approvedPagination.value.page,
            limit: approvedPagination.value.limit,
            search: approvedFilters.value.search || undefined,
            departmentId: approvedFilters.value.department || undefined,
            leaveTypeId: approvedFilters.value.leaveType || undefined
        };
        // Add month filter if present
        if (approvedFilters.value.month) {
            const [year, month] = approvedFilters.value.month.split('-');
            params.startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            params.endDate = `${year}-${month}-${lastDay}`;
        }
        const result = await leaveService.getLeaveRequests(params);
        if (result.success) {
            // FIXED: Map the data to ensure approvedDate is available
            approvedLeaveRequests.value = result.data.map(request => ({
                ...request,
                // Ensure approvedDate is set from either field
                approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null,
                // Also map other date fields consistently
                rejectedDate: request.rejectedDate || request.rejected_at || request.rejectedAt || null,
                requestedDate: request.requestedDate || request.requested_at || request.requestedAt || null
            }));
            approvedPagination.value = {
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                totalPages: result.pagination.totalPages
            };
            // Debug: Log first request to see structure
            if (approvedLeaveRequests.value.length > 0) {
                console.log('Sample approved request:', approvedLeaveRequests.value[0]);
                console.log('Approved date field:', approvedLeaveRequests.value[0].approvedDate);
            }
        }
    }
    catch (error) {
        console.error('Error loading approved requests:', error);
    }
    finally {
        loadingApproved.value = false;
    }
}
async function loadRejectedRequests() {
    loadingRejected.value = true;
    try {
        const params = {
            status: 'rejected',
            page: rejectedPagination.value.page,
            limit: rejectedPagination.value.limit,
            search: rejectedFilters.value.search || undefined,
            departmentId: rejectedFilters.value.department || undefined,
            leaveTypeId: rejectedFilters.value.leaveType || undefined
        };
        // Add month filter if present
        if (rejectedFilters.value.month) {
            const [year, month] = rejectedFilters.value.month.split('-');
            params.startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            params.endDate = `${year}-${month}-${lastDay}`;
        }
        const result = await leaveService.getLeaveRequests(params);
        if (result.success) {
            // FIXED: Map the data to ensure rejectedDate is available
            rejectedLeaveRequests.value = result.data.map(request => ({
                ...request,
                approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null,
                rejectedDate: request.rejectedDate || request.rejected_at || request.rejectedAt || null,
                requestedDate: request.requestedDate || request.requested_at || request.requestedAt || null
            }));
            rejectedPagination.value = {
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                totalPages: result.pagination.totalPages
            };
        }
    }
    catch (error) {
        console.error('Error loading rejected requests:', error);
    }
    finally {
        loadingRejected.value = false;
    }
}
async function loadOverdueReturns() {
    loadingOverdue.value = true;
    try {
        const result = await leaveService.getOverdueReturns();
        if (result.success) {
            overdueReturnsList.value = result.data || [];
        }
    }
    catch (error) {
        console.error('Error loading overdue returns:', error);
    }
    finally {
        loadingOverdue.value = false;
    }
}
async function loadCalendarData() {
    loadingCalendar.value = true;
    try {
        const result = await leaveService.getCalendarData(calendarYear.value, calendarMonth.value + 1);
        if (result.success) {
            calendarData.value = result.data || [];
        }
    }
    catch (error) {
        console.error('Error loading calendar data:', error);
    }
    finally {
        loadingCalendar.value = false;
    }
}
async function loadBalanceData() {
    loadingBalance.value = true;
    try {
        // Fetch all employees with filters
        const params = {
            limit: 100,
            search: balanceSearch.value || undefined,
            departmentId: balanceDepartmentFilter.value || undefined
        };
        const result = await employeeService.getEmployees(params);
        if (result.success) {
            const employees = result.data;
            // Fetch balance for each employee
            const balances = await Promise.all(employees.map(async (emp) => {
                try {
                    const balanceResult = await leaveService.getEmployeeBalance(emp.id, new Date().getFullYear());
                    console.log(`Employee ${emp.firstName} ${emp.lastName}:`, {
                        employeeData: emp,
                        balanceData: balanceResult.data
                    });
                    // FIXED: Get department name from employee data
                    let departmentName = 'N/A';
                    if (emp.department) {
                        // If department is an object with name property
                        departmentName = emp.department.name || emp.department.departmentName || 'N/A';
                    }
                    else if (emp.departmentId) {
                        // If we have departmentId but no department object, try to find it from departmentsList
                        const foundDept = departmentsList.value.find(d => d.departmentId === emp.departmentId);
                        departmentName = foundDept ? foundDept.name : 'N/A';
                    }
                    else if (emp.Department) {
                        // Alternative property name
                        departmentName = emp.Department.name || 'N/A';
                    }
                    if (balanceResult.success && balanceResult.data) {
                        const data = balanceResult.data;
                        return {
                            employeeId: emp.id,
                            name: `${emp.firstName} ${emp.lastName}`,
                            code: emp.employeeCode,
                            department: departmentName,
                            totalDays: data.totalAccrued || data.currentPeriodAccrued || 0,
                            usedDays: data.totalUsed || data.currentPeriodUsed || 0,
                            availableDays: data.availableDays || 0,
                            yearlyEntitlement: data.currentPeriodEntitlement || 0,
                            carriedOver: data.carryOverDetails?.reduce((sum, detail) => sum + detail.carriedOver, 0) || 0,
                            currentPeriodUsed: data.currentPeriodUsed,
                            currentPeriodAccrued: data.currentPeriodAccrued
                        };
                    }
                }
                catch (err) {
                    console.error(`Error fetching balance for employee ${emp.id}:`, err);
                }
                // Return default if fetch fails
                let departmentName = 'N/A';
                if (emp.department) {
                    departmentName = emp.department.name || 'N/A';
                }
                else if (emp.departmentId) {
                    const foundDept = departmentsList.value.find(d => d.departmentId === emp.departmentId);
                    departmentName = foundDept ? foundDept.name : 'N/A';
                }
                return {
                    employeeId: emp.id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    code: emp.employeeCode,
                    department: departmentName,
                    totalDays: 0,
                    usedDays: 0,
                    availableDays: 0,
                    yearlyEntitlement: 0,
                    carriedOver: 0
                };
            }));
            balanceData.value = balances;
            balanceTotalPages.value = Math.ceil(balanceData.value.length / itemsPerPage);
            console.log('Final balance data with departments:', balanceData.value);
        }
    }
    catch (error) {
        console.error('Error loading balance data:', error);
        showToastMessage('Failed to load balance data', 'error');
    }
    finally {
        loadingBalance.value = false;
    }
}
async function loadDepartments() {
    const result = await employeeService.getDepartments();
    if (result.success) {
        departmentsList.value = result.data;
    }
}
async function loadLeaveTypes() {
    const result = await leaveService.getLeaveTypes();
    if (result.success) {
        leaveTypesList.value = result.data;
    }
}
async function loadEmployees() {
    try {
        const result = await employeeService.getEmployees({ limit: 100 });
        if (result.success) {
            console.log('Employees loaded:', result.data);
            // Log first employee to see structure
            if (result.data && result.data.length > 0) {
                // console.log('First employee structure:', JSON.stringify(result.data[0], null, 2))
            }
            employeesList.value = result.data;
            // Also populate employeeBalances for quick lookup
            for (const emp of result.data) {
                try {
                    const balanceResult = await leaveService.getEmployeeBalance(emp.id, new Date().getFullYear());
                    if (balanceResult.success) {
                        employeeBalances.value[emp.id] = balanceResult.data;
                    }
                }
                catch (err) {
                    console.error(`Error loading balance for ${emp.id}:`, err);
                }
            }
        }
    }
    catch (error) {
        console.error('Error loading employees:', error);
    }
}
async function loadDashboardStats() {
    try {
        const result = await leaveService.getDashboardStats();
        if (result.success && result.data) {
            // FIXED: Map the API response correctly
            stats.value = {
                totalRequests: result.data.totalRequests || 0,
                pendingRequests: result.data.pendingRequests || 0,
                approvedRequests: result.data.approvedRequests || 0,
                rejectedRequests: result.data.rejectedRequests || 0,
                employeesOnLeaveToday: result.data.employeesOnLeaveToday || 0,
                totalDaysRequested: result.data.totalDaysRequested || 0,
                departmentsWithLeave: result.data.departmentsWithLeave || 0,
                overdueReturns: result.data.overdueReturns || 0
            };
        }
    }
    catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}
// ==================== COMPUTED ====================
const filteredApprovedLeaveRequests = computed(() => approvedLeaveRequests.value);
const filteredRejectedLeaveRequests = computed(() => rejectedLeaveRequests.value);
const totalBalanceStats = computed(() => {
    const totalAvailable = balanceData.value.reduce((sum, b) => sum + (b.availableDays || 0), 0);
    const totalUsed = balanceData.value.reduce((sum, b) => sum + (b.usedDays || 0), 0);
    const totalAllocated = balanceData.value.reduce((sum, b) => sum + (b.totalDays || 0), 0);
    const lowBalanceCount = balanceData.value.filter(b => (b.availableDays || 0) <= 5).length;
    return {
        total_employees: balanceData.value.length,
        avg_available_days: balanceData.value.length > 0
            ? (totalAvailable / balanceData.value.length).toFixed(1)
            : 'N/A',
        total_used_days: totalUsed,
        total_allocated_days: totalAllocated,
        employees_low_balance: lowBalanceCount
    };
});
const paginatedBalanceData = computed(() => {
    const start = (balancePage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return balanceData.value.slice(start, end);
});
// Calendar days with hover data
const calendarDays = computed(() => {
    const firstDay = new Date(calendarYear.value, calendarMonth.value, 1);
    const lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0);
    const startWeek = firstDay.getDay();
    const days = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const prevLast = new Date(calendarYear.value, calendarMonth.value, 0).getDate();
    for (let i = startWeek - 1; i >= 0; i--) {
        days.push({ day: prevLast - i, isCurrentMonth: false, isToday: false, hasLeave: false, returnCount: 0, leaves: [], returns: [] });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(calendarYear.value, calendarMonth.value, i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === currentDate.toDateString();
        const dayLeaves = calendarData.value.filter(l => l.startDate <= dateStr && l.endDate >= dateStr);
        const dayReturns = calendarData.value.filter(l => l.returnDate === dateStr && !l.actualReturnDate);
        days.push({
            day: i,
            isCurrentMonth: true,
            isToday: isToday,
            hasLeave: dayLeaves.length > 0,
            returnCount: dayReturns.length,
            leaves: dayLeaves.map(l => ({
                id: l.leaveRequestId,
                employeeName: `${l.employee?.firstName} ${l.employee?.lastName}`,
                leaveTypeName: l.leaveTypeName
            })),
            returns: dayReturns.map(l => ({
                id: l.leaveRequestId,
                employeeName: `${l.employee?.firstName} ${l.employee?.lastName}`,
                leaveTypeName: l.leaveTypeName
            }))
        });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, isCurrentMonth: false, isToday: false, hasLeave: false, returnCount: 0, leaves: [], returns: [] });
    }
    return days;
});
// ==================== HELPER FUNCTIONS ====================
function switchTab(tab) {
    activeTab.value = tab;
    // Reset pagination when switching tabs
    if (tab === 'pending') {
        pendingPagination.value.page = 1;
        loadPendingRequests();
    }
    else if (tab === 'approved') {
        approvedPagination.value.page = 1;
        loadApprovedRequests();
    }
    else if (tab === 'rejected') {
        rejectedPagination.value.page = 1;
        loadRejectedRequests();
    }
    else if (tab === 'overdue') {
        loadOverdueReturns();
    }
    else if (tab === 'calendar') {
        loadCalendarData();
    }
    else if (tab === 'balance') {
        balancePage.value = 1;
        loadBalanceData();
    }
}
function changePendingPage(page) {
    pendingPagination.value.page = page;
    loadPendingRequests();
}
function changeApprovedPage(page) {
    approvedPagination.value.page = page;
    loadApprovedRequests();
}
function changeRejectedPage(page) {
    rejectedPagination.value.page = page;
    loadRejectedRequests();
}
function changeBalancePage(page) {
    balancePage.value = page;
}
function changeMonth(delta) {
    let newMonth = calendarMonth.value + delta;
    let newYear = calendarYear.value;
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    calendarMonth.value = newMonth;
    calendarYear.value = newYear;
    loadCalendarData();
}
function goToToday() {
    calendarMonth.value = new Date().getMonth();
    calendarYear.value = new Date().getFullYear();
    loadCalendarData();
}
function showTooltip(day, e) {
    if ((day.leaves && day.leaves.length > 0) || (day.returns && day.returns.length > 0)) {
        tooltipLeaves.value = day.leaves || [];
        tooltipReturns.value = day.returns || [];
        tooltipVisible.value = true;
        const rect = e.target.getBoundingClientRect();
        tooltipStyle.value = {
            top: `${rect.top + window.scrollY - 10}px`,
            left: `${rect.left + window.scrollX + 30}px`,
            transform: 'translateY(-100%)'
        };
    }
}
function hideTooltip() {
    tooltipVisible.value = false;
    tooltipLeaves.value = [];
    tooltipReturns.value = [];
}
function calculateDays(startDate, endDate) {
    if (!startDate || !endDate)
        return 0;
    const start = new Date(startDate), end = new Date(endDate);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
}
function getReturnDate(endDate) {
    if (!endDate)
        return '';
    const date = new Date(endDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}
function formatDate(dateStr) {
    if (!dateStr)
        return 'N/A';
    try {
        // Handle different date formats
        let date;
        if (typeof dateStr === 'string') {
            // Try parsing the string directly
            date = new Date(dateStr);
        }
        else if (dateStr instanceof Date) {
            date = dateStr;
        }
        else if (typeof dateStr === 'number') {
            date = new Date(dateStr);
        }
        else {
            return 'N/A';
        }
        // Check if date is valid
        if (isNaN(date.getTime()))
            return 'N/A';
        // Format as MM/DD/YYYY or your preferred format
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    catch (error) {
        console.error('Date formatting error:', error, 'Input:', dateStr);
        return 'N/A';
    }
}
function formatApprovedDate(request) {
    // Try multiple possible field names
    const dateValue = request.approvedDate || request.approved_at || request.approvedAt || request.approved_date || null;
    if (!dateValue) {
        console.log('No approved date found for request:', request.leaveRequestId, 'Keys:', Object.keys(request));
        return 'N/A';
    }
    return formatDate(dateValue);
}
function getInitials(name) {
    if (!name)
        return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getMonthName(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
}
function getLeaveTypeClass(type) {
    const classes = {
        'Annual Leave': 'type-annual',
        'Sick Leave': 'type-sick',
        'Maternity Leave': 'type-maternity',
        'Paternity Leave': 'type-paternity',
        'Bereavement Leave': 'type-bereavement'
    };
    return classes[type] || 'type-default';
}
function getBalanceStatusClass(available) {
    if (available <= 0)
        return 'text-danger';
    if (available <= 5)
        return 'text-warning';
    return 'text-success';
}
function getEmployeeStatusClass(available) {
    if (available <= 0)
        return 'status-danger';
    if (available <= 5)
        return 'status-warning';
    return 'status-success';
}
function getEmployeeStatus(available) {
    if (available <= 0)
        return 'Exhausted';
    if (available <= 5)
        return 'Low Balance';
    return 'Good';
}
function getUsagePercentage(emp) {
    // If no total days, return 0
    if (!emp.totalDays || emp.totalDays === 0)
        return 0;
    // Calculate percentage based on used vs total accrued
    const percentage = (emp.usedDays / emp.totalDays) * 100;
    return Math.min(100, percentage);
}
function getReturnStatusClass(request) {
    if (request.actualReturnDate) {
        const expectedReturn = new Date(request.returnDate);
        const actual = new Date(request.actualReturnDate);
        if (actual > expectedReturn)
            return 'status-warning';
        return 'status-success';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.returnDate);
    if (currentDate > returnDate)
        return 'status-danger';
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'status-warning';
    return 'status-info';
}
function getReturnStatusText(request) {
    if (request.actualReturnDate) {
        const expectedReturn = new Date(request.returnDate);
        const actual = new Date(request.actualReturnDate);
        if (actual > expectedReturn) {
            const daysLate = Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24));
            return `Returned ${daysLate} days late`;
        }
        return 'Returned on time';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.returnDate);
    if (currentDate > returnDate) {
        const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24));
        return `Overdue by ${daysOverdue} days`;
    }
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'Expected today';
    return `Returns ${formatDate(request.returnDate)}`;
}
function getAnnualAvailable(employee) {
    if (!employee)
        return 0;
    const balance = employeeBalances.value[employee.id || employee.employeeId];
    return balance?.availableDays || 0;
}
function refreshData() {
    loadDashboardStats();
    if (activeTab.value === 'pending')
        loadPendingRequests();
    else if (activeTab.value === 'approved')
        loadApprovedRequests();
    else if (activeTab.value === 'rejected')
        loadRejectedRequests();
    else if (activeTab.value === 'overdue')
        loadOverdueReturns();
    else if (activeTab.value === 'calendar')
        loadCalendarData();
    else if (activeTab.value === 'balance')
        loadBalanceData();
}
function goToDetailPage(leaveId) {
    router.push(`/leave-detail/${leaveId}`);
}
// ==================== EXPORT FUNCTIONS ====================
async function exportReport() {
    try {
        const result = await leaveService.exportToCSV();
        if (result.success && result.data) {
            // Convert to CSV
            const headers = ['Request ID', 'Employee', 'Employee Code', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Requested Date', 'Approved Date'];
            const csvRows = [headers.join(',')];
            for (const row of result.data) {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(',') ? `"${escaped}"` : escaped;
                });
                csvRows.push(values.join(','));
            }
            // Download file
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToastMessage('Export successful', 'success');
        }
        else {
            showToastMessage('Export failed: ' + (result.error || 'Unknown error'), 'error');
        }
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export data', 'error');
    }
}
async function exportBalanceReport() {
    try {
        const headers = ['Employee Name', 'Employee Code', 'Department', 'Total Annual Days', 'Used Days', 'Available Days', 'Status'];
        const csvRows = [headers.join(',')];
        for (const emp of balanceData.value) {
            const status = getEmployeeStatus(emp.availableDays);
            const row = [
                `"${emp.name}"`,
                `"${emp.code}"`,
                `"${emp.department}"`,
                emp.totalDays,
                emp.usedDays,
                emp.availableDays,
                `"${status}"`
            ];
            csvRows.push(row.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave_balance_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToastMessage('Export successful', 'success');
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export balance data', 'error');
    }
}
// ==================== LEAVE FORM VALIDATION ====================
function validateForm() {
    const errors = {};
    if (!newLeave.value.employeeId)
        errors.employeeId = 'Please select an employee';
    if (!newLeave.value.leaveTypeId)
        errors.leaveTypeId = 'Please select a leave type';
    if (!newLeave.value.startDate) {
        errors.startDate = 'Please select a start date';
    }
    else {
        const startDate = new Date(newLeave.value.startDate);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (startDate < todayDate)
            errors.startDate = 'Start date cannot be in the past';
    }
    if (!newLeave.value.endDate) {
        errors.endDate = 'Please select an end date';
    }
    else if (newLeave.value.startDate) {
        const start = new Date(newLeave.value.startDate);
        const end = new Date(newLeave.value.endDate);
        if (end < start)
            errors.endDate = 'End date cannot be before start date';
    }
    if (!newLeave.value.reason) {
        errors.reason = 'Please provide a reason';
    }
    else if (newLeave.value.reason.trim().length < 5) {
        errors.reason = 'Reason must be at least 5 characters';
    }
    validationErrors.value = errors;
    isFormValid.value = Object.keys(errors).length === 0;
    return isFormValid.value;
}
function validateDates() {
    if (formSubmitted.value)
        validateForm();
}
function onStartDateChange() {
    if (isFixedLeave.value && selectedLeaveType.value && newLeave.value.startDate) {
        calculateEndDateForFixedLeave();
    }
    validateDates();
}
const calculatedDays = computed(() => newLeave.value.startDate && newLeave.value.endDate ? calculateDays(newLeave.value.startDate, newLeave.value.endDate) : 0);
const isFixedLeave = computed(() => selectedLeaveType?.value && ['Maternity Leave', 'Paternity Leave', 'Bereavement Leave'].includes(selectedLeaveType.value.name));
function calculateEndDateForFixedLeave() {
    if (isFixedLeave.value && selectedLeaveType.value && newLeave.value.startDate) {
        const start = new Date(newLeave.value.startDate);
        start.setDate(start.getDate() + selectedLeaveType.value.defaultDays - 1);
        newLeave.value.endDate = start.toISOString().split('T')[0];
        if (formSubmitted.value)
            validateForm();
    }
}
function onEmployeeChange() {
    selectedEmployee.value = employeesList.value.find(e => e.id === newLeave.value.employeeId);
    if (selectedEmployee.value) {
        loadEmployeeBalance(selectedEmployee.value.id);
    }
    if (formSubmitted.value)
        validateForm();
}
async function loadEmployeeBalance(employeeId) {
    try {
        const result = await leaveService.getEmployeeBalance(employeeId, new Date().getFullYear());
        if (result.success && result.data) {
            employeeBalances.value[employeeId] = result.data;
        }
    }
    catch (error) {
        console.error('Error loading employee balance:', error);
    }
}
function onLeaveTypeChange() {
    selectedLeaveType.value = leaveTypesList.value.find(t => t.leaveTypeId === newLeave.value.leaveTypeId);
    if (isFixedLeave.value && newLeave.value.startDate) {
        calculateEndDateForFixedLeave();
    }
    else if (!isFixedLeave.value) {
        newLeave.value.endDate = '';
    }
    if (formSubmitted.value)
        validateForm();
}
function openAddLeaveModal() {
    newLeave.value = { employeeId: null, leaveTypeId: null, startDate: '', endDate: '', reason: '', status: 'pending' };
    selectedEmployee.value = null;
    selectedLeaveType.value = null;
    validationErrors.value = {};
    formSubmitted.value = false;
    showAddLeaveModal.value = true;
}
function closeAddModal() {
    showAddLeaveModal.value = false;
    formSubmitted.value = false;
    validationErrors.value = {};
}
async function confirmAddLeave() {
    formSubmitted.value = true;
    if (!validateForm()) {
        showToastMessage('Please fix validation errors', 'error');
        return;
    }
    try {
        const result = await leaveService.createLeaveRequest({
            employeeId: newLeave.value.employeeId,
            leaveTypeId: newLeave.value.leaveTypeId,
            startDate: newLeave.value.startDate,
            endDate: newLeave.value.endDate,
            reason: newLeave.value.reason,
            status: newLeave.value.status
        });
        if (result.success) {
            showAddLeaveModal.value = false;
            formSubmitted.value = false;
            showToastMessage(`Leave added successfully!`, 'success');
            refreshData();
        }
        else {
            showToastMessage(result.error, 'error');
        }
    }
    catch (error) {
        showToastMessage('Failed to add leave request', 'error');
    }
}
// ==================== RETURN CONFIRMATION ====================
function openReturnConfirmModalFromLeave(leave) {
    returnConfirmEmployee.value = leave;
    actualReturnDate.value = today;
    showReturnConfirmModal.value = true;
}
function openReturnConfirmModalFromOverdue(leave) {
    returnConfirmEmployee.value = leave;
    actualReturnDate.value = today;
    showReturnConfirmModal.value = true;
}
async function processConfirmReturn() {
    try {
        const result = await leaveService.confirmReturn(returnConfirmEmployee.value.leaveRequestId, actualReturnDate.value);
        if (result.success) {
            showToastMessage(result.message, 'success');
            refreshData();
        }
        else {
            showToastMessage(result.error, 'error');
        }
    }
    catch (error) {
        showToastMessage('Failed to confirm return', 'error');
    }
    showReturnConfirmModal.value = false;
}
function showToastMessage(message, type = 'success') {
    toastMessage.value = message;
    toastType.value = type;
    toastIcon.value = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
}
// ==================== INITIALIZATION ====================
onMounted(async () => {
    loading.value = true;
    await Promise.all([
        loadDepartments(),
        loadLeaveTypes(),
        loadEmployees()
    ]);
    await loadDashboardStats();
    await loadPendingRequests();
    loading.value = false;
});
// Watch for filter changes
watch(() => pendingFilters.value, () => {
    pendingPagination.value.page = 1;
    debouncedLoadPending();
}, { deep: true });
watch(() => approvedFilters.value, () => {
    approvedPagination.value.page = 1;
    debouncedLoadApproved();
}, { deep: true });
watch(() => rejectedFilters.value, () => {
    rejectedPagination.value.page = 1;
    debouncedLoadRejected();
}, { deep: true });
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-card']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-view-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary-small']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['today']} */ ;
/** @type {__VLS_StyleScopedClasses['day-number']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['type-annual']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['type-sick']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['type-maternity']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['type-paternity']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['type-bereavement']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body-fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body-fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body-fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['has-error']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['has-error']} */ ;
/** @type {__VLS_StyleScopedClasses['info-box-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['info-box-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['info-blue']} */ ;
/** @type {__VLS_StyleScopedClasses['info-text']} */ ;
/** @type {__VLS_StyleScopedClasses['return-details']} */ ;
/** @type {__VLS_StyleScopedClasses['date-box']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['leave-management-hr']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs-container']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-card']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-card-right']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
/** @type {__VLS_StyleScopedClasses['return-dates']} */ ;
/** @type {__VLS_StyleScopedClasses['date-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-management-hr" },
});
/** @type {__VLS_StyleScopedClasses['leave-management-hr']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "header-icon" },
});
/** @type {__VLS_StyleScopedClasses['header-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddLeaveModal) },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportReport) },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-cards" },
});
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.totalRequests || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value text-orange" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
(__VLS_ctx.stats.pendingRequests || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value text-green" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green']} */ ;
(__VLS_ctx.stats.approvedRequests || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value text-red" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
(__VLS_ctx.stats.rejectedRequests || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value text-blue" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue']} */ ;
(__VLS_ctx.stats.employeesOnLeaveToday || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value text-purple" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
(__VLS_ctx.stats.totalDaysRequested || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
if (__VLS_ctx.stats.overdueReturns > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overdue-alert" },
    });
    /** @type {__VLS_StyleScopedClasses['overdue-alert']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "alert-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "alert-message" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-message']} */ ;
    (__VLS_ctx.stats.overdueReturns);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.stats.overdueReturns > 0))
                    return;
                __VLS_ctx.activeTab = 'overdue';
                // @ts-ignore
                [openAddLeaveModal, exportReport, refreshData, stats, stats, stats, stats, stats, stats, stats, stats, activeTab,];
            } },
        ...{ class: "alert-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs-container" },
});
/** @type {__VLS_StyleScopedClasses['tabs-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('pending');
            // @ts-ignore
            [switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'pending' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.stats.pendingRequests > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
    (__VLS_ctx.stats.pendingRequests);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('approved');
            // @ts-ignore
            [stats, stats, activeTab, switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'approved' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.stats.approvedRequests > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
    (__VLS_ctx.stats.approvedRequests);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('rejected');
            // @ts-ignore
            [stats, stats, activeTab, switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'rejected' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.stats.rejectedRequests > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
    (__VLS_ctx.stats.rejectedRequests);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('overdue');
            // @ts-ignore
            [stats, stats, activeTab, switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'overdue' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.stats.overdueReturns > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-badge danger" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.stats.overdueReturns);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('calendar');
            // @ts-ignore
            [stats, stats, activeTab, switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'calendar' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('balance');
            // @ts-ignore
            [activeTab, switchTab,];
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'balance' }) },
});
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.activeTab === 'pending') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    (__VLS_ctx.pendingPagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedLoadPending) },
        type: "text",
        value: (__VLS_ctx.pendingFilters.search),
        placeholder: "Search employee...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadPendingRequests) },
        value: (__VLS_ctx.pendingFilters.department),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [activeTab, activeTab, pendingPagination, debouncedLoadPending, pendingFilters, pendingFilters, loadPendingRequests, departmentsList,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadPendingRequests) },
        value: (__VLS_ctx.pendingFilters.leaveType),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [type] of __VLS_vFor((__VLS_ctx.leaveTypesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type.leaveTypeId),
            value: (type.leaveTypeId),
        });
        (type.name);
        // @ts-ignore
        [pendingFilters, loadPendingRequests, leaveTypesList,];
    }
    if (__VLS_ctx.loadingPending) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.pendingLeaveRequests.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "compact-requests-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['compact-requests-grid']} */ ;
        for (const [request] of __VLS_vFor((__VLS_ctx.pendingLeaveRequests))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (request.leaveRequestId),
                ...{ class: "compact-card" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-card-left" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-card-left']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-avatar']} */ ;
            (__VLS_ctx.getInitials(request.employee?.firstName + ' ' + request.employee?.lastName));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-info" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-name" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-name']} */ ;
            (request.employee?.firstName);
            (request.employee?.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-code" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-code']} */ ;
            (request.employee?.employeeCode);
            (request.department?.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-dates" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-dates']} */ ;
            (__VLS_ctx.formatDate(request.startDate));
            (__VLS_ctx.formatDate(request.endDate));
            (request.totalDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-card-right" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-card-right']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-type" },
                ...{ class: (__VLS_ctx.getLeaveTypeClass(request.leaveTypeName)) },
            });
            /** @type {__VLS_StyleScopedClasses['compact-type']} */ ;
            (request.leaveTypeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "compact-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['compact-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'pending'))
                            return;
                        if (!!(__VLS_ctx.loadingPending))
                            return;
                        if (!!(__VLS_ctx.pendingLeaveRequests.length === 0))
                            return;
                        __VLS_ctx.goToDetailPage(request.leaveRequestId);
                        // @ts-ignore
                        [loadingPending, pendingLeaveRequests, pendingLeaveRequests, getInitials, formatDate, formatDate, getLeaveTypeClass, goToDetailPage,];
                    } },
                ...{ class: "btn-view-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-view-small']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.pendingPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'pending'))
                        return;
                    if (!(__VLS_ctx.pendingPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePendingPage(__VLS_ctx.pendingPagination.page - 1);
                    // @ts-ignore
                    [pendingPagination, pendingPagination, changePendingPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.pendingPagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.pendingPagination.page);
        (__VLS_ctx.pendingPagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'pending'))
                        return;
                    if (!(__VLS_ctx.pendingPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePendingPage(__VLS_ctx.pendingPagination.page + 1);
                    // @ts-ignore
                    [pendingPagination, pendingPagination, pendingPagination, pendingPagination, changePendingPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.pendingPagination.page === __VLS_ctx.pendingPagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    }
}
if (__VLS_ctx.activeTab === 'approved') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    (__VLS_ctx.approvedPagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedLoadApproved) },
        type: "text",
        value: (__VLS_ctx.approvedFilters.search),
        placeholder: "Search employee...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
        value: (__VLS_ctx.approvedFilters.department),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [activeTab, pendingPagination, pendingPagination, departmentsList, approvedPagination, debouncedLoadApproved, approvedFilters, approvedFilters, loadApprovedRequests,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
        value: (__VLS_ctx.approvedFilters.leaveType),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [type] of __VLS_vFor((__VLS_ctx.leaveTypesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type.leaveTypeId),
            value: (type.leaveTypeId),
        });
        (type.name);
        // @ts-ignore
        [leaveTypesList, approvedFilters, loadApprovedRequests,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
        type: "month",
        ...{ class: "month-picker" },
    });
    (__VLS_ctx.approvedFilters.month);
    /** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
    if (__VLS_ctx.loadingApproved) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.filteredApprovedLeaveRequests.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
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
        for (const [request] of __VLS_vFor((__VLS_ctx.filteredApprovedLeaveRequests))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (request.leaveRequestId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (request.employee?.firstName);
            (request.employee?.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (request.employee?.employeeCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.department?.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.leaveTypeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(request.startDate));
            (__VLS_ctx.formatDate(request.endDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (request.totalDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (__VLS_ctx.getReturnStatusClass(request)) },
            });
            (__VLS_ctx.getReturnStatusText(request));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (__VLS_ctx.formatDate(request.approvedDate) || __VLS_ctx.formatDate(request.approved_at) || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'approved'))
                            return;
                        if (!!(__VLS_ctx.loadingApproved))
                            return;
                        if (!!(__VLS_ctx.filteredApprovedLeaveRequests.length === 0))
                            return;
                        __VLS_ctx.goToDetailPage(request.leaveRequestId);
                        // @ts-ignore
                        [formatDate, formatDate, formatDate, formatDate, goToDetailPage, approvedFilters, loadApprovedRequests, loadingApproved, filteredApprovedLeaveRequests, filteredApprovedLeaveRequests, getReturnStatusClass, getReturnStatusText,];
                    } },
                ...{ class: "btn-icon" },
                title: "View Details",
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            if (!request.actualReturnDate && request.returnDate <= __VLS_ctx.today) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeTab === 'approved'))
                                return;
                            if (!!(__VLS_ctx.loadingApproved))
                                return;
                            if (!!(__VLS_ctx.filteredApprovedLeaveRequests.length === 0))
                                return;
                            if (!(!request.actualReturnDate && request.returnDate <= __VLS_ctx.today))
                                return;
                            __VLS_ctx.openReturnConfirmModalFromLeave(request);
                            // @ts-ignore
                            [today, openReturnConfirmModalFromLeave,];
                        } },
                    ...{ class: "btn-icon confirm-return" },
                    title: "Confirm Return",
                });
                /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
                /** @type {__VLS_StyleScopedClasses['confirm-return']} */ ;
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.approvedPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'approved'))
                        return;
                    if (!(__VLS_ctx.approvedPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeApprovedPage(__VLS_ctx.approvedPagination.page - 1);
                    // @ts-ignore
                    [approvedPagination, approvedPagination, changeApprovedPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.approvedPagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.approvedPagination.page);
        (__VLS_ctx.approvedPagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'approved'))
                        return;
                    if (!(__VLS_ctx.approvedPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeApprovedPage(__VLS_ctx.approvedPagination.page + 1);
                    // @ts-ignore
                    [approvedPagination, approvedPagination, approvedPagination, approvedPagination, changeApprovedPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.approvedPagination.page === __VLS_ctx.approvedPagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    }
}
if (__VLS_ctx.activeTab === 'rejected') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    (__VLS_ctx.rejectedPagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedLoadRejected) },
        type: "text",
        value: (__VLS_ctx.rejectedFilters.search),
        placeholder: "Search employee...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadRejectedRequests) },
        value: (__VLS_ctx.rejectedFilters.department),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [activeTab, departmentsList, approvedPagination, approvedPagination, rejectedPagination, debouncedLoadRejected, rejectedFilters, rejectedFilters, loadRejectedRequests,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadRejectedRequests) },
        value: (__VLS_ctx.rejectedFilters.leaveType),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [type] of __VLS_vFor((__VLS_ctx.leaveTypesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type.leaveTypeId),
            value: (type.leaveTypeId),
        });
        (type.name);
        // @ts-ignore
        [leaveTypesList, rejectedFilters, loadRejectedRequests,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.loadRejectedRequests) },
        type: "month",
        ...{ class: "month-picker" },
    });
    (__VLS_ctx.rejectedFilters.month);
    /** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
    if (__VLS_ctx.loadingRejected) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.filteredRejectedLeaveRequests.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [request] of __VLS_vFor((__VLS_ctx.filteredRejectedLeaveRequests))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (request.leaveRequestId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (request.employee?.firstName);
            (request.employee?.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (request.employee?.employeeCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.department?.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.leaveTypeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(request.startDate));
            (__VLS_ctx.formatDate(request.endDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (request.totalDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (__VLS_ctx.formatDate(request.rejectedDate) || __VLS_ctx.formatDate(request.rejected_at) || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'rejected'))
                            return;
                        if (!!(__VLS_ctx.loadingRejected))
                            return;
                        if (!!(__VLS_ctx.filteredRejectedLeaveRequests.length === 0))
                            return;
                        __VLS_ctx.goToDetailPage(request.leaveRequestId);
                        // @ts-ignore
                        [formatDate, formatDate, formatDate, formatDate, goToDetailPage, rejectedFilters, loadRejectedRequests, loadingRejected, filteredRejectedLeaveRequests, filteredRejectedLeaveRequests,];
                    } },
                ...{ class: "btn-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.rejectedPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'rejected'))
                        return;
                    if (!(__VLS_ctx.rejectedPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeRejectedPage(__VLS_ctx.rejectedPagination.page - 1);
                    // @ts-ignore
                    [rejectedPagination, rejectedPagination, changeRejectedPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.rejectedPagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.rejectedPagination.page);
        (__VLS_ctx.rejectedPagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'rejected'))
                        return;
                    if (!(__VLS_ctx.rejectedPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeRejectedPage(__VLS_ctx.rejectedPagination.page + 1);
                    // @ts-ignore
                    [rejectedPagination, rejectedPagination, rejectedPagination, rejectedPagination, changeRejectedPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.rejectedPagination.page === __VLS_ctx.rejectedPagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    }
}
if (__VLS_ctx.activeTab === 'overdue') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge danger" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.overdueReturnsList.length);
    if (__VLS_ctx.loadingOverdue) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.overdueReturnsList.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [request] of __VLS_vFor((__VLS_ctx.overdueReturnsList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (request.leaveRequestId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (request.employee?.firstName);
            (request.employee?.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (request.employee?.employeeCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.department?.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (request.leaveTypeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(request.endDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(request.returnDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "badge-danger" },
            });
            /** @type {__VLS_StyleScopedClasses['badge-danger']} */ ;
            (request.daysOverdue);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'overdue'))
                            return;
                        if (!!(__VLS_ctx.loadingOverdue))
                            return;
                        if (!!(__VLS_ctx.overdueReturnsList.length === 0))
                            return;
                        __VLS_ctx.openReturnConfirmModalFromOverdue(request);
                        // @ts-ignore
                        [activeTab, formatDate, formatDate, rejectedPagination, rejectedPagination, overdueReturnsList, overdueReturnsList, overdueReturnsList, loadingOverdue, openReturnConfirmModalFromOverdue,];
                    } },
                ...{ class: "btn-primary-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary-small']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'overdue'))
                            return;
                        if (!!(__VLS_ctx.loadingOverdue))
                            return;
                        if (!!(__VLS_ctx.overdueReturnsList.length === 0))
                            return;
                        __VLS_ctx.goToDetailPage(request.leaveRequestId);
                        // @ts-ignore
                        [goToDetailPage,];
                    } },
                ...{ class: "btn-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            // @ts-ignore
            [];
        }
    }
}
if (__VLS_ctx.activeTab === 'calendar') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "calendar-header" },
    });
    /** @type {__VLS_StyleScopedClasses['calendar-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeTab === 'calendar'))
                    return;
                __VLS_ctx.changeMonth(-1);
                // @ts-ignore
                [activeTab, changeMonth,];
            } },
        ...{ class: "month-nav" },
    });
    /** @type {__VLS_StyleScopedClasses['month-nav']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.getMonthName(__VLS_ctx.calendarMonth));
    (__VLS_ctx.calendarYear);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeTab === 'calendar'))
                    return;
                __VLS_ctx.changeMonth(1);
                // @ts-ignore
                [changeMonth, getMonthName, calendarMonth, calendarYear,];
            } },
        ...{ class: "month-nav" },
    });
    /** @type {__VLS_StyleScopedClasses['month-nav']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToToday) },
        ...{ class: "today-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['today-btn']} */ ;
    if (__VLS_ctx.loadingCalendar) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-weekdays" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-weekdays']} */ ;
        for (const [day] of __VLS_vFor((__VLS_ctx.weekdays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (day),
                ...{ class: "weekday" },
            });
            /** @type {__VLS_StyleScopedClasses['weekday']} */ ;
            (day);
            // @ts-ignore
            [goToToday, loadingCalendar, weekdays,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-days" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-days']} */ ;
        for (const [day, index] of __VLS_vFor((__VLS_ctx.calendarDays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onMouseenter: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'calendar'))
                            return;
                        if (!!(__VLS_ctx.loadingCalendar))
                            return;
                        __VLS_ctx.showTooltip(day, $event);
                        // @ts-ignore
                        [calendarDays, showTooltip,];
                    } },
                ...{ onMouseleave: (__VLS_ctx.hideTooltip) },
                key: (index),
                ...{ class: "calendar-day" },
                ...{ class: ({
                        'other-month': !day.isCurrentMonth,
                        'today': day.isToday,
                        'has-leave': day.hasLeave,
                        'return-day': day.returnCount > 0
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-day']} */ ;
            /** @type {__VLS_StyleScopedClasses['other-month']} */ ;
            /** @type {__VLS_StyleScopedClasses['today']} */ ;
            /** @type {__VLS_StyleScopedClasses['has-leave']} */ ;
            /** @type {__VLS_StyleScopedClasses['return-day']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "day-number" },
            });
            /** @type {__VLS_StyleScopedClasses['day-number']} */ ;
            (day.day);
            if (day.hasLeave) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "leave-count-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['leave-count-badge']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "count-number" },
                });
                /** @type {__VLS_StyleScopedClasses['count-number']} */ ;
                (day.leaves.length);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "count-text" },
                });
                /** @type {__VLS_StyleScopedClasses['count-text']} */ ;
            }
            if (day.returnCount > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "return-count-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['return-count-badge']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "count-number" },
                });
                /** @type {__VLS_StyleScopedClasses['count-number']} */ ;
                (day.returnCount);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "count-text" },
                });
                /** @type {__VLS_StyleScopedClasses['count-text']} */ ;
            }
            // @ts-ignore
            [hideTooltip,];
        }
    }
    if (__VLS_ctx.tooltipVisible) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-tooltip" },
            ...{ style: (__VLS_ctx.tooltipStyle) },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-tooltip']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "tooltip-title" },
        });
        /** @type {__VLS_StyleScopedClasses['tooltip-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "tooltip-list" },
        });
        /** @type {__VLS_StyleScopedClasses['tooltip-list']} */ ;
        if (__VLS_ctx.tooltipLeaves.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tooltip-section" },
            });
            /** @type {__VLS_StyleScopedClasses['tooltip-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tooltip-subtitle" },
            });
            /** @type {__VLS_StyleScopedClasses['tooltip-subtitle']} */ ;
            for (const [leave] of __VLS_vFor((__VLS_ctx.tooltipLeaves))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: ('leave-' + leave.id),
                    ...{ class: "tooltip-item" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-dot" },
                    ...{ class: (__VLS_ctx.getLeaveTypeClass(leave.leaveTypeName)) },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-name" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-name']} */ ;
                (leave.employeeName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-type" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-type']} */ ;
                (leave.leaveTypeName);
                // @ts-ignore
                [getLeaveTypeClass, tooltipVisible, tooltipStyle, tooltipLeaves, tooltipLeaves,];
            }
        }
        if (__VLS_ctx.tooltipReturns.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tooltip-section" },
            });
            /** @type {__VLS_StyleScopedClasses['tooltip-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tooltip-subtitle" },
            });
            /** @type {__VLS_StyleScopedClasses['tooltip-subtitle']} */ ;
            for (const [ret] of __VLS_vFor((__VLS_ctx.tooltipReturns))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: ('return-' + ret.id),
                    ...{ class: "tooltip-item" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-dot return-dot" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-dot']} */ ;
                /** @type {__VLS_StyleScopedClasses['return-dot']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-name" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-name']} */ ;
                (ret.employeeName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tooltip-type" },
                });
                /** @type {__VLS_StyleScopedClasses['tooltip-type']} */ ;
                (ret.leaveTypeName);
                // @ts-ignore
                [tooltipReturns, tooltipReturns,];
            }
        }
    }
}
if (__VLS_ctx.activeTab === 'balance') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-container" },
    });
    /** @type {__VLS_StyleScopedClasses['section-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportBalanceReport) },
        ...{ class: "btn-export-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-export-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-summary-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-summary-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.totalBalanceStats.total_employees);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value text-green" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
    (__VLS_ctx.totalBalanceStats.avg_available_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value text-orange" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
    (__VLS_ctx.totalBalanceStats.total_used_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value text-red" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
    (__VLS_ctx.totalBalanceStats.employees_low_balance);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedLoadBalance) },
        type: "text",
        value: (__VLS_ctx.balanceSearch),
        placeholder: "Search employee...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadBalanceData) },
        value: (__VLS_ctx.balanceDepartmentFilter),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [activeTab, departmentsList, exportBalanceReport, totalBalanceStats, totalBalanceStats, totalBalanceStats, totalBalanceStats, debouncedLoadBalance, balanceSearch, loadBalanceData, balanceDepartmentFilter,];
    }
    if (__VLS_ctx.loadingBalance) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "loading-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [emp] of __VLS_vFor((__VLS_ctx.paginatedBalanceData))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (emp.employeeId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (emp.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (emp.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-container" },
            });
            /** @type {__VLS_StyleScopedClasses['progress-container']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-label" },
            });
            /** @type {__VLS_StyleScopedClasses['progress-label']} */ ;
            (emp.usedDays);
            (emp.totalDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-bar" },
            });
            /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-fill" },
                ...{ style: ({ width: __VLS_ctx.getUsagePercentage(emp) + '%' }) },
            });
            /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
            if (emp.carriedOver > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "carried-over-info" },
                });
                /** @type {__VLS_StyleScopedClasses['carried-over-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
                (emp.carriedOver);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "entitlement-info" },
            });
            /** @type {__VLS_StyleScopedClasses['entitlement-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            (emp.yearlyEntitlement);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (__VLS_ctx.getBalanceStatusClass(emp.availableDays)) },
            });
            (emp.availableDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (__VLS_ctx.getEmployeeStatusClass(emp.availableDays)) },
            });
            (__VLS_ctx.getEmployeeStatus(emp.availableDays));
            // @ts-ignore
            [loadingBalance, paginatedBalanceData, getUsagePercentage, getBalanceStatusClass, getEmployeeStatusClass, getEmployeeStatus,];
        }
    }
    if (__VLS_ctx.balanceTotalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'balance'))
                        return;
                    if (!(__VLS_ctx.balanceTotalPages > 1))
                        return;
                    __VLS_ctx.changeBalancePage(__VLS_ctx.balancePage - 1);
                    // @ts-ignore
                    [balanceTotalPages, changeBalancePage, balancePage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.balancePage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.balancePage);
        (__VLS_ctx.balanceTotalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'balance'))
                        return;
                    if (!(__VLS_ctx.balanceTotalPages > 1))
                        return;
                    __VLS_ctx.changeBalancePage(__VLS_ctx.balancePage + 1);
                    // @ts-ignore
                    [balanceTotalPages, changeBalancePage, balancePage, balancePage, balancePage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.balancePage === __VLS_ctx.balanceTotalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    }
}
if (__VLS_ctx.showAddLeaveModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddLeaveModal))
                    return;
                __VLS_ctx.showAddLeaveModal = false;
                // @ts-ignore
                [balanceTotalPages, balancePage, showAddLeaveModal, showAddLeaveModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-fixed" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-fixed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddModal) },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body-fixed" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body-fixed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
        ...{ class: ({ 'has-error': __VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.employeeId }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onEmployeeChange) },
        value: (__VLS_ctx.newLeave.employeeId),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [emp] of __VLS_vFor((__VLS_ctx.employeesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (emp.id),
            value: (emp.id),
        });
        (__VLS_ctx.getEmployeeDisplayName(emp));
        // @ts-ignore
        [closeAddModal, formSubmitted, validationErrors, onEmployeeChange, newLeave, employeesList, getEmployeeDisplayName,];
    }
    if (__VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.employeeId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.validationErrors.employeeId);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
        ...{ class: ({ 'has-error': __VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.leaveTypeId }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onLeaveTypeChange) },
        value: (__VLS_ctx.newLeave.leaveTypeId),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [type] of __VLS_vFor((__VLS_ctx.leaveTypesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type.leaveTypeId),
            value: (type.leaveTypeId),
        });
        (type.name);
        // @ts-ignore
        [leaveTypesList, formSubmitted, formSubmitted, validationErrors, validationErrors, validationErrors, newLeave, onLeaveTypeChange,];
    }
    if (__VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.leaveTypeId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.validationErrors.leaveTypeId);
    }
    if (__VLS_ctx.selectedLeaveType?.name === 'Annual Leave' && __VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-box-compact" },
        });
        /** @type {__VLS_StyleScopedClasses['info-box-compact']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-text" },
        });
        /** @type {__VLS_StyleScopedClasses['info-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.getAnnualAvailable(__VLS_ctx.selectedEmployee));
    }
    if (__VLS_ctx.isFixedLeave && __VLS_ctx.selectedLeaveType) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-box-compact info-blue" },
        });
        /** @type {__VLS_StyleScopedClasses['info-box-compact']} */ ;
        /** @type {__VLS_StyleScopedClasses['info-blue']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-text" },
        });
        /** @type {__VLS_StyleScopedClasses['info-text']} */ ;
        (__VLS_ctx.selectedLeaveType.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedLeaveType.defaultDays);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
        ...{ class: ({ 'has-error': __VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.startDate }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.onStartDateChange) },
        type: "date",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.newLeave.startDate);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.startDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.validationErrors.startDate);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
        ...{ class: ({ 'has-error': __VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.endDate }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.validateDates) },
        type: "date",
        ...{ class: "form-input" },
        readonly: (__VLS_ctx.isFixedLeave),
    });
    (__VLS_ctx.newLeave.endDate);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.endDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.validationErrors.endDate);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
        ...{ class: ({ 'has-error': __VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.reason }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.newLeave.reason),
        rows: "2",
        placeholder: "Enter reason for leave...",
        ...{ class: "form-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    if (__VLS_ctx.formSubmitted && __VLS_ctx.validationErrors.reason) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.validationErrors.reason);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.newLeave.status),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "pending",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "approved",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmAddLeave) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.showReturnConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [closeAddModal, formSubmitted, formSubmitted, formSubmitted, formSubmitted, formSubmitted, formSubmitted, formSubmitted, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, validationErrors, newLeave, newLeave, newLeave, newLeave, selectedLeaveType, selectedLeaveType, selectedLeaveType, selectedLeaveType, selectedEmployee, selectedEmployee, getAnnualAvailable, isFixedLeave, isFixedLeave, onStartDateChange, validateDates, confirmAddLeave, showReturnConfirmModal, showReturnConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content return-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['return-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [showReturnConfirmModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "return-info" },
    });
    /** @type {__VLS_StyleScopedClasses['return-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "return-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['return-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "return-details" },
    });
    /** @type {__VLS_StyleScopedClasses['return-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.returnConfirmEmployee?.employee?.firstName);
    (__VLS_ctx.returnConfirmEmployee?.employee?.lastName);
    (__VLS_ctx.returnConfirmEmployee?.employee?.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "return-period" },
    });
    /** @type {__VLS_StyleScopedClasses['return-period']} */ ;
    (__VLS_ctx.returnConfirmEmployee?.leaveTypeName);
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.startDate));
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.endDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "return-dates" },
    });
    /** @type {__VLS_StyleScopedClasses['return-dates']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-box" },
    });
    /** @type {__VLS_StyleScopedClasses['date-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-value" },
    });
    /** @type {__VLS_StyleScopedClasses['date-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.returnDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['date-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-box" },
    });
    /** @type {__VLS_StyleScopedClasses['date-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "form-input" },
        max: (__VLS_ctx.today),
    });
    (__VLS_ctx.actualReturnDate);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [formatDate, formatDate, formatDate, today, showReturnConfirmModal, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, actualReturnDate,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.processConfirmReturn) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
    (__VLS_ctx.toastIcon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-message" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    (__VLS_ctx.toastMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToast))
                    return;
                __VLS_ctx.showToast = false;
                // @ts-ignore
                [processConfirmReturn, showToast, showToast, toastType, toastIcon, toastMessage,];
            } },
        ...{ class: "toast-close" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
