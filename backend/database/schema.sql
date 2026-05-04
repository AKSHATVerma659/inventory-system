CREATE DATABASE IF NOT EXISTS inventory_asset_system;
USE inventory_asset_system;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE user_roles (
  user_id BIGINT,
  role_id BIGINT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE brands (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE units (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  short_name VARCHAR(10) NOT NULL
);

CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category_id BIGINT,
  brand_id BIGINT,
  unit_id BIGINT,
  cost_price DECIMAL(15,4) NOT NULL,
  selling_price DECIMAL(15,4) NOT NULL,
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE product_variants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  variant_name VARCHAR(100),
  variant_value VARCHAR(100),
  sku VARCHAR(100) UNIQUE,
  additional_price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE warehouses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(15,4) DEFAULT 0,
  UNIQUE (product_id, warehouse_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(50),
  entity VARCHAR(50),
  entity_id BIGINT,
  old_value JSON,
  new_value JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE stock_movements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT,
  warehouse_id BIGINT,
  quantity_change DECIMAL(15,4),
  reference_type VARCHAR(50), -- SALE, PURCHASE, TRANSFER
  reference_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  supplier_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  invoice_no VARCHAR(100),
  subtotal DECIMAL(15,4) NOT NULL,
  tax_amount DECIMAL(15,4) DEFAULT 0,
  total_amount DECIMAL(15,4) NOT NULL,
  paid_amount DECIMAL(15,4) DEFAULT 0,
  status VARCHAR(30), -- DRAFT, PARTIAL, PAID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE purchase_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  purchase_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit_price DECIMAL(15,4) NOT NULL,
  total_price DECIMAL(15,4) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE sales (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  invoice_no VARCHAR(100),
  subtotal DECIMAL(15,4) NOT NULL,
  tax_amount DECIMAL(15,4) DEFAULT 0,
  total_amount DECIMAL(15,4) NOT NULL,
  paid_amount DECIMAL(15,4) DEFAULT 0,
  status VARCHAR(30), -- DRAFT, PARTIAL, PAID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE sale_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sale_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit_price DECIMAL(15,4) NOT NULL,
  total_price DECIMAL(15,4) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE stock_transfers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  from_warehouse_id BIGINT NOT NULL,
  to_warehouse_id BIGINT NOT NULL,
  status VARCHAR(30), -- PENDING, COMPLETED
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE stock_transfer_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  stock_transfer_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reference_type VARCHAR(20) NOT NULL, -- SALE or PURCHASE
  reference_id BIGINT NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  payment_method VARCHAR(30), -- CASH, BANK, UPI, CARD
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  remarks VARCHAR(255),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

select * from roles;
SELECT * FROM users WHERE email = 'admin@test.com';

-- ensure ADMIN role exists
INSERT INTO roles (name)
SELECT 'ADMIN' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');

-- get role and user ids into variables
SET @role_id = (SELECT id FROM roles WHERE name='ADMIN' LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE email='admin@test.com' LIMIT 1);

SELECT u.id, u.email, r.name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@test.com';

SELECT id FROM roles WHERE name = 'ADMIN';
SELECT id FROM users WHERE email = 'admin@test.com';
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 2);

-- Check role IDs
SELECT * FROM roles;

-- Suppose ADMIN role id = 2
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 2);

INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1);
SELECT * FROM user_roles WHERE user_id = 1;

ALTER TABLE stock_movements
ADD COLUMN user_id BIGINT,
ADD CONSTRAINT fk_stock_movements_user
FOREIGN KEY (user_id) REFERENCES users(id);

SELECT id, supplier_id, warehouse_id, status FROM purchases;

SELECT * FROM suppliers;
INSERT INTO suppliers (name, email, phone)
VALUES ('ABC Suppliers', 'abc@supplier.com', '9999999999');
select id from suppliers;
SELECT COUNT(*) FROM suppliers WHERE id = 1;
SELECT TABLE_SCHEMA, TABLE_NAME
FROM information_schema.tables
WHERE TABLE_NAME = 'suppliers';

SELECT COUNT(*) FROM warehouses WHERE id = 1;
select * from warehouses;
INSERT INTO warehouses (name, location, is_active)
VALUES ('Main Warehouse', 'Head Office', 1);


INSERT INTO purchases
(supplier_id, warehouse_id, invoice_no, subtotal, tax_amount, total_amount, paid_amount, status)
VALUES
(1, 1, 'PUR-001', 50000, 0, 50000, 0, 'DRAFT');
INSERT INTO purchase_items
(purchase_id, product_id, quantity, unit_price, total_price)
VALUES
(LAST_INSERT_ID(), 1, 10, 5000, 50000);
SELECT id, supplier_id, warehouse_id, status
FROM purchases;
select * from sales;
select * from sale_items;
select * from customers;
INSERT INTO customers (name, email, phone)
VALUES ('John Customer', 'john@test.com', '8888888888');
INSERT INTO sales
(customer_id, warehouse_id, invoice_no, subtotal, tax_amount, total_amount, paid_amount, status)
VALUES
(1, 1, 'SAL-001', 130000, 0, 130000, 0, 'DRAFT');
INSERT INTO sale_items
(sale_id, product_id, quantity, unit_price, total_price)
VALUES
(1, 1, 2, 65000, 130000);
SELECT id, name, email FROM users;

SELECT *
FROM inventory i
LEFT JOIN products p ON p.id = i.product_id
WHERE p.id IS NULL;
SELECT id, name FROM products;
SELECT id, name FROM warehouses;
select id from products;
select * from inventory;

INSERT INTO products (sku, name, cost_price, selling_price, is_active)
VALUES
('PROD-002', 'Laptop', 50000, 65000, 1),
('PROD-003', 'Mouse', 300, 600, 1),
('PROD-004', 'Keyboard', 800, 1500, 1),
('PROD-005', 'Monitor', 8000, 12000, 1),
('PROD-006', 'Headphones', 2000, 3500, 1);


SELECT id, sku, name FROM products;

SELECT * FROM inventory WHERE warehouse_id = 2;
UPDATE inventory
SET warehouse_id = 1
WHERE warehouse_id = 2;
DELETE FROM warehouses WHERE id = 2;
INSERT INTO inventory (product_id, warehouse_id, quantity, min_quantity)
VALUES
(7, 1, 20, 5),    -- Laptop (duplicate SKU ok for now)
(8, 1, 100, 20),  -- Mouse
(9, 1, 15, 10),   -- Keyboard (low stock)
(10, 1, 5, 10);   -- Monitor (critical stock)

SELECT 
  i.id,
  p.name AS product,
  w.name AS warehouse,
  i.quantity,
  i.min_quantity
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN warehouses w ON w.id = i.warehouse_id;
select * from inventory;
select * from warehouses;
select * from sales;
describe sales;
select * from customers;

INSERT INTO sales (
  customer_id,
  warehouse_id,
  invoice_no,
  subtotal,
  tax_amount,
  total_amount,
  paid_amount,
  status
) VALUES
(1, 1, 'SAL-002', 12000, 0, 12000, 12000, 'PAID'),
(1, 1, 'SAL-003', 18000, 0, 18000, 18000, 'PAID'),
(1, 1, 'SAL-004', 15000, 0, 15000, 15000, 'PAID'),
(1, 1, 'SAL-005', 22000, 0, 22000, 20000, 'PARTIAL'),
(1, 1, 'SAL-006', 17000, 0, 17000, 17000, 'PAID'),
(1, 1, 'SAL-007', 14000, 0, 14000, 10000, 'PARTIAL'),
(1, 1, 'SAL-008', 30000, 0, 30000, 30000, 'PAID'),
(1, 1, 'SAL-009', 9000,  0, 9000,  9000,  'PAID'),
(1, 1, 'SAL-010', 20000, 0, 20000, 15000, 'PARTIAL'),
(1, 1, 'SAL-011', 16000, 0, 16000, 0,     'UNPAID');
SELECT id, invoice_no, total_amount, paid_amount, status
FROM sales;
select * from sales;
-- add sale_date column
ALTER TABLE sales
ADD COLUMN sale_date DATETIME DEFAULT CURRENT_TIMESTAMP;

-- example: set sale_date for existing rows (update as you wish)
UPDATE sales SET sale_date = '2024-12-20 10:00:00' WHERE invoice_no = 'SAL-001';
UPDATE sales SET sale_date = '2024-12-21 11:00:00' WHERE invoice_no = 'SAL-002';
UPDATE sales SET sale_date = '2024-12-22 12:00:00' WHERE invoice_no = 'SAL-003';
UPDATE sales SET sale_date = '2024-12-23 13:00:00' WHERE invoice_no = 'SAL-004';
UPDATE sales SET sale_date = '2024-12-24 14:00:00' WHERE invoice_no = 'SAL-005';
-- add more updates if you have more invoices

select * from purchases;
select * from purchase_items;

SELECT id, name FROM products ORDER BY id;

INSERT INTO purchase_items
(purchase_id, product_id, quantity, unit_price, total_price)
VALUES
(6,  1,  10, 5000, 50000),   -- Laptop
(7,  8,  20, 600,  12000),   -- Mouse
(8,  9,  15, 550,  8250),    -- Keyboard
(9,  10, 10, 1500, 15000),   -- Monitor
(10, 11, 8,  2750, 22000),   -- Headphones
(11, 7,  12, 5000, 60000),   -- Laptop (alt id)
(12, 8,  30, 600,  18000),   -- Mouse
(13, 9,  25, 550,  13750),   -- Keyboard
(14, 10, 6,  1500, 9000),    -- Monitor
(15, 11, 10, 2750, 27500);   -- Headphones

SELECT 
  pi.id,
  pi.purchase_id,
  p.name AS product,
  pi.quantity,
  pi.total_price
FROM purchase_items pi
JOIN products p ON p.id = pi.product_id;

delete from purchase_items where id=22;


INSERT INTO purchases
(supplier_id, warehouse_id, invoice_no, subtotal, tax_amount, total_amount, paid_amount, status, created_at)
VALUES
(1, 1, 'PUR-002', 12000, 600, 12600, 12600, 'PAID',    '2026-01-01 10:15:00'),
(1, 1, 'PUR-003', 8000,  400, 8400,  8400,  'PAID',    '2026-01-03 11:20:00'),
(1, 1, 'PUR-004', 15000, 750, 15750, 10000, 'PARTIAL', '2026-01-05 09:45:00'),
(1, 1, 'PUR-005', 22000, 1100,23100, 23100, 'PAID',    '2026-01-07 14:10:00'),
(1, 1, 'PUR-006', 9000,  450, 9450,  0,     'UNPAID',  '2026-01-09 16:00:00'),
(1, 1, 'PUR-007', 30000, 1500,31500, 31500, 'PAID',    '2026-01-12 12:30:00'),
(1, 1, 'PUR-008', 18000, 900, 18900, 10000, 'PARTIAL', '2026-01-15 10:05:00'),
(1, 1, 'PUR-009', 25000, 1250,26250, 26250, 'PAID',    '2026-01-18 15:40:00'),
(1, 1, 'PUR-010', 14000, 700, 14700, 0,     'UNPAID',  '2026-01-21 09:10:00'),
(1, 1, 'PUR-011', 32000, 1600,33600, 33600, 'PAID',    '2026-01-23 17:25:00');

SELECT COUNT(*) FROM purchases;

SELECT DATE(created_at), SUM(total_amount)
FROM sales
GROUP BY DATE(created_at);

SELECT DATE(created_at), SUM(total_amount)
FROM purchases
GROUP BY DATE(created_at);

select * from products;
select * from users;
select * from roles;
select * from user_roles;
UPDATE users
SET
  email = 'admin@erp.com',
  name = 'Admin',
  password_hash = '$2b$10$wH7C9nZJxVdN6r8JrY1xT.1Z6cFZ6JzQm5Z6g8E2nY4E8z8p6q4xG',
  is_active = 1
WHERE id = 1;
UPDATE users
SET password_hash = '$2b$10$Zkl6b/fM2P94GlE0WVTbCuwwHxh4oE.dPyoLahy100Dj5gGkgDRnW'
WHERE email = 'admin@erp.com';

select * from sales;
select * from purchases;
DELETE FROM user_roles WHERE user_id = 1;

INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1);

