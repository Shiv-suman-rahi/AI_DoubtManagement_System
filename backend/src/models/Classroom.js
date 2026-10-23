import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    academicYear: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

classroomSchema.index(
  { program: 1, branch: 1, semester: 1, section: 1, academicYear: 1 },
  { unique: true }
);

export const Classroom = mongoose.model('Classroom', classroomSchema);
