import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    program: {
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
    enrollmentStatus: {
      type: String,
      enum: ['enrolled', 'graduated', 'suspended', 'withdrawn'],
      default: 'enrolled'
    },
    currentClassroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    }
  },
  {
    timestamps: true
  }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
