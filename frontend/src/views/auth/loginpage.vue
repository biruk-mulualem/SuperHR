<template>
  <div class="login-wrapper">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
      <div class="bg-shape shape-4"></div>
    </div>

    <!-- Main Container - Full Page -->
    <div class="login-container">
      <!-- Left Side - Branding (Full Height) -->
      <div class="brand-section">
        <div class="brand-content">
          <!-- Logo -->
          <div class="brand-logo">
            <div class="logo-icon">
              <span class="logo-text">SDT</span>
            </div>
            <div class="brand-text">
              <span class="brand-name">SUPER DOUBLE T</span>
              <span class="brand-sub">GENERAL TRADING PLC</span>
            </div>
          </div>

          <div class="brand-divider"></div>

          <!-- Motto -->
          <div class="brand-motto">
            <p>We Trust In God!!! | <span class="amharic">እግዚአብሔር ይባረክ!!!</span></p>
            
          </div>

          <!-- System Name -->
          <div class="system-name">
            <p>STOCK MANAGEMENT SYSTEM</p> 
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form (Full Height with Inner Border) -->
      <div class="login-section">
        <div class="login-card">
          <div class="login-inner-border">
            <div class="login-header">
              <h2>Welcome Back!</h2>
              <p>Please sign in to continue to your account</p>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label>Username / Email</label>
                <div class="input-wrapper">
                  <span class="input-icon">👤</span>
                  <input 
                    type="text" 
                    v-model="username" 
                    placeholder="Enter your username or email"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="password" 
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button" 
                    class="toggle-password" 
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <button type="submit" class="btn-login" :disabled="loading">
                <span v-if="loading" class="spinner"></span>
                <span v-else>Sign In</span>
              </button>
            </form>

            <!-- Footer -->
            <div class="login-footer">
             
              <p>© 2026 Super Double T General Trading PLC. All rights reserved.</p>
              <div class="footer-links">
                <a href="#">Privacy Policy</a>
                <span class="separator">|</span>
                <a href="#">Terms of Use</a>
                <span class="separator">|</span>
                <a href="#">Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) return

  loading.value = true
  try {
    await authStore.login({
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ================================================================
   WRAPPER - FULL PAGE
   ================================================================ */
.login-wrapper {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0e1a;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

/* ================================================================
   BACKGROUND ANIMATION
   ================================================================ */
.bg-animation {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: floatShape 15s ease-in-out infinite;
}

.shape-1 {
  width: 600px;
  height: 600px;
  background: #c9a84c;
  top: -200px;
  right: -200px;
  animation-delay: 0s;
}

.shape-2 {
  width: 500px;
  height: 500px;
  background: #8b5cf6;
  bottom: -200px;
  left: -200px;
  animation-delay: 5s;
}

.shape-3 {
  width: 300px;
  height: 300px;
  background: #f7971e;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 10s;
}

.shape-4 {
  width: 400px;
  height: 400px;
  background: #2563eb;
  bottom: -100px;
  right: -100px;
  animation-delay: 3s;
}

@keyframes floatShape {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

/* ================================================================
   MAIN CONTAINER - FULL PAGE
   ================================================================ */
.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* ================================================================
   BRAND SECTION (LEFT) - FULL HEIGHT
   ================================================================ */
.brand-section {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.brand-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.brand-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(201, 168, 76, 0.06), transparent 70%);
}

.brand-content {
  position: relative;
  z-index: 1;
  color: white;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* ================================================================
   BRAND LOGO
   ================================================================ */
.brand-logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.logo-text {
  font-size: 64px;
  font-weight: 900;
  color: #c9a84c;
  letter-spacing: -3px;
  text-shadow: 0 2px 30px rgba(201, 168, 76, 0.2);
}

.brand-text {
  text-align: center;
}

.brand-name {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 3px;
  display: block;
  color: #ffffff;
}

.brand-sub {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.7;
  letter-spacing: 4px;
  display: block;
  margin-top: 4px;
  color: #c9a84c;
}

/* ================================================================
   DIVIDER
   ================================================================ */
.brand-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #c9a84c, #ffd700);
  margin: 20px auto;
  border-radius: 2px;
}

/* ================================================================
   MOTTO
   ================================================================ */
.brand-motto {
  text-align: center;
  margin: 10px 0;
}

.brand-motto p {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #c9a84c;
  letter-spacing: 1px;
}

.brand-motto .amharic {
  font-size: 22px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

/* ================================================================
   SYSTEM NAME
   ================================================================ */
.system-name {
  text-align: center;
  margin-top: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.system-name p {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 3px;
  margin: 0;
}

/* ================================================================
   LOGIN SECTION (RIGHT) - FULL HEIGHT WITH INNER BORDER
   ================================================================ */
.login-section {
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  height: 100%;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-inner-border {
  padding: 40px 36px;
  border: 2px solid #c9a84c;
  border-radius: 16px;
  background: #ffffff;
  position: relative;
  box-shadow: 0 0 30px rgba(201, 168, 76, 0.05);
}

/* Inner border glow effect */
.login-inner-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.2), transparent, rgba(201, 168, 76, 0.2));
  z-index: -1;
  filter: blur(10px);
}

/* Decorative corner accents */
.login-inner-border::after {
  content: '✦';
  position: absolute;
  top: -10px;
  right: 20px;
  color: #c9a84c;
  font-size: 14px;
  background: #ffffff;
  padding: 0 8px;
}

/* Add second corner accent */
.login-header::before {
  content: '✦';
  position: absolute;
  top: -10px;
  left: 20px;
  color: #c9a84c;
  font-size: 14px;
  background: #ffffff;
  padding: 0 8px;
}

.login-header {
  position: relative;
  margin-bottom: 28px;
}

.login-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 2px 0;
}

.login-header p {
  color: #94a3b8;
  margin: 0;
  font-size: 14px;
}

/* ================================================================
   LOGIN FORM
   ================================================================ */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  opacity: 0.4;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 14px 12px 44px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: #f8fafc;
  transition: all 0.3s;
  font-family: inherit;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #c9a84c;
  background: white;
  box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.08);
}

.input-wrapper input::placeholder {
  color: #94a3b8;
  font-size: 13px;
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.4;
  padding: 4px;
}

.toggle-password:hover {
  opacity: 1;
}

/* ================================================================
   LOGIN BUTTON
   ================================================================ */
.btn-login {
  padding: 13px;
  background: #c9a84c;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.btn-login:hover:not(:disabled) {
  background: #b8973e;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(201, 168, 76, 0.3);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   FOOTER
   ================================================================ */
.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.login-footer .footer-motto {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px 0;
}

.login-footer p {
  font-size: 11px;
  color: #94a3b8;
  margin: 4px 0;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  margin-top: 8px;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #c9a84c;
}

.separator {
  color: #cbd5e1;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .login-container {
    grid-template-columns: 1fr;
    width: 100%;
    height: 100%;
  }

  .brand-section {
    display: none;
  }

  .login-section {
    padding: 20px;
  }

  .login-card {
    max-width: 100%;
  }
  
  .login-inner-border {
    padding: 30px 24px;
  }
}

@media (max-width: 480px) {
  .login-section {
    padding: 12px;
  }

  .login-inner-border {
    padding: 24px 16px;
  }

  .login-header h2 {
    font-size: 22px;
  }

  .login-footer .footer-motto {
    font-size: 12px;
  }

  .footer-links {
    flex-wrap: wrap;
  }
}
</style>