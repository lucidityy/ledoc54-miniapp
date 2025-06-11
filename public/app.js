// Telegram Mini App initialization
let tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Global state
let products = [];
let cart = [];
let currentCategory = 'all';

// DOM elements
const productsGrid = document.getElementById('products-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutModal = document.getElementById('checkout-modal');
const successModal = document.getElementById('success-modal');
const loading = document.getElementById('loading');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  updateCartDisplay();
  
  // Pre-fill user data if available from Telegram
  if (tg && tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    const nameInput = document.getElementById('customer-name');
    if (nameInput && user.first_name) {
      nameInput.value = `${user.first_name} ${user.last_name || ''}`.trim();
    }
  }
});

// API functions
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

// Load products from API
async function loadProducts() {
  try {
    showLoading(true);
    
    const endpoint = currentCategory === 'all' ? '/api/products' : `/api/products?category=${currentCategory}`;
    products = await apiCall(endpoint);
    
    displayProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = '<div class="error">Erreur lors du chargement des produits</div>';
  } finally {
    showLoading(false);
  }
}

// Display products in grid
function displayProducts() {
  if (!products.length) {
    productsGrid.innerHTML = '<div class="no-products">Aucun produit disponible</div>';
    return;
  }
  
  productsGrid.innerHTML = products.map(product => {
    const isPromotion = product.is_promotion && product.promotion_price;
    const currentPrice = isPromotion ? product.promotion_price : product.price;
    const stockClass = product.stock === 0 ? 'stock-out' : product.stock <= 5 ? 'stock-low' : 'stock-available';
    const stockText = product.stock === 0 ? 'Rupture de stock' : product.stock <= 5 ? `${product.stock} restants` : `${product.stock} en stock`;
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : '📦'}
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description || ''}</p>
          <div class="product-price">
            <span class="price ${isPromotion ? 'promotion' : ''}">€${currentPrice.toFixed(2)}</span>
            ${isPromotion ? `<span class="original-price">€${product.price.toFixed(2)}</span>` : ''}
            ${isPromotion ? '<span class="promotion-badge">PROMO</span>' : ''}
          </div>
          <div class="stock-info ${stockClass}">
            ${stockText}
          </div>
          <div class="product-actions">
            <div class="quantity-selector">
              <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)" ${product.stock === 0 ? 'disabled' : ''}>-</button>
              <input type="number" class="quantity-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}" ${product.stock === 0 ? 'disabled' : ''}>
              <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)" ${product.stock === 0 ? 'disabled' : ''}>+</button>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
              ${product.stock === 0 ? 'Indisponible' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Quantity selector functions
function changeQuantity(productId, change) {
  const input = document.getElementById(`qty-${productId}`);
  const product = products.find(p => p.id === productId);
  
  if (!input || !product) return;
  
  let newValue = parseInt(input.value) + change;
  newValue = Math.max(1, Math.min(newValue, product.stock));
  input.value = newValue;
}

// Cart functions
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const quantityInput = document.getElementById(`qty-${productId}`);
  
  if (!product || !quantityInput) return;
  
  const quantity = parseInt(quantityInput.value);
  if (quantity <= 0 || quantity > product.stock) return;
  
  const existingItem = cart.find(item => item.product_id === productId);
  const currentPrice = product.is_promotion && product.promotion_price ? product.promotion_price : product.price;
  
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity <= product.stock) {
      existingItem.quantity = newQuantity;
    } else {
      alert(`Stock insuffisant. Maximum disponible: ${product.stock}`);
      return;
    }
  } else {
    cart.push({
      product_id: productId,
      name: product.name,
      price: currentPrice,
      quantity: quantity,
      image_url: product.image_url
    });
  }
  
  // Reset quantity input
  quantityInput.value = 1;
  
  updateCartDisplay();
  
  // Visual feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = 'Ajouté!';
  btn.style.background = '#2ed573';
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 1000);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product_id !== productId);
  updateCartDisplay();
}

function updateCartItemQuantity(productId, newQuantity) {
  const item = cart.find(item => item.product_id === productId);
  const product = products.find(p => p.id === productId);
  
  if (!item || !product) return;
  
  if (newQuantity <= 0) {
    removeFromCart(productId);
  } else if (newQuantity <= product.stock) {
    item.quantity = newQuantity;
    updateCartDisplay();
  } else {
    alert(`Stock insuffisant. Maximum disponible: ${product.stock}`);
  }
}

