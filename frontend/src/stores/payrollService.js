// stores/payrollService.ts
import api from './interceptor';
class PayrollService {
    async getPayrollData(params) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('year', params.year.toString());
            queryParams.append('month', params.month.toString());
            if (params.department && params.department !== 'all') {
                queryParams.append('department', params.department);
            }
            if (params.search) {
                queryParams.append('search', params.search);
            }
            const response = await api.get(`/payroll?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get payroll data error:', error);
            return {
                success: false,
                data: [],
                totals: {
                    totalGrossPay: 0,
                    totalTax: 0,
                    totalPension7: 0,
                    totalPension11: 0,
                    totalNetPay: 0,
                    activeHolds: 0
                },
                count: 0,
                error: error.response?.data?.error || 'Failed to fetch payroll data'
            };
        }
    }
    async getStats() {
        try {
            const response = await api.get('/payroll/stats');
            return response.data;
        }
        catch (error) {
            console.error('Get stats error:', error);
            return {
                success: false,
                data: {
                    employees: 0,
                    grossPay: 0,
                    tax: 0,
                    pension7: 0,
                    pension11: 0,
                    activeHolds: 0
                },
                timestamp: new Date().toISOString(),
                error: error.response?.data?.error || 'Failed to fetch stats'
            };
        }
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }
    formatDate(date) {
        if (!date)
            return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime()))
            return 'N/A';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    formatMonth(monthStr) {
        if (!monthStr || typeof monthStr !== 'string')
            return 'N/A';
        if (!monthStr.includes('-'))
            return 'N/A';
        const parts = monthStr.split('-');
        if (parts.length !== 2)
            return 'N/A';
        const year = parts[0];
        const month = parts[1];
        if (!year || !month)
            return 'N/A';
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        if (isNaN(yearNum) || isNaN(monthNum))
            return 'N/A';
        if (monthNum < 1 || monthNum > 12)
            return 'N/A';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[monthNum - 1]} ${yearNum}`;
    }
    getAvailableMonths() {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            months.push(date.toISOString().slice(0, 7));
        }
        return months;
    }
    getPreviousMonth() {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 7);
    }
    getMonthEnd(monthStr) {
        if (!monthStr || !monthStr.includes('-'))
            return 'N/A';
        const [year, month] = monthStr.split('-');
        const yearNum = Number(year);
        const monthNum = Number(month);
        if (isNaN(yearNum) || isNaN(monthNum))
            return 'N/A';
        const lastDay = new Date(yearNum, monthNum, 0);
        const yyyy = lastDay.getFullYear();
        const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dd = String(lastDay.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    isMonthEnded(monthStr) {
        return new Date() >= new Date(this.getMonthEnd(monthStr));
    }
    async processPayroll(data) {
        try {
            const response = await api.post('/payroll/process', {
                month: data.month,
                paymentDate: data.paymentDate,
                unclaimedEmployeeCodes: data.unclaimedEmployeeCodes
            });
            return response.data;
        }
        catch (error) {
            console.error('Process payroll error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to process payroll'
            };
        }
    }
    async isMonthProcessed(monthYear) {
        try {
            const response = await api.get(`/payroll/processing/check/${monthYear}`);
            return response.data;
        }
        catch (error) {
            console.error('Check month processed error:', error);
            return { isProcessed: false };
        }
    }
    async getActiveEmployees() {
        try {
            const response = await api.get('/payroll/employees/active');
            return response.data;
        }
        catch (error) {
            console.error('Get active employees error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch employees'
            };
        }
    }
    async getPaymentHistory(filters) {
        try {
            const params = new URLSearchParams();
            if (filters?.month)
                params.append('month', filters.month);
            if (filters?.year)
                params.append('year', filters.year);
            if (filters?.department)
                params.append('department', filters.department);
            if (filters?.source)
                params.append('source', filters.source);
            const response = await api.get(`/payroll/payment-history?${params.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get payment history error:', error);
            return { success: false, data: [], error: error.response?.data?.error };
        }
    }
    // ==================== UNCLAIMED PAYROLL METHODS ====================
    async getUnclaimedPayroll(filters) {
        try {
            const params = new URLSearchParams();
            if (filters?.month)
                params.append('month', filters.month);
            if (filters?.year)
                params.append('year', filters.year);
            if (filters?.department && filters.department !== 'all')
                params.append('department', filters.department);
            if (filters?.search)
                params.append('search', filters.search);
            if (filters?.page)
                params.append('page', filters.page.toString());
            if (filters?.limit)
                params.append('limit', filters.limit.toString());
            const response = await api.get(`/payroll/unclaimed-payroll?${params.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get unclaimed payroll error:', error);
            return {
                success: false,
                data: [],
                pagination: { currentPage: 1, totalPages: 0, totalRecords: 0, recordsPerPage: 10 },
                summary: { totalUnclaimedAmount: 0, totalRecords: 0 },
                error: error.response?.data?.error || 'Failed to fetch unclaimed payroll'
            };
        }
    }
    async payUnclaimedSalary(unclaimedId, paymentData) {
        try {
            const response = await api.post(`/payroll/unclaimed-pay/${unclaimedId}`, paymentData);
            return response.data;
        }
        catch (error) {
            console.error('Pay unclaimed salary error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to process payment'
            };
        }
    }
    async bulkReturnUnclaimed(unclaimedIds, reason) {
        try {
            const response = await api.post('/payroll/unclaimed-bulk-return', {
                unclaimedIds,
                reason
            });
            return response.data;
        }
        catch (error) {
            console.error('Bulk return unclaimed error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to process bulk return'
            };
        }
    }
}
export default new PayrollService();
