import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        // Load and execute schema
        console.log('Initializing database schema...');
        const schemaPath = path.join(__dirname, '../src/database/mysql/schemas/flight_booking.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        const statements = schema.split(';').filter(s => s.trim());
        
        for (const stmt of statements) {
            if (stmt.trim()) {
                await connection.query(stmt);
            }
        }
        
        // Switch to correct database
        await connection.changeUser({ database: process.env.DB_NAME });
        
        // Load and execute triggers/procedures
        console.log('Creating triggers and procedures...');
        const triggerPath = path.join(__dirname, '../src/database/mysql/schemas/trigger_procedure.sql');
        let content = fs.readFileSync(triggerPath, 'utf-8');
        
        // Filter out lines that contain DELIMITER or use statements
        const lines = content.split('\n')
            .filter(line => !line.match(/^use\s+\w+/i) && !line.match(/^DELIMITER/i))
            .join('\n');
        
        // Split by // for procedures/triggers
        const statements_to_execute = lines.split('//').filter(s => s.trim());
        
        for (const stmt of statements_to_execute) {
            if (stmt.trim()) {
                // Add semicolon if not present
                const sql = stmt.trim().endsWith(';') ? stmt.trim() : stmt.trim() + ';';
                try {
                    await connection.query(sql);
                } catch (e) {
                    if (e.code !== 'ER_DUP_ENTRY' && e.code !== 'ER_DUP_KEY_NAME') {
                        console.warn('Warning executing trigger/procedure:', e.message.substring(0, 100));
                    }
                }
            }
        }
        
        console.log('Database initialized successfully');
    } finally {
        await connection.end();
    }
};

run().catch(e => {
    console.error('Database initialization failed:', e);
    process.exit(1);
});
