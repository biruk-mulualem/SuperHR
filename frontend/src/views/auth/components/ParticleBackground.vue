<template>
  <div class="particle-container">
    <div
      v-for="i in 5"
      :key="i"
      class="particle"
      :style="{
        opacity: fadeAnim,
        transform: `translateY(${slideAnim * (i * 15)}px)`,
        backgroundColor: `rgba(255, 255, 255, ${0.1 + i * 0.05})`,
        left: `${10 + i * 20}%`,
        top: `${20 + i * 15}%`,
      }"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const fadeAnim = ref(0)
const slideAnim = ref(30)

onMounted(() => {
  setTimeout(() => {
    fadeAnim.value = 1
    slideAnim.value = 0
  }, 100)
})
</script>

<style scoped>
/* Particle Effects */
.particle-container {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}
</style>