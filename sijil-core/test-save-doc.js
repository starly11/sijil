import { connectDB, dbConnection } from './src/config/db.js';
import Document from './src/models/document.model.js';

async function testSaveDoc() {
    await connectDB();
    console.log('Connected. Creating test document...');

    const testDoc = new Document({
        _id: 'test-doc-123',
        title: 'Test Document Title',
        slug: 'test-doc-slug',
        schema_version: '1.0.0',
        schema_type: 'document'
    });

    const saved = await testDoc.save();
    console.log('Saved document:', JSON.stringify(saved, null, 2));

    const found = await Document.findById('test-doc-123').lean();
    console.log('Found document:', JSON.stringify(found, null, 2));

    await dbConnection.close();
    console.log('Done');
}

testSaveDoc().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});