import mongoose from 'mongoose';

const classSubjectSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    },
    academicPeriod: {
      type: String,
      required: true,
      trim: true // e.g. "2025-2026 Sem 1"
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

classSubjectSchema.index({ classroom: 1, subject: 1, academicPeriod: 1 }, { unique: true });

export const ClassSubject = mongoose.model('ClassSubject', classSubjectSchema);
