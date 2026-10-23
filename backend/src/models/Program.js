import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    durationYears: {
      type: Number,
      required: true,
      default: 4
    }
  },
  {
    timestamps: true
  }
);

export const Program = mongoose.model('Program', programSchema);
