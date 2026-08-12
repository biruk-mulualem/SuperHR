// stores/employeePenaltyService.ts
import api from './interceptor';
class EmployeePenaltyService {
    baseUrl = '/penalties';
    async getEmployeePenalties(employeeId, params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.month)
                queryParams.append('month', params.month);
            if (params?.status)
                queryParams.append('status', params.status);
            if (params?.limit)
                queryParams.append('limit', params.limit.toString());
            if (params?.offset)
                queryParams.append('offset', params.offset.toString());
            const response = await api.get(`/penalties/employees/${employeeId}/penalties?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get employee penalties error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch penalties'
            };
        }
    }
    async getCurrentMonthPenalties(employeeId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return this.getEmployeePenalties(employeeId, { month: currentMonth, status: 'active' });
    }
    async createPenalty(employeeId, data) {
        try {
            const response = await api.post(`/penalties/employees/${employeeId}/penalties`, data);
            return response.data;
        }
        catch (error) {
            console.error('Create penalty error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create penalty'
            };
        }
    }
    async deletePenalty(penaltyId) {
        try {
            const response = await api.delete(`/penalties/penalties/${penaltyId}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete penalty error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete penalty'
            };
        }
    }
    async reducePenalty(penaltyId, reductionValue, reductionReason) {
        try {
            const response = await api.put(`/penalties/penalties/${penaltyId}/reduce`, {
                reductionValue,
                reductionReason
            });
            return response.data;
        }
        catch (error) {
            console.error('Reduce penalty error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reduce penalty'
            };
        }
    }
    async bulkCreatePenalties(penalties) {
        try {
            const response = await api.post('/penalties/bulk', { penalties });
            return response.data;
        }
        catch (error) {
            console.error('Bulk create penalties error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create penalties'
            };
        }
    }
    async applyPenaltiesForPeriod(periodId, penaltyIds) {
        try {
            const response = await api.post(`/penalties/periods/${periodId}/apply`, { penaltyIds });
            return response.data;
        }
        catch (error) {
            console.error('Apply penalties error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to apply penalties'
            };
        }
    }
    // ==================== HELPER METHODS ====================
    getPenaltyTypeLabel(type) {
        const labels = {
            'Excessive Absenteeism': 'Excessive Absenteeism',
            'Chronic Lateness': 'Chronic Lateness',
            'Early Departure': 'Early Departure',
            'Unauthorized Leave': 'Unauthorized Leave',
            'Poor Performance': 'Poor Performance',
            'Missed Deadline': 'Missed Deadline',
            'Quality Issue': 'Quality Issue',
            'Target Shortfall': 'Target Shortfall',
            'Work Error': 'Work Error',
            'Negligence': 'Negligence',
            'Insubordination': 'Insubordination',
            'Workplace Conflict': 'Workplace Conflict',
            'Harassment': 'Harassment',
            'Policy Violation': 'Policy Violation',
            'Safety Violation': 'Safety Violation',
            'Confidentiality Breach': 'Confidentiality Breach',
            'Code of Conduct Violation': 'Code of Conduct Violation',
            'Equipment Damage': 'Equipment Damage',
            'Asset Loss': 'Asset Loss',
            'Property Damage': 'Property Damage',
            'Theft': 'Theft',
            'Fraud': 'Fraud',
            'Time Theft': 'Time Theft',
            'Breach of Trust': 'Breach of Trust',
            'Conflict of Interest': 'Conflict of Interest',
            'Social Media Misconduct': 'Social Media Misconduct',
            'Document Falsification': 'Document Falsification',
            'Written Warning': 'Written Warning',
            'Final Warning': 'Final Warning',
            'Suspension': 'Suspension',
            'Probation Violation': 'Probation Violation'
        };
        return labels[type] || type;
    }
    getStatusColor(status) {
        const colors = {
            'active': 'warning',
            'applied': 'success',
            'cancelled': 'error',
            'reduced': 'info'
        };
        return colors[status] || 'default';
    }
    getStatusLabel(status) {
        const labels = {
            'active': 'Active',
            'applied': 'Applied',
            'cancelled': 'Cancelled',
            'reduced': 'Reduced'
        };
        return labels[status] || status;
    }
    calculatePenaltyAmount(penalty, salary) {
        if (penalty.calculation_type === 'percent') {
            return Math.floor(salary * (penalty.value / 100));
        }
        return penalty.value;
    }
    getPenaltyTypes() {
        return [
            'Excessive Absenteeism',
            'Chronic Lateness',
            'Early Departure',
            'Unauthorized Leave',
            'Poor Performance',
            'Missed Deadline',
            'Quality Issue',
            'Target Shortfall',
            'Work Error',
            'Negligence',
            'Insubordination',
            'Workplace Conflict',
            'Harassment',
            'Policy Violation',
            'Safety Violation',
            'Confidentiality Breach',
            'Code of Conduct Violation',
            'Equipment Damage',
            'Asset Loss',
            'Property Damage',
            'Theft',
            'Fraud',
            'Time Theft',
            'Breach of Trust',
            'Conflict of Interest',
            'Social Media Misconduct',
            'Document Falsification',
            'Written Warning',
            'Final Warning',
            'Suspension',
            'Probation Violation'
        ];
    }
}
export default new EmployeePenaltyService();
