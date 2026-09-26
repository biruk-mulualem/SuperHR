// mobile/src/stores/auth.js
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./interceptor";

// ==================== STORAGE KEYS (must match web's localStorage keys) ====================
const K_TOKEN = "token";
const K_REFRESH = "refreshToken";
const K_USER = "user";

// ==================== AUTH SERVICE (singleton) ====================
class AuthService {
  constructor() {
    // Same state shape as the web store
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.isLoggedOut = false;
    this.availableRoles = [];

    // Subscribers (so React components re-render)
    this._listeners = new Set();
  }

  // ---------- Subscription ----------
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    this._listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (e) {
        console.warn(e);
      }
    });
  }

  // ==================== GETTERS (computed) ====================
  get isAuthenticated() {
    return !!this.token && !!this.user;
  }

  get userRole() {
    return this.user?.role || "employee";
  }

  get userFullName() {
    if (!this.user) return "User";
    return (
      this.user.fullEmployeeName ||
      this.user.fullName ||
      (this.user.firstName && this.user.lastName
        ? `${this.user.firstName} ${this.user.lastName}`
        : "User")
    );
  }

  get userAvatar() {
    return this.user?.profilePicture || this.user?.profilePictureUrl || null;
  }

  // 🔥 Same fallback chain as the web
  get userStoreId() {
    const u = this.user;
    if (!u) return null;
    if (u.currentStore?.id) return u.currentStore.id;
    if (u.assignedStore?.id) return u.assignedStore.id;
    if (u.storeId) return u.storeId;
    if (u.stores?.length > 0 && u.stores[0]?.id) return u.stores[0].id;
    return null;
  }

  get userGroupId() {
    const u = this.user;
    if (!u) return null;
    if (u.currentGroup?.id) return u.currentGroup.id;
    if (u.assignedGroup?.id) return u.assignedGroup.id;
    if (u.groupId) return u.groupId;
    if (u.groups?.length > 0 && u.groups[0]?.id) return u.groups[0].id;
    return null;
  }

  // ==================== INTERNAL HELPERS ====================
  async _persist() {
    const ops = [];
    if (this.token) ops.push(AsyncStorage.setItem(K_TOKEN, this.token));
    else ops.push(AsyncStorage.removeItem(K_TOKEN));

    if (this.refreshToken)
      ops.push(AsyncStorage.setItem(K_REFRESH, this.refreshToken));
    else ops.push(AsyncStorage.removeItem(K_REFRESH));

    if (this.user)
      ops.push(AsyncStorage.setItem(K_USER, JSON.stringify(this.user)));
    else ops.push(AsyncStorage.removeItem(K_USER));

    await Promise.all(ops);
  }

  clearAuthData = async () => {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.availableRoles = [];
    this.isLoggedOut = true;

    await AsyncStorage.multiRemove([K_TOKEN, K_REFRESH, K_USER]);
    this._notify();
  };

  // ==================== setUserStoreAndGroup (mirrors web 1:1) ====================
  setUserStoreAndGroup(userData) {
    if (!userData || !this.user) return;

    // 1. Extract store ID
    const storeId =
      userData.storeId ||
      userData.currentStore?.id ||
      userData.assignedStore?.id ||
      userData.store?.id ||
      (userData.stores?.length > 0 ? userData.stores[0]?.id : null) ||
      null;

    // 2. Extract group ID
    const groupId =
      userData.groupId ||
      userData.currentGroup?.id ||
      userData.assignedGroup?.id ||
      userData.group?.id ||
      (userData.groups?.length > 0 ? userData.groups[0]?.id : null) ||
      (userData.groupsForStore?.length > 0
        ? userData.groupsForStore[0]?.id
        : null) ||
      null;

    // 3. Extract names
    const storeName =
      userData.storeName ||
      userData.currentStore?.name ||
      userData.assignedStore?.name ||
      userData.store?.name ||
      (userData.stores?.length > 0 ? userData.stores[0]?.name : null) ||
      null;

    const groupName =
      userData.groupName ||
      userData.currentGroup?.name ||
      userData.assignedGroup?.name ||
      userData.group?.name ||
      (userData.groups?.length > 0 ? userData.groups[0]?.name : null) ||
      (userData.groupsForStore?.length > 0
        ? userData.groupsForStore[0]?.name
        : null) ||
      null;

    const storeObj =
      userData.currentStore || userData.assignedStore || userData.store;
    const groupObj =
      userData.currentGroup || userData.assignedGroup || userData.group;

    // 4. Apply to user object
    this.user.storeId = storeId;
    this.user.groupId = groupId;
    this.user.storeName = storeName;
    this.user.groupName = groupName;

    if (userData.currentStore) {
      this.user.currentStore = {
        id: userData.currentStore.id,
        name: userData.currentStore.name,
        code: userData.currentStore.code || "",
        location: userData.currentStore.location || "",
      };
    }
    if (userData.currentGroup) {
      this.user.currentGroup = {
        id: userData.currentGroup.id,
        name: userData.currentGroup.name,
        code: userData.currentGroup.code || "",
      };
    }

    if (storeObj && !this.user.assignedStore) {
      this.user.assignedStore = {
        id: storeId || storeObj.id,
        name: storeObj.name || storeName || "Unknown Store",
        code: storeObj.code || "",
        location: storeObj.location || "",
      };
    } else if (this.user.assignedStore && storeId) {
      this.user.assignedStore.id = storeId;
      if (storeName) this.user.assignedStore.name = storeName;
    }

    if (groupObj && !this.user.assignedGroup) {
      this.user.assignedGroup = {
        id: groupId || groupObj.id,
        name: groupObj.name || groupName || "Unknown Group",
        code: groupObj.code || "",
      };
    } else if (this.user.assignedGroup && groupId) {
      this.user.assignedGroup.id = groupId;
      if (groupName) this.user.assignedGroup.name = groupName;
    }

    if (userData.stores?.length > 0) {
      this.user.stores = userData.stores;
    } else if (storeObj && !this.user.stores) {
      this.user.stores = [
        {
          id: storeId || storeObj.id,
          name: storeObj.name || storeName || "Unknown Store",
          code: storeObj.code || "",
        },
      ];
    }

    if (userData.groups?.length > 0) {
      this.user.groups = userData.groups;
    } else if (userData.groupsForStore?.length > 0) {
      this.user.groups = userData.groupsForStore;
    } else if (groupObj && !this.user.groups) {
      this.user.groups = [
        {
          id: groupId || groupObj.id,
          name: groupObj.name || groupName || "Unknown Group",
          code: groupObj.code || "",
        },
      ];
    }

    if (userData.hasMultipleStores !== undefined) {
      this.user.hasMultipleStores = userData.hasMultipleStores;
    } else if (userData.stores) {
      this.user.hasMultipleStores = userData.stores.length > 1;
    }

    if (userData.isAdmin !== undefined) {
      this.user.isAdmin = userData.isAdmin;
    }

    this._notify();
  }

  // ==================== init (called once on app boot) ====================
  async init() {
    try {
      const [storedUser, storedToken, storedRefresh] = await Promise.all([
        AsyncStorage.getItem(K_USER),
        AsyncStorage.getItem(K_TOKEN),
        AsyncStorage.getItem(K_REFRESH),
      ]);

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        if (!parsed.role) parsed.role = "employee";

        this.user = parsed;
        this.token = storedToken;
        this.refreshToken = storedRefresh;
        this.isLoggedOut = false;

        this._notify();

        // Fetch roles in background — don't block app boot
        this.fetchRoles().catch(() => {});
      }
    } catch (e) {
      console.error("AuthService.init failed:", e);
      await this.clearAuthData();
    }
  }

  // ==================== fetchRoles ====================
  async fetchRoles() {
    try {
      const res = await api.get("/users/roles");
      if (res.data?.success) {
        this.availableRoles = res.data.roles || [];
      }
    } catch (e) {
      console.warn("Failed to fetch roles:", e?.message);
      this.availableRoles = [
        "admin",
        "hr",
        "finance",
        "employee",
        "attendance",
        "store",
        "checker",
        "manager",
        "purchaser",
      ];
    }
    this._notify();
  }

  // ==================== STORE-BASED LOGIN ====================

  /**
   * POST /api/users/stores-by-username
   * Returns { success, stores?, error? }
   */
  async fetchStoresByUsername(username) {
    try {
      const res = await api.post("/users/stores-by-username", { username });
      return res.data;
    } catch (e) {
      return {
        success: false,
        error: e.response?.data?.error || e.message || "Failed to fetch stores",
      };
    }
  }

  /**
   * POST /api/users/login-with-store
   */
  async loginWithStore({ username, password, storeId, groupId }) {
    try {
      const res = await api.post("/users/login-with-store", {
        username,
        password,
        storeId,
        groupId,
      });

      if (!res.data?.success) {
        return { success: false, error: res.data?.error || "Login failed" };
      }

      const { token, refreshToken, user } = res.data;
      if (!user.role) user.role = "employee";

      // Update state
      this.user = user;
      this.token = token;
      this.refreshToken = refreshToken;
      this.isLoggedOut = false;

      // Persist
      await this._persist();
      this.setUserStoreAndGroup(user);
      await this.fetchRoles();

      return {
        success: true,
        user,
        storeId: user.storeId,
        groupId: user.groupId,
      };
    } catch (e) {
      if (e.response?.status === 401)
        return { success: false, error: "Invalid username or password" };
      if (e.response?.status === 403)
        return {
          success: false,
          error: e.response.data?.error || "Access denied to this store",
        };
      if (e.response?.status === 404)
        return {
          success: false,
          error: e.response.data?.error || "Store not found",
        };
      return {
        success: false,
        error: e.response?.data?.error || e.message || "Login failed",
      };
    }
  }

  // ==================== LEGACY LOGIN ====================
  async login(username, password) {
    try {
      const res = await api.post("/users/login", {
        username: username.trim(),
        password: password.trim(),
      });

      if (!res.data?.success) {
        return { success: false, error: res.data?.error || "Login failed" };
      }

      const { token, refreshToken, user } = res.data;
      if (!user.role) user.role = "employee";

      this.user = user;
      this.token = token;
      this.refreshToken = refreshToken;
      this.isLoggedOut = false;

      await this._persist();
      this.setUserStoreAndGroup(user);
      await this.fetchRoles();

      return { success: true, user };
    } catch (e) {
      if (e.response?.status === 401)
        return { success: false, error: "Invalid username or password" };
      if (e.response?.status === 403)
        return {
          success: false,
          error: "Account is deactivated. Contact administrator.",
        };
      return {
        success: false,
        error: e.response?.data?.error || e.message || "Login failed",
      };
    }
  }

  // ==================== LOGOUT ====================
  async logout() {
    try {
      await api.post("/users/logout").catch(() => {});
    } finally {
      await this.clearAuthData();
      // The AppRouter listens to `isLoggedOut` and routes to Login
    }
  }

  // ==================== PROFILE ====================
  async fetchProfile() {
    try {
      const res = await api.get("/users/profile");
      if (res.data?.success) {
        const userData = res.data.user;
        if (!userData.role) userData.role = "employee";
        this.user = userData;
        await this._persist();
        this.setUserStoreAndGroup(userData);
        this._notify();
        return { success: true, user: userData };
      }
      return { success: false, error: res.data?.error };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || e.message };
    }
  }

  // ==================== CHANGE PASSWORD ====================
  async changePassword(currentPassword, newPassword) {
    try {
      const res = await api.post("/users/change-password", {
        currentPassword,
        newPassword,
      });
      return { success: true, message: res.data?.message };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || e.message };
    }
  }

  // ==================== ROLE CHECK ====================
  hasRole(role) {
    if (!this.user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(this.user.role);
  }
}

// Export singleton
const authService = new AuthService();
export default authService;