// controllers/formulationController.js
'use strict';
const { Formulation, FormulationDetail, FinishedGood, Item, UOM, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class FormulationController {
    // ================================================================
    // GET ALL FORMULATIONS WITH PAGINATION AND FILTERS
    // ================================================================
    static async getAll(req, res) {
        try {
            const {
                search,
                status,
                productType,
                finishedGoodId,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            const where = {};
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const order = [[sortBy, sortOrder.toUpperCase()]];

            // 🔥 Build include for finished good with filters
            const finishedGoodInclude = {
                model: FinishedGood,
                as: 'finishedGood',
                attributes: ['id', 'fgCode', 'name', 'type'],
                where: {}
            };

            // Apply filters
            if (status) {
                where.status = status;
            }

            if (finishedGoodId) {
                finishedGoodInclude.where.id = finishedGoodId;
            }

            if (productType) {
                finishedGoodInclude.where.type = productType;
            }

            if (search) {
                finishedGoodInclude.where[Op.or] = [
                    { fgCode: { [Op.iLike]: `%${search}%` } },
                    { name: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // 🔥 Build include array with proper includes
            const include = [
                finishedGoodInclude,
                {
                    model: FormulationDetail,
                    as: 'details',
                    include: [
                        {
                            model: Item,
                            as: 'item',
                            attributes: [
                                'itemId', 'code', 'name', 'costPrice',
                                'conversionUomId', 'conversionValue', 'uomId'
                            ],
                            include: [
                                {
                                    model: UOM,
                                    as: 'uom',
                                    attributes: ['uomId', 'code', 'name']
                                },
                                {
                                    model: UOM,
                                    as: 'conversionUom',
                                    attributes: ['uomId', 'code', 'name']
                                }
                            ]
                        },
                        {
                            model: UOM,
                            as: 'uom',
                            attributes: ['uomId', 'code', 'name']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'createdByUser',
                    attributes: ['userId', 'username', 'fullName']
                },
                {
                    model: User,
                    as: 'updatedByUser',
                    attributes: ['userId', 'username', 'fullName']
                }
            ];

            // 🔥 Execute query
            const { count, rows } = await Formulation.findAndCountAll({
                where,
                include,
                order,
                offset,
                limit: parseInt(limit),
                distinct: true
            });

            // 🔥 Transform data
            const formulations = rows.map(f => f.getFullData());

            res.status(200).json({
                success: true,
                data: formulations,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / parseInt(limit))
                },
                filters: {
                    search: search || null,
                    status: status || null,
                    productType: productType || null,
                    finishedGoodId: finishedGoodId || null
                }
            });

        } catch (error) {
            console.error('Error getting formulations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get formulations',
                error: error.message
            });
        }
    }

    // ================================================================
    // GET FORMULATION BY ID
    // ================================================================
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const formulation = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        attributes: ['id', 'fgCode', 'name', 'type', 'status']
                    },
                    {
                        model: FormulationDetail,
                        as: 'details',
                        include: [
                            {
                                model: Item,
                                as: 'item',
                                attributes: [
                                    'itemId', 'code', 'name', 'costPrice',
                                    'conversionUomId', 'conversionValue', 'uomId'
                                ],
                                include: [
                                    {
                                        model: UOM,
                                        as: 'uom',
                                        attributes: ['uomId', 'code', 'name']
                                    },
                                    {
                                        model: UOM,
                                        as: 'conversionUom',
                                        attributes: ['uomId', 'code', 'name']
                                    }
                                ]
                            },
                            {
                                model: UOM,
                                as: 'uom',
                                attributes: ['uomId', 'code', 'name']
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'createdByUser',
                        attributes: ['userId', 'username', 'fullName']
                    },
                    {
                        model: User,
                        as: 'updatedByUser',
                        attributes: ['userId', 'username', 'fullName']
                    }
                ]
            });

            if (!formulation) {
                return res.status(404).json({
                    success: false,
                    message: 'Formulation not found'
                });
            }

            res.status(200).json({
                success: true,
                data: formulation.getFullData()
            });

        } catch (error) {
            console.error('Error getting formulation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get formulation',
                error: error.message
            });
        }
    }

    // ================================================================
    // CREATE FORMULATION
    // ================================================================
    static async create(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                finishedGoodId,
                status = 'Draft',
                description,
                rawMaterials
            } = req.body;

            const userId = req.user?.userId || null;

            // ✅ Validate finished good exists
            const finishedGood = await FinishedGood.findByPk(finishedGoodId, {
                attributes: ['id', 'fgCode', 'name', 'type'],
                transaction
            });

            if (!finishedGood) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Finished good not found'
                });
            }

            // ✅ Validate raw materials
            if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'At least one raw material is required'
                });
            }

            // ✅ Check for duplicate items in the request
            const itemIds = rawMaterials.map(m => m.itemId);
            if (new Set(itemIds).size !== itemIds.length) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate raw materials detected in the request'
                });
            }

            // ✅ Check if formulation already exists for this finished good
            const existing = await Formulation.findOne({
                where: { finishedGoodId },
                transaction
            });

            if (existing) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'A formulation already exists for this finished good. Use update instead.',
                    existingId: existing.id
                });
            }

            // ✅ Validate all items exist and get their data
            const itemIdsToCheck = rawMaterials.map(m => m.itemId);
            const items = await Item.findAll({
                where: { itemId: itemIdsToCheck },
                attributes: ['itemId', 'name', 'uomId', 'costPrice'],
                transaction
            });

            if (items.length !== itemIdsToCheck.length) {
                const foundIds = items.map(i => i.itemId);
                const missingIds = itemIdsToCheck.filter(id => !foundIds.includes(id));
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Items not found: ${missingIds.join(', ')}`
                });
            }

            // ✅ Validate quantities
            for (const material of rawMaterials) {
                if (!material.quantity || material.quantity <= 0) {
                    const item = items.find(i => i.itemId === material.itemId);
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Invalid quantity for item ${item?.name || material.itemId}. Quantity must be greater than 0.`
                    });
                }
            }

            // ✅ Create formulation
            const formulation = await Formulation.create({
                finishedGoodId,
                status,
                description: description || '',
                version: 1,
                createdBy: userId,
                updatedBy: userId
            }, { transaction });

            // ✅ Create formulation details
            const details = rawMaterials.map(material => {
                const item = items.find(i => i.itemId === material.itemId);
                return {
                    formulationId: formulation.id,
                    itemId: material.itemId,
                    quantity: material.quantity,
                    uomId: material.uomId || item.uomId
                };
            });

            await FormulationDetail.bulkCreate(details, { 
                transaction,
                validate: true
            });

            await transaction.commit();

            // ✅ Fetch created formulation with all details
            const created = await Formulation.findByPk(formulation.id, {
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        attributes: ['id', 'fgCode', 'name', 'type']
                    },
                    {
                        model: FormulationDetail,
                        as: 'details',
                        include: [
                            {
                                model: Item,
                                as: 'item',
                                attributes: [
                                    'itemId', 'code', 'name', 'costPrice',
                                    'conversionUomId', 'conversionValue', 'uomId'
                                ],
                                include: [
                                    {
                                        model: UOM,
                                        as: 'uom',
                                        attributes: ['uomId', 'code', 'name']
                                    },
                                    {
                                        model: UOM,
                                        as: 'conversionUom',
                                        attributes: ['uomId', 'code', 'name']
                                    }
                                ]
                            },
                            {
                                model: UOM,
                                as: 'uom',
                                attributes: ['uomId', 'code', 'name']
                            }
                        ]
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Formulation created successfully',
                data: created.getFullData()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error creating formulation:', error);
            
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate item detected in formulation details',
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create formulation',
                error: error.message
            });
        }
    }

    // ================================================================
    // UPDATE FORMULATION - FIXED FOR ACTIVE -> INACTIVE
    // ================================================================
    static async update(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const {
                finishedGoodId,
                status,
                description,
                rawMaterials
            } = req.body;

            const userId = req.user?.userId || null;

            // ✅ Find formulation
            const formulation = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FormulationDetail,
                        as: 'details'
                    }
                ],
                transaction
            });

            if (!formulation) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Formulation not found'
                });
            }

            // ✅ Get the current status before update
            const currentStatus = formulation.status;
            const isChangingToInactive = status === 'Inactive' && currentStatus !== 'Inactive';
            const isChangingFromInactive = currentStatus === 'Inactive' && status !== 'Inactive';

            // ✅ If changing FROM Inactive, allow it (reactivating)
            // ✅ If changing TO Inactive, allow it (deactivating)
            // ✅ If staying Inactive and trying to edit, block it
            if (currentStatus === 'Inactive' && !isChangingFromInactive) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Inactive formulations cannot be edited. Please change status to Draft first.'
                });
            }

            // ✅ Validate finished good if changing
            if (finishedGoodId && finishedGoodId !== formulation.finishedGoodId) {
                const finishedGood = await FinishedGood.findByPk(finishedGoodId, {
                    attributes: ['id', 'fgCode', 'name', 'type'],
                    transaction
                });

                if (!finishedGood) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Finished good not found'
                    });
                }

                formulation.finishedGoodId = finishedGoodId;
            }

            // ✅ Update status if provided
            if (status && status !== formulation.status) {
                // Check if activating with no materials
                if (status === 'Active' && formulation.details.length === 0) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot activate formulation with no raw materials'
                    });
                }
                formulation.status = status;
            }

            // ✅ Update description
            if (description !== undefined) {
                formulation.description = description;
            }

            formulation.updatedBy = userId;
            await formulation.save({ transaction });

            // ✅ Handle raw materials update based on status change
            // Case 1: Changing TO Inactive - Preserve materials, don't update
            // Case 2: Changing FROM Inactive - Allow material update
            // Case 3: Staying Active or Draft - Allow material update
            // Case 4: rawMaterials not provided - Don't change materials
            
            const shouldUpdateMaterials = rawMaterials && 
                                         !isChangingToInactive && 
                                         currentStatus !== 'Inactive';

            if (shouldUpdateMaterials) {
                if (!Array.isArray(rawMaterials) || rawMaterials.length === 0) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'At least one raw material is required'
                    });
                }

                const itemIds = rawMaterials.map(m => m.itemId);
                if (new Set(itemIds).size !== itemIds.length) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Duplicate raw materials detected in the request'
                    });
                }

                const items = await Item.findAll({
                    where: { itemId: itemIds },
                    attributes: ['itemId', 'name', 'uomId', 'costPrice'],
                    transaction
                });

                if (items.length !== itemIds.length) {
                    const foundIds = items.map(i => i.itemId);
                    const missingIds = itemIds.filter(id => !foundIds.includes(id));
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Items not found: ${missingIds.join(', ')}`
                    });
                }

                for (const material of rawMaterials) {
                    if (!material.quantity || material.quantity <= 0) {
                        const item = items.find(i => i.itemId === material.itemId);
                        await transaction.rollback();
                        return res.status(400).json({
                            success: false,
                            message: `Invalid quantity for item ${item?.name || material.itemId}`
                        });
                    }
                }

                // Delete existing details
                await FormulationDetail.destroy({
                    where: { formulationId: id },
                    transaction
                });

                // Create new details
                const details = rawMaterials.map(material => {
                    const item = items.find(i => i.itemId === material.itemId);
                    return {
                        formulationId: id,
                        itemId: material.itemId,
                        quantity: material.quantity,
                        uomId: material.uomId || item.uomId
                    };
                });

                await FormulationDetail.bulkCreate(details, {
                    transaction,
                    validate: true
                });
            } else if (isChangingToInactive) {
                // ✅ When changing to Inactive, keep the materials
                // Just log it - materials are preserved
                console.log(`📝 Formulation ${id} changed to Inactive. Materials preserved.`);
            } else if (currentStatus === 'Inactive' && isChangingFromInactive) {
                // ✅ When changing from Inactive to Draft/Active
                // If rawMaterials provided, update them
                if (rawMaterials && rawMaterials.length > 0) {
                    // Process materials update (handled above)
                    // This will re-insert materials when reactivating
                }
            }

            await transaction.commit();

            // ✅ Fetch updated formulation
            const updated = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        attributes: ['id', 'fgCode', 'name', 'type']
                    },
                    {
                        model: FormulationDetail,
                        as: 'details',
                        include: [
                            {
                                model: Item,
                                as: 'item',
                                attributes: [
                                    'itemId', 'code', 'name', 'costPrice',
                                    'conversionUomId', 'conversionValue', 'uomId'
                                ],
                                include: [
                                    {
                                        model: UOM,
                                        as: 'uom',
                                        attributes: ['uomId', 'code', 'name']
                                    },
                                    {
                                        model: UOM,
                                        as: 'conversionUom',
                                        attributes: ['uomId', 'code', 'name']
                                    }
                                ]
                            },
                            {
                                model: UOM,
                                as: 'uom',
                                attributes: ['uomId', 'code', 'name']
                            }
                        ]
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Formulation updated successfully',
                data: updated.getFullData()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error updating formulation:', error);
            
            // ✅ Check for specific error messages
            if (error.message && error.message.includes('Cannot add details to a Inactive formulation')) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot modify materials of an Inactive formulation. Please change status to Draft first.'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update formulation',
                error: error.message
            });
        }
    }

    // ================================================================
    // DELETE FORMULATION
    // ================================================================
    static async delete(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            const formulation = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FormulationDetail,
                        as: 'details'
                    }
                ],
                transaction
            });

            if (!formulation) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Formulation not found'
                });
            }

            if (!formulation.isDeletable()) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only Draft formulations can be deleted. Please set status to Draft first.'
                });
            }

            await FormulationDetail.destroy({
                where: { formulationId: id },
                transaction
            });

            await formulation.destroy({ transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Formulation deleted successfully'
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting formulation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete formulation',
                error: error.message
            });
        }
    }

    // ================================================================
    // GET FORMULATION VERSIONS
    // ================================================================
    static async getVersions(req, res) {
        try {
            const { finishedGoodId } = req.params;

            const formulations = await Formulation.findAll({
                where: { finishedGoodId },
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        attributes: ['id', 'fgCode', 'name', 'type']
                    },
                    {
                        model: User,
                        as: 'createdByUser',
                        attributes: ['userId', 'username', 'fullName']
                    },
                    {
                        model: FormulationDetail,
                        as: 'details',
                        attributes: ['id', 'quantity']
                    }
                ],
                order: [['version', 'DESC']]
            });

            if (formulations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No formulations found for this finished good'
                });
            }

            const data = formulations.map(f => ({
                id: f.id,
                version: f.version,
                status: f.status,
                description: f.description,
                totalMaterials: f.details?.length || 0,
                createdAt: f.createdAt,
                createdBy: f.createdByUser?.fullName || 'System',
                isLatest: f.version === formulations[0].version
            }));

            res.status(200).json({
                success: true,
                data: data,
                finishedGood: {
                    id: formulations[0].finishedGood.id,
                    fgCode: formulations[0].finishedGood.fgCode,
                    name: formulations[0].finishedGood.name,
                    type: formulations[0].finishedGood.type
                }
            });

        } catch (error) {
            console.error('Error getting formulation versions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get formulation versions',
                error: error.message
            });
        }
    }

    // ================================================================
    // GET FORMULATION STATS
    // ================================================================
    static async getStats(req, res) {
        try {
            const stats = await Formulation.getStats();

            const allFormulations = await Formulation.findAll({
                include: [
                    {
                        model: FormulationDetail,
                        as: 'details',
                        include: [
                            {
                                model: Item,
                                as: 'item',
                                attributes: ['costPrice']
                            }
                        ]
                    }
                ]
            });

            let totalCost = 0;
            let totalMaterialsUsed = 0;

            allFormulations.forEach(f => {
                f.details.forEach(d => {
                    totalCost += d.quantity * (d.item?.costPrice || 0);
                    totalMaterialsUsed += d.quantity;
                });
            });

            const paintCount = await Formulation.count({
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        where: { type: 'Paint' }
                    }
                ]
            });

            const fiberCount = await Formulation.count({
                include: [
                    {
                        model: FinishedGood,
                        as: 'finishedGood',
                        where: { type: 'Fiber' }
                    }
                ]
            });

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    paintCount,
                    fiberCount,
                    totalCost: Math.round(totalCost * 100) / 100,
                    totalMaterialsUsed: Math.round(totalMaterialsUsed * 100) / 100
                }
            });

        } catch (error) {
            console.error('Error getting formulation stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get statistics',
                error: error.message
            });
        }
    }

    // ================================================================
    // BULK IMPORT FORMULATIONS
    // ================================================================
    static async bulkImport(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { formulations } = req.body;
            const userId = req.user?.userId || null;

            if (!formulations || !Array.isArray(formulations) || formulations.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'No formulations data provided'
                });
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [],
                created: []
            };

            for (const formData of formulations) {
                try {
                    if (!formData.finishedGoodId) {
                        results.failed++;
                        results.errors.push('Missing finishedGoodId in one of the formulations');
                        continue;
                    }

                    if (!formData.rawMaterials || formData.rawMaterials.length === 0) {
                        results.failed++;
                        results.errors.push(`No raw materials for finished good ${formData.finishedGoodId}`);
                        continue;
                    }

                    const existing = await Formulation.findOne({
                        where: { finishedGoodId: formData.finishedGoodId },
                        transaction
                    });

                    if (existing) {
                        results.failed++;
                        results.errors.push(`Formulation already exists for finished good ${formData.finishedGoodId}`);
                        continue;
                    }

                    const formulation = await Formulation.create({
                        finishedGoodId: formData.finishedGoodId,
                        status: formData.status || 'Draft',
                        description: formData.description || '',
                        version: 1,
                        createdBy: userId,
                        updatedBy: userId
                    }, { transaction });

                    const details = formData.rawMaterials.map(m => ({
                        formulationId: formulation.id,
                        itemId: m.itemId,
                        quantity: m.quantity,
                        uomId: m.uomId
                    }));

                    await FormulationDetail.bulkCreate(details, {
                        transaction,
                        validate: true
                    });

                    results.success++;
                    results.created.push(formulation.id);

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Failed to import formulation: ${error.message}`);
                }
            }

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: `Import completed: ${results.success} successful, ${results.failed} failed`,
                data: results
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error importing formulations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to import formulations',
                error: error.message
            });
        }
    }

    // ================================================================
    // GET RAW MATERIALS FOR FORMULATION
    // ================================================================
    static async getMaterials(req, res) {
        try {
            const { id } = req.params;

            const formulation = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FormulationDetail,
                        as: 'details',
                        include: [
                            {
                                model: Item,
                                as: 'item',
                                attributes: [
                                    'itemId', 'code', 'name', 'costPrice',
                                    'conversionUomId', 'conversionValue', 'uomId'
                                ],
                                include: [
                                    {
                                        model: UOM,
                                        as: 'uom',
                                        attributes: ['uomId', 'code', 'name']
                                    },
                                    {
                                        model: UOM,
                                        as: 'conversionUom',
                                        attributes: ['uomId', 'code', 'name']
                                    }
                                ]
                            },
                            {
                                model: UOM,
                                as: 'uom',
                                attributes: ['uomId', 'code', 'name']
                            }
                        ]
                    }
                ]
            });

            if (!formulation) {
                return res.status(404).json({
                    success: false,
                    message: 'Formulation not found'
                });
            }

            const materials = formulation.details.map(d => ({
                id: d.id,
                itemId: d.itemId,
                itemCode: d.item?.code,
                itemName: d.item?.name,
                quantity: d.quantity,
                uomId: d.uomId,
                uomCode: d.uom?.code,
                uomName: d.uom?.name,
                costPrice: d.item?.costPrice || 0,
                totalCost: d.quantity * (d.item?.costPrice || 0),
                conversionUomId: d.item?.conversionUomId,
                conversionUomCode: d.item?.conversionUom?.code,
                conversionValue: d.item?.conversionValue || 0
            }));

            res.status(200).json({
                success: true,
                data: materials,
                total: materials.length,
                totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0)
            });

        } catch (error) {
            console.error('Error getting formulation materials:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get materials',
                error: error.message
            });
        }
    }

    // ================================================================
    // UPDATE FORMULATION STATUS ONLY
    // ================================================================
    static async updateStatus(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user?.userId || null;

            if (!status) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            if (!['Draft', 'Active', 'Inactive'].includes(status)) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be Draft, Active, or Inactive'
                });
            }

            const formulation = await Formulation.findByPk(id, {
                include: [
                    {
                        model: FormulationDetail,
                        as: 'details'
                    }
                ],
                transaction
            });

            if (!formulation) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Formulation not found'
                });
            }

            // ✅ Check if activating with no materials
            if (status === 'Active' && formulation.details.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Cannot activate formulation with no raw materials'
                });
            }

            const previousStatus = formulation.status;
            formulation.status = status;
            formulation.updatedBy = userId;
            await formulation.save({ transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: `Formulation status updated from ${previousStatus} to ${status}`,
                data: {
                    id: formulation.id,
                    status: formulation.status,
                    previousStatus: previousStatus
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error updating formulation status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update status',
                error: error.message
            });
        }
    }
}

module.exports = FormulationController;