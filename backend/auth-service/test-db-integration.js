// Final Database Integration Test
// Tests all database connections and configurations

const mysql = require('mysql2/promise');
const fs = require('fs');

async function testDatabaseIntegration() {
  console.log('🔍 FINAL DATABASE INTEGRATION AUDIT');
  console.log('====================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  // Test 1: MySQL Connection
  console.log('1. Testing MySQL Connection...');
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'idealweddings',
      password: 'idealweddings',
      database: 'idealweddings'
    });
    
    await connection.execute('SELECT 1');
    console.log('   ✅ MySQL connection successful\n');
    results.tests.push({
      name: 'MySQL Connection',
      status: 'PASS',
      details: 'Connected to idealweddings database'
    });
    results.summary.passed++;
    
    // Test 2: Check Required Tables
    console.log('2. Checking Required Tables...');
    const requiredTables = [
      'users', 'user_profiles', 'vendors', 'vendor_services',
      'weddings', 'quotes', 'guest_lists', 'bookings',
      'payments', 'reviews', 'messages', 'notifications'
    ];
    
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    let allTablesExist = true;
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' MISSING`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      results.tests.push({
        name: 'Required Tables',
        status: 'PASS',
        details: `All ${requiredTables.length} required tables exist`
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Required Tables',
        status: 'FAIL',
        details: 'Some required tables are missing'
      });
      results.summary.failed++;
    }
    console.log('');
    
    // Test 3: Check Users Table Structure
    console.log('3. Validating Users Table Structure...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'idealweddings' AND TABLE_NAME = 'users'"
    );
    
    const requiredColumns = {
      'id': 'int',
      'email': 'varchar',
      'password_hash': 'varchar',
      'first_name': 'varchar',
      'last_name': 'varchar',
      'role': 'enum'
    };
    
    let structureValid = true;
    for (const [colName, colType] of Object.entries(requiredColumns)) {
      const column = columns.find(c => c.COLUMN_NAME === colName);
      if (column) {
        console.log(`   ✅ Column '${colName}' (${column.DATA_TYPE}) exists`);
      } else {
        console.log(`   ❌ Column '${colName}' MISSING`);
        structureValid = false;
      }
    }
    
    if (structureValid) {
      results.tests.push({
        name: 'Users Table Structure',
        status: 'PASS',
        details: 'All required columns present'
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Users Table Structure',
        status: 'FAIL',
        details: 'Missing required columns'
      });
      results.summary.failed++;
    }
    console.log('');
    
    // Test 4: Test Data Operations
    console.log('4. Testing Database Operations...');
    
    // Test INSERT
    try {
      await connection.execute(
        "INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
        ['test@audit.com', 'test_hash', 'Audit', 'Test', 'user']
      );
      console.log('   ✅ INSERT operation works');
    } catch (err) {
      console.log(`   ❌ INSERT failed: ${err.message}`);
      structureValid = false;
    }
    
    // Test SELECT
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        ['test@audit.com']
      );
      console.log(`   ✅ SELECT operation works (found ${rows.length} rows)`);
    } catch (err) {
      console.log(`   ❌ SELECT failed: ${err.message}`);
      structureValid = false;
    }
    
    // Test UPDATE
    try {
      await connection.execute(
        "UPDATE users SET first_name = ? WHERE email = ?",
        ['AuditUpdated', 'test@audit.com']
      );
      console.log('   ✅ UPDATE operation works');
    } catch (err) {
      console.log(`   ❌ UPDATE failed: ${err.message}`);
      structureValid = false;
    }
    
    // Test DELETE
    try {
      await connection.execute(
        "DELETE FROM users WHERE email = ?",
        ['test@audit.com']
      );
      console.log('   ✅ DELETE operation works');
    } catch (err) {
      console.log(`   ❌ DELETE failed: ${err.message}`);
      structureValid = false;
    }
    
    if (structureValid) {
      results.tests.push({
        name: 'Database Operations',
        status: 'PASS',
        details: 'All CRUD operations working'
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Database Operations',
        status: 'FAIL',
        details: 'Some operations failed'
      });
      results.summary.failed++;
    }
    console.log('');
    
    // Test 5: Check Indexes
    console.log('5. Checking Database Indexes...');
    const [indexes] = await connection.execute(
      "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'idealweddings' AND TABLE_NAME = 'users'"
    );
    
    console.log(`   ✅ Found ${indexes.length} indexes on users table`);
    indexes.forEach(idx => {
      console.log(`      - ${idx.INDEX_NAME}`);
    });
    
    results.tests.push({
      name: 'Database Indexes',
      status: 'PASS',
      details: `${indexes.length} indexes found`
    });
    results.summary.passed++;
    console.log('');
    
    await connection.end();
    
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error.message}\n`);
    results.tests.push({
      name: 'MySQL Connection',
      status: 'FAIL',
      details: error.message
    });
    results.summary.failed++;
  }
  
  // Test 6: Check .env Files
  console.log('6. Checking .env Configuration Files...');
  const services = [
    'backend/auth-service',
    'backend/vendor-service',
    'backend/quote-service',
    'backend/guest-service',
    'backend/credit-service',
    'backend/api-gateway'
  ];
  
  let envFilesOk = true;
  for (const service of services) {
    const envPath = `${service}/.env`;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('DATABASE_URL=mysql://')) {
        console.log(`   ✅ ${service}/.env configured for MySQL`);
      } else {
        console.log(`   ⚠️  ${service}/.env not using MySQL`);
        envFilesOk = false;
      }
    } else {
      console.log(`   ❌ ${service}/.env MISSING`);
      envFilesOk = false;
    }
  }
  
  if (envFilesOk) {
    results.tests.push({
      name: 'Environment Configuration',
      status: 'PASS',
      details: 'All services configured'
    });
    results.summary.passed++;
  } else {
    results.tests.push({
      name: 'Environment Configuration',
      status: 'WARNING',
      details: 'Some services need configuration'
    });
    results.summary.warnings++;
  }
  console.log('');
  
  // Calculate totals
  results.summary.total = results.tests.length;
  
  // Generate Report
  console.log('═══════════════════════════════════════════════════');
  console.log('              AUDIT SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // Save results
  fs.writeFileSync(
    'cursor-output/database-integration-test-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('💾 Results saved to: cursor-output/database-integration-test-results.json');
  
  const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
  console.log(`\n📊 Pass Rate: ${passRate}%`);
  
  if (results.summary.failed === 0) {
    console.log('\n🎉 DATABASE INTEGRATION: EXCELLENT!');
    console.log('✅ All critical tests passed');
    console.log('✅ Ready for production deployment\n');
  } else {
    console.log('\n⚠️  DATABASE INTEGRATION: NEEDS ATTENTION');
    console.log('Some tests failed - review results above\n');
  }
  
  return results;
}

testDatabaseIntegration()
  .then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  });
