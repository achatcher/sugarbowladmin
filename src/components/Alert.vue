<template>
  <div :class="['alert', `alert-${type}`]">
    {{ message }}
    <button type="button" class="alert-close" @click="$emit('close')">×</button>
  </div>
</template>

<script>
export default {
  name: 'Alert',
  props: {
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    message: {
      type: String,
      required: true
    }
  },
  emits: ['close']
};
</script>

<style scoped>
.alert {
  padding: 12px 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  position: relative;
  animation: slide-in 0.3s ease-out forwards;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

@keyframes slide-in {
  0% {
    transform: translateY(-50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
