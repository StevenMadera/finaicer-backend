import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: String,
  createdAt: { type: Date, default: Date.now },
  settings: {
    language: { type: String, default: 'es' },
    currency: { type: String, default: 'COP' },
    notificationsEnabled: { type: Boolean, default: true }
  }
});

export default mongoose.model('User', UserSchema);
