import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;

async function audit() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  
  const Document = (await import('../models/document.model.js')).default;
  const Topic = (await import('../models/topic.model.js')).default;
  const TopicContent = (await import('../models/topicContent.model.js')).default;
  const TopicAsset = (await import('../models/topicAsset.model.js')).default;
  const TopicAssessment = (await import('../models/topicAssessment.model.js')).default;

  const docCount = await Document.countDocuments();
  const topicCount = await Topic.countDocuments();
  const contentCount = await TopicContent.countDocuments();
  const assetCount = await TopicAsset.countDocuments();
  const assessmentCount = await TopicAssessment.countDocuments();

  console.log('\n📊 COLLECTION COUNTS:');
  console.log('  documents:', docCount);
  console.log('  topics:', topicCount);
  console.log('  topic_content:', contentCount);
  console.log('  topic_assets:', assetCount);
  console.log('  topic_assessments:', assessmentCount);

  const allTopics = await Topic.find().lean();
  const docsMeta = await Document.find().select('document_metadata').lean();
  const docMetaIds = docsMeta.map(d => d.document_metadata?.document_id).filter(Boolean);
  const topicDocIds = allTopics.map(t => t.document_id).filter(Boolean);
  
  const validPairs = topicDocIds.filter(tid => docMetaIds.includes(tid)).length;
  const brokenRefsCount = topicDocIds.filter(tid => !docMetaIds.includes(tid)).length;
  const orphanedTopics = topicCount - validPairs;
  const orphanedDocs = docCount - validPairs;

  console.log('\n🔗 RELATIONSHIP CONTRACT:');
  console.log('  VALID_PAIRS:', validPairs);
  console.log('  ORPHANED_TOPICS:', orphanedTopics);
  console.log('  ORPHANED_DOCUMENTS:', orphanedDocs);
  console.log('  BROKEN_REFERENCES:', brokenRefsCount);

  if (validPairs === 0) {
    console.log('\n❌ ISSUE: No valid topic-document pairs found');
  } else {
    console.log('\n✅ Found', validPairs, 'valid topic-document pairs');
    
    // Show valid pairs
    const validTopicIds = allTopics
      .filter(t => docMetaIds.includes(t.document_id))
      .map(t => t._id);
    console.log('\nValid topic IDs for testing:');
    validTopicIds.slice(0, 3).forEach(id => console.log('  -', id));
  }

  process.exit(0);
}

audit().catch(err => { 
  console.error('Error:', err.message); 
  process.exit(1); 
});
