// controllers/convertedBalanceController.js
'use strict';

const { 
    ConvertedBalance, 
    StoreBalance, 
    Item, 
    Category, 
    UOM, 
    Store, 
    Group,
    StoreBalanceHistory,
    User,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * Converted Balance Controller
 * Handles all operations for converted_balances table
 */
class ConvertedBalanceController {
    /**
     * GET /api/converted-balances
     * Get converted balances
     */
    static async getAll(req, res) {
        try {
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const {
                categoryId,
                uomId,
                search,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            const where = {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId)
            };

            const itemInclude = {
                model: Item,
                as: 'item',
                required: true,
                include: [
                    { model: Category, as: 'category' },
                    { model: UOM, as: 'uom' },
                    { model: UOM, as: 'conversionUom' }
                ]
            };

            const itemWhere = {};
            if (categoryId) itemWhere.categoryId = parseInt(categoryId);
            if (uomId) itemWhere.uomId = parseInt(uomId);
            
            if (search) {
                const searchTerm = search.toLowerCase();
                itemWhere[Op.or] = [
                    { code: { [Op.iLike]: `%${searchTerm}%` } },
                    { name: { [Op.iLike]: `%${searchTerm}%` } },
                    { standardName: { [Op.iLike]: `%${searchTerm}%` } }
                ];
            }

            if (Object.keys(itemWhere).length > 0) {
                itemInclude.where = itemWhere;
            }

            const count = await ConvertedBalance.count({
                where,
                include: [itemInclude],
                distinct: true
            });

            const balances = await ConvertedBalance.findAll({
                where,
                include: [
                    itemInclude,
                    { model: Store, as: 'store' },
                    { model: Group, as: 'group' }
                ],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                distinct: true
            });

            const items = balances.map(balance => ({
                id: balance.id,
                storeId: balance.storeId,
                groupId: balance.groupId,
                itemId: balance.itemId,
                itemCode: balance.item?.code || 'N/A',
                itemName: balance.item?.name || 'N/A',
                categoryName: balance.item?.category?.name || 'Uncategorized',
                uomCode: balance.item?.conversionUom?.code || balance.item?.uom?.code || 'N/A',
                convertedBalance: parseFloat(balance.convertedBalance || 0),
                storeName: balance.store?.name || 'N/A',
                groupName: balance.group?.name || 'N/A',
                createdAt: balance.createdAt,
                updatedAt: balance.updatedAt
            }));

            res.json({
                success: true,
                data: items,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error fetching converted balances:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch converted balances',
                details: error.message
            });
        }
    }

    /**
     * GET /api/converted-balances/available
     * Get items available for conversion
     */
    static async getAvailableForConversion(req, res) {
        try {
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const { categoryId, uomId, search } = req.query;

            const balanceWhere = {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                balance: { [Op.gt]: 0 },
                status: 'Active'
            };

            const itemInclude = {
                model: Item,
                as: 'item',
                required: true,
                include: [
                    { model: Category, as: 'category' },
                    { model: UOM, as: 'uom' },
                    { model: UOM, as: 'conversionUom' }
                ]
            };

            const itemWhere = {
                conversionUomId: { [Op.ne]: null },
                conversionValue: { [Op.gt]: 0 },
                status: 'Active'
            };

            itemWhere[Op.and] = [
                { uomId: { [Op.ne]: null } },
                { conversionUomId: { [Op.ne]: null } },
                sequelize.literal('"item"."uom_id" != "item"."conversion_uom_id"')
            ];

            if (categoryId) itemWhere.categoryId = parseInt(categoryId);
            
            if (search) {
                const searchTerm = search.toLowerCase();
                itemWhere[Op.or] = [
                    { code: { [Op.iLike]: `%${searchTerm}%` } },
                    { name: { [Op.iLike]: `%${searchTerm}%` } },
                    { standardName: { [Op.iLike]: `%${searchTerm}%` } }
                ];
            }

            itemInclude.where = itemWhere;

            const balances = await StoreBalance.findAll({
                where: balanceWhere,
                include: [itemInclude],
                order: [[{ model: Item, as: 'item' }, 'code', 'ASC']]
            });

            const items = balances.map(balance => ({
                id: balance.itemId,
                balanceId: balance.id,
                storeId: balance.storeId,
                groupId: balance.groupId,
                itemCode: balance.item?.code || 'N/A',
                itemName: balance.item?.name || 'N/A',
                categoryName: balance.item?.category?.name || 'Uncategorized',
                uomCode: balance.item?.uom?.code || 'N/A',
                balance: parseFloat(balance.balance || 0),
                convertToUom: balance.item?.conversionUom?.code || 'N/A',
                conversionRate: parseFloat(balance.item?.conversionValue || 0),
                canConvert: parseFloat(balance.balance) > 0,
                isConverted: false,
                sourceUomId: balance.item?.uomId,
                targetUomId: balance.item?.conversionUomId
            }));

            res.json({
                success: true,
                data: items
            });

        } catch (error) {
            console.error('Error fetching available items:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch available items',
                details: error.message
            });
        }
    }

/**
 * ================================================================
 * ✅ CONVERT - Convert from base UOM to converted UOM
 * POST /api/converted-balances/convert
 * ================================================================
 */
static async convert(req, res) {
    const { items, storeId: bodyStoreId, groupId: bodyGroupId } = req.body;
    
    const userId = req.user?.userId || req.user?.id;
    const userStoreId = req.user?.storeId;
    const userGroupId = req.user?.groupId;

    const finalStoreId = bodyStoreId || userStoreId;
    const finalGroupId = bodyGroupId || userGroupId;
    const finalUserId = userId;

    if (!finalUserId || !finalStoreId || !finalGroupId) {
        return res.status(401).json({
            success: false,
            error: 'User not properly authenticated. Please re-login.'
        });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No items provided for conversion'
        });
    }

    const results = [];
    const errors = [];
    const transaction = await sequelize.transaction();

    try {
        for (const item of items) {
            try {
                const {
                    balanceId,
                    itemId,
                    quantity,
                    conversionRate,
                    sourceUomId,
                    targetUomId,
                    itemCode,
                    itemName,
                    uomCode,
                    convertToUom
                } = item;

                const qtyToConvert = parseFloat(quantity);
                if (qtyToConvert <= 0) {
                    errors.push({
                        itemCode: itemCode || 'Unknown',
                        error: 'Quantity must be greater than 0'
                    });
                    continue;
                }

                // ============================================================
                // 1. GET AND VALIDATE SOURCE BALANCE (Base Balance)
                // ============================================================
                const sourceBalance = await StoreBalance.findByPk(balanceId, {
                    transaction,
                    lock: true
                });

                if (!sourceBalance) {
                    errors.push({
                        itemCode: itemCode || 'Unknown',
                        error: 'Balance not found'
                    });
                    continue;
                }

                if (sourceBalance.storeId !== parseInt(finalStoreId) || 
                    sourceBalance.groupId !== parseInt(finalGroupId)) {
                    errors.push({
                        itemCode: itemCode || 'Unknown',
                        error: `Unauthorized: Item does not belong to your store/group`
                    });
                    continue;
                }

                const currentBaseBalance = parseFloat(sourceBalance.balance);

                if (qtyToConvert > currentBaseBalance) {
                    errors.push({
                        itemCode: itemCode || 'Unknown',
                        error: `Insufficient balance. Available: ${currentBaseBalance}, Requested: ${qtyToConvert}`
                    });
                    continue;
                }

                // ============================================================
                // 2. CALCULATE CONVERTED AMOUNT
                // ============================================================
                const convertedAmount = qtyToConvert * parseFloat(conversionRate);
                const newBaseBalance = currentBaseBalance - qtyToConvert;
                const previousBaseBalance = currentBaseBalance;

                // ============================================================
                // 3. UPDATE SOURCE BALANCE (Reduce base UOM)
                // ============================================================
                sourceBalance.balance = newBaseBalance;
                await sourceBalance.save({ transaction });

                // ============================================================
                // 4. GET OR CREATE CONVERTED BALANCE
                // ============================================================
                const [convertedRecord, created] = await ConvertedBalance.findOrCreate({
                    where: {
                        storeId: parseInt(finalStoreId),
                        groupId: parseInt(finalGroupId),
                        itemId: parseInt(itemId)
                    },
                    defaults: {
                        storeId: parseInt(finalStoreId),
                        groupId: parseInt(finalGroupId),
                        itemId: parseInt(itemId),
                        convertedBalance: 0
                    },
                    transaction
                });

                const oldConvertedBalance = parseFloat(convertedRecord.convertedBalance);
                const newConvertedBalance = oldConvertedBalance + convertedAmount;
                convertedRecord.convertedBalance = newConvertedBalance;
                await convertedRecord.save({ transaction });

                const itemDisplayName = itemName || 'Unknown Item';
                const itemCodeDisplay = itemCode || 'N/A';

                // ============================================================
                // 5. HISTORY RECORD FOR BASE BALANCE (Stock Out)
                // ✅ transaction_type: 'Stock Out' (allowed)
                // ✅ reference_type: 'adjustment' (allowed)
                // ============================================================
                const baseRemark = `🔄 CONVERSION: ${qtyToConvert} ${uomCode} of "${itemDisplayName}" (${itemCodeDisplay}) converted to ${convertedAmount} ${convertToUom}. ` +
                                  `Balance: ${previousBaseBalance} → ${newBaseBalance} ${uomCode}. ` +
                                  `Rate: 1 ${uomCode} = ${conversionRate} ${convertToUom}.`;

                await StoreBalanceHistory.create({
                    balanceId: sourceBalance.id,
                    convertedBalanceId: null,
                    storeId: parseInt(finalStoreId),
                    groupId: parseInt(finalGroupId),
                    itemId: parseInt(itemId),
                    previousBalance: previousBaseBalance,
                    newBalance: newBaseBalance,
                    changeAmount: qtyToConvert,
                    transactionType: 'Stock Out', // ✅ Allowed
                    sourceStoreId: parseInt(finalStoreId),
                    destinationStoreId: parseInt(finalStoreId),
                    referenceType: 'adjustment', // ✅ Allowed
                    referenceId: convertedRecord.id,
                    changedBy: finalUserId,
                    remark: baseRemark,
                    grnNumber: null,
                    sivNumber: null,
                    uomUsed: uomCode,
                    isBaseUom: true
                }, { transaction });

                // ============================================================
                // 6. HISTORY RECORD FOR CONVERTED BALANCE (Stock In)
                // ✅ transaction_type: 'Stock In' (allowed)
                // ✅ reference_type: 'adjustment' (allowed)
                // ============================================================
                const convertedRemark = `🔄 CONVERSION: ${convertedAmount} ${convertToUom} of "${itemDisplayName}" (${itemCodeDisplay}) from ${qtyToConvert} ${uomCode}. ` +
                                       `Converted balance: ${oldConvertedBalance} → ${newConvertedBalance} ${convertToUom}. ` +
                                       `Rate: 1 ${uomCode} = ${conversionRate} ${convertToUom}.`;

                await StoreBalanceHistory.create({
                    convertedBalanceId: convertedRecord.id,
                    balanceId: null,
                    storeId: parseInt(finalStoreId),
                    groupId: parseInt(finalGroupId),
                    itemId: parseInt(itemId),
                    previousBalance: oldConvertedBalance,
                    newBalance: newConvertedBalance,
                    changeAmount: convertedAmount,
                    transactionType: 'Stock In', // ✅ Allowed
                    sourceStoreId: parseInt(finalStoreId),
                    destinationStoreId: parseInt(finalStoreId),
                    referenceType: 'adjustment', // ✅ Allowed
                    referenceId: convertedRecord.id,
                    changedBy: finalUserId,
                    remark: convertedRemark,
                    grnNumber: null,
                    sivNumber: null,
                    uomUsed: convertToUom,
                    isBaseUom: false
                }, { transaction });

                results.push({
                    itemCode: itemCodeDisplay,
                    itemName: itemDisplayName,
                    sourceUom: uomCode || 'Unknown',
                    targetUom: convertToUom || 'Unknown',
                    quantityConverted: qtyToConvert,
                    convertedAmount: convertedAmount,
                    sourceBalanceBefore: previousBaseBalance,
                    sourceBalanceAfter: newBaseBalance,
                    convertedBalanceBefore: oldConvertedBalance,
                    convertedBalanceAfter: newConvertedBalance,
                    status: 'success',
                    remark: `Converted ${qtyToConvert} ${uomCode} → ${convertedAmount} ${convertToUom}`
                });

            } catch (error) {
                console.error('Item conversion error:', error);
                errors.push({
                    itemCode: item.itemCode || 'Unknown',
                    error: error.message
                });
            }
        }

        if (results.length > 0) {
            await transaction.commit();
        } else {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'All conversions failed',
                errors
            });
        }

        res.json({
            success: true,
            message: `Successfully converted ${results.length} item(s)`,
            data: {
                conversions: results,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Conversion error:', error);
        res.status(500).json({
            success: false,
            error: 'Conversion failed',
            details: error.message
        });
    }
}
/**
 * ================================================================
 * ✅ STOCK IN - Add stock to converted balance (creates if not exists)
 * POST /api/converted-balances/stock-in
 * ================================================================
 */
static async stockIn(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            storeId,
            groupId,
            itemId,
            itemCode,
            itemName,
            uomCode,
            quantity,
            conversionRate,
            sourceUomId,
            targetUomId,
            reason
        } = req.body;

        const userId = req.user?.userId || req.user?.id;

        console.log('📥 Stock In:', {
            storeId,
            groupId,
            itemId,
            itemCode,
            quantity,
            uomCode,
            userId,
            reason
        });

        // Validate required fields
        if (!storeId || !groupId || !itemId || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: storeId, groupId, itemId, quantity'
            });
        }

        const qty = parseFloat(quantity);
        if (qty <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0'
            });
        }

        // Get or create converted balance
        let convertedBalance = await ConvertedBalance.findOne({
            where: {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId)
            },
            transaction,
            lock: true
        });

        const isNew = !convertedBalance;
        const oldBalance = convertedBalance ? parseFloat(convertedBalance.convertedBalance) : 0;
        const newBalance = oldBalance + qty;

        // Create or update converted balance
        if (isNew) {
            convertedBalance = await ConvertedBalance.create({
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId),
                convertedBalance: newBalance
            }, { transaction });
        } else {
            convertedBalance.convertedBalance = newBalance;
            await convertedBalance.save({ transaction });
        }

        // Build detailed remark
        const itemDisplayName = itemName || 'Unknown Item';
        const itemCodeDisplay = itemCode || 'N/A';
        const uomDisplay = uomCode || 'N/A';
        
        let remark = `📥 STOCK IN: ${qty} ${uomDisplay} of "${itemDisplayName}" (${itemCodeDisplay})`;

        if (reason && reason.trim()) {
            remark += ` - Reason: ${reason.trim()}`;
        }
        
        remark += ` | Balance: ${oldBalance} → ${newBalance} ${uomDisplay}`;

        if (userId) {
            const user = await User.findByPk(userId);
            if (user) {
                remark += ` | By: ${user.fullName || user.username}`;
            }
        }

        // ✅ Create history record with ALLOWED ENUM values
        await StoreBalanceHistory.create({
            convertedBalanceId: convertedBalance.id,
            balanceId: null,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: parseInt(itemId),
            previousBalance: oldBalance,
            newBalance: newBalance,
            changeAmount: qty,
            transactionType: 'Stock In', // ✅ Allowed: 'Stock In' or 'Stock Out'
            sourceStoreId: parseInt(storeId),
            destinationStoreId: null,
            referenceType: 'adjustment', // ✅ Allowed: 'purchase', 'transfer', 'adjustment', 'return', 'sale', 'initialization', 'request'
            referenceId: convertedBalance.id,
            changedBy: userId || null,
            remark: remark,
            grnNumber: null,
            sivNumber: null,
            uomUsed: uomDisplay,
            isBaseUom: false
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: isNew ? '✅ Converted balance initialized and stock added successfully' : '✅ Stock added successfully',
            data: {
                id: convertedBalance.id,
                itemCode: itemCodeDisplay,
                itemName: itemDisplayName,
                uomCode: uomDisplay,
                previousBalance: oldBalance,
                newBalance: newBalance,
                changeAmount: qty,
                operation: 'in',
                reason: reason || null,
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                isNew: isNew
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Stock In error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add stock',
            details: error.message
        });
    }
}

