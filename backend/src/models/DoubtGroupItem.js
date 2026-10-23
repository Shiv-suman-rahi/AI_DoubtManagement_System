import mongoose from 'mongoose';

const doubtGroupItemSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtGroup',
      required: true,
      index: true
    },
    doubt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      required: true,
      index: true
    },
    matchConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.85
    },
    reviewStatus: {
      type: String,
      enum: ['auto_matched', 'faculty_confirmed', 'faculty_rejected', 'split_out'],
      default: 'auto_matched',
      index: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

doubtGroupItemSchema.index({ group: 1, doubt: 1 }, { unique: true });

export const DoubtGroupItem = mongoose.model('DoubtGroupItem', doubtGroupItemSchema);
