const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database('./database/ledoc54.db');

// Initialize database tables
db.serialize(() => {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT 1,
    is_promotion BOOLEAN DEFAULT 0,
    promotion_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_method TEXT NOT NULL,
    delivery_address TEXT,
    pickup_location TEXT,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    telegram_user_id TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Inventory log table for tracking stock changes
  db.run(`CREATE TABLE IF NOT EXISTS inventory_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT,
    previous_stock INTEGER,
    new_stock INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Insert default categories
  db.run(`INSERT OR IGNORE INTO categories (name, description) VALUES 
    ('Ecaille', 'Premium Ecaille products'),
    ('Pharma', 'Indian Pharma K products'),
    ('Cali', 'Cali US products')`);

  // Insert sample products for LeDoc54
  db.run(`INSERT OR IGNORE INTO products (name, description, price, category, stock, is_available) VALUES 
    ('Ecaille Premium', 'High quality Ecaille product with premium finish', 45.00, 'Ecaille', 15, 1),
    ('Ecaille Classic', 'Standard Ecaille product for everyday use', 35.00, 'Ecaille', 20, 1),
    ('Indian Pharma K Original', 'Authentic Indian Pharma K formula', 55.00, 'Pharma', 10, 1),
    ('Indian Pharma K Enhanced', 'Enhanced formula with improved potency', 65.00, 'Pharma', 8, 1),
    ('Cali US Blue', 'Premium Cali US Blue variant', 70.00, 'Cali', 12, 1),
    ('Cali US Green', 'Premium Cali US Green variant', 70.00, 'Cali', 12, 1),
    ('Cali US Purple', 'Limited edition Cali US Purple', 85.00, 'Cali', 5, 1)`);

  console.log('Database initialized successfully!');
  console.log('Sample products added for LeDoc54');
});

db.close(); 