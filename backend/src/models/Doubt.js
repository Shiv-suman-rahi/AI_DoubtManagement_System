import mongoose from 'mongoose';
import { DOUBT_STATUS, PRIVACY_MODE } from '../config/constants.js';

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'audio', 'document', 'code'],
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const codeSnippetSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      default: 'plaintext'
    },
    code: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const followUpSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isFaculty: {
      type: Boolean,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [attachmentSchema],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const doubtSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    classSubject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSubject',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    subtopic: {
      type: String,
      default: '',
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [attachmentSchema],
    codeSnippet: codeSnippetSchema,
    privacyMode: {
      type: String,
      enum: Object.values(PRIVACY_MODE),
      default: PRIVACY_MODE.NORMAL,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'ai_processed', 'assigned', 'failed'],
      default: 'pending',
      index: true
    },
    resolutionStatus: {
      type: String,
      enum: Object.values(DOUBT_STATUS),
      default: DOUBT_STATUS.PENDING,
      index: true
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtGroup',
      index: true
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    embedding: {
      type: [Number],
      select: false // Never return raw vector embeddings in standard queries
    },
    aiClassification: {
      detectedTopic: String,
      intent: String,
      confidence: Number,
      suggestedGroupKeywords: [String],
      processedAt: Date
    },
    aiDraftAnswer: {
      content: String,
      model: String,
      confidence: Number,
      generatedAt: Date
    },
    followUps: [followUpSchema],
    feedback: feedbackSchema,
    resolvedAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying & faculty queue lookups
doubtSchema.index({ classSubject: 1, resolutionStatus: 1, createdAt: -1 });
doubtSchema.index({ student: 1, createdAt: -1 });
doubtSchema.index({ assignedFaculty: 1, resolutionStatus: 1 });

/**
 * Strips anonymous student identity before returning to faculty or public views
 */
doubtSchema.methods.toFacultySafe = function () {
  const obj = this.toObject();
  delete obj.embedding;
  if (obj.privacyMode === PRIVACY_MODE.ANONYMOUS) {
    obj.student = {
      _id: 'anonymous',
      name: 'Anonymous Student',
      email: 'anonymous@hidden.edu',
      isAnonymous: true
    };
  }
  return obj;
};

export const Doubt = mongoose.model('Doubt', doubtSchema);
