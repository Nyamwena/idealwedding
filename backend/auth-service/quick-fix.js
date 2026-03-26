const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Fix for Ideal Weddings Database Issues');
console.log('===============================================');

// Create a simple in-memory database configuration
const inMemoryConfig = `# Ideal Weddings Auth Service Configuration - QUICK FIX
NODE_ENV=development
PORT=3002

# In-Memory Database (no permissions needed)
DATABASE_URL=sqlite://:memory:

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=15m

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
# SENDGRID_API_KEY=your-sendgrid-api-key
# FROM_EMAIL=noreply@idealweddings.com
`;

// Write the configuration
fs.writeFileSync('.env', inMemoryConfig);
console.log('✅ Created .env file with in-memory SQLite configuration');

// Create a simple test script
const testScript = `
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testApp() {
  try {
    console.log('🧪 Testing application startup...');
    const app = await NestFactory.create(AppModule, { logger: false });
    console.log('✅ Application created successfully!');
    
    await app.close();
    console.log('🎉 Application test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Application test failed:', error.message);
    process.exit(1);
  }
}

testApp();
`;

fs.writeFileSync('test-app.js', testScript);
console.log('✅ Created test script');

console.log('\\n🎯 Next Steps:');
console.log('1. Run: npm run start:dev');
console.log('2. Test: curl http://localhost:3002/health');
console.log('3. If successful, the backend services should work!');
console.log('\\n💡 Note: In-memory database will reset on restart, but allows immediate testing');
console.log('   For production, you can switch back to PostgreSQL or MySQL later');
