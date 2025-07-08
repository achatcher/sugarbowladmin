<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post, del } from '@aws-amplify/api'
import AdminLayout from '@/layouts/AdminLayout.vue'
import MenuItemModal from '@/components/MenuItems/MenuItemModal.vue'
import ConfirmModal from '@/components/UI/ConfirmModal.vue'
import Alert from '@/components/UI/Alert.vue'

const apiName = 'burgeradminapi'

const menuItems = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const activeFilter = ref('all')
const showItemModal = ref(false)
const showDeleteModal = ref(false)
const showPublishModal = ref(false)
const currentItem = ref(null)
const isEditMode = ref(false)
const apiError = ref(null)

const alerts = ref([])
let nextAlertId = 1

const categories = [
  { value: 'all', label: 'All Items' },
  { value: 'burgers', label: 'Burgers' },
  { value: 'sandwiches', label: 'Sandwiches' },
  { value: 'wraps', label: 'Wraps' },
  { value: 'appetizers', label: 'Appetizers' }
]

const showAlert = (message, type = 'success') => {
  const id = nextAlertId++
  alerts.value.push({ id, message, type })
  setTimeout(() => removeAlert(id), 4000)
}
const removeAlert = id => {
  alerts.value = alerts.value.filter(alert => alert.id !== id)
}

const getCategoryDisplay = category => {
  return categories.find(c => c.value === category)?.label || category
}

const filteredItems = computed(() => {
  let items = [...menuItems.value]
  if (activeFilter.value !== 'all') {
    items = items.filter(i => i.category === activeFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q))
  }
  return items
})

const unpublishedCount = computed(() =>
  menuItems.value.filter(i => !i.published).length
)

