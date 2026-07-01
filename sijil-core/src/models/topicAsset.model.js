import mongoose from 'mongoose';
const { Schema } = mongoose;
/**
 * Stores complex spatial data arrays, vector source markup strings, and multidimensional matrix configurations.
 */
const topicAssetSchema = new Schema({
  _id: { type: String, required: true },
  topic_id: { type: String, required: true, index: true },
  document_id: { type: String, required: true, index: true },

  figures: [
    new Schema({
      _id: { type: String, required: true },
      figure_number: String,
      caption: String,
      alt: String,
      source_page: Number,
      image_url: { type: String, default: "" },
      image_path_local: String,
      render_strategy: { type: String, enum: ["image", "svg", "animation", "3d"], default: "image" },
      svg_code: { type: String, default: "" },
      animation_type: { type: String, default: "" },
      has_labels: { type: Boolean, default: false },
      label_descriptions: [String],
      unsplash_search_query: { type: String, default: "" },
      embedded_text_ocr: {
        _id: false,
        type: new Schema({ detected_languages: [String], extracted_strings: [String] })
      }
    }, { _id: false })
  ],

  tables: [
    new Schema({
      _id: { type: String, required: true },
      table_number: String,
      caption: String,
      headers: [String],
      rows: [[String]],
      source_page: Number,
      table_type: String,
      render_as: { type: String, enum: ["styled-table", "chart", "infographic"], default: "styled-table" }
    }, { _id: false })
  ]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('TopicAsset', topicAssetSchema, 'topic_assets');