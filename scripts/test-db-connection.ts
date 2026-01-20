import { db } from '../packages/db/client';

async function testConnection() {
  try {
    console.log('🔍 [DB] Testing database connection...');
    console.log('📡 [DB] DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
    
    // Test connection
    await db.$connect();
    console.log('✅ [DB] Connected successfully!');
    
    // Test query
    const productCount = await db.product.count();
    console.log(`📦 [DB] Products in database: ${productCount}`);
    
    if (productCount > 0) {
      const products = await db.product.findMany({
        take: 3,
        include: {
          translations: true,
          variants: { take: 1 }
        }
      });
      
      console.log('\n📋 [DB] Sample products:');
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.translations[0]?.title || 'No title'} (ID: ${p.id})`);
        console.log(`     Published: ${p.published}, Variants: ${p.variants.length}`);
      });
    }
    
    await db.$disconnect();
    console.log('\n✅ [DB] Connection test complete!');
  } catch (error: any) {
    console.error('❌ [DB] Connection failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

testConnection();

