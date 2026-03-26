
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
