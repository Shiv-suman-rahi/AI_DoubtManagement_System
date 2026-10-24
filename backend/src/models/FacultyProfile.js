import mongoose from 'mongoose';

const facultyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    academicTitle: {
      type: String,
      default: '',
      trim: true
    },
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    officeLocation: {
      type: String,
      default: ''
    },
    availableHours: {
      type: String,
      default: 'Mon-Fri 2:00 PM - 5:00 PM'
    },
    specializations: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

export const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