/**
 * ================================================================
 * ✅ STOCK OUT - Remove stock from converted balance
 * POST /api/converted-balances/stock-out
 * ================================================================
 */
static async stockOut(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            storeId,
            groupId,
            itemId,
            itemCode,
            itemName,
            uomCode,
            quantity,
            conversionRate,
            sourceUomId,
            targetUomId,
            reason
        } = req.body;

        const userId = req.user?.userId || req.user?.id;

        console.log('📤 Stock Out:', {
            storeId,
            groupId,
            itemId,
            itemCode,
            quantity,
            uomCode,
            userId,
            reason
        });

        // Validate required fields
        if (!storeId || !groupId || !itemId || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: storeId, groupId, itemId, quantity'
            });
        }

        const qty = parseFloat(quantity);
        if (qty <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0'
            });
        }

        // Get converted balance
        const convertedBalance = await ConvertedBalance.findOne({
            where: {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId)
            },
            transaction,
            lock: true
        });

        if (!convertedBalance) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Converted balance not found for this item. Please add stock first.'
            });
        }

        const oldBalance = parseFloat(convertedBalance.convertedBalance);
        
        if (qty > oldBalance) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: `Insufficient balance. Current: ${oldBalance}, Requested: ${qty}`
            });
        }

        const newBalance = oldBalance - qty;
        convertedBalance.convertedBalance = newBalance;
        await convertedBalance.save({ transaction });

        // Build detailed remark
        const itemDisplayName = itemName || 'Unknown Item';
        const itemCodeDisplay = itemCode || 'N/A';
        const uomDisplay = uomCode || 'N/A';
        
        let remark = `📤 STOCK OUT: ${qty} ${uomDisplay} of "${itemDisplayName}" (${itemCodeDisplay})`;

        if (reason && reason.trim()) {
            remark += ` - Reason: ${reason.trim()}`;
        }
        
        remark += ` | Balance: ${oldBalance} → ${newBalance} ${uomDisplay}`;

        if (userId) {
            const user = await User.findByPk(userId);
            if (user) {
                remark += ` | By: ${user.fullName || user.username}`;
            }
        }

        // ✅ Create history record with ALLOWED ENUM values
        await StoreBalanceHistory.create({
            convertedBalanceId: convertedBalance.id,
            balanceId: null,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: parseInt(itemId),
            previousBalance: oldBalance,
            newBalance: newBalance,
            changeAmount: qty,
            transactionType: 'Stock Out', // ✅ Allowed: 'Stock In' or 'Stock Out'
            sourceStoreId: parseInt(storeId),
            destinationStoreId: null,
            referenceType: 'adjustment', // ✅ Allowed: 'purchase', 'transfer', 'adjustment', 'return', 'sale', 'initialization', 'request'
            referenceId: convertedBalance.id,
            changedBy: userId || null,
            remark: remark,
            grnNumber: null,
            sivNumber: null,
            uomUsed: uomDisplay,
            isBaseUom: false
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: '✅ Stock removed successfully',
            data: {
                id: convertedBalance.id,
                itemCode: itemCodeDisplay,
                itemName: itemDisplayName,
                uomCode: uomDisplay,
                previousBalance: oldBalance,
                newBalance: newBalance,
                changeAmount: qty,
                operation: 'out',
                reason: reason || null,
                storeId: parseInt(storeId),
                groupId: parseInt(groupId)
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Stock Out error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove stock',
            details: error.message
        });
    }
}

    /**
     * GET /api/converted-balances/stats
     * Get statistics
     */
    static async getStats(req, res) {
        try {
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const where = {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId)
            };

            const totalItems = await ConvertedBalance.count({
                where: {
                    ...where,
                    convertedBalance: { [Op.gt]: 0 }
                }
            });

            const zeroStock = await ConvertedBalance.count({
                where: {
                    ...where,
                    convertedBalance: 0
                }
            });

            const totalBalance = await ConvertedBalance.sum('convertedBalance', { where });

            const convertibleItems = await StoreBalance.count({
                where: {
                    storeId: parseInt(storeId),
                    groupId: parseInt(groupId),
                    balance: { [Op.gt]: 0 },
                    status: 'Active'
                }
            });

            res.json({
                success: true,
                data: {
                    totalItems: totalItems || 0,
                    totalBalance: parseFloat(totalBalance || 0),
                    convertibleItems: convertibleItems || 0,
                    zeroStock: zeroStock || 0
                }
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics',
                details: error.message
            });
        }
    }

    /**
     * GET /api/converted-balances/:id
     * Get single converted balance by ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const balance = await ConvertedBalance.findOne({
                where: {
                    id: parseInt(id),
                    storeId: parseInt(storeId),
                    groupId: parseInt(groupId)
                },
                include: [
                    { 
                        model: Item, 
                        as: 'item',
                        include: [
                            { model: Category, as: 'category' },
                            { model: UOM, as: 'uom' },
                            { model: UOM, as: 'conversionUom' }
                        ]
                    },
                    { model: Store, as: 'store' },
                    { model: Group, as: 'group' }
                ]
            });

            if (!balance) {
                return res.status(404).json({
                    success: false,
                    error: 'Converted balance not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: balance.id,
                    storeId: balance.storeId,
                    groupId: balance.groupId,
                    itemId: balance.itemId,
                    itemCode: balance.item?.code || 'N/A',
                    itemName: balance.item?.name || 'N/A',
                    categoryName: balance.item?.category?.name || 'Uncategorized',
                    uomCode: balance.item?.conversionUom?.code || balance.item?.uom?.code || 'N/A',
                    convertedBalance: parseFloat(balance.convertedBalance || 0),
                    storeName: balance.store?.name || 'N/A',
                    groupName: balance.group?.name || 'N/A',
                    createdAt: balance.createdAt,
                    updatedAt: balance.updatedAt
                }
            });

        } catch (error) {
            console.error('Error fetching converted balance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch converted balance',
                details: error.message
            });
        }
    }

    /**
     * DELETE /api/converted-balances/:id
     * Delete converted balance only - does NOT delete history records
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const balance = await ConvertedBalance.findOne({
                where: {
                    id: parseInt(id),
                    storeId: parseInt(storeId),
                    groupId: parseInt(groupId)
                },
                include: [
                    {
                        model: Item,
                        as: 'item',
                        include: [
                            { model: UOM, as: 'uom' },
                            { model: UOM, as: 'conversionUom' }
                        ]
                    }
                ]
            });

            if (!balance) {
                return res.status(404).json({
                    success: false,
                    error: 'Converted balance not found or unauthorized'
                });
            }

            const itemName = balance.item?.name || 'Unknown';
            const itemCode = balance.item?.code || 'N/A';
            const convertedBalanceAmount = parseFloat(balance.convertedBalance || 0);

            await balance.destroy();

            res.json({
                success: true,
                message: `Converted balance for "${itemName}" (${itemCode}) deleted successfully`,
                data: {
                    id: balance.id,
                    itemCode: itemCode,
                    itemName: itemName,
                    convertedBalance: convertedBalanceAmount,
                    storeId: balance.storeId,
                    groupId: balance.groupId,
                    note: 'History records have been preserved for audit purposes'
                }
            });

        } catch (error) {
            console.error('❌ Error deleting converted balance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete converted balance',
                details: error.message
            });
        }
    }

    /**
     * POST /api/converted-balances/preview
     * Preview conversion (Dry Run)
     */
    static async previewConversion(req, res) {
        try {
            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No items provided for preview'
                });
            }

            const previewResults = [];

            for (const item of items) {
                const {
                    itemId,
                    itemCode,
                    itemName,
                    uomCode,
                    convertToUom,
                    quantity,
                    conversionRate,
                    currentBalance,
                    currentConvertedBalance
                } = item;

                const qtyToConvert = parseFloat(quantity) || 0;
                const rate = parseFloat(conversionRate) || 0;
                const currentBal = parseFloat(currentBalance) || 0;
                const currentConvBal = parseFloat(currentConvertedBalance) || 0;

                const convertedAmount = qtyToConvert * rate;
                const balanceAfter = currentBal - qtyToConvert;
                const convertedBalanceAfter = currentConvBal + convertedAmount;

                previewResults.push({
                    itemCode: itemCode || 'N/A',
                    itemName: itemName || 'Unknown',
                    sourceUom: uomCode || 'N/A',
                    targetUom: convertToUom || 'N/A',
                    currentBalance: currentBal,
                    quantityToConvert: qtyToConvert,
                    convertedAmount: convertedAmount,
                    balanceAfter: balanceAfter,
                    currentConvertedBalance: currentConvBal,
                    convertedBalanceAfter: convertedBalanceAfter,
                    hasExistingConverted: true,
                    isValid: qtyToConvert > 0 && qtyToConvert <= currentBal && rate > 0
                });
            }

            res.json({
                success: true,
                data: previewResults
            });

        } catch (error) {
            console.error('Preview conversion error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to preview conversion',
                details: error.message
            });
        }
    }
}

module.exports = ConvertedBalanceController;