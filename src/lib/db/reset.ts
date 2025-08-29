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
    // Drop all tables completely (CASCADE will drop all dependencies)
    console.log('⏳ Dropping all tables and schemas...');
    
    // First, disable all foreign key checks and drop everything with CASCADE
    await db.execute(`DROP SCHEMA IF EXISTS "drizzle" CASCADE;`);
    await db.execute(`DROP SCHEMA IF EXISTS "public" CASCADE;`);
    await db.execute(`CREATE SCHEMA "public";`);
    await db.execute(`GRANT ALL ON SCHEMA "public" TO PUBLIC;`);
    
    console.log('✅ All tables and schemas reset successfully');

    // Run migrations to recreate all tables
    console.log('⏳ Running migrations to recreate tables...');
    
    const start = Date.now();
    await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
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