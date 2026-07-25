// controllers/storeDashboardController.js
// Complete Store Dashboard Controller - All column names fixed

const { Op, Sequelize, literal } = require('sequelize');
const {
  StoreBalance,
  StoreBalanceHistory,
  ItemRequest,
  ItemRequestDetail,
  Store,
  Group,
  Category,
  Item,
  UOM,
  User,
  StoreGroupRelation,
  sequelize
} = require('../models');
const { getUserStoreAndGroup } = require('../utils/userAccess');

// ================================================================
// HELPER: Get User's Assigned Store and Group from Request
// ================================================================

// ================================================================
// HELPER: Get User's Assigned Store and Group from Request
// ================================================================
const getUserStoreAndGroupFromRequest = async (req) => {
    // ✅ FIRST: Try to get from query parameters (sent from frontend)
    const { storeId: queryStoreId, groupId: queryGroupId } = req.query;
    
    console.log('🔍 Query params:', { queryStoreId, queryGroupId });
    
    // ✅ If query params exist, use them (frontend is passing the data)
    if (queryStoreId && queryGroupId && queryStoreId !== 'all' && queryGroupId !== 'all') {
        const storeId = parseInt(queryStoreId);
        const groupId = parseInt(queryGroupId);
        
        console.log('📌 Using store and group from query params:', { storeId, groupId });
        
        // Fetch store and group details from database
        const store = await Store.findByPk(storeId, {
            attributes: ['id', 'name', 'code', 'location', 'status']
        });
        const group = await Group.findByPk(groupId, {
            attributes: ['id', 'name', 'code', 'description', 'status']
        });
        
        return {
            userId: req.user?.userId,
            username: req.user?.username,
            role: req.user?.role,
            isAdmin: req.user?.role === 'admin' || req.user?.role === 'Admin',
            storeId: storeId,
            groupId: groupId,
            storeName: store?.name || null,
            groupName: group?.name || null,
            storeCode: store?.code || null,
            groupCode: group?.code || null,
            hasAssignments: true,
            assignedStore: store || null,
            assignedGroup: group || null
        };
    }
    
    // ✅ Fallback: Try to get from user object (if middleware was updated)
    const user = req.user;
    if (user?.assignedStore?.id && user?.assignedGroup?.id) {
        console.log('📌 Using store and group from user object:', {
            storeId: user.assignedStore.id,
            groupId: user.assignedGroup.id
        });
        
        return {
            userId: user.userId,
            username: user.username,
            role: user.role,
            isAdmin: user.role === 'admin' || user.role === 'Admin',
            storeId: user.assignedStore.id,
            groupId: user.assignedGroup.id,
            storeName: user.assignedStore.name,
            groupName: user.assignedGroup.name,
            storeCode: user.assignedStore.code,
            groupCode: user.assignedGroup.code,
            hasAssignments: true,
            assignedStore: user.assignedStore,
            assignedGroup: user.assignedGroup
        };
    }
    
    // ✅ Last resort: Try to get from database using userId
    const userId = req.user?.userId;
    if (userId) {
        try {
            const result = await getUserStoreAndGroup(userId);
            if (result.success && result.data.assignedStoreId && result.data.assignedGroupId) {
                console.log('📌 Using store and group from database:', {
                    storeId: result.data.assignedStoreId,
                    groupId: result.data.assignedGroupId
                });
                
                return {
                    userId: result.data.userId,
                    username: result.data.username,
                    role: result.data.role,
                    isAdmin: result.data.isAdmin,
                    storeId: result.data.assignedStoreId,
                    groupId: result.data.assignedGroupId,
                    storeName: result.data.assignedStore?.name,
                    groupName: result.data.assignedGroup?.name,
                    storeCode: result.data.assignedStore?.code,
                    groupCode: result.data.assignedGroup?.code,
                    hasAssignments: true,
                    assignedStore: result.data.assignedStore,
                    assignedGroup: result.data.assignedGroup
                };
            }
        } catch (error) {
            console.error('❌ Error getting user store and group from database:', error);
        }
    }
    
    console.log('❌ No store or group found');
    return {
        userId: req.user?.userId,
        username: req.user?.username,
        role: req.user?.role,
        isAdmin: req.user?.role === 'admin' || req.user?.role === 'Admin',
        storeId: null,
        groupId: null,
        storeName: null,
        groupName: null,
        hasAssignments: false,
        assignedStore: null,
        assignedGroup: null
    };
};

// ================================================================
// HELPER: Build Filter Conditions
// ================================================================
const buildFilterConditions = (userAccess) => {
    const balanceWhereClause = {};
    const requestWhereClause = {};
    
    console.log('🔍 Building filters with userAccess:', {
        storeId: userAccess.storeId,
        groupId: userAccess.groupId,
        isAdmin: userAccess.isAdmin,
        storeName: userAccess.storeName,
        groupName: userAccess.groupName,
        hasAssignments: userAccess.hasAssignments
    });
    
    if (userAccess.isAdmin) {
        console.log('👑 Admin user - showing all data');
        return {
            balanceWhereClause: {},
            requestWhereClause: {},
            effectiveStoreId: null,
            effectiveGroupId: null,
            hasFilters: false,
            isAdmin: true
        };
    }
    
    // ✅ Check if user has store and group
    if (!userAccess.storeId || !userAccess.groupId) {
        console.log('⚠️ User has no store or group assigned:', {
            storeId: userAccess.storeId,
            groupId: userAccess.groupId
        });
        return {
            balanceWhereClause: {},
            requestWhereClause: {},
            effectiveStoreId: null,
            effectiveGroupId: null,
            hasFilters: false,
            isAdmin: false
        };
    }
    
    // ✅ Now we know both exist - use them
    balanceWhereClause.storeId = userAccess.storeId;
    balanceWhereClause.groupId = userAccess.groupId;
    
    requestWhereClause[Op.or] = [
        { askingStoreId: userAccess.storeId },
        { supplyingStoreId: userAccess.storeId }
    ];
    
    console.log('✅ Filter conditions built:', {
        storeId: userAccess.storeId,
        groupId: userAccess.groupId,
        storeName: userAccess.storeName,
        groupName: userAccess.groupName
    });
    
    return {
        balanceWhereClause,
        requestWhereClause,
        effectiveStoreId: userAccess.storeId,
        effectiveGroupId: userAccess.groupId,
        hasFilters: true,
        isAdmin: false
    };
};


