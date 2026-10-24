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
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
      index: true
    },
    rollNumber: {
      type: String,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      unique: true,
      trim: true,
      maxlength: 40,
      index: true
    },
    branch: {
      type: String,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      trim: true
    },
    program: {
      type: String,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      trim: true
    },
    programRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    admissionYear: {
      type: Number,
      min: 1900,
      max: 2200
    },
    studyYear: {
      type: Number,
      min: 1,
      max: 12
    },
    semester: {
      type: Number,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      min: 1,
      max: 12
    },
    section: {
      type: String,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      trim: true,
      uppercase: true
    },
    academicYear: {
      type: String,
      required: function () {
        return this.academicProfileStatus === 'complete';
      },
      trim: true
    },
    academicProfileStatus: {
      type: String,
      enum: ['pending', 'complete'],
      default: 'complete',
      index: true
    },
    initialSelectionCompletedAt: {
      type: Date
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
