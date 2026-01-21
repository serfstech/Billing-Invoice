-- 1. Create database
CREATE DATABASE distributor_db;

-- 2. Use the database
USE distributor_db;

-- 3. Create admin table
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100)
);

-- 4. Add default admin (password: admin123)
INSERT INTO admin (username, password_hash, email, full_name) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@distributor.com', 'System Admin');

-- 5. Click EXECUTE button (lightning bolt icon)