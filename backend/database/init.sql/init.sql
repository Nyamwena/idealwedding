-- Ideal Weddings SaaS - PostgreSQL Database Schema
-- This file contains the complete database schema for the system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (from auth service)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'vendor')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('venue', 'catering', 'photography', 'music', 'decor', 'transportation', 'planning', 'florist', 'other')),
    location JSONB NOT NULL,
    contact_info JSONB NOT NULL,
    services JSONB DEFAULT '[]',
    price_range JSONB,
    is_approved BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    portfolio JSONB DEFAULT '[]',
    business_info JSONB,
    availability JSONB,
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor services table
CREATE TABLE IF NOT EXISTS vendor_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_type VARCHAR(50) DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'hourly', 'per_person', 'custom')),
    duration_hours INTEGER,
    min_guests INTEGER,
    max_guests INTEGER,
    includes JSONB DEFAULT '[]',
    add_ons JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Weddings table
CREATE TABLE IF NOT EXISTS weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wedding_name VARCHAR(255) NOT NULL,
    wedding_date DATE NOT NULL,
    wedding_time TIME,
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_state VARCHAR(100),
    venue_country VARCHAR(100),
    guest_count INTEGER,
    budget DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
    service_category VARCHAR(100) NOT NULL,
    requirements JSONB NOT NULL,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    event_date TIMESTAMP WITH TIME ZONE,
    event_location JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'accepted', 'rejected', 'completed', 'cancelled')),
    vendor_response JSONB,
    response_date TIMESTAMP WITH TIME ZONE,
    total_responses INTEGER DEFAULT 0,
    is_urgent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quote responses table
CREATE TABLE IF NOT EXISTS quote_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_until TIMESTAMP WITH TIME ZONE,
    terms TEXT,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    is_featured BOOLEAN DEFAULT FALSE,
    response_time_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus', 'deduction')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_refund_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor credit balances table
CREATE TABLE IF NOT EXISTS vendor_credit_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    total_purchased DECIMAL(10,2) DEFAULT 0.00,
    total_used DECIMAL(10,2) DEFAULT 0.00,
    total_refunded DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guest lists table
CREATE TABLE IF NOT EXISTS guest_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
    plus_one BOOLEAN DEFAULT FALSE,
    plus_one_name VARCHAR(255),
    dietary_restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON vendors(is_approved);
CREATE INDEX IF NOT EXISTS idx_vendors_is_visible ON vendors(is_visible);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_category ON vendor_services(category);
CREATE INDEX IF NOT EXISTS idx_vendor_services_is_active ON vendor_services(is_active);

