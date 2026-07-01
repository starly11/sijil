import { connectDB, dbConnection } from './src/config/db.js';

async function cleanDatabase() {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Connected. Cleaning all collections...");

    const collections = await dbConnection.db.listCollections().toArray();
    for (const col of collections) {
        console.log(`Cleaning collection: ${col.name}`);
        await dbConnection.collection(col.name).deleteMany({});
    }

    console.log("Database cleaned. Disconnecting...");
    await dbConnection.close();
}

cleanDatabase().catch(err => {
    console.error("Error cleaning database:", err);
    process.exit(1);
});