CREATE TABLE sales_backup AS SELECT * FROM sales;
SELECT id, invoice_no, created_at FROM sales ORDER BY id;
SET @i := 0;

UPDATE sales
SET created_at = DATE_SUB(CURDATE(), INTERVAL (@i := @i + 1) DAY)
ORDER BY id DESC;
SELECT invoice_no, created_at FROM sales ORDER BY created_at;

CREATE TABLE purchases_backup AS SELECT * FROM purchases;
SET @i := 0;

UPDATE purchases
SET created_at = DATE_SUB(CURDATE(), INTERVAL (@i := @i + 3) DAY)
ORDER BY id DESC;

UPDATE purchases
SET total_amount = total_amount * 1.3
WHERE MOD(id, 3) = 0;

UPDATE purchases
SET total_amount = total_amount * 0.7
WHERE MOD(id, 3) != 0;

SELECT DATE(created_at) AS date, SUM(total_amount)
FROM purchases
GROUP BY DATE(created_at)
ORDER BY date;

SELECT DATE(created_at) AS date, SUM(total_amount)
FROM sales
GROUP BY DATE(created_at)
ORDER BY date;

SELECT 
  DATE(created_at) AS date,
  SUM(total_amount) AS total
FROM sales
GROUP BY DATE(created_at)
ORDER BY date;