function updateCartDisplay() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  cartCount.textContent = totalItems;
  cartTotal.textContent = totalAmount.toFixed(2);
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">Votre panier est vide</div>';
    document.getElementById('checkout-btn').disabled = true;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '📦'}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">€${item.price.toFixed(2)} x ${item.quantity}</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart(${item.product_id})">🗑️</button>
        </div>
      </div>
    `).join('');
    document.getElementById('checkout-btn').disabled = false;
  }
}

// Category filter
function filterByCategory(category) {
  currentCategory = category;
  
  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  loadProducts();
}

// Cart sidebar
function toggleCart() {
  cartSidebar.classList.toggle('open');
}

// Checkout functions
function showCheckout() {
  if (cart.length === 0) return;
  
  updateOrderSummary();
  checkoutModal.classList.add('show');
  toggleCart(); // Close cart
}

function closeCheckout() {
  checkoutModal.classList.remove('show');
}

function updateOrderSummary() {
  const orderItemsSummary = document.getElementById('order-items-summary');
  const finalTotal = document.getElementById('final-total');
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  orderItemsSummary.innerHTML = cart.map(item => `
    <div class="order-item">
      <span>${item.name} x${item.quantity}</span>
      <span>€${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  
  finalTotal.textContent = totalAmount.toFixed(2);
}

function toggleDeliveryFields() {
  const deliveryMethod = document.getElementById('delivery-method').value;
  const deliveryAddressGroup = document.getElementById('delivery-address-group');
  const pickupLocationGroup = document.getElementById('pickup-location-group');
  const deliveryAddress = document.getElementById('delivery-address');
  
  if (deliveryMethod === 'delivery') {
    deliveryAddressGroup.style.display = 'block';
    pickupLocationGroup.style.display = 'none';
    deliveryAddress.required = true;
  } else if (deliveryMethod === 'pickup') {
    deliveryAddressGroup.style.display = 'none';
    pickupLocationGroup.style.display = 'block';
    deliveryAddress.required = false;
  } else {
    deliveryAddressGroup.style.display = 'none';
    pickupLocationGroup.style.display = 'none';
    deliveryAddress.required = false;
  }
}

// Order submission
document.getElementById('checkout-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert('Votre panier est vide');
    return;
  }
  
  const formData = new FormData(this);
  const deliveryMethod = formData.get('delivery-method') || document.getElementById('delivery-method').value;
  
  const orderData = {
    customer_name: formData.get('customer-name') || document.getElementById('customer-name').value,
    customer_phone: formData.get('customer-phone') || document.getElementById('customer-phone').value,
    delivery_method: deliveryMethod,
    delivery_address: deliveryMethod === 'delivery' ? (formData.get('delivery-address') || document.getElementById('delivery-address').value) : null,
    pickup_location: deliveryMethod === 'pickup' ? (formData.get('pickup-location') || document.getElementById('pickup-location').value) : null,
    notes: formData.get('notes') || document.getElementById('notes').value || null,
    telegram_user_id: tg?.initDataUnsafe?.user?.id?.toString() || null,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  };
  
  // Validation
  if (!orderData.customer_name || !orderData.customer_phone || !orderData.delivery_method) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  if (deliveryMethod === 'delivery' && !orderData.delivery_address) {
    alert('Veuillez saisir l\'adresse de livraison');
    return;
  }
  
  try {
    showLoading(true);
    
    const result = await apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    
    if (result.success) {
      // Clear cart
      cart = [];
      updateCartDisplay();
      
      // Show success
      document.getElementById('order-number').textContent = result.order_number;
      closeCheckout();
      successModal.classList.add('show');
      
      // Reload products to update stock
      await loadProducts();
    } else {
      throw new Error(result.error || 'Erreur lors de la création de la commande');
    }
  } catch (error) {
    console.error('Order submission failed:', error);
    alert('Erreur lors de la commande: ' + error.message);
  } finally {
    showLoading(false);
  }
});

function closeSuccess() {
  successModal.classList.remove('show');
}

// Utility functions
function showLoading(show) {
  loading.style.display = show ? 'flex' : 'none';
}

// Telegram Mini App specific functions
if (tg) {
  // Handle back button
  tg.onEvent('backButtonClicked', function() {
    if (successModal.classList.contains('show')) {
      closeSuccess();
    } else if (checkoutModal.classList.contains('show')) {
      closeCheckout();
    } else if (cartSidebar.classList.contains('open')) {
      toggleCart();
    } else {
      tg.close();
    }
  });
  
  // Set main button (optional)
  tg.MainButton.setText('Commander');
  tg.MainButton.onClick(function() {
    if (cart.length > 0) {
      showCheckout();
    }
  });
  
  // Update main button state
  function updateMainButton() {
    if (cart.length > 0) {
      tg.MainButton.show();
      tg.MainButton.enable();
    } else {
      tg.MainButton.hide();
    }
  }
  
  // Override updateCartDisplay to also update main button
  const originalUpdateCartDisplay = updateCartDisplay;
  updateCartDisplay = function() {
    originalUpdateCartDisplay();
    updateMainButton();
  };
}

// Error handling
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
}); 