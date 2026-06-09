/**
 * import_db_schema.js
 * Recreates MongoDB collection STRUCTURE from a db_schema.json backup:
 *   - Creates missing collections (with original options/validators)
 *   - Recreates all indexes (skips _id, warns on conflict)
 *
 * Usage (run on production server):
 *   node import_db_schema.js <schemaDir> [mongoUri]
 *
 * Example:
 *   node import_db_schema.js D:\production\database
 *   node import_db_schema.js . "mongodb://127.0.0.1:27017/crm_db"
 */

'use strict';

const { MongoClient } = require('mongodb');
const fs   = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const schemaDir = args[0] || __dirname;
const schemaFile = path.join(schemaDir, 'db_schema.json');

// MongoUri: from arg, then from local .env, then fallback
let mongoUri = 'mongodb://127.0.0.1:27017/crm_db';
if (args[1]) {
    mongoUri = args[1];
} else {
    // Look for .env next to this script (useful on production if .env is copied)
    const envFile = path.join(schemaDir, '.env');
    const altEnv  = path.join(__dirname, '.env');
    const envPath = fs.existsSync(envFile) ? envFile : (fs.existsSync(altEnv) ? altEnv : null);
    if (envPath) {
        const lines   = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        const uriLine = lines.find(l => /^MONGO_URI\s*=/.test(l));
        if (uriLine) mongoUri = uriLine.split('=').slice(1).join('=').trim();
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function importSchema() {
    if (!fs.existsSync(schemaFile)) {
        console.error(`Schema file not found: ${schemaFile}`);
        process.exit(1);
    }

    const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    console.log(`\nImporting schema for database : ${schema.dbName}`);
    console.log(`Exported at                   : ${schema.exportedAt}`);
    console.log(`Connecting to                 : ${mongoUri.replace(/:\/\/[^@]*@/, '://***@')}\n`);

    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 8000 });

    try {
        await client.connect();
        const db = client.db(schema.dbName);

        let created = 0, skipped = 0, idxCreated = 0, idxWarned = 0;

        for (const col of schema.collections) {
            // Create collection only if it doesn't already exist
            const existing = await db.listCollections({ name: col.name }).toArray();
            if (existing.length === 0) {
                await db.createCollection(col.name, col.options || {});
                console.log(`  [CREATED ] ${col.name}`);
                created++;
            } else {
                console.log(`  [EXISTS  ] ${col.name}`);
                skipped++;
            }

            // Recreate indexes
            const collection = db.collection(col.name);
            for (const idx of (col.indexes || [])) {
                if (idx.name === '_id_') continue;   // always exists automatically
                try {
                    const opts = { name: idx.name, background: true };
                    if (idx.unique)  opts.unique  = true;
                    if (idx.sparse)  opts.sparse  = true;
                    if (idx.expireAfterSeconds != null) opts.expireAfterSeconds = idx.expireAfterSeconds;
                    if (idx.partialFilterExpression) opts.partialFilterExpression = idx.partialFilterExpression;

                    await collection.createIndex(idx.key, opts);
                    console.log(`      ↳ Index: ${idx.name}`);
                    idxCreated++;
                } catch (e) {
                    console.warn(`      ⚠ Index ${idx.name}: ${e.message}`);
                    idxWarned++;
                }
            }
        }

        console.log(`\n─────────────────────────────────────────`);
        console.log(`Collections created : ${created}`);
        console.log(`Collections skipped : ${skipped} (already exist)`);
        console.log(`Indexes created     : ${idxCreated}`);
        console.log(`Index warnings      : ${idxWarned}`);
        console.log(`─────────────────────────────────────────`);
        console.log('Schema import complete.\n');
    } finally {
        await client.close();
    }
}

importSchema().catch(err => {
    console.error('\nImport failed:', err.message);
    process.exit(1);
});