// ================================================================
// HELPER: Get Date Range
// ================================================================
const getDateRange = (dateRange) => {
    const now = new Date();
    let startDate;
    
    switch(dateRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '3months':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 3);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '6months':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 6);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'all':
        default:
            startDate = new Date('2020-01-01');
            break;
    }
    
    return startDate;
};

// ================================================================
// HELPER: Get Active Stores for User
// ================================================================
const getActiveStores = async (userAccess) => {
    try {
        if (userAccess.isAdmin) {
            const stores = await Store.findAll({
                where: { status: 'Active' },
                attributes: ['id', 'name', 'code'],
                order: [['name', 'ASC']]
            });
            return stores.map(s => ({ id: s.id, name: s.name, code: s.code }));
        } else if (userAccess.storeId) {
            const store = await Store.findByPk(userAccess.storeId, {
                attributes: ['id', 'name', 'code']
            });
            return store ? [{ id: store.id, name: store.name, code: store.code }] : [];
        }
        return [];
    } catch (error) {
        console.error('❌ Error getting stores:', error);
        return [];
    }
};

// ================================================================
// HELPER: Get Active Groups for User
// ================================================================
const getActiveGroups = async (userAccess) => {
    try {
        if (userAccess.isAdmin) {
            const groups = await Group.findAll({
                where: { status: 'Active' },
                attributes: ['id', 'name', 'code'],
                order: [['name', 'ASC']]
            });
            return groups.map(g => ({ id: g.id, name: g.name, code: g.code }));
        } else if (userAccess.groupId) {
            const group = await Group.findByPk(userAccess.groupId, {
                attributes: ['id', 'name', 'code']
            });
            return group ? [{ id: group.id, name: group.name, code: group.code }] : [];
        }
        return [];
    } catch (error) {
        console.error('❌ Error getting groups:', error);
        return [];
    }
};

// ================================================================
// HELPER: Get Category Color
// ================================================================
const getCategoryColor = (categoryName) => {
    const colors = {
        'Paint': '#f59e0b',
        'Raw Materials': '#10b981',
        'Raw Material': '#10b981',
        'Tools': '#3b82f6',
        'Lubricants': '#8b5cf6',
        'Chemicals': '#ef4444',
        'Supplies': '#06b6d4',
        'Electronics': '#f59e0b',
        'Hardware': '#64748b',
        'Packaging': '#10b981',
        'Safety Equipment': '#22c55e',
        'Spare Parts': '#f97316',
        'Consumables': '#ec4899',
        'Office Supplies': '#8b5cf6',
        'Equipment': '#6366f1',
        'Furniture': '#d946ef',
        'Vehicles': '#14b8a6',
        'Maintenance': '#f43f5e',
        'Cleaning': '#0ea5e9',
    };
    return colors[categoryName] || '#94a3b8';
};

// controllers/storeDashboardController.js

// ================================================================
// 1. GET STOCK SUMMARY
// ================================================================
/**
 * Get stock summary for a specific store and group
 * 
 * Data sources:
 * - totalItems: Count of balances with storeId and groupId from store_balances table
 * - totalStockIn: Count of 'Stock In' transactions from store_balance_histories table
 * - totalStockOut: Count of 'Stock Out' transactions from store_balance_histories table
 * - zeroStock: Count of balances with balance = 0
 * - minStockAlert: Count of balances where balance > 0 AND balance <= min_stock_alert
 * - pendingRequests: Count of APPROVED requests where store is asking or supplying
 */
