const mongoose = require('mongoose');
const { Schema } = mongoose;
const messageSchema = new Schema({
  userId: { type: String }, // String pour être souple (ObjectId plus tard)
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const forumSchema = new Schema({
  ueId: { type: String, required: true }, // String pour supporter ueId = "1", "2", etc.
  title: { type: String, required: true },
  creatorId: { type: String },
  createdAt: { type: Date, default: Date.now },
  messages: [messageSchema]
});

module.exports = mongoose.model('Forum', forumSchema);