CREATE INDEX IF NOT EXISTS idx_weddings_user_id ON weddings(user_id);
CREATE INDEX IF NOT EXISTS idx_weddings_wedding_date ON weddings(wedding_date);
CREATE INDEX IF NOT EXISTS idx_weddings_status ON weddings(status);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_id ON quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_wedding_id ON quotes(wedding_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_category ON quotes(service_category);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

CREATE INDEX IF NOT EXISTS idx_quote_responses_quote_id ON quote_responses(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_vendor_id ON quote_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_status ON quote_responses(status);
CREATE INDEX IF NOT EXISTS idx_quote_responses_created_at ON quote_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_vendor_id ON credit_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_credit_balances_vendor_id ON vendor_credit_balances(vendor_id);

CREATE INDEX IF NOT EXISTS idx_guest_lists_wedding_id ON guest_lists(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_lists_rsvp_status ON guest_lists(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guest_lists_created_at ON guest_lists(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Create views for common queries
CREATE OR REPLACE VIEW vendor_summary AS
SELECT 
    v.id,
    v.business_name,
    v.category,
    v.location->>'city' as city,
    v.location->>'state' as state,
    v.rating,
    v.total_reviews,
    v.is_approved,
    v.is_visible,
    v.is_featured,
    COUNT(vs.id) as service_count
FROM vendors v
LEFT JOIN vendor_services vs ON v.id = vs.vendor_id AND vs.is_active = TRUE
GROUP BY v.id;

CREATE OR REPLACE VIEW wedding_summary AS
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
GROUP BY w.id, u.id;

CREATE OR REPLACE VIEW quote_summary AS
SELECT 
    q.id,
    q.service_category,
    q.status,
    q.budget_min,
    q.budget_max,
    q.event_date,
    q.total_responses,
    u.first_name || ' ' || u.last_name as customer_name,
    u.email as customer_email,
    v.business_name as vendor_name,
    q.created_at
FROM quotes q
JOIN users u ON q.user_id = u.id
LEFT JOIN vendors v ON q.vendor_id = v.id;

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@idealweddings.com', '$2b$10$example.hash.here', 'Admin', 'User', 'admin', TRUE),
('john@example.com', '$2b$10$example.hash.here', 'John', 'Doe', 'user', TRUE),
('jane@example.com', '$2b$10$example.hash.here', 'Jane', 'Smith', 'user', TRUE),
('vendor1@example.com', '$2b$10$example.hash.here', 'Vendor', 'One', 'vendor', TRUE),
('vendor2@example.com', '$2b$10$example.hash.here', 'Vendor', 'Two', 'vendor', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample vendors
INSERT INTO vendors (user_id, business_name, business_description, category, location, contact_info, is_approved, is_visible) 
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'vendor1@example.com' THEN 'Elegant Venues'
        WHEN u.email = 'vendor2@example.com' THEN 'Delicious Catering'
    END,
    CASE 
        WHEN u.email = 'vendor1@example.com' THEN 'Beautiful wedding venues for your special day'
        WHEN u.email = 'vendor2@example.com' THEN 'Exquisite catering services for weddings'
    END,
    CASE 
        WHEN u.email = 'vendor1@example.com' THEN 'venue'
        WHEN u.email = 'vendor2@example.com' THEN 'catering'
    END,
    CASE 
        WHEN u.email = 'vendor1@example.com' THEN '{"latitude": 40.7128, "longitude": -74.0060, "city": "New York", "state": "NY"}'
        WHEN u.email = 'vendor2@example.com' THEN '{"latitude": 34.0522, "longitude": -118.2437, "city": "Los Angeles", "state": "CA"}'
    END::jsonb,
    CASE 
        WHEN u.email = 'vendor1@example.com' THEN '{"phone": "+1-555-123-4567", "email": "vendor1@example.com"}'
        WHEN u.email = 'vendor2@example.com' THEN '{"phone": "+1-555-987-6543", "email": "vendor2@example.com"}'
    END::jsonb,
    TRUE,
    TRUE
FROM users u
WHERE u.email IN ('vendor1@example.com', 'vendor2@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample weddings
INSERT INTO weddings (user_id, wedding_name, wedding_date, venue_city, venue_state, guest_count, budget) 
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'john@example.com' THEN 'John & Sarah Wedding'
        WHEN u.email = 'jane@example.com' THEN 'Jane & Mike Wedding'
    END,
    CASE 
        WHEN u.email = 'john@example.com' THEN '2024-06-15'
        WHEN u.email = 'jane@example.com' THEN '2024-08-20'
    END::date,
    CASE 
        WHEN u.email = 'john@example.com' THEN 'New York'
        WHEN u.email = 'jane@example.com' THEN 'Los Angeles'
    END,
    CASE 
        WHEN u.email = 'john@example.com' THEN 'NY'
        WHEN u.email = 'jane@example.com' THEN 'CA'
    END,
    CASE 
        WHEN u.email = 'john@example.com' THEN 150
        WHEN u.email = 'jane@example.com' THEN 100
    END,
    CASE 
        WHEN u.email = 'john@example.com' THEN 25000.00
        WHEN u.email = 'jane@example.com' THEN 20000.00
    END
FROM users u
WHERE u.email IN ('john@example.com', 'jane@example.com')
ON CONFLICT DO NOTHING;

-- Show tables and sample data
SELECT 'Database initialized successfully!' as status;
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Weddings', COUNT(*) FROM weddings
UNION ALL
SELECT 'Quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'Credit Transactions', COUNT(*) FROM credit_transactions;