SELECT * FROM users LIMIT 5;

SELECT
  d.date,
  IFNULL(s.total_sales, 0) AS sales,
  IFNULL(p.total_purchases, 0) AS purchases
FROM (
  SELECT DATE(created_at) AS date FROM sales
  UNION
  SELECT DATE(created_at) AS date FROM purchases
) d
LEFT JOIN (
  SELECT DATE(created_at) AS date, SUM(total_amount) AS total_sales
  FROM sales
  GROUP BY DATE(created_at)
) s ON s.date = d.date
LEFT JOIN (
  SELECT DATE(created_at) AS date, SUM(total_amount) AS total_purchases
  FROM purchases
  GROUP BY DATE(created_at)
) p ON p.date = d.date
ORDER BY d.date;

select * from purchases;
ALTER TABLE stock_movements
ADD COLUMN `change` DECIMAL(15,4) NOT NULL AFTER warehouse_id;

describe stock_movements;

SELECT *
FROM stock_movements
WHERE reference_id = (
  SELECT id FROM purchases WHERE invoice_no = 'PUR-008'
);

SELECT *
FROM inventory
WHERE product_id IN (
  SELECT product_id
  FROM purchase_items
  WHERE purchase_id = (
    SELECT id FROM purchases WHERE invoice_no = 'PUR-008'
  )
);



