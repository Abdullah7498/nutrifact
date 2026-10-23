import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    photoKey: { type: String, default: null },
    nutritionProfile: { type: mongoose.Schema.Types.Mixed, default: null },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);
