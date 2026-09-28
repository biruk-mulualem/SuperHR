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
           <!-- Motto -->
          <div class="brand-motto">
            <p>We Trust In God!!! | <span class="amharic">እግዚአብሔር ይባረክ!!!</span></p>
          </div>

            <!-- System Name -->
          <div class="system-name">
            <p>STOCK MANAGEMENT SYSTEM</p> 
          </div>
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

          <!-- Features -->
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span class="feature-text">📦 Stock Management</span>
            </div>
           
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span class="feature-text">📊 Reports &amp; Analytics</span>
            </div>
            
          </div>

          <div class="brand-divider"></div>

         

        

          <!-- Version -->
          <div class="version-info">
            <p>Version 1.0.1</p>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div class="login-section">
        <div class="login-card">
          <div class="login-inner-border">
            <!-- ✅ Use the working LoginForm component -->
            <LoginForm />
            
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
import { ref, onMounted } from 'vue'
import ParticleBackground from './components/ParticleBackground.vue'
import LoginForm from './components/LoginForm.vue'

// Animation values - same as your original
const fadeAnim = ref(0)
const slideAnim = ref(30)
const scaleAnim = ref(0.95)

// Animations - same as your original
onMounted(() => {
  setTimeout(() => {
    fadeAnim.value = 1
    slideAnim.value = 0
    scaleAnim.value = 1
  }, 100)
})
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
  margin-bottom: 20px;
}

.logo-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
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
  margin-top: 2px;
  color: #c9a84c;
}

/* ================================================================
   DIVIDER
   ================================================================ */
.brand-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #c9a84c, #ffd700);
  margin: 16px auto;
  border-radius: 2px;
}

/* ================================================================
   FEATURES
   ================================================================ */
.brand-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.04);
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(6px);
}

.feature-dot {
  width: 8px;
  height: 8px;
  background: #c9a84c;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5px;
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
  font-size: 20px;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

/* ================================================================
   SYSTEM NAME
   ================================================================ */
.system-name {
  text-align: center;
  margin-top: 8px;
  padding-top: 12px;
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
   VERSION INFO
   ================================================================ */
.version-info {
  text-align: center;
  margin-top: 8px;
}

.version-info p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  margin: 0;
  letter-spacing: 1px;
}

/* ================================================================
   LOGIN SECTION (RIGHT) - WITH INNER BORDER
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
  padding: 40px 36px 20px;
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

/* ================================================================
   FOOTER
   ================================================================ */
.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
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
    padding: 30px 24px 16px;
  }
}

@media (max-width: 480px) {
  .login-section {
    padding: 12px;
  }

  .login-inner-border {
    padding: 24px 16px 12px;
  }

  .footer-links {
    flex-wrap: wrap;
  }
}
</style>