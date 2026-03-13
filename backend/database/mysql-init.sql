-- Ideal Weddings SaaS - MySQL Database Schema
-- This file contains the database schema for the WAMP development setup

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS salgrtkh_idealweddings;
USE salgrtkh_idealweddings;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'user', 'vendor') DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    category ENUM('venue', 'catering', 'photography', 'music', 'decor', 'transportation', 'other') NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    website VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_location (city, state)
);

-- Vendor services table
CREATE TABLE IF NOT EXISTS vendor_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id)
);

-- Vendor images table
CREATE TABLE IF NOT EXISTS vendor_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type ENUM('gallery', 'logo', 'banner') DEFAULT 'gallery',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id)
);

-- Weddings table
CREATE TABLE IF NOT EXISTS weddings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wedding_name VARCHAR(255) NOT NULL,
    wedding_date DATE NOT NULL,
    wedding_time TIME,
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_state VARCHAR(100),
    venue_country VARCHAR(100),
    guest_count INT,
    budget DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('planning', 'confirmed', 'completed', 'cancelled') DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wedding_date (wedding_date),
    INDEX idx_status (status)
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wedding_id INT NOT NULL,
    vendor_id INT NOT NULL,
    service_id INT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
    INDEX idx_wedding_id (wedding_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status)
);

-- Guest lists table
CREATE TABLE IF NOT EXISTS guest_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wedding_id INT NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    rsvp_status ENUM('pending', 'confirmed', 'declined', 'maybe') DEFAULT 'pending',
    plus_one BOOLEAN DEFAULT FALSE,
    plus_one_name VARCHAR(255),
    dietary_restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    INDEX idx_wedding_id (wedding_id),
    INDEX idx_rsvp_status (rsvp_status)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    type ENUM('purchase', 'refund', 'bonus', 'deduction') NOT NULL,
    description TEXT,
    transaction_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- User credit balance table
CREATE TABLE IF NOT EXISTS user_credit_balance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    wedding_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_rating (rating)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at)
);

-- Insert sample data for testing

-- Sample users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@idealweddings.com', '$2b$10$example.hash.here', 'Admin', 'User', 'admin', TRUE),
('john@example.com', '$2b$10$example.hash.here', 'John', 'Doe', 'user', TRUE),
('jane@example.com', '$2b$10$example.hash.here', 'Jane', 'Smith', 'user', TRUE),
('vendor1@example.com', '$2b$10$example.hash.here', 'Vendor', 'One', 'vendor', TRUE),
('vendor2@example.com', '$2b$10$example.hash.here', 'Vendor', 'Two', 'vendor', TRUE);

-- Sample vendors
INSERT INTO vendors (user_id, business_name, business_description, category, city, state, is_verified) VALUES
(4, 'Elegant Venues', 'Beautiful wedding venues for your special day', 'venue', 'New York', 'NY', TRUE),
(5, 'Delicious Catering', 'Exquisite catering services for weddings', 'catering', 'Los Angeles', 'CA', TRUE);

-- Sample vendor services
INSERT INTO vendor_services (vendor_id, service_name, description, base_price) VALUES
(1, 'Garden Wedding Package', 'Beautiful outdoor wedding ceremony and reception', 5000.00),
(1, 'Indoor Wedding Package', 'Elegant indoor wedding ceremony and reception', 6000.00),
(2, 'Full Catering Service', 'Complete catering service for up to 100 guests', 3000.00),
(2, 'Premium Catering Service', 'Premium catering service with gourmet menu', 5000.00);

-- Sample weddings
INSERT INTO weddings (user_id, wedding_name, wedding_date, venue_city, venue_state, guest_count, budget) VALUES
(2, 'John & Sarah Wedding', '2024-06-15', 'New York', 'NY', 150, 25000.00),
(3, 'Jane & Mike Wedding', '2024-08-20', 'Los Angeles', 'CA', 100, 20000.00);

-- Sample guest lists
INSERT INTO guest_lists (wedding_id, guest_name, email, rsvp_status) VALUES
(1, 'Alice Johnson', 'alice@example.com', 'confirmed'),
(1, 'Bob Wilson', 'bob@example.com', 'pending'),
(2, 'Carol Brown', 'carol@example.com', 'confirmed'),
(2, 'David Lee', 'david@example.com', 'maybe');

