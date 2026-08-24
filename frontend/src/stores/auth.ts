// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from './interceptor'

// ==================== TYPES ====================
export type UserRole = string

export interface User {
  userId: number
  username: string
  fullName: string
  email: string
  role: UserRole
  roleId: number
  departmentId: number | null
  departmentName?: string
  isActive: boolean
  profilePicture?: string
  profilePictureUrl?: string
  lastLogin?: string
  employeeCode?: string
  firstName?: string
  lastName?: string
  fullEmployeeName?: string
  departmentCode?: string
  // 🔥 Store and Group fields
  storeId?: number | null
  groupId?: number | null
  storeName?: string | null
  groupName?: string | null
  assignedStore?: {
    id: number
    name: string
    code: string
    location?: string
  } | null
  assignedGroup?: {
    id: number
    name: string
    code: string
  } | null
  stores?: Array<{
    id: number
    name: string
    code: string
    groupId?: number
    groupName?: string
  }>
  groups?: Array<{
    id: number
    name: string
    code: string
  }>
  // 🔥 ADD THESE - From login response
  currentStore?: {
    id: number
    name: string
    code: string
    location?: string
  } | null
  currentGroup?: {
    id: number
    name: string
    code: string
  } | null
  groupsForStore?: Array<{
    id: number
    name: string
    code: string
    description?: string
    status?: string
  }>
  accessibleStores?: Array<{
    id: number
    name: string
    code: string
    location?: string
    status?: string
    groups: Array<{
      groupId: number
      groupName: string
      groupCode: string
    }>
  }>
  hasMultipleStores?: boolean
  isAdmin?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // ==================== STATE ====================
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoggedOut = ref(false)
  const availableRoles = ref<string[]>([])

  // ==================== GETTERS ====================
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  const userRole = computed(() => {
    return user.value?.role || 'employee'
  })
  
  const userFullName = computed(() => {
    if (!user.value) return 'User'
    return (
      user.value.fullEmployeeName ||
      user.value.fullName ||
      (user.value.firstName && user.value.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : 'User')
    )
  })
  
  const userAvatar = computed(() => user.value?.profilePicture || user.value?.profilePictureUrl || null)

  // ================================================================
  // 🔥 FIXED: Get store and group IDs - Check currentStore FIRST
  // ================================================================
  const userStoreId = computed(() => {
    const userData = user.value;
    if (!userData) return null;
    
    console.log('🔍 userStoreId computed - checking sources:', {
      hasCurrentStore: !!userData.currentStore,
      currentStoreId: userData.currentStore?.id,
      hasAssignedStore: !!userData.assignedStore,
      assignedStoreId: userData.assignedStore?.id,
      storeId: userData.storeId,
      hasStores: !!userData.stores,
      storesLength: userData.stores?.length
    });
    
    // ✅ Check currentStore FIRST (this has the correct data from backend)
    if (userData.currentStore?.id) {
      console.log('✅ Found storeId from currentStore:', userData.currentStore.id);
      return userData.currentStore.id;
    }
    
    // Then check assignedStore
    if (userData.assignedStore?.id) {
      console.log('✅ Found storeId from assignedStore:', userData.assignedStore.id);
      return userData.assignedStore.id;
    }
    
    // Then check direct storeId
    if (userData.storeId) {
      console.log('✅ Found storeId from storeId:', userData.storeId);
      return userData.storeId;
    }
    
    // Last resort - stores array
    if (userData.stores && userData.stores.length > 0) {
      const firstStore = userData.stores[0];
      if (firstStore?.id) {
        console.log('✅ Found storeId from stores array:', firstStore.id);
        return firstStore.id;
      }
    }
    
    console.log('❌ No storeId found in any source');
    return null;
  })

  const userGroupId = computed(() => {
    const userData = user.value;
    if (!userData) return null;
    
    // ✅ Check currentGroup FIRST (this has the correct data from backend)
    if (userData.currentGroup?.id) {
      console.log('✅ Found groupId from currentGroup:', userData.currentGroup.id);
      return userData.currentGroup.id;
    }
    
    // Then check assignedGroup
    if (userData.assignedGroup?.id) {
      console.log('✅ Found groupId from assignedGroup:', userData.assignedGroup.id);
      return userData.assignedGroup.id;
    }
    
    // Then check direct groupId
    if (userData.groupId) {
      console.log('✅ Found groupId from groupId:', userData.groupId);
      return userData.groupId;
    }
    
    // Last resort - groups array
    if (userData.groups && userData.groups.length > 0) {
      const firstGroup = userData.groups[0];
      if (firstGroup?.id) {
        console.log('✅ Found groupId from groups array:', firstGroup.id);
        return firstGroup.id;
      }
    }
    
    console.log('❌ No groupId found in any source');
    return null;
  })

