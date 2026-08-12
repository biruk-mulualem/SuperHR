import { ref, reactive, onMounted, watch } from 'vue';
import settingService from '@/stores/settingService';
import employeeService from '@/stores/employee';
// ==================== STATE ====================
const activeTab = ref('departments');
const attendanceSubTab = ref('workSchedule');
const taxSubTab = ref('brackets');
const loading = ref(false);
const savingRules = ref(false);
const savingTaxRules = ref(false);
const savingDepartment = ref(false);
const savingPosition = ref(false);
const savingRole = ref(false);
const deleting = ref(false);
const toasts = ref([]);
// Modals
const showDepartmentModal = ref(false);
const showPositionModal = ref(false);
const showRoleModal = ref(false);
const showDeleteModal = ref(false);
const editingDepartment = ref(null);
const editingPosition = ref(null);
const editingRole = ref(null);
const deleteItem = ref(null);
const deleteType = ref('');
// Data
const departments = ref([]);
const positions = ref([]);
const roles = ref([]);
const employees = ref([]);
// Attendance Rules
const attendanceRules = ref({
    workSchedule: {
        expectedCheckIn: '06:20',
        expectedCheckOut: '18:00',
        lateThreshold: 5,
        gracePeriod: 15,
        earlyDepartureThreshold: 30,
        minWorkHours: 4,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    breakRules: {
        lunchStart: '12:00',
        lunchEnd: '13:00',
        lunchDuration: 60,
        isLunchPaid: false,
        morningBreak: 15,
        afternoonBreak: 15,
        flexibleBreaks: false
    },
    overtimeRules: {
        threshold: 8,
        normalOTRate: 1.5,
        weekendOTRate: 2.0,
        holidayOTRate: 2.5,
        maxPerDay: 4,
        maxPerWeek: 20,
        approvalRequired: true,
        eligiblePositions: []
    },
    leaveRules: {
        annualLeave: {
            baseDays: 16,
            incrementInterval: 2,
            incrementAmount: 1,
            maxDays: null,
            carryOverLimit: 30,
            carryOverExpiryYears: 3,
            accrualType: "anniversary",
            requiresApproval: true,
            minNoticeDays: 0,
            maxConsecutiveDays: 120
        },
        sickLeave: {
            hasFixedLimit: false,
            requiresDoctorNoteAfter: 3,
            alertThreshold: 15,
            resetFrequency: "yearly",
            requiresApproval: false,
            minNoticeDays: 0
        },
        maternityLeave: {
            defaultDays: 90,
            isPaid: true,
            requiresApproval: true,
            requiresDocumentation: true,
            minNoticeDays: 30,
            isOneTime: true,
            genderRestriction: "female",
            extensionAllowed: true,
            maxExtensionDays: 30
        },
        paternityLeave: {
            defaultDays: 3,
            isPaid: true,
            requiresApproval: true,
            minNoticeDays: 14,
            isOneTime: true,
            genderRestriction: "male",
            mustTakeWithinDays: 30
        },
        bereavementLeave: {
            defaultDays: 3,
            isPaid: true,
            requiresApproval: true,
            requiresDocumentation: true,
            minNoticeDays: 0,
            eligibleRelationships: ["spouse", "parent", "child", "sibling"],
            immediateFamilyDays: 5,
            isOneTime: false,
            maxPerYear: 10
        },
        unpaidLeave: {
            isPaid: false,
            requiresApproval: true,
            requiresDirectorApproval: true,
            minNoticeDays: 14,
            maxConsecutiveDays: 30,
            maxPerYear: 60,
            requiresReason: true
        },
        validation: {
            minDaysPerRequest: 1,
            maxDaysPerRequest: 30,
            minNoticeDaysPerType: {
                annual: 7,
                sick: 0,
                maternity: 30,
                paternity: 14,
                bereavement: 0,
                unpaid: 14
            },
            overlapAllowed: false,
            concurrentLeavesAllowed: true,
            maxConcurrentEmployees: 5000,
            pendingRequestsBlockNew: true,
            futureDateOnly: true,
            maxFutureDays: 365,
            weekendCounting: true,
            holidayCounting: false
        }
    },
    returnTracking: {
        enabled: true,
        returnConfirmationRequired: true,
        gracePeriodHours: 24,
        overdueAlertDays: [1, 3, 5, 7],
        allowEarlyReturn: true,
        allowLateReturn: true,
        requireReturnNotes: false,
        autoMarkReturned: false,
        overdueAction: "notify",
        overdueEscalationDays: [1, 3, 5, 7]
    },
    extensions: {
        maxExtensionsPerLeave: 2,
        maxTotalExtensionDays: 30,
        extensionRequiresApproval: true,
        extensionApprovalChain: ["manager", "hr"],
        autoApproveExtensionDays: 2,
        extensionReasonRequired: true,
        doctorNoteRequiredForExtension: true,
        allowedLeaveTypesForExtension: ["sick_leave"]
    },
    yearEndProcessing: {
        processingDate: "2026-12-31",
        carryOverDeadline: "2026-12-15",
        expiryNotificationDays: [60, 30, 14, 7, 3, 1],
        autoCarryOver: true,
        resetSickLeave: true,
        notificationRecipients: ["hr", "employee", "manager"]
    },
    approvalWorkflow: {
        requiresManagerApproval: true,
        requiresHrApproval: true,
        autoApproveThresholdDays: 3,
        autoApproveLeaveTypes: ["sick_leave"],
        escalationDays: 7,
        approvalChain: ["manager", "hr", "director"],
        allowSelfCancellation: true,
        cancellationDeadlineDays: 2,
        rejectionReasonRequired: true
    },
    notifications: {
        reminderDaysBefore: [30, 14, 7, 3, 1],
        overdueAlertDays: [1, 3, 5, 7],
        expiryAlertDays: [60, 30, 14, 7],
        pendingApprovalReminderDays: [3, 5, 7],
        channels: ["email", "in_app"],
        notifyOn: {
            requestSubmitted: ["manager", "hr"],
            requestApproved: ["employee"],
            requestRejected: ["employee"],
            extensionRequested: ["manager", "hr"],
            extensionApproved: ["employee"],
            extensionRejected: ["employee"],
            returnOverdue: ["employee", "manager", "hr"],
            balanceLow: ["employee"],
            leaveExpiring: ["employee"],
            carryOverApplied: ["employee"]
        }
    },
    blackoutPeriods: {
        enabled: true,
        global: [],
        departmentSpecific: {},
        exceptionAllowed: true,
        exceptionRequiresDirectorApproval: true
    },
    holidayRules: {
        holidays: [
            { date: '2026-01-01', name: 'New Year', type: 'public' },
            { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
            { date: '2026-01-19', name: 'Timkat', type: 'religious' },
            { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
            { date: '2026-03-20', name: 'Eid al-Fitr', type: 'religious' },
            { date: '2026-04-10', name: 'Good Friday', type: 'religious' },
            { date: '2026-04-12', name: 'Fasika (Easter)', type: 'religious' },
            { date: '2026-05-01', name: 'Labour Day', type: 'public' },
            { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
            { date: '2026-05-27', name: 'Eid al-Adha', type: 'religious' },
            { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
            { date: '2026-08-26', name: 'Mawlid (Prophet Muhammad\'s Birthday)', type: 'religious' },
            { date: '2026-09-11', name: 'Ethiopian New Year', type: 'public' },
            { date: '2026-09-27', name: 'Meskel', type: 'religious' }
        ],
        holidayOvertimeRate: 2.5
    },
    fieldWorkRules: {
        consideredPresent: true,
        defaultHours: 8,
        requireCheckin: false,
        eligiblePositions: []
    }
});
// Tax Rules
const taxRules = ref({
    version: "1.0",
    effectiveFrom: "2024-01-01",
    lastUpdated: new Date().toISOString(),
    legalReference: {
        incomeTaxProclamation: "No. 286/2002 as amended",
        pensionProclamation: "No. 715/2011 as amended by No. 908/2015"
    },
    employmentTax: {
        brackets: [
            { min: 0, max: 2000, rate: 0, deduction: 0, description: "Exempt" },
            { min: 2001, max: 4000, rate: 15, deduction: 0, description: "15% on amount over 2,000" },
            { min: 4001, max: 7000, rate: 20, deduction: 200, description: "20% minus 200" },
            { min: 7001, max: 10000, rate: 25, deduction: 550, description: "25% minus 550" },
            { min: 10001, max: 14000, rate: 30, deduction: 1050, description: "30% minus 1,050" },
            { min: 14001, max: null, rate: 35, deduction: 1750, description: "35% minus 1,750" }
        ],
        calculationFormula: "Tax = (Income * Rate / 100) - Deduction",
        roundingMethod: "floor"
    },
    pension: {
        employeeRate: 7,
        employerRate: 11,
        monthlyCap: 15000,
        maxEmployeeContribution: 1050,
        maxEmployerContribution: 1650,
        calculationBase: "basic_salary_only",
        notes: "Any salary above 15,000 ETB is not subject to pension contribution"
    },
    exemptions: {
        transportAllowance: {
            isExempt: true,
            maxExemptAmount: 2200,
            alternativeLimit: "25_percent_of_salary",
            calculationMethod: "min_of_fixed_or_percentage"
        },
        medicalReimbursement: { isExempt: true },
        hardshipAllowance: { isExempt: true },
        travelReimbursement: { isExempt: true }
    },
    taxResidency: {
        daysThreshold: 183,
        permanentResidenceCriteria: true,
        description: "Foreigners become tax residents after 183 days or if they have permanent residence"
    },
    withholdingTax: {
        standardRate: 15,
        goodsThreshold: 10000,
        servicesThreshold: 3000,
        noTinRate: 30,
        appliesTo: ["service_fees", "dividends", "royalties", "interest"]
    },
    deadlines: {
        taxRemittanceDay: 8,
        pensionRemittanceDay: 10
    },
    vat: {
        registrationThreshold: 1000000,
        standardRate: 15,
        notes: "Businesses exceeding threshold must register for VAT"
    },
    turnoverTax: {
        goodsRate: 2,
        servicesContractorsRate: 2,
        servicesOthersRate: 10
    }
});
// Form Models
const departmentForm = reactive({
    code: '',
    name: '',
    description: '',
    managerId: null,
    isActive: true
});
const positionForm = reactive({
    code: '',
    title: '',
    departmentId: null,
    level: '',
    isActive: true
});
const roleForm = reactive({
    name: '',
    description: '',
    isActive: true
});
// Tabs
const tabs = [
    { id: 'departments', name: 'Departments' },
    { id: 'positions', name: 'Positions' },
    { id: 'roles', name: 'Roles' },
    { id: 'attendance', name: 'Attendance Rules' },
    { id: 'tax', name: 'Tax Rules' }
];
const attendanceSubTabs = [
    { id: 'workSchedule', name: ' Schedule' },
    { id: 'breakRules', name: ' Breaks' },
    { id: 'overtimeRules', name: ' Overtime' },
    { id: 'leaveTypes', name: ' Leave Types' },
    { id: 'validation', name: ' Validation' },
    { id: 'extensions', name: ' Extensions' },
    { id: 'workflow', name: ' Workflow' },
    { id: 'notifications', name: ' Notifications' },
    { id: 'holidays', name: ' Holidays' }
];
const taxSubTabs = [
    { id: 'brackets', name: '📊 Tax Brackets' },
    { id: 'pension', name: '🏦 Pension' },
    { id: 'exemptions', name: '✅ Exemptions' },
    { id: 'withholding', name: '💰 Withholding & VAT' },
    { id: 'residency', name: '🌍 Residency & Deadlines' },
    { id: 'legal', name: '⚖️ Legal & Version' }
];
const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];
// ==================== WATCHERS ====================
// Auto-calculate max pension contributions
watch(() => [taxRules.value.pension.monthlyCap, taxRules.value.pension.employeeRate, taxRules.value.pension.employerRate], () => {
    taxRules.value.pension.maxEmployeeContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employeeRate / 100);
    taxRules.value.pension.maxEmployerContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employerRate / 100);
}, { deep: true });
// ==================== API CALLS ====================
const loadTabData = async (tabId) => {
    loading.value = true;
    try {
        if (tabId === 'departments') {
            const res = await settingService.getDepartments(1, 100, true);
            if (res.success)
                departments.value = res.data;
        }
        else if (tabId === 'positions') {
            const res = await settingService.getPositions(1, 100, true);
            if (res.success)
                positions.value = res.data;
        }
        else if (tabId === 'roles') {
            const res = await settingService.getRoles(1, 100, true);
            if (res.success)
                roles.value = res.data;
        }
        else if (tabId === 'attendance') {
            const res = await settingService.getAttendanceRules();
            if (res.success && res.data) {
                const loadedData = res.data;
                if (loadedData.workSchedule)
                    Object.assign(attendanceRules.value.workSchedule, loadedData.workSchedule);
                if (loadedData.breakRules)
                    Object.assign(attendanceRules.value.breakRules, loadedData.breakRules);
                if (loadedData.overtimeRules)
                    Object.assign(attendanceRules.value.overtimeRules, loadedData.overtimeRules);
                if (loadedData.holidayRules)
                    Object.assign(attendanceRules.value.holidayRules, loadedData.holidayRules);
                if (loadedData.fieldWorkRules)
                    Object.assign(attendanceRules.value.fieldWorkRules, loadedData.fieldWorkRules);
                if (loadedData.returnTracking)
                    Object.assign(attendanceRules.value.returnTracking, loadedData.returnTracking);
                if (loadedData.extensions)
                    Object.assign(attendanceRules.value.extensions, loadedData.extensions);
                if (loadedData.yearEndProcessing)
                    Object.assign(attendanceRules.value.yearEndProcessing, loadedData.yearEndProcessing);
                if (loadedData.approvalWorkflow)
                    Object.assign(attendanceRules.value.approvalWorkflow, loadedData.approvalWorkflow);
                if (loadedData.leaveRules) {
                    if (loadedData.leaveRules.annualLeave)
                        Object.assign(attendanceRules.value.leaveRules.annualLeave, loadedData.leaveRules.annualLeave);
                    if (loadedData.leaveRules.sickLeave)
                        Object.assign(attendanceRules.value.leaveRules.sickLeave, loadedData.leaveRules.sickLeave);
                    if (loadedData.leaveRules.maternityLeave)
                        Object.assign(attendanceRules.value.leaveRules.maternityLeave, loadedData.leaveRules.maternityLeave);
                    if (loadedData.leaveRules.paternityLeave)
                        Object.assign(attendanceRules.value.leaveRules.paternityLeave, loadedData.leaveRules.paternityLeave);
                    if (loadedData.leaveRules.bereavementLeave)
                        Object.assign(attendanceRules.value.leaveRules.bereavementLeave, loadedData.leaveRules.bereavementLeave);
                    if (loadedData.leaveRules.unpaidLeave)
                        Object.assign(attendanceRules.value.leaveRules.unpaidLeave, loadedData.leaveRules.unpaidLeave);
                    if (loadedData.leaveRules.validation)
                        Object.assign(attendanceRules.value.leaveRules.validation, loadedData.leaveRules.validation);
                }
            }
        }
        else if (tabId === 'tax') {
            await loadTaxRules();
        }
    }
    catch (error) {
        addToast(error.error || 'Failed to load data', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadTaxRules = async () => {
    try {
        const response = await settingService.getAttendanceRules();
        if (response.success && response.data && response.data['tax.rules']) {
            taxRules.value = JSON.parse(JSON.stringify(response.data['tax.rules']));
        }
    }
    catch (error) {
        console.error('Error loading tax rules:', error);
        addToast('Failed to load tax rules', 'error');
    }
};
const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees({ limit: 100 });
        if (response.success) {
            employees.value = response.data || [];
        }
    }
    catch (error) {
        console.error('Error fetching employees:', error);
    }
};
const saveAttendanceRules = async () => {
    savingRules.value = true;
    try {
        const rulesToSave = {
            workSchedule: attendanceRules.value.workSchedule,
            breakRules: attendanceRules.value.breakRules,
            overtimeRules: attendanceRules.value.overtimeRules,
            holidayRules: attendanceRules.value.holidayRules,
            fieldWorkRules: attendanceRules.value.fieldWorkRules,
            returnTracking: attendanceRules.value.returnTracking,
            extensions: attendanceRules.value.extensions,
            yearEndProcessing: attendanceRules.value.yearEndProcessing,
            approvalWorkflow: attendanceRules.value.approvalWorkflow,
            leaveRules: {
                annualLeave: attendanceRules.value.leaveRules.annualLeave,
                sickLeave: attendanceRules.value.leaveRules.sickLeave,
                maternityLeave: attendanceRules.value.leaveRules.maternityLeave,
                paternityLeave: attendanceRules.value.leaveRules.paternityLeave,
                bereavementLeave: attendanceRules.value.leaveRules.bereavementLeave,
                unpaidLeave: attendanceRules.value.leaveRules.unpaidLeave,
                validation: attendanceRules.value.leaveRules.validation
            }
        };
        const response = await settingService.updateAttendanceRules(rulesToSave);
        if (response.success) {
            addToast('Attendance rules saved successfully', 'success');
        }
        else {
            addToast(response.error || 'Failed to save rules', 'error');
        }
    }
    catch (error) {
        addToast(error.message || 'Failed to save rules', 'error');
    }
    finally {
        savingRules.value = false;
    }
};
const saveTaxRules = async () => {
    savingTaxRules.value = true;
    try {
        const currentSettings = await settingService.getAttendanceRules();
        const updatedSettings = {
            ...currentSettings.data,
            'tax.rules': taxRules.value
        };
        const response = await settingService.updateAttendanceRules(updatedSettings);
        if (response.success) {
            addToast('Tax rules saved successfully', 'success');
            taxRules.value.lastUpdated = new Date().toISOString();
            taxRules.value.version = (parseInt(taxRules.value.version) + 1).toString();
        }
        else {
            addToast(response.error || 'Failed to save tax rules', 'error');
        }
    }
    catch (error) {
        addToast(error.message || 'Failed to save tax rules', 'error');
    }
    finally {
        savingTaxRules.value = false;
    }
};
// ==================== DEPARTMENT CRUD ====================
const openDepartmentModal = (dept = null) => {
    editingDepartment.value = dept;
    if (dept) {
        departmentForm.code = dept.code;
        departmentForm.name = dept.name;
        departmentForm.description = dept.description || '';
        departmentForm.managerId = dept.managerId;
        departmentForm.isActive = dept.isActive;
    }
    else {
        departmentForm.code = '';
        departmentForm.name = '';
        departmentForm.description = '';
        departmentForm.managerId = null;
        departmentForm.isActive = true;
    }
    showDepartmentModal.value = true;
};
const closeDepartmentModal = () => {
    showDepartmentModal.value = false;
    editingDepartment.value = null;
};
const saveDepartment = async () => {
    savingDepartment.value = true;
    try {
        let res;
        if (editingDepartment.value) {
            res = await settingService.updateDepartment(editingDepartment.value.departmentId, departmentForm);
        }
        else {
            res = await settingService.createDepartment(departmentForm);
        }
        if (res.success) {
            addToast(res.message || 'Department saved', 'success');
            await loadTabData('departments');
            closeDepartmentModal();
        }
        else {
            addToast(res.error || 'Failed to save', 'error');
        }
    }
    catch (error) {
        addToast(error.message || 'Failed to save', 'error');
    }
    finally {
        savingDepartment.value = false;
    }
};
const toggleDepartmentStatus = async (dept) => {
    try {
        const res = await settingService.toggleDepartmentStatus(dept.departmentId, !dept.isActive);
        if (res.success) {
            dept.isActive = !dept.isActive;
            addToast(`Department ${dept.isActive ? 'activated' : 'deactivated'}`, 'success');
        }
    }
    catch (error) {
        addToast(error.error || 'Failed to update status', 'error');
    }
};
// ==================== POSITION CRUD ====================
const openPositionModal = (position = null) => {
    editingPosition.value = position;
    if (position) {
        positionForm.code = position.code;
        positionForm.title = position.title;
        positionForm.departmentId = position.departmentId;
        positionForm.level = position.level || '';
        positionForm.isActive = position.isActive;
    }
    else {
        positionForm.code = '';
        positionForm.title = '';
        positionForm.departmentId = null;
        positionForm.level = '';
        positionForm.isActive = true;
    }
    showPositionModal.value = true;
};
const closePositionModal = () => {
    showPositionModal.value = false;
    editingPosition.value = null;
};
const savePosition = async () => {
    savingPosition.value = true;
    try {
        const formData = {
            code: positionForm.code,
            title: positionForm.title,
            departmentId: positionForm.departmentId || null,
            level: positionForm.level || null,
            isActive: positionForm.isActive
        };
        let res;
        if (editingPosition.value) {
            res = await settingService.updatePosition(editingPosition.value.positionId, formData);
        }
        else {
            res = await settingService.createPosition(formData);
        }
        if (res.success) {
            addToast(res.message || 'Position saved', 'success');
            await loadTabData('positions');
            closePositionModal();
        }
        else {
            addToast(res.error || 'Failed to save', 'error');
        }
    }
    catch (error) {
        addToast(error.message || 'Failed to save', 'error');
    }
    finally {
        savingPosition.value = false;
    }
};
const togglePositionStatus = async (position) => {
    try {
        const res = await settingService.togglePositionStatus(position.positionId, !position.isActive);
        if (res.success) {
            position.isActive = !position.isActive;
            addToast(`Position ${position.isActive ? 'activated' : 'deactivated'}`, 'success');
        }
    }
    catch (error) {
        addToast(error.error || 'Failed to update status', 'error');
    }
};
// ==================== ROLE CRUD ====================
const openRoleModal = (role = null) => {
    editingRole.value = role;
    if (role) {
        roleForm.name = role.name;
        roleForm.description = role.description || '';
        roleForm.isActive = role.isActive;
    }
    else {
        roleForm.name = '';
        roleForm.description = '';
        roleForm.isActive = true;
    }
    showRoleModal.value = true;
};
const closeRoleModal = () => {
    showRoleModal.value = false;
    editingRole.value = null;
};
const saveRole = async () => {
    savingRole.value = true;
    try {
        let res;
        if (editingRole.value) {
            res = await settingService.updateRole(editingRole.value.roleId, roleForm);
        }
        else {
            res = await settingService.createRole(roleForm);
        }
        if (res.success) {
            addToast(res.message || 'Role saved', 'success');
            await loadTabData('roles');
            closeRoleModal();
        }
        else {
            addToast(res.error || 'Failed to save', 'error');
        }
    }
    catch (error) {
        addToast(error.message || 'Failed to save', 'error');
    }
    finally {
        savingRole.value = false;
    }
};
const toggleRoleStatus = async (role) => {
    try {
        const res = await settingService.toggleRoleStatus(role.roleId, !role.isActive);
        if (res.success) {
            role.isActive = !role.isActive;
            addToast(`Role ${role.isActive ? 'activated' : 'deactivated'}`, 'success');
        }
    }
    catch (error) {
        addToast(error.error || 'Failed to update status', 'error');
    }
};
// ==================== DELETE FUNCTIONS ====================
const confirmDelete = (type, item) => {
    deleteType.value = type;
    deleteItem.value = item;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteItem.value = null;
    deleteType.value = '';
};
const executeDelete = async () => {
    deleting.value = true;
    try {
        let res;
        if (deleteType.value === 'department') {
            res = await settingService.deleteDepartment(deleteItem.value.departmentId);
            if (res.success) {
                addToast('Department deleted successfully', 'success');
                await loadTabData('departments');
            }
        }
        else if (deleteType.value === 'position') {
            res = await settingService.deletePosition(deleteItem.value.positionId);
            if (res.success) {
                addToast('Position deleted successfully', 'success');
                await loadTabData('positions');
            }
        }
        else if (deleteType.value === 'role') {
            res = await settingService.deleteRole(deleteItem.value.roleId);
            if (res.success) {
                addToast('Role deleted successfully', 'success');
                await loadTabData('roles');
            }
        }
        closeDeleteModal();
    }
    catch (error) {
        addToast(error.error || 'Failed to delete', 'error');
    }
    finally {
        deleting.value = false;
    }
};
// ==================== HELPERS ====================
const getDepartmentName = (deptId) => {
    const dept = departments.value.find(d => d.departmentId === deptId);
    return dept ? dept.name : '-';
};
const addHoliday = () => {
    attendanceRules.value.holidayRules.holidays.push({ date: '', name: '', type: 'public' });
};
const removeHoliday = (index) => {
    attendanceRules.value.holidayRules.holidays.splice(index, 1);
};
const updateEligibleRelationships = (event) => {
    attendanceRules.value.leaveRules.bereavementLeave.eligibleRelationships =
        event.target.value.split(',').map(s => s.trim());
};
const updateOverdueAlertDays = (event) => {
    attendanceRules.value.returnTracking.overdueAlertDays =
        event.target.value.split(',').map(s => parseInt(s.trim()));
};
const updateReminderDays = (event) => {
    attendanceRules.value.notifications.reminderDaysBefore =
        event.target.value.split(',').map(s => parseInt(s.trim()));
};
const updateExpiryAlertDays = (event) => {
    attendanceRules.value.notifications.expiryAlertDays =
        event.target.value.split(',').map(s => parseInt(s.trim()));
};
const updateApprovalChain = (event) => {
    attendanceRules.value.approvalWorkflow.approvalChain =
        event.target.value.split(',').map(s => s.trim());
};
const formatDate = (dateString) => {
    if (!dateString)
        return '-';
    return new Date(dateString).toLocaleString();
};
const addToast = (message, type = 'success') => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }, 3000);
};
// Initialize
onMounted(async () => {
    await Promise.all([
        loadTabData('departments'),
        loadTabData('positions'),
        loadTabData('roles'),
        loadTabData('attendance'),
        loadTabData('tax'),
        fetchEmployees()
    ]);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tax-info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
/** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-page']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['holiday-item']} */ ;
/** @type {__VLS_StyleScopedClasses['holiday-date']} */ ;
/** @type {__VLS_StyleScopedClasses['holiday-name']} */ ;
/** @type {__VLS_StyleScopedClasses['holiday-type']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "settings-page" },
});
/** @type {__VLS_StyleScopedClasses['settings-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "settings-header" },
});
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "settings-tabs" },
});
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeTab = tab.id;
                __VLS_ctx.loadTabData(tab.id);
                // @ts-ignore
                [tabs, activeTab, loadTabData,];
            } },
        key: (tab.id),
        ...{ class: ({ active: __VLS_ctx.activeTab === tab.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (tab.name);
    // @ts-ignore
    [activeTab,];
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
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    if (__VLS_ctx.activeTab === 'departments') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "settings-card" },
        });
        /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.activeTab === 'departments'))
                        return;
                    __VLS_ctx.openDepartmentModal();
                    // @ts-ignore
                    [activeTab, loading, openDepartmentModal,];
                } },
            ...{ class: "btn-add" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-responsive" },
        });
        /** @type {__VLS_StyleScopedClasses['table-responsive']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (dept.departmentId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (dept.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (dept.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (dept.manager?.fullName || dept.managerName || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'departments'))
                            return;
                        __VLS_ctx.toggleDepartmentStatus(dept);
                        // @ts-ignore
                        [departments, toggleDepartmentStatus,];
                    } },
                ...{ class: (['status-toggle', dept.isActive ? 'active' : 'inactive']) },
            });
            /** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-dot" },
            });
            /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
            (dept.isActive ? 'Active' : 'Inactive');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions" },
            });
            /** @type {__VLS_StyleScopedClasses['actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'departments'))
                            return;
                        __VLS_ctx.openDepartmentModal(dept);
                        // @ts-ignore
                        [openDepartmentModal,];
                    } },
                ...{ class: "action-btn edit" },
                title: "Edit",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['edit']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M17 3l4 4-7 7H10v-4l7-7z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'departments'))
                            return;
                        __VLS_ctx.confirmDelete('department', dept);
                        // @ts-ignore
                        [confirmDelete,];
                    } },
                ...{ class: "action-btn delete" },
                title: "Delete",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['delete']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            });
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.departments.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "5",
                ...{ class: "empty" },
            });
            /** @type {__VLS_StyleScopedClasses['empty']} */ ;
        }
    }
    if (__VLS_ctx.activeTab === 'positions') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "settings-card" },
        });
        /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.activeTab === 'positions'))
                        return;
                    __VLS_ctx.openPositionModal();
                    // @ts-ignore
                    [activeTab, departments, openPositionModal,];
                } },
            ...{ class: "btn-add" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-responsive" },
        });
        /** @type {__VLS_StyleScopedClasses['table-responsive']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [position] of __VLS_vFor((__VLS_ctx.positions))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (position.positionId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (position.code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (position.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.getDepartmentName(position.departmentId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (position.level || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'positions'))
                            return;
                        __VLS_ctx.togglePositionStatus(position);
                        // @ts-ignore
                        [positions, getDepartmentName, togglePositionStatus,];
                    } },
                ...{ class: (['status-toggle', position.isActive ? 'active' : 'inactive']) },
            });
            /** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-dot" },
            });
            /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
            (position.isActive ? 'Active' : 'Inactive');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions" },
            });
            /** @type {__VLS_StyleScopedClasses['actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'positions'))
                            return;
                        __VLS_ctx.openPositionModal(position);
                        // @ts-ignore
                        [openPositionModal,];
                    } },
                ...{ class: "action-btn edit" },
                title: "Edit",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['edit']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M17 3l4 4-7 7H10v-4l7-7z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'positions'))
                            return;
                        __VLS_ctx.confirmDelete('position', position);
                        // @ts-ignore
                        [confirmDelete,];
                    } },
                ...{ class: "action-btn delete" },
                title: "Delete",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['delete']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            });
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.positions.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "empty" },
            });
            /** @type {__VLS_StyleScopedClasses['empty']} */ ;
        }
    }
    if (__VLS_ctx.activeTab === 'roles') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "settings-card" },
        });
        /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.activeTab === 'roles'))
                        return;
                    __VLS_ctx.openRoleModal();
                    // @ts-ignore
                    [activeTab, positions, openRoleModal,];
                } },
            ...{ class: "btn-add" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-responsive" },
        });
        /** @type {__VLS_StyleScopedClasses['table-responsive']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [role] of __VLS_vFor((__VLS_ctx.roles))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (role.roleId),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (role.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (role.description || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'roles'))
                            return;
                        __VLS_ctx.toggleRoleStatus(role);
                        // @ts-ignore
                        [roles, toggleRoleStatus,];
                    } },
                ...{ class: (['status-toggle', role.isActive ? 'active' : 'inactive']) },
            });
            /** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-dot" },
            });
            /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
            (role.isActive ? 'Active' : 'Inactive');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions" },
            });
            /** @type {__VLS_StyleScopedClasses['actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'roles'))
                            return;
                        __VLS_ctx.openRoleModal(role);
                        // @ts-ignore
                        [openRoleModal,];
                    } },
                ...{ class: "action-btn edit" },
                title: "Edit",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['edit']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M17 3l4 4-7 7H10v-4l7-7z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'roles'))
                            return;
                        __VLS_ctx.confirmDelete('role', role);
                        // @ts-ignore
                        [confirmDelete,];
                    } },
                ...{ class: "action-btn delete" },
                title: "Delete",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['delete']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            });
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.roles.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "4",
                ...{ class: "empty" },
            });
            /** @type {__VLS_StyleScopedClasses['empty']} */ ;
        }
    }
    if (__VLS_ctx.activeTab === 'attendance') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "settings-card" },
        });
        /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveAttendanceRules) },
            ...{ class: "btn-save" },
            disabled: (__VLS_ctx.savingRules),
        });
        /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "sub-tabs" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
        for (const [subTab] of __VLS_vFor((__VLS_ctx.attendanceSubTabs))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'attendance'))
                            return;
                        __VLS_ctx.attendanceSubTab = subTab.id;
                        // @ts-ignore
                        [activeTab, roles, saveAttendanceRules, savingRules, attendanceSubTabs, attendanceSubTab,];
                    } },
                key: (subTab.id),
                ...{ class: ({ active: __VLS_ctx.attendanceSubTab === subTab.id }) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            (subTab.name);
            // @ts-ignore
            [attendanceSubTab,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rules-container" },
        });
        /** @type {__VLS_StyleScopedClasses['rules-container']} */ ;
        if (__VLS_ctx.attendanceSubTab === 'workSchedule') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "time",
            });
            (__VLS_ctx.attendanceRules.workSchedule.expectedCheckIn);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "time",
            });
            (__VLS_ctx.attendanceRules.workSchedule.expectedCheckOut);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.workSchedule.lateThreshold);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.workSchedule.gracePeriod);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.workSchedule.earlyDepartureThreshold);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
            });
            (__VLS_ctx.attendanceRules.workSchedule.minWorkHours);
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "checkbox-group" },
            });
            /** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
            for (const [day] of __VLS_vFor((__VLS_ctx.weekDays))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    key: (day.value),
                    ...{ class: "checkbox-label" },
                });
                /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    value: (day.value),
                });
                (__VLS_ctx.attendanceRules.workSchedule.workingDays);
                (day.label);
                // @ts-ignore
                [attendanceSubTab, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, weekDays,];
            }
        }
        if (__VLS_ctx.attendanceSubTab === 'breakRules') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "time",
            });
            (__VLS_ctx.attendanceRules.breakRules.lunchStart);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "time",
            });
            (__VLS_ctx.attendanceRules.breakRules.lunchEnd);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.breakRules.lunchDuration);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.breakRules.isLunchPaid),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.breakRules.morningBreak);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.breakRules.afternoonBreak);
        }
        if (__VLS_ctx.attendanceSubTab === 'overtimeRules') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.threshold);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.1",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.normalOTRate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.1",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.weekendOTRate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.1",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.holidayOTRate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.maxPerDay);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.overtimeRules.maxPerWeek);
        }
        if (__VLS_ctx.attendanceSubTab === 'leaveTypes') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.annualLeave.baseDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.annualLeave.incrementInterval);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.annualLeave.carryOverLimit);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.annualLeave.carryOverExpiryYears);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.sickLeave.requiresDoctorNoteAfter);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.sickLeave.alertThreshold);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.maternityLeave.defaultDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.maternityLeave.isPaid),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.maternityLeave.minNoticeDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.paternityLeave.defaultDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.paternityLeave.minNoticeDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.bereavementLeave.defaultDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.bereavementLeave.immediateFamilyDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                ...{ onInput: (__VLS_ctx.updateEligibleRelationships) },
                type: "text",
                value: (__VLS_ctx.attendanceRules.leaveRules.bereavementLeave.eligibleRelationships.join(', ')),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.isPaid),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.requiresApproval),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.requiresDirectorApproval),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.minNoticeDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.maxConsecutiveDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.maxPerYear);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.unpaidLeave.requiresReason),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
        }
        if (__VLS_ctx.attendanceSubTab === 'validation') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.validation.minDaysPerRequest);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.validation.maxDaysPerRequest);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.leaveRules.validation.maxConcurrentEmployees);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.validation.overlapAllowed),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.leaveRules.validation.futureDateOnly),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
        }
        if (__VLS_ctx.attendanceSubTab === 'extensions') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.extensions.maxExtensionsPerLeave);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.extensions.maxTotalExtensionDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.returnTracking.enabled),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.returnTracking.gracePeriodHours);
        }
        if (__VLS_ctx.attendanceSubTab === 'workflow') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.approvalWorkflow.requiresManagerApproval),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.approvalWorkflow.requiresHrApproval),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
            });
            (__VLS_ctx.attendanceRules.approvalWorkflow.autoApproveThresholdDays);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                ...{ onInput: (__VLS_ctx.updateApprovalChain) },
                type: "text",
                value: (__VLS_ctx.attendanceRules.approvalWorkflow.approvalChain.join(', ')),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "date",
            });
            (__VLS_ctx.attendanceRules.yearEndProcessing.processingDate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.yearEndProcessing.autoCarryOver),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
        }
        if (__VLS_ctx.attendanceSubTab === 'notifications') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                ...{ onInput: (__VLS_ctx.updateReminderDays) },
                type: "text",
                value: (__VLS_ctx.attendanceRules.notifications.reminderDaysBefore.join(', ')),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                ...{ onInput: (__VLS_ctx.updateOverdueAlertDays) },
                type: "text",
                value: (__VLS_ctx.attendanceRules.returnTracking.overdueAlertDays.join(', ')),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                ...{ onInput: (__VLS_ctx.updateExpiryAlertDays) },
                type: "text",
                value: (__VLS_ctx.attendanceRules.notifications.expiryAlertDays.join(', ')),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                multiple: true,
                value: (__VLS_ctx.attendanceRules.notifications.channels),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "email",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "in_app",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "sms",
            });
        }
        if (__VLS_ctx.attendanceSubTab === 'holidays') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "holidays-list" },
            });
            /** @type {__VLS_StyleScopedClasses['holidays-list']} */ ;
            for (const [holiday, index] of __VLS_vFor((__VLS_ctx.attendanceRules.holidayRules.holidays))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (index),
                    ...{ class: "holiday-item" },
                });
                /** @type {__VLS_StyleScopedClasses['holiday-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "date",
                    ...{ class: "holiday-date" },
                });
                (holiday.date);
                /** @type {__VLS_StyleScopedClasses['holiday-date']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "text",
                    value: (holiday.name),
                    ...{ class: "holiday-name" },
                    placeholder: "Holiday name",
                });
                /** @type {__VLS_StyleScopedClasses['holiday-name']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    value: (holiday.type),
                    ...{ class: "holiday-type" },
                });
                /** @type {__VLS_StyleScopedClasses['holiday-type']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "public",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "religious",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "company",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.activeTab === 'attendance'))
                                return;
                            if (!(__VLS_ctx.attendanceSubTab === 'holidays'))
                                return;
                            __VLS_ctx.removeHoliday(index);
                            // @ts-ignore
                            [attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceSubTab, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, attendanceRules, updateEligibleRelationships, updateApprovalChain, updateReminderDays, updateOverdueAlertDays, updateExpiryAlertDays, removeHoliday,];
                        } },
                    ...{ class: "remove-holiday" },
                });
                /** @type {__VLS_StyleScopedClasses['remove-holiday']} */ ;
                // @ts-ignore
                [];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.addHoliday) },
                ...{ class: "add-holiday" },
            });
            /** @type {__VLS_StyleScopedClasses['add-holiday']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.attendanceRules.fieldWorkRules.consideredPresent),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
            });
            (__VLS_ctx.attendanceRules.fieldWorkRules.defaultHours);
        }
    }
    if (__VLS_ctx.activeTab === 'tax') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "settings-card" },
        });
        /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveTaxRules) },
            ...{ class: "btn-save" },
            disabled: (__VLS_ctx.savingTaxRules),
        });
        /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "sub-tabs" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-tabs']} */ ;
        for (const [subTab] of __VLS_vFor((__VLS_ctx.taxSubTabs))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'tax'))
                            return;
                        __VLS_ctx.taxSubTab = subTab.id;
                        // @ts-ignore
                        [activeTab, attendanceRules, attendanceRules, addHoliday, saveTaxRules, savingTaxRules, taxSubTabs, taxSubTab,];
                    } },
                key: (subTab.id),
                ...{ class: ({ active: __VLS_ctx.taxSubTab === subTab.id }) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            (subTab.name);
            // @ts-ignore
            [taxSubTab,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rules-container" },
        });
        /** @type {__VLS_StyleScopedClasses['rules-container']} */ ;
        if (__VLS_ctx.taxSubTab === 'brackets') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tax-info-card" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-info-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.employmentTax?.calculationFormula || 'Tax = (Income × Rate ÷ 100) - Deduction');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.employmentTax?.roundingMethod || 'floor');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.effectiveFrom || '2024-01-01');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.version || '1.0');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "table-responsive" },
            });
            /** @type {__VLS_StyleScopedClasses['table-responsive']} */ ;
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
            for (const [bracket, index] of __VLS_vFor((__VLS_ctx.taxRules.employmentTax?.brackets))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (index),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                    type: "number",
                    ...{ class: "tax-input" },
                    disabled: (index === 0),
                });
                (bracket.min);
                /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                    type: "number",
                    ...{ class: "tax-input" },
                    disabled: (bracket.max === null),
                });
                (bracket.max);
                /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                    type: "number",
                    ...{ class: "tax-input" },
                    step: "1",
                });
                (bracket.rate);
                /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                    type: "number",
                    ...{ class: "tax-input" },
                    step: "0.01",
                });
                (bracket.deduction);
                /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                    type: "text",
                    value: (bracket.description),
                    ...{ class: "tax-input" },
                });
                /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
                // @ts-ignore
                [taxSubTab, taxRules, taxRules, taxRules, taxRules, taxRules,];
            }
        }
        if (__VLS_ctx.taxSubTab === 'pension') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tax-info-card" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-info-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.legalReference?.pensionProclamation || 'No. 715/2011 as amended by No. 908/2015');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.pension.employeeRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.pension.employerRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.pension.monthlyCap);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
                disabled: true,
            });
            (__VLS_ctx.taxRules.pension.maxEmployeeContribution);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
                ...{ class: "field-hint" },
            });
            /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
            (__VLS_ctx.taxRules.pension.monthlyCap);
            (__VLS_ctx.taxRules.pension.employeeRate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
                disabled: true,
            });
            (__VLS_ctx.taxRules.pension.maxEmployerContribution);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
                ...{ class: "field-hint" },
            });
            /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
            (__VLS_ctx.taxRules.pension.monthlyCap);
            (__VLS_ctx.taxRules.pension.employerRate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.pension.calculationBase),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "basic_salary_only",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "gross_salary",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "info-note" },
            });
            /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.pension.notes);
        }
        if (__VLS_ctx.taxSubTab === 'exemptions') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.exemptions.transportAllowance.isExempt),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.exemptions.transportAllowance.maxExemptAmount);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.taxRules.exemptions.transportAllowance.alternativeLimit),
                ...{ class: "tax-input" },
                disabled: true,
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.taxRules.exemptions.transportAllowance.calculationMethod),
                ...{ class: "tax-input" },
                disabled: true,
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.exemptions.medicalReimbursement.isExempt),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.exemptions.hardshipAllowance.isExempt),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-subsection" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-subsection']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.exemptions.travelReimbursement.isExempt),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
        }
        if (__VLS_ctx.taxSubTab === 'withholding') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.withholdingTax.standardRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.withholdingTax.goodsThreshold);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.withholdingTax.servicesThreshold);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.withholdingTax.noTinRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "checkbox-group" },
            });
            /** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
            for (const [type] of __VLS_vFor((['service_fees', 'dividends', 'royalties', 'interest']))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    key: (type),
                    ...{ class: "checkbox-label" },
                });
                /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    value: (type),
                });
                (__VLS_ctx.taxRules.withholdingTax.appliesTo);
                (type.replace('_', ' ').toUpperCase());
                // @ts-ignore
                [taxSubTab, taxSubTab, taxSubTab, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.vat.registrationThreshold);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.vat.standardRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.turnoverTax.goodsRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                step: "0.5",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.turnoverTax.servicesOthersRate);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
        }
        if (__VLS_ctx.taxSubTab === 'residency') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.taxResidency.daysThreshold);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.taxRules.taxResidency.permanentResidenceCriteria),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "info-note" },
            });
            /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.taxRules.taxResidency.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                min: "1",
                max: "28",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.deadlines.taxRemittanceDay);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "number",
                min: "1",
                max: "28",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.deadlines.pensionRemittanceDay);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
        }
        if (__VLS_ctx.taxSubTab === 'legal') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-section" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.taxRules.legalReference.incomeTaxProclamation),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item full-width" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.taxRules.legalReference.pensionProclamation),
                ...{ class: "tax-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.taxRules.version),
                ...{ class: "tax-input" },
                disabled: true,
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "date",
                ...{ class: "tax-input" },
            });
            (__VLS_ctx.taxRules.effectiveFrom);
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rule-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
                type: "text",
                value: (__VLS_ctx.formatDate(__VLS_ctx.taxRules.lastUpdated)),
                ...{ class: "tax-input" },
                disabled: true,
            });
            /** @type {__VLS_StyleScopedClasses['tax-input']} */ ;
        }
    }
}
if (__VLS_ctx.showDepartmentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingDepartment ? 'Edit Department' : 'Add Department');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
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
        type: "text",
        value: (__VLS_ctx.departmentForm.code),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.departmentForm.name),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.departmentForm.description),
        rows: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.departmentForm.managerId),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [emp] of __VLS_vFor((__VLS_ctx.employees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (emp.id),
            value: (emp.id),
        });
        (emp.fullName || emp.name);
        // @ts-ignore
        [taxSubTab, taxSubTab, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, taxRules, formatDate, showDepartmentModal, closeDepartmentModal, closeDepartmentModal, editingDepartment, departmentForm, departmentForm, departmentForm, departmentForm, employees,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.departmentForm.isActive),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (true),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (false),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveDepartment) },
        ...{ class: "btn-save" },
        disabled: (__VLS_ctx.savingDepartment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
}
if (__VLS_ctx.showPositionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePositionModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingPosition ? 'Edit Position' : 'Add Position');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePositionModal) },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
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
        type: "text",
        value: (__VLS_ctx.positionForm.code),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.positionForm.title),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.positionForm.departmentId),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [departments, closeDepartmentModal, departmentForm, saveDepartment, savingDepartment, showPositionModal, closePositionModal, closePositionModal, editingPosition, positionForm, positionForm, positionForm,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.positionForm.level),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.positionForm.isActive),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (true),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (false),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePositionModal) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.savePosition) },
        ...{ class: "btn-save" },
        disabled: (__VLS_ctx.savingPosition),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
}
if (__VLS_ctx.showRoleModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeRoleModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingRole ? 'Edit Role' : 'Add Role');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRoleModal) },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
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
        type: "text",
        value: (__VLS_ctx.roleForm.name),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.roleForm.description),
        rows: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.roleForm.isActive),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (true),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (false),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRoleModal) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveRole) },
        ...{ class: "btn-save" },
        disabled: (__VLS_ctx.savingRole),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
}
if (__VLS_ctx.showDeleteModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal delete-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "delete-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "16",
        x2: "12.01",
        y2: "16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteItem?.name || __VLS_ctx.deleteItem?.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.executeDelete) },
        ...{ class: "btn-delete" },
        disabled: (__VLS_ctx.deleting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toast-container" },
});
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
for (const [toast] of __VLS_vFor((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (toast.id),
        ...{ class: (['toast', toast.type]) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    (toast.message);
    // @ts-ignore
    [closePositionModal, positionForm, positionForm, savePosition, savingPosition, showRoleModal, closeRoleModal, closeRoleModal, closeRoleModal, editingRole, roleForm, roleForm, roleForm, saveRole, savingRole, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, deleteItem, deleteItem, executeDelete, deleting, toasts,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
