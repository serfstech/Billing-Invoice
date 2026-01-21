-- Initialize database
CREATE DATABASE IF NOT EXISTS distributor_db;
USE distributor_db;

-- Admin table
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(50),
    contact_person VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_name (name)
);

-- Customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(50),
    customer_type ENUM('retail', 'wholesale', 'corporate') DEFAULT 'retail',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_name (name)
);

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(20),
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 10,
    supplier_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_product_name (name),
    INDEX idx_category (category)
);

-- Purchases table
CREATE TABLE purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_number VARCHAR(50) UNIQUE,
    supplier_id INT NOT NULL,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_purchase_date (purchase_date)
);

-- Purchase items table
CREATE TABLE purchase_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Invoices table (Sales)
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    total_gst DECIMAL(10,2) NOT NULL,
    grand_total DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'upi', 'bank_transfer') DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_invoice_number (invoice_number)
);

-- Invoice items table
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Stock logs table
CREATE TABLE stock_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    transaction_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL,
    quantity_change DECIMAL(10,2) NOT NULL,
    previous_stock DECIMAL(10,2) NOT NULL,
    new_stock DECIMAL(10,2) NOT NULL,
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('low_stock', 'out_of_stock', 'system', 'alert') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at DESC)
);

-- Insert default admin (password: admin123)
INSERT INTO admin (username, password_hash, email, full_name) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@distributor.com', 'System Administrator');

-- Create stored procedure for generating invoice number
DELIMITER $$
CREATE PROCEDURE generate_invoice_number(OUT new_invoice_number VARCHAR(50))
BEGIN
    DECLARE year_month VARCHAR(6);
    DECLARE last_sequence INT;
    
    SET year_month = DATE_FORMAT(NOW(), '%y%m');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, 8) AS UNSIGNED)), 0)
    INTO last_sequence
    FROM invoices
    WHERE invoice_number LIKE CONCAT('INV-', year_month, '-%');
    
    SET new_invoice_number = CONCAT('INV-', year_month, '-', LPAD(last_sequence + 1, 4, '0'));
END$$
DELIMITER ;

-- Create view for low stock products
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.current_stock,
    p.minimum_stock,
    ROUND((p.current_stock / p.minimum_stock) * 100, 2) as stock_percentage,
    CASE 
        WHEN p.current_stock <= 0 THEN 'OUT OF STOCK'
        WHEN p.current_stock <= p.minimum_stock THEN 'LOW STOCK'
        ELSE 'IN STOCK'
    END as stock_status
FROM products p
WHERE p.current_stock <= p.minimum_stock;

-- Create trigger for stock updates
DELIMITER $$
CREATE TRIGGER after_invoice_item_insert
AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
    -- Update product stock
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Log stock change
    INSERT INTO stock_logs (product_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id)
    SELECT 
        NEW.product_id,
        'sale',
        -NEW.quantity,
        p.current_stock + NEW.quantity,
        p.current_stock,
        NEW.invoice_id
    FROM products p
    WHERE p.id = NEW.product_id;
END$$
DELIMITER ;

-- Create trigger for purchase stock updates
DELIMITER $$
CREATE TRIGGER after_purchase_item_insert
AFTER INSERT ON purchase_items
FOR EACH ROW
BEGIN
    -- Update product stock
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Log stock change
    INSERT INTO stock_logs (product_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id)
    SELECT 
        NEW.product_id,
        'purchase',
        NEW.quantity,
        p.current_stock - NEW.quantity,
        p.current_stock,
        NEW.purchase_id
    FROM products p
    WHERE p.id = NEW.product_id;
END$$
DELIMITER ;