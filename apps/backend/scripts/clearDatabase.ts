import { db } from '../src/db/index.js';
import { logs, files } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    
    // Delete in correct order (child table first due to foreign key)
    console.log('Deleting logs...');
    await db.delete(logs);
    
    console.log('Deleting files...');
    await db.delete(files);
    
    console.log('✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
