// src/utils/authStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@superapp/saved_login";

export const saveLogin = async ({ username, storeId, storeName }) => {
  try {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ username, storeId, storeName })
    );
  } catch (e) {
    console.warn("saveLogin failed:", e);
  }
};

export const loadLogin = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("loadLogin failed:", e);
    return null;
  }
};

export const clearLogin = async () => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearLogin failed:", e);
  }
};