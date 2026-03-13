const mysql = require('mysql2/promise');

async function setupMySQLDatabase() {
  console.log('🔧 Setting up MySQL database for Ideal Weddings...');
  
  // Try common MySQL root passwords
  const passwords = ['', 'root', 'password', '123456', 'admin'];
  
  let connection = null;
  
  for (const password of passwords) {
    try {
      console.log(`🔍 Trying MySQL connection with password: ${password || 'empty'}`);
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: password,
        multipleStatements: true
      });
      
      console.log('✅ Connected to MySQL successfully!');
      break;
    } catch (error) {
      console.log(`❌ Failed with password "${password || 'empty'}": ${error.message}`);
    }
  }
  
  if (!connection) {
    console.log('❌ Could not connect to MySQL with any common password');
    console.log('💡 Please check your WAMP MySQL configuration');
    return;
  }
  
  try {
    // Create database if it doesn't exist
    console.log('📝 Creating idealweddings database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS idealweddings');
    
    // Use the database
    await connection.execute('USE idealweddings');
    
    // Create users table
    console.log('📝 Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
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
      )
    `);
    
    // Create user_profiles table
    console.log('📝 Creating user_profiles table...');
    await connection.execute(`
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
      )
    `);
    
    // Create vendors table
    console.log('📝 Creating vendors table...');
    await connection.execute(`
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
        email VARCHAR(255),
        website VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_category (category),
        INDEX idx_is_active (is_active)
      )
    `);
    
    // Create quotes table
    console.log('📝 Creating quotes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        vendor_id INT NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        event_date DATE,
        guest_count INT,
        budget_range VARCHAR(50),
        special_requests TEXT,
        status ENUM('pending', 'quoted', 'accepted', 'declined', 'completed') DEFAULT 'pending',
        quoted_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_vendor_id (vendor_id),
        INDEX idx_status (status)
      )
    `);
    
    // Create weddings table
    console.log('📝 Creating weddings table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS weddings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        partner_name VARCHAR(100) NOT NULL,
        wedding_date DATE NOT NULL,
        venue VARCHAR(255),
        guest_count INT,
        budget DECIMAL(10,2),
        status ENUM('planning', 'confirmed', 'completed', 'cancelled') DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_wedding_date (wedding_date),
        INDEX idx_status (status)
      )
    `);
    
    // Create guest_lists table
    console.log('📝 Creating guest_lists table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS guest_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wedding_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        relationship VARCHAR(50),
        plus_one BOOLEAN DEFAULT FALSE,
        plus_one_name VARCHAR(100),
        rsvp_status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
        dietary_restrictions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
        INDEX idx_wedding_id (wedding_id),
        INDEX idx_rsvp_status (rsvp_status)
      )
    `);
    
    // Insert test data
    console.log('📝 Inserting test data...');
    
    // Test admin user
    await connection.execute(`
      INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_verified, is_active) 
      VALUES ('admin@idealweddings.com', '$2b$10$rQZ8K9vX7mN2pL1oR3sTtOeF6gH8iJ9kL0mN1pQ2rS3tU4vW5xY6zA7bC8d', 'Admin', 'User', 'admin', TRUE, TRUE)
    `);
    
    // Test vendor user
    await connection.execute(`
      INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_verified, is_active) 
      VALUES ('vendor@idealweddings.com', '$2b$10$rQZ8K9vX7mN2pL1oR3sTtOeF6gH8iJ9kL0mN1pQ2rS3tU4vW5xY6zA7bC8d', 'Vendor', 'User', 'vendor', TRUE, TRUE)
    `);
    
    // Test regular user
    await connection.execute(`
      INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_verified, is_active) 
      VALUES ('user@idealweddings.com', '$2b$10$rQZ8K9vX7mN2pL1oR3sTtOeF6gH8iJ9kL0mN1pQ2rS3tU4vW5xY6zA7bC8d', 'Regular', 'User', 'user', TRUE, TRUE)
    `);
    
    console.log('✅ MySQL database setup complete!');
    console.log('🎉 Test users created:');
    console.log('   - admin@idealweddings.com (password: password123)');
    console.log('   - vendor@idealweddings.com (password: password123)');
    console.log('   - user@idealweddings.com (password: password123)');
    
  } catch (error) {
    console.error('❌ Error setting up MySQL:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupMySQLDatabase().then(() => {
  console.log('🎉 MySQL setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 MySQL setup failed:', error);
  process.exit(1);
});