ALTER TABLE stock_movements
ADD COLUMN movement_type VARCHAR(20) NOT NULL AFTER `change`,
ADD COLUMN reason VARCHAR(255) NULL AFTER reference_id;

UPDATE stock_movements
SET movement_type = 'IN'
WHERE movement_type IS NULL;

CREATE INDEX idx_stock_movements_product
ON stock_movements (product_id);

CREATE INDEX idx_stock_movements_warehouse
ON stock_movements (warehouse_id);

CREATE INDEX idx_stock_movements_reference
ON stock_movements (reference_type, reference_id);

CREATE INDEX idx_stock_movements_created
ON stock_movements (created_at);

select * from inventory;

UPDATE inventory
SET quantity = quantity + 25
WHERE product_id = 9
  AND warehouse_id = 1;
  
ALTER TABLE sales ADD COLUMN lifecycle_status VARCHAR(20) DEFAULT 'DRAFT';
describe sales;

SELECT id, invoice_no, lifecycle_status FROM sales LIMIT 5;

SELECT id, invoice_no, lifecycle_status, status
FROM sales
WHERE id = 1;

CREATE TABLE import_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  status ENUM('UPLOADED','PROCESSING','COMPLETED','FAILED') DEFAULT 'UPLOADED',
  total_rows INT DEFAULT 0,
  success_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  error_file_path VARCHAR(500),
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
SHOW TABLES LIKE 'import_jobs';
SELECT * FROM import_jobs;
select * from products;
SELECT * FROM import_jobs WHERE type='OPENING_INVENTORY';
SELECT * FROM inventory;
SELECT * FROM stock_movements WHERE reference_type='OPENING';

CREATE TABLE sale_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SHOW TABLES LIKE 'sale_returns';
SELECT id, invoice_no, lifecycle_status FROM sales ORDER BY id DESC;

SELECT product_id, quantity 
FROM sale_items 
WHERE sale_id = 1;

SELECT * 
FROM sale_returns 
ORDER BY id DESC;

SELECT product_id, warehouse_id, quantity 
FROM inventory 
WHERE product_id = 1;

SELECT product_id, warehouse_id, movement_type, reference_type, reference_id, created_at
FROM stock_movements
WHERE reference_type = 'SALE_RETURN'
ORDER BY id DESC;

SELECT movement_type, reference_type, created_at
FROM stock_movements
WHERE product_id = 1
ORDER BY created_at;

CREATE TABLE warehouse_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  from_warehouse_id INT NOT NULL,
  to_warehouse_id INT NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT DISTINCT warehouse_id FROM inventory;
SELECT id, name FROM warehouses;

INSERT INTO warehouses (name)
VALUES ('Secondary Warehouse');

SELECT * FROM warehouses;
SELECT * FROM inventory WHERE warehouse_id = 1;

SHOW CREATE TABLE products;
SHOW CREATE TABLE warehouses;

