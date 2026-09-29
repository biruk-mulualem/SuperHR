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
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";
import TermsPage from "./TermsPage";
import { useAuth } from "../../hooks/useAuth";
import { saveLogin, loadLogin } from "../../utils/authStorage";

const SCREEN = Dimensions.get("window");

// ================================================================
// FONTS
// ================================================================
const FONT_EN = Platform.select({
  ios: "Cinzel-Bold",
  android: "Cinzel-Bold",
  default: "Cinzel-Bold",
});

const FONT_AM = Platform.select({
  ios: "NotoSansEthiopic-Bold",
  android: "NotoSansEthiopic-Bold",
  default: "NotoSansEthiopic-Bold",
});

// ================================================================
// ICONS
// ================================================================
const UserIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const LockIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const EyeIcon = ({ color = "#94A3B8", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color = "#94A3B8", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const HomeIcon = ({ color = "#94A3B8", size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
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
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

const ShieldIcon = ({ color = "#10B981", size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

// ================================================================
// HELPER: normalize response shapes
// ================================================================
const extractStores = (res) => {
  if (!res) return [];
  const fromData = res.data?.stores;
  if (Array.isArray(fromData)) return fromData;
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
  const [rememberMe, setRememberMe] = useState(true);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);
  const pendingStoreIdRef = useRef(null);
  const passwordInputRef = useRef(null);

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
  // LOAD SAVED USERNAME ON MOUNT
  // ================================================================
  useEffect(() => {
    (async () => {
      const saved = await loadLogin();
      if (saved?.username) {
        setEmail(saved.username);
        setRememberMe(true);
        if (saved.storeId) pendingStoreIdRef.current = saved.storeId;
        setTimeout(() => passwordInputRef.current?.focus(), 300);
      }
    })();
  }, []);

  // ================================================================
  // STORE FETCHING
  // ================================================================
  const fetchStores = async (username) => {
    if (!username || username.length < 3) {
      setStores([]);
      setSelectedStore(null);
      return [];
    }

    setStoresLoading(true);

    try {
      const res = await auth.fetchStoresByUsername(username);
      const list = extractStores(res);

      if (list.length > 0) {
        const normalized = list.map((s) => ({
          id: s.id || s.storeId,
          name: s.name,
          code: s.code,
          location: s.location,
          groups: s.groups || [],
        }));

        setStores(normalized);

        let initial = normalized[0];
        if (pendingStoreIdRef.current) {
          const match = normalized.find((s) => s.id === pendingStoreIdRef.current);
          if (match) initial = match;
          pendingStoreIdRef.current = null;
        }
        setSelectedStore(initial);
        setErrors((e) => ({ ...e, store: "" }));
        return normalized;
      } else {
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
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ================================================================
  // LOGIN
  // ================================================================
  const handleLogin = async () => {
    if (loading) return;
    setGeneralError("");

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

    setLoading(true);

    try {
      let freshStores = stores;
      let freshSelected = selectedStore;

      if (email.trim().length >= 3) {
        const fetched = await fetchStores(email.trim());
        freshStores = fetched;
        freshSelected =
          fetched.find((s) => s.id === selectedStore?.id) || fetched[0] || null;
      }

      let res;

      if (freshStores.length > 0 && freshSelected) {
        const groupId =
          freshSelected.groups?.[0]?.groupId ||
          freshSelected.groups?.[0]?.id ||
          null;

        res = await auth.loginWithStore({
          username: email.trim(),
          password,
          storeId: freshSelected.id,
          groupId,
        });
      } else {
        res = await auth.login(email.trim(), password);
      }

      if (!res?.success) {
        if (res.deviceStatus) {
          const statusMessages = {
            new_device:
              res.message ||
              "Your device is not registered. Please contact the admin.",
            pending:
              res.message ||
              "Your device is awaiting approval. Please contact the admin.",
            blocked: res.reason
              ? `Your device is blocked. Please contact the admin.\n\nReason: ${res.reason}`
              : res.message ||
                "Your device is blocked. Please contact the admin.",
          };

          setGeneralError(
            statusMessages[res.deviceStatus] ||
              "Login failed. Please try again later."
          );
          shakeError();
          setLoading(false);
          return;
        }

        throw new Error(
          res?.error || "Login failed. Please check your credentials."
        );
      }

      if (rememberMe) {
        await saveLogin({
          username: email.trim(),
          storeId: freshSelected?.id || null,
          storeName: freshSelected?.name || null,
        });
      }

      onLoginSuccess?.(res.user.role, res.user.userId);
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.error || err?.response?.data?.message || "";

      let friendly = "Login failed. Please try again.";

      if (status === 401 || /invalid|incorrect|wrong/i.test(serverMsg)) {
        friendly = "Invalid username or password.";
      } else if (status === 403) {
        friendly = "Your account is deactivated. Contact your administrator.";
      } else if (status === 404) {
        friendly = "Account not found.";
      } else if (status === 429) {
        friendly = "Too many attempts. Please try again later.";
      } else if (status >= 500) {
        friendly = "Server error. Please try again later.";
      } else if (err?.message?.toLowerCase().includes("network")) {
        friendly = "Cannot reach the server. Check your connection.";
      }

      setGeneralError(friendly);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Password reset instructions dispatched to your registered address.");
  };

  if (showTerms) {
    return <TermsPage onClose={() => setShowTerms(false)} />;
  }

  const usernameActive = focusedInput === "username" || email.length > 0;
  const passwordActive = focusedInput === "password" || password.length > 0;
  const storeActive = focusedInput === "store" || !!selectedStore;

  // ================================================================
  // RENDER — no ScrollView, everything fits the screen
  // ================================================================
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <View style={styles.bgTop} pointerEvents="none" />
        <View style={styles.bgAccent} pointerEvents="none" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <View style={styles.content}>
            {/* ---------- HERO ---------- */}
            <View style={styles.hero}>
             
              <Text style={styles.brand}>SUPER APP</Text>
              <Text style={styles.brandTagline}>Sign in to continue</Text>

              <View style={styles.trustRow}>
                <ShieldIcon color="#D97706" size={12} />
                <Text style={styles.trustTextGold}>We Trust In God</Text>
                <Text style={styles.trustDot}>•</Text>
                <Text style={styles.trustTextGreen}>እግዚአብሔር ይባርክ</Text>
              </View>
            </View>

            {/* ---------- CARD ---------- */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              {generalError ? (
                <View style={styles.errorBanner}>
                  <View style={styles.errorBannerIcon}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth={2.4}>
                      <Circle cx="12" cy="12" r="10" />
                      <Line x1="12" y1="8" x2="12" y2="12" />
                      <Line x1="12" y1="16" x2="12.01" y2="16" />
                    </Svg>
                  </View>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              ) : null}

              {/* Username */}
              <Text style={[styles.label, usernameActive && styles.labelActive]}>
                Username
              </Text>
              <View
                style={[
                  styles.field,
                  usernameActive && styles.fieldActive,
                  errors.username && styles.fieldError,
                ]}
              >
                <UserIcon color={usernameActive ? "#0284C7" : "#94A3B8"} size={16} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.username) setErrors((e) => ({ ...e, username: "" }));
                    if (generalError) setGeneralError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.username ? (
                <Text style={styles.fieldErrorText}>{errors.username}</Text>
              ) : null}

              {/* Password */}
              <Text
                style={[
                  styles.label,
                  passwordActive && styles.labelActive,
                  { marginTop: 12 },
                ]}
              >
                Password
              </Text>
              <View
                style={[
                  styles.field,
                  passwordActive && styles.fieldActive,
                  errors.password && styles.fieldError,
                ]}
              >
                <LockIcon color={passwordActive ? "#0284C7" : "#94A3B8"} size={16} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setPasswordStrength(computeStrength(v));
                    if (errors.password) setErrors((e) => ({ ...e, password: "" }));
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
                  hitSlop={8}
                >
                  {showPassword ? <EyeIcon size={18} /> : <EyeOffIcon size={18} />}
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.fieldErrorText}>{errors.password}</Text>
              ) : null}

              {/* Password strength */}
              {password.length > 0 && !errors.password ? (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i <= passwordStrength ? strengthColor() : "#E2E8F0",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: strengthColor() }]}>
                    {strengthText()}
                  </Text>
                </View>
              ) : null}

              {/* Remember me */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((v) => !v)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe ? (
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.5}>
                      <Polyline points="20 6 9 17 4 12" />
                    </Svg>
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Remember my username</Text>
              </TouchableOpacity>

              {/* Store selection */}
              {stores.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.label, storeActive && styles.labelActive]}>
                    Store
                  </Text>

                  <View style={styles.storeWrapper}>
                    {showStoreDropdown ? (
                      <View style={styles.storeDropdown}>
                        <View style={{ maxHeight: 180 }}>
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
                                <View style={styles.storeOptionIconWrap}>
                                  <Text style={styles.storeOptionIcon}>🏪</Text>
                                </View>
                                <View style={styles.storeOptionInfo}>
                                  <Text style={styles.storeOptionName} numberOfLines={1}>
                                    {store.name}
                                  </Text>
                                  <Text style={styles.storeOptionCode} numberOfLines={1}>
                                    {store.code}
                                    {store.groups?.[0]?.groupName || store.groups?.[0]?.name
                                      ? ` · 👥 ${store.groups[0].groupName || store.groups[0].name}`
                                      : " · no group"}
                                  </Text>
                                </View>
                                {isSelected ? (
                                  <View style={styles.storeCheck}>
                                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={3}>
                                      <Polyline points="20 6 9 17 4 12" />
                                    </Svg>
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.field,
                        styles.storeTrigger,
                        storeActive && styles.storeTriggerActive,
                        showStoreDropdown && styles.storeTriggerFocused,
                        errors.store && styles.fieldError,
                      ]}
                      onPress={() => {
                        if (!loading) setShowStoreDropdown((v) => !v);
                      }}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <HomeIcon color={storeActive ? "#22C55E" : "#94A3B8"} size={16} />
                      <View style={styles.storeTriggerText}>
                        <Text
                          style={[
                            styles.input,
                            !selectedStore && styles.storeTextPlaceholder,
                          ]}
                          numberOfLines={1}
                        >
                          {storesLoading
                            ? "Loading stores…"
                            : selectedStore
                            ? selectedStore.name
                            : "Select a store…"}
                        </Text>
                        {selectedStore && !storesLoading ? (
                          <View style={styles.storeCodePill}>
                            <Text style={styles.storeCodePillText}>
                              {selectedStore.code}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {storesLoading ? (
                        <ActivityIndicator size="small" color="#0284C7" />
                      ) : (
                        <ChevronDownIcon open={showStoreDropdown} size={16} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {errors.store ? (
                    <Text style={styles.fieldErrorText}>{errors.store}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Sign in button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <ArrowRightIcon size={16} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Links */}
              <View style={styles.linksRow}>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.linkPrimary}>Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTerms(true)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.linkMuted}>Terms &amp; Conditions</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Text style={styles.footer}>© {new Date().getFullYear()} Super App</Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  bgTop: {
    position: "absolute",
    top: -SCREEN.width * 0.4,
    left: -SCREEN.width * 0.2,
    right: -SCREEN.width * 0.2,
    height: SCREEN.width * 0.9,
    borderRadius: SCREEN.width,
    backgroundColor: "#E0F2FE",
    opacity: 0.7,
  },
  bgAccent: {
    position: "absolute",
    bottom: -SCREEN.width * 0.5,
    right: -SCREEN.width * 0.3,
    width: SCREEN.width * 0.9,
    height: SCREEN.width * 0.9,
    borderRadius: SCREEN.width,
    backgroundColor: "#DBEAFE",
    opacity: 0.6,
  },

  kav: { flex: 1 },

  // No ScrollView — content fills the screen and is centered vertically
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 40 : 24,
    paddingBottom: 16,
    justifyContent: "center",
  },

  // ---------- HERO ----------
  hero: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.2,
    marginBottom: 10,
  },

  // ---------- TRUST ----------
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trustTextGold: {
    fontSize: 12,
    fontFamily: FONT_EN,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 0.4,
  },
  trustTextGreen: {
    fontSize: 12,
    fontFamily: FONT_AM,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.4,
  },
  trustDot: { fontSize: 11, color: "#94A3B8", marginHorizontal: 2 },

  // ---------- CARD ----------
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },

  // ---------- ERROR BANNER ----------
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  errorBannerIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBannerText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },

  // ---------- FIELD ----------
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  labelActive: { color: "#0284C7" },

  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    height: 46,
    paddingHorizontal: 12,
    gap: 8,
  },
  fieldActive: { borderColor: "#0284C7", backgroundColor: "#FFFFFF" },
  fieldError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
    fontWeight: "500",
  },
  eyeButton: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    height: 36,
  },
  fieldErrorText: {
    color: "#DC2626",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "600",
  },

  // ---------- STRENGTH ----------
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },

  // ---------- REMEMBER ME ----------
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  rememberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  // ---------- STORE ----------
  storeWrapper: { position: "relative" },
  storeTrigger: { justifyContent: "flex-start" },
  storeTriggerActive: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
  storeTriggerFocused: { borderColor: "#0284C7", backgroundColor: "#FFFFFF" },
  storeTriggerText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  storeTextPlaceholder: { color: "#94A3B8" },
  storeCodePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storeCodePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.3,
  },

  storeDropdown: {
    position: "absolute",
    bottom: 54,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 100,
  },
  storeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  storeOptionActive: { backgroundColor: "#F0FDF4" },
  storeOptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  storeOptionIcon: { fontSize: 13 },
  storeOptionInfo: { flex: 1, minWidth: 0 },
  storeOptionName: { fontSize: 12.5, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  storeOptionCode: { fontSize: 10, color: "#94A3B8", marginTop: 1, fontWeight: "600" },
  storeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  // ---------- BUTTON ----------
  button: {
    marginTop: 16,
    backgroundColor: "#0284C7",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ---------- LINKS ----------
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  linkPrimary: {
    color: "#0284C7",
    fontSize: 12.5,
    fontWeight: "700",
  },
  linkMuted: {
    color: "#64748B",
    fontSize: 12.5,
    fontWeight: "600",
  },

  // ---------- FOOTER ----------
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 14,
    letterSpacing: 0.3,
  },
});