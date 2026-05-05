import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

async function initDb() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('Error: DATABASE_URL not found in .env');
        process.exit(1);
    }

    console.log('Connecting to PostgreSQL...');
    console.log(`URL: ${databaseUrl.replace(/:([^:@/]+)@/, ':****@')}`); // Hide password

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    try {
        const client = await pool.connect();
        console.log('Connected successfully!');

        const ddlPath = path.join(__dirname, '..', 'ddl.sql');
        if (!fs.existsSync(ddlPath)) {
            console.error(`Error: ddl.sql not found at ${ddlPath}`);
            process.exit(1);
        }

        console.log('Reading ddl.sql...');
        const ddl = fs.readFileSync(ddlPath, 'utf8');

        console.log('Executing DDL script...');
        await client.query(ddl);
        
        console.log('Database initialized successfully!');
        client.release();
    } catch (err) {
        console.error('Initialization failed!');
        console.error('Error details:', err.message);
        
        if (err.message.includes('ECONNREFUSED')) {
            console.error('\nTIP: It looks like PostgreSQL is not running.');
            console.log('Make sure your Docker container or local PostgreSQL service is started.');
            console.log(`Checking port: ${process.env.POSTGRES_PORT || '5433'}`);
        } else if (err.message.includes('password authentication failed')) {
            console.error('\nTIP: Authentication failed. Check your POSTGRES_USER and POSTGRES_PASSWORD in .env');
        } else if (err.message.includes('database "zymi_db" does not exist')) {
            console.error('\nTIP: The database "zymi_db" does not exist. You may need to create it first.');
            console.log('Try running: CREATE DATABASE zymi_db;');
        }
    } finally {
        await pool.end();
    }
}

initDb();
