// services/settingService.ts
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
class SettingService {
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }
    // ==================== ROLES API ====================
    async getRoles(page = 1, limit = 20, includeInactive = false) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/roles?page=${page}&limit=${limit}&includeInactive=${includeInactive}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch roles' };
        }
    }
    async getRoleById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/roles/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch role' };
        }
    }
    async createRole(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/roles`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to create role' };
        }
    }
    async updateRole(id, data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/roles/${id}`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to update role' };
        }
    }
    async toggleRoleStatus(id, isActive) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/settings/roles/${id}/status`, { isActive }, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to toggle role status' };
        }
    }
    async deleteRole(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/settings/roles/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to delete role' };
        }
    }
    // ==================== DEPARTMENTS API ====================
    async getDepartments(page = 1, limit = 20, includeInactive = false) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/departments?page=${page}&limit=${limit}&includeInactive=${includeInactive}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch departments' };
        }
    }
    async getAllDepartments() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/departments/all`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch all departments' };
        }
    }
    async getDepartmentById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/departments/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch department' };
        }
    }
    async getDepartmentTree() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/departments/tree`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch department tree' };
        }
    }
    async getDepartmentStatistics() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/departments/stats`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch department statistics' };
        }
    }
    async createDepartment(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/departments`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to create department' };
        }
    }
    async updateDepartment(id, data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/departments/${id}`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to update department' };
        }
    }
    async toggleDepartmentStatus(id, isActive) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/settings/departments/${id}/status`, { isActive }, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to toggle department status' };
        }
    }
    async deleteDepartment(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/settings/departments/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to delete department' };
        }
    }
    // ==================== POSITIONS API ====================
    async getPositions(page = 1, limit = 20, includeInactive = false, departmentId) {
        try {
            let url = `${API_BASE_URL}/settings/positions?page=${page}&limit=${limit}&includeInactive=${includeInactive}`;
            if (departmentId)
                url += `&departmentId=${departmentId}`;
            const response = await axios.get(url, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch positions' };
        }
    }
    async getAllPositions() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/positions/all`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch all positions' };
        }
    }
    async getPositionById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/positions/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch position' };
        }
    }
    async createPosition(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/positions`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to create position' };
        }
    }
    async updatePosition(id, data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/positions/${id}`, data, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to update position' };
        }
    }
    async togglePositionStatus(id, isActive) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/settings/positions/${id}/status`, { isActive }, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to toggle position status' };
        }
    }
    async deletePosition(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/settings/positions/${id}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to delete position' };
        }
    }
    // ==================== SYSTEM SETTINGS API ====================
    async getAllSettings() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/settings`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch settings' };
        }
    }
    async getSettingByKey(key) {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/settings/${key}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch setting' };
        }
    }
    async upsertSetting(key, value, category, description, dataType) {
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/settings`, {
                key,
                value,
                category,
                description,
                dataType
            }, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to save setting' };
        }
    }
    async batchUpdateSettings(settings) {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/settings/batch`, { settings }, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to batch update settings' };
        }
    }
    async deleteSetting(key) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/settings/settings/${key}`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to delete setting' };
        }
    }
    // ==================== ATTENDANCE RULES API ====================
    async getAttendanceRules() {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/attendance/rules`, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to fetch attendance rules' };
        }
    }
    async updateAttendanceRules(rules) {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/attendance/rules`, rules, this.getAuthHeaders());
            return response.data;
        }
        catch (error) {
            throw error.response?.data || { success: false, error: 'Failed to update attendance rules' };
        }
    }
    // ==================== UTILITY METHODS ====================
    // Get default attendance rules
    getDefaultAttendanceRules() {
        return {
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
                eligiblePositions: []
            },
            leaveRules: {
                annual: 20,
                sick: 10,
                maternity: 90,
                paternity: 10,
                bereavement: 5,
                unpaid: true,
                maxConsecutive: 30,
                noticeDays: 3,
                carryover: true,
                maxCarryover: 30
            },
            holidayRules: {
                holidays: [
                    { date: '2026-01-01', name: 'New Year', type: 'public' },
                    { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
                    { date: '2026-01-19', name: 'Timkat', type: 'religious' },
                    { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
                    { date: '2026-04-18', name: 'Good Friday', type: 'religious' },
                    { date: '2026-04-20', name: 'Easter Monday', type: 'religious' },
                    { date: '2026-05-01', name: 'Labour Day', type: 'public' },
                    { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
                    { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
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
            },
            remoteWorkRules: {
                allowed: true,
                maxDaysPerWeek: 2,
                approvalRequired: true,
                eligiblePositions: []
            },
            notificationRules: {
                sendLateAlert: true,
                lateAlertMinutes: 30,
                sendAbsentAlert: true,
                absentAlertHour: 10,
                notifyManagers: true
            },
            reportRules: {
                autoGenerateWeekly: true,
                autoGenerateMonthly: true,
                weeklyReportDay: 'friday',
                monthlyReportDay: 25
            }
        };
    }
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-ET', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
export default new SettingService();
