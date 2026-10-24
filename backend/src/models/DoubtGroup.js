import mongoose from 'mongoose';
import { DOUBT_GROUP_STATUS } from '../config/constants.js';

const similarityMetadataSchema = new mongoose.Schema(
  {
    modelVersion: {
      type: String,
      default: 'local-tfidf-cosine-v1'
    },
    averageConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.85
    },
    matchingKeywords: [
      {
        type: String,
        trim: true
      }
    ],
    reasoning: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const doubtGroupSchema = new mongoose.Schema(
  {
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
    representativeTitle: {
      type: String,
      required: true,
      trim: true
    },
    representativeQuestion: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(DOUBT_GROUP_STATUS),
      default: DOUBT_GROUP_STATUS.ACTIVE,
      index: true
    },
    similarityMetadata: similarityMetadataSchema,
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sharedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer'
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

doubtGroupSchema.index({ classSubject: 1, status: 1, createdAt: -1 });

export const DoubtGroup = mongoose.model('DoubtGroup', doubtGroupSchema);