CREATE TABLE inventory_batches (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

  product_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,

  source_type ENUM('OPENING', 'PURCHASE', 'RETURN') NOT NULL,
  source_id BIGINT NULL,

  quantity_remaining DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_batches_product
    FOREIGN KEY (product_id) REFERENCES products(id),

  CONSTRAINT fk_batches_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

select * from inventory_batches;
SELECT id, invoice_no, status
FROM purchases
ORDER BY id DESC;

SELECT product_id, quantity
FROM inventory
WHERE product_id = 1;

SELECT id, quantity_remaining, created_at
FROM inventory_batches
WHERE product_id = 15
ORDER BY created_at;

SELECT movement_type, reason
FROM stock_movements
WHERE reference_type = 'SALE';

SELECT product_id, quantity FROM inventory;
SELECT movement_type, reason FROM stock_movements;

INSERT INTO customers (name)
VALUES ('Walk-in Customer');
select * from customers;
ALTER TABLE sale_items
ADD COLUMN cost_amount DECIMAL(15,4) NOT NULL DEFAULT 0
AFTER total_price;

SELECT
  id,
  product_id,
  warehouse_id,
  quantity_remaining,
  unit_cost,
  source_type
FROM inventory_batches
WHERE product_id = 1
  AND warehouse_id = 1
ORDER BY created_at;

INSERT INTO inventory_batches
(product_id, warehouse_id, source_type, source_id, quantity_remaining, unit_cost, created_at)
SELECT
  i.product_id,
  i.warehouse_id,
  'OPENING',
  NULL,
  i.quantity,
  p.cost_price,      -- or average cost
  NOW()
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE i.quantity > 0
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_batches b
    WHERE b.product_id = i.product_id
      AND b.warehouse_id = i.warehouse_id
  );

SELECT quantity
FROM inventory
WHERE product_id = 1
  AND warehouse_id = 1;

SELECT
  product_id,
  warehouse_id,
  quantity_remaining,
  unit_cost,
  source_type
FROM inventory_batches
WHERE product_id = 1
  AND warehouse_id = 1;

SELECT quantity
FROM inventory
WHERE product_id = 1
  AND warehouse_id = 1;

SELECT
  quantity,
  total_price,
  cost_amount
FROM sale_items
WHERE sale_id = 13;

SELECT
  movement_type,
  reference_type
FROM stock_movements
WHERE reference_type = 'SALE'
  AND reference_id = 13;
  
SELECT
  SUM(quantity_remaining) AS fifo_qty,
  (SELECT quantity FROM inventory WHERE product_id = 1 AND warehouse_id = 1) AS snapshot_qty
FROM inventory_batches
WHERE product_id = 1 AND warehouse_id = 1;

SELECT * FROM import_jobs ORDER BY created_at DESC;
SELECT * FROM stock_movements WHERE reference_type='OPENING';
SELECT * FROM inventory_batches WHERE source_type='OPENING';

SELECT
  SUM(quantity_remaining) AS fifo_qty,
  (SELECT quantity FROM inventory WHERE product_id = 1 AND warehouse_id = 1) AS snapshot_qty
FROM inventory_batches
WHERE product_id = 1 AND warehouse_id = 1;

SELECT * FROM import_jobs ORDER BY created_at DESC;
SELECT COUNT(*) FROM products;

SELECT * FROM purchases;
SELECT * FROM purchase_items;
SELECT * FROM inventory;
SELECT * FROM inventory_batches WHERE source_type='PURCHASE';
SELECT * FROM stock_movements WHERE reference_type='PURCHASE';

SELECT * FROM import_jobs WHERE type='PURCHASE';
SELECT * FROM purchases;
SELECT * FROM purchase_items;
SELECT * FROM inventory;
SELECT * FROM inventory_batches WHERE source_type='PURCHASE';
SELECT * FROM stock_movements WHERE reference_type='PURCHASE';

SELECT * FROM sale_returns;
select * from sales;


SELECT
  DATE(s.created_at) AS date,
  SUM(si.cost_amount) AS cogs
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
WHERE s.lifecycle_status = 'CONFIRMED'
GROUP BY DATE(s.created_at)
ORDER BY DATE(s.created_at);

SELECT
  DATE(s.created_at) AS date,
  SUM(s.total_amount) AS revenue
FROM sales s
WHERE s.lifecycle_status = 'CONFIRMED'
GROUP BY DATE(s.created_at)
ORDER BY DATE(s.created_at);


SELECT
  r.date,
  r.revenue,
  c.cogs,
  (r.revenue - c.cogs) AS gross_profit
FROM
(
  SELECT
    DATE(s.created_at) AS date,
    SUM(s.total_amount) AS revenue
  FROM sales s
  WHERE s.lifecycle_status = 'CONFIRMED'
  GROUP BY DATE(s.created_at)
) r
JOIN
(
  SELECT
    DATE(s.created_at) AS date,
    SUM(si.cost_amount) AS cogs
  FROM sales s
  JOIN sale_items si ON si.sale_id = s.id
  WHERE s.lifecycle_status = 'CONFIRMED'
  GROUP BY DATE(s.created_at)
) c
ON r.date = c.date
ORDER BY r.date;

SELECT
  r.date,
  r.revenue,
  c.cogs,
  ROUND(((r.revenue - c.cogs) / r.revenue) * 100, 2) AS gross_margin_percent
