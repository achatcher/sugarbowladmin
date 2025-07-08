<template>
  <div class="date-range-picker">
    <input 
      type="text" 
      class="form-control" 
      :value="formattedDateRange" 
      @focus="showPicker = true"
      readonly
      placeholder="Select date range"
    />
    
    <div v-if="showPicker" class="date-picker-popup">
      <div class="date-picker-header">
        <button @click="prevMonth" type="button" class="month-nav-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="current-month">
          {{ currentMonthName }} {{ currentYear }}
        </div>
        <button @click="nextMonth" type="button" class="month-nav-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div class="calendar">
        <div class="weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <div class="days">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            :class="[
              'day', 
              { 
                'empty': !day.date, 
                'selected': day.selected,
                'in-range': day.inRange,
                'start-date': day.isStart,
                'end-date': day.isEnd,
                'disabled': day.disabled
              }
            ]"
            @click="selectDate(day)"
          >
            {{ day.date ? day.date.getDate() : '' }}
          </div>
        </div>
      </div>
      
      <div class="date-picker-footer">
        <button @click="closePicker" type="button" class="btn btn-sm">Close</button>
        <button @click="applyDates" type="button" class="btn btn-primary btn-sm">Apply</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export default {
  name: 'DateRangePicker',
  props: {
    startDate: {
      type: String,
      default: ''
    },
    endDate: {
      type: String,
      default: ''
    }
  },
  emits: ['update:startDate', 'update:endDate', 'update'],
  setup(props, { emit }) {
    const showPicker = ref(false);
    const currentDate = ref(new Date());
    const selectedStartDate = ref(props.startDate ? new Date(props.startDate) : null);
    const selectedEndDate = ref(props.endDate ? new Date(props.endDate) : null);
    const selecting = ref(false);
    
    // Watch for prop changes
    watch(() => props.startDate, (newValue) => {
      if (newValue && (!selectedStartDate.value || newValue !== formatDate(selectedStartDate.value))) {
        selectedStartDate.value = new Date(newValue);
      }
    });
    
    watch(() => props.endDate, (newValue) => {
      if (newValue && (!selectedEndDate.value || newValue !== formatDate(selectedEndDate.value))) {
        selectedEndDate.value = new Date(newValue);
      }
    });
    
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    const currentMonthName = computed(() => {
      return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate.value);
    });
    
    const currentYear = computed(() => {
      return currentDate.value.getFullYear();
    });
    
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      const days = [];
      
      // Add empty slots for days before the first day of the month
      const firstDayOfWeek = firstDay.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ date: null });
      }
      
      // Add days of the month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateStr = formatDate(date);
        
        const isStart = selectedStartDate.value && dateStr === formatDate(selectedStartDate.value);
        const isEnd = selectedEndDate.value && dateStr === formatDate(selectedEndDate.value);
        
        let inRange = false;
        if (selectedStartDate.value && selectedEndDate.value) {
          inRange = date >= selectedStartDate.value && date <= selectedEndDate.value;
        }
        
        days.push({
          date,
          selected: isStart || isEnd,
          inRange,
          isStart,
          isEnd,
          disabled: date < new Date(new Date().setHours(0, 0, 0, 0))
        });
      }
      
      // Add empty slots for days after the last day of the month
      const remainingDays = 7 - (days.length % 7);
      if (remainingDays < 7) {
        for (let i = 0; i < remainingDays; i++) {
          days.push({ date: null });
        }
      }
      
      return days;
    });
    
    const formattedDateRange = computed(() => {
      if (!selectedStartDate.value || !selectedEndDate.value) {
        return '';
      }
      
      return `${formatDate(selectedStartDate.value)} - ${formatDate(selectedEndDate.value)}`;
    });
    
    function formatDate(date) {
      if (!date) return '';
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    }
    
    function prevMonth() {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
    }
    
    function nextMonth() {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
    }
    
    function selectDate(day) {
      if (!day.date || day.disabled) return;
      
      if (!selectedStartDate.value || selectedEndDate.value) {
        // Start new selection
        selectedStartDate.value = day.date;
        selectedEndDate.value = null;
        selecting.value = true;
      } else {
        // Finish selection
        if (day.date < selectedStartDate.value) {
          selectedEndDate.value = selectedStartDate.value;
          selectedStartDate.value = day.date;
        } else {
          selectedEndDate.value = day.date;
        }
        selecting.value = false;
      }
    }
    
    function applyDates() {
      if (selectedStartDate.value && selectedEndDate.value) {
        emit('update:startDate', formatDate(selectedStartDate.value));
        emit('update:endDate', formatDate(selectedEndDate.value));
        emit('update');
        closePicker();
      }
    }
    
    function closePicker() {
      showPicker.value = false;
    }
    
    // Close picker when clicking outside
    function handleClickOutside(e) {
      const picker = document.querySelector('.date-range-picker');
      if (picker && !picker.contains(e.target)) {
        showPicker.value = false;
      }
    }
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });
    
    return {
      showPicker,
      currentDate,
      weekdays,
      currentMonthName,
      currentYear,
      calendarDays,
      formattedDateRange,
      prevMonth,
      nextMonth,
      selectDate,
      closePicker,
      applyDates
    };
  }
};
</script>

<style scoped>
.date-range-picker {
  position: relative;
  width: 100%;
}

.date-picker-popup {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
}

.current-month {
  font-weight: 500;
  text-align: center;
}

.month-nav-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
}

.month-nav-btn:hover {
  background-color: #f5f5f5;
}

.calendar {
  padding: 10px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 5px;
}

.weekday {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day {
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
}

.day:not(.empty):not(.disabled):hover {
  background-color: #f0f0f0;
}

.day.empty {
  pointer-events: none;
}

.day.disabled {
  color: #ccc;
  cursor: default;
}

.day.selected {
  background-color: #FF6B35;
  color: white;
}

.day.in-range {
  background-color: rgba(255, 107, 53, 0.2);
}

.day.start-date {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.day.end-date {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.date-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 15px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  background-color: #f0f0f0;
}

.btn:hover {
  background-color: #e5e5e5;
}

.btn-primary {
  background-color: #FF6B35;
  color: white;
}

.btn-primary:hover {
  background-color: #e55a26;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.85rem;
}
</style>