-- Sample credits
INSERT INTO credits (user_id, amount, type, description, status) VALUES
(2, 100.00, 'bonus', 'Welcome bonus', 'completed'),
(3, 50.00, 'purchase', 'Credit purchase', 'completed');

-- Sample user credit balances
INSERT INTO user_credit_balance (user_id, balance) VALUES
(2, 100.00),
(3, 50.00);

-- Create indexes for better performance
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_vendors_rating ON vendors(rating);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_guest_lists_created_at ON guest_lists(created_at);
CREATE INDEX idx_credits_created_at ON credits(created_at);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create views for common queries
CREATE VIEW vendor_summary AS
SELECT 
    v.id,
    v.business_name,
    v.category,
    v.city,
    v.state,
    v.rating,
    v.total_reviews,
    COUNT(vs.id) as service_count
FROM vendors v
LEFT JOIN vendor_services vs ON v.id = vs.vendor_id AND vs.is_active = TRUE
WHERE v.is_active = TRUE
GROUP BY v.id;

CREATE VIEW wedding_summary AS
SELECT 
    w.id,
    w.wedding_name,
    w.wedding_date,
    w.venue_city,
    w.venue_state,
    w.guest_count,
    w.budget,
    w.status,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(gl.id) as guest_count_actual,
    COUNT(CASE WHEN gl.rsvp_status = 'confirmed' THEN 1 END) as confirmed_guests
FROM weddings w
JOIN users u ON w.user_id = u.id
LEFT JOIN guest_lists gl ON w.id = gl.wedding_id
GROUP BY w.id;

-- Create stored procedures for common operations

DELIMITER //

-- Procedure to get vendor details with services
CREATE PROCEDURE GetVendorDetails(IN vendor_id INT)
BEGIN
    SELECT 
        v.*,
        u.email,
        u.first_name,
        u.last_name,
        u.phone
    FROM vendors v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = vendor_id AND v.is_active = TRUE;
    
    SELECT 
        vs.*
    FROM vendor_services vs
    WHERE vs.vendor_id = vendor_id AND vs.is_active = TRUE;
    
    SELECT 
        vi.*
    FROM vendor_images vi
    WHERE vi.vendor_id = vendor_id;
END //

-- Procedure to get wedding details with guests
CREATE PROCEDURE GetWeddingDetails(IN wedding_id INT)
BEGIN
    SELECT 
        w.*,
        u.first_name,
        u.last_name,
        u.email
    FROM weddings w
    JOIN users u ON w.user_id = u.id
    WHERE w.id = wedding_id;
    
    SELECT 
        gl.*
    FROM guest_lists gl
    WHERE gl.wedding_id = wedding_id
    ORDER BY gl.guest_name;
    
    SELECT 
        q.*,
        v.business_name as vendor_name,
        vs.service_name
    FROM quotes q
    JOIN vendors v ON q.vendor_id = v.id
    JOIN vendor_services vs ON q.service_id = vs.id
    WHERE q.wedding_id = wedding_id
    ORDER BY q.created_at DESC;
END //

-- Procedure to update vendor rating
CREATE PROCEDURE UpdateVendorRating(IN vendor_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews_count INT;
    
    SELECT 
        AVG(rating),
        COUNT(*)
    INTO 
        avg_rating,
        total_reviews_count
    FROM reviews
    WHERE vendor_id = vendor_id AND is_verified = TRUE;
    
    UPDATE vendors 
    SET 
        rating = COALESCE(avg_rating, 0.00),
        total_reviews = total_reviews_count
    WHERE id = vendor_id;
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON idealweddings.* TO 'idealweddings'@'localhost';
-- FLUSH PRIVILEGES;

-- Show tables
SHOW TABLES;

-- Show sample data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Weddings', COUNT(*) FROM weddings
UNION ALL
SELECT 'Guest Lists', COUNT(*) FROM guest_lists
UNION ALL
SELECT 'Credits', COUNT(*) FROM credits;
