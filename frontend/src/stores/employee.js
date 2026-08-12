// stores/employee.ts
import api from './interceptor';
// ============================================================================
// EMPLOYEE SERVICE
// ============================================================================
class EmployeesService {
    // ============================================================================
    // EMPLOYEE CRUD
    // ============================================================================
    // ============================================================================
    // GENERIC DOCUMENT UPLOAD (NEW - Handles all document types)
    // ============================================================================
    /**
     * Generic document upload for all document types
     * Supports: spouse_profile, marriage_certificate, child_birth_certificate,
     *           child_medical_report, child_adoption_certificate, child_profile,
     *           education_certificate, training_certificate, experience_letter,
     *           guarantee_letter, sdt_letter, parent_support_document,
     *           naturalization_certificate, national_id
     */
    async uploadEmployeeDocument(id, file, documentType, options) {
        try {
            const formData = new FormData();
            formData.append('file', file); // Field name must be 'file'
            // ✅ REMOVE: documentType is now in URL, not in body
            // formData.append('documentType', documentType)
            if (options?.subType)
                formData.append('subType', options.subType);
            if (options?.index !== undefined)
                formData.append('index', options.index.toString());
            if (options?.description)
                formData.append('description', options.description);
            // ✅ PUT DOCUMENT TYPE IN THE URL
            const response = await api.post(`/employees/${id}/documents/upload/${documentType}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Upload document error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to upload document'
            };
        }
    }
    // ============================================================================
    // TERMINATION HISTORY METHODS
    // ============================================================================
    /**
     * Get termination history for an employee
     */
    async getTerminationHistory(employeeId) {
        try {
            const response = await api.get(`/employees/${employeeId}/termination-history`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get termination history error:', error);
            return {
                success: false,
                data: {
                    history: [],
                    summary: {
                        totalTerminations: 0,
                        currentStatus: 'active',
                        lastTermination: null
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch termination history'
            };
        }
    }
    /**
     * Get all documents for an employee (detailed list, not grouped)
     */
    async getEmployeeDocuments(id) {
        try {
            const response = await api.get(`/employees/${id}/documents/list`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employee documents error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch documents'
            };
        }
    }
    /**
     * Get all employees with pagination and filters
     */
    async getEmployees(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.sortBy)
                queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder)
                queryParams.append('sortOrder', params.sortOrder);
            if (params.search)
                queryParams.append('search', params.search);
            if (params.searchFields)
                queryParams.append('searchFields', params.searchFields);
            if (params.departmentId && params.departmentId !== 'all')
                queryParams.append('departmentId', params.departmentId.toString());
            if (params.employmentStatus && params.employmentStatus !== 'all')
                queryParams.append('employmentStatus', params.employmentStatus);
            if (params.employmentType && params.employmentType !== 'all')
                queryParams.append('employmentType', params.employmentType);
            if (params.positionId && params.positionId !== 'all')
                queryParams.append('positionId', params.positionId.toString());
            const url = `/employees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await api.get(url);
            return {
                success: true,
                data: response.data.data || [],
                pagination: response.data.pagination || {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                    nextPage: null,
                    prevPage: null,
                    startOffset: 0,
                    endOffset: 0
                },
                filters: response.data.filters || {},
                sorting: response.data.sorting || { field: '', order: '' }
            };
        }
        catch (error) {
            console.error('Get employees error:', error);
            return {
                success: false,
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                    nextPage: null,
                    prevPage: null,
                    startOffset: 0,
                    endOffset: 0
                },
                filters: {},
                sorting: { field: '', order: '' }
            };
        }
    }
    /**
     * Get employee by ID
     */
    /**
    * Get employee by ID (with all JSONB fields)
    */
    async getEmployeeById(id) {
        try {
            const response = await api.get(`/employees/${id}`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employee'
            };
        }
    }
    /**
     * Create new employee (WITH ALLOWANCES & ETHIOPIAN CALENDAR)
     */
    async createEmployee(employeeData) {
        try {
            const payload = {
                // Basic Info
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                middleName: employeeData.middleName,
                fullNameEnglish: employeeData.fullNameEnglish,
                email: employeeData.email,
                personalEmail: employeeData.personalEmail,
                phone: employeeData.phone,
                dob: employeeData.dob,
                gender: employeeData.gender,
                maritalStatus: employeeData.maritalStatus,
                nationality: employeeData.nationality,
                nationalId: employeeData.nationalId,
                // ========== ETHIOPIAN CALENDAR DATES (ADD THESE) ==========
                hireDateEC: employeeData.hireDateEC,
                dateOfBirthEC: employeeData.dateOfBirthEC,
                confirmationDateEC: employeeData.confirmationDateEC,
                terminationDateEC: employeeData.terminationDateEC,
                // Employment
                departmentId: employeeData.departmentId,
                positionId: employeeData.positionId,
                managerId: employeeData.managerId,
                employmentType: employeeData.employmentType,
                hireDate: employeeData.hireDate,
                workLocation: employeeData.workLocation,
                // Salary & Allowances
                salary: employeeData.basicSalary || employeeData.salary,
                basicSalary: employeeData.basicSalary || employeeData.salary,
                housingAllowance: employeeData.housingAllowance || 0,
                positionAllowance: employeeData.positionAllowance || 0,
                transportAllowance: employeeData.transportAllowance || 0,
                mobileAllowance: employeeData.mobileAllowance || 0,
                // Address
                address: employeeData.address,
                // JSONB Fields
                currentCompany: employeeData.currentCompany,
                birthPlace: employeeData.birthPlace,
                currentAddress: employeeData.currentAddress,
                permanentAddress: employeeData.permanentAddress,
                mothersFullName: employeeData.mothersFullName,
                spouseInfo: employeeData.spouseInfo,
                children: employeeData.children,
                parentsInfo: employeeData.parentsInfo,
                parentSupport: employeeData.parentSupport,
                workExperience: employeeData.workExperience,
                education: employeeData.education,
                training: employeeData.training,
                languageSkills: employeeData.languageSkills,
                otherSkills: employeeData.otherSkills,
                nationalityAcquisition: employeeData.nationalityAcquisition,
                healthInfo: employeeData.healthInfo,
                legalInfo: employeeData.legalInfo,
                guaranteeInfo: employeeData.guaranteeInfo,
                emergencyContactAddress: employeeData.emergencyContactAddress,
                nationalIdDocument: employeeData.nationalIdDocument,
                // Stringified fields
                emergencyContact: employeeData.emergencyContact,
                bankAccount: employeeData.bankAccount
            };
            console.log('📤 API Service - Sending payload:', {
                hireDateEC: payload.hireDateEC,
                dateOfBirthEC: payload.dateOfBirthEC,
                firstName: payload.firstName,
                lastName: payload.lastName
            });
            const response = await api.post('/employees', payload);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Create employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create employee'
            };
        }
    }
    /**
     * Update employee (WITH ALLOWANCES)
     */
    async updateEmployee(id, employeeData) {
        try {
            const payload = {
                // Basic Info
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                middleName: employeeData.middleName,
                fullNameEnglish: employeeData.fullNameEnglish,
                email: employeeData.email,
                personalEmail: employeeData.personalEmail,
                phone: employeeData.phone,
                dob: employeeData.dob,
                gender: employeeData.gender,
                maritalStatus: employeeData.maritalStatus,
                nationality: employeeData.nationality,
                nationalId: employeeData.nationalId,
                // ========== ETHIOPIAN CALENDAR DATES (ADD THESE) ==========
                hireDateEC: employeeData.hireDateEC,
                dateOfBirthEC: employeeData.dateOfBirthEC,
                confirmationDateEC: employeeData.confirmationDateEC,
                terminationDateEC: employeeData.terminationDateEC,
                // Employment
                departmentId: employeeData.departmentId,
                positionId: employeeData.positionId,
                managerId: employeeData.managerId,
                employmentType: employeeData.employmentType,
                status: employeeData.status,
                hireDate: employeeData.hireDate,
                confirmationDate: employeeData.confirmationDate,
                terminationDate: employeeData.terminationDate,
                workLocation: employeeData.workLocation,
                // Salary & Allowances
                basicSalary: employeeData.basicSalary || employeeData.salary,
                housingAllowance: employeeData.housingAllowance || 0,
                positionAllowance: employeeData.positionAllowance || 0,
                transportAllowance: employeeData.transportAllowance || 0,
                mobileAllowance: employeeData.mobileAllowance || 0,
                // Addresses
                address: employeeData.address,
                permanentAddress: employeeData.permanentAddress,
                // JSONB Fields
                currentCompany: employeeData.currentCompany,
                birthPlace: employeeData.birthPlace,
                currentAddress: employeeData.currentAddress,
                mothersFullName: employeeData.mothersFullName,
                spouseInfo: employeeData.spouseInfo,
                children: employeeData.children,
                parentsInfo: employeeData.parentsInfo,
                parentSupport: employeeData.parentSupport,
                workExperience: employeeData.workExperience,
                education: employeeData.education,
                training: employeeData.training,
                languageSkills: employeeData.languageSkills,
                otherSkills: employeeData.otherSkills,
                nationalityAcquisition: employeeData.nationalityAcquisition,
                healthInfo: employeeData.healthInfo,
                legalInfo: employeeData.legalInfo,
                guaranteeInfo: employeeData.guaranteeInfo,
                emergencyContactAddress: employeeData.emergencyContactAddress,
                nationalIdDocument: employeeData.nationalIdDocument,
                // Stringified fields
                bankAccount: employeeData.bankAccount,
                emergencyContact: employeeData.emergencyContact
            };
            const response = await api.put(`/employees/${id}`, payload);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Update employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update employee'
            };
        }
    }
    // ============================================================================
    // DOCUMENT COMPLIANCE SUMMARY (NEW)
    // ============================================================================
    async getComplianceSummary(params) {
        try {
            const response = await api.get('/employees/stats/compliance/summary', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get compliance summary error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch compliance summary'
            };
        }
    }
    // In employeeService.js
    async getEmployeesWithoutNationalId(params) {
        try {
            const response = await api.get('/employees/without-national-id', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employees without national ID error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employees without national ID'
            };
        }
    }
    // ============================================================================
    // GET EMPLOYEES MISSING DEGREE
    // ============================================================================
    async getDegreeMissing(params) {
        try {
            const response = await api.get('/employees/degree-missing', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employees missing degree error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employees missing degree'
            };
        }
    }
    // ============================================================================
    // GET EMPLOYEES BY GUARANTEE STATUS
    // ============================================================================
    async getGuaranteeStatus(params) {
        try {
            const response = await api.get('/employees/guarantee-status', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get guarantee status error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch guarantee status'
            };
        }
    }
    // In employee.ts
    /**
     * Get guarantee age distribution
     */
    getGuaranteeAgeDistribution(params = {}) {
        return api.get('/employees/guarantee-age-distribution', {
            params: {
                departmentId: params.departmentId || 'all',
                search: params.search || '',
                includeDetails: params.includeDetails ? 'true' : 'false'
            }
        });
    }
    /**
     * Get guarantee age details with employee list
     */
    getGuaranteeAgeDetails(params = {}) {
        return api.get('/employees/guarantee-age-details', {
            params: {
                departmentId: params.departmentId || 'all',
                search: params.search || '',
                ageRange: params.ageRange || 'all',
                includeDetails: params.includeDetails ? 'true' : 'false',
                page: params.page || 1,
                limit: params.limit || 10
            }
        });
    }
    // ============================================================================
    // TERMINATE & REACTIVATE EMPLOYEE - NO REASON
    // ============================================================================
    /**
     * Terminate an employee
     * Sets status to 'terminated', adds termination dates, and sets isActive to false
     */
    async terminateEmployee(id) {
        try {
            const response = await api.post(`/employees/${id}/terminate`);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Terminate employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to terminate employee'
            };
        }
    }
    /**
     * Reactivate a terminated employee
     * Sets status to 'active', clears termination dates, and sets isActive to true
     */
    async reactivateEmployee(id) {
        try {
            const response = await api.post(`/employees/${id}/reactivate`);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Reactivate employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reactivate employee'
            };
        }
    }
    /**
     * Delete employee (soft delete - terminate)
     */
    async deleteEmployee(id) {
        try {
            const response = await api.delete(`/employees/${id}`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Delete employee error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete employee'
            };
        }
    }
    // In employee.ts - Add this method after deleteEmployee
    // ============================================================================
    // BULK IMPORT
    // ============================================================================
    /**
    * Import employees in bulk (WITH ALLOWANCES)
    * Supports allowance fields: housingAllowance, positionAllowance, transportAllowance
    * If allowances not provided, they are auto-calculated as 20%, 15%, 10% of basic salary
    */
    async importEmployees(employees) {
        try {
            const formattedEmployees = employees.map(emp => ({
                ...emp,
                housingAllowance: emp.housingAllowance,
                positionAllowance: emp.positionAllowance,
                transportAllowance: emp.transportAllowance,
                mobileAllowance: emp.mobileAllowance
            }));
            const response = await api.post('/employees/import', { employees: formattedEmployees });
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Import employees error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to import employees'
            };
        }
    }
    // 👇 ADD THIS NEW METHOD TO SUPPORT EXCEL UPLOAD
    /**
     * Import employees from an Excel (.xlsx) file
     * The backend parses the file and returns results
     */
    async importEmployeesFromExcel(formData) {
        try {
            const response = await api.post('/employees/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Excel import error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to import employees'
            };
        }
    }
    // 👆 END OF NEW METHOD
    // ============================================================================
    // SEPARATE ANALYTICS STATS METHODS
    // ============================================================================
    /**
     * 1. Get KPI Stats (Total, Active, On Leave, Compliance Rate)
     */
    async getKpiStats(params) {
        try {
            const response = await api.get('/employees/stats/kpi', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get KPI stats error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch KPI stats'
            };
        }
    }
    /**
     * 2. Get Hiring Trends
     */
    // In employee.ts
    async getHiringTrends(params) {
        try {
            const response = await api.get('/employees/stats/hiring-trends', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get hiring trends error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch hiring trends'
            };
        }
    }
    /**
     * 3. Get Department Distribution
     */
    async getDepartmentDistribution() {
        try {
            const response = await api.get('/employees/stats/departments');
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get department distribution error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch department distribution'
            };
        }
    }
    /**
     * 4. Get Employment Type Distribution
     */
    async getEmploymentTypeDistribution() {
        try {
            const response = await api.get('/employees/stats/employment-types');
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employment type distribution error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employment type distribution'
            };
        }
    }
    /**
     * 5. Get Recent Hires
     */
    async getRecentHires(params) {
        try {
            const response = await api.get('/employees/stats/recent-hires', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get recent hires error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch recent hires'
            };
        }
    }
    /**
     * 6. Get Salary Analysis
     */
    async getSalaryAnalysis(params) {
        try {
            const response = await api.get('/employees/stats/salary', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get salary analysis error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch salary analysis'
            };
        }
    }
    /**
     * Get Department Distribution with pagination (FOR MODALS)
     */
    async getDepartmentDistributionPaginated(params) {
        try {
            const response = await api.get('/employees/stats/departments', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get department distribution paginated error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch department distribution'
            };
        }
    }
    /**
     * Get Employment Type Distribution with pagination (FOR MODALS)
     */
    async getEmploymentTypeDistributionPaginated(params) {
        try {
            const response = await api.get('/employees/stats/employment-types', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employment type distribution paginated error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employment type distribution'
            };
        }
    }
    /**
     * Get Salary Analysis with pagination (FOR MODALS)
     */
    async getSalaryAnalysisPaginated(params) {
        try {
            const response = await api.get('/employees/stats/salary', { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get salary analysis paginated error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch salary analysis'
            };
        }
    }
    // Add this method to your EmployeesService class (around line 400-450)
    /**
     * Get Department Employees (alias for getDepartmentDistributionPaginated)
     * Used in department modal
     */
    /**
     * Get department employees (lazy loading - only when expanded)
     */
    async getDepartmentEmployees(params) {
        try {
            const response = await api.get(`/employees/departments/${params.departmentId}/employees`, {
                params: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                    search: params.search || ''
                }
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get department employees error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch department employees'
            };
        }
    }
    // In employee.ts
    /**
     * Get employment type employees (lazy loading - only when expanded)
     */
    async getTypeEmployees(params) {
        try {
            const response = await api.get(`/employees/employment-types/${params.type}/employees`, {
                params: {
                    search: params.search || '',
                    departmentId: params.departmentId || 'all'
                }
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get type employees error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch type employees'
            };
        }
    }
    // ============================================================================
    // PROFILE PICTURE
    // ============================================================================
    /**
     * Upload profile picture
     */
    async uploadProfilePicture(id, file) {
        console.log('uploadProfilePicture called with:', { id, file });
        console.log('File type:', file?.type);
        console.log('File size:', file?.size);
        console.log('File name:', file?.name);
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);
            const response = await api.post(`/employees/${id}/profile-picture`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return {
                success: true,
                message: response.data.message,
                profilePicture: response.data.data?.profilePicture,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Upload profile picture error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to upload profile picture'
            };
        }
    }
    /**
     * Delete profile picture
     */
    async deleteProfilePicture(id) {
        try {
            const response = await api.delete(`/employees/${id}/profile-picture`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Delete profile picture error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete profile picture'
            };
        }
    }
    /**
     * Get all documents grouped by type
     */
    async getDocuments(id) {
        try {
            const response = await api.get(`/employees/${id}/documents`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get documents error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch documents'
            };
        }
    }
    /**
     * Delete a document
     */
    async deleteDocument(id, documentId) {
        try {
            const response = await api.delete(`/employees/${id}/documents/${documentId}`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Delete document error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete document'
            };
        }
    }
    // ============================================================================
    // DEPARTMENT & POSITION
    // ============================================================================
    /**
     * Get all departments
     */
    async getDepartments() {
        try {
            const response = await api.get('users/departments');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get departments error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch departments'
            };
        }
    }
    /**
     * Get all positions
     */
    async getPositions() {
        try {
            const response = await api.get('users/positions');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get positions error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch positions'
            };
        }
    }
    // ==================== COMPENSATION HISTORY METHODS ====================
    /**
     * Get compensation history for a specific employee
     */
    async getEmployeeCompensationHistory(employeeId, params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit)
                queryParams.append('limit', params.limit.toString());
            if (params?.offset)
                queryParams.append('offset', params.offset.toString());
            // ✅ FIX: Match the backend route exactly
            const response = await api.get(`/employees/compensation/employee/${employeeId}?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get employee compensation history error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch employee compensation history'
            };
        }
    }
    // ============================================================================
    // HIRING DETAILS
    // ============================================================================
    /**
     * Get hiring details (hired & terminated employees)
     */
    async getHiringDetails(params) {
        try {
            // Build query parameters
            const queryParams = {};
            if (params?.departmentId && params.departmentId !== 'all' && params.departmentId !== 'null') {
                queryParams.departmentId = params.departmentId;
            }
            if (params?.months && params.months !== 'all' && params.months !== 'null') {
                queryParams.months = params.months;
            }
            const response = await api.get('/employees/stats/hiring-details', { params: queryParams });
            // Return in the same format as other methods
            return {
                success: true,
                data: response.data.data // This should contain { hired: [], terminated: [], summary: {} }
            };
        }
        catch (error) {
            console.error('Get hiring details error:', error);
            return {
                success: false,
                data: {
                    hired: [],
                    terminated: [],
                    summary: { totalHired: 0, totalTerminated: 0, netGrowth: 0 }
                },
                error: error.response?.data?.error || 'Failed to fetch hiring details'
            };
        }
    }
    // ============================================================================
    // DEPARTMENT TRANSFER METHODS
    // ============================================================================
    async getEmployeeDepartmentTransfers(employeeId, params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.status && params.status !== 'all') {
                queryParams.append('status', params.status);
            }
            if (params?.page)
                queryParams.append('page', params.page.toString());
            if (params?.limit)
                queryParams.append('limit', params.limit.toString());
            const url = `/employees/department-transfers/employee/${employeeId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await api.get(url);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employee department transfers error:', error);
            return {
                success: false,
                data: null,
                error: error.response?.data?.error || 'Failed to fetch employee transfers'
            };
        }
    }
    /**
     * Create a new department transfer
     * POST /api/employees/department-transfers
     * This saves the transfer record AND updates the employee's department
     */
    async createDepartmentTransfer(params) {
        try {
            // ✅ Updated URL: /employees/department-transfers
            const response = await api.post('/employees/department-transfers', {
                employeeId: params.employeeId,
                fromDepartmentId: params.fromDepartmentId,
                toDepartmentId: params.toDepartmentId,
                transferDateEC: params.transferDateEC,
                reason: params.reason,
                approvedBy: params.approvedBy,
                notes: params.notes
            });
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Create department transfer error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create department transfer'
            };
        }
    }
    /**
     * Update transfer status (reverse or complete)
     * PUT /api/employees/department-transfers/:transferId/status
     * If status is 'reversed', the employee's department is reverted back
     */
    async updateTransferStatus(transferId, params) {
        try {
            // ✅ Updated URL: /employees/department-transfers/${transferId}/status
            const response = await api.put(`/employees/department-transfers/${transferId}/status`, {
                status: params.status,
                notes: params.notes
            });
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Update transfer status error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update transfer status'
            };
        }
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Get employee display name
     */
    getDisplayName(employee) {
        if (!employee)
            return 'Employee';
        return employee.fullName || `${employee.firstName} ${employee.lastName}`;
    }
    /**
     * Get employment type label
     */
    getEmploymentTypeLabel(type) {
        const labels = {
            'full-time': 'Full Time',
            'part-time': 'Part Time',
            'contract': 'Contract',
            'intern': 'Intern'
        };
        return labels[type] || type;
    }
    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labels = {
            'active': 'Active',
            'on-leave': 'On Leave',
            'terminated': 'Terminated'
        };
        return labels[status] || status;
    }
    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'active': 'success',
            'on-leave': 'warning',
            'terminated': 'error'
        };
        return colors[status] || 'default';
    }
    /**
     * Format date
     */
    formatDate(date) {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Get avatar URL
     */
    getAvatarUrl(name) {
        return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&name=${encodeURIComponent(name)}`;
    }
    /**
     * Get document type label
     */
    getDocumentTypeLabel(type) {
        const labels = {
            'guarantee_letter': 'Guarantee Letter',
            'id_card': 'ID Card',
            'cv': 'CV/Resume',
            'degree': 'Degree/Certificate'
        };
        return labels[type] || type;
    }
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    /**
     * Get urgency level color for old guarantees
     */
    getUrgencyColor(urgencyLevel) {
        const colors = {
            'critical': 'error',
            'warning': 'warning',
            'attention': 'info',
            'ok': 'success'
        };
        return colors[urgencyLevel] || 'default';
    }
    /**
     * Get urgency level label
     */
    getUrgencyLabel(urgencyLevel) {
        const labels = {
            'critical': 'Critical - Over 12 months',
            'warning': 'Warning - Over 9 months',
            'attention': 'Attention - Over 6 months',
            'ok': 'OK - Less than 6 months'
        };
        return labels[urgencyLevel] || urgencyLevel;
    }
}
export default new EmployeesService();
