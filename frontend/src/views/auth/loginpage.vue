<template>
  <div class="login-container">
    <div class="background">
      <!-- Particle Effects -->
      <ParticleBackground />
      
      <!-- Main Content -->
      <div
        class="content-container"
        :style="{
          opacity: fadeAnim,
          transform: `translateY(${slideAnim}px) scale(${scaleAnim})`,
        }"
      >
        <!-- Form Card -->
        <LoginForm />
        
        <!-- Footer -->
        <div class="footer-container">
          <div class="footer-links">
            <span class="footer-text">Version 1.0.0</span>
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

// Animation values
const fadeAnim = ref(0)
const slideAnim = ref(30)
const scaleAnim = ref(0.95)

// Animations
onMounted(() => {
  setTimeout(() => {
    fadeAnim.value = 1
    slideAnim.value = 0
    scaleAnim.value = 1
  }, 100)
})
</script>

<style scoped>
/* Container */
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.background {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  position: relative;
  overflow: hidden;
}

/* Content Container */
.content-container {
  width: 90%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s ease;
  z-index: 1;
}

/* Footer */
.footer-container {
  margin-top: 20px;
  text-align: center;
  width: 100%;
}

.footer-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

/* Responsive */
@media (max-width: 480px) {
  .content-container {
    max-width: 95%;
  }
}
</style>