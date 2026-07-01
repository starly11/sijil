import { connectDB, dbConnection } from './src/config/db.js';

async function main() {
    await connectDB();

    // Check topics
    const topicsMissingIsArchived = await dbConnection.collection('topics').countDocuments({
        is_archived: { $exists: false }
    });
    console.log(`Topics missing is_archived: ${topicsMissingIsArchived}`);

    // Check documents
    const docsMissingIsArchived = await dbConnection.collection('documents').countDocuments({
        is_archived: { $exists: false }
    });
    console.log(`Documents missing is_archived: ${docsMissingIsArchived}`);

    // Also check topic_content, topic_asset, topic_assessment just in case (though probably don't need is_archived there)
    console.log("Check complete!");

    await dbConnection.close();
}

main();