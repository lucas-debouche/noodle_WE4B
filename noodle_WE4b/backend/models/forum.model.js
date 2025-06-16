const mongoose = require('mongoose');
const { Schema } = mongoose;

const attachmentSchema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const replySchema = new Schema({
  userId: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isEdited: { type: Boolean, default: false },
  attachments: [attachmentSchema] // Fichiers attachés aux réponses
});

const messageSchema = new Schema({
  userId: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isEdited: { type: Boolean, default: false },
  replies: [replySchema],
  attachments: [attachmentSchema] // Fichiers attachés aux messages
});

const forumSchema = new Schema({
  ueId: { type: String, required: true },
  title: { type: String, required: true },
  creatorId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  messages: [messageSchema]
});

module.exports = mongoose.model('Forum', forumSchema);
