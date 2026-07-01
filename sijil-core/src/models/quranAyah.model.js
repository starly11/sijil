import mongoose from 'mongoose';

const quranAyahSchema = new mongoose.Schema(
  {
    surah: {
      type: Number,
      required: true,
      min: 1,
      max: 114
    },
    ayah: {
      type: Number,
      required: true,
      min: 1
    },
    text_uthmani: {
      type: String,
      required: true
    },
    translation_ur: {
      type: String,
      default: ''
    },
    translation_en: {
      type: String,
      default: ''
    },
    juz: {
      type: Number
    },
    page: {
      type: Number
    },
    hizb: {
      type: Number
    },
    ruku: {
      type: Number
    },
    _seeded_at: {
      type: Date,
      default: Date.now
    },
    _source: {
      type: String,
      default: 'quran.com/api/v4'
    }
  },
  {
    timestamps: false, // No updatedAt
    collection: 'quran_ayahs'
  }
);

// Compound unique index on { surah, ayah }
quranAyahSchema.index({ surah: 1, ayah: 1 }, { unique: true });

export default mongoose.model('QuranAyah', quranAyahSchema);
