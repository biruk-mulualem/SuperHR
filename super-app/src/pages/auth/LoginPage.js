// src/pages/auth/LoginPage.js
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";
import TermsPage from "./TermsPage";
import { useAuth } from "../../hooks/useAuth";

// ================================================================
// ICONS
// ================================================================
const UserIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const LockIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const EyeIcon = ({ color = "#94A3B8", size = 20 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color = "#94A3B8", size = 20 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const HomeIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const ChevronDownIcon = ({ color = "#94A3B8", size = 18, open = false }) => (
  <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <Path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </Svg>
  </View>
);

const ArrowRightIcon = ({ color = "#FFFFFF", size = 18 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

// ================================================================
// HELPER: normalize response shapes
// ================================================================
/**
 * Backend may return any of:
 *   { success, stores: [...] }
 *   { success, data: { hasAccess, stores: [...] } }
 *   { success, data: { stores: [...] }, stores: [...] }
 * This returns the array either way.
 */
const extractStores = (res) => {
  if (!res) return [];
  // Nested under data
  const fromData = res.data?.stores;
  if (Array.isArray(fromData)) return fromData;
  // Direct
  if (Array.isArray(res.stores)) return res.stores;
  return [];
};

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function LoginPage({ onLoginSuccess }) {
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [focusedInput, setFocusedInput] = useState(null);

  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    store: "",
  });
  const [generalError, setGeneralError] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);

  // ================================================================
  // PASSWORD STRENGTH
  // ================================================================
  const computeStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s += 1;
    if (/[a-z]/.test(pwd)) s += 1;
    if (/[A-Z]/.test(pwd)) s += 1;
    if (/[0-9]/.test(pwd)) s += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) s += 1;
    return s;
  };

  const strengthColor = () => {
    const colors = ["#ff4d4d", "#ffa64d", "#facc15", "#4ade80", "#00cc66"];
    return colors[passwordStrength - 1] || "#ff4d4d";
  };

  const strengthText = () => {
    const texts = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
    return texts[passwordStrength - 1] || "";
  };

  // ================================================================
  // STORE FETCHING
  // Returns the fetched list so callers can use it synchronously.
  // ================================================================
  const fetchStores = async (username) => {
    if (!username || username.length < 3) {
      setStores([]);
      setSelectedStore(null);
      return [];
    }

    setStoresLoading(true);

    try {
      console.log("🔎 fetchStores →", username);
      const res = await auth.fetchStoresByUsername(username);
      console.log("📥 fetchStores raw response:", JSON.stringify(res));

      const list = extractStores(res);
      console.log("📋 extracted stores list:", JSON.stringify(list));

      if (list.length > 0) {
        // Normalize: `id` vs `storeId`
        const normalized = list.map((s) => ({
          id: s.id || s.storeId,
          name: s.name,
          code: s.code,
          location: s.location,
          groups: s.groups || [],
        }));

        setStores(normalized);
        setSelectedStore(normalized[0]);
        setErrors((e) => ({ ...e, store: "" }));
        return normalized;
      } else {
        // Legacy user — no store selection needed
        console.log("👤 Legacy user (no stores)");
        setStores([]);
        setSelectedStore(null);
        return [];
      }
    } catch (err) {
      console.warn("❌ fetchStores failed:", err);
      setStores([]);
      setSelectedStore(null);
      return [];
    } finally {
      setStoresLoading(false);
    }
  };

  // Debounced fetch on username change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const username = email.trim();
    if (!username) {
      setStores([]);
      setSelectedStore(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchStores(username);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  // ================================================================
  // SHAKE ANIMATION
  // ================================================================
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ================================================================
  // LOGIN
  // ================================================================
  const handleLogin = async () => {
    if (loading) return;
    setGeneralError("");

    // ---------- Validation ----------
    const newErrors = { username: "", password: "", store: "" };
    let valid = true;

    if (!email.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (email.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) {
      shakeError();
      return;
    }

    // ---------- Submit ----------
    setLoading(true);

    try {
      // ✅ Re-fetch stores synchronously. This fixes the race where the user
      //   taps Sign In before the debounced fetch completed.
      let freshStores = stores;
      let freshSelected = selectedStore;

      if (email.trim().length >= 3) {
        const fetched = await fetchStores(email.trim());
        freshStores = fetched;
        freshSelected = fetched[0] || null;
      }

      let res;

      if (freshStores.length > 0 && freshSelected) {
        // Store-based login
        const groupId =
          freshSelected.groups?.[0]?.groupId ||
          freshSelected.groups?.[0]?.id ||
          null;

        console.log("🔐 Store login →", {
          username: email.trim(),
          storeId: freshSelected.id,
          groupId,
        });

        res = await auth.loginWithStore({
          username: email.trim(),
          password,
          storeId: freshSelected.id,
          groupId,
        });
      } else {
        // ✅ Legacy login — user has no stores
        console.log("🔐 Legacy login →", email.trim());
        res = await auth.login(email.trim(), password);
      }

      console.log("📥 login response:", JSON.stringify(res));

      if (!res?.success) {
        throw new Error(
          res?.error || "Login failed. Please check your credentials.",
        );
      }

      onLoginSuccess?.(res.user.role, res.user.userId);
   } catch (err) {
  const status = err?.response?.status;
  const serverMsg =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    '';

  let friendly = 'Login failed. Please try again.';

  if (status === 401 || /invalid|incorrect|wrong/i.test(serverMsg)) {
    friendly = 'Invalid username or password.';
  } else if (status === 403) {
    friendly = 'Your account is deactivated. Contact your administrator.';
  } else if (status === 404) {
    friendly = 'Account not found.';
  } else if (status === 429) {
    friendly = 'Too many attempts. Please try again later.';
  } else if (status >= 500) {
    friendly = 'Server error. Please try again later.';
  } else if (err?.message?.toLowerCase().includes('network')) {
    friendly = 'Cannot reach the server. Check your connection.';
  }

  // One-line dev log — no stack, no red, no spam
  console.log(`🔐 Login rejected (${status ?? 'network'})`);

  setGeneralError(friendly);
  shakeError();
} finally {
  setLoading(false);
}
  };

  // ================================================================
  // MISC
  // ================================================================
  const handleForgotPassword = () => {
    alert("Password reset instructions dispatched to your registered address.");
  };

  if (showTerms) {
    return <TermsPage onClose={() => setShowTerms(false)} />;
  }

  const usernameActive = focusedInput === "username" || email.length > 0;
  const passwordActive = focusedInput === "password" || password.length > 0;
  const storeActive = focusedInput === "store" || !!selectedStore;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        style={styles.outerWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.innerContainer}>
            <View style={styles.trustBannerContainer}>
              <Text style={styles.trustTextGold}>We Trust In God!!!</Text>
              <Text style={styles.trustDivider}> | </Text>
              <Text style={styles.trustTextGreen}>እግዚአብሔር ይባርክ!!!</Text>
            </View>

            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SUPER APP</Text>
            </View>

            <Animated.View
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              {generalError ? (
                <View style={styles.generalErrorBox}>
                  <Svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#B91C1C"
                    strokeWidth={2}
                  >
                    <Circle cx="12" cy="12" r="10" />
                    <Line x1="12" y1="8" x2="12" y2="12" />
                    <Line x1="12" y1="16" x2="12.01" y2="16" />
                  </Svg>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* Username */}
              <Text
                style={[styles.label, usernameActive && styles.labelActive]}
              >
                Username
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  usernameActive && styles.inputContainerActive,
                  errors.username && styles.inputContainerError,
                ]}
              >
                <UserIcon color={usernameActive ? "#0284C7" : "#94A3B8"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.username)
                      setErrors((e) => ({ ...e, username: "" }));
                    if (generalError) setGeneralError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}

              {/* Password */}
              <Text
                style={[
                  styles.label,
                  passwordActive && styles.labelActive,
                  { marginTop: 14 },
                ]}
              >
                Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordActive && styles.inputContainerActive,
                  errors.password && styles.inputContainerError,
                ]}
              >
                <LockIcon color={passwordActive ? "#0284C7" : "#94A3B8"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setPasswordStrength(computeStrength(v));
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: "" }));
                    if (generalError) setGeneralError("");
                  }}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}

              {/* Password strength */}
              {password.length > 0 && !errors.password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i <= passwordStrength
                                ? strengthColor()
                                : "#E2E8F0",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.strengthText, { color: strengthColor() }]}
                  >
                    {strengthText()}
                  </Text>
                </View>
              ) : null}

              {/* Store selection — ONLY if the user has stores */}
              {stores.length > 0 ? (
                <View style={{ marginTop: 14 }}>
                  <Text
                    style={[styles.label, storeActive && styles.labelActive]}
                  >
                    Select Store
                  </Text>

                  <View style={styles.storeWrapper}>
                    {showStoreDropdown ? (
                      <View style={styles.storeDropdown}>
                        {stores.map((store) => {
                          const isSelected = selectedStore?.id === store.id;
                          return (
                            <TouchableOpacity
                              key={store.id}
                              style={[
                                styles.storeOption,
                                isSelected && styles.storeOptionActive,
                              ]}
                              onPress={() => {
                                setSelectedStore(store);
                                setShowStoreDropdown(false);
                                setErrors((e) => ({ ...e, store: "" }));
                                setGeneralError("");
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.storeOptionIcon}>🏪</Text>
                              <View style={styles.storeOptionInfo}>
                                <Text style={styles.storeOptionName}>
                                  {store.name}
                                </Text>
                                <Text style={styles.storeOptionCode}>
                                  {store.code}
                                </Text>
                                {store.groups?.[0] ? (
                                  <Text style={styles.storeOptionGroup}>
                                    👥{" "}
                                    {store.groups[0].groupName ||
                                      store.groups[0].name}
                                  </Text>
                                ) : (
                                  <Text style={styles.storeOptionGroup}>
                                    No group assigned
                                  </Text>
                                )}
                              </View>
                              {isSelected ? (
                                <Text style={styles.storeCheck}>✓</Text>
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.storeTrigger,
                        storeActive && styles.storeTriggerActive,
                        showStoreDropdown && styles.storeTriggerFocused,
                        errors.store && styles.storeTriggerError,
                      ]}
                      onPress={() => {
                        if (!loading) setShowStoreDropdown((v) => !v);
                      }}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <HomeIcon color={storeActive ? "#22C55E" : "#94A3B8"} />
                      <View style={styles.storeTriggerText}>
                        <Text
                          style={[
                            styles.storeText,
                            !selectedStore && styles.storeTextPlaceholder,
                          ]}
                          numberOfLines={1}
                        >
                          {storesLoading
                            ? "Loading stores..."
                            : selectedStore
                              ? selectedStore.name
                              : "Select a store..."}
                        </Text>
                        {selectedStore && !storesLoading ? (
                          <Text style={styles.storeCode}>
                            {selectedStore.code}
                          </Text>
                        ) : null}
                      </View>
                      {storesLoading ? (
                        <ActivityIndicator size="small" color="#0284C7" />
                      ) : (
                        <ChevronDownIcon open={showStoreDropdown} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {errors.store ? (
                    <Text style={styles.errorText}>{errors.store}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Footer links */}
              <View style={styles.footerLinksRow}>
                <TouchableOpacity
                  onPress={() => setShowTerms(true)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.termsLinkText}>
                    Terms &amp; Conditions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.loginButtonInner}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <ArrowRightIcon />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

// ================================================================
// STYLES (unchanged from your file)
// ================================================================
const styles = StyleSheet.create({
  outerWrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingTop: 80, paddingBottom: 40 },
  container: { flex: 1 },
  innerContainer: { paddingHorizontal: 24 },

  trustBannerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  trustTextGold: {
    fontSize: 15,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 0.3,
  },
  trustDivider: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94A3B8",
    paddingHorizontal: 6,
  },
  trustTextGreen: { fontSize: 15, fontWeight: "800", color: "#16A34A" },

  logoContainer: { alignItems: "center", marginBottom: 28 },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: 3,
  },

  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelActive: { color: "#0284C7" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    height: 52,
    paddingHorizontal: 14,
  },
  inputContainerActive: { borderColor: "#0284C7", backgroundColor: "#FFFFFF" },
  inputContainerError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    paddingLeft: 10,
    paddingVertical: 0,
  },
  eyeButton: {
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },

  strengthContainer: { marginTop: 8, paddingHorizontal: 4 },
  strengthBars: { flexDirection: "row", gap: 4, marginBottom: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: "600" },

  storeWrapper: { position: "relative" },
  storeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    height: 52,
    paddingHorizontal: 14,
  },
  storeTriggerActive: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
  storeTriggerFocused: { borderColor: "#0284C7", backgroundColor: "#FFFFFF" },
  storeTriggerError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  storeTriggerText: {
    flex: 1,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeText: { fontSize: 15, color: "#1E293B", flex: 1 },
  storeTextPlaceholder: { color: "#94A3B8" },
  storeCode: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },

  storeDropdown: {
    position: "absolute",
    bottom: 58,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 6,
    maxHeight: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  storeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  storeOptionActive: { backgroundColor: "#FFFBEB" },
  storeOptionIcon: { fontSize: 16, marginRight: 10 },
  storeOptionInfo: { flex: 1 },
  storeOptionName: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  storeOptionCode: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  storeOptionGroup: { fontSize: 10, color: "#64748B", marginTop: 2 },
  storeCheck: { color: "#22C55E", fontSize: 15, fontWeight: "700" },

  footerLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 22,
  },
  termsLinkText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  forgotPasswordText: { color: "#0284C7", fontSize: 13, fontWeight: "600" },

  loginButton: {
    backgroundColor: "#0284C7",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  generalErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  generalErrorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});