exports.getStockSummary = async (req, res) => {
    try {
        // ✅ Get store and group from query params (sent by frontend)
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        console.log('📊 User access for stock summary:', userAccess);
        
        // ✅ Build filter conditions
        const filters = buildFilterConditions(userAccess);
        console.log('📊 Filters for stock summary:', filters);
        
        // ✅ If no filters and not admin, return empty data
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: {
                    totalItems: 0,
                    totalStockIn: 0,
                    totalStockOut: 0,
                    zeroStock: 0,
                    zeroStockPercentage: 0,
                    minStockAlert: 0,
                    pendingRequests: 0
                }
            });
        }
        
        const { balanceWhereClause } = filters;
        console.log('📊 balanceWhereClause:', balanceWhereClause);
        
        // ================================================================
        // 1. TOTAL ITEMS - Count balances with storeId and groupId
        // ================================================================
        const totalItems = await StoreBalance.count({ 
            where: balanceWhereClause 
        });
        console.log('📊 totalItems:', totalItems);
        
        // ================================================================
        // 2. TOTAL STOCK IN - Count 'Stock In' transactions from balance history
        // ================================================================
        const stockInCount = await StoreBalanceHistory.count({
            where: {
                storeId: balanceWhereClause.storeId,
                groupId: balanceWhereClause.groupId,
                transaction_type: 'Stock In'
            }
        });
        console.log('📊 totalStockIn (count):', stockInCount);
        
        // ================================================================
        // 3. TOTAL STOCK OUT - Count 'Stock Out' transactions from balance history
        // ================================================================
        const stockOutCount = await StoreBalanceHistory.count({
            where: {
                storeId: balanceWhereClause.storeId,
                groupId: balanceWhereClause.groupId,
                transaction_type: 'Stock Out'
            }
        });
        console.log('📊 totalStockOut (count):', stockOutCount);
        
        // ================================================================
        // 4. ZERO STOCK - Count balances with balance = 0
        // ================================================================
        const zeroStock = await StoreBalance.count({
            where: { ...balanceWhereClause, balance: 0 }
        });
        console.log('📊 zeroStock:', zeroStock);
        
        // ================================================================
        // 5. MIN STOCK ALERT - Count balances where balance > 0 AND balance <= min_stock_alert
        // ================================================================
        const minStockAlert = await StoreBalance.count({
            where: {
                ...balanceWhereClause,
                balance: { [Op.gt]: 0 },
                balance: { [Op.lte]: Sequelize.col('min_stock_alert') }
            }
        });
        console.log('📊 minStockAlert:', minStockAlert);
        
        // ================================================================
        // 6. APPROVED REQUESTS - Count APPROVED requests where store is asking or supplying
        // Note: Status should be 'approved' (not pending)
        // ================================================================
        const approvedRequests = await ItemRequest.count({
            where: {
                status: 'approved',
                [Op.or]: [
                    { askingStoreId: balanceWhereClause.storeId },
                    { supplyingStoreId: balanceWhereClause.storeId }
                ]
            }
        });
        console.log('📊 approvedRequests:', approvedRequests);
        
        // ================================================================
        // 7. Calculate zero stock percentage
        // ================================================================
        const zeroStockPercentage = totalItems > 0 ? Math.round((zeroStock / totalItems) * 100) : 0;
        
        // ================================================================
        // 8. Return response
        // ================================================================
        res.status(200).json({
            success: true,
            data: {
                totalItems: totalItems || 0,
                totalStockIn: stockInCount || 0,
                totalStockOut: stockOutCount || 0,
                zeroStock: zeroStock || 0,
                zeroStockPercentage: zeroStockPercentage || 0,
                minStockAlert: minStockAlert || 0,
                pendingRequests: approvedRequests || 0  // ✅ Changed to approvedRequests
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting stock summary:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch stock summary'
        });
    }
};

// controllers/storeDashboardController.js

// ================================================================
// 2. GET STOCK HEALTH
// ================================================================
/**
 * Get stock health overview for a specific store and group
 * 
 * Definitions:
 * - Healthy Stock: Items where balance > min_stock_alert (good stock level)
 * - Low Stock: Items where balance <= min_stock_alert AND balance > 0 (below minimum)
 * - Zero Stock: Items where balance = 0 (out of stock)
 * 
 * Percentages are calculated from TOTAL items in that store and group
 */
exports.getStockHealth = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: {
                    healthy: 0,
                    lowStock: 0,
                    zeroStock: 0,
                    healthyPercent: 0,
                    lowStockPercent: 0,
                    zeroStockPercent: 0
                }
            });
        }
        
        const { balanceWhereClause } = filters;
        const storeId = balanceWhereClause.storeId;
        const groupId = balanceWhereClause.groupId;
        
        // ================================================================
        // SINGLE QUERY: Get all counts at once using SQL CASE statements
        // ================================================================
        const result = await StoreBalance.findOne({
            attributes: [
                // Total items (all statuses)
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalItems'],
                
                // Healthy: balance > min_stock_alert AND status = 'Active'
                [Sequelize.fn('SUM', Sequelize.literal(
                    `CASE WHEN status = 'Active' AND balance > min_stock_alert THEN 1 ELSE 0 END`
                )), 'healthy'],
                
                // Low Stock: balance <= min_stock_alert AND balance > 0 AND status = 'Active'
                [Sequelize.fn('SUM', Sequelize.literal(
                    `CASE WHEN status = 'Active' AND balance <= min_stock_alert AND balance > 0 THEN 1 ELSE 0 END`
                )), 'lowStock'],
                
                // Zero Stock: balance = 0 AND status = 'Active'
                [Sequelize.fn('SUM', Sequelize.literal(
                    `CASE WHEN status = 'Active' AND balance = 0 THEN 1 ELSE 0 END`
                )), 'zeroStock']
            ],
            where: balanceWhereClause,
            raw: true
        });
        
        const totalItems = parseInt(result?.totalItems || 0);
        const healthy = parseInt(result?.healthy || 0);
        const lowStock = parseInt(result?.lowStock || 0);
        const zeroStock = parseInt(result?.zeroStock || 0);
        
        console.log('📊 Stock health results:', {
            storeId,
            groupId,
            totalItems,
            healthy,
            lowStock,
            zeroStock
        });
        
        // ================================================================
        // Calculate percentages based on TOTAL items
        // ================================================================
        const healthyPercent = totalItems > 0 ? Math.round((healthy / totalItems) * 100) : 0;
        const lowStockPercent = totalItems > 0 ? Math.round((lowStock / totalItems) * 100) : 0;
        const zeroStockPercent = totalItems > 0 ? Math.round((zeroStock / totalItems) * 100) : 0;
        
        console.log('📊 Percentages (based on total items):', {
            totalItems,
            healthy: `${healthyPercent}%`,
            lowStock: `${lowStockPercent}%`,
            zeroStock: `${zeroStockPercent}%`,
            sum: healthyPercent + lowStockPercent + zeroStockPercent
        });
        
        // ================================================================
        // Return response
        // ================================================================
        res.status(200).json({
            success: true,
            data: {
                healthy: healthy || 0,
                lowStock: lowStock || 0,
                zeroStock: zeroStock || 0,
                healthyPercent: healthyPercent || 0,
                lowStockPercent: lowStockPercent || 0,
                zeroStockPercent: zeroStockPercent || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting stock health:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch stock health'
        });
    }
};


