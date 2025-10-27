import mongoose from 'mongoose';
const { Schema } = mongoose;

const AlertSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String,
  message: String,
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

export default mongoose.model('Alert', AlertSchema);
