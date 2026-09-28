// services/userStoreService.js
const { User, Group, Store, StoreGroupRelation, UserGroupRelation } = require('../models');
const { Op } = require('sequelize');

class UserStoreService {
  /**
   * Get all stores a user has access to via their groups
   * Returns ALL stores with their respective groups
   */
  async getUserStores(username) {
    console.log('========================================');
    console.log('🔍 getUserStores called with username:', username);
    console.log('========================================');

    try {
      // 1. Find the user
      console.log('📌 Step 1: Finding user...');
      const user = await User.findOne({
        where: { 
          username: username,
          isActive: true 
        },
        attributes: ['userId', 'username', 'fullName', 'email', 'isActive']
      });

      if (!user) {
        console.log('❌ User not found:', username);
        return { success: false, error: 'User not found' };
      }

      console.log('✅ User found:', {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      });

      // 2. Get all groups the user belongs to
      console.log('📌 Step 2: Getting user groups...');
      const userGroupRelations = await UserGroupRelation.findAll({
        where: { userId: user.userId },
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'code', 'description', 'status']
          }
        ]
      });

      console.log(`📊 Found ${userGroupRelations.length} group relations for user:`);
      userGroupRelations.forEach((ug, index) => {
        console.log(`  ${index + 1}. Group ID: ${ug.groupId}, Group Name: ${ug.group?.name || 'N/A'}`);
      });

      if (userGroupRelations.length === 0) {
        console.log('⚠️ User has no groups');
        return { 
          success: true, 
          data: {
            user: {
              userId: user.userId,
              username: user.username,
              fullName: user.fullName
            },
            stores: [],
            hasAccess: false
          }
        };
      }

      // 3. Get all group IDs the user belongs to
      const userGroupIds = userGroupRelations.map(ug => ug.groupId);
      console.log(`📌 Step 3: User group IDs: [${userGroupIds.join(', ')}]`);
      
      // 4. Find ALL StoreGroupRelations for these groups
      console.log('📌 Step 4: Finding store-group relations for these groups...');
      const storeGroupRelations = await StoreGroupRelation.findAll({
        where: { 
          groupId: { [Op.in]: userGroupIds }
        },
        include: [
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'storeId', 'name', 'code', 'location', 'status']
          },
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'code', 'description', 'status']
          }
        ]
      });

      console.log(`📊 Found ${storeGroupRelations.length} store-group relations:`);
      storeGroupRelations.forEach((rel, index) => {
        console.log(`  ${index + 1}. Group ID: ${rel.groupId}, Group Name: ${rel.group?.name || 'N/A'}, Store ID: ${rel.storeId}, Store Name: ${rel.store?.name || 'N/A'}`);
      });

      if (storeGroupRelations.length === 0) {
        console.log('⚠️ No store-group relations found for user groups');
        return { 
          success: true, 
          data: {
            user: {
              userId: user.userId,
              username: user.username,
              fullName: user.fullName
            },
            stores: [],
            hasAccess: false
          }
        };
      }

      // 5. Build the store → groups mapping using storeId
      console.log('📌 Step 5: Building store → groups mapping...');
      const storeMap = new Map();

      storeGroupRelations.forEach(rel => {
        const storeData = rel.store;
        const groupData = rel.group;
        
        const storeId = rel.storeId;
        const groupId = rel.groupId;
        
        console.log(`  Processing: Group ${groupId} (${groupData?.name || 'N/A'}) → Store ${storeId} (${storeData?.name || 'N/A'})`);
        
        if (storeData && storeData.status === 'Active') {
          if (!storeMap.has(storeId)) {
            console.log(`    ✅ Creating new store entry: Store ID ${storeId}, Name: ${storeData.name}`);
            storeMap.set(storeId, {
              storeId: storeId,
              name: storeData.name,
              code: storeData.code,
              location: storeData.location,
              status: storeData.status,
              groups: []
            });
          } else {
            console.log(`    📝 Adding to existing store: Store ID ${storeId}, Name: ${storeData.name}`);
          }
          
          if (groupData) {
            const storeEntry = storeMap.get(storeId);
            storeEntry.groups.push({
              groupId: groupId,
              groupName: groupData.name,
              groupCode: groupData.code,
              description: groupData.description,
              status: groupData.status
            });
            console.log(`      ✅ Added group ${groupId} (${groupData.name}) to store ${storeId}`);
          }
        } else {
          console.log(`    ⚠️ Store not active or not found for group ${groupId}`);
        }
      });

      const stores = Array.from(storeMap.values());

      console.log('📌 Step 6: Final stores array:');
      console.log(`  Total stores: ${stores.length}`);
      stores.forEach((store, index) => {
        console.log(`  Store ${index + 1}:`);
        console.log(`    storeId: ${store.storeId}`);
        console.log(`    name: ${store.name}`);
        console.log(`    code: ${store.code}`);
        console.log(`    location: ${store.location}`);
        console.log(`    status: ${store.status}`);
        console.log(`    groups (${store.groups.length}):`);
        store.groups.forEach((group, gIndex) => {
          console.log(`      ${gIndex + 1}. groupId: ${group.groupId}, groupName: ${group.groupName}, groupCode: ${group.groupCode}`);
        });
        console.log('  ---');
      });

      console.log('✅ getUserStores completed successfully!');
      console.log('========================================');

      return {
        success: true,
        data: {
          user: {
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            email: user.email
          },
          stores: stores,
          hasAccess: stores.length > 0
        }
      };
    } catch (error) {
      console.error('❌ Error in getUserStores:', error);
      console.error('❌ Error stack:', error.stack);
      console.log('========================================');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's groups for a specific store
   */
  async getUserGroupsForStore(userId, storeId) {
    console.log('🔍 getUserGroupsForStore called with userId:', userId, 'storeId:', storeId);
    try {
      const userGroups = await UserGroupRelation.findAll({
        where: { userId: userId },
        attributes: ['groupId']
      });
      
      const groupIds = userGroups.map(ug => ug.groupId);
      console.log(`  User group IDs: [${groupIds.join(', ')}]`);
      
      if (groupIds.length === 0) {
        console.log('  No groups found for user');
        return { success: true, data: [] };
      }

      const storeGroupRelations = await StoreGroupRelation.findAll({
        where: {
          storeId: storeId,
          groupId: { [Op.in]: groupIds }
        },
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'code', 'description', 'status']
          }
        ]
      });

      const groups = storeGroupRelations.map(rel => {
        const group = rel.group;
        // Extract ID properly from Sequelize model
        let groupId = null;
        if (group) {
          if (group.dataValues && group.dataValues.id) {
            groupId = group.dataValues.id;
          } else if (group.id) {
            groupId = group.id;
          }
        }
        return {
          id: groupId,
          groupId: groupId,
          name: group?.dataValues?.name || group?.name || '',
          code: group?.dataValues?.code || group?.code || '',
          description: group?.dataValues?.description || group?.description || '',
          status: group?.dataValues?.status || group?.status || 'Active'
        };
      });

      console.log(`  Found ${groups.length} groups for store ${storeId}`);
      console.log('  Groups:', groups.map(g => ({ id: g.id, name: g.name })));

      return {
        success: true,
        data: groups
      };
    } catch (error) {
      console.error('❌ Error in getUserGroupsForStore:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify user has access to a specific store and get their groups
   */
  async verifyStoreAccess(userId, storeId) {
    try {
      console.log('🔍 verifyStoreAccess called with userId:', userId, 'storeId:', storeId);
      
      // 1. Get user's groups
      const userGroups = await UserGroupRelation.findAll({
        where: { userId: userId },
        attributes: ['groupId']
      });

      const groupIds = userGroups.map(ug => ug.groupId);
      console.log('  User group IDs:', groupIds);

      if (groupIds.length === 0) {
        return { 
          success: false, 
          error: 'User has no groups',
          hasAccess: false 
        };
      }

      // 2. Check which of the user's groups belong to this store
      const storeGroupRelations = await StoreGroupRelation.findAll({
        where: {
          storeId: storeId,
          groupId: { [Op.in]: groupIds }
        },
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'code', 'description', 'status']
          }
        ]
      });

      console.log('  Found store-group relations:', storeGroupRelations.length);

      if (storeGroupRelations.length === 0) {
        return {
          success: true,
          hasAccess: false,
          groups: [],
          primaryGroup: null
        };
      }

      // 3. ✅ Extract groups with proper IDs - FIXED for Sequelize models
      const groups = storeGroupRelations.map(rel => {
        const group = rel.group;
        
        // ✅ Get the ID properly from Sequelize model
        let groupId = null;
        if (group) {
          // Check if it's a Sequelize model with dataValues
          if (group.dataValues && group.dataValues.id) {
            groupId = group.dataValues.id;
          } else if (group.id) {
            groupId = group.id;
          }
        }
        
        console.log('  Processing group:', { 
          groupId: groupId, 
          groupName: group?.dataValues?.name || group?.name,
          rawGroup: group 
        });
        
        return {
          id: groupId,           // ✅ Set id from group.dataValues.id or group.id
          groupId: groupId,      // ✅ Also set groupId for compatibility
          name: group?.dataValues?.name || group?.name || '',
          code: group?.dataValues?.code || group?.code || '',
          description: group?.dataValues?.description || group?.description || '',
          status: group?.dataValues?.status || group?.status || 'Active'
        };
      });

      console.log('  Groups found:', groups.map(g => ({ id: g.id, name: g.name })));

      return {
        success: true,
        hasAccess: true,
        groups: groups,
        primaryGroup: groups[0] || null
      };
    } catch (error) {
      console.error('❌ Error in verifyStoreAccess:', error);
      return { 
        success: false, 
        error: error.message,
        hasAccess: false 
      };
    }
  }
}

module.exports = new UserStoreService();