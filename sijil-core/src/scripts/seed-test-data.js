import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Document = (await import('../models/document.model.js')).default;
    const Topic = (await import('../models/topic.model.js')).default;
    const TopicContent = (await import('../models/topicContent.model.js')).default;
    const TopicAsset = (await import('../models/topicAsset.model.js')).default;
    const TopicAssessment = (await import('../models/topicAssessment.model.js')).default;

    // Check if we already have valid topic-document pairs
    const existingTopics = await Topic.find().limit(5).lean();
    let validPair = null;

    for (const topic of existingTopics) {
      const doc = await Document.findById(topic.document_id).lean();
      if (doc) {
        validPair = { topic, doc };
        break;
      }
    }

    if (validPair) {
      console.log('✅ Valid topic-document pair already exists:');
      console.log(`   Document: ${validPair.doc._id} (${validPair.doc.document_metadata.title})`);
      console.log(`   Topic: ${validPair.topic._id} (${validPair.topic.title})`);
      console.log('\n🎉 Database already has test data. Run the backend-readiness test again.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('⚠️  No valid topic-document pairs found. Creating test data...');

    const docId = `doc_test_${Date.now()}`;
    const topicId = `top_test_${Date.now()}`;
    const topicSlug = 'intro-to-motion';
    const topicPath = '/physics/grade-9/intro-to-motion';

    // Create a valid document that matches the readiness script filters.
    const testDoc = await Document.create({
      _id: docId,
      schema_type: 'document',
      title: 'Test Physics Book',
      slug: 'test-physics-book',
      document_metadata: {
        _id: docId,
        document_id: docId,
        title: 'Test Physics Book',
        subject: 'Physics',
        subject_slug: 'physics',
        grade_numeric: 9,
        grade_level: 'Grade 9',
        document_type: 'textbook',
        language: 'en'
      },
      ingest_metadata: {
        ingest_id: `ingest_${Date.now()}`,
        engine: 'test',
        ingest_timestamp: new Date(),
        status: 'complete',
        confidence_score: 1,
        zod_validation_passed: true
      },
      topic_refs: [
        {
          _id: topicId,
          slug: topicSlug,
          slug_global: topicPath,
          title: 'Introduction to Motion',
          display_order: 1,
          url_path: topicPath
        }
      ],
      publishing: {
        status: 'published',
        url_path: '/docs/test-physics-book'
      },
      created_at: new Date()
    });
    console.log('✅ Created test document:', testDoc._id);

    // Create a topic linked to this document.
    const testTopic = await Topic.create({
      _id: topicId,
      document_id: docId,
      chapter_id: `ch_${Date.now()}`,
      parent_topic_id: null,
      title: 'Introduction to Motion',
      slug: topicSlug,
      slug_global: topicPath,
      url_path: topicPath,
      subject: 'Physics',
      grade_numeric: 9,
      topic_type: 'content',
      display_order: 1,
      publishing_status: 'published',
      language: 'en',
      locale: 'en',
      keywords: ['motion', 'physics'],
      key_terms_preview: ['motion'],
      created_at: new Date()
    });
    console.log('✅ Created topic:', testTopic._id, 'linked to document:', testTopic.document_id);

    // Create topic content with the expected schema fields.
    await TopicContent.create({
      _id: `toc_${Date.now()}`,
      topic_id: testTopic._id,
      document_id: docId,
      raw_text: 'Motion is the change in position of an object over time.',
      clean_html: '<p>Motion is the change in position of an object over time.</p>',
      content_blocks: [
        {
          type: 'heading',
          content: { text: 'What is Motion?' }
        },
        {
          type: 'paragraph',
          content: { text: 'Motion is the change in position of an object over time.' }
        }
      ],
      key_terms: [
        {
          term: 'Motion',
          definition: 'The change in position of an object over time.',
          term_type: 'concept',
          first_occurrence_page: 1,
          related_terms: ['speed', 'velocity']
        }
      ],
      created_at: new Date()
    });
    console.log('✅ Created topic content');

    // Create topic assets with the expected schema fields.
    await TopicAsset.create({
      _id: `tas_${Date.now()}`,
      topic_id: testTopic._id,
      document_id: docId,
      figures: [
        {
          _id: `fig_${Date.now()}`,
          figure_number: '1',
          caption: 'Diagram of motion',
          alt: 'Motion diagram',
          render_strategy: 'image',
          image_path_local: 'physics/motion-diagram.png'
        }
      ],
      tables: [],
      created_at: new Date()
    });
    console.log('✅ Created topic assets');

    // Create topic assessments with the expected schema fields.
    await TopicAssessment.create({
      _id: `taa_${Date.now()}`,
      topic_id: testTopic._id,
      document_id: docId,
      book_mcqs: [
        {
          _id: `mcq_${Date.now()}`,
          question_number: '1',
          question_text: 'What is motion?',
          options: {
            a: 'Change in position',
            b: 'Rest',
            c: 'Speed',
            d: 'Velocity'
          },
          correct_answer: 'a',
          explanation: 'Motion is the change in position of an object over time.',
          difficulty: 'easy',
          source_page: 1
        }
      ],
      book_short_questions: [
        {
          _id: `sq_${Date.now()}`,
          question_number: '1',
          question_text: 'Define motion.',
          model_answer: 'Motion is the change in position of an object over time.',
          marks: 2,
          difficulty: 'easy',
          source_page: 1
        }
      ],
      book_problems: [],
      activities: [],
      flashcards: [],
      created_at: new Date()
    });
    console.log('✅ Created topic assessments');

    console.log('\n🎉 SEED COMPLETE! Test data created successfully.');
    console.log('\nNow run: node src/tests/backend-readiness.js');
    console.log('Expected result: 22/22 tests passing');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
