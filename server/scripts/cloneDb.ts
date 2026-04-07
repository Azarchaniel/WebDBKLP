import mongoose from "mongoose";
import fs from "fs";
import path from "path";

/**
 * Clones all collections from a source MongoDB database to a target database on localhost.
 *
 * HOW TO RUN:
 *   npx ts-node scripts/cloneDb.ts
 *
 * Optional env overrides:
 *   $env:MONGO_DB_SOURCE="WebDBKLP"; $env:MONGO_DB_TARGET="WebDBKLP-test"; npm run cloneDb
 */

// Load env vars from nodemon.json so migrations work without nodemon
const nodemonConfig = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../nodemon.json"), "utf-8")
);
Object.entries(nodemonConfig.env ?? {}).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value as string;
});

const SOURCE_DB = process.env.MONGO_DB_SOURCE ?? "WebDBKLP";
const TARGET_DB = process.env.MONGO_DB_TARGET ?? "WebDBKLP-test";
const MONGO_CLUSTER = process.env.MONGO_CLUSTER ?? "localhost:27017";

const sourceUri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${MONGO_CLUSTER}/${SOURCE_DB}?retryWrites=true&w=majority`;
const targetUri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${MONGO_CLUSTER}/${TARGET_DB}?retryWrites=true&w=majority`;

async function cloneDatabase(): Promise<void> {
    console.log(`Cloning "${SOURCE_DB}" → "${TARGET_DB}" on ${MONGO_CLUSTER}`);

    const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
    const targetConn = await mongoose.createConnection(targetUri).asPromise();

    const sourceDb = sourceConn.db!;
    const targetDb = targetConn.db!;

    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections: ${collections.map(c => c.name).join(", ")}`);

    for (const collectionInfo of collections) {
        const name = collectionInfo.name;
        process.stdout.write(`Copying "${name}"...`);

        const docs = await sourceDb.collection(name).find({}).toArray();

        // Drop target collection and re-create it
        await targetDb.collection(name).drop().catch(() => { /* ignore if doesn't exist */ });

        if (docs.length > 0) {
            await targetDb.collection(name).insertMany(docs);
        }

        // Re-create indexes
        const indexes = await sourceDb.collection(name).indexes();
        for (const index of indexes) {
            if (index.name === "_id_") continue; // _id index is created automatically
            const { key, name: indexName, ...options } = index;
            await targetDb.collection(name).createIndex(key, { ...options, name: indexName }).catch(() => { /* ignore duplicate index errors */ });
        }

        console.log(` ${docs.length} documents copied.`);
    }

    await sourceConn.close();
    await targetConn.close();

    console.log("==== CLONE FINISHED ====");
}

cloneDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Clone failed:", err);
        process.exit(1);
    });
