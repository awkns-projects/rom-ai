import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const resetDatabase = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('🗑️  Starting database reset...');

  try {
    // Drop all tables in the correct order (respecting foreign key constraints)
    console.log('⏳ Dropping tables...');
    
    // Drop tables with foreign key dependencies first
    await db.execute(`DROP TABLE IF EXISTS "Vote" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "Message" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "Suggestion" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "Stream" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "Document" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "Chat" CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS "User" CASCADE;`);
    
    // Drop the migrations table to ensure clean migration state
    await db.execute(`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`);
    
    console.log('✅ All tables dropped successfully');

    // Run migrations to recreate all tables
    console.log('⏳ Running migrations to recreate tables...');
    
    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Database reset completed successfully in', end - start, 'ms');
    console.log('🎉 Database is now clean and ready to use!');
    
  } catch (error) {
    console.error('❌ Database reset failed');
    console.error(error);
    throw error;
  } finally {
    await connection.end();
    process.exit(0);
  }
};

resetDatabase().catch((err) => {
  console.error('❌ Database reset failed');
  console.error(err);
  process.exit(1);
}); 