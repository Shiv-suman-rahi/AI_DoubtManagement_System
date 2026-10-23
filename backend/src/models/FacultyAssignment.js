import mongoose from 'mongoose';

const facultyAssignmentSchema = new mongoose.Schema(
  {
    faculty: {
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
    role: {
      type: String,
      enum: ['primary', 'co-faculty', 'ta'],
      default: 'primary'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'reassigned'],
      default: 'active',
      index: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// One active primary assignment per classSubject unless co-faculty
facultyAssignmentSchema.index({ faculty: 1, classSubject: 1 }, { unique: true });

export const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