FROM
(
  SELECT
    DATE(s.created_at) AS date,
    SUM(s.total_amount) AS revenue
  FROM sales s
  WHERE s.lifecycle_status = 'CONFIRMED'
  GROUP BY DATE(s.created_at)
) r
JOIN
(
  SELECT
    DATE(s.created_at) AS date,
    SUM(si.cost_amount) AS cogs
  FROM sales s
  JOIN sale_items si ON si.sale_id = s.id
  WHERE s.lifecycle_status = 'CONFIRMED'
  GROUP BY DATE(s.created_at)
) c
ON r.date = c.date
ORDER BY r.date;

SELECT
  SUM(quantity_remaining * unit_cost) AS inventory_value
FROM inventory_batches;

SELECT
  p.name AS product,
  SUM(b.quantity_remaining) AS qty_on_hand,
  SUM(b.quantity_remaining * b.unit_cost) AS stock_value
FROM inventory_batches b
JOIN products p ON p.id = b.product_id
GROUP BY b.product_id
ORDER BY stock_value DESC;

SELECT
  SUM(quantity_remaining) AS fifo_qty,
  (SELECT quantity FROM inventory WHERE product_id = 1 AND warehouse_id = 1) AS snapshot_qty
FROM inventory_batches
WHERE product_id = 1 AND warehouse_id = 1;

UPDATE inventory_batches b
JOIN purchase_items pi 
  ON pi.product_id = b.product_id
 AND pi.purchase_id = b.source_id
SET b.unit_cost = pi.unit_price
WHERE b.unit_cost = 0
  AND b.source_type = 'PURCHASE';

UPDATE inventory_batches b
JOIN products p ON p.id = b.product_id
SET b.unit_cost = p.cost_price
WHERE b.unit_cost = 0
  AND b.source_type = 'OPENING';

SELECT *
FROM inventory_batches
WHERE unit_cost = 0;

ALTER TABLE sale_returns
  ADD COLUMN sale_item_id BIGINT NOT NULL AFTER sale_id,
  ADD COLUMN unit_price DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER quantity,
  ADD COLUMN total_price DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER unit_price,
  ADD COLUMN cost_amount DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER total_price;
  
select * from sale_returns;

-- 1. New return row
SELECT * FROM sale_returns ORDER BY id DESC LIMIT 1;

-- 2. Ledger entry
SELECT * FROM stock_movements
WHERE reference_type = 'SALE_RETURN'
ORDER BY id DESC
LIMIT 1;

-- 3. FIFO batch restored
SELECT *
FROM inventory_batches
WHERE source_type = 'SALE_RETURN'
ORDER BY id DESC
LIMIT 1;

SELECT 
  si.id AS sale_item_id,
  si.sale_id,
  si.product_id,
  si.quantity,
  si.cost_amount,
  s.lifecycle_status
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.lifecycle_status = 'CONFIRMED'
LIMIT 5;

SELECT
  id,
  sale_id,
  sale_item_id,
  product_id,
  warehouse_id,
  quantity,
  unit_price,
  total_price,
  cost_amount,
  reason,
  created_by,
  created_at
FROM sale_returns
ORDER BY id DESC
LIMIT 5;

SELECT
  id,
  product_id,
  warehouse_id,
  movement_type,
  reference_type,
  reference_id,
  reason,
  user_id,
  created_at
FROM stock_movements
WHERE reference_type = 'SALE_RETURN'
ORDER BY id DESC
LIMIT 5;

SELECT
  product_id,
  warehouse_id,
  quantity
FROM inventory
WHERE product_id = 1
  AND warehouse_id = 1;
  
  SELECT
  id,
  product_id,
  warehouse_id,
  source_type,
  source_id,
  quantity_remaining,
  unit_cost,
  created_at
FROM inventory_batches
WHERE source_type = 'RETURN'
ORDER BY id DESC
LIMIT 5;

  
  SELECT
  id,
  source_type,
  source_id,
  quantity_remaining,
  unit_cost,
  created_at
FROM inventory_batches
WHERE product_id = 1
  AND warehouse_id = 1
ORDER BY created_at ASC;

SELECT
  id,
  movement_type,
  reference_type,
  reference_id,
  created_at
FROM stock_movements
WHERE product_id = 1
  AND warehouse_id = 1
ORDER BY created_at ASC;

UPDATE inventory i
JOIN (
  SELECT
    product_id,
    warehouse_id,
    SUM(quantity_remaining) AS fifo_qty
  FROM inventory_batches
  WHERE product_id = 1
    AND warehouse_id = 1
  GROUP BY product_id, warehouse_id
) b
ON b.product_id = i.product_id
AND b.warehouse_id = i.warehouse_id
SET i.quantity = b.fifo_qty;

