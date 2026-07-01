import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Stores interactive card arrays, historical past paper sequences, and quantitative numerical exercises.
 */
const topicAssessmentSchema = new Schema({
    _id: { type: String, required: true },
    topic_id: { type: String, required: true, index: true },
    document_id: { type: String, required: true, index: true },

    book_mcqs: [
        new Schema({
            _id: { type: String, required: true },
            question_number: String,
            question_text: String,
            options: {
                _id: false,
                type: new Schema({ a: String, b: String, c: String, d: String })
            },
            correct_answer: { type: String, enum: ["a", "b", "c", "d"] },
            explanation: String,
            difficulty: { type: String, enum: ["easy", "medium", "hard"] },
            bloom_level: String,
            source_page: Number,
            past_paper_years: [String]
        }, { _id: false })
    ],

    book_short_questions: [
        new Schema({
            _id: { type: String, required: true },
            question_number: String,
            question_text: String,
            model_answer: String,
            marks: Number,
            difficulty: String,
            source_page: Number
        }, { _id: false })
    ],

    book_problems: [
        new Schema({
            _id: { type: String, required: true },
            problem_number: String,
            problem_text: String,
            given: { type: Schema.Types.Mixed },
            required: String,
            solution_steps: [String],
            final_answer: String,
            formula_used: String,
            diagram_required: { type: Boolean, default: false },
            marks: Number,
            difficulty: String,
            source_page: Number
        }, { _id: false })
    ],

    activities: [
        new Schema({
            _id: { type: String, required: true },
            title: String,
            activity_type: String,
            apparatus: [String],
            procedure_steps: [String],
            precautions: [String],
            expected_result: String,
            source_page: Number
        }, { _id: false })
    ],

    flashcards: [
        new Schema({
            _id: { type: String, required: true },
            front: String,
            back: String,
            cloze: String,
            difficulty: String,
            topic_id: String
        }, { _id: false })
    ]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('TopicAssessment', topicAssessmentSchema, 'topic_assessments');