// ================================================================
// 4. GET LOW STOCK ALERTS
// ================================================================
// controllers/storeDashboardController.js

// ================================================================
// 4. GET LOW STOCK ALERTS WITH PAGINATION
// ================================================================
exports.getLowStockAlerts = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: { 
                    alerts: [], 
                    summary: { critical: 0, warning: 0, total: 0 },
                    pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
                }
            });
        }
        
        const { balanceWhereClause } = filters;
        const { limit = 20, page = 1 } = req.query;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const queryLimit = parseInt(limit);
        
        // Get total count for pagination
        const totalCount = await StoreBalance.count({
            where: {
                ...balanceWhereClause,
                status: 'Active',
                [Op.or]: [
                    { balance: 0 },
                    { balance: { [Op.lte]: Sequelize.col('min_stock_alert') } }
                ]
            }
        });
        
        // Get paginated results
        const lowStockItems = await StoreBalance.findAll({
            attributes: ['id', 'balance', 'min_stock_alert'],
            where: {
                ...balanceWhereClause,
                status: 'Active',
                [Op.or]: [
                    { balance: 0 },
                    { balance: { [Op.lte]: Sequelize.col('min_stock_alert') } }
                ]
            },
            include: [
                {
                    model: Item,
                    as: 'item',
                    attributes: ['id', 'code', 'name', 'standard_name'],
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['name']
                        },
                        {
                            model: UOM,
                            as: 'uom',
                            attributes: ['code', 'name']
                        }
                    ]
                },
                {
                    model: Store,
                    as: 'store',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Group,
                    as: 'group',
                    attributes: ['id', 'name', 'code']
                }
            ],
            order: [
                ['balance', 'ASC']
            ],
            limit: queryLimit,
            offset: offset
        });
        
        const alerts = lowStockItems.map(item => {
            const balance = parseFloat(item.balance) || 0;
            const minStock = parseFloat(item.min_stock_alert) || 0;
            
            return {
                id: item.id,
                name: item.item?.standard_name || item.item?.name || 'Unknown Item',
                code: item.item?.code || 'N/A',
                category: item.item?.category?.name || 'Uncategorized',
                currentStock: balance,
                minStock: minStock,
                uom: item.item?.uom?.code || 'PCS',
                shortage: Math.max(0, minStock - balance),
                store: item.store?.name || null,
                group: item.group?.name || null,
                status: balance === 0 ? 'zero' : 'low'
            };
        });
        
        const critical = alerts.filter(item => item.currentStock === 0);
        const warning = alerts.filter(item => item.currentStock > 0 && item.currentStock <= item.minStock);
        
        const totalPages = Math.ceil(totalCount / queryLimit);
        const currentPage = parseInt(page);
        const hasMore = currentPage < totalPages;
        
        res.status(200).json({
            success: true,
            data: {
                alerts: alerts,
                summary: {
                    total: totalCount,
                    critical: critical.length,
                    warning: warning.length
                },
                pagination: {
                    page: currentPage,
                    limit: queryLimit,
                    total: totalCount,
                    totalPages: totalPages,
                    hasMore: hasMore
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting low stock alerts:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch low stock alerts'
        });
    }
};

// controllers/storeDashboardController.js

// ================================================================
// 5. GET APPROVED REQUESTS (formerly getPendingRequests)
// ================================================================
/**
 * Get approved requests for a specific store and group
 * These are requests that have been approved but not yet processed
 */