const fetchMenuItems = async () => {
  isLoading.value = true
  apiError.value = null

  try {
    console.log("Fetching menu items...")
    const op = get({ apiName, path: '/menu', options: { authMode: 'userPool' } })
    const response = await op.response
    console.log("Menu API response:", response)

    let menuData = [];
    // Handle the response as a ReadableStream
    if (response.body && typeof response.body.json === 'function') {
      menuData = await response.body.json()
      console.log("Parsed menu data:", menuData)
    } else if (Array.isArray(response.body)) {
      menuData = response.body
    } else {
      console.error("Unexpected response format:", response.body)
      menuData = []
    }

    // Ensure menuData is an array
    if (!Array.isArray(menuData)) {
      console.error("Menu data is not an array:", menuData)
      menuData = []
    }

    // Normalize items
    menuItems.value = menuData.map(item => ({
      ...item,
      categoryDisplay: getCategoryDisplay(item.category),
      price: item.priceInCents ? item.priceInCents / 100 : 0,
      published: !!item.published,
    }))

    console.log("Processed menu items:", menuItems.value)
  } catch (err) {
    console.error('Failed to fetch menu items:', err)
    apiError.value = err.message || "Network error"
    showAlert(`Could not load menu items: ${err.message || 'Unknown error'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const saveMenuItem = async (savedItem) => {
  try {
    // Convert price from dollars to cents for the API
    const itemToSave = {
      ...savedItem,
      priceInCents: Math.round((parseFloat(savedItem.price) || 0) * 100)
    };

    console.log("Saving menu item:", itemToSave)

    const path = itemToSave.id ? `/menu/${itemToSave.id}` : '/menu'
    const op = post({
      apiName,
      path,
      options: {
        body: itemToSave,
        authMode: 'userPool'
      },
    })

    const response = await op.response
    console.log("Save response:", response)

    // Check if response contains data
    if (response.body && typeof response.body.json === 'function') {
      const jsonResponse = await response.body.json()
      console.log("Save response parsed:", jsonResponse)
    }

    showAlert(isEditMode.value ? 'Item updated successfully!' : 'Item created successfully!')

    // Refresh the list
    await fetchMenuItems()
    closeItemModal()
  } catch (err) {
    console.error('Failed to save menu item:', err)
    showAlert('Save failed: ' + (err.message || 'Unknown error'), 'error')
  }
}

const deleteMenuItem = async id => {
  try {
    console.log(`Deleting menu item with ID: ${id}`)
    const op = del({ apiName, path: `/menu/${id}`, options: { authMode: 'userPool' } })
    const response = await op.response
    console.log("Delete response:", response)

    // Check if response contains data
    if (response.body && typeof response.body.json === 'function') {
      const jsonResponse = await response.body.json()
      console.log("Delete response parsed:", jsonResponse)
    }

    // Remove from local state
    menuItems.value = menuItems.value.filter(i => i.id !== id)
    showAlert('Item deleted successfully.')
    closeDeleteModal()
  } catch (e) {
    console.error('Delete error:', e)
    showAlert('Delete failed: ' + (e.message || 'Unknown error'), 'error')
  }
}

const publishItems = async () => {
  try {
    const itemsToPublish = menuItems.value.filter(i => !i.published)
    console.log(`Publishing ${itemsToPublish.length} items`)

    for (const item of itemsToPublish) {
      const updated = {
        ...item,
        published: true,
        priceInCents: Math.round((parseFloat(item.price) || 0) * 100)
      }
      const op = post({
        apiName,
        path: `/menu/${item.id}`,
        options: { body: updated, authMode: 'userPool' },
      })
      const response = await op.response
      console.log(`Published item ${item.id}:`, response)

      item.published = true
    }
    showAlert(`${itemsToPublish.length} item(s) published successfully!`)
    closePublishModal()
  } catch (e) {
    console.error('Publish error:', e)
    showAlert('Failed to publish changes: ' + (e.message || 'Unknown error'), 'error')
  }
}

const openAddItemModal = () => {
  isEditMode.value = false
  currentItem.value = {
    name: '',
    price: 0,
    category: categories[1].value, // Default to first actual category
    published: false
  }
  showItemModal.value = true
}

const openEditItemModal = item => {
  isEditMode.value = true
  // Create a deep copy to avoid modifying the original
  currentItem.value = JSON.parse(JSON.stringify(item))
  showItemModal.value = true
}

const closeItemModal = () => {
  showItemModal.value = false
  currentItem.value = null
  isEditMode.value = false
}

const openDeleteModal = item => {
  currentItem.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  currentItem.value = null
  showDeleteModal.value = false
}

const openPublishModal = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
}

const retryFetchItems = () => {
  apiError.value = null
  fetchMenuItems()
}

onMounted(fetchMenuItems)
</script>


<template>
  <AdminLayout>
    <template #page-title>Menu Items</template>

    <div id="alertContainer" class="alerts-container">
      <Alert
        v-for="alert in alerts"
        :key="alert.id"
        :type="alert.type"
        :message="alert.message"
        @close="removeAlert(alert.id)"
      />
    </div>

    <main class="menu-page-main">
      <section class="menu-controls">
        <div class="filter-container" role="list">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="{ active: activeFilter === cat.value }"
            @click="activeFilter = cat.value"
            class="filter-btn"
            role="listitem"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="search-container" role="search">
          <input
            v-model="searchQuery"
            placeholder="Search menu items..."
            class="search-input"
            aria-label="Search menu items"
            type="search"
          />
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" @click="openAddItemModal" aria-label="Add new menu item">
            <i class="fas fa-plus" aria-hidden="true"></i> Add Item
          </button>
          <button
            class="btn btn-publish"
            :class="{ pulse: unpublishedCount > 0 }"
            @click="openPublishModal"
            :disabled="unpublishedCount === 0"
            aria-label="Publish unpublished items"
          >
            <i class="fas fa-upload" aria-hidden="true"></i> Publish
            <span v-if="unpublishedCount > 0" class="badge" aria-live="polite">{{ unpublishedCount }}</span>
          </button>
        </div>
      </section>

      <!-- API Error Message -->
      <div v-if="apiError" class="api-error">
        <p>{{ apiError }}</p>
        <button @click="retryFetchItems" class="btn btn-primary">Retry</button>
      </div>

      <section
        class="menu-items-container"
        :class="{ loading: isLoading }"
        aria-busy="isLoading.toString()"
        aria-live="polite"
      >
        <table class="menu-table" role="grid" aria-describedby="menuDescription">
          <caption id="menuDescription" class="sr-only">List of menu items with status and actions</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col" class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
  <tr v-if="isLoading">
    <td colspan="5" class="text-center">Loading...</td>
  </tr>

  <tr v-else-if="filteredItems.length === 0 && !apiError">
    <td colspan="5" class="text-center">No items found.</td>
  </tr>

  <tr
    v-for="item in filteredItems"
    :key="item.id"
    :class="{ unpublished: !item.published }"
  >
    <td>{{ item.name }}</td>
    <td>
      <span class="category-badge">{{ item.categoryDisplay }}</span>
    </td>
    <td class="menu-price">
      ${{ item.price.toFixed(2) }}
    </td>
    <td>
      <span
        :class="[
          'status-badge',
          item.published ? 'published' : 'unpublished'
        ]"
      >
        {{ item.published ? 'Published' : 'Unpublished' }}
      </span>
    </td>
    <td class="actions-col item-actions">
      <button
        @click="openEditItemModal(item)"
        class="btn-sm btn-primary"
        aria-label="Edit item"
      >
        <i class="fas fa-edit" aria-hidden="true"></i>
        Edit
      </button>
      <button
        @click="openDeleteModal(item)"
        class="btn-sm btn-danger"
        aria-label="Delete item"
      >
        <i class="fas fa-trash-alt" aria-hidden="true"></i>
        Delete
      </button>
    </td>
  </tr>
</tbody>
</table>
</section>
</main>

<MenuItemModal
  v-if="showItemModal"
  :item="currentItem"
  :is-edit="isEditMode"
  :categories="categories.filter(c => c.value !== 'all')"
  @save="saveMenuItem"
  @close="closeItemModal"
/>

<ConfirmModal
  v-if="showDeleteModal"
  title="Delete Menu Item"
  :message="`Are you sure you want to delete '${currentItem?.name}'?`"
  confirm-text="Delete"
  cancel-text="Cancel"
  @confirm="() => deleteMenuItem(currentItem.id)"
  @cancel="closeDeleteModal"
/>

<ConfirmModal
  v-if="showPublishModal"
  title="Publish Changes"
  :message="`You are about to publish ${unpublishedCount} unpublished item(s). This will make them visible to customers.`"
  confirm-text="Publish"
  cancel-text="Cancel"
  @confirm="publishItems"
  @cancel="closePublishModal"
/>

</AdminLayout>
</template>

<style scoped>
.menu-page-main {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.menu-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background-color: F5F5F5_1;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filter-btn.active {
  background-color: 007BFF_1;
  color: white;
  border-color: 007BFF_1;
}

.search-container {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.menu-page-main {
  max-width: 960px;
  margin: 2rem auto 3rem;
  padding: 0 1rem;
  box-sizing: border-box;
  width: 100%;
  color: var(--text-color);
}

.alerts-container {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
  pointer-events: none;
}

.alerts-container > * {
  pointer-events: auto;
}

.menu-controls {
  display: grid;
  grid-template-columns: 1fr auto auto; /* search and actions side by side */
  grid-template-rows: auto auto;        /* two rows */
  gap: 20px 12px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-container {
  grid-column: 1 / -1; /* Span all columns */
  grid-row: 2;         /* Place on second row */
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .menu-controls {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.filter-container {
  display: flex;
  flex-wrap: nowrap; /* Keep all buttons on one line */
  gap: 12px; /* Slightly bigger gap for better spacing */
  overflow-x: auto; /* Allow horizontal scroll if buttons overflow */
  padding-bottom: 6px; /* Space for scrollbar */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scrollbar-width: thin;
  scrollbar-color: var(--btn-bg) transparent;
}

.filter-btn {
  background-color: var(--input-bg);
  border: 1.5px solid var(--input-border);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-color);
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  user-select: none;
  white-space: nowrap; /* Prevent button text from wrapping */
  flex-shrink: 0; 
}

.filter-btn:hover {
  background-color: var(--btn-hover-bg);
  color: var(--input-bg);
  border-color: var(--btn-hover-bg);
}

.filter-btn.active {
  background-color: var(--btn-bg);
  color: var(--input-bg);
  border-color: var(--btn-bg);
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 280px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1.5px solid var(--input-border);
  border-radius: 6px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  outline-offset: 2px;
}

.search-input:focus {
  border-color: var(--btn-bg);
  outline: none;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  padding: 10px 20px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: var(--btn-bg);
  color: var(--input-bg);
  box-shadow: 0 4px 12px rgb(37 99 235 / 0.4);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
  box-shadow: 0 6px 20px rgb(59 130 246 / 0.6);
}

.btn-publish {
  background-color: #28a745;
  color: white;
  position: relative;
  padding: 10px 24px;
}

.btn-publish:hover:not(:disabled) {
  background-color: #218838;
}

.btn-publish:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  box-shadow: none;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

.pulse {
  animation: pulse 2.5s infinite;
}

.menu-items-container {
  background-color: var(--input-bg);
  border-radius: 8px;
  box-shadow: 0 3px 12px rgb(0 0 0 / 0.1);
  overflow: hidden;
  position: relative;
  color: var(--text-color);
  transition: background-color 0.3s ease;
}

.menu-items-container.loading::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(255 255 255 / 0.65);
  backdrop-filter: blur(3px);
  z-index: 10;
  pointer-events: none;
}

.menu-table {
  width: 100%;
  border-collapse: collapse;
}

.menu-table th,
.menu-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--input-border);
  text-align: left;
  font-size: 1rem;
  color: var(--text-color);
}

.menu-table th {
  background-color: var(--bg-color);
  font-weight: 700;
  user-select: none;
}

.menu-table tbody tr:hover:not(.unpublished) {
  background-color: var(--btn-hover-bg);
  color: var(--input-bg);
  cursor: pointer;
}

.menu-table tbody tr.unpublished {
  background-color: #fff8f0;
}

.category-badge {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--input-bg);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-color);
  border: 1.5px solid var(--input-border);
  user-select: none;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  user-select: none;
}

.status-badge.published {
  background-color: #d4edda;
  color: #155724;
  border: 1.5px solid #c3e6cb;
}

.status-badge.unpublished {
  background-color: #fff3cd;
  color: #856404;
  border: 1.5px solid #ffeeba;
}

.menu-price {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.875rem;
  border-radius: 6px;
  border: 1.5px solid var(--input-border);
  background-color: var(--input-bg);
  color: var(--text-color);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  user-select: none;
}

.btn-sm:hover {
  background-color: var(--btn-hover-bg);
  color: var(--input-bg);
}

.actions-col {
  width: 160px;
  white-space: nowrap;
}

.text-center {
  text-align: center;
}

/* Utility for screen reader only text */
.sr-only {
  border: 0 !important;
  clip: rect(1px,1px,1px,1px) !important;
  -webkit-clip-path: inset(50%) !important;
  clip-path: inset(50%) !important;
  height: 1px !important; 
  margin: -1px !important;
  overflow: hidden !important;
  padding: 0 !important;
  position: absolute !important;
  width: 1px !important;
  white-space: nowrap !important;
}
</style>
