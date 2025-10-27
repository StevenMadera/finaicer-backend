import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true }, // Ejemplo: "2025-09"
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  topCategories: [
    {
      category: String,
      amount: Number
    }
  ]
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