exports.getApprovedRequests = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: [],
                total: 0
            });
        }
        
        const { requestWhereClause } = filters;
        const { limit = 10 } = req.query;
        
        // ✅ Changed from 'pending' to 'approved'
        const whereClause = { status: 'approved' };
        if (requestWhereClause && requestWhereClause[Op.or]) {
            whereClause[Op.or] = requestWhereClause[Op.or];
        }
        
        const approvedRequests = await ItemRequest.findAll({
            where: whereClause,
            include: [
                {
                    model: Store,
                    as: 'askingStore',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Store,
                    as: 'supplyingStore',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'requestedByUser',
                    attributes: ['userId', 'username', 'fullName']
                },
                {
                    model: ItemRequestDetail,
                    as: 'items',
                    include: [
                        {
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'code', 'name', 'standard_name'],
                            include: [
                                {
                                    model: UOM,
                                    as: 'uom',
                                    attributes: ['code', 'name']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        const result = approvedRequests.map(req => ({
            id: req.requestId,
            requestCode: req.requestCode,
            askingStore: req.askingStore?.name || null,
            supplyingStore: req.supplyingStore?.name || null,
            requestedBy: req.requestedByUser?.fullName || req.requestedByUser?.username || 'Unknown',
            requestedDate: req.requestedDate,
            status: req.status, // This will be 'approved'
            items: req.items?.map(item => ({
                itemId: item.itemId,
                itemName: item.item?.standard_name || item.item?.name || 'Unknown',
                itemCode: item.item?.code || 'N/A',
                quantity: parseFloat(item.quantity),
                uom: item.item?.uom?.code || 'PCS'
            })) || [],
            totalItems: req.items?.length || 0
        }));
        
        res.status(200).json({
            success: true,
            data: result,
            total: result.length
        });
    } catch (error) {
        console.error('❌ Error getting approved requests:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch approved requests'
        });
    }
};

// ================================================================
// 6. GET RECENT TRANSACTIONS
// ================================================================
exports.getRecentTransactions = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        const { balanceWhereClause } = filters;
        const { limit = 10 } = req.query;
        
        const balances = await StoreBalance.findAll({
            where: balanceWhereClause,
            attributes: ['id']
        });
        
        const balanceIds = balances.map(b => b.id);
        
        if (balanceIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // ✅ FIX: Use transaction_type instead of transactionType
        const transactions = await StoreBalanceHistory.findAll({
            where: { balanceId: { [Op.in]: balanceIds } },
            include: [
                {
                    model: Store,
                    as: 'store',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Group,
                    as: 'group',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Item,
                    as: 'item',
                    attributes: ['id', 'code', 'name', 'standard_name'],
                    include: [
                        {
                            model: UOM,
                            as: 'uom',
                            attributes: ['code', 'name']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'changedByUser',
                    attributes: ['userId', 'username', 'fullName']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        const result = transactions.map(tx => ({
            id: tx.id,
            itemName: tx.item?.standard_name || tx.item?.name || 'Unknown Item',
            itemCode: tx.item?.code || 'N/A',
            storeId: tx.storeId,
            storeName: tx.store?.name || null,
            type: tx.transaction_type || 'Stock In',  // ✅ FIX: Use transaction_type
            quantity: parseFloat(tx.changeAmount || 0),
            previousBalance: parseFloat(tx.previousBalance || 0),
            newBalance: parseFloat(tx.newBalance || 0),
            uom: tx.item?.uom?.code || 'PCS',
            referenceType: tx.referenceType,
            referenceId: tx.referenceId,
            remark: tx.remark,
            createdBy: tx.changedByUser?.fullName || tx.changedByUser?.username || 'System',
            createdAt: tx.createdAt
        }));
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Error getting recent transactions:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch recent transactions'
        });
    }
};



// controllers/storeDashboardController.js

// ================================================================
// 7. GET HIGH MOVING ITEMS - EXACT FRONTEND FORMAT
// ================================================================
exports.getHighMovingItems = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        const { balanceWhereClause } = filters;
        const { dateRange = 'week', limit = 10 } = req.query;
        
        const startDate = getDateRange(dateRange);
        
        const balances = await StoreBalance.findAll({
            where: balanceWhereClause,
            attributes: ['id', 'item_id']
        });
        
        const balanceIds = balances.map(b => b.id);
        const itemIds = balances.map(b => b.item_id);
        
        if (balanceIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // ✅ Get transaction counts with item IDs
        const transactionCounts = await sequelize.query(
            `SELECT 
                item_id,
                COUNT(id) AS "transactions",
                SUM(CASE WHEN transaction_type = 'Stock In' THEN change_amount ELSE 0 END) AS "totalIn",
                SUM(CASE WHEN transaction_type = 'Stock Out' THEN change_amount ELSE 0 END) AS "totalOut"
            FROM store_balance_histories
            WHERE balance_id IN (:balanceIds)
                AND created_at >= :startDate
            GROUP BY item_id
            HAVING COUNT(id) > 0
            ORDER BY "transactions" DESC
            LIMIT :limit`,
            {
                replacements: {
                    balanceIds: balanceIds,
                    startDate: startDate,
                    limit: parseInt(limit) || 10
                },
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        // ✅ If no transactions, return empty array
        if (transactionCounts.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // ✅ Get item details for the items that have transactions
        const itemIdsWithTransactions = transactionCounts.map(tc => tc.item_id);
        
        const items = await Item.findAll({
            where: { 
                id: { [Op.in]: itemIdsWithTransactions },
                status: 'Active'
            },
            attributes: ['id', 'code', 'name', 'standard_name'],
            include: [
                {
                    model: UOM,
                    as: 'uom',
                    attributes: ['code', 'name']
                }
            ],
            raw: true,
            nest: true
        });
        
        // ✅ Create item map with proper field names
        const itemMap = {};
        items.forEach(item => {
            itemMap[item.id] = {
                id: item.id,
                code: item.code || 'N/A',
                name: item.standard_name || item.name || 'Unknown Item',
                uom: item.uom?.code || 'PCS'
            };
        });
        
        // ✅ Format data exactly as frontend expects
        const result = transactionCounts.map(tc => {
            const item = itemMap[tc.item_id] || {
                id: tc.item_id,
                code: 'N/A',
                name: 'Unknown Item',
                uom: 'PCS'
            };
            
            return {
                id: item.id,
                code: item.code,
                name: item.name,
                uom: item.uom,
                transactions: parseInt(tc.transactions || 0),
                totalIn: parseFloat(tc.totalIn || 0),
                totalOut: parseFloat(tc.totalOut || 0),
                netMovement: parseFloat((tc.totalIn || 0) - (tc.totalOut || 0))
            };
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Error getting high moving items:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch high moving items'
        });
    }
};

// ================================================================
// 8. GET LOW MOVING ITEMS - EXACT FRONTEND FORMAT
// ================================================================
exports.getLowMovingItems = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        const { balanceWhereClause } = filters;
        const { dateRange = 'week', limit = 10 } = req.query;
        
        const startDate = getDateRange(dateRange);
        
        const balances = await StoreBalance.findAll({
            where: balanceWhereClause,
            attributes: ['id', 'item_id']
        });
        
        const balanceIds = balances.map(b => b.id);
        const itemIds = balances.map(b => b.item_id);
        
        if (balanceIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // ✅ Get transaction counts with item IDs
        const transactionCounts = await sequelize.query(
            `SELECT 
                item_id,
                COUNT(id) AS "transactions",
                SUM(CASE WHEN transaction_type = 'Stock In' THEN change_amount ELSE 0 END) AS "totalIn",
                SUM(CASE WHEN transaction_type = 'Stock Out' THEN change_amount ELSE 0 END) AS "totalOut"
            FROM store_balance_histories
            WHERE balance_id IN (:balanceIds)
                AND created_at >= :startDate
            GROUP BY item_id
            HAVING COUNT(id) > 0
            ORDER BY "transactions" ASC
            LIMIT :limit`,
            {
                replacements: {
                    balanceIds: balanceIds,
                    startDate: startDate,
                    limit: parseInt(limit) || 10
                },
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        // ✅ If no transactions, return empty array
        if (transactionCounts.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // ✅ Get item details for the items that have transactions
        const itemIdsWithTransactions = transactionCounts.map(tc => tc.item_id);
        
        const items = await Item.findAll({
            where: { 
                id: { [Op.in]: itemIdsWithTransactions },
                status: 'Active'
            },
            attributes: ['id', 'code', 'name', 'standard_name'],
            include: [
                {
                    model: UOM,
                    as: 'uom',
                    attributes: ['code', 'name']
                }
            ],
            raw: true,
            nest: true
        });
        
        // ✅ Create item map with proper field names
        const itemMap = {};
        items.forEach(item => {
            itemMap[item.id] = {
                id: item.id,
                code: item.code || 'N/A',
                name: item.standard_name || item.name || 'Unknown Item',
                uom: item.uom?.code || 'PCS'
            };
        });
        
        // ✅ Format data exactly as frontend expects
        const result = transactionCounts.map(tc => {
            const item = itemMap[tc.item_id] || {
                id: tc.item_id,
                code: 'N/A',
                name: 'Unknown Item',
                uom: 'PCS'
            };
            
            return {
                id: item.id,
                code: item.code,
                name: item.name,
                uom: item.uom,
                transactions: parseInt(tc.transactions || 0),
                totalIn: parseFloat(tc.totalIn || 0),
                totalOut: parseFloat(tc.totalOut || 0),
                netMovement: parseFloat((tc.totalIn || 0) - (tc.totalOut || 0))
            };
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Error getting low moving items:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch low moving items'
        });
    }
};
// ================================================================
// 9. GET TRANSACTION STATISTICS
// ================================================================
exports.getTransactionStats = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        
        if (!filters.hasFilters && !filters.isAdmin) {
            return res.status(200).json({
                success: true,
                data: { total: 0, stockIn: 0, stockOut: 0 }
            });
        }
        
        const { balanceWhereClause } = filters;
        
        const balances = await StoreBalance.findAll({
            where: balanceWhereClause,
            attributes: ['id']
        });
        
        const balanceIds = balances.map(b => b.id);
        
        if (balanceIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: { total: 0, stockIn: 0, stockOut: 0 }
            });
        }
        
        // ✅ FIX: Use transaction_type instead of transactionType
        const stats = await StoreBalanceHistory.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
                [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN transaction_type = \'Stock In\' THEN 1 ELSE 0 END')), 'stockIn'],
                [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN transaction_type = \'Stock Out\' THEN 1 ELSE 0 END')), 'stockOut']
            ],
            where: { balanceId: { [Op.in]: balanceIds } },
            raw: true
        });
        
        res.status(200).json({
            success: true,
            data: {
                total: parseInt(stats?.total || 0),
                stockIn: parseInt(stats?.stockIn || 0),
                stockOut: parseInt(stats?.stockOut || 0)
            }
        });
    } catch (error) {
        console.error('❌ Error getting transaction stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch transaction statistics'
        });
    }
};

