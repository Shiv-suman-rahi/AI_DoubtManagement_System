import mongoose from 'mongoose';

const knowledgeBaseArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    questionSummary: {
      type: String,
      required: true,
      trim: true
    },
    approvedExplanation: {
      type: String,
      required: true,
      trim: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sourceAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer'
    },
    viewCount: {
      type: Number,
      default: 0
    },
    helpfulCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

knowledgeBaseArticleSchema.index({ subject: 1, topic: 1 });
knowledgeBaseArticleSchema.index({
  title: 'text',
  questionSummary: 'text',
  approvedExplanation: 'text',
  tags: 'text'
});

export const KnowledgeBaseArticle = mongoose.model(
  'KnowledgeBaseArticle',
  knowledgeBaseArticleSchema
);
