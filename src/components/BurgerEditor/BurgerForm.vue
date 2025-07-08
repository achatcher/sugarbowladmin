<template>
  <div class="burger-form">
    <div class="form-group">
      <label class="form-label" for="burger-name">Burger Name</label>
      <input 
        type="text" 
        class="form-control" 
        id="burger-name" 
        v-model="localBurger.name"
        @input="updateBurger"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label" for="burger-description">Description</label>
      <textarea 
        class="form-control" 
        id="burger-description"
        v-model="localBurger.description"
        @input="updateBurger"
      ></textarea>
    </div>
    
    <div class="input-group">
      <div class="form-group">
        <label class="form-label" for="burger-price">Price ($)</label>
        <input 
          type="number" 
          class="form-control" 
          id="burger-price" 
          step="0.01" 
          v-model="localBurger.price"
          @input="updateBurger"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label" for="date-range">Available Dates</label>
        <date-range-picker
          v-model:start-date="localBurger.startDate"
          v-model:end-date="localBurger.endDate"
          @update="updateBurger"
        />
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Burger Image</label>
      <div class="image-upload" id="image-upload">
        <div class="upload-preview">
          <img 
            :src="localBurger.imageUrl || '/img/placeholder.png'" 
            alt="Burger preview" 
            id="image-preview"
          />
        </div>
        <div class="upload-zone" id="upload-zone" @click="triggerFileInput">
          <i class="fas fa-cloud-upload-alt"></i>
          <div class="upload-text">Click to upload a new image or drop it here</div>
          <p class="help-text">JPG, PNG or GIF • Max 2MB • Recommended size 600 x 400px</p>
          <input 
            type="file" 
            class="file-input" 
            id="burger-image" 
            accept="image/*"
            @change="handleImageUpload"
            ref="fileInput"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, toRefs } from 'vue';
import DateRangePicker from '@/components/UI/DateRangePicker.vue';

export default {
  name: 'BurgerForm',
  components: {
    DateRangePicker
  },
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'update:image'],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const localBurger = reactive({ ...props.modelValue });
    
    // Watch for changes in the props and update the local model
    watch(() => props.modelValue, (newValue) => {
      Object.assign(localBurger, newValue);
    }, { deep: true });
    
    const updateBurger = () => {
      emit('update:modelValue', { ...localBurger });
    };
    
    const triggerFileInput = () => {
      fileInput.value.click();
    };
    
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('Image file size should be less than 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        localBurger.imageUrl = e.target.result;
        updateBurger();
        emit('update:image', e.target.result);
      };
      reader.readAsDataURL(file);
    };
    
    return {
      localBurger,
      updateBurger,
      fileInput,
      triggerFileInput,
      handleImageUpload
    };
  }
};
</script>

<style scoped>
.burger-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #2b4da8;
  outline: none;
}

textarea.form-control {
  min-height: 120px;
  resize: vertical;
}

.input-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

@media (max-width: 768px) {
  .input-group {
    grid-template-columns: 1fr;
  }
}

.image-upload {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

@media (max-width: 768px) {
  .image-upload {
    grid-template-columns: 1fr;
  }
}

.upload-preview {
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.upload-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.upload-zone {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover {
  border-color: #2b4da8;
}

.upload-zone i {
  font-size: 2rem;
  color: #999;
  margin-bottom: 10px;
}

.upload-text {
  font-weight: 500;
  margin-bottom: 8px;
}

.help-text {
  font-size: 0.85rem;
  color: #777;
  margin: 0;
}

.file-input {
  display: none;
}
</style>