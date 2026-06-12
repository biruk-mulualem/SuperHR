'use strict';
const {
  CharityBeneficiary, CharityTeam, CharitySetting, CharityLog,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.userId;

    // Resolve team for teamleader
    let leaderTeamId = null;
    let relevantUserIds = [];
    if (role === 'charity_teamleader') {
      const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
      if (emp) {
        const team = await CharityTeam.findOne({
          where: {
            isActive: true,
            [Op.or]: [
              { head: emp.employeeId },
              { vice: emp.employeeId },
              { members: { [Op.contains]: [emp.employeeId] } },
            ],
          },
          attributes: ['teamId', 'head', 'vice'],
        });
        if (team) {
          leaderTeamId = team.teamId;
          // Find user IDs for head and vice
          const headViceEmps = await Employee.findAll({
            where: { employeeId: { [Op.in]: [team.head, team.vice].filter(Boolean) } },
            attributes: ['userId']
          });
          relevantUserIds = headViceEmps.map(e => e.userId);
        }
      }
    }

    // 1. Beneficiary Stats
    let benWhere = {};
    if (role === 'charity_teamleader') {
      if (!leaderTeamId) {
        return res.json({ success: true, data: {
          beneficiaries: { total: 0, active: 0, inactive: 0 },
          teams: { total: 0, active: 0 },
          allocation: { totalMonthly: 0 },
          distribution: { completed: 0, total: 0, release: null },
          recentActivity: []
        }});
      }
      benWhere.teamId = leaderTeamId;
    }

    const [totalBens, activeBens] = await Promise.all([
      CharityBeneficiary.count({ where: benWhere }),
      CharityBeneficiary.count({ where: { ...benWhere, isActive: true } })
    ]);

    const sumAllocation = await CharityBeneficiary.sum('monthlyAllocation', { where: { ...benWhere, isActive: true } });

    // 2. Team Stats
    let teamStats = { total: 0, active: 0 };
    if (['admin', 'charity_admin'].includes(role)) {
      teamStats.total = await CharityTeam.count();
      teamStats.active = await CharityTeam.count({ where: { isActive: true } });
    } else if (leaderTeamId) {
      teamStats.total = 1;
      teamStats.active = 1;
    }

    // 3. Distribution Progress (Latest Release)
    const settings = await CharitySetting.findOne({ where: { settingKey: 'main' } });
    const latestRelease = (settings?.distributionRelease || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let distributionProgress = { completed: 0, total: activeBens, release: latestRelease || null };
    if (latestRelease) {
      // deliveries is JSONB array: [{ "distribution_release_id": 123, "is_delivered": true, ... }]
      const deliveredCount = await CharityBeneficiary.count({
        where: {
          ...benWhere,
          isActive: true, // Only count active beneficiaries
          deliveries: {
            [Op.contains]: [{ distribution_release_id: latestRelease.distribution_release_id, is_delivered: true }]
          }
        }
      });
      distributionProgress.completed = deliveredCount;
    }

    // 4. Recent Activity (Logs)
    let logWhere = {};
    if (role === 'charity_teamleader') {
       if (leaderTeamId) {
         // Get all beneficiary IDs for this team
         const teamBens = await CharityBeneficiary.findAll({
           where: { teamId: leaderTeamId },
           attributes: ['beneficiaryId'],
           paranoid: false 
         });
         const benIds = teamBens.map(b => b.beneficiaryId);

         // Expand filter: Actions BY leadership OR actions ON their team/beneficiaries
         logWhere = {
           [Op.or]: [
             { userId: { [Op.in]: relevantUserIds } },
             { 
               module: 'beneficiary',
               targetId: { [Op.in]: benIds }
             },
             {
               module: 'team',
               targetId: leaderTeamId
             }
           ]
         };
       } else {
         logWhere.userId = userId;
       }
    }

    const recentLogs = await CharityLog.findAll({
      where: logWhere,
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['fullName'] }]
    });

    res.json({
      success: true,
      data: {
        beneficiaries: {
          total: totalBens,
          active: activeBens,
          inactive: totalBens - activeBens
        },
        teams: teamStats,
        allocation: {
          totalMonthly: parseFloat(sumAllocation || 0)
        },
        distribution: distributionProgress,
        recentActivity: recentLogs
      }
    });

  } catch (err) {
    console.error('getDashboardStats Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Resolve team for teamleader (reusing logic from getStats)
    let leaderTeamId = null;
    let relevantUserIds = [];
    if (role === 'charity_teamleader') {
      const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
      if (emp) {
        const team = await CharityTeam.findOne({
          where: {
            isActive: true,
            [Op.or]: [
              { head: emp.employeeId },
              { vice: emp.employeeId },
              { members: { [Op.contains]: [emp.employeeId] } },
            ],
          },
          attributes: ['teamId', 'head', 'vice'],
        });
        if (team) {
          leaderTeamId = team.teamId;
          const headViceEmps = await Employee.findAll({
            where: { employeeId: { [Op.in]: [team.head, team.vice].filter(Boolean) } },
            attributes: ['userId']
          });
          relevantUserIds = headViceEmps.map(e => e.userId);
        }
      }
    }

    let logWhere = {};
    if (role === 'charity_teamleader') {
       if (leaderTeamId) {
         const teamBens = await CharityBeneficiary.findAll({
           where: { teamId: leaderTeamId },
           attributes: ['beneficiaryId'],
           paranoid: false 
         });
         const benIds = teamBens.map(b => b.beneficiaryId);

         logWhere = {
           [Op.or]: [
             { userId: { [Op.in]: relevantUserIds } },
             { 
               module: 'beneficiary',
               targetId: { [Op.in]: benIds }
             },
             {
               module: 'team',
               targetId: leaderTeamId
             }
           ]
         };
       } else {
         logWhere.userId = userId;
       }
    }

    const { count, rows } = await CharityLog.findAndCountAll({
      where: logWhere,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['fullName'] }]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: count > offset + rows.length
      }
    });

  } catch (err) {
    console.error('getLogs Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
