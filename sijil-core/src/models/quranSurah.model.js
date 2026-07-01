import mongoose from 'mongoose';

const quranSurahSchema = new mongoose.Schema(
  {
    surah_number: {
      type: Number,
      required: true,
      min: 1,
      max: 114
    },
    name_arabic: {
      type: String,
      required: true
    },
    name_english: {
      type: String,
      required: true
    },
    name_urdu: {
      type: String,
      default: ''
    },
    name_transliteration: {
      type: String,
      default: ''
    },
    total_ayahs: {
      type: Number,
      required: true
    },
    revelation_type: {
      type: String,
      enum: ['Meccan', 'Medinan']
    },
    juz_start: {
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
    collection: 'quran_surahs'
  }
);

quranSurahSchema.index({ surah_number: 1 });

export default mongoose.model('QuranSurah', quranSurahSchema);
