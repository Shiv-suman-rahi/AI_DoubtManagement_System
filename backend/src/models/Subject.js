import mongoose from 'mongoose';

const syllabusTopicSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true
    },
    subtopics: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { _id: true }
);

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    credits: {
      type: Number,
      default: 4
    },
    description: {
      type: String,
      default: ''
    },
    syllabus: [syllabusTopicSchema]
  },
  {
    timestamps: true
  }
);

export const Subject = mongoose.model('Subject', subjectSchema);
