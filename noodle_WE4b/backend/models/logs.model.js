const mongoose = require('mongoose');
const { Schema } = mongoose;

const logSchema = new Schema({
  action: { type: String, required: true }, // ex: "create_forum", "assign_role", "update_password"
  userId: { type: String, required: true },
  category: { type: String, required: true }, // ex: "forum", "auth", "user", "post"
  targetId: { type: String }, // ex: forumId, userId concerné, postId...
  timestamp: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed }, // contenu contextuel
});

module.exports = mongoose.model('Log', logSchema);
