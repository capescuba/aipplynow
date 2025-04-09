const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function runMigration() {
  const pool = mysql.createPool(config.db);
  
  try {
    const conn = await pool.getConnection();
    
    // Create migrations table if it doesn't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of applied migrations
    const [appliedMigrations] = await conn.query('SELECT name FROM migrations');
    const appliedMigrationNames = new Set(appliedMigrations.map(m => m.name));
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    // Apply new migrations
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.has(file)) {
        console.log(`Applying migration: ${file}`);
        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        
        // Split SQL into individual statements
        const statements = sql.split(';').filter(s => s.trim());
        
        // Run each statement in a transaction
        await conn.beginTransaction();
        try {
          for (const statement of statements) {
            if (statement.trim()) {
              await conn.query(statement);
            }
          }
          await conn.query('INSERT INTO migrations (name) VALUES (?)', [file]);
          await conn.commit();
          console.log(`Successfully applied migration: ${file}`);
        } catch (error) {
          await conn.rollback();
          throw error;
        }
      }
    }
    
    conn.release();
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error); 