  // ==================== ACTIONS ====================
  const clearAuthData = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    availableRoles.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
    isLoggedOut.value = true
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles')
      if (response.data.success) {
        availableRoles.value = response.data.roles
      }
    } catch (error) {
      console.warn('Failed to fetch roles from backend', error)
      availableRoles.value = ['admin', 'hr', 'finance', 'employee', 'attendance', 'store', 'checker']
    }
  }

  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (!parsedUser.role) {
          parsedUser.role = 'employee'
        }
        user.value = parsedUser
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        isLoggedOut.value = false
        fetchRoles()
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        clearAuthData()
      }
    }
  }

  // ================================================================
  // setUserStoreAndGroup - Enhanced with better logging
  // ================================================================
  const setUserStoreAndGroup = (userData: any) => {
    if (!userData || !user.value) {
      console.warn('⚠️ setUserStoreAndGroup: No user data or user.value is null');
      return;
    }

    console.log('🔧 setUserStoreAndGroup called with:', {
      storeId: userData.storeId,
      groupId: userData.groupId,
      storeName: userData.storeName,
      groupName: userData.groupName,
      hasCurrentStore: !!userData.currentStore,
      currentStoreData: userData.currentStore,
      hasCurrentGroup: !!userData.currentGroup,
      currentGroupData: userData.currentGroup,
      hasAssignedStore: !!userData.assignedStore,
      hasAssignedGroup: !!userData.assignedGroup,
      isAdmin: userData.isAdmin
    });

    // ================================================================
    // 1. EXTRACT STORE ID - Check ALL possible sources
    // ================================================================
    let storeId = userData.storeId || 
                  userData.currentStore?.id || 
                  userData.assignedStore?.id ||
                  userData.store?.id ||
                  (userData.stores && userData.stores.length > 0 ? userData.stores[0]?.id : null) ||
                  null;

    // ================================================================
    // 2. EXTRACT GROUP ID - Check ALL possible sources
    // ================================================================
    let groupId = userData.groupId || 
                  userData.currentGroup?.id || 
                  userData.assignedGroup?.id ||
                  userData.group?.id ||
                  (userData.groups && userData.groups.length > 0 ? userData.groups[0]?.id : null) ||
                  (userData.groupsForStore && userData.groupsForStore.length > 0 ? userData.groupsForStore[0]?.id : null) ||
                  null;

    // ================================================================
    // 3. EXTRACT NAMES
    // ================================================================
    let storeName = userData.storeName || 
                    userData.currentStore?.name || 
                    userData.assignedStore?.name ||
                    userData.store?.name ||
                    (userData.stores && userData.stores.length > 0 ? userData.stores[0]?.name : null) ||
                    null;

    let groupName = userData.groupName || 
                    userData.currentGroup?.name || 
                    userData.assignedGroup?.name ||
                    userData.group?.name ||
                    (userData.groups && userData.groups.length > 0 ? userData.groups[0]?.name : null) ||
                    (userData.groupsForStore && userData.groupsForStore.length > 0 ? userData.groupsForStore[0]?.name : null) ||
                    null;

    // ================================================================
    // 4. GET STORE AND GROUP OBJECTS
    // ================================================================
    const storeObj = userData.currentStore || userData.assignedStore || userData.store;
    const groupObj = userData.currentGroup || userData.assignedGroup || userData.group;

    console.log('📦 Extracted values:', { 
      storeId, 
      groupId, 
      storeName, 
      groupName,
      hasStoreObj: !!storeObj,
      hasGroupObj: !!groupObj
    });

    // ================================================================
    // 5. UPDATE USER OBJECT
    // ================================================================
    if (user.value) {
      // ✅ Primary fields
      user.value.storeId = storeId;
      user.value.groupId = groupId;
      user.value.storeName = storeName;
      user.value.groupName = groupName;
      
      // ✅ Preserve currentStore from server data
      if (userData.currentStore) {
        user.value.currentStore = {
          id: userData.currentStore.id,
          name: userData.currentStore.name,
          code: userData.currentStore.code || '',
          location: userData.currentStore.location || ''
        };
        console.log('✅ Set currentStore with ID:', user.value.currentStore.id);
      }
      
      // ✅ Preserve currentGroup from server data
      if (userData.currentGroup) {
        user.value.currentGroup = {
          id: userData.currentGroup.id,
          name: userData.currentGroup.name,
          code: userData.currentGroup.code || ''
        };
        console.log('✅ Set currentGroup with ID:', user.value.currentGroup.id);
      }
      
      // ✅ Ensure assignedStore exists with correct ID
      if (storeObj && !user.value.assignedStore) {
        user.value.assignedStore = {
          id: storeId || storeObj.id,
          name: storeObj.name || storeName || 'Unknown Store',
          code: storeObj.code || '',
          location: storeObj.location || ''
        };
      } else if (user.value.assignedStore && storeId) {
        user.value.assignedStore.id = storeId;
        if (storeName) user.value.assignedStore.name = storeName;
      }

      // ✅ Ensure assignedGroup exists with correct ID
      if (groupObj && !user.value.assignedGroup) {
        user.value.assignedGroup = {
          id: groupId || groupObj.id,
          name: groupObj.name || groupName || 'Unknown Group',
          code: groupObj.code || ''
        };
      } else if (user.value.assignedGroup && groupId) {
        user.value.assignedGroup.id = groupId;
        if (groupName) user.value.assignedGroup.name = groupName;
      }

      // ✅ Set stores array if available
      if (userData.stores && userData.stores.length > 0) {
        user.value.stores = userData.stores;
      } else if (storeObj && !user.value.stores) {
        user.value.stores = [{
          id: storeId || storeObj.id,
          name: storeObj.name || storeName || 'Unknown Store',
          code: storeObj.code || ''
        }];
      }

      // ✅ Set groups array if available
      if (userData.groups && userData.groups.length > 0) {
        user.value.groups = userData.groups;
      } else if (userData.groupsForStore && userData.groupsForStore.length > 0) {
        user.value.groups = userData.groupsForStore;
      } else if (groupObj && !user.value.groups) {
        user.value.groups = [{
          id: groupId || groupObj.id,
          name: groupObj.name || groupName || 'Unknown Group',
          code: groupObj.code || ''
        }];
      }

      // ✅ Set hasMultipleStores
      if (userData.hasMultipleStores !== undefined) {
        user.value.hasMultipleStores = userData.hasMultipleStores;
      } else if (userData.stores) {
        user.value.hasMultipleStores = userData.stores.length > 1;
      }

      // ✅ Set isAdmin flag
      if (userData.isAdmin !== undefined) {
        user.value.isAdmin = userData.isAdmin;
      }

      // ✅ Save updated user to localStorage
      localStorage.setItem('user', JSON.stringify(user.value));
      
      console.log('✅ FINAL Updated user with store/group:', {
        storeId: user.value.storeId,
        groupId: user.value.groupId,
        storeName: user.value.storeName,
        groupName: user.value.groupName,
        currentStore: user.value.currentStore,
        currentGroup: user.value.currentGroup,
        assignedStoreId: user.value.assignedStore?.id,
        assignedGroupId: user.value.assignedGroup?.id
      });
    }

    return { storeId, groupId, storeName, groupName };
  };

  // ==================== 🔥 STORE-BASED LOGIN METHODS ====================

  /**
   * Fetch stores for a user by username
   * POST /api/users/stores-by-username
   */
  const fetchStoresByUsername = async (username: string) => {
    try {
      const response = await api.post('/users/stores-by-username', { username })
      console.log('✅ fetchStoresByUsername response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Fetch stores error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch stores'
      }
    }
  }

  /**
   * Login with username, store selection, and password
   * POST /api/users/login-with-store
   */
  const loginWithStore = async (credentials: { 
    username: string; 
    password: string; 
    storeId: number;
    groupId?: number;
  }) => {
    try {
      console.log('🔐 loginWithStore called with:', { 
        username: credentials.username, 
        storeId: credentials.storeId,
        groupId: credentials.groupId || 'none'
      });
      
      const response = await api.post('/users/login-with-store', credentials);
      console.log('✅ loginWithStore response received');

      if (response.data.success) {
        const { token: authToken, refreshToken: authRefreshToken, user: userData } = response.data;

        console.log('📦 User data from server:', {
          userId: userData.userId,
          username: userData.username,
          role: userData.role,
          storeId: userData.storeId,
          groupId: userData.groupId,
          storeName: userData.storeName,
          groupName: userData.groupName,
          hasCurrentStore: !!userData.currentStore,
          currentStore: userData.currentStore,
          hasCurrentGroup: !!userData.currentGroup,
          currentGroup: userData.currentGroup,
          hasAssignedStore: !!userData.assignedStore,
          hasAssignedGroup: !!userData.assignedGroup,
          isAdmin: userData.isAdmin
        });

        // Ensure role is set
        if (!userData.role) {
          userData.role = 'employee';
        }

        // ✅ Set auth store state
        user.value = userData;
        token.value = authToken;
        refreshToken.value = authRefreshToken;
        isLoggedOut.value = false;

        // ✅ Store in localStorage
        localStorage.setItem('token', authToken);
        localStorage.setItem('refreshToken', authRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // ✅ Set store and group data
        setUserStoreAndGroup(userData);

        // ✅ Fetch roles
        await fetchRoles();

        // ✅ Verify the data was set correctly
        console.log('✅ After setUserStoreAndGroup - user.value:', {
          storeId: user.value?.storeId,
          groupId: user.value?.groupId,
          storeName: user.value?.storeName,
          groupName: user.value?.groupName,
          currentStore: user.value?.currentStore,
          currentGroup: user.value?.currentGroup
        });

        // ✅ Verify userStoreId computed getter
        console.log('✅ userStoreId computed:', userStoreId.value);

        return { 
          success: true, 
          user: userData,
          storeId: userData.storeId,
          groupId: userData.groupId
        };
      }

      console.error('❌ loginWithStore returned success: false');
      return { 
        success: false, 
        error: response.data.error || 'Login failed' 
      };
    } catch (error: any) {
      console.error('❌ Login with store error:', error);

      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 401) {
          return { success: false, error: 'Invalid username or password' };
        }
        if (error.response.status === 403) {
          return { 
            success: false, 
            error: error.response.data?.error || 'Access denied to this store' 
          };
        }
        if (error.response.status === 404) {
          return { 
            success: false, 
            error: error.response.data?.error || 'Store not found' 
          };
        }
      }

      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  };

  // ==================== LEGACY LOGIN ====================

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Legacy login called with:', { username, password: '***' })
      
      const response = await api.post('/users/login', { 
        username: username.trim(), 
        password: password.trim() 
      })
      
      console.log('✅ Legacy login response:', response.data)

      if (response.data.success) {
        const { token: authToken, refreshToken: authRefreshToken, user: userData } = response.data

        if (!userData.role) {
          userData.role = 'employee'
        }

        user.value = userData
        token.value = authToken
        refreshToken.value = authRefreshToken
        isLoggedOut.value = false

        localStorage.setItem('token', authToken)
        localStorage.setItem('refreshToken', authRefreshToken)
        localStorage.setItem('user', JSON.stringify(userData))

        setUserStoreAndGroup(userData)
        await fetchRoles()

        return { success: true, user: userData }
      }

      return { success: false, error: response.data.error || 'Login failed' }
    } catch (error: any) {
      console.error('❌ Legacy login error:', error)
      
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error status:', error.response.status)
        console.error('Error headers:', error.response.headers)
      }

      if (error.response?.status === 401) {
        return { success: false, error: 'Invalid username or password' }
      }
      if (error.response?.status === 403) {
        return { success: false, error: 'Account is deactivated. Please contact administrator.' }
      }

      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.post('/users/logout').catch(() => {})
    } catch (error) {
      console.warn('Logout API failed', error)
    } finally {
      clearAuthData()
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        const userData = response.data.user
        if (!userData.role) {
          userData.role = 'employee'
        }
        user.value = userData
        localStorage.setItem('user', JSON.stringify(userData))
        
        setUserStoreAndGroup(userData)
        
        return { success: true, user: userData }
      }
      return { success: false, error: response.data.error }
    } catch (error: any) {
      console.error('Fetch profile error:', error)
      return { success: false, error: error.response?.data?.error }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/users/change-password', { currentPassword, newPassword })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Change password error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to change password' }
    }
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user.value) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.value.role)
  }

  // Initialize the store
  init()

  return {
    // State
    user,
    token,
    refreshToken,
    isLoggedOut,
    availableRoles,
    
    // Getters
    isAuthenticated,
    userRole,
    userFullName,
    userAvatar,
    userStoreId,
    userGroupId,
    
    // Actions - Legacy
    login,
    logout,
    fetchProfile,
    changePassword,
    hasRole,
    init,
    clearAuthData,
    setUserStoreAndGroup,
    fetchRoles,
    
    // 🔥 Store-based login actions
    fetchStoresByUsername,
    loginWithStore
  }
})