SELECT
  SUM(quantity_remaining) AS fifo_qty,
  (
    SELECT quantity
    FROM inventory
    WHERE product_id = 1
      AND warehouse_id = 1
  ) AS snapshot_qty
FROM inventory_batches
WHERE product_id = 1
  AND warehouse_id = 1;

  
SELECT
  id,
  sale_id,
  product_id,
  quantity,
  cost_amount
FROM sale_items
WHERE id = 2;

select * from products;
select * from inventory_batches;

select * from roles;

SELECT id, invoice_no, total_amount, paid_amount, status
FROM sales
WHERE paid_amount > total_amount;

SELECT id, invoice_no, total_amount, paid_amount, status
FROM purchases
WHERE paid_amount > total_amount;
 
UPDATE purchases
SET paid_amount = total_amount
WHERE paid_amount > total_amount;

UPDATE sales
SET paid_amount = total_amount
WHERE paid_amount > total_amount;

UPDATE purchases
SET status = CASE
  WHEN total_amount = 0 THEN 'UNPAID'
  WHEN paid_amount >= total_amount THEN 'PAID'
  WHEN paid_amount > 0 THEN 'PARTIAL'
  ELSE 'UNPAID'
END;

UPDATE sales
SET status = CASE
  WHEN total_amount = 0 THEN 'UNPAID'
  WHEN paid_amount >= total_amount THEN 'PAID'
  WHEN paid_amount > 0 THEN 'PARTIAL'
  ELSE 'UNPAID'
END;

ALTER TABLE purchases
ADD COLUMN lifecycle_status VARCHAR(20)
DEFAULT 'DRAFT'
AFTER status;

CREATE INDEX idx_purchases_lifecycle_status
ON purchases (lifecycle_status);

SELECT * FROM purchases;

SELECT id, status, lifecycle_status, paid_amount, total_amount
FROM purchases
ORDER BY id DESC;

select * from sales;

ALTER TABLE payments
ADD COLUMN payment_details JSON NULL,
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

/* ============================================================
   PHASE 1 — SALES GST + INVOICE FIX
   SAFE, AUDITABLE, REVERSIBLE
   ============================================================ */

START TRANSACTION;

/* ------------------------------------------------------------
   1️⃣ Identify confirmed sales with missing totals / invoice
------------------------------------------------------------- */
SELECT 
  id,
  lifecycle_status,
  invoice_no,
  subtotal,
  tax_amount,
  total_amount
FROM sales
WHERE lifecycle_status = 'CONFIRMED'
  AND (
    subtotal = 0 
    OR tax_amount = 0 
    OR total_amount = 0
    OR invoice_no IS NULL
  )
FOR UPDATE;


/* ------------------------------------------------------------
   2️⃣ Aggregate sale_items → sale-level taxable & tax
------------------------------------------------------------- */
DROP TEMPORARY TABLE IF EXISTS sale_sums;

CREATE TEMPORARY TABLE sale_sums AS
SELECT
  si.sale_id,
  ROUND(SUM(si.quantity * si.unit_price), 2) AS taxable_value,
  ROUND(
    SUM(
      (si.quantity * si.unit_price) * (COALESCE(p.gst_rate, 0) / 100)
    ),
    2
  ) AS total_tax
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY si.sale_id;


/* ------------------------------------------------------------
   3️⃣ Update sales totals (GST-correct)
------------------------------------------------------------- */
UPDATE sales s
JOIN sale_sums ss ON ss.sale_id = s.id
SET
  s.subtotal        = ss.taxable_value,
  s.taxable_value   = ss.taxable_value,
  s.tax_amount      = ss.total_tax,

  s.cgst_amount = CASE 
    WHEN s.is_interstate = 0 THEN ROUND(ss.total_tax / 2, 2)
    ELSE 0 
  END,

  s.sgst_amount = CASE 
    WHEN s.is_interstate = 0 THEN ROUND(ss.total_tax / 2, 2)
    ELSE 0 
  END,

  s.igst_amount = CASE 
    WHEN s.is_interstate = 1 THEN ROUND(ss.total_tax, 2)
    ELSE 0 
  END,

  s.total_amount = ROUND(ss.taxable_value + ss.total_tax, 2)
WHERE s.lifecycle_status = 'CONFIRMED';


/* ------------------------------------------------------------
   4️⃣ Assign invoice numbers (only if missing)
   Format: INV-YYYY-00001
------------------------------------------------------------- */
SET @year_prefix = CONCAT('INV-', YEAR(NOW()), '-');
SET @seq = 0;

DROP TEMPORARY TABLE IF EXISTS invoice_seq;

