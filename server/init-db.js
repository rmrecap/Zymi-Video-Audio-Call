import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths: script is in /server, root is one level up
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const { Pool } = pg;

async function runDDL() {
    console.log('Starting DB initialization...');
    
    // Use DATABASE_URL from .env
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL not found in .env file.');
        return;
    }

    console.log(`Connecting to: ${connectionString.replace(/:([^@]+)@/, ':****@')}`);
    
    const pool = new Pool({ connectionString });

    try {
        const ddlPath = path.join(rootDir, 'ddl.sql');
        if (!fs.existsSync(ddlPath)) {
            throw new Error(`DDL file not found at ${ddlPath}`);
        }

        const sql = fs.readFileSync(ddlPath, 'utf8');
        console.log(`Reading DDL from: ${ddlPath}`);
        
        await pool.query(sql);
        console.log('✅ Database schema initialized successfully!');
        
    } catch (err) {
        console.error('❌ Error initializing database:', err);
        if (err.message && err.message.includes('Connection refused')) {
            console.error('   Hint: Make sure your PostgreSQL server is running on localhost:5433');
        }
    } finally {
        await pool.end();
    }
}

runDDL();
