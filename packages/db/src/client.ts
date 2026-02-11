import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = postgres(connectionString, { max: 10 });
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}

// Export a Proxy that lazily initializes the database connection
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(target, prop) {
    const database = getDb();
    return database[prop as keyof typeof database];
  },
});

export type Database = typeof db;
