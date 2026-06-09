/**
 * backup_db_schema.js
 * Exports MongoDB collection STRUCTURE ONLY (no document data):
 *   - Collection names & options (validators, capped, etc.)
 *   - All indexes per collection
 *
 * Usage:
 *   node backup_db_schema.js <outputDir>
 *
 * Output:
 *   <outputDir>/db_schema.json
 */

'use strict';

const { MongoClient } = require('mongodb');
const fs   = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const outputDir = args[0] || path.join(__dirname, 'db_schema_backup');

// Read MONGO_URI from backend .env (fallback to local default)
let mongoUri = 'mongodb://127.0.0.1:27017/crm_db';
const envFile = path.join(__dirname, 'express-mongo-backend', '.env');
if (fs.existsSync(envFile)) {
    const lines   = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
    const uriLine = lines.find(l => /^MONGO_URI\s*=/.test(l));
    if (uriLine) mongoUri = uriLine.split('=').slice(1).join('=').trim();
}

// Extract DB name from URI
function dbNameFromUri(uri) {
    const m = uri.match(/\/([^/?]+)(\?|$)/);
    return m ? m[1] : 'crm_db';
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function backup() {
    console.log(`\nConnecting to: ${mongoUri.replace(/:\/\/[^@]*@/, '://***@')}`);
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 8000 });

    try {
        await client.connect();
        const dbName = dbNameFromUri(mongoUri);
        const db     = client.db(dbName);

        // Ensure output directory exists
        fs.mkdirSync(outputDir, { recursive: true });

        // List all collections (include system collections? no – skip them)
        const cols = await db.listCollections().toArray();
        const schema = {
            dbName,
            exportedAt: new Date().toISOString(),
            collections: []
        };

        for (const col of cols) {
            const name    = col.name;
            const options = col.options || {};
            const indexes = await db.collection(name).indexes();

            schema.collections.push({ name, options, indexes });
            console.log(`  ✔ ${name.padEnd(30)} ${indexes.length} index(es)`);
        }

        const outFile = path.join(outputDir, 'db_schema.json');
        fs.writeFileSync(outFile, JSON.stringify(schema, null, 2), 'utf8');

        console.log(`\nSchema backup saved to: ${outFile}`);
        console.log(`Collections exported  : ${schema.collections.length}`);
        console.log('NOTE: No document data was exported (schema-only).\n');
    } finally {
        await client.close();
    }
}

backup().catch(err => {
    console.error('\nBackup failed:', err.message);
    process.exit(1);
});
