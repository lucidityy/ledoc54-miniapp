const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database connection
const db = new sqlite3.Database('./database/ledoc54.db');

// Telegram Bot setup (you'll need to get your bot token from @BotFather)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || 'YOUR_CHAT_ID_HERE';

let bot;
if (BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  bot = new TelegramBot(BOT_TOKEN, { polling: false });
}

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Helper function to log inventory changes
function logInventoryChange(productId, changeAmount, reason, previousStock, newStock) {
  db.run(
    `INSERT INTO inventory_log (product_id, change_amount, reason, previous_stock, new_stock) 
     VALUES (?, ?, ?, ?, ?)`,
    [productId, changeAmount, reason, previousStock, newStock]
  );
}

// Helper function to send Telegram notifications
async function sendOrderNotification(orderDetails) {
  if (!bot) return;
  
  // Admin notification
  const adminMessage = `
🆕 *New Order - LeDoc54*

📋 Order #${orderDetails.order_number}
👤 Customer: ${orderDetails.customer_name}
📞 Phone: ${orderDetails.customer_phone}

🛒 *Products:*
${orderDetails.items.map(item => 
  `• ${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

💰 *Total: €${orderDetails.total_amount.toFixed(2)}*

🚚 Delivery: ${orderDetails.delivery_method}
${orderDetails.delivery_address ? `📍 Address: ${orderDetails.delivery_address}` : ''}
${orderDetails.pickup_location ? `🏪 Pickup: ${orderDetails.pickup_location}` : ''}

⏰ ${new Date().toLocaleString()}
  `;
  
  try {
    await bot.sendMessage(ADMIN_CHAT_ID, adminMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
  
  // Customer confirmation message
  if (orderDetails.telegram_user_id) {
    const customerMessage = `
✅ *Commande confirmée!*

Merci pour votre commande chez LeDoc54.

📋 Commande #${orderDetails.order_number}
💰 Total: €${orderDetails.total_amount.toFixed(2)}

🛒 *Produits:*
${orderDetails.items.map(item => 
  `• ${item.name} x${item.quantity}`
).join('\n')}

${orderDetails.delivery_method === 'delivery' 
  ? '🚚 *Livraison à domicile*\nNous vous contacterons bientôt pour confirmer la livraison.' 
  : '🏪 *Retrait sur place*\nVotre commande sera disponible au point de retrait.'}

💬 Nous vous contacterons prochainement pour finaliser votre commande.

Merci d'avoir choisi LeDoc54!
    `;
    
    try {
      await bot.sendMessage(orderDetails.telegram_user_id, customerMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending customer confirmation:', error);
    }
  }
}

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let query = `SELECT * FROM products WHERE is_available = 1`;
  let params = [];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY name`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get categories
app.get('/api/categories', (req, res) => {
  db.all(`SELECT * FROM categories ORDER BY name`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const {
    customer_name,
    customer_phone,
    delivery_method,
    delivery_address,
    pickup_location,
    items,
    telegram_user_id,
    notes
  } = req.body;

  const order_number = 'LD' + Date.now();
  let total_amount = 0;

  // Calculate total and validate stock
  const itemValidation = items.map(item => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM products WHERE id = ? AND is_available = 1`,
        [item.product_id],
        (err, product) => {
          if (err) reject(err);
          if (!product) reject(new Error(`Product ${item.product_id} not found`));
          if (product.stock < item.quantity) {
            reject(new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`));
          }
          
          const price = product.is_promotion && product.promotion_price ? product.promotion_price : product.price;
          total_amount += price * item.quantity;
          resolve({ ...item, price, product });
        }
      );
    });
  });

  Promise.all(itemValidation)
    .then(validatedItems => {
      // Create order
      db.run(
        `INSERT INTO orders (order_number, customer_name, customer_phone, delivery_method, 
         delivery_address, pickup_location, total_amount, telegram_user_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_number, customer_name, customer_phone, delivery_method, 
         delivery_address, pickup_location, total_amount, telegram_user_id, notes],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const orderId = this.lastID;

          // Insert order items and update stock
          const orderItemPromises = validatedItems.map(item => {
            return new Promise((resolve, reject) => {
              // Insert order item
              db.run(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price],
                (err) => {
                  if (err) reject(err);
                  
                  // Update product stock
                  const newStock = item.product.stock - item.quantity;
                  db.run(
                    `UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [newStock, item.product_id],
                    (err) => {
                      if (err) reject(err);
                      
                      // Log inventory change
                      logInventoryChange(
                        item.product_id,
                        -item.quantity,
                        `Order ${order_number}`,
                        item.product.stock,
                        newStock
                      );
                      
                      resolve();
                    }
                  );
                }
              );
            });
          });

          Promise.all(orderItemPromises)
            .then(() => {
              // Prepare order details for notification
              const orderDetails = {
                order_number,
                customer_name,
                customer_phone,
                delivery_method,
                delivery_address,
                pickup_location,
                telegram_user_id, // Added telegram_user_id for customer notification
                total_amount,
                items: validatedItems.map(item => ({
                  name: item.product.name,
                  quantity: item.quantity,
                  price: item.price
                }))
              };

              // Send Telegram notification
              sendOrderNotification(orderDetails);

              res.json({
                success: true,
                order_id: orderId,
                order_number,
                total_amount
              });
            })
            .catch(err => {
              res.status(500).json({ error: err.message });
            });
        }
      );
    })
    .catch(err => {
      res.status(400).json({ error: err.message });
    });
});

// Admin Routes

// Get all orders (admin)
app.get('/api/admin/orders', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT o.*, 
           GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
  `;
  let params = [];
  
  if (status) {
    query += ` WHERE o.status = ?`;
    params.push(status);
  }
  
  query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update order status (admin)
app.put('/api/admin/orders/:id/status', (req, res) => {
  const { status } = req.body;
  
  db.run(
    `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Add/Update product (admin)
app.post('/api/admin/products', upload.single('image'), (req, res) => {
  const {
    name,
    description,
    price,
    category,
    stock,
    is_promotion,
    promotion_price
  } = req.body;
  
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    `INSERT INTO products (name, description, price, category, stock, image_url, is_promotion, promotion_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, category, stock, image_url, is_promotion || 0, promotion_price || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Log inventory change
      logInventoryChange(this.lastID, stock, 'Initial stock', 0, stock);
      
      res.json({ success: true, product_id: this.lastID });
    }
  );
});

// Update product stock (admin)
app.put('/api/admin/products/:id/stock', (req, res) => {
  const { stock, reason } = req.body;
  const productId = req.params.id;
  
  // Get current stock first
  db.get(`SELECT stock FROM products WHERE id = ?`, [productId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const previousStock = row.stock;
    const changeAmount = stock - previousStock;
    
    db.run(
      `UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [stock, productId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Log inventory change
        logInventoryChange(productId, changeAmount, reason || 'Manual adjustment', previousStock, stock);
        
        res.json({ success: true, changes: this.changes });
      }
    );
  });
});

// Get inventory log (admin)
app.get('/api/admin/inventory-log', (req, res) => {
  db.all(
    `SELECT il.*, p.name as product_name 
     FROM inventory_log il
     JOIN products p ON il.product_id = p.id
     ORDER BY il.created_at DESC
     LIMIT 100`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`LeDoc54 Mini App server running on port ${PORT}`);
  console.log(`Main app: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
}); 