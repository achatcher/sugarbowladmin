<template>
  <div class="burger-preview">
    <h3>BURGER OF THE WEEK</h3>
    <img 
      :src="burger.imageUrl || '/img/placeholder.png'" 
      alt="Burger preview" 
      class="preview-image"
    />
    <h4 class="preview-burger-name">{{ burger.name ? burger.name.toUpperCase() : 'BURGER NAME' }}</h4>
    <div class="preview-dates">{{ formattedDateRange }}</div>
    <p class="preview-description">{{ burger.description || 'Burger description' }}</p>
    <p class="preview-price">{{ formattedPrice }}</p>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'BurgerPreview',
  props: {
    burger: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const formattedPrice = computed(() => {
      if (!props.burger.price) return '$0.00';
      return `$${parseFloat(props.burger.price).toFixed(2)}`;
    });
    
    const formattedDateRange = computed(() => {
      if (!props.burger.startDate || !props.burger.endDate) {
        return 'Available: Select dates';
      }
      
      try {
        const startDate = new Date(props.burger.startDate);
        const endDate = new Date(props.burger.endDate);
        
        const startOptions = { month: 'long', day: 'numeric' };
        const endOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        
        const formattedStart = startDate.toLocaleDateString('en-US', startOptions);
        const formattedEnd = endDate.toLocaleDateString('en-US', endOptions);
        
        return `Available: ${formattedStart} - ${formattedEnd}`;
      } catch (e) {
        return 'Available: Invalid dates';
      }
    });
    
    return {
      formattedPrice,
      formattedDateRange
    };
  }
};
</script>

<style scoped>
.burger-preview {
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  padding: 20px;
  text-align: center;
  font-family: 'Poppins', sans-serif;
}

h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  color: #2b4da8;
  margin-top: 0;
  margin-bottom: 15px;
  letter-spacing: 1px;
}

.preview-image {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 15px;
}

.preview-burger-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  margin: 0 0 5px;
  color: #222222;
  letter-spacing: 1px;
}

.preview-dates {
  font-size: 0.9rem;
  color: #777777;
  margin-bottom: 15px;
}

.preview-description {
  font-size: 1rem;
  color: #444444;
  margin-bottom: 20px;
  line-height: 1.5;
}

.preview-price {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2b4da8;
  margin: 0;
}
</style>