CREATE TEMPORARY TABLE invoice_seq AS
SELECT 
  id,
  (@seq := @seq + 1) AS seq
FROM sales
WHERE lifecycle_status = 'CONFIRMED'
  AND (invoice_no IS NULL OR invoice_no = '')
ORDER BY created_at ASC;

UPDATE sales s
JOIN invoice_seq i ON i.id = s.id
SET s.invoice_no = CONCAT(@year_prefix, LPAD(i.seq, 5, '0'));


/* ------------------------------------------------------------
   5️⃣ FINAL VERIFICATION SNAPSHOT
------------------------------------------------------------- */
SELECT
  s.id,
  s.invoice_no,
  s.taxable_value,
  s.cgst_amount,
  s.sgst_amount,
  s.igst_amount,
  s.tax_amount,
  s.total_amount
FROM sales s
WHERE s.lifecycle_status = 'CONFIRMED'
ORDER BY s.created_at DESC
LIMIT 10;

COMMIT;

/* ============================================================
   END OF PHASE 1 FIX
   ============================================================ */
   
   -- Confirm sales are populated
SELECT id, invoice_no, taxable_value, tax_amount, total_amount
FROM sales
WHERE lifecycle_status = 'CONFIRMED';

-- GSTR-1 preview
SELECT
  invoice_no,
  customer_gstin,
  taxable_value,
  cgst_amount,
  sgst_amount,
  igst_amount,
  total_amount
FROM sales
WHERE lifecycle_status = 'CONFIRMED';

-- HSN preview
SELECT
  COALESCE(p.hsn_code,'UNKNOWN') AS hsn,
  SUM(si.quantity) qty,
  SUM(si.total_price) taxable
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY COALESCE(p.hsn_code,'UNKNOWN');


DELETE FROM sales WHERE invoice_no = 'INV-SEED-001';
DELETE FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales);

DELETE FROM payments;
DELETE FROM purchase_items;
DELETE FROM purchases;

DESCRIBE suppliers;

SELECT COUNT(*) FROM inventory_batches;
SELECT COUNT(*) FROM stock_movements;

SELECT 
  'products' AS table_name, COUNT(*) AS row_count FROM products
UNION ALL
SELECT 'warehouses', COUNT(*) FROM warehouses
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'inventory_batches', COUNT(*) FROM inventory_batches
UNION ALL
SELECT 'stock_movements', COUNT(*) FROM stock_movements
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'purchase_items', COUNT(*) FROM purchase_items
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

SELECT * FROM purchases ORDER BY id DESC;

SELECT * FROM purchase_items ORDER BY id DESC;

SELECT id, product_id, warehouse_id, source_type, source_id, quantity_remaining
FROM inventory_batches
ORDER BY id DESC
LIMIT 20;

SELECT id, invoice_no, subtotal, tax_amount, total_amount, lifecycle_status
FROM sales
ORDER BY id DESC;

SELECT * FROM sale_items ORDER BY id DESC;

SELECT 'products' AS t, COUNT(*) FROM products
UNION ALL SELECT 'warehouses', COUNT(*) FROM warehouses
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'inventory_batches', COUNT(*) FROM inventory_batches
UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL SELECT 'purchase_items', COUNT(*) FROM purchase_items
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments;


SELECT invoice_no
FROM sales
WHERE invoice_no LIKE 'INV-2026-%'
ORDER BY invoice_no DESC
LIMIT 1;

DELETE FROM sale_items;
DELETE FROM sales;

DELETE FROM purchase_items;
DELETE FROM purchases;

DELETE FROM payments;


SET @i := 0;

UPDATE sales
SET 
  sale_date = DATE_SUB(CURDATE(), INTERVAL (@i := @i + 1) DAY),
  created_at = DATE_SUB(CURDATE(), INTERVAL @i DAY)
ORDER BY id DESC;

SET @p := 0;

UPDATE purchases
SET 
  created_at = DATE_SUB(CURDATE(), INTERVAL (20 + (@p := @p + 1)) DAY)
ORDER BY id DESC;

UPDATE inventory_batches b
JOIN purchases p ON p.id = b.source_id
SET b.created_at = p.created_at
WHERE b.source_type = 'PURCHASE';

UPDATE stock_movements sm
LEFT JOIN purchases p 
  ON sm.reference_type = 'PURCHASE' AND sm.reference_id = p.id
LEFT JOIN sales s 
  ON sm.reference_type = 'SALE' AND sm.reference_id = s.id
SET sm.created_at = COALESCE(p.created_at, s.created_at);

SELECT 
  DATE(sale_date) AS day,
  SUM(total_amount) AS revenue
FROM sales
GROUP BY DATE(sale_date)
ORDER BY day;



























































