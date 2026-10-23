import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doubt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      index: true
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtGroup',
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [
      {
        url: String,
        fileType: String,
        originalName: String,
        sizeBytes: Number
      }
    ],
    visibilityScope: {
      type: String,
      enum: ['individual', 'group_students', 'all_class', 'knowledge_base'],
      default: 'individual'
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'published', 'rejected'],
      default: 'published',
      index: true
    },
    isAIGenerated: {
      type: Boolean,
      default: false
    },
    facultyApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Answer = mongoose.model('Answer', answerSchema);
