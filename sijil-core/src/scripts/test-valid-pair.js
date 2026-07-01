import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;

async function testAPI() {
  await mongoose.connect(MONGODB_URI);
  const Topic = (await import('../models/topic.model.js')).default;
  const Document = (await import('../models/document.model.js')).default;
  
  // Find a valid pair
  const topics = await Topic.find().lean();
  const docs = await Document.find().select('document_metadata').lean();
  const docMetaIds = docs.map(d => d.document_metadata?.document_id).filter(Boolean);
  
  const validTopic = topics.find(t => docMetaIds.includes(t.document_id));
  
  if (!validTopic) {
    console.log('❌ No valid topic found');
    process.exit(1);
  }
  
  console.log('✅ Found valid topic:', validTopic._id);
  console.log('   document_id:', validTopic.document_id);
  console.log('   title:', validTopic.title);
  
  // Find corresponding document
  const doc = docs.find(d => d.document_metadata?.document_id === validTopic.document_id);
  console.log('   Linked document _id:', doc._id);
  
  process.exit(0);
}

testAPI().catch(err => { console.error(err); process.exit(1); });
