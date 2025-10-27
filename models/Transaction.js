import mongoose from 'mongoose';
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  source: String,
  rawMessage: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'COP' },
  type: { type: String, enum: ['ingreso','egreso','transferencia'], default: 'egreso' },
  category: String,
  date: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
  aiConfidence: { type: Number, default: 0 }
});

export default mongoose.model('Transaction', TransactionSchema);
