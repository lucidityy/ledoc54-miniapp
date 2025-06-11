// Admin App JavaScript
let currentSection = 'products';
let products = [];
let orders = [];
let inventoryLog = [];

// DOM Elements
const loadingSpinner = document.getElementById('admin-loading');
const toastContainer = document.getElementById('toast-container');

// Initialize admin app
document.addEventListener('DOMContentLoaded', function() {
  loadInitialData();
  
  // Set up form handlers
  setupFormHandlers();
  
  // Load products section by default
  showSection('products');
});

// API Helper function
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Load initial data
async function loadInitialData() {
  try {
    showLoading(true);
    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadInventoryLog()
    ]);
    updateAnalytics();
  } catch (error) {
    showToast('Erreur lors du chargement des données', 'error');
  } finally {
    showLoading(false);
  }
}

// Section Management
function showSection(sectionName) {
  // Update navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');
  
  // Update sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionName}-section`).classList.add('active');
  
  currentSection = sectionName;
  
  // Load section-specific data
  switch (sectionName) {
    case 'products':
      displayProducts();
      break;
    case 'orders':
      displayOrders();
      break;
    case 'inventory':
      displayInventoryOverview();
      displayInventoryLog();
      break;
    case 'analytics':
      updateAnalytics();
      loadRecentActivity();
      break;
  }
}

// Products Management
async function loadProducts() {
  try {
    products = await apiCall('/api/products');
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Erreur lors du chargement des produits', 'error');
  }
}

