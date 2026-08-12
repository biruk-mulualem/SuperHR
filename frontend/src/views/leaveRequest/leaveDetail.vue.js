import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import leaveService from '@/stores/leaveService';
import employeeService from '@/stores/employee';
const route = useRoute();
const router = useRouter();
const leaveId = route.params.id;
const today = new Date().toISOString().split('T')[0];
// State
const loading = ref(false);
const leaveRequest = ref(null);
const employeeDetails = ref(null);
const employeeBalance = ref(null);
// Modal states
const showExtensionModal = ref(false);
const showApproveConfirmModal = ref(false);
const showRejectConfirmModal = ref(false);
const showReinitializeConfirmModal = ref(false);
const showReturnConfirmModal = ref(false);
const showSuccessModal = ref(false);
const successMessage = ref('');
const actualReturnDate = ref(today);
const extensionDays = ref(1);
const extensionReason = ref('');
const approvalNotes = ref('');
const rejectionReason = ref('');
const rejectionNotes = ref('');
// ==================== HELPER FUNCTIONS ====================
function formatDate(dateStr) {
    if (!dateStr)
        return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime()))
            return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    catch (error) {
        return 'N/A';
    }
}
function getAnnualEntitlement(yearsOfService) {
    if (yearsOfService <= 2)
        return 16;
    return 16 + Math.ceil((yearsOfService - 2) / 2);
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
function getStatusClass(status) {
    const classes = {
        pending: 'status-pending',
        approved: 'status-approved',
        rejected: 'status-rejected',
        cancelled: 'status-cancelled'
    };
    return classes[status] || 'status-default';
}
function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        approved: '✅',
        rejected: '❌',
        cancelled: '🚫'
    };
    return icons[status] || '📋';
}
function getLeaveTypeDays() {
    const days = {
        'Maternity Leave': 90,
        'Paternity Leave': 10,
        'Bereavement Leave': 5
    };
    return days[leaveRequest.value?.leave_type_name] || 'N/A';
}
function getReturnStatusClass(request) {
    if (!request)
        return 'status-info';
    if (request.actual_return_date) {
        const expectedReturn = new Date(request.return_date);
        const actual = new Date(request.actual_return_date);
        if (actual > expectedReturn)
            return 'status-warning';
        return 'status-success';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.return_date);
    if (currentDate > returnDate)
        return 'status-danger';
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'status-warning';
    return 'status-info';
}
function getReturnStatusText(request) {
    if (!request)
        return 'N/A';
    if (request.actual_return_date) {
        const expectedReturn = new Date(request.return_date);
        const actual = new Date(request.actual_return_date);
        if (actual > expectedReturn) {
            const daysLate = Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24));
            return `Returned ${daysLate} days late`;
        }
        return 'Returned on time';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.return_date);
    if (currentDate > returnDate) {
        const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24));
        return `Overdue by ${daysOverdue} days`;
    }
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'Expected today';
    return `Returns ${formatDate(request.return_date)}`;
}
function showToastMessage(message, type = 'success') {
    successMessage.value = message;
    showSuccessModal.value = true;
}
// ==================== API CALLS ====================
async function loadLeaveData() {
    loading.value = true;
    try {
        const result = await leaveService.getLeaveRequestById(parseInt(leaveId));
        console.log('API Response:', result);
        if (result.success && result.data) {
            const data = result.data;
            // Map the API response to snake_case for template compatibility
            leaveRequest.value = {
                id: data.leaveRequestId,
                employee_id: data.employeeId,
                employee_name: data.employee ? `${data.employee.firstName} ${data.employee.lastName}` : 'N/A',
                employee_code: data.employee?.employeeCode || 'N/A',
                department_name: data.department?.name || 'N/A',
                leave_type_id: data.leaveTypeId,
                leave_type_name: data.leaveTypeName,
                start_date: data.startDate,
                end_date: data.endDate,
                return_date: data.returnDate,
                total_days: data.totalDays,
                reason: data.reason,
                status: data.status,
                requested_date: data.requestedDate,
                approved_by: data.approvedBy,
                approved_date: data.approvedDate,
                rejection_reason: data.rejectionReason,
                rejection_date: data.rejectedDate,
                hr_notes: data.hrNotes,
                return_status: data.returnStatus,
                actual_return_date: data.actualReturnDate,
                days_late: data.daysLate,
                extensions: data.extensions || []
            };
            console.log('Mapped leave request:', leaveRequest.value);
            // Load employee balance and details
            if (data.employeeId) {
                await Promise.all([
                    loadEmployeeBalance(data.employeeId),
                    loadEmployeeDetails(data.employeeId)
                ]);
            }
        }
        else {
            console.error('Failed to load leave request:', result.error);
            showToastMessage(result.error || 'Failed to load leave request', 'error');
        }
    }
    catch (error) {
        console.error('Error loading leave data:', error);
        showToastMessage('Error loading leave request details', 'error');
    }
    finally {
        loading.value = false;
    }
}
async function loadEmployeeBalance(employeeId) {
    try {
        const result = await leaveService.getEmployeeBalance(employeeId, new Date().getFullYear());
        console.log('Balance API Response:', result);
        if (result.success && result.data) {
            const balance = result.data;
            // FIXED: Use the correct field names from your API response
            employeeBalance.value = {
                // Total days available = totalAccrued (includes carry over)
                annual_total: balance.totalAccrued || balance.totalAllocation || balance.yearlyEntitlement || 16,
                // Days used = totalUsed
                annual_used: balance.totalUsed || balance.usedThisYear || 0,
                // Available days
                available_days: balance.availableDays || 0,
                // Years of service
                years_of_service: balance.yearsOfService ||
                    (balance.anniversaryPeriods ? balance.anniversaryPeriods.length - 1 : 1),
                // Carried over days
                carried_over: balance.carryOverDetails?.reduce((sum, detail) => sum + detail.carriedOver, 0) || 0,
                // Sick leave used
                sick_used: balance.sickUsedThisYear || 0,
                // Additional details for better display
                currentPeriodEntitlement: balance.currentPeriodEntitlement,
                currentPeriodUsed: balance.currentPeriodUsed,
                currentPeriodAccrued: balance.currentPeriodAccrued,
                totalAccrued: balance.totalAccrued,
                totalUsed: balance.totalUsed
            };
            // Debug log to verify values
            console.log('Mapped employee balance:', {
                annual_total: employeeBalance.value.annual_total,
                annual_used: employeeBalance.value.annual_used,
                available_days: employeeBalance.value.available_days,
                carried_over: employeeBalance.value.carried_over
            });
        }
        else {
            employeeBalance.value = {
                annual_total: 16,
                annual_used: 0,
                available_days: 16,
                years_of_service: 1,
                carried_over: 0,
                sick_used: 0
            };
        }
    }
    catch (error) {
        console.error('Error loading employee balance:', error);
        employeeBalance.value = {
            annual_total: 16,
            annual_used: 0,
            available_days: 16,
            years_of_service: 1,
            carried_over: 0,
            sick_used: 0
        };
    }
}
async function loadEmployeeDetails(employeeId) {
    try {
        const result = await employeeService.getEmployeeById(employeeId);
        console.log('Employee Details API Response:', result);
        if (result.success && result.data) {
            const emp = result.data;
            // Calculate years of service from hireDate
            let yearsOfService = 0;
            if (emp.hireDate) {
                const hireDate = new Date(emp.hireDate);
                const todayDate = new Date();
                yearsOfService = Math.floor((todayDate - hireDate) / (1000 * 60 * 60 * 24 * 365));
            }
            employeeDetails.value = {
                position: emp.position || emp.Position?.title || 'N/A',
                email: emp.email || emp.workEmail || emp.personalEmail || 'N/A',
                join_date: emp.hireDate,
                years_of_service: yearsOfService
            };
        }
        else {
            employeeDetails.value = {
                position: 'N/A',
                email: 'N/A',
                join_date: null,
                years_of_service: 0
            };
        }
    }
    catch (error) {
        console.error('Error loading employee details:', error);
        employeeDetails.value = {
            position: 'N/A',
            email: 'N/A',
            join_date: null,
            years_of_service: 0
        };
    }
}
// ==================== ACTION FUNCTIONS ====================
async function confirmApprove() {
    try {
        const result = await leaveService.approveLeave(leaveRequest.value.id, approvalNotes.value);
        if (result.success) {
            leaveRequest.value.status = 'approved';
            leaveRequest.value.approved_date = new Date().toISOString().split('T')[0];
            leaveRequest.value.approved_by = 'HR Manager';
            if (approvalNotes.value) {
                leaveRequest.value.hr_notes = approvalNotes.value;
            }
            showApproveConfirmModal.value = false;
            showToastMessage(result.message || 'Leave request approved successfully!', 'success');
            await loadLeaveData();
        }
        else {
            showToastMessage(result.error || 'Failed to approve leave request', 'error');
        }
    }
    catch (error) {
        console.error('Error approving leave:', error);
        showToastMessage('Failed to approve leave request', 'error');
    }
}
async function confirmReject() {
    if (!rejectionReason.value) {
        showToastMessage('Please provide a rejection reason', 'error');
        return;
    }
    try {
        const result = await leaveService.rejectLeave(leaveRequest.value.id, rejectionReason.value, rejectionNotes.value);
        if (result.success) {
            leaveRequest.value.status = 'rejected';
            leaveRequest.value.rejection_reason = rejectionReason.value;
            leaveRequest.value.rejection_date = new Date().toISOString().split('T')[0];
            if (rejectionNotes.value) {
                leaveRequest.value.hr_notes = rejectionNotes.value;
            }
            showRejectConfirmModal.value = false;
            showToastMessage(result.message || 'Leave request rejected', 'success');
            await loadLeaveData();
        }
        else {
            showToastMessage(result.error || 'Failed to reject leave request', 'error');
        }
    }
    catch (error) {
        console.error('Error rejecting leave:', error);
        showToastMessage('Failed to reject leave request', 'error');
    }
}
async function confirmExtension() {
    if (!extensionDays.value || extensionDays.value < 1) {
        showToastMessage('Please enter a valid number of days', 'error');
        return;
    }
    if (!extensionReason.value) {
        showToastMessage('Please provide a reason for the extension', 'error');
        return;
    }
    try {
        const result = await leaveService.requestExtension(leaveRequest.value.id, extensionDays.value, extensionReason.value);
        if (result.success) {
            const extension = result.data;
            if (!leaveRequest.value.extensions) {
                leaveRequest.value.extensions = [];
            }
            leaveRequest.value.extensions.push({
                requested_date: extension.requestedDate,
                additional_days: extension.additionalDays,
                reason: extension.reason,
                status: extension.status,
                new_end_date: extension.newEndDate,
                approved_by: extension.approvedBy,
                approved_date: extension.approvedDate,
                rejection_reason: extension.rejectionReason
            });
            showExtensionModal.value = false;
            showToastMessage(`Extension request submitted for ${extensionDays.value} days. HR will review it.`, 'success');
        }
        else {
            showToastMessage(result.error || 'Failed to submit extension request', 'error');
        }
    }
    catch (error) {
        console.error('Error requesting extension:', error);
        showToastMessage('Failed to submit extension request', 'error');
    }
}
async function processConfirmReturn() {
    try {
        const result = await leaveService.confirmReturn(leaveRequest.value.id, actualReturnDate.value);
        if (result.success) {
            const expectedReturn = new Date(leaveRequest.value.return_date);
            const actual = new Date(actualReturnDate.value);
            const daysLate = Math.max(0, Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24)));
            leaveRequest.value.return_status = daysLate > 0 ? 'returned_late' : 'returned';
            leaveRequest.value.actual_return_date = actualReturnDate.value;
            leaveRequest.value.days_late = daysLate;
            showReturnConfirmModal.value = false;
            showToastMessage(daysLate > 0
                ? `${leaveRequest.value.employee_name} returned ${daysLate} days late`
                : `${leaveRequest.value.employee_name} returned on time`, 'success');
            await loadLeaveData();
        }
        else {
            showToastMessage(result.error || 'Failed to confirm return', 'error');
        }
    }
    catch (error) {
        console.error('Error confirming return:', error);
        showToastMessage('Failed to confirm return', 'error');
    }
}
async function confirmReinitialize() {
    try {
        const result = await leaveService.updateLeaveRequest(leaveRequest.value.id, { status: 'pending' });
        if (result.success) {
            leaveRequest.value.status = 'pending';
            leaveRequest.value.rejection_reason = null;
            leaveRequest.value.rejection_date = null;
            showReinitializeConfirmModal.value = false;
            showToastMessage('Request has been re-initialized and moved to pending for approval.', 'success');
            await loadLeaveData();
        }
        else {
            showToastMessage(result.error || 'Failed to re-initialize request', 'error');
        }
    }
    catch (error) {
        console.error('Error re-initializing leave:', error);
        showToastMessage('Failed to re-initialize request', 'error');
    }
}
function exportToCSV() {
    if (!leaveRequest.value)
        return;
    const data = [{
            'Request ID': leaveRequest.value.id,
            'Employee Name': leaveRequest.value.employee_name,
            'Employee Code': leaveRequest.value.employee_code,
            'Department': leaveRequest.value.department_name,
            'Leave Type': leaveRequest.value.leave_type_name,
            'Start Date': leaveRequest.value.start_date,
            'End Date': leaveRequest.value.end_date,
            'Return Date': leaveRequest.value.return_date,
            'Total Days': leaveRequest.value.total_days,
            'Reason': leaveRequest.value.reason,
            'Status': leaveRequest.value.status,
            'Requested Date': leaveRequest.value.requested_date,
            'Approved/Rejected Date': leaveRequest.value.approved_date || leaveRequest.value.rejection_date || '',
            'Approved/Rejected By': leaveRequest.value.approved_by || '',
            'Rejection Reason': leaveRequest.value.rejection_reason || '',
            'Return Status': leaveRequest.value.return_status || '',
            'Actual Return Date': leaveRequest.value.actual_return_date || ''
        }];
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_request_${leaveRequest.value.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMessage('CSV exported successfully!', 'success');
}
// Modal open functions
function openApproveModal() {
    approvalNotes.value = '';
    showApproveConfirmModal.value = true;
}
function openRejectModal() {
    rejectionReason.value = '';
    rejectionNotes.value = '';
    showRejectConfirmModal.value = true;
}
function openReinitializeModal() {
    showReinitializeConfirmModal.value = true;
}
function openExtensionModal() {
    extensionDays.value = 1;
    extensionReason.value = '';
    showExtensionModal.value = true;
}
function openReturnConfirmModal() {
    actualReturnDate.value = today;
    showReturnConfirmModal.value = true;
}
function closeSuccessModal() {
    showSuccessModal.value = false;
}
function goBack() {
    router.push('/leaves');
}
// ==================== INITIALIZATION ====================
onMounted(() => {
    loadLeaveData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['balance-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
/** @type {__VLS_StyleScopedClasses['return-details']} */ ;
/** @type {__VLS_StyleScopedClasses['date-box']} */ ;
/** @type {__VLS_StyleScopedClasses['return-dates']} */ ;
/** @type {__VLS_StyleScopedClasses['date-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-info']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-approved']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-item']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['approved']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-extension']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['leave-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-main']} */ ;
/** @type {__VLS_StyleScopedClasses['header-top']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
/** @type {__VLS_StyleScopedClasses['leave-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-top']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-approved']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['status-info']} */ ;
/** @type {__VLS_StyleScopedClasses['status-label']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-approved']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['status-rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-date']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-main']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-group']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['request-id']} */ ;
/** @type {__VLS_StyleScopedClasses['date-highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['days-number']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-box']} */ ;
/** @type {__VLS_StyleScopedClasses['rejection-box']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-box']} */ ;
/** @type {__VLS_StyleScopedClasses['leave-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-annual']} */ ;
/** @type {__VLS_StyleScopedClasses['type-sick']} */ ;
/** @type {__VLS_StyleScopedClasses['type-maternity']} */ ;
/** @type {__VLS_StyleScopedClasses['type-paternity']} */ ;
/** @type {__VLS_StyleScopedClasses['type-bereavement']} */ ;
/** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-container']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-card']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-header']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-title']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-used']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-note']} */ ;
/** @type {__VLS_StyleScopedClasses['balance-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['extension-timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-item']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-item']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['approved']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-content']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-header']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-date']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['approved']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-body']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['days-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-extension']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-extension']} */ ;
/** @type {__VLS_StyleScopedClasses['no-extensions']} */ ;
/** @type {__VLS_StyleScopedClasses['no-extensions-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pending-item']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-container']} */ ;
/** @type {__VLS_StyleScopedClasses['not-found-container']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['not-found-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['info-group-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['required']} */ ;
/** @type {__VLS_StyleScopedClasses['leave-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-main']} */ ;
/** @type {__VLS_StyleScopedClasses['header-top']} */ ;
/** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-detail-page" },
});
/** @type {__VLS_StyleScopedClasses['leave-detail-page']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-container" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (!__VLS_ctx.leaveRequest) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "not-found-container" },
    });
    /** @type {__VLS_StyleScopedClasses['not-found-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "not-found-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['not-found-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-content" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-header" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-top" },
    });
    /** @type {__VLS_StyleScopedClasses['header-top']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "back-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    if (__VLS_ctx.leaveRequest.status === 'pending') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openApproveModal) },
            ...{ class: "btn-approve" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-approve']} */ ;
    }
    if (__VLS_ctx.leaveRequest.status === 'pending') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openRejectModal) },
            ...{ class: "btn-reject" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
    }
    if (__VLS_ctx.leaveRequest.status === 'rejected') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openReinitializeModal) },
            ...{ class: "btn-warning" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
    }
    if (__VLS_ctx.leaveRequest.status === 'approved' && !__VLS_ctx.leaveRequest.actual_return_date && __VLS_ctx.leaveRequest.return_date <= __VLS_ctx.today) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openReturnConfirmModal) },
            ...{ class: "btn-success" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportToCSV) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-banner" },
        ...{ class: (__VLS_ctx.getStatusClass(__VLS_ctx.leaveRequest.status)) },
    });
    /** @type {__VLS_StyleScopedClasses['status-banner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
    (__VLS_ctx.getStatusIcon(__VLS_ctx.leaveRequest.status));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-info" },
    });
    /** @type {__VLS_StyleScopedClasses['status-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-value" },
    });
    /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
    (__VLS_ctx.leaveRequest.status?.toUpperCase());
    if (__VLS_ctx.leaveRequest.approved_date) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-date" },
        });
        /** @type {__VLS_StyleScopedClasses['status-date']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.approved_date));
    }
    if (__VLS_ctx.leaveRequest.rejection_reason) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-date" },
        });
        /** @type {__VLS_StyleScopedClasses['status-date']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.rejection_date) || __VLS_ctx.formatDate(__VLS_ctx.leaveRequest.approved_date) || 'N/A');
    }
    if (__VLS_ctx.leaveRequest.actual_return_date) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-date" },
        });
        /** @type {__VLS_StyleScopedClasses['status-date']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.actual_return_date));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-main" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-main']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "request-id" },
    });
    /** @type {__VLS_StyleScopedClasses['request-id']} */ ;
    (__VLS_ctx.leaveRequest.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.requested_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "leave-type-badge" },
        ...{ class: (__VLS_ctx.getLeaveTypeClass(__VLS_ctx.leaveRequest.leave_type_name)) },
    });
    /** @type {__VLS_StyleScopedClasses['leave-type-badge']} */ ;
    (__VLS_ctx.leaveRequest.leave_type_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['date-highlight']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.start_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['date-highlight']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.end_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['date-highlight']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.return_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "days-number" },
    });
    /** @type {__VLS_StyleScopedClasses['days-number']} */ ;
    (__VLS_ctx.leaveRequest.total_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (__VLS_ctx.getReturnStatusClass(__VLS_ctx.leaveRequest)) },
    });
    (__VLS_ctx.getReturnStatusText(__VLS_ctx.leaveRequest));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "reason-box" },
    });
    /** @type {__VLS_StyleScopedClasses['reason-box']} */ ;
    (__VLS_ctx.leaveRequest.reason);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "employee-name" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
    (__VLS_ctx.leaveRequest.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest.employee_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "department-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
    (__VLS_ctx.leaveRequest.department_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.employeeDetails?.position || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.employeeDetails?.email || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatDate(__VLS_ctx.employeeDetails?.join_date) || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.employeeDetails?.years_of_service || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "balance-container" },
    });
    /** @type {__VLS_StyleScopedClasses['balance-container']} */ ;
    if (__VLS_ctx.leaveRequest.leave_type_name === 'Annual Leave') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-card" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-header" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-title" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-used" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-used']} */ ;
        (__VLS_ctx.employeeBalance?.annual_used || 0);
        (__VLS_ctx.employeeBalance?.annual_total || 16);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-fill" },
            ...{ style: ({ width: ((__VLS_ctx.employeeBalance?.annual_used || 0) / (__VLS_ctx.employeeBalance?.annual_total || 16) * 100) + '%' }) },
        });
        /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-details" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-row" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.employeeBalance?.annual_total || 16);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-row" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.employeeBalance?.annual_used || 0);
        if (__VLS_ctx.employeeBalance?.carried_over > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "balance-row" },
            });
            /** @type {__VLS_StyleScopedClasses['balance-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
                ...{ class: "text-purple" },
            });
            /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
            (__VLS_ctx.employeeBalance?.carried_over);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-row" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.employeeBalance?.currentPeriodEntitlement || 16);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-footer" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-success" },
        });
        /** @type {__VLS_StyleScopedClasses['text-success']} */ ;
        (__VLS_ctx.employeeBalance?.available_days || __VLS_ctx.employeeBalance?.availableDays || 0);
        if ((__VLS_ctx.employeeBalance?.available_days || __VLS_ctx.employeeBalance?.availableDays || 0) < 5) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "warning-text" },
            });
            /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
        }
    }
    else if (__VLS_ctx.leaveRequest.leave_type_name === 'Sick Leave') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-card sick-card" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['sick-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-header" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-title" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-used" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-used']} */ ;
        (__VLS_ctx.employeeBalance?.sick_used || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-note" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
        if ((__VLS_ctx.employeeBalance?.sick_used || 0) > 15) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "balance-warning" },
            });
            /** @type {__VLS_StyleScopedClasses['balance-warning']} */ ;
            (__VLS_ctx.employeeBalance?.sick_used);
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-card fixed-card" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['fixed-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-header" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-title" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-title']} */ ;
        (__VLS_ctx.leaveRequest.leave_type_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-used" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-used']} */ ;
        (__VLS_ctx.getLeaveTypeDays());
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "balance-info" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-info']} */ ;
        (__VLS_ctx.getLeaveTypeDays());
    }
    if (__VLS_ctx.leaveRequest.leave_type_name === 'Sick Leave') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card extension-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['extension-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "card-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        if (__VLS_ctx.leaveRequest.status === 'approved') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.openExtensionModal) },
                ...{ class: "btn-extension" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-extension']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-body" },
        });
        /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
        if (__VLS_ctx.leaveRequest.extensions && __VLS_ctx.leaveRequest.extensions.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "extension-timeline" },
            });
            /** @type {__VLS_StyleScopedClasses['extension-timeline']} */ ;
            for (const [ext, idx] of __VLS_vFor((__VLS_ctx.leaveRequest.extensions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (idx),
                    ...{ class: "timeline-item" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-dot" },
                    ...{ class: (ext.status) },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-dot']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-content" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-content']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-header" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "timeline-date" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-date']} */ ;
                (__VLS_ctx.formatDate(ext.requested_date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "timeline-status" },
                    ...{ class: (ext.status) },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-status']} */ ;
                (ext.status.toUpperCase());
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-body" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-body']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-field" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "days-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['days-badge']} */ ;
                (ext.additional_days);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "timeline-field" },
                });
                /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (ext.reason);
                if (ext.new_end_date) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "timeline-field highlight" },
                    });
                    /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                    /** @type {__VLS_StyleScopedClasses['highlight']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (__VLS_ctx.formatDate(ext.new_end_date));
                }
                if (ext.approved_by) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "timeline-field" },
                    });
                    /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (ext.approved_by);
                }
                if (ext.approved_date) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "timeline-field" },
                    });
                    /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (__VLS_ctx.formatDate(ext.approved_date));
                }
                if (ext.rejection_reason) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "timeline-field rejection-field" },
                    });
                    /** @type {__VLS_StyleScopedClasses['timeline-field']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rejection-field']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (ext.rejection_reason);
                }
                // @ts-ignore
                [loading, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, goBack, goBack, openApproveModal, openRejectModal, openReinitializeModal, today, openReturnConfirmModal, exportToCSV, getStatusClass, getStatusIcon, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, getLeaveTypeClass, getReturnStatusClass, getReturnStatusText, employeeDetails, employeeDetails, employeeDetails, employeeDetails, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, employeeBalance, getLeaveTypeDays, getLeaveTypeDays, openExtensionModal,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "no-extensions" },
            });
            /** @type {__VLS_StyleScopedClasses['no-extensions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "no-extensions-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['no-extensions-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "sub-text" },
            });
            /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
        }
    }
    if (__VLS_ctx.leaveRequest.status === 'approved' && __VLS_ctx.leaveRequest.approved_by) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card approval-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['approval-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "card-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-body" },
        });
        /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.leaveRequest.approved_by);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest.approved_date));
        if (__VLS_ctx.leaveRequest.hr_notes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "info-item full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "notes-box" },
            });
            /** @type {__VLS_StyleScopedClasses['notes-box']} */ ;
            (__VLS_ctx.leaveRequest.hr_notes);
        }
    }
    if (__VLS_ctx.leaveRequest.status === 'rejected') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card rejection-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['rejection-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "card-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-body" },
        });
        /** @type {__VLS_StyleScopedClasses['card-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rejection-box" },
        });
        /** @type {__VLS_StyleScopedClasses['rejection-box']} */ ;
        (__VLS_ctx.leaveRequest.rejection_reason);
        if (__VLS_ctx.leaveRequest.hr_notes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "info-item full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "notes-box" },
            });
            /** @type {__VLS_StyleScopedClasses['notes-box']} */ ;
            (__VLS_ctx.leaveRequest.hr_notes);
        }
    }
}
if (__VLS_ctx.showExtensionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExtensionModal))
                    return;
                __VLS_ctx.showExtensionModal = false;
                // @ts-ignore
                [leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, formatDate, showExtensionModal, showExtensionModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExtensionModal))
                    return;
                __VLS_ctx.showExtensionModal = false;
                // @ts-ignore
                [showExtensionModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.start_date));
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.end_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "days-highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['days-highlight']} */ ;
    (__VLS_ctx.leaveRequest?.total_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "1",
        max: "30",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.extensionDays);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.extensionReason),
        rows: "3",
        placeholder: "e.g., Still sick, doctor advised more rest, medical complications...",
        ...{ class: "form-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExtensionModal))
                    return;
                __VLS_ctx.showExtensionModal = false;
                // @ts-ignore
                [leaveRequest, leaveRequest, leaveRequest, leaveRequest, formatDate, formatDate, showExtensionModal, extensionDays, extensionReason,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmExtension) },
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
                [confirmExtension, showReturnConfirmModal, showReturnConfirmModal,];
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
    (__VLS_ctx.leaveRequest?.employee_name);
    (__VLS_ctx.leaveRequest?.employee_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "return-period" },
    });
    /** @type {__VLS_StyleScopedClasses['return-period']} */ ;
    (__VLS_ctx.leaveRequest?.leave_type_name);
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.start_date));
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.end_date));
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
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.return_date));
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
                [leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, leaveRequest, today, formatDate, formatDate, formatDate, showReturnConfirmModal, actualReturnDate,];
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
if (__VLS_ctx.showApproveConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showApproveConfirmModal))
                    return;
                __VLS_ctx.showApproveConfirmModal = false;
                // @ts-ignore
                [processConfirmReturn, showApproveConfirmModal, showApproveConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-small" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showApproveConfirmModal))
                    return;
                __VLS_ctx.showApproveConfirmModal = false;
                // @ts-ignore
                [showApproveConfirmModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.start_date));
    (__VLS_ctx.formatDate(__VLS_ctx.leaveRequest?.end_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.approvalNotes),
        rows: "3",
        placeholder: "Add any notes...",
        ...{ class: "form-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showApproveConfirmModal))
                    return;
                __VLS_ctx.showApproveConfirmModal = false;
                // @ts-ignore
                [leaveRequest, leaveRequest, leaveRequest, formatDate, formatDate, showApproveConfirmModal, approvalNotes,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmApprove) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.showRejectConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRejectConfirmModal))
                    return;
                __VLS_ctx.showRejectConfirmModal = false;
                // @ts-ignore
                [confirmApprove, showRejectConfirmModal, showRejectConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-small" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRejectConfirmModal))
                    return;
                __VLS_ctx.showRejectConfirmModal = false;
                // @ts-ignore
                [showRejectConfirmModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest?.leave_type_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.rejectionReason),
        rows: "3",
        placeholder: "Please provide reason for rejection...",
        ...{ class: "form-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.rejectionNotes),
        rows: "2",
        placeholder: "Internal notes...",
        ...{ class: "form-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRejectConfirmModal))
                    return;
                __VLS_ctx.showRejectConfirmModal = false;
                // @ts-ignore
                [leaveRequest, leaveRequest, showRejectConfirmModal, rejectionReason, rejectionNotes,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmReject) },
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
}
if (__VLS_ctx.showReinitializeConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReinitializeConfirmModal))
                    return;
                __VLS_ctx.showReinitializeConfirmModal = false;
                // @ts-ignore
                [confirmReject, showReinitializeConfirmModal, showReinitializeConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-small" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReinitializeConfirmModal))
                    return;
                __VLS_ctx.showReinitializeConfirmModal = false;
                // @ts-ignore
                [showReinitializeConfirmModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.leaveRequest?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReinitializeConfirmModal))
                    return;
                __VLS_ctx.showReinitializeConfirmModal = false;
                // @ts-ignore
                [leaveRequest, showReinitializeConfirmModal,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmReinitialize) },
        ...{ class: "btn-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
}
if (__VLS_ctx.showSuccessModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSuccessModal))
                    return;
                __VLS_ctx.showSuccessModal = false;
                // @ts-ignore
                [confirmReinitialize, showSuccessModal, showSuccessModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-small" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSuccessModal))
                    return;
                __VLS_ctx.showSuccessModal = false;
                // @ts-ignore
                [showSuccessModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.successMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeSuccessModal) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
// @ts-ignore
[successMessage, closeSuccessModal,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
