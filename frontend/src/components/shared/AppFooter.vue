<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="copyright">
        © {{ currentYear }} HR Management System. All rights reserved.
      </div>
      <div class="version">
        Version {{ appVersion }}
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
const appVersion = '1.0.0'
</script>

<style scoped>
.footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>