function displayProducts() {
  const productsList = document.getElementById('products-list');
  
  if (!products.length) {
    productsList.innerHTML = '<div class="no-data">Aucun produit trouvé</div>';
    return;
  }
  
  productsList.innerHTML = products.map(product => {
    const stockClass = product.stock === 0 ? 'stock-out' : product.stock <= 5 ? 'stock-low' : 'stock-good';
    const stockText = product.stock === 0 ? 'Rupture de stock' : `${product.stock} en stock`;
    
    return `
      <div class="product-admin-card">
        <div class="product-admin-header">
          <h3 class="product-admin-title">${product.name}</h3>
          <span class="product-admin-category">${product.category}</span>
        </div>
        <div class="product-admin-info">
          <div class="product-admin-price">
            €${product.price.toFixed(2)}
            ${product.is_promotion && product.promotion_price ? 
              `<small style="text-decoration: line-through; color: #666;">€${product.promotion_price.toFixed(2)}</small>` : ''}
          </div>
          <p style="color: #666; margin-bottom: 1rem;">${product.description || 'Aucune description'}</p>
          <div class="product-admin-stock ${stockClass}">
            ${stockText}
          </div>
        </div>
        <div class="product-admin-actions">
          <button class="secondary-btn" onclick="editProduct(${product.id})">Modifier</button>
          <button class="success-btn" onclick="adjustStock(${product.id})">Stock</button>
          <button class="danger-btn" onclick="toggleProductAvailability(${product.id}, ${!product.is_available})">
            ${product.is_available ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Orders Management
async function loadOrders() {
  try {
    orders = await apiCall('/api/admin/orders');
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Erreur lors du chargement des commandes', 'error');
  }
}

function displayOrders() {
  const ordersList = document.getElementById('orders-list');
  
  if (!orders.length) {
    ordersList.innerHTML = '<div class="no-data">Aucune commande trouvée</div>';
    return;
  }
  
  ordersList.innerHTML = orders.map(order => {
    const statusClass = `status-${order.status}`;
    const statusText = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    }[order.status] || order.status;
    
    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-number">#${order.order_number}</div>
          <div class="order-status ${statusClass}">${statusText}</div>
        </div>
        <div class="order-info">
          <div>
            <strong class="order-customer">${order.customer_name}</strong><br>
            <span style="color: #666;">${order.customer_phone}</span><br>
            <span style="color: #666;">${order.delivery_method === 'delivery' ? '🚚 Livraison' : '🏪 Retrait'}</span>
          </div>
          <div style="text-align: right;">
            <div class="order-total">€${order.total_amount.toFixed(2)}</div>
            <div style="color: #666; font-size: 0.9rem;">
              ${new Date(order.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        <div style="margin: 1rem 0; color: #666; font-size: 0.9rem;">
          <strong>Produits:</strong> ${order.items_summary || 'Voir détails'}
        </div>
        <div class="order-actions">
          <button class="secondary-btn" onclick="viewOrderDetails(${order.id})">Détails</button>
          <button class="success-btn" onclick="updateOrderStatus(${order.id}, 'confirmed')" 
                  ${order.status === 'confirmed' || order.status === 'delivered' ? 'disabled' : ''}>
            Confirmer
          </button>
          <button class="primary-btn" onclick="updateOrderStatus(${order.id}, 'delivered')"
                  ${order.status === 'delivered' ? 'disabled' : ''}>
            Livrer
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function filterOrders() {
  const status = document.getElementById('order-status-filter').value;
  
  try {
    showLoading(true);
    const endpoint = status ? `/api/admin/orders?status=${status}` : '/api/admin/orders';
    orders = await apiCall(endpoint);
    displayOrders();
  } catch (error) {
    showToast('Erreur lors du filtrage des commandes', 'error');
  } finally {
    showLoading(false);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    showLoading(true);
    await apiCall(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    showToast('Statut de commande mis à jour', 'success');
    await loadOrders();
    displayOrders();
    updateAnalytics();
  } catch (error) {
    showToast('Erreur lors de la mise à jour du statut', 'error');
  } finally {
    showLoading(false);
  }
}

// Inventory Management
async function loadInventoryLog() {
  try {
    inventoryLog = await apiCall('/api/admin/inventory-log');
  } catch (error) {
    console.error('Error loading inventory log:', error);
    showToast('Erreur lors du chargement de l\'historique', 'error');
  }
}

function displayInventoryOverview() {
  const overview = document.getElementById('inventory-overview');
  
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  
  overview.innerHTML = `
    <div class="inventory-card">
      <h4>Total Produits</h4>
      <div class="inventory-value">${totalProducts}</div>
    </div>
    <div class="inventory-card">
      <h4>Stock Total</h4>
      <div class="inventory-value">${totalStock}</div>
    </div>
    <div class="inventory-card">
      <h4>Ruptures</h4>
      <div class="inventory-value">${outOfStock}</div>
    </div>
    <div class="inventory-card">
      <h4>Stock Faible</h4>
      <div class="inventory-value">${lowStock}</div>
    </div>
  `;
}

function displayInventoryLog() {
  const logList = document.getElementById('inventory-log-list');
  
  if (!inventoryLog.length) {
    logList.innerHTML = '<div class="no-data">Aucun mouvement trouvé</div>';
    return;
  }
  
  logList.innerHTML = inventoryLog.map(log => {
    const changeClass = log.change_amount > 0 ? 'positive' : 'negative';
    const changeSymbol = log.change_amount > 0 ? '+' : '';
    
    return `
      <div class="log-item">
        <div>
          <strong>${log.product_name}</strong><br>
          <small>${log.reason}</small>
        </div>
        <div style="text-align: right;">
          <div class="log-change ${changeClass}">
            ${changeSymbol}${log.change_amount}
          </div>
          <small>${new Date(log.created_at).toLocaleDateString('fr-FR')}</small>
        </div>
      </div>
    `;
  }).join('');
}

// Analytics
function updateAnalytics() {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === today
  );
  const dailySales = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  
  document.getElementById('daily-sales').textContent = `€${dailySales.toFixed(2)}`;
  document.getElementById('pending-orders').textContent = pendingOrders;
  document.getElementById('out-of-stock').textContent = outOfStock;
  document.getElementById('low-stock').textContent = lowStock;
}

function loadRecentActivity() {
  const activityList = document.getElementById('recent-activity-list');
  
  // Combine recent orders and inventory changes
  const activities = [
    ...orders.slice(0, 5).map(order => ({
      type: 'order',
      text: `Nouvelle commande #${order.order_number} - ${order.customer_name}`,
      time: order.created_at
    })),
    ...inventoryLog.slice(0, 5).map(log => ({
      type: 'inventory',
      text: `Stock ${log.product_name}: ${log.change_amount > 0 ? '+' : ''}${log.change_amount}`,
      time: log.created_at
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  
  if (!activities.length) {
    activityList.innerHTML = '<div class="no-data">Aucune activité récente</div>';
    return;
  }
  
  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div>${activity.text}</div>
      <div class="activity-time">
        ${new Date(activity.time).toLocaleDateString('fr-FR')} 
        ${new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  `).join('');
}

// Modal Management
function showAddProductModal() {
  document.getElementById('add-product-modal').classList.add('show');
}

function closeAddProductModal() {
  document.getElementById('add-product-modal').classList.remove('show');
  document.getElementById('add-product-form').reset();
}

function showStockUpdateModal() {
  // Populate product select
  const select = document.getElementById('stock-product-select');
  select.innerHTML = '<option value="">Choisir un produit...</option>' +
    products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  
  document.getElementById('stock-update-modal').classList.add('show');
}

function closeStockUpdateModal() {
  document.getElementById('stock-update-modal').classList.remove('show');
  document.getElementById('stock-update-form').reset();
}

async function viewOrderDetails(orderId) {
  try {
    showLoading(true);
    
    // Get order details with items
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Commande non trouvée');
    
    // Get order items (you might need a separate API call here)
    const orderDetails = `
      <div class="order-detail-section">
        <h4>Informations Client</h4>
        <p><strong>Nom:</strong> ${order.customer_name}</p>
        <p><strong>Téléphone:</strong> ${order.customer_phone}</p>
        <p><strong>Mode de livraison:</strong> ${order.delivery_method === 'delivery' ? 'Livraison à domicile' : 'Retrait sur place'}</p>
        ${order.delivery_address ? `<p><strong>Adresse:</strong> ${order.delivery_address}</p>` : ''}
        ${order.pickup_location ? `<p><strong>Lieu de retrait:</strong> ${order.pickup_location}</p>` : ''}
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
      </div>
      
      <div class="order-detail-section">
        <h4>Produits commandés</h4>
        <div style="color: #666;">${order.items_summary || 'Détails non disponibles'}</div>
      </div>
      
      <div class="order-detail-section">
        <h4>Résumé</h4>
        <p><strong>Total:</strong> €${order.total_amount.toFixed(2)}</p>
        <p><strong>Statut:</strong> ${order.status}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('fr-FR')} à ${new Date(order.created_at).toLocaleTimeString('fr-FR')}</p>
      </div>
      
      <div class="order-detail-section">
        <h4>Actions</h4>
        <div class="status-update-form">
          <select id="order-status-update">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>En attente</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Livrée</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
          </select>
          <button class="primary-btn" onclick="updateOrderStatusFromModal(${orderId})">
            Mettre à jour
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('order-details-content').innerHTML = orderDetails;
    document.getElementById('order-details-modal').classList.add('show');
  } catch (error) {
    showToast('Erreur lors du chargement des détails', 'error');
  } finally {
    showLoading(false);
  }
}

function closeOrderDetailsModal() {
  document.getElementById('order-details-modal').classList.remove('show');
}

async function updateOrderStatusFromModal(orderId) {
  const newStatus = document.getElementById('order-status-update').value;
  await updateOrderStatus(orderId, newStatus);
  closeOrderDetailsModal();
}

// Form Handlers
function setupFormHandlers() {
  // Product promotion checkbox handler
  document.getElementById('product-promotion').addEventListener('change', function() {
    const promotionPriceGroup = document.getElementById('promotion-price-group');
    promotionPriceGroup.style.display = this.checked ? 'block' : 'none';
  });
  
  // Stock product select handler
  document.getElementById('stock-product-select').addEventListener('change', function() {
    const productId = this.value;
    const product = products.find(p => p.id == productId);
    const currentStockInput = document.getElementById('current-stock');
    const newStockInput = document.getElementById('new-stock');
    
    if (product) {
      currentStockInput.value = product.stock;
      newStockInput.value = product.stock;
    } else {
      currentStockInput.value = '';
      newStockInput.value = '';
    }
  });
  
  // Add product form
  document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      showLoading(true);
      
      const formData = new FormData(this);
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du produit');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showToast('Produit ajouté avec succès', 'success');
        closeAddProductModal();
        await loadProducts();
        displayProducts();
        updateAnalytics();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout du produit');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      showLoading(false);
    }
  });
  
  // Stock update form
  document.getElementById('stock-update-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      showLoading(true);
      
      const productId = document.getElementById('stock-product-select').value;
      const newStock = parseInt(document.getElementById('new-stock').value);
      const reason = document.getElementById('stock-reason').value;
      
      if (!productId) {
        throw new Error('Veuillez sélectionner un produit');
      }
      
      await apiCall(`/api/admin/products/${productId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ stock: newStock, reason })
      });
      
      showToast('Stock mis à jour avec succès', 'success');
      closeStockUpdateModal();
      await loadProducts();
      await loadInventoryLog();
      displayProducts();
      displayInventoryOverview();
      displayInventoryLog();
      updateAnalytics();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      showLoading(false);
    }
  });
}

// Utility functions
function showLoading(show) {
  loadingSpinner.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toastContainer.removeChild(toast), 300);
  }, 3000);
}

// Product actions
async function adjustStock(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  // Pre-select the product in the stock update modal
  showStockUpdateModal();
  document.getElementById('stock-product-select').value = productId;
  document.getElementById('current-stock').value = product.stock;
  document.getElementById('new-stock').value = product.stock;
}

async function toggleProductAvailability(productId, isAvailable) {
  try {
    showLoading(true);
    
    // This would need to be implemented in the backend
    await apiCall(`/api/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_available: isAvailable })
    });
    
    showToast(`Produit ${isAvailable ? 'activé' : 'désactivé'}`, 'success');
    await loadProducts();
    displayProducts();
  } catch (error) {
    showToast('Erreur lors de la mise à jour du produit', 'error');
  } finally {
    showLoading(false);
  }
}

function editProduct(productId) {
  // This would open an edit modal similar to add product
  showToast('Fonction d\'édition à implémenter', 'info');
}

// Auto-refresh data every 30 seconds
setInterval(async () => {
  try {
    await loadOrders();
    if (currentSection === 'orders') {
      displayOrders();
    }
    if (currentSection === 'analytics') {
      updateAnalytics();
    }
  } catch (error) {
    console.error('Auto-refresh failed:', error);
  }
}, 30000); 