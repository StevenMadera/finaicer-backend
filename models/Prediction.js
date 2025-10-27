import mongoose from 'mongoose';
const { Schema } = mongoose;

const PredictionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  predictionType: String,
  predictedAmount: Number,
  currency: { type: String, default: 'COP' },
  period: String,
  confidence: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Prediction', PredictionSchema);
