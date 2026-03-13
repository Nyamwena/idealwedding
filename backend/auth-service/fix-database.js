const { Client } = require('pg');

async function fixDatabasePermissions() {
  console.log('🔧 Fixing PostgreSQL permissions...');
  
  // Connect as superuser to grant permissions
  const superClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres', // Common default password
  });

  try {
    await superClient.connect();
    console.log('✅ Connected to PostgreSQL as superuser');

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

    // Grant permissions to idealweddings user
    console.log('🔑 Granting permissions to idealweddings user...');
    
    // Grant schema permissions
    await superClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO idealweddings');
    await superClient.query('GRANT CREATE ON SCHEMA public TO idealweddings');
    
    // Grant database permissions
    await superClient.query('GRANT ALL PRIVILEGES ON DATABASE idealweddings TO idealweddings');
    
    // Grant default privileges
    await superClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO idealweddings');
    await superClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO idealweddings');
    
    console.log('✅ Permissions granted successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative approach - create user if it doesn't exist
    if (error.message.includes('role "idealweddings" does not exist')) {
      console.log('👤 Creating idealweddings user...');
      try {
        await superClient.query("CREATE USER idealweddings WITH PASSWORD 'idealweddings123'");
        await superClient.query('GRANT ALL PRIVILEGES ON DATABASE idealweddings TO idealweddings');
        await superClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO idealweddings');
        await superClient.query('GRANT CREATE ON SCHEMA public TO idealweddings');
        console.log('✅ User created and permissions granted');
      } catch (createError) {
        console.error('❌ Error creating user:', createError.message);
      }
    }
  } finally {
    await superClient.end();
  }

  // Test connection with application credentials
  console.log('🧪 Testing connection with application credentials...');
  const testClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'idealweddings',
    user: 'idealweddings',
    password: 'idealweddings123',
  });

  try {
    await testClient.connect();
    console.log('✅ Application credentials work!');
    
    // Test creating a simple table
    await testClient.query('CREATE TABLE IF NOT EXISTS test_permissions (id SERIAL PRIMARY KEY)');
    console.log('✅ Can create tables!');
    
    await testClient.query('DROP TABLE IF EXISTS test_permissions');
    console.log('✅ Can drop tables!');
    
  } catch (error) {
    console.error('❌ Application credentials test failed:', error.message);
  } finally {
    await testClient.end();
  }
}

fixDatabasePermissions().then(() => {
  console.log('🎉 Database fix complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database fix failed:', error);
  process.exit(1);
});
