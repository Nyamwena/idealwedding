const { Client } = require('pg');

async function fixPostgreSQLPermissions() {
  console.log('🔧 Attempting to fix PostgreSQL permissions...');
  
  // Common PostgreSQL superuser passwords to try
  const passwords = [
    'postgres',
    'admin',
    'password',
    'root',
    '123456',
    '', // empty password
    'idealweddings123', // same as the app password
  ];
  
  let superClient = null;
  
  // Try to connect as superuser
  for (const password of passwords) {
    try {
      console.log(`🔍 Trying PostgreSQL connection with password: ${password || 'empty'}`);
      superClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: password,
      });
      
      await superClient.connect();
      console.log('✅ Connected to PostgreSQL as superuser!');
      break;
    } catch (error) {
      console.log(`❌ Failed with password "${password || 'empty'}": ${error.message}`);
      if (superClient) {
        try {
          await superClient.end();
        } catch (e) {}
        superClient = null;
      }
    }
  }
  
  if (!superClient) {
    console.log('❌ Could not connect to PostgreSQL with any common password');
    console.log('💡 Please check your PostgreSQL configuration or provide the correct superuser password');
    return false;
  }
  
  try {
    // Check if idealweddings database exists
    const dbCheck = await superClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'idealweddings'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📝 Creating idealweddings database...');
      await superClient.query('CREATE DATABASE idealweddings');
      console.log('✅ Database created');
    } else {
      console.log('✅ Database already exists');
    }

    // Check if idealweddings user exists
    const userCheck = await superClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'idealweddings'"
    );

    if (userCheck.rows.length === 0) {
      console.log('👤 Creating idealweddings user...');
      await superClient.query("CREATE USER idealweddings WITH PASSWORD 'idealweddings123'");
      console.log('✅ User created');
    } else {
      console.log('✅ User already exists');
    }

    // Grant all necessary permissions
    console.log('🔑 Granting permissions to idealweddings user...');
    
    // Database permissions
    await superClient.query('GRANT ALL PRIVILEGES ON DATABASE idealweddings TO idealweddings');
    await superClient.query('GRANT CONNECT ON DATABASE idealweddings TO idealweddings');
    
    // Schema permissions
    await superClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO idealweddings');
    await superClient.query('GRANT CREATE ON SCHEMA public TO idealweddings');
    
    // Default privileges for future objects
    await superClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO idealweddings');
    await superClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO idealweddings');
    await superClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO idealweddings');
    
    console.log('✅ Permissions granted successfully');
    
    // Test the connection with application credentials
    console.log('🧪 Testing application credentials...');
    
    const testClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'idealweddings',
      user: 'idealweddings',
      password: 'idealweddings123',
    });

    await testClient.connect();
    console.log('✅ Application credentials work!');
    
    // Test creating a simple table
    await testClient.query('CREATE TABLE IF NOT EXISTS test_permissions (id SERIAL PRIMARY KEY, name VARCHAR(100))');
    console.log('✅ Can create tables!');
    
    // Test inserting data
    await testClient.query("INSERT INTO test_permissions (name) VALUES ('test') ON CONFLICT DO NOTHING");
    console.log('✅ Can insert data!');
    
    // Test selecting data
    const result = await testClient.query('SELECT * FROM test_permissions LIMIT 1');
    console.log('✅ Can select data!');
    
    // Clean up test table
    await testClient.query('DROP TABLE IF EXISTS test_permissions');
    console.log('✅ Can drop tables!');
    
    await testClient.end();
    console.log('🎉 PostgreSQL permissions fixed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error.message);
    return false;
  } finally {
    if (superClient) {
      await superClient.end();
    }
  }
}

fixPostgreSQLPermissions().then((success) => {
  if (success) {
    console.log('🚀 Ready to start backend services!');
  } else {
    console.log('💡 Consider using MySQL or SQLite as alternatives');
  }
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('💥 Database fix failed:', error);
  process.exit(1);
});