// ================================================================
// 10. GET FILTER OPTIONS
// ================================================================
exports.getFilterOptions = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        
        const stores = await getActiveStores(userAccess);
        const groups = await getActiveGroups(userAccess);

        res.status(200).json({
            success: true,
            data: {
                stores,
                groups,
                userAccess: {
                    isAdmin: userAccess.isAdmin,
                    storeId: userAccess.storeId,
                    groupId: userAccess.groupId,
                    storeName: userAccess.storeName,
                    groupName: userAccess.groupName
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting filter options:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch filter options'
        });
    }
};

// ================================================================
// 11. EXPORT DASHBOARD - All Data in One Export
// ================================================================
exports.exportDashboard = async (req, res) => {
    try {
        const userAccess = await getUserStoreAndGroupFromRequest(req);
        const filters = buildFilterConditions(userAccess);
        const { dateRange = 'week' } = req.query;
        
        // Since we need data for export, call the internal functions
        // Or just call the same methods
        const [
            stockSummary,
            stockHealth,
            categoryDistribution,
            lowStockAlerts,
            pendingRequests,
            recentTransactions,
            highMoving,
            lowMoving,
            transactionStats
        ] = await Promise.all([
            // We need to call the internal logic again for export
            // For simplicity, we'll call the same functions used above
            getStockSummaryData(filters),
            getStockHealthData(filters),
            getCategoryDistributionData(filters),
            getLowStockAlertsData(filters),
            getPendingRequestsData(filters),
            getRecentTransactionsData(filters, 50),
            getHighMovingItemsData(filters, dateRange, 10),
            getLowMovingItemsData(filters, dateRange, 10),
            getTransactionStatsData(filters)
        ]);
        
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                name: req.user?.username || 'Unknown',
                userId: req.user?.userId,
                store: userAccess.storeName,
                group: userAccess.groupName
            },
            stockSummary,
            stockHealth,
            categoryDistribution,
            lowStockAlerts,
            pendingRequests,
            recentTransactions,
            movingItems: {
                high: highMoving,
                low: lowMoving
            },
            transactionStats
        };
        
        res.status(200).json({
            success: true,
            message: 'Dashboard data exported successfully',
            data: exportData
        });
    } catch (error) {
        console.error('❌ Export dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to export dashboard data'
        });
    }
};

// ================================================================
// INTERNAL DATA FETCHING FUNCTIONS (for export)
// ================================================================

// These are the same functions used above but exported for internal use
// They use the same fixed column names

