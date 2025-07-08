<template>
  <div class="modal-overlay active" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Menu Item' : 'Add Menu Item' }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveItem">
          <!-- Name -->
          <div class="form-group">
            <label for="itemName">Item Name</label>
            <input
              type="text"
              id="itemName"
              v-model="formData.name"
              class="form-control"
              :class="{ error: validationErrors.name }"
              required
            />
            <div v-if="validationErrors.name" class="error-message">{{ validationErrors.name }}</div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="itemDescription">Description</label>
            <textarea
              id="itemDescription"
              v-model="formData.description"
              class="form-control"
              :class="{ error: validationErrors.description }"
              rows="3"
              required
            ></textarea>
            <div v-if="validationErrors.description" class="error-message">{{ validationErrors.description }}</div>
          </div>

          <div class="form-row">
            <!-- Price -->
            <div class="form-group">
              <label for="itemPrice">Price ($)</label>
              <input
                type="number"
                id="itemPrice"
                v-model="formData.priceInCents"
                class="form-control"
                :class="{ error: validationErrors.price }"
                step="0.01"
                min="0"
                required
              />
              <div v-if="validationErrors.price" class="error-message">{{ validationErrors.price }}</div>
            </div>

            <!-- Category -->
            <div class="form-group">
              <label for="itemCategory">Category</label>
              <select
                id="itemCategory"
                v-model="formData.category"
                class="form-control"
                :class="{ error: validationErrors.category }"
                required
                @change="updateCategoryDisplay"
              >
                <option value="">Select category</option>
                <option
                  v-for="category in categories"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </option>
              </select>
              <div v-if="validationErrors.category" class="error-message">{{ validationErrors.category }}</div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              <span v-if="isSaving" class="spinner"></span>
              {{ isSaving ? 'Saving...' : 'Save Item' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { post, put } from 'aws-amplify/api';


const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['save', 'close']);

const isSaving = ref(false);

const formData = reactive({
  id: '',
  name: '',
  description: '',
  priceInCents: '',
  category: '',
  categoryDisplay: '',
  published: false
});

const validationErrors = reactive({
  name: '',
  description: '',
  price: '',
  category: ''
});

onMounted(() => {
  Object.assign(formData, props.item);
});

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      Object.assign(formData, newItem);
    }
  }
);

const updateCategoryDisplay = () => {
  const category = props.categories.find((c) => c.value === formData.category);
  formData.categoryDisplay = category ? category.label : '';
};

const validateForm = () => {
  let isValid = true;
  Object.keys(validationErrors).forEach((k) => (validationErrors[k] = ''));
  if (!formData.name.trim()) {
    validationErrors.name = 'Item name is required';
    isValid = false;
  }
  if (!formData.description.trim()) {
    validationErrors.description = 'Description is required';
    isValid = false;
  }
  if (!formData.priceInCents || isNaN(formData.priceInCents) || Number(formData.priceInCents) <= 0) {
    validationErrors.price = 'Price must be a positive number';
    isValid = false;
  }
  if (!formData.category) {
    validationErrors.category = 'Please select a category';
    isValid = false;
  }
  return isValid;
};

const saveItem = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  try {
    if (typeof formData.priceInCents === 'string') {
      formData.priceInCents = Math.round(parseFloat(formData.priceInCents) * 100);
    }
    if (!formData.categoryDisplay) updateCategoryDisplay();

    const itemToSave = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      priceInCents: formData.priceInCents,
      published: true
    };

    let response;
    if (props.isEdit) {
      // PUT = update existing
      const op = put({
        apiName: 'burgeradminapi',
        path: '/menu',
        options: {
          body: itemToSave,
          authMode: 'userPool'
        }
      });
      response = await op.response;
    } else {
      // POST = create new
      const op = post({
        apiName: 'burgeradminapi',
        path: '/menu',
        options: {
          body: itemToSave,
          authMode: 'userPool'
        }
      });
      response = await op.response;
    }

    const savedItem = await response.body.json();
    emit('save', savedItem); // send saved item back to parent

  } catch (error) {
    console.error('Error saving menu item:', error);
    alert('An error occurred while saving the item.');
  } finally {
    isSaving.value = false;
  }
};

</script>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: var(--input-bg);
  color: var(--text-color);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-color);
  cursor: pointer;
}

.modal-body {
  font-family: 'Inter', sans-serif;
}

.form-group {
  margin-bottom: 20px;
}

.form-label,
label {
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 16px;
}

textarea.form-control {
  resize: vertical;
}

.error-message {
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 6px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--input-border);
}

.upload-area {
  padding: 24px;
  border: 2px dashed var(--input-border);
  border-radius: 12px;
  text-align: center;
  background-color: var(--bg-color);
  cursor: pointer;
  transition: border-color 0.2s ease;
  color: var(--text-color);
}

.upload-area.drag-active {
  border-color: #2563eb;
}

.upload-area i {
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-area .hint {
  font-size: 13px;
  color: #aaa;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-color);
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: var(--btn-bg);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
}

.btn-secondary {
  background-color: var(--input-border);
  color: var(--text-color);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.hidden-input {
  display: none;
}

/* upload progress */
.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 10px;
}

.upload-progress {
  width: 80%;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #FF6B35;
  transition: width 0.3s ease;
}

.upload-percentage {
  font-size: 14px;
  font-weight: bold;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
