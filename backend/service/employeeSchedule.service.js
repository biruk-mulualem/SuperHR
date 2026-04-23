const { Op } = require('sequelize');
const { Employee, CompanyShiftDefault, EmployeeOverride, DepartmentOverride } = require('../models');

class EmployeeScheduleService {
    
    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':');
        return parseInt(hours) * 60 + parseInt(minutes);
    }
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    async getEffectiveCheckInTime(employeeId, date) {
        const formattedDate = date.toISOString().split('T')[0];
        
        const employeeOverride = await EmployeeOverride.findOne({
            where: {
                employeeId: employeeId,
                effectiveFrom: { [Op.lte]: formattedDate },
                [Op.or]: [
                    { effectiveTo: { [Op.gte]: formattedDate } },
                    { effectiveTo: null }
                ]
            },
            order: [['effectiveFrom', 'DESC']]
        });
        
        if (employeeOverride?.checkInTime) {
            return employeeOverride.checkInTime;
        }
        
        const employee = await Employee.findByPk(employeeId, {
            attributes: ['departmentId', 'shiftType']
        });
        
        if (employee?.departmentId) {
            const deptOverride = await DepartmentOverride.findOne({
                where: {
                    departmentId: employee.departmentId,
                    shiftType: employee.shiftType,
                    effectiveFrom: { [Op.lte]: formattedDate },
                    [Op.or]: [
                        { effectiveTo: { [Op.gte]: formattedDate } },
                        { effectiveTo: null }
                    ]
                },
                order: [['effectiveFrom', 'DESC']]
            });
            
            if (deptOverride?.checkInTime) {
                return deptOverride.checkInTime;
            }
        }
        
        const companyDefault = await CompanyShiftDefault.findOne({
            where: {
                shiftType: employee?.shiftType || 'day',
                effectiveFrom: { [Op.lte]: formattedDate },
                [Op.or]: [
                    { effectiveTo: { [Op.gte]: formattedDate } },
                    { effectiveTo: null }
                ],
                isActive: true
            },
            order: [['effectiveFrom', 'DESC']]
        });
        
        return companyDefault?.checkInTime || '09:00';
    }
    
    async getAbsentAfterMinutes(employeeId, date) {
        const formattedDate = date.toISOString().split('T')[0];
        
        const employeeOverride = await EmployeeOverride.findOne({
            where: {
                employeeId: employeeId,
                effectiveFrom: { [Op.lte]: formattedDate },
                [Op.or]: [
                    { effectiveTo: { [Op.gte]: formattedDate } },
                    { effectiveTo: null }
                ]
            },
            order: [['effectiveFrom', 'DESC']]
        });
        
        if (employeeOverride?.absentAfterMinutes) {
            return employeeOverride.absentAfterMinutes;
        }
        
        const employee = await Employee.findByPk(employeeId, {
            attributes: ['departmentId', 'shiftType']
        });
        
        if (employee?.departmentId) {
            const deptOverride = await DepartmentOverride.findOne({
                where: {
                    departmentId: employee.departmentId,
                    shiftType: employee.shiftType,
                    effectiveFrom: { [Op.lte]: formattedDate },
                    [Op.or]: [
                        { effectiveTo: { [Op.gte]: formattedDate } },
                        { effectiveTo: null }
                    ]
                },
                order: [['effectiveFrom', 'DESC']]
            });
            
            if (deptOverride?.absentAfterMinutes) {
                return deptOverride.absentAfterMinutes;
            }
        }
        
        const companyDefault = await CompanyShiftDefault.findOne({
            where: {
                shiftType: employee?.shiftType || 'day',
                effectiveFrom: { [Op.lte]: formattedDate },
                [Op.or]: [
                    { effectiveTo: { [Op.gte]: formattedDate } },
                    { effectiveTo: null }
                ],
                isActive: true
            },
            order: [['effectiveFrom', 'DESC']]
        });
        
        return companyDefault?.absentAfterMinutes || 60;
    }
    
    async getLunchStartTime(employeeId, date) {
        const formattedDate = date.toISOString().split('T')[0];
        
        const employee = await Employee.findByPk(employeeId, {
            attributes: ['departmentId', 'shiftType']
        });
        
        if (employee?.departmentId) {
            const deptOverride = await DepartmentOverride.findOne({
                where: {
                    departmentId: employee.departmentId,
                    shiftType: employee.shiftType,
                    effectiveFrom: { [Op.lte]: formattedDate },
                    [Op.or]: [
                        { effectiveTo: { [Op.gte]: formattedDate } },
                        { effectiveTo: null }
                    ]
                },
                order: [['effectiveFrom', 'DESC']]
            });
            
            if (deptOverride?.lunchStartTime) {
                return deptOverride.lunchStartTime;
            }
        }
        
        const companyDefault = await CompanyShiftDefault.findOne({
            where: {
                shiftType: employee?.shiftType || 'day',
                effectiveFrom: { [Op.lte]: formattedDate },
                [Op.or]: [
                    { effectiveTo: { [Op.gte]: formattedDate } },
                    { effectiveTo: null }
                ],
                isActive: true
            },
            order: [['effectiveFrom', 'DESC']]
        });
        
        return companyDefault?.lunchStartTime || '12:00';
    }
    
    async calculateAbsentThreshold(employeeId, date) {
        const checkInTime = await this.getEffectiveCheckInTime(employeeId, date);
        const absentAfterMinutes = await this.getAbsentAfterMinutes(employeeId, date);
        
        const checkInMinutes = this.timeToMinutes(checkInTime);
        const absentThresholdMinutes = checkInMinutes + absentAfterMinutes;
        
        return {
            time: this.minutesToTime(absentThresholdMinutes),
            minutes: absentThresholdMinutes,
            checkInTime: checkInTime,
            absentAfterMinutes: absentAfterMinutes
        };
    }
}

module.exports = new EmployeeScheduleService();