const getStockSummaryData = async (filters) => {
    const { balanceWhereClause } = filters;
    const totalItems = await StoreBalance.count({ where: balanceWhereClause });
    const stockInResult = await StoreBalance.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.literal('CASE WHEN balance > 0 THEN balance ELSE 0 END')), 'totalStockIn']],
        where: balanceWhereClause,
        raw: true
    });
    const stockOutResult = await StoreBalance.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.literal('CASE WHEN balance < 0 THEN -balance ELSE 0 END')), 'totalStockOut']],
        where: balanceWhereClause,
        raw: true
    });
    const zeroStock = await StoreBalance.count({ where: { ...balanceWhereClause, balance: 0 } });
    const minStockAlert = await StoreBalance.count({
        where: { ...balanceWhereClause, balance: { [Op.gt]: 0 }, balance: { [Op.lte]: Sequelize.col('min_stock_alert') } }
    });
    const pendingRequests = await ItemRequest.count({
        where: { status: 'pending', [Op.or]: [{ askingStoreId: balanceWhereClause.storeId }, { supplyingStoreId: balanceWhereClause.storeId }] }
    });
    const zeroStockPercentage = totalItems > 0 ? Math.round((zeroStock / totalItems) * 100) : 0;
    return {
        totalItems: totalItems || 0,
        totalStockIn: parseFloat(stockInResult?.totalStockIn || 0),
        totalStockOut: parseFloat(stockOutResult?.totalStockOut || 0),
        zeroStock: zeroStock || 0,
        zeroStockPercentage: zeroStockPercentage || 0,
        minStockAlert: minStockAlert || 0,
        pendingRequests: pendingRequests || 0
    };
};

const getStockHealthData = async (filters) => {
    const { balanceWhereClause } = filters;
    const totalActive = await StoreBalance.count({ where: { ...balanceWhereClause, status: 'Active' } });
    const healthy = await StoreBalance.count({ where: { ...balanceWhereClause, status: 'Active', balance: { [Op.gt]: Sequelize.col('min_stock_alert') } } });
    const lowStock = await StoreBalance.count({ where: { ...balanceWhereClause, status: 'Active', balance: { [Op.gt]: 0 }, balance: { [Op.lte]: Sequelize.col('min_stock_alert') } } });
    const zeroStock = await StoreBalance.count({ where: { ...balanceWhereClause, status: 'Active', balance: 0 } });
    return {
        healthy: healthy || 0,
        lowStock: lowStock || 0,
        zeroStock: zeroStock || 0,
        healthyPercent: totalActive > 0 ? Math.round((healthy / totalActive) * 100) : 0,
        lowStockPercent: totalActive > 0 ? Math.round((lowStock / totalActive) * 100) : 0,
        zeroStockPercent: totalActive > 0 ? Math.round((zeroStock / totalActive) * 100) : 0
    };
};

const getCategoryDistributionData = async (filters) => {
    const { balanceWhereClause } = filters;
    const categories = await Category.findAll({
        where: { status: 'Active' },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
    });
    const analysis = await Promise.all(categories.map(async (category) => {
        const itemsInCategory = await Item.findAll({
            where: { category_id: category.id, status: 'Active' },
            attributes: ['id']
        });
        const itemIds = itemsInCategory.map(i => i.id);
        if (itemIds.length === 0) {
            return { name: category.name, total: 0, inStock: 0, lowStock: 0, zeroStock: 0, inStockPercent: 0, lowStockPercent: 0, zeroStockPercent: 0, color: getCategoryColor(category.name) };
        }
        const stats = await StoreBalance.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
                [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN balance > min_stock_alert THEN 1 ELSE 0 END')), 'inStock'],
                [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN balance > 0 AND balance <= min_stock_alert THEN 1 ELSE 0 END')), 'lowStock'],
                [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN balance = 0 THEN 1 ELSE 0 END')), 'zeroStock']
            ],
            where: { ...balanceWhereClause, item_id: { [Op.in]: itemIds }, status: 'Active' },
            raw: true
        });
        const total = parseInt(stats?.total || 0);
        const inStock = parseInt(stats?.inStock || 0);
        const lowStock = parseInt(stats?.lowStock || 0);
        const zeroStock = parseInt(stats?.zeroStock || 0);
        return {
            name: category.name,
            total,
            inStock,
            lowStock,
            zeroStock,
            inStockPercent: total > 0 ? Math.round((inStock / total) * 100) : 0,
            lowStockPercent: total > 0 ? Math.round((lowStock / total) * 100) : 0,
            zeroStockPercent: total > 0 ? Math.round((zeroStock / total) * 100) : 0,
            color: getCategoryColor(category.name)
        };
    }));
    return analysis.filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);
};

const getLowStockAlertsData = async (filters) => {
    const { balanceWhereClause } = filters;
    const lowStockItems = await StoreBalance.findAll({
        attributes: ['id', 'balance', 'min_stock_alert'],
        where: { ...balanceWhereClause, status: 'Active', [Op.or]: [{ balance: 0 }, { balance: { [Op.lte]: Sequelize.col('min_stock_alert') } }] },
        include: [{ model: Item, as: 'item', attributes: ['id', 'code', 'name', 'standard_name'], include: [{ model: Category, as: 'category', attributes: ['name'] }, { model: UOM, as: 'uom', attributes: ['code', 'name'] }] }],
        order: [['balance', 'ASC']],
        limit: 20
    });
    return lowStockItems.map(item => {
        const balance = parseFloat(item.balance) || 0;
        const minStock = parseFloat(item.min_stock_alert) || 0;
        return {
            id: item.id,
            name: item.item?.standard_name || item.item?.name || 'Unknown Item',
            code: item.item?.code || 'N/A',
            category: item.item?.category?.name || 'Uncategorized',
            currentStock: balance,
            minStock: minStock,
            uom: item.item?.uom?.code || 'PCS',
            shortage: Math.max(0, minStock - balance),
            status: balance === 0 ? 'zero' : 'low'
        };
    });
};

