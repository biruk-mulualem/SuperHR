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
    StoreBalanceHistory,  // ✅ Add this
    sequelize             // ✅ Add this - IMPORTANT!
} = require('../models');
const { Op } = require('sequelize');

/**
 * Converted Balance Controller
 * Handles all operations for converted_balances table
 */
class ConvertedBalanceController {
    /**
     * GET /api/converted-balances
     * Get converted balances - ✅ Uses query params for storeId/groupId
     */
    static async getAll(req, res) {
        try {
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;
            const userId = req.user?.id;

            console.log('🔍 getAll - storeId:', storeId, 'groupId:', groupId, 'userId:', userId);

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
     * Get items available for conversion - ✅ Uses query params for storeId/groupId
     */
   // controllers/convertedBalanceController.js

static async getAvailableForConversion(req, res) {
    try {
        const storeId = req.query.storeId;
        const groupId = req.query.groupId;

        console.log('🔍 getAvailableForConversion - storeId:', storeId, 'groupId:', groupId);

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

        // 🔥 ADD VALIDATION: Base UOM must be different from Conversion UOM
        // This ensures we only show items where uomId != conversionUomId
        // Using Sequelize literal for column comparison
        itemWhere[Op.and] = [
            { uomId: { [Op.ne]: null } },  // Base UOM exists
            { conversionUomId: { [Op.ne]: null } },  // Conversion UOM exists
            sequelize.literal('"item"."uom_id" != "item"."conversion_uom_id"')  // Different UOMs
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
 * POST /api/converted-balances/convert
 * Perform conversion - ✅ Single history record with detailed remark
 */
static async convert(req, res) {
    const { items, storeId: bodyStoreId, groupId: bodyGroupId } = req.body;
    
    const userId = req.user?.userId || req.user?.id;
    const userStoreId = req.user?.storeId;
    const userGroupId = req.user?.groupId;

    const finalStoreId = bodyStoreId || userStoreId;
    const finalGroupId = bodyGroupId || userGroupId;
    const finalUserId = userId;

    console.log('🔐 Conversion request:', {
        userId: finalUserId,
        storeId: finalStoreId,
        groupId: finalGroupId,
        itemCount: items?.length || 0
    });

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

                // 1. Get source balance with lock
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

                const currentBalance = parseFloat(sourceBalance.balance);

                if (qtyToConvert > currentBalance) {
                    errors.push({
                        itemCode: itemCode || 'Unknown',
                        error: `Insufficient balance. Available: ${currentBalance}, Requested: ${qtyToConvert}`
                    });
                    continue;
                }

                // 2. Calculate converted amount
                const convertedAmount = qtyToConvert * parseFloat(conversionRate);

                // 3. Reduce source balance
                const newBalance = currentBalance - qtyToConvert;
                const previousBalance = currentBalance;
                
                sourceBalance.balance = newBalance;
                await sourceBalance.save({ transaction });

                // 4. Register/Update converted balance
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

                // ================================================================
                // ✅ SINGLE HISTORY RECORD WITH DETAILED REMARK
                // ================================================================
                // Create a detailed description of the conversion
                const remark = ` CONVERSION: ${qtyToConvert} ${uomCode} of "${itemName}" (${itemCode}) was converted to ${convertedAmount} ${convertToUom}. ` +
                              `Source balance: ${previousBalance} → ${newBalance} ${uomCode}. ` +
                              `Converted balance updated from ${oldConvertedBalance} → ${newConvertedBalance} ${convertToUom}. ` +
                              `Rate: 1 ${uomCode} = ${conversionRate} ${convertToUom}.`;

                await StoreBalanceHistory.create({
                    balanceId: sourceBalance.id,
                    storeId: parseInt(finalStoreId),
                    groupId: parseInt(finalGroupId),
                    itemId: parseInt(itemId),
                    previousBalance: previousBalance,
                    newBalance: newBalance,
                    changeAmount: qtyToConvert,
                    transactionType: 'Stock Out',  // Source is Stock Out
                    sourceStoreId: parseInt(finalStoreId),
                    destinationStoreId: null,
                    referenceType: 'adjustment',
                    referenceId: null,
                    changedBy: finalUserId,
                    remark: remark,  // ✅ Detailed remark
                    grnNumber: null,
                    sivNumber: null
                }, { transaction });

                results.push({
                    itemCode: itemCode || 'Unknown',
                    itemName: itemName || 'Unknown',
                    sourceUom: uomCode || 'Unknown',
                    targetUom: convertToUom || 'Unknown',
                    quantityConverted: qtyToConvert,
                    convertedAmount: convertedAmount,
                    sourceBalanceBefore: currentBalance,
                    sourceBalanceAfter: newBalance,
                    convertedBalanceBefore: oldConvertedBalance,
                    convertedBalanceAfter: newConvertedBalance,
                    status: 'success',
                    // ✅ Add remark to response
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
     * POST /api/converted-balances/preview
     * Preview conversion without executing (dry run)
     */
    static async previewConversion(req, res) {
        try {
            const { items } = req.body;
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            console.log('🔍 previewConversion - storeId:', storeId, 'groupId:', groupId);

            if (!storeId || !groupId) {
                return res.status(400).json({
                    success: false,
                    error: 'Store ID and Group ID are required'
                });
            }

            const previews = [];

            for (const item of items) {
                const sourceBalance = await StoreBalance.findByPk(item.balanceId, {
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

                if (!sourceBalance) {
                    previews.push({
                        itemCode: item.itemCode || 'Unknown',
                        error: 'Balance not found'
                    });
                    continue;
                }

                const currentBalance = parseFloat(sourceBalance.balance);
                const qtyToConvert = parseFloat(item.quantity);
                const convertedAmount = qtyToConvert * parseFloat(item.conversionRate);

                const existingConverted = await ConvertedBalance.findOne({
                    where: {
                        storeId: parseInt(storeId),
                        groupId: parseInt(groupId),
                        itemId: parseInt(item.itemId)
                    }
                });

                const currentConvertedBalance = existingConverted ? 
                    parseFloat(existingConverted.convertedBalance) : 0;

                previews.push({
                    itemCode: sourceBalance.item?.code || 'N/A',
                    itemName: sourceBalance.item?.name || 'N/A',
                    sourceUom: item.uomCode || 'N/A',
                    targetUom: item.convertToUom || 'N/A',
                    currentBalance: currentBalance,
                    quantityToConvert: qtyToConvert,
                    convertedAmount: convertedAmount,
                    balanceAfter: currentBalance - qtyToConvert,
                    currentConvertedBalance: currentConvertedBalance,
                    convertedBalanceAfter: currentConvertedBalance + convertedAmount,
                    hasExistingConverted: !!existingConverted
                });
            }

            res.json({
                success: true,
                data: previews
            });

        } catch (error) {
            console.error('Preview error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to preview conversion',
                details: error.message
            });
        }
    }

    /**
     * GET /api/converted-balances/stats
     * Get statistics - ✅ Uses query params for storeId/groupId
     */
    static async getStats(req, res) {
        try {
            const storeId = req.query.storeId;
            const groupId = req.query.groupId;

            console.log('🔍 getStats - storeId:', storeId, 'groupId:', groupId);

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
                            { model: UOM, as: 'conversionUom' }  // ✅ Added
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

  // controllers/convertedBalanceController.js - Updated delete method (NO history deletion)

/**
 * DELETE /api/converted-balances/:id
 * Delete converted balance only - does NOT delete history records
 */
static async delete(req, res) {
    try {
        const { id } = req.params;
        const storeId = req.query.storeId;
        const groupId = req.query.groupId;

        console.log('🗑️ Delete converted balance:', { id, storeId, groupId });

        if (!storeId || !groupId) {
            return res.status(400).json({
                success: false,
                error: 'Store ID and Group ID are required'
            });
        }

        // Find the converted balance
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

        // Get item info for response
        const itemName = balance.item?.name || 'Unknown';
        const itemCode = balance.item?.code || 'N/A';
        const convertedBalanceAmount = parseFloat(balance.convertedBalance || 0);

        // 🔥 ONLY delete the converted balance - history records are preserved
        await balance.destroy();

        console.log(`🗑️ Deleted converted balance ${id} for item "${itemName}" (${itemCode})`);

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
                // ✅ History records are preserved - they will show "deleted" reference
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




static async create(req, res) {
    try {
        const { storeId, groupId, itemId, convertedBalance } = req.body;
        const userId = req.user?.userId || req.user?.id;

        console.log('📦 Create converted balance:', { 
            storeId, 
            groupId, 
            itemId, 
            convertedBalance, 
            userId 
        });

        // Validate required fields
        if (!storeId || !groupId || !itemId) {
            return res.status(400).json({
                success: false,
                error: 'Store ID, Group ID, and Item ID are required'
            });
        }

        // Fetch item with all UOM relationships
        const item = await Item.findByPk(parseInt(itemId), {
            include: [
                { model: UOM, as: 'uom' },
                { model: UOM, as: 'conversionUom' }
            ]
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        // Check if converted balance already exists
        const existing = await ConvertedBalance.findOne({
            where: {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId)
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Converted balance already initialized for this item',
                message: `Item "${item.name || 'Unknown'}" (${item.code || 'N/A'}) already has a converted balance record.`
            });
        }

        // Start transaction
        const transaction = await sequelize.transaction();

        try {
            const convertedBalanceAmount = parseFloat(convertedBalance || 0);

            // Create new converted balance
            const result = await ConvertedBalance.create({
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId),
                convertedBalance: convertedBalanceAmount
            }, { transaction });

            // Get the source store balance
            const sourceBalance = await StoreBalance.findOne({
                where: {
                    storeId: parseInt(storeId),
                    groupId: parseInt(groupId),
                    itemId: parseInt(itemId)
                },
                transaction
            });

            // Get UOM information
            const baseUom = item.uom;
            const conversionUom = item.conversionUom;
            
            const baseUomCode = baseUom?.code || 'N/A';
            const conversionUomCode = conversionUom?.code || 'N/A';
            const conversionValue = parseFloat(item.conversionValue || 0);

            const itemName = item.name || 'Unknown';
            const itemCode = item.code || 'N/A';

            // Build remark
            let remark = `📦 CONVERTED BALANCE INITIALIZED: "${itemName}" (${itemCode})`;
            remark += ` - Added ${convertedBalanceAmount} ${conversionUomCode}`;
            
            if (conversionValue > 0 && baseUomCode !== 'N/A' && conversionUomCode !== 'N/A') {
                remark += ` (Conversion: 1 ${baseUomCode} = ${conversionValue} ${conversionUomCode})`;
            }

            // 🔥 FIX: The source balance doesn't change, but we're adding a converted balance
            // So changeAmount should be the converted balance amount (positive)
            // and transaction type should be 'Stock In' (adding)
            const previousBalance = sourceBalance ? parseFloat(sourceBalance.balance) : 0;
            const newBalance = previousBalance; // Source balance stays the same

            // Create history record with CORRECT values
            const historyData = {
                convertedBalanceId: result.id,
                balanceId: sourceBalance?.id || null,
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: parseInt(itemId),
                
                // 🔥 FIX: These should reflect the source balance (no change)
                previousBalance: previousBalance,
                newBalance: newBalance,
                
                // 🔥 FIX: Change amount should be the converted balance (positive)
                changeAmount: convertedBalanceAmount,  // The amount added to converted balance
                
                // 🔥 FIX: 'Stock In' because we're adding converted balance
                transactionType: 'Stock In',
                
                sourceStoreId: parseInt(storeId),
                destinationStoreId: null,
                referenceType: 'initialization',
                referenceId: result.id,
                changedBy: userId,
                remark: remark,
                grnNumber: null,
                sivNumber: null,
                uomUsed: conversionUomCode,
                isBaseUom: false
            };

            console.log('📝 Creating history record:', historyData);

            await StoreBalanceHistory.create(historyData, { transaction });

            await transaction.commit();

            // Fetch full record with associations
            const created = await ConvertedBalance.findOne({
                where: { id: result.id },
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

            res.json({
                success: true,
                message: 'Converted balance initialized successfully',
                data: {
                    id: created.id,
                    storeId: created.storeId,
                    groupId: created.groupId,
                    itemId: created.itemId,
                    itemCode: created.item?.code || 'N/A',
                    itemName: created.item?.name || 'N/A',
                    categoryName: created.item?.category?.name || 'Uncategorized',
                    uomCode: created.item?.conversionUom?.code || created.item?.uom?.code || 'N/A',
                    convertedBalance: parseFloat(created.convertedBalance || 0),
                    storeName: created.store?.name || 'N/A',
                    groupName: created.group?.name || 'N/A',
                    createdAt: created.createdAt,
                    updatedAt: created.updatedAt
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error creating converted balance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create converted balance',
            details: error.message
        });
    }
}
}
module.exports = ConvertedBalanceController;