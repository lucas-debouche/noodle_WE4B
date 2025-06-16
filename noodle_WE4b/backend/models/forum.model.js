const mongoose = require('mongoose');
const { Schema } = mongoose;

const replySchema = new Schema({
  userId: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isEdited: { type: Boolean, default: false }
});

const messageSchema = new Schema({
  userId: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isEdited: { type: Boolean, default: false },
  replies: [replySchema]
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