const getPendingRequestsData = async (filters) => {
    const { requestWhereClause } = filters;
    const whereClause = { status: 'pending' };
    if (requestWhereClause && requestWhereClause[Op.or]) {
        whereClause[Op.or] = requestWhereClause[Op.or];
    }
    const pendingRequests = await ItemRequest.findAll({
        where: whereClause,
        include: [{ model: Store, as: 'askingStore', attributes: ['id', 'name', 'code'] }, { model: Store, as: 'supplyingStore', attributes: ['id', 'name', 'code'] }, { model: User, as: 'requestedByUser', attributes: ['userId', 'username', 'fullName'] }],
        order: [['createdAt', 'DESC']],
        limit: 10
    });
    return pendingRequests.map(req => ({
        id: req.requestId,
        requestCode: req.requestCode,
        askingStore: req.askingStore?.name || null,
        supplyingStore: req.supplyingStore?.name || null,
        requestedBy: req.requestedByUser?.fullName || req.requestedByUser?.username || 'Unknown',
        requestedDate: req.requestedDate,
        status: req.status,
        totalItems: req.items?.length || 0
    }));
};

const getRecentTransactionsData = async (filters, limit) => {
    const { balanceWhereClause } = filters;
    const balances = await StoreBalance.findAll({ where: balanceWhereClause, attributes: ['id'] });
    const balanceIds = balances.map(b => b.id);
    if (balanceIds.length === 0) return [];
    const transactions = await StoreBalanceHistory.findAll({
        where: { balanceId: { [Op.in]: balanceIds } },
        include: [{ model: Store, as: 'store', attributes: ['id', 'name', 'code'] }, { model: Item, as: 'item', attributes: ['id', 'code', 'name', 'standard_name'], include: [{ model: UOM, as: 'uom', attributes: ['code', 'name'] }] }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
    });
    return transactions.map(tx => ({
        id: tx.id,
        itemName: tx.item?.standard_name || tx.item?.name || 'Unknown Item',
        itemCode: tx.item?.code || 'N/A',
        storeName: tx.store?.name || null,
        type: tx.transaction_type || 'Stock In',
        quantity: parseFloat(tx.changeAmount || 0),
        uom: tx.item?.uom?.code || 'PCS',
        createdAt: tx.createdAt
    }));
};

const getHighMovingItemsData = async (filters, dateRange, limit) => {
    const { balanceWhereClause } = filters;
    const startDate = getDateRange(dateRange);
    const balances = await StoreBalance.findAll({ where: balanceWhereClause, attributes: ['id', 'item_id'] });
    const balanceIds = balances.map(b => b.id);
    const itemIds = balances.map(b => b.item_id);
    if (balanceIds.length === 0) return [];
    const transactionCounts = await StoreBalanceHistory.findAll({
        attributes: ['item_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount']],
        where: { balanceId: { [Op.in]: balanceIds }, createdAt: { [Op.gte]: startDate } },
        group: ['item_id'],
        raw: true,
        having: { transactionCount: { [Op.gt]: 0 } }
    });
    const items = await Item.findAll({ where: { id: { [Op.in]: itemIds } }, attributes: ['id', 'code', 'name', 'standard_name'] });
    const itemMap = {};
    items.forEach(item => { itemMap[item.id] = { id: item.id, code: item.code, name: item.standard_name || item.name || 'Unknown' }; });
    const movingItems = transactionCounts.map(tc => ({ itemId: tc.item_id, ...itemMap[tc.item_id], transactions: parseInt(tc.transactionCount || 0) }));
    return movingItems.sort((a, b) => b.transactions - a.transactions).slice(0, parseInt(limit));
};

const getLowMovingItemsData = async (filters, dateRange, limit) => {
    const { balanceWhereClause } = filters;
    const startDate = getDateRange(dateRange);
    const balances = await StoreBalance.findAll({ where: balanceWhereClause, attributes: ['id', 'item_id'] });
    const balanceIds = balances.map(b => b.id);
    const itemIds = balances.map(b => b.item_id);
    if (balanceIds.length === 0) return [];
    const transactionCounts = await StoreBalanceHistory.findAll({
        attributes: ['item_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount']],
        where: { balanceId: { [Op.in]: balanceIds }, createdAt: { [Op.gte]: startDate } },
        group: ['item_id'],
        raw: true,
        having: { transactionCount: { [Op.gt]: 0 } }
    });
    const items = await Item.findAll({ where: { id: { [Op.in]: itemIds } }, attributes: ['id', 'code', 'name', 'standard_name'] });
    const itemMap = {};
    items.forEach(item => { itemMap[item.id] = { id: item.id, code: item.code, name: item.standard_name || item.name || 'Unknown' }; });
    const movingItems = transactionCounts.map(tc => ({ itemId: tc.item_id, ...itemMap[tc.item_id], transactions: parseInt(tc.transactionCount || 0) }));
    return movingItems.sort((a, b) => a.transactions - b.transactions).slice(0, parseInt(limit));
};

const getTransactionStatsData = async (filters) => {
    const { balanceWhereClause } = filters;
    const balances = await StoreBalance.findAll({ where: balanceWhereClause, attributes: ['id'] });
    const balanceIds = balances.map(b => b.id);
    if (balanceIds.length === 0) return { total: 0, stockIn: 0, stockOut: 0 };
    const stats = await StoreBalanceHistory.findOne({
        attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
            [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN transaction_type = \'Stock In\' THEN 1 ELSE 0 END')), 'stockIn'],
            [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN transaction_type = \'Stock Out\' THEN 1 ELSE 0 END')), 'stockOut']
        ],
        where: { balanceId: { [Op.in]: balanceIds } },
        raw: true
    });
    return {
        total: parseInt(stats?.total || 0),
        stockIn: parseInt(stats?.stockIn || 0),
        stockOut: parseInt(stats?.stockOut || 0)
    };
};

module.